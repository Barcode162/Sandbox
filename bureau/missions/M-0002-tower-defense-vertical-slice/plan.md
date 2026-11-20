# Plan — M-0002 Tower defense vertical slice

Cap: 2,500 words. Contracts live in code in `projects/tower-defense/src/contracts/` and `src/data/`. Architecture: `design/architecture.md`. Spec sections are cited as §n.

## Slices
| Wave | Work orders | Notes |
|---|---|---|
| 0 | WO-001 | Scaffold, contracts, data and verify. **Done by the architect in this run**: `npm run verify` is green with 4 PENDING slots. |
| 1 | WO-002, WO-003, WO-004, WO-005 | Four engineers with disjoint ownership. Each slice builds against the stubs and fakes the other side of a seam in its own tests. |

**Critical path:** WO-002 core and peel → WO-003 attacks → the win bot reaches victory at R20 (balance via WO-002 knobs) → WO-004 `playScript`/`stage` wiring → WO-005 strict verify (playthrough, determinism, screens, perf).

**Integration:** the CEO runs `npm run verify` after each slice lands and `npm run verify -- --strict` at the end. The slices meet only at frozen seams (stub modules), so no hand-merge work order is needed.

**Seams engineers must respect:**
- WO-003 never edits blots directly. It goes through `SimContext`, except that `auraStripPale` may set `blot.pale=false`.
- WO-002 never decides tower behaviour.
- WO-004 never mutates `SimState`. It only enqueues commands.
- WO-005 reads the game only through `window.__inkfold`.

## Coverage
| Requirement | WO |
|---|---|
| SC1 clean `npm install && npm run verify` | WO-005 (WO-001 scaffold) |
| SC2 win bot, loss bot, restart resets | WO-002 driver · WO-005 e2e |
| SC3 4×2×3 purchasable and visibly distinct | WO-003 |
| SC4 peel unit tests | WO-002 |
| SC5 determinism at 30/144 Hz | WO-005 (WO-002 hash, WO-004 loop) |
| SC6 perf [A3] | WO-002 bench · WO-005 probe |
| SC7 polish frames §10.1–§10.10 | WO-004 (composition), WO-002/003 (content), WO-005 (captures) |
| SC8 board ≥ 8.0, zero S0–S2 | all |
| §3 first 10 s, §10.1 title and attract | WO-004 |
| §4 look, §5 map render, world density | WO-004 |
| §6 blots, Pale, peel rules | WO-002 |
| §7 towers, tiers, targeting, auras | WO-003 |
| §8 economy, waves, scripts, knobs | WO-002 |
| §9 HUD, §10.4 Fold card | WO-004 |
| §10.5 draw order, particle caps | WO-004 order · WO-002 fx |
| §10.6 boss sim (sheds, hit-stop) / boss presentation | WO-002 / WO-004 |
| §10.7–§10.10 pause, settings, game over, victory | WO-004 (WO-005 store) |
| §11 feel: pop, hit, child squash | WO-002 |
| §11 feel: fire, place | WO-003 |
| §11 feel: shake, floats, input, speed | WO-004 |
| §12 sound and music | WO-005 |
| §13 controls | WO-004 |
| §15 accessibility: colourblind blots | WO-002 |
| §15 accessibility: settings, letterbox, blur pause | WO-004 |
| §16.1–3, 11–14, 16, 20, 21 | WO-004 |
| §16.4–8 | WO-002 (§16.8 sound: WO-005) |
| §16.9, 10 | WO-003 |
| §16.15 shadows | WO-003 towers · WO-004 rocks, jar, cranes, cards |
| §16.17 boss notches | WO-004 bar · WO-002 thresholds |
| §16.18, 19 | WO-005 |
| §18 capture set | WO-004 stages · WO-005 capture |

## Work orders

### WO-001 — Scaffold and contracts
- **Role / discipline:** architect / game architecture. **Depends on:** spec. **Wave 0. Status: done.**
- **Owns:** `src/contracts/**`, `src/data/*` except `balance.ts` and `layout.ts`, `tests/unit/data/**`.
- **Build:**
  - Vite + TS project with frozen types and the sim/tower seam.
  - All §5–§8 and §11 data with `resolveStats`/`tiersValid`.
  - Implemented utilities: path, rng, placement, loop, settings.
  - Stubs for every other module.
  - The verify pipeline with boot implemented and 4 PENDING slots.
- **Done when:**
  - [x] `npm run verify` shows `VERIFY GREEN with 4 PENDING`.
  - [x] `tests/unit/data/spec-data.test.ts` passes: path 2570.5, the RBE column, the cash chain for all 20 rounds, and the win script valid at 8,340 spend and affordable every round.
  - [x] The purity test passes on `src/sim` and `src/data`.

### WO-002 — Sim core, blots and peel
- **Role / discipline:** engineer / gameplay simulation + blot rendering. **Depends on:** WO-001. **Wave 1.**
- **Owns:** `src/sim/**` except `src/sim/towers/**`, `src/data/balance.ts`, `src/render/blots.ts`, `src/render/fx/**`, `tests/unit/sim/**`.
- **Build:**
  - `createSim` with the tick order in architecture §State.
  - Commands: place, upgrade (via `tierStatus` and `resolveStats`), sell (`sellValue`, fresh-fold lifecycle), target, startRound, autoStart.
  - Wave spawning (§8), movement with slow/freeze/stun, leaks (§6 rule 4), the grid, and `SimContext.hit` with all the §6 peel rules.
  - Money and bonus, victory and defeat, the boss (sheds, warning, 20 % slow cap), hit-stop (§11), first-seen events.
  - `stateHash` over every blot and tower; `createScriptDriver`; `buildStressSim`. The stress sim may seed projectiles straight into the pool.
  - `drawBlotShape` and the blot layer: §6 lobes, comet, hexagon, scribble with ⌈hp/3⌉ loops, maw, pips, Pale dash and hatch, colourblind pips, squash, hit flash and recoil.
  - `createFx` with the §10.5 tiers and the §11 pop ring and flecks. Immune hits get sparks.
- **Done when:**
  - [ ] Unit: peel overflow (lance 6 on a Splat strips 3 layers and the rest is lost), child positions s − 6k, immuneTo, inherited Pale and slow, leak RBE, Knot/Inkmaw children, boss sheds at exactly 75/50/25 %.
  - [ ] Unit: `playScript(WIN_SCRIPT)` reaches victory with ≥ 40 seeds and `LOSS_SCRIPT` reaches defeat by R12. Run headless in Vitest once WO-003 lands; before that, test against a fake tower system.
  - [ ] Unit: the same seed and script give the same `stateHash` twice. The purity test still passes.
  - [ ] Unit (Node): `runPerf(buildStressSim(), 600)` has p95 ≤ 4 ms.
  - [ ] Screenshot, 1280×720: every blot kind ×{plain, Pale} ×{normal, colourblind} in one grid, at `evidence-local/screens/blots-grid.jpg`.
- **Quality notes:** §16.4–8. Pop rings are never culled. Knot gets 2 hit-stop ticks on pop.

### WO-003 — Towers, upgrades and attacks
- **Role / discipline:** engineer / gameplay systems + sprite art. **Depends on:** WO-001. **Wave 1.**
- **Owns:** `src/sim/towers/**`, `src/render/towers/**`, `tests/unit/towers/**`.
- **Build:**
  - `updateAuras`: best Owl aura wins; detect, interval multiplier, +dmg, strip Pale.
  - `updateTowers`: §7 targeting with stable ties; turning at 720°/s; cooldown starts at 0; range measured to blot centre minus R.
  - `updateProjectiles`: quills and lances with pierce and spread; stones on a 0.45 s lead, splash, stun and skips along the path tangent; Koi pulse (First order, max blots, slows, every-3rd freeze, frost); Typhoon jets (8, rotating, area-class, carrying the slow); Owl beam (hitscan, pierce-to-max-range, Eclipse multipliers).
  - The tower layer and `drawTowerSprite`: 4 silhouettes × all 12 valid tier combos per kind, each tier visibly changed (§7 visual column). Coaster, hard shadow and tier notches. Projectile, beam and pulse visuals. Crack and frost decals. §11 fire feel. Place, upgrade and sell flecks via `Fx`.
- **Done when:**
  - [ ] Unit with a fake `SimContext`: each targeting mode and tie-break; Wax immune to Cut and Wash (Tern A-path, Koi) but hit by B2 Crush; Pale ignored without detection, but area attacks hit it; aura non-stacking; crosspath sealing via `tierStatus`.
  - [ ] Unit: each of the 24 tiers changes at least one behaviour observable from `TowerStats` or emitted events.
  - [ ] Screenshot: a 4 × 12 sprite sheet (every valid tier combo) at `evidence-local/screens/towers-sheet.jpg`. Every cell differs from its neighbour by ≥ 2 % of its pixels (pixel-diff script in the test).
- **Quality notes:** §16.9, §16.10, §16.15 (towers). Signature attacks must be distinguishable in the R18 frame: Typhoon rosette versus Gale fan.

### WO-004 — Garden, HUD and screens
- **Role / discipline:** engineer / game UI + rendering + game feel. **Depends on:** WO-001. **Wave 1.**
- **Owns:** `src/app/**` except `settings.ts`, `src/ui/**`, `src/main.ts`, `src/data/layout.ts`, `index.html`, `tests/unit/ui/**`.
- **Build:**
  - Scene machine: title with the attract sim (§10.1) → play → pause, settings, game over, victory, with restart.
  - Input: all of §13, plus blur auto-pause and the letterbox (§15).
  - The compositor in the §10.5 order with interpolation.
  - The garden: paper grain, vignette, path ribbon and stitch, world density (§4), no-build hatch, seed jar fill.
  - The §9 HUD with fixed-advance digits, the Satchel cards, the Fold card (§10.4: states, sealed hover, previews, sell/refund, tally) and the placement ghost (§10.2: star, banners).
  - Floating text (§11), shake, banners, the boss bar with notches (§10.6), the game-over flood, victory cranes, and the speed/Go button.
  - Reduce-motion variants throughout.
  - The test hook: `playScript` (driver via `setBeforeStep` under the manual clock), `restart`, all `stage(StageId)` compositions, and `perfProbe`.
- **Done when:**
  - [ ] Unit: the input map (each §13 key leads to the right Command or scene), title to first tower in 3 clicks via synthetic pointer events, Go label truth table, restart resets the layers.
  - [ ] Every `StageId` resolves with zero console errors (WO-005 captures them). Each frame matches its §10 row, with self-check notes in the report.
  - [ ] `restart()` < 2,000 ms from game over with no old-state frame.
- **Quality notes:** §16.1–3, 11–14, 16, 17 (bar), 20, 21. §17 anti-goals: no mid-round modals, no wall of text.

### WO-005 — Audio, settings and the verify harness
- **Role / discipline:** engineer / audio synthesis + test engineering. **Depends on:** WO-001. **Wave 1.**
- **Owns:** `src/audio/**`, `src/app/settings.ts`, `scripts/**`, `package.json`, `package-lock.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `README.md`, `tests/unit/audio/**`.
- **Build:**
  - `createAudio` covering all of §12:
    - Buses and the compressor.
    - Every event row. Pop pitch per kind.
    - The 6-voice-per-50 ms limiter and the crackle bed.
    - Ducking priority.
    - Music states on bar lines with an 800 ms crossfade.
    - Pause lowpass. Mute.
  - The settings store stays as is or is extended.
  - Implement `playthrough.mjs`, `determinism.mjs`, `screenshots.mjs` (the §18 list at 3 sizes) and `perf.mjs` (budgets in architecture), with JSON evidence.
  - Remove each step from `PENDING` once it passes. Add `--strict` to the README.
- **Done when:**
  - [ ] `npm run verify -- --strict` is green (requires WO-002/003/004 merged). PENDING is empty.
  - [ ] Unit: the voice limiter caps at 6 per 50 ms, extras feed the crackle; the leak gain is ≥ the pop gain; settings changes reach the bus gains.
  - [ ] An offline render of 300 pops in 1 s peaks below 0 dBFS (`OfflineAudioContext` run in Chromium via the hook or a page script).
  - [ ] `evidence-local/screens/` holds every §18 shot as JPEG q80 at DSF 1, and `perf/perf.json` meets the budgets.
- **Quality notes:** §16.18, §16.19, §16.8 (tink). The audio must not throw when there is no AudioContext.

## Board conditions

Gate 1 r1 · director-engineering CONDITIONAL 8.0 (`board/plan-director-engineering-r1.md`). Folded in by the CEO:
1. Blots-grid and towers-sheet captures can't run under Vitest (no canvas) → `StageId` gains `'blots-grid' | 'towers-sheet'` (types.ts); WO-004 builds both stages, WO-005 captures them in Chromium and pixel-diffs them.
2. `verify --strict` has no time limit → it must finish in ≤ 8 min; R18/R20 stages skip ahead without drawing; the win script must give identical results in Vitest and in the browser (WO-005 asserts this).
3. Zero-allocation budget is not met → WO-002 pools `SimEvent`s (or architecture.md states the exception honestly); `PerfReport.p99StepMs` added, budget ≤ 6 ms (WO-005 enforces).
4. A full 2048 pool is undefined → WO-002/WO-003 drop the overflow deterministically (no crash), count drops in an overflow counter that goes into the state hash, and unit-test it.
5. Balance → WO-002's engineer is resumed after WO-003 lands to tune the win/lose scripts; no skipped or faked win/loss tests at ship.

