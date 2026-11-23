// src/ui/drawer.ts — the left drawer: Route · Pathways · Results (experience.md §10).
import type { NodeId } from '../core/index.ts';
import type { App, DrawerTab } from './app.ts';
import { byId, clear, h, ICON, svgIcon } from './dom.ts';
import { formatValue, hops, labelOf, plural } from './format.ts';

const TABS: Array<{ id: DrawerTab; label: string; key?: string; icon: string }> = [
  { id: 'route', label: 'Route', key: 'R', icon: ICON.route },
  { id: 'pathways', label: 'Pathways', key: 'P', icon: ICON.pathway },
  { id: 'results', label: 'Results', icon: ICON.results },
];

export class Drawer {
  private app: App;
  readonly el = byId('drawer');
  private head = h('div.panel-head', {});
  private tabs = h('div.tabs', { role: 'tablist', 'aria-label': 'Instruments' });
  private body = h('div.panel-body', { role: 'tabpanel', id: 'drawer-panel', tabindex: '-1' });
  private handle = h('button.handle', { type: 'button', 'aria-label': 'Expand or collapse the panel' });
  private datalist = h('datalist#node-names', {});
  private lastTab: DrawerTab | null = null;
  private traceList: HTMLOListElement | null = null;
  private fromInput: HTMLInputElement | null = null;
  private toInput: HTMLInputElement | null = null;
  peek = false;
  onClose: () => void = () => {};

  constructor(app: App) {
    this.app = app;
    for (const t of TABS) {
      const b = h(
        'button.tab',
        { type: 'button', role: 'tab', id: `tab-${t.id}`, 'data-tab': t.id, 'aria-controls': 'drawer-panel', 'aria-selected': 'false', 'aria-keyshortcuts': t.key, title: t.key ? `${t.label} (${t.key})` : t.label },
        svgIcon(t.icon),
        h('span.tab-label', {}, t.label),
        t.key ? h('kbd', { 'aria-hidden': 'true' }, t.key) : null,
      );
      b.addEventListener('click', () => {
        if (this.el.classList.contains('rail')) this.el.classList.remove('rail');
        app.openDrawer(t.id, false);
      });
      this.tabs.append(b);
    }
    this.tabs.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      e.stopPropagation();
      const i = TABS.findIndex((t) => t.id === app.drawerTab);
      const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]!;
      app.openDrawer(next.id, true);
    });
    const close = h('button.btn.icon.ghost.close', { type: 'button', 'aria-label': 'Close the drawer', title: 'Close (Esc)' }, svgIcon(ICON.close));
    close.addEventListener('click', () => this.onClose());
    this.handle.addEventListener('click', () => {
      this.peek = !this.peek;
      this.el.classList.toggle('peek', this.peek);
    });
    this.head.append(this.tabs, close);
    this.el.append(this.handle, this.head, this.body);
    document.body.append(this.datalist);
  }

  /** Node names for the From / To / Link comboboxes. */
  private fillNames(): void {
    const labels = this.app.graph
      .nodes()
      .filter((n) => n.kind !== 'pathway')
      .map((n) => n.label)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const key = labels.join('\u0000');
    if (this.datalist.dataset.key === key) return;
    this.datalist.dataset.key = key;
    clear(this.datalist);
    for (const l of labels) this.datalist.append(h('option', { value: l }));
  }

  render(): void {
    const app = this.app;
    const tab = app.drawerTab;
    if (!tab) {
      if (!this.el.hidden) this.el.hidden = true;
      this.lastTab = null;
      return;
    }
    this.fillNames();
    this.el.hidden = false;
    for (const b of this.tabs.querySelectorAll<HTMLButtonElement>('.tab')) {
      const on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    this.body.setAttribute('aria-labelledby', `tab-${tab}`);
    // Keep focus and typed text when re-rendering the same tab.
    const keepFocus = this.body.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.focusKey : undefined;
    const scroll = this.body.scrollTop;
    clear(this.body);
    if (tab === 'route') this.renderRoute();
    else if (tab === 'pathways') this.renderPathways();
    else this.renderResults();
    if (keepFocus) this.body.querySelector<HTMLElement>(`[data-focus-key="${keepFocus}"]`)?.focus();
    if (this.lastTab === tab) this.body.scrollTop = scroll;
    this.lastTab = tab;
  }

  // ── Route ────────────────────────────────────────────────────────────────────────
  private renderRoute(): void {
    const app = this.app;
    const g = app.graph;
    const form = h('form.route-form', { autocomplete: 'off' });
    const from = h('input', { id: 'route-from', list: 'node-names', value: app.routeFrom, placeholder: 'A light…', 'data-focus-key': 'from', spellcheck: 'false' });
    const to = h('input', { id: 'route-to', list: 'node-names', value: app.routeTo, placeholder: 'Another light…', 'data-focus-key': 'to', spellcheck: 'false' });
    this.fromInput = from;
    this.toInput = to;
    from.addEventListener('input', () => (app.routeFrom = from.value));
    to.addEventListener('input', () => (app.routeTo = to.value));
    const err = h('p.err', { id: 'route-err', role: 'alert' });
    form.append(
      h('div.grid2', {}, h('label.field', {}, h('span', {}, 'From'), from), h('label.field', {}, h('span', {}, 'To'), to)),
    );
    const feat = g.meta.featured?.route;
    if (feat && g.getNode(feat.from) && g.getNode(feat.to)) {
      const A = labelOf(g, feat.from);
      const Z = labelOf(g, feat.to);
      const chip = h('button.chipbtn', { type: 'button', 'data-focus-key': 'try' }, `Try the featured route: ${A} → ${Z}`);
      chip.addEventListener('click', () => {
        from.value = app.routeFrom = A;
        to.value = app.routeTo = Z;
        app.findRoute(feat.from, feat.to);
      });
      form.append(chip);
    }
    form.append(err, h('button.btn.primary.wide', { type: 'submit', 'data-focus-key': 'find' }, 'Find route', h('kbd', { 'aria-hidden': 'true' }, 'Enter')));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const a = g.findByLabel(from.value);
      const b = g.findByLabel(to.value);
      if (!from.value.trim() || !to.value.trim()) err.textContent = 'Name two lights: where to start and where to arrive.';
      else if (!a) err.textContent = `Nothing here is called "${from.value.trim()}". Pick a name from the list.`;
      else if (!b) err.textContent = `Nothing here is called "${to.value.trim()}". Pick a name from the list.`;
      else if (a.id === b.id) err.textContent = 'Those are the same light. Pick two different ones.';
      else {
        err.textContent = '';
        app.findRoute(a.id, b.id);
      }
    });
    this.body.append(form);

    const v = app.route;
    if (!v) return;
    const out = h('section.route-out', { 'aria-live': 'polite', 'aria-label': 'Route result' });
    if (v.error) {
      out.append(h('p.empty', {}, v.error));
      this.body.append(out);
      return;
    }
    const rows = h('div.route-rows', {});
    const s = v.cmp.shortest;
    if (s) {
      rows.append(this.row('var(--signal)', false, hops(s.hops), app.routeLabels(s), 'Shortest'));
    }
    if (v.cmp.declared && (!s || v.cmp.declared.hops !== s.hops || v.learned)) {
      rows.append(this.row('var(--trail-long)', true, hops(v.cmp.declared.hops), app.routeLabels(v.cmp.declared), 'Declared chain'));
    }
    out.append(rows);
    if (v.verdict) out.append(h('p.verdict', { id: 'route-verdict' }, v.verdict));
    if (v.note) out.append(h('p.note', {}, v.note));
    if (s) {
      const A = labelOf(g, s.nodes[0] as NodeId);
      const Z = labelOf(g, s.nodes[s.nodes.length - 1] as NodeId);
      const can = s.hops >= 2;
      const reason = h('span.sr-only', { id: 'learn-why' }, 'Already one hop. Nothing shorter to learn.');
      const learn = h(
        'button.btn.signal.wide',
        { type: 'button', 'data-focus-key': 'learn', 'aria-disabled': can ? undefined : 'true', 'aria-describedby': can ? undefined : 'learn-why', title: can ? `Add a direct line ${A} ↔ ${Z}` : 'Already one hop. Nothing shorter to learn.' },
        `Learn shortcut ${A} → ${Z}`,
      );
      learn.addEventListener('click', () => {
        if (can) app.learn();
      });
      out.append(learn);
      if (!can) out.append(h('p.hint', { 'aria-hidden': 'true' }, 'Already one hop. Nothing shorter to learn.'), reason);
    }
    this.body.append(out);
  }

  private row(color: string, dotted: boolean, hopsText: string, path: string, name: string): HTMLElement {
    return h(
      'div.route-row',
      {},
      h(`span.swatch${dotted ? '.dotted' : ''}`, { style: `--c:${color}`, 'aria-hidden': 'true' }),
      h('span.hops', {}, h('span.sr-only', {}, `${name}: `), hopsText),
      h('span.path', {}, path),
    );
  }

  focusRouteFrom(): void {
    this.fromInput?.focus();
  }

  // ── Pathways ─────────────────────────────────────────────────────────────────────
  private renderPathways(): void {
    const app = this.app;
    const list = app.pathways();
    this.traceList = null;
    if (!list.length) {
      this.body.append(h('p.empty', {}, 'No pathways in this memory yet. A pathway starts at a pathway step with the op "start".'));
      return;
    }
    for (const p of list) {
      const isActive = app.activePathway === p.id;
      const playing = app.playing?.id === p.id ? app.playing : null;
      const card = h(`section.pcard${isActive ? '.active' : ''}`, { 'aria-labelledby': `pw-${p.id}` });
      card.addEventListener('focusin', () => (app.activePathway = p.id));
      const run = h('button.btn.primary', { type: 'button', 'data-focus-key': `run-${p.id}`, 'aria-keyshortcuts': 'Space' }, playing ? (playing.paused ? 'Resume' : 'Pause') : 'Run', h('kbd', { 'aria-hidden': 'true' }, 'Space'));
      run.addEventListener('click', () => {
        app.activePathway = p.id;
        void app.run(p.id);
      });
      const step = h('button.btn', { type: 'button', 'data-focus-key': `step-${p.id}`, 'aria-keyshortcuts': 'S' }, 'Step', h('kbd', { 'aria-hidden': 'true' }, 'S'));
      step.addEventListener('click', () => {
        app.activePathway = p.id;
        app.step(p.id);
      });
      const seg = h('div.seg', { role: 'group', 'aria-label': 'Speed' });
      for (const sp of [1, 2] as const) {
        const b = h('button', { type: 'button', 'aria-pressed': String(app.speed === sp), 'data-focus-key': `speed-${p.id}-${sp}` }, `${sp}×`);
        b.addEventListener('click', () => {
          app.speed = sp;
          this.render();
        });
        seg.append(b);
      }
      card.append(
        h('div', {}, h('h3', { id: `pw-${p.id}` }, p.label), h('p.sub', {}, app.pathwayKind(p.id))),
        h('div.row.wrap', {}, run, step, seg),
      );
      // Live trace of the current run, else the last run under this lens.
      const rec = app.runs.get(p.id)?.get(app.lens);
      const trace = playing?.trace ?? (isActive ? rec?.trace : undefined);
      if (trace) {
        const upto = playing ? playing.index : trace.steps.length - 1;
        const ol = h('ol.trace', { tabindex: '0', 'aria-label': `Trace under ${app.lensLabel(playing?.lens ?? app.lens)}` });
        trace.steps.forEach((s, i) => {
          if (i > upto) return;
          ol.append(this.traceItem(s, i, i === upto && !!playing, playing?.lens ?? app.lens));
        });
        card.append(ol);
        if (playing) this.traceList = ol;
        queueMicrotask(() => ol.lastElementChild?.scrollIntoView({ block: 'nearest' }));
      }
      if (!playing && rec) {
        const res = h('div.result', { 'aria-live': 'polite' });
        if (rec.trace.status === 'ended') res.append(h('p.out', {}, formatValue(rec.trace.result)));
        else res.append(h('p.out.error', {}, rec.trace.error ?? 'The pathway stopped.'));
        res.append(h('p.why', {}, rec.explanation));
        const cmp = app.comparison(p.id);
        if (cmp) res.append(h('p.compare', {}, cmp));
        card.append(res);
      } else if (!playing) {
        const other = app.runs.get(p.id);
        if (other?.size) {
          const cmp = app.comparison(p.id);
          card.append(h('p.note', {}, cmp || `Ran under ${[...other.keys()].map((l) => app.lensLabel(l)).join(', ')}. Run it under the ${app.lensLabel()} to compare.`));
        }
      }
      this.body.append(card);
    }
  }

  private traceItem(s: { op: string; note: string; branch?: string; nodeId: NodeId }, i: number, cur: boolean, lens: string): HTMLElement {
    const text = this.app.stepText(s as Parameters<App['stepText']>[0], lens);
    const cls = `${cur ? 'cur ' : ''}${s.branch === 'true' ? 't-true' : s.branch === 'false' ? 't-false' : ''}`.trim();
    // Segments never break inside (numbers stay with units); lines wrap only at " · " (F-022).
    const n = h('span.n', {});
    text.split(' · ').forEach((seg, k) => {
      if (k) n.append(' · ');
      n.append(h('span.seg', {}, seg));
    });
    return h('li', { class: cls || undefined, 'aria-current': cur ? 'step' : undefined }, h('span.i', { 'aria-hidden': 'true' }, String(i + 1)), n);
  }

  /** Called on every visit during playback (cheap: appends one row). */
  traceProgress(index: number): void {
    const app = this.app;
    const p = app.playing;
    if (!p || app.drawerTab !== 'pathways') return;
    if (!this.traceList || !this.traceList.isConnected) {
      this.render();
      return;
    }
    const ol = this.traceList;
    ol.querySelector('li.cur')?.classList.remove('cur');
    ol.querySelector('li[aria-current]')?.removeAttribute('aria-current');
    while (ol.children.length <= index) {
      const i = ol.children.length;
      const s = p.trace.steps[i];
      if (!s) break;
      ol.append(this.traceItem(s, i, false, p.lens));
    }
    const li = ol.children[index] as HTMLElement | undefined;
    li?.classList.add('cur');
    li?.setAttribute('aria-current', 'step');
    li?.scrollIntoView({ block: 'nearest' });
  }

  // ── Results ──────────────────────────────────────────────────────────────────────
  private renderResults(): void {
    const app = this.app;
    const r = app.retrieval;
    const q = app.query.trim();
    if (!q) {
      this.body.append(h('p.empty', {}, 'Ask the memory a word in the search field (/). Matches flare, and their neighbours light by how many hops away they are.'));
      return;
    }
    if (!r || !r.matches.length) {
      this.body.append(h('p.empty', { role: 'status' }, `Nothing here remembers "${q}". Try a shorter word, or store it (N).`));
      return;
    }
    const groups = new Map<number, NodeId[]>();
    for (const a of r.activations) {
      const list = groups.get(a.depth) ?? [];
      list.push(a.nodeId);
      groups.set(a.depth, list);
    }
    const names = (d: number) => (d === 0 ? 'Matches' : d === 1 ? '1 hop' : `${d} hops`);
    const depths = [...groups.keys()].sort((a, b) => a - b);
    this.body.append(h('p.summary.sr-only', { role: 'status' }, depths.map((d) => `${names(d)} (${groups.get(d)!.length})`).join(' · ')));
    for (const d of depths) {
      const ids = groups.get(d)!;
      const level = d === 0 ? 1 : d === 1 ? 1 : d === 2 ? 0.55 : 0.3;
      const sec = h('section.rgroup', { 'aria-label': `${names(d)}: ${plural(ids.length, 'light')}` });
      sec.append(h('h3', {}, h('span.lvl', { style: `--a:${level}`, 'aria-hidden': 'true' }), `${names(d)} (${ids.length})`));
      const ul = h('ul.rlist', {});
      for (const id of ids) {
        const n = app.graph.getNode(id);
        if (!n) continue;
        const b = h('button', { type: 'button', 'data-focus-key': `r-${id}`, title: `${n.label} · ${app.valueText(n)}` }, n.label);
        b.addEventListener('click', () => app.select(id, { fly: true, open: true }));
        ul.append(h('li', {}, b));
      }
      sec.append(ul);
      this.body.append(sec);
    }
  }
}
