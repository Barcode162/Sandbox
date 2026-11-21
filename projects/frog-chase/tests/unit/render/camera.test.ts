import { describe, expect, it } from 'vitest';
import { ANCHOR, baseScale, createCamera, createView, springStep, stepCamera, sx, sy, updateView, winGoal, winPan, wx, wy } from '../../../src/render/camera';

describe('camera (§4.6)', () => {
  it('scale is min(vw/100, vh/150): 3.75 px/wu at 375×812, 6 at 1440×900', () => {
    expect(baseScale(375, 812)).toBe(3.75);
    expect(baseScale(1440, 900)).toBe(6);
  });

  it('critically damped spring (ω 10) is frame-rate independent and is within 5% by 500 ms', () => {
    const run = (hz: number) => {
      const s = { x: 0, v: 0 };
      for (let i = 0; i < Math.round(0.5 * hz); i++) springStep(s, 26, 10, 1 / hz);
      return s.x;
    };
    expect(Math.abs(run(30) - run(144))).toBeLessThan(1e-9);
    expect(run(60)).toBeGreaterThan(26 * 0.95);
    // Never overshoots (critical damping).
    const s = { x: 0, v: 0 };
    for (let i = 0; i < 200; i++) {
      springStep(s, 26, 10, 1 / 60);
      expect(s.x).toBeLessThanOrEqual(26 + 1e-9);
    }
  });

  it('after settle the focus sits at 64% height, at any viewport size (polish 24)', () => {
    const cam = createCamera();
    const v = createView();
    stepCamera(cam, { focusY: 0, zoom: 1, cut: false }, 1 / 60);
    for (let i = 0; i < 60; i++) stepCamera(cam, { focusY: 104, zoom: 1, cut: false }, 1 / 60);
    for (const [w, h] of [[375, 812], [1440, 900], [1920, 1080], [812, 375]]) {
      updateView(v, w!, h!, cam, 0, 0);
      expect(Math.abs(sy(v, 104) / h! - ANCHOR)).toBeLessThan(0.01);
      // The river column x 0..100 stays on screen: x is fixed.
      expect(sx(v, 0)).toBeGreaterThanOrEqual(-1e-9);
      expect(sx(v, 100)).toBeLessThanOrEqual(w! + 1e-9);
    }
  });

  it('screen ↔ world mappings invert', () => {
    const cam = createCamera();
    stepCamera(cam, { focusY: 300, zoom: 0.96, cut: true }, 0);
    const v = createView();
    updateView(v, 1440, 900, cam, 2, -3);
    expect(wx(v, sx(v, 37))).toBeCloseTo(37, 9);
    expect(wy(v, sy(v, 412))).toBeCloseTo(412, 9);
  });

  it('win framing: 0.4× (desktop) / 0.33× (narrow); wide screens pan with the trace inside the river (F-019)', () => {
    const top = 37 * 26 + 14, bottom = -6;
    expect(winGoal(1440, 900, top, bottom).zoom).toBe(0.4);
    expect(winGoal(1920, 1080, top, bottom).zoom).toBe(0.4);
    expect(winGoal(375, 812, top, bottom).zoom).toBe(0.33);
    const fin = winGoal(1440, 900, top, bottom).focusY;
    const cam = createCamera();
    const v = createView();
    for (const head of [top, 600, 300, bottom]) {
      const f = winPan(1440, 900, 0.4, head, fin, bottom);
      stepCamera(cam, { focusY: f, zoom: 0.4, cut: true }, 0);
      updateView(v, 1440, 900, cam, 0, 0);
      expect(f).toBeLessThanOrEqual(fin);
      expect(sy(v, bottom)).toBeGreaterThanOrEqual(900 - 1e-6);
      if (head === 600 || head === 300) expect(sy(v, head)).toBeCloseTo(450, 6);
    }
  });
});
