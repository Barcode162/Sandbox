// src/core/routing.ts — declared chain vs weighted shortest path; learning shortcuts.
// Signatures FROZEN; bodies are WO-002's. Ties break by fewer hops, then lexicographic node ids.
//
// Both routes come from one Dijkstra. Its labels are ordered by (cost, hops, node-id sequence);
// that order survives appending the same hop to two equal-hop paths, so the classic greedy
// argument holds and the tie-break is exact, not a heuristic.
import { CoreError } from './errors.ts';
import { isRelationVisible } from './perspectives.ts';
import type { MemoryGraph, NodeId, Relation, RelationType, Route, RouteComparison, RouteKind, RouteOptions } from './types.ts';

const EPS = 1e-9;

/** Follows only `chain` relations (respecting direction). Null if `to` is not on a chain from `from`. */
export function declaredPath(graph: MemoryGraph, from: NodeId, to: NodeId, options?: RouteOptions): Route | null {
  return search(graph, from, to, options, 'declared');
}

/** Dijkstra over routable relations, cost 1 / weight per hop. */
export function shortestPath(graph: MemoryGraph, from: NodeId, to: NodeId, options?: RouteOptions): Route | null {
  return search(graph, from, to, options, 'shortest');
}

export function compareRoutes(graph: MemoryGraph, from: NodeId, to: NodeId, options?: RouteOptions): RouteComparison {
  const declared = declaredPath(graph, from, to, options);
  const shortest = shortestPath(graph, from, to, options);
  return { from, to, declared, shortest, savedHops: declared && shortest ? declared.hops - shortest.hops : 0 };
}

/**
 * Adds one undirected `shortcut` relation route.nodes[0] ↔ route.nodes.at(-1) (default weight 0.9).
 * Idempotent: if that shortcut already exists, returns it unchanged. Throws CoreError 'invalid' for hops < 2.
 */
export function learnShortcut(graph: MemoryGraph, route: Route, weight = 0.9): Relation {
  return learnShortcutDetailed(graph, route, weight).relation;
}

/** What learning did, so the UI can say "Learned" only when something changed, and undo exactly that. */
export interface LearnResult {
  relation: Relation;
  /** 'added': a new shortcut · 'widened': an existing lens-only shortcut now shows in every lens · 'existing': nothing changed. */
  outcome: 'added' | 'widened' | 'existing';
  /** true unless outcome is 'existing'. */
  learned: boolean;
  /** For 'widened': the relation before, to restore on undo (graph.updateRelation(id, { perspectives })). */
  previous?: Relation;
}

/**
 * learnShortcut with its outcome. A learned shortcut is visible in every lens (§5: "added in all
 * lenses"), so an existing shortcut that is hidden in some lens is never returned as-is: an
 * unrestricted one is reused, else a lens-only one is widened to all lenses.
 */
export function learnShortcutDetailed(graph: MemoryGraph, route: Route, weight = 0.9): LearnResult {
  if (!route || route.hops < 2 || route.nodes.length < 3) throw new CoreError('invalid', 'Already one hop. Nothing shorter to learn.');
  const a = route.nodes[0]!;
  const b = route.nodes[route.nodes.length - 1]!;
  if (a === b) throw new CoreError('invalid', 'That route ends where it starts, so there is no shortcut to learn.');
  const existing = graph
    .relationsOf(a)
    .filter((r) => r.type === 'shortcut' && ((r.from === a && r.to === b) || (r.from === b && r.to === a)))
    .sort((p, q) => (p.id < q.id ? -1 : 1));
  const everywhere = existing.find((r) => r.perspectives === undefined);
  if (everywhere) return { relation: everywhere, outcome: 'existing', learned: false };
  const hidden = existing[0];
  if (hidden) {
    const relation = graph.updateRelation(hidden.id, { perspectives: undefined });
    return { relation, outcome: 'widened', learned: true, previous: hidden };
  }
  return { relation: graph.addRelation({ from: a, to: b, type: 'shortcut', weight, directed: false }), outcome: 'added', learned: true };
}

// ── search ────────────────────────────────────────────────────────────────────────────────
interface Label {
  node: NodeId;
  cost: number;
  hops: number;
  nodes: NodeId[];
  relations: string[];
}

function compareLabels(p: Label, q: Label): number {
  if (Math.abs(p.cost - q.cost) > EPS) return p.cost - q.cost;
  if (p.hops !== q.hops) return p.hops - q.hops;
  const len = Math.min(p.nodes.length, q.nodes.length);
  for (let i = 0; i < len; i++) {
    const x = p.nodes[i]!, y = q.nodes[i]!;
    if (x !== y) return x < y ? -1 : 1;
  }
  return p.nodes.length - q.nodes.length;
}

function search(graph: MemoryGraph, from: NodeId, to: NodeId, options: RouteOptions | undefined, kind: RouteKind): Route | null {
  if (!graph.getNode(from) || !graph.getNode(to)) return null;
  if (from === to) return { kind, nodes: [from], relations: [], hops: 0, cost: 0 };
  const exclude = new Set<RelationType>(options?.excludeTypes ?? ['flow']);
  const perspective = options?.perspective;
  const usable = (r: Relation) =>
    (kind === 'declared' ? r.type === 'chain' : !exclude.has(r.type)) && (perspective === undefined || isRelationVisible(r, perspective));

  const best = new Map<NodeId, Label>();
  const done = new Set<NodeId>();
  const heap = new Heap<Label>(compareLabels);
  const start: Label = { node: from, cost: 0, hops: 0, nodes: [from], relations: [] };
  best.set(from, start);
  heap.push(start);
  while (heap.size) {
    const cur = heap.pop()!;
    if (done.has(cur.node) || best.get(cur.node) !== cur) continue;
    done.add(cur.node);
    if (cur.node === to) return { kind, nodes: cur.nodes, relations: cur.relations, hops: cur.hops, cost: round(cur.cost) };
    for (const r of graph.relationsOf(cur.node)) {
      if (!usable(r)) continue;
      let next: NodeId;
      if (r.from === cur.node) next = r.to;
      else if (!r.directed) next = r.from;
      else continue;
      if (done.has(next)) continue;
      const cand: Label = {
        node: next,
        cost: cur.cost + 1 / r.weight,
        hops: cur.hops + 1,
        nodes: [...cur.nodes, next],
        relations: [...cur.relations, r.id],
      };
      const prev = best.get(next);
      if (!prev || compareLabels(cand, prev) < 0) {
        best.set(next, cand);
        heap.push(cand);
      }
    }
  }
  return null;
}

/** Sum-of-reciprocals noise (0.1 + 0.2 …) trimmed so costs compare and print cleanly. */
function round(n: number): number {
  return Math.round(n * 1e9) / 1e9;
}

class Heap<T> {
  #items: T[] = [];
  #cmp: (a: T, b: T) => number;
  constructor(cmp: (a: T, b: T) => number) { this.#cmp = cmp; }
  get size(): number { return this.#items.length; }
  push(item: T): void {
    const a = this.#items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.#cmp(a[i]!, a[p]!) >= 0) break;
      [a[i], a[p]] = [a[p]!, a[i]!];
      i = p;
    }
  }
  pop(): T | undefined {
    const a = this.#items;
    const top = a[0];
    const last = a.pop();
    if (a.length && last !== undefined) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && this.#cmp(a[l]!, a[m]!) < 0) m = l;
        if (r < a.length && this.#cmp(a[r]!, a[m]!) < 0) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m]!, a[i]!];
        i = m;
      }
    }
    return top;
  }
}
