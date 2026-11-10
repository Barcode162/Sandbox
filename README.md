# Sandbox
Bunch of things when I want to start from nowhere and export after

## engine/

A dependency-free minimal engine (ES modules):

- `createWorld()` — spawn/destroy entities (plain objects), `query(...keys)`, and ordered systems.
- `runLoop(world, { step, render })` — fixed-timestep loop with interpolation factor.
- `demo.js` — headless run: `node engine/demo.js`
