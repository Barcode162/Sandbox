// WO-002 render logic without a canvas: a recording 2D context checks lobes, pips, Pale, the fx tiers and
// that pop rings are never culled. The pixels themselves are judged in the blots-grid screenshot.
import { describe, expect, it } from 'vitest';
import type { RenderFrame, Settings, SimEvent } from '../../../src/contracts/types';
import { createBlotLayer, drawBlotShape } from '../../../src/render/blots';
import { burst, createFx, fleckBudget } from '../../../src/render/fx';
import { pointAt } from '../../../src/sim/path';
import { BOSS_FEEL, PLACE_FLECK } from '../../../src/data/feel';
import { createTowerLayer } from '../../../src/render/towers';
import { createCore } from '../../../src/sim';
import { DEFAULT_SETTINGS } from '../../../src/app/settings';

type Call = [string, unknown[]];
function recorder() {
  const calls: Call[] = [];
  const props: Record<string, unknown> = {};
  const ctx = new Proxy({}, {
    get: (_t, k: string) => (k in props ? props[k] : (...a: unknown[]) => { calls.push([k, a]); }),
    set: (_t, k: string, v) => { props[k] = v; calls.push([`=${k}`, [v]]); return true; },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, calls, count: (m: string) => calls.filter((c) => c[0] === m).length };
}
const frame = (ctx: CanvasRenderingContext2D, state: RenderFrame['state'], s: Partial<Settings> = {}): RenderFrame =>
  ({ ctx, state, alpha: 1, nowMs: 0, dtMs: 16, settings: { ...DEFAULT_SETTINGS, ...s } });

describe('drawBlotShape', () => {
  it('lobed kinds trace 24 smooth samples; discs and hexagons do not', () => {
    for (const [kind, quads] of [['dot', 0], ['drop', 24], ['blotch', 24], ['wax', 0]] as const) {
      const r = recorder();
      drawBlotShape(r.ctx, kind, 50, 50, { pale: false, colourblind: false });
      expect(r.count('quadraticCurveTo'), kind).toBe(quads * 2); // shadow + body
    }
  });
  it('pips = layers remaining: Dot 1 … Blotch 5, none on Streak/Wax', () => {
    const pipArcs = (kind: Parameters<typeof drawBlotShape>[1]) => {
      const r = recorder();
      drawBlotShape(r.ctx, kind, 0, 0, { pale: false, colourblind: false });
      return r.calls.filter((c) => c[0] === 'arc' && Math.abs((c[1][2] as number) - 1.6) < 1e-9).length;
    };
    expect(['dot', 'drop', 'splat', 'splash', 'blotch', 'streak', 'wax'].map((k) => pipArcs(k as never))).toEqual([1, 2, 3, 4, 5, 0, 0]);
  });
  it('Pale is dashed 3/3 and hatched (clip + 45° lines); plain is neither', () => {
    const pale = recorder(), plain = recorder();
    drawBlotShape(pale.ctx, 'splat', 0, 0, { pale: true, colourblind: false });
    drawBlotShape(plain.ctx, 'splat', 0, 0, { pale: false, colourblind: false });
    expect(pale.calls.some((c) => c[0] === 'setLineDash' && (c[1][0] as number[]).join() === '3,3')).toBe(true);
    expect(pale.count('clip')).toBe(1);
    expect(plain.count('clip') + plain.count('setLineDash')).toBe(0);
  });
  it('Knot draws ⌈hp/3⌉ thread loops (full hp: 4)', () => {
    const r = recorder();
    drawBlotShape(r.ctx, 'knot', 0, 0, { pale: false, colourblind: false });
    expect(r.count('ellipse')).toBe(4);
  });
});

describe('blot layer + fx', () => {
  it('a pop rings and flecks; an immune hit sparks and never rings (§16.8)', () => {
    const fx = createFx();
    const layer = createBlotLayer(fx);
    const ringSpy: number[] = [];
    const orig = fx.ring.bind(fx);
    fx.ring = (...a) => { ringSpy.push(a[2]); orig(...a); };
    const core = createCore({ seed: 1, noWaves: true });
    layer.onSimEvent({ type: 'immune', blotId: 1, x: 0, y: 0 }, core.state);
    expect([ringSpy.length, fx.liveParticles]).toEqual([0, 3]);
    layer.onSimEvent({ type: 'pop', blotId: 2, kind: 'splat', x: 0, y: 0, towerId: 1, pale: false }, core.state);
    expect(ringSpy).toEqual([11]);
    expect(fx.liveParticles).toBe(9);
  });
  it('fleck tiers: 6 below 200 live, 2 to 600, 0 above; Reduce motion halves', () => {
    expect([fleckBudget(6, 0, false), fleckBudget(6, 250, false), fleckBudget(6, 600, false), fleckBudget(6, 10, true)]).toEqual([6, 2, 0, 3]);
    const fx = createFx();
    for (let i = 0; i < 400; i++) fx.flecks(0, 0, 6, '#000');
    expect(fx.liveParticles).toBeLessThanOrEqual(600);
  });
  it('rings are never culled, even at 600 live particles', () => {
    const fx = createFx();
    for (let i = 0; i < 200; i++) fx.flecks(0, 0, 6, '#000');
    for (let i = 0; i < 700; i++) fx.ring(i, 0, 5, 9, '#000', 160);
    fx.update(10, createCore({ seed: 1 }).state);
    const r = recorder();
    fx.draw(frame(r.ctx, createCore({ seed: 1 }).state), 'rings');
    expect(r.count('arc')).toBe(700);
    fx.update(200, createCore({ seed: 1 }).state);
    const r2 = recorder();
    fx.draw(frame(r2.ctx, createCore({ seed: 1 }).state), 'rings');
    expect(r2.count('arc')).toBe(0);
  });
  it('the layer draws every live blot, shadows first, largest R first; child squash starts at 1.35', () => {
    const core = createCore({ seed: 1, noWaves: true });
    const fx = createFx();
    const layer = createBlotLayer(fx);
    core.spawnBlot('dot', 300, false, 0, 0);
    core.spawnBlot('knot', 600, false, 0, 0);
    const child = core.spawnBlot('dot', 900, false, 5, 0)!;
    for (const e of core.sim.events) layer.onSimEvent(e, core.state);
    const r = recorder();
    layer.draw(frame(r.ctx, core.state), 'blots');
    const arcs = r.calls.filter((c) => c[0] === 'arc' && (c[1][3] as number) === 0 && Math.abs((c[1][4] as number) - Math.PI * 2) < 1e-9);
    const radii = arcs.map((c) => c[1][2] as number);
    expect(radii[0]).toBe(17); // knot shadow first
    expect(radii).toContain(9 * 1.35); // the squashing child
    void child;
  });
});

/** Body centres of lobed blots drawn live: the paper sheen arc (r 0.6R·scale, from 1.1π) sits on (x, y). */
const sheens = (calls: Call[], minR = 0, maxR = 1e9) => calls
  .filter((c) => c[0] === 'arc' && Math.abs((c[1][3] as number) - Math.PI * 1.1) < 1e-9 && (c[1][2] as number) > minR && (c[1][2] as number) < maxR)
  .map((c) => ({ x: c[1][0] as number, y: c[1][1] as number }));

function bossRig(s: number) {
  const core = createCore({ seed: 1, noWaves: true });
  core.beginRound();
  const tower = core.addTower('owl', 340, 510, [0, 0]);
  const boss = core.spawnBlot('inkmaw', s, false, 0, 0)!;
  core.state.boss = { blotId: boss.id, hp: boss.hp, maxHp: boss.hp, nextShed: 0 };
  const fx = createFx();
  const layer = createBlotLayer(fx);
  const feed = () => { for (const e of core.sim.events) layer.onSimEvent(e, core.state); (core.sim.events as SimEvent[]).length = 0; };
  return { core, tower, boss, fx, layer, feed };
}

describe('§10.6 boss beats (F-014, F-022, F-023)', () => {
  it('F-014: over the inkwell the boss is painted in the towers pass (above the occluder); clear of it, in blots', () => {
    const { core, boss, layer, feed } = bossRig(70);
    feed();
    const quads = (pass: 'blots' | 'towers') => { const r = recorder(); layer.draw(frame(r.ctx, core.state), pass); return r.count('quadraticCurveTo'); };
    expect([quads('blots'), quads('towers')]).toEqual([0, 48]); // shadow + body, 24 samples each
    boss.s = boss.ps = 400;
    expect([quads('blots'), quads('towers')]).toEqual([48, 0]);
  });
  it('F-014: the arrival heave squashes to 0.85, overshoots ~1.05 and settles by 400 ms', () => {
    const { core, boss, layer, feed } = bossRig(70);
    feed();
    layer.onSimEvent({ type: 'bossArrive', blotId: boss.id, maxHp: boss.hp }, core.state);
    const sy = (dt: number) => {
      layer.update(dt, core.state);
      const r = recorder();
      layer.draw(frame(r.ctx, core.state), 'towers');
      const sc = r.calls.find((c) => c[0] === 'scale');
      return sc ? (sc[1][1] as number) : 1;
    };
    expect(sy(0)).toBeCloseTo(BOSS_FEEL.arrive.squash, 6);
    expect(sy(180)).toBeCloseTo(BOSS_FEEL.arrive.overshoot, 6);
    expect(sy(220)).toBe(1);
  });
  it('F-022: shed Splash land behind the boss disc and launch there from its centre in 220 ms', () => {
    const { core, tower, boss, layer, feed } = bossRig(1000);
    feed();
    core.ctx.hit(boss, boss.hp * 0.25, 'glare', 9, tower, 0, 1);
    const kids = core.state.blots.items.slice(0, core.state.blots.count).filter((b) => b.alive && b.kind === 'splash');
    expect(kids).toHaveLength(6);
    for (const k of kids) expect(boss.s - k.s).toBeGreaterThan(46 + 12); // clear of the boss: R + the Splash's own R
    feed();
    const at = (dt: number) => { layer.update(dt, core.state); const r = recorder(); layer.draw(frame(r.ctx, core.state), 'blots'); return sheens(r.calls, 0, 20); };
    const start = at(0);
    expect(start).toHaveLength(6); // the 6 Splash (squashing at 1.35); the boss's own sheen is r 27.6
    for (const p of start) expect(Math.hypot(p.x - boss.x, p.y - boss.y)).toBeLessThan(1e-6);
    const mid = at(BOSS_FEEL.shed.launchMs / 2);
    expect(new Set(mid.map((p) => Math.round(p.y))).size).toBeGreaterThan(1); // arcs off the line, both sides
    const end = at(BOSS_FEEL.shed.launchMs / 2 + 1);
    expect(end).toHaveLength(6);
    const slots = kids.map((k) => pointAt(k.s, { x: 0, y: 0 }));
    end.forEach((p, i) => { expect(p.x).toBeCloseTo(slots[i].x, 6); expect(p.y).toBeCloseTo(slots[i].y, 6); });
  });
  it('F-023: the death bursts 80 flecks + 12 paper scraps and the 4 Knots scatter from its centre to s − 24k', () => {
    const { core, tower, boss, fx, layer, feed } = bossRig(1000);
    feed();
    const cx = boss.x, cy = boss.y;
    core.ctx.hit(boss, boss.hp, 'glare', 9, tower, 0, 1);
    feed();
    // the pop's own 6 + the death's 40 maw + 40 knot + 12 scraps
    expect(fx.liveParticles).toBe(6 + 80 + 12);
    const knots = core.state.blots.items.slice(0, core.state.blots.count).filter((b) => b.alive && b.kind === 'knot');
    expect(knots.map((k) => 1000 - k.s)).toEqual([0, 24, 48, 72]);
    // Knot centres = their scribble loops' ellipse centres (wobble ≤ 0.08R); at t 0 they all sit on the burst
    const centres = (dt: number) => {
      layer.update(dt, core.state);
      const r = recorder(); layer.draw(frame(r.ctx, core.state, { reduceMotion: true }), 'blots');
      // Knot bodies are discs of R 17 × the child squash (1.35 → 1), shadows first
      return r.calls.filter((c) => c[0] === 'arc' && (c[1][2] as number) >= 17 && (c[1][2] as number) <= 17 * 1.35 + 1e-9 && (c[1][4] as number) === Math.PI * 2)
        .map((c) => ({ x: c[1][0] as number, y: c[1][1] as number }));
    };
    const all0 = centres(0);
    expect(all0).toHaveLength(8);
    const t0 = all0.slice(4);
    for (const p of t0) expect(Math.hypot(p.x - cx, p.y - cy)).toBeLessThan(1e-6);
    const all1 = centres(BOSS_FEEL.death.scatterMs);
    expect(all1).toHaveLength(8);
    const t1 = all1.slice(4);
    t1.forEach((p, i) => { const q = pointAt(knots[i].s, { x: 0, y: 0 }); expect(p.x).toBeCloseTo(q.x, 6); expect(p.y).toBeCloseTo(q.y, 6); });
  });
  it('F-017: place flecks are 8 kraft-edge triangles 4–6 px with an ink-soft rim, leaving the coaster rim', () => {
    const core = createCore({ seed: 1, noWaves: true });
    const fx = createFx();
    const towers = createTowerLayer(fx);
    core.addTower('tern', 340, 510, [0, 0]);
    towers.onSimEvent({ type: 'place', towerId: 1, kind: 'tern', x: 340, y: 510, cost: 200 }, core.state);
    expect(fx.liveParticles).toBe(8);
    const r = recorder();
    fx.draw(frame(r.ctx, core.state), 'particles');
    expect(r.calls.filter((c) => c[0] === '=fillStyle').map((c) => c[1][0])).toEqual(Array(8).fill('#A88C5E'));
    expect(r.calls.filter((c) => c[0] === '=strokeStyle').map((c) => c[1][0])).toEqual(Array(8).fill('#4A4558'));
    const starts = r.calls.filter((c) => c[0] === 'moveTo').map((c) => Math.hypot((c[1][0] as number) - 340, (c[1][1] as number) - 510));
    for (const d of starts) expect(d).toBeGreaterThan(PLACE_FLECK.fromR - PLACE_FLECK.size[1]);
  });
  it('a bare Fx (no burst) still gets plain flecks', () => {
    const seen: number[] = [];
    const bare = { ring() {}, flecks(_x: number, _y: number, n: number) { seen.push(n); }, sparks() {}, liveParticles: 0 };
    burst(bare, 0, 0, 5, '#000', { speed: [1, 2], size: [1, 2], lifeMs: 10, edge: null, shape: 'scrap' });
    expect(seen).toEqual([5]);
  });
});
