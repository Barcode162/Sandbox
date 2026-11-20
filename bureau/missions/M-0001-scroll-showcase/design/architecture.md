# Architecture: M-0001 *Bent Light* (scroll-driven animation showcase)

Architect · frontend / motion / performance · 2026-11-20 · Revision 2 (Gate 1 conditions V1–V4, E1–E9, R1–R9 folded in; see `plan.md` → Board conditions)
Inputs: `brief.md`, `design/experience.md` (the spec; cited as **§n**), `board/bakeoff-experience.md` (**F1–F17**, **D1–D10**), `intel/technique.md` (**T-En**), `intel/tooling.md`, `intel/references.md` (**P1–P12**), `bureau/playbooks/interactive-web.md`.

Probes I ran for this document live in `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/arch-probe/`, which is throwaway. Their results are quoted where they are used. The probes were:
- **A1.** A clean install of the exact dependency set, which dedupes to a single `playwright-core@1.63.0`.
- **A2.** `tsc --checkJs` against a `.d.ts` contract. It rejects a scene with a wrong `id` type and a missing `params`.
- **A3.** The context-level `reducedMotion: 'reduce'` option plus a `pngjs` decode of a screenshot. Both work.
- **A4.** Whether `page.clock` drives `performance.now()`. It does: `runFor(1300)` advanced it by exactly 1300.
- **A5.** The sticky pin contract, below.
- **A6.** `node --test tests/unit/` **fails** because it treats the directory as a file. The quoted glob `node --test 'tests/unit/**/*.test.js'` passes. This corrects the command recommended in `intel/tooling.md`.
- **A7.** `npm pack` of the font.

Revision 2 (Gate 1 conditions) adds probes in `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/arch-r2/`:
- **A8.** Raw `node:http` requests are **not** normalised: a server echoing `req.url` saw `/../package.json`, `/%2e%2e/package.json`, `/..%2fpackage.json`, `/__dev/../../package.json`, `/%2e%2e%5cpackage.json` and `/%00` verbatim. A raw-request test can therefore exercise the traversal guard, unlike `curl`, which strips dot segments (director-risk probe 4).
- **A9.** `npm pack @fontsource-variable/space-grotesk@5.3.0`: `package/LICENSE` is 4,401 B, sha256 `18a4de52385f6b988782639d5d0cc1326e5a8c2de9a7f01d7b20d9aedcc60943`; the woff2 sha256 re-confirmed as `0640…ce9d`.
- **A10.** From the dossier directory, `node -e "require('playwright')"` resolves the global install (`NODE_PATH=/usr/local/lib/node_modules_global`, version `1.63.0`) and prints `require ok function`. ESM `import` would not (tooling §3c), so the spike is CommonJS.

The Gate 1 board also ran probes that this revision relies on (`board/plan-director-engineering-r1.md`, items 4–6): `page.clock.runFor` does **not** advance CSS transitions while paused, and pausing a `CSSTransition` from `document.getAnimations()` and setting `currentTime` gives exact values (`{0:1, 200:1, 650:0.5, 1100:0}`); Playwright 1.63.0's default `testMatch` does not find `*.perf.js`; a `node --test` glob matching nothing exits 0.

---

## Decisions

| # | Decision | Chosen | Rejected alternatives & why |
|---|---|---|---|
| K1 | Build | **No build step.** Native ES modules served as static files from `site/`. | *Vite or esbuild:* the payload is about 30 KB of JS across about 25 modules, so a bundler buys little and costs a toolchain, a `dist/` and source maps. Brief A1 asks for justification and I found none. Module waterfall cost is handled with `<link rel="modulepreload">` (WO-024). |
| K2 | Animation driver | **One JS rAF loop.** A passive `scroll` listener only sets a dirty flag. Each frame reads `scrollY` once, computes `state(p)` (pure), then writes. | *CSS `animation-timeline`:* it cannot drive canvas, SVG geometry or the placard, and it creates two sources of truth (T-E2). It is not used anywhere. *Scroll-handler positioning:* it janks under async scroll (references §A). |
| K3 | Scroll | **Native scroll only**, with `position: sticky` stages of `100svh` and every clipping ancestor using `overflow: clip`. | *Smooth-scroll library, snap, scrub smoothing:* these break determinism and P2 (§18). `overflow: hidden` silently unpins sticky (references §A). |
| K4 | Pin geometry | **One sticky stage** inside `#track`, whose height is `D + 100svh` and is written in px by the engine. All six scenes are stacked layers inside the stage. Anchor spans sit absolutely at `top: Y_s` px. | *One sticky container per scene:* six pins, and unpin/repin seams at every boundary. *A `margin-top: −100svh` tracks column:* it unpins 100 svh early (§3.2). **Probe A5** at 1440×900, D = 13,500: stage top = 0 at y = 0, 5,000 and 13,500; −200 at y = 13,700; `scrollWidth` 1440 with a 140vw child under `overflow: clip`; `#s5` anchor lands at exactly 9,900. |
| K5 | Portrait | Scenes compute and draw in an abstract **(u, v) box of U × V px** (`.uv`). In portrait the engine sets `html[data-orient=portrait]`, and CSS transposes that box with `transform: matrix(0,1,1,0,0,0)` (origin 0 0). The canvas uses `ctx.setTransform` with the same matrix. | *Per-scene portrait code:* it doubles the geometry and the tests. The transpose is exact and gives "the spectrum always lies along the long axis" (§3.2) for free. Text never lives inside `.uv`, so nothing reads mirrored. Only the inputs differ by orientation (prism centroid and size, shape sizes; §11.1). |
| K6 | Purity | `state(p, vp)` is pure. There is no clock, no `Math.random` and no DOM read. Randomness is mulberry32 with seed `0xB3E7`. A static guard enforces this (WO-012). Time enters only through `apply(state, ambient)`. | *Smoothing or springs:* rejected by §3.5. |
| K7 | Reduced motion | The engine mounts **two instances** (`a`, `b`) of the active scene and drives them from the pure `stillPlan(p)` (§10.4). Scenes do not need to know about reduced motion, except Scene 4's contact sheet. | *Per-scene reduced code paths:* six bespoke implementations of one rule. |
| K8 | Idle detection | A 1,200 ms `setTimeout`, armed by the first user scroll and reset by the §7.1 input list. `scrollend` is ignored. | *`scrollend`:* it fires on every wheel tick headless and never fires for no-op input (T-E3). Using `setTimeout` lets `page.clock` control it. |
| K9 | Font | **Mode G: self-hosted Space Grotesk**, the variable Latin woff2 (22,288 B, OFL-1.1), vendored into `site/fonts/` with its licence. `font-display: swap`, preloaded, with the measured metric-matched fallback faces from §13.2. | *Mode S (system neo-grotesk):* it has zero bytes and zero CLS risk, but here it renders as Liberation Sans and on a Mac as Helvetica, so the piece would look different on every OS. The evidence screenshots would then show a face no Mac visitor sees, and the identity would rest on whatever is installed. Space Grotesk's squared, geometric forms suit "square-cornered, geometric chrome" (§8). 22 KB is well inside budget, and the swap risk is bounded by measured overrides plus a test (E-P2, CLS ≤ 0.01). The file is **vendored, not an npm dependency**: there is no runtime network, and a sha256 pin is checked in verify. |
| K10 | Tests | **`@playwright/test@1.63.0`** for e2e, **`node --test`** for unit, **`@axe-core/playwright`** for a11y, **`pngjs`** for pixel maths in Node, and **`tsc --checkJs`** to enforce the frozen contracts. | *`node --test` plus the global playwright:* it is tied to this image and has no fixtures or `expect.poll` (tooling §3c). *`pixelmatch`:* our diffs are custom (> 8/255 in any channel, Ȳ downscale), so 30 lines over `pngjs` is better. *TypeScript source:* that needs a build. JSDoc plus a `.d.ts` gives the same contract enforcement with none (**probe A2**). |
| K11 | Determinism and timing in tests | Seek with `scrollTo({behavior:'instant'})`, then `await __showcase.nextFrame()`, falling back to 2 rAF. **Determinism is asserted on rendered output:** E-D1/D2/D3/M2 compare `frameHash` (sha256 of decoded screenshot RGBA, 0 differing pixels) and, in Scene 4, `canvasHash`, in addition to state. `page.clock` is used **only** for JS timers and rAF-driven amplitude (`install → goto → pauseAt → runFor`). **CSS transitions are never sampled under the clock** (they run on wall time): their timing is read from `effect.getComputedTiming()` and their curves by pausing each `CSSTransition` and setting `currentTime` (`admireClock.js`). E-D2 uses real time with rAF free-running. `waitForTimeout` is banned in `tests/e2e`. | *Sleeps:* flaky on a 4-CPU box. *State-only determinism:* compares the pure function with itself and misses stale DOM (Gate 1, E6/R3). *Opacity sampling at paused-clock steps:* measures nothing (board probe). |
| K12 | Evidence location | Tests write to `$EVIDENCE_DIR`. `scripts/verify.mjs` takes `SHOWCASE_EVIDENCE_DIR` from the environment if set; otherwise the dossier's `bureau/missions/M-0001-scroll-showcase/evidence/` when that directory exists relative to the project; otherwise `./evidence-local/` (gitignored). | *Hard-coding the dossier path:* it breaks the exported project. |
| K13 | Frame timing | **Measured and recorded**, with only sanity guards about 3× above budget that can fail. | *Hard fps gates:* headless SwiftShader is not a mid-range laptop (T-E5, CEO). |
| K14 | Lighthouse | Optional `npm run lighthouse` (`npx --yes lighthouse@13.6.0`, with `CHROME_PATH=/opt/pw-browsers/chromium`). It is **not** in verify and **not** a devDependency. | *As a devDependency:* 179 MB and noisy (tooling §5). |
| K15 | Seam fallback (D1) | Identity seams are the design. Only the 1→2 and 4→5 seams may switch to the §5.3 crossfade, and only after one failed fix round at both DPRs. That decision belongs to WO-014 and is recorded in its report. | Unlimited sub-pixel chasing. |
| K16 | `index.html` ownership | One owner per wave. Its DOM skeleton (ids and classes below) is a **frozen contract** set in wave 0. Scenes 2–6 build their art DOM in `mount()`. Only Scene 1's art is baked into the HTML (for the JS-off first frame, F15), and that is done by `scripts/bake-static.mjs` between markers, so it cannot drift from `state(0)`. | *HTML partials or includes:* that needs a build. *Many writers to one file:* collisions. |
| K17 | Project CI | None in this repo. The README carries a ready workflow snippet for after export. | A nested `.github/` would never run here and would confuse the repo's CI. |
| K18 | No vacuous green | `verify.mjs` reads results **by id**: every spec test title starts with `[ID]`, and a `MANIFEST` lists every E-id, U-id, `#1`–`#45` and `§19.1`–`§19.14` with its suite and owning WO. `VERIFY_PHASE` ratchets: **0** (WO-001, skeleton: zero counts allowed), **1** (WO-013: per-file and per-suite floors, ≥ 34 E-id e2e tests, perf ≥ 1, skipped/todo fail, `--pass-with-no-tests` forbidden), **2** (WO-023: a missing manifest id or an empty suite fails). Static guard 9 bans skip/fixme/fail/only. | *Exit codes only:* a glob matching nothing exits 0 and `--pass-with-no-tests` exits 0 (board probes). |
| K19 | Dev server | `serve.mjs` binds **127.0.0.1 only**, takes `PORT` and `SITE_DIR`, rejects NUL, backslash and `..` segments (raw or decoded) with 400, and prefix-checks the resolved path. Tested with raw `node:http` requests (A8). | *A library server:* an extra dependency. *Binding all interfaces:* exposes the sandbox. |
| K20 | Proving the suite can fail | `npm run verify:mutants` (outside `verify`) applies literal text patches to a temp copy of `site/`, serves it via `SITE_DIR`, and requires each named case to go red: six mutants covering randomness, a 2 px band edge, the idle token, the `setAttrs` cache, the placard hand-off delay and an injected CSS transition. | *Inside `verify`:* doubles wall time. *Mutation tooling (Stryker etc.):* heavy and unfocused; we need targeted proofs of named cases. |
| K21 | Motion evidence | `npm run evidence:motion` records Playwright `recordVideo` webm files (scroll-through and back, an 8 s admire session, the rewind) to `evidence/motion/`. **Not part of `verify`**, so it adds no flake to the gate. Director-vision proved `recordVideo` works here. | *Frame-sequence GIFs:* larger, lossy timing. *Gating on video:* no meaningful assertion, only flake. |

---

## Stack

Every version below was verified in this session with `npm view <pkg>@<ver> version` (output: `@playwright/test@1.63.0: 1.63.0`, `playwright-core@1.63.0: 1.63.0`, `@axe-core/playwright@4.14.0: 4.14.0`, `axe-core@4.14.1: 4.14.1`, `pngjs: 7.0.0`, `typescript@6.0.2: 6.0.2`, `@fontsource-variable/space-grotesk@5.3.0: 5.3.0`, `lighthouse@13.6.0: 13.6.0`). They were then installed together in a clean directory (**probe A1**: `added 7 packages … in 2s`, 47 MB). `npm ls --all` showed a single `playwright-core@1.63.0`, deduped under both `@axe-core/playwright` and `playwright`.

| Dependency | Exact version | Verified how | Licence | Why |
|---|---|---|---|---|
| Node | ≥ 22 (here v22.23.5) | `node --version` (tooling §1) | MIT | `node:test`, `node:http`, `node:zlib`, ESM |
| `@playwright/test` (dev) | **1.63.0** | `npm view`; probes A3 and A4 ran on it | Apache-2.0 | e2e runner, `page.clock`, `webServer`, screenshots |
| `playwright-core` (dev) | **1.63.0** | `npm view`; dedupe proven in A1 | Apache-2.0 | Explicit pin so axe's peer dependency cannot hoist 1.65.1 (tooling §2). **Any other version fails to launch here** (tooling §3). |
| `@axe-core/playwright` (dev) | **4.14.0** | `npm view`; installed in A1 | MPL-2.0 | axe scans (E-X1) |
| `axe-core` (dev) | **4.14.1** | `npm view`; installed in A1 | MPL-2.0 | Pinned, so the rule set cannot drift under us |
| `pngjs` (dev) | **7.0.0** | `npm view pngjs@7.0.0 license engines` → MIT, node ≥ 14.19; decode proven in A3 (`png 400 300 px0 33 84 216` = `#2154D8`) | MIT | PNG decode for pixel facts, seam diffs and the flash audit |
| `typescript` (dev) | **6.0.2** | `npm view`; `tsc --version` → 6.0.2; A2 caught `TS2322` on a bad scene | Apache-2.0 | `tsc --noEmit --checkJs` enforces the `.d.ts` contracts. 6.0.2 matches the image's pinned toolchain; 7.0.2 (the native rewrite) is rejected as too new. |
| Space Grotesk (vendored file, not a dependency) | from `@fontsource-variable/space-grotesk@5.3.0` | `npm pack` (A7): `files/space-grotesk-latin-wght-normal.woff2` is 22,288 B, **sha256 `0640890476fc1198ab4de571fb658de443c4d85b66466ec09534a8737ab1ce9d`**, licence header "SIL Open Font License, Version 1.1"; `LICENSE` 4,401 B, sha256 `18a4de52385f6b988782639d5d0cc1326e5a8c2de9a7f01d7b20d9aedcc60943` (A9); no Reserved Font Name (director-risk) | OFL-1.1 | Brand face (K9). Shipped with `OFL.txt` (a **byte-identical** copy of the package `LICENSE`, never edited) and a `SOURCE.md` (package, version, both sha256s). Both hashes are checked in verify step 4. Credited in the colophon (`p.colophon-credit`) and the README. |
| `lighthouse` (optional, via `npx`) | 13.6.0 | `npm view` | Apache-2.0 | Optional audit, outside verify (K14) |

There are **no runtime dependencies**. `package.json` has `"type": "module"` and `"private": true`, and every devDependency is pinned exactly. **Never** run `npx playwright install` here. On other machines, run it once: `npx playwright install chromium`.

Setup: `npm ci` · **Run: `npm run dev`** (serves `site/` on `http://127.0.0.1:4173`) · **Verify: `npm run verify`**

---

## Module map

Everything lives under `projects/scroll-showcase/`. The deployable unit is `site/`. `dev/` holds the scene harness and is served only by the dev server, at `/__dev/`.

| Module / path | Responsibility | Owning WO (later fix owner) |
|---|---|---|
| `package.json`, `package-lock.json`, `.gitignore`, `tsconfig.json` | Manifest with exact pins (scripts include `verify:mutants`, `evidence:motion`); `checkJs` over `site/js`, `dev`, `scripts` and `tests` | WO-001 → WO-024 |
| `README.md` | What it is, how to run and verify it, controls, budgets, deploy notes, a link to the dossier | WO-001 (stub) → WO-024 |
| `playwright.config.js` | Projects `e2e` (workers 2) and `perf` (`testMatch: '**/*.perf.js'`, workers 1); `webServer` = `node scripts/serve.mjs` with `PORT`/`SITE_DIR`; `retries: 0` | WO-001 → WO-013 → WO-029 → WO-023 → WO-028 |
| `scripts/serve.mjs` | A zero-dependency `node:http` static server bound to **127.0.0.1 only** (K19). It maps `/` to `SITE_DIR` (default `site/`) and `/__dev/` to `dev/`, sets correct MIME types (`.js` → `text/javascript`, `.woff2` → `font/woff2`), rejects traversal with 400, and returns 404 on misses. Port from `PORT`, default 4173. | WO-001 → WO-024 |
| `scripts/check-size.mjs` | Gzip budgets per type, plus the font's size and sha256 and the `OFL.txt` sha256. Writes `$EVIDENCE_DIR/size.json`. | WO-001 → WO-024 |
| `scripts/verify.mjs` | The verify orchestrator, floors, id manifest and `VERIFY_PHASE` (K18; see Verification strategy) | WO-001 (phase 0) → WO-013 (phase 1) → WO-029 → WO-023 (phase 2) → WO-028 |
| `scripts/mutants.mjs` | `verify:mutants` runner (K20) | WO-001 (stub, exits 2) → WO-023 → WO-028 |
| `scripts/bake-static.mjs` | Renders Scene 1 `state(0)` for the landscape (1440×900) and portrait (375×812) reference viewports into `index.html` between `<!-- bake:s1:start -->` and `<!-- bake:s1:end -->` | WO-007 → WO-014 → WO-025 → WO-024 |
| `site/index.html` | The frozen DOM skeleton (Contracts §C7), all copy (§12), noscript banner and style, preloads | WO-001 → WO-007 (bake region only) → WO-014 → WO-025 → WO-024 |
| `site/fonts/` | `space-grotesk-latin-wght-normal.woff2`, `OFL.txt` (byte-identical to the package `LICENSE`), `SOURCE.md` | WO-001 (→ WO-024, no edits expected) |
| `site/css/tokens.css` | Every §13.1 colour (with the OS-dark `--wall` and `--wall-deep`), §13.2 type tokens, §13.3 spacing, §13.5 motion tokens (incl. `--idle-ms`, `--placard-ms`) | WO-003 → WO-025 → WO-024 |
| `site/css/base.css` | Reset, `@font-face` (Space Grotesk plus both fallback faces), the stage pin, layers, `.uv` and its portrait transpose, the visually-hidden utility, focus ring, noscript collapse, `scroll-behavior` | WO-001 → WO-014 → WO-025 → WO-024 |
| `site/css/chrome.css` | Chips, wordmark, label, rail, ticks, caption and placard slot, pause control, skip link, error chip, every state in §8 | WO-001 (empty) → WO-017 → WO-025 → WO-024 |
| `site/css/colophon.css` | Colophon layout, the credit line and its two buttons | WO-001 (empty) → WO-018 → WO-025 → WO-024 |
| `site/css/scenes/s{1..6}.css` | Scene-local styles | WO-007, 008, 009, 010, 011, 015 → WO-014 (s1–s5) → WO-025 (s1–s3, s5, s6) / WO-022 (s4) → WO-024 |
| `site/js/types.d.ts` | **Frozen contracts** (§C1–C6), transcribed verbatim from this document | WO-001 (CEO-only changes) |
| `site/js/main.js` | Boot: env → ambient → engine → rewind → admire → chrome → `data-boot=ready`; every C4 factory is wired from wave 0 (stubs) | WO-001 → WO-006 → WO-014 → WO-025 → WO-024 |
| `site/js/core/env.js` | `measureViewport`, `prefersReduced`, `safeStorage`, `colorScheme` | WO-001 → WO-014 → WO-025 → WO-024 |
| `site/js/core/announce.js` | Writes to the `#status` live region (clear, then set on the next frame, so repeats are read) | WO-001 → WO-014 → WO-025 → WO-024 |
| `site/js/core/math.js` | `clamp lerp r smooth glide settle lead lin easeInOutSine easeOutCubic keys mulberry32 SEED` | WO-002 |
| `site/js/core/geometry.js` | `SCENES`, `viewport()`, `trackLayout()`, `locate()`, `snap()`, `bandRects()`, `bandRectsFromWeights()`, `dotGrid()`, `shelf()`, `beamW()`, `centre()`, `TICK_G` | WO-002 |
| `site/js/core/tokens.js` | Hex, RGB and Y values of every colour token, mirroring `tokens.css` (a unit test enforces equality) | WO-003 |
| `site/js/core/copy.js` | Every §12.1 string, `sceneLabel(id, short)` | WO-003 |
| `site/js/core/phrases.js` | `placardPhrase`, `placardLabel`, `admireAnnouncement` (§7.4–7.7) | WO-003 |
| `site/js/core/reduced.js` | `stillPlan(p)` (§10.4) | WO-003 |
| `site/js/components/svg.js` | `el(tag, attrs, parent)` SVG/HTML helper; `setAttrs` | WO-004 |
| `site/js/components/bands-dom.js` | The `Bands` DOM component: 7 divs, transforms only, snapped edges | WO-004 |
| `site/js/components/dotgrid-svg.js` | The `DotGrid` SVG component: vertex and fill subsets × ink and white tones as `<pattern>` fills | WO-004 |
| `site/js/components/white-point.js` | The `WhitePoint` component (§3.4) | WO-004 |
| `site/js/engine/engine.js` | Frame loop, layout cache, active layer, scroll origin (`behavior: 'instant'`), resize anchor (compare-before-write), hash handling, events | WO-001 (stub) → WO-006 → WO-014 → WO-025 → WO-024 |
| `site/js/engine/layers.js` | Scene instance management: main, reduced `a`/`b`, error-fallback stills | WO-006 → WO-014 → WO-025 → WO-024 |
| `site/js/engine/hook.js` | `window.__showcase` (§C5) and the `data-*` mirrors | WO-006 → WO-014 → WO-025 → WO-024 |
| `site/js/engine/ambient.js` | Breathing amplitude a(t) (1,600 ms ramp, 240 ms decay), pause state and its persistence | WO-001 (stub `createAmbient`) → WO-016 → WO-025 → WO-024 |
| `site/js/engine/admire.js` | Arming, blocking, entry and exit, placard timer, de-duplicated announcements, the `isOnPauseControl` guard | WO-001 (stub `createAdmire`) → WO-016 → WO-025 → WO-024 |
| `site/js/engine/rewind.js` | "Run it backwards" (8 s, rAF), cancellation, "Jump to the first beam", the reduced-motion rename | WO-001 (stub `createRewind`) → WO-018 → WO-025 → WO-024 |
| `site/js/chrome/chrome.js` | Rail, ticks, scene label, captions, placard rendering, pause control UI, error chip, chip theme | WO-001 (stub `createChrome`) → WO-017 → WO-025 → WO-024 |
| `site/js/chrome/font-claim.js` | The colophon p2 claim gate (F12) | WO-017 → WO-025 → WO-024 |
| `site/js/scenes/index.js` | The registry: `export default [s1, s2, s3, s4, s5, s6]` | WO-001 (frozen) |
| `site/js/scenes/prism-svg.js` | `PrismSVG`: geometry, static markup string, and modes `incidence` and `redraw` | WO-007 → WO-014 → WO-025 → WO-024 |
| `site/js/scenes/s1-incidence.js` | Scene 1 | WO-007 → WO-014 → WO-025 → WO-024 |
| `site/js/scenes/s2-field.js` | Scene 2 | WO-008 → WO-014 → WO-025 → WO-024 |
| `site/js/scenes/s3-refraction.js` | Scene 3 | WO-009 → WO-014 → WO-025 → WO-024 |
| `site/js/scenes/s4-dichroic.js`, `s4-lut.js` | Scene 4 canvas and the OKLCH LUT | WO-010 → WO-014 → WO-022 → WO-024 |
| `site/js/scenes/s4-fallback.js`, `s4-contact.js` | Scene 4 context-loss fallback and the reduced-motion contact sheet | WO-001 (stub) → WO-022 → WO-024 |
| `site/js/scenes/s5-agreement.js` | Scene 5 | WO-011 → WO-014 → WO-025 → WO-024 |
| `site/js/scenes/s6-return.js` | Scene 6 | WO-015 → WO-025 → WO-024 |
| `dev/harness.html`, `dev/harness.js` | Mounts one scene full-window and applies `state(p)`. URL `/__dev/harness.html?scene=3&p=0.5&amb=0&t=0`; exposes `window.__harness.set(p, a, t)` and `.state()` | WO-001 → WO-025 → WO-024 |
| `dev/components/**` | A component gallery page for the shared components | WO-004 → WO-025 → WO-024 |
| `tests/static/check-static.mjs` | Mechanical guards 1–13 (see Verification strategy) | WO-012 → WO-021 → WO-023 → WO-028 |
| `tests/unit/spec/**` | Test-engineer unit suite derived from the spec (U-1…U-8, E-H0, endpoint tables, pure seam gates, asset hashes) | WO-012 → WO-021 → WO-023 → WO-028 |
| `tests/unit/dev/<area>/**` | Each engineer's own unit tests (`serve/` holds the raw traversal test) | the WO for that area; then WO-014 / WO-025 / WO-022 / WO-024; custodians per plan |
| `tests/e2e/helpers/**` | `seek`, `settle`, `snap`, `pixels` (pngjs: diff, Ȳ, 25% window Ȳ, red share), `fingerprint` (`frameHash`, `canvasHash`), `evidence` (paths), `admireClock` (clock semantics, `seekTransitions`, `transitionTiming`), `svgPlot` | WO-013 → WO-019 (additive) → WO-023 → WO-028 |
| `tests/e2e/contracts/**`, `tests/e2e/smoke.spec.js` | E-D1–D3 (rendered), E-S1–S5, E-K1, E-R2, global endpoints, pixel facts, pin, hook | WO-001 (smoke) → WO-013 → WO-019 → WO-023 → WO-028 |
| `tests/e2e/behaviour/**` | E-A1–A11, E-R1, E-T1, E-M1/M2 (rendered), chrome states | WO-019 → WO-023 → WO-028 |
| `tests/e2e/flash/**` | E-F1–F5, frame mean and 25% windows | WO-020 → WO-023 → WO-028 |
| `tests/perf/**` | `boot.perf.js`, `scroll.perf.js`, `scenes.perf.js` | WO-013 → WO-029 → WO-023 → WO-028 |
| `tests/e2e/evidence/**` | Shot list, the §19 pack, `index.md`, `check-index.mjs` | WO-029 (shot list + 60 frames) → WO-026 → WO-028 |
| `tests/motion/**` | `record.mjs` (K21) | WO-026 → WO-028 |
| `tests/mutants/**` | Mutant definitions (K20) | WO-023 → WO-028 |
| `tests/e2e/health/**` | E-X1, E-H1, E-P1, E-P2, no-JS, storage blocked, 200% zoom, dark scheme, malformed hashes, OFL bytes | WO-021 → WO-023 → WO-028 |
| `tests/e2e/dev/<area>/**` | Each engineer's own e2e checks against the harness or the page | the WO for that area; then WO-014 / WO-025 / WO-022 / WO-024 |

**Owner chains.** Any `site/` module whose row stops at a wave-1 owner passes on in later waves exactly as `plan.md` lists: WO-014 (wave 2, Scenes 1–5, engine, core, components), WO-025 (wave 3, everything except Scene 4) or WO-022 (wave 3, Scene 4), then WO-024 (wave 4). `site/js/types.d.ts` is CEO-only after wave 0. The mechanical ownership check is in `plan.md`.

---

## Contracts (frozen at the end of wave 0)

These are transcribed verbatim into `site/js/types.d.ts` by WO-001. Every module annotates itself with them (e.g. `/** @type {import('../types.js').SceneModule} */`), and `npm run typecheck` enforces them. **Changing anything in §C1–C7 after wave 0 is a CEO decision**, recorded in `log.md`.

### C1. Primitive data (all JSON-clean: finite numbers, no `-0`, no DOM refs)

```ts
export type SceneId = 1 | 2 | 3 | 4 | 5 | 6;
export type Slug = 'incidence' | 'field' | 'refraction' | 'dichroic' | 'agreement' | 'return';
export type Bp = 375 | 768 | 1024 | 1440 | 1920;     // by vw: <768→375, <1024→768, <1440→1024, <1920→1440, else 1920

export interface Viewport {
  vw: number;        // documentElement.clientWidth (CSS px)
  sh: number;        // px height of a 100svh probe element (getBoundingClientRect().height)
  dpr: number;       // devicePixelRatio
  landscape: boolean;// vw / sh >= 1
  U: number;         // long axis px  = landscape ? vw : sh
  V: number;         // cross axis px = landscape ? sh : vw
  vmin: number;      // px per 1vmin = min(vw, sh) / 100
  bp: Bp;
  gutter: number;    // 16 | 24 | 32 | 40 | 48 by bp
  pitch: number;     // dot pitch 24 | 24 | 28 | 32 | 36 by bp (cut item 4: round(32·vw/1440) above 1440)
  lattice: number;   // always 2 * pitch (invariant, §11.1)
}

export interface SceneMeta {
  id: SceneId; slug: Slug; name: string;   // name: 'Incidence' …
  track: number;                           // svh: 220, 300, 260, 320, 220, 180
  hold: [number, number];                  // §3.1 signature hold band
  creep: string | null;                    // driving param that creeps in the hold (S6: null)
}

export interface Layout {
  vp: Viewport;
  Y: number[];   // 6 scene start offsets, px: Y[0] = 0, Y[s] = Σ L[<s]
  L: number[];   // 6 lengths, px: L[s] = track[s] * vp.sh / 100 (never dvh)
  D: number;     // Σ L
}

export interface BandRect { u0: number; u1: number; v0: number; v1: number; }   // px, u-edges snapped to device px
export interface DotGridState {
  pitch: number; originU: number; originV: number; r: number;   // r = 2.5
  vertexWhite: number; fillWhite: number; vertexInk: number; fillInk: number;  // opacities
}
export interface WhitePointState { u: number; v: number; r: number; alpha: number; }
export interface ShelfItem { kind: 'tri' | 'cir' | 'dia'; u: number; v: number; size: number; rot: number; } // px, deg
export interface BeamRect { centreU: number; width: number; v0: number; v1: number; color: string; } // '#FFFFFF'

export interface SeamGeom {                       // the §5.2 seam-gate fields; null when absent
  ground: 'wall' | 'bands' | 'cobalt' | 'mosaic' | 'ink';
  bandRects: BandRect[] | null;                   // length 7 when present
  dotGrid: DotGridState | null;
  whitePoint: WhitePointState | null;
  shelf: ShelfItem[] | null;                      // length 3 when present
  channelScales: [number, number, number] | null;
  glassAlpha: number;                             // 0 when no glass
  beamRect: BeamRect | null;
  otherOpacity: number;                           // max opacity of any visible element NOT described above (S1 p=1 ⇒ 0)
}

export interface SceneState {
  scene: SceneId;
  p: number;
  params: Record<string, number>;   // the §4 "Parameters" (driving parameters, §3.3), named exactly as in §4
  geom: SeamGeom;
  [derived: string]: unknown;       // scene-private derived data (JSON-clean)
}

export interface AmbientSample { a: number; t: number; }   // a ∈ [0,1] (ramp/decay/pause applied); t seconds

export interface StillPlan {          // §10.4
  base: 0 | 0.5 | 1;                  // still drawn at opacity 1
  over: 0.5 | 1 | null;               // still drawn on top
  overAlpha: number;                  // r(p,.17,.33) or r(p,.67,.83); 0 in still ranges
  pShown: 0 | 0.5 | 1;                // overAlpha > 0.5 ? over : base
}

export interface ErrorEntry {
  scene: SceneId | null;
  phase: 'boot' | 'mount' | 'state' | 'apply' | 'context' | 'engine' | 'admire' | 'chrome' | 'rewind';
  message: string;
  y: number;
}
```

**Parameter names are part of the contract.** Each scene's `params` uses exactly the names in §4, so tests can reference them.
- S1: `rot spread split titleOpacity cueOpacity s prismOpacity prismShift`. `prismShift` is in px, and so is `split`.
- S2: `A c shear vertexInk fillInk white whitePoint fade`.
- S3: `tri cir dia triRot diaRot`, with positions in **% of U** as in §4 and rotations in degrees.
- S4: `J theta facetAlpha edgeAlpha quant bandsAlpha glassAlpha fillDots vertexDots rho wpAlpha`.
- S5: `n tau hair ov`.
- S6: `widen mix spot draw beam glass card`.

Derived geometry (wedge vertices, band widths, beam rects) goes under extra keys, e.g. `wedges`, `widths` and `beams`.

### C2. Shared pure modules (signatures)

```ts
// core/math.js — all pure
clamp(x, a, b); lerp(a, b, t); r(p, a, b);              // r = clamp((p−a)/(b−a), 0, 1)
smooth(t); glide(t); settle(t); lead(t); lin(t);         // §3.5: smoothstep, easeInOutCubic, easeOutCubic, easeOutQuad, identity
easeInOutSine(t); easeOutCubic(t);
keys(p, [[p0, v0], [p1, v1, ease?], …]);                 // ease applies to the segment ending at that key; default glide
mulberry32(seed): () => number;                          // [0,1)
SEED = 0xB3E7;
fin(x): number;                                          // normalises −0 → 0; throws on non-finite (engine catches)

// core/geometry.js — all pure
SCENES: readonly SceneMeta[];                            // §3.1 order, tracks, hold bands, creep names
COLOPHON_SVH = 70;
TICK_G: readonly number[];                               // [0, 220, 520, 780, 1100, 1320] / 1500
viewport(vw, sh, dpr): Viewport;
trackLayout(vp): Layout;
locate(y, layout): { scene: SceneId; p: number; G: number };   // y ∈ [Y_s, Y_s+L_s) → s; y ≥ D → scene 6, p 1; G = clamp(y/D)
snap(x, dpr): number;                                    // Math.round(x·dpr)/dpr
bandRects(vp): BandRect[];                               // 7 equal full-bleed bands over U×V, cumulative snapped edges
bandRectsFromWeights(w: number[], vp): BandRect[];       // normalised to U; edges = snap(cumulative)
dotGrid(vp): Pick<DotGridState,'pitch'|'originU'|'originV'|'r'>;  // a VERTEX dot lies exactly at (U/2, V/2); vertex pitch = lattice
shelf(vp): ShelfItem[];                                  // tri .25U, cir .50U, dia .75U; v = V/2; rot 0; sizes per §4 S3 (vmin), portrait per §11.1
beamW(vp): number;                                       // max(0.09·U, 32)
centre(vp): { u: number; v: number };                    // (U/2, V/2)

// core/reduced.js
stillPlan(p): StillPlan;

// core/phrases.js
placardPhrase(scene: SceneId, p: number): { index: number; text: string };   // §7.5 bands, [a,b) with last band closed
placardLabel(scene: SceneId, G: number): string;          // `04 · DICHROIC · HELD AT 62%`, Math.round(100·G)
admireAnnouncement(scene: SceneId, phrase: string, breathing: boolean): string;  // §7.7 exact text

// core/copy.js
COPY: { title, metaDescription, h1, subtitle, cue, skip, navLabel, sceneNames[6], captions[6], artLabels[6],
        pause: { on, paused, reduced }, status: {...}, rewind: {...}, contactSheet[3], colophon: {...}, noscript, errorChip };
sceneLabel(id: SceneId, short?: boolean): string;         // '03 · Refraction' | '03 Refraction'

// core/tokens.js
TOKENS: Record<string, { hex: string; rgb: [number, number, number]; Y: number }>;  // keys = CSS names without '--'
BANDS: readonly string[];                                 // 7 band hexes in order

// core/env.js
measureViewport(win, probe: HTMLElement): { vw: number; sh: number; dpr: number };
prefersReduced(win): boolean;
safeStorage: { get(key): string | null; set(key, value): void };   // try/catch, never throws
```

### C3. Scene module interface

```ts
export interface SceneHost {
  section: HTMLElement;     // <section class="scene" data-scene=N>
  art: HTMLElement;         // its .art (role=img); full-stage box
  uv: HTMLElement;          // .uv inside art: U×V px box, transposed in portrait by CSS (K5)
  vp: Viewport;
  instance: 'main' | 'a' | 'b';               // ids inside SVG must be suffixed with scene+instance
  reportError(phase: ErrorEntry['phase'], err: unknown): void;
  reduced: boolean;
}
export interface SceneView {
  apply(state: SceneState, amb: AmbientSample): void;  // WRITES ONLY. No layout reads. amb.a == 0 ⇒ exactly state's frame.
  resize(vp: Viewport): void;                           // rebuild size-dependent DOM; next apply follows
  destroy(): void;
}
export interface SceneModule {
  meta: SceneMeta;                                      // must equal SCENES[id-1]
  state(p: number, vp: Viewport): SceneState;           // PURE (K6). p clamped to [0,1] by caller.
  mount(host: SceneHost): SceneView;                    // may be called up to 3× (main, a, b)
}
```

**Rules every scene obeys:**
- Only `transform`, `opacity`, SVG geometry attributes or canvas draws change per frame. There is no `width`, `height`, `top` or `left` per frame.
- Custom properties are set on the scene's own elements, never on `:root` (T-E4).
- `apply` with `amb.a = 0` renders exactly `state`. Breathing (§7.8) is additive and amplitude-scaled.
- A scene never reads `window`, `scrollY` or layout. Everything comes from `vp`.
- Scene 4 redraws only when `p` or `amb` changes.
- A `state(p)` call stays ≤ 0.5 ms at 1440, and `apply` ≤ 3 ms (Scene 4 ≤ 6 ms), measured in the harness.

### C4. Runtime objects (created in `main.js`, in this order)

```ts
export interface AmbientCtl {                       // engine/ambient.js  createAmbient({ reduced, storage })
  sample(now: number): AmbientSample;               // now = rAF timestamp / performance.now()
  start(now: number): void;                         // ramp 0→1 over 1600 ms easeInOutSine
  stop(now: number): void;                          // decay →0 over 240 ms easeOutCubic
  readonly active: boolean;                         // a > 0 (engine keeps rAF running while true)
  readonly paused: boolean; setPaused(v: boolean): void;   // persisted 'bentlight.breathing' = 'on'|'off'
  readonly disabled: boolean;                       // reduced motion ⇒ true, a ≡ 0
  on(evt: 'change', fn: () => void): () => void;
}
export interface Engine {                           // engine/engine.js  createEngine({ scenes, doc, win, reduced, ambient })
  readonly layout: Layout;
  snapshot(): Snapshot; stateAt(y: number): Snapshot; sceneState(id: SceneId, p: number): SceneState;
  scrollTo(y: number, origin: 'resize' | 'rewind' | 'jump'): void;   // instant; engine-originated
  invalidate(): void;                               // request a frame
  reportError(e: Omit<ErrorEntry, 'y'>): void;      // push to ledger (dedupe scene+phase+message), emit 'error'
  on(evt: 'frame', fn: (s: Snapshot) => void): () => void;      // after scene apply, same rAF, write phase
  on(evt: 'scene', fn: (now: SceneId, prev: SceneId) => void): () => void;
  on(evt: 'layout', fn: (l: Layout) => void): () => void;
  on(evt: 'userscroll', fn: (y: number) => void): () => void;   // scroll events NOT caused by engine.scrollTo
  on(evt: 'error', fn: (e: ErrorEntry) => void): () => void;
  bootMs: number;
}
export interface RewindCtl {                        // engine/rewind.js  createRewind({ engine, announce, reduced, doc })
  readonly active: boolean; start(): void; stop(reason: 'input' | 'done'): void;
  jumpToStart(): void; on(evt: 'change', fn: () => void): () => void;
}
export interface AdmireCtl {                        // engine/admire.js  createAdmire({ engine, ambient, rewind, announce, doc, win, reduced })
  readonly armed: boolean; readonly mode: 'on' | 'off'; readonly placard: boolean;
  on(evt: 'change', fn: (s: { mode: 'on' | 'off'; placard: boolean }) => void): () => void;
}
// chrome/chrome.js  createChrome({ engine, admire, ambient, rewind, announce, doc, reduced }): void
```

### C5. Test hook (`window.__showcase`, engine/hook.js)

```ts
export interface Snapshot {
  y: number; G: number; scene: SceneId; p: number;
  state: SceneState;                 // reduced: state(pShown); normal: state(p)
  reduced: StillPlan | null;
  admire: 'on' | 'off';
  ambientA: number;                  // amplitude used for this frame (0 unless admiring)
}
export interface ShowcaseHook {
  readonly version: 1;
  readonly ready: Promise<void>;                   // resolves after the first applied frame
  readonly errors: ErrorEntry[];                   // F9 ledger; must stay [] in a healthy run
  progress(): { y: number; G: number; scene: SceneId; p: number };
  snapshot(): Snapshot;                            // the frame last APPLIED (deep copy, JSON-clean)
  stateAt(y: number): Snapshot;                    // pure prediction at y (ambient 0), no scrolling
  sceneState(id: SceneId, p: number): SceneState;  // pure, current viewport (seam gates)
  layout(): Layout;
  nextFrame(): Promise<Snapshot>;                  // resolves after the next applied frame (forces one)
  frameStats(): { frames: number; scriptMs: number[] };  // ring buffer, last 600 frames of engine work
}
```

The hook is read-only. Tests control breathing only through real UI or storage (`localStorage['bentlight.breathing']='off'` before `goto`), and time only through `page.clock`.

**`data-*` mirrors (written in the frame):**
- On `html`: `data-boot` (`pending` → `ready`), `data-orient` (`landscape` or `portrait`), `data-reduced` (`true` or `false`), `data-admire` (`on` or `off`), `data-placard` (`on` or `off`), `data-font` (`fallback` or `loaded`), `data-rewind` (`on` or `off`).
- On `#stage`: `data-scene` and `data-p` (4 decimals).

### C6. Events and timing rules

- **The frame** (engine) runs in this order:
  1. **Read:** `scrollY` once, plus cached layout; nothing else.
  2. **Compute:** `locate` → `state` → `stillPlan` → `ambient.sample(ts)`.
  3. **Write:** layer visibility and `inert` when the scene changes; `view.apply` for the main instance, or the `a`/`b` instances; then the `'frame'` listeners (chrome) in the same task.
- **Layout reads.** Only `engine.js` reads layout, and only on boot, on `resize`, and through `ResizeObserver(documentElement)`. On a resize it remeasures and writes `--U`, `--V`, `--track-h` and the anchor `top`s **only where the value changed** (so the observer cannot loop), then `scrollTo(round(G_anchor·D′), 'resize')`.
- **Engine scrolls are instant.** `engine.scrollTo` calls `window.scrollTo({ top: y, behavior: 'instant' })` explicitly, because `html { scroll-behavior: smooth }` would otherwise animate resize restores and rewind steps and break the scroll-origin rule.
- **Hashes.** `location.hash` is never passed to `querySelector`; lookups use `getElementById(decodeURIComponent(…))` inside `try` (static guard 13).
- **The rAF loop** runs only while dirty or while `ambient.active`. An idle page spends no CPU.
- **Scroll origin.** `engine.scrollTo` records `{y, frame}`. A `scroll` event that lands within 1 px of that `y`, no more than 2 frames later, is engine-originated: it fires no `userscroll`, does not update `G_anchor`, and is ignored by admire. Every other scroll fires `userscroll` and updates `G_anchor`.
- **Admire timers** use `setTimeout` (`--idle-ms` 1200, `--placard-ms` 3000, read from `tokens.css` once at boot), so `page.clock` drives them. Chrome fades are CSS transitions keyed off `html[data-admire]` and `html[data-placard]`; they run on wall time, so tests read their computed timing and seek them (K11), never sample them under the clock.
- **No `preventDefault`** anywhere in `site/js` (§7.6, §9). This is a static guard.

### C7. DOM skeleton (frozen ids and classes in `site/index.html`)

```html
<html lang="en-GB" data-boot="pending" data-admire="off" data-placard="off" data-font="fallback" data-rewind="off">
<head> … <link rel="preload" href="fonts/space-grotesk-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/tokens.css"> base.css chrome.css colophon.css scenes/s1.css … s6.css
  <script type="module" src="js/main.js"></script> </head>
<body>
  <a class="skip-link chip chip--dark" href="#colophon">Skip to the colophon</a>
  <noscript> <p class="noscript chip chip--dark">…</p> <style>/* collapse #track, hide #rewind #jump .colophon-p3 */</style> </noscript>
  <header id="chrome" class="chrome">
    <a id="wordmark" class="wordmark" href="#incidence">Bent Light</a>
    <span id="scene-label" class="scene-label">01 · Incidence</span>
    <div id="rail" class="rail" aria-hidden="true"><span class="rail-track"></span><span class="rail-fill"></span><span class="rail-dot"></span></div>
    <nav id="ticks" aria-label="Scenes"><ol>
      <li><a class="tick" href="#incidence" data-scene="1" aria-current="true"><span class="tick-mark"></span><span class="tick-label">01 Incidence</span></a></li> … ×6
    </ol></nav>
  </header>
  <button id="pause" class="pause" type="button" aria-pressed="false"><span class="pause-glyph"></span><span class="pause-label">Pause breathing</span></button>
  <div id="placard" class="placard" aria-hidden="true"><p class="placard-label"></p><p class="placard-phrase"></p></div>
  <p id="error-chip" class="error-chip chip chip--dark" hidden>This scene couldn't draw on this device, so you're seeing its still.</p>
  <div id="status" class="vh" role="status" aria-live="polite"></div>
  <main id="piece">
    <div id="track">
      <span class="anchor" id="incidence"></span> … <span class="anchor" id="return"></span>
      <div id="stage" class="stage">
        <span id="svh-probe" aria-hidden="true"></span>
        <section class="scene" id="scene-incidence" data-scene="1" aria-labelledby="h-incidence">
          <h2 class="vh" id="h-incidence">01 Incidence</h2>
          <div class="art" role="img" aria-label="…art label 1…"><div class="uv"><!-- bake:s1:start --><!-- bake:s1:end --></div>
            <h1 class="title">Bent Light</h1><span class="plate plate--c" aria-hidden="true">Bent Light</span> (m, y)
            <p class="subtitle">Six refractions of one white beam.</p><p class="cue" aria-hidden="true">Scroll to bend the light</p></div>
          <p class="caption">White light is every colour, waiting for an angle.</p>
        </section>
        … sections 2–6 with empty <div class="uv"></div>
      </div>
    </div>
  </main>
  <footer id="colophon" class="colophon"><h2 tabindex="-1">Colophon</h2><p class="colophon-p1">…</p>
    <p class="colophon-p2" data-claim="font">…otherwise string…</p><p class="colophon-p3">…</p>
    <button id="rewind" class="chip-button" type="button">Run it backwards</button>
    <button id="jump" class="chip-button" type="button">Jump to the first beam</button>
    <p class="colophon-credit">The Space Grotesk typeface ships with this page under the SIL Open Font License 1.1, © 2020 The Space Grotesk Project Authors.</p></footer>
</body>
```

**Colophon credit (Gate 1, R7).** `p.colophon-credit` is unconditional (the font file always ships, whichever face renders), so it does not conflict with the F12 claim gate on p2. Its wording is pending experience-designer confirmation before the wave-0 freeze; the element is frozen either way.

**Layer visibility.** Inactive scenes get `.art { visibility: hidden }` and `section[inert]`. Captions are siblings of `.art`, so chrome can cross-fade two captions across a seam (§8) while only one art layer is visible.

---

## State & data flow

```
input (wheel/keys/touch/scrollbar/ticks) ──native──▶ window scroll ──passive──▶ engine.dirty = true
                                                            │ (userscroll unless engine-originated) ──▶ admire.resetIdle()
rAF(ts) ─▶ READ y=scrollY ─▶ locate(y, layout) → {scene, p, G}
        ─▶ COMPUTE  s = SCENES[scene].state(p, vp)            (pure; reduced ⇒ stillPlan(p) → state(base)/state(over))
                    amb = ambient.sample(ts)                   (0 unless admiring)
        ─▶ WRITE    layers: visibility/inert on scene change → view.apply(s, amb) [a/b + opacity under reduced]
                    hook.last = snapshot;  data-scene/data-p
                    emit 'frame' → chrome: rail scale, tick states, label, caption opacities (no reads)
admire: setTimeout 1200 after last input (armed, not blocked) → data-admire=on → ambient.start → announce
        setTimeout 3000 → data-placard=on (chrome fills placard text from engine.snapshot())
        any input → synchronous: chrome visibility restored, data-admire=off, ambient.stop (240 ms decay)
resize → engine READ measure → viewport() → trackLayout() → WRITE CSS vars → view.resize() → scrollTo(round(G_anchor·D′),'resize')
rewind → rAF scrollTo(y(t),'rewind') for 8 s (easeInOutSine); cancelled by wheel/keydown/pointerdown/touch*
```

**State ownership:**
- `scrollY` is the only animation state, and the browser owns it.
- The engine owns `layout`, `G_anchor`, the active scene and `lastSnapshot`.
- Ambient owns `a(t)` and `paused`.
- Admire owns `armed`, `mode`, `placard` and `lastAnnouncedKey`.
- Rewind owns `active`.
- Nothing else holds state. Scenes are stateless apart from DOM handles.

---

## Performance budgets

| Budget | Target | How it is measured here | Gate? |
|---|---|---|---|
| JS payload | **≤ 40 KB gzip** total over `site/js/**/*.js` (spec estimate 30) | `scripts/check-size.mjs` (`zlib.gzipSync`, level 9) → `size.json` | **fail** |
| CSS payload | ≤ 12 KB gzip | same | **fail** |
| HTML (with the baked Scene 1 SVG) | ≤ 16 KB gzip | same | **fail** |
| Font | exactly 22,288 B, sha256 `0640…ce9d` | same | **fail** |
| First-load transfer (all of the above) | ≤ 95 KB | same (sum) | **fail** |
| Requests on load | ≤ 40 | e2e counts `page.on('request')` (health) | **fail** |
| DOM size | ≤ 400 elements normal, ≤ 500 under reduced motion (spec: < 250 + 100 + 3 canvases) | e2e `document.querySelectorAll('*').length` | **fail** |
| Animated nodes in the active scene | ≤ 1,000 (design ≈ 30) | review; S4 facet count ≤ 950 in unit test | **fail** (facets) |
| Scene 4 canvas backing | ≤ 4.67 Mpx (DPR ≤ 1.5 at ≥ 1440, ≤ 2 below) | unit test on the backing size from `vp` | **fail** |
| CLS | ≤ 0.01, with the font response delayed 300 ms | `PerformanceObserver('layout-shift')` (E-P2) | **fail** |
| Scroll → frame | the frame for y is applied on the next rAF | `nextFrame()` after `scrollTo` gives `snapshot().y === scrollY` (contracts) | **fail** |
| Engine script per frame | target p95 ≤ 4 ms at 1440 (S4 ≤ 7 ms); **guard 12 ms** | `frameStats().scriptMs` (performance.now around the frame work; JS only, excludes style, layout, paint and raster), 120-tick wheel scroll | guard only |
| Per-scene `state` / `apply` | `state` ≤ 0.5 ms, `apply` ≤ 3 ms (S4 ≤ 6 ms, **flushed**) p95, every scene | harness, 120 frames per scene (`scenes.perf.js`, WO-029); S4 draw flushed with `getImageData(0,0,1,1)` so deferred rasterisation is counted | recorded |
| Frame interval during a scripted scroll | target median ≤ 17.5 ms, p95 ≤ 20 ms at 1440×900 and 1920×1080 | rAF deltas (T-E5 harness) → `perf.json` | **recorded** (K13) |
| Layout and style work during scroll | target 0 forced layouts in frame | CDP `Performance.getMetrics` LayoutCount/RecalcStyleCount deltas per frame → `perf.json` | recorded |
| Boot | first applied frame ≤ 150 ms after module eval; guard 1,000 ms | `engine.bootMs` | guard only |
| LCP | ≤ 1.0 s on local serve | `PerformanceObserver('largest-contentful-paint')` → `perf.json`; Lighthouse optional | recorded |
| JS heap after a full scroll-through | ≤ 20 MB; guard 60 MB | CDP `JSHeapUsedSize` | guard only |
| Verify wall time | ≤ 8 min on this 4-CPU box | `verify-summary.json` step durations | recorded |

Scene 4 starts at the D2 configuration. WO-005 measures it (rAF-delta p95 **and flushed draw p95**) and may lower it (DPR 1.5 everywhere, then pitch +4 px, then 30 Hz breathing), and WO-010 adopts the result.

**What these numbers measure and do not.** They come from headless Chromium 1.63.0's shell with SwiftShader software raster in this container. rAF deltas are not a display refresh rate, and `scriptMs` is engine JS only. They are a conservative floor, not a laptop claim; the README and the delivery report state no fps figure beyond them (static guard 12).

---

## Verification strategy

**`npm run verify`** runs `node scripts/verify.mjs`, which:
1. runs the steps below in order, and keeps going after a failure, so one run shows everything;
2. prints a step table and a per-id table (pass / fail / missing, with the owning WO);
3. writes `$EVIDENCE_DIR/verify-summary.json` (step, status, duration, counts per suite and per id, skipped count, `VERIFY_PHASE`, bytes and file counts of `evidence/screens/` and `evidence/motion/`);
4. exits non-zero if any gating step fails.

| # | Step | Command | Gates |
|---|---|---|---|
| 0 | preflight | in-process: `playwright-core`, `playwright` and `@playwright/test` resolve to **1.63.0**; Node ≥ 22; `EVIDENCE_DIR` resolved and created; `VERIFY_PHASE > 0` ⇒ no `--pass-with-no-tests` anywhere in the step table | yes |
| 1 | typecheck | `tsc -p tsconfig.json` (`allowJs`, `checkJs`, `noEmit`, `module` and `moduleResolution` `nodenext`, `lib` es2022+dom; relative imports carry `.js`) | yes |
| 2 | static guards | `node tests/static/check-static.mjs` (guards 1–13) | yes |
| 3 | unit | `node --test --test-reporter=tap 'tests/unit/**/*.test.js'` (quoted glob, **probe A6**); TAP parsed per file and per id | yes |
| 4 | size and assets | `node scripts/check-size.mjs` (budgets; woff2 sha256 `0640…ce9d`; `OFL.txt` sha256 `18a4…0943`) | yes |
| 5 | e2e | `playwright test --project=e2e --reporter=json,list` (contracts, behaviour, health, flash, evidence, smoke, dev specs); JSON parsed for counts, ids and `stats.skipped` | yes |
| 6 | perf | `playwright test --project=perf --workers=1 --reporter=json,list`: records `perf.json` and `perf.md`; only the guards fail | guards + floor |
| 7 | evidence index | `node tests/e2e/evidence/check-index.mjs` (from WO-023 on): every §19 bullet has a file, including cross-suite bullets | yes |
| — | floors and manifest | in-process after steps 3–7, per `VERIFY_PHASE` (below) | yes |

`npm run verify:quick` runs steps 0, 1, 2, the dev unit tests (`tests/unit/dev/**`) and step 4 in seconds, and prints the unit spec suite's result without gating on it. It is what engineers run while building.

**Separate, non-gating commands.** `npm run verify:mutants` (K20, WO-023) and `npm run evidence:motion` (K21, WO-026) are never part of `verify`.

**No vacuous green (K18).** Every spec test title starts with its id(s) in brackets. `verify.mjs` holds:
- `UNIT_SPEC_FILES`: the 16 file names in WO-012;
- `MANIFEST`: every E-id (33 in §15.3 for e2e, plus E-F5), E-H0 and U-1…U-8 (unit), `#1`–`#45` and `§19.1`–`§19.14`, each with its step, suite and owning WO;
- `FLOORS` and `VERIFY_PHASE`:

| Phase | Set by | Rules |
|---|---|---|
| 0 | WO-001 | Skeleton. Zero-test steps allowed; `--pass-with-no-tests` only on the perf step. |
| 1 | WO-013 | Each `UNIT_SPEC_FILES` entry exists and contributes ≥ 1 test; `tests/unit/dev` ≥ 1; e2e has ≥ 34 tests carrying a §15.3/E-F5 id; perf ≥ 1. Any skipped, todo or fixme test fails its step (TAP `# skip`/`# todo`, Playwright `stats.skipped`). `--pass-with-no-tests` is forbidden (asserted in code). Missing manifest ids are listed as `missing`, not fatal. |
| 2 | WO-023 | Phase 1, plus: any manifest id with no test, and any suite (unit spec, contracts, behaviour, health, flash, evidence, perf) with 0 tests, fails verify. WO-024 must be green 3× at phase 2. |

Phase 1 already fails an empty or missing suite directory through the floors, so the original "missing directory counts as 0 tests" allowance ends at WO-013, earlier than Gate 1 required (end of WO-014).

**Static guards (step 2).** Each is a check over files, and each failure prints `path:line rule`.
1. CSS has no `overflow: hidden|auto|scroll` and no `vh` or `dvh` units. Only `svh` and `lvh` are allowed.
2. `site/js/{core,components,scenes}/**` has no `Math.random`, `Date.now`, `performance.now` or `new Date`.
3. `site/js/{components,scenes}/**` has no `getBoundingClientRect`, `offset*`, `client*`, `getComputedStyle`, `scrollY`, `innerWidth` or `innerHeight`.
4. `site/js/**` has no `preventDefault`, `console.error`, `console.warn` or `console.log`.
5. `site/**/*.{html,css,js,svg}` has no `http(s)://` URLs, except the W3C SVG/XLink namespaces. (`site/fonts/OFL.txt` and `SOURCE.md` are out of scope; the licence is never edited to satisfy a guard.)
6. `tests/e2e/**` has no `waitForTimeout`.
7. `site/js/scenes/index.js` exports 6 modules, and each `meta` equals `SCENES`.
8. Scene files contain no `localStorage`.
9. `tests/**` has no `test.skip`, `test.fixme`, `test.fail`, `describe.skip`, `test.describe.skip`, `it.skip`, `.only(`, `{ skip:` or `{ todo:`.
10. `tests/e2e/health/axe.spec.js` has no `disableRules` or `.exclude(` unless each rule or selector is in `tests/e2e/health/axe-exceptions.json` with a non-empty `reason`.
11. Every module under `site/js/**/*.js` appears exactly once as `<link rel="modulepreload">` in `site/index.html`, and every preload resolves to a file (WO-023).
12. `README.md` contains no `\d+\s?fps` claim (WO-023).
13. `site/js/**` never passes `location.hash` to `querySelector` or `querySelectorAll`.

**Unit (step 3).**
- **Spec suite** (`tests/unit/spec`, WO-012): U-1…U-8; E-H0 hold-band rules 1–4 at Δp = 1/4000 for all six scenes at all five viewports; the §15.2 endpoint table; **pure seam gates**, i.e. `sNext.state(0).geom` against `sPrev.state(1).geom` for the §5.2 fields, within 0.01 px or 1e-6, at all five viewports and at DPR 1, 1.5 and 2; geometry invariants (Σ band widths = U, lattice = 2·pitch, a vertex dot at the centre, `TICK_G`); purity (100 random p, each called twice, deep-equal); `stillPlan`; phrases at every boundary and midpoint; `tokens.js` = `tokens.css`; font and `OFL.txt` sha256 (`assets.test.js`).
- **Dev suites** (`tests/unit/dev/*`): each engineer's own tests, including `serve/traversal.test.js` (raw `node:http`, six traversal paths → 400/404, bound to 127.0.0.1).

**E2E (step 5).**
- **contracts** (WO-013): E-D1, E-D2, E-D3 **on rendered output** (`frameHash` of decoded RGBA, 0 px tolerance unless a justified tolerance is stated and logged; `canvasHash` in Scene 4; E-D2's second capture after ≥ 2 s of real time with ≥ 60 rAF frames), E-S1–S5 (state gate in the page plus pixel tolerance at 1440×900 and 375×812, DPR 1 and 2; diffs to `evidence/seams/`), E-K1, E-R2, global endpoints (§15.2 last row), pixel facts (title black, S5 white inside the beam rect inset by one device pixel, S4 byte-identical across two loads), the pin contract, and the hook's shape including `stateAt(y)` = `snapshot()` after seeking.
- **behaviour** (WO-019): E-A1–A11 (timers by clock, fades by seeking), E-R1, E-T1, E-M1/M2 (M2 rendered, chrome masked), chrome state assertions.
- **health** (WO-021): E-X1 (axe serious and critical, overflow at 375, 768, 1440 and 1920, and 375 at 200% zoom), E-H1, E-P1, E-P2, no-JS, `localStorage` throwing, dark scheme continuity, malformed hashes, OFL bytes served.
- **flash** (WO-020): E-F1–F5 by record-then-replay. Recording logs `scrollY` every rAF in real time; replay seeks **every** recorded position (no subsampling). Ȳ is computed over a 64×40 box downscale in linear light, for the frame mean **and** for the 9 overlapping 2×2-tile windows of a 4×4 tiling (25% of the viewport each). The ≤ 4 transitions (|ΔȲ| ≥ 0.10) per 1 s rule applies to the mean and every window. E-F5 covers tick 06 from 0, tick 01 from D, End from 0 and Home from the maximum scroll, at 1440×900 and 375×812. Plots and per-window maxima go to `evidence/flash-audit/`; replay frames stay in memory.
- **evidence** (WO-029 → WO-026): the full §19 shot list to `evidence/screens/…` with `index.md`; its final `[§19]` test fails if a pack-owned bullet has no file.

**Determinism discipline.**
- Every e2e waits on `__showcase.ready` and `document.fonts.ready`, then seeks with `scrollTo({behavior:'instant'})` and awaits `nextFrame()`.
- `page.clock` is used for JS timers and rAF-driven amplitude only; CSS transitions are read by `transitionTiming` and `seekTransitions` (`admireClock.js`), never by sampling computed opacity at paused-clock steps.
- Screenshots use `caret: 'hide'`. Breathing is off unless the test is about breathing.

**Proving the suite can fail (K20).** `verify:mutants` applies six literal patches to a temp copy of `site/` (served via `SITE_DIR` on a spare `PORT`) and requires the named case(s) red for each: (a) `Math.random()` in a scene `apply` → E-D1; (b) Scene 5 band edge +2 px at p 0 → E-S4; (c) `--idle-ms` 2000 → E-A2; (d) `setAttrs` never re-writes → E-D3, E-D1; (e) placard `transition-delay` 600 ms → E-A3; (f) injected `transition: transform 300ms` → E-D1, E-D2. It then confirms the unmutated copy is green on the same cases, and writes `$EVIDENCE_DIR/mutants.json`.

---

## Risks & spikes

| Risk | Likelihood / impact | Mitigation (spike WO, bake-off, descoping) |
|---|---|---|
| Playwright drift breaks the browser launch (only revision 1243 exists here) | low / **critical** | Exact pins, including `playwright-core` (A1); verify preflight step 0 asserts 1.63.0; `npm ci` only; never run `playwright install` here. |
| Scene 4 canvas too slow at 1920 × DPR 1.5 on SwiftShader | medium / high | **WO-005 spike in wave 0** (`spike.cjs`, global playwright via `NODE_PATH`, A10), before WO-010 starts. Draw cost is **flushed** with `getImageData(0,0,1,1)` so deferred raster is counted. It applies the D2 ordered fallbacks with a written decision rule. The 256-entry LUT; redraw on change only. If late, Scene 4 extends the schedule (plan slip policy). |
| Identity seams fail the pixel tolerance (SVG→DOM 1→2, canvas→DOM 4→5) | medium / medium | Shared snapped geometry (`snap`, `bandRects`). The state gate is unit-level from wave 1 (WO-012), so mismatches show early. **WO-014** gets one fix round, then the D1 crossfade (K15). |
| Timing flakiness in e2e | medium / high | K11: `nextFrame()`, clock only for JS timers, CSS fades by seeking, `waitForTimeout` banned by a static guard, `retries: 0`, WO-023 runs verify 3× back to back. |
| The suite passes vacuously (empty glob, missing suite, skipped test, state-only determinism) | medium / **high** | K18 floors, id manifest and `VERIFY_PHASE`; guard 9; rendered fingerprints (K11); K20 mutants prove six named cases can go red. |
| Fast automated navigations (tick 06, tick 01 from D, Home, End) exceed the flash rule, or a regional flash hides in the frame mean | medium / high | E-F5 with every-frame replay and 25% windows (WO-020). On failure the remedy (instant jumps across > 2 seams, or a reshaped luminance profile) is decided by the CEO and director-vision and implemented by WO-025; the threshold is never loosened. |
| A test hook or dev server exposes more than intended | low / medium | `serve.mjs` loopback-only with a raw traversal test (K19, A8); `__showcase` is read-only and documented in the README. |
| Beauty passes every test but stays merely competent | medium / high | WO-027 art review by the C designer at the start of wave 3, with tuning requests owned by WO-025/WO-022 and closed before WO-024. |
| Paused `page.clock` freezes rAF and does **not** advance CSS transitions (board probe, Gate 1) | known / medium | Resolved by method: tests assert attributes and timers under the clock, and read CSS fades through `getComputedTiming()` and `currentTime` seeking (`seekTransitions`). WO-013 re-runs the probe and quotes it in `admireClock.js`; WO-019 cites it in `admire.spec.js` and `breathing.spec.js`; mutant (e) proves E-A3 catches a broken hand-off. |
| e2e wall time with about 450 pack screenshots plus every-frame flash replay (≈ 2,000 frames) on 4 CPUs | medium / medium | Flash replay with `scale: 'css'`, decoded in memory; workers 2; a perf project alone; the 8 min budget is tracked in the summary. If it is exceeded, only E-F1 sampling (40 → 30 per scene) and the evidence pack may be trimmed, by CEO decision. **E-F2, E-F3 and E-F5 replay density is never cut.** |
| The portrait transpose (K5) mirrors chirality: the prism apex points left and the gradients turn | low / medium | Intended: beam from the top, bands as rows (§11.1). Evidence at 375 and 768 portrait (WO-020). Director-vision checks it at Gate 2. Text is never inside `.uv`. |
| Mobile toolbar: the stage is `100svh`, so a strip can show below it when the toolbar retracts | known / low (unverifiable here: svh = lvh in headless, T-E5) | The ground layer of `.art` extends to `100lvh` with `overflow-x: clip` (vertical visible). Geometry uses `sh` only. Flagged in the README as unverified on real iOS and Android. |
| Fallback-font `local()` names differ by OS (§20) | low / low | Several names per face; E-P2 measures CLS here; the swap is bounded by the overrides. |
| `index.html` is a shared hotspot | medium / low | K16: one owner per wave, a frozen skeleton (C7), and the baked region between markers with a drift test. Scenes 2–6 build their DOM in JS. |
| A contract needs to change mid-build | low / high | `types.d.ts` plus `tsc` make every breakage loud. The change goes through the CEO, and dependants are listed in the request. |
| Scene 2's shear overscan reveals ground at an extreme aspect ratio (polish 5) | low / medium | 140% overscan; a contracts pixel scan at five viewports at 41 p values (WO-013). If it fails, the overscan grows inside `.uv` (it is clipped anyway). |
| Touch scrolling cannot be emulated headless (T-E3) | known / low | Touch is covered by dispatched `touchstart` and `touchmove` for admire and rewind exits. Native touch scroll is flagged as unverified. |
| Real-GPU performance is unmeasured | known / medium | Numbers are recorded as a conservative floor (K13). The README states this. |
