// Paint helpers for the origami sprites (WO-003): one "pen" draws either the real paper shapes or, in
// shadow mode, the union silhouette as ONE path filled once (so overlaps never double-darken; §4 Light, §16.15).
import { P } from '../../data/palette';

export interface Pen {
  ctx: CanvasRenderingContext2D;
  /** Shadow pass: shapes add subpaths to a single path; details and strokes are skipped. */
  shadow: boolean;
}

export const OUTLINE = 'rgba(28,26,36,0.55)';

const MIX = new Map<string, string>();
const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
/** Linear mix of two #rrggbb colours (cached). */
export function mix(a: string, b: string, t: number): string {
  const key = `${a}${b}${t}`;
  let v = MIX.get(key);
  if (v === undefined) {
    const x = hex(a), y = hex(b);
    const c = (i: number): string => Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0');
    v = `#${c(0)}${c(1)}${c(2)}`;
    MIX.set(key, v);
  }
  return v;
}
/** The shaded facet of a paper colour (light from the top-left). */
export const shade = (c: string, k = 0.16): string => mix(c, P.ink, k);
export const light = (c: string, k = 0.35): string => mix(c, P.foldWhite, k);

function begin(pen: Pen): void {
  if (!pen.shadow) pen.ctx.beginPath();
}
function finish(pen: Pen, fill: string | null, stroke: string | null, lw: number): void {
  if (pen.shadow) return;
  const c = pen.ctx;
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke && lw > 0) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}

/** Closed polygon from a flat [x0,y0,x1,y1,…] list, wound clockwise so shadow unions never cut holes. */
export function poly(pen: Pen, pts: readonly number[], fill: string | null, stroke: string | null = OUTLINE, lw = 1): void {
  let area = 0;
  const n = pts.length >> 1;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[2 * i] * pts[2 * j + 1] - pts[2 * j] * pts[2 * i + 1];
  }
  begin(pen);
  const c = pen.ctx;
  if (area >= 0) {
    c.moveTo(pts[0], pts[1]);
    for (let i = 1; i < n; i++) c.lineTo(pts[2 * i], pts[2 * i + 1]);
  } else {
    c.moveTo(pts[2 * (n - 1)], pts[2 * (n - 1) + 1]);
    for (let i = n - 2; i >= 0; i--) c.lineTo(pts[2 * i], pts[2 * i + 1]);
  }
  c.closePath();
  finish(pen, fill, stroke, lw);
}

export function ellipse(pen: Pen, x: number, y: number, rx: number, ry: number, rot: number, fill: string | null, stroke: string | null = OUTLINE, lw = 1): void {
  begin(pen);
  pen.ctx.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
  pen.ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  pen.ctx.closePath();
  finish(pen, fill, stroke, lw);
}

export function circle(pen: Pen, x: number, y: number, r: number, fill: string | null, stroke: string | null = OUTLINE, lw = 1): void {
  ellipse(pen, x, y, r, r, 0, fill, stroke, lw);
}

/** Open polyline detail (crease lines, legs, whiskers). Skipped in the shadow pass unless `solid`. */
export function line(pen: Pen, pts: readonly number[], color: string, lw: number, solid = false): void {
  if (pen.shadow && !solid) return;
  const c = pen.ctx;
  if (pen.shadow) {
    // thick strokes (legs) contribute to the silhouette as thin quads
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const x0 = pts[i], y0 = pts[i + 1], x1 = pts[i + 2], y1 = pts[i + 3];
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = (-(y1 - y0) / len) * lw * 0.5, ny = ((x1 - x0) / len) * lw * 0.5;
      poly(pen, [x0 + nx, y0 + ny, x1 + nx, y1 + ny, x1 - nx, y1 - ny, x0 - nx, y0 - ny], null);
    }
    return;
  }
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.strokeStyle = color;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
}

/** Quadratic curve detail (whiskers, streamers). Never part of the shadow. */
export function curve(pen: Pen, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, color: string, lw: number): void {
  if (pen.shadow) return;
  const c = pen.ctx;
  c.beginPath();
  c.moveTo(x0, y0);
  c.quadraticCurveTo(cx, cy, x1, y1);
  c.strokeStyle = color;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.stroke();
}

