# Experience spec — M-0002 Frog river chase · *Lilyfield*

Direction **B · Lilyfield**, chosen by the Owner (`board/bakeoff-experience.md`).

## Fold-ins
1. **Trick pads:** *soggy* and *curl*, each with one still and one moving tell, neither based on hue (§4.2).
2. **Choices:** 2–3 pads per hop, at least one always safe, and the safe slot varies (G4–G6).
3. **Fast:** input to landing takes 260 ms, standing still kills in about 2–3 s, and restart takes 400 ms (§4.3, §4.4, §7.7).
4. **From A:** the 150 ms buffer and hop juice. **From C:** eyes and jaw angle as the glance-readable danger meter (§4.3).
5. **Not the crossing game:** no lanes, rooted scattered pads, cut paper (§5.2, §12).

---

## 1. North star
**Freeze any frame and you see a cut-paper pond in which you can tell at once which lit pad is the safe one and how close the gator's jaws are, with no hue needed to tell either.**

## 2. Reference points (craft only)
- **Cut-paper collage picture books:** a hard offset shadow shows height, so how high a pad sits becomes a signal.
- **Risograph prints:** limited inks, halftone fills and a 1 px registration offset. The texture comes from print artefacts, not detail.
- **One-screen arcade score attacks:** a retry in under a second, the timer as the score, no menu between runs.
- ***Celeste*-style input handling:** an input buffer, and juice that never delays control.
- **Rhythm games:** threat is heard as tempo, so ears track the gator while eyes track the pads.
- **Documentary top shots of crocodiles:** only eyes and snout break the surface, and the head moves first with the body following.

All characters, shapes, names and copy are original.

## 3. Loops
- **Core (≈0.8 s):** read the lit pads, reject the fake, hop.
- **Session (20–60 s):** cross 36 layers while the gator closes whenever you slow.
- **Long loop:** beat your best. A new river every run tests tell-reading, not memory.

---

## 4. Systems the architect freezes

### 4.1 World and generator
- **World units (wu).** River width `W = 100 wu`, layer pitch `P = 26 wu` (y grows upward). Layer 0 is the south bank and layer 37 the north bank. Hop layers are `k = 1…36`.
- **Viewport scale:** `s = min(vw / 100, vh / 150)` px per wu. The river column is centred, and side margins show the banks (§5.4). At 375×812, s = 3.75, so a pad (r ≈ 10) is about 75 px across. At 1440×900, s = 6.0, so a pad is about 120 px across.
- **PRNG:** seedable, 32-bit (sfc32 or mulberry32). `?seed=<int>` overrides. By default each run takes `seed = hash(runCounter, sessionSalt)`. Tests pass a fixed seed.

**Layer generation (per k, in order, one PRNG stream):**
- **G1 · Count.** `c = 3` for k ≤ 5. After that, `c = 3` with p = 0.65, otherwise 2.
- **G2 · Positions.** Slots for c = 3 have x-centres 22/50/78. For c = 2, pick one of {35/65, 22/60, 40/78}. Add jitter of ±6 wu in x and ±4 wu in y around `y = kP`. Radius `r ∈ [8.5, 11]`. Each pad gets a random rotation for its notch and a sway phase. The minimum centre distance inside a layer is 24 wu. The maximum hop distance is 1.9P (it holds by construction).
- **G3 · Kinds.** `pTrick(k)` = 0 for k < 6, 0.25 for k 6–15, 0.40 for 16–27 and 0.50 for 28–36. Each trick is a curl with p = 0.4 when k ≥ 10, otherwise a soggy pad. A layer holds at most `c − 1` tricks.
- **G4 · Safety.** Every layer has at least one `lily` (safe) pad. Every pad in layer k can reach **every** pad in layer k+1 (complete bipartite). Together these mean that any safe choice can always continue, so no run is unwinnable.
- **G5 · Rotation.** In layers with exactly one safe pad, the safe slot index (L/F/R) may not repeat more than 2 times in a row. Across 6–36, each slot holds at least 25% of the single-safe layers. Fix violations by rerolling the kind assignment of that layer from the same stream, up to 8 times, then force a swap. This stays deterministic.
- **G6 · Scripted onboarding.**
  - k = 1–5: all lily.
  - k = 6: exactly one **soggy**, in the slot nearest straight ahead, with both other pads safe.
  - k = 10: the first curl, placed off-centre.
  - k = 36: always at least two safe pads, so the final hop is a victory lap.
- **G7 · Decor.** 0–2 per gap: furled *pad buds*, petals and flowers on stalks. Never pad-shaped, never chipped, at least 14 wu from graph pads.
- **G8 · Generator output** is pure data `{layers: Pad[][], decor: Decor[]}`, unit-tested for G1–G7 over 10,000 seeds.

**Pad motion.** Pads are rooted (stems), so they only sway: `x += 1.6·sin(2π t/2.8 s + φ)` wu, with `scale = 1 + 0.015·sin(2π t/2.1 s + φ)` as bob. The order of pads within a layer never changes. Sway is cosmetic: collision and landing use the pad centre at the landing tick.

### 4.2 Pad kinds and states
| Kind | Still tell (≤ 0.5 s) | Moving tell | On landing |
|---|---|---|---|
| `lily` (safe) | V-notch, full 4-vein star and a **hard offset shadow** of 0.45r at (+0.35r, +0.45r). It "floats high". | Bob only. | Dip 6% for 180 ms, then fine. |
| `soggy` | **No offset shadow** (only a 1 px ink rim), no notch and a pad 6% darker. It "sits low". | A pair of bubbles (r 1.2 wu, `paper`) rising at its edge. The period is 420 ms, offset so at least one bubble is always visible. | Sinks over 380 ms. **Escape window:** a hop input within 220 ms of landing escapes. Otherwise fail-sunk. |
| `curl` | One edge folded up: a pale `pad-under` crescent covering 30% of the rim, with its own small shadow. | **Rocks** ±4° about the fold axis, with a period of 900 ms. Safe pads never rotate. | Tilts for 120 ms, then flips (shows the underside) and throws the frog in. There is no escape. |

The rule is **shape, shadow and motion, never colour**: a grayscale screenshot must show all three kinds apart (a test asserts this; polish item 3).

**States per pad:** `idle | reachable | occupied | dipping | sinking | flipping | sunk | flanked`.
- `reachable` shows an arrow chip.
- `flanked` is gator-owned and deadly (§4.3).

### 4.3 Gator (one gap value drives everything)
- `g` is safety time in seconds.
  - `g` is frozen at `gMax` until the frog **lands on layer 3** (the hook).
  - It then starts at `g0 = 3.0`.
  - Every sim tick: `g -= dt`.
  - On each landing: `g = min(gMax, g + gain(g))`, where `gain(g) = 0.75 + 0.6·(1 − g/gMax)` and `gMax = 3.5`.
- **What this means:** a player hopping every 0.75 s stays at the cap, and every 1.0 s settles at g ≈ 2.0. Every 1.2 s settles at g ≈ 0.9 with the jaws open, and slower than about 1.35 s you get eaten. Standing still from g = 2 is death in 2 s.
- **Catch:** when `g ≤ 0` and the frog is grounded, you are **eaten** (§7.3). If `g` hits 0 while the frog is airborne, g is held at 0 until landing, then gain is applied. That is a **near-miss**. A landing with g < 0.35 also counts as a near-miss.
- **Threat:** `τ = clamp(1 − g/2.5, 0, 1)` drives every danger signal:
  - eye scale `1 + 0.5τ`
  - jaw angle `28°·smooth(r(τ, 0.4, 1))`
  - edge vignette alpha `0.35τ`
  - heartbeat bpm `60 + 80τ` (audible when τ > 0.3)
  - music tempo `100 + 28τ` bpm
- **Position:**
  - The head target is the point on the frog's trail (polyline of pad centres) at arc length `max(0, frogArc − (0.9 + 1.6·g/gMax)·P)`.
  - The head follows the target on a critically damped spring with ω = 9 s⁻¹, so it never teleports when you hop.
  - The body is 9 segments with spacing 5.5 wu and distance constraints, so the head leads and the body follows.
- **Flank (the hunt):**
  - From k ≥ 12, while `g < 1.4`, the gator may flank once per 4 layers.
  - It chooses the pad in the **next** layer whose slot matches the frog's last chosen slot.
  - It flanks only if that layer still has at least one other safe pad that is not flanked (fairness, F1).
  - Telegraph: eyes surface beside that pad for 250 ms (`surfacing`), then the pad is `flanked`. The chip becomes an ink ✕ and the open jaws frame the pad.
  - Landing on a flanked pad means eaten.
  - Input is judged on the tick the hop **starts**, so a hop launched during the telegraph is safe (F2).
  - A flank clears when the frog lands anywhere.
- **Gator states:** `dormant | surfacing | chasing | flanking | lunging (eat, 140 ms) | sated | retreating (win)`.
- **Tunables, exported as one `TUNING` object:** `g0, gMax, gainBase 0.75, gainRubber 0.6, flankG 1.4, flankFromLayer 12, flankEvery 4, flankTelegraphMs 250, nearMissG 0.35`.

### 4.4 Frog states and timing (all in ms; sim converts to fixed ticks)
`idle → squash (60) → air (200) → land (impact 40, settle 120, non-blocking) → idle`. The sink, flip and eaten states are terminal.
- Control returns at **landing (t = 260 ms)**.
- **Buffer:** the latest direction pressed within 150 ms before landing (or during the 120 ms settle) fires on the landing tick. The last press wins. `event.repeat` is ignored.
- **Retarget:** a different direction pressed within the first 40 ms of squash retargets the hop, with no penalty.
- **Inputs while airborne** earlier than the 150 ms buffer window are dropped.

### 4.5 Controls
| Action | Keyboard | Touch | Gamepad (if cheap) |
|---|---|---|---|
| Hop left / forward / right | ←/A · ↑/W/Space · →/D | tap the left, middle or right third of the screen, **or tap the pad itself** (hit radius 1.4r) | D-pad or left stick (edge-triggered, deadzone 0.5) · A = forward |
| Pause | Esc / P | pause button 44×44, top right | Start |
| Restart (on result) | any hop key / Enter | tap anywhere | A |
| Mute | M | button 44×44 | — |

**Slot mapping:**
- *Left* is the leftmost reachable pad, *Right* the rightmost.
- *Forward* is the pad with the smallest |dx| from the frog.
- In a 2-pad layer, the forward pad also answers to its side key.
- Each reachable pad shows **exactly one** chip: ←, ↑ or →.

### 4.6 Camera
- Follows y only, on a critically damped spring with ω = 10 s⁻¹ (≈300 ms settle). The frog target sits at **64% of viewport height from the top**, so 2.5 layers are visible ahead and the gator shows behind.
- x is fixed, and the river column is always fully visible.
- When τ > 0.7, the zoom eases to 0.96 over 400 ms so more of the gator shows (off under reduced motion). The camera never rotates.

### 4.7 Determinism
- Fixed-timestep sim with interpolated rendering. The timer reads sim time.
- At 30 and 144 Hz the event log must be identical: hop ticks, landing ticks, g at every landing and the result.

---

## 5. Look

### 5.1 Palette (tokens)
| Token | Hex | Use |
|---|---|---|
| `paper` | #F3EBD8 | UI cards, bubbles, chip glyphs, teeth |
| `ink` | #1D2B3A | shadows (at 38% alpha), text, chips, outlines on UI |
| `water-a` | #2F8F9D | river base |
| `water-b` | #2A7A88 | halftone flow layer |
| `water-deep` | #1F5F6E | gator body under water, depth bands |
| `pad` | #8CC152 | lily |
| `pad-vein` | #5E9A36 | veins, offset 1 px (registration) |
| `pad-low` | #7DAE49 | soggy (secondary cue only) |
| `pad-under` | #D8E8A8 | curl crescent, flipped underside |
| `frog` | #F0B23E | frog body: ochre, so it pops off green and teal |
| `frog-dark` | #B97E1F | frog spots, leg folds |
| `bloom` | #F27BA8 | flowers, win burst |
| `gator` | #3D5A3A | head above water |
| `gator-ridge` | #2A4029 | scutes |
| `gator-eye` | #F4E04D | eyes (slit pupil in `ink`) |
| `jaw` | #C8324B | mouth interior, danger vignette |
| `bank` | #C9A46A | sand banks; `reed` #6B8F3E |

### 5.2 Drawing rules
- **Cut paper.** Every object is a flat fill with **no stroke** and a hard ink shadow at 38% alpha, offset by (+0.35, +0.45) × object height. Height is the shadow offset: lily 0.45r, frog on pad 3 wu, frog airborne up to 12 wu, soggy 0.
- **Print.**
  - Water is `water-a`, with a `water-b` halftone dot field (dot pitch 4 px screen, radius 0.9–1.6 px modulated by 2-octave value noise) scrolling right at 6 wu/s for the current.
  - A paper-grain texture is pre-rendered once (256² noise) at 6% multiply over everything.
  - Vein layers sit 1 px off-register.
- **Pads.** A circle with a 28° V-notch, plus a 4-vein star from the centre (0.6 px·s width, `pad-vein`). The edge is cut with 14 subtle vertices (±2% radius), so the shape reads as scissor-cut, not a perfect vector circle.
- **Frog** (original):
  - Top-down teardrop body of 6 × 7.5 wu with two eye bumps, each a `paper` disc with an `ink` pupil that looks toward the current target pad.
  - Folded hind legs (`frog-dark`) open into a V during air.
  - Three `frog-dark` spots.
- **Gator:**
  - The head above water is `gator`, about 14 wu long, with two raised eye domes (`gator-eye`, slit pupils) and nostril bumps.
  - The body is a darker `water-deep` silhouette under the halftone (it reads as submerged), with `gator-ridge` scute dashes that break the surface every 2 segments.
  - When open, the jaw shows a `jaw` wedge with 5 `paper` triangle teeth per side.
- **Composition rules:**
  - There is never a horizontal row: G2 jitter guarantees no three pads share a y within 3 wu across adjacent layers.
  - Reachable pads are the brightest objects on screen.
  - The frog is the only warm saturated colour in play, until bloom appears at the win.

### 5.3 Type, spacing, UI
- **Font:** system stack `ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif`, weight 800, tabular numbers. No font files are fetched.
- **Scale (mobile/desktop px):**
  - timer 32/44
  - best 14/16
  - card title 40/64
  - card body 18/22
  - chip glyph 16/20
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48. HUD inset is 16 px (mobile) or 24 px (desktop), plus `env(safe-area-inset-*)`.
- **Chips:** an ink disc of radius 0.42r at the pad's top-far edge, with a `paper` arrow glyph and its own 2 px shadow. On reachable, the chip **pops**: scale 0 → 1.12 → 1 over 160 ms (`cubic-bezier(.3,1.6,.5,1)`), staggered by 30 ms left to right.
- **Cards** (pause and results):
  - A `paper` rectangle with a torn top edge (procedural zigzag, 3 px amplitude), a hard ink shadow of 6 px and a 1.5° tilt.
  - It enters by sliding up 24 px and fading over 180 ms `cubic-bezier(.2,.8,.2,1)`.

### 5.4 World density (no empty frame)
- **Banks** (side margins on desktop, plus start and finish): sand `bank`, pebbles, cut-paper `reed` clumps of 5–9 blades swaying ±3° with periods of 2.4–3.6 s. The finish bank has a hollow log with bloom flowers.
- **Life:** 2 dragonflies (4 paper shapes, wing alpha flicker at 30 Hz, Lissajous wander, sometimes resting 1–2 s on a non-reachable lily). 3 water striders per screen darting in 120 ms jumps, 4 drifting petals, and 3–5 `paper` 4-point sparkles twinkling over 600 ms.
- **Banned:** dark fish shadows. Only the gator is a dark underwater shape.

### 5.5 Motion language
- **Default UI:** 180 ms `cubic-bezier(.2,.8,.2,1)`.
- **Pops:** `cubic-bezier(.3,1.6,.5,1)`.
- **Falls and sinks:** ease-in `cubic-bezier(.5,0,.9,.4)`.
- Nothing linear except the water scroll. Ambient loops never share a period, so nothing pulses in unison.

---

## 6. Feel, in numbers
| Event | Response |
|---|---|
| Key down → first visible change | Same frame (≤ 16 ms at 60 Hz). Squash starts and the target chip flashes `paper` (inverted) for 80 ms. |
| Squash (60 ms) | scale 1.18 across / 0.82 along the hop direction, body rotates to face the target (instant). Eyes snap to the target. |
| Air (200 ms) | Position eases `cubic-bezier(.3,.0,.4,1)`. Height `h = 12·sin(πt)` wu gives scale `1 + 0.025h` (peak 1.3) and a shadow offset of 3 + h, at alpha 0.38 → 0.22. Legs open into a V for 0–70% of the hop. |
| Land impact (40 ms) | scale 0.86 across / 1.14 along (stretch, then flatten), then a spring settle in 120 ms (one overshoot of 4%). The pad dips to 0.94 and recovers over 180 ms, and its shadow shrinks to 0.6× and back. |
| Land effects | 2 ripple rings, r → 1.8r over 500 ms, alpha 0.5 → 0. 6 droplet particles (`paper`, r 0.8 wu, 220 ms ballistic). |
| Buffered hop | Fires on the landing tick. The impact squash blends straight into the next squash, with no idle frame. |
| Soggy landing | Bubbles burst (10 particles). The pad sinks with ease-in over 380 ms, and the frog sinks with it while its scale shrinks to 0.7. If an escape hop fires: a "phew" sound and a 3 px upward jolt on the takeoff. |
| Curl landing | A 120 ms tilt to 25°, then a 220 ms flip (scaleX 1 → −1 shows `pad-under`). The frog is flung 10 wu outward and splashes. |
| Near-miss | 60 ms hit-stop (the sim keeps running; only the render freezes, so it is not a time cheat). A **jaw clack**: the jaws snap shut 0.3P behind the frog, a 3 px shake decaying over 150 ms, and a 1-frame `paper` flash at the jaw tips. |
| Eaten | 90 ms hit-stop, a 140 ms lunge, the jaws close over the frog, an 8 px shake decaying over 300 ms (exponential, k = 12) and 12 water droplets. |
| Water fall (sunk or flipped) | Splash crown: 14 particles, 2 rings, and the frog silhouette sinking to `water-deep` over 300 ms. |
| Flank telegraph | Eyes rise beside the pad over 250 ms (scale 0 → 1, `pop` ease) and the chip morphs to ✕ at the end. |
| Win landing | 120 ms hit-stop, then the bloom burst (§7.4). |

Shake is always under 8 px and is disabled under reduced motion. Hit-stops stay, because they are the readable "that was close".

---

## 7. Screens and frame tables
Timings are from the scene's start. "Frame" means what a screenshot at that moment shows. All screenshots use seed `?seed=7` unless noted.

### 7.1 Title = the pond (no separate menu)
**Elements**
- Play view at layer 0, with the frog on the south bank, centred, facing up.
- Wordmark **Lilyfield**, card-title size in `ink` with a 3 px `paper` offset, centred at 14% height, tilted −2°.
- Under it, the line "Tap or ↑ to hop" at body size.
- Best time below it if one exists: "Best 27.41".
- The 3 layer-1 chips show, and the forward pad has an **invite ring**: a `paper` ring r → 1.5r, alpha 0.6 → 0, every 900 ms.
- The gator is not visible.

| Moment | On screen | Why it is composed |
|---|---|---|
| t = 0 (load) | The full pond. The frog on sand at the bottom, three lit pads above it with chips, the forward one ringing. Dragonflies, petals, halftone water moving. The wordmark is at the top. | It is a playable frame and also a title. The ring plus the ↑ chip is the whole instruction, so you can hop within 3 s. |
| First input | Wordmark and hint fade up 12 px over 200 ms. The frog squashes on the same frame. The timer appears at 0.00. | The game starts on your first press; it never waits for a menu. |

The timer starts on the takeoff of hop 1, so reading the screen costs nothing.

### 7.2 Play
**HUD**
- Timer top-centre, as `ink` on a small `paper` torn tab: "12.34" (seconds, 2 decimals; "1:02.10" past 60 s).
- Best under it at best size: "best 27.41".
- **Progress reed** at the right edge: a 4 px `reed` line spanning 15–85% height, with a frog-coloured dot moving up it by k/36 and a bloom dot at the top.
- Pause and mute buttons top-right: ink glyphs on paper discs.

| Moment | On screen | Why it is composed |
|---|---|---|
| Hop 1, mid-air (≈ t 1.2 s) | The frog at apex: 1.3× scale, shadow far below and to the right, legs in a V. Its eyes look at the target. Layer-1 pad ripples. | The shadow gap *is* the height: the signature of the cut-paper look, at once. |
| Layer 3 landing: the hook | Bottom 20%: a splash, then two `gator-eye` domes rise out of the water and blink (80 ms). The heartbeat starts faintly. No text. | The threat is introduced as a reveal, behind the player, below the frog's line of sight. |
| Layer 6: the first trick | Three lit pads. The forward one has no shadow and bubbles rise at its rim; the side two float high with hard shadows. | The trap sits where a careless player taps. The tell is comparable side by side with two honest pads. |
| Layer 10: the first curl | One pad has a pale folded crescent and rocks ±4°. The other(s) are still. | A new tell, alone: one novelty at a time. |
| τ ≈ 0.5, mid-run | The gator's head is 1.3 layers behind the frog, with eyes at 1.25× and jaws starting to part. The vignette is at 18% `jaw` on the bottom and side edges and pulses with the heartbeat. | Danger reads in three ways that do not need hue: eye size, jaw angle and the vignette pulse. |
| Flank (k ≥ 12, g < 1.4) | The right pad of the next layer has the gator's eyes surfaced beside it, jaws open around its rim and an ✕ chip. The other two chips stay lit; one is honest. | The hunt is a choice taken away, never all choices: the escape is always visible. |
| Near-miss | A frozen frame for 60 ms: the frog mid-air, jaws snapped shut just behind its shadow, droplets hanging, tooth tips flashing. | The "almost" fits in one still: the frog, the jaws and the gap between them. |
| k = 33–36 | The north bank's sand, reeds and bloom-flowered log enter at the top. Layer 36 has 2+ safe pads. Music adds its high melody. | The goal becomes visible about 3 hops early, which pulls the player into a final sprint. |

### 7.3 Fail: eaten
**Sequence**
1. 90 ms hit-stop.
2. 140 ms lunge and close.
3. Shake.
4. At 250 ms, the card slides up.

The timer freezes and turns `jaw`-tinted, with a strikethrough so it does not rely on colour.

**Card**
- **"Chomped!"** in card-title size.
- "17 of 36 pads · 14.82"
- Hint line, chosen by cause:
  - standing still → "Keep hopping. It hates fast frogs."
  - flank → "Watch for eyes beside a pad."
- Footer: "Tap or ↑ to hop again"

| Moment | On screen | Why it is composed |
|---|---|---|
| +0 ms | Jaws closed on the pad where the frog stood, water crown, frame shaken. | The impact is the message. |
| +450 ms | A paper card tilted 1.5° over the dimmed pond (ink at 30%). The gator floats sated, eyes half-closed. The progress reed shows how far you got. | Losing shows progress, not shame. The pond stays visible behind the card. |

### 7.4 Fail: sunk (soggy or curl)
**Card**
- **"Soggy pad!"** or **"Curled pad!"**
- A **tell diagram:** a 2× close-up of the culprit pad, re-drawn live (bubbles and rocking animate) beside an honest pad, with ink callout arrows.
  - Soggy: "no shadow" and "bubbles".
  - Curl: "curled edge" and "rocks".
- Time and progress line.
- "Tap or ↑ to hop again"

| Moment | On screen | Why it is composed |
|---|---|---|
| Curl, +200 ms | The pad mid-flip, pale underside showing, frog flung off in an arc above the water. | A clear cause and effect: the pad did it. |
| +450 ms | The card with the fake and the honest pad side by side and two callouts. | Fooled once, understood after: the fold-in-1 promise. |

### 7.5 Win
**Sequence**
1. Landing on the bank: 120 ms hit-stop, then the timer freezes and scales 1 → 1.25 → 1.15 (pop).
2. The gator turns and sinks: eyes go under over 600 ms with a sulky blow of bubbles.
3. **Bloom burst:** 24 `bloom` petals radiate (360°, 0.4–0.9 s life, light gravity).
4. **Route trace:** an `ink` dashed line (dash 3/3 px·s) draws the frog's path back from the finish to the start over 700 ms, while the camera eases out to show the whole river at 0.4× zoom (if it fits; on mobile, up to 0.33×).
5. If the run beat the best: a **NEW BEST** stamp. Ink on `bloom`, rotated −8°, scale 2.2 → 1 over 220 ms with a pop ease, plus a 3 px shake (none under reduced motion). The old best is crossed out underneath.

**Card text:**
- "Made it! 24.18"
- "best 27.41 → 24.18" when it is a new best
- "Tap or ↑ to hop again"

| Moment | On screen | Why it is composed |
|---|---|---|
| +0 ms | The frog on sand, petals bursting, the gator's eyes sinking behind. | Release: the warmest frame in the game, with the first `bloom` used in play. |
| +1.0 s | The zoomed-out river with the inked route weaving through the scattered pads, the stamp and the card bottom-centre. | Your run becomes a picture worth screenshotting, and it reads clearly as *not* a lane grid. |

### 7.6 Pause
- Triggered by Esc, P, the button, `visibilitychange` or window blur.
- The sim stops, and audio ducks to 0 over 120 ms.
- A 30% ink veil (pond desaturated 60%) and a **"Paused"** card: Resume · Restart · Sound · Reduced motion · Tell legend. Buttons are 48 px paper tabs with a 3 px `ink` focus ring.

### 7.7 Restart (all results)
- Inputs are locked out for 250 ms after the result begins, so a panicking tap doesn't skip the card.
- After that, any hop key or tap restarts: a 150 ms paper wipe (a torn edge sweeping up) into a fresh layer-0 frame with a new seed.
- Measured from the restart input to a hop-ready state, it must take **≤ 400 ms**. From the fail tick to a hop-ready state it must take < 1 s.
- Nothing is lost: best time persists, and settings persist.

---

## 8. Sound (Web Audio, all synthesized)
| Event | Synth recipe | Level |
|---|---|---|
| Hop takeoff | Sine sweep 320 → 520 Hz over 70 ms plus a 5 ms noise click. Pitch by slot: left −2, forward 0, right +3 semitones. | −12 dB |
| Land on lily | Noise burst 60 ms through a 1.8 kHz bandpass (Q 4) plus a sine drop 600 → 300 Hz over 30 ms. | −10 |
| Soggy landing | Lowpassed noise gurgle (400 Hz) over 300 ms plus 5 random sine blips at 800–1400 Hz. | −12 |
| Soggy escape | A rising whistle, sine 700 → 1100 Hz over 150 ms. | −16 |
| Curl flip | Paper "fwip": highpass noise sweep 2 → 6 kHz over 90 ms. | −12 |
| Fall in water | Noise 250 ms with a lowpass sweep 3 k → 400 Hz plus a bubble tail. | −8 |
| Gator surfaces (hook) | Sine 80 Hz bloop over 200 ms plus bubbles. | −10 |
| Heartbeat | Two sine thumps 55 / 45 Hz, 70 ms each, 120 ms apart, at 60 + 80τ bpm. Gain `0.6·r(τ, 0.3, 1)`. | ≤ −14 |
| Flank telegraph | Rising filtered-noise hiss over 250 ms. | −14 |
| Near-miss | A jaw clack (two 20 ms square 140 Hz clicks, 40 ms apart) plus a reverse swell. | −8 |
| Chomp | Saw 110 Hz bite at 120 ms through a lowpass plus a noise crunch. Ducks music −9 dB over 600 ms. | −6 |
| Win | FM-marimba pentatonic run C5 D5 E5 G5 A5 C6, 70 ms apart, plus a chime. | −8 |
| New best | A bell ladder of 4 notes, a 5th above the win run. | −10 |
| UI | Paper tick on press (noise 8 ms) and a card slide whoosh. | −20 |

- **Music:** a kalimba-like FM ostinato, 4 bars in A-minor pentatonic over a low reed drone.
  - Tempo is 100 + 28τ bpm, quantised to bar starts.
  - A shaker layer enters at τ > 0.4.
  - A melody layer enters at k ≥ 33.
  - On fail, the music filter drops to 300 Hz over 400 ms; on win, it resolves to the tonic chord.
- **Ambience:** a brown-noise water bed at −30 dB and FM bird chirps every 4–9 s.
- **Mix:** chomp/splash > hop/land > danger > music > ambience, with the master limited to −1 dBFS. The audio context unlocks on the first input (hop 1).

## 9. Voice
Warm, a little cheeky, at most 7 words per line. Beyond the lines in §7: "No shadow. Bubbles. Sneaky." · "So close to your best." (within 1 s) · "Back to the pond" (resume).

## 10. Accessibility and comfort
- **Colour-safe:** all trick tells and danger cues use shadow, shape, motion and size. CI renders the layer-6 and layer-10 frames in grayscale, and a reviewer must tell the kinds apart. The ✕ flank chip is a shape.
- **Reduced motion** (follows `prefers-reduced-motion` by default; can be toggled):
  - shake is 0, the zoom is off, the route-trace camera cuts instead of easing, and ambient motion runs at 50% speed;
  - **gameplay tells stay** (bubbles and rocking at full speed, rocking amplitude ≥ 3°), because they are information.
- Mute is saved, and every audio cue has a visual equivalent. Pause works anywhere. Touch targets are ≥ 44 px. Nothing flashes more than 3 times per second.

## 11. Polish list (reviewers check each)
1. The first press produces a visible squash on the same frame; there is no "wait for animation" lag.
2. A press 100 ms before landing is never lost: it fires exactly on the landing tick.
3. A grayscale screenshot of layer 6 or layer 10 still separates lily, soggy and curl at 375 px width.
4. The soggy bubble pair keeps at least one bubble visible at every instant.
5. A curl pad's rocking never syncs with neighbouring pads' bob (different periods).
6. The frog's eyes look at its target pad (when idle, the forward pad).
7. The shadow separates from the frog in the air and rejoins exactly at touchdown, with no pop.
8. Chips pop in staggered left to right by 30 ms, and only after landing.
9. The pressed chip inverts (paper disc, ink glyph) for 80 ms.
10. Landing pads dip, ripple twice and toss 6 droplets, and the droplets land on water, not on the pad.
11. Hop pitch rises left → right, so your ears learn the slot.
12. Gator eyes blink every 2–4 s (80 ms), even while chasing. It is alive, not a sprite.
13. The gator's head turns toward the frog before the body follows (head leads by ≥ 2 segments).
14. The vignette pulses on the heartbeat, not on a separate timer.
15. Near-miss tooth tips flash `paper` for exactly one rendered frame.
16. The eaten card hint names the actual cause (standing still or flank).
17. The sunk card's diagram shows the real culprit pad's rotation and notch.
18. The timer uses tabular numerals, so digits never jitter in width.
19. The timer starts on the first takeoff, not on load.
20. "NEW BEST" never shows on a first-ever run; the first run says "First time: 31.20".
21. The route trace on win passes through every pad centre, in order, with no straight-line shortcuts.
22. Pause buttons depress 2 px with the shadow shrinking over 90 ms, and focus rings are visible on keyboard focus only.
23. Nothing on screen is static for more than 1 s, and the 1440×900 side banks are never empty margins.
24. Resizing mid-run keeps the frog at 64% height and no pad goes off-column.

## 12. Anti-goals
- It must never look like the classic road-and-river crossing game: no lanes, no rows sliding in alternating directions, no logs or turtles, no traffic, no pixel-art grid, no tile-snapped hops.
- No death you couldn't have read: every fail must have a cause visible ≥ 250 ms beforehand (a tell, a flank telegraph or rising jaws).
- No hue-only information, no text walls, and no restart friction ("Are you sure?", menus between runs).
- Not cute-sleepy: it is never an idle pond screensaver.

## 13. Acceptance by eye
Capture as JPEG q80, DPR 1, at **375×812 (touch)** and **1440×900 (keyboard)**, plus 1920×1080 for the title only:

| # | Moment (seed 7) | Expected |
|---|---|---|
| 1 | Load, t = 0 | §7.1 row 1. The ring and ↑ chip are visible and the wordmark doesn't overlap pads. |
| 2 | Hop 1 apex | The shadow gap is clearly visible and the legs form a V. |
| 3 | Layer 3 + 300 ms | The gator's eyes are surfacing at the bottom edge. |
| 4 | Layer 6 idle | One soggy pad forward and two lily pads. Also captured in grayscale. |
| 5 | Layer 10 idle | A curl pad is visible and the fold is distinct. Grayscale too. |
| 6 | Bot idles until τ = 0.6 | Eyes enlarged, jaws parted, vignette visible. |
| 7 | Scripted flank | The ✕ pad is framed by jaws, with honest chips elsewhere. |
| 8 | Near-miss frame | §7.2 near-miss row. |
| 9 | Eaten card +500 ms | Text fits at 375 width and the progress reed is visible. |
| 10 | Sunk card (curl) +500 ms | The diagram shows two callouts. |
| 11 | Win +1.0 s with new best | The route is inked, the stamp is legible and the zoomed river shows no lanes. |
| 12 | Pause | The veil, card and focus ring are all visible. |

The polish-critic also watches one human-paced run at 30 Hz and at 144 Hz.

## 14. Open decisions for the architect
1. The tick rate (120 Hz suggested) and how ms constants round to ticks. The gain maths in §4.3 must hold after rounding.
2. Seed policy: a new seed per run (my call) versus a daily river. Best time is all-time either way.
3. Whether the grayscale tell check is an automated pixel-variance test or a screenshot for review.
4. The size of the bot and test hooks (`window.__lily`: state, the `TUNING` override, the event log).
5. Whether pre-rendering the halftone and grain textures is enough for 60 fps at 375 px on low-end devices, or whether the halftone needs a quality tier.
