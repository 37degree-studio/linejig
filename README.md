# Linejig

Draws interactive 3D line illustrations in three.js. One object is built from a few rounded solids and drawn as 3D line illustrations in an isometric view (2:1 axonometric) with one fine line width, white and black and hierarchy by tone, so all figures keep a consistent illustration style. It builds in (stack or draw-on), then its one hero part (a needle, a lid, the keys of a keyboard) answers hover and click, and the user can drag to turn and zoom it. Illustration only, with no captions, leader labels, logos or generated images. Use it whenever someone asks for an interactive 3D illustration, a line-art, line-drawn, technical-drawing or isometric object illustration, an animated three.js line drawing, a draw-on or assembly animation, an illustration for an empty state, 404 page, onboarding step, slide or hero, or to add, change or embed a figure from the Linejig gallery, even if they only say "add a drawing here".

## Install

| Where | How |
|---|---|
| Any coding agent, by the npm installer | `npx linejig install` (detects Claude Code, Codex, Cursor, Gemini CLI, Copilot, Windsurf and more) |
| Any coding agent, by the skills CLI | `npx skills add 37degree-studio/linejig` |
| Claude Code plugin | `/plugin marketplace add 37degree-studio/linejig`, then `/plugin install linejig@linejig` |
| Chat tools with no skills (ChatGPT, Grok and others) | attach `dist/linejig.md` to a project, or paste `dist/linejig.compact.md` into its instructions |

## Engine

`engine/` is the free kernel every figure imports, the same files served at https://linejig.com/kernel/: `linejig.js` (its header
comment is the API), `linejig.css` and `stage.js` (many figures on one page, one WebGL context). It draws the
line-art style. Figures load it from the site by URL; copy it into your project to serve it yourself.

The Brand and Dots styles are Linejig Pro (https://linejig.com/pricing): they live in `linejig-pro.js` on the site, not in this
repo, under the Linejig Pro licence. The engine imports that file by itself, from beside `linejig.js`, only when a
figure asks for brand or dots; a copy served without it stays in line art.

The skill and the engine are MIT. The line rules build on Hairline by Lucas Marques (MIT): https://hairline.lucasmarkes.com
