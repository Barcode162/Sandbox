import { it } from 'vitest';
import { createSim } from '../../../src/sim';
import { pathCoverage } from '../../../src/sim/path';
it('q', () => {
  const sim = createSim({ seed: 1 });
  sim.enqueue({ type: 'place', kind: 'tern', x: 340, y: 510 });
  sim.enqueue({ type: 'startRound' });
  let fires = 0, first = -1;
  for (let i = 0; i < 2400; i++) { sim.step(); for (const e of sim.events) if (e.type === 'fire') { fires++; if (first < 0) { first = i; const b = sim.state.blots.items[0]; console.log('Q first fire tick', i, 'blot', b.x.toFixed(0), b.y.toFixed(0), b.s.toFixed(0), 'angle', e.angle.toFixed(2)); } } }
  console.log('Q fires', fires, 'pops', sim.state.stats.pops, 'lives', sim.state.lives, 'cover', pathCoverage(340, 510, 150));
});
