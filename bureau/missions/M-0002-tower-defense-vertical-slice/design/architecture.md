# Architecture — M-0002 Tower defense vertical slice (*Inkfold*)

Product: `projects/tower-defense/`. The contracts are code. This document explains them and does not restate signatures. The sources of truth are:
- `src/contracts/types.ts`: sim API, state, commands, events, render layers, Fx, audio, settings, test hook
- `src/contracts/sim-context.ts`: the seam between the sim core and the tower systems
- `src/data/*.ts`: every number from spec §5–§8 and §11, transcribed exactly
- the stub modules, which export every frozen signature

Spec sections are cited as §n of `design/experience.md`.

## Decisions
| Decision | Chosen | Rejected alternatives & why |
|---|---|---|
| Renderer | Canvas 2D, procedural drawing, one canvas at 1280×720 logical, CSS letterbox | PixiJS/WebGL: a runtime dep against [A1], and headless WebGL is SwiftShader, so screenshots and perf would be unrepresentative. 300 flat shapes per frame is well within Canvas 2D. |
| Sim model | Pure TS, fixed 60 Hz `step()`, tick-keyed command queue, mulberry32 RNG (`src/sim/rng.ts`). Hit-stop lives in the sim (§11). | Variable-dt sim: breaks criterion 6. Hit-stop in the renderer: would desync bots from what players see. |
| Determinism across render rates | The loop (`src/app/loop.ts`) only decides *how many* steps run per frame. The sim never sees dt. Scripts are keyed by round/tick, not by wall time. | Interpolated physics with dt: float drift between 30 and 144 Hz. |
| Spec data | Typed TS modules under `src/data/`, checked against the spec's own derived columns (RBE, cash chain, script spend) in `tests/unit/data/spec-data.test.ts` | JSON plus a loader: no types, and transcription errors would surface late. |
| Upgrades | One flat `TowerStats` record. Each of the 24 tiers is a `{set, add}` patch, applied A1..B3 by `resolveStats()` (`src/data/towers.ts`). Attack behaviour switches on `stats.attack`. | A class per tier: 24 code paths, and crosspath combinations would need ad-hoc merging. |
| Entity storage | Preallocated pools (`Pool<T>`: blots 2048, projectiles 2048). Dead blots get `alive=false` and are compacted at tick end, so indices stay stable for a whole tick. | Allocation per spawn: GC spikes at R18. An ECS library: a dependency for 3 entity types. |
| Peel | Pops happen in place. The popped blot object *becomes* child 0 (kind, hp, overflow) and keeps its index and position. Children 1..k are appended at s − 6k. | Remove and respawn: risks the gap frame forbidden by §16.4 and churns the pool. |
| Broadphase | Uniform 64-px grid rebuilt once per tick after movement (`src/sim/grid.ts`) | Quadtree: more code, and no gain at this density. O(n·m) brute force: fails [A3]. |
| Events | `sim.events` is refilled each step from a pool (`pooledEvents`, board condition 3; WO-002). The app fans it out to world layers and audio. All emitters, towers included, go through the pool. | Callbacks: couple modules by call order. A plain array of fresh objects: allocates every step (it was the original choice, replaced at Gate 1). |
| Render ↔ sim | Renderers read `SimState` read-only and interpolate with `ps`, `px/py` and `pangle` by `alpha`. Visual timers run on real time (§11 Speed). | Renderers keeping their own entity copies: duplicate state that drifts. |
| UI framework | None. The HUD and menus are canvas-drawn with hit rects from `src/data/layout.ts`. | DOM overlay: font/scale mismatch with the letterboxed canvas, and screenshots would vary by viewport. |
| e2e runner | Plain Node scripts on `playwright-core` (one launch per script, `scripts/e2e/lib.mjs`), serving `dist/` with `node:http` | `@playwright/test`: config, reporters and webServer process for 5 linear scripts. `vite preview`: an extra child process to manage. |
| TypeScript | 6.0.2 | 7.0.2 (the native port, latest): too new to bet the typecheck gate on. 6.0.2 proved itself in M-0001. |

**Spec interpretations (frozen here; the designer may object at Gate 1):**
- (a) A no-build circle must not overlap the footprint: distance ≥ r + fr.
- (b) Koi pulses are area-class, so a Pale blot in reach both triggers and takes the pulse.
- (c) Sell values round down.
- (d) R20's RBE column holds the 480 non-boss RBE.
- (e) Commands queued during hit-stop still apply. Only the world freezes.
- (f) The boss warning fires 2 s before the boss group's delay (`BOSS_WARNING_LEAD_S`).

## Stack
| Dependency | Exact version | Verified how | Licence | Why |
|---|---|---|---|---|
| typescript | 6.0.2 | `npm view typescript@6.0.2 version` → 6.0.2 | Apache-2.0 | typecheck |
| vite | 8.3.8 | `npm view vite version` → 8.3.8; engines ≥ 22.12, node here v22.23.5 | MIT | dev server, static build |
| vitest | 5.1.1 | `npm view vitest version` → 5.1.1; peer vite ^8 | MIT | units in Node |
| playwright-core | 1.63.0 | `npm view playwright-core@1.63.0 version`; matches the preinstalled `/opt/pw-browsers` (global playwright 1.63.0) | Apache-2.0 | e2e, screenshots, perf |
| @types/node | 22.20.5 | `npm view @types/node@22.20.5 version` | MIT | node:fs in tests/scripts |

All five are devDependencies, and there are **zero runtime dependencies**. The lockfile was created by `npm install` (0 vulnerabilities).
Run: `cd projects/tower-defense && npm install && npm run dev` · Verify: `npm run verify` (ship gate: `npm run verify -- --strict`).

## Module map
| Module / path | Responsibility | Owning WO |
|---|---|---|
| `src/contracts/**` | Frozen types and the sim/tower seam | WO-001 (frozen) |
| `src/data/{map,blots,towers,waves,economy,palette,feel,scripts}.ts` | Spec data (§4–§8, §11) and `resolveStats`/`tiersValid` | WO-001 (frozen) |
| `src/data/balance.ts` | The three §8 tuning knobs, the only mutable data | WO-002 |
| `src/data/layout.ts` | §9/§10 rects | WO-004 |
| `src/sim/{index,path,rng,grid,placement,economy,hash,bot,bench}.ts` | Tick loop, commands, spawning, movement, slows, leaks, peel (`hit`), money, rounds, boss, hit-stop, script driver, stress scenario | WO-002 |
| `src/sim/towers/**` | Auras, targeting, turning, firing, projectiles, stones and skips, pulses, jets, beams, `tierStatus` | WO-003 |
| `src/render/blots.ts`, `src/render/fx/**` | Blot shapes, pips, Pale, squash, hit flash; shared particle/ring system with the §10.5 caps | WO-002 |
| `src/render/towers/**` | `drawTowerSprite` for 4 kinds × 12 valid tier combos, projectiles, beams, pulse rings, decals, fire feel | WO-003 |
| `src/app/{game,loop,testhook}.ts`, `src/main.ts`, `src/ui/**`, `index.html` | Scene machine, input (§13), compositor and draw order, map and decor, HUD, Satchel/Fold card, ghost, banners, floating text, shake, menus and cards, cranes, test-hook stages | WO-004 |
| `src/audio/**`, `src/app/settings.ts` | Web Audio engine (§12), settings store | WO-005 |
| `scripts/**`, `package.json`, configs, `README.md` | Verify pipeline, e2e, screenshots, perf probe | WO-005 |
| `tests/unit/<slice>/**` | Each slice's own units (`data/` is WO-001's) | per slice |

## Contracts
Frozen at the end of WO-001. A change is a CEO decision.
- **Sim API** (`types.ts` `Sim`, `SimOptions`, `SimState`, `Command`, `SimEvent`):
  - `createSim(opts)` returns a sim. `enqueue(cmd)` applies on the next `step()`. `events` holds that step's events.
  - Tower ids are 1-based placement order, never reused. Scripts address towers as T1…T5 by these ids.
  - Commands that fail emit `rejected{reason}`.
- **Sim ↔ towers seam** (`sim-context.ts`): towers touch blots only through `queryBlots`, `hit`, `slow`, `freeze`, `stun`, `canSee`, `emit` and `nextSourceId`. The core calls `updateAuras → updateTowers → updateProjectiles` once per non-frozen tick. `hit()` owns all the peel rules (§6 1–5), money and pops. Callers pass damage *after* `multVs`, aura `+dmg` and the frozen-Crush bonus.
- **Render layers** (`WorldLayer`, `RenderFrame`, `DrawPass`, `Fx`):
  - WO-004's compositor draws path/decor, then calls each layer for its passes in the §10.5 order, then text and HUD.
  - Layers receive every `SimEvent` and spawn VFX through the shared `Fx`, which enforces the particle tiers. Rings are never culled.
  - `drawTowerSprite` and `drawBlotShape` are reused by the ghost, cards, portrait, title and settings preview.
- **Audio** (`AudioEngine`): consumes `SimEvent`s and `UiSound`s and plays `MusicState`. It must not throw without an AudioContext.
- **Settings** (`Settings`, `SettingsStore`): key `inkfold.settings.v1`, with try/catch persistence.
- **Test hook** (`InkfoldTestHook` on `window.__inkfold` with `?test=1`):
  - `playScript(name, frameHz)` runs the real app loop under a manual clock at the given render rate.
  - `stage(StageId)` composes each §18 capture.
  - `perfProbe(steps)` times `buildStressSim()`.
- **File formats:** the evidence goes to `evidence-local/{boot,screens,perf}/`: JPEG q80 at DSF 1, plus `perf.json` (`PerfReport`).

## State & data flow
```
input (§13) ─► Game ─► sim.enqueue(Command)
rAF/manual clock ─► loop.frame(dt, speed, paused) ─► n × [driver.beforeStep → sim.step()]
sim.step: commands → hit-stop gate → spawns (wave groups) → movement/slows/leaks → grid
          → updateAuras → updateTowers → updateProjectiles → compact → round clear / victory / defeat
after each step: for e of sim.events → blotLayer, towerLayer, fx, ui (banners, floats, shake), audio
render: compositor(alpha, nowMs) → path/decor → layers by pass → text → HUD/sidebar/cards
```
- **Scenes** (`SceneId`) live only in WO-004. Pause stops stepping, and blur auto-pauses. Restart builds a fresh `createSim` (cheap) and resets the layers.
- **The title** runs its own attract sim (`ATTRACT` in `map.ts`, `loopRound: true`).
- **Persistence** covers settings only.

## Performance budgets
| Budget | Target | How it is measured here |
|---|---|---|
| Sim step | p95 ≤ 4 ms with ≥ 500 blots, 30 towers, 1,000 projectiles | `perf.mjs` → `perfProbe(1200)` in headless Chromium → `evidence-local/perf/perf.json` |
| Heap | ≤ 5 MB growth over 3,600 steps (1 min of sim) after forced GC | Chromium `--js-flags=--expose-gc --enable-precise-memory-info`; `PerfReport.heap*` |
| Hot-loop allocation | 0 per tick in movement, grid, targeting, collision | pools plus `Int32Array` query buffers; code review plus the heap budget |
| Render CPU | per-frame game JS **plus that frame's raster** (1-px readback) p95 ≤ 8 ms at R18 t 8 s, 1280×720 | `perf.mjs` on `stage('r18-8s')`, 300 manual frames. A proxy only: Canvas 2D in headless is CPU-rasterised. Real-GPU fps is never claimed. |
| First playable | hook `ready()` ≤ 1.5 s after navigation from `dist/` | `boot.mjs` |
| Bundle | ≤ 120 KB gzip total JS | `scripts/check-size.mjs` (scaffold: 3.3 KB) |
| Restart | < 2,000 ms to a playable R1 | `playthrough.mjs` via `restart()` |
| Input | ghost drawn in the same frame as pointermove; click → command applied next tick (≤ 17 ms) | unit test on the game input queue (WO-004) |
| Audio | ≤ 6 pop voices / 50 ms, extras to the crackle bed; the master never clips at 300 pops | WO-005 unit on the voice limiter; offline-render peak check |

## Verification strategy
`npm run verify` (`scripts/verify.mjs`) runs these steps in order and prints a PASS/FAIL/PENDING table:
1. `typecheck`
2. `unit` (Vitest, Node)
3. `build`
4. `size`
5. `boot`: zero console or page errors, painted canvas, screenshot
6. `playthrough`: the win bot reaches victory with ≥ 40 seeds; the loss bot reaches defeat by R12; restart < 2 s
7. `determinism`: `playScript('win')` at 30 Hz and at 144 Hz produce identical lives, money, pops and `stateHash`
8. `screens`: every §18 `StageId` at 1280×720, plus 1920×1080 and 900×600 for title, R18 and pause
9. `perf`

The scaffold is green with steps 6–9 **PENDING**. `--strict` fails on PENDING, and WO-005 must empty the `PENDING` set. Unit suites are per slice. The purity test bans `Math.random`, clocks and the DOM in `src/sim` and `src/data`.

## Risks & spikes
| Risk | Likelihood / impact | Mitigation (spike WO, bake-off, descoping) |
|---|---|---|
| Win script misses its target (balance) | High / high | Run the bot headless in Vitest from day 1 (WO-002). Turn the §8 knobs in order in `balance.ts` only. Tower tables stay frozen. |
| Storm frame cost (300 lobed paths, rings, flecks) | Medium / high | Lobed paths are sampled at 24 points with cached unit circles. Lobe phase is shared per kind. Fleck tiers. The R18 render budget is in perf.mjs. Fallback: pre-rendered sprite atlas per kind × scale. |
| Cross-slice drift (sprite or event semantics) | Medium / medium | Frozen events and types. Slices integrate through the stubs. The CEO runs verify after each slice lands. |
| Determinism leak (dt or iteration order in the sim) | Low / high | Tick-keyed commands, the purity test, stable id tie-breaks, and the 30/144 test on the real loop. |
| Headless audio (no output device) | Medium / low | `AudioEngine` no-ops without a context. Synthesis is unit-tested against `OfflineAudioContext` where available. |
| Spec cap: experience.md is 6,233 words, over the 6,000 cap | Certain / gate | Designer trims it (see the plan REQUESTS). The data is already transcribed into code. |
