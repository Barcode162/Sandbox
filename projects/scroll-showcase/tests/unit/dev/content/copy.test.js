// WO-003 dev tests: §12.1 copy, §12.3 voice, the C7 credit, sceneLabel and templates.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { COPY, format, sceneLabel, sceneNumber, rewindStoppedStatus } from '../../../../site/js/core/copy.js';

/** Every string leaf of COPY with its dotted path. */
function leaves(o, path = 'COPY') {
  if (typeof o === 'string') return [[path, o]];
  return Object.entries(o).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
}
const ALL = leaves(COPY);

test('[WO-003] sceneLabel gives the long and short labels for all six scenes', () => {
  assert.equal(sceneLabel(3), '03 · Refraction');
  assert.equal(sceneLabel(3, true), '03 Refraction');
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((id) => sceneLabel(/** @type {any} */ (id), true)),
    ['01 Incidence', '02 Field', '03 Refraction', '04 Dichroic', '05 Agreement', '06 Return']);
  assert.equal(sceneLabel(1), '01 · Incidence');
  assert.equal(sceneLabel(6), '06 · Return');
  assert.equal(sceneNumber(4), '04');
  for (const bad of [0, 7, 2.5, NaN]) assert.throws(() => sceneLabel(/** @type {any} */ (bad)), RangeError);
});

test('[WO-003] key strings are the §12.1 text', () => {
  assert.equal(COPY.title, 'Bent Light: six refractions of one white beam');
  assert.equal(COPY.h1, 'Bent Light');
  assert.equal(COPY.subtitle, 'Six refractions of one white beam.');
  assert.equal(COPY.cue, 'Scroll to bend the light');
  assert.equal(COPY.skip, 'Skip to the colophon');
  assert.equal(COPY.navLabel, 'Scenes');
  assert.equal(COPY.captions[0], 'White light is every colour, waiting for an angle.');
  assert.equal(COPY.captions[5], 'Where you came in. The beam is still white.');
  assert.equal(COPY.pause.reduced, 'Breathing is off because your device asks for reduced motion');
  assert.equal(COPY.rewind.running, 'Rewinding · press any key to stop');
  assert.equal(COPY.rewind.runReduced, COPY.rewind.jump);
  assert.deepEqual([...COPY.contactSheet], ['light from the left', 'overhead', 'from the right']);
  assert.equal(COPY.noscript, 'Bent Light moves when JavaScript is on. Without it you see the first frame, which is also the last.');
  assert.equal(COPY.errorChip, "This scene couldn't draw on this device, so you're seeing its still.");
});

test('[WO-003] C7 / R7: the colophon credit line is the architecture wording', () => {
  assert.equal(COPY.colophon.credit,
    'The Space Grotesk typeface ships with this page under the SIL Open Font License 1.1, © 2020 The Space Grotesk Project Authors.');
});

test('[WO-003] §12.2 claim integrity: "Space Grotesk" in p2 only in the loaded variant', () => {
  assert.match(COPY.colophon.p2Loaded, /set in Space Grotesk\.$/);
  assert.doesNotMatch(COPY.colophon.p2Otherwise, /Space Grotesk/);
  assert.match(COPY.colophon.p2Otherwise, /your system's own sans-serif\.$/);
  // The two variants differ only in the face they name.
  const stem = 'Seven colours, one beam, no images. Drawn with HTML, SVG and canvas, and set in ';
  assert.ok(COPY.colophon.p2Loaded.startsWith(stem) && COPY.colophon.p2Otherwise.startsWith(stem));
  // Reduced-motion p3 makes no breathing claim.
  assert.doesNotMatch(COPY.colophon.p3Reduced, /breath/);
});

test('[WO-003] six of each per-scene list; captions are one sentence ending in a full stop', () => {
  for (const k of ['sceneNames', 'captions', 'artLabels']) assert.equal(COPY[k].length, 6, k);
  for (const c of COPY.captions.slice(0, 5)) {
    assert.match(c, /\.$/);
    assert.equal(c.split(/[.?!](\s|$)/).filter((s) => s && s.trim()).length, 1, c);
  }
  for (const a of COPY.artLabels) assert.match(a, /^[A-Z].*\.$/);
});

test('[WO-003] §12.3 voice: British spelling, no exclamation marks, no stray whitespace', () => {
  const american = /\b(color|colors|colored|neighbor|neighbors|center|centered|gray|meter)\b/i;
  for (const [path, s] of ALL) {
    assert.doesNotMatch(s, american, path);
    assert.doesNotMatch(s, /!/, path);
    assert.equal(s, s.trim(), path);
    assert.doesNotMatch(s, / {2}/, path);
  }
  assert.ok(ALL.some(([, s]) => /\bcolours?\b/.test(s)));
});

test('[WO-003] only the declared templates carry placeholders, and only the spec ones', () => {
  const templated = ALL.filter(([, s]) => /\{\w+\}/.test(s)).map(([p]) => p).sort();
  assert.deepEqual(templated,
    ['COPY.placard.label', 'COPY.status.admire', 'COPY.status.admireStill', 'COPY.status.rewindStopped']);
  for (const [, s] of ALL) for (const m of s.matchAll(/\{(\w+)\}/g)) assert.ok(['NN', 'Scene', 'SCENE', 'G', 'phrase'].includes(m[1]));
});

test('[WO-003] format fills placeholders and refuses to leave one raw', () => {
  assert.equal(format('{NN} {Scene}', { NN: '03', Scene: 'Refraction' }), '03 Refraction');
  assert.throws(() => format('{NN} {Scene}', { NN: '03' }), RangeError);
  assert.equal(rewindStoppedStatus(3), "Rewind stopped. You're in 03 Refraction.");
  assert.equal(COPY.status.rewindDone, 'Back at the first beam.');
});

test('[WO-003] COPY is deeply frozen', () => {
  assert.ok(Object.isFrozen(COPY) && Object.isFrozen(COPY.captions) && Object.isFrozen(COPY.colophon));
  assert.throws(() => { /** @type {any} */ (COPY).title = 'x'; }, TypeError);
});
