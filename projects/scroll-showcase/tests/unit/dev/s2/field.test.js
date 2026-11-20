// Dev tests for Scene 2 *Field* (WO-008): the pure state(p, vp). The spec
// suite (U-3, U-5, E-H0, seam gates) lives in tests/unit/spec and is written
// independently of this file.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as s2 from '../../../../site/js/scenes/s2-field.js';
import { SCENES, viewport, bandRects, dotGrid } from '../../../../site/js/core/geometry.js';
import { TOKENS } from '../../../../site/js/core/tokens.js';
import { placardPhrase } from '../../../../site/js/core/phrases.js';

const { state, meta } = s2;

/** The five §11.1 reference viewports. */
const SIZES = /** @type {const} */ ([[375, 812], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]);
const DPRS = [1, 1.5, 2];
const REF = viewport(1440, 900, 1);
const PARAM_NAMES = ['A', 'c', 'shear', 'vertexInk', 'fillInk', 'white', 'whitePoint', 'fade'];
const EPS = 1e-6;
/** Band luminances in order (vermilion … violet), from the token mirror. */
const BAND_Y = [1, 2, 3, 4, 5, 6, 7].map((i) => TOKENS[`band-${i}`].Y);

/** Sample p over [a, b] at step dp (inclusive of both ends). */
function samples(a, b, dp) {
  const out = [];
  const n = Math.round((b - a) / dp);
  for (let i = 0; i <= n; i++) out.push(a + ((b - a) * i) / n);
  return out;
}

/** Fails on any −0, non-finite number or non-JSON value anywhere in v. */
function assertJsonClean(v, path = 'state') {
  if (typeof v === 'number') {
    assert.ok(Number.isFinite(v), `${path} is not finite`);
    assert.ok(!Object.is(v, -0), `${path} is −0`);
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => assertJsonClean(x, `${path}[${i}]`));
  } else if (v !== null && typeof v === 'object') {
    assert.equal(Object.getPrototypeOf(v), Object.prototype, `${path} is a plain object`);
    for (const [k, x] of Object.entries(v)) assertJsonClean(x, `${path}.${k}`);
  } else {
    assert.ok(['string', 'boolean'].includes(typeof v) || v === null, `${path} has type ${typeof v}`);
  }
}

/** Frame-mean luminance of the unsheared area model (§4 "Luminance profile"). */
function meanY(s) {
  const widths = /** @type {number[]} */ (s.widths);
  return widths.reduce((sum, w, i) => sum + w * BAND_Y[i], 0);
}

/** Direction reversals of a series with hysteresis h (§10.1 rule 2). */
function reversals(series, h) {
  let dir = 0;
  let extreme = series[0];
  let count = 0;
  for (const y of series) {
    if (dir >= 0 && y > extreme) extreme = y;
    else if (dir <= 0 && y < extreme) extreme = y;
    if (dir >= 0 && extreme - y >= h) {
      if (dir === 1) count++;
      dir = -1;
      extreme = y;
    } else if (dir <= 0 && y - extreme >= h) {
      if (dir === -1) count++;
      dir = 1;
      extreme = y;
    }
  }
  return count;
}

test('WO-008 · meta is SCENES[1]: 300 svh, hold [.722, .781], creep c', () => {
  assert.deepEqual(meta, SCENES[1]);
  assert.equal(meta.track, 300);
  assert.deepEqual(meta.hold, [0.722, 0.781]);
  assert.equal(meta.creep, 'c');
});

test('WO-008 · params are exactly the C1 names; derived widths[7] and the seam geometry are present', () => {
  const s = state(0.4, REF);
  assert.deepEqual(Object.keys(s.params).sort(), [...PARAM_NAMES].sort());
  assert.equal(s.scene, 2);
  assert.equal(/** @type {number[]} */ (s.widths).length, 7);
  assert.equal(s.geom.bandRects.length, 7);
  assert.ok(s.geom.dotGrid);
  assert.ok(s.geom.whitePoint);
  assert.equal(s.geom.shelf, null);
  assert.equal(s.geom.channelScales, null);
  assert.equal(s.geom.beamRect, null);
  assert.equal(s.geom.glassAlpha, 0);
  assert.equal(s.geom.otherOpacity, 0);
});

test('WO-008 · state is pure, JSON-clean and never −0 at 401 p values × five viewports × three DPRs', () => {
  for (const [w, h] of SIZES) {
    for (const dpr of DPRS) {
      const vp = Object.freeze(viewport(w, h, dpr));
      for (const p of samples(0, 1, 1 / 400)) {
        const a = state(p, vp);
        assertJsonClean(a, `state(${p})`);
        assert.deepEqual(state(p, vp), a, `state(${p}) repeats`);
        assert.deepEqual(JSON.parse(JSON.stringify(a)), a, `state(${p}) survives JSON`);
      }
    }
  }
});

test('WO-008 · §15.2 Scene 2 row, state(0): A 0, c 0, shear 0, widths 1/7, every tone 0, white point 0', () => {
  for (const [w, h] of SIZES) {
    const vp = viewport(w, h, 1);
    const { params, widths, geom } = state(0, vp);
    assert.deepEqual(params, { A: 0, c: 0, shear: 0, vertexInk: 0, fillInk: 0, white: 0, whitePoint: 0, fade: 1 });
    assert.ok(!Object.is(params.shear, -0), 'shear is +0, not −0');
    for (const x of /** @type {number[]} */ (widths)) assert.equal(x, 1 / 7);
    assert.equal(geom.ground, 'bands');
    assert.equal(geom.whitePoint.alpha, 0);
    assert.equal(geom.whitePoint.r, 3);
    for (const k of ['vertexWhite', 'fillWhite', 'vertexInk', 'fillInk']) assert.equal(geom.dotGrid[k], 0, k);
  }
});

test('WO-008 · §15.2 Scene 2 row, state(1): A 1, c 5, shear 0, widths [0,0,0,0,0,1,0], white .55, white point {U/2, V/2, 3, 1}', () => {
  for (const [w, h] of SIZES) {
    const vp = viewport(w, h, 1);
    const { params, widths, geom } = state(1, vp);
    assert.deepEqual(params, { A: 1, c: 5, shear: 0, vertexInk: 0, fillInk: 0, white: 0.55, whitePoint: 1, fade: 0 });
    assert.ok(!Object.is(params.shear, -0), 'shear is +0, not −0');
    assert.deepEqual(widths, [0, 0, 0, 0, 0, 1, 0]);
    assert.deepEqual(geom.whitePoint, { u: vp.U / 2, v: vp.V / 2, r: 3, alpha: 1 });
  }
});

test('WO-008 · 1 → 2 seam fields: state(0).bandRects = bandRects(vp) and nothing else is visible, at 5 viewports × 3 DPRs', () => {
  for (const [w, h] of SIZES) {
    for (const dpr of DPRS) {
      const vp = viewport(w, h, dpr);
      const { geom } = state(0, vp);
      assert.deepEqual(geom.bandRects, bandRects(vp), `${w}×${h}@${dpr}`);
      assert.equal(geom.otherOpacity, 0);
      assert.equal(geom.whitePoint.alpha, 0);
    }
  }
});

test('WO-008 · 2 → 3 seam fields: state(1) is a cobalt ground with the white grid at .55, no ink, centre dot at 100%', () => {
  for (const [w, h] of SIZES) {
    for (const dpr of DPRS) {
      const vp = viewport(w, h, dpr);
      const { geom } = state(1, vp);
      assert.equal(geom.ground, 'cobalt');
      assert.deepEqual(geom.dotGrid, { ...dotGrid(vp), vertexWhite: 0.55, fillWhite: 0.55, vertexInk: 0, fillInk: 0 });
      assert.deepEqual(geom.bandRects[5], { u0: 0, u1: vp.U, v0: 0, v1: vp.V }, 'cobalt covers U × V');
      // The white point sits on the grid's centre vertex dot (§3.4).
      assert.equal((geom.whitePoint.u - geom.dotGrid.originU) % (2 * vp.pitch), 0);
      assert.equal((geom.whitePoint.v - geom.dotGrid.originV) % (2 * vp.pitch), 0);
    }
  }
});

test('WO-008 · ground turns cobalt exactly when the fade completes (p ≥ .97), and is bands before', () => {
  for (const p of samples(0, 1, 1 / 1000)) {
    const s = state(p, REF);
    assert.equal(s.geom.ground, s.params.fade === 0 ? 'cobalt' : 'bands', `p ${p}`);
    if (s.geom.ground === 'cobalt') assert.equal(s.params.shear, 0, 'never a sheared cobalt ground');
  }
  assert.equal(state(0.969, REF).geom.ground, 'bands');
  assert.equal(state(0.97, REF).geom.ground, 'cobalt');
});

test('WO-008 · U-5 cursor schedule: 5 steps of .168 from .05 to .89, c = k at each step start, plateau creep +.06', () => {
  const c = (/** @type {number} */ p) => state(p, REF).params.c;
  assert.equal(c(0), 0);
  assert.equal(c(0.05), 0);
  assert.equal(c(0.89), 5);
  assert.equal(c(1), 5);
  for (let k = 0; k < 5; k++) {
    const start = 0.05 + 0.168 * k;
    assert.ok(Math.abs(c(start) - k) < EPS, `c(${start}) = ${k}`);
    // Plateau: the first 35% of the step (17.6 svh of 50.4) rises linearly by 0.06.
    const plateauEnd = start + 0.35 * 0.168;
    assert.ok(Math.abs(c(plateauEnd) - (k + 0.06)) < EPS, `plateau end of step ${k}`);
    const mid = start + 0.175 * 0.168;
    assert.ok(Math.abs(c(mid) - (k + 0.03)) < EPS, `plateau is linear in step ${k}`);
  }
  // Each step's moving change is 32.8 svh at 300 svh: 0.65 · 0.168 · 300.
  assert.ok(Math.abs(0.65 * 0.168 * 300 - 32.76) < 0.01);
  assert.ok(Math.abs(0.35 * 0.168 * 300 - 17.64) < 0.01);
});

test('WO-008 · cursor is continuous and monotone non-decreasing (Δp = 1/40000)', () => {
  let prev = state(0, REF).params.c;
  let maxJump = 0;
  for (const p of samples(0, 1, 1 / 40000)) {
    const x = state(p, REF).params.c;
    assert.ok(x >= prev - 1e-12, `c falls at p ${p}`);
    maxJump = Math.max(maxJump, x - prev);
    prev = x;
  }
  // Steepest slope is 0.94 · 1.5 / (0.65 · 0.168) ≈ 12.9 per unit p, i.e. ≈ 3.3e-4 per sample.
  assert.ok(maxJump < 5e-4, `max jump ${maxJump}`);
});

test('WO-008 · U-5 phrase boundaries .161 .329 .497 .665 .833 are where c crosses k + .5, and the dominant band changes there', () => {
  const boundaries = [0.161, 0.329, 0.497, 0.665, 0.833];
  boundaries.forEach((b, k) => {
    // Bisect for the exact crossing.
    let lo = 0.05 + 0.168 * k;
    let hi = lo + 0.168;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (state(mid, REF).params.c < k + 0.5) lo = mid;
      else hi = mid;
    }
    assert.ok(Math.abs(lo - b) < 5e-4, `crossing ${k} at ${lo.toFixed(5)}, boundary ${b}`);
    const dominant = (/** @type {number} */ p) => {
      const w = /** @type {number[]} */ (state(p, REF).widths);
      return w.indexOf(Math.max(...w));
    };
    assert.equal(dominant(b - 0.002), k, `before ${b} the dominant band is ${k}`);
    assert.equal(dominant(b + 0.002), k + 1, `after ${b} the dominant band is ${k + 1}`);
    // The placard (WO-003) changes phrase at the same p.
    assert.equal(placardPhrase(2, b).index, placardPhrase(2, b - 0.001).index + 1);
  });
});

test('WO-008 · width model: widths sum to 1, dominant peaks at 63% of U, vermilion never above 63.4%', () => {
  let peak = 0;
  let vermilion = 0;
  for (const p of samples(0, 0.86, 1 / 4000)) {
    const w = /** @type {number[]} */ (state(p, REF).widths);
    assert.ok(Math.abs(w.reduce((a, b) => a + b, 0) - 1) < 1e-12, `Σ widths at ${p}`);
    peak = Math.max(peak, ...w);
    vermilion = Math.max(vermilion, w[0]);
  }
  assert.ok(Math.abs(peak - 0.63) < 0.005, `dominant peak ${peak}`);
  assert.ok(vermilion <= 0.634 && vermilion < 0.7, `vermilion share ${vermilion} (cap 0.70, §10.1 rule 4)`);
});

test('WO-008 · bandRects come from the widths, gapless and snapped at every DPR', () => {
  for (const [w, h] of SIZES) {
    for (const dpr of DPRS) {
      const vp = viewport(w, h, dpr);
      for (const p of samples(0, 1, 1 / 50)) {
        const { geom, widths } = state(p, vp);
        const rects = geom.bandRects;
        assert.equal(rects[0].u0, 0);
        assert.equal(rects[6].u1, vp.U);
        for (let i = 0; i < 7; i++) {
          if (i > 0) assert.equal(rects[i].u0, rects[i - 1].u1, 'shared edge');
          assert.ok(rects[i].u1 >= rects[i].u0);
          assert.deepEqual([rects[i].v0, rects[i].v1], [0, vp.V]);
          // Within one device px of the unsnapped width (each edge rounds by ≤ ½ device px).
          const ideal = /** @type {number[]} */ (widths)[i] * vp.U;
          assert.ok(Math.abs(rects[i].u1 - rects[i].u0 - ideal) <= 1 / dpr + 1e-9, `band ${i} at p ${p}`);
        }
      }
    }
  }
});

test('WO-008 · §4 parameter curves at their documented keys', () => {
  const at = (/** @type {number} */ p) => state(p, REF).params;
  assert.equal(at(0.1).A, 1);
  assert.equal(at(0.05).A, 0.5);
  assert.ok(Math.abs(at(0.15).shear - -18) < EPS);
  assert.ok(Math.abs(at(0.8).shear - -18) < EPS);
  assert.equal(at(0.95).shear, 0);
  assert.ok(Math.abs(at(0.7).vertexInk - 0.08) < EPS);
  assert.ok(Math.abs(at(0.9).vertexInk - 0.08) < EPS);
  assert.ok(Math.abs(at(0.9).fillInk - 0.08) < EPS);
  assert.equal(at(0.45).vertexInk, 0);
  assert.equal(at(0.8).fillInk, 0);
  assert.equal(at(0.9).white, 0);
  assert.ok(Math.abs(at(0.95).white - 0.275) < EPS);
  assert.equal(at(0.02).whitePoint, 0);
  assert.equal(at(0.1).whitePoint, 1);
  assert.equal(at(0.86).fade, 1);
  assert.equal(at(0.97).fade, 0);
});

test('WO-008 · §4 frame table: p .25 tangerine ≈62%, p .5 saffron + jade ≈75%, p .75 azure dominant (c 4.03)', () => {
  const w = (/** @type {number} */ p) => /** @type {number[]} */ (state(p, REF).widths);
  assert.ok(Math.abs(state(0.25, REF).params.c - 1.03) < 0.005);
  assert.ok(Math.abs(w(0.25)[1] - 0.62) < 0.01, `tangerine ${w(0.25)[1]}`);
  assert.ok(Math.abs(state(0.5, REF).params.c - 2.54) < 0.005);
  assert.ok(Math.abs(w(0.5)[2] + w(0.5)[3] - 0.75) < 0.02, `saffron + jade ${w(0.5)[2] + w(0.5)[3]}`);
  assert.ok(Math.abs(state(0.75, REF).params.c - 4.03) < 0.005);
  assert.equal(w(0.75).indexOf(Math.max(...w(0.75))), 4, 'azure dominates');
});

test('WO-008 · E-H0 rules 1–3 in the hold band: every param ≤ 25% of its average rate; c creeps +.06; band ≤ 45 svh', () => {
  const [a, b] = meta.hold;
  const dp = 1 / 4000;
  const all = samples(0, 1, dp).map((p) => state(p, REF).params);
  /** @type {Record<string, number>} */
  const tv = {};
  for (const k of PARAM_NAMES) {
    tv[k] = 0;
    for (let i = 1; i < all.length; i++) tv[k] += Math.abs(all[i][k] - all[i - 1][k]);
  }
  for (const k of PARAM_NAMES) {
    if (!(tv[k] > 0)) continue;
    let worst = 0;
    for (const p of samples(a, b - dp, dp)) {
      worst = Math.max(worst, Math.abs(state(p + dp, REF).params[k] - state(p, REF).params[k]) / dp);
    }
    assert.ok(worst <= 0.25 * tv[k], `${k}: in-band rate ${worst.toFixed(4)} > 0.25 · TV ${tv[k].toFixed(4)}`);
  }
  const creep = state(b, REF).params.c - state(a, REF).params.c;
  assert.ok(Math.abs(creep - 0.06) < 0.002, `creep ${creep}`);
  assert.ok((b - a) * meta.track <= 45, 'hold band ≤ 45 svh');
});

test('WO-008 · E-H0 rule 4: outside the hold band no 2%-of-track window is dead', () => {
  const [a, b] = meta.hold;
  const window = 0.02;
  const dp = 0.0025;
  for (const p0 of samples(0, 1 - window, dp)) {
    if (p0 + window > a && p0 < b) continue;
    if (p0 >= 0.96) continue; // terminal settle ≤ 4% of track
    const x = state(p0, REF).params;
    const y = state(p0 + window, REF).params;
    const moving = PARAM_NAMES.some((k) => Math.abs(y[k] - x[k]) >= 1e-6);
    assert.ok(moving, `dead window at p ${p0.toFixed(4)}`);
  }
});

test('WO-008 · §10.1 rules 2–3: area-model Ȳ is one hill (0.32 → 0.27 → 0.48 → 0.12), ≤ 2 reversals, ≤ .13 per cursor step', () => {
  const ys = samples(0, 1, 1 / 4000).map((p) => meanY(state(p, REF)));
  assert.ok(reversals(ys, 0.02) <= 2, `reversals ${reversals(ys, 0.02)}`);
  const at = (/** @type {number} */ p) => meanY(state(p, REF));
  assert.ok(Math.abs(at(0) - 0.32) < 0.01, `Ȳ(0) ${at(0)}`);
  assert.ok(Math.abs(at(0.1) - 0.27) < 0.01, `Ȳ(.1) ${at(0.1)}`);
  assert.ok(Math.abs(Math.max(...ys) - 0.48) < 0.01, `peak ${Math.max(...ys)}`);
  assert.ok(Math.abs(at(1) - 0.12) < 0.01, `Ȳ(1) ${at(1)}`);
  // The first dip (0.32 → 0.27) is 0.05: below the 0.10 transition threshold.
  assert.ok(at(0) - Math.min(...ys.slice(0, 800)) < 0.1);
  for (let k = 0; k < 5; k++) {
    const p0 = 0.05 + 0.168 * k;
    const step = samples(p0, p0 + 0.168, 1 / 4000).map(at);
    const delta = Math.max(...step) - Math.min(...step);
    assert.ok(delta <= 0.13 + 0.005, `step ${k}: ΔȲ ${delta.toFixed(3)}`);
  }
});

test('WO-008 · state(p) costs well under the 0.5 ms budget (Node, 1440×900)', () => {
  const times = [];
  for (let i = 0; i < 2000; i++) {
    const t0 = process.hrtime.bigint();
    state(i / 1999, REF);
    times.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  times.sort((x, y) => x - y);
  const p95 = times[Math.floor(times.length * 0.95)];
  assert.ok(p95 < 0.5, `p95 ${p95} ms`);
});

test('WO-008 · scene sources obey guards 2, 3, 4 and 8 (no clock, randomness, layout reads, console or storage)', () => {
  const files = ['site/js/scenes/s2-field.js'].map((f) => fileURLToPath(new URL(`../../../../${f}`, import.meta.url)));
  const banned = /Math\.random|Date\.now|performance\.now|new Date|getBoundingClientRect|\boffset[A-Z]\w*|\bclient[A-Z]\w*|getComputedStyle|scrollY|innerWidth|innerHeight|preventDefault|console\.|localStorage/;
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => assert.ok(!banned.test(line), `${f}:${i + 1} ${line.trim()}`));
  }
});
