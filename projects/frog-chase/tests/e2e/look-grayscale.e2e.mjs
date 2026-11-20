// Polish 3 / §10: at 375 px, the layer-6 and layer-10 frames separate lily, soggy and curl by LUMINANCE
// features alone (no hue): the hard shadow band (lily, curl), the pale fold crescent (curl), neither (soggy).
// Reads the stage canvas through getImageData at the circles __lily.pads() reports.
import { check, done, VIEWPORTS, withPage } from './harness.mjs';

await withPage('look grayscale 375', { viewport: VIEWPORTS.mobile }, async ({ page }) => {
  const out = await page.evaluate(() => {
    const l = window.__lily;
    l.manualClock(true);
    const stage = document.getElementById('stage');
    const ctx = stage.getContext('2d');

    function classify(p) {
      const img = ctx.getImageData(0, 0, stage.width, stage.height).data;
      const W = stage.width;
      const lum = (x, y) => {
        const i = (Math.round(y) * W + Math.round(x)) * 4;
        return 0.2126 * img[i] + 0.7152 * img[i + 1] + 0.0722 * img[i + 2];
      };
      const median = (a) => a.sort((m, n) => m - n)[a.length >> 1];
      // Water reference: a ring well outside the pad.
      const water = [];
      for (let k = 0; k < 24; k++) water.push(lum(p.x + Math.cos((k / 24) * 6.283) * p.r * 1.55, p.y + Math.sin((k / 24) * 6.283) * p.r * 1.55));
      // Shadow band: just beyond the rim toward screen down-right (the cut-paper light).
      const band = [];
      const base = Math.atan2(0.45, 0.35);
      for (let a = -0.35; a <= 0.35; a += 0.07) for (const d of [1.06, 1.12]) band.push(lum(p.x + Math.cos(base + a) * p.r * d, p.y + Math.sin(base + a) * p.r * d));
      // Interior ring, excluding the chip sector (top-right): count pale (crescent) samples.
      const inner = [];
      for (let k = 0; k < 48; k++) {
        const a = (k / 48) * 6.283;
        const sa = Math.atan2(-0.74, 0.36);
        if (Math.abs(Math.atan2(Math.sin(a - sa), Math.cos(a - sa))) < 0.75) continue;
        for (const d of [0.45, 0.6]) inner.push(lum(p.x + Math.cos(a) * p.r * d, p.y + Math.sin(a) * p.r * d));
      }
      const body = median(inner.slice());
      const pale = inner.filter((v) => v > body + 28).length / inner.length;
      const shadow = median(water.slice()) - median(band.slice());
      const kind = pale >= 0.08 ? 'curl' : shadow >= 16 ? 'lily' : 'soggy';
      return { id: p.id, truth: p.kind, kind, shadow: Math.round(shadow), pale: +pale.toFixed(2) };
    }

    const results = {};
    for (const stopAt of [5, 9]) {
      l.setBot(null);
      l.restart(7);
      l.frame(1000 / 60, 4);
      l.setBot('runner', { stopAtLayer: stopAt });
      for (let i = 0; i < 4000; i++) {
        const s = l.sim();
        if (s.frog.layer >= stopAt && s.frog.phase === 'idle' && s.choices.length) break;
        l.frame(1000 / 60);
      }
      l.frame(1000 / 60, 40);
      const s = l.sim();
      const ids = new Set(s.choices.map((c) => c.padId));
      results[stopAt + 1] = l.pads().filter((p) => ids.has(p.id)).map(classify);
    }
    return results;
  });
  for (const layer of ['6', '10']) {
    const r = out[layer] ?? [];
    const kinds = new Set(r.map((x) => x.truth));
    check(r.length >= 2 && r.every((x) => x.kind === x.truth), `layer ${layer}: luminance classifier recovers every lit pad ${JSON.stringify(r)}`);
    check(layer === '6' ? kinds.has('soggy') && kinds.has('lily') : kinds.has('curl') && kinds.has('lily'), `layer ${layer}: the frame holds a trick and an honest pad side by side`);
  }
});
done();
