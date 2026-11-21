import { describe, expect, it } from 'vitest';
import type { SimEventType } from '../../../src/contracts';
import { VISUAL_CUES, cueImpulse } from '../../../src/render/cues';
import { bottomBandAlpha, eyeScale, jawRad, vignetteAlpha } from '../../../src/render/danger';
import { Particles, PK, Shake } from '../../../src/render/juice';
import { makeBot } from '../../../src/sim/bots';
import { createSim, step } from '../../../src/sim/sim';

describe('visual juice table (SC3)', () => {
  it('every event type the sim emits has a visual cue (bot runs over many seeds)', () => {
    const seen = new Set<SimEventType>();
    for (let seed = 1; seed <= 40; seed++)
      for (const name of ['runner', 'idler', 'forward', 'nearMiss', 'idleAtTau'] as const) {
        const s = createSim(seed);
        const bot = makeBot(name);
        while (!s.result && s.tick < 12000) step(s, { press: bot(s) });
        for (const e of s.log) seen.add(e.t);
      }
    for (const t of seen) expect(VISUAL_CUES[t], t).toBeDefined();
    expect(seen.size).toBeGreaterThanOrEqual(12);
  });

  it('shake stays under 8 px and is 0 under reduced motion; hit-stops stay (§6, §10)', () => {
    for (const t of Object.keys(VISUAL_CUES) as SimEventType[]) {
      expect(cueImpulse(t, false).shakePx).toBeLessThan(8);
      expect(cueImpulse(t, true).shakePx).toBe(0);
      expect(cueImpulse(t, true).hitStopMs).toBe(VISUAL_CUES[t].hitStopMs);
    }
    expect(VISUAL_CUES.nearMiss.hitStopMs).toBe(60);
    expect(VISUAL_CUES.eaten.hitStopMs).toBe(90);
    expect(VISUAL_CUES.win.hitStopMs).toBe(120);
  });

  it('eaten shake decays exponentially with k = 12 (8 px over 300 ms)', () => {
    const sh = new Shake();
    const o = { x: 0, y: 0 };
    sh.kick(8, 300);
    for (let i = 0; i < 18; i++) sh.step(1 / 60, o);
    expect(sh.current()).toBeCloseTo(8 * Math.exp(-12 * 0.3), 3);
  });
});

describe('danger signals (§4.3, polish 14)', () => {
  it('eyes 1 + 0.5τ, jaws closed until τ 0.4 and 28° at τ 1', () => {
    expect(eyeScale(0.5)).toBe(1.25);
    expect(jawRad(0.4)).toBe(0);
    expect((jawRad(1) * 180) / Math.PI).toBeCloseTo(28, 6);
  });

  it('vignette peaks at the heartbeat wrap (phase 0) at 0.45τ (floor 0.10 past τ 0.3), off on a fresh run (τ 0)', () => {
    expect(vignetteAlpha(0.5, 0)).toBeCloseTo(0.225, 9);
    expect(vignetteAlpha(0.31, 0)).toBeCloseTo(0.1395, 9);
    expect(vignetteAlpha(0.2, 0)).toBeCloseTo(0.09, 9);
    let best = 0, at = -1;
    for (let i = 0; i < 1000; i++) {
      const a = vignetteAlpha(0.5, i / 1000);
      if (a > best) {
        best = a;
        at = i;
      }
    }
    expect(at).toBe(0);
    expect(vignetteAlpha(0, 0)).toBe(0);
    expect(vignetteAlpha(0.5, 0.6)).toBeLessThan(0.225 * 0.8);
    expect(bottomBandAlpha(0.2, 0)).toBe(0);
    expect(bottomBandAlpha(0.8, 0)).toBe(1);
    expect(bottomBandAlpha(0.8, 0.5)).toBeLessThan(0.01);
  });
});

describe('particle pool', () => {
  it('never grows: spawning past capacity recycles; droplets report their water landing', () => {
    const p = new Particles(8);
    for (let i = 0; i < 20; i++) p.spawn(PK.Droplet, 0, 0, 10, 0, 0, 5, 40, 0.2, 0.8, true);
    expect(p.x.length).toBe(8);
    expect(p.alive).toBe(8);
    const landed: number[] = [];
    for (let i = 0; i < 20; i++) p.step(1 / 60, (x) => landed.push(x));
    expect(p.alive).toBe(0);
    expect(landed.length).toBe(8);
    expect(landed[0]).toBeCloseTo(2, 5);
  });
});
