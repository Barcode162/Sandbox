// WO-002: §6 peel rules, leaks, boss, hit-stop, slows, pools and commands, through the real core and SimContext.
import { describe, expect, it } from 'vitest';
import type { Blot, BlotKind, SimEvent } from '../../../src/contracts/types';
import { createCore, BLOT_CAPACITY, remainingRbe } from '../../../src/sim';
import { stateHash } from '../../../src/sim/hash';
import { overflowOf, acquireProjectile, PROJECTILE_CAPACITY } from '../../../src/sim/pool';
import { pooledEvents } from '../../../src/sim/events';
import { BALANCE } from '../../../src/data/balance';

function setup(kind: BlotKind = 'dot', s = 500, pale = false) {
  const core = createCore({ seed: 1, noWaves: true });
  core.beginRound();
  const tower = core.addTower('tern', 340, 510, [0, 0]);
  const blot = core.spawnBlot(kind, s, pale, 0, 0)!;
  return { core, tower, blot, state: core.state, ctx: core.ctx };
}
const live = (st: { blots: { items: Blot[]; count: number } }) => st.blots.items.slice(0, st.blots.count).filter((b) => b.alive);
const ofType = (evs: readonly SimEvent[], t: SimEvent['type']) => evs.filter((e) => e.type === t);

describe('§6 rule 1: overflow to child 0 only', () => {
  it('a lance hit of 6 on a Splat strips 3 layers and the rest is lost', () => {
    const { tower, blot, state, ctx } = setup('splat');
    const before = state.money;
    expect(ctx.hit(blot, 6, 'cut', 99, tower, 1, 0)).toBe('popped');
    expect(live(state)).toHaveLength(0);
    expect(state.stats.pops).toBe(3);
    expect(state.money - before).toBe(3);
    expect(tower.pops).toBe(3);
  });
  it('the pop events name every stripped layer, in order', () => {
    const { blot, tower, core } = setup('splat');
    core.ctx.hit(blot, 6, 'cut', 99, tower, 1, 0);
    expect(ofType(core.sim.events, 'pop').map((e) => (e as { kind: BlotKind }).kind)).toEqual(['splat', 'drop', 'dot']);
  });
  it('d < hp only damages; d = hp pops with zero overflow (child 0 at full hp)', () => {
    const k = setup('knot');
    expect(k.ctx.hit(k.blot, 5, 'crush', 1, k.tower, 0, 1)).toBe('damaged');
    expect(k.blot.hp).toBe(7);
    expect(k.ctx.hit(k.blot, 7, 'crush', 2, k.tower, 0, 1)).toBe('popped');
    expect(live(k.state).map((b) => [b.kind, b.hp])).toEqual([['wax', 1], ['wax', 1]]);
  });
  it('overflow into an immune child 0 is lost (Knot → Wax under Cut)', () => {
    const k = setup('knot');
    k.ctx.hit(k.blot, 20, 'cut', 3, k.tower, 0, 1);
    expect(live(k.state).map((b) => b.kind)).toEqual(['wax', 'wax']);
    expect(k.state.stats.pops).toBe(12);
  });
  it('overflow that does not pop child 0 damages it (Inkmaw → Knot)', () => {
    const k = setup('inkmaw');
    k.ctx.hit(k.blot, BALANCE.inkmawHp + 5, 'glare', 4, k.tower, 0, 1);
    const kids = live(k.state);
    expect(kids.map((b) => b.kind)).toEqual(['knot', 'knot', 'knot', 'knot']);
    expect(kids[0].hp).toBe(7);
    expect(kids.slice(1).every((b) => b.hp === 12)).toBe(true);
  });
});

describe('§6 rule 2: children', () => {
  it('child 0 keeps the pool index and s; child k sits at s − 6k', () => {
    const { blot, state, tower, ctx } = setup('wax', 500);
    const idx = state.blots.items.indexOf(blot);
    ctx.hit(blot, 1, 'crush', 7, tower, 0, 1);
    expect(state.blots.items[idx]).toBe(blot);
    expect(live(state).map((b) => [b.kind, b.s])).toEqual([['splash', 500], ['splash', 494]]);
  });
  it('Inkmaw children at s, s−6, s−12, s−18; clamped at 0', () => {
    const k = setup('inkmaw', 10);
    k.ctx.hit(k.blot, BALANCE.inkmawHp, 'glare', 4, k.tower, 0, 1);
    expect(live(k.state).map((b) => b.s)).toEqual([10, 4, 0, 0]);
  });
  it('Knot pops into 2 Wax', () => {
    const k = setup('knot', 300);
    k.ctx.hit(k.blot, 12, 'crush', 1, k.tower, 0, 1);
    expect(live(k.state).map((b) => [b.kind, b.s])).toEqual([['wax', 300], ['wax', 294]]);
  });
  it('children are immune to the popping source only (immuneTo = source id)', () => {
    const { blot, state, tower, ctx } = setup('drop');
    ctx.hit(blot, 1, 'cut', 42, tower, 0, 1);
    const child = live(state)[0];
    expect(child.immuneTo).toBe(42);
    expect(child.parentId).not.toBe(0);
    expect(ctx.hit(child, 1, 'cut', 42, tower, 0, 1)).toBe('none');
    expect(child.alive).toBe(true);
    expect(ctx.hit(child, 1, 'cut', 43, tower, 0, 1)).toBe('popped');
  });
  it('children inherit Pale and the slow state (remaining time)', () => {
    const { blot, state, tower, ctx } = setup('splash', 400, true);
    ctx.slow(blot, 0.4, 50);
    ctx.hit(blot, 1, 'wash', 5, tower, 0, 1);
    ctx.hit(state.blots.items[state.blots.count - 1], 1, 'wash', 6, tower, 0, 1);
    for (const b of live(state)) expect([b.pale, b.slow, b.slowTicks]).toEqual([true, 0.4, 50]);
  });
  it('a spawn event names the parent for every child', () => {
    const { blot, tower, ctx, core } = setup('wax');
    const pid = blot.id;
    ctx.hit(blot, 1, 'crush', 9, tower, 0, 1);
    const sp = ofType(core.sim.events, 'spawn') as Extract<SimEvent, { type: 'spawn' }>[];
    expect(sp.slice(-2).map((e) => e.parentId)).toEqual([pid, pid]);
  });
});

describe('§6 rule 3 and Pale vision', () => {
  it('Wax is immune to Cut and Wash: no damage, an immune event, never a pop', () => {
    const { blot, tower, ctx, core } = setup('wax');
    expect(ctx.hit(blot, 5, 'cut', 1, tower, 0, 1)).toBe('immune');
    expect(ctx.hit(blot, 5, 'wash', 2, tower, 0, 1)).toBe('immune');
    expect(blot.alive && blot.kind === 'wax').toBe(true);
    expect(ofType(core.sim.events, 'immune')).toHaveLength(2);
    expect(ofType(core.sim.events, 'pop')).toHaveLength(0);
    expect(ctx.hit(blot, 1, 'crush', 3, tower, 0, 1)).toBe('popped');
  });
  it('canSee: Pale needs detection or an aura buff', () => {
    const { blot, tower, ctx } = setup('drop', 300, true);
    expect(ctx.canSee(tower, blot)).toBe(false);
    tower.buffDetect = true;
    expect(ctx.canSee(tower, blot)).toBe(true);
  });
});

describe('§6 rule 4: leaks cost remaining RBE', () => {
  const leakOf = (kind: BlotKind, hp?: number) => {
    const { blot, state, core } = setup(kind, 2570);
    if (hp) blot.hp = hp;
    const lives = state.lives;
    core.sim.step();
    return lives - state.lives;
  };
  it('Dot 1, Splat 3, Wax 9, Knot 30', () => {
    expect([leakOf('dot'), leakOf('splat'), leakOf('wax'), leakOf('knot')]).toEqual([1, 3, 9, 30]);
  });
  it('a damaged Knot (hp 5) costs 5 + 2·9', () => {
    expect(leakOf('knot', 5)).toBe(23);
    expect(remainingRbe('knot', 5)).toBe(23);
  });
  it('an Inkmaw leak ends the run', () => {
    const { state, core } = setup('inkmaw', 2569.9);
    for (let i = 0; i < 3 && state.phase !== 'defeat'; i++) core.sim.step();
    expect(state.lives).toBe(0);
    expect(state.phase).toBe('defeat');
  });
});

describe('§6 rule 5, §10.6 boss', () => {
  it('sheds 6 Splash at exactly 75 / 50 / 25 %, with 4 hit-stop ticks each', () => {
    const { blot, state, tower, ctx, core } = setup('inkmaw', 1000);
    const max = blot.hp;
    state.boss = { blotId: blot.id, hp: max, maxHp: max, nextShed: 0 };
    ctx.hit(blot, max * 0.25 - 1, 'glare', 1, tower, 0, 1);
    expect(blot.nextShed).toBe(0);
    ctx.hit(blot, 1, 'glare', 2, tower, 0, 1);
    expect(blot.hp).toBe(max * 0.75);
    expect(blot.nextShed).toBe(1);
    expect(state.hitStop).toBe(4);
    const shed = ofType(core.sim.events, 'bossShed') as Extract<SimEvent, { type: 'bossShed' }>[];
    expect(shed.map((e) => e.threshold)).toEqual([0.75]);
    expect(live(state).filter((b) => b.kind === 'splash').map((b) => b.s)).toEqual([994, 988, 982, 976, 970, 964]);
    ctx.hit(blot, max * 0.25 - 1, 'glare', 3, tower, 0, 1);
    expect(blot.nextShed).toBe(1);
    ctx.hit(blot, 1, 'glare', 4, tower, 0, 1);
    ctx.hit(blot, max * 0.25, 'glare', 5, tower, 0, 1);
    expect(blot.nextShed).toBe(3);
    expect(state.boss!.hp).toBe(max * 0.25);
    expect(live(state).filter((b) => b.kind === 'splash')).toHaveLength(18);
  });
  it('Inkmaw sheets pay 0; death gives 12 hit-stop ticks, clears the boss view and splits into 4 Knots', () => {
    const { blot, state, tower, ctx, core } = setup('inkmaw');
    state.boss = { blotId: blot.id, hp: blot.hp, maxHp: blot.hp, nextShed: 3 };
    blot.nextShed = 3;
    const m = state.money;
    ctx.hit(blot, blot.hp, 'glare', 1, tower, 0, 1);
    expect(state.money).toBe(m);
    expect(state.hitStop).toBe(12);
    expect(state.boss).toBeNull();
    expect(ofType(core.sim.events, 'bossDeath')).toHaveLength(1);
    expect(live(state).filter((b) => b.kind === 'knot')).toHaveLength(4);
  });
  it('slows on the boss cap at 20 %; it ignores stun and turns freeze into slow', () => {
    const { blot, ctx } = setup('inkmaw');
    ctx.slow(blot, 0.6, 60);
    expect(blot.slow).toBe(0.2);
    ctx.stun(blot, 30);
    ctx.freeze(blot, 30, 0.6);
    expect([blot.stunTicks, blot.frozenTicks]).toEqual([0, 0]);
  });
  it('Wax and Knot are slowed instead of frozen; Knot ignores stun', () => {
    const w = setup('wax');
    w.ctx.freeze(w.blot, 30, 0.6);
    expect([w.blot.frozenTicks, w.blot.slow]).toEqual([0, 0.6]);
    const k = setup('knot');
    k.ctx.stun(k.blot, 30);
    expect(k.blot.stunTicks).toBe(0);
  });
  it('strongest slow wins and refreshes', () => {
    const { blot, ctx } = setup('dot');
    ctx.slow(blot, 0.4, 60);
    ctx.slow(blot, 0.2, 200);
    expect([blot.slow, blot.slowTicks]).toEqual([0.4, 60]);
    ctx.slow(blot, 0.4, 90);
    expect(blot.slowTicks).toBe(90);
  });
});

describe('§11 hit-stop', () => {
  it('a Knot pop freezes the world for 2 ticks; commands still apply (interpretation e)', () => {
    const { blot, state, tower, ctx, core } = setup('knot', 400);
    ctx.hit(blot, 12, 'crush', 1, tower, 0, 1);
    expect(state.hitStop).toBe(2);
    const s0 = live(state).map((b) => b.s);
    core.sim.enqueue({ type: 'target', towerId: tower.id, mode: 'strong' });
    core.sim.step();
    expect(tower.target).toBe('strong');
    core.sim.step();
    expect(live(state).map((b) => b.s)).toEqual(s0);
    core.sim.step();
    expect(live(state)[0].s).toBeGreaterThan(s0[0]);
  });
  it('freeze and stun hold a blot; slow scales its speed', () => {
    const a = setup('dot', 100);
    a.ctx.freeze(a.blot, 2, 0);
    a.core.sim.step(); a.core.sim.step();
    expect(a.blot.s).toBe(100);
    a.core.sim.step();
    expect(a.blot.s).toBeCloseTo(100 + 80 / 60, 9);
    const b = setup('dot', 100);
    b.ctx.slow(b.blot, 0.5, 10);
    b.core.sim.step();
    expect(b.blot.s).toBeCloseTo(100 + 40 / 60, 9);
  });
});

describe('board condition 4: full pools drop deterministically', () => {
  it('a full 2048 blot pool drops spawns and children without throwing, and the drop count changes the hash', () => {
    const { core, state, tower, ctx } = setup('wax', 600);
    for (let i = 1; i < BLOT_CAPACITY; i++) core.spawnBlot('dot', (i * 1.1) % 2000, false, 0, 0);
    expect(state.blots.count).toBe(BLOT_CAPACITY);
    const h0 = stateHash(state);
    expect(core.spawnBlot('dot', 10, false, 0, 0)).toBeNull();
    expect(overflowOf(state).blots).toBe(1);
    expect(stateHash(state)).not.toBe(h0);
    const wax = state.blots.items[0];
    expect(() => ctx.hit(wax, 1, 'crush', 1, tower, 0, 1)).not.toThrow();
    expect(wax.kind).toBe('splash'); // child 0 is in place, so it is never dropped
    expect(overflowOf(state).blots).toBe(2); // child 1 had no slot
    expect(() => { for (let i = 0; i < 5; i++) core.sim.step(); }).not.toThrow();
  });
  it('the drop is identical across runs', () => {
    const run = () => {
      const { core, state } = setup('dot', 0);
      for (let i = 0; i < BLOT_CAPACITY + 10; i++) core.spawnBlot('splat', (i * 1.3) % 2400, false, 0, 0);
      for (let i = 0; i < 30; i++) core.sim.step();
      return [overflowOf(state).blots, stateHash(state)];
    };
    expect(run()).toEqual(run());
  });
  it('a full projectile pool returns null and counts', () => {
    const { state } = setup();
    for (let i = 0; i < PROJECTILE_CAPACITY; i++) expect(acquireProjectile(state)).not.toBeNull();
    expect(acquireProjectile(state)).toBeNull();
    expect(overflowOf(state).projectiles).toBe(1);
  });
});

describe('board condition 3: pooled events', () => {
  it('hot events reuse the same objects across steps', () => {
    const { core, ctx, tower } = setup('dot', 100);
    const popOnce = () => {
      core.sim.step();
      ctx.hit(core.spawnBlot('dot', 200, false, 0, 0)!, 1, 'cut', 1, tower, 0, 1);
      return core.sim.events.find((e) => e.type === 'pop');
    };
    const a = popOnce();
    const b = popOnce();
    expect(a).toBeDefined();
    expect(a).toBe(b);
    expect(pooledEvents(core.state).fire(1, 'tern', 'quill', 0, 0, 0).type).toBe('fire');
  });
});

describe('§8 commands', () => {
  const fresh = () => {
    const core = createCore({ seed: 1 });
    const run = (...cmds: Parameters<typeof core.sim.enqueue>[0][]) => { cmds.forEach((c) => core.sim.enqueue(c)); core.sim.step(); return core.sim.events; };
    return { core, run, state: core.state };
  };
  it('place spends, assigns 1-based ids, rejects path / money / tower overlap', () => {
    const { run, state } = fresh();
    run({ type: 'place', kind: 'tern', x: 340, y: 510 }, { type: 'place', kind: 'tern', x: 460, y: 300 }, { type: 'place', kind: 'tern', x: 345, y: 515 });
    expect(state.towers.map((t) => t.id)).toEqual([1]);
    expect(state.money).toBe(450);
    const ev = run({ type: 'place', kind: 'frog', x: 760, y: 300 });
    expect(ev.find((e) => e.type === 'rejected')).toMatchObject({ reason: 'money' });
  });
  it('fresh fold: 100 % refund in the placing intermission, 70 % after the round starts (rounded down)', () => {
    const { run, state } = fresh();
    run({ type: 'place', kind: 'tern', x: 340, y: 510 }, { type: 'upgrade', towerId: 1, path: 1 });
    expect(state.towers[0].fresh).toBe(true);
    run({ type: 'place', kind: 'tern', x: 560, y: 300 }, { type: 'sell', towerId: 2 });
    expect(state.money).toBe(650 - 320);
    run({ type: 'startRound' });
    expect(state.towers[0].fresh).toBe(false);
    run({ type: 'sell', towerId: 1 });
    expect(state.money).toBe(650 - 320 + Math.floor(320 * 0.7));
    run({ type: 'place', kind: 'tern', x: 560, y: 300 });
    expect(state.towers.at(-1)).toMatchObject({ id: 3, fresh: false });
  });
  it('upgrade follows tierStatus: sealed crosspath, max tier, no tower', () => {
    const core = createCore({ seed: 1, startMoney: 1e6 });
    const run = (c: Parameters<typeof core.sim.enqueue>[0]) => { core.sim.enqueue(c); core.sim.step(); return core.sim.events.find((e) => e.type === 'rejected'); };
    run({ type: 'place', kind: 'owl', x: 860, y: 360 });
    for (let i = 0; i < 3; i++) expect(run({ type: 'upgrade', towerId: 1, path: 0 })).toBeUndefined();
    expect(run({ type: 'upgrade', towerId: 1, path: 0 })).toMatchObject({ reason: 'maxTier' });
    expect(run({ type: 'upgrade', towerId: 1, path: 1 })).toBeUndefined();
    expect(run({ type: 'upgrade', towerId: 1, path: 1 })).toMatchObject({ reason: 'sealed' });
    expect(run({ type: 'upgrade', towerId: 9, path: 1 })).toMatchObject({ reason: 'noTower' });
    expect(core.state.towers[0].stats.damage).toBe(18);
    expect(core.state.towers[0].spent).toBe(350 + 250 + 500 + 1500 + 200);
  });
  it('startRound mid-round is busy', () => {
    const { run } = fresh();
    run({ type: 'startRound' });
    expect(run({ type: 'startRound' }).find((e) => e.type === 'rejected')).toMatchObject({ reason: 'busy' });
  });
});

describe('§8 rounds', () => {
  it('R1 spawns 20 Dots 0.8 s apart at s = 0; the clear pays 100 + 10·r; auto-start fires 1.5 s later', () => {
    const core = createCore({ seed: 1 });
    const { state, sim } = core;
    sim.enqueue({ type: 'autoStart', on: true });
    sim.enqueue({ type: 'startRound' });
    const spawnTicks: number[] = [];
    let clearTick = 0, startTick = 0;
    for (let i = 0; i < 4000 && !startTick; i++) {
      sim.step();
      for (const e of sim.events) {
        if (e.type === 'spawn' && !clearTick) spawnTicks.push(state.roundTick - 1);
        if (e.type === 'roundClear') { clearTick = state.tick; expect(e.bonus).toBe(110); }
        if (e.type === 'roundStart' && e.round === 2) startTick = state.tick;
      }
      // remove each Dot as soon as it spawns so R1 clears
      for (let j = 0; j < state.blots.count; j++) state.blots.items[j].alive = state.blots.items[j].s < 1;
    }
    expect(spawnTicks).toHaveLength(20);
    expect(spawnTicks[1] - spawnTicks[0]).toBe(48);
    expect(state.money).toBe(650 + 110);
    expect(startTick - clearTick).toBe(90);
  });
  it('first-seen fires once per kind, plus once for the first Pale', () => {
    const core = createCore({ seed: 1, noWaves: true });
    core.spawnBlot('drop', 0, false, 0, 0); core.spawnBlot('drop', 0, false, 0, 0); core.spawnBlot('drop', 0, true, 0, 0); core.spawnBlot('splat', 0, true, 0, 0);
    expect(core.sim.events.filter((e) => e.type === 'firstSeen')).toEqual([
      { type: 'firstSeen', kind: 'drop', pale: false }, { type: 'firstSeen', kind: 'drop', pale: true }, { type: 'firstSeen', kind: 'splat', pale: true },
    ]);
  });
});

