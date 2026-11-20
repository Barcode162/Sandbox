/**
 * App shell: phases (title/play/paused/result/wipe), the frame driver, seeds, restart, pause,
 * settings/save, and the window.__lily test hook. OWNER: WO-004.
 * WO-001 version is a working skeleton: it boots, ticks the sim, renders, takes key presses and runs bots.
 * WO-004 completes it: §7.6 pause triggers, §7.7 restart lockout + wipe, best time, settings, audio unlock.
 */
import type { AppPhase, BotPolicy, LilyHook, SimEvent, SimState, Slot, Tuning, ViewState } from '../contracts';
import { createAudio } from '../audio/audio';
import { createInput } from '../input/input';
import { createLoop } from '../loop';
import { createRenderer } from '../render/renderer';
import { loadSave } from '../save/save';
import { makeBot } from '../sim/bots';
import { hashSeed } from '../sim/rng';
import { createSim, step } from '../sim/sim';
import { createUi } from '../ui/ui';

export interface App {
  hook: LilyHook;
}

function seedOverride(): number | null {
  const v = new URLSearchParams(location.search).get('seed');
  if (v === null || !/^-?\d+$/.test(v)) return null;
  return Number(v) | 0;
}

export function createApp(canvas: HTMLCanvasElement, uiRoot: HTMLElement): App {
  const save = loadSave(safeStorage());
  const reducedOs = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const settings = { muted: save.muted, reducedMotion: save.reducedMotion ?? reducedOs };
  const salt = crypto.getRandomValues(new Uint32Array(1))[0]! | 0;
  const fixedSeed = seedOverride();
  let runCounter = save.runs;
  let tuningPatch: Partial<Tuning> = {};
  let seed = 0;
  let sim: SimState;
  let phase: AppPhase = 'title';
  let cursor = 0;
  let pending: Slot | null = null;
  let bot: BotPolicy | null = null;
  let manual = false;
  let lastFrameMs = 0;
  let lastSimStepMs = 0;

  const renderer = createRenderer(canvas);
  const audio = createAudio();
  const ui = createUi(uiRoot, {
    resume: () => setPhase('play'),
    restart: () => restart(),
    toggleMute: () => (settings.muted = !settings.muted),
    toggleReducedMotion: () => (settings.reducedMotion = !settings.reducedMotion),
    pause: () => setPhase('paused'),
  });

  function setPhase(p: AppPhase) {
    phase = p;
    loop.running = p !== 'paused';
  }

  function restart(s?: number) {
    seed = s ?? fixedSeed ?? hashSeed(runCounter++, salt);
    sim = createSim(seed, tuningPatch);
    cursor = 0;
    pending = null;
    setPhase('title');
    loop.reset();
  }

  const view = (alpha: number): ViewState => ({
    phase,
    settings,
    prevBestMs: save.bestMs,
    newBest: false,
    firstRun: save.bestMs === null,
    nowMs: performance.now(),
    resultAgeMs: 0,
    alpha,
  });

  const loop = createLoop({
    tick() {
      const t0 = performance.now();
      const press = bot ? bot(sim) : pending;
      pending = null;
      if (press && phase === 'title') setPhase('play');
      step(sim, { press });
      if (sim.result && phase === 'play') setPhase('result');
      lastSimStepMs = performance.now() - t0;
    },
    render(alpha, dt) {
      const t0 = performance.now();
      const fresh: readonly SimEvent[] = sim.log.slice(cursor);
      cursor = sim.log.length;
      const v = view(alpha);
      renderer.frame(sim, v, fresh, dt);
      ui.update(sim, v, fresh);
      audio.frame(sim, v, fresh);
      lastFrameMs = performance.now() - t0;
    },
  });

  const input = createInput(window, (x, y) => renderer.pickPad(x, y), (i) => {
    audio.unlock();
    if (i.type === 'hop') pending = i.slot;
    else if (i.type === 'pause') setPhase(phase === 'paused' ? 'play' : 'paused');
  });

  const resize = () => renderer.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
  window.addEventListener('resize', resize);
  resize();
  restart();

  let last = performance.now();
  const raf = (now: number) => {
    const dt = Math.min(250, now - last);
    last = now;
    input.poll();
    if (!manual) loop.advance(dt);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  const hook: LilyHook = {
    version: 1,
    sim: () => sim,
    phase: () => phase,
    seed: () => seed,
    events: () => sim.log,
    setTuning: (p) => void (tuningPatch = { ...tuningPatch, ...p }),
    restart: (s) => restart(s),
    manualClock: (on) => void (manual = on),
    frame: (dt, n = 1) => {
      for (let i = 0; i < n; i++) loop.advance(dt);
    },
    press: (slot) => void (pending = slot),
    setBot: (name, opts) => void (bot = name ? makeBot(name, opts) : null),
    pads: () =>
      sim.river.pads.flatMap((p) => {
        const c = renderer.padOnScreen(p.id);
        return c ? [{ id: p.id, kind: p.kind, layer: p.layer, state: sim.padStates[p.id]!.state, ...c }] : [];
      }),
    timings: () => ({ restartToReadyMs: null, resultToReadyMs: null, lastFrameMs, lastSimStepMs }),
    settings: () => ({ ...settings }),
  };
  return { hook };
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
