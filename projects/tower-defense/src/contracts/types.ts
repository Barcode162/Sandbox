// Inkfold — FROZEN CONTRACTS (M-0002 WO-001). Changing anything here is a CEO decision.
// Spec: bureau/missions/M-0002-tower-defense-vertical-slice/design/experience.md (cited as §n).
// Units: logical px on the 1280×720 canvas; data in seconds of sim time at 1×; the sim works in ticks (60/s).

// ───────────────────────────── primitives ─────────────────────────────
export type Vec2 = { readonly x: number; readonly y: number };
export interface Circle { readonly x: number; readonly y: number; readonly r: number; readonly name: string }
export interface Rect { readonly x: number; readonly y: number; readonly w: number; readonly h: number }

export const SIM_HZ = 60;
export const TICK_S = 1 / SIM_HZ;

// ───────────────────────────── blots (§6) ─────────────────────────────
export type BlotKind = 'dot' | 'drop' | 'splat' | 'splash' | 'blotch' | 'streak' | 'wax' | 'knot' | 'inkmaw';
/** Render shape family; the colourblind signal (§6, §15). */
export type BlotShape = 'disc' | 'lobed' | 'comet' | 'hexagon' | 'scribble' | 'maw';
export type DamageType = 'cut' | 'crush' | 'wash' | 'glare';

export interface BlotChildSpec { readonly kind: BlotKind; readonly count: number }
export interface BlotDef {
  readonly kind: BlotKind;
  readonly name: string;
  readonly shape: BlotShape;
  /** Lobe count n for radius(θ)=R(1+0.14 sin(nθ+φ)); 0 for non-lobed shapes. */
  readonly lobes: number;
  /** Pips drawn = layers remaining (chain kinds only; 0 otherwise). */
  readonly pips: number;
  readonly radius: number;
  /** px per second of sim time. */
  readonly speed: number;
  readonly hp: number;
  readonly children: readonly BlotChildSpec[];
  /** Sheets paid per HP removed from this blot (Inkmaw 0). */
  readonly sheetsPerHp: number;
  /** Red-blot-equivalent: hp + Σ children RBE. Lives cost on leak (§6 rule 4). */
  readonly rbe: number;
  readonly firstRound: number;
  /** Palette token name (see data/palette.ts) for fill. */
  readonly color: string;
  readonly immuneTo: readonly DamageType[];
  /** May carry the Pale modifier (Drop–Blotch, Streak). */
  readonly paleEligible: boolean;
  /** Pop SFX pitch in Hz (§12). 0 = no pop note (Inkmaw uses its own cues). */
  readonly popHz: number;
  readonly boss: boolean;
  /** Boss only: HP fractions where it sheds (0.75/0.5/0.25) and what it sheds. */
  readonly shedAt: readonly number[];
  readonly shed: BlotChildSpec | null;
}

/** Live blot in the sim pool. Fields are written only by the sim; renderers read. */
export interface Blot {
  id: number;
  /** False once popped/leaked; the core compacts dead blots at the end of each tick (indices are stable within a tick). */
  alive: boolean;
  kind: BlotKind;
  hp: number;
  /** Path distance (px) this tick and the previous tick (render interpolates). */
  s: number;
  ps: number;
  x: number;
  y: number;
  pale: boolean;
  /** Active slow fraction 0..1 and remaining ticks (strongest wins, refreshes; §7 Koi). */
  slow: number;
  slowTicks: number;
  frozenTicks: number;
  stunTicks: number;
  /** Id of the projectile/pulse that spawned this child: it cannot hit it (§6 rule 2). 0 = none. */
  immuneTo: number;
  spawnTick: number;
  /** 0 if spawned from a wave group; otherwise the parent's blot id (render squash, §11 Pop). */
  parentId: number;
  /** Boss: index into shedAt of the next threshold to fire. */
  nextShed: number;
}

// ───────────────────────────── towers (§7) ─────────────────────────────
export type TowerKind = 'tern' | 'frog' | 'koi' | 'owl';
export type TargetMode = 'first' | 'last' | 'strong' | 'close';
export type UpgradePath = 0 | 1; // 0 = A, 1 = B
export type AttackKind = 'quill' | 'lance' | 'stone' | 'pulse' | 'jets' | 'beam';

/**
 * Fully resolved stats for a (kind, tiers) pair. Tier effects (data/towers.ts) patch this record
 * in the order A1,A2,A3,B1,B2,B3: `set` overrides, `add` adds (§7 Crosspath rule).
 */
export interface TowerStats {
  attack: AttackKind;
  range: number;
  interval: number; // seconds
  damage: number;
  pierce: number; // blots one projectile/beam may hit
  damageType: DamageType;
  detect: boolean;
  /** Damage multiplier against specific kinds (lance ×3 vs Wax/Knot, Eclipse ×2 vs Knot/Inkmaw). */
  multVs: Partial<Record<BlotKind, number>>;
  // projectiles (Tern quill/lance, jets)
  projectileSpeed: number; // px/s
  projectileLifeMul: number; // travels range × this, then expires
  spreadDeg: readonly number[]; // one projectile per entry, offsets from aim angle
  // stones (Frog)
  arcTime: number; // s
  splashRadius: number;
  splashMax: number;
  stun: number; // s; never on Knot/Inkmaw
  skips: number;
  skipDistance: number;
  skipRadius: number;
  skipMax: number;
  // pulse (Koi)
  pulseMax: number;
  slowPct: number; // 0..1
  slowDur: number; // s
  freezeEvery: number; // 0 = never; else every Nth pulse freezes
  freezeDur: number; // s
  frozenCrushBonus: number;
  frostDecalRadius: number; // 0 = none
  // jets (Typhoon)
  jetCount: number;
  jetRotateDeg: number;
  jetPierce: number;
  jetRange: number;
  // beam (Owl)
  beamToMaxRange: boolean;
  beamAfterimageMs: number;
  // aura (Owl B path) — best aura wins, never stacks (§7)
  auraRadius: number; // 0 = no aura
  auraDetect: boolean;
  auraIntervalMul: number; // 1 = none
  auraDamageAdd: number;
  auraStripPale: boolean;
  /** Area-class attacks hit Pale regardless of detection (§6 Pale). */
  areaClass: boolean;
}
export type NumericStatKey = { [K in keyof TowerStats]: TowerStats[K] extends number ? K : never }[keyof TowerStats];

export interface TierEffect {
  readonly set?: Partial<TowerStats>;
  readonly add?: Partial<Record<NumericStatKey, number>>;
}
export interface TierDef {
  readonly path: UpgradePath;
  readonly tier: 1 | 2 | 3;
  readonly name: string;
  readonly cost: number;
  /** One effect line for the tier box (§10.4), ≤ 22 chars. */
  readonly effectLine: string;
  readonly effect: TierEffect;
  /** Spec visual change, verbatim intent for the sprite engineer (§7). */
  readonly visual: string;
}
export interface TowerDef {
  readonly kind: TowerKind;
  readonly name: string;
  readonly hotkey: '1' | '2' | '3' | '4';
  readonly cost: number;
  readonly footprint: number; // fr (§5)
  readonly base: Readonly<TowerStats>;
  /** paths[0] = A tiers 1..3, paths[1] = B tiers 1..3. */
  readonly paths: readonly [readonly [TierDef, TierDef, TierDef], readonly [TierDef, TierDef, TierDef]];
  readonly hasTargeting: boolean; // Koi: false
  readonly blurb: string; // §14 card hover blurb
  readonly turnRateDeg: number; // 720°/s for turning towers; 0 = does not turn
}

/** Live tower. Written only by the sim. */
export interface Tower {
  id: number; // 1-based placement order, never reused within a run (scripts refer to T1, T2…)
  kind: TowerKind;
  x: number;
  y: number;
  tiers: [number, number]; // [A, B], each 0..3; valid iff max ≤ 3 && min ≤ 1
  target: TargetMode;
  angle: number; // radians, current facing
  pangle: number; // previous tick facing (render interpolation)
  cooldown: number; // seconds until next shot; starts 0 (§7)
  stats: TowerStats; // resolved for current tiers, before aura buffs
  /** Aura buffs from the best covering Owl (recomputed by the sim). */
  buffDetect: boolean;
  buffIntervalMul: number;
  buffDamageAdd: number;
  spent: number; // total sheets spent (base + tiers)
  placedRound: number; // round number during whose intermission/round it was placed
  /** True while 100 % refund applies (placed in the current intermission, §8). */
  fresh: boolean;
  pops: number; // HP removed by this tower (Best defender, §10.10)
  shots: number; // volleys fired (pulse counter for freezeEvery, jet phase)
  lastFireTick: number;
  targetId: number; // blot id aimed at, 0 = none
}

export type ProjectileKind = 'quill' | 'lance' | 'stone' | 'jet';
/** Pooled projectile. Owned by the tower systems (src/sim/towers). */
export interface Projectile {
  id: number;
  kind: ProjectileKind;
  towerId: number;
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number; // px per tick
  vy: number;
  angle: number;
  damage: number;
  damageType: DamageType;
  pierceLeft: number;
  travelled: number;
  maxTravel: number;
  detect: boolean;
  areaClass: boolean;
  multVs: Partial<Record<BlotKind, number>>;
  slowPct: number;
  slowDur: number;
  /** Blot ids already hit (no double hits); first `hitCount` entries are valid. */
  hitIds: Int32Array; // length 16
  hitCount: number;
  // stone arcs (Frog)
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t: number; // 0..1 arc progress
  arcTicks: number;
  splashRadius: number;
  splashMax: number;
  stun: number;
  skipsLeft: number;
}

// ───────────────────────────── waves & economy (§8) ─────────────────────────────
export interface WaveGroup {
  readonly kind: BlotKind;
  readonly count: number;
  readonly spacing: number; // s between spawns
  readonly delay: number; // s from round start
  readonly pale: boolean;
}
export interface RoundDef {
  readonly round: number;
  readonly groups: readonly WaveGroup[];
  /** Spec column RBE (chain + specials; R20 excludes the boss). Tested against the groups. */
  readonly rbe: number;
  /** Spec column cash at start with zero leaks. Tested against economy. */
  readonly cashAtStart: number;
  readonly note: string;
}
export interface EconomyDef {
  readonly startMoney: number;
  readonly startLives: number;
  readonly bonusBase: number;
  readonly bonusPerRound: number; // bonus = base + perRound·r, paid on clear
  readonly sellRate: number;
  readonly freshRefundRate: number;
  readonly autoStartDelay: number; // s after the bonus
  readonly rounds: number;
}

// ───────────────────────────── sim API ─────────────────────────────
export type Phase = 'intermission' | 'round' | 'victory' | 'defeat';

/** Dense pool: live items are items[0..count). Removal is swap-remove; objects are reused. */
export interface Pool<T> { readonly items: T[]; count: number }

export interface SimStats {
  pops: number; // total HP removed ("blots torn")
  leaked: number;
  spent: number;
  earned: number;
}

export interface BossView { blotId: number; hp: number; maxHp: number; nextShed: number }

export interface SimState {
  readonly seed: number;
  tick: number;
  /** Round in progress, or the round whose intermission precedes it (1 before R1 starts). */
  round: number;
  phase: Phase;
  lives: number;
  money: number;
  autoStart: boolean;
  /** Ticks of deterministic hit-stop remaining (§11). World is frozen while > 0. */
  hitStop: number;
  roundTick: number; // ticks since the current round started
  blots: Pool<Blot>;
  towers: Tower[]; // placement order
  projectiles: Pool<Projectile>;
  boss: BossView | null;
  stats: SimStats;
  /** Kinds already seen this run (first-encounter banners, §14). */
  seen: Partial<Record<BlotKind, true>>;
}

export type Command =
  | { readonly type: 'place'; readonly kind: TowerKind; readonly x: number; readonly y: number }
  | { readonly type: 'upgrade'; readonly towerId: number; readonly path: UpgradePath }
  | { readonly type: 'sell'; readonly towerId: number }
  | { readonly type: 'target'; readonly towerId: number; readonly mode: TargetMode }
  | { readonly type: 'startRound' }
  | { readonly type: 'autoStart'; readonly on: boolean };

export type PlaceFail = 'path' | 'bounds' | 'tower' | 'noBuild' | 'money' | 'phase';
export type CommandFail = PlaceFail | 'noTower' | 'sealed' | 'maxTier' | 'busy';

export type SimEvent =
  | { type: 'roundStart'; round: number }
  | { type: 'roundClear'; round: number; bonus: number }
  | { type: 'firstSeen'; kind: BlotKind; pale: boolean }
  | { type: 'spawn'; blotId: number; kind: BlotKind; parentId: number; x: number; y: number }
  | { type: 'pop'; blotId: number; kind: BlotKind; x: number; y: number; towerId: number; pale: boolean }
  | { type: 'hit'; blotId: number; kind: BlotKind; x: number; y: number; dirX: number; dirY: number }
  | { type: 'immune'; blotId: number; x: number; y: number }
  | { type: 'leak'; blotId: number; kind: BlotKind; livesLost: number }
  | { type: 'money'; delta: number; reason: 'pop' | 'bonus' | 'spend' | 'refund' }
  | { type: 'place'; towerId: number; kind: TowerKind; x: number; y: number; cost: number }
  | { type: 'upgrade'; towerId: number; path: UpgradePath; tier: number; cost: number }
  | { type: 'sell'; towerId: number; kind: TowerKind; x: number; y: number; refund: number }
  | { type: 'target'; towerId: number; mode: TargetMode }
  | { type: 'rejected'; command: Command['type']; reason: CommandFail }
  | { type: 'fire'; towerId: number; kind: TowerKind; attack: AttackKind; x: number; y: number; angle: number }
  | { type: 'land'; projectileId: number; towerId: number; x: number; y: number; radius: number; skip: boolean; stun: boolean }
  | { type: 'pulse'; towerId: number; x: number; y: number; radius: number; freeze: boolean }
  | { type: 'beam'; towerId: number; x1: number; y1: number; x2: number; y2: number; eclipse: boolean }
  | { type: 'bossWarning' }
  | { type: 'bossArrive'; blotId: number; maxHp: number }
  | { type: 'bossShed'; blotId: number; threshold: number; x: number; y: number }
  | { type: 'bossDeath'; x: number; y: number }
  | { type: 'hitStop'; ticks: number }
  | { type: 'victory'; lives: number; pops: number; bestTowerId: number }
  | { type: 'defeat'; round: number; pops: number };

export interface SimOptions {
  seed: number;
  /** Defaults from data/economy.ts. Attract mode (§10.1) overrides these. */
  startMoney?: number;
  startLives?: number;
  startRound?: number;
  /** Attract mode: when the round clears, replay the same round forever; lives never drop. */
  loopRound?: boolean;
}

export interface Sim {
  readonly state: Readonly<SimState>;
  /** Queue a command; it is applied at the start of the next step() (§11 click → next tick). */
  enqueue(cmd: Command): void;
  /** Advance exactly one tick (1/60 s). Clears and refills `events`. */
  step(): void;
  /** Events emitted by the last step(); valid until the next step(). */
  readonly events: readonly SimEvent[];
}

/** Round-keyed input script: commands issued during the intermission before round r. */
export type RoundScript = Readonly<Record<number, readonly Command[]>>;

export interface RunSummary {
  outcome: 'victory' | 'defeat' | 'running';
  round: number;
  tick: number;
  lives: number;
  money: number;
  pops: number;
  hash: string; // stateHash(), FNV-1a hex
}

// ───────────────────────────── app, render, audio ─────────────────────────────
export type SceneId = 'boot' | 'title' | 'play' | 'paused' | 'settings' | 'gameover' | 'victory';
export type Speed = 1 | 2;

export interface Settings {
  music: number; // 0..100, default 60
  sfx: number; // 0..100, default 80
  shake: number; // 0..100 %, default 100
  reduceMotion: boolean;
  colourblind: boolean;
  autoStart: boolean;
  muted: boolean;
}
export interface SettingsStore {
  get(): Readonly<Settings>;
  set(patch: Partial<Settings>): void;
  subscribe(fn: (s: Readonly<Settings>) => void): () => void;
}

/** Everything a world layer needs to draw one render frame. */
export interface RenderFrame {
  readonly ctx: CanvasRenderingContext2D;
  readonly state: Readonly<SimState>;
  /** Interpolation 0..1 between the previous and current tick. */
  readonly alpha: number;
  /** Real time (ms) — visual timers run on real time so 2× stays readable (§11 Speed). */
  readonly nowMs: number;
  readonly dtMs: number;
  readonly settings: Readonly<Settings>;
}
/** Draw order (§10.5): path → decals → blots → projectiles → towers → particles → rings → text → HUD. */
export type DrawPass = 'decals' | 'blots' | 'projectiles' | 'towers' | 'particles' | 'rings';
export interface WorldLayer {
  onSimEvent(e: SimEvent, state: Readonly<SimState>): void;
  update(dtRealMs: number, state: Readonly<SimState>): void;
  draw(f: RenderFrame, pass: DrawPass): void;
  reset(): void;
}

/** Shared particle/ring system with the §10.5 caps (implemented in src/render/fx). */
export type FleckShape = 'tri' | 'circle';
export interface Fx {
  /** Pop ring: never culled (§16.5). */
  ring(x: number, y: number, r0: number, r1: number, color: string, durMs: number, delayMs?: number, width?: number): void;
  /** Requested flecks are reduced by the live-particle tiers (6 / 2 / 0) and Reduce motion ×0.5. */
  flecks(x: number, y: number, count: number, color: string, shape?: FleckShape): void;
  sparks(x: number, y: number, count: number): void;
  readonly liveParticles: number;
}

export type MusicState = 'silent' | 'title' | 'intermission' | 'round' | 'storm' | 'boss' | 'victory' | 'gameover';
export type UiSound = 'hover' | 'click' | 'invalid' | 'place' | 'upgrade1' | 'upgrade2' | 'upgrade3' | 'sell' | 'sealed' | 'sfxPreview';
export interface AudioEngine {
  /** Call from the first user gesture (autoplay policy). Safe to call repeatedly. */
  unlock(): void;
  onSimEvent(e: SimEvent): void;
  ui(s: UiSound): void;
  setMusic(state: MusicState): void;
  applySettings(s: Readonly<Settings>): void;
  /** Pause: lowpass 800 Hz, −6 dB (§10.7); resume restores within 160 ms. */
  setPaused(paused: boolean): void;
  /** Real-time tick for voice caps and the crackle window (§10.5). */
  update(nowMs: number): void;
}

// ───────────────────────────── test hook (window.__inkfold) ─────────────────────────────
/** Named capture states for §18 screenshots. */
export type StageId =
  | 'title-0' | 'title-800' | 'title-idle'
  | 'place-valid' | 'place-invalid' | 'place-done'
  | 'r1-8s'
  | `fold-${TowerKind}-${'0-0' | '3-1' | '1-3'}` | 'fold-sealed-hover'
  | 'r18-8s' | 'r18-8s-cb'
  | 'r20-warning' | 'r20-arrival' | 'r20-shed50' | 'r20-death'
  | 'pause' | 'settings-cb' | 'gameover' | 'victory'
  | 'blots-grid' | 'towers-sheet';

export interface PerfReport {
  blots: number;
  towers: number;
  projectiles: number;
  steps: number;
  meanStepMs: number;
  p95StepMs: number;
  maxStepMs: number;
  /** Board condition 3: budget ≤ 6 ms. */
  p99StepMs: number;
  heapStartMB: number | null;
  heapEndMB: number | null;
}

export interface InkfoldTestHook {
  readonly version: 1;
  ready(): boolean;
  scene(): SceneId;
  /** Console errors and uncaught exceptions seen by the app. */
  errors(): string[];
  summary(): RunSummary;
  /** Enqueue a command into the live game sim. */
  command(cmd: Command): void;
  /** Switch rAF to a manual clock; then advance(ms, frameHz) renders frames of 1000/frameHz ms. */
  useManualClock(): void;
  advance(ms: number, frameHz: number): void;
  /** Play a named script ('win' | 'loss') through the real app loop at the given render rate. */
  playScript(name: 'win' | 'loss', frameHz: number, maxRound?: number): RunSummary;
  /** Restart to a fresh R1; resolves the elapsed real ms. */
  restart(): number;
  stage(id: StageId): Promise<void>;
  perfProbe(steps: number): PerfReport;
}

declare global {
  interface Window { __inkfold?: InkfoldTestHook }
}
