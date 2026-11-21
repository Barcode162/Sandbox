// window.__inkfold test hook (contract: InkfoldTestHook in contracts/types.ts). Installed when the URL has ?test=1.
// WO-004: stage() composes every §18 capture (plus the board-condition sheets), playScript runs the real
// app loop under the manual clock, restart() is timed, perfProbe times WO-002's stress sim.
import type { InkfoldTestHook, RunSummary, SimEvent, SimState, StageId, TowerKind, UpgradePath } from '../contracts/types';
import type { Game } from './game';
import { DEFAULT_SETTINGS } from './settings';
import { createScriptDriver, summarize, type ScriptDriver } from '../sim/bot';
import { buildStressSim, runPerf } from '../sim/bench';
import { SCRIPTS, SCRIPT_SEED } from '../data/scripts';
import { TOWERS } from '../data/towers';
import { FOLD } from '../data/layout';

const FRAME_60 = 1000 / 60;
/** 30 minutes of sim at 1× is far beyond a full 20-round run; a hard stop so no stage can hang. */
const MAX_RUN_STEPS = 60 * 60 * 30;

interface Beats { warning?: number; arrive?: number; shed50?: number; death?: number }

export function installTestHook(game: Game, errors: string[], setManual: () => void): InkfoldTestHook {
  const d = game.debug;
  let run: { name: 'win' | 'loss'; driver: ScriptDriver; beats: Beats; lastKey: string | null } | null = null;

  const advance = (ms: number, hz = 60, draw = true): void => {
    const dt = 1000 / hz;
    for (let t = 0; t + 1e-9 < ms; t += dt) d.frame(dt, draw);
  };

  function startScript(name: 'win' | 'loss', maxRound?: number): NonNullable<typeof run> {
    d.newRun({ seed: SCRIPT_SEED }, true);
    const driver = createScriptDriver(SCRIPTS[name], maxRound ? { maxRound } : {});
    const beats: Beats = {};
    game.setBeforeStep((s) => driver.beforeStep(s));
    d.watch((e: SimEvent) => {
      const tick = game.sim.state.tick;
      if (e.type === 'bossWarning') beats.warning = tick;
      else if (e.type === 'bossArrive') beats.arrive = tick;
      else if (e.type === 'bossShed' && Math.abs(e.threshold - 0.5) < 1e-6) beats.shed50 = tick;
      else if (e.type === 'bossDeath') beats.death = tick;
    });
    run = { name, driver, beats, lastKey: null };
    return run;
  }

  function endScript(): void {
    game.setBeforeStep(null);
    d.watch(null);
    run = null;
  }

  /**
   * Bring a scripted run to the first moment `reached` holds, without drawing (board condition 2).
   * Reuses the live run when it is the same script and the target is still ahead (or is this exact key).
   */
  function ensure(name: 'win' | 'loss', key: string, reached: (s: Readonly<SimState>, b: Beats) => boolean): NonNullable<typeof run> {
    let r = run;
    if (!r || r.name !== name || (reached(game.sim.state, r.beats) && r.lastKey !== key)) r = startScript(name);
    else if (r.lastKey === key) return r;
    let steps = 0;
    while (!reached(game.sim.state, r.beats) && !r.driver.done(game.sim) && steps++ < MAX_RUN_STEPS && game.scene() === 'play') d.frame(FRAME_60, false);
    r.lastKey = key;
    return r;
  }

  /** Draw real frames until `until` holds or `maxMs` passes. */
  function drawUntil(until: () => boolean, maxMs: number): void {
    for (let t = 0; t < maxMs && !until(); t += FRAME_60) d.frame(FRAME_60, true);
  }

  const inRound = (r: number, seconds: number) => (s: Readonly<SimState>): boolean =>
    s.round > r || (s.round === r && s.phase !== 'intermission' && s.roundTick >= seconds * 60);

  function freshBoard(money?: number): void {
    endScript();
    d.newRun(money !== undefined ? { seed: SCRIPT_SEED, startMoney: money } : { seed: SCRIPT_SEED }, false);
    advance(100, 60, false);
  }

  function foldStage(kind: TowerKind, a: number, b: number, hoverSealed = false): void {
    const spots: Record<TowerKind, [number, number]> = { tern: [340, 510], frog: [760, 300], koi: [280, 554], owl: [860, 360] };
    const def = TOWERS[kind];
    let spend = def.cost;
    for (let t = 0; t < a; t++) spend += def.paths[0][t].cost;
    for (let t = 0; t < b; t++) spend += def.paths[1][t].cost;
    freshBoard(spend + 400);
    const [x, y] = spots[kind];
    game.command({ type: 'place', kind, x, y });
    advance(50, 60, false);
    const id = game.sim.state.towers[0]?.id ?? 1;
    const ups: UpgradePath[] = [...Array<UpgradePath>(a).fill(0), ...Array<UpgradePath>(b).fill(1)];
    for (const p of ups) game.command({ type: 'upgrade', towerId: id, path: p });
    advance(300, 60, false);
    d.pointerDown(x, y);
    advance(250);
    if (hoverSealed) d.pointerMove(FOLD.colX[1] + 44, FOLD.tierY[1] + 54);
    else d.pointerMove(1100, 690 - 80);
    advance(120);
  }

  async function stage(id: StageId): Promise<void> {
    setManual();
    d.setSheet(null);
    d.settings.set({ ...DEFAULT_SETTINGS });
    d.pointerMove(-100, -100);
    switch (id) {
      case 'title-0': endScript(); d.toTitle(); d.frame(0, true); break;
      case 'title-800': endScript(); d.toTitle(); advance(800); break;
      case 'title-idle': endScript(); d.toTitle(); advance(5000); break;
      case 'place-valid':
        freshBoard(); d.key('1'); d.pointerMove(340, 510); advance(250); break;
      case 'place-invalid':
        freshBoard(); d.key('1'); d.pointerMove(400, 300); advance(100); d.pointerMove(460, 300); advance(250); break;
      case 'place-done':
        freshBoard(); d.key('1'); d.pointerMove(340, 510); advance(150); d.pointerDown(340, 510); advance(160); break;
      case 'r1-8s':
        ensure('win', id, inRound(1, 7)); drawUntil(() => inRound(1, 8)(game.sim.state), 1500); break;
      case 'fold-tern-0-0': foldStage('tern', 0, 0); break;
      case 'fold-tern-3-1': foldStage('tern', 3, 1); break;
      case 'fold-tern-1-3': foldStage('tern', 1, 3); break;
      case 'fold-frog-0-0': foldStage('frog', 0, 0); break;
      case 'fold-frog-3-1': foldStage('frog', 3, 1); break;
      case 'fold-frog-1-3': foldStage('frog', 1, 3); break;
      case 'fold-koi-0-0': foldStage('koi', 0, 0); break;
      case 'fold-koi-3-1': foldStage('koi', 3, 1); break;
      case 'fold-koi-1-3': foldStage('koi', 1, 3); break;
      case 'fold-owl-0-0': foldStage('owl', 0, 0); break;
      case 'fold-owl-3-1': foldStage('owl', 3, 1); break;
      case 'fold-owl-1-3': foldStage('owl', 1, 3); break;
      case 'fold-sealed-hover': foldStage('tern', 2, 0, true); break;
      case 'r18-8s':
      case 'r18-8s-cb':
        ensure('win', 'r18', inRound(18, 6));
        if (id === 'r18-8s-cb') d.settings.set({ colourblind: true });
        drawUntil(() => inRound(18, 8)(game.sim.state), 2500);
        d.render();
        break;
      case 'r20-warning': {
        const r = ensure('win', id, inRound(20, 11));
        drawUntil(() => r.beats.warning !== undefined && game.sim.state.tick - r.beats.warning >= 42, 4000);
        break;
      }
      case 'r20-arrival': {
        const r = ensure('win', id, inRound(20, 13.5));
        drawUntil(() => r.beats.arrive !== undefined && game.sim.state.tick - r.beats.arrive >= 30, 4000);
        break;
      }
      case 'r20-shed50': {
        ensure('win', id, (s, b) => b.shed50 !== undefined || (s.phase !== 'round' && s.round >= 20));
        advance(130);
        break;
      }
      case 'r20-death': {
        ensure('win', id, (s, b) => b.death !== undefined || s.phase === 'victory' || s.phase === 'defeat');
        advance(150);
        break;
      }
      case 'pause':
        ensure('win', id, inRound(1, 3)); advance(100); d.key('Escape'); advance(300); break;
      case 'settings-cb':
        ensure('win', id, inRound(1, 3)); advance(100); d.key('Escape'); advance(100);
        d.pointerDown(640, 280 + 2 * 56 + 22); d.settings.set({ colourblind: true }); advance(300); break;
      case 'gameover':
        ensure('loss', id, (s) => s.phase === 'defeat'); advance(1700); break;
      case 'victory':
        ensure('win', id, (s) => s.phase === 'victory' || s.phase === 'defeat'); advance(2700); break;
      case 'blots-grid':
      case 'towers-sheet':
        d.setSheet(id); d.render(); break;
      default: {
        const never: never = id;
        throw new Error(`unknown stage ${String(never)}`);
      }
    }
    d.render();
  }

  const hook: InkfoldTestHook = {
    version: 1,
    ready: () => true,
    scene: () => game.scene(),
    errors: () => errors.slice(),
    summary: () => summarize(game.sim),
    command: (cmd) => game.command(cmd),
    useManualClock: setManual,
    advance(ms, hz) { advance(ms, hz, true); },
    playScript(name, frameHz, maxRound): RunSummary {
      setManual();
      d.setSheet(null);
      const r = startScript(name, maxRound);
      const dt = 1000 / frameHz;
      const limit = MAX_RUN_STEPS * Math.max(1, frameHz / 60);
      for (let i = 0; i < limit && !r.driver.done(game.sim) && game.scene() === 'play'; i++) d.frame(dt, false);
      const out = summarize(game.sim);
      endScript();
      d.render();
      return out;
    },
    restart() {
      setManual();
      endScript();
      const t0 = performance.now();
      game.restart();
      return performance.now() - t0;
    },
    stage,
    perfProbe(steps) {
      const g = (globalThis as { gc?: () => void }).gc;
      g?.();
      const mem = (): number | null => {
        const m = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
        return m ? m.usedJSHeapSize / (1024 * 1024) : null;
      };
      const sim = buildStressSim();
      const rep = runPerf(sim, steps, () => performance.now(), () => { g?.(); return mem(); });
      return rep;
    },
  };
  window.__inkfold = hook;
  return hook;
}
