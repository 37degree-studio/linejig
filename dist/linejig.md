# linejig (single-file edition)

> This is the `linejig` agent skill in one file, for chat tools that have no skill folders
> (ChatGPT, Grok, Gemini, Claude.ai and others). Add it to a project's instructions or knowledge files, or attach it
> to a chat, then ask for a 3D line illustration. Coding agents (Claude Code, Codex, Cursor, Gemini CLI, Copilot and
> others) should install the skill folder instead: `npx linejig install`.
>
> Where the text names a file such as `references/motion.md`, that file is included below under the same name. If
> you cannot run a browser or a shell, skip the headless render checks and ask the user to open the page and look.

**When to use it:** Draws interactive 3D line illustrations in three.js. One object is built from a few rounded solids and drawn as 3D line illustrations in an isometric view (2:1 axonometric) with one fine line width, white and black and hierarchy by tone, so all figures keep a consistent illustration style. It builds in (stack or draw-on), then its one hero part (a needle, a lid, the keys of a keyboard) answers hover and click, and the user can drag to turn and zoom it. Illustration only, with no captions, leader labels, logos or generated images. Use it whenever someone asks for an interactive 3D illustration, a line-art, line-drawn, technical-drawing or isometric object illustration, an animated three.js line drawing, a draw-on or assembly animation, an illustration for an empty state, 404 page, onboarding step, slide or hero, or to add, change or embed a figure from the Linejig gallery, even if they only say "add a drawing here".

## Linejig

Linejig draws one object per illustration as interactive 3D line art in three.js, on a shared engine that keeps every
figure in the same style. Everything this skill needs is in this folder.

### Habits that hold for every figure

- **Is there one already?** Before drawing, check the gallery manifest (https://linejig.com/illustrations.json; the gallery
  is https://linejig.com/library.html and each figure lives at https://linejig.com/<id>/). Use one only if it shows the thing the page is about, literally.
- **Concept: one object, three options.** Write three concepts, recommend one in a sentence, and wait for the user
  to pick, unless they said "just draw it". After the pick, do not stop again until the drawing is checked.
- **A silhouette you can name at thumbnail size,** with features that change the outline, not only sit inside it.
- **Logical motion.** Everything moves in the real order of cause and effect: parts assemble the way the real
  thing is put together, and the hero does what the real part does.
- **Name what it shows, never whose it is:** no logos, companies, products or people, in the drawing or its words.
- **No long dashes** anywhere in the words.

The drawing rules follow the Hairline figure kernel by Lucas Marques (MIT): https://hairline.lucasmarkes.com and
the npm package `@lucasmarkes/hairline`.

### Before you draw: think first

The user judges the idea before the execution.

1. Say what the drawing sits beside, in one sentence.
2. Write three concepts (`references/metaphors.md`): "Object Z, hero H, because ..., its intro and its one move M."
   If one needs a caption to be understood, drop it. Recommend one and wait for the pick.
3. If the user sent references, explain how each works before you build.

### What stays out

- **No text in the illustration.** No leaders, pointer dots, numbers on parts, captions, headings, labels or "Fig."
  marks. If the host page needs words, they are the page's job, not the drawing's.
- **No small detail.** No rivets, bands, hatching, engraving, textures, shading, gradients or glow.
- **No AI images or video,** and no tracing of generated pictures. Everything is drawn in code.

### The kernel

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
The Brand and Dots styles are Linejig Pro and live in `linejig-pro.js` beside it: the kernel loads that file by itself,
once, only when a figure asks for brand or dots, so a line-art page never downloads it.
To see finished figures, open them from the gallery and read their source.

### Style

This skill draws in **line art** (`references/styles.md`), the kernel's default: white and black only, the grey ramp,
`hi` for the hero, text-free. The Brand and Dots styles (the hero in a brand colour; the drawing as a dot matrix)
come with Linejig Pro, the `linejig-pro` skill (https://linejig.com/pricing). If it is installed, follow it for
those styles; if not, draw in line art. Either way the model, the assembly and the hero are the same, so a figure
made here works in every style.

### The look, in brief

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

### The hero part

Every illustration has **one hero part**, or one family of identical parts that each work the same way (the keys
of a keyboard): the part that carries the message (a compass's needle, a safe's lid, a
key, a balance's beam). Decide it while thinking, before you build, and write it down with the object: "Object Z,
hero H, because ...". The hero is the `hi` part, it makes the one move, and it is the only part that answers the
user. Everything else stays simple and still, and only moves as the whole object when the user turns or zooms it.

### Interaction, in brief

Full rules in `references/interaction.md`. After the intro lands:

- **Turn:** drag orbits the camera within limits, then springs back to the rest view after about 2 s.
- **Zoom:** wheel or pinch, toward the pointer, 0.8× to 2.5×; double-click resets. Lines stay 1 px.
- **Hero:** hovering makes the hero respond the way the real part would (the needle turns toward the pointer like a
  magnet and springs back on leave); a click gives it a kick. The cursor is the only hint: no text, no UI.

### Motion, in brief

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

### Workflow

1. Think (above): message, object, hero part, its one move and its hover response. For the `stack` intro, also
   write the object's assembly table (type, base, each part's mounting face and `from` direction; see
   `references/motion.md`, "Planning the stack").
2. Build on the kernel from `scripts/starter.html`: replace the placeholder model, `ASSEMBLY` and `HERO`
   with yours (mark the hero's row `hero: true`), assign tones, set the move. Never copy kernel code into a figure.
3. Render frozen frames at the start, middle and end of the move, in both palettes, at desktop and phone width
   (`references/verify.md`). Look hard; fix and rerender.
4. Check the console for errors. Ship with pinned library versions.
5. **Lock it into the gallery** (only when working in the source repo) once the user approves it (they say it's
   locked, final or approved). Build it in
   `site/<id>/index.html` in the source repo, then add one entry to the gallery manifest
   `site/illustrations.json` (`id`, `name`, `path`, `category`, `message`, `hero`, `hover`, `click`, `intros`,
   `locked`, `date`, and `action: {id, label}` if the hero hands off) and nothing else; the gallery at
   `site/library.html` groups entries by `category` (the manifest's `categories` list). To show the user a figure
   before approval, add it with `locked: false`: the gallery shows it tagged draft (`?drafts=0` hides drafts). Once
   approved, set `locked: true`, push, and redeploy the site's Vercel project. The kernel keeps the embed contract, so the
   gallery can drive every figure.

### Using it with what you already have

Most figures go into a product that already has a look. Full notes in `references/integration.md`.

- **On a component library** (shadcn/ui, or any token-based theme): the surface token the figure sits on becomes the
  plate (`?plate=<light>,<dark>`), the ink stays the kernel's grey ramp, the frame sits in a card at 5:4, and a class-based
  dark mode is passed on with `?theme=` and the `theme` message.
- **From the user's own illustration or SVG:** read it for the object and its parts, rebuild each shape as a kernel
  footprint (the kernel has no SVG import, so nothing is traced automatically), drop small detail and every word,
  choose the hero part, and give it hover and click like any other figure.

### The source repo

The gallery, the kernel source and the figure pages live in the Linejig source repo (`site/kernel/linejig.js`,
`site/<id>/`, `site/illustrations.json`). Steps marked "only when working in the source repo" apply only there;
everywhere else, import the published kernel from https://linejig.com/kernel/.

### Lessons (do not repeat these)

- **Shallow ideas get rejected** however well drawn. Think first.
- **Detail is not quality.** Early drawings carried rivets, bands and three line weights; the simpler
  line art reads better small and animates cleaner.
- **No AI generation** for the drawings or their motion; the user rejected it.
- **Stop what is not on screen.** A drawing left running showed over other slides (a balance figure on a deck). When an
  illustration leaves, hide it and stop its loop.

### References

- `references/metaphors.md`: choosing an object for a message, with an example set.
- `references/drawing.md`: camera, rounded prisms, painter fill, the one width, the five tones, palettes.
- `references/motion.md`: moves, timings, springs, draw-on, reduced motion, hand-overs.
- `references/styles.md`: line art, which part is the hero, the floor grid, and where the Pro styles live.
- `references/interaction.md`: the hero part, hover and click responses, orbit, zoom, hit testing, cursors.
- `references/verify.md`: headless Chrome capture, frozen frames, console errors.
- `references/integration.md`: on top of a component library (tokens, cards, dark mode), and from the user's own
  illustration or SVG.
- https://linejig.com/kernel/linejig.js: the kernel; its header is the API.
- https://linejig.com/illustrations.json: the gallery manifest; each entry's `path` is a figure page to read.
- `scripts/starter.html`: a minimal figure on the kernel with a placeholder object. Open it, or capture with
  `?freeze=MS`.

## File: references/drawing.md

### Drawing rules

These follow the Hairline figure kernel (Lucas Marques, MIT): https://hairline.lucasmarkes.com, published on npm as
`@lucasmarkes/hairline`. Its kernel's index comment lists the primitives, and its figures show how small a figure
is (about 100 lines). Borrow the rules, not the code: this skill draws in three.js.

#### 1. Camera and plate

- **Orthographic 2:1 axonometric:** azimuth 45°, `k = sin(elevation) = 0.5`. One camera for the whole drawing, so
  any camera move starts and ends in the same projection.
- World space: x and y on the ground, z up. With this camera the corner with the largest x + y is nearest the viewer.
- **Plate:** 5:4 (Hairline draws in a 400 × 320 viewBox). The object is centred and its box fills about 60 to 75% of
  the plate's width (Hairline's boxes come out 230 to 310 wide, 180 to 245 tall). Fit with the object's most extreme
  pose (the lid fully open, the needle at its widest swing), so it never leaves the plate mid-move.
- The plate scales to its container; on a phone it simply gets smaller. Lines stay 1 px.

#### 2. Rounded solids

- Build from **rounded footprints**: a rounded rectangle (corner radius at most half the shorter side) or a circle,
  extruded from z0 to z1 into a prism.
- Each prism draws **two things**: its **silhouette** (the outline of the whole solid as seen) and **one crease
  ring** inset slightly (Hairline: 0.6 to 2.2 world units) from the top edge. The crease gives the top a thickness
  without adding edges. Keep the inset under half the shorter side, or the crease turns inside out.
- **Enough structure to name the object at a glance,** and no more. Usually 8 to 12 solids. Keep the parts that
  make its silhouette specific (a compass's gimbal and yoke, a safe's hinges and handle), not just its generic shape.
  Too few parts reads as a placeholder; the first compass at 3 to 4 solids was "too simple".
- **Secondary detail lives in `lo`:** tick rings, rose points, panel seams and other flat marks lying on a surface are
  single `lo` (or `mid`) lines, so the drawing stays quiet while it reads as real. Drop the finest marks at small
  sizes if they turn to noise.
- No rivets, hatching, engraving, texture, shading, gradient or glow.

In three.js: a prism is an extruded `Shape` (or a `CylinderGeometry` for a circle) with a ground-coloured fill mesh,
plus fat-line loops for the silhouette and crease. A silhouette can be taken from `EdgesGeometry` (crease angle
about 35°) for straight-sided parts, or built from the footprint ring at z0 and z1 plus the two side tangents for
round ones.

#### 3. Hidden lines: fill with the ground

Fill every face with the plate colour and draw back to front, so a near part covers a far one exactly. No
hidden-line maths. In three.js, give fills `polygonOffset` (factor 1, units 2) so lines on their edges win the depth
test, or order with `renderOrder` by x + y.

#### 4. One line width, and fewer lines when dense

Every line is the same fine line: about 0.9 to 1 px on screen, non-scaling (`LineMaterial`, `worldUnits: false`,
`resolution` set to the canvas size in CSS px times the pixel ratio). Round joins and caps. Never thicken a line to
make it important; change its tone.

**When the drawing gets dense** (many repeated parts, such as keycaps, piano keys, windows on a facade or the slats
of a shutter), use **one line in place of two**:

- Drop the crease ring on repeated parts; the outline of the top face is enough.
- Draw one line per real edge. No parallel lines tracing the same rim three or four times.
- If a second line is truly needed (a plate band, a dish), draw it at the **minimum width, about 0.5 px** on screen,
  in `lo`, so the drawing stays easy to look at.

Check dense areas at 2× zoom: they should read calmly, not as a hatch of parallel lines. (The first keyboard had a
crease on every cap and four lines on the case rim; it read as noise.)

#### 5. Tones

| Tone | Use |
|---|---|
| `plate` | the ground, and the fill of every face |
| `edge` | silhouettes |
| `mid` | the default line: creases, inner edges |
| `lo` | dim lines: background parts, flat marks, glass |
| `hi` | the one bright highlight: the part that carries the message (a needle, a key, a door) |
| dashed | a guide or axis, in `lo` |
| dot | a small filled dot, in `hi` or `mid` |

One `hi` part per drawing. Contrast must step clearly: `hi` > `edge` > `mid` > `lo` against the plate.

#### 6. Palette: white and black, the same for every illustration

Every illustration uses this one palette (the kernel's `linejig.css`). No per-illustration colours: a near-white
plate in light, a near-black plate in dark, a grey ramp, and the `hi` tone at the far end of the ramp. An embed may set its plate to the host's surface
with `?plate=<light>,<dark>` (`integration.md`), and the ramp stays as it is.

| Tone | Light | Dark |
|---|---|---|
| plate | `#f7f7f8` | `#111111` |
| hi | `#17171a` | `#e6eaf0` |
| edge | `#6a6a72` | `#a8aab1` |
| mid | `#8f8f97` | `#797b82` |
| lo | `#b6b6bc` | `#4f5056` |

Contrast against the plate is about hi 16 to 18, edge 5 to 8, mid 3 to 4.5, lo 2 to 2.5. These are steeper than
Hairline's own defaults, which are tuned for small figures in cards and read too faint at large sizes (both the
compass and the camera had to be brightened). The host page around a figure should use the same plate colour, so
the figure sits seamlessly on it.

Switch with `prefers-color-scheme`, or a `data-theme` / `?theme=` override. Grain is not used.

## File: references/integration.md

### Using it with what you already have

Two common starts: a product built on a component library, and an illustration or SVG the user already has. Both
end in an ordinary figure on the kernel, so every rule in `SKILL.md` still holds. This file names only settings the
kernel really has; its header comment (https://linejig.com/kernel/linejig.js) is the authority.

#### On top of a component library (shadcn/ui and similar)

A figure is a small page. Either embed a gallery figure (`https://linejig.com/<id>/index.html`) in an iframe, or
build a figure page of your own on the kernel and serve it from the project. Either way the host talks to it through
the address and through messages.

##### Theme tokens to plate and ink

| Kernel input | Where it comes from | How to pass it |
|---|---|---|
| Plate (the ground every face is filled with) | the surface the figure sits on: `--card` inside a Card, `--background` on the page, `--muted` in a muted well | `?plate=<light>,<dark>`: two six-digit hex values without `#`, light then dark (defaults `f7f7f8,111111`) |
| Ink (`hi`, `edge`, `mid`, `lo`) | nothing: keep the kernel's grey ramp | not an address setting |
| Style | line art, the default; the Brand and Dots styles, with the brand colour from `--primary`, are in the `linejig-pro` skill | nothing to pass |

- Tokens are often OKLCH or HSL (`--primary: oklch(0.205 0 0)`). The kernel takes hex, so convert the computed colour
  (in the browser, `getComputedStyle(el).backgroundColor` on an element that uses the token gives `rgb(...)`; turn
  that into hex) for both the light and the dark theme.
- **Ink stays grey.** The tones are measured for contrast against the plate, so do not tint them to the page's
  foreground. On a figure page you own, they are the CSS variables `--hi --edge --mid --lo` from `linejig.css`;
  override them only if the user asks, per theme, keeping `hi > edge > mid > lo` in contrast against the plate, and
  measure the rendered pixels.
- `?plate=` is read once at load, in an iframe page. To change the plate later, reload the frame with a new address.

##### Sizing in cards

- The drawing fits a 5:4 plate inside whatever box it gets; 400 by 320 is the natural shape and any other shape adds
  margin. In a card, give the frame `width: 100%; aspect-ratio: 5 / 4; border: 0` and let the card's padding frame it.
- Keep `embed=1` on every embed: the wheel and a vertical swipe then scroll the page instead of zooming the object.
- Add `loading="lazy"` and a `title` that names the object. Each frame is its own WebGL context, so keep three or
  four live figures per page at most and show a still for the rest.
- The figure never draws words. Headings, body text and the call to action are the card's: put the label of the
  hero's action on a Button in the card footer, and also run it when the figure posts `action`.

##### Dark mode

- Without `?theme=` a figure follows the visitor's system setting. shadcn/ui (and most `next-themes` setups) switch
  with a `dark` class on `<html>` instead, so the figure must be told: start it with `?theme=light` or `?theme=dark`
  from the current class, and post `{type: 'theme', value}` whenever the class changes.
- Post only after the figure has sent `ready`, and always to the origin `https://linejig.com` (or your own origin
  for a self-hosted figure page). Check `e.origin` and `e.source` on everything you receive.

##### A React component, as a sketch

```jsx
import { useEffect, useRef } from 'react';

const ORIGIN = 'https://linejig.com';
const hex = (rgb) => rgb.match(/\d+/g).slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('');

export function LinejigFigure({ id, title, plate = 'f7f7f8,111111', onAction }) {
  const ref = useRef(null);
  const dark = () => document.documentElement.classList.contains('dark');
  useEffect(() => {
    const frame = ref.current;
    const send = (m) => frame?.contentWindow?.postMessage(m, ORIGIN);
    let ready = false;
    const onMessage = (e) => {
      if (e.origin !== ORIGIN || e.source !== frame.contentWindow) return;
      if (e.data.type === 'ready') { ready = true; send({ type: 'theme', value: dark() ? 'dark' : 'light' }); }
      if (e.data.type === 'action') onAction?.(e.data.id);
    };
    const watch = new MutationObserver(() => ready && send({ type: 'theme', value: dark() ? 'dark' : 'light' }));
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    addEventListener('message', onMessage);
    return () => { removeEventListener('message', onMessage); watch.disconnect(); };
  }, [onAction]);
  const q = new URLSearchParams({ embed: '1', plate, theme: dark() ? 'dark' : 'light' });
  return <iframe ref={ref} src={`${ORIGIN}/${id}/index.html?${q}`} title={title} loading="lazy"
    style={{ width: '100%', aspectRatio: '5 / 4', border: 0 }} />;
}
```

Use it inside a Card's content, with the words in the card and the action on a Button:
`<LinejigFigure id="empty-inbox" title="Letter tray" plate="ffffff,0a0a0a" onAction={openComposer} />`. `hex()`
turns a computed `rgb(...)` into the six digits the address wants. The `plate` values here are examples:
read the real ones from the project's tokens.

#### Starting from the user's own illustration or SVG

The kernel draws only its own primitives: footprints extruded into rounded prisms (`K.rrect`, `K.circ`, `K.box`,
`K.turn`, then `K.solid`) and raw lines (`K.add`). It has no SVG import and no image tracing, so the user's artwork is
a reference you read and rebuild by hand, never a file the kernel loads.

1. **Check the source.** Use the user's own drawing, or one they have the right to use. Never trace a generated
   picture (`SKILL.md`, "What stays out").
2. **Name the object and its parts.** What is it, what are its 8 to 12 parts, and which outline features make it
   recognisable at thumbnail size? Drop every word, number, logo, texture, gradient and small detail in the source.
3. **Rebuild each part as a footprint.** A rectangle or rounded rectangle becomes `K.rrect` (or `K.box` for a part
   with a bevel), a circle becomes `K.circ`, a turned shape gets `K.turn`. For a free-form outline, sample the path
   into points and build a ring of `{ u, v, nu, nv }` (position and outward normal), the footprint format the kernel
   uses. Give each part a height (`w0`, `w1`) and a frame (`K.axes`), since an SVG is flat and the figure is not.
4. **Place it in the one camera.** The view is always the 2:1 axonometric; a front-on SVG is redrawn in it, not
   kept front-on. Set `fit.points` to the most extreme pose.
5. **Choose the hero part.** The part the message is about (`references/styles.md`, "Which part takes the colour"):
   it is the `hi` part. Drop the source's colours; the drawing is white, black and grey.
6. **Give it hover and click.** Register its hit area with `K.hit(id, poly)` (the silhouette `K.solid` returns works),
   give `HERO` its `onHover`, `onLeave` and `onClick` with the move the real part makes (`references/interaction.md`),
   and an `action` with `opened(st)` if a click should hand off to the host page.
7. **Plan the intro** with an `ASSEMBLY` table (`references/motion.md`, "Planning the stack"), then render and check
   it like any other figure (`references/verify.md`), side by side with the source so the user can compare.

## File: references/interaction.md

### Interaction rules

The illustration plays its intro (draw-on, then the hero's move), then becomes something the user can handle.
Interaction turns on only after the intro lands.

#### One hero, the rest still

- Name the hero before building: the one part that carries the message. It is the `hi` part. If the object has a
  control that drives another part (a camera's shutter button drives the lens and shutter), the control is the hero:
  hover is the half-press (the lens hunts focus), click is the full press (the shutter fires).
- **The hero can be a family** of identical parts that each work the same way: the keys of a keyboard, piano keys,
  buttons on a panel, drawers in a cabinet. Then every member answers the pointer, one at a time (hover presses or
  opens the one under the pointer; click does its full action). One member may carry the `hi` tone as the accent
  (the keyboard's Enter); the rest keep their tones. The frame or case still stays still.
- Only the hero has its own response. Every other part moves only with the whole object, when the user turns or
  zooms the view.
- The hero's response is what the real part does when touched or approached:

| Object | Hero | Hover | Click or tap |
|---|---|---|---|
| Camera | shutter button | half-press: the focus ring hunts | the shutter fires, the lever winds on |
| Compass | needle | turns toward the pointer, like a magnet, on the spring | swings off about 90° and settles back |
| Safe / chest | lid | lifts a little, as if unlatched | opens fully, then closes |
| Key | key | turns a quarter in the lock | turns fully and back |
| Keyboard | every key (a family), Enter as the `hi` accent | the key under the pointer presses down on the spring | its cap lifts to show the switch, then drops back |
| Balance | beam | tips toward the side under the pointer | swings and settles level |
| Theodolite | alidade and telescope | turns to sight the pointer | sweeps a bearing and returns |

  If the hero has no natural response, choose another hero or another object.
- On leave, the hero springs back to rest.

#### Turning and zooming the view

- **Turn:** a click-drag, or a one-finger drag on touch, orbits the camera around the object. Clamp azimuth to ±40°
  and elevation to 15° to 60° around the rest view, and damp it with the spring. On release the view stays for
  about 2 s, then springs back to rest, so the drawing always returns to its composed view.
- **Zoom:** the wheel or a two-finger pinch, 0.8× to 2.5×, toward the pointer (orthographic zoom plus a pan). Lines
  stay 1 px at every zoom. A double-click or double-tap resets the view.
- **Do not fight the page.** On a full-screen illustration the wheel may zoom. On an illustration embedded in a
  scrolling page, the wheel zooms only with Ctrl or a pinch (the kernel does this under `?embed=1`), so scrolling still
  scrolls. Put `touch-action: none` on the canvas only.

#### Hit testing

Raycast against the hero's fill mesh. Give it a generous, invisible hit area (a disc over the compass card, a box
around a key), so a thin part is easy to catch.

#### Hints

The cursor is the only hint: `grab` / `grabbing` over the object, `pointer` over the hero. No text, tooltips,
handles or UI chrome.

#### Reduced motion

Direct manipulation still works (the user is driving it), but with no springs or overshoot: the hero snaps to its
target and the view stays where it was left.

#### In the kernel

Figures are built on the kernel (https://linejig.com/kernel/linejig.js), which wires orbit, zoom, hit testing, cursors and reduced motion.
The figure registers hit areas while it draws (`K.hit(id, poly)`, nearest last) and names its hero:

```js
HERO: { onHover(id, p, K) {}, onLeave(id, K) {}, onClick(id, p, K) {}, action: 'compose', opened(st, K) {} }
```

`id` is the hit area's id, so a family hero gets one per member. `K.hover` and `K.pointer` are there each frame for a
hero that follows the pointer (the needle, the focus ring).

#### The action event

A hero's click can hand off to the host page: an empty state's "compose", an onboarding step's "continue". Give the
hero `action: '<id>'` and `opened(st)`, true once its move reaches its open state (the lid open, the cap lifted).
At that moment the kernel posts `{type: 'action', id, figure}` to the parent when embedded, and dispatches a
`linejig:action` CustomEvent on the window when standalone. Without `opened`, it fires one tween (700 ms) after
the click. The host owns the words (the gallery shows the manifest's `action.label` as a button); the drawing never
does.

#### Turntable mode

`?mode=turntable`, or the `mode` message: no hand, and after the intro the object turns slowly about its vertical
axis, ±35° over 40 s (or one full turn in 40 s with `turntable: 'full'`, only for a figure whose back is finished).
For loading screens and screen-recorded loops. Reduced motion holds it still.

#### Open finished, click from the host, keyboard

- `?intro=none` (any figure) opens the figure finished and live, with no intro played. `def.intro: 'none'` and
  `fig.setIntro('none')` do the same. With none, `?freeze=MS` counts from the finished state. `none` is never listed in
  the `intros` the figure reports, so menus built from that list stay as they were.
- Embed message in: `{type: 'click', id?}` clicks the hero as a pointer press would (id defaults to the hero), and
  `{type: 'intro', value: 'none'}` jumps to the finished figure. The `ready` message carries `click: true`, so a host
  can check for the click message before relying on it.
- The `createFigure` result has `setIntro(name | 'none')` and `click(id?)`. A def can carry `name` (used for the
  aria-label) and `HERO.label` (the action's wording).
- Keyboard: a figure with `HERO.action` that is interactive and takes pointer events is a button. Tab focuses it and
  shows the hover state with a 2 px ink focus ring around the object; Enter or Space clicks; Escape or blur leaves.
  Turntable, freeze and `pointer-events: none` hosts get no tab stop. A cross-origin host that disables pointer events
  on the iframe should also set `tabindex="-1"` on it.

## File: references/metaphors.md

### Choosing the object

#### What makes a good object

An object earns its place when it does three jobs at once:

1. **It says the message without words.** Someone who sees only the drawing gets the idea: a safe holds things
   securely, a balance is level, a key opens one door.
2. **Its structure echoes the content, silently.** Three service groups become three trays; stages become
   landings. The drawing carries no labels, so the echo has to work without words, or not be needed.
3. **It belongs to the brand's world.** Find the brand's own world of instruments, tools and buildings, and draw
   every object in a set from it, so the figures read as one family. A coffee roaster's world is scales, grinders,
   sacks and kettles; a shipping company's is cranes, containers and signal lamps. Do not reuse one brand's set for
   another.

Then check:

- **Can it be drawn from a few rounded solids?** Objects made of rounded boxes, discs, rings and extrusions
  (chests, instruments, steps, rails) draw cleanly. If it only reads with fine detail, choose something simpler. Soft, organic or figurative subjects (animals, people, cloth)
  do not belong in this system.
- **Does it have one simple move?** A lid opens, a key turns, a telescope swings, a camera descends a stair. If the
  only way to animate it is a complex choreography, choose something simpler.
- **A specific object over the stock cliché, and nothing sacred.** For an idea such as saving, growth or payment,
  prefer the object that belongs to this message and this brand (a strongbox, a balance) over the stock picture (a
  piggy bank, a rising arrow, a pile of coins). The stock object is fine when it is the literal subject: the library
  ships `piggy-bank` and `coin-stack` for pages that are about exactly those things. No deity figures, and no icons
  or clip art.

Write it down before you build: "Section X says Y. Object Z, because its parts A, B and C are the items P, Q and R,
and its one move is M."

#### An example set

An invented brand, to show the shape of the thinking: a freight forwarder whose world is the port.

| Section and message | Object | Why it works | Parts and move |
|---|---|---|---|
| Services: everything your cargo needs, in one place | **Shipping container** | One box that holds everything is "in one place" | Three stacked crates inside are the service groups; the doors swing open and the crates slide out one after another |
| The promise: honest weights, no hidden fees | **Platform scale** | A level scale reads at once as fair | Platform and dial; it draws on and the needle settles |
| Fit: who it is for | **Mooring bollard** with one line | One line made fast to one bollard: the right client, the right firm | The line drops over the bollard and pulls taut |
| Journey: the stages of a shipment | **Lock gates**, in section | Rising chamber by chamber is a journey with clear stages and an end | Each chamber is a stage; the camera moves along the section |

Not every section needs an object. When the copy is a statement, let the type carry it.

#### Signs you picked the wrong object

- You need a legend to explain it.
- It only makes sense once labelled.
- It needs colour, shading, texture or fine detail to be recognisable.
- The move you want is a dramatic event (an explosion, a transformation) instead of how the object is really used.

## File: references/motion.md

### Motion rules

Built in three.js 0.160.0 with Line2 / LineSegments2 fat lines, pinned, with an import map (the line addons import
the bare name `three`). No AI image or video generation for the drawing or its motion.

#### Principles

- **Motion means something.** Each move is what the real object does (a needle settles, a lid lifts, a key turns,
  an instrument swings) or what a camera does (push, pull, pan). One idea per move.
- **It lands once.** The illustration builds on entry, makes its move, and holds.
- **Two clocks,** after Hairline:
  - *Tween* for discrete moves: 700 ms on `cubic-bezier(.32,.72,0,1)`. Retarget from where it is, never from the
    start. Stagger related parts by 60 to 200 ms.
  - *Spring* for physical settling: k 100, c 18, integrated per frame. Hairline's m 1 is critically damped
    (overshoot about 0.1°, invisible); use m 2 for a visible overshoot of about 5° on a 60° swing. It overshoots a little and settles,
    which suits needles, balances and swinging parts. Use it only where the real object would overshoot.
- **Camera zoom** interpolates scale logarithmically and the centre linearly.

#### Moves

| Move | How | Timing |
|---|---|---|
| Draw-on | each line's visible segment count grows from 0; order segments left to right on screen; dashed lines fade in instead | each line 700 ms on the tween curve, line starts spread 500 ms first to last, so about 1200 ms in all (the kernel's values) |
| Arrival | start at scale 0.96 and settle while fading up | 700 ms tween |
| Part move (lid lifts, key turns) | after draw-on reaches about 70% | 700 ms tween, parts staggered |
| Settle (needle, beam) | spring from an offset (e.g. −60°) to rest | spring; lands in about 1.2 to 1.6 s |
| Idle | a degree or two of drift over a minute | never noticeable as motion |
| Camera push or pan | lerp the view | 1250 to 1400 ms, cubic in-out |

#### Intro types (the user chooses)

The intro is selectable, not fixed. Ask the user which one they want, or offer two to compare. In code it is one
setting, `INTRO`, which a `?intro=` URL parameter overrides, so they can be compared side by side. Each one ends on
the same finished drawing, then the hero makes its move.

No dead time: drag, zoom and reset work from the first frame, and from the first frame a hover on the hero or a press
cuts the hero's own move short (a hero that has not arrived yet answers as soon as it is on screen). The figure goes
live at once (`onLive` runs then, once), the parts still in flight keep landing (the stack, or the draw-on, plays to its
end, with `K.stacking` true until it does), and its state eases from the intro's pose into the live one over 400 ms, so
`state()` need not match its intro and live branches. Untouched, the intro plays to `liveAt` as before.

| Intro | What happens | Status |
|---|---|---|
| `draw` | each line draws on, left to right across the screen | built (the compass, the starter) |
| `stack` | the object is assembled in ordered layers, and each part arrives along the axis it mounts on: parts on a top face drop from above, parts on a front face slide in from the front (a camera's windows and lens rings, ring after ring, back to front), parts on a side come from that side (a compass's pivot pins). Each layer carries a `from` vector, the outward normal of the face it attaches to, travels about 15 to 25% of the object's size on the 700 ms tween, already drawn, staggered about 120 to 180 ms; about 1.6 to 2 s in all; no bounce on parts, the spring is for the hero only; nothing passes through anything on its way in | built (the compass, the camera, the starter) |

##### Planning the stack for each illustration

The stack is not one generic animation. Work it out for each object from how that kind of object is really put
together, before you write any code, and write the plan down as an assembly table:

| Layer | Parts | Mounts on | `from` |
|---|---|---|---|

1. **Name the object's type** and how such things are assembled. Use real assembly order, not screen order.
2. **Find the base,** the part everything else is fixed to (a body, a foot, a floor, a chassis). It comes first,
   from above or rising from its footprint.
3. **Give every other part its mounting face** on a part that is already there, and its `from` vector, the outward
   normal of that face. A part arrives only after the part it mounts on.
4. **Stack along each axis in order.** Coaxial parts go innermost first (lens mount, then the focus ring, then the
   front ring). Nested parts go outer frame first, then what it holds (a gimbal ring, then the bowl in it).
5. **The hero comes last,** then makes its own move.

Patterns by type:

| Type | Base | Typical order and directions |
|---|---|---|
| Camera or front-facing device (camera, radio, phone) | body | body from above → top plate from above → front windows and panels from the front → the optics ring by ring along their axis, from the front → top controls from above |
| Instrument on a stand (compass, theodolite, telescope, globe) | foot or tripod | foot → uprights from above → pivots sideways along the pivot axis → the ring or cradle from above → the instrument from above → the hero (needle, telescope) |
| Container (safe, chest, box, drawer unit) | carcass | carcass → trays or drawers sliding in from the front → hinges from the side → lid from above → lock or key from the front |
| Building or stepped structure (stepwell, tower, stair) | ground slab | courses bottom to top, each from above; openings and doors from the front |
| Mechanism (balance, clock, gear train, lever) | frame | frame → axles along their own axis → parts threaded onto the axles from the axle's end → the beam, hands or pointer last |
| Vehicle or wheeled thing | chassis | chassis → wheels sideways along the axle → body from above → fittings from their faces |

If an object fits none of these, reason it out from steps 1 to 5. If the plan has a part arriving through
another part, or before what it mounts on, the plan is wrong. Fix the plan, not the timing.

More ideas to try later, each still one plain move:

- `extrude`: every footprint is drawn flat on the ground first, then all the solids rise to their heights together.
- `assemble`: the parts start pulled apart along their own axes (an exploded view) and slide together.
- `blueprint`: dashed construction lines and axes appear first, then the solids form on them, then the guides fade.
- `sweep`: a plane passes across the object and leaves the finished drawing behind it.

Before adding one, check it fits the object (stack suits things built in layers, like a stepwell or a chest of
trays; assemble suits mechanisms) and it doesn't compete with the hero's move.

#### Hand-overs (when several illustrations share a page or deck)

- Default: the outgoing drawing fades over about 450 ms while the incoming one arrives.
- Related objects can hand over in one move (a surveyor's theodolite pulls back and slides left while a map grows
  from the point it was sighting).
- Only the outgoing and incoming drawings exist. Hide and stop every other one at once.
- Going backwards, the drawing is simply there in its final state.

#### Scrub (scroll stories)

A host can drive a figure's progress instead of its clock: one object that assembles, then opens, as the page
scrolls. `fig.scrub(t, { open, split })` (or embedded `{type: 'scrub', t, split?, open?}`, or `?intro=scrub` to start
at 0) maps t in [0, 1] onto the stack intro, parts arriving in ASSEMBLY order, for 0 to `split` (default 0.75), and
onto the hero's click, from rest to its `opened` state, for `split` to 1. While scrubbing the figure plays no intro
and no motion of its own and takes no hover; `scrub(null)` hands it back and replays. The figure needs nothing new:
a good ASSEMBLY order and an `opened` state are the whole story.

- One step of text per moment; give each step the t it shows when its text reaches the middle of the screen. The
  last step is t = 1, the opened state.
- The host eases t toward the scroll (a fifth of the gap a frame); with reduced motion it sets t directly. The
  figure's own reduced-motion rule does not apply: the reader is moving it.
- Examples: site/stories/espresso.html and suitcase.html, with site/stories/story.js.

#### Reduced motion

With `prefers-reduced-motion: reduce` or `?reduced=1`: no moves, no draw-on; the final state appears at once (a
250 ms fade at most).

#### Capture hook

`?freeze=MS` stops the clock MS after the start. Under headless Chrome drive frames with `setTimeout` (about every
50 ms) while frozen; virtual time runs timers more reliably than animation frames.

## File: references/styles.md

### Style: line art

Every figure from this skill is drawn in **line art**: white and black only, the grey ramp, `hi` for the hero, no
colour, no glow and no text. It is the kernel's default (`style: 'lineart'`; the old name `line` still works), so a
figure needs no setting for it.

The Brand style (the hero as a solid part in a brand colour, with a soft halo and short engraved labels) and the Dots
style (the drawing as a halftone dot matrix) come with Linejig Pro, a separate skill, `linejig-pro`
(https://linejig.com/pricing). If it is installed, read it for those styles; if not, draw in line art and do not
set `style`, `brand` or `dots` on a figure.

#### Which part is the hero

The hero is **the part the message is about**. Usually that is the control you act on, not the thing that responds,
when the two are different parts. But when the message is about the contents, the contents are the hero: the empty
inbox's letter, not the envelope's flap, even though you open the flap. On the camera the shutter button is the hero
and the lens answers it. Glass, openings and the centre of a part (a lens's glass, a magnifier's glass, a window)
stay the plate colour, so they read as clear. Most objects have one part that is both (a needle, a drawer, a key),
and then it is simply that part. The hero takes `hi`, the brightest tone; everything else steps down the ramp.

#### Floor grid

`grid: true` (or `?grid=1`, `{type: 'grid', value: true}`) lays a square grid on the ground (z 0) under the object,
about 2.2 times its footprint, cells about an eighth of it on a 1-2-5 step. Thin `lo` lines fade to nothing by
distance and before the plate's edges, and the grid turns with the object. It fades in over 400 ms before the intro.
Off by default.

#### Rules

- One hero (or one family), and the hero is where the eye goes: the brightest tone.
- No colour, no glow, no text, no logos, companies, products or people.
- Reduced motion: the final state at once.

## File: references/verify.md

### Verify

#### Capture frozen frames

ES modules from a CDN work from `file://`, but if the page loads other local files, serve it:

```sh
python3 -m http.server 5391 --bind 127.0.0.1 &   # from the folder holding the page
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --window-size=1440,900 --virtual-time-budget=8000 --enable-logging=stderr --v=0 \
  --screenshot=/ABS/PATH/f-0700.png \
  "http://127.0.0.1:5391/index.html?freeze=700" 2>&1 | grep -i "CONSOLE"
kill %1
```

- Capture the start, middle and end of each move (for example `freeze=300`, `900`, `1600`) and the settled state
  (`freeze=4000`), plus `?reduced=1`.
- Capture at desktop width in both palettes (`--force-dark-mode`, or a `?theme=light|dark` hook on the page).
- Capture the click state with `?click=ID@MS` (the hero member's hit id, clicked at MS; it works under `?freeze`).
- Under the kernel, frames are driven by timers while `?freeze` is set and the hand never turns on, so drive hover
  and drag checks in the browser pane, not headless.
- **Blank frozen frames** in headless Chrome: create the renderer with `preserveDrawingBuffer: true` when
  `?freeze` is set, and render once more in a final `requestAnimationFrame`. The kernel does both. A frame PNG of
  only a few KB is blank; check before judging it.
- Headless Chrome will not size a window below about 500 px wide. Check phone width (375 × 812) in the browser pane
  with a viewport resize instead.
- Any `Uncaught` line in the console output is a failure. Ignore Chrome's own `cv_display_link` noise.

#### Look for

- Lines all the same width, including at phone size and on high-density screens.
- One `hi` part only, and the tone ramp reading clearly: `hi` > `edge` > `mid` > `lo` (measure on real pixels).
- No part smaller than about 4% of the drawing's width; no stray detail.
- Near parts hiding far ones cleanly, with no lines showing through fills and no z-fighting on edges.
- The object inside the plate at every frame of the move.
- No text anywhere in the illustration.
- No horizontal scroll at 375 px.

## File: scripts/starter.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Linejig starter</title>
<!-- A minimal figure on the Linejig kernel: a plinth, a block and a lid (the hero). Hover the lid and it lifts a
     little; click it and it opens, holds, and closes, posting the 'compose' action as it reaches open.
     Copy this into site/<id>/index.html and replace the model, the ASSEMBLY table and HERO. The kernel
     (linejig.js; its header documents the whole API) does the camera, fit, palette and styles, the
     tween and spring, both intros, orbit, zoom, hit testing, reduced motion, ?freeze capture, the embed contract,
     the action event and ?mode=turntable.
     Paths: it imports the published kernel from https://linejig.com/kernel/ (keep the import map: the
     kernel imports 'three' and 'three/addons/'). Inside the Linejig source repo, a figure in site/<id>/ may import
     ../kernel/linejig.js instead. Brand and Dots (Linejig Pro) load from linejig-pro.js by themselves. -->
<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js",
               "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/" } }
</script>
<link rel="stylesheet" href="https://linejig.com/kernel/linejig.css">
</head>
<body>
<main><div id="plate" role="img" aria-label="A placeholder figure: a block whose lid lifts"></div></main>
<script type="module">
import { createFigure } from 'https://linejig.com/kernel/linejig.js';

// ASSEMBLY: the stack intro's plan, one row per layer, in arrival order (motion.md, "Planning the stack"). Name the
// type, find the base, give every part the face it mounts on and that face's normal as from; the hero comes last and
// its row says hero: true. Placeholder type: a stepped structure on a plinth, so everything comes from above.
const UP = [0, 0, 1];
const ASSEMBLY = [
  { name: 'plinth', parts: 'the plinth',         mountsOn: null,     from: UP },
  { name: 'block',  parts: 'the block',          mountsOn: 'plinth', from: UP },
  { name: 'lid',    parts: 'the lid (the hero)', mountsOn: 'block',  from: UP, hero: true },
];
const LIFT = 14, HOVER = 0.2, OPEN = 1, HOLD = 600;      // lid travel in world units; its rest, hover and open levels

let lid, openAt = -Infinity;
createFigure({
  id: 'starter', ASSEMBLY, stack: { travel: 22 },        // travel: about 18% of the plinth's width
  center: [0, 0, 15], release: 1200, liveAt: 2600,
  fit: { width: 0.7, points: () => [[-60, -45, -10], [60, 45, -10], [60, -45, 0], [-60, 45, 0], [0, 0, 36 + LIFT]] },   // the most extreme pose
  model(K) {                                             // far parts first; K.layer files what follows under an ASSEMBLY row
    K.layer('plinth'); K.solid(K.FZ, K.box(-60, -45, 60, 45, 12, 2.2), -10, 0);
    K.layer('block');  K.solid(K.FZ, K.box(-36, -26, 36, 26, 8), 0, 30);
    K.layer('lid', { bucket: 'lid' });                   // its own bucket, so it moves by offset with no rebuild
    K.hit('lid', K.solid(K.FZ, K.box(-38, -28, 38, 28, 9), 30, 36, 'hi'));   // the one hi part; its silhouette is the hit area
  },
  state(K) {                                             // the pose this frame; step springs here
    lid = lid || K.spring(0);
    if (K.live) { if (K.t - openAt > HOLD && lid.t === OPEN) lid.t = 0; K.step(lid, K.dt); }
    return { lift: K.live ? lid.x : K.REDUCED ? 0 : K.springAt(0.6, 0, K.ht - 1200) };    // intro: it drops shut
  },
  key: () => '',                                         // nothing in the model changes, so it never rebuilds for the pose
  place: (K, bucket, st) => ({ off: [0, 0, LIFT * st.lift] }),
  onReplay() { lid.x = lid.t = lid.v = 0; openAt = -Infinity; },
  HERO: {
    action: 'compose', opened: (st) => st.lift > 0.9 * OPEN,   // hands off to the host page as the lid reaches open
    onHover() { if (lid.t !== OPEN) lid.t = HOVER; }, onLeave() { if (lid.t !== OPEN) lid.t = 0; },
    onClick(id, p, K) { lid.t = OPEN; openAt = K.t; },
  },
});
</script>
</body>
</html>
```
