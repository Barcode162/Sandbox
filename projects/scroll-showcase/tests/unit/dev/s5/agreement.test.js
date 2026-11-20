// Dev tests for site/js/scenes/s5-agreement.js (WO-011). The spec suite (U-3,
// E-H0, seam gates) lives in tests/unit/spec and is written independently;
// these pin the builder's own reading of spec §4 Scene 5 and §15.2.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as s5 from '../../../../site/js/scenes/s5-agreement.js';
import { SCENES, viewport, bandRects, beamW, snap } from '../../../../site/js/core/geometry.js';

const { state, meta } = s5;

/** The five §11.1 reference viewports, plus awkward ones (fractional svh, odd widths, near-square). */
const SIZES = /** @type {const} */ ([[375, 812], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]);
const ODD = /** @type {const} */ ([[375, 811.5], [390, 663.3333], [1000, 999], [1100, 700], [1366, 657.6], [2560, 1440]]);
const DPRS = [1, 1.5, 2];
const ALL = [...SIZES, ...ODD].flatMap(([w, h]) => DPRS.map((d) => viewport(w, h, d)));
const REF = viewport(1440, 900, 1);
const EPS = 1e-6;

/** p sampled at Δp = 1/4000 (the §3.3 resolution). */
const STEPS = 4000;
const PS = Array.from({ length: STEPS + 1 }, (_, k) => k / STEPS);

/** Fails on any −0, non-finite number or non-JSON value anywhere in v. */
function assertJsonClean(v, path = 'state') {
  if (typeof v === 'number') {
    assert.ok(Number.isFinite(v), `${path} is not finite`);
    assert.ok(!Object.is(v, -0), `${path} is −0`);
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => assertJsonClean(x, `${path}[${i}]`));
  } else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) assertJsonClean(x, `${path}.${k}`);
  } else {
    assert.ok(v === null || typeof v === 'string' || typeof v === 'boolean', `${path} has type ${typeof v}`);
  }
}

test('[WO-011] meta is SCENES[4]; params are exactly n tau hair ov (C1)', () => {
  assert.deepEqual(meta, SCENES[4]);
  assert.equal(meta.creep, 'tau');
  assert.deepEqual(Object.keys(state(0.5, REF).params), ['n', 'tau', 'hair', 'ov']);
});

test('[WO-011] §15.2 Scene 5 state(0): n 0, τ 0, hair 0, ov 0, beam rects = bandRects (bit for bit, every viewport and DPR)', () => {
  for (const vp of ALL) {
    const s = state(0, vp);
    assert.deepEqual(s.params, { n: 0, tau: 0, hair: 0, ov: 0 });
    assert.deepEqual(s.geom.bandRects, bandRects(vp), `bandRects at ${vp.vw}×${vp.sh}@${vp.dpr}`);
    assert.equal(s.geom.ground, 'bands');
    assert.equal(s.geom.beamRect, null);
    assert.equal(s.geom.otherOpacity, 0);
    assert.equal(s.geom.whitePoint, null);
  }
});

test('[WO-011] §15.2 Scene 5 state(1): n 1, τ 1, hair 0, ov 1, all 7 beams centred, beamW wide; one white beamRect on ink', () => {
  const s = state(1, REF);
  assert.deepEqual(s.params, { n: 1, tau: 1, hair: 0, ov: 1 });
  assert.equal(s.beamW, 129.6, 'beamW at 1440 is 129.6 (the spec rounds it to 130)');
  for (const b of /** @type {{centreU:number,width:number}[]} */ (s.beams)) {
    assert.equal(b.centreU, 720);
    assert.equal(b.width, 129.6);
  }
  assert.deepEqual(s.geom.beamRect, { centreU: 720, width: 129.6, v0: 0, v1: 900, color: '#FFFFFF' });
  assert.equal(s.geom.ground, 'ink');
  assert.equal(s.geom.otherOpacity, 0);
  for (const vp of ALL) {
    const t = state(1, vp);
    const bw = beamW(vp);
    assert.deepEqual(t.geom.beamRect, { centreU: vp.U / 2, width: bw, v0: 0, v1: vp.V, color: '#FFFFFF' });
    // Every drawn beam is the same snapped rect, so no fringe column can exist.
    const want = { u0: snap(vp.U / 2 - bw / 2, vp.dpr), u1: snap(vp.U / 2 + bw / 2, vp.dpr), v0: 0, v1: vp.V };
    for (const r of /** @type {object[]} */ (t.geom.bandRects)) assert.deepEqual(r, want, `${vp.vw}×${vp.sh}@${vp.dpr}`);
  }
});

test('[WO-011] at 1440×900 the drawn p 1 beam is the 130 px column 655–785', () => {
  const r = /** @type {{u0:number,u1:number}[]} */ (state(1, REF).geom.bandRects)[0];
  assert.equal(r.u0, 655);
  assert.equal(r.u1, 785);
});

test('[WO-011] parameter schedule: n by p .25, the colonnade creep, hairlines .40–.70, overlay .93–1', () => {
  const at = (/** @type {number} */ p) => state(p, REF).params;
  assert.equal(at(0.25).n, 1);
  assert.equal(at(0.125).n, 0.5, 'glide is symmetric: half way at the midpoint');
  assert.equal(at(0.25).tau, 0);
  assert.ok(Math.abs(at(0.4).tau - 0.035) < EPS, 'creep +0.035 across the hold');
  assert.ok(Math.abs(at(0.325).tau - 0.0175) < EPS, 'creep is linear in the hold');
  assert.equal(at(0.4).hair, 0);
  assert.equal(at(0.46).hair, 1);
  assert.equal(at(0.64).hair, 1);
  assert.equal(at(0.7).hair, 0);
  assert.equal(at(0.93).ov, 0);
  assert.ok(Math.abs(at(0.965).ov - 0.5) < EPS);
  assert.equal(at(1).ov, 1);
});

test('[WO-011] overshoot: τ peaks at 1.074 at p .88; the outermost beams pass the centre by 0.35 beam widths; jade never moves', () => {
  let max = -Infinity;
  let argmax = -1;
  for (const p of PS) {
    const t = state(p, REF).params.tau;
    if (t > max) { max = t; argmax = p; }
  }
  assert.ok(Math.abs(max - 1.074) < EPS);
  assert.equal(argmax, 0.88);
  for (const vp of [viewport(1440, 900, 1), viewport(1920, 1080, 1), viewport(375, 812, 2)]) {
    const s = state(0.88, vp);
    const beams = /** @type {{centreU:number}[]} */ (s.beams);
    const bw = /** @type {number} */ (s.beamW);
    const h = vp.U / 2;
    const past0 = (beams[0].centreU - h) / bw; // vermilion, from the left, now right of centre
    const past6 = (h - beams[6].centreU) / bw; // violet, mirrored
    assert.ok(Math.abs(past0 - 0.35) < 0.005, `outermost passes by ${past0.toFixed(4)} beam widths at ${vp.vw}`);
    assert.ok(Math.abs(past6 - past0) < EPS, 'symmetric');
  }
  for (const vp of ALL) {
    const h = vp.U / 2;
    const ref = /** @type {object[]} */ (state(0.25, vp).geom.bandRects)[3];
    for (const p of PS) {
      const s = state(p, vp);
      assert.equal(/** @type {{centreU:number}[]} */ (s.beams)[3].centreU, h, 'jade centre is U/2 at every p');
      if (p >= 0.25) assert.deepEqual(/** @type {object[]} */ (s.geom.bandRects)[3], ref, `jade's drawn rect is fixed after p .25 (${vp.vw}×${vp.sh}@${vp.dpr}, p ${p})`);
    }
  }
});

test('[WO-011] beams stay symmetric about the centre and in spectral order until they cross it', () => {
  for (const vp of SIZES.map(([w, h]) => viewport(w, h, 1))) {
    for (const p of PS) {
      const b = /** @type {{centreU:number,width:number}[]} */ (state(p, vp).beams);
      for (let i = 0; i < 7; i++) {
        assert.ok(Math.abs(b[i].centreU + b[6 - i].centreU - vp.U) < 1e-9, `mirror pair ${i} at p ${p}`);
        assert.equal(b[i].width, b[0].width);
      }
    }
  }
});

test('[WO-011] drawn edges are on the device grid, non-negative in width, and within [−overshoot, U]', () => {
  for (const vp of ALL) {
    for (let k = 0; k <= 400; k++) {
      const p = k / 400;
      for (const r of /** @type {{u0:number,u1:number,v0:number,v1:number}[]} */ (state(p, vp).geom.bandRects)) {
        assert.ok(r.u1 >= r.u0, 'non-negative width');
        assert.ok(Math.abs(r.u0 * vp.dpr - Math.round(r.u0 * vp.dpr)) < 1e-9, 'u0 on the device grid');
        assert.ok(Math.abs(r.u1 * vp.dpr - Math.round(r.u1 * vp.dpr)) < 1e-9, 'u1 on the device grid');
        assert.ok(r.u0 >= 0 && r.u1 <= vp.U, 'inside the stage');
        assert.equal(r.v0, 0);
        assert.equal(r.v1, vp.V);
      }
    }
  }
});

test('[WO-011] the click: a fringe sliver reappears at the overshoot (p .88) and is gone at p 1', () => {
  const span = (/** @type {number} */ p) => {
    const R = /** @type {{u0:number,u1:number}[]} */ (state(p, REF).geom.bandRects);
    return Math.max(...R.map((r) => r.u1)) - Math.min(...R.map((r) => r.u0));
  };
  assert.ok(span(0.88) - span(1) >= 80, `overshoot widens the union by ${span(0.88) - span(1)} px`);
  assert.ok(span(0.75) < span(0.88), 'the union narrows, re-widens at the overshoot, then settles');
  assert.equal(span(1), 130);
});

test('[WO-011] §3.3 hold rule: inside [.25, .40] every moving parameter runs at ≤ 25% of its average rate; τ creeps +0.035', () => {
  const [a, b] = meta.hold;
  for (const k of ['n', 'tau', 'hair', 'ov']) {
    const xs = PS.map((p) => state(p, REF).params[k]);
    let tv = 0;
    for (let i = 1; i < xs.length; i++) tv += Math.abs(xs[i] - xs[i - 1]);
    if (tv === 0) continue;
    let worst = 0;
    for (let i = 1; i < xs.length; i++) {
      if (PS[i - 1] >= a && PS[i] <= b) worst = Math.max(worst, Math.abs(xs[i] - xs[i - 1]) * STEPS);
    }
    assert.ok(worst <= 0.25 * tv, `${k}: in-band rate ${worst} vs 0.25·TV ${0.25 * tv}`);
  }
  const creep = state(b, REF).params.tau - state(a, REF).params.tau;
  assert.ok(Math.abs(creep - 0.035) < EPS);
});

test('[WO-011] §3.3 never dead: outside the hold (and a ≤ 4% terminal settle) no 2% window holds every parameter still', () => {
  const [a, b] = meta.hold;
  const win = STEPS * 0.02;
  const end = STEPS * 0.96;
  for (let i = 0; i + win <= end; i++) {
    const p0 = PS[i];
    const p1 = PS[i + win];
    if (p0 >= a && p1 <= b) continue; // fully inside the hold band
    const s0 = state(p0, REF).params;
    const s1 = state(p1, REF).params;
    const moved = Object.keys(s0).some((k) => Math.abs(s1[k] - s0[k]) >= 1e-6);
    assert.ok(moved, `window [${p0}, ${p1}] is dead`);
  }
});

test('[WO-011] purity: same input, same JSON-clean output; inputs are not mutated; out-of-range p clamps', () => {
  const vp = Object.freeze({ ...REF });
  for (let k = 0; k <= 200; k++) {
    const p = k / 200;
    const one = state(p, vp);
    assert.deepEqual(one, state(p, vp));
    assertJsonClean(one);
    assert.equal(JSON.stringify(JSON.parse(JSON.stringify(one))), JSON.stringify(one));
  }
  assert.deepEqual(state(-0.5, vp), state(0, vp));
  assert.deepEqual(state(1.5, vp), state(1, vp));
  assert.equal(Object.is(state(-0, vp).p, 0), true, 'p −0 normalised');
});

test('[WO-011] state() stays under the C3 budget (≤ 0.5 ms at 1440, mean of 4,000 calls)', () => {
  const t0 = process.hrtime.bigint();
  for (const p of PS) state(p, REF);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / PS.length;
  assert.ok(ms <= 0.5, `${ms.toFixed(4)} ms per call`);
});
