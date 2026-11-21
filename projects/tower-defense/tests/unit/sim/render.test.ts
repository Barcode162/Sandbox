// WO-002 render logic without a canvas: a recording 2D context checks lobes, pips, Pale, the fx tiers and
// that pop rings are never culled. The pixels themselves are judged in the blots-grid screenshot.
import { describe, expect, it } from 'vitest';
import type { RenderFrame, Settings } from '../../../src/contracts/types';
import { createBlotLayer, drawBlotShape } from '../../../src/render/blots';
import { createFx, fleckBudget } from '../../../src/render/fx';
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
