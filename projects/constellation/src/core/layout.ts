// src/core/layout.ts — positions per perspective. Signatures FROZEN; bodies are WO-002's.
// Determinism: same nodes + relations + options → bit-identical positions (seeded PRNG from a
// string hash of id + seed; no Math.random, no Date). Must finish ≤ 50 ms for 500 nodes in node.
import { notImplemented } from './errors.ts';
import type { ForceLayoutOptions, MemoryGraph, MemoryNode, NodeId, PerspectiveId, Relation, Vec3 } from './types.ts';

export function forceLayout(nodes: readonly MemoryNode[], relations: readonly Relation[], options?: ForceLayoutOptions): Map<NodeId, Vec3> {
  void [nodes, relations, options];
  return notImplemented('forceLayout');
}

/**
 * Every node gets a position: authored perspective.positions win; the rest come from forceLayout
 * over the relations visible in that perspective, seeded with the perspective id, with authored
 * nodes held fixed.
 */
export function layoutFor(graph: MemoryGraph, perspective: PerspectiveId): Map<NodeId, Vec3> {
  void [graph, perspective];
  return notImplemented('layoutFor');
}
