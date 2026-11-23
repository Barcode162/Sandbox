# Board review — ship — director-vision — round 1 — M-0002

VERDICT: APPROVE
SCORE: 8.3 / 10

## Rubric
| # | Dimension | Score | Why (one line, with evidence) |
|---|---|---|---|
| 1 | Fidelity | 9 | Every idea in the Owner's words is in the product. Black void, dots and lines forming webs, lenses with disagreeing values, if/while pathways with a pulse, and A→F→X→Z against 25 hops. Search lights the web by depth 2/4/12/11. |
| 2 | Ambition & delight | 8.5 | The pathway result "Cook: 2 stirs · Physicist: 4 stirs. Same pathway, different truths." is a real moment. So is the route race on the spiral ring. Missing: a reason to come back with your own data (M2). |
| 3 | Craft & polish | 8 | F1 is composed and legible, and the route and learned frames read like a transit map. Physicist ghost chips still crowd the Heat cluster (F-032). The "Learned" toast outlives the route drawer (seen in 7-pulse.jpg). |
| 4 | Correctness & robustness | 8.5 | 13 code findings verified, including honest save state, import confirm, the hostile-accent guard and the step guard. My walk logged 0 console errors. |
| 5 | Engineering quality | 8.5 | Headless core with 86 unit tests, contracts as code, 5 draw calls at 500 nodes. |
| 6 | Performance | 7.5 | Measured on my run: `?stress=500` frameMs 1.2–1.5 ms, 5 draw calls, 41–57 fps under SwiftShader. That means 60 fps on a real GPU is likely but unproven. Search ≤150 ms is asserted in e2e. |
| 7 | Accessibility & comfort | 8 | axe is clean. Every instrument is reachable by keyboard with Esc unwinding (E7), reduced motion snaps, the results list mirrors the activation, and there is a no-WebGL fallback. |
| 8 | Evidence | 8 | Each exceptional line has a test or a frame. The 60 fps claim and 3 polish items are not proven by automation; that is disclosed, not hidden. |

Mean 8.25; no dimension below 7.

## What I verified myself
- `cd projects/constellation && npm run verify` gave VERIFY PASSED: typecheck, unit, build, size, and 17/17 e2e.
- I walked the product as a stranger at 1440×900, `?seed=1`, through `npx vite preview` and Playwright. Frames are in the scratchpad `v/1-idle … 9-search.jpg`, and I opened each one.
  - **F1:** true black, a breathing web, 40 labels including Temperature, a lettered A–Z ring, Cook lit. It already reads as a memory.
  - **F5:** Physicist re-shapes the space and the sky goes ice. Temperature shows `293 K` with amber `20 °C` and pink `2 · warm` ghosts. Disagreement is shown, not hidden, which is the thesis.
  - **F7:** "25 hops → 3 hops · 88% shorter". The A→F→X→Z chord is lit and lettered.
  - **F8:** after Learn, a straight A–Z line, "25 hops → 1 hop · 96% shorter", and Learn disabled with an honest reason.
  - **F9/F10:** a while-loop pulse with the condition chip `20 °C < 100 °C → true`, ×4 badge, and `runs` = Cook "2 stirs · 100 °C" / Physicist "4 stirs · 373 K".
  - **F11:** "boil" lights the web with activation counts [2,4,12,11].
- I ran `?stress=500` and read the stats() figures above.
- Findings: no S0/S1 open. F-032 and F-033 are S3 and cosmetic, and I confirmed both on screen. **I waived both** and carried them to the M2 polish backlog.

## Judgement against the Owner's picture
The Owner asked for "a black space… points and dots and lines connecting them… forming webs", facades that disagree, while/if pathways, and the A→F→X→Z shortcut. All of these are visible within 30 s of opening, without reading a manual. A deep vertical slice; I would sign it.

## Conditions
None blocking. Follow-ups for M2 (not ship conditions):
1. Dismiss the "Learned" toast when the route drawer closes or the tab changes.
2. Thin the Physicist ghost chips near the Heat cluster (F-032), and clamp canvas icons below the top bar (F-033).
3. Measure fps at `?stress=500` on real GPU hardware and record it in the README.
