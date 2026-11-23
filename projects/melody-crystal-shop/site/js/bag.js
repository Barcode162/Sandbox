// bag.js — the shopping bag. Stored as [{slug, format, qty}] under `mc.bag.v1`;
// prices are always read fresh from data/crystals.js, so Melody's price edits apply to saved bags.
import { CRYSTALS, FORMATS, bySlug } from '../data/crystals.js';

const KEY = 'mc.bag.v1';
export const MAX_QTY = 10;

let memory = [];
let persistent = true;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    persistent = false;
    return memory;
  }
}

function write(list) {
  memory = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    persistent = false;
  }
  document.dispatchEvent(new CustomEvent('bag:change', { detail: { list } }));
}

export function isPersistent() {
  read();
  return persistent;
}

/** Valid, resolved lines: unknown crystals or formats are dropped silently. */
export function lines() {
  return read()
    .map((it) => {
      const c = bySlug(it.slug);
      const f = FORMATS.find((x) => x.id === it.format);
      const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(it.qty) || 0)));
      if (!c || !f) return null;
      return { key: `${c.slug}:${f.id}`, slug: c.slug, format: f.id, qty, crystal: c, formatInfo: f, price: c.prices[f.id] };
    })
    .filter(Boolean);
}

export function count() {
  return lines().reduce((s, l) => s + l.qty, 0);
}

export function add(slug, format, qty = 1) {
  const list = lines().map(({ slug, format, qty }) => ({ slug, format, qty }));
  const hit = list.find((x) => x.slug === slug && x.format === format);
  if (hit) hit.qty = Math.min(MAX_QTY, hit.qty + qty);
  else list.push({ slug, format, qty: Math.min(MAX_QTY, qty) });
  write(list);
  return `${slug}:${format}`;
}

export function setQty(key, qty) {
  const list = lines()
    .map(({ key: k, slug, format, qty: q }) => ({ slug, format, qty: k === key ? Math.min(MAX_QTY, Math.max(1, qty)) : q }));
  write(list);
}

/** Remove a line; returns a function that restores it at the same position. */
export function remove(key) {
  const before = lines().map(({ slug, format, qty }) => ({ slug, format, qty }));
  const idx = before.findIndex((x) => `${x.slug}:${x.format}` === key);
  if (idx < 0) return () => {};
  const [gone] = before.splice(idx, 1);
  write(before);
  return () => {
    const now = lines().map(({ slug, format, qty }) => ({ slug, format, qty }));
    now.splice(Math.min(idx, now.length), 0, gone);
    write(now);
  };
}

export function clear() {
  write([]);
}

export { CRYSTALS };
