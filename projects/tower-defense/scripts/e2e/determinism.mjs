// Frame-rate independence (criterion 5): two fresh pages on the manual clock play the win script through
// the real app loop at 30 Hz and at 144 Hz. Outcome, round, tick, lives, money, pops and stateHash must be
// exactly equal (not within a tolerance), and the run must finish (not 'running').
// Evidence: evidence-local/determinism/determinism.json.
import { allErrors, check, fail, hook, launch, ok, openGame, serveDist, writeEvidence } from './lib.mjs';

const RATES = [30, 144];
const FIELDS = ['outcome', 'round', 'tick', 'lives', 'money', 'pops', 'hash'];

async function run(browser, url, hz) {
  const { page, problems } = await openGame(browser, url);
  try {
    await hook(page, 'useManualClock');
    const t0 = Date.now();
    const r = await hook(page, 'playScript', 'win', hz);
    return { hz, ms: Date.now() - t0, ...r, errors: await allErrors(page, problems) };
  } finally {
    await page.close();
  }
}

const server = await serveDist();
const browser = await launch();
let runs;
try {
  runs = await Promise.all(RATES.map((hz) => run(browser, server.url, hz)));
} finally {
  await browser.close();
  await server.close();
}

for (const r of runs) {
  if (r.error) fail(`playScript('win', ${r.hz}): ${r.error}`);
  else check(r.value.outcome !== 'running', `${r.hz} Hz: ${r.value.outcome} at R${r.value.round}, tick ${r.value.tick}, hash ${r.value.hash} (${(r.ms / 1000).toFixed(1)} s)`,
    `${r.hz} Hz: the script stopped while still 'running' at R${r.value.round}`);
  check(r.errors.length === 0, `${r.hz} Hz page: zero console errors`, `${r.hz} Hz page errors:\n    ${r.errors.join('\n    ')}`);
}
const [a, b] = runs;
if (a.value && b.value) {
  const diff = FIELDS.filter((f) => a.value[f] !== b.value[f]);
  check(diff.length === 0, `30 Hz and 144 Hz are identical on ${FIELDS.join(', ')}`,
    `30 Hz vs 144 Hz differ: ${diff.map((f) => `${f} ${a.value[f]} ≠ ${b.value[f]}`).join(', ')}`);
}
await writeEvidence('determinism', 'determinism.json', runs);
if (!process.exitCode) ok('determinism evidence → evidence-local/determinism/determinism.json');
