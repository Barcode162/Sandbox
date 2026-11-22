# Playbook — Games

For anything playable: action, driving, sandbox, puzzle, sim, arcade, toys, and open-world slices.

## Originality (non-negotiable)
Genres, mechanics, camera styles and techniques are free to use. The world, characters, names, story, art, music and UI are **original**. "A crime-sandbox driving game set in an original coastal city" is fine. Recreating an existing game's city, characters, branding or look is not, even renamed (Charter XI.3).

## Scope: the vertical slice
Asks like "an open world" or "as good as <flagship title>" are **Programs** (tier 5). Milestone 1 is a vertical slice: a small part of the world with every system it touches finished to flagship polish. For example:
- one dense district with a day/night cycle and weather;
- traffic and pedestrians that behave believably;
- driving *and* on-foot movement with excellent feel;
- one complete mission with an intro, a climax and an outro;
- HUD, title, pause and settings screens, and full audio.

Later milestones widen the world. They never lower the polish.

## Default tech (the architect may overrule, with reasons)
- **Browser-first**, so it runs anywhere and exports cleanly: TypeScript + Vite; Three.js (plus its postprocessing) for 3D; PixiJS or Canvas 2D for 2D; Rapier (WASM) or a purpose-built solver for physics; the Web Audio API for synthesized SFX and music. Verify every version with `npm view <pkg>@<ver> version`.
- **Fixed-timestep simulation** (e.g. 60 Hz) decoupled from rendering, with interpolation, so behavior is identical at 30 fps and 144 fps.
- **Seeded, deterministic RNG** for procedural content and for tests.
- **Commands:** `npm install && npm run dev` to play, `npm run build` for static output in `dist/`, `npm run verify` for the full check.
- **Assets** are procedural (geometry, shader or canvas textures, synthesized audio) or otherwise original. If the session has an asset-generation connector (image, 3D or audio), it may be used for original assets, but only after the Owner approves the spend (Charter XI.2).

## Staffing
A typical tier-4 wave plan. Group the disciplines below into **vertical slices of at most 4 per wave**, one engineer per slice, carrying several disciplines each (the budget is 30 agents for the whole mission). At tier 2–3, a toy or 2D game is 2–4 slices in total:
- **Wave 0:** scaffold and contracts (integrator).
- **Wave 1:** core loop/gameplay, controls & game-feel, camera, rendering & lighting baseline, world blockout, audio engine, test harness (test-engineer).
- **Wave 2:** AI/behavior, vehicles/physics, shaders/VFX, UI/HUD, progression and save.
- **Wave 3:** content (level, missions), narrative, a juice pass, a performance pass.
- **Then:** polish waves driven by findings.

Use the **`bakeoff` lever** (direction cards) on art direction and on game feel. Those two calls decide most of how the game is received.

## The experience spec must also cover
- **Loops:** the core loop (seconds), the session loop (minutes) and the progression loop (the whole slice).
- **Controls:** keyboard + mouse and gamepad (Gamepad API) mappings; rebinding where feasible; touch if mobile is in scope.
- **Feel, in numbers:** input buffering, coyote time, acceleration and deceleration curves, turn rates, camera spring and lag constants, FOV change with speed, screen-shake amplitude and decay, hit-stop durations, particle counts.
- **Camera:** follow behavior, collision avoidance, look-ahead.
- **World density:** what fills every screen (props, life, ambient motion, light).
- **Atmosphere:** time of day, sky, fog, shadows, and post-processing (tone mapping, bloom, color grading, AO where affordable).
- **Audio:** an SFX list per event, ambience layers, music states, ducking.
- **Onboarding:** teach by doing within the first 30 seconds, never with a wall of text.
- **Menus:** title, pause, settings (volume, sensitivity, graphics quality, accessibility), restart, game over, credits.
- **Failure and retry:** restart in under 2 seconds, and never punish the player with lost progress.
- **Comfort:** remappable controls, text for any spoken audio, colorblind-safe signals, a reduce-shake/motion option, pause anywhere.

## Performance budgets (defaults)
Headless Chromium renders WebGL in software (SwiftShader), so raw fps there is **not** representative. Budget and measure proxies that are:
- Simulation step ≤ 4 ms (CPU, measured).
- `renderer.info`: ≤ 300 draw calls and ≤ 1.5 M triangles on screen (adjust per project in the architecture).
- No per-frame allocations in hot loops, and heap flat over a 3-minute run.
- First playable ≤ 3 s from a local build; bundle size budgeted in the architecture.
- Report real-GPU fps only if the Owner can measure it. Never claim "60 fps" from a software renderer.

If WebGL fails to start in headless Chromium, launch with `args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']`.

## Verification specifics
`npm run verify` should include:
- typecheck and unit tests, where the deterministic simulation makes gameplay testable;
- a headless boot with zero console errors;
- **scripted playthroughs**, where a bot drives the inputs (hold W for 3 s → the vehicle moved forward 20–40 m; complete the tutorial → its flag is set);
- a **frame-rate-independence test** (the same input script at 30 and 144 render Hz gives the same outcome within tolerance);
- screenshot capture of the key moments;
- the perf probe. Timing assertions run **in isolation**, never in the parallel unit pool (`fileParallelism: false` or their own verify step): worker contention flaked M-0002's perf test across two sessions (L-0007).

The polish-critic captures: the title screen; a burst over the first 10 seconds; the core action in motion; HUD close-ups; pause and settings; fail and retry; every time of day.

## Reviewer checklist (game addendum)
- **Motion fixes are verified on a sequence:** at least 4 frames across the moment, plus one capture paused mid-animation. A still frame let 3 of M-0002's 4 late regressions through (L-0008).
- **Juice audit:** every player action gets a visual, audio and, where relevant, camera response.
- **No dead air:** nothing waits without feedback.
- **Readability:** the player always knows where they are, what is dangerous, and what to do next.
- **Consistency:** scale, physics and art style hold together.
- **Abuse:** pause during transitions, alt-tab, resize, unplugging the gamepad, extreme speeds, out-of-bounds, sequence breaks, softlocks.
