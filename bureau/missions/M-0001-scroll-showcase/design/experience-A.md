# Experience spec A: "Nocturne" (M-0001, scroll-driven animation showcase)

Bake-off proposal A · experience-designer · discipline: motion · 2026-11-20
Direction: **Nocturne**, a luminous night piece. Deep darkness, light as the only material, slow and contemplative, cosmic in scale.

> Sources this spec builds on: `brief.md` (definition of exceptional 1–7, scope, A1–A6), `intel/references.md` (ranked principles 1–12, cited below as **P1…P12**), `intel/technique.md` (budgets: ≤ ~1,000 animated nodes per active scene, measured at `technique.md` E4/E5; idle timer 1.2 s, E3; 2-rAF test waits, E2), `bureau/playbooks/interactive-web.md` ("The experience spec must also cover"), `bureau/QUALITY_BAR.md`.

---

## North star

**One point of light carries you from arm's length to the width of a galaxy and home again by dawn, and wherever you stop scrolling, the night is a finished photograph of the sky.**

Reviewer test: stop at any of 20 random scroll positions. Each frame must (a) contain the Ember, the single persistent light, (b) read as a deliberate night-sky composition with no element clipped mid-entry, and (c) be pixel-identical when you scroll away and come back.

---

## The piece at a glance

**Title:** *Nocturne*. Subtitle: *A night, scrolled slowly.*

**Arc:** a single night told as a journey in scale, framed as six **plates** (the word the piece uses for its scenes, as in a star atlas). The scale climbs from 10⁰ m to 10²¹ m and then folds back to 10⁰ m at dawn. A **scale readout** in the corner tracks it, and it is the piece's spine (after Powers of Ten; see References).

| # | Plate | Scale | Tempo | Technique (primary) | Track length |
|---|---|---|---|---|---|
| I | **Ember** | 10⁰ m · arm's length | slow open | SVG + DOM transforms (rings, letter spans) | 180 svh |
| II | **Aurora** | 10⁵ m · the height of an aurora | flowing | SVG path morph (4 ribbons × 160 pts), additive blend | 240 svh |
| III | **Orbit** | 10⁸ m · a moon's distance | held | SVG geometry (horizon bends into a planet), canvas ring dust | 240 svh |
| IV | **Constellations** | 10¹⁷ m · ten light-years | dense, then still | Canvas star field + SVG line drawing (stroke-dashoffset) + labels | 280 svh |
| V | **Spiral** | 10²¹ m · the width of a galaxy | **peak** | Canvas 2D particle galaxy, differential rotation | 320 svh |
| VI | **Dawn** | 10⁰ m · home | rest | Gradient-layer crossfades, flat horizon, the morning star | 200 svh |
| — | Colophon | — | normal page | Static HTML in normal flow | auto (~110 svh) |

Total scrubbed track: **1,460 svh**. Track lengths vary from 180 to 320 so the piece has a tempo, with dense plates between quiet ones (P3).

**The Ember** is the hand-off element (P4). It is one warm point of light that exists in every frame of every plate: a lantern on still water, the star over the aurora, the moon, the brightest star of a constellation, the galaxy's core, and finally the morning star. Its position is a pure function of global progress, and it never jumps.

---

## Reference points

Take craft, never content. Nothing below is copied in look, layout or copy.

| Reference | The specific craft we take from it |
|---|---|
| *Powers of Ten* (Charles & Ray Eames, 1977 short film) | A **logarithmic scale progression with an on-screen numeric readout** as the narrative spine. Our readout shows `10ⁿ m` plus a plain-language anchor ("a moon's distance"). We take the device only: our imagery, scales and journey are our own. |
| Hand-engraved celestial atlases (17th–19th c. star charts) | **Hierarchy of line weight**: hairline constellation strokes (1 px at 30% opacity) under brighter star points, with labels set in letterspaced small caps. Also the word **"plate"** for each composed frame. |
| Long-exposure aurora photography (as a physical reference) | **Physically ordered colour**: green at the base of the curtain, teal mid, violet or red fringe at the top; vertical curtain structure with soft upper falloff; light **adds** (screen/additive), it never covers. |
| Apple-style product scroll pages (as described in `references.md` §B) | **Frame = f(progress)** on a pinned stage, and **match cuts**: the last frame of one section is the first frame of the next. We take only the continuity discipline. Nothing image-sequence based (`references.md` §B rules it out for our budget). |
| The Pudding's sticky scrollytelling (`references.md` §A) | **Text scrolls in normal flow over a full-bleed sticky stage**, so copy is never gated behind motion (P7). |

---

## Architecture asks that come from the design (architect decides; these are the design's needs)

1. **One stage, six tracks.** For true hand-offs there must be no stage-slides-off-screen seam between plates. Design need: a single `position: sticky; top: 0; height: 100svh` stage that stays pinned across all 1,460 svh, with six track sections in normal flow defining each plate's progress range. Plates are layers inside that one stage. If the architect keeps one stage per plate instead, the **match-cut contract** below still has to hold visually, and the seam has to be invisible.
2. **Persistent layers** (state is a function of global progress P ∈ [0,1], which is still a pure function of scroll):
   - `sky` – one full-stage canvas (stars, ring dust, galaxy particles). Particles hand off between plates III → IV → V → VI, so they are one seeded system.
   - `horizon` – one SVG path (flat line → arc → planet limb → gone → flat line).
   - `ember` – one DOM/SVG element (core + halo).
   - `readout` – chrome text.
3. **Per-plate layers:** SVG groups and display type that exist only within their plate's range (plus its overlap).
4. **Match-cut contract (testable):** for every boundary k between plate N and N+1, `frame(N, p=1) ≡ frame(N+1, p=0)`. The persistent layers are continuous by construction; per-plate layers must be at zero opacity or identical at the boundary. **Test:** screenshots at boundary −2 px and +2 px of scroll differ by ≤ 0.5% of pixels at a per-channel tolerance of 8/255 (canvas anti-aliasing noise). This is how "one authored piece" becomes checkable.
5. **Determinism:** all randomness comes from one seeded PRNG (mulberry32, seed `0x4E4F4354`, "NOCT"). No `Math.random()`, no `Date.now()`, and no time in any `state(p)`. Time only exists in the ambient (admire) layer.
6. **No scrub smoothing.** The frame equals the position on every rAF (latency 0 frames beyond the platform's one-frame lag, `technique.md` E2). Easing lives inside `state(p)` as pure remaps, never as temporal lag.

**Layer stack, back to front:** L0 sky gradients (3 stacked full-stage gradient `div`s, crossfaded by opacity only) → L1 `sky` canvas → L2 plate SVG → L3 `horizon` SVG → L4 `ember` → L5 display type (title, constellation labels, "Good morning.") → flow captions (normal document flow, above the stage) → fixed chrome.

**Helpers used in the frame tables:** `seg(p,a,b)` = clamp((p−a)/(b−a), 0, 1); `ss(x)` = smoothstep; `ios(x)` = ease-in-out-sine. Coordinates are fractions of stage width/height (x, y), with (0,0) top-left. Sizes are in `vmin` unless marked. Values given are for **1440×900**; responsive deltas follow later.

**Hold bands:** every plate has one hold band, the stretch where its signature composition sits, in which all state changes at ≤ 25% of the plate's average rate. The band is marked in each table. A visitor who stops roughly in the middle of a plate lands on the plate's signature picture (P1, P3).

---

## The plates, frame by frame

Each table gives the composed frame at p = 0, .25, .5, .75, 1, followed by "why every stop is composed", which covers the in-betweens.

### Plate I: Ember (10⁰ m, 180 svh, slow open)

**Technique:** inline SVG + DOM transforms. 7 ripple rings (SVG `ellipse`, transform scale + opacity), 8 title letter `span`s (transform + opacity), Ember (SVG radial gradient halo + core). Sky canvas shows 24 dim stars. Animated nodes ≈ 20.

| p | Frame |
|---|---|
| **0** (first paint) | Void: L0 gradient `--ink-0` at top to `--ink-2` at the horizon, then `--ink-1` below. Horizon hairline across the full width at y .72, 1 px, `--star-white` at 35%, fading to 0% over the outer 12% at each end. **Ember** sits on the horizon at (.50, .72): core 0.9 vmin `--ember-core`, halo radius 14 vmin `--ember` falling to 0. A faint reflection streak sits below it (a vertical ellipse 0.6×6 vmin, 20%). Title **Nocturne** is centred at y .38 in display italic, tracking 0.02em. Subtitle *A night, scrolled slowly.* at y .49. Scroll cue at the bottom. 24 stars at 25% opacity above the horizon. **Already a finished picture: a lantern at the edge of still water.** |
| **.25** | Rings 1–3 have spread from the Ember **along the ground plane** as flattened ellipses (ry = 0.16·rx): rx 8 / 18 / 30 vmin, opacity .40 / .25 / .12, so light ripples outward on water. Ember lifted to y .66, and its reflection streak has stretched to 9 vmin. Title letters drift apart symmetrically: letter i translates x by (i − 3.5)·1.4 vmin and y by −2 vmin, at opacity .55. It reads as deliberately wide-tracked display type, not as breaking text. |
| **.5** (hold .42–.58) | **Signature plate, "Lantern on still water".** All 7 rings out, from rx 8 to 70 vmin; the outermost brushes the screen edges at 6% opacity. The title has fully dissolved (opacity 0 by p .45). Ember at (.50, .58), halo 18 vmin. 60 stars at 35%. The concentric target and its reflection make a symmetric image. |
| **.75** | Rings fade to 40% of their values and keep spreading. Ember at (.50, .46), halo shrinking to 14 vmin and shifting from `--ember` toward `--star-white` (lerp 30%). The second sky gradient (dusk) fades to 60%: a `--dusk-violet` band hugs the horizon. A first whisper of `--aurora-green` (10%, 4% of stage height) sits on the horizon. |
| **1** | Rings gone. Ember at (.50, .40), halo 12 vmin, 50% of the way to white. Horizon intact. A dusk band with a green trace. **This frame equals Aurora p = 0.** |

**Why every stop is composed:** everything is mirror-symmetric about x = .5 and the Ember sits on the axis at all times. Rings are concentric, so any subset is a valid target. Letters spread symmetrically, so any mid-state reads as tracking. Nothing enters from off-screen.

**First-scroll response (P12):** the first 8% of the track (≈ 130 px at 1440×900) drives ring 1 from rx 0 to 8 vmin and the letters to +0.4 vmin. At 40 px of scroll the ring is already visibly 2.5 vmin wide and the title has visibly opened. A reaction is guaranteed inside the first flick.

### Plate II: Aurora (10⁵ m, 240 svh, flowing)

**Technique:** SVG path morph. 4 ribbons, each a closed path: a 160-point top edge `y(x) = base − h·env(x)·(1 + Σₖ aₖ sin(kₖx + φₖ + ωₖp))`, a bottom edge on the horizon, and a vertical `linearGradient` fill (transparent at top → colour → transparent at the base). `mix-blend-mode: screen`. Reflections below the horizon via `<use>` with `scaleY(−0.55)` at 18% opacity behind a gradient mask, which adds no extra points. That is 640 points per frame, well under the 10k cap (`technique.md` E4). Animated nodes ≈ 12.

| p | Frame |
|---|---|
| **0** | Equals Ember p = 1. |
| **.25** | Two ribbons (`--aurora-green`, `--aurora-teal`) have risen to 18% of stage height as one gentle fold, left of centre (envelope peak at x .38). Ember at (.50, .36) is now a star: halo 10 vmin, colour 80% white. Their reflections shimmer faintly below the horizon. 120 stars. |
| **.5** (hold .44–.60) | **Signature plate, "Curtains".** Four ribbons: green base, teal, violet fringe (`--aurora-violet`, the tallest at 42% of stage height), and a thin `--aurora-rose` upper fringe at 25%. The folds are deep, and the envelope spans x .12 to .88, leaving a dark gap at top centre where the Ember sits like the curtains' clasp. The reflections double the light into the water. 180 stars, dimmed to 60% where the ribbons are, by drawing order and screen blending. |
| **.75** | Ribbons drift right (envelope peak x .62), thin out (amplitudes × .5), and the violet becomes dominant. Folds tighten. The reflections fade to 8%. |
| **1** | The four ribbons merge into one thin luminous band (2% of stage height) hugging the horizon at y .70, and **the horizon has started to sag** (centre 0.5% lower than the edges). Ember at (.50, .30). **Equals Orbit p = 0.** |

**Why composed:** the ribbon envelope is always a smooth hump with zero height at its ends (no hard edges). The Ember is always above the envelope gap. Fold phases change by at most 0.5 rad per 100 px of scroll, so every frame is a plausible long exposure, never a tangle.

### Plate III: Orbit (10⁸ m, 240 svh, held). Grin: *the horizon bends*

**Technique:** SVG geometry. The `horizon` path morphs between a line and a circular arc (one 96-point path; a circle of radius R centred below the stage, with R shrinking from 40× the stage width to the planet radius). The planet disk has a rim-light stroke gradient; orbit ellipses are drawn as a back half and a front half for occlusion. Ring dust is 720 particles on the `sky` canvas. Animated nodes ≈ 16 SVG + canvas.

| p | Frame |
|---|---|
| **0** | Equals Aurora p = 1. |
| **.25** | **The horizon has bent into a broad arc**: R = 3× the stage width, the apex at y .66, and the ends dropping off the bottom corners. Its line turns `--planet-rim` with a 2 px glow on the upper-left. The aurora band rides the curve as a thin green crown. Below the arc the ground deepens to `--ink-0` (the planet's night side). Ember at (.62, .28). Readout ticks 10⁵ → 10⁶. |
| **.5** (hold .42–.60) | **Signature plate, "A world".** The planet is a full disk, radius 22 vmin, centred at (.50, .64), with a crescent rim light on its upper-left limb and the aurora as a 0.4 vmin green halo arc at its top. One orbit ellipse (rx 40, ry 9 vmin, rotated −12°) is a hairline at 30%, passing behind the disk and in front of it. The Ember, now **the moon**, sits on that orbit at (.79, .52). 720 dust particles lie along the ellipse at 15–40% alpha. 300 stars. |
| **.75** | **Viewpoint rises** (an accent, applied to the orbit geometry only and never to the whole field, per P11): the ellipse ry grows from 9 to 26 vmin. Two outer orbits appear (rx 56 and 72 vmin, dashed 2/10, dash offset = f(p)). The planet scales down to 12 vmin, and the moon moves along its orbit (angle = 40° + 160°·ios(seg(p,.6,1))). |
| **1** | **An orrery**: the planet is a 4 vmin blue disc at (.50, .50), with three near-circular orbits (ry/rx = .92) centred on it. The moon sits at 12 o'clock on the inner orbit (.50, .38). The outer orbits are breaking into points (dust particles lerping 10% toward star positions). 400 stars. **Equals Constellations p = 0.** |

**Why composed:** the arc is always a single clean curve (a radius change, never a kink). The disk is centred on the axis. Every orbit stays a closed ellipse. The moon is always *on* its orbit path (its angle is computed on the same ellipse).

### Plate IV: Constellations (10¹⁷ m, 280 svh, dense then still)

**Technique:** canvas star field (up to 1,600 stars, power-law brightness, the brightest 120 drawn with a pre-rendered glow sprite). SVG line drawing: 3 invented constellations (24 stars, 24 lines) using `stroke-dasharray` set to each line's length and `stroke-dashoffset = len·(1 − draw(p))`. Labels are HTML display text with opacity tied to line completion. A soft dust band (a pre-rendered blurred ellipse, as a CSS radial gradient on a rotated div at 12% opacity) runs diagonally. Animated nodes ≈ 60.

**The three constellations** (original, local box coordinates 0–1; the box size and centre come from the layout table):

| Name | Stars (x, y) | Lines |
|---|---|---|
| **The Lantern** (7) | 0 hook (.50,.00) · 1 shoulder (.50,.18) · 2 (.36,.30) · 3 (.64,.30) · 4 (.30,.78) · 5 (.70,.78) · 6 **flame = the Ember** (.50,.52) | 0-1, 1-2, 1-3, 2-3, 2-4, 3-5, 4-5. **The flame is deliberately unconnected**: it floats inside the frame of the lantern. |
| **The Heron** (9) | 0 beak (.05,.20) · 1 head (.22,.16) · 2 neck (.34,.30) · 3 neck base (.40,.48) · 4 back (.70,.44) · 5 tail (.92,.52) · 6 belly (.60,.60) · 7 knee (.56,.82) · 8 foot (.62,1.00) | 0-1, 1-2, 2-3, 3-4, 4-5, 5-6, 6-3, 6-7, 7-8 |
| **The Open Hand** (8) | 0 wrist (.50,1.00) · 1 palm L (.30,.62) · 2 palm R (.70,.60) · 3 thumb (.08,.40) · 4 index (.30,.05) · 5 middle (.50,.00) · 6 ring (.66,.06) · 7 little (.84,.22) | 0-1, 0-2, 1-2, 1-3, 1-4, 2-5, 2-6, 2-7 |

**Layout at 1440:** Lantern box centred (.30, .50), 28 vmin · Heron (.70, .30), 32 vmin · Hand (.70, .72), 24 vmin. Draw order: Lantern p .18–.42, Heron .34–.60, Hand .52–.72. Each line draws in sequence within its constellation's range.

| p | Frame |
|---|---|
| **0** | Equals Orbit p = 1. |
| **.25** | The orrery has dissolved: the orbits fade to 0 and the planet has shrunk to a single star at (.50, .50), just another point. The moon (Ember) has travelled to the Lantern's flame position. 1,200 stars; the dust band at 12%; the sky gradient warms slightly to `--ink-2`. Lantern lines 1–2 are drawn. |
| **.5** (hold .48–.56) | The Lantern is complete. Its label **THE LANTERN** sits at 100% under the figure, and its stars carry a **completion flare**: brightness +40% across p .42–.44, settling by .46. The flare is a function of p, so it is deterministic. The Heron is two-thirds drawn, neck and back. 1,500 stars. |
| **.75** (hold .72–.86) | **Signature plate, "A chart of the sky".** All three figures complete and labelled, every line at 30% opacity and every star bright. This is the longest hold in the piece (14% of 280 svh ≈ 39 svh): a stretch of scroll where the visitor can simply read the sky. |
| **1** | The lines fade to 15% and the labels to 0. Star positions have lerped 10% toward their galaxy positions, and the dust band has rotated to the galactic plane angle (−20°). The Ember is at the centre (.50, .50) as the brightest point. **Equals Spiral p = 0.** |

**Why composed:** a partly drawn constellation always ends at a star (lines complete in order, and each line's draw window snaps visually because the tip carries a 1.5 vmin glow dot that sits on a star at each window's end). Labels never appear before their figure is 80% drawn.

### Plate V: Spiral (10²¹ m, 320 svh, **the peak**)

**Technique:** canvas 2D. Up to 2,400 particles (see the responsive table), `globalCompositeOperation = 'lighter'`, glow sprite on the brightest 150, 1 px squares for the rest. Each particle i has a seeded radius rᵢ (exponential disc), arm index, and base angle θ₀ᵢ. The position is `θᵢ(p) = θ₀ᵢ + W(p)·ln(rᵢ) + Ω(rᵢ)·S(p)` with `Ω ∝ rᵢ^−0.5` (differential rotation: inner stars turn faster, so arms wind). The disc is drawn with a fixed tilt (y × .55, rotated −20°). There is no camera move. Colours: core `--core-gold` to `--ember`, arms `--star-white`/`--planet-rim`, and 2% of particles as `--aurora-rose` knots (star-forming regions). The vestibular cap: an outer-disc particle moves ≤ 6° of angle per 100 px of scroll.

| p | Frame |
|---|---|
| **0** | Equals Constellations p = 1. |
| **.25** | The stars have flowed into a loose disc and two arms are emerging at 50% contrast. The core glow is 8 vmin. The readout races 10¹⁷ → 10¹⁹. |
| **.5** (hold .46–.62, where S(p) flattens) | **Signature plate, "The galaxy".** Two full arms, 1.5 turns, peak density. A gold core with a 14 vmin halo **is the Ember**. Rose knots strung along the arms. The disc spans 84% of the stage width. Readout **10²¹ m · the width of a galaxy**. This is the peak of the piece. |
| **.75** | The winding increases (W: 1.5 → 3 turns), the disc contracts to 70% of its radius, and brightness concentrates toward the core. The arms are now fine, tightly wound threads. |
| **1** | Everything has spiralled in: all particles lie within 3 vmin of the centre and the core is a single brilliant point with a 30 vmin halo. The background is pure `--ink-0`. **Equals Dawn p = 0.** |

**Why composed:** the spiral is always a rotationally coherent disc (the same formula at all p). Contraction is radial and monotonic, so no particle crosses the screen. The hold band makes the signature plate easy to stop on.

**Rewind grin:** scrolling up through this plate visibly **unwinds the galaxy**. This is the brief's reversibility (exceptional #4) made into spectacle.

### Plate VI: Dawn (10⁰ m, 200 svh, rest)

**Technique:** L0 gradient layers crossfade (night → pre-dawn → dawn) by opacity only. The `horizon` path returns to a flat line. The `sky` canvas thins out. The reflection streak is 12 SVG dashes. The display line "Good morning." is opacity only. Animated nodes ≈ 20.

| p | Frame |
|---|---|
| **0** | Equals Spiral p = 1: one brilliant point on black. |
| **.25** | The halo contracts to star size (8 vmin). The horizon fades back in as a flat hairline at y .72 (35%). 60 ordinary stars return. The Ember drifts toward the east: (.56, .40). The readout counts down 10²¹ → 10⁷. |
| **.5** | **Pre-dawn**: the lowest 20% of the sky shifts toward `--predawn` (#1B2550), with a 4% `--dawn-rose` line on the horizon. Stars at 60%. The Ember at (.60, .36). |
| **.75** (hold .70–.84) | **Signature plate, "The morning star".** A dawn band runs from `--dawn-rose` to `--dawn-gold`, 18% of stage height above the horizon, fading upward into `--predawn`. Only the 8 brightest stars remain. The Ember is a sharp white **morning star** at (.62, .34) with a 6 vmin halo. Its gold reflection streak lies across the water as 12 dashes below the horizon. |
| **1** | Same composition, with **Good morning.** in display italic at (.50, .52) at 100% (opacity ramps across p .80–.95). Readout **10⁰ m · home**. The stage then releases and the colophon rises from below the horizon like the sea (its background is `--ink-1`, continuous with the water). |

**Why composed:** a horizon, a single star and a gradient form a classic minimal landscape at every intermediate value. Opacity-only crossfades cannot produce an awkward state.

### Transitions (summary)

Every boundary is a **match cut on the Ember** (contract above). The hand-offs:

| Boundary | What carries over | How it changes |
|---|---|---|
| I → II | Ember, horizon, dusk band | The lantern rises and becomes the star above the aurora. The green trace on the horizon is the seed of the ribbons. |
| II → III | Ember, horizon, aurora band | The merged ribbon lies on the horizon. **The horizon bends** and the aurora becomes the planet's crown. |
| III → IV | Ember (moon), star field, dust particles | The orbits break into points. The planet shrinks to a star. The moon becomes the Lantern's flame. |
| IV → V | Ember, every star | The star field is pulled into the disc. The constellation lines fade as their stars are swept into the arms. |
| V → VI | Ember (core) | The galaxy collapses into the single point that becomes the morning star. |
| VI → colophon | Horizon / water | The stage unsticks. The colophon's dark background reads as the sea below the dawn. |

**Readout between plates:** the exponent equals its plate value at each plate's p = .5 and is linearly interpolated (rounded to an integer for display) between the midpoints of neighbouring plates. The plain-language label switches at the exponent's halfway point. The digits change discretely with scroll and never tween on time.

---

## The moments

### First 5 seconds (no scroll yet)

- **0 ms (first paint, before JS):** the Ember, horizon, title, subtitle and scroll cue are all inline SVG/HTML with inline critical CSS. The opening frame is finished art (P12, exceptional #1). No loader, no fade-in, no "intro".
- **≤ 1 frame after JS runs:** the sky canvas draws its 24 dim stars. They sit at 25% opacity, so their arrival never reads as a pop.
- **0–4.8 s:** the only time-based motion before input is the **scroll cue**. Inside the cue's 1 × 32 px track, a 1 × 10 px light slides top to bottom over 2,400 ms with ease-in-out, **twice**, then rests at the bottom. That totals 4.8 s, under WCAG 2.2.2's 5 s threshold, and it is off under reduced motion. Everything else is still: the opening frame is a photograph.
- **First wheel tick / keypress / swipe:** within the first ~40 px a ring visibly ripples outward and the title opens up (see Plate I, first-scroll response). The cue fades over the first 120 px of scroll (opacity = 1 − seg(scrollY, 0, 120)).

### The hook (plate I → II, roughly 0 to 25% of the piece)

The lantern lifts off the water, the ripples spread across the ground, and the first green appears on the horizon, then rises into curtains. The visitor learns two things here: that scroll position *is* the time of night, and that the light is always present.

### The peak (plate V, at 10²¹ m)

The readout races through exponents as the star chart is swept into a galaxy. At the hold the visitor stops and admire mode lays the plate bare: a two-armed spiral with a gold core, which is the Ember they have followed since the first frame.

### The ending (plate VI + colophon)

The galaxy collapses into one point, the readout counts home to 10⁰ m, and dawn comes up. "Good morning." The colophon then offers **Rewind the night**: a native smooth scroll back to the top, during which the entire night plays backwards at speed (the galaxy unwinds, the horizon un-bends, the lantern sinks to the water). Under reduced motion the rewind is an instant jump.

### Grin moments (reviewers check each)

1. **The horizon bends** (III, p .0–.25). A flat line you have looked at for two plates curves into a planet. It is the moment the scale becomes physical.
2. **The readout racing** through `10¹⁷ … 10²¹ m` during IV → V, then counting **home** to `10⁰ m` at dawn.
3. **The flame is the Ember.** The Lantern constellation draws itself around the light you have been following, which floats unconnected inside it.
4. **Constellation completion flare.** Each figure's stars brighten by 40% at the instant its last line closes, and fall back as you continue. Because it is scrubbed, scrolling back and forth over it makes it "catch" like light on glass.
5. **Unwinding the galaxy** when scrolling up through V.
6. **The placard.** In admire mode, after 3 s a small museum-style label appears: *Plate V · Spiral* / `10²¹ m · held at 71%`. The site acknowledges that you are looking.
7. **The admire ripple.** In plate I, admire mode emits a new faint ring from the lantern every 4.8 s, in time with its breathing.
8. **Rewind the night.** The whole piece played backwards in about 3 s.

---

## Admire mode (in detail)

**Arming:** off until the first user-initiated scroll (A4). A programmatic scroll from a scene link or Rewind does not arm it on its own.

**Trigger:** 1,200 ms after the last input event among `scroll`, `wheel`, `keydown`, `pointerdown`, `pointermove`, `touchstart` and `touchmove` (`technique.md` E3 explains why `scrollend` is a hint at most). Tests drive this with `page.clock`.

**Suppressed when:**
- (a) focus is inside the chrome (nav, pause or skip link), because admire must never hide the focused element;
- (b) the document is hidden;
- (c) the scroll position is in the colophon (stage released);
- (d) a Rewind smooth-scroll is in progress.

**Enter choreography** (time-based, on chrome and the ambient layer only; scene state is untouched):

| t (ms after trigger) | What happens |
|---|---|
| 0 | `html[data-admire="on"]`. The live region announces the entry text (see Copy). The wordmark, meridian/progress, readout, scroll cue and flow captions fade to opacity 0 over **600 ms** `--ease-in-out`. The pause control dims to **0.55** over the same 600 ms. It stays visible and operable, because the breathing needs a visible pause (WCAG 2.2.2). |
| 600 | The ambient layer starts, its amplitude ramping 0 → 1 over **1,500 ms** `--ease-breath`, so nothing pops. |
| 3,000 | The placard fades in at bottom-left over 900 ms to opacity 0.7. The cursor over the stage is hidden (`cursor: none`) and returns on the first `pointermove`. |

**Ambient breathing by plate** (additive offsets on a separate layer, never written into `state(p)`; all periods are seeded so they look organic but are reproducible):

| Plate | Breathing (amplitude at 1.0) |
|---|---|
| All | Ember halo scale 1 → 1.06 → 1, period **4,800 ms** (12.5 breaths/min), sine. |
| I Ember | Every 4,800 ms, in phase with the breath, one extra ripple ring leaves the lantern: rx 0 → 30 vmin over 4,800 ms, opacity .20 → 0. |
| II Aurora | Ribbon phases drift: φₖ += 2π·t / 11,000 ms, capped at ≤ 1.5% of stage height displacement. |
| III Orbit | The moon oscillates ±3° along its orbit, period 14 s. Dust twinkles. |
| IV Constellations | Twinkle: 30% of stars modulate alpha by up to −35%, each with a period in 2,600–7,400 ms. Each figure's line opacity pulses 0.85 ↔ 1 over 6 s, staggered 2 s apart. |
| V Spiral | The disc oscillates ±0.8°, period 20 s. **There is no continuous rotation** (vestibular). The core breathes. Twinkle as in IV. |
| VI Dawn | The dawn band's opacity varies ±6%, period 8 s. Reflection dashes shimmer at ±0.4 vmin x-jitter, period 3 s. |

**Exit** (on any input event, including the keydown of an unbound key):
- the chrome returns to opacity 1 in **160 ms** `--ease-out`;
- the placard hides in 120 ms;
- the ambient amplitude decays to 0 over **240 ms** `--ease-out`, so offsets ease out without snapping, and the frame is purely scroll-defined again within 240 ms;
- the cursor returns;
- the live region is cleared (no exit announcement, to avoid chatter).

The scroll that caused the exit is applied in the same frame. Scroll response is never delayed by the exit.

**Pause** (`aria-pressed`): while paused, admire mode still hides the chrome and shows the placard, but the amplitude stays at 0. The pause state persists per viewer in `localStorage`, with every access wrapped in try/catch and defaulting to "playing".

**Reduced motion:** admire mode still hides the chrome (fade shortened to 200 ms) and shows the placard. There is no breathing, no admire ripple and no cursor-hiding delay change.

---

## Chrome (every component, every state)

All chrome is `position: fixed`, outside the stage, and set in `--font-ui`. Hit areas are ≥ 44 × 44 px.

| Component | Placement (≥ 1024) | States |
|---|---|---|
| **Skip link** | top-left, off-screen until focused | **focus-visible:** slides in (translateY −100% → 0, 160 ms), `--ink-3` background, `--star-white` text, focus ring. **Active:** jumps to `#colophon` and focuses the colophon heading. |
| **Wordmark** "Nocturne" (link to `#top`) | top-left, 24 px inset | **default:** 0.72 opacity. **hover:** 1.0 over 120 ms. **focus-visible:** ring. **active:** translateY 1 px over 90 ms. **admire:** 0. |
| **Meridian** (scene nav + progress), a `<nav aria-label="Plates">` holding an ordered list of 6 anchors | right edge, x = viewport width − 32 px, a vertical hairline 60 svh tall, centred | **Track:** 1 px `--line`. **Progress fill:** a 1 px `--star-white` segment from the top to the current point (transform scaleY = P), plus a 5 px glowing dot at its end. **Tick (one per plate, positioned at that plate's start):** *upcoming*: 5 px dot, `--star-dim` at 0.5. *passed*: 5 px, `--star-white` at 0.8. *current*: 7 px `--star-white` with a 10 px halo, `aria-current="step"`. *hover*: the label slides out to the left ("III · Orbit"), opacity 0 → 1 and translateX 4 px → 0 over 180 ms. *focus-visible*: ring plus visible label. *active*: scale 0.9 over 90 ms. **admire:** whole meridian at 0. |
| **Readout** | bottom-left, 24 px inset | Line 1 is mono `10⁸ m`, line 2 is the label "a moon's distance". It is not interactive and not live (it would be chatty), and it has `aria-hidden="true"` because the same information is in each plate's caption heading. **admire:** 0. |
| **Pause control** `<button aria-pressed>` | bottom-right, 24 px inset | **default (playing):** icon ‖ plus text "Pause motion", opacity 0.72. **hover:** 1.0. **focus-visible:** ring. **active:** 1 px depress over 90 ms. **pressed (paused):** play icon (a four-point star glyph drawn in SVG) plus text "Play motion", `aria-pressed="true"`. **admire:** stays visible at 0.55. **reduced motion:** `aria-disabled="true"` (still focusable), text "Motion off", with a tooltip and `aria-describedby` reading "Your device asks for reduced motion, so nothing here moves on its own." **≤ 767 px:** icon only, with the label kept as `aria-label`. |
| **Scroll cue** | bottom centre, first viewport only | See the first 5 seconds. Scroll-scrubbed fade over the first 120 px. Decorative, `aria-hidden`. |
| **Flow captions** (one per plate) | in document flow inside each track, left column (x 8%, max 30 rem) at ≥ 1024 | A heading such as "III · Orbit" (`<h2>`, focus target for nav, `tabindex="-1"`) and one line of lede. They sit on a soft scrim (a radial gradient of `--ink-0` at 55% behind the text block only) so contrast holds over any light. Not animated. **admire:** opacity 0 (it remains in the accessibility tree). |
| **Placard** | bottom-left (it replaces the readout's spot while admiring) | Hidden by default. In admire mode it appears at t = 3,000 ms (see above). `aria-hidden` (the live region already announced it). |
| **Live region** | visually hidden `role="status"` | Holds the admire entry text and is cleared on exit. |
| **Rewind button** | in the colophon | **default:** an outlined pill, 1 px `--line`. **hover:** border `--ember`, text `--ember-core`. **focus-visible:** ring. **active:** depress 1 px. **while rewinding:** the text reads "Rewinding…" and the button is disabled until the top is reached (≤ 3 s), or the user cancels by scrolling. |

**Focus ring (global):** 2 px solid `--focus` plus a 6 px outer glow at `rgb(255 227 179 / .35)`, offset 3 px, radius matched to the element. It is always visible against every plate.

---

## Copy (every string)

**Document:** `<title>`: "Nocturne: a night, scrolled slowly". Meta description: "A scroll-driven study in light: six plates, one night, from arm's length to the width of a galaxy and home again by dawn."

**Opening (Plate I):**
- Title: **Nocturne**
- Subtitle: *A night, scrolled slowly.*
- Scroll cue: "Scroll · stop anywhere to look"
- Skip link: "Skip to the end of the night"

**Plate captions** (`<h2>` + lede, readable instantly, never animated):

| Plate | Heading | Lede |
|---|---|---|
| I | I · Ember | Every night begins with one light. |
| II | II · Aurora | A hundred kilometres up, the sky is breathing. |
| III | III · Orbit | Rise far enough and the horizon bends into a world. |
| IV | IV · Constellations | We drew our stories between stars that never met. |
| V | V · Spiral | Two hundred billion suns, turning slower than memory. |
| VI | VI · Dawn | And all of it, folded back into one light. |

**Display type in the stage:** "THE LANTERN", "THE HERON", "THE OPEN HAND" (letterspaced small caps), and "Good morning." (display italic).

**Readout labels:**

| Readout | Label |
|---|---|
| `10⁰ m` | an arm's length |
| `10⁵ m` | the height of an aurora |
| `10⁸ m` | a moon's distance |
| `10¹⁷ m` | ten light-years |
| `10²¹ m` | the width of a galaxy |
| `10⁰ m` (final) | home |

All are true to an order of magnitude: aurora ≈ 100 km; the Moon ≈ 3.8 × 10⁸ m; 10 ly ≈ 9.5 × 10¹⁶ m; Milky Way ≈ 9.5 × 10²⁰ m. "Two hundred billion" sits inside the usual 100–400 billion estimate. The intermediate exponents shown are the number only (e.g. `10¹² m`), with the label of the nearer plate.

**Navigation labels:** nav `aria-label` "Plates". Items: "I · Ember", "II · Aurora", "III · Orbit", "IV · Constellations", "V · Spiral", "VI · Dawn". The visible hover label matches the item.

**Pause control:** "Pause motion" / "Play motion". Its `title`: "Pause the gentle motion that plays while you're still". Reduced motion: "Motion off". Description: "Your device asks for reduced motion, so nothing here moves on its own."

**Admire:**
- Live region on entry: "Holding on Plate V, Spiral. The controls are hidden while you look; scroll, move or press any key to bring them back."
- Placard: line 1 *Plate V · Spiral*; line 2 `10²¹ m · held at 71%` (the global progress percentage, as an integer).

**Colophon** (`<footer id="colophon">`, `<h2 tabindex="-1">`):
- Heading: "Colophon"
- Body:
  - "Nocturne is a study in light and scroll. Every frame you saw is a function of where you were: stop anywhere and it holds, come back and it's the same sky."
  - "Made of one ember, a few thousand points of light, six plates, and no images or video. Nothing is loaded from anywhere else."
  - "Every constellation here is invented. The distances are real, give or take a power of ten."
- Rewind button: "Rewind the night" / "Rewinding…"
- Shortcut note: "Keys: 1–6 jump to a plate · P pauses motion · Space and the arrow keys scroll as usual."
- Shortcut toggle (a checkbox, WCAG 2.1.4): "Single-key shortcuts", checked by default; when unchecked the keys above do nothing.
- Sign-off: "Made by the Bureau, 2026."

**Edge-state strings:**
- `<noscript>` banner: "Nocturne moves with JavaScript. Without it you still get the words and the first light of the night."
- Canvas unavailable (no 2D context or context lost): no message. The SVG layers carry on, and the colophon's second sentence becomes "Made of one ember, six plates, and no images or video." The architect gates this string on the `no-canvas` class.

**Claim integrity:** "a few thousand points of light" must stay true. It holds at the ≥ 1024 particle counts (2,000+). At 375 px it is 900 particles plus SVG points, which is borderline, so the architect may switch the copy to "thousands of" only if the count holds. **Suggested resolution:** keep "a few thousand" only if the total exceeds 2,000 at every breakpoint; otherwise use "hundreds of points of light" below 768 px.

---

## Look: tokens

### Colour (dark only, by design: light is the material; `color-scheme: dark`)

| Token | Hex | Use |
|---|---|---|
| `--ink-0` | `#04050A` | void, page background, planet night side |
| `--ink-1` | `#070A14` | sea / below horizon, colophon background |
| `--ink-2` | `#0C1222` | sky near horizon |
| `--ink-3` | `#141B33` | skip-link background, raised surfaces |
| `--dusk-violet` | `#2A1F4A` | dusk band (I → II) |
| `--predawn` | `#1B2550` | pre-dawn sky (VI) |
| `--star-white` | `#F4F1E8` | stars, primary text, hairlines |
| `--star-dim` | `#9AA3B8` | upcoming ticks, dim stars |
| `--text-lo` | `#A7AEC2` | secondary text (≈ 8.9:1 on `--ink-0`) |
| `--line` | `rgb(244 241 232 / .18)` | hairlines, meridian track, button outline |
| `--ember` | `#FFC98A` | Ember halo, warm accents, hover |
| `--ember-core` | `#FFF4E0` | Ember core |
| `--core-gold` | `#FFD27A` | galaxy core |
| `--aurora-green` | `#5EF2B4` | aurora base |
| `--aurora-teal` | `#2BC7D9` | aurora mid |
| `--aurora-violet` | `#9B7BFF` | aurora upper |
| `--aurora-rose` | `#FF7FA8` | aurora fringe, star-forming knots |
| `--planet-rim` | `#8FD3FF` | planet limb, arm blue-white |
| `--dawn-rose` | `#F2A48C` | dawn band low |
| `--dawn-gold` | `#FFD8A0` | dawn band high, reflection streak |
| `--focus` | `#FFE3B3` | focus ring |

**Contrast:** `--star-white` on `--ink-0` is ≈ 18:1. All caption text sits on a scrim that keeps the effective background at or below `--ink-2` luminance, so AA holds over the aurora peak too. **Test:** axe at each plate's hold position.

### Type

**Display:** one self-hosted OFL serif italic, subset to the glyphs used ("Nocturne", "Good morning.", roman numerals, plate names), in woff2, ≤ 30 KB. Candidate: **Cormorant Garamond Light Italic** via `@fontsource/cormorant-garamond` (`npm view` → version 5.3.0, licence OFL-1.1, checked 2026-11-20). The architect verifies installability and subsets it (A2, A3: self-hosted, no network at runtime). Fallback: `"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, "DejaVu Serif", serif`, italic. `font-display: block` with a 100 ms budget is not acceptable; use `swap`, with fallback metrics matched by `size-adjust` so the title shows no layout shift.

**UI / captions:** `--font-ui: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Liberation Sans", sans-serif`. Inter is installed in this environment (`fc-list`), which makes screenshots representative here; on visitors' machines it falls back to the system UI font, and that is fine.

**Mono (readout, placard line 2):** `ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`, with `font-variant-numeric: tabular-nums`. Superscripts are real Unicode superscript digits (⁰¹²…), not `<sup>`, so there is no line-height jump.

| Role | Size | Weight / style | Line height | Tracking |
|---|---|---|---|---|
| Display (title) | `clamp(3.5rem, 12vmin, 10rem)` | 300 italic | 1.0 | 0.02em |
| Display (Good morning.) | `clamp(2.25rem, 7vmin, 5.5rem)` | 300 italic | 1.05 | 0.01em |
| Subtitle | `clamp(1.0625rem, 2.2vmin, 1.375rem)` | 300 italic, display face | 1.4 | 0.01em |
| Caption h2 | 0.75rem | 500, uppercase | 1.3 | 0.24em |
| Caption lede | `clamp(1.25rem, 2.6vmin, 1.75rem)` | 300, UI face | 1.35 | −0.005em |
| Constellation label | 0.6875rem | 500, uppercase | 1 | 0.32em |
| Readout number | 0.8125rem | mono 400 | 1.2 | 0 |
| Readout label / UI | 0.75rem | 400 | 1.3 | 0.04em |
| Colophon body | 1.0625rem | 400 | 1.6 | 0, max 34 rem measure |

### Spacing and layout

- **Spacing scale (4/8):** `--s-1: 4px`, `--s-2: 8px`, `--s-3: 12px`, `--s-4: 16px`, `--s-6: 24px`, `--s-8: 32px`, `--s-12: 48px`, `--s-16: 64px`, `--s-24: 96px`.
- **Chrome inset:** 24 px at ≥ 768, 16 px below that. Use `env(safe-area-inset-*)` additively.
- **Composition rules:**
  - The Ember is the brightest thing on screen in every frame except Spiral p .4–.9, where it is the core of the brightest structure.
  - The horizon sits at y .72 when present (rule of thirds, with the sky dominant).
  - Light is never clipped by a hard edge: every luminous shape falls off to 0 before the viewport edge, except the aurora envelope tails and the outermost ring, which fall to ≤ 6%.
  - At most one accent colour family per plate: amber (I), aurora (II), blue (III), white (IV), gold and white (V), rose and gold (VI).
- **Lighting and mood:** everything emits and nothing reflects, except the water reflections in I, II and VI. Additive or screen blending only for light. No drop shadows. No grain texture (it would cost paint and read as noise on dark).
- **Iconography:** four custom inline-SVG glyphs only, drawn with 1.5 px strokes: pause (two bars), play (a four-point star), the meridian tick (a dot), and the rewind (a counter-clockwise arc with an arrowhead). No icon library.

### Motion language

**Scrubbed motion (the 99%)** has no durations, only remaps of p:
- `ios` (ease-in-out-sine) for positions;
- `ss` (smoothstep) for opacities;
- `outCubic` for ring expansion;
- linear for line drawing.

Hold bands (≤ 25% rate) are built into each plate's remap curve.

**Chrome and ambient motion tokens:**

| Token | Value |
|---|---|
| `--dur-press` | 90 ms |
| `--dur-hover` | 120 ms |
| `--dur-label` | 180 ms |
| `--dur-chrome-in` | 160 ms (return is fast) |
| `--dur-chrome-out` | 600 ms (recede is slow) |
| `--dur-placard` | 900 ms |
| `--dur-ambient-ramp` | 1,500 ms in / 240 ms out |
| `--breath` | 4,800 ms |
| `--ease-out` | `cubic-bezier(.22, 1, .36, 1)` |
| `--ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` |
| `--ease-breath` | `cubic-bezier(.37, 0, .63, 1)` (sine-like) |

**Choreography rules:**
- One focal movement at a time per plate (P11).
- Large layers never translate more than 8% of stage height per 100 svh of scroll.
- Nothing rotates as a whole field, except the Spiral's ±0.8° ambient oscillation.
- Nothing enters from off-screen: light is born from the Ember, the horizon or the existing star field.

---

## Sound

**n/a.** The brief asks for none, autoplaying audio is hostile to a contemplative piece, and an opt-in drone would add scope and test surface for no brief requirement. Noted for the CEO only as a possible future upgrade: an opt-in synthesized pad whose filter cutoff follows the readout exponent.

## Feel

- **Scroll to frame:** same rAF, with zero smoothing (the platform's 1-frame lag only, `technique.md` E2). Native scroll rate and direction, no snap, no hijack (P2).
- **Hover feedback:** visible within 120 ms. Press: 1 px depress over 90 ms with `--ease-out`.
- **Nav jump:** native anchor scroll, with `scroll-behavior: smooth` only when motion is allowed. After it lands, focus moves to the plate's `<h2>`, the hash updates (`#orbit`), and Back returns.
- **Juice, Nocturne-style:** no shake, no squash, no overshoot (they would break the contemplative tone and the pure-function promise). The "juice" is light:
  - the constellation **completion flare** (+40% across a p-window of .02);
  - the **first-scroll ripple**;
  - the **galaxy collapse bloom** (Spiral p .9–1: the core halo grows from 14 to 30 vmin as the particles converge, so the light appears to *gather*);
  - the **readout race**.
- **Input never waits:** any input exits admire mode and its scroll applies in the same frame.

## Voice

Spare, present tense, quietly astonished, never exclaiming. Short declarative lines. Numbers are exact or honestly approximate. No marketing words ("experience", "immersive", "journey") in visible copy. Second person only in instructions ("stop anywhere to look"), never in the poetry.

- Yes: "Rise far enough and the horizon bends into a world."
- No: "Get ready for an immersive journey through the cosmos!"

---

## Responsive behaviour

| Width (reference height) | Stage and art | Chrome | Captions | Particles (max sky) | Canvas DPR cap |
|---|---|---|---|---|---|
| **375** (×812, portrait) | All art scales in vmin (here vmin = vw). Horizon at y .72. **Portrait layouts:** Aurora envelope x .05–.95. Orbit planet radius 30 vmin at (.50, .60). Constellations stacked: Heron (.55, .22) 40 vmin, Lantern (.42, .48) 34 vmin, Hand (.60, .74) 30 vmin. Spiral disc 96% width with tilt y × .7 (taller, to fill portrait). | **Meridian becomes a horizontal hairline at the top** (inset 16 px), with 6 tick dots in 44 × 44 hit areas; a single centred line under it shows the current plate ("III · Orbit"). The wordmark is hidden (the title already appears in plate I). Readout bottom-left, pause icon-only bottom-right. | Full width minus 32 px, bottom-aligned in their flow slot, with a bottom scrim gradient (`--ink-0` at 70% → 0 over 40 svh). Lede at 1.25 rem. | 900 | 2 |
| **768** (×1024, portrait) | As at 375, constellation boxes at 34/30/26 vmin. | Horizontal meridian with hover labels disabled (touch-first); pause shows its text. | Left-aligned, max 26 rem, bottom third. | 1,400 | 2 |
| **1024** (×768, landscape) | Landscape layouts (the 1440 values). | Vertical meridian at the right edge. Wordmark shown. | Left column x 6%, max 26 rem, vertically centred in their flow slot. | 2,000 | 1.5 |
| **1440** (×900) | The reference values throughout this spec. | As 1024, 24 px insets. | x 8%, max 30 rem. | 2,000 | 1.5 |
| **1920** (×1080) | Art in vmin, so composition is unchanged. The stage's extra width shows more star field (stars are seeded over a 2:1 area so ultra-wide never shows empty edges). | Same. | x 10%, max 32 rem. | 2,400 | 1.5 |

**Rules:**
- No horizontal overflow at any width. Wrappers use `overflow: clip`, never `hidden`, because `hidden` breaks sticky (P6, `references.md` §A).
- Text holds at 200% zoom: captions reflow; chrome labels truncate never and wrap if needed.
- Very short landscape viewports (height < 480): display sizes clamp on vmin, so the title still fits, and the meridian is shortened to 50 svh.
- The particle count is fixed per breakpoint and per page load. On resize across a breakpoint the system re-seeds deterministically for the new count. Determinism is defined per viewport.

---

## Reduced motion: the second authored cut (P9)

Under `prefers-reduced-motion: reduce`:

- **Each plate becomes one still**, its signature plate (the hold-band frame): I "Lantern on still water", II "Curtains", III "A world", IV "A chart of the sky", V "The galaxy", VI "The morning star" with "Good morning.".
- **Between plates:** an opacity-only crossfade, scrubbed over the last 12% of plate N and the first 12% of N+1. There is no movement, scale, rotation or line drawing. Constellations appear fully drawn, and the galaxy appears fully formed.
- **Plate I's opening frame** stays as the p = 0 picture (title visible) until the crossfade to the Lantern still at p .3–.45.
- **Off:** the scroll cue's animation, the admire breathing, the admire ripple, smooth scroll (nav and Rewind jump instantly), and the hover label slide (labels appear instantly).
- **Kept:** native scrolling, the readout (text changes), admire mode's chrome hiding (200 ms fade) and placard, and all copy.
- **Pause control:** shown as `aria-disabled` "Motion off", with its explanation.
- **Test hook:** under emulated `reduce`, `__showcase.snapshot()` at several positions inside one plate's hold returns identical transforms, and no time-based animation runs (`document.getAnimations()` is empty of non-scroll animations).

---

## Keyboard

- **Tab order:** skip link → wordmark → 6 plate links → pause → (captions are not tab stops; their headings are programmatic focus targets only) → colophon: Rewind → shortcut toggle.
- **Native scrolling** is untouched: Space / Shift+Space, PageUp/PageDown, the arrow keys, Home/End.
- **Single-key shortcuts** (only when no modifier is held, focus is not in a form control, and the toggle is on; WCAG 2.1.4 compliant via the toggle):
  - `1`–`6` jump to a plate (same behaviour as the nav links);
  - `P` toggles pause (no-op under reduced motion; the live region says "Motion is off on this device.");
  - `0` jumps to the colophon.
- **Any key**, including Esc, exits admire mode. Esc is never swallowed.
- **Focus** is never obscured: admire mode is suppressed while focus is in the chrome (see Admire mode).
- **After a nav jump**, focus lands on the plate's `<h2>` and the screen reader reads "III · Orbit, heading level 2", then the lede.

## Loading, empty and error states

- **Loading:** none visible. The first paint is the finished plate-I frame (inline SVG + critical CSS), with no FOUC and no spinner. JS is ES modules, deferred. The canvas fills in ≤ 1 frame later at 25% opacity, so it never pops.
- **Empty:** not applicable (no data).
- **No JS:** the `<noscript>` banner (copy above). Plate I's still renders. The captions and colophon read normally on the dark background. The meridian anchors still work as plain links.
- **Canvas missing or context lost:** `html.no-canvas`. The SVG layers continue, with no console error and the alternate colophon copy. On `contextrestored`, redraw from the current P.
- **A scene throws in `apply`:** the engine catches it, hides that plate's per-plate layer (the persistent layers continue), and records it in `__showcase.errors` for tests, which assert the list is empty. No `console.error` in normal operation.
- **Hidden tab:** the rAF stops naturally, the admire timer is cleared, and on return the frame equals the scroll position immediately.

---

## Endpoint contract (for tests; exceptional #3, success criterion 3)

| Plate | `state(0)` asserts | `state(1)` asserts |
|---|---|---|
| I | title opacity 1; ember y .72; rings all rx 0; cue visible | title opacity 0; ember y .40; ring opacity 0 |
| II | ribbon heights 0; ember y .40 | ribbon count visible 1 (merged); horizon sag .005; ember y .30 |
| III | horizon R = 40·W (flat); ember (.50, .30) | planet radius 4 vmin; orbits 3; ember at inner-orbit 12 o'clock |
| IV | constellation draw 0 for all; labels 0 | draw 1 for all; line opacity .15; labels 0; ember (.5, .5) |
| V | particles at Constellations p = 1 positions (10% lerp toward disc); arm contrast 0 | all particles within 3 vmin of centre; core halo 30 vmin |
| VI | halo 30 vmin; horizon opacity 0 | horizon flat at y .72; ember (.62, .34); "Good morning." opacity 1; readout exponent 0 |
| Global | readout 10⁰ at P = 0 | readout 10⁰ at P = 1 ("home") |

Every boundary also satisfies the match-cut contract above.

---

## Budgets the design commits to

- **Animated DOM/SVG nodes per active plate:** ≤ 80. The peak is IV, at about 60 lines, stars and labels. That is far under the ~1,000 cap (`technique.md` E5).
- **Total DOM:** ≤ 400 nodes (Lighthouse warns at ~800).
- **SVG path points per frame:** ≤ 1,000 (Aurora 640 plus horizon 96). The cap is 10k.
- **Canvas particles:** ≤ 2,400. The glow sprite is drawn on ≤ 150 of them, with **no `shadowBlur`** (expensive). Redraw only when P changed or ambient is running.
- **JS payload:** ≤ 40 KB gzipped (no libraries). **Font:** ≤ 30 KB.

---

## Risks, stated honestly

| Risk | Why | Mitigation |
|---|---|---|
| **Canvas raster cost** for a full-stage `'lighter'` composite at 1920×1080 × DPR 1.5 with 2,400 particles | Unmeasured: `technique.md` E4 covers script time only and notes "raster costs unverified" | Spike WO first: measure IV and V frame timings with a CDP trace. Fallbacks in order: drop the glow sprite to 60 particles; use `source-over` with pre-brightened colours; cut particles by 30%. |
| **`mix-blend-mode: screen`** on four large SVG ribbons | It forces extra paint and compositing | Spike alongside the canvas spike. Fallback: normal blending with pre-lightened gradient stops, which looks about 90% as good. |
| **One stage, six tracks** differs from intel's "a stage per scene" | It needs a global P, persistent layers and per-plate ranges | It is still native sticky with one element, so the sticky e2e check runs on one stage. If the architect rejects it, the match-cut contract still binds. |
| **Match-cut pixel test** could flake on canvas anti-aliasing | Sub-pixel particle positions differ at ±2 px of scroll | 0.5% pixel and 8/255 tolerance. Or assert on `snapshot()` (state equality) and keep the pixel diff as evidence only. |
| **Vestibular load** in Spiral (many particles moving) and Orbit (tilt) | Large coordinated motion | Caps (≤ 6° per 100 px; tilt on geometry only; no whole-field rotation). Reduced-motion cut. Hold bands. |
| **Display font** availability and subsetting | A2 and A3 constraints; the package is 1.8 MB unpacked before subsetting | Subset to about 40 glyphs. If subsetting tooling isn't installable, ship the single Latin Light Italic woff2 file from the package (on the order of 20–40 KB; the architect measures it) or fall back to the system serif stack. |
| **Real mobile** (toolbar, touch momentum) cannot be verified here (`technique.md` E3) | Environment limit | `svh` stage; offsets cached on resize; declare it unverified in the evidence. |
| **Admire suppression while focus is in the chrome** could surprise testers expecting admire mode everywhere | It is a design choice for WCAG 2.4.11 | The test explicitly covers both cases. |

---

## The polish list (reviewers check each)

1. At first paint, before any JS executes, the opening frame shows the Ember, the horizon, the title, the subtitle and the cue. Check by screenshot with JS disabled.
2. A 40 px scroll from the top produces a visibly expanded ring and a widened title (screenshot diff against p = 0).
3. The scroll cue animates exactly twice (4.8 s total) and then stays still. It never animates under reduced motion.
4. The Ember is present and is the brightest point in screenshots at every one of 20 random positions (except Spiral p .4–.9, where it is the galaxy core).
5. Boundary frames at ±2 px of every plate boundary are visually identical (match-cut contract).
6. No luminous shape ends in a hard edge at the viewport boundary, in any captured frame.
7. Title letters spread symmetrically; at p = .25 the gaps between letters are equal (±1 px).
8. The horizon is a single smooth curve at every position in Plate III, with no kinks at ten sampled positions.
9. The moon (Ember) lies on its orbit path within 0.5 px in every Plate III frame.
10. A partly drawn constellation line always ends in its 1.5 vmin glow tip, never in a bare stroke end.
11. Constellation labels never appear before their figure is 80% drawn.
12. Each figure's completion flare peaks within its p-window and returns to baseline. Scrubbing back and forth over it repeats it exactly.
13. Spiral: scrolling up visibly unwinds the arms, and positions at p = .5 after a round trip are identical (`snapshot` equality).
14. Readout digits never tween on time; at every plate's p = .5 they show the documented exponent and label.
15. Readout superscripts don't shift the baseline or the line height as digits change (tabular, Unicode superscripts).
16. Admire mode: chrome fades out over 600 ms and returns in 160 ms; the pause button stays visible at 0.55.
17. Admire breathing ramps in over 1,500 ms (no pop) and decays over 240 ms on input; the frame then matches `stateAt(scrollY)` exactly.
18. The placard appears at 3.0 s of stillness, never before, and shows the correct plate and an integer percentage.
19. Admire mode never engages while focus is in the chrome, and never in the colophon.
20. In admire mode the cursor hides after 3 s over the stage and returns on the first pointer movement.
21. Pause persists across reloads (localStorage), and a blocked or throwing localStorage falls back to "playing" without errors.
22. The pause control under reduced motion is focusable, reads "Motion off" and explains why.
23. Meridian ticks show three distinct states (upcoming, passed, current) and exactly one `aria-current` at any position.
24. A nav jump moves focus to the plate heading, updates the hash, and Back returns to the previous position.
25. Every interactive element has distinct hover, focus-visible and active states; the focus ring is visible over the aurora peak and the galaxy core (screenshots).
26. Caption contrast is ≥ 4.5:1 at every plate's hold, measured by axe and by a manual pixel check over the brightest backdrop.
27. At 375 px the horizontal meridian's tick hit areas are ≥ 44 × 44 px and don't overlap the readout or pause control.
28. At 1920×1080 the star field reaches all four edges (no empty bands).
29. "Rewind the night" plays the piece backwards and lands at P = 0 with the title fully restored; any user scroll cancels it cleanly.
30. Zero `console.error`, zero unhandled rejections and an empty `__showcase.errors` across a full scroll-through, admire cycle and rewind.
31. Reduced-motion cut: each plate shows its signature still; transitions are opacity-only; constellations are fully drawn; no element translates.
32. No CLS from the display font swap (`size-adjust` metrics), measured as CLS ≤ 0.01.

## Anti-goals

- **A screensaver.** Nothing loops on its own except the opt-out admire breathing. Scroll is the clock.
- **A space demo reel.** No stock cosmic clichés: no lens flares, no nebula photo textures, no warp-speed star streaks, no rotating 3D Earth. No sci-fi HUD chrome.
- **Neon / synthwave.** The palette is low-saturation night with one accent family per plate. There are no magenta-cyan gradients across the screen.
- **Busy.** Never more than one focal movement at a time. Never text over the brightest light.
- **Scroll-jacked or "smooth".** No inertia libraries, no snapping, no lag.
- **Dizzying.** No whole-field zoom or rotation, no fast parallax.
- **Precious unreadability.** No grey-on-black body text below 4.5:1, and no copy that fades in letter by letter.

## Acceptance by eye (what the polish-critic captures)

**Viewports:** 375×812, 768×1024, 1024×768, 1440×900, 1920×1080.

**Captures:**
1. P = 0 (opening frame) at all five viewports, plus the same with JS disabled at 1440.
2. Each plate at p = 0, .25, .5, .75 and 1 at 1440 (30 frames), and each plate's hold frame at 375 and 1920.
3. Every plate boundary at ±2 px (match cut) at 1440.
4. 20 seeded-random positions at 1440 and 375. The critic answers "composed?" for each.
5. Admire mode at plate II hold and plate V hold: at 0 ms, 700 ms (chrome gone, breathing ramping), and 3,500 ms (placard). Also with pause on.
6. Reduced-motion signature stills for all six plates at 1440, plus one crossfade midpoint.
7. Focus states: the skip link, a meridian tick over Plate II, and the pause control over Plate V.
8. Colophon and Rewind (mid-rewind frame and landing frame).

**What they should see:** a dark, quiet, expensive-looking sky in which the light is always the subject and the Ember is always findable within one second. Each signature plate should hold up on its own as a print.

---

## What I raised beyond the brief

- **A narrative spine** (the scale readout from 10⁰ to 10²¹ m and back) so that six techniques read as one authored journey rather than a demo reel (exceptional #5).
- **A testable continuity contract** (match cuts plus one persistent element), so that "transitions link scenes" becomes a pass/fail check.
- **Hold bands**, so that "stop anywhere" lands on each plate's best picture more often than chance.
- **Rewind the night**, which turns the reversibility requirement into the finale.
