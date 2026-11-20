// K6 purity guard for the WO-002 core modules, until static guard WO-012 covers
// them: no DOM, no clock, no ambient randomness, no imports beyond ./math.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILES = ['math.js', 'geometry.js'].map((f) => ({
  name: f,
  url: new URL(`../../../../site/js/core/${f}`, import.meta.url),
}));

/** Source without comments, so prose like "no DOM" cannot trip a pattern. */
function code(url) {
  return readFileSync(fileURLToPath(url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const FORBIDDEN = [
  /\bwindow\b/, /\bdocument\b/, /\bglobalThis\b/, /\bnavigator\b/, /\blocalStorage\b/,
  /\bDate\b/, /\bperformance\b/, /\bMath\.random\b/, /\bcrypto\b/,
  /\brequestAnimationFrame\b/, /\bsetTimeout\b/, /\bsetInterval\b/, /\bqueueMicrotask\b/,
  /\bgetBoundingClientRect\b/, /\bdevicePixelRatio\b/, /\bscrollY\b/, /\bconsole\b/,
];

for (const { name, url } of FILES) {
  test(`${name} references no DOM, clock, randomness or console`, () => {
    const src = code(url);
    for (const re of FORBIDDEN) assert.ok(!re.test(src), `${name} matches ${re}`);
  });

  test(`${name} imports only sibling core maths`, () => {
    const imports = [...code(url).matchAll(/\bimport\s[^'"]*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const spec of imports) assert.equal(spec, './math.js', `${name} imports ${spec}`);
  });
}
