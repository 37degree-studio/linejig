# Linejig

Draws interactive 3D line illustrations in three.js. One object is built from a few rounded solids and drawn in an isometric view (2:1 axonometric) with one fine line width, in line art (white and black, hierarchy by tone) or in the Brand, Dots, Readout and Pencil styles, so all figures keep a consistent illustration style. It builds in (stack or draw-on), then its one hero part (a needle, a lid, the keys of a keyboard) answers hover and click, and the user can drag to turn and zoom it. No captions, leader labels, logos or generated images. Use it whenever someone asks for an interactive 3D illustration, a line-art, isometric, halftone, pencil-sketch or brand-colour object illustration, an animated three.js line drawing, a draw-on or assembly animation, an illustration for an empty state, 404 page, onboarding step, slide or hero, or to add, change, restyle or embed a figure from the Linejig gallery, even if they only say "add a drawing here".

## Install

| Where | How |
|---|---|
| Any coding agent, by the npm installer | `npx linejig install` (detects Claude Code, Codex, Cursor, Gemini CLI, Copilot, Windsurf and more) |
| Any coding agent, by the skills CLI | `npx skills add 37degree-studio/linejig` |
| Claude Code plugin | `/plugin marketplace add 37degree-studio/linejig`, then `/plugin install linejig@linejig` |
| Chat tools with no skills (ChatGPT, Grok and others) | attach `dist/linejig.md` to a project, or paste `dist/linejig.compact.md` into its instructions |

## Engine

`engine/` is the kernel every figure imports, the same files served at https://linejig.com/kernel/: `linejig.js` (its header
comment is the API), `linejig.css` and `stage.js` (many figures on one page, one WebGL context). It draws line art.
Every other style is one file beside it, which the engine imports by itself the first time a figure asks for that style:
`linejig-pro.js` (Brand and Dots), `styles/readout.js` (Readout) and `styles/pencil.js` (Pencil). `addons/shadow.js`
adds cast shadows in any style. Figures load the engine from the site by URL; to serve it yourself, copy the whole
folder and keep its layout.

## Licence

The skill, the engine and every style in this repo are MIT (`LICENSE`). The finished figures in the library at
https://linejig.com/library are not in this repo: the free ones embed from the site, and the Pro ones come with Linejig Pro
(https://linejig.com/pricing).

The line rules build on Hairline by Lucas Marques (MIT): https://hairline.lucasmarkes.com
