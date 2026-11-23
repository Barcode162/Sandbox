# Board review — ship — director-vision — rounds 1–2 — M-0002

VERDICT: APPROVE (round 2; round 1 was CONDITIONAL 8.1)
SCORE: 8.3 / 10

## Rubric (round 2)
| # | Dimension | Score | Why |
|---|---|---|---|
| 1 | Fidelity | 8.5 | All four ideas work, and I reproduced the exact verdicts myself: route 25→3, then learned to 1 hop; Simmer gives 2 stirs / 100 °C under Cook and 4 stirs / 373 K under Physicist; Tea survives a reload. |
| 2 | Ambition & delight | 8.0 | The route race, the chord across the ring, the condition chip at the point of decision, and "Welcome back… Show Tea". F1 is handsome but still reads more as a diagram than a breathtaking sky. |
| 3 | Craft & polish | 8.0 | 34/34 findings are closed. Remaining nits: Stove goes unlabelled after reload, and the Store name placeholder is near-invisible. |
| 4 | Correctness & robustness | 8.5 | 85 unit tests and the hostile probes are closed. Live state matched the spec: lines 100/102/101, activation 2/4/12/11. |
| 5 | Engineering quality | 8.0 | Safe hand-written parser, one Dijkstra, a clean dispose, frozen contracts (code-reviewer pass). |
| 6 | Performance | 8.0 | Seed at 60 fps, under 1 ms per frame. At 500 nodes on software GL: median 16.7 ms, p95 33 ms. The search mark is 2.6 ms. |
| 7 | Accessibility & comfort | 7.5 | axe is green, there is a full keyboard map, and the results list mirrors activation depths. Tab never enters the canvas. |
| 8 | Evidence | 8.5 | Every frame has an e2e frame plus the critic's crops. I re-rendered each one independently. |

## What I verified myself (round 1)
I ran a real-time Playwright walk of the built product with no paused clock (scratchpad `walk.mjs`). The console showed 0 errors. Screens are in `/tmp/claude-0/-home-user-Sandbox/33578c24-f78d-5138-8040-875dbed69def/scratchpad/shots/`.
- **F1:** true black; reads Heat → flowcharts → ring. Pass.
- **F4/F5:** clean morph, ice halos, chips showing 293 K / 20 °C / 2 · warm. **The hub had no name** (Definition of exceptional #2).
- **F6–F8:** the short trail visibly wins, the verdicts are exact, and Learn draws a chord across the ring. This is the best moment in the product.
- **F9/F10:** the comet and condition chip sit at P4 and the result sentence is exact. The ×4 badge sat on P3's ring.
- **F11:** the depth ripple reads; counts 2/4/12/11.
- **F12:** Tea is born clear of Temperature, survives a reload, and search finds it. **It was unlabelled after reload** (#6).
- I also checked `?stress=500` and the 375 frame.

## Round 1 conditions
1. At F5, Temperature, Boiling Point and Room are named while the ghosts are expanded, with an e2e assertion. (F-032)
2. Tea is labelled at the overview after reload, with an e2e assertion. (F-033)
3. The loop badge touches no core or ring at F9 and F10, with an e2e assertion. (F-034)
4. `npm run verify` is green, with fresh frames.

## Round 2
I rebuilt at 6263e1f and re-ran the same real-time walk (`shots-r2/`).
- **C1:** met. At F5 t = 1400 ms, `labelRects` contains temperature, boiling-point and room, and all three are named beside their chips (`W05-F5-1400.jpg`).
- **C2:** met. After reload, Tea is named next to its light (`W13-reload.jpg`). Stove gives up its label instead; I accept that as S3.
- **C3:** met. Measured against `coreCircles`, the badge clears every star footprint by 6.2 px under Cook (×2) and 2.3 px under Physicist (×4) (`W10-F10.jpg`).
- **C4:** met. `npm run verify` printed VERIFY PASSED (17 e2e).

F-032 to F-034 are verified. **APPROVE at 8.3.** No dimension is below 7, and I would put my name on it in front of the Owner.
