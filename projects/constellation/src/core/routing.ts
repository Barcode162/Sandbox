// src/core/routing.ts — declared chain vs weighted shortest path; learning shortcuts.
// Signatures FROZEN; bodies are WO-002's. Ties break by fewer hops, then lexicographic node ids.
import { notImplemented } from './errors.ts';
import type { MemoryGraph, NodeId, Relation, Route, RouteComparison, RouteOptions } from './types.ts';

/** Follows only `chain` relations (respecting direction). Null if `to` is not on a chain from `from`. */
export function declaredPath(graph: MemoryGraph, from: NodeId, to: NodeId, options?: RouteOptions): Route | null {
  void [graph, from, to, options];
  return notImplemented('declaredPath');
}

/** Dijkstra over routable relations, cost 1 / weight per hop. */
export function shortestPath(graph: MemoryGraph, from: NodeId, to: NodeId, options?: RouteOptions): Route | null {
  void [graph, from, to, options];
  return notImplemented('shortestPath');
}

export function compareRoutes(graph: MemoryGraph, from: NodeId, to: NodeId, options?: RouteOptions): RouteComparison {
  void [graph, from, to, options];
  return notImplemented('compareRoutes');
}

/**
 * Adds one undirected `shortcut` relation route.nodes[0] ↔ route.nodes.at(-1) (default weight 0.9).
 * Idempotent: if that shortcut already exists, returns it unchanged. Throws CoreError 'invalid' for hops < 2.
 */
export function learnShortcut(graph: MemoryGraph, route: Route, weight?: number): Relation {
  void [graph, route, weight];
  return notImplemented('learnShortcut');
}
