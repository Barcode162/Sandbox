# Report — WO-002 — remediation round 1 (core)

STATUS: DONE
Discipline: core / algorithms · Mission: M-0002 · Round: fix-r1

## Built
I fixed six findings at the root, each with tests. Unit tests: **85/85**, 5 of 5 full-suite runs green.

## Findings
| ID | Root cause → fix | Proof |
|---|---|---|
| F-002 | `accent` was only type-checked. It must now match `#rgb`/`#rrggbb`, both in `validateDoc` and in `add/updatePerspective`. Error copy: *"… has the accent colour "red;background:url(x)". Use a hex colour like "#FF9F5A" or "#f95", or leave it out."* | U-persistence-5 (2 cases), U-persistence-11, U-graph-11 |
| F-007 | Idempotence matched any shortcut, including one hidden in some lens. New additive export `learnShortcutDetailed()` → `{relation, outcome: 'added'\|'widened'\|'existing', learned, previous?}`. A lens-only shortcut is widened to every lens, and `previous` lets undo restore it. `learnShortcut()` delegates to it, so it never returns a hidden line. | U-routing-10, U-routing-11 |
| F-008 | `Number("9…9")` gave Infinity. The tokenizer now rejects non-finite literals: *"That number is too large to keep at column N"*. | U-expr-2 |
| F-009 | `Math.max(1, NaN)` was NaN, and the guard never fired. Now: non-finite or non-number → 500; finite values are floored and clamped to [1, 100 000]. | U-flow-8 (NaN, ±∞, "7", 0, 3.9, 1e12) |
| F-010 | Canonical copies assigned `out[k] = v`, which sets the prototype for `__proto__`. They now use `Object.fromEntries` (own data properties). The layout reads authored positions via `hasOwn`, and `updatePerspective` rejects unknown keys. | U-persistence-12 (node `__proto__`, lens `constructor`: import, layout, pathway, round-trip) |
| F-016 | The §6 ring put A and Z 50° apart. The Long Road is now a 1½-turn spiral ring with φ = 180° − 540°·i/25. A sits far left, Z far right; laps never touch; `memory.json` regenerated. | U-layout-11 (all lenses: A–Z 180° apart and within 0.1R of the centre; A–F within 0.65R; non-neighbours > 15 u). Routes are unchanged: 25→3, Child 20 (U-routing-1,2). |

## Layout budget
After the session resumed, this host benchmarks 1.8× slower: the same loop took 1123 ms against 634 ms. U-layout-4 began to flake at 44–64 ms. A calibration-scaled budget was rejected: its reference number would have been invented. Instead, repulsion forces are now reused every 4th iteration once the step cap has cooled below half its start (every 2nd before that). That gives 34–45 ms here; the quality and determinism tests stay green. `memory.json` was regenerated (drift guard U-persistence-2 passes).

## Verify
`npm run verify` gives preflight, typecheck, unit, build and size **PASS**. e2e **FAIL** belongs to WO-003 (per the CEO).

## Gaps and requests
- **WO-003 must switch "Learn" to `learnShortcutDetailed`.** Then "Learned" shows only when `learned`, and Undo removes on `added` or restores `previous.perspectives` on `widened` (the UI side of F-007).
- **§6 ring text is now stale.** The designer or CEO may want to update its ring formula to match `seed-source.ts`.
- **U-layout-4 headroom is thin on a slow host** (best of 7 ≈ 34–45 ms against 50 ms).
- Files outside OWNS: `src/core/index.ts` (additive: `learnShortcutDetailed`, `LearnResult`).
