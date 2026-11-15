# Sandbox
Bunch of things when I want to start from nowhere and export after

## 🌲 Wildlands — a browser sandbox MMORPG

A top-down, shared-world sandbox game: gather, craft, build, farm and fight together.
No assets, no build step — one small Node server and a canvas client.

### Play

```bash
npm install
npm start          # http://localhost:3000  (set PORT to change)
```

Open the page, pick a name, and choose **Play Online** (shared world on the server) or
**Play Solo** (the same game simulated in your browser, saved to local storage).
Everyone who opens the same server URL plays in the same world. To play with friends,
run it on any Node host (Render, Railway, Fly.io, a VPS…) — it only needs one port and WebSockets.

`npm run build:solo` writes `dist/wildlands-solo.html`, a single offline file with the whole game.

### The loop

- **Gather** – trees, rocks, ore, berries, fibre. Everything regrows, so the world never runs dry.
- **Craft** – wood → stone → copper → iron → star tools, weapons and armor; workbench, furnace, campfire.
- **Build** – walls, floors (bridges over water!), doors, torches, beds (respawn) and claim flags (protect your land).
- **Farm** – plant seeds and saplings, bake bread, cook meat.
- **Fight** – monsters get stronger the further from town you go, and nights are dangerous.
- **Level** – Mining, Woodcutting, Combat and Farming skills level up forever-ish and make you faster and stronger.
- **Bounties** – three always-on quests that refill endlessly with growing rewards; spend coins at the town trader.
- **World events** – every few minutes a meteor crash (starmetal!) or the Slime King appears for everyone.

### Controls

| | Desktop | Touch |
|---|---|---|
| Move | WASD / arrows | joystick |
| Gather / attack | hold left click, or Space (auto-target) | hold ⚔️, or tap the world |
| Place block / eat | right click | tap the world / tap the selected slot |
| Hotbar | 1–9, mouse wheel | tap |
| Panels | E items · C craft · Q bounties · M map · Enter chat | buttons |

### Layout

| Path | What |
|---|---|
| `shared/defs.js` | items, recipes, tiles, monsters, balance numbers |
| `shared/sim.js` | the authoritative game simulation (runs on the server, or in-browser for solo) |
| `server.js` | static files + WebSocket transport + world saving (`data/world.json`) |
| `public/` | client: rendering, input, UI |
| `test/smoke.js` | headless simulation test (`npm test`) |
