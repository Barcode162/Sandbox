# Bent Light

*Six refractions of one white beam.* A single-page scroll piece about white light: it splits a beam, lets you stand inside its colours, bends them through glass and puts them back together. Its subject is its own animation. Every frame is a pure function of where you are on the page, so you can scroll back and it rewinds exactly, or stop anywhere and it waits for you.

> **Status: wave-0 skeleton.** The page boots, pins and exposes its test hook, and the scenes are flat-colour stubs. Scenes, chrome, admire mode and the full test suite arrive in later work orders. This README is a stub that the final integration (WO-024) completes with controls, budgets and deploy notes.

It is a static site with no build step: native ES modules in `site/`, no runtime dependencies and no network requests at runtime.

## Run

Requires Node ≥ 22.

```sh
npm ci          # exact, lockfile-pinned dev dependencies
npm run dev     # serves site/ at http://127.0.0.1:4173 (loopback only)
```

`PORT` overrides the port. The dev server also serves the scene harness at `http://127.0.0.1:4173/__dev/harness.html?scene=3&p=0.5&amb=0&t=0`.

`site/` is the whole deployable unit. Any static file server can host it.

## Verify

```sh
npm run verify        # typecheck, static guards, unit, size and assets, e2e, perf, evidence index
npm run verify:quick  # the fast subset engineers run while building (seconds)
```

`verify` prints a step table and writes `verify-summary.json` to the evidence directory. That is `$SHOWCASE_EVIDENCE_DIR` if set, otherwise the mission dossier's `evidence/` when this project sits inside the Bureau sandbox, otherwise `./evidence-local/`.

Other scripts: `npm run typecheck`, `test:unit`, `test:e2e`, `test:perf`, `check:size`, `verify:mutants` (planted-defect proofs, outside `verify`), `evidence:motion` (screen recordings, outside `verify`), and `lighthouse` (optional; it needs network access and pulls about 179 MB of unlocked dependencies through `npx`, and it expects `npm run dev` to be running).

### Playwright and browsers

The e2e suite uses `@playwright/test` and `playwright-core`, both pinned to exactly **1.63.0**.

- **In the Bureau sandbox, never run `playwright install`.** The browsers are pre-installed for 1.63.0 (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`), and no other version can launch there.
- **On any other machine,** run `npx playwright install chromium` once after `npm ci`.

## Credits

Set in Space Grotesk, vendored in `site/fonts/` under the SIL Open Font License 1.1 (`site/fonts/OFL.txt`; source and hashes in `site/fonts/SOURCE.md`).

## Mission record

Brief, design, plan, reviews and evidence live in the Bureau dossier: [`bureau/missions/M-0001-scroll-showcase/`](../../bureau/missions/M-0001-scroll-showcase/).
