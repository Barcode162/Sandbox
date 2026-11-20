# Aetherwild

A first-person survival, building and dinosaur-taming game that runs in the browser. You wash up on a procedurally shaped island. You gather, craft better tools, build a home, upgrade it from wood to the impossible Voidglass, and tame (or flee from) the dinosaurs.

## Play

No build step and no install. The engine (three.js r149) is vendored, so it also runs offline.

- **Easiest:** open `index.html` in Chrome, Edge or Firefox.
- **Or serve it:** `cd aetherwild && python3 -m http.server 8000`, then open <http://localhost:8000>.

Click the game to capture the mouse. Press **Esc** to pause; progress autosaves every minute and on pause (browser `localStorage`).

## Controls

| Key | Action |
| --- | --- |
| WASD / Shift / Space | Move / sprint / jump (and swim up) |
| C | Crouch: sneak up on shy animals and halve predator detection |
| Left mouse | Gather, attack, eat the selected food, place the selected item |
| E | Interact: feed and tame, drink water, open chests and doors, use stations, set your bed |
| Tab or I | Inventory and crafting |
| B | Build menu |
| U / X | Upgrade or demolish the piece you're aiming at (X also picks up stations) |
| R | Ride a tamed dinosaur and dismount; rotate while placing |
| F | Tell a tame to follow or stay |
| 1–8, mouse wheel | Hotbar |
| H | Field guide |

Inventory: left-click picks up or places a stack, right-click splits it or places one, shift-click quick-moves.

## Progression

1. **Bare hands:** punch trees, boulders and Sunberry bushes for Wood, Stone, Fiber and Berries.
2. **Stone age:** craft a Stone Axe, Pickaxe, Club, Torch and Campfire. Build your first foundation, walls, doorway and roof.
3. **Workbench:** spear, chest, bed (respawn point), furnace and saddle.
4. **Iron:** mine iron deposits with a stone pickaxe and smelt ingots at the furnace. Iron tools, Iron Sword, Metal walls.
5. **Aetherium:** an iron pickaxe can mine glowing Aetherite in the teal **Aether Glade**. Build the **Aether Forge**, fuse Aether Alloy, and get Aether tools, the Aether Blade, Aether Lanterns and glowing Aetherium walls.
6. **Voidglass:** an Aether pickaxe can mine Void Crystal on the highest peaks, or you can take it from a Dreadmaw's heart. Forge Voidglass for near-indestructible walls and the Void Reaver.

A goal tracker in the top-left walks you through all 13 steps.

### Building tiers

Every piece (foundation, wall, doorway, window wall, floor/roof, stairs, door) can be placed at any tier you can afford, or upgraded in place with **U**:

| Tier | HP | Look |
| --- | --- | --- |
| Wood | 300 | Planks and posts |
| Stone | 900 | Offset brickwork |
| Metal | 2,400 | Riveted steel plate |
| Aetherium | 6,000 | Pale alloy with glowing teal inlays |
| Voidglass | 15,000 | Dark glass panes framed in violet light |

Dreadmaws smash through weak walls, so upgrading matters.

## Dinosaurs

| Species | Temperament | How to tame | Rideable |
| --- | --- | --- | --- |
| Skitterbeak | **Shy:** bolts when it sees you | Crouch, sneak up and feed 3 Sunberries | No |
| Stegolith | **Passive:** never attacks, flees when hurt | Feed 6 Sunberries | Yes |
| Trikeros | **Neutral:** charges if provoked | Feed 8 Sunberries while it is calm | Yes |
| Razorclaw | **Aggressive:** hunts in packs of 3, worse at night | Knock it out with the Club, then feed 4 meat | Yes |
| Dreadmaw | **Aggressive apex:** breaks wood and stone walls | Knock it out, then feed 10 meat | Yes |

Tames follow you, defend you, attack whatever you attack, and heal when fed. Keep a **Saddle** in your inventory to ride. Mounted dinosaurs bite enemies and rip through trees and boulders for resources.

## Art direction

Everything in the game is built procedurally in one style, with no imported assets: flat-shaded low-poly, vertex-coloured facets, one shared palette. All geometry goes through a single baker (`G.Builder` in `js/core.js`) and uses the same small set of materials:

- standard
- metal
- emissive Aetherite
- emissive Void crystal
- glass
- unlit glow

Inventory icons are rendered live from the same 3D models, so they always match the world. The only lower-fidelity element is the minimap, which is drawn as a 2D canvas for performance.

## Code map

| File | Contents |
| --- | --- |
| `js/core.js` | Math, noise, shared materials, geometry baker, light pool, particles |
| `js/data.js` | Items, tools, recipes, building tiers, species, goals |
| `js/models.js` | Every model: building pieces per tier, tools, stations, trees, ores, dinosaurs |
| `js/world.js` | Island terrain, biomes, water, sky and day/night cycle, resource nodes, grass |
| `js/physics.js` | Collision grid, ground and ceiling queries, raycasts |
| `js/building.js` | Grid snapping, placement rules, upgrades, doors, stations, chests |
| `js/creatures.js` | Dinosaur AI, taming, knockouts, combat, spawning |
| `js/player.js` | Movement, survival stats, gathering and combat, riding, first-person view model |
| `js/ui.js` | HUD, inventory and crafting, build menu, minimap, icon renderer |
| `js/audio.js` | Synthesised sound effects, save and load |
| `js/main.js` | Bootstrap, input, main loop |
