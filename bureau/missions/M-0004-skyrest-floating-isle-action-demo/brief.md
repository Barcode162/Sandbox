# M-0004 — Skyrest: floating-isle action demo

| | |
|---|---|
| Tier | 2 (Squad) · lever: polish |
| Domain / playbook | game |
| Output | `projects/skyrest` |
| Dossier | `bureau/missions/M-0004-skyrest-floating-isle-action-demo` |
| Opened | 2026-11-25 |
| Program | — |

## The ask (verbatim)
> Make a game that has the same graphics and camera work as well as depth and enemies lighting world and everything else. I already have my Loop3d engine but you can build that entire thing in sandbox. It will have its own GitHub push so I can test it live but I want you to make it a really high quality demo to see if you can replicate and how the screenshot game like

Reference: the Owner's screenshot (`evidence/reference.jpg`). A bright stylized fantasy action game: a chibi hero with white hair, a blue cape and a sword slashing a cyan arc at a mossy rock golem labelled **Stone Guardian** with a red health bar and a floating damage number ("2368"); a grassy floating island; round toon trees, a pink blossom tree with petals; grey boulders, flowers, grass tufts; a wooden rope bridge rising to a higher island with a white temple, blue banners and a glowing blue emblem; waterfalls pouring off cliffs into a sea of clouds; a blue sky. HUD: a gold coin counter (top right, "12,580"), a settings gear, a dark translucent menu panel (Preview, Assets, Code, Dashboard, Multiplayer).

## What the Owner actually wants
A proof: can we build, in the browser, a playable demo that *looks like that screenshot* — the soft, warm, saturated "anime-cozy" 3D look, the high three-quarter chase camera, real depth (near trees framing, far island hazy), lit enemies with glowing runes, and combat that feels good. They play from an iPhone (Safari), so it must run and be controllable there. They want a link to try it live.

## Definition of exceptional
1. **Screenshot parity:** the opening gameplay frame, placed beside the reference, reads as the same kind of game: same palette (sky blue, grass yellow-green, warm stone grey, pink blossom, white-and-blue temple), same camera height/angle, the temple island with bridge and waterfalls in the upper right, framing trees in the corners.
2. **Depth you can feel:** three clear planes (framing foliage near, the arena mid, the temple island and cloud sea far) separated by aerial perspective, soft shadows and a bright rim/sky light; nothing looks flat or untextured.
3. **The golem is a presence:** built from mossy boulders that move semi-independently, glowing orange runes and eyes that pulse and flare when it attacks, telegraphed attacks (wind-up, slam with shockwave), a stagger, and a satisfying crumble on death.
4. **Every hit lands:** a bright cyan arc trail, hit-stop, a camera kick, sparks/dust, a numbered damage pop-up (crits bigger and gold), the health bar draining with a lagging white chunk, and sound.
5. **Alive at rest:** grass and trees sway, petals drift, waterfalls flow, clouds drift, banners wave; standing still is still a beautiful frame.
6. **Phone-first control:** on an iPhone a left-thumb joystick and right-side Attack / Dodge buttons work at first touch; on desktop WASD/arrows + J/Space/click. It runs smoothly on a recent iPhone.
7. **A whole small loop:** title → fight the Stone Guardian → coins burst out and fly to the counter → victory → retry/new wave in under 2 s, with a pause/settings menu (sound, quality, reduce shake).

## Scope
- **In:** one floating island arena + the visible temple island and bridge as scenery (bridge walkable is a stretch), the hero (move, 3-hit combo, dodge roll), the Stone Guardian (≥2 attacks), a few small rock minions as a stretch, HUD (coins, boss bar, player hearts/HP, damage numbers), title, pause/settings menu with original menu items, synthesized audio, touch + keyboard + mouse.
- **Out:** multiplayer, the reference menu's Assets/Code/Dashboard features (editor chrome; we keep the panel's look), saving, more levels.

## Constraints & assumptions
- [A1] Browser, Three.js + TypeScript + Vite (playbook default), all assets procedural/original; no paid generation.
- [A2] Original IP: names, character designs and UI are ours. The *style* (stylized toon fantasy) is a genre, not IP. The "Stone Guardian" label is a generic phrase from the Owner's own reference; we keep it.
- [A3] The Owner's "own GitHub push so I can test it live" is read as approval to publish the built game to `gh-pages` under `/Sandbox/skyrest/` (the same way M-0002 was published), leaving other sites untouched.
- [A4] Target device: iPhone 15 Pro-class Safari; WebGL2 (Three.js). Must degrade gracefully (quality setting).

## Success criteria
1. `npm run verify` passes: typecheck, unit tests of combat/AI rules, headless boot with zero console errors, a scripted playthrough that kills the golem, and key-moment screenshots.
2. Side-by-side of the opening frame vs the reference is judged a match on palette, camera, composition and depth by the polish-critic and director-vision.
3. Every item in the definition of exceptional is demonstrably present in screenshots or a test.
4. Touch controls verified in an emulated iPhone viewport (portrait and landscape).
5. Draw calls ≤ 250 and triangles ≤ 1 M on screen; no per-frame allocation in hot loops.
6. Live on GitHub Pages and checked there.

## Lessons in force
- L-0001 tier sizes headcount, not the bar.
- L-0003 the frame table is where spec quality lives.
- L-0004 freeze contracts as code, few vertical slices.
- L-0005 resume agents, waves ≤ 4.
- L-0006 judge 3D layout in projected screen space, with a probe.

## Risks known at intake
- Headless Chromium renders WebGL in software: fps there is not representative; judge look from screenshots, perf from draw calls/triangles.
- Stylized look lives or dies on shading (toon ramp + soft shadows + fog + bloom); getting "AI-render" softness without heavy post on a phone is the hardest call.
- Character modelling from primitives can look cheap; the chibi hero must read at ~10% of screen height.
