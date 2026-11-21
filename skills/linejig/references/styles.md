# Style: line art

Every figure from this skill is drawn in **line art**: white and black only, the grey ramp, `hi` for the hero, no
colour, no glow and no text. It is the kernel's default (`style: 'lineart'`; the old name `line` still works), so a
figure needs no setting for it.

The Brand style (the hero as a solid part in a brand colour, with a soft halo and short engraved labels) and the Dots
style (the drawing as a halftone dot matrix) come with Linejig Pro, a separate skill, `linejig-pro`
(https://linejig.com/pricing). If it is installed, read it for those styles; if not, draw in line art and do not
set `style`, `brand` or `dots` on a figure.

## Which part is the hero

The hero is **the part the message is about**. Usually that is the control you act on, not the thing that responds,
when the two are different parts. But when the message is about the contents, the contents are the hero: the empty
inbox's letter, not the envelope's flap, even though you open the flap. On the camera the shutter button is the hero
and the lens answers it. Glass, openings and the centre of a part (a lens's glass, a magnifier's glass, a window)
stay the plate colour, so they read as clear. Most objects have one part that is both (a needle, a drawer, a key),
and then it is simply that part. The hero takes `hi`, the brightest tone; everything else steps down the ramp.

## Floor grid

`grid: true` (or `?grid=1`, `{type: 'grid', value: true}`) lays a square grid on the ground (z 0) under the object,
about 2.2 times its footprint, cells about an eighth of it on a 1-2-5 step. Thin `lo` lines fade to nothing by
distance and before the plate's edges, and the grid turns with the object. It fades in over 400 ms before the intro.
Off by default.


## Rules

- One hero (or one family), and the hero is where the eye goes: the brightest tone.
- No colour, no glow, no text, no logos, companies, products or people.
- Reduced motion: the final state at once.
