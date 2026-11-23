// scripts/probe-layout.mjs — screen-space layout probe for the seed (M-0002 round 2, F-019/F-020/F-030).
// Usage: npx vite preview --port 4180 & node scripts/probe-layout.mjs [baseUrl] [outDir]
// For each lens at 1440×900, after the morph settles, prints:
//   - near pairs: node pairs closer than 22 px on screen (and the Heat cluster's minimum),
//   - ring-vs-flowchart clearance: the smallest screen gap between a road bead and a pathway node,
//   - labels over cores and chips over cores/labels (from the live overlay DOM),
//   - halo chroma: max(R,G,B) − min(R,G,B) of the median pixel 5–7 px from each concept core.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const seedIds = JSON.parse(readFileSync(new URL('../src/seed/memory.json', import.meta.url), 'utf8')).nodes.map((n) => n.id);

const base = process.argv[2] ?? 'http://127.0.0.1:4180/';
const out = process.argv[3] ?? '';
if (out) mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.addInitScript((ids) => { window.__probeIds = ids; }, seedIds);
await page.goto(base + '?seed=1');
await page.waitForFunction(() => window.__constellation?.state?.().introDone === true, undefined, { timeout: 30000 });
await page.waitForTimeout(800);

const HEAT = ['temperature', 'boiling-point', 'flame-step', 'safe-to-touch', 'room', 'heat', 'steam', 'soup', 'burn', 'energy', 'molecules', 'kelvin', 'stove', 'pot', 'ice', 'thermometer'];
let fail = 0;
for (const [key, lens] of [['1', 'cook'], ['2', 'physicist'], ['3', 'child']]) {
  await page.keyboard.press(key);
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__constellation.idle());
  await page.waitForTimeout(900);
  const r = await page.evaluate((HEAT) => {
    const h = window.__constellation;
    const s = h.state();
    const ids = [];
    // Every node id: labels by id from the seed via nodeIdByLabel is lossy; use screenPosition over known prefixes.
    const all = window.__probeIds ?? [];
    for (const id of all) { const p = h.screenPosition(id); if (p) ids.push({ id, ...p }); }
    const near = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const d = Math.hypot(ids[i].x - ids[j].x, ids[i].y - ids[j].y);
      if (d < 22) near.push(`${ids[i].id}~${ids[j].id}:${d.toFixed(0)}`);
    }
    const heat = ids.filter((n) => HEAT.includes(n.id));
    let heatMin = Infinity;
    for (let i = 0; i < heat.length; i++) for (let j = i + 1; j < heat.length; j++) heatMin = Math.min(heatMin, Math.hypot(heat[i].x - heat[j].x, heat[i].y - heat[j].y));
    const xs = heat.map((n) => n.x), ys = heat.map((n) => n.y);
    const road = ids.filter((n) => n.id.startsWith('road-'));
    const flow = ids.filter((n) => /^[pq]\d$/.test(n.id));
    let ringGap = Infinity;
    for (const a of road) for (const b of flow) ringGap = Math.min(ringGap, Math.hypot(a.x - b.x, a.y - b.y));
    const rect = (el) => el.getBoundingClientRect();
    const hit = (r, p, rad) => p.x + rad > r.left && p.x - rad < r.right && p.y + rad > r.top && p.y - rad < r.bottom;
    const lblEls = [...document.querySelectorAll(".overlay-layer .lbl.on")]; const lbls = lblEls.map(rect); window.__lblBad = lblEls.filter((e) => ids.some((p) => hit(rect(e), p, 3))).map((e) => e.textContent + "@" + ids.filter((p) => hit(rect(e), p, 3)).map((p) => p.id).join("+"));
    const chips = [...document.querySelectorAll('.overlay-layer .chip.on')].map((e) => ({ r: rect(e), t: e.textContent }));
    const lblOverCore = lbls.filter((r) => ids.some((p) => hit(r, p, 3))).length;
    const chipBad = chips.filter((c) => ids.some((p) => hit(c.r, p, 3)) || lbls.some((l) => c.r.left < l.right && c.r.right > l.left && c.r.top < l.bottom && c.r.bottom > l.top)).map((c) => c.t);
    return { lblBad: window.__lblBad, n: ids.length, near, heatMin, heatW: Math.max(...xs) - Math.min(...xs), heatH: Math.max(...ys) - Math.min(...ys), ringGap, lbls: lbls.length, lblOverCore, chips: chips.length, chipBad, heatPts: heat };
  }, HEAT);
  // Halo chroma: sample a ring 5–7 px from each Heat-cluster core; report the median chroma.
  const png = await page.screenshot();
  if (out) await page.screenshot({ path: `${out}/${lens}.png` });
  const chroma = await page.evaluate(async ({ b64, pts }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const vals = [];
    const rgbs = [];
    for (const p of pts) {
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        for (const rr of [5, 6, 7]) {
          const d = g.getImageData(Math.round(p.x + Math.cos(ang) * rr), Math.round(p.y + Math.sin(ang) * rr), 1, 1).data;
          if (d[0] + d[1] + d[2] < 60) continue;
          vals.push(Math.max(d[0], d[1], d[2]) - Math.min(d[0], d[1], d[2]));
          rgbs.push([d[0], d[1], d[2]]);
        }
      }
    }
    vals.sort((x, y) => x - y);
    const mean = [0, 1, 2].map((k) => Math.round(rgbs.reduce((s, v) => s + v[k], 0) / Math.max(1, rgbs.length)));
    return { median: vals[Math.floor(vals.length / 2)] ?? 0, samples: vals.length, mean };
  }, { b64: png.toString('base64'), pts: r.heatPts });
  delete r.heatPts;
  console.log(`\n== ${lens}: ${r.n} nodes on screen`);
  console.log(`  heat cluster ${r.heatW.toFixed(0)}×${r.heatH.toFixed(0)} px, min core gap ${r.heatMin.toFixed(1)} px (target ≥ 28)`);
  console.log(`  ring ↔ flowchart min gap ${r.ringGap.toFixed(1)} px (target ≥ 40)`);
  console.log(`  near pairs <22px (${r.near.length}): ${r.near.join(' ')}`);
  console.log(`  labels ${r.lbls}, over a core ${r.lblOverCore} ${r.lblBad.join(" ")}; chips ${r.chips}, colliding ${r.chipBad.length} ${r.chipBad.join(' | ')}`);
  console.log(`  halo chroma median ${chroma.median}/255 over ${chroma.samples} samples, mean rgb ${chroma.mean} (target ≥ 20)`);
  if (r.heatMin < 28 || r.ringGap < 40 || r.lblOverCore || r.chipBad.length || chroma.median < 20) fail++;
}
await browser.close();
console.log(fail ? `\nPROBE: ${fail} lens(es) below target` : '\nPROBE: all lenses on target');
