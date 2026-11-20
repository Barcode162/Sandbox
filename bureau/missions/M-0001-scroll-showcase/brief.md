# M-0001 — Scroll-driven animation showcase

| | |
|---|---|
| Tier | 3 (Division) |
| Domain / playbook | interactive-web |
| Output | `projects/scroll-showcase` |
| Dossier | `bureau/missions/M-0001-scroll-showcase` |
| Opened | 2026-11-20 |
| Program | — |

## The ask (verbatim)
> I want to build a website with cool animations as you scroll through letting you stop at any time to admire the beauty the website is about the animations and tests for that itself

## What the Owner actually wants
A website whose whole subject is its own animation: scrolling through it is the experience. Every moment along the scroll should be beautiful enough to stop on. "Stop at any time to admire" means two things: (1) animation is driven by scroll position, so whatever frame you stop on holds and is composed, never caught mid-glitch; and (2) the site notices when you stop and rewards stillness, getting out of the way so you can just look. It ships with automated tests that prove the animations behave: deterministic per scroll position, reversible, correct at their endpoints, accessible, and error-free.

## Definition of exceptional
1. A stranger's first scroll produces a visible, delightful reaction in the first viewport. The opening frame is already art before any scroll.
2. Pausing anywhere, at any of 20 random scroll positions, lands on a composed frame worth screenshotting. No half-rendered, overlapping or awkward states.
3. Stillness is recognised and rewarded: within about a second of stopping, the interface chrome recedes and the scene breathes gently. Any input restores control instantly.
4. Scrolling back up rewinds every scene exactly. The same position always yields the same frame.
5. At least five distinct original scenes, each with its own technique and mood, linked by transitions so it reads as one authored piece rather than a demo reel.
6. A smooth 60 fps on a mid-range laptop, with no layout shift and no console errors.
7. A test suite that is itself legible: someone reading it understands what "correct animation" means for this site.

## Scope
- **In:** a single-page static site; 5–7 scroll-scrubbed scenes; an idle "admire" mode; scene navigation; a progress indicator; full keyboard support; reduced-motion and dark-only (or light/dark) handling as designed; responsive from 375 to 1920 px; unit tests for animation math; Playwright e2e tests for behaviour, including determinism, reversibility, admire mode, accessibility (axe), viewport and console health; screenshots as evidence.
- **Out (and why):** a backend (not needed); a CMS (not asked for); public deployment (needs the Owner's go-ahead per Charter XI, so the Bureau delivers it ready to deploy and asks).
- **Milestones:** single mission.

## Constraints & assumptions
- [A1] No build step unless the architect justifies one. A static site that opens from any static server keeps it exportable and fast.
- [A2] Dependencies are minimal. Playwright is pre-installed in this environment (`require('playwright')` works, Chromium bundled). Any extra npm dev dependency (e.g. `@axe-core/playwright`) must be verified installable here.
- [A3] No external network assets at runtime (fonts, CDNs), so the site and tests run offline and deterministically. System fonts or self-hosted open-licence fonts only.
- [A4] "Admire mode" activates after roughly 1–1.5 s without scroll input, and only after the visitor has started scrolling.
- [A5] Animation is scroll-scrubbed (position-driven), not time-triggered on reveal, except for the ambient breathing during admire mode, which is layered separately and disabled under `prefers-reduced-motion` and by a visible pause control (WCAG 2.2.2).
- [A6] All visual content is original: abstract, generative and typographic art, no imitation of existing sites or brands.

## Success criteria
1. `npm run verify` (from `projects/scroll-showcase`) runs unit, e2e, axe and screenshot steps and exits 0 in this environment.
2. Every scene's rendered state is a pure function of scroll position: e2e tests prove the same position gives an identical state after scrolling away and back, and that the state does not drift while stationary (excluding the separate ambient layer).
3. Each scene reaches its documented start and end states at progress 0 and 1, asserted by tests.
4. Admire mode enters after the idle delay, hides the chrome, shows a status message to assistive tech, and exits on scroll, key or pointer input. Tested.
5. Under `prefers-reduced-motion: reduce`, ambient motion is off and the site stays fully usable. Tested.
6. Zero axe violations (serious or critical) and no horizontal overflow at 375, 768, 1440 and 1920 px. Tested.
7. Zero console errors or unhandled rejections across a full scroll-through. Tested.
8. Measured performance: frame timing during a scripted scroll-through is recorded with numbers in the evidence, and the JS payload stays under budget.
9. Screenshots of every scene at several progress points are captured to `evidence/`.

## Lessons in force
None yet: this is the Bureau's first mission (`bureau lesson list` returns no lessons).

## Risks known at intake
- Scroll-driven sites easily become heavy and janky. Layout thrash, too many DOM nodes, and expensive per-frame work all hurt.
- "Pretty" is subjective, and a weak visual direction would sink the mission. Mitigation: a visual-direction bake-off.
- Headless Chromium differs from real devices in timing, so e2e timing tests must be robust rather than flaky.
- Sticky positioning and `100vh` on mobile browsers (dynamic toolbars) can cause jumps.
