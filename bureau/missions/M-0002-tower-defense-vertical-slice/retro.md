# Retro — M-0002 Tower defense vertical slice (*Inkfold*)

## Outcome
| Success criterion | Delivered? | Evidence |
|---|---|---|
| Playable slice: 1 map, 4 towers × 2 paths × 3 tiers, 20 rounds, a boss | Yes | `projects/tower-defense/`, win script → victory R20 with 49 seeds |
| Verify green from clean, ≤ 8 min | Yes: 10/10 steps, 40 s | `npm run verify -- --strict` |
| R18 render p95 ≤ 8 ms; sim p99 ≤ 6 ms | Yes: 4.8 ms; ~1 ms | `evidence-local/perf/perf.json` |
| Flagship polish at the frame-table moments | Yes, at 8.2 vision | `board/ship-director-vision-r1.md`, `evidence/*-r2`, `evidence/gate2` |
| Compact small-window layout (≥ 12 CSS px at 900×600) | Deferred by CEO ruling (F-003) | next milestone |

## Metrics
- **Headcount 15 of 14** (+1 Owner-approved): designer 1, architect 1, engineers 6, code-reviewer 1, qa-tester 1, polish-critic 2, director-engineering 2, director-vision 1.
- Sessions: 4 (wizardly-allen → tender-keller → this one; build interrupted once by a usage limit).
- Findings: 37 (S1 3 · S2 19 · S3 15); 0 S0. Finders: polish-critic 21, code-reviewer 7, qa-tester 5, directors 4.
- Rounds: plan 1, ship 1 (vision CONDITIONAL → APPROVE after 2 conditions).
- Board: plan engineering 8.0; ship vision 8.2, engineering 8.4.

## Cost
- Agents 15/14; **resumes this session: 5** (verifier r3, both directors for conditions; earlier session resumed the 3 reviewers once).
- Largest document: `design/experience.md`, 5,375 words (cap 6,000). Total design+plan ≈ 9,300 words, versus ~70,000 on M-0001.
- Avoidable convenings: **2**. The second polish-critic and the second director-engineering only existed because the session that held the originals ended before their verifications/votes landed. A handoff that listed the pending verifications would have let that session finish them with free resumes.
- CEO glue closed 16 findings directly (F-001/002/006–012 earlier; F-031–037 here) for no headcount: draw order, clock domain, config, test pins.

## What worked
- Frozen contracts + stage hooks (`?test=1`, `window.__inkfold`): every verifier and director reproduced exact frames in minutes.
- A single fresh verifier covering two reviewers' findings (25 checked, 0 reopened, 3 real regressions found).
- Mutation-checking by the engineering director exposed an untested branch (F-035) that 182 tests missed.

## What hurt
- **Fix-induced regressions in the same frame:** F-022 (shed spray) → F-031 (splashes cross the boss); F-019 (coaster) → F-032 (coaster swell) → F-034 (clock domain). Each fix was judged on a still frame, not the motion sequence.
- **Timing test in a parallel unit pool** flaked under load for two sessions (F-001, F-036) before the cause (worker contention) was fixed at the root.
- Cross-session handoff omitted the unfinished verifications.

## Root causes
| Finding | Root cause | Stage that should have caught it |
|---|---|---|
| F-006 (S1 perf) | software raster cost + noisy single-pass probe | WO-004 build (budget measured once) |
| F-013 (S1 title idle) | peel staged behind type; spec not re-shot after wash change | WO-004 frame-table screenshots |
| F-014 (S1 boss hidden) | boss spawned under the inkwell sprite | WO-002/003 join screenshots of §10.6 |

## Escapes
F-036/F-037 (Board): perf flake and cranes over the HUD, both missed by three reviewers; the cranes because victory was shot at 2.7 s, after they'd passed.

## Next milestone (M2)
Escalation curve R10–R17 (vision), shorter first-pop wait (~7 s), full-defence storm shot, compact layout for small windows (F-003).
