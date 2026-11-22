// src/core/retrieval.ts — text match + spreading activation. Signatures FROZEN; bodies are WO-002's.
// Budget: retrieve() ≤ 10 ms on a 500-node graph in node (the 150 ms UI budget includes rendering).
import { notImplemented } from './errors.ts';
import type { Activation, ActivationOptions, Match, MemoryGraph, NodeId, PerspectiveId, RetrievalResult } from './types.ts';

/** Case- and accent-insensitive substring match over label, resolved value, facets, tags, notes, file name/path. Empty query → []. */
export function search(graph: MemoryGraph, query: string, perspective?: PerspectiveId): Match[] {
  void [graph, query, perspective];
  return notImplemented('search');
}

/** Breadth-first spread from seeds over visible, non-flow relations (both directions). */
export function spreadActivation(graph: MemoryGraph, seeds: ReadonlyArray<{ nodeId: NodeId; activation: number }>, options?: ActivationOptions): Activation[] {
  void [graph, seeds, options];
  return notImplemented('spreadActivation');
}

/** search() then spreadActivation() seeded with match scores. */
export function retrieve(graph: MemoryGraph, query: string, options?: ActivationOptions): RetrievalResult {
  void [graph, query, options];
  return notImplemented('retrieve');
}
