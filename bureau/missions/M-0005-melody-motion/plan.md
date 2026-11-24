# Plan — M-0005 Melody's Crystals: motion

## Architecture (contracts)
- `site/js/motion.js` — the one motion module: `reveal(root)` (IntersectionObserver, staggered rise, once), `glint(el)` (specular sweep), `rollNumber(el, from, to, fmt)`, `flyToBag(fromImg)`, `shake(el)`, `burst(el)` (confirmation sparkle), `prefersReduced()`. Pure Web Animations API, no dependency.
- `site/css/styles.css § Motion` — motion tokens, the hover/press micro-interactions, the hero shimmer, the `.js-reveal` pre-state (applied only by JS after the observer is ready, so content shows without JS).
- Pages opt in by calling `motion.reveal(document)` after render; components carry `data-reveal` / `data-stagger`.
- Contract: everything is transform/opacity. With reduced motion, `motion.*` resolves instantly (fade ≤ 120 ms or none).

## Work orders
- **WO-1 Motion build** (CEO, as in M-0004): module + CSS + wiring on all four pages, per `design/experience.md` inventory.
- **WO-2 Motion tests** (CEO): inventory coverage (every listed selector animates), reduced motion = no transforms, JS-disabled visibility, CLS probe, existing 50 e2e stay green.
- **Review**: code-reviewer (fresh, perf/a11y/regressions), polish-critic (fresh; motion frames via frame-sequence screenshots). **Ship**: director-vision.
- **Delivery**: republish `site/` to gh-pages `/melody-crystals/` (Owner pre-approved for this site).

## Budget
designer (resumed from M-0004, no new convening in this mission's books beyond 1), code-reviewer 1, polish-critic 1, director-vision 1 → 4 of 8.

## Board conditions
(none at tier 2)
