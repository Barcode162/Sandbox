// Dev tests for site/js/core/geometry.js (WO-002). The spec suite (U-3, seam
// gates, §15.2 tables) lives in tests/unit/spec and is written independently.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as geometry from '../../../../site/js/core/geometry.js';
import { mulberry32, SEED } from '../../../../site/js/core/math.js';

const {
  SCENES, COLOPHON_SVH, TICK_G, viewport, trackLayout, locate, snap,
  bandRects, bandRectsFromWeights, dotGrid, shelf, beamW, centre,
} = geometry;

/** The five §11.1 reference viewports. */
const SIZES = /** @type {const} */ ([[375, 812], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]);
const DPRS = [1, 1.5, 2];
/** Awkward sizes: fractional svh probes, odd widths, near-square, huge. */
const ODD = /** @type {const} */ ([[375, 811.5], [390, 663.3333], [767, 1023.75], [1000, 999], [1366, 657.6], [2560, 1440], [3840, 2160], [320, 568]]);

/** Device-pixel alignment: x·dpr is an integer up to float noise. */
function onDevicePixel(x, dpr) {
  return Math.abs(x * dpr - Math.round(x * dpr)) < 1e-9;
}

/** Fails on any −0, non-finite number or non-JSON value anywhere in v. */
function assertJsonClean(v, path = 'value') {
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

test('exports exactly the C2 list', () => {
  assert.deepEqual(Object.keys(geometry).sort(), [
    'COLOPHON_SVH', 'SCENES', 'TICK_G', 'bandRects', 'bandRectsFromWeights', 'beamW',
    'centre', 'dotGrid', 'locate', 'shelf', 'snap', 'trackLayout', 'viewport',
  ]);
});

test('SCENES holds the §3.1 arc: ids, slugs, names, tracks, hold bands and creep names', () => {
  assert.deepEqual(SCENES, [
    { id: 1, slug: 'incidence', name: 'Incidence', track: 220, hold: [0.45, 0.6], creep: 'spread' },
    { id: 2, slug: 'field', name: 'Field', track: 300, hold: [0.722, 0.781], creep: 'c' },
    { id: 3, slug: 'refraction', name: 'Refraction', track: 260, hold: [0.42, 0.58], creep: 'tri' },
    { id: 4, slug: 'dichroic', name: 'Dichroic', track: 320, hold: [0.44, 0.56], creep: 'theta' },
    { id: 5, slug: 'agreement', name: 'Agreement', track: 220, hold: [0.25, 0.4], creep: 'tau' },
    { id: 6, slug: 'return', name: 'Return', track: 180, hold: [0.4, 0.52], creep: null },
  ]);
  assert.equal(SCENES.reduce((s, m) => s + m.track, 0), 1500);
  assert.equal(COLOPHON_SVH, 70);
});

test('SCENES is deeply frozen, so no scene can edit the shared metadata', () => {
  assert.ok(Object.isFrozen(SCENES));
  for (const m of SCENES) {
    assert.ok(Object.isFrozen(m));
    assert.ok(Object.isFrozen(m.hold));
  }
  assert.throws(() => { /** @type {any} */ (SCENES[0]).track = 1; }, TypeError);
});

test('hold bands obey §3.3 rule 3 (≤ 45 svh) and Scene 6 rests ≤ 22 svh', () => {
  for (const m of SCENES) {
    const [a, b] = m.hold;
    assert.ok(a >= 0 && b <= 1 && a < b, `scene ${m.id} band ordered`);
    assert.ok((b - a) * m.track <= 45, `scene ${m.id} band is ${(b - a) * m.track} svh`);
  }
  const [a6, b6] = SCENES[5].hold;
  assert.ok((b6 - a6) * SCENES[5].track <= 22);
});

test('TICK_G is each scene start over the 1,500 svh total', () => {
  const expected = [0, 0.14667, 0.34667, 0.52, 0.73333, 0.88];
  assert.equal(TICK_G.length, 6);
  TICK_G.forEach((g, i) => assert.ok(Math.abs(g - expected[i]) <= 1e-4, `TICK_G[${i}] = ${g}`));
  assert.deepEqual(TICK_G, [0, 220, 520, 780, 1100, 1320].map((x) => x / 1500));
  assert.ok(Object.isFrozen(TICK_G));
});

test('viewport() gives §11.1 bp, gutter and pitch at the five reference sizes', () => {
  const want = {
    '375x812': { bp: 375, gutter: 16, pitch: 24, landscape: false, U: 812, V: 375 },
    '768x1024': { bp: 768, gutter: 24, pitch: 24, landscape: false, U: 1024, V: 768 },
    '1024x768': { bp: 1024, gutter: 32, pitch: 28, landscape: true, U: 1024, V: 768 },
    '1440x900': { bp: 1440, gutter: 40, pitch: 32, landscape: true, U: 1440, V: 900 },
    '1920x1080': { bp: 1920, gutter: 48, pitch: 36, landscape: true, U: 1920, V: 1080 },
  };
  for (const [vw, sh] of SIZES) {
    const vp = viewport(vw, sh, 2);
    const w = want[`${vw}x${sh}`];
    assert.deepEqual(
      { bp: vp.bp, gutter: vp.gutter, pitch: vp.pitch, landscape: vp.landscape, U: vp.U, V: vp.V },
      w,
      `${vw}x${sh}`,
    );
    assert.equal(vp.lattice, 2 * vp.pitch);
    assert.equal(vp.vmin, Math.min(vw, sh) / 100);
    assert.equal(vp.vw, vw);
    assert.equal(vp.sh, sh);
    assert.equal(vp.dpr, 2);
  }
});

test('viewport() breakpoints switch at 768, 1024, 1440 and 1920, and lattice === 2·pitch at every width', () => {
  const bpAt = (vw) => viewport(vw, 800, 1).bp;
  assert.deepEqual([767, 768, 1023, 1024, 1439, 1440, 1919, 1920, 3840].map(bpAt), [375, 768, 768, 1024, 1024, 1440, 1440, 1920, 1920]);
  for (let vw = 200; vw <= 4000; vw += 7) {
    for (const sh of [300, 700, 1200, 2400]) {
      const vp = viewport(vw, sh, 1);
      assert.equal(vp.lattice, 2 * vp.pitch, `${vw}x${sh}`);
    }
  }
});

test('viewport() treats a square as landscape (vw / sh ≥ 1)', () => {
  const vp = viewport(800, 800, 1);
  assert.equal(vp.landscape, true);
  assert.equal(vp.U, 800);
  assert.equal(viewport(800, 800.5, 1).landscape, false);
});

test('viewport() keeps geometry finite for collapsed or bogus measurements', () => {
  const vp = viewport(0, Number.NaN, 0);
  assert.equal(vp.vw, 1);
  assert.equal(vp.sh, 1);
  assert.equal(vp.dpr, 1);
  assertJsonClean(vp);
  assertJsonClean(trackLayout(vp));
  assertJsonClean(bandRects(vp));
  assertJsonClean(locate(0.5, trackLayout(vp)));
  assert.equal(viewport(1440, 900, Infinity).dpr, 1);
  assert.equal(viewport(1440, 900, -2).dpr, 1);
});

test('trackLayout() at 1440×900 gives the §3.1 offsets and D = 13,500', () => {
  const lay = trackLayout(viewport(1440, 900, 1));
  assert.deepEqual(lay.Y, [0, 1980, 4680, 7020, 9900, 11880]);
  assert.deepEqual(lay.L, [1980, 2700, 2340, 2880, 1980, 1620]);
  assert.equal(lay.D, 13500);
  assert.equal(lay.vp.vw, 1440);
});

test('trackLayout() partitions [0, D] exactly at every viewport: Y[s] + L[s] === Y[s+1]', () => {
  for (const [vw, sh] of [...SIZES, ...ODD]) {
    const lay = trackLayout(viewport(vw, sh, 1));
    assert.equal(lay.Y[0], 0);
    for (let s = 0; s < 5; s++) assert.equal(lay.Y[s] + lay.L[s], lay.Y[s + 1], `${vw}x${sh} s${s}`);
    assert.equal(lay.Y[5] + lay.L[5], lay.D);
    lay.L.forEach((len, s) => assert.ok(Math.abs(len - (SCENES[s].track * sh) / 100) < 1e-9));
    assert.ok(Math.abs(lay.D - 15 * sh) < 1e-9);
  }
});

test('locate(): y = D is scene 6 at p 1, G 1; beyond D clamps there', () => {
  for (const [vw, sh] of [...SIZES, ...ODD]) {
    const lay = trackLayout(viewport(vw, sh, 1));
    assert.deepEqual(locate(lay.D, lay), { scene: 6, p: 1, G: 1 });
    assert.deepEqual(locate(lay.D + 500, lay), { scene: 6, p: 1, G: 1 });
  }
});

test('locate(): y = Y_s is scene s at p 0', () => {
  for (const [vw, sh] of [...SIZES, ...ODD]) {
    const lay = trackLayout(viewport(vw, sh, 1));
    lay.Y.forEach((y, i) => {
      const at = locate(y, lay);
      assert.equal(at.scene, i + 1, `${vw}x${sh} Y${i + 1}`);
      assert.ok(Object.is(at.p, 0));
      assert.equal(at.G, y / lay.D);
    });
  }
});

test('locate(): y < 0 clamps to scene 1 at p 0, G 0, with no −0', () => {
  const lay = trackLayout(viewport(1440, 900, 1));
  for (const y of [-1, -1e6, -0]) {
    const at = locate(y, lay);
    assert.deepEqual(at, { scene: 1, p: 0, G: 0 });
    assertJsonClean(at);
  }
});

test('locate(): interior offsets give local and global progress', () => {
  const lay = trackLayout(viewport(1440, 900, 1));
  assert.deepEqual(locate(990, lay), { scene: 1, p: 0.5, G: 990 / 13500 });
  assert.deepEqual(locate(9900 + 495, lay), { scene: 5, p: 0.25, G: 10395 / 13500 });
  const justBefore = locate(1979.5, lay);
  assert.equal(justBefore.scene, 1);
  assert.ok(justBefore.p < 1 && justBefore.p > 0.999);
  assert.equal(locate(40, lay).p, 40 / 1980); // the F10 hook offset, p ≈ 0.0202
});

test('locate() is monotone across the whole scroll: scene never decreases, G never decreases', () => {
  for (const [vw, sh] of [...SIZES, ...ODD]) {
    const lay = trackLayout(viewport(vw, sh, 1));
    let prev = locate(0, lay);
    for (let y = 0.5; y <= lay.D + 1; y += 0.5 + lay.D / 4000) {
      const at = locate(y, lay);
      assert.ok(at.scene >= prev.scene && at.G >= prev.G, `${vw}x${sh} y ${y}`);
      if (at.scene === prev.scene) assert.ok(at.p >= prev.p);
      assert.ok(at.p >= 0 && at.p <= 1);
      prev = at;
    }
  }
});

test('locate() throws on a non-finite offset (the engine records it)', () => {
  const lay = trackLayout(viewport(1440, 900, 1));
  assert.throws(() => locate(Number.NaN, lay), TypeError);
  assert.throws(() => locate(Infinity, lay), TypeError);
});

test('snap() rounds to the device-pixel grid and never returns −0', () => {
  assert.equal(snap(205.7142857, 1), 206);
  assert.equal(snap(205.7142857, 2), 205.5);
  assert.equal(snap(205.7142857, 1.5), 206); // 308.57 device px → 309 → 206 CSS px
  assert.equal(snap(411.4285714, 1.5), 617 / 1.5); // 617.14 device px → 617
  assert.ok(onDevicePixel(snap(411.4285714, 1.5), 1.5));
  assert.ok(Object.is(snap(-0.2, 1), 0));
  assert.ok(Object.is(snap(-0, 2), 0));
  assert.equal(snap(100, 1.5), 100);
});

/** Every invariant a band strip must hold; returns the edges for further checks. */
function assertGapless(rects, vp, label) {
  assert.equal(rects[0].u0, 0, `${label}: first u0`);
  assert.equal(rects[rects.length - 1].u1, vp.U, `${label}: last u1`);
  for (let i = 0; i < rects.length; i++) {
    const b = rects[i];
    assert.equal(b.v0, 0, `${label}: v0`);
    assert.equal(b.v1, vp.V, `${label}: v1`);
    assert.ok(b.u1 >= b.u0, `${label}: band ${i} has negative width`);
    if (i > 0) assert.equal(b.u0, rects[i - 1].u1, `${label}: seam between ${i - 1} and ${i}`);
    // Interior edges sit on the device grid; an edge clamped onto the viewport edge itself
    // (a zero-width band at the end) may sit at U, which need not be on the grid.
    if (i > 0 && b.u0 !== vp.U) assert.ok(onDevicePixel(b.u0, vp.dpr), `${label}: edge ${i} at ${b.u0} is off the device grid`);
  }
  assertJsonClean(rects, label);
}

test('bandRects(): seven equal snapped bands, gapless at DPR 1, 1.5 and 2 at the five viewports (#4)', () => {
  for (const [vw, sh] of SIZES) {
    for (const dpr of DPRS) {
      const vp = viewport(vw, sh, dpr);
      const rects = bandRects(vp);
      const label = `${vw}x${sh}@${dpr}`;
      assert.equal(rects.length, 7, label);
      assertGapless(rects, vp, label);
      rects.forEach((b, i) => {
        assert.ok(Math.abs(b.u0 - (i * vp.U) / 7) <= 0.5 / dpr + 1e-9, `${label}: band ${i} edge is a nearest snap`);
        assert.ok(Math.abs(b.u1 - b.u0 - vp.U / 7) <= 1 / dpr + 1e-9, `${label}: band ${i} width`);
      });
    }
  }
});

test('bandRects() at 1440×900 DPR 1 gives the expected integer edges', () => {
  const edges = bandRects(viewport(1440, 900, 1)).map((b) => b.u0);
  assert.deepEqual(edges, [0, 206, 411, 617, 823, 1029, 1234]);
});

test('bandRects() equals bandRectsFromWeights with equal weights, bit for bit (the 1→2 and 4→5 seams)', () => {
  for (const [vw, sh] of [...SIZES, ...ODD]) {
    for (const dpr of DPRS) {
      const vp = viewport(vw, sh, dpr);
      assert.deepEqual(bandRects(vp), bandRectsFromWeights([1, 1, 1, 1, 1, 1, 1], vp));
      assert.deepEqual(bandRects(vp), bandRectsFromWeights([3, 3, 3, 3, 3, 3, 3], vp));
    }
  }
});

test('bandRects() stays inside [0, U] when U is not on the device grid', () => {
  for (const [vw, sh] of ODD) {
    for (const dpr of [1, 1.25, 1.5, 1.75, 2, 2.625, 3]) {
      const vp = viewport(vw, sh, dpr);
      const rects = bandRects(vp);
      assert.equal(rects[6].u1, vp.U);
      for (const b of rects) assert.ok(b.u0 >= 0 && b.u1 <= vp.U);
      for (let i = 1; i < 7; i++) assert.equal(rects[i].u0, rects[i - 1].u1);
    }
  }
});

test('bandRectsFromWeights(): cumulative snapped edges normalised to U at all DPRs and viewports', () => {
  const rand = mulberry32(SEED);
  for (const [vw, sh] of [...SIZES, ...ODD]) {
    for (const dpr of DPRS) {
      const vp = viewport(vw, sh, dpr);
      for (let k = 0; k < 40; k++) {
        /** @type {number[]} */
        const w = Array.from({ length: 7 }, () => (rand() < 0.15 ? 0 : rand() * 12));
        if (w.reduce((a, b) => a + b, 0) === 0) w[3] = 1;
        const rects = bandRectsFromWeights(w, vp);
        const label = `${vw}x${sh}@${dpr} w=${w.map((x) => x.toFixed(2))}`;
        assert.equal(rects.length, 7);
        assertGapless(rects, vp, label);
        const total = w.reduce((a, b) => a + b, 0);
        let acc = 0;
        for (let i = 1; i < 7; i++) {
          acc += w[i - 1];
          assert.ok(Math.abs(rects[i].u0 - (vp.U * acc) / total) <= 0.5 / dpr + 1e-9, `${label}: edge ${i}`);
        }
      }
    }
  }
});

test('bandRectsFromWeights(): one dominant band takes the whole width (Scene 2 at p 1)', () => {
  const vp = viewport(1440, 900, 2);
  const rects = bandRectsFromWeights([0, 0, 0, 0, 0, 5, 0], vp);
  assert.deepEqual(rects.map((b) => b.u1 - b.u0), [0, 0, 0, 0, 0, 1440, 0]);
  assertGapless(rects, vp, 'cobalt only');
});

test('bandRectsFromWeights() rejects empty, negative, non-finite and all-zero weights', () => {
  const vp = viewport(1440, 900, 1);
  assert.throws(() => bandRectsFromWeights([], vp), RangeError);
  assert.throws(() => bandRectsFromWeights([1, -1, 1], vp), RangeError);
  assert.throws(() => bandRectsFromWeights([1, Number.NaN, 1], vp), RangeError);
  assert.throws(() => bandRectsFromWeights([1, Infinity, 1], vp), RangeError);
  assert.throws(() => bandRectsFromWeights([0, 0, 0], vp), RangeError);
});

test('dotGrid(): a vertex dot lies exactly on the stage centre (#41, §11.1)', () => {
  for (const [vw, sh] of [...SIZES, ...ODD]) {
    for (const dpr of DPRS) {
      const vp = viewport(vw, sh, dpr);
      const dg = dotGrid(vp);
      const label = `${vw}x${sh}@${dpr}`;
      assert.equal(dg.pitch, vp.pitch);
      assert.equal(dg.r, 2.5);
      assert.equal((vp.U / 2 - dg.originU) % (2 * dg.pitch), 0, `${label}: u`);
      assert.equal((vp.V / 2 - dg.originV) % (2 * dg.pitch), 0, `${label}: v`);
      assert.ok(dg.originU >= 0 && dg.originU < vp.lattice, `${label}: originU in the first lattice cell`);
      assert.ok(dg.originV >= 0 && dg.originV < vp.lattice, `${label}: originV in the first lattice cell`);
      assertJsonClean(dg, label);
    }
  }
});

test('dotGrid() at 1440×900: origin (16, 2), pitch 32, lattice 64', () => {
  assert.deepEqual(dotGrid(viewport(1440, 900, 1)), { pitch: 32, originU: 16, originV: 2, r: 2.5 });
});

test('shelf() at 1440×900: .25/.50/.75 U on v = V/2, rot 0, tri 30 / cir 26 / dia 21 vmin', () => {
  assert.deepEqual(shelf(viewport(1440, 900, 1)), [
    { kind: 'tri', u: 360, v: 450, size: 270, rot: 0 },
    { kind: 'cir', u: 720, v: 450, size: 234, rot: 0 },
    { kind: 'dia', u: 1080, v: 450, size: 189, rot: 0 },
  ]);
});

test('shelf() in portrait uses the §11.1 40vw sizes along the long axis', () => {
  assert.deepEqual(shelf(viewport(375, 812, 2)), [
    { kind: 'tri', u: 203, v: 187.5, size: 150, rot: 0 },
    { kind: 'cir', u: 406, v: 187.5, size: 130, rot: 0 },
    { kind: 'dia', u: 609, v: 187.5, size: 105, rot: 0 },
  ]);
});

/** Circumscribed radius of each shape: rotation-invariant, so it covers the ±8° tilt. */
const CIRCUM = { tri: (s) => s / Math.sqrt(3), cir: (s) => s / 2, dia: (s) => s / Math.SQRT2 };

test('shelf() fit cap: at 768×1024 the 40vw sizes would collide, so all three scale until they touch', () => {
  const vp = viewport(768, 1024, 1);
  const s = shelf(vp);
  assert.deepEqual(s.map((x) => x.u), [256, 512, 768]);
  // Uncapped 40vw would be tri 307.2 (circumcircles overlap by 54.5 px); capped keeps 30:26:21.
  const unit = 1024 / (4 * (30 / Math.sqrt(3) + 13));
  assert.ok(Math.abs(s[0].size - 30 * unit) < 1e-9 && s[0].size < 307.2);
  assert.ok(Math.abs(s[1].size - 26 * unit) < 1e-9);
  assert.ok(Math.abs(s[2].size - 21 * unit) < 1e-9);
  assert.ok(Math.abs(s[1].u - s[0].u - CIRCUM.tri(s[0].size) - CIRCUM.cir(s[1].size)) < 1e-9, 'tri and cir touch');
});

test('shelf() fit cap does not engage at 375×812, 1024×768, 1440×900 or 1920×1080', () => {
  for (const [vw, sh] of [[375, 812], [1024, 768], [1440, 900], [1920, 1080]]) {
    const vp = viewport(vw, sh, 1);
    const unit = vp.landscape ? vp.vmin : (40 * vw) / 3000;
    shelf(vp).forEach((x, i) => assert.ok(Math.abs(x.size - [30, 26, 21][i] * unit) < 1e-9, `${vw}x${sh} ${x.kind}`));
  }
});

test('shelf() neighbours never collide and the diamond fits across V, at any viewport', () => {
  for (const [vw, sh] of [...SIZES, ...ODD, [700, 710], [1280, 1024], [1000, 1000]]) {
    const vp = viewport(vw, sh, 1);
    const [tri, cir, dia] = shelf(vp);
    const eps = 1e-9;
    assert.ok(cir.u - tri.u >= CIRCUM.tri(tri.size) + CIRCUM.cir(cir.size) - eps, `${vw}x${sh}: tri/cir`);
    assert.ok(dia.u - cir.u >= CIRCUM.cir(cir.size) + CIRCUM.dia(dia.size) - eps, `${vw}x${sh}: cir/dia`);
    assert.ok(2 * CIRCUM.dia(dia.size) < vp.V, `${vw}x${sh}: diamond fits across V`);
  }
});

test('beamW(): max(0.09·U, 32), exactly 129.6 at 1440×900', () => {
  assert.equal(beamW(viewport(1440, 900, 1)), 129.6);
  assert.equal(beamW(viewport(1920, 1080, 1)), 172.8);
  assert.ok(Math.abs(beamW(viewport(375, 812, 2)) - 73.08) < 1e-12); // portrait: 9svh
  assert.equal(beamW(viewport(300, 200, 1)), 32);
});

test('centre() is (U/2, V/2) in both orientations', () => {
  assert.deepEqual(centre(viewport(1440, 900, 1)), { u: 720, v: 450 });
  assert.deepEqual(centre(viewport(375, 812, 1)), { u: 406, v: 187.5 });
});

test('every geometry output is JSON-clean, deterministic, and leaves its input untouched', () => {
  const deepFreeze = (o) => { Object.values(o).forEach((x) => x && typeof x === 'object' && deepFreeze(x)); return Object.freeze(o); };
  for (const [vw, sh] of [...SIZES, ...ODD]) {
    for (const dpr of DPRS) {
      const vp = deepFreeze(viewport(vw, sh, dpr));
      const lay = deepFreeze(trackLayout(vp));
      const run = () => ({
        vp: viewport(vw, sh, dpr), lay: trackLayout(vp), at: locate(lay.D * 0.37, lay),
        bands: bandRects(vp), dg: dotGrid(vp), shelf: shelf(vp), beam: beamW(vp), centre: centre(vp),
      });
      const a = run();
      assertJsonClean(a, `${vw}x${sh}@${dpr}`);
      assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
      assert.deepEqual(run(), a);
    }
  }
});
