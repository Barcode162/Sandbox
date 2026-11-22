// src/ui/format.ts — how values read on screen: units, numbers, elided paths, counts.
import { resolveValue } from '../core/index.ts';
import type { MemoryGraph, MemoryNode, NodeId, PerspectiveId, Value } from '../core/index.ts';

export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const s = n.toFixed(Math.abs(n) < 0.01 ? 4 : 2);
  return s.replace(/\.?0+$/, '');
}

export function formatValue(v: Value): string {
  if (v === null) return '—';
  if (typeof v === 'number') return formatNumber(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return v;
}

/**
 * Units are data, not code: a variable labelled "unit" applies its value (per lens) to the
 * numeric variables in the tag groups of the nodes it relates to (in the seed: the heat group,
 * so Temperature reads 20 °C to the Cook and 293 K to the Physicist).
 */
export class Units {
  private unitNode: MemoryNode | undefined;
  private tags = new Set<string>();
  private graph: MemoryGraph;

  constructor(graph: MemoryGraph) {
    this.graph = graph;
    this.refresh();
  }

  refresh(): void {
    this.unitNode = this.graph.findByLabel('unit');
    this.tags.clear();
    if (!this.unitNode) return;
    for (const r of this.graph.relationsOf(this.unitNode.id)) {
      const other = this.graph.getNode(r.from === this.unitNode.id ? r.to : r.from);
      if (other) for (const t of other.tags) this.tags.add(t);
    }
  }

  unitFor(node: MemoryNode, lens: PerspectiveId): string {
    if (!this.unitNode || node.id === this.unitNode.id || node.kind !== 'variable') return '';
    if (!node.tags.some((t) => this.tags.has(t))) return '';
    const u = resolveValue(this.unitNode, lens);
    return typeof u === 'string' ? u : '';
  }

  /** True when a label names a unit-bearing node. */
  bearsUnit(label: string): boolean {
    const n = this.graph.findByLabel(label);
    return !!n && this.unitFor(n, this.graph.meta.defaultPerspective) !== '';
  }

  unitOf(lens: PerspectiveId): string {
    const u = this.unitNode ? resolveValue(this.unitNode, lens) : null;
    return typeof u === 'string' ? u : '';
  }

  /** The node's value under `lens`, formatted with its unit. */
  show(node: MemoryNode, lens: PerspectiveId, value: Value = resolveValue(node, lens)): string {
    const text = formatValue(value);
    if (typeof value !== 'number') return text;
    const u = this.unitFor(node, lens);
    if (!u) return text;
    return `${text} ${u}`;
  }
}

/**
 * Adds units to the evaluated operands of a condition note when the condition reads a
 * unit-bearing node: "60 < 100 → true" → "60 °C < 100 °C → true".
 */
export function withUnits(evaluated: string, unit: string): string {
  if (!unit) return evaluated;
  const [lhs, ...rest] = evaluated.split('→');
  if (!lhs) return evaluated;
  const parts = lhs.split(/(\s(?:<=|>=|==|!=|<|>|\+|-)\s)/);
  const out = parts.map((p) => (/^\s*-?\d+(\.\d+)?\s*$/.test(p) ? `${p.trim()} ${unit} ` : p));
  const left = out.join('').replace(/\s+/g, ' ').trim();
  return rest.length ? `${left} →${rest.join('→')}` : left;
}

/** A → B → C → … → X → Y → Z (elides the middle, never the end). */
export function elidePath(labels: string[], max = 7): string {
  if (labels.length <= max) return labels.join(' → ');
  return [...labels.slice(0, 3), '…', ...labels.slice(-3)].join(' → ');
}

export function hops(n: number): string {
  return `${n} ${n === 1 ? 'hop' : 'hops'}`;
}

export function plural(n: number, one: string, many = one + 's'): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function times(n: number): string {
  if (n === 0) return 'not at all';
  if (n === 1) return 'once';
  if (n === 2) return 'twice';
  return `${n} times`;
}

/** "a, b and c" */
export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function labelOf(graph: MemoryGraph, id: NodeId): string {
  return graph.getNode(id)?.label ?? id;
}

export const KIND_NAME: Record<MemoryNode['kind'], string> = {
  concept: 'thing',
  variable: 'variable',
  file: 'file',
  note: 'note',
  pathway: 'pathway step',
};
