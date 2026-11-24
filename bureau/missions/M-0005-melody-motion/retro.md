# Retro — M-0005 Melody's Crystals: motion

## Outcome
| Success criterion | Delivered? | Evidence |
|---|---|---|
| `npm run verify` green incl. motion tests (coverage, reduced motion, no-JS/failsafe visibility) | Yes | static + 9 unit + 69 e2e (19 motion) |
| No console errors; CLS ≤ 0.05 on home and product | Yes | CLS tests; director measured 0.0059 |
| Polish-critic passes the motion frames | Yes | polish-critic r2 round 3: nothing open, 14/15 list |

## Metrics
- Agents: designer, code-reviewer, polish-critic and director-vision, **all resumed from M-0004** (4 of 8 in the books; no cold starts).
- Findings: 17 (S0 0 · S1 3 · S2 6 · S3 8). Code-reviewer 7, polish-critic 10. All verified by their filers, two reopened once (F-009, F-013).
- Board: director-vision APPROVE 8.5, with 3 non-blocking conditions, all applied.
- A usage-limit stop mid-review cost one resume; no work was lost.

## What worked
- Resuming M-0004's agents: they knew the site, so the spec took one pass and the reviews went straight to motion.
- A declarative motion layer (`data-reveal`/`data-stagger` + one module) gave about 75 components motion with little per-page code.
- Coverage test keyed on `data-motion` ids made "all the components" checkable.

## What hurt
- The 3 s reveal failsafe was unconditional, so it killed the scroll choreography after 3 s (found by both reviewers). Failsafes must be conditional on the failure they guard.
- The observer's bottom rootMargin created a zone that never reveals. The honesty footer line was hidden in one of 9 runs (F-008/F-015).
- Animating label children above absolutely positioned hidden radios moved them under the label body (z-index), which broke 27 tests until the inputs got z-index 2.
- The coverage detector missed motion on pseudo-elements and in state-gated components, so it was flaky by worker order.

## Root causes
| Finding | Root cause | Stage that should have caught it |
|---|---|---|
| F-001/F-007 | Unconditional failsafe | Build: a test that scrolls after the failsafe window |
| F-006 | Detector ignored ::after and empty states | Build: run the suite 3× before review |
| F-008/F-015 | rootMargin dead zone at page end | Build: an end-of-page reveal test at two viewports |
