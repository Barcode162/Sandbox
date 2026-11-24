# M-0005 — Melody's Crystals: motion

| | |
|---|---|
| Tier | 2 (Squad) + `polish` |
| Domain / playbook | interactive-web |
| Output | `projects/melody-crystal-shop` (continues M-0004) |
| Dossier | `bureau/missions/M-0005-melody-motion` |
| Opened | 2026-11-24 |

## The ask (verbatim)
> Now id like you to add life to it make it have a lot of animations for all the components

## What the Owner actually wants
The shop should feel alive and delightful, not static. Every component moves with intent: scrolling reveals sections, cards respond to the pointer, prices and the bag react to choices, checkout steps flow, the confirmation celebrates. "A lot" means coverage of every component. It does not mean noise: it must still read as Melody's warm, hand-labelled shop and sell crystals.

## Definition of exceptional
1. **Every component has motion:** header, hero, meanings rows, chips, cards, how-it-works, FAQ, footer, product gallery, tiles, stepper, buttons, drawer, toast, checkout steps, errors, summary, confirmation, credits. An inventory in the spec maps each one to its motion, and a test asserts it.
2. **A signature moment:** crystals catch light. A specular glint sweeps across photos on hover and entrance, and the hero has a slow living shimmer. It is unique to this shop, and the vision board said M-0004 lacked one.
3. **Scroll choreography:** sections and grids reveal with staggered rise as they enter the viewport, once, never re-hiding.
4. **Feedback motion:** price and total counters roll; add-to-bag flies a thumbnail to the bag icon; the badge bumps; errors shake once; the confirmation has a quiet crystal-sparkle burst.
5. **Feels premium:** 60 fps (transform/opacity only, no layout thrash), CLS stays ≤ 0.05, no added JS dependency over 10 KB, and motion never delays a click or hides content.
6. **Respectful:** `prefers-reduced-motion` turns it all into instant or fade-only, and content is fully visible without JS or before the reveal fires (no blank page if the observer fails).

## Scope
- **In:** CSS and JS motion for every component on all four pages; a shared motion module; tests for coverage, reduced motion and no-JS visibility; republish to gh-pages (pre-approved).
- **Out:** sound, 3D/WebGL, parallax that fights scrolling, new features.

## Constraints & assumptions
- [A1] Stay dependency-free: Web Animations API plus IntersectionObserver.
- [A2] The existing 50 e2e tests stay green; they run with reduced motion where timing would flake.

## Success criteria
1. `npm run verify` green, plus new motion tests (inventory coverage, reduced motion, content visible with JS disabled).
2. No console errors; CLS ≤ 0.05 on home and product (measured).
3. Polish-critic passes the spec's motion frames.

## Lessons in force
- L-0001 / L-0003: tier 2 + lever; spend the spec on frame tables.
- L-0010: never let decoration replace the real photography.

## Risks
- Over-animation that feels cheap or slows shopping, so durations stay at 120–600 ms and nothing loops except the hero shimmer.
- Reveal-on-scroll hiding content in screenshots, tests or crawlers, so content is visible by default and JS adds the pre-reveal state only once the observer is ready.
