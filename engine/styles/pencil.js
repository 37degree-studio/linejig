/* Linejig: the Pencil style. Copyright 2026 Linejig. MIT licence, free like the engine.

   Pencil: the figure drawn by hand in graphite on Linejig's plate (--plate), which is the paper. Every line is a pencil
   stroke of one weight: pressure that swells and lifts, overshoot at sharp corners, a faint second pass on silhouettes
   and light construction lines past long straight edges. Tone is built from hatching in each face's own plane (solids:
   the face's u and v; plain fills: printed round a vertical axis through the part), crossed on darker faces and smudged
   in the deepest, never from grey fills. The graphite breaks on a paper tooth anchored to the page. The hero is drawn
   in the brand colour as a coloured pencil, with an eraser-clean highlight, and fades in and out with the engine's accent
   fade. On the dark plate the pencil is silver on black and draws the light. Boil (on by default) redraws each stroke in
   place a few times a second, eases out while the view turns, and stops under reduced motion, ?freeze and exports.
   The engine imports this file on demand (style 'pencil'); it registers itself through registerStyle and
   registerExtension and uses three generic engine hooks: o.solid on solid(), primMesh(p, z, N, t0) and
   primLines(p, lines, z, N, startOf, TW). Settings: PENCIL and PENCIL_RANGE below; createFigure({ pencil: {...} }),
   ?pencil=k:v,k:v, or a {type: 'pencil', value: {...}} message (uniforms only, no rebuild). paperTile() gives a page
   background that continues the figures' paper. Reference: skill/linejig/references/pencil.md. */
import * as THREE from 'three';
import * as core from '../linejig.js';

const { clamp, hull } = core.STYLE_KIT;

// ---------- settings (one place, with ranges; the owner's tuning of 2026-11-21 is the default) ----------
export const PENCIL = {
  pressure: 0.15,   // how much a stroke swells and lifts along its length (0: an even line)
  wobble: 0,        // the hand's wobble, CSS px
  overshoot: 4,     // how far a stroke runs past a sharp corner, CSS px (0: corners meet)
  retrace: 0.3,     // a light second pass on silhouettes (0: none)
  construct: true,  // faint construction lines past the long straight edges
  constructLen: 22, // how far they run past the corner, CSS px
  hatch: 0.7,       // hatching density (0: none)
  spacing: 3.1,     // the hatching's line spacing, CSS px at the plate's fitted size
  angle: 134,       // the hatching's angle in the face's plane, degrees from the face's own horizontal
  cross: 58,        // the cross-hatching's turn from the first layer, degrees
  grain: 0.65,      // how much the graphite breaks on the paper's tooth
  paper: 0.5,       // the tooth shown on the plate itself
  smudge: 0.65,     // the soft graphite blended into the deepest shadows
  eraser: 0.35,     // the eraser-clean highlight on the hero's lit faces (light plate)
  heroBase: 0.3,    // the hero's light burnished coloured-pencil layer under its hatching
  boil: true,       // re-draw in place at fps, a hand-animated jitter (never under reduced motion or ?freeze)
  boilAmp: 0.4,     // how far a re-drawn stroke lands from the last, CSS px
  fps: 7,           // boil frames a second
};
export const PENCIL_RANGE = { pressure: [0, 1], wobble: [0, 3], overshoot: [0, 12], retrace: [0, 1], constructLen: [0, 60], hatch: [0, 2], spacing: [2, 10],
  angle: [0, 180], cross: [20, 90], grain: [0, 1], paper: [0, 1], smudge: [0, 1], eraser: [0, 1], heroBase: [0, 1], boilAmp: [0, 2], fps: [2, 12] };
const BOOLS = ['construct', 'boil'];
/** Merges settings (an object, or 'k:v,k:v') into a copy of base, each clamped to its range; unknown keys are dropped. */
export function pencilWith(base, v) {
  const o = typeof v === 'string' ? Object.fromEntries(v.split(',').map((kv) => kv.split(':').map((x) => x.trim())).filter((kv) => kv.length === 2)) : v || {}, out = { ...base };
  for (const [k, x] of Object.entries(o)) {
    if (BOOLS.includes(k)) out[k] = x === true || x === 'true' || x === '1' || x === 1;
    else if (PENCIL_RANGE[k] && Number.isFinite(+x)) out[k] = clamp(+x, ...PENCIL_RANGE[k]);
  }
  return out;
}

// the one pencil: its weight (CSS px) never changes; pressure moves within it
const WEIGHT = 1.3, HATCH_W = 0.8;
// the engine's line tones as graphite strength and width (a trailing '~' is the thin line)
const TONE_A = { hi: 1, edge: 0.88, mid: 0.6, lo: 0.42 };
// graphite per plate: a warm near-black graphite on light that pressure, grain and taper keep grey on screen; silver on dark
const INK = { light: { ink: '#0b0908', sheen: '#111216', dot: '#6b6560' }, dark: { ink: '#c2baab', sheen: '#747a8a', dot: '#a9a59e' } };

// ---------- colour helpers (this file stands alone: no code from linejig-pro.js) ----------
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (h) => rgbOf(h).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const hsl = (h, dS = 0, dL = 0) => { const c = new THREE.Color(h), o = {}; c.getHSL(o, THREE.SRGBColorSpace);
  return '#' + new THREE.Color().setHSL(o.h, clamp(o.s + dS), clamp(o.l + dL), THREE.SRGBColorSpace).getHexString(THREE.SRGBColorSpace); };
// the brand pencil: the brand itself for the hatching (full chroma); its outline a pressed step darker on light, a step lighter on dark
// on black paper the coloured pencil is a step lighter, or a thin orange mark over black reads brown
const heroTones = (c, dark) => ({ hatch: dark ? hsl(c, 0.06, 0.1) : c, line: dark ? hsl(c, 0.06, 0.12) : hsl(c, 0.06, -0.1) });

// ---------- GLSL shared: hashes, value noise, the paper's tooth (canvas-anchored, CSS px) ----------
const NOISE = `
  float h1(float p) { p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float h2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
  uniform float dpr, cssH; uniform vec2 org;
  // the paper: in the page's own CSS px (org: where this canvas sits in the document), periodic over 256 px so a page can tile it
  vec2 paperXY() { vec2 fc = gl_FragCoord.xy / dpr; return mod(vec2(fc.x, cssH - fc.y) + org, 256.); }
  float vnp(vec2 p, vec2 per) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h2(mod(i, per)), h2(mod(i + vec2(1, 0), per)), f.x), mix(h2(mod(i + vec2(0, 1), per)), h2(mod(i + vec2(1, 1), per)), f.x), f.y); }
  float tooth() { vec2 p = paperXY(); return .5 * vnp(p / 2., vec2(128.)) + .3 * vnp(p / 6.4 + 17., vec2(40.)) + .2 * vnp(p / 16. + 41., vec2(16.)); }
  // graphite on tooth: light pressure only touches the peaks, a heavier mark fills the valleys
  float bite(float a, float grain) { float t = tooth(); return a * mix(1., smoothstep(.22, .72, t + .45 * a - .2), grain); }`;

// ---------- strokes: ribbons in plate units, widened, wobbled and tapered on the GPU ----------
const STROKE_VS = `
  attribute vec2 c, nrm, w2, kk; attribute vec3 sek; attribute float sp, L, seed, tl, ta, tw; attribute vec3 flags;
  uniform float ppx, wob, over, cLen, boil, boilA;
  varying float vS, vL, vSide, vG, vKind, vT, vTa, vTw, vFine, vDash, vSeed; varying vec2 vK, vW;
  ${NOISE.split('uniform float dpr')[0]}
  float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h1(i), h1(i + 1.), f); }
  void main() {
    float side = sek.x, ext = sek.y, kind = sek.z;
    vec2 t = vec2(nrm.y, -nrm.x);
    float k = ext < 0. ? kk.x : kk.y;
    float len = ext == 0. ? 0. : (kind > 1.5 ? cLen : over * k);   // CSS px past the end: overshoot, or a construction line's run
    float s = sp + ext * len * ppx;                                   // the stroke coordinate, plate units
    vec2 p = c + t * ext * len * ppx;
    float sd = seed;
    // the wobble, read from the parameter that moves with the line, so it stays put while the figure turns
    float wb = (vn(w2 / 11. + sd) - .5) * 1.6 + (vn(w2 / 4. + sd * 1.7 + 9.) - .5) * .5;
    float u = clamp(s / max(L, 1e-3), 0., 1.), bow = (h1(sd * 3.1) - .5) * 2. * sin(3.14159 * u) * min(L, 90.) * .010;   // a hand stroke is a shallow arc
    float retr = kind > .5 && kind < 1.5 ? (h1(sd * 5.7) - .5) * 1.4 : 0.;   // the second pass sits a hair off the first
    float bj = boilA > 0. ? (vn(w2 / 9. + boil * 7.13 + sd) - .5) * 2. * boilA : 0.;   // boil: the stroke re-drawn in place, a hair off the last
    p += nrm * ((wb * wob * (kind > 1.5 ? .4 : 1.) + retr + bj) * ppx + (kind > 1.5 ? 0. : bow));
    float g = .5 * ${WEIGHT.toFixed(2)} * 1.7 + 1.;                     // the ribbon's half width, CSS px (widest pressure plus a pixel to blend)
    p += nrm * side * g * ppx;
    vS = s; vL = L; vSide = side; vG = g; vKind = kind; vT = tl; vTa = ta; vTw = tw; vFine = flags.y; vDash = flags.z; vSeed = sd; vK = kk; vW = w2;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, position.z, 1.); }`;
const STROKE_FS = `
  uniform float ppx, pressure, grain, now, whole, fine, alpha, retrace, construct, dash, gap, heroA, dark;
  uniform vec3 cInk, cHeroLine;
  varying float vS, vL, vSide, vG, vKind, vT, vTa, vTw, vFine, vDash, vSeed; varying vec2 vK, vW;
  ${NOISE}
  void main() {
    if (whole < .5 && vT > now) discard;                             // the draw-on
    if (vFine > .5 && fine < .5) discard;                            // fine detail only on a big plate
    float sx = vS / ppx, Lx = vL / ppx;                              // CSS px along the stroke
    // pressure: the pencil lands (a quick press), runs with a slow swell and lifts off over the end
    float pin = mix(1., .5 + .5 * smoothstep(-3., 5., sx), vK.x), pout = mix(1., .18 + .82 * (1. - smoothstep(Lx - 20., Lx + 3., sx)), vK.y);
    float swell = 1. + (vn(vW / 22. + vSeed * 2.3) - .5) * 1.3;
    float pr = clamp(pin * pout * swell, 0., 1.4); pr = mix(1., pr, pressure);
    float kind = vKind;
    float wpx = ${WEIGHT.toFixed(2)} * vTw * (kind > 1.5 ? .7 : 1.) * (.5 + .55 * pr) * (dark > .5 ? 1.12 : 1.);   // on black paper the pencil presses harder
    float d = abs(vSide) * vG, hw = .5 * wpx;
    float cov = clamp(hw + .5 - d, 0., 1.) * min(1., wpx);
    float a = cov * vTa * (.4 + .6 * min(pr, 1.)) * (dark > .5 ? 1.3 : 1.);
    a *= .8 + .2 * vn(vec2(sx * .45, vSide * 2. + vSeed));          // graphite streaks along the stroke
    if (vDash > .5 && fract(sx / (dash + gap)) > dash / (dash + gap)) discard;
    if (kind > .5 && kind < 1.5) a *= retrace;
    if (kind > 1.5) a *= construct * .3;
    a = bite(a, grain);
    if (a < .004) discard;
    gl_FragColor = vec4(mix(cInk, cHeroLine, heroA), min(1., a) * alpha);
    #include <colorspace_fragment>
  }`;

// ---------- hatching: in each face's own plane (uv in plate units, fixed to the face), tone from the light ----------
const HATCH_VS = `attribute vec2 fuv, np; attribute vec3 raw; attribute float tone, mode, seed, curv;
  varying vec2 vUv, vNp; varying vec3 vRaw; varying float vTone, vMode, vSeed, vCurv;
  void main() { vUv = fuv; vNp = np; vRaw = raw; vTone = tone; vMode = mode; vSeed = seed; vCurv = curv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const HATCH_FS = `
  uniform float pitch, angle, cross, hatch, grain, smudge, eraser, heroBase, wob, alpha, boil, boilA, ppx, pressure, dark, heroA, az, ke;
  uniform vec3 cInk, cSheen, cHero;
  varying vec2 vUv, vNp; varying vec3 vRaw; varying float vTone, vMode, vSeed, vCurv;
  ${NOISE}
  float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h1(i), h1(i + 1.), f); }
  // one layer of hatching: short parallel strokes, each with its own start, length, tilt, wobble and pressure; a stroke
  // shows when its rank is under the layer's density, so tone grows by adding strokes, never by greying them
  float layer(vec2 uv, float ang, float dens, float sd) {
    if (dens <= 0.) return 0.;
    float ca = cos(ang), sa = sin(ang);
    vec2 q = vec2(ca * uv.x + sa * uv.y, -sa * uv.x + ca * uv.y) / pitch;
    float i = floor(q.y), ri = h2(vec2(i, sd));
    float sl = mix(4., 9., h2(vec2(i, sd + 3.))), x = q.x / sl + ri * 7.;
    // lines come in by halving: every eighth line first, then the ones between, so a light tone is a few whole lines, not specks
    float lr = mod(i, 2.) * .5 + mod(floor(i / 2.), 2.) * .25 + mod(floor(i / 4.), 2.) * .125;
    float j = floor(x), fx = fract(x), rj = lr * .86 + h2(vec2(i * 7.31 + j, sd + 11.)) * .14;
    float vis = smoothstep(rj - .05, rj + .02, dens);
    if (vis <= 0.) return 0.;
    float tilt = (h2(vec2(j, i + sd)) - .5) * .45, off = tilt * (fx - .5) + (n1(q.x * .8 + ri * 31.) - .5) * .16 * wob;
    if (boilA > 0.) off += (h2(vec2(j + boil * 13.1, i + sd)) - .5) * 1.2 * boilA * ppx / pitch;   // boil: each stroke re-drawn a hair off
    float fy = q.y - i - .5 - off, fw = fwidth(q.y);
    float e = clamp(fx * 1.08 - .04, 0., 1.), prs = mix(1., pow(sin(3.14159 * e), .6), .5 + .5 * pressure);   // tapered both ends, fullest mid-stroke
    if (e <= 0. || e >= 1.) return 0.;
    float hw = .5 * ${HATCH_W.toFixed(2)} * dpr * (.55 + .45 * prs), d = abs(fy) / fw;
    float a = clamp(hw + .5 - d, 0., 1.) * min(1., 2. * hw) * vis * (.5 + .5 * prs);
    return a * (1. - smoothstep(.3, .6, fw));                       // a face turned edge-on fades instead of turning to moire
  }
  void main() {
    float t = vTone, curv = vCurv; vec2 uv = vUv;
    if (vMode > .5) {                                              // a raw fill: printed round a vertical axis through its own box
      // (x' across the box is sin of the angle round the part; u is that angle plus the view's azimuth, times the half
      // width, and v its height with the ellipse taken out), so the strokes turn with the part as the view orbits
      float xp = clamp(vRaw.x / vRaw.z, -1., 1.);
      uv = vec2(vRaw.z * (asin(xp) + az), vRaw.y - vRaw.z * ke * sqrt(1. - xp * xp)); curv = 1.;
      vec2 r = vNp - vec2(-.45, -.55); t = smoothstep(.25, 1.75, length(r)) * .9;   // form shading from the light (view-fixed)
    }
    if (dark > .5) t = .95 * (1. - t);                            // white pencil on black paper draws the light, not the shadow
    float sd = vSeed;
    float th = mix(t, mix(.3, 1., t), heroA);
    float base = curv > .5 ? 1.5708 : radians(angle);              // round walls: along the axis, the cross round it
    float lo = dark > .5 ? .2 : .3;
    float a1 = layer(uv, base, clamp((th - lo) * 1.6, 0., 1.) * hatch, sd);
    float a2 = layer(uv, base + radians(curv > .5 ? 90. : cross), clamp((th - lo - .28) * 1.9, 0., 1.) * hatch, sd + 17.);
    float aS = smudge * .3 * smoothstep(.6, .97, th) * (.55 + .45 * vn(uv / 9. + sd)) * (1. - heroA) * (dark > .5 ? .5 : 1.);   // on black: a soft burnish on the lit faces
    float aB = heroA * heroBase * (dark > .5 ? .6 : .45);          // the hero's burnished layer
    float k1 = mix(dark > .5 ? .85 : .6, .8, heroA), k2 = mix(dark > .5 ? .7 : .5, .7, heroA);
    float a = 1. - (1. - a1 * k1) * (1. - a2 * k2);
    a = bite(a, grain);
    aS *= mix(1., tooth(), .3); aB = bite(aB, grain);
    if (heroA > 0. && eraser > 0. && dark < .5) {                  // the eraser-clean highlight, lifted out of the lit faces
      vec2 q = vec2(cos(-.6) * uv.x + sin(-.6) * uv.y, 0.);
      float band = abs(fract(q.x / 70. + vSeed * .13) - .5) * 70., edge = 2.2 + 1.6 * (vn(uv / 3.) - .5);
      float m = (1. - smoothstep(edge, edge + 1.6, band)) * (1. - smoothstep(.35, .6, t)) * eraser * heroA;
      a *= 1. - m; aB *= 1. - m;
    }
    float A = 1. - (1. - a) * (1. - aS) * (1. - aB);
    if (A < .004) discard;
    vec3 col = mix(mix(cInk, cSheen, aS / max(A, 1e-4)), cHero, heroA);
    gl_FragColor = vec4(col, A * alpha);
    #include <colorspace_fragment>
  }`;
const PAPER_FS = `uniform float amt, dark; ${NOISE}
  void main() { vec2 p = paperXY();                                // tooth plus a faint fibre, all periodic over 256 px
    float v = (vnp(p / 1.6, vec2(160.)) - .5) * .7 + (vnp(p / 4. + 9., vec2(64.)) - .5) * .3 + (vnp(p * vec2(.0625, .625) + 3., vec2(16., 160.)) - .5) * .3;
    gl_FragColor = vec4(vec3(step(0., v)), abs(v) * 2. * amt * (dark > .5 ? .045 : .05));
    #include <colorspace_fragment>
  }`;
const QUAD_VS = 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }';
/** The paper as a 256 CSS px tile on the given plate (a data URL), for a page background that continues the figures' paper:
    html { background: url(tile) 0 0 / 256px 256px; } with each figure's canvas finding its own place in the document. */
export function paperTile({ plate = '#f7f7f8', amt = PENCIL.paper, dark = false, dpr = Math.min(2, globalThis.devicePixelRatio || 1) } = {}) {
  const n = Math.round(256 * dpr), cv = document.createElement('canvas'); cv.width = cv.height = n;
  const r = new THREE.WebGLRenderer({ canvas: cv, alpha: false, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(n, n, false); r.setClearColor(plate, 1);
  const mat = new THREE.ShaderMaterial({ uniforms: { amt: { value: amt }, dark: { value: dark ? 1 : 0 }, dpr: { value: dpr }, cssH: { value: 256 }, org: { value: new THREE.Vector2() } },
    transparent: true, depthTest: false, depthWrite: false, vertexShader: QUAD_VS, fragmentShader: PAPER_FS });
  const sc = new THREE.Scene(), g = new THREE.PlaneGeometry(2, 2); sc.add(new THREE.Mesh(g, mat)); r.render(sc, new THREE.Camera());
  const url = cv.toDataURL('image/png'); mat.dispose(); g.dispose(); r.dispose(); r.forceContextLoss(); return url;
}

// ---------- small geometry helpers (plate units) ----------
const area = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return a / 2; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], len = (v) => Math.hypot(v[0], v[1]);
const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const nrm3 = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
const seedOf = (k) => { let h = 2166136261; for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619); return (h >>> 0) % 9973 / 9.973; };
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function centroid(P) { let A = 0, cx = 0, cy = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const f = P[j][0] * P[i][1] - P[i][0] * P[j][1]; A += f; cx += (P[j][0] + P[i][0]) * f; cy += (P[j][1] + P[i][1]) * f; }
  if (Math.abs(A) < 1e-9) return P.reduce((s, q) => [s[0] + q[0] / P.length, s[1] + q[1] / P.length], [0, 0]); return [cx / (3 * A), cy / (3 * A)]; }

function mountPencil(X) {
  const K = X.K;
  const on = () => !!X.style.pencil;
  let PS = pencilWith(pencilWith(PENCIL, X.fig.pencil), X.Q.get('pencil') || '');
  const SU = { ppx: { value: 1 }, dpr: { value: 1 }, wob: { value: 1 }, over: { value: 4 }, cLen: { value: 22 }, boil: { value: 0 }, boilA: { value: 0 }, cssH: { value: 1 }, org: { value: new THREE.Vector2() }, pressure: { value: 0.6 },
    grain: { value: 0.6 }, now: { value: 0 }, whole: { value: 1 }, fine: { value: 1 }, retrace: { value: 0.3 }, construct: { value: 1 }, dash: { value: 4 }, gap: { value: 4 },
    cInk: { value: new THREE.Color() }, cSheen: { value: new THREE.Color() }, cHero: { value: new THREE.Color() }, cHeroLine: { value: new THREE.Color() },
    pitch: { value: 4 }, angle: { value: 52 }, cross: { value: 72 }, hatch: { value: 1 }, smudge: { value: 0.5 }, eraser: { value: 0.8 }, heroBase: { value: 0.3 }, dark: { value: 0 } };
  const apply = () => { SU.wob.value = PS.wobble; SU.over.value = PS.overshoot; SU.cLen.value = PS.constructLen; SU.pressure.value = PS.pressure; SU.grain.value = PS.grain;
    SU.retrace.value = PS.retrace; SU.construct.value = PS.construct ? 1 : 0; SU.angle.value = PS.angle; SU.cross.value = PS.cross; SU.hatch.value = PS.hatch;
    SU.smudge.value = PS.smudge; SU.eraser.value = PS.eraser; SU.heroBase.value = PS.heroBase; };
  apply();
  // a part's material: its own heroA (0 graphite .. 1 brand pencil), driven by the engine's accent fade for that part
  // (X.tint calls userData.tint with the part's outline and hero amounts, every frame while it fades)
  const heroTint = (m, aO, aH) => { m.uniforms.heroA.value = aH; };
  const partMat = (p, o) => { const m = new THREE.ShaderMaterial({ uniforms: { ...SU, alpha: { value: 1 }, heroA: { value: p.hero ? 1 : 0 } }, transparent: true, depthWrite: false,
      side: THREE.DoubleSide, extensions: { derivatives: true }, ...o });
    m.userData.fk = { k: p.part }; m.userData.tint = heroTint; X.extra.add(m); X.tint(m); return m; };
  const dropMat = (o) => { X.extra.delete(o.material); o.material.dispose(); };
  const strokeMat = (p) => partMat(p, { vertexShader: STROKE_VS, fragmentShader: STROKE_FS });
  const paper = (() => { const mat = new THREE.ShaderMaterial({ uniforms: { amt: { value: 0 }, dark: { value: 0 }, dpr: SU.dpr, cssH: SU.cssH, org: SU.org }, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: QUAD_VS, fragmentShader: PAPER_FS });
    const sc = new THREE.Scene(), m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); m.frustumCulled = false; sc.add(m); return { sc, mat }; })();
  const quadCam = new THREE.Camera();
  let DARK = false, FITW = 0; const BL = { t: 0, dv: '', moved: 0, m: 0 };
  const boiling = () => on() && PS.boil && PS.boilAmp > 0 && !X.reduced && !X.exporting && K.FREEZE === Infinity;   // never under reduced motion, ?freeze or an export
  const ppxNow = () => { const w = X.cam.right - X.cam.left; return X.W > 0 && Number.isFinite(w) && w > 0 ? w / X.W : 1; };
  const fitW = () => FITW ||= (() => { const ps = X.fig.fit.points(K).map((q) => K.P(...q)), xs = ps.map((q) => q[0]); return Math.max(...xs) - Math.min(...xs) || 200; })();
  const pitchNow = () => { const PW = Math.max(40, Math.floor(Math.min(X.W - 32, (X.H - 32) * 1.25, X.H))); return PS.spacing * 400 / PW; };   // CSS px at the fitted plate, in plate units

  // ---------- light: from the upper left of the viewer, a little in front (an illustrator's light, so every view reads) ----------
  function light() {
    const DV = K.DV, R = nrm3([DV[1], -DV[0], 0]), U = [R[1] * DV[2] - R[2] * DV[1], R[2] * DV[0] - R[0] * DV[2], R[0] * DV[1] - R[1] * DV[0]];   // right, up
    return nrm3([0, 1, 2].map((i) => -0.5 * R[i] + 0.8 * U[i] + 0.35 * DV[i]));
  }
  const toneOf = (n, L) => Math.pow(clamp((0.72 - (n[0] * L[0] + n[1] * L[1] + n[2] * L[2])) / 1.3), 1.1);

  // ---------- strokes from a primitive's lines ----------
  // A line becomes one or more strokes: split at sharp corners (so the ends cross or stop short there), and a closed
  // loop with no corner gets one seam where the pencil starts and finishes. k at each end (0..1) grows with the corner's
  // sharpness, so overshoot and the lift fade in continuously as a corner sharpens while the figure turns.
  const CORNER = 30, SHARP = 68;
  function strokesOf(l, ppx, sd) {
    let pts = []; for (const q of l.pts) { const v = [q[0], -q[1]]; if (!pts.length || len(sub(v, pts[pts.length - 1])) > 1e-3) pts.push(v); }
    const closed = !!l.closed;
    if (closed && pts.length > 2 && len(sub(pts[0], pts[pts.length - 1])) < 1e-3) pts.pop();
    if (pts.length < 2) return [];
    // simplify: drop points closer than 1.2 px to the last kept one, so a tiny rounded corner reads as one corner
    const tol = 1.2 * ppx, sp = [pts[0]];
    for (let i = 1; i < pts.length; i++) if (len(sub(pts[i], sp[sp.length - 1])) >= tol || (!closed && i === pts.length - 1)) sp.push(pts[i]);
    if (!closed && sp.length >= 2 && sp[sp.length - 1] !== pts[pts.length - 1]) sp[sp.length - 1] = pts[pts.length - 1];
    pts = sp; const n = pts.length; if (n < 2) return [];
    // the wobble parameter: arc length on an open line; on a closed one the angle round its centroid times its mean radius
    // (a point on a circle, so the pattern has no seam and does not jump when the line's first sample moves)
    let W2;
    if (closed && n > 2) { const C = centroid(pts); let P = 0; for (let i = 0; i < n; i++) P += len(sub(pts[(i + 1) % n], pts[i])); const R = P / (2 * Math.PI);
      W2 = pts.map((q) => { const a = Math.atan2(q[1] - C[1], q[0] - C[0]); return [Math.cos(a) * R, Math.sin(a) * R]; }); }
    else { let s = 0; W2 = pts.map((q, i) => { if (i) s += len(sub(q, pts[i - 1])); return [s, sd * 3]; }); }
    const turn = (i) => { const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n], u = sub(b, a), v = sub(c, b), lu = len(u), lv = len(v);
      if (lu < 1e-6 || lv < 1e-6) return 0; return Math.acos(clamp((u[0] * v[0] + u[1] * v[1]) / (lu * lv), -1, 1)) / Math.PI * 180; };
    let corners = [];
    for (let i = closed ? 0 : 1; i < (closed ? n : n - 1); i++) { const t = turn(i); if (t > CORNER) corners.push({ i, k: sstep(CORNER, SHARP, t) }); }
    // no stroke shorter than 7 px: drop the weaker corner of any short piece
    const minL = 7 * ppx, segLen = (a, b) => { let s = 0; for (let i = a; i !== b; i = (i + 1) % n) s += len(sub(pts[(i + 1) % n], pts[i])); return s; };
    for (let guard = 0; guard < 200 && corners.length > (closed ? 1 : 0); guard++) {
      let worst = -1;
      const m = corners.length, ends = closed ? m : m + 1;
      for (let j = 0; j < ends; j++) {
        const a = closed ? corners[j].i : j === 0 ? 0 : corners[j - 1].i, b = closed ? corners[(j + 1) % m].i : j === m ? n - 1 : corners[j].i;
        if (segLen(a, b) < minL) { const ca = closed ? corners[j] : corners[j - 1], cb = closed ? corners[(j + 1) % m] : corners[j];
          worst = !ca ? corners.indexOf(cb) : !cb ? corners.indexOf(ca) : corners.indexOf(ca.k < cb.k ? ca : cb); break; }
      }
      if (worst < 0) break; corners.splice(worst, 1);
    }
    const out = [];
    const piece = (a, b, kS, kE) => { const P = [], w = []; for (let i = a; ; i = (i + 1) % n) { P.push(pts[i]); w.push(W2[i]); if (i === b) break; } return { P, w, kS, kE }; };
    if (!closed) {
      const cut = [0, ...corners.map((c) => c.i), n - 1], ks = [1, ...corners.map((c) => c.k), 1];
      for (let j = 0; j + 1 < cut.length; j++) out.push(piece(cut[j], cut[j + 1], ks[j], ks[j + 1]));
    } else if (corners.length >= 2) {
      for (let j = 0; j < corners.length; j++) { const a = corners[j], b = corners[(j + 1) % corners.length]; out.push(piece(a.i, b.i, a.k, b.k)); }
    } else {
      // one seam: at a seeded angle round the centroid (a stable place on the loop), or at its one corner
      let s0;
      if (corners.length === 1) s0 = corners[0].i;
      else { const C = centroid(pts), th = sd * 2.39996; let best = Infinity; s0 = 0;
        for (let i = 0; i < n; i++) { const a = Math.atan2(pts[i][1] - C[1], pts[i][0] - C[0]), d = Math.abs(((a - th) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); if (d < best) { best = d; s0 = i; } } }
      const p = piece(s0, (s0 + n - 1) % n, 1, 1); p.P.push(pts[s0]); p.w.push(W2[s0]); out.push(p);
    }
    return out;
  }
  // resample a stroke to at most step plate units between points (the wobble lives on its vertices)
  function resample(P, w, step) {
    const oP = [P[0]], ow = [w[0]];
    for (let i = 1; i < P.length; i++) { const d = len(sub(P[i], P[i - 1])), m = Math.min(400, Math.max(1, Math.ceil(d / Math.max(step, 0.05))));
      for (let k = 1; k <= m; k++) { const f = k / m; oP.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f]); ow.push([w[i - 1][0] + (w[i][0] - w[i - 1][0]) * f, w[i - 1][1] + (w[i][1] - w[i - 1][1]) * f]); } }
    return [oP, ow];
  }
  // a ribbon for one stroke into the attribute arrays A
  function ribbon(A, P, w, o) {
    const n = P.length; if (n < 2) return;
    const s = [0]; for (let i = 1; i < n; i++) s.push(s[i - 1] + len(sub(P[i], P[i - 1])));
    const L = s[n - 1]; if (L < 1e-4) return;
    const tan = (i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], d = sub(b, a), l = len(d) || 1; return [d[0] / l, d[1] / l]; };
    const put = (q, t, si, ext, wi) => { for (const side of [-1, 1]) {
      A.pos.push(0, 0, o.z); A.c.push(q[0], q[1]); A.nrm.push(-t[1], t[0]); A.sek.push(side, ext, o.kind); A.sp.push(si); A.L.push(L); A.w2.push(wi[0], wi[1]);
      A.kk.push(o.kS, o.kE); A.seed.push(o.seed); A.tl.push(o.t0 + o.TW * clamp(si / L)); A.ta.push(o.ta); A.tw.push(o.tw); A.flags.push(o.hero, o.fine, o.dash); } };
    const v0 = A.c.length / 2;
    put(P[0], tan(0), 0, -1, w[0]);
    for (let i = 0; i < n; i++) put(P[i], tan(i), s[i], 0, w[i]);
    put(P[n - 1], tan(n - 1), L, 1, w[n - 1]);
    for (let j = 0; j < n + 1; j++) { const a = v0 + 2 * j; A.idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  const newA = () => ({ pos: [], c: [], nrm: [], sek: [], sp: [], L: [], w2: [], kk: [], seed: [], tl: [], ta: [], tw: [], flags: [], idx: [] });
  function meshOf(A, mat) {
    const g = new THREE.BufferGeometry(); g.setIndex(A.idx);
    for (const [k, n] of [['pos', 3], ['c', 2], ['nrm', 2], ['sek', 3], ['sp', 1], ['L', 1], ['w2', 2], ['kk', 2], ['seed', 1], ['tl', 1], ['ta', 1], ['tw', 1], ['flags', 3]])
      g.setAttribute(k === 'pos' ? 'position' : k, new THREE.Float32BufferAttribute(A[k], n));
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
    Object.assign(m.userData, { drop: dropMat, fade: (o, a) => { o.material.uniforms.alpha.value = a; } });
    return m;
  }
  function primLines(p, lines, z, N, startOf, TW) {
    if (!on()) return undefined;
    const ppx = ppxNow(), hero = 0, tk = p.tone.replace('~', ''), thin = p.tone.endsWith('~');
    const A = newA(), base = p.part + '#' + p.ord, fw = fitW();
    const ta = (TONE_A[tk] ?? 0.7) * (thin ? 0.8 : 1) * (p.ink && DARK ? 0.5 : 1), tw = thin ? 0.62 : 1, sil = !!(p.fill && p.fill.length > 2);
    lines.forEach((l, li) => {
      const sd = seedOf(base + '#' + li), t0 = startOf(l);
      for (const [si, st] of strokesOf(l, ppx, sd).entries()) {
        const [P, w] = resample(st.P, st.w, 4 * ppx), o = { z, kind: 0, kS: st.kS, kE: st.kE, seed: sd + si * 0.618, t0, TW, ta, tw, hero, fine: p.o.fine ? 1 : 0, dash: p.o.dash ? 1 : 0 };
        ribbon(A, P, w, o);
        let Ls = 0; for (let i = 1; i < st.P.length; i++) Ls += len(sub(st.P[i], st.P[i - 1]));
        // the second pass: silhouettes only, and only strokes long enough to have been gone over
        if (sil && !p.o.dash && tk !== 'lo' && Ls > 12 * ppx) ribbon(A, P, w, { ...o, kind: 1, seed: o.seed + 0.37, ta: ta * 0.9 });
        // construction lines: past the long straight edges only (a fifth of the object's width or more), fading in with length
        if (!p.o.dash && !p.o.fine && tk !== 'lo' && st.P.length >= 2) {
          const a = st.P[0], b = st.P[st.P.length - 1], ch = len(sub(b, a));
          if (ch > 0.14 * fw) { let dev = 0; const e = [(b[0] - a[0]) / ch, (b[1] - a[1]) / ch];
            for (const q of st.P) dev = Math.max(dev, Math.abs((q[0] - a[0]) * e[1] - (q[1] - a[1]) * e[0]));
            if (dev < Math.max(0.6 * ppx, 0.006 * ch)) ribbon(A, [a, b], [st.w[0], st.w[st.w.length - 1]], { ...o, kind: 2, kS: 1, kE: 1, seed: o.seed + 0.71, ta: ta * sstep(0.14 * fw, 0.22 * fw, ch) }); }
        }
      }
    });
    if (!A.idx.length) return [];
    return [meshOf(A, strokeMat(p))];
  }

  // ---------- faces: the visible walls and cap of a solid, with uv in the face's plane and a tone from the light ----------
  function facesExact(p, L) {
    const { F, ring, w0, w1 } = p.o.solid, P = K.P, S = K.S, DV = K.DV, up = K.dot(F.W, DV) >= 0, wc = up ? w1 : w0, wb = up ? w0 : w1;
    const out = [], scr = (q, w) => P(...K.at3(F, q.u, q.v, w)), lu = Math.hypot(...F.U), lv = Math.hypot(...F.V);
    const n = ring.length, Wd = ring.map((q) => K.at3(F, q.u, q.v, wc)), arc = [0];
    for (let k = 1; k <= n; k++) arc.push(arc[k - 1] + d3(Wd[k - 1], Wd[k % n]) * S);
    let maxSeg = 0; for (let k = 1; k <= n; k++) maxSeg = Math.max(maxSeg, arc[k] - arc[k - 1]);
    const curv = maxSeg / (arc[n] || 1) < 0.06 ? 1 : 0;            // a round wall (no long flat side): hatched along its axis
    const nOf = (q) => nrm3([0, 1, 2].map((j) => q.nu * F.U[j] + q.nv * F.V[j]));
    const h = Math.abs(w1 - w0) * Math.hypot(...F.W) * S;
    const vis = K.run(ring, K.faces(F));
    if (vis.length >= 2 && h > 0.3) for (let i = 0; i + 1 < vis.length; i++) {
      const a = vis[i], b = vis[i + 1], ia = ring.indexOf(a), ib = ring.indexOf(b), ua = arc[ia], ub = ib === 0 ? arc[n] : arc[ib];
      const ta = toneOf(nOf(a), L), tb = toneOf(nOf(b), L);
      out.push({ q: [scr(a, wc), scr(b, wc), scr(b, wb), scr(a, wb)], uv: [[ua, 0], [ub, 0], [ub, h], [ua, h]], tone: [ta, tb, tb, ta], curv });
    }
    // the cap: the ring at the visible end, uv from the frame's own axes
    const nT = nrm3(up ? F.W : F.W.map((x) => -x));
    out.push({ poly: ring.map((q) => scr(q, wc)), uv: ring.map((q) => [q.u * lu * S, q.v * lv * S]), tone: toneOf(nT, L), curv: 0 });
    return out;
  }
  // a figure's own prism (a fill and its cap, no frame): the extrusion along a world axis, found as the axis whose swept
  // cap best holds the silhouette (as Readout does); walls get uv from arc length round the cap, tone from a 2D normal
  function facesInferred(p, L) {
    const P = K.P, o0 = P(0, 0, 0), S = K.S, T = p.o.top, Sil = p.fill;
    const axis = (v) => sub(P(...v), o0), aS = Math.abs(area(Sil)); let best = null;
    for (const [wi, wv] of [[2, [0, 0, -1]], [0, [1, 0, 0]], [0, [-1, 0, 0]], [1, [0, 1, 0]], [1, [0, -1, 0]], [2, [0, 0, 1]]]) {
      const ax = axis(wv), al = len(ax); if (al < 1e-6) continue; const e = [ax[0] / al, ax[1] / al];
      const pr = (q) => q[0] * e[0] + q[1] * e[1], h = Math.max(...Sil.map(pr)) - Math.max(...T.map(pr)); if (h < 0.4) continue;
      const a = Math.abs(area(hull(T.concat(T.map((q) => [q[0] + e[0] * h, q[1] + e[1] * h])))));
      if (a >= aS * 0.97 && (!best || a < best.a)) best = { a, e, h, al, wi, wv };
    }
    const out = [], nw = best ? best.wv.map(Math.abs) : [0, 0, 1];
    const W3 = T.map((q) => K.onPlane(q, [0, 0, 0], nw)), other = [0, 1, 2].filter((i) => !nw[i]);
    const nT = best ? best.wv.map((x) => -x) : [0, 0, 1];
    out.push({ poly: T, uv: W3.map((q) => [q[other[0]] * S, q[other[1]] * S]), tone: toneOf(nT, L), curv: 0 });
    if (!best) return out;
    const { e, h, al } = best, Hc = hull(T), onHull = new Set(Hc), n = T.length, C = Hc.reduce((s, q) => [s[0] + q[0] / Hc.length, s[1] + q[1] / Hc.length], [0, 0]);
    const out2 = (a, b) => { const d = sub(b, a), l = len(d) || 1, m = [d[1] / l, -d[0] / l]; return (m[0] * ((a[0] + b[0]) / 2 - C[0]) + m[1] * ((a[1] + b[1]) / 2 - C[1])) < 0 ? [-m[0], -m[1]] : m; };
    const arc = [0]; for (let k = 1; k <= n; k++) arc.push(arc[k - 1] + d3(W3[k - 1], W3[k % n]) * S);
    // the wall's world normal: its 2D outward normal read back through the view's right and toward-viewer axes
    const DV = K.DV, R = nrm3([DV[1], -DV[0], 0]);
    const hw = h / al * S;
    for (let k = 0; k < n; k++) { const a = T[k], b = T[(k + 1) % n]; if (!onHull.has(a) || !onHull.has(b) || len(sub(a, b)) < 1e-4) continue;
      const m = out2(a, b); if (m[0] * e[0] + m[1] * e[1] <= 0.02) continue;
      const nn = nrm3([0, 1, 2].map((i) => m[0] * 0.8 * R[i] + 0.6 * DV[i]));
      const t = toneOf(nn, L);
      out.push({ q: [a, b, [b[0] + e[0] * h, b[1] + e[1] * h], [a[0] + e[0] * h, a[1] + e[1] * h]], uv: [[arc[k], 0], [arc[k + 1], 0], [arc[k + 1], hw], [arc[k], hw]], tone: [t, t, t, t], curv: 0 }); }
    return out;
  }
  const hatchDrop = dropMat, hatchFade = (m, a) => { m.material.uniforms.alpha.value = a; };
  function primMesh(p, z) {
    if (!on()) return undefined;
    if (p.o.fillTone || p.o.dash) return [];
    const L = light(), seed = seedOf(p.part + '#' + p.ord);
    let faces;
    if (p.o.solid) faces = facesExact(p, L);
    else if (p.o.top && p.o.top.length > 2) faces = facesInferred(p, L);
    else {                                                   // a raw fill: hatched in screen space from its own box, form-shaded
      const xs = p.fill.map((q) => q[0]), ys = p.fill.map((q) => q[1]), bx = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      const cx = (bx[0] + bx[1]) / 2, cy = (bx[2] + bx[3]) / 2, rx = Math.max(1, (bx[1] - bx[0]) / 2), ry = Math.max(1, (bx[3] - bx[2]) / 2);
      if (rx * ry < 4) return [];
      faces = [{ poly: p.fill, uv: p.fill.map((q) => [q[0] - cx, q[1] - cy]), np: p.fill.map((q) => [(q[0] - cx) / rx, (q[1] - cy) / ry]), raw: p.fill.map((q) => [q[0] - cx, q[1] - cy, rx]) }];
    }
    const pos = [], uv = [], np = [], rw = [], tone = [], mode = [], sd = [], cv = [], idx = []; let v = 0;
    const vert = (q, u, t, m, c, n2, r3) => { pos.push(q[0], -q[1], z); uv.push(u[0], u[1]); np.push(n2 ? n2[0] : 0, n2 ? -n2[1] : 0); rw.push(...(r3 || [0, 0, 1])); tone.push(t); mode.push(m); sd.push(seed); cv.push(c); };
    for (const f of faces) {
      if (f.q) { if (len(sub(f.q[0], f.q[1])) < 1e-4) continue; f.q.forEach((q, k) => vert(q, f.uv[k], f.tone[k], 0, f.curv)); idx.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4; continue; }
      const c = f.poly.map((q) => new THREE.Vector2(q[0], -q[1])); if (c.length < 3) continue;
      let tri; try { tri = THREE.ShapeUtils.triangulateShape(c, []); } catch { continue; }
      f.poly.forEach((q, k) => vert(q, f.uv[k], f.raw ? 0 : f.tone, f.raw ? 1 : 0, f.curv || 0, f.np && [f.np[k][0], -f.np[k][1]], f.raw && f.raw[k]));
      for (const t of tri) idx.push(v + t[0], v + t[1], v + t[2]); v += f.poly.length;
    }
    if (!v) return [];
    const g = new THREE.BufferGeometry(); g.setIndex(idx);
    for (const [k, a, n] of [['position', pos, 3], ['fuv', uv, 2], ['np', np, 2], ['raw', rw, 3], ['tone', tone, 1], ['mode', mode, 1], ['seed', sd, 1], ['curv', cv, 1]]) g.setAttribute(k, new THREE.Float32BufferAttribute(a, n));
    const DV = K.DV, mat = partMat(p, { vertexShader: HATCH_VS, fragmentShader: HATCH_FS, depthFunc: THREE.EqualDepth, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 });
    mat.uniforms.az = { value: Math.atan2(DV[0], DV[1]) }; mat.uniforms.ke = { value: DV[2] };   // the view, for a raw fill's printed hatching
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; Object.assign(m.userData, { drop: hatchDrop, fade: hatchFade }); return [m];
  }

  X.on(window, 'message', (ev) => { const d = ev.data; if (!d || d.type !== 'pencil' || !d.value) return; PS = pencilWith(PS, d.value); apply(); X.wake(); });   // live: uniforms only

  return {
    brand(pl) { if (!on()) return; const dark = lum(pl) < 0.2, t = heroTones(X.brand.color, dark), ink = INK[dark ? 'dark' : 'light'];
      X.root.style.setProperty('--pc-hero', t.hatch); X.root.style.setProperty('--pc-dot', ink.dot); },
    paint(pl) {
      DARK = lum(pl) < 0.2; const ink = INK[DARK ? 'dark' : 'light'], t = heroTones(X.brand.color, DARK);
      SU.cInk.value.set(ink.ink); SU.cSheen.value.set(ink.sheen); SU.cHero.value.set(t.hatch); SU.cHeroLine.value.set(t.line);
      paper.mat.uniforms.amt.value = PS.paper; paper.mat.uniforms.dark.value = SU.dark.value = DARK ? 1 : 0;
    },
    primMesh, primLines,
    draw() {
      if (!on()) return undefined;                             // undefined, not false: the hook goes on to the other add-ons' draw
      if (!X.W || !X.H) return false;                          // a hidden (0 x 0) plate: nothing to draw into
      const r = X.renderer, ppx = ppxNow(), PW = Math.max(40, Math.floor(Math.min(X.W - 32, (X.H - 32) * 1.25, X.H))), cw = X.cam.right - X.cam.left, z = cw > 0 ? (X.W * 400 / PW) / cw : 1;
      SU.ppx.value = ppx; SU.dpr.value = r.getPixelRatio(); SU.pitch.value = pitchNow(); SU.cssH.value = X.H;
      SU.now.value = K.t; SU.whole.value = X.reduced || X.exporting || K.live || K.intro === 'stack' ? 1 : 0;
      SU.fine.value = 0.7 * PW * z >= 320 ? 1 : 0;
      // the paper's place in the document: a figure in a same-origin frame offsets by the frame's page position
      let ox = 0, oy = 0; try { const fe = window.frameElement; if (fe) { const b = fe.getBoundingClientRect(); ox = b.left + parent.scrollX + fe.clientLeft; oy = b.top + parent.scrollY + fe.clientTop; } } catch { /* cross-origin */ }
      SU.org.value.set(ox, oy);
      // boil: a new frame index fps times a second; its strength eases out while the view turns and back in once it rests
      const t = performance.now(), dt = Math.min(0.1, (t - BL.t) / 1000), dv = K.DV.map((x) => x.toFixed(5)).join(); BL.t = t;
      if (dv !== BL.dv) { BL.dv = dv; BL.moved = t; }
      const want = boiling() && t - BL.moved > 220 ? 1 : 0;
      BL.m += (want - BL.m) * Math.min(1, dt / (want ? 0.35 : 0.12)); if (!boiling()) BL.m = 0;
      SU.boilA.value = BL.m * PS.boilAmp; SU.boil.value = boiling() ? Math.floor(K.t / 1000 * PS.fps) % 997 : 0;
      paper.mat.uniforms.amt.value = PS.paper;
      r.render(X.scene, X.cam);
      const ac = r.autoClear; r.autoClear = false; r.render(paper.sc, quadCam); r.autoClear = ac;
      return true;
    },
    busy: () => boiling() || undefined,                        // boiling: frames, never rebuilds
    built() { FITW = 0; },
    dispose() { paper.mat.dispose(); paper.sc.children[0].geometry.dispose(); },
  };
}

// ---------- the rules (linejig.js, "styles"): paper fills that hide what is behind; the strokes do the rest ----------
const pencil = {
  fill: (p) => p.o.fillTone ? (p.hero ? 'pc-hero' : 'pc-dot') : 'plate',
  top: () => null,
  dot: (p) => p.hero ? 'pc-hero' : 'pc-dot',
  line: (p) => p.tone,                                       // used only by the vector export (the strokes are the extension's)
  label: () => 'mid', glow: false, text: false, fade: 0, grad: false, pencil: true,
};

const done = new WeakSet();
/** Registers 'pencil' with an engine (this file's own import of linejig.js by default; the engine passes itself). */
export function install(c = core) {
  if (done.has(c.STYLES)) return; done.add(c.STYLES);
  c.registerStyle('pencil', pencil); c.registerExtension({ mount: mountPencil });
}
install();
