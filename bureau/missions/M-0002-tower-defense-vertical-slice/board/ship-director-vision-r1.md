# Board review — ship — director-vision — round 1 — M-0002

VERDICT: CONDITIONAL
SCORE: 8.1 / 10

## Rubric
| # | Dimension | Score | Why (one line, with evidence) |
|---|---|---|---|
| 1 | Fidelity | 8.5 | Every brief item is present: 4 towers × 2 paths × 3 tiers, 5+ kinds, boss bar, 1×/2×, auto-start, pause, settings, colourblind pips (walk `10-settings-cb.jpg`, `10-r18-8s-cb.jpg`). The 300+ storm happens in R18 only. |
| 2 | Ambition & delight | 7.5 | Real moments: title attract peel, ink flood on loss, cranes on victory, boss heave and tear. But the "screen-filling storm" reads as a conga line on one path segment (`10-r18-8s.jpg`), and escalation is a single spike (below). |
| 3 | Craft & polish | 8.5 | The papercraft world is original and cohesive, with strict palette discipline. 33 findings were closed and confirmed in pixels (polish-critic r2/r3). One residual: victory cranes are drawn over the Sheets pill and hide "1,092" (`10-victory.jpg`). |
| 4 | Correctness & robustness | 8.5 | My walk had zero console errors. The win script wins with 49 seeds; the loss script loses at R9; restart takes 2.8 ms. 0 open findings. |
| 5 | Engineering quality | 8.0 | Frozen contracts, a pure sim, stage hooks. The flaky gate assertion (below) is a quality miss. |
| 6 | Performance | 8.5 | R18 render p95 4.4 ms (budget 8); sim p95 1.3 ms in browser. |
| 7 | Accessibility & comfort | 8.0 | Shape pips, reduce motion, shake slider, keyboard throughout. The compact layout for small windows is deferred (F-003, CEO ruling). |
| 8 | Evidence | 7.5 | The CEO reported "verify --strict GREEN". My first strict run **failed** (unit p99 6.07 > 6 ms). Evidence sheets are otherwise excellent. |

## What I verified myself
- `npm run verify -- --strict` → `VERIFY FAILED (1)`: `scripts.test.ts:75` p99 6.068 vs ≤ 6. All other steps PASS.
- `npx vitest run` ×5 → 1 more failure (p99 8.9 ms). That is **2 of 6 runs red**. Typical p99 is about 1.1 ms, so the assertion is sensitive to noise, not a regression.
- My own Playwright walk (`scratchpad/walk.mjs`), 1280×720, DSF 1, real mouse and keys: Play → Tern card → place = **3 clicks**. The ghost, the green ring and the hatched no-build areas were visible before the click (`05-ghost-valid.jpg`); the invalid ✕ showed on the path; money went 650 → 450. Zero errors.
- The first pop comes **7.15 s** after R1 starts when the Tern sits on the star. My probe: a headless sim with the win script. Acceptable with 2× available, but quiet.
- Peak live blots per round, same probe: R1–9 at 10–35; R10 64; R14 68; R17 53; **R18 312**; R19 59; R20 48. The "trickle → storm" arc is flat from R10 to R17 and drops after R18.
- Opened r18, r20 arrival/shed/death, victory, gameover, fold cards, towers-sheet, title frames: all composed; tier-3 silhouettes distinct, tier 1–2 subtler but readable.

## Conditions
1. De-flake the Node perf assertion (`tests/unit/sim/scripts.test.ts:75`): isolate or serialise it, or gate on a robust statistic. Then show **10 consecutive green** `npx vitest run` and one green `npm run verify -- --strict`, both logged in the dossier.
2. Victory cranes must not hide HUD numbers: draw them under the HUD pills or route them around. Prove it with a victory frame at 1700 ms that shows the full Sheets value.

## Not conditions; carry to M2 (record in HANDOFF)
- Escalation curve: give R12–R17 a ramp in live-blot pressure (for example peaks of 100 → 250), and make R19 a pressure round before the boss, so that "one more round" builds instead of spiking once.
- The storm frame is staged by a thin 5-tower script. Add a "rich defence" stage (10+ towers, mixed tier 3s) so that "your upgraded defence shreds" is proven in a frame, not inferred.
- R1 first contact at about 7 s: consider a shorter spawn lead-in, or a faster first Dot.

I would sign this once conditions 1–2 are met.
