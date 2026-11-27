// Round-2 remediation unit tests (node, no three): the arena rim dressing that breaks the far edge's silhouette
// (F-016) and the trunk occlusion test that fades a trunk standing between the camera and the hero (F-022).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rimProps } from '../../src/world/rim.ts';
import { arenaRimRadius, walkableRadius } from '../../src/world/ground.ts';
import { segSegDist2 } from '../../src/world/occlusion.ts';
import { ARENA } from '../../src/tuning/arena.ts';

test('[R1] rim props ring the whole lip: no gap wider than 60° outside the kept-clear mouths', () => {
  const props = rimProps();
  assert.ok(props.length >= 18, `props: ${props.length}`);
  assert.ok(props.some((p) => p.kind === 'bush') && props.some((p) => p.kind === 'rock'));
  const th = props.map((p) => p.theta).sort((a, b) => a - b);
  let gap = th[0]! + Math.PI * 2 - th[th.length - 1]!;
  for (let i = 1; i < th.length; i++) gap = Math.max(gap, th[i]! - th[i - 1]!);
  assert.ok(gap < (60 * Math.PI) / 180, `largest gap ${((gap * 180) / Math.PI).toFixed(1)}°`);
  assert.equal(rimProps(), props, 'deterministic and cached');
});

test('[R2] rim props sit on the lip (outside the walkable disc) and keep the bridge mouth clear', () => {
  for (const p of rimProps()) {
    const a = Math.atan2(p.x, -p.z);
    const r = Math.hypot(p.x, p.z);
    assert.ok(r <= arenaRimRadius(a) + 1e-6, `inside the rim at θ ${a.toFixed(2)}`);
    assert.ok(r > walkableRadius(a) - 0.2, `${p.kind} at r ${r.toFixed(2)} intrudes on the walkable disc (${walkableRadius(a).toFixed(2)})`);
    assert.ok(Math.hypot(p.x - ARENA.bridgeFoot.x, p.z - ARENA.bridgeFoot.z) >= 3.4, 'bridge mouth clear');
  }
});

test('[R3] segSegDist2: crossing, parallel, beyond the ends', () => {
  const trunk = { bx: 0, by: 0, bz: 0, x: 0, y: 4, z: 0 }; // vertical, 4 m
  const o = { x: -5, y: 1, z: 0 }, dir = { x: 1, y: 0, z: 0 };
  assert.ok(segSegDist2(o, dir, 10, trunk) < 1e-12, 'sight line through the trunk');
  assert.ok(Math.abs(segSegDist2(o, dir, 10, { ...trunk, bz: 0.5, z: 0.5 }) - 0.25) < 1e-9, '0.5 m beside it');
  assert.ok(Math.abs(segSegDist2(o, dir, 3, trunk) - 4) < 1e-9, 'sight ends 2 m short of the trunk');
  assert.ok(Math.abs(segSegDist2({ x: 0, y: 6, z: 1 }, { x: 0, y: -1, z: 0 }, 10, trunk) - 1) < 1e-9, 'parallel, 1 m off');
  assert.ok(Math.abs(segSegDist2({ x: -5, y: 7, z: 0 }, dir, 10, trunk) - 9) < 1e-9, 'passes 3 m above the canopy end');
});
