// WO-002 world unit tests: the pure arena shape (groundHeight / walkableRadius), the Auto quality rule,
// the camera presets and the petal path. Runs in node (no three, no DOM).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arenaRimRadius, groundHeight, walkableRadius } from '../../src/world/ground.ts';
import { fbm2, noise2, noiseAngle } from '../../src/world/noise.ts';
import { autoStep, createAutoState } from '../../src/render/quality.ts';
import { framingFor, PRESETS, type Framing } from '../../src/tuning/camera.ts';
import { ARENA } from '../../src/tuning/arena.ts';
import { AUTO_QUALITY, SCENERY } from '../../src/tuning/world.ts';

const TAU = Math.PI * 2;

test('[W1] noise is deterministic, bounded and smooth', () => {
  for (let i = 0; i < 2000; i++) {
    const x = Math.sin(i * 12.9898) * 50, z = Math.cos(i * 78.233) * 50;
    const v = noise2(x, z, 3);
    assert.ok(v >= -1 && v <= 1, `noise2 in range: ${v}`);
    assert.equal(v, noise2(x, z, 3));
    assert.ok(Math.abs(noise2(x + 1e-4, z, 3) - v) < 1e-2, 'continuous');
    const f = fbm2(x, z, 4, 1);
    assert.ok(f >= -1 && f <= 1);
  }
  // Periodic in the angle: θ and θ + 2π agree.
  for (let k = 0; k < 50; k++) assert.ok(Math.abs(noiseAngle(k * 0.3, 1.2, 7) - noiseAngle(k * 0.3 + TAU, 1.2, 7)) < 1e-9);
});

test('[W2] arena rim follows R(θ) = 15 + 1.4·n1 + 0.6·n2 and walkable = R − 1', () => {
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < 720; i++) {
    const th = (i / 720) * TAU - Math.PI;
    const R = arenaRimRadius(th);
    min = Math.min(min, R);
    max = Math.max(max, R);
    assert.ok(Math.abs(walkableRadius(th) - (R - 1)) < 1e-12, 'walkable = R − 1');
    assert.ok(walkableRadius(th) <= ARENA.radius + 1.4 + 0.6 - 1 + 1e-9, 'walkable ≤ R_max − 1');
  }
  assert.ok(min >= ARENA.radius - 2.0 && max <= ARENA.radius + 2.0, `rim within 15 ± 2 (got ${min.toFixed(2)}..${max.toFixed(2)})`);
  assert.ok(max - min > 0.8, 'the rim is visibly irregular');
  // Continuous across the ±π seam and everywhere else.
  assert.ok(Math.abs(walkableRadius(Math.PI - 1e-6) - walkableRadius(-Math.PI + 1e-6)) < 1e-3);
  for (let i = 0; i < 720; i++) {
    const th = (i / 720) * TAU;
    assert.ok(Math.abs(walkableRadius(th + 1e-4) - walkableRadius(th)) < 2e-3, 'walkableRadius continuous');
  }
});

test('[W3] groundHeight is pure, gently domed and continuous', () => {
  assert.equal(groundHeight(1.234, -5.6), groundHeight(1.234, -5.6));
  const centre = groundHeight(0, 0);
  assert.ok(centre > 0 && centre < 0.25, `flat meadow, top ≈ 0.12 ± 0.1 (${centre})`);
  for (let i = 0; i < 3000; i++) {
    const a = (i * 2.399) % TAU, r = (i % 97) / 97 * 18;
    const x = Math.sin(a) * r, z = -Math.cos(a) * r;
    const y = groundHeight(x, z);
    assert.ok(Number.isFinite(y) && y > -0.4 && y < 0.25, `height bounded at (${x}, ${z}): ${y}`);
    assert.ok(Math.abs(groundHeight(x + 0.01, z) - y) < 0.01 && Math.abs(groundHeight(x, z + 0.01) - y) < 0.01, 'continuous');
  }
  // Every collider's centre and both spawns sit inside the walkable disc.
  for (const c of [...ARENA.colliders, ARENA.heroSpawn, ARENA.golemSpawn, ARENA.bridgeFoot]) {
    assert.ok(Math.hypot(c.x, c.z) < walkableRadius(Math.atan2(c.x, -c.z)), `inside: ${c.x}, ${c.z}`);
  }
});

test('[W4] Auto quality: drops pixel ratio, then tier; never upgrades; ignores stalls', () => {
  const s = createAutoState('high', 2);
  const feed = (ms: number) => {
    let changed = false;
    for (let t = 0; t < AUTO_QUALITY.windowMs + ms; t += ms) changed = autoStep(s, ms) || changed;
    return changed;
  };
  assert.equal(feed(16), false, 'fast frames change nothing');
  assert.equal(s.pixelRatio, 2);
  assert.equal(feed(30), true);
  assert.equal(s.pixelRatio, 1.75);
  feed(30);
  feed(30);
  feed(30);
  assert.equal(s.pixelRatio, 1.0, 'floor 1.0');
  assert.equal(s.quality, 'high');
  feed(30);
  assert.equal(s.quality, 'low', 'then Low');
  assert.equal(feed(30), false, 'nothing further below Low at the floor');
  for (let i = 0; i < 400; i++) autoStep(s, 5);
  assert.equal(s.quality, 'low', 'never upgrades');
  const t = createAutoState('high', 1);
  for (let i = 0; i < 40; i++) autoStep(t, 1000);
  assert.equal(t.quality, 'high', 'stalls (> 250 ms) are not frame cost');
});

test('[W5] camera presets: sorted, interpolated and clamped', () => {
  for (let i = 1; i < PRESETS.length; i++) assert.ok(PRESETS[i]!.aspect > PRESETS[i - 1]!.aspect);
  const f: Framing = { aspect: 0, vfovDeg: 0, pitchDeg: 0, back: 0, up: 0, yawDeg: 0 };
  assert.deepEqual({ ...framingFor(0.3, f) }, { ...PRESETS[0]!, aspect: 0.3 });
  assert.deepEqual({ ...framingFor(3, f) }, { ...PRESETS[PRESETS.length - 1]!, aspect: 3 });
  const a = PRESETS[0]!, b = PRESETS[1]!, mid = (a.aspect + b.aspect) / 2;
  framingFor(mid, f);
  assert.ok(Math.abs(f.vfovDeg - (a.vfovDeg + b.vfovDeg) / 2) < 1e-9);
  // Every preset looks down (pitch 15–35°) and keeps the camera above and behind the hero.
  for (const p of PRESETS) assert.ok(p.pitchDeg >= 15 && p.pitchDeg <= 35 && p.up > 4 && p.back > 4);
});

test('[W6] scenery: temple isle lies far upper-right of the arena; the bridge spans the gap', () => {
  const t = SCENERY.templeIsland;
  assert.ok(t.x > 0 && t.z < -30, 'north-east of the arena');
  const p2 = SCENERY.bridgeP2, foot = ARENA.bridgeFoot;
  const span = Math.hypot(p2.x - foot.x, p2.y - SCENERY.bridgeP1Y, p2.z - foot.z);
  assert.ok(Math.abs(span - 27.3) < 0.3, `bridge ≈ 27.3 m (${span.toFixed(2)})`);
  for (const f of SCENERY.falls) assert.ok(f.y - f.drop < SCENERY.cloudSea.y, 'every fall ends below the cloud sea (bottoms never seen)');
});
