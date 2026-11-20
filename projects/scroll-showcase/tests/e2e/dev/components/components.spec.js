// WO-004 dev checks for the shared render components (Bands, DotGrid,
// WhitePoint and the svg.js write helpers), run against the gallery at
// /__dev/components/. Pixel facts are read from device-scale screenshots.

import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
/// <reference path="./lib/gallery.d.ts" />
import { componentFiles, componentSource, decode, evidenceDir, key, rgb } from './lib/pixels.js';

const GALLERY = '/__dev/components/index.html';
const BAND_TOKENS = ['--band-1', '--band-2', '--band-3', '--band-4', '--band-5', '--band-6', '--band-7'];

/** @type {string[]} */
let problems = [];
test.beforeEach(({ page }) => {
  problems = [];
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`console.${msg.type()}: ${msg.text()}`);
  });
});
test.afterEach(() => {
  expect(problems, 'no console errors, warnings or page errors').toEqual([]);
});

/**
 * Open the gallery and wait until it has drawn and two frames have painted.
 * @param {import('@playwright/test').Page} page
 * @param {string} [query]
 */
async function open(page, query = '') {
  await page.goto(`${GALLERY}${query}`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.evaluate(() => document.fonts.ready);
  await frames(page);
}

/** @param {import('@playwright/test').Page} page */
function frames(page) {
  return page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(null)))));
}

/** @param {import('@playwright/test').Page} page */
async function bandColours(page) {
  const hexes = await page.evaluate((names) => {
    const css = getComputedStyle(document.documentElement);
    return names.map((n) => css.getPropertyValue(n));
  }, BAND_TOKENS);
  return hexes.map(rgb);
}

/**
 * Device pixels along the u axis at v = V/2. In portrait the stage is
 * transposed (K5), so u runs down the screen.
 * @param {import('./lib/pixels.js').Pixels} px
 * @param {{ U: number, V: number, dpr: number, landscape: boolean }} vp
 */
function scanU(px, vp) {
  const across = Math.floor((vp.V / 2) * vp.dpr);
  const n = Math.round(vp.U * vp.dpr);
  const line = [];
  for (let i = 0; i < n; i++) line.push(vp.landscape ? px.at(i, across) : px.at(across, i));
  return line;
}

/** Split a scan line into runs of identical colour. @param {[number, number, number][]} line */
function runs(line) {
  /** @type {{ colour: string, length: number }[]} */
  const out = [];
  for (const c of line) {
    const k = key(c);
    if (out.length && out[out.length - 1].colour === k) out[out.length - 1].length++;
    else out.push({ colour: k, length: 1 });
  }
  return out;
}

test.describe('svg.js', () => {
  test('WO-004 · el() picks the SVG namespace for SVG tags and SVG parents, HTML otherwise', async ({ page }) => {
    await open(page);
    const ns = await page.evaluate(() => {
      const { el } = window.__gallery.components;
      const svg = el('svg');
      const fo = el('foreignObject', {}, svg);
      return {
        svg: svg.namespaceURI,
        circle: el('circle').namespaceURI,
        div: el('div').namespaceURI,
        aInSvg: el('a', {}, svg).namespaceURI,
        aInHtml: el('a', {}, el('div')).namespaceURI,
        spanInForeignObject: el('span', {}, fo).namespaceURI,
        attrs: el('rect', { x: 2, width: 0.5, fill: null }).getAttribute('x'),
        appended: el('g', {}, svg).parentNode === svg,
      };
    });
    expect(ns).toEqual({
      svg: 'http://www.w3.org/2000/svg',
      circle: 'http://www.w3.org/2000/svg',
      div: 'http://www.w3.org/1999/xhtml',
      aInSvg: 'http://www.w3.org/2000/svg',
      aInHtml: 'http://www.w3.org/1999/xhtml',
      spanInForeignObject: 'http://www.w3.org/1999/xhtml',
      attrs: '2',
      appended: true,
    });
  });

  test('WO-004 · setAttrs and setStyles skip repeats but re-write a value restored after a different one', async ({ page }) => {
    await open(page);
    const log = await page.evaluate(() => {
      const { el, setAttrs, setStyles } = window.__gallery.components;
      const node = el('rect');
      const observer = new MutationObserver(() => {});
      observer.observe(node, { attributes: true });
      // After each call: [attributes written, DOM mutations seen, resulting value].
      /** @param {Record<string, number | null | undefined>} attrs */
      const step = (attrs) => [setAttrs(node, attrs), observer.takeRecords().length, node.getAttribute('x')];
      const steps = [
        step({ x: 1 }),
        step({ x: 1 }),         // same as last written: skipped
        step({ x: 2 }),         // a different intermediate value
        step({ x: 1 }),         // restored: written again
        step({ x: undefined }), // undefined: left alone
        step({ x: null }),      // null: removed
        step({ x: null }),
      ];
      observer.disconnect();
      const fresh = el('rect', { x: 1 }); // a recreated node starts with an empty cache
      const box = el('div');
      const styles = ['translate(1px, 0px)', 'translate(1px, 0px)', 'translate(2px, 0px)', 'translate(1px, 0px)']
        .map((t) => [setStyles(box, { transform: t }), box.style.transform]);
      let threw = '';
      try { setAttrs(node, { r: Number.NaN }); } catch (err) { threw = err.constructor.name; }
      return { steps, fresh: fresh.getAttribute('x'), styles, threw, r: node.getAttribute('r') };
    });
    expect(log.steps).toEqual([
      [1, 1, '1'],
      [0, 0, '1'],
      [1, 1, '2'],
      [1, 1, '1'],
      [0, 0, '1'],
      [1, 1, null],
      [0, 0, null],
    ]);
    expect(log.fresh).toBe('1');
    expect(log.styles).toEqual([
      [1, 'translate(1px, 0px)'],
      [0, 'translate(1px, 0px)'],
      [1, 'translate(2px, 0px)'],
      [1, 'translate(1px, 0px)'],
    ]);
    expect(log.threw, 'a non-finite value throws instead of reaching the DOM').toBe('RangeError');
    expect(log.r).toBeNull();
  });
});

test.describe('Bands', () => {
  const VIEWPORTS = [
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
    { width: 375, height: 812 },
  ];
  for (const dpr of [1, 1.5, 2]) {
    for (const size of VIEWPORTS) {
      test.describe(`${size.width}×${size.height} at DPR ${dpr}`, () => {
        test.use({ viewport: size, deviceScaleFactor: dpr });

        test('WO-004 · every device pixel along v = V/2 is exactly one band colour: no gap, no overlap, no seam', async ({ page }) => {
          for (const fixture of ['bands-chorus', 'bands-field']) {
            // Normal blend over a magenta sentinel shows any gap or anti-aliased seam;
            // screen blend over black also shows any overlap, as a mixed colour.
            for (const [blend, ground] of [['normal', 'sentinel'], ['screen', 'black']]) {
              await open(page, `?solo=${fixture}&blend=${blend}&ground=${ground}`);
              const colours = await bandColours(page);
              const { vp, rects } = await page.evaluate((id) => ({
                vp: window.__gallery.vp,
                rects: window.__gallery.drawn[id][0].layer.rects,
              }), fixture);
              const line = scanU(decode(await page.screenshot()), vp);
              const allowed = new Set(colours.map(key));
              const stray = line.map((c, i) => `${i}:${key(c)}`).filter((_, i) => !allowed.has(key(line[i])));
              expect(stray.slice(0, 5), `${fixture} ${blend}: device columns outside the band set`).toEqual([]);
              expect(runs(line), `${fixture} ${blend}: seven runs in band order with snapped widths`).toEqual(
                rects.map((r, i) => ({ colour: key(colours[i]), length: Math.round((r.u1 - r.u0) * dpr) })),
              );
            }
          }
        });
      });
    }
  }

  test('WO-004 · a call writes only transform and opacity, and a repeated call writes nothing', async ({ page }) => {
    await open(page, '?solo=bands-chorus');
    const result = await page.evaluate(async () => {
      const g = window.__gallery;
      const { instance } = g.drawn['bands-chorus'][0];
      const boxes = [...document.querySelectorAll('.bands .band')];
      const props = (b) => Object.fromEntries([...b.style].map((p) => [p, b.style.getPropertyValue(p)]));
      const before = boxes.map(props);
      const weighted = g.geometry.bandRectsFromWeights([1, 2, 9, 3, 1, 1, 1], g.vp);
      instance.set(weighted, g.vp, [1, 1, 1, 0.5, 1, 1, 1]);
      const after = boxes.map(props);
      const changed = new Set();
      boxes.forEach((_, i) => {
        for (const p of new Set([...Object.keys(before[i]), ...Object.keys(after[i])])) {
          if (before[i][p] !== after[i][p]) changed.add(p);
        }
      });
      const records = [];
      const observer = new MutationObserver((list) => records.push(...list));
      for (const b of boxes) observer.observe(b, { attributes: true });
      instance.set(weighted, g.vp, [1, 1, 1, 0.5, 1, 1, 1]);
      await new Promise((done) => setTimeout(done, 0));
      observer.disconnect();
      return { changed: [...changed].sort(), repeatMutations: records.length, count: boxes.length };
    });
    expect(result.count).toBe(7);
    expect(result.changed).toEqual(['opacity', 'transform']);
    expect(result.repeatMutations).toBe(0);
  });

  test('WO-004 · a frame restored after a different one is pixel-identical (the write cache never goes stale)', async ({ page }) => {
    await open(page, '?solo=bands-agreement');
    const first = await page.screenshot();
    await page.evaluate(async () => {
      const g = window.__gallery;
      const { instance, layer } = g.drawn['bands-agreement'][0];
      instance.set(g.geometry.bandRects(g.vp), g.vp);
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
      instance.set(layer.rects, g.vp);
    });
    await frames(page);
    const restored = await page.screenshot();
    expect(restored.equals(first)).toBe(true);
  });

  test('WO-004 · screen bands keep exact token colours over ink, and screen together where they overlap', async ({ page }) => {
    await open(page, '?solo=bands-agreement');
    const colours = await bandColours(page);
    const vp = await page.evaluate(() => window.__gallery.vp);
    const line = scanU(decode(await page.screenshot()), vp);
    const ink = rgb(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink')));
    const seen = new Set(line.map(key));
    expect(seen.has(key(ink)), 'ink shows between the outer beams').toBe(true);
    for (const c of [colours[0], colours[6]]) expect(seen.has(key(c)), `exact ${key(c)} where a beam stands alone`).toBe(true);
    const mixed = [...seen].filter((k) => k !== key(ink) && !colours.map(key).includes(k));
    expect(mixed.length, 'screened overlaps produce new colours').toBeGreaterThan(0);
  });
});

test.describe('DotGrid', () => {
  /**
   * Brightness-weighted centroid (CSS px, in u/v) of the pixels within
   * `radius` of (u, v), and the brightest value found there.
   * @param {import('./lib/pixels.js').Pixels} px
   * @param {{ dpr: number, landscape: boolean }} vp
   */
  function probe(px, vp, u, v, radius) {
    let sum = 0; let su = 0; let sv = 0; let peak = 0;
    const d = vp.dpr;
    for (let du = Math.floor((u - radius) * d); du < Math.ceil((u + radius) * d); du++) {
      for (let dv = Math.floor((v - radius) * d); dv < Math.ceil((v + radius) * d); dv++) {
        const [r] = vp.landscape ? px.at(du, dv) : px.at(dv, du);
        sum += r; su += r * (du + 0.5); sv += r * (dv + 0.5); peak = Math.max(peak, r);
      }
    }
    return { peak, u: sum ? su / sum / d : NaN, v: sum ? sv / sum / d : NaN };
  }

  const CASES = [
    { size: { width: 1440, height: 900 }, dpr: 1 },
    { size: { width: 1440, height: 900 }, dpr: 2 },
    { size: { width: 375, height: 812 }, dpr: 2 },
  ];
  for (const { size, dpr } of CASES) {
    test.describe(`${size.width}×${size.height} at DPR ${dpr}`, () => {
      test.use({ viewport: size, deviceScaleFactor: dpr });

      test('WO-004 · a vertex dot is centred exactly on (U/2, V/2), none at (U/2 + pitch/2, V/2), fill dots one pitch away', async ({ page }) => {
        await open(page, '?solo=dots-cobalt&ground=black');
        const show = (tones) => page.evaluate(async (t) => {
          const g = window.__gallery;
          const [dots, point] = g.drawn['dots-cobalt'];
          point.instance.set(null, 'ink25');
          dots.instance.set({ ...dots.layer.dg, vertexWhite: 0, fillWhite: 0, vertexInk: 0, fillInk: 0, ...t }, g.vp);
          await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
          return { vp: g.vp, pitch: dots.layer.dg.pitch };
        }, tones);

        const { vp, pitch } = await show({ vertexWhite: 1 });
        const cu = vp.U / 2; const cv = vp.V / 2;
        let px = decode(await page.screenshot());
        const centreDot = probe(px, vp, cu, cv, pitch / 2 - 1);
        expect(centreDot.peak).toBeGreaterThan(200);
        expect(Math.abs(centreDot.u - cu)).toBeLessThan(0.05);
        expect(Math.abs(centreDot.v - cv)).toBeLessThan(0.05);
        expect(probe(px, vp, cu + pitch / 2, cv, 3).peak, 'nothing at U/2 + pitch/2').toBe(0);
        expect(probe(px, vp, cu + pitch, cv, 3).peak, 'no vertex dot one pitch away').toBe(0);
        expect(probe(px, vp, cu + 2 * pitch, cv, 3).peak, 'next vertex dot at 2·pitch').toBeGreaterThan(200);

        await show({ fillWhite: 1 });
        px = decode(await page.screenshot());
        expect(probe(px, vp, cu, cv, 3).peak, 'fill subset leaves the centre empty').toBe(0);
        expect(probe(px, vp, cu + pitch / 2, cv, 3).peak).toBe(0);
        const fillDot = probe(px, vp, cu + pitch, cv, pitch / 2 - 1);
        expect(fillDot.peak).toBeGreaterThan(200);
        expect(Math.abs(fillDot.u - (cu + pitch))).toBeLessThan(0.05);
        expect(probe(px, vp, cu + pitch, cv + pitch, 3).peak, 'fill dot on the diagonal').toBeGreaterThan(200);
      });
    });
  }

  test('WO-004 · four pattern fills per grid, ids carry idPrefix, and two grids with different pitches coexist', async ({ page }) => {
    await open(page);
    const ids = await page.evaluate(() => [...document.querySelectorAll('.dotgrid')].map((g) => ({
      prefix: g.getAttribute('data-dotgrid'),
      fills: [...g.querySelectorAll('rect')].map((r) => r.getAttribute('fill')),
    })));
    expect(ids.length).toBe(3);
    const all = ids.flatMap((g) => g.fills);
    expect(new Set(all).size).toBe(all.length);
    for (const g of ids) {
      expect(g.fills.length).toBe(4);
      for (const f of g.fills) expect(f.startsWith(`url(#${g.prefix}-dots-`)).toBe(true);
    }

    // Two instances side by side, pitch 24 and 36: a pattern-id clash would
    // make the second draw the first one's pitch.
    const layout = await page.evaluate(async () => {
      const { createDotGrid, el, setStyles } = window.__gallery.components;
      const { viewport, dotGrid } = window.__gallery.geometry;
      document.body.replaceChildren();
      setStyles(document.body, { padding: '0', background: '#000' });
      const out = [];
      for (const [i, w] of [[0, 1440], [1, 1920]]) {
        const vp = { ...viewport(w, 900, 1), U: 600, V: 400 };
        const svg = el('svg', { width: 600, height: 400 }, document.body);
        setStyles(svg, { position: 'absolute', left: `${i * 640}px`, top: '0' });
        createDotGrid(svg, { idPrefix: `twin-${i}` }).set({ ...dotGrid(vp), vertexWhite: 1, fillWhite: 0, vertexInk: 0, fillInk: 0 }, vp);
        out.push({ left: i * 640, pitch: vp.pitch });
      }
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
      return out;
    });
    const px = decode(await page.screenshot());
    for (const { left, pitch } of layout) {
      const at = (u) => Math.max(...[-1, 0, 1].map((d) => px.at(left + 300 + u + d, 200)[0]));
      expect(at(0), `pitch ${pitch}: vertex dot at the centre`).toBeGreaterThan(200);
      expect(at(pitch), `pitch ${pitch}: nothing one pitch away`).toBe(0);
      expect(at(2 * pitch), `pitch ${pitch}: vertex dot at 2·pitch`).toBeGreaterThan(200);
    }
    expect(layout.map((l) => l.pitch)).toEqual([32, 36]);
  });
});

test.describe('WhitePoint', () => {
  for (const dpr of [1, 2]) {
    test.describe(`DPR ${dpr}`, () => {
      test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });

      test('WO-004 · the disc is never wider than 6 px, the ring adds 1 px each side, and null hides it', async ({ page }) => {
        await open(page, '?solo=point-centre&ground=black');
        const measure = async (wp, ring) => {
          await page.evaluate(async ([w, r]) => {
            window.__gallery.drawn['point-centre'][0].instance.set(w, r);
            await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
          }, [wp, ring]);
          const px = decode(await page.screenshot());
          const y = Math.floor(450 * dpr);
          // disc: coverage width, the row's summed red over white, in CSS px
          // (an ink ring on black adds < 0.05). total: every pixel not black.
          let coverage = 0; let lit = 0;
          for (let x = Math.floor(700 * dpr); x < Math.ceil(740 * dpr); x++) {
            const [r, g, b] = px.at(x, y);
            coverage += r / 255;
            if (r + g + b > 0) lit++;
          }
          return { disc: Math.round((coverage / dpr) * 10) / 10, total: lit / dpr };
        };
        expect((await measure({ u: 720, v: 450, r: 3, alpha: 1 }, 'ink25')).disc).toBeCloseTo(6, 0);
        const clamped = await measure({ u: 720, v: 450, r: 5, alpha: 1 }, 'ink25');
        expect(clamped.disc, 'r 5 is clamped to a 6 px disc').toBeLessThanOrEqual(6.1);
        expect(clamped.total, 'and its ring stays within 8 px').toBe(8);
        expect((await measure({ u: 720, v: 450, r: 1.5, alpha: 1 }, 'ink25')).disc, 'the Scene 1 glint is a 3 px disc').toBeCloseTo(3, 0);
        const ringed = await measure({ u: 720, v: 450, r: 3, alpha: 1 }, 'wallDeep');
        expect(ringed.total, 'disc plus a 1 px ring on each side').toBe(8);
        expect((await measure(null, 'ink25')).total).toBe(0);
        expect((await measure({ u: 720, v: 450, r: 3, alpha: 0 }, 'ink25')).total).toBe(0);
      });
    });
  }

  test('WO-004 · an HTML host places the point at (u, v) from its top-left corner, pure white at the centre', async ({ page }) => {
    await open(page, '?solo=point-rail');
    const host = await page.evaluate(() => document.querySelector('.art > svg.white-point')?.namespaceURI);
    expect(host).toBe('http://www.w3.org/2000/svg');
    const px = decode(await page.screenshot());
    expect(px.at(720, 450)).toEqual([255, 255, 255]);
    expect(px.at(717, 450)).not.toEqual([255, 255, 255]);
    expect(px.at(725, 450)).not.toEqual([255, 255, 255]);
  });

  test('WO-004 · an unknown ring is a thrown error, not a silent default', async ({ page }) => {
    await open(page, '?solo=point-glint');
    const thrown = await page.evaluate(() => {
      try { window.__gallery.drawn['point-glint'][0].instance.set({ u: 1, v: 1, r: 1, alpha: 1 }, 'gold'); return ''; } catch (err) { return err.constructor.name; }
    });
    expect(thrown).toBe('RangeError');
  });
});

test.describe('Gallery', () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  test('WO-004 · the gallery shows each component at three states and saves its evidence', async ({ page }) => {
    await open(page);
    const rows = await page.evaluate(() => [...document.querySelectorAll('.row')].map((r) => ({
      title: r.querySelector('h2')?.textContent,
      panels: r.querySelectorAll('.panel').length,
    })));
    expect(rows).toEqual([
      { title: 'Bands', panels: 3 },
      { title: 'DotGrid', panels: 3 },
      { title: 'WhitePoint', panels: 3 },
    ]);
    const dir = evidenceDir();
    await page.screenshot({ path: path.join(dir, 'gallery-1440.png'), fullPage: true });
    const ids = await page.evaluate(() => window.__gallery.fixtures);
    for (const id of ids) {
      await open(page, `?solo=${id}`);
      await page.screenshot({ path: path.join(dir, `solo-${id}-1440.png`) });
    }
    for (const id of ids) expect(fs.existsSync(path.join(dir, `solo-${id}-1440.png`))).toBe(true);
  });
});

test.describe('Static', () => {
  test('WO-004 · components contain no layout reads, clocks or randomness', () => {
    const banned = /\b(getBoundingClientRect|offset[A-Z]\w*|client[A-Z]\w*|getComputedStyle|scrollY|innerWidth|innerHeight|performance\.now|Date\.now|new Date|Math\.random)\b/;
    const files = componentFiles();
    expect(files.sort()).toEqual(['bands-dom.js', 'dotgrid-svg.js', 'svg.js', 'white-point.js']);
    /** @type {string[]} */
    const hits = [];
    for (const f of files) {
      fs.readFileSync(componentSource(f), 'utf8').split('\n').forEach((line, i) => {
        if (banned.test(line)) hits.push(`${f}:${i + 1} ${line.trim()}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
