# Plan: M-0001 *Bent Light* (scroll-driven animation showcase)

Architect · 2026-11-20 · Tier 3. Architecture: `design/architecture.md` (cited as **K1–K17** for decisions and **C1–C7** for contracts). Spec: `design/experience.md` (cited as **§n**, polish items as **#n**).

**Ground rules for every work order**
- **Paths.** Every path is relative to `projects/scroll-showcase/` unless it starts with `bureau/`.
- **Contracts.** The C1–C7 contracts are frozen at the end of wave 0. Code against them. If one is wrong, stop and raise a REQUEST; do not change it.
- **Ownership.** You write only to paths you own. You may read anything. If you need a change in a file you do not own, put it under REQUESTS in your report.
- **Proof.** "Done" means:
  1. `npm run verify:quick` is green.
  2. Your own dev tests pass.
  3. Your acceptance criteria are proven by a command and its output, or by a screenshot path.
  4. Your report is at `bureau/missions/M-0001-scroll-showcase/reports/WO-0NN-<slug>.md`.
- **Tests.** Engineers' own tests go in `tests/unit/dev/<area>/` and `tests/e2e/dev/<area>/`. The test-engineer's suites are written from the spec, not from your code. If a spec test fails against your work, the spec wins. If you think the test misreads the spec, raise it with the CEO.
- **Clean slate.** No `console.log` is left in `site/`. Run `npm run verify:quick` before you report.

## Waves

| Wave | Work orders | Notes |
|---|---|---|
| 0 | WO-001, WO-002, WO-003, WO-004, WO-005 | Scaffold and frozen contracts (WO-001, integrator), with the pure core, the tokens, copy and phrases, the shared render components, and the Scene 4 perf spike in parallel. Ownership is disjoint, and every WO codes against architecture §C. **Join:** the CEO runs `npm run verify:quick` in `projects/scroll-showcase` and freezes the contracts in `log.md`. Any failure goes back to the owning wave-0 WO. |
| 1 | WO-006, WO-007, WO-008, WO-009, WO-010, WO-011, WO-012, WO-013 | 8 in parallel: engine, Scenes 1–5, and test engineering (unit spec suite, then e2e infrastructure and contracts) **alongside** the builders. WO-010 starts only once WO-005's decision is filed. |
| 2 | WO-014, WO-015, WO-016, WO-017, WO-018, WO-019, WO-020, WO-021 | 8 in parallel. **Mid-build integration WO-014** (seams 1→5, D1 decision, fix rights over Scenes 1–5 and the engine) runs alongside Scene 6, admire, chrome, rewind and three test-engineering suites. |
| 3 | WO-022, WO-023 | Scene 4 resilience (context loss and contact sheet), plus verify hardening (flake runs and wall time). |
| 4 | WO-024 | **Final integration**: every spec test green, verify green 3× in a row, README, evidence index. |

**Parallelism check:** in waves 1–4 no two work orders in the same wave share a path. The "Owns" lines are exhaustive.

## Critical path

**WO-001 / WO-002 → WO-006 (engine) → WO-014 (integration 1: seams) → WO-016 → WO-024 (final integration) → `npm run verify` green.**

The longest-risk side chain is **WO-005 (S4 spike) → WO-010 (S4) → WO-014 → WO-022 → WO-024**. If WO-005 runs late, WO-010 is the item that slips, and every other wave-1 order is unaffected.

## Top risks the plan is built around
1. **Playwright drift.** Exact pins, plus the verify preflight in WO-001 and WO-013.
2. **Scene 4 cost.** Spiked first in WO-005.
3. **Seams.** Pure seam gates exist from wave 1 (WO-012). WO-014 has one fix round, then D1.
4. **Timing flakiness.** No sleeps; clock semantics proven in WO-013; three consecutive runs in WO-023 and WO-024.

Details are in architecture → Risks & spikes.

---

## Coverage

### Brief success criteria

| Requirement | Work order(s) |
|---|---|
| SC1 `npm run verify` runs unit, e2e, axe and screenshots and exits 0 | WO-001 (pipeline stub), WO-013 (real e2e pipeline), WO-023 (hardening), WO-024 (green 3×) |
| SC2 Pure function of position: same y gives the same state after away-and-back; no drift while still | WO-002, WO-006, WO-007…WO-011, WO-015 (pure `state`); WO-012 (purity unit); WO-013 (E-D1, E-D2, E-D3) |
| SC3 Documented start and end states at p 0 and 1 | Scene WOs WO-007…WO-011, WO-015; WO-012 (U-3, §15.2 table); WO-013 (global endpoints, pixel facts) |
| SC4 Admire: enters after idle, hides chrome, announces, exits on scroll, key or pointer | WO-016, WO-017; WO-019 (E-A1…A11) |
| SC5 Reduced motion: ambient off, fully usable | WO-003 (`stillPlan`), WO-006 (a/b instances), WO-016 (ambient disabled), WO-017 (pause disabled), WO-018 (rewind becomes jump), WO-022 (contact sheet); WO-019 (E-M1/M2) |
| SC6 0 serious or critical axe violations; no horizontal overflow at 375, 768, 1440 and 1920 | WO-001 (semantics), WO-017 (chrome), WO-021 (E-X1) |
| SC7 0 console errors and unhandled rejections over a full scroll-through | WO-006 (error ledger), WO-021 (E-H1) |
| SC8 Measured frame timing in the evidence; JS under budget | WO-005 (spike), WO-001 (`check-size`), WO-020 (perf project → `perf.json`), WO-023 |
| SC9 Screenshots of every scene at several progress points in `evidence/` | WO-020 (§19 pack), WO-013 (seam diffs) |
| Exceptional #6: no layout shift | WO-001 (font faces), WO-021 (E-P2, CLS ≤ 0.01) |
| Exceptional #7: a legible suite | WO-012, WO-013, WO-019, WO-020, WO-021 (named E-/U- cases), WO-023 (summary) |
| D6 flash audit as a gate | WO-020 (E-F1…F4) |
| F10 / E-K1 hook at 40 px | WO-007, WO-013 |
| F8 / E-R2 resize round trip | WO-006, WO-013 |
| E-T1 ticks | WO-017, WO-019 |
| E-P1 / E-P2 first paint and fonts | WO-001, WO-007 (bake), WO-017 (font claim), WO-021 |

### Polish list (§17)

| # | Item (short) | Builder WO | Test WO |
|---|---|---|---|
| 1 | JS-off first paint ≈ booted p 0, < 0.5% | WO-007 (bake), WO-001 (noscript) | WO-021 (E-P1) |
| 2 | Plates in register give pure black (R, G, B ≤ 3) | WO-007 | WO-013 |
| 3 | Seam state gate and pixel diff ≤ 0.5% | WO-014, WO-015 (5→6) | WO-012 (pure), WO-013 (E-S) |
| 4 | Bands gapless at 1×, 1.5× and 2×, snapped | WO-002 (`snap`), WO-004 (Bands), WO-010, WO-014 | WO-012, WO-013 |
| 5 | Scene 2 shear never reveals ground | WO-008 | WO-013 |
| 6 | Scene 3 white at centre; triplet peaks ≥ 6 px apart | WO-009 | WO-013 |
| 7 | Scene 3 anti-aliased edges, stroke covers clip | WO-009 | WO-020 (evidence, critic) |
| 8 | Scene 4 facets share edges, no seams | WO-010 | WO-020 (evidence), WO-010 dev |
| 9 | Scene 4 byte-identical across runs | WO-010 | WO-013 |
| 10 | Scene 5 p 1 exact `#FFFFFF` | WO-011 | WO-013 |
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
| 29 | Fringe lines 1 px at every DPR and rotation | WO-007 | WO-020 (DPR 2 shots) |
| 30 | Colophon on the same `--wall` as Scene 6 p 1, both schemes | WO-015, WO-018 | WO-021 |
| 31 | Placard at 3,000 ms ± 50, 900 ms fade, correct label | WO-016, WO-017 | WO-019 |
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
| 43 | Hold bands slow but perceptible (creep) | WO-007…WO-011, WO-015 | WO-012 (E-H0) |
| 44 | Scene 1 wedges never overlap or gap mid-morph | WO-007 | WO-012 |
| 45 | JS-off page = opening frame + colophon | WO-001 (noscript style), WO-007 | WO-021 |

---

## Work orders

### WO-001 — Scaffold, frozen contracts and stub pipeline
- **Role / discipline:** integrator / web-platform
- **Depends on:** — (wave 0)
- **Owns (exclusive write):**
  - `package.json`, `package-lock.json`, `.gitignore`, `tsconfig.json`, `playwright.config.js`, `README.md`
  - `scripts/serve.mjs`, `scripts/check-size.mjs`, `scripts/verify.mjs`
  - `site/index.html`, `site/css/base.css`; empty stubs `site/css/chrome.css`, `site/css/colophon.css`, `site/css/scenes/s1.css` … `s6.css`
  - `site/fonts/**`
  - `site/js/types.d.ts`, `site/js/main.js`, `site/js/core/env.js`, `site/js/core/announce.js`
  - stubs `site/js/engine/{engine,layers,hook,ambient,admire,rewind}.js`, `site/js/chrome/{chrome,font-claim}.js`, `site/js/scenes/{index,prism-svg,s1-incidence,s2-field,s3-refraction,s4-dichroic,s4-lut,s4-fallback,s4-contact,s5-agreement,s6-return}.js`
  - `dev/harness.html`, `dev/harness.js`
  - `tests/e2e/smoke.spec.js`
- **Objective:** a runnable, exportable skeleton that every later WO drops code into without touching anyone else's file. It:
  - transcribes architecture §C1–C6 verbatim into `types.d.ts`;
  - creates the C7 DOM skeleton with all §12 copy;
  - implements the stage pin contract (K4) in `base.css`;
  - provides stubs that satisfy the scene interface;
  - provides a dev harness and a stub verify pipeline that already runs every step.
- **Acceptance criteria:**
  - [ ] **Install.** `package.json` has `"type":"module"`, `"private":true`, `engines.node >=22`, and exact devDependencies `@playwright/test 1.63.0`, `playwright-core 1.63.0`, `@axe-core/playwright 4.14.0`, `axe-core 4.14.1`, `pngjs 7.0.0`, `typescript 6.0.2`. `npm ci` succeeds and `npm ls --all` shows one `playwright-core@1.63.0` (paste the output).
  - [ ] **Scripts.** They exist: `dev`, `bake` (calls `scripts/bake-static.mjs`; WO-007 creates it), `typecheck`, `test:static`, `test:unit` (`node --test 'tests/unit/**/*.test.js'`), `test:e2e`, `test:perf`, `check:size`, `verify:quick`, `verify`, `lighthouse` (optional, `npx --yes lighthouse@13.6.0 …`, documented as needing network).
  - [ ] **Server.** `scripts/serve.mjs` serves `site/` at `/` and `dev/` at `/__dev/` with correct MIME types for `.js .css .html .woff2 .svg .json`, 404 on misses, and path traversal refused (`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4173/../package.json` → 404).
  - [ ] **Contracts.** `site/js/types.d.ts` contains §C1–C6 exactly. `npm run typecheck` passes over `site/js`, `dev`, `scripts` and `tests`.
  - [ ] **DOM.** `index.html` matches C7: every id and class listed; `<title>` and meta description from §12; one `<h1>`; six sections with hidden `<h2>`s, `role="img"` art labels and captions; the colophon with the "otherwise" p2 string; the noscript banner and noscript `<style>` (tracks collapsed, `#rewind`, `#jump` and `.colophon-p3` hidden, document height ≤ 100svh + colophon); the Scene 1 bake markers inside `.uv`.
  - [ ] **Font.** `site/fonts/space-grotesk-latin-wght-normal.woff2` is 22,288 B with sha256 `0640890476fc1198ab4de571fb658de443c4d85b66466ec09534a8737ab1ce9d`, next to `OFL.txt` (the full licence from the package) and `SOURCE.md`. `base.css` declares the Space Grotesk face (`font-display: swap`, weight 300 700) and **both** §13.2 fallback faces verbatim. `--font` is set per §13.2 Mode G.
  - [ ] **Pin contract.** `#track` height = `var(--track-h, 1600svh)`; `#stage` is sticky at `top:0` with height `100svh` and `overflow-x: clip`; `.art` ground extends to `100lvh`; no ancestor of `#stage` has `overflow` other than `clip` or `visible`; `.uv` has width `var(--U)` and height `var(--V)`, with `html[data-orient=portrait] .uv { transform: matrix(0,1,1,0,0,0); transform-origin: 0 0 }`. The smoke e2e proves stage top = 0 at y ∈ {0, D/2, D} at 1440×900.
  - [ ] **Focus and scroll.** The focus ring (§9 dual ring, `:focus-visible`) is defined in `base.css`. `html { scroll-behavior: smooth }` applies only under `prefers-reduced-motion: no-preference`.
  - [ ] **Stubs.** Every stub scene exports a `meta` equal to `SCENES[id-1]` (a local literal is allowed until WO-002 lands), `state()` returning a valid `SceneState` with null geometry, and a `mount()` that paints a flat band colour. The stub engine implements the C5 hook shape (minimal is fine), sets `data-boot=ready` and exposes `__showcase.ready`.
  - [ ] **Harness.** `dev/harness.html?scene=N&p=X&amb=A&t=T` mounts scene N full-window via the same `SceneHost` shape and exposes `window.__harness.set(p, a, t)` and `.state()`. It reads `vp` through `core/env.js` and `core/geometry.js` once WO-002 lands.
  - [ ] **Verify stub.** `scripts/verify.mjs` runs steps 0–6 (architecture → Verification strategy) with the preflight version assertions, resolves `EVIDENCE_DIR` per K12, prints a step table and writes `verify-summary.json`. `npm run verify` exits 0 on the skeleton. Missing test directories count as "0 tests", not a failure.
  - [ ] **Size check.** `scripts/check-size.mjs` enforces every payload row of the budget table, exits non-zero over budget (prove this with a temporary 50 KB junk file, then delete it), and writes `size.json`.
  - [ ] **README stub.** It covers what the project is, `npm ci`, `npm run dev`, `npm run verify`, "never `playwright install` in the Bureau sandbox", and a link to the dossier.
- **Verification:** paste `npm ci && npm run verify` output, the `curl` checks, and the smoke e2e result.
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
- **Objective:** a single source for every colour, type, spacing and motion token (§13), every string (§12.1), the frame-accurate placard phrases (§7.5, F2) and the reduced-motion still plan (§10.4).
- **Acceptance criteria:**
  - [ ] `tokens.css` defines every §13.1 token with the exact hex, and every §13.2, §13.3 and §13.5 token. `--wall` and `--wall-deep` switch under `prefers-color-scheme: dark` (D9) and nothing else does.
  - [ ] `tokens.js` mirrors the colours with `rgb` and `Y`. A dev test parses `tokens.css` and asserts the hexes are equal. Computed Y matches §13.1 within 0.01.
  - [ ] **Contrast.** A dev test computes WCAG contrast: chip text ≥ 7:1 on `--chip-dark` composited over the darkest and brightest band and wall tokens (#23 at token level); ink on `--wall` ≈ 17.3:1, and 16.4:1 on the dark wall.
  - [ ] `copy.js` holds every §12.1 string verbatim, in British spelling. `sceneLabel(3)` returns `'03 · Refraction'` and `sceneLabel(3, true)` returns `'03 Refraction'`.
  - [ ] `placardPhrase` implements the §7.5 table: half-open bands with the last one closed. A dev test checks every boundary and every midpoint for all six scenes. `placardLabel(4, 0.62)` returns `'04 · DICHROIC · HELD AT 62%'`. `admireAnnouncement` matches both §7.7 variants exactly.
  - [ ] `stillPlan(p)` gives base 0 on [0, .17], a crossfade 0 → .5 on (.17, .33), .5 on [.33, .67], .5 → 1 on (.67, .83) and 1 on [.83, 1]; `pShown` per C1. Tested at every boundary.
- **Verification:** `node --test 'tests/unit/dev/content/**/*.test.js'` output.
- **Quality notes:** #23, #39, §12.2 claim integrity (no claim string without its condition), §12.3 voice.

### WO-004 — Shared render components (Bands, DotGrid, WhitePoint)
- **Role / discipline:** engineer / rendering
- **Depends on:** — (wave 0; consumes the C1 data shapes only)
- **Owns (exclusive write):** `site/js/components/**`, `dev/components/**`, `tests/e2e/dev/components/**`
- **Objective:** the DOM and SVG renderers for the geometry shared across seams (§21), so that two scenes drawing the same `BandRect[]` or `DotGridState` produce identical pixels.
- **Acceptance criteria:**
  - [ ] **`svg.js`.** `el(tag, attrs, parent)` creates SVG-namespaced or HTML elements; `setAttrs(node, attrs)` writes only changed values.
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
- **Objective:** measure, before anyone builds Scene 4, whether its specified canvas (a jittered triangle lattice of ≤ 950 facets, LUT colour, 0.5 px same-colour stroke, 1 px white edges, bands overlay) holds frame rate here, and pick the D2 fallback level with a written rule.
- **Acceptance criteria:**
  - [ ] A self-contained Playwright script (`spike.mjs`, run with `node`, using the project's or the global playwright 1.63.0) drives 120 rAF frames per configuration, with p and θ changing every frame, and records the rAF-delta p50, p95 and the share of frames over 20 ms (the T-E5 harness), plus the draw-call ms per frame.
  - [ ] Configurations:
    1. 1920×1080 at device DPR 2, canvas capped at 1.5, lattice 72 px;
    2. the same at backing DPR 1;
    3. lattice 80 px (pitch +4);
    4. 1440×900 at DPR 1.5, lattice 64;
    5. 375×812 at DPR 2, lattice 48;
    6. configuration 1 with per-facet OKLCH conversion instead of the LUT (to quantify D2's LUT order).
  - [ ] `results.json` and `results.md` hold every number. A screenshot of each configuration is saved.
  - [ ] **Decision rule** (written in `results.md`): adopt the first configuration in D2 order (spec DPR caps → DPR 1.5 everywhere → pitch +4 → 30 Hz breathing) whose 1920 p95 is ≤ 20 ms and draw is ≤ 6 ms. If none qualifies, file it as a BLOCKED request to the CEO with the numbers.
- **Verification:** `node evidence/spikes/s4-canvas/spike.mjs` output pasted in the report.
- **Quality notes:** SC8 (numbers in evidence), D2.

### WO-006 — Engine: frame loop, layout, layers and test hook
- **Role / discipline:** engineer / engine and performance
- **Depends on:** WO-001, WO-002, WO-003
- **Owns (exclusive write):** `site/js/engine/engine.js`, `site/js/engine/layers.js`, `site/js/engine/hook.js`, `site/js/main.js`, `tests/unit/dev/engine/**`, `tests/e2e/dev/engine/**`
- **Objective:** the single rAF read→compute→write loop (K2, C6) that turns `scrollY` into applied scene frames, owns layout and the pin, keeps the frame across resizes (F8), manages the main, reduced and fallback instances, and exposes `window.__showcase` (C5).
- **Acceptance criteria:**
  - [ ] **Loop.** One passive `scroll` listener. rAF runs only while dirty or while `ambient.active`. An idle page has 0 rAF callbacks over 2 s (proved by counting in the dev e2e). No layout reads inside the frame (code review plus the static guard on scenes).
  - [ ] **Layout.** It measures `#svh-probe` and builds `viewport()` and `trackLayout()`. It writes `--U`, `--V` and `--track-h` (= D + sh, px) and the anchor `top`s in px. `html[data-orient]` follows `vp.landscape`. The stage top is 0 for all y in [0, D] and the colophon starts rising at y = D. Tick anchors land at Y_s within 1 px at all five viewports.
  - [ ] **Layers.** Exactly one `.art` is visible. Inactive sections are `inert`. Switching happens in the write phase of the frame that crosses a seam.
  - [ ] **Hook.** `window.__showcase` implements every C5 member. `snapshot()` and `stateAt()` return JSON-clean deep copies. `nextFrame()` forces a frame. `stateAt(y)` deep-equals the `snapshot()` taken after seeking to y (12 seeded y).
  - [ ] **Scroll origin and events.** `engine.scrollTo(y, origin)` is instant and fires no `userscroll`. `on('frame' | 'scene' | 'layout' | 'userscroll' | 'error')` work per C4.
  - [ ] **Resize (F8).** `G_anchor` updates only on user scroll. Resizing 1440×900 → 375×812 → 1440×900 restores the identical `scrollY`, and the `snapshot()` is deep-equal.
  - [ ] **Reduced motion.** With `prefers-reduced-motion: reduce`, it mounts instances `a` and `b` and applies `stillPlan` (base at opacity 1, over at `overAlpha`). `snapshot().state` = `state(pShown)` and `snapshot().reduced` = the plan. `{state, reduced}` is deep-equal at p .36, .5 and .64 for every scene.
  - [ ] **Errors (F9, §8.3).** A throwing `apply` (proved with a dev-only test scene injected via the harness, never shipped) is caught, pushed once to `errors` as `{scene, phase:'apply', …}`, and that layer switches to its stills. There is no `console.error`, and the `'error'` event is emitted.
  - [ ] **Stats.** `frameStats()` reports engine ms per frame. `bootMs` is recorded.
  - [ ] **Wiring.** `main.js` creates the objects in C4 order and sets `data-boot=ready` after the first applied frame.
- **Verification:** `npx playwright test tests/e2e/dev/engine` output, plus `npm run verify:quick`.
- **Quality notes:** #37, #38, SC2 foundations, §14 "scroll to frame on the next frame".

### WO-007 — PrismSVG, Scene 1 *Incidence* and the baked first frame
- **Role / discipline:** engineer / SVG motion
- **Depends on:** WO-001, WO-002, WO-003, WO-004
- **Owns (exclusive write):** `site/js/scenes/prism-svg.js`, `site/js/scenes/s1-incidence.js`, `site/css/scenes/s1.css`, `scripts/bake-static.mjs`, `site/index.html` (**only the region between `<!-- bake:s1:start -->` and `<!-- bake:s1:end -->`** and the Scene 1 title, plate, subtitle and cue markup; nothing else in wave 1), `tests/unit/dev/s1/**`, `tests/e2e/dev/s1/**`
- **Objective:** build Scene 1 exactly per §4 (prism, beam, glint, 7 wedges with the orientation-preserving straighten lerp, CMY title plates, cue), plus the reusable `PrismSVG` module whose `redraw` mode Scene 6 will drive, and bake `state(0)` into the HTML so the opening frame is art with no JS (§6, F15).
- **Acceptance criteria:**
  - [ ] `state(p, vp)` returns the §4 params (`rot spread split titleOpacity cueOpacity s prismOpacity prismShift`) and derived `wedges[7]` (4 vertices each, in uv px). `geom.bandRects` equals `bandRects(vp)` at p = 1, and `geom.otherOpacity` is 0 at p = 1.
  - [ ] **§15.2 Scene 1 row.** Every `state(0)` and `state(1)` assertion passes in a dev test, including each wedge's 4 vertices equal to the column rect corners at p = 1.
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
  - [ ] **Cost.** Draw p95 in the harness is recorded at 1440 and 1920, within the WO-005 rule.
  - [ ] **Evidence.** Harness screenshots at p 0, .25, .5, .75 and 1 and at the hold band, at 1440×900, 375×812 and 1920×1080 (the hero frame at p .5).
- **Verification:** dev unit and e2e output, the hash comparison, the timing table, and the screenshot paths.
- **Quality notes:** #4 (bands overlay snapped), #8, #9, #41 (light source ≤ 6 px), #43, §14 grin moment 5.

### WO-011 — Scene 5 *Agreement*
- **Role / discipline:** engineer / DOM motion
- **Depends on:** WO-001, WO-002, WO-003, WO-004
- **Owns (exclusive write):** `site/js/scenes/s5-agreement.js`, `site/css/scenes/s5.css`, `tests/unit/dev/s5/**`, `tests/e2e/dev/s5/**`
- **Objective:** Scene 5 per §4. Seven `screen`-blended band divs on ink narrow into beams (`n`), converge with overshoot (`τ`), take hairlines during the colonnade, and are finished by a white overlay (`ov`), so p 1 is exact white.
- **Acceptance criteria:**
  - [ ] `params` are `n tau hair ov`, plus derived `beams[7]` (`centreU`, `width`). `geom.bandRects` at p 0 equals `bandRects(vp)`. `geom.beamRect` at p 1 is `{centreU: U/2, width: beamW, v0: 0, v1: V, color: '#FFFFFF'}` with ground `ink`.
  - [ ] **§15.2 Scene 5 row** passes (beamW 129.6 at 1440, which the spec rounds to 130).
  - [ ] **Overshoot.** At max τ (1.074) the outermost beams pass the centre by 0.35 beam widths; jade (i = 3) never moves. Dev-tested.
  - [ ] **Exact white (#10).** At p 1, every pixel inside the beam rect is `#FFFFFF` at DPR 1 and 2 (dev e2e scan).
  - [ ] **Breathing.** ±4 px sway, alternating direction (9 s); ±1 px edge breathing at p 1.
  - [ ] **Evidence.** Harness screenshots at p 0, .25, .325 (hold), .5, .75 and 1, at 1440×900 and 375×812, plus the 1920 hero at p .5.
- **Verification:** dev unit and e2e output, plus the screenshot paths.
- **Quality notes:** #10, #43, §14 "the click of agreement".

### WO-012 — Test engineering: unit spec suite and static guards
- **Role / discipline:** test-engineer / unit and spec
- **Depends on:** WO-001, WO-002, WO-003 (contracts only; written from the spec, not from scene code)
- **Owns (exclusive write):** `tests/unit/spec/**`, `tests/static/**`
- **Objective:** a legible unit suite that states what "correct animation" means for *Bent Light* in pure functions, plus the mechanical guards that keep the build honest.
- **Acceptance criteria:**
  - [ ] Files are named by contract: `eases.test.js` (U-1), `keys.test.js` (U-2), `endpoints.test.js` (U-3, the whole §15.2 table, all six scenes), `hold-bands.test.js` (U-4 and E-H0: §3.3 rules 1–4, Δp = 1/4000, five viewports), `field-cursor.test.js` (U-5), `placard-phrases.test.js` (U-6, boundaries and midpoints, plus reduced `pShown`), `lut.test.js` (U-7), `seed.test.js` (U-8), `seams.test.js` (the pure §5.2 gate for all five seams at five viewports × DPR 1, 1.5 and 2), `purity.test.js` (100 seeded p, each called twice, deep-equal; `meta` = `SCENES`), `geometry.test.js` (tick G, lattice invariant, centre dot, band sums), `wedges.test.js` (#44), `white-point.test.js` (#41: at most one non-null white point per scene state, r ≤ 3), `still-plan.test.js`, `budgets.test.js` (S4 facet count ≤ 950, backing ≤ 4.67 Mpx).
  - [ ] Every test title reads as a sentence about the piece, e.g. `"Scene 5 ends on one exact white beam, beamW wide, centred"`.
  - [ ] `tests/static/check-static.mjs` implements guards 1–8 (architecture → Verification strategy). Each violation prints `path:line rule`. It exits non-zero on any violation (prove this with a temporary fixture outside `site/`).
  - [ ] Against the wave-0 stubs, the suite runs and fails **only** for missing features, never because of a crash in the test itself (attach the run log with its failure list). As scene WOs land, results are reported to the CEO.
- **Verification:** `node --test 'tests/unit/spec/**/*.test.js'` and `node tests/static/check-static.mjs` output.
- **Quality notes:** #3 (pure gate), #11, #39, #41, #43, #44. Exceptional #7 (legibility).

### WO-013 — Test engineering: e2e infrastructure and animation contracts
- **Role / discipline:** test-engineer / e2e
- **Depends on:** WO-001 (written from the spec; runs against features as they land)
- **Owns (exclusive write):** `tests/e2e/helpers/**`, `tests/e2e/contracts/**`, `playwright.config.js`, `scripts/verify.mjs`
- **Objective:** the shared e2e helpers and the contract specs that prove determinism, reversibility, endpoints, seams, the hook and the pin, and the real verify orchestrator.
- **Acceptance criteria:**
  - [ ] **Helpers:**
    - `seek(page, y)` (instant scroll then `nextFrame()`, with a 2-rAF fallback);
    - `ready(page)` (`__showcase.ready` plus `document.fonts.ready`);
    - `shot(page, name)` (writes into `EVIDENCE_DIR`);
    - `pixels.js` (pngjs: `diff(a, b, {threshold: 8})` returning share and a diff PNG, `meanY64x40`, `redShare`, `pixelAt`);
    - `admireClock.js`, which proves and documents the `page.clock` semantics. The report must include probe output for: rAF frozen while paused; `setTimeout` advanced by `runFor`; whether CSS transitions progress while paused.
    - `svgPlot.js`, for dependency-free line plots.
  - [ ] **Config.** `playwright.config.js` has projects `e2e` (`tests/e2e`, workers 2) and `perf` (`tests/perf`, workers 1), `retries: 0`, `webServer` on 4173 with `reuseExistingServer: !process.env.CI`, default viewport 1440×900 and DPR 1.
  - [ ] **Determinism and reversibility.** `contracts/determinism.spec.js` covers E-D1 (12 seeded y, visiting 4 others between), E-D2 (2 s constant with breathing stored off; the 2 s comes from `expect.poll` on snapshots, never `waitForTimeout`) and E-D3 (30 positions down then up).
  - [ ] **Seams.** `contracts/seams.spec.js` covers E-S1…S5:
    - the in-page state gate via `sceneState(N, 1)` and `sceneState(N+1, 0)`, per §5.2;
    - the pixel tolerance (≤ 0.5% of pixels > 8/255) between y = Y_{N+1} − 1 and y = Y_{N+1}, at 1440×900 and 375×812, DPR 1 and 2;
    - diffs saved to `evidence/seams/`.
  - [ ] **Endpoints and pixel facts.** `contracts/endpoints.spec.js` covers the §15.2 global row (G, label, tick `aria-current`, stage top, colophon at D on `--wall`) and the pixel facts: title black (#2), Scene 5 white (#10), Scene 4 byte-identical across two loads (#9), Scene 3 dispersion (#6), Scene 2 no ground (#5, 5 viewports × 21 p).
  - [ ] **Hook (E-K1).** `contracts/hook.spec.js`: a 40 px wheel from y = 0 gives spread ≥ 10° and split ≥ 3 px, and the screenshot differs on ≥ 1.0% of pixels at > 24/255, at 1440×900 and 375×812. It also checks the C5 shape and that `snapshot().y === scrollY` after `nextFrame()`.
  - [ ] **Resize and pin.** `contracts/resize.spec.js` covers E-R2 (#37). `contracts/pin.spec.js` checks that `#stage` is sticky with top 0 at 9 positions including D, at all five viewports.
  - [ ] **Orchestrator.** `scripts/verify.mjs` is final per architecture: it runs all steps, keeps going after a failure, and its summary lists each E-/U- id with pass or fail.
- **Verification:** `npx playwright test tests/e2e/contracts --reporter=list` output (expected red until scenes land; report which cases are red and why), plus the clock probe output.
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
  - [ ] Every WO-012 unit test for Scenes 1–5 is green, and so are the WO-013 contracts E-D1–D3, E-K1, E-R2, pin and endpoints for Scenes 1–5.
  - [ ] **20 random stops.** At seeded positions across Scenes 1–5 at 1440×900, screenshots go to `evidence/integration-1/random/`. The report lists any frame the integrator judges uncomposed, with a fix or a REQUEST.
  - [ ] **Size and breathing.** `npm run check:size` is green. Breathing is visually verified in each scene by two harness frames 3 s apart (amb.a = 1) whose paths are listed.
  - [ ] **Change log.** Changes to other WOs' modules are listed with the reason in the report, and the original owners are named.
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
- **Objective:** the stillness reward, per §7. The idle timer is armed by the first user scroll and blocked per §7.2. Entry and exit timing follows §7.3–7.6, including the synchronous restore, keeping the default action, and the pause-control guard. The ambient amplitude ramps and decays, the pause persists, and announcements are de-duplicated (F7).
- **Acceptance criteria:**
  - [ ] **Ambient.** It implements `AmbientCtl` per C4: ramp 1,600 ms easeInOutSine, decay 240 ms easeOutCubic, `disabled` under reduced motion (a ≡ 0), and `bentlight.breathing` persisted through `safeStorage` with a default of on.
  - [ ] **Admire.** It implements `AdmireCtl`:
    - **Arming.** Only a user `wheel`, `touchmove`, scroll key or user scrollbar scroll arms it. `userscroll` events count; engine scrolls (resize, rewind) do not.
    - **Reset list.** The §7.1 inputs reset the timer, with `pointermove` counting only after ≥ 4 px of cumulative travel.
    - **Blocks.** Hiding-chrome focus or hover, `rewind.active`, `document.hidden`, and `scrollY > D`.
  - [ ] **Entry at 1,200 ms.** It sets `html[data-admire=on]` and calls `ambient.start`. The live-region text equals `admireAnnouncement(...)` only when the `scene|phraseBand` key changed since the last announcement.
  - [ ] **Placard at 3,000 ms.** It sets `html[data-placard=on]`, a `setTimeout` from the last input.
  - [ ] **Exit.**
    - Inside the event handler, before returning, it sets `data-admire=off` and `data-placard=off` and restores chrome visibility (an inline style removal that chrome CSS honours), so `checkVisibility()` is true in the same task.
    - It never calls `preventDefault`.
    - The `isOnPauseControl` guard: click, Enter or Space on `#pause` toggles and does not exit; Tab or Shift+Tab on it exits.
    - The live region stays silent on exit.
  - [ ] **Resize** exits admire mode and keeps the pause state.
  - [ ] **Dev e2e (page.clock).** Each of the following is checked in the dev e2e under `page.clock` and listed with its result:
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
- **Objective:** every chrome element in §8 in every state (default, hover, focus-visible, active, current, past and future, admire, reduced, rewind, error), driven from the engine's `frame` events with writes only, on chips that guarantee ≥ 7:1 contrast.
- **Acceptance criteria:**
  - [ ] **Rail.** It is vertical at ≥ 1024 (28 px inset, length `clamp(330px, 44svh, 560px)`) and horizontal below. The fill is `scaleY`/`scaleX` = G with the band-order gradient. The leading white point (6 px) reaches each tick exactly at that scene's p 0 (#13).
  - [ ] **Ticks.** 44 × 44 hit boxes at every pointer type with no overlap (#42). Current, past and future marks and key colours per §8 (#14), with `aria-current` updated as seams are crossed. Hover and focus labels flip side below 1024 and never clip (#15). Activation uses native anchors. Focus stays on the tick.
  - [ ] **Scene label.** Tabular figures, a 200 ms cross-fade at seams, the short form below 768, and it never moves the wordmark (#12; measured `getBoundingClientRect` of the wordmark is constant across all six labels, in the dev e2e only).
  - [ ] **Captions (#22).** Scroll-driven cross-fade over the last 3% and first 3% of tracks; never two captions both above 50%.
  - [ ] **Placard (#31, #32).** On `data-placard=on`, chrome fills the placard from `engine.snapshot()` (`placardLabel` plus `placardPhrase` with `pShown` under reduced motion). The CSS hand-off has the caption fading 1 → 0 over 360 ms, then the placard fading 0 → 1 over 900 ms starting 200 ms later. The exit is placard 120 ms and caption 160 ms.
  - [ ] **Admire CSS.** The wordmark, label, rail and ticks fade over 600 ms, then get `visibility: hidden`. Pause dims to 0.55 (1.0 on hover or focus). Under reduced motion the fades are 200 ms.
  - [ ] **Pause control (#20, #21, #35).** Every §8 state, wired to `ambient.setPaused` with an announcement. Under reduced motion it has `aria-disabled="true"`, the dashed outline and the explanatory label, stays focusable, and activation does nothing.
  - [ ] **Other chrome.** The chip theme switches light or dark per scene (light in Scene 1 and in Scene 6 from p .40) with a 240 ms cross-fade. The skip-link focus state is as specified. The error chip shows on the engine `error` event. The rewind status shows in the label slot.
  - [ ] **Font claim (F12).** `font-claim.js` swaps colophon p2 to the Space Grotesk string only after `document.fonts.load('700 1em "Space Grotesk"')` resolves and `document.fonts.check` is true, and sets `html[data-font=loaded]`.
  - [ ] **Evidence.** Dev e2e screenshots of every chrome state listed in §19 ("Chrome states").
- **Verification:** dev e2e output, plus the screenshot paths.
- **Quality notes:** #12, #13, #14, #15, #20, #21, #22, #23, #24, #25, #31, #32, #35, #41 (rail dot), #42.

### WO-018 — Rewind and colophon controls
- **Role / discipline:** engineer / interaction
- **Depends on:** WO-006, WO-003
- **Owns (exclusive write):** `site/js/engine/rewind.js`, `site/css/colophon.css`, `tests/unit/dev/rewind/**`, `tests/e2e/dev/rewind/**`
- **Objective:** "Run it backwards" (§8.1): a rAF-driven 8 s easeInOutSine `engine.scrollTo(…, 'rewind')` to 0, cancelled on the same frame by wheel, keydown, pointerdown, touchstart or touchmove. Also "Jump to the first beam", the reduced-motion rename, and the colophon layout (§12, §13.2 `--type-colophon`).
- **Acceptance criteria:**
  - [ ] **Completion.** It reaches y = 0, moves focus to `#wordmark` and announces "Back at the first beam.". The duration is 8,000 ms (±1 frame) under `page.clock` with `runFor` (fake rAF).
  - [ ] **Cancellation (#26).** It is cancelled within the same frame by each listed input, holds position, and announces "Rewind stopped. You're in {NN} {Scene}." with the correct scene.
  - [ ] **During a rewind (#27).** `html[data-rewind=on]` is set and the chrome stays visible (`rewind.active` is true for admire).
  - [ ] **Reduced motion.** `#rewind` reads "Jump to the first beam" and jumps instantly. `#jump` is hidden. Colophon p3 shows the reduced-motion string.
  - [ ] **Colophon.** `--wall` ground, 70 svh, ink text at 18/1.55, max 52ch. At 375 there is no overflow at 200% zoom.
- **Verification:** dev e2e output.
- **Quality notes:** #26, #27, #30 (colophon ground), §14 grin moment 8.

### WO-019 — Test engineering: behaviour (admire, chrome, ticks, keyboard, rewind, reduced motion)
- **Role / discipline:** test-engineer / e2e behaviour
- **Depends on:** WO-013 (helpers). Written from §7–§10 and §15, independently of WO-016 to WO-018.
- **Owns (exclusive write):** `tests/e2e/behaviour/**`
- **Objective:** prove the stillness reward and the chrome behave exactly as specified, with every timing under `page.clock`.
- **Acceptance criteria:**
  - [ ] **`admire.spec.js`.**
    - E-A1, E-A2 (the live text equals §7.7 exactly), E-A3 (placard at 3,000 ± 50 ms; caption opacity never 0 while the placard is at 0, sampled every 50 ms of clock time), E-A4, E-A5, E-A6, E-A7, E-A8, E-A9, E-A10, E-A11.
    - Placard label correctness at three positions (#31).
    - Placard phrase under reduced motion uses `pShown` (#39).
  - [ ] **`chrome.spec.js`.** #12, #13, #14, #15, #16 (focus on a tick blocks the fade), #21, #22, #42 (E-T1: each tick lands at p 0 ±1 px, `aria-current` updates, 44 × 44 non-overlapping boxes).
  - [ ] **`breathing.spec.js`.** #17 (first-frame delta ≤ 0.2 px or 0.05°, from consecutive `snapshot().ambientA` and scene breathing output), #18 (decays to 0 within 240 ms, no pop > 1 px), #20 (pause survives reload).
  - [ ] **`rewind.spec.js`.** E-R1, #26 and #27.
  - [ ] **`keyboard.spec.js`.** The §9 tab order; ↑ ↓ PageUp PageDown Space Home End scroll natively (scrollY changes; no `preventDefault`, checked via `event.defaultPrevented` in an init script).
  - [ ] **`reduced.spec.js`.** E-M1 (no DocumentTimeline animations after 1 s of quiescence), E-M2 (`{state, reduced}` constant across each still range for every scene), the pause control disabled, ticks jumping instantly.
- **Verification:** `npx playwright test tests/e2e/behaviour --reporter=list` output (red cases listed against their WOs).
- **Quality notes:** #12–#22, #26, #27, #31–#36, #39, #42. SC4, SC5.

### WO-020 — Test engineering: flash audit, perf recording and the evidence pack
- **Role / discipline:** test-engineer / visual and performance
- **Depends on:** WO-013 (helpers)
- **Owns (exclusive write):** `tests/e2e/flash/**`, `tests/e2e/evidence/**`, `tests/perf/**`
- **Objective:** make photosensitivity safety a gate (D6), record performance with numbers (SC8), and capture the §19 screenshot pack (SC9) into the dossier.
- **Acceptance criteria:**
  - [ ] **`flash/profile.spec.js` (E-F1).** 40 samples per scene. Ȳ is the mean linear-light luminance of a 64×40 downscale. Each scene has ≤ 2 direction reversals (hysteresis 0.02). The plot and JSON go to `evidence/flash-audit/`.
  - [ ] **`flash/rewind.spec.js` (E-F2).** The 8 s rewind is recorded per rAF in real time, then replayed at 20 Hz. Any 1 s window has ≤ 4 transitions (|ΔȲ| ≥ 0.10).
  - [ ] **`flash/tick05.spec.js` (E-F3).** From y 0, activate tick 05 and record every rAF until settled. Same window rule. The report states the measured transition count against the predicted 4.
  - [ ] **E-F4.** At every sampled frame, the share of pixels with R/(R+G+B) ≥ 0.8 is ≤ 0.70.
  - [ ] **`evidence/pack.spec.js`.** It writes the full §19 list to `evidence/screens/<group>/<scene>-p<NNN>-<w>x<h>@<dpr>.png`:
    - 60 scene frames; the hold bands; the hook pair; three 1920 heroes; 20 seeded random positions;
    - the admire series with the shimmer pair 6 s apart;
    - reduced-motion stills, the crossfade midpoint and the contact sheet;
    - 768 and 1024 frames; DPR 2 fringe frames (#29);
    - OS dark Scene 1 and colophon.

    An `evidence/screens/index.md` lists every file with its spec reference.
  - [ ] **`perf/scroll.perf.js`.**
    - A 120-tick wheel scroll at 1440×900, 1920×1080 and 375×812.
    - It records rAF-delta p50, p95, max and share over 20 ms; `frameStats` script p50 and p95; CDP LayoutCount, RecalcStyleCount, ScriptDuration and JSHeapUsedSize deltas; LCP; `bootMs`; and the request count.
    - Output goes to `evidence/perf.json` and `perf.md`, with the architecture's budget table filled in as target against measured.
    - It fails only on the guards: script p95 > 12 ms, heap > 60 MB, boot > 1,000 ms.
- **Verification:** `npx playwright test tests/e2e/flash tests/e2e/evidence` and `npm run test:perf` output, plus `ls -R` of the evidence directories.
- **Quality notes:** #7, #8 and #29 (evidence for the critic). §10.1 rules 1–6. §19 in full.

### WO-021 — Test engineering: accessibility, viewports, health, first paint, fonts
- **Role / discipline:** test-engineer / a11y and health
- **Depends on:** WO-013 (helpers)
- **Owns (exclusive write):** `tests/e2e/health/**`
- **Objective:** prove the piece is accessible, error-free, overflow-free, layout-stable and honest at every viewport and in every mode.
- **Acceptance criteria:**
  - [ ] **`axe.spec.js` (E-X1).** `@axe-core/playwright` runs at each scene's hold position plus the colophon, at 375, 768, 1440 and 1920. There are 0 serious or critical violations, and the JSON goes to `evidence/a11y/`.
  - [ ] **`overflow.spec.js`.** `scrollWidth ≤ clientWidth` at those widths across 13 positions, and at 375 with 200% zoom (#25, emulated as a 188 CSS px viewport at DPR 2, documented in the test).
  - [ ] **`health.spec.js` (E-H1).** A full 120-tick wheel scroll-through and back, plus a rewind: `__showcase.errors` deep-equals `[]`, with 0 console errors and 0 `pageerror` (#38). The request count is ≤ 40. The DOM is ≤ 400 elements (≤ 500 under reduced motion).
  - [ ] **`first-paint.spec.js` (E-P1, #1, #45).**
    - With JavaScript disabled against the booted p 0 at 1440×900, < 0.5% of pixels differ at > 8/255, with the noscript banner masked.
    - The JS-off document height is ≤ 100svh + colophon.
    - The noscript text is verbatim.
  - [ ] **`fonts.spec.js` (E-P2, #28).** Routing delays the woff2 by 300 ms. CLS is ≤ 0.01. The title box width differs by ≤ 2% between fallback and loaded. Colophon p2 matches the font state (F12), with a blocked-font route giving the "system" string.
  - [ ] **`contrast.spec.js` (#23).** Chip text against the composited pixels under it is ≥ 7:1 at the Scene 2 saffron plateau, Scene 4 p .5 and Scene 5 p .25.
  - [ ] **`focus.spec.js` (#24).** Focus-ring screenshots on wall, saffron, cobalt, mosaic and ink.
  - [ ] **`storage.spec.js` (#20).** `localStorage` throws via an init script; the page works and breathing defaults to on.
  - [ ] **`scheme.spec.js` (#30).** Under the dark scheme the Scene 6 → colophon wall is continuous, and Scene 1 p 0 uses `#F0EDE7`.
  - [ ] **Unknown hash.** `#nope` opens at the top with no error.
- **Verification:** `npx playwright test tests/e2e/health --reporter=list` output.
- **Quality notes:** #1, #20, #23, #24, #25, #28, #30, #38, #45. SC6, SC7.

### WO-022 — Scene 4 resilience: context-loss fallback and reduced-motion contact sheet
- **Role / discipline:** engineer / canvas
- **Depends on:** WO-010, WO-014
- **Owns (exclusive write):** `site/js/scenes/s4-dichroic.js`, `site/js/scenes/s4-fallback.js`, `site/js/scenes/s4-contact.js`, `site/css/scenes/s4.css`, `tests/unit/dev/s4/**`, `tests/e2e/dev/s4/**`
- **Objective:** §8.3 and §10.4 F17 for Scene 4.
  - With no 2D context or a lost context, the scene shows the Scene 3 shelf in SVG for p < .5 and the seven DOM `Bands` for p ≥ .5, with an opacity crossfade over p .45–.55. It shows the error chip, pushes `{scene: 4, phase: 'context'}`, and redraws on `contextrestored`.
  - Under reduced motion at ≥ 1024, while the middle still shows, a dark chip holds three 128×80 canvases rendered once from `state(.25)`, `state(.5)` and `state(.75)` with the §12 labels.
- **Acceptance criteria:**
  - [ ] **Context loss.** A forced loss (`WEBGL_lose_context` does not apply to 2D, so the dev e2e uses an init-script `getContext` override returning null, plus a dispatched `contextlost`) gives exactly one ledger entry with phase `context`, the fallback visible at p .3 and .7, and no console error. `contextrestored` redraws.
  - [ ] **Contact sheet.** It appears only under reduced motion, at ≥ 1024, for p ∈ [.33, .67]. It is `aria-hidden`, rendered once (a draw counter in the dev e2e), and its labels are verbatim.
  - [ ] **No regressions.** The WO-012 and WO-013 Scene 4 cases still pass.
- **Verification:** dev e2e output, plus screenshots of the fallback and the contact sheet.
- **Quality notes:** §8.3 (honest error state), cut item 5 (the contact sheet may be cut only per §16 order).

### WO-023 — Test engineering: verify hardening
- **Role / discipline:** test-engineer / CI
- **Depends on:** WO-019, WO-020, WO-021
- **Owns (exclusive write):** `scripts/verify.mjs`, `playwright.config.js`, `tests/e2e/helpers/**`, `tests/static/**`
- **Objective:** make `npm run verify` trustworthy: deterministic, within its wall-time budget, and legible.
- **Acceptance criteria:**
  - [ ] **Three clean runs.** `npm run verify` runs 3× back to back on a clean `npm ci` with identical pass and fail sets and 0 flaky cases. Durations are in `verify-summary.json`, and the total is ≤ 8 min per run (if over, the report proposes sampling cuts for a CEO decision).
  - [ ] **Summary.** The summary prints each E-/U- id with its status and maps failures to the owning WO through a table in `verify.mjs`.
  - [ ] **Static guards.** These are added if any were missed. Every file in `tests/e2e/**` has no `waitForTimeout` and no `test.only`.
  - [ ] **README section.** A "What the tests prove" section is drafted for WO-024 (delivered in the report): one line per suite, in plain language.
- **Verification:** three run logs, attached as paths.
- **Quality notes:** SC1, exceptional #7.

### WO-024 — Final integration, README and evidence index
- **Role / discipline:** integrator / frontend
- **Depends on:** WO-014 … WO-023
- **Owns (exclusive write):** every path under `projects/scroll-showcase/` **except** `tests/**`, `scripts/verify.mjs` and `playwright.config.js`; also `bureau/missions/M-0001-scroll-showcase/evidence/README.md`
- **Objective:** ship-ready. Every spec test is green, all budgets are met, the README is complete, and the evidence is indexed for Gate 2.
- **Acceptance criteria:**
  - [ ] `npm ci && npm run verify` exits 0 **three times in a row**. The summaries are saved as `evidence/verify-summary-run{1,2,3}.json`.
  - [ ] **Preloads.** `index.html` lists every shipped module in `<link rel="modulepreload">`. A WO-012 static guard (requested via the CEO if it is missing) checks the list against `site/js/**`.
  - [ ] **README.**
    - what *Bent Light* is; run, verify, controls and keyboard; reduced motion and the pause control;
    - the budget table with measured numbers from `perf.json` and `size.json`;
    - "What the tests prove" (from WO-023);
    - deploy notes (`site/` is the deployable directory, with no server needed; publishing needs the Owner's go-ahead);
    - known environment gaps (real iOS toolbar, touch momentum, real-GPU timing);
    - the font licence; a link to the dossier; a CI snippet for after export.
  - [ ] **Evidence index.** `evidence/README.md` indexes the screens, seams, flash audit, perf, size, a11y and spike, with one line per item and its spec reference.
  - [ ] **Cuts.** No §16 cut is taken without being recorded in the report with its reason. Non-negotiables are all present.
  - [ ] **Clean tree.** There are no `console.log` calls and no dev-only code in `site/`, and `git status` shows only intended files.
- **Verification:** three run logs plus the final `ls` of the evidence directory.
- **Quality notes:** every polish item is re-checked against the coverage table; any item without a passing test or an evidence path is listed in the report.

---

## Board conditions

None yet. This section will list each Gate 1 condition, its resolution and where it now lives in the plan.
