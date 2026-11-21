# QA review r1 — M-0002 Inkfold (qa-tester)

Verdict: PASS WITH FINDINGS. Built from clean `npm ci && npm run build`; served with `vite preview :4317`; driven by Playwright (real mouse and keyboard; hook only for fast-forward and screens). Zero console or page errors in every session.

## Verify
`npm run verify`: 3 runs, 1 green. Failures were R18 render p95 8.6 and 8.7 ms against an 8 ms budget, plus one unit failure that passed on isolated rerun (F-001).

## Flows
| Flow | Result | Evidence |
|---|---|---|
| Title → Play → Tern card → place (3 clicks) | pass | money 650→450; place-ghost.jpg |
| Invalid placement (pond, rocks, cannon, path, jar, HUD, sidebar) | pass, no spend | money stays 650 |
| Overlap, 10 rapid clicks on one spot | pass, 1 tower | 450 |
| Buy with too little money (Frog 500 at 100) | pass, no spend | poor.jpg |
| Start round, speed toggle, Space ×9 spam | pass | state consistent |
| Upgrade by Z/X and by clicking cards; spend deducted | pass | 450→300→20 |
| Sealed path (A tier 2 seals B tier 2/3) | pass | sealed.jpg |
| Sell fresh fold (100 %) vs later (70 %) | pass | fresh +200 of 200; R1-placed after a round +140 |
| Targeting cycle (T ×5: First→Last→Strong→Close→First→Last) | pass | t5 screenshot reads "Last" |
| Pause / resume / blur auto-pause (ticks stall) | pass | |
| Restart mid-round (R, R) | pass, R1/650/100 | after-r.jpg (F-002) |
| Settings from title (click) | pass | settings.jpg (F-004) |
| Auto-start | pass | R1→R2→R3 unattended |
| Loss → game over → Enter retry | pass | gameover.jpg; loss at R9 |
| Win → victory card → Enter replay | pass | victory.jpg; 61 seeds, 5,674 pops |
| R18 storm / boss frames | pass (about 100 blots visible, reads well) | r18.jpg, boss.jpg |
| Title key spam, double-click Play, Esc/P spam | pass, no stuck state | |
| RMB cancel placement | pass | |

## Viewports
1280×720 (all flows), 1920×1080 (click mapping exact at 1.5×), 900×600 (letterbox; F-003), 800×1000 (letterbox bars, input mapped correctly; play-800x1000.jpg), live resize to 1000×700 (canvas refits).

## Measurements
Hook ready 130 ms. Sim p95 0.90 ms (budget 4). R18 render p95 8.6–8.7 ms (budget 8, fails). Heap growth 0.02 MB.

## Criteria (brief)
| Criterion | Result |
|---|---|
| 1 verify green | flaky (F-001) |
| 2 win script victory; loss reaches game over; restart resets | pass |
| 3 all towers, paths and tiers purchasable | spot-checked (Tern fully, sealed rule); other towers via the screens step only |
| 5 determinism (30/144 Hz) | pass in verify |
| 6 perf [A3] sim | pass; render budget borderline |
| Peel visible (colour change, children) | pass by eye on r18.jpg |

## Findings
F-001 S2 verify flaky. F-002 S3 README restart. F-003 S3 text 8 px at 900×600. F-004 S3 settings spacing. F-005 S3 hook stage after retry. No S0/S1.

## Not covered
Audio by ear, touch, colourblind visual diff, full manual purchase of Frog, Koi, Owl tiers.

## Verification r2
Build at HEAD 4d0c155, served read-only on :4533.
- F-001 verified: `perf.mjs` R18 render p95 5.00 ms (median of 3; budget 8). Full verify not run, per CEO; I accept the CEO's green run.
- F-002 verified: README states R must be pressed twice in pause.
- F-003 accepted: logical-px ruling stands; compact layout is a next-milestone item.
- F-004 verified: `evidence/qa/settings-r2.jpg` shows clear spacing and a divider above Back.
- F-005 verified: after victory retry, `stage('r18-8s')` and `stage('r20-arrival')` reach R18 and R20.

Core flows re-run by real input at 1280×720, zero console or page errors:
- Settings click and Esc back: pass.
- Play pressed, dragged off and released outside: stays on title; click on Play works.
- Two Terns by hotkey and click: pass.
- Z buys; unaffordable X does not spend: pass.
- Sell after upgrades +245 (70 % of 350): pass.
- Pause button click; R R restarts to R1/650/100: pass.
- Game-over Try again click and victory Enter replay: pass.
- Boss arrival and R18 stages reached.
- Win script: victory, 49 seeds, 5,662 pops.
- Re-laid-out fold card (`fold-r2.jpg`) reads cleanly.

No regressions; no new findings.
