/* Linejig Brand and Dots styles. Copyright 2026 Linejig. MIT licence, free like the engine.

   The Brand and Dots styles for the Linejig engine (linejig.js, MIT): their style rules, the brand colour's tones
   (BRAND), the hero's glow, engraved labels, and the whole dots pass (an offscreen ink-code render, a cell reduction and a
   screen-space mark shader; DOTS, DOTS_RANGE, DOT_SHAPES, registerDotShape). The engine imports this file on demand when
   a figure asks for brand, accent or dots; a page may also import it itself to have them at once:
     import { registerDotShape } from '../kernel/linejig-pro.js';
   It registers itself with the engine through registerStyle and registerExtension (linejig.js, "styles"); the engine's
   header comment is the API. */
import * as THREE from 'three';
import * as core from './linejig.js';

const { clamp, hull, hex3, RAD } = core.STYLE_KIT;

// ---------- styles (the rules: linejig.js, "styles") ----------
const QUIET = { hi: 'edge', edge: 'edge', mid: 'lo', lo: 'lo' };
const thin = (p, t) => t + (p.tone.endsWith('~') ? '~' : '');
// brand: the hero in the brand colour, with a glow, and labels; the old name accent is an alias of the same object.
// grad: the hero's top face carries a soft gradient.
const brand = {
  fill: (p) => p.hero ? (p.o.top ? 'accent-side' : 'accent-top') : p.outline ? 'accent-tint' : 'plate', top: (p) => p.hero && p.o.top ? 'accent-top' : null,
  dot: (p) => p.hero ? 'accent-edge' : p.outline ? 'accent-outline-edge' : 'edge',
  line: (p) => thin(p, p.hero ? 'accent-edge' : p.outline ? 'accent-outline-edge' : QUIET[p.tone.replace('~', '')]),
  label: (p) => p.hero ? 'label-hero' : 'mid', glow: true, text: true, fade: 56, grad: false,
};
// 3 dots: the drawing is rendered offscreen in ink codes (R ink, G hero, B outline; see DOTCODE), then a screen pass
// draws one round dot per 6 px cell. Solids get a halftone: their top lighter, their sides denser; the hero in the brand colour.
const dots = {
  fill: (p) => p.hero ? (p.o.top ? 'accent-side' : 'accent-top') : p.o.top ? 'dot-side' : 'plate', top: (p) => p.o.top ? (p.hero ? 'accent-top' : 'dot-top') : null,
  dot: (p) => p.hero ? 'accent-edge' : p.outline ? 'accent-outline-edge' : p.o.fillTone,
  line: (p) => thin(p, p.hero ? 'accent-edge' : p.outline ? 'accent-outline-edge' : p.tone.replace('~', '')),
  label: () => 'mid', glow: false, text: false, fade: 56, dots: true,
};

// ---------- dots: ink codes, shapes and settings ----------
// a tone as an ink code [ink, ink * hero, ink * outline], linear, so a fade or an anti-aliased edge blends it exactly;
// a = 3 is fillTone 'ink' (hero and outline both full, which no other tone is): its dots take the fixed ink colour
const DOTCODE = { plate: [0, 0], hi: [1, 0], edge: [0.95, 0], mid: [0.8, 0], lo: [0.62, 0], 'dot-top': [0.18, 0], 'dot-side': [0.38, 0],
  'accent-edge': [1, 1], 'accent-top': [0.34, 1], 'accent-top-end': [0.34, 1], 'accent-glow': [0.34, 1], 'accent-side': [0.5, 1],
  'accent-outline-edge': [0.95, 2], 'accent-tint': [0.2, 2], ink: [1, 3], 'ink-edge': [1, 3] };
// the dots settings (styles.md): createFigure({ dots }), ?dots=shape:square,cell:8, or {type: 'dots', value}; all live
export const DOT_SHAPES = ['circle', 'square', 'diamond', 'line', 'cross'];
// registerDotShape(name, glsl): a mark of one's own, by name in dots.shape; glsl sets float d (signed distance in device px,
// < 0 inside) from vec2 l (offset from the cell centre), float r (this ink's radius), ink (0..1), dsize (the largest radius), sw (the swell)
const SHAPES = [];
export function registerDotShape(name, glsl) { if (!DOT_SHAPES.includes(name)) { DOT_SHAPES.push(name); SHAPES.push(glsl); } return name; }
export const DOTS = { shape: 'circle', cell: 3.5, size: 0.78, gap: 0, contrast: 1, threshold: 0.05, angle: 0, swell: 1, radius: 40, faces: true, jitter: 0, heroOnly: false, auto: true, tint: false, across: 180 };
export const DOTS_RANGE = { cell: [2, 16], size: [0.3, 1], gap: [0, 8], contrast: [0.5, 2], threshold: [0, 0.5], angle: [0, 45], swell: [0, 2], radius: [0, 120], jitter: [0, 0.5], across: [40, 300] };
const TINT = { lo: 0, mid: 1, hi: 2 };
const FACE_CODES = ['dot-top', 'dot-side', 'accent-top', 'accent-top-end', 'accent-glow', 'accent-side', 'accent-tint'];
/** Merges settings (an object, or 'k:v,k:v') into a copy of base, each clamped to its range; unknown keys are dropped. */
function dotsWith(base, v) {
  const o = typeof v === 'string' ? Object.fromEntries(v.split(',').map((kv) => kv.split(':').map((x) => x.trim())).filter((kv) => kv.length === 2)) : v || {}, out = { ...base };
  for (const [k, x] of Object.entries(o)) {
    if (k === 'shape') { if (DOT_SHAPES.includes(x)) out.shape = x; }
    else if (k === 'faces' || k === 'heroOnly' || k === 'auto' || k === 'tint') out[k] = x === true || x === 'true' || x === '1' || x === 1;
    else if (DOTS_RANGE[k] && Number.isFinite(+x)) out[k] = clamp(+x, ...DOTS_RANGE[k]);
  }
  return out;
}

// ---------- brand colour: every brand tone derived from one colour (and an optional second), in OKLCH ----------
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const hexOf = (c) => '#' + c.map((v) => Math.round(clamp(v) * 255).toString(16).padStart(2, '0')).join('');
const lin = (v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4, gam = (v) => v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
function oklch(h) {
  const [r, g, b] = rgbOf(h).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}
function fromLch(L, C, H) {                                   // back to sRGB, reducing chroma until it is in gamut
  for (let c = C; ; c *= 0.94) {
    const A = c * Math.cos(H), B = c * Math.sin(H);
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(gam);
    if (rgb.every((v) => v >= -0.001 && v <= 1.001) || c < 0.002) return hexOf(rgb);
  }
}
const shade = (h, dL) => { const [L, C, H] = oklch(h); return fromLch(clamp(L + dL, 0, 1), C, H); };
const lum = (h) => { const [r, g, b] = rgbOf(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hslLift = (h, dl) => {                                 // HSL lightness, saturation kept: a lift that stays saturated
  const [r, g, b] = rgbOf(h), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  const sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0, hue = !d ? 0 : mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const L = clamp(l + dl), c = (1 - Math.abs(2 * L - 1)) * sat, x = c * (1 - Math.abs(hue % 2 - 1)), m = L - c / 2;
  const k = Math.floor(hue) % 6, rgb = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k];
  return hexOf(rgb.map((v) => v + m));
};
const mix = (a, b, t) => hexOf(rgbOf(a).map((v, i) => v * t + rgbOf(b)[i] * (1 - t)));
/** The brand tones for a plate, as HSL steps measured from the approved orange (#f5821f): on a dark plate the side is
    #e0560f (hue -6, L -7) and the edge #ffb36b (hue +3, L +17), with an additive glow behind; on a light plate the
    top is the colour with a little more saturation, the side darker, edges clearly darker, and a soft normal-blend glow
    (about 0.3) behind. */
const hsl = (h) => { const [r, g, b] = rgbOf(h), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0, hu = !d ? 0 : mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hu * 60, s, l]; };
const fromHsl = (H, S, L) => { H = ((H % 360) + 360) % 360 / 60; L = clamp(L); S = clamp(S);
  const c = (1 - Math.abs(2 * L - 1)) * S, x = c * (1 - Math.abs(H % 2 - 1)), m = L - c / 2, k = Math.floor(H) % 6;
  return hexOf([[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k].map((v) => v + m)); };
const step = (h, dH, dS, dL) => { const [H, S, L] = hsl(h); return fromHsl(H + dH, S + dS, L + dL); };
function brandTones(color, color2, plate) {
  const dark = lum(plate) < 0.2;
  if (dark) {
    let edge = step(color, 3, 0.09, 0.17);
    for (let i = 0; i < 20 && contrast(edge, plate) < 3; i++) edge = step(edge, 0, 0, 0.03);   // 3:1 on the plate
    const weak = contrast(color, plate) < 1.6;
    return { 'accent-top': color, 'accent-side': step(color, -6, -0.03, -0.07), 'accent-edge': edge,
      'accent-top-end': color2 || color, 'accent-outline-edge': color2 ? step(color2, 3, 0.09, 0.17) : edge,
      'accent-tint': mix(color2 || color, plate, 0.15), 'accent-glow': weak ? edge : step(color, -2, 0.09, -0.04), 'glow-alpha': weak ? '0.52' : '0.42' };
  }
  const rich = step(color, 0, 0.08, -0.02);                                // on white a colour reads paler: push saturation a little
  const side = step(color, -3, 0.08, -0.07);
  let edge = step(color, -4, 0.02, -0.17);                                 // strokes on the colour: clearly darker
  for (let i = 0; i < 20 && contrast(edge, plate) < 2; i++) edge = step(edge, 0, 0, -0.03);       // a very light colour still holds its shape
  return { 'accent-top': rich, 'accent-side': side, 'accent-edge': edge, 'accent-top-end': color2 || rich,
    'accent-outline-edge': edge, 'accent-tint': mix(color2 || color, plate, 0.08), 'accent-glow': step(color, 0, 0.1, 0), 'glow-alpha': '0.3' };
}
/** dots: { tint }: the grey ramp [lo, mid, hi] in the brand colour. Edges take the colour itself (moved only as far as
    3:1 on the plate needs); detail and faces stay the same hue and chroma, a step lighter on a light plate and a step
    dimmer on a dark one, so they never fall to a brown or grey mix with the plate. */
function tintRamp(c, plate) {
  const dark = lum(plate) < 0.2, off = (x, min) => { for (let i = 0; i < 20 && contrast(x, plate) < min; i++) x = shade(x, dark ? 0.02 : -0.02); return x; };
  const hi = off(c, 3);                                        // each tone held to a floor on the plate, so a dark or pale colour still reads
  return dark ? [off(shade(hi, -0.16), 2), off(shade(hi, -0.07), 2.8), hi] : [off(shade(hi, 0.15), 1.5), off(shade(hi, 0.07), 2), hi];
}
export const BRAND = { hex: hex3, tones: brandTones, tint: tintRamp };


// ---------- the per-figure part: brand tones, glow, labels and the dots pass, as the engine's extension hooks ----------
const quad = (fs, uniforms) => { const mat = new THREE.ShaderMaterial({ uniforms, depthTest: false, depthWrite: false,
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: fs });
  const sc = new THREE.Scene(), m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); m.frustumCulled = false; sc.add(m); return { sc, mat }; };
const uni = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { value: v }]));
const GLOW = [{ blur: 28, k: 0.22 }, { blur: 6, k: 0.6 }];  // blur: sigma in plate units (64 px and 13.5 px at 1440 wide)
const glowTint = (m, aO, aH) => { m.uniforms.k.value = m.userData.base * aH; };   // a fading glow: its strength follows the hero amount

function mountPro(X) {
  let DS = dotsWith(dotsWith(DOTS, X.fig.dots), X.Q.get('dots') || '');
  let GA = 0.42, DARK = true, BK = '';                        // BK: the brand tones last written: rewritten only when the colour or the plate changes
  // the hero's glow, two layers under it: a wide soft bloom (additive on a dark plate, normal on a light one) and a
  // tight halo in an overlay blend. Overlay is approximated with fixed blending: on a dark plate 2 * base * glow
  // (the overlay formula's base < .5 branch, exact on the plate and the greys), on a light plate a screen that only
  // brightens (base > .5), so white is never muddied. Each texture is padded 3.2 blur radii so it reaches zero inside its plane.
  const glowShader = { vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; uniform vec3 color; uniform float k; uniform int mode; varying vec2 vUv;
      void main() { float m = texture2D(map, vUv).a * k;
        if (mode == 0) gl_FragColor = vec4(color, m);
        else if (mode == 1) gl_FragColor = vec4((1.0 - m + 2.0 * m * color) * 0.5, 1.0);
        else gl_FragColor = vec4(m * max(vec3(0.0), 2.0 * color - 1.0), 1.0); }` };
  function glowLook(m) {
    const L = m.userData.layer, base = GLOW[L].k * GA / 0.42 * X.glow;   // X.glow: the figure's glow option
    m.uniforms.color.value.copy(X.tc('accent-glow')); m.userData.base = base; m.uniforms.k.value = base;
    m.uniforms.mode.value = L === 0 ? 0 : DARK ? 1 : 2;
    if (L === 0) m.blending = DARK ? THREE.AdditiveBlending : THREE.NormalBlending;
    else Object.assign(m, { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor },
      DARK ? { blendSrc: THREE.DstColorFactor, blendDst: THREE.SrcColorFactor } : { blendSrc: THREE.OneMinusDstColorFactor, blendDst: THREE.OneFactor });
    m.needsUpdate = true;
  }
  // glow materials are kept for the next build rather than disposed: a rebuild every frame (an animating figure) would
  // otherwise drop the last user of the glow's shader program and link it again each frame
  const GPOOL = [], GT = new Map();                                       // glow textures by outline, counted by the glows using them
  const OWN = new WeakSet();                                              // this figure's Brand glows (X.extra also holds other add-ons')
  const sweepGlows = (all) => { for (const [k, e] of GT) if (all || e.n <= 0) { e.tex.dispose(); GT.delete(k); } };
  function glowMesh(pts, z, fk, dz) {
    const H0 = hull(pts);
    return GLOW.map((G, L) => {
      const m0 = G.blur * 3.2, xs = H0.map((q) => q[0]), ys = H0.map((q) => q[1]), x0 = Math.min(...xs) - m0, x1 = Math.max(...xs) + m0, y0 = Math.min(...ys) - m0, y1 = Math.max(...ys) + m0;
      const k = Math.min(3, (L ? 256 : 192) / Math.max(x1 - x0, y1 - y0)), key = L + '|' + k.toFixed(4) + '|' + H0.map((q) => ((q[0] - x0) * k).toFixed(1) + ',' + ((q[1] - y0) * k).toFixed(1)).join(' ');
      let e = GT.get(key);                                    // the same outline (a part that only moves) reuses its blurred texture
      if (!e) { const cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * k); cv.height = Math.ceil((y1 - y0) * k);
        const c = cv.getContext('2d'); c.filter = `blur(${(G.blur * k).toFixed(2)}px)`; c.fillStyle = '#fff'; c.beginPath();
        for (const q of H0) c.lineTo((q[0] - x0) * k, (q[1] - y0) * k); c.closePath(); c.fill();
        GT.set(key, e = { tex: new THREE.CanvasTexture(cv), n: 0 }); }
      e.n++;
      const tex = e.tex, mat = GPOOL.pop() || new THREE.ShaderMaterial({ ...glowShader, transparent: true, depthWrite: false,
        uniforms: { map: { value: null }, color: { value: new THREE.Color() }, k: { value: 0 }, mode: { value: 0 } } });
      OWN.add(mat);
      mat.uniforms.map.value = tex;
      mat.userData = { tex, gt: e, layer: L, fk, tint: glowTint }; X.extra.add(mat); glowLook(mat); if (fk) X.tint(mat);
      const geo = new THREE.PlaneGeometry(x1 - x0, y1 - y0), m = new THREE.Mesh(geo, mat); m.position.set((x0 + x1) / 2, -(y0 + y1) / 2, z + L * dz); m.frustumCulled = false; Object.assign(m.userData, { glow: true, hull: H0, drop: glowDrop, fade: glowFade, capture: glowCapture, glowItem }); return m;
    });
  }
  // ---------- dots: the scene in ink codes to an offscreen target, reduced to one texel per cell, then one mark per cell ----------
  // A cell's ink is the strongest code within about a cell of its centre (a plateau, then a soft falloff), so a line
  // sliding across the grid grows one dot as it shrinks the next instead of jumping; hero and outline are shares of the
  // ink around it. The grid is in screen space (it never scales with zoom) and may be turned by DS.angle.
  const CELL = quad(`uniform sampler2D src; uniform vec2 size, off; uniform float pitch, ang, face; uniform int k;
    void main() { vec2 cq = (floor(gl_FragCoord.xy) - off + 0.5) * pitch; float c = cos(ang), s = sin(ang); mat2 back = mat2(c, -s, s, c);
      float best = 0.0, sk = 0.0; vec3 sum = vec3(0.0);
      for (int j = -k; j <= k; j++) {
        for (int i = -k; i <= k; i++) {
          vec2 o = vec2(float(i), float(j)) / float(k), w2 = 1.0 - smoothstep(0.35, 0.85, abs(o)); float w = w2.x * w2.y;
          vec3 t = texture2D(src, (floor(size / 2.0 + back * (cq + o * pitch)) + 0.5) / size).rgb; best = max(best, (t.r < 0.55 ? t.r * face : t.r) * w); sum += t * w;
          sk += (t.g + t.b - t.r > 0.02 ? min(t.g, t.b) : 0.0) * w; } }   // ink texels only (g = b = r; a hero or outline texel, or a blend of both, has g + b <= r)
      gl_FragColor = vec4(best, clamp(sum.gb / max(sum.r, 1e-4), 0.0, 1.0), clamp(sk / max(sum.r, 1e-4), 0.0, 1.0)); }`,   // a: the share of ink
    uni({ src: null, size: new THREE.Vector2(), off: new THREE.Vector2(), pitch: 6, ang: 0, face: 1, k: 6 }));
  const dotFS = () => `uniform sampler2D cells, src; uniform vec2 ncell, off, size, org; uniform float pitch, ang, dsize, contrast, thr, jitter, reach, swell, heroMin; uniform int shape, heroOnly; uniform float bgA;
    uniform vec3 ptr, plate, lo, mid, hi, heroLo, heroHi, outl, inkC;
    float box(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
    vec3 ramp(float ink) { return ink < 0.55 ? mix(lo, mid, smoothstep(0.2, 0.55, ink) * 0.5) : mix(mid, hi, smoothstep(0.6, 1.0, ink)); }
    void main() { vec2 fc = gl_FragCoord.xy - org; float c = cos(ang), s = sin(ang); mat2 fwd = mat2(c, s, -s, c), back = mat2(c, -s, s, c);
      vec2 q = fwd * (fc - size / 2.0), id = floor(q / pitch), cq = (id + 0.5) * pitch;
      vec4 v = texture2D(cells, (id + off + 0.5) / ncell); float ik = v.a; v.gb = max(v.gb - ik, 0.0);   // ik: the share of ink (fillTone 'ink'), 0 with none
      vec2 h = fract(sin(vec2(dot(id, vec2(127.1, 311.7)), dot(id, vec2(269.5, 183.3)))) * 43758.5453); cq += (h - 0.5) * jitter * pitch;
      float ink = v.g > 0.5 && v.r > thr ? max(v.r, heroMin) : v.r, sw = 1.0 + 0.25 * swell * ptr.z * (1.0 - smoothstep(0.0, reach, distance(size / 2.0 + back * cq, ptr.xy)));
      float r = dsize * pow(ink, 0.8 * contrast) * sw * (1.0 + 0.85 * ik), d; vec2 l = q - cq;   // ink dots grow to close the grid, so the part reads as solid ink (full ink is solid in a halftone)
      if (shape == 1) d = box(l, vec2(r * 0.886));
      else if (shape == 2) d = (abs(l.x) + abs(l.y) - r * 1.253) * 0.7071;
      else if (shape == 3) { vec2 a = vec2(0.7071) * r * 1.15; vec2 pa = l + a, ba = 2.0 * a; d = length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)) - max(0.5, 0.26 * r); }
      else if (shape == 4) d = min(box(l, vec2(r, max(0.5, 0.26 * r))), box(l, vec2(max(0.5, 0.26 * r), r)));
      ${SHAPES.map((g, i) => `else if (shape == ${5 + i}) { ${g} }`).join('\n      ')}
      else d = length(l) - r;
      float al = clamp(0.5 - d, 0.0, 1.0) * smoothstep(thr, thr + 0.04, ink);
      vec3 col = mix(mix(mix(ramp(ink), outl, v.b), mix(heroLo, heroHi, 0.35 * smoothstep(0.6, 1.0, ink)), v.g), inkC, ik), base = plate;
      float ba = 0.0;
      if (heroOnly == 1) { vec3 p = texture2D(src, fc / size).rgb; float li = p.r * (1.0 - clamp(p.g / max(p.r, 1e-4), 0.0, 1.0));
        ba = clamp(li / 0.62, 0.0, 1.0); base = mix(plate, ramp(max(li, 0.62)), ba); al *= step(0.5, v.g); }
      gl_FragColor = bgA > 0.5 ? vec4(mix(base, col, al), 1.0) : vec4(col * al + ramp(max(ba, 0.62)) * ba * (1.0 - al), al + ba * (1.0 - al)); }`;
  const DOT = quad(dotFS(),
    uni({ cells: null, src: null, ncell: new THREE.Vector2(), off: new THREE.Vector2(), org: new THREE.Vector2(), size: new THREE.Vector2(), pitch: 6, ang: 0, dsize: 2.5, contrast: 1, thr: 0.05,
      jitter: 0, reach: 40, swell: 1, heroMin: 0, shape: 0, heroOnly: 0, bgA: 1, ptr: new THREE.Vector3(), ...Object.fromEntries(['plate', 'lo', 'mid', 'hi', 'heroLo', 'heroHi', 'outl', 'inkC'].map((k) => [k, new THREE.Vector3()])) }));
  DOT.n = SHAPES.length;
  const quadCam = new THREE.Camera(), RT = X.STAGED ? X.host.stage.targets : { scene: null, cells: null }, XRT = { scene: null, cells: null },   // staged: one pair for every plate, used in turn
     SWELL = { x: 0, y: 0, in: false, a: 0 }, CE = { c: 0 }, OFF = [0, 0];
  let DOTS_BUSY = false;
  // size-adaptive: about 100 cells across the object (never under 2.5 CSS px or 1.5 device px, never over DS.cell), eased
  // over 150 ms; below a 500 px object the face halftone thins and the hero's dots get a floor, so the silhouette reads
  function dotTargets() {
    if (DOT.n !== SHAPES.length) { DOT.n = SHAPES.length; DOT.mat.fragmentShader = dotFS(); DOT.mat.needsUpdate = true; }   // a shape registered since
    const pr = X.renderer.getPixelRatio(), wd = Math.round(X.W * pr), hd = Math.round(X.H * pr), sp = X.span, ang = DS.angle * RAD;
    const want = DS.auto ? clamp(sp / DS.across, Math.max(2, 1.5 / pr), DS.cell) : DS.cell;   // about 180 cells across: fine enough for dense figures like the keyboard
    CE.c = !CE.c || X.reduced || X.exporting ? want : CE.c + (want - CE.c) * (1 - Math.exp(-X.K.dt / 0.15));
    DOTS_BUSY = Math.abs(CE.c - want) > 0.01 || Math.abs(SWELL.a - +SWELL.in) > 0.002;
    const cell = Math.abs(CE.c - want) < 0.01 ? want : CE.c, pitch = (cell + DS.gap) * pr, small = DS.auto ? 1 - THREE.MathUtils.smoothstep(sp, 250, 500) : 0;
    const diag = ang ? Math.hypot(wd, hd) : 0, nx = Math.ceil((diag || wd) / pitch) + 2, ny = Math.ceil((diag || hd) / pitch) + 2;
    if (!RT.scene) { RT.scene = new THREE.WebGLRenderTarget(wd, hd, { samples: 4 });
      RT.cells = new THREE.WebGLRenderTarget(nx, ny, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false }); }
    if (RT.scene.width !== wd || RT.scene.height !== hd) RT.scene.setSize(wd, hd);
    if (RT.cells.width !== nx || RT.cells.height !== ny) RT.cells.setSize(nx, ny);
    const C = CELL.mat.uniforms, D = DOT.mat.uniforms; OFF[0] = Math.floor(nx / 2); OFF[1] = Math.floor(ny / 2); const off = OFF;
    C.src.value = RT.scene.texture; C.pitch.value = pitch; C.ang.value = ang; C.face.value = 1 - 0.6 * small; C.k.value = clamp(Math.ceil(pitch / pr), 2, 24);
    C.size.value.set(wd, hd); C.off.value.set(off[0], off[1]);
    D.cells.value = RT.cells.texture; D.src.value = RT.scene.texture; D.pitch.value = pitch; D.ang.value = ang; D.dsize.value = DS.size * cell * pr / 2; D.heroMin.value = 0.5 * small;
    D.contrast.value = DS.contrast; D.thr.value = DS.threshold; D.jitter.value = DS.jitter; D.reach.value = DS.radius * pr; D.swell.value = DS.swell;
    D.shape.value = DOT_SHAPES.indexOf(DS.shape); D.heroOnly.value = +DS.heroOnly;
    D.ncell.value.set(nx, ny); D.off.value.set(off[0], off[1]); D.size.value.set(wd, hd);
    SWELL.a = X.exporting ? 0 : X.reduced ? +SWELL.in : SWELL.a + (+SWELL.in - SWELL.a) * (1 - Math.exp(-X.K.dt / 0.12));
    D.ptr.value.set(SWELL.x * pr, hd - SWELL.y * pr, SWELL.a);
  }
  // a label: its text on a canvas, mapped onto the face plane (an exact parallelogram in this projection)
  function labelMesh(p, z, ls) {
    const { F, text, u, v, w, size } = p.o.label;
    if (!labelTex.has(text)) { const cv = document.createElement('canvas'), c = cv.getContext('2d'), fs = 64, font = `500 ${fs}px "IBM Plex Sans", system-ui, sans-serif`;
      c.font = font; cv.width = Math.ceil(c.measureText(text).width) + 8; cv.height = Math.ceil(fs * 1.25);
      c.font = font; c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText(text, 4, cv.height / 2); labelTex.set(text, { tex: new THREE.CanvasTexture(cv), r: cv.width / cv.height, w: cv.width, h: cv.height }); }
    const { tex, r } = labelTex.get(text), hw = size * 1.25 * r / 2, hh = size * 1.25 / 2;
    const q = [[u - hw, v + hh, 0, 0], [u + hw, v + hh, 1, 0], [u + hw, v - hh, 1, 1], [u - hw, v - hh, 0, 1]].map(([a, b, s, t]) => [X.P(...X.at3(F, a, b, w)), s, t]);
    const geo = new THREE.BufferGeometry(); geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(q.flatMap(([pt]) => [pt[0], -pt[1], z]), 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(q.flatMap(([, s, t]) => [s, t]), 2));
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }); mat.userData.tone = X.style.label(p); X.extra.add(mat);
    if (ls && ls[0] === '@') { mat.userData.fk = X.parseSpec(ls); X.tint(mat); }
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; Object.assign(m.userData, { label: true, q: q.map(([pt]) => pt), box: [labelTex.get(text).w, labelTex.get(text).h], drop: labelDrop, textItem }); return m;
  }

  // the glow's own ways in the engine's generic slots: handed back to the pool, faded with its bucket, set up for an export, as vector
  function glowDrop(o) { X.extra.delete(o.material); o.material.userData.gt.n--; o.material.uniforms.map.value = null; GPOOL.push(o.material); }
  function glowFade(o, a) { const m = o.material; if (m.userData.fk) X.tint(m); else m.uniforms.k.value = m.userData.base; m.uniforms.k.value *= a; }
  function glowCapture(m, o, clear) { const mat = m.material, L = mat.userData.layer;
    if (!o.glow || (clear && L === 1)) m.visible = false;      // on no plate the halo (an overlay on the plate) has nothing to work on
    else if (clear) { mat.uniforms.mode.value = 0; mat.blending = THREE.NormalBlending; mat.needsUpdate = true; } }   // the bloom as alpha
  function glowItem(m, map, { clear, sx }) {
    const u = m.material.uniforms, L = m.material.userData.layer, k = u.k.value; if (k < 0.002 || (clear && L === 1)) return null;
    const c = u.color.value.clone(); if (L === 1 && !DARK && !clear) c.setRGB(...c.toArray().map((x) => Math.max(0, 2 * x - 1)));
    return { z: m.position.z, kind: 'glow', pts: m.userData.hull.map(map), fill: '#' + c.getHexString(THREE.LinearSRGBColorSpace), opacity: Math.min(1, k), blur: GLOW[L].blur * sx,   // the glow shader writes its colour unconverted
      blend: clear ? 'normal' : L === 0 ? (DARK ? 'plus-lighter' : 'normal') : (DARK ? 'overlay' : 'screen') };
  }
  const labelTex = new Map();
  function labelDrop(o) { X.extra.delete(o.material); o.material.dispose(); }
  function textItem(mesh, map, op) { const Q = mesh.userData.q.map(map), [cw, ch] = mesh.userData.box;
    return { kind: 'text', matrix: [(Q[2][0] - Q[3][0]) / cw, (Q[2][1] - Q[3][1]) / cw, (Q[0][0] - Q[3][0]) / ch, (Q[0][1] - Q[3][1]) / ch, Q[3][0], Q[3][1]],
      x: 4, y: ch / 2, fontSize: 64, textLength: cw - 8, fill: '#' + mesh.material.color.getHexString(), opacity: mesh.material.opacity * op }; }
  // SWELL: the pointer over the plate, for the dots' swell
  X.on(X.canvas, 'pointerleave', () => { SWELL.in = false; });
  X.on(X.canvas, 'pointermove', (e) => { const r = X.canvas.getBoundingClientRect(); Object.assign(SWELL, { x: e.clientX - r.left, y: e.clientY - r.top, in: e.pointerType === 'mouse' }); });
  let SV = null;                                               // the live dots state, kept aside during an export
  return {
    brand(pl) {                                               // every brand tone, from the brand colour and the plate, as CSS variables
      const bk = X.brand.color + '/' + X.brand.color2 + '/' + pl;
      if (bk !== BK) { BK = bk; for (const [k, v] of Object.entries(brandTones(X.brand.color, X.brand.color2, pl))) X.root.style.setProperty('--' + k, v); }
    },
    paint(pl) {
      DARK = new THREE.Color(X.css('plate')).getHSL({}).l < 0.5; GA = (v => Number.isFinite(v) ? v : 0.4)(parseFloat(X.css('glow-alpha')));
      for (const m of X.extra) if (OWN.has(m)) glowLook(m);
      const U = DOT.mat.uniforms, hx = (k) => hex3(X.css(k)) || '#888888', tr = DS.tint && tintRamp(hx('accent-top'), pl);   // tint: the grey ramp in the brand colour
      for (const [u, k] of [['plate', 'plate'], ['lo', 'lo'], ['mid', 'mid'], ['hi', 'hi'], ['heroLo', 'accent-top'], ['heroHi', 'accent-edge'], ['outl', 'accent-outline-edge'], ['inkC', 'ink']])
        U[u].value.set(...rgbOf(tr && k in TINT ? tr[TINT[k]] : hx(k)));
    },
    tone(k) {                                                 // dots: a tone as its ink code (DOTCODE)
      if (!X.style.dots) return undefined; let [i, a] = DOTCODE[k] || [0.68, 0];
      if (FACE_CODES.includes(k) && (!DS.faces || (DS.heroOnly && a !== 1))) i = 0;   // faces off: only lines make dots
      if (k === 'ink-edge' && new THREE.Color(X.css('plate')).getHSL({}).l < 0.5) [i, a] = DOTCODE.mid;      // on the dark plate an ink part's edge dots are a lighter grey
      return '#' + [i, a & 1 ? i : 0, a & 2 ? i : 0].map((v) => Math.round(gam(v) * 255).toString(16).padStart(2, '0')).join('');
    },
    glowMesh, labelMesh,
    draw(vp) {                                                // dots: the scene in ink codes, reduced to cells, then one mark per cell
      if (!X.style.dots) return undefined;                    // undefined, not false: the hook goes on to the other add-ons' draw
      const renderer = X.renderer;
      dotTargets(); if (vp) DOT.mat.uniforms.org.value.set(vp.x * renderer.getPixelRatio(), vp.y * renderer.getPixelRatio());
      renderer.setRenderTarget(RT.scene); renderer.render(X.scene, X.cam);
      renderer.setRenderTarget(RT.cells); renderer.render(CELL.sc, quadCam);
      renderer.setRenderTarget(null); renderer.render(DOT.sc, quadCam);
      return true;
    },
    busy: () => (X.style.dots && DOTS_BUSY) || undefined,
    setDots(v) { const was = DS; DS = dotsWith(v === null ? DOTS : DS, v || {}); if (was.faces !== DS.faces || was.heroOnly !== DS.heroOnly || was.tint !== DS.tint) X.paint(); },
    dots: () => DS,
    exportBegin() { SV = { RT: { ...RT }, SW: SWELL.a, CE: CE.c, DB: DOTS_BUSY }; Object.assign(RT, XRT); },
    exportEnd() { if (!SV) return; Object.assign(XRT, RT); Object.assign(RT, SV.RT); SWELL.a = SV.SW; CE.c = SV.CE; DOTS_BUSY = SV.DB; SV = null; DOT.mat.uniforms.bgA.value = 1; },
    captureBegin(clear) { DOT.mat.uniforms.org.value.set(0, 0); DOT.mat.uniforms.bgA.value = clear ? 0 : 1; },
    built: () => sweepGlows(),
    dispose() {
      sweepGlows(true); for (const m of GPOOL) m.dispose(); GPOOL.length = 0;
      for (const q of [CELL, DOT]) { q.mat.dispose(); q.sc.children[0].geometry.dispose(); }
      for (const { tex } of labelTex.values()) tex.dispose(); labelTex.clear();
      for (const t of Object.values(XRT)) t?.dispose();
    },
  };
}
const PRO_EXT = { mount: mountPro };
const done = new WeakSet();
/** Registers Brand (alias accent) and Dots with an engine (this file's own import of linejig.js by default; the engine
    passes itself, so a copy loaded under another URL is served too). Once per engine. */
export function install(c = core) {
  if (done.has(c.STYLES)) return; done.add(c.STYLES);
  c.registerStyle('brand', brand, ['accent']); c.registerStyle('dots', dots); c.registerExtension(PRO_EXT);
}
install();
