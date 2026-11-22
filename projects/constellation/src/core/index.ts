// src/core/index.ts — the ONLY import path the view/ui may use (`../core/index.ts`). FROZEN.
// Adding an export is allowed for WO-002 (additive); removing or changing one is a CEO decision.
export * from './types.ts';
export { CoreError } from './errors.ts';
export { createGraph, emptyDoc } from './graph.ts';
export { resolveValue, facetsOf, disagrees, isRelationVisible, visibleRelations } from './perspectives.ts';
export { forceLayout, layoutFor } from './layout.ts';
export { declaredPath, shortestPath, compareRoutes, learnShortcut } from './routing.ts';
export { search, spreadActivation, retrieve } from './retrieval.ts';
export { parseExpr, evaluate, references, isTruthy } from './expr.ts';
export { listPathways, pathwayNodes, stepPathway, runPathway } from './flow.ts';
export { AUTOSAVE_KEY, validateDoc, importJson, exportDoc, exportJson, loadSaved, startAutosave } from './persistence.ts';
