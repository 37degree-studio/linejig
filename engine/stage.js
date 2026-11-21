/* Linejig stage: many figures on one page, one WebGL context. One THREE.WebGLRenderer draws into a canvas that is
   never shown; each plate gets its own 2D canvas inside its element, and after a figure renders its frame the stage
   copies it there. The copies live in the page, so they scroll, clip and stack with it on the compositor (no lag behind
   the scroll), and a plate that holds still keeps its last frame without drawing again.
   Frames are on demand: only plates on screen tick, and only one that moved (or was resized, or never drawn) renders.
   A figure's clock starts the first time its plate is on screen, so its intro plays there, once.
   Pixel ratio: min(devicePixelRatio, 2), lowered by 0.25 (to 1) while animated frames average over 24 ms, and put back
   (with one sharp redraw of the plates on screen) as soon as everything holds still, so a resting plate is never soft.

   import { createStage } from '../kernel/stage.js';
   import { mountFigure } from '../kernel/linejig.js';   // Brand and Dots plates load linejig-pro.js on demand
   import { create } from '../vintage-camera/figure.js';
   const stage = createStage();
   mountFigure(stage, plateElement, create(plateElement), 'style=dots&theme=dark');   // the plate element sets the size
   stage.setTheme('light'); stage.setStyle('brand'); stage.setBrand('#2f6bff'); stage.setGrid(true);   // every plate
   stage.onFirst(plateElement, () => ...);   // after that plate's first frame is on screen
   const fig = mountFigure(...); fig.setIntro('draw');   // another intro, replayed, with no remount
   stage.remove(plateElement);               // frees the plate: its listeners, observers, canvas, geometry, materials and loop

   A plate is any element with a size; it gets the class kl-plate, which carries the palette per data-theme and
   data-style, as linejig.css does on :root for a figure page. Content over a plate needs no background. */
import * as THREE from 'three';

const PALETTE = `
.kl-plate { --plate: #f7f7f8; --hi: #17171a; --edge: #6a6a72; --mid: #8f8f97; --lo: #b6b6bc;
  --accent-top: #f5821f; --accent-side: #e0560f; --accent-edge: #ffa45a; --accent-tint: #fef3ea; --accent-glow: #f5821f; --glow-alpha: 0.12; --label-hero: #ffffff;
  touch-action: pan-y; }
@media (prefers-color-scheme: dark) { .kl-plate:not([data-theme="light"]) { --plate: #111111; --hi: #e6eaf0; --edge: #a8aab1; --mid: #797b82; --lo: #4f5056;
  --accent-edge: #ffb36b; --accent-tint: #332213; --glow-alpha: 0.42; }
  .kl-plate[data-style="brand"]:not([data-theme="light"]) { --edge: #7c7c7c; --mid: #606060; --lo: #4a4a4a; } }
.kl-plate[data-theme="dark"] { --plate: #111111; --hi: #e6eaf0; --edge: #a8aab1; --mid: #797b82; --lo: #4f5056;
  --accent-edge: #ffb36b; --accent-tint: #332213; --glow-alpha: 0.42; }
.kl-plate[data-style="brand"][data-theme="dark"] { --edge: #7c7c7c; --mid: #606060; --lo: #4a4a4a; }
.kl-view { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; }`;

export function createStage({ dpr = Math.min(2, devicePixelRatio || 1) } = {}) {
  const style = document.createElement('style'); style.textContent = PALETTE; document.head.prepend(style);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(dpr); renderer.setScissorTest(true);
  const plates = new Map(), targets = { scene: null, cells: null };   // one offscreen pair for the dots pass, shared by every plate
  const SLOW = { n: 0, sum: 0, last: 0 };
  let raf = 0, frames = 0, GW = 1, GH = 1; const cost = [];   // ms of main thread per stage frame

  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };
  function size(p) {                                          // the plate's CSS size, its canvas in device px, the shared canvas over the largest
    p.w = p.el.clientWidth; p.h = p.el.clientHeight; p.dirty = true;
    if (p.w > GW || p.h > GH) { GW = Math.max(GW, p.w); GH = Math.max(GH, p.h); renderer.setSize(GW, GH, false); }
  }
  // one canvas pixel on one device pixel: a plate at a fractional position or size (a -20% inset of a 287.4 px tile)
  // would have the browser resample every hairline, which reads as blur; the canvas is nudged and sized to whole device px
  function snap(p, pr, cw, ch) {
    const r = p.el.getBoundingClientRect(), dx = (Math.round(r.left * pr) - r.left * pr) / pr, dy = (Math.round(r.top * pr) - r.top * pr) / pr;
    const st = `translate(${dx.toFixed(4)}px, ${dy.toFixed(4)}px)`, w = cw / pr + 'px', h = ch / pr + 'px';
    if (p.cv.style.transform !== st) p.cv.style.transform = st;
    if (p.cv.style.width !== w) { p.cv.style.width = w; p.cv.style.height = h; }
  }
  function frame(now) {
    raf = 0; frames++; const c0 = performance.now();
    let again = false;
    for (const p of plates.values()) {
      if (!p.on || !p.w || !p.h) continue;
      const moved = p.fig.tick();
      if (moved || p.dirty) {
        const vp = { x: 0, y: GH - p.h, w: p.w, h: p.h };      // the plate's frame at the top left of the shared canvas
        renderer.setViewport(vp.x, vp.y, vp.w, vp.h); renderer.setScissor(vp.x, vp.y, vp.w, vp.h);
        p.fig.draw(vp);
        const pr = renderer.getPixelRatio(), cw = Math.max(1, Math.round(p.w * pr)), ch = Math.max(1, Math.round(p.h * pr));
        if (p.cv.width !== cw || p.cv.height !== ch) { p.cv.width = cw; p.cv.height = ch; }   // sized only as it draws, so a plate off screen keeps its frame
        snap(p, pr, cw, ch);
        p.ctx.clearRect(0, 0, p.cv.width, p.cv.height);
        p.ctx.drawImage(renderer.domElement, 0, 0, p.cv.width, p.cv.height, 0, 0, p.cv.width, p.cv.height);
        p.dirty = false;
        if (!p.drawn) { p.drawn = true; p.cv.dataset.drawn = ''; for (const fn of p.first.splice(0)) fn(); }
      }
      again ||= p.fig.running;
    }
    cost.push(performance.now() - c0);
    slow(now, again);
    if (again) request();
    else if (renderer.getPixelRatio() < dpr) setRatio(dpr);   // settled: back to full resolution, one sharp frame
  }
  // the display's own frame period, timed while the stage is still idle, so a screen that runs at 30 Hz is not taken for slow frames
  let period = 1 / 60;
  { let n = 0, t0 = 0; const f = (t) => { if (!n) t0 = t; if (++n < 12) requestAnimationFrame(f); else period = (t - t0) / 11000; }; requestAnimationFrame(f); }
  function slow(now, again) {                                 // animated frames that average over 24 ms (and 1.5 periods): a lower pixel ratio
    const dt = SLOW.last ? (now - SLOW.last) / 1000 : 0; SLOW.last = again ? now : 0;
    if (!(dt > 0 && dt < 0.1) || renderer.getPixelRatio() <= 1) return;
    SLOW.n++; SLOW.sum += dt;
    if (SLOW.sum < 1) return;
    if (SLOW.sum / SLOW.n > Math.max(0.024, 1.5 * period)) setRatio(Math.max(1, renderer.getPixelRatio() - 0.25), true);
    SLOW.n = SLOW.sum = 0;
  }
  function setRatio(r, moving) {
    renderer.setPixelRatio(r); renderer.setSize(GW, GH, false); SLOW.n = SLOW.sum = 0;
    for (const p of plates.values()) size(p);                 // marks every plate dirty; the ones on screen redraw
    if (!moving) request();
  }
  // on screen: a plate that arrives may have a clock that ran while it was away, so it is woken to catch up
  const seen = new IntersectionObserver((es) => { for (const e of es) { const p = plates.get(e.target); if (!p) continue; p.on = e.isIntersecting; if (p.on) p.fig.wake(); } request(); });
  addEventListener('scroll', () => { for (const p of plates.values()) if (p.on && p.drawn) snap(p, renderer.getPixelRatio(), p.cv.width, p.cv.height); }, { passive: true });   // a fractional scroll moves the fraction
  // a settled plate re-reads its clock (peek) only while it is on screen and the page is visible; coming back wakes it
  document.addEventListener('visibilitychange', () => { if (document.hidden) return; for (const p of plates.values()) if (p.on) p.fig.wake(); request(); });
  const resized = new ResizeObserver((es) => { for (const e of es) { const p = plates.get(e.target); if (p) { size(p); p.fig.layout(); } } request(); });
  // plates off screen build their geometry while the page is idle, so arriving on screen costs no build
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  function add(fig) {
    const el = fig.el, cv = document.createElement('canvas');
    cv.className = 'kl-view'; cv.setAttribute('aria-hidden', 'true');
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.prepend(cv);
    const p = { fig, el, cv, ctx: cv.getContext('2d'), w: 0, h: 0, on: false, dirty: true, drawn: false, first: [] };
    plates.set(el, p); size(p); seen.observe(el); resized.observe(el); request(); idle(() => { if (plates.get(el) === p) fig.prebuild(); });
  }
  function remove(el) {
    const p = plates.get(el); if (!p) return false;
    plates.delete(el); seen.unobserve(el); resized.unobserve(el); p.first.length = 0; p.cv.remove(); p.fig.dispose();
    return true;
  }
  const each = (fn) => (v) => { for (const p of plates.values()) fn(p.fig, v); };
  return { renderer, targets, request, add, remove, cost, shown: (el) => !!plates.get(el)?.on, get frames() { return frames; }, get figs() { return [...plates.values()].map((p) => p.fig); },
    setTheme: each((f, v) => f.setTheme(v)), setStyle: each((f, v) => f.setStyle(v)), setBrand: each((f, v) => f.setBrand(v)), setGrid: each((f, v) => f.setGrid(v)),
    onFirst(el, fn) { const p = plates.get(el); if (!p) return; if (p.drawn) fn(); else p.first.push(fn); },
    drawn: (el) => !!plates.get(el)?.drawn };
}
