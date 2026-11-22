// src/view/contracts.ts — FROZEN CONTRACT between the UI (src/ui, src/main.ts) and the renderer (src/view).
// Both sides belong to WO-003, so WO-003 may ADD optional members; removing or changing one is a CEO decision.
// The renderer imports core types from '../core/index.ts' only and never mutates the graph.
import type { Activation, FacetView, NodeId, NodeKind, PerspectiveId, RelationId, RelationType, Route, Trace, Unsubscribe, Vec3 } from '../core/index.ts';

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
}

export interface SceneRelation {
  id: RelationId;
  from: NodeId;
  to: NodeId;
  type: RelationType;
  weight: number;
  directed: boolean;
}

export interface SceneSnapshot {
  perspective: PerspectiveId;
  nodes: SceneNode[];
  /** Only the relations visible under `perspective`. */
  relations: SceneRelation[];
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
}

declare global {
  interface Window {
    __constellation?: ConstellationTestHook;
  }
}
