// src/ui/toasts.ts — calm toasts at bottom centre (polite live region) and the confirm / key-map dialogs.
import { byId, h } from './dom.ts';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface ToastOptions {
  actions?: ToastAction[];
  /** ms; 0 = until dismissed. Default 4200. */
  timeout?: number;
  error?: boolean;
  key?: string;
}

export interface Toast {
  el: HTMLElement;
  dismiss(): void;
}

const live = new Map<string, Toast>();

export function toast(text: string | Node, options: ToastOptions = {}): Toast {
  const host = byId('toasts');
  if (options.key) live.get(options.key)?.dismiss();
  const el = h('div.toast', {});
  if (options.error) el.classList.add('err');
  if (!options.actions?.length) el.classList.add('plain');
  el.append(h('span', {}, text));
  let timer = 0;
  const dismiss = () => {
    window.clearTimeout(timer);
    if (!el.isConnected) return;
    el.classList.add('leaving');
    window.setTimeout(() => el.remove(), 170);
    if (options.key && live.get(options.key)?.el === el) live.delete(options.key);
  };
  for (const a of options.actions ?? []) {
    el.append(
      h('button.btn.small', { type: 'button', onclick: () => { dismiss(); a.run(); } }, a.label),
    );
  }
  // Keep at most three on screen.
  while (host.children.length >= 3) host.firstElementChild?.remove();
  host.append(el);
  const timeout = options.timeout ?? 4200;
  if (timeout > 0) timer = window.setTimeout(dismiss, timeout);
  const t = { el, dismiss };
  if (options.key) live.set(options.key, t);
  return t;
}

export function dismissToast(key: string): void {
  live.get(key)?.dismiss();
}

export interface ConfirmButton {
  label: string;
  kind?: 'danger' | 'primary' | 'ghost';
  value: string;
}

/** Modal confirm; resolves with the chosen value ('' on Esc / cancel). */
export function confirmDialog(message: string, buttons: ConfirmButton[]): Promise<string> {
  return new Promise((resolve) => {
    const dlg = h('dialog.confirm.panel', { 'aria-labelledby': 'confirm-msg' });
    const msg = h('p#confirm-msg', {}, message);
    const row = h('div.row.end.wrap', {});
    for (const b of buttons) {
      row.append(h(`button.btn${b.kind ? '.' + b.kind : ''}`, { type: 'button', onclick: () => close(b.value) }, b.label));
    }
    dlg.append(h('div.inner', {}, msg, row));
    const close = (v: string) => {
      dlg.close();
      dlg.remove();
      resolve(v);
    };
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      close('');
    });
    document.body.append(dlg);
    dlg.showModal();
    (row.lastElementChild as HTMLElement | null)?.focus();
  });
}

export const KEYMAP: Array<[string, string]> = [
  ['1 / 2 / 3', 'Switch lens'],
  ['/', 'Focus search'],
  ['Esc', 'Clear search or route, close the panel, cancel link mode'],
  ['← ↑ → ↓', 'Move to the nearest neighbour in that direction'],
  ['[ / ]', 'Cycle through neighbours'],
  ['Enter / F', 'Open the inspector / fly to the selection'],
  ['N', 'Store a thing'],
  ['L', 'Link the selection to another light'],
  ['R / P', 'Route drawer / Pathways drawer'],
  ['Space / S', 'Run or pause / step the pathway'],
  ['D (hold)', 'Expand every ghost with its value'],
  ['Home', 'Reset the camera'],
  ['Ctrl/⌘ + Z', 'Undo the last change'],
  ['Ctrl/⌘ + E', 'Export'],
  ['?', 'This key map'],
];

export function keymapDialog(): void {
  if (document.querySelector('dialog.keymap')) return;
  const dlg = h('dialog.keymap.panel', { 'aria-labelledby': 'keymap-title' });
  const table = h('table', {});
  const body = h('tbody', {});
  for (const [k, v] of KEYMAP) body.append(h('tr', {}, h('td', {}, k), h('td', {}, v)));
  table.append(body);
  const close = h('button.btn', { type: 'button', onclick: () => done() }, 'Close');
  dlg.append(h('div.inner', {}, h('h2#keymap-title', { style: 'font-size:19px;font-weight:700' }, 'Key map'), table, h('div.row.end', {}, close)));
  const done = () => {
    dlg.close();
    dlg.remove();
  };
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    done();
  });
  document.body.append(dlg);
  dlg.showModal();
  close.focus();
}
