// src/core/retrieval.ts — text match + spreading activation. Signatures FROZEN; bodies are WO-002's.
// Budget: retrieve() ≤ 10 ms on a 500-node graph in node (the 150 ms UI budget includes rendering).
//
// Match scores (best field wins per node): label exact 1 · label starts with the query 0.9 ·
// a label word starts with it 0.8 · label contains it 0.7 · active-lens value 0.6 · file name or
// path 0.55 · tag 0.5 · another lens's facet 0.45 · notes 0.4.
// Activation: seeds start at their score; one hop multiplies by decay × relation weight; a node
// keeps the best activation over all paths of ≤ maxDepth hops; depth is its fewest hops to a seed.
import { formatNumber } from './internal.ts';
import { isRelationVisible, resolveValue } from './perspectives.ts';
import type { Activation, ActivationOptions, Match, MatchField, MemoryGraph, NodeId, PerspectiveId, RetrievalResult, Value } from './types.ts';

/** Lowercase, accents stripped, whitespace collapsed. */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function valueText(v: Value): string | null {
  if (v === null) return null;
  return typeof v === 'number' ? formatNumber(v) : String(v);
}

/** Case- and accent-insensitive substring match over label, resolved value, facets, tags, notes, file name/path. Empty query → []. */
export function search(graph: MemoryGraph, query: string, perspective?: PerspectiveId): Match[] {
  const q = fold(query ?? '');
  if (!q) return [];
  const lens = perspective ?? graph.meta.defaultPerspective;
  const out: Match[] = [];
  for (const node of graph.nodes()) {
    let score = 0;
    let field: MatchField = 'label';
    const take = (s: number, f: MatchField) => { if (s > score) { score = s; field = f; } };
    const label = fold(node.label);
    if (label === q) take(1, 'label');
    else if (label.startsWith(q)) take(0.9, 'label');
    else if (label.split(/[^\p{L}\p{N}]+/u).some((w) => w.startsWith(q))) take(0.8, 'label');
    else if (label.includes(q)) take(0.7, 'label');
    if (score < 0.6) {
      const active = valueText(resolveValue(node, lens));
      if (active !== null && fold(active).includes(q)) take(0.6, 'value');
    }
    if (score < 0.55 && node.file) {
      if (fold(node.file.name).includes(q) || (node.file.path !== undefined && fold(node.file.path).includes(q))) take(0.55, 'file');
    }
    if (score < 0.5 && node.tags.some((t) => fold(t).includes(q))) take(0.5, 'tag');
    if (score < 0.45) {
      for (const v of [node.value, ...Object.values(node.facets)]) {
        const t = v === undefined ? null : valueText(v);
        if (t !== null && fold(t).includes(q)) { take(0.45, 'facet'); break; }
      }
    }
    if (score < 0.4 && node.notes !== undefined && fold(node.notes).includes(q)) take(0.4, 'notes');
    if (score > 0) out.push({ nodeId: node.id, score, field });
  }
  out.sort((a, b) => b.score - a.score || (a.nodeId < b.nodeId ? -1 : a.nodeId > b.nodeId ? 1 : 0));
  return out;
}

/** Breadth-first spread from seeds over visible, non-flow relations (both directions). */
export function spreadActivation(graph: MemoryGraph, seeds: ReadonlyArray<{ nodeId: NodeId; activation: number }>, options?: ActivationOptions): Activation[] {
  const decay = options?.decay ?? 0.6;
  const maxDepth = options?.maxDepth ?? 3;
  const threshold = options?.threshold ?? 0.05;
  const perspective = options?.perspective;

  const depth = new Map<NodeId, number>();
  const act = new Map<NodeId, number>();
  let frontier = new Map<NodeId, number>(); // node → activation that arrived this round
  for (const s of seeds) {
    if (!graph.getNode(s.nodeId) || !(s.activation >= threshold)) continue;
    const a = Math.min(1, s.activation);
    if (a > (act.get(s.nodeId) ?? 0)) act.set(s.nodeId, a);
    depth.set(s.nodeId, 0);
    if (a > (frontier.get(s.nodeId) ?? 0)) frontier.set(s.nodeId, a);
  }

  // Round d relaxes every path of exactly d hops; a node is pushed again only if it improved.
  for (let d = 1; d <= maxDepth && frontier.size; d++) {
    const next = new Map<NodeId, number>();
    for (const [id, a] of frontier) {
      for (const r of graph.relationsOf(id)) {
        if (r.type === 'flow' || (perspective !== undefined && !isRelationVisible(r, perspective))) continue;
        const other = r.from === id ? r.to : r.from;
        const v = a * decay * r.weight;
        if (v < threshold) continue;
        if (!depth.has(other)) depth.set(other, d);
        if (v > (act.get(other) ?? 0)) {
          act.set(other, v);
          if (v > (next.get(other) ?? 0)) next.set(other, v);
        }
      }
    }
    frontier = next;
  }

  const out: Activation[] = [];
  for (const [nodeId, activation] of act) out.push({ nodeId, depth: depth.get(nodeId)!, activation });
  out.sort((a, b) => b.activation - a.activation || a.depth - b.depth || (a.nodeId < b.nodeId ? -1 : a.nodeId > b.nodeId ? 1 : 0));
  return out;
}

/** search() then spreadActivation() seeded with match scores. */
export function retrieve(graph: MemoryGraph, query: string, options?: ActivationOptions): RetrievalResult {
  const matches = search(graph, query, options?.perspective);
  const activations = spreadActivation(graph, matches.map((m) => ({ nodeId: m.nodeId, activation: m.score })), options);
  return { query, matches, activations };
}
