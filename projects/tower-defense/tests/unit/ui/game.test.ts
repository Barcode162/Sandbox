// WO-004 units: the §13 input map, title → first tower in 3 clicks via synthetic pointer events, the Go-label
// truth table (§16.14), restart resets the run and every layer, click → command applied on the next tick.
import { describe, expect, it } from 'vitest';
import type { Command, Sim, SimOptions } from '../../../src/contracts/types';
import { createGame, type CanvasLike, type Layers } from '../../../src/app/game';
import { goView, keyAction, type KeyContext } from '../../../src/app/input';
import { createSettingsStore } from '../../../src/app/settings';
import { createSim } from '../../../src/sim';
import { createFx } from '../../../src/render/fx';
import { createBlotLayer } from '../../../src/render/blots';
import { createTowerLayer } from '../../../src/render/towers';
import { HUD } from '../../../src/data/layout';
import { TITLE } from '../../../src/data/layout';
import { BEST_SPOTS } from '../../../src/data/map';

/** A 2D context that accepts every call: the game must run (and draw) headless without throwing. */
function fakeCtx(): CanvasRenderingContext2D {
  const grad = { addColorStop() {} };
  const store: Record<string | symbol, unknown> = {};
  return new Proxy(store, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'measureText') return (s: string) => ({ width: s.length * 7 });
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createConicGradient') return () => grad;
      if (k === 'createPattern') return () => null;
      if (k === 'getLineDash') return () => [];
      if (k === 'createImageData' || k === 'getImageData') return (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      return () => undefined;
    },
    set(t, k, v) { t[k] = v; return true; },
  }) as unknown as CanvasRenderingContext2D;
}

class FakeCanvas extends EventTarget implements CanvasLike {
  width = 1280;
  height = 720;
  private ctx = fakeCtx();
  getContext(): CanvasRenderingContext2D { return this.ctx; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; }
}

function pointer(target: EventTarget, type: string, x: number, y: number, button = 0): void {
  target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { clientX: x, clientY: y, button }));
}

function setup(opts: { recordTo?: Command[] } = {}) {
  const canvas = new FakeCanvas();
  const win = new EventTarget();
  let resets = 0;
  const layers = (): Layers => {
    const fx = createFx();
    const L: Layers = { fx, blots: createBlotLayer(fx), towers: createTowerLayer(fx) };
    for (const l of [L.fx, L.blots, L.towers]) { const r = l.reset.bind(l); l.reset = () => { resets++; r(); }; }
    return L;
  };
  const mkSim = (o: SimOptions): Sim => {
    const s = createSim(o);
    if (!opts.recordTo || o.loopRound) return s;
    const rec = opts.recordTo;
    const enqueue = s.enqueue.bind(s);
    return Object.assign(Object.create(Object.getPrototypeOf(s)), s, { enqueue: (c: Command) => { rec.push(c); enqueue(c); } }, {
      get state() { return s.state; }, get events() { return s.events; }, step: () => s.step(),
    }) as Sim;
  };
  const game = createGame(canvas, { win, doc: null, settings: createSettingsStore(null), createSim: mkSim, layers });
  const frames = (ms: number) => { for (let t = 0; t < ms; t += 1000 / 60) game.frame(1000 / 60); };
  const key = (k: string) => win.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key: k, repeat: false }));
  return { canvas, win, game, frames, key, resets: () => resets };
}

const ctx = (scene: KeyContext['scene'], placing = false, selected = false): KeyContext => ({ scene, placing, selected });

describe('§13 input map', () => {
  it('play scene: every binding', () => {
    expect(keyAction('1', ctx('play'))).toEqual({ type: 'select', kind: 'tern' });
    expect(keyAction('2', ctx('play'))).toEqual({ type: 'select', kind: 'frog' });
    expect(keyAction('3', ctx('play'))).toEqual({ type: 'select', kind: 'koi' });
    expect(keyAction('4', ctx('play'))).toEqual({ type: 'select', kind: 'owl' });
    expect(keyAction('Escape', ctx('play', true))).toEqual({ type: 'cancel' });
    expect(keyAction('Escape', ctx('play'))).toEqual({ type: 'pause' });
    expect(keyAction('p', ctx('play', true))).toEqual({ type: 'pause' });
    expect(keyAction(' ', ctx('play'))).toEqual({ type: 'go' });
    expect(keyAction('z', ctx('play', false, true))).toEqual({ type: 'upgrade', path: 0 });
    expect(keyAction('X', ctx('play', false, true))).toEqual({ type: 'upgrade', path: 1 });
    expect(keyAction('t', ctx('play', false, true))).toEqual({ type: 'cycleTarget' });
    expect(keyAction('Backspace', ctx('play', false, true))).toEqual({ type: 'sell' });
    expect(keyAction('Delete', ctx('play', false, true))).toEqual({ type: 'sell' });
    expect(keyAction('z', ctx('play'))).toEqual({ type: 'none' });
    expect(keyAction('a', ctx('play'))).toEqual({ type: 'autoStart' });
    expect(keyAction('m', ctx('play'))).toEqual({ type: 'mute' });
    expect(keyAction('r', ctx('play'))).toEqual({ type: 'none' });
  });
  it('other scenes', () => {
    expect(keyAction('Enter', ctx('title'))).toEqual({ type: 'play' });
    expect(keyAction('s', ctx('title'))).toEqual({ type: 'openSettings' });
    expect(keyAction('M', ctx('title'))).toEqual({ type: 'mute' });
    expect(keyAction('Escape', ctx('paused'))).toEqual({ type: 'resume' });
    expect(keyAction('r', ctx('paused'))).toEqual({ type: 'restart' });
    expect(keyAction('Escape', ctx('settings'))).toEqual({ type: 'back' });
    expect(keyAction('Enter', ctx('gameover'))).toEqual({ type: 'retry' });
    expect(keyAction('Enter', ctx('victory'))).toEqual({ type: 'retry' });
  });
});

describe('§9 Go label truth table (§16.14)', () => {
  it.each([
    ['intermission', 1, 0, 0, 0, '▶ Start', 'start', true, false],
    ['intermission', 1, 1, 0, 0, '▶ Start', 'start', false, true],
    ['intermission', 2, 2, 1000, 3, '▶ Start', 'start', false, false],
    ['intermission', 1, 2, 4500, 3, '▶ Start', 'start', false, true],
    ['round', 1, 2, 0, 1, '▶ 1×', 'speed', false, false],
    ['round', 2, 2, 9000, 1, '▶▶ 2×', 'speed', false, false],
    ['victory', 2, 5, 0, 20, '▶ Start', 'none', true, false],
    ['defeat', 1, 2, 0, 9, '▶ Start', 'none', true, false],
  ] as const)('%s speed %i towers %i idle %i rounds %i → %s', (phase, speed, towers, idle, rounds, label, action, dim, pulse) => {
    expect(goView(phase, speed, towers, idle, rounds)).toMatchObject({ label, action, dim, pulse });
  });
});

describe('game shell', () => {
  it('title → first tower in 3 clicks via synthetic pointer events; applied on the next tick', () => {
    const cmds: Command[] = [];
    const { canvas, game, frames } = setup({ recordTo: cmds });
    frames(900);
    expect(game.scene()).toBe('title');
    pointer(canvas, 'pointerdown', TITLE.play.x + 20, TITLE.play.y + 20); // click 1 (acts on release, §11)
    pointer(canvas, 'pointerup', TITLE.play.x + 20, TITLE.play.y + 20);
    expect(game.scene()).toBe('play');
    frames(450);
    expect(game.debug.hint).toBe('Pick a defender — click the Tern or press 1.');
    pointer(canvas, 'pointerdown', HUD.cards[0].x + 40, HUD.cards[0].y + 40); // click 2: Tern card
    expect(game.debug.selection).toEqual({ mode: 'placing', kind: 'tern' });
    expect(game.debug.hint).toBe('Green ring is a good spot.');
    pointer(canvas, 'pointermove', BEST_SPOTS.star.x, BEST_SPOTS.star.y);
    pointer(canvas, 'pointerdown', BEST_SPOTS.star.x, BEST_SPOTS.star.y); // click 3: the star
    expect(cmds).toContainEqual({ type: 'place', kind: 'tern', x: BEST_SPOTS.star.x, y: BEST_SPOTS.star.y });
    expect(game.sim.state.towers.length).toBe(0);
    game.frame(1000 / 60); // one tick later the tower exists
    expect(game.sim.state.towers.map((t) => t.kind)).toEqual(['tern']);
    expect(game.sim.state.money).toBe(450);
    expect(game.debug.hint).toBe('Space — let the ink in.');
    expect(game.debug.go).toMatchObject({ label: '▶ Start', pulse: true, dim: false });
  });

  it('invalid spot: no command; Space starts, then toggles speed; Go label follows', () => {
    const cmds: Command[] = [];
    const { canvas, game, frames, key } = setup({ recordTo: cmds });
    game.debug.newRun();
    key('1');
    pointer(canvas, 'pointerdown', 460, 300); // on the path
    expect(cmds.filter((c) => c.type === 'place')).toEqual([]);
    pointer(canvas, 'pointerdown', 340, 510);
    frames(50);
    key(' ');
    frames(50);
    expect(game.sim.state.phase).toBe('round');
    expect(game.debug.go.label).toBe('▶ 1×');
    key(' ');
    expect(game.speed()).toBe(2);
    expect(game.debug.go.label).toBe('▶▶ 2×');
  });

  it('select, upgrade (Z), cycle target (T), sell with two presses within 1 s', () => {
    const { canvas, game, frames, key } = setup();
    game.debug.newRun();
    key('1'); pointer(canvas, 'pointerdown', 340, 510); frames(50);
    pointer(canvas, 'pointerdown', 340, 510);
    expect(game.debug.selection).toEqual({ mode: 'selected', towerId: 1 });
    key('z'); frames(50);
    expect(game.sim.state.towers[0].tiers).toEqual([1, 0]);
    key('t'); frames(50);
    expect(game.sim.state.towers[0].target).toBe('last');
    key('Backspace'); frames(50);
    expect(game.sim.state.towers.length).toBe(1);
    key('Backspace'); frames(50);
    expect(game.sim.state.towers.length).toBe(0);
    expect(game.debug.selection).toEqual({ mode: 'none' });
  });

  it('F-008: a held Backspace/Delete (key auto-repeat) never sells; the repeat is still preventDefault-ed', () => {
    const { canvas, win, game, frames, key } = setup();
    game.debug.newRun();
    key('1'); pointer(canvas, 'pointerdown', 340, 510); frames(50);
    pointer(canvas, 'pointerdown', 340, 510);
    for (const k of ['Backspace', 'Delete']) {
      key(k); frames(50);
      for (let i = 0; i < 10; i++) {
        const ev = Object.assign(new Event('keydown', { cancelable: true }), { key: k, repeat: true });
        win.dispatchEvent(ev);
        expect(ev.defaultPrevented).toBe(true);
        frames(30);
      }
      expect(game.sim.state.towers.length).toBe(1);
      frames(1100); // let the arm expire before the next key
    }
  });

  it('Esc pauses (sim stops), blur auto-pauses, R twice restarts; restart resets sim and every layer', () => {
    const { canvas, win, game, frames, key, resets } = setup();
    game.debug.newRun();
    key('1'); pointer(canvas, 'pointerdown', 340, 510); frames(50); key(' '); frames(500);
    key('Escape');
    expect(game.scene()).toBe('paused');
    const tick = game.sim.state.tick;
    frames(500);
    expect(game.sim.state.tick).toBe(tick);
    key('Escape');
    expect(game.scene()).toBe('play');
    win.dispatchEvent(new Event('blur'));
    expect(game.scene()).toBe('paused');
    const before = resets();
    const old = game.sim;
    key('r');
    expect(game.sim).toBe(old);
    key('r');
    expect(game.sim).not.toBe(old);
    expect(resets() - before).toBe(3);
    expect(game.scene()).toBe('play');
    expect(game.sim.state).toMatchObject({ round: 1, phase: 'intermission', money: 650, lives: 100, tick: 0 });
    expect(game.sim.state.towers.length).toBe(0);
    expect(game.debug.selection).toEqual({ mode: 'none' });
  });

  it('restart() from the hook resets in well under 2 s', () => {
    const { game, frames } = setup();
    game.debug.newRun();
    frames(200);
    const t0 = performance.now();
    game.restart();
    expect(performance.now() - t0).toBeLessThan(2000);
    expect(game.sim.state.tick).toBe(0);
  });

  it('every stage-relevant scene renders headless without throwing', () => {
    const { game, frames, key } = setup();
    for (const sheet of ['blots-grid', 'towers-sheet'] as const) { game.debug.setSheet(sheet); game.debug.render(); }
    game.debug.setSheet(null);
    key('s'); frames(300); key('Escape');
    game.debug.newRun(); key('Escape'); frames(300);
    expect(game.scene()).toBe('paused');
  });
});
