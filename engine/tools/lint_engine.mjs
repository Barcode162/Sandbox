// Keeps Looped an engine of its own: nothing in engine/looped/ includes a
// file from outside the engine (a game's code), and nothing names a game's
// page objects. The engine talks to its page only through window.loopedHost
// (looped/host.h). Carried over from Bar3D's tools/lint_engine.mjs.
//   node tools/lint_engine.mjs        (run from engine/)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const bad = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(cpp|h|wgsl|js)$/.test(name)) continue;
    readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      const inc = line.match(/#include\s+"([^"]+)"/);
      if (inc && !inc[1].startsWith('looped/')) bad.push(`${p}:${i + 1}: includes a file outside the engine: ${line.trim()}`);
      if (/bar3d|hearthwake/.test(line)) bad.push(`${p}:${i + 1}: names a game's page objects; use window.loopedHost: ${line.trim()}`);
    });
  }
};
walk('looped');
if (bad.length) { console.log(bad.join('\n')); console.log(`FAIL  engine lint: ${bad.length} line(s)`); process.exit(1); }
console.log('ok  engine lint: looped/ includes only its own files and names no game');
