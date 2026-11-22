// src/core/graph.ts — graph store. Signatures FROZEN; bodies are WO-002's.
import { notImplemented } from './errors.ts';
import type { MemoryDoc, MemoryGraph } from './types.ts';

/** New store, optionally loaded from an already-validated document. Ids generated as `n_<base36>` / `r_<base36>`. */
export function createGraph(doc?: MemoryDoc): MemoryGraph {
  void doc;
  return notImplemented('createGraph');
}

/** A valid empty document (one perspective, id 'base'). */
export function emptyDoc(title = 'Untitled memory'): MemoryDoc {
  void title;
  return notImplemented('emptyDoc');
}
