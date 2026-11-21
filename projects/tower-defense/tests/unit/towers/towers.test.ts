// WO-003 unit tests: targeting, immunity, Pale, auras, crosspath, every attack, all 24 tiers, pool overflow.
import { describe, expect, it } from 'vitest';
import type { BlotKind, SimEvent, TowerKind, UpgradePath } from '../../../src/contracts/types';
import { TOWERS, TOWER_ORDER, resolveStats } from '../../../src/data/towers';
import { BLOTS } from '../../../src/data/blots';
import { pointAt, tangentAt } from '../../../src/sim/path';
import { PROJECTILE_CAPACITY } from '../../../src/sim';
import { projectileDrops, remainingRbe, selectTarget, tierStatus } from '../../../src/sim/towers';
import { createFake, type Fake } from './fake-ctx';

const still = () => createFake({ move: false });
const at = (x: number, y: number) => ({ at: { x, y } });
const ofType = <T extends SimEvent['type']>(f: Fake, type: T) => f.events.filter((e): e is Extract<SimEvent, { type: T }> => e.type === type);
const hits = (f: Fake) => f.log.filter((l) => l.op === 'hit');

describe('§7 targeting modes and tie-breaks', () => {
  const setup = () => {
    const f = still();
    const t = f.tower('tern', 300, 300);
    const a = f.blot('dot', 500, at(330, 300)); // nearest
    const b = f.blot('splat', 400, at(380, 300)); // strongest (RBE 3)
    const c = f.blot('drop', 900, at(300, 380)); // furthest along
    const d = f.blot('dot', 100, at(240, 300)); // least along
    return { f, t, a, b, c, d };
  };
  it('First = greatest path distance, Last = least', () => {
    const { f, t, c, d } = setup();
    expect(selectTarget(f.ctx, t, 150, 'first')?.id).toBe(c.id);
    expect(selectTarget(f.ctx, t, 150, 'last')?.id).toBe(d.id);
  });
  it('Strong = highest remaining RBE; Close = least Euclidean distance', () => {
    const { f, t, a, b } = setup();
    expect(remainingRbe(b)).toBe(3);
    expect(selectTarget(f.ctx, t, 150, 'strong')?.id).toBe(b.id);
    expect(selectTarget(f.ctx, t, 150, 'close')?.id).toBe(a.id);
  });
  it('Strong ties → First; Close ties → First; full ties → lower id', () => {
    const f = still();
    const t = f.tower('tern', 300, 300);
    const s1 = f.blot('splat', 200, at(340, 300));
    const s2 = f.blot('splat', 700, at(260, 300)); // same RBE, further along, same distance
    expect(selectTarget(f.ctx, t, 150, 'strong')?.id).toBe(s2.id);
    expect(selectTarget(f.ctx, t, 150, 'close')?.id).toBe(s2.id);
    const g = still();
    const u = g.tower('tern', 300, 300);
    const x1 = g.blot('dot', 500, at(320, 300));
    g.blot('dot', 500, at(280, 300));
    for (const m of ['first', 'last', 'strong', 'close'] as const) expect(selectTarget(g.ctx, u, 150, m)?.id, m).toBe(x1.id);
    expect(s1.id).toBeLessThan(s2.id);
  });
  it('range is measured to blot centre minus R', () => {
    const f = still();
    const t = f.tower('tern', 300, 300);
    f.blot('dot', 10, at(300 + 150 + 9, 300)); // exactly range + R
    expect(selectTarget(f.ctx, t, 150, 'first')).not.toBeNull();
    const g = still();
    const u = g.tower('tern', 300, 300);
    g.blot('dot', 10, at(300 + 150 + 9.5, 300));
    expect(selectTarget(g.ctx, u, 150, 'first')).toBeNull();
  });
  it('the T key modes drive the live tower (mode switch changes who is shot)', () => {
    const r = (mode: 'first' | 'last') => {
      const f = still();
      f.tower('owl', 300, 300, [0, 0], mode);
      const far = f.blot('dot', 900, at(400, 300));
      const near = f.blot('dot', 100, at(450, 300));
      f.tick();
      return hits(f)[0].blot === far.id ? 'far' : hits(f)[0].blot === near.id ? 'near' : '?';
    };
    expect(r('first')).toBe('far');
    expect(r('last')).toBe('near');
  });
});

describe('turning, cooldown and fire', () => {
  it('cooldown starts at 0: an aligned tower fires on its first tick', () => {
    const f = still();
    f.tower('owl', 300, 300);
    f.blot('dot', 10, at(400, 300));
    f.tick();
    expect(ofType(f, 'fire')).toHaveLength(1);
    expect(ofType(f, 'beam')).toHaveLength(1);
  });
  it('turns at 720°/s (12° per tick), never snaps, and fires only once facing', () => {
    const f = still();
    const t = f.tower('tern', 300, 300);
    f.blot('dot', 10, at(200, 300)); // directly behind: 180°
    let ticks = 0;
    let prev = t.angle;
    while (ofType(f, 'fire').length === 0 && ticks < 60) {
      f.tick(); ticks++;
      const d = Math.abs(Math.atan2(Math.sin(t.angle - prev), Math.cos(t.angle - prev)));
      expect(d).toBeLessThanOrEqual((12 * Math.PI) / 180 + 1e-9);
      prev = t.angle;
    }
    expect(ticks).toBe(15);
    expect(Math.abs(Math.cos(t.angle) + 1)).toBeLessThan(1e-9);
  });
  it('quills aim at the path intercept: the first quill hits a 208 px/s Blotch', () => {
    const f = createFake();
    f.tower('tern', 330, 340); // beside the (460,180)→(460,400) leg
    const b = f.blot('blotch', 660);
    for (let i = 0; i < 60 && hits(f).length === 0; i++) f.tick();
    expect(hits(f)[0]?.blot).toBe(b.id);
    expect(ofType(f, 'fire')).toHaveLength(1);
  });
  it('fires at its interval (Tern 0.95 s = 57 ticks)', () => {
    const f = still();
    f.tower('tern', 300, 300);
    f.blot('knot', 10, at(360, 300), ).hp = 1e6;
    f.tick(58);
    const ticks = ofType(f, 'fire').length;
    expect(ticks).toBe(2);
  });
});

describe('§6/§7 damage types: Wax immune to Cut and Wash, hit by Crush', () => {
  it('Tern A-path quills (Cut) tink off Wax and spend pierce', () => {
    const f = still();
    f.tower('tern', 300, 300, [2, 0]);
    f.blot('wax', 10, at(360, 300));
    f.tick(10);
    const h = hits(f);
    expect(h.length).toBeGreaterThan(0);
    expect(h.every((l) => l.result === 'immune' && l.b === 'cut')).toBe(true);
    expect(ofType(f, 'immune').length).toBe(h.length);
  });
  it('Koi pulses (Wash) do not damage Wax, but Wax is still slowed', () => {
    const f = still();
    f.tower('koi', 300, 300, [1, 0]);
    const w = f.blot('wax', 10, at(340, 300));
    f.tick();
    expect(hits(f)[0].result).toBe('immune');
    expect(w.alive && w.kind).toBe('wax');
    expect(f.log.some((l) => l.op === 'slow' && l.blot === w.id)).toBe(true);
  });
  it('Keel Quill (B2, Crush) pops Wax into 2 Splashes', () => {
    const f = still();
    f.tower('tern', 300, 300, [0, 2]);
    f.blot('wax', 10, at(360, 300));
    f.tick(3);
    expect(hits(f)[0]).toMatchObject({ b: 'crush', result: 'popped', kind: 'wax' });
  });
  it('Harpoon lance deals 6 ×3 = 18 to Wax and 6 to a Splat (overflow is the core’s)', () => {
    const f = still();
    f.tower('tern', 300, 300, [0, 3]);
    f.blot('wax', 10, at(360, 300));
    f.tick(3);
    expect(hits(f)[0]).toMatchObject({ a: 18, b: 'crush' });
    const g = still();
    g.tower('tern', 300, 300, [0, 3]);
    g.blot('splat', 10, at(360, 300));
    g.tick(3);
    expect(hits(g)[0]).toMatchObject({ a: 6, result: 'popped' });
  });
});

describe('§6 Pale', () => {
  it('non-detecting towers ignore Pale; their darts pass through it', () => {
    const f = still();
    f.tower('tern', 300, 300);
    f.blot('drop', 10, { pale: true, ...at(340, 300) });
    f.tick(30);
    expect(ofType(f, 'fire')).toHaveLength(0);
    const g = still();
    g.tower('tern', 300, 300);
    const pale = g.blot('drop', 10, { pale: true, ...at(340, 300) });
    const plain = g.blot('dot', 5, at(400, 300));
    g.tick(10);
    expect(hits(g).some((h) => h.blot === pale.id)).toBe(false);
    expect(hits(g).some((h) => h.blot === plain.id)).toBe(true);
  });
  it('the Owl detects Pale', () => {
    const f = still();
    f.tower('owl', 300, 300);
    f.blot('drop', 10, { pale: true, ...at(400, 300) });
    f.tick();
    expect(hits(f)).toHaveLength(1);
  });
  it('area attacks hit Pale: Frog splash, Koi pulse, Typhoon jets', () => {
    const f = still();
    f.tower('frog', 330, 520);
    f.blot('dot', 1300).stunTicks = 1e9; // parked on the path: the stone's lead lands on it
    const p1 = f.blot('drop', 1303, { pale: true }); // Pale: never the target, but in the splash
    p1.stunTicks = 1e9;
    f.tick(80);
    expect(hits(f).some((h) => h.blot === p1.id)).toBe(true);
    const g = still();
    g.tower('koi', 300, 300);
    const p2 = g.blot('drop', 10, { pale: true, ...at(340, 300) }); // also triggers the pulse alone
    g.tick();
    expect(hits(g).map((h) => h.blot)).toEqual([p2.id]);
    const j = still();
    j.tower('koi', 300, 300, [0, 3]);
    const p3 = j.blot('drop', 10, { pale: true, ...at(360, 300) });
    j.tick(20);
    expect(hits(j).some((h) => h.blot === p3.id)).toBe(true);
  });
  it('Beacon Owl strips Pale permanently inside r 170', () => {
    const f = still();
    f.tower('owl', 300, 300, [0, 3]);
    const inside = f.blot('splat', 10, { pale: true, ...at(450, 300) });
    const outside = f.blot('splat', 10, { pale: true, ...at(700, 300) });
    f.tick();
    expect(inside.pale).toBe(false);
    expect(outside.pale).toBe(true);
  });
});

describe('§7 Owl auras: best wins, never stacks', () => {
  it('a Tern under B2 (×0.85) and B3 (×0.75, +1) owls takes only the B3 aura', () => {
    const f = still();
    const tern = f.tower('tern', 300, 300);
    f.tower('owl', 360, 300, [0, 2]);
    f.tower('owl', 240, 300, [1, 3]);
    f.tick();
    expect(tern.buffIntervalMul).toBe(0.75);
    expect(tern.buffDamageAdd).toBe(1);
    expect(tern.buffDetect).toBe(true);
  });
  it('B1 gives detection only; outside 170 there is no buff; the owl buffs itself', () => {
    const f = still();
    const near = f.tower('tern', 300, 300);
    const far = f.tower('tern', 600, 300);
    const owl = f.tower('owl', 400, 300, [0, 2]);
    f.tick();
    expect([near.buffDetect, near.buffIntervalMul]).toEqual([true, 0.85]);
    expect([far.buffDetect, far.buffIntervalMul, far.buffDamageAdd]).toEqual([false, 1, 0]);
    expect(owl.buffIntervalMul).toBe(0.85);
  });
  it('a detection aura lets a Tern shoot Pale; the +1 is added to each hit', () => {
    const f = still();
    f.tower('tern', 300, 300);
    f.tower('owl', 300, 360, [0, 1]);
    const p = f.blot('drop', 10, { pale: true, hp: 1e6, ...at(380, 260) });
    f.tick(20);
    expect(hits(f).find((l) => l.tower === 1)?.blot).toBe(p.id);
    const g = still();
    g.tower('tern', 300, 300);
    g.tower('owl', 300, 360, [0, 3]);
    g.blot('knot', 10, { hp: 1e6, ...at(380, 260) });
    g.tick(20);
    expect(hits(g).find((l) => l.tower === 1)?.a).toBe(2);
  });
});

describe('§7 crosspath sealing via tierStatus', () => {
  const view = (tiers: [number, number], path: UpgradePath, tier: 1 | 2 | 3, money = 10_000) => {
    const f = still();
    const t = f.tower('tern', 300, 300, tiers);
    f.state.money = money;
    return tierStatus(f.state, t, path, tier);
  };
  it('owned, next, locked and sealed states', () => {
    expect(view([0, 0], 0, 1).status).toBe('next');
    expect(view([0, 0], 0, 2).status).toBe('locked');
    expect(view([2, 0], 0, 2).status).toBe('owned');
    expect(view([2, 0], 1, 1).status).toBe('next');
    expect(view([2, 1], 1, 2).status).toBe('sealed');
    expect(view([3, 1], 1, 3).status).toBe('sealed');
    expect(view([1, 1], 1, 2).status).toBe('next');
    expect(view([1, 2], 0, 2).status).toBe('sealed');
  });
  it('unaffordable says how much more', () => {
    expect(view([0, 0], 0, 1, 100)).toMatchObject({ affordable: false, shortBy: 50, cost: 150 });
  });
});

describe('Pondfrog stones', () => {
  const untilFire = (f: Fake, max = 120) => { for (let i = 0; i < max && ofType(f, 'fire').length === 0; i++) f.tick(); };
  /** Parked on the path at s (stunned, so the 0.45 s lead lands on it). */
  const parked = (f: Fake, kind: BlotKind, s: number) => { const b = f.blot(kind, s); b.stunTicks = 1e9; return b; };
  it('leads the target by 0.45 s at its current speed and lands after 27 ticks', () => {
    const f = createFake();
    f.tower('frog', 300, 470);
    const b = f.blot('dot', 1300);
    untilFire(f);
    const p = f.state.projectiles.items[0];
    const lead = pointAt(b.s + 80 * 0.45, { x: 0, y: 0 });
    expect(p.kind).toBe('stone');
    expect(Math.hypot(p.tx - lead.x, p.ty - lead.y)).toBeLessThan(1e-6);
    f.tick(25); // the spawn tick is arc tick 1 of 27
    expect(ofType(f, 'land')).toHaveLength(0);
    f.tick();
    const land = ofType(f, 'land');
    expect(land).toHaveLength(1);
    expect(land[0]).toMatchObject({ radius: 40, skip: false, stun: false });
    expect(b.alive).toBe(false);
  });
  it('splash max caps the blots hit (14), First order first', () => {
    const f = still();
    f.tower('frog', 330, 520);
    for (let i = 0; i < 20; i++) parked(f, 'splat', 1300 + i);
    f.tick(80);
    const h = hits(f);
    expect(h).toHaveLength(14);
    const ids = h.map((l) => l.blot);
    expect(ids).toEqual([...ids].sort((a, b) => b - a)); // later ids sit further along
  });
  it('Boulder Toad: 4 dmg, stun requested on survivors (the core ignores Knot)', () => {
    const f = still();
    f.tower('frog', 330, 520, [3, 0]);
    parked(f, 'dot', 1300);
    parked(f, 'knot', 1305);
    f.tick(80);
    expect(f.log.filter((l) => l.op === 'stun').map((s) => s.kind)).toEqual(['knot']);
    expect(hits(f).find((h) => h.kind === 'knot')?.a).toBe(4);
    expect(ofType(f, 'land')[0].stun).toBe(true);
  });
  it('Skip Stone skips 70 px along the path tangent and re-splashes r 32 ≤ 10', () => {
    const g = still();
    g.tower('frog', 520, 650, [0, 2]);
    parked(g, 'knot', 1450).hp = 1e6;
    for (let i = 0; i < 100 && ofType(g, 'land').length < 2; i++) g.tick();
    const lands = ofType(g, 'land');
    expect(lands.map((l) => [l.skip, l.radius])).toEqual([[false, 40], [true, 32]]);
    const tan = tangentAt(1450, { x: 0, y: 0 });
    expect(lands[1].x - lands[0].x).toBeCloseTo(tan.x * 70, 6);
    expect(lands[1].y - lands[0].y).toBeCloseTo(tan.y * 70, 6);
  });
});

describe('Mist Koi pulses', () => {
  it('fires only with a blot in reach; hits ≤ 8 in First order; Wash', () => {
    const f = still();
    f.tower('koi', 300, 300);
    f.tick(5);
    expect(ofType(f, 'pulse')).toHaveLength(0);
    for (let i = 0; i < 12; i++) f.blot('splat', 100 + i * 10, at(330 + i, 300));
    f.tick();
    const h = hits(f);
    expect(h).toHaveLength(8);
    expect(h.every((l) => l.b === 'wash')).toBe(true);
    expect(ofType(f, 'pulse')[0]).toMatchObject({ radius: 85, freeze: false });
  });
  it('Glacier Carp freezes every 3rd pulse; Wax is slowed instead', () => {
    const f = still();
    f.tower('koi', 300, 300, [3, 0]);
    const k = f.blot('knot', 10, at(330, 300)); k.hp = 1e6;
    const w = f.blot('wax', 10, at(320, 310));
    f.tick(Math.ceil(1.2 * 60) * 2 + 2);
    const pulses = ofType(f, 'pulse');
    expect(pulses.map((p) => p.freeze)).toEqual([false, false, true]);
    expect(f.log.filter((l) => l.op === 'freeze').map((l) => l.blot).sort()).toEqual([k.id, w.id].sort());
    expect(w.frozenTicks).toBe(0);
    expect(w.slow).toBe(0.6);
  });
  it('frozen blots take +1 from Crush', () => {
    const f = still();
    f.tower('tern', 300, 300, [0, 2]);
    const k = f.blot('knot', 10, at(360, 300));
    k.frozenTicks = 100;
    f.tick(3);
    expect(hits(f)[0].a).toBe(3);
  });
});

describe('Typhoon jets and Owl beams', () => {
  it('8 jets per volley, rotating 11.25° per volley, carrying the A1 slow', () => {
    const f = still();
    f.tower('koi', 300, 300, [1, 3]);
    f.blot('knot', 10, at(380, 300)).hp = 1e6;
    f.tick();
    expect(f.state.projectiles.count).toBe(8);
    const a0 = [...f.state.projectiles.items.slice(0, 8)].map((p) => p.angle).sort((a, b) => a - b);
    expect(a0[1] - a0[0]).toBeCloseTo(Math.PI / 4, 9);
    f.tick(18);
    const fires = ofType(f, 'fire');
    expect(fires).toHaveLength(2);
    expect(fires[1].angle - fires[0].angle).toBeCloseTo((11.25 * Math.PI) / 180, 9);
    expect(f.log.some((l) => l.op === 'slow' && l.a === 0.4)).toBe(true);
  });
  it('Piercing Beam hits 3 on the line to max range; Eclipse ×2 vs Knot', () => {
    const f = still();
    f.tower('owl', 100, 300, [2, 0]);
    for (let i = 0; i < 5; i++) f.blot('splat', 10 + i, at(150 + i * 40, 300));
    f.tick();
    expect(hits(f)).toHaveLength(3);
    expect(ofType(f, 'beam')[0]).toMatchObject({ x2: 100 + 320, eclipse: false });
    const g = still();
    g.tower('owl', 100, 300, [3, 0]);
    g.blot('knot', 10, at(300, 300));
    g.tick();
    expect(hits(g)[0].a).toBe(36);
    expect(ofType(g, 'beam')[0].eclipse).toBe(true);
  });
});

describe('every one of the 24 tiers changes observable behaviour', () => {
  const MIX: { kind: BlotKind; pale: boolean }[] = [
    { kind: 'splat', pale: false }, { kind: 'drop', pale: true }, { kind: 'wax', pale: false }, { kind: 'splash', pale: false },
    { kind: 'knot', pale: false }, { kind: 'blotch', pale: true }, { kind: 'streak', pale: false }, { kind: 'dot', pale: false },
  ];
  const trace = (kind: TowerKind, tiers: [number, number]) => {
    const f = createFake();
    f.tower(kind, 350, 520, tiers);
    f.tower('tern', 300, 540); // a neighbour, so Owl auras are observable
    for (let tk = 0; tk < 900; tk++) {
      if (tk % 15 === 0 && tk < 600) { const m = MIX[(tk / 15) % MIX.length]; f.blot(m.kind, 1000, { pale: m.pale }); }
      f.tick();
    }
    const ev = f.events.filter((e) => e.type !== 'hit' && e.type !== 'pop').map((e) => JSON.stringify(e));
    return JSON.stringify(f.log) + ev.join('|');
  };
  for (const kind of TOWER_ORDER) {
    for (const path of [0, 1] as const) {
      for (const tier of [1, 2, 3] as const) {
        const name = TOWERS[kind].paths[path][tier - 1].name;
        it(`${kind} ${path ? 'B' : 'A'}${tier} ${name}`, () => {
          const before: [number, number] = path === 0 ? [tier - 1, 0] : [0, tier - 1];
          const after: [number, number] = path === 0 ? [tier, 0] : [0, tier];
          expect(resolveStats(kind, after)).not.toEqual(resolveStats(kind, before));
          expect(trace(kind, after)).not.toBe(trace(kind, before));
        });
      }
    }
  }
});

describe('board condition 4: a full projectile pool', () => {
  const run = () => {
    const f = still();
    f.tower('tern', 300, 300, [3, 0]); // 3 quills per volley
    f.blot('knot', 10, at(360, 300)).hp = 1e9;
    const pool = f.state.projectiles;
    for (let i = 0; i < pool.items.length; i++) {
      const p = pool.items[i];
      Object.assign(p, { kind: 'quill', towerId: 1, x: -50, y: -50, vx: 0, vy: 0, pierceLeft: 1, travelled: 0, maxTravel: 1e9 });
    }
    pool.count = pool.items.length;
    f.tick(31); // volleys at tick 1 and 31
    return { count: pool.count, drops: projectileDrops(f.state), fires: ofType(f, 'fire').length };
  };
  it('drops the overflow without throwing, counts each drop, and is deterministic', () => {
    const a = run();
    expect(a).toEqual({ count: PROJECTILE_CAPACITY, drops: 6, fires: 2 }); // 2 volleys × 3 quills
    expect(run()).toEqual(a);
    expect(projectileDrops(still().state)).toBe(0);
  });
});

describe('determinism', () => {
  it('the same setup gives the same log twice', () => {
    const go = () => {
      const f = createFake();
      for (const [i, k] of TOWER_ORDER.entries()) f.tower(k, 300 + i * 50, 520, i % 2 ? [1, 2] : [2, 1]);
      for (let t = 0; t < 600; t++) { if (t % 10 === 0) f.blot((['splat', 'wax', 'knot', 'drop'] as const)[t % 4], 900, { pale: t % 20 === 0 }); f.tick(); }
      return JSON.stringify(f.log) + JSON.stringify(f.events);
    };
    expect(go()).toBe(go());
  });
  it('blot speed data used for stone lead is the §6 table', () => expect(BLOTS.dot.speed).toBe(80));
});
