# Hearthwake

A first-person, single-house showcase by **J Production**: a town guard
wakes at dawn in his two-story timber home, in a scene built to look as
close to a photograph as a phone browser can draw. It plays in Safari on
the iPhone and is built on **Looped**, J Production's own engine.

**Play:** https://barcode162.github.io/Sandbox/ (on a phone: left thumb
walks, right thumb looks; on a computer: W A S D and drag the mouse).
**Memory test:** https://barcode162.github.io/Sandbox/memory.html
**The plan:** https://claude.ai/artifact/Fw7aQ19HR3428VgSFLAan8 (vision,
feasibility, lore, lighting, every object and the ~1,600 small things,
milestones).

Its home for now is the `hearthwake` branch of `Barcode162/Sandbox`; it
moves to its own repository when that exists.

## What's here

| Folder | What it is |
| --- | --- |
| `engine/` | Looped, the engine, on its own: code, shaders, tests, tools. Its own README, `FROM.md` (where it came from) and `CHANGES.md` (what changed here) |
| `house/` | The game itself: its code, page, world data and checks (`house/README.md`) |

Bar3D keeps its own copy of the engine in its own repository and goes on as
its own project.

## Checking

```
bash engine/test.sh            # the engine: lint, tests, web build
bash house/build.sh            # the house into site/
node house/tools/smoke.mjs     # the house starts, draws and walks; the memory test runs
```

Every push runs all three on GitHub and publishes `site/` to the
`gh-pages` branch (`.github/workflows/build.yml`).
