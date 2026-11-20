# Plan — M-0002 Frog river chase (*Lilyfield*)

Tier 2: architecture lives here (no architecture.md). **Contracts are code:** `projects/frog-chase/src/contracts.ts` (all shared types and module interfaces, `window.__lily`), `src/tuning.ts` (TUNING + tick clock), `src/loop.ts` (fixed step, implemented), `src/sim/rng.ts` (PRNG, implemented), and a running stub for every other module. Spec § numbers refer to `design/experience.md`.

## Architecture

### Decisions
| Decision | Chosen | Rejected and why |
|---|---|---|
| Renderer | **Canvas 2D**, one full-screen canvas, DPR capped at 2 | PixiJS/WebGL: ~100 KB more for flat fills and hard shadows Canvas 2D does cheaply; software-rendered headless. |
| HUD, cards, pause | **DOM overlay** (`#ui`) | Canvas text: no free buttons, focus rings or tabular numerals (§5.3, §7.6). |
| Tick (§14.1) | **120 Hz**; `ticks(ms)` rounds half-up; `g -= 1/120` per tick | 60 Hz quantises the 40 ms retarget too coarsely. Landing is tick 31 (258 ms); gain maths holds since `g` is seconds. |
| Loop | Float-ms accumulator, ε 1e-6, catch-up cap 30 ticks, alpha | Integer µs lost a tick per 10 s at 30 Hz (`tests/unit/core/loop.test.ts`). |
| Sim shape | `step(state, input)` mutates in place, reading only `(state, input)`: no Date, Math.random, DOM, globals | Immutable copies: allocation at 120 Hz for no gain. |
| Juice | **Render-only** (hit-stop, shake, particles, squash), derived from `SimEvent`s and tick stamps | In sim: hit-stop becomes a time cheat (§6). |
| Frog pose | Render computes arc, height, squash from hop/land ticks + alpha | Sim-owned: cosmetic state in the sim. |
| Gator spring and body | **In sim**, with `headPrev/bodyPrev` | Render-side: differs by frame rate. |
| Banks | A `bank` pseudo-pad at layers 0 and 37, answering every key | Special cases everywhere. |
| Seeds (§14.2) | New river per run: `hashSeed(runCounter, sessionSalt)`; `?seed=N` pins **every** run | Daily river: rewards memory (§3). |
| Grayscale (§14.3) | **Automated**: `getImageData` at `__lily.pads()` circles → luminance features (shadow band, crescent, rim) separate the kinds; screenshots kept for the critic | Screenshot-only: not gateable. |
| Hooks (§14.4) | `window.__lily` (`LilyHook`), always on, incl. manual clock `frame(dt,n)` | Test build: two artefacts. |
| Halftone (§14.5) | Pre-rendered 512² halftone and 256² grain tiles as scrolling patterns; **quality tier** drops grain and halves halftone if p95 frame > 12 ms | Per-frame dots: thousands of arcs. |
| Audio | Raw Web Audio, master limiter, look-ahead music scheduler | Tone.js: size. |
| E2E | Node scripts on the **global Playwright** (`tests/e2e/harness.mjs`) | `@playwright/test`: second install. |

### Stack (verified today)
| Dependency | Version | Verified |
|---|---|---|
| node | v22.23.5 | `node -v` |
| vite | 8.3.8 | `npm view vite@8.3.8 version` → 8.3.8 |
| typescript | 7.0.2 | `npx tsc --version` → Version 7.0.2 (fallback 6.0.2 exists) |
| vitest | 5.1.1 | `npx vitest --version` → vitest/5.1.1; peer vite ^8 OK |
| @types/node | 22.20.5 | `npm view` |
| playwright | 1.63.0 global | `require('playwright')` from the project → `chromium.launch` is a function |

No runtime dependencies. **Adding any dependency is a CEO decision.**

Run: `npm install && npm run dev` · Verify: **`npm install && npm run verify`** (in `projects/frog-chase`).

### Module map and data flow
| Path | Responsibility | WO |
|---|---|---|
| `src/contracts.ts` | Frozen types/interfaces | CEO-gated |
| `src/tuning.ts`, `src/loop.ts`, `src/sim/{rng,generator,sim,bots}.ts` (+ new files under `src/sim/`) | River generation, frog, gator, flank, results, event log, bots | WO-002 |
| `src/render/**`, `src/ui/**` | Canvas world, camera, juice, life; DOM HUD, title, cards, pause, tell diagram | WO-003 |
| `src/main.ts`, `src/app/**`, `src/input/**`, `src/audio/**`, `src/save/**`, `index.html` | Phases, driver, restart, pause, settings, `__lily`; keys/touch/gamepad; all sound; persistence | WO-004 |
| `package.json`, lockfile, `tsconfig.json`, `vite.config.ts`, `scripts/verify.mjs`, `tests/e2e/harness.mjs` | Toolchain and verify | Frozen (CEO) |

Per frame (`app.ts`): `input.poll()` → `loop.advance(dt)` → per tick `step(sim, {press: bot ? bot(sim) : pending})` → `fresh = sim.log.slice(cursor)` → `renderer.frame`, `ui.update`, `audio.frame`. A press waits in `pending` until a tick runs (none lost at 144 Hz). Restart builds a new `SimState`. Pause sets `loop.running = false`; render continues.

### Performance budgets
| Budget | Target | Measured by |
|---|---|---|
| Sim step | p95 ≤ 0.25 ms; a full 36-layer bot run (≈ 7 200 ticks) ≤ 150 ms in Node | `__lily.timings().lastSimStepMs`; WO-002 unit test |
| Render + UI frame CPU | p95 ≤ 8 ms at 1440×900 and 375×812, DPR 1, headless Chromium (CPU raster: a pessimistic proxy, never reported as fps) | `timings().lastFrameMs` over 600 manual-clock frames, WO-003 perf e2e |
| First playable | hook live + first frame ≤ 1.5 s after `goto` (local preview) | boot e2e |
| Restart | input → hop-ready ≤ 400 ms; fail tick → hop-ready < 1 s (wall clock) | `timings().restartToReadyMs/resultToReadyMs`, WO-004 e2e |
| Bundle | JS ≤ 120 KB gzip | verify step (now 3.8 KB) |
| Memory | JS heap growth ≤ 3 MB over 3 simulated minutes of bot runs; no per-frame allocation in particle/draw loops (pools) | `performance.memory` in WO-003 perf e2e |

### Verification
`npm run verify` (`scripts/verify.mjs`): typecheck → vitest (`tests/unit/**/*.test.ts`) → build → bundle budget → preview on 4317 → every `tests/e2e/*.e2e.mjs` (globbed). Harness: `withPage` (fails on any console error), `check`, `shot` (JPEG q80, DPR 1 → `artifacts/shots/`).

### Risks
1. **Fairness.** WO-002 unit-tests bot win rates and 20–60 s crossings at human-paced delays (700–900 ms).
2. **Parallel slices vs a stub sim.** WO-002 lands milestone M1 (generator + hops) first; the others build on the stub's frozen shape.
3. **Canvas 2D on low-end mobile.** Pre-rendered tiles plus the quality tier.
4. **Headless audio is unheard.** Exhaustive `Record<SimEventType, Cue>` tables (typecheck fails on a missing cue) plus a fake-AudioContext scheduler test.
5. **TypeScript 7 is new.** Fallback 6.0.2 (CEO approves the lockfile change).

No spike needed.

## Slices
| Wave | Work orders | Notes |
|---|---|---|
| 0 | WO-001 | Done in this run: scaffold, contracts, stubs, verify green |
| 1 | WO-002, WO-003, WO-004 | Disjoint ownership; 3 engineers in parallel |
| 2 | — | Polish lever: findings go back to the owning slice (resume its engineer) |

**Critical path:** WO-001 → WO-002 (real hops, generator, gator) → WO-003 frame-table screenshots and grayscale test (need real seed-7 states) → polish pass.

## Coverage
| Requirement | WO |
|---|---|
| SC1 typecheck, unit, headless boot | WO-001 (wired), each WO adds |
| SC1 bot crossing, bot caught, 30 vs 144 Hz | WO-002 |
| SC1 screenshot capture | WO-003 |
| SC2 restart < 1 s measured | WO-004 |
| SC3 juice audit (visual) | WO-003 |
| SC3 juice audit (audio) | WO-004 |
| SC4 375×812 touch, 1440×900 keyboard, no overflow | WO-004 (input/layout), WO-003 (visual fit) |
| Exceptional 1 hop within 3 s (§7.1 invite ring) | WO-003 |
| Exceptional 2 hop feel (§6) | WO-003; buffer WO-002 |
| Exceptional 3 gator felt (§4.3 τ signals) | WO-003 visual, WO-004 heartbeat/tempo, WO-002 τ |
| Exceptional 4 short run, instant retry | WO-002 (run length), WO-004 (retry) |
| Exceptional 5 timer, best, new best | WO-003 (display), WO-004 (persistence) |
| Exceptional 6 river alive (§5.4) | WO-003 |
| Exceptional 7 original, cohesive | WO-003, WO-004 |
| Exceptional 8 frame-rate independence | WO-002 |
| Fold-ins 1–3 (trick pads, choices, fast) | WO-002 (rules), WO-003 (tells) |
| §13 screenshots 1–12 | WO-003 |
| Polish 1, 2 (same-frame squash, buffered press) | WO-002 (tick), WO-003 (frame) |
| Polish 3 grayscale | WO-003 |
| Polish 4–10 | WO-003 |
| Polish 11 hop pitch by slot | WO-004 |
| Polish 12, 13 blink, head leads body | WO-003 (blink), WO-002 (body chain) |
| Polish 14 vignette on heartbeat | WO-002 `heartbeatPhase(sim)`; WO-003 vignette and WO-004 thump both read it |
| Polish 15 one-frame tooth flash | WO-003 |
| Polish 16 eaten hint names cause | WO-002 (`RunResult.cause`), WO-003 (text) |
| Polish 17 sunk diagram shows culprit | WO-003 |
| Polish 18 tabular timer | WO-003 |
| Polish 19 timer starts on takeoff | WO-002 |
| Polish 20 "First time" not NEW BEST | WO-004 (`view.newBest/firstRun`), WO-003 (text) |
| Polish 21 route trace through every pad | WO-002 (`trail`), WO-003 (draw) |
| Polish 22 button depress, focus-visible | WO-003 |
| Polish 23 nothing static, banks filled | WO-003 |
| Polish 24 resize keeps 64% | WO-003 |
| §7.6 pause triggers, duck | WO-004 |
| §7.7 lockout 250 ms, wipe, persistence | WO-004 (logic), WO-003 (wipe visual) |
| §10 reduced motion, mute, 44 px targets | WO-004 (setting), WO-003 (honour it) |

## Work orders

### WO-001 — Scaffold and contracts
- **Role / discipline:** architect / game architecture
- **Owns:** `projects/frog-chase/**` (wave 0 only), this plan
- **Build:** toolchain, `src/contracts.ts`, tuning, loop, PRNG, a working app skeleton and stubs, e2e harness, verify.
- **Done when:**
  - [x] `npm install && npm run verify` exits 0 on a clean `node_modules` (verify summary: typecheck, unit 9/9, build, bundle 3.8 KB, boot e2e all PASS).
  - [x] Boot e2e at 375×812 and 1440×900: `__lily` v1, `?seed=7` honoured, 120 ticks per simulated second, zero console errors.
  - [x] Loop yields exactly 1 200 ticks per 10 s at 30/60/144 Hz (`tests/unit/core/loop.test.ts`).

### WO-002 — River, frog and gator (the sim)
- **Role / discipline:** engineer / gameplay systems
- **Depends on:** WO-001
- **Owns (exclusive write):** `src/tuning.ts`, `src/loop.ts`, `src/sim/**`, `tests/unit/core/**`, `tests/unit/sim/**`, `tests/e2e/sim-*.e2e.mjs`
- **Objective:** the complete, deterministic game rules behind the frozen `SimState`; all bots.
- **Milestone M1 first:** generator + hopping + choices + landing events, so the other slices see real pads.
- **Acceptance criteria:**
  - [ ] Generator unit tests assert G1–G7 over 10 000 seeds (§4.1 G8), including G4 safety, G5 rotation, G6 scripted layers 6/10/36.
  - [ ] Frog timing unit tests (§4.4): land at tick 31; a press 100 ms before landing fires on the landing tick (polish 2); retarget within 5 ticks; airborne presses before the buffer window dropped; `repeat`-style duplicate presses harmless.
  - [ ] Gator unit tests (§4.3): frozen until layer 3; steady-state g ≈ 3.5 / 2.0 / 0.9 at 0.75 / 1.0 / 1.2 s hop periods (±0.15); eaten at ≈1.35 s; near-miss when g hits 0 airborne; flank rules F1/F2 and once per 4 layers; head leads body by ≥ 2 segments (polish 13).
  - [ ] Soggy escape within 26 ticks, curl always fails; `RunResult.cause` correct for still/flank/soggy/curl/win.
  - [ ] Bots: `runner` wins ≥ 99% of 500 seeds in 20–60 s; `idler` is eaten with cause `still`; `forward` sinks at layer 6 on seed 7; `idleAtTau` and `nearMiss` reach their states.
  - [ ] Determinism (§4.7): same seed + bot at 30 vs 144 Hz frames give an identical log, in Node over 200 seeds and in-browser via `__lily.frame` (`tests/e2e/sim-determinism.e2e.mjs`); browser bot win and bot eaten e2e.
  - [ ] Exports `heartbeatPhase(sim)` (0..1) for audio and vignette to share (polish 14).
- **Verification:** `npm run verify`; budget: sim step p95 ≤ 0.25 ms.
- **Quality notes:** §4.1–4.5, §4.7, fold-ins 1–3; polish 2, 13, 19, 21 (trail).

### WO-003 — The look and the juice (render + UI)
- **Role / discipline:** engineer / rendering and game feel
- **Depends on:** WO-001 (and WO-002 M1 for real states)
- **Owns (exclusive write):** `src/render/**`, `src/ui/**`, `tests/unit/render/**`, `tests/unit/ui/**`, `tests/e2e/look-*.e2e.mjs`
- **Objective:** every frame in §7 at the §5 look and §6 feel, from SimState and events alone.
- **Acceptance criteria:**
  - [ ] Renderer has an exhaustive `Record<SimEventType, VisualCue>` (typecheck enforces; juice audit, SC3).
  - [ ] Camera §4.6 (spring ω 10, frog at 64% ± 1% after settle, including after resize: polish 24); pads never leave the column at 375 and 1920 wide.
  - [ ] `look-shots.e2e.mjs` captures all 12 §13 moments at 375×812 and 1440×900 (title also 1920×1080) from seed 7 using bots, manual clock and `setTuning`; each asserts its state (e.g. τ ≥ 0.6, a flanked pad exists, result card visible).
  - [ ] `look-grayscale.e2e.mjs` separates lily/soggy/curl by luminance features at layers 6 and 10, 375 px (polish 3).
  - [ ] `look-perf.e2e.mjs`: frame CPU p95 ≤ 8 ms at both viewports; heap growth ≤ 3 MB; quality tier engages when forced.
  - [ ] First press shows squash on the same rendered frame (polish 1): `press` then one `frame(16.7)` → frog pose scale differs from idle.
  - [ ] Reduced motion: shake 0, zoom off, tells unchanged (§10).
- **Verification:** `npm run verify`; the §13 JPEGs in `artifacts/shots/`.
- **Quality notes:** §5, §6, §7.1–7.6 frames, §9 copy, §10 visuals; polish 1, 3–10, 12, 15–18, 20–24.

### WO-004 — Shell, input and sound
- **Role / discipline:** engineer / interaction and audio
- **Depends on:** WO-001
- **Owns (exclusive write):** `index.html`, `src/main.ts`, `src/app/**`, `src/input/**`, `src/audio/**`, `src/save/**`, `tests/unit/{app,input,audio,save}/**`, `tests/e2e/boot.e2e.mjs`, `tests/e2e/shell-*.e2e.mjs`
- **Objective:** title-to-retry flow, every control path, all synthesized sound, persistence and the test hook.
- **Acceptance criteria:**
  - [ ] Input (§4.5): keys incl. WASD/Space, `repeat` ignored; tap thirds and tap-on-pad (via `pickPad`, mapped with `slotForPad`); gamepad edge-triggered; unit-tested with synthetic events.
  - [ ] Phases (§7.1, §7.6, §7.7): first hop leaves title; pause on Esc/P/button/`visibilitychange`/blur; 250 ms lockout; restart via any hop key/Enter/tap.
  - [ ] `shell-restart.e2e.mjs` (wall clock): restart input → hop-ready ≤ 400 ms; fail tick → ready < 1 s (SC2).
  - [ ] `shell-touch.e2e.mjs`: 375×812 touch crossing of layers 1–5 by taps; 1440×900 keyboard; no overflow (SC4).
  - [ ] Audio: exhaustive `Record<SimEventType, Cue>`; heartbeat from `heartbeatPhase`; music tempo 100 + 28τ at bar starts; hop pitch L/F/R (polish 11); limiter; mute persists; no AudioContext before first gesture; zero errors when Web Audio is missing.
  - [ ] Best time and settings persist across reloads; `newBest`/`firstRun` correct (polish 20).
  - [ ] `__lily.timings()` fills restart metrics.
- **Verification:** `npm run verify`.
- **Quality notes:** §4.5, §7.6, §7.7, §8, §10 (settings, mute, reduced-motion default); polish 11, 14 (audio half), 20.

## Rules for the build
- Never edit another slice's paths. Contract changes (type, hook method, dependency) go to the CEO.
- Replace stubs, don't wrap them; delete each `STUB (WO-001)` note.
- Keep `npm run verify` green at each hand-off.

## Board conditions
