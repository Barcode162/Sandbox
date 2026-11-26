// WO-003 hero animation maths (src/hero/pose.ts): slash direction, trail geometry (§5 "hilt → 1.3× tip radius"),
// the finisher hop, and continuity (no pops between consecutive frames of any action).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { HeroAction } from '../../src/contracts.ts';
import { BLADE_LEN, newPose, poseAt, swingCentre, swordPoints, type PoseCtx } from '../../src/hero/pose.ts';
import { HERO } from '../../src/tuning/hero.ts';

const ctx: PoseCtx = { time: 0, stride: 0, speed: 0, idleFrames: 0, gazeYaw: 0, rollBack: 0 };
const pts = [0, 0, 0, 0, 0, 0];
const cen = [0, 0, 0];

function tipAt(a: HeroAction, t: number) {
  const p = poseAt(a, t, ctx, newPose());
  swordPoints(p, pts);
  return { p, hilt: pts.slice(0, 3), tip: pts.slice(3, 6) };
}

test('[HP1] hit 1 slashes right → left, hit 2 left → right (rig +x = hero left), crossing the front as the hitbox opens', () => {
  for (const [a, i, sign] of [['attack1', 0, 1], ['attack2', 1, -1]] as const) {
    const c = HERO.combo[i]!;
    const start = tipAt(a, c.startup * 0.45).tip, end = tipAt(a, c.startup + c.active).tip;
    assert.ok(sign * start[0]! < 0 && sign * end[0]! > 0, `${a}: ${start[0]} → ${end[0]}`);
    const open = tipAt(a, c.startup).tip;
    assert.ok(open[2]! > 0.3, `${a}: blade in front when the hitbox opens (z ${open[2]})`);
  }
});

test('[HP2] the trail reaches 1.3× the tip radius and is longer than the sword (§12 item 4)', () => {
  const p = poseAt('attack1', HERO.combo[0]!.startup, ctx, newPose());
  swordPoints(p, pts);
  swingCentre(p, cen);
  const r = Math.hypot(pts[3]! - cen[0]!, pts[4]! - cen[1]!, pts[5]! - cen[2]!);
  const hiltR = Math.hypot(pts[0]! - cen[0]!, pts[1]! - cen[1]!, pts[2]! - cen[2]!);
  const trailWidth = r * 1.3 - hiltR;
  assert.ok(trailWidth > BLADE_LEN, `trail band ${trailWidth.toFixed(2)} m vs blade ${BLADE_LEN} m`);
});

test('[HP3] the finisher is airborne ~0.35 m at its active frame; the roll turns a full circle', () => {
  const c = HERO.combo[2]!;
  const p = poseAt('attack3', c.startup, ctx, newPose());
  assert.ok(p.hop > 0.33 && p.hop <= 0.35, `hop ${p.hop}`);
  const r = poseAt('dodge', HERO.dodge.frames, ctx, newPose());
  assert.ok(Math.abs(r.lean - Math.PI * 2) < 1e-6);
});

test('[HP4] every action animates continuously (no pops between consecutive frames)', () => {
  const acts: [HeroAction, number][] = [
    ['attack1', 24], ['attack2', 26], ['attack3', 43], ['skill', 41], ['dodge', 23], ['hurt', 21], ['dead', 40], ['victory', 30], ['idle', 30],
  ];
  for (const [a, n] of acts) {
    let prev = tipAt(a, 0);
    for (let t = 0.25; t <= n; t += 0.25) {
      const cur = tipAt(a, t);
      const d = Math.hypot(cur.hilt[0]! - prev.hilt[0]!, cur.hilt[1]! - prev.hilt[1]!, cur.hilt[2]! - prev.hilt[2]!);
      assert.ok(d < 0.3, `${a} hilt jumped ${d.toFixed(2)} m at t=${t}`);
      prev = cur;
    }
  }
});
