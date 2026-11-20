#!/usr/bin/env node
// WO-005 · M-0001 · Scene 4 canvas cost spike (D2).
//
// Run from the repo root:
//   NODE_PATH=/usr/local/lib/node_modules_global node bureau/missions/M-0001-scroll-showcase/evidence/spikes/s4-canvas/spike.cjs
//
// Draws a representative Scene 4 canvas (design/experience.md Scene 4) inline in its own page, drives
// 120 rAF frames per configuration with p and theta changing every frame, and writes results.json,
// results.md and screenshots next to this file. It imports nothing from site/.
'use strict';

const fs = require('fs');
const path = require('path');

const PW_VERSION = '1.63.0';
let pwVersion = null;
try {
  pwVersion = require('playwright/package.json').version;
} catch (err) {
  console.error(`spike: cannot resolve playwright/package.json (${err.message}). Set NODE_PATH=/usr/local/lib/node_modules_global.`);
  process.exit(1);
}
if (pwVersion !== PW_VERSION) {
  console.error(`spike: playwright ${pwVersion} found, ${PW_VERSION} required (architecture A10). Aborting.`);
  process.exit(1);
}
const { chromium } = require('playwright');

const OUT = __dirname;
const FRAMES = 120;   // measured frames per run
const WARMUP = 10;    // discarded frames before measuring (first-draw shader/glyph/alloc costs)
const RUNS = 3;       // fresh page per run; frames are pooled across runs for the percentiles

// Configurations (plan.md WO-005). `cap` is the backing-DPR cap: backing = min(deviceDpr, cap).
// `cadence`: 'scroll' = p and theta change every frame and every frame redraws;
//            'admire30' = p static, breathing theta changes, redraw on every other rAF (D2 level 3).
const CONFIGS = [
  { id: 'c1', name: '1920x1080, device DPR 2, canvas cap 1.5, lattice 72 (spec D2)', vw: 1920, vh: 1080, dpr: 2, cap: 1.5, lattice: 72, colour: 'lut', cadence: 'scroll', d2: 'L0 spec DPR caps' },
  { id: 'c2', name: '1920x1080, device DPR 2, backing DPR 1, lattice 72', vw: 1920, vh: 1080, dpr: 2, cap: 1, lattice: 72, colour: 'lut', cadence: 'scroll', d2: 'reference only (below spec, not a D2 level)' },
  { id: 'c3', name: '1920x1080, device DPR 2, canvas cap 1.5, lattice 80 (pitch +4)', vw: 1920, vh: 1080, dpr: 2, cap: 1.5, lattice: 80, colour: 'lut', cadence: 'scroll', d2: 'L2 pitch +4' },
  { id: 'c4', name: '1440x900, DPR 1.5, lattice 64', vw: 1440, vh: 900, dpr: 1.5, cap: 1.5, lattice: 64, colour: 'lut', cadence: 'scroll', d2: 'reference viewport' },
  { id: 'c5', name: '375x812, DPR 2, lattice 48', vw: 375, vh: 812, dpr: 2, cap: 2, lattice: 48, colour: 'lut', cadence: 'scroll', d2: 'mobile viewport' },
  { id: 'c6', name: 'c1 with per-facet OKLCH conversion (no LUT)', vw: 1920, vh: 1080, dpr: 2, cap: 1.5, lattice: 72, colour: 'oklch', cadence: 'scroll', d2: 'quantifies the LUT order' },
  { id: 'c7', name: 'c3 in admire: p static, breathing theta, redraw at 30 Hz (extra)', vw: 1920, vh: 1080, dpr: 2, cap: 1.5, lattice: 80, colour: 'lut', cadence: 'admire30', d2: 'L3 30 Hz breathing' },
];
// Diagnostics (not D2 levels, not judged by the rule): they explain where c1's cost goes.
//   layers 'ground' = one full-canvas fillRect only (the raster floor of a 4.67 Mpx canvas);
//   layers 'hold'   = spec-faithful frames across the hold, p 0.44 -> 0.56 (facets, edges, white point; no bands, quant 0);
//   wrf             = getContext('2d', { willReadFrequently: true }) in both passes (CPU-backed canvas).
const DIAGS = [
  { id: 'd1', name: 'c1 canvas, ground fill only (raster floor)', vw: 1920, vh: 1080, dpr: 2, cap: 1.5, lattice: 72, colour: 'lut', cadence: 'scroll', layers: 'ground' },
  { id: 'd2', name: 'c1, spec-faithful hold frames (p 0.44 to 0.56)', vw: 1920, vh: 1080, dpr: 2, cap: 1.5, lattice: 72, colour: 'lut', cadence: 'scroll', layers: 'hold' },
  { id: 'd3', name: 'c1 stress, willReadFrequently canvas', vw: 1920, vh: 1080, dpr: 2, cap: 1.5, lattice: 72, colour: 'lut', cadence: 'scroll', wrf: true },
  { id: 'd4', name: 'c2 (backing DPR 1), spec-faithful hold frames', vw: 1920, vh: 1080, dpr: 2, cap: 1, lattice: 72, colour: 'lut', cadence: 'scroll', layers: 'hold' },
];
// Chromium logs this in pass B by design: R8 mandates a getImageData readback every frame.
const EXPECTED_WARNING = /Multiple readback operations using getImageData are faster with the willReadFrequently attribute/;

// ---------------------------------------------------------------------------------------------
// The page-side renderer. Serialised into the page with Function.prototype.toString, so it must be
// self-contained. Formulas follow design/experience.md Scene 4 and §3.5.
function pageMain(cfg, opts) {
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const r = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const glide = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lin = (t) => t;
  const lerp = (a, b, t) => a + (b - a) * t;
  function keys(p, ks) {
    if (p <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) {
      if (p <= ks[i][0]) {
        const e = ks[i][2] || glide;
        return lerp(ks[i - 1][1], ks[i][1], e((p - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])));
      }
    }
    return ks[ks.length - 1][1];
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function oklchToRgb8(L, C, hDeg) {
    const h = (hDeg * Math.PI) / 180;
    const a = C * Math.cos(h), b = C * Math.sin(h);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
    const lin3 = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
    return lin3.map((x) => {
      const c = clamp(x, 0, 1);
      const g = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
      return Math.round(g * 255);
    });
  }
  const entry = (ndl) => oklchToRgb8(clamp(0.5 + 0.28 * ndl, 0.32, 0.82), 0.17, 255 + 150 * ndl);
  const LUT = [];
  for (let i = 0; i < 256; i++) LUT.push(entry(-0.6 + (1.2 * i) / 255));
  const BANDS = ['#F54123', '#F68704', '#F2C50E', '#0BCA86', '#04A7D8', '#2154D8', '#8843DB'].map((hx) => [
    parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16),
  ]);

  const W = cfg.vw, H = cfg.vh;
  const landscape = W / H >= 1;
  const U = landscape ? W : H;
  const vmin = Math.min(W, H) / 100;
  const backing = Math.min(window.devicePixelRatio, cfg.cap);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * backing);
  canvas.height = Math.round(H * backing);
  canvas.style.cssText = `position:fixed;inset:0;width:${W}px;height:${H}px;display:block`;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d', cfg.wrf ? { willReadFrequently: true } : undefined);

  // Lattice: one extra cell beyond the viewport, centred, so ±14 px jitter never exposes the ground.
  const Lp = cfg.lattice;
  const cols = Math.ceil(W / Lp) + 1, rows = Math.ceil(H / Lp) + 1;
  const x0 = (W - cols * Lp) / 2, y0 = (H - rows * Lp) / 2;
  const rnd = mulberry32(0xb3e7);
  const nv = (cols + 1) * (rows + 1);
  const baseX = new Float64Array(nv), baseY = new Float64Array(nv), jx = new Float64Array(nv), jy = new Float64Array(nv);
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    const k = j * (cols + 1) + i;
    baseX[k] = x0 + i * Lp; baseY[k] = y0 + j * Lp;
    jx[k] = (rnd() * 2 - 1) * 14; jy[k] = (rnd() * 2 - 1) * 14;
  }
  // Facets: each square split along its "\" diagonal (top-left to bottom-right).
  const facets = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
    facets.push([a, b, d], [a, d, c]);
  }
  const nF = facets.length;
  const nx = new Float64Array(nF), ny = new Float64Array(nF);
  for (let f = 0; f < nF; f++) {
    const ang = rnd() * Math.PI * 2, mag = rnd() * 0.6;
    nx[f] = Math.cos(ang) * mag; ny[f] = Math.sin(ang) * mag;
  }
  const vx = new Float64Array(nv), vy = new Float64Array(nv);

  function params(p, amb) {
    const J = glide(r(p, 0.08, 0.35)) * (1 - glide(r(p, 0.8, 0.96)));
    const theta = keys(p, [[0.1, 200], [0.44, 268.25], [0.56, 271.75, lin], [0.9, 340]]) + amb;
    return {
      J, theta,
      facetAlpha: glide(r(p, 0.08, 0.38)),
      edgeAlpha: 0.45 * r(p, 0.04, 0.12) * (1 - r(p, 0.8, 0.92)),
      quant: r(p, 0.8, 0.96),
      bandsAlpha: r(p, 0.92, 1),
      rho: glide(r(p, 0, 0.1)),
      wpAlpha: 1 - r(p, 0.88, 0.96),
    };
  }

  // stress: every layer draws every frame (alphas floored), so no frame is cheaper than the worst.
  function draw(p, amb, stress) {
    if (cfg.layers === 'ground') {
      ctx.setTransform(backing, 0, 0, backing, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = (Math.round(p * 1000) & 1) ? '#0C0F1A' : '#0D101B';
      ctx.fillRect(0, 0, W, H);
      return;
    }
    const s = params(p, amb);
    if (stress) {
      s.facetAlpha = Math.max(s.facetAlpha, 0.85);
      s.edgeAlpha = Math.max(s.edgeAlpha, 0.2);
      s.bandsAlpha = Math.max(s.bandsAlpha, 0.25);
      s.quant = Math.max(s.quant, 0.15);
      s.wpAlpha = Math.max(s.wpAlpha, 0.6);
    }
    const th = (s.theta * Math.PI) / 180, cx = Math.cos(th), sy = Math.sin(th);
    ctx.setTransform(backing, 0, 0, backing, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0C0F1A';
    ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < nv; k++) { vx[k] = baseX[k] + jx[k] * s.J; vy[k] = baseY[k] + jy[k] * s.J; }

    // Facets: filled path plus a 0.5 px same-colour stroke so shared edges never seam.
    ctx.globalAlpha = s.facetAlpha;
    ctx.lineWidth = 0.5;
    ctx.lineJoin = 'round';
    for (let f = 0; f < nF; f++) {
      const t = facets[f];
      const ndl = s.J * (nx[f] * cx + ny[f] * sy);
      let rgb;
      if (cfg.colour === 'lut') {
        rgb = LUT[Math.round(((clamp(ndl, -0.6, 0.6) + 0.6) / 1.2) * 255)];
      } else {
        rgb = entry(clamp(ndl, -0.6, 0.6));
      }
      let R = rgb[0], G = rgb[1], B = rgb[2];
      if (s.quant > 0) {
        const cu = landscape ? (vx[t[0]] + vx[t[1]] + vx[t[2]]) / 3 : (vy[t[0]] + vy[t[1]] + vy[t[2]]) / 3;
        const band = BANDS[clamp(Math.floor((cu / U) * 7), 0, 6)];
        R = Math.round(lerp(R, band[0], s.quant)); G = Math.round(lerp(G, band[1], s.quant)); B = Math.round(lerp(B, band[2], s.quant));
      }
      const col = `rgb(${R},${G},${B})`;
      ctx.beginPath();
      ctx.moveTo(vx[t[0]], vy[t[0]]); ctx.lineTo(vx[t[1]], vy[t[1]]); ctx.lineTo(vx[t[2]], vy[t[2]]);
      ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = col; ctx.stroke();
    }

    // 1 px white lattice edges, one path, one stroke.
    if (s.edgeAlpha > 0) {
      ctx.globalAlpha = s.edgeAlpha;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
        const a = j * (cols + 1) + i;
        if (i < cols) { ctx.moveTo(vx[a], vy[a]); ctx.lineTo(vx[a + 1], vy[a + 1]); }
        if (j < rows) { ctx.moveTo(vx[a], vy[a]); ctx.lineTo(vx[a + cols + 1], vy[a + cols + 1]); }
        if (i < cols && j < rows) { ctx.moveTo(vx[a], vy[a]); ctx.lineTo(vx[a + cols + 2], vy[a + cols + 2]); }
      }
      ctx.stroke();
    }

    // Seven exact bands over the mosaic (shared Bands geometry: equal, cumulative, snapped edges).
    if (s.bandsAlpha > 0) {
      ctx.globalAlpha = s.bandsAlpha;
      let prev = 0;
      for (let b = 0; b < 7; b++) {
        const edge = Math.round((((b + 1) * U) / 7) * backing) / backing;
        ctx.fillStyle = `rgb(${BANDS[b][0]},${BANDS[b][1]},${BANDS[b][2]})`;
        if (landscape) ctx.fillRect(prev, 0, edge - prev, H); else ctx.fillRect(0, prev, W, edge - prev);
        prev = edge;
      }
    }

    // White point: the light, at rho * 38 vmin from the centre along theta.
    if (s.wpAlpha > 0) {
      const px = W / 2 + Math.cos(th) * s.rho * 38 * vmin, py = H / 2 + Math.sin(th) * s.rho * 38 * vmin;
      const rad = 7 * vmin;
      const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = s.wpAlpha;
      ctx.fillStyle = g;
      ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
    ctx.globalAlpha = 1;
  }

  // One run: WARMUP + FRAMES rAF callbacks. In 'scroll' cadence p sweeps 0.25 -> 0.92 (entry,
  // hold, warm-cool split, quantise start) and breathing theta moves too, so p and theta change
  // every frame. In 'admire30', p holds at 0.5 and only breathing theta moves; draws every other rAF.
  function run(flush) {
    return new Promise((resolve) => {
      const total = opts.warmup + opts.frames;
      const delta = [], drawMs = [], flushedMs = [];
      let i = 0, prev = null;
      function frame(ts) {
        const m = i - opts.warmup;
        const q = clamp(i / (total - 1), 0, 1);
        const p = cfg.cadence === 'admire30' ? 0.5 : cfg.layers === 'hold' ? 0.44 + 0.12 * q : 0.25 + 0.67 * q;
        // ±6° breathing amplitude (spec), period compressed to 120 frames so θ moves on every frame.
        const amb = 6 * Math.sin((2 * Math.PI * i) / 120);
        const shouldDraw = cfg.cadence === 'admire30' ? i % 2 === 0 : true;
        let d = null, df = null;
        if (shouldDraw) {
          const t0 = performance.now();
          draw(p, amb, cfg.layers !== 'hold');
          const t1 = performance.now();
          d = t1 - t0;
          if (flush) { ctx.getImageData(0, 0, 1, 1); df = performance.now() - t0; }
        }
        if (m >= 0) {
          if (prev !== null) delta.push(ts - prev);
          if (d !== null) drawMs.push(d);
          if (df !== null) flushedMs.push(df);
        }
        prev = ts;
        i++;
        if (i < total) requestAnimationFrame(frame);
        else resolve({ delta, drawMs, flushedMs });
      }
      requestAnimationFrame(frame);
    });
  }

  window.__spike = {
    info: { facets: nF, cols, rows, backing, backingW: canvas.width, backingH: canvas.height, mpx: (canvas.width * canvas.height) / 1e6, lutEntries: LUT.length, ua: navigator.userAgent },
    run,
    still(p) { draw(p, 0, false); },
    lutSpan() { // hue span actually reachable: J <= 1 so |n·L| <= 0.6
      return { hueMin: 255 - 150 * 0.6, hueMax: 255 + 150 * 0.6 };
    },
  };
}

// ---------------------------------------------------------------------------------------------
function pct(arr, q) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))];
}
function stats(arr) {
  const r2 = (x) => (x === null ? null : Math.round(x * 100) / 100);
  return {
    n: arr.length,
    p50: r2(pct(arr, 0.5)),
    p95: r2(pct(arr, 0.95)),
    max: r2(arr.length ? Math.max(...arr) : null),
    over20: arr.length ? Math.round((arr.filter((x) => x > 20).length / arr.length) * 1000) / 10 : null,
  };
}

async function onePage(browser, cfg, flush) {
  const context = await browser.newContext({ viewport: { width: cfg.vw, height: cfg.vh }, deviceScaleFactor: cfg.dpr });
  const page = await context.newPage();
  const errors = [];
  const expected = [];
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const line = `${m.type()}: ${m.text()}`;
    if (flush && m.type() === 'warning' && EXPECTED_WARNING.test(m.text())) expected.push(line); else errors.push(line);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#0C0F1A;overflow:hidden}</style></head><body></body></html>');
  await page.evaluate(`(${pageMain.toString()})(${JSON.stringify(cfg)}, ${JSON.stringify({ frames: FRAMES, warmup: WARMUP })})`);
  const info = await page.evaluate(() => window.__spike.info);
  const res = await page.evaluate((f) => window.__spike.run(f), flush);
  return { context, page, info, res, errors, expected };
}

async function main() {
  const browser = await chromium.launch();
  const version = browser.version();
  const results = { spike: 'WO-005', mission: 'M-0001', date: new Date().toISOString(), playwright: pwVersion, chromium: version, frames: FRAMES, warmup: WARMUP, runs: RUNS, configs: [] };
  console.log(`playwright ${pwVersion} · chromium ${version} · ${FRAMES} frames x ${RUNS} runs per pass (+${WARMUP} warm-up)`);

  for (const cfg of [...CONFIGS, ...DIAGS.map((d) => ({ ...d, diag: true }))]) {
    const pooled = { delta: [], drawMs: [], flushDelta: [], flushDraw: [], flushedMs: [] };
    const perRun = [];
    let info = null;
    const errors = [], expected = [];
    for (let run = 0; run < RUNS; run++) {
      // Pass A: production-like loop, no readback. rAF delta + unflushed draw.
      const a = await onePage(browser, cfg, false);
      info = a.info; errors.push(...a.errors);
      if (run === RUNS - 1) {
        await a.page.screenshot({ path: path.join(OUT, `${cfg.id}-stress.png`), scale: 'css' });
        await a.page.evaluate(() => window.__spike.still(0.5));
        await a.page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        await a.page.screenshot({ path: path.join(OUT, `${cfg.id}-hold.png`), scale: 'css' });
      }
      await a.context.close();
      // Pass B: fresh page, draw then getImageData(0,0,1,1) to force deferred raster (R8).
      const b = await onePage(browser, cfg, true);
      errors.push(...b.errors); expected.push(...b.expected);
      await b.context.close();
      pooled.delta.push(...a.res.delta); pooled.drawMs.push(...a.res.drawMs);
      pooled.flushDelta.push(...b.res.delta); pooled.flushDraw.push(...b.res.drawMs); pooled.flushedMs.push(...b.res.flushedMs);
      perRun.push({ run, rafP95: stats(a.res.delta).p95, drawP95: stats(a.res.drawMs).p95, flushedP95: stats(b.res.flushedMs).p95 });
    }
    const entry = {
      ...cfg, info,
      raf: stats(pooled.delta),
      drawUnflushed: stats(pooled.drawMs),
      rafWithReadback: stats(pooled.flushDelta),
      drawUnflushedReadbackPass: stats(pooled.flushDraw),
      drawFlushed: stats(pooled.flushedMs),
      perRun,
      consoleErrors: errors,
      expectedReadbackWarnings: expected.length,
      screenshots: [`${cfg.id}-hold.png`, `${cfg.id}-stress.png`],
    };
    entry.passes = entry.raf.p95 <= 20 && entry.drawFlushed.p95 <= 6;
    results.configs.push(entry);
    console.log(`${cfg.id} ${cfg.name}\n   facets ${info.facets} · backing ${info.backingW}x${info.backingH} (${info.mpx.toFixed(2)} Mpx)` +
      `\n   rAF delta p50 ${entry.raf.p50} p95 ${entry.raf.p95} >20ms ${entry.raf.over20}%` +
      ` | draw unflushed p50 ${entry.drawUnflushed.p50} p95 ${entry.drawUnflushed.p95}` +
      ` | draw FLUSHED p50 ${entry.drawFlushed.p50} p95 ${entry.drawFlushed.p95}` +
      ` | rAF with readback p95 ${entry.rafWithReadback.p95}` +
      ` | errors ${errors.length} (expected readback warnings ${expected.length})` + (cfg.diag ? ' | diagnostic' : ` | rule ${entry.passes ? 'PASS' : 'fail'}`));
  }
  await browser.close();

  // Decision rule (results.md). D2 order at 1920: L0 spec caps (c1) -> L1 DPR 1.5 everywhere
  // (identical to c1 at 1920, whose cap is already 1.5) -> L2 pitch +4 (c3) -> L3 30 Hz breathing (c7).
  const by = Object.fromEntries(results.configs.map((c) => [c.id, c]));
  const order = [
    { level: 'L0 spec DPR caps', id: 'c1' },
    { level: 'L1 DPR 1.5 everywhere', id: 'c1', note: 'at 1920 the spec cap is already 1.5, so L1 is the same canvas as c1' },
    { level: 'L2 pitch +4 (lattice 80)', id: 'c3' },
    { level: 'L3 redraw on p change, breathing at <= 30 Hz', id: 'c7', note: 'admire only; does not reduce cost while scrolling' },
  ];
  let chosen = null;
  for (const o of order) { if (by[o.id].passes) { chosen = o; break; } }
  results.decision = chosen
    ? { adopted: chosen.level, config: chosen.id, blocked: false }
    : { adopted: null, config: null, blocked: true };
  results.lutSaving = {
    drawUnflushedP50: { lut: by.c1.drawUnflushed.p50, oklch: by.c6.drawUnflushed.p50 },
    drawFlushedP95: { lut: by.c1.drawFlushed.p95, oklch: by.c6.drawFlushed.p95 },
  };
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'results.md'), renderMd(results, order));
  console.log(`DECISION: ${results.decision.blocked ? 'BLOCKED: no D2 level passes at 1920' : `${results.decision.adopted} (${results.decision.config})`}`);
  const errCount = results.configs.reduce((n, c) => n + c.consoleErrors.length, 0);
  const expCount = results.configs.reduce((n, c) => n + c.expectedReadbackWarnings, 0);
  console.log(`unexpected console errors/warnings across all pages: ${errCount} · expected readback warnings (pass B only): ${expCount}`);
  console.log(`wrote ${path.relative(process.cwd(), path.join(OUT, 'results.json'))} and results.md`);
}

function renderMd(R, order) {
  const by = Object.fromEntries(R.configs.map((c) => [c.id, c]));
  const L = [];
  L.push('# WO-005 · Scene 4 canvas cost spike: results');
  L.push('');
  L.push(`Generated by \`spike.cjs\` on ${R.date}. Playwright ${R.playwright}, headless Chromium ${R.chromium}. ` +
    `${R.frames} measured rAF frames per pass, ${R.warmup} warm-up frames discarded, ${R.runs} runs per configuration on fresh pages; ` +
    'percentiles are over the frames of all runs pooled (nearest rank). Times in ms.');
  L.push('');
  L.push('## What was drawn');
  L.push('A self-contained Scene 4 canvas in its own page (no `site/` code): ink ground; a mulberry32-seeded (`0xB3E7`) jittered lattice ' +
    '(±14 px · J), each square split on its "\\" diagonal into two triangles, each drawn as its own filled path plus a 0.5 px same-colour ' +
    'stroke; colour from a 256-entry OKLCH → sRGB LUT indexed by n·L (c6: converted per facet per frame instead), lerped toward the band ' +
    'token of its centroid by `quant`; one path of 1 px white lattice edges; the seven-band overlay; and the white point as a radial gradient. ' +
    'Parameters follow the experience spec formulas, but the measured frames are a **stress superset**: every layer draws every frame ' +
    '(facet alpha ≥ 0.85, edge alpha ≥ 0.2, bands ≥ 0.25, quant ≥ 0.15), so no measured frame is cheaper than a real worst frame. ' +
    'In scroll cadence p sweeps 0.25 → 0.92 over the run and θ also carries a breathing offset, so p and θ change every frame.');
  L.push('');
  L.push('Two passes per run, each on a fresh page, because a readback every frame changes what the browser does with the canvas:');
  L.push('- **Pass A (rAF)** is the production-like loop: draw in the rAF callback, no readback. It gives the rAF-delta numbers and the *unflushed* draw time (JS plus command recording; raster is deferred).');
  L.push('- **Pass B (flushed, R8)** times `performance.now()` around the draw calls **followed by `ctx.getImageData(0,0,1,1)`**, which forces the deferred rasterisation to finish inside the timed span.');
  L.push('');
  L.push('## Results');
  L.push('| id | configuration | facets | backing px (Mpx) | rAF p50 | rAF p95 | rAF > 20 ms | draw unflushed p50 / p95 | **draw flushed p50 / p95** | rAF p95 with readback | rule |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|');
  const main = R.configs.filter((c) => !c.diag), diags = R.configs.filter((c) => c.diag);
  for (const c of main) {
    L.push(`| ${c.id} | ${c.name} | ${c.info.facets} | ${c.info.backingW}×${c.info.backingH} (${c.info.mpx.toFixed(2)}) | ${c.raf.p50} | ${c.raf.p95} | ${c.raf.over20}% | ${c.drawUnflushed.p50} / ${c.drawUnflushed.p95} | **${c.drawFlushed.p50} / ${c.drawFlushed.p95}** | ${c.rafWithReadback.p95} | ${c.passes ? 'pass' : 'fail'} |`);
  }
  L.push('');
  L.push('Per-run p95 (rAF / unflushed draw / flushed draw), to show run-to-run noise:');
  L.push('');
  for (const c of main) L.push(`- ${c.id}: ` + c.perRun.map((r) => `${r.rafP95} / ${r.drawP95} / ${r.flushedP95}`).join(' · '));
  L.push('');
  L.push('Draw-sample counts: c7 draws on every other rAF, so its draw percentiles cover ' + by.c7.drawFlushed.n + ' draws, against ' + by.c1.drawFlushed.n + ' for the others.');
  L.push('');
  L.push('## Diagnostics (not D2 levels; they explain where the cost goes)');
  L.push('| id | what | backing Mpx | rAF p50 / p95 | rAF > 20 ms | draw unflushed p50 / p95 | draw flushed p50 / p95 | flushed p50 as % of c1 |');
  L.push('|---|---|---|---|---|---|---|---|');
  for (const c of diags) {
    L.push(`| ${c.id} | ${c.name} | ${c.info.mpx.toFixed(2)} | ${c.raf.p50} / ${c.raf.p95} | ${c.raf.over20}% | ${c.drawUnflushed.p50} / ${c.drawUnflushed.p95} | ${c.drawFlushed.p50} / ${c.drawFlushed.p95} | ${Math.round((c.drawFlushed.p50 / by.c1.drawFlushed.p50) * 100)}% |`);
  }
  L.push('');
  L.push(`Flushed cost per backing megapixel, spec-faithful hold frames: d2 ${(by.d2.drawFlushed.p50 / by.d2.info.mpx).toFixed(2)} ms/Mpx at 4.67 Mpx, d4 ${(by.d4.drawFlushed.p50 / by.d4.info.mpx).toFixed(2)} ms/Mpx at 2.07 Mpx. ` +
    `A single full-canvas fill at 4.67 Mpx (d1) already costs ${by.d1.drawFlushed.p50} ms flushed (p95 ${by.d1.drawFlushed.p95}).`);
  L.push('');
  L.push('## Console');
  const unexpected = R.configs.reduce((n, c) => n + c.consoleErrors.length, 0);
  const exp = R.configs.reduce((n, c) => n + c.expectedReadbackWarnings, 0);
  L.push(`Unexpected console errors or warnings across every page: **${unexpected}**. Expected: ${exp} instances (one per pass-B page) of Chromium\'s ` +
    '"Multiple readback operations using getImageData are faster with the willReadFrequently attribute" warning, which the R8 flush method ' +
    '(a readback every frame) provokes by design; pass A, the production-like loop, never logs it. The product will not read back per frame, so it will not log it either.');
  L.push('');
  L.push('## LUT versus per-facet OKLCH (c1 against c6)');
  L.push(`Unflushed draw p50 ${by.c1.drawUnflushed.p50} (LUT) against ${by.c6.drawUnflushed.p50} (per facet); flushed draw p95 ${by.c1.drawFlushed.p95} against ${by.c6.drawFlushed.p95}. ` +
    'The difference is JS only (the raster work is identical), so it shows up in the unflushed column.');
  L.push('');
  L.push('## Decision rule');
  L.push('Adopt the **first** configuration in D2 order whose 1920 rAF p95 is ≤ 20 ms **and** whose flushed draw p95 is ≤ 6 ms. ' +
    'If none qualifies, file a BLOCKED request to the CEO with the numbers. The order at 1920:');
  L.push('');
  for (const o of order) {
    const c = by[o.id];
    L.push(`1. **${o.level}** → ${o.id}: rAF p95 ${c.raf.p95}, flushed draw p95 ${c.drawFlushed.p95} → ${c.passes ? 'qualifies' : 'does not qualify'}${o.note ? ` (${o.note})` : ''}`);
  }
  L.push('');
  L.push(R.decision.blocked
    ? '**Outcome: no D2 level qualifies at 1920. This is a BLOCKED request to the CEO with the numbers above.**'
    : `**Outcome: adopt ${R.decision.adopted} (${R.decision.config}).**`);
  L.push('');
  L.push('c2 (backing DPR 1) is not a D2 level: it is below the spec\'s DPR floor and is measured only to show how cost scales with backing pixels. ' +
    'c4 and c5 are the other viewports, recorded for context; the rule is judged at 1920.');
  L.push('');
  L.push('## What these numbers measure and do not');
  L.push('They come from Playwright\'s headless Chromium shell in a 4-CPU container with no GPU. Canvas 2D is rasterised by **SwiftShader**, a ' +
    'software rasteriser, and there is no real compositor or display: rAF deltas are the headless shell\'s frame scheduling, not a monitor\'s ' +
    'refresh, and a delta of about 16.7 ms means "kept up with the 60 Hz begin-frame clock", nothing more. The flushed draw time includes the ' +
    'synchronous readback of one pixel, so it slightly over-counts raster cost; the unflushed time under-counts it, because raster happens ' +
    'later off the timed span. A readback every frame can make Chromium move the canvas off its accelerated path, which is why rAF deltas ' +
    'come from a separate pass without readback. Real GPUs rasterise filled triangles far faster than SwiftShader, and laptop CPUs differ ' +
    'from this container, so use these numbers **only as relative costs between configurations** and as a conservative floor. ' +
    'They are **not** a frame-rate claim for any real device, and nothing here supports a "60 fps" statement.');
  L.push('');
  return L.join('\n') + '\n';
}

main().catch((err) => { console.error(err); process.exit(1); });
