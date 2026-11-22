// src/core/perspectives.ts — facets & per-perspective visibility. Signatures FROZEN; bodies are WO-002's.
import { notImplemented } from './errors.ts';
import type { FacetView, MemoryGraph, MemoryNode, Perspective, PerspectiveId, Relation, Value } from './types.ts';

/** node.facets[perspective] if the key exists (even if null), else node.value. */
export function resolveValue(node: MemoryNode, perspective: PerspectiveId): Value {
  void [node, perspective];
  return notImplemented('resolveValue');
}

/** One FacetView per perspective, in the given order. */
export function facetsOf(node: MemoryNode, perspectives: readonly Perspective[]): FacetView[] {
  void [node, perspectives];
  return notImplemented('facetsOf');
}

/** True when the resolved values across `perspectives` are not all equal (strict, by JSON value). */
export function disagrees(node: MemoryNode, perspectives: readonly Perspective[]): boolean {
  void [node, perspectives];
  return notImplemented('disagrees');
}

/** relation.perspectives absent, or includes `perspective`. */
export function isRelationVisible(relation: Relation, perspective: PerspectiveId): boolean {
  void [relation, perspective];
  return notImplemented('isRelationVisible');
}

export function visibleRelations(graph: MemoryGraph, perspective: PerspectiveId): Relation[] {
  void [graph, perspective];
  return notImplemented('visibleRelations');
}
