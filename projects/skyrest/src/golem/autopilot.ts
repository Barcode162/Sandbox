// src/golem/autopilot.ts — owned by WO-004. A scripted player for tests and moments: it reads only what a player
// sees (the golem's pose and the telegraph decal it implies, shockwave rings, pebbles) and answers with stick,
// attack and roll — no flags, no cheats. Pure: no three/DOM.
import type { Intent, SimState } from '../contracts.ts';
import { GOLEM, MINION } from '../tuning/golem.ts';
import { HERO } from '../tuning/hero.ts';
import { dirX, dirZ, facingOf, wrapAngle } from '../core/math.ts';
import { gx } from './sim.ts';

export interface AutopilotMemory {
  /** Steps since the last attack press (paces the combo). */
  sinceAttack: number;
}
export const autopilotMemory = (): AutopilotMemory => ({ sinceAttack: 99 });

/** Point the stick at world direction (wx, wz) for camYaw 0 (moveX → +x, moveY → −z). */
function stick(into: Intent, wx: number, wz: number): void {
  const m = Math.hypot(wx, wz) || 1;
  into.moveX = wx / m;
  into.moveY = -wz / m;
}

/** Is (x, z) inside the area the golem's current telegraph will strike? Returns frames left, or -1 if safe. */
export function threat(s: SimState, x: number, z: number, margin: number): number {
  const g = s.golem;
  const a = g.attack;
  if (!a) return -1;
  const t = GOLEM.attacks[a];
  let left = -1;
  if (g.action === 'windup' && a !== 'toss') left = gx(g).windupLen - g.actionFrame;
  else if (g.action === 'strike' && a === 'toss') left = t.strike - g.actionFrame;
  else if (g.action === 'strike' && a === 'sweep') left = 0;
  if (left < 0) return -1;
  if (a === 'sweep') {
    const dx = x - g.pos.x, dz = z - g.pos.z;
    const off = Math.abs(wrapAngle(facingOf(dx, dz) - g.facing));
    return Math.hypot(dx, dz) <= t.radius + margin && off <= ((t.arcDeg / 2 + 15) * Math.PI) / 180 ? left : -1;
  }
  return Math.hypot(x - g.target.x, z - g.target.z) <= t.radius + margin ? left : -1;
}

/** One step of play written into `into` (camYaw 0). */
export function autopilot(s: SimState, mem: AutopilotMemory, into: Intent): void {
  into.moveX = into.moveY = 0;
  into.attack = into.dodge = into.skill = into.pause = into.confirm = false;
  into.camYaw = 0;
  mem.sinceAttack++;
  const h = s.hero, g = s.golem;
  if (s.phase === 'title') {
    into.confirm = true;
    return;
  }
  if (s.phase !== 'fight' || h.action === 'dead') return;
  const free = h.action === 'idle' || h.action === 'run';
  const rolling = h.action === 'dodge';

  // 1. A telegraph covers us: walk out early, roll out late.
  const left = threat(s, h.pos.x, h.pos.z, 0.7);
  if (left >= 0) {
    const sweep = g.attack === 'sweep';
    const cx = sweep ? g.pos.x : g.target.x, cz = sweep ? g.pos.z : g.target.z;
    let ax = h.pos.x - cx, az = h.pos.z - cz;
    if (Math.hypot(ax, az) < 0.2) {
      ax = -dirX(g.facing);
      az = -dirZ(g.facing);
    }
    stick(into, ax, az);
    if (left <= 10 && !rolling) into.dodge = true;
    return;
  }
  // 2. A shockwave ring is about to reach us: roll so the i-frames swallow it.
  for (let i = 0; i < s.hazards.length; i++) {
    const hz = s.hazards[i]!;
    if (!hz.active || hz.spent || hz.kind !== 'shockwave') continue;
    const r = hz.r0 + (hz.r1 - hz.r0) * Math.min(1, hz.age / hz.frames);
    const speed = (hz.r1 - hz.r0) / hz.frames;
    const gap = Math.hypot(h.pos.x - hz.pos.x, h.pos.z - hz.pos.z) - r - hz.band * 0.5;
    if (gap > -0.05 && gap < speed * 4 && h.iframes < 4 && !rolling) {
      stick(into, h.pos.x - hz.pos.x, h.pos.z - hz.pos.z);
      into.dodge = true;
      return;
    }
  }
  // 3. Nearest live target: the golem, or a pebble that is closer.
  let tx = g.pos.x, tz = g.pos.z, tr = GOLEM.radius;
  let best = Math.hypot(h.pos.x - tx, h.pos.z - tz) - tr;
  for (let i = 0; i < s.minions.length; i++) {
    const m = s.minions[i]!;
    if (m.action === 'inactive' || m.action === 'dead' || m.action === 'spawn') continue;
    const d = Math.hypot(h.pos.x - m.pos.x, h.pos.z - m.pos.z) - MINION.radius;
    if (d < best - 0.5) {
      best = d;
      tx = m.pos.x;
      tz = m.pos.z;
      tr = MINION.radius;
    }
  }
  const golemBusy = g.action === 'windup' && g.attack !== 'toss';
  if (best > HERO.reach * 0.7) {
    // Close in, but never walk into a live decal.
    const nx = h.pos.x + (tx - h.pos.x) * 0.15, nz = h.pos.z + (tz - h.pos.z) * 0.15;
    if (golemBusy && threat(s, nx, nz, 1.2) >= 0) return;
    stick(into, tx - h.pos.x, tz - h.pos.z);
    return;
  }
  // 4. In reach: face it and strike; the skill on a stagger or when ready.
  if (free || h.action.startsWith('attack')) {
    if (free) {
      // A light touch of the stick: aims the swing without walking through the target.
      stick(into, tx - h.pos.x, tz - h.pos.z);
      into.moveX *= 0.15;
      into.moveY *= 0.15;
    }
    if (h.skillCooldown === 0 && free && (g.action === 'stagger' || g.action === 'recover')) into.skill = true;
    else if (mem.sinceAttack >= 6) {
      into.attack = true;
      mem.sinceAttack = 0;
    }
  }
}
