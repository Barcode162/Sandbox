# Lilyfield (frog-chase)

Hop pad to pad across the river. Pick the honest pad, not the fake. Do not stop: the gator is behind you.

## Run
```
npm install
npm run dev        # play at http://localhost:5173 (add ?seed=7 for a fixed river)
npm run build      # static output in dist/
npm run verify     # typecheck, unit, build, bundle budget, headless e2e (bots, determinism, screenshots)
```
Requires Node ≥ 22.12. E2E uses the machine's globally installed Playwright + Chromium (`require('playwright')`).

## Controls
← / ↑ / → (or A / W·Space / D) hop left / forward / right · tap a pad or a screen third · Esc/P pause · M mute.

## Layout
| Path | What | Owner |
|---|---|---|
| `src/contracts.ts` | Frozen types between every module | CEO-gated |
| `src/tuning.ts`, `src/loop.ts`, `src/sim/**` | Deterministic sim, generator, gator, bots | WO-002 |
| `src/render/**`, `src/ui/**` | Canvas look and juice, DOM HUD/cards | WO-003 |
| `src/app/**`, `src/input/**`, `src/audio/**`, `src/save/**`, `src/main.ts` | Shell, input, sound, persistence, `window.__lily` | WO-004 |

Screenshots from `npm run verify` land in `artifacts/shots/` (git-ignored).

Design: `bureau/missions/M-0002-frog-chase/design/experience.md`; plan: `.../plan.md`.
