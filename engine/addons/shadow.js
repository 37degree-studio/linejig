/* Linejig shadow add-on. Copyright 2026 Linejig. MIT licence, free like the core.
   addons/shadow.js, loaded by the engine only when a figure turns shadows on: shadow: true,
   ?shadow=1, {type: 'shadow', value: true | false | { on, tops }}, or fig.option('shadow', v). Not a style: it works under every style.

   One light, fixed to the world (fig.light, the direction toward it; default LIGHT: in front of the object, above and a
   little left, so at the rest view every shadow falls behind the object, up and to the right on screen). Every filled
   part casts: its world points (traced through P while the build runs) are pushed along the light onto the ground (z 0, or
   fig.ground) and every receiver, hulled, and drawn as one flat shadow with a soft edge that widens with the caster's height.
   Where a part touches a surface, a tighter, darker contact shadow. Shadows draw under the parts with MIN blending (MAX for a
   shade lighter than its surface), so overlaps never darken twice; they fade a little along their length and to nothing
   before the plate's edge. Built with the parts (only when the pose, view, style or theme changes); a bucket's own motion
   slides its shadows along the light with no rebuild.

   Figure side, all optional: K.receiver?.(F, ring, w) right after drawing a surface (a sheet, a desk top); a thin flat solid
   lying on the ground receives by itself. A part never shadows a receiver in its own ASSEMBLY row (a sheet's curl
   doesn't shadow its own sheet). cast: false on K.add's options or an ASSEMBLY row: no shadow; cast: true: a
   line-only part (a rod, a wire) casts too. light: [x, y, z]; ground: z; fitShadow: true (the engine fits the plate round it).
   A style themes it with rules.shadow: { color, cast, contact } or ({ dark, tone }) => that (color: a tone name or #hex;
   cast, contact: how far the plate moves toward it). */
import * as THREE from 'three';
import * as core from '../linejig.js';

const { hull, clamp } = core.STYLE_KIT;
// the default shade: a neutral grey from the tone ramp on the light plate; on the dark plate a clear step down, still neutral
export const SHADOW = { light: { color: 'lo', cast: 0.42, contact: 0.85 }, dark: { color: '#000000', cast: 0.85, contact: 1 } };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const VW = 400, VH = 320, EDGE = 34;                         // the plate, and the shadow's fade-out before its edge (plate units)

const material = (base, shade, k, fs) => new THREE.ShaderMaterial({
  uniforms: { uBase: { value: base }, uShade: { value: shade }, uK: { value: k }, uFS: { value: fs } },
  vertexShader: `attribute float cov, ht; varying float vc, vh; varying vec2 vp;
    void main() { vc = cov; vh = ht; vec4 w = modelMatrix * vec4(position, 1.0); vp = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 uBase, uShade; uniform float uK, uFS; varying float vc, vh; varying vec2 vp;
    void main() { float e = min(min(vp.x, ${VW}.0 - vp.x), min(-vp.y, ${VH}.0 + vp.y));
      float a = smoothstep(0.0, 1.0, vc) * uK * smoothstep(0.0, ${EDGE}.0, e) * (1.0 - 0.35 * smoothstep(0.3, 1.0, vh / uFS));
      gl_FragColor = vec4(clamp(mix(uBase, uShade, a), 0.0, 1.0), 1.0); }`,
  side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.CustomBlending,
  blendEquation: lum(shade) > lum(base) ? THREE.MaxEquation : THREE.MinEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });

// a convex CCW polygon of [u, v, h] with a soft edge e wide outside it: triangles of [u, v, coverage, h]
function feather(poly, e) {
  const n = poly.length, out = [], nm = poly.map((a, i) => { const b = poly[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / L, (a[0] - b[0]) / L]; });
  const o = (p, q) => [p[0] + q[0] * e, p[1] + q[1] * e, 0, p[2]], c = (p) => [p[0], p[1], 1, p[2]];
  for (let i = 1; i < n - 1; i++) out.push(c(poly[0]), c(poly[i]), c(poly[i + 1]));
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], m = nm[i];
    out.push(c(a), c(b), o(b, m), c(a), o(b, m), o(a, m));
    const m2 = nm[(i + 1) % n], a0 = Math.atan2(m[1], m[0]), da = ((Math.atan2(m2[1], m2[0]) - a0) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), k = Math.ceil(da / 0.4);
    for (let j = 0; j < k && da < Math.PI; j++) { const u0 = a0 + da * j / k, u1 = a0 + da * (j + 1) / k; out.push(c(b), o(b, [Math.cos(u0), Math.sin(u0)]), o(b, [Math.cos(u1), Math.sin(u1)])); }
  }
  return out;
}
// those triangles cut to a convex CCW clip polygon, every attribute interpolated
function clipTris(tris, clip) {
  const out = [];
  for (let t = 0; t < tris.length; t += 3) {
    let poly = tris.slice(t, t + 3);
    for (let i = 0; i < clip.length && poly.length; i++) {
      const a = clip[i], b = clip[(i + 1) % clip.length], side = (q) => (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]), src = poly; poly = [];
      src.forEach((p, j) => { const d = src[(j + 1) % src.length], sp = side(p), sd = side(d); if (sp >= 0) poly.push(p);
        if ((sp >= 0) !== (sd >= 0)) { const f = sp / (sp - sd); poly.push(p.map((x, k) => x + (d[k] - x) * f)); } });
    }
    for (let i = 1; i < poly.length - 1; i++) out.push(poly[0], poly[i], poly[i + 1]);
  }
  return out;
}
// a convex CCW polygon moved in by d on every side (a receiver's clip, kept clear of its own outline)
function inset(poly, d) {
  const n = poly.length, ln = poly.map((a, i) => { const b = poly[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, m = [(a[1] - b[1]) / L, (b[0] - a[0]) / L]; return [[a[0] + m[0] * d, a[1] + m[1] * d], [b[0] - a[0], b[1] - a[1]]]; });
  return ln.map(([p, r], i) => { const [q, t] = ln[(i + n - 1) % n], c = r[0] * t[1] - r[1] * t[0]; if (Math.abs(c) < 1e-9) return p; const k = ((q[0] - p[0]) * t[1] - (q[1] - p[1]) * t[0]) / c; return [p[0] + r[0] * k, p[1] + r[1] * k]; });
}

function mountShadow(X) {
  const { fig, Q, K } = X, P = (q) => X.P(...q);
  const st = { on: Q.has('shadow') ? Q.get('shadow') === '1' : !!fig.shadow, tops: Q.get('shadowtops') === '1' || !!fig.shadow?.tops, recv: [], meshes: [], L: [0, 0, 1], ms: 0 };
  K.receiver = (F, ring, w) => { if (st.on) st.recv.push({ F, ring: Array.isArray(ring[0]) ? ring[0] : ring, w, at: X.prims.length - 1 }); };
  const shift = (v) => { const a = P([0, 0, 0]), b = P(v); return [b[0] - a[0], a[1] - b[1]]; };
  function build() {
    const t0 = performance.now(), prims = X.prims, N = prims.length, STYLE = X.style, tone = X.tone;
    const dark = (() => { const c = new THREE.Color(X.css('plate')); return c.r + c.g + c.b < 0.3; })();
    const R = { ...SHADOW[dark ? 'dark' : 'light'], ...(typeof STYLE.shadow === 'function' ? STYLE.shadow({ dark, tone }) : STYLE.shadow) };
    const srgb = (c) => new THREE.Color(c).convertLinearToSRGB(), col = srgb(R.color[0] === '#' ? R.color : tone(R.color)), plate = srgb(tone('plate'));
    const onto = (b) => new THREE.Color(...['r', 'g', 'b'].map((k) => b[k] * col[k] / Math.max(plate[k], 0.02)));   // the darkening, carried onto a receiver's colour
    const l = fig.light || core.LIGHT, ln = Math.hypot(...l), Ld = st.L = l.map((c) => c / ln);
    const fp = fig.fit.points(K), FS = Math.max(...[0, 1, 2].map((i) => Math.max(...fp.map((q) => q[i])) - Math.min(...fp.map((q) => q[i])))), eps = 0.002 * FS, S = K.S;
    const G = fig.ground ?? Math.min(0, ...fp.map((q) => q[2]));
    const plane = (o, n, U, V, z, base, clip, row = -1) => ({ o, n: dot(n, Ld) < 0 ? n.map((c) => -c) : n, U, V, z, base, clip, row });
    const planes = [plane([0, 0, G], [0, 0, 1], [1, 0, 0], [0, 1, 0], -9.5, plate, null)];
    const recv = (F, ring, w, at) => { let o = at; while (o > 0 && !(prims[o].fill?.length > 2)) o--; const p = prims[o], t = STYLE.top(p) ?? STYLE.fill(p);
      planes.push(plane(X.at3(F, 0, 0, w), F.W, F.U, F.V, -9 + 18 * o / N + 6 / N, srgb(tone(t && t[0] !== '@' ? t : 'plate')), inset(hull(ring.map((q) => [q.u, q.v])), 1 / S), p.layer)); };   // row: its ASSEMBLY row
    for (const r of st.recv) recv(r.F, r.ring, r.w, r.at);
    prims.forEach((p, o) => { const so = p.o.solid; if (!so || Math.abs(so.F.W[2]) < 0.98) return;   // a flat solid lying on the ground (a sheet, a tray) receives too
      const zs = [so.w0, so.w1].map((w) => X.at3(so.F, 0, 0, w)[2]), ext = Math.max(...so.ring.map((q) => Math.hypot(q.u, q.v)));
      if (st.tops || (Math.min(...zs) <= G + eps && Math.abs(zs[1] - zs[0]) <= 0.025 * FS && ext >= 0.12 * FS)) recv(so.F, so.ring, zs[1] >= zs[0] ? so.w1 : so.w0, o); });
    const uv = (pl, q, h) => { const d = [q[0] - pl.o[0], q[1] - pl.o[1], q[2] - pl.o[2]]; return [dot(d, pl.U), dot(d, pl.V), h]; };
    const put = (pl, tris, k, p) => { if (!tris.length || !p.b?.g) return; const pos = [], cov = [], ht = [];
      for (const [u, v, c, h] of tris) { const q = P([0, 1, 2].map((i) => pl.o[i] + u * pl.U[i] + v * pl.V[i])); pos.push(q[0], -q[1], pl.z); cov.push(c); ht.push(h); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('cov', new THREE.Float32BufferAttribute(cov, 1)); geo.setAttribute('ht', new THREE.Float32BufferAttribute(ht, 1));
      const m = new THREE.Mesh(geo, material(pl.base, pl.clip ? onto(pl.base) : col, k, FS)); m.frustumCulled = false; m.renderOrder = 1;
      m.userData = { shadow: { n: pl.n, k, t0: p.t0 }, fade: () => {}, drop: (x) => x.material.dispose() }; p.b.g.add(m); st.meshes.push(m); };
    const cast = (pts, p, solid) => {
      if (pts.length < 2) return;
      const ds = planes.map((pl) => pts.map((q) => dot(pl.n, [q[0] - pl.o[0], q[1] - pl.o[1], q[2] - pl.o[2]])));
      if (ds.some((d) => d.every((x) => Math.abs(x) <= eps))) return;   // a decal lying on a surface (a pool of light): no shadow
      planes.forEach((pl, j) => {
        const d = ds[j]; if (pl.row === p.layer || Math.max(...d) <= eps) return;   // its own row's surface, or under or on this plane
        const nl = dot(pl.n, Ld), up = [], touch = []; let hs = 0;
        pts.forEach((q, i) => { if (d[i] < -eps) return; const h = Math.max(0, d[i]), s = h / nl; up.push(uv(pl, [q[0] - Ld[0] * s, q[1] - Ld[1] * s, q[2] - Ld[2] * s], h)); hs += h;
          if (d[i] <= eps) touch.push(uv(pl, q, 0)); });
        const poly = hull(up); if (poly.length < (solid ? 3 : 2)) return;
        if (pl.clip) { const bx = (a) => [Math.min(...a.map((q) => q[0])), Math.max(...a.map((q) => q[0])), Math.min(...a.map((q) => q[1])), Math.max(...a.map((q) => q[1]))], A = bx(poly), C = bx(pl.clip);
          if (A[1] < C[0] || A[0] > C[1] || A[3] < C[2] || A[2] > C[3]) return; }
        const cut = (tris) => pl.clip ? clipTris(tris, pl.clip) : tris;
        put(pl, cut(feather(poly, 1.2 / S + 0.025 * hs / up.length)), R.cast, p);   // the soft edge widens with the caster's height
        if (touch.length > 2) { const c = hull(touch); if (c.length > 2) put(pl, cut(feather(c, 4.5 / S)), R.contact, p); }
      });
    };
    st.meshes = [];
    prims.forEach((p) => {
      const cv = p.o.cast ?? X.ASSEMBLY[p.layer]?.cast, filled = p.fill?.length > 2;   // a filled part casts unless cast: false; lines only with cast: true
      if (p.o.label || cv === false || (!filled && cv !== true)) return;
      if (!filled) { for (const l of p.lines) cast(l.pts.map(X.world).filter(Boolean), p, false); return; }
      const seen = new Set(); for (const q of [...p.fill, ...(p.o.top || []), ...p.lines.flatMap((l) => l.pts)]) { const w = X.world(q); if (w) seen.add(w); }
      cast([...seen], p, true);
    });
    st.ms = performance.now() - t0;
  }
  return {
    trace() { if (!st.on) return; st.recv = []; return true; },
    built() { st.meshes = []; if (st.on) build(); },
    pose(t, whole, stk) {                                      // each shadow follows its bucket: slid along the light, faded with it
      for (const m of st.meshes) { const g = m.parent; if (!g) continue; const s = m.userData.shadow, wo = g.userData.wo || [0, 0, 0], d = dot(s.n, wo) / dot(s.n, st.L);
        const [x, y] = shift(st.L.map((c) => -c * d)); m.position.set(x, y, 0);
        const e = stk && (wo[0] || wo[1] || wo[2]) ? clamp(1 - Math.hypot(...wo) / Math.max(1e-6, Math.hypot(...(g.userData.from || [0, 0, 1])) * (fig.stack?.travel ?? 20))) : 1;
        m.material.uniforms.uK.value = s.k * clamp(g.userData.alpha ?? 1) * e * (whole ? 1 : clamp((t - s.t0) / K.TW)); }
    },
    option(k, v) { if (k !== 'shadow') return; st.on = !!(v && (typeof v !== 'object' || v.on !== false)); if (v && typeof v === 'object' && 'tops' in v) st.tops = !!v.tops; X.rebuild(); return true; },
    shadow: () => ({ on: st.on, tops: st.tops, ms: st.ms }),
  };
}
const EXT = { mount: mountShadow };
const done = new WeakSet();
/** Registers the shadow add-on with an engine (this file's own import of it by default). Once per engine. */
export function install(c = core) { if (done.has(c.STYLES)) return; done.add(c.STYLES); c.registerExtension(EXT); }
install();
