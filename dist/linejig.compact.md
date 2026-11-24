# linejig (compact)

Draw one object as an interactive 3D line illustration in three.js on the published kernel. Before drawing, write
three concepts (object, its one hero part, why, its one move), recommend one and wait for the user's pick unless they
said "just draw it". Draw in line art: white, black and the grey ramp, no colour. This compact edition leaves out
the workflow, the reference files and the starter page; attach the full single-file edition (linejig.md) for those.

A figure page needs the three.js import map, `<script type="importmap">{ "imports": { "three":
"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js", "three/addons/":
"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/" } }</script>`, the stylesheet
`https://linejig.com/kernel/linejig.css`, a `<main><div id="plate" role="img" aria-label="..."></div></main>`,
and a module script that imports `createFigure` from `https://linejig.com/kernel/linejig.js`.

## What stays out
These hold in line art; the styles change only what `## Style` says.

- **No text in the illustration.** No leaders, pointer dots, numbers on parts, captions, headings, labels or "Fig."
  marks. If the host page needs words, they are the page's job, not the drawing's.
- **No small detail.** No rivets, bands, hatching, engraving, textures, shading, gradients or glow.
- **No AI images or video,** and no tracing of generated pictures. Everything is drawn in code.

## The kernel
Every figure is built on the shared kernel, https://linejig.com/kernel/linejig.js (MIT; its header comment is the API;
read it there, or at `site/kernel/linejig.js` when working in the source repo). A figure file
holds only its model, its `ASSEMBLY` table and its `HERO` handlers, about 100 to 150 lines:

```js
import { createFigure } from '../kernel/linejig.js';
createFigure({ id, center, fit: { points }, ASSEMBLY, model(K, st) { ... }, state(K) { ... }, HERO: { onHover, onLeave, onClick } });
```

The kernel owns the camera and fit, the palette and styles, rounded prisms and painter fill, the line width and
0.5 px widths, the tween and spring, both intros, orbit, zoom, hit testing, cursors, reduced motion, capture hooks,
the embed contract, the **action event** (`HERO.action`, posted when the hero's move reaches its open state, so an
empty state or onboarding step can hand off to its host page) and `?mode=turntable` (no hand, a slow swing for
loading screens and recorded loops). Import `https://linejig.com/kernel/linejig.js` and link
`https://linejig.com/kernel/linejig.css`, with the three.js import map, as `scripts/starter.html` does.
Every other style is an MIT add-on file beside it (Brand and Dots in `linejig-pro.js`, Readout in `styles/readout.js`,
Pencil in `styles/pencil.js`): the kernel loads a style's file by itself, once, only when a figure asks for that style,
so a line-art page never downloads it.
To see finished figures, open them from the gallery and read their source.

## The look, in brief
Full rules and values in `references/drawing.md`.

- **Few rounded solids.** Build the object from a handful of rounded footprints (rounded rectangles, circles)
  extruded into prisms. Each prism shows its silhouette and one crease ring just inside its top edge. Use enough
  parts (usually 8 to 12) that the object reads as that specific object, and carry secondary detail (ticks, seams,
  rose points) as quiet `lo` lines rather than more weight.
- **One camera.** Orthographic 2:1 axonometric: azimuth 45°, sin(elevation) 0.5. The object is centred and fills
  about 60 to 75% of a 5:4 plate.
- **Filled with the ground.** Every face is filled with the plate colour and drawn back to front, so near parts
  hide far ones.
- **One line width.** About 1 px on screen for every line, at any size (three.js `LineMaterial`,
  `worldUnits: false`). When the drawing is dense, use one line in place of two; a second line, if truly needed, is
  about 0.5 px in `lo`.
- **White and black.** A near-white plate in light, a near-black plate in dark, and a grey ramp. No colour.
- **Hierarchy by tone only.** Five tones: `plate` (ground and fills), `edge` (silhouettes), `mid` (default lines),
  `lo` (dim and background lines) and `hi`, the one bright highlight on the one part that matters. Plus dashed
  guides and dots. The drawing sets no other colour.

## The hero part
Every illustration has **one hero part**, or one family of identical parts that each work the same way (the keys
of a keyboard): the part that carries the message (a compass's needle, a safe's lid, a
key, a balance's beam). Decide it while thinking, before you build, and write it down with the object: "Object Z,
hero H, because ...". The hero is the `hi` part, it makes the one move, and it is the only part that answers the
user. Everything else stays simple and still, and only moves as the whole object when the user turns or zooms it.

## Interaction, in brief
Full rules in `references/interaction.md`. After the intro lands:

- **Turn:** drag orbits the camera within limits, then springs back to the rest view after about 2 s.
- **Zoom:** wheel or pinch, toward the pointer, 0.8× to 2.5×; double-click resets. Lines stay 1 px.
- **Hero:** hovering makes the hero respond the way the real part would (the needle turns toward the pointer like a
  magnet and springs back on leave); a click gives it a kick. The cursor is the only hint: no text, no UI.

## Motion, in brief
Full rules in `references/motion.md`.

- **three.js 0.160.0**, Line2 / LineSegments2 fat lines, pinned, with an import map (the kernel does the rest).
- **The intro is the user's choice, `stack` by default:** `draw` (lines draw on) or `stack` (the object builds from the ground up, one
  layer at a time), with more ideas in `references/motion.md`. One `INTRO` setting, overridable with `?intro=`.
- **One move that means something,** and it lands once: the intro plays, then the object does the thing it is
  for (a needle settles, a lid lifts, a key turns, a telescope swings) or the camera pushes in or pans.
- **Timing.** A 700 ms tween on `cubic-bezier(.32,.72,0,1)` for discrete moves; a spring (k 100, c 18, m 1) for
  things that should overshoot a little and settle, like a needle. Draw-on about 1200 ms, left to right.
- **End on the drawing.** Hold still or idle very slowly (a degree or two over a minute).
- **Reduced motion** (`prefers-reduced-motion` or `?reduced=1`): show the final state at once.
- **Capture hooks:** `?freeze=MS` stops the clock MS after the start; `?click=ID@MS` clicks the hero at MS.
