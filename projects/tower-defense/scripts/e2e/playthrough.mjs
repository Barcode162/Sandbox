// Scripted playthrough (success criterion 2, board condition 2) against window.__inkfold:
//  - playScript('win', 60) → outcome 'victory', lives ≥ WIN_MIN_SEEDS (40)
//  - playScript('loss', 60) → outcome 'defeat' with round ≤ 12, scene 'gameover'
//  - restart() < 2000 ms from game over and from victory → summary R1 / 650 sheets / 100 seeds, scene 'play'
//  - the browser RunSummary of both scripts is identical to the headless Vitest run (every field)
// Evidence: evidence-local/playthrough/{playthrough.json, vitest.json, after-restart-*.jpg}.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, allErrors, check, evidenceDir, fail, hook, launch, ok, openGame, serveDist, writeEvidence } from './lib.mjs';

// src/data/scripts.ts and src/data/economy.ts (frozen): WIN_MIN_SEEDS, LOSS_BY_ROUND, start money/lives.
const WIN_MIN_SEEDS = 40;
const LOSS_BY_ROUND = 12;
const START = { round: 1, money: 650, lives: 100 };
const FIELDS = ['outcome', 'round', 'tick', 'lives', 'money', 'pops', 'hash'];

const dir = await evidenceDir('playthrough');
const parityFile = join(dir, 'vitest.json');

function runVitest() {
  return new Promise((done) => {
    const t0 = Date.now();
    const p = spawn('npx', ['vitest', 'run', '--config', 'scripts/e2e/parity/vitest.config.ts'], {
      cwd: ROOT, env: { ...process.env, INKFOLD_PARITY_OUT: parityFile }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let log = '';
    p.stdout.on('data', (d) => { log += d; });
    p.stderr.on('data', (d) => { log += d; });
    p.on('close', (code) => done({ code, ms: Date.now() - t0, log }));
  });
}

async function playAndRestart(browser, url, name) {
  const { page, problems } = await openGame(browser, url);
  const r = { name };
  try {
    await hook(page, 'useManualClock');
    const t0 = Date.now();
    const run = await hook(page, 'playScript', name, 60);
    r.playMs = Date.now() - t0;
    if (run.error) { r.error = run.error; return r; }
    r.summary = run.value;
    r.sceneAfter = (await hook(page, 'scene')).value;
    const rs = await hook(page, 'restart');
    if (rs.error) { r.restartError = rs.error; return r; }
    r.restartMs = rs.value;
    r.afterRestart = (await hook(page, 'summary')).value;
    r.sceneAfterRestart = (await hook(page, 'scene')).value;
    await hook(page, 'advance', 1000 / 60, 60); // one frame: the fresh board must be what is drawn
    await page.screenshot({ path: join(dir, `after-restart-${name}.jpg`), type: 'jpeg', quality: 80 });
  } finally {
    r.errors = await allErrors(page, problems);
    await page.close();
  }
  return r;
}

const server = await serveDist();
const browser = await launch();
let vitest, win, loss;
try {
  [vitest, win, loss] = await Promise.all([runVitest(), playAndRestart(browser, server.url, 'win'), playAndRestart(browser, server.url, 'loss')]);
} finally {
  await browser.close();
  await server.close();
}

let ref = null;
if (vitest.code === 0 || vitest.code === 1) ref = JSON.parse(await readFile(parityFile, 'utf8').catch(() => 'null'));
check(vitest.code === 0, `Vitest headless run: win and loss scripts meet their targets (${(vitest.ms / 1000).toFixed(1)} s)`,
  `Vitest headless run failed (exit ${vitest.code}): ${(vitest.log.match(/AssertionError[^\n]*|Error:[^\n]*/) ?? ['see vitest output'])[0]}`);

for (const r of [win, loss]) {
  if (r.error) { fail(`playScript('${r.name}', 60): ${r.error}`); continue; }
  const s = r.summary;
  if (r.name === 'win') {
    check(s.outcome === 'victory' && s.lives >= WIN_MIN_SEEDS, `win script: victory with ${s.lives} seeds (≥ ${WIN_MIN_SEEDS}) in ${(r.playMs / 1000).toFixed(1)} s`,
      `win script: expected victory with ≥ ${WIN_MIN_SEEDS} seeds, got ${s.outcome} at R${s.round} with ${s.lives} seeds`);
    check(r.sceneAfter === 'victory', `scene is 'victory' after the win`, `scene after the win is '${r.sceneAfter}', expected 'victory'`);
  } else {
    check(s.outcome === 'defeat' && s.round <= LOSS_BY_ROUND, `loss script: defeat at R${s.round} (≤ R${LOSS_BY_ROUND})`,
      `loss script: expected defeat by R${LOSS_BY_ROUND}, got ${s.outcome} at R${s.round}`);
    check(r.sceneAfter === 'gameover', `scene is 'gameover' after the loss`, `scene after the loss is '${r.sceneAfter}', expected 'gameover'`);
  }
  if (r.restartError) { fail(`restart() after ${r.name}: ${r.restartError}`); continue; }
  const a = r.afterRestart;
  check(r.restartMs < 2000, `restart after ${r.name}: ${r.restartMs.toFixed(1)} ms (< 2000)`, `restart after ${r.name} took ${r.restartMs} ms`);
  check(a && a.round === START.round && a.money === START.money && a.lives === START.lives && a.outcome === 'running' && r.sceneAfterRestart === 'play',
    `restart after ${r.name}: fresh R1 / 650 / 100 in scene 'play'`,
    `restart after ${r.name}: got R${a?.round} / ${a?.money} / ${a?.lives} (${a?.outcome}) in scene '${r.sceneAfterRestart}'`);
  if (ref?.[r.name]) {
    const diff = FIELDS.filter((f) => ref[r.name][f] !== s[f]);
    check(diff.length === 0, `${r.name} script: browser summary identical to Vitest (hash ${s.hash}, tick ${s.tick})`,
      `${r.name} script: browser and Vitest differ in ${diff.map((f) => `${f} ${s[f]} ≠ ${ref[r.name][f]}`).join(', ')}`);
  } else fail(`${r.name} script: no Vitest reference summary to compare`);
}
for (const r of [win, loss]) check(r.errors.length === 0, `${r.name} page: zero console errors`, `${r.name} page errors:\n    ${r.errors.join('\n    ')}`);

await writeEvidence('playthrough', 'playthrough.json', { vitest: ref, vitestMs: vitest.ms, browser: { win, loss } });
if (!process.exitCode) ok('playthrough evidence → evidence-local/playthrough/playthrough.json');
