# Plan — M-0002 Constellation: 3D relational memory space

Contracts live in code under `projects/constellation/`; this plan points at them and does not restate them.

## Decisions
| Decision | Chosen | Rejected & why |
|---|---|---|
| Stack | Vite 8.3.8 + TS 6.0.2 + three 0.187.0, vanilla DOM | React/Svelte: six panels don't justify a framework or its bundle weight. |
| Unit runner | `node --test` on `.ts` via Node 22.18+ native type stripping (`erasableSyntaxOnly`, `verbatimModuleSyntax`, `.ts` import specifiers) | vitest/tsx: an extra toolchain for no gain on a DOM-free core. |
| Seam | Core is DOM-free; view/ui import only `src/core/index.ts`; the renderer only gets `SceneSnapshot`s built by the UI | A renderer reading the graph directly would couple S2's frame loop to S1's internals. |
| Seed | `src/seed/memory.json` in the v1 export format, loaded through `validateDoc` like a user file | A TS seed module would let the seed skip validation and drift from the import path. |
| Positions | Authored per-perspective `positions` win; the rest come from a deterministic force layout seeded by hash(id + perspective) | A random or live simulation would break screenshots and reloads. |
| Route cost | `1 / weight` per hop; `chain` = the declared route; `shortcut` = learned | Hop-count only: leaves weights meaningless to routing. |
| Expressions | Hand-written precedence parser (grammar in `src/core/expr.ts` header) | `eval`/`Function`: forbidden by brief A3. |
| e2e access to WebGL points | `window.__constellation` hook (`ConstellationTestHook`) with `screenPosition`, `nodeIdByLabel`, `idle` | Pixel-hunting on the canvas is flaky. |

Stack verified: `npm view` returned 8.3.8 / 0.187.0 / 6.0.2 / @types/three 0.187.0 / @playwright/test 1.63.0 / @axe-core/playwright 4.14.0 / @types/node 22.20.5; `npm ls` shows a single playwright-core 1.63.0 (pinned plus an `overrides` entry, because axe otherwise pulls in 1.65.1).

## Contracts (frozen at wave 0)
- `src/core/types.ts`: every shared type, including the v1 file format (`MemoryDoc`, `SCHEMA_ID`, `SCHEMA_VERSION`).
- `src/core/index.ts`: the public API. Stub modules (`graph, perspectives, layout, routing, retrieval, expr, flow, persistence`.ts) carry the signatures plus the semantics in doc comments. `src/core/errors.ts` (`CoreError`) is implemented.
- `src/view/contracts.ts`: `Renderer`, `SceneSnapshot`, `RouteTrail`, `ConstellationTestHook`.
- Change rule: WO-002 may **add** core exports and WO-003 may **add** optional members to `view/contracts.ts`. Removing or changing anything is a CEO decision.

## Budgets
| Budget | Target | Measured by |
|---|---|---|
| Frame time at 500 nodes | ≥ 60 fps median (≤ 16.7 ms) on a mid laptop; in CI, `stats().fps` ≥ 30 under SwiftShader as a regression floor | e2e reads `__constellation.stats()` on a generated 500-node doc |
| Perspective morph | ≤ 1200 ms, no frame > 50 ms | e2e times `transitionTo` / `idle()` |
| Retrieval | `retrieve()` ≤ 10 ms on 500 nodes (node); query → lit in the UI ≤ 150 ms | unit test with `performance.now()`; e2e measures input to `idle()` |
| Layout | `forceLayout` ≤ 50 ms for 500 nodes | unit |
| Bundle | JS ≤ 230 KB gz, CSS ≤ 30 KB gz (wave 0: 127.9 KB, mostly three) | `scripts/check-size.mjs` |
| Health | 0 console errors, 0 axe WCAG 2.2 AA violations | harness fixtures (every e2e test) |

## Verify
`cd projects/constellation && npm run verify` runs preflight (Playwright 1.63.0, Node ≥ 22.18), then `tsc`, then `node --test tests/unit/**/*.test.ts`, then `vite build`, then the bundle size check, then `playwright test` (chromium + SwiftShader, `vite preview` on :4174). Every e2e test uses `tests/e2e/support/harness.ts`, which fails on console errors and provides `scan()` (axe) and `shot()` (JPEG q80 into the dossier's `evidence/screens/`). It is green at wave 0.

## Waves
| Wave | Work orders | Notes |
|---|---|---|
| 0 | WO-001 | Done by the architect: scaffold, contracts, stubs, verify green |
| 1 | WO-002, WO-003 | Parallel and disjoint. WO-003 builds against the stubs and its own fixture snapshots until WO-002 lands each module |
| 2 | (CEO) | Integration = `npm run verify` on the merged tree; no hand-merge WO |

**Critical path:** WO-002's `persistence` + `graph` + `layout` → WO-003's `main.ts` wiring of the real seed → the five e2e flows. WO-002 should land modules in that order (persistence/graph/perspectives/layout first, then routing/retrieval, then expr/flow) and say so in its report as each lands.

## Work orders

### WO-001 — Scaffold and contracts
- **Role / discipline:** architect
- **Owns:** `projects/constellation/**` (wave 0 only); after wave 0, still `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `playwright.config.ts`, `scripts/**`, `src/core/types.ts`, `src/core/errors.ts`, `src/view/contracts.ts`
- **Build:** what the Contracts and Verify sections describe.
- **Done when:** [x] `npm run verify` prints `VERIFY PASSED`. [x] Every dependency pinned exactly. [x] Unit test `[C0]` asserts the API surface and e2e test `[E0]` asserts boot plus axe plus zero console errors.

### WO-002 — Core: the memory model (S1)
- **Role / discipline:** engineer / data-structures & interpreters
- **Depends on:** WO-001
- **Owns:** `src/core/**` except `types.ts` and `errors.ts`; `src/seed/memory.json`; `tests/unit/**`; `docs/memory-format.md`
- **Objective:** implement every stub in `src/core/` to its doc comment, and replace the placeholder seed with the seed in design/experience.md, transcribed exactly. That seed must include the 26-node A…Z `chain` with hidden shortcuts, disagreeing facets, and a `while` pathway whose result differs by perspective. Brief §"What the Owner wants" 1–4.
- **Done when:**
  - [ ] One `tests/unit/<module>.test.ts` per core module, with test titles prefixed `[U-<module>-n]`. `npm run verify` stays green with ≥ 60 unit tests and no skips.
  - [ ] graph: CRUD, events (one per mutation, with `previous`), cascade delete, duplicate/not-found errors.
  - [ ] perspectives/layout: `resolveValue` fallback, `disagrees`, relation visibility; `layoutFor` is deterministic (two runs are deep-equal), authored positions are kept, and 500 nodes lay out in ≤ 50 ms.
  - [ ] routing: on the seed, `compareRoutes(A, Z)` declared hops = 25, shortest hops ≤ 3; `learnShortcut` is idempotent and adds one `shortcut`; perspective-hidden relations are not routed.
  - [ ] retrieval: depths and activations are exact on a hand-built graph; 500 nodes in ≤ 10 ms.
  - [ ] expr/flow: a grammar table test (precedence, strings, `@"Long label"`, `not`); malicious input (`constructor`, `__proto__`, `alert(1)`) is a parse error; a `while` loop runs and terminates; the max-step guard yields `max-steps`; the seeded pathway's `result` differs between two perspectives and each `TraceStep.note` is readable.
  - [ ] persistence: the seed validates. Each of ≥ 10 broken docs yields an error naming a `path` with a plain sentence. Export → import round-trips deep-equal. Autosave debounces, flushes on stop and surfaces quota errors through a fake storage.
- **Verification:** `npm run verify` tail plus `node --test tests/unit/` counts in `reports/WO-002.md`.
- **Quality notes:** the error and trace-note copy comes from the experience spec's Voice section; facet values used in conditions must be numbers where the pathway compares them.

### WO-003 — The void and its instruments (S2)
- **Role / discipline:** engineer / WebGL + frontend
- **Depends on:** WO-001; consumes WO-002 through `src/core/index.ts` only
- **Owns:** `src/view/**` except `contracts.ts`; `src/ui/**`; `src/styles/**`; `src/main.ts` (the integration seam); `index.html`; `tests/e2e/**`; `README.md`; `public/**`
- **Objective:** the rendered memory and every panel (inspector, perspective switcher, route finder, pathway runner, search, add/link, import/export), built to design/experience.md. Replace the placeholder `renderer.ts` and `main.ts`. `main.ts` loads the autosave or else the seed through `loadSaved`/`validateDoc`, then calls `createGraph` and `startAutosave`, builds `SceneSnapshot`s from core and installs `window.__constellation`.
- **Done when:**
  - [ ] e2e tests `[E1]`–`[E5]`, one per flow, all passing with `scan()` and screenshots. E1: explore (the first frame breathes before any input). E2: perspective morph ≤ 1200 ms with ghosts showing different values. E3: route A→Z shows "25 hops → N hops" and both trails, and Learn adds a line that survives a reload. E4: run the pathway, switch perspective, re-run, and the explained result differs. E5: store a thing (name, value, file ref), link it, reload, then search finds it.
  - [ ] `[E6]` perf: a generated 500-node doc holds `stats().fps` ≥ 30 under SwiftShader; query to lit in ≤ 150 ms; morph ≤ 1200 ms.
  - [ ] `[E7]` keyboard: every panel is reachable and operable by Tab/Enter/Esc with visible focus. Reduced motion makes morphs instant (duration 0).
  - [ ] Screenshots at 1440×900 and 375×812 of each frame-table moment in experience.md, saved to `evidence/screens/`.
  - [ ] Import of a broken file shows the core's human error. README documents the model, the controls and a link to `docs/memory-format.md`.
- **Verification:** `npm run verify` tail plus the screenshot list in `reports/WO-003.md`.
- **Quality notes:** owns every polish-list item in design/experience.md except the ones tagged core (seed content, copy of errors and trace notes: WO-002).

## Coverage
| Requirement | WO |
|---|---|
| SC1 verify green (typecheck, unit per core module, 5 e2e flows, axe, console, screenshots) | WO-001 harness; WO-002 unit; WO-003 e2e |
| SC2 each "exceptional" line shown by a test or screenshot | WO-003 (E1–E7), WO-002 (U-routing, U-flow) |
| SC3 README: model, controls, JSON format | WO-003 README; WO-002 docs/memory-format.md |
| Exceptional 1 breathing first frame | WO-003 E1 |
| Exceptional 2 morph ≤ 1.2 s + facet ghosts | WO-002 disagrees/layoutFor; WO-003 E2 |
| Exceptional 3 two trails, "25 hops → 3 hops", learn | WO-002 routing; WO-003 E3 |
| Exceptional 4 while pulse, per-perspective result | WO-002 flow; WO-003 E4 |
| Exceptional 5 query lights by depth ≤ 150 ms | WO-002 retrieval; WO-003 E6 |
| Exceptional 6 store, link, find after reload | WO-002 persistence; WO-003 E5 |
| Exceptional 7 60 fps @ 500, no errors, keyboard | WO-003 E6/E7; harness |
| Seed memory teaches in 30 s | WO-002 (content from experience.md) |
| Experience-spec polish list | WO-003, except items tagged core → WO-002 |

## Risks and spikes
- **WebGL under headless Chromium:** retired at wave 0. SwiftShader boots, `[E0]` sees draw calls > 0 with no console errors. Real-GPU 60 fps can't be measured here, so the CI floor is 30 fps under SwiftShader and the Owner checks 60 fps by eye.
- **Labels at 500 nodes:** WO-003 should use a capped label pool (nearest N + selected + matched) on instanced quads or DOM overlays, decided in its first hour and reported. No separate spike.
- **The placeholder seed shape vs the designer's seed:** the shape is frozen in `types.ts`. If experience.md needs a field the shape lacks, WO-002 requests it and the CEO decides.

## Board conditions
