// src/view/renderer.ts — the void (experience.md §7 Look, §8 Camera, §9 frames F1–F12).
// One rAF loop driven by one clock; every frame the CPU recomputes node/edge/sprite attributes
// (cheap at 500 nodes) and the overlay places labels every 2nd frame.
import { Color, Scene, Vector3, WebGLRenderer } from 'three';
import type { Activation, FacetView, NodeId, PerspectiveId, Trace } from '../core/index.ts';
import { CameraRig } from './camera.ts';
import type {
  CreateRenderer,
  EdgeLook,
  Insets,
  PlaybackOptions,
  RenderDebugState,
  Renderer,
  RendererExtras,
  RouteTrail,
  SceneNode,
  SceneSnapshot,
  TransitionOptions,
} from './contracts.ts';
import { createDust, DASH, KIND_CODE, LineLayer, LiteLineLayer, NodeLayer, OP_CODE, SHEEN, SPRITE, SpriteLayer, type LineSpec } from './layers.ts';
import { clamp, createClock, easeBack, easeInOut, easeOut, easeSine, hash01, lerp, range } from './motion.ts';
import { Overlay, type OverlayItem } from './overlay.ts';

type RGB = [number, number, number];
/** sRGB 0..1 straight from the token (three's Color would convert to linear; our shaders output sRGB as-is). */
const hex = (h: string): RGB => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  if (!m) {
    const c = new Color().setStyle(h);
    return [c.r, c.g, c.b];
  }
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const mix = (a: RGB, b: RGB, u: number): RGB => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const toCss = (c: RGB) => `rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`;

const STAR = hex('#F4F6FF');
const INK = hex('#E8ECF5');
const INK_DIM = hex('#9AA3B8');
const PULSE = hex('#8CFFD1');
const FALSE = hex('#FF8A7A');
const TRAIL_LONG = hex('#8E96C8');
const SIGNAL = hex('#E6FF6E');
const DEFAULT_LENS = hex('#FF9F5A');

interface EdgeStyle {
  rgb: RGB;
  alpha: number;
  width: number;
  dash: number;
  sheen: number;
}
const EDGE: Record<EdgeLook, EdgeStyle> = {
  relates: { rgb: INK, alpha: 0.16, width: 1, dash: DASH.solid, sheen: SHEEN.none },
  'is-a': { rgb: INK, alpha: 0.22, width: 1.25, dash: DASH.solid, sheen: SHEEN.isa },
  causes: { rgb: INK, alpha: 0.2, width: 1.25, dash: DASH.solid, sheen: SHEEN.isa },
  'part-of': { rgb: INK, alpha: 0.18, width: 1, dash: DASH.dashed, sheen: SHEEN.none },
  next: { rgb: INK, alpha: 0.2, width: 1, dash: DASH.solid, sheen: SHEEN.road },
  references: { rgb: INK_DIM, alpha: 0.18, width: 1, dash: DASH.dotted, sheen: SHEEN.none },
  reads: { rgb: PULSE, alpha: 0.22, width: 1, dash: DASH.fine, sheen: SHEEN.none },
  flow: { rgb: PULSE, alpha: 0.45, width: 1.5, dash: DASH.solid, sheen: SHEEN.none },
  shortcut: { rgb: SIGNAL, alpha: 0.85, width: 2, dash: DASH.solid, sheen: SHEEN.none },
};
const LOOK_OF_TYPE: Record<string, EdgeLook> = {
  association: 'relates',
  chain: 'next',
  'part-of': 'part-of',
  causes: 'causes',
  shortcut: 'shortcut',
  flow: 'flow',
};

interface V3 {
  x: number;
  y: number;
  z: number;
}
const NEVER = -1e12;

interface NodeState {
  id: NodeId;
  idx: number;
  data: SceneNode;
  pos: V3;
  from: V3;
  to: V3;
  r: number;
  rFrom: number;
  rTo: number;
  rank: number;
  degree: number;
  road: boolean;
  phase: number;
  ignite: number;
  birth: number;
  flash: number;
  flashColor: RGB;
  burst: number;
  burstScale: number;
  nbrs: Set<NodeId>;
  /** Screen cache (this frame). */
  sx: number;
  sy: number;
  depth: number;
  pxR: number;
  onScreen: boolean;
  bright: number;
  dying: number;
}

interface EdgeState {
  id: string;
  from: NodeId;
  to: NodeId;
  look: EdgeLook;
  lensOnly: boolean;
  chip?: string;
  weight: number;
  drawT0: number;
  drawDur: number;
  morph: 'in' | 'out' | null;
  removing: number;
  endsA?: V3;
  endsB?: V3;
  phase: number;
  len: number;
}

interface Morph {
  t0: number;
  k: number;
  lensFrom: RGB;
  lensTo: RGB;
  resolve: () => void;
}

interface TrailState {
  trail: RouteTrail;
  t0: number;
}

interface Playback {
  trace: Trace;
  arrive: number[];
  dwell: number[];
  travel: number;
  lt: number;
  k: number;
  paused: boolean;
  reduced: boolean;
  onStep?: (i: number) => void;
  condText?: (step: Trace['steps'][number]) => string;
  resolve: () => void;
  endAt: number;
  done: boolean;
}

export const createRenderer: CreateRenderer = ({ container, reducedMotion }) => {
  // SDF shaders anti-alias themselves; MSAA would only cost fill rate.
  const gl = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: false });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  gl.setPixelRatio(dpr);
  gl.setClearColor(new Color(0x000000), 1);
  // Additive layers drawn in scene order; no sorting (and no bounding-sphere work per layer).
  gl.sortObjects = false;
  gl.domElement.setAttribute('aria-hidden', 'true');
  gl.domElement.tabIndex = -1;
  container.appendChild(gl.domElement);

  const scene = new Scene();
  const rig = new CameraRig();
  const nodeLayer = new NodeLayer();
  const edgeLayer = new LineLayer();
  const fxLines = new LineLayer();
  const liteLines = new LiteLineLayer();
  const sprites = new SpriteLayer();
  const dust = createDust();
  scene.add(dust, liteLines.lines, edgeLayer.mesh, fxLines.mesh, nodeLayer.points, sprites.points);
  for (const m of [nodeLayer.material, sprites.material, dust.material as typeof nodeLayer.material]) {
    if (m.uniforms.uDpr) m.uniforms.uDpr.value = dpr;
  }
  const overlay = new Overlay(container);
  const clock = createClock();

  let reduced = reducedMotion;
  let width = 1;
  let height = 1;
  let perspective: PerspectiveId = '';
  let lensColors: Partial<Record<PerspectiveId, string>> = {};
  let lensRgb: RGB = DEFAULT_LENS;
  const nodes = new Map<NodeId, NodeState>();
  let order: NodeState[] = [];
  const edges = new Map<string, EdgeState>();
  let visibleEdgeIds = new Set<string>();
  let hasScene = false;
  let roadLen = 400;

  let morph: Morph | null = null;
  let crossfade = NEVER;
  let ghostT0 = NEVER;
  let ghostHeld = false;
  let ghostHeldMix = 0;
  let intro = { t0: NEVER, speed: 1, done: true, end: 0 };

  let hovered: NodeId | null = null;
  let hoverMix = 0;
  let selected: NodeId | null = null;
  let activation: Map<NodeId, number> | null = null;
  let activationT0 = NEVER;
  let activationFade = 0;
  let trails: TrailState[] = [];
  let routeMix = 0;
  let collapse: { t0: number; a: NodeId; b: NodeId; beads: NodeId[] } | null = null;
  let playback: Playback | null = null;
  let loopBadges = new Map<NodeId, number>();
  let condChip: { id: NodeId; text: string; ok: boolean } | null = null;
  let readSpark: { from: NodeId; to: NodeId; t0: number; dur: number } | null = null;
  let traceLit = new Set<NodeId>();
  let endBloom: { id: NodeId; t0: number } | null = null;
  let linkSource: NodeId | null = null;

  const pickers = new Set<(id: NodeId | null) => void>();
  const hoverers = new Set<(id: NodeId | null) => void>();
  const frameListeners = new Set<(t: number) => void>();
  const idleWaiters: Array<() => void> = [];

  let pointer: { x: number; y: number } | null = null;
  let frameNo = 0;
  let lastT = clock.now();
  let fpsFrames = 0;
  let fpsT0 = performance.now();
  let fps = 0;
  let frameMs = 0;
  let raf = 0;
  let disposed = false;
  let renderScale = 1;

  const tmp = new Vector3();

  // ── Helpers ────────────────────────────────────────────────────────────────────────
  const lensOf = (p: PerspectiveId): RGB => {
    const c = lensColors[p];
    return c ? hex(c) : DEFAULT_LENS;
  };
  const worldR = (n: NodeState, degree: number) => (n.road ? 1.4 : 1.6 + 0.45 * Math.sqrt(degree));

  function bfsRanks(snapshot: SceneSnapshot): Map<NodeId, number> {
    const adj = new Map<NodeId, NodeId[]>();
    for (const n of snapshot.nodes) adj.set(n.id, []);
    for (const r of snapshot.relations) {
      adj.get(r.from)?.push(r.to);
      adj.get(r.to)?.push(r.from);
    }
    let root = snapshot.root && adj.has(snapshot.root) ? snapshot.root : undefined;
    if (!root) {
      let best = -1;
      for (const [id, a] of adj) if (a.length > best) ((best = a.length), (root = id));
    }
    const rank = new Map<NodeId, number>();
    if (!root) return rank;
    const queue: NodeId[] = [root];
    rank.set(root, 0);
    let i = 0;
    while (i < queue.length) {
      const id = queue[i++] as NodeId;
      const nb = [...(adj.get(id) ?? [])].sort();
      for (const n of nb) {
        if (!rank.has(n)) {
          rank.set(n, rank.size);
          queue.push(n);
        }
      }
    }
    for (const n of snapshot.nodes) if (!rank.has(n.id)) rank.set(n.id, rank.size);
    const max = Math.max(1, rank.size - 1);
    for (const [id, v] of rank) rank.set(id, v / max);
    return rank;
  }

  function degreeMap(snapshot: SceneSnapshot): Map<NodeId, number> {
    const d = new Map<NodeId, number>();
    for (const r of snapshot.relations) {
      d.set(r.from, (d.get(r.from) ?? 0) + 1);
      d.set(r.to, (d.get(r.to) ?? 0) + 1);
    }
    return d;
  }

  function roadPhases(): void {
    // Cumulative world length along `next` edges, so one sheen travels A→Z.
    const next = [...edges.values()].filter((e) => e.look === 'next' && e.removing === NEVER && e.morph !== 'out');
    const out = new Map<NodeId, EdgeState>();
    const incoming = new Set<NodeId>();
    for (const e of next) {
      out.set(e.from, e);
      incoming.add(e.to);
    }
    let total = 0;
    for (const e of next) e.phase = -1;
    for (const start of next.filter((e) => !incoming.has(e.from))) {
      let e: EdgeState | undefined = start;
      let acc = 0;
      const guard = new Set<string>();
      while (e && !guard.has(e.id)) {
        guard.add(e.id);
        const a = nodes.get(e.from)?.to;
        const b = nodes.get(e.to)?.to;
        const len = a && b ? Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) : 10;
        e.phase = acc;
        e.len = len;
        acc += len;
        e = out.get(e.to);
      }
      total = Math.max(total, acc);
    }
    roadLen = total + 60;
    edgeLayer.material.uniforms.uRoad!.value = roadLen;
  }

  function nodeFromSnapshot(n: SceneNode, idx: number): NodeState {
    return {
      id: n.id,
      idx,
      data: n,
      pos: { ...n.position },
      from: { ...n.position },
      to: { ...n.position },
      r: 2,
      rFrom: 2,
      rTo: 2,
      rank: 0,
      degree: 0,
      road: false,
      phase: hash01(n.id) * Math.PI * 2,
      ignite: NEVER,
      birth: NEVER,
      flash: NEVER,
      flashColor: STAR,
      burst: NEVER,
      burstScale: 3,
      nbrs: new Set(),
      sx: 0,
      sy: 0,
      depth: 1,
      pxR: 3,
      onScreen: false,
      bright: 1,
      dying: NEVER,
    };
  }

  function applyTopology(snapshot: SceneSnapshot): void {
    const deg = degreeMap(snapshot);
    const ranks = bfsRanks(snapshot);
    const roads = new Set<NodeId>();
    for (const r of snapshot.relations) {
      if (r.type === 'chain') {
        roads.add(r.from);
        roads.add(r.to);
      }
    }
    for (const n of nodes.values()) n.nbrs.clear();
    for (const r of snapshot.relations) {
      nodes.get(r.from)?.nbrs.add(r.to);
      nodes.get(r.to)?.nbrs.add(r.from);
    }
    for (const n of nodes.values()) {
      if (n.dying !== NEVER) continue;
      n.degree = deg.get(n.id) ?? 0;
      n.road = roads.has(n.id);
      n.rank = ranks.get(n.id) ?? 1;
      n.rTo = worldR(n, n.degree);
    }
    visibleEdgeIds = new Set(snapshot.relations.map((r) => r.id));
  }

  function edgeFrom(r: SceneSnapshot['relations'][number]): EdgeState {
    return {
      id: r.id,
      from: r.from,
      to: r.to,
      look: r.look ?? LOOK_OF_TYPE[r.type] ?? 'relates',
      lensOnly: r.lensOnly ?? false,
      chip: r.chip,
      weight: r.weight,
      drawT0: NEVER,
      drawDur: 480,
      morph: null,
      removing: NEVER,
      phase: -1,
      len: 1,
    };
  }

  function syncOrder(): void {
    order = [...nodes.values()];
    order.forEach((n, i) => (n.idx = i));
  }

  // ── Scene updates ────────────────────────────────────────────────────────────────
  function setScene(snapshot: SceneSnapshot): void {
    const now = clock.now();
    const sameLens = hasScene && snapshot.perspective === perspective;
    const incoming = new Set(snapshot.nodes.map((n) => n.id));
    const fresh = snapshot.nodes.filter((n) => !nodes.has(n.id)).length;
    const reset = !hasScene || !sameLens || fresh > Math.max(4, snapshot.nodes.length * 0.3);
    lensColors = snapshot.lensColors ?? lensColors;
    perspective = snapshot.perspective;
    if (morph) {
      const m = morph;
      morph = null;
      m.resolve();
    }
    lensRgb = lensOf(perspective);

    // Nodes
    for (const [id, n] of nodes) {
      if (!incoming.has(id)) {
        if (reset || reduced) nodes.delete(id);
        else if (n.dying === NEVER) n.dying = now;
      }
    }
    snapshot.nodes.forEach((sn, i) => {
      let n = nodes.get(sn.id);
      if (!n) {
        n = nodeFromSnapshot(sn, i);
        if (!reset && !reduced) n.birth = now;
        nodes.set(sn.id, n);
      }
      n.data = sn;
      n.dying = NEVER;
      n.pos = { ...sn.position };
      n.from = { ...sn.position };
      n.to = { ...sn.position };
    });
    syncOrder();
    applyTopology(snapshot);
    for (const n of nodes.values()) {
      n.r = n.rTo;
      n.rFrom = n.rTo;
    }

    // Edges
    const rel = new Set(snapshot.relations.map((r) => r.id));
    for (const [id, e] of edges) {
      if (!rel.has(id)) {
        if (reset || reduced) edges.delete(id);
        else if (e.removing === NEVER) {
          e.removing = now;
          e.endsA = { ...(nodes.get(e.from)?.pos ?? { x: 0, y: 0, z: 0 }) };
          e.endsB = { ...(nodes.get(e.to)?.pos ?? { x: 0, y: 0, z: 0 }) };
        }
      } else e.morph = null;
    }
    for (const r of snapshot.relations) {
      const existing = edges.get(r.id);
      if (existing && existing.removing === NEVER) {
        Object.assign(existing, { look: r.look ?? LOOK_OF_TYPE[r.type] ?? 'relates', lensOnly: r.lensOnly ?? false, chip: r.chip, weight: r.weight, from: r.from, to: r.to });
        continue;
      }
      const e = edgeFrom(r);
      if (!reset && !reduced) {
        e.drawT0 = now;
        e.drawDur = e.look === 'shortcut' ? 700 : 420;
      }
      edges.set(r.id, e);
    }
    if (reset) {
      ghostT0 = NEVER;
      loopBadges = new Map();
      condChip = null;
    }
    roadPhases();
    if (!hasScene) frameDefault(true);
    hasScene = true;
  }

  function transitionTo(snapshot: SceneSnapshot, options?: TransitionOptions): Promise<void> {
    if (!hasScene) {
      setScene(snapshot);
      return Promise.resolve();
    }
    const now = clock.now();
    const dur = reduced ? 0 : clamp(options?.durationMs ?? 1000, 0, 1200);
    const prevLens = morph ? currentLens(now) : lensRgb;
    if (morph) {
      const m = morph;
      morph = null;
      m.resolve();
    }
    lensColors = snapshot.lensColors ?? lensColors;
    perspective = snapshot.perspective;
    const lensTo = lensOf(perspective);
    const incoming = new Set(snapshot.nodes.map((n) => n.id));
    for (const id of [...nodes.keys()]) if (!incoming.has(id)) nodes.delete(id);
    snapshot.nodes.forEach((sn, i) => {
      let n = nodes.get(sn.id);
      if (!n) {
        n = nodeFromSnapshot(sn, i);
        nodes.set(sn.id, n);
      }
      n.data = sn;
      n.from = { ...n.pos };
      n.to = { ...sn.position };
      n.rFrom = n.r;
    });
    syncOrder();
    applyTopology(snapshot);
    const rel = new Set(snapshot.relations.map((r) => r.id));
    for (const [id, e] of edges) {
      if (e.removing !== NEVER) continue;
      if (!rel.has(id)) {
        if (dur === 0) edges.delete(id);
        else e.morph = 'out';
      } else if (e.morph === 'out') e.morph = null;
    }
    for (const r of snapshot.relations) {
      const e = edges.get(r.id);
      if (e && e.removing === NEVER) {
        Object.assign(e, { look: r.look ?? LOOK_OF_TYPE[r.type] ?? 'relates', lensOnly: r.lensOnly ?? false, chip: r.chip, weight: r.weight });
        continue;
      }
      const ne = edgeFrom(r);
      ne.morph = dur === 0 ? null : 'in';
      edges.set(r.id, ne);
    }
    loopBadges = new Map();
    condChip = null;
    if (dur === 0) {
      for (const n of nodes.values()) {
        n.pos = { ...n.to };
        n.from = { ...n.to };
        n.r = n.rTo;
      }
      crossfade = now;
      lensRgb = lensTo;
      ghostT0 = now;
      roadPhases();
      return Promise.resolve();
    }
    ghostT0 = now;
    roadPhases();
    return new Promise((resolve) => {
      morph = { t0: now, k: dur / 1000, lensFrom: prevLens, lensTo, resolve };
    });
  }

  function currentLens(now: number): RGB {
    if (!morph) return lensRgb;
    return mix(morph.lensFrom, morph.lensTo, range(now, morph.t0, morph.t0 + 1000 * morph.k));
  }

  // ── Camera framing ───────────────────────────────────────────────────────────────
  function bounding(ids?: Iterable<NodeId>, coreFraction = 1): { c: V3; R: number } {
    const pts: V3[] = [];
    if (ids) {
      for (const id of ids) {
        const n = nodes.get(id);
        if (n) pts.push(n.to);
      }
    } else for (const n of nodes.values()) if (n.dying === NEVER) pts.push(n.to);
    if (!pts.length) return { c: { x: 0, y: 0, z: 0 }, R: 60 };
    let mn = { x: Infinity, y: Infinity, z: Infinity };
    let mx = { x: -Infinity, y: -Infinity, z: -Infinity };
    for (const p of pts) {
      mn = { x: Math.min(mn.x, p.x), y: Math.min(mn.y, p.y), z: Math.min(mn.z, p.z) };
      mx = { x: Math.max(mx.x, p.x), y: Math.max(mx.y, p.y), z: Math.max(mx.z, p.z) };
    }
    let c = { x: (mn.x + mx.x) / 2, y: (mn.y + mx.y) / 2, z: (mn.z + mx.z) / 2 };
    let d = pts.map((p) => Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z));
    if (coreFraction < 1) {
      // Small screens: fit the dense core (nearest fraction around the median point).
      const med = (k: 'x' | 'y' | 'z') => [...pts].sort((a, b) => a[k] - b[k])[Math.floor(pts.length / 2)]![k];
      c = { x: med('x'), y: med('y'), z: med('z') };
      d = pts.map((p) => Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z)).sort((a, b) => a - b);
      return { c, R: Math.max(30, d[Math.floor(d.length * coreFraction)] ?? 60) };
    }
    return { c, R: Math.max(20, ...d) + 4 };
  }

  function defaultPose() {
    const small = width < 600;
    if (small) {
      // §8: below 600 px fit what the pathways are and read (Heat + Simmer + Serve in the seed).
      const core = new Set<NodeId>();
      for (const n of nodes.values()) if (n.data.kind === 'pathway') core.add(n.id);
      for (const e of edges.values()) if (e.look === 'reads' && e.removing === NEVER) core.add(e.to);
      const { c, R } = core.size >= 3 ? bounding(core) : bounding(undefined, 0.45);
      return { tx: c.x, ty: c.y, tz: c.z, dist: rig.fitDistance(R * 1.08), az: 0, el: (12 * Math.PI) / 180 };
    }
    const { c, R } = bounding();
    return { tx: c.x, ty: c.y, tz: c.z, dist: rig.fitDistance(R * 0.9), az: 0, el: (12 * Math.PI) / 180 };
  }

  function frameDefault(snap: boolean, dur = 800): Promise<void> {
    const p = defaultPose();
    if (snap) {
      rig.snap(p);
      return Promise.resolve();
    }
    return rig.flyTo(p, clock.now(), reduced ? 0 : dur);
  }

  async function afterMorph(): Promise<void> {
    while (morph) await new Promise<void>((r) => idleWaiters.push(r));
  }

  async function focusNode(id: NodeId | null, options?: { animate?: boolean }): Promise<void> {
    await afterMorph();
    if (id === null) return frameDefault(false, 800);
    const n = nodes.get(id);
    if (!n) return;
    const animate = options?.animate !== false && !reduced;
    const p = { tx: n.to.x, ty: n.to.y, tz: n.to.z, dist: 70 };
    if (!animate) {
      rig.snap(p);
      if (reduced) crossfade = clock.now() - 50;
      return;
    }
    return rig.flyTo(p, clock.now(), 900);
  }

  async function frameNodes(ids: NodeId[]): Promise<void> {
    await afterMorph();
    if (!ids.length) return;
    const { c, R } = bounding(ids);
    return rig.flyTo({ tx: c.x, ty: c.y, tz: c.z, dist: rig.fitDistance(R * 1.15) }, clock.now(), reduced ? 0 : 900);
  }

  function nudgeToward(id: NodeId, fraction: number): void {
    const n = nodes.get(id);
    if (!n) return;
    const p = rig.pose();
    void rig.flyTo({ tx: lerp(p.tx, n.to.x, fraction), ty: lerp(p.ty, n.to.y, fraction), tz: lerp(p.tz, n.to.z, fraction) }, clock.now(), reduced ? 0 : 900, 0);
  }

  // ── Routes, activation, traces ───────────────────────────────────────────────────
  function highlightRoutes(list: RouteTrail[]): void {
    const now = clock.now();
    const learned = list.find((t) => t.role === 'learned');
    if (learned) {
      const a = learned.route.nodes[0];
      const b = learned.route.nodes[learned.route.nodes.length - 1];
      const short = trails.find((t) => t.trail.role === 'shortest');
      if (a && b) {
        collapse = { t0: now, a, b, beads: short ? short.trail.route.nodes.slice(1, -1) : [] };
        for (const id of [a, b]) {
          const n = nodes.get(id);
          if (n) {
            n.flash = now + 700;
            n.flashColor = SIGNAL;
          }
        }
      }
      trails = trails.filter((t) => t.trail.role !== 'shortest' && t.trail.role !== 'declared');
      return;
    }
    collapse = null;
    trails = list.map((trail) => ({ trail, t0: now }));
  }

  function clearRoutes(): void {
    trails = [];
    collapse = null;
  }

  function setActivation(list: Activation[] | null): void {
    const now = clock.now();
    if (!list || !list.length) {
      activation = null;
      return;
    }
    activation = new Map(list.map((a) => [a.nodeId, a.depth]));
    activationT0 = now;
    for (const a of list) {
      if (a.depth === 0) {
        const n = nodes.get(a.nodeId);
        if (n) {
          n.burst = now;
          n.burstScale = 3;
          n.flash = now;
          n.flashColor = STAR;
        }
      }
    }
  }

  function traceSchedule(trace: Trace, stepMs: number, isReduced: boolean) {
    const f = stepMs / 520;
    const arrive: number[] = [];
    const dwell: number[] = [];
    let t = 0;
    trace.steps.forEach((s, i) => {
      arrive.push(t);
      const n = nodes.get(s.nodeId);
      const reads = s.op === 'read' || (s.op !== 'start' && /@/.test(n?.data.valueText ?? '')) || readTargets(s.nodeId).length > 0;
      const d = isReduced ? 300 : (reads ? 420 : 140) * f;
      dwell.push(d);
      t += d + (isReduced || i === trace.steps.length - 1 ? 0 : 380 * f);
    });
    return { arrive, dwell, travel: isReduced ? 0 : 380 * f, end: t };
  }

  function readTargets(id: NodeId): NodeId[] {
    const out: NodeId[] = [];
    for (const e of edges.values()) if (e.look === 'reads' && e.from === id && e.removing === NEVER && e.morph !== 'out') out.push(e.to);
    return out;
  }

  function playTrace(trace: Trace, options?: PlaybackOptions): Promise<void> {
    stopTrace();
    loopBadges = new Map();
    condChip = null;
    traceLit = new Set(trace.steps.map((s) => s.nodeId));
    const sched = traceSchedule(trace, options?.stepMs ?? 520, reduced);
    return new Promise((resolve) => {
      playback = {
        trace,
        arrive: sched.arrive,
        dwell: sched.dwell,
        travel: sched.travel,
        lt: 0,
        k: -1,
        paused: false,
        reduced,
        onStep: options?.onStep,
        condText: options?.conditionText,
        resolve,
        endAt: sched.end + (reduced ? 0 : 600),
        done: false,
      };
    });
  }

  function stopTrace(): void {
    if (playback) {
      const p = playback;
      playback = null;
      p.resolve();
    }
    readSpark = null;
  }

  function enterStep(p: Playback, k: number, now: number): void {
    p.k = k;
    const step = p.trace.steps[k];
    if (!step) return;
    const n = nodes.get(step.nodeId);
    if (n) {
      n.flash = now;
      n.flashColor = step.branch === 'false' ? FALSE : PULSE;
    }
    if (step.op === 'while') {
      const seenBefore = p.trace.steps.slice(0, k).some((s) => s.nodeId === step.nodeId);
      if (seenBefore) loopBadges.set(step.nodeId, (loopBadges.get(step.nodeId) ?? 0) + 1);
      else if (!loopBadges.has(step.nodeId)) loopBadges.set(step.nodeId, 0);
    }
    if (step.op === 'if' || step.op === 'while') {
      condChip = { id: step.nodeId, text: p.condText ? p.condText(step) : conditionText(step.note), ok: step.branch !== 'false' };
    }
    const targets = readTargets(step.nodeId);
    readSpark = targets[0] && !p.reduced ? { from: step.nodeId, to: targets[0], t0: now, dur: Math.max(120, (p.dwell[k] ?? 140) * 0.9) } : targets[0] ? { from: step.nodeId, to: targets[0], t0: now, dur: 1 } : null;
    p.onStep?.(k);
  }

  function stepTrace(): void {
    const p = playback;
    if (!p) return;
    p.paused = true;
    const next = p.k + 1;
    if (next < p.arrive.length) p.lt = p.arrive[next] ?? p.lt;
    else p.lt = p.endAt;
  }

  // ── Input ────────────────────────────────────────────────────────────────────────
  const canvas = gl.domElement;
  const active = new Map<number, { x: number; y: number; button: number }>();
  let downAt: { x: number; y: number; moved: boolean; button: number; shift: boolean } | null = null;
  let pinch: { d: number; mx: number; my: number } | null = null;

  function localXY(e: PointerEvent | WheelEvent) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function pickAt(x: number, y: number): NodeId | null {
    let best: NodeId | null = null;
    let bestD = Infinity;
    for (const n of order) {
      if (!n.onScreen || n.dying !== NEVER || n.bright < 0.05) continue;
      const hit = Math.max(n.pxR, 10);
      const d = Math.hypot(n.sx - x, n.sy - y);
      if (d <= hit && d - hit * 0.25 < bestD) {
        bestD = d - hit * 0.25;
        best = n.id;
      }
    }
    return best;
  }

  const onDown = (e: PointerEvent) => {
    const p = localXY(e);
    canvas.setPointerCapture?.(e.pointerId);
    active.set(e.pointerId, { ...p, button: e.button });
    rig.input(clock.now());
    if (active.size === 1) {
      downAt = { ...p, moved: false, button: e.button, shift: e.shiftKey };
      rig.beginDrag();
    } else if (active.size === 2) {
      const [a, b] = [...active.values()] as unknown as [{ x: number; y: number }, { x: number; y: number }];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      if (downAt) downAt.moved = true;
    }
  };
  const onMove = (e: PointerEvent) => {
    const p = localXY(e);
    pointer = p;
    const prev = active.get(e.pointerId);
    const now = clock.now();
    if (!prev) return;
    if (active.size >= 2 && pinch) {
      active.set(e.pointerId, { ...p, button: prev.button });
      const [a, b] = [...active.values()] as unknown as [{ x: number; y: number }, { x: number; y: number }];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      if (pinch.d > 0 && d > 0) rig.dolly(Math.log(d / pinch.d) / -Math.log(0.92), now);
      rig.panBy(mx - pinch.mx, my - pinch.my, now);
      pinch = { d, mx, my };
      return;
    }
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    active.set(e.pointerId, { ...p, button: prev.button });
    if (downAt && !downAt.moved && Math.hypot(p.x - downAt.x, p.y - downAt.y) > 4) downAt.moved = true;
    if (downAt?.moved) {
      if (downAt.button === 2 || downAt.button === 1 || downAt.shift) rig.panBy(dx, dy, now);
      else rig.orbitBy(dx, dy, now);
    }
  };
  const onUp = (e: PointerEvent) => {
    const p = localXY(e);
    active.delete(e.pointerId);
    if (active.size < 2) pinch = null;
    if (active.size === 0) {
      rig.endDrag();
      if (downAt && !downAt.moved && e.button === 0) {
        const id = pickAt(p.x, p.y);
        for (const l of pickers) l(id);
      }
      downAt = null;
    }
  };
  const onLeave = () => {
    pointer = null;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1;
    rig.dolly((-e.deltaY * unit) / 100, clock.now());
  };
  const onKeyInput = () => rig.input(clock.now());
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', onKeyInput);
  window.addEventListener('pointerdown', onKeyInput);

  // ── Frame ────────────────────────────────────────────────────────────────────────
  function frame(): void {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const wall0 = performance.now();
    const now = clock.now();
    const dt = clamp(now - lastT, 0, 100);
    lastT = now;
    frameNo++;

    // Morph progress
    let morphT: number | null = null;
    if (morph) {
      const m = morph;
      const mt = (now - m.t0) / m.k;
      morphT = clamp(mt / 1000, 0, 1);
      for (const n of order) {
        const u = easeInOut(range(mt, 160 * n.rank, 160 * n.rank + 840));
        n.pos = { x: lerp(n.from.x, n.to.x, u), y: lerp(n.from.y, n.to.y, u), z: lerp(n.from.z, n.to.z, u) };
        n.r = lerp(n.rFrom, n.rTo, u);
      }
      lensRgb = currentLens(now);
      if (mt >= 1000) {
        for (const n of order) {
          n.pos = { ...n.to };
          n.r = n.rTo;
        }
        for (const [id, e] of edges) {
          if (e.morph === 'out') edges.delete(id);
          else e.morph = null;
        }
        lensRgb = m.lensTo;
        morph = null;
        roadPhases();
        m.resolve();
      }
    }
    const mt = morph ? (now - morph.t0) / morph.k : Infinity;

    // Hover / route / activation mixes
    hoverMix = clamp(hoverMix + (hovered ? dt / 180 : -dt / 120), 0, 1);
    routeMix = clamp(routeMix + ((trails.length || collapse) ? dt / 300 : -dt / 300), 0, 1);
    activationFade = clamp(activationFade + (activation ? dt / 120 : -dt / 200), 0, 1);
    ghostHeldMix = clamp(ghostHeldMix + (ghostHeld ? dt / 200 : -dt / 300), 0, 1);
    if (collapse && now - collapse.t0 > 1000) collapse = null;

    const breathe = !reduced;
    const fieldScale = breathe ? 1 + 0.004 * Math.sin((2 * Math.PI * now) / 9000) : 1;
    const fade = crossfade !== NEVER ? range(now, crossfade, crossfade + 200) : 1;
    const introFade = intro.t0 !== NEVER && reduced ? range(now, intro.t0, intro.t0 + 200) : 1;
    if (!intro.done && now > intro.end) intro.done = true;

    // Playback clock
    const p = playback;
    if (p && !p.done) {
      if (!p.paused) p.lt += dt;
      let k = p.k;
      while (k + 1 < p.arrive.length && (p.arrive[k + 1] ?? Infinity) <= p.lt) {
        k++;
        enterStep(p, k, now);
      }
      if (k < 0 && p.arrive.length) enterStep(p, 0, now);
      if (p.lt >= (p.arrive[p.arrive.length - 1] ?? 0) + (p.dwell[p.dwell.length - 1] ?? 0) && !endBloom && p.trace.steps.length) {
        const last = p.trace.steps[p.trace.steps.length - 1];
        if (last) {
          endBloom = { id: last.nodeId, t0: now };
          const n = nodes.get(last.nodeId);
          if (n) {
            n.burst = now;
            n.burstScale = 4;
            n.flash = now;
            n.flashColor = p.trace.status === 'ended' ? PULSE : FALSE;
          }
        }
      }
      if (p.lt >= p.endAt) {
        p.done = true;
        playback = null;
        readSpark = null;
        p.resolve();
      }
    }
    if (endBloom && now - endBloom.t0 > 700) endBloom = null;

    rig.driftAllowed = !reduced && !morph && !isTyping();
    rig.update(now, dt, true);
    const cam = rig.camera;
    const pxScale = rig.pxScale();
    nodeLayer.material.uniforms.uPxScale!.value = pxScale;
    const camPos = cam.position;
    const kDist = Math.max(1, rig.distance / 300);

    // Node pass: positions, screen cache, brightness
    const trailNodes = new Set<NodeId>();
    for (const t of trails) for (const id of t.trail.route.nodes) trailNodes.add(id);
    if (collapse) {
      trailNodes.add(collapse.a);
      trailNodes.add(collapse.b);
    }
    const hoverNbrs = hovered ? nodes.get(hovered)?.nbrs : undefined;
    const ghostR = ghostRadius(now, mt);
    const ghostExpanded = ghostR > 6.5;

    nodeLayer.begin(order.length);
    sprites.begin();
    fxLines.begin();
    for (const n of order) {
      const wx = n.pos.x * fieldScale;
      const wy = n.pos.y * fieldScale;
      const wz = n.pos.z * fieldScale;
      if (!Number.isFinite(wx + wy + wz)) continue;
      tmp.set(wx, wy, wz).project(cam);
      const depth = Math.hypot(camPos.x - wx, camPos.y - wy, camPos.z - wz);
      n.sx = ((tmp.x + 1) / 2) * width;
      n.sy = ((1 - tmp.y) / 2) * height;
      n.depth = depth;
      n.onScreen = tmp.z < 1 && tmp.z > -1 && n.sx > -40 && n.sx < width + 40 && n.sy > -40 && n.sy < height + 40;

      // Ignition / birth
      let ign = 1;
      let scale = 1;
      if (n.ignite !== NEVER) {
        if (reduced) ign = introFade;
        else {
          const u = range(now, n.ignite, n.ignite + 420 * intro.speed);
          ign = easeOut(u);
          scale = u <= 0 ? 0.4 : lerp(0.4, 1, easeBack(u));
        }
      }
      if (n.birth !== NEVER) {
        const bt = now - n.birth;
        if (bt < 260) scale *= lerp(0.15, 1.3, easeBack(bt / 260));
        else if (bt < 460) scale *= lerp(1.3, 1, easeOut((bt - 260) / 200));
        else n.birth = NEVER;
      }
      if (n.dying !== NEVER) {
        const u = range(now, n.dying, n.dying + 200);
        ign *= 1 - u;
        if (u >= 1) {
          nodes.delete(n.id);
          continue;
        }
      }

      // Focus levels
      let level = 1;
      if (n.degree === 0) level = 0.35;
      let haloScale = 1;
      if (activationFade > 0) {
        const d = activation?.get(n.id);
        const target = d === undefined ? 0.12 : d === 0 ? 1.15 : d === 1 ? 1 : d === 2 ? 0.55 : 0.3;
        const ripple = d === undefined ? 1 : range(now - activationT0, 90 * d, 90 * d + 160);
        const lv = lerp(0.12, target, ripple);
        level = lerp(level, lv, activationFade);
        if (d === 0) scale *= lerp(1, 1.6, activationFade * ripple);
      }
      if (routeMix > 0) level *= lerp(1, trailNodes.has(n.id) ? 1 : 0.25, routeMix);
      if (hoverMix > 0 && hovered) {
        const isH = n.id === hovered;
        const isN = hoverNbrs?.has(n.id) ?? false;
        level *= lerp(1, isH ? 1.1 : isN ? 1.2 : 0.55, hoverMix);
        if (isH) {
          scale *= lerp(1, 1.25, hoverMix);
          haloScale *= lerp(1, 1.4, hoverMix);
        }
      }
      if (playback && traceLit.has(n.id)) level = Math.max(level, 0.9);

      // Breathing
      const br = breathe ? 0.85 + 0.15 * Math.sin((2 * Math.PI * now) / 6400 + n.phase) : 1;
      let flash = 1;
      if (n.flash !== NEVER) {
        const ft = now - n.flash;
        if (ft >= 0 && ft < 420) flash = ft < 120 ? lerp(1, 2.2, ft / 120) : lerp(2.2, 1, (ft - 120) / 300);
      }
      const bright = ign * level * br * fade * flash;
      n.bright = ign * level;
      const kind = n.data.kind === 'pathway' ? KIND_CODE.pathway : n.road ? KIND_CODE.road : KIND_CODE[n.data.kind] ?? 0;
      const op = n.data.op ? OP_CODE[n.data.op] : 0;
      const coreCol = n.data.kind === 'pathway' ? PULSE : flash > 1.01 ? mix(STAR, n.flashColor, Math.min(1, (flash - 1) / 1.2)) : STAR;
      const haloCol = n.data.kind === 'pathway' ? mix(PULSE, lensRgb, 0.15) : mix(STAR, lensRgb, 0.75); // the sky carries the lens (F-019)
      const ring = n.id === selected ? 1 : 0;
      nodeLayer.push(wx, wy, wz, n.r, coreCol, haloCol, bright, scale, haloScale, ring, kind, op);
      const minR = kind === KIND_CODE.pathway ? 4.5 : 3;
      n.pxR = clamp((n.r * pxScale) / Math.max(0.1, depth), minR, 18) * scale;

      // Ring burst (search match 3r / end bloom 4r over 500–600 ms)
      if (n.burst !== NEVER) {
        const bt = now - n.burst;
        const dur = n.burstScale > 3 ? 600 : 500;
        if (bt >= 0 && bt < dur && !reduced) {
          const u = easeOut(bt / dur);
          sprites.push(wx, wy, wz, n.pxR * lerp(1.2, n.burstScale, u), n.burstScale > 3 ? PULSE : STAR, (1 - u) * 0.9, SPRITE.ring);
        } else if (bt >= dur) n.burst = NEVER;
      }

      // Facet ghosts
      const ghosts = n.data.ghosts;
      if (ghosts && ghosts.length && ign > 0.05) {
        pushGhosts(n, ghosts, wx, wy, wz, ghostR, now, bright);
      }
    }
    if (nodes.size !== order.length) syncOrder();

    // Edge pass
    edgeLayer.begin();
    liteLines.begin();
    // LOD: in dense scenes plain 1 px lines take the cheap native path.
    const dense = visibleEdgeIds.size > 300;
    edgeLayer.material.uniforms.uTime!.value = now;
    edgeLayer.material.uniforms.uSheen!.value = reduced ? 0 : 1;
    edgeLayer.material.uniforms.uViewport!.value.set(width, height);
    fxLines.material.uniforms.uViewport!.value.set(width, height);
    fxLines.material.uniforms.uTime!.value = now;
    let visibleEdges = 0;
    for (const [id, e] of edges) {
      const a = e.removing !== NEVER ? e.endsA : nodes.get(e.from)?.pos;
      const b = e.removing !== NEVER ? e.endsB : nodes.get(e.to)?.pos;
      if (!a || !b) continue;
      const na = nodes.get(e.from);
      const nb = nodes.get(e.to);
      const st = EDGE[e.look] ?? EDGE.relates;
      let k = 1;
      let from = 0;
      let to = 1;
      if (e.removing !== NEVER) {
        const u = range(now, e.removing, e.removing + 300);
        to = 1 - easeInOut(u); // 300 ms reverse draw back to the source end (polish 13)
        if (u >= 1) {
          edges.delete(id);
          continue;
        }
      } else if (visibleEdgeIds.has(id) && e.morph !== 'out') visibleEdges++;
      if (e.morph === 'out') k *= 1 - range(mt, 0, 400);
      if (e.morph === 'in') k *= range(mt, 600, 1000);
      if (e.drawT0 !== NEVER) {
        const u = range(now, e.drawT0, e.drawT0 + e.drawDur * (intro.t0 !== NEVER && !intro.done ? intro.speed : 1));
        to = Math.min(to, easeOut(u));
        if (u >= 1 && intro.done) e.drawT0 = NEVER;
      }
      if (to <= 0.001) continue;
      // Intro: lines wait for both endpoints
      if (reduced && intro.t0 !== NEVER) k *= introFade;
      k *= Math.min(na?.dying === NEVER ? 1 : 0, nb?.dying === NEVER ? 1 : 0) || (e.removing !== NEVER ? 1 : 0);
      const midDepth = ((na?.depth ?? 300) + (nb?.depth ?? 300)) / 2;
      // Learned shortcuts are the brightest lines in the sky (polish 12): no distance fog.
      const fog = e.look === 'shortcut' ? 1 : lerp(1, 0.35, range(midDepth, 150 * kDist, 450 * kDist));
      let alpha = st.alpha * (0.6 + 0.4 * e.weight) * fog * k * fade;
      // Focus
      if (activationFade > 0) {
        const da = activation?.get(e.from);
        const db = activation?.get(e.to);
        const lit = da !== undefined && db !== undefined ? Math.max(0.3, Math.pow(0.55, Math.max(da, db))) * 2.2 : 0.04 / Math.max(0.01, st.alpha);
        alpha *= lerp(1, Math.min(lit, 3), activationFade);
      }
      // Lines on the lit route (and the freshly learned shortcut) stay bright; the rest of the sky dims.
      if (routeMix > 0 && !(trailNodes.has(e.from) && trailNodes.has(e.to))) alpha *= lerp(1, 0.25, routeMix);
      if (hovered && hoverMix > 0) {
        const touches = e.from === hovered || e.to === hovered;
        alpha = touches ? lerp(alpha, 0.5, hoverMix) : alpha * lerp(1, 0.55, hoverMix);
      }
      const mid = e.lensOnly ? lensRgb : st.rgb;
      const spec: LineSpec = {
        ax: a.x * fieldScale, ay: a.y * fieldScale, az: a.z * fieldScale,
        bx: b.x * fieldScale, by: b.y * fieldScale, bz: b.z * fieldScale,
        rgb: st.rgb, mid, alpha, width: st.width, dash: st.dash, from, to,
        sheen: st.sheen, phase: e.phase, len: Math.max(1, e.look === 'next' ? e.len : Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)),
      };
      const focused = (hovered && (e.from === hovered || e.to === hovered)) || (selected && (e.from === selected || e.to === selected)) || (activationFade > 0 && activation?.has(e.from) && activation?.has(e.to));
      if (dense && !focused && e.look === 'relates' && !e.lensOnly && from === 0 && to >= 1) liteLines.push(spec);
      else edgeLayer.push(spec);
      // Shortcut glints at both ends (1.6×)
      if (e.look === 'shortcut' && na && nb && alpha > 0.05) {
        for (const n of [na, nb]) {
          const glint = n.flash !== NEVER && now - n.flash >= 0 && now - n.flash < 240 ? 1.6 : 1;
          sprites.push(n.pos.x * fieldScale, n.pos.y * fieldScale, n.pos.z * fieldScale, 2.2 * glint, SIGNAL, 0.55 * alpha * glint, SPRITE.glow);
        }
      }
    }
    edgeLayer.end();
    liteLines.end();

    // Trails
    const trailHeads: RenderDebugState['trailHeads'] = [];
    for (const t of trails) {
      const r = t.trail.route;
      const hop = reduced ? r.hops : (now - t.t0) / 160;
      const head = Math.min(r.hops, Math.floor(hop));
      trailHeads.push({ role: t.trail.role, hops: r.hops, head });
      const shortest = t.trail.role !== 'declared';
      const col = shortest ? SIGNAL : TRAIL_LONG;
      for (let i = 0; i < r.nodes.length - 1; i++) {
        const fr = clamp(hop - i, 0, 1);
        if (fr <= 0) break;
        const a = nodes.get(r.nodes[i] as NodeId)?.pos;
        const b = nodes.get(r.nodes[i + 1] as NodeId)?.pos;
        if (!a || !b) continue;
        fxLines.push({
          ax: a.x * fieldScale, ay: a.y * fieldScale, az: a.z * fieldScale,
          bx: b.x * fieldScale, by: b.y * fieldScale, bz: b.z * fieldScale,
          rgb: col, alpha: shortest ? 0.95 : 0.85, width: shortest ? 2.5 : 2, dash: shortest ? DASH.solid : DASH.dots, to: fr,
        });
      }
      for (let i = 0; i <= Math.min(head, r.nodes.length - 1); i++) {
        const n = nodes.get(r.nodes[i] as NodeId);
        if (!n) continue;
        const arrivedEnd = i === r.nodes.length - 1;
        const ft = now - (t.t0 + i * 160);
        const pop = !reduced && ft < 240 ? 1 + 0.6 * (1 - ft / 240) : 1;
        sprites.push(n.pos.x * fieldScale, n.pos.y * fieldScale, n.pos.z * fieldScale, (shortest ? 3 : 2.5) * pop * (arrivedEnd ? 1.5 : 1), col, 0.95, SPRITE.bead);
        if (arrivedEnd && !reduced && ft < 600) sprites.push(n.pos.x * fieldScale, n.pos.y * fieldScale, n.pos.z * fieldScale, n.pxR * lerp(1.2, 3, easeOut(ft / 600)), col, 1 - ft / 600, SPRITE.ring);
      }
    }
    if (collapse) {
      const a = nodes.get(collapse.a)?.pos;
      const b = nodes.get(collapse.b)?.pos;
      const u = easeOut(range(now - collapse.t0, 700, 1000));
      if (a && b) {
        for (const id of collapse.beads) {
          const n = nodes.get(id);
          if (!n) continue;
          // Project the bead onto the A–Z segment and slide it there while fading.
          const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
          const l2 = ab.x * ab.x + ab.y * ab.y + ab.z * ab.z || 1;
          const s = clamp(((n.pos.x - a.x) * ab.x + (n.pos.y - a.y) * ab.y + (n.pos.z - a.z) * ab.z) / l2, 0, 1);
          const q = { x: a.x + ab.x * s, y: a.y + ab.y * s, z: a.z + ab.z * s };
          sprites.push(lerp(n.pos.x, q.x, u) * fieldScale, lerp(n.pos.y, q.y, u) * fieldScale, lerp(n.pos.z, q.z, u) * fieldScale, 3, SIGNAL, 0.95 * (1 - u), SPRITE.bead);
        }
      }
    }

    // Pulse comet + tail, read spark
    if (playback) drawComet(playback, fieldScale);
    if (readSpark) {
      const a = nodes.get(readSpark.from)?.pos;
      const b = nodes.get(readSpark.to)?.pos;
      const u = range(now, readSpark.t0, readSpark.t0 + readSpark.dur);
      if (a && b && u < 1 && !reduced) {
        const e = easeSine(u);
        sprites.push(lerp(a.x, b.x, e) * fieldScale, lerp(a.y, b.y, e) * fieldScale, lerp(a.z, b.z, e) * fieldScale, 2.2, PULSE, 0.95, SPRITE.spark);
      }
    }

    // Link rubber band
    if (linkSource && pointer) {
      const n = nodes.get(linkSource);
      if (n) {
        // Unproject the pointer at the source's depth.
        const ndc = new Vector3((pointer.x / width) * 2 - 1, -(pointer.y / height) * 2 + 1, 0.5).unproject(cam);
        const dir = ndc.sub(camPos).normalize();
        const along = n.depth;
        const q = camPos.clone().add(dir.multiplyScalar(along));
        fxLines.push({ ax: n.pos.x * fieldScale, ay: n.pos.y * fieldScale, az: n.pos.z * fieldScale, bx: q.x, by: q.y, bz: q.z, rgb: lensRgb, alpha: 0.8, width: 1.5, dash: DASH.dashed });
        sprites.push(q.x, q.y, q.z, 3, lensRgb, 0.9, SPRITE.ring);
      }
    }

    nodeLayer.end();
    fxLines.end();
    sprites.end();
    (dust.material as typeof nodeLayer.material).uniforms.uFade!.value = Math.min(fade, intro.t0 !== NEVER && !reduced ? range(now, intro.t0, intro.t0 + 1200) : 1);

    // Overlay every 2nd frame
    if (frameNo % 2 === 0 || frameNo < 3) placeOverlay(now, kDist, ghostR, ghostExpanded);

    gl.render(scene, cam);
    lastState = { morphT, ghostExpanded, visibleEdges, trailHeads };

    for (const l of frameListeners) l(now);
    // afterMorph() waiters only care about the morph (a fly is queued until it ends).
    if (idleWaiters.length && !morph) for (const w of idleWaiters.splice(0)) w();

    // Stats (wall clock)
    frameMs = lerp(frameMs || 16, performance.now() - wall0, 0.1);
    fpsFrames++;
    const wall = performance.now();
    if (wall - fpsT0 >= 1000) {
      fps = (fpsFrames * 1000) / (wall - fpsT0);
      fpsFrames = 0;
      fpsT0 = wall;
      // Adaptive resolution: a fill-bound device (software GL, weak GPU) trades sharpness for
      // frame rate in 15% steps down to 0.6×, and recovers when there is headroom.
      const next = fps < 40 ? Math.max(0.6, renderScale - 0.15) : fps > 57 ? Math.min(1, renderScale + 0.15) : renderScale;
      if (next !== renderScale) {
        renderScale = next;
        gl.setPixelRatio(dpr * renderScale);
        gl.setSize(width, height, false);
        for (const m of [nodeLayer.material, sprites.material, dust.material as typeof nodeLayer.material]) {
          if (m.uniforms.uDpr) m.uniforms.uDpr.value = dpr * renderScale;
        }
      }
    }

    // Hover pick (after positions are fresh)
    const h = pointer && active.size === 0 ? pickAt(pointer.x, pointer.y) : active.size ? hovered : null;
    if (h !== hovered) {
      hovered = h;
      canvas.parentElement?.classList.toggle('hovering', !!h);
      for (const l of hoverers) l(h);
    }
  }

  let lastState: { morphT: number | null; ghostExpanded: boolean; visibleEdges: number; trailHeads: RenderDebugState['trailHeads'] } = {
    morphT: null,
    ghostExpanded: false,
    visibleEdges: 0,
    trailHeads: [],
  };

  function isTyping(): boolean {
    const a = document.activeElement;
    return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT');
  }

  function ghostRadius(now: number, mt: number): number {
    if (reduced) return 9;
    let r = 3.5;
    if (ghostT0 !== NEVER) {
      const gt = morph ? mt : now - ghostT0;
      if (gt < 500) r = 9 * easeBack(range(gt, 0, 500));
      else if (gt < 3400) r = 9;
      else if (gt < 3800) r = lerp(9, 3.5, easeInOut(range(gt, 3400, 3800)));
      else r = 3.5;
      r = Math.max(r, 3.5 * (gt < 500 ? range(gt, 0, 120) : 1));
      if (gt >= 3800 && !morph) ghostT0 = NEVER;
    }
    return lerp(r, 9, ghostHeldMix);
  }

  function pushGhosts(n: NodeState, ghosts: FacetView[], wx: number, wy: number, wz: number, gr: number, now: number, bright: number): void {
    const right = new Vector3();
    const up = new Vector3();
    rig.camera.matrixWorld.extractBasis(right, up, new Vector3());
    const orbit = reduced || gr > 6.5 ? 0 : ((now / 1000) * 0.08 * Math.PI * 2) % (Math.PI * 2);
    let tilt = 0;
    if (n.id === hovered && pointer) tilt = Math.atan2(-(pointer.y - n.sy), pointer.x - n.sx) - (270 * Math.PI) / 180;
    const k = gr; // world units
    ghosts.forEach((g, i) => {
      const ang = ((90 + 120 * (i + 1)) * Math.PI) / 180 + orbit + tilt * hoverMix;
      const gx = wx + (right.x * Math.cos(ang) + up.x * Math.sin(ang)) * k;
      const gy = wy + (right.y * Math.cos(ang) + up.y * Math.sin(ang)) * k;
      const gz = wz + (right.z * Math.cos(ang) + up.z * Math.sin(ang)) * k;
      const col = lensOf(g.perspective);
      const px = clamp((n.r * 0.6 * rig.pxScale()) / Math.max(0.1, n.depth), 1.8, 10);
      sprites.push(gx, gy, gz, px, col, 0.55 * Math.min(1, bright), SPRITE.glow);
      fxLines.push({ ax: wx, ay: wy, az: wz, bx: gx, by: gy, bz: gz, rgb: col, alpha: 0.3 * Math.min(1, bright), width: 1, dash: DASH.solid });
    });
  }

  function drawComet(p: Playback, fs: number): void {
    const at = (lt: number): V3 | null => {
      let k = 0;
      while (k + 1 < p.arrive.length && (p.arrive[k + 1] ?? Infinity) <= lt) k++;
      const s = p.trace.steps[k];
      const a = s ? nodes.get(s.nodeId)?.pos : undefined;
      if (!a) return null;
      const leave = (p.arrive[k] ?? 0) + (p.dwell[k] ?? 0);
      const nextS = p.trace.steps[k + 1];
      if (!nextS || lt < leave || p.reduced) return a;
      const b = nodes.get(nextS.nodeId)?.pos;
      if (!b) return a;
      const u = easeSine(range(lt, leave, leave + p.travel));
      return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u) };
    };
    if (p.lt > (p.arrive[p.arrive.length - 1] ?? 0) + (p.dwell[p.dwell.length - 1] ?? 0)) return;
    const head = at(p.lt);
    if (!head) return;
    sprites.push(head.x * fs, head.y * fs, head.z * fs, 3.2, PULSE, 1, SPRITE.spark);
    if (p.reduced) return;
    for (let j = 1; j <= 6; j++) {
      const q = at(p.lt - j * 30);
      if (!q) break;
      sprites.push(q.x * fs, q.y * fs, q.z * fs, 3.2 * (1 - j / 8), PULSE, 0.75 * (1 - j / 7), SPRITE.glow);
    }
  }

  function placeOverlay(now: number, kDist: number, ghostR: number, ghostExpanded: boolean): void {
    const items: OverlayItem[] = [];
    const selNbrs = selected ? nodes.get(selected)?.nbrs : undefined;
    const cap = width < 600 ? 18 : width >= 1920 ? 48 : 40;
    const lensCss = toCss(lensRgb);
    // Route waypoints are named while a route is shown; road letters outrank degree (F-015).
    const routeIds = new Set<NodeId>();
    for (const t of trails) {
      const ns = t.trail.route.nodes;
      if (t.trail.role === 'declared') {
        if (ns[0]) routeIds.add(ns[0]);
        if (ns[ns.length - 1]) routeIds.add(ns[ns.length - 1]!);
      } else for (const id of ns) routeIds.add(id);
    }
    // Ghost chips are rationed: the 8 most central disagreeing nodes, plus hover / selection; all with D (F-020).
    const chipNodes = new Set<NodeId>();
    const chipRank = new Map<NodeId, number>();
    if (ghostExpanded) {
      const cx = width / 2;
      const cy = height / 2;
      const cands = order.filter((n) => n.onScreen && n.data.ghosts?.length && n.bright > 0.2);
      // Hubs first (Temperature in the seed), then nearest the centre.
      cands.sort((a, b) => b.degree - a.degree || Math.hypot(a.sx - cx, a.sy - cy) - Math.hypot(b.sx - cx, b.sy - cy));
      for (const n of ghostHeld ? cands : cands.slice(0, 8)) chipNodes.add(n.id);
      [...chipNodes].forEach((id, i) => chipRank.set(id, i));
      if (selected) chipNodes.add(selected);
      if (hovered) chipNodes.add(hovered);
    }
    const clip = (t: string) => (t.length > 16 ? t.slice(0, 15).trimEnd() + '…' : t);
    for (const n of order) {
      if (!n.onScreen || n.dying !== NEVER) continue;
      const ign = n.bright;
      if (ign < 0.06) continue;
      const depthFade = 1 - range(n.depth, 220 * kDist, 480 * kDist);
      const act = activation?.get(n.id);
      let pr = 10 + Math.min(n.degree, 30) * 0.5 + (n.degree >= 8 && !n.road ? 20 : 0); // hubs name themselves first (F-031)
      if (n.road) pr = trails.length ? 75 : 50;
      if (selNbrs?.has(n.id)) pr = Math.max(pr, 60);
      if (act !== undefined && act <= 1) pr = act === 0 ? 80 : 70;
      if (n.id === hovered) pr = 90;
      if (routeIds.has(n.id)) pr = 95;
      if (n.id === selected) pr = 100;
      if (playback && traceLit.has(n.id)) pr = Math.max(pr, 55);
      if (n.pxR < 4 && pr < 60 && !n.road) continue;
      const op = clamp(Math.max(depthFade, pr >= 60 ? 0.9 : 0.25) * Math.min(1, ign * 1.4), 0, 1);
      items.push({
        key: 'l:' + n.id,
        kind: 'lbl',
        text: n.data.label,
        x: n.sx,
        y: n.sy,
        offset: (n.id === selected ? Math.max(n.pxR * 2.4, n.pxR + 7) : n.pxR) + 6,
        anchors: ['right', 'left', 'above', 'below'],
        priority: pr,
        opacity: op,
        cls: n.id === selected ? 'sel' : n.road ? 'road' : undefined,
        // Single road letters still declutter but don't spend the 40-word cap (F-015).
        isLabel: !n.road,
        // Only the selected, hovered or route-named light's label sits over other cores outright. Hubs
        // (degree ≥ 8) take a clear side when one exists and otherwise still keep their name (F-030, F-031).
        overCores: pr >= 90,
        overCoresFallback: !n.road && n.degree >= 8,
        nodeId: n.id,
      });
      // Ghost chips when expanded; the active value sits on top (never as a ghost)
      if (chipNodes.has(n.id) && n.data.ghosts?.length) {
        const right = new Vector3();
        const up = new Vector3();
        rig.camera.matrixWorld.extractBasis(right, up, new Vector3());
        const pxPerU = rig.pxScale() / Math.max(0.1, n.depth);
        n.data.ghosts.forEach((g, i) => {
          const ang = ((90 + 120 * (i + 1)) * Math.PI) / 180;
          const off = ghostR * pxPerU + 8;
          // Beside its facet first, then swung ±35° / ±70° around its own star at the same reach,
          // then one step farther out: a chip that still finds no clear spot waits for D (F-020).
          const spots: Array<{ x: number; y: number }> = [];
          for (const r of [off, off + 12]) for (const da of [0, 35, -35, 70, -70]) {
            if (r === off && da === 0) continue;
            const a2 = ang + (da * Math.PI) / 180;
            spots.push({ x: n.sx + Math.cos(a2) * r, y: n.sy - Math.sin(a2) * r });
          }
          items.push({
            key: `g:${n.id}:${g.perspective}`,
            kind: 'chip',
            text: clip(n.data.ghostText?.[g.perspective] ?? String(g.value ?? '—')),
            x: n.sx + Math.cos(ang) * off,
            y: n.sy - Math.sin(ang) * off,
            spots,
            offset: 0,
            anchors: [Math.cos(ang) < 0 ? 'left' : 'right', 'below'],
            priority: 85 - (chipRank.get(n.id) ?? 8) * 0.5 - i * 0.1 + (n.id === selected ? 10 : 0),
            opacity: Math.max(op, 0.85),
            color: toCss(lensOf(g.perspective)),
          });
        });
        if (n.data.valueText) {
          items.push({
            key: `v:${n.id}`,
            kind: 'chip',
            text: clip(n.data.valueText),
            x: n.sx,
            y: n.sy - (ghostR * pxPerU + 8),
            offset: 0,
            anchors: ['above'],
            priority: 85.2 - (chipRank.get(n.id) ?? 8) * 0.5,
            opacity: Math.max(op, 0.85),
            color: lensCss,
          });
        }
      }
    }
    // Flow chips, condition chip, loop badges, read chip, trail chips
    for (const e of edges.values()) {
      if (!e.chip || e.removing !== NEVER || e.morph === 'out') continue;
      const a = nodes.get(e.from);
      const b = nodes.get(e.to);
      if (!a || !b || !a.onScreen || !b.onScreen) continue;
      const len = Math.hypot(a.sx - b.sx, a.sy - b.sy);
      if (len < 46) continue;
      items.push({ key: 'f:' + e.id, kind: 'flowchip', text: e.chip, x: (a.sx + b.sx) / 2, y: (a.sy + b.sy) / 2, offset: 0, anchors: ['center'], priority: 8, opacity: Math.min(a.bright, b.bright, 1) * 0.95 });
    }
    if (condChip) {
      const n = nodes.get(condChip.id);
      if (n?.onScreen) items.push({ key: 'cond', kind: 'condchip', text: condChip.text, x: n.sx, y: n.sy, offset: n.pxR * 1.6 + 10, anchors: ['left', 'above', 'below', 'right'], priority: 300, opacity: 1, cls: condChip.ok ? undefined : 'false', force: true });
    }
    for (const [id, count] of loopBadges) {
      const n = nodes.get(id);
      if (n?.onScreen && count > 0) items.push({ key: 'b:' + id, kind: 'badge', text: `×${count}`, x: n.sx, y: n.sy, offset: n.pxR * 1.6 + 8, anchors: ['above', 'right', 'below'], priority: 290, opacity: 1, force: true });
    }
    if (readSpark) {
      const n = nodes.get(readSpark.to);
      if (n?.onScreen && n.data.valueText) items.push({ key: 'read', kind: 'readchip', text: n.data.valueText, x: n.sx, y: n.sy, offset: n.pxR + 8, anchors: ['below', 'above', 'right'], priority: 280, opacity: 1, force: true });
    }
    for (const t of trails) {
      const r = t.trail.route;
      const hop = reduced ? r.hops : (now - t.t0) / 160;
      const head = Math.min(r.hops, Math.floor(hop));
      const n = nodes.get(r.nodes[head] as NodeId);
      if (!n?.onScreen) continue;
      const shortest = t.trail.role !== 'declared';
      const done = head >= r.hops;
      const word = shortest ? 'Shortest' : 'Declared';
      const unit = (k: number) => (k === 1 ? 'hop' : 'hops');
      items.push({
        key: 't:' + t.trail.role,
        kind: 'trailchip',
        text: done ? `${word} · ${r.hops} ${unit(r.hops)}` : `${word} · ${head} ${unit(head)}…`,
        x: n.sx,
        y: n.sy,
        offset: n.pxR + 10,
        anchors: shortest ? ['above', 'right', 'left', 'below'] : ['below', 'left', 'right', 'above'],
        priority: 270,
        opacity: 1,
        color: toCss(shortest ? SIGNAL : TRAIL_LONG),
        force: true,
      });
    }
    const cores: Array<{ x: number; y: number; r: number; id: string }> = [];
    for (const n of order) if (n.onScreen && n.bright > 0.1) cores.push({ id: n.id, x: n.sx, y: n.sy, r: (n.id === selected ? Math.max(n.pxR * 2.4, n.pxR + 7) : Math.max(3, n.pxR * (n.data.kind === 'pathway' ? 1.5 : n.data.kind === 'variable' ? 1.8 : 1))) + 1 }); // variables draw a ring at 1.8r (F-031)
    // Keep labels below the top bar (56 px; 100 px with the 375 lens row).
    overlay.place(items, cap, width, height, cores, width < 768 ? 104 : 60);
  }

  // ── Public surface ───────────────────────────────────────────────────────────────
  function resize(w: number, h: number): void {
    width = Math.max(1, w);
    height = Math.max(1, h);
    gl.setSize(width, height, false);
    rig.setSize(width, height);
  }
  resize(container.clientWidth, container.clientHeight);
  raf = requestAnimationFrame(frame);

  const extras: RendererExtras = {
    clock,
    playIntro(options) {
      const now = clock.now();
      const speed = options?.speed ?? 1;
      intro = { t0: now, speed, done: false, end: now + (reduced ? 200 : 2700 * speed) };
      for (const n of nodes.values()) n.ignite = now + (120 + 1580 * n.rank) * speed;
      for (const e of edges.values()) {
        const a = nodes.get(e.from)?.ignite ?? now;
        const b = nodes.get(e.to)?.ignite ?? now;
        e.drawT0 = reduced ? NEVER : Math.max(a, b) + 420 * speed;
        e.drawDur = 480;
      }
    },
    setInsets(insets: Insets) {
      rig.setInsets(insets);
    },
    setGhostsExpanded(held: boolean) {
      ghostHeld = held;
    },
    setTracePaused(paused: boolean) {
      if (playback) playback.paused = paused;
    },
    stepTrace,
    frameNodes,
    nudgeToward,
    home: () => frameDefault(false, 800),
    setLinkSource(id) {
      linkSource = id;
      container.classList.toggle('linking', !!id);
    },
    burst(id) {
      const n = nodes.get(id);
      if (n) {
        n.burst = clock.now();
        n.burstScale = 3;
      }
    },
    onFrame(l) {
      frameListeners.add(l);
      return () => frameListeners.delete(l);
    },
    debugState(): RenderDebugState {
      let nan = 0;
      for (const n of nodes.values()) if (!Number.isFinite(n.pos.x + n.pos.y + n.pos.z)) nan++;
      return {
        clock: clock.now(),
        morphT: lastState.morphT,
        ghostState: [...nodes.values()].some((n) => n.data.ghosts?.length) ? (lastState.ghostExpanded ? 'expanded' : 'rest') : 'none',
        labelsShown: overlay.labelsShown,
        labelRects: overlay.placed.filter((r) => r.kind === 'lbl').map((r) => ({ id: r.nodeId ?? r.key, x: r.x, y: r.y, w: r.w, h: r.h })),
        hovered,
        selected,
        cameraDistance: rig.distance,
        visibleEdges: lastState.visibleEdges,
        dimOthers: hovered ? lerp(1, 0.55, hoverMix) : 1,
        introDone: intro.done,
        traceIndex: playback?.k ?? -1,
        trailHeads: lastState.trailHeads,
        nanPositions: nan,
      };
    },
    whenIdle() {
      return new Promise<void>((resolve) => {
        const check = () => {
          if (!morph && !playback && !rig.busy && intro.done) resolve();
          else requestAnimationFrame(check);
        };
        check();
      });
    },
    pointer: () => pointer,
    neighbourInDirection(id, dx, dy, candidates) {
      const n = nodes.get(id);
      if (!n) return null;
      let best: NodeId | null = null;
      let bestScore = Infinity;
      for (const c of candidates) {
        const m = nodes.get(c);
        if (!m || !m.onScreen || c === id) continue;
        const vx = m.sx - n.sx;
        const vy = m.sy - n.sy;
        const d = Math.hypot(vx, vy) || 1;
        const cos = (vx * dx + vy * dy) / d;
        if (cos < 0.35) continue;
        const score = d * (2 - cos);
        if (score < bestScore) {
          bestScore = score;
          best = c;
        }
      }
      return best;
    },
  };

  const renderer: Renderer = {
    setScene,
    transitionTo,
    highlightRoutes,
    clearRoutes,
    playTrace,
    stopTrace,
    setActivation,
    setSelection(id) {
      selected = id;
    },
    focusNode,
    onPick(l) {
      pickers.add(l);
      return () => pickers.delete(l);
    },
    onHover(l) {
      hoverers.add(l);
      return () => hoverers.delete(l);
    },
    screenPosition(id) {
      const n = nodes.get(id);
      if (!n || !n.onScreen) return null;
      if (n.sx < 0 || n.sy < 0 || n.sx > width || n.sy > height) return null;
      return { x: n.sx, y: n.sy };
    },
    setReducedMotion(r) {
      reduced = r;
    },
    stats() {
      return { fps, frameMs, drawCalls: gl.info.render.calls, nodes: nodes.size, relations: visibleEdgeIds.size };
    },
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyInput);
      window.removeEventListener('pointerdown', onKeyInput);
      overlay.dispose();
      nodeLayer.dispose();
      edgeLayer.dispose();
      liteLines.dispose();
      fxLines.dispose();
      sprites.dispose();
      gl.dispose();
      canvas.remove();
    },
    extras,
  };
  return renderer;
};

/** Extracts the evaluated condition from a trace note: "while heat < X · 60 °C < 100 °C → true" → "60 °C < 100 °C → true". */
export function conditionText(note: string): string {
  const parts = note.split(' · ');
  const withArrow = parts.filter((p) => p.includes('→'));
  if (withArrow.length) return withArrow[withArrow.length - 1]!.trim();
  const arrows = note.split('→');
  if (arrows.length >= 3) return arrows.slice(1).join('→').trim();
  return note;
}
