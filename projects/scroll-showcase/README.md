# Bent Light

*Six refractions of one white beam.* A single-page scroll piece about white light: it splits a beam, lets you stand inside its colours, bends them through glass and puts them back together. Its subject is its own animation. Every frame is a pure function of where you are on the page, so you can scroll back and it rewinds exactly, or stop anywhere and it waits for you.

## What you'll see

| # | Scene | What happens as you scroll |
|---|---|---|
| 01 | Incidence | A glass prism on a gallery wall turns; its small spectrum opens into a fan that fills the wall, then the rays stand up into seven bands. |
| 02 | Field | The bands take turns filling the room, vermilion to cobalt, until a grid of white dots appears. |
| 03 | Refraction | A triangle, circle and diamond of glass drift over the dots, magnifying them and splitting their colour. |
| 04 | Dichroic | The dots join into a faceted crystal; a point of light moves across it and every facet answers, then it settles back into bands. |
| 05 | Agreement | Seven beams of coloured light in a dark room slide together into one white beam. |
| 06 | Return | The white beam widens into the wall, and the prism is drawn again where you came in. |

**Stop anywhere.** About 1.2 s after you stop, the controls step aside and the scene starts to breathe gently. At 3 s a placard names the frame you stopped on ("04 · DICHROIC · HELD AT 62%"). Any scroll, key or pointer movement brings everything back instantly.

**Controls:** the scene ticks on the right jump to each scene; the button in the bottom-right corner pauses the breathing (remembered across visits); the colophon at the end has **Run it backwards**, which rewinds the whole piece in 8 seconds (any key stops it), and **Jump to the first beam**. With `prefers-reduced-motion`, nothing breathes and Rewind becomes a jump.

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

`npm test` is the same as `npm run verify`.

The suite that defines correct animation is `tests/e2e/animation.spec.js` (17 tests in four groups): the same scroll position always draws the same pixels, including on a fresh visit; a stopped frame doesn't drift; scrolling back rewinds exactly; every scene hits its documented start and end values and hands its seven bands to the next scene exactly; admire mode, the placard and the pause control behave as specified; reduced motion stops breathing; and there is no horizontal scroll and no serious axe violation at 375, 768, 1440 and 1920 px. Two planted bugs (unseeded randomness in Scene 4, and pause not returning the frame) were each confirmed to turn a test red before being reverted.

`verify` prints a step table and writes `verify-summary.json` to the evidence directory. That is `$SHOWCASE_EVIDENCE_DIR` if set, otherwise the mission dossier's `evidence/` when this project sits inside the Bureau sandbox, otherwise `./evidence-local/`.

Other scripts: `npm run typecheck`, `test:unit`, `test:e2e`, `test:perf`, `check:size`, and `lighthouse` (optional; it needs network access and pulls about 179 MB of unlocked dependencies through `npx`, and it expects `npm run dev` to be running).

### Playwright and browsers

The e2e suite uses `@playwright/test` and `playwright-core`, both pinned to exactly **1.63.0**.

- **In the Bureau sandbox, never run `playwright install`.** The browsers are pre-installed for 1.63.0 (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`), and no other version can launch there.
- **On any other machine,** run `npx playwright install chromium` once after `npm ci`.

## Known limitations

- **Smoothness on real devices is unmeasured.** The test machine renders without a GPU, so frame timing is recorded but not asserted. Scene 4 (the canvas crystal) steps its resolution down by itself if it measures slow draws on the visitor's device.
- **Reloading mid-page can shift you by a few dozen pixels.** The browser's scroll restoration races the first layout. The frame you land on is still exactly right for where you land.
- **Static guards, the evidence index and the flash-audit suite were planned but not built** (the verify table shows them as ABSENT). The scene colour changes were designed to the photosensitivity limits in the spec but are not automatically audited.

## Credits

Set in Space Grotesk, vendored in `site/fonts/` under the SIL Open Font License 1.1 (`site/fonts/OFL.txt`; source and hashes in `site/fonts/SOURCE.md`).

## Mission record

Brief, design, plan, reviews and evidence live in the Bureau dossier: [`bureau/missions/M-0001-scroll-showcase/`](../../bureau/missions/M-0001-scroll-showcase/).
