// src/ui/inspector.ts — the right inspector: name, kind, the facet table (the thesis in one
// widget), hidden-in-this-lens lines, file reference, relations and actions (§9 F3, §10).
import { facetsOf } from '../core/index.ts';
import type { NodeId, Relation } from '../core/index.ts';
import type { App } from './app.ts';
import { byId, clear, h, ICON, svgIcon } from './dom.ts';
import { KIND_NAME, labelOf, listJoin, plural } from './format.ts';
import { relationWord } from './scene.ts';

export class Inspector {
  private app: App;
  readonly el = byId('inspector');
  private handle = h('button.handle', { type: 'button', 'aria-label': 'Expand or collapse the panel' });
  private content = h('div.insp', {});
  peek = false;
  onLink: (id: NodeId) => void = () => {};
  onClose: () => void = () => {};

  constructor(app: App) {
    this.app = app;
    this.handle.addEventListener('click', () => {
      this.peek = !this.peek;
      this.el.classList.toggle('peek', this.peek);
    });
    this.el.append(this.handle, this.content);
  }

  render(): void {
    const app = this.app;
    if (!app.inspectorOpen) {
      this.el.hidden = true;
      return;
    }
    this.el.hidden = false;
    const focusKey = this.el.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.focusKey : undefined;
    clear(this.content);
    const close = h('button.btn.icon.ghost.insp-close', { type: 'button', 'aria-label': 'Close the inspector', title: 'Close (Esc)', 'data-focus-key': 'close' }, svgIcon(ICON.close));
    close.addEventListener('click', () => this.onClose());
    this.content.append(close);
    const id = app.selected;
    const n = id ? app.graph.getNode(id) : undefined;
    if (!id || !n) {
      this.content.append(h('div.panel-body', {}, h('h2.sr-only', {}, 'Inspector'), h('p.empty', {}, 'Nothing selected. Click a light, or press / and ask.')));
      return;
    }
    const g = app.graph;
    const ps = g.perspectives();
    const facets = facetsOf(n, ps);
    const shown = facets.map((f) => app.units.show(n, f.perspective, f.value));
    const distinct = new Set(shown).size;

    const title = h('div.insp-title', {}, h('h2', { id: 'insp-name' }, n.label), h('span.kindchip', {}, KIND_NAME[n.kind]));
    this.content.append(title);
    const body = h('div.panel-body', {});

    if (n.kind !== 'pathway' && distinct > 1) {
      body.append(h('p.disagree', {}, distinct === ps.length ? `${ps.length} views disagree` : `${distinct} of ${ps.length} views differ`));
    }

    if (n.kind === 'pathway' && n.pathway) {
      const p = n.pathway;
      const what = p.op === 'read' && p.source ? `read ${p.target ?? ''} ← ${labelOf(g, p.source)}` : p.expr ? `${p.op}${p.target ? ' ' + p.target + ' ←' : ''} ${p.expr}` : p.op;
      body.append(h('div.fileref', {}, what));
    } else {
      // Facet table: active row bold; dots match the switcher pills.
      const table = h('table.facets', {}, h('caption.sr-only', {}, `Values of ${n.label} in each lens`));
      const tb = h('tbody', {});
      facets.forEach((f, i) => {
        const active = f.perspective === app.lens;
        tb.append(
          h(
            `tr${active ? '.active' : ''}`,
            { 'aria-current': active ? 'true' : undefined },
            h('th', { scope: 'row' }, h('span.dot', { style: `--c:${app.lensCss(f.perspective)}`, 'aria-hidden': 'true' }), app.lensLabel(f.perspective)),
            h('td', {}, shown[i] ?? '—', f.own ? null : h('span.fallback', {}, 'shared')),
          ),
        );
      });
      table.append(tb);
      body.append(table);
    }

    // Lines hidden in this lens (only when n > 0)
    const rels = g.relationsOf(id);
    const visible = rels.filter((r) => !r.perspectives || r.perspectives.includes(app.lens));
    const hidden = rels.filter((r) => r.perspectives && !r.perspectives.includes(app.lens));
    if (hidden.length) {
      const owners = new Set<string>();
      for (const r of hidden) for (const p of r.perspectives ?? []) owners.add(app.lensLabel(p));
      body.append(h('p.hidden-lines', {}, `Hidden in this lens: ${plural(hidden.length, 'line')} (${listJoin([...owners])})`));
    }

    if (n.file) {
      const f = n.file;
      const meta = [f.path ?? f.name, f.mime, f.sizeNote].filter(Boolean).join(' · ');
      body.append(h('div.fileref', {}, meta, f.content ? h('div.content', {}, f.content) : null));
    }
    if (n.notes) body.append(h('p.notes', {}, n.notes));
    if (n.tags.length) body.append(h('div.tagsline', {}, ...n.tags.map((t) => h('span.kindchip', {}, `#${t}`))));

    // Relations grouped
    const groups = new Map<string, Relation[]>();
    for (const r of visible) {
      const w = relationWord(r, id);
      groups.set(w, [...(groups.get(w) ?? []), r]);
    }
    const sec = h('section', { 'aria-labelledby': 'insp-rel' });
    sec.append(h('h3.section-title', { id: 'insp-rel' }, `Relations (${visible.length})`));
    if (visible.length) {
      sec.append(h('p.relgroups', {}, [...groups].map(([w, rs]) => `${w} ${rs.length}`).join(' · ')));
      const ul = h('ul.nbrs', {});
      for (const r of visible.slice(0, 40)) {
        const other = r.from === id ? r.to : r.from;
        const b = h('button', { type: 'button', 'data-focus-key': `n-${r.id}` }, h('span', {}, labelOf(g, other)), h('span.rt', {}, relationWord(r, id)));
        b.addEventListener('click', () => app.select(other, { fly: true, open: true }));
        ul.append(h('li', {}, b));
      }
      sec.append(ul);
    } else sec.append(h('p.empty', {}, `No lines under the ${app.lensLabel()}. In this lens, ${n.label} stands alone.`));
    body.append(sec);

    // Actions
    const link = h('button.btn', { type: 'button', 'data-focus-key': 'link', 'aria-keyshortcuts': 'L' }, 'Link', h('kbd', { 'aria-hidden': 'true' }, 'L'));
    link.addEventListener('click', () => this.onLink(id));
    const route = h('button.btn', { type: 'button', 'data-focus-key': 'route' }, 'Route from here');
    route.addEventListener('click', () => {
      app.routeFrom = n.label;
      app.openDrawer('route', false);
      document.getElementById('route-to')?.focus();
    });
    const fly = h('button.btn', { type: 'button', 'data-focus-key': 'fly', 'aria-keyshortcuts': 'F' }, 'Fly to', h('kbd', { 'aria-hidden': 'true' }, 'F'));
    fly.addEventListener('click', () => void app.renderer.focusNode(id));
    const del = h('button.btn.danger', { type: 'button', 'data-focus-key': 'delete' }, 'Delete');
    del.addEventListener('click', () => void app.remove(id));
    body.append(h('div.actions', {}, link, route, fly, del));
    this.content.append(body);
    if (focusKey) this.content.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`)?.focus();
  }
}
