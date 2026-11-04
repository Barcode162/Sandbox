# Hearthwake

A first-person, single-house showcase by **J Production**: a town guard
wakes at dawn in his two-story timber home, in a scene built to look as
close to a photograph as a phone browser can draw. It plays in Safari on
the iPhone and is built on **Looped**, J Production's own engine.

**The plan:** https://claude.ai/artifact/Fw7aQ19HR3428VgSFLAan8 (vision,
feasibility, lore, lighting, every object and the ~1,600 small things,
milestones).

## What's here

| Folder | What it is |
| --- | --- |
| `engine/` | Looped, the engine, on its own: code, shaders, tests, tools. Its own README, `FROM.md` (where it came from) and `CHANGES.md` (what changed here) |
| `house/` | The game itself (from milestone M0 on) |

Bar3D keeps its own copy of the engine in its own repository and goes on as
its own project.

## Checking

```
bash engine/test.sh          # the engine: lint, tests, web build
```

Every push runs the same check on GitHub (`.github/workflows/check.yml`).
