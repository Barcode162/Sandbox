// src/ui/store.ts — the Store sheet (N) and link mode (L): store a thing, link it, find it later.
import type { FileRef, NodeId, NodeInput, NodeKind } from '../core/index.ts';
import { App } from './app.ts';
import { byId, h } from './dom.ts';
import { labelOf } from './format.ts';
import { LINK_TYPES } from './scene.ts';
import { toast } from './toasts.ts';

const KINDS: Array<{ kind: NodeKind; label: string }> = [
  { kind: 'concept', label: 'Thing' },
  { kind: 'variable', label: 'Variable' },
  { kind: 'file', label: 'File' },
];
const MAX_VALUE = 500;
const MAX_CONTENT = 2000;

export class StoreSheet {
  private app: App;
  private dlg: HTMLDialogElement | null = null;
  private returnFocus: HTMLElement | null = null;

  constructor(app: App) {
    this.app = app;
  }

  get open(): boolean {
    return !!this.dlg?.open;
  }

  show(prefillLink?: NodeId): void {
    if (this.dlg) return;
    const app = this.app;
    this.returnFocus = document.activeElement as HTMLElement | null;
    const dlg = h('dialog.sheet.panel', { 'aria-labelledby': 'store-title' }) as HTMLDialogElement;
    let kind: NodeKind = 'concept';
    let confirmedDuplicate = '';
    const form = h('form', { novalidate: true, autocomplete: 'off' });
    const seg = h('div.seg.kind', { role: 'radiogroup', 'aria-label': 'Kind' });
    const name = h('input', { id: 'store-name', required: true, maxlength: '120', 'aria-describedby': 'store-name-err', spellcheck: 'false' });
    const nameErr = h('p.err', { id: 'store-name-err', role: 'alert' });
    const value = h('input', { id: 'store-value', 'aria-describedby': 'store-value-err', spellcheck: 'false' });
    const valueErr = h('p.err', { id: 'store-value-err', role: 'alert' });
    const same = h('input', { type: 'checkbox', id: 'store-same', checked: true });
    const fileBox = h('fieldset.filebox', { style: 'border:0;padding:0;margin:0;display:none;flex-direction:column;gap:12px' });
    const path = h('input', { id: 'store-path', placeholder: '/home/notes/idea.txt', spellcheck: 'false' });
    const mime = h('input', { id: 'store-mime', placeholder: 'text/plain' });
    const size = h('input', { id: 'store-size', placeholder: '2 KB' });
    const content = h('textarea', { id: 'store-content', maxlength: String(MAX_CONTENT), rows: '4' });
    const linkTo = h('input', { id: 'store-link', list: 'node-names', spellcheck: 'false', value: prefillLink ? labelOf(app.graph, prefillLink) : '' });
    const linkErr = h('p.err', { id: 'store-link-err', role: 'alert' });
    const linkType = h('select', { id: 'store-link-type' });
    for (const t of LINK_TYPES) linkType.append(h('option', { value: t.key }, t.label));

    const setKind = (k: NodeKind) => {
      kind = k;
      for (const b of seg.querySelectorAll<HTMLButtonElement>('button')) {
        const on = b.dataset.kind === k;
        b.setAttribute('aria-checked', String(on));
        b.classList.toggle('on', on);
        b.tabIndex = on ? 0 : -1;
      }
      fileBox.style.display = k === 'file' ? 'flex' : 'none';
    };
    for (const k of KINDS) {
      const b = h('button', { type: 'button', role: 'radio', 'data-kind': k.kind }, k.label);
      b.addEventListener('click', () => setKind(k.kind));
      seg.append(b);
    }
    seg.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const i = KINDS.findIndex((k) => k.kind === kind);
      const next = KINDS[(i + (e.key === 'ArrowRight' ? 1 : KINDS.length - 1)) % KINDS.length]!;
      setKind(next.kind);
      seg.querySelector<HTMLElement>(`[data-kind="${next.kind}"]`)?.focus();
    });
    const valueLabel = h('span', {}, `Value under ${app.lensLabel()}`);
    fileBox.append(
      h('legend.sr-only', {}, 'File reference'),
      h('label.field', {}, h('span', {}, 'Path'), path),
      h('div.grid2', {}, h('label.field', {}, h('span', {}, 'Type'), mime), h('label.field', {}, h('span', {}, 'Size note'), size)),
      h('label.field', {}, h('span', {}, `Contents (up to ${MAX_CONTENT.toLocaleString('en')} characters, optional)`), content),
    );
    const cancel = h('button.btn.ghost', { type: 'button' }, 'Cancel');
    cancel.addEventListener('click', () => this.close());
    form.append(
      h('div.field', {}, h('span', { id: 'kind-label' }, 'Kind'), seg),
      h('label.field', {}, h('span', {}, 'Name'), name),
      nameErr,
      h('label.field', {}, valueLabel, value),
      valueErr,
      h('label.check', {}, same, h('span', {}, 'Same in every lens')),
      fileBox,
      h('div.grid2', {}, h('label.field', {}, h('span', {}, 'Link to'), linkTo), h('label.field', {}, h('span', {}, 'As'), linkType)),
      linkErr,
      h('div.row.end', {}, cancel, h('button.btn.primary', { type: 'submit' }, 'Store it')),
    );
    setKind('concept');
    name.addEventListener('input', () => {
      nameErr.textContent = '';
      name.removeAttribute('aria-invalid');
      confirmedDuplicate = '';
    });
    value.addEventListener('input', () => {
      valueErr.textContent = value.value.length > MAX_VALUE ? 'Values hold up to 500 characters. Put longer text in a File.' : '';
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const label = name.value.trim();
      if (!label) {
        nameErr.textContent = 'Give it a name, even one word.';
        name.setAttribute('aria-invalid', 'true');
        name.focus();
        return;
      }
      const dup = app.graph.findByLabel(label);
      if (dup && confirmedDuplicate !== label) {
        nameErr.textContent = `There's already a "${dup.label}". Store another anyway?`;
        confirmedDuplicate = label;
        name.focus();
        return;
      }
      if (value.value.length > MAX_VALUE) {
        valueErr.textContent = 'Values hold up to 500 characters. Put longer text in a File.';
        value.focus();
        return;
      }
      let link: { to: NodeId; relation: (typeof LINK_TYPES)[number]['input'] } | null = null;
      if (linkTo.value.trim()) {
        const target = app.graph.findByLabel(linkTo.value);
        if (!target) {
          linkErr.textContent = `Nothing here is called "${linkTo.value.trim()}". Pick a name from the list, or leave it empty.`;
          linkTo.focus();
          return;
        }
        const t = LINK_TYPES.find((x) => x.key === linkType.value) ?? LINK_TYPES[0]!;
        link = { to: target.id, relation: t.input };
      }
      const v = App.parseValue(value.value);
      const input: NodeInput = { label, kind, tags: [] };
      if (same.checked) input.value = v;
      else {
        input.value = null;
        input.facets = { [app.lens]: v };
      }
      if (kind === 'file') {
        const file: FileRef = { name: label };
        if (path.value.trim()) file.path = path.value.trim();
        if (mime.value.trim()) file.mime = mime.value.trim();
        if (size.value.trim()) file.sizeNote = size.value.trim();
        if (content.value) file.content = content.value.slice(0, MAX_CONTENT);
        input.file = file;
      }
      try {
        app.store(input, link);
        this.close(false);
      } catch (err) {
        toast(err instanceof Error ? err.message : String(err), { error: true, key: 'store-err' });
      }
    });
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.close();
    });
    dlg.append(h('h2.sheet-title', { id: 'store-title' }, 'Store a thing'), form);
    document.body.append(dlg);
    this.dlg = dlg;
    dlg.showModal();
    name.focus();
  }

  close(restoreFocus = true): void {
    const d = this.dlg;
    if (!d) return;
    d.close();
    d.remove();
    this.dlg = null;
    if (restoreFocus) this.returnFocus?.focus?.();
  }
}

/** Link mode: a rubber band follows the pointer; picking a light (or typing a name) opens the popover. */
export class LinkMode {
  private app: App;
  private bar: HTMLElement | null = null;
  private pop: HTMLElement | null = null;

  constructor(app: App) {
    this.app = app;
    app.linkPicked = (id) => this.picked(id);
  }

  get active(): boolean {
    return !!this.app.linkSource;
  }

  start(source: NodeId): void {
    const app = this.app;
    this.cancel();
    app.linkSource = source;
    app.extras.setLinkSource(source);
    const input = h('input', { id: 'link-target', list: 'node-names', placeholder: 'or type a name…', 'aria-label': 'Link to', spellcheck: 'false', style: 'height:32px;padding:0 10px;border-radius:8px;background:rgba(0,0,0,.45);border:1px solid var(--hairline-strong);color:var(--ink);width:170px' });
    const go = h('button.btn.small', { type: 'button' }, 'Choose');
    const cancel = h('button.btn.small.ghost', { type: 'button' }, 'Cancel');
    const choose = () => {
      const n = app.graph.findByLabel(input.value);
      if (n && n.id !== source) this.picked(n.id);
      else input.setAttribute('aria-invalid', 'true');
    };
    go.addEventListener('click', choose);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        choose();
      }
    });
    cancel.addEventListener('click', () => this.cancel());
    this.bar = h('div.linkbar.panel', { role: 'group', 'aria-label': 'Link mode' }, h('span', {}, `Linking from ${labelOf(app.graph, source)} · click a light`), input, go, cancel);
    document.body.append(this.bar);
    input.focus();
  }

  private picked(target: NodeId): void {
    const app = this.app;
    const source = app.linkSource;
    if (!source) return;
    this.pop?.remove();
    const pos = app.renderer.screenPosition(target) ?? { x: innerWidth / 2, y: innerHeight / 2 };
    const type = h('select', { id: 'link-type' });
    for (const t of LINK_TYPES) type.append(h('option', { value: t.key }, t.label));
    const only = h('input', { type: 'checkbox', id: 'link-only' });
    const weight = h('input', { type: 'range', id: 'link-weight', min: '0.2', max: '1', step: '0.1', value: '0.6', 'aria-label': 'Weight' });
    const out = h('output', { for: 'link-weight' }, '0.6');
    weight.addEventListener('input', () => (out.textContent = Number(weight.value).toFixed(1)));
    const ok = h('button.btn.primary', { type: 'submit' }, 'Link');
    const no = h('button.btn.ghost', { type: 'button' }, 'Cancel');
    const form = h(
      'form.popover.panel',
      { role: 'dialog', 'aria-labelledby': 'link-title' },
      h('h2', { id: 'link-title' }, `${labelOf(app.graph, source)} → ${labelOf(app.graph, target)}`),
      h('label.field', {}, h('span', {}, 'Type'), type),
      h('label.check', {}, only, h('span', {}, `Only in this lens (${app.lensLabel()})`)),
      h('div.field', {}, h('span', { id: 'w-label' }, 'Weight'), h('div.range', {}, weight, out)),
      h('div.row.end', {}, no, ok),
    );
    form.style.left = `${Math.min(innerWidth - 316, Math.max(16, pos.x + 16))}px`;
    form.style.top = `${Math.min(innerHeight - 280, Math.max(72, pos.y - 40))}px`;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = LINK_TYPES.find((x) => x.key === type.value) ?? LINK_TYPES[0]!;
      try {
        app.link(source, target, t.input, Number(weight.value), only.checked);
      } catch (err) {
        toast(err instanceof Error ? err.message : String(err), { error: true, key: 'link-err' });
      }
      this.cancel();
    });
    no.addEventListener('click', () => this.cancel());
    this.pop = form;
    document.body.append(form);
    type.focus();
  }

  /** Esc: closes the popover first, then link mode. Returns true if it consumed the key. */
  escape(): boolean {
    if (this.pop) {
      this.pop.remove();
      this.pop = null;
      byId<HTMLInputElement>('link-target').focus();
      return true;
    }
    if (this.app.linkSource) {
      this.cancel();
      return true;
    }
    return false;
  }

  cancel(): void {
    this.pop?.remove();
    this.pop = null;
    this.bar?.remove();
    this.bar = null;
    if (this.app.linkSource) {
      this.app.linkSource = null;
      this.app.extras.setLinkSource(null);
    }
  }
}
