# Plan — M-0004 Skyrest: floating-isle action demo

Tier 2, so there is no `architecture.md`; this plan carries its essentials. The contracts are **code** in `projects/skyrest` and are frozen as of wave 0. Changing a frozen file is a CEO decision.

## Stack (verified with `npm view <pkg>@<ver> version`, 2026-11-25)
| Dep | Version | Why |
|---|---|---|
| three (+ `examples/jsm` post) | 0.187.0 | WebGL2 renderer, EffectComposer/UnrealBloomPass on High |
| vite | 8.3.8 | dev/build, `base: './'` for gh-pages `/Sandbox/skyrest/` |
| typescript | 6.0.2 | `erasableSyntaxOnly`, so node runs the sim tests natively |
| @playwright/test / playwright-core | 1.63.0 | e2e; Chromium preinstalled (never `playwright install`), SwiftShader flags |
| @types/three 0.187.0, @types/node 22.20.5 | — | types |

There are no other runtime dependencies. Audio is Web Audio synthesis, and all art is procedural. **Adding a dependency needs a CEO request.**

Run: `npm install && npm run dev` · Verify: **`cd projects/skyrest && npm run verify`** (preflight → typecheck → unit → build → size → e2e). Probe: `npm run probe` (after build).

## Key decisions
| Decision | Chosen | Rejected and why |
|---|---|---|
| Sim | Pure TS, fixed 60 Hz, `SimState` is plain JSON, seeded mulberry32 in `state.rng` | A physics engine is overkill for circles on a disc and breaks determinism and node tests |
| Render coupling | Views read `SimState` with `prev*` interpolation; sim pushes `state.events`, which the game drains to a synchronous bus | Views mutating sim state, or sim importing three |
| Camera yaw | Rig-owned and sampled into `Intent.camYaw`; the sim rotates the stick | Fixed yaw, because §4.3 needs lock-on bias and manual orbit |
| Hit-stop / slow-mo | `state.hitstop` freezes entities in-sim (deterministic, still buffers input); `state.timeScale` only paces the wall clock | Render-side freeze, which would make tests disagree with play |
| Look | One material factory `render/materials.ts` (SoftToon §4.2) + `glowSprite` halos on Low | Per-slice materials, which make the hero, golem and world shade differently |
| UI | DOM overlay (HUD, menus, damage numbers) | Canvas UI: worse text and a11y, more work |
| Per-slice private state | `ext: Record<string, number>` on each entity, with keys fixed at creation | Contract churn for every new timer |
| Test surface | `window.__skyrest` only, including `moment('F1'…'F13')` | Specs poking internals |

## Module map and contracts (all under `projects/skyrest/`)
Read `src/contracts.ts` first. Its header fixes coordinates (north = −z, facing 0 = north), half-heart HP, and ms→frames.

| Path | Responsibility | Owner |
|---|---|---|
| `src/contracts.ts` | All types: Intent, SimState/Hero/Golem/Minion/Hazard, SimEvent + EventBus, Settings, View/RenderContext/CameraRig/RendererHandle, Ui/GameControl, AudioEngine/SfxId, SkyrestHooks/Moment* | WO-001 (frozen) |
| `src/core/{rng,bus,fixed-step,math,intent,collide,settings}.ts` | Seeded RNG, bus, 60 Hz stepper, math, stick→world, static colliders + arena clamp, settings store | WO-001 (frozen) |
| `src/tuning/arena.ts` | Spawns, colliders, bridge foot, pool sizes (§4.4) | WO-001 (frozen) |
| `src/render/probe.ts`, `src/moments/{index,common}.ts`, `src/main.ts` | Screen-space probe (L-0006), moment registry, entry | WO-001 (frozen) |
| `src/core/{sim,flow}.ts` | Step order, reset, phase machine | WO-004 |
| `src/world/**`, `src/render/{renderer,materials,post…}.ts` | World, lights, post, quality, `groundHeight`/`walkableRadius` (pure, called by everyone) | WO-002 |
| `src/hero/**`, `src/camera/**`, `src/fx/**`, `src/input/**`, `src/audio/**` | Hero rules + view, camera rig, hit FX + damage numbers, unified input + touch UI, all SFX/music | WO-003 |
| `src/golem/**`, `src/minions/**`, `src/ui/**`, `src/app/**`, `src/style.css`, `index.html` | Guardian AI + view + decals/hazards/crumble/coins, minions, HUD + menus, wiring + hooks | WO-004 |
| `src/tuning/{world,camera}.ts` · `{hero,follow}.ts` · `{golem,ui}.ts` | Numbers from experience.md go here | WO-002 · WO-003 · WO-004 |
| `src/moments/{world,hero,loop}.ts` | Frame-table scripts (§11) | WO-002 · WO-003 · WO-004 |

**Frozen cross-slice calls:**
- `hurtHero`, `bufferHeroInput` and `isHeroAttackActive` (hero/sim.ts, called by the golem and the core).
- `resolveHeroAttacks` and `rollCrit` (hero/combat.ts).
- `createGolem`/`stepGolem` and `createMinions`/`stepMinions`.
- `groundHeight`/`walkableRadius` (world/ground.ts).
- `toonMaterial`/`emissiveMaterial`/`glowSprite`/`gradientMap` (render/materials.ts).
- `framingFor` + `PRESETS` (tuning/camera.ts: the §4.3 aspect presets, already entered).
- Every `create*` factory type in contracts.ts.

Implementations may change; signatures may not.

**Hit ownership:**
- Hero combat writes `golem.hp/poise/hitFlash/hitsTaken`, `minion.hp/hitFlash` and `state.hitstop`.
- Golem and minion sims call `hurtHero`.
- The golem sim owns `state.hazards` (shockwave ring, boulder landing) and `timeScale` on death.
- The hero sim sets `timeScale` on a perfect dodge.

## State and data flow
1. rAF tick → `stepper.advance(dt × state.timeScale)`.
2. Each step: `intent.camYaw = rig.yaw` → `input.sample(intent)` → `stepSim`. The step order is clear events → prev copy → flow → (hit-stop) → hero → hero hits → golem + hazards → minions.
3. Drain `state.events` → bus. Audio, FX, rig, UI and golem view all listen on the bus.
4. Each frame: every `View.update(FrameInfo{state, alpha, dt, time, paused})` → `ui.update` → `renderer.render`.
5. A retry replaces the entity objects, so views re-read `state.*` every frame.

Settings → `renderer.setQuality(QualitySetting)`, and the effective `Quality` is forwarded to every View (auto-downgrade included).

## Performance budgets
| Budget | Target | Measured by |
|---|---|---|
| Draw calls | ≤ 250 (High), ≤ 150 (Low) | `__skyrest.stats()` in smoke [S1] + each moment |
| Triangles on screen | ≤ 1,000,000 (High), ≤ 400k (Low) | same |
| Sim step | ≤ 1 ms mean | unit [C7] (10k steps < 200 ms) |
| Hot-loop allocation | none per frame; heap flat ±10 % over a 60 s scripted fight | WO-004 loop spec (`performance.memory`), code review |
| JS bundle | ≤ 300 KB gzip (now 139 KB) | `scripts/check-size.mjs` in verify |
| First playable | ≤ 3 s from local preview | e2e `ready` timeout + timing log |
| Particles | ≤ 400 alive (§5) | FX pool size assert (unit) |
| Real fps | reported only from the Owner's iPhone; never claimed from SwiftShader | — |

## Verification
- `npm run verify` is green on the scaffold.
  - 14 unit tests: determinism, 30 vs 144 Hz independence, purity, camYaw, presets, moments registry, scripted golem kill.
  - 8 e2e tests: boot with 0 console errors, title, budgets, probe of hero/golem/temple/bridge/arena at desktop/portrait/landscape, hooks drive the sim, emulated-iPhone tap Start, and **all 13 moments at 430×932 and 1280×720, plus F2 at 802×917 and F13 at 932×430**.
- Screens go to `projects/skyrest/evidence/screens/` (`EVIDENCE_DIR=<dossier>/evidence` redirects them).
- Slices add their own spec files and never edit another slice's. `moments.spec.ts` stays as is: slices only fill their `src/moments/*.ts`, and moment scripts must return `ok` truthfully.

## Waves
| Wave | Work orders | Notes |
|---|---|---|
| 0 | WO-001 | Done by the architect in this run: scaffold, contracts, hooks, verify |
| 1 | WO-002, WO-003, WO-004 | Parallel, disjoint ownership, 3 engineers |
| 2 | polish (resume the same 3) | Driven by polish-critic findings on the moment screenshots |

**Critical path:** WO-003 combat feel → WO-004 scripted playthrough + F9/F10 → the critic's parity call on F2 (WO-002).

WO-004 can test against the scaffold combat from day one. The rules already kill the golem in unit test [C5].

## Work orders

### WO-001 — Scaffold, contracts, verify (DONE)
- **Role / discipline:** architect
- **Depends on:** —
- **Owns:**
  - The project config: `package.json`, the lockfile, `tsconfig.json`, `vite.config.ts`, `playwright.config.ts`, `README.md`, `.gitignore`, `scripts/**`.
  - Frozen source and harness: `src/contracts.ts`, `src/main.ts`, `src/core/{rng,bus,fixed-step,math,intent,collide,settings}.ts`, `src/tuning/arena.ts`, `src/render/probe.ts`, `src/moments/{index,common}.ts`.
  - Tests: `tests/unit/{contracts,fixed-step,purity}.test.ts`, `tests/unit/support/**`, `tests/e2e/support/**`, `tests/e2e/{smoke,smoke.phone,moments}.spec.ts`.
- **Done when:** [x] `npm run verify` prints `VERIFY PASSED` · [x] `npm run probe` prints boxes at 3 viewports · [x] the hooks include `moment()`, forced crit and forced damage.

### WO-002 — World & Look
- **Role / discipline:** engineer / rendering + environment art
- **Depends on:** WO-001
- **Owns:** `src/world/**`, `src/render/**` (except `probe.ts`), `src/tuning/{world,camera}.ts`, `src/moments/world.ts`, `tests/unit/world*.test.ts`, `tests/e2e/world*.spec.ts`
- **Objective:** Build the reference look and depth.
  - §4.1 palette and §4.2 SoftToon material, rim light, shadows, fog, sky dome, grade, bloom on High, glow halos on Low, the quality table and auto-downgrade.
  - §4.4 layout: arena dome with `walkableRadius` noise, framing trees A/B/C/F/G, boulders, grass and flowers, bridge, temple isle (emblem, banners), waterfalls, spire isle, distant isles, cloud sea.
  - §6 ambient life.
  - The §4.3 PRESETS numbers, tuned until the probe matches the §4.3/§11 screen ranges.
- **Acceptance:**
  - [ ] Probe at 802×917 after `moment('F2')`: temple sx 0.77–0.91, sy 0.07–0.22; hero sx≈0.50, sy 0.80–0.92 (a `world.spec.ts` assertion).
  - [ ] Same check for F12 (portrait) and F13 (landscape) using the §4.3 ranges.
  - [ ] Draw calls ≤ 250 and tris ≤ 1M on High; ≤ 150 and ≤ 400k on Low (spec asserts both tiers).
  - [ ] `groundHeight`/`walkableRadius` unit-tested (pure, continuous, walkable ≤ R−1).
  - [ ] Ambient motion: two F12 screenshots 500 ms apart differ in grass, petals and clouds (pixel diff > threshold).
  - [ ] Low tier has no composer, and halos are visible on the runes and emblem.
- **Screenshots:** F2 (portrait, desktop, reference), F12, F13. It also provides the backdrop for every other moment.
- **Quality notes:** §12 items 1, 2, 15 (canopy dither, with the camera position from WO-003), 16, 17, 18, 19, 20.

### WO-003 — Hero & Combat feel
- **Role / discipline:** engineer / gameplay feel + character + input + audio
- **Depends on:** WO-001
- **Owns:** `src/hero/**`, `src/camera/**`, `src/fx/**`, `src/input/**` (incl. `input/touch.css`), `src/audio/**`, `src/tuning/{hero,follow}.ts`, `src/moments/hero.ts`, `tests/unit/{hero,combat,input,camera}*.test.ts`, `tests/e2e/{hero,touch}*.spec.ts` (touch specs named `*.phone.spec.ts`)
- **Objective:**
  - The §4.5 hero model, with animations driven by `actionFrame`/`stride`.
  - §5 numbers: movement, 3-hit combo, Gale Crescent skill, dodge with i-frames, perfect dodge + `timeScale`, hurt.
  - The §4.3 rig: follow spring, lock-on yaw, manual orbit, title orbit + intro glide, kick, trauma shake, FOV punch, reduceShake.
  - Slash trail, sparks, chips and dust (pooled ≤ 400), damage numbers (comma grouping, crits gold 40 px).
  - Keyboard, mouse, gamepad and touch (floating joystick, Attack/Dodge/Skill buttons, §8 onboarding pulses for the controls).
  - All §7 SFX/music, mapped from bus events: iOS unlock on first gesture, pause freezes audio.
- **Acceptance:**
  - [ ] A unit test asserts the per-hit freeze is 60/70/120 ms (+40 ms crit) and the combo windows match §5.
  - [ ] Unit test: i-frames 40–300 ms; a perfect dodge sets `timeScale` 0.5 for 120 ms.
  - [ ] Unit test: the skill hits twice, 160 ms apart, with an 8 s cooldown.
  - [ ] `touch.phone.spec.ts`, portrait and landscape:
    - a touch drag on the left half moves the hero;
    - tapping Attack and Dodge fires `swing`/`dodge` events;
    - buttons sit inside the safe area at sy > 0.82 in portrait;
    - releasing the stick stops the hero within 6 steps.
  - [ ] Hero `hFrac` ≥ 0.09 in portrait (reads at ~10 % of screen height).
  - [ ] `sfx()` logs the expected ids for swing, hit, crit, dodge, golemSlam and coin.
- **Screenshots:** F3, F4, F6 (portrait + desktop).
- **Quality notes:** §12 items 4, 5, 6, 7, 11, 12, 14, 24 (audio half).

### WO-004 — Stone Guardian & Game loop
- **Role / discipline:** engineer / AI + UI + integration
- **Depends on:** WO-001
- **Owns:** `src/golem/**`, `src/minions/**`, `src/ui/**`, `src/app/**`, `src/core/{sim,flow}.ts`, `src/style.css`, `index.html`, `src/tuning/{golem,ui}.ts`, `src/moments/loop.ts`, `tests/unit/{golem,loop,flow}*.test.ts`, `tests/e2e/loop*.spec.ts`
- **Objective:**
  - The §4.5 Guardian: mossy boulder parts bobbing out of phase, runes and eyes driven by `glow`, intro assembly.
  - The §5 AI table: slam with shockwave hazard, sweep, toss, P2 double slam, poise and stagger, enrage at 50 %, wave scaling.
  - Telegraph decals that fill to 100 % on the active frame; death crumble; the coin fountain.
  - Pebble minions in P2 (stretch).
  - §4.6 HUD: coin pill + gear, nameplate + boss bar with a 450 ms lag chunk, hearts, wave label.
  - The §8 title, pause panel (5 rows), victory and fallen cards, retry ≤ 1.8 s, hints, and the bridge-wall line.
  - The wiring and hooks.
- **Acceptance:**
  - [ ] A unit test plays a full scripted fight with no cheats (dodging telegraphs) and reaches `victory` within 120 s of sim time.
  - [ ] Unit test: the golem AI picks each attack in range, and the telegraph `frames` equals the strike frame.
  - [ ] `loop.spec.ts`: title → Start → fight → kill (scripted inputs) → coins counted up by `GOLEM.coinsOnDeath` → NEXT WAVE → control within 1.8 s; TRY AGAIN from FALLEN likewise.
  - [ ] Pause via the gear and Esc freezes `frame`; settings persist; the QUALITY row switches the tier.
  - [ ] Heap flat ±10 % over a 60 s scripted fight.
  - [ ] Nameplate clamped on screen and never overlapping the coin pill (probe/DOM rects).
- **Screenshots:** F1, F5, F7, F8, F9, F10, F11 (portrait + desktop).
- **Quality notes:** §12 items 3, 8, 9, 10, 13, 21, 22, 23, 24 (freeze half), 25.

## Coverage
| Requirement | WO |
|---|---|
| Success 1: verify (typecheck, unit, 0 errors, playthrough, screenshots) | WO-001 harness; WO-004 playthrough |
| Success 2: F2 parity vs reference | WO-002 (framing/look); WO-003 trail; WO-004 nameplate |
| Success 3: every exceptional item evidenced | moments F1–F13, owners as below |
| Success 4: touch in emulated iPhone, portrait + landscape | WO-003 (`touch.phone.spec.ts`); WO-001 smoke.phone |
| Success 5: ≤ 250 draws, ≤ 1M tris, no hot allocations | WO-002 (world budget); all slices (pools); WO-004 heap test |
| Success 6: live on Pages | CEO (publish; `base './'` ready) |
| Exceptional 1: screenshot parity | WO-002 |
| Exceptional 2: depth (three planes, fog, rim, shadows) | WO-002 |
| Exceptional 3: golem presence (parts, runes, telegraphs, stagger, crumble) | WO-004 |
| Exceptional 4: every hit lands (trail, hit-stop, kick, sparks, numbers, sound) | WO-003; bar drain WO-004 |
| Exceptional 5: alive at rest | WO-002 (golem idle bob: WO-004) |
| Exceptional 6: phone-first control | WO-003 |
| Exceptional 7: whole loop + pause/settings | WO-004 |
| §12 items 1, 2, 15, 16–20 | WO-002 |
| §12 items 4–7, 11, 12, 14 | WO-003 |
| §12 items 3, 8–10, 13, 21–23, 25 | WO-004 |
| §12 item 24 (pause freezes all) | WO-004 (sim/particles via `paused`); WO-003 (audio) |
| Frame table F2, F12, F13 | WO-002 |
| Frame table F3, F4, F6 | WO-003 |
| Frame table F1, F5, F7–F11 | WO-004 |

## Risks and spikes
1. **SoftToon on iPhone.** Bloom plus PCF soft shadows may be too slow. WO-002 makes Low genuinely cheap (no composer, 1024 shadows, pr 1.25), and the Owner's phone measures real fps.
2. **Primitive characters look cheap.** WO-003 and WO-004 iterate on F2 and F4 against the reference in the first hours, and the critic reviews them before the rest of the polish.
3. **Headless only (SwiftShader).** Judge look from screenshots, perf from `stats()`.
4. **Cross-slice sim coupling** (the hero combat ↔ golem fields). Fixed by frozen field ownership; extra shared fields need a CEO request, private state goes in `ext`.
5. **iOS audio unlock and the touch gesture model.** WO-003 tests with `hasTouch`,; the Owner confirms on a phone.

## Board conditions
