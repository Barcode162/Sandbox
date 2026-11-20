# Experience spec C: "Prism"
## M-0001 Scroll-driven animation showcase · bake-off proposal C

Author: experience-designer (motion) · 2026-11-20 · Direction: **Prism**, chromatic and bold.
Inputs: `brief.md`, `intel/references.md` (the 12 ranked principles, cited below as **P1–P12**), `intel/technique.md` (budgets), `bureau/playbooks/interactive-web.md`, `bureau/QUALITY_BAR.md`.

---

## 0. The piece in one paragraph

**Title: *Bent Light*. Subtitle: "Six refractions of one white beam."**
The piece follows the structure of Newton's *experimentum crucis*. White light hits a prism and splits. Its colours become places you stand in, then glass bends them, then a turning surface tints them. Finally they recombine into the white you started with. The ground is the artwork: for most of the scroll the whole viewport is a saturated, hard-edged colour field rather than a dark page with coloured things on it. This sets Prism apart from Nocturne (dark, luminous objects in a void) and from Paper & Ink (pale paper, type first). The look is a light installation in a white-walled gallery: geometric, saturated and exact, with no glow soup, no particles for their own sake and no noise.

## 1. North star

**Stop the scroll at any point and the screen is a hard-edged colour painting that tells you where the white light is in its journey. Every colour in that painting adds back up to white by the end.**

## 2. Reference points (craft only, never content)

| Reference | The specific craft we take |
|---|---|
| Isaac Newton, *Opticks* (1704), the *experimentum crucis* and recombination with a second prism | **Structure.** Split, isolate, recombine. Our six scenes follow that three-act shape, so the piece is an argument, not a reel. |
| James Turrell, *Ganzfeld* rooms | **Holds.** A field large enough to lose its edges reads as space, not paint. Scene 2 gives single colours long plateaus (40% of each step) before the next one arrives. |
| Ellsworth Kelly, *Spectrum* panel paintings (1953 onward) | **Composition.** Equal-height bands in spectral order, hard edges, no gradients inside a band. Every Scene 2 and Scene 5 stop must read as a hard-edge panel painting. |
| Olafur Eliasson's dichroic-glass works | **Angle-dependent colour.** The hue of a surface is a function of light angle against facet normal. Scene 4 is a literal implementation of this. |
| Josef Albers, *Interaction of Color* | **Adjacency discipline.** Equal-luminance neighbours make edges vibrate. Adjacent spectrum tokens differ by ≥ 0.05 relative luminance (Y), except where vibration is wanted. Hue walks are monotonic. |
| Print registration (CMY plates out of register) | **Type as image.** The title is three subtractive plates (cyan, magenta, yellow) that multiply to black when in register and split into colour fringes as you scroll. |

Originality guard: no frame may reproduce the familiar album-cover composition of a triangle on black with an angled beam in and a rainbow out. Our prism always sits on a pale wall with a horizontal beam, and it never appears on a dark ground (see Anti-goals).

## 3. The arc and tempo

| # | Scene (anchor id) | Track | Tempo | Ground | Technique | Hands off to next |
|---|---|---|---|---|---|---|
| 1 | **Incidence** (`#incidence`) | 220 svh | calm → rising | gallery wall `--wall` | inline SVG: prism, beam, 7 wedge polygons whose vertices are lerped; CMY title (3 HTML copies) | **7 full-bleed spectrum bands** |
| 2 | **Field** (`#field`) | 360 svh | slow, the long rest | the bands themselves | 7 DOM divs with `transform: translateX() scaleX()` from a width accordion; group `skewX` | **full cobalt field + white dot grid** |
| 3 | **Refraction** (`#refraction`) | 260 svh | medium, playful | `--cobalt` + dot grid | SVG: dot `<pattern>`, 3 glass shapes as `clipPath`s, 3 channel copies of the dots per shape (`mix-blend-mode: screen`), per-channel magnification | **three glass shapes on a "shelf" over the dots** |
| 4 | **Dichroic** (`#dichroic`) | 320 svh | dense, the peak | cobalt → mosaic | Canvas 2D: a triangular lattice built from the dots, seeded jitter, per-facet normal, a sweeping light angle mapped to hue | **7 full-bleed spectrum bands again** (the chorus) |
| 5 | **Agreement** (`#agreement`) | 220 svh | tension → click | bands → `--ink` room | 7 DOM divs (`scaleX`, `translateX`), `mix-blend-mode: screen` on ink, one white overlay div | **one white beam on ink** |
| 6 | **Return** (`#return`) | 180 svh | release → rest | ink → `--wall` | the same SVG module as Scene 1, run as "redraw": prism stroke-draw, beam re-entry | ends on a rhyme of the opening; normal-flow **colophon** follows (70 svh) |

Total scroll: 1,560 svh of tracks plus 70 svh of colophon, about 16 viewports. That is about 2–3 minutes at a reading pace, or 20 s if the visitor flings through.
The spectrum appears as **seven full-bleed bands three times**: born (end of 1), crystallised (end of 4), and reunited (5 → 6). This chorus is what makes six scenes one piece (P4).

### Stage model (a requirement on what is visible; architect chooses the means)
- **What the visitor sees:** the stage never visibly scrolls, unsticks or seams between scenes 1–6. Each boundary is an **identity seam**: the rendered frame of scene N at p = 1 equals scene N+1 at p = 0, so switching the active layer at the boundary is invisible.
  - **Test:** a screenshot diff of `frame(N, 1)` vs `frame(N+1, 0)` shows ≤ 0.5% of pixels differing by more than 8/255 per channel, at 1440×900 and 375×812.
- **Recommended structure:** one `position: sticky; top: 0; height: 100svh` stage holding six scene layers, followed by a `margin-top: -100svh` column of six `<section>` tracks (real anchors, P6/P10). Only the active layer is visible; the others get `visibility: hidden` and skip `apply()`. Every wrapper uses `overflow: clip`, never `hidden` (references top risk 1).
- **One geometry, rotated frame.** All scenes compute in an abstract frame: *u* runs along the viewport's long axis and *v* across it. Landscape maps u→x; portrait maps u→y. So in portrait the bands are horizontal rows stacked top to bottom, the beam enters from the top, and glass travels bottom → top. The rule is "the spectrum always lies along the long axis". One set of scene maths serves every viewport (§11).

---

## 4. The scenes, frame by frame

Notation: p is the scene's local progress (0–1). Coordinates are for the **1440×900 reference** (landscape); portrait follows the axis-swap rule. `vmin` = min(vw, svh). Remap helper: `r(p,a,b)` = clamp((p−a)/(b−a), 0, 1). Eases: `smooth` = smoothstep, `glide` = easeInOutCubic, `settle` = easeOutCubic, `back` = easeOutBack(s = 1.35). These are **position curves, not time**. Nothing in `state(p)` uses a clock or smoothing (references top risk 3).

### Scene 1 · Incidence (220 svh)
*"White light is every colour, waiting for an angle."*

Elements:
- **Wall.** `--wall` with a static radial "gallery spot": centre at the prism, `--wall` at 0%, `--wall-deep` at 120 vmin.
- **Prism.** An equilateral triangle, side 34 vmin, centroid at (36vw, 52svh). Its fill is a vertical glass gradient (`--glass-hi` to `--glass-lo`), with a 1.5 px `--glass-edge` stroke and a 1 px `--fringe-c` inner line on the left face and a `--fringe-m` line on the right face.
- **Beam.** A 2 px `--beam` hairline from the left edge at y = 54svh to the left face, with a 1 px `--wall-deep` line 1 px below it so white reads on white. The beam is visible as an edge, not a glow.
- **Spectrum wedges.** Seven polygons. Each wedge has 2 vertices on the right face and 2 far vertices on the wall at x = 100vw. Fill is the spectrum token at 92% with a linear lift toward the far end.
- **Title.** "Bent Light" as an `<h1>` plus 3 `aria-hidden` plate copies (C/M/Y, `mix-blend-mode: multiply`), bottom-left. Subtitle sits below it. A scroll cue sits bottom centre.

Parameters as functions of p:
- Prism rotation: `rot = 22°·settle(r(p,0,0.6))`.
- Fan spread: `spread = 6° + 54°·glide(r(p,0,0.55))`.
- Plate offset: `split = 14px·settle(r(p,0,0.3))`. Cyan moves up-left, magenta right, yellow down.
- Title opacity: `1 − r(p,0.22,0.40)`. Cue opacity: `1 − r(p,0,0.06)`.
- Straightening: `s = glide(r(p,0.55,1))` lerps each wedge's 4 vertices toward column i's rectangle (x from i/7 to (i+1)/7, full height).
- Prism opacity: `1 − r(p,0.70,0.88)`, with a translate of −18vw over the same range.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | Warm white wall, softly spotlit. The glass prism sits left of centre, with a hairline beam reaching it from the left edge. On the right, a small exact spectrum card about 12svh tall lands on the wall, its seven bands crisp. Bottom-left: **Bent Light** in solid black (the plates are in register), with the subtitle under it. The cue is at the bottom centre. | It is a gallery wall with one object and its effect. Thirds: prism on the left third, spectrum on the right edge, title anchoring the bottom-left. It is finished art with nothing waiting to animate (P12). |
| **0.25** | The prism has turned 11°. The fan has opened to 30° and covers the right half of the wall in a widening wedge of colour. The title is out of register: cyan, magenta and yellow ghosts are visibly offset by 13px with black only where all three overlap, at 30% opacity. | It is a diagonal composition from the prism (left-centre) to the right edge, and the misregistered title is a deliberate print artefact, not a glitch. |
| **0.5** | The prism is at about 20°. The fan spans the wall from the top-right corner to the bottom-right corner, so about 55% of the viewport is pure spectrum. The title has gone. | A strong single gesture: a fan of seven hard-edged rays from one source. The wall only remains top-left and bottom-left, as two calm triangles. |
| **0.75** | The rays are straightening: the wedges are now trapezoids converging on a vanishing point off the left edge, like a perspective floor of colour. The prism is half-faded and sliding left. The wall survives only as a thin sliver at the left. | It reads as a colour corridor in one-point perspective. The vanishing point implies the prism's position even as it leaves. |
| **1** | Seven equal vertical bands, full bleed: vermilion, tangerine, saffron, jade, azure, cobalt, violet. No wall, no prism. | It is a Kelly-style spectrum panel. **Identity seam** with Scene 2 at p = 0. |

### Scene 2 · Field (360 svh)
*"Stand inside a colour long enough and it becomes the room."*

Elements: the seven band divs, each with `--band-i` as background and no gradients. A dot-grid layer (one SVG `<rect>` with a `<pattern>`, white dots r = 2.5px, pitch 32px at the 1440 reference (per-viewport pitch in §11), centred on the viewport) appears at the end.

Parameters as functions of p:
- **Dominance cursor** with plateaus: `c(p)` walks 0 → 5 (vermilion → cobalt) in 5 steps over p ∈ [0.06, 0.88]. Each step holds for its first 40% and then moves with `smooth` over the remaining 60%.
- **Width weights:** `w_i = 1 + 11·A(p)·exp(−((i − c)/0.6)²)` with `A = smooth(r(p,0,0.12))`. Then multiply every band except cobalt by `1 − smooth(r(p,0.86,0.97))`, and normalise the widths to 100% of the long axis.
- **Shear:** the band group gets `skewX(−18°·smooth(r(p,0,0.15)) · (1 − smooth(r(p,0.80,0.95))))` and is overscanned to 140% so no edge ever shows ground.
- **Dots:** opacity `0.55·r(p,0.90,1)`.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | Seven equal vertical bands, identical to Scene 1 at p = 1. | Identity seam; a Kelly panel. |
| **0.25** | All bands are sheared −18°. Tangerine dominates at about 62% of the width, with vermilion as a narrow slanted stripe on its left and saffron, jade, azure, cobalt and violet as thin slanted stripes stacked on its right. | A hard-edge diagonal painting: one dominant field plus a rhythm of thin stripes. Every plateau frame is a still life of one colour. |
| **0.5** | Mid-step between saffron and jade. The two share about 75% of the width, split by one clean diagonal edge. The thin stripes are pushed to both margins. | The canvas is cut in two by one diagonal: the most classic hard-edge composition there is. |
| **0.75** | Azure plateau. The viewport is almost entirely azure; cobalt and violet are narrow slanted stripes at the right edge, and the warm colours are a few hairline stripes at the left. | It is a Ganzfeld: one colour as the room, with the rest of the spectrum kept as a margin "memory". |
| **1** | The shear is gone. The whole viewport is cobalt with a quiet white dot grid at 55% opacity. | A minimal grid painting. **Identity seam** with Scene 3 at p = 0. |

Luminance profile (designed, to be measured): mean Y goes 0.30 → 0.37 → 0.52 → 0.33 → 0.14. That is one rise and one fall across 360 svh, never oscillating (§10, photosensitivity).

### Scene 3 · Refraction (260 svh)
*"Glass slows light down, and every colour disagrees about by how much."*

Elements:
- **Ground.** Cobalt plus the dot grid (unchanged).
- **Three glass shapes.** A **triangle** (side 30 vmin), a **circle** (Ø 26 vmin) and a **diamond** (a square rotated 45°, side 21 vmin). Each is a `clipPath` containing three copies of the dot pattern tinted `--ch-r`, `--ch-g` and `--ch-b`, blended with `screen` and scaled about the shape centre at **1.30 / 1.35 / 1.40**. This is true lateral chromatic aberration: dots near the centre stay white, and dots near the rim fan out into RGB triplets.
- **Glass body.** A `--glass-hi` → `--glass-lo` gradient, a 1.5 px `--glass-edge` stroke, and a 1 px `--fringe-c` highlight along the upper-left edge.
- **Overlap.** Where the triangle and circle overlap (p 0.35–0.65), a nested clip applies a ×1.35 magnification again, giving double refraction.

Parameters as functions of p (u is the long axis; landscape travel is right → left, monotonic, never reversing):
- Triangle: `u = 64% → 25%` with `glide(r(p,0,0.85))`, then `back` settle over p 0.85–1.
- Circle: `u = 112% → 50%` over p 0.15–0.9 (`glide`), then `back`.
- Diamond: `u = 130% → 75%` over p 0.45–0.95 (`glide`), then `back`.
- The `back` overshoot is capped at 1.5vw.
- All shapes sit at v = 50%. Each shape rotates at most 8° over its whole travel (P11).

| p | Frame | Why it is composed |
|---|---|---|
| **0** | Cobalt and dots; the triangle's left tip has just entered at the right edge (only about 6% of it shows, 64% of the shape's travel remaining). | A grid painting with one sharp intrusion pointing inward, which creates tension and direction. |
| **0.25** | The triangle is just right of centre. Through it the dots are magnified, with rims fringing red, green and blue. The circle's left edge is entering at the right. | One object centred on its own magnified world; the arriving circle answers it. |
| **0.5** | The circle overlaps the triangle's right half. The lens-shaped overlap is doubly magnified: dots are large, and RGB triplets are spread wide like small spectra. | The peak of the scene. Two simple solids make a third shape, and the eye goes straight to the overlap. |
| **0.75** | The triangle sits on the left third and the circle centre-left, now separated. The diamond is entering at the right. | Three-beat rhythm, two objects placed and one arriving: a gallery-hang composition. |
| **1** | The "shelf": triangle, circle and diamond evenly spaced at 25%, 50% and 75%, each a clean window of refracted dots. | Symmetrical and still, like three glass objects on a plinth. **Identity seam** with Scene 4 at p = 0. |

### Scene 4 · Dichroic (320 svh) · the peak
*"Turn the surface, and the colour turns with it."*

Technique: one full-stage `<canvas>` (DPR capped at 2). Lattice pitch = 2 × dot pitch: 48px (≤ 768), 56px (1024), 64px (1440), 72px (1920). That is about 700–950 facets, drawn as filled triangles (not DOM nodes).
- **Vertices** are every other dot of the Scene 3 grid, plus seeded jitter (mulberry32, seed `0xB3E7`) of `±14px·J(p)` with `J = glide(r(p,0.08,0.35))·(1 − glide(r(p,0.80,0.96)))`.
- **Normals:** each facet has a seeded normal tilt `n` with |n| ≤ 0.6, scaled by J.
- **Light angle:** θ(p) = 200° → 340° over p 0.1–0.9 (`glide`).
- **Facet colour:** in OKLCH, `h = 255° + 150°·(n·L)`, `L = 0.50 + 0.28·(n·L)` (clamped 0.32–0.82), `C = 0.17`. Facets only change hue with light angle: no facet's hue passes through more than 180° across the whole scene.
- **Edges:** 1 px white at α `0.45·r(p,0.04,0.12)·(1 − r(p,0.80,0.92))`.
- **Quantisation:** over p 0.80–0.96 each facet's colour lerps to the band token its centroid falls in. Over p 0.92–1 the canvas cross-fades (inside the canvas, globalAlpha) to seven exact straight bands.
- **Glass shapes from Scene 3** are drawn on the same layer at the start and fade with `1 − r(p,0,0.15)`. Dots that are not vertices fade with `1 − r(p,0,0.10)`.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | The shelf of glass shapes over the dots, identical to Scene 3 at p = 1. | Identity seam. |
| **0.25** | The shapes have gone. The dots are joined into a faintly jittered triangular lattice; facets are about 60% filled in cool blues and teals, brightest upper-left, where the light is. | A crystal surface catching low light from one corner: one diagonal value gradient, so it is easy to read. |
| **0.5** | Full mosaic. The light is overhead and the dichroic range is wide: magenta, gold and teal facets, with a bright ridge running diagonally across the frame and cobalt showing in the shadowed facets. | The peak: stained glass under a moving sun. Dense, but structured by the single ridge and the lattice. |
| **0.75** | The light has moved right. The right half glows gold and vermilion, the left half falls to violet and cobalt, and the lattice jitter starts to relax. | Warm–cool split on the vertical axis, the strongest colour contrast in the piece, and still one gesture. |
| **1** | The lattice has gone flat and silent: seven exact full-bleed spectrum bands. | The chorus returns: the crystal "remembers" its spectrum. **Identity seam** with Scene 5 at p = 0. |

### Scene 5 · Agreement (220 svh) · the climax
*"Put every colour back together and they agree on white."*

Elements:
- **Ink room** behind the bands.
- **Seven band divs** with `mix-blend-mode: screen`. Width `W(p)`: full band (1/7 of the long axis) narrowing to `--beam-w` = max(9vw, 32px) via `scaleX` over p 0–0.3 (`glide`), centred on each band's own centre. Then each band translates to the axis centre over p 0.3–1 (`back`, so the beams pass the centre by 0.35 beam-widths at about p 0.9 and settle exactly at p = 1).
- **White overlay div** (`--beam`) at the centre, opacity `r(p,0.93,1)`, so the final white is exact (the computed 7-way screen sum is #FFFEFF).
- Every beam carries a 1 px `--ink` hairline on its left edge only during p 0.3–0.6, which keeps adjacent beams legible as they first touch.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | Seven full-bleed bands. | Identity seam. |
| **0.25** | Seven narrow coloured beams standing in a dark room, evenly spaced, with ink between them. | A colonnade of light: the most "light installation" frame in the piece, with even rhythm and maximum saturation against black. |
| **0.5** | The beams have drawn inward to about 45vw total. Neighbours overlap, and the overlaps screen into new colours: tangerine + saffron make pale gold, jade + azure make bright aqua. | A chord: overlapping translucent columns, symmetrical about the centre, getting lighter where they meet. |
| **0.75** | About 18vw wide in total. The centre is almost white, with coloured fringes on both edges, warm on the left and cool on the right. | A white beam with chromatic aberration: the opening's split, run backwards. |
| **1** | One exact white beam, 9vw wide, on ink. No fringes. | The colours have "agreed". The minimum possible composition. **Identity seam** with Scene 6 at p = 0. |

### Scene 6 · Return (180 svh) · release
*"Where you came in. The beam is still white."*

Elements:
- **The white beam** widens to the full long axis over p 0–0.5 (`glide`). Its colour lerps `--beam` → `--wall`, and the gallery spot fades in over p 0.45–0.6.
- **The Scene 1 SVG module, in "redraw" mode.** The prism outline draws by `stroke-dashoffset` over p 0.55–0.8. The glass fill fades in over p 0.75–0.9. The beam hairline extends from the left edge to the prism over p 0.7–0.85. The spectrum card unfolds to Scene 1's p = 0 size over p 0.85–1.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | A white beam on ink. | Identity seam. |
| **0.25** | A white doorway about 46vw wide, with ink margins on either side. | A door of light, symmetrical: Turrell's aperture. |
| **0.5** | The whole viewport is a warm white wall with a faint spotlight, completely empty. | A deliberate rest: the only empty frame in the piece, earned after the peak (P3). |
| **0.75** | The prism is being drawn in fine line, about 70% of its outline complete, and the hairline beam is arriving from the left. | A technical drawing on a wall: line before glass. |
| **1** | Scene 1's opening composition (wall, prism, beam, small spectrum card), but without the title. | A rhyme: the piece ends where it began. Then the colophon scrolls up in normal flow over the same `--wall` colour. |

**Colophon** (normal flow, `--wall` ground, 70 svh, not pinned): the only content that scrolls like a page. That tells the visitor the piece is over.

---

## 5. Transitions between scenes

There are no cross-fades, wipes or cuts between scenes. **All five seams are identity seams** (§3), and every transition happens inside the scenes' own maths:

| Seam | Hand-off element | How it becomes the next scene |
|---|---|---|
| 1 → 2 | the 7 bands | wedges straighten into columns (end of 1); columns become an accordion (2) |
| 2 → 3 | cobalt field + dot grid | dots condense on the last field (end of 2); glass enters over them (3) |
| 3 → 4 | the dots | the glass fades and the dots become lattice vertices (start of 4) |
| 4 → 5 | the 7 bands (chorus) | the mosaic quantises to bands (end of 4); the bands narrow into beams (5) |
| 5 → 6 | the white beam | the beam widens into the wall (6) |

There is no stretch of scroll where nothing changes: every scene's parameters are non-constant on every 5% of its track, except the designed rest at Scene 6 p 0.5 ± 0.03 (P3).

---

## 6. The first 5 seconds

| t | What happens |
|---|---|
| 0 ms (first paint) | The **Scene 1 p = 0 frame comes from HTML + CSS alone.** The inline SVG ships with `state(0)` attributes baked in, and the tokens are in CSS, so nothing depends on JS for the first frame. The chrome is already in place. No loader, no intro, no fade-up (P12). CLS 0. |
| 0–1.2 s, no input | Stillness. The idle timer is **not armed** until the first scroll (A4), so there is no admire mode on arrival. The cue reads **"Scroll to bend the light"**. |
| First wheel tick (~100px ≈ p 0.05) | Within one frame: the prism turns 2.4°. The fan opens from 6° to 9.5°, so its far edge grows from 12svh to about 19svh tall (≥ 60px of visible change at 1440×900). The title plates slip 3px out of register and colour fringes appear on "Bent Light". The cue drops to 15%. **This is the hook.** |
| 1–3 s of scrolling (to p ≈ 0.25) | The fan sweeps across the right half of the wall and the title separates into three coloured ghosts. |
| 3–5 s (to p ≈ 0.4) | The title has gone and the fan dominates. If the visitor stops, admire mode arrives 1.2 s later and the spectrum shimmers ±1.5°. |

On a phone (first touch-scroll of ~150px), the beam comes from the top and the fan opens downward. The response is the same, rotated.

---

## 7. Admire mode (the stillness reward)

**Enter.** Admire mode is armed after the first scroll. It enters **1,200 ms** after the last input from this list: `scroll`, `wheel`, `keydown`, `pointerdown`, `touchstart`, `touchmove`, and `pointermove` with ≥ 4px cumulative travel (so sensor jitter cannot keep it awake). `scrollend` is a hint only (technique §6).

It is **blocked** while:
- focus is inside the chrome;
- the pointer hovers over the chrome;
- a rewind is running;
- the document is hidden.

**On enter** (all timings from the moment the idle timer fires):
1. The chrome (wordmark, scene label, rail and caption) fades to opacity 0 over **600 ms**, `--ease-standard`, then gets `pointer-events: none`. The **pause control stays**, dimmed to 0.55 opacity (WCAG 2.2.2).
2. **Breathing starts.** The ambient amplitude `a(t)` ramps 0 → 1 over **1,600 ms** (easeInOutSine), so motion never jumps in.
3. The live region (`role="status"`, polite) announces **"Admire mode. Controls hidden; the scene is breathing. Scroll, press a key or move the pointer to continue."** If breathing is paused, it announces **"Admire mode. Controls hidden; breathing is paused."**

**Breathing** is a separate layer, `apply(state(p), ambient(t)·a)`. It is never part of `state(p)` and is zero outside admire mode. Tests set it to zero or pause it.
- **Rule:** amplitude is always **below the scene's own motion**, every period is ≥ 7 s, and no breathing component changes frame mean luminance by more than 0.02 Y.

| Scene | Breathing (amplitude at a = 1, period) |
|---|---|
| 1 Incidence | fan spread ±1.5° and prism glint (a 1px highlight along the left face) sliding ±6% of the face length · 8 s |
| 2 Field | dominant band width swells ±2.5% · 10 s; shear ±0.8° · 13 s |
| 3 Refraction | each shape bobs ±6px along v, with phases 0 / 0.33 / 0.66 · 7 s; magnification ±0.01 · 9 s, so rim triplets gently widen and close |
| 4 Dichroic | light angle ±6° · 12 s. **This is the best admire moment:** the crystal slowly shimmers across its facets, with no facet hue moving more than 12° |
| 5 Agreement | beams sway ±4px each, alternating directions · 9 s (at p = 1 the single beam's edges breathe ±1px) |
| 6 Return | as Scene 1 when the prism is present; the empty wall at p 0.5 breathes its spotlight radius ±3% · 11 s |

**Exit.** On any input from the list, everything happens on that same frame:
- the scrubbed state follows the scroll immediately, as it always does;
- the ambient amplitude decays to 0 over **240 ms** (easeOutCubic), which avoids a 6px pop;
- the chrome fades back in over **160 ms** (faster in than out);
- the live region says nothing on exit, to avoid chatter.

**Pause.** The pause control toggles breathing and persists the choice in `localStorage` under `bentlight.breathing`. Every read and write is wrapped in try/catch, and the default is "on". While paused, admire mode still hides the chrome, but nothing moves.

**Reduced motion.** Admire mode still hides the chrome (this is an opacity fade, shortened to 200 ms). Breathing never runs, and the pause control shows its "off" state (§8).

---

## 8. Chrome, with every state

The chrome is gallery labels on a wall. Chrome text always sits on a **chip**, so contrast is guaranteed over any frame:
- `light` chip: `--wall` at 92% opacity, ink text, 1px `--wall-deep` border. Used in Scene 1 and in Scene 6 from p 0.45.
- `dark` chip: `--ink` at 78% opacity, white text. Used everywhere else.
- The chip theme cross-fades over 240 ms when it changes. Both themes pass ≥ 7:1 for text.
- Chip radius 2px. The chrome is square-cornered and geometric.

| Element | Where | States |
|---|---|---|
| **Skip link** "Skip to the colophon" | top-left, off-screen until focused | focus-visible: slides in as a dark chip. Activating it jumps to `#colophon` and moves focus to the colophon's heading. |
| **Wordmark** "Bent Light" (link to `#incidence`) | top-left, 24/32/40px inset by breakpoint | default; hover: an underline draws left → right in 120ms; focus-visible: the dual ring (§9); active: translateY(1px) for 90 ms; admire: hidden |
| **Scene label** "03 · Refraction" | after the wordmark, separated by a 1px vertical rule | It updates at each seam with a 200 ms cross-fade of the numeral and name. The numeral uses tabular figures so the label never shifts. It is not live (no chatter). Admire: hidden. |
| **Spectrum rail** (progress) | ≥ 1024: vertical on the right edge, 28px inset, 44svh tall, centred. < 1024: horizontal across the top below the wordmark row, full width minus the gutters. | The track is a 2px line at 25% of the chip text colour. The fill is a 2px line carrying the 7-stop spectrum gradient, revealed by `scaleY` (or `scaleX`) equal to overall progress, so it is scroll-driven and deterministic. `aria-hidden`: the accessible progress is the scene list. Admire: hidden. |
| **Scene ticks** (6 links in `<nav aria-label="Scenes">`) | on the rail at their scenes' start positions | Each link has a 24×24 hit target (WCAG 2.5.8; 44×44 on coarse pointers) around a 6px diamond outline. **current:** a filled 10px diamond in the scene's key colour plus `aria-current="true"`. **past:** a filled 6px diamond. **future:** outline only. **hover:** the diamond scales to 1.25 in 120 ms and a chip label slides 8px from the rail ("04 Dichroic"). **focus-visible:** the dual ring plus the same label. **active:** scale 0.9 for 90 ms. Activating a tick scrolls natively to that scene's anchor (CSS `scroll-behavior: smooth`, `auto` under reduced motion), landing exactly at p = 0. |
| **Caption** (one line per scene) | bottom-left; the whole bottom row at ≤ 768 | The text is at full opacity whenever its scene is active, with no fade-in on reveal (P7). It changes at a seam with an opacity cross-fade driven by scroll over the last and first 3% of the two tracks: deterministic, and never gating a read. Admire: hidden. |
| **Pause control** (`<button aria-pressed>`) | bottom-right, 40px square (44px on coarse pointers), two-bar pause glyph | **default (breathing on):** glyph ‖, accessible name "Pause breathing". **hover:** a label chip "Pause breathing" appears to its left in 120 ms. **focus-visible:** dual ring plus the label. **active:** scale 0.94 for 90 ms. **paused:** a breath glyph (a small open triangle, the prism) with name "Resume breathing" and `aria-pressed="true"`. **admire:** 0.55 opacity, and 1.0 on hover or focus. **reduced motion:** a dashed outline, `aria-disabled="true"` (still focusable), and the label "Breathing is off because your device asks for reduced motion". The control is always visible outside admire mode, so the mechanism exists before motion starts. |
| **Scroll cue** "Scroll to bend the light" | bottom centre, Scene 1 only | static text plus a 24px hairline arrow; opacity `1 − r(p,0,0.06)`; no time-based bounce |
| **Rewind status** | in the scene-label slot while a rewind runs | "Rewinding · press any key to stop", with the chrome forced visible |

**Loading, empty and error states.**
- **Loading:** none needed. The first frame is static HTML and SVG (§6). The display font is preloaded with `font-display: block`; it is a same-origin file, so expect under 50 ms. The fallback stack is metric-matched with `size-adjust`, so the title box never shifts.
- **JS disabled:** a `<noscript>` banner (dark chip, top) reads **"Bent Light moves when JavaScript is on. Without it, here are the six scenes as stills."** Each track then shows its scene's reduced-motion stills in normal flow.
- **A scene fails to render** (an exception in `apply`, or no canvas context): the engine catches it, never logs a console error, and swaps that layer to its static still. A small chip in the caption slot reads **"This scene couldn't draw on this device, so you're seeing its still."** Everything else keeps working.
- **Unknown hash** (e.g. `#nope`): the page opens at the top, with no error.
- **Empty:** there is no empty state. Every frame has content, including the designed rest at Scene 6 p 0.5, which is the warm white wall with its spotlight.

---

## 9. Keyboard and focus

- **Native scrolling is untouched.** ↑ ↓ PageUp PageDown Space Shift+Space Home End all scrub the piece natively; there is no `preventDefault` on scroll keys (P2).
- **Tab order:** skip link → wordmark → 6 scene ticks (01–06) → pause control → colophon links ("Run it backwards", "Jump to the first beam") at the end of the page.
- **No single-character shortcuts.** WCAG 2.1.4 would demand an off switch, and the piece does not need them.
- **Focus ring** (`--focus`): a 2px `#FFFFFF` inner ring plus a 2px `--ink` outer ring, offset 2px, on every focusable element. It is visible on every ground, from white wall to saffron to ink. Focus is never hidden by admire mode, because admire mode is blocked while focus is in the chrome.
- **Tick activation** moves the scroll; focus stays on the tick, so the visitor can press Tab and Enter repeatedly. The scene label's text updates when the seam is crossed.
- Activating the pause control with Enter or Space toggles breathing and announces "Breathing paused." or "Breathing on."

---

## 10. Accessibility, comfort and photosensitivity

**Photosensitivity** is the real risk of a saturated piece, so it is a designed property, not a hope:
1. **No flashing, ever.** No element changes luminance as a function of time except breathing, which is capped at ≤ 0.02 Y and has periods ≥ 7 s.
2. **Luminance hills, not oscillations.** Within any scene, frame mean luminance (Y) changes direction at most **twice** across its whole track. The designed profile:

   | Scene | Mean Y |
   |---|---|
   | 1 | 0.88 → 0.40 |
   | 2 | 0.30 → 0.52 → 0.14 |
   | 3 | 0.15 → 0.17 |
   | 4 | 0.15 → 0.30 → 0.32 |
   | 5 | 0.32 → 0.10 → 0.12 |
   | 6 | 0.12 → 0.86 |

   So even a fast fling crosses at most about 5 large luminance swings over the whole page, and an 8 s rewind crosses fewer than 3 per second.
3. **Saturated changes are slow.** Every full-field hue change in Scene 2 spans ≥ 60 svh of scroll (about 0.65 viewports per field step). Adjacent field tokens move monotonically around the hue wheel; no field ever alternates with a previous one.
4. **No saturated-red full field.** Vermilion never exceeds about 70% of the viewport and never alternates (WCAG's red-flash concern).
5. **No high-contrast gratings.** Scene 3 uses a **dot** grid at 55% opacity on cobalt, never stripes. There are no regular high-contrast stripe patterns with more than 5 light–dark pairs covering more than 25% of the screen. Scene 2's thin stripes are irregular in width and saturated against saturated, never black against white.
6. **Testable flash audit.** Sample the page at 60 evenly spaced scroll positions and during a scripted rewind at 20 samples per second. Compute mean relative luminance from a 64×40 downscaled screenshot, and assert:
   - no more than 3 opposing ΔY ≥ 0.10 pairs within any 1 s window during the rewind;
   - each scene's profile has at most 2 direction reversals.

**Vestibular** (P11):
- No zoom of the whole stage.
- Large-area rotation is limited to Scene 1's prism (22°, one object) and Scene 2's shear (18°, a skew, not a rotation).
- No parallax layers: Scene 3's shapes move at different times, not at different depths.
- The largest travel of any non-ground element per viewport of scroll is ≤ 0.6 viewport.

**Other guarantees:**
- **Text contrast:** all chrome text ≥ 7:1 on its chip. The colophon is ink on `--wall` at 17.3:1. The title at p = 0 is effectively black on the wall.
- **Semantics:** one `<h1>` (title); `<nav>` for the scenes; each `<section>` is `aria-labelledby` its visually hidden `<h2>` scene name. The caption is real text inside its section. Each art layer is `role="img"` with an `aria-label` describing the scene (§12). The CMY plate copies are `aria-hidden`.
- **Zoom:** 200% zoom with no horizontal scroll; the chrome reflows to the < 1024 layout.
- **Colour independence:** nothing in the chrome is encoded by colour alone. Current, past and future ticks differ by fill and size; current also has `aria-current`.

### Reduced motion: the second cut (P9)
Under `prefers-reduced-motion: reduce`:
- Each scene renders **three authored stills**, `state(0)`, `state(0.5)` and `state(1)`, using the frames tabled in §4. The scene shows the still nearest to p, and **cross-fades by opacity** over p 0.25 ± 0.08 and 0.75 ± 0.08. Implementation: two instances of the scene layer, A and B, each applying a fixed still; Scene 4 does it with canvas globalAlpha. The extra node cost is small (§13).
- The cross-fade between the S2 stills (equal bands → saffron/jade → cobalt) spans 0.16 × 360 svh ≈ 520px of scroll, so it is slow.
- Seams stay identity seams, because p = 0 and p = 1 are among the stills.
- The title appears in register, with no plate split.
- Breathing is off and the pause control is disabled with its explanation.
- Tick navigation and Rewind jump instantly. The rewind control is renamed **"Jump to the first beam"**.
- Admire mode still hides the chrome (200 ms fade).
- The scrolling itself remains the essential motion, and nothing else moves except opacity.

---

## 11. Responsive behaviour

The rule is one geometry in the (u, v) frame (§3). Landscape when `vw/svh ≥ 1`, portrait otherwise. All sizes are in `vmin` or fractions of u and v unless stated.

| Viewport | Orientation and axis | Gutter | Chrome | Scene specifics |
|---|---|---|---|---|
| **375×812** | portrait: beam from the top, bands as horizontal rows, glass travels upward | 16px | wordmark and scene label on one row (label shortened to "03 Refraction"); horizontal rail beneath; caption full-width at the bottom (15px, max 2 lines); pause control 44px at bottom-right, above the caption row | prism side 46vw, centroid (50vw, 30svh); title bottom, 64px; S3 shapes 40vw with the shelf as a vertical column at v = 50% and u = 22/50/78%; S4 pitch 48px (~300 facets); S5 beams are horizontal bars max(9svh, 32px) tall |
| **768×1024** | portrait | 24px | as 375, but the label is in full | prism 40vw; S4 pitch 48px (~430 facets) |
| **1024×768** | landscape | 32px | vertical rail appears on the right | reference layout; S4 pitch 56px (~600 facets) |
| **1440×900** | landscape (**reference**) | 40px | all chrome | as §4; S4 pitch 64px (~700 facets) |
| **1920×1080** | landscape | 48px | all chrome; caption max 44ch | prism side capped at 400px so it stays an object, not a billboard; dot pitch 36px, so the S4 lattice pitch is 72px (~920 facets). The rule at every viewport: lattice pitch = 2 × dot pitch (dot pitch 24 / 24 / 28 / 32 / 36px across the five viewports), so the dots of Scenes 2–3 are exactly the lattice vertices and the 3 → 4 seam stays identical. |

- **Resize and orientation change:** recompute the layout, then re-render `state(p)` at the same document fraction. Admire mode and pause state are kept.
- Stages are `100svh`; track lengths are svh-based and cached on resize. `dvh` is never used (technique §5).
- No horizontal overflow at any width: overscanned elements live inside an `overflow: clip` layer.

---

## 12. Real copy (every string)

| Key | String |
|---|---|
| `<title>` | Bent Light: six refractions of one white beam |
| meta description | A scroll piece about white light: split it, stand in its colours, bend them through glass, and put them back together. |
| h1 | Bent Light |
| subtitle | Six refractions of one white beam. |
| scroll cue | Scroll to bend the light |
| skip link | Skip to the colophon |
| nav label | Scenes |
| scene names | 01 Incidence · 02 Field · 03 Refraction · 04 Dichroic · 05 Agreement · 06 Return |
| caption 1 | White light is every colour, waiting for an angle. |
| caption 2 | Stand inside a colour long enough and it becomes the room. |
| caption 3 | Glass slows light down, and every colour disagrees about by how much. |
| caption 4 | Turn the surface, and the colour turns with it. |
| caption 5 | Put every colour back together and they agree on white. |
| caption 6 | Where you came in. The beam is still white. |
| art label 1 | A glass prism on a white wall splits a thin beam into a fan of seven colours that widens until it fills the wall. |
| art label 2 | Seven bands of colour take turns filling the screen, from vermilion to cobalt. |
| art label 3 | Three glass shapes, a triangle, a circle and a diamond, drift over a grid of dots and magnify it, splitting each dot into red, green and blue at their edges. |
| art label 4 | The dot grid becomes a faceted crystal whose colours shift as an unseen light moves across it, then settles into seven bands. |
| art label 5 | Seven beams of coloured light in a dark room slide together and add up to a single white beam. |
| art label 6 | The white beam widens back into the gallery wall, and the prism is drawn again where the piece began. |
| pause (on) | Pause breathing |
| pause (paused) | Resume breathing |
| pause (reduced motion) | Breathing is off because your device asks for reduced motion |
| status: pause toggled | Breathing paused. / Breathing on. |
| status: admire enter | Admire mode. Controls hidden; the scene is breathing. Scroll, press a key or move the pointer to continue. |
| status: admire enter (paused) | Admire mode. Controls hidden; breathing is paused. |
| rewind status | Rewinding · press any key to stop |
| status: rewind done | Back at the first beam. |
| status: rewind stopped | Rewind stopped. You're in 03 Refraction. *(uses the current scene's name)* |
| colophon h2 | Colophon |
| colophon p1 | Bent Light is a scroll piece in six scenes. Every frame is a pure function of where you are on the page: scroll back and it rewinds exactly, stop anywhere and it waits for you. |
| colophon p2 | Seven colours, one beam, no images. Drawn with HTML, SVG and canvas, and set in Space Grotesk. |
| colophon p3 | If you stop for a moment, the controls step aside and the scene breathes. The button in the corner stops that. |
| colophon link A | Run it backwards *(reduced motion: Jump to the first beam)* |
| colophon link B | Jump to the first beam *(hidden under reduced motion, where link A already does this)* |
| noscript | Bent Light moves when JavaScript is on. Without it, here are the six scenes as stills. |
| scene error chip | This scene couldn't draw on this device, so you're seeing its still. |

**Voice:** precise, physics-literate, slightly wry, present tense, one sentence per caption, no exclamation marks, British spelling ("colour"). Copy never explains the animation; it names what the light is doing.

---

## 13. Tokens

### Colour (computed from OKLCH; hex verified with the script at `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/oklch.py`)

| Token | OKLCH | Hex | Y | Use |
|---|---|---|---|---|
| `--wall` | 0.965 0.008 85 | `#F6F3ED` | 0.90 | gallery wall, colophon ground |
| `--wall-deep` | 0.90 0.012 80 | `#E2DDD5` | 0.73 | spotlight falloff, beam underline, light-chip border |
| `--ink` | 0.17 0.025 272 | `#0C0F1A` | 0.005 | dark room, text, focus outer ring |
| `--beam` | n/a | `#FFFFFF` | 1.0 | white light |
| `--band-1` vermilion | 0.64 0.22 32 | `#F54123` | 0.23 | spectrum |
| `--band-2` tangerine | 0.73 0.174 58 | `#F68704` | 0.37 | spectrum |
| `--band-3` saffron | 0.84 0.17 92 | `#F2C50E` | 0.59 | spectrum |
| `--band-4` jade | 0.74 0.166 160 | `#0BCA86` | 0.44 | spectrum |
| `--band-5` azure | 0.68 0.132 228 | `#04A7D8` | 0.33 | spectrum (L lowered so it does not vibrate against jade) |
| `--band-6` cobalt | 0.50 0.21 264 | `#2154D8` | 0.12 | spectrum; Scene 3 ground |
| `--band-7` violet | 0.55 0.22 300 | `#8843DB` | 0.14 | spectrum |
| `--ch-r` / `--ch-g` / `--ch-b` | n/a | `#FF3B3B` / `#3BFF7A` / `#3B6BFF` | n/a | refraction channels (screen blend) |
| `--plate-c` / `--plate-m` / `--plate-y` | n/a | `#00B8F0` / `#E6007E` / `#FFE600` | n/a | title plates (multiply); each has one zero channel, so in register they multiply to exact black |
| `--glass-hi` / `--glass-lo` | n/a | `rgba(255,255,255,.22)` / `rgba(255,255,255,.05)` | n/a | glass body gradient |
| `--glass-edge` | n/a | `rgba(255,255,255,.85)` | n/a | glass stroke |
| `--fringe-c` / `--fringe-m` | n/a | `#38D6FF` / `#FF4FB3` | n/a | prism and glass edge fringes |
| `--chip-light` / `--chip-dark` | n/a | `rgba(246,243,237,.92)` / `rgba(12,15,26,.78)` | n/a | chrome chips |

Measured screen sum of the seven bands: `#FFFEFF` (the white overlay makes it exact). Contrast on bands: ink on vermilion 5.2:1 and white on cobalt 6.3:1. These are informational only, because chrome text always sits on chips.
There is no light/dark theme switch: the palette is authored per scene, and `prefers-color-scheme` deliberately does not change the art. The chips adapt to the scene.

### Type
| Token | Value |
|---|---|
| `--font` | "Space Grotesk" (self-hosted variable woff2, Latin subset, wght 300–700, ≤ 45 KB; `@fontsource-variable/space-grotesk` 5.3.0, OFL-1.1, confirmed with `npm view`), then `ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `--type-display` | clamp(64px, 12.5vw, 200px) / 0.88 / 700 / −0.035em |
| `--type-subtitle` | clamp(16px, 1.5vw, 22px) / 1.3 / 500 |
| `--type-caption` | 15px/1.45 (≤ 768) · 16px/1.5 (≥ 1024) / 450 |
| `--type-label` | 12px / 1 / 600 / +0.12em, uppercase, `font-variant-numeric: tabular-nums` |
| `--type-colophon` | 18px/1.55 / 400, max 52ch; h2 32px/1.1/600 |

### Spacing and shape
- 4/8 scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Gutters: 16 / 24 / 32 / 40 / 48px across the five viewports.
- Chip padding 6×10px. Chip radius 2px. Hairlines 1px. Rail 2px.

### Motion
| Token | Value |
|---|---|
| `--idle-ms` | 1200 |
| `--dur-chrome-out` / `--dur-chrome-in` | 600 ms / 160 ms (reduced motion: 200 / 160) |
| `--dur-hover` / `--dur-press` / `--dur-label` / `--dur-chip-theme` | 120 / 90 / 200 / 240 ms |
| `--dur-ambient-ramp` / `--dur-ambient-decay` | 1600 ms easeInOutSine / 240 ms easeOutCubic |
| `--dur-rewind` | 8000 ms, easeInOutSine, cancelled by any input from the admire list |
| `--ease-standard` | cubic-bezier(.4, 0, .2, 1) |
| `--ease-out` | cubic-bezier(.16, 1, .3, 1) |
| `--ease-in-out` | cubic-bezier(.65, 0, .35, 1) |
| position curves (JS, unit-tested) | `r`, `smooth`, `glide`, `settle`, `back(1.35)`, all pure on [0,1], with f(0) = 0 and f(1) = 1 |

**Choreography rules:**
- State is a pure function of p, with no time and no smoothing.
- Overshoot exists only as a *position* curve (`back`), never as a spring.
- One gesture per scene dominates; secondary motion is ≤ 1/3 of its amplitude.

### Budgets this design spends (well inside technique §Implications 3)

| Scene | Animated nodes |
|---|---|
| 1 | ~25 SVG/HTML |
| 2 | 8 |
| 3 | ~30 |
| 4 | 1 canvas (≤ 950 triangles per frame) |
| 5 | 9 |
| 6 | ~25 |

- Total DOM is under 250 nodes. Reduced-motion double instances add ≤ 100.
- JS for the engine plus six scenes is estimated at ≤ 30 KB gzipped. The font is ≤ 45 KB.

---

## 14. Feel

- **Scroll to frame:** the frame for scroll position y is visible on the next frame (≤ 16.7 ms), with no scrub smoothing or lag. Wheel, trackpad, keys, scrollbar drag and touch all behave natively.
- **Hover feedback:** within 120 ms. Press feedback: within 90 ms (scale 0.94 or translateY 1px).
- **Tick navigation:** native smooth scroll lands at p = 0 of the target. Its duration is the browser's own; reduced motion makes it instant.
- **Juice (all position-based, so still deterministic):**
  - Scene 3's shapes settle onto the shelf with a 1.5vw `back` overshoot.
  - Scene 5's beams pass the centre by 0.35 beam-widths and settle. At p ≈ 0.9 a sliver of fringe reappears and vanishes, so the final white feels like it *clicks* into agreement.
  - Scene 1's prism rotation uses `settle`, so its stop feels weighted.
- **Rewind** ("Run it backwards"): a rAF-driven `scrollTo` from the colophon to 0 over 8 s. It plays the entire piece in reverse, which proves reversibility to the visitor's own eyes. Any input cancels it on the same frame, and the piece holds wherever that is.
- **Sound:** n/a. This is a silent piece about light, autoplay audio is blocked by browsers, and sound would compete with stillness. There is no audio code.

---

## 15. Grin moments

1. **The title goes out of register** on the first scroll: "Bent Light" splits into cyan, magenta and yellow plates, the subtractive twin of the additive beam above it.
2. **The fan straightens into a corridor** (Scene 1 p 0.6–0.9): the rays become a one-point-perspective floor of colour.
3. **Every Scene 2 plateau is a painting:** stop anywhere and you get a hard-edge composition of one dominant colour.
4. **Dispersion you can count:** at Scene 3's rim each dot fans into its own tiny RGB spectrum, and in the triangle–circle overlap the triplets spread twice as wide.
5. **The crystal shimmers when you stop** (Scene 4 admire): the light drifts ±6° and colour slides across the facets like a hand tilting dichroic glass.
6. **The click of agreement** (Scene 5 p 0.9 → 1): the fringe flickers in once, then the beam goes exactly, perfectly white.
7. **Run it backwards:** one button replays the whole piece in reverse in 8 s.
8. **The chorus:** the moment, at the end of Scene 4, when the visitor recognises the seven bands they saw at the start.

---

## 16. The polish list (each item checkable)

1. The Scene 1 p = 0 frame renders identically with JS disabled, apart from the noscript banner.
2. The title plates in register produce pure black (sample the glyph centre: R, G and B each ≤ 3).
3. Every identity seam diff is ≤ 0.5% of pixels at 1440×900 and 375×812.
4. All seven bands in Scenes 1, 2, 4 and 5 meet without a hairline gap or overlap at 1×, 1.5× and 2× DPR. Band edges are snapped to device pixels.
5. Scene 2's overscanned shear never reveals ground at any p, at all five viewports.
6. Scene 3's RGB triplets are exactly aligned (white) at each shape's centre and maximally spread at the rim.
7. Scene 3's shape edges are anti-aliased with no clip-path stair-stepping. The `--glass-edge` stroke covers the clip boundary.
8. Scene 4's facets share edges exactly, with no seams between triangles. The fill uses a 0.5px stroke in the same colour.
9. Scene 4's jitter and normals come from a fixed seed: two runs produce byte-identical canvas pixels at the same p.
10. Scene 5 p = 1 is exact `#FFFFFF` across the full beam width, with no fringe pixels.
11. Scene 6 p = 1 matches Scene 1 p = 0 in prism position, beam and spectrum card to within 1px. Only the title and cue are absent.
12. The scene label numeral uses tabular figures, and the label width never changes the wordmark position.
13. The rail fill's spectrum gradient is in band order, and its leading edge reaches each tick exactly at that scene's p = 0.
14. The current tick's fill colour is that scene's key colour: vermilion, saffron, cobalt, jade, white and violet respectively. Under the light chip the white tick gets an ink outline.
15. Tick hover labels never clip at the viewport edge. They flip side below 1024.
16. The chrome never fades out while a chrome element has focus or hover.
17. Breathing ramps in over 1,600 ms with no first-frame jump: the delta on the first frame is ≤ 0.2px or 0.05°.
18. On exit, the ambient offset decays in 240 ms while the scroll response is immediate. No pop larger than 1px.
19. `pointermove` under 4px does not exit admire mode. A trackpad resting finger does not keep the chrome awake.
20. The pause choice survives reload. With `localStorage` blocked, the page still works and defaults to on.
21. The pause control under reduced motion is focusable, announces why it is off, and does nothing on activation.
22. Caption changes never show two captions overlapping at more than 50% opacity each.
23. Every chip passes ≥ 7:1 contrast over the brightest and darkest frame beneath it (test S2 saffron, S4 p 0.5, S5 p 0.25).
24. The focus ring is visible on wall, saffron, cobalt, mosaic and ink. Screenshot each.
25. No horizontal scrollbar at 375px under 200% zoom.
26. Rewind is cancelled by wheel, key, pointerdown and touch, and announces "Rewind stopped." with the scene name.
27. During rewind, admire mode never triggers, and the chrome stays visible.
28. The font loads with no visible swap. The title box height is fixed, so CLS = 0.
29. The prism's left-face cyan and right-face magenta fringe lines stay 1px at every DPR (no blurring when rotated). Use `vector-effect: non-scaling-stroke`.
30. The colophon begins on the same `--wall` value as Scene 6 p = 1: no colour step where the stage unsticks.

## 17. Anti-goals

- Never a dark page with neon things on it. That is Nocturne's world, and in Prism the colour is the ground.
- Never the famous album-cover composition: no prism on a black ground, no angled beam in and rainbow out. In this piece the prism only appears on the pale wall.
- Never rainbow gradients inside a band, "holographic" noise or glow blur. Bands are flat, and glass is a 22%→5% gradient at most.
- Never strobe, flicker, rapid hue cycling or op-art stripe gratings.
- Never scroll-jacking, scrub smoothing, mandatory snap or a smooth-scroll library (P2).
- Never text that animates in letter by letter, and never body copy gated by motion (P7).
- Never "demo reel" seams: no fade-to-black between scenes and no empty scroll.
- Never decorative particles. Every element is light, glass or the surface the light falls on.

## 18. Acceptance by eye (what polish-critic captures)

- **Every scene at p = 0, 0.25, 0.5, 0.75, 1** at 1440×900 and 375×812 (60 shots). Each must match its row in §4.
- **All five seams** as before/after pairs at 1440×900 (the diff is attached).
- **Three hero frames at 1920×1080:** Scene 1 p 0.5 (fan), Scene 4 p 0.5 (mosaic peak) and Scene 5 p 0.5 (chord).
- **20 random positions** (seeded) at 1440×900. The critic asks of each: would I screenshot this?
- **Admire mode:** Scene 4 p 0.5, chrome visible vs. admire after 3 s (two frames 6 s apart show the shimmer moved).
- **Chrome states:** tick hover, tick focus, pause in its three states, both chip themes, the noscript banner and the scene-error chip.
- **Reduced motion:** three stills for every scene, plus one cross-fade midpoint (Scene 2 p 0.25).
- **Viewports 768×1024 and 1024×768:** Scene 2 p 0.5 and Scene 3 p 1 (shelf, horizontal and vertical).
- **Flash audit plot:** mean Y across the whole document and during the rewind, saved to `evidence/`.

---

## 19. Risks, stated honestly

| Risk | Likelihood | Mitigation or fallback |
|---|---|---|
| Identity seams need two modules to render pixel-equal frames. That is the hardest invariant in this spec. | medium | A shared `geometry.js` provides the band rects, dot grid and shelf positions consumed by both sides of each seam, and a seam-diff test catches drift. Fallback: a 3% opacity cross-fade inside the seam (still deterministic). |
| Scene 3's paint cost (four full-viewport pattern fills ×3 shapes, screen blending, nested clip) is unmeasured; technique says SVG raster is unverified. | medium | Measure in WO 1. Fallbacks: drop to 2 channel copies (R and B); limit the pattern rects to the shape bounding boxes (big win); render Scene 3 to canvas instead. |
| Scene 4 at DPR 2 and 1920 is a full-screen canvas fill of 920 triangles per frame, untested for raster. | low–medium | Cap DPR at 2. Raise the pitch by 8px if p95 > 16.8 ms. The canvas only draws while Scene 4 is active. |
| Seven `mix-blend-mode: screen` full-height layers in Scene 5. | low | Only during Scene 5. The beams are narrow after p 0.3. |
| A self-hosted font adds about 45 KB plus a preload. The architect may veto it. | low | Fallback: `system-ui` 700 with −0.03em tracking. The design survives it; the title loses some geometric character. |
| A fast user fling through Scene 6 is a single dark → light change across the full screen. | low | It is a single transition, not a flash pattern, and it is user-driven. The flash audit covers the scripted rewind. Real-device fling testing is not possible here. |
| Portrait axis swap: every scene must be verified in both orientations. | medium | One (u, v) geometry, and e2e captures at 375 and 768 portrait. |
| Isoluminant edges (jade/azure) may vibrate for some viewers. | low | Azure was lowered to Y 0.33 (Δ 0.11 from jade). |
| Real iOS dynamic-toolbar and touch-momentum behaviour cannot be verified (technique §Open). | known | `svh` stages and cached offsets. Flagged as an unverified environment gap. |
| Resemblance to famous prism imagery. | low | The anti-goal above, and director-vision checks it. |

**What I raised beyond the brief:**
- identity seams, made testable by screenshot diff;
- a photosensitivity design rule with a flash-audit test;
- a portrait axis swap instead of a squeezed desktop layout;
- "Run it backwards" as a visible proof of reversibility.

**Notes for the architect:**
- **Suggested work-order split:**
  - engine and chrome;
  - geometry, tokens and eases;
  - Scenes 1 and 6 (one SVG module, two modes);
  - Scenes 2 and 5 (band accordion; the same band component);
  - Scene 3;
  - Scene 4;
  - the reduced-motion cut, the flash audit and the seam tests.
- **Shared components:** `Bands` (Scenes 1-end, 2, 4-end, 5), `PrismSVG` (Scenes 1 and 6) and `DotGrid` (Scenes 2-end, 3 and 4-start).
- **Interface:** each scene exports `state(p, viewport)` and `apply(state, ambient)`. Test hooks are `window.__showcase.stateAt(y)` and `.snapshot()` (technique §7).
