# Looped

J Production's own engine: C++ compiled to WebAssembly, drawn with WebGPU
(WebGL2 as a fallback), running in the browser, including Safari on the
iPhone. Written from scratch: no outside engine or library at run time.

This folder is the engine only. Games sit beside it (Hearthwake in `../`)
and include it; the engine never includes a game's files
(`tools/lint_engine.mjs` checks that). Where it came from: `FROM.md`.

## Check it

```
bash engine/test.sh          # lint, native tests (g++ and em++ + node), every source built for the web
FAST=1 bash engine/test.sh   # lint and g++ tests only
```

The web parts need Emscripten 6.0.13 (`source emsdk/emsdk_env.sh`).

## What's inside `looped/`

| Part | Files | What it does |
| --- | --- | --- |
| Drawing | `draw/` | One drawing interface on WebGPU and WebGL2, drawing into textures (for shadows), clusters (dense meshes drawn at the detail the eye needs), model specs |
| Renderer | `scene_renderer`, `render_scene`, `gpu`, `gpu_upload`, `pipeline_cache`, `model`, `gltf`, `mesh`, `mesh_data`, `texture`, `culling`, `camera` | Draws a scene: glTF 2.0 models with metal/roughness, compressed textures, culling, background loading and shader compiling |
| Light | `light_units`, `radiosity`, `gi`, `beams`, `shadows`, `ssao`, `post`, `mood` | Real light units, bounced light (CPU patches + GPU bounce), light beams in haze, shadows, soft shade, eyes that adapt, AgX curve, moods |
| Baking | `bake/` | A CPU path tracer that follows every bounce, UV unwrapping, light probes |
| Shaders | `shaders/` | WGSL: scene, shadows, beams, bounce, post, mirrors, text, billboards |
| Words | `words/` | Looped Script: the reader, its maths over time, the dictionary (`first.looped`), places and light rigs written in words |
| World | `world/` | Loops, kinds of things, places, the catalogue |
| Bodies | `skeleton`, `skinned_mesh`, `physics`, `vehicle`, `steering`, `drive/` | Bones and skinned meshes, physics with materials, vehicles |
| Sound | `audio`, `synth`, `midi` | 3D sound, sounds made in code, MIDI |
| Page and input | `host`, `bridge`, `input`, `gamepad`, `fetch`, `file`, `jobs`, `frame_time`, `profiler`, `quality`, `log` | Talking to the page, touch and gamepads, loading, background jobs, timing, quality levels |
| Text and UI | `text`, `font`, `billboard`, `ui`, `ui_theme` | Text, pictures over heads, menus and themes |
| Network | `net`, `netproto` | The multiplayer room's codec |
| Basics | `math`, `json`, `material`, `procedural`, `image`, `place_player` | Maths, JSON, materials (look, feel, sound), surface detail made in code |

## Rules

- Nothing in `looped/` includes a file from outside `looped/`.
- The engine builds with no warnings (`-Wall -Wextra -Werror`).
- Every new piece of the engine gets a test in `tests/` when it can be
  tested without a screen.
- Changes made here are listed in `CHANGES.md`, so Bar3D can take them
  later if it wants.
