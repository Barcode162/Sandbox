# Log — M-0002 Tower defense vertical slice

Chronological record kept by `bureau`. Append with `python3 bureau/bin/bureau log <mission> "<decision>"`.

- `2026-11-20T21:00:43Z` **ceo** — Mission opened — tier 3 (Division), output `projects/tower-defense-vertical-slice`, agent budget 14, levers polish.
- `2026-11-20T21:01:23Z` **ceo** — Phase intake → **design**
- `2026-11-20T21:01:23Z` **ceo** — Convened 1× experience-designer — spec pass (no bakeoff)
- `2026-11-20T21:01:23Z` **ceo** — Intake: tier 3 + polish per Owner. Roles not loaded as subagent types; using general-purpose adopting role files (rule 9).
- `2026-11-20T21:14:10Z` **ceo** — Convened 1× architect — contracts+scaffold+architecture+plan
- `2026-11-20T21:14:10Z` **ceo** — Spec done: Inkfold (5,977 words). Convening architect.
- `2026-11-20T21:28:21Z` **ceo** — Phase design → **plan-review**
- `2026-11-20T21:28:35Z` **ceo** — Convened 1× director-engineering — plan gate r1
- `2026-11-20T21:28:35Z` **ceo** — Architect DONE. Fixed state.json output path (CEO glue). Designer resumed to trim spec (gate count 6233>6000).
- `2026-11-20T21:33:36Z` **director-engineering** — plan gate r1: CONDITIONAL (8.0)
- `2026-11-20T21:33:51Z` **ceo** — plan gate PASSED (round 1)
- `2026-11-20T21:34:26Z` **ceo** — Phase plan-review → **build**
- `2026-11-20T21:34:26Z` **ceo** — Convened 4× engineer — wave 1: WO-002..005
- `2026-11-20T21:34:26Z` **ceo** — Gate 1 PASS (DE CONDITIONAL 8.0). CEO folded 5 conditions: StageId +blots-grid/towers-sheet, PerfReport.p99StepMs, plan § Board conditions.
- `2026-11-21T01:28:36Z` **ceo** — Wave 1: all 4 engineers hit the 5-hour usage limit early; resumed all 4 via SendMessage after reset (no new convenings).
- `2026-11-21T01:47:11Z` **ceo** — WO-002 PARTIAL: sim/peel done, p99 0.93ms; win script dies R14. CEO updated architecture Events row (pooled). Relayed pooledEvents request to WO-003.
- `2026-11-21T01:49:17Z` **ceo** — WO-003 DONE. Resumed WO-002 for balance: CEO grants wave/blot/economy changes + ≤±15% tower stat exception in src/data, change table required.
- `2026-11-21T01:53:06Z` **ceo** — WO-004 PARTIAL (all built; blocked on WO-002 balance). CEO decision: narrow §10.1 title wash so the blots in the title frame rows read (frame rows win over wash spec); WO-004 to apply after balance. Resumed WO-005 (double SFX) and WO-003 (overlay doubling).
- `2026-11-21T01:59:32Z` **ceo** — Owner asked to wrap up for a new chat on another account. WO-002 balance and WO-004 perf fix passes were stopped mid-run. Verify 9/10 (perf FAIL). See HANDOFF.md.
- `2026-11-21T02:11:51Z` **ceo** — Resumed in new session (CEO). Verify baseline 9/10. Perf: the R18 p95 of 153 ms was mostly a probe artifact (300 frames in one task batch their raster into a few big flushes). Probe now reads back 1 px per frame → honest 16.7 ms. CEO fix (no new convening; same diagnosis would cost a cold-start engineer): blot sprite cache with device-pixel-snapped blits, pre-rendered vignette (edge bands only) and grain (multiply rewritten as an equivalent source-over alpha). R18 p95 6.2 ms ≤ 8. Visual diff vs before: mean |Δ| ≈ 1/255 at 1280 and 1920.
- `2026-11-21T02:11:51Z` **ceo** — WO-002 closed: balance had landed (win/loss scripts pass, 0 skips); CEO wrote the change table from the data diff and amended experience.md §6/§8/§10 to the shipped values.
- `2026-11-21T02:12:38Z` **ceo** — Phase build → **review**
- `2026-11-21T02:12:59Z` **ceo** — Convened 1× code-reviewer — review r1: product diff (sim, render, ui, app)
- `2026-11-21T02:12:59Z` **ceo** — Convened 1× qa-tester — review r1: flows, controls, viewports, edge cases
- `2026-11-21T02:12:59Z` **ceo** — Convened 1× polish-critic — review r1: §10 frame tables + §16 polish list
- `2026-11-21T02:13:37Z` **ceo** — Phase build → review. CEO filed WO-001 report (architect's scaffold). Convened code-reviewer, qa-tester, polish-critic (fresh, for independence) — headcount 10/14. Remaining 4: two ship directors (DE can't be resumed across sessions) + 2 spare for remediation.
