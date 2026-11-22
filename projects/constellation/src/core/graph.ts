// src/core/graph.ts — graph store. Signatures FROZEN; bodies are WO-002's.
// Every stored object is a frozen snapshot: a mutation replaces the object, so anything a caller
// holds (including `previous` in events) never changes under them.
import { CoreError } from './errors.ts';
import {
  canonMeta, canonNode, canonPerspective, canonRelation, canonStep, canonFile, canonUnits, deepFreeze, hasOwn, isValue,
  MAX_FILE_CONTENT, MAX_UNIT_CHARS, MAX_VALUE_CHARS, NODE_KINDS, RELATION_TYPES, FLOW_BRANCHES,
} from './internal.ts';
import { SCHEMA_ID, SCHEMA_VERSION } from './types.ts';
import type {
  GraphEvent, GraphListener, MemoryDoc, MemoryGraph, MemoryMeta, MemoryNode, NodeId, NodeInput, NodePatch,
  Perspective, PerspectiveId, Relation, RelationId, RelationInput, RelationPatch, Value,
} from './types.ts';

/** New store, optionally loaded from an already-validated document. Ids generated as `n_<base36>` / `r_<base36>`. */
export function createGraph(doc?: MemoryDoc): MemoryGraph {
  return new Store(doc ?? emptyDoc());
}

/** A valid empty document (one perspective, id 'base'). */
export function emptyDoc(title = 'Untitled memory'): MemoryDoc {
  return {
    schema: SCHEMA_ID,
    version: SCHEMA_VERSION,
    meta: { title, defaultPerspective: 'base' },
    perspectives: [{ id: 'base', label: 'Base' }],
    nodes: [],
    relations: [],
  };
}

const EMPTY: readonly Relation[] = Object.freeze([]);

class Store implements MemoryGraph {
  #meta!: MemoryMeta;
  #nodes = new Map<NodeId, MemoryNode>();
  #relations = new Map<RelationId, Relation>();
  #perspectives = new Map<PerspectiveId, Perspective>();
  /** node id → ids of relations touching it. */
  #adjacency = new Map<NodeId, Set<RelationId>>();
  #listeners = new Set<GraphListener>();
  #nodeList: readonly MemoryNode[] | null = null;
  #relationList: readonly Relation[] | null = null;
  #perspectiveList: readonly Perspective[] | null = null;
  #adjCache = new Map<NodeId, readonly Relation[]>();
  #nextNode = 1;
  #nextRelation = 1;
  #lastStamp = 0;

  constructor(doc: MemoryDoc) {
    this.#fill(doc);
  }

  get meta(): MemoryMeta {
    return this.#meta;
  }

  // ── nodes ──────────────────────────────────────────────────────────────────────────────
  getNode(id: NodeId): MemoryNode | undefined {
    return this.#nodes.get(id);
  }

  nodes(): readonly MemoryNode[] {
    return (this.#nodeList ??= Object.freeze([...this.#nodes.values()]));
  }

  findByLabel(label: string): MemoryNode | undefined {
    const want = label.trim();
    if (!want) return undefined;
    const lower = want.toLowerCase();
    let loose: MemoryNode | undefined;
    for (const n of this.#nodes.values()) {
      const l = n.label.trim();
      if (l === want) return n; // exact case wins, so "I" (Long Road) and "i" (variable) stay distinct
      if (!loose && l.toLowerCase() === lower) loose = n;
    }
    return loose;
  }

  addNode(input: NodeInput): MemoryNode {
    if (!input || typeof input !== 'object') throw new CoreError('invalid', 'A new thing needs at least a name.');
    const id = input.id ?? this.#freshId('n_', this.#nodes, () => this.#nextNode++);
    if (typeof id !== 'string' || !id.trim()) throw new CoreError('invalid', 'An id must be a non-empty piece of text.');
    if (this.#nodes.has(id)) throw new CoreError('duplicate', `There's already a node with the id "${id}".`);
    const now = this.#stamp();
    const node: MemoryNode = {
      id,
      label: input.label,
      kind: input.kind ?? 'concept',
      value: input.value === undefined ? null : input.value,
      facets: { ...(input.facets ?? {}) },
      tags: [...(input.tags ?? [])],
      created: now,
      updated: now,
    };
    if (input.units !== undefined) node.units = canonUnits(input.units);
    if (input.notes !== undefined) node.notes = input.notes;
    if (input.file !== undefined) node.file = canonFile(input.file);
    if (input.pathway !== undefined) node.pathway = canonStep(input.pathway);
    this.#checkNode(node);
    const frozen = deepFreeze(canonNode(node));
    this.#nodes.set(id, frozen);
    this.#adjacency.set(id, new Set());
    this.#nodeList = null;
    this.#emit({ type: 'node-added', node: frozen });
    return frozen;
  }

  updateNode(id: NodeId, patch: NodePatch): MemoryNode {
    const previous = this.#requireNode(id);
    const draft: MemoryNode = { ...previous, facets: { ...previous.facets }, tags: [...previous.tags] };
    for (const key of Object.keys(patch ?? {}) as (keyof NodePatch)[]) {
      if (!['label', 'kind', 'value', 'facets', 'units', 'tags', 'notes', 'file', 'pathway'].includes(key)) {
        throw new CoreError('invalid', `"${String(key)}" can't be changed on a node.`);
      }
      const v = patch[key];
      if (v === undefined) {
        if (key === 'units' || key === 'notes' || key === 'file' || key === 'pathway') delete draft[key];
        continue;
      }
      (draft as unknown as Record<string, unknown>)[key] = key === 'facets' || key === 'units' ? { ...(v as object) } : key === 'tags' ? [...(v as string[])] : v;
    }
    draft.updated = Math.max(this.#stamp(), previous.updated);
    this.#checkNode(draft);
    const frozen = deepFreeze(canonNode(draft));
    this.#nodes.set(id, frozen);
    this.#nodeList = null;
    this.#emit({ type: 'node-updated', node: frozen, previous });
    return frozen;
  }

  removeNode(id: NodeId): void {
    const node = this.#requireNode(id);
    const touching = [...this.relationsOf(id)];
    for (const r of touching) this.#detach(r);
    this.#nodes.delete(id);
    this.#adjacency.delete(id);
    this.#adjCache.delete(id);
    this.#nodeList = null;
    this.#emit({ type: 'node-removed', node, relations: touching });
  }

  // ── relations ──────────────────────────────────────────────────────────────────────────
  getRelation(id: RelationId): Relation | undefined {
    return this.#relations.get(id);
  }

  relations(): readonly Relation[] {
    return (this.#relationList ??= Object.freeze([...this.#relations.values()]));
  }

  relationsOf(id: NodeId): readonly Relation[] {
    const cached = this.#adjCache.get(id);
    if (cached) return cached;
    const ids = this.#adjacency.get(id);
    if (!ids) return EMPTY;
    const list = Object.freeze([...ids].map((r) => this.#relations.get(r)!));
    this.#adjCache.set(id, list);
    return list;
  }

  addRelation(input: RelationInput): Relation {
    if (!input || typeof input !== 'object') throw new CoreError('invalid', 'A line needs two ends.');
    const id = input.id ?? this.#freshId('r_', this.#relations, () => this.#nextRelation++);
    if (typeof id !== 'string' || !id.trim()) throw new CoreError('invalid', 'An id must be a non-empty piece of text.');
    if (this.#relations.has(id)) throw new CoreError('duplicate', `There's already a line with the id "${id}".`);
    const type = input.type ?? 'association';
    const relation: Relation = {
      id,
      from: input.from,
      to: input.to,
      type,
      weight: input.weight ?? 0.5,
      directed: input.directed ?? (type === 'chain' || type === 'flow'),
      created: this.#stamp(),
    };
    if (input.branch !== undefined) relation.branch = input.branch;
    else if (type === 'flow') relation.branch = 'next';
    if (input.label !== undefined) relation.label = input.label;
    if (input.perspectives !== undefined) relation.perspectives = [...input.perspectives];
    this.#checkRelation(relation);
    const frozen = deepFreeze(canonRelation(relation));
    this.#attach(frozen);
    this.#emit({ type: 'relation-added', relation: frozen });
    return frozen;
  }

  updateRelation(id: RelationId, patch: RelationPatch): Relation {
    const previous = this.#relations.get(id);
    if (!previous) throw new CoreError('not-found', `No line has the id "${id}".`);
    const draft: Relation = { ...previous };
    for (const key of Object.keys(patch ?? {}) as (keyof RelationPatch)[]) {
      if (!['type', 'weight', 'directed', 'branch', 'label', 'perspectives'].includes(key)) {
        throw new CoreError('invalid', `"${String(key)}" can't be changed on a line.`);
      }
      const v = patch[key];
      if (v === undefined) {
        if (key === 'branch' || key === 'label' || key === 'perspectives') delete draft[key];
        continue;
      }
      (draft as unknown as Record<string, unknown>)[key] = key === 'perspectives' ? [...(v as string[])] : v;
    }
    this.#checkRelation(draft);
    const frozen = deepFreeze(canonRelation(draft));
    this.#relations.set(id, frozen);
    this.#relationList = null;
    this.#adjCache.delete(frozen.from);
    this.#adjCache.delete(frozen.to);
    this.#emit({ type: 'relation-updated', relation: frozen, previous });
    return frozen;
  }

  removeRelation(id: RelationId): void {
    const relation = this.#relations.get(id);
    if (!relation) throw new CoreError('not-found', `No line has the id "${id}".`);
    this.#detach(relation);
    this.#emit({ type: 'relation-removed', relation });
  }

  // ── perspectives ───────────────────────────────────────────────────────────────────────
  perspectives(): readonly Perspective[] {
    return (this.#perspectiveList ??= Object.freeze([...this.#perspectives.values()]));
  }

  getPerspective(id: PerspectiveId): Perspective | undefined {
    return this.#perspectives.get(id);
  }

  addPerspective(p: Perspective): Perspective {
    if (!p || typeof p.id !== 'string' || !p.id.trim()) throw new CoreError('invalid', 'A perspective needs an id.');
    if (this.#perspectives.has(p.id)) throw new CoreError('duplicate', `There's already a perspective with the id "${p.id}".`);
    this.#checkPerspective(p);
    const frozen = deepFreeze(canonPerspective(p));
    this.#perspectives.set(p.id, frozen);
    this.#perspectiveList = null;
    this.#emit({ type: 'perspective-added', perspective: frozen });
    return frozen;
  }

  updatePerspective(id: PerspectiveId, patch: Partial<Omit<Perspective, 'id'>>): Perspective {
    const previous = this.#perspectives.get(id);
    if (!previous) throw new CoreError('not-found', `No perspective has the id "${id}".`);
    if (patch && hasOwn(patch, 'id')) throw new CoreError('invalid', "A perspective's id can't be changed.");
    const draft: Perspective = { ...previous };
    for (const [k, v] of Object.entries(patch ?? {})) {
      if (v === undefined) delete (draft as unknown as Record<string, unknown>)[k];
      else (draft as unknown as Record<string, unknown>)[k] = v;
    }
    this.#checkPerspective(draft);
    const frozen = deepFreeze(canonPerspective(draft));
    this.#perspectives.set(id, frozen);
    this.#perspectiveList = null;
    this.#emit({ type: 'perspective-updated', perspective: frozen });
    return frozen;
  }

  // ── whole document ─────────────────────────────────────────────────────────────────────
  load(doc: MemoryDoc): void {
    this.#fill(doc);
    this.#emit({ type: 'reset' });
  }

  on(listener: GraphListener): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  // ── internals ──────────────────────────────────────────────────────────────────────────
  #fill(doc: MemoryDoc): void {
    if (!doc || !Array.isArray(doc.perspectives) || !Array.isArray(doc.nodes) || !Array.isArray(doc.relations)) {
      throw new CoreError('invalid', 'That is not a memory document. Run it through validateDoc first.');
    }
    const nodes = new Map<NodeId, MemoryNode>();
    const relations = new Map<RelationId, Relation>();
    const perspectives = new Map<PerspectiveId, Perspective>();
    const adjacency = new Map<NodeId, Set<RelationId>>();
    for (const p of doc.perspectives) {
      if (perspectives.has(p.id)) throw new CoreError('duplicate', `Two perspectives share the id "${p.id}".`);
      perspectives.set(p.id, deepFreeze(canonPerspective(p)));
    }
    for (const n of doc.nodes) {
      if (nodes.has(n.id)) throw new CoreError('duplicate', `Two nodes share the id "${n.id}".`);
      nodes.set(n.id, deepFreeze(canonNode(n)));
      adjacency.set(n.id, new Set());
    }
    for (const r of doc.relations) {
      if (relations.has(r.id)) throw new CoreError('duplicate', `Two lines share the id "${r.id}".`);
      const a = adjacency.get(r.from);
      const b = adjacency.get(r.to);
      if (!a || !b) throw new CoreError('not-found', `Line "${r.id}" touches a node that doesn't exist.`);
      relations.set(r.id, deepFreeze(canonRelation(r)));
      a.add(r.id);
      b.add(r.id);
    }
    this.#meta = deepFreeze(canonMeta(doc.meta));
    this.#nodes = nodes;
    this.#relations = relations;
    this.#perspectives = perspectives;
    this.#adjacency = adjacency;
    this.#nodeList = this.#relationList = this.#perspectiveList = null;
    this.#adjCache.clear();
    this.#nextNode = 1;
    this.#nextRelation = 1;
  }

  #attach(r: Relation): void {
    this.#relations.set(r.id, r);
    this.#adjacency.get(r.from)!.add(r.id);
    this.#adjacency.get(r.to)!.add(r.id);
    this.#adjCache.delete(r.from);
    this.#adjCache.delete(r.to);
    this.#relationList = null;
  }

  #detach(r: Relation): void {
    this.#relations.delete(r.id);
    this.#adjacency.get(r.from)?.delete(r.id);
    this.#adjacency.get(r.to)?.delete(r.id);
    this.#adjCache.delete(r.from);
    this.#adjCache.delete(r.to);
    this.#relationList = null;
  }

  #emit(event: GraphEvent): void {
    for (const l of [...this.#listeners]) l(event);
  }

  #requireNode(id: NodeId): MemoryNode {
    const n = this.#nodes.get(id);
    if (!n) throw new CoreError('not-found', `No node has the id "${id}".`);
    return n;
  }

  #freshId(prefix: string, taken: Map<string, unknown>, next: () => number): string {
    for (;;) {
      const id = prefix + next().toString(36);
      if (!taken.has(id)) return id;
    }
  }

  /** Strictly increasing ms timestamps, so `updated` orders edits even within one millisecond. */
  #stamp(): number {
    const now = Date.now();
    this.#lastStamp = now > this.#lastStamp ? now : this.#lastStamp + 1;
    return this.#lastStamp;
  }

  #checkNode(n: MemoryNode): void {
    if (typeof n.label !== 'string' || !n.label.trim()) throw new CoreError('invalid', 'Give it a name, even one word.');
    if (!(NODE_KINDS as readonly string[]).includes(n.kind)) throw new CoreError('invalid', `"${String(n.kind)}" isn't a kind of node. Use concept, variable, file, note or pathway.`);
    checkValue(n.value, 'Its value');
    for (const [p, v] of Object.entries(n.facets)) {
      if (!this.#perspectives.has(p)) throw new CoreError('invalid', `There is no perspective "${p}" to hold a value for.`);
      checkValue(v as Value, `Its value under ${this.#perspectives.get(p)!.label}`);
    }
    if (n.units !== undefined) {
      if (!n.units || typeof n.units !== 'object' || Array.isArray(n.units)) throw new CoreError('invalid', 'Units must be an object of perspective → unit text.');
      for (const [p, u] of Object.entries(n.units)) {
        if (p !== '*' && !this.#perspectives.has(p)) throw new CoreError('invalid', `There is no perspective "${p}" to hold a unit for.`);
        if (typeof u !== 'string' || !u.trim() || u.length > MAX_UNIT_CHARS) throw new CoreError('invalid', `A unit is a short piece of text (up to ${MAX_UNIT_CHARS} characters), like "°C".`);
      }
    }
    if (!Array.isArray(n.tags) || n.tags.some((t) => typeof t !== 'string')) throw new CoreError('invalid', 'Tags must be a list of words.');
    if (n.notes !== undefined && typeof n.notes !== 'string') throw new CoreError('invalid', 'Notes must be text.');
    if (n.file !== undefined) {
      if (typeof n.file.name !== 'string' || !n.file.name.trim()) throw new CoreError('invalid', 'A file needs a name.');
      if (n.file.content !== undefined && (typeof n.file.content !== 'string' || n.file.content.length > MAX_FILE_CONTENT)) {
        throw new CoreError('invalid', 'File contents hold up to 64 KB of text. Store a path to anything bigger.');
      }
    }
    if (n.pathway !== undefined && n.kind !== 'pathway') throw new CoreError('invalid', 'Only pathway nodes can carry a pathway step.');
  }

  #checkRelation(r: Relation): void {
    if (!this.#nodes.has(r.from)) throw new CoreError('not-found', `A line can't start at "${r.from}": no node has that id.`);
    if (!this.#nodes.has(r.to)) throw new CoreError('not-found', `A line can't end at "${r.to}": no node has that id.`);
    if (r.from === r.to) throw new CoreError('invalid', 'A line needs two different ends.');
    if (!(RELATION_TYPES as readonly string[]).includes(r.type)) throw new CoreError('invalid', `"${String(r.type)}" isn't a type of line.`);
    if (typeof r.weight !== 'number' || !(r.weight > 0 && r.weight <= 1)) throw new CoreError('invalid', 'A line\'s weight must be above 0 and at most 1.');
    if (typeof r.directed !== 'boolean') throw new CoreError('invalid', 'A line is either directed or not.');
    if (r.type === 'flow' && !r.directed) throw new CoreError('invalid', 'Pathway (flow) lines always point one way.');
    if (r.branch !== undefined) {
      if (r.type !== 'flow') throw new CoreError('invalid', 'Only pathway (flow) lines have a branch.');
      if (!(FLOW_BRANCHES as readonly string[]).includes(r.branch)) throw new CoreError('invalid', `"${String(r.branch)}" isn't a branch. Use next, true or false.`);
    }
    if (r.perspectives !== undefined) {
      if (!Array.isArray(r.perspectives) || r.perspectives.length === 0) throw new CoreError('invalid', 'A lens-only line needs at least one perspective.');
      for (const p of r.perspectives) if (!this.#perspectives.has(p)) throw new CoreError('invalid', `There is no perspective "${p}" for this line to appear in.`);
    }
  }

  #checkPerspective(p: Perspective): void {
    if (typeof p.label !== 'string' || !p.label.trim()) throw new CoreError('invalid', 'A perspective needs a name.');
    for (const [id, v] of Object.entries(p.positions ?? {})) {
      if (!v || ![v.x, v.y, v.z].every((c) => typeof c === 'number' && Number.isFinite(c))) {
        throw new CoreError('invalid', `The position for "${id}" needs finite x, y and z numbers.`);
      }
    }
  }
}

function checkValue(v: Value, what: string): void {
  if (!isValue(v)) throw new CoreError('invalid', `${what} must be text, a number, true/false or empty.`);
  if (typeof v === 'string' && v.length > MAX_VALUE_CHARS) throw new CoreError('invalid', 'Values hold up to 500 characters. Put longer text in a File.');
}
