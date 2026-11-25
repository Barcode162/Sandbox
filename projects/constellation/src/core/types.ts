// src/core/types.ts — FROZEN CONTRACT (M-0002 wave 0). Every shared type lives here.
// Changing anything in this file after wave 0 is a CEO decision (plan.md → Contracts).
// Core is DOM-free: nothing here may reference window, document, three or CSS.

// ── Identity & primitives ────────────────────────────────────────────────────────────────
export type NodeId = string;
export type RelationId = string;
export type PerspectiveId = string;

/** A stored value. Kept JSON-safe on purpose (persistence round-trips it unchanged). */
export type Value = string | number | boolean | null;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type Unsubscribe = () => void;

// ── Nodes ────────────────────────────────────────────────────────────────────────────────
/** What a point *is*. `pathway` nodes are executable steps of a flow (see PathwayStep). */
export type NodeKind = 'concept' | 'variable' | 'file' | 'note' | 'pathway';

/** A file is stored by reference plus optional small text content (brief → Scope). */
export interface FileRef {
  name: string;
  path?: string;
  mime?: string;
  /** Human size note, e.g. "2.4 MB". Not parsed. */
  sizeNote?: string;
  /** Optional inline text, ≤ 64 KB (validated on import). */
  content?: string;
}

export type PathwayOp = 'start' | 'assign' | 'if' | 'while' | 'read' | 'end';

/**
 * The executable payload of a `pathway` node.
 * - start: entry point; follows its `next` flow relation.
 * - assign: `vars[target] = eval(expr)`; follows `next`.
 * - read:   `vars[target] = resolveValue(source, perspective)`; follows `next`.
 * - if:     eval(expr) truthy → `true` branch, else `false` branch.
 * - while:  eval(expr) truthy → `true` branch (the body, which flows back to this node), else `false` (exit).
 * - end:    stops; `expr` (optional) is evaluated into Trace.result.
 * Expressions use the safe grammar documented in src/core/expr.ts (no eval / Function).
 */
export interface PathwayStep {
  op: PathwayOp;
  /** Variable name written by assign / read. Identifier: [A-Za-z_][A-Za-z0-9_]*. */
  target?: string;
  /** Expression for assign / if / while / end. */
  expr?: string;
  /** Node read by `read`. */
  source?: NodeId;
}

export interface MemoryNode {
  id: NodeId;
  label: string;
  kind: NodeKind;
  /** Base value: what the node holds when a perspective has no facet for it. */
  value: Value;
  /** Per-perspective values ("facets"). Missing key → falls back to `value`. */
  facets: Partial<Record<PerspectiveId, Value>>;
  /** Optional display unit per perspective (e.g. "°C", "K", "hand-feel"); key "*" is the base unit. Display only. */
  units?: Partial<Record<PerspectiveId | '*', string>>;
  tags: string[];
  notes?: string;
  file?: FileRef;
  pathway?: PathwayStep;
  /** ms since epoch. */
  created: number;
  updated: number;
}

/** Fields accepted when creating a node; the store fills id (if absent), timestamps and defaults. */
export interface NodeInput {
  id?: NodeId;
  label: string;
  kind?: NodeKind; // default 'concept'
  value?: Value; // default null
  facets?: Partial<Record<PerspectiveId, Value>>;
  units?: Partial<Record<PerspectiveId | '*', string>>;
  tags?: string[];
  notes?: string;
  file?: FileRef;
  pathway?: PathwayStep;
}

export type NodePatch = Partial<Omit<MemoryNode, 'id' | 'created' | 'updated'>>;

// ── Relations ────────────────────────────────────────────────────────────────────────────
/**
 * Typed relation. `chain` = the declared (long) route; `shortcut` = learned or seeded direct link;
 * `flow` = pathway control edge (always directed, carries `branch`).
 */
export type RelationType = 'association' | 'chain' | 'part-of' | 'causes' | 'shortcut' | 'flow';

export type FlowBranch = 'next' | 'true' | 'false';

export interface Relation {
  id: RelationId;
  from: NodeId;
  to: NodeId;
  type: RelationType;
  /** Strength in (0, 1]. Routing cost of one hop = 1 / weight. Activation multiplies by weight. */
  weight: number;
  /** Directed relations are traversed from → to only; undirected both ways. `flow` is always directed. */
  directed: boolean;
  /** Only for type 'flow'. */
  branch?: FlowBranch;
  label?: string;
  /** If present, the relation is visible (and routable) only under these perspectives. Absent → all. */
  perspectives?: PerspectiveId[];
  created: number;
}

export interface RelationInput {
  id?: RelationId;
  from: NodeId;
  to: NodeId;
  type?: RelationType; // default 'association'
  weight?: number; // default 0.5
  directed?: boolean; // default: true for chain/flow, false otherwise
  branch?: FlowBranch;
  label?: string;
  perspectives?: PerspectiveId[];
}

export type RelationPatch = Partial<Pick<Relation, 'type' | 'weight' | 'directed' | 'branch' | 'label' | 'perspectives'>>;

// ── Perspectives ─────────────────────────────────────────────────────────────────────────
export interface Perspective {
  id: PerspectiveId;
  label: string;
  description?: string;
  /** Optional CSS colour hint from the data author; the view may ignore it. */
  accent?: string;
  /** Authored positions under this perspective. Nodes missing here get the deterministic force layout. */
  positions?: Partial<Record<NodeId, Vec3>>;
}

/** One node's value under one perspective, for the inspector and facet ghosts. */
export interface FacetView {
  perspective: PerspectiveId;
  value: Value;
  /** true if the value comes from node.facets[perspective], false if it fell back to node.value. */
  own: boolean;
  /** Display unit for this perspective (units[perspective] ?? units['*']), if any. */
  unit?: string;
}

export interface ForceLayoutOptions {
  /** Default 300. */
  iterations?: number;
  /** Radius the layout is normalised into. Default 60. */
  radius?: number;
  /** Extra seed mixed into the per-id hash, e.g. the perspective id. Default ''. */
  seed?: string;
}

// ── Graph store ──────────────────────────────────────────────────────────────────────────
export type GraphEvent =
  | { type: 'node-added'; node: MemoryNode }
  | { type: 'node-updated'; node: MemoryNode; previous: MemoryNode }
  | { type: 'node-removed'; node: MemoryNode; relations: Relation[] }
  | { type: 'relation-added'; relation: Relation }
  | { type: 'relation-updated'; relation: Relation; previous: Relation }
  | { type: 'relation-removed'; relation: Relation }
  | { type: 'perspective-added'; perspective: Perspective }
  | { type: 'perspective-updated'; perspective: Perspective }
  | { type: 'reset' };

export type GraphListener = (event: GraphEvent) => void;

/**
 * The in-memory store. All returned objects are read-only snapshots: mutate only via methods.
 * Errors: methods throw CoreError (code 'not-found' | 'invalid' | 'duplicate').
 */
export interface MemoryGraph {
  readonly meta: MemoryMeta;
  getNode(id: NodeId): MemoryNode | undefined;
  nodes(): readonly MemoryNode[];
  findByLabel(label: string): MemoryNode | undefined; // case-insensitive, trimmed
  addNode(input: NodeInput): MemoryNode;
  updateNode(id: NodeId, patch: NodePatch): MemoryNode;
  /** Also removes every relation touching the node. */
  removeNode(id: NodeId): void;

  getRelation(id: RelationId): Relation | undefined;
  relations(): readonly Relation[];
  /** Relations touching `id`, in either direction. */
  relationsOf(id: NodeId): readonly Relation[];
  addRelation(input: RelationInput): Relation;
  updateRelation(id: RelationId, patch: RelationPatch): Relation;
  removeRelation(id: RelationId): void;

  perspectives(): readonly Perspective[];
  getPerspective(id: PerspectiveId): Perspective | undefined;
  addPerspective(p: Perspective): Perspective;
  updatePerspective(id: PerspectiveId, patch: Partial<Omit<Perspective, 'id'>>): Perspective;

  /** Replace everything with a validated document (fires 'reset'). */
  load(doc: MemoryDoc): void;
  on(listener: GraphListener): Unsubscribe;
}

export type CoreErrorCode = 'not-found' | 'invalid' | 'duplicate' | 'parse' | 'runtime';

// ── Routing & shortcuts ──────────────────────────────────────────────────────────────────
export type RouteKind = 'declared' | 'shortest';

export interface Route {
  kind: RouteKind;
  /** from … to, inclusive. */
  nodes: NodeId[];
  /** relations[i] joins nodes[i] and nodes[i+1]. */
  relations: RelationId[];
  hops: number;
  /** Sum of 1 / weight over the hops. */
  cost: number;
}

export interface RouteOptions {
  /** Only relations visible under this perspective are used. Default: all relations. */
  perspective?: PerspectiveId;
  /** Relation types never traversed. Default ['flow']. */
  excludeTypes?: RelationType[];
}

export interface RouteComparison {
  from: NodeId;
  to: NodeId;
  /** Path following only `chain` relations; null if none. */
  declared: Route | null;
  /** Weighted shortest path over all routable relations; null if unreachable. */
  shortest: Route | null;
  /** declared.hops - shortest.hops (0 if either is null). */
  savedHops: number;
}

// ── Retrieval ────────────────────────────────────────────────────────────────────────────
export type MatchField = 'label' | 'value' | 'facet' | 'tag' | 'notes' | 'file';

export interface Match {
  nodeId: NodeId;
  /** (0, 1]; exact label = 1. */
  score: number;
  field: MatchField;
}

export interface Activation {
  nodeId: NodeId;
  /** 0 = a seed (match), 1 = one hop away, … */
  depth: number;
  /** (0, 1]; seed = its match score; each hop multiplies by decay * relation weight; max over paths. */
  activation: number;
}

export interface ActivationOptions {
  /** Default 0.6. */
  decay?: number;
  /** Default 3. */
  maxDepth?: number;
  /** Activations below this are dropped. Default 0.05. */
  threshold?: number;
  perspective?: PerspectiveId;
}

export interface RetrievalResult {
  query: string;
  matches: Match[];
  /** Sorted by activation desc, then depth asc, then nodeId. Includes the seeds at depth 0. */
  activations: Activation[];
}

// ── Expressions & flow interpreter ───────────────────────────────────────────────────────
export type Expr =
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'null' }
  | { kind: 'var'; name: string }
  | { kind: 'ref'; label: string } // @Label or @"Long label": a node value under the active perspective
  | { kind: 'unary'; op: 'not' | '-'; arg: Expr }
  | { kind: 'binary'; op: BinaryOp; left: Expr; right: Expr };

export type BinaryOp = '+' | '-' | '*' | '/' | '==' | '!=' | '<' | '<=' | '>' | '>=' | 'and' | 'or';

/** What an expression can read: pathway variables and node values (already resolved per perspective). */
export interface Scope {
  vars: Readonly<Record<string, Value>>;
  ref(label: string): Value; // throws CoreError 'runtime' if no node has that label
}

export interface TraceStep {
  index: number;
  nodeId: NodeId;
  op: PathwayOp;
  /** The flow relation taken to leave this node (absent on end / error). */
  via?: RelationId;
  branch?: FlowBranch;
  /** Variable state *after* this step. */
  vars: Record<string, Value>;
  /** Human explanation, e.g. "while @Temperature > 100 → 300 > 100 → true". */
  note: string;
}

export type TraceStatus = 'ended' | 'max-steps' | 'error';

export interface Trace {
  pathway: NodeId; // the start node
  perspective: PerspectiveId;
  steps: TraceStep[];
  status: TraceStatus;
  /** Value of the end node's expr, else null. */
  result: Value;
  vars: Record<string, Value>;
  error?: string;
}

export interface RunOptions {
  /** Default 500. Hitting it yields status 'max-steps', never a hang. */
  maxSteps?: number;
}

// ── Persistence (file format v1) ─────────────────────────────────────────────────────────
export const SCHEMA_ID = 'constellation.memory';
export const SCHEMA_VERSION = 1;

export interface MemoryMeta {
  title: string;
  description?: string;
  defaultPerspective: PerspectiveId;
  /** Hints the UI uses to pre-fill demos. All optional; ids must exist if present. */
  featured?: {
    route?: { from: NodeId; to: NodeId };
    pathway?: NodeId;
    query?: string;
  };
}

/** The JSON document: the seed, exports, imports and autosave all use exactly this shape. */
export interface MemoryDoc {
  schema: typeof SCHEMA_ID;
  version: typeof SCHEMA_VERSION;
  meta: MemoryMeta;
  perspectives: Perspective[];
  nodes: MemoryNode[];
  relations: Relation[];
}

export interface ValidationIssue {
  /** JSON path, e.g. "nodes[3].facets.cook". */
  path: string;
  /** Plain-language sentence a stranger can act on. */
  message: string;
}

export type ImportResult = { ok: true; doc: MemoryDoc; warnings: ValidationIssue[] } | { ok: false; errors: ValidationIssue[] };

/** The subset of Web Storage the core uses, so node tests can pass a Map-backed fake. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AutosaveOptions {
  /** Default 'constellation.memory.v2'. */
  key?: string;
  /** Default 400. */
  debounceMs?: number;
  /** Called when setItem throws (quota). */
  onError?: (error: unknown) => void;
}
