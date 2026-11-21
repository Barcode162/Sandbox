// WO-001 data integrity: the frozen data modules agree with the spec's own derived columns.
import { describe, expect, it } from 'vitest';
import { BLOTS } from '../../../src/data/blots';
import { BALANCE } from '../../../src/data/balance';
import { ECONOMY, roundBonus } from '../../../src/data/economy';
import { PATH_LENGTH_SPEC } from '../../../src/data/map';
import { LOSS_SCRIPT, WIN_SCRIPT, WIN_SCRIPT_SPEND } from '../../../src/data/scripts';
import { TOWERS, resolveStats, tiersValid } from '../../../src/data/towers';
import { ROUNDS } from '../../../src/data/waves';
import { PATH_TOTAL, pathCoverage } from '../../../src/sim/path';
import { placementFail } from '../../../src/sim/placement';
import type { Command, TowerKind } from '../../../src/contracts/types';

describe('§5 map', () => {
  it('path length matches 2570.5', () => expect(Math.abs(PATH_TOTAL - PATH_LENGTH_SPEC)).toBeLessThan(0.1));
  it('the pocket at (350,520) covers ~648 px (±3 %) of path at r 150', () => {
    expect(Math.abs(pathCoverage(350, 520, 150) - 648)).toBeLessThan(20);
  });
});

describe('§6 blots', () => {
  it('RBE column', () => {
    const rbe = Object.fromEntries(Object.values(BLOTS).map((b) => [b.kind, b.rbe]));
    expect(rbe).toMatchObject({ dot: 1, drop: 2, splat: 3, splash: 4, blotch: 5, streak: 7, wax: 9, knot: 30 });
  });
  it('Wax ignores Cut and Wash only', () => expect([...BLOTS.wax.immuneTo].sort()).toEqual(['cut', 'wash']));
});

describe('§8 waves and economy', () => {
  it('20 rounds', () => expect(ROUNDS.map((r) => r.round)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1)));
  it('every round RBE column equals Σ count·RBE (R20 excludes the boss)', () => {
    for (const r of ROUNDS) {
      const sum = r.groups.filter((g) => !BLOTS[g.kind].boss).reduce((n, g) => n + g.count * BLOTS[g.kind].rbe, 0);
      expect(sum, `R${r.round}`).toBe(r.rbe);
    }
  });
  it('cash-at-start column = previous cash + RBE + bonus (zero leaks)', () => {
    expect(ROUNDS[0].cashAtStart).toBe(ECONOMY.startMoney);
    for (let i = 1; i < ROUNDS.length; i++) {
      expect(ROUNDS[i].cashAtStart, `R${i + 1}`).toBe(ROUNDS[i - 1].cashAtStart + ROUNDS[i - 1].rbe + roundBonus(i));
    }
  });
  it('the boss enters R20 at +14 s', () => {
    const g = ROUNDS[19].groups.find((x) => x.kind === 'inkmaw');
    expect(g).toMatchObject({ count: 1, delay: 14 });
  });
});

describe('§7 towers', () => {
  it('crosspath rule', () => {
    expect(tiersValid(3, 1)).toBe(true);
    expect(tiersValid(1, 3)).toBe(true);
    expect(tiersValid(2, 2)).toBe(false);
    expect(tiersValid(3, 2)).toBe(false);
  });
  it('resolution order A1..B3, set then add', () => {
    expect(resolveStats('tern', [3, 0])).toMatchObject({ pierce: 5, interval: 0.5 * BALANCE.towerIntervalMul, spreadDeg: [-10, 0, 10] });
    expect(resolveStats('tern', [1, 3])).toMatchObject({ attack: 'lance', damage: 6, pierce: 5, range: 230, interval: 1.1 * BALANCE.towerIntervalMul, damageType: 'crush' });
    expect(resolveStats('frog', [1, 3])).toMatchObject({ splashMax: 20, skips: 2, interval: 0.55 * BALANCE.towerIntervalMul, splashRadius: 56 });
    expect(resolveStats('owl', [3, 1])).toMatchObject({ damage: 18, range: 400, auraDetect: true });
    expect(resolveStats('koi', [1, 3])).toMatchObject({ attack: 'jets', slowPct: 0.4, damage: 2 });
  });
  it('24 tiers, each with a name, cost and visual change', () => {
    const tiers = Object.values(TOWERS).flatMap((t) => [...t.paths[0], ...t.paths[1]]);
    expect(tiers).toHaveLength(24);
    for (const t of tiers) { expect(t.cost).toBeGreaterThan(0); expect(t.visual.length).toBeGreaterThan(5); expect(t.effectLine.length).toBeLessThanOrEqual(26); }
  });
});

describe('§8 scripts', () => {
  function replay(script: typeof WIN_SCRIPT) {
    const towers: { kind: TowerKind; x: number; y: number; tiers: [number, number] }[] = [];
    let spent = 0;
    const byRound: number[] = [];
    for (let r = 1; r <= 20; r++) {
      for (const c of (script[r] ?? []) as Command[]) {
        if (c.type === 'place') {
          expect(placementFail(c.kind, c.x, c.y, towers), `R${r} ${c.kind}@${c.x},${c.y}`).toBeNull();
          towers.push({ kind: c.kind, x: c.x, y: c.y, tiers: [0, 0] });
          spent += TOWERS[c.kind].cost;
        } else if (c.type === 'upgrade') {
          const t = towers[c.towerId - 1];
          t.tiers[c.path]++;
          expect(tiersValid(t.tiers[0], t.tiers[1]), `R${r} T${c.towerId}`).toBe(true);
          spent += TOWERS[t.kind].paths[c.path][t.tiers[c.path] - 1].cost;
        }
      }
      byRound[r] = spent;
    }
    return { spent, byRound, towers };
  }
  it('win script: valid positions and crosspaths, spends 8,340, affordable every round with zero leaks', () => {
    const { spent, byRound } = replay(WIN_SCRIPT);
    expect(spent).toBe(WIN_SCRIPT_SPEND);
    for (let r = 1; r <= 20; r++) expect(byRound[r], `R${r}`).toBeLessThanOrEqual(ROUNDS[r - 1].cashAtStart);
  });
  it('loss script places two valid Terns', () => expect(replay(LOSS_SCRIPT).towers).toHaveLength(2));
});
