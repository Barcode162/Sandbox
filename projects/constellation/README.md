# Constellation

A spatial memory. Every thing you store is a point of light in a black 3D void, and every relation is a line between two points. You look at it through **perspectives** that disagree, you run `if`/`while` **pathways** through it, and it can **learn shortcuts**.

## The model in one minute
- **Points** (nodes) hold a value. A point is a *thing*, a *variable*, a *file* reference (name, path, type, size note, optional text) or a *pathway step*.
- **Lines** (relations) are typed and weighted: relates, is-a, part-of, references, next (a declared chain), reads, flow (pathway control) and shortcut (learned).
- **Perspectives** (lenses) such as Cook, Physicist and Child can give one point different values. *Temperature* is `20 °C` to the Cook and `293 K` to the Physicist. A line can also exist only in some lenses. When you switch lenses, the space re-forms. Any point whose values disagree shows faint **ghosts** of the other lenses' values instead of hiding them.
- **Pathways** are flowcharts made of points (`start`, `read`, `assign`, `if`, `while`, `end`). Their conditions read point values under the active lens, so the same pathway can loop twice for the Cook and four times for the Physicist. The result card explains why.
- **Routes**: you ask for a route from A to Z. The declared chain (25 hops) and the weighted shortest route (3 hops) race each other as two lit trails. **Learn shortcut** adds a permanent A–Z line.
- **Recall**: when you type a word, the matches flare, and their neighbours light up by how many hops away they are (1, 2 or 3). The Results tab lists the same groups.

Everything autosaves to this browser (localStorage) and can be exported or imported as JSON. The file format is in [`docs/memory-format.md`](docs/memory-format.md).

## The Guidebook example: learn retrieval on everyday data
If you are not sure yet what to store, open **••• → Open the Guidebook example**. It replaces the current memory after asking (you can export first). It is about 150 everyday things: a home, money, people, a day job, learning, health, a Lisbon trip, a side project called *Garden app*, the checkout code of its shop, and the files that go with all of them. Its three lenses are three moments in time: **Today**, **Last year** and **Next year**.

It opens on **Start here**. Each "Try" light around it is one way of getting something back out:

| Way to ask | Try this | What you learn |
|---|---|---|
| By a word | `/` then `tax`, `Sam`, `renew`, `pdf`, `Lisbon` | Search reads names, values, tags, file paths and notes, so a half-remembered word is enough. Things 1, 2 and 3 hops away light up too. |
| By neighbourhood | Click *Sam*, *Files* or *Money* | What goes with this, without knowing what to search for. |
| By connection | `R`, then *Try the featured route* (Idea → Launch) | 13 declared steps, or 3 through *Garden app* and its client. Press `2` and route again: last year there was no client, so it takes 7. |
| By time | `1` `2` `3` | Rent, savings, the project status and who Sam is all change; lights that disagree show ghosts. |
| By computing | `P`, run *Can I afford the trip?* in each lens | One rule, three answers: "Not yet: 400 USD short" today, "2300 USD short" last year, "Book it" next year. *Months until the trip?* is a `while` loop; *What will checkout charge?* flows values through the code variables. |

The Guidebook stores no secrets: where a password matters it records where the password lives. Its source is `tests/unit/support/guidebook-source.ts` (regenerate `src/seed/guidebook.json` with `node tests/unit/support/write-guidebook.ts`); `tests/unit/guidebook.test.ts` checks every answer above, and it loads on demand, so it does not slow the first paint.

## Controls
| Input | Action |
|---|---|
| Drag · right-drag (or Shift-drag) · wheel | Orbit · pan · dolly (touch: one finger orbits, two pinch and pan) |
| Click a light | Select it, fly to it and open the inspector |
| `1` `2` `3` | Cook · Physicist · Child lens |
| `/` | Ask the memory (search) |
| `Esc` | Undo one layer: link mode, menu, search, run, route, inspector, drawer |
| `←` `↑` `→` `↓` · `[` `]` | Move to the nearest neighbour in that direction · cycle through neighbours |
| `Enter` / `F` | Open the inspector / fly to the selection |
| `N` · `L` (long-press on touch) | Store a thing · link the selection to another light |
| `R` · `P` | Route drawer · Pathways drawer |
| `Space` / `S` | Run or pause / step the pathway |
| `D` (hold) | Expand every ghost with its value |
| `Home` | Reset the camera |
| `Ctrl/⌘+Z` · `Ctrl/⌘+E` | Undo · export |
| `?` | Key map |

Reduced motion is respected. Lens switches become instant, ghosts stay expanded, there is no drift or breathing, and pulses step from node to node.

## Commands (Node ≥ 22.18)
| Command | What it does |
|---|---|
| `npm install` | Install the pinned dependencies (the Playwright browsers must already be present) |
| `npm run dev` | Dev server on http://127.0.0.1:5173 |
| `npm run build` | Static build to `dist/` (deployable as-is: relative paths) |
| `npm run verify` | preflight → typecheck → unit tests (`node --test`) → build → bundle size → Playwright e2e (axe, console errors, screenshots) |

URL flags: `?seed=1` ignores the autosave and opens a fresh seed. `?stress=500` opens a generated 500-point memory for checking frame time; that memory is never autosaved.

## Layout
- `src/core/`: the DOM-free model (graph, perspectives, layout, routing, retrieval, expressions, flow interpreter, persistence). Public API: `src/core/index.ts`.
- `src/view/`: the Three.js renderer behind `src/view/contracts.ts`. Each node is one SDF point sprite with its glyph chosen by kind. Edges are instanced screen-space quads, so they can have width, dashes, sheen and lens gradients. Additive layers sit on true black with no post-processing. One clock drives every animation.
- Labels are a capped pool of DOM elements: 40 by default, 18 below 600 px and 48 at 1920 px. They are placed greedily in priority order (selected, hovered, search matches, neighbours, Long Road letters, degree), and any label that would overlap a placed label or a node core is skipped.
- `src/ui/`: the panels (vanilla DOM): top bar, drawer (Route · Pathways · Results), inspector, Store sheet, link mode and toasts. `src/main.ts` wires everything together and installs `window.__constellation`, the test hook.
- `src/seed/memory.json`: the seed memory, in the same format as import and export.
- Fonts: Manrope and IBM Plex Mono, self-hosted under the SIL Open Font License (`src/styles/fonts/OFL-*.txt`).
