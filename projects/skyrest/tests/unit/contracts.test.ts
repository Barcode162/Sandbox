// Wave-0 contract checks (WO-001): the frozen surface exists and the sim core is deterministic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSim, stepSim } from '../../src/core/sim.ts';
import { neutralIntent } from '../../src/core/intent.ts';
import { createBus } from '../../src/core/bus.ts';
import { makeRng, rand, seedWord } from '../../src/core/rng.ts';
import { ARENA } from '../../src/tuning/arena.ts';
import { fightSim, mash, run } from './support/script.ts';

test('[C0] createSim builds a plain-JSON state with the frozen shape', () => {
  const s = createSim(7);
  assert.equal(s.phase, 'title');
  assert.equal(s.minions.length, ARENA.minionPool);
  assert.deepEqual(structuredClone(s), JSON.parse(JSON.stringify(s)));
});

test('[C1] rng is seeded and reproducible', () => {
  const a = { rng: seedWord(42) }, b = { rng: seedWord(42) }, c = { rng: seedWord(43) };
  const sa = Array.from({ length: 5 }, () => rand(a));
  assert.deepEqual(sa, Array.from({ length: 5 }, () => rand(b)));
  assert.notDeepEqual(sa, Array.from({ length: 5 }, () => rand(c)));
  for (const v of sa) assert.ok(v >= 0 && v < 1);
  assert.equal(makeRng(9)(), makeRng(9)());
});

test('[C2] same seed + same script ⇒ identical state', () => {
  const script = [[30, { moveX: 1 }], [10, { moveY: 1 }], ...mash(6)] as const;
  const a = fightSim(5), b = fightSim(5);
  run(a, script);
  run(b, script);
  assert.deepEqual(a, b);
});

test('[C3] title → intro → fight on confirm', () => {
  const s = createSim(1);
  const ev = run(s, [[1, { confirm: true }], [70, {}]]);
  assert.equal(s.phase, 'fight');
  assert.deepEqual(ev.filter((e) => e.type === 'phase').map((e) => (e as { phase: string }).phase), ['intro', 'fight']);
});

test('[C4] stick moves the hero: moveX → +x, moveY → -z, inside the arena', () => {
  const s = fightSim();
  const x0 = s.hero.pos.x, z0 = s.hero.pos.z;
  run(s, [[60, { moveX: 1 }]]);
  assert.ok(s.hero.pos.x - x0 > 3, `moved ${s.hero.pos.x - x0}`);
  run(s, [[30, { moveY: 1 }]]);
  assert.ok(s.hero.pos.z < z0 - 1);
  run(s, [[600, { moveX: 1 }]]);
  assert.ok(Math.hypot(s.hero.pos.x, s.hero.pos.z) <= ARENA.radius);
});

test('[C5] attacking the golem lands hits, hit-stop, and eventually victory with coins', () => {
  const s = fightSim(3);
  s.flags.golemPassive = true;
  run(s, [[100, {}], [40, { moveY: 1 }]]); // let it wake; walk up to it
  const ev = run(s, [...mash(200, 10), [400, {}]]);
  const hits = ev.filter((e) => e.type === 'hit' && e.target === 'golem');
  assert.ok(hits.length > 5, `hits ${hits.length}`);
  assert.ok(ev.some((e) => e.type === 'death' && e.target === 'golem'));
  assert.ok(s.coins > 0);
  assert.equal(s.phase, 'victory');
});

test('[C6] bus delivers typed and any-listeners, unsubscribe works', () => {
  const bus = createBus();
  const got: string[] = [];
  const off = bus.on('wake', () => got.push('wake'));
  bus.onAny((e) => got.push('any:' + e.type));
  bus.emit({ type: 'wake' });
  off();
  bus.emit({ type: 'wake' });
  assert.deepEqual(got, ['wake', 'any:wake', 'any:wake']);
});

test('[C7] stepSim is allocation-light: 10k idle steps run under 200 ms', () => {
  const s = fightSim();
  s.flags.golemPassive = true;
  const it = neutralIntent();
  const t = performance.now();
  for (let i = 0; i < 10_000; i++) stepSim(s, it);
  assert.ok(performance.now() - t < 200);
});

test('[C8] camera presets interpolate by aspect and clamp at the ends', async () => {
  const { framingFor, PRESETS } = await import('../../src/tuning/camera.ts');
  const out = { aspect: 0, vfovDeg: 0, pitchDeg: 0, back: 0, up: 0, yawDeg: 0 };
  assert.equal(framingFor(0.3, out).vfovDeg, PRESETS[0]!.vfovDeg);
  assert.equal(framingFor(3, out).vfovDeg, PRESETS[PRESETS.length - 1]!.vfovDeg);
  const mid = framingFor((PRESETS[0]!.aspect + PRESETS[1]!.aspect) / 2, out).vfovDeg;
  assert.ok(Math.abs(mid - (PRESETS[0]!.vfovDeg + PRESETS[1]!.vfovDeg) / 2) < 1e-9);
});

test('[C9] every frame-table moment F1–F13 has a script', async () => {
  const { MOMENTS, MOMENT_IDS } = await import('../../src/moments/index.ts');
  for (const id of MOMENT_IDS) assert.equal(typeof MOMENTS[id], 'function', id);
});

test('[C10] camYaw rotates the stick: facing +90° camera turns stick-up into +x', () => {
  const s = fightSim();
  const x0 = s.hero.pos.x;
  run(s, [[30, { moveY: 1, camYaw: Math.PI / 2 }]]);
  assert.ok(s.hero.pos.x - x0 > 1.5, `dx ${s.hero.pos.x - x0}`);
});
