# Report — WO-003 — remediation round 1

STATUS: DONE
Discipline: rendering + frontend · Mission: M-0002 · Round: fix-r1

## Built
I resolved all 23 WO-003 findings (2 S1, 15 S2, 6 S3), each with a test or a screenshot. The UI side of F-007 is wired to `learnShortcutDetailed` (the finding was closed by the core engineer). F-016's new spiral ring is re-checked in F6–F8: the A–Z chord now crosses the empty centre (`evidence/screens/F8-shortcut-learned-1440.jpg`).

## Done-when criteria
| # | Criterion | ✓/✗ | Evidence |
|---|---|---|---|
| 1 | F-001: Saved only after a confirmed write; "Not saved" state | ✓ | `instruments.spec.ts` [F-001]; `flows.spec.ts` E5 `#saved` |
| 2 | F-014: route and search reframe the camera | ✓ | `instruments.spec.ts` [F-014]; F7-route-complete-1440 |
| 3 | S2s: F-003/4/5/6/15/17–26 | ✓ | `finding list M-0002` (all resolved, with evidence lines) |
| 4 | S3s: F-011/12/13/27/28/29 | ✓ | same |
| 5 | Re-shot frames looked at | ✓ | F1, F5, F7, F8, F9, F11, F12 at 1440 and F1 at 375, in `evidence/screens/` |

## Verify
`npm run verify` gives VERIFY PASSED: typecheck, unit, build, size (189.6 KB gz) and e2e (17/17, 3 new regression tests).

## Root causes worth knowing
- **F-021:** shader kind and op codes were compared as interpolated varyings, so float error sent some pathway nodes to the disc branch. They are now rounded first.
- **F-015:** Long Road letters were dropped by the small-radius rule. They now bypass it and no longer spend the 40-word label cap, though they still go through the overlap test.

## Gaps and requests
- F-019: the lens tint is visible but still subtle at overview distance (small halos). Re-judge at review.
- The spec copy "Try the Long Road: A → Z" became "Try the featured route: A → Z" (F-012, to keep seed knowledge out of the UI). An optional `meta.featured.route.label` would restore it. REQUEST for the core/CEO.
- Files outside OWNS: none.
