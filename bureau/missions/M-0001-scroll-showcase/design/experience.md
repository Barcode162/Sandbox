# Experience spec: *Bent Light*
## M-0001 Scroll-driven animation showcase · consolidated final spec

Author: experience-designer (motion), the C designer · 2026-11-20
Status: **final, consolidated from the bake-off winner C ("Bent Light") with every fold-in F1–F17 and every cut/de-risk order D1–D10** from `board/bakeoff-experience.md`.
This document is the single source of truth for the architect, the engineers and the test-engineer. It stands alone: nothing here depends on the bake-off proposals.

Inputs: `brief.md`, `board/bakeoff-experience.md`, `intel/technique.md` (budgets; cited as **T-E1…E6**), `intel/references.md` (the 12 ranked principles; cited as **P1–P12**), `bureau/playbooks/interactive-web.md`.

Evidence produced for this consolidation (session scratchpad, re-runnable):
- `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/xd-c-final/verify_maths.py` checks every hold band (F3), the 40 px hook (F10), the Scene 2 luminance profile and step lengths (D4), the tick spacing (D7) and the dark-wall token (D9). Its output is quoted in Appendix A.
- `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/xd-c-font/m.js` and `m4.js` measure font metrics in the bundled Chromium (F11, D10). The output is in Appendix B.
- The director's probe screenshot `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/bakeoff/C3-screen.png`. I viewed it and confirm D3: at the old channel scales, the rim fringes read as faint coloured edges on single dots, not as separate R, G and B dots.

---

## 0. Traceability: every bake-off order and where this spec satisfies it

| Item | Order (short) | Satisfied in | How |
|---|---|---|---|
| **F1** | Admire placard at 3,000 ms, scene + `held at N%` | §7.4, §8 (placard row), polish 31 | Fades in over 900 ms in the caption slot. Under reduced motion it uses the opacity fade only. |
| **F2** | Frame-accurate `placardPhrase(scene, p)`, unit-tested | §7.5 (full phrase table), §12, §15 U-6 | Per-scene p-bands, written in this piece's voice. Every boundary is unit-tested. |
| **F3** | One signature hold band per scene, ≤ 25% rate | §3.3 (rule), every scene table in §4, Appendix A | Bands verified numerically: worst in-band rate is 0.099–0.208 of the average, against a limit of 0.25. Replaces the old "every 5% must change" rule. |
| **F4** | Endpoint contract table | §15.2 | `state(0)` and `state(1)` assertions per scene, plus global assertions, with numbers. |
| **F5** | State-level seam gate, pixel diff as evidence | §5.2, §15.3 | `snapshot()` equality of shared geometry is the gate. The pixel diff (≤ 0.5% at > 8/255) is a tolerance test plus evidence. |
| **F6** | Admire exit keeps the default action; synchronous restore; pause-control guard | §7.6, polish 33–35, §15 E-A6…A9 | Space exits and scrolls. Visibility is restored inside the keydown handler. `isOnPauseControl` guard. |
| **F7** | De-duplicated admire announcements with scene name | §7.7, polish 36 | Key = `scene|phraseBand`. Silent when the key equals the last one announced. |
| **F8** | Resize 1440 → 375 → 1440 keeps G and frame | §11.2, polish 37, §15 E-R2 | The engine stores `G_anchor` and restores `scrollY = round(G_anchor·D′)`. The round trip is exact. |
| **F9** | `window.__showcase.errors` ledger | §8.3, §15.1, §15 E-H1 | Every caught error is pushed. The full scroll-through asserts `[]` plus zero console errors. |
| **F10** | Visible first-scroll response by 40 px | §6, §4 Scene 1, polish 40 | Re-derived maths: at 40 px the far edge grows 87 → 155 px and the plates split by 3.1 px (Appendix A). The old curve gave 0.16° at 100 px, so this was a real bug, now fixed. |
| **F11** | `font-display: swap` plus a metric-matched fallback, CLS ≤ 0.01 | §13.2, polish 28 | Measured `size-adjust` and ascent/descent overrides per weight (Appendix B). |
| **F12** | Claim integrity in the copy | §12.2 | The font sentence is gated on the font loading. The breathing, no-JS and reduced-motion claims all have true variants. |
| **F13** | No admire mode in the colophon | §7.2, §15 E-A10 | Blocked when `scrollY > D`. |
| **F14** | Reduced-motion test hook | §10.4, §15 E-M1/M2 | `document.getAnimations()` holds no DocumentTimeline animations at rest, and `snapshot()` is constant across each still range. |
| **F15** | JS-off first paint ≈ booted p = 0, < 0.5% | §6, polish 1 | Numeric threshold; the noscript banner's box is masked. |
| **F16** | One persistent thread: the white point | §3.4, §4 (Scenes 1–4), §8 (rail), polish 41 | One small white element: the beam's entry glint (S1), the centre dot (S2–S3), the light source at θ (S4), and the rail's leading dot. |
| **F17** | Contact sheet under reduced motion (should) | §10.4, cut item 5 | **Adopted** for Scene 4 at ≥ 1024 px. Declined for Scene 2 (reason in §10.4). |
| **D1** | Seam fallback pre-approved, fallback only | §5.3 | ≤ 3% p opacity crossfade, at most one fix round. |
| **D2** | Scene 4 DPR ≤ 1.5 at ≥ 1440, spike first, OKLCH LUT | §4 Scene 4 (technique), §13.6, §16 | Ordered fallbacks; the 256-entry LUT; the pitch fallback keeps lattice = 2 × dot pitch. |
| **D3** | Scene 3 must read as dispersion | §4 Scene 3 | Channel scales 1.25 / 1.40 / 1.55; inner dots r 2.75 px base (3.4–4.3 px rendered) at 100% opacity, against 55% outside; bounding-box clip; double refraction is cut item 1. Testable spread criterion in polish 6. |
| **D4** | Scene 2: shorten and reconcile the photosensitivity arithmetic | §4 Scene 2, §10.1 rule 3, Appendix A | Trimmed 360 → **300 svh**. The rule is restated truthfully: each field change *moves* over ≥ 32.8 svh, and safety rests on a single luminance hill with ≤ 2 reversals, proven by the audit. Adopted the director's tone-on-tone dot idea as a cheap foreshadow (cut item 6). |
| **D5** | Descope order | §16 | Binding order 1–4, then my additions 5–7, then the non-negotiables. |
| **D6** | Flash audit as a real gate, including the fastest tick navigation | §10.1 rule 6, §15 E-F1…F4 | Runs in `npm run verify`. Positions are recorded, then replayed, so it is deterministic. |
| **D7** | 44 × 44 tick hit targets on every pointer | §8 (ticks), polish 42 | Minimum tick spacing is 48.4 px at the smallest rail, so 44 px targets never overlap (Appendix A). |
| **D8** | No empty caption corner in admire mode | §7.4, polish 32 | The caption stays until the placard replaces it at 3,000 ms (staggered crossfade). |
| **D9** | Darker wall under OS dark mode (taste) | §13.1 | **Adopted:** `--wall` Y 0.90 → 0.85 (−5.6%) under `prefers-color-scheme: dark`. The colophon continuity is kept. |
| **D10** | Verify the font dependency | §13.2, Appendix B | `@fontsource-variable/space-grotesk@5.3.0` (OFL-1.1) packed and inspected here: the Latin woff2 is **22,288 B**. The architect still owns the decision. Both modes are specified. |

---

## 1. North star

**Stop the scroll at any point and the screen is a hard-edged colour painting that tells you where the white light is in its journey. Every colour in that painting adds back up to white by the end.**

## 2. The piece, and its references (craft only, never content)

**Title: *Bent Light*. Subtitle: "Six refractions of one white beam."**
The piece follows the structure of Newton's *experimentum crucis*. White light hits a prism and splits. Its colours become places you stand in, then glass bends them, then a turning surface tints them. Finally they recombine into the white you started with.
The ground is the artwork. For most of the scroll the whole viewport is a saturated, hard-edged colour field, not a dark page with coloured things on it. The look is a light installation in a white-walled gallery: geometric, saturated and exact. It has no glow soup, no decorative particles and no noise.

| Reference | The specific craft we take |
|---|---|
| Isaac Newton, *Opticks* (1704): the *experimentum crucis*, then recombination with a second prism | **Structure.** Split, isolate, recombine. The six scenes follow that three-act shape, so the piece is an argument, not a reel. |
| James Turrell, *Ganzfeld* rooms | **Holds.** A field large enough to lose its edges reads as space, not paint. Scene 2's plateaus and its signature "azure room" hold. |
| Ellsworth Kelly, *Spectrum* panels (1953 onward) | **Composition.** Equal-height bands in spectral order, hard edges, no gradients inside a band. Every Scene 2 and Scene 5 stop must read as a hard-edge panel painting. |
| Olafur Eliasson, dichroic-glass works | **Angle-dependent colour.** Hue is a function of light angle against facet normal. Scene 4 implements this literally. |
| Josef Albers, *Interaction of Color* | **Adjacency discipline.** Adjacent spectrum tokens differ by ≥ 0.05 relative luminance (Y). Hue walks are monotonic. |
| Print registration (CMY plates out of register) | **Type as image.** The title is three subtractive plates that multiply to exact black in register and split into fringes as you scroll. |

**Originality guard.** No frame may reproduce the famous album-cover composition: a triangle on black, an angled beam in and a rainbow out. Our prism only ever sits on the pale wall, the beam is horizontal (vertical in portrait), and the prism never appears on a dark ground. Director-vision checks the Scene 1 frames at Gate 2.

---

## 3. Global model

### 3.1 The arc and tempo

| # | Scene (anchor id) | Track | Tempo | Ground | Technique | Signature hold band | Hands off to next |
|---|---|---|---|---|---|---|---|
| 1 | **Incidence** (`#incidence`) | 220 svh | calm → rising | gallery wall `--wall` | inline SVG: prism, beam, 7 wedge quads with lerped vertices; CMY title (3 HTML copies) | p 0.45–0.60 "The full fan" | **7 full-bleed spectrum bands** |
| 2 | **Field** (`#field`) | **300 svh** (D4; was 360) | slow, the long rest | the bands themselves | 7 DOM divs (`translateX` + `scaleX`) from a width accordion; group `skewX`; tone-on-tone dot grid | p 0.722–0.781 "Azure room" | **full cobalt field + white dot grid + centre dot** |
| 3 | **Refraction** (`#refraction`) | 260 svh | medium, playful | `--cobalt` + dot grid | SVG: dot `<pattern>`, 3 glass shapes as `clipPath`s, 3 channel copies per shape (`screen`), per-channel magnification | p 0.42–0.58 "Crossing" | **three glass shapes on a shelf over the dots** |
| 4 | **Dichroic** (`#dichroic`) · peak | 320 svh | dense, the peak | cobalt → mosaic | Canvas 2D: a lattice built from the dots, seeded jitter, per-facet normal, a sweeping light angle mapped to hue through a LUT | p 0.44–0.56 "Light overhead" | **7 full-bleed bands again** (the chorus) |
| 5 | **Agreement** (`#agreement`) · climax | 220 svh | tension → click | bands → `--ink` room | 7 DOM divs (`scaleX`, `translateX`), `mix-blend-mode: screen`, one white overlay div | p 0.25–0.40 "Colonnade" | **one white beam on ink** |
| 6 | **Return** (`#return`) · release | 180 svh | release → rest | ink → `--wall` | the Scene 1 SVG module in "redraw" mode | p 0.40–0.52 "The empty wall" (the only static band) | ends on a rhyme of the opening; the normal-flow **colophon** follows (70 svh) |

The tracks total **1,500 svh**, plus 70 svh of colophon: about 16 viewports, 2–3 minutes at a reading pace or 20 s on a fling.
The spectrum appears as **seven full-bleed bands three times**: born (end of 1), crystallised (end of 4) and reunited (5 → 6). This chorus, plus the white point (§3.4), makes six scenes one piece (P4).

Scene start offsets, in svh: S1 0 · S2 220 · S3 520 · S4 780 · S5 1100 · S6 1320 · end 1500.
At 1440×900 (1 svh = 9 px) these are 0 · 1,980 · 4,680 · 7,020 · 9,900 · 11,880 · 13,500 px.

### 3.2 Stage and progress contract (the architect chooses the means; these are requirements)

- **Pinned distance.** `L_s = track_s × svh` in px, cached on load and resize, never from `dvh` (T-E5). `D = Σ L_s`. Scene s spans scroll `[Y_s, Y_s + L_s)`, with `Y_1 = 0`.
- **Local progress:** `p_s = clamp((scrollY − Y_s) / L_s, 0, 1)`. **Global progress:** `G = clamp(scrollY / D, 0, 1)`.
- **The stage is pinned** (its bounding top = 0) for every `scrollY ∈ [0, D]`. Scene 6 reaches p = 1 exactly at `scrollY = D`, and only then does the stage release with the colophon rising beneath it. The architect must size the sticky container so this holds; the naive "tracks column with `margin-top: −100svh`" unpins the stage 100 svh too early unless the container is `D + 100svh` tall.
- **Visibility.** Only the active scene layer is visible and runs `apply()`; the others are `visibility: hidden`. Every wrapper uses `overflow: clip`, never `hidden` (P4).
- **Identity seams.** For every boundary, `frame(N, 1)` equals `frame(N+1, 0)`, so switching the active layer is invisible (§5).
- **One geometry, rotated frame.** All scenes compute in an abstract frame where *u* runs along the long axis and *v* across it, with U and V their lengths in px. Landscape (`vw/svh ≥ 1`) maps u → x and v → y. Portrait maps u → y and v → x. So in portrait the bands are horizontal rows stacked top to bottom, the beam enters from the top, and glass travels bottom → top. **The rule: the spectrum always lies along the long axis.**
- **Purity.** `state(p, viewport)` is a pure function: no clock, no smoothing, no `Math.random()`. All randomness is mulberry32 with seed `0xB3E7`. Time exists only in the ambient (breathing) layer, applied as `apply(state(p), ambient(t)·a)`.

### 3.3 Hold bands and "never dead" (F3; replaces the old "every 5% must change" rule)

Each scene exports, inside its state object, a `params` record of its **driving parameters**: the named inputs listed under "Parameters" in §4, not derived geometry. The rules below are stated on those parameters. TV_k is the total variation of parameter k over p ∈ [0, 1], sampled at Δp = 1/4000.

1. **Hold rule.** Inside the scene's signature hold band [a, b], every driving parameter with TV_k > 0 satisfies `max |Δx_k / Δp| ≤ 0.25 · TV_k`. In words, all state changes at ≤ 25% of its own average rate.
2. **Creep (never dead).** Each hold band except Scene 6's names one **creep** parameter that keeps moving perceptibly across the band (Scene 1: spread +1.5°; Scene 2: cursor +0.06; Scene 3: triangle −1.0% U; Scene 4: θ +3.5°; Scene 5: τ +0.035). Scene 6's band is C's designed rest after the peak, static by intent, and ≤ 22 svh long.
3. **Band length.** Each hold band is ≤ 45 svh (≈ 400 px at 900 tall), so a hold never reads as a broken page (P3).
4. **Outside the band.** Excluding the hold band and a terminal settle of ≤ 4% of track, no window of 2% of track has every driving parameter constant (|Δ| < 1e-6).

Appendix A shows all six bands pass rule 1, with worst-case in-band rates of 0.185, 0.204, 0.099, 0.208, 0.203 and 0.000.

### 3.4 The thread: the white point (F16)

One small white element is findable all the way through. It is not a second protagonist, only a single mark of where the white light is.

| Where | What the white point is | Spec |
|---|---|---|
| Scene 1 (and 6 at the end) | the beam's **entry glint** on the prism's left face | 3 px disc, `--beam`, with a 1 px ring of `--wall-deep`. Opacity follows `prismOpacity`. |
| Scene 2 | the **centre dot** at the stage centre (u = 50%, v = 50%), above the bands and unaffected by the shear | r 3 px, `--beam` at 100%, with a 1 px ring of `--ink` at 25% so it reads on saffron. Opacity `r(p, 0.02, 0.10)`. At p = 1 it is the dot grid's centre dot (the grid is aligned so a dot falls exactly on the stage centre). |
| Scene 3 | the same centre dot | It stays white even inside glass: magnification is about each shape's centre, and at the shelf the circle sits centred on it, so the point stays white on the optical axis. |
| Scene 4 | the **light source** | A 4 px white point at radius `ρ = 38 vmin · glide(r(p, 0, 0.10))` from the stage centre, at angle θ(p) (the same θ that lights the facets). Opacity `1 − r(p, 0.88, 0.96)`. |
| Scene 5 → 6 | the white beam itself | (no extra element) |
| Chrome | the **rail's leading dot** | A 6 px `--beam` disc with a 1 px `--ink` ring at 40%, riding the rail at G. |

### 3.5 Notation used in §4

p is the scene's local progress. Coordinates are for the **1440×900 reference** (landscape). `vmin` = min(vw, svh).
- Remap: `r(p, a, b) = clamp((p − a) / (b − a), 0, 1)`.
- Position curves (pure on [0, 1], with f(0) = 0 and f(1) = 1; unit-tested):
  - `smooth` = smoothstep;
  - `glide` = easeInOutCubic (peak slope 3× average);
  - `settle` = easeOutCubic;
  - `lead` = easeOutQuad (new: an early-responsive curve for the hook);
  - `lin` = identity.
- `keys(p, [(p0, v0), (p1, v1, ease?) …])` interpolates between consecutive keys with that segment's ease (default `glide`), holds the first value before p0 and the last after the final key.

These are **position curves, not time**. Overshoot exists only as a position keyframe, never as a spring.

---

## 4. The scenes, frame by frame

Every scene lists its elements, its driving parameters (the `params` record), and a frame table at p = 0, 0.25, 0.5, 0.75 and 1, with **why every stop is composed**. That argument covers the in-betweens, not only the sample points.

### Scene 1 · Incidence (220 svh)
*Caption: "White light is every colour, waiting for an angle."*

**Elements**
- **Wall.** `--wall` with a static radial "gallery spot": centred on the prism, `--wall` at 0% falling to `--wall-deep` at 120 vmin.
- **Prism.** An equilateral triangle, side 34 vmin (capped at 400 px at 1920), apex up, centroid at (u 36%, v 52%). Fill is a vertical glass gradient (`--glass-hi` → `--glass-lo`). It has a 1.5 px `--glass-edge` stroke, a 1 px `--fringe-c` line inside the left face and a `--fringe-m` line inside the right face, both with `vector-effect: non-scaling-stroke`.
- **Beam.** A 2 px `--beam` hairline from u = 0 at v 54% to the left face, with a 1 px `--wall-deep` line 1 px below it so white reads on white. The **entry glint** (§3.4) sits where it meets the glass.
- **Wedges.** Seven quads. Each has 2 near vertices on the right face (spaced 2 px apart along the face) and 2 far vertices on the wall at u = 100%. The fan's angular range is split into 7 equal sectors; wedge 0 (top) is vermilion and wedge 6 (bottom) is violet. Fill is the band token at 92% opacity, with a linear lift to 100% at the far end.
- **Title.** "Bent Light" as an `<h1>` plus 3 `aria-hidden` plate copies (`--plate-c`, `--plate-m`, `--plate-y`, `mix-blend-mode: multiply`), bottom-left at the gutter. The subtitle sits below it and the scroll cue at the bottom centre.

**Parameters**
- `rot = 22° · settle(r(p, 0, 0.50))` (prism rotation)
- `spread = 6° + 52.5° · lead(r(p, 0, 0.45)) + 1.5° · r(p, 0.45, 0.60)`, constant at 60° after p 0.60 (**creep: +1.5° across the hold**)
- `split = 14 px · settle(r(p, 0, 0.25))`. Cyan moves up-left, magenta right, yellow down, each by `split`.
- `titleOpacity = 1 − r(p, 0.22, 0.40)`; `cueOpacity = 1 − r(p, 0, 0.06)`
- `straighten s = glide(r(p, 0.60, 1))`
- `prismOpacity = 1 − r(p, 0.72, 0.90)` (also drives the beam hairline and glint); `prismShift = −18% U · r(p, 0.72, 0.90)`

**Straightening is an orientation-preserving vertex lerp** (new; this replaces an under-specified lerp that would have made wedges overlap mid-morph). Let `u_i = i/7 · U`. Each wedge's vertices lerp by s toward column i's rectangle like this:
- near-top → (u_i, V), the bottom-left corner;
- near-bottom → (u_{i+1}, V), the bottom-right corner;
- far-top → (u_i, 0), the top-left corner;
- far-bottom → (u_{i+1}, 0), the top-right corner.

Adjacent wedges share vertices in both embeddings, so they stay gapless and never overlap at any s. Mid-morph they read as seven slanted shafts rising from a floor line.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | A warm white wall, softly spotlit. The glass prism sits left of centre, with a hairline beam reaching it from the left edge and a white glint where it enters. On the right, a small exact spectrum card about 87 px tall (spread 6°) lands on the wall, with its seven bands crisp. Bottom-left: **Bent Light** in solid black (the plates are in register), with the subtitle below. The cue sits at the bottom centre. | A gallery wall with one object and its effect. Thirds: prism on the left third, spectrum on the right edge, title anchoring the bottom-left. It is finished art with nothing waiting to animate (P12). |
| **0.25** | The prism has turned about 20°. The fan has opened to about 49° and covers the right half of the wall as a widening wedge of colour. The title is out of register: cyan, magenta and yellow ghosts are offset by 14 px, with black only where all three overlap, at 83% opacity. | A diagonal composition from the prism (left-centre) to the right edge. The misregistered title is a deliberate print artefact, not a glitch. |
| **0.5** (hold) | **Signature: "The full fan."** The prism is at 21.9°. The fan spans the right wall from corner to corner (59°), so about 55% of the viewport is pure spectrum. The title has gone. | A single strong gesture: seven hard-edged rays from one source. The wall survives top-left and bottom-left as two calm triangles. |
| **0.75** | The prism is fading (83%) and sliding left. The rays have begun to lift (s = 0.21): their near ends slide down toward the floor line, so the fan leans like shafts rising from the bottom edge. | One gesture, rotating: the fan is visibly turning into an upright arrangement, and the vanishing source implies the prism as it leaves. |
| **1** | Seven equal vertical bands, full bleed: vermilion, tangerine, saffron, jade, azure, cobalt, violet. No wall, no prism. | A Kelly-style spectrum panel. **Identity seam** with Scene 2 at p = 0. |

**First-scroll response (F10).** At 40 px of scroll at 1440×900 (p = 0.0202):
- spread is 10.6° (the far edge grows from 87 px to 155 px);
- the plates are split by 3.1 px;
- the prism has turned 2.6°.

At 375×812, 40 px is p = 0.0224, giving +5.1° of spread and 3.4 px of split. See Appendix A.

### Scene 2 · Field (300 svh)
*Caption: "Stand inside a colour long enough and it becomes the room."*

**Elements**
- **Seven band divs**, each with `--band-i` as its background and no gradients. They sit in a group that is sheared and overscanned to 140% so no edge ever shows ground.
- **Dot grid** (the shared `DotGrid` component) in two disjoint subsets.
  - **Vertex dots** are every other dot in both axes, so their pitch is 2 × the dot pitch. These become Scene 4's lattice vertices.
  - **Fill dots** are all the others.
  - Dot r = 2.5 px. The dot pitch is per viewport (§11): 32 px at 1440. The grid is aligned so one dot sits exactly on the stage centre.
  - Each subset is drawn twice: an **ink tone** (`--ink`) and a **white tone** (`--beam`).
- **The centre dot / white point** (§3.4).

**Parameters**
- `A = smooth(r(p, 0, 0.10))` (accordion amplitude)
- **Dominance cursor `c(p)`** walks 0 → 5 (vermilion → cobalt) in 5 steps of width 0.168, starting at p 0.05 and ending at p 0.89. Within step k, with local t ∈ [0, 1]:
  - if t < 0.35: `c = k + 0.06 · t / 0.35` (the plateau creep);
  - otherwise: `c = k + 0.06 + 0.94 · smooth((t − 0.35) / 0.65)`.

  In track terms, each step is 50.4 svh: 17.6 svh of plateau and **32.8 svh of moving change**.
- **Width weights:** `w_i = 1 + 11 · A · exp(−((i − c) / 0.6)²)`. Then multiply every band except cobalt (i = 5) by `fade = 1 − smooth(r(p, 0.86, 0.97))`, and normalise to 100% of U. The dominant band peaks at 63% of U.
- `shear = −18° · smooth(r(p, 0, 0.15)) · (1 − smooth(r(p, 0.80, 0.95)))`
- **Dot tones** (opacities):
  - `vertexInk = 0.08 · r(p, 0.45, 0.70) · (1 − r(p, 0.90, 1))`
  - `fillInk = 0.08 · r(p, 0.80, 0.90) · (1 − r(p, 0.90, 1))`
  - `white = 0.55 · r(p, 0.90, 1)` (both subsets)
- `whitePoint = r(p, 0.02, 0.10)`

The tone-on-tone dots are the director's D4 idea, adopted. A faint shadow of the lattice appears first; then the in-between dots fill in, so the grid visibly densifies toward the end. It foreshadows Scenes 3–4 and gives the scene's long middle a second technique. It is cut item 6.

| p | Frame | Why it is composed |
|---|---|---|
| **0** | Seven equal vertical bands, identical to Scene 1 at p = 1. | Identity seam; a Kelly panel. |
| **0.25** (c = 1.03) | All bands are sheared −18°. Tangerine dominates at about 62% of the width. Vermilion is a narrow slanted stripe on its left; saffron, jade, azure, cobalt and violet are thin slanted stripes stacked on its right. The white point sits at the centre. | A hard-edge diagonal painting: one dominant field and a rhythm of thin stripes. Every plateau frame is a still life of one colour, with one point of white. |
| **0.5** (c = 2.54) | Mid-step between saffron and jade. The two share about 75% of the width, split by one clean diagonal edge. The thin stripes are pushed to both margins. A barely visible lattice of ink dots (8%) has appeared over everything. | The canvas is cut in two by one diagonal: the most classic hard-edge composition there is. |
| **0.75** (hold) | **Signature: "Azure room."** The viewport is almost entirely azure. Cobalt and violet are narrow slanted stripes at the right edge, and the warm colours are hairline stripes at the left. The ink lattice is a faint texture. | A Ganzfeld: one colour as the room, with the rest of the spectrum kept as a margin "memory". |
| **1** | The shear is gone. The whole viewport is cobalt with a quiet white dot grid at 55%, and the centre dot is white at 100%. | A minimal grid painting. **Identity seam** with Scene 3 at p = 0. |

**Luminance profile** (computed from the area model, unsheared; Appendix A): mean Y goes 0.32 (p 0) → 0.27 (p 0.10) → 0.48 (p 0.42) → 0.12 (p 1).
- That is **two direction reversals**, and the first dip is only 0.05, below the 0.10 flash threshold.
- The per-step change in mean Y is at most 0.13.
- Vermilion's maximum share is 63% (below the 70% cap).

### Scene 3 · Refraction (260 svh)
*Caption: "Glass slows light down, and every colour disagrees about by how much."*

**Elements**
- **Ground.** Cobalt plus the dot grid, unchanged from Scene 2 p = 1.
- **Three glass shapes:**
  - a **triangle** (side 30 vmin) with one vertex pointing toward −u (the direction of travel);
  - a **circle** (Ø 26 vmin);
  - a **diamond** (a square rotated 45°, side 21 vmin).
- **Refraction (D3).** Each shape is a `clipPath` containing three copies of an *inner* dot pattern (same pitch and origin as the ground grid, base r **2.75 px**, **100%** opacity), tinted `--ch-r`, `--ch-g` and `--ch-b`, blended with `screen`, and scaled about the shape centre by **1.25 / 1.40 / 1.55**.
  - Rendered inner dots are 3.4 / 3.85 / 4.3 px, against 2.5 px at 55% outside.
  - A dot at source distance s from the centre separates into R, G and B images 0.15·s apart. They stay a single white dot at the centre and become **separate** R, G and B dots (gap > dot diameter) beyond s ≈ 51 px, so the outer ~40% of each shape shows countable dispersion.
  - Each pattern copy's `<rect>` is sized to the **shape's bounding box**, not the viewport.
- **Glass body.** A `--glass-hi` → `--glass-lo` gradient, a 1.5 px `--glass-edge` stroke that covers the clip boundary, and a 1 px `--fringe-c` highlight along the upper-left edge.
- **Double refraction (cut item 1).** Where the triangle and circle overlap, a nested clip applies a further ×1.40 to that region's copies. If it is cut, the circle (drawn above) simply wins the overlap.
- **The white point** at the centre (§3.4).

**Parameters.** u values are % of U. All shapes sit at v = 50%. Landscape travel is right → left.
- `tri = keys(p, [(0, 110), (0.42, 43), (0.58, 42, lin), (0.88, 23.8)])`, then `keys(p, [(0.88, 23.8), (0.96, 25, smooth)])` (**creep: −1.0% U across the hold**; overshoot 1.2% U)
- `cir = keys(p, [(0.12, 112), (0.42, 53), (0.58, 52, lin), (0.90, 49.4)])`, then `[(0.90, 49.4), (0.97, 50, smooth)]` (overshoot 0.6% U)
- `dia = keys(p, [(0.58, 130), (0.92, 73.5)])`, then `[(0.92, 73.5), (0.98, 75, smooth)]` (overshoot 1.5% U, the cap)
- **Rotation:** triangle `8° · (1 − f)`; diamond `−8° · (1 − f)`, where f is that shape's travel fraction (u₀ − u)/(u₀ − u_shelf), clamped to [0, 1]. Shapes are canonical (0°) on the shelf. The circle does not rotate.

At p = 0 only about 6% of the triangle's extent is on screen: its tip intrudes at the right edge. The circle and diamond are fully off-screen. (The original 64% start contradicted its own frame description; this corrects it.)

| p | Frame | Why it is composed |
|---|---|---|
| **0** | Cobalt and dots. The triangle's tip has just entered at the right edge, pointing inward. | A grid painting with one sharp intrusion pointing inward: tension and direction. |
| **0.25** | The triangle is just right of centre (u 61%). Through it the dots are magnified, and the rim dots split into red, green and blue. The circle's left edge is entering at the right (u 93%). | One object centred on its own magnified world, answered by the arriving circle. |
| **0.5** (hold) | **Signature: "Crossing."** The circle (u 52.5%) overlaps the triangle's right half (u 42.5%). In the lens-shaped overlap the dots are doubly magnified and the triplets spread wide, like tiny spectra. The pair creeps left by under 1% U across the hold. | The peak of the scene: two simple solids make a third shape, and the eye goes straight to the overlap. |
| **0.75** | The triangle sits on the left third (u 32%) and the circle at the centre, now separated. The diamond's left tip is entering at the right (u 102%). | Three-beat rhythm: two objects placed and one arriving. A gallery-hang composition. |
| **1** | The "shelf": triangle, circle and diamond at 25%, 50% and 75%, each a clean window of refracted dots. The white point sits at the circle's centre, perfectly white. | Symmetrical and still, like three glass objects on a plinth. **Identity seam** with Scene 4 at p = 0. |

### Scene 4 · Dichroic (320 svh) · the peak
*Caption: "Turn the surface, and the colour turns with it."*

**Technique (D2)**
- **Canvas.** One full-stage `<canvas>`. Backing DPR = `min(devicePixelRatio, vw ≥ 1440 ? 1.5 : 2)`.
- **Lattice.** Pitch = 2 × the dot pitch (48 / 48 / 56 / 64 / 72 px across the five viewports). The vertices are exactly Scene 2–3's **vertex dots**. Each lattice square is split into two triangles along its "\" diagonal: about 300–950 facets, drawn as filled paths with a 0.5 px same-colour stroke so shared edges never seam.
- **Jitter.** Seeded jitter (mulberry32, seed `0xB3E7`) of `±14 px · J` per vertex, in a fixed draw order.
- **Normals.** Each facet has a seeded normal tilt `n` with |n| ≤ 0.6, scaled by J.
- **Colour through a LUT** (computed once, never per facet per frame). Index the 256-entry sRGB LUT by `n·L` quantised over [−0.6, 0.6]. Each entry is OKLCH `h = 255° + 150°·(n·L)`, `L = clamp(0.50 + 0.28·(n·L), 0.32, 0.82)`, `C = 0.17`, converted to 8-bit sRGB. No facet's hue range exceeds 180° across the scene.
- **Light direction.** `L = (cos θ, sin θ)` in the (u, v) frame with v pointing down, so θ = 270° is overhead.
- **Draw cadence.** Redraw only when p or the ambient value changes, and only while Scene 4 is the active layer.

**Parameters**
- `J = glide(r(p, 0.08, 0.35)) · (1 − glide(r(p, 0.80, 0.96)))`
- `θ = keys(p, [(0.10, 200°), (0.44, 268.25°), (0.56, 271.75°, lin), (0.90, 340°)])` (**creep: +3.5° across the hold**)
- `facetAlpha = glide(r(p, 0.08, 0.38))`
- `edgeAlpha = 0.45 · r(p, 0.04, 0.12) · (1 − r(p, 0.80, 0.92))` (1 px white edges)
- `quant = r(p, 0.80, 0.96)`. Each facet's colour lerps, in 8-bit sRGB, from its LUT colour to the band token its centroid falls in.
- `bandsAlpha = r(p, 0.92, 1)`. Inside the canvas (globalAlpha), seven exact straight bands from the shared `Bands` geometry are drawn over the mosaic.
- `glassAlpha = 1 − r(p, 0, 0.15)` (the Scene 3 shelf, drawn on the canvas at the start)
- `fillDots = 0.55 · (1 − r(p, 0, 0.10))`; `vertexDots = 0.55 · (1 − r(p, 0.10, 0.30))`
- White point: `ρ = glide(r(p, 0, 0.10))` (× 38 vmin), angle θ, alpha `1 − r(p, 0.88, 0.96)`

| p | Frame | Why it is composed |
|---|---|---|
| **0** | The shelf of glass shapes over the dots, identical to Scene 3 at p = 1. | Identity seam. |
| **0.25** | The shapes have gone. The vertex dots are joined into a faintly jittered lattice, with facets about 64% filled in cool blues and teals, brightest upper-left, where the white point (the light) sits. | A crystal surface catching low light from one corner: one diagonal value gradient, so it is easy to read. |
| **0.5** (hold) | **Signature: "Light overhead."** Full mosaic, with the light at the top centre. The dichroic range is wide: magenta, gold and teal facets, a bright ridge running diagonally across the frame, and cobalt showing in the shadowed facets. | The peak: stained glass under a moving sun. It is dense, but structured by the single ridge and the lattice. |
| **0.75** | The light has moved right (θ ≈ 312°). The right half glows gold and vermilion, the left half falls to violet and cobalt, and the lattice jitter starts to relax. | A warm–cool split on the vertical axis, the strongest colour contrast in the piece, and still one gesture. |
| **1** | The lattice has gone flat and silent: seven exact full-bleed spectrum bands. | The chorus returns: the crystal "remembers" its spectrum. **Identity seam** with Scene 5 at p = 0. |

### Scene 5 · Agreement (220 svh) · the climax
*Caption: "Put every colour back together and they agree on white."*

**Elements**
- An **ink room** (`--ink`) behind everything.
- **Seven band divs** with `mix-blend-mode: screen`. Band i's centre is `c_i = (i + 0.5)/7 · U`. Its width is `W = lerp(U/7, beamW, n)` with `beamW = max(0.09·U, 32 px)`, centred on its own centre. Its centre position is `c_i + τ · (U/2 − c_i)`.
- **White overlay div** (`--beam`) at the centre, beamW wide, with opacity `ov`. The computed 7-way screen sum is `#FFFEFF`; the overlay makes the final white exact.
- A 1 px `--ink` **hairline** on each beam's left edge, with opacity `hair`, which keeps neighbours legible as they first touch.

**Parameters**
- `n = glide(r(p, 0, 0.25))`
- `τ = keys(p, [(0.25, 0), (0.40, 0.035, lin), (0.88, 1.074)])`, then `keys(p, [(0.88, 1.074), (1, 1, smooth)])` (**creep: +0.035 across the hold**). At its maximum the overshoot carries the outermost beams 0.35 beam widths past the centre (45 px at 1440); inner beams overshoot proportionally less, and jade (i = 3) never moves.
- `hair = r(p, 0.40, 0.46) · (1 − r(p, 0.64, 0.70))`
- `ov = r(p, 0.93, 1)`

| p | Frame | Why it is composed |
|---|---|---|
| **0** | Seven full-bleed bands. | Identity seam. |
| **0.25–0.40** (hold) | **Signature: "Colonnade."** Seven narrow coloured beams stand evenly spaced in a dark room, with ink between them. Across the hold they lean in by at most 21 px. | The most "light installation" frame in the piece: even rhythm and maximum saturation against black. |
| **0.5** | The beams have drawn in to about 45% of U in total. Neighbours overlap, and the overlaps screen into new colours: tangerine and saffron make pale gold, jade and azure make bright aqua. | A chord: overlapping translucent columns, symmetrical about the centre, lighter where they meet. |
| **0.75** | About 18% of U wide in total. The centre is almost white, with coloured fringes on both edges, warm on the left and cool on the right. | A white beam with chromatic aberration: the opening's split, run backwards. |
| **1** | One exact white beam, beamW wide, on ink. No fringes. | The colours have "agreed": the minimum possible composition. **Identity seam** with Scene 6 at p = 0. |

### Scene 6 · Return (180 svh) · release
*Caption: "Where you came in. The beam is still white."*

**Elements**
- **The white beam**, centred, with width `lerp(beamW, U, widen)` across the full V. Its colour lerps `--beam` → `--wall` by `mix`. The gallery spot fades in by `spot`.
- **The Scene 1 SVG module in "redraw" mode:**
  - the prism outline draws by `stroke-dashoffset` (`draw`);
  - the glass fill and the fringe lines fade in (`glass`);
  - the beam hairline extends from u = 0 to the prism, with the entry glint at its end (`beam`);
  - the spectrum card unfolds to Scene 1's p = 0 size (`card`, which drives the fan from 0° to 6°).

**Parameters**
- `widen = glide(r(p, 0, 0.40))`; `mix = glide(r(p, 0.05, 0.40))`; `spot = r(p, 0.30, 0.40)`
- `draw = glide(r(p, 0.52, 0.74))`; `beam = glide(r(p, 0.64, 0.80))`; `glass = r(p, 0.70, 0.84)`; `card = glide(r(p, 0.80, 0.96))`
- p 0.96–1 is the terminal settle (static).

| p | Frame | Why it is composed |
|---|---|---|
| **0** | A white beam on ink. | Identity seam. |
| **0.25** | A white doorway about 46% of U wide, with ink margins on either side, already warming toward wall white. | A door of light, symmetrical: Turrell's aperture. |
| **0.40–0.52** (hold) | **Signature: "The empty wall."** The whole viewport is a warm white wall with its spotlight, completely empty. | A deliberate rest: the only empty, static frame in the piece, earned after the peak (P3). It lasts 21.6 svh. |
| **0.75** | The prism is drawn in fine line (about 100% of the outline, with glass at 36%), and the hairline beam has nearly reached it from the left. | A technical drawing on a wall: line before glass. |
| **1** | Scene 1's opening composition (wall, prism, beam, glint and small spectrum card), without the title or cue. | A rhyme: the piece ends where it began. The colophon then scrolls up in normal flow over the same `--wall`. |

**Colophon.** Normal flow, `--wall` ground, 70 svh, not pinned. It is the only content that scrolls like a page, which tells the visitor the piece is over.

---

## 5. Transitions between scenes

### 5.1 Hand-offs
There are no cross-fades, wipes or cuts. **All five seams are identity seams**, and every transition happens inside the scenes' own maths.

| Seam | Hand-off element | How it becomes the next scene |
|---|---|---|
| 1 → 2 | the 7 bands | wedges straighten into columns (end of 1); the columns become an accordion (2) |
| 2 → 3 | cobalt field, dot grid, centre dot | the dots condense on the last field (end of 2); glass enters over them (3) |
| 3 → 4 | the dots | the glass fades and the vertex dots become lattice vertices (start of 4) |
| 4 → 5 | the 7 bands (chorus) | the mosaic quantises to bands (end of 4); the bands narrow into beams (5) |
| 5 → 6 | the white beam | the beam widens into the wall (6) |

### 5.2 The seam gate (F5)
For each seam, the **gate** is deep equality of the shared geometry in `snapshot()`, taken from the shared geometry module (`Bands`, `DotGrid`, `Shelf`) at `stateAt(Y_{N+1} − ε)` with N at p = 1, versus N+1 at p = 0. Numbers must agree within 0.01 px or 1e-6.

| Seam | Fields that must be equal |
|---|---|
| 1 → 2 | `bandRects[7]` (u0, u1, v0, v1 in px); every visible-element opacity outside the bands is 0 (prism, beam, title, cue, white point, dots) |
| 2 → 3 | ground = cobalt over the full U × V; `dotGrid {pitch, originU, originV, r, vertexWhite: 0.55, fillWhite: 0.55, inkAlpha: 0}`; `whitePoint {u: 50%, v: 50%, r: 3, alpha: 1}` |
| 3 → 4 | `dotGrid` as above; `shelf[3] {kind, u, v, size, rot}` = {tri 25%, cir 50%, dia 75%; v 50%; rot 0}; `channelScales [1.25, 1.40, 1.55]`; `glassAlpha 1` |
| 4 → 5 | `bandRects[7]` equal to the 1 → 2 rects for this viewport; S4 `bandsAlpha 1` |
| 5 → 6 | `beamRect {centreU: U/2, width: beamW, v0: 0, v1: V}`, colour `#FFFFFF`; ground `--ink` |

**Pixel evidence and tolerance test.** A screenshot diff of `frame(N, 1)` against `frame(N+1, 0)` must show ≤ 0.5% of pixels differing by more than 8/255 in any channel. It runs at 1440×900 and 375×812, at DPR 1 and DPR 2. The diffs are saved to `evidence/seams/`. Band edges are snapped to device pixels on both sides of every seam (polish 4).

### 5.3 Pre-approved fallback (D1)
Identity seams are the design. **Only if** the 1 → 2 seam (SVG wedges to DOM bands) or the 4 → 5 seam (canvas bands to DOM bands) fails the pixel tolerance at both DPRs after **one** fix round, that seam switches to a deterministic crossfade: over scene N's last 3% of p, the N+1 layer renders its fixed `state(0)` on top with opacity `r(p, 0.97, 1)`. The state gate in §5.2 still binds. No more than one fix round may be spent chasing sub-pixel equality.

---

## 6. The first 10 seconds

| t | What happens |
|---|---|
| 0 ms (first paint) | **The Scene 1 p = 0 frame comes from HTML and CSS alone.** The inline SVG ships with `state(0)` attributes baked in and the tokens are in CSS, so the first frame depends on no JS and no webfont (the fallback face is metric-matched; §13.2). The chrome is already in place. There is no loader, no intro and no fade-up (P12). **F15:** a JS-disabled first paint and the JS-booted p = 0 frame differ by < 0.5% of pixels (> 8/255) at 1440×900, with the noscript banner's box masked. |
| 0–10 s, no input | Stillness. The idle timer is **not armed** until the first user scroll (A4), so there is no admire mode on arrival. The cue reads **"Scroll to bend the light"**, as static text with no bounce. |
| **First 40 px** (any wheel, trackpad or touch delta) | **The hook (F10).** Within one frame: the fan's far edge grows from 87 px to 155 px tall (+68 px), the title plates slip 3.1 px out of register so colour fringes appear on "Bent Light", the prism turns 2.6°, and the cue drops to 66%. |
| First wheel tick (≈ 100 px) | Spread about 16°, far edge about 235 px, plate split about 6.9 px. The fan is visibly *opening*, not nudging. |
| 1–3 s of scrolling (to p ≈ 0.25) | The fan sweeps across the right half of the wall, and the title separates into three coloured ghosts. |
| 3–5 s (to p ≈ 0.5) | The title has gone and the fan fills the right wall: the hold. If the visitor stops here, they land on "The full fan". 1.2 s later the chrome recedes and the spectrum breathes ±1.5°; at 3 s the placard reads *01 · Incidence · held at 7%* / "The full fan. Nothing in it is mixed." |

On a phone (first touch-scroll), the beam comes from the top and the fan opens downward. The response is the same, rotated.

---

## 7. Admire mode (the stillness reward)

### 7.1 Inputs
The **input list** is: `scroll`, `wheel`, `keydown`, `pointerdown`, `touchstart`, `touchmove`, and `pointermove` with ≥ 4 px cumulative travel (so sensor jitter cannot keep the chrome awake). `scrollend` is a hint only (T-E3). Scroll events produced by the engine itself (the resize restore in §11.2, and Rewind) do not count as input.

### 7.2 Arming and blocking
- **Armed** by the first user-initiated scroll: a `wheel`, a `touchmove`, a scroll key, or a scrollbar scroll that is not Rewind or a resize restore.
- **Enters** 1,200 ms after the last input, unless one of these blocks it:
  - focus is on a chrome element that hides (skip link, wordmark, scene ticks);
  - the pointer is hovering over the chrome;
  - Rewind is running;
  - `document.hidden`;
  - **`scrollY > D`**, meaning the stage has released into the colophon (F13).
- Focus on the **pause control** does *not* block it, because the pause control stays visible in admire mode (§7.6).

### 7.3 Entering (times measured from the last input; entry is at 1,200 ms)
1. At 1,200 ms, `html[data-admire="on"]`. The wordmark, scene label, rail and ticks fade to 0 over **600 ms** (`--ease-standard`), then get `visibility: hidden`. The **pause control dims to 0.55** and stays operable (WCAG 2.2.2). The **caption stays**.
2. At 1,200 ms, **breathing starts**. The ambient amplitude `a(t)` ramps 0 → 1 over **1,600 ms** (easeInOutSine), so motion never jumps in.
3. At 1,200 ms, the live region may announce (§7.7).

### 7.4 The placard (F1, D8)
- **At 3,000 ms of stillness** (1,800 ms after entry), the caption hands its slot to the **placard**:
  - the caption fades 1 → 0 over 360 ms (ease-in);
  - the placard fades 0 → 1 over **900 ms** (`--ease-out`), starting 200 ms later (3,200–4,100 ms).

  The corner is never empty, and the two are never both above 50% opacity at once.
- **Content.**
  - Line 1, in `--type-label`: `04 · DICHROIC · HELD AT 62%`. The integer is `Math.round(100 · G)` and uses tabular figures.
  - Line 2, in `--type-caption`: the frame-accurate phrase from `placardPhrase(scene, pShown)` (§7.5), e.g. "Light overhead; every facet answers."
- **Chip.** The scene's chip theme. `aria-hidden="true"`, because the live region carries the same content.
- **Exit.** The placard hides in 120 ms and the caption returns in 160 ms.
- **Reduced motion.** The placard still appears with the same opacity fade (fade only; nothing moves).
- **Paused breathing.** The placard still appears.

### 7.5 `placardPhrase(scene, p)` (F2): pure and unit-tested
Bands are half-open `[a, b)`, except that the last band includes 1. Under reduced motion `pShown` is the p of the still on screen (0, 0.5 or 1; during a still crossfade, the still at higher opacity). Otherwise `pShown = p`.

| Scene | p-bands → phrase |
|---|---|
| 1 Incidence | [0, .04) "White, waiting for an angle." · [.04, .25) "The glass turns. The white gives way." · [.25, .45) "Seven colours, fanning out." · [.45, .60) "The full fan. Nothing in it is mixed." · [.60, .88) "The rays stand up, one by one." · [.88, 1] "Seven bands, standing." |
| 2 Field | [0, .05) "Seven bands, equal for now." · [.05, .161) "Vermilion takes the room." · [.161, .329) "Tangerine, standing in it." · [.329, .497) "Saffron: the brightest room in the house." · [.497, .665) "Jade, cool underfoot." · [.665, .833) "Azure, standing in it." · [.833, .95) "Cobalt, and a grid arriving." · [.95, 1] "Cobalt, pricked with points of light." |
| 3 Refraction | [0, .10) "A sharp edge enters." · [.10, .42) "Through the glass, the dots grow and split." · [.42, .58) "Triangle and circle, crossing paths." · [.58, .88) "Separating. A third shape arrives." · [.88, 1] "Three pieces of glass on a shelf." |
| 4 Dichroic | [0, .10) "The glass goes; the dots stay." · [.10, .30) "The dots join into a lattice." · [.30, .44) "Low light from the left." · [.44, .56) "Light overhead; every facet answers." · [.56, .80) "The light moves right, and warms." · [.80, .96) "The crystal remembers its spectrum." · [.96, 1] "Seven bands again." |
| 5 Agreement | [0, .08) "Seven bands, about to narrow." · [.08, .25) "Narrowing into beams." · [.25, .40) "A colonnade of light." · [.40, .70) "Neighbours overlap, and lighten." · [.70, .93) "Almost agreed." · [.93, 1] "Agreed: white." |
| 6 Return | [0, .40) "The white beam widens into a wall." · [.40, .52) "An empty wall. Rest here." · [.52, .80) "The prism, drawn again in line." · [.80, 1] "Where you came in." |

The Scene 2 boundaries .161 / .329 / .497 / .665 / .833 are exactly where the cursor c crosses k + 0.5, i.e. where the dominant colour changes. Every phrase stays true if any cut in §16 is taken; for example, Scene 3's hold phrase does not claim double refraction.

### 7.6 Exiting (F6)
On any input from the list:
- **Synchronous restore.** Inside the event handler, before the default action runs, restore `visibility` on all chrome and set `data-admire="off"`. Then:
  - opacity returns to 1 over **160 ms** (`--ease-out`), faster in than out;
  - the placard hides in 120 ms and the caption returns;
  - the ambient amplitude decays to 0 over **240 ms** (easeOutCubic), so it never pops by more than 1 px.
- **The input keeps its default action.** Never call `preventDefault`. Space both exits and scrolls; Tab both exits and moves focus, landing on a visible control. The scroll that caused the exit renders in that same frame.
- **The pause-control guard** (`isOnPauseControl(event)`): `pointerdown`, `pointermove` and `click` *on* the pause control, and `keydown` Enter or Space while it has focus, **do not exit** admire mode. They toggle breathing (click/Enter/Space) or do nothing (move). **Exception:** Tab or Shift+Tab on the pause control exits synchronously, so the next focus target is visible.
- The live region says nothing on exit.

### 7.7 Announcements (F7)
- On entry, if `key = scene + "|" + phraseBandIndex` differs from the last announced key, the polite live region (`role="status"`) announces one of these:
  - breathing on: "Admire mode, 04 Dichroic: Light overhead; every facet answers. Controls hidden; the scene is breathing. Scroll, press a key or move the pointer to continue."
  - breathing paused, or reduced motion: "Admire mode, 04 Dichroic: Light overhead; every facet answers. Controls hidden. Scroll, press a key or move the pointer to continue."
- If the key matches, it announces nothing. The last-announced key resets only on reload.

### 7.8 Breathing
Breathing is a separate layer, `apply(state(p), ambient(t)·a)`. It is never part of `state(p)` and is zero outside admire mode. Tests pause it or set it to zero.
**Rule:** amplitude is always below the scene's own motion, every period is ≥ 7 s, and no component changes frame-mean luminance by more than 0.02 Y.

| Scene | Breathing (amplitude at a = 1, period) |
|---|---|
| 1 Incidence | fan spread ±1.5°, and a prism glint (1 px highlight on the left face) sliding ±6% of the face length · 8 s |
| 2 Field | dominant band width ±2.5% · 10 s; shear ±0.8° · 13 s |
| 3 Refraction | each shape bobs ±6 px along v, with phases 0 / 0.33 / 0.66 · 7 s; channel scales ±0.01 · 9 s, so the rim triplets gently widen and close |
| 4 Dichroic | θ ±6° · 12 s. **The best admire moment:** colour slides across the facets like a hand tilting dichroic glass. No facet's hue moves more than 12°. |
| 5 Agreement | beams sway ±4 px each, alternating direction · 9 s. At p = 1, the single beam's edges breathe ±1 px. |
| 6 Return | as Scene 1 wherever the prism is present; the empty wall breathes its spotlight radius ±3% · 11 s |

**Global fallback recipe** (cut item 2): every scene uses one veil of `--beam` at opacity 0 ↔ 0.02, sine, 10 s. This changes mean Y by ≤ 0.02.

### 7.9 Pause
- The pause control toggles breathing and persists the choice in `localStorage` under `bentlight.breathing`. Every read and write is in try/catch, and the default is "on".
- While paused, admire mode still hides the chrome and shows the placard, but nothing moves.
- Status messages: "Breathing paused." / "Breathing on."

### 7.10 Reduced motion
Admire mode still hides the chrome, as an opacity fade shortened to 200 ms, and still shows the placard. Breathing is never created, and the pause control shows its disabled state (§8).

---

## 8. Chrome, with every state

The chrome is gallery labels on a wall. Chrome text always sits on a **chip**, so contrast is guaranteed over any frame:
- `light` chip: `--chip-light`, ink text, 1 px `--wall-deep` border. Used in Scene 1, and in Scene 6 from p 0.40.
- `dark` chip: `--chip-dark`, white text. Used everywhere else.
- The chip theme cross-fades over 240 ms when it changes. Both themes give ≥ 7:1 text contrast.
- Chip radius 2 px; padding 6 × 10 px. The chrome is square-cornered and geometric.

| Element | Where | States |
|---|---|---|
| **Skip link** "Skip to the colophon" | top-left, off-screen until focused | **focus-visible:** slides in as a dark chip (translateY −100% → 0, 160 ms; instant under reduced motion). **Activate:** jumps to `#colophon` and moves focus to the colophon `<h2>` (`tabindex="-1"`). |
| **Wordmark** "Bent Light" (link to `#incidence`) | top-left; inset 16/24/32/40/48 px by breakpoint | **default.** **hover:** an underline draws left → right over 120 ms. **focus-visible:** the dual ring (§9). **active:** translateY(1 px) for 90 ms. **admire:** hidden. |
| **Scene label** "03 · Refraction" | after the wordmark, separated by a 1 px vertical rule | Updates at each seam with a 200 ms cross-fade (cut item 3 makes it an instant swap). Tabular figures, so its width never moves the wordmark. Not live. **admire:** hidden. **Rewind:** shows the rewind status instead. |
| **Spectrum rail** (progress) | **≥ 1024:** vertical on the right edge, 28 px inset, length `clamp(330px, 44svh, 560px)`, centred. **< 1024:** horizontal across the top below the wordmark row, full width minus the gutters. | The track is a 2 px line at 25% of the chip text colour. The fill is a 2 px line carrying the 7-stop spectrum gradient, revealed by `scaleY` (or `scaleX`) = G. The **leading dot** is the white point (§3.4). `aria-hidden`; the accessible progress is the scene list. **admire:** hidden. |
| **Scene ticks** (6 links in `<nav aria-label="Scenes">`) | on the rail at each scene's start: G = 0, .1467, .3467, .52, .7333, .88 | **Hit target 44 × 44 at every pointer type (D7).** The minimum tick spacing is 48.4 px, so targets never overlap. Each tick is a 6 px diamond outline. **current:** a filled 10 px diamond in the scene's key colour, plus `aria-current="true"`. **past:** a filled 6 px diamond. **future:** outline only. **hover:** the diamond scales to 1.25 over 120 ms and a chip label slides 8 px out from the rail ("04 Dichroic"), flipping side below 1024 so it never clips. **focus-visible:** the dual ring plus the same label. **active:** scale 0.9 for 90 ms. **Activate:** native scroll to the scene's anchor (`scroll-behavior: smooth`; `auto` under reduced motion), landing exactly at p = 0. Focus stays on the tick. |
| **Caption** (one line per scene) | bottom-left; the whole bottom row at ≤ 768 | Full opacity whenever its scene is active, with no fade-in on reveal (P3/P7). At a seam it changes by an opacity cross-fade driven by scroll over the last 3% of one track and the first 3% of the next. **admire:** stays until the placard replaces it at 3,000 ms (§7.4). |
| **Placard** | the caption's slot | Hidden by default. Appears per §7.4. `aria-hidden`. |
| **Pause control** (`<button aria-pressed>`) | bottom-right, 44 × 44 px, two-bar glyph | **default (breathing on):** glyph ‖, name "Pause breathing". **hover:** a label chip "Pause breathing" appears to its left over 120 ms. **focus-visible:** the dual ring plus the label. **active:** scale 0.94 for 90 ms. **paused:** a small open-triangle glyph (the prism), name "Resume breathing", `aria-pressed="true"`. **admire:** 0.55 opacity, 1.0 on hover or focus. **reduced motion:** dashed outline, `aria-disabled="true"` (still focusable), label "Breathing is off because your device asks for reduced motion". Activation does nothing. It is always visible outside admire mode, so the mechanism exists before any motion starts. |
| **Scroll cue** "Scroll to bend the light" | bottom centre, Scene 1 only | Static text plus a 24 px hairline arrow; opacity = `cueOpacity`; no time-based bounce. `aria-hidden`. |
| **Rewind status** | in the scene-label slot while a rewind runs | "Rewinding · press any key to stop", with the chrome forced visible. |
| **Contact sheet** (reduced motion, Scene 4, ≥ 1024) | bottom centre | See §10.4. |
| **Live region** | visually hidden, `role="status"` | Admire, pause and rewind messages. |

### 8.1 Colophon controls
- **"Run it backwards"** is an outlined chip button.
  - Activating it runs a rAF-driven `scrollTo` from the current position to 0 over 8,000 ms (easeInOutSine). It plays the whole piece in reverse.
  - It is cancelled on the same frame by `wheel`, `keydown`, `pointerdown`, `touchstart` or `touchmove`, and the piece holds wherever that is. Status: "Rewind stopped. You're in 03 Refraction."
  - On completion, focus moves to the wordmark. Status: "Back at the first beam."
  - During a rewind, admire mode never triggers and the chrome stays visible.
- **"Jump to the first beam"** jumps instantly to 0 and moves focus to the wordmark.
- **Under reduced motion,** "Run it backwards" is renamed "Jump to the first beam" and jumps instantly; the second link is hidden.

### 8.2 Loading, empty, no-JS
- **Loading:** none visible. The first frame is static HTML and SVG (§6). The webfont, if shipped, swaps against a metric-matched fallback (§13.2).
- **JS disabled:**
  - A `<noscript>` banner (dark chip, top) reads **"Bent Light moves when JavaScript is on. Without it you see the first frame, which is also the last."**
  - A `<noscript><style>` collapses the tracks, so the page is the opening frame followed by the colophon (document height ≤ 100 svh + colophon). It also hides the two Rewind links and colophon p3.
  - The scene anchors still work as plain links.
- **Unknown hash** (e.g. `#nope`): the page opens at the top, with no error.
- **Empty:** there is no empty state. Every frame has content, including the designed rest at Scene 6 p 0.40–0.52.

### 8.3 Error states (F9)
- **A scene throws in `apply`.** The engine catches it and pushes `{scene, phase: "apply", message}` to `window.__showcase.errors`. It never calls `console.error`. That layer switches to its static reduced-motion stills, and a chip in the caption slot reads **"This scene couldn't draw on this device, so you're seeing its still."** Everything else keeps working.
- **No 2D canvas context, or the context is lost** (Scene 4). The engine pushes `{scene: 4, phase: "context"}`. Scene 4 then shows the Scene 3 shelf (SVG) for p < 0.5 and the seven `Bands` (DOM) for p ≥ 0.5, with an opacity crossfade over p 0.45–0.55, and the same error chip. On `contextrestored` it redraws from the current p.
- **Tests:** a full scroll-through asserts `__showcase.errors` deep-equals `[]` and that there are zero console errors and zero unhandled rejections.

---

## 9. Keyboard and focus

- **Native scrolling is untouched.** ↑ ↓ PageUp PageDown Space Shift+Space Home End all scrub the piece natively. There is no `preventDefault` on scroll keys (P2).
- **Tab order:** skip link → wordmark → 6 scene ticks (01–06) → pause control → colophon links ("Run it backwards", "Jump to the first beam").
- **No single-character shortcuts** (rejected at the bake-off: WCAG 2.1.4 surface for no gain).
- **Focus ring** (`--focus`): a 2 px `#FFFFFF` inner ring plus a 2 px `--ink` outer ring, offset 2 px, on every focusable element. It is visible on wall, saffron, cobalt, mosaic and ink.
- Focus is never hidden: admire mode is blocked while focus is on a hiding chrome element, and Tab restores the chrome synchronously (§7.6).
- **Tick activation** moves the scroll; focus stays on the tick, so Tab and Enter can be pressed repeatedly. The scene label updates when the seam is crossed.
- **Pause:** Enter or Space toggles breathing and announces "Breathing paused." or "Breathing on.". In admire mode it does not exit (§7.6).

---

## 10. Accessibility, comfort and photosensitivity

### 10.1 Photosensitivity (a designed property, with a gate)
1. **No flashing, ever.** Nothing changes luminance as a function of time except breathing, which is capped at ≤ 0.02 Y with periods ≥ 7 s.
2. **Luminance hills, not oscillations.** Within any scene, frame-mean luminance Ȳ changes direction **at most twice** (hysteresis 0.02).

   | Scene | Designed Ȳ profile (to be measured by the audit) |
   |---|---|
   | 1 | 0.90 → 0.32 |
   | 2 | 0.32 → 0.27 → 0.48 → 0.12 (computed, Appendix A) |
   | 3 | 0.13 → 0.15 |
   | 4 | 0.13 → ~0.30 → 0.32 |
   | 5 | 0.32 → ~0.10 |
   | 6 | 0.10 → 0.90 (0.85 with the dark-mode wall) |

3. **Saturated changes are slow, and the arithmetic is honest (D4).** Each Scene 2 field change *moves* over **≥ 32.8 svh** (≈ 295 px at 900 tall), after a 17.6 svh plateau. The per-step change in Ȳ is ≤ 0.13.
   - The safety argument does **not** rest on slowness. Scene 2's dominance walk is monotonic in hue and produces one luminance hill, so at **any** scroll speed it contributes at most one opposing pair of ΔȲ ≥ 0.10 transitions.
   - Slowness is a comfort rule. The audit (rule 6) is the proof.
4. **No saturated-red full field.** Vermilion peaks at 63% of the viewport (below the 70% cap) and never alternates with another field. (`#F54123` gives R/(R+G+B) = 0.71, which is under WCAG's 0.8 saturated-red definition anyway.)
5. **No high-contrast gratings.** Scene 3 uses a **dot** grid at 55% on cobalt, never stripes. There are no regular high-contrast stripe patterns with more than 5 light–dark pairs covering more than 25% of the screen. Scene 2's thin stripes are irregular and saturated against saturated, and its ink dots are at 8%.
6. **The flash audit is a gate in `npm run verify` (D6).**
   - **Measure.** Ȳ = mean linear-light relative luminance of a 64×40 downscale of a screenshot.
   - **Transition.** A monotone run between consecutive Ȳ extrema (hysteresis 0.02) with |ΔȲ| ≥ 0.10.
   - **Deterministic sampling.** Positions are *recorded* per rAF during the real run, then *replayed*: scroll to each, wait 2 rAF, screenshot. Frames are pure functions of position, so this is exact, and it avoids screenshot latency.
   - **Gates:**
     - **F1 Profile.** 40 evenly spaced samples per scene. Each scene has ≤ 2 Ȳ direction reversals.
     - **F2 Rewind.** The 8 s Rewind from the colophon, sampled at 20 Hz. Any 1 s window contains ≤ 4 transitions (≤ 2 flashes, against WCAG's limit of 3 flashes, i.e. 6 transitions).
     - **F3 Fastest navigation.** From y = 0, activate tick 05 (Scene 1 → Scene 5, the longest smooth jump) and record every rAF until the scroll settles. Same window rule. The design predicts 4 transitions in total (S1 down, S2 up, S2 down, S4 up).
     - **F4 Red.** At every sampled frame, the share of pixels with R/(R+G+B) ≥ 0.8 is ≤ 0.70.
   - The Ȳ-vs-position plot and the rewind time-series are saved to `evidence/flash-audit/`.

### 10.2 Vestibular (P11)
- No zoom of the whole stage.
- Large-area rotation is limited to Scene 1's prism (22°, one object) and Scene 2's shear (18°, a skew).
- No parallax layers: Scene 3's shapes move at different *times*, not at different depths.
- No non-ground element travels more than 0.6 viewport per viewport of scroll.

### 10.3 Other guarantees
- **Text contrast.** All chrome text is ≥ 7:1 on its chip. The colophon is ink on `--wall` at **17.3:1** (16.4:1 on the dark-mode wall). The title at p = 0 is pure black on the wall.
- **Semantics.**
  - One `<h1>` (the title).
  - `<nav aria-label="Scenes">` for the ticks.
  - Each `<section>` is `aria-labelledby` a visually hidden `<h2>` with the scene name, and contains its caption as real text.
  - Each art layer is `role="img"` with the `aria-label` from §12.
  - The CMY plates, cue, rail and placard are `aria-hidden`. Inactive layers are `inert`.
- **Zoom.** At 200% zoom there is no horizontal scroll; the chrome reflows to the < 1024 layout.
- **Colour independence.** Current, past and future ticks differ by fill and size, and current also has `aria-current`.

### 10.4 Reduced motion: the second cut (P8, P9)
Under `prefers-reduced-motion: reduce`:
- **Stills.** Each scene renders **three authored stills**, `state(0)`, `state(0.5)` and `state(1)`, using the frames tabled in §4.
  - **Still ranges:** [0, 0.17], [0.33, 0.67] and [0.83, 1].
  - **Crossfades:** opacity only, over p 0.17–0.33 and 0.67–0.83. They are implemented with two layer instances (A and B), each applying a fixed still; Scene 4 uses canvas globalAlpha.
  - The Scene 2 crossfade spans 0.16 × 300 svh = 48 svh (≈ 430 px), so it is slow.
- **Seams** stay identity seams, because p = 0 and p = 1 are among the stills.
- The title appears in register, with no plate split.
- **Breathing is off.** The pause control is disabled with its explanation.
- **Ticks and Rewind jump instantly,** and Rewind is renamed "Jump to the first beam".
- **Admire mode** still hides the chrome (a 200 ms fade) and still shows the placard (fade only).
- **Contact sheet (F17, adopted for Scene 4).** At ≥ 1024 px, while Scene 4 shows its middle still (p ∈ [0.33, 0.67]):
  - a dark chip at the bottom centre holds three 128 × 80 px canvases, 8 px apart, rendered **once** from `state(0.25)`, `state(0.5)` and `state(0.75)`;
  - they carry the labels "light from the left · overhead · from the right" in `--type-label`;
  - so a reduced-motion visitor still sees the light's range. It is `aria-hidden`, since the art label already describes the motion.
  - **Declined for Scene 2:** its three stills (equal bands, the saffron/jade split, cobalt) already show its full range.
- **Test hook (F14).** Under emulated `reduce`:
  - after 1 s of quiescence, `document.getAnimations().filter(a => a.timeline instanceof DocumentTimeline)` is empty;
  - `snapshot()` is deep-equal at p = 0.36, 0.5 and 0.64 for every scene (and likewise across [0, 0.17] and [0.83, 1]).
- Scrolling remains the essential motion. Nothing else moves except opacity.

---

## 11. Responsive behaviour

### 11.1 Per viewport
One geometry in the (u, v) frame (§3.2). All sizes are in `vmin` or fractions of U and V unless stated.

| Viewport | Orientation and axis | Gutter | Dot pitch / lattice | Chrome | Scene specifics |
|---|---|---|---|---|---|
| **375×812** | portrait: beam from the top, bands as rows, glass travels upward | 16 px | 24 / 48 px (~300 facets) | wordmark and short label ("03 Refraction") on one row; horizontal rail beneath; caption full-width at the bottom (15 px, max 2 lines); pause 44 px bottom-right above the caption row | prism side 46vw, centroid (50vw, 30svh); title at the bottom, 64 px; S3 shapes 40vw, with the shelf a vertical column at u = 25/50/78%… see note¹; S5 beams are horizontal bars `max(9svh, 32px)` tall |
| **768×1024** | portrait | 24 px | 24 / 48 px (~430) | as 375, but with the full label | prism 40vw |
| **1024×768** | landscape | 32 px | 28 / 56 px (~600) | vertical rail appears on the right | reference layout |
| **1440×900** | landscape (**reference**) | 40 px | 32 / 64 px (~700) | all chrome | as §4 |
| **1920×1080** | landscape | 48 px | 36 / 72 px (~920) | all chrome; caption max 44ch | prism side capped at 400 px, so it stays an object, not a billboard |

¹ Portrait shelf positions are u = 25 / 50 / 75%, the same fractions as landscape. The 22/50/78% values in an earlier draft are superseded, because the shelf must share `Shelf` geometry across both orientations.

**The invariant at every viewport:** lattice pitch = 2 × dot pitch, and the lattice vertices *are* the vertex dots, so the 3 → 4 seam holds. Any pitch fallback (§16, D2 fallback 2 and cut item 4) changes the dot pitch and the lattice together.

### 11.2 Resize and orientation (F8)
- The engine keeps `G_anchor = scrollY / D`, updated only on **user** scroll.
- On resize or orientation change it recomputes `L_s` and `D′` from the new svh and sets `scrollY = round(G_anchor · D′)`. That scroll is engine-originated: it neither arms nor exits admire mode, and it does not update `G_anchor`.
- A 1440 → 375 → 1440 round trip therefore returns `scrollY` exactly to its original value, and `snapshot()` is deep-equal.
- Resize itself counts as user activity: admire mode exits, and the pause state is kept.
- Stages are `100svh`. `dvh` is never used. There is no horizontal overflow at any width; overscanned elements live inside an `overflow: clip` layer.

---

## 12. Copy

### 12.1 Every string

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
| caption 1–6 | White light is every colour, waiting for an angle. · Stand inside a colour long enough and it becomes the room. · Glass slows light down, and every colour disagrees about by how much. · Turn the surface, and the colour turns with it. · Put every colour back together and they agree on white. · Where you came in. The beam is still white. |
| art label 1 | A glass prism on a white wall splits a thin beam into a fan of seven colours that widens until it fills the wall. |
| art label 2 | Seven bands of colour take turns filling the screen, from vermilion to cobalt, until a grid of white dots appears. |
| art label 3 | Three glass shapes, a triangle, a circle and a diamond, drift over a grid of dots and magnify it, splitting each dot into red, green and blue at their edges. |
| art label 4 | The dot grid becomes a faceted crystal whose colours shift as a point of light moves across it, then settles into seven bands. |
| art label 5 | Seven beams of coloured light in a dark room slide together and add up to a single white beam. |
| art label 6 | The white beam widens back into the gallery wall, and the prism is drawn again where the piece began. |
| placard line 1 | `{NN} · {SCENE} · HELD AT {G}%` (e.g. `04 · DICHROIC · HELD AT 62%`) |
| placard line 2 | `placardPhrase(scene, p)` (§7.5) |
| pause (on / paused / reduced) | Pause breathing · Resume breathing · Breathing is off because your device asks for reduced motion |
| status: pause toggled | Breathing paused. / Breathing on. |
| status: admire enter | Admire mode, {NN} {Scene}: {phrase} Controls hidden; the scene is breathing. Scroll, press a key or move the pointer to continue. |
| status: admire enter (paused or reduced) | Admire mode, {NN} {Scene}: {phrase} Controls hidden. Scroll, press a key or move the pointer to continue. |
| rewind status | Rewinding · press any key to stop |
| status: rewind done / stopped | Back at the first beam. / Rewind stopped. You're in {NN} {Scene}. |
| contact sheet labels | light from the left · overhead · from the right |
| colophon h2 | Colophon |
| colophon p1 | Bent Light is a scroll piece in six scenes. Where you are on the page decides the picture: scroll back and it rewinds exactly; stop anywhere and it waits for you. |
| colophon p2 (font loaded) | Seven colours, one beam, no images. Drawn with HTML, SVG and canvas, and set in Space Grotesk. |
| colophon p2 (otherwise) | Seven colours, one beam, no images. Drawn with HTML, SVG and canvas, and set in your system's own sans-serif. |
| colophon p3 | If you stop for a moment, the controls step aside, a label appears, and the scene breathes on top of its picture. The button in the corner stops the breathing. |
| colophon p3 (reduced motion) | If you stop for a moment, the controls step aside and a label appears. Your device asks for reduced motion, so nothing here moves on its own. |
| colophon link A | Run it backwards *(reduced motion: Jump to the first beam)* |
| colophon link B | Jump to the first beam *(hidden under reduced motion)* |
| noscript | Bent Light moves when JavaScript is on. Without it you see the first frame, which is also the last. |
| scene error chip | This scene couldn't draw on this device, so you're seeing its still. |

### 12.2 Claim integrity (F12)
Every factual claim must be true at every breakpoint, in every mode and after every cut.
- **"set in Space Grotesk"** appears only after `document.fonts.load('700 1em "Space Grotesk"')` resolves and `document.fonts.check(...)` is true. The static HTML carries the "otherwise" string. In Mode S (§13.2) it always says "your system's own sans-serif".
- **"no images":** true. The piece uses no raster or vector image files; the contact-sheet thumbnails are canvases.
- **"Where you are on the page decides the picture":** true. Breathing is described separately in p3, as "on top of its picture".
- **"The button in the corner":** the pause control is bottom-right at every viewport.
- **noscript:** "the first frame, which is also the last" is true, because Scene 6 p = 1 rhymes Scene 1 p = 0 (polish 11), and the noscript style shows only that frame and the colophon.
- **Placard phrases** survive every cut (§7.5).

### 12.3 Voice
Precise, physics-literate, slightly wry, present tense; one sentence per caption; no exclamation marks; British spelling ("colour", "neighbours"). The copy never explains the animation. It names what the light is doing.

---

## 13. Look: tokens

### 13.1 Colour
Computed from OKLCH; hex values verified with the scratchpad script `oklch.py`.

| Token | OKLCH | Hex | Y | Use |
|---|---|---|---|---|
| `--wall` | 0.965 0.008 85 | `#F6F3ED` | 0.90 | gallery wall, colophon ground |
| `--wall` (OS dark, D9) | 0.946 0.008 85 | `#F0EDE7` | 0.85 | same uses, under `prefers-color-scheme: dark` |
| `--wall-deep` | 0.90 0.012 80 | `#E2DDD5` | 0.73 | spotlight falloff, beam underline, light-chip border |
| `--wall-deep` (OS dark) | 0.883 0.012 80 | `#DDD8D0` | 0.69 | same |
| `--ink` | 0.17 0.025 272 | `#0C0F1A` | 0.005 | dark room, text, focus outer ring |
| `--beam` | n/a | `#FFFFFF` | 1.0 | white light, white point |
| `--band-1` vermilion | 0.64 0.22 32 | `#F54123` | 0.23 | spectrum |
| `--band-2` tangerine | 0.73 0.174 58 | `#F68704` | 0.37 | spectrum |
| `--band-3` saffron | 0.84 0.17 92 | `#F2C50E` | 0.59 | spectrum |
| `--band-4` jade | 0.74 0.166 160 | `#0BCA86` | 0.44 | spectrum |
| `--band-5` azure | 0.68 0.132 228 | `#04A7D8` | 0.33 | spectrum (L lowered so it does not vibrate against jade: ΔY 0.11) |
| `--band-6` cobalt | 0.50 0.21 264 | `#2154D8` | 0.12 | spectrum; Scene 3 ground |
| `--band-7` violet | 0.55 0.22 300 | `#8843DB` | 0.14 | spectrum |
| `--ch-r` / `--ch-g` / `--ch-b` | n/a | `#FF3B3B` / `#3BFF7A` / `#3B6BFF` | n/a | refraction channels (screen blend) |
| `--plate-c` / `--plate-m` / `--plate-y` | n/a | `#00B8F0` / `#E6007E` / `#FFE600` | n/a | title plates (multiply). Each has one zero channel, so in register they multiply to exact black. |
| `--glass-hi` / `--glass-lo` | n/a | `rgba(255,255,255,.22)` / `rgba(255,255,255,.05)` | n/a | glass body gradient |
| `--glass-edge` | n/a | `rgba(255,255,255,.85)` | n/a | glass stroke |
| `--fringe-c` / `--fringe-m` | n/a | `#38D6FF` / `#FF4FB3` | n/a | prism and glass edge fringes |
| `--chip-light` / `--chip-dark` | n/a | `--wall` at 92% / `rgba(12,15,26,.78)` | n/a | chrome chips |
| `--focus` | n/a | inner `#FFFFFF` 2 px + outer `--ink` 2 px | n/a | focus ring |

- The measured screen sum of the seven bands is `#FFFEFF`; the white overlay makes it exact.
- **Dark mode (D9, adopted).** Under `prefers-color-scheme: dark` only `--wall` and `--wall-deep` change, by about 5.6% in Y. The art is otherwise identical, and the chips adapt as usual. The Scene 6 → colophon continuity holds because both use `--wall`. There is no theme toggle.

### 13.2 Type and the font decision (F11, F12, D10)
The architect decides between two modes. Both are fully specified and both look intentional.

**Mode G: Space Grotesk shipped (the designer's preference).**
- **Verified here (D10).** `npm pack @fontsource-variable/space-grotesk@5.3.0` gives licence OFL-1.1. `files/space-grotesk-latin-wght-normal.woff2` is **22,288 bytes** (wght 300–700). It is self-hosted, with no network at runtime.
- `@font-face { font-family: "Space Grotesk"; src: url(fonts/space-grotesk-latin-wght-normal.woff2) format("woff2"); font-weight: 300 700; font-display: swap; }`, preloaded.
- **Metric-matched fallback faces** (measured in bundled Chromium against Liberation Sans, which is metric-identical to Arial; Appendix B):
  ```css
  @font-face { font-family: "Bent Light Fallback"; font-weight: 600 800;
    src: local("Arial Bold"), local("Arial-BoldMT"), local("Liberation Sans Bold"), local("LiberationSans-Bold"), local("Helvetica Neue Bold"), local("HelveticaNeue-Bold");
    size-adjust: 102.3%; ascent-override: 96.2%; descent-override: 28.5%; line-gap-override: 0%; }
  @font-face { font-family: "Bent Light Fallback"; font-weight: 300 599;
    src: local("Arial"), local("ArialMT"), local("Liberation Sans"), local("LiberationSans"), local("Helvetica Neue"), local("HelveticaNeue");
    size-adjust: 109.2%; ascent-override: 90.1%; descent-override: 26.7%; line-gap-override: 0%; }
  ```
- `--font: "Space Grotesk", "Bent Light Fallback", "Helvetica Neue", Arial, "Liberation Sans", sans-serif`.
- **Test.** CLS ≤ 0.01 over load, with the font response delayed 300 ms to force a swap. The title box width differs by ≤ 2% between the fallback and Space Grotesk.

**Mode S: system neo-grotesk (if the architect vetoes the webfont).**
- `--font: "Helvetica Neue", Helvetica, Arial, "Liberation Sans", Roboto, sans-serif`. There is no webfont and no swap, so CLS is 0 by construction.
- **Why this stack, not `system-ui`.** `system-ui` resolves differently on each OS (SF Pro, Segoe UI, Roboto, and here, Inter; `fc-match sans-serif` → Inter). The neo-grotesk lineage is a deliberate choice: Helvetica (1957) is the type of Kelly's and Albers' era, so it belongs in this gallery. In this environment it resolves to Liberation Sans, which is metric-identical to Arial, so the evidence screenshots represent the Windows layout too.
- **Mode S adjustments:** display tracking −0.04em (instead of −0.035em) and labels +0.14em. Everything else is identical.
- The colophon uses the "otherwise" p2 string.

| Token | Value |
|---|---|
| `--type-display` | clamp(64px, 12.5vw, 200px) / 0.88 / 700 / −0.035em (Mode S −0.04em) |
| `--type-subtitle` | clamp(16px, 1.5vw, 22px) / 1.3 / 500 |
| `--type-caption` | 15px/1.45 (≤ 768) · 16px/1.5 (≥ 1024) / 450 (Mode S 400) |
| `--type-label` | 12px / 1 / 600 / +0.12em (Mode S +0.14em), uppercase, `font-variant-numeric: tabular-nums` |
| `--type-colophon` | 18px/1.55 / 400, max 52ch; h2 32px/1.1/600 |

Fixed line-heights mean the title box height never changes with the face.

### 13.3 Spacing and shape
- 4/8 scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Gutters: 16 / 24 / 32 / 40 / 48 px across the five viewports.
- Chip padding 6 × 10 px; chip radius 2 px; hairlines 1 px; rail 2 px.

### 13.4 Lighting and mood
- Gallery daylight: one soft radial spot, no shadows and no glow blur.
- Glass is at most a 22% → 5% white gradient.
- Bands are flat.
- All light is *colour*, never bloom.

### 13.5 Motion tokens

| Token | Value |
|---|---|
| `--idle-ms` | 1200 |
| `--placard-ms` (stillness before the placard) | 3000 |
| `--dur-chrome-out` / `--dur-chrome-in` | 600 ms / 160 ms (reduced motion: 200 / 160) |
| `--dur-placard-in` / `--dur-placard-out` / `--dur-caption-handoff` | 900 / 120 / 360 ms (placard delayed 200 ms) |
| `--dur-hover` / `--dur-press` / `--dur-label` / `--dur-chip-theme` | 120 / 90 / 200 / 240 ms |
| `--dur-ambient-ramp` / `--dur-ambient-decay` | 1600 ms easeInOutSine / 240 ms easeOutCubic |
| `--dur-rewind` | 8000 ms easeInOutSine |
| `--ease-standard` | cubic-bezier(.4, 0, .2, 1) |
| `--ease-out` | cubic-bezier(.16, 1, .3, 1) |
| `--ease-in-out` | cubic-bezier(.65, 0, .35, 1) |
| position curves (JS, unit-tested) | `r`, `smooth`, `glide`, `settle`, `lead`, `lin`, `keys` |

**Choreography rules:**
- State is a pure function of p.
- One gesture per scene dominates; secondary motion is ≤ 1/3 of its amplitude.
- Overshoot exists only as a position keyframe, and is capped at 1.5% U.

### 13.6 Budgets this design spends

| Scene | Animated nodes |
|---|---|
| 1 | ~25 SVG/HTML |
| 2 | 8 + 2 dot-pattern rects (each ×2 tones) |
| 3 | ~30 (bounding-box pattern rects) |
| 4 | 1 canvas (≤ 950 facets per frame); DPR ≤ 1.5 at ≥ 1440 |
| 5 | 9 |
| 6 | ~25 |

- Total DOM < 250 nodes. Reduced-motion double instances add ≤ 100, and the contact sheet adds 3 canvases.
- JS for the engine plus six scenes is estimated at ≤ 30 KB gzipped. The font (Mode G) is 22.3 KB.

---

## 14. Feel

- **Scroll to frame.** The frame for scroll position y is visible on the next frame (≤ 16.7 ms), with no scrub smoothing or lag. Wheel, trackpad, keys, scrollbar drag and touch all behave natively.
- **Hover feedback** within 120 ms. **Press feedback** within 90 ms (scale 0.94, or translateY 1 px).
- **Tick navigation:** native smooth scroll landing at p = 0 of the target; instant under reduced motion.
- **Juice** (all position-based, so still deterministic):
  - Scene 1's prism stops with `settle` weight.
  - The hook's `lead` curve answers the very first pixels.
  - Scene 3's shapes overshoot the shelf by up to 1.5% U and settle.
  - Scene 5's beams pass the centre (outermost by 0.35 beam widths) and settle, so a sliver of fringe reappears at p ≈ 0.88 and vanishes, and the white *clicks* into agreement.
- **Admire timing:** chrome out 600 ms after 1,200 ms of stillness; placard at 3,000 ms; everything back within 160 ms of any input, with the scroll response immediate.
- **Rewind:** the whole piece in reverse in 8 s, cancelled on the same frame by any input.
- **Sound:** n/a. This is a silent piece about light. Autoplay audio is blocked by browsers, and sound would compete with stillness. There is no audio code.

### Grin moments
1. **The title goes out of register** on the first 40 px: the subtractive twin of the additive beam above it.
2. **The fan stands up** (Scene 1, p 0.6–1): seven rays become seven upright bands.
3. **Every Scene 2 plateau is a painting,** and the faint ink lattice quietly predicts what comes next.
4. **Dispersion you can count:** at Scene 3's rims each dot splits into its own R, G and B dots, and in the overlap the triplets spread wider still.
5. **The crystal shimmers when you stop** (Scene 4 admire mode).
6. **The click of agreement** (Scene 5, p 0.88 → 1).
7. **The placard notices you:** *04 · DICHROIC · HELD AT 62%* / "Light overhead; every facet answers."
8. **Run it backwards:** 8 s of the whole piece in reverse.
9. **The chorus,** and the white point you realise has been there the whole time.

---

## 15. Test contracts (for the test-engineer; success criteria 2–7)

### 15.1 Hooks the page must expose
- `window.__showcase = { progress(), stateAt(y), snapshot(), errors: [] }`.
- `snapshot()` returns `{ y, G, scene, p, state }` for the active scene, where `state.params` is the driving-parameter record (§3.3) and the shared geometry fields are as in §5.2.
- Each scene module exports `state(p, viewport)`, which is pure and unit-testable in Node.
- Key values are mirrored into `data-*` attributes.

### 15.2 Endpoint contract (F4; success criterion 3)
Viewport 1440×900 unless stated. Lengths are in px or % of U; ε = 1e-6 (0.01 px for geometry).

| Scene | `state(0)` asserts | `state(1)` asserts |
|---|---|---|
| 1 Incidence | rot 0; spread 6; split 0; titleOpacity 1; cueOpacity 1; s 0; prismOpacity 1; prismShift 0; glint alpha 1 | rot 22; spread 60; split 14; titleOpacity 0; cueOpacity 0; s 1; prismOpacity 0; prismShift −18% U; each wedge's 4 vertices = column i rect corners (`bandRects`) |
| 2 Field | A 0; c 0; shear 0; widths all 1/7; vertexInk 0; fillInk 0; white 0; whitePoint 0 | A 1; c 5; shear 0; widths = [0,0,0,0,0,1,0]; vertexInk 0; fillInk 0; white 0.55; whitePoint 1 (r 3) |
| 3 Refraction | tri u 110, rot 8°; cir u 112; dia u 130, rot −8°; channelScales [1.25, 1.40, 1.55]; dot grid as S2(1) | tri 25 / cir 50 / dia 75 (v 50, rot 0); glass alpha 1 |
| 4 Dichroic | J 0; θ 200; facetAlpha 0; edgeAlpha 0; quant 0; bandsAlpha 0; glassAlpha 1; fillDots .55; vertexDots .55; ρ 0 | J 0; θ 340; edgeAlpha 0; quant 1; bandsAlpha 1; glassAlpha 0; fillDots 0; vertexDots 0; white point alpha 0 |
| 5 Agreement | n 0; τ 0; hair 0; ov 0; beam rects = `bandRects` | n 1; τ 1; hair 0; ov 1; all 7 beam centres = U/2; width beamW (130 px at 1440) |
| 6 Return | widen 0; mix 0; spot 0; draw 0; beam 0; glass 0; card 0 | widen 1; mix 1; spot 1; draw 1; beam 1; glass 1; card 1; PrismSVG geometry = Scene 1 `state(0)` geometry (within 1 px), with no title or cue |
| **Global** | G(0) = 0; scene label "01 · Incidence"; tick 01 `aria-current`; stage top = 0 | G(D) = 1; stage top = 0 at `scrollY = D`; the colophon begins at `scrollY = D` on `--wall`; placard integer = round(100·G) |

**Pixel facts:**
- Scene 1 p = 0, title glyph centre: R, G and B each ≤ 3.
- Scene 5 p = 1: every pixel inside the beam rect is `#FFFFFF`.
- Scene 4: two runs give byte-identical canvas pixels at the same p and DPR.

### 15.3 E2E cases (named so the suite reads as a definition of "correct animation")

| ID | Case |
|---|---|
| E-D1 | **Determinism.** `stateAt(y)` deep-equal after visiting 4 other positions and returning; at 12 seeded y. |
| E-D2 | **No drift while stationary** (ambient paused): 2 s of `snapshot()` constant. |
| E-D3 | **Reversibility:** scroll down then up through every scene; the state at each of 30 positions matches the first pass. |
| E-S1…S5 | **Seams:** state gate (§5.2), then the pixel tolerance at 1440×900 and 375×812, DPR 1 and 2. |
| E-H0 | **Hold bands:** rules 1–4 of §3.3 on `params`, sampled at Δp = 0.0025 (unit level). |
| E-K1 | **Hook (F10):** a 40 px wheel from y = 0. `spread ≥ 10°` and `split ≥ 3 px`, and the screenshot differs from y = 0 on ≥ 1.0% of pixels at > 24/255. Run at 1440×900 and 375×812. |
| E-A1 | **No admire before the first scroll:** 5 s still from load → `data-admire` off. |
| E-A2 | **Admire enters** at 1,200 ms of stillness (`page.clock`); chrome hidden, pause at 0.55, live region text equals §7.7. |
| E-A3 | **Placard (F1):** at 3,000 ms the placard is visible with the correct label line and phrase; the caption is never at opacity 0 while the placard is at 0 (sampled every 50 ms). |
| E-A4 | **Exits on** wheel, key, pointerdown, touchstart, and pointermove ≥ 4 px; does **not** exit on pointermove < 4 px. |
| E-A5 | **Blocked** with focus on a tick; blocked during Rewind; **not** blocked with focus on the pause control. |
| E-A6 | **Space** in admire mode exits *and* scrolls (scrollY increases). |
| E-A7 | **Tab** in admire mode lands focus on a visible element (`checkVisibility()` true in the same task). |
| E-A8 | **Click / Enter / Space on the pause control** in admire mode toggles breathing and does not exit. |
| E-A9 | **Tab on the pause control** in admire mode exits synchronously. |
| E-A10 | **No admire in the colophon (F13):** at `scrollY = D + 200`, 5 s still → off. |
| E-A11 | **De-dup (F7):** enter, exit with a pointerdown, enter again at the same position → exactly one announcement; move into another phrase band → a second one. |
| E-R1 | **Rewind:** completes at y = 0 and focuses the wordmark; a wheel at 3 s stops it and announces the scene. |
| E-R2 | **Resize (F8):** 1440 → 375 → 1440 → scrollY identical, `snapshot()` deep-equal. |
| E-M1/M2 | **Reduced motion (F14):** no DocumentTimeline animations at rest; snapshot constant across each still range; pause control disabled; ticks jump instantly. |
| E-F1…F4 | **Flash audit (D6),** §10.1 rule 6. |
| E-H1 | **Health (F9):** full scroll-through (wheel, 120 ticks) → `__showcase.errors` deep-equals `[]`, 0 console errors, 0 unhandled rejections. |
| E-X1 | **axe** at each scene's hold position plus the colophon, at 375 / 768 / 1440 / 1920: no serious or critical violations. No horizontal overflow at those widths, or at 375 with 200% zoom. |
| E-T1 | **Ticks:** each lands at p = 0 (±1 px), `aria-current` updates, and hit boxes are ≥ 44 × 44 and non-overlapping. |
| E-P1 | **First paint (F15):** JS off vs booted p = 0 → < 0.5% of pixels differ (banner masked). |
| E-P2 | **Fonts (F11):** CLS ≤ 0.01 with a delayed font; the colophon p2 string matches the font state (F12). |

**Unit tests (U-):**
- U-1: the eases satisfy f(0) = 0 and f(1) = 1 and are monotone where specified.
- U-2: the `keys` interpolation.
- U-3: each scene's `state(0)` and `state(1)` (§15.2).
- U-4: the hold-band rules.
- U-5: the cursor schedule and the Scene 2 phrase boundaries.
- U-6: **`placardPhrase` returns the documented phrase at every band boundary and at each band's midpoint**, for every scene.
- U-7: the LUT has 256 entries and every hue lies in [165°, 345°].
- U-8: the mulberry32 sequence for seed `0xB3E7` is stable.

---

## 16. Cut order and de-risk fallbacks

### 16.1 Descope order (D5): cut strictly in this order, only as needed
1. The triangle–circle **double refraction** (Scene 3). The circle wins the overlap.
2. **Per-scene breathing variety** → the global breathing recipe (§7.8).
3. The **scene-label crossfade** → an instant swap.
4. The **1920-specific dot pitch** → `pitch = round(32 · vw / 1440)` above 1440, with lattice = 2 × pitch.
5. *(designer addition)* The Scene 4 **contact sheet** under reduced motion (F17).
6. *(designer addition)* Scene 2's **tone-on-tone ink dots**. The white dots still arrive over p 0.90–1.
7. *(designer addition)* The **OS-dark wall variant** (D9) → a single `--wall`.

**Non-negotiable:**
- the first-scroll hook (fan plus CMY split, F10);
- the seven-band chorus;
- identity seams (or the D1 fallback);
- the admire placard (F1/F2);
- the flash audit (D6);
- Run it backwards;
- the portrait axis swap;
- the hold bands (F3);
- the white point (F16).

### 16.2 Performance fallbacks (D2, D3), in order
- **Scene 4.** The first architecture spike measures Scene 4 at 1920×1080 with device DPR 2 (canvas capped at 1.5 → 4.67 Mpx) using the T-E5 rAF-delta harness. Then, in order:
  1. DPR 1.5 everywhere;
  2. dot pitch +4 px (and therefore lattice +8 px) at every viewport, keeping the lattice-equals-vertex-dots invariant;
  3. redraw only on a p change, with Scene 4 breathing rendered at ≤ 30 Hz.
- **Scene 3.** Bounding-box pattern rects are the baseline. Then, in order:
  1. cut item 1 (double refraction);
  2. 2 channel copies (R and B);
  3. render Scene 3 to canvas.

Frame timing is reported as evidence, not used as a hard gate (T-E7): it is headless SwiftShader.

---

## 17. The polish list (each item is checkable)

1. The JS-off first paint and the booted p = 0 frame differ by < 0.5% of pixels at > 8/255, with the noscript banner masked (F15).
2. The title plates in register produce pure black: at the glyph centre, R, G and B are each ≤ 3.
3. Every seam passes its state gate, and its pixel diff is ≤ 0.5% at 1440×900 and 375×812 (F5).
4. All seven bands in Scenes 1, 2, 4 and 5 meet without a hairline gap or overlap at 1×, 1.5× and 2× DPR. Band edges are snapped to device pixels.
5. Scene 2's overscanned shear never reveals ground at any p, at all five viewports.
6. Scene 3's R, G and B dots coincide (white) at each shape's centre. On the shelf at 1440, along the circle's horizontal radius, the outermost triplet shows three distinct colour peaks ≥ 6 px apart.
7. Scene 3's shape edges are anti-aliased with no clip-path stair-stepping; the `--glass-edge` stroke covers the clip boundary.
8. Scene 4's facets share edges exactly, with no seams (0.5 px same-colour stroke).
9. Scene 4 is byte-identical across two runs at the same p and DPR.
10. Scene 5 p = 1 is exact `#FFFFFF` across the full beam width, with no fringe pixels.
11. Scene 6 p = 1 matches Scene 1 p = 0 within 1 px in prism position, beam, glint and spectrum card. Only the title and cue are absent.
12. The scene-label numeral uses tabular figures, and the label never moves the wordmark.
13. The rail fill's gradient is in band order, and its leading white point reaches each tick exactly at that scene's p = 0.
14. The current tick's fill is that scene's key colour: vermilion, saffron, cobalt, jade, white, violet. On the light chip, the white tick gets an ink outline.
15. Tick hover labels never clip at the viewport edge; they flip side below 1024.
16. The chrome never fades while a hiding chrome element has focus or hover.
17. Breathing ramps in over 1,600 ms with no first-frame jump: the first-frame delta is ≤ 0.2 px or 0.05°.
18. On exit the ambient offset decays over 240 ms while the scroll response is immediate. No pop larger than 1 px.
19. `pointermove` under 4 px does not exit admire mode; a resting trackpad finger does not keep the chrome awake.
20. The pause choice survives reload. With `localStorage` blocked, the page works and defaults to on.
21. Under reduced motion, the pause control is focusable, explains why it is off, and does nothing on activation.
22. Caption changes never show two captions both above 50% opacity.
23. Every chip passes ≥ 7:1 over the brightest and darkest frame beneath it (test: S2 saffron plateau, S4 p 0.5, S5 p 0.25).
24. The focus ring is visible on wall, saffron, cobalt, mosaic and ink. Screenshot each.
25. No horizontal scrollbar at 375 px under 200% zoom.
26. Rewind is cancelled by wheel, key, pointerdown and touch, and announces "Rewind stopped." with the scene name.
27. During a rewind, admire mode never triggers and the chrome stays visible.
28. The font swaps with CLS ≤ 0.01, and the title box width changes by ≤ 2% (F11). (Mode S: no swap.)
29. The prism's fringe lines stay 1 px at every DPR and rotation (`vector-effect: non-scaling-stroke`).
30. The colophon begins on the same `--wall` as Scene 6 p = 1, in both colour schemes, with no colour step where the stage unpins.
31. The placard appears at 3,000 ms (±50 ms) of stillness, fades in over 900 ms, and shows `NN · SCENE · HELD AT G%` with the correct integer (F1).
32. In admire mode the caption corner is never empty: the caption is visible until the placard is visible (D8).
33. Space in admire mode both exits and scrolls (F6).
34. Tab in admire mode lands on a visible control within the same task (F6).
35. Clicking, Enter or Space on the pause control in admire mode toggles breathing without exiting; Tab from it exits synchronously (F6).
36. Pausing repeatedly at the same spot announces once; moving to a new phrase band announces again (F7).
37. 1440 → 375 → 1440 restores the identical scrollY and frame (F8).
38. A full scroll-through leaves `__showcase.errors` empty, with zero console errors (F9).
39. The placard phrase is correct at every band boundary, including under reduced motion, where it uses the still's p (F2).
40. 40 px of first scroll visibly opens the fan (+68 px far edge at 1440) and splits the plates (≥ 3 px) (F10).
41. The white point is visible in Scenes 1–4 and on the rail, never more than one at a time on the stage, and never larger than 6 px (F16).
42. Every tick's hit box is 44 × 44 at every pointer type, and no two overlap (D7).
43. In every hold band the picture changes slowly (≤ 25% of the average rate) but perceptibly (by the named creep), except the Scene 6 rest (F3).
44. The Scene 1 fan's mid-morph wedges never overlap or gap at any s (orientation-preserving lerp).
45. The JS-off page is the opening frame plus the colophon, with no 15-viewport scroll over a frozen frame.

## 18. Anti-goals

- Never a dark page with neon things on it. In this piece the colour is the ground.
- Never the famous album-cover composition: no prism on a black ground, no angled beam in and rainbow out.
- Never rainbow gradients inside a band, "holographic" noise or glow blur.
- Never strobe, flicker, rapid hue cycling or op-art stripe gratings.
- Never scroll-jacking, scrub smoothing, mandatory snap or a smooth-scroll library (P2).
- Never text that animates letter by letter, and never body copy gated by motion (P3/P7).
- Never "demo reel" seams: no fade-to-black between scenes, and no empty scroll.
- Never a hold that reads as broken. No static stretch longer than 22 svh, and only the designed Scene 6 rest is static.
- Never decorative particles. Every element is light, glass, the surface the light falls on, or the white point.
- Never a second protagonist. The white point stays one small mark.

## 19. Acceptance by eye (what polish-critic captures)

- **Every scene at p = 0, 0.25, 0.5, 0.75 and 1**, at 1440×900 and 375×812 (60 shots). Each must match its row in §4.
- **Every hold band**, at its start, middle and end, at 1440×900: three nearly identical but not identical frames per scene, and three identical frames for Scene 6.
- **All five seams** as before/after pairs at 1440×900, with the diffs attached.
- **The hook pair:** y = 0 and y = 40 px at 1440×900 and 375×812.
- **Three hero frames at 1920×1080:** Scene 1 p 0.5 (fan), Scene 4 p 0.5 (mosaic peak) and Scene 5 p 0.5 (chord).
- **20 random positions** (seeded) at 1440×900. The critic asks of each: would I screenshot this?
- **Admire mode:** Scene 4 p 0.5 with chrome visible, then at 2 s (chrome gone, caption still there), then at 4.5 s (placard). Two frames 6 s apart show the shimmer has moved.
- **Chrome states:** tick hover, tick focus, pause in its three states, both chip themes, the noscript page, the scene-error chip and the placard on both chip themes.
- **Reduced motion:** three stills for every scene, one crossfade midpoint (Scene 2, p 0.25), and the Scene 4 contact sheet at 1440.
- **Viewports 768×1024 and 1024×768:** Scene 2 p 0.5 and Scene 3 p 1 (the shelf, horizontal and vertical).
- **The font modes:** the Scene 1 p = 0 title in Mode G and in the fallback face, side by side; plus Mode S if chosen.
- **OS dark scheme:** Scene 1 p = 0 and the colophon.
- **Flash audit plots:** the Ȳ profile per scene, the rewind time-series and the tick-05 navigation, all in `evidence/flash-audit/`.
- **Director's Gate 2 check:** the Scene 1 frames, against the album-cover resemblance.

---

## 20. Risks, stated honestly

| Risk | Likelihood | Mitigation or fallback |
|---|---|---|
| Identity seams need two modules (SVG/DOM/canvas) to render pixel-equal frames. | medium | Shared geometry; the state gate first (F5); the D1 crossfade fallback with one fix round at most. |
| Scene 3 paint cost (3 shapes × 3 pattern copies, `screen`, nested clip) | low–medium | The director's probe held 16.7 ms p95 at 1440 with full-viewport rects. Bounding-box rects are cheaper still. §16.2 fallbacks. |
| Scene 4 canvas at 1920 | low–medium | Spike first; DPR cap; LUT; ordered fallbacks that keep the lattice invariant (§16.2). |
| Seven `screen` layers in Scene 5 | low | Only during Scene 5, and the beams are narrow after p 0.25. |
| `local()` names for fallback faces vary across OSes | low | Several names are listed per face. If none matches, the stack continues to Helvetica Neue / Arial / Liberation unadjusted, which costs a small swap shift (still measured by E-P2 here). |
| A hold band feels like a stall on a fast trackpad | low | Each band is ≤ 45 svh, and the creeps are perceptible (§3.3). Director-vision watches P3. |
| Flash-audit replay differs from the live smooth-scroll curve | low | Positions are recorded from the real run, then replayed, so frames are exact for those positions. |
| A user fling through Scene 6 is one dark → light full-field change | low | A single transition, not a pattern, and user-driven. Gates F2 and F3 cover the scripted cases. |
| Portrait axis swap: every scene must hold in both orientations | medium | One (u, v) geometry; e2e captures at 375 and 768 portrait. |
| Real iOS toolbar and touch momentum cannot be verified here (T-E3) | known | `svh` stages and cached offsets. Flagged as an unverified environment gap. |
| Resemblance to famous prism imagery | low | The anti-goal, plus director-vision at Gate 2. |

**What this consolidation raised or corrected beyond the fold-in orders:**
- **The first-scroll maths was wrong in the proposal.** `glide` from p = 0 gives only 0.16° at 100 px, not the claimed +3.5°. The new `lead` curve delivers +68 px of fan at 40 px.
- **Scene 3's start positions contradicted their own frame description.** The triangle now starts at u 110%.
- **Scene 1 → 2's luminance values disagreed across an identity seam** (0.40 against 0.30). The profile is now computed: 0.32 on both sides.
- **The wedge morph was under-specified and would overlap mid-morph.** It is now an orientation-preserving vertex map.
- **The stage-pin contract (`D = Σ L_s`)** is made explicit, so the stage cannot unpin 100 svh early.
- **Mode S** is a deliberate neo-grotesk, not a generic `system-ui`.

## 21. Notes for the architect

- **Suggested work-order split:**
  1. engine and chrome (admire, placard, rewind, hooks);
  2. geometry, tokens, eases, `keys` and the LUT;
  3. Scenes 1 and 6 (one SVG module, two modes);
  4. Scenes 2 and 5 (the `Bands` component);
  5. Scene 3;
  6. Scene 4, after the spike;
  7. the reduced-motion cut, the flash audit and the seam tests.
- **Shared components:**
  - `Bands` (Scene 1's end, Scene 2, Scene 4's end, Scene 5);
  - `PrismSVG` (Scenes 1 and 6);
  - `DotGrid` with vertex and fill subsets (Scene 2's end, Scene 3, Scene 4's start);
  - `Shelf` (Scene 3's end, Scene 4's start);
  - `WhitePoint`.
- **Interface:** each scene exports `state(p, viewport)`, whose result includes `params`, and `apply(state, ambient)`. The engine exposes `window.__showcase` (§15.1).
- **Decisions that are yours:**
  - Mode G or Mode S for the font (§13.2);
  - how the sticky container meets the §3.2 pin contract;
  - whether the D1 fallback is triggered.

---

## Appendix A: output of `verify_maths.py` (this consolidation)

```
== F3 hold bands: max in-band |dx/dp| / TV(x) (limit 0.25); creep TV-in-band
 S1 band [0.45,0.6] worst 0.185 (spread)  creep spread: +1.500
 S2 band [0.722,0.781] worst 0.204 (c)  creep c: +0.060
 S3 band [0.42,0.58] worst 0.099 (cir)  creep tri: -1.000
 S4 band [0.44,0.56] worst 0.208 (th)  creep th: +3.500
 S5 band [0.25,0.4] worst 0.203 (tau)  creep tau: +0.035
 S6 band [0.4,0.52] worst 0.000 ()  creep None: +0.000
== F10: first 40 px at 1440x900 (S1 track 220svh = 1980px)
  p=0.0000 spread 6.00 deg far-edge 87px split 0.00px rot 0.00
  p=0.0202 spread 10.61 deg far-edge 155px split 3.13px rot 2.56
== D4: S2 (300svh) step geometry and mean Y
  step 50.4 svh; hold 17.6 svh; move 32.8 svh
  meanY at p=0,.25,.5,.75,1: [0.317, 0.356, 0.433, 0.32, 0.12] max 0.479 at p 0.415
  early dip 0.269 at p 0.0975; direction reversals (hysteresis .01): 2
  max vermilion share 0.634
  mean-Y change per step: [0.073, 0.124, -0.081, -0.075, -0.132]
== D7: min tick spacing (min track 220 of 1500 svh)
  rail 330px: 48.4px   1024x768 44svh: 49.6px   375 horizontal: 50.3px
== D9: wall L 0.946 -> #F0EDE7 Y 0.847; wall-deep L 0.883 -> #DDD8D0 Y 0.688
   contrast ink on #F6F3ED 17.3:1; on #F0EDE7 16.4:1
```

The far-edge height assumes the prism's exit face is 834 px from the right edge at 1440×900. The luminance figures use an area model of band widths (unsheared, dots ignored). The flash audit (§10.1) measures the real frames.

## Appendix B: font measurements (bundled Chromium 157, canvas `measureText` at 1000 px)

```
"Bent Light" @700:     Space Grotesk w 5057 asc 984 desc 292 | Liberation Sans w 4943 asc 905 desc 212 | Inter w 4940
caption line @400:     Space Grotesk w 29130                 | Liberation Sans w 26684
size-adjust 700 = 5057/4943 = 102.3%; 400 = 29130/26684 = 109.2%
ascent-override = 98.4% / size-adjust (96.2%, 90.1%); descent-override = 29.2% / size-adjust (28.5%, 26.7%)
npm pack @fontsource-variable/space-grotesk@5.3.0 -> license OFL-1.1; files/space-grotesk-latin-wght-normal.woff2 = 22,288 B
fc-match sans-serif -> Inter; fc-match system-ui -> Inter (so system-ui is not representative here)
```
