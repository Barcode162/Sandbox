# Experience spec B: "Paper & Ink"

M-0001 Scroll-driven animation showcase · Bake-off proposal B · experience-designer (motion) · 2026-11-20

> **The piece is called *Quire.*** (the full stop is part of the name). A quire is a gathering of folded sheets, the unit a book is sewn from. Over six movements, one sheet of paper is pressed, inked, folded, cut, bound and closed, and a single vermilion full stop carries through all of it. This is the "Point". It is the period of the title, the drop of ink, the ball in a flipbook, and finally the last full stop of the colophon.

---

## 0. How to read this spec

- **Units.** `u` = 1% of the **sheet width** as Scene I lays it out (see §11). `P` = width of one octavo page (Scenes IV to VI). `svh` = small-viewport height. Every number that sets a position is in `u`, `P` or `%` of the stage, so the frames scale with the viewport.
- **Progress.** `G` is global progress (0 to 1) over the single track. `p` is a scene's local progress. `seg(p,a,b) = clamp((p−a)/(b−a),0,1)`. `E_name(t)` is an easing token from §9.3, applied to a segment.
- **Purity.** Everything in §3 is `state(p)`. The only time-driven things are the UI transitions (§6, §7) and the ambient layer (§5). This spec never asks for a scene element to move on a clock.

---

## 1. North star

**Every frame of *Quire.* could be tipped into a fine-press book as a plate. When you stop, the page becomes one, captioned and breathing; when you scroll on, it is paper again.**

---

## 2. Reference points (craft only; all content is original)

| Reference | The specific craft we take |
|---|---|
| **Letterpress blind deboss** (fine-press practice) | An impression with no ink reads through **light alone**. One 1px highlight sits below-right and one 1px shade above-left at about 35% opacity. Scenes I and VI build on this: a title made of shadow. |
| **Wet-in-wet watercolour and tide lines** | Ink spreads fast and then slows (`E_ink`). It **runs further along the paper grain** (×1.35 horizontally) and leaves a darker **tide line** at its edge as it dries. Masking fluid (resist) leaves letterforms in clean paper. This is Scene II. |
| **Octavo imposition** (bookbinding) | Sixteen pages are printed on one sheet, some upside down, so that after three folds they all read upright and in order. In Scene III the visitor watches upside-down numbers right themselves. |
| **Tunnel books** (19th-century paper engineering) | Depth comes from **stacked flat planes, each a darker tint, each casting a short shadow** on the next. There is no perspective camera. This is Scene IV. |
| **Flipbooks and onion-skinning** (hand animation) | Each page holds one still drawing, and the previous drawing shows as a 25% ghost. Squash and stretch carry the weight. Scroll speed becomes flip speed. This is Scene V. |
| **Intel principles 1, 4, 7, 12** (`intel/references.md:130-141`) | Design every frame, not only the keyframes. Hand off a persistent element instead of cutting. Never hold body text hostage. The opening frame is already finished art. |

---

## 3. The arc and the six scenes

### 3.1 Arc and tempo

The sheet's life runs **press → ink → fold → cut → flip → close**. The tempo alternates (intel principle 3), and Scene V is the peak.

| # | Scene | Technique | Scroll length | Mood / density | Starts at G |
|---|---|---|---|---|---|
| I | **Impression** | DOM kinetic type: per-glyph transforms over a static deboss layer | 120 svh | quiet, held breath | 0.000 |
| II | **Bloom** | Canvas 2D generative ink: seeded noise contours, tendrils, resist text | 220 svh | dense, organic | 0.098 |
| III | **Fold** | CSS 3D: nested `preserve-3d` panels, valley folds, computed shading | 260 svh | mechanical, deliberate | 0.279 |
| IV | **Tunnel** | Pre-rendered layer bitmaps moved by transform; light-direction shadows | 160 svh | rest, deep, still | 0.492 |
| V | **Flip** | CSS 3D page turns with 6-strip curl; a flipbook drawn as static DOM pages | 280 svh | **peak**, playful | 0.623 |
| VI | **Colophon** | DOM/CSS 3D: book closes, the Point travels to the last full stop | 180 svh | resolution, hush | 0.852 |

The total scroll length is 1,220 svh, so the track is 1,320 svh tall including the final stage height. At 900 px tall that is about 11,900 px of travel, about 70 s at a leisurely scroll.

**One stage, one track.** All six scenes render as layers inside **one** `position:sticky; top:0; height:100svh` stage (the "desk"), within one tall track. Zero-height anchor markers at each scene's start G drive the Contents links and native scrolling. Scene layers that are not active are `visibility:hidden` and `inert`, and `apply()` is skipped for them. *Why:* a native "slide" between separate sticky stages would show two half-stages at many resting positions and fail the 20-random-stops bar. With one stage, every transition is authored. *(This is a design requirement. The architect owns the mechanism.)*

**The seam rule (testable).** At every boundary, scene N at `p=1` and scene N+1 at `p=0` render the **same picture**. Each boundary is listed in §4. A screenshot at the boundary −1 px and +1 px must differ in under 0.5% of pixels.

**Node budget.** No scene comes near the ~1,000-node cap (technique.md:23). The estimated animated nodes per scene are I ≈ 30, II ≈ 6 (canvas), III ≈ 50, IV ≈ 16, V ≈ 130, VI ≈ 40. The architect therefore has room to spare.

### 3.2 The Point

There is one `div` for it (plus a shadow and a specular child) in a **global layer above every scene**. Each scene's `state(p)` outputs the Point's `{x, y, d (diameter), sx, sy (squash), lift (0–1 shadow), wet (0–1 highlight), visible}`. Colour `--vermilion`. When `lift > 0` its shadow is a separate blurred disc offset by `(0.4u + 1.6u·lift, 0.6u + 2.0u·lift)` at opacity `0.28 − 0.12·lift`. Scenes II, IV and V hand the Point to their own renderers at given p values. Those swaps are pixel-matched, as noted in each scene.

---

### Scene I · Impression

**Technique.** Each of the six title glyphs `Q u i r e .` is three layers.
- **Deboss.** Static text in `--paper`, with `text-shadow: 0 1px 0 rgba(255,255,255,.7), 0 -1px 0 rgba(29,27,24,.22)`. It never moves.
- **Ink sort.** The inked glyph in `--ink`, moved by transform.
- **Sort shadow.** The same glyph in `--ink` with a static `filter: blur(0.5u)`, moved by transform and opacity.

Glyph positions are **measured from the unsplit text with a `Range`** and then pinned absolutely, so kerning survives the split. The full stop is the Point itself, not a glyph.

**On the sheet (p=0, landscape, deckled):**
- **Kicker.** `A BOOK IN SIX MOVEMENTS`, small caps at 1.5u, tracking 0.18em, `--ink-2`, centred, top at 18% of sheet height.
- **Title.** `Quire.` in `--font-book` 700 at 26u, centred, baseline at 58% of sheet height.
- **Subtitle.** *One sheet, pressed, inked, folded, cut and bound.* Italic at 2.4u, `--ink-2`, baseline at 70%.
- **Folio.** `i` at 1.4u, centred, 6u above the bottom edge.

**Mapping** (glyph index `i` = 0..4):
- `t_i = seg(p, 0.07i, 0.07i + 0.42)`
- Rise `y_i = −28u · E_lift(t_i)`. Scale `1 + 0.12·E_lift(t_i)`. Rotation `(−1)^i · 4° · E_lift(t_i)`.
- Opacity is 1 until `t_i = 0.70`, then falls linearly to 0 at `t_i = 1`, so a glyph has faded before it reaches the sheet's top margin. **Nothing is ever cut by a sheet or viewport edge.**
- Sort shadow offset `(0.3u + 1.4u·E, 0.5u + 2.2u·E)`, opacity `0.30·(1−t_i)`.
- **The Point**, with `tp = seg(p, 0.62, 0.95)`, moves from the period position to the sheet centre along a quadratic arc whose control point is 12u above the midpoint. Diameter `3.4u → 5.2u`, `lift = E_lift(tp)`, `wet = seg(p, 0.70, 0.90)`.

**First-response guarantee.** At p = 0.05 (about 54 px of scroll at 900 px tall), Q has risen at least 1.2u (≥ 10 px at 1440) and its shadow has visibly separated. The first wheel tick always moves something.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | The sheet rests on the desk. *Quire.* is set in heavy ink with a vermilion full stop, and the kicker, subtitle and folio are in place. The deboss is invisible beneath the ink. | This is the title page of a fine book. It is symmetrical and optically centred, and the only colour is the full stop. It is finished art before any JS runs (§6.1). |
| **0.25** | Q is high (t 0.60, 17u up, rotated 2.4°), u is mid-rise, i is just leaving and r is barely lifted. e and the Point are still seated. Under Q, u and i the **blind deboss** shows clearly. | An ascending diagonal, like a melody line, sits above its own shadow-title. The double image reads as a deliberate registration study. |
| **0.5** | Q and u are gone. i is a faint ghost near the top margin, r is mid-rise and e is lifting. Most of the title is now pure deboss. | It is the tail of a cascade over a blind-embossed title, so the eye moves from the lifted letters to the impressions. |
| **0.75** | No letters remain. The whole title is blind deboss. The Point is 39% along its arc, lifted, with its shadow on the paper and a wet highlight forming. | A quiet embossed page with one moving vermilion accent off-axis, in classic asymmetric balance. |
| **1** | The Point hovers over the sheet centre (above the gap between i and r) at 5.2u. It is fully lifted and wet, with a soft shadow beneath. The blind title is intact, and kicker and subtitle are in place. | A drop held over a page. The tension of what comes next is the composition. |

**Epigraph** (margin, readable, static): *Press type into paper and it leaves two things behind: the ink, and the dent. Scroll, and keep only the dent.*

---

### Scene II · Bloom

**Technique.** A single `<canvas>` clipped to the sheet (DPR capped at 2), drawn by `bloom(p, seed = 1729)` from seeded value-noise.
- **Wash layers.** 6 layers, `j = 0..5`. Each is a closed contour of 256 points with radius `R(θ)·(1 − 0.09j)·(1 + 0.08·noise_j(θ))`, filled `--ink` at alpha 0.14, composited with `multiply`. Stacking them gives watercolour edge darkening.
- **Anisotropy.** `Rx = 46u`, `Ry = 26u` at full size. The grain runs horizontal.
- **Vermilion heart.** A disc under the washes, radius 2.6u growing to 7u by p 0.40, with a noise edge. The washes multiply over it into a brick-brown fringe.
- **Tendrils.** 36 capillary polylines of 12 points each, starting on the outer contour and biased to ±25° of horizontal. Length 4–12u, `lineWidth 0.15u`, alpha 0.5.
- **Resist.** The word *bleed* in `--font-book` italic 400 at 18u, centred, is drawn with `destination-out` over **all** ink and the heart, so the letters stay clean paper even inside the red.
- **Satellites.** 7 droplets of 0.3–0.8u, thrown radially at impact. They land 4–9u out by p 0.16 and remain as stains.
- **Wet sheen.** A radial lighten gradient at alpha 0.18 that follows the bloom and dries out over p 0.60–0.85.
- **Tide line.** The outermost contour stroked in `--ink-2`, width 0.25u, alpha `0.9·seg(p, .55, .85)`.

**Mapping.**
- **Fall, 0–0.10.** The DOM Point falls. Shadow offset → 0, lift 1 → 0, diameter 5.2u → 4.6u.
- **Impact, 0.10–0.13.** The Point squashes to `sx 1.35, sy 0.70` and back. At p = 0.13 the DOM Point hides and the canvas heart takes over at the same area and position (pixel-matched).
- **Growth.** `R = Rmax · E_ink(seg(p, .13, .60))`.
- **Tendrils.** Length × `E_ink(seg(p, .30, .75))`.
- **Fading under the ink.** The blind title fades over 0.13–0.30. Kicker, subtitle and folio fade over 0.20–0.35 (printed matter disappears under the wash).

| p | Frame | Why it is composed |
|---|---|---|
| **0** | = Scene I p=1. | Seam. |
| **0.25** | The bloom is at about 55% of full size, glossy and wet, with crisp lobes. The resist shows *lee* partly emerging from the centre. 7 satellite stains, a 5u vermilion heart, the kicker fading and the blind title gone. | A bright wet blot, centred and asymmetrically lobed, with paper margins balanced on all four sides. The fragment of a word teases. |
| **0.5** | The bloom is about 95% grown, and *bleed* reads clearly in reserve across the heart. Tendrils are half grown along the grain and the sheen is still wet. | The hero image of the scene: a word that exists only as absence of ink. |
| **0.75** | Drying. The sheen is mostly gone and the tide line is crisp and dark. Tendrils are at full length, and the heart is matte. | A finished still life: ink at rest. |
| **1** | Dry and matte. Every element is final. | Seam to Fold. |

**Epigraph:** *A drop of ink is a small, wet decision. The paper makes the rest.*

---

### Scene III · Fold

**Technique.** The sheet is a 4 × 2 grid of panels (landscape; for portrait see §11) in a nested `transform-style: preserve-3d` hierarchy with `perspective: 2400px`.
- **Front faces.** Crops of a **one-time render of `bloom(1)`** to an offscreen canvas, done on load and on resize, so the inked sheet is the sheet that folds. The deckle edge is on the outer edges of the edge panels (static `clip-path`).
- **Back faces.** The **imposition** (below).
- **Lighting.** Each moving half gets a shade overlay with opacity `0.35·sin θ`. The surface beneath gets a cast-shadow gradient from the fold axis with opacity `0.25·sin θ`. Stacked layers are separated by `translateZ(0.5px)` against z-fighting.
- **Recentring.** The whole assembly translates so the folded footprint's centre stays at the stage centre.
- **Scale rule.** *The folded object always stands about one sheet-height tall.* Scale is 1 through fold 1, goes 1 → 2 during fold 2, and stays at 2.

**Imposition (back faces).** Each back panel shows the page number it will have in the folded signature: a large italic numeral at 30% of panel width in `--ink-2`, plus a 3-word running head in small caps at 4% of panel width. Panels that end upside down are printed inverted, so **after all three folds every visible face reads upright**. The architect derives the orientation by composing the fold transforms at p = 1, and a unit test asserts it. The face on top of the octavo at p = 1 is the **title page**: *Quire.* in `--ink` at 14% of page width, a hairline frame inset 6%, and the folio `1`.

**Valley folds, toward the viewer.**

| Range | Event |
|---|---|
| 0.00–0.06 | Crease 1 draws: a vermilion dashed line (dash 0.8u, gap 0.6u) along x = 50%, via `stroke-dashoffset`. |
| 0.06–0.30 | **Fold 1** (folio): the right half rotates `rotateY 0 → −180°` with `E_paper`. The crease fades over 0.06–0.10. |
| 0.30–0.38 | Hold. Label: **Folio** · *folded once: two leaves, four pages* |
| 0.36–0.40 | Crease 2 draws along y = 50% of the folded stack. |
| 0.38–0.58 | **Fold 2** (quarto): the bottom half rotates `rotateX 0 → 180°`; scale 1 → 2. |
| 0.58–0.66 | Hold. Label: **Quarto** · *folded twice: four leaves, eight pages* |
| 0.62–0.66 | Crease 3 draws along x = 50% of the stack. |
| 0.66–0.86 | **Fold 3** (octavo): the right half rotates `rotateY 0 → −180°`. |
| 0.86–1.00 | Hold. Label: **Octavo** · *folded three times: eight leaves, sixteen pages* |

Labels sit in the lower margin under the object. They crossfade over 2% of p and are otherwise fully opaque, so they are never animated as letters.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | = Scene II p=1. The flat inked sheet, with the first crease not yet drawn. | Seam. |
| **0.25** | Fold 1 is about 90% done (θ ≈ 162°). The right half is almost down, its back showing the imposition numerals (some upside down), with a strong shade and the cast shadow narrowing. The left half of the bloom is visible. | A closing book shape: a strong diagonal arch over the inked half. |
| **0.5** | Fold 2 is at θ ≈ 120°. The bottom half has passed vertical and is coming over toward the viewer, with its inverted numerals turning upright. Scale is about 1.6. | The grin beat: *the upside-down numbers are righting themselves.* Foreshortening gives depth without moving the camera. |
| **0.75** | Fold 3 is at θ ≈ 80°, the right half standing almost upright and edge-lit. The label area is clear. | A standing leaf, like a page caught mid-turn. Vertical and still. |
| **1** | The octavo signature, portrait, centred, one sheet-height tall. The title page is on top and the **Octavo** label is shown. | A small, perfect object, and a new title page to hand off. |

**Epigraph:** *Fold a sheet once and it is a folio. Twice, a quarto. Three times, an octavo: sixteen pages, upside down until they aren't.*

---

### Scene IV · Tunnel

**Technique.** Seven layers `L1` (front) to `L7` (back plate). They are rendered **once** per resize to offscreen bitmaps and moved only by transform and opacity, so no mask is recomputed per frame.
- **Tints.** `L1 --paper`, `L2 #EFE9DE`, `L3 #EAE3D6`, `L4 #E4DCCD`, `L5 #DED5C4`, `L6 #D7CDBA`, `L7 --paper-deep`.
- **Cut.** `Lk` (k = 1..6) has a hole shaped like a bold italic **&** in `--font-book`. L1's & is set at 80% of `P`. Each later & is scaled `0.84^(k−1)` and rotated `(−1)^k · 1.5° · (k−1)`, **about a shared pole**.
- **The pole** is the & glyph's pole of inaccessibility: the centre of its largest inscribed circle, found once from L1's rendered glyph mask with a distance transform on a ~100 × 140 grid.
- **The Point** sits on L7 at the pole, with diameter = 80% of that inscribed circle. It is visible through every hole.
- **Shadows.** Each layer has a pre-blurred shadow bitmap (blur 1.2% `P`), drawn under it at opacity 0.28 and offset by `d_k = k · gap(p) · 1.1%P` along the light direction `φ(p)`.

**Mapping.**
- **Knife, 0.00–0.10.** A vermilion stroke of the & outline (rendered once) is revealed by a conic sweep about the pole, 0 → 360°. *A compass-knife cutting the shape.*
- **Cut piece drops, 0.10–0.16.** The & of paper falls `translateY 0 → 3%P` and fades out, opening the hole.
- **Depth.** `gap = E_paper(seg(p, .12, .45))`. Layer scale `1 − 0.035·k·gap`, about the pole.
- **Light sweep.** `φ = lerp(135°, 45°, E_paper(seg(p, .45, .80)))`: the light moves from top-left to top-right.
- **Collapse, 0.80–0.95.** `gap → 0`. L2 to L6 slide down 4%P and fade out over 0.80–0.95, *settling into the book block*. Afterwards only L1 (the cover) and L7 (the first recto) remain.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | = Scene III p=1: the octavo title page. | Seam. |
| **0.25** | The hole is open. The tunnel is at about 40% depth, with soft shadows to the bottom-right and tonal steps between the nested &s. The Point glows at the core. | A contour map of an ampersand: concentric, calm and readable. |
| **0.5** | Full depth. Seven tonal planes, each & casting a short shadow, all receding to the vermilion Point. | The scene's still peak, and the restful counterweight before the flipbook. |
| **0.75** | The light has swept to top-right (φ ≈ 60°), so every shadow now falls bottom-left. Depth is still full. | The same object under different light, like a photographer's second exposure. |
| **1** | Collapsed. The cover with its & hole, and the Point seen through it on plain paper. | Seam to a closed book. |

**Epigraph:** *Seven sheets, one cut each. Pull them apart and a flat page gets a deep end. Paper & ink; edge & shadow.*

---

### Scene V · Flip (the peak)

**Technique.**
- **The book.** A cover plus **8 leaves (16 pages)**, honouring the octavo. Each leaf is 6 vertical strips nested in `preserve-3d`, each strip a child of the previous. Strips overlap by 0.5 px so no hairline seams appear.
- **Turn and curl.** Leaf rotation `θ = −180° · E_paper(t)`. Bend `β(t) = 22° · sin(πt)` is spread over the strips (β/6 each), so a leaf is flat at rest and curls mid-turn.
- **Shading.** The leaf takes shade at `0.3·sin θ`, and the page beneath takes a gutter shadow.
- **Static pages.** Page content is fixed DOM. **Only leaf transforms change.** The animation emerges from the page sequence, exactly as in a real flipbook.

**Mapping.**
- **Opening, 0–0.10.** The cover (L1) swings `rotateY 0 → −180°` about its left edge, and the book translates `+P/2` so the open spread ends centred.
- **Leaves.** Leaf `k = 0..7` turns over `t = seg(p, 0.10 + 0.095k, 0.26 + 0.095k)`, so at most two leaves are ever in the air.
- **Final hold.** The last leaf lands at 0.925, and 0.925–1 holds.

**The flipbook (rectos, page width = 100pw, baseline at 78% of page height, hairline rule at the baseline).** Each recto also shows the **previous** frame's Point as a 25% `--graphite` onion-skin ghost.

| Recto | Point (x, y), diameter, squash | Drawing |
|---|---|---|
| r1 | at the pole (as seen through the & hole), 8pw, round | hanging |
| r3 | (50, 60), 8pw, sx 0.80 sy 1.30 | falling, stretched, 3 speed hairlines above |
| r5 | (54, on baseline), 8pw, sx 1.45 sy 0.60 | contact squash, 2 tiny dust marks |
| r7 | (58, 52), 7pw, sx 0.88 sy 1.15 | rebound |
| r9 | (63, 48), 6.5pw, round | apex, smaller |
| r11 | (68, on baseline), 6pw, sx 1.30 sy 0.75 | second contact |
| r13 | (73, 68), 5pw, round | a small hop |
| r15 | (82, on baseline), 4pw, round, 3 receding ghost dots | rolling toward the end of the line |

**Versos** carry one readable line each, italic at 5.5pw, centred at 45% of page height.

| Verso | Line |
|---|---|
| v2 | *A dot fell.* |
| v4 | *It struck the line and gave a little.* |
| v6 | *It rose again, but not as high.* |
| v8 | *It fell again, shorter, faster.* |
| v10 | *Every bounce was a smaller argument.* |
| v12 | *It rolled toward the end of the sentence* |
| v14 | *and found the place where sentences stop* |
| v16 | *and then it was still* followed by the Point as its full stop (at 1.6pw; the DOM text contains a visually-hidden "."), at display size 7pw |

The **back endpaper** (inside the back board) is a **marbled** pattern of combed ink and vermilion. It is generated once per resize on a canvas with seed 1729 and never animates.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | = Scene IV p=1: the closed book, with the Point seen through the cover's &. | Seam. |
| **0.25** | Leaf 0 is landing (t 0.94). Leaf 1 is lifting and curling (t 0.34). The right page shows r3/r5 with an onion-skin ghost, and the left shows *A dot fell.* | A fan of two pages caught mid-riffle, the classic open-book silhouette. |
| **0.5** | Leaf 3 is nearly down (t 0.72) and leaf 4 is just lifting (t 0.13). The left page reads *It fell again, shorter, faster.* | The spread is legible, and the curl adds a single elegant arc. |
| **0.75** | Leaf 6 stands upright with full curl (t 0.50), and leaf 5 has landed. | A vertical leaf over the gutter, symmetrical and poised. |
| **1** | The final spread. Left: *and then it was still*, with the Point as its full stop. Right: the marbled endpaper. | The joke lands and the book rests. |

**Epigraph:** *Every page holds one still frame. Scroll slowly to read it. Scroll quickly to watch it.*

---

### Scene VI · Colophon

**Technique.** DOM and CSS 3D. The closing block is the cover plus 8 leaves as **one** element with a 1.2%P page-edge strip (so the 8 leaves do not each animate). The colophon text is ordinary DOM text that fades in once as a block.

**Mapping.**
- **Lift, 0.00–0.18.** The Point lifts off v16: lift 0 → 1, d 1.6pw → 2.4pw, rising 6%P. *The sentence on v16 loses its full stop.*
- **Close, 0.15–0.45.** The left block rotates `rotateY 0 → 180°` about the spine onto the right side, `E_paper`. The cover shows the title page: *Quire.*, the hairline frame and the & hole.
- **Move, 0.40–0.60.** The closed book translates to the left third (desktop) or the upper half (≤ 768).
- **Text, 0.50–0.58.** The colophon block's opacity goes 0 → 1. It is fully legible from then on.
- **Arrival, 0.58–0.85.** The Point arcs to the **empty full-stop slot** at the end of the colophon's last sentence, shrinking to 0.24em of body size (a touch bolder than a period: *our signature*).
- **Landing, 0.85–0.88.** Squash `sx 1.2 sy 0.85 → 1`. Then hold.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | = Scene V p=1. | Seam. |
| **0.25** | The book is mid-close (θ ≈ 60°), the left block arched over, with the Point hovering lifted above it. | A dynamic book shape with a held accent above it. |
| **0.5** | The book is closed and drifting left, its cover and & hole catching the light. The Point hovers. The colophon is not yet showing. | An object and an accent, with generous negative space where the text will come. |
| **0.75** | The colophon is fully legible except its last full stop. The Point is mid-arc above it. | Anticipation as composition: the eye goes to the empty slot. |
| **1** | The book is closed at left, the colophon at right, and the Point is its last full stop. *Back to the first page* is shown. | The resolution: ink, paper and one red dot at rest. |

**Colophon (real copy, the full DOM text):**

> **Colophon**
>
> *Quire.* was set in the serif already living on your device, inked on a canvas, folded with CSS transforms and cut from seven sheets of bitmap. Nothing was downloaded but the page itself. Every frame is a function of where you are, so stop anywhere and it will wait for you.
>
> It began with a full stop, and it ends, as good sentences do, with one⟨Point⟩

The link below it reads **Back to the first page**. It scrolls to G = 0, smoothly unless reduced motion is on, and focus moves to the *Quire.* home link.

---

## 4. Transitions (seams and hand-offs)

| Seam | The persistent element | What happens across it |
|---|---|---|
| I → II | The Point, the sheet, the blind title | The drop held above the page (I p .62–1) falls (II p 0–.13). The blind title is what the ink drowns. |
| II → III | **The inked sheet itself** | The dried bloom is re-rendered as the faces of the panels that fold. You fold the sheet you just inked. |
| III → IV | The octavo title page | The title page becomes the front layer of the tunnel. The knife cuts the & into it. |
| IV → V | The cover with the & hole, and the Point | The tunnel collapses into a closed book. The Point seen through the hole is frame 1 of the flipbook. |
| V → VI | The Point as a full stop | The Point lifts out of *and then it was still* and carries to the colophon's final sentence. |

**Epigraph changeover.** The old epigraph fades out over the last 3% of scene N, and the new one fades in over the first 3% of N+1. At the exact seam the margin is briefly empty, which is a composed, quiet beat. **Two text blocks never overlap.**

---

## 5. Admire mode

**Entry conditions.** All of these must hold:
- The visitor has scrolled at least once.
- **1,200 ms** have passed with none of `scroll`, `wheel`, `keydown`, `pointerdown`, `pointermove` (beyond 4 px from the last position), `touchstart` or `touchmove` (technique.md:25).
- The Contents panel is closed.
- The document is visible.

`scrollend` may re-arm the timer, but it never triggers entry on its own.

**Entry choreography** (UI time, not scene time):

| t (ms) | Event |
|---|---|
| 0 | Running head and progress spine: opacity 1 → 0 and running head `translateY 0 → −6px`, 600 ms `--ease-recede`. Then `visibility:hidden`. |
| 0 | Pause control dims to 0.55 opacity over 600 ms. It stays visible and interactive (WCAG 2.2.2). |
| 400 | Plate caption fades in over 500 ms. |
| 0 → 1,500 | Ambient amplitude envelope `A` ramps 0 → 1 (`--ease-inout`). Nothing starts abruptly. |
| 0 | `aria-live="polite"` region announces the plate (see below). |

**What does NOT recede.** The epigraph and the colophon stay. Visitors stop scrolling to read, so hiding text on stillness would hold it hostage (intel principle 7).

**Plate caption.** Bottom centre, just below the sheet. At ≤ 768 it goes where the running head was, top centre. Small caps title, italic phrase, `--ink-2` (`--paper-on-night` on the night desk). Format: **PLATE III · FOLD** — *Quarto: folded twice.* It is computed by a pure `plateCaption(scene, p)` (unit-testable):

| Scene | Phrase by p band |
|---|---|
| I | [0, .15) *Set, inked, and waiting.* · [.15, .45) *Lifting from the impression.* · [.45, .70) *Rising in a line.* · [.70, .92) *Only the full stop remains.* · [.92, 1] *A drop, held.* |
| II | [0, .13) *Falling.* · [.13, .35) *Wet, and spreading fast.* · [.35, .60) *The word appears where ink would not go.* · [.60, .85) *Drying at the edges.* · [.85, 1] *Dry. A tide line, a red heart.* |
| III | [0, .06) *A flat sheet, inked.* · [.06, .30) *Folding once.* · [.30, .38) *Folio: folded once.* · [.38, .58) *Folding twice; the numbers turn.* · [.58, .66) *Quarto: folded twice.* · [.66, .86) *Folding a third time.* · [.86, 1] *Octavo: sixteen pages, all upright.* |
| IV | [0, .16) *The knife goes round.* · [.16, .45) *Opening into depth.* · [.45, .80) *The light moves; the shadows follow.* · [.80, 1] *Seven sheets, pressed flat again.* |
| V | [0, .10) *The cover opens.* · [.10, .40) *A dot falls through the pages.* · [.40, .70) *Each bounce a little smaller.* · [.70, .925) *Rolling toward the end.* · [.925, 1] *Still.* |
| VI | [0, .18) *The full stop lifts.* · [.18, .45) *The book closes.* · [.45, .85) *Looking for the end of a sentence.* · [.85, 1] *Ended.* |

**Live announcement** (polite, only when the scene or band differs from the last one announced, so readers who pause often aren't spammed): "Plate three, Fold. Quarto: folded twice. Scroll or press any key to carry on."

**Ambient breathing.** This lives on its own wrappers (`.ambient-*`), *outside* every `state(p)` element. It uses transform and opacity only, multiplied by `A`, with a sine period of **8,000 ms** and no randomness, so it is deterministic when stopped.
- **Global raking light.** A stage-wide overlay, `radial-gradient(60% 80% at 50% 40%, rgba(255,250,240,.10), transparent)` plus a faint shade, translating `±3%` of stage width. Its opacity is 0.6 ↔ 1.0 of its own alpha. *It looks as if the window light is moving across the desk.*
- **Paper breath.** The sheet or book wrapper translates `±0.6px` on Y with phase +90°, and its desk shadow opacity varies ±6%.
- **Per scene:**
  - **I.** Deboss highlight layer opacity 0.75 ↔ 1, so the impression deepens as the light moves. Lifted glyph wrappers bob ±1.5 px, with the phase offset by 0.4 rad per glyph.
  - **II.** A sheen wrapper drifts ±2% when p < 0.60, while the ink is still wet. When dry, light only.
  - **III.** The assembly wrapper `rotateX ±0.5°`, the paper settling.
  - **IV.** A halo wrapper on the Point, opacity 0.85 ↔ 1.
  - **V.** The leaf wrapper of whichever leaf is mid-air `rotateY ±1.2°`, *as if from a draught*. With no leaf in motion: light only.
  - **VI.** The Point wrapper scales 1 ↔ 1.06.

**Exit, on any listed input.**
- Restore `visibility` **synchronously** in the handler, so a Tab keypress lands on a visible control. Chrome opacity returns to 1 in **160 ms** `--ease-out`, and the caption hides in 120 ms.
- `A` ramps 1 → 0 over 240 ms, so the ambient offset never snaps.
- **The input keeps its default action.** Space still scrolls and Tab still moves focus.
- **Exception.** `pointerdown`/`pointermove` *on the pause control* and `keydown` while it has focus do **not** exit admire mode.

**The pause control** (§6.4) toggles a persisted preference (`localStorage`, wrapped in try/catch, defaulting to "breathing on").
- **Paused:** admire mode still happens (chrome recedes, caption, announcement), but `A` stays at 0.
- **Hidden tab:** ambient stops. **Reduced motion:** ambient is never created.

---

## 6. The first five seconds, chrome and states

### 6.1 The first 5 seconds (scripted)

| t | What the visitor sees |
|---|---|
| **0 ms, first paint** | The finished Scene I p=0 frame, **from CSS alone**: desk, deckled sheet with its shadow, *Quire.*, kicker, subtitle, folio, running head and the scroll cue. There is no load animation. System fonts mean no FOUT, and the paper grain is a CSS gradient until JS replaces it. |
| **~50–150 ms** | JS boots. It splits the title into measured glyph layers at **identical** positions (test: pixel diff < 0.5% before and after) and generates the paper-grain tile (256 × 256, seeded, alpha 0.05 multiply). Nothing appears to change. |
| **0–2.4 s** | Stillness. The visitor reads *Quire.*, *One sheet, pressed, inked, folded, cut and bound.* and **Scroll to begin**. |
| **2.4 s, no input yet** | **The corner lifts.** The sheet's bottom-right corner (a 9u triangle, its own 3D element with a shade) peels to 9° over 450 ms `--ease-out`, then settles over 450 ms `--ease-inout`. *Turn the page.* It happens once more at 8.0 s and then never again. It is cancelled forever by any input and is off under reduced motion. It lasts under 5 s in total, so WCAG 2.2.2 does not require a control. |
| **First wheel tick (~100 px)** | Q rises ≥ 1.2u and its shadow separates, u begins to follow, and the scroll cue starts fading (gone by G = 0.03). **The first scroll gets a visible reaction in the first viewport.** |

### 6.2 Running head (top, `<header>`)

- **Left.** **Quire.**, a link to `#top`, `aria-label="Quire, back to the first page"`. Book face 700 at 15 px, with the period in `--vermilion` (decorative).
- **Centre (≥ 768).** The current scene, `III · Fold`, in small caps at 13 px, tracking 0.14em, `--ink-2`. It is updated as text only, without `aria-live`.
- **Right.** A **Contents** button.
- **Size.** 48 px tall (44 px at 375), transparent over the desk, with side padding equal to the gutter (§11).

### 6.3 Contents (button + `<nav aria-label="Contents">` panel)

**Panel.** A paper card (`--paper`, 1px `--graphite` border, `--shadow-card`), 320 px wide and anchored below the button. At 375 it is full width minus 2 × 16 px gutters. Heading: **Contents**.

**Rows.** Each row is a real anchor link: roman numeral, title, leader dots, page number. A "page" is one screen (100 svh) of the scroll.

| Row | Page |
|---|---|
| I · Impression | 1 |
| II · Bloom | 2 |
| III · Fold | 4 |
| IV · Tunnel | 7 |
| V · Flip | 8 |
| VI · Colophon | 11 |

Footnote: *Pages are screens. Your book may vary.*

**Current row.** A 6 px vermilion Point to its left and `aria-current="location"`.

**Opening.**
- Opens in 240 ms (opacity 0 → 1, `translateY −6px → 0`, `--ease-out`) and closes in 160 ms. Under reduced motion: opacity only, 120 ms.
- On open, focus goes to the current row.
- Escape, or a click outside, closes it and returns focus to the button.
- Tab and Shift+Tab move through the rows, and ArrowUp/ArrowDown also move between rows.

**Activating a row.**
- The site uses native `scrollIntoView` to that scene's anchor, `behavior: 'smooth'`. Every scene between here and there scrubs past at speed: **the book riffles** (a grin moment).
- Under reduced motion: `'auto'`.
- When the scroll settles, focus moves to that scene's heading (`h2`, `tabindex="-1"`, in the active layer).

| Element | Default | Hover | Focus-visible | Active | Expanded / current | Admire |
|---|---|---|---|---|---|---|
| **Contents button** | Text "Contents" plus a 6 px caret, `--ink-2` | `--ink`; 1px underline at 3 px offset, 120 ms | `--focus-ring` | `translateY(1px)`, 90 ms | `aria-expanded="true"`; caret rotates 180°, 160 ms | hidden |
| **Row** | `--ink` | `--paper-shade` background, 120 ms | `--focus-ring` inset | `translateY(1px)` | Point bullet + `aria-current` | n/a (the panel blocks admire) |

### 6.4 Pause control (bottom-right, fixed, 16 px from the edges, above the safe-area inset)

- A pill 32 px tall with padding `0 14px`, a 1px `--graphite` border and a `--paper` background on light and night desks alike. Small caps at 12 px, tracking 0.12em.
- **Label.** **Hold still** while breathing is on; **Breathe again** while paused. It is a plain button whose visible name changes.
- **Description.** `aria-describedby`: *Stops the slow motion that plays while you rest on a page.*
- **States.**
  - Default.
  - Hover: border `--ink`.
  - Focus-visible: `--focus-ring`.
  - Active: `translateY(1px)`, 90 ms.
  - Paused: `--paper-shade` background and a filled 6 px vermilion dot before the label.
  - Admire: opacity 0.55, still operable.
  - Reduced motion: **not rendered** (nothing to pause).
- After toggling, a polite status says "Breathing paused." or "Breathing on."

### 6.5 Progress spine (decorative, `aria-hidden="true"`; position is given to assistive tech by `aria-current` in Contents)

- **≥ 768.** A 1px `--graphite` vertical line, 16 px from the right edge, running from 72 px below the top to 72 px above the bottom.
  - It is split into 6 segments proportional to the scroll lengths, with 4 px gaps (the six signatures of a book).
  - The read portion is drawn in `--ink` at 2px.
  - **The Point rides it** as a 6 px vermilion dot at G.
  - **≥ 1024:** hovering a segment shows a label to its left, such as `III · Fold`, in 12 px small caps. It is not clickable, so there is no inaccessible duplicate of Contents.
- **375.** A 2px horizontal bar directly under the running head, with the same segments and Point.
- **Admire.** Hidden with the chrome.

### 6.6 Other chrome

- **Skip link.** **Skip to the colophon**, top-left, visible only on focus, a paper pill.
- **Scroll cue.** **Scroll to begin**, bottom centre, 12 px small caps, with a 24 px hairline beneath. It is static, with no bounce loop, and fades out by G = 0.03.
- **Focus ring (`--focus-ring`).** `outline: 2px solid var(--ink); outline-offset: 3px; border-radius: 2px`. On the night desk the outline is `--paper-on-night`.

### 6.7 Loading, empty and error states

| State | What happens | Copy |
|---|---|---|
| **No JS** | `html.no-js`. The track collapses to a static **text edition**: each scene's numeral, title and epigraph is set on a paper card in sequence, followed by the colophon. | Banner on top: *This book moves when JavaScript is on. Without it, you're reading the text edition. Every word is here.* |
| **Canvas 2D unavailable** (II, IV, marbling) | Those scenes render their text-edition plate: the epigraph plus a typographic stand-in. For II, the word *bleed* in `--ink` on paper; for IV, a large outlined & with the Point. | No error copy; the stand-ins are composed frames. |
| **3D transforms unsupported** | III and V show their plates at p = 0, 0.5 and 1, crossfaded as in reduced motion (§8). | none |
| **Runtime error inside one scene's `apply()`** | Caught per scene. That layer freezes on its last good frame, the other scenes keep running, and the error is reported once to `__showcase.errors`, not the console, so it can be tested. | none (the visitor sees a still plate) |
| **Resize / orientation change** | Re-measure, re-render the one-time bitmaps, and **restore the same G** (scroll to `G × newLength`), so the visitor stays on the same frame. | none |
| **Empty** | Not applicable: the content is fixed. | none |

---

## 7. Feel (input, microinteractions)

- **Scroll → frame.** One rAF, ≤ 16.7 ms. **No scrub smoothing**, because smoothing would break determinism (intel A, "Scrub smoothing"). The *paper* feel comes from easing **inside** `state(p)`, not from lag.
- **Feedback.**
  - Hover responses take 120 ms. Button press: 1px depress over 90 ms `--ease-out`, released over 120 ms.
  - The focus ring appears instantly (0 ms).
  - Admire exit returns the chrome within 160 ms, and its visibility is synchronous.
- **Juice, all scroll-mapped and so all reversible.**
  - **Anticipation.** The Point gains its wet highlight before it falls (I .70–.90).
  - **Squash.** The Point at impact (II .10–.13, `sx 1.35 sy 0.70`), on the flipbook contacts (`1.45/0.60`, `1.30/0.75`) and on the final landing (`1.2/0.85`).
  - **Overshoot.** `E_settle` on the colophon landing (≤ 6% past the target, then settled).
  - **Particles.** The 7 satellite droplets at impact.
  - **Stagger.** The glyphs in I lift 0.07p apart.
  - **Hit-stop.** The 0.08p holds after each fold in III are the scene's breath.
- **Sound.** **n/a, by choice.** Paper and ink are silent media, and the piece's subject is visual stillness. Audio would need user activation and a mute control, and it would compete with admire mode. If director-vision wants sound, the one candidate is a synthesized paper-crease "tk" (a 4 ms filtered noise burst, −24 dBFS) at each fold's completion. It would be opt-in and off by default.

---

## 8. Reduced motion (`prefers-reduced-motion: reduce`): the second cut

The beauty stays and the movement goes.
- **Plates.** Each scene shows **three plates**, its own `state(p)` evaluated at `p ∈ {0, 0.5, 1}`. The plate shown is the nearest one.
- **Crossfades.** Between plates and across seams, the *scene content* dips to the paper: opacity 1 → 0 over 3% of p, then 0 → 1 over 3%, as a pure function of p. The sheet and desk stay put. **Nothing translates, rotates or scales while scrolling.**
- **The Point** jumps between plates with the same dip.
- **Turned off entirely:** the ambient layer (never created), the pause control (not rendered), the corner-lift hint, smooth scrolling, and the Contents panel slide (opacity only, 120 ms).
- **Everything still works:** all text, Contents, the spine (it is a position indicator, not motion), admire mode (chrome recedes and the caption appears, still) and the announcement.
- **Per-scene plates.**
  - **I:** inked title → staircase → blind title with the Point at the centre.
  - **II:** drop → full wet bloom with *bleed* → dry.
  - **III:** flat sheet → fold-2 position → octavo. The p = 0.5 plate is a 3D still, so no rotation is seen.
  - **IV:** title page → full-depth tunnel → collapsed cover.
  - **V:** closed book → mid-book spread → final spread. At ≥ 1024, the r1–r15 flipbook frames are additionally shown as a **contact sheet** strip in the lower margin: 8 thumbnails at 48 px.
  - **VI:** spread → closed book → colophon with the Point.

---

## 9. Tokens

### 9.1 Colour (contrast measured with the WCAG formula; the script is in the scratchpad at `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/xd-b/contrast.py`)

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--paper` | `#F4EFE6` | the sheet, cards | — |
| `--paper-shade` | `#E2DACB` | fold shade base, hover | ink 12.37 |
| `--paper-deep` | `#CFC4AE` | L7, boards | ink 9.95 |
| `--desk` | `#E6DFD2` | the surface under the sheet (light scheme) | ink 12.97 |
| `--desk-night` | `#1E1C19` | the desk under `prefers-color-scheme: dark` | paper 14.84 |
| `--ink` | `#1D1B18` | type, ink | paper 15.00 |
| `--ink-2` | `#55504A` | secondary text | paper 6.96 · desk 6.02 |
| `--ink-3` | `#6E685F` | tertiary text **on paper only**, leader dots | paper 4.81 · desk 4.16 (large text only on desk) |
| `--graphite` | `#9C958A` | hairlines, onion skin, borders; **never text** | paper 2.59 (decorative) |
| `--vermilion` | `#E2401F` | **the one accent**: the Point, creases, knife | paper 3.68 (non-text graphic ≥ 3:1 ✓) |
| `--vermilion-text` | `#B8300F` | only if red text is ever needed | paper 5.29 · desk 4.57 |
| `--paper-on-night` | `#EAE3D6` | chrome text on the night desk | night 13.32 |
| `--ink-2-night` | `#B9B1A3` | secondary text on the night desk | night 8.00 |
| `--shadow-sheet` | `0 1px 1px rgba(29,27,24,.10), 0 8px 24px -6px rgba(29,27,24,.22)` | the sheet on the desk | — |
| `--shadow-card` | `0 2px 4px rgba(29,27,24,.08), 0 12px 32px -8px rgba(29,27,24,.25)` | Contents panel | — |

**Accent rule.** Vermilion appears **only** as the Point and its family (creases, knife, current-row bullet, paused dot, the title's period, the marbling's red). It is never a background, never body text, and never more than about 4% of the frame's area. The one exception is Scene II's heart at about 6%.

**Night desk (`prefers-color-scheme: dark`).** *Quire.* is a paper piece and stays light where it matters: **the sheet, book and cards stay paper.** Only the **desk** turns to `--desk-night`, and the chrome and epigraph on it switch to `--paper-on-night` / `--ink-2-night`. At desktop sizes this cuts lit area by about 40%, which reads as reading under a lamp. There is no in-page theme toggle, because the OS preference governs.

### 9.2 Type

- `--font-book: "Iowan Old Style", "Charter", "Sitka Text", Cambria, Caladea, Georgia, "Liberation Serif", serif;` This one family carries everything. **No sans anywhere.**
  - **Verified here:** in this environment's Chromium the stack renders **Caladea**. Bitstream Charter is installed only as Type 1 (`.pfb`), which Chromium ignores. The probe is at `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/xd-b/fonts.js`: Caladea width 620.2 against the monospace fallback 809.2, while "Charter" fell through at 809.2. Evidence screenshots will therefore show Caladea, and macOS will show Iowan Old Style.
- **Numerals and features.** `font-variant-numeric: oldstyle-nums proportional-nums` in text and `lining-nums` in the progress labels. Small caps are faked as uppercase at 0.82 size with tracking 0.14em, never synthesized `small-caps`.
- **Display sizes (sheet-relative, via `container-type: inline-size` on the sheet and `cqi` units):** title 26u · *bleed* 18u · & 80%P · kicker 1.5u · subtitle 2.4u · folio 1.4u.
- **UI and reading sizes (rem, fixed scale):** 12 / 13 / 15 / 17 / 20 / 28 px.

| Role | Size | Line height | Weight / style | Measure |
|---|---|---|---|---|
| Chrome | 12–15 px | — | 400 / 700 | — |
| Epigraph | 17 px (15 px at 375) | 1.45 | 400 italic | ≤ 34ch |
| Colophon | 17 px | 1.5 | 400 | ≤ 38ch |
| Colophon heading | 13 px small caps | — | — | — |
| Display | — | 1.0 | 700 | — |

- **Optical rules.** Kicker tracking 0.18em. The display title's tracking is −0.01em. Hanging punctuation is used in the epigraphs, done manually with a −0.4em indent for an opening quote.

### 9.3 Motion

| Token | Value | Used for |
|---|---|---|
| `E_lift` | `cubic-bezier(.25,.6,.3,1)` | glyph lift and the Point's lift: fast start (first-response guarantee), long settle |
| `E_ink` | `cubic-bezier(.15,.75,.1,1)` | bloom growth: wet ink rushes, then slows on the fibres |
| `E_paper` | `cubic-bezier(.45,.05,.25,1)` | folds, page turns, the book closing: paper resists, then gives |
| `E_settle` | `cubic-bezier(.2,.9,.3,1.12)` | final landings (bounded overshoot ≤ 6%) |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | UI in |
| `--ease-inout` | `cubic-bezier(.45,0,.55,1)` | ambient envelope, corner hint |
| `--ease-recede` | `cubic-bezier(.4,0,.6,1)` | chrome fade in admire |

| Duration | ms |
|---|---|
| `--dur-press` | 90 |
| `--dur-hover` | 120 |
| `--dur-restore` | 160 |
| `--dur-ui` | 240 |
| `--dur-hint` | 450 + 450 |
| `--dur-recede` | 600 |
| `--dur-caption` | 500 (after a 400 delay) |
| `--dur-envelope-in` | 1500 |
| `--dur-envelope-out` | 240 |
| `--breath-period` | 8000 |
| `--idle` | 1200 |

The scroll easings are evaluated in JS as cubic-bezier functions so they can be unit-tested. CSS durations are only for UI chrome.

**Choreography rules.**
1. One protagonist moves at a time. Secondary elements move at most 30% as far.
2. Every movement is anchored to a physical cause: lift, gravity, fold, light.
3. Large planes rotate, but the camera never moves. There is no viewport zoom, and no layer travels more than 30u on screen.

### 9.4 Spacing and layout

- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px.
- **Gutters:** 16 px (375), 24 px (768), 32 px (≥ 1024).
- **Stage zones.** The desk is divided into a **head band** (48 px), the **plate area** where the sheet or book is centred, and a **lower margin band**. The epigraph, labels and caption live only in the margin band. **Nothing overlaps the plate except the Point.**
- **Corner radius.** 0 on paper, which is cut square. 2 px on focus rings. Pills are fully round.

---

## 10. Keyboard

- **Tab order:** Skip link → **Quire.** → **Contents** → **Hold still** → the active scene's `h2` (only when it was reached via Contents) → in Scene VI, **Back to the first page**.
- **Native scrolling, untouched:** Space, Shift+Space, PageUp/PageDown, Home/End and the arrow keys all scroll natively and leave admire mode.
- **No single-character shortcuts**, to stay clear of WCAG 2.1.4.
- **Contents panel:** Enter/Space opens it, and focus goes to the current row. ArrowUp/ArrowDown and Tab move through the rows. Enter follows a link. Escape closes it and returns focus to the button.
- **Inactive scene layers are `inert`**, so focus can never land on an invisible element.

---

## 11. Responsive behaviour

**Sheet sizing.** The sheet is landscape when the stage aspect is ≥ 1, and portrait otherwise.
- **Landscape:** `W = min(84vw, 0.68·100svh·√2, 1180px)`.
- **Portrait:** `W = min(88vw, 0.62·100svh/√2)`.

**Folds** always go across the longer dimension first. In portrait that means fold 1 is a `rotateX` and fold 2 a `rotateY`, mirroring the landscape order.

**The book in Scene V** is bound on the left in landscape. **In portrait it is bound at the top, like a notepad.** Leaves turn upward with `rotateX`, which keeps the pages large on a phone (the axis is a parameter, not a second implementation).

| Viewport | Sheet (Scene I) | Margin band | Chrome | Notes |
|---|---|---|---|---|
| **375 × 667** | portrait, W ≈ 292 px (0.62 · 667 / 1.414) | below the plate: epigraph 15 px, max 4 lines, 16 px gutters | head 44 px (no centre label); progress = horizontal bar; Contents is a full-width panel; pause pill bottom-right | The notepad book. The plate caption replaces the head while admiring. The title stays ≥ 70 px. |
| **768 × 1024** | portrait, W ≈ 449 px | below the plate, 2-column epigraph start | spine on the right; centre label on | Folds start with a horizontal crease. |
| **1024 × 768** | landscape, W ≈ 738 px | under the sheet, epigraph left-aligned to the sheet's left edge | full; spine hover labels | Short height: the margin band is 120 px minimum, the sheet shrinks to fit. |
| **1440 × 900** | landscape, W ≈ 865 px | as 1024 | full | Primary evidence viewport. |
| **1920 × 1080** | landscape, W ≈ 1039 px (≤ 1180 cap) | as 1024; epigraph ≤ 34ch | full; chrome text capped at 15 px | The desk shows generously; the night desk matters most here. |

At every width, `overflow-x: clip` (never `hidden`) is set on wrappers (intel principle 6). The layout works at 200% zoom: the chrome is rem-based and the plate is viewport-relative.

---

## 12. Grin moments

1. **The title leaves its dent** (I). The letters lift and a blind-debossed *Quire.* is left behind, made only of light.
2. **The drop gets wet before it falls** (I .70–.90). A specular glint appears, as anticipation.
3. **A word appears where ink refused to go** (II). *bleed*, in reserve, across a red heart.
4. **Upside-down page numbers turn themselves upright** (III). It is real octavo imposition.
5. **The tunnel is an ampersand** (IV). Seven nested &s, with the light sweeping and every shadow swinging.
6. **Scroll fast and it's a flipbook** (V). Squash and stretch, onion-skin ghosts, and *Every bounce was a smaller argument.*
7. **On a phone the book becomes a notepad** (V, portrait).
8. **The colophon waits for its full stop** (VI), and the Point arrives with a tiny squash to end the sentence, and the piece.
9. **Stopping turns the frame into a captioned plate** whose caption is *accurate*: "Quarto: folded twice."
10. **Contents riffles the book.** Jumping chapters scrubs everything in between at speed.
11. **The progress Point rides the spine**: the same red dot, everywhere.

---

## 13. Voice

The voice is that of a bookbinder: calm, precise, a little wry. Sentences are short and use real craft words (*folio, recto, deckle, impression*). Nothing is exclaimed, marketed or cute-for-cute's-sake. All strings are listed below and in §3 to §6, and no placeholder text exists.

| Slot | Copy |
|---|---|
| `<title>` | Quire. A book in six movements |
| meta description | One sheet of paper, pressed, inked, folded, cut and bound, as you scroll. Stop anywhere; every frame is a plate. |
| Kicker | A BOOK IN SIX MOVEMENTS |
| Subtitle | *One sheet, pressed, inked, folded, cut and bound.* |
| Scroll cue | Scroll to begin |
| Skip link | Skip to the colophon |
| Scene `h2`s | I · Impression · II · Bloom · III · Fold · IV · Tunnel · V · Flip · VI · Colophon |
| Stage `role="img"` labels | I: "The title Quire, its letters lifting off the paper and leaving a blind impression." · II: "A drop of ink blooming across the sheet, leaving the word bleed in clean paper." · III: "The inked sheet folding into a sixteen-page octavo." · IV: "Seven layered sheets cut with an ampersand, receding to a red dot." · V: "A small book whose pages flip to show a red dot bouncing to a stop." · VI: "The book closes and the red dot becomes the last full stop of the colophon." |

---

## 14. Accessibility and comfort guarantees

- **WCAG 2.2 AA throughout.** Contrast values are in §9.1. Visible focus. Landmarks: `header`, `nav`, `main`, `footer` (the colophon).
- **Text.** All text is real DOM text, legible the moment it is visible, and never per-letter animated. The only exception is the title glyphs in I, which are display type treated as image and duplicated in an `sr-only` heading `h1` "Quire."
- **Motion comfort.** There is no viewport zoom and no parallax of the whole page. The largest movements are planar rotations of paper about a visible axis, and under reduced motion they become stills (§8). Ambient amplitude is ≤ 3% translation and ≤ 1.2° rotation, and it can be paused.
- **WCAG 2.2.2.** The ambient motion has a visible pause control that stays visible during the motion, and the preference persists.
- **Assistive tech.** Admire mode announces politely and de-duplicates. Contents uses `aria-current`. The spine is `aria-hidden`. Inactive layers are `inert`.
- **Forced colours.** The chrome uses system colours (`CanvasText`, `Highlight` for focus). The scene art is left as is.

---

## 15. The polish list (each item is checkable)

1. The first paint (before JS) is the complete Scene I p=0 frame. A screenshot with JS disabled for 0 ms matches the JS-booted frame with < 0.5% pixel difference.
2. Splitting the title into glyphs preserves kerning (positions measured from a `Range`). The "Qu" pair spacing is identical before and after the split.
3. At p = 0.05 of Scene I, Q has risen ≥ 1.2u (≥ 10 px at 1440).
4. No glyph, label or plate edge is ever clipped by the viewport or the sheet edge. Glyphs reach opacity 0 before they reach the sheet's top margin.
5. The Point is the **same hue at every moment** (`#E2401F`) and is the only saturated colour on screen, apart from the marbling's red and the bloom heart.
6. The DOM Point to canvas heart handover at II p = 0.13 is invisible: pixel difference of the dot region < 2% between p 0.129 and 0.131.
7. *bleed* in reserve is clean paper even where it crosses the vermilion heart. There is no fringe and no anti-alias halo of ink inside the letters.
8. The tide line appears only as the sheen dries (II p .55–.85), and never on a wet frame.
9. The 7 satellite stains remain in place for the rest of Scene II and on the folded panel faces in III.
10. Fold panels show no z-fighting flicker and no hairline gaps along the folds at 1440 and 375 (checked at θ = 0°, 45°, 90°, 135° and 180° for each fold).
11. After the octavo fold, **every visible page number reads upright** (unit-tested from the composed transforms).
12. The folded object's on-screen height stays within ±8% of the original sheet height through all of Scene III.
13. The fold shade is darkest at θ = 90°, and the cast shadow narrows to nothing at θ = 180°.
14. The tunnel's nested &s share a pole: the Point is centred in L1's & stroke at every p of Scene IV.
15. When the light sweeps in IV, **all** layer shadows rotate together, with no layer lagging.
16. Page-turn strips show no visible seams (0.5 px overlap) at any curl angle.
17. At most two leaves are in the air at any p in Scene V.
18. Every recto shows the previous frame's onion-skin ghost at 25% `--graphite`, except r1.
19. The v16 line reads *and then it was still* with the Point as its full stop at V p = 1, and the screen-reader text includes the period.
20. In Scene VI the colophon's final sentence shows **no** visual full stop until the Point lands at p = 0.85 or later.
21. Epigraphs never overlap at a seam. The margin is briefly empty and then the new one fades in.
22. Admire mode enters at 1,200 ms ± one frame after the last input, and never before the first scroll.
23. On exit the chrome is visible within 160 ms and Tab lands on a visible control. The ambient envelope eases out over 240 ms, with no 1-px snap.
24. Space pressed during admire mode both exits admire mode and scrolls a page.
25. Hovering or clicking **Hold still** during admire mode does not exit it. The label changes to **Breathe again**, and the choice survives a reload.
26. The plate caption is accurate to the frame, e.g. "Quarto: folded twice." shows only for III p ∈ [.58, .66).
27. The Contents panel opens with focus on the current row, Escape returns focus to the button, and the current row carries the vermilion Point bullet and `aria-current`.
28. Contents jumps riffle through the scenes in between (smooth) and arrive with focus on the scene's `h2`. Under reduced motion they jump instantly.
29. Resizing from 1440 to 375 to 1440 at any stop returns to the same G and the same frame.
30. The corner-lift hint plays at most twice, never after any input, and never under reduced motion.
31. The night desk shows only around the sheet. The paper itself is never dimmed or inverted.
32. Buttons depress 1px over 90 ms and release over 120 ms. Hover shows a 1px underline at 3 px offset in 120 ms.

---

## 16. Anti-goals

*Quire.* must never feel like any of these:
- **A template "parallax site":** floating blobs, gradients, glassmorphism, neon or any dark-mode default. This is paper.
- **A demo reel.** If a seam ever cuts to a blank stage or a new object without a hand-off, that is a failure.
- **Scroll-jacked, smoothed or snapping.** The scroll belongs to the visitor.
- **Busy.** Two protagonists never move at once. The accent never spreads into the UI.
- **Cute.** No emoji, no exclamation marks, and no "Wow!" copy.
- **Fragile on stopping.** No frame looks half-loaded, mid-glitch or overlapping.
- **A text trap.** Reading never depends on scroll motion, and text never hides because the visitor paused to read it.

---

## 17. Acceptance by eye (what polish-critic should capture)

- **Every scene at p = 0, 0.25, 0.5, 0.75 and 1**, at **1440 × 900** and **375 × 667**: 60 frames. Each must be screenshot-worthy on its own.
- **The seams.** Each of the 5 boundaries at −1 px / +1 px, which must be visually identical.
- **Hero frames at 1920 × 1080:**
  - I p = 0.25: the double title.
  - II p = 0.5: *bleed* in reserve.
  - III p = 0.5: numbers righting themselves.
  - IV p = 0.5: the ampersand tunnel.
  - V p = 0.75: the standing leaf.
  - VI p = 1: the final full stop.
- **768 × 1024 and 1024 × 768:** III p = 0.5 and V p = 0.5, to check the portrait fold order and the notepad binding.
- **Admire mode:** before, 600 ms after entry (chrome gone, caption in) and 4 s in (light at a breath extreme), on III p = 0.62 at 1440. Also on night desk at 1920.
- **Reduced motion:** all 18 plates at 1440, plus one dip mid-crossfade (it should be a clean sheet).
- **No-JS text edition:** at 375 and 1440.
- **Contents panel** open with the current row, at 375 and 1440. **Focus rings** on every control.
- **20 random G values** (seeded) at 1440: none may show overlapping text, clipped elements or a broken fold.

---

## 18. Risks, stated honestly (with proposed fallbacks)

| Risk | Likelihood / impact | Mitigation / descope path |
|---|---|---|
| **Nested `preserve-3d` (III, V)**: backface or z-fighting bugs, especially in Safari, and raster cost on real GPUs | Medium / high | `translateZ(0.5px)` layer separation; explicit `backface-visibility:hidden` on each face. **Descope:** V's 6-strip curl falls back to flat leaves with a shade gradient (the curl is polish, not structure). |
| **System serif variance**: Caladea here, Iowan on macOS, Cambria on Windows. Different widths change the glyph layout and *bleed* | Certain / medium | Measure everything at runtime and size by `cqi`; set nothing in px from a specific font. Evidence will show Caladea, and the director should judge on that. |
| **Imposition bookkeeping** (which face shows which number, and its orientation) | Medium / medium | Derive it from the composed transforms in code and unit-test it (polish item 11). Do not hand-author it. |
| **Canvas cost of II at DPR 2 on a 1180 px sheet** (paint/raster not measured: technique.md:87) | Low-medium / medium | 6 × 256-point fills + 36 polylines ≈ well under 3 ms of script (extrapolated from E4). If raster is heavy, cap the canvas backing store at 1.5× DPR. |
| **The & pole computation and per-layer bitmaps** on resize | Low / low | Debounce the resize by 150 ms; the work is one-time per size. |
| **Scope.** Six scenes, each with a distinct technique, is a full mission | High / high | The order of cuts if needed: (1) the notepad binding (use left binding at all sizes) → (2) the strip curl → (3) the tunnel's light sweep → (4) marbling (use a plain `--paper-deep` endpaper). The five hand-offs and the Point are **non-negotiable**: they are the piece. |
| **Admire-mode exceptions** (pause control input does not exit) add logic and test cases | Low / low | One `isOnPauseControl(event)` guard; explicit e2e cases. |
| **Large-plane rotations** (folds, page turns, book closing) as main motion stretch intel principle 11 | Medium / medium | No camera move or zoom, perspective of 2400 px (gentle), and full replacement by stills under reduced motion. Director-vision should weigh this. |
| **Real-device svh/toolbar and touch momentum** cannot be verified here (technique.md:153) | Known / medium | The single stage is sized with `svh` and all lengths come from cached offsets, per intel. |

---

## 19. What I raised beyond the brief

- **Raise 1.** The persistent **Point** makes six scenes into one sentence, *beginning and ending with a full stop*.
- **Raise 2.** Admire mode does more than hide the chrome. It **turns the frame into an accurately captioned plate**.
- **Raise 3.** **One stage with the seam rule**: every boundary is pixel-identical, so the piece reads as one authored work.
- **Raise 4.** A **text edition** for no-JS, and a contact sheet for reduced motion, so every reader gets a finished book.
