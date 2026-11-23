# Log — M-0002 Constellation: 3D relational memory space

Chronological record kept by `bureau`. Append with `python3 bureau/bin/bureau log <mission> "<decision>"`.

- `2026-11-22T19:28:56Z` **ceo** — Mission opened — tier 2 (Squad), output `projects/constellation`, agent budget 8, levers polish.
- `2026-11-22T19:29:38Z` **ceo** — Phase intake → **design**
- `2026-11-22T19:29:38Z` **ceo** — CEO: tier 2 + polish; no bakeoff — Owner described the visual (black void, dots, lines). Designer and architect run in parallel; brief pins the data model so contracts don't wait on the spec.
- `2026-11-22T19:29:40Z` **ceo** — Convened 1× experience-designer — spec
- `2026-11-22T19:29:40Z` **ceo** — Convened 1× architect — contracts+scaffold
- `2026-11-22T19:36:12Z` **ceo** — Architect DONE: contracts frozen, verify green (127.9 KB gz). Tier 2: architecture.md not required; decisions live in plan.md. Brief trimmed under cap.
- `2026-11-22T19:39:09Z` **ceo** — Designer DONE (5,935 w). CEO decision: spec §13 'window.__cst' maps to frozen window.__constellation; WO-003 may add optional hook members (?seed=1, ?stress=500) per plan change rule.
- `2026-11-22T19:39:09Z` **ceo** — Phase design → **plan-review**
- `2026-11-22T19:39:09Z` **ceo** — plan gate PASSED (round 1)
- `2026-11-22T19:39:09Z` **ceo** — Phase plan-review → **build**
- `2026-11-22T19:39:09Z` **ceo** — Convened 2× engineer — WO-002 core, WO-003 view
- `2026-11-22T20:05:12Z` **ceo** — CEO decisions on WO-002 REQUESTS: (1) retrieval keeps the frozen non-flow spreading rule; spec F11 amended to 2/4/12/11. (2) types.ts additively gains optional MemoryNode.units / NodeInput.units (per-lens + '*') and FacetView.unit; WO-002 to validate + seed them.
- `2026-11-22T20:12:26Z` **ceo** — WO-002 DONE: 80/80 unit, units + formatValue, boil 2/4/12/11.
- `2026-11-23T00:47:17Z` **ceo** — WO-003 engineer stopped by usage limit mid-build (debugging an edge not reaching GPU). WIP checkpointed; resuming same agent after reset.
- `2026-11-23T00:55:13Z` **ceo** — WO-003 DONE. CEO join: verify green (14 e2e). Ratified WO-003's optional view/contracts.ts members; spec F12 amended for substring search.
- `2026-11-23T00:55:15Z` **ceo** — Phase build → **review**
- `2026-11-23T00:55:25Z` **ceo** — Convened 1× code-reviewer — review r1
- `2026-11-23T00:55:25Z` **ceo** — Convened 1× polish-critic — review r1
- `2026-11-23T00:59:19Z` **code-reviewer** — F-001 [S1] filed: UI says 'Saved' when nothing was saved (storage blocked or save failed)
- `2026-11-23T00:59:19Z` **code-reviewer** — F-002 [S2] filed: Imported perspective.accent is unvalidated and interpolated into style attributes (CSS injection, external beacon)
- `2026-11-23T00:59:19Z` **code-reviewer** — F-003 [S2] filed: Import replaces the whole memory with no confirm, no undo and no export-first
- `2026-11-23T00:59:19Z` **code-reviewer** — F-004 [S2] filed: Unreadable autosave is silently overwritten on the next change
- `2026-11-23T00:59:19Z` **code-reviewer** — F-005 [S2] filed: Autosave never flushes on page hide; edits in the last 400 ms are lost
- `2026-11-23T00:59:19Z` **code-reviewer** — F-006 [S2] filed: Undo of Delete drops the node's units (and created time)
- `2026-11-23T00:59:19Z` **code-reviewer** — F-007 [S2] filed: learnShortcut returns an existing lens-hidden shortcut; UI claims 'learned' and Undo deletes the pre-existing line
- `2026-11-23T00:59:31Z` **code-reviewer** — F-008 [S3] filed: Huge numeric literals evaluate to Infinity, bypassing the finite() guard
- `2026-11-23T00:59:32Z` **code-reviewer** — F-009 [S3] filed: maxSteps NaN/Infinity disables the step guard
- `2026-11-23T00:59:32Z` **code-reviewer** — F-010 [S3] filed: Ids named __proto__ silently lose positions/facets on load (plain-object canon copies)
- `2026-11-23T00:59:32Z` **code-reviewer** — F-011 [S3] filed: SpriteLayer/EdgeLayer grow mid-batch without copying already-pushed data
- `2026-11-23T00:59:32Z` **code-reviewer** — F-012 [S3] filed: Seed-specific copy and magic label in product code
- `2026-11-23T00:59:32Z` **code-reviewer** — F-013 [S3] filed: Overlay text-width cache grows without bound
