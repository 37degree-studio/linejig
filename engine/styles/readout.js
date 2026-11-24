/* Linejig: the Readout style. Copyright 2026 Linejig. MIT licence, free like the engine.

   Readout: one thin line on every outline over Linejig's plate (--plate) with faint static grain; tops left empty; the
   walls printed with one material in wall space (u along the wall's top edge, v down from it, one cell size for the
   whole figure), as a band of up to three rows under each wall's top edge. Walls toward the left carry binary digits
   (grey, scrolling slowly along the wall); walls toward the right the same grid as a shade: 'bits' (the digits' data as
   filled cells, the default), 'rules' or 'dots'. The hero is flat brand colour (bright top, side a step dimmer, no edge
   lines) with a soft bloom of its own shape and a small engraved X on its largest top. A dashed footprint lies under
   the base. Dark-first. The engine imports this file on demand (style 'readout'); it registers itself through
   registerStyle and registerExtension and uses two generic engine hooks: o.solid on solid() and primMesh(p, z, N, t0).
   Settings: READOUT and READOUT_RANGE below; createFigure({ readout: {...} }), ?readout=k:v,k:v, ?shade=bits|rules|dots,
   or a {type: 'readout', value: {...}} message (uniforms only, no rebuild). Reference: skill/linejig/references/readout.md. */
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import * as core from '../linejig.js';

const { clamp, hull } = core.STYLE_KIT;

// ---------- settings (one place, with ranges) ----------
export const READOUT = {
  shade: 'bits',     // the shadow side: 'bits' (the digits' data as filled cells), 'rules' (fine lines along the wall) or 'dots'
  row: 0.016,        // row pitch as a share of the plate's width in CSS px: one size for the whole figure ...
  rowMin: 7,         // ... held between rowMin and rowMax CSS px, so the digits read on a thumbnail and full screen
  rowMax: 15,
  scroll: 8,         // CSS px per second along the wall (the digits only); still under ?reduced and ?freeze
  band: 3,          // rows of texture hanging from each wall's top edge: a band, not a fill; the rest of the wall is plate
  bandFade: 0.72,    // each row's strength is this times the row above's
  minCells: 14,      // a wall side smaller than this many cells gets no texture at all
  density: 0.8,      // the share of cells kept on a big wall (a stable per-cell dropout); small walls keep every cell ...
  denseFrom: 80,     // ... thinning starts at a wall of this many cells ...
  denseTo: 600,      // ... and reaches density at this many
  narrow: 3,         // a digit wall under this many cells wide shows bit cells instead (posts, pins)
  digitA: 1,         // digit strength
  shadeA: 1,         // shadow-side strength, kept under the edges
  bitSize: 0.72,     // a bit cell's square, as a share of the cell width
  dotSize: 0.34,     // a dot's diameter, as a share of the cell width
  rulesPerRow: 3,    // rules: lines per row
  grain: 0.05,       // grain strength on the dark plate (light: 0.7 of it)
  foot: 0.09,        // the footprint's margin out from the base, as a share of the base's size
  footRadius: 0.12,  // its corner radius (boxy bases), as a share of the base's size
  dash: 8,           // footprint dash and gap, CSS px
  gap: 6,
};
export const SHADES = ['bits', 'rules', 'dots'];
// the texture's greys per plate, as they render (sRGB; the shaders convert to the output colour space like the engine's own fills)
export const RS_COL = { dark: { digit: '#5a636d', shade: '#4d555f' }, light: { digit: '#434952', shade: '#434952' } };
export const READOUT_RANGE = { row: [0.006, 0.03], rowMin: [4, 12], rowMax: [8, 20], scroll: [0, 40], band: [1, 8], bandFade: [0.2, 1], minCells: [0, 200], density: [0, 1], denseFrom: [0, 2000],
  denseTo: [10, 5000], narrow: [0, 8], digitA: [0, 1], shadeA: [0, 1], bitSize: [0.2, 0.9], dotSize: [0.1, 0.8], rulesPerRow: [1, 6], grain: [0, 0.2], foot: [0, 0.4], footRadius: [0, 0.5], dash: [2, 20], gap: [2, 20] };
/** Merges settings (an object, or 'k:v,k:v') into a copy of base, each clamped to its range; unknown keys are dropped. */
export function readoutWith(base, v) {
  const o = typeof v === 'string' ? Object.fromEntries(v.split(',').map((kv) => kv.split(':').map((x) => x.trim())).filter((kv) => kv.length === 2)) : v || {}, out = { ...base };
  for (const [k, x] of Object.entries(o)) { if (k === 'shade') { if (SHADES.includes(x)) out.shade = x; } else if (READOUT_RANGE[k] && Number.isFinite(+x)) out[k] = clamp(+x, ...READOUT_RANGE[k]); }
  return out;
}

// ---------- palette: CSS variables per plate, set only under data-style="readout"; the plate itself is Linejig's --plate token (linejig.css) ----------
const DARKV = '--hi: #e3e8ee; --edge: #8f959c; --mid: #6c727a; --lo: #535a63; --ro-dash: #6b737d;';
const LIGHTV = '--hi: #15191e; --edge: #7c828a; --mid: #9aa0a8; --lo: #a2a9b1; --ro-dash: #9aa1aa;';
if (typeof document !== 'undefined' && !document.getElementById('readout-css')) {
  document.head.appendChild(Object.assign(document.createElement('style'), { id: 'readout-css', textContent: `
:root[data-style="readout"] { ${LIGHTV} }
@media (prefers-color-scheme: dark) { :root[data-style="readout"]:not([data-theme="light"]) { ${DARKV} } }
:root[data-style="readout"][data-theme="dark"] { ${DARKV} }` }));
}

// ---------- the rules (linejig.js, "styles") ----------
const thin = (p, t) => t + (p.tone.endsWith('~') ? '~' : '');
const readout = {
  fill: (p) => p.hero ? (p.o.top ? 'accent-side' : 'accent-top') : 'plate',
  top: (p) => p.hero && p.o.top ? 'accent-top' : null,
  dot: (p) => p.hero ? 'accent-top' : p.outline ? 'accent-edge' : 'edge',
  // the hero has no edge lines of its own: they take its side tone (on the side they vanish, round the top they read as an engraved rim)
  line: (p) => p.hero ? thin(p, 'accent-side') : p.o.dash ? 'ro-dash' : thin(p, p.outline ? 'accent-edge' : 'edge'),
  label: () => 'mid', glow: false, text: false, fade: 0, grad: false, readout: true,   // glow: false, its bloom comes from primMesh
};

// ---------- tones: one brand colour, stepped in HSL (brand.md's rule: the user's colour is the top, never altered) ----------
// A small local helper (this file stands alone: no code from linejig-pro.js). Dark plate: side a step dimmer, edge a step lighter held to
// 3:1 on the plate, glow from the edge tone. Light plate: a touch richer top, darker side, an edge held to 2:1.
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const hexOf = (c) => '#' + c.map((v) => Math.round(clamp(v) * 255).toString(16).padStart(2, '0')).join('');
const lum = (h) => rgbOf(h).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hsl = (h, dH = 0, dS = 0, dL = 0) => {                  // the colour moved by (dH degrees, dS, dL) in HSL
  const c0 = new THREE.Color(h), o = {}; c0.getHSL(o, THREE.SRGBColorSpace);
  return '#' + new THREE.Color().setHSL(((o.h + dH / 360) % 1 + 1) % 1, clamp(o.s + dS), clamp(o.l + dL), THREE.SRGBColorSpace).getHexString(THREE.SRGBColorSpace); };
const held = (c, plate, min, dL) => { for (let i = 0; i < 20 && ratio(c, plate) < min; i++) c = hsl(c, 0, 0, dL); return c; };
function tonesFor(c, plate) {
  if (lum(plate) < 0.2) { const edge = held(hsl(c, 3, 0.09, 0.17), plate, 3, 0.03);
    return { 'accent-top': c, 'accent-side': hsl(c, -6, -0.03, -0.07), 'accent-edge': edge, 'accent-glow': edge }; }
  return { 'accent-top': hsl(c, 0, 0.08, -0.02), 'accent-side': hsl(c, -3, 0.08, -0.07), 'accent-edge': held(hsl(c, -4, 0.02, -0.17), plate, 2, -0.03), 'accent-glow': hsl(c, 0, 0.1, 0) };
}

// ---------- the material: one binary data grid (R bit, B dropout rank) and a two-glyph atlas ('0', '1'), both in wall space ----------
// Every wall reads the same data at its own offset (its seed: the wall's order in the figure, so a figure always looks
// the same). The digit cell is one letter wide and one row tall; the shadow side uses the same cell grid.
const COLS = 128, ROWS = 32, GW = 32, GH = 64, FONT_PX = 46;
function dataTexture() {
  const a = new Uint8Array(COLS * ROWS * 4); let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < COLS * ROWS; i++) { a[i * 4] = rnd() < 0.5 ? 255 : 0; a[i * 4 + 2] = Math.floor(rnd() * 256); a[i * 4 + 3] = 255; }   // B: the cell's dropout rank
  const t = new THREE.DataTexture(a, COLS, ROWS); t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return t;
}
function glyphTexture() {
  const cv = document.createElement('canvas'); cv.width = GW * 2; cv.height = GH; const c = cv.getContext('2d');
  c.font = `600 ${FONT_PX}px ui-monospace, "SF Mono", Menlo, "IBM Plex Mono", monospace`; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const [i, ch] of ['0', '1'].entries()) c.fillText(ch, GW * i + GW / 2, GH / 2 + 2);
  const t = new THREE.CanvasTexture(cv); t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; return t;
}

// ---------- shaders ----------
const WALL_VS = `attribute vec2 ruv; attribute float side, wh, seed, wa; varying vec2 vUv; varying float vSide, vH, vSeed, vA;
  void main() { vUv = ruv; vSide = side; vH = wh; vSeed = seed; vA = wa; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const WALL_FS = `uniform sampler2D atlas, data; uniform vec2 cellP; uniform float scroll, alpha, digitA, shadeA, top, band, bandFade, density, denseFrom, denseTo, bitSize, dotSize, rulesPerRow; uniform int shade;
  uniform vec3 cWord, cShade; varying vec2 vUv; varying float vSide, vH, vSeed, vA;
  void main() {
    float y = vUv.y - top; if (y < 0.0) discard;
    float r = floor(y / cellP.y);                            // rows hang from the wall's top edge; only whole rows that fit
    if (r >= band) discard;                                  // a band of rows under the top edge, fading row by row
    bool rows = vSide < 0.5 || shade != 1;
    if (y > vH - top * 0.5) discard;                         // nothing past the wall's bottom edge (a plinth, a base)
    if (rows && (r + 1.0) * cellP.y > vH - top * 0.5) discard;   // the first row too: a wall shorter than a row stays plain
    float fade = pow(bandFade, max(0.0, (rows ? r : floor(y / cellP.y)) - 0.0));   // row 1 crisp, rows 2 and 3 fade
    float x = vUv.x + (vSide < 0.5 ? scroll : 0.0);
    vec2 cc = vec2(x, y) / cellP, cell = floor(cc), f = cc - cell, off = floor(vec2(vSeed * 37.0, vSeed * 5.0));
    vec4 d = texture2D(data, (mod(cell + off, vec2(${COLS}.0, ${ROWS}.0)) + 0.5) / vec2(${COLS}.0, ${ROWS}.0));
    float bit = step(0.5, d.r), keep = 1.0 - (1.0 - density) * smoothstep(denseFrom, denseTo, vA / (cellP.x * cellP.y));
    if (d.b > keep && (vSide < 0.5 || shade != 1)) discard;   // a big wall thins out, the same cells every frame
    if (vSide < 0.5) {                                       // the lit side: the bits as mono digits
      vec2 g = vec2(0.5, 1.0), at = vec2((bit + f.x) * 0.5, f.y);
      float m = textureGrad(atlas, at, dFdx(cc) * g, dFdy(cc) * g).a; if (m < 0.03) discard;
      gl_FragColor = vec4(cWord, m * digitA * fade * alpha);
      #include <colorspace_fragment>
      return; }   // grey only: the colour belongs to the hero
    vec2 px = fwidth(cc);                                    // cell units per device px, for 1 px soft edges
    float a;
    if (shade == 0) {                                        // bits: a filled square per 1, centred in the digit's cell
      if (bit < 0.5) discard; vec2 h = vec2(0.5, 0.5 * cellP.x / cellP.y) * bitSize, q = (abs(f - 0.5) - h) / px;
      a = clamp(0.5 - max(q.x, q.y), 0.0, 1.0);
    } else if (shade == 1) {                                 // rules: fine lines along the wall, rulesPerRow to a row
      float t = y / cellP.y * rulesPerRow, w = fwidth(t); a = clamp(0.8 - abs(fract(t) - 0.5) / w, 0.0, 1.0);
    } else {                                                 // dots: one per digit cell, in the digits' rows
      vec2 q = (f - 0.5) * cellP; float rad = 0.5 * dotSize * cellP.x, w = fwidth(vUv.x); a = clamp(0.5 - (length(q) - rad) / w, 0.0, 1.0);
    }
    if (a < 0.01) discard;
    gl_FragColor = vec4(cShade, a * shadeA * fade * alpha);
    #include <colorspace_fragment>
  }`;
const GLOW_VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
// the glow is the hero's own colour (its top, accent-top), through the output colour space like the fills, so the halo
// has the hero's hue at every brand colour
const GLOW_FS = 'uniform sampler2D map; uniform vec3 color; uniform float k; varying vec2 vUv; void main() { gl_FragColor = vec4(color, texture2D(map, vUv).a * k);\n#include <colorspace_fragment>\n}';
const GRAIN_FS = `uniform float g; uniform vec2 org;
  float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() { float n = h(floor(gl_FragCoord.xy - org)) - 0.5; gl_FragColor = vec4(vec3(step(0.0, n)), abs(n) * 2.0 * g);
    #include <colorspace_fragment>
  }`;
const GLOW = [{ blur: 13, k: 0.55 }, { blur: 3.5, k: 0.6 }];   // blur: sigma in plate units

// ---------- geometry helpers (plate units, y down) ----------
const area = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return a / 2; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], len = (v) => Math.hypot(v[0], v[1]);
const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function mountReadout(X) {
  const K = X.K;
  const on = () => !!X.style.readout;
  let RS = readoutWith(readoutWith(readoutWith(READOUT, X.fig.readout), X.Q.get('readout') || ''), X.Q.has('shade') ? { shade: X.Q.get('shade') } : {});
  const atlas = glyphTexture(), data = dataTexture();
  const shadeOf = (v) => Math.max(0, SHADES.indexOf(v));
  // uniforms every wall shares (one object each, so a write reaches every wall); alpha is each wall's own
  const SU = { atlas: { value: atlas }, data: { value: data }, cellP: { value: new THREE.Vector2(3, 6) }, scroll: { value: 0 }, top: { value: 0.6 },
    digitA: { value: 1 }, shadeA: { value: 1 }, shade: { value: 0 }, density: { value: 1 }, denseFrom: { value: 0 }, denseTo: { value: 1 },
    bitSize: { value: 0.6 }, band: { value: 3 }, bandFade: { value: 0.55 }, dotSize: { value: 0.3 }, rulesPerRow: { value: 3 },
    cWord: { value: new THREE.Color() }, cShade: { value: new THREE.Color() } };
  let ROW = 0;                                               // ROW: the row pitch in plate units (one for the figure)
  const seedOf = (k) => { let h = 2166136261; for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619); return (h >>> 0) % 997; };
  const sizeTo = (row) => { if (Math.abs(row - ROW) < 1e-3) return; ROW = row; SU.cellP.value.set(row * GW / GH, row); SU.top.value = 0.08 * row; };
  sizeTo(6.4);
  const apply = () => { for (const k of ['digitA', 'band', 'bandFade', 'density', 'denseFrom', 'denseTo', 'bitSize', 'dotSize', 'rulesPerRow']) SU[k].value = RS[k]; SU.shade.value = shadeOf(RS.shade); };
  apply();
  const xMat = new LineMaterial({ linewidth: 1, worldUnits: false }); xMat.userData.tone = 'accent-side'; X.extra.add(xMat);   // recoloured by paint()
  const grain = (() => { const mat = new THREE.ShaderMaterial({ uniforms: { g: { value: 0 }, org: { value: new THREE.Vector2() } }, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: GRAIN_FS });
    const sc = new THREE.Scene(), m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); m.frustumCulled = false; sc.add(m); return { sc, mat }; })();
  const quadCam = new THREE.Camera();
  let DARK = true, XC = []; const DASH = [];                  // XC: hero top candidates for the engraved X, this build

  // the dashed footprint: one rule for every figure. The base is what stands on the ground: the object's lowest points,
  // less parts that stick out (paper, a swung door, a cable: points far from the rest). Round bases (nearly equal radii)
  // get a circle; any other base the smallest rectangle round it, in its own frame (its own axes, found from the base),
  // as a rounded rect with one corner radius. Both grow by one margin, a share of the base's size. Made once, in world.
  let FOOT = null;
  function footprint(k) {
    const ps = X.fig.fit.points(k), zs = ps.map((q) => q[2]), z0 = Math.min(...zs), lo = ps.filter((q) => q[2] <= z0 + 1.5);
    // the line lies on the floor (z 0, or fig.ground) under an object that stands on it, even when the figure's lowest fit
    // points are a little above it (an arcade cabinet's body on its plinth); one that hangs high keeps its own level
    const g = X.fig.ground ?? 0, zf = z0 > g && z0 - g <= 0.15 * (Math.max(...zs) - g) ? g : z0;
    const c0 = lo.reduce((s, q) => [s[0] + q[0] / lo.length, s[1] + q[1] / lo.length], [0, 0]), dist = (q, c) => Math.hypot(q[0] - c[0], q[1] - c[1]);
    const md = lo.map((q) => dist(q, c0)).sort((a, b) => a - b)[Math.floor(lo.length / 2)] || 0, core = lo.filter((q) => dist(q, c0) <= 1.35 * md + 1);
    if (core.length < 3) return null;
    const c = core.reduce((s, q) => [s[0] + q[0] / core.length, s[1] + q[1] / core.length], [0, 0]), rs = core.map((q) => dist(q, c)), rm = rs.reduce((a, b) => a + b) / rs.length;
    const bins = new Set(core.map((q) => Math.floor(((Math.atan2(q[1] - c[1], q[0] - c[0]) / (2 * Math.PI) + 1) % 1) * 24)));   // a square's corners are equidistant too: round needs points all the way round
    if (bins.size >= 18 && (Math.max(...rs) - Math.min(...rs)) / rm < 0.08) {           // round
      const m = RS.foot * 2 * rm; return { z: zf, ring: k.circ(rm + m, 96).map((q) => [c[0] + q.u, c[1] + q.v]) };
    }
    const H = hull(core); let best = null;                     // the smallest rectangle: one side on a hull edge
    for (let i = 0; i < H.length; i++) {
      const a = H[i], b = H[(i + 1) % H.length], th = Math.atan2(b[1] - a[1], b[0] - a[0]), U = [Math.cos(th), Math.sin(th)], V = [-U[1], U[0]];
      const us = H.map((q) => q[0] * U[0] + q[1] * U[1]), vs = H.map((q) => q[0] * V[0] + q[1] * V[1]);
      const r = [Math.min(...us), Math.min(...vs), Math.max(...us), Math.max(...vs)], A = (r[2] - r[0]) * (r[3] - r[1]);
      if (!best || A < best.A - 1e-6) best = { A, U, V, r };
    }
    const { U, V, r } = best, size = Math.max(r[2] - r[0], r[3] - r[1]), m = RS.foot * size;
    const ring = k.rrect(r[0] - m, r[1] - m, r[2] + m, r[3] + m, RS.footRadius * size, 8).map((q) => [q.u * U[0] + q.v * V[0], q.u * U[1] + q.v * V[1]]);
    return { z: zf, ring };
  }
  const model0 = X.fig.model;
  X.fig.model = (k, st) => {
    const A0 = X.fig.ASSEMBLY?.[0], own = X.fig.ASSEMBLY?.some((r) => r.name === 'ground' || /footprint/i.test(r.parts || ''));
    if (on() && X.fig.footprint !== false && !own) {          // a figure that draws its own footprint keeps it
      FOOT ??= footprint(k) || false;
      if (FOOT) { if (A0 && A0.from && !Array.isArray(A0.from)) k.layer(A0.name, Object.keys(A0.from)[0]);   // a first row with sides: file it under one
        k.add(null, [{ pts: FOOT.ring.map((q) => k.P(q[0], q[1], FOOT.z)), closed: true }], 'lo', { dash: true }); }
    }
    return model0(k, st);
  };

  // the visible walls of a primitive with a cap: quads [top a, top b, bottom b, bottom a] with arc length and height
  function walls(p) {
    const P = K.P, o0 = P(0, 0, 0), S = K.S, sol = p.o.solid;
    const axis = (v) => sub(P(...v), o0);
    // u is printed on the wall: arc length round the whole ring from its first sample (never from the first visible one,
    // which moves as the view turns), signed so it reads left to right; a wall turning keeps its cells where they are
    if (sol) {                                               // exact: the prism's own frame and heights
      const { F, ring, w0, w1 } = sol, DV = K.DV, up = K.dot(F.W, DV) >= 0, wc = up ? w1 : w0, wb = up ? w0 : w1;
      const vis = K.run(ring, K.faces(F)); if (vis.length < 2) return null;
      const scr = (q, w) => P(...K.at3(F, q.u, q.v, w)), Wd = ring.map((q) => K.at3(F, q.u, q.v, wc)), arc = [0];
      for (let k = 1; k <= ring.length; k++) arc.push(arc[k - 1] + d3(Wd[k - 1], Wd[k % ring.length]) * S);
      const sg = scr(vis[0], wc)[0] > scr(vis[vis.length - 1], wc)[0] ? -1 : 1;
      const h = Math.abs(w1 - w0) * Math.hypot(...F.W) * S, out = [];
      const horiz = Math.abs(F.W[2]) > 0.99 * Math.hypot(...F.W);
      for (let i = 0; i + 1 < vis.length; i++) {
        const a = vis[i], b = vis[i + 1], ia = ring.indexOf(a), ib = ring.indexOf(b), A = Wd[ia], B = Wd[ib];
        const ua = arc[ia], ub = ib === 0 ? arc[ring.length] : arc[ib];
        const n = [0, 1, 2].map((j) => (a.nu + b.nu) * F.U[j] + (a.nv + b.nv) * F.V[j]), nx = P(...n)[0] - o0[0];
        out.push({ q: [P(...A), P(...B), scr(b, wb), scr(a, wb)], u0: sg * ua, u1: sg * ub, h, side: nx < 0 ? 0 : 1 });
      }
      return { quads: out, horiz, ax: horiz ? [axis([1, 0, 0]), axis([0, 1, 0])] : null };
    }
    // inferred (a figure's own prism: a fill and its cap, no frame): the extrusion is along a world axis; take the axis
    // whose hull of the cap and the moved cap is the smallest that still holds the silhouette
    const T = p.o.top, Sil = p.fill; if (!T || T.length < 3) return null;
    const aS = Math.abs(area(Sil)); let best = null;
    for (const [wi, wv] of [[2, [0, 0, -1]], [0, [1, 0, 0]], [0, [-1, 0, 0]], [1, [0, 1, 0]], [1, [0, -1, 0]], [2, [0, 0, 1]]]) {
      const ax = axis(wv), al = len(ax); if (al < 1e-6) continue; const e = [ax[0] / al, ax[1] / al];
      const pr = (q) => q[0] * e[0] + q[1] * e[1], h = Math.max(...Sil.map(pr)) - Math.max(...T.map(pr)); if (h < 0.4) continue;
      const a = Math.abs(area(hull(T.concat(T.map((q) => [q[0] + e[0] * h, q[1] + e[1] * h])))));
      if (a >= aS * 0.97 && (!best || a < best.a)) best = { a, e, h, al, wi, wv };
    }
    if (!best) return null;
    // the cap's own ring order (not the hull's), so u is anchored to its first sample; only edges on its hull count
    const { e, h, al, wv } = best, Hc = hull(T), onHull = new Set(Hc), n = T.length, C = Hc.reduce((s, q) => [s[0] + q[0] / Hc.length, s[1] + q[1] / Hc.length], [0, 0]);
    const out2 = (a, b) => { const d = sub(b, a), L = len(d) || 1, m = [d[1] / L, -d[0] / L];   // outward: away from the centre
      return (m[0] * ((a[0] + b[0]) / 2 - C[0]) + m[1] * ((a[1] + b[1]) / 2 - C[1])) < 0 ? [-m[0], -m[1]] : m; };
    const nw = wv.map(Math.abs), W3 = T.map((q) => K.onPlane(q, [0, 0, 0], nw)), arc = [0];
    for (let k = 1; k <= n; k++) arc.push(arc[k - 1] + d3(W3[k - 1], W3[k % n]) * S);
    const edges = []; let dx = 0;
    for (let k = 0; k < n; k++) { const a = T[k], b = T[(k + 1) % n]; if (!onHull.has(a) || !onHull.has(b) || len(sub(a, b)) < 1e-4) continue;
      const m = out2(a, b); if (m[0] * e[0] + m[1] * e[1] <= 0.02) continue; edges.push([k, a, b, m]); dx += b[0] - a[0]; }
    if (!edges.length) return null;
    const sg = dx < 0 ? -1 : 1, out = [];                    // read left to right
    for (const [k, a, b, m] of edges)
      out.push({ q: [a, b, [b[0] + e[0] * h, b[1] + e[1] * h], [a[0] + e[0] * h, a[1] + e[1] * h]], u0: sg * arc[k], u1: sg * arc[k + 1], h: h / al * S, side: m[0] < 0 ? 0 : 1 });
    const horiz = best.wi === 2;
    return { quads: out, horiz, ax: horiz ? [axis([1, 0, 0]), axis([0, 1, 0])] : null };
  }

  const wallDrop = (m) => m.material.dispose();
  const wallFade = (m, a) => { m.material.uniforms.alpha.value = a; };
  function primMesh(p, z, N) {
    if (!on()) return undefined;
    if (p.hero) {                                            // the hero: a bloom of its own shape behind it, and on its top maybe the engraved X
      const out = !p.o.fillTone && X.glow > 0 && Math.abs(area(p.fill)) > 6 ? glowFor(p.fill, z - 0.5 / N) : [];
      const W = p.o.top && p.o.top.length > 2 ? walls(p) : null;
      if (W && W.horiz) { const T = p.o.top, A = Math.abs(area(T)); if (A > 30) {
        const c = T.reduce((s, q) => [s[0] + q[0] / T.length, s[1] + q[1] / T.length], [0, 0]);
        const cell = Math.abs(W.ax[0][0] * W.ax[1][1] - W.ax[0][1] * W.ax[1][0]), r = 0.32 * Math.sqrt(A / cell / Math.PI);
        const seg = []; for (const a of W.ax) seg.push(c[0] - a[0] * r, -(c[1] - a[1] * r), z + 6 / N, c[0] + a[0] * r, -(c[1] + a[1] * r), z + 6 / N);
        const g = new LineSegmentsGeometry(); g.setPositions(seg); const m = new LineSegments2(g, xMat); m.frustumCulled = false;
        m.userData.fade = () => {}; m.userData.engraveArea = A; XC.push(m); out.push(m); } }
      return out;
    }
    if (p.ink || !p.o.top || p.o.top.length < 3) return [];   // an ink part (fillTone 'ink') is solid ink: no wall texture
    const W = walls(p); if (!W) return [];
    const wordLen = W.quads.reduce((t, w) => t + (w.side ? 0 : Math.abs(w.u1 - w.u0)), 0);
    if (wordLen < RS.narrow * SU.cellP.value.x) for (const w of W.quads) w.side = 1;   // too narrow for digits: bit cells only
    const sideA = [0, 0]; for (const w of W.quads) sideA[w.side] += Math.abs(w.u1 - w.u0) * w.h;   // each side's area, for the density
    const cellA = SU.cellP.value.x * SU.cellP.value.y; W.quads = W.quads.filter((w) => sideA[w.side] >= RS.minCells * cellA);   // small walls: no texture
    const pos = [], uv = [], sd = [], wh = [], sdd = [], wa = [], idx = [], seed = seedOf(p.part + '#' + p.ord); let v = 0;   // seed: the wall's own data offset, the same every build
    for (const w of W.quads) {
      if (len(sub(w.q[0], w.q[1])) < 1e-4) continue;
      const zz = z;                                         // the fill's own depth: drawn only where the fill shows (EqualDepth)
      for (const [k, q] of w.q.entries()) { pos.push(q[0], -q[1], zz); uv.push(k === 0 || k === 3 ? w.u0 : w.u1, k < 2 ? 0 : w.h); sd.push(w.side); wh.push(w.h); sdd.push(seed); wa.push(sideA[w.side]); }
      idx.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4;
    }
    if (!v) return [];
    const geo = new THREE.BufferGeometry(); geo.setIndex(idx);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('ruv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('side', new THREE.Float32BufferAttribute(sd, 1)); geo.setAttribute('wh', new THREE.Float32BufferAttribute(wh, 1)); geo.setAttribute('seed', new THREE.Float32BufferAttribute(sdd, 1)); geo.setAttribute('wa', new THREE.Float32BufferAttribute(wa, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: { ...SU, alpha: { value: 1 } }, vertexShader: WALL_VS, fragmentShader: WALL_FS, transparent: true, depthWrite: false,
      depthFunc: THREE.EqualDepth, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; Object.assign(m.userData, { drop: wallDrop, fade: wallFade }); return [m];
  }

  // the hero's bloom: each hero fill's own outline (a bent pipe glows along itself, not over its hull), blurred on a
  // canvas once per outline, additive on dark, normal on light. The engine's per-bucket hull glow is off (glow: false).
  const GT = new Map(), OWN = new WeakSet();                 // OWN: this figure's Readout glows (X.extra also holds Brand's)
  function glowFor(H0, z) {
    return GLOW.map((G, L) => {
      const m0 = G.blur * 3.2, xs = H0.map((q) => q[0]), ys = H0.map((q) => q[1]), x0 = Math.min(...xs) - m0, x1 = Math.max(...xs) + m0, y0 = Math.min(...ys) - m0, y1 = Math.max(...ys) + m0;
      const k = Math.min(3, (L ? 320 : 200) / Math.max(x1 - x0, y1 - y0)), key = L + '|' + k.toFixed(4) + '|' + H0.map((q) => ((q[0] - x0) * k).toFixed(1) + ',' + ((q[1] - y0) * k).toFixed(1)).join(' ');
      let e = GT.get(key);
      if (!e) { const c2 = document.createElement('canvas'); c2.width = Math.max(1, Math.ceil((x1 - x0) * k)); c2.height = Math.max(1, Math.ceil((y1 - y0) * k));
        const c = c2.getContext('2d'); c.filter = `blur(${(G.blur * k).toFixed(2)}px)`; c.fillStyle = '#fff'; c.beginPath();
        for (const q of H0) c.lineTo((q[0] - x0) * k, (q[1] - y0) * k); c.closePath(); c.fill();
        GT.set(key, e = { tex: new THREE.CanvasTexture(c2), n: 0 }); }
      e.n++;
      const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: e.tex }, color: { value: new THREE.Color(X.css('accent-top')) }, k: { value: 0 } },
        vertexShader: GLOW_VS, fragmentShader: GLOW_FS, transparent: true, depthWrite: false });
      mat.userData = { gt: e, layer: L }; look(mat); X.extra.add(mat); OWN.add(mat);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), mat); m.position.set((x0 + x1) / 2, -(y0 + y1) / 2, z + L * 0.001); m.frustumCulled = false;
      Object.assign(m.userData, { glow: true, drop: (o) => { X.extra.delete(o.material); o.material.userData.gt.n--; o.material.dispose(); },
        fade: (o, a) => { look(o.material); o.material.uniforms.k.value *= a; } });
      return m;
    });
  }
  function look(mat) {                                       // the bloom on this plate: additive on dark, a light normal tint on white
    const L = mat.userData.layer; mat.uniforms.color.value.set(X.css('accent-top'));   // on dark the lighter edge tone, so the falloff stays amber, not brown
    mat.uniforms.k.value = (DARK ? GLOW[L].k : (L ? 0 : 0.28)) * X.glow;   // X.glow: the figure's glow option
    mat.blending = DARK ? THREE.AdditiveBlending : THREE.NormalBlending; mat.needsUpdate = true;
  }
  const sweep = (all) => { for (const [k, e] of GT) if (all || e.n <= 0) { e.tex.dispose(); GT.delete(k); } };

  X.on(window, 'message', (ev) => { const d = ev.data; if (!d || d.type !== 'readout' || !d.value) return;
    RS = readoutWith(RS, d.value); apply(); X.paint(); X.wake(); });   // live: uniforms only, no rebuild

  return {
    brand(pl) { if (!on()) return; for (const [k, v] of Object.entries(tonesFor(X.brand.color, pl))) X.root.style.setProperty('--' + k, v); },
    paint(pl) {
      DARK = lum(pl) < 0.2;
      // the texture stays a step under the edges (edge luminance at least 2x the texture's on dark; on light, the texture
      // sits nearer the plate than the edges by the same margin), and grey only: the colour belongs to the hero
      SU.cWord.value.set(DARK ? RS_COL.dark.digit : RS_COL.light.digit);
      SU.cShade.value.set(DARK ? RS_COL.dark.shade : RS_COL.light.shade);
      SU.shadeA.value = DARK ? RS.shadeA : RS.shadeA * 0.9;
      grain.mat.uniforms.g.value = DARK ? RS.grain : RS.grain * 0.7;
      for (const m of X.extra) if (OWN.has(m)) look(m);
    },
    primMesh,
    draw(vp) {
      if (!on()) return undefined;                             // undefined, not false: the hook goes on to the other add-ons' draw
      const r = X.renderer, pr = r.getPixelRatio(), PW = Math.max(40, Math.floor(Math.min(X.W - 32, (X.H - 32) * 1.25, X.H)));
      if (!X.W || !X.H) return false;                          // a hidden (0 x 0) plate: nothing to draw into
      const unit = PW / 400;                                   // CSS px per plate unit (zoom aside)
      SU.scroll.value = X.reduced || X.exporting ? 0 : K.t / 1000 * RS.scroll / unit;   // frozen: K.t stands, so do the digits
      sizeTo(clamp(RS.row * PW, RS.rowMin, RS.rowMax) / unit);   // one row size for the figure, set by the plate's size (a uniform, no rebuild)
      const ppx = (X.cam.right - X.cam.left) / X.W;           // plate units per CSS px (zoom included)
      for (const m of DASH) { m.dashSize = RS.dash * ppx; m.gapSize = RS.gap * ppx; }   // the footprint's dashes, in CSS px
      xMat.resolution.set(X.W, X.H);
      grain.mat.uniforms.org.value.set(vp ? vp.x * pr : 0, vp ? vp.y * pr : 0);
      r.render(X.scene, X.cam);
      const ac = r.autoClear; r.autoClear = false; r.render(grain.sc, quadCam); r.autoClear = ac;
      return true;
    },
    busy: () => (on() && !X.reduced && K.FREEZE === Infinity && RS.scroll > 0) || undefined,   // the digits keep scrolling: frames, never rebuilds
    built() {
      DASH.length = 0; X.scene.traverse((o) => { if (o.material?.isLineMaterial && o.material.dashed && !DASH.includes(o.material)) DASH.push(o.material); });
      if (XC.length) { XC.sort((a, b) => b.userData.engraveArea - a.userData.engraveArea);
        for (const m of XC.slice(1)) { const g = m.parent; if (g) { g.remove(m); const t = g.userData.timed, i = t.indexOf(m); if (i >= 0) t.splice(i, 1); } m.geometry.dispose(); } }
      XC = []; sweep();
    },
    dispose() { sweep(true); atlas.dispose(); data.dispose(); xMat.dispose(); grain.mat.dispose(); grain.sc.children[0].geometry.dispose(); },
  };
}

const done = new WeakSet();
/** Registers 'readout' with an engine (this file's own import of linejig.js by default; the engine passes itself). */
export function install(c = core) {
  if (done.has(c.STYLES)) return; done.add(c.STYLES);
  c.registerStyle('readout', readout); c.registerExtension({ mount: mountReadout });
}
install();
