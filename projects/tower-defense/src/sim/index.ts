// Sim core (WO-002). The factory signature and SimState shape are FROZEN (contracts/types.ts).
// Pure: no DOM, no Math.random, no clocks. Fixed 60 Hz. Tick order (architecture §State & data flow):
// commands → hit-stop gate → spawns → movement/leaks → grid → updateAuras → updateTowers → updateProjectiles → compact → round end.
import type { HitResult, SimContext } from '../contracts/sim-context';
import {
  TICK_S, SIM_HZ,
  type Blot, type BlotKind, type Command, type CommandFail, type DamageType, type RoundDef, type Sim,
  type SimEvent, type SimOptions, type Tower, type TowerKind, type UpgradePath,
} from '../contracts/types';
import { BLOTS, BOSS_SLOW_CAP, CHILD_SPACING } from '../data/blots';
import { ECONOMY, roundBonus } from '../data/economy';
import { HIT_STOP } from '../data/feel';
import { TOWERS, resolveStats } from '../data/towers';
import { BOSS_WARNING_LEAD_S, LATE_KNOB_ROUNDS, ROUNDS } from '../data/waves';
import { BALANCE } from '../data/balance';
import { createProjectile, tierStatus, updateAuras, updateProjectiles, updateTowers } from './towers';
import { sellValue } from './economy';
import { createEventPool, registerEventPool } from './events';
import { createGrid } from './grid';
import { PATH_TOTAL, pointAt, tangentAt, type MutVec } from './path';
import { canPlace } from './placement';
import { BLOT_CAPACITY, PROJECTILE_CAPACITY, type CoreState } from './pool';
import { createRng } from './rng';

export { BLOT_CAPACITY, PROJECTILE_CAPACITY } from './pool';

const KIND_INDEX: Readonly<Record<BlotKind, number>> = { dot: 0, drop: 1, splat: 2, splash: 3, blotch: 4, streak: 5, wax: 6, knot: 7, inkmaw: 8 };
export { KIND_INDEX };

/** Largest blot radius except the boss; queries widen by this (or the boss radius while it lives). */
const MAX_PLAIN_R = Math.max(...Object.values(BLOTS).filter((d) => !d.boss).map((d) => d.radius));
const BOSS_R = BLOTS.inkmaw.radius;
const AUTO_START_TICKS = Math.round(ECONOMY.autoStartDelay * SIM_HZ);
const MAX_GROUPS = 8;

/** Remaining red-blot-equivalent of a live blot (§6 rule 4): current hp + the children's RBE. */
export function remainingRbe(kind: BlotKind, hp: number): number {
  const d = BLOTS[kind];
  let n = hp;
  for (const c of d.children) n += c.count * BLOTS[c.kind].rbe;
  return n;
}

/** Group count after the §8 late-round knob (R16–R19 × lateCountMul, rounded). */
export function groupCount(round: number, count: number): number {
  return (LATE_KNOB_ROUNDS as readonly number[]).includes(round) ? Math.round(count * BALANCE.lateCountMul) : count;
}

/** Tick (from round start) at which spawn `i` of a group appears. */
export function spawnTickOf(delay: number, spacing: number, i: number): number {
  return Math.round((delay + spacing * i) * SIM_HZ);
}

export function createBlot(): Blot {
  return { id: 0, alive: false, kind: 'dot', hp: 0, s: 0, ps: 0, x: 0, y: 0, pale: false, slow: 0, slowTicks: 0, frozenTicks: 0, stunTicks: 0, immuneTo: 0, spawnTick: 0, parentId: 0, nextShed: 0 };
}

export function createInitialState(opts: SimOptions): CoreState {
  return {
    seed: opts.seed,
    tick: 0,
    round: opts.startRound ?? 1,
    phase: 'intermission',
    lives: opts.startLives ?? ECONOMY.startLives,
    money: opts.startMoney ?? ECONOMY.startMoney,
    autoStart: false,
    hitStop: 0,
    roundTick: 0,
    blots: { items: Array.from({ length: BLOT_CAPACITY }, createBlot), count: 0 },
    towers: [],
    projectiles: { items: Array.from({ length: PROJECTILE_CAPACITY }, createProjectile), count: 0 },
    boss: null,
    stats: { pops: 0, leaked: 0, spent: 0, earned: 0 },
    seen: {},
    overflow: { blots: 0, projectiles: 0 },
  };
}

export interface CoreOptions extends SimOptions {
  /** Stress scenario: the round never spawns waves and never clears (bench.ts tops the field up itself). */
  noWaves?: boolean;
}

/** Internal handle: the public Sim plus the pieces bench.ts and tests need. */
export interface Core {
  readonly sim: Sim;
  readonly state: CoreState;
  readonly ctx: SimContext;
  /** Add a blot at path distance s; null (and an overflow count) when the pool is full. */
  spawnBlot(kind: BlotKind, s: number, pale: boolean, parentId: number, sourceId: number): Blot | null;
  /** Add a tower directly (no money, no placement check). */
  addTower(kind: TowerKind, x: number, y: number, tiers: readonly [number, number]): Tower;
  /** Put the sim in the given round's 'round' phase immediately. */
  beginRound(): void;
}

export function createSim(opts: SimOptions): Sim {
  return createCore(opts).sim;
}

export function createCore(opts: CoreOptions): Core {
  const state = createInitialState(opts);
  const rng = createRng(opts.seed);
  const pool = createEventPool();
  registerEventPool(state, pool);
  const queue: Command[] = [];
  const events: SimEvent[] = [];
  const grid = createGrid(64, BLOT_CAPACITY);
  const xs = new Float64Array(BLOT_CAPACITY);
  const ys = new Float64Array(BLOT_CAPACITY);
  const scratch = new Int32Array(BLOT_CAPACITY);
  const groupSpawned = new Int32Array(MAX_GROUPS);
  const pt: MutVec = { x: 0, y: 0 };
  const loopRound = !!opts.loopRound;
  const noWaves = !!opts.noWaves;

  let nextBlotId = 1;
  let nextTowerId = 1;
  let nextSource = 1;
  let gridCount = 0;
  let queryR = MAX_PLAIN_R;
  let popMoney = 0;
  let allSpawned = false;
  let warned = false;
  let clearTick = -1;
  let paleSeen = false;
  let roundDef: RoundDef | null = null;

  const emit = (e: SimEvent): void => { events.push(e); };

  function markSeen(kind: BlotKind, pale: boolean): void {
    if (!state.seen[kind]) { state.seen[kind] = true; emit({ type: 'firstSeen', kind, pale }); }
    else if (pale && !paleSeen) emit({ type: 'firstSeen', kind, pale: true });
    if (pale) paleSeen = true;
  }

  function place(b: Blot, s: number): void {
    b.s = s; b.ps = s;
    pointAt(s, pt); b.x = pt.x; b.y = pt.y;
  }

  function spawnBlot(kind: BlotKind, s: number, pale: boolean, parentId: number, sourceId: number): Blot | null {
    const bp = state.blots;
    if (bp.count >= bp.items.length) { state.overflow.blots++; return null; }
    const b = bp.items[bp.count++];
    b.id = nextBlotId++; b.alive = true; b.kind = kind; b.hp = BLOTS[kind].hp;
    place(b, s < 0 ? 0 : s);
    b.pale = pale && BLOTS[kind].paleEligible;
    b.slow = 0; b.slowTicks = 0; b.frozenTicks = 0; b.stunTicks = 0;
    b.immuneTo = sourceId; b.spawnTick = state.tick; b.parentId = parentId; b.nextShed = 0;
    markSeen(kind, b.pale);
    emit(pool.spawn(b.id, kind, parentId, b.x, b.y));
    return b;
  }

  function requestHitStop(ticks: number): void {
    if (ticks > state.hitStop) { state.hitStop = ticks; emit({ type: 'hitStop', ticks }); }
  }

  function credit(kind: BlotKind, hp: number, tower: Tower): void {
    const sheets = hp * BLOTS[kind].sheetsPerHp;
    state.money += sheets; state.stats.earned += sheets; popMoney += sheets;
    state.stats.pops += hp; tower.pops += hp;
  }

  // ── boss (§6 rule 5, §10.6) ──
  function bossDamaged(b: Blot, sourceId: number): void {
    const def = BLOTS[b.kind];
    const view = state.boss;
    const maxHp = view && view.blotId === b.id ? view.maxHp : def.hp;
    while (b.nextShed < def.shedAt.length && b.hp <= maxHp * def.shedAt[b.nextShed]) {
      const threshold = def.shedAt[b.nextShed++];
      const shed = def.shed;
      if (shed) for (let k = 1; k <= shed.count; k++) {
        const c = spawnBlot(shed.kind, b.s - CHILD_SPACING * k, false, b.id, sourceId);
        if (c) inheritSlow(c, b);
      }
      emit({ type: 'bossShed', blotId: b.id, threshold, x: b.x, y: b.y });
      requestHitStop(HIT_STOP.bossShed);
    }
    if (view && view.blotId === b.id) { view.hp = b.hp; view.nextShed = b.nextShed; }
  }

  function inheritSlow(c: Blot, parent: Blot): void {
    c.slow = parent.slow; c.slowTicks = parent.slowTicks;
  }

  /** One layer pops (§6 rules 1–2): the blot becomes child 0 in place, children 1..k go to s − 6k. */
  function popLayer(b: Blot, tower: Tower, sourceId: number): void {
    const def = BLOTS[b.kind];
    emit(pool.pop(b.id, b.kind, b.x, b.y, tower.id, b.pale));
    if (b.kind === 'knot') requestHitStop(HIT_STOP.knotPop);
    if (def.boss) {
      emit({ type: 'bossDeath', x: b.x, y: b.y });
      requestHitStop(HIT_STOP.bossDeath);
      state.boss = null;
    }
    const specs = def.children;
    if (specs.length === 0) { b.alive = false; return; }
    const parentId = b.id;
    const s = b.s;
    // child 0: the same object and pool index (no gap frame, §16.4)
    const k0 = specs[0].kind;
    b.id = nextBlotId++; b.kind = k0; b.hp = BLOTS[k0].hp; b.parentId = parentId; b.spawnTick = state.tick;
    b.immuneTo = sourceId; b.frozenTicks = 0; b.stunTicks = 0; b.nextShed = 0;
    if (!BLOTS[k0].paleEligible) b.pale = false;
    markSeen(k0, b.pale);
    emit(pool.spawn(b.id, k0, parentId, b.x, b.y));
    let k = 0;
    for (let g = 0; g < specs.length; g++) {
      for (let i = g === 0 ? 1 : 0; i < specs[g].count; i++) {
        k++;
        const c = spawnBlot(specs[g].kind, s - CHILD_SPACING * k, b.pale, parentId, sourceId);
        if (c) inheritSlow(c, b);
      }
    }
  }

  function hit(b: Blot, damage: number, type: DamageType, sourceId: number, tower: Tower, dirX: number, dirY: number): HitResult {
    if (!b.alive || !(damage > 0)) return 'none';
    if (sourceId !== 0 && b.immuneTo === sourceId) return 'none';
    const def = BLOTS[b.kind];
    if (def.immuneTo.includes(type)) { emit(pool.immune(b.id, b.x, b.y)); return 'immune'; }
    if (damage < b.hp) {
      b.hp -= damage;
      credit(b.kind, damage, tower);
      emit(pool.hit(b.id, b.kind, b.x, b.y, dirX, dirY));
      if (def.boss) bossDamaged(b, sourceId);
      return 'damaged';
    }
    // pop, with overflow to child 0 only, recursively; leftover overflow is lost (§6 rule 1)
    let o = damage;
    for (;;) {
      const hp = b.hp;
      o -= hp;
      credit(b.kind, hp, tower);
      popLayer(b, tower, sourceId);
      if (!b.alive || o <= 0) break;
      const cd = BLOTS[b.kind];
      if (cd.immuneTo.includes(type)) break;
      if (o < b.hp) {
        b.hp -= o;
        credit(b.kind, o, tower);
        emit(pool.hit(b.id, b.kind, b.x, b.y, dirX, dirY));
        break;
      }
    }
    return 'popped';
  }

  function slow(b: Blot, pct: number, ticks: number): void {
    const p = BLOTS[b.kind].boss && pct > BOSS_SLOW_CAP ? BOSS_SLOW_CAP : pct;
    if (p > b.slow) { b.slow = p; b.slowTicks = ticks; }
    else if (p === b.slow && ticks > b.slowTicks) b.slowTicks = ticks;
  }
  function freeze(b: Blot, ticks: number, fallbackSlowPct: number): void {
    if (b.kind === 'wax' || b.kind === 'knot' || b.kind === 'inkmaw') { slow(b, fallbackSlowPct, ticks); return; }
    if (ticks > b.frozenTicks) b.frozenTicks = ticks;
  }
  function stun(b: Blot, ticks: number): void {
    if (b.kind === 'knot' || b.kind === 'inkmaw') return;
    if (ticks > b.stunTicks) b.stunTicks = ticks;
  }

  function queryBlots(x: number, y: number, r: number, out: Int32Array): number {
    const n = grid.candidates(x, y, r + queryR, scratch);
    const items = state.blots.items;
    const cap = out.length;
    let k = 0;
    for (let j = 0; j < n && k < cap; j++) {
      const i = scratch[j];
      if (i >= gridCount) continue;
      const b = items[i];
      if (!b.alive) continue;
      const dx = b.x - x, dy = b.y - y, rr = r + BLOTS[b.kind].radius;
      if (dx * dx + dy * dy <= rr * rr) out[k++] = i;
    }
    return k;
  }

  const ctx: SimContext = {
    state,
    rng,
    queryBlots,
    blotAt: (i) => state.blots.items[i],
    hit,
    slow,
    freeze,
    stun,
    canSee: (t, b) => !b.pale || t.stats.detect || t.buffDetect,
    emit,
    nextSourceId: () => nextSource++,
    pointAt,
    tangentAt,
  };

  // ── commands (§8, §10.4) ──
  const reject = (command: Command['type'], reason: CommandFail): void => { emit({ type: 'rejected', command, reason }); };
  const towerById = (id: number): Tower | undefined => state.towers.find((t) => t.id === id);
  const over = (): boolean => state.phase === 'victory' || state.phase === 'defeat';

  function addTower(kind: TowerKind, x: number, y: number, tiers: readonly [number, number]): Tower {
    const def = TOWERS[kind];
    let spent = def.cost;
    for (const p of [0, 1] as const) for (let t = 0; t < tiers[p]; t++) spent += def.paths[p][t].cost;
    const t: Tower = {
      id: nextTowerId++, kind, x, y, tiers: [tiers[0], tiers[1]], target: 'first', angle: -Math.PI / 2, pangle: -Math.PI / 2,
      cooldown: 0, stats: resolveStats(kind, tiers), buffDetect: false, buffIntervalMul: 1, buffDamageAdd: 0,
      spent, placedRound: state.round, fresh: state.phase === 'intermission', pops: 0, shots: 0, lastFireTick: 0, targetId: 0,
    };
    state.towers.push(t);
    return t;
  }

  function apply(cmd: Command): void {
    switch (cmd.type) {
      case 'place': {
        const cost = TOWERS[cmd.kind].cost;
        const fail = canPlace(state, cmd.kind, cmd.x, cmd.y, cost);
        if (fail) return reject('place', fail);
        const t = addTower(cmd.kind, cmd.x, cmd.y, [0, 0]);
        state.money -= cost; state.stats.spent += cost;
        emit({ type: 'place', towerId: t.id, kind: t.kind, x: t.x, y: t.y, cost });
        emit(pool.money(-cost, 'spend'));
        return;
      }
      case 'upgrade': {
        if (over()) return reject('upgrade', 'phase');
        const t = towerById(cmd.towerId);
        if (!t) return reject('upgrade', 'noTower');
        const cur = t.tiers[cmd.path];
        if (cur >= 3) return reject('upgrade', 'maxTier');
        const view = tierStatus(state, t, cmd.path, (cur + 1) as 1 | 2 | 3);
        if (view.status === 'sealed') return reject('upgrade', 'sealed');
        if (!view.affordable) return reject('upgrade', 'money');
        t.tiers[cmd.path] = cur + 1;
        t.stats = resolveStats(t.kind, t.tiers);
        t.spent += view.cost;
        state.money -= view.cost; state.stats.spent += view.cost;
        emit({ type: 'upgrade', towerId: t.id, path: cmd.path, tier: cur + 1, cost: view.cost });
        emit(pool.money(-view.cost, 'spend'));
        return;
      }
      case 'sell': {
        if (over()) return reject('sell', 'phase');
        const i = state.towers.findIndex((t) => t.id === cmd.towerId);
        if (i < 0) return reject('sell', 'noTower');
        const t = state.towers[i];
        const refund = sellValue(state, t);
        state.towers.splice(i, 1);
        state.money += refund;
        emit({ type: 'sell', towerId: t.id, kind: t.kind, x: t.x, y: t.y, refund });
        emit(pool.money(refund, 'refund'));
        return;
      }
      case 'target': {
        const t = towerById(cmd.towerId);
        if (!t) return reject('target', 'noTower');
        t.target = cmd.mode;
        emit({ type: 'target', towerId: t.id, mode: cmd.mode });
        return;
      }
      case 'startRound':
        if (state.phase !== 'intermission') return reject('startRound', over() ? 'phase' : 'busy');
        beginRound();
        return;
      case 'autoStart':
        state.autoStart = cmd.on;
        return;
    }
  }

  function beginRound(): void {
    state.phase = 'round';
    state.roundTick = 0;
    roundDef = noWaves ? null : ROUNDS[state.round - 1] ?? null;
    groupSpawned.fill(0);
    allSpawned = roundDef === null;
    warned = false;
    for (const t of state.towers) t.fresh = false;
    emit({ type: 'roundStart', round: state.round });
  }

  // ── spawning (§8) ──
  function spawnWaves(): void {
    const def = roundDef;
    if (!def || allSpawned) return;
    let done = true;
    const rt = state.roundTick;
    for (let g = 0; g < def.groups.length; g++) {
      const grp = def.groups[g];
      const count = groupCount(def.round, grp.count);
      const boss = BLOTS[grp.kind].boss;
      if (boss && !warned && rt >= spawnTickOf(grp.delay - BOSS_WARNING_LEAD_S, 0, 0)) {
        warned = true;
        emit({ type: 'bossWarning' });
        if (!state.seen[grp.kind]) { state.seen[grp.kind] = true; emit({ type: 'firstSeen', kind: grp.kind, pale: false }); }
      }
      while (groupSpawned[g] < count && rt >= spawnTickOf(grp.delay, grp.spacing, groupSpawned[g])) {
        groupSpawned[g]++;
        const b = spawnBlot(grp.kind, 0, grp.pale, 0, 0);
        if (b && boss) {
          state.boss = { blotId: b.id, hp: b.hp, maxHp: b.hp, nextShed: 0 };
          emit({ type: 'bossArrive', blotId: b.id, maxHp: b.hp });
        }
      }
      if (groupSpawned[g] < count) done = false;
    }
    allSpawned = done;
  }

  // ── movement, slows, leaks (§6 rule 4) ──
  function move(): void {
    const bp = state.blots;
    const items = bp.items;
    let maxR = MAX_PLAIN_R;
    for (let i = 0; i < bp.count; i++) {
      const b = items[i];
      if (!b.alive) continue;
      b.ps = b.s;
      const def = BLOTS[b.kind];
      const held = b.frozenTicks > 0 || b.stunTicks > 0;
      if (b.frozenTicks > 0) b.frozenTicks--;
      if (b.stunTicks > 0) b.stunTicks--;
      if (!held) b.s += def.speed * TICK_S * (1 - b.slow);
      if (b.slowTicks > 0 && --b.slowTicks === 0) b.slow = 0;
      if (b.s >= PATH_TOTAL) { leak(b); continue; }
      pointAt(b.s, pt); b.x = pt.x; b.y = pt.y;
      xs[i] = b.x; ys[i] = b.y;
      if (def.boss) maxR = BOSS_R;
    }
    queryR = maxR;
  }

  function leak(b: Blot): void {
    b.alive = false;
    b.s = PATH_TOTAL;
    const def = BLOTS[b.kind];
    let lost = def.boss ? Math.max(state.lives, 1) : remainingRbe(b.kind, b.hp);
    if (def.boss) state.boss = null;
    if (loopRound) lost = 0;
    state.lives = Math.max(0, state.lives - lost);
    state.stats.leaked += lost;
    emit(pool.leak(b.id, b.kind, lost));
  }

  /** Remove dead blots, keeping the live ones in order (objects are reused, never freed). */
  function compact(): void {
    const bp = state.blots;
    const items = bp.items;
    let w = 0;
    for (let i = 0; i < bp.count; i++) {
      const b = items[i];
      if (!b.alive) continue;
      if (w !== i) { items[i] = items[w]; items[w] = b; }
      w++;
    }
    bp.count = w;
  }

  function roundEnd(): void {
    if (state.lives <= 0 && !loopRound) {
      state.phase = 'defeat';
      emit({ type: 'defeat', round: state.round, pops: state.stats.pops });
      return;
    }
    if (state.phase !== 'round' || noWaves || !allSpawned || state.blots.count > 0) return;
    const r = state.round;
    const bonus = loopRound ? 0 : roundBonus(r);
    state.money += bonus; state.stats.earned += bonus;
    emit({ type: 'roundClear', round: r, bonus });
    if (bonus) emit(pool.money(bonus, 'bonus'));
    state.boss = null;
    state.phase = 'intermission';
    clearTick = state.tick;
    if (loopRound) return;
    if (r >= ECONOMY.rounds) {
      state.phase = 'victory';
      let best = 0, bestPops = -1;
      for (const t of state.towers) if (t.pops > bestPops) { best = t.id; bestPops = t.pops; }
      emit({ type: 'victory', lives: state.lives, pops: state.stats.pops, bestTowerId: best });
      return;
    }
    state.round = r + 1;
  }

  const sim: Sim = {
    state,
    events,
    enqueue(cmd) { queue.push(cmd); },
    step() {
      events.length = 0;
      pool.reset();
      popMoney = 0;
      state.tick++;
      for (let i = 0; i < queue.length; i++) apply(queue[i]);
      queue.length = 0;
      if (over()) return;
      if (state.phase === 'intermission' && (state.autoStart || loopRound) && clearTick >= 0 && state.tick >= clearTick + AUTO_START_TICKS) beginRound();
      if (state.hitStop > 0) { state.hitStop--; return; }
      if (state.phase === 'round') { spawnWaves(); state.roundTick++; }
      move();
      gridCount = state.blots.count;
      grid.rebuild(gridCount, xs, ys);
      updateAuras(ctx);
      updateTowers(ctx);
      updateProjectiles(ctx);
      compact();
      if (popMoney) emit(pool.money(popMoney, 'pop'));
      roundEnd();
    },
  };

  return { sim, state, ctx, spawnBlot, addTower, beginRound };
}

/** Per-tower helper for the UI and the script driver: the cost of the next tier on a path, or null. */
export function nextTierCost(t: Readonly<Tower>, path: UpgradePath): number | null {
  const cur = t.tiers[path];
  return cur >= 3 ? null : TOWERS[t.kind].paths[path][cur].cost;
}
