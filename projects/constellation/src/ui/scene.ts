// src/ui/scene.ts — builds the renderer's SceneSnapshot from core (the only place that does).
import { disagrees, facetsOf, layoutFor, resolveValue, visibleRelations } from '../core/index.ts';
import type { MemoryGraph, MemoryNode, NodeId, Perspective, PerspectiveId, Relation, RelationInput, Vec3 } from '../core/index.ts';
import type { EdgeLook, SceneNode, SceneRelation, SceneSnapshot } from '../view/contracts.ts';
import { hash01 } from '../view/motion.ts';
import type { Units } from './format.ts';

const LENS_TOKENS: Record<string, string> = { cook: '#FF9F5A', physicist: '#6FD3FF', child: '#FF7EC8' };
const FALLBACK = ['#FF9F5A', '#6FD3FF', '#FF7EC8', '#B8A6FF', '#7CF0A0', '#FFD36E'];

const COS12 = Math.cos((12 * Math.PI) / 180);
const SIN12 = Math.sin((12 * Math.PI) / 180);

export function lensColor(p: Perspective, index: number): string {
  return p.accent ?? LENS_TOKENS[p.id] ?? FALLBACK[index % FALLBACK.length] ?? '#FF9F5A';
}

/** The link-type vocabulary of the UI (experience.md §10) and how it is stored. */
export const LINK_TYPES: Array<{ key: string; label: string; input: Pick<RelationInput, 'type' | 'label'> }> = [
  { key: 'relates', label: 'relates', input: { type: 'association' } },
  { key: 'is-a', label: 'is-a', input: { type: 'association', label: 'is-a' } },
  { key: 'part-of', label: 'part-of', input: { type: 'part-of', label: 'part-of' } },
  { key: 'references', label: 'references', input: { type: 'association', label: 'references' } },
  { key: 'next', label: 'next', input: { type: 'chain', label: 'next' } },
];

export function lookOf(r: Relation): EdgeLook {
  if (r.type === 'flow') return 'flow';
  if (r.type === 'shortcut') return 'shortcut';
  if (r.type === 'chain') return 'next';
  if (r.type === 'part-of') return 'part-of';
  if (r.type === 'causes') return 'causes';
  if (r.label === 'is-a' || r.label === 'reads' || r.label === 'references') return r.label;
  return 'relates';
}

/** Name of a relation as the inspector groups it ("relates", "read by", "references"…). */
export function relationWord(r: Relation, from: NodeId): string {
  const look = lookOf(r);
  const outgoing = r.from === from;
  if (look === 'reads') return outgoing ? 'reads' : 'read by';
  if (look === 'references') return outgoing ? 'references' : 'referenced by';
  if (look === 'flow') return 'flow';
  if (look === 'next') return 'next';
  return look;
}

export class SceneBuilder {
  /** Positions per lens, computed once per load; births are authored in the doc. */
  private cache = new Map<PerspectiveId, Map<NodeId, Vec3>>();

  private graph: MemoryGraph;
  private units: Units;

  constructor(graph: MemoryGraph, units: Units) {
    this.graph = graph;
    this.units = units;
  }

  reset(): void {
    this.cache.clear();
  }

  positions(lens: PerspectiveId): Map<NodeId, Vec3> {
    let m = this.cache.get(lens);
    const nodes = this.graph.nodes();
    if (!m || nodes.some((n) => !m!.has(n.id))) {
      const fresh = layoutFor(this.graph, lens);
      if (!m) m = fresh;
      else for (const n of nodes) if (!m.has(n.id)) m.set(n.id, fresh.get(n.id) ?? { x: 0, y: 0, z: 0 });
      this.cache.set(lens, m);
    }
    // Authored positions always win (a stored thing's birthplace).
    const authored = this.graph.getPerspective(lens)?.positions ?? {};
    for (const [id, p] of Object.entries(authored)) if (p) m.set(id, p);
    return m;
  }

  /**
   * A birthplace beside the link target, in every lens (F-024): distance max(18, 2.5·(r_target + r_new)),
   * in the emptiest of 8 seeded sectors around it, so the new light joins its neighbourhood clear of it.
   */
  birthplace(id: NodeId, near: NodeId | null): Partial<Record<PerspectiveId, Vec3>> {
    const out: Partial<Record<PerspectiveId, Vec3>> = {};
    const deg = near ? this.graph.relationsOf(near).length + 1 : 0;
    const dist = Math.max(18, 2.5 * (1.6 + 0.45 * Math.sqrt(deg) + 1.6 + 0.45));
    for (const p of this.graph.perspectives()) {
      const pos = this.positions(p.id);
      const base = near ? pos.get(near) : undefined;
      const c = base ?? { x: 0, y: 0, z: 0 };
      const phase = hash01(id + p.id) * Math.PI * 2;
      const tilt = (hash01(p.id + id) - 0.5) * 0.6;
      let best: Vec3 = c;
      let bestGap = -1;
      // Candidates circle the target in the screen plane (the default camera looks along −z from 12°
      // above), and "emptiest" is measured there too: a spot behind a neighbour is not empty (F-024).
      const pv = (o: Vec3) => o.y * COS12 - o.z * SIN12;
      for (let k = 0; k < 8; k++) {
        const a = phase + (k * Math.PI) / 4;
        const q = { x: c.x + Math.cos(a) * dist, y: c.y + Math.sin(a) * dist, z: c.z + tilt * dist * 0.5 };
        let gap = Infinity;
        for (const [other, o] of pos) if (other !== near) gap = Math.min(gap, Math.hypot(o.x - q.x, pv(o) - pv(q)));
        if (gap > bestGap) ((bestGap = gap), (best = q));
      }
      out[p.id] = { x: round(best.x), y: round(best.y), z: round(best.z) };
    }
    return out;
  }

  build(lens: PerspectiveId): SceneSnapshot {
    const g = this.graph;
    const perspectives = g.perspectives();
    const pos = this.positions(lens);
    const lensColors: Record<PerspectiveId, string> = {};
    perspectives.forEach((p, i) => (lensColors[p.id] = lensColor(p, i)));
    const nodes: SceneNode[] = g.nodes().map((n) => this.sceneNode(n, lens, perspectives, pos));
    const total = perspectives.length;
    const relations: SceneRelation[] = visibleRelations(g, lens).map((r) => ({
      id: r.id,
      from: r.from,
      to: r.to,
      type: r.type,
      weight: r.weight,
      directed: r.directed,
      look: lookOf(r),
      lensOnly: !!r.perspectives && r.perspectives.length < total,
      chip: r.type === 'flow' ? r.label : undefined,
    }));
    // No seed knowledge here: the renderer ignites from the most connected node (F-012).
    return { perspective: lens, nodes, relations, lensColors };
  }

  private sceneNode(n: MemoryNode, lens: PerspectiveId, perspectives: readonly Perspective[], pos: Map<NodeId, Vec3>): SceneNode {
    const sn: SceneNode = {
      id: n.id,
      label: n.label,
      kind: n.kind,
      valueText: n.kind === 'pathway' ? '' : this.units.show(n, lens),
      position: pos.get(n.id) ?? { x: 0, y: 0, z: 0 },
    };
    if (n.pathway) sn.op = n.pathway.op;
    if (n.kind !== 'pathway' && perspectives.length > 1 && disagrees(n, perspectives)) {
      const ghosts = facetsOf(n, perspectives).filter((f) => f.perspective !== lens);
      sn.ghosts = ghosts;
      sn.ghostText = {};
      for (const f of ghosts) sn.ghostText[f.perspective] = this.units.show(n, f.perspective, f.value);
    }
    return sn;
  }

  valueText(n: MemoryNode, lens: PerspectiveId): string {
    return this.units.show(n, lens, resolveValue(n, lens));
  }
}

const round = (v: number) => Math.round(v * 100) / 100;
