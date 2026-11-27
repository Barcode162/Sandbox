# Retro — M-0004 Skyrest: floating-isle action demo

## Outcome
| Success criterion | Delivered? | Evidence |
|---|---|---|
| Screenshot parity | Mostly (director 8.0 fidelity) | evidence/screens/moments/F2-*.jpg vs evidence/reference.jpg |
| Depth, alive at rest, golem presence, hits land | Yes | moments F1–F13; board/ship-director-vision-r2.md |
| Phone-first control | Yes in emulation; real iPhone not yet checked | tests/e2e/touch.phone.spec.ts |
| Whole small loop | Yes | tests/e2e/loop.spec.ts |
| Live on Pages | Yes | https://barcode162.github.io/Sandbox/skyrest/ (gh-pages 4ca6210) |

## Metrics
- Headcount 9 of 8 (1 engineer over budget, approved by the Owner): designer 1, architect 1, engineers 4, code-reviewer 1, polish-critic 1, director-vision 1.
- Findings 24: S1 7, S2 10, S3 7. Ship gate: round 1 REJECT 7.5, round 2 APPROVE 8.1.
- Two chats; one usage-limit stop mid-review.

## What hurt
- Work done but not logged: WO-004's fixes sat in WIP commits with no `finding resolve`, and the next chat had to reconstruct state from the code.
- Resolutions cited screenshots that were never written (F-023).
- A new chat can't resume earlier agents, so verification needed a fresh seat and pushed the mission over budget.

## Lessons
- L: an engineer resolves each finding in the CLI as soon as the fix lands, with evidence that exists on disk; the CEO checks the paths exist before re-review.
- L: before a session might end, commit and log; budget one fresh verifier seat for missions likely to span chats.

## Owed
- Check on a real iPhone. LP2 is still flaky at 4 workers (passes at the suite's 2).
- Next picture lever (director): stronger mid-sky blue, thinner god-ray haze, lighter sunlit temple cliff.
