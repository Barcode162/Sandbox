// src/core/persistence.ts — versioned JSON format, validation, autosave. Signatures FROZEN; bodies are WO-002's.
// The seed (src/seed/memory.json), exports, imports and autosave all go through validateDoc.
// Messages are for strangers: `nodes[3] ("Kettle") has no label.` not `ValidationError: required`.
// Referential checks: relation endpoints, facet keys, perspective.positions keys, read.source,
// meta.defaultPerspective and meta.featured ids must exist; duplicate ids are errors.
//
// One deliberate softening: a `read` step whose source node no longer exists is a *warning*, not
// an error. Deleting a node that a pathway reads is a legal edit (the run stops with "… no longer
// exists"), so the autosave of that memory must still load.
import {
  canonMeta, canonNode, canonPerspective, canonRelation, hasOwn, isValue, isVariableName, quoteLabel,
  FLOW_BRANCHES, MAX_FILE_CONTENT, MAX_UNIT_CHARS, MAX_VALUE_CHARS, NODE_KINDS, PATHWAY_OPS, RELATION_TYPES,
} from './internal.ts';
import { parseExpr } from './expr.ts';
import { CoreError } from './errors.ts';
import { SCHEMA_ID, SCHEMA_VERSION } from './types.ts';
import type {
  AutosaveOptions, ImportResult, KeyValueStorage, MemoryDoc, MemoryGraph, MemoryMeta, MemoryNode, Perspective,
  Relation, Unsubscribe, ValidationIssue,
} from './types.ts';

export const AUTOSAVE_KEY = 'constellation.memory.v1';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const typeName = (v: unknown): string => (v === null ? 'empty (null)' : Array.isArray(v) ? 'a list' : typeof v === 'object' ? 'an object' : typeof v === 'string' ? 'text' : `a ${typeof v}`);

const TOP_KEYS = ['schema', 'version', 'meta', 'perspectives', 'nodes', 'relations'];
const NODE_KEYS = ['id', 'label', 'kind', 'value', 'facets', 'units', 'tags', 'notes', 'file', 'pathway', 'created', 'updated'];
const REL_KEYS = ['id', 'from', 'to', 'type', 'weight', 'directed', 'branch', 'label', 'perspectives', 'created'];
const PERSP_KEYS = ['id', 'label', 'description', 'accent', 'positions'];

export function validateDoc(input: unknown): ImportResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const err = (path: string, message: string) => errors.push({ path, message });
  const warn = (path: string, message: string) => warnings.push({ path, message });

  if (!isObj(input)) {
    err('', `That file isn't a Constellation memory (it holds ${typeName(input)}, not an object).`);
    return { ok: false, errors };
  }
  // Envelope first: when it is wrong, nothing else is worth reporting.
  if (!hasOwn(input, 'schema')) err('schema', 'That file isn\'t a Constellation memory (missing "schema").');
  else if (input.schema !== SCHEMA_ID) err('schema', `That file isn't a Constellation memory (its schema is ${JSON.stringify(input.schema)}, expected "${SCHEMA_ID}").`);
  if (!hasOwn(input, 'nodes')) err('nodes', 'That file isn\'t a Constellation memory (missing "nodes").');
  if (!hasOwn(input, 'version')) err('version', 'That file has no "version", so it can\'t be read safely. Add "version": 1.');
  else if (!Number.isInteger(input.version) || (input.version as number) < 1) err('version', `The version ${JSON.stringify(input.version)} isn't one this app knows. It should be 1.`);
  else if ((input.version as number) > SCHEMA_VERSION) err('version', `This memory is from a newer version (v${input.version}). Update the app to open it.`);
  if (errors.length) return { ok: false, errors };

  for (const key of Object.keys(input)) if (!TOP_KEYS.includes(key)) warn(key, `"${key}" isn't part of the memory format, so it was ignored.`);

  // ── perspectives ──
  const perspectiveIds = new Set<string>();
  const perspectives: Perspective[] = [];
  if (!Array.isArray(input.perspectives)) err('perspectives', 'The memory needs a "perspectives" list with at least one perspective.');
  else if (input.perspectives.length === 0) err('perspectives', 'The memory needs at least one perspective in "perspectives".');
  else input.perspectives.forEach((p, i) => {
    const at = `perspectives[${i}]`;
    if (!isObj(p)) { err(at, `${at} should be an object with an id and a label, but it is ${typeName(p)}.`); return; }
    const name = `${at}${quoteLabel(p.label)}`;
    let ok = true;
    if (!isText(p.id) || !p.id.trim()) { err(`${at}.id`, `${name} has no id.`); ok = false; }
    else if (perspectiveIds.has(p.id)) { err(`${at}.id`, `${name} uses the id "${p.id}", which another perspective already has.`); ok = false; }
    if (!isText(p.label) || !p.label.trim()) { err(`${at}.label`, `${name} has no label.`); ok = false; }
    if (p.description !== undefined && !isText(p.description)) { err(`${at}.description`, `${name} has a description that isn't text.`); ok = false; }
    if (p.accent !== undefined && !isText(p.accent)) { err(`${at}.accent`, `${name} has an accent colour that isn't text.`); ok = false; }
    if (p.positions !== undefined && !isObj(p.positions)) { err(`${at}.positions`, `${name} has "positions" that aren't an object of node id → {x, y, z}.`); ok = false; }
    for (const key of Object.keys(p)) if (!PERSP_KEYS.includes(key)) warn(`${at}.${key}`, `"${key}" isn't part of a perspective, so it was ignored.`);
    if (isText(p.id)) perspectiveIds.add(p.id);
    if (ok) perspectives.push(p as unknown as Perspective);
  });

  // ── nodes ──
  const nodeIds = new Map<string, number>();
  const nodes: MemoryNode[] = [];
  const readSources: Array<{ at: string; name: string; source: string }> = [];
  if (!Array.isArray(input.nodes)) err('nodes', `"nodes" should be a list, but it is ${typeName(input.nodes)}.`);
  else input.nodes.forEach((n, i) => {
    const at = `nodes[${i}]`;
    if (!isObj(n)) { err(at, `${at} should be an object, but it is ${typeName(n)}.`); return; }
    const name = `${at}${quoteLabel(n.label)}`;
    const before = errors.length;
    if (!isText(n.id) || !n.id.trim()) err(`${at}.id`, `${name} has no id.`);
    else if (nodeIds.has(n.id)) err(`${at}.id`, `${name} uses the id "${n.id}", which nodes[${nodeIds.get(n.id)}] already has. Ids must be unique.`);
    else nodeIds.set(n.id, i);
    if (!isText(n.label) || !n.label.trim()) err(`${at}.label`, `${name} has no label. Give it a name, even one word.`);
    if (!(NODE_KINDS as readonly unknown[]).includes(n.kind)) err(`${at}.kind`, `${name} has the kind ${JSON.stringify(n.kind)}. Use one of: ${NODE_KINDS.join(', ')}.`);
    checkValue(n.value, `${at}.value`, `The value of ${name}`, err);
    if (!isObj(n.facets)) err(`${at}.facets`, `${name} needs "facets" (an object, even if empty).`);
    else for (const [pid, v] of Object.entries(n.facets)) {
      if (!perspectiveIds.has(pid)) err(`${at}.facets.${pid}`, `${name} has a value for the perspective "${pid}", which doesn't exist in this memory.`);
      checkValue(v, `${at}.facets.${pid}`, `The "${pid}" value of ${name}`, err);
    }
    if (n.units !== undefined) {
      if (!isObj(n.units)) err(`${at}.units`, `${name} has "units" that aren't an object of perspective id → unit text (use "*" for every lens).`);
      else for (const [pid, u] of Object.entries(n.units)) {
        if (pid !== '*' && !perspectiveIds.has(pid)) err(`${at}.units.${pid}`, `${name} has a unit for the perspective "${pid}", which doesn't exist in this memory.`);
        if (!isText(u) || !u.trim()) err(`${at}.units.${pid}`, `${name} has a "${pid}" unit that isn't text. A unit is short text like "°C".`);
        else if (u.length > MAX_UNIT_CHARS) err(`${at}.units.${pid}`, `${name} has a "${pid}" unit of ${u.length} characters. Units hold up to ${MAX_UNIT_CHARS} characters.`);
      }
    }
    if (!Array.isArray(n.tags) || n.tags.some((t) => !isText(t))) err(`${at}.tags`, `${name} needs "tags" as a list of words (it can be empty).`);
    if (n.notes !== undefined && !isText(n.notes)) err(`${at}.notes`, `${name} has notes that aren't text.`);
    if (n.file !== undefined) {
      const f = n.file;
      if (!isObj(f)) err(`${at}.file`, `${name} has a "file" that isn't an object.`);
      else {
        if (!isText(f.name) || !f.name.trim()) err(`${at}.file.name`, `${name} refers to a file without a name.`);
        for (const k of ['path', 'mime', 'sizeNote'] as const) if (f[k] !== undefined && !isText(f[k])) err(`${at}.file.${k}`, `${name} has a file ${k} that isn't text.`);
        if (f.content !== undefined) {
          if (!isText(f.content)) err(`${at}.file.content`, `${name} has file contents that aren't text.`);
          else if (f.content.length > MAX_FILE_CONTENT) err(`${at}.file.content`, `${name} holds ${Math.ceil(f.content.length / 1024)} KB of file text; the limit is 64 KB. Store a path to bigger files instead.`);
        }
      }
    }
    if (n.pathway !== undefined) {
      const s = n.pathway;
      if (n.kind !== 'pathway') err(`${at}.pathway`, `${name} has a pathway step but its kind is ${JSON.stringify(n.kind)}. Set the kind to "pathway".`);
      if (!isObj(s)) err(`${at}.pathway`, `${name} has a pathway step that isn't an object.`);
      else {
        if (!(PATHWAY_OPS as readonly unknown[]).includes(s.op)) err(`${at}.pathway.op`, `${name} has the step ${JSON.stringify(s.op)}. Use one of: ${PATHWAY_OPS.join(', ')}.`);
        if (s.op === 'assign' || s.op === 'read') {
          if (!isVariableName(s.target)) err(`${at}.pathway.target`, `${name} writes to ${s.target === undefined ? 'no variable' : JSON.stringify(s.target)}. A variable name is letters, digits and _, starting with a letter.`);
        }
        if (s.op === 'assign' || s.op === 'if' || s.op === 'while') {
          if (!isText(s.expr)) err(`${at}.pathway.expr`, `${name} is a "${s.op}" step without an expression.`);
        }
        if (s.expr !== undefined) {
          if (!isText(s.expr)) err(`${at}.pathway.expr`, `${name} has an expression that isn't text.`);
          else try { parseExpr(s.expr); } catch (e) {
            err(`${at}.pathway.expr`, `${name} has an expression that can't be read: ${e instanceof CoreError ? e.message : String(e)}.`);
          }
        }
        if (s.op === 'read') {
          if (!isText(s.source) || !s.source) err(`${at}.pathway.source`, `${name} is a "read" step that doesn't say which node to read.`);
          else readSources.push({ at: `${at}.pathway.source`, name, source: s.source });
        }
      }
    }
    for (const k of ['created', 'updated'] as const) if (!isNum(n[k])) err(`${at}.${k}`, `${name} needs "${k}" as a time in milliseconds (a number).`);
    for (const key of Object.keys(n)) if (!NODE_KEYS.includes(key)) warn(`${at}.${key}`, `"${key}" isn't part of a node, so it was ignored.`);
    if (errors.length === before) nodes.push(n as unknown as MemoryNode);
  });
  for (const r of readSources) {
    if (!nodeIds.has(r.source)) warn(r.at, `${r.name} reads "${r.source}", which isn't in this memory any more. Running the pathway will stop there.`);
  }

  // perspective positions (needs node ids)
  if (Array.isArray(input.perspectives)) input.perspectives.forEach((p, i) => {
    if (!isObj(p) || !isObj(p.positions)) return;
    const name = `perspectives[${i}]${quoteLabel(p.label)}`;
    for (const [id, v] of Object.entries(p.positions)) {
      const at = `perspectives[${i}].positions.${id}`;
      if (!nodeIds.has(id)) err(at, `${name} places "${id}", but no node has that id.`);
      if (!isObj(v) || !isNum(v.x) || !isNum(v.y) || !isNum(v.z)) err(at, `${name} has a position for "${id}" that isn't {x, y, z} with finite numbers.`);
    }
  });

  // ── relations ──
  const relationIds = new Map<string, number>();
  const relations: Relation[] = [];
  if (!hasOwn(input, 'relations')) err('relations', 'The memory needs a "relations" list (it can be empty).');
  else if (!Array.isArray(input.relations)) err('relations', `"relations" should be a list, but it is ${typeName(input.relations)}.`);
  else input.relations.forEach((r, i) => {
    const at = `relations[${i}]`;
    if (!isObj(r)) { err(at, `${at} should be an object, but it is ${typeName(r)}.`); return; }
    const before = errors.length;
    if (!isText(r.id) || !r.id.trim()) err(`${at}.id`, `${at} has no id.`);
    else if (relationIds.has(r.id)) err(`${at}.id`, `${at} uses the id "${r.id}", which relations[${relationIds.get(r.id)}] already has. Ids must be unique.`);
    else relationIds.set(r.id, i);
    for (const end of ['from', 'to'] as const) {
      if (!isText(r[end])) err(`${at}.${end}`, `${at} has no "${end}" node.`);
      else if (!nodeIds.has(r[end])) err(`${at}.${end}`, `${at} ${end === 'from' ? 'starts at' : 'ends at'} "${r[end]}", but no node has that id.`);
    }
    if (isText(r.from) && r.from === r.to) err(`${at}.to`, `${at} joins "${r.from}" to itself. A line needs two different ends.`);
    if (!(RELATION_TYPES as readonly unknown[]).includes(r.type)) err(`${at}.type`, `${at} has the type ${JSON.stringify(r.type)}. Use one of: ${RELATION_TYPES.join(', ')}.`);
    if (!isNum(r.weight) || r.weight <= 0 || r.weight > 1) err(`${at}.weight`, `${at} has the weight ${JSON.stringify(r.weight)}. A weight is a number above 0 and at most 1.`);
    if (typeof r.directed !== 'boolean') err(`${at}.directed`, `${at} needs "directed": true or false.`);
    else if (r.type === 'flow' && !r.directed) err(`${at}.directed`, `${at} is a pathway (flow) line, so it must be directed.`);
    if (r.branch !== undefined) {
      if (r.type !== 'flow') err(`${at}.branch`, `${at} has a branch, but only pathway (flow) lines take one.`);
      else if (!(FLOW_BRANCHES as readonly unknown[]).includes(r.branch)) err(`${at}.branch`, `${at} has the branch ${JSON.stringify(r.branch)}. Use next, true or false.`);
    }
    if (r.label !== undefined && !isText(r.label)) err(`${at}.label`, `${at} has a label that isn't text.`);
    if (r.perspectives !== undefined) {
      if (!Array.isArray(r.perspectives) || r.perspectives.length === 0) err(`${at}.perspectives`, `${at} has "perspectives" that aren't a list of perspective ids. Leave it out to show the line in every lens.`);
      else r.perspectives.forEach((p, j) => {
        if (!isText(p) || !perspectiveIds.has(p)) err(`${at}.perspectives[${j}]`, `${at} appears in the perspective ${JSON.stringify(p)}, which doesn't exist in this memory.`);
      });
    }
    if (!isNum(r.created)) err(`${at}.created`, `${at} needs "created" as a time in milliseconds (a number).`);
    for (const key of Object.keys(r)) if (!REL_KEYS.includes(key)) warn(`${at}.${key}`, `"${key}" isn't part of a line, so it was ignored.`);
    if (errors.length === before) relations.push(r as unknown as Relation);
  });

  // ── meta ──
  const m = input.meta;
  if (!isObj(m)) err('meta', 'The memory needs "meta" with at least a title and a default perspective.');
  else {
    if (!isText(m.title) || !m.title.trim()) err('meta.title', 'The memory has no title. Give it one in meta.title.');
    if (m.description !== undefined && !isText(m.description)) err('meta.description', 'meta.description should be text.');
    if (!isText(m.defaultPerspective)) err('meta.defaultPerspective', 'meta.defaultPerspective should name the perspective to open with.');
    else if (!perspectiveIds.has(m.defaultPerspective)) err('meta.defaultPerspective', `The memory opens in the perspective "${m.defaultPerspective}", which doesn't exist in it.`);
    const f = m.featured;
    if (f !== undefined) {
      if (!isObj(f)) err('meta.featured', 'meta.featured should be an object.');
      else {
        if (f.route !== undefined) {
          if (!isObj(f.route)) err('meta.featured.route', 'meta.featured.route should be {from, to}.');
          else for (const end of ['from', 'to'] as const) {
            if (!isText(f.route[end]) || !nodeIds.has(f.route[end] as string)) err(`meta.featured.route.${end}`, `The featured route ${end === 'from' ? 'starts at' : 'ends at'} ${JSON.stringify(f.route[end])}, but no node has that id.`);
          }
        }
        if (f.pathway !== undefined) {
          const idx = isText(f.pathway) ? nodeIds.get(f.pathway) : undefined;
          const node = idx === undefined ? undefined : (input.nodes as Obj[])[idx];
          if (!node) err('meta.featured.pathway', `The featured pathway ${JSON.stringify(f.pathway)} isn't a node in this memory.`);
          else if (!isObj(node.pathway) || node.pathway.op !== 'start') err('meta.featured.pathway', `The featured pathway "${f.pathway}" isn't the start of a pathway.`);
        }
        if (f.query !== undefined && !isText(f.query)) err('meta.featured.query', 'meta.featured.query should be text.');
      }
    }
  }

  if (errors.length) return { ok: false, errors };
  const doc: MemoryDoc = {
    schema: SCHEMA_ID,
    version: SCHEMA_VERSION,
    meta: canonMeta(m as unknown as MemoryMeta),
    perspectives: perspectives.map(canonPerspective),
    nodes: nodes.map(canonNode),
    relations: relations.map(canonRelation),
  };
  return { ok: true, doc, warnings };
}

function checkValue(v: unknown, path: string, subject: string, err: (path: string, message: string) => void): void {
  if (v === undefined) err(path, `${subject} is missing. Use null for "no value".`);
  else if (!isValue(v)) err(path, `${subject} is ${typeName(v)}. Values are text, numbers, true/false or null.`);
  else if (typeof v === 'string' && v.length > MAX_VALUE_CHARS) err(path, `${subject} is ${v.length} characters long. Values hold up to ${MAX_VALUE_CHARS} characters. Put longer text in a File.`);
}

/** JSON.parse with a human message on syntax errors, then validateDoc. */
export function importJson(text: string): ImportResult {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, errors: [{ path: '', message: 'That file is empty, so there is no memory in it.' }] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { ok: false, errors: [{ path: '', message: `That file isn't valid JSON, so it can't be a Constellation memory (${detail}).` }] };
  }
  return validateDoc(parsed);
}

export function exportDoc(graph: MemoryGraph): MemoryDoc {
  const ids = new Set(graph.nodes().map((n) => n.id));
  // Drop references a deletion left behind, so every export validates.
  const meta = canonMeta(graph.meta);
  if (meta.featured) {
    if (meta.featured.route && !(ids.has(meta.featured.route.from) && ids.has(meta.featured.route.to))) delete meta.featured.route;
    if (meta.featured.pathway !== undefined && graph.getNode(meta.featured.pathway)?.pathway?.op !== 'start') delete meta.featured.pathway;
  }
  const perspectives = graph.perspectives().map((p) => {
    const c = canonPerspective(p);
    if (c.positions) for (const id of Object.keys(c.positions)) if (!ids.has(id)) delete c.positions[id];
    return c;
  });
  return {
    schema: SCHEMA_ID,
    version: SCHEMA_VERSION,
    meta,
    perspectives,
    nodes: graph.nodes().map(canonNode),
    relations: graph.relations().map(canonRelation),
  };
}

/** Stable, pretty (2-space) JSON of exportDoc. */
export function exportJson(graph: MemoryGraph): string {
  return JSON.stringify(exportDoc(graph), null, 2) + '\n';
}

/** null when nothing is stored under the key. */
export function loadSaved(storage: KeyValueStorage, key: string = AUTOSAVE_KEY): ImportResult | null {
  let text: string | null;
  try {
    text = storage.getItem(key);
  } catch {
    return { ok: false, errors: [{ path: '', message: "Couldn't read this browser's storage (it is blocked). Your memory opened from the seed instead." }] };
  }
  if (text === null) return null;
  return importJson(text);
}

/** Saves (debounced) after every graph event. The returned function flushes once and stops. */
export function startAutosave(graph: MemoryGraph, storage: KeyValueStorage, options: AutosaveOptions = {}): Unsubscribe {
  const key = options.key ?? AUTOSAVE_KEY;
  const debounceMs = options.debounceMs ?? 400;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const save = () => {
    timer = null;
    try {
      storage.setItem(key, exportJson(graph));
    } catch (error) {
      options.onError?.(error);
    }
  };
  const off = graph.on(() => {
    if (stopped) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(save, debounceMs);
  });
  return () => {
    if (stopped) return;
    stopped = true;
    off();
    if (timer !== null) {
      clearTimeout(timer);
      save();
    }
  };
}
