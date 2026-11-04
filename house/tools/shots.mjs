// Reference pictures of the house from fixed views (?cam=x,z,yaw,pitch),
// so every change can be compared with the last: build/shots/<name>.png.
//   node house/tools/shots.mjs            all views
//   node house/tools/shots.mjs window     one view
// Run after house/build.sh. Software drawing here: right for looks only.
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

// yaw 0 looks at the hearth (−z); −90 looks east (+x), 90 west, 180 south.
export const VIEWS = {
  hall: '0.6,1.7,0,0',
  hearth: '0,-0.6,0,-12',
  window: '0.6,0.5,-90,5',
  door: '0.3,-1.2,180,0',
};

const require = createRequire(import.meta.url);
const loadPlaywright = () => {
  try { return require('playwright'); } catch {}
  return require(join(process.execPath, '../../lib/node_modules/playwright'));
};
const GPU_ARGS = ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader',
                  '--use-webgpu-adapter=swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'];
const root = 'site';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json' };
const server = createServer((req, res) => {
  const path = join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!path.startsWith(root) || !existsSync(path)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
}).listen(0);
const url = `http://localhost:${server.address().port}`;
mkdirSync('build/shots', { recursive: true });

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VIEWS);
const { chromium } = loadPlaywright();
const browser = await chromium.launch({ args: GPU_ARGS });
for (const name of names) {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  await page.goto(`${url}/?cam=${VIEWS[name]}`);
  const end = Date.now() + 180000;
  while (Date.now() < end) {
    const s = await page.evaluate(() => window.houseState || null);
    if (s && s.ready && s.frames >= 3) break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(6000);  // bounced light and the eyes settle
  await page.screenshot({ path: `build/shots/${name}.png`, timeout: 90000 }).catch((e) => console.log(`no picture for ${name}: ${e.message}`));
  console.log(`build/shots/${name}.png`);
  await page.close();
}
await browser.close();
server.close();
