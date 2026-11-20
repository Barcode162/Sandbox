// helpers/svgPlot.js: dependency-free SVG line plots for evidence (Ȳ vs position, frame timing,
// seam diff shares). Output is a standalone SVG string; write it with evidence.writeEvidence().
//
//   linePlot({ title, xLabel, yLabel, series: [{ name, points: [[x, y], …], color? }],
//              width?, height?, yMin?, yMax?, hlines?: [{ y, label, color? }] })

const PALETTE = ['#2154D8', '#F54123', '#0BCA86', '#8843DB', '#F68704', '#04A7D8', '#F2C50E'];

/** @param {string} s */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** @param {number} v */
function fmt(v) {
  if (!Number.isFinite(v)) return String(v);
  const a = Math.abs(v);
  if (a !== 0 && (a < 0.01 || a >= 1e5)) return v.toExponential(1);
  return String(Math.round(v * 1000) / 1000);
}

/** "Nice" tick values covering [lo, hi]. @param {number} lo @param {number} hi @param {number} n */
function ticks(lo, hi, n = 5) {
  if (hi === lo) return [lo];
  const step0 = (hi - lo) / n;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= step0) ?? step0;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.round(v / step) * step);
  return out;
}

/**
 * @param {{ title: string; xLabel?: string; yLabel?: string;
 *           series: { name: string; points: [number, number][]; color?: string }[];
 *           width?: number; height?: number; yMin?: number; yMax?: number;
 *           hlines?: { y: number; label?: string; color?: string }[] }} spec
 * @returns {string}
 */
export function linePlot(spec) {
  const W = spec.width ?? 800;
  const H = spec.height ?? 360;
  const m = { l: 64, r: 16, t: 36, b: 48 };
  const pts = spec.series.flatMap((s) => s.points);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]).concat((spec.hlines ?? []).map((h) => h.y));
  const x0 = xs.length ? Math.min(...xs) : 0;
  const x1 = xs.length ? Math.max(...xs) : 1;
  const y0 = spec.yMin ?? (ys.length ? Math.min(...ys) : 0);
  const y1 = spec.yMax ?? (ys.length ? Math.max(...ys) : 1);
  const sx = (/** @type {number} */ x) => m.l + ((x - x0) / (x1 - x0 || 1)) * (W - m.l - m.r);
  const sy = (/** @type {number} */ y) => H - m.b - ((y - y0) / (y1 - y0 || 1)) * (H - m.t - m.b);
  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="sans-serif" font-size="11">`);
  parts.push(`<rect width="${W}" height="${H}" fill="#fff"/>`);
  parts.push(`<text x="${m.l}" y="20" font-size="13" font-weight="600">${esc(spec.title)}</text>`);
  for (const t of ticks(y0, y1)) {
    parts.push(`<line x1="${m.l}" x2="${W - m.r}" y1="${sy(t)}" y2="${sy(t)}" stroke="#e5e5e5"/>`);
    parts.push(`<text x="${m.l - 6}" y="${sy(t) + 4}" text-anchor="end">${fmt(t)}</text>`);
  }
  for (const t of ticks(x0, x1, 8)) {
    parts.push(`<line x1="${sx(t)}" x2="${sx(t)}" y1="${H - m.b}" y2="${H - m.b + 4}" stroke="#555"/>`);
    parts.push(`<text x="${sx(t)}" y="${H - m.b + 16}" text-anchor="middle">${fmt(t)}</text>`);
  }
  parts.push(`<line x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}" stroke="#555"/>`);
  parts.push(`<line x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${H - m.b}" stroke="#555"/>`);
  if (spec.xLabel) parts.push(`<text x="${(m.l + W - m.r) / 2}" y="${H - 10}" text-anchor="middle">${esc(spec.xLabel)}</text>`);
  if (spec.yLabel) parts.push(`<text transform="translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">${esc(spec.yLabel)}</text>`);
  for (const h of spec.hlines ?? []) {
    const c = h.color ?? '#999';
    parts.push(`<line x1="${m.l}" x2="${W - m.r}" y1="${sy(h.y)}" y2="${sy(h.y)}" stroke="${c}" stroke-dasharray="4 3"/>`);
    if (h.label) parts.push(`<text x="${W - m.r - 4}" y="${sy(h.y) - 4}" text-anchor="end" fill="${c}">${esc(h.label)}</text>`);
  }
  spec.series.forEach((s, i) => {
    const c = s.color ?? PALETTE[i % PALETTE.length];
    const d = s.points.map((p, k) => `${k ? 'L' : 'M'}${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`).join(' ');
    parts.push(`<path d="${d}" fill="none" stroke="${c}" stroke-width="1.5"/>`);
    parts.push(`<text x="${m.l + 8 + i * 140}" y="${m.t + 12}" fill="${c}">${esc(s.name)}</text>`);
  });
  parts.push('</svg>');
  return parts.join('\n');
}
