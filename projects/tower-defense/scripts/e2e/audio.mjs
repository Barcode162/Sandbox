// Offline audio check (plan WO-005, §16.19 "300 pops never clip"): bundle src/audio with Vite into an IIFE,
// run the real engine on an OfflineAudioContext in headless Chromium, and measure the rendered peak.
// The render is stepped with suspend()/resume() at 60 Hz so the engine sees real frames: update(nowMs),
// then that frame's pops, exactly as the game drives it. Each scenario is rendered twice: through the full
// master chain, and tapped before the safety limiter (so the mix itself is proven, not just the limiter).
// Evidence: evidence-local/audio/offline.json.
import { build } from 'vite';
import { join } from 'node:path';
import { ROOT, check, launch, ok, writeEvidence } from './lib.mjs';

const bundle = await build({
  configFile: false, root: ROOT, logLevel: 'warn',
  build: { write: false, minify: false, lib: { entry: join(ROOT, 'src/audio/index.ts'), name: 'InkfoldAudio', formats: ['iife'], fileName: 'audio' } },
});
const code = (Array.isArray(bundle) ? bundle[0] : bundle).output.find((o) => o.type === 'chunk').code;

const SCENARIOS = [
  { name: 'default mix, storm music, 300 pops spread over 1 s', settings: {}, music: 'storm', pops: 300, spreadMs: 1000, leaks: 0 },
  { name: 'sliders at 100, storm music, 300 pops over 1 s + 10 leaks + boss shed', settings: { music: 100, sfx: 100 }, music: 'storm', pops: 300, spreadMs: 1000, leaks: 10, boss: true },
  { name: 'default mix, 300 pops in a single frame', settings: {}, music: 'silent', pops: 300, spreadMs: 0, leaks: 0 },
];

const browser = await launch();
let results;
try {
  const page = await browser.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.setContent('<!doctype html><title>audio</title>');
  await page.addScriptTag({ content: code });
  results = await page.evaluate(async (scenarios) => {
    const { createAudioEngine } = window.InkfoldAudio;
    const KINDS = ['dot', 'drop', 'splat', 'splash', 'blotch', 'streak', 'wax', 'knot'];
    const SR = 48000, LEN_S = 3, FPS = 60, START_S = 0.5;
    async function render(sc, tapBeforeLimiter) {
      const ctx = new OfflineAudioContext(2, SR * LEN_S, SR);
      const audio = createAudioEngine({
        createContext: () => ctx,
        connectOut: tapBeforeLimiter ? (c, master) => master.connect(c.destination) : undefined,
      });
      audio.unlock();
      audio.applySettings({ music: 60, sfx: 80, shake: 100, reduceMotion: false, colourblind: false, autoStart: false, muted: false, ...sc.settings });
      audio.setMusic(sc.music);
      const frames = Math.floor(LEN_S * FPS) - 2;
      const popFrames = Math.max(1, Math.round((sc.spreadMs / 1000) * FPS));
      for (let f = 1; f < frames; f++) {
        const t = f / FPS;
        ctx.suspend(t).then(() => {
          audio.update(t * 1000);
          const k = f - Math.round(START_S * FPS);
          if (k >= 0 && k < popFrames) {
            const n = Math.floor(((k + 1) * sc.pops) / popFrames) - Math.floor((k * sc.pops) / popFrames);
            for (let i = 0; i < n; i++) audio.onSimEvent({ type: 'pop', blotId: f * 1000 + i, kind: KINDS[(f + i) % KINDS.length], x: 0, y: 0, towerId: 1, pale: false });
            if (k < sc.leaks * 6 && k % 6 === 0) audio.onSimEvent({ type: 'leak', blotId: 1, kind: 'splat', livesLost: 3 });
            if (sc.boss && k === 20) audio.onSimEvent({ type: 'bossShed', blotId: 1, threshold: 0.5, x: 0, y: 0 });
          }
          ctx.resume();
        });
      }
      const buf = await ctx.startRendering();
      let peak = 0, sumSq = 0;
      for (let ch = 0; ch < buf.numberOfChannels; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sumSq += d[i] * d[i]; }
      }
      const rms = Math.sqrt(sumSq / (buf.length * buf.numberOfChannels));
      const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
      return { peakDbfs: db(peak), rmsDbfs: db(rms), debug: audio.debug };
    }
    const out = [];
    for (const sc of scenarios) {
      const full = await render(sc, false);
      const pre = await render(sc, true);
      out.push({ name: sc.name, peakDbfs: full.peakDbfs, rmsDbfs: full.rmsDbfs, preLimiterPeakDbfs: pre.peakDbfs,
        popVoices: full.debug.popVoices, droppedPops: full.debug.droppedPops, crackles: full.debug.crackles, cues: full.debug.cues });
    }
    return out;
  }, SCENARIOS);
  check(problems.length === 0, 'audio page: zero console errors', `audio page errors: ${problems.join(' | ')}`);
} finally {
  await browser.close();
}

for (const r of results) {
  const heard = r.popVoices + r.droppedPops;
  check(heard === 300, `${r.name}: all 300 pops reached the engine (${r.popVoices} voiced, ${r.droppedPops} → ${r.crackles} crackle bursts)`, `${r.name}: only ${heard}/300 pops reached the engine`);
  check(r.peakDbfs < 0, `${r.name}: master peak ${r.peakDbfs.toFixed(2)} dBFS (< 0), pre-limiter ${r.preLimiterPeakDbfs.toFixed(2)} dBFS, RMS ${r.rmsDbfs.toFixed(1)} dBFS`,
    `${r.name}: master peak ${r.peakDbfs.toFixed(2)} dBFS clips`);
  check(r.preLimiterPeakDbfs < 0, `${r.name}: the mix stays under 0 dBFS even before the safety limiter`, `${r.name}: pre-limiter peak ${r.preLimiterPeakDbfs.toFixed(2)} dBFS — the mix relies on the safety limiter`);
}
await writeEvidence('audio', 'offline.json', results);
if (!process.exitCode) ok('audio evidence → evidence-local/audio/offline.json');
