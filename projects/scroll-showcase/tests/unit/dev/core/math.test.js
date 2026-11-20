// Dev tests for site/js/core/math.js (WO-002). The spec suite (U-1, U-2, U-8)
// lives in tests/unit/spec and is written independently from the spec.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as math from '../../../../site/js/core/math.js';

const {
  clamp, lerp, r, smooth, glide, settle, lead, lin, easeInOutSine, easeOutCubic,
  keys, mulberry32, SEED, fin,
} = math;

test('exports exactly the C2 list', () => {
  assert.deepEqual(Object.keys(math).sort(), [
    'SEED', 'clamp', 'easeInOutSine', 'easeOutCubic', 'fin', 'glide', 'keys',
    'lead', 'lerp', 'lin', 'mulberry32', 'r', 'settle', 'smooth',
  ]);
});

test('clamp bounds both sides and passes values inside', () => {
  assert.equal(clamp(-1, 0, 1), 0);
  assert.equal(clamp(2, 0, 1), 1);
  assert.equal(clamp(0.3, 0, 1), 0.3);
  assert.equal(clamp(5, 5, 5), 5);
});

test('lerp returns its endpoints exactly at t = 0 and t = 1', () => {
  for (const [a, b] of [[0.1, 0.7], [110, 43], [-18, 0], [271.75, 340], [1e-9, 3]]) {
    assert.equal(lerp(a, b, 0), a);
    assert.equal(lerp(a, b, 1), b);
  }
  assert.equal(lerp(0, 10, 0.25), 2.5);
});

test('r remaps a window onto [0, 1] and clamps outside it', () => {
  assert.equal(r(0.2, 0.22, 0.4), 0);
  assert.equal(r(0.31, 0.22, 0.4), (0.31 - 0.22) / (0.4 - 0.22));
  assert.equal(r(0.5, 0.22, 0.4), 1);
  assert.equal(r(0.22, 0.22, 0.4), 0);
  assert.equal(r(0.4, 0.22, 0.4), 1);
});

test('r with a degenerate window is a step at a', () => {
  assert.equal(r(0.49, 0.5, 0.5), 0);
  assert.equal(r(0.5, 0.5, 0.5), 1);
  assert.equal(r(0.51, 0.5, 0.5), 1);
});

const EASES = { smooth, glide, settle, lead, lin, easeInOutSine, easeOutCubic };

test('every ease maps 0 → 0 and 1 → 1 exactly (U-1)', () => {
  for (const [name, f] of Object.entries(EASES)) {
    assert.ok(Object.is(f(0), 0), `${name}(0)`);
    assert.equal(f(1), 1, `${name}(1)`);
  }
});

test('every ease is monotone non-decreasing on [0, 1] and stays in [0, 1]', () => {
  for (const [name, f] of Object.entries(EASES)) {
    let prev = f(0);
    for (let i = 1; i <= 10000; i++) {
      const y = f(i / 10000);
      assert.ok(y >= prev, `${name} decreases at t = ${i / 10000}`);
      assert.ok(y >= 0 && y <= 1, `${name} leaves [0, 1] at t = ${i / 10000}`);
      prev = y;
    }
  }
});

test('eases clamp their input instead of extrapolating', () => {
  for (const [name, f] of Object.entries(EASES)) {
    assert.equal(f(-0.5), 0, `${name}(-0.5)`);
    assert.equal(f(1.5), 1, `${name}(1.5)`);
  }
});

test('eases have their named shapes', () => {
  assert.equal(smooth(0.5), 0.5);
  assert.equal(smooth(0.25), 0.15625);
  assert.equal(glide(0.5), 0.5);
  assert.equal(glide(0.25), 0.0625);
  assert.equal(glide(0.75), 0.9375);
  assert.equal(settle(0.5), 0.875);
  assert.equal(easeOutCubic(0.5), 0.875);
  assert.equal(lead(0.5), 0.75);
  assert.equal(lin(0.3), 0.3);
  assert.ok(Math.abs(easeInOutSine(0.5) - 0.5) < 1e-15);
  // settle is easeOutCubic, by definition (§3.5).
  for (let i = 0; i <= 100; i++) assert.equal(settle(i / 100), easeOutCubic(i / 100));
});

test('glide peaks at 3× its average slope (§3.5)', () => {
  const h = 1e-4;
  // Central difference across the inflection: exactly 3 − 6h + 4h² for easeInOutCubic.
  const slope = (glide(0.5 + h) - glide(0.5 - h)) / (2 * h);
  assert.ok(Math.abs(slope - (3 - 6 * h + 4 * h * h)) < 1e-9, `slope ${slope}`);
  for (let i = 0; i < 1000; i++) {
    const t = i / 1000;
    assert.ok((glide(t + h) - glide(t)) / h <= 3 + 1e-6, `slope above 3 at t = ${t}`);
  }
});

test('keys holds the first value before p0 and the last after the final key (U-2)', () => {
  const k = /** @type {const} */ ([[0.2, 10], [0.6, 30]]);
  assert.equal(keys(-1, k), 10);
  assert.equal(keys(0, k), 10);
  assert.equal(keys(0.2, k), 10);
  assert.equal(keys(0.6, k), 30);
  assert.equal(keys(0.9, k), 30);
  assert.equal(keys(2, k), 30);
});

test('keys returns each key value exactly at its own p', () => {
  const k = [[0, 110], [0.42, 43], [0.58, 42, lin], [0.88, 23.8]];
  for (const [p, v] of k) assert.equal(keys(/** @type {number} */ (p), /** @type {any} */ (k)), v);
});

test('keys defaults to glide and applies the ease of the key that ends each segment', () => {
  const k = [[0, 0], [1, 1], [2, 2, lin], [3, 3, settle]];
  assert.equal(keys(0.25, /** @type {any} */ (k)), glide(0.25));
  assert.equal(keys(1.25, /** @type {any} */ (k)), 1.25);
  assert.equal(keys(2.5, /** @type {any} */ (k)), 2 + settle(0.5));
});

test('keys reproduces the spec Scene 3 triangle path (§4: u 61% at p .25, 42.5% at p .5)', () => {
  const tri = /** @type {const} */ ([[0, 110], [0.42, 43], [0.58, 42, lin], [0.88, 23.8]]);
  assert.ok(Math.abs(keys(0.25, tri) - 61) < 0.5, `tri(.25) = ${keys(0.25, tri)}`);
  assert.ok(Math.abs(keys(0.5, tri) - 42.5) < 1e-12);
});

test('keys with two keys at one p is a step; the later key wins from that p on', () => {
  const k = /** @type {const} */ ([[0, 0], [0.5, 1], [0.5, 5], [1, 6, lin]]);
  assert.equal(keys(0.4999, k) < 1, true);
  assert.equal(keys(0.5, k), 5);
  assert.equal(keys(0.75, k), 5.5);
});

test('keys with a single key holds it everywhere', () => {
  for (const p of [-1, 0, 0.3, 1, 7]) assert.equal(keys(p, [[0.3, 4]]), 4);
});

test('keys rejects an empty list and keys out of order', () => {
  assert.throws(() => keys(0.5, []), RangeError);
  assert.throws(() => keys(0.5, [[0.5, 1], [0.4, 2]]), RangeError);
  assert.throws(() => keys(0.5, [[0, 1], [Number.NaN, 2]]), RangeError);
});

test('SEED is 0xB3E7', () => {
  assert.equal(SEED, 0xb3e7);
  assert.equal(SEED, 46055);
});

test('mulberry32(0xB3E7) yields the recorded golden sequence (U-8)', () => {
  const next = mulberry32(0xb3e7);
  // Recorded 2026-11-20 and cross-checked against the reference mulberry32 over 1e6 draws.
  const golden = [0.853153768228367, 0.7606964602600783, 0.8666056906804442, 0.5767440642230213, 0.3593797341454774];
  assert.deepEqual([next(), next(), next(), next(), next()], golden);
  // The same values as exact 32-bit integers, so the record does not depend on decimal printing.
  const ints = mulberry32(SEED);
  assert.deepEqual(
    Array.from({ length: 5 }, () => ints() * 4294967296),
    [3664267533, 3267166419, 3722043100, 2477096894, 1543524205],
  );
});

test('mulberry32 is deterministic per seed, independent per generator, and in [0, 1)', () => {
  const a = mulberry32(SEED);
  const b = mulberry32(SEED);
  const c = mulberry32(SEED + 1);
  let same = 0;
  for (let i = 0; i < 10000; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
    if (x === c()) same++;
  }
  assert.ok(same < 5, 'a different seed gives a different sequence');
});

test('fin normalises −0 to 0 and passes finite numbers through', () => {
  assert.ok(Object.is(fin(-0), 0));
  assert.ok(Object.is(fin(0), 0));
  assert.equal(fin(-1.5), -1.5);
  assert.equal(fin(1e300), 1e300);
});

test('fin throws on non-finite values and non-numbers', () => {
  for (const bad of [Number.NaN, Infinity, -Infinity, '1', undefined, null]) {
    assert.throws(() => fin(/** @type {any} */ (bad)), TypeError, String(bad));
  }
});
