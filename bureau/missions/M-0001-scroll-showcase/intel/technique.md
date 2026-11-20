# Intel — Technique options for scroll-scrubbed animation (no-build static site)

Scout · discipline: performance · M-0001 · 2026-11-20

Experiments ran in the session scratchpad, not in `<dossier>/intel/scratch/`, because this brief gives exclusive write access only to this file and the CEO named the scratchpad path:
`/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/scout-tech/` (`e1-support.js` … `e6-clock.js`). They are throwaway and can be re-run with `node <file>`.

**Environment:** Playwright 1.63.0, bundled **Chromium 157.0.8103.78** (`HeadlessChrome/157.0.8103.78`), 4 cores, WebGL through **SwiftShader**, which is software rendering.

## Questions
1. How mature are native CSS scroll-driven animations (`animation-timeline: scroll()/view()`) in late 2026? Are they deterministic, and can tests read them?
2. How does a JS rAF loop work here (progress from geometry, writing transforms or custom properties), and how does it compare?
3. When should a scene use canvas or WebGL?
4. Which properties are compositor-only, how do we avoid layout thrash, and what are the budgets for DOM nodes and for SVG path updates?
5. Should sticky stages use `100vh`, `svh` or `dvh` on mobile?
6. How do we detect "the user stopped scrolling" robustly? Is `scrollend` enough?
7. What do we recommend, given that scene state must be a pure function of scroll position and readable by tests?

## Answers (short, direct)
1. **CSS SDA is now Baseline (Newly available).** It works in Chrome/Edge 115+, Safari 26+ and Firefox 159+ (stable since 27 Oct 2026), which caniuse puts at about 89% of users. Bundled Chromium 157 supports all of it, including `view()`, `animation-range`, `timeline-scope` and `ScrollTimeline`/`ViewTimeline`. It is **deterministic**: the same scroll position gave a byte-identical computed transform after scrolling away and back, with no drift while stationary. Tests can read it through `document.getAnimations()[i].currentTime` (e.g. `"50%"`) and `getComputedStyle`. Its limits: it only animates CSS properties. It cannot drive canvas, generative SVG paths or JS logic, and it only updates on the next frame.
2. **JS rAF works just as well for determinism, and better for testability.** It produced the same output as CSS at every position tested. Its advantage is that `state = f(progress)` can be a plain function that tests call directly, in unit tests with no browser or in e2e via `window.__showcase`. It can also drive canvas and SVG. Its cost is main-thread work, which stays fine within the budgets in item 4.
3. **Canvas 2D** suits scenes with many particles (10k rects took about 10 ms per frame headless). **WebGL** is available here, but only through SwiftShader. Screenshots will work, but headless frame timing will not represent real GPUs. Use WebGL for at most one hero scene, and only if the architect justifies it.
4. **Use only `transform`, `opacity` and `filter` for motion.** Read all geometry first, then write. Interleaving reads and writes cost **95× more** in the measurement below. Keep **at most about 1,000 animated nodes per active scene**: frames stayed clean up to 1,000 and degraded at 2,000. Never drive thousands of nodes from a custom property on `:root`; that was measured 2.4× slower than per-element transforms. Rewriting a ≤10k-point SVG path `d` is cheap on the main thread (≤3.3 ms), but its raster/paint cost was not measured.
5. **Size the sticky stage with `height: 100svh`.** Derive scroll lengths from cached element offsets, never from `dvh`, which changes while the user scrolls and would break position → frame determinism. Headless emulation cannot test this (svh = dvh = lvh = vh).
6. **Do not rely on `scrollend`.** It works in Chrome 114+, Firefox 109+ and Safari 26.2+, but in headless Chromium it fired **after every wheel tick**, 10 times for 10 ticks spaced 30 ms apart. Use an idle timer of about 1.2 s, reset by `scroll`, `wheel`, `keydown`, `pointerdown`, `pointermove`, `touchstart` and `touchmove`. Treat `scrollend` as a hint at most.
7. **Recommendation:** a vanilla-JS, no-build engine with one passive scroll listener and one rAF read/write loop. Each scene exports a pure `state(p)` and a separate `apply(state)` that renders to DOM transforms, a scene-scoped custom property, canvas or SVG. The page exposes `window.__showcase.stateAt(y)` and `.snapshot()` for tests. Native CSS SDA is optional and limited to purely decorative CSS-only flourishes. JS remains the single source of truth.

## Evidence & detail

### E1 — Feature support in bundled Chromium (`e1-support.js`)
```
browser.version() 157.0.8103.78
animation-timeline: scroll() true | view() true | animation-range: entry 0% cover 50% true
timeline-scope true | scroll-timeline true | ScrollTimeline/ViewTimeline function
100svh/100dvh/100lvh true | onscrollend (window, document) true | CSS.registerProperty function
container-type: scroll-state true | webgl true | webgl2 true | OffscreenCanvas function
glRenderer: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)...), SwiftShader driver)
```
**Cross-browser support (sources):**
- `animation-timeline`: Chrome/Edge 115+, Safari 26.0+, Firefox 159+, about 89.1% global usage. https://caniuse.com/mdn-css_properties_animation-timeline
- Firefox 159, "Scroll-driven animations are now enabled by default", released October 27, 2026. https://developer.mozilla.org/en-US/Firefox/Releases/159
- web.dev, October 2026: "With support in Chrome, Safari, and now Firefox 159, scroll-driven animations are Baseline Newly available." https://web.dev/blog/web-platform-10-2026
- `scrollend`: Chrome 114+, Firefox 109+, Safari 26.2+, about 91% global usage. https://caniuse.com/mdn-api_element_scrollend_event
- SDA can "run off the main thread". Chrome's example animates `transform` rather than `width` so that it composites, and the article documents the `ScrollTimeline`/`ViewTimeline` JS API. https://developer.chrome.com/docs/css-ui/scroll-driven-animations

### E2 — Determinism and readability: CSS SDA vs JS (`e2-determinism.js`)
The page had one element on `animation-timeline: scroll(root)` (translateX 0→1000px) and one JS element written on `scroll`.
```
SAME-TASK read after scrollTo(2200): css matrix(...0,0) currentTime '0%' | js matrix(...0,0)   <- both stale
after 2 rAF @2200: css translateX 500, currentTime '50%' | js translateX 500
back @2200 after visiting 4400,0,1234,3000: identical: true
after wheel +500: css 613.636 / '61.3636%' | js 613.636            <- CSS and JS agree exactly
drift-free while stationary (1 s): true
anim.pause() on a scroll-driven animation: playState 'paused', no error; timeline class ScrollTimeline
```
What this means for tests:
- Both approaches lag one frame after a programmatic scroll. Tests must wait about 2 rAFs after `scrollTo` before reading the DOM, or call the pure function directly.
- CSS state can be read, but only as computed CSS. It cannot express "scene 3's particle field state".

### E3 — `scrollend` and stop detection (`e3-scrollend.js`, `e3b-touch.js`)
```
instant scrollTo(0,1000)        scroll=1  scrollend=1 (+6ms)
scrollTo same position (no-op)  scroll=0  scrollend=0
smooth scrollTo(0,3000)         scroll=44 scrollend=1 (+771ms, 34ms after last scroll)
mouse.wheel +300 x1             scroll=1  scrollend=1 (+9ms)
mouse.wheel +100 x10 @30ms      scroll=10 scrollend=10 (one per tick)            <- not "user stopped"
keyboard PageDown / Space       scroll≈10 scrollend=1 (~180ms)
wheel UP at top (no movement)   scroll=0  scrollend=0, but wheel event:1         <- input without scroll
CDP touch scroll gesture        touchstart/touchend fired, NO scroll in headless  <- touch scroll untestable here
CDP mouse scroll gesture 400px  scroll=32 scrollend=1 (+526ms)
```
- `scrollend` means "this scroll sequence settled". It does not mean "the user stopped". A user pausing 100 ms between wheel flicks produces many `scrollend` events. A wheel or keypress at a scroll boundary produces no scroll or `scrollend` at all, yet it is still input that should exit admire mode.
- `scrollend` background reading (cited, not fetched this session): https://developer.chrome.com/blog/scrollend-a-new-javascript-event

### E4 — Main-thread costs (`e4-perf.js`, 1440×900, mean ms per iteration including forced style/layout)
| Test | ms |
|---|---|
| 500 nodes, read rect then write width, **interleaved** | **209.8** |
| 500 nodes, **batched** reads then writes | **2.2** |
| transform on 500 / 2,000 / 5,000 / 10,000 nodes | 1.2 / 5.5 / 18.6 / 30.2 |
| margin-left (layout prop) on the same counts | 2.0 / 7.8 / 32.0 / 47.5 |
| one `--p` on `:root` → 5,000 nodes via `calc()` | **45.1** (worse than per-node transforms) |
| SVG `d` rewrite: 1×1k / 10×200 / 100×100 / 1×10k points | 0.35 / 0.55 / 2.5 / 3.3 |
| SVG `transform` attr on a 1k-point path | 0.01 |
| Canvas 2D: 1k / 10k rects | 1.3 / 10.1 |

**Caveat:** these times are main-thread script plus style/layout only. Paint and raster are not included (`getBBox`/`offsetHeight` force layout, not paint), so the SVG and canvas raster costs are **unverified**.

### E5 — Frame timing during a scripted scroll (`e5-frames.js`, 120 wheel ticks, every node animated with transform+rotate)
```
js     0 nodes  p50 16.7 p95 16.7  >20ms:  0%
js   300 nodes  p50 16.7 p95 16.8  >20ms:  0%
js  1000 nodes  p50 16.7 p95 16.8  >20ms:  0%
js  2000 nodes  p50 16.7 p95 33.4  >20ms: 20%
css 1000 nodes  p50 16.7 p95 16.8  >20ms:  2%
css 2000 nodes  p50 16.7 p95 50.0  >20ms: 35%
```
In this headless, software-composited setup, CSS SDA was **not** faster than JS at high node counts. The cliff sits between 1,000 and 2,000 animated nodes either way. This rAF-delta method is a usable harness for success criterion 8.

### E6 — Test clock (`e6-clock.js`)
- `page.clock.install()` (Playwright 1.63.0) did not stop rAF-driven rendering: the scroll rendered correctly.
- `clock.runFor()` fast-forwarded a 1.2 s idle `setTimeout`.
- Admire-mode tests can therefore be time-controlled rather than relying on sleeps (fake-clock semantics only lightly exercised).

### Other sources
- DOM size: Lighthouse warns above about 800 body nodes and errors above about 1,400. https://developer.chrome.com/docs/lighthouse/performance/dom-size
- Compositor-only properties and layer count (cited from prior knowledge, not fetched): https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count
- Layout thrashing (not fetched): https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing
- svh/lvh/dvh semantics (not fetched): https://web.dev/blog/viewport-units

## Facts vs. inferences
**Facts** (measured or sourced):
- Chromium 157 supports SDA, `scrollend`, svh/dvh and WebGL2 (SwiftShader).
- SDA is Baseline across Chrome, Safari and Firefox (sources above).
- CSS and JS states were identical and drift-free at the same scroll position.
- Both lag one frame behind a programmatic scroll.
- `scrollend` fires once per wheel tick in headless and never fires for input that does not move the scroll position.
- Interleaving reads and writes was about 95× slower than batching.
- Driving many nodes from a `:root` custom property was 2.4× slower than per-node transforms.
- Frames degraded between 1,000 and 2,000 animated nodes.
- Touch-scroll emulation did not scroll in headless.
- svh = dvh = vh in emulation.

**Inferences** (judgement):
- JS-owned progress gives the best combined visual ceiling (DOM + SVG + canvas) and testability (pure functions).
- Mixing CSS SDA with a JS-owned state risks two sources of truth.
- `svh` stages are the safest choice on real mobile.
- Real GPUs will do better than SwiftShader, so headless numbers are a conservative floor for DOM work and **not** representative of WebGL.

## Implications for the mission
1. **Architecture.** Build `engine.js` (ES modules, no build).
   - One passive `scroll` listener sets a dirty flag. A single rAF loop reads `scrollY` once and computes per-scene local progress from section offsets cached on `ResizeObserver`/`load` (no per-frame `getBoundingClientRect`). It then writes all scenes.
   - Each scene module exports pure `state(p): plain object` (unit-tested in Node) and `apply(state, el)`.
   - Expose `window.__showcase = { progress(), stateAt(y), snapshot() }` and mirror key values into `data-*` attributes so tests can assert state with `toEqual`.
2. **Ambient breathing** (admire mode) goes in a separate time-driven layer, e.g. an additive transform on a wrapper or a CSS `@keyframes` time animation. It must never touch `state(p)`, so the "no drift while stationary" test can exclude it cleanly (success criterion 2).
3. **Budgets** (proposed for the architecture):
   - ≤ ~1,000 animated DOM nodes in the active scene and ≤ ~1,400 total DOM nodes. Inactive scenes use `content-visibility:auto` or skip `apply()`.
   - Motion only through transform, opacity and filter.
   - Custom properties are set on the scene element, never `:root`.
   - Canvas is used for particle-heavy scenes, and only visible canvases draw.
   - SVG path morphs stay ≤ 10k points total per frame.
4. **Stage CSS:**
   ```css
   .stage{position:sticky;top:0;height:100svh}
   ```
   Section lengths are in px or `svh`, never `dvh`.
5. **Idle detection.** Use a 1.2 s timer that is armed only after the first scroll. It resets on `scroll`, `wheel`, `keydown`, `pointerdown`, `pointermove` and `touchstart`/`touchmove`. Any of these exits admire mode immediately. Tests use `page.clock`.
6. **Test waits.** After `scrollTo`, e2e tests wait 2 rAFs (or `expect.poll` on `__showcase.snapshot()`) before reading the DOM.
7. **Top risks:**
   - Real-device mobile behaviour (dynamic toolbar, touch momentum) cannot be verified in this environment.
   - WebGL performance is unmeasurable here (SwiftShader).
   - Paint/raster cost of large SVG and canvas was not measured.
   - Headless frame timing is noisy and must be reported as evidence, not used as a hard gate.

## Open questions / unverified
- Paint/raster costs of SVG path morphs and full-screen canvas (needs a trace with paint, e.g. CDP `Tracing`, or a real GPU).
- svh/dvh behaviour with real mobile dynamic toolbars, and touch-momentum interaction with sticky stages. **Unverified.** Emulation shows all units equal and touch scroll gestures did not scroll.
- Exact Safari/Firefox behaviour of `scrollend` with wheel momentum (only Chromium was tested).
- The sources marked "not fetched" above are cited from prior knowledge.
