# Board review — ship — director-engineering — round 1 — M-0002

VERDICT: APPROVE
SCORE: 8.4 / 10

## Rubric
| # | Dimension | Score | Why (one line, with evidence) |
|---|---|---|---|
| 1 | Fidelity | 8.5 | Code review found the §6 peel, §7 targeting and Owl auras match the spec (`reviews/code-reviewer-r1.md` "Checks that passed"). Data parity tests pass (`tests/unit/data/spec-data.test.ts:59`). |
| 2 | Ambition & delight | 8.5 | All 33 findings are verified, including the boss emergence, shed spray and death burst (log 03:40–03:43). I opened none of the screenshots myself; that dimension belongs to the Vision seat. |
| 3 | Craft & polish | 8.5 | The three CEO glue fixes are minimal and commented (`git show cf41b33`: 10+/6− lines across 3 files). Each was re-verified with recaptures (r3-F-031/032/033). |
| 4 | Correctness & robustness | 8.0 | Play is deterministic at 30 vs 144 Hz (hash 59bb1388, tick 38438), and the pools drop deterministically when full (`peel.test.ts:271-295`). Two new S3s: F-034 pause mid-morph (from code reading) and F-035 (untested 2-skip). |
| 5 | Engineering quality | 8.5 | Sim purity is enforced, the `SimContext` seam is clean, and the event slabs are pooled. No `.skip`/`.only`/TODO anywhere (grep). The tree was clean after verify. |
| 6 | Performance | 8.5 | Measured here: sim p95 0.90 ms (≤ 4), p99 1.60 (≤ 6), heap +0.02 MB (≤ 5), ready 154 ms (≤ 1500). R18 render p95 4.8 ms, median of 3 (≤ 8). Thin margin: one pass hit 7.3. |
| 7 | Accessibility & comfort | 8.0 | Colourblind shapes, reduce-motion and the settings store are in place. The 900×600 shots pass. The compact layout is deferred (F-003, CEO ruling). |
| 8 | Evidence | 8.5 | Verify is a real gate: the browser and Vitest summaries are identical, the pixel-diff analyser self-tests, and a damage mutation fails 2 tests. Gap: no golden hash is pinned (F-035). |

## What I verified myself
- `rm -rf dist evidence-local && npm run verify -- --strict` → **VERIFY GREEN**, 10/10 PASS, total 42.0 s (budget 480 s).
- The playthrough is not hollow:
  - the win bot reaches victory with 49 seeds;
  - the loss bot is defeated at R9;
  - restart takes 2.6 ms;
  - "browser summary identical to Vitest" holds for both scripts.
- Determinism: 30 Hz and 144 Hz agree on outcome, round, tick, lives, money, pops and hash.
- Mutation tests on a scratch copy (product untouched):
  - Tern damage 1→2: **2 unit tests fail**, so the tests can fail.
  - `p.skipsLeft -= 2` (`sim/towers/index.ts:436`): 182/182 still pass, so this one survives (F-035).
- Gate-1 conditions are all honoured:
  1. `blots-grid`/`towers-sheet` are captured and pixel-diffed with an analyser self-test (`scripts/e2e/screenshots.mjs:19,30,79`). The JPGs are in `evidence-local/screens/`.
  2. The 480 s budget is enforced and printed. The win and loss summaries cross-check between browser and Vitest.
  3. `p99StepMs` is enforced at ≤ 6 ms, and the events are pooled (code-reviewer confirms that no consumer retains an event).
  4. Pool-full drops are tested and hashed (`peel.test.ts:271-295`).
  5. No `.skip`, and `scripts.test.ts` runs the real tower system.
- The CEO glue fixes:
  - **F-031** (`render/blots.ts:347-348`): the boss sorts last, which is the correct z-order. The over-inkwell pass (`:515,520`) still filters the boss, so there is no interaction with F-014.
  - **F-032** (`render/towers/index.ts:341`, `coaster:false`): `game.ts:719` calls `drawMorphBase` before the towers pass, for `MOTION.foldMs` = `MORPH_MS`. That is correct while playing. When the game is paused, the two clocks diverge (filed as F-034).
  - **F-033** (`ui/hud.ts:318-325`): the fall is now 60 px and `clamp01(1-1.5·td)` reaches 0 at td 0.67. `clamp01` is imported, and typecheck passes.
- README:
  - `npm run dev` serves http://localhost:5317/ with HTTP 200;
  - `npm run verify -- --strict` works as documented;
  - the subset syntax `npm run verify -- playthrough determinism` works.
- `bureau finding list M-0002 --open` showed none before my two S3s.

## Conditions
None blocking. Recommended before close: fix F-034 (morph timing should use `worldNow`) and F-035 (assert the frog [1,3] 3-landing case and pin the win-script golden hash).
