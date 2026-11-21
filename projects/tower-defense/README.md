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
npm run verify               # typecheck, unit, build, size, boot, audio, playthrough, determinism, screens, perf
npm run verify -- --strict   # the ship gate: PENDING counts as FAIL and the run must finish in ≤ 8 min
npm run verify -- boot perf  # a subset of steps, in order (after a build)
```
| Step | Proves | Evidence |
|---|---|---|
| boot | built game loads, hook ready ≤ 1.5 s, canvas painted, zero console errors | `boot/boot-1280x720.jpg` |
| audio | the real engine on an `OfflineAudioContext`: 300 pops in 1 s peak < 0 dBFS, before and after the safety limiter | `audio/offline.json` |
| playthrough | win script → victory with ≥ 40 seeds, loss script → defeat by R12, restart < 2 s to R1/650/100; browser summaries identical to a headless Vitest run (`npm run test:parity`) | `playthrough/*.json`, `after-restart-*.jpg` |
| determinism | win script at 30 Hz and 144 Hz frames: identical outcome, tick, lives, money, pops, state hash | `determinism/determinism.json` |
| screens | every §18 `StageId` at 1280×720 (+1920×1080, 900×600 for title-idle, r18-8s, pause), JPEG q80, zero errors; `towers-sheet` and `blots-grid` pixel-diffed (neighbours differ ≥ 2 %) | `screens/*.jpg`, `screens/screens.json` |
| perf | stress sim p95 ≤ 4 ms and p99 ≤ 6 ms at ≥ 500 blots / 30 towers / 1,000 projectiles; heap growth ≤ 5 MB over 3,600 steps after GC; R18 frame p95 ≤ 8 ms | `perf/perf.json` |

Needs Chromium for the e2e steps: `PLAYWRIGHT_BROWSERS_PATH` (default here `/opt/pw-browsers`) or `CHROMIUM_PATH=/path/to/chrome`. Evidence paths above are under `evidence-local/`. The e2e scripts touch the game only through the `window.__inkfold` test hook (`?test=1`).

## Audio
All sound is synthesized with Web Audio (`src/audio/`): music and sfx buses into a −18 dB / 4:1 compressor, a mute gain and a safety limiter; ducking leak/boss > UI > fire > pops; at most 6 pop voices per 50 ms with the overflow fed to a crackle bed; music in 8 states on bar lines with 800 ms crossfades; pause lowpasses the music. The context is created on the first `unlock()` (call it from a user gesture). Without Web Audio the engine is a silent no-op.

## Controls
1–4 pick a tower · click place/select · RMB/Esc cancel · Space start round / 1×↔2× · Z/X upgrade path A/B · T targeting · Delete ×2 sell · A auto-start · M mute · Esc/P pause · R R restart (in pause: press R twice within 2 s).

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
