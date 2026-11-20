// scripts/serve.mjs: zero-dependency static server (K19).
// - Binds 127.0.0.1 ONLY (never 0.0.0.0 or ::).
// - PORT (default 4173); SITE_DIR (default `site`, relative to the project) is served at `/`;
//   `dev/` is served at `/__dev/`.
// - Rejects NUL bytes, backslashes and `..` segments, raw or decoded, with 400. Resolves with
//   path.resolve and checks the result stays under the served root. Misses are 404.
// Usage: `node scripts/serve.mjs` or import { createServer } for tests.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const HOST = '127.0.0.1';
const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @type {Record<string, string>} */
export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
};

/** @param {string} p */
const hasBadSegment = (p) => p.includes('\0') || p.includes('\\') || p.split('/').some((s) => s === '..');

/**
 * @param {{ siteDir?: string; devDir?: string }} [opts]
 * @returns {http.Server}
 */
export function createServer(opts = {}) {
  const siteRoot = path.resolve(PROJECT, opts.siteDir ?? process.env.SITE_DIR ?? 'site');
  const devRoot = path.resolve(PROJECT, opts.devDir ?? 'dev');

  return http.createServer(async (req, res) => {
    /** @param {number} code @param {string} msg */
    const fail = (code, msg) => {
      res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      res.end(msg);
    };
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405, 'Method Not Allowed');
      const raw = (req.url ?? '/').split('?')[0].split('#')[0];
      if (hasBadSegment(raw)) return fail(400, 'Bad Request');
      let decoded;
      try {
        decoded = decodeURIComponent(raw); // decode exactly once
      } catch {
        return fail(400, 'Bad Request');
      }
      if (hasBadSegment(decoded)) return fail(400, 'Bad Request');

      let root = siteRoot;
      let rel = decoded;
      if (decoded === '/__dev' || decoded.startsWith('/__dev/')) {
        root = devRoot;
        rel = decoded.slice('/__dev'.length) || '/';
      }
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.resolve(root, '.' + rel);
      if (file !== root && !file.startsWith(root + path.sep)) return fail(400, 'Bad Request');

      let info;
      try {
        info = await stat(file);
      } catch {
        return fail(404, 'Not Found');
      }
      if (!info.isFile()) return fail(404, 'Not Found');
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
        'content-length': body.length,
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      fail(500, 'Internal Server Error');
    }
  });
}

/**
 * @param {number} port
 * @returns {Promise<http.Server>}
 */
export function listen(port) {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, HOST, () => resolve(server));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 4173);
  listen(port).then((server) => {
    const addr = /** @type {import('node:net').AddressInfo} */ (server.address());
    process.stdout.write(`Bent Light: serving ${process.env.SITE_DIR ?? 'site'} at http://${addr.address}:${addr.port}/ (dev harness at /__dev/harness.html)\n`);
  });
}
