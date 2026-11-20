# Bake-off verdict: visual direction (Charter VIII.6)

M-0001 Scroll-driven animation showcase · director-vision · 2026-11-20

## Winner: **C, "Bent Light"** (design/experience-C.md)

It goes to consolidation with the fold-ins and cut/de-risk orders below. The C designer owns the consolidated `design/experience.md`.

---

## What I judged against

- **The Owner's ask** (brief.md:13): "cool animations as you scroll… stop at any time to admire the beauty… the website is about the animations… and tests for that itself".
- **The definition of exceptional** (brief.md:18-25).
- **CEO weighting:**
  - first-scroll wow and delight;
  - every stop composed;
  - cohesion as one authored piece;
  - buildability in one tier-3 mission within the budgets in intel/technique.md, with risky 3D or paint costs penalised;
  - testability.

No style frames exist, so I judged from the specs and ran one throwaway probe (below).

## What I verified myself

I wrote a throwaway probe at `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/bakeoff/sketch.js`. It drove 120 rAF frames per case in the bundled headless Chromium (SwiftShader), using the rAF-delta harness from technique.md E5.

| Sketch | What it reproduces | p50 | p95 | frames > 20 ms |
|---|---|---|---|---|
| `C3-screen` | C Scene 3 at 1440×900: cobalt, full dot pattern, 3 glass clipPaths × 3 full-viewport RGB pattern copies with `mix-blend-mode: screen`, all translating each frame | 16.7 | 16.7 | **0%** |
| `C3-normal` | Same, with normal blending | 16.7 | 16.7 | 0% |
| `A5-galaxy` | A Plate V at 1920×1080, DPR 1.5: full-stage canvas, `'lighter'` composite, 2,400 particles, 150 glow sprites, core gradient | 16.8 | **33.4** | **49%** |

What the probe shows:

- **C's riskiest paint case, Scene 3,** holds frame rate here. This is the "unmeasured SVG raster" that technique.md:87 flagged.
- **A's peak plate drops half its frames** in this environment. SwiftShader overstates the cost on a real GPU, but the brief requires evidence measured *here* (success criterion 8). A's peak scene would therefore have the worst numbers in the evidence pack.
- **C's chromatic aberration is too subtle at its own spec.** In the screenshot (`C3-screen.png`), with channel scales of 1.30/1.35/1.40 on r = 2.5 px dots, the RGB fringe is faint. The effect reads as "dots in a shape" more than "dispersion you can count". This becomes a de-risk order (D3).
- **The galaxy sketch** (`A5-galaxy.png`) is crude, and I did not judge A's beauty from it. It does confirm that a canvas particle galaxy needs heavy art tuning to avoid the "space demo" look that A's own anti-goals forbid.

---

## Scores

Scores are 0–10 against QUALITY_BAR anchors. They rate the *direction as specified*: what it would deliver if built to spec, discounted by the risk that it will not be.

| Criterion (CEO weighting) | A · Nocturne | B · Quire | C · Bent Light |
|---|---|---|---|
| Fidelity to the ask ("about the animations", admire, tests) | 8 | 8 | **8.5** |
| Delight and first-scroll wow | 7.5 | 8.5 | **8.5** |
| Every stop composed (20 random stops) | 8.5 | 7 | **9** |
| Cohesion as one authored piece | **9** | **9.5** | 8.5 |
| Buildability in one tier-3 mission within budgets | 6.5 | 4.5 | **8.5** |
| Testability | 8 | 6.5 | **9** |
| **Overall (judgement, not mean)** | **7.5** | **6.8** | **8.4** |

### C · Bent Light: 8.4 (winner)

**Why it wins:**

- **The strongest first viewport and first scroll.**
  - The opening frame is a gallery wall with a prism and a spectrum card: finished art from HTML and SVG alone (C §6).
  - The first wheel tick does two things at once: the fan opens by ≥ 60 px, and the title splits into CMY plates out of register (C:206).
  - A stranger reacts to *colour*, which is what "cool animations" means to most people. A opens on a quiet dark horizon. B opens on a cream title page whose hero type renders in Caladea here (B:519).
- **Composed stops by construction.**
  - Hard-edge colour fields cannot be caught "mid-glitch". Any width split between flat bands is a Kelly panel (C §4 Scene 2), and Scene 2 has explicit plateaus.
  - C is the only spec that states a per-scene "why it is composed" argument that holds at *every* in-between, not only at the five sample points.
- **The cheapest direction to build well.**
  - Bands are 7–9 divs moved by transform. Scenes 1 and 6 share one SVG module, and Scenes 2 and 5 share the `Bands` component (C:596).
  - There is one canvas, at ≤ 950 flat triangles.
  - The DOM is under 250 nodes and the JS is about 30 KB.
  - There is no 3D anywhere.
  - The one paint risk I could measure passed (above).
- **The best testability.** Several of its claims are exact pixel facts:
  - Scene 5 at p = 1 is `#FFFFFF` (polish 10);
  - the CMY plates in register multiply to black, R/G/B ≤ 3 (polish 2);
  - two seeded runs give byte-identical canvas output (polish 9);
  - identity-seam diffs (§3);
  - a **flash audit** with numeric luminance-reversal limits (§10).

  This is the "legible test suite" that exceptional #7 asks for.
- **Responsible about a real risk.** The photosensitivity design (luminance hills, slow full-field hue changes, no gratings, a capped red field) is the most mature safety thinking in the bake-off.
- **A real argument for its structure.** Split, isolate, recombine (after Newton), with the seven-band chorus at the end of Scenes 1 and 4 and inside Scene 5. That is enough cohesion to read as one authored piece.

**What holds it below 9:**

- **No single persistent protagonist.** A has the Ember; B has the Point. The chorus is subtler.
- **Weak Scene 3 visuals at spec** (probe above).
- **A long, technique-light Scene 2** (360 svh of accordion).
- **No admire placard.** The caption is *hidden* while admiring, so the site does not show that it noticed you.
- **Font loading:** `font-display: block` on the title.

All of these are fixable in consolidation.

### A · Nocturne: 7.5

**Strengths:**

- Cohesion is excellent: the Ember is in every frame, and a Powers-of-Ten readout gives the piece a spine.
- The specs I most want to steal: hold bands, the museum placard, the endpoint-contract table, and the claim-integrity discipline.
- Grin moments are real: the horizon bends, the readout races, the galaxy unwinds on rewind.

**Weaknesses:**

- **The first-scroll wow is soft.** A ripple and letter-spacing on a dark ground (A:93) is elegant but not a "visible, delightful reaction" for a stranger.
- **The peak is the most expensive scene in the bake-off.** The full-stage `'lighter'` canvas with 2,400 particles dropped 49% of frames here (probe). Plate II adds four large `mix-blend-mode: screen` ribbons, and its own risk table admits both are unmeasured (A:565-566).
- **The particle system spans four plates** (III→IV→V→VI: one seeded system, A:58). That is the hardest piece of engineering in A, and it is load-bearing for every match cut.
- **"Cosmic night" is the most familiar look of the three.** The anti-goals fight the space-demo cliché, but the direction invites it.

### B · Quire: 6.8

**Strengths:**

- The most original and witty concept. The full stop that becomes the last full stop of the colophon is the best single idea in the bake-off.
- Accurate per-band admire captions, imposition that rights itself, and a flipbook whose speed is your scroll speed.

**Why it loses:**

- **Buildability.**
  - Nested `preserve-3d` with a 4×2 panel grid, three valley folds and computed imposition (B §III).
  - 8 leaves × 6 nested curl strips (B §V).
  - A distance-transform pole and seven pre-rendered bitmap layers (B §IV).
  - A canvas bloom re-cropped into 3D faces, plus marbling.
  - A glyph split via `Range`, with pixel-matched DOM-to-canvas hand-offs.
  - A night-desk theme on top.

  Its own risk table rates scope **High/High** and 3D **Medium/High** (B:726, 731). This is the direction most likely to leave a half-finished build, which is exactly what the CEO asked me to penalise.
- **Composed stops are weaker.** Panels edge-on at θ ≈ 90°, z-fighting and seam hairlines across 3D folds are the classic "caught mid-glitch" states. Polish items 10 and 16 exist because the designer knows this.
- **Large-plane rotation is the main motion of three scenes** (III, V, VI). That stretches P11, and B concedes it (B:733).
- **Its hero is the typeface.** The type renders in whatever serif the system has (Caladea in our evidence, B:519), so the evidence we can produce here undersells it.

---

## Fold-in list: ideas from A and B that the C designer must add

Each item is an order. "Must" items are mandatory; "should" items are strongly recommended and may be declined only with a written reason in experience.md.

**F1. Admire placard (from A §Admire, A:222, A:288).** *Must.*
- At 3,000 ms of stillness a small museum label fades in (900 ms) at bottom-left, in the caption's slot. It shows the scene name and the integer global progress, e.g. *04 · Dichroic* / `held at 62%`.
- This is the visible proof that "the site notices you stopped".
- Under reduced motion it still appears, with the fade only.

**F2. Frame-accurate placard phrase (from B §5 `plateCaption`, B:320-329).** *Must.*
- The placard's second line is a phrase picked by a **pure, unit-tested** `placardPhrase(scene, p)` from per-scene p-bands, e.g. Scene 2 "Azure, standing in it." and Scene 5 "Almost agreed." It must be accurate to the frame.
- Write the phrases in C's voice.
- Test: each band boundary returns the documented phrase.

**F3. Hold bands (from A:71).** *Must.*
- Every scene declares one signature hold band, a p-range where all state changes at ≤ 25% of the scene's average rate, so a visitor who stops mid-scene lands on its best picture.
- Mark it in each scene table.
- This replaces C's rule that every 5% of track must change (C:196). Slow change still satisfies "never broken", so the two rules are compatible once that line is reworded.

**F4. Endpoint contract table (from A:535-547).** *Must.* A table of `state(0)` and `state(1)` assertions per scene, plus global assertions. These become the success-criterion-3 tests verbatim.

**F5. State-level seam test as the gate, pixel diff as evidence (from A:568).** *Must.*
- Each identity seam is asserted first as `snapshot()` equality of the shared geometry: band rects, dot grid and shelf positions from `geometry.js`.
- The pixel diff (≤ 0.5% of pixels at > 8/255) stays as captured evidence plus a test with tolerance.
- This keeps canvas and DOM anti-aliasing from flaking the suite.

**F6. Admire exit keeps the input's default action, with a synchronous restore (from B:345-348).** *Must.*
- Space both exits admire mode and scrolls.
- Visibility is restored synchronously, so Tab lands on a visible control.
- Pointer or keyboard interaction **on the pause control** does not exit admire mode (`isOnPauseControl` guard).
- Add these as polish items, with e2e cases.

**F7. De-duplicated admire announcements (from B:331).** *Must.* The live region announces only when the scene or placard band differs from the last announcement, and includes the scene name, e.g. "Admire mode, 04 Dichroic. Controls hidden…".

**F8. Resize keeps the frame (from B:449, polish B29).** *Must.* Resizing 1440 → 375 → 1440 restores the same global progress G and the same frame. Tested.

**F9. Engine error ledger (from A:530).** *Must.*
- In addition to the scene-error chip, any caught error is pushed to `window.__showcase.errors`.
- The full scroll-through test asserts the list is empty, alongside zero console errors.

**F10. Quantified first-scroll response at 40 px (from A:93, polish A2).** *Must.*
- C specifies its response at about 100 px. Trackpads and some wheels deliver much smaller first deltas.
- Guarantee a visible change (fan far-edge growth and plate split) by **40 px** of scroll, verified by a screenshot diff against p = 0.

**F11. Font loading: `swap` plus metric-matched fallback, not `block` (from A:391, polish A32).** *Must.*
- C:274 uses `font-display: block`, which can hold the opening frame's title invisible. That breaks "finished art at first paint".
- Use `swap` with `size-adjust`/`ascent-override` on the fallback, and test CLS ≤ 0.01.

**F12. Claim integrity in the copy (from A:355).** *Must.*
- Colophon p2 says "set in Space Grotesk". Gate that string on the font actually loading, with an alternate string if it doesn't.
- Every factual claim in the copy must be true at every breakpoint.

**F13. Admire suppression in the colophon (from A:238 (c)).** *Must.* Admire mode does not engage once the stage has released into the normal-flow colophon.

**F14. Reduced-motion test hook (from A:508).** *Must.* Under emulated `reduce`, `document.getAnimations()` contains no time-based animations, and `snapshot()` is constant across a plate's still range.

**F15. First-paint equality threshold (from B polish 1).** *Should.* A JS-disabled first paint and the JS-booted p = 0 frame differ by < 0.5% of pixels. This makes C's polish 1 numeric.

**F16. A persistent "thread" (from A's Ember and B's Point; adapted, not copied).** *Should.*
- Give the visitor one findable through-line besides the chorus: the **white beam**.
- It is visible as an element in Scenes 1, 5 and 6 already. Make it explicitly present as a 1 px white hairline or glint in Scenes 2–4 (for example, the dot grid's centre dot, and the light source in Scene 4 drawn as a small white point at the light angle θ).
- The spectrum rail's leading dot then becomes that same white point.
- Keep it to a single small element. Do not add a second protagonist.

**F17. Contact sheet under reduced motion (from B:485).** *Should.* At ≥ 1024, the reduced-motion cut of Scene 2 or Scene 4 may show the three stills as a small strip, so reduced-motion visitors still see the range.

**Rejected from the losers, so nobody re-litigates them:**
- single-key shortcuts (A): WCAG 2.1.4 surface for no gain;
- the corner-lift hint (B): time-based motion before input;
- the night-desk theme (B);
- a scale readout (A): it belongs to A's narrative, not C's.

---

## Cut / de-risk list: what in C must change

**D1. Seam fallback pre-approved, but only as a fallback.** *Must.*
- Keep identity seams as the design.
- If the 1 → 2 seam (SVG wedges to DOM bands) or the 4 → 5 seam (canvas bands to DOM bands) cannot pass F5 at both DPRs, use the spec's own fallback: a ≤ 3% p opacity crossfade inside the seam (C:570).
- Do not spend more than one fix round chasing sub-pixel equality.

**D2. Scene 4 canvas: cap DPR at 1.5 at ≥ 1440 (C says 2), and spike first.** *Must.*
- My probe shows that full-stage canvas compositing is the expensive class of work here (A5: 49% > 20 ms).
- C's triangles are `source-over` fills, which are cheaper, but they are unmeasured at 1920 × DPR 2 (8.3 Mpx per frame).
- The architect's first spike WO measures Scene 4 at 1920. Fallbacks, in order: DPR 1.5, then pitch +8 px, then redraw only on a p change.
- Precompute each facet's OKLCH → sRGB conversion as a lookup over `n·L`; do not convert per facet per frame.

**D3. Scene 3 must read as dispersion at a glance.** *Must.* At spec, the RGB fringe is too faint (probe screenshot `C3-screen.png`). The designer must:
- widen the channel scale spread (for example 1.25 / 1.40 / 1.55);
- enlarge the dots inside the glass (r 3.5–4 px);
- raise the dot opacity inside the glass to 100% against 55% outside;

so that rim dots visibly fan into separate R, G and B dots at 1440. Also:
- clip each pattern copy's rect to the shape's bounding box, not the full viewport (C:571 already lists this);
- descope the triangle–circle nested double-refraction clip first if it costs frames or clarity.

**D4. Scene 2: shorten and reconcile the photosensitivity arithmetic.** *Must.*
- The rule says each full-field hue change spans ≥ 60 svh (C:309). The numbers don't support it: 360 × 0.82 / 5 steps ≈ 59 svh per step, of which only 60% (≈ 35 svh) is the actual change.
- Fix the rule or the numbers: either state the true minimum change length and show that the flash audit still passes, or lengthen the moving portion.
- In addition, Scene 2 is the longest scene and the most technique-light. Trim it to ≤ 300 svh **unless** the 20-random-stop review shows that every plateau earns its length.
- One idea, not an order: let the dominant field carry a faint tone-on-tone shadow of the dot grid that densifies toward the end.

**D5. A descope order (missing from C).** *Must.* Add it explicitly, cut in this order:
1. the triangle–circle double refraction (Scene 3);
2. per-scene breathing variety, falling back to one global breathing recipe;
3. the scene-label crossfade, falling back to an instant swap;
4. the 1920-specific dot pitch, falling back to the 1440 pitch scaled.

**Non-negotiable:**
- the first-scroll hook (fan plus CMY split);
- the seven-band chorus;
- identity seams (or the D1 fallback);
- the admire placard (F1);
- the flash audit;
- Run it backwards;
- the portrait axis swap.

**D6. The flash audit becomes a real gate.** *Must.*
- The numeric limits in C §10.6 run in `npm run verify`.
- Also sample during the fastest tick-to-tick smooth navigation (Scene 1 → Scene 5), not only during the 8 s rewind, because tick jumps are a scripted fling.

**D7. Tick hit targets.** *Should.* Use 44 × 44 at all pointer types, not 24 × 24 on fine pointers (C:267). It is cheap and removes a reviewer argument.

**D8. Admire caption.** *Must.* C currently hides the caption in admire mode (C:225). The F1 placard replaces it in that slot, so admire mode never shows an empty corner where the caption was.

**D9. Brightness of the opening frame.** *Taste item for the designer, not an order.* A `--wall` field at Y 0.90 under an OS dark preference is a lot of light on arrival. Consider a ≤ 6% darker wall under `prefers-color-scheme: dark`, with the art otherwise unchanged. If adopted, keep the Scene 6 → colophon continuity (C polish 30).

**D10. Verify the font dependency.** *Must.* `@fontsource-variable/space-grotesk` 5.3.0 must be installed and verified offline in this environment before the plan freezes (brief A2/A3). If that fails, fall back to the system stack (C:574).

---

## Concerns carried to Gate 1

- The consolidated spec must keep C's per-scene "why composed" columns after the fold-ins. Hold bands must not turn into dead scroll (P3).
- The probe numbers are headless SwiftShader. Report frame timing as evidence, not as a hard gate (technique.md:153).
- Watch for resemblance to the famous album-cover prism (C:29). I will check the Scene 1 frames at Gate 2.

## Commendations

- **A:** the placard, hold bands and endpoint contract are the best admire and test specs in the bake-off.
- **B:** the Point's arc into the colophon's last full stop is the best single idea in the bake-off. I would like the Bureau to remember it for a future mission.
- **C:** the photosensitivity design and exact-pixel assertions set the standard for testability.
