# Log — M-0001 Scroll-driven animation showcase

Chronological record kept by `bureau`. Append with `python3 bureau/bin/bureau log <mission> "<decision>"`.

- `2026-11-20T12:08:42Z` **ceo** — Mission opened — tier 3 (Division), output `projects/scroll-showcase`.
- `2026-11-20T12:09:15Z` **ceo** — Intake: tier 3, interactive-web. Visual-direction bake-off planned (look and feel dominate). Owner's /bureau invocation = authorization for agents.
- `2026-11-20T12:09:15Z` **ceo** — Phase intake → **intel**
- `2026-11-20T12:09:15Z` **ceo** — Convened 3× scout — intel wave: reference, technique, test tooling
- `2026-11-20T12:15:51Z` **ceo** — Intel decisions: JS rAF loop with pure per-scene state(p) (testability > CSS timelines); native scroll, sticky stages at 100svh, overflow:clip, no scroll-jacking/smoothing; admire = 1.2s idle timer reset by any input (scrollend unusable as stop signal); pin playwright/@playwright/test/playwright-core 1.63.0; axe via @axe-core/playwright; frame timing measured not asserted (SwiftShader); <=1000 animated nodes per active scene; Lighthouse optional.
- `2026-11-20T12:15:51Z` **ceo** — Phase intel → **design**
- `2026-11-20T12:15:51Z` **ceo** — Convened 3× experience-designer — visual-direction bake-off A/B/C
- `2026-11-20T12:30:14Z` **ceo** — Convened 1× director-vision — bake-off judgement
- `2026-11-20T12:33:57Z` **ceo** — Bake-off: director-vision picks C 'Bent Light' (8.4; A 7.5, B 6.8). Consolidation order = fold-ins F1-F17 + de-risks D1-D10 in board/bakeoff-experience.md.
- `2026-11-20T12:33:57Z` **ceo** — Convened 1× experience-designer — consolidate winner C into experience.md
- `2026-11-20T13:31:56Z` **ceo** — experience.md consolidated (1101 lines; F1-F17, D1-D10 traced). Designer run hit rate limit after writing; file verified complete by CEO.
- `2026-11-20T13:31:56Z` **ceo** — Convened 1× architect — architecture + plan
- `2026-11-20T13:50:30Z` **ceo** — Architect: 24 WOs / 5 waves; self-hosted Space Grotesk; npm run verify pipeline.
- `2026-11-20T13:50:30Z` **ceo** — Phase design → **plan-review**
- `2026-11-20T13:50:30Z` **ceo** — Convened 1× director-vision — gate1
- `2026-11-20T13:50:30Z` **ceo** — Convened 1× director-engineering — gate1
- `2026-11-20T13:50:30Z` **ceo** — Convened 1× director-risk — gate1
- `2026-11-20T13:52:42Z` **director-vision** — plan gate r1: CONDITIONAL (8.4)
- `2026-11-20T13:55:12Z` **director-engineering** — plan gate r1: CONDITIONAL (8.1)
- `2026-11-20T13:55:21Z` **director-risk** — plan gate r1: CONDITIONAL (7.6)
