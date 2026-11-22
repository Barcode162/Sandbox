// src/ui/dom.ts — tiny DOM helpers (vanilla, no framework).

type Child = Node | string | number | null | undefined | false;
type Attrs = Record<string, string | number | boolean | null | undefined | EventListener>;

/** h('button.btn.primary', { type: 'button', onclick }, 'Store'). */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K | `${K}.${string}` | `${K}#${string}`, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const [head, ...classes] = tag.split('.');
  const [name, id] = (head ?? 'div').split('#');
  const el = document.createElement(name as K);
  if (id) el.id = id;
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = [el.className, String(v)].filter(Boolean).join(' ');
    else if (k === 'style') el.setAttribute('style', String(v));
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(typeof c === 'number' ? String(c) : c);
  return el;
}

export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing`);
  return el as T;
}

export function clear(el: Element): void {
  while (el.firstChild) el.firstChild.remove();
}

/** True when keyboard input belongs to a text field (global shortcuts stand down). */
export function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  if (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true;
  if (t.tagName === 'INPUT') {
    const type = (t as HTMLInputElement).type;
    return !['checkbox', 'radio', 'range', 'button', 'submit'].includes(type);
  }
  return false;
}

let announceTimer = 0;
export function announce(text: string): void {
  const el = document.getElementById('announcer');
  if (!el) return;
  window.clearTimeout(announceTimer);
  el.textContent = '';
  announceTimer = window.setTimeout(() => (el.textContent = text), 30);
}

export const svgIcon = (paths: string, size = 16): SVGSVGElement => {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = paths;
  return svg;
};

export const ICON = {
  route: '<circle cx="3.5" cy="12.5" r="1.8" fill="currentColor"/><circle cx="12.5" cy="3.5" r="1.8" fill="currentColor"/><path d="M3.5 12.5C6 12.5 5 3.5 12.5 3.5" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  pathway: '<path d="M8 2v3M8 11v3" stroke="currentColor" stroke-width="1.4"/><path d="M8 5l3 3-3 3-3-3z" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  results: '<circle cx="8" cy="8" r="1.8" fill="currentColor"/><circle cx="8" cy="8" r="4.2" stroke="currentColor" stroke-width="1.2" fill="none" opacity=".7"/><circle cx="8" cy="8" r="6.6" stroke="currentColor" stroke-width="1" fill="none" opacity=".4"/>',
  close: '<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
};
