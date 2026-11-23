# Retro — M-0002 Constellation: 3D relational memory space

## Outcome
| Success criterion | Delivered? | Evidence |
|---|---|---|
| SC1 verify green: typecheck, unit per core module, 5 e2e flows, axe, console, screenshots | Yes | `npm run verify` at 4a1388b: 86 unit, 17 e2e, 189.6/230 KB gz |
| SC2 each "exceptional" line shown by a test or screenshot | Yes, except 60 fps | E1–E7 + evidence/screens; 500 nodes measured 41–57 fps under SwiftShader only |
| SC3 README: model, controls, JSON format | Yes | projects/constellation/README.md, docs/memory-format.md |

## Metrics
- Headcount 7 of 8: designer 1, architect 1, engineers 2, code-reviewer 1, polish-critic 1, director-vision 1. Every later pass was a resume (designer and architect not resumed; engineers resumed 4×, critic 4×, reviewer 1×).
- Waves: design ∥ architect; build (2 engineers); review (2); ship (1). Never above 2 parallel.
- Findings: 33 total — S1 2, S2 20, S3 11. Code-reviewer 13, polish-critic 20. S3 F-032/F-033 waived by director-vision.
- Remediation rounds: 3 (r1 both engineers; r2 both engineers; r3 CEO fixed F-024/F-031 directly, critic verified). Plan 1, ship 1.
- Final board: director-vision APPROVE 8.3.
- Two 5-hour usage-limit stops (WO-003 mid-build; both engineers at start of r2). No work lost: CEO checkpointed the tree and resumed the same agents.

## Timeline
Intake → brief; design ∥ architect (contracts + scaffold green on empty suites); build wave (core 77→80 unit, view); join green; review r1 (29 findings); r1 fixes; verification (5 reopened, 1 new); r2 fixes; r3 CEO fixes; ship APPROVE.

## What worked
- Running designer and architect in parallel, with the brief pinning the data model: contracts never waited on the spec, and only one additive contract change (units) was needed.
- Frame-table spec with asserted numbers (100/102/98 lines, 25→3 hops, 2/4/12/11) turned straight into unit and e2e assertions.
- Resuming the same agents for every later pass, including across usage-limit stops.
- The polish-critic looking at real screenshots caught what tests could not: unreadable ring, shortcut not crossing, labels on stars.

## What hurt
- Engineer contexts grew to ~500k tokens by round 2; each resume was expensive. Small late fixes were cheaper for the CEO to do directly (r3).
- Seed geometry was re-authored twice (spiral ring, then re-spacing) because the spec's layout numbers had never been rendered before the build.
- A stale `dist/` made a correct fix look broken: e2e runs against `vite preview`, so the build must run first.

## Root causes
| Finding | Root cause | Stage that should have caught it |
|---|---|---|
| F-001 "Saved" shown when nothing saved | Autosave status bound to the debounce firing, not to a confirmed write | WO-003 acceptance: no criterion for a failing storage |
| F-014 route/search off-screen | Frame table assumed the default camera; no frame started from a zoomed state | Spec: frame table had no "after prior interaction" row |

## Escapes
None reached the board as a blocker; the director's three follow-ups were already known (toast persistence was new).

## Lessons
See L-0006, L-0007.
