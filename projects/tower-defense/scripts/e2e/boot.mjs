// Headless boot [A4]: the built game loads, the hook is ready, a frame renders, zero console errors.
import { join } from 'node:path';
import { evidenceDir, fail, launch, ok, openGame, serveDist } from './lib.mjs';

const server = await serveDist();
const browser = await launch();
try {
  const { page, problems, readyMs } = await openGame(browser, server.url);
  // Architecture budget: hook ready() ≤ 1.5 s after navigation from dist/.
  readyMs <= 1500 ? ok(`first playable in ${readyMs} ms (≤ 1500)`) : fail(`hook ready took ${readyMs} ms (> 1500)`);
  await page.waitForTimeout(500);
  const scene = await page.evaluate(() => window.__inkfold.scene());
  scene === 'title' ? ok(`boots to the title scene`) : fail(`expected title scene, got ${scene}`);
  const painted = await page.evaluate(() => {
    const c = document.getElementById('game');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4 * 97) if (d[i + 3] > 0) n++;
    return n;
  });
  painted > 100 ? ok('canvas painted') : fail('canvas is blank');
  const appErrors = await page.evaluate(() => window.__inkfold.errors());
  const all = [...problems, ...appErrors];
  all.length === 0 ? ok('zero console errors') : fail(`console errors:\n    ${all.join('\n    ')}`);
  await page.screenshot({ path: join(await evidenceDir('boot'), 'boot-1280x720.jpg'), type: 'jpeg', quality: 80 });
} finally {
  await browser.close();
  await server.close();
}
