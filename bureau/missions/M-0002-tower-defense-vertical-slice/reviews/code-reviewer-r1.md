# Review — code-reviewer — whole product — round 1 — M-0002

VERDICT: FAIL (one S1: the ship gate is red on the review machine; the code itself is sound)

## Scope reviewed
`projects/tower-defense/` at HEAD 33de423 (branch claude/tender-keller-hldqd8). Read in full: sim core and towers, `render/blots.ts`, `ui/garden.ts`, `app/*`, `main.ts`, `scripts/e2e/perf.mjs`; event consumers in render, HUD and audio.

## Method
- `npm ci && npm run verify`: 9 steps PASS, **perf FAIL** (R18 render p95 8.40 ms > 8). Unit tests: 163 pass, 0 skip.
- `node scripts/e2e/perf.mjs` ×3: 9.20 / 7.30 / 8.70 ms.
- Scratch probes (in the scratchpad, product untouched):
  - frame split: JS mean 2.3 ms (p95 5.0); readback/raster mean 5.6 ms (p95 8.6);
  - CDP CPU profile: getImageData 70 %, drawImage 8.6 %;
  - full-canvas blit and fill costs;
  - canvas census at 1920×1080, DPR 2;
  - vitest repro of the hit-stop `ps`/`s` gap.
- `grep` for TODO/FIXME/placeholder/.skip: none in product code.

## Findings filed
| ID | Sev | Title | Where |
|---|---|---|---|
| F-006 | S1 | R18 render perf gate fails 3 of 4 runs; verify red; 6.2 ms does not reproduce | `scripts/e2e/perf.mjs:9`, `ui/garden.ts:426,497` |
| F-007 | S2 | Hit-stop keeps `ps ≠ s`: blots shimmer during the freeze | `sim/index.ts:500` |
| F-008 | S2 | Holding Backspace sells (key-repeat bypasses the two-press confirm) | `app/game.ts:555` |
| F-009 | S2 | Vignette and grain hold 2 extra full backing stores (≈ 63 MB at 4K); rebuilt on every resize | `ui/garden.ts:94` |
| F-010 | S3 | Sprite keys duplicate Shadow/Flash per cb/Pale; dead `Sprite.half` | `render/blots.ts:330` |
| F-011 | S3 | Live blot path ignores the pass alpha; sprites honour it | `render/blots.ts:449` |
| F-012 | S3 | e2e stages with rAF live; perf header and architecture row describe the old metric | `perf.mjs:52`, `screenshots.mjs:46` |

## Checks that passed
- **Sprite cache (CEO perf work).**
  - The key packs kind, layer, Pale, cb and bucket without collisions: bucket ≤ 63 fits 7 bits, max key about 10.7k.
  - Phase buckets match exactly: `get` adds `PHASE_OFFSET` and `paint` subtracts it.
  - Shadow offset, squash centring and the one-frame flash are right.
  - A resize or DPR change shows up as a new `m.a`, which clears the map.
  - Shake and letterbox are only translation and uniform scale (`b = c = 0` guarded), so the device-pixel snap at `m.a·x + m.e` agrees with the live paths within 0.5 px.
  - A failed `makeCanvas` disables the cache cleanly.
  - Memory is bounded: 411 sprites, 16 MB, at DPR 2 fullscreen after 15 s of R18.
- **Overlays.**
  - The grain rewrite is exact algebra: multiply at alpha *a* gives dst·(1 − a(1 − s)), the same as black at alpha a(1 − s).
  - The vignette clear strip is right: corner distance 512 < r0 514.
  - The overlay key covers size and transform, and both callers run after the shake `restore()`.
- **Readback probe.** `getImageData(1 px)` forces each frame's raster, so it is an honest and pessimistic CPU proxy. With it, raster turns out to dominate (5.6 ms of a ≈ 8 ms frame).
- **Sim.**
  - Purity holds; the §6 peel rules, leak RBE, boss slow cap, freeze fallback and 75/50/25 % sheds all match.
  - Overflow drops are counted and hashed (blots, and projectiles through both counters).
  - Compaction is stable, and grid queries exclude children born this tick.
  - Determinism passes at 30 vs 144 Hz.
- **Towers.**
  - Targeting tie-breaks, Owl auras (best wins), Koi pulse order and caps, jets, stone lead and skips, and pierce on immune hits all match §7.
  - `resolveStats` applies ×0.87 exactly once.
- **Pooled events.** Every consumer either copies primitives on receipt or uses the event synchronously: blot/tower layers, fx, HUD, audio, testhook `watch`. No layer keeps an event reference.
- **Scenes.**
  - `newRun` builds a fresh sim and resets fx, blots, towers, HUD and run state; ids restart and the slot table is cleared.
  - Pause stops stepping, blur auto-pauses, and settings back returns to the right scene.
  - Settings are sanitised, persisted under try/catch, and unknown keys are dropped.

## Strengths worth keeping
- The `SimContext` seam is enforced, and the allocation-free event slabs are the right shape: heap growth is 0.02 MB over 3,600 steps.
- In-place peel (child 0 keeps its index) removes the gap frame by construction.
- The CEO's perf comments explain the reasoning: buckets, fast path, algebra.
- Swapping in the honest probe instead of keeping the flattering number was the right call.

## Overall assessment
Simulation, towers and the app shell are at flagship quality: correct, deterministic, well tested, and I found no correctness defect in the core loop. The CEO's sprite cache and overlays are correct, with no wrong pixels from transform, alpha or invalidation. What they cost is memory (F-009, F-010). They have not bought enough headroom yet: on this 4-core box the R18 frame sits at the 8 ms line, and 3 of 4 runs fail it (F-006). The ship gate is therefore red, and "verify is green" cannot be claimed. Fixing F-006 (paper baked into an opaque ground cache, fewer blits per blot, median of 3 runs) plus F-007 and F-008 brings this to PASS WITH FINDINGS.
