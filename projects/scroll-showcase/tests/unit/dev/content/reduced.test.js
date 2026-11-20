// WO-003 dev tests: §10.4 stillPlan at every boundary, inside every range, and its invariants.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { stillPlan } from '../../../../site/js/core/reduced.js';

const near = (a, b, eps = 1e-12) => Math.abs(a - b) <= eps;

test('[WO-003] still ranges are closed: [0, .17], [.33, .67], [.83, 1]', () => {
  for (const p of [0, 0.05, 0.17]) assert.deepEqual(stillPlan(p), { base: 0, over: null, overAlpha: 0, pShown: 0 }, `p=${p}`);
  for (const p of [0.33, 0.5, 0.67]) assert.deepEqual(stillPlan(p), { base: 0.5, over: null, overAlpha: 0, pShown: 0.5 }, `p=${p}`);
  for (const p of [0.83, 0.95, 1]) assert.deepEqual(stillPlan(p), { base: 1, over: null, overAlpha: 0, pShown: 1 }, `p=${p}`);
});

test('[WO-003] crossfade 0 → .5 on (.17, .33): opacity ramps linearly, the still at higher opacity is shown', () => {
  const e = 1e-9;
  let s = stillPlan(0.17 + e);
  assert.equal(s.base, 0); assert.equal(s.over, 0.5); assert.ok(s.overAlpha > 0 && s.overAlpha < 1e-6); assert.equal(s.pShown, 0);
  s = stillPlan(0.25);
  assert.ok(near(s.overAlpha, 0.5)); assert.equal(s.pShown, 0); // exactly half: base still wins (strictly greater rule)
  s = stillPlan(0.25 + 1e-6);
  assert.ok(s.overAlpha > 0.5); assert.equal(s.pShown, 0.5);
  s = stillPlan(0.33 - e);
  assert.ok(s.overAlpha < 1 && s.overAlpha > 1 - 1e-6); assert.equal(s.over, 0.5); assert.equal(s.pShown, 0.5);
});

test('[WO-003] crossfade .5 → 1 on (.67, .83)', () => {
  const e = 1e-9;
  let s = stillPlan(0.67 + e);
  assert.equal(s.base, 0.5); assert.equal(s.over, 1); assert.ok(s.overAlpha > 0 && s.overAlpha < 1e-6); assert.equal(s.pShown, 0.5);
  s = stillPlan(0.75);
  assert.ok(near(s.overAlpha, 0.5)); assert.equal(s.pShown, 0.5);
  s = stillPlan(0.79);
  assert.ok(near(s.overAlpha, 0.75)); assert.equal(s.pShown, 1);
  s = stillPlan(0.83 - e);
  assert.ok(s.overAlpha > 1 - 1e-6); assert.equal(s.pShown, 1);
});

test('[WO-003] overAlpha = r(p, a, b) across both fades, sampled at Δp = 0.001', () => {
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000;
    const s = stillPlan(p);
    const inFade1 = p > 0.17 && p < 0.33;
    const inFade2 = p > 0.67 && p < 0.83;
    if (inFade1) assert.ok(near(s.overAlpha, (p - 0.17) / 0.16, 1e-9), `p=${p}`);
    else if (inFade2) assert.ok(near(s.overAlpha, (p - 0.67) / 0.16, 1e-9), `p=${p}`);
    else { assert.equal(s.overAlpha, 0, `p=${p}`); assert.equal(s.over, null, `p=${p}`); }
    // C1 invariants.
    assert.ok([0, 0.5, 1].includes(s.base));
    assert.equal(s.pShown, s.overAlpha > 0.5 ? s.over : s.base);
    assert.ok(s.overAlpha >= 0 && s.overAlpha <= 1);
    assert.ok(!Object.is(s.overAlpha, -0));
  }
});

test('[WO-003] pShown is monotone in p and steps only at the fade midpoints', () => {
  let prev = 0;
  const steps = [];
  for (let i = 0; i <= 10000; i++) {
    const p = i / 10000;
    const { pShown } = stillPlan(p);
    assert.ok(pShown >= prev);
    if (pShown !== prev) steps.push(p);
    prev = pShown;
  }
  assert.deepEqual(steps, [0.2501, 0.7501]);
});

test('[WO-003] seams stay identity: p = 0 and p = 1 are stills; input clamps; non-finite throws', () => {
  assert.equal(stillPlan(0).pShown, 0);
  assert.equal(stillPlan(1).pShown, 1);
  assert.deepEqual(stillPlan(-0.2), stillPlan(0));
  assert.deepEqual(stillPlan(1.7), stillPlan(1));
  assert.throws(() => stillPlan(NaN), RangeError);
  assert.throws(() => stillPlan(Infinity), RangeError);
});

test('[WO-003] stillPlan is pure: JSON-clean and equal on repeat calls', () => {
  for (let i = 0; i < 200; i++) {
    const p = (i * 0.618034) % 1;
    const a = stillPlan(p);
    assert.deepEqual(a, stillPlan(p));
    assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
  }
});
