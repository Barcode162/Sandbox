// A small but honest fake of the WO-002 sim core for tower tests: brute-force queryBlots, §6 peel
// (immunity, overflow to child 0, children at s − 6k), slows/freezes/stuns, path movement, and a call log.
import type { HitResult, SimContext } from '../../../src/contracts/sim-context';
import type { Blot, BlotKind, DamageType, SimEvent, SimState, TargetMode, Tower, TowerKind } from '../../../src/contracts/types';
import { BLOTS } from '../../../src/data/blots';
import { TOWERS, resolveStats } from '../../../src/data/towers';
import { createInitialState } from '../../../src/sim';
import { createRng } from '../../../src/sim/rng';
import { pointAt, tangentAt, PATH_TOTAL } from '../../../src/sim/path';
import { updateAuras, updateProjectiles, updateTowers } from '../../../src/sim/towers';

export interface LogEntry { op: 'hit' | 'slow' | 'freeze' | 'stun'; blot: number; kind: BlotKind; a: number; b: string; result?: HitResult; tower?: number }

export interface Fake {
  ctx: SimContext;
  state: SimState;
  log: LogEntry[];
  events: SimEvent[];
  /** Add a blot; if `at` is given it is placed there and stays still, otherwise it walks the path from s. */
  blot(kind: BlotKind, s: number, opts?: { pale?: boolean; at?: { x: number; y: number }; hp?: number }): Blot;
  tower(kind: TowerKind, x: number, y: number, tiers?: [number, number], target?: TargetMode): Tower;
  /** One tower-system tick: move walking blots, auras, towers, projectiles, compact. */
  tick(n?: number): void;
}

export function createFake(opts: { move?: boolean } = {}): Fake {
  const state = createInitialState({ seed: 1 });
  const rng = createRng(9);
  const log: LogEntry[] = [];
  const events: SimEvent[] = [];
  const fixed = new Set<number>();
  let nextBlotId = 1;
  let nextTowerId = 1;
  let source = 1;
  const v = { x: 0, y: 0 };

  const add = (kind: BlotKind, s: number, pale: boolean, parentId: number): Blot => {
    const pool = state.blots;
    const b = pool.items[pool.count++];
    Object.assign(b, { id: nextBlotId++, alive: true, kind, hp: BLOTS[kind].hp, s, ps: s, pale, slow: 0, slowTicks: 0, frozenTicks: 0, stunTicks: 0, immuneTo: 0, spawnTick: state.tick, parentId, nextShed: 0 });
    pointAt(s, v); b.x = v.x; b.y = v.y;
    return b;
  };

  const peel = (b: Blot, overflow: number, src: number): void => {
    const def = BLOTS[b.kind];
    if (def.children.length === 0) { b.alive = false; return; }
    const kids: BlotKind[] = [];
    for (const c of def.children) for (let k = 0; k < c.count; k++) kids.push(c.kind);
    for (let k = 1; k < kids.length; k++) {
      const c = add(kids[k], Math.max(0, b.s - 6 * k), b.pale, b.id);
      c.immuneTo = src; c.slow = b.slow; c.slowTicks = b.slowTicks;
      if (fixed.has(b.id)) { fixed.add(c.id); c.x = b.x; c.y = b.y; }
    }
    b.kind = kids[0]; b.hp = BLOTS[kids[0]].hp; b.immuneTo = src;
    if (overflow > 0) {
      if (overflow >= b.hp) peel(b, overflow - b.hp, src);
      else b.hp -= overflow;
    }
  };

  const ctx: SimContext = {
    state, rng,
    queryBlots(x, y, r, out) {
      let n = 0;
      for (let i = 0; i < state.blots.count && n < out.length; i++) {
        const b = state.blots.items[i];
        if (!b.alive) continue;
        const R = r + BLOTS[b.kind].radius;
        if ((b.x - x) ** 2 + (b.y - y) ** 2 <= R * R) out[n++] = i;
      }
      return n;
    },
    blotAt: (i) => state.blots.items[i],
    hit(b, d, type: DamageType, src, tower, dx, dy) {
      let result: HitResult;
      if (!b.alive) throw new Error('hit on a dead blot');
      const kind = b.kind;
      if (b.immuneTo === src) result = 'none';
      else if (BLOTS[b.kind].immuneTo.includes(type)) {
        result = 'immune';
        events.push({ type: 'immune', blotId: b.id, x: b.x, y: b.y });
      } else if (d < b.hp) {
        b.hp -= d; result = 'damaged'; tower.pops += d;
        events.push({ type: 'hit', blotId: b.id, kind, x: b.x, y: b.y, dirX: dx, dirY: dy });
      } else {
        tower.pops += b.hp;
        events.push({ type: 'pop', blotId: b.id, kind, x: b.x, y: b.y, towerId: tower.id, pale: b.pale });
        peel(b, d - b.hp, src); result = 'popped';
      }
      log.push({ op: 'hit', blot: b.id, kind, a: d, b: type, result, tower: tower.id });
      return result;
    },
    slow(b, pct, ticks) {
      const cap = BLOTS[b.kind].boss ? Math.min(pct, 0.2) : pct;
      if (cap >= b.slow || b.slowTicks <= 0) { b.slow = Math.max(cap, b.slowTicks > 0 ? b.slow : 0); b.slowTicks = ticks; }
      log.push({ op: 'slow', blot: b.id, kind: b.kind, a: pct, b: String(ticks) });
    },
    freeze(b, ticks, fallback) {
      if (b.kind === 'wax' || b.kind === 'knot' || b.kind === 'inkmaw') ctx.slow(b, fallback, ticks);
      else b.frozenTicks = ticks;
      log.push({ op: 'freeze', blot: b.id, kind: b.kind, a: ticks, b: String(fallback) });
    },
    stun(b, ticks) {
      if (b.kind !== 'knot' && b.kind !== 'inkmaw') b.stunTicks = ticks;
      log.push({ op: 'stun', blot: b.id, kind: b.kind, a: ticks, b: '' });
    },
    canSee: (t, b) => !b.pale || t.stats.detect || t.buffDetect,
    emit: (e) => { events.push(e); },
    nextSourceId: () => source++,
    pointAt, tangentAt,
  };

  const fake: Fake = {
    ctx, state, log, events,
    blot(kind, s, o = {}) {
      const b = add(kind, s, o.pale ?? false, 0);
      if (o.hp !== undefined) b.hp = o.hp;
      if (o.at) { b.x = o.at.x; b.y = o.at.y; fixed.add(b.id); }
      return b;
    },
    tower(kind, x, y, tiers = [0, 0], target = 'first') {
      const t: Tower = {
        id: nextTowerId++, kind, x, y, tiers: [tiers[0], tiers[1]], target, angle: 0, pangle: 0, cooldown: 0,
        stats: resolveStats(kind, tiers), buffDetect: false, buffIntervalMul: 1, buffDamageAdd: 0,
        spent: TOWERS[kind].cost, placedRound: 1, fresh: true, pops: 0, shots: 0, lastFireTick: 0, targetId: 0,
      };
      state.towers.push(t);
      return t;
    },
    tick(n = 1) {
      for (let k = 0; k < n; k++) {
        state.tick++;
        if (opts.move !== false) {
          for (let i = 0; i < state.blots.count; i++) {
            const b = state.blots.items[i];
            if (!b.alive) continue;
            b.ps = b.s;
            if (b.slowTicks > 0) b.slowTicks--; else b.slow = 0;
            if (b.frozenTicks > 0) { b.frozenTicks--; continue; }
            if (b.stunTicks > 0) { b.stunTicks--; continue; }
            if (fixed.has(b.id)) continue;
            b.s = Math.min(PATH_TOTAL, b.s + BLOTS[b.kind].speed * (1 - b.slow) / 60);
            pointAt(b.s, v); b.x = v.x; b.y = v.y;
          }
        }
        updateAuras(ctx);
        updateTowers(ctx);
        updateProjectiles(ctx);
        // compact dead blots (stable order)
        let w = 0;
        const items = state.blots.items;
        for (let i = 0; i < state.blots.count; i++) {
          if (items[i].alive) { const tmp = items[w]; items[w] = items[i]; items[i] = tmp; w++; }
        }
        state.blots.count = w;
      }
    },
  };
  return fake;
}
