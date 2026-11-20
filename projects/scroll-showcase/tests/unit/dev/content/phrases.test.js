// WO-003 dev tests: §7.5 placardPhrase (every boundary and midpoint), §7.4 placardLabel,
// §7.7 admireAnnouncement, and #39 (phrase under reduced motion uses the still's p).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PHRASES, placardPhrase, placardLabel, admireAnnouncement } from '../../../../site/js/core/phrases.js';
import { stillPlan } from '../../../../site/js/core/reduced.js';

/** @type {import('../../../../site/js/types.js').SceneId[]} */
const IDS = [1, 2, 3, 4, 5, 6];

// §7.5 cut points, transcribed independently of phrases.js.
const CUTS = {
  1: [0.04, 0.25, 0.45, 0.6, 0.88],
  2: [0.05, 0.161, 0.329, 0.497, 0.665, 0.833, 0.95],
  3: [0.1, 0.42, 0.58, 0.88],
  4: [0.1, 0.3, 0.44, 0.56, 0.8, 0.96],
  5: [0.08, 0.25, 0.4, 0.7, 0.93],
  6: [0.4, 0.52, 0.8],
};

test('[WO-003] the phrase table has the §7.5 band starts for all six scenes', () => {
  assert.equal(PHRASES.length, 6);
  for (const id of IDS) assert.deepEqual(PHRASES[id - 1].map(([a]) => a), [0, ...CUTS[id]], `scene ${id}`);
});

test('[WO-003] every boundary opens the next band (half-open [a, b)); just below it stays in the previous one (#39)', () => {
  for (const id of IDS) {
    CUTS[id].forEach((cut, i) => {
      assert.deepEqual(placardPhrase(id, cut), { index: i + 1, text: PHRASES[id - 1][i + 1][1] }, `S${id} p=${cut}`);
      assert.equal(placardPhrase(id, cut - 1e-9).index, i, `S${id} p=${cut}−ε`);
    });
    assert.equal(placardPhrase(id, 0).index, 0, `S${id} p=0`);
  }
});

test('[WO-003] the last band is closed: p = 1 is the last phrase (#39)', () => {
  for (const id of IDS) {
    const last = PHRASES[id - 1].length - 1;
    assert.deepEqual(placardPhrase(id, 1), { index: last, text: PHRASES[id - 1][last][1] }, `S${id}`);
  }
});

test('[WO-003] every band midpoint returns that band’s phrase (U-6)', () => {
  for (const id of IDS) {
    const edges = [0, ...CUTS[id], 1];
    for (let i = 0; i < edges.length - 1; i++) {
      const mid = (edges[i] + edges[i + 1]) / 2;
      assert.equal(placardPhrase(id, mid).index, i, `S${id} mid ${mid}`);
    }
  }
});

test('[WO-003] spot phrases from the spec text', () => {
  assert.equal(placardPhrase(4, 0.5).text, 'Light overhead; every facet answers.');
  assert.equal(placardPhrase(2, 0.4).text, 'Saffron: the brightest room in the house.');
  assert.equal(placardPhrase(1, 0).text, 'White, waiting for an angle.');
  assert.equal(placardPhrase(6, 0.45).text, 'An empty wall. Rest here.');
  assert.equal(placardPhrase(5, 1).text, 'Agreed: white.');
  assert.equal(placardPhrase(3, 0.9).text, 'Three pieces of glass on a shelf.');
});

test('[WO-003] p outside [0, 1] clamps; non-finite p and bad ids throw', () => {
  assert.equal(placardPhrase(2, -0.5).index, 0);
  assert.equal(placardPhrase(2, 1.5).index, 7);
  assert.throws(() => placardPhrase(2, NaN), RangeError);
  assert.throws(() => placardPhrase(/** @type {any} */ (7), 0.5), RangeError);
});

test('[WO-003] every phrase ends in a full stop and contains no exclamation mark', () => {
  for (const bands of PHRASES) for (const [, t] of bands) { assert.match(t, /\.$/); assert.doesNotMatch(t, /!/); }
});

test('[WO-003] placardLabel: `04 · DICHROIC · HELD AT 62%`, Math.round(100·G)', () => {
  assert.equal(placardLabel(4, 0.62), '04 · DICHROIC · HELD AT 62%');
  assert.equal(placardLabel(1, 0), '01 · INCIDENCE · HELD AT 0%');
  assert.equal(placardLabel(6, 1), '06 · RETURN · HELD AT 100%');
  assert.equal(placardLabel(3, 0.345), '03 · REFRACTION · HELD AT 35%'); // Math.round(34.5) = 35
  assert.equal(placardLabel(2, 0.2049), '02 · FIELD · HELD AT 20%');
  assert.equal(placardLabel(5, 1.2), '05 · AGREEMENT · HELD AT 100%');
  assert.throws(() => placardLabel(5, Infinity), RangeError);
});

test('[WO-003] admireAnnouncement matches both §7.7 variants exactly', () => {
  const phrase = placardPhrase(4, 0.5).text;
  assert.equal(admireAnnouncement(4, phrase, true),
    'Admire mode, 04 Dichroic: Light overhead; every facet answers. Controls hidden; the scene is breathing. Scroll, press a key or move the pointer to continue.');
  assert.equal(admireAnnouncement(4, phrase, false),
    'Admire mode, 04 Dichroic: Light overhead; every facet answers. Controls hidden. Scroll, press a key or move the pointer to continue.');
});

test('[WO-003] under reduced motion the phrase follows pShown, at every still and fade boundary (#39)', () => {
  // The phrase for the still on screen, not for the scroll position.
  const shown = (id, p) => placardPhrase(id, stillPlan(p).pShown);
  for (const id of IDS) {
    for (const p of [0, 0.1, 0.17, 0.2, 0.25]) assert.deepEqual(shown(id, p), placardPhrase(id, 0), `S${id} p=${p}`);
    for (const p of [0.2501, 0.33, 0.5, 0.67, 0.75]) assert.deepEqual(shown(id, p), placardPhrase(id, 0.5), `S${id} p=${p}`);
    for (const p of [0.7501, 0.83, 0.9, 1]) assert.deepEqual(shown(id, p), placardPhrase(id, 1), `S${id} p=${p}`);
  }
  // Example: Scene 4 at p 0.36 (in the middle still) shows the overhead phrase, not "Low light from the left."
  assert.equal(placardPhrase(4, 0.36).text, 'Low light from the left.');
  assert.equal(shown(4, 0.36).text, 'Light overhead; every facet answers.');
});
