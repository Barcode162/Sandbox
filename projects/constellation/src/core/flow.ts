// src/core/flow.ts — pathway interpreter. Signatures FROZEN; bodies are WO-002's.
// A pathway is the set of `pathway` nodes reachable from a `start` node over `flow` relations.
// References (@Label) and `read` resolve under the given perspective, so one pathway can give
// different results per perspective (brief → Definition of exceptional 4).
import { notImplemented } from './errors.ts';
import type { MemoryGraph, MemoryNode, NodeId, PerspectiveId, RunOptions, Trace, TraceStep } from './types.ts';

/** All `start` pathway nodes, sorted by label. */
export function listPathways(graph: MemoryGraph): MemoryNode[] {
  void graph;
  return notImplemented('listPathways');
}

/** Node ids reachable from `start` over flow relations (the pathway's body), BFS order. */
export function pathwayNodes(graph: MemoryGraph, start: NodeId): NodeId[] {
  void [graph, start];
  return notImplemented('pathwayNodes');
}

/**
 * Step-wise execution: yields one TraceStep per visited node; returns the final Trace.
 * Never throws for user errors (bad expr, missing branch, unknown ref): the Trace ends with
 * status 'error' and a human `error`. Hitting maxSteps → status 'max-steps'.
 */
export function stepPathway(graph: MemoryGraph, start: NodeId, perspective: PerspectiveId, options?: RunOptions): Generator<TraceStep, Trace, void> {
  void [graph, start, perspective, options];
  return notImplemented('stepPathway');
}

/** Runs stepPathway to completion. */
export function runPathway(graph: MemoryGraph, start: NodeId, perspective: PerspectiveId, options?: RunOptions): Trace {
  void [graph, start, perspective, options];
  return notImplemented('runPathway');
}
