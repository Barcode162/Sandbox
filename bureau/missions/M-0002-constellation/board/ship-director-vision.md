# Board review — ship — director-vision — round 1 — M-0002

VERDICT: CONDITIONAL
SCORE: 8.1 / 10

## Rubric
| # | Dimension | Score | Why |
|---|---|---|---|
| 1 | Fidelity | 8.5 | All four ideas are real, and I reproduced the exact verdicts myself: route 25→3, then learned to 1 hop; Simmer gives 2 stirs / 100 °C under Cook and 4 stirs / 373 K under Physicist; Tea survives a reload. F5's hubs have no names. |
| 2 | Ambition & delight | 8.0 | The route race, the chord across the ring, the condition chip at the point of decision, and "Welcome back… Show Tea" all land. F1 is handsome but reads more as a diagram than a breathtaking sky. |
| 3 | Craft & polish | 7.5 | 31/31 findings closed. Residuals: F5 hubs unlabelled, the ×4 badge sits on P3's ring (`W10`), Tea unlabelled after reload, and the Store name placeholder is near-invisible (`W12a`). |
| 4 | Correctness & robustness | 8.5 | 85 unit tests and the hostile probes are closed. Live state matched the spec: lines 100/102/101, activation 2/4/12/11. |
| 5 | Engineering quality | 8.0 | The code-reviewer passed it: a safe hand-written parser, one Dijkstra, a clean dispose, frozen contracts. |
| 6 | Performance | 8.0 | Seed at 60 fps, about 1 ms per frame. At 500 nodes on software GL: median 16.7 ms, p95 33 ms. The search mark is 2.4 ms. |
| 7 | Accessibility & comfort | 7.5 | axe is green and there is a full keyboard map. The results list mirrors the activation depths. Tab never enters the canvas. |
| 8 | Evidence | 8.5 | Every frame-table moment has an e2e screenshot and the critic's measured crops. I re-rendered them independently. |

## What I verified myself
I built the product, served it on port 4182, and ran my own real-time Playwright walk with no paused clock (scratchpad `walk.mjs`). The console showed 0 errors. Screens are in `/tmp/claude-0/-home-user-Sandbox/33578c24-f78d-5138-8040-875dbed69def/scratchpad/shots/`.
- **F1** (`W01`): true black, Heat at the centre, the flowcharts flanking it, the ring as a horizon. Pass.
- **F4/F5** (`W04`, `W05`, `W05b`): the morph is clean with no pop, and the halos turn ice. The chips read 293 K / 20 °C / 2 · warm. **The star they orbit has no name until about 4 s**, so a stranger cannot tell whose truths these are.
- **F6–F8** (`W06`–`W08`): the short trail visibly wins the race and the verdict is exact. Learn draws an A–Z chord across the empty ring. This is the best moment in the product.
- **F9/F10** (`W09`, `W10`): the comet sits at P4 with its condition chip. The result card and the comparison sentence are exact.
- **F11** (`W11`): the depth ripple reads; counts 2/4/12/11.
- **F12** (`W12`–`W14`): Tea is born clear of Temperature. After reload the toast offers "Show Tea" and searching "tea" finds it, but Tea is unlabelled in the overview.
- I also ran `?stress=500` and checked the 375 frame (`evidence/screens/F1-idle-375.jpg`).

## Weighing the known S3s
- **The F5 nameless hub becomes a condition.** It falls on Definition-of-exceptional #2: the values are readable but cannot be attributed to a star, and this is the thesis frame.
- **Tea unlabelled after reload becomes a condition.** It falls on #6: the thing you stored should name itself in the sky.
- **F12 Ice and Stove:** both were labelled in my run. I accept this as S3.

## Conditions
1. F5 (Physicist, t = 1400 ms, 1440): Temperature, Boiling Point and Room show their name labels while the ghosts are expanded. An e2e test asserts that the Temperature label is shown and that there are 0 text overlaps.
2. After reload, the node the Owner stored (Tea) is labelled at the default overview. An e2e test in [E5] asserts it.
3. F9/F10: the loop badge sits beside P4 and touches no node core or ring. An e2e test checks the badge rect against the projected cores.
4. `npm run verify` is green, with new F5, F10 and reload frames in `evidence/screens/`.
