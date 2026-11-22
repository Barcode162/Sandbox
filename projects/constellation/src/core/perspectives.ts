// src/core/perspectives.ts — facets & per-perspective visibility. Signatures FROZEN; bodies are WO-002's.
import { hasOwn, unitOf, withUnit } from './internal.ts';
import type { FacetView, MemoryGraph, MemoryNode, Perspective, PerspectiveId, Relation, Value } from './types.ts';

/** node.facets[perspective] if the key exists (even if null), else node.value. */
export function resolveValue(node: MemoryNode, perspective: PerspectiveId): Value {
  if (hasOwn(node.facets, perspective)) {
    const v = node.facets[perspective];
    if (v !== undefined) return v;
  }
  return node.value;
}

/** One FacetView per perspective, in the given order. */
export function facetsOf(node: MemoryNode, perspectives: readonly Perspective[]): FacetView[] {
  return perspectives.map((p) => {
    const own = hasOwn(node.facets, p.id) && node.facets[p.id] !== undefined;
    const view: FacetView = { perspective: p.id, value: resolveValue(node, p.id), own };
    const unit = unitOf(node, p.id);
    if (unit !== undefined) view.unit = unit;
    return view;
  });
}

/** True when the resolved values across `perspectives` are not all equal (strict, by JSON value). */
export function disagrees(node: MemoryNode, perspectives: readonly Perspective[]): boolean {
  if (perspectives.length < 2) return false;
  const first = resolveValue(node, perspectives[0]!.id);
  for (let i = 1; i < perspectives.length; i++) if (resolveValue(node, perspectives[i]!.id) !== first) return true;
  return false;
}

/** relation.perspectives absent, or includes `perspective`. */
export function isRelationVisible(relation: Relation, perspective: PerspectiveId): boolean {
  return relation.perspectives === undefined || relation.perspectives.includes(perspective);
}

export function visibleRelations(graph: MemoryGraph, perspective: PerspectiveId): Relation[] {
  return graph.relations().filter((r) => isRelationVisible(r, perspective));
}

/**
 * Display text for a value with its unit: "20 °C", "293 K", "2 · warm"; text values as they are;
 * null as "empty". Units attach to numbers only. (Additive export, WO-002 units follow-up.)
 */
export function formatValue(value: Value, unit?: string): string {
  return withUnit(value, unit);
}
