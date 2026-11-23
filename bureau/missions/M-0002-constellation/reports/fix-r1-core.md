# Report — WO-002 — remediation round 1 (core)

STATUS: DONE
Discipline: core / algorithms · Mission: M-0002 · Round: fix-r1

## Built
Six findings fixed at the root, each tested.

## Findings
| ID | Root cause → fix | Proof |
|---|---|---|
| F-002 | `accent` was only type-checked. It must now match `#rgb`/`#rrggbb`, both in `validateDoc` and in `add/updatePerspective`. The error names the bad value and asks for a hex colour. | U-persistence-5 (2 cases), U-persistence-11, U-graph-11 |
| F-007 | Idempotence matched any shortcut, including one hidden in some lens. New additive export `learnShortcutDetailed()` → `{relation, outcome: 'added'\|'widened'\|'existing', learned, previous?}`. A lens-only shortcut is widened to every lens, and `previous` lets undo restore it. `learnShortcut()` delegates to it, so it never returns a hidden line. | U-routing-10, U-routing-11 |
| F-008 | `Number("9…9")` gave Infinity. The tokenizer now rejects non-finite literals: *"That number is too large to keep at column N"*. | U-expr-2 |
| F-009 | `Math.max(1, NaN)` was NaN, and the guard never fired. Now: non-finite or non-number → 500; finite values are floored and clamped to [1, 100 000]. | U-flow-8 (NaN, ±∞, "7", 0, 3.9, 1e12) |
| F-010 | Canonical copies assigned `out[k] = v`, which sets the prototype for `__proto__`. They now use `Object.fromEntries` (own data properties). The layout reads authored positions via `hasOwn`, and `updatePerspective` rejects unknown keys. | U-persistence-12 (`__proto__`/`constructor` ids round-trip) |
| F-016 | The §6 ring put A and Z 50° apart. The Long Road is now a 1½-turn spiral ring with φ = 180° − 540°·i/25. A sits far left, Z far right; laps never touch; `memory.json` regenerated. | U-layout-11 (all lenses: A–Z 180° apart and within 0.1R of the centre; A–F within 0.65R; non-neighbours > 15 u). |

## Layout budget
The host slowed 1.8× between sessions, so late-run repulsion is reused every 4th iteration: 34–45 ms against the 50 ms budget, with quality and determinism tests green.

## Verify
`npm run verify` gives preflight, typecheck, unit, build and size **PASS**. e2e **FAIL** belongs to WO-003 (per the CEO).

## Gaps and requests
- **WO-003 must switch "Learn" to `learnShortcutDetailed`.** Then "Learned" shows only when `learned`, and Undo removes on `added` or restores `previous.perspectives` on `widened` (the UI side of F-007).
- **§6 ring text is stale** (ring formula, Cook ring y).
- **U-layout-4 headroom is thin on a slow or busy host.**
- Files outside OWNS: `src/core/index.ts` (additive: `learnShortcutDetailed`, `LearnResult`).

## Round 2 — F-030 (core half: seed layout)
- **Heat knot.** `spreadForView` in `seed-source.ts` flattens each cluster toward the camera and pushes neighbours apart to 15 u on screen, staying within 1.3r.
- **Ring vs Simmer.** The Cook ring centre moved from y −120 to −140.
- **Proof.** U-layout-12 checks the default §8 view. Heat neighbours sit ≥ 14.3 u apart (floor ≈ 12.1 u = 1.6 × node radius + label). Ring stops and segments sit ≥ 21 / 28 / 43 u from both flowchart boxes (floor 12).
- **Unchanged.** Routes and A/Z opposite. 86/86 unit tests pass; verify passes through `size`.
