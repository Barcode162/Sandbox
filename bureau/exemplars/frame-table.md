# Exemplar — the frame table (from M-0001 *Bent Light*)

This is the quality bar for an experience spec, taken verbatim from the mission whose output the Owner rated as the work they wanted. It shows **what to spend words on**. The whole six-scene section ran about 3,700 words. The other 14,000 words of that spec (traceability matrices, notation, restated rules, appendices) added cost without adding quality, which is why the spec is now capped at 6,000 words.

What makes it work:
1. **A north star you can screenshot against.**
2. **Elements in buildable terms:** tokens, sizes in viewport units with caps, and exact positions.
3. **Parameters as functions of progress** (`r(p, a, b)` is the 0→1 ramp of p across [a, b]), so every frame is deterministic and testable.
4. **One row per key moment: what's on screen, and why it is composed.** Builders build exactly these frames, polish-critics screenshot exactly these frames, and tests assert exactly these values.
5. **First-response numbers:** what visibly changes after the first 40 px of input.

---

## The brief's "definition of exceptional" (brief.md)

1. A stranger's first scroll produces a visible, delightful reaction in the first viewport. The opening frame is already art before any scroll.
2. Pausing anywhere, at any of 20 random scroll positions, lands on a composed frame worth screenshotting. No half-rendered, overlapping or awkward states.
3. Stillness is recognised and rewarded: within about a second of stopping, the interface chrome recedes and the scene breathes gently. Any input restores control instantly.
4. Scrolling back up rewinds every scene exactly. The same position always yields the same frame.
5. At least five distinct original scenes, each with its own technique and mood, linked by transitions so it reads as one authored piece rather than a demo reel.
6. A smooth 60 fps on a mid-range laptop, with no layout shift and no console errors.
7. A test suite that is itself legible: someone reading it understands what "correct animation" means for this site.


## North star (experience.md §1)

**Stop the scroll at any point and the screen is a hard-edged colour painting that tells you where the white light is in its journey. Every colour in that painting adds back up to white by the end.**

## One scene, frame by frame (experience.md §4)

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
