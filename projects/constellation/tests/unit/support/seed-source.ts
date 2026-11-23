// tests/unit/support/seed-source.ts — the seed memory, transcribed from design/experience.md §5,
// with per-lens positions computed by the §6 rules. `src/seed/memory.json` is this module's
// output (write it with `node tests/unit/support/write-seed.ts`); [U-persistence-*] fails if the
// two drift apart.
//
// Mapping from the spec's relation words to the v1 format (RelationType is frozen):
//   relates → association · is-a → association, label "is-a" · references → association, label
//   "references" · part-of → part-of · next (Long Road) → chain · reads → association, label
//   "reads" (pathway → the node it reads) · pathway arrows → flow with branch next/true/false.
// Every relation except flow is undirected: §5 says "Relations are traversable both ways for
// routing". `from`/`to` keep the spec's arrow direction for drawing.
// Numbers that conditions compare are stored as numbers (plan.md quality note); how they read
// lives in `units` (display only): K for the Physicist, °C for the Cook, and for the Child the
// hand-feel word §5 gives each value ("2 · warm" → value 2, unit "· warm").
import { forceLayout } from '../../../src/core/layout.ts';
import { canonMeta, canonNode, canonPerspective, canonRelation, hashString, mulberry32 } from '../../../src/core/internal.ts';
import type { MemoryDoc, MemoryNode, NodeKind, PathwayStep, Perspective, Relation, RelationType, Value, Vec3 } from '../../../src/core/types.ts';

export const SEED_TIME = Date.UTC(2026, 10, 1);
type Lens = 'cook' | 'physicist' | 'child';
const LENSES: Lens[] = ['cook', 'physicist', 'child'];
type Tri = [p: Value, c: Value, ch: Value];
type Cluster = 'heat' | 'files' | 'variables' | 'meta' | 'long-road' | 'simmer' | 'serve';

const nodes: MemoryNode[] = [];
const relations: Relation[] = [];
const clusterOf = new Map<string, Cluster>();

function node(id: string, label: string, kind: NodeKind, cluster: Cluster, value: Value, facets?: Tri, extra: Partial<MemoryNode> = {}): void {
  const n: MemoryNode = { id, label, kind, value, facets: {}, tags: [cluster], created: SEED_TIME, updated: SEED_TIME, ...extra };
  if (facets) n.facets = { physicist: facets[0], cook: facets[1], child: facets[2] };
  nodes.push(n);
  clusterOf.set(id, cluster);
}

const counters = new Map<string, number>();
function rel(group: string, from: string, to: string, word: 'relates' | 'is-a' | 'references' | 'part-of' | 'next' | 'reads', lenses?: Lens[]): void {
  const n = (counters.get(group) ?? 0) + 1;
  counters.set(group, n);
  const type: RelationType = word === 'next' ? 'chain' : word === 'part-of' ? 'part-of' : 'association';
  const r: Relation = { id: `${group}-${String(n).padStart(2, '0')}`, from, to, type, weight: 1, directed: false, created: SEED_TIME };
  if (word !== 'relates') r.label = word;
  if (lenses) r.perspectives = [...lenses];
  relations.push(r);
}

function flow(from: string, to: string, branch: 'next' | 'true' | 'false', label?: string): void {
  const n = (counters.get('flow') ?? 0) + 1;
  counters.set('flow', n);
  const r: Relation = { id: `flow-${String(n).padStart(2, '0')}`, from, to, type: 'flow', weight: 1, directed: true, branch, created: SEED_TIME };
  if (label) r.label = label;
  relations.push(r);
}

function step(id: string, label: string, cluster: Cluster, pathway: PathwayStep): void {
  node(id, label, 'pathway', cluster, null, undefined, { pathway });
}

// ── Heat cluster (16) ────────────────────────────────────────────────────────────────────
// Base value = the Cook value (the default lens); every lens has its own facet.
const units = (child: string) => ({ units: { physicist: 'K', cook: '°C', child } });
node('temperature', 'Temperature', 'variable', 'heat', 20, [293, 20, 2], units('· warm'));
node('boiling-point', 'Boiling Point', 'variable', 'heat', 100, [373, 100, 5], units('· bubbly'));
node('flame-step', 'Flame Step', 'variable', 'heat', 40, [20, 40, 1], units('· a bit'));
node('safe-to-touch', 'Safe To Touch', 'variable', 'heat', 45, [318, 45, 1], units('· cool'));
node('room', 'Room', 'variable', 'heat', 18, [295, 18, 1], units('· cool'));
node('heat', 'Heat', 'concept', 'heat', 'how high the flame is', ['energy moving from hot to cold', 'how high the flame is', 'the thing that says ouch']);
node('steam', 'Steam', 'concept', 'heat', 'the soup is ready', ['water as gas, above 373 K', 'the soup is ready', 'the cloud from the pot']);
node('soup', 'Soup', 'concept', 'heat', "Tuesday's leek soup", ['mostly water, 1.0 kg', "Tuesday's leek soup", 'dinner']);
node('burn', 'Burn', 'concept', 'heat', 'what happens when you rush', ['tissue damage above ~317 K', 'what happens when you rush', 'ouch']);
node('energy', 'Energy', 'concept', 'heat', 'never made or destroyed');
node('molecules', 'Molecules', 'concept', 'heat', 'jiggle faster when hot');
node('kelvin', 'Kelvin', 'concept', 'heat', 'absolute scale');
node('stove', 'Stove', 'concept', 'heat', null);
node('pot', 'Pot', 'concept', 'heat', null);
node('ice', 'Ice', 'concept', 'heat', null);
node('thermometer', 'Thermometer', 'concept', 'heat', null);

// ── Files (12) ───────────────────────────────────────────────────────────────────────────
const MIME: Record<string, string> = { txt: 'text/plain', csv: 'text/csv', png: 'image/png', md: 'text/markdown', cfg: 'text/plain', pdf: 'application/pdf', js: 'text/javascript', json: 'application/json' };
function file(id: string, name: string, path: string, value: Value, facets?: Tri, sizeNote?: string, content?: string): void {
  const f: MemoryNode['file'] = { name, path, mime: MIME[name.split('.').pop()!]! };
  if (sizeNote) f.sizeNote = sizeNote;
  if (content) f.content = content;
  node(id, name, 'file', 'files', value, facets, { file: f });
}
file('recipe', 'recipe.txt', '/kitchen/recipe.txt', "Grandma's leek soup", ['2.1 KB of UTF-8 text', "Grandma's leek soup", 'the paper with the soup on it'], '2.1 KB', 'Leeks, butter, stock. Simmer until it smells like home.');
file('boiling-curve', 'boiling-curve.csv', '/lab/boiling-curve.csv', 'why soup is slow in the mountains', ['pressure vs boiling point, 40 rows', 'why soup is slow in the mountains', 'numbers'], '38 KB');
file('drawing-of-a-sun', 'drawing-of-a-sun.png', '/home/drawings/sun.png', 'stuck on the fridge', ['a 5778 K blackbody, roughly', 'stuck on the fridge', 'MY SUN'], '640 KB');
file('lab-notes', 'lab-notes.md', '/lab/lab-notes.md', null);
file('shopping-list', 'shopping-list.txt', '/home/shopping-list.txt', null);
file('thermostat', 'thermostat.cfg', '/home/thermostat.cfg', null);
file('kettle-manual', 'kettle-manual.pdf', '/home/kettle-manual.pdf', null);
file('timer', 'timer.js', '/code/timer.js', null);
file('loop-notes', 'loop-notes.md', '/code/loop-notes.md', null);
file('readme', 'README.md', '/code/README.md', null);
file('sim-config', 'sim-config.json', '/lab/sim-config.json', null);
file('bedtime-story', 'bedtime-story.txt', '/home/bedtime-story.txt', null);

// ── Variables (10) ───────────────────────────────────────────────────────────────────────
node('var-limit', 'limit', 'variable', 'variables', 90, [100, 90, 3]);
node('var-unit', 'unit', 'variable', 'variables', '°C', ['K', '°C', 'hand-feel']);
node('var-count', 'count', 'variable', 'variables', 0);
node('var-i', 'i', 'variable', 'variables', 0);
node('var-done', 'done', 'variable', 'variables', false);
node('var-step', 'step', 'variable', 'variables', 1);
node('var-total', 'total', 'variable', 'variables', 0);
node('var-name', 'name', 'variable', 'variables', 'Constellation');
node('var-epsilon', 'epsilon', 'variable', 'variables', 0.001);
node('var-retries', 'retries', 'variable', 'variables', 3);

// ── Meta, "How this works" (10) ──────────────────────────────────────────────────────────
for (const label of ['Memory', 'Perspective', 'Facet', 'Relation', 'Shortcut', 'Route', 'Recall', 'Pathway', 'Loop', 'Condition']) {
  node(`meta-${label.toLowerCase()}`, label, 'concept', 'meta', null);
}

// ── Long Road (26) ───────────────────────────────────────────────────────────────────────
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
LETTERS.forEach((l, i) => node(`road-${l.toLowerCase()}`, l, 'concept', 'long-road', `stop ${i + 1} of 26`));

// ── Pathways (14) ────────────────────────────────────────────────────────────────────────
// Labels name the step in words; the expressions carry the exact logic. P4's label avoids the word
// "boil" so that search "boil" matches exactly the two nodes §5 expects.
step('p1', 'Simmer until done', 'simmer', { op: 'start' });
step('p2', 'read heat ← Temperature', 'simmer', { op: 'read', target: 'heat', source: 'temperature' });
step('p3', 'assign stirs ← 0', 'simmer', { op: 'assign', target: 'stirs', expr: '0' });
step('p4', 'while heat is too low', 'simmer', { op: 'while', expr: 'heat < @"Boiling Point"' });
step('p5', 'assign heat ← heat + Flame Step', 'simmer', { op: 'assign', target: 'heat', expr: 'heat + @"Flame Step"' });
step('p6', 'assign stirs ← stirs + 1', 'simmer', { op: 'assign', target: 'stirs', expr: 'stirs + 1' });
step('p7', 'end: done after n stirs', 'simmer', { op: 'end', expr: '"Done after " + stirs + " stirs · heat " + heat' });
step('q1', 'What should I do with it?', 'serve', { op: 'start' });
step('q2', 'read t ← Temperature', 'serve', { op: 'read', target: 't', source: 'temperature' });
step('q3', 'if t > Safe To Touch', 'serve', { op: 'if', expr: 't > @"Safe To Touch"' });
step('q4', 'end: Wait, too hot to touch.', 'serve', { op: 'end', expr: '"Wait, too hot to touch."' });
step('q5', 'if t < Room', 'serve', { op: 'if', expr: 't < @Room' });
step('q6', 'end: Warm it up.', 'serve', { op: 'end', expr: '"Warm it up."' });
step('q7', 'end: Serve it.', 'serve', { op: 'end', expr: '"Serve it."' });

// ── Relations ────────────────────────────────────────────────────────────────────────────
// Heat (19)
rel('heat', 'temperature', 'heat', 'relates');
rel('heat', 'temperature', 'thermometer', 'relates');
rel('heat', 'boiling-point', 'temperature', 'relates');
rel('heat', 'ice', 'temperature', 'relates');
rel('heat', 'room', 'temperature', 'relates');
rel('heat', 'safe-to-touch', 'temperature', 'relates');
rel('heat', 'temperature', 'kelvin', 'relates', ['physicist']);
rel('heat', 'temperature', 'molecules', 'relates', ['physicist']);
rel('heat', 'heat', 'energy', 'is-a', ['physicist']);
rel('heat', 'heat', 'stove', 'relates', ['cook']);
rel('heat', 'heat', 'burn', 'relates', ['cook', 'child']);
rel('heat', 'boiling-point', 'steam', 'relates');
rel('heat', 'steam', 'pot', 'relates');
rel('heat', 'pot', 'stove', 'relates');
rel('heat', 'soup', 'pot', 'part-of');
rel('heat', 'soup', 'steam', 'relates', ['cook']);
rel('heat', 'ice', 'molecules', 'relates', ['physicist']);
rel('heat', 'flame-step', 'stove', 'relates');
rel('heat', 'safe-to-touch', 'burn', 'relates');
// Files (18)
rel('file', 'recipe', 'soup', 'references');
rel('file', 'recipe', 'pot', 'references', ['cook']);
rel('file', 'lab-notes', 'kelvin', 'references');
rel('file', 'lab-notes', 'molecules', 'references');
rel('file', 'boiling-curve', 'boiling-point', 'references');
rel('file', 'shopping-list', 'recipe', 'relates', ['cook']);
rel('file', 'drawing-of-a-sun', 'heat', 'references', ['child']);
rel('file', 'drawing-of-a-sun', 'bedtime-story', 'relates', ['child']);
rel('file', 'thermostat', 'room', 'references');
rel('file', 'kettle-manual', 'boiling-point', 'references');
rel('file', 'timer', 'meta-loop', 'references');
rel('file', 'timer', 'var-count', 'references');
rel('file', 'loop-notes', 'meta-loop', 'references');
rel('file', 'loop-notes', 'meta-condition', 'references');
rel('file', 'readme', 'meta-memory', 'references');
rel('file', 'sim-config', 'var-epsilon', 'references');
rel('file', 'sim-config', 'lab-notes', 'relates', ['physicist']);
rel('file', 'bedtime-story', 'soup', 'references', ['child']);
// Variables (10)
rel('var', 'var-limit', 'var-count', 'relates');
rel('var', 'var-count', 'var-i', 'relates');
rel('var', 'var-i', 'var-step', 'relates');
rel('var', 'var-done', 'meta-condition', 'relates');
rel('var', 'var-total', 'var-count', 'relates');
rel('var', 'var-unit', 'temperature', 'relates');
rel('var', 'var-unit', 'kelvin', 'relates', ['physicist']);
rel('var', 'var-epsilon', 'var-limit', 'relates', ['physicist']);
rel('var', 'var-retries', 'meta-loop', 'relates');
rel('var', 'var-name', 'meta-memory', 'relates');
// Meta (10)
rel('meta', 'meta-memory', 'meta-perspective', 'relates');
rel('meta', 'meta-memory', 'meta-relation', 'relates');
rel('meta', 'meta-memory', 'meta-recall', 'relates');
rel('meta', 'meta-memory', 'meta-pathway', 'relates');
rel('meta', 'meta-shortcut', 'meta-relation', 'is-a');
rel('meta', 'meta-recall', 'meta-route', 'relates');
rel('meta', 'meta-route', 'meta-shortcut', 'relates');
rel('meta', 'meta-pathway', 'meta-loop', 'relates');
rel('meta', 'meta-pathway', 'meta-condition', 'relates');
rel('meta', 'meta-perspective', 'meta-facet', 'relates');
// Bridges (6)
rel('bridge', 'meta-facet', 'temperature', 'relates');
rel('bridge', 'meta-route', 'road-a', 'relates');
rel('bridge', 'meta-pathway', 'p1', 'relates');
rel('bridge', 'meta-pathway', 'q1', 'relates');
rel('bridge', 'meta-loop', 'p4', 'relates');
rel('bridge', 'meta-condition', 'q3', 'relates');
// Long Road (28): 25 declared hops, plus the hidden routes A–F, F–X [P,C], X–Z.
for (let i = 0; i < 25; i++) rel('road', `road-${LETTERS[i]!.toLowerCase()}`, `road-${LETTERS[i + 1]!.toLowerCase()}`, 'next');
rel('road', 'road-a', 'road-f', 'relates');
rel('road', 'road-f', 'road-x', 'relates', ['physicist', 'cook']);
rel('road', 'road-x', 'road-z', 'relates');
// Flow (13)
flow('p1', 'p2', 'next');
flow('p2', 'p3', 'next');
flow('p3', 'p4', 'next');
flow('p4', 'p5', 'true', 'body');
flow('p5', 'p6', 'next');
flow('p6', 'p4', 'next', 'loop');
flow('p4', 'p7', 'false', 'exit');
flow('q1', 'q2', 'next');
flow('q2', 'q3', 'next');
flow('q3', 'q4', 'true', 'then');
flow('q3', 'q5', 'false', 'else');
flow('q5', 'q6', 'true', 'then');
flow('q5', 'q7', 'false', 'else');
// Reads (6)
rel('read', 'p2', 'temperature', 'reads');
rel('read', 'p4', 'boiling-point', 'reads');
rel('read', 'p5', 'flame-step', 'reads');
rel('read', 'q2', 'temperature', 'reads');
rel('read', 'q3', 'safe-to-touch', 'reads');
rel('read', 'q5', 'room', 'reads');

// ── Layout per lens (experience.md §6) ───────────────────────────────────────────────────
type Anchor = { at: Vec3; r: number };
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const CLUSTERS: Record<'heat' | 'files' | 'variables' | 'meta', Record<Lens, Anchor>> = {
  // Heat radii are §6's ×1.6 so the hub cluster never knots at the overview (F-030).
  heat: { cook: { at: v(0, 10, 0), r: 58 }, physicist: { at: v(0, 0, 0), r: 67 }, child: { at: v(0, 0, 30), r: 80 } },
  files: { cook: { at: v(-130, 70, -40), r: 38 }, physicist: { at: v(150, 30, -50), r: 38 }, child: { at: v(-70, 80, 0), r: 40 } },
  variables: { cook: { at: v(150, -70, -90), r: 34 }, physicist: { at: v(-150, 20, -30), r: 30 }, child: { at: v(160, 90, -120), r: 30 } },
  meta: { cook: { at: v(0, 120, -90), r: 30 }, physicist: { at: v(0, 95, -40), r: 30 }, child: { at: v(-140, -20, -60), r: 34 } },
};
const FLOWCHARTS: Record<'simmer' | 'serve', { anchor: Record<Lens, Vec3>; offsets: Record<string, [number, number]> }> = {
  simmer: {
    anchor: { cook: v(-60, -30, 50), physicist: v(-95, -35, 60), child: v(-90, -60, 60) },
    offsets: { p1: [0, 30], p2: [0, 18], p3: [0, 6], p4: [0, -6], p5: [14, -6], p6: [7, -17], p7: [-10, -20] },
  },
  serve: {
    anchor: { cook: v(60, -30, 50), physicist: v(95, -35, 60), child: v(110, 10, 60) },
    offsets: { q1: [0, 30], q2: [0, 18], q3: [0, 6], q4: [-14, -6], q5: [14, -6], q6: [6, -20], q7: [24, -20] },
  },
};
const RING: Record<Lens, { at: Vec3; R: number; tilt: number; wobble: number }> = {
  cook: { at: v(0, -130, -30), R: 70, tilt: 25, wobble: 6 }, // 10 u lower than §6: the top lap clears Simmer (F-030)
  physicist: { at: v(0, -110, 0), R: 70, tilt: 12, wobble: 0 },
  child: { at: v(40, -100, 0), R: 55, tilt: 35, wobble: 14 },
};

const round2 = (n: number): number => Math.round(n * 100) / 100 + 0; // + 0 turns -0 into 0
const r2 = (p: Vec3): Vec3 => ({ x: round2(p.x), y: round2(p.y), z: round2(p.z) });

/** Turns of the Long Road: 1½, so Z ends 180° from A (polish F-016: the learned A–Z line crosses the centre). */
export const RING_TURN_DEG = 540;

/**
 * The Long Road is a 1½-turn spiral ring in the ground plane (x, z). Stop i (0…25) sits at
 * φ = 180° − 540°·i/25, so A is at the far left, the road circles once and then halfway again,
 * and Z ends at the far right, opposite A. The radius grows from R − s to R + s (s = 12 + wobble/2)
 * so the two laps never touch, plus wobble/2 · sin(1.9i). The ring then tilts its near edge down
 * by `tilt` so the default camera sees an open ellipse. A → F is a chord across the interior, and
 * a learned A–Z shortcut is a diameter through the centre. (Re-authored from §6 for F-016.)
 */
export function ringPosition(lens: Lens, i: number): Vec3 {
  const ring = RING[lens];
  const phi = ((180 - (RING_TURN_DEG * i) / 25) * Math.PI) / 180;
  const spread = 12 + ring.wobble / 2;
  const r = ring.R - spread + (2 * spread * i) / 25 + (ring.wobble / 2) * Math.sin(1.9 * i);
  const gx = r * Math.cos(phi);
  const gz = -r * Math.sin(phi);
  const t = (ring.tilt * Math.PI) / 180;
  return { x: ring.at.x + gx, y: ring.at.y - gz * Math.sin(t), z: ring.at.z + gz * Math.cos(t) };
}

/**
 * Screen-plane declutter (F-030). The default camera looks along −z from 12° above, so two lights
 * overlap on screen when they are close in (u, v) = (x, y·cos12° − z·sin12°), whatever their depth.
 * Linked cluster members closer than 19 u (both Heat) or 13 u (otherwise) to any light are pushed
 * apart in x and y; flowchart steps, ring stops and rim orphans never move (their partner takes the
 * whole push). Pairs are visited in a fixed order, so the result is deterministic.
 */
function declutter(pos: Record<string, Vec3>, movable: string[]): void {
  const EL = (12 * Math.PI) / 180, COS = Math.cos(EL), SIN = Math.sin(EL);
  const canMove = new Set(movable);
  const ids = Object.keys(pos).sort();
  const heat = (id: string) => clusterOf.get(id) === 'heat';
  const pv = (id: string) => pos[id]!.y * COS - pos[id]!.z * SIN;
  for (let it = 0; it < 400; it++) {
    let moved = 0;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]!, b = ids[j]!;
      const ma = canMove.has(a), mb = canMove.has(b);
      if (!ma && !mb) continue;
      const min = heat(a) && heat(b) ? 19 : 13;
      let du = pos[a]!.x - pos[b]!.x, dv = pv(a) - pv(b);
      let d = Math.hypot(du, dv);
      if (d >= min) continue;
      if (d < 1e-6) { const ang = (((i * 37 + j * 101) % 360) * Math.PI) / 180; du = Math.cos(ang); dv = Math.sin(ang); d = 1; }
      const push = (min - d) / 2 + 0.05;
      const ux = (du / d) * push, uv = (dv / d) * push;
      const wa = ma ? (mb ? 1 : 2) : 0, wb = mb ? (ma ? 1 : 2) : 0;
      pos[a] = { x: pos[a]!.x + ux * wa, y: pos[a]!.y + (uv * wa) / COS, z: pos[a]!.z };
      pos[b] = { x: pos[b]!.x - ux * wb, y: pos[b]!.y - (uv * wb) / COS, z: pos[b]!.z };
      moved++;
    }
    if (!moved) break;
  }
  for (const id of movable) pos[id] = r2(pos[id]!);
}

function positionsFor(lens: Lens): Record<string, Vec3> {
  const out: Record<string, Vec3> = {};
  const visible = relations.filter((r) => !r.perspectives || r.perspectives.includes(lens));
  const linked = new Set(visible.flatMap((r) => [r.from, r.to]));
  for (const name of ['heat', 'files', 'variables', 'meta'] as const) {
    const { at, r } = CLUSTERS[name][lens];
    const members = nodes.filter((n) => clusterOf.get(n.id) === name);
    const ids = new Set(members.map((n) => n.id));
    const inner = visible.filter((rel) => ids.has(rel.from) && ids.has(rel.to) && rel.type !== 'flow');
    const local = forceLayout(members, inner, { seed: lens, radius: r });
    for (const n of members) {
      let p = local.get(n.id)!;
      if (!linked.has(n.id)) {
        // A node with no visible lines in this lens drifts to its cluster rim (§5, polish 23).
        const rand = mulberry32(hashString(lens + n.id));
        const z = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - z * z);
        p = { x: s * Math.cos(a) * r, y: s * Math.sin(a) * r, z: z * r };
      }
      out[n.id] = r2({ x: at.x + p.x, y: at.y + p.y, z: at.z + p.z });
    }
  }
  for (const name of ['simmer', 'serve'] as const) {
    const { anchor, offsets } = FLOWCHARTS[name];
    for (const [id, [ox, oy]] of Object.entries(offsets)) out[id] = r2({ x: anchor[lens].x + ox, y: anchor[lens].y + oy, z: anchor[lens].z });
  }
  LETTERS.forEach((l, i) => { out[`road-${l.toLowerCase()}`] = r2(ringPosition(lens, i)); });
  const FREE = new Set(['heat', 'files', 'variables', 'meta']);
  declutter(out, nodes.filter((n) => FREE.has(clusterOf.get(n.id) ?? '') && linked.has(n.id)).map((n) => n.id));
  // Same key order as the node list, so the JSON reads cluster by cluster.
  const ordered: Record<string, Vec3> = {};
  for (const n of nodes) ordered[n.id] = out[n.id]!;
  return ordered;
}

const PERSPECTIVES: Array<Omit<Perspective, 'positions'> & { id: Lens }> = [
  { id: 'cook', label: 'Cook', description: 'Kitchen truths in °C. Pathways and recipe files pulled close; variables pushed far away.', accent: '#FF9F5A' },
  { id: 'physicist', label: 'Physicist', description: 'Kelvin and molecules. Exclusive lines to Kelvin, Molecules and Energy; the Long Road is a precise flat ring.', accent: '#6FD3FF' },
  { id: 'child', label: 'Child', description: 'Values on a 0–5 hand-feel scale. Drawing and bedtime-story lines appear. It cannot see F–X, so its shortcut is longer.', accent: '#FF7EC8' },
];

export function buildSeed(): MemoryDoc {
  return {
    schema: 'constellation.memory',
    version: 1,
    meta: canonMeta({
      title: 'Heat, a long road and two pathways',
      description: 'The seed memory: one kitchen seen by a Cook, a Physicist and a Child. Switch lenses to watch values, lines and outcomes change.',
      defaultPerspective: 'cook',
      featured: { route: { from: 'road-a', to: 'road-z' }, pathway: 'p1', query: 'boil' },
    }),
    // Canonical key order, so the file is byte-identical to exportJson of itself.
    perspectives: PERSPECTIVES.map((p) => canonPerspective({ ...p, positions: positionsFor(p.id) })),
    nodes: nodes.map(canonNode),
    relations: relations.map(canonRelation),
  };
}

export { LENSES };
