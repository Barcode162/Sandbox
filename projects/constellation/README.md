# Constellation

A spatial memory: points of light in a black 3D void, joined by typed, weighted relations, seen through perspectives that disagree, with runnable `if`/`while` pathways and learnable shortcuts.

> Wave-0 scaffold. WO-003 writes the full README (model, controls); WO-002 writes `docs/memory-format.md` (the JSON format).

## Commands (Node ≥ 22.18)
| Command | What it does |
|---|---|
| `npm install` | Install pinned dependencies (Playwright browsers must already be present; never `playwright install` in the Bureau sandbox) |
| `npm run dev` | Dev server on http://127.0.0.1:5173 |
| `npm run build` | Static build to `dist/` |
| `npm run verify` | preflight → typecheck → unit (`node --test`) → build → bundle size → Playwright e2e (axe + console errors + screenshots) |

## Layout
- `src/core/` — DOM-free model: graph, perspectives, layout, routing, retrieval, expressions, flow interpreter, persistence. Public API: `src/core/index.ts`; types: `src/core/types.ts`.
- `src/view/` — Three.js renderer behind `src/view/contracts.ts`.
- `src/ui/` — panels (vanilla DOM). `src/main.ts` wires everything.
- `src/seed/memory.json` — the seed memory, same format as import/export.
