// src/core/persistence.ts — versioned JSON format, validation, autosave. Signatures FROZEN; bodies are WO-002's.
// The seed (src/seed/memory.json), exports, imports and autosave all go through validateDoc.
// Messages are for strangers: `nodes[3] ("Kettle") has no label.` not `ValidationError: required`.
// Referential checks: relation endpoints, facet keys, perspective.positions keys, read.source,
// meta.defaultPerspective and meta.featured ids must exist; duplicate ids are errors.
import { notImplemented } from './errors.ts';
import type { AutosaveOptions, ImportResult, KeyValueStorage, MemoryDoc, MemoryGraph, Unsubscribe } from './types.ts';

export const AUTOSAVE_KEY = 'constellation.memory.v1';

export function validateDoc(input: unknown): ImportResult {
  void input;
  return notImplemented('validateDoc');
}

/** JSON.parse with a human message on syntax errors, then validateDoc. */
export function importJson(text: string): ImportResult {
  void text;
  return notImplemented('importJson');
}

export function exportDoc(graph: MemoryGraph): MemoryDoc {
  void graph;
  return notImplemented('exportDoc');
}

/** Stable, pretty (2-space) JSON of exportDoc. */
export function exportJson(graph: MemoryGraph): string {
  void graph;
  return notImplemented('exportJson');
}

/** null when nothing is stored under the key. */
export function loadSaved(storage: KeyValueStorage, key?: string): ImportResult | null {
  void [storage, key];
  return notImplemented('loadSaved');
}

/** Saves (debounced) after every graph event. The returned function flushes once and stops. */
export function startAutosave(graph: MemoryGraph, storage: KeyValueStorage, options?: AutosaveOptions): Unsubscribe {
  void [graph, storage, options];
  return notImplemented('startAutosave');
}
