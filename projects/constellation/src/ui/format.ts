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

/** Units are data: MemoryNode.units per lens (key "*" = base). No-break space keeps "20 °C" whole. */
export class Units {
  private graph: MemoryGraph;

  constructor(graph: MemoryGraph) {
    this.graph = graph;
  }

  refresh(): void {}

  unitFor(node: MemoryNode, lens: PerspectiveId): string {
    return (node.units?.[lens] ?? node.units?.['*'] ?? '').trim();
  }

  /** The one unit shared by these labels under `lens`, or '' if none or mixed. */
  sharedUnit(labels: string[], lens: PerspectiveId): string {
    const us = new Set<string>();
    for (const l of labels) {
      const n = this.graph.findByLabel(l);
      const u = n ? this.unitFor(n, lens) : '';
      if (u) us.add(u);
    }
    return us.size === 1 ? [...us][0]! : '';
  }

  /** The node's value under `lens`, formatted with its unit. */
  show(node: MemoryNode, lens: PerspectiveId, value: Value = resolveValue(node, lens)): string {
    const text = formatValue(value);
    if (typeof value !== 'number') return text;
    const u = this.unitFor(node, lens);
    return u ? `${text}\u00a0${u}` : text;
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
  const out = parts.map((p) => (/^\s*-?\d+(\.\d+)?\s*$/.test(p) ? `${p.trim()}\u00a0${unit} ` : p));
  const left = out.join('').replace(/\s+/g, ' ').trim();
  return rest.length ? `${left} →${rest.join('→')}` : left;
}

/** A → B → C → … → X → Y → Z (elides the middle, never the end). */
export function elidePath(labels: string[], max = 7): string {
  // No-break space before each arrow: a wrap never orphans the destination (polish 11).
  // Breaks fall only before an arrow, and the last two hops ("X → Y → Z") never split (F-022).
  const list = labels.length <= max ? labels : [...labels.slice(0, 3), '…', ...labels.slice(-3)];
  return list.map((l, i) => (i === 0 ? l : `${i >= list.length - 2 ? '\u00a0' : ' '}→\u00a0${l}`)).join('');
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
