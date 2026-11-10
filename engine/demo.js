import { createWorld, runLoop } from "./engine.js";

const world = createWorld();

world.spawn({ pos: { x: 0, y: 0 }, vel: { x: 1, y: 0.5 } });
world.spawn({ pos: { x: 5, y: 5 }, vel: { x: -0.5, y: 0 } });

// Movement system
world.addSystem((w, dt) => {
  for (const e of w.query("pos", "vel")) {
    e.pos.x += e.vel.x * dt;
    e.pos.y += e.vel.y * dt;
  }
});

// Headless run: simulate 2 seconds at 60 Hz and print positions.
const frames = 120;
for (let i = 0; i < frames; i++) world.update(1 / 60);
for (const e of world.query("pos")) {
  console.log(`entity ${e.id}: x=${e.pos.x.toFixed(2)} y=${e.pos.y.toFixed(2)}`);
}
