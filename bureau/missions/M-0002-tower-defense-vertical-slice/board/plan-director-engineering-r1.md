# Board review — plan — director-engineering — round 1 — M-0002

VERDICT: CONDITIONAL
SCORE: 8.0 / 10

## Rubric
| # | Dimension | Score | Why (one line, with evidence) |
|---|---|---|---|
| 1 | Fidelity | 8.5 | I checked the §6/§7 tables against `src/data/blots.ts` and `towers.ts:22-91` field by field and found no transcription errors. |
| 2 | Ambition & delight | 8.0 | Feel numbers are frozen in `feel.ts`. |
| 3 | Craft & polish | 8.0 | The two sprite/blot sheet captures have no way to run (C1). |
| 4 | Correctness & robustness | 7.5 | Peel-in-place, a tick-keyed queue, a purity test and stable tie-breaks are all sound. Pool-full behaviour is undefined (C4). |
| 5 | Engineering quality | 8.0 | Contracts are in code (L-0004). OWNS lists across WO-002..005 are disjoint, and there are 4 in the wave (L-0005). WO-004 is oversized for one sitting. |
| 6 | Performance | 7.5 | The budgets are numeric and say how each is measured. The "0 alloc in collision" budget contradicts the per-hit `SimEvent` literals and is never measured (C3). |
| 7 | Accessibility & comfort | 8.0 | Colourblind shapes and pips, reduce-motion and the settings store are in contracts and data. |
| 8 | Evidence | 8.0 | Verify is real and green. The strict run has no wall-clock budget and could take tens of minutes (C2). |

## What I verified myself
- `npm ci && npm run verify` from a clean `dist/`: typecheck, unit (19 tests), build, size 3.3 KB and boot all PASS. Four steps are PENDING. Exit 0.
- Installed versions match the plan (vite 8.3.8, vitest 5.1.1, TS 6.0.2, playwright-core 1.63.0).
- R18 RBE by hand: 750+120+180+84 = 1134, matching `waves.ts`.
- Ownership: no path is claimed twice; every stub file has one owner.
- Determinism design: `loop.ts` only returns a step count, and the driver is tick-keyed (`bot.ts`), so the 30/144 Hz test exercises the real app loop. Not hollow.
- Run length: from the wave table, about 466 s of sim time, which is ~28k ticks and **~67k rendered frames at 144 Hz** (my estimate script, using `ROUNDS`).
- `vitest.config.ts`: `environment: 'node'`, no Canvas 2D.

## Conditions
1. **Sheet captures need a home.** WO-002's `blots-grid.jpg` and WO-003's `towers-sheet.jpg`, with its ≥ 2 % pixel-diff "in the test", cannot run: Vitest has no canvas, `StageId` has no such ids, and `scripts/**` belongs to WO-005. Fix: the CEO adds `'blots-grid' | 'towers-sheet'` to `StageId`, WO-004 composes both stages from `drawBlotShape`/`drawTowerSprite`, and WO-005 captures them and runs the pixel-diff in `screenshots.mjs`.
2. **Verify wall-clock budget.** State a budget for `npm run verify -- --strict` (proposal: ≤ 8 min here) and say how it is met. `stage('r18-*'/'r20-*')` fast-forwards the sim without drawing, then renders ≥ 30 frames. The 144 Hz `playScript` calls `loop.frame` on every frame but may draw every Nth. Add a cross-check: the e2e `RunSummary` for the win script must equal the Vitest `playScript` summary for `SCRIPT_SEED`.
3. **Allocation budget honesty.** Either pool `SimEvent`s or restate the budget as "no allocation in hot loops other than event literals". Add `p99StepMs` to the evidence with a budget (≤ 6 ms) so GC churn shows up.
4. **Pool overflow.** Define what happens when the blot or projectile pool (2048) is full: no throw, deterministic drop, plus a counter folded into `stateHash`. Add a WO-002 unit test that fills the pool.
5. **Name the post-integration balance pass.** After WO-003 lands, WO-002 is resumed to run the Vitest win/loss tests and to turn only the `balance.ts` knobs. At ship there may be no `it.skip` and no fake tower system left in those tests.

## Recommendations (not blocking)
- Move the Wax-immunity unit test to WO-002: against a fake `SimContext` it tests the fake.
- Rename `Blot.immuneTo` (a source id) to `immuneSource`; `BlotDef.immuneTo` holds damage types.
- Give WO-004, the largest order, two checkpoints: (a) shell, input, compositor, HUD, hook; (b) screens, stages, cranes.
- At 2× speed the storm costs about 2 × 4 ms of sim plus 8 ms of render, near the 60 fps edge. Probe R18 render at 2× too.
