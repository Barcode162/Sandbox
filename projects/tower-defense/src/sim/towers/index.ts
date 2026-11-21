// Tower systems (WO-003): auras, targeting, turning, firing, projectiles, stones and skips, pulses, jets, beams.
// Signatures FROZEN by WO-001. Pure and deterministic: towers touch blots only through SimContext (plan § seams),
// except that a Beacon aura may clear blot.pale. Hot loops allocate nothing; events come from WO-002's pool (board cond. 3).
import type { SimContext } from '../../contracts/sim-context';
import type { Blot, BlotKind, DamageType, Projectile, SimState, Tower, TowerKind, TowerStats, UpgradePath } from '../../contracts/types';
import { TICK_S } from '../../contracts/types';
import { BLOTS } from '../../data/blots';
import { TOWERS, tiersValid } from '../../data/towers';
import { FOOTPRINT } from '../../data/map';
import { PATH_TOTAL, type MutVec } from '../path';
import { pooledEvents, type EventPool } from '../events';
import { removeProjectile, spawnProjectile } from './pool';
import { inRange, QBUF, SBUF, KBUF, selectTarget, topFirst } from './targeting';

export { projectileDrops } from './pool';
export { betterTarget, remainingRbe, selectTarget } from './targeting';

const EPS = 1e-9;
const DEG = Math.PI / 180;
/** Projectile collision radii (px): quill triangle 10×3, lance 18×4, jet droplet. */
const PROJ_R: Readonly<Record<'quill' | 'lance' | 'jet', number>> = { quill: 2, lance: 3, jet: 4 };
/** Beam half-width for line hits (px). */
const BEAM_HALF = 2;
/** A skip hop (B2/B3) is a short flat arc; the spec times only the first throw. */
export const SKIP_TICKS = 12;
/** Projectiles leaving this box are culled. */
const BOUNDS = { x0: -80, y0: -80, x1: 1160, y1: 800 };
/** §7 Glacier Carp: frozen blots take +1 from Crush (the only freezer is that tier). */
const FROZEN_CRUSH_BONUS = TOWERS.koi.paths[0][2].effect.set?.frozenCrushBonus ?? 0;

const toTicks = (s: number): number => Math.max(1, Math.round(s / TICK_S));
const V: MutVec = { x: 0, y: 0 };
/** This tick's event pool (board condition 3): set at the top of updateTowers / updateProjectiles. */
let EV: EventPool;
const T: MutVec = { x: 0, y: 0 };

/** Final per-hit damage: (dmg incl. aura) × multVs, + the frozen-Crush bonus (sim-context contract). */
export function hitDamage(base: number, multVs: Partial<Record<BlotKind, number>>, type: DamageType, b: Readonly<Blot>): number {
  const m = multVs[b.kind];
  let d = m === undefined ? base : base * m;
  if (type === 'crush' && b.frozenTicks > 0) d += FROZEN_CRUSH_BONUS;
  return d;
}

/** Towers are in placement order with ascending, never-reused ids → binary search. */
function towerById(towers: readonly Tower[], id: number): Tower | null {
  let lo = 0, hi = towers.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const t = towers[mid];
    if (t.id === id) return t;
    if (t.id < id) lo = mid + 1; else hi = mid - 1;
  }
  for (const t of towers) if (t.id === id) return t; // defensive: order not guaranteed by the core
  return null;
}

function wrapAngle(a: number): number {
  a = (a + Math.PI) % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a - Math.PI;
}

// ───────────────────────────── auras ─────────────────────────────

/** Aura ranking: lower interval multiplier, then more damage, then strip-Pale, then lower owl id. */
function auraBetter(a: TowerStats, b: TowerStats): number {
  if (a.auraIntervalMul !== b.auraIntervalMul) return a.auraIntervalMul < b.auraIntervalMul ? 1 : -1;
  if (a.auraDamageAdd !== b.auraDamageAdd) return a.auraDamageAdd > b.auraDamageAdd ? 1 : -1;
  if (a.auraStripPale !== b.auraStripPale) return a.auraStripPale ? 1 : -1;
  return 0;
}

/** Recompute Owl aura buffs on every tower (best aura wins, never stacks). Called once per tick before updateTowers. */
export function updateAuras(ctx: SimContext): void {
  const towers = ctx.state.towers;
  for (const t of towers) {
    let best: Tower | null = null;
    for (const o of towers) {
      const s = o.stats;
      if (s.auraRadius <= 0) continue;
      const dx = t.x - o.x, dy = t.y - o.y;
      if (dx * dx + dy * dy > s.auraRadius * s.auraRadius) continue;
      if (best === null || auraBetter(s, best.stats) > 0) best = o; // ties keep the lower id (placement order)
    }
    if (best) {
      const s = best.stats;
      t.buffDetect = s.auraDetect;
      t.buffIntervalMul = s.auraIntervalMul;
      t.buffDamageAdd = s.auraDamageAdd;
    } else {
      t.buffDetect = false;
      t.buffIntervalMul = 1;
      t.buffDamageAdd = 0;
    }
  }
  // Beacon Owl: Pale blots entering the aura lose Pale permanently (children inherit the cleared flag).
  for (const o of towers) {
    const s = o.stats;
    if (!s.auraStripPale || s.auraRadius <= 0) continue;
    const n = ctx.queryBlots(o.x, o.y, s.auraRadius, QBUF);
    for (let i = 0; i < n; i++) {
      const b = ctx.blotAt(QBUF[i]);
      if (b.alive && b.pale) b.pale = false;
    }
  }
}

// ───────────────────────────── towers ─────────────────────────────

let keepX = 0, keepY = 0, keepR = 0;
const keepInReach = (b: Blot): boolean => inRange(b, keepX, keepY, keepR);

/** Any live blot (Pale included: area-class) within reach of (x, y)? */
function anyInReach(ctx: SimContext, x: number, y: number, r: number): boolean {
  const n = ctx.queryBlots(x, y, r, QBUF);
  for (let i = 0; i < n; i++) {
    const b = ctx.blotAt(QBUF[i]);
    if (b.alive && inRange(b, x, y, r)) return true;
  }
  return false;
}

/** Speed of a blot right now in px/s (frozen/stunned 0, slowed (1 − slow)). */
function currentSpeed(b: Readonly<Blot>): number {
  if (b.frozenTicks > 0 || b.stunTicks > 0) return 0;
  const v = BLOTS[b.kind].speed;
  return b.slowTicks > 0 ? v * (1 - b.slow) : v;
}

/** Turn, pick targets (§7 Targeting), fire when cooldown ≤ 0; spawn projectiles / pulses / beams. */
export function updateTowers(ctx: SimContext): void {
  EV = pooledEvents(ctx.state);
  const towers = ctx.state.towers;
  for (const t of towers) {
    t.pangle = t.angle;
    if (t.cooldown > EPS) t.cooldown -= TICK_S;
    const s = t.stats;
    switch (s.attack) {
      case 'pulse': updatePulse(ctx, t, s); break;
      case 'jets': updateJets(ctx, t, s); break;
      default: updateAimed(ctx, t, s); break;
    }
  }
}

const ready = (t: Tower): boolean => t.cooldown <= EPS;
function rearm(t: Tower, s: TowerStats): void {
  t.cooldown += s.interval * t.buffIntervalMul;
  if (t.cooldown < 0) t.cooldown = 0;
}
function idle(t: Tower): void {
  if (t.cooldown < 0) t.cooldown = 0;
}

function updateAimed(ctx: SimContext, t: Tower, s: TowerStats): void {
  const target = selectTarget(ctx, t, s.range, t.target);
  if (!target) { t.targetId = 0; idle(t); return; }
  t.targetId = target.id;
  // aim point: stones lead the target by the arc time at its current speed (§7 Pondfrog)
  let ax = target.x, ay = target.y, leadS = target.s;
  if (s.attack === 'stone') {
    leadS = Math.min(PATH_TOTAL, target.s + currentSpeed(target) * s.arcTime);
    ctx.pointAt(leadS, V);
    ax = V.x; ay = V.y;
  } else if (s.attack === 'quill' || s.attack === 'lance') {
    // straight shots aim at the intercept point along the path (2 fixed-point iterations; deterministic)
    const v = currentSpeed(target);
    if (v > 0 && s.projectileSpeed > 0) {
      const muzzle = FOOTPRINT[t.kind] * 0.5;
      for (let k = 0; k < 2; k++) {
        const flight = Math.max(0, Math.hypot(ax - t.x, ay - t.y) - muzzle) / s.projectileSpeed;
        ctx.pointAt(Math.min(PATH_TOTAL, target.s + v * flight), V);
        ax = V.x; ay = V.y;
      }
    }
  }
  const want = Math.atan2(ay - t.y, ax - t.x);
  const rate = TOWERS[t.kind].turnRateDeg * DEG * TICK_S;
  let aligned = true;
  if (rate > 0) {
    const diff = wrapAngle(want - t.angle);
    if (Math.abs(diff) <= rate + EPS) t.angle = want;
    else { t.angle = wrapAngle(t.angle + (diff > 0 ? rate : -rate)); aligned = false; }
  } else t.angle = want;
  if (!aligned) { idle(t); return; }
  if (!ready(t)) return;

  const dmg = s.damage + t.buffDamageAdd;
  if (s.attack === 'beam') fireBeam(ctx, t, s, target, dmg);
  else if (s.attack === 'stone') fireStone(ctx, t, s, ax, ay, leadS, dmg);
  else fireQuills(ctx, t, s, dmg);
  ctx.emit(EV.fire(t.id, t.kind, s.attack, t.x, t.y, t.angle));
  t.shots++;
  t.lastFireTick = ctx.state.tick;
  rearm(t, s);
}

function fireQuills(ctx: SimContext, t: Tower, s: TowerStats, dmg: number): void {
  const kind = s.attack === 'lance' ? 'lance' : 'quill';
  const speed = s.projectileSpeed * TICK_S;
  const muzzle = FOOTPRINT[t.kind] * 0.5;
  for (let k = 0; k < s.spreadDeg.length; k++) {
    const p = spawnProjectile(ctx.state);
    if (!p) continue; // pool full: each lost quill is dropped and counted (board condition 4)
    const a = t.angle + s.spreadDeg[k] * DEG;
    const cx = Math.cos(a), cy = Math.sin(a);
    p.id = ctx.nextSourceId();
    p.kind = kind;
    p.towerId = t.id;
    p.x = p.px = t.x + cx * muzzle;
    p.y = p.py = t.y + cy * muzzle;
    p.vx = cx * speed; p.vy = cy * speed;
    p.angle = a;
    p.damage = dmg;
    p.damageType = s.damageType;
    p.pierceLeft = s.pierce;
    p.maxTravel = s.range * s.projectileLifeMul;
    p.detect = s.detect || t.buffDetect;
    p.areaClass = false;
    p.multVs = s.multVs;
  }
}

function fireStone(ctx: SimContext, t: Tower, s: TowerStats, ax: number, ay: number, leadS: number, dmg: number): void {
  const p = spawnProjectile(ctx.state);
  if (!p) return;
  p.id = ctx.nextSourceId();
  p.kind = 'stone';
  p.towerId = t.id;
  p.x = p.px = p.sx = t.x;
  p.y = p.py = p.sy = t.y;
  p.tx = ax; p.ty = ay;
  p.angle = t.angle;
  p.t = 0;
  p.arcTicks = toTicks(s.arcTime);
  // Stones: `travelled` holds the path distance of the next landing (skips continue along the tangent there);
  // `hitCount` counts landings so far (0 = the throw, ≥ 1 = skips).
  p.travelled = leadS;
  p.hitCount = 0;
  p.damage = dmg;
  p.damageType = s.damageType;
  p.splashRadius = s.splashRadius;
  p.splashMax = s.splashMax;
  p.stun = s.stun;
  p.skipsLeft = s.skips;
  p.detect = true;
  p.areaClass = true;
  p.multVs = s.multVs;
}

/** Owl glare: hitscan. Base hits the target; Piercing Beam runs to max range and hits up to `pierce` blots on the line. */
function fireBeam(ctx: SimContext, t: Tower, s: TowerStats, target: Blot, dmg: number): void {
  const src = ctx.nextSourceId();
  const cx = Math.cos(t.angle), cy = Math.sin(t.angle);
  const eclipse = s.beamAfterimageMs > 0;
  if (!s.beamToMaxRange) {
    const dx = target.x - t.x, dy = target.y - t.y;
    const len = Math.hypot(dx, dy) || 1;
    ctx.hit(target, hitDamage(dmg, s.multVs, s.damageType, target), s.damageType, src, t, dx / len, dy / len);
    ctx.emit(EV.beam(t.id, t.x, t.y, target.x, target.y, eclipse));
    return;
  }
  const len = s.range;
  const mx = t.x + cx * len * 0.5, my = t.y + cy * len * 0.5;
  const n = ctx.queryBlots(mx, my, len * 0.5, QBUF);
  let m = 0;
  for (let i = 0; i < n; i++) {
    const b = ctx.blotAt(QBUF[i]);
    if (!b.alive || !ctx.canSee(t, b)) continue;
    const rx = b.x - t.x, ry = b.y - t.y;
    const along = rx * cx + ry * cy;
    const R = BLOTS[b.kind].radius;
    if (along < -R || along > len + R) continue;
    const perp = Math.abs(rx * cy - ry * cx);
    if (perp > R + BEAM_HALF) continue;
    // insertion by distance along the beam, then lower id
    let j = m++;
    while (j > 0 && (KBUF[j - 1] > along || (KBUF[j - 1] === along && ctx.blotAt(SBUF[j - 1]).id > b.id))) {
      KBUF[j] = KBUF[j - 1]; SBUF[j] = SBUF[j - 1]; j--;
    }
    KBUF[j] = along; SBUF[j] = QBUF[i];
  }
  let left = s.pierce;
  for (let i = 0; i < m && left > 0; i++) {
    const b = ctx.blotAt(SBUF[i]);
    if (!b.alive) continue;
    const r = ctx.hit(b, hitDamage(dmg, s.multVs, s.damageType, b), s.damageType, src, t, cx, cy);
    if (r !== 'none') left--;
  }
  ctx.emit(EV.beam(t.id, t.x, t.y, t.x + cx * len, t.y + cy * len, eclipse));
}

/** Mist Koi pulse: fires only if a blot is in reach; hits instantly, First order, ≤ pulseMax; slows; every Nth freezes. */
function updatePulse(ctx: SimContext, t: Tower, s: TowerStats): void {
  if (!ready(t)) return;
  const n = ctx.queryBlots(t.x, t.y, s.range, QBUF);
  keepX = t.x; keepY = t.y; keepR = s.range;
  const m = topFirst(ctx, n, s.pulseMax, keepInReach); // area-class: Pale both triggers and takes it
  if (m === 0) { idle(t); t.targetId = 0; return; }
  t.shots++;
  const freeze = s.freezeEvery > 0 && t.shots % s.freezeEvery === 0;
  const src = ctx.nextSourceId();
  const dmg = s.damage + t.buffDamageAdd;
  const slowTicks = toTicks(s.slowDur);
  const freezeTicks = toTicks(s.freezeDur);
  t.targetId = ctx.blotAt(SBUF[0]).id;
  for (let i = 0; i < m; i++) {
    const b = ctx.blotAt(SBUF[i]);
    if (!b.alive) continue;
    const dx = b.x - t.x, dy = b.y - t.y;
    const len = Math.hypot(dx, dy) || 1;
    ctx.hit(b, hitDamage(dmg, s.multVs, s.damageType, b), s.damageType, src, t, dx / len, dy / len);
    // Wash-immune Wax still feels the cold: slows and freezes apply regardless of the hit result.
    if (!b.alive) continue;
    if (s.slowPct > 0) ctx.slow(b, s.slowPct, slowTicks);
    if (freeze) ctx.freeze(b, freezeTicks, s.slowPct);
  }
  ctx.emit(EV.fire(t.id, t.kind, 'pulse', t.x, t.y, 0));
  ctx.emit(EV.pulse(t.id, t.x, t.y, s.range, freeze));
  t.lastFireTick = ctx.state.tick;
  rearm(t, s);
}

/** Typhoon Koi: 8 radial jets every 0.30 s, rotating 11.25° per volley; area-class; carry any A1 slow. */
function updateJets(ctx: SimContext, t: Tower, s: TowerStats): void {
  if (!ready(t)) return;
  if (!anyInReach(ctx, t.x, t.y, s.jetRange)) { idle(t); t.targetId = 0; return; }
  const phase = t.shots * s.jetRotateDeg * DEG;
  const speed = s.projectileSpeed * TICK_S;
  const muzzle = FOOTPRINT[t.kind] * 0.6;
  const dmg = s.damage + t.buffDamageAdd;
  for (let k = 0; k < s.jetCount; k++) {
    const p = spawnProjectile(ctx.state);
    if (!p) continue; // dropped and counted
    const a = phase + (k * 2 * Math.PI) / s.jetCount;
    const cx = Math.cos(a), cy = Math.sin(a);
    p.id = ctx.nextSourceId();
    p.kind = 'jet';
    p.towerId = t.id;
    p.x = p.px = t.x + cx * muzzle;
    p.y = p.py = t.y + cy * muzzle;
    p.vx = cx * speed; p.vy = cy * speed;
    p.angle = a;
    p.damage = dmg;
    p.damageType = s.damageType;
    p.pierceLeft = s.jetPierce;
    p.maxTravel = s.jetRange;
    p.detect = true;
    p.areaClass = true;
    p.multVs = s.multVs;
    p.slowPct = s.slowPct;
    p.slowDur = s.slowDur;
  }
  ctx.emit(EV.fire(t.id, t.kind, 'jets', t.x, t.y, phase));
  t.shots++;
  t.lastFireTick = ctx.state.tick;
  rearm(t, s);
}

// ───────────────────────────── projectiles ─────────────────────────────

/** Move projectiles, collide via ctx.queryBlots, land stones (splash, skips), expire. */
export function updateProjectiles(ctx: SimContext): void {
  EV = pooledEvents(ctx.state);
  const st = ctx.state;
  const pool = st.projectiles;
  let i = 0;
  while (i < pool.count) {
    const p = pool.items[i];
    const tower = towerById(st.towers, p.towerId);
    const alive = tower !== null && (p.kind === 'stone' ? stepStone(ctx, p, tower) : stepDart(ctx, p, tower));
    if (alive) i++;
    else removeProjectile(pool, i);
  }
}

function hasHit(p: Projectile, id: number): boolean {
  for (let k = 0; k < p.hitCount; k++) if (p.hitIds[k] === id) return true;
  return false;
}

/** Quill, lance or jet: swept segment test against blot circles, hits in order along the path of flight. */
function stepDart(ctx: SimContext, p: Projectile, tower: Tower): boolean {
  p.px = p.x; p.py = p.y;
  const nx = p.x + p.vx, ny = p.y + p.vy;
  const step = Math.hypot(p.vx, p.vy);
  const pr = PROJ_R[p.kind as 'quill' | 'lance' | 'jet'];
  const n = ctx.queryBlots((p.x + nx) * 0.5, (p.y + ny) * 0.5, step * 0.5 + pr, QBUF);
  const ux = step > 0 ? p.vx / step : 1, uy = step > 0 ? p.vy / step : 0;
  let m = 0;
  for (let i = 0; i < n; i++) {
    const b = ctx.blotAt(QBUF[i]);
    if (!b.alive || b.immuneTo === p.id || hasHit(p, b.id)) continue;
    if (b.pale && !p.areaClass && !p.detect) continue; // non-detecting darts pass through Pale (§6)
    const rx = b.x - p.x, ry = b.y - p.y;
    const along = Math.max(0, Math.min(step, rx * ux + ry * uy));
    const qx = p.x + ux * along - b.x, qy = p.y + uy * along - b.y;
    const reach = BLOTS[b.kind].radius + pr;
    if (qx * qx + qy * qy > reach * reach) continue;
    let j = m++;
    while (j > 0 && (KBUF[j - 1] > along || (KBUF[j - 1] === along && ctx.blotAt(SBUF[j - 1]).id > b.id))) {
      KBUF[j] = KBUF[j - 1]; SBUF[j] = SBUF[j - 1]; j--;
    }
    KBUF[j] = along; SBUF[j] = QBUF[i];
  }
  const slowTicks = p.slowPct > 0 ? toTicks(p.slowDur) : 0;
  for (let i = 0; i < m && p.pierceLeft > 0; i++) {
    const b = ctx.blotAt(SBUF[i]);
    if (!b.alive) continue;
    const id = b.id;
    const r = ctx.hit(b, hitDamage(p.damage, p.multVs, p.damageType, b), p.damageType, p.id, tower, ux, uy);
    if (r === 'none') continue;
    if (p.hitCount < p.hitIds.length) p.hitIds[p.hitCount++] = id;
    p.pierceLeft--; // immune hits spend pierce too (§6 rule 3)
    if (slowTicks > 0 && b.alive) ctx.slow(b, p.slowPct, slowTicks);
  }
  p.x = nx; p.y = ny;
  p.travelled += step;
  if (p.pierceLeft <= 0 || p.travelled >= p.maxTravel) return false;
  return p.x >= BOUNDS.x0 && p.x <= BOUNDS.x1 && p.y >= BOUNDS.y0 && p.y <= BOUNDS.y1;
}

/** Stone arc; on landing: splash (≤ splashMax, First order, area-class), optional stun, then skips. */
function stepStone(ctx: SimContext, p: Projectile, tower: Tower): boolean {
  p.px = p.x; p.py = p.y;
  p.t = Math.min(1, p.t + 1 / p.arcTicks);
  p.x = p.sx + (p.tx - p.sx) * p.t;
  p.y = p.sy + (p.ty - p.sy) * p.t;
  if (p.t < 1 - EPS) return true;
  land(ctx, p, tower);
  if (p.skipsLeft <= 0) return false;
  // Skip: hop skipDistance along the path's travel direction at the landing point, then splash again.
  const s = tower.stats;
  ctx.tangentAt(p.travelled, T);
  p.skipsLeft--;
  p.hitCount++;
  p.sx = p.tx; p.sy = p.ty;
  p.tx = p.sx + T.x * s.skipDistance;
  p.ty = p.sy + T.y * s.skipDistance;
  p.travelled = Math.min(PATH_TOTAL, p.travelled + s.skipDistance);
  p.splashRadius = s.skipRadius;
  p.splashMax = s.skipMax;
  p.t = 0;
  p.arcTicks = SKIP_TICKS;
  return true;
}

function land(ctx: SimContext, p: Projectile, tower: Tower): void {
  const x = p.tx, y = p.ty;
  const n = ctx.queryBlots(x, y, p.splashRadius, QBUF);
  const m = topFirst(ctx, n, p.splashMax, keepAny);
  const stunTicks = p.stun > 0 ? toTicks(p.stun) : 0;
  for (let i = 0; i < m; i++) {
    const b = ctx.blotAt(SBUF[i]);
    if (!b.alive || b.immuneTo === p.id) continue;
    const dx = b.x - x, dy = b.y - y;
    const len = Math.hypot(dx, dy);
    const r = ctx.hit(b, hitDamage(p.damage, p.multVs, p.damageType, b), p.damageType, p.id, tower, len > 0 ? dx / len : 0, len > 0 ? dy / len : -1);
    if (stunTicks > 0 && r !== 'immune' && b.alive) ctx.stun(b, stunTicks);
  }
  ctx.emit(EV.land(p.id, p.towerId, x, y, p.splashRadius, p.hitCount > 0, p.stun > 0));
}
const keepAny = (_b: Blot): boolean => true;

// ───────────────────────────── pool + UI helpers ─────────────────────────────

/** Allocate the projectile pool (capacity 2048) for a new sim. */
export function createProjectile(): Projectile {
  return {
    id: 0, kind: 'quill', towerId: 0, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, angle: 0, damage: 0, damageType: 'cut',
    pierceLeft: 0, travelled: 0, maxTravel: 0, detect: false, areaClass: false, multVs: {}, slowPct: 0, slowDur: 0,
    hitIds: new Int32Array(16), hitCount: 0, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, arcTicks: 0, splashRadius: 0,
    splashMax: 0, stun: 0, skipsLeft: 0,
  };
}

export type TierStatus = 'owned' | 'next' | 'sealed' | 'max' | 'locked';
export interface TierView { status: TierStatus; cost: number; affordable: boolean; shortBy: number }

/** Fold-card view of one tier box (§10.4). Pure; used by UI and by the sim's upgrade command. */
export function tierStatus(state: Readonly<SimState>, tower: Readonly<Tower>, path: UpgradePath, tier: 1 | 2 | 3): TierView {
  const def = TOWERS[tower.kind].paths[path][tier - 1];
  const cur = tower.tiers[path];
  const next: [number, number] = [tower.tiers[0], tower.tiers[1]];
  next[path] = tier;
  let status: TierStatus;
  if (tier <= cur) status = 'owned';
  else if (!tiersValid(next[0], next[1])) status = 'sealed';
  else if (tier === cur + 1) status = 'next';
  else status = 'locked';
  const shortBy = Math.max(0, def.cost - state.money);
  return { status, cost: def.cost, affordable: shortBy === 0, shortBy };
}

/** Base cost lookup for cards (§9). */
export function towerCost(kind: TowerKind): number {
  return TOWERS[kind].cost;
}
