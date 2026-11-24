/* Linejig engine. Copyright 2026 Linejig. MIT licence, like every style file beside it. Everything a figure shares, so a
   figure file holds only its model, its ASSEMBLY table and its HERO handlers. three.js 0.160.0 with Line2 fat lines; the
   page needs the import map for 'three' and 'three/addons/'.

   import { createFigure } from '../kernel/linejig.js';   // outside the repo: https://linejig.com/kernel/linejig.js
   createFigure({
     id: 'my-figure',                         // posted with every action
     el: '#plate',                            // where the canvas goes (it covers the window; the plate is fitted inside)
     intros: ['stack', 'draw'],               // ?intro= picks one; the first is the default
     intro: 'none',                           // optional: the intro to open with (?intro= wins); 'none' (any figure): opens
                                              // finished and live, no intro played (?freeze=MS then counts from there)
     center: [x, y, z],                       // the world point the view turns about
     fit: { points: (K) => [[x, y, z], ...], width: 0.7, height: 0.86 },   // the most extreme pose, as fractions of the 400 x 320 plate
     ASSEMBLY: [{ name, parts, mountsOn, from, at?, hero? }, ...],   // the stack plan (motion.md); from: a vector or { side: vector }; hero: the hero's row
     stack: { travel, stagger: 160, inRow: 0 },               // world units out, ms between rows, ms between parts of a row
     release: 1200, liveAt: 2900,             // hero clock (ms, after the stack lands): its intro move starts; the hand turns on
                                              // (orbit works from the first frame; a hover on the hero or a press goes live at once, while the intro finishes assembling)
     state(K) => st,                          // the pose this frame, from K.t / K.ht / K.live / K.dt; step springs here
     key(st) => string,                       // optional: what forces a rebuild (default: every value of st)
     model(K, st),                            // draw every part, far first: K.layer(name), K.solid(...), K.add(...), K.hit(id, poly)
     place(K, bucket, st) => { off: [x, y, z], show, alpha },   // optional: move, hide or fade (alpha 0..1) a bucket without a rebuild
     HERO: { onHover(id, p), onLeave(id), onClick(id, p), action: 'compose', opened(st, K) },
     turntable: 'swing' | 'full',             // ?mode=turntable: 'swing' is +-35 degrees over 40 s, 'full' one turn in 40 s
     glow: false | 0..1,                      // optional: the style's hero glow off, or scaled (default 1; ?glow=0..1 wins)
     onLive(K), onReplay(K), onState(value, K) (a host's {type: 'state', value} message: a figure's own named state),
   });

   Drawing (K): K.P(x, y, z) projects to plate units; K.axes(o, U, V, W) is a frame; K.rrect / K.circ / K.box / K.turn
   make footprints (rings of { u, v, nu, nv }); K.solid(F, [ring, inner], w0, w1, silTone, creaseTone, o) is a prism with
   its silhouette and one crease (o: add's options, on both); K.add(fill, lines, tone, { dash, fine, at, drawn, fillTone }) adds a raw primitive.
   Tones: 'hi' 'edge' 'mid' 'lo'; a trailing '~' is the thin 0.5 px line. fine: shown only when the drawing is 320 px
   or wider. at: its draw-on start (ms). drawn: its fill appears as it starts drawing. fillTone: a filled dot.
   fillTone: 'ink' is the one fixed tone: near-black (--ink) in both themes, with a lighter edge on a dark plate
   (--ink-edge); every style honours it on any part, never in the brand colour, never the hero (a style may restyle it
   with ink(p) => { fill, top, line }).
   K.layer(name, { side, i, bucket }) files what follows under an ASSEMBLY row; bucket names a part that moves alone.
   Clocks: K.tween (700 ms, .32,.72,0,1), K.TW, K.inout, K.spring(x, m), K.step(sp, dt), K.springAt(x0, target, ms, m)
   (k 100, c 18). Hand: K.pointer (plate units), K.hover (hit id or null), K.onPlane(p, o, n), K.near(from, deg).
   Style: style: 'lineart' (default) | 'brand' | 'dots' | 'readout' | 'pencil' (aliases 'line', 'accent'); brand: { color: '#hex', color2? } (orange default).
   STYLE_NAMES lists the style ids; STYLES maps every name (aliases too) to its rules. Line art lives in this file.
   Every other style is an add-on, one file per style beside this file, MIT like it: Brand and Dots in linejig-pro.js,
   Readout in styles/readout.js, Pencil in styles/pencil.js (loadStyle(name) imports one); Block, styles/block.js, is
   still in the works and served only from linejig.com. A figure that asks for one (style
   option, ?style=, a style message, or a brand or dots option) imports it once, on demand; until it arrives the figure
   draws line art, and if it cannot load it stays in line art (one console warning). A page that imports linejig-pro.js
   itself has Brand and Dots at once. registerStyle(name, rules, aliases) adds a style; registerExtension(ext) adds the
   per-figure hooks a style needs beyond its rules (linejig-pro.js uses both).
   Dots: the drawing in a screen-space grid of dots (3.5 px cells by default, finer on a small object); the hero's dots take the brand colour; dots near the pointer
   swell. dots: { shape, cell, size, gap, contrast, threshold, angle, swell, radius, faces, jitter, heroOnly, tint, across }
   (DOTS, DOTS_RANGE, exported by linejig-pro.js). registerDotShape(name, glsl) (linejig-pro.js) adds a shape by name (GLSL
   that sets d; see DOT_SHAPES). tint: true draws every mark in the brand colour (full strength for edges, lighter on white
   or dimmer on black for detail and faces); across: about how many cells span the object when the cell adapts to its size (auto).
   Add-ons (one file per feature, beside this file, loaded only when used): shadow (addons/shadow.js) is asked for with
   shadow: true, ?shadow=1 or {type: 'shadow', value}; fitShadow: true also fits the plate round the shadow of the fit points
   along light (fig.light or LIGHT). An add-on registers an extension like a style and takes its option through option(k, v).
   Grid: grid: true draws a floor grid under the object that fades out by distance and turns with it (off by default).
   Accent fade: when a part gains or loses the hero or outline accent its colours and glow tween (220 ms in, 260 out),
   with no rebuild of its geometry; a style switch crossfades over 300 ms; reduced motion switches at once.
   Hooks: ?freeze=MS, ?reduced=1, ?theme=light|dark, ?intro=draw|stack|none, ?style=lineart|brand|dots|readout, ?brand=hex (&brand2=hex),
   ?embed=1, ?mode=turntable, ?grid=1|0, ?glow=0..1, ?dots=shape:square,cell:8, ?dpr=N (else min(devicePixelRatio, 2), lowered on slow frames),
   ?click=ID@MS (clicks hero member ID at MS, for capture of the click state and the action).
   Embed: in {type: 'replay' | 'reset' | 'theme' | 'intro' | 'mode' | 'style' | 'brand' | 'grid' | 'dots' | 'state', value} (dots: a partial
   settings object, merged; null resets), {type: 'pause' | 'resume'}, and {type: 'click', id?} (the hero's click as a pointer press would: id defaults to the
   hero; {type: 'intro', value: 'none'} jumps to the finished figure). Frames render only while something moves;
   the loop sleeps when still, wakes on input or a message, and pauses while the document is hidden. (brand: '#hex' or
   {color, color2}); out {type: 'ready', id, intros, styles, style, brand, action} (styles: every style id, the add-on ones
   loading on demand; a figure that opens in an add-on style sends it once that file has arrived, with style and dots
   set; dots is null while linejig-pro.js is not loaded), then {type: 'drawn', id} once, when the
   first frame with the figure in it has been drawn in its own style (a host can swap its poster for the live plate then), and
   {type: 'action', id, figure} when a hero with an action reaches its open state (standalone: a 'linejig:action'
   CustomEvent on window, detail { id, figure }). Keyboard: a figure with HERO.action, interactive and taking pointer
   events, makes its plate a button (tabindex 0, role button, aria-label "<name>, <action>": fig.name or the page title,
   HERO.label or the action; a page's own aria-label moves to aria-description): Tab focus shows the hero's hover and a
   2 px ink ring round the object, Enter or Space clicks it, Escape or blur leaves. Illustrations never draw text: the host page owns the words.
   Export (site/export/README.md): fig.seek(ms), fig.script([{ at, click }]), fig.duration({ hero }), fig.capture(opts),
   fig.png(opts), fig.vector(opts), fig.svg(opts) on the createFigure result, window.__linejig and a staged figure; embedded,
   {type: 'export', id, format: 'png' | 'bitmap' | 'svg' | 'vector' | 'duration' | 'script' | 'seek', opts} answers
   {type: 'export-result', id, ok, data}. An export renders offscreen and leaves the live view as it was.
   Scrub (scroll stories; motion.md, "Scrub"): fig.scrub(t, { open, split }) puts the figure at progress t in [0, 1]:
   0 to split (default 0.75) is the stack intro, parts arriving in order over its first 85%, the hero's own intro move
   settling over the rest; split to 1 is
   the hero's click, from rest to its opened state (open: false, or a hero with no opened state: the whole range is the
   intro). While scrubbing the figure plays no intro and no motion of its own, ignores reduced motion (the host owns the
   pace) and takes no hover; fig.scrub(null) gives it back to its own clock and replays. Embedded: {type: 'scrub', t,
   open?, split?} (t: null ends it); ?intro=scrub starts the page scrubbed at 0 with the stack intro. 'ready' carries scrub: true
   and click: true (the click message). */
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const RAD = Math.PI / 180, VW = 400, VH = 320, REST = { az: 45, el: 30 };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const near = (from, b) => from + ((((b - from) % 360) + 540) % 360 - 180);
const bez = (x1, y1, x2, y2) => { const B = (a, b, u) => 3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
  return (x) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (B(x1, x2, m) < x) lo = m; else hi = m; } return B(y1, y2, (lo + hi) / 2); }; };
const tween = bez(0.32, 0.72, 0, 1), inout = bez(0.65, 0, 0.35, 1), TW = 700, SPREAD = 500;
// memoized: a build asks for the same few fractions (j / n) thousands of times, and each solve costs 900 curve evaluations
const UNTWEEN = new Map(), untween = (f) => { let r = UNTWEEN.get(f); if (r !== undefined) return r;
  let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (tween(m) < f) lo = m; else hi = m; } UNTWEEN.set(f, r = (lo + hi) / 2); return r; };
const UNTN = new Map(), untweens = (n) => { let a = UNTN.get(n); if (!a) UNTN.set(n, a = Array.from({ length: n }, (_, j) => untween((j + 1) / n))); return a; };   // a line of n segments: each one's draw-on fraction

// ---------- footprints: rings of samples { u, v, nu, nv } (position and outward normal) ----------
function rrect(u0, v0, u1, v1, r, n = 6) {
  r = Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2); const out = [];
  for (const [cu, cv, a0] of [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]])
    for (let k = 0; k <= n; k++) { const a = (a0 + 90 * k / n) * RAD; out.push({ u: cu + r * Math.cos(a), v: cv + r * Math.sin(a), nu: Math.cos(a), nv: Math.sin(a) }); }
  return out;
}
const circ = (R, n = 120) => Array.from({ length: n }, (_, k) => { const a = 2 * Math.PI * k / n; return { u: R * Math.cos(a), v: R * Math.sin(a), nu: Math.cos(a), nv: Math.sin(a) }; });
const box = (u0, v0, u1, v1, r, b = 1.6, n = 6) => [rrect(u0, v0, u1, v1, r, n), rrect(u0 + b, v0 + b, u1 - b, v1 - b, Math.max(0.3, r - b), n)];
const turn = (ring, a) => { const c = Math.cos(a), s = Math.sin(a); return ring.map((q) => ({ u: q.u * c - q.v * s, v: q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c })); };
function run(ring, keep) {                                   // the one cyclic run of samples that pass keep
  const n = ring.length, s = ring.findIndex((q, i) => keep(q) && !keep(ring[(i + n - 1) % n]));
  if (s < 0) return keep(ring[0]) ? ring.slice() : [];
  const out = []; for (let k = 0; k < n && keep(ring[(s + k) % n]); k++) out.push(ring[(s + k) % n]); return out;
}
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up);
}
const inside = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [x1, y1] = poly[i], [x2, y2] = poly[j]; if ((y1 > pt[1]) !== (y2 > pt[1]) && pt[0] < (x2 - x1) * (pt[1] - y1) / (y2 - y1) + x1) c = !c; } return c; };

// ---------- styles: the look, swappable; a figure names one with style: 'lineart' (default) or ?style= ----------
// A style decides, per primitive p (p.tone, p.layer, p.hero), the fill tone and line tone, and whether the hero gets a
// glow, whether text may be drawn (labels), and how far the plate fades at its edges. Tones are CSS variables in
// linejig.css. p.hero is true for parts in an ASSEMBLY row marked hero: true, any 'hi' part, and any part added with { hero: true }.
// p.outline (the second accent level, at most one part: next, in flight or just passed) is a row marked outline: true
// or a part added with { accent: 'outline' }.
// fill(p): the tone of its fill; top(p): a second tone for the visible cap of a solid (two-tone shade), or null;
// dot(p): the tone of a filled dot; line(p): the tone of its lines ('~' keeps the thin width); label(p): a label's tone.
// glow: a soft halo behind each hero bucket (a figure's glow option scales it: X.glow); text: labels may be drawn; fade: plate-edge fade in px when there is context.
// ink (optional): ink(p) => { fill, top, line } restyles a part with fillTone 'ink' (p.ink; default: fill 'ink', line 'ink-edge').
// width (optional): { line, thin, scale } the style's two line widths in CSS px (line art: 1 and 0.5); scale: true reads them
// at a 400 px plate and scales them with the drawing. prims(list, kit) (optional): rewrites the primitive list in painter's
// order once per build (a solid's prism is on p.o.solid); kit: { P, at3, ringAt, DV, dot, hull, inside, faces, run }.
// References: styles.md. The rules for the look live here (and in linejig-pro.js), never in a figure file.
// lineart: white and black, no colour, no text. The old name line is an alias of the same object. Brand (alias accent)
// and Dots register themselves from linejig-pro.js.
const lineart = { fill: () => 'plate', top: () => null, dot: (p) => p.o.fillTone, line: (p) => p.tone, label: () => 'mid', glow: false, text: false, fade: 0 };
export const STYLES = { lineart, line: lineart };
export const STYLE_NAMES = ['lineart', 'brand', 'dots', 'readout', 'pencil', 'block'];   // the style ids (STYLES also holds the aliases); all but lineart load on demand
// the add-on styles: one file per style (Brand and Dots share linejig-pro.js), imported once, the first time a figure asks for it
const ADDON = (f) => ({ url: new URL(f, import.meta.url).href, p: null, ok: false, failed: false });
const PRO = ADDON('./linejig-pro.js'), FILES = { brand: PRO, accent: PRO, dots: PRO, readout: ADDON('./styles/readout.js'), pencil: ADDON('./styles/pencil.js'), block: ADDON('./styles/block.js') };
/** Adds a style by name (and its aliases): rules as above. A style with per-figure needs also registers an extension. */
export function registerStyle(name, rules, aliases = []) {
  for (const k of [name, ...aliases]) STYLES[k] = rules;
  if (!STYLE_NAMES.includes(name)) STYLE_NAMES.push(name);
  return name;
}
// extensions: { mount(X) => hooks } per figure; X is the figure's internal kit (mount(), "the extension kit"), hooks are
// called where a style needs more than its rules: brand(plate), paint(plate), tone(k), glowMesh(...), labelMesh(...), primMesh(p, z, N, t0),
// primLines(p, lines, z, N, startOf, TW) (a style draws a primitive's lines itself: meshes for its bucket; the engine then skips them),
// draw(vp), busy(), setDots(v), dots(), exportBegin(), exportEnd(), captureBegin(clear), built(), dispose(),
// trace() (true: P records each plate point's world point for this build, X.world(pt)), pose(t, whole, stk) (after each pose;
// a bucket group's world offset is g.userData.wo), option(k, v) (an add-on's option or message)
const EXTS = [], MOUNTS = new Set();
export function registerExtension(ext) { if (EXTS.includes(ext)) return; EXTS.push(ext); for (const attach of MOUNTS) attach(); }
/** Imports a style's add-on file once (resolved beside this file); resolves true once its styles are registered, false if it failed. */
export function loadStyle(name) {
  const F = FILES[name]; if (!F) return Promise.resolve(!!STYLES[name]);
  return F.p ||= import(F.url).then((m) => { m.install?.(CORE); F.ok = true; return true; },
    (e) => { F.failed = true; console.warn(`Linejig: the ${name} style (${F.url.split('/').pop()}) did not load, so this figure stays in line art.`, e); return false; });
}
// the feature add-ons, by option name: imported once, when a figure first turns one on
const ADDONS = { shadow: ADDON('./addons/shadow.js') };
export function loadAddon(name) {
  const F = ADDONS[name]; return F.p ||= import(F.url).then((m) => { m.install?.(CORE); return F.ok = true; }, (e) => { console.warn(`Linejig: the ${name} add-on did not load.`, e); return false; });
}
export const LIGHT = [0.47, 0.88, 1.5];                       // the default light: the world direction toward it, in front of the object, above and a little left, so shadows fall behind
/** Imports linejig-pro.js once (Brand and Dots). */
export const loadPro = () => loadStyle('brand');
const hex3 = (h) => { h = String(h || '').trim().replace(/^#/, ''); if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, (c) => c + c); return /^[0-9a-f]{6}$/i.test(h) ? '#' + h.toLowerCase() : null; };
// the small helpers a style file builds on, so it carries no copies of its own
export const STYLE_KIT = { clamp, hull, hex3, RAD, bez };
const CORE = { registerStyle, registerExtension, STYLES, STYLE_KIT };

export function createFigure(fig) { return mount(fig, null); }

/** Mounts a figure on a shared stage (stage.js) instead of its own renderer: def is what a page passes to createFigure,
    el the plate element that sizes it, takes its pointer events and carries its theme and style (data-theme, data-style).
    query holds what a page reads from its URL (style=dots&theme=dark ...). No embed messages, no window.__linejig.
    It returns the staged figure: replay, reset, setMode, setTheme, setStyle, setBrand, setGrid, setDots, setIntro(name)
    (another intro, replayed, no remount), click, pause, resume, hits, toClient, the export calls, and dispose(), which
    stage.remove(el) calls to free the plate. */
export function mountFigure(stage, el, def, query = '') { el.classList.add('kl-plate'); return mount({ ...def, el }, { stage, el, query }); }

function mount(fig, host) {
  const STAGED = !!host, Q = new URLSearchParams(STAGED ? host.query : location.search), root = STAGED ? host.el : document.documentElement;
  const AC = new AbortController(), on = (t, ev, fn, o) => t.addEventListener(ev, fn, { ...o, signal: AC.signal });   // every listener, so dispose() drops them all
  // HX: the hooks of each registered extension for this figure (linejig-pro.js: brand tones, glow, labels, dots); hook(k, ...)
  // calls them in turn and returns the first answer that is not undefined
  const HX = [], DQ = [], hook = (k, ...a) => { for (const h of HX) if (h[k]) { const r = h[k](...a); if (r !== undefined) return r; } };
  if (['light', 'dark'].includes(Q.get('theme'))) root.dataset.theme = Q.get('theme');
  // ?plate=<light hex>,<dark hex> (no #): the plate colour per theme, so an embed sits on its host's own surface
  const PL = /^([0-9a-f]{6}),([0-9a-f]{6})$/i.exec(STAGED ? '' : Q.get('plate') || '');
  if (PL) document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `:root { --plate: #${PL[1]}; }
    @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --plate: #${PL[2]}; } } :root[data-theme="dark"] { --plate: #${PL[2]}; }` }));
  const FREEZE0 = Q.has('freeze') ? +Q.get('freeze') : Infinity; let FREEZE = FREEZE0;   // intro none: counted from the settled intro
  let REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches || Q.get('reduced') === '1';   // let: an export runs with its own
  const EMBED = STAGED || Q.get('embed') === '1';                       // inside a scrolling page: only Ctrl+wheel or a pinch zooms
  if (EMBED) root.classList.add('embed');
  const INTROS = fig.intros || ['stack', 'draw'];   // stack is the default intro
  const IQ = Q.get('intro') || fig.intro;
  let INTRO = INTROS.includes(IQ) ? IQ : INTROS[0];
  // none: the figure opens finished, at its settled intro and live (any figure; 1: to set up on the next frame, 2: done)
  let NONE = IQ === 'none' ? 1 : 0;
  // scrub: a host drives the progress (fig.scrub, below); ?intro=scrub starts scrubbed, on the stack intro
  const SCRUB = { active: false, url: Q.get('intro') === 'scrub', t: 0, open: true, split: 0.75, marks: null, intro: INTRO };
  if (SCRUB.url && INTROS.includes('stack')) INTRO = 'stack';
  let MODE = Q.get('mode') === 'turntable' ? 'turntable' : 'interactive';
  const ASSEMBLY = fig.ASSEMBLY || [{ name: 'all', from: [0, 0, 1] }];
  const STK = { travel: 20, stagger: 160, inRow: 0, ...(fig.stack || {}) };
  const RELEASE = fig.release ?? 1200, LIVE_AT = fig.liveAt ?? 2900, HERO = fig.HERO || {};
  const GLOWK = ((v) => v === false ? 0 : Number.isFinite(+v) ? clamp(+v) : 1)(Q.has('glow') ? Q.get('glow') : fig.glow ?? 1);   // the style's glow, scaled
  let STYLE, WANT = null;                                      // WANT: an add-on style asked for before its file arrived
  const setStyle = (s) => { STYLE = (typeof s === 'object' && s) || STYLES[s] || STYLES.lineart; root.dataset.style = STYLE_NAMES.find((k) => STYLES[k] === STYLE) || 'custom'; };
  const isPro = (s) => typeof s === 'string' && !STYLES[s] && !!FILES[s];   // an add-on style, not loaded yet
  const S0 = STYLES[Q.get('style')] || FILES[Q.get('style')] ? Q.get('style') : fig.style || 'lineart';   // lineart is the default
  setStyle(isPro(S0) ? 'lineart' : S0); if (isPro(S0)) useStyle(S0);   // line art until the style's file is in
  if (fig.brand || fig.dots) loadPro();
  for (const k in ADDONS) if (Q.has(k) ? Q.get(k) === '1' : fig[k]) loadAddon(k);
  // the brand colour: brand: { color, color2 }, ?brand=hex (or %23hex), or a {type: 'brand', value} message
  const BR = { color: hex3(fig.brand?.color) || '#f5821f', color2: hex3(fig.brand?.color2) };
  const setBrand = (v) => { const o = typeof v === 'object' && v ? v : { color: v }; const c = hex3(o.color); if (!c) return false;
    BR.color = c; BR.color2 = hex3(o.color2); return true; };
  if (Q.has('brand')) setBrand({ color: Q.get('brand'), color2: Q.get('brand2') });
  const CS = getComputedStyle(root);                          // live: one object, read whenever a tone is needed
  const sheet = () => CS.getPropertyValue('--plate').trim();
  if (!STAGED && !sheet()) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('./linejig.css', import.meta.url); l.onload = () => { paint(); built = ''; wake(); }; document.head.appendChild(l); }

  // ---------- the camera: orthographic axonometric, rest at azimuth 45, sin(elevation) 0.5; world z up ----------
  let S = 1, OX = 0, OY = 0, cs, sn, KE, ZF, DV = [0, 0, 1], W = 1, H = 1, PW = 1, CW = VW, CH = VH, FINE = true;
  const setView = (az, el) => { const a = az * RAD, e = el * RAD; cs = Math.cos(a); sn = Math.sin(a); KE = Math.sin(e); ZF = Math.cos(e); DV = [sn * ZF, cs * ZF, KE]; };
  setView(REST.az, REST.el);
  let P3 = null;                                              // trace: plate point -> world point, for one build
  const P = (x, y, z) => { const X = x * cs - y * sn, Y = x * sn + y * cs, r = [OX + S * X, OY + S * (Y * KE - z * ZF)]; P3?.set(r, [x, y, z]); return r; };
  const axes = (o, U = [1, 0, 0], V = [0, 1, 0], Wd = [0, 0, 1]) => ({ o, U, V, W: Wd });
  const at3 = (F, u, v, w) => [0, 1, 2].map((i) => F.o[i] + u * F.U[i] + v * F.V[i] + w * F.W[i]);
  const world = (F, ring, w) => ring.map((q) => at3(F, q.u, q.v, w));
  const ringAt = (F, ring, w) => ring.map((q) => P(...at3(F, q.u, q.v, w)));
  const faces = (F) => (q) => dot([0, 1, 2].map((i) => q.nu * F.U[i] + q.nv * F.V[i]), DV) >= -1e-6;   // a sample facing the viewer
  const FZ = axes([0, 0, 0]);
  const onPlane = (p, o, n) => {                             // the world point under plate point p on the plane (o, n)
    const X = (p[0] - OX) / S, Y = (p[1] - OY) / S / KE, a = [X * cs + Y * sn, -X * sn + Y * cs, 0];
    const s = dot(n, [o[0] - a[0], o[1] - a[1], o[2] - a[2]]) / dot(n, DV); return [a[0] + s * DV[0], a[1] + s * DV[1], a[2] + s * DV[2]];
  };
  const shiftOf = (v) => { const a = P(0, 0, 0), b = P(...v); return [b[0] - a[0], a[1] - b[1]]; };   // a world vector as three.js x, y

  // ---------- primitives, in painter's order, each filed under an ASSEMBLY row ----------
  let prims = [], hits = [], CUR = { layer: 0, i: 0, bucket: 'static', from: ASSEMBLY[0].from };
  function layer(name, o = {}) {
    if (typeof o === 'string') o = { side: o };
    const k = Math.max(0, ASSEMBLY.findIndex((r) => r.name === name)), f = ASSEMBLY[k].from;
    CUR = { layer: k, i: o.i || 0, bucket: o.bucket || 'static', from: o.side ? f[o.side] : f };
  }
  const within = (name, fn, o) => { const c = CUR; layer(name, o); fn(); CUR = c; };
  const add = (fill, lines, tone, o = {}) => prims.push({ fill, lines, tone, o, ...CUR });
  function solid(F, [ring, inner], w0, w1, silTone = 'edge', creaseTone = 'mid', o = {}) {
    const sil = hull(ringAt(F, ring, w0).concat(ringAt(F, ring, w1)));
    add(sil, [{ pts: sil, closed: true }], silTone, { ...o, top: ringAt(F, ring, dot(F.W, DV) >= 0 ? w1 : w0), solid: { F, ring, w0, w1 } });   // top: the visible cap, for two-tone styles; solid: the prism, for a style extension (primMesh)
    if (inner) add(null, [{ pts: ringAt(F, run(inner, faces(F)), dot(F.W, DV) >= 0 ? w1 : w0) }], creaseTone, o);
    return sil;
  }
  const hit = (id, poly) => hits.push({ id, poly, layer: CUR.layer });
  // a label engraved flat on a face plane: the frame F's (u, v) plane at w, centred on (u, v), size in world units tall;
  // it reads along +U with its top toward -V (upright on screen for a ground frame).
  // Drawn only by a style that allows text (never 'line': Hairline illustrations carry no text).
  const label = (F, text, u, v, w, o = {}) => { if (STYLE.text) prims.push({ fill: null, lines: [], tone: 'edge', o: { label: { F, text, u, v, w, size: o.size || 4 }, ...('hero' in o ? { hero: o.hero } : {}) }, ...CUR }); };   // o.hero: the label follows its part's lit state
  // ---------- line icons: tiny glyphs as polylines in a unit square (-1..1), for tiles and part tops ----------
  const arc = (cx, cy, r, a0, a1, n = 16) => Array.from({ length: n + 1 }, (_, k) => { const a = (a0 + (a1 - a0) * k / n) * RAD; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  const ICONS = {
    chip: [[[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6], [-0.6, -0.6]], [[-0.25, -0.25], [0.25, -0.25], [0.25, 0.25], [-0.25, 0.25], [-0.25, -0.25]],
      ...[-0.3, 0, 0.3].flatMap((q) => [[[q, 0.6], [q, 0.9]], [[q, -0.6], [q, -0.9]], [[0.6, q], [0.9, q]], [[-0.6, q], [-0.9, q]]])],
    file: [[[-0.6, -0.9], [0.6, -0.9], [0.6, 0.45], [0.15, 0.9], [-0.6, 0.9], [-0.6, -0.9]], [[0.15, 0.9], [0.15, 0.45], [0.6, 0.45]], [[-0.35, 0], [0.35, 0]], [[-0.35, -0.4], [0.35, -0.4]]],
    video: [[[-0.9, -0.6], [0.9, -0.6], [0.9, 0.6], [-0.9, 0.6], [-0.9, -0.6]], [[-0.2, -0.3], [-0.2, 0.3], [0.3, 0], [-0.2, -0.3]]],
    globe: [arc(0, 0, 0.9, 0, 360, 32), [[-0.9, 0], [0.9, 0]], arc(0, 0, 0.9, -90, 90, 16).map(([x, y]) => [x * 0.45, y]), arc(0, 0, 0.9, 90, 270, 16).map(([x, y]) => [x * 0.45, y])],
    check: [[[-0.7, 0], [-0.2, -0.5], [0.75, 0.55]]],
  };
  // an icon on the face plane of frame F at (u, v, w), r world units from centre to edge; only where text is allowed
  const icon = (F, name, u, v, w, r = 4, tone = 'mid', o = {}) => { if (!STYLE.text || !ICONS[name]) return;
    add(null, ICONS[name].map((pl) => ({ pts: pl.map(([a, b]) => P(...at3(F, u + a * r, v + b * r, w))) })), tone, o); };

  // ---------- context: the object in its system (styles.md); kernel helpers, also driven by a figure's context list ----------
  // K.context.rail({ axis: 'x' | 'y', at: [x, y], z, length, width, tiles: [{ s, icon, label, accent }], size, height, pass })
  //   two parallel ground lines along one world axis; tiles at position s along it (a rounded block, two inset top
  //   rings, a centred icon and an optional label). pass: 'back' or 'front' draws only the tiles behind or in front of
  //   the rail's centre, so a figure can call it before and after its model. accent: 'outline' for the next tile in.
  // K.context.base({ x0, y0, x1, y1, z0, z1, ticks }): a wide thin base plate with seam ticks on its visible sides.
  // K.context.footprint({ x0, y0, x1, y1, z, pad }): a dashed outline on the ground just outside the base.
  const CX = {
    rail(c) {
      const ax = c.axis === 'y' ? [0, 1] : [1, 0], nx = [-ax[1], ax[0]], [cx, cy] = c.at || [0, 0], z = c.z ?? 0, L = c.length ?? 600, wd = c.width ?? 40;
      const pt = (s, n) => [cx + ax[0] * s + nx[0] * n, cy + ax[1] * s + nx[1] * n];
      if (c.pass !== 'front') for (const n of [-wd / 2, wd / 2]) add(null, [{ pts: [P(...pt(-L / 2, n), z), P(...pt(L / 2, n), z)] }], 'lo');
      const depth = (s) => dot([ax[0] * s, ax[1] * s, 0], DV);
      for (const t of c.tiles || []) {
        if (c.pass && (c.pass === 'front') !== depth(t.s) > 0) continue;
        const sz = (t.size ?? c.size ?? 30) / 2, h = t.height ?? c.height ?? 6, [u, v] = pt(t.s, 0), F = axes([u, v, z]), o = t.accent ? { accent: t.accent } : {};
        const sil = hull(ringAt(F, rrect(-sz, -sz, sz, sz, sz * 0.3), 0).concat(ringAt(F, rrect(-sz, -sz, sz, sz, sz * 0.3), h)));
        add(sil, [{ pts: sil, closed: true }], 'edge', { ...o, top: ringAt(F, rrect(-sz, -sz, sz, sz, sz * 0.3), h) });
        for (const k of [0.12, 0.26]) add(null, [{ pts: ringAt(F, rrect(-sz * (1 - k), -sz * (1 - k), sz * (1 - k), sz * (1 - k), sz * (0.3 - k / 2)), h), closed: true }], 'lo', o);
        if (t.icon) icon(F, t.icon, 0, t.label ? -sz * 0.12 : 0, h, sz * 0.3, 'mid', o);
        if (t.label) label(F, t.label, 0, sz * 0.42, h, { size: sz * 0.22 });
      }
    },
    base(c) {
      const F = axes([0, 0, 0]), r = rrect(c.x0, c.y0, c.x1, c.y1, c.r ?? 4), z0 = c.z0 ?? 0, z1 = c.z1 ?? 3;
      solid(F, [r, null], z0, z1, 'edge', 'lo');
      const n = c.ticks ?? 12;
      for (const [a, b] of [[[c.x0, c.y1], [c.x1, c.y1]], [[c.x1, c.y0], [c.x1, c.y1]]]) {   // the two sides toward the viewer
        const nrm = a[0] === b[0] ? [1, 0, 0] : [0, 1, 0]; if (dot(nrm, DV) <= 0) continue;
        for (let k = 1; k < n; k++) { const q = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n];
          add(null, [{ pts: [P(q[0], q[1], z0 + (z1 - z0) * 0.25), P(q[0], q[1], z1 - (z1 - z0) * 0.25)] }], 'lo'); }
      }
    },
    footprint(c) { const pad = c.pad ?? 8, z = c.z ?? 0;
      add(null, [{ pts: ringAt(FZ, rrect(c.x0 - pad, c.y0 - pad, c.x1 + pad, c.y1 + pad, pad + (c.r ?? 4)), z), closed: true }], 'lo', { dash: true }); },
  };
  // a figure's declarative context list: [{ type: 'rail' | 'base' | 'footprint', ...options }]; drawn before its model,
  // except rail tiles in front of the rail's centre, which are drawn after it
  const context = (pass) => { for (const c of fig.context || []) { if (c.type === 'rail') CX.rail({ ...c, pass }); else if (pass === 'back') CX[c.type]?.(c); } };


  // ---------- clocks: the tween and the spring (k 100, c 18, mass m) ----------
  const spring = (x, m = 1) => ({ x, v: 0, t: x, m });
  function step(sp, dt) {
    if (REDUCED) { sp.x = sp.t; sp.v = 0; return; }           // reduced motion: things go where they are put
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) { sp.v += (-100 * (sp.x - sp.t) - 18 * sp.v) / sp.m * h; sp.x += sp.v * h; }
  }
  function springAt(x, target, ms, m = 1, cap = 4000) {        // integrated from a start, so ?freeze is deterministic
    const g = typeof target === 'function' ? target : () => target; let v = 0; const h = 1 / 240;
    for (let i = 0; i < Math.min(Math.max(0, ms), cap) / 1000 / h; i++) { v += (-100 * (x - g(i * h * 1000)) - 18 * v) / m * h; x += v * h; }
    return x;
  }

  // ---------- the kit a figure draws and moves with ----------
  const K = { THREE, Q, RAD, VW, VH, REST, REDUCED, FREEZE, EMBED, P, axes, at3, world, ringAt, faces, FZ, onPlane, rrect, circ, box, turn, run, hull, inside,
    dot, clamp, near, bez, tween, inout, TW, layer, within, add, solid, hit, label, icon, ICONS, context: CX, spring, step, springAt,
    t: 0, ht: 0, dt: 0, now: 0, live: false, builds: 0, pointer: null, hover: null, intro: INTRO, get DV() { return DV; }, get S() { return S; } };

  // ---------- fit: the most extreme pose at the given share of the plate, centred ----------
  const CTR = fig.center || [0, 0, 0];
  const fitPts = (K) => { const p = fig.fit.points(K), l = fig.light || LIGHT;   // fitShadow: with the fit points' shadows on the ground
    return fig.fitShadow ? p.concat(p.map((q) => [q[0] - l[0] * q[2] / l[2], q[1] - l[1] * q[2] / l[2], 0])) : p; };
  const fitBox = () => { const ps = fitPts(K).map((q) => P(...q)), xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]);
    return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]; };
  let [x0, x1, y0, y1] = fitBox();
  S = Math.min((fig.fit.width ?? 0.7) * VW / (x1 - x0), (fig.fit.height ?? Infinity) * VH / (y1 - y0));
  [x0, x1, y0, y1] = fitBox(); OX = VW / 2 - (x0 + x1) / 2; OY = VH / 2 - (y0 + y1) / 2;
  const ANCHOR = P(...CTR), FITW = x1 - x0;                   // the object's fitted width, plate units
  const aim = () => { OX = OY = 0; const c = P(...CTR); OX = ANCHOR[0] - c[0]; OY = ANCHOR[1] - c[1]; };   // centred as it turns

  // ---------- three.js: depth slots give the painter's order; one hairline width; tone is the only hierarchy ----------
  let renderer = STAGED ? host.stage.renderer : new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: FREEZE !== Infinity });   // frozen frames survive capture
  // ?dpr= fixes the pixel ratio; otherwise min(devicePixelRatio, 2), dropped by 0.25 (to 1) while frames average over 24 ms
  const DPR = { v: Q.has('dpr') && +Q.get('dpr') > 0 ? clamp(+Q.get('dpr'), 0.5, 3) : Math.min(2, devicePixelRatio || 1), fixed: Q.has('dpr'), n: 0, sum: 0 };
  if (STAGED) DPR.fixed = true; else { renderer.setPixelRatio(DPR.v); renderer.setClearColor(0, 0); }
  const canvas = STAGED ? host.el : renderer.domElement;     // staged: the plate element takes the pointer and the cursor
  if (!STAGED) (typeof fig.el === 'string' || !fig.el ? document.querySelector(fig.el || '#plate') : fig.el).appendChild(canvas);
  const scene = new THREE.Scene(), body = new THREE.Group(); scene.add(body);
  const cam = new THREE.OrthographicCamera(0, VW, 0, -VH, -10, 10);
  const css = (k) => CS.getPropertyValue('--' + k).trim() || '#888';
  const tone = (k) => hook('tone', k) ?? css(k);              // a style's extension may draw a tone in its own code (dots)
  const gradMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 });
  // EXTRA: materials an extension put in the scene (glows, labels): recoloured by userData.tone, faded by userData.fk
  const fills = {}, mats = {}, EXTRA = new Set();
  const fillMat = (t = 'plate') => fills[t] || (fills[t] = Object.assign(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }), { userData: { tone: t } }));
  // a style's line widths (style.width); LWK: the drawing's scale for a style whose widths scale with it (widths())
  let LWK = 1; const lw = (thin) => (thin ? STYLE.width?.thin ?? 0.5 : STYLE.width?.line ?? 1) * (STYLE.width?.scale ? LWK : 1);
  const lineMat = (t, dash) => { const key = t + (dash ? '-' : '');
    if (!mats[key]) { const thin = t.endsWith('~'), m = new LineMaterial({ linewidth: lw(thin), worldUnits: false, dashed: !!dash });
      m.userData = { tone: t.replace('~', ''), dash: !!dash, thin }; m.resolution.set(W, H); m.color.set(tone(m.userData.tone)); mats[key] = m; }
    return mats[key]; };
  // ---------- the accent fade: per part, a hero amount h and an outline amount o (0..1) on a sine in-out, 220 ms in, 260 out ----------
  // A part is one ASSEMBLY row, index and bucket (a label: its text). While a part fades, its fills, caps, lines, label
  // and glow get their own materials, coloured each frame as grey -> outline (by o) -> hero (by h); geometry is untouched.
  const FADE = new Map(), ANIM = new Set(), PM = new Map(), TC = new Map(), FIN = 220, FOUT = 260;
  const chan = (x) => ({ from: x, to: x, t0: -1e9 });
  const chanEnd = (c) => c.t0 + (c.to > c.from ? FIN : FOUT);
  const sine = bez(0.37, 0, 0.63, 1);                        // sine in-out: an even crossfade, both ends soft
  const chanAt = (c, t) => t >= chanEnd(c) ? c.to : c.from + (c.to - c.from) * sine(clamp((t - c.t0) / (chanEnd(c) - c.t0)));
  const retarget = (c, to, t) => { if (c.to === to && t >= chanEnd(c)) return; c.from = REDUCED ? to : chanAt(c, t); c.to = to; c.t0 = t; };
  const tc = (k) => { k = k.replace('~', ''); if (!TC.has(k)) TC.set(k, new THREE.Color(tone(k))); return TC.get(k); };
  const parseSpec = (s) => { const [k, g, o, h] = s.slice(1).split('^'); return { k, g, o, h }; };
  let CLEAR = '#000';
  function tint(m) {                                         // userData.tint: a material that fades its own way (a glow's strength)
    const f = m.userData.fk, F = FADE.get(f.k), aH = F ? chanAt(F.h, K.t) : 0, aO = F ? chanAt(F.o, K.t) : 0;
    if (m.userData.tint) m.userData.tint(m, aO, aH);
    else m.color.copy(tc(f.g)).lerp(tc(f.o), aO).lerp(tc(f.h), aH);
  }
  const partMat = (key, s, make) => { let e = PM.get(key); if (!e) { const m = make(); m.userData.fk = parseSpec(s); PM.set(key, e = { m }); } e.used = true; tint(e.m); return e.m; };
  const fillFor = (t) => t[0] !== '@' ? fillMat(t) : partMat(t, t, () => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }));
  const lineFor = (t, dash) => t[0] !== '@' ? lineMat(t, dash) : partMat(t + (dash ? '-' : ''), t, () => {
    const thin = parseSpec(t).g.endsWith('~'), m = new LineMaterial({ linewidth: lw(thin), worldUnits: false, dashed: !!dash }); m.resolution.set(W, H); m.userData.dash = !!dash; m.userData.thin = thin; return m; });
  const widths = (k = LWK) => { LWK = k; for (const m of lineMats()) if (m !== GRID.mat) m.linewidth = lw(!!m.userData.thin); };
  const lineMats = function* () { yield* Object.values(mats); yield GRID.mat; for (const e of PM.values()) if (e.m.isLineMaterial) yield e.m; };
  // ---------- the floor grid: 0.5 px lines in lo on the ground (z 0) under the object, fading out by distance ----------
  // Off by default (grid: true, ?grid=1|0, {type: 'grid', value}). About 2.2 times the object's footprint, cells about an
  // eighth of it on a 1-2-5 step; each line is cut short so its colour can fall to the plate's, which reads as alpha on
  // the opaque plate. Drawn first and deepest, so the object's fills hide it. It fades in over GRID_IN ms before the intro.
  const GRID = { on: Q.has('grid') ? Q.get('grid') === '1' : !!fig.grid, mat: new LineMaterial({ linewidth: 0.5, worldUnits: false, vertexColors: true, transparent: true }), g: null };
  const GRID_IN = 400, nice = (x) => { const e = 10 ** Math.floor(Math.log10(x)), m = x / e; return e * (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10); };
  function gridBuild() {                                      // only when the view, the style or the tones it is drawn in change
    const key = GRID.on ? [cs, sn, KE, ZF, S, OX, OY, !!STYLE.dots, tone('lo'), tone('plate')].join('/') : '';
    if (GRID.g && GRID.g.userData.key === key) return;
    if (GRID.g) { GRID.g.geometry.dispose(); body.remove(GRID.g); GRID.g = null; }
    if (!GRID.on) return;
    const ps = fig.fit.points(K), xs = ps.map((q) => q[0]), ys = ps.map((q) => q[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, F = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    const c = nice(F / 8), n = Math.ceil(1.1 * F / c), R = n * c, x0 = Math.round(cx / c) * c, y0 = Math.round(cy / c) * c, seg = c / 4;
    const lo = new THREE.Color(tone('lo')).multiplyScalar(STYLE.dots ? 0.7 : 1), pl = new THREE.Color(tone('plate'));
    const fadeAt = (u, v) => { const [px, py] = P(x0 + u, y0 + v, 0), e = Math.max(Math.abs(px - VW / 2) / (VW / 2), Math.abs(py - VH / 2) / (VH / 2));
      return (1 - THREE.MathUtils.smoothstep(Math.hypot(u, v), 0.3 * R, R)) * (1 - THREE.MathUtils.smoothstep(e, 0.7, 0.95)); };
    const pos = [], col = [], put = (u, v, a) => { const [px, py] = P(x0 + u, y0 + v, 0); pos.push(px, -py, -9.6); const k = pl.clone().lerp(lo, a); col.push(k.r, k.g, k.b); };
    for (let k = -n; k <= n; k++) for (let s0 = -R; s0 < R - 1e-9; s0 += seg) for (const flip of [0, 1]) {
      const a0 = fadeAt(...(flip ? [k * c, s0] : [s0, k * c])), a1 = fadeAt(...(flip ? [k * c, s0 + seg] : [s0 + seg, k * c]));
      if (a0 < 0.01 && a1 < 0.01) continue;
      if (flip) { put(k * c, s0, a0); put(k * c, s0 + seg, a1); } else { put(s0, k * c, a0); put(s0 + seg, k * c, a1); }
    }
    const geo = new LineSegmentsGeometry(); geo.setPositions(pos); geo.setColors(col);
    GRID.g = new LineSegments2(geo, GRID.mat); GRID.g.frustumCulled = false; GRID.g.userData.key = key; body.add(GRID.g);
  }
  function paint() {
    const pl = '#' + new THREE.Color(css('plate')).getHexString();
    hook('brand', pl);                                        // the brand tones, written as CSS variables (linejig-pro.js)
    TC.clear();
    for (const m of [...Object.values(fills), ...Object.values(mats)]) m.color.set(tone(m.userData.tone));
    widths();
    for (const m of EXTRA) if (m.userData.tone) m.color.set(tone(m.userData.tone));
    CLEAR = tone('plate'); if (!STAGED) renderer.setClearColor(CLEAR, 1);   // opaque on the plate colour, so the overlay layer of the glow has a base to work on
    hook('paint', pl);
    for (const m of EXTRA) if (m.userData.fk) tint(m);
    for (const e of PM.values()) tint(e.m);
  }
  // staged: the stage has set the viewport and scissor to this plate (vp, CSS px from the canvas's bottom left)
  function draw(vp) {
    if (STAGED && !EXP.on) renderer.setClearColor(CLEAR, 1);
    if (!hook('draw', vp)) renderer.render(scene, cam);      // a style may draw in passes of its own (dots)
    drawn();
  }
  // embedded: {type: 'drawn'} to the host once, after 'ready', when the first frame with the figure built in it is drawn
  let DRAWN = STAGED;
  function drawn() { if (DRAWN || EXP.on || !groups.length || WANT) return; DRAWN = true; if (parent !== window) parent.postMessage({ type: 'drawn', id: fig.id }, '*'); }
  // a bucket's opacity (place() returns alpha): below 1, each of its meshes and lines draws with its own transparent
  // copy of its shared material, recoloured from it each frame, and its glow is scaled; at 1 the shared ones come back
  function fadeGroup(g, a) {
    g.userData.faded = a < 1;
    g.traverse((o) => {
      if (!o.material) return;
      if (o.userData.fade) { o.userData.fade(o, a); return; }   // a mesh that fades its own way (a glow)
      if (a >= 1) { if (o.userData.src) o.material = o.userData.src; return; }
      const s = o.userData.src || (o.userData.src = o.material), m = o.userData.fadeMat || (o.userData.fadeMat = s.clone());
      m.color.copy(s.color); m.opacity = a; m.transparent = true;
      if (m.isLineMaterial) { m.resolution.copy(s.resolution); m.linewidth = s.linewidth; m.dashSize = s.dashSize; m.gapSize = s.gapSize; }
      o.material = m;
    });
  }
  // ---------- the stack: row k, part i appears travel units out along its from vector and seats on the tween ----------
  const ST0 = 100, rowAt = (k) => ASSEMBLY[k].at ?? k * STK.stagger;
  const STACK_END = ST0 + Math.max(...ASSEMBLY.map((_, k) => rowAt(k))) + TW;
  const layerE = (k, i, t) => { const u = (t - ST0 - rowAt(k) - i * STK.inRow) / TW; return u < 0 ? -1 : tween(Math.min(1, u)); };   // -1: not yet in
  const shift = () => INTRO === 'stack' && !REDUCED ? Math.max(0, STACK_END + 100 - RELEASE) : 0;   // delays the hero's own intro

  // ---------- build: one group per bucket (per part while stacking): fills by tone, time-sorted line segments ----------
  let paths = [], groups = [], objHull = [];
  const tris = (f, z, out) => { const c = f.map((q) => new THREE.Vector2(q[0], -q[1]));   // a fill may be concave (a half ring)
    for (const fc of THREE.ShapeUtils.triangulateShape(c, [])) for (const j of fc) out.push(c[j].x, c[j].y, z); return out; };
  function clearGroups() {
    for (const g of groups) { g.traverse((o) => { o.geometry?.dispose(); if (o.userData.fadeMat) { o.userData.fadeMat.dispose(); o.material = o.userData.src; } o.userData.drop?.(o); }); body.remove(g); }   // drop: an extension's mesh hands back its material
    groups = []; paths = [];
  }
  function build(st, perPart) {
    paint(); aim(); prims = []; hits = []; CUR = { layer: 0, i: 0, bucket: 'static', from: ASSEMBLY[0].from };
    layer(ASSEMBLY[0].name); context('back'); layer(ASSEMBLY[0].name);
    P3 = hook('trace') ? new WeakMap() : null;
    fig.model(K, st);
    layer(ASSEMBLY[0].name); context('front');
    for (const l of fig.labels || []) { layer(l.layer || ASSEMBLY[0].name); label(typeof l.frame === 'function' ? l.frame(K, st) : axes(...l.frame), l.text, ...l.at, l); }
    for (const p of prims) { p.ink = p.o.fillTone === 'ink'; p.hero = !p.ink && (p.o.hero ?? (!!ASSEMBLY[p.layer].hero || p.tone === 'hi'));   // the hero: its ASSEMBLY row says hero: true (never ink)
      p.outline = !p.hero && !p.ink && (p.o.accent === 'outline' || !!ASSEMBLY[p.layer].outline); }   // the one secondary part: accent edges, a dark tint, no glow
    if (STYLE.prims) prims = STYLE.prims(prims, { P, at3, ringAt, DV, dot, hull, inside, faces, run });   // a style may rewrite the list (new prims keep their source's layer, i, bucket, hero)
    // the fade: a part whose level (2 hero, 1 outline, 0 grey) changed tweens its amounts; while it does, each of its
    // prims carries a spec '@part^grey^outline^hero' per surface instead of one tone. The tones it is leaving are the
    // ones it last showed, so a fade starts from exactly what was on screen.
    const lv = (p) => p.hero ? 2 : p.outline ? 1 : 0, T = K.t, parts = new Map();
    const shown = (p) => p.ink ? { fill: 'ink', top: null, line: 'ink-edge' + (p.tone.endsWith('~') ? '~' : ''), label: 'mid', ...STYLE.ink?.(p) }
      : { fill: p.o.fillTone ? STYLE.dot(p) : STYLE.fill(p), top: STYLE.top(p), line: STYLE.line(p), label: STYLE.label(p) };
    for (const p of prims) { const k = p.part = p.o.label ? 'label:' + p.o.label.text : p.layer + ':' + p.i + ':' + p.bucket;
      const e = parts.get(k) || parts.set(k, { L: 0, n: 0 }).get(k); e.L = Math.max(e.L, lv(p)); p.ord = e.n++; }
    for (const [k, e] of parts) {
      let F = FADE.get(k);
      if (!F) FADE.set(k, F = { h: chan(+(e.L === 2)), o: chan(+(e.L === 1)), L: e.L, shown: [], n: e.n });
      else if (F.L !== e.L) { retarget(F.h, +(e.L === 2), T); retarget(F.o, +(e.L === 1), T); F.from = { L: F.L, shown: F.shown, n: F.n }; F.L = e.L; if (!REDUCED) ANIM.add(k); }
      e.F = F; e.fade = ANIM.has(k); F.shown = []; F.n = e.n;
    }
    for (const p of prims) parts.get(p.part).F.shown[p.ord] = shown(p);
    const spec = (p, what) => {
      const e = parts.get(p.part), S = e.F.shown[p.ord], pick = (q) => what === 'top' ? q.top ?? q.fill : q[what];
      if (!e.fade || (e.L && lv(p) !== e.L)) return S[what];   // a grey detail inside a lit part keeps its own tone
      const ts = [0, 1, 2].map((L) => pick(shown({ ...p, hero: L === 2, outline: L === 1 }))), fr = e.F.from;
      if (fr && fr.n === e.n && fr.shown[p.ord]) ts[fr.L] = pick(fr.shown[p.ord]);
      return ts.every((x) => x === ts[0]) ? S[what] : '@' + [p.part, ...ts].join('^');
    };
    const glowing = (p, s) => s && s[0] === '@' && (parts.get(p.part).F.h.from > 0 || parts.get(p.part).F.h.to > 0);
    for (const e of PM.values()) e.used = false;
    clearGroups(); gridBuild();
    let X0 = Infinity, X1 = -Infinity;                        // the drawing's x extent, for the draw-on's left-to-right timing
    for (const p of prims) for (const l of p.lines) for (const q of l.pts) { if (q[0] < X0) X0 = q[0]; if (q[0] > X1) X1 = q[0]; }
    const minX = (pts) => { let m = Infinity; for (const q of pts) if (q[0] < m) m = q[0]; return m; };
    const N = prims.length, B = new Map();
    prims.forEach((p, o) => {
      const key = perPart && p.bucket === 'static' ? p.layer + ':' + p.i + ':' + p.from : p.bucket;
      if (!B.has(key)) B.set(key, { fill: {}, timed: [], tones: {}, labels: [], glow: new Map(), xm: [], layer: p.layer, i: p.i, from: p.from, bucket: p.bucket });
      const b = p.b = B.get(key), zf = -9 + 18 * o / N, zl = zf + 9 / N;   // p.b.g: the primitive's group, once built
      if (p.o.label) { const v = VX && { k: 'label', z: zf + 6 / N, b, text: p.o.label.text }; if (v) VX.push(v); b.labels.push([p, zf + 6 / N, spec(p, 'label'), v]); return; }
      const pl = p.lines.filter((l) => l.pts.length > 1);
      const t0 = p.t0 = p.o.at ?? (pl.length ? SPREAD * (Math.min(...pl.map((l) => minX(l.pts))) - X0) / (X1 - X0 || 1) : 0);
      if (p.fill && p.fill.length > 2) {
        const ft = spec(p, 'fill'), tt = spec(p, 'top'), F = parts.get(p.part).F;
        const late = p.o.drawn || p.o.fillTone || p.o.at != null || F.shown[p.ord].fill !== 'plate';   // a coloured fill arrives as its outline starts
        if (late) b.timed.push({ tri: tris(p.fill, zf, []), t: t0, tone: ft });
        else tris(p.fill, zf, b.fill[ft] || (b.fill[ft] = []));
        if (VX) VX.push({ k: 'fill', pts: p.fill, tone: ft, t: late ? t0 : -Infinity, z: zf, b });
        if (tt && p.o.top?.length > 2) { b.timed.push({ tri: tris(p.o.top, zf + 4 / N, []), t: t0, tone: tt, grad: STYLE.grad && p.hero && tt[0] !== '@' });   // the two-tone cap
          if (VX) VX.push({ k: 'fill', pts: p.o.top, tone: tt, t: t0, z: zf + 4 / N, b }); }
        const fg = glowing(p, ft);                            // a fading part's glow is its own, keyed by when its fade started
        if (STYLE.glow && GLOWK > 0 && (p.hero || fg)) { const gk = fg ? F.h.t0 + '/' + F.h.to : '', G = b.glow.get(gk) || b.glow.set(gk, { pts: [], z: Infinity, t: Infinity, fk: fg ? { k: p.part, glow: true } : null }).get(gk);
          G.pts.push(...p.fill); G.z = Math.min(G.z, zf - 1 / N); G.t = Math.min(G.t, t0); }
      }
      if (p.fill && p.fill.length > 2) { const xm = hook('primMesh', p, zf, N, t0); if (xm) for (const m of xm) { m.userData.t = t0; b.xm.push(m); } }   // a style extension's own meshes for this primitive
      const own = pl.length && !VX ? hook('primLines', p, pl, zl, N, (l) => p.o.at ?? SPREAD * (minX(l.pts) - X0) / (X1 - X0 || 1), TW) : undefined;   // a style may draw a primitive's lines itself
      if (own) for (const m of own) { m.userData.t ??= t0; b.xm.push(m); }
      else for (const l of pl) {
        const n = l.pts.length - (l.closed ? 0 : 1), lt0 = p.o.at ?? SPREAD * (minX(l.pts) - X0) / (X1 - X0 || 1);
        const k = spec(p, 'line') + '|' + (p.o.dash ? 'd' : '') + '|' + (p.o.fine ? 'f' : ''), arr = b.tones[k] || (b.tones[k] = []);
        const times = [], un = untweens(n);
        for (let j = 0; j < n; j++) { const a = l.pts[j], c = l.pts[(j + 1) % l.pts.length]; times.push(lt0 + TW * un[j]); arr.push({ t: times[j], s: [a[0], -a[1], zl, c[0], -c[1], zl] }); }
        if (VX) VX.push({ k: 'line', pts: l.pts, closed: !!l.closed, tone: spec(p, 'line'), dash: !!p.o.dash, fine: !!p.o.fine, times, z: zl, b });
      }
    });
    const mesh = (arr, t, grad) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      if (grad) {                                            // the hero's top: lighter toward the far corner (up the plate)
        const ys = arr.filter((_, i) => i % 3 === 1), y0 = Math.min(...ys), y1 = Math.max(...ys), a = new THREE.Color(tone('accent-top')), e = new THREE.Color(tone('accent-top-end'));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(ys.flatMap((y) => { const c = a.clone().lerp(e, (y - y0) / (y1 - y0 || 1)); return [c.r, c.g, c.b]; }), 3)); }
      const m = new THREE.Mesh(geo, grad ? gradMat : fillFor(t)); m.frustumCulled = false; return m; };
    for (const b of B.values()) {
      const g = b.g = new THREE.Group(); g.userData = { k: b.layer, i: b.i, from: b.from, bucket: b.bucket, timed: [] };
      for (const G of b.glow.values()) for (const m of hook('glowMesh', G.pts, G.z, G.fk, 0.5 / N) || []) { m.userData.t = G.t; g.add(m); g.userData.timed.push(m); }   // it arrives with the hero
      for (const [t, arr] of Object.entries(b.fill)) if (arr.length) g.add(mesh(arr, t));
      for (const m of b.xm) { g.add(m); g.userData.timed.push(m); }
      for (const tf of b.timed) { const m = mesh(tf.tri, tf.tone, tf.grad); m.userData.t = tf.t; g.add(m); g.userData.timed.push(m); }
      for (const [p, z, ls, v] of b.labels) { const m = hook('labelMesh', p, z, ls); if (!m) continue; if (v) v.mesh = m; g.add(m); }
      for (const [k, arr] of Object.entries(b.tones)) {
        const [t, dash, fine] = k.split('|'); arr.sort((x, y) => x.t - y.t);
        const geo = new LineSegmentsGeometry(); geo.setPositions(arr.flatMap((e) => e.s));
        const obj = new LineSegments2(geo, lineFor(t, dash)); obj.frustumCulled = false; if (dash) obj.computeLineDistances(); g.add(obj);
        paths.push({ g: geo, n: arr.length, fine: !!fine, times: arr.map((e) => e.t) });
      }
      body.add(g); groups.push(g);
    }
    for (const [k, e] of PM) if (!e.used) { e.m.dispose(); PM.delete(k); }
    hook('built'); P3 = null;
    objHull = null;                                          // the object's outline, for the grab cursor: made on the first hover that needs it
    paint();
  }

  // ---------- layout: the 5:4 plate keeps its fitted size, centred; the canvas covers the whole window ----------
  const V = { az: spring(REST.az), el: spring(REST.el), z: spring(1), cx: spring(VW / 2), cy: spring(VH / 2) };
  function layout() {
    W = STAGED ? Math.max(1, host.el.clientWidth) : innerWidth; H = STAGED ? Math.max(1, host.el.clientHeight) : innerHeight;
    PW = Math.max(40, Math.floor(Math.min(W - 32, (H - 32) * 1.25, H))); CW = W * VW / PW; CH = H * VW / PW;
    if (!STAGED) renderer.setSize(W, H); for (const m of lineMats()) m.resolution.set(W, H);   // linewidth 1 is one CSS px at any size
    fade();
  }
  function frameCam() {                                      // zoom and pan are a window on the plate; lines stay 1 px
    const z = V.z.x, w = CW / z, h = CH / z;
    cam.left = V.cx.x - w / 2; cam.right = V.cx.x + w / 2; cam.top = -(V.cy.x - h / 2); cam.bottom = -(V.cy.x + h / 2); cam.updateProjectionMatrix();
    for (const m of lineMats()) if (m.userData.dash) { m.dashSize = 1.6 * VW / (PW * z); m.gapSize = 3.2 * VW / (PW * z); }
    FINE = 0.7 * PW * z >= 320;                               // fine lines only when the drawing is 320 px or wider
    widths(PW * z / VW);
  }
  function fade() {                                         // the style's plate-edge fade, only when the figure has context
    if (STAGED) return;                                       // staged: no per-plate mask yet
    const f = STYLE.fade && fig.context?.length ? STYLE.fade : 0, l = (W - PW) / 2, t = (H - PW * 0.8) / 2;
    const m = f ? `linear-gradient(to right, transparent ${l}px, #000 ${l + f}px, #000 ${W - l - f}px, transparent ${W - l}px), linear-gradient(transparent ${t}px, #000 ${t + f}px, #000 ${H - t - f}px, transparent ${H - t}px)` : '';
    for (const k of ['maskImage', 'webkitMaskImage']) canvas.style[k] = m;
    canvas.style.maskComposite = f ? 'intersect' : ''; canvas.style.webkitMaskComposite = f ? 'source-in' : '';
  }
  let built = '';
  on(window, 'resize', () => { layout(); frameCam(); built = ''; });
  on(matchMedia('(prefers-color-scheme: dark)'), 'change', () => { paint(); built = ''; });
  layout(); frameCam();

  // ---------- the hand: orbit with spring-back, zoom toward the pointer, double-click reset, the hero ----------
  // the export (below): SIM is the figure's motion replayed on a fixed clock; dirty once anything else has run it
  const SIM = { k: -1, sig: '', st: null, ev: 0, dirty: true, K: null };
  const EXP = { on: false, hold: false, grabbed: false, wasPaused: false, timer: 0, seek: null, script: null };
  let VX = null;                                              // set during an export build: the vector record of every primitive
  let STATED = false;   // true once the figure's state() has run: before that its springs and tweens do not exist
  let live = false, dragging = false, over = null, releasedAt = 0, down = null, pinch = null, lastTap = 0, armed = null, ttT0 = 0;
  const ptrs = new Map();
  const hand = () => live && MODE !== 'turntable';
  // early: from the first frame a hover on the hero or a press cuts the hero's own intro short (goLive); the parts still in
  // flight keep landing (the stack, or the draw-on, plays on to the end: EARLY until ASM); orbit, zoom and reset need no hero
  let VIEWED = false, BLEND = null, LAST_ST = null, EARLY = false, ASM = false;
  const landing = () => EARLY && !ASM && !EXP.on && !SCRUB.active;   // live, with the intro still assembling
  const view = () => (live || (STATED && FREEZE === Infinity && !SCRUB.active && !EXP.on)) && MODE !== 'turntable';
  const assembled = (t) => INTRO === 'stack' ? t >= STACK_END : paths.every((p) => !p.n || p.times[p.n - 1] <= t) && groups.every((g) => g.userData.timed.every((m) => m.userData.t <= t));
  const early = () => !live && view();
  // the intro yields smoothly: what the figure's state jumped by on going live eases out over 400 ms (BLEND, in frame)
  function goLive() { EARLY = !ASM; live = K.live = true; VIEWED = true; BLEND = LAST_ST && { from: LAST_ST, at: performance.now(), off: null }; fig.onLive?.(K); if (lastPtr) hover(lastPtr); wake(); }
  const toPlate = (e) => { const r = canvas.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    return { fx, fy, p: [cam.left + fx * (cam.right - cam.left), -(cam.top + fy * (cam.bottom - cam.top))] }; };
  const toClient = (p) => { const r = canvas.getBoundingClientRect(); return [r.left + (p[0] - cam.left) / (cam.right - cam.left) * r.width, r.top + (-p[1] - cam.top) / (cam.bottom - cam.top) * r.height]; };
  // nearest first; failing that, the closest hero part within 8 css px of the pointer, so a small part (a shutter button) needs no pixel aim
  const edgeD = (p, poly) => { let d = Infinity; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy,
    t = L ? Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L)) : 0; d = Math.min(d, Math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy)); } return d; };
  const hitAt = (p) => { for (let i = hits.length - 1; i >= 0; i--) if (inside(p, hits[i].poly)) return hits[i].id;
    const tol = 8 * (cam.right - cam.left) / Math.max(1, canvas.getBoundingClientRect().width); let best = null, bd = tol;
    for (const h of hits) { const d = edgeD(p, h.poly); if (d < bd) { bd = d; best = h.id; } } return best; };
  function zoomAbout(fx, fy, p, z) {
    z = clamp(z, 0.8, 2.5); V.z.t = z; const hw = VW / (2 * z), hh = VH / (2 * z);
    V.cx.t = z <= 1 ? VW / 2 : clamp(p[0] - (fx - 0.5) * CW / z, hw, VW - hw); V.cy.t = z <= 1 ? VH / 2 : clamp(p[1] - (fy - 0.5) * CH / z, hh, VH - hh);
  }
  const reset = () => { V.az.t = REST.az; V.el.t = REST.el; V.z.t = 1; V.cx.t = VW / 2; V.cy.t = VH / 2; };
  const leave = () => { if (over !== null) { SIM.dirty = true; HERO.onLeave?.(over, K); } over = K.hover = null; };
  let lastPtr = null;                                         // the mouse last seen over the plate: a figure that goes live under a resting cursor answers it
  function hover(e) {
    if (e.pointerType === 'mouse') lastPtr = { clientX: e.clientX, clientY: e.clientY, pointerType: 'mouse' };
    const { p } = toPlate(e); K.pointer = p;
    if (e.pointerType === 'mouse' && !dragging && early() && hitAt(p) !== null) goLive();
    const h = hand() && !dragging && e.pointerType === 'mouse' ? hitAt(p) : null;
    if (h !== over) { leave(); if (h !== null) { SIM.dirty = true; HERO.onHover?.(h, p, K); } }
    over = K.hover = h;
    canvas.style.cursor = !view() ? '' : dragging ? 'grabbing' : h !== null ? 'pointer' : inside(p, objHull ||= hull(prims.filter((q) => q.fill).flatMap((q) => q.fill))) ? 'grab' : '';
  }
  on(canvas, 'pointerdown', (e) => { if (!view()) return; VIEWED = true; if (early() && hitAt(toPlate(e).p) !== null) goLive(); try { canvas.setPointerCapture(e.pointerId); } catch {} ptrs.set(e.pointerId, e);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: V.z.t }; down = null; }
    else down = { x: e.clientX, y: e.clientY, az: V.az.t, el: V.el.t, moved: false }; });
  on(canvas, 'pointermove', (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, e);
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()], m = toPlate({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 });
      zoomAbout(m.fx, m.fy, m.p, pinch.z * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinch.d); }
    else if (down) { const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.moved && Math.hypot(dx, dy) > 4) { down.moved = dragging = true; leave(); }
      if (down.moved) { V.az.t = clamp(down.az - dx * 0.3, REST.az - 40, REST.az + 40); V.el.t = clamp(down.el + dy * 0.25, 15, 60); } }
    hover(e);
  });
  function up(e) {
    if (!ptrs.delete(e.pointerId)) return; if (ptrs.size < 2) pinch = null;
    if (down && !down.moved) { const now = performance.now(), { p } = toPlate(e);
      if (e.pointerType !== 'mouse' && now - lastTap < 320) reset();
      else { const id = hand() ? hitAt(p) : null; if (id !== null) heroClick(id, p); }
      lastTap = now; }
    if (down && down.moved) releasedAt = performance.now();
    down = null; dragging = false; hover(e);
  }
  on(canvas, 'pointerup', up); on(canvas, 'pointercancel', up);
  on(canvas, 'pointerleave', () => { leave(); lastPtr = null; });
  on(canvas, 'dblclick', () => { if (view()) reset(); });
  on(canvas, 'wheel', (e) => {                  // full page: the wheel zooms; embedded, only Ctrl+wheel or a pinch
    if (!view() || (EMBED && !e.ctrlKey)) return;
    e.preventDefault(); VIEWED = true; const { fx, fy, p } = toPlate(e); zoomAbout(fx, fy, p, V.z.t * Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });

  // ---------- the action: a hero's click hands off to the host page once its move is open ----------
  const heroClick = (id, p = null) => { SIM.dirty = true; HERO.onClick?.(id, p, K); if (HERO.action) armed = { at: K.t, id }; };
  // ?click=ID@MS: click hero member ID at MS on the clock (for capture: it works under ?freeze); ID may be a number
  const CLICK = (() => { const m = /^(.+)@(\d+)$/.exec(Q.get('click') || ''); return m ? { id: isNaN(+m[1]) ? m[1] : +m[1], ms: +m[2] } : null; })();
  // a click from a message, a key or the API: as a pointer press on the hero would (it goes live first in the intro)
  const press = (id) => { id ??= heroId(); if (id === null) return false; if (early()) goLive(); if (!hand()) return false; heroClick(id, centre(id)); return true; };

  // ---------- the keyboard: a figure with a hero action is a button (tab to it, Enter or Space clicks, focus hovers) ----------
  // the plate element takes the focus (staged: the plate; else the canvas's parent), only while the hand could work it
  const FT = STAGED ? host.el : canvas.parentElement, KB = { on: false, ring: null, was: null };
  function kbSync() {
    let ok = !!HERO.action && MODE !== 'turntable' && FREEZE0 === Infinity && !SCRUB.url && getComputedStyle(FT).pointerEvents !== 'none';
    try { if (frameElement && getComputedStyle(frameElement).pointerEvents === 'none') ok = false; } catch {}
    if (ok === KB.on) return ok; KB.on = ok;
    const A = ['tabindex', 'role', 'aria-label', 'aria-description'];
    if (ok) { KB.was = A.map((a) => FT.getAttribute(a)); const d = KB.was[2], name = fig.name || (STAGED ? d : document.title) || fig.id;
      FT.tabIndex = 0; FT.style.outline = 'none'; FT.setAttribute('role', 'button'); FT.setAttribute('aria-label', name + ', ' + (HERO.label || HERO.action)); if (d && d !== name) FT.setAttribute('aria-description', d); }
    else { kbBlur(); if (document.activeElement === FT) FT.blur(); FT.style.outline = ''; A.forEach((a, i) => KB.was[i] === null ? FT.removeAttribute(a) : FT.setAttribute(a, KB.was[i])); }
    return ok;
  }
  // focus-visible: the hero's hover, and a 2 px ink ring with an offset round the object (not the plate edge: hosts crop it)
  function kbFocus() {
    if (!kbSync() || !FT.matches(':focus-visible')) return;
    if (early()) goLive(); const id = heroId(); if (hand() && id !== null && over !== id) { leave(); over = K.hover = id; KB.hov = true; SIM.dirty = true; HERO.onHover?.(id, K.pointer = centre(id), K); }
    const b = (objHull ||= hull(prims.filter((q) => q.fill).flatMap((q) => q.fill))).reduce((m, q) => [Math.min(m[0], q[0]), Math.min(m[1], q[1]), Math.max(m[2], q[0]), Math.max(m[3], q[1])], [1e9, 1e9, -1e9, -1e9]);
    if (b[0] > b[2]) return;
    const [l, t] = toClient([b[0], b[1]]), [r, btm] = toClient([b[2], b[3]]), o = STAGED ? FT.getBoundingClientRect() : { left: 0, top: 0 };
    KB.ring ||= (STAGED ? FT : document.body).appendChild(Object.assign(document.createElement('div'), { className: 'kl-ring', ariaHidden: 'true' }));
    KB.ring.style.cssText = `position:absolute;pointer-events:none;z-index:3;border-radius:6px;outline:2px solid var(--hi);outline-offset:8px;left:${l - o.left}px;top:${t - o.top}px;width:${r - l}px;height:${btm - t}px`;
  }
  const kbLeave = () => { if (KB.hov && over !== null) { leave(); wake(); } KB.hov = false; };
  function kbBlur() { KB.ring?.remove(); KB.ring = null; kbLeave(); }
  on(FT, 'focus', () => { kbFocus(); wake(); }); on(FT, 'blur', kbBlur); on(canvas, 'pointerover', () => KB.on || kbSync()); on(window, 'resize', () => KB.ring && kbFocus());
  on(FT, 'keydown', (e) => {
    if (!KB.on || e.target !== FT || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape') kbLeave();
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) press(); wake(); }
  });

  function act() {
    const msg = { type: 'action', id: HERO.action, figure: fig.id };
    if (parent !== window) parent.postMessage(msg, '*');
    dispatchEvent(new CustomEvent('linejig:action', { detail: { id: HERO.action, figure: fig.id } }));
  }

  // ---------- turntable: no hand, a slow turn about the vertical axis ----------
  const setMode = (m) => { MODE = m === 'turntable' ? 'turntable' : 'interactive'; root.classList.toggle('turntable', MODE === 'turntable');
    ttT0 = Math.max(LIVE_AT, K.ht); leave(); dragging = false; down = pinch = null; ptrs.clear(); if (MODE !== 'turntable') { V.az.x = V.az.t; reset(); } kbSync(); };
  setMode(MODE);
  const turntableAz = (ms) => fig.turntable === 'full' ? REST.az + 360 * ms / 40000 : REST.az + 35 * Math.sin(2 * Math.PI * ms / 40000);

  // ---------- the frame ----------
  let start = performance.now(), last = start;
  const LOOP = { running: false, paused: false, auto: false, at: 0, sig: '', still: 0, raf: 0 };
  function loop() { LOOP.raf = 0; if (LOOP.paused) { LOOP.running = false; return; } frame();
    if (LOOP.still >= 3) { LOOP.running = false; DPR.n = DPR.sum = 0; LOOP.probe = setTimeout(peek, 64); return; } LOOP.raf = requestAnimationFrame(loop); }
  // asleep, a figure's clock may still start a move later (a hold that ends): read its state 15 times a second, no drawing
  function peek() { LOOP.probe = 0; if (LOOP.paused || LOOP.running || document.hidden || (STAGED && !host.stage.shown(host.el))) return;
    const now = performance.now(), t = Math.max(0, Math.min(now - start, FREEZE) - (GRID.on && !REDUCED ? GRID_IN : 0));
    Object.assign(K, { t, ht: t - shift(), dt: 0, now });
    SIM.dirty = true; const st = (STATED = true, fig.state(K)), all = Object.values(st).map((v) => typeof v === 'number' ? v.toFixed(3) : String(v)).join('/');
    if (all !== LOOP.all) wake(); else LOOP.probe = setTimeout(peek, 64); }
  function wake() { if (STAGED) { LOOP.still = 0; clearTimeout(LOOP.probe); LOOP.probe = 0; if (LOOP.paused) return; if (!LOOP.running) { LOOP.running = true; last = performance.now(); } host.stage.request(); return; }
    if (FREEZE !== Infinity) return; LOOP.still = 0; clearTimeout(LOOP.probe); LOOP.probe = 0; if (LOOP.running || LOOP.paused) return; LOOP.running = true; last = performance.now(); LOOP.raf = requestAnimationFrame(loop); }
  function pause(auto) { if (LOOP.paused) return; LOOP.paused = true; LOOP.auto = !!auto; LOOP.at = performance.now(); cancelAnimationFrame(LOOP.raf); clearTimeout(LOOP.probe); LOOP.raf = 0; LOOP.running = false; }
  function resume() { if (!LOOP.paused || SCRUB.active) return; LOOP.paused = false; const gap = performance.now() - LOOP.at; start += gap; releasedAt &&= releasedAt + gap; wake(); }
  if (!STAGED) on(document, 'visibilitychange', () => { if (document.hidden) pause(true); else if (LOOP.auto) resume(); });
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerleave', 'wheel', 'dblclick']) on(canvas, ev, wake, { passive: true });
  on(window, 'resize', wake); on(matchMedia('(prefers-color-scheme: dark)'), 'change', wake);
  function frame(drawNow = !STAGED) {
    if (SCRUB.active) return;                                 // scrubbing: the host owns the clock
    if (NONE === 1) settled();
    const now = performance.now(), el = Math.min(now - start, FREEZE), gd = GRID.on && !REDUCED ? GRID_IN : 0, t = Math.max(0, el - gd), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!ASM && STATED && assembled(t)) ASM = true;
    const ht = t - shift(), stk = INTRO === 'stack' && (!live || landing()) && !REDUCED;
    Object.assign(K, { t, ht, dt, now, intro: INTRO, stacking: stk });
    if (!live && ht > LIVE_AT && FREEZE === Infinity) { live = K.live = true; if (STATED) fig.onLive?.(K); if (lastPtr) hover(lastPtr); }   // hooks only once state() has set the figure up
    if (live || VIEWED) {
      if (!dragging && !REDUCED && releasedAt && now - releasedAt > 2000) { V.az.t = REST.az; V.el.t = REST.el; releasedAt = 0; }   // springs back
      for (const sp of Object.values(V)) step(sp, dt);
    }
    GRID.mat.opacity = gd ? inout(clamp(el / GRID_IN)) : 1;
    if (MODE === 'turntable' && !REDUCED && ht > ttT0) { V.az.x = V.az.t = turntableAz(ht - ttT0); V.el.x = V.el.t = REST.el; }
    setView(V.az.x, V.el.x); frameCam();
    if (CLICK && !CLICK.done && t >= CLICK.ms) { CLICK.done = true; heroClick(CLICK.id); }
    SIM.dirty = true; let st = (STATED = true, fig.state(K));
    if (BLEND) { const w = 1 - inout(clamp((now - BLEND.at) / 400)); BLEND.off ??= offOf(BLEND.from, st); st = w > 0 ? withOff(st, BLEND.off, w) : st; if (w <= 0) BLEND = null; }
    LAST_ST = st;
    const all = Object.values(st).map((v) => typeof v === 'number' ? v.toFixed(3) : String(v)).join('/'), fk = fig.key ? fig.key(st) : all;
    const key = [V.az.x.toFixed(2), V.el.x.toFixed(2), stk, fk].join('/');
    if (key !== built) { built = key; build(st, stk); K.builds++; }
    pose(st, t, stk);
    if (armed && (HERO.opened ? HERO.opened(st, K) : t - armed.at >= TW)) { armed = null; act(); }
    if (drawNow) draw();
    // on demand: keep rendering only while something moves; three still frames in a row and the loop sleeps until woken
    const sig = all + '|' + groups.map((g) => g.visible ? g.position.x.toFixed(2) + ',' + g.position.y.toFixed(2) + ',' + (g.userData.alpha ?? 1) : '-').join(';');
    const moving = Object.values(V).some((sp) => Math.abs(sp.x - sp.t) > 1e-3 || Math.abs(sp.v) > 1e-3);
    const busy = !live || MODE === 'turntable' || dragging || ptrs.size || moving || ANIM.size || armed || releasedAt || (gd && el < GRID_IN) || hook('busy') || landing() || sig !== LOOP.sig;
    LOOP.sig = sig; LOOP.all = all; LOOP.still = busy ? 0 : LOOP.still + 1;
    if (dt > 0 && dt < 0.1 && !DPR.fixed && DPR.v > 1) { DPR.n++; DPR.sum += dt;   // slow frames: a lower pixel ratio
      if (DPR.sum >= 1) { if (DPR.sum / DPR.n > 0.024) { DPR.v = Math.max(1, DPR.v - 0.25); renderer.setPixelRatio(DPR.v); layout(); } DPR.n = DPR.sum = 0; } }
  }
  // an early go-live: the state's numeric leaves (in plain objects and arrays) offset back to where the intro left them
  const plain = (v) => v && typeof v === 'object' && (Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype);
  const offOf = (a, b) => typeof a === 'number' && typeof b === 'number' && Number.isFinite(a - b) ? a - b
    : plain(a) && plain(b) ? (Array.isArray(b) ? b.map((x, i) => offOf(a[i], x)) : Object.fromEntries(Object.keys(b).map((k) => [k, offOf(a[k], b[k])]))) : 0;
  const withOff = (b, o, w) => typeof b === 'number' && typeof o === 'number' ? (o ? b + o * w : b)
    : plain(b) && plain(o) ? (Array.isArray(b) ? b.map((x, i) => withOff(x, o[i], w)) : Object.fromEntries(Object.keys(b).map((k) => [k, withOff(b[k], o[k], w)]))) : b;
  // the scene at clock t for state st: draw-on progress, the stack's travel, place() offsets and fades, accent tints
  function pose(st, t, stk) {
    const whole = REDUCED || (K.live && !landing()) || INTRO === 'stack';    // reduced motion: the final state at once; stack: drawn whole
    for (const p of paths) {
      if (whole) p.g.instanceCount = p.n;
      else { let lo = 0, hi = p.n; while (lo < hi) { const m = (lo + hi) >> 1; if (p.times[m] <= t) lo = m + 1; else hi = m; } p.g.instanceCount = lo; }
      if (p.fine && !FINE) p.g.instanceCount = 0;
    }
    for (const g of groups) {
      const { k, i, from, bucket, timed } = g.userData, e = stk ? layerE(k, i, t) : 1;
      const wo = g.userData.wo = e >= 0 && e < 1 ? from.map((c) => c * STK.travel * (1 - e)) : [0, 0, 0];   // the bucket's world offset
      let [dx, dy] = shiftOf(wo);
      let show = e >= 0;
      if (bucket !== 'static' && fig.place) { const pl = fig.place(K, bucket, st);
        if (pl) { if (pl.off) { const [ox, oy] = shiftOf(pl.off); dx += ox; dy += oy; for (let j = 0; j < 3; j++) wo[j] += pl.off[j]; } if (pl.show === false) show = false; g.userData.alpha = pl.alpha ?? 1; } }
      g.visible = show; g.position.set(dx, dy, 0);
      for (const m of timed) m.visible = whole || t >= m.userData.t;
    }
    if (ANIM.size) {                                          // only the parts that are fading recolour
      const done = [...ANIM].filter((k) => { const F = FADE.get(k); return !F || (t >= chanEnd(F.h) && t >= chanEnd(F.o)); });
      for (const m of [...PM.values()].map((e) => e.m).concat([...EXTRA])) if (m.userData.fk && ANIM.has(m.userData.fk.k)) tint(m);
      for (const k of done) ANIM.delete(k);
    }
    for (const g of groups) if (g.visible && (g.userData.alpha < 1 || g.userData.faded)) fadeGroup(g, clamp(g.userData.alpha));
    hook('pose', t, whole, stk);
  }

  // a style switch crossfades: the last frame, copied onto a canvas laid over the figure, fades out over 300 ms
  function restyle(s) {
    if (!REDUCED && !STAGED && canvas.width && canvas.height) { draw(); const r = canvas.getBoundingClientRect(), cv = document.createElement('canvas');   // a 0 x 0 canvas (hidden, still sizing) has nothing to fade
      cv.width = canvas.width; cv.height = canvas.height; cv.getContext('2d').drawImage(canvas, 0, 0);
      Object.assign(cv.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', pointerEvents: 'none',
        transition: 'opacity 300ms cubic-bezier(.65,0,.35,1)', maskImage: canvas.style.maskImage, webkitMaskImage: canvas.style.webkitMaskImage,
        maskComposite: canvas.style.maskComposite, webkitMaskComposite: canvas.style.webkitMaskComposite });
      document.body.appendChild(cv); requestAnimationFrame(() => requestAnimationFrame(() => { cv.style.opacity = '0'; }));
      setTimeout(() => cv.remove(), 360); }
    setStyle(s); fade(); paint(); built = '';
  }

  // ---------- export (site/export/README.md): deterministic time, offscreen PNG, vector frames ----------
  // The figure's own motion is replayed from t = 0 on a fixed 120 Hz clock (24, 30, 60 and 120 fps land on it exactly),
  // then built and posed into a scene of its own and drawn by a renderer of its own, at the rest view. The live view
  // holds still meanwhile: its clock pauses, and 300 ms after the last export call it resumes where it stopped, with
  // the figure's motion replayed to that moment (user input on it before the export is not replayed).
  const STEP = 1000 / 120, PAUSE = 600, SETTLE = 400;
  const EXS = { groups: [], paths: [], objHull: [], prims: [], hits: [], grid: null, FADE: [], ANIM: [], PM: [], extra: [], t: -1, sig: '' };
  const KF = ['t', 'ht', 'dt', 'now', 'live', 'intro', 'stacking', 'hover', 'pointer', 'REDUCED'];
  const introEnd = () => Math.ceil((INTRO === 'stack' ? Math.max(0, STACK_END + 100 - RELEASE) : 0) + LIVE_AT);
  const sigOf = (st) => JSON.stringify(st, (k, v) => typeof v === 'number' ? Math.round(v * 1000) / 1000 : v);
  const refill = (c, xs) => { c.clear(); for (const x of xs) c instanceof Map ? c.set(...x) : c.add(x); };
  function swapScene(to) {                                    // the live scene out, another in (its geometry, materials and fades)
    const was = { groups, paths, objHull, prims, hits, grid: GRID.g, FADE: [...FADE], ANIM: [...ANIM], PM: [...PM], extra: [...EXTRA] };
    for (const g of groups) body.remove(g); if (GRID.g) body.remove(GRID.g);
    ({ groups, paths, objHull, prims, hits } = to); GRID.g = to.grid;
    refill(FADE, to.FADE); refill(ANIM, to.ANIM); refill(PM, to.PM); refill(EXTRA, to.extra);
    if (GRID.g) body.add(GRID.g); for (const g of groups) body.add(g);
    return was;
  }
  function dropExportScene() {
    const live = swapScene(EXS); clearGroups();
    if (GRID.g) { GRID.g.geometry.dispose(); body.remove(GRID.g); GRID.g = null; }
    for (const e of PM.values()) e.m.dispose(); PM.clear();
    Object.assign(EXS, swapScene(live), { FADE: EXS.FADE, ANIM: EXS.ANIM });   // fades carry on into the next frame
  }
  // the script: [{ at, click: id } | { at, hover: id, pointer? } | { at, leave: true }], or 'hero': one click on the hero
  const hitsNow = () => hits.length ? hits : EXS.hits;
  const centre = (id) => { const h = hitsNow().find((x) => x.id === id); if (!h) return null;
    return [h.poly.reduce((a, q) => a + q[0], 0) / h.poly.length, h.poly.reduce((a, q) => a + q[1], 0) / h.poly.length]; };
  function heroId() {
    let hs = hitsNow(); if (!hs.length) hs = withExport({ t: introEnd(), script: [] }, () => hits.slice());
    return (hs.find((h) => ASSEMBLY[h.layer]?.hero) ?? hs[0])?.id ?? null;
  }
  const heroScript = () => { const id = heroId(); return id === null ? [] : [{ at: introEnd() + PAUSE, click: id }]; };
  const evsOf = (s) => (s === 'hero' ? heroScript() : Array.isArray(s) ? s : []).filter((e) => e && Number.isFinite(+e.at))
    .map((e) => ({ ...e, at: +e.at })).sort((a, b) => a.at - b.at);
  const scriptFor = (o) => evsOf(o.script !== undefined ? o.script : EXP.script ?? (CLICK ? [{ at: CLICK.ms, click: CLICK.id }] : []));
  function fire(e) {
    const p = e.pointer || centre(e.click ?? e.hover);
    if ('hover' in e || e.leave) { if (K.hover !== null && K.hover !== e.hover) HERO.onLeave?.(K.hover, K); K.hover = e.leave ? null : e.hover; K.pointer = p;
      if (K.hover !== null) HERO.onHover?.(K.hover, p, K); }
    if ('click' in e) HERO.onClick?.(e.click, p, K);
  }
  function simState(t, dt, canLive = true) {
    const ht = t - shift(); Object.assign(K, { t, ht, dt, now: t, intro: INTRO });
    if (canLive && !K.live && ht > LIVE_AT) { K.live = true; if (STATED) fig.onLive?.(K); }
    K.stacking = INTRO === 'stack' && !K.live && !REDUCED;
    STATED = true; return fig.state(K);
  }
  /** The figure's own motion at t (rounded to the 120 Hz clock), replayed from 0 or continued from the last call. */
  function simTo(t, evs, canLive = true) {
    const sig = JSON.stringify(evs) + '|' + INTRO + '|' + REDUCED + '|' + canLive, target = Math.max(0, Math.round(t / STEP));
    if (SIM.dirty || SIM.sig !== sig || target < SIM.k) {
      if (STATED) fig.onReplay?.(K);
      Object.assign(K, { live: false, hover: null, pointer: null }); Object.assign(SIM, { k: -1, sig, ev: 0, dirty: false, st: null });
    } else if (SIM.K) Object.assign(K, SIM.K);   // continuing: start from the simulation's own K, not the live view's (live: true skipped the intro)
    for (let k = SIM.k + 1; k <= target; k++) {
      const g = k * STEP;
      while (STATED && SIM.ev < evs.length && evs[SIM.ev].at <= g) { K.t = g; fire(evs[SIM.ev++]); }
      SIM.st = simState(g, k ? STEP / 1000 : 0, canLive); SIM.K = Object.fromEntries(KF.map((f) => [f, K[f]]));
    }
    SIM.k = target; Object.assign(K, SIM.K); return SIM.st;
  }
  // the live view: held while exports run, given back 300 ms after the last one
  function grab() { if (!EXP.grabbed) { EXP.grabbed = true; EXP.wasPaused = LOOP.paused; pause(false); } }
  function letGo() { if (EXP.hold || EXP.seek !== null || !EXP.grabbed) return; EXP.grabbed = false; if (!EXP.wasPaused) resume(); resync(); }
  function holdOn() { clearTimeout(EXP.timer); grab(); EXP.hold = true; EXP.timer = setTimeout(release, 300); }
  function release() { EXP.hold = false; dropExportScene(); if (EXP.seek !== null) showSeek(); else letGo(); }
  function resync() {                                          // the figure's motion back on the live clock
    const el = Math.min(performance.now() - start, FREEZE), t = Math.max(0, el - (GRID.on && !REDUCED ? GRID_IN : 0)), live0 = FREEZE === Infinity;
    simTo(Math.min(t, introEnd() + 8000), [], live0); if (t > SIM.k * STEP) simState(t, 0, live0);
    SIM.dirty = true; K.live = live; K.hover = over; if (over !== null) HERO.onHover?.(over, K.pointer, K);
    if (FREEZE !== Infinity && !STAGED) frame(); else wake();
  }
  function showSeek() {                                        // the live view at the seek time, at rest
    const r0 = REDUCED, k0 = K.REDUCED; if (SCRUB.active) REDUCED = K.REDUCED = false;   // scrubbing: the host owns the pace
    try { seekView(); } finally { REDUCED = r0; K.REDUCED = k0; }
  }
  function seekView() {
    const st = simTo(EXP.seek, SCRUB.active && SCRUB.marks ? SCRUB.marks.evs : scriptFor({}));
    for (const [k, sp] of Object.entries(V)) { sp.x = sp.t = { az: REST.az, el: REST.el, z: 1, cx: VW / 2, cy: VH / 2 }[k]; sp.v = 0; }
    setView(REST.az, REST.el); frameCam(); FADE.clear(); ANIM.clear();
    build(st, K.stacking); built = 'seek'; pose(st, K.t, K.stacking);
    if (STAGED) host.stage.request(); else draw();
  }
  /** Puts the live view at its state at ms (no real clock) until seek(null) gives it back to its own clock. */
  function seek(ms) {
    if (ms === null || ms === undefined) { if (EXP.seek === null) return null; EXP.seek = null; letGo(); return null; }
    if (!Number.isFinite(+ms)) throw new Error('seek: ms must be a number or null');
    grab(); EXP.seek = Math.max(0, +ms); showSeek(); return EXP.seek;
  }
  function script(s) { if (s !== undefined) EXP.script = s; return evsOf(EXP.script ?? []); }
  /** Scrub marks, found once on the stack intro: when the intro settles (its state stops changing), when the hero's
      click lands (as in duration({ hero })) and how long after it the hero reads as opened (0: no opened state). */
  function scrubMarks() {
    if (SCRUB.marks) return SCRUB.marks;
    const end = introEnd(), id = heroId(), click = id === null ? null : end + PAUSE, evs = click === null ? [] : [{ at: click, click: id }];
    let prev = '', settle = 0, open = 0;
    for (let t = 0; t <= end; t += 2 * STEP) { const s = sigOf(simTo(t, evs)); if (s !== prev) settle = t; prev = s; }
    if (click !== null && HERO.opened) for (let t = click; t <= click + 10000; t += 2 * STEP) if (HERO.opened(simTo(t, evs), K)) { open = t - click; break; }
    build(simTo(0, evs), true); built = '';                   // the stack's real end: its last row's last part landing
    const stack = groups.reduce((e, g) => Math.max(e, ST0 + rowAt(g.userData.k) + g.userData.i * STK.inRow + TW), STACK_END);
    return SCRUB.marks = { settle: Math.max(settle, stack), stack, click, open, evs };
  }
  /** Puts the figure at progress t in [0, 1] (header, "Scrub"); null hands it back to its own clock and replays it. */
  function scrub(t, o = {}) {
    if (t === null || t === undefined) {
      if (!SCRUB.active) return null;
      SCRUB.active = false; INTRO = SCRUB.intro; SCRUB.marks = null; seek(null); replay(); wake(); return null;
    }
    if (!Number.isFinite(+t)) throw new Error('scrub: t must be a number in [0, 1] or null');
    if (o.open !== undefined) SCRUB.open = !!o.open;
    if (Number.isFinite(+o.split) && o.split !== null) SCRUB.split = clamp(+o.split, 0.05, 1);
    if (!SCRUB.active) { if (!SCRUB.url) SCRUB.intro = INTRO; if (INTROS.includes('stack') && INTRO !== 'stack') { INTRO = 'stack'; SCRUB.marks = null; }
      leave(); dragging = false; down = pinch = armed = null; ptrs.clear(); }
    SCRUB.active = true; SCRUB.t = clamp(+t);
    const r0 = REDUCED, k0 = K.REDUCED; REDUCED = K.REDUCED = false;
    let ms; try { const m = scrubMarks(), sp = SCRUB.open && m.open > 0 ? SCRUB.split : 1;
      const s = SCRUB.t / sp, ST = m.stack;      // the stack over the first 85% of the intro range, its settle after
      // the hero's move runs on the tween, most of it early: through its inverse, so the move follows the host evenly
      ms = SCRUB.t > sp ? m.click + m.open * untween(Math.round(clamp((SCRUB.t - sp) / (1 - sp)) * 1000) / 1000) : s <= 0.85 ? ST * s / 0.85 : ST + Math.max(0, m.settle - ST) * (s - 0.85) / 0.15; } finally { REDUCED = r0; K.REDUCED = k0; }
    grab(); EXP.seek = ms; showSeek(); return SCRUB.t;
  }
  /** A sensible export length in ms: the intro, then with hero: a pause, the hero's move and a settle. */
  function duration(o = {}) {
    const intro = introEnd();
    if (!o.hero) return intro + SETTLE;
    if (EXP.script === null && o.script === undefined) EXP.script = 'hero';
    const evs = scriptFor(o), clicks = evs.filter((e) => 'click' in e);
    if (!clicks.length) return intro + SETTLE;
    const c = clicks[clicks.length - 1].at, kf = Object.fromEntries(KF.map((f) => [f, K[f]])), r0 = REDUCED;
    holdOn(); REDUCED = K.REDUCED = false;
    try {                                                      // walk on from the click until the state is back at rest or still
      const rest = sigOf(simTo(Math.max(0, c - 200), evs)); let prev = rest, last = c;
      for (let t = c; t <= c + 10000; t += 2 * STEP) { const s = sigOf(simTo(t, evs)); if (s !== prev) last = t; prev = s; if (t > c + 100 && s === rest) break; }
      return Math.ceil(Math.max(intro, last) + SETTLE);
    } finally { REDUCED = r0; Object.assign(K, kf); }
  }
  // one export frame: the figure at t in its own scene, framed like the plate (5:4 fitted inside width x height)
  let XR = null;
  function withExport(opts, fn) {
    const o = { t: 0, width: 1200, height: 960, scale: 1, background: 'plate', lineWidth: 1, glow: true, ...opts };
    if (!(o.width > 0 && o.height > 0 && o.scale > 0 && o.lineWidth > 0)) throw new Error('export: width, height, scale and lineWidth must be positive');
    if (o.style && isPro(o.style)) { if (!FILES[o.style].failed) loadStyle(o.style); throw new Error(`export: the ${o.style} style is in an add-on file, which has not loaded (yet)`); }
    if (o.style && !STYLES[o.style]) throw new Error('export: unknown style ' + o.style);
    if (o.theme && o.theme !== 'light' && o.theme !== 'dark') throw new Error('export: theme is light or dark');
    holdOn();
    XR ||= new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
    const sv = { STYLE, ds: root.dataset.style, theme: root.dataset.theme, REDUCED, W, H, PW, CW, CH, FINE, built, cs, sn, KE, ZF, DV, OX, OY,
      K: Object.fromEntries(KF.map((f) => [f, K[f]])), renderer, go: GRID.mat.opacity };
    const ex = !!HX.length; if (ex) hook('exportBegin');      // an extension keeps its own live state aside (the dots targets)
    EXP.on = true; renderer = XR;
    let live = null;
    try {
      if (o.style) setStyle(o.style);
      if (o.theme) root.dataset.theme = o.theme;
      REDUCED = K.REDUCED = !!o.reduced;
      const evs = scriptFor(o), st = simTo(o.t, evs), esig = JSON.stringify(evs) + '|' + INTRO + '|' + REDUCED;
      if (esig !== EXS.sig || K.t < EXS.t) { EXS.FADE = []; EXS.ANIM = []; }   // fades follow frames asked for in order
      EXS.sig = esig; EXS.t = K.t;
      live = swapScene(EXS);
      setView(o.az ?? REST.az, o.el ?? REST.el);
      W = o.width; H = o.height; PW = Math.min(W, H * 1.25); CW = W * VW / PW; CH = H * VW / PW; FINE = 0.7 * PW >= 320;
      Object.assign(cam, { left: VW / 2 - CW / 2, right: VW / 2 + CW / 2, top: -(VH / 2 - CH / 2), bottom: -(VH / 2 + CH / 2) }); cam.updateProjectionMatrix();
      GRID.mat.opacity = 1; VX = [];
      build(st, K.stacking);
      const vx = VX; VX = null;
      widths(PW / VW / o.lineWidth);                         // a scaled style width: its share of the export's plate
      for (const m of lineMats()) { m.resolution.set(W / o.lineWidth, H / o.lineWidth);   // the hairline: lineWidth export px
        if (m.userData.dash) { m.dashSize = 1.6 * o.lineWidth * VW / PW; m.gapSize = 3.2 * o.lineWidth * VW / PW; } }
      pose(st, K.t, K.stacking);
      return fn({ o, st, vx });
    } finally {
      VX = null;
      if (live) Object.assign(EXS, swapScene(live));
      renderer = sv.renderer; if (ex) hook('exportEnd');
      STYLE = sv.STYLE; root.dataset.style = sv.ds; if (sv.theme === undefined) delete root.dataset.theme; else root.dataset.theme = sv.theme;
      REDUCED = sv.REDUCED; Object.assign(K, sv.K);
      ({ W, H, PW, CW, CH, built, cs, sn, KE, ZF, DV, OX, OY } = sv);
      frameCam(); FINE = sv.FINE; for (const m of lineMats()) m.resolution.set(W, H);
      GRID.mat.opacity = sv.go;
      paint(); EXP.on = false;
    }
  }
  /** The frame at t as a canvas of width * scale by height * scale device px (opts: README). */
  function capture(opts = {}) {
    return withExport(opts, ({ o }) => {
      const R = renderer, clear = o.background === 'transparent';
      R.setPixelRatio(o.scale); R.setSize(o.width, o.height, false);
      R.setClearColor(CLEAR, clear ? 0 : 1);
      for (const g of groups) g.traverse((m) => m.userData.capture?.(m, o, clear));   // an extension's mesh for the export (a glow)
      hook('captureBegin', clear);
      draw();
      const out = o.into || document.createElement('canvas'); out.width = R.domElement.width; out.height = R.domElement.height;
      const c = out.getContext('2d'); c.clearRect(0, 0, out.width, out.height); c.drawImage(R.domElement, 0, 0); return out;
    });
  }
  const png = (opts = {}) => new Promise((ok, no) => capture(opts).toBlob((b) => b ? ok(b) : no(new Error('png: the canvas gave no blob')), 'image/png'));
  /** The frame at t as 2D vector data in painter's order, in export px (README). */
  function vector(opts = {}) {
    if ((opts.style ? STYLES[opts.style] : STYLE)?.dots) throw new Error('vector: the dots style has no vector form; export it with capture() or png()');
    return withExport(opts, ({ o, vx }) => {
      const sx = W / CW, sy = H / CH, L0 = VW / 2 - CW / 2, T0 = VH / 2 - CH / 2, whole = REDUCED || K.live || INTRO === 'stack', clear = o.background === 'transparent';
      const hex = (c) => '#' + c.getHexString(), its = [];
      const at = (g) => { const dx = g.position.x, dy = -g.position.y; return (q) => [(q[0] + dx - L0) * sx, (q[1] + dy - T0) * sy]; };
      const alphaOf = (g) => g.userData.faded ? clamp(g.userData.alpha) : 1;
      if (!clear) its.push({ z: -Infinity, kind: 'fill', pts: [[0, 0], [W, 0], [W, H], [0, H]], fill: hex(new THREE.Color(CLEAR)), opacity: 1 });
      for (const v of vx) {
        const g = v.b.g; if (!g || !g.visible) continue;
        const X = at(g), op = alphaOf(g);
        if (v.k === 'fill') { if (!whole && v.t > K.t) continue;
          const m = v.tone[0] === '@' ? PM.get(v.tone)?.m : fills[v.tone]; if (m) its.push({ z: v.z, kind: 'fill', pts: v.pts.map(X), fill: hex(m.color), opacity: op }); }
        else if (v.k === 'line') { if (v.fine && !FINE) continue;
          const n = whole ? v.times.length : v.times.filter((x) => x <= K.t).length; if (!n) continue;
          const key = v.tone + (v.dash ? '-' : ''), m = v.tone[0] === '@' ? PM.get(key)?.m : mats[key]; if (!m) continue;
          const thin = (v.tone[0] === '@' ? parseSpec(v.tone).g : v.tone).endsWith('~'), pts = v.pts.map(X);
          its.push({ z: v.z, kind: 'line', pts: v.closed && n === v.times.length ? pts : (v.closed ? pts.concat([pts[0]]) : pts).slice(0, n + 1), closed: v.closed && n === v.times.length,
            stroke: hex(m.color), width: o.lineWidth * (thin ? 0.5 : 1), dash: v.dash ? [1.6 * o.lineWidth, 3.2 * o.lineWidth] : null, opacity: op }); }
        else if (v.k === 'label' && v.mesh?.visible && v.mesh.userData.textItem) its.push({ z: v.z, text: v.text, ...v.mesh.userData.textItem(v.mesh, X, op) });   // kind 'text'
      }
      // an extension's mesh as a vector item (a glow: kind 'glow', a blurred hull)
      if (o.glow) for (const g of groups) if (g.visible) g.traverse((m) => { if (!m.userData.glowItem || !m.visible) return; const it = m.userData.glowItem(m, at(g), { clear, sx }); if (it) its.push(it); });
      its.sort((a, b) => a.z - b.z);
      return { width: W, height: H, items: tidy(its) };
    });
  }
  // hidden-line removal against later opaque convex fills, then collinear points merged and like strokes joined
  function tidy(its) {
    const G = 24, cell = [W / G, H / G], grid = Array.from({ length: G * G }, () => []), occ = [];
    const cellOf = (p) => clamp(Math.floor(p[0] / cell[0]), 0, G - 1) + G * clamp(Math.floor(p[1] / cell[1]), 0, G - 1);
    const covered = (p, q, r) => { for (const i of grid[cellOf(p)]) { const c = occ[i];
      if (p[0] < c.x0 || p[0] > c.x1 || p[1] < c.y0 || p[1] > c.y1 || q[0] < c.x0 || q[0] > c.x1 || q[1] < c.y0 || q[1] > c.y1) continue;
      if (c.e.every(([nx, ny, k]) => nx * p[0] + ny * p[1] + k >= r && nx * q[0] + ny * q[1] + k >= r)) return true; } return false; };
    // a fill is hidden only when one occluder holds all of it (its corners each under some later fill is not enough: a
    // room's floor has every corner under a wall)
    const hidden = (pts, r) => { for (const i of grid[cellOf(pts[0])]) { const c = occ[i];
      if (pts.every((p) => p[0] >= c.x0 && p[0] <= c.x1 && p[1] >= c.y0 && p[1] <= c.y1 && c.e.every(([nx, ny, k]) => nx * p[0] + ny * p[1] + k >= r))) return true; } return false; };
    function occluder(pts) {
      const P0 = pts.filter((q, i) => i === 0 || Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 1e-3), n = P0.length; if (n < 3) return;
      let a = 0, sg = 0; for (let i = 0; i < n; i++) { const [x1, y1] = P0[i], [x2, y2] = P0[(i + 1) % n], [x3, y3] = P0[(i + 2) % n]; a += x1 * y2 - x2 * y1;
        const cr = (x2 - x1) * (y3 - y2) - (y2 - y1) * (x3 - x2); if (Math.abs(cr) > 1e-6) { const s = Math.sign(cr); if (sg && s !== sg) return; sg = s; } }
      if (Math.abs(a) < 2) return;
      const e = P0.map(([x1, y1], i) => { const [x2, y2] = P0[(i + 1) % n], l = Math.hypot(x2 - x1, y2 - y1) || 1, s = Math.sign(a), nx = -s * (y2 - y1) / l, ny = s * (x2 - x1) / l; return [nx, ny, -(nx * x1 + ny * y1)]; });
      const xs = P0.map((q) => q[0]), ys = P0.map((q) => q[1]), c = { e, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }, id = occ.push(c) - 1;
      for (let gy = clamp(Math.floor(c.y0 / cell[1]), 0, G - 1); gy <= clamp(Math.floor(c.y1 / cell[1]), 0, G - 1); gy++)
        for (let gx = clamp(Math.floor(c.x0 / cell[0]), 0, G - 1); gx <= clamp(Math.floor(c.x1 / cell[0]), 0, G - 1); gx++) grid[gx + G * gy].push(id);
    }
    // a point goes only if it and every point dropped since the last one kept lie within 0.05 px of the chord from that
    // kept point to the next, and run forward along it: a densely sampled curve keeps its curve, a pointed tip its point
    const straight = (run) => { if (run.length < 3) return run; const out = [run[0]]; let k = 0;
      for (let i = 1; i < run.length - 1; i++) { const a = run[k], c = run[i + 1], dx = c[0] - a[0], dy = c[1] - a[1], L = Math.hypot(dx, dy);
        let on = L > 1e-6;
        for (let j = k + 1; on && j <= i; j++) { const b = run[j], t = (b[0] - a[0]) * dx + (b[1] - a[1]) * dy;
          on = t >= 0 && t <= L * L && Math.abs((b[0] - a[0]) * dy - (b[1] - a[1]) * dx) <= 0.05 * L; }
        if (!on) { out.push(run[i]); k = i; } }
      out.push(run[run.length - 1]); return out; };
    const out = [];
    for (let i = its.length - 1; i >= 0; i--) {                // back from the nearest: occluders are the items drawn later
      const it = its[i];
      if (it.kind === 'fill') { if (it.z > -Infinity && hidden(it.pts, 0.5)) continue; if (it.opacity >= 1 && it.z > -Infinity) occluder(it.pts); out.push(it); }
      else if (it.kind === 'line') {
        const pts = it.closed ? it.pts.concat([it.pts[0]]) : it.pts, r = it.width / 2 + 0.5, hid = [];
        for (let j = 0; j + 1 < pts.length; j++) hid.push(covered(pts[j], pts[j + 1], r));
        if (!hid.includes(true)) { out.push({ ...it, runs: [straight(pts)] }); continue; }
        const runs = []; let cur = null;
        const order = it.closed ? [...Array(hid.length).keys()].map((j) => (j + hid.indexOf(true) + 1) % hid.length) : [...hid.keys()];
        for (const j of order) { if (hid[j]) { cur = null; continue; } if (!cur) runs.push(cur = [pts[j]]); cur.push(pts[j + 1]); }
        if (runs.length) out.push({ ...it, closed: false, runs: runs.map(straight) });
      } else out.push(it);
    }
    out.reverse();
    const f = (x) => String(Math.round(x * 10) / 10), pd = (run, z) => 'M' + run.map((q) => f(q[0]) + ' ' + f(q[1])).join('L') + (z ? 'Z' : '');
    const items = [];
    for (const it of out) {
      const prev = items[items.length - 1];
      if (it.kind === 'line') { const d = it.runs.map((r) => pd(r, it.closed)).join('');
        if (prev?.type === 'path' && prev.fill === 'none' && prev.stroke === it.stroke && prev.strokeWidth === it.width && prev.opacity === it.opacity && String(prev.dash) === String(it.dash)) prev.d += d;
        else items.push({ type: 'path', d, fill: 'none', stroke: it.stroke, strokeWidth: it.width, opacity: it.opacity, dash: it.dash }); }
      else if (it.kind === 'fill') { let a = 0; it.pts.forEach((p, j) => { const q = it.pts[(j + 1) % it.pts.length]; a += p[0] * q[1] - q[0] * p[1]; });
        const d = pd(a < 0 ? it.pts.slice().reverse() : it.pts, true);   // one winding, so joined fills never cancel
        if (prev?.type === 'path' && prev.stroke === null && !prev.blur && prev.fill === it.fill && prev.opacity === it.opacity) prev.d += d;
        else items.push({ type: 'path', d, fill: it.fill, stroke: null, strokeWidth: 0, opacity: it.opacity, dash: null }); }
      else if (it.kind === 'glow') items.push({ type: 'path', d: pd(it.pts, true), fill: it.fill, stroke: null, strokeWidth: 0, opacity: it.opacity, dash: null, blur: it.blur, blend: it.blend });
      else items.push({ type: 'text', text: it.text, matrix: it.matrix.map((x) => Math.round(x * 1e4) / 1e4), x: it.x, y: it.y, fontSize: it.fontSize, fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontWeight: 500, textLength: it.textLength, fill: it.fill, opacity: it.opacity });
    }
    return items;
  }
  /** The frame at t as an SVG document string (a vector() frame written out). */
  function svg(opts = {}) {
    const v = vector(opts), esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const uid = 'kl' + Math.random().toString(36).slice(2, 7), defs = [], body0 = [];
    const op = (x) => x < 1 ? ` opacity="${Math.round(x * 1000) / 1000}"` : '';
    v.items.forEach((it, i) => {
      if (it.type === 'text') { body0.push(`<text transform="matrix(${it.matrix.join(' ')})" x="${it.x}" y="${it.y}" font-family="${esc(it.fontFamily)}" font-weight="${it.fontWeight}" font-size="${it.fontSize}" dominant-baseline="middle" textLength="${Math.round(it.textLength)}" lengthAdjust="spacingAndGlyphs" fill="${it.fill}"${op(it.opacity)}>${esc(it.text)}</text>`); return; }
      let a = `<path d="${it.d}" fill="${it.fill}"`;
      if (it.stroke) a += ` stroke="${it.stroke}" stroke-width="${it.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"` + (it.dash ? ` stroke-dasharray="${it.dash.map((x) => Math.round(x * 100) / 100).join(' ')}"` : '');
      if (it.blur) { const id = `${uid}g${i}`, m = it.blur * 3.2; defs.push(`<filter id="${id}" filterUnits="userSpaceOnUse" x="${-m}" y="${-m}" width="${v.width + 2 * m}" height="${v.height + 2 * m}"><feGaussianBlur stdDeviation="${Math.round(it.blur * 100) / 100}"/></filter>`);
        a += ` filter="url(#${id})"` + (it.blend !== 'normal' ? ` style="mix-blend-mode:${it.blend}"` : ''); }
      body0.push(a + op(it.opacity) + '/>');
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${v.width}" height="${v.height}" viewBox="0 0 ${v.width} ${v.height}">` + (defs.length ? `<defs>${defs.join('')}</defs>` : '') + body0.join('') + '</svg>';
  }
  async function exportMsg(format, opts) {
    if (format === 'png') { const b = await png(opts); return opts.as === 'arraybuffer' ? b.arrayBuffer() : b; }
    if (format === 'bitmap') return createImageBitmap(capture(opts));
    if (format === 'svg') return svg(opts);
    if (format === 'vector') return vector(opts);
    if (format === 'duration') return duration(opts);
    if (format === 'script') return script(opts.script);
    if (format === 'seek') return seek(opts.t ?? null);
    throw new Error('export: unknown format ' + format);
  }
  const EXPORT = { seek, script, duration, capture, png, vector, svg, scrub };

  // intro none: the clock jumps past the settled intro, the figure's motion replayed to there as an export does, live at once
  function settled() {
    const sk = introEnd() + SETTLE, live0 = FREEZE0 === Infinity; NONE = 2; FREEZE = FREEZE0 + sk;
    last = performance.now(); start = last - sk - (GRID.on && !REDUCED ? GRID_IN : 0);
    simTo(sk, [], live0); SIM.dirty = true; live = K.live = live0; ttT0 = Math.max(LIVE_AT, K.ht);
  }
  // setIntro: another intro (or none) without a remount, played from the start
  const setIntro = (v) => { if (v !== 'none' && !INTROS.includes(v)) return false; NONE = +(v === 'none'); if (!NONE) INTRO = SCRUB.intro = v; replay(); return true; };
  // ---------- embed contract ----------
  function replay() {
    for (const [k, sp] of Object.entries(V)) { sp.x = sp.t = { az: REST.az, el: REST.el, z: 1, cx: VW / 2, cy: VH / 2 }[k]; sp.v = 0; }
    leave(); dragging = false; releasedAt = 0; down = pinch = armed = null; ptrs.clear(); VIEWED = false; BLEND = null; EARLY = ASM = false;
    built = ''; FADE.clear(); ANIM.clear(); live = K.live = false; start = last = performance.now(); K.t = K.ht = 0; ttT0 = LIVE_AT; if (STATED) fig.onReplay?.(K);
    if (NONE) NONE = 1; FREEZE = FREEZE0;
  }
  if (!STAGED) on(window, 'message', (e) => {
    if (e.source !== parent || !e.data || typeof e.data.type !== 'string') return;
    const { type, value } = e.data;
    if (type === 'export') {                                  // {type: 'export', id, format, opts} -> {type: 'export-result', id, ok, data}
      const { id, format, opts } = e.data, post = (ok, data) => parent.postMessage({ type: 'export-result', id, ok, data }, '*', ok && (data instanceof ArrayBuffer || data instanceof ImageBitmap) ? [data] : []);
      Promise.resolve().then(() => exportMsg(format, opts || {})).then((d) => post(true, d), (err) => post(false, String(err?.message || err)));
      return;
    }
    if (type === 'pause') return pause(false);
    if (type === 'resume') return resume();
    if (type === 'scrub') { try { scrub(e.data.t ?? value ?? null, e.data); } catch {} return; }
    wake();
    if (type === 'replay') replay();
    else if (type === 'reset') reset();
    else if (type === 'theme' && (value === 'light' || value === 'dark')) { root.dataset.theme = value; paint(); built = ''; }
    else if (type === 'brand') { if (setBrand(value)) { paint(); built = ''; } }
    else if (type === 'intro' && (value === 'none' || INTROS.includes(value))) { NONE = +(value === 'none'); if (!NONE) INTRO = value; replay(); }
    else if (type === 'click') press(e.data.id ?? value);
    else if (type === 'state') { fig.onState?.(value, K); SIM.dirty = true; }   // a figure's own named state (a form's 'sent'), see the header
    else if (type === 'mode') setMode(value);
    else if (type === 'style' && (STYLES[value] || FILES[value])) useStyle(value);
    else if (type === 'grid') { GRID.on = !!value; built = ''; }
    else if (ADDONS[type]) option(type, value);
    else if (type === 'dots') setDots(value);
    if (SCRUB.active && !EXP.hold) showSeek();                 // scrubbing: the loop is held, so show the change now
  });
  // an add-on's option: its file is loaded first, then told (it rebuilds through X.rebuild)
  function option(k, v) { loadAddon(k).then(() => { hook('option', k, v); wake(); }); }
  // the dots settings live in linejig-pro.js; sent before it arrived, they wait there in order
  function setDots(v) { if (HX.length) hook('setDots', v); else DQ.push(v); }
  // a style by name: an add-on one not loaded yet is asked for (line art meanwhile) and shown once its file arrives
  function useStyle(s) {
    if (!isPro(s)) { WANT = null; restyle(s); return; }
    if (FILES[s].failed) return;
    WANT = s;
    loadStyle(s).then(() => {
      if (WANT !== s) return; WANT = null;
      if (STYLES[s]) { if (DRAWN && !STAGED) restyle(s); else { setStyle(s); fade(); paint(); built = ''; } }
      if (SCRUB.active && !EXP.hold) showSeek(); else if (FREEZE !== Infinity && !STAGED) frame(); else wake();
    });
  }
  // ---------- the extension kit: what a style's extension (linejig-pro.js) reads and calls, per figure ----------
  const X = { fig, Q, root, STAGED, host, K, canvas, scene, cam, on, css, tone, tc, tint, parseSpec, extra: EXTRA, hull, P, at3,
    get style() { return STYLE; }, get renderer() { return renderer; }, get W() { return W; }, get H() { return H; },
    get span() { return FITW * PW / VW * (EXP.on ? 1 : V.z.x); },   // the object's width on screen, CSS px
    get exporting() { return EXP.on; }, get reduced() { return REDUCED; }, glow: GLOWK, brand: BR, paint: () => paint(), wake: () => wake(),
    rebuild: () => { built = ''; wake(); }, get prims() { return prims; }, world: (pt) => P3?.get(pt), get ASSEMBLY() { return ASSEMBLY; } };
  const ATT = new Set();
  function attach(late) {                                      // every registered extension, once; late: the figure is already up
    const add = EXTS.filter((e) => !ATT.has(e)); if (!add.length) return;
    for (const e of add) { ATT.add(e); const h = e.mount(X); if (h) HX.push(h); }
    for (const v of DQ.splice(0)) hook('setDots', v);
    if (late) { paint(); built = ''; wake(); }
  }
  const reattach = () => attach(true); MOUNTS.add(reattach); attach(false);
  if (STAGED) {                                               // the stage calls tick() each frame the plate is on screen, then draw()
    let began = false;                                       // a plate's clock starts when it is first on screen
    const tick = () => { if (!LOOP.running || LOOP.paused) return false; if (!began) { began = true; start = last = performance.now(); if (NONE) NONE = 1; } frame(false);
      if (LOOP.still >= 3) { LOOP.running = false; LOOP.probe = setTimeout(peek, 64); } return true; };
    const setTheme = (v) => { if (v === 'light' || v === 'dark') root.dataset.theme = v; else delete root.dataset.theme; paint(); built = ''; };
    // prebuild: build the first frame's geometry now (a host calls it while the plate is still off screen); the clock does not start
    const prebuild = () => { if (began || built) return; const s0 = start; start = last = performance.now(); frame(false); start = s0; };
    // setIntro: another intro without a remount, played from the start; dispose: everything this plate holds, freed (stage.remove)
    function dispose() {
      pause(false); AC.abort(); clearTimeout(EXP.timer); kbBlur(); MODE = 'turntable'; kbSync();
      if (EXP.hold) { EXP.hold = false; dropExportScene(); }
      clearGroups(); hook('dispose'); MOUNTS.delete(reattach); GRID.on = false; gridBuild(); GRID.mat.dispose();
      for (const e of PM.values()) e.m.dispose(); PM.clear();
      for (const m of [...Object.values(fills), ...Object.values(mats), gradMat]) m.dispose();
      XR?.dispose(); XR = null;
    }
    const api = { K, el: host.el, tick, draw, wake, prebuild, dispose, get running() { return LOOP.running; }, replay, reset, setMode, setTheme, setIntro, setStyle: (s) => { useStyle(s); },
      setBrand: (v) => { if (setBrand(v)) { paint(); built = ''; } }, setGrid: (v) => { GRID.on = !!v; built = ''; }, option, setDots, click: (id) => heroClick(id), pause: () => pause(false), resume, layout: () => { layout(); frameCam(); built = ''; },
      get hits() { return hits; }, toClient, ...EXPORT };
    for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(api))) if (typeof d.value === 'function' && !['tick', 'draw', 'wake', 'prebuild', 'dispose', 'toClient', ...Object.keys(EXPORT)].includes(k)) { const f = d.value; api[k] = (...a) => { const r = f(...a); wake(); return r; }; }
    host.stage.add(api); wake(); return api;
  }
  // ready and window.__linejig: a figure that opens in an add-on style announces itself once its file is in (or failed)
  const announce = () => {
    if (parent !== window) parent.postMessage({ type: 'ready', id: fig.id, intros: INTROS, styles: STYLE_NAMES, style: root.dataset.style, brand: BR.color, dots: hook('dots') ?? null, action: HERO.action || null, export: ['png', 'bitmap', 'svg', 'vector', 'duration', 'script', 'seek'], scrub: true, click: true }, '*');
    window.__linejig = { K, V, get live() { return live; }, get hover() { return over; }, get style() { return root.dataset.style; }, get hits() { return hits; },
      click: (id) => heroClick(id), toClient, replay, setMode, setStyle: useStyle,
      setBrand: (v) => { if (setBrand(v)) { paint(); built = ''; } }, get brand() { return { ...BR }; }, setDots, get dots() { const d = hook('dots'); return d ? { ...d } : null; },
      setGrid: (v) => { GRID.on = !!v; built = ''; }, option, ...EXPORT };
    for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(window.__linejig))) if (typeof d.value === 'function' && !(k in EXPORT) && k !== 'toClient') window.__linejig[k] = woken(d.value);
  };
  const woken = (f) => (...a) => { const r = f(...a); wake(); return r; };   // anything a host or a figure calls wakes the loop
  if (WANT) loadStyle(WANT).then(announce); else announce();
  // headless capture: drive frames with timers while frozen, then go idle so the compositor presents the frame
  if (FREEZE !== Infinity) { const kick = () => { frame(); if (performance.now() - start < FREEZE + 400) setTimeout(kick, 50); else requestAnimationFrame(frame); }; kick(); }
  else if (document.hidden) pause(true); else wake();
  if (SCRUB.url) scrub(0);
  if (!STAGED) on(window, 'resize', () => { if (SCRUB.active) requestAnimationFrame(() => SCRUB.active && showSeek()); });
  return { K, replay: woken(replay), reset: woken(reset), setMode: woken(setMode), setIntro: woken(setIntro), click: woken(press), pause: () => pause(false), resume, ...EXPORT };
}
