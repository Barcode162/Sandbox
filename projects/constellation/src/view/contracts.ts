// src/view/contracts.ts — FROZEN CONTRACT between the UI (src/ui, src/main.ts) and the renderer (src/view).
// Both sides belong to WO-003, so WO-003 may ADD optional members; removing or changing one is a CEO decision.
// The renderer imports core types from '../core/index.ts' only and never mutates the graph.
import type { Activation, FacetView, NodeId, NodeKind, PathwayOp, PerspectiveId, RelationId, RelationType, Route, Trace, TraceStep, Unsubscribe, Vec3 } from '../core/index.ts';

/** What the renderer draws for one point. Built by the UI from core (resolveValue, facetsOf, disagrees). */
export interface SceneNode {
  id: NodeId;
  label: string;
  kind: NodeKind;
  /** Display text of the value under the active perspective (already formatted). */
  valueText: string;
  position: Vec3;
  /** Present only when the node disagrees across perspectives: one ghost per differing facet. */
  ghosts?: FacetView[];
  /** WO-003 addition: the pathway op, so the view can draw its glyph. */
  op?: PathwayOp;
  /** WO-003 addition: ghost chip texts keyed by perspective (formatted values). */
  ghostText?: Partial<Record<PerspectiveId, string>>;
  /** CEO addition (ship condition 2): one of the newest things stored after the memory began; always named. */
  recent?: boolean;
}

/** WO-003 addition: how an edge is drawn (experience.md §7 edge table). */
export type EdgeLook = 'relates' | 'is-a' | 'part-of' | 'next' | 'references' | 'reads' | 'flow' | 'shortcut' | 'causes';

export interface SceneRelation {
  id: RelationId;
  from: NodeId;
  to: NodeId;
  type: RelationType;
  weight: number;
  directed: boolean;
  /** WO-003 addition: visual style; default derived from `type`. */
  look?: EdgeLook;
  /** WO-003 addition: visible only in some lenses → lens colour at the midpoint. */
  lensOnly?: boolean;
  /** WO-003 addition: mono chip at the midpoint (flow branches: then / else / body / loop / exit). */
  chip?: string;
}

export interface SceneSnapshot {
  perspective: PerspectiveId;
  nodes: SceneNode[];
  /** Only the relations visible under `perspective`. */
  relations: SceneRelation[];
  /** WO-003 addition: CSS colour per perspective (halo tint, ghosts, lens-only midpoints). */
  lensColors?: Partial<Record<PerspectiveId, string>>;
  /** WO-003 addition: BFS root for ignition and morph stagger (the meta hub). */
  root?: NodeId;
}

export interface TransitionOptions {
  /** Morph duration. Default 1000; must be ≤ 1200 (brief → exceptional 2). 0 = instant (reduced motion). */
  durationMs?: number;
}

/** A lit trail: e.g. the declared chain and the shortest route, drawn side by side. */
export interface RouteTrail {
  route: Route;
  /** Semantic role; the view maps it to colour/style tokens. */
  role: 'declared' | 'shortest' | 'learned';
}

export interface PlaybackOptions {
  /** Milliseconds per trace step. Default 450. */
  stepMs?: number;
  onStep?: (index: number) => void;
  /** WO-003 addition: text of the condition chip for if / while steps (default: from step.note). */
  conditionText?: (step: TraceStep) => string;
}

export interface RenderStats {
  fps: number;
  frameMs: number;
  drawCalls: number;
  nodes: number;
  relations: number;
}

export interface Renderer {
  /** Replace the scene (first load, import, add/remove). Instant; no morph. */
  setScene(scene: SceneSnapshot): void;
  /** Morph positions, visibility, labels and ghosts to a new perspective's snapshot. Resolves when settled. */
  transitionTo(scene: SceneSnapshot, options?: TransitionOptions): Promise<void>;
  highlightRoutes(trails: RouteTrail[]): void;
  clearRoutes(): void;
  /** Animate a pulse through trace.steps. Resolves at the end; rejects never. */
  playTrace(trace: Trace, options?: PlaybackOptions): Promise<void>;
  stopTrace(): void;
  /** null clears. Brightness by activation, depth readable. */
  setActivation(activations: Activation[] | null): void;
  setSelection(id: NodeId | null): void;
  /** Fly the camera to a node (null = overview). */
  focusNode(id: NodeId | null, options?: { animate?: boolean }): Promise<void>;
  /** Pointer pick on the canvas. null = empty space. */
  onPick(listener: (id: NodeId | null) => void): Unsubscribe;
  onHover(listener: (id: NodeId | null) => void): Unsubscribe;
  /** Project a node to CSS pixels in the canvas (for e2e clicks and DOM overlays). null if off-screen. */
  screenPosition(id: NodeId): { x: number; y: number } | null;
  setReducedMotion(reduced: boolean): void;
  stats(): RenderStats;
  resize(width: number, height: number): void;
  dispose(): void;
  /** WO-003 addition: the extended instrument surface (always present in this build). */
  extras?: RendererExtras;
}

/** WO-003 addition: one clock drives every animation (experience.md §13). */
export interface RendererClock {
  now(): number;
  pause(): void;
  resume(): void;
  /** Jump the clock to `ms` (implies pause). */
  set(ms: number): void;
  readonly paused: boolean;
}

/** WO-003 addition: screen areas covered by panels, in CSS px; the camera centres on the free area. */
export interface Insets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** WO-003 addition: read-only render state for e2e asserts (experience.md §13 `state()`). */
export interface RenderDebugState {
  clock: number;
  morphT: number | null;
  ghostState: 'rest' | 'expanded' | 'none';
  labelsShown: number;
  labelRects: Array<{ id: NodeId; x: number; y: number; w: number; h: number }>;
  /** CEO addition (ship conditions): every placed overlay item, and the star footprints labels avoid. */
  overlayRects?: Array<{ kind: string; id: string; x: number; y: number; w: number; h: number }>;
  coreCircles?: Array<{ id: NodeId; x: number; y: number; r: number }>;
  hovered: NodeId | null;
  selected: NodeId | null;
  cameraDistance: number;
  visibleEdges: number;
  dimOthers: number;
  introDone: boolean;
  traceIndex: number;
  /** Hops reached by each route trail head. */
  trailHeads: Array<{ role: RouteTrail['role']; hops: number; head: number }>;
  nanPositions: number;
}

export interface RendererExtras {
  clock: RendererClock;
  /** Run the ignition intro from `root` (speed 1 = full, 0.5 = the return visit). */
  playIntro(options?: { speed?: number }): void;
  setInsets(insets: Insets): void;
  /** D held: expand every ghost with its value chip. */
  setGhostsExpanded(held: boolean): void;
  setTracePaused(paused: boolean): void;
  /** While paused, advance one visit. */
  stepTrace(): void;
  /** Frame a set of nodes (pathway run start). */
  frameNodes(ids: NodeId[]): Promise<void>;
  /** Ease the camera a fraction of the way toward a node (births). */
  nudgeToward(id: NodeId, fraction: number): void;
  /** Fly back to the default view (Home). */
  home(): Promise<void>;
  /** Link mode: a rubber band from `id` to the pointer. null ends it. */
  setLinkSource(id: NodeId | null): void;
  /** Ring burst on a node (search match, birth). */
  burst(id: NodeId): void;
  onFrame(listener: (clockMs: number) => void): Unsubscribe;
  debugState(): RenderDebugState;
  /** Resolves once no morph, trace playback, intro or camera fly is running. */
  whenIdle(): Promise<void>;
  /** Pointer position over the canvas (CSS px) or null; for the hover card. */
  pointer(): { x: number; y: number } | null;
  /** Nearest visible node from `id` in a screen direction (arrow keys). */
  neighbourInDirection(id: NodeId, dx: number, dy: number, candidates: readonly NodeId[]): NodeId | null;
}

export interface RendererOptions {
  container: HTMLElement;
  reducedMotion: boolean;
}

export type CreateRenderer = (options: RendererOptions) => Renderer;

/**
 * The e2e test hook, installed on `window.__constellation` by src/main.ts in every build
 * (read-only state; it is how Playwright waits for readiness and finds points to click).
 */
export interface ConstellationTestHook {
  ready: boolean;
  perspective: PerspectiveId;
  stats(): RenderStats;
  screenPosition(id: NodeId): { x: number; y: number } | null;
  nodeIdByLabel(label: string): NodeId | null;
  /** Resolves once any running morph / trace playback has settled. */
  idle(): Promise<void>;
  /** WO-003 addition: the single animation clock (pause / set for deterministic frames). */
  clock?: RendererClock;
  /** WO-003 addition: experience.md §13 `state()`. */
  state?(): ConstellationState;
}

/** WO-003 addition: app + render state for e2e (experience.md §13). */
export interface ConstellationState extends RenderDebugState {
  lens: PerspectiveId;
  lights: number;
  statsText: string;
  route: { declared: number | null; shortest: number | null; chip: string } | null;
  activationCounts: number[] | null;
  runs: Partial<Record<PerspectiveId, string>>;
  loopBadge: number | null;
}

declare global {
  interface Window {
    __constellation?: ConstellationTestHook;
  }
}
