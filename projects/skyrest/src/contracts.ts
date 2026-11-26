// src/contracts.ts — FROZEN at wave 0 (M-0004 WO-001). Changing anything here is a CEO decision.
//
// Coordinates: Y up, metres. The arena island's top is the plane y = 0, centred on the origin.
// North = -z, east = +x. The camera sits south of the hero (+z) looking roughly north, so the
// temple isle (far, toward +x/-z) is upper right. The arena top is gently domed: world/ground.ts.
// Facing angles are radians around +y; facing 0 looks north (-z), PI/2 east (+x)  (dir = (sin f, -cos f)).
// The camera's yaw uses the SAME convention (experience.md §4.3 "base yaw −14°" = facing +14°: looks NE).
// Hero HP is counted in HALF-hearts. Sim time is in 60 Hz steps ("frames"); spec ms → Math.round(ms * 0.06).
//
// Layering rule: everything the sim touches (SimState, Intent, SimEvent, src/core/*, src/*/sim.ts,
// src/hero/combat.ts, src/tuning/*) is plain data + pure functions: no three, no DOM, runs in node.
// tests/unit/purity.test.ts enforces it.

import type * as THREE from 'three';

// ───────────────────────────── math ─────────────────────────────
/** A point/vector on the ground plane. */
export interface Vec2 { x: number; z: number }

// ───────────────────────────── input ────────────────────────────
/** One fixed step's worth of player intent, unified over keyboard, mouse, touch, gamepad and test scripts. */
export interface Intent {
  /** Stick in SCREEN space, each in [-1, 1], magnitude ≤ 1. moveY +1 = away from the camera. */
  moveX: number;
  moveY: number;
  /** Camera ground-forward facing angle when sampled (CameraRig.yaw); the sim rotates the stick by it. */
  camYaw: number;
  /** Edges: true on exactly one sim step per press (latched by the InputManager until sampled). */
  attack: boolean;
  dodge: boolean;
  /** Skill "Gale Crescent". */
  skill: boolean;
  pause: boolean;
  /** Menu confirm / start / retry (Enter, tap, gamepad A on menus). */
  confirm: boolean;
}
export type InputDevice = 'keyboard' | 'mouse' | 'touch' | 'gamepad' | 'script';

export interface InputManager {
  /** Writes the merged intent for ONE sim step into `into` (no allocation) and clears latched edges. */
  sample(into: Intent): void;
  /** Device of the most recent real input; the UI shows touch controls when 'touch'. */
  readonly lastDevice: InputDevice;
  /** Script override used by test hooks: `frames` steps of this intent take precedence over devices. */
  script(intent: Partial<Intent>, frames: number): void;
  /** Frames of scripted input still queued. */
  readonly scriptedFrames: number;
  setTouchControlsVisible(visible: boolean): void;
  dispose(): void;
}
export type CreateInput = (root: HTMLElement, bus: EventBus) => InputManager;

// ───────────────────────────── sim state ────────────────────────
export type Phase = 'title' | 'intro' | 'fight' | 'victory' | 'defeat';

export type HeroAction =
  | 'idle' | 'run' | 'attack1' | 'attack2' | 'attack3' | 'skill' | 'dodge' | 'hurt' | 'dead' | 'victory';

export interface HeroState {
  pos: Vec2;
  /** Position at the start of the current step, for render interpolation. */
  prevPos: Vec2;
  vel: Vec2;
  facing: number;
  prevFacing: number;
  action: HeroAction;
  /** Steps since `action` began. */
  actionFrame: number;
  /** Steps of buffered attack/dodge input remaining (input buffering). */
  attackBuffer: number;
  dodgeBuffer: number;
  hp: number;
  maxHp: number;
  /** Invulnerability steps remaining (dodge i-frames, post-hurt grace). */
  iframes: number;
  /** Distance travelled; the view drives the run cycle from it. */
  stride: number;
  /** Targets already hit by the current swing: bit 0 = golem, bit 1+i = minion i. Cleared on each new swing. */
  swingHits: number;
  /** Steps until the skill is ready (0 = ready). */
  skillCooldown: number;
  /** Slice-private numeric scratch (keys owned by WO-003, fixed at creation so steps don't allocate). */
  ext: Record<string, number>;
}

export type GolemAttack = 'slam' | 'sweep' | 'toss' | 'doubleSlam';
export type GolemAction =
  | 'dormant' | 'wake' | 'idle' | 'walk'
  | 'windup' | 'strike' | 'recover'
  | 'stagger' | 'dying' | 'dead';

export interface GolemState {
  pos: Vec2;
  prevPos: Vec2;
  facing: number;
  prevFacing: number;
  action: GolemAction;
  actionFrame: number;
  /** Which attack the current windup/strike/recover belongs to. */
  attack: GolemAttack | null;
  hp: number;
  maxHp: number;
  /** Poise: hero hits subtract; at ≤ 0 the golem staggers and poise refills. */
  poise: number;
  maxPoise: number;
  /** 0..1 rune/eye glow the view reads (AI raises it on windup/enrage). */
  glow: number;
  /** Steps of white hit-flash remaining (set by hero combat). */
  hitFlash: number;
  cooldown: number;
  /** Hits taken this fight (AI pattern input). */
  hitsTaken: number;
  /** Phase 2 ("The Guardian kindles"): hotter runes, faster attacks, double slam, minions. */
  enraged: boolean;
  /** Ground target of the current attack (slam centre, toss landing). */
  target: Vec2;
  /** Slice-private numeric scratch (keys owned by WO-004). */
  ext: Record<string, number>;
}

export type MinionAction = 'inactive' | 'spawn' | 'chase' | 'windup' | 'strike' | 'hurt' | 'dead';
export interface MinionState {
  id: number;
  pos: Vec2;
  prevPos: Vec2;
  facing: number;
  prevFacing: number;
  action: MinionAction;
  actionFrame: number;
  hp: number;
  hitFlash: number;
  ext: Record<string, number>;
}

/** Timed ground hazards spawned by golem attacks (slam shockwave ring, toss landing). Fixed pool. */
export interface HazardState {
  active: boolean;
  kind: 'shockwave' | 'boulder';
  pos: Vec2;
  /** Steps since spawn / total life in steps. */
  age: number;
  frames: number;
  /** Ring radius grows r0 → r1 over life; `band` = ring thickness that hurts (0 = filled disc). */
  r0: number;
  r1: number;
  band: number;
  damage: number;
  /** Already damaged the hero (one hit per hazard). */
  spent: boolean;
}
/** The whole deterministic world. Plain JSON data: snapshot = structuredClone(state).
 *  Views must re-read state.hero / state.golem / state.minions every frame: a retry replaces those objects. */
export interface SimState {
  seed: number;
  /** mulberry32 state word; only src/core/rng.ts touches it. */
  rng: number;
  /** Fixed steps since createSim (60 per second). */
  frame: number;
  phase: Phase;
  phaseFrame: number;
  /** Steps of hit-stop remaining: while > 0 entities freeze; frame/phaseFrame still advance. */
  hitstop: number;
  wave: number;
  coins: number;
  /** Steps spent in 'fight' this wave (victory card time). */
  fightFrames: number;
  /** Wall-clock time scale the game loop applies (perfect dodge 0.5, death 0.35); 1 = normal.
   *  Pure presentation pacing: the sim result per step never depends on it. */
  timeScale: number;
  /** Steps left before timeScale returns to 1. */
  timeScaleFrames: number;
  hero: HeroState;
  golem: GolemState;
  /** Fixed pool (length = ARENA.minionPool); unused entries are 'inactive'. */
  minions: MinionState[];
  /** Fixed pool (length = ARENA.hazardPool). */
  hazards: HazardState[];
  /** Events emitted during the LAST step (cleared at the start of each step). */
  events: SimEvent[];
  /** Test/debug flags; never set by gameplay. */
  flags: SimFlags;
}

export interface SimFlags {
  heroInvulnerable: boolean;
  /** Golem never attacks or walks (still wakes, staggers, dies). */
  golemPassive: boolean;
  /** -1 = roll normally, 0 = never crit, 1 = always crit (frame table F2/F4). */
  forceCrit: number;
  /** > 0: every hero hit deals exactly this (frame table F2 "2,368"). */
  forceDamage: number;
}

// ───────────────────────────── events ───────────────────────────
export type Combatant = 'hero' | 'golem' | 'minion';
export type AttackKind = 'combo1' | 'combo2' | 'combo3' | 'skill' | GolemAttack | 'shockwave' | 'minion';

export type SimEvent =
  | { type: 'phase'; phase: Phase; prev: Phase }
  | { type: 'swing'; combo: 1 | 2 | 3; pos: Vec2; facing: number }
  | { type: 'dodge'; pos: Vec2; facing: number }
  | { type: 'perfectDodge'; pos: Vec2 }
  | { type: 'skill'; pos: Vec2; facing: number }
  | { type: 'skillReady' }
  | { type: 'footstep'; who: Combatant; pos: Vec2 }
  | {
      type: 'hit'; attacker: Combatant; target: Combatant; targetId: number;
      amount: number; crit: boolean; kind: AttackKind; pos: Vec2; y: number;
    }
  /** Decal shape: circle (arcDeg 360) or arc around `facing`; fills to 100 % exactly `frames` steps later. */
  | { type: 'telegraph'; attack: GolemAttack; pos: Vec2; radius: number; facing: number; arcDeg: number; frames: number }
  | { type: 'impact'; attack: GolemAttack; pos: Vec2; radius: number }
  | { type: 'toss'; from: Vec2; to: Vec2; frames: number }
  | { type: 'enrage' }
  | { type: 'spawn'; target: Combatant; targetId: number; pos: Vec2 }
  | { type: 'stagger'; target: Combatant; targetId: number }
  | { type: 'wake' }
  | { type: 'death'; target: Combatant; targetId: number; pos: Vec2 }
  | { type: 'coins'; amount: number; pos: Vec2 };

export type SimEventType = SimEvent['type'];
export type SimEventOf<T extends SimEventType> = Extract<SimEvent, { type: T }>;

/** Synchronous pub/sub. The game drains state.events to the bus after every sim step. */
export interface EventBus {
  on<T extends SimEventType>(type: T, fn: (e: SimEventOf<T>) => void): () => void;
  onAny(fn: (e: SimEvent) => void): () => void;
  emit(e: SimEvent): void;
}

// ───────────────────────────── sim functions ────────────────────
/** A sim subsystem: mutates state for one fixed step. Pure (no DOM/three), allocation-free in steady state. */
export type SimSystem = (s: SimState, intent: Readonly<Intent>) => void;

// ───────────────────────────── settings ─────────────────────────
/** Effective render tier. */
export type Quality = 'low' | 'high';
/** What the player picks; 'auto' starts Low on touch devices and may downgrade (never upgrade) mid-fight. */
export type QualitySetting = 'auto' | Quality;
export interface Settings {
  /** 0..1 master volume (0 = muted; the pause menu's SOUND toggles 0 ↔ last). */
  volume: number;
  /** 0..1 music volume. */
  music: number;
  quality: QualitySetting;
  /** Defaults on under prefers-reduced-motion (also disables slow-mo and FOV punch). */
  reduceShake: boolean;
  /** Disables the red hurt vignette and other flashes. */
  reduceFlash: boolean;
  /** Show draw calls / tris / fps overlay. */
  showStats: boolean;
}
export interface SettingsStore {
  get(): Readonly<Settings>;
  set(patch: Partial<Settings>): void;
  subscribe(fn: (s: Readonly<Settings>) => void): () => void;
}

// ───────────────────────────── render side ──────────────────────
export interface FrameInfo {
  state: Readonly<SimState>;
  /** Interpolation factor between prev* and current entity transforms, [0, 1]. */
  alpha: number;
  /** Real seconds since last rendered frame, clamped to [0, 0.1]; 0 while paused. */
  dt: number;
  /** Seconds of ambient time (sway, clouds, water); stops while paused. */
  time: number;
  paused: boolean;
}

export interface RenderStats { drawCalls: number; triangles: number; geometries: number; textures: number; fps: number }

export interface ScreenBox {
  /** CSS-pixel bbox of the object's projected world AABB, clipped to the viewport. */
  x: number; y: number; w: number; h: number;
  /** Fraction of viewport height the box spans (h / viewportHeight). */
  hFrac: number;
  /** Centre in normalised viewport coords, 0..1 (0,0 = top-left). */
  cx: number; cy: number;
  visible: boolean;
}
/** Named Object3Ds for the screen-space probe (L-0006). Required names: hero, golem, temple, bridge, arena. */
export interface ProbeRegistry {
  register(name: string, obj: THREE.Object3D): void;
  measure(camera: THREE.Camera, width: number, height: number): Record<string, ScreenBox>;
}

export interface RendererHandle {
  readonly renderer: THREE.WebGLRenderer;
  /** Effective tier now (auto may have downgraded it); the game forwards changes to every View. */
  readonly quality: Quality;
  /** Renders scene through post (bloom/grade on 'high'); counts stats across all passes; runs auto-downgrade. */
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  resize(width: number, height: number): void;
  setQuality(q: QualitySetting): void;
  stats(): RenderStats;
  dispose(): void;
}
export type CreateRenderer = (canvas: HTMLCanvasElement, settings: Readonly<Settings>) => RendererHandle;

export interface RenderContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: RendererHandle;
  settings: SettingsStore;
  bus: EventBus;
  probe: ProbeRegistry;
  /** DOM overlay above the canvas for world-anchored UI (damage numbers, boss name). */
  overlay: HTMLElement;
}

/** Every render-side module. init is called once, update once per rendered frame. Hot path: no allocation.
 *  Feet stand on world/ground.ts groundHeight(x, z), never on y = 0. */
export interface View {
  init(ctx: RenderContext): void;
  update(f: FrameInfo): void;
  setQuality(q: Quality): void;
  dispose(): void;
}

export interface WorldView extends View {
  /** Key light; hero/golem views do not create their own sun. */
  readonly sun: THREE.DirectionalLight;
}
export type CreateWorldView = () => WorldView;

export interface CameraRig extends View {
  /** Current ground-forward facing angle (contracts header convention); sampled into Intent.camYaw. */
  readonly yaw: number;
  /** Positional kick (camera punch) in world units along (dirX, dirZ); scaled down by reduceShake. */
  kick(strength: number, dirX: number, dirZ: number): void;
  /** Trauma-style shake, amplitude 0..1, decays over `seconds`; disabled by reduceShake. */
  shake(amplitude: number, seconds: number): void;
  /** Snap to the canonical framing (title → fight, tests). */
  snap(): void;
}
export type CreateCameraRig = () => CameraRig;

export type CreateHeroView = () => View;
export type CreateGolemView = () => View;
export type CreateMinionsView = () => View;
/** Hit FX: slash trails, sparks, chips, dust (incl. golem impact/crumble dust), damage numbers. Listens on the bus.
 *  Golem-specific geometry (telegraph decals, shockwave ring meshes, crumble boulders, coin fountain) is the golem view's. */
export type CreateFx = (rig: CameraRig) => View;

// ───────────────────────────── UI / HUD ─────────────────────────
/** What menus may ask of the game. */
export interface GameControl {
  start(): void;
  retry(): void;
  /** Back to the title (coins kept). Added by CEO decision in wave 1 (WO-004). */
  toTitle(): void;
  setPaused(paused: boolean): void;
  readonly paused: boolean;
  readonly settings: SettingsStore;
  readonly audio: AudioEngine;
}
export interface Ui {
  init(root: HTMLElement, ctx: RenderContext, control: GameControl): void;
  update(f: FrameInfo): void;
  dispose(): void;
}
export type CreateUi = () => Ui;

// ───────────────────────────── audio ────────────────────────────
export type SfxId =
  | 'swing1' | 'swing2' | 'swing3' | 'hit' | 'crit' | 'dodge' | 'perfectDodge' | 'skill' | 'skillReady'
  | 'footstep' | 'heroHurt' | 'heroFall'
  | 'golemWake' | 'golemWindup' | 'golemSlam' | 'golemSweep' | 'golemToss' | 'boulderLand' | 'shockwave'
  | 'golemStep' | 'golemHurt' | 'golemStagger' | 'golemRoar' | 'golemCrumble'
  | 'minionSpawn' | 'minionHit' | 'coin' | 'uiClick' | 'uiOpen' | 'uiBack' | 'hint' | 'victory' | 'defeat';
export type MusicState = 'off' | 'title' | 'fight' | 'victory';

export interface AudioEngine {
  /** Must be called from a user gesture (iOS Safari). Safe to call repeatedly. */
  unlock(): Promise<void>;
  readonly unlocked: boolean;
  play(id: SfxId, opts?: { gain?: number; pitch?: number; pan?: number }): void;
  setMusic(state: MusicState): void;
  setVolume(volume: number, music: number): void;
  /** Pause freezes audio too (music fades back over 200 ms on resume). */
  setPaused(paused: boolean): void;
  /** Ids played since boot, newest last, bounded to 64 (tests assert sound fired without hearing it). */
  readonly log: readonly SfxId[];
  dispose(): void;
}
/** Builds the synth engine and subscribes it to sim events on the bus (every SFX mapping lives in audio/). */
export type CreateAudio = (bus: EventBus, settings: SettingsStore) => AudioEngine;

// ───────────────────────────── test hooks ───────────────────────
/** window.__skyrest — the only test surface. Implemented in src/app/hooks.ts. */
export interface SkyrestHooks {
  readonly ready: boolean;
  readonly version: string;
  snapshot(): SimState;
  /** Restart the sim from this seed (phase 'title' unless skipTitle follows). */
  setSeed(seed: number): void;
  /** Jump straight to phase 'fight' with the canonical camera snapped. */
  skipTitle(): void;
  /** Queue `frames` sim steps of scripted intent (default 1). */
  inject(intent: Partial<Intent>, frames?: number): void;
  /** Stop the real-time clock: the sim only advances through step(). */
  setManual(manual: boolean): void;
  /** Advance exactly n fixed steps synchronously, then render once. Returns the frame number. */
  step(n: number): number;
  /** Render one frame now (alpha = 1). */
  render(): void;
  stats(): RenderStats;
  /** Screen-space boxes of registered objects for the current camera. */
  probe(): Record<string, ScreenBox>;
  setQuality(q: QualitySetting): void;
  setFlags(flags: Partial<SimFlags>): void;
  /** Last ≤ 256 events, oldest first. */
  events(): SimEvent[];
  sfx(): readonly SfxId[];
  /** Seeded, deterministic setup of a frame-table moment (experience.md §11): resets the sim, scripts
   *  inputs/flags, steps to the capture instant, renders. The spec then just screenshots. */
  moment(id: MomentId): MomentResult;
}

export type MomentId = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12' | 'F13';
export interface MomentResult { id: MomentId; frame: number; phase: Phase; ok: boolean; note: string }

/** What a moment script may do (all synchronous; the clock is manual while it runs). */
export interface MomentApi {
  setSeed(seed: number): void;
  skipTitle(): void;
  setFlags(flags: Partial<SimFlags>): void;
  inject(intent: Partial<Intent>, frames?: number): void;
  step(n: number): void;
  /** Step until pred is true (max `limit` steps); returns whether it became true. */
  stepUntil(pred: (s: Readonly<SimState>) => boolean, limit: number): boolean;
  state(): SimState;
  control: GameControl;
}
/** A moment script; returns a short note for the evidence log. */
export type MomentScript = (api: MomentApi) => string;

declare global {
  interface Window { __skyrest?: SkyrestHooks }
}
