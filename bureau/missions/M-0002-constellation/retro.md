# Retro — M-0002 Constellation: 3D relational memory space

## Outcome
Shipped `projects/constellation` at the Gate 2 vote: director-vision **APPROVE 8.3** in ship round 2 (round 1 was CONDITIONAL 8.1). `npm run verify` is green: 85 unit tests and 17 e2e tests, with axe, console and screenshot checks. Every success criterion in the brief has a test or a frame in `evidence/screens/`.

| Success criterion | Delivered? | Evidence |
|---|---|---|
| SC1 verify green | yes | `npm run verify` (5 e2e flows, axe, console) |
| SC2 each "exceptional" line shown | yes | E1–E7 frames; U-routing, U-flow |
| SC3 README: model, controls, format | yes | README.md, docs/memory-format.md |

## Metrics
- **Agents:** 8 of 8. Experience-designer 1, architect 1, engineer 2, code-reviewer 1, polish-critic 2, director-vision 1. Two resumes stood in for new conveners: the r2 critic re-checked F-031, and the director re-voted round 2.
- **Findings:** 34 in total: S1 2, S2 23, S3 9. By role: polish-critic 18, code-reviewer 13, director-vision 3. All are closed.
- **Rounds:** plan 1, ship 2, remediation 3.
- **Board:** vision 8.1 → 8.3.

## Timeline
- **2026-11-22:** intake → design → plan gate.
- **Wave 1 build** (WO-002 core, WO-003 view).
- **2026-11-23:** review r1 → remediation r1 → verification r1 (5 reopened, F-030 new).
- **Session ended mid round 2.** It was resumed in a new session on another branch. The CEO merged the work and did round 2 itself, since the engineers could not be resumed.
- **Then:** polish r2 (6 verified, F-031) → F-031 → ship r1 CONDITIONAL (3 conditions) → fixes → ship r2 APPROVE.

## What worked
- **A layout probe.** `scripts/probe-layout.mjs` turned the critic's words into numbers: Heat gap ≥ 28 px, ring clearance ≥ 40 px, 0 labels or chips over cores, halo chroma ≥ 20. Round 2 converged against the numbers before any reviewer was spent, and the fresh critic verified all 6 on the first pass.
- **CEO remediation when the builders were gone.** It kept 2 budget slots for independent verification and the vote.
- **Resuming critics and directors** for re-checks cost no budget.
- **The seed's byte-identity test** (U-persistence-2) caught a post-pass edit of memory.json. The spacing rules now live in the generator.

## What hurt
- **A cross-session halt.** Round 2 had been routed but not started, and none of that agent context survived. Each phase checkpoint commit is what made the resume cheap.
- **Fixes in one rule regressed another.** The round 2 rule "only selected or hovered labels may sit over cores" cleared the knot. But it unnamed the Temperature hub (F-031) and the stars whose chips were showing (F-032). An "absence of overlap" assertion can't see a missing name.
- **Layout was judged in world units** (3D minimum distance of 15 u) while the overlap was on screen. The 16-node Heat cluster knotted after the r1 regeneration (F-030).

## Root causes
| Finding | Root cause | Stage that should have caught it |
|---|---|---|
| F-030 (S2) | Spacing checked in 3D, not in projection | Architect (no screen-space budget for the layout) |
| F-031/F-032 (S2) | A declutter rule tightened without asserting who stays named | CEO round 2 (e2e covered overlaps only) |
| S1s (r1) | See reviews/*-r1.md | Build self-check |

## Escapes
F-032 to F-034 were found by the Board, not by the Quality Division. The r2 critic noticed the unnamed hub at F5 but recorded it as old and did not file it.

## Cost
The resume was the right call: a restart would have re-run design and build. Pressure on the budget came from the session ending, not from over-convening.
