// src/core/layout.ts — positions per perspective. Signatures FROZEN; bodies are WO-002's.
// Determinism: same nodes + relations + options → bit-identical positions (seeded PRNG from a
// string hash of id + seed; no Math.random, no Date). Must finish ≤ 50 ms for 500 nodes in node.
//
// The simulation is Fruchterman–Reingold in 3D: k²/d repulsion inside a cutoff (a uniform grid
// keeps it near-linear), d²/k attraction along relations scaled by weight, a weak pull to the
// centre, and a linearly cooling step cap. Nodes are processed in id order, so insertion order
// never changes the result.
import { hashString, hasOwn, mulberry32 } from './internal.ts';
import { visibleRelations } from './perspectives.ts';
import type { ForceLayoutOptions, MemoryGraph, MemoryNode, NodeId, PerspectiveId, Relation, Vec3 } from './types.ts';

/** Ideal edge length. Also the distance a new node is born from its first positioned neighbour. */
const EDGE = 8;
const CUTOFF = EDGE * 1.5;

export function forceLayout(nodes: readonly MemoryNode[], relations: readonly Relation[], options?: ForceLayoutOptions): Map<NodeId, Vec3> {
  return simulate(nodes, relations, options ?? {}, null);
}

/**
 * Every node gets a position: authored perspective.positions win; the rest come from forceLayout
 * over the relations visible in that perspective, seeded with the perspective id, with authored
 * nodes held fixed.
 */
export function layoutFor(graph: MemoryGraph, perspective: PerspectiveId): Map<NodeId, Vec3> {
  const cache = cacheFor(graph);
  let layout = cache.get(perspective);
  if (!layout) {
    layout = compute(graph, perspective);
    cache.set(perspective, layout);
  }
  return copyLayout(layout);
}

function compute(graph: MemoryGraph, perspective: PerspectiveId): Map<NodeId, Vec3> {
  const nodes = graph.nodes();
  const authored = graph.getPerspective(perspective)?.positions ?? {};
  const fixed = new Map<NodeId, Vec3>();
  for (const n of nodes) {
    const p = hasOwn(authored, n.id) ? authored[n.id] : undefined;
    if (p) fixed.set(n.id, { x: p.x, y: p.y, z: p.z });
  }
  const relations = visibleRelations(graph, perspective);
  if (fixed.size === 0) return forceLayout(nodes, relations, { seed: perspective });
  if (fixed.size === nodes.length) {
    const out = new Map<NodeId, Vec3>();
    for (const n of nodes) out.set(n.id, fixed.get(n.id)!);
    return out;
  }
  return simulate(nodes, relations, { seed: perspective }, fixed);
}

// ── cache: one per graph, dropped on any mutation ─────────────────────────────────────────
const caches = new WeakMap<MemoryGraph, Map<PerspectiveId, Map<NodeId, Vec3>>>();
function cacheFor(graph: MemoryGraph): Map<PerspectiveId, Map<NodeId, Vec3>> {
  let cache = caches.get(graph);
  if (!cache) {
    const fresh = new Map<PerspectiveId, Map<NodeId, Vec3>>();
    graph.on(() => fresh.clear());
    caches.set(graph, fresh);
    cache = fresh;
  }
  return cache;
}

function copyLayout(layout: Map<NodeId, Vec3>): Map<NodeId, Vec3> {
  const out = new Map<NodeId, Vec3>();
  for (const [id, p] of layout) out.set(id, { x: p.x, y: p.y, z: p.z });
  return out;
}

// ── simulation ────────────────────────────────────────────────────────────────────────────
function unitVector(rand: () => number): Vec3 {
  // Uniform on the sphere.
  const z = rand() * 2 - 1;
  const a = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  return { x: s * Math.cos(a), y: s * Math.sin(a), z };
}

function simulate(
  nodes: readonly MemoryNode[],
  relations: readonly Relation[],
  options: ForceLayoutOptions,
  fixed: Map<NodeId, Vec3> | null,
): Map<NodeId, Vec3> {
  const iterations = Math.max(0, Math.floor(options.iterations ?? 300));
  const radius = options.radius ?? 60;
  const seed = options.seed ?? '';
  const ids = [...new Set(nodes.map((n) => n.id))].sort();
  const n = ids.length;
  const out = new Map<NodeId, Vec3>();
  if (n === 0) return out;

  const index = new Map<NodeId, number>();
  ids.forEach((id, i) => index.set(id, i));
  const px = new Float64Array(n), py = new Float64Array(n), pz = new Float64Array(n);
  const dx = new Float64Array(n), dy = new Float64Array(n), dz = new Float64Array(n);
  const ax = new Float64Array(n), ay = new Float64Array(n), az = new Float64Array(n); // tether anchors
  const pinned = new Uint8Array(n);

  // Edges in a stable order, deduplicated per node pair (the strongest weight wins).
  const pairWeight = new Map<number, number>();
  for (const r of relations) {
    const a = index.get(r.from), b = index.get(r.to);
    if (a === undefined || b === undefined || a === b) continue;
    const key = a < b ? a * n + b : b * n + a;
    pairWeight.set(key, Math.max(pairWeight.get(key) ?? 0, r.weight));
  }
  const keys = [...pairWeight.keys()].sort((p, q) => p - q);
  const ea = new Int32Array(keys.length), eb = new Int32Array(keys.length), ew = new Float64Array(keys.length);
  const neighbours: number[][] = ids.map(() => []);
  keys.forEach((key, e) => {
    const a = Math.floor(key / n), b = key % n;
    ea[e] = a; eb[e] = b; ew[e] = pairWeight.get(key)!;
    neighbours[a]!.push(b);
    neighbours[b]!.push(a);
  });

  const rngs = ids.map((id) => mulberry32(hashString(seed + id)));
  const placed = new Uint8Array(n);
  if (fixed) {
    let cx = 0, cy = 0, cz = 0, count = 0;
    const queue: number[] = [];
    for (let i = 0; i < n; i++) {
      const f = fixed.get(ids[i]!);
      if (!f) continue;
      px[i] = f.x; py[i] = f.y; pz[i] = f.z;
      pinned[i] = 1; placed[i] = 1;
      cx += f.x; cy += f.y; cz += f.z; count++;
      queue.push(i);
    }
    cx /= count; cy /= count; cz /= count;
    // Born beside a positioned neighbour (breadth-first from the authored nodes).
    for (let q = 0; q < queue.length; q++) {
      const from = queue[q]!;
      for (const j of neighbours[from]!) {
        if (placed[j]) continue;
        const u = unitVector(rngs[j]!);
        px[j] = px[from]! + u.x * EDGE; py[j] = py[from]! + u.y * EDGE; pz[j] = pz[from]! + u.z * EDGE;
        placed[j] = 1;
        queue.push(j);
      }
    }
    // Unconnected newcomers wait just outside everything else.
    let reach = 0;
    for (let i = 0; i < n; i++) if (pinned[i]) reach = Math.max(reach, Math.hypot(px[i]! - cx, py[i]! - cy, pz[i]! - cz));
    for (let i = 0; i < n; i++) {
      if (placed[i]) continue;
      const u = unitVector(rngs[i]!);
      const r = reach + EDGE * 2 + rngs[i]!() * EDGE;
      px[i] = cx + u.x * r; py[i] = cy + u.y * r; pz[i] = cz + u.z * r;
    }
    for (let i = 0; i < n; i++) { ax[i] = px[i]!; ay[i] = py[i]!; az[i] = pz[i]!; }
  } else {
    const spread = EDGE * Math.cbrt(n) * 1.2;
    for (let i = 0; i < n; i++) {
      const rand = rngs[i]!;
      const u = unitVector(rand);
      const r = spread * Math.cbrt(rand());
      px[i] = u.x * r; py[i] = u.y * r; pz[i] = u.z * r;
    }
  }

  const k2 = EDGE * EDGE;
  const gravity = fixed ? 0.04 : 0.01;
  const t0 = fixed ? EDGE * 0.5 : EDGE * 2;
  const grid = new Grid(n);
  const rx = new Float64Array(n), ry = new Float64Array(n), rz = new Float64Array(n);

  for (let it = 0; it < iterations; it++) {
    const temp = t0 * (1 - it / iterations) + 0.01;
    // Repulsion is the hot loop, so its forces are reused between recomputes: every 2nd iteration
    // while the step cap is above half its start, every 4th once it has cooled below that (nodes
    // then move ≤ t0/2 per step, so neighbourhoods barely change). This is what keeps 500 nodes well
    // under 50 ms. The schedule is fixed, so the result stays deterministic.
    if (it % (it < iterations / 2 ? 2 : 4) === 0) {
      rx.fill(0); ry.fill(0); rz.fill(0);
      grid.repulse(px, py, pz, rx, ry, rz, k2);
    }
    dx.set(rx); dy.set(ry); dz.set(rz);

    // Attraction along relations.
    for (let e = 0; e < ea.length; e++) {
      const a = ea[e]!, b = eb[e]!;
      const vx = px[a]! - px[b]!, vy = py[a]! - py[b]!, vz = pz[a]! - pz[b]!;
      const d = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const f = (d / EDGE) * ew[e]!; // (d²/k) along the unit vector = d·v/k
      dx[a] = dx[a]! - vx * f; dy[a] = dy[a]! - vy * f; dz[a] = dz[a]! - vz * f;
      dx[b] = dx[b]! + vx * f; dy[b] = dy[b]! + vy * f; dz[b] = dz[b]! + vz * f;
    }

    // Gravity (to the origin, or to the birth spot when authored nodes frame the scene), then move.
    for (let i = 0; i < n; i++) {
      if (pinned[i]) continue;
      let fx = dx[i]!, fy = dy[i]!, fz = dz[i]!;
      if (fixed) { fx -= (px[i]! - ax[i]!) * gravity * EDGE; fy -= (py[i]! - ay[i]!) * gravity * EDGE; fz -= (pz[i]! - az[i]!) * gravity * EDGE; }
      else { fx -= px[i]! * gravity * EDGE; fy -= py[i]! * gravity * EDGE; fz -= pz[i]! * gravity * EDGE; }
      const len = Math.sqrt(fx * fx + fy * fy + fz * fz);
      if (len > 0) {
        const step = Math.min(len, temp) / len;
        px[i] = px[i]! + fx * step; py[i] = py[i]! + fy * step; pz[i] = pz[i]! + fz * step;
      }
    }
  }

  if (!fixed) {
    // Centre on the centroid and normalise the farthest node onto `radius`.
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < n; i++) { cx += px[i]!; cy += py[i]!; cz += pz[i]!; }
    cx /= n; cy /= n; cz /= n;
    let far = 0;
    for (let i = 0; i < n; i++) far = Math.max(far, Math.hypot(px[i]! - cx, py[i]! - cy, pz[i]! - cz));
    const scale = far > 1e-9 ? radius / far : 0;
    for (let i = 0; i < n; i++) { px[i] = (px[i]! - cx) * scale; py[i] = (py[i]! - cy) * scale; pz[i] = (pz[i]! - cz) * scale; }
  }

  for (let i = 0; i < n; i++) out.set(ids[i]!, { x: px[i]!, y: py[i]!, z: pz[i]! });
  return out;
}

/**
 * Short-range repulsion on a uniform grid, rebuilt each iteration by counting sort. The grid is
 * padded by one empty cell on every side, so the 13 "forward" neighbour cells of any occupied
 * cell are constant index deltas (no bounds checks), and every unordered pair of nearby nodes is
 * visited exactly once. Coordinates are copied into cell order so the inner loop reads memory
 * sequentially. Typed arrays only: this is the layout's hot loop.
 */
class Grid {
  readonly n: number;
  readonly cellOf: Int32Array;
  readonly order: Int32Array; // slot → node
  /** Interleaved x, y, z per slot: one cache line holds a node and its neighbour. */
  readonly pos: Float64Array;
  readonly force: Float64Array;
  readonly slotCell: Int32Array;
  readonly forward = new Int32Array(13);
  starts = new Int32Array(1);
  fill = new Int32Array(1);

  constructor(n: number) {
    this.n = n;
    this.cellOf = new Int32Array(n);
    this.order = new Int32Array(n);
    this.slotCell = new Int32Array(n);
    this.pos = new Float64Array(n * 3);
    this.force = new Float64Array(n * 3);
  }

  repulse(px: Float64Array, py: Float64Array, pz: Float64Array, dx: Float64Array, dy: Float64Array, dz: Float64Array, k2: number): void {
    const n = this.n;
    let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < n; i++) {
      const x = px[i]!, y = py[i]!, z = pz[i]!;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const MAX_DIM = 40;
    const cell = Math.max(CUTOFF, (maxX - minX) / MAX_DIM, (maxY - minY) / MAX_DIM, (maxZ - minZ) / MAX_DIM);
    const cutoff2 = CUTOFF * CUTOFF; // the range stays fixed even when a sprawling layout forces bigger cells
    const nx = Math.floor((maxX - minX) / cell) + 3, ny = Math.floor((maxY - minY) / cell) + 3, nz = Math.floor((maxZ - minZ) / cell) + 3;
    const cells = nx * ny * nz;
    if (this.starts.length < cells + 1) { this.starts = new Int32Array(cells + 1); this.fill = new Int32Array(cells + 1); }
    const starts = this.starts, fill = this.fill, cellOf = this.cellOf, order = this.order;
    starts.fill(0, 0, cells + 1);
    for (let i = 0; i < n; i++) {
      const c = (Math.floor((px[i]! - minX) / cell) + 1) + nx * ((Math.floor((py[i]! - minY) / cell) + 1) + ny * (Math.floor((pz[i]! - minZ) / cell) + 1));
      cellOf[i] = c;
      starts[c + 1] = starts[c + 1]! + 1;
    }
    for (let c = 0; c < cells; c++) starts[c + 1] = starts[c + 1]! + starts[c]!;
    fill.set(starts.subarray(0, cells));
    const pos = this.pos, force = this.force, slotCell = this.slotCell;
    for (let i = 0; i < n; i++) {
      const c = cellOf[i]!;
      const slot = fill[c]!;
      fill[c] = slot + 1;
      order[slot] = i;
      slotCell[slot] = c;
      pos[slot * 3] = px[i]!; pos[slot * 3 + 1] = py[i]!; pos[slot * 3 + 2] = pz[i]!;
    }
    force.fill(0);
    const fwd = this.forward;
    let f = 0;
    for (let oz = -1; oz <= 1; oz++) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      if (oz > 0 || (oz === 0 && (oy > 0 || (oy === 0 && ox > 0)))) fwd[f++] = ox + nx * (oy + ny * oz);
    }

    for (let a = 0; a < n; a++) {
      const c = slotCell[a]!;
      const xa = pos[a * 3]!, ya = pos[a * 3 + 1]!, za = pos[a * 3 + 2]!;
      let ax = 0, ay = 0, az = 0;
      // The rest of this cell (slots after a), then the 13 forward cells.
      for (let k = -1; k < 13; k++) {
        let b: number, end: number;
        if (k < 0) { b = a + 1; end = starts[c + 1]!; }
        else { const o = c + fwd[k]!; b = starts[o]!; end = starts[o + 1]!; }
        for (; b < end; b++) {
          const q = b * 3;
          let vx = xa - pos[q]!, vy = ya - pos[q + 1]!, vz = za - pos[q + 2]!;
          let d2 = vx * vx + vy * vy + vz * vz;
          if (d2 > cutoff2) continue;
          if (d2 < 1e-6) {
            // Coincident: push apart along a direction fixed by the pair, not by chance.
            const i = order[a]!, j = order[b]!;
            const lo = i < j ? i : j, hi = i < j ? j : i, sign = i < j ? 1 : -1;
            const ang = ((lo * 7919 + hi * 104729) % 360) * (Math.PI / 180);
            vx = Math.cos(ang) * 0.01 * sign; vy = Math.sin(ang) * 0.01 * sign; vz = 0.005 * sign;
            d2 = vx * vx + vy * vy + vz * vz;
          }
          const s = k2 / d2; // (k²/d) along the unit vector = k²·v/d²
          ax += vx * s; ay += vy * s; az += vz * s;
          force[q] = force[q]! - vx * s; force[q + 1] = force[q + 1]! - vy * s; force[q + 2] = force[q + 2]! - vz * s;
        }
      }
      force[a * 3] = force[a * 3]! + ax; force[a * 3 + 1] = force[a * 3 + 1]! + ay; force[a * 3 + 2] = force[a * 3 + 2]! + az;
    }
    for (let a = 0; a < n; a++) {
      const i = order[a]!;
      dx[i] = dx[i]! + force[a * 3]!; dy[i] = dy[i]! + force[a * 3 + 1]!; dz[i] = dz[i]! + force[a * 3 + 2]!;
    }
  }
}
