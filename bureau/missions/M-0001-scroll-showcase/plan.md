# Plan: M-0001 *Bent Light* (scroll-driven animation showcase)

Architect · 2026-11-20 · Tier 3 · **Revision 2** (Gate 1 conditions folded in; see "Board conditions" at the end). Architecture: `design/architecture.md` (cited as **K1–K21** for decisions and **C1–C7** for contracts). Spec: `design/experience.md` (cited as **§n**, polish items as **#n**). Board reports: `board/plan-director-{vision,engineering,risk}-r1.md` (conditions **V1–V4**, **E1–E9**, **R1–R9**).

**Ground rules for every work order**
- **Paths.** Every path is relative to `projects/scroll-showcase/` unless it starts with `bureau/`. Commands are run from `projects/scroll-showcase/` unless they start with a `bureau/` path, which are run from the repo root.
- **Contracts.** The C1–C7 contracts are frozen at the end of wave 0. Code against them. If one is wrong, stop and raise a REQUEST; do not change it.
- **Ownership.** You write only to paths you own. You may read anything. If you need a change in a file you do not own, put it under REQUESTS in your report. Ownership is checked mechanically (end of this file). Every test path has exactly one owner in every wave from wave 1 on.
- **Custodians.** Where a WO is marked *custodian* of a path, it keeps that path's tests runnable (e.g. after a helper or config change) but must not add, delete or loosen an assertion. Every custodian edit is listed in its report.
- **Helpers.** In wave 2, `tests/e2e/helpers/**` belongs to WO-019 and is **additive only** (new exports; no changed signatures or tolerances). Other test WOs put suite-private code under their own suite's `lib/` directory.
- **Test ids.** Every spec-derived test title starts with its id(s) in brackets, then a sentence about the piece, e.g. `[E-S5] Scene 5 hands one exact white beam to Scene 6 with ≤ 0.5% of pixels changed`. Ids are the §15.3 E-ids, the U-ids, `E-F5`, polish items as `[#n]` and §19 bullets as `[§19.n]`. `verify.mjs` reads results by id (K18).
- **Proof.** "Done" means:
  1. `npm run verify:quick` is green (typecheck, static guards, dev unit tests, size; the unit spec suite is printed but not gating in quick mode).
  2. Your own dev tests pass.
  3. Every spec case the verify summary maps to your WO is green, or listed in your report as red with the reason.
  4. Your acceptance criteria are proven by a command and its output, or by a screenshot path.
  5. Your report is at `bureau/missions/M-0001-scroll-showcase/reports/WO-0NN-<slug>.md`.
- **Tests.** Engineers' own tests go in `tests/unit/dev/<area>/` and `tests/e2e/dev/<area>/`. The test-engineer's suites are written from the spec, not from your code. If a spec test fails against your work, the spec wins. If you think the test misreads the spec, raise it with the CEO. **No test may be skipped, fixme'd, marked `.fail` or `.only`** (static guard 9), and no tolerance may differ from its spec value without a `log.md` entry.
- **Clean slate.** No `console.log` is left in `site/`. Run `npm run verify:quick` before you report.

## Waves

| Wave | Work orders | Notes |
|---|---|---|
| 0 | WO-001, WO-002, WO-003, WO-004, WO-005 | Scaffold and frozen contracts (WO-001, integrator), with the pure core, the tokens, copy and phrases, the shared render components, and the Scene 4 perf spike in parallel. **Join:** the CEO runs `npm run verify:quick` in `projects/scroll-showcase` and freezes the contracts in `log.md`. Any failure goes back to the owning wave-0 WO. |
| 1 | WO-006, WO-007, WO-008, WO-009, WO-010, WO-011, WO-012, WO-013 | 8 in parallel: engine, Scenes 1–5, and test engineering (unit spec suite and guards; e2e infrastructure, contracts and verify floors) **alongside** the builders. WO-010 starts only once WO-005's decision is filed. WO-013 closes no earlier than the first scene WO (its mutation proof needs one real `apply`). |
| 2 | WO-014, WO-015, WO-016, WO-017, WO-018, WO-019, WO-020, WO-021, WO-029 | 9 in parallel. **Integration 1** (WO-014: seams 1→5, D1 decision, fix rights over Scenes 1–5 and the engine) runs alongside Scene 6, admire, chrome, rewind and four test-engineering suites (behaviour + contracts; flash audit; health + unit spec + guards; perf + verify + minimal pack). **Join:** the CEO runs `npm run verify` and records the red list. |
| 3 | WO-027 (first), then WO-022, WO-023, WO-025, WO-026 | **WO-027 art review runs first** against the wave-2 build and files tuning requests. **Integration 2** (WO-025) owns every wave-2 product module and Scenes 1–3, 5–6; WO-022 owns Scene 4; both close only after the WO-027 requests addressed to them are resolved or CEO-declined. WO-023 hardens verify and adds `verify:mutants`; its three back-to-back runs start after WO-022 and WO-025 report. WO-026 builds the full §19 pack and the motion evidence. |
| 4 | WO-024, WO-028 | **Final integration** (WO-024): every spec test green, verify green 3× in a row, README, evidence index. WO-028 is the test custodian during final integration (triage, tolerance audit, final mutants run), so tests stay independent of the integrator. |

**Parallelism check:** in every wave no two work orders share a path; the "Owns" lines are exhaustive. The mechanical check and its output are at the end of this file.

## Critical path

**WO-001 → WO-006 (engine) → WO-014 (Integration 1) → WO-027 (art review, first in wave 3) → (WO-025 Integration 2 ∥ WO-022 Scene 4 resilience) → WO-024 (final integration) → `npm run verify` green 3×.**

- **Joins into the path:** WO-002 and WO-003 join into WO-006. WO-016 and WO-017 run **in parallel with** WO-014 (wave 2), not after it.
- **WO-027 on the path:** it was added by V1, and WO-025 and WO-022 cannot close until its tuning requests are resolved, so it sits on the path. It is a review (one sitting), not a build.
- **Side chain with the most risk:** WO-005 (S4 spike) → WO-010 (S4) → WO-014 → WO-022 → WO-024. If WO-005 or WO-010 runs late, the slip policy below applies: Scene 4 extends the schedule; it is not shipped below the WO-005 configuration.

## Slip policy (V4)

1. **Only two release valves.** Schedule pressure is absorbed **only** through the §16.1 cut order (in that order) and the §16.2 performance fallbacks (in the D2 order). Each one taken is recorded in the taking WO's report **with numbers** (what was measured, which rule fired) and logged by the CEO in `log.md`.
2. **Never cut.** No WO may drop or flatten a §4 frame-table row, a §3.1 hold band, a §14 grin moment or a §16 non-negotiable. A WO that cannot meet one of these reports PARTIAL or BLOCKED; it does not ship a reduced version.
3. **Scene 4 extends the schedule.** If WO-005 or WO-010 runs late, the schedule extends. Scene 4 (the peak) is never shipped below the WO-005-chosen configuration.
4. **Art review is not squeezed.** If WO-014 overruns, wave 3 starts later; WO-027 is never shortened or skipped to recover time.
5. **Thresholds are not valves.** No test tolerance, floor or flash rule is loosened to recover schedule (WO-028 audits this).

## Top risks the plan is built around
1. **Playwright drift.** Exact pins, plus the verify preflight in WO-001 and WO-013.
2. **Scene 4 cost.** Spiked first in WO-005, with flushed draw timing.
3. **Seams.** Pure seam gates exist from wave 1 (WO-012). WO-014 has one fix round, then D1.
4. **Timing flakiness.** No sleeps; `page.clock` only for JS timers; CSS transitions checked by seeking Web Animations (K11); three consecutive runs in WO-023 and WO-024.
5. **Vacuous green.** Test floors, an id manifest, skip bans and planted-defect mutants (K18, K20).
6. **Photosensitivity on fast navigations.** E-F5 audits the longest automated jumps per rAF, per 25% window (WO-020).

Details are in architecture → Risks & spikes.

---

## Coverage

### Brief success criteria

| Requirement | Work order(s) |
|---|---|
| SC1 `npm run verify` runs unit, e2e, axe and screenshots and exits 0 | WO-001 (pipeline stub), WO-013 (real pipeline, floors), WO-029 (perf wiring), WO-023 (hardening, ids fatal, mutants), WO-024 (green 3×), WO-028 (custody) |
| SC2 Pure function of position: same y gives the same rendered state after away-and-back; no drift while still | WO-002, WO-006, WO-007…WO-011, WO-015 (pure `state`); WO-012 (purity unit); WO-013 (E-D1, E-D2, E-D3 with rendered fingerprints); WO-019 (E-M2 rendered); WO-023 (mutants a, d, f) |
| SC3 Documented start and end states at p 0 and 1 | Scene WOs WO-007…WO-011, WO-015; WO-012 (U-3, §15.2 table); WO-013 (global endpoints, pixel facts) |
| SC4 Admire: enters after idle, hides chrome, announces, exits on scroll, key or pointer | WO-016, WO-017, WO-025; WO-019 (E-A1…A11) |
| SC5 Reduced motion: ambient off, fully usable | WO-003 (`stillPlan`), WO-006 (a/b instances), WO-016 (ambient disabled), WO-017 (pause disabled), WO-018 (rewind becomes jump), WO-022 (contact sheet); WO-019 (E-M1/M2) |
| SC6 0 serious or critical axe violations; no horizontal overflow at 375, 768, 1440 and 1920 | WO-001 (semantics), WO-017 (chrome), WO-025; WO-021 (E-X1) |
| SC7 0 console errors and unhandled rejections over a full scroll-through | WO-006 (error ledger, hash robustness), WO-021 (E-H1, malformed hashes) |
| SC8 Measured frame timing in the evidence; JS under budget | WO-005 (spike, flushed), WO-001 (`check-size`), WO-029 (perf project → `perf.json`, `perf.md` honesty section), WO-023, WO-024 (no unmeasured claims) |
| SC9 Screenshots of every scene at several progress points in `evidence/` | WO-029 (60 scene frames), WO-026 (full §19 pack, index, motion), WO-013 (seam diffs) |
| Exceptional #2: 20 random stops worth screenshotting | WO-026 (capture, all six scenes), WO-027 (judged by the designer), WO-025/WO-022 (tuning) |
| Exceptional #6: no layout shift | WO-001 (font faces), WO-021 (E-P2, CLS ≤ 0.01) |
| Exceptional #7: a legible suite | WO-012, WO-013, WO-019, WO-020, WO-021 (named, id-prefixed cases), WO-023 (summary, mutants) |
| D6 flash audit as a gate | WO-020 (E-F1…F5, 25% windows) |
| F10 / E-K1 hook at 40 px | WO-007, WO-013 |
| F8 / E-R2 resize round trip | WO-006, WO-013 |
| E-T1 ticks | WO-017, WO-019 |
| E-P1 / E-P2 first paint and fonts | WO-001, WO-007 (bake), WO-017 (font claim), WO-021 |
| Motion evidence (V2) | WO-026 (`npm run evidence:motion`), WO-024 (indexed) |

### Polish list (§17)

| # | Item (short) | Builder WO | Test WO |
|---|---|---|---|
| 1 | JS-off first paint ≈ booted p 0, < 0.5% | WO-007 (bake), WO-001 (noscript) | WO-021 (E-P1) |
| 2 | Plates in register give pure black (R, G, B ≤ 3) | WO-007 | WO-013 |
| 3 | Seam state gate and pixel diff ≤ 0.5% | WO-014, WO-015 (5→6), WO-025 | WO-012 (pure), WO-013 (E-S) |
| 4 | Bands gapless at 1×, 1.5× and 2×, snapped | WO-002 (`snap`), WO-004 (Bands), WO-010, WO-014 | WO-012, WO-013 |
| 5 | Scene 2 shear never reveals ground | WO-008 | WO-013 |
| 6 | Scene 3 white at centre; triplet peaks ≥ 6 px apart | WO-009 | WO-013; WO-027 (legibility by eye) |
| 7 | Scene 3 anti-aliased edges, stroke covers clip | WO-009 | WO-026 (evidence), WO-027 |
| 8 | Scene 4 facets share edges, no seams | WO-010 | WO-026 (evidence), WO-010 dev |
| 9 | Scene 4 byte-identical across runs | WO-010 | WO-013 |
| 10 | Scene 5 p 1 exact `#FFFFFF` (beam rect inset by one device px) | WO-011 | WO-013 |
| 11 | Scene 6 p 1 rhymes Scene 1 p 0 within 1 px | WO-015, WO-007 (PrismSVG redraw) | WO-012, WO-013 |
| 12 | Tabular label; wordmark never moves | WO-017 | WO-019 |
| 13 | Rail gradient in band order; dot reaches each tick at p 0 | WO-017 | WO-019 |
| 14 | Current tick fill in key colour; white tick ink outline on light chip | WO-017 | WO-019 |
| 15 | Tick labels never clip; flip below 1024 | WO-017 | WO-019 |
| 16 | No chrome fade while chrome has focus or hover | WO-016 | WO-019 |
| 17 | Breathing ramp 1,600 ms, first-frame delta ≤ 0.2 px | WO-016; scene WOs (additive breathing) | WO-019 |
| 18 | Exit decay 240 ms, no pop > 1 px | WO-016 | WO-019 |
| 19 | `pointermove` < 4 px does not exit | WO-016 | WO-019 |
| 20 | Pause survives reload; blocked storage defaults to on | WO-016, WO-017 | WO-019, WO-021 |
| 21 | Reduced motion: pause control focusable, explained, inert | WO-017 | WO-019 |
| 22 | Never two captions > 50% | WO-017 | WO-019 |
| 23 | Chips ≥ 7:1 over the brightest and darkest frames | WO-003 (tokens), WO-017 | WO-021 |
| 24 | Focus ring visible on wall, saffron, cobalt, mosaic and ink | WO-001 (ring in base.css), WO-017 | WO-021 (screens) |
| 25 | No horizontal scrollbar at 375 at 200% zoom | WO-001, WO-017 | WO-021 |
| 26 | Rewind cancelled by wheel, key, pointer and touch; announces scene | WO-018 | WO-019 |
| 27 | No admire during rewind; chrome visible | WO-016, WO-018 | WO-019 |
| 28 | Font swap CLS ≤ 0.01; title width Δ ≤ 2% | WO-001 (faces) | WO-021 |
| 29 | Fringe lines 1 px at every DPR and rotation | WO-007 | WO-026 (DPR 2 shots) |
| 30 | Colophon on the same `--wall` as Scene 6 p 1, both schemes | WO-015, WO-018 | WO-021 |
| 31 | Placard at 3,000 ms ± 50, 900 ms fade, correct label | WO-016, WO-017 | WO-019 (timer by clock, fade by seeking) |
| 32 | Caption corner never empty in admire | WO-017 | WO-019 |
| 33 | Space exits and scrolls | WO-016 | WO-019 |
| 34 | Tab lands on a visible control in the same task | WO-016 | WO-019 |
| 35 | Pause-control guard; Tab from it exits | WO-016, WO-017 | WO-019 |
| 36 | Announce once per spot; again on a new phrase band | WO-016 | WO-019 |
| 37 | 1440 → 375 → 1440 restores scrollY and frame | WO-006 | WO-013 |
| 38 | `__showcase.errors` empty, 0 console errors | WO-006 | WO-021 |
| 39 | Placard phrase correct at boundaries, including reduced `pShown` | WO-003, WO-016 | WO-012, WO-019 |
| 40 | 40 px opens the fan (+68 px) and splits plates ≥ 3 px | WO-007 | WO-013 (E-K1) |
| 41 | White point in Scenes 1–4 and the rail, one at a time, ≤ 6 px | WO-004, WO-007…WO-010, WO-017 | WO-012 (geom), WO-013 |
| 42 | Tick hit boxes 44 × 44, non-overlapping | WO-017 | WO-019 (E-T1) |
| 43 | Hold bands slow but perceptible (creep) | WO-007…WO-011, WO-015 | WO-012 (E-H0); WO-027 (perceptibility by eye) |
| 44 | Scene 1 wedges never overlap or gap mid-morph | WO-007 | WO-012 |
| 45 | JS-off page = opening frame + colophon | WO-001 (noscript style), WO-007 | WO-021 |

---

## Work orders

### WO-001 — Scaffold, frozen contracts and stub pipeline
- **Role / discipline:** integrator / web-platform
- **Depends on:** — (wave 0)
- **Owns (exclusive write):**
  - `package.json`, `package-lock.json`, `.gitignore`, `tsconfig.json`, `playwright.config.js`, `README.md`
  - `scripts/serve.mjs`, `scripts/check-size.mjs`, `scripts/verify.mjs`, `scripts/mutants.mjs`
  - `site/index.html`, `site/css/base.css`; empty stubs `site/css/chrome.css`, `site/css/colophon.css`, `site/css/scenes/s{1..6}.css`
  - `site/fonts/**`
  - `site/js/types.d.ts`, `site/js/main.js`, `site/js/core/env.js`, `site/js/core/announce.js`
  - stubs `site/js/engine/{engine,layers,hook,ambient,admire,rewind}.js`, `site/js/chrome/{chrome,font-claim}.js`, `site/js/scenes/{index,prism-svg,s1-incidence,s2-field,s3-refraction,s4-dichroic,s4-lut,s4-fallback,s4-contact,s5-agreement,s6-return}.js`
  - `dev/harness.html`, `dev/harness.js`
  - `tests/e2e/smoke.spec.js`, `tests/unit/dev/serve/**`
- **Objective:** a runnable, exportable skeleton that every later WO drops code into without touching anyone else's file. It:
  - transcribes architecture §C1–C6 verbatim into `types.d.ts`;
  - creates the C7 DOM skeleton with all §12 copy;
  - implements the stage pin contract (K4) in `base.css`;
  - provides stubs that satisfy the scene interface **and every C4 factory**, wired in `main.js`;
  - provides a loopback-only dev server, a dev harness and a stub verify pipeline that already runs every step.
- **Acceptance criteria:**
  - [ ] **Install.** `package.json` has `"type":"module"`, `"private":true`, `engines.node >=22`, and exact devDependencies `@playwright/test 1.63.0`, `playwright-core 1.63.0`, `@axe-core/playwright 4.14.0`, `axe-core 4.14.1`, `pngjs 7.0.0`, `typescript 6.0.2`. `npm ci` succeeds and `npm ls --all` shows one `playwright-core@1.63.0` (paste the output).
  - [ ] **Scripts.** They exist: `dev`, `bake` (calls `scripts/bake-static.mjs`; WO-007 creates it), `typecheck`, `test:static`, `test:unit` (`node --test 'tests/unit/**/*.test.js'`), `test:e2e`, `test:perf`, `check:size`, `verify:quick`, `verify`, `verify:mutants` (`node scripts/mutants.mjs`; the wave-0 stub prints "not implemented until WO-023" and exits 2), `evidence:motion` (`node tests/motion/record.mjs`; WO-026 creates it), `lighthouse` (optional, `npx --yes lighthouse@13.6.0 …`, documented as needing network and pulling ~179 MB of unlocked dependencies).
  - [ ] **Server (K19).** `scripts/serve.mjs` binds **`127.0.0.1` only** (never `0.0.0.0` or `::`), reads `PORT` (default 4173) and `SITE_DIR` (default `site`, used by mutants), serves `SITE_DIR` at `/` and `dev/` at `/__dev/` with correct MIME types for `.js .css .html .woff2 .svg .json .txt .md`, and returns 404 on misses. It decodes the path once, rejects any path containing a NUL byte, a backslash or a `..` segment (before or after decoding) with 400, and resolves the result with `path.resolve` and a prefix check against the served root.
  - [ ] **Traversal test (R6).** `tests/unit/dev/serve/traversal.test.js` starts the server on an ephemeral port and sends **raw** `node:http` requests (which do not normalise paths; probe A8). Each of `/../package.json`, `/%2e%2e/package.json`, `/..%2fpackage.json`, `/__dev/../../package.json`, `/%2e%2e%5cpackage.json` and `/%00` gets 400 or 404, and no response body contains the bytes of `package.json`. It also asserts `server.address().address === '127.0.0.1'`. The old `curl` check is removed (curl strips dot segments client-side).
  - [ ] **Contracts.** `site/js/types.d.ts` contains §C1–C6 exactly. `npm run typecheck` passes over `site/js`, `dev`, `scripts` and `tests`.
  - [ ] **DOM.** `index.html` matches C7: every id and class listed; `<title>` and meta description from §12; one `<h1>`; six sections with hidden `<h2>`s, `role="img"` art labels and captions; the colophon with the "otherwise" p2 string **and the `colophon-credit` line** (C7, R7); the noscript banner and noscript `<style>` (tracks collapsed, `#rewind`, `#jump` and `.colophon-p3` hidden, document height ≤ 100svh + colophon); the Scene 1 bake markers inside `.uv`.
  - [ ] **Font and licence (R7).** `site/fonts/space-grotesk-latin-wght-normal.woff2` is 22,288 B with sha256 `0640890476fc1198ab4de571fb658de443c4d85b66466ec09534a8737ab1ce9d`. `site/fonts/OFL.txt` is a **byte-identical copy** of the package's `LICENSE` (4,401 B, sha256 `18a4de52385f6b988782639d5d0cc1326e5a8c2de9a7f01d7b20d9aedcc60943`, probe A9); it is never edited. `SOURCE.md` records the package name and version and both sha256s. `check-size.mjs` (verify step 4) fails if either hash differs. `base.css` declares the Space Grotesk face (`font-display: swap`, weight 300 700) and **both** §13.2 fallback faces verbatim. `--font` is set per §13.2 Mode G.
  - [ ] **Pin contract.** `#track` height = `var(--track-h, 1600svh)`; `#stage` is sticky at `top:0` with height `100svh` and `overflow-x: clip`; `.art` ground extends to `100lvh`; no ancestor of `#stage` has `overflow` other than `clip` or `visible`; `.uv` has width `var(--U)` and height `var(--V)`, with `html[data-orient=portrait] .uv { transform: matrix(0,1,1,0,0,0); transform-origin: 0 0 }`. The smoke e2e proves stage top = 0 at y ∈ {0, D/2, D} at 1440×900.
  - [ ] **Focus and scroll.** The focus ring (§9 dual ring, `:focus-visible`) is defined in `base.css`. `html { scroll-behavior: smooth }` applies only under `prefers-reduced-motion: no-preference`.
  - [ ] **Scene stubs.** Every stub scene exports a `meta` equal to `SCENES[id-1]` (a local literal is allowed until WO-002 lands), `state()` returning a valid `SceneState` with null geometry, and a `mount()` that paints a flat band colour.
  - [ ] **C4 factory stubs (E3).** `engine/engine.js` exports `createEngine`, `engine/ambient.js` `createAmbient`, `engine/admire.js` `createAdmire`, `engine/rewind.js` `createRewind` and `chrome/chrome.js` `createChrome`, each with the exact C4 signature and inert behaviour (ambient `a ≡ 0`, admire never enters, rewind `active` false, chrome writes nothing), each annotated with its `types.d.ts` interface so `npm run typecheck` checks it. The stub engine implements the C5 hook shape (minimal is fine), sets `data-boot=ready` and exposes `__showcase.ready`.
  - [ ] **Wiring.** `main.js` creates env → ambient → engine → rewind → admire → chrome in C4 order. No later WO except the integrators (WO-014, WO-025, WO-024) and WO-006 needs to edit `main.js`.
  - [ ] **Harness.** `dev/harness.html?scene=N&p=X&amb=A&t=T` mounts scene N full-window via the same `SceneHost` shape and exposes `window.__harness.set(p, a, t)` and `.state()`. It reads `vp` through `core/env.js` and `core/geometry.js` once WO-002 lands.
  - [ ] **Playwright config.** Projects `e2e` (`testDir: tests/e2e`, `testIgnore: '**/evidence/check-index.mjs'`) and `perf` (`testDir: tests/perf`, **`testMatch: '**/*.perf.js'`**, workers 1); `retries: 0`; `webServer` runs `node scripts/serve.mjs` with `PORT` and `SITE_DIR` passed through from the environment.
  - [ ] **Verify stub.** `scripts/verify.mjs` runs steps 0–7 (architecture → Verification strategy) with the preflight version assertions, resolves `EVIDENCE_DIR` per K12 (env `SHOWCASE_EVIDENCE_DIR` first), prints a step table and writes `verify-summary.json`. It declares `VERIFY_PHASE = 0`, an empty `MANIFEST` and `FLOORS` of 0. **Phase 0 is the only phase in which a step may report 0 tests**; `--pass-with-no-tests` is passed to the perf step in phase 0 only, and the code asserts this (`if (VERIFY_PHASE > 0 && args.includes('--pass-with-no-tests')) throw`). `npm run verify` exits 0 on the skeleton.
  - [ ] **Size check.** `scripts/check-size.mjs` enforces every payload row of the budget table and the two font hashes, exits non-zero over budget (prove this with a temporary 50 KB junk file, then delete it), and writes `size.json`.
  - [ ] **`.gitignore`.** `node_modules/`, `evidence-local/`, `test-results/`, `playwright-report/`, `*.trace.json`.
  - [ ] **README stub.** It covers what the project is, `npm ci`, `npm run dev`, `npm run verify`, "never `playwright install` in the Bureau sandbox", and a link to the dossier.
- **Verification:** paste `npm ci && npm run verify` output, `node --test tests/unit/dev/serve/traversal.test.js` output, `sha256sum site/fonts/*`, and the smoke e2e result.
- **Quality notes:** #1 and #45 (noscript), #24 (focus ring), #25 (no overflow at 200% zoom: `overflow-x: clip` on the stage only, never on `html` or `body`), #28 (fallback faces).

### WO-002 — Core maths and shared geometry
- **Role / discipline:** engineer / geometry
- **Depends on:** — (wave 0; code against §C1–C2)
- **Owns (exclusive write):** `site/js/core/math.js`, `site/js/core/geometry.js`, `tests/unit/dev/core/**`
- **Objective:** implement the pure functions every scene and the engine share, so seams are equal by construction (§5.2, F5).
- **Acceptance criteria:**
  - [ ] `math.js` exports exactly the C2 list. `keys()` holds the first value before p0 and the last after the final key, and applies the per-segment ease. `fin()` maps −0 to 0. `mulberry32(0xB3E7)`'s first 5 outputs are recorded in a test as golden values.
  - [ ] `geometry.js` exports the C2 list. `SCENES` has tracks 220/300/260/320/220/180, the §3.1 hold bands and the §3.3 creep names. `TICK_G` = `[0, .14667, .34667, .52, .73333, .88]` (±1e-4).
  - [ ] `viewport()` gives bp, gutter and pitch per §11.1 for 375×812, 768×1024, 1024×768, 1440×900 and 1920×1080, with `lattice === 2*pitch` always. `trackLayout()` at 1440×900 gives `Y = [0, 1980, 4680, 7020, 9900, 11880]` and `D = 13500`.
  - [ ] `locate()`: y = D → scene 6, p 1, G 1; y = Y_s → scene s, p 0; y < 0 clamps to 0.
  - [ ] `bandRects()` and `bandRectsFromWeights()`: edges are cumulative and snapped with `snap(x, dpr)`; adjacent `u1 === u0` exactly; the first u0 is 0 and the last u1 is U; this holds at DPR 1, 1.5 and 2 at all five viewports.
  - [ ] `dotGrid(vp)`: a vertex dot sits at exactly (U/2, V/2), so `(U/2 − originU) % (2·pitch) === 0`. `shelf(vp)` gives u = .25/.50/.75 U, v = V/2, rot 0, with sizes per §4 (tri side 30 vmin, circle Ø 26 vmin, diamond side 21 vmin) and the §11.1 portrait sizes (40vw). `beamW(1440×900)` = 129.6.
  - [ ] There are no DOM references and no clock. `npm run test:static` passes on these files once WO-012 lands; until then, prove it with grep.
- **Verification:** `node --test 'tests/unit/dev/core/**/*.test.js'` output.
- **Quality notes:** #4 (snapping is the root of gapless bands), #41 (centre-dot alignment), the §11.1 invariant (lattice = vertex dots).

### WO-003 — Tokens, copy, placard phrases and the still plan
- **Role / discipline:** engineer / design-system and copy
- **Depends on:** — (wave 0; code against §C2)
- **Owns (exclusive write):** `site/css/tokens.css`, `site/js/core/tokens.js`, `site/js/core/copy.js`, `site/js/core/phrases.js`, `site/js/core/reduced.js`, `tests/unit/dev/content/**`
- **Objective:** a single source for every colour, type, spacing and motion token (§13), every string (§12.1, plus the C7 font credit), the frame-accurate placard phrases (§7.5, F2) and the reduced-motion still plan (§10.4).
- **Acceptance criteria:**
  - [ ] `tokens.css` defines every §13.1 token with the exact hex, and every §13.2, §13.3 and §13.5 token (including `--idle-ms: 1200` and `--placard-ms: 3000`). `--wall` and `--wall-deep` switch under `prefers-color-scheme: dark` (D9) and nothing else does.
  - [ ] `tokens.js` mirrors the colours with `rgb` and `Y`. A dev test parses `tokens.css` and asserts the hexes are equal. Computed Y matches §13.1 within 0.01.
  - [ ] **Contrast.** A dev test computes WCAG contrast: chip text ≥ 7:1 on `--chip-dark` composited over the darkest and brightest band and wall tokens (#23 at token level); ink on `--wall` ≈ 17.3:1, and 16.4:1 on the dark wall.
  - [ ] `copy.js` holds every §12.1 string verbatim, in British spelling, plus `COPY.colophon.credit` = the C7 credit string. `sceneLabel(3)` returns `'03 · Refraction'` and `sceneLabel(3, true)` returns `'03 Refraction'`.
  - [ ] `placardPhrase` implements the §7.5 table: half-open bands with the last one closed. A dev test checks every boundary and every midpoint for all six scenes. `placardLabel(4, 0.62)` returns `'04 · DICHROIC · HELD AT 62%'`. `admireAnnouncement` matches both §7.7 variants exactly.
  - [ ] `stillPlan(p)` gives base 0 on [0, .17], a crossfade 0 → .5 on (.17, .33), .5 on [.33, .67], .5 → 1 on (.67, .83) and 1 on [.83, 1]; `pShown` per C1. Tested at every boundary.
- **Verification:** `node --test 'tests/unit/dev/content/**/*.test.js'` output.
- **Quality notes:** #23, #39, §12.2 claim integrity (no claim string without its condition; the credit line is unconditional because the font file always ships), §12.3 voice.

### WO-004 — Shared render components (Bands, DotGrid, WhitePoint)
- **Role / discipline:** engineer / rendering
- **Depends on:** — (wave 0; consumes the C1 data shapes only)
- **Owns (exclusive write):** `site/js/components/**`, `dev/components/**`, `tests/e2e/dev/components/**`
- **Objective:** the DOM and SVG renderers for the geometry shared across seams (§21), so that two scenes drawing the same `BandRect[]` or `DotGridState` produce identical pixels.
- **Acceptance criteria:**
  - [ ] **`svg.js`.** `el(tag, attrs, parent)` creates SVG-namespaced or HTML elements; `setAttrs(node, attrs)` writes only changed values, comparing against the value **last written to that node** (a per-node cache that is invalidated when the node is recreated). A dev e2e proves that a value restored after a different intermediate value is written again.
  - [ ] **`bands-dom.js`.** `createBands(parent, { blend: 'normal'|'screen', idPrefix }) → { el, set(rects: BandRect[], vp, opacities?: number[]) }`.
    - It creates 7 divs once, coloured `var(--band-1…7)`, and sets only `transform` (translate plus scaleX on a unit box) and `opacity` per call.
    - The gallery shows no gap and no overlap at DPR 1, 1.5 and 2 (an e2e pixel scan along v = V/2: every column belongs to exactly one band colour, and no ground pixel shows).
  - [ ] **`dotgrid-svg.js`.** `createDotGrid(svg, { idPrefix }) → { set(dg: DotGridState, vp) }`.
    - Vertex dots are on a 2·pitch lattice through the centre; fill dots are the other pitch positions.
    - Each subset is drawn in an ink tone and a white tone as `<pattern>` fills (4 rects).
    - Pattern ids include `idPrefix`, so two instances coexist.
    - An e2e check proves a dot centre at exactly (U/2, V/2) and none at (U/2 + pitch/2, V/2).
  - [ ] **`white-point.js`.** `createWhitePoint(parent) → { set(wp: WhitePointState | null, ring: 'ink25'|'ink40'|'wallDeep') }`. Diameter ≤ 6 px, per §3.4.
  - [ ] `dev/components/index.html` shows each component at three states, and the dev e2e saves screenshots to `$EVIDENCE_DIR/dev/components/`.
  - [ ] No layout reads, which the static guard checks.
- **Verification:** `npx playwright test tests/e2e/dev/components` output plus the screenshot paths.
- **Quality notes:** #4, #41, and §13.4 (bands flat, no gradients).

### WO-005 — Spike: Scene 4 canvas cost at 1920 (D2)
- **Role / discipline:** engineer / performance
- **Depends on:** — (wave 0)
- **Owns (exclusive write):** `bureau/missions/M-0001-scroll-showcase/evidence/spikes/s4-canvas/**`
- **Objective:** measure, before anyone builds Scene 4, whether its specified canvas (a jittered triangle lattice of ≤ 950 facets, LUT colour, 0.5 px same-colour stroke, 1 px white edges, bands overlay) holds frame rate here, and pick the D2 fallback level with a written rule. The spike draws a representative canvas inline in its own page; it does not import `site/` code (which does not exist yet).
- **Acceptance criteria:**
  - [ ] **Runnable (E8).** The script is `spike.cjs` (CommonJS), loading Playwright with `require('playwright')`, which resolves to the global 1.63.0 through `NODE_PATH=/usr/local/lib/node_modules_global` (probe A10). It needs no `node_modules` in the dossier and does not wait for WO-001's `npm ci`. It asserts `require('playwright/package.json').version === '1.63.0'` and exits 1 otherwise.
  - [ ] It drives 120 rAF frames per configuration, with p and θ changing every frame, and records:
    - rAF-delta p50, p95 and the share of frames over 20 ms (the T-E5 harness);
    - **flushed draw ms (R8):** `performance.now()` around the draw calls **followed by `ctx.getImageData(0,0,1,1)`**, which forces the deferred rasterisation; the unflushed number is recorded alongside for comparison.
  - [ ] Configurations:
    1. 1920×1080 at device DPR 2, canvas capped at 1.5, lattice 72 px;
    2. the same at backing DPR 1;
    3. lattice 80 px (pitch +4);
    4. 1440×900 at DPR 1.5, lattice 64;
    5. 375×812 at DPR 2, lattice 48;
    6. configuration 1 with per-facet OKLCH conversion instead of the LUT (to quantify D2's LUT order).
  - [ ] `results.json` and `results.md` hold every number. A screenshot of each configuration is saved. `results.md` has a "What these numbers measure and do not" paragraph (headless shell, SwiftShader software raster, no compositor or GPU).
  - [ ] **Decision rule** (written in `results.md`): adopt the first configuration in D2 order (spec DPR caps → DPR 1.5 everywhere → pitch +4 → 30 Hz breathing) whose 1920 rAF p95 is ≤ 20 ms **and flushed draw p95 is ≤ 6 ms**. If none qualifies, file it as a BLOCKED request to the CEO with the numbers.
- **Verification:** from the repo root, `NODE_PATH=/usr/local/lib/node_modules_global node bureau/missions/M-0001-scroll-showcase/evidence/spikes/s4-canvas/spike.cjs`, with its output pasted in the report.
- **Quality notes:** SC8 (numbers in evidence), D2.

### WO-006 — Engine: frame loop, layout, layers and test hook
- **Role / discipline:** engineer / engine and performance
- **Depends on:** WO-001, WO-002, WO-003
- **Owns (exclusive write):** `site/js/engine/engine.js`, `site/js/engine/layers.js`, `site/js/engine/hook.js`, `site/js/main.js`, `tests/unit/dev/engine/**`, `tests/e2e/dev/engine/**`
- **Objective:** the single rAF read→compute→write loop (K2, C6) that turns `scrollY` into applied scene frames, owns layout and the pin, keeps the frame across resizes (F8), manages the main, reduced and fallback instances, and exposes `window.__showcase` (C5).
- **Acceptance criteria:**
  - [ ] **Loop.** One passive `scroll` listener. rAF runs only while dirty or while `ambient.active`. An idle page has 0 rAF callbacks over 2 s (proved by counting in the dev e2e). No layout reads inside the frame (code review plus the static guard on scenes).
  - [ ] **Layout.** It measures `#svh-probe` and builds `viewport()` and `trackLayout()`. It writes `--U`, `--V` and `--track-h` (= D + sh, px) and the anchor `top`s in px. `html[data-orient]` follows `vp.landscape`. The stage top is 0 for all y in [0, D] and the colophon starts rising at y = D. Tick anchors land at Y_s within 1 px at all five viewports.
  - [ ] **ResizeObserver guard.** CSS variables and anchor tops are written only when their value changed (compare before write), so the observer on `documentElement` cannot loop. The dev e2e resizes 10× and sees 0 `ResizeObserver loop` error events.
  - [ ] **Layers.** Exactly one `.art` is visible. Inactive sections are `inert`. Switching happens in the write phase of the frame that crosses a seam.
  - [ ] **Hook.** `window.__showcase` implements every C5 member. `snapshot()` and `stateAt()` return JSON-clean deep copies. `nextFrame()` forces a frame. `stateAt(y)` deep-equals the `snapshot()` taken after seeking to y (12 seeded y).
  - [ ] **Scroll origin and events.** `engine.scrollTo(y, origin)` calls `window.scrollTo({ top: y, behavior: 'instant' })` explicitly, so CSS `scroll-behavior: smooth` never animates a resize restore or a rewind step, and fires no `userscroll`. `on('frame' | 'scene' | 'layout' | 'userscroll' | 'error')` work per C4.
  - [ ] **Resize (F8).** `G_anchor` updates only on user scroll. Resizing 1440×900 → 375×812 → 1440×900 restores the identical `scrollY`, and the `snapshot()` is deep-equal.
  - [ ] **Hash robustness (R9).** Boot never passes `location.hash` to `querySelector`. Any hash lookup uses `getElementById` on a `decodeURIComponent` result inside `try`. The dev e2e loads `#%22%5D`, `#%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E`, `#1` and `#nope`: 0 `pageerror`, `errors` is `[]`, `scrollY` is 0.
  - [ ] **Reduced motion.** With `prefers-reduced-motion: reduce`, it mounts instances `a` and `b` and applies `stillPlan` (base at opacity 1, over at `overAlpha`). `snapshot().state` = `state(pShown)` and `snapshot().reduced` = the plan. `{state, reduced}` is deep-equal at p .36, .5 and .64 for every scene.
  - [ ] **Errors (F9, §8.3).** A throwing `apply` (proved with a dev-only test scene injected via the harness, never shipped) is caught, pushed once to `errors` as `{scene, phase:'apply', …}`, and that layer switches to its stills. There is no `console.error`, and the `'error'` event is emitted.
  - [ ] **Stats.** `frameStats()` reports engine ms per frame. `bootMs` is recorded.
  - [ ] **Wiring.** `main.js` keeps WO-001's C4 order with the real engine and the WO-001 factory stubs, and sets `data-boot=ready` after the first applied frame. Wave-2 WOs replace factory bodies only and never touch `main.js`.
- **Verification:** `npx playwright test tests/e2e/dev/engine` output, plus `npm run verify:quick`.
- **Quality notes:** #37, #38, SC2 foundations, §14 "scroll to frame on the next frame".

### WO-007 — PrismSVG, Scene 1 *Incidence* and the baked first frame
- **Role / discipline:** engineer / SVG motion
- **Depends on:** WO-001, WO-002, WO-003, WO-004
- **Owns (exclusive write):** `site/js/scenes/prism-svg.js`, `site/js/scenes/s1-incidence.js`, `site/css/scenes/s1.css`, `scripts/bake-static.mjs`, `site/index.html` (**only the region between `<!-- bake:s1:start -->` and `<!-- bake:s1:end -->`** and the Scene 1 title, plate, subtitle and cue markup; nothing else in wave 1), `tests/unit/dev/s1/**`, `tests/e2e/dev/s1/**`
- **Objective:** build Scene 1 exactly per §4 (wall with its gallery spot, prism, beam, glint, 7 wedges with the orientation-preserving straighten lerp, CMY title plates, cue), plus the reusable `PrismSVG` module whose `redraw` mode Scene 6 will drive, and bake `state(0)` into the HTML so the opening frame is art with no JS (§6, F15).
- **Acceptance criteria:**
  - [ ] `state(p, vp)` returns the §4 params (`rot spread split titleOpacity cueOpacity s prismOpacity prismShift`) and derived `wedges[7]` (4 vertices each, in uv px). `geom.bandRects` equals `bandRects(vp)` at p = 1, and `geom.otherOpacity` is 0 at p = 1.
  - [ ] **§15.2 Scene 1 row.** Every `state(0)` and `state(1)` assertion passes in a dev test, including each wedge's 4 vertices equal to the column rect corners at p = 1.
  - [ ] **Gallery spot (§4 S1 wall).** The wall is a static radial gradient centred on the prism centroid, `--wall` at 0% to `--wall-deep` at 120 vmin. A dev e2e pixel read at p 0 shows the prism-centroid wall pixel lighter than a corner wall pixel (ΔY ≥ 0.02), in both colour schemes.
  - [ ] **Hook (F10).** At 1440×900, y = 40 gives `spread ≥ 10.6°` (±0.05) and `split ≥ 3.1 px`. At 375×812 it gives +5.1° and 3.4 px. The far-edge height grows from 87 to 155 px (±2).
  - [ ] **Morph (#44).** For s ∈ {0, .1, …, 1}, adjacent wedges share edges and never overlap. Each quad's signed area keeps its sign. Tested.
  - [ ] **Plates (#2).** At p = 0 the plates are in register and `mix-blend-mode: multiply` gives R, G, B ≤ 3 at the glyph centre (dev e2e pixel read).
  - [ ] **PrismSVG** exports:
    - `prismGeometry(vp)` (centroid and side per §4 and §11.1, side capped at 400 px at 1920);
    - `prismMarkup(vp, idPrefix)` (a static string);
    - `createPrism(svg, mode: 'incidence'|'redraw')`, with `.set({...})` covering rotation, opacity, shift, `draw` (dashoffset), `glass`, `beam`, `card` (fan 0 → 6°) and glint.
    - Fringe lines use `vector-effect: non-scaling-stroke` (#29).
  - [ ] **Bake.** `npm run bake` writes landscape (1440×900) and portrait (375×812) static SVGs between the markers, toggled by `@media (orientation: portrait)`. A dev unit test fails if `index.html`'s region differs from a fresh bake. `mount()` adopts the baked nodes when present and drops the inactive orientation.
  - [ ] **Breathing (§7.8).** Fan spread ±1.5° and a glint slide of ±6% of the face, with an 8 s period, scaled by `amb.a`. `amb.a = 0` reproduces `state` exactly.
  - [ ] **Evidence.** Harness screenshots at p 0, .25, .5, .75 and 1 at 1440×900 and 375×812 go to `$EVIDENCE_DIR/dev/s1/`.
- **Verification:** dev unit and e2e output, plus the screenshot paths. `npm run bake && git diff --stat site/index.html` shows only the bake region changed.
- **Quality notes:** #1, #2, #29, #40, #44, #41 (glint as the white point), the §2 originality guard (the prism only on the pale wall).

### WO-008 — Scene 2 *Field*
- **Role / discipline:** engineer / DOM motion
- **Depends on:** WO-001, WO-002, WO-003, WO-004
- **Owns (exclusive write):** `site/js/scenes/s2-field.js`, `site/css/scenes/s2.css`, `tests/unit/dev/s2/**`, `tests/e2e/dev/s2/**`
- **Objective:** Scene 2 per §4. The width accordion uses the dominance cursor `c(p)`, there is a group shear with 140% overscan, tone-on-tone dot tones in vertex and fill subsets, and the centre white point. It ends on cobalt with a white dot grid, identical to Scene 3's ground.
- **Acceptance criteria:**
  - [ ] `params` are `A c shear vertexInk fillInk white whitePoint fade`, plus derived `widths[7]` (fractions of U) and `geom` (`bandRects` from `bandRectsFromWeights`, `dotGrid`, `whitePoint`).
  - [ ] **§15.2 Scene 2 row.** At p 0 the widths are all 1/7. At p 1 they are `[0,0,0,0,0,1,0]`, shear is 0, white .55, and `whitePoint {u: U/2, v: V/2, r: 3, alpha: 1}`.
  - [ ] **Cursor schedule.** 5 steps of 0.168 from p .05 to .89; plateau creep +0.06; phrase boundaries .161, .329, .497, .665 and .833 are where c crosses k + .5. Dev-tested.
  - [ ] **Overscan (#5).** The sheared group overscans so no ground shows at any p at the five viewports. Dev e2e pixel scan of the four stage edges at 21 p values.
  - [ ] **Breathing.** Dominant width ±2.5% (10 s) and shear ±0.8° (13 s), scaled by `amb.a`.
  - [ ] **Evidence.** Harness screenshots at p 0, .25, .5, .75 and 1 and at the hold band (.722, .75, .781), at 1440×900 and 375×812.
- **Verification:** dev unit and e2e output, plus the screenshot paths.
- **Quality notes:** #4, #5, #43 (hold "Azure room" with creep +0.06), §10.1 rules 2–4 (luminance hill, red share ≤ 63%).

### WO-009 — Scene 3 *Refraction*
- **Role / discipline:** engineer / SVG rendering
- **Depends on:** WO-001, WO-002, WO-003, WO-004
- **Owns (exclusive write):** `site/js/scenes/s3-refraction.js`, `site/css/scenes/s3.css`, `tests/unit/dev/s3/**`, `tests/e2e/dev/s3/**`
- **Objective:** Scene 3 per §4 and D3. Three glass shapes (triangle, circle, diamond) travel over the shared dot grid. Each clips three channel copies of an inner dot pattern (r 2.75, 100%), tinted `--ch-r`, `--ch-g` and `--ch-b`, `screen`-blended and scaled 1.25, 1.40 and 1.55 about the shape centre. Each copy's rect is sized to the shape's bounding box. Double refraction is optional (cut item 1).
- **Acceptance criteria:**
  - [ ] `params` are `tri cir dia triRot diaRot` (% of U and degrees), per the §4 keyframes, including overshoots ≤ 1.5% U. `geom.shelf` at p 1 equals `shelf(vp)`. `geom.channelScales` is `[1.25, 1.4, 1.55]` and `glassAlpha` is 1. `geom.dotGrid` equals Scene 2's p 1 grid.
  - [ ] **§15.2 Scene 3 row** passes in a dev test.
  - [ ] **Dispersion (#6).** At p 1 at 1440×900, the pixel at each shape centre is white (each channel ≥ 245). Along the circle's horizontal radius, the outermost triplet shows three distinct R, G and B peaks ≥ 6 px apart (dev e2e pixel profile saved as JSON).
  - [ ] **Edges (#7).** The `--glass-edge` 1.5 px stroke covers the clip boundary. A DPR 2 screenshot is saved for the critic.
  - [ ] **Instances.** All SVG ids carry `scene3-<instance>-`, so the a and b instances coexist.
  - [ ] **Breathing.** Shapes bob ±6 px along v (7 s, phases 0, .33 and .66); channel scales ±0.01 (9 s).
  - [ ] **Cost.** In the harness, `apply` takes ≤ 3 ms p95 at 1440 over 120 frames. The numbers are recorded in the report.
  - [ ] **Evidence.** Harness screenshots at p 0, .25, .5, .75 and 1 and at the hold band, at 1440×900 and 375×812.
- **Verification:** dev unit and e2e output, the pixel profile JSON, and the screenshot paths.
- **Quality notes:** #6, #7, #41 (the centre dot stays white on the optical axis), #43, §10.1 rule 5 (dots, never stripes).

### WO-010 — Scene 4 *Dichroic* (canvas core)
- **Role / discipline:** engineer / canvas and performance
- **Depends on:** WO-001, WO-002, WO-003, WO-004, **WO-005 (decision filed)**
- **Owns (exclusive write):** `site/js/scenes/s4-dichroic.js`, `site/js/scenes/s4-lut.js`, `site/css/scenes/s4.css`, `tests/unit/dev/s4/**`, `tests/e2e/dev/s4/**`
- **Objective:** Scene 4 per §4 and D2, at the configuration WO-005 chose. One full-stage canvas draws:
  - the Scene 3 shelf and dots at the start;
  - the lattice built from the vertex dots, with seeded jitter and normals;
  - the moving light θ through the 256-entry OKLCH LUT;
  - edge alpha, then quantisation to the band tokens, then the exact `Bands` overlay at p 1;
  - the white point as the light source.
- **Acceptance criteria:**
  - [ ] `params` are `J theta facetAlpha edgeAlpha quant bandsAlpha glassAlpha fillDots vertexDots rho wpAlpha`. `geom.bandRects` at p 1 equals `bandRects(vp)` with `bandsAlpha` 1. `geom.shelf`, `dotGrid` and `glassAlpha` at p 0 equal Scene 3 at p 1.
  - [ ] **§15.2 Scene 4 row** passes.
  - [ ] **Lattice.** Vertices are the vertex dots (lattice = 2·pitch). The facet count is ≤ 950 at every viewport. Jitter and normals come from `mulberry32(SEED)` in a fixed order.
  - [ ] **LUT (U-7).** `s4-lut.js` exports `buildLUT()`: 256 entries of `[r,g,b]`, every hue in [165°, 345°]. It is built once, never per frame.
  - [ ] **Canvas.** The backing DPR is `min(dpr, vw ≥ 1440 ? 1.5 : 2)`, or WO-005's override, and the backing is ≤ 4.67 Mpx. Portrait uses `ctx.setTransform` with the K5 transpose. It redraws only when p or `amb` changes and Scene 4 is active.
  - [ ] **Determinism (#9).** Two page loads at the same p and DPR give byte-identical `getImageData` (a dev e2e compares hashes).
  - [ ] **Facet edges (#8).** A 0.5 px same-colour stroke; no background pixels between facets at p .5 (dev pixel scan of a 200×200 region).
  - [ ] **Hooks for WO-022.** `s4-dichroic.js` calls `s4-fallback.js` on `getContext` failure or `contextlost`, and calls `s4-contact.js` under reduced motion. Their stubs from WO-001 stay no-ops.
  - [ ] **Breathing.** θ ±6° (12 s), with no facet's hue moving > 12°. At the WO-005 fallback level 3, breathing renders at ≤ 30 Hz.
  - [ ] **Cost.** Flushed draw p95 (draw + `getImageData(0,0,1,1)`) in the harness is recorded at 1440 and 1920, within the WO-005 rule.
  - [ ] **Evidence.** Harness screenshots at p 0, .25, .5, .75 and 1 and at the hold band, at 1440×900, 375×812 and 1920×1080 (the hero frame at p .5).
- **Verification:** dev unit and e2e output, the hash comparison, the timing table, and the screenshot paths.
- **Quality notes:** #4 (bands overlay snapped), #8, #9, #41 (light source ≤ 6 px), #43, §14 grin moment 5. Slip policy rule 3 applies.

### WO-011 — Scene 5 *Agreement*
- **Role / discipline:** engineer / DOM motion
- **Depends on:** WO-001, WO-002, WO-003, WO-004
- **Owns (exclusive write):** `site/js/scenes/s5-agreement.js`, `site/css/scenes/s5.css`, `tests/unit/dev/s5/**`, `tests/e2e/dev/s5/**`
- **Objective:** Scene 5 per §4. Seven `screen`-blended band divs on ink narrow into beams (`n`), converge with overshoot (`τ`), take hairlines during the colonnade, and are finished by a white overlay (`ov`), so p 1 is exact white.
- **Acceptance criteria:**
  - [ ] `params` are `n tau hair ov`, plus derived `beams[7]` (`centreU`, `width`). `geom.bandRects` at p 0 equals `bandRects(vp)`. `geom.beamRect` at p 1 is `{centreU: U/2, width: beamW, v0: 0, v1: V, color: '#FFFFFF'}` with ground `ink`.
  - [ ] **§15.2 Scene 5 row** passes (beamW 129.6 at 1440, which the spec rounds to 130).
  - [ ] **Overshoot.** At max τ (1.074) the outermost beams pass the centre by 0.35 beam widths; jade (i = 3) never moves. Dev-tested.
  - [ ] **Exact white (#10).** At p 1, every pixel inside the beam rect **inset by one device pixel on each side** is `#FFFFFF` at DPR 1 and 2 (dev e2e scan). The inset absorbs the fractional `beamW` edge (129.6 px); the edge columns are reported, not gated.
  - [ ] **Breathing.** ±4 px sway, alternating direction (9 s); ±1 px edge breathing at p 1.
  - [ ] **Evidence.** Harness screenshots at p 0, .25, .325 (hold), .5, .75 and 1, at 1440×900 and 375×812, plus the 1920 hero at p .5.
- **Verification:** dev unit and e2e output, plus the screenshot paths.
- **Quality notes:** #10, #43, §14 "the click of agreement".

### WO-012 — Test engineering: unit spec suite and static guards
- **Role / discipline:** test-engineer / unit and spec
- **Depends on:** WO-001, WO-002, WO-003 (contracts only; written from the spec, not from scene code)
- **Owns (exclusive write):** `tests/unit/spec/**`, `tests/static/**`; custodian of `tests/unit/dev/{core,content}/**`
- **Objective:** a legible unit suite that states what "correct animation" means for *Bent Light* in pure functions, plus the mechanical guards that keep the build honest.
- **Acceptance criteria:**
  - [ ] Files are named by contract (these 16 names are the `UNIT_SPEC_FILES` list in `verify.mjs`): `eases.test.js` (U-1), `keys.test.js` (U-2), `endpoints.test.js` (U-3, the whole §15.2 table, all six scenes), `hold-bands.test.js` (U-4 and E-H0: §3.3 rules 1–4, Δp = 1/4000, five viewports), `field-cursor.test.js` (U-5), `placard-phrases.test.js` (U-6, boundaries and midpoints, plus reduced `pShown`), `lut.test.js` (U-7), `seed.test.js` (U-8), `seams.test.js` (the pure §5.2 gate for all five seams at five viewports × DPR 1, 1.5 and 2), `purity.test.js` (100 seeded p, each called twice, deep-equal; `meta` = `SCENES`), `geometry.test.js` (tick G, lattice invariant, centre dot, band sums), `wedges.test.js` (#44), `white-point.test.js` (#41: at most one non-null white point per scene state, r ≤ 3), `still-plan.test.js`, `budgets.test.js` (S4 facet count ≤ 950, backing ≤ 4.67 Mpx), `assets.test.js` (font sha256 and `OFL.txt` sha256 against the values in `SOURCE.md`, and `OFL.txt` byte-identical to the recorded hash).
  - [ ] Every test title starts with its id(s) and reads as a sentence about the piece, e.g. `"[#10] Scene 5 ends on one exact white beam, beamW wide, centred"`.
  - [ ] `tests/static/check-static.mjs` implements guards 1–13 (architecture → Verification strategy), including:
    - guard 5 **scoped to `site/**/*.{html,css,js,svg}`**, so `site/fonts/OFL.txt` and `SOURCE.md` are out of scope and the licence is never edited to satisfy a guard (R7);
    - guard 9: no `test.skip`, `test.fixme`, `test.fail`, `describe.skip`, `test.describe.skip`, `.only(`, `it.skip`, `{ skip:` or `{ todo:` anywhere in `tests/` (R5a);
    - guard 10: `axe.spec.js` has no `disableRules` or `.exclude(` unless the rule or selector is listed in `tests/e2e/health/axe-exceptions.json` with a non-empty `reason` (R5d);
    - guard 13: `site/js/**` never passes `location.hash` to `querySelector` or `querySelectorAll` (R9).
  - [ ] Each violation prints `path:line rule`. It exits non-zero on any violation (prove this with a temporary fixture per guard outside `site/`, including a `test.skip` fixture and an `http://` string in a `.txt` file that must **not** trip guard 5).
  - [ ] Against the wave-0 stubs, the suite runs and fails **only** for missing features, never because of a crash in the test itself (attach the run log with its failure list). As scene WOs land, results are reported to the CEO.
- **Verification:** `node --test 'tests/unit/spec/**/*.test.js'` and `node tests/static/check-static.mjs` output, plus the fixture proofs.
- **Quality notes:** #3 (pure gate), #11, #39, #41, #43, #44. Exceptional #7 (legibility).

### WO-013 — Test engineering: e2e infrastructure, animation contracts and verify floors
- **Role / discipline:** test-engineer / e2e
- **Depends on:** WO-001 (written from the spec; runs against features as they land). Closes no earlier than the first of WO-007…WO-011 (the mutation proof needs one real `apply`).
- **Owns (exclusive write):** `tests/e2e/helpers/**`, `tests/e2e/contracts/**`, `tests/e2e/smoke.spec.js`, `tests/perf/**`, `playwright.config.js`, `scripts/verify.mjs`; custodian of `tests/e2e/dev/components/**` and `tests/unit/dev/serve/**`
- **Objective:** the shared e2e helpers, the contract specs that prove determinism, reversibility, endpoints, seams, the hook and the pin **on rendered output**, and the real verify orchestrator with floors that cannot pass vacuously.
- **Acceptance criteria:**
  - [ ] **Helpers:**
    - `seek(page, y)` (instant scroll then `nextFrame()`, with a 2-rAF fallback);
    - `ready(page)` (`__showcase.ready` plus `document.fonts.ready`);
    - `shot(page, name)` (writes into `EVIDENCE_DIR`);
    - `pixels.js` (pngjs): `diff(a, b, {threshold: 8})` returning share and a diff PNG; `meanY64x40`; **`windowY64x40(png)`** returning Ȳ for the 9 overlapping 2×2-tile windows of a 4×4 tiling (each window = 25% of the viewport; R2); `redShare`; `pixelAt`;
    - `fingerprint.js`: `frameHash(page, {mask})` = sha256 of the **decoded RGBA** of a viewport screenshot (`animations: 'disabled'` is not used; `caret: 'hide'`), and `canvasHash(page, selector)` = sha256 of `getImageData` over the full backing;
    - `admireClock.js`, which proves and documents the timing semantics (E5, R4). Its header comment quotes the probe output for: rAF frozen while paused; `setTimeout` advanced by `runFor`; **CSS transitions not advanced by `runFor` while paused** (board probe: opacity stays 1 after `runFor(450)`). It exports `seekTransitions(page, selector, property, ms)`, which pauses every matching `CSSTransition` from `document.getAnimations()` and sets `currentTime`, and `transitionTiming(page, selector, property)` returning `{duration, delay, easing}` from `effect.getComputedTiming()`. The probe that `currentTime` seeking gives `{0:1, 200:1, 650:0.5, 1100:0}` for a 900 ms / 200 ms-delay linear fade is re-run and its output pasted in the report;
    - `svgPlot.js`, for dependency-free line plots.
  - [ ] **Config.** `playwright.config.js` keeps WO-001's projects, with `e2e` workers 2 and `perf` `testMatch: '**/*.perf.js'` workers 1, `retries: 0`, `webServer` on `PORT` (default 4173) with `reuseExistingServer: !process.env.CI`, default viewport 1440×900 and DPR 1. **Proof (E4):** the report pastes `npx playwright test --list --project=e2e` and `--project=perf`, both listing ≥ 1 test.
  - [ ] **Determinism and reversibility (E6, R3).** `contracts/determinism.spec.js`, with breathing stored off:
    - **E-D1:** 12 seeded y, visiting 4 others between. Each return compares `stateAt(y)` **and** `frameHash` (0 differing pixels; any non-zero tolerance must be stated and justified in the test and logged in `log.md`). At least one of the 12 y lies in each scene. In Scene 4 it also compares `canvasHash`.
    - **E-D2:** capture `frameHash` (and `canvasHash` in Scene 4), then let **≥ 2,000 ms of real time** pass while a page-side rAF counter confirms ≥ 60 frames ran (rAF free-running, no `page.clock`, no `waitForTimeout`), then capture again; both equal, and `snapshot()` equal. Run at one position per scene.
    - **E-D3:** 30 positions down then up; `snapshot()` and `frameHash` at each position equal the first pass, at ≥ 1 position per scene.
  - [ ] **Mutation proof (R3).** Against a temporary copy of `site/` served with `SITE_DIR` and a spare `PORT`, injecting `transition: transform 300ms` on the landed scene's moving elements turns E-D1 **and** E-D2 red, and reverting turns them green. Both outputs are pasted in the report. (WO-023 makes this mechanical as mutant (f).)
  - [ ] **Seams.** `contracts/seams.spec.js` covers E-S1…S5:
    - the in-page state gate via `sceneState(N, 1)` and `sceneState(N+1, 0)`, per §5.2;
    - the pixel tolerance (≤ 0.5% of pixels > 8/255) between y = Y_{N+1} − 1 and y = Y_{N+1}, at 1440×900 and 375×812, DPR 1 and 2;
    - diffs saved to `evidence/seams/`.
  - [ ] **Endpoints and pixel facts.** `contracts/endpoints.spec.js` covers the §15.2 global row (G, label, tick `aria-current`, stage top, colophon at D on `--wall`) and the pixel facts: title black (#2), Scene 5 white in the beam rect inset by one device pixel (#10), Scene 4 byte-identical across two loads (#9, `canvasHash`), Scene 3 dispersion (#6), Scene 2 no ground (#5, 5 viewports × 21 p).
  - [ ] **Hook (E-K1).** `contracts/hook.spec.js`: a 40 px wheel from y = 0 gives spread ≥ 10° and split ≥ 3 px, and the screenshot differs on ≥ 1.0% of pixels at > 24/255, at 1440×900 and 375×812. It also checks the C5 shape, that `snapshot().y === scrollY` after `nextFrame()`, and that `stateAt(y)` deep-equals the `snapshot()` after seeking to y at 12 seeded y.
  - [ ] **Resize and pin.** `contracts/resize.spec.js` covers E-R2 (#37). `contracts/pin.spec.js` checks that `#stage` is sticky with top 0 at 9 positions including D, at all five viewports.
  - [ ] **Perf placeholder.** `tests/perf/boot.perf.js` records `bootMs` at 1440×900 and fails only over the 1,000 ms guard, so the perf floor (≥ 1) is real from phase 1.
  - [ ] **Orchestrator (E4, R5b, K18).** `scripts/verify.mjs` is set to **`VERIFY_PHASE = 1`**. It:
    - runs all steps and keeps going after a failure;
    - runs unit tests with `--test-reporter=tap` and Playwright with `--reporter=json` (plus list to the console) and parses counts per file and per id;
    - fails the unit step if any `UNIT_SPEC_FILES` entry is missing or contributes 0 tests, or if `tests/unit/dev` contributes 0;
    - fails the e2e step if fewer than **34** tests carry a §15.3/E-F5 E-id (33 e2e ids in §15.3 plus E-F5; E-H0 is unit-level), and the perf step if it ran 0 tests;
    - fails any step that reports a skipped, todo or fixme test (`stats.skipped > 0`, TAP `# skip`/`# todo` > 0);
    - never passes `--pass-with-no-tests`;
    - carries a `MANIFEST` of every E-id, U-id, `#1`–`#45` and `§19.1`–`§19.14` with its suite and owning WO; the summary lists each id as pass, fail or missing (missing is reported, and becomes fatal at phase 2, set by WO-023).
    - Proof: the report shows verify failing on a deliberately emptied copy of `tests/unit/spec` (in a temp checkout) and on a temporary `test.skip` (guard 9 and the skip count both fire).
- **Verification:** `npx playwright test tests/e2e/contracts --reporter=list` output (expected red until scenes land; report which cases are red and why), the clock and seek probe outputs, the mutation proof, and the `--list` outputs.
- **Quality notes:** #2, #3, #5, #6, #9, #10, #37, #40, #41. SC2, SC3, SC9 (seam diffs).

### WO-014 — Integration 1: Scenes 1–5 assembled, seams closed, D1 decided
- **Role / discipline:** integrator / frontend
- **Depends on:** WO-006 … WO-013
- **Owns (exclusive write):**
  - `site/index.html`, `site/css/base.css`, `site/js/main.js`, `scripts/bake-static.mjs`
  - `site/js/engine/{engine,layers,hook}.js`
  - `site/js/core/{math,geometry,tokens,copy,phrases,reduced,env,announce}.js`, `site/js/components/**`
  - `site/js/scenes/{index,prism-svg,s1-incidence,s2-field,s3-refraction,s4-dichroic,s4-lut,s5-agreement}.js`, `site/css/scenes/s{1..5}.css`
  - `tests/unit/dev/{core,content,engine,s1,s2,s3,s4,s5}/**`, `tests/e2e/dev/{components,engine,s1,s2,s3,s4,s5}/**`
- **Objective:** join wave 1 into one piece. Make seams 1→2 through 4→5 pass the state gate and the pixel tolerance at both DPRs. Spend **one** fix round, then apply the D1 crossfade (§5.3) to 1→2 and/or 4→5 if they still fail. Fix the defects the spec suites expose in Scenes 1–5 and the engine.
- **Acceptance criteria:**
  - [ ] `tests/unit/spec/seams.test.js` is green for seams 1–4.
  - [ ] `tests/e2e/contracts/seams.spec.js` E-S1…E-S4 are green, with diffs in `evidence/seams/`.
  - [ ] **D1.** If the D1 crossfade is used, the report records the failing numbers from both DPRs before and after the fix round, and the state gate still binds.
  - [ ] Every WO-012 unit test for Scenes 1–5 is green, and so are the WO-013 contracts E-D1–D3 (rendered fingerprints included), E-K1, E-R2, pin and endpoints for Scenes 1–5.
  - [ ] **20 random stops.** At seeded positions across Scenes 1–5 at 1440×900, screenshots go to `evidence/integration-1/random/`. The report lists any frame the integrator judges uncomposed, with a fix or a REQUEST. (The designer's judgement is WO-027.)
  - [ ] **Size and breathing.** `npm run check:size` is green. Breathing is visually verified in each scene by two harness frames 3 s apart (amb.a = 1) whose paths are listed.
  - [ ] **Change log, incremental.** Changes to other WOs' modules are appended to the report as they are made (not at the end), each with the reason and the original owner.
- **Verification:** the `npm run verify` summary table (Scene 6, admire and chrome cases may be red in this wave, and each is listed), plus the seam diff paths.
- **Quality notes:** #3, #4, #11 (prism parity with WO-015), #43. The §19 seam pairs.

### WO-015 — Scene 6 *Return* and the 5→6 seam
- **Role / discipline:** engineer / SVG motion
- **Depends on:** WO-007 (PrismSVG), WO-011 (Scene 5 end state)
- **Owns (exclusive write):** `site/js/scenes/s6-return.js`, `site/css/scenes/s6.css`, `tests/unit/dev/s6/**`, `tests/e2e/dev/s6/**`
- **Objective:** Scene 6 per §4. The white beam widens into the wall (`widen`, `mix`, `spot`), the designed empty-wall rest follows, and `PrismSVG` in `redraw` mode draws the prism back in line, then glass, beam and card, ending on a rhyme of Scene 1 p 0 without the title.
- **Acceptance criteria:**
  - [ ] `params` are `widen mix spot draw beam glass card`. `geom.beamRect` at p 0 equals Scene 5 at p 1, with ground `ink`.
  - [ ] **§15.2 Scene 6 row** passes, including PrismSVG geometry within 1 px of Scene 1 `state(0)` (#11).
  - [ ] **Rest.** The hold band [.40, .52] is static (worst in-band rate 0) and lasts ≤ 22 svh.
  - [ ] **Rhyme (#11).** At 1440×900 and 375×812, a pixel diff of Scene 6 p 1 against Scene 1 p 0, with the title and cue boxes masked, is ≤ 0.5%.
  - [ ] **5→6 seam.** The state gate and pixel tolerance pass at both DPRs (E-S5).
  - [ ] **Colophon wall (#30).** The colophon background is identical to the Scene 6 p 1 wall in both colour schemes (pixel read across the unpin line).
  - [ ] **Breathing.** As Scene 1 wherever the prism is present; the empty wall breathes its spotlight radius ±3% (11 s).
  - [ ] **Evidence.** Harness screenshots at p 0, .25, .46 (hold), .75 and 1, at 1440×900 and 375×812.
- **Verification:** dev unit and e2e output, plus the E-S5 result.
- **Quality notes:** #11, #30, #43 (the only static band), §3.2 (stage releases at exactly y = D).

### WO-016 — Admire mode, breathing control and announcements
- **Role / discipline:** engineer / interaction and a11y
- **Depends on:** WO-006, WO-003
- **Owns (exclusive write):** `site/js/engine/admire.js`, `site/js/engine/ambient.js`, `tests/unit/dev/admire/**`, `tests/e2e/dev/admire/**`
- **Objective:** the stillness reward, per §7. The idle timer is armed by the first user scroll and blocked per §7.2. Entry and exit timing follows §7.3–7.6, including the synchronous restore, keeping the default action, and the pause-control guard. The ambient amplitude ramps and decays, the pause persists, and announcements are de-duplicated (F7). The bodies replace WO-001's `createAmbient` and `createAdmire` stubs; `main.js` is not touched.
- **Acceptance criteria:**
  - [ ] **Ambient.** It implements `AmbientCtl` per C4: ramp 1,600 ms easeInOutSine, decay 240 ms easeOutCubic, `disabled` under reduced motion (a ≡ 0), and `bentlight.breathing` persisted through `safeStorage` with a default of on. Amplitude is a pure function of the `now` it is given (rAF timestamp), so `page.clock` drives it.
  - [ ] **Admire.** It implements `AdmireCtl`:
    - **Arming.** Only a user `wheel`, `touchmove`, scroll key or user scrollbar scroll arms it. `userscroll` events count; engine scrolls (resize, rewind) do not.
    - **Reset list.** The §7.1 inputs reset the timer, with `pointermove` counting only after ≥ 4 px of cumulative travel.
    - **Blocks.** Hiding-chrome focus or hover, `rewind.active`, `document.hidden`, and `scrollY > D`.
  - [ ] **Entry at `--idle-ms` (1,200 ms).** It reads the token once at boot, sets `html[data-admire=on]` and calls `ambient.start`. The live-region text equals `admireAnnouncement(...)` only when the `scene|phraseBand` key changed since the last announcement.
  - [ ] **Placard at `--placard-ms` (3,000 ms).** It sets `html[data-placard=on]`, a `setTimeout` from the last input.
  - [ ] **Exit.**
    - Inside the event handler, before returning, it sets `data-admire=off` and `data-placard=off` and restores chrome visibility (an inline style removal that chrome CSS honours), so `checkVisibility()` is true in the same task.
    - It never calls `preventDefault`.
    - The `isOnPauseControl` guard: click, Enter or Space on `#pause` toggles and does not exit; Tab or Shift+Tab on it exits.
    - The live region stays silent on exit.
  - [ ] **Resize** exits admire mode and keeps the pause state.
  - [ ] **Dev e2e.** Timers and attributes are checked under `page.clock` (`install → goto → pauseAt → runFor`); nothing reads computed opacity at a paused-clock step. Each of the following is listed with its result:
    - the 1,200 ms entry;
    - the 3,000 ms placard;
    - exits on wheel, key, pointerdown, touchstart and pointermove ≥ 4 px, but not on < 4 px;
    - Space exits and scrollY increases;
    - Tab lands on a visible element;
    - the pause guard;
    - the colophon block;
    - the rewind block (via a stubbed `rewind.active`);
    - de-duplication.
- **Verification:** dev unit and e2e output.
- **Quality notes:** #16, #17, #18, #19, #20, #27, #31, #33, #34, #35, #36. SC4.

### WO-017 — Chrome: rail, ticks, label, captions, placard, pause control, chips
- **Role / discipline:** engineer / UI and design-system
- **Depends on:** WO-006, WO-003; reads WO-016's `AdmireCtl` and `AmbientCtl` per the C4 contract
- **Owns (exclusive write):** `site/js/chrome/chrome.js`, `site/js/chrome/font-claim.js`, `site/css/chrome.css`, `tests/unit/dev/chrome/**`, `tests/e2e/dev/chrome/**`
- **Objective:** every chrome element in §8 in every state (default, hover, focus-visible, active, current, past and future, admire, reduced, rewind, error), driven from the engine's `frame` events with writes only, on chips that guarantee ≥ 7:1 contrast. The body replaces WO-001's `createChrome` stub; `main.js` is not touched.
- **Acceptance criteria:**
  - [ ] **Rail.** It is vertical at ≥ 1024 (28 px inset, length `clamp(330px, 44svh, 560px)`) and horizontal below. The fill is `scaleY`/`scaleX` = G with the band-order gradient. The leading white point (6 px) reaches each tick exactly at that scene's p 0 (#13).
  - [ ] **Ticks.** 44 × 44 hit boxes at every pointer type with no overlap (#42). Current, past and future marks and key colours per §8 (#14), with `aria-current` updated as seams are crossed. Hover and focus labels flip side below 1024 and never clip (#15). Activation uses native anchors. Focus stays on the tick.
  - [ ] **Scene label.** Tabular figures, a 200 ms cross-fade at seams, the short form below 768, and it never moves the wordmark (#12; measured `getBoundingClientRect` of the wordmark is constant across all six labels, in the dev e2e only).
  - [ ] **Captions (#22).** Scroll-driven cross-fade over the last 3% and first 3% of tracks; never two captions both above 50%.
  - [ ] **Placard (#31, #32).** On `data-placard=on`, chrome fills the placard from `engine.snapshot()` (`placardLabel` plus `placardPhrase` with `pShown` under reduced motion). The hand-off is declared as CSS transitions whose **computed timing** is: caption `opacity` 1 → 0, duration 360 ms, delay 0; placard `opacity` 0 → 1, duration 900 ms, delay 200 ms. The exit is placard 120 ms and caption 160 ms. The dev e2e reads these with `transitionTiming` and checks the corner is never empty by `seekTransitions` at 10 ms steps over [0, 1,100] ms (E5).
  - [ ] **Admire CSS.** The wordmark, label, rail and ticks fade over 600 ms (computed `transition-duration`), then get `visibility: hidden`. Pause dims to 0.55 (1.0 on hover or focus). Under reduced motion the fades are 200 ms.
  - [ ] **Pause control (#20, #21, #35).** Every §8 state, wired to `ambient.setPaused` with an announcement. Under reduced motion it has `aria-disabled="true"`, the dashed outline and the explanatory label, stays focusable, and activation does nothing.
  - [ ] **Other chrome.** The chip theme switches light or dark per scene (light in Scene 1 and in Scene 6 from p .40) with a 240 ms cross-fade. The skip-link focus state is as specified. The error chip shows on the engine `error` event. The rewind status shows in the label slot. Any hash handling follows WO-006's rule (no `querySelector(location.hash)`).
  - [ ] **Font claim (F12).** `font-claim.js` swaps colophon p2 to the Space Grotesk string only after `document.fonts.load('700 1em "Space Grotesk"')` resolves and `document.fonts.check` is true, and sets `html[data-font=loaded]`. The `colophon-credit` line is never touched.
  - [ ] **Evidence.** Dev e2e screenshots of every chrome state listed in §19 ("Chrome states").
- **Verification:** dev e2e output, plus the screenshot paths.
- **Quality notes:** #12, #13, #14, #15, #20, #21, #22, #23, #24, #25, #31, #32, #35, #41 (rail dot), #42.

### WO-018 — Rewind and colophon controls
- **Role / discipline:** engineer / interaction
- **Depends on:** WO-006, WO-003
- **Owns (exclusive write):** `site/js/engine/rewind.js`, `site/css/colophon.css`, `tests/unit/dev/rewind/**`, `tests/e2e/dev/rewind/**`
- **Objective:** "Run it backwards" (§8.1): a rAF-driven 8 s easeInOutSine `engine.scrollTo(…, 'rewind')` to 0, cancelled on the same frame by wheel, keydown, pointerdown, touchstart or touchmove. Also "Jump to the first beam", the reduced-motion rename, and the colophon layout (§12, §13.2 `--type-colophon`), including the credit line. The body replaces WO-001's `createRewind` stub; `main.js` is not touched.
- **Acceptance criteria:**
  - [ ] **Completion.** It reaches y = 0, moves focus to `#wordmark` and announces "Back at the first beam.". The duration is 8,000 ms (±1 frame) under `page.clock` with `runFor` (fake rAF).
  - [ ] **Cancellation (#26).** It is cancelled within the same frame by each listed input, holds position, and announces "Rewind stopped. You're in {NN} {Scene}." with the correct scene.
  - [ ] **During a rewind (#27).** `html[data-rewind=on]` is set and the chrome stays visible (`rewind.active` is true for admire).
  - [ ] **Reduced motion.** `#rewind` reads "Jump to the first beam" and jumps instantly. `#jump` is hidden. Colophon p3 shows the reduced-motion string.
  - [ ] **Colophon.** `--wall` ground, 70 svh, ink text at 18/1.55, max 52ch; the `colophon-credit` line at `--type-colophon` small size, ≥ 4.5:1 on `--wall`. At 375 there is no overflow at 200% zoom.
- **Verification:** dev e2e output.
- **Quality notes:** #26, #27, #30 (colophon ground), §14 grin moment 8.

### WO-019 — Test engineering: behaviour (admire, chrome, ticks, keyboard, rewind, reduced motion) and contracts custody
- **Role / discipline:** test-engineer / e2e behaviour
- **Depends on:** WO-013 (helpers). Written from §7–§10 and §15, independently of WO-016 to WO-018.
- **Owns (exclusive write):** `tests/e2e/behaviour/**`, `tests/e2e/contracts/**`, `tests/e2e/helpers/**` (additive only), `tests/e2e/smoke.spec.js`
- **Objective:** prove the stillness reward and the chrome behave exactly as specified, with JS timers under `page.clock` and CSS fades by seeking (K11), and keep the WO-013 contracts and helpers green-able through wave 2.
- **Acceptance criteria:**
  - [ ] **Clock citation (R4).** `admire.spec.js` and `breathing.spec.js` each open with a comment quoting WO-013's probe result ("CSS transitions are not advanced by `page.clock.runFor` while paused; fades are read by seeking `CSSTransition.currentTime`") with the report path.
  - [ ] **`admire.spec.js`.**
    - E-A1, E-A2 (the live text equals §7.7 exactly), E-A4, E-A5, E-A6, E-A7, E-A8, E-A9, E-A10, E-A11.
    - **E-A3, rewritten (E5).** Under `page.clock`: `data-placard` becomes `on` at 3,000 ± 50 ms and not before (attribute and timer state only). Then, with the clock state unchanged, `transitionTiming` gives caption 360 ms / delay 0 and placard 900 ms / delay 200 ms, and `seekTransitions` at every 10 ms from 0 to 1,100 ms shows `max(captionOpacity, placardOpacity) > 0` (the corner is never empty, #32) and placard opacity 1 at 1,100 ms.
    - Placard label correctness at three positions (#31). Placard phrase under reduced motion uses `pShown` (#39).
  - [ ] **Mutation proof (R4).** Against a temp copy of `site/` (`SITE_DIR`), changing the placard `transition-delay` 200 ms → 600 ms turns E-A3 red; reverting turns it green. Both outputs are in the report. (WO-023 mechanises this as mutant (e).)
  - [ ] **`chrome.spec.js`.** #12, #13, #14, #15, #16 (focus on a tick blocks the fade), #21, #22, #42 (E-T1: each tick lands at p 0 ±1 px, `aria-current` updates, 44 × 44 non-overlapping boxes). The 600 ms admire fade is checked by `transitionTiming`, not by sampling.
  - [ ] **`breathing.spec.js`.** #17 and #18 are amplitude checks, which are JS and clock-driven: under `page.clock`, `runFor` in 16 ms steps reads consecutive `snapshot().ambientA`; the first-frame delta is ≤ 0.2 px or 0.05° in scene breathing output, a(t) reaches 1 at 1,600 ms (±1 frame), decays to 0 within 240 ms of exit, with no pop > 1 px. #20 (pause survives reload).
  - [ ] **`rewind.spec.js`.** E-R1, #26 and #27.
  - [ ] **`keyboard.spec.js`.** The §9 tab order; ↑ ↓ PageUp PageDown Space Home End scroll natively (scrollY changes; no `preventDefault`, checked via `event.defaultPrevented` in an init script).
  - [ ] **`reduced.spec.js`.** E-M1 (no DocumentTimeline animations after 1 s of quiescence), **E-M2 on rendered output (R3)**: within each still range of every scene, `{state, reduced}` is constant **and** `frameHash` with `#chrome`, `#pause` and `.caption` masked is identical at the range's two ends; pause control disabled; ticks jumping instantly.
  - [ ] **Custody.** The WO-013 contracts stay runnable; helper additions are listed in the report.
- **Verification:** `npx playwright test tests/e2e/behaviour --reporter=list` output (red cases listed against their WOs), plus the mutation proof.
- **Quality notes:** #12–#22, #26, #27, #31–#36, #39, #42. SC4, SC5.

### WO-020 — Test engineering: flash audit (photosensitivity gate)
- **Role / discipline:** test-engineer / visual safety
- **Depends on:** WO-013 (helpers)
- **Owns (exclusive write):** `tests/e2e/flash/**`
- **Objective:** make photosensitivity safety a gate (D6) that covers the fastest automated navigations and checks area as well as the frame mean (R1, R2).
- **Acceptance criteria:**
  - [ ] **Method.** Every navigation is **recorded** per rAF in real time (a page-side rAF loop logging `scrollY` until 30 consecutive frames are unchanged), then **replayed**: seek to **every** recorded y (no subsampling), screenshot, compute frame Ȳ (`meanY64x40`) and the 9 window Ȳs (`windowY64x40`). A transition is |ΔȲ| ≥ 0.10 between consecutive recorded frames; the rule is ≤ 4 transitions in any 1 s window of recorded time, **applied to the frame mean and to each of the 9 windows**. Replay frames are decoded in memory and never written to disk.
  - [ ] **`flash/profile.spec.js` (E-F1).** 40 samples per scene. Ȳ is the mean linear-light luminance of a 64×40 downscale. Each scene has ≤ 2 direction reversals (hysteresis 0.02). The plot and JSON go to `evidence/flash-audit/`.
  - [ ] **`flash/rewind.spec.js` (E-F2).** The 8 s rewind, recorded and replayed per the method (every frame).
  - [ ] **`flash/tick05.spec.js` (E-F3).** From y 0, activate tick 05. Same method and rule. The report states the measured transition count against the predicted 4.
  - [ ] **`flash/fast-nav.spec.js` (E-F5, R1).** Under `prefers-reduced-motion: no-preference`, at 1440×900 and 375×812, four navigations: (a) tick 06 activated from y = 0; (b) tick 01 activated from y = D; (c) `End` from y = 0; (d) `Home` from y = D + colophon (the maximum scroll). Same method and rule. The JSON records, per navigation and viewport, the measured duration (first to last moving frame, ms), the frame count, and the transition count for the mean and the worst window.
  - [ ] **E-F4.** At every replayed frame, the share of pixels with R/(R+G+B) ≥ 0.8 is ≤ 0.70.
  - [ ] **Window evidence (R2).** `evidence/flash-audit/windows-<case>.json` holds, for each case, the maximum transitions-per-second for each of the 9 windows; `flash-audit/*.svg` plots the frame mean and the worst window. Any window failing fails the gate.
  - [ ] **Remedy rule (R1).** If E-F5 or E-F3 fails, the report states the numbers and files a REQUEST to the CEO and director-vision with the two candidate remedies: (1) tick and Home/End navigations that cross more than two seams jump instantly instead of smoothly; (2) reshape the §10.1 luminance profile. **The threshold, the window size and the replay density are never changed** to make it pass.
- **Verification:** `npx playwright test tests/e2e/flash --reporter=list` output, plus `ls evidence/flash-audit/`.
- **Quality notes:** §10.1 rules 1–6. §19 flash-audit bullet.

### WO-021 — Test engineering: accessibility, viewports, health, first paint, fonts; unit-spec and guard custody
- **Role / discipline:** test-engineer / a11y and health
- **Depends on:** WO-013 (helpers), WO-012 (suites handed over)
- **Owns (exclusive write):** `tests/e2e/health/**`, `tests/unit/spec/**`, `tests/static/**`
- **Objective:** prove the piece is accessible, error-free, overflow-free, layout-stable and honest at every viewport and in every mode, and keep the WO-012 unit spec suite and static guards current through wave 2.
- **Acceptance criteria:**
  - [ ] **`axe.spec.js` (E-X1).** `@axe-core/playwright` runs at each scene's hold position plus the colophon, at 375, 768, 1440 and 1920. There are 0 serious or critical violations, and the JSON goes to `evidence/a11y/`. It uses **no** `disableRules` or `exclude` unless each is in `axe-exceptions.json` with its reason, listed in this WO's report and in `log.md` (R5d; guard 10). The file ships as `[]`.
  - [ ] **`overflow.spec.js`.** `scrollWidth ≤ clientWidth` at those widths across 13 positions, and at 375 with 200% zoom (#25, emulated as a 188 CSS px viewport at DPR 2, documented in the test).
  - [ ] **`health.spec.js` (E-H1).** A full 120-tick wheel scroll-through and back, plus a rewind: `__showcase.errors` deep-equals `[]`, with 0 console errors and 0 `pageerror` (#38). The request count is ≤ 40. The DOM is ≤ 400 elements (≤ 500 under reduced motion).
  - [ ] **`first-paint.spec.js` (E-P1, #1, #45).**
    - With JavaScript disabled against the booted p 0 at 1440×900, < 0.5% of pixels differ at > 8/255, with the noscript banner masked.
    - The JS-off document height is ≤ 100svh + colophon.
    - The noscript text and the colophon credit line are verbatim.
  - [ ] **`fonts.spec.js` (E-P2, #28).** Routing delays the woff2 by 300 ms. CLS is ≤ 0.01. The title box width differs by ≤ 2% between fallback and loaded. Colophon p2 matches the font state (F12), with a blocked-font route giving the "system" string. `GET /fonts/OFL.txt` returns bytes whose sha256 is `18a4de52…0943` (R7).
  - [ ] **`contrast.spec.js` (#23).** Chip text against the composited pixels under it is ≥ 7:1 at the Scene 2 saffron plateau, Scene 4 p .5 and Scene 5 p .25.
  - [ ] **`focus.spec.js` (#24).** Focus-ring screenshots on wall, saffron, cobalt, mosaic and ink.
  - [ ] **`storage.spec.js` (#20).** `localStorage` throws via an init script; the page works and breathing defaults to on.
  - [ ] **`scheme.spec.js` (#30).** Under the dark scheme the Scene 6 → colophon wall is continuous, and Scene 1 p 0 uses `#F0EDE7`.
  - [ ] **`hash.spec.js` (R9).** For each of `#nope`, `#%22%5D`, `#%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E` and `#1`: 0 `pageerror`, 0 console errors, `__showcase.errors` deep-equals `[]`, no dialog event fires, and the page opens with `scrollY === 0`.
  - [ ] **Custody.** The unit spec suite and guards stay current; any guard added for a wave-2 module is listed in the report.
- **Verification:** `npx playwright test tests/e2e/health --reporter=list` and `node tests/static/check-static.mjs` output.
- **Quality notes:** #1, #20, #23, #24, #25, #28, #30, #38, #45. SC6, SC7.

### WO-022 — Scene 4 resilience: context-loss fallback and reduced-motion contact sheet
- **Role / discipline:** engineer / canvas
- **Depends on:** WO-010, WO-014; WO-027 (tuning requests for Scene 4)
- **Owns (exclusive write):** `site/js/scenes/{s4-dichroic,s4-lut,s4-fallback,s4-contact}.js`, `site/css/scenes/s4.css`, `tests/unit/dev/s4/**`, `tests/e2e/dev/s4/**`
- **Objective:** §8.3 and §10.4 F17 for Scene 4, plus any WO-027 tuning of Scene 4.
  - With no 2D context or a lost context, the scene shows the Scene 3 shelf in SVG for p < .5 and the seven DOM `Bands` for p ≥ .5, with an opacity crossfade over p .45–.55. It shows the error chip, pushes `{scene: 4, phase: 'context'}`, and redraws on `contextrestored`.
  - Under reduced motion at ≥ 1024, while the middle still shows, a dark chip holds three 128×80 canvases rendered once from `state(.25)`, `state(.5)` and `state(.75)` with the §12 labels.
- **Acceptance criteria:**
  - [ ] **Context loss.** A forced loss (`WEBGL_lose_context` does not apply to 2D, so the dev e2e uses an init-script `getContext` override returning null, plus a dispatched `contextlost`) gives exactly one ledger entry with phase `context`, the fallback visible at p .3 and .7, and no console error. `contextrestored` redraws.
  - [ ] **Contact sheet.** It appears only under reduced motion, at ≥ 1024, for p ∈ [.33, .67]. It is `aria-hidden`, rendered once (a draw counter in the dev e2e), and its labels are verbatim.
  - [ ] **Art tuning.** Every WO-027 tuning request addressed to WO-022 is resolved (before/after screenshot paths in the report) or explicitly declined by the CEO with a reason in `log.md`.
  - [ ] **No regressions.** The WO-012 and WO-013 Scene 4 cases (including E-D1/E-D2 `canvasHash`, #9) and E-S3/E-S4 still pass.
- **Verification:** dev e2e output, plus screenshots of the fallback and the contact sheet.
- **Quality notes:** §8.3 (honest error state), cut item 5 (the contact sheet may be cut only per §16 order), slip policy rule 3.

### WO-023 — Test engineering: verify hardening and planted-defect mutants
- **Role / discipline:** test-engineer / CI
- **Depends on:** WO-019, WO-020, WO-021, WO-029. The three-run criterion starts after WO-022 and WO-025 have reported.
- **Owns (exclusive write):**
  - `scripts/verify.mjs`, `scripts/mutants.mjs`, `playwright.config.js`
  - `tests/static/**`, `tests/unit/spec/**`, `tests/mutants/**`, `tests/perf/**`, `tests/e2e/smoke.spec.js`
  - `tests/e2e/{helpers,contracts,behaviour,health,flash}/**`
  - custodian of `tests/unit/dev/serve/**`
- **Objective:** make `npm run verify` trustworthy: it cannot pass vacuously, it is proven able to fail, it is deterministic, within its wall-time budget, and legible.
- **Acceptance criteria:**
  - [ ] **Phase 2 (R5c).** `VERIFY_PHASE = 2`: a manifest id with no test, or a suite (unit spec, contracts, behaviour, health, flash, evidence, perf) with 0 tests, **fails** verify. The report pastes the summary of a run in which one id was temporarily renamed, showing the failure.
  - [ ] **Skips (R5b).** A temporary `test.skip` in a temp copy makes verify fail twice over: guard 9 and the skipped count. Output pasted.
  - [ ] **`verify:mutants` (E7).** `npm run verify:mutants` (outside `verify`) copies `site/` to a temp directory, applies each mutant from `tests/mutants/*.json` as a literal text patch, serves it with `SITE_DIR` on a spare `PORT`, runs only the named cases (`--grep`), and asserts each named case goes **red**; it then confirms the unmutated copy is green for the same cases. At least these six mutants, each naming its expected red id(s):
    - (a) `Math.random()` added to one scene's `apply` offset → E-D1 (the rendered fingerprint, not the static guard, must catch it);
    - (b) Scene 5's first band edge shifted 2 px at p 0 → E-S4 (and U-3 when run against the unit suite);
    - (c) `--idle-ms` 1200 → 2000 → E-A2;
    - (d) `setAttrs` never writes after the first call → E-D3 (and E-D1);
    - (e) placard `transition-delay` 200 ms → 600 ms → E-A3 (R4);
    - (f) `transition: transform 300ms` injected on a scene's moving elements → E-D1 and E-D2 (R3).
    The output (mutant, expected id, observed status) is pasted in the report and written to `$EVIDENCE_DIR/mutants.json`. A mutant that stays green is a failure of this WO, not of the mutant.
  - [ ] **Three clean runs.** `npm run verify` runs 3× back to back on a clean `npm ci` with identical pass and fail sets and 0 flaky cases. Durations are in `verify-summary.json`, and the total is ≤ 8 min per run. If over, the report proposes sampling cuts for a CEO decision; **E-F2, E-F3 and E-F5 replay density is never cut**.
  - [ ] **Summary.** The summary prints each id with its status and maps failures to the owning WO through the manifest. `verify-summary.json` also records the total byte size and file count of `evidence/screens/` and `evidence/motion/`.
  - [ ] **Post-run index check.** Verify runs `node tests/e2e/evidence/check-index.mjs` (WO-026) as step 7 and fails if it exits non-zero.
  - [ ] **Static guards.** Guard 11 (modulepreload, E9): every module under `site/js/**/*.js` (except `types.d.ts`) appears exactly once as `<link rel="modulepreload">` in `index.html`, and no preload points at a missing file. Guard 12 (R8): `README.md` contains no `\d+\s?fps` and no "60 fps"-style claim. Guards 1–13 all pass, and every file in `tests/e2e/**` has no `waitForTimeout`.
  - [ ] **README section.** A "What the tests prove" section is drafted for WO-024 (delivered in the report): one line per suite, in plain language, including what the mutants prove.
- **Verification:** three run logs and the mutants output, attached as paths.
- **Quality notes:** SC1, exceptional #7.

### WO-024 — Final integration, README and evidence index
- **Role / discipline:** integrator / frontend
- **Depends on:** WO-014 … WO-023, WO-025, WO-026, **WO-027**, WO-029
- **Owns (exclusive write):**
  - `package.json`, `package-lock.json`, `.gitignore`, `tsconfig.json`, `README.md`
  - `site/**`, `dev/**`
  - `scripts/serve.mjs`, `scripts/check-size.mjs`, `scripts/bake-static.mjs`
  - `tests/unit/dev/**`, `tests/e2e/dev/**`
  - `bureau/missions/M-0001-scroll-showcase/evidence/README.md`
- **Objective:** ship-ready. Every spec test is green, all budgets are met, every art-review tuning request is closed, the README is complete and honest, and the evidence (stills and motion) is indexed for Gate 2. `site/js/types.d.ts` stays CEO-only even though it sits under an owned glob.
- **Acceptance criteria:**
  - [ ] `npm ci && npm run verify` exits 0 **three times in a row** at `VERIFY_PHASE = 2`. The summaries are saved as `evidence/verify-summary-run{1,2,3}.json`.
  - [ ] **Preloads.** `index.html` lists every shipped module in `<link rel="modulepreload">`, and WO-023's guard 11 passes.
  - [ ] **Art review closed (V1).** Every WO-027 tuning request is listed in the report as resolved (with the WO and the before/after paths) or CEO-declined (with the `log.md` line).
  - [ ] **Motion evidence (V2).** `npm run evidence:motion` has been run on the final build, and `evidence/README.md` indexes each `evidence/motion/*.webm` with its scenario, viewport, real duration and byte size.
  - [ ] **README.**
    - what *Bent Light* is; run, verify, controls and keyboard; reduced motion and the pause control;
    - the budget table with measured numbers from `perf.json` and `size.json`, each with its environment (headless Chromium, SwiftShader, this container), and **no fps or laptop-performance claim beyond those numbers** (R8; guard 12);
    - "What the tests prove" (from WO-023);
    - deploy notes (`site/` is the deployable directory, with no server needed; publishing needs the Owner's go-ahead);
    - `window.__showcase`: that it ships, is read-only, and exists for the test suite;
    - Lighthouse: optional, Owner-run, needs network and pulls ~179 MB of unlocked dependencies;
    - known environment gaps (real iOS toolbar, touch momentum, real-GPU timing) and the recommendation that the Owner does a 60-second hand-scroll on a real laptop;
    - the font credit: Space Grotesk, © 2020 The Space Grotesk Project Authors, SIL Open Font License 1.1, with `site/fonts/OFL.txt` (R7); a link to the dossier; a CI snippet for after export.
  - [ ] **Evidence index.** `evidence/README.md` indexes the screens (`screens/index.md`), seams, flash audit (including `windows-*.json` and E-F5), perf, size, a11y, mutants, motion, art review and spike, with one line per item and its spec reference.
  - [ ] **Cuts.** No §16 cut is taken without being recorded in the report with its reason and numbers (slip policy rule 1). Non-negotiables are all present.
  - [ ] **Clean tree.** There are no `console.log` calls and no dev-only code in `site/`; `git status` shows only intended files; the WO-024 report contains no "fps" claim (`grep -c fps` on it is 0 outside quoted measurements).
- **Verification:** three run logs, `ls -R` of the evidence directory, and the motion index.
- **Quality notes:** every polish item is re-checked against the coverage table; any item without a passing test or an evidence path is listed in the report.

### WO-025 — Integration 2: wave-2 modules joined, Scenes 1–3, 5–6 and chrome finished
- **Role / discipline:** integrator / frontend
- **Depends on:** WO-014 … WO-021, WO-029; WO-027 (tuning requests)
- **Owns (exclusive write):**
  - `site/index.html`, `site/js/main.js`, `scripts/bake-static.mjs`, `dev/**`
  - `site/css/{base,tokens,chrome,colophon}.css`, `site/css/scenes/s{1,2,3,5,6}.css`
  - `site/js/core/**`, `site/js/components/**`, `site/js/engine/**`, `site/js/chrome/**`
  - `site/js/scenes/{index,prism-svg,s1-incidence,s2-field,s3-refraction,s5-agreement,s6-return}.js`
  - `tests/unit/dev/{core,content,engine,s1,s2,s3,s5,s6,admire,chrome,rewind}/**`
  - `tests/e2e/dev/{components,engine,s1,s2,s3,s5,s6,admire,chrome,rewind}/**`
- **Objective:** join the wave-2 modules (Scene 6, admire, ambient, chrome, rewind, colophon) with Integration 1's piece, fix what the behaviour, health and flash suites expose, and apply the WO-027 tuning for everything except Scene 4. Disjoint from WO-022's Scene 4 files.
- **Acceptance criteria:**
  - [ ] **Suites green (E1).** Every WO-019 behaviour case and every WO-021 health case is green.
  - [ ] **Seam 5→6.** E-S5 is green at both DPRs; E-S1–E-S4 stay green.
  - [ ] **Flash.** E-F1–E-F4 and E-F5 are green on the frame mean and on every window. If E-F5 fails, the WO-020 remedy REQUEST is decided by the CEO and director-vision before this WO closes; the decision is implemented here (ticks/Home/End behaviour) and recorded.
  - [ ] **Art tuning (V1).** Every WO-027 tuning request addressed to WO-025 is resolved (before/after screenshot paths in the report) or explicitly declined by the CEO with a reason in `log.md`.
  - [ ] **Determinism holds.** E-D1–E-D3 (rendered) and E-M2 are green with admire, ambient and chrome live.
  - [ ] **Change log, incremental.** Changes to wave-2 owners' modules are appended to the report as they are made, each with its reason and the original owner.
- **Verification:** the `npm run verify` summary table (Scene 4 resilience cases owned by WO-022 may be red and are listed), plus `ls evidence/seams/`.
- **Quality notes:** #3, #11, #16–#22, #26, #27, #30–#36, the §14 grin moments 6–9.

### WO-026 — Test engineering: the full §19 evidence pack and motion evidence
- **Role / discipline:** test-engineer / visual evidence
- **Depends on:** WO-029 (minimal pack and shot list), WO-015, WO-016, WO-017, WO-018
- **Owns (exclusive write):** `tests/e2e/evidence/**`, `tests/motion/**`
- **Objective:** capture the whole §19 list, prove every §19 bullet has a file, and record the motion itself (V2, V3).
- **Acceptance criteria:**
  - [ ] **`evidence/pack.spec.js`.** It extends WO-029's pack to the full §19 list, writing `evidence/screens/<group>/<scene>-p<NNN>-<w>x<h>@<dpr>.png`:
    - §19.1 60 scene frames; §19.2 the hold bands; §19.3 the five seam before/after pairs at 1440×900 with diffs; §19.4 the hook pair; §19.5 three 1920 heroes;
    - §19.6 **20 seeded random positions across all six scenes** at 1440×900 **and** 375×812;
    - §19.7 the admire series at Scene 4 p .5 (chrome visible, 2 s, 4.5 s) and the shimmer pair 6 s apart (real time);
    - §19.8 chrome states: tick hover, tick focus, pause in its three states, both chip themes, **the noscript page**, **the scene-error chip** (via the `getContext` override), **the placard on both chip themes** (Scene 1 light, Scene 4 dark);
    - §19.9 reduced-motion stills, the crossfade midpoint and the contact sheet; §19.10 768 and 1024 frames;
    - §19.11 **the font modes side by side**: Scene 1 p 0 title in Mode G and in the fallback face (font route blocked), plus a pngjs-composited `font-modes-side-by-side.png`;
    - §19.12 OS dark Scene 1 and colophon; DPR 2 fringe frames (#29); Scene 3 edges at DPR 2 (#7); Scene 4 facets at DPR 2 (#8).
  - [ ] **Index (V3).** `evidence/screens/index.md` maps **every** §19 bullet (§19.1–§19.14, experience.md:1000-1013) to at least one file, and every file to its bullet and spec reference. The final test in `pack.spec.js`, `[§19] every §19 bullet has at least one captured file`, fails if any pack-owned bullet has no file on disk.
  - [ ] **Cross-suite bullets.** `tests/e2e/evidence/check-index.mjs` (run by verify step 7 after e2e) checks the bullets whose files come from other suites, §19.13 (flash plots in `evidence/flash-audit/`) and §19.3 diffs in `evidence/seams/`, plus §19.14 (the Scene 1 frames, referenced not copied), and exits 1 listing any bullet with no file.
  - [ ] **Motion (V2).** `tests/motion/record.mjs` (run by `npm run evidence:motion`, **not part of `verify`**, so it cannot add flake to the gate) uses Playwright `recordVideo` against the local server and writes `evidence/motion/`:
    - (a) `scroll-through-1440x900.webm` and `scroll-through-375x812.webm`: a scripted wheel scroll from top to the colophon and back;
    - (b) `admire-s4-1440x900.webm`: Scene 4 p .5, ≥ 8 s of real-time stillness (chrome recedes, placard appears, the shimmer moves), then a wheel exit;
    - (c) `rewind-1440x900.webm`: the full 8 s rewind.
    It writes `evidence/motion/index.json` with scenario, viewport, measured real duration and bytes per file; each file is ≥ 10 KB, and `ffprobe` (when present) reports a duration within 10% of the measured one.
  - [ ] **Weight.** Only the §19 pack, plots and motion files are written; the report states the total bytes of `evidence/screens/` and `evidence/motion/`.
- **Verification:** `npx playwright test tests/e2e/evidence --reporter=list`, `node tests/e2e/evidence/check-index.mjs`, `npm run evidence:motion`, plus `ls -R` of the evidence directories.
- **Quality notes:** #7, #8, #29 (evidence for the critic). §19 in full. Exceptional #2.

### WO-027 — Art-direction review (designer's eye before Gate 2)
- **Role / discipline:** experience-designer / art direction (the C designer; reviewer, not builder)
- **Depends on:** WO-014, WO-015, WO-016, WO-017 (the wave-2 join build). Runs first in wave 3.
- **Owns (exclusive write):** `bureau/missions/M-0001-scroll-showcase/evidence/art-review/**`, `bureau/missions/M-0001-scroll-showcase/reports/WO-027-art-review.md`
- **Objective:** judge and tune beauty, not just verify it. The designer reviews composed frames against the spec's intent and turns every "not composed" or "competent, not beautiful" frame into a tuning request with a named fix owner (V1).
- **Acceptance criteria:**
  - [ ] **Capture.** `evidence/art-review/capture.cjs` (CommonJS, `require('playwright')` via `NODE_PATH`, against `npm run dev` on the wave-2 build) writes the review set to `evidence/art-review/`:
    - the 20 seeded random stops across **all six scenes** at 1440×900 and 375×812 (same seeds as §19.6);
    - the three 1920 heroes; the hold-band triplets for every scene;
    - the Scene 4 admire shimmer pair (6 s apart, real time);
    - Scene 3 p 1 at 1440×900 at 100% (dispersion legibility at a glance, D3);
    - the Scene 1 frames (p 0, .25, .5, .75, 1) against the album-cover guard (§2:70);
    - the Scene 1 gallery spot and the Scene 4 LUT mosaic at p .5 for wall warmth and mosaic colour.
  - [ ] **Verdicts.** `reports/WO-027-art-review.md` has one row per frame: file, verdict (`composed` / `not composed` / `competent, not beautiful`), and a one-line reason. It also judges hold-band creep perceptibility (#43) and the album-cover guard explicitly.
  - [ ] **Tuning requests.** Each non-`composed` verdict becomes a numbered tuning request `T-nn` with the frame, the spec reference, the proposed change (numeric where possible: a token, a keyframe value, a scale) and the **fix owner** (WO-025 for Scenes 1–3, 5–6 and chrome; WO-022 for Scene 4). A request that would change §4 keyframes, tokens or copy is marked "spec change: CEO" and goes to the CEO first.
  - [ ] **Re-check.** After the fix owners report, the designer re-captures each tuned frame and updates its verdict; the final table shows every `T-nn` as resolved or CEO-declined (with reason).
- **Verification:** `ls bureau/missions/M-0001-scroll-showcase/evidence/art-review/` and the verdict table.
- **Quality notes:** exceptional #2 (20 stops worth screenshotting), #6 (dispersion legibility), #43 (creep perceptibility), the §2 originality guard, §14 grin moments.

### WO-028 — Test engineering: test custody during final integration
- **Role / discipline:** test-engineer / CI and audit
- **Depends on:** WO-023, WO-026
- **Owns (exclusive write):**
  - `scripts/verify.mjs`, `scripts/mutants.mjs`, `playwright.config.js`
  - `tests/static/**`, `tests/unit/spec/**`, `tests/mutants/**`, `tests/perf/**`, `tests/motion/**`, `tests/e2e/smoke.spec.js`
  - `tests/e2e/{helpers,contracts,behaviour,health,flash,evidence}/**`
- **Objective:** keep the tests independent of the final integrator. Triage every red spec case as a product defect or a test defect, audit tolerances against the spec, and prove once more that the suite can fail.
- **Acceptance criteria:**
  - [ ] **Triage.** Every red spec case during WO-024 is classified in this WO's report within the same sitting (product defect → WO-024, with the failing id; test defect → fixed here, with the spec line that proves the test was wrong).
  - [ ] **Tolerance audit.** A table of every numeric tolerance and threshold in `tests/` (`path:line`, value, spec reference, spec value). Every value equals its spec value; any deviation has a `log.md` entry, or is reverted.
  - [ ] **Final mutants.** `npm run verify:mutants` on the final build: all six (or more) mutants red as expected; output in `$EVIDENCE_DIR/mutants.json`.
  - [ ] **No loosening.** `git diff` of `tests/` over wave 4 shows no removed assertion, no lowered floor and no widened tolerance without a `log.md` entry.
- **Verification:** the audit table, the triage list and the mutants output.
- **Quality notes:** SC1, exceptional #7; risk's Gate 2 tolerance diff.

### WO-029 — Test engineering: perf recording, verify wiring for wave 2, minimal evidence pack
- **Role / discipline:** test-engineer / performance
- **Depends on:** WO-013 (helpers, verify phase 1)
- **Owns (exclusive write):** `tests/perf/**`, `tests/e2e/evidence/**`, `scripts/verify.mjs`, `playwright.config.js`; custodian of `tests/unit/dev/serve/**`
- **Objective:** record performance with honest numbers (SC8, R8), keep verify and the Playwright config owned through wave 2, and give the evidence suite a real, non-empty start (the shot list and the 60 scene frames) before the empty-suite allowance ends.
- **Acceptance criteria:**
  - [ ] **`perf/scroll.perf.js`.**
    - A 120-tick wheel scroll at 1440×900, 1920×1080 and 375×812.
    - It records rAF-delta p50, p95, max and share over 20 ms; `frameStats` script p50 and p95; CDP LayoutCount, RecalcStyleCount, ScriptDuration and JSHeapUsedSize deltas; LCP; `bootMs`; and the request count.
    - Output goes to `evidence/perf.json` and `perf.md`, with the architecture's budget table filled in as target against measured.
    - It fails only on the guards: script p95 > 12 ms, heap > 60 MB, boot > 1,000 ms.
  - [ ] **`perf/scenes.perf.js`.** For **all six scenes** in the harness at 1440×900: `state` p95 and `apply` p95 over 120 frames (Scene 4 also flushed draw p95), recorded in `perf.json` (C3 budgets as targets; recorded, not gated).
  - [ ] **Honesty section (R8).** `perf.md` has a "What these numbers measure and do not" section: headless shell; SwiftShader software raster; `frameStats().scriptMs` covers engine JS only and excludes style, layout, paint and raster; rAF deltas are not a display refresh rate.
  - [ ] **Minimal pack.** `evidence/shotlist.js` exports the §19 shot list (ids §19.1–§19.14 with every file name), and `evidence/pack.spec.js` captures §19.1 (60 scene frames). The evidence suite is non-empty before the wave-2 join.
  - [ ] **Verify wiring.** `verify.mjs` stays at phase 1 with the 34-id e2e floor; the perf floor counts `scroll.perf.js` and `scenes.perf.js`. `npx playwright test --list --project=perf` shows all perf tests (pasted).
- **Verification:** `npm run test:perf` output, `cat evidence/perf.md`, the `--list` output.
- **Quality notes:** SC8, SC9 (start of the pack); engineering concern on per-scene costs.

---

## Board conditions

Every Gate 1 condition, where it now lives, and how it is verified. Board reports: `board/plan-director-vision-r1.md` (V), `board/plan-director-engineering-r1.md` (E), `board/plan-director-risk-r1.md` (R).

| ID | Condition (short) | Satisfied by | How it is verified |
|---|---|---|---|
| V1 | Art-direction review WO by the C designer after WO-014/015, before WO-022/023 close; per-frame verdicts; tuning requests with fix owners resolved or CEO-declined before WO-024 closes; WO-024 depends on it | **WO-027** (new); WO-025 and WO-022 "Art tuning" criteria; WO-024 depends on WO-027 and has "Art review closed"; wave 3 runs WO-027 first; slip rule 4 | `reports/WO-027-art-review.md` verdict table with every `T-nn` resolved or declined; WO-024 report lists each |
| V2 | Motion evidence: webm of scroll-through and back (1440, 375), ≥ 8 s admire at S4 p .5, the 8 s rewind; non-gating; indexed | **WO-026** `tests/motion/record.mjs` via `npm run evidence:motion` (outside verify; moved from WO-020 with the pack, per the engineering concern on WO-020 size); WO-001 adds the script; WO-024 indexes it | `evidence/motion/index.json` (duration, bytes); `ffprobe` duration check; WO-024 evidence README rows |
| V3 | `evidence/screens/index.md` maps every §19 bullet to ≥ 1 file, incl. font-mode side-by-side, noscript page, scene-error chip, placard on both themes; the pack fails if any bullet has no file | **WO-026** (`pack.spec.js` final test and `check-index.mjs` for cross-suite bullets); WO-029 shot list; WO-023 wires `check-index.mjs` as verify step 7 | `[§19]` test red on a missing bullet; `check-index.mjs` exit code; manifest ids `§19.1`–`§19.14` in the verify summary |
| V4 | Slip policy in plan.md: only §16.1/§16.2 valves with numbers; never drop a frame row, hold band, grin moment or non-negotiable; Scene 4 extends the schedule; fill this section | **"Slip policy (V4)"** section above; WO-010 and WO-022 quality notes; WO-024 "Cuts" criterion; this table | CEO checks each WO report for recorded cuts with numbers; WO-024 report lists cuts |
| E1 | Integration 2 WO in wave 3 owning the wave-2 product modules, disjoint from WO-022; AC WO-019 and WO-021 green, E-S5, E-F1–F4; re-run owns check | **WO-025** (new; also E-F5); WO-022 owns only the Scene 4 files | Ownership check below (0 overlaps); WO-025 verify summary |
| E2 | Owner for every test path in every wave; helpers/contracts to WO-019 in wave 2 (additive), unit spec/static to WO-021; waves 3–4 to WO-023 | Wave 1: WO-012, WO-013 (with custodian roles); wave 2: WO-019 (helpers additive, contracts, smoke), WO-021 (unit spec, static), WO-029 (perf, evidence, verify, config); wave 3: WO-023 (all non-dev tests except evidence/motion, which WO-026 builds), WO-025/WO-022 dev dirs; wave 4: **WO-028** (new custodian, since WO-023 cannot span two waves), WO-024 dev dirs | Ownership check below: "test-path coverage" section shows exactly one owner per test area per wave |
| E3 | WO-001 stubs `createAmbient`, `createAdmire`, `createRewind`, `createChrome` with C4 signatures, inert, typechecked; `main.js` wires them so wave 2 never touches it | **WO-001** "C4 factory stubs" and "Wiring"; WO-006 "Wiring"; WO-016/017/018 objectives state they do not touch `main.js` | `npm run typecheck` in WO-001; ownership check shows `site/js/main.js` owned by no wave-2 WO except WO-014 |
| E4 | No vacuous passes: test-count floors in `verify.mjs` (0 only in wave 0; unit ≥ 1 per spec file, e2e ≥ number of §15.3 E-ids, perf ≥ 1); no `--pass-with-no-tests` after wave 0; perf `testMatch: '**/*.perf.js'`; `--list` for both projects | **WO-001** (phase 0, testMatch, assertion against `--pass-with-no-tests`), **WO-013** (phase 1: `UNIT_SPEC_FILES`, 34-id e2e floor, perf ≥ 1 via `boot.perf.js`), WO-029, WO-023 (phase 2); architecture K18 | WO-013 report: emptied-suite run fails, `--list` outputs; WO-029 `--list` for perf |
| E5 | Transition timing by seeking, not clock sampling: E-A3, #31, #17/#18 and WO-017 fade criteria; `admireClock.js` documents it with probe output | **WO-013** `admireClock.js` (`seekTransitions`, `transitionTiming`, probe quotes); **WO-019** E-A3 rewritten, #17/#18 as clock-driven amplitude checks, chrome fade by timing; **WO-017** fades stated as computed transition timing; WO-016 dev e2e reads no opacity at paused steps; architecture K11 | WO-013 probe output; WO-019 mutation proof (mutant e); WO-023 mutants |
| E6 | Rendered-frame determinism: E-D1/E-D3 compare a screenshot hash at ≥ 1 position per scene, breathing off, after away-and-back | **WO-013** E-D1/E-D3 with `frameHash` (0 px) and `canvasHash` in S4; WO-004 `setAttrs` per-node cache criterion | Mutants (d) and (f) in WO-023 turn E-D1/E-D3 red |
| E7 | `npm run verify:mutants` in WO-023, outside verify, ≥ 4 planted defects (Math.random, 2 px band edge, idle 1200→2000, setAttrs no-write), each turning a named case red | **WO-023** mutants (a)–(f) (six: adds R3's transition and R4's hand-off delay); WO-001 serve `SITE_DIR`/`PORT` and the script stub; WO-028 final run | `$EVIDENCE_DIR/mutants.json`; WO-023 and WO-028 reports |
| E8 | WO-005 runnable: `spike.cjs` with `require('playwright')` via `NODE_PATH` or `createRequire`; full-path command | **WO-005** "Runnable" criterion and verification command | Probe A10 (`require ok function` from the dossier dir; global playwright 1.63.0); WO-005 pasted output |
| E9 | Correct critical path; modulepreload guard into WO-023 AC now | **Critical path** section (WO-001 → WO-006 → WO-014 → WO-027 → WO-025 ∥ WO-022 → WO-024; WO-002/003 joins; WO-016/017 parallel to WO-014); **WO-023** guard 11; WO-024 relies on it | Guard 11 output in WO-023's report; WO-024 preload criterion |
| R1 | Flash audit covers fastest navigations: E-F5 (tick 06 from 0, tick 01 from D, End from 0, Home from max) at 1440 and 375, per rAF, full replay, ≤ 4/1 s; durations and counts reported; remedy named, never a loosened threshold | **WO-020** `fast-nav.spec.js` (E-F5), every-frame replay for E-F2/F3/F5, remedy rule; WO-025 implements a decided remedy; WO-023 never cuts their density; manifest id E-F5 | E-F5 JSON per navigation; flash suite in verify step 5 |
| R2 | Area check: Ȳ for every 2×2-tile window of a 4×4 tiling of the 64×40 downscale (25% of viewport); window rule on E-F2/F3/F5; per-window maxima saved; any window fails the gate | **WO-013** `windowY64x40` helper; **WO-020** method and window evidence | `evidence/flash-audit/windows-<case>.json`; gate fails on any window |
| R3 | Determinism on rendered output: E-D1, D2, D3, M2 compare a rendered fingerprint (pixel-identical or justified tolerance; S4 canvas hash); E-D2 second capture after real time with rAF free-running; mutation proof with an injected `transition: transform 300ms` | **WO-013** E-D1/D2/D3 and mutation proof; **WO-019** E-M2 rendered; **WO-023** mutant (f) | WO-013 report with red then green outputs; mutants.json |
| R4 | Timing via a proven clock path: probe cited at the top of `admire.spec.js` and `breathing.spec.js`; CSS fades via Web Animations or real-time `expect.poll`, never computed opacity at paused steps; mutation proof breaking the hand-off delay | **WO-013** probe in `admireClock.js`; **WO-019** citation, E-A3 by seeking, mutation proof; **WO-023** mutant (e) | WO-019 report outputs; mutants.json |
| R5 | No vacuous green: (a) guard rejects skip/fixme/describe.skip/.only/test.fail; (b) verify fails on any skipped test; (c) id manifest, missing id or empty suite fails from WO-023, missing-dir allowance expires end of WO-014; (d) no axe `disableRules`/`exclude` without listed reason | (a) **WO-012** guard 9; (b) **WO-013** skip counts; (c) **WO-013** manifest + floors (empty suites already fail from phase 1, i.e. before WO-014 ends), **WO-023** phase 2 (missing ids fatal); (d) **WO-012** guard 10 + **WO-021** `axe-exceptions.json` | WO-013 and WO-023 reports show forced failures; guard fixture proofs in WO-012 |
| R6 | Real traversal test with raw `node:http` (six paths → 404/400, no bytes outside `site/`/`dev/`); `serve.mjs` binds `127.0.0.1` only | **WO-001** "Server (K19)" and "Traversal test"; architecture K19 | `tests/unit/dev/serve/traversal.test.js` in the unit step; probe A8 shows raw paths reach the server unnormalised |
| R7 | `OFL.txt` byte-identical to the package `LICENSE`, sha256 in `SOURCE.md`, checked in verify step 4; guard 5 scoped or exempting OFL/SOURCE; licence never edited; README and colophon credit Space Grotesk under OFL-1.1 | **WO-001** font and licence (sha256 `18a4de52…0943`, probe A9), `check-size.mjs`; **WO-012** guard 5 scope and `assets.test.js`; **WO-021** OFL served-bytes check; **WO-003/WO-018** colophon credit line (C7); **WO-024** README credit | verify step 4 and unit `assets.test.js`; guard 5 fixture; `first-paint.spec.js` credit text |
| R8 | Honest frame-cost numbers: WO-005 flushed draw (`getImageData(0,0,1,1)`) with rAF p95, rule cites the flushed number; `perf.md` "what these numbers measure and do not"; no "60 fps" in README or delivery report | **WO-005** flushed timing and decision rule; **WO-010** flushed cost; **WO-029** honesty section; **WO-023** guard 12; **WO-024** README and report criteria | `results.md`; `perf.md` section; guard 12 |
| R9 | Hash robustness: `#%22%5D`, `#%3Cimg…%3E`, `#1` → 0 pageerror, `errors` `[]`, opens at the top | **WO-021** `hash.spec.js`; **WO-006** hash-handling criterion; **WO-012** guard 13 | `hash.spec.js` in verify step 5 |

**Non-blocking concerns also folded in:** `scrollTo({behavior:'instant'})` and ResizeObserver compare-before-write (WO-006); `#10` beam rect inset by one device pixel (WO-011, WO-013); per-scene `state`/`apply` p95 for all six scenes (WO-029); evidence byte size in `verify-summary.json` (WO-023); `stateAt` vs `snapshot` in the contracts suite (WO-013 hook.spec); K12 env-var override (WO-001); `__showcase` and Lighthouse notes in the README (WO-024); flash replay frames never written to disk (WO-020); `*.trace.json` gitignored (WO-001); Scene 1 gallery spot named (WO-007); creep perceptibility judged by eye (WO-027); WO-014 incremental fix list; WO-020 split three ways (flash WO-020, perf WO-029, pack WO-026); real-device hand-scroll recommendation (WO-024 README); tolerance-vs-spec audit (WO-028).

**Decision for the CEO (from R7):** the colophon credit line is new copy. The plan uses: *"The Space Grotesk typeface ships with this page under the SIL Open Font License 1.1, © 2020 The Space Grotesk Project Authors."* The experience-designer may replace the wording before the wave-0 freeze; the element (`p.colophon-credit`) is in C7 either way.

## Ownership check (mechanical)

Script: `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/arch-r2/owns_check.py`. It parses the wave table and every `### WO-` section's "Owns" block, expands braces and `{a..b}` ranges, tests every pair of patterns in the same wave for literal, glob and prefix overlap, and checks that each test area has exactly one owner in each wave from the wave it first exists.

```
$ python3 owns_check.py bureau/missions/M-0001-scroll-showcase/plan.md
parsed 29 work orders; wave map for 29; unmapped: none
wave 0 (WO-001, WO-002, WO-003, WO-004, WO-005): 0 overlaps
wave 1 (WO-006, WO-007, WO-008, WO-009, WO-010, WO-011, WO-012, WO-013): 0 overlaps
wave 2 (WO-014, WO-015, WO-016, WO-017, WO-018, WO-019, WO-020, WO-021, WO-029): 0 overlaps
wave 3 (WO-022, WO-023, WO-025, WO-026, WO-027): 0 overlaps
wave 4 (WO-024, WO-028): 0 overlaps
test-path coverage (exactly one owner per area per wave):
  wave 1: 24 areas, 24 with exactly one owner, 0 bad
  wave 2: 36 areas, 36 with exactly one owner, 0 bad
  wave 3: 39 areas, 39 with exactly one owner, 0 bad
  wave 4: 39 areas, 39 with exactly one owner, 0 bad
RESULT: 0 overlaps, 0 coverage failures
exit=0
```

**Negative control.** The same script run on a copy with `site/js/main.js` and `tests/e2e/behaviour/x/**` planted in WO-016 and WO-012's custodian line removed reports `WO-014 site/js/main.js <-> WO-016 site/js/main.js`, `WO-016 tests/e2e/behaviour/x/** <-> WO-019 tests/e2e/behaviour/**`, and `BAD tests/unit/dev/{core,content}: no owner` in wave 1 (`RESULT: 2 overlaps, 2 coverage failures`), so a clean result is meaningful.
