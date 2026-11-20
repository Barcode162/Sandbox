# Playbook — Interactive web

For websites, web apps, dashboards, tools with a UI, landing pages, data visualization, and 3D on the web.

## Default tech (the architect may overrule, with reasons)
- **Apps:** TypeScript + Vite with React, Svelte or vanilla, chosen for fit; CSS with design tokens as custom properties; minimal dependencies. Never let it look like an unstyled component kit.
- **Content sites:** plain HTML/CSS/JS or a static-site generator. Static output, no server unless it is needed.
- **Charts:** a light library or hand-built SVG, designed rather than left at library defaults.
- **Commands:** `npm run dev`, `npm run build`, `npm run verify`. Verify every version with `npm view`.

## Design system first
Before screens, wave 1 builds the tokens and core components:
- **Tokens:** color (light *and* dark), type scale, spacing on a 4/8 grid, radii, elevation, motion durations and easing.
- **Components in every state:** default, hover, focus-visible, active, disabled, loading, error and empty.

## The experience spec must also cover
- The information architecture and the three to five key flows.
- The first screen: what it says and does in the first 5 seconds.
- **Real copy** everywhere, including microcopy, errors and empty states.
- Loading, empty and error states for every view.
- Microinteractions: what responds to what, and how.
- Responsive behavior at 375, 768, 1024, 1440 and 1920 px.
- Dark mode, reduced motion, and form validation with its error language.

## Budgets (defaults; set per project in the architecture)
- LCP ≤ 2.5 s, CLS ≤ 0.05, INP ≤ 200 ms.
- JS ≤ 200 KB gzipped for a typical app; images sized and lazy-loaded.
- Lighthouse performance ≥ 90 (mobile) and accessibility ≥ 95, where Lighthouse can run in the environment.

## Accessibility — WCAG 2.2 AA
Contrast, logical keyboard order, visible focus, landmarks, labelled controls, alt text, ARIA only where native semantics fall short, `prefers-reduced-motion`, `prefers-color-scheme`, and 200% zoom with no horizontal scroll. Add an axe scan (`@axe-core/playwright`) to the verify command.

## Verification specifics
`npm run verify` should run:
- typecheck and unit tests;
- Playwright e2e across the viewports;
- an axe scan on every route;
- screenshot capture of every route and state;
- a bundle-size check;
- console-error health checks.

## Staffing
frontend, design-system, motion, accessibility, responsive-layout, data-viz, copywriting, and backend / api-design if there is a server. Use the `bakeoff` lever (three direction cards) on visual direction for anything brand-facing or where looks are the point. A single page or site is tier 2 + `bakeoff,polish`, whatever its ambition (L-0001). Spec it with frame tables (`bureau/exemplars/frame-table.md`).

## Reviewer checklist (web addendum)
- Every interactive element has hover, focus, active and disabled states.
- No layout shift on load, no flash of unstyled content, no orphaned spinners.
- Text never overflows its container at any viewport, and long and unusual content (40-character words, empty lists, 10,000 rows) is handled.
- Keyboard-only use completes every flow.
- Copy is specific and human. There are no "Lorem", "Click here" or "Something went wrong" messages without a next step.
