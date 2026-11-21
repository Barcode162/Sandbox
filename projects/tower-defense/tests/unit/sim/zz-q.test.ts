import { it } from 'vitest';
import { createSim } from '../../../src/sim';
import { createScriptDriver } from '../../../src/sim/bot';
import { WIN_SCRIPT, LOSS_SCRIPT } from '../../../src/data/scripts';
import { ROUNDS } from '../../../src/data/waves';
import { BLOTS } from '../../../src/data/blots';
const BOV = JSON.parse(process.env.BOV ?? '{}');
for (const [k, o] of Object.entries(BOV)) Object.assign((BLOTS as any)[k], o);
// overrides: { "12": [[gi, field, value], ...] }
const OV = JSON.parse(process.env.OV ?? '{}');
for (const [r, list] of Object.entries(OV)) for (const [gi, f, v] of list as [number, string, number][]) (ROUNDS[+r - 1].groups[gi] as any)[f] = v;
import { TOWERS } from '../../../src/data/towers';
const RATE = +(process.env.RATE ?? 1);
if (RATE !== 1) for (const t of Object.values(TOWERS) as any[]) { t.base.interval *= RATE; for (const path of t.paths) for (const tier of path) if (tier.effect.set?.interval) tier.effect.set.interval *= RATE; }
const INK = process.env.INK; if (INK) (BLOTS as any).inkmaw.hp = +INK;
import { BALANCE } from '../../../src/data/balance';
if (process.env.LATE) (BALANCE as any).lateCountMul = +process.env.LATE;
function run(name: string, sc: any, lives: number) {
  const sim = createSim({ seed: 1, startLives: lives }); const d = createScriptDriver(sc);
  let last = lives; const per: string[] = []; let bossS = 0; let bossMin = 1e9, r18max = 0, r18at8 = 0; const lk: Record<string, number> = {};
  while (!d.done(sim)) { d.beforeStep(sim); sim.step(); const st = sim.state; if (st.boss) { bossMin = Math.min(bossMin, st.boss.hp); const bb = st.blots.items.slice(0, st.blots.count).find(b => b.id === st.boss!.blotId); if (bb) bossS = bb.s; } if (st.round === 18 && st.phase === 'round') { let on = 0; for (let i = 0; i < st.blots.count; i++) { const b = st.blots.items[i]; if (b.x >= 0 && b.x <= 1080) on++; } r18max = Math.max(r18max, on); if (st.roundTick === 480) r18at8 = on; } for (const e of sim.events) { if (e.type === 'leak' && e.kind === 'inkmaw') console.log('BOSSLEAK', name, sim.state.boss ? 0 : '', JSON.stringify(sim.state.blots.items.slice(0, sim.state.blots.count).filter(b => b.kind === 'inkmaw').map(b => b.hp))); if (e.type === 'leak') lk[e.kind] = (lk[e.kind] ?? 0) + e.livesLost; if (e.type === 'roundClear' && process.env.LK && last - sim.state.lives > 0) { console.log('LK', name, e.round, JSON.stringify(lk)); } if (e.type === 'roundClear') for (const k in lk) delete lk[k]; } for (const e of sim.events) if (e.type === 'roundClear' || e.type === 'defeat' || e.type === 'victory') { if (e.type !== 'victory') per.push(`${sim.state.phase === 'defeat' ? 'X' : ''}${(e as any).round ?? ''}:${last - sim.state.lives}`); last = sim.state.lives; } }
  console.log(name, 'bossS', bossS.toFixed(0), 'bossMin', bossMin, 'r18 max/8s', r18max, r18at8, sim.state.phase, 'R', sim.state.round, 'lives', sim.state.lives, 'money', sim.state.money, '|', per.join(' '));
}
it('q', () => { run('WIN ', WIN_SCRIPT, 100); run('WINP', WIN_SCRIPT, 100000); run('LOSS', LOSS_SCRIPT, 100); });
