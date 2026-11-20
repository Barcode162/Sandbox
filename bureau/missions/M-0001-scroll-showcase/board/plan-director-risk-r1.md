# Board review — plan gate — director-risk — round 1 — M-0001

VERDICT: CONDITIONAL
SCORE: 7.6 / 10

This plan is unusually rigorous: exact pins, a frozen-contract discipline, independent spec-derived tests, an honest split between measured and gated performance (K13), a flash audit wired into verify (D6), and no outward actions. My lens found four places where the plan sets up a claim it cannot yet prove:
1. the photosensitivity gate does not cover the fastest automated navigations, and it measures only the frame mean;
2. the determinism and reversibility tests compare the pure state function with itself, not the rendered frame;
3. the server traversal check is hollow;
4. the green-verify claim can be met with suites missing or skipped.

Each one is cheap to fix at plan level and expensive to discover at Gate 2.

## Rubric
| # | Dimension | Score | Why (evidence) |
|---|---|---|---|
| 1 | Fidelity | 8.5 | Every brief SC maps to WOs (`plan.md:49-66`). The 45 polish items are traced. The scope (6 scenes) sits inside the brief's 5–7. |
| 2 | Ambition & delight | 8.5 | Identity seams, the baked JS-off first frame, admire placard and the contact sheet. Ambitious, with a strict cut order (`experience.md:903-921`). |
| 3 | Craft & polish | 8.0 | The polish list is checkable item by item, and the seam pixel tolerances are explicit. |
| 4 | Correctness & robustness | 7.0 | E-D1/D2/D3/M2 assert on `stateAt()` and `snapshot().state`, which are the pure function's output, not the pixels (`experience.md:862-864`, `plan.md:368`). The WO-001 traversal check is a no-op (verified below). |
| 5 | Engineering quality | 8.5 | Exclusive ownership, `tsc --checkJs` on frozen contracts, `retries: 0`, `waitForTimeout` banned, three-run verify. |
| 6 | Performance | 8.0 | Spike first (WO-005), budgets with gates, frame timing recorded, not faked (K13). The canvas-cost measurement method needs a flush (condition 8). |
| 7 | Accessibility & comfort | 6.5 | The F3 "longest smooth jump" is tick 05. The longer automated jumps (tick 06, Home and End, tick 01 from the colophon) are never audited, and the designed profile predicts 6 transitions for a full traversal. The Ȳ metric is the frame mean, which can mask a regional flash. |
| 8 | Evidence | 7.0 | The evidence plan is rich, but three of its strongest-sounding proofs (determinism, traversal refusal, verify green) are currently hollow or can be passed vacuously. |

Overall 7.6. Accessibility is below the floor, so this cannot be APPROVE. Every gap is fixable within the plan, so the verdict is CONDITIONAL rather than REJECT.

## What I verified myself
All work was done in `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/risk-g1/`, outside the repo.

1. **Font provenance and licence.** I ran `npm pack @fontsource-variable/space-grotesk@5.3.0`.
   - `sha256sum files/space-grotesk-latin-wght-normal.woff2` gives `0640890476fc1198ab4de571fb658de443c4d85b66466ec09534a8737ab1ce9d`, size 22288. This matches `plan.md:146` and `architecture.md:54`.
   - `LICENSE` line 1 reads "Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk)". There is **no Reserved Font Name**, so vendoring the unmodified subset is fine under OFL-1.1.
   - `LICENSE` line 5 contains `http://scripts.sil.org/OFL`. That collides with static guard 5 ("`site/**` has no `http(s)://` URLs", `architecture.md:512`) once `OFL.txt` sits in `site/fonts/`. See condition 7.
2. **Dependency licences.** I ran `npm view <pkg>@<ver> license` with these results:
   - `@playwright/test` 1.63.0: Apache-2.0
   - `playwright-core` 1.63.0: Apache-2.0
   - `@axe-core/playwright` 4.14.0: MPL-2.0
   - `axe-core` 4.14.1: MPL-2.0
   - `pngjs` 7.0.0: MIT
   - `typescript` 6.0.2: Apache-2.0

   All are dev-only, and none are shipped in `site/`. MPL-2.0 is file-level copyleft, which is irrelevant for unshipped test tooling. These are compatible.
3. **Supply chain.** I ran a clean `npm install --save-exact --ignore-scripts` of the exact set.
   - `npm ls --all` shows a single `playwright-core@1.63.0`, deduped under both `@axe-core/playwright` and `playwright`.
   - `npm audit` reports **found 0 vulnerabilities**.
   - The lockfile has 7 packages, each with a sha512 `integrity`.
4. **The traversal check is hollow.** I started an echo server on 127.0.0.1:4199 and sent three requests:
   ```
   plain:      /package.json        <- curl http://…/../package.json  (what WO-001 specifies)
   path-as-is: /../package.json     <- curl --path-as-is
   encoded:    /%2e%2e/package.json
   ```
   curl strips dot segments on the client side, so the WO-001 acceptance test (`plan.md:143`) never sends `..` to the server. It would pass against a server with no traversal guard at all.
5. **Flash coverage arithmetic.**
   - From the designed Ȳ profile (`experience.md:546-553`), a full top-to-bottom traversal crosses these transitions of ≥ 0.10: S1↓ 0.63, S2↑ 0.21, S2↓ 0.36, S4↑ 0.20, S5↓ 0.22 and S6↑ 0.80. That is **6 transitions (3 flashes)**.
   - The Bureau's own window rule is ≤ 4 transitions per 1 s (`experience.md:566`). WCAG 2.3.1's ceiling is 3 flashes.
   - `html { scroll-behavior: smooth }` (`plan.md:148`) makes tick activation smooth (`experience.md:494`). Home and End are native (`experience.md:530`).
   - The tick anchor offsets come from `Y = [0, 1980, 4680, 7020, 9900, 11880]` (`plan.md:165`). On those, tick 06 is a longer jump than tick 05, which F3 calls "the longest" (`experience.md:567`), and Home and End are longer still.
   - How long Chromium takes for these smooth scrolls is unmeasured. If any of them completes in under about 1.5 s, the piece is likely to fail its own gate, and possibly WCAG.
6. **Hollow determinism.**
   - `stateAt(y)` is a "pure prediction … no scrolling" (`architecture.md:357`), and `snapshot().state` is `state(p)` (`architecture.md:346`).
   - So E-D1 ("`stateAt(y)` deep-equal after visiting 4 other positions", `experience.md:862`) compares a pure function with itself.
   - E-D2 ("2 s of `snapshot()` constant") passes trivially when the rAF loop is idle, which is by design (`plan.md:234`).
   - Neither test would catch a stray CSS transition, a leaked ambient term, or a DOM write that depends on history. SC2 says the **rendered** state is a pure function of position (`brief.md:42`).
7. **Vacuous-green paths.**
   - Verify counts "missing test directories as 0 tests, not a failure" (`plan.md:151`), with no stated expiry.
   - Only `test.only` is guarded (`plan.md:571`). `test.skip`, `test.fixme` and `describe.skip` are not.
8. **Outward actions.**
   - There is no deploy, publish or PR WO.
   - The README states that publishing needs the Owner's go-ahead (`plan.md:588`).
   - Lighthouse is optional and outside verify (K14).
   - There is no paid service and no runtime network (A3; guard 5).
   - K17 forbids a nested `.github/`.

   This is clean.
9. **Records.** `bureau finding list` is empty (`findings.jsonl` has 0 lines) and `votes.jsonl` is empty, so there are no open findings to reconcile at this gate.

## Conditions
Each condition must be written into `plan.md` (the WO named), with an acceptance line, before the CEO records Gate 1 as passed.

1. **Flash audit covers the fastest automated navigations (WO-020).**
   - Add **E-F5**, under `prefers-reduced-motion: no-preference` at 1440×900 and 375×812, for four navigations:
     - (a) tick 06 activated from y = 0;
     - (b) tick 01 activated from y = D;
     - (c) `End` from y = 0;
     - (d) `Home` from y = D + colophon.
   - Each is recorded per rAF until settled. F3 and E-F5 replay **every** recorded position, with no subsampling, and apply the ≤ 4-transitions-per-1 s rule.
   - The report states each navigation's measured duration and transition count.
   - The plan names the remedy if any fails. For example: drop `scroll-behavior: smooth` for ticks that cross more than N seams, or reshape the luminance profile. That decision goes to the CEO and director-vision, never a loosened threshold.
2. **Flash audit checks area, not only the frame mean (WO-020).**
   - In addition to frame-mean Ȳ, compute Ȳ for every 2×2-tile window of a 4×4 tiling of the 64×40 downscale. Each window covers 25% of the viewport, which is the WCAG area threshold.
   - Apply the E-F2, E-F3 and E-F5 window rule to every window.
   - Save the per-window maxima to `evidence/flash-audit/`.
   - The gate fails if any window fails.
3. **Determinism tests assert on rendered output (WO-013).**
   - E-D1, E-D2, E-D3 and E-M2 must each compare a **rendered** fingerprint, not only `stateAt` or `snapshot`:
     - a screenshot that is pixel-identical, or within a tolerance stated in the test and justified;
     - for Scene 4, also a canvas `getImageData` hash.
   - E-D2 must take its second capture after real time has elapsed with rAF free-running. Not under a paused clock.
   - **Mutation proof.** The WO-013 report shows E-D1 and E-D2 going red against a deliberately injected defect, such as a temporary `transition: transform 300ms` on a scene element, then green after reverting it. Paste both outputs.
4. **Timing assertions use a proven clock path (WO-013, WO-019).**
   - WO-013's clock probe result for CSS transitions under a paused `page.clock` is cited at the top of `admire.spec.js` and `breathing.spec.js`.
   - If transitions are not clock-driven, then E-A3 (caption ≥ 0 while the placard is at 0, sampled every 50 ms), #17, #18 and #31 must read progress through the Web Animations API (`getAnimations()` `currentTime` and effect timing) or real-time `expect.poll`. They must never read computed opacity at paused-clock steps.
   - This must also be shown by a mutation proof: break the hand-off delay and the test goes red.
5. **No vacuous green (WO-023, WO-024).**
   - (a) A static guard rejects `test.skip`, `test.fixme`, `describe.skip`, `test.describe.skip`, `.only` and `test.fail` anywhere in `tests/`.
   - (b) Verify fails if Playwright reports any skipped test.
   - (c) `verify.mjs` carries a manifest of every E- and U- id in §15.3 plus the polish-item tests. From WO-023 on, a missing id or an empty suite **fails** verify. The "missing directory = 0 tests" allowance expires at the end of WO-014.
   - (d) `axe.spec.js` uses no `disableRules` or `exclude` unless each is listed with its reason in the WO-021 report and in `log.md`.
6. **A real traversal test, and loopback only (WO-001).**
   - Replace the `curl` acceptance check with a dev unit test that uses raw `node:http` requests, which do not normalise paths. Each of these must give 404 or 400, and none may return file bytes from outside `site/` or `dev/`:
     - `/../package.json`
     - `/%2e%2e/package.json`
     - `/..%2fpackage.json`
     - `/__dev/../../package.json`
     - `/%2e%2e%5cpackage.json`
     - a NUL byte, `/%00`
   - `serve.mjs` binds `127.0.0.1` only.
7. **Licence integrity (WO-001, WO-012).**
   - `site/fonts/OFL.txt` is byte-identical to the package `LICENSE`, and its sha256 is recorded in `SOURCE.md` and checked in verify step 4.
   - Static guard 5 is scoped to `*.html|*.css|*.js|*.svg` or explicitly exempts `site/fonts/OFL.txt` and `SOURCE.md`.
   - The licence text is never edited to satisfy a guard.
   - The README and colophon credit Space Grotesk under OFL-1.1.
8. **Honest frame-cost numbers (WO-005, WO-020, WO-024).**
   - WO-005 must flush draw cost. Canvas 2D can defer rasterisation, so timing JS around draw calls measures recording only. The spike must therefore report draw ms with a forced flush (`getImageData(0,0,1,1)` after the draw) alongside rAF-delta p95, and its decision rule cites the flushed number.
   - `perf.md` carries a "What these numbers measure and do not" section covering three points: the headless shell, software raster, and that `frameStats.scriptMs` excludes style, paint and raster.
   - The README and the delivery report must not state "60 fps", or any laptop performance claim, beyond the measured numbers and their environment.
9. **Hash robustness (WO-021).** The unknown-hash case also loads three malformed hashes:
   - `#%22%5D`
   - `#%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E`
   - `#1`

   For each: 0 `pageerror`, `__showcase.errors` equals `[]`, and the page opens at the top.

## Concerns (non-blocking)
- **Test thresholds versus spec.** WO-023 owns the helpers and config, so it could loosen a tolerance quietly. I'd like every numeric tolerance in `tests/` to equal its spec value, with any deviation logged in `log.md`. I will diff these at Gate 2.
- **`scroll-behavior: smooth` against `engine.scrollTo`.**
  - `window.scrollTo(x, y)` honours CSS smooth scrolling, so the engine must pass `{behavior: 'instant'}` explicitly.
  - If it does not, the resize restore (E-R2) and the rewind will animate, and the scroll-origin rule (within 1 px, ≤ 2 frames) will misclassify the result as user scroll.
- **`ResizeObserver(documentElement)`.** The engine writes `--track-h`, which changes the observed element. It needs a compare-before-write guard. Otherwise a "ResizeObserver loop" error event could trip E-H1.
- **Repository weight.** About 450 committed PNGs plus seam diffs could reach tens of MB, and `*.trace.json` is not gitignored (tooling §6). Commit only the §19 pack and the plots, keep flash-replay frames uncommitted, and record the total size in the evidence index.
- **Wall time.** Conditions 1 and 2 add replay frames. The 8-minute verify budget (WO-023) may need the CEO-approved sampling cut that the architecture already anticipates. That cut must never reduce E-F5 to subsampling.
- **Shipped test hook.** `window.__showcase` ships to production. It is read-only, so the risk is low, but the README should say it exists and why.
- **Lighthouse through `npx --yes`.** It pulls about 179 MB of unlocked transitive dependencies over the network. It is fine as an optional, Owner-run tool, and the README should say exactly that.
- **Scope.** There are 24 WOs, pixel-exact seams at two DPRs, and 45 polish items, so this is at the upper edge of tier 3. The strict cut order and D1 are the release valves. I'll hold the CEO to recording each cut (WO-024).
- **Byte-identical canvas (#9) and exact `#FFFFFF` (#10).** These are probably fine on software raster, but they are unspiked. #10 should define "inside the beam rect" as inset by one device pixel, so fractional `beamW` (129.6) edges don't create a false red.

## Commendations
- **Exact pins with a preflight.** Version drift is the one critical environment risk, and the plan closes it with both. My clean install reproduced the dedupe and showed 0 advisories.
- **Measured, not faked, frame timing (K13).** The plan states plainly that headless SwiftShader is not a laptop.
- **Spec-derived, independent tests.** "The spec wins" (`plan.md:14`), so test-engineers cannot be captured by builders' code.
- **Photosensitivity as a gate, not a promise.** Its "safety does not rest on slowness" reasoning (`experience.md:556`) is exactly the right instinct. Conditions 1 and 2 extend it to the cases it missed.
- **Font vendored with a sha256.** That means no runtime network, and the licence ships with the file.

## Requests (to the CEO)
- File conditions 1–6 as findings against WO-020, WO-013, WO-013/019, WO-023/024, WO-001 and WO-001/012 respectively, so that Gate 2 can confirm each is *verified*. I cannot convene, and my brief's write scope is this file only.
- Condition 1's possible remedy, smooth scroll for ticks versus the luminance profile, is a design decision. Route it to director-vision if E-F5 fails.
