// WO-003 dev test: the content modules satisfy the frozen C2 interfaces in types.d.ts.
// The typed assignments below are checked by `npm run typecheck`; the runtime test checks
// that every contract export exists with the right kind.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as copyMod from '../../../../site/js/core/copy.js';
import * as phrasesMod from '../../../../site/js/core/phrases.js';
import * as reducedMod from '../../../../site/js/core/reduced.js';
import * as tokensMod from '../../../../site/js/core/tokens.js';

/** @type {import('../../../../site/js/types.js').CoreCopy} */
const copyContract = copyMod;
/** @type {import('../../../../site/js/types.js').CorePhrases} */
const phrasesContract = phrasesMod;
/** @type {import('../../../../site/js/types.js').CoreReduced} */
const reducedContract = reducedMod;
/** @type {import('../../../../site/js/types.js').CoreTokens} */
const tokensContract = tokensMod;

test('[WO-003] content modules export every C2 member', () => {
  assert.equal(typeof copyContract.COPY, 'object');
  assert.equal(typeof copyContract.sceneLabel, 'function');
  for (const f of ['placardPhrase', 'placardLabel', 'admireAnnouncement']) assert.equal(typeof phrasesContract[f], 'function', f);
  assert.equal(typeof reducedContract.stillPlan, 'function');
  assert.equal(typeof tokensContract.TOKENS, 'object');
  assert.equal(tokensContract.BANDS.length, 7);
  for (const k of ['title', 'metaDescription', 'h1', 'subtitle', 'cue', 'skip', 'navLabel', 'sceneNames', 'captions',
    'artLabels', 'pause', 'status', 'rewind', 'contactSheet', 'colophon', 'noscript', 'errorChip']) {
    assert.ok(k in copyContract.COPY, `COPY.${k}`);
  }
});
