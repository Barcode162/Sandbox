// src/core/internal.ts — helpers shared by core modules. Not exported from index.ts.
// Canonical shapes live here so that validateDoc's output and exportDoc's output have the same
// key order and the same optional-field rules: that is what makes export → import deep-equal.
import type { FileRef, MemoryMeta, MemoryNode, PathwayStep, Perspective, Relation, Value, Vec3 } from './types.ts';

/** FNV-1a 32-bit string hash. Deterministic across runs and engines. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG: returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** Names that could reach Object.prototype machinery. Never valid as variables. */
const RESERVED = new Set(['constructor', 'prototype', '__proto__', 'hasOwnProperty', 'toString', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString']);
export function isReservedName(name: string): boolean {
  return RESERVED.has(name) || name.startsWith('__');
}
export function isVariableName(name: unknown): name is string {
  return typeof name === 'string' && IDENTIFIER.test(name) && !isReservedName(name) && !['and', 'or', 'not', 'true', 'false', 'null'].includes(name);
}

export function isValue(v: unknown): v is Value {
  return v === null || typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v));
}

export function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Numbers without float noise: 0.1 + 0.2 → "0.3". */
export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(12)));
}

/** How a value reads in notes and messages: text quoted, numbers trimmed. */
export function showValue(v: Value): string {
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number') return formatNumber(v);
  return String(v);
}

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  }
  return value;
}

// ── Canonical copies (fixed key order, optional keys only when present) ─────────────────
export function canonVec(v: Vec3): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}

export function canonFile(f: FileRef): FileRef {
  const out: FileRef = { name: f.name };
  if (f.path !== undefined) out.path = f.path;
  if (f.mime !== undefined) out.mime = f.mime;
  if (f.sizeNote !== undefined) out.sizeNote = f.sizeNote;
  if (f.content !== undefined) out.content = f.content;
  return out;
}

export function canonStep(s: PathwayStep): PathwayStep {
  const out: PathwayStep = { op: s.op };
  if (s.target !== undefined) out.target = s.target;
  if (s.expr !== undefined) out.expr = s.expr;
  if (s.source !== undefined) out.source = s.source;
  return out;
}

export function canonFacets(f: Partial<Record<string, Value>>): Partial<Record<string, Value>> {
  const out: Partial<Record<string, Value>> = {};
  for (const [k, v] of Object.entries(f)) if (v !== undefined) out[k] = v;
  return out;
}

export function canonNode(n: MemoryNode): MemoryNode {
  const out: Record<string, unknown> = { id: n.id, label: n.label, kind: n.kind, value: n.value, facets: canonFacets(n.facets), tags: [...n.tags] };
  if (n.notes !== undefined) out.notes = n.notes;
  if (n.file !== undefined) out.file = canonFile(n.file);
  if (n.pathway !== undefined) out.pathway = canonStep(n.pathway);
  out.created = n.created;
  out.updated = n.updated;
  return out as unknown as MemoryNode;
}

export function canonRelation(r: Relation): Relation {
  const out: Record<string, unknown> = { id: r.id, from: r.from, to: r.to, type: r.type, weight: r.weight, directed: r.directed };
  if (r.branch !== undefined) out.branch = r.branch;
  if (r.label !== undefined) out.label = r.label;
  if (r.perspectives !== undefined) out.perspectives = [...r.perspectives];
  out.created = r.created;
  return out as unknown as Relation;
}

export function canonPerspective(p: Perspective): Perspective {
  const out: Perspective = { id: p.id, label: p.label };
  if (p.description !== undefined) out.description = p.description;
  if (p.accent !== undefined) out.accent = p.accent;
  if (p.positions !== undefined) {
    const pos: Partial<Record<string, Vec3>> = {};
    for (const [k, v] of Object.entries(p.positions)) if (v) pos[k] = canonVec(v);
    out.positions = pos;
  }
  return out;
}

export function canonMeta(m: MemoryMeta): MemoryMeta {
  const out: MemoryMeta = m.description !== undefined
    ? { title: m.title, description: m.description, defaultPerspective: m.defaultPerspective }
    : { title: m.title, defaultPerspective: m.defaultPerspective };
  if (m.featured !== undefined) {
    const f: NonNullable<MemoryMeta['featured']> = {};
    if (m.featured.route) f.route = { from: m.featured.route.from, to: m.featured.route.to };
    if (m.featured.pathway !== undefined) f.pathway = m.featured.pathway;
    if (m.featured.query !== undefined) f.query = m.featured.query;
    out.featured = f;
  }
  return out;
}

/** "Temperature" for nodes[3] when it has a label; used to make messages name things. */
export function quoteLabel(label: unknown): string {
  return typeof label === 'string' && label.trim() ? ` ("${label.trim()}")` : '';
}

export const MAX_VALUE_CHARS = 500;
export const MAX_FILE_CONTENT = 64 * 1024;
export const NODE_KINDS = ['concept', 'variable', 'file', 'note', 'pathway'] as const;
export const RELATION_TYPES = ['association', 'chain', 'part-of', 'causes', 'shortcut', 'flow'] as const;
export const PATHWAY_OPS = ['start', 'assign', 'if', 'while', 'read', 'end'] as const;
export const FLOW_BRANCHES = ['next', 'true', 'false'] as const;
