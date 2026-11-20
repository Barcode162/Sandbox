// window.__inkfold test hook (contract: InkfoldTestHook in contracts/types.ts). Installed when the URL has ?test=1.
// Scaffold implements the boot subset; WO-004 completes stage(), WO-002/WO-004 playScript/restart/perfProbe.
import type { InkfoldTestHook } from '../contracts/types';
import type { Game } from './game';
import { summarize } from '../sim/bot';

const pending = (what: string): never => { throw new Error(`PENDING: ${what}`); };

export function installTestHook(game: Game, errors: string[], setManual: () => void): InkfoldTestHook {
  const hook: InkfoldTestHook = {
    version: 1,
    ready: () => true,
    scene: () => game.scene(),
    errors: () => errors.slice(),
    summary: () => summarize(game.sim),
    command: (cmd) => game.command(cmd),
    useManualClock: setManual,
    advance(ms, hz) {
      const dt = 1000 / hz;
      for (let t = 0; t + 1e-9 < ms; t += dt) game.frame(dt);
    },
    playScript: () => pending('playScript (WO-002 driver + WO-004 wiring)'),
    restart() { const t0 = performance.now(); game.restart(); return performance.now() - t0; },
    stage: async () => pending('stage (WO-004)'),
    perfProbe: () => pending('perfProbe (WO-002 bench)'),
  };
  window.__inkfold = hook;
  return hook;
}
