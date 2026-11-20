# Intel — Environment, test tooling and codebase recon

Scout · devops-ci · 2026-11-20. All experiments ran in throwaway dirs **outside the repo** under
`/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/` (`scout-tooling/`, `scout-tooling-nt/`, `scout-tooling-mismatch/`, `scout-tooling-lh/`), as the CEO order directed; nothing under `intel/scratch/` and no product code was touched. Those dirs are ephemeral.

## Questions
1. Exact installed Playwright version, browser revision, and where `playwright` resolves from.
2. Do `npm view` / `npm install` work through the proxy? Can `@axe-core/playwright` / `axe-core` be installed, at what versions?
3. Can `@playwright/test` at the version matching the installed browser be installed and used (with or without `executablePath`)? Or is `node --test` + the global playwright more robust?
4. How to test scroll-position-driven animation deterministically in headless Chromium?
5. Can Lighthouse run here?
6. Codebase: what exists, and what are the `projects/` conventions?
7. Recommended `npm run verify` pipeline with exact commands and versions.

## Answers (short, direct)
1. **playwright 1.63.0**, resolved from `/opt/node-tools/node_modules/playwright` (via symlink `/opt/node22/lib/node_modules/playwright` and `NODE_PATH=/usr/local/lib/node_modules_global`). It expects browser **revision 1243**. Default `chromium.launch()` uses the **headless shell** at `/opt/pw-browsers/chromium_headless_shell-1243/…/chrome-headless-shell`, which is a sandbox wrapper script around a binary reporting **Chrome 157.0.8103.78**. `/opt/pw-browsers/chromium` is full Chrome for Testing **153.0.8010.12**. Node is **v22.23.5**, npm **10.9.9**.
2. **Yes, both work** (registry.npmjs.org is reachable directly via `NO_PROXY`). `@axe-core/playwright@4.14.0` (latest) installs and pulls `axe-core@4.14.1`. **Trap:** its peer dependency `playwright-core >=1.0.0` makes npm hoist **playwright-core 1.65.1** next to `@playwright/test`'s nested 1.63.0. Fix it by pinning `playwright-core@1.63.0` as an explicit exact devDependency, which dedupes the tree.
3. **Yes.** `@playwright/test@1.63.0` installs in about 2 s and runs against the pre-installed browsers **with no `executablePath`**, because `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` is set and revision 1243 matches. 9 fixture tests passed in 4.9 s. **@playwright/test 1.63.0 is the more robust choice.** It gives fixtures, `expect` auto-retry, `webServer`, parallel workers and screenshots, and a project-local, lockfile-pinned version makes the project exportable. `node --test` + global playwright also works (CJS `require` only; ESM `import 'playwright'` fails because ESM ignores `NODE_PATH`), but it ties the project to this image's global install, and axe still has to be installed. **Any playwright version other than 1.63.0 fails to launch** (proved with 1.65.1).
4. Use `scrollTo({top, behavior:'instant'})` followed by awaiting **two rAFs** inside `page.evaluate`, then read state. Use **`page.clock.install()` + `pauseAt()` + `runFor()` only for the admire idle timer**: a paused clock also freezes rAF (proved). `page.emulateMedia({reducedMotion:'reduce'})` works. For frame timing, use rAF deltas plus CDP `Performance.getMetrics`; `browser.startTracing` also works. Both JS-driven and CSS `animation-timeline: scroll()` animations proved deterministic and reversible.
5. **Yes.** `lighthouse@13.6.0` (needs node >=22.19; we have 22.23.5) installs (179 MB, ~10 s) and ran with `CHROME_PATH=/opt/pw-browsers/chromium`: perf 1, a11y 1, best-practices 0.96, LCP 0.6 s, CLS 0, no run warnings. Recommend it as an **optional** script, not part of `verify`.
6. The repo is empty of products: `projects/README.md` only. The convention is one self-contained folder per project with its own README, manifest + lockfile, one run command and one verify command, plus a README link back to the dossier. `.gitignore` already ignores `node_modules/`, `playwright-report/`, `test-results/`, `coverage/` and `dist/`. CI (`.github/workflows/bureau.yml`) only validates the Bureau; it does not run project tests.
7. See **Recommended pipeline** below.

## Evidence & detail

### 1. Runtime and Playwright resolution
```
$ node --version; npm --version
v22.23.5
10.9.9
$ node -e "console.log(require.resolve('playwright')); console.log(require('playwright/package.json').version)"
/opt/node-tools/node_modules/playwright/index.js
1.63.0
$ ls -la /opt/node22/lib/node_modules/ | grep playwright
playwright -> /opt/node-tools/node_modules/playwright
$ ls -la /usr/local/lib/node_modules_global
/usr/local/lib/node_modules_global -> /opt/node22/lib/node_modules
$ env | grep -E 'PLAYWRIGHT|NODE_PATH'
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
NODE_PATH=/usr/local/lib/node_modules_global
$ cat /opt/node-tools/package.json   # pinned image tools
"playwright": "1.63.0", "serve": "14.2.6", "http-server": "14.1.1", "typescript": "6.0.2", "eslint": "10.1.0", "prettier": "3.8.1" ...
$ grep -A3 '"chromium"' /opt/node-tools/node_modules/playwright-core/browsers.json
"name": "chromium", "revision": "1243", "browserVersion": "153.0.8010.12"
$ ls /opt/pw-browsers
chromium -> chromium-1243/chrome-linux64/chrome   chromium-1243   chromium_headless_shell -> …   chromium_headless_shell-1243   ffmpeg-1011   headless_shell_as_downloaded   network-process-on-tmp.sh
$ /opt/pw-browsers/chromium --version
Google Chrome for Testing 153.0.8010.12
$ /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell.real --version
Google Chrome for Testing 157.0.8103.78
$ /opt/pw-browsers/headless_shell_as_downloaded/chrome-headless-shell --version
Google Chrome for Testing 153.0.8010.12
```
Probe (`chromium.executablePath()` / `launch()`):
```
default exe: /opt/pw-browsers/chromium-1243/chrome-linux64/chrome
launched version 157.0.8103.78          # headless shell (the default for headless launch)
full chromium via executablePath 153.0.8010.12
```
The headless-shell entry point is an image wrapper script (8 KB, `/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`). It drops `--disable-dev-shm-usage` when /dev/shm has room, strips `--use-gl=swiftshader`/`--use-angle=swiftshader`, and adds V8 `--no-enable-lazy-source-positions`. Machine: 4 CPUs, 16 GB RAM, no GPU.

WebGL and scroll-timeline support (both browsers):
```
headless-shell 157.0.8103.78 {"webgl":true,"renderer":"ANGLE (… SwiftShader Device (Subzero) …)","scrollTimeline":"function","viewTimeline":"function","animTimeline":true,"offscreen":"function"}
full chromium 153.0.8010.12  {same}
```
WebGL is software-rendered (SwiftShader), so GPU-heavy scenes will be slow in headless and frame-time numbers will not represent a real laptop.

### 2. npm through the proxy, axe
```
$ npm config get registry            -> https://registry.npmjs.org/   (in NO_PROXY: direct)
$ npm view axe-core version          -> 4.14.1
$ npm view @axe-core/playwright version -> 4.14.0
$ npm view @axe-core/playwright@latest peerDependencies dependencies
peerDependencies = { 'playwright-core': '>= 1.0.0' }
dependencies = { 'axe-core': '~4.14.0' }
$ npm view @playwright/test version  -> 1.65.1 (latest)
$ npm view @playwright/test@1.63.0 version -> 1.63.0
$ npm install --save-dev --save-exact @playwright/test@1.63.0 @axe-core/playwright@4.14.0
added 6 packages, and audited 7 packages in 2s
$ npm ls --all
+-- @axe-core/playwright@4.14.0
| +-- axe-core@4.14.1
| `-- playwright-core@1.65.1          <-- hoisted, wrong version (expects chromium-1255)
`-- @playwright/test@1.63.0
  `-- playwright@1.63.0
    `-- playwright-core@1.63.0
$ npm install --save-dev --save-exact playwright-core@1.63.0
$ npm ls --all
+-- @axe-core/playwright@4.14.0
| +-- axe-core@4.14.1
| `-- playwright-core@1.63.0 deduped
+-- @playwright/test@1.63.0
| `-- playwright@1.63.0
|   `-- playwright-core@1.63.0 deduped
`-- playwright-core@1.63.0
```
`@axe-core/playwright/dist/index.js` only does `require("assert")` and `require("axe-core")` at runtime, so the stray core was latent. Pin it anyway so nothing can accidentally resolve 1.65.1. `npm ci` reinstalls in 0.6 s, and `npm ci --offline` works from the cache.

### 3. Version mismatch proof
```
$ npm i --save-exact playwright@1.65.1   (separate dir)
/opt/pw-browsers/chromium-1255/chrome-linux64/chrome
LAUNCH FAILED: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1255/... Looks like Playwright was just installed or updated. Please run the following command to download new browsers
```
So: **pin exactly 1.63.0**. Never `^1.63.0`, and never run `playwright install`.

### 3b. @playwright/test fixture run (9 tests)
A fixture page with sticky scenes, rAF-throttled scroll render, a 1.2 s idle "admire" timer, a role=status message and a reduced-motion-guarded ambient animation, plus a zero-dependency `node:http` static server started by `webServer`:
```
$ npx playwright test
  ✓ admire mode via page.clock (210ms)
  ✓ reduced motion (142ms)
  ✓ deterministic and reversible (756ms)
  ✓ axe + overflow @375 / @768 / @1440 / @1920 (~600ms each)
  ✓ CDP tracing works (368ms)       -> trace.json 916 KB
{"frames":120,"median":"16.70","p95":"17.00","max":"19.60","LayoutCount":0,"RecalcStyleCount":169,"ScriptDuration":0.011556}
CLS 0
  ✓ frame timing via rAF + CDP metrics (2.2s)
  9 passed (4.9s)          real 0m5.7s
```
No `executablePath` was needed. Headless rAF runs at a real ~60 Hz (median 16.7 ms).

### 3c. node --test + global playwright (no install)
```
$ node esm.mjs   # import { chromium } from 'playwright'
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'playwright'
$ node --test e2e.test.cjs   # require('playwright')
# pass 1  # fail 0  duration_ms 587
```
Global `/opt/node-tools/node_modules` has no `@playwright/test` and no axe package.

### 4. Deterministic scroll-animation techniques (verified)
- **Seek + settle:** `page.evaluate(y => new Promise(r => { scrollTo({top:y, behavior:'instant'}); requestAnimationFrame(() => requestAnimationFrame(r)); }), y)`. Two rAFs let a scroll handler that renders in rAF run, and then let the next frame commit. `behavior:'instant'` overrides any CSS `scroll-behavior: smooth`.
- **Determinism / reversibility:** read state (inline transform, `data-progress`, or `getComputedStyle`) at Y, scroll away to the end and the top, return to Y, and assert deep-equal. Then wait 300 ms and assert again (no drift). Passed.
- **CSS scroll timelines** (`animation-timeline: scroll(root)`) are also deterministic. Computed transform and `getAnimations()[0].currentTime`:
  ```
  y=0 → translateX 0, 0%;  y=1200 → 200, 50%;  y=2400 → 400, 100%;  y=1200 → 200, 50%;  y=0 → 0, 0%
  ```
- **page.clock semantics (important):**
  - `page.clock.install()` alone: time still flows; rAF and setTimeout fire normally (`raf fired`, `setTimeout fired`).
  - After `page.clock.pauseAt(t)`: **rAF and setTimeout both hang** (`rAF HUNG`, `setTimeout HUNG`). The idle timer did not fire on its own (`admire before runFor: ''`), and `clock.runFor(1300)` fired it (`admire after runFor: admire`).
  - Rule: use install + pauseAt + runFor for admire-mode tests, and do **not** pause the clock in tests that need scroll rendering, since rAF stops. Call `install()` **before** `goto` (Playwright requirement).
- **Reduced motion:** `page.emulateMedia({ reducedMotion: 'reduce' })` gave `animationName === 'none'` under the media query. A context-level `reducedMotion: 'reduce'` option also exists in `use:` (unverified here, documented API).
- **Input for admire exit:** `page.mouse.wheel`, `page.keyboard.press` and pointer events all work headless.
- **Frame timing:** rAF delta sampling during a scripted scroll gives median/p95/max. CDP `Performance.getMetrics` gives LayoutCount, RecalcStyleCount and ScriptDuration. A `PerformanceObserver({type:'layout-shift', buffered:true})` gives CLS. `browser.startTracing()` writes a Chrome trace for deep dives.
- **Unverified:** `toHaveScreenshot` / `screenshot({animations:'disabled'})` interaction with scroll-timeline animations. Disabling animations may jump CSS-timeline animations to their end state. Prefer `animations:'allow'` after the seek-and-settle step, and freeze the ambient layer via a test hook or reduced motion.

### 5. Lighthouse
```
$ npm i --save-exact lighthouse@13.6.0     # real 0m9.7s, node_modules 179M
$ CHROME_PATH=/opt/pw-browsers/chromium npx lighthouse http://127.0.0.1:4175/ --quiet \
    --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility,best-practices \
    --output=json --output-path=lh.json --form-factor=mobile
exit=0
performance=1 accessibility=1 best-practices=0.96 LCP 0.6 s CLS 0 TBT 0 ms warnings []
```

### 6. Codebase recon
- `git log`: two commits (`ecebba2 Initial commit`, `e99574d Found the Bureau`). `projects/` contains only `README.md`, so there is nothing to reuse.
- `projects/README.md`: each project is self-contained with its own `README.md` (what, run, verify, controls), its own manifest and lockfile, one run command and one verify command, and a README link to `bureau/missions/`.
- `.gitignore` already covers `node_modules/`, `dist/`, `coverage/`, `playwright-report/` and `test-results/`. **Not** ignored: `evidence/` (good, since screenshots must be committed) and any `*.trace.json`, so keep traces out of the project tree or ignore them explicitly.
- `.github/workflows/bureau.yml` runs only `bureau validate` and the unittest suite. A project CI job would need `npx playwright install --with-deps chromium` on GitHub runners. That is fine there, but must **never** run here.
- `.claude/settings.json` pre-allows only bureau CLI commands, so npm/npx commands may prompt for permission.
- No prior lessons (`bureau lesson list --tag devops-ci` → `no lessons match`).

## Recommended pipeline (concrete)

`projects/scroll-showcase/package.json` (devDependencies, **exact** pins):
```json
"devDependencies": {
  "@playwright/test": "1.63.0",
  "playwright-core": "1.63.0",
  "@axe-core/playwright": "4.14.0",
  "axe-core": "4.14.1"
},
"engines": { "node": ">=22" },
"scripts": {
  "dev": "node scripts/serve.mjs",
  "test:unit": "node --test tests/unit/",
  "test:e2e": "playwright test",
  "check:size": "node scripts/check-size.mjs",
  "verify": "npm run test:unit && npm run check:size && npm run test:e2e",
  "lighthouse": "lighthouse http://127.0.0.1:4173/ --chrome-flags=\"--headless=new --no-sandbox\" --output=json --output-path=evidence/lighthouse.json"
}
```
- **Unit:** `node --test` (built in, no dependency) on pure animation math modules (`progress → state`, easing, clamp, endpoints at 0 and 1). The site's math modules should be plain ESM that both the browser and node can import.
- **Server:** a zero-dependency `scripts/serve.mjs` (`node:http`, ~10 lines, proven above), used by `dev` and by Playwright `webServer: { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4173' }`. Do not depend on the global `serve`/`http-server`.
- **E2E (`playwright test`):** `projects` per viewport (375×812, 768×1024, 1440×900, 1920×1080), `workers: 2` (4 CPUs), `retries: 0` locally so flakiness shows up. Specs: determinism and reversibility, endpoints, admire (clock), reduced motion, axe + overflow per viewport, console and pageerror health over a full scroll-through, frame-timing measurement written to `evidence/perf.json`, and screenshots per scene at p = 0, 0.25, 0.5, 0.75, 1 to `evidence/` (or the dossier's `evidence/`, as the plan decides).
- **Size check:** `scripts/check-size.mjs` uses `node:zlib` `gzipSync` over the shipped JS and fails above the budget the architect sets.
- **Lighthouse:** optional `npm run lighthouse` with `CHROME_PATH=/opt/pw-browsers/chromium` (needs `lighthouse@13.6.0` added as a devDependency, 179 MB). Keep it out of `verify` because of the weight and noise.
- **Setup command:** `npm ci` (never `npx playwright install`). The README should state that on other machines one must run `npx playwright install chromium` once.

## Facts vs. inferences
**Facts (shown above):** the versions and paths in §1, the npm installs succeeding, the axe peer-dependency hoist and its fix, the 1.65.1 launch failure, the 9/9 fixture pass, clock pause freezing rAF, CSS scroll-timeline determinism, the Lighthouse run and scores, and the repo contents.
**Inferences:** that @playwright/test is "more robust" than `node --test` + global playwright (judgement: auto-retrying assertions and an exportable lockfile matter more than avoiding a 2 s install); that headless frame times under-represent a real laptop (no GPU, SwiftShader); `workers: 2` as the right default; and keeping Lighthouse out of `verify`.

## Implications for the mission
- Pin `@playwright/test`, **and** `playwright-core`, to exactly **1.63.0**. This is the single biggest tooling risk: any drift breaks launch, because browsers cannot be downloaded.
- Design the site for testability. Expose per-scene progress and state through `data-*` attributes or a read-only `window.__showcase` test hook, keep the animation math in pure importable modules, and route the idle timer through `setTimeout` so `page.clock` controls it.
- Admire-mode tests must use `install → goto → pauseAt → runFor`. Scroll-rendering tests must not pause the clock.
- Success criterion 8 (60 fps) can be **measured** here (rAF deltas, CDP metrics) but not credibly **asserted** against a mid-range laptop. Record the numbers as evidence with lenient thresholds (for example median < 20 ms, LayoutCount stays flat during scroll) instead of strict fps gates. WebGL scenes run on SwiftShader and will look slow headless.
- Both CSS `animation-timeline` and JS rAF approaches are testable deterministically here, so the architect may choose freely on technique grounds.
- Top risks: (1) playwright version drift; (2) timing-based flakiness if tests use `waitForTimeout` instead of rAF settling or the clock; (3) heavy canvas/WebGL scenes making the e2e suite slow on a 4-CPU headless box.

## Open questions / unverified
- `screenshot({animations:'disabled'})` behaviour with CSS scroll timelines is unverified. Test it in wave 0.
- The context-level `reducedMotion` option in the Playwright config is unverified here (only `emulateMedia` was exercised).
- Lighthouse was run only against the tiny fixture, and its wall time was not measured.
- Whether the exported project should carry a CI workflow is a decision for the architect or Owner.
