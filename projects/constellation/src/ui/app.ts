// src/ui/app.ts — the instrument controller: one state, the core as the source of truth,
// the renderer as a pure view. Panels read `app` and call its verbs.
import {
  compareRoutes,
  exportJson,
  importJson,
  learnShortcutDetailed,
  listPathways,
  parseExpr,
  pathwayNodes,
  references,
  resolveValue,
  retrieve,
  runPathway,
  validateDoc,
  visibleRelations,
} from '../core/index.ts';
import type {
  MemoryDoc,
  MemoryGraph,
  MemoryNode,
  NodeId,
  NodeInput,
  PerspectiveId,
  Relation,
  RelationInput,
  RetrievalResult,
  Route,
  RouteComparison,
  Trace,
  TraceStep,
  Value,
} from '../core/index.ts';
import type { Renderer, RendererExtras } from '../view/contracts.ts';
import { conditionText } from '../view/renderer.ts';
import { announce, byId } from './dom.ts';
import { elidePath, formatValue, hops, labelOf, listJoin, times, Units, withUnits } from './format.ts';
import { lensColor, SceneBuilder } from './scene.ts';
import { confirmDialog, dismissToast, toast } from './toasts.ts';

export type DrawerTab = 'route' | 'pathways' | 'results';

export interface RouteView {
  fromId: NodeId;
  toId: NodeId;
  cmp: RouteComparison;
  verdict: string;
  note: string;
  error: string;
  learned: boolean;
}

export interface RunRecord {
  trace: Trace;
  lens: PerspectiveId;
  loops: number;
  explanation: string;
  short: string;
}

export interface Playing {
  id: NodeId;
  lens: PerspectiveId;
  paused: boolean;
  index: number;
  trace: Trace;
}

interface UndoEntry {
  label: string;
  /** Toast after undoing; default "Undone: <label>." */
  done?: string;
  undo: () => void;
}

export interface Panels {
  renderTopbar(): void;
  renderDrawer(): void;
  renderInspector(): void;
  traceProgress(index: number): void;
}

export class App {
  lens: PerspectiveId;
  selected: NodeId | null = null;
  inspectorOpen = false;
  drawerTab: DrawerTab | null = null;
  query = '';
  retrieval: RetrievalResult | null = null;
  route: RouteView | null = null;
  routeFrom = '';
  routeTo = '';
  runs = new Map<NodeId, Map<PerspectiveId, RunRecord>>();
  activePathway: NodeId | null = null;
  playing: Playing | null = null;
  speed: 1 | 2 = 1;
  /** False when this browser can't keep the memory (storage blocked). */
  persistent = true;
  reduced: boolean;
  linkSource: NodeId | null = null;
  readonly units: Units;
  readonly builder: SceneBuilder;
  readonly extras: RendererExtras;
  private undoStack: UndoEntry[] = [];
  private refreshQueued = false;
  private morphing: Promise<void> = Promise.resolve();
  panels!: Panels;
  /** Notified after every refresh (hook state, aria label). */
  onChange: () => void = () => {};

  readonly graph: MemoryGraph;
  readonly renderer: Renderer;
  readonly seedIds: ReadonlySet<NodeId>;
  readonly seedDoc: MemoryDoc;
  /** What Reset brings back, in words: the seed, or a personal memory's published file (F-007). */
  baseLabel = 'the seed';

  constructor(graph: MemoryGraph, renderer: Renderer, seedIds: ReadonlySet<NodeId>, seedDoc: MemoryDoc, reduced: boolean) {
    this.graph = graph;
    this.renderer = renderer;
    this.seedIds = seedIds;
    this.seedDoc = seedDoc;
    this.reduced = reduced;
    this.units = new Units(graph);
    this.builder = new SceneBuilder(graph, this.units);
    if (!renderer.extras) throw new Error('renderer extras missing');
    this.extras = renderer.extras;
    this.lens = graph.getPerspective(graph.meta.defaultPerspective) ? graph.meta.defaultPerspective : (graph.perspectives()[0]?.id ?? 'base');
    this.activePathway = graph.meta.featured?.pathway ?? listPathways(graph)[0]?.id ?? null;
    graph.on((ev) => {
      if (ev.type === 'reset') this.onReset();
      else this.queueRefresh();
    });
    renderer.onPick((id) => {
      if (this.linkSource) {
        if (id && id !== this.linkSource) this.linkPicked?.(id);
        return;
      }
      this.select(id, { fly: !!id, open: !!id });
    });
    this.applyLensCss();
  }

  /** Set by the link-mode UI. */
  linkPicked: ((id: NodeId) => void) | null = null;

  // ── Derived ──────────────────────────────────────────────────────────────────────
  /** The most connected light (ignition root, first arrow-key stop). */
  hub(): MemoryNode | undefined {
    let best: MemoryNode | undefined;
    let deg = -1;
    for (const n of this.graph.nodes()) {
      const d = this.graph.relationsOf(n.id).length;
      if (d > deg) ((deg = d), (best = n));
    }
    return best;
  }

  lensLabel(id: PerspectiveId = this.lens): string {
    return this.graph.getPerspective(id)?.label ?? id;
  }

  lensCss(id: PerspectiveId): string {
    const ps = this.graph.perspectives();
    const i = ps.findIndex((p) => p.id === id);
    const p = ps[i];
    return p ? lensColor(p, i) : '#FF9F5A';
  }

  visibleCount(): number {
    return visibleRelations(this.graph, this.lens).length;
  }

  statsText(): string {
    const n = this.graph.nodes().length;
    const m = this.visibleCount();
    return `${n} ${n === 1 ? 'light' : 'lights'} · ${m} ${m === 1 ? 'line' : 'lines'}`;
  }

  valueText(node: MemoryNode, lens: PerspectiveId = this.lens): string {
    return this.units.show(node, lens);
  }

  storedCount(): number {
    return this.graph.nodes().filter((n) => !this.seedIds.has(n.id)).length;
  }

  // ── Scene sync ───────────────────────────────────────────────────────────────────
  private queueRefresh(): void {
    if (this.refreshQueued) return;
    this.refreshQueued = true;
    queueMicrotask(() => {
      this.refreshQueued = false;
      this.refresh();
    });
  }

  refresh(): void {
    this.units.refresh();
    if (this.selected && !this.graph.getNode(this.selected)) this.select(null, { fly: false, open: this.inspectorOpen });
    this.renderer.setScene(this.builder.build(this.lens));
    this.renderer.setSelection(this.selected);
    if (this.query) this.runSearch(this.query, false);
    this.renderAll();
  }

  private onReset(): void {
    this.builder.reset();
    this.units.refresh();
    if (!this.graph.getPerspective(this.lens)) this.lens = this.graph.meta.defaultPerspective;
    this.selected = null;
    this.route = null;
    this.runs.clear();
    this.playing = null;
    this.retrieval = null;
    this.undoStack = [];
    this.activePathway = this.graph.meta.featured?.pathway ?? listPathways(this.graph)[0]?.id ?? null;
    this.renderer.stopTrace();
    this.renderer.clearRoutes();
    this.renderer.setActivation(null);
    this.renderer.setSelection(null);
    this.renderer.setScene(this.builder.build(this.lens));
    this.extras.playIntro({ speed: 0.5 });
    void this.extras.home();
    this.applyLensCss();
    if (this.query) this.runSearch(this.query, false);
    this.renderAll();
  }

  renderAll(): void {
    this.panels?.renderTopbar();
    this.panels?.renderDrawer();
    this.panels?.renderInspector();
    const stage = document.getElementById('stage');
    stage?.setAttribute('aria-label', `Constellation memory, ${this.lensLabel()} lens, ${this.statsText().replace(' · ', ', ')}.`);
    this.onChange();
  }

  private applyLensCss(): void {
    document.documentElement.style.setProperty('--lens', this.lensCss(this.lens));
  }

  // ── Lens ─────────────────────────────────────────────────────────────────────────
  setLens(id: PerspectiveId): Promise<void> {
    if (id === this.lens || !this.graph.getPerspective(id)) return this.morphing;
    this.lens = id;
    this.applyLensCss();
    this.morphing = this.renderer.transitionTo(this.builder.build(id), { durationMs: this.reduced ? 0 : 1000 });
    if (this.playing) this.stopRun();
    if (this.query) this.runSearch(this.query, false);
    if (this.route) this.findRoute(this.route.fromId, this.route.toId);
    this.renderAll();
    announce(`${this.lensLabel()} lens. ${this.statsText()}.`);
    return this.morphing;
  }

  // ── Selection ────────────────────────────────────────────────────────────────────
  select(id: NodeId | null, opts: { fly?: boolean; open?: boolean } = {}): void {
    this.selected = id && this.graph.getNode(id) ? id : null;
    this.renderer.setSelection(this.selected);
    if (opts.open !== undefined) this.inspectorOpen = opts.open || (this.inspectorOpen && !!this.selected);
    if (this.selected && opts.fly) void this.renderer.focusNode(this.selected);
    this.panels?.renderInspector();
    this.onChange();
    if (this.selected) announce(this.describe(this.selected));
  }

  describe(id: NodeId): string {
    const n = this.graph.getNode(id);
    if (!n) return '';
    const ps = this.graph.perspectives();
    const own = `${this.lensLabel()}: ${this.valueText(n)}`;
    const others = ps.filter((p) => p.id !== this.lens).map((p) => ({ p, v: this.units.show(n, p.id) }));
    const differs = others.filter((o) => o.v !== this.valueText(n));
    const lines = this.graph.relationsOf(id).filter((r) => !r.perspectives || r.perspectives.includes(this.lens)).length;
    const dis = differs.length ? ` Disagrees: ${differs.map((o) => `${o.p.label} ${o.v}`).join(', ')}.` : '';
    return `${n.label}, ${n.kind}. ${own}.${dis} ${lines} ${lines === 1 ? 'line' : 'lines'}.`;
  }

  /** Visible neighbours of a node in the active lens. */
  neighbours(id: NodeId): NodeId[] {
    const out: NodeId[] = [];
    for (const r of this.graph.relationsOf(id)) {
      if (r.perspectives && !r.perspectives.includes(this.lens)) continue;
      const other = r.from === id ? r.to : r.from;
      if (!out.includes(other)) out.push(other);
    }
    return out;
  }

  // ── Search ───────────────────────────────────────────────────────────────────────
  runSearch(q: string, openResults = true): void {
    this.query = q;
    const query = q.trim();
    if (!query) {
      this.retrieval = null;
      this.renderer.setActivation(null);
      this.panels?.renderDrawer();
      this.onChange();
      return;
    }
    performance.mark('search-start');
    const r = retrieve(this.graph, query, { perspective: this.lens, decay: 0.55 });
    this.retrieval = r;
    this.renderer.setActivation(r.activations.length ? r.activations : null);
    // If most of the answer (matches + 1 hop) is off screen, fly to fit it (F-014).
    const near = r.activations.filter((a) => a.depth <= 1).map((a) => a.nodeId);
    const onScreen = near.filter((id) => this.renderer.screenPosition(id)).length;
    if (near.length && onScreen < near.length / 2) void this.extras.frameNodes(near);
    performance.mark('search-end');
    performance.measure('search', 'search-start', 'search-end');
    if (openResults && this.drawerTab !== 'results') this.openDrawer('results', false);
    this.panels?.renderDrawer();
    this.onChange();
  }

  activationCounts(): number[] | null {
    if (!this.retrieval) return null;
    const c = [0, 0, 0, 0];
    for (const a of this.retrieval.activations) c[a.depth] = (c[a.depth] ?? 0) + 1;
    return c;
  }

  clearSearch(): void {
    const input = document.getElementById('search') as HTMLInputElement | null;
    if (input) input.value = '';
    this.runSearch('', false);
  }

  // ── Drawer / inspector ───────────────────────────────────────────────────────────
  openDrawer(tab: DrawerTab, focus = true): void {
    this.drawerTab = tab;
    this.panels?.renderDrawer();
    if (focus) document.querySelector<HTMLElement>(`#drawer [data-tab="${tab}"]`)?.focus();
    this.onChange();
  }

  closeDrawer(): void {
    this.drawerTab = null;
    this.panels?.renderDrawer();
    this.onChange();
  }

  closeInspector(): void {
    this.inspectorOpen = false;
    this.panels?.renderInspector();
    this.onChange();
  }

  // ── Route ────────────────────────────────────────────────────────────────────────
  findRoute(fromId: NodeId, toId: NodeId): RouteView {
    const g = this.graph;
    const A = labelOf(g, fromId);
    const B = labelOf(g, toId);
    const cmp = compareRoutes(g, fromId, toId, { perspective: this.lens });
    let verdict = '';
    let note = '';
    let error = '';
    if (!cmp.shortest) {
      const lonely = [fromId, toId].find((id) => this.neighbours(id).length === 0);
      const other = g.perspectives().find((p) => p.id !== this.lens && compareRoutes(g, fromId, toId, { perspective: p.id }).shortest);
      error = `No route from ${A} to ${B} under ${this.lensLabel()}.`;
      if (lonely) error += ` ${labelOf(g, lonely)} has no visible lines in this lens.`;
      if (other) error += ` Try ${other.label}.`;
      this.renderer.clearRoutes();
    } else {
      const s = cmp.shortest;
      if (!cmp.declared) note = 'No declared chain between these, so this is the shortest only.';
      else if (cmp.savedHops > 0) {
        const pct = Math.round((cmp.savedHops / cmp.declared.hops) * 100);
        verdict = `${hops(cmp.declared.hops)} → ${hops(s.hops)} · ${pct}% shorter`;
      } else verdict = `The declared chain is already the shortest: ${hops(s.hops)}.`;
      // Is the lens hiding a better shortcut?
      const global = compareRoutes(g, fromId, toId).shortest;
      if (global && global.hops < s.hops) {
        const hidden = global.relations.map((id) => g.getRelation(id)).filter((r): r is Relation => !!r && !!r.perspectives && !r.perspectives.includes(this.lens));
        const r = hidden[0];
        if (r) {
          const owners = (r.perspectives ?? []).map((p) => this.lensLabel(p));
          note = `${labelOf(g, r.from)}–${labelOf(g, r.to)} is invisible to the ${this.lensLabel()}, so the shortcut is longer here. It exists for ${listJoin(owners.map((o) => 'the ' + o))}.`;
        }
      }
      const trails = [] as Parameters<Renderer['highlightRoutes']>[0];
      if (cmp.declared && cmp.declared.hops !== s.hops) trails.push({ route: cmp.declared, role: 'declared' });
      trails.push({ route: s, role: 'shortest' });
      this.renderer.highlightRoutes(trails);
      // Frame both trails inside the free canvas so the race is always seen (F-014).
      void this.extras.frameNodes([...new Set(trails.flatMap((t) => t.route.nodes))]);
    }
    this.route = { fromId, toId, cmp, verdict, note, error, learned: false };
    this.routeFrom = A;
    this.routeTo = B;
    this.panels?.renderDrawer();
    this.onChange();
    return this.route;
  }

  clearRoute(): void {
    this.route = null;
    this.renderer.clearRoutes();
    this.panels?.renderDrawer();
    this.onChange();
  }

  routeLabels(r: Route): string {
    return elidePath(r.nodes.map((id) => labelOf(this.graph, id)));
  }

  learn(): void {
    const v = this.route;
    const s = v?.cmp.shortest;
    if (!v || !s || s.hops < 2) return;
    // learned is true only when something changed, so "Learned" is always truthful (F-007).
    const res = learnShortcutDetailed(this.graph, s);
    const rel = res.relation;
    const A = labelOf(this.graph, s.nodes[0] as NodeId);
    const Z = labelOf(this.graph, s.nodes[s.nodes.length - 1] as NodeId);
    if (!res.learned) {
      toast(`${A} ↔ ${Z} is already a shortcut.`, { key: 'learn', timeout: 5000 });
      return;
    }
    const learnedRoute: Route = { kind: 'shortest', nodes: [rel.from, rel.to], relations: [rel.id], hops: 1, cost: 1 / rel.weight };
    this.renderer.highlightRoutes([{ route: learnedRoute, role: 'learned' }]);
    const cmp = compareRoutes(this.graph, v.fromId, v.toId, { perspective: this.lens });
    const pct = cmp.declared && cmp.shortest ? Math.round(((cmp.declared.hops - cmp.shortest.hops) / cmp.declared.hops) * 100) : 0;
    this.route = { ...v, cmp, learned: true, note: '', verdict: cmp.declared && cmp.shortest ? `${hops(cmp.declared.hops)} → ${hops(cmp.shortest.hops)} · ${pct}% shorter` : v.verdict };
    const id = rel.id;
    const previous = res.previous;
    this.pushUndo(`Learned ${A} ↔ ${Z}`, () => {
      if (!this.graph.getRelation(id)) return;
      if (previous) this.graph.updateRelation(id, { perspectives: previous.perspectives });
      else this.graph.removeRelation(id);
    }, `Forgot the shortcut ${A} ↔ ${Z}.`);
    toast(`Learned: ${A} ↔ ${Z}. Next time it's one hop.`, {
      key: 'learn',
      timeout: 6000,
      actions: [{ label: 'Undo', run: () => this.undo() }],
    });
    this.panels?.renderDrawer();
  }

  // ── Pathways ─────────────────────────────────────────────────────────────────────
  pathways(): MemoryNode[] {
    return listPathways(this.graph);
  }

  pathwayKind(id: NodeId): string {
    const ops = pathwayNodes(this.graph, id).map((n) => this.graph.getNode(n)?.pathway?.op);
    if (ops.includes('while')) return 'while loop';
    if (ops.includes('if')) return 'if / else';
    return 'sequence';
  }

  /** Trace note with units on the evaluated operands of conditions. */
  stepText(step: TraceStep, lens: PerspectiveId): string {
    const node = this.graph.getNode(step.nodeId);
    const expr = node?.pathway?.expr;
    if (!expr || (step.op !== 'if' && step.op !== 'while' && step.op !== 'assign')) return step.note;
    let refs: string[] = [];
    try {
      refs = references(parseExpr(expr));
    } catch {
      return step.note;
    }
    // Units only when every operand reads the same unit (K, °C); mixed hand-feel words stay bare.
    const u = this.units.sharedUnit(refs, lens);
    if (!u) return step.note;
    const parts = step.note.split(' · ');
    const last = parts.pop() ?? '';
    return [...parts, withUnits(last, u)].join(' · ');
  }

  conditionChip(step: TraceStep, lens: PerspectiveId): string {
    return conditionText(this.stepText(step, lens));
  }

  async run(id: NodeId, stepMode = false): Promise<void> {
    if (this.playing && this.playing.id === id && !stepMode) {
      this.togglePause();
      return;
    }
    if (this.playing && this.playing.id === id && stepMode) {
      this.renderer.extras?.stepTrace();
      this.playing.paused = true;
      this.panels?.renderDrawer();
      return;
    }
    this.stopRun();
    this.activePathway = id;
    const lens = this.lens;
    const trace = runPathway(this.graph, id, lens);
    const playing: Playing = { id, lens, paused: stepMode, index: -1, trace };
    this.playing = playing;
    this.openDrawer('pathways', false);
    this.panels?.renderDrawer();
    // Frame the flowchart and what it reads, so read sparks and value chips stay in view (F-023).
    const body = pathwayNodes(this.graph, id);
    const sources = body.flatMap((n) => {
      const src = this.graph.getNode(n)?.pathway?.source;
      return src ? [src] : [];
    });
    const refs = body.flatMap((n) => {
      const e = this.graph.getNode(n)?.pathway?.expr;
      if (!e) return [];
      try {
        return references(parseExpr(e)).flatMap((l) => this.graph.findByLabel(l)?.id ?? []);
      } catch {
        return [];
      }
    });
    await this.extras.frameNodes([...new Set([...body, ...sources, ...refs])]);
    if (this.playing !== playing) return;
    const done = this.renderer.playTrace(trace, {
      stepMs: this.speed === 2 ? 260 : 520,
      onStep: (i) => {
        playing.index = i;
        this.panels?.traceProgress(i);
        this.onChange();
      },
      conditionText: (step) => this.conditionChip(step, lens),
    });
    if (stepMode) {
      this.extras.setTracePaused(true);
    }
    await done;
    if (this.playing !== playing) return;
    this.finishRun(playing);
  }

  private finishRun(p: Playing): void {
    const rec = this.record(p.trace, p.lens);
    let m = this.runs.get(p.id);
    if (!m) this.runs.set(p.id, (m = new Map()));
    m.set(p.lens, rec);
    this.playing = null;
    this.panels?.renderDrawer();
    this.onChange();
    announce(`${this.lensLabel(p.lens)}: ${rec.trace.status === 'ended' ? formatValue(rec.trace.result) : rec.trace.error ?? 'stopped'}`);
  }

  togglePause(): void {
    if (!this.playing) return;
    this.playing.paused = !this.playing.paused;
    this.extras.setTracePaused(this.playing.paused);
    this.panels?.renderDrawer();
  }

  step(id: NodeId | null = this.activePathway): void {
    if (!id) return;
    if (this.playing?.id === id) {
      this.playing.paused = true;
      this.extras.setTracePaused(true);
      this.extras.stepTrace();
      this.panels?.renderDrawer();
      return;
    }
    void this.run(id, true);
  }

  stopRun(): void {
    if (this.playing) {
      this.playing = null;
      this.renderer.stopTrace();
    }
  }

  /** Explanation + compact summary for a finished trace. */
  record(trace: Trace, lens: PerspectiveId): RunRecord {
    const g = this.graph;
    const L = this.lensLabel(lens);
    const loops = trace.steps.filter((s, i) => s.op === 'while' && s.branch === 'true' && trace.steps.slice(i + 1).some((t) => t.nodeId === s.nodeId)).length;
    // What the lens read: read sources and @refs, in visit order.
    const labels: string[] = [];
    for (const s of trace.steps) {
      const node = g.getNode(s.nodeId);
      const p = node?.pathway;
      if (!p) continue;
      if (p.op === 'read' && p.source) {
        const l = labelOf(g, p.source);
        if (!labels.includes(l)) labels.push(l);
      }
      if (p.expr && p.op !== 'end') {
        try {
          for (const l of references(parseExpr(p.expr))) if (!labels.includes(l)) labels.push(l);
        } catch {
          /* the trace already carries the parse error */
        }
      }
    }
    const reads = labels.map((l) => {
      const n = g.findByLabel(l);
      return n ? `${l} as ${this.units.show(n, lens)}` : l;
    });
    const result = trace.status === 'ended' ? formatValue(trace.result) : '';
    const hasLoop = trace.steps.some((s) => s.op === 'while');
    let explanation: string;
    if (trace.status !== 'ended') explanation = trace.error ?? `Stopped after ${trace.steps.length} visits.`;
    else if (hasLoop) explanation = `${L} reads ${listJoin(reads)}, so the loop ran ${times(loops)}.`;
    else explanation = `${L} reads ${listJoin(reads)}, so it ends: ${result}`;
    // Compact summary: a counter that equals the loop count reads best ("2 stirs").
    let short = result.replace(/\.$/, '');
    if (hasLoop) {
      const counter = Object.entries(trace.vars).find(([, v]) => typeof v === 'number' && v === loops);
      short = counter ? `${loops} ${counter[0]}` : `${loops} loops`;
    }
    if (trace.status !== 'ended') short = 'stopped';
    return { trace, lens, loops, explanation, short };
  }

  comparison(id: NodeId): string {
    const m = this.runs.get(id);
    if (!m || m.size < 2) return '';
    const order = this.graph.perspectives().map((p) => p.id).filter((p) => m.has(p));
    const parts = order.map((p) => `${this.lensLabel(p)}: ${m.get(p)!.short}`);
    const distinct = new Set(order.map((p) => JSON.stringify(m.get(p)!.trace.result)));
    return `${parts.join(' · ')}. ${distinct.size > 1 ? 'Same pathway, different truths.' : 'Same pathway, same answer so far.'}`;
  }

  // ── Store, link, delete, undo ────────────────────────────────────────────────────
  store(input: NodeInput, link: { to: NodeId; relation: Pick<RelationInput, 'type' | 'label'> } | null): MemoryNode {
    const g = this.graph;
    const node = g.addNode(input);
    const birth = this.builder.birthplace(node.id, link?.to ?? null);
    for (const p of g.perspectives()) {
      const pos = birth[p.id];
      if (pos) g.updatePerspective(p.id, { positions: { ...(p.positions ?? {}), [node.id]: pos } });
    }
    let rel: Relation | null = null;
    if (link) rel = g.addRelation({ from: node.id, to: link.to, ...link.relation, weight: 0.6 });
    const id = node.id;
    this.pushUndo(`Stored ${node.label}`, () => {
      if (g.getNode(id)) g.removeNode(id);
    });
    queueMicrotask(() => {
      this.extras.burst(id);
      this.extras.nudgeToward(id, 0.6); // ease well toward the birth so it reads clear of its neighbours (F-024)
      this.select(id, { fly: false, open: this.inspectorOpen });
    });
    const linked = rel ? ` · linked to ${labelOf(g, rel.to)}` : '';
    toast(`Stored "${node.label}"${linked}.`, { key: 'store', actions: [{ label: 'Undo', run: () => this.undo() }], timeout: 5000 });
    return node;
  }

  link(from: NodeId, to: NodeId, relation: Pick<RelationInput, 'type' | 'label'>, weight: number, onlyThisLens: boolean): Relation {
    const r = this.graph.addRelation({ from, to, ...relation, weight, perspectives: onlyThisLens ? [this.lens] : undefined });
    const id = r.id;
    this.pushUndo('Linked', () => {
      if (this.graph.getRelation(id)) this.graph.removeRelation(id);
    });
    toast(`Linked ${labelOf(this.graph, from)} → ${labelOf(this.graph, to)}${onlyThisLens ? ` (only for the ${this.lensLabel()})` : ''}.`, {
      key: 'link',
      actions: [{ label: 'Undo', run: () => this.undo() }],
    });
    return r;
  }

  async remove(id: NodeId): Promise<void> {
    const g = this.graph;
    const n = g.getNode(id);
    if (!n) return;
    const rels = g.relationsOf(id);
    const readers = g.nodes().filter((m) => m.pathway?.source === id || (m.pathway?.expr ?? '').includes(n.label));
    const msg = `Delete ${n.label} and its ${rels.length} ${rels.length === 1 ? 'line' : 'lines'}?${readers.length ? ' Pathways that read it will stop with an error.' : ''}`;
    const choice = await confirmDialog(msg, [
      { label: 'Cancel', value: '', kind: 'ghost' },
      { label: 'Delete', value: 'delete', kind: 'danger' },
    ]);
    if (choice !== 'delete') return;
    const nodeCopy: NodeInput = { id: n.id, label: n.label, kind: n.kind, value: n.value, facets: { ...n.facets }, units: n.units ? { ...n.units } : undefined, tags: [...n.tags], notes: n.notes, file: n.file, pathway: n.pathway };
    const positions = Object.fromEntries(g.perspectives().map((p) => [p.id, p.positions?.[id]]));
    const relCopies: RelationInput[] = rels.map((r) => ({ id: r.id, from: r.from, to: r.to, type: r.type, weight: r.weight, directed: r.directed, branch: r.branch, label: r.label, perspectives: r.perspectives }));
    g.removeNode(id);
    this.pushUndo(`Deleted ${n.label}`, () => {
      g.addNode(nodeCopy);
      for (const p of g.perspectives()) {
        const pos = positions[p.id];
        if (pos) g.updatePerspective(p.id, { positions: { ...(p.positions ?? {}), [id]: pos } });
      }
      for (const r of relCopies) if (g.getNode(r.from) && g.getNode(r.to)) g.addRelation(r);
    });
    toast(`Deleted ${n.label}.`, { key: 'delete', actions: [{ label: 'Undo', run: () => this.undo() }] });
  }

  pushUndo(label: string, undo: () => void, done?: string): void {
    this.undoStack.push({ label, undo, done });
    if (this.undoStack.length > 50) this.undoStack.shift();
  }

  undo(): void {
    const e = this.undoStack.pop();
    if (!e) {
      toast('Nothing to undo.', { key: 'undo', timeout: 2000 });
      return;
    }
    e.undo();
    dismissToast('learn');
    // A shown route is recomputed so the drawer never describes a line that is gone (F-018).
    if (this.route) {
      const { fromId, toId } = this.route;
      queueMicrotask(() => {
        if (this.graph.getNode(fromId) && this.graph.getNode(toId)) this.findRoute(fromId, toId);
        else this.clearRoute();
      });
    }
    toast(e.done ?? `Undone: ${e.label}.`, { key: 'undo', timeout: 2400 });
  }

  // ── Files ────────────────────────────────────────────────────────────────────────
  exportFile(): void {
    const text = exportJson(this.graph);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'constellation-memory.json';
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Exported constellation-memory.json.', { key: 'export', timeout: 2600 });
  }

  async importText(name: string, text: string): Promise<boolean> {
    const r = importJson(text);
    if (!r.ok) {
      const first = r.errors[0]?.message ?? 'That file could not be read.';
      const more = r.errors.length > 1 ? ` (${r.errors.length - 1} more ${r.errors.length === 2 ? 'problem' : 'problems'})` : '';
      toast(`${first}${more}`, { key: 'import', error: true, timeout: 9000 });
      return false;
    }
    // Replacing the memory is destructive: confirm, offer an export first (F-003).
    const k = this.storedCount();
    const lose = k ? `Your ${k} stored ${k === 1 ? 'thing' : 'things'} will be gone unless you export first.` : 'Your current memory will be gone unless you export first.';
    let choice = '';
    do {
      choice = await confirmDialog(`Replace your memory with "${name}"? ${lose}`, [
        { label: 'Cancel', value: '', kind: 'ghost' },
        { label: 'Export first', value: 'export' },
        { label: 'Replace', value: 'replace', kind: 'danger' },
      ]);
      if (choice === 'export') this.exportFile();
    } while (choice === 'export');
    if (choice !== 'replace') return false;
    this.graph.load(r.doc);
    const n = r.doc.nodes.length;
    const m = r.doc.relations.length;
    toast(`Opened "${name}": ${n} ${n === 1 ? 'light' : 'lights'}, ${m} ${m === 1 ? 'line' : 'lines'}.`, { key: 'import' });
    return true;
  }

  async resetToSeed(): Promise<void> {
    const k = this.storedCount();
    const msg = k
      ? `Replace your memory with ${this.baseLabel}? Your ${k} stored ${k === 1 ? 'thing' : 'things'} will be gone unless you export first.`
      : `Replace your memory with ${this.baseLabel}? Any changes you made will be gone unless you export first.`;
    const choice = await confirmDialog(msg, [
      { label: 'Cancel', value: '', kind: 'ghost' },
      { label: 'Export first', value: 'export' },
      { label: 'Replace', value: 'replace', kind: 'danger' },
    ]);
    if (choice === 'export') {
      this.exportFile();
      return this.resetToSeed();
    }
    if (choice !== 'replace') return;
    const v = validateDoc(this.seedDoc);
    if (v.ok) this.graph.load(v.doc);
    toast(this.baseLabel === 'the seed' ? 'The seed memory is back.' : `Back to ${this.baseLabel}.`, { key: 'reset' });
  }

  /** Value parsing for the Store sheet: numbers and booleans stay typed so conditions can read them. */
  static parseValue(raw: string): Value {
    const t = raw.trim();
    if (!t) return null;
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    if (t === 'true') return true;
    if (t === 'false') return false;
    return raw;
  }

  resolve(n: MemoryNode, lens: PerspectiveId): Value {
    return resolveValue(n, lens);
  }

  stageEl(): HTMLElement {
    return byId('stage');
  }
}
