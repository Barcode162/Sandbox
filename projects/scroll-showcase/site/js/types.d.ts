/**
 * Bent Light: FROZEN CONTRACTS (architecture.md §C1–C6, transcribed by WO-001).
 *
 * Source: bureau/missions/M-0001-scroll-showcase/design/architecture.md, "Contracts (frozen at the
 * end of wave 0)". §C1, §C3, §C4 and §C5 are copied verbatim. §C2 is a signature list in the
 * architecture; it is copied verbatim as a comment and then given typed module interfaces (Core*)
 * with the same names and arities. §C6 is prose and is copied as a doc comment. §C7 (DOM skeleton)
 * lives in site/index.html.
 *
 * Changing anything in §C1–C7 after wave 0 is a CEO decision, recorded in log.md.
 * Everything below the "WO-001 derived helpers" banner is NOT new contract: it only gives names to
 * types the contracts use implicitly (factory options, Announce, SafeStorage, global hooks), so that
 * `npm run typecheck` can check the C4 factories. Those helpers freeze with the contracts.
 *
 * Usage from a module: `/** @type {import('../types.js').SceneModule} *\/` (nodenext maps
 * `types.js` to this file).
 */

// ─────────────────────────────────────────────────────────────────────────────────────────────
// C1. Primitive data (all JSON-clean: finite numbers, no `-0`, no DOM refs)
// ─────────────────────────────────────────────────────────────────────────────────────────────

export type SceneId = 1 | 2 | 3 | 4 | 5 | 6;
export type Slug = 'incidence' | 'field' | 'refraction' | 'dichroic' | 'agreement' | 'return';
export type Bp = 375 | 768 | 1024 | 1440 | 1920;     // by vw: <768→375, <1024→768, <1440→1024, <1920→1440, else 1920

export interface Viewport {
  vw: number;        // documentElement.clientWidth (CSS px)
  sh: number;        // px height of a 100svh probe element (getBoundingClientRect().height)
  dpr: number;       // devicePixelRatio
  landscape: boolean;// vw / sh >= 1
  U: number;         // long axis px  = landscape ? vw : sh
  V: number;         // cross axis px = landscape ? sh : vw
  vmin: number;      // px per 1vmin = min(vw, sh) / 100
  bp: Bp;
  gutter: number;    // 16 | 24 | 32 | 40 | 48 by bp
  pitch: number;     // dot pitch 24 | 24 | 28 | 32 | 36 by bp (cut item 4: round(32·vw/1440) above 1440)
  lattice: number;   // always 2 * pitch (invariant, §11.1)
}

export interface SceneMeta {
  id: SceneId; slug: Slug; name: string;   // name: 'Incidence' …
  track: number;                           // svh: 220, 300, 260, 320, 220, 180
  hold: [number, number];                  // §3.1 signature hold band
  creep: string | null;                    // driving param that creeps in the hold (S6: null)
}

export interface Layout {
  vp: Viewport;
  Y: number[];   // 6 scene start offsets, px: Y[0] = 0, Y[s] = Σ L[<s]
  L: number[];   // 6 lengths, px: L[s] = track[s] * vp.sh / 100 (never dvh)
  D: number;     // Σ L
}

export interface BandRect { u0: number; u1: number; v0: number; v1: number; }   // px, u-edges snapped to device px
export interface DotGridState {
  pitch: number; originU: number; originV: number; r: number;   // r = 2.5
  vertexWhite: number; fillWhite: number; vertexInk: number; fillInk: number;  // opacities
}
export interface WhitePointState { u: number; v: number; r: number; alpha: number; }
export interface ShelfItem { kind: 'tri' | 'cir' | 'dia'; u: number; v: number; size: number; rot: number; } // px, deg
export interface BeamRect { centreU: number; width: number; v0: number; v1: number; color: string; } // '#FFFFFF'

export interface SeamGeom {                       // the §5.2 seam-gate fields; null when absent
  ground: 'wall' | 'bands' | 'cobalt' | 'mosaic' | 'ink';
  bandRects: BandRect[] | null;                   // length 7 when present
  dotGrid: DotGridState | null;
  whitePoint: WhitePointState | null;
  shelf: ShelfItem[] | null;                      // length 3 when present
  channelScales: [number, number, number] | null;
  glassAlpha: number;                             // 0 when no glass
  beamRect: BeamRect | null;
  otherOpacity: number;                           // max opacity of any visible element NOT described above (S1 p=1 ⇒ 0)
}

export interface SceneState {
  scene: SceneId;
  p: number;
  params: Record<string, number>;   // the §4 "Parameters" (driving parameters, §3.3), named exactly as in §4
  geom: SeamGeom;
  [derived: string]: unknown;       // scene-private derived data (JSON-clean)
}

export interface AmbientSample { a: number; t: number; }   // a ∈ [0,1] (ramp/decay/pause applied); t seconds

export interface StillPlan {          // §10.4
  base: 0 | 0.5 | 1;                  // still drawn at opacity 1
  over: 0.5 | 1 | null;               // still drawn on top
  overAlpha: number;                  // r(p,.17,.33) or r(p,.67,.83); 0 in still ranges
  pShown: 0 | 0.5 | 1;                // overAlpha > 0.5 ? over : base
}

export interface ErrorEntry {
  scene: SceneId | null;
  phase: 'boot' | 'mount' | 'state' | 'apply' | 'context' | 'engine' | 'admire' | 'chrome' | 'rewind';
  message: string;
  y: number;
}

/*
 * Parameter names are part of the contract. Each scene's `params` uses exactly the names in §4:
 * - S1: rot spread split titleOpacity cueOpacity s prismOpacity prismShift  (prismShift and split in px)
 * - S2: A c shear vertexInk fillInk white whitePoint fade
 * - S3: tri cir dia triRot diaRot  (positions in % of U, rotations in degrees)
 * - S4: J theta facetAlpha edgeAlpha quant bandsAlpha glassAlpha fillDots vertexDots rho wpAlpha
 * - S5: n tau hair ov
 * - S6: widen mix spot draw beam glass card
 * Derived geometry (wedge vertices, band widths, beam rects) goes under extra keys, e.g. `wedges`,
 * `widths` and `beams`.
 */

// ─────────────────────────────────────────────────────────────────────────────────────────────
// C2. Shared pure modules (signatures). Verbatim from the architecture:
// ─────────────────────────────────────────────────────────────────────────────────────────────
/*
// core/math.js — all pure
clamp(x, a, b); lerp(a, b, t); r(p, a, b);              // r = clamp((p−a)/(b−a), 0, 1)
smooth(t); glide(t); settle(t); lead(t); lin(t);         // §3.5: smoothstep, easeInOutCubic, easeOutCubic, easeOutQuad, identity
easeInOutSine(t); easeOutCubic(t);
keys(p, [[p0, v0], [p1, v1, ease?], …]);                 // ease applies to the segment ending at that key; default glide
mulberry32(seed): () => number;                          // [0,1)
SEED = 0xB3E7;
fin(x): number;                                          // normalises −0 → 0; throws on non-finite (engine catches)

// core/geometry.js — all pure
SCENES: readonly SceneMeta[];                            // §3.1 order, tracks, hold bands, creep names
COLOPHON_SVH = 70;
TICK_G: readonly number[];                               // [0, 220, 520, 780, 1100, 1320] / 1500
viewport(vw, sh, dpr): Viewport;
trackLayout(vp): Layout;
locate(y, layout): { scene: SceneId; p: number; G: number };   // y ∈ [Y_s, Y_s+L_s) → s; y ≥ D → scene 6, p 1; G = clamp(y/D)
snap(x, dpr): number;                                    // Math.round(x·dpr)/dpr
bandRects(vp): BandRect[];                               // 7 equal full-bleed bands over U×V, cumulative snapped edges
bandRectsFromWeights(w: number[], vp): BandRect[];       // normalised to U; edges = snap(cumulative)
dotGrid(vp): Pick<DotGridState,'pitch'|'originU'|'originV'|'r'>;  // a VERTEX dot lies exactly at (U/2, V/2); vertex pitch = lattice
shelf(vp): ShelfItem[];                                  // tri .25U, cir .50U, dia .75U; v = V/2; rot 0; sizes per §4 S3 (vmin), portrait per §11.1
beamW(vp): number;                                       // max(0.09·U, 32)
centre(vp): { u: number; v: number };                    // (U/2, V/2)

// core/reduced.js
stillPlan(p): StillPlan;

// core/phrases.js
placardPhrase(scene: SceneId, p: number): { index: number; text: string };   // §7.5 bands, [a,b) with last band closed
placardLabel(scene: SceneId, G: number): string;          // `04 · DICHROIC · HELD AT 62%`, Math.round(100·G)
admireAnnouncement(scene: SceneId, phrase: string, breathing: boolean): string;  // §7.7 exact text

// core/copy.js
COPY: { title, metaDescription, h1, subtitle, cue, skip, navLabel, sceneNames[6], captions[6], artLabels[6],
        pause: { on, paused, reduced }, status: {...}, rewind: {...}, contactSheet[3], colophon: {...}, noscript, errorChip };
sceneLabel(id: SceneId, short?: boolean): string;         // '03 · Refraction' | '03 Refraction'

// core/tokens.js
TOKENS: Record<string, { hex: string; rgb: [number, number, number]; Y: number }>;  // keys = CSS names without '--'
BANDS: readonly string[];                                 // 7 band hexes in order

// core/env.js
measureViewport(win, probe: HTMLElement): { vw: number; sh: number; dpr: number };
prefersReduced(win): boolean;
safeStorage: { get(key): string | null; set(key, value): void };   // try/catch, never throws
*/

// Typed form of C2. Same names and arities; parameter types made explicit (numbers unless stated).
export type Ease = (t: number) => number;
export type Key = readonly [number, number] | readonly [number, number, Ease];

export interface CoreMath {
  clamp(x: number, a: number, b: number): number;
  lerp(a: number, b: number, t: number): number;
  r(p: number, a: number, b: number): number;
  smooth: Ease; glide: Ease; settle: Ease; lead: Ease; lin: Ease;
  easeInOutSine: Ease; easeOutCubic: Ease;
  keys(p: number, k: readonly Key[]): number;
  mulberry32(seed: number): () => number;
  SEED: number;                 // 0xB3E7
  fin(x: number): number;
}

export interface CoreGeometry {
  SCENES: readonly SceneMeta[];
  COLOPHON_SVH: number;         // 70
  TICK_G: readonly number[];
  viewport(vw: number, sh: number, dpr: number): Viewport;
  trackLayout(vp: Viewport): Layout;
  locate(y: number, layout: Layout): { scene: SceneId; p: number; G: number };
  snap(x: number, dpr: number): number;
  bandRects(vp: Viewport): BandRect[];
  bandRectsFromWeights(w: number[], vp: Viewport): BandRect[];
  dotGrid(vp: Viewport): Pick<DotGridState, 'pitch' | 'originU' | 'originV' | 'r'>;
  shelf(vp: Viewport): ShelfItem[];
  beamW(vp: Viewport): number;
  centre(vp: Viewport): { u: number; v: number };
}

export interface CoreReduced { stillPlan(p: number): StillPlan; }

export interface CorePhrases {
  placardPhrase(scene: SceneId, p: number): { index: number; text: string };
  placardLabel(scene: SceneId, G: number): string;
  admireAnnouncement(scene: SceneId, phrase: string, breathing: boolean): string;
}

export interface CopyStrings {
  title: string; metaDescription: string; h1: string; subtitle: string; cue: string; skip: string; navLabel: string;
  sceneNames: string[]; captions: string[]; artLabels: string[];
  pause: { on: string; paused: string; reduced: string };
  status: { [k: string]: unknown };
  rewind: { [k: string]: unknown };
  contactSheet: string[];
  colophon: { [k: string]: unknown };
  noscript: string;
  errorChip: string;
}
export interface CoreCopy { COPY: CopyStrings; sceneLabel(id: SceneId, short?: boolean): string; }

export interface CoreTokens {
  TOKENS: Record<string, { hex: string; rgb: [number, number, number]; Y: number }>;
  BANDS: readonly string[];
}

export interface CoreEnv {
  measureViewport(win: Window, probe: HTMLElement): { vw: number; sh: number; dpr: number };
  prefersReduced(win: Window): boolean;
  safeStorage: SafeStorage;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// C3. Scene module interface
// ─────────────────────────────────────────────────────────────────────────────────────────────

export interface SceneHost {
  section: HTMLElement;     // <section class="scene" data-scene=N>
  art: HTMLElement;         // its .art (role=img); full-stage box
  uv: HTMLElement;          // .uv inside art: U×V px box, transposed in portrait by CSS (K5)
  vp: Viewport;
  instance: 'main' | 'a' | 'b';               // ids inside SVG must be suffixed with scene+instance
  reportError(phase: ErrorEntry['phase'], err: unknown): void;
  reduced: boolean;
}
export interface SceneView {
  apply(state: SceneState, amb: AmbientSample): void;  // WRITES ONLY. No layout reads. amb.a == 0 ⇒ exactly state's frame.
  resize(vp: Viewport): void;                           // rebuild size-dependent DOM; next apply follows
  destroy(): void;
}
export interface SceneModule {
  meta: SceneMeta;                                      // must equal SCENES[id-1]
  state(p: number, vp: Viewport): SceneState;           // PURE (K6). p clamped to [0,1] by caller.
  mount(host: SceneHost): SceneView;                    // may be called up to 3× (main, a, b)
}

/*
 * Rules every scene obeys:
 * - Only `transform`, `opacity`, SVG geometry attributes or canvas draws change per frame. There is
 *   no `width`, `height`, `top` or `left` per frame.
 * - Custom properties are set on the scene's own elements, never on `:root` (T-E4).
 * - `apply` with `amb.a = 0` renders exactly `state`. Breathing (§7.8) is additive and amplitude-scaled.
 * - A scene never reads `window`, `scrollY` or layout. Everything comes from `vp`.
 * - Scene 4 redraws only when `p` or `amb` changes.
 * - A `state(p)` call stays ≤ 0.5 ms at 1440, and `apply` ≤ 3 ms (Scene 4 ≤ 6 ms), measured in the harness.
 */

// ─────────────────────────────────────────────────────────────────────────────────────────────
// C4. Runtime objects (created in `main.js`, in this order)
// ─────────────────────────────────────────────────────────────────────────────────────────────

export interface AmbientCtl {                       // engine/ambient.js  createAmbient({ reduced, storage })
  sample(now: number): AmbientSample;               // now = rAF timestamp / performance.now()
  start(now: number): void;                         // ramp 0→1 over 1600 ms easeInOutSine
  stop(now: number): void;                          // decay →0 over 240 ms easeOutCubic
  readonly active: boolean;                         // a > 0 (engine keeps rAF running while true)
  readonly paused: boolean; setPaused(v: boolean): void;   // persisted 'bentlight.breathing' = 'on'|'off'
  readonly disabled: boolean;                       // reduced motion ⇒ true, a ≡ 0
  on(evt: 'change', fn: () => void): () => void;
}
export interface Engine {                           // engine/engine.js  createEngine({ scenes, doc, win, reduced, ambient })
  readonly layout: Layout;
  snapshot(): Snapshot; stateAt(y: number): Snapshot; sceneState(id: SceneId, p: number): SceneState;
  scrollTo(y: number, origin: 'resize' | 'rewind' | 'jump'): void;   // instant; engine-originated
  invalidate(): void;                               // request a frame
  reportError(e: Omit<ErrorEntry, 'y'>): void;      // push to ledger (dedupe scene+phase+message), emit 'error'
  on(evt: 'frame', fn: (s: Snapshot) => void): () => void;      // after scene apply, same rAF, write phase
  on(evt: 'scene', fn: (now: SceneId, prev: SceneId) => void): () => void;
  on(evt: 'layout', fn: (l: Layout) => void): () => void;
  on(evt: 'userscroll', fn: (y: number) => void): () => void;   // scroll events NOT caused by engine.scrollTo
  on(evt: 'error', fn: (e: ErrorEntry) => void): () => void;
  bootMs: number;
}
export interface RewindCtl {                        // engine/rewind.js  createRewind({ engine, announce, reduced, doc })
  readonly active: boolean; start(): void; stop(reason: 'input' | 'done'): void;
  jumpToStart(): void; on(evt: 'change', fn: () => void): () => void;
}
export interface AdmireCtl {                        // engine/admire.js  createAdmire({ engine, ambient, rewind, announce, doc, win, reduced })
  readonly armed: boolean; readonly mode: 'on' | 'off'; readonly placard: boolean;
  on(evt: 'change', fn: (s: { mode: 'on' | 'off'; placard: boolean }) => void): () => void;
}
// chrome/chrome.js  createChrome({ engine, admire, ambient, rewind, announce, doc, reduced }): void

// ─────────────────────────────────────────────────────────────────────────────────────────────
// C5. Test hook (`window.__showcase`, engine/hook.js)
// ─────────────────────────────────────────────────────────────────────────────────────────────

export interface Snapshot {
  y: number; G: number; scene: SceneId; p: number;
  state: SceneState;                 // reduced: state(pShown); normal: state(p)
  reduced: StillPlan | null;
  admire: 'on' | 'off';
  ambientA: number;                  // amplitude used for this frame (0 unless admiring)
}
export interface ShowcaseHook {
  readonly version: 1;
  readonly ready: Promise<void>;                   // resolves after the first applied frame
  readonly errors: ErrorEntry[];                   // F9 ledger; must stay [] in a healthy run
  progress(): { y: number; G: number; scene: SceneId; p: number };
  snapshot(): Snapshot;                            // the frame last APPLIED (deep copy, JSON-clean)
  stateAt(y: number): Snapshot;                    // pure prediction at y (ambient 0), no scrolling
  sceneState(id: SceneId, p: number): SceneState;  // pure, current viewport (seam gates)
  layout(): Layout;
  nextFrame(): Promise<Snapshot>;                  // resolves after the next applied frame (forces one)
  frameStats(): { frames: number; scriptMs: number[] };  // ring buffer, last 600 frames of engine work
}

/*
 * The hook is read-only. Tests control breathing only through real UI or storage
 * (`localStorage['bentlight.breathing']='off'` before `goto`), and time only through `page.clock`.
 *
 * `data-*` mirrors (written in the frame):
 * - On `html`: `data-boot` (`pending` → `ready`), `data-orient` (`landscape` or `portrait`),
 *   `data-reduced` (`true` or `false`), `data-admire` (`on` or `off`), `data-placard` (`on` or `off`),
 *   `data-font` (`fallback` or `loaded`), `data-rewind` (`on` or `off`).
 * - On `#stage`: `data-scene` and `data-p` (4 decimals).
 */

// ─────────────────────────────────────────────────────────────────────────────────────────────
// C6. Events and timing rules (prose contract, verbatim)
// ─────────────────────────────────────────────────────────────────────────────────────────────
/*
 * - The frame (engine) runs in this order:
 *   1. Read: `scrollY` once, plus cached layout; nothing else.
 *   2. Compute: `locate` → `state` → `stillPlan` → `ambient.sample(ts)`.
 *   3. Write: layer visibility and `inert` when the scene changes; `view.apply` for the main
 *      instance, or the `a`/`b` instances; then the `'frame'` listeners (chrome) in the same task.
 * - Layout reads. Only `engine.js` reads layout, and only on boot, on `resize`, and through
 *   `ResizeObserver(documentElement)`. On a resize it remeasures and writes `--U`, `--V`,
 *   `--track-h` and the anchor `top`s only where the value changed (so the observer cannot loop),
 *   then `scrollTo(round(G_anchor·D′), 'resize')`.
 * - Engine scrolls are instant. `engine.scrollTo` calls `window.scrollTo({ top: y, behavior: 'instant' })`
 *   explicitly, because `html { scroll-behavior: smooth }` would otherwise animate resize restores and
 *   rewind steps and break the scroll-origin rule.
 * - Hashes. `location.hash` is never passed to `querySelector`; lookups use
 *   `getElementById(decodeURIComponent(…))` inside `try` (static guard 13).
 * - The rAF loop runs only while dirty or while `ambient.active`. An idle page spends no CPU.
 * - Scroll origin. `engine.scrollTo` records `{y, frame}`. A `scroll` event that lands within 1 px of
 *   that `y`, no more than 2 frames later, is engine-originated: it fires no `userscroll`, does not
 *   update `G_anchor`, and is ignored by admire. Every other scroll fires `userscroll` and updates
 *   `G_anchor`.
 * - Admire timers use `setTimeout` (`--idle-ms` 1200, `--placard-ms` 3000, read from `tokens.css`
 *   once at boot), so `page.clock` drives them. Chrome fades are CSS transitions keyed off
 *   `html[data-admire]` and `html[data-placard]`; they run on wall time, so tests read their computed
 *   timing and seek them (K11), never sample them under the clock.
 * - No `preventDefault` anywhere in `site/js` (§7.6, §9). This is a static guard.
 */

// ═════════════════════════════════════════════════════════════════════════════════════════════
// WO-001 derived helpers (names for types C1–C6 use implicitly; not new behaviour)
// ═════════════════════════════════════════════════════════════════════════════════════════════

/** core/env.js `safeStorage` (C2): try/catch, never throws. */
export interface SafeStorage { get(key: string): string | null; set(key: string, value: string): void; }

/** core/announce.js: writes to the `#status` live region (clear, then set on the next frame). */
export type Announce = (message: string) => void;

export interface AmbientOptions { reduced: boolean; storage: SafeStorage; }
export interface EngineOptions { scenes: readonly SceneModule[]; doc: Document; win: Window; reduced: boolean; ambient: AmbientCtl; }
export interface RewindOptions { engine: Engine; announce: Announce; reduced: boolean; doc: Document; }
export interface AdmireOptions { engine: Engine; ambient: AmbientCtl; rewind: RewindCtl; announce: Announce; doc: Document; win: Window; reduced: boolean; }
export interface ChromeOptions { engine: Engine; admire: AdmireCtl; ambient: AmbientCtl; rewind: RewindCtl; announce: Announce; doc: Document; reduced: boolean; }

/** The exact C4 factory signatures. Each factory module annotates its export with one of these. */
export type CreateAmbient = (opts: AmbientOptions) => AmbientCtl;
export type CreateEngine = (opts: EngineOptions) => Engine;
export type CreateRewind = (opts: RewindOptions) => RewindCtl;
export type CreateAdmire = (opts: AdmireOptions) => AdmireCtl;
export type CreateChrome = (opts: ChromeOptions) => void;

/** dev/harness.js: `window.__harness` (plan WO-001 "Harness"). */
export interface HarnessHandle {
  readonly ready: Promise<void>;
  readonly scene: SceneId;
  readonly vp: Viewport;
  set(p: number, a?: number, t?: number): SceneState;
  state(): SceneState | null;
}

declare global {
  interface Window {
    __showcase: ShowcaseHook;
    __harness: HarnessHandle;
    /** dev/components gallery hook (WO-004, dev-only; never in site/). Shape owned by WO-004. */
    __gallery: any;
  }
}
