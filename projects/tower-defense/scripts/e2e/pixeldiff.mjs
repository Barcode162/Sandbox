// Grid pixel-diff for the 'towers-sheet' and 'blots-grid' stages (board condition 1; plan WO-003/WO-002).
// `analyseGrid` is self-contained (no closures) so it can be shipped into the page with toString() and run
// on the canvas' own ImageData — no PNG decoding, no dependency.
//
// Method: find the paper colour (histogram mode), mark "ink" pixels (any channel > tol away), split the image
// into row bands then column segments separated by paper gutters. If the expected grid is not found that
// way, fall back to a uniform split of the ink bounding box (reported as method 'uniform').
// Neighbour cells along `pairAxis` are compared centre-aligned; the fraction of differing pixels must be
// ≥ minDiff (2 %). Every cell must also carry ink (≥ minInk of its area).

export function analyseGrid(img, spec) {
  const { data, width: W, height: H } = img;
  const tol = spec.tol ?? 28;
  const minDiff = spec.minDiff ?? 0.02;
  const minInk = spec.minInk ?? 0.01;
  const problems = [];
  // 1. paper colour
  const hist = new Map();
  for (let i = 0; i < W * H; i += 7) {
    const o = i * 4;
    const k = ((data[o] >> 3) << 10) | ((data[o + 1] >> 3) << 5) | (data[o + 2] >> 3);
    hist.set(k, (hist.get(k) ?? 0) + 1);
  }
  let bestK = 0, bestN = -1;
  for (const [k, n] of hist) if (n > bestN) { bestN = n; bestK = k; }
  const bg = [((bestK >> 10) & 31) * 8 + 4, ((bestK >> 5) & 31) * 8 + 4, (bestK & 31) * 8 + 4];
  const ink = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    ink[i] = Math.max(Math.abs(data[o] - bg[0]), Math.abs(data[o + 1] - bg[1]), Math.abs(data[o + 2] - bg[2])) > tol ? 1 : 0;
  }
  const segments = (profile, minCount, mergeGap, minLen) => {
    const runs = [];
    let s = -1;
    for (let i = 0; i <= profile.length; i++) {
      const on = i < profile.length && profile[i] > minCount;
      if (on && s < 0) s = i;
      if (!on && s >= 0) { runs.push([s, i]); s = -1; }
    }
    const merged = [];
    for (const r of runs) {
      const last = merged[merged.length - 1];
      if (last && r[0] - last[1] < mergeGap) last[1] = r[1]; else merged.push([r[0], r[1]]);
    }
    return merged.filter((r) => r[1] - r[0] >= minLen);
  };
  // 2. rows then columns
  const rowProf = new Int32Array(H);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ink[y * W + x]) {
    rowProf[y]++;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const gap = spec.mergeGap ?? 6;
  const bands = segments(rowProf, Math.max(1, W * 0.002), gap, 8).map(([a, b]) => {
    const colProf = new Int32Array(W);
    for (let y = a; y < b; y++) for (let x = 0; x < W; x++) colProf[x] += ink[y * W + x];
    return { y: a, h: b - a, cols: segments(colProf, Math.max(0, (b - a) * 0.002), gap, 6) };
  });
  let layout = null, cells = null, method = 'segmented';
  for (const L of spec.layouts) {
    const fit = bands.filter((b) => b.cols.length === L.cols);
    if (fit.length === L.rows) {
      layout = L;
      cells = fit.map((b) => b.cols.map(([a, e]) => ({ x: a, y: b.y, w: e - a, h: b.h })));
      break;
    }
  }
  if (!cells) {
    layout = spec.layouts[0];
    method = 'uniform';
    problems.push(`no gutter-separated ${layout.cols}×${layout.rows} grid found (bands: ${bands.map((b) => b.cols.length).join(',') || 'none'}); split the ink box uniformly`);
    if (x1 < 0) return { ok: false, method, problems: [...problems, 'image has no ink'], cells: [], pairs: [], bg };
    const cw = (x1 + 1 - x0) / layout.cols, ch = (y1 + 1 - y0) / layout.rows;
    cells = Array.from({ length: layout.rows }, (_, r) => Array.from({ length: layout.cols }, (_, c) => ({
      x: Math.round(x0 + c * cw), y: Math.round(y0 + r * ch), w: Math.floor(cw), h: Math.floor(ch),
    })));
  }
  // 3. ink per cell, neighbour diffs
  for (const row of cells) for (const c of row) {
    let n = 0;
    for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) n += ink[y * W + x];
    c.ink = n / Math.max(1, c.w * c.h);
  }
  const diff = (A, B) => {
    const w = Math.min(A.w, B.w), h = Math.min(A.h, B.h);
    const ax = A.x + ((A.w - w) >> 1), ay = A.y + ((A.h - h) >> 1), bx = B.x + ((B.w - w) >> 1), by = B.y + ((B.h - h) >> 1);
    let d = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = ((ay + y) * W + ax + x) * 4, q = ((by + y) * W + bx + x) * 4;
      if (Math.max(Math.abs(data[p] - data[q]), Math.abs(data[p + 1] - data[q + 1]), Math.abs(data[p + 2] - data[q + 2])) > tol) d++;
    }
    return d / Math.max(1, w * h);
  };
  const pairs = [];
  for (let r = 0; r < cells.length; r++) for (let c = 0; c < cells[r].length; c++) {
    const nb = layout.pairAxis === 'x' ? cells[r][c + 1] : cells[r + 1]?.[c];
    if (nb) pairs.push({ a: [r, c], b: layout.pairAxis === 'x' ? [r, c + 1] : [r + 1, c], diff: diff(cells[r][c], nb) });
  }
  const empty = cells.flat().filter((c) => c.ink < minInk).length;
  if (empty) problems.push(`${empty} cell(s) carry < ${minInk * 100} % ink`);
  const same = pairs.filter((p) => p.diff < minDiff);
  if (same.length) problems.push(`${same.length} neighbour pair(s) differ by < ${minDiff * 100} %: ${same.slice(0, 6).map((p) => `${p.a}↔${p.b} ${(p.diff * 100).toFixed(2)} %`).join('; ')}`);
  const minPair = pairs.reduce((m, p) => Math.min(m, p.diff), Infinity);
  return { ok: empty === 0 && same.length === 0 && pairs.length > 0, method, layout, bg, cells, pairs, minPair, problems };
}

export const GRID_SPECS = {
  // 4 kinds × 12 valid tier combos; neighbours along the combo axis must differ.
  'towers-sheet': { layouts: [{ cols: 12, rows: 4, pairAxis: 'x' }, { cols: 4, rows: 12, pairAxis: 'y' }] },
  // 9 kinds × {plain, Pale} × {normal, colourblind}; neighbours along the kind axis must differ.
  'blots-grid': { layouts: [{ cols: 9, rows: 4, pairAxis: 'x' }, { cols: 4, rows: 9, pairAxis: 'y' }] },
};

/** Synthetic check that the analyser finds a grid, passes distinct cells and catches a duplicate pair. */
export function selfTest() {
  const W = 1280, H = 720;
  const make = (dupe) => {
    const data = new Uint8ClampedArray(W * H * 4);
    let s = 9;
    for (let i = 0; i < W * H; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const g = (s >>> 29) - 4; // paper grain ±4
      data.set([238 + g, 228 + g, 208 + g, 255], i * 4);
    }
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
      const k = dupe && r === 2 && c === 5 ? 4 : c; // cell (2,5) copies (2,4)
      const cx = 53 + c * 106, cy = 90 + r * 180, rad = 14 + k * 2 + r;
      for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
        if (x * x + y * y > rad * rad) continue;
        if (k % 3 === 1 && x > 0 && y > 0) continue; // notch
        data.set([40 + k * 15, 60, 120 - r * 20, 255], ((cy + y) * W + cx + x) * 4);
      }
    }
    return { data, width: W, height: H };
  };
  const good = analyseGrid(make(false), GRID_SPECS['towers-sheet']);
  const bad = analyseGrid(make(true), GRID_SPECS['towers-sheet']);
  const caught = bad.pairs.filter((p) => p.diff < 0.02).map((p) => `${p.a}-${p.b}`);
  return { ok: good.ok && good.method === 'segmented' && !bad.ok && caught.length === 1 && caught[0] === '2,4-2,5', good: good.problems, caught };
}
