# Where this engine came from

This folder is **Looped**, J Production's engine, as one combined copy:
the full engine from Bar3D plus the upgrades The Last Ember made to it. It
lives here on its own, outside any game. Bar3D keeps its own copy and goes
on as its own project.

| Source | Repository | Commit | What was taken |
| --- | --- | --- | --- |
| Bar3D (the engine's first home) | `Barcode162/3D` | `339ac84` (1 Nov 2026) | All of `looped/`; the engine's native tests from `tools/native/`; `tools/lint_engine.mjs`; `proto/vectors.json`; the first dictionary `assets/words/first.looped` |
| The Last Ember | `Barcode162/ENG` | `1f44690` (2 Nov 2026, J122.1) | `looped/draw/draw.h`, `draw_gl.cpp`, `draw_webgpu.cpp`: drawing into textures (`target`, `beginTarget`, `endTarget`, `toTarget`) on both backends, for sun shadows; WebGL2 rebinding the index buffer when only it changes (a fix) |

Both copies started from the same commit (`339ac84`), and The Last Ember
changed only the three drawing files, so the merge is those three files
taken whole.

## What moved, and why

- `assets/words/first.looped` → `looped/words/first.looped`: the engine's
  own dictionary belongs with the engine (The Last Ember already keeps it
  there). `tests/words_test.cpp` reads it from the new place.
- `proto/vectors.json` → `tests/proto_vectors.json`: the room protocol's
  test vectors, read by `tests/proto_test.cpp`.
- `tools/lint_engine.mjs` now refuses any `#include` from outside
  `looped/`, not just from `bar/`.

## Left behind in Bar3D (they test Bar3D's data, not the engine)

`ui_theme_test` (Bar3D's UI themes), `place_test` and `words_tool` (Bar3D's
places), and the light, bake and rig tools (they load the bar's room).
The house will get its own versions of the light and bake tools.

## Known engine-only gaps

- `looped/apps/viewer` reads a game's `assets/world/` files, so it builds
  only inside a game that has them.
- The engine reads a few data files at run time from the game's folder
  (`assets/models/albedo.json`, compressed textures). A game supplies them.
