// §13 acceptance-by-eye captures (WO-003): all 12 moments at 375×812 and 1440×900 (title also 1920×1080),
// seed 7, driven by bots, the manual clock and setTuning. Each capture asserts the state it claims to show.
// JPEG q80, DPR 1 → artifacts/shots/look-<nn>-<moment>-<viewport>.jpg (4 and 5 also in grayscale).
import { check, done, shot, VIEWPORTS, withPage } from './harness.mjs';

const DT = 1000 / 60;

/** In-page driver: helpers that only use the public hook and the renderer's probe. */
const install = () =>
  (window.__t = {
    L: () => window.__lily,
    P: () => document.getElementById('stage').__lilyRender,
    until(pred, max = 6000, dt = 1000 / 60) {
      for (let i = 0; i < max && !pred(); i++) window.__lily.frame(dt);
      return pred();
    },
    fresh(seed = 7) {
      const l = window.__lily;
      l.setBot(null);
      l.restart(seed);
      l.frame(1000 / 60, 12);
    },
    has(t) {
      return window.__lily.events().some((e) => e.t === t);
    },
    idleAt(layer) {
      const s = window.__lily.sim();
      return s.frog.layer >= layer && s.frog.phase === 'idle' && s.choices.length > 0;
    },
    visible(sel) {
      const e = document.querySelector(sel);
      if (!e) return false;
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.5 && r.bottom > 0 && r.top < innerHeight;
    },
  });

async function prep(page) {
  await page.evaluate(install);
  await page.evaluate(() => window.__lily.manualClock(true));
}

async function gray(page, file) {
  await page.evaluate(() => (document.documentElement.style.filter = 'grayscale(1)'));
  await shot(page, file);
  await page.evaluate(() => (document.documentElement.style.filter = ''));
}

const shots = [
  ['mobile', VIEWPORTS.mobile],
  ['desktop', VIEWPORTS.desktop],
];

for (const [vp, viewport] of shots) {
  await withPage(`look shots ${vp}`, { viewport }, async ({ page }) => {
    await prep(page);
    const ev = (fn) => page.evaluate(fn);

    // 1 · Load, t = 0: the pond as title; ring + ↑ chip; wordmark clear of the lit pads.
    const s1 = await ev(() => {
      const { L, P, fresh } = __t;
      fresh();
      L().frame(1000 / 60, 30);
      const word = document.querySelector('.ly-word').getBoundingClientRect();
      const lit = L().pads().filter((p) => p.state === 'reachable');
      const hit = lit.some((p) => p.x + p.r > word.left && p.x - p.r < word.right && p.y + p.r > word.top && p.y - p.r < word.bottom);
      const sheet = !!document.querySelector('.ly-vellum');
      return { phase: L().phase(), ring: P().inviteRing, chips: P().chips, hit, sheet, gator: P().gatorVisible };
    });
    check(s1.phase === 'title' && s1.ring && s1.chips === 3, `1 title: invite ring + 3 chips (${JSON.stringify(s1)})`);
    check(!s1.hit && !s1.sheet, '1 title: wordmark on the pond (no sheet tinting pads), clear of the lit pads');
    check(!s1.gator, '1 title: no gator');
    await shot(page, `look-01-title-${vp}`);

    // 2 · Hop 1 apex: the shadow gap and the V legs.
    const s2 = await ev(() => {
      const { L, P, fresh, until } = __t;
      fresh();
      L().press('F');
      until(() => P().frogStage === 'air' && P().frogH > 11.6, 400, 2);
      return { h: P().frogH, legs: P().frogLegs, scale: P().frogScale, phase: L().phase() };
    });
    check(s2.h > 11.6 && s2.legs > 0.9 && s2.scale > 1.28, `2 apex: h ${s2.h.toFixed(2)}, legs ${s2.legs.toFixed(2)}, scale ${s2.scale.toFixed(2)}`);
    await shot(page, `look-02-apex-${vp}`);

    // 3 · Layer 3 + 300 ms: the eyes surfacing at the bottom edge.
    const s3 = await ev(() => {
      const { L, P, fresh, until, has } = __t;
      fresh();
      L().setBot('runner', { stopAtLayer: 3 });
      until(() => has('hook'));
      L().frame(1000 / 60, 18);
      return { vis: P().gatorVisible, y: P().headY, h: innerHeight, hook: has('hook') };
    });
    check(s3.hook && s3.vis && s3.y > s3.h * 0.7 && s3.y < s3.h, `3 hook: eyes surfacing low on screen (y ${Math.round(s3.y)} of ${s3.h})`);
    await shot(page, `look-03-hook-${vp}`);

    // 4 · Layer 6 idle: one soggy forward, two lily.
    const s4 = await ev(() => {
      const { L, fresh, until, idleAt } = __t;
      fresh();
      L().setBot('runner', { stopAtLayer: 5 });
      until(() => idleAt(5));
      L().frame(1000 / 60, 30);
      const s = L().sim();
      const kinds = s.choices.map((c) => s.river.pads[c.padId].kind + ':' + c.slot);
      return { kinds, layer: s.frog.layer };
    });
    check(s4.kinds.includes('soggy:F') && s4.kinds.filter((k) => k.startsWith('lily')).length === 2, `4 layer 6: ${s4.kinds.join(' ')}`);
    await shot(page, `look-04-layer6-${vp}`);
    await gray(page, `look-04-layer6-gray-${vp}`);

    // 5 · Layer 10 idle: a curl, fold distinct.
    const s5 = await ev(() => {
      const { L, fresh, until, idleAt } = __t;
      fresh();
      L().setBot('runner', { stopAtLayer: 9 });
      until(() => idleAt(9));
      L().frame(1000 / 60, 30);
      return L().pads().filter((p) => p.layer === 10).map((p) => p.kind);
    });
    check(s5.includes('curl'), `5 layer 10: ${s5.join(' ')}`);
    await shot(page, `look-05-layer10-${vp}`);
    await gray(page, `look-05-layer10-gray-${vp}`);

    // 6 · Bot idles until τ = 0.6: eyes enlarged, jaws parted, vignette visible.
    const s6 = await ev(() => {
      const { L, P, fresh, until } = __t;
      fresh();
      L().setBot('idleAtTau', { tau: 0.6 });
      until(() => L().sim().gator.tau >= 0.6);
      L().frame(1000 / 60, 2);
      return { tau: L().sim().gator.tau, eye: P().eyeScale, jaw: P().jawDeg, vig: P().vignette, result: !!L().sim().result };
    });
    check(s6.tau >= 0.6 && !s6.result && s6.eye >= 1.3 && s6.jaw > 2 && s6.vig > 0.12, `6 τ ${s6.tau.toFixed(2)}: eyes ${s6.eye.toFixed(2)}, jaw ${s6.jaw.toFixed(1)}°, vignette ${s6.vig.toFixed(2)}`);
    await shot(page, `look-06-tau-${vp}`);

    // 8 · Near-miss: the frozen frame (hit-stop), tooth flash drawn.
    const s8 = await ev(() => {
      const { L, P, fresh, until } = __t;
      fresh();
      const flashes = P().toothFlashFrames;
      L().setBot('nearMiss');
      const ok = until(() => P().hitStop && P().toothFlashFrames > flashes, 8000, 1000 / 60);
      return { ok, flashes: P().toothFlashFrames - flashes, gap: +P().clackGap.toFixed(2), stage: P().frogStage, result: !!L().sim().result };
    });
    check(s8.ok && s8.flashes === 1, `8 near-miss: frozen on a 1-frame tooth flash (${JSON.stringify(s8)})`);
    check(s8.gap >= 0.3 * 26 - 0.25, `8 near-miss: snout tip ${s8.gap} wu behind the frog's shadow (≥ 0.3P = 7.8, F-013)`);
    await shot(page, `look-08-nearmiss-${vp}`);

    // 9 · Eaten card + 500 ms: text fits, progress reed visible.
    const s9 = await ev(() => {
      const { L, fresh, until, visible } = __t;
      fresh();
      L().setBot('idler');
      until(() => L().phase() === 'result');
      L().frame(1000 / 60, 30);
      const card = document.querySelector('[data-test="card-eaten"] .ly-card');
      const over = card ? [...card.querySelectorAll('h2,p')].some((e) => e.scrollWidth > e.clientWidth + 1) : true;
      const r = card?.getBoundingClientRect();
      return { card: visible('[data-test="card-eaten"] .ly-card'), reed: visible('.ly-reed'), over, inside: r ? r.left >= 0 && r.right <= innerWidth : false, text: card?.innerText };
    });
    check(s9.card && s9.reed && !s9.over && s9.inside, `9 eaten card fits, reed visible: ${JSON.stringify(s9.text)}`);
    await page.waitForTimeout(260); // let the card's CSS entrance finish (wall time)
    await shot(page, `look-09-eaten-${vp}`);

    // 10 · Sunk (curl) card + 500 ms: the live tell diagram with two callouts.
    const s10 = await ev(() => {
      const { L, fresh, until, idleAt, visible } = __t;
      fresh();
      L().setBot('runner', { stopAtLayer: 9 });
      until(() => idleAt(9));
      L().setBot(null);
      const s = L().sim();
      const c = s.choices.find((c) => s.river.pads[c.padId].kind === 'curl');
      if (c) L().press(c.slot);
      until(() => L().phase() === 'result');
      L().frame(1000 / 60, 30);
      const r = L().sim().result;
      return { cause: r?.cause, diagram: visible('[data-test="tell-diagram"]'), text: document.querySelector('[data-test="card-sunk"]')?.innerText };
    });
    check(s10.cause === 'curl' && s10.diagram && /Curled pad!/.test(s10.text ?? ''), `10 curl card with tell diagram: ${JSON.stringify(s10.text)}`);
    await page.waitForTimeout(260); // let the card's CSS entrance finish (wall time)
    await shot(page, `look-10-curl-${vp}`);

    // 12 · Pause: veil, card and the keyboard focus ring.
    const s12 = await ev(() => {
      const { L, fresh, until } = __t;
      fresh();
      L().setBot('runner', { stopAtLayer: 2 });
      until(() => __t.idleAt(2));
      L().setBot(null);
      return L().phase();
    });
    await page.keyboard.press('Escape');
    await page.evaluate(() => __t.L().frame(1000 / 60, 12));
    await page.waitForTimeout(260); // CSS transitions run on wall time
    const s12b = await ev(() => {
      const { L, visible } = __t;
      const a = document.activeElement;
      return { phase: L().phase(), card: visible('[data-test="card-pause"] .ly-card'), veil: getComputedStyle(document.querySelector('.ly-veil')).opacity, focus: a?.textContent, ring: a?.matches(':focus-visible') };
    });
    check(s12 === 'play' && s12b.phase === 'paused' && s12b.card && s12b.veil === '1' && s12b.ring, `12 pause: ${JSON.stringify(s12b)}`);
    await shot(page, `look-12-pause-${vp}`);
    await page.keyboard.press('Escape');

    // 7 · Scripted flank (setTuning brings it early): the ✕ pad framed by jaws, honest chips elsewhere.
    const s7 = await ev(() => {
      const { L, P, fresh, until, has } = __t;
      L().setTuning({ flankFromLayer: 5, flankG: 3.6, flankEvery: 2 });
      fresh();
      L().setBot('runner', { delayMs: 500 });
      until(() => has('flankStart'));
      L().setBot(null);
      until(() => has('flankArmed'));
      L().frame(1000 / 60, 12);
      const flanked = L().pads().filter((p) => p.state === 'flanked').length;
      const honest = L().pads().filter((p) => p.state === 'reachable').length;
      return { flanked, honest, jaws: P().flankJaws, chips: P().chips };
    });
    check(s7.flanked === 1 && s7.honest >= 1 && s7.jaws, `7 flank: ${JSON.stringify(s7)}`);
    await shot(page, `look-07-flank-${vp}`);
    // While the frog hops to an honest pad, the flanked pad keeps its jaws and its ✕ (CEO, after WO-002 F-004).
    const s7b = await ev(() => {
      const { L, P } = __t;
      const s = L().sim();
      const honest = s.choices.find((c) => s.padStates[c.padId].state === 'reachable');
      L().press(honest.slot);
      let frames = 0, ok = 0;
      for (let i = 0; i < 40; i++) {
        L().frame(1000 / 60);
        const f = L().sim().frog;
        if (f.phase !== 'squash' && f.phase !== 'air') break;
        if (!L().sim().padStates.some((p) => p.state === 'flanked')) continue;
        frames++;
        if (P().flankJaws && P().flankChipAirborne) ok++;
      }
      L().setTuning({ flankFromLayer: 12, flankG: 1.4, flankEvery: 4 });
      return { frames, ok };
    });
    check(s7b.frames > 0 && s7b.ok === s7b.frames, `7 flank: jaws + ✕ drawn on every squash/air frame while flanked (${s7b.ok}/${s7b.frames})`);

    // 11 · Win + 1.0 s with a new best: route inked, stamp legible, zoomed river.
    await page.evaluate(() => localStorage.setItem('lilyfield.v1', JSON.stringify({ version: 1, bestMs: 600000, muted: true, reducedMotion: null, runs: 4 })));
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__lily);
    await prep(page);
    const s11 = await ev(() => {
      const { L, P, fresh, until, visible } = __t;
      fresh();
      L().setBot('runner', { delayMs: 320 });
      until(() => L().phase() === 'result', 20000);
      // Narrow: +1.0 s. Wide screens ink the route over 1.2 s while the camera pans along it: capture at +1.6 s.
      L().frame(1000 / 60, innerWidth >= 1024 ? 96 : 60);
      return { kind: L().sim().result?.kind, stamp: visible('[data-test="stamp"]'), trace: P().traceProgress, zoom: P().zoom, card: document.querySelector('[data-test="card-won"]')?.innerText };
    });
    check(s11.kind === 'won' && s11.stamp && s11.trace === 1 && s11.zoom > 0.32 && s11.zoom < 0.41, `11 win: ${JSON.stringify(s11)}`);
    await page.waitForTimeout(260); // let the card's CSS entrance finish (wall time)
    await shot(page, `look-11-win-${vp}`);
    if (vp === 'desktop') {
      await page.evaluate(() => __t.L().frame(1000 / 60, 60));
      await shot(page, 'look-11-win-desktop-settled');
    }
  });
}

await withPage('look shots wide title', { viewport: VIEWPORTS.wide }, async ({ page }) => {
  await prep(page);
  const s = await page.evaluate((dt) => {
    __t.fresh();
    window.__lily.frame(dt, 30);
    return { ring: __t.P().inviteRing, phase: window.__lily.phase(), chips: __t.P().chips };
  }, DT);
  check(s.ring && s.phase === 'title' && s.chips === 3, `1 title at 1920×1080: ${JSON.stringify(s)}`);
  await shot(page, 'look-01-title-wide');
  await page.evaluate(() => localStorage.setItem('lilyfield.v1', JSON.stringify({ version: 1, bestMs: 600000, muted: true, reducedMotion: null, runs: 4 })));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__lily);
  await prep(page);
  const w = await page.evaluate(() => {
    const { L, P, fresh, until } = __t;
    fresh();
    L().setBot('runner', { delayMs: 320 });
    until(() => L().phase() === 'result', 20000);
    L().frame(1000 / 60, 96);
    return { kind: L().sim().result?.kind, zoom: P().zoom, trace: P().traceProgress };
  });
  await page.waitForTimeout(260);
  check(w.kind === 'won' && w.trace === 1 && w.zoom > 0.39 && w.zoom < 0.41, `11 win at 1920×1080: ${JSON.stringify(w)}`);
  await shot(page, 'look-11-win-wide');
});

done();
