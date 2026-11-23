# Review — code-reviewer — whole product (src/**, tests/**) — round 1 — M-0002

VERDICT: PASS WITH FINDINGS

## Scope reviewed
`projects/constellation/src/core/*` (expr, flow, persistence, graph, internal, perspectives, routing, retrieval), `src/ui/*` (app, shell, dom, toasts, store, inspector, drawer, scene), `src/view/{layers,overlay}.ts` plus renderer setScene/dispose, `src/main.ts`, and `tests/unit/*` (the e2e specs were sampled). Read against plan.md WO-002/WO-003 acceptance.

## Method
- I read the priority files line by line.
- `grep` for innerHTML/eval/Function/style injection. The only `innerHTML` is `dom.ts:64` `svgIcon`, and every caller passes the `ICON` constants. User text reaches the DOM through `h()` text nodes and `textContent` only.
- I ran a hostile-input probe (scratchpad `probe.ts`) on the real core:
  - `__proto__` node id with a position: import ok, position dropped.
  - A 400-digit literal: `Infinity`.
  - A CSS-payload `accent`: accepted.
  - A lens-hidden shortcut: `learnShortcut` returned it, and cook still routes 3 hops.
- `npm run -s test:unit`: `# pass 80 # fail 0 # skipped 0`.
- I scanned the tests for assertion-free cases. The only hit (U-expr-5) asserts through a helper.

## Findings filed
| ID | Sev | Title | Where |
|---|---|---|---|
| F-001 | S1 | "Saved" shown when nothing was saved (storage blocked / failed) | ui/shell.ts:69 |
| F-002 | S2 | Imported `accent` unvalidated → CSS injection via style attr | core/persistence.ts:70 |
| F-003 | S2 | Import replaces memory with no confirm / undo / export-first | ui/shell.ts:57 |
| F-004 | S2 | Unreadable autosave silently overwritten on next change | main.ts:60 |
| F-005 | S2 | No autosave flush on pagehide; last 400 ms lost | main.ts:114 |
| F-006 | S2 | Undo of Delete drops `units` | ui/app.ts:622 |
| F-007 | S2 | learnShortcut returns lens-hidden shortcut; Undo deletes pre-existing line | core/routing.ts:38 |
| F-008 | S3 | Huge literals → Infinity bypass `finite()` | core/expr.ts:93 |
| F-009 | S3 | `maxSteps` NaN/Infinity disables the guard | core/flow.ts:63 |
| F-010 | S3 | `__proto__` ids lose positions/facets in canon copies | core/internal.ts:130 |
| F-011 | S3 | Sprite/Edge layer grow mid-batch without copy (1-frame flicker) | view/layers.ts:448 |
| F-012 | S3 | Seed copy in generic UI ("Long Road", root label "Memory") | ui/drawer.ts:124 |
| F-013 | S3 | Overlay width cache unbounded | view/overlay.ts:81 |

## Checks that passed
- **Expression safety.** The tokenizer and parser are hand-written. There is no call, member or index syntax. Reserved names (`constructor`, `__proto__`, `__*`, the Object.prototype methods) are parse errors (`internal.ts:30-33`). Variables are read with `hasOwn` (`expr.ts:262`). Nesting is capped at 64 and source at 500 chars, so the evaluator's recursion is bounded at about 250. U-expr-4 greps core for eval/Function/with.
- **Flow safety.** `vars` targets go through `isVariableName`, which blocks `__proto__` writes (`flow.ts:206,216`). User errors end as `status:'error'` with no throw. The max-step guard works at its default of 500.
- **Import validation.** It checks the envelope, types, finite numbers, referential integrity, duplicate ids, the 64 KB file cap, the 500-char value cap and parse-checked expressions. Unknown keys are dropped by canonical copies, so nothing extra reaches the store. There is no global prototype pollution. `JSON.parse` own `__proto__` keys only affect local objects (F-010).
- **Storage errors.** `loadSaved` catches blocked storage. Quota errors surface through `onError` and reach the toast.
- **Routing.** One Dijkstra over (cost, hops, id-sequence) labels. The order is preserved under extension, so the tie-break is exact. Stale heap entries are skipped, and lens visibility is honoured.
- **Retrieval.** The round-based relaxation pushes a node again only when it improves, which is correct for best activation within maxDepth, and the depth is its fewest hops.
- **Renderer lifecycle.** Layers are allocated once and reused, with power-of-two growth. `dispose()` releases every geometry and material and removes the canvas and window listeners. Panel re-renders discard their old nodes, so no listeners accumulate.
- **No fakes.** There are no TODO/FIXME/lorem hits. `notImplemented` survives only in frozen `errors.ts` and is unused. Product code holds no hard-coded seed answers. Results come from `runPathway`/`compareRoutes`.

## Strengths worth keeping
- Canonical-copy helpers make export and import deep-equal by construction.
- Frozen snapshots in the store, and an event `previous` that never mutates.
- Error copy that names the step and the missing thing.
- The probe-free unit suite tests behaviour, not implementation.

## Overall assessment
The core is careful and safe. I found no S0, no XSS, and no expression escape. The defects cluster in persistence honesty at the UI seam:
- The UI claims "Saved" without knowing (F-001).
- Three paths can lose a user's memory silently or by one click (F-003, F-004, F-005).
- One hostile-import vector (F-002).

Fix F-001 through F-007 before ship. The S3s are polish.
