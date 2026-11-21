/**
 * The app shell without the DOM: phases, the frame driver, seeds, restart, pause, settings/save and the
 * window.__lily hook. OWNER: WO-004. app.ts wires it to the page; unit tests drive it with fakes.
 *
 * Phases (§7.1, §7.6, §7.7):
 *   title ─first hop takes off→ play ─sim.result→ result ─250 ms lockout, then hop/Enter/tap→ wipe ─150 ms→ title
 *   title | play | result ─Esc/P/button/hidden/blur→ paused ─Esc/P/Resume→ (where it was)
 * During `wipe` the sim is already the fresh run (the paper sweeps up off it); a hop pressed during the
 * wipe is held and fires on the first tick after it, so a fast player never loses the press.
 *
 * Clock: `now()` is performance.now(), or a virtual clock advanced by frame(dt) under the manual clock, so
 * lockout, wipe and resultAgeMs follow the frames tests drive. Restart timings are always real wall time.
 */
import type {
  AppPhase, BotPolicy, Intent, LilyHook, Renderer, RunResult, SaveData, Settings, SimEvent, SimState, Slot,
  TickInput, Tuning, Ui, UiCallbacks, ViewState,
} from '../contracts';
import type { GameAudio } from '../audio/audio';
import { createLoop } from '../loop';
import { ticks } from '../tuning';
import { applyResult, loadSave, writeSave } from '../save/save';
import { makeBot } from '../sim/bots';
import { hashSeed } from '../sim/rng';
import { createSim, slotForPad, step } from '../sim/sim';

/** §7.7: inputs ignored this long after the result begins. */
export const LOCKOUT_MS = 250;
/** §7.7: paper wipe length. */
export const WIPE_MS = 150;
/** §4.5: a pad answers taps within 1.4 r of its centre. */
export const HIT_RADIUS = 1.4;

export interface SimApi {
  createSim(seed: number, patch?: Partial<Tuning>): SimState;
  step(s: SimState, input: TickInput): void;
  slotForPad(s: SimState, padId: number): Slot | null;
  makeBot: typeof makeBot;
}

export interface ShellDeps {
  renderer: Renderer;
  makeUi(cb: UiCallbacks): Ui;
  audio: GameAudio;
  storage: Pick<Storage, 'getItem' | 'setItem'> | null;
  prefersReducedMotion: boolean;
  /** `?seed=N` pins every run (§14.2). */
  fixedSeed: number | null;
  sessionSalt: number;
  wallNow(): number;
  sim?: SimApi;
}

export interface ShellCore {
  hook: LilyHook;
  /** Player intent from any device. Returns true if the game consumed it. */
  intent(i: Intent): boolean;
  /** Real (rAF) frame. Ignored while the manual clock is on. */
  frame(dtMs: number): void;
  /** Pad under a client point if a hop to it is meaningful now (touch, §4.5), else null. */
  pick(clientX: number, clientY: number): number | null;
  /** visibilitychange → hidden, or window blur (§7.6). */
  lostFocus(): void;
  /** The OS reduced-motion preference changed. */
  osReducedMotion(on: boolean): void;
  readonly phase: AppPhase;
}

const REAL: SimApi = { createSim, step, slotForPad, makeBot };
const NO_EVENTS: readonly SimEvent[] = Object.freeze([]);

/** Slot by position in the pad's layer. Equals the §4.5 mapping for layers of ≤ 3 pads (G1). */
export function positionalSlot(sim: SimState, padId: number): Slot {
  const pad = sim.river.pads[padId]!;
  const layer = sim.river.layers[pad.layer]!;
  if (layer.length === 1) return 'F';
  if (pad.index === 0) return 'L';
  if (pad.index === layer.length - 1) return 'R';
  return 'F';
}

export function createShell(d: ShellDeps): ShellCore {
  const api = d.sim ?? REAL;
  let save: SaveData = loadSave(d.storage);
  let osReduced = d.prefersReducedMotion;
  const settings: Settings = { muted: save.muted, reducedMotion: save.reducedMotion ?? osReduced };
  d.audio.setMuted(settings.muted);

  let sessionRuns = 0;
  let tuningPatch: Partial<Tuning> = {};
  let seed = 0;
  let sim!: SimState;
  let phase: AppPhase = 'title';
  let resumeTo: AppPhase = 'title';
  let cursor = 0;
  let pending: Slot | null = null;
  /** A tapped pad waiting for its tick. Mapped to a slot only then, against the layer that tick resolves (F-003). */
  let pendingPad: number | null = null;
  let bot: BotPolicy | null = null;

  let manual = false;
  let virtualMs = 0;
  const now = () => (manual ? virtualMs : d.wallNow());

  let prevBestMs: number | null = null;
  let newBest = false;
  let firstRun = true;
  let resultAt: number | null = null;
  let resultWall: number | null = null;
  let wipeAt: number | null = null;
  /** Wall-clock stamps of the restart in flight; consumed when the fresh frame is drawn. */
  let restartWall: number | null = null;
  let failWall: number | null = null;
  let readyPending = false;
  let restartToReadyMs: number | null = null;
  let resultToReadyMs: number | null = null;
  let lastFrameMs = 0;
  let lastSimStepMs = 0;

  const persist = () => writeSave(d.storage, save);

  function setPhase(p: AppPhase) {
    phase = p;
    loop.running = p !== 'paused';
  }

  function newRun(s?: number) {
    seed = s ?? d.fixedSeed ?? hashSeed(sessionRuns, d.sessionSalt);
    sessionRuns++;
    sim = api.createSim(seed, tuningPatch);
    cursor = 0;
    pending = null;
    pendingPad = null;
    prevBestMs = save.bestMs;
    newBest = false;
    firstRun = prevBestMs === null;
    resultAt = null;
    resultWall = null;
    loop.reset();
  }

  function onResult(r: RunResult) {
    resultAt = now();
    resultWall = d.wallNow();
    const out = applyResult(save, r);
    save = out.save;
    newBest = out.newBest;
    firstRun = out.firstRun;
    persist();
    setPhase('result');
  }

  /** Restart with the wipe (result after lockout, or the pause menu). */
  function beginRestart() {
    const wasPaused = phase === 'paused';
    restartWall = d.wallNow();
    failWall = resultWall;
    newRun();
    wipeAt = now();
    setPhase('wipe');
    if (wasPaused) d.audio.duck(false);
  }

  function finishWipe() {
    wipeAt = null;
    setPhase('title');
    readyPending = true;
  }

  function lockedOut(): boolean {
    return resultAt !== null && now() - resultAt < LOCKOUT_MS;
  }

  function pause() {
    if (phase !== 'title' && phase !== 'play' && phase !== 'result') return;
    resumeTo = phase;
    pending = null;
    pendingPad = null;
    setPhase('paused');
    d.audio.duck(true);
  }

  function resume() {
    if (phase !== 'paused') return;
    setPhase(resumeTo);
    loop.reset();
    d.audio.duck(false);
  }

  function toggleMute() {
    settings.muted = !settings.muted;
    save = { ...save, muted: settings.muted };
    persist();
    d.audio.setMuted(settings.muted);
  }

  function toggleReducedMotion() {
    settings.reducedMotion = !settings.reducedMotion;
    save = { ...save, reducedMotion: settings.reducedMotion };
    persist();
  }

  /**
   * The layer a press on the coming tick resolves against (sim §4.4 order: hop when idle, retarget within
   * the first retargetMs of squash, otherwise buffer for the landing), or null when presses do nothing.
   */
  function pressLayer(): number | null {
    const f = sim.frog;
    if (sim.result) return null;
    if (f.phase === 'idle') return sim.choices.length ? sim.river.pads[f.padId]!.layer + 1 : null;
    if (f.phase !== 'squash' && f.phase !== 'air') return null;
    const target = sim.river.pads[f.targetId]!.layer;
    const retarget = f.phase === 'squash' && sim.tick + 1 - f.hopTick <= ticks(sim.tuning.retargetMs);
    return retarget ? target : target + 1;
  }

  /**
   * Pads a tap may mean now. Idle: the current choices. Airborne: both the hop's target layer and the one
   * after it, so a tap on either is a pad tap (sent to that pad or dropped by slotForTap) and never falls
   * through to a screen third that could steer the hop elsewhere (F-003).
   */
  function tapCandidates(): readonly number[] {
    if (sim.choices.length) return sim.choices.map((c) => c.padId);
    const f = sim.frog;
    if (sim.result || (f.phase !== 'squash' && f.phase !== 'air')) return [];
    const k = sim.river.pads[f.targetId]!.layer;
    return [...(sim.river.layers[k] ?? []), ...(sim.river.layers[k + 1] ?? [])].map((p) => p.id);
  }

  /** Slot that reaches `padId` on the coming tick, or null if no press then can reach it (never a different pad). */
  function slotForTap(padId: number): Slot | null {
    const pad = sim.river.pads[padId];
    if (!pad || pad.layer !== pressLayer()) return null;
    return api.slotForPad(sim, padId) ?? positionalSlot(sim, padId);
  }

  function intent(i: Intent): boolean {
    switch (i.type) {
      case 'mute':
        toggleMute();
        d.audio.uiTick();
        return true;
      case 'pause':
        if (phase === 'paused') resume();
        else if (phase === 'wipe') return false;
        else pause();
        d.audio.uiTick();
        return true;
      default:
        break;
    }
    // hop | hopPad | confirm
    switch (phase) {
      case 'paused':
        return false; // the pause menu's focused button answers natively
      case 'result':
        if (!lockedOut()) beginRestart();
        return true;
      case 'wipe':
      case 'title':
      case 'play': {
        if (i.type === 'hopPad') {
          pendingPad = i.padId;
          pending = null;
          return true;
        }
        if (i.type !== 'hop') return false; // confirm does nothing outside a result
        pending = i.slot;
        pendingPad = null;
        return true;
      }
    }
  }

  /** One ViewState, refilled each frame (no per-frame allocation, F-006). Consumers read it during the call only. */
  const viewState: ViewState = { phase, settings, prevBestMs, newBest, firstRun, nowMs: 0, resultAgeMs: 0, alpha: 0 };
  function view(alpha: number): ViewState {
    const t = now();
    viewState.phase = phase;
    viewState.prevBestMs = prevBestMs;
    viewState.newBest = newBest;
    viewState.firstRun = firstRun;
    viewState.nowMs = t;
    viewState.resultAgeMs = resultAt === null ? 0 : t - resultAt;
    viewState.alpha = alpha;
    return viewState;
  }

  const loop = createLoop({
    tick() {
      const t0 = d.wallNow();
      let press: Slot | null = null;
      if (phase === 'title' || phase === 'play') {
        press = bot ? bot(sim) : pendingPad !== null ? slotForTap(pendingPad) : pending;
        pending = null;
        pendingPad = null;
      }
      api.step(sim, { press });
      if (phase === 'title' && sim.frog.hopTick >= 0) setPhase('play');
      if (phase === 'play' && sim.result) onResult(sim.result);
      lastSimStepMs = d.wallNow() - t0;
    },
    render(alpha, dt) {
      const t0 = d.wallNow();
      const fresh: readonly SimEvent[] = cursor === sim.log.length ? NO_EVENTS : sim.log.slice(cursor);
      cursor = sim.log.length;
      const v = view(alpha);
      d.renderer.frame(sim, v, fresh, dt);
      ui.update(sim, v, fresh);
      d.audio.frame(sim, v, fresh);
      const t1 = d.wallNow();
      lastFrameMs = t1 - t0;
      if (readyPending) {
        readyPending = false;
        if (restartWall !== null) restartToReadyMs = t1 - restartWall;
        if (failWall !== null) resultToReadyMs = t1 - failWall;
        restartWall = failWall = null;
      }
    },
  });

  function advance(dtMs: number) {
    if (phase === 'wipe' && wipeAt !== null && now() - wipeAt >= WIPE_MS) finishWipe();
    loop.advance(dtMs);
  }

  const ui = d.makeUi({
    resume: () => {
      resume();
      d.audio.uiTick();
    },
    restart: () => {
      if (phase === 'result' && lockedOut()) return;
      if (phase === 'wipe') return;
      beginRestart();
      d.audio.uiTick();
    },
    toggleMute: () => {
      toggleMute();
      d.audio.uiTick();
    },
    toggleReducedMotion: () => {
      toggleReducedMotion();
      d.audio.uiTick();
    },
    pause: () => {
      pause();
      d.audio.uiTick();
    },
  });

  newRun();

  const hook: LilyHook = {
    version: 1,
    sim: () => sim,
    phase: () => phase,
    seed: () => seed,
    events: () => sim.log,
    setTuning: (p) => void (tuningPatch = { ...tuningPatch, ...p }),
    restart: (s) => {
      if (phase === 'paused') d.audio.duck(false);
      wipeAt = null;
      newRun(s);
      setPhase('title');
    },
    manualClock: (on) => {
      if (on && !manual) virtualMs = d.wallNow();
      manual = on;
    },
    frame: (dt, n = 1) => {
      for (let i = 0; i < n; i++) {
        if (manual) virtualMs += dt;
        advance(dt);
      }
    },
    press: (slot) => void intent({ type: 'hop', slot }),
    setBot: (name, opts) => void (bot = name ? api.makeBot(name, opts) : null),
    pads: () =>
      sim.river.pads.flatMap((p) => {
        const c = d.renderer.padOnScreen(p.id);
        return c ? [{ id: p.id, kind: p.kind, layer: p.layer, state: sim.padStates[p.id]!.state, ...c }] : [];
      }),
    timings: () => ({ restartToReadyMs, resultToReadyMs, lastFrameMs, lastSimStepMs }),
    settings: () => ({ ...settings }),
  };

  return {
    hook,
    intent,
    frame(dtMs) {
      if (!manual) advance(dtMs);
    },
    pick(x, y) {
      // Hit circles (1.4r) of neighbouring pads overlap, so among the pads a tap could mean, take the
      // one nearest relative to its size, not whichever the renderer lists first.
      let best: number | null = null;
      let bestD = HIT_RADIUS;
      for (const id of tapCandidates()) {
        const c = d.renderer.padOnScreen(id);
        if (!c || c.r <= 0) continue;
        const dn = Math.hypot(x - c.x, y - c.y) / c.r;
        if (dn <= bestD) {
          bestD = dn;
          best = id;
        }
      }
      return best;
    },
    lostFocus() {
      if (phase === 'play') pause();
    },
    osReducedMotion(on) {
      osReduced = on;
      if (save.reducedMotion === null) settings.reducedMotion = osReduced;
    },
    get phase() {
      return phase;
    },
  };
}
