# The Constellation memory format (v1)

A memory is one JSON document. The seed (`src/seed/memory.json`), **Export**, **Import** and the browser autosave all use this same shape, and everything that enters the app goes through `validateDoc` in `src/core/persistence.ts`. The TypeScript source of truth is `MemoryDoc` in `src/core/types.ts`.

```json
{
  "schema": "constellation.memory",
  "version": 1,
  "meta": { "title": "…", "defaultPerspective": "cook", "featured": { "route": { "from": "road-a", "to": "road-z" }, "pathway": "p1", "query": "boil" } },
  "perspectives": [ { "id": "cook", "label": "Cook", "accent": "#FF9F5A", "positions": { "temperature": { "x": 0, "y": 10, "z": 0 } } } ],
  "nodes": [ { "id": "temperature", "label": "Temperature", "kind": "variable", "value": 20, "facets": { "physicist": 293, "cook": 20, "child": 2 }, "units": { "physicist": "K", "cook": "°C", "child": "· warm" }, "tags": ["heat"], "created": 0, "updated": 0 } ],
  "relations": [ { "id": "heat-01", "from": "temperature", "to": "heat", "type": "association", "weight": 1, "directed": false, "created": 0 } ]
}
```

## The pieces

**Perspectives** (lenses) are the different ways of seeing one memory. Each has an `id`, a `label`, an optional `description` and `accent` colour, and optional `positions` (node id → `{x, y, z}`). Nodes without an authored position get a deterministic force layout seeded by the perspective id, so a layout is the same on every load.

**Nodes** ("lights") have an `id`, a `label`, a `kind` (`concept`, `variable`, `file`, `note`, `pathway`), a base `value`, `facets`, `tags`, and timestamps in milliseconds (`created`, `updated`). Optional fields are `units`, `notes`, `file` and `pathway`.
- A **value** is text (at most 500 characters), a number, `true`/`false`, or `null`.
- **Facets** hold a value per perspective id. A missing key falls back to `value`. A key that is present, even with `null`, is that lens's own value. A node **disagrees** when its resolved values differ across lenses.
- **Units** are for display only. They map a perspective id, or `"*"` for every lens, to short text (up to 40 characters). The unit for a lens is `units[lens] ?? units["*"]`, so `20` with `°C` reads *20 °C*. A unit that starts with `·` is a scale word naming one value (`2` with `· warm` reads *2 · warm*). Pathway notes show a scale word only beside the value it names.
- A **file** is stored by reference: `{ name, path?, mime?, sizeNote?, content? }`. Inline `content` is text up to 64 KB.
- A **pathway** step is `{ op, target?, expr?, source? }`, with `op` one of `start`, `assign`, `read`, `if`, `while` or `end`. Only nodes of kind `pathway` carry one.

**Relations** ("lines") have `id`, `from`, `to`, `type`, `weight` in (0, 1], `directed` and `created`. They can also carry a `label`, a `branch` (flow only: `next`, `true`, `false`) and `perspectives` (the line exists only in those lenses). The types are:

| type | meaning |
|---|---|
| `association` | a plain link. The seed puts the spec's word in `label`: *relates* (no label), `is-a`, `references`, `reads` |
| `part-of` | a member and its whole |
| `causes` | cause and effect |
| `chain` | the declared, step-by-step route (the Long Road's *next*) |
| `shortcut` | a direct link, learned with **Learn shortcut** |
| `flow` | a pathway control edge, always directed |

A route costs `1 / weight` per hop. Routes and recall use only the lines visible in the active lens. Pathway `flow` lines are never part of routes or recall.

## Pathway expressions

`assign`, `if`, `while` and `end` take a small expression language. It is parsed by hand and never evaluated as code.
- Numbers `12`, `2.5`; text `"hot"` or `'hot'` (escapes `\" \' \\`); `true`, `false`, `null`.
- Variables `heat`, `stirs`. These are names set by earlier `read`/`assign` steps.
- Node values `@Room` or `@"Boiling Point"`. They read the node's value **under the active lens**, which is why one pathway can give three answers.
- Operators, loosest first: `or`, `and`, `not`, comparisons `== != < <= > >=` (one per group), `+ -`, `* /`, unary `-`, and parentheses.
- `+` joins text if either side is text. Otherwise arithmetic needs numbers. Comparing text with numbers, dividing by zero and unknown names stop the run with a sentence. There are no calls, no member access and no reserved names such as `constructor` or `__proto__`.

## What import checks

The envelope comes first (`schema`, `version`, and `nodes` present). After that come the shapes and the references. Every relation endpoint, facet key, `positions` key, `meta.defaultPerspective` and `meta.featured` id must exist. Ids must be unique, and expressions must parse. Each problem is reported with a JSON `path` (for example `nodes[3].facets.cook`) and a plain sentence. Unknown fields are ignored with a warning. A `read` step whose source node was deleted is also only a warning: the memory still opens, and running that pathway stops with *"… no longer exists."*

Autosave writes to `localStorage` under `constellation.memory.v2`, 400 ms after the last change.
