# Inkfold

A papercraft tower-defence vertical slice: folded paper creatures hold a garden against layered ink blots that peel colour by colour. TypeScript + Vite + Canvas 2D; all art procedural, all audio synthesized. One map, 4 towers × 2 paths × 3 tiers, 20 rounds, a boss.

Mission record: `bureau/missions/M-0002-tower-defense-vertical-slice/` (brief, experience spec, architecture, plan).

## Run
```
npm install
npm run dev        # http://localhost:5317
npm run build      # static output in dist/
```

## Verify
```
npm run verify             # typecheck, unit, build, size, boot, playthrough, determinism, screens, perf
npm run verify -- --strict # PENDING slots count as failures (the ship gate)
```
Needs Chromium for the e2e steps: `PLAYWRIGHT_BROWSERS_PATH` (default here `/opt/pw-browsers`) or `CHROMIUM_PATH=/path/to/chrome`. Evidence (screenshots, perf JSON) is written to `evidence-local/`.

## Controls
1–4 pick a tower · click place/select · RMB/Esc cancel · Space start round / 1×↔2× · Z/X upgrade path A/B · T targeting · Delete ×2 sell · A auto-start · M mute · Esc/P pause · R restart (in pause).

## Layout
| Path | What |
|---|---|
| `src/contracts/` | frozen types: sim API, events, render layers, audio, test hook |
| `src/data/` | frozen spec data: map, blots, towers × tiers, waves, economy, palette, feel, scripts |
| `src/sim/` | pure fixed-60 Hz deterministic simulation (no DOM); `towers/` = tower systems |
| `src/render/` | canvas layers: blots + fx, towers |
| `src/ui/`, `src/app/` | HUD, sidebar, menus; app shell, loop, input, test hook |
| `src/audio/` | Web Audio engine |
| `tests/unit/`, `scripts/e2e/` | Vitest units; Playwright-core e2e scripts |
