// WO-002 driver + core against a FAKE tower system (tests/unit/sim/fake-towers.ts). This file exists only
// until WO-003's real systems land; scripts.test.ts runs the same checks on the real ones (board condition 5).
import { describe, expect, it, vi } from 'vitest';
import { fakeUpdateAuras, fakeUpdateProjectiles, fakeUpdateTowers } from './fake-towers';

vi.mock('../../../src/sim/towers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/sim/towers')>()),
  updateAuras: fakeUpdateAuras,
  updateTowers: fakeUpdateTowers,
  updateProjectiles: fakeUpdateProjectiles,
}));

const { playScript, createScriptDriver } = await import('../../../src/sim/bot');
const { createSim } = await import('../../../src/sim');
const { LOSS_BY_ROUND, LOSS_SCRIPT, SCRIPT_SEED, WIN_SCRIPT } = await import('../../../src/data/scripts');

describe('script driver (fake towers)', () => {
  // Balance (≥ 40 seeds) is only meaningful on WO-003's real towers: see scripts.test.ts. With the fake,
  // the driver must still play every round of the script and buy every scripted item through R19.
  it('the win script plays through R19 and buys every scripted item (lives padded for the fake)', () => {
    const sim = createSim({ seed: SCRIPT_SEED, startLives: 100_000 });
    const r = playScript(WIN_SCRIPT, { seed: SCRIPT_SEED, sim, maxRound: 19 });
    expect([r.outcome, r.round]).toEqual(['running', 20]);
    expect(sim.state.towers.map((t) => `${t.kind}${t.tiers.join('')}`)).toEqual(['tern30', 'tern11', 'koi02', 'owl20', 'frog30']);
  });
  it('the loss script reaches defeat by R12', () => {
    const r = playScript(LOSS_SCRIPT, { seed: SCRIPT_SEED });
    expect(r.outcome).toBe('defeat');
    expect(r.round).toBeLessThanOrEqual(LOSS_BY_ROUND);
  });
  it('the same seed and script give the same stateHash twice', () => {
    const a = playScript(WIN_SCRIPT, { seed: SCRIPT_SEED, maxRound: 8 });
    const b = playScript(WIN_SCRIPT, { seed: SCRIPT_SEED, maxRound: 8 });
    expect(a).toEqual(b);
    expect(a.outcome).toBe('running');
    expect(a.round).toBe(9);
  });
  it('stopAt halts mid-round, and every scripted command is spent by the end', () => {
    const sim = createSim({ seed: SCRIPT_SEED });
    const d = createScriptDriver(WIN_SCRIPT, { stopAt: { round: 6, seconds: 8 } });
    while (!d.done(sim)) { d.beforeStep(sim); sim.step(); }
    expect([sim.state.round, sim.state.phase, sim.state.roundTick]).toEqual([6, 'round', 480]);
    expect(sim.state.towers.map((t) => [t.kind, t.tiers[0]])).toEqual([['tern', 1], ['tern', 0], ['koi', 0], ['owl', 0]]);
  });
});
