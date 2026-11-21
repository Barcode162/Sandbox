import { it } from 'vitest';
import { createSim } from '../../../src/sim';
import { createScriptDriver } from '../../../src/sim/bot';
import { WIN_SCRIPT, LOSS_SCRIPT } from '../../../src/data/scripts';
it('q', () => {
  for (const [name, sc] of [['WIN', WIN_SCRIPT], ['LOSS', LOSS_SCRIPT]] as const) {
    const sim = createSim({ seed: 1 }); const d = createScriptDriver(sc);
    let lastLives = 100; const leaks: Record<string, number> = {};
    while (!d.done(sim)) { d.beforeStep(sim); sim.step(); for (const e of sim.events) {
      if (e.type === 'leak') leaks[e.kind] = (leaks[e.kind] ?? 0) + e.livesLost;
      if (e.type === 'roundClear' || e.type === 'defeat' || e.type === 'victory') { console.log(name, 'R', (e as any).round ?? sim.state.round, e.type, 'lost', lastLives - sim.state.lives, 'lives', sim.state.lives, 'money', sim.state.money, JSON.stringify(leaks), sim.state.towers.map(t => t.kind + t.tiers.join('') + ':' + t.pops).join(',')); lastLives = sim.state.lives; for (const k in leaks) delete leaks[k]; } } }
  }
});
