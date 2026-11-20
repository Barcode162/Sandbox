/**
 * FROZEN CONTRACTS — M-0002 Lilyfield (WO-001).
 * Every module talks to every other module only through these types.
 * Changing anything here mid-build is a CEO decision (plan.md §Contracts).
 *
 * Units: world units (wu); river width 100 wu; y grows NORTH (upward).
 * Time inside the sim is integer ticks at TICK_HZ (src/tuning.ts). Never ms.
 * Spec references (§x.y) are to bureau/missions/M-0002-frog-chase/design/experience.md.
 */

// ───────────────────────── World (generator output, §4.1) ─────────────────────────

/** Which key answers for a target. Left / Forward / Right (§4.5). */
export type Slot = 'L' | 'F' | 'R';

/** `bank` is the single pseudo-pad at layer 0 (south) and layer 37 (north). */
export type PadKind = 'lily' | 'soggy' | 'curl' | 'bank';

export interface Pad {
  /** Index into River.pads. Stable for the run. */
  readonly id: number;
  /** 0 = south bank, 1..36 = hop layers, 37 = north bank. */
  readonly layer: number;
  /** Position within its layer, 0 = westmost. Order never changes (§4.1 pad motion). */
  readonly index: number;
  /** Rest centre in wu (sway is cosmetic and render-only). Banks: x = 50, y = layer * P. */
  readonly x: number;
  readonly y: number;
  /** Radius in wu, 8.5..11 (banks: 0; render draws banks as shores). */
  readonly r: number;
  readonly kind: PadKind;
  /** Radians. Notch direction for lily; fold axis for curl. */
  readonly rot: number;
  /** Radians, 0..2π. Sway/bob phase for render. */
  readonly phase: number;
}

export type DecorKind = 'bud' | 'petal' | 'flower';

export interface Decor {
  readonly kind: DecorKind;
  readonly x: number;
  readonly y: number;
  readonly rot: number;
  readonly size: number;
  readonly phase: number;
}

/** Pure data, the generator's whole output (§4.1 G8). */
export interface River {
  readonly seed: number;
  /** layers[k] = pads of layer k, west→east. layers.length === 38. layers[0] and layers[37] hold one bank pad each. */
  readonly layers: readonly (readonly Pad[])[];
  /** Flat list, pads[id].id === id. */
  readonly pads: readonly Pad[];
  readonly decor: readonly Decor[];
}

// ───────────────────────── Sim runtime state ─────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

/** §4.2 pad states. Kept per pad id in SimState.padStates. */
export type PadState = 'idle' | 'reachable' | 'occupied' | 'dipping' | 'sinking' | 'flipping' | 'sunk' | 'flanked';

export interface PadRuntime {
  state: PadState;
  /** Tick the current state began. */
  since: number;
}

/** §4.4. `squash` and `air` together are "the hop"; land/settle are visual-only (render derives from lastLandTick). */
export type FrogPhase = 'idle' | 'squash' | 'air' | 'sinking' | 'flung' | 'eaten' | 'won';

export interface FrogState {
  phase: FrogPhase;
  /** Tick the current phase began. */
  since: number;
  /** Pad the frog stands on (or last stood on while airborne). */
  padId: number;
  /** Hop target while squash/air; otherwise === padId. */
  targetId: number;
  /** Slot of the current/last hop ('F' before the first hop). */
  slot: Slot;
  /** Tick the current/last hop started (squash start); -1 before hop 1. */
  hopTick: number;
  /** Tick of the last landing; -1 before hop 1. */
  landTick: number;
  /** Buffered press waiting for the landing tick (§4.4), or null. */
  buffer: { slot: Slot; tick: number } | null;
  /** Highest hop layer landed on so far (0 on the bank). */
  layer: number;
}

/** §4.3 gator states. */
export type GatorPhase = 'dormant' | 'surfacing' | 'chasing' | 'flanking' | 'lunging' | 'sated' | 'retreating';

export interface Flank {
  padId: number;
  /** Tick the 250 ms telegraph started; pad becomes `flanked` at startTick + flankTelegraphTicks. */
  startTick: number;
  armed: boolean;
}

export interface GatorState {
  phase: GatorPhase;
  since: number;
  /** Safety time in seconds (§4.3). */
  g: number;
  /** Threat 0..1 = clamp(1 - g/2.5, 0, 1). Drives every danger signal. */
  tau: number;
  /** Head position (wu) after this tick and before it (for render interpolation). */
  head: Vec2;
  headPrev: Vec2;
  headVel: Vec2;
  /** Head facing, radians (0 = east, π/2 = north). */
  heading: number;
  /** 9 body segments, [0] behind the head (§4.3 position). Prev copy for interpolation. */
  body: Vec2[];
  bodyPrev: Vec2[];
  flank: Flank | null;
  /** Layer index at which the last flank happened (-Infinity if none). */
  lastFlankLayer: number;
}

/** What ended the run. `still` = eaten by the gap closing; `flank` = landed on a flanked pad. */
export type ResultCause = 'still' | 'flank' | 'soggy' | 'curl' | 'win';

export interface RunResult {
  kind: 'eaten' | 'sunk' | 'won';
  cause: ResultCause;
  /** Tick the result became final (the fail/win tick). */
  tick: number;
  /** Timer value in ms at that tick (sim time since timer start). */
  timeMs: number;
  /** Highest hop layer reached (for "17 of 36 pads"). */
  layer: number;
  /** Pad that killed the frog (soggy/curl/flank), else null. */
  culpritId: number | null;
}

/** A reachable target and the one chip it shows (§4.5 slot mapping). Sorted west→east. */
export interface Choice {
  slot: Slot;
  padId: number;
  /** Extra slots that also answer (2-pad layer: forward pad also answers its side key; bank answers all). */
  alsoAnswers: readonly Slot[];
}

/** Append-only log entries; the determinism test compares these (§4.7). `tick` is always the sim tick. */
export type SimEvent =
  | { t: 'timerStart'; tick: number }
  | { t: 'hop'; tick: number; from: number; to: number; slot: Slot; buffered: boolean }
  | { t: 'retarget'; tick: number; to: number; slot: Slot }
  | { t: 'land'; tick: number; pad: number; layer: number; kind: PadKind; g: number; nearMiss: boolean }
  | { t: 'escape'; tick: number; pad: number }
  | { t: 'sinkStart'; tick: number; pad: number }
  | { t: 'tilt'; tick: number; pad: number }
  | { t: 'flip'; tick: number; pad: number }
  | { t: 'hook'; tick: number }
  | { t: 'flankStart'; tick: number; pad: number }
  | { t: 'flankArmed'; tick: number; pad: number }
  | { t: 'flankClear'; tick: number; pad: number }
  | { t: 'nearMiss'; tick: number; g: number }
  | { t: 'eaten'; tick: number; cause: 'still' | 'flank' }
  | { t: 'sunk'; tick: number; pad: number; kind: 'soggy' | 'curl' }
  | { t: 'win'; tick: number; timeMs: number };

export type SimEventType = SimEvent['t'];

/**
 * Whole sim state. Owned and mutated ONLY by sim/step(). Everyone else reads.
 * Determinism rule: step() reads nothing but (state, input). No Date, no Math.random, no DOM.
 */
export interface SimState {
  readonly tuning: Tuning;
  readonly river: River;
  tick: number;
  /** Tick of hop-1 takeoff; null until then (§7.1, polish 19). */
  timerStartTick: number | null;
  frog: FrogState;
  gator: GatorState;
  /** Indexed by pad id. */
  padStates: PadRuntime[];
  /** Current chips; empty while airborne or after a result. */
  choices: Choice[];
  /** Pad centres the frog has landed on, in order, starting with the south bank (gator trail + win route trace, polish 21). */
  trail: Vec2[];
  /** Cumulative arc length at each trail point (wu). */
  trailArc: number[];
  result: RunResult | null;
  /** Append-only. Consumers keep their own cursor. */
  log: SimEvent[];
}

/** One tick's input. At most one press per tick; the latest press in a frame wins (§4.4). */
export interface TickInput {
  press: Slot | null;
}

// ───────────────────────── Tuning (§4.3 tunables + timing) ─────────────────────────

export interface Tuning {
  // Gator gap (§4.3)
  g0: number;
  gMax: number;
  gainBase: number;
  gainRubber: number;
  flankG: number;
  flankFromLayer: number;
  flankEvery: number;
  flankTelegraphMs: number;
  nearMissG: number;
  hookLayer: number;
  tauSpan: number;
  // Frog timing (§4.4), ms; the sim converts with ticks()
  squashMs: number;
  airMs: number;
  settleMs: number;
  bufferMs: number;
  retargetMs: number;
  soggyEscapeMs: number;
  soggySinkMs: number;
  curlTiltMs: number;
  curlFlipMs: number;
  lungeMs: number;
  // Gator motion (§4.3 position)
  headOmega: number;
  bodySegments: number;
  bodySpacing: number;
  // Generator (§4.1)
  layers: number;
  pitch: number;
  width: number;
}

// ───────────────────────── App shell, settings, save ─────────────────────────

export type AppPhase = 'title' | 'play' | 'paused' | 'result' | 'wipe';

export interface Settings {
  muted: boolean;
  /** Effective value (OS preference unless the player toggled it). */
  reducedMotion: boolean;
}

/** localStorage key `lilyfield.v1`, JSON of this shape. */
export interface SaveData {
  version: 1;
  bestMs: number | null;
  muted: boolean;
  /** null = follow prefers-reduced-motion. */
  reducedMotion: boolean | null;
  runs: number;
}

/** Everything the view layers need beyond SimState. Built by the app shell each frame. */
export interface ViewState {
  phase: AppPhase;
  settings: Settings;
  /** Best before this run (for "best 27.41 → 24.18" and the crossed-out old best). */
  prevBestMs: number | null;
  /** True once a win beat prevBestMs (never on a first-ever run, polish 20). */
  newBest: boolean;
  firstRun: boolean;
  /** performance.now() in ms; drives ambient/cosmetic animation only. */
  nowMs: number;
  /** Real ms since the result tick (0 when no result). */
  resultAgeMs: number;
  /** Interpolation factor between the previous and the current tick, 0..1. */
  alpha: number;
}

// ───────────────────────── Module interfaces ─────────────────────────

/** WO-003. Draws the world onto the canvas. Never mutates SimState. */
export interface Renderer {
  resize(cssWidth: number, cssHeight: number, dpr: number): void;
  /** newEvents = log entries appended since the previous frame (drives juice: particles, hit-stop, shake). */
  frame(sim: SimState, view: ViewState, newEvents: readonly SimEvent[], dtMs: number): void;
  /** Pad id under a client-space point (hit radius 1.4r, §4.5), or null. */
  pickPad(clientX: number, clientY: number): number | null;
  /** Client-space circle of a pad as last drawn, for tests and touch. */
  padOnScreen(padId: number): { x: number; y: number; r: number } | null;
}

export interface UiCallbacks {
  resume(): void;
  restart(): void;
  toggleMute(): void;
  toggleReducedMotion(): void;
  pause(): void;
}

/** WO-003. DOM overlay: HUD (timer, best, progress reed, pause/mute buttons), title text, cards, pause menu. */
export interface Ui {
  /** Called every render frame; also repaints the live tell diagram on the sunk card (§7.4). */
  update(sim: SimState, view: ViewState, newEvents: readonly SimEvent[]): void;
  dispose(): void;
}

/** WO-004. Player intents, already mapped from keys/touch/gamepad. */
export type Intent =
  | { type: 'hop'; slot: Slot }
  | { type: 'hopPad'; padId: number }
  | { type: 'pause' }
  | { type: 'mute' }
  | { type: 'confirm' };

export interface InputSource {
  /** Call once per animation frame (gamepad polling is edge-triggered). */
  poll(): void;
  dispose(): void;
}

/** WO-004. Web Audio, all synthesized (§8). */
export interface AudioEngine {
  /** Resume/create the AudioContext; call from the first user gesture. */
  unlock(): void;
  frame(sim: SimState, view: ViewState, newEvents: readonly SimEvent[]): void;
  setMuted(muted: boolean): void;
  /** Pause duck: ramp master to 0 over 120 ms (§7.6) or back. */
  duck(on: boolean): void;
}

// ───────────────────────── Bots and the test hook ─────────────────────────

/** Called once per sim tick BEFORE step(); returns the press for that tick. Pure function of state (+ its own closure). */
export type BotPolicy = (sim: SimState) => Slot | null;

export type BotName =
  /** Picks a safe, unflanked pad every `delayMs` (default 400) after landing. Must win. */
  | 'runner'
  /** Never presses. Must be eaten (cause 'still') after the hook. */
  | 'idler'
  /** Runner that stops pressing once tau >= opts.tau (screenshot 6). */
  | 'idleAtTau'
  /** Always presses F. Used for the layer-6 soggy fail. */
  | 'forward'
  /** Runner that hops at `delayMs` close to the gap so landings are near-misses. */
  | 'nearMiss';

export interface BotOptions {
  delayMs?: number;
  tau?: number;
  /** Stop pressing on reaching this layer (to capture idle frames, e.g. 6 or 10). */
  stopAtLayer?: number;
}

/**
 * window.__lily — always installed (tiny). E2E tests drive the game only through this and real input.
 * Manual clock: when on, rAF does not advance the game; tests call frame(dtMs) to run exactly one render frame.
 */
export interface LilyHook {
  readonly version: 1;
  sim(): SimState | null;
  phase(): AppPhase;
  seed(): number;
  /** Full log of the current run. */
  events(): readonly SimEvent[];
  /** Merged into TUNING for the next run (and the current one, if restarted). */
  setTuning(patch: Partial<Tuning>): void;
  /** Start a fresh run now (title phase), optionally with a seed. */
  restart(seed?: number): void;
  manualClock(on: boolean): void;
  /** Advance one render frame of dtMs (manual clock). n repeats it. */
  frame(dtMs: number, n?: number): void;
  /** Same path as a key press. */
  press(slot: Slot): void;
  setBot(name: BotName | null, opts?: BotOptions): void;
  /** Pads currently on screen, in client px. */
  pads(): Array<{ id: number; kind: PadKind; layer: number; state: PadState; x: number; y: number; r: number }>;
  /** Real-time measurements (performance.now based), ms. */
  timings(): { restartToReadyMs: number | null; resultToReadyMs: number | null; lastFrameMs: number; lastSimStepMs: number };
  settings(): Settings;
}

declare global {
  interface Window {
    __lily?: LilyHook;
  }
}
