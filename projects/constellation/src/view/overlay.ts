// src/view/overlay.ts — DOM overlay for 3D labels and chips (experience.md §7 "Label declutter").
// Decision (WO-003): a capped pool of absolutely-positioned DOM elements, placed greedily in
// priority order; any item whose padded rect overlaps one already placed tries its alternate
// anchors and is otherwise skipped, so labels never overlap. Fade in 160 ms, out 120 ms (CSS).

export type OverlayKind = 'lbl' | 'chip' | 'flowchip' | 'condchip' | 'badge' | 'trailchip' | 'readchip';
export type Anchor = 'right' | 'left' | 'above' | 'below' | 'center';

export interface OverlayItem {
  key: string;
  kind: OverlayKind;
  text: string;
  /** Anchor point in CSS px. */
  x: number;
  y: number;
  /** Distance from the anchor point (e.g. the node's screen radius + gap). */
  offset: number;
  anchors: readonly Anchor[];
  priority: number;
  opacity: number;
  color?: string;
  cls?: string;
  /** Placed even if it overlaps (still blocks later items). */
  force?: boolean;
  /** Counts toward the label cap. */
  isLabel?: boolean;
  nodeId?: string;
}

export interface PlacedRect {
  key: string;
  nodeId?: string;
  kind: OverlayKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

const FONT: Record<OverlayKind, { font: string; pad: number; h: number; track: number }> = {
  lbl: { font: '500 12px Manrope, system-ui, sans-serif', pad: 0, h: 16, track: 0.24 },
  chip: { font: '400 11px "IBM Plex Mono", ui-monospace, monospace', pad: 12, h: 17, track: 0 },
  flowchip: { font: '400 10px "IBM Plex Mono", ui-monospace, monospace', pad: 8, h: 13, track: 0 },
  condchip: { font: '500 12px "IBM Plex Mono", ui-monospace, monospace', pad: 18, h: 24, track: 0 },
  readchip: { font: '500 11px "IBM Plex Mono", ui-monospace, monospace', pad: 12, h: 15, track: 0 },
  badge: { font: '700 12px "IBM Plex Mono", ui-monospace, monospace', pad: 12, h: 18, track: 0 },
  trailchip: { font: '500 12px Manrope, system-ui, sans-serif', pad: 18, h: 22, track: 0 },
};
const PAD = 4;

interface El {
  el: HTMLElement;
  text: string;
  cls: string;
  on: boolean;
  lastSeen: number;
  color: string;
  op: string;
}

export class Overlay {
  readonly root: HTMLElement;
  private pool = new Map<string, El>();
  private ctx: CanvasRenderingContext2D | null;
  private widths = new Map<string, number>();
  private frame = 0;
  placed: PlacedRect[] = [];
  labelsShown = 0;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'overlay-layer';
    this.root.setAttribute('aria-hidden', 'true');
    Object.assign(this.root.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden' });
    container.appendChild(this.root);
    this.ctx = document.createElement('canvas').getContext('2d');
    // Re-measure once the web fonts arrive.
    document.fonts?.ready.then(() => this.widths.clear()).catch(() => {});
  }

  private measure(kind: OverlayKind, text: string): number {
    const key = kind + '\u0000' + text;
    const hit = this.widths.get(key);
    if (hit !== undefined) return hit;
    const f = FONT[kind];
    let w = text.length * 7;
    if (this.ctx) {
      this.ctx.font = f.font;
      w = this.ctx.measureText(text).width;
    }
    w = Math.ceil(w + f.track * text.length + f.pad);
    this.widths.set(key, w);
    return w;
  }

  /** Greedy placement; `labelCap` limits items with isLabel. `obstacles` (node cores) block labels too. */
  place(items: OverlayItem[], labelCap: number, vw: number, vh: number, obstacles: Array<{ x: number; y: number; r: number }> = [], minY = 2): void {
    this.frame++;
    items.sort((a, b) => b.priority - a.priority);
    const placed: PlacedRect[] = [];
    const blockers = obstacles.map((o) => ({ x: o.x - o.r, y: o.y - o.r, w: o.r * 2, h: o.r * 2 }));
    let labels = 0;
    const seen = new Set<string>();
    const overlaps = (x: number, y: number, w: number, h: number) => {
      for (const r of placed) {
        if (x < r.x + r.w + PAD && x + w + PAD > r.x && y < r.y + r.h + PAD && y + h + PAD > r.y) return true;
      }
      for (const r of blockers) {
        if (x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y) return true;
      }
      return false;
    };
    for (const it of items) {
      if (it.isLabel && labels >= labelCap) continue;
      if (it.opacity <= 0.02) continue;
      const f = FONT[it.kind];
      const w = this.measure(it.kind, it.text);
      const h = f.h;
      let spot: { x: number; y: number } | null = null;
      for (const a of it.anchors) {
        const p = anchorAt(a, it.x, it.y, it.offset, w, h);
        if (p.x < 2 || p.y < minY || p.x + w > vw - 2 || p.y + h > vh - 2) continue;
        if (!it.force && overlaps(p.x, p.y, w, h)) continue;
        spot = p;
        break;
      }
      if (!spot && it.force) spot = anchorAt(it.anchors[0] ?? 'center', it.x, it.y, it.offset, w, h);
      if (!spot) continue;
      placed.push({ key: it.key, nodeId: it.nodeId, kind: it.kind, x: spot.x, y: spot.y, w, h });
      if (it.isLabel) labels++;
      seen.add(it.key);
      this.show(it, spot.x, spot.y);
    }
    for (const [key, e] of this.pool) {
      if (seen.has(key)) continue;
      if (e.on) {
        e.on = false;
        e.el.classList.remove('on');
      }
      if (this.frame - e.lastSeen > 30) {
        e.el.remove();
        this.pool.delete(key);
      }
    }
    this.placed = placed;
    this.labelsShown = labels;
  }

  private show(it: OverlayItem, x: number, y: number): void {
    let e = this.pool.get(it.key);
    if (!e) {
      const el = document.createElement('div');
      e = { el, text: '', cls: '', on: false, lastSeen: this.frame, color: '', op: '' };
      this.root.appendChild(el);
      this.pool.set(it.key, e);
    }
    const cls = `${it.kind}${it.cls ? ' ' + it.cls : ''}`;
    if (e.cls !== cls) {
      e.cls = cls;
      e.el.className = cls + (e.on ? ' on' : '');
    }
    if (e.text !== it.text) {
      e.text = it.text;
      e.el.textContent = it.text;
    }
    const color = it.color ?? '';
    if (e.color !== color) {
      e.color = color;
      e.el.style.setProperty('--c', color || null);
    }
    const op = it.opacity.toFixed(2);
    if (e.op !== op) {
      e.op = op;
      e.el.style.setProperty('--o', op);
    }
    e.el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    e.lastSeen = this.frame;
    if (!e.on) {
      e.on = true;
      // Next frame so the opacity transition runs from 0.
      requestAnimationFrame(() => {
        if (e && e.lastSeen === this.frame) e.el.classList.add('on');
        else if (e?.on) e.el.classList.add('on');
      });
    }
  }

  clear(): void {
    for (const e of this.pool.values()) e.el.remove();
    this.pool.clear();
    this.placed = [];
    this.labelsShown = 0;
  }

  dispose(): void {
    this.clear();
    this.root.remove();
  }
}

function anchorAt(a: Anchor, x: number, y: number, off: number, w: number, h: number): { x: number; y: number } {
  switch (a) {
    case 'right':
      return { x: x + off, y: y - h / 2 };
    case 'left':
      return { x: x - off - w, y: y - h / 2 };
    case 'above':
      return { x: x - w / 2, y: y - off - h };
    case 'below':
      return { x: x - w / 2, y: y + off };
    default:
      return { x: x - w / 2, y: y - h / 2 };
  }
}
