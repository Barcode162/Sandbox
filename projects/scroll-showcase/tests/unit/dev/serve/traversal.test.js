// Raw node:http requests against scripts/serve.mjs (K19, R6).
// node:http sends the path verbatim (no dot-segment normalisation, architecture probe A8), unlike
// curl, so these requests really reach the traversal guard.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer, HOST } from '../../../../scripts/serve.mjs';

const PKG = readFileSync(fileURLToPath(new URL('../../../../package.json', import.meta.url)));
/** @type {http.Server} */
let server;
let port = 0;

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, HOST, () => r(undefined)));
  port = /** @type {import('node:net').AddressInfo} */ (server.address()).port;
});
after(() => new Promise((r) => server.close(() => r(undefined))));

/** @param {string} rawPath @returns {Promise<{ status: number; body: Buffer }>} */
function rawGet(rawPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: HOST, port, method: 'GET', path: rawPath }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('[serve] binds 127.0.0.1 only', () => {
  assert.equal(/** @type {import('node:net').AddressInfo} */ (server.address()).address, '127.0.0.1');
});

for (const p of ['/../package.json', '/%2e%2e/package.json', '/..%2fpackage.json', '/__dev/../../package.json', '/%2e%2e%5cpackage.json', '/%00']) {
  test(`[serve] traversal ${p} gets 400 or 404 and never leaks package.json`, async () => {
    const { status, body } = await rawGet(p);
    assert.ok(status === 400 || status === 404, `status ${status}`);
    assert.equal(body.includes(PKG), false);
    assert.equal(body.includes(Buffer.from('"devDependencies"')), false);
  });
}

test('[serve] serves site/ at / and dev/ at /__dev/ with MIME types; misses are 404', async () => {
  const index = await rawGet('/');
  assert.equal(index.status, 200);
  assert.match(index.body.toString(), /<title>Bent Light/);
  assert.equal((await rawGet('/js/main.js')).status, 200);
  assert.equal((await rawGet('/__dev/harness.html')).status, 200);
  assert.equal((await rawGet('/nope.js')).status, 404);
  const types = await new Promise((resolve) => {
    http.get({ host: HOST, port, path: '/fonts/space-grotesk-latin-wght-normal.woff2' }, (res) => {
      res.resume();
      resolve(res.headers['content-type']);
    });
  });
  assert.equal(types, 'font/woff2');
});
