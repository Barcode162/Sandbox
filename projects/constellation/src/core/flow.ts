// src/core/flow.ts — pathway interpreter. Signatures FROZEN; bodies are WO-002's.
// A pathway is the set of `pathway` nodes reachable from a `start` node over `flow` relations.
// References (@Label) and `read` resolve under the given perspective, so one pathway can give
// different results per perspective (brief → Definition of exceptional 4).
//
// Trace notes read like the drawer's trace list: "<the step> · <the step with values> → <outcome>",
// e.g. `while heat < Boiling Point · 60 < 100 → true`. Failures never throw: the run ends with
// status 'error' and a sentence that names the step and the missing thing (experience.md §10).
//
// Units (MemoryNode.units, display only). A variable carries the unit of the node it came from:
// `read` takes the source's unit; `assign` takes the unit of the first operand that has one.
// Numbers then print with that unit ("60 °C < 100 °C"). A unit starting with "·" is a scale word
// ("· warm", "· bubbly") that names one value, so it is shown only when the number equals the
// value of a node this pathway touches that carries the word; otherwise the bare number shows.
// An `end` whose expression builds text by `+` renders its variables and refs with their units,
// and that text is Trace.result: "Done after 2 stirs · heat 100 °C".
import { CoreError } from './errors.ts';
import { evaluate, isTruthy, parseExpr, printExpr, references, variablesOf } from './expr.ts';
import { formatNumber, hasOwn, isScaleWord, isVariableName, showValue, unitOf, withUnit } from './internal.ts';
import { isRelationVisible, resolveValue } from './perspectives.ts';
import type { Expr, FlowBranch, MemoryGraph, MemoryNode, NodeId, PerspectiveId, Relation, RunOptions, Scope, Trace, TraceStep, Value } from './types.ts';

const DEFAULT_MAX_STEPS = 500;
/** Upper bound for RunOptions.maxSteps, so one run always stays small enough to keep in memory. */
const MAX_STEPS_CAP = 100_000;
const BRANCH_RANK: Record<FlowBranch, number> = { next: 0, true: 1, false: 2 };

/** All `start` pathway nodes, sorted by label. */
export function listPathways(graph: MemoryGraph): MemoryNode[] {
  return graph
    .nodes()
    .filter((n) => n.kind === 'pathway' && n.pathway?.op === 'start')
    .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function outgoingFlow(graph: MemoryGraph, id: NodeId, perspective?: PerspectiveId): Relation[] {
  return graph
    .relationsOf(id)
    .filter((r) => r.type === 'flow' && r.from === id && (perspective === undefined || isRelationVisible(r, perspective)))
    .sort((a, b) => BRANCH_RANK[a.branch ?? 'next'] - BRANCH_RANK[b.branch ?? 'next'] || (a.to < b.to ? -1 : a.to > b.to ? 1 : a.id < b.id ? -1 : 1));
}

/** Node ids reachable from `start` over flow relations (the pathway's body), BFS order. */
export function pathwayNodes(graph: MemoryGraph, start: NodeId): NodeId[] {
  if (!graph.getNode(start)) return [];
  const seen = new Set<NodeId>([start]);
  const order: NodeId[] = [start];
  for (let i = 0; i < order.length; i++) {
    for (const r of outgoingFlow(graph, order[i]!)) {
      if (seen.has(r.to)) continue;
      seen.add(r.to);
      order.push(r.to);
    }
  }
  return order;
}

class Stop extends Error {}

/**
 * Step-wise execution: yields one TraceStep per visited node; returns the final Trace.
 * Never throws for user errors (bad expr, missing branch, unknown ref): the Trace ends with
 * status 'error' and a human `error`. Hitting maxSteps → status 'max-steps'.
 */
export function* stepPathway(graph: MemoryGraph, start: NodeId, perspective: PerspectiveId, options?: RunOptions): Generator<TraceStep, Trace, void> {
  // A guard that can't be disabled: NaN, ±Infinity or non-numbers fall back to the default.
  const asked = options?.maxSteps;
  const maxSteps = typeof asked === 'number' && Number.isFinite(asked) ? Math.min(MAX_STEPS_CAP, Math.max(1, Math.floor(asked))) : DEFAULT_MAX_STEPS;
  const lens = graph.getPerspective(perspective)?.label ?? perspective;
  const vars: Record<string, Value> = {};
  const steps: TraceStep[] = [];
  const trace = (status: Trace['status'], result: Value, error?: string): Trace => {
    const t: Trace = { pathway: start, perspective, steps, status, result, vars: { ...vars } };
    if (error !== undefined) t.error = error;
    return t;
  };

  const first = graph.getNode(start);
  if (!first) return trace('error', null, 'That pathway no longer exists.');
  if (first.pathway?.op !== 'start') return trace('error', null, `"${first.label}" isn't the start of a pathway.`);

  const parsed = new Map<string, Expr>();
  const parse = (src: string): Expr => {
    let e = parsed.get(src);
    if (!e) parsed.set(src, (e = parseExpr(src)));
    return e;
  };
  const scope: Scope = {
    vars,
    ref(label: string): Value {
      const node = graph.findByLabel(label);
      if (!node) throw new CoreError('runtime', `${label} no longer exists.`);
      return resolveValue(node, perspective);
    },
  };
  // ── units ──
  const unitsOf = new Map<string, { unit: string; source: MemoryNode }>();
  let scaleNodes: MemoryNode[] | null = null;
  /** Nodes this pathway reads or refers to that carry a scale word under this lens. */
  const scaleWords = (): MemoryNode[] => {
    if (scaleNodes) return scaleNodes;
    const found = new Map<NodeId, MemoryNode>();
    for (const id of pathwayNodes(graph, start)) {
      const s = graph.getNode(id)?.pathway;
      const candidates: (MemoryNode | undefined)[] = [];
      if (s?.source !== undefined) candidates.push(graph.getNode(s.source));
      if (s?.expr !== undefined) {
        try { for (const l of references(parse(s.expr))) candidates.push(graph.findByLabel(l)); } catch { /* reported when run */ }
      }
      for (const c of candidates) if (c && isScaleWord(unitOf(c, perspective))) found.set(c.id, c);
    }
    return (scaleNodes = [...found.values()]);
  };
  const showRef = (n: MemoryNode): string => {
    const v = resolveValue(n, perspective);
    return typeof v === 'number' ? withUnit(v, unitOf(n, perspective)) : showValue(v);
  };
  const showVar = (name: string): string | undefined => {
    if (!hasOwn(vars, name)) return undefined;
    const v = vars[name] as Value;
    const info = unitsOf.get(name);
    if (typeof v !== 'number' || !info) return showValue(v);
    if (!isScaleWord(info.unit)) return withUnit(v, info.unit);
    if (resolveValue(info.source, perspective) === v) return withUnit(v, info.unit);
    const match = scaleWords().find((n) => resolveValue(n, perspective) === v);
    return match ? withUnit(v, unitOf(match, perspective)) : formatNumber(v);
  };
  /** The expression with every variable and @ref replaced by its current value (with units). */
  const withValues = (e: Expr): string =>
    printExpr(e, (leaf) => {
      if (leaf.kind === 'var') return showVar(leaf.name);
      if (leaf.kind === 'ref') {
        const n = graph.findByLabel(leaf.label);
        return n ? showRef(n) : undefined;
      }
      return undefined;
    });
  /** Unit an assignment inherits: the first operand (in source order) that has one. */
  const inheritUnit = (e: Expr): { unit: string; source: MemoryNode } | undefined => {
    if (e.kind === 'var') return unitsOf.get(e.name);
    if (e.kind === 'ref') {
      const n = graph.findByLabel(e.label);
      const unit = n ? unitOf(n, perspective) : undefined;
      return n && unit !== undefined ? { unit, source: n } : undefined;
    }
    if (e.kind === 'unary') return inheritUnit(e.arg);
    if (e.kind === 'binary') return inheritUnit(e.left) ?? inheritUnit(e.right);
    return undefined;
  };
  /** Text built with `+`, with each variable and ref shown with its unit. */
  const renderText = (e: Expr): string => {
    if (e.kind === 'binary' && e.op === '+' && typeof evaluate(e, scope) === 'string') return renderText(e.left) + renderText(e.right);
    if (e.kind === 'var') return showVar(e.name) ?? '';
    if (e.kind === 'ref') { const n = graph.findByLabel(e.label); if (n) return showRef(n).replace(/^"|"$/g, ''); }
    const v = evaluate(e, scope);
    return typeof v === 'number' ? formatNumber(v) : String(v);
  };

  // Per while node: visits, loops taken, variable values at its first check (for the guard message).
  const loops = new Map<NodeId, { loops: number; firstVars: Record<string, Value> }>();
  let node: MemoryNode = first;

  for (;;) {
    if (steps.length >= maxSteps) return trace('max-steps', null, guardMessage(graph, loops, vars, maxSteps, showVar));
    const step = node.pathway;
    const index = steps.length;
    const label = node.label;
    if (!step) {
      const message = `Stopped at "${label}": it isn't a pathway step.`;
      const failed: TraceStep = { index, nodeId: node.id, op: 'end', vars: { ...vars }, note: message };
      steps.push(failed);
      yield failed;
      return trace('error', null, message);
    }
    let note = '';
    let branch: FlowBranch = 'next';
    let result: Value = null;

    try {
      const run = (src: string | undefined, where: string): { expr: Expr; value: Value } => {
        if (src === undefined) throw new Stop(`Stopped at "${label}": this ${where} step has no expression.`);
        let expr: Expr;
        try {
          expr = parse(src);
        } catch (e) {
          throw new Stop(`Stopped at "${label}": its expression can't be read (${e instanceof Error ? e.message : String(e)}).`);
        }
        try {
          return { expr, value: evaluate(expr, scope) };
        } catch (e) {
          // Name the empty input when one is the cause; that is the actionable fact.
          for (const ref of references(expr)) {
            const n = graph.findByLabel(ref);
            if (n && resolveValue(n, perspective) === null) throw new Stop(`Stopped at ${step.op}: ${n.label} has no value under ${lens}.`);
          }
          const msg = e instanceof Error ? e.message : String(e);
          throw new Stop(`Stopped at "${label}": ${msg}`);
        }
      };

      switch (step.op) {
        case 'start':
          note = `start · ${label} (${lens})`;
          break;
        case 'read': {
          const source = step.source === undefined ? undefined : graph.getNode(step.source);
          if (!source) {
            const named = label.includes('←') ? label.slice(label.lastIndexOf('←') + 1).trim() : step.source ?? 'the node it reads';
            throw new Stop(`Stopped at "${label}": ${named} no longer exists.`);
          }
          if (!isVariableName(step.target)) throw new Stop(`Stopped at "${label}": it doesn't name a variable to read into.`);
          const v = resolveValue(source, perspective);
          vars[step.target] = v;
          const unit = unitOf(source, perspective);
          if (typeof v === 'number' && unit !== undefined) unitsOf.set(step.target, { unit, source });
          else unitsOf.delete(step.target);
          note = `read ${step.target} ← ${source.label} · ${showVar(step.target)}`;
          break;
        }
        case 'assign': {
          if (!isVariableName(step.target)) throw new Stop(`Stopped at "${label}": it doesn't name a variable to set.`);
          const { expr, value } = run(step.expr, 'assign');
          const plain = printExpr(expr);
          const filled = withValues(expr);
          const unit = typeof value === 'number' ? inheritUnit(expr) : undefined;
          vars[step.target] = value;
          if (unit) unitsOf.set(step.target, unit);
          else unitsOf.delete(step.target);
          const literal = expr.kind === 'num' || expr.kind === 'str' || expr.kind === 'bool' || expr.kind === 'null';
          note = literal ? `assign ${step.target} ← ${plain}` : `assign ${step.target} ← ${plain} · ${filled} → ${showVar(step.target)}`;
          break;
        }
        case 'if':
        case 'while': {
          const before = { ...vars };
          const { expr, value } = run(step.expr, step.op);
          const ok = isTruthy(value);
          branch = ok ? 'true' : 'false';
          note = `${step.op} ${printExpr(expr)} · ${withValues(expr)} → ${ok}`;
          if (step.op === 'while') {
            const entry = loops.get(node.id) ?? { loops: 0, firstVars: before };
            if (ok) entry.loops++;
            loops.set(node.id, entry);
          }
          break;
        }
        case 'end': {
          if (step.expr !== undefined) {
            const { expr, value } = run(step.expr, 'end');
            result = typeof value === 'string' ? renderText(expr) : value;
          }
          note = `end · ${typeof result === 'string' ? result : showValue(result)}`;
          break;
        }
      }
    } catch (e) {
      const message = e instanceof Stop ? e.message : `Stopped at "${label}": ${e instanceof Error ? e.message : String(e)}`;
      const failed: TraceStep = { index, nodeId: node.id, op: step.op, vars: { ...vars }, note: message };
      steps.push(failed);
      yield failed;
      return trace('error', null, message);
    }

    if (step.op === 'end') {
      const done: TraceStep = { index, nodeId: node.id, op: 'end', vars: { ...vars }, note };
      steps.push(done);
      yield done;
      return trace('ended', result);
    }

    const out = outgoingFlow(graph, node.id, perspective);
    const edge = out.find((r) => (r.branch ?? 'next') === branch);
    const nextNode = edge ? graph.getNode(edge.to) : undefined;
    const visit: TraceStep = { index, nodeId: node.id, op: step.op, vars: { ...vars }, note };
    if (edge) { visit.via = edge.id; visit.branch = branch; }
    steps.push(visit);
    yield visit;
    if (!edge || !nextNode) {
      const why = !edge
        ? branch === 'next'
          ? `Stopped at "${label}": nothing comes after this step.`
          : `Stopped at "${label}": there is no "${branch}" path out of this step.`
        : `Stopped at "${label}": the next step no longer exists.`;
      return trace('error', null, why);
    }
    node = nextNode;
  }
}

/** "Stopped after 100 loops: the condition never became false (heat stayed 20)." */
function guardMessage(
  graph: MemoryGraph,
  loops: Map<NodeId, { loops: number; firstVars: Record<string, Value> }>,
  vars: Record<string, Value>,
  maxSteps: number,
  show: (name: string) => string | undefined,
): string {
  let hot: [NodeId, { loops: number; firstVars: Record<string, Value> }] | undefined;
  for (const entry of loops) if (!hot || entry[1].loops > hot[1].loops) hot = entry;
  if (!hot || hot[1].loops === 0) return `Stopped after ${maxSteps} steps: the pathway never reached an end.`;
  const [id, { loops: count, firstVars }] = hot;
  const src = graph.getNode(id)?.pathway?.expr;
  let stuck: string[] = [];
  if (src !== undefined) {
    try {
      stuck = variablesOf(parseExpr(src))
        .filter((v) => hasOwn(vars, v) && hasOwn(firstVars, v) && vars[v] === firstVars[v])
        .map((v) => `${v} stayed ${show(v)}`);
    } catch {
      stuck = [];
    }
  }
  return `Stopped after ${count} loop${count === 1 ? '' : 's'}: the condition never became false${stuck.length ? ` (${stuck.join(', ')})` : ''}.`;
}

/** Runs stepPathway to completion. */
export function runPathway(graph: MemoryGraph, start: NodeId, perspective: PerspectiveId, options?: RunOptions): Trace {
  const it = stepPathway(graph, start, perspective, options);
  for (;;) {
    const r = it.next();
    if (r.done) return r.value;
  }
}
