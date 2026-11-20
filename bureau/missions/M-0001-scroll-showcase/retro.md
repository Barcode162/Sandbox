# Retro — M-0001 Scroll-driven animation showcase (*Bent Light*)

Written by the CEO in the v2 format (Bureau 2.0.0). Gates 2, review and retro did not run as designed: the Owner halted the mission over cost at 18:51Z, and the CEO finished alone under an Owner override.

## Outcome
Shipped and live at `https://barcode162.github.io/Sandbox/bent-light/`. `npm run verify` passed: typecheck, 140 unit tests, size checks, 49 e2e tests (17 animation tests that caught 2 planted bugs). **The Owner rated the craft as exactly what they wanted, and the cost as unacceptable**: about three full usage windows, halted before the review half of the pipeline had run.

## Cost
| | |
|---|---|
| Agents convened | 26 (tier 3 had no budget then; now it's 14, and this mission is tier 2's 8) |
| Agents resumed instead of convened | 0 |
| Words of planning documents | ~70,000: experience.md 17,835 · plan.md 17,069 · three variant specs ~30,000 · architecture.md 8,883 · board reports 8,700 · intel 7,100 |
| Work orders | 29 in 5 waves; waves of 4–8 parallel Opus agents |
| Wall time | intake → plan gate 1 h 47 m · wave 0 4 h 20 m (rate limits) · **CEO lean finish of the remaining build: 16 m** |
| Evidence committed | ~28 MB of PNGs, mostly spike stress captures nobody reopened |

## What made it good (keep)
1. The brief's **definition of exceptional**: seven testable lines.
2. **Rival directions judged with reasons**, where C won at 8.4 against 7.5 and 6.8. The director's cheap probe, which rendered the riskiest frames, decided it.
3. **Frame tables**: every scene as *p → what's on screen → why it's composed*. About 3,700 words carried the whole look. Now in `bureau/exemplars/frame-table.md`.
4. **Contracts frozen in code** (`types.d.ts`), which made both the parallel wave and the solo finish safe.
5. **Determinism tests with planted bugs**, and screenshots that were actually looked at.

## What hurt (cut)
1. **Oversized tier.** A single-page site was run at tier 3 because "when in doubt, go up". Tier was standing in for quality.
2. **Full specs for the losers.** Three ~10,000-word specs were written to choose one direction.
3. **Documents nobody builds from.** The traceability matrices, the restated brief and the 17,000-word plan were each re-read by every downstream agent.
4. **29 micro work orders.** Coordination cost more than building, as the solo finish shows.
5. **Respawning instead of resuming.** The designer and architect were each convened twice (4 designers, 2 architects); a resume would have kept their context.
6. **Wide Opus waves.** Eight parallel agents hit the rate limit within 8 minutes of wave 1.

## Root causes
| Problem | Root cause | Fixed by |
|---|---|---|
| Cost overrun | No budget; tier coupled to bar; "go up when in doubt" | U-0002: agent budgets enforced by `convene`; levers; "go down + add a lever" |
| Document bloat | No caps; templates asked for traceability | U-0002: word caps enforced by the gates and `vote` |
| Coordination overhead | Architect told "many small parallel WOs beat a few big ones" | U-0002: 2–6 vertical slices, ≤ 4 per wave |
| Lost context | No resume rule | U-0002: resume before you convene |

## Lessons recorded
L-0001 to L-0005 (see `bureau/memory/LESSONS.md`).

## Upgrade
U-0002 (major, approved by the Owner): Bureau 2.0, the lean economy.
