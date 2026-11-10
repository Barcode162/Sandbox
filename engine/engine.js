// Minimal engine: entities as plain objects, systems as functions,
// and a fixed-timestep loop. No dependencies.

export function createWorld() {
  const entities = new Set();
  const systems = [];
  let nextId = 1;

  return {
    entities,
    spawn(components = {}) {
      const e = { id: nextId++, ...components };
      entities.add(e);
      return e;
    },
    destroy(e) {
      entities.delete(e);
    },
    addSystem(fn) {
      systems.push(fn);
    },
    update(dt) {
      for (const system of systems) system(this, dt);
    },
    query(...keys) {
      return [...entities].filter((e) => keys.every((k) => k in e));
    },
  };
}

// Runs world.update at a fixed step; render(alpha) gets interpolation factor.
export function runLoop(world, { step = 1 / 60, render = () => {}, clock = () => performance.now() / 1000, frame } = {}) {
  let last = clock();
  let acc = 0;
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const now = clock();
    acc += Math.min(now - last, 0.25);
    last = now;
    while (acc >= step) {
      world.update(step);
      acc -= step;
    }
    render(acc / step);
    if (frame) frame(tick);
  };
  tick();
  return () => { stopped = true; };
}
