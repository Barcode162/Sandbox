# M-0002 handoff — resume in a new session

Branch: `claude/wizardly-allen-8sp5g1` (repo barcode162/sandbox). Everything below is committed and pushed.

## Resume command
In the new chat: `/bureau --resume M-0002`, then point it to this file.

## Where it stands (2026-11-21)
- **Phase:** build (wave 1), Gate 1 passed (director-engineering CONDITIONAL 8.0; conditions folded into `plan.md § Board conditions`).
- **Headcount:** 7 of 14 used (designer, architect, director-engineering, 4 engineers). The agents can't be resumed across accounts: any further work is a fresh convening (or the CEO doing glue).
- **`npm run verify`** (in `projects/tower-defense/`): 9/10 PASS (typecheck, 163 unit tests with 0 skipped, build, size, boot, audio, playthrough, determinism, screens 38/38). **perf FAILs.**

## Work-order status
| WO | Status | Open |
|---|---|---|
| WO-001 scaffold/contracts | DONE | — |
| WO-002 sim, blots, peel | PARTIAL; the balance pass was **stopped mid-run** | Confirm win/lose scripts and the stress bench (≥1,000 projectiles, p99 ≤ 6 ms). **Write the balance change table (old → new, reason) in `reports/WO-002.md`**; any spec values changed in `src/data` must be listed so experience.md §8 can be amended. CEO grant: wave/blot/economy changes plus up to ±15% on tower stats. |
| WO-003 towers/upgrades | DONE (doubled overlays fixed) | — |
| WO-004 garden/HUD/screens | PARTIAL; fix pass **stopped mid-run** | (1) R18 render perf: p95 ≈139 ms vs 8 ms budget. Use cached offscreen sprites, batch fills, no blur in hot loops; if 8 ms is unreachable in software rendering, report the measured number for a CEO ruling. (2) CEO decision: narrow the §10.1 title wash so the blots are visible, then re-capture the title-0/800/idle frames. (3) Re-run screens after balance (R18/R20/victory shots used to show game-over). |
| WO-005 audio/settings/harness | DONE | — |

## Next steps (in order)
1. Finish WO-002 balance and the change table, then WO-004 perf and the title wash, until verify is all green (`npm run verify -- --strict` ≤ 8 min).
2. `bureau phase M-0002 review`: one wave of code-reviewer, qa-tester and polish-critic (fresh agents).
3. Remediation → Gate 2 (director-vision + director-engineering ≥ 8.0, zero open S0–S2).
4. Delivery (README accurate, commit and push, report), then `/bureau-retro M-0002`.

## Key files
`brief.md` · `design/experience.md` (the *Inkfold* spec) · `design/architecture.md` · `plan.md` · `reports/WO-00*.md` · `log.md` · product at `projects/tower-defense/`.
