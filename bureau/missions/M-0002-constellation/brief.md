# M-0002 — Constellation: 3D relational memory space

| | |
|---|---|
| Tier | 2 (Squad) · levers: polish |
| Domain / playbook | interactive-web |
| Output | `projects/constellation` |
| Dossier | `bureau/missions/M-0002-constellation` |
| Opened | 2026-11-22 |
| Program | — (milestone 1 of a possible program: a vertical slice at full polish) |

## The ask (verbatim)
> I want to make a program that is going to have 3d spacing memory retireval, relational storage points for data different perspectives that show different facades that would otherwise disagree to show the multi faceted nature of storing variables and "things" or files or anything that we need to store and relate to one another and I want to implement the pathways of coding such as the while loops for the if then loops, I have a visual in mind that is like a black space I can see points and dots and lines connecting them all together forming webs of data and more than data sort of like a memory of concepts interconnected. Between each other allowing shortcuts to be made between each other for example a pathway is long and tedious because there's having to go through point a b all the way to z instead of going from a to f which is connected to x that's right next to z to deduce any data flow to just that relational depth and power of different results due to data flow patterns we know

## What the Owner actually wants
A **spatial memory**: a real, usable store where anything (a variable, a file reference, a note, a concept) is a point of light in a black 3D void, and relations are lines. Four ideas carry it:
1. **Relational storage.** Points hold data; lines are typed, weighted relations. You can add, link, edit, save and load.
2. **Perspectives (facets).** One point can hold *different values under different perspectives* — the same "Temperature" is `300 K` to the Physicist lens, `hot` to the Cook lens. Switching perspective re-shapes the space (positions, visible relations, labels). Where perspectives disagree, the disagreement is *shown*, not hidden: it is the point.
3. **Pathways of code.** Control flow — `if/then/else`, `while` — lives in the web as pathway nodes. Running a pathway sends a visible pulse through the graph; conditions read point values *under the active perspective*, so the same pathway yields different results in different perspectives.
4. **Shortcuts.** Retrieval finds routes between points. A long chain A→B→…→Z can be replaced by A→F→X→Z; the app finds the short route, shows both, and lets you *learn* the shortcut as a new direct association. Retrieval by query lights up the web by relational depth (spreading activation: 1 hop bright, 2 hops dimmer…).

## Definition of exceptional
1. The first frame, before any input, is a slowly breathing constellation in true black — already beautiful, already legible as "a memory".
2. Switching perspective morphs the whole space in under 1.2 s with no pop; disagreeing points visibly split into facet "ghosts" with their differing values readable.
3. Asking for a route from the long-chain endpoints shows the naive path and the shortcut side by side as two lit trails, with hop counts (e.g. "25 hops → 3 hops"); "Learn shortcut" draws a new permanent line.
4. Running the seeded `while` pathway produces a pulse you can watch loop and branch; switching perspective and re-running produces a different, explained result.
5. Typing a query retrieves: matches flare and their neighbourhood lights by depth within 150 ms on the seed graph.
6. A stranger can store their own thing (a name, a value, a file reference), link it and find it again after a reload.
7. 60 fps on a mid laptop with 500 points; no console errors; keyboard reachable.

## Scope
- **In:** single-page web app (Vite + TypeScript + Three.js). A headless, tested core (graph store, facets/perspectives, pathfinding & shortcuts, spreading-activation retrieval, a small flow interpreter for if/while pathways, JSON persistence). A rendered void with points, lines, labels, facet ghosts, pulses. Panels: inspector, perspective switcher, route finder, pathway runner, search, add/link. A rich original seed memory that demonstrates every idea (including a 26-point A…Z chain with hidden shortcuts). localStorage autosave + JSON import/export.
- **Out:** real filesystem indexing, sync, a backend, a full language — later milestones. A "file" is a reference (name, path, type) plus optional short text.
- **Milestones:** M1 (this) the vertical slice above. Later: file drop-ingest, embedding-based similarity edges, a textual pathway editor, VR/WebXR.

## Constraints & assumptions
- [A1] Browser-only, static build; three@0.187.0, vite@8.3.8 (verified with `npm view`), Node 22.
- [A2] "Facades that disagree" = per-perspective values on the same node + per-perspective relation visibility; a node "disagrees" when its facet values differ across perspectives.
- [A3] "Pathways of coding" = a visual flow graph of typed pathway nodes (start, assign, if, while, read, end) whose conditions are tiny safe expressions over node values — no `eval`.
- [A4] Shortcut = weighted shortest path over all relations vs the "declared" chain; learning one adds a `shortcut` relation.

## Success criteria
1. `npm run verify` green: typecheck, unit tests for every core module, Playwright e2e of the five flows (explore, perspective, route+learn, run pathway, store+find after reload), axe scan, console-error check, screenshots of the frame-table moments.
2. Every "definition of exceptional" line demonstrated by a screenshot or a test.
3. README explains the model, the controls and the JSON format.

## Lessons in force
- L-0001: one page at flagship craft is tier 2 + levers, not tier 3.
- L-0003: spend spec words on frame tables (moment / on screen / why).
- L-0004: freeze contracts as code; build in few vertical slices.
- L-0005: resume agents with SendMessage; waves ≤ 4.

## Risks known at intake
- 3D label legibility — declutter and depth fade.
- Abstract concept; the seed must teach it in 30 s.
- Line + label performance at 500 nodes.
