// WO-004 remediation r2 units: press-on-release buttons (F-026), the linear Sheets ticker (F-027), stage
// hooks that land on their moments (F-024) and survive a manual retry (F-005), the victory quiet beat (F-029).
import { describe, expect, it } from 'vitest';
import type { AudioEngine, MusicState, SimEvent, SimState } from '../../../src/contracts/types';
import { createGame, type CanvasLike } from '../../../src/app/game';
import { createSettingsStore } from '../../../src/app/settings';
import { installTestHook, shed50Reached } from '../../../src/app/testhook';
import { createHud } from '../../../src/ui/hud';
import { pauseButton } from '../../../src/ui/screens';
import { createSim } from '../../../src/sim';
import { createScriptDriver } from '../../../src/sim/bot';
import { SCRIPTS, SCRIPT_SEED } from '../../../src/data/scripts';
import { TITLE } from '../../../src/data/layout';

function fakeCtx(): CanvasRenderingContext2D {
  const grad = { addColorStop() {} };
  const store: Record<string | symbol, unknown> = {};
  return new Proxy(store, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'measureText') return (s: string) => ({ width: s.length * 7 });
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
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
const pointer = (t: EventTarget, type: string, x: number, y: number): void => {
  t.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { clientX: x, clientY: y, button: 0 }));
};

function recordingAudio() {
  const events: SimEvent[] = [];
  const music: { state: MusicState }[] = [];
  const audio: AudioEngine = {
    unlock() {}, ui() {}, applySettings() {}, setPaused() {}, update() {},
    onSimEvent(e) { events.push(e); },
    setMusic(state) { music.push({ state }); },
  };
  return { audio, events, music };
}

function setup(audio?: AudioEngine) {
  const canvas = new FakeCanvas();
  const win = new EventTarget();
  const game = createGame(canvas, { win, doc: null, settings: createSettingsStore(null), ...(audio ? { audio } : {}) });
  const frames = (ms: number) => { for (let t = 0; t < ms; t += 1000 / 60) game.frame(1000 / 60); };
  const key = (k: string) => win.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key: k, repeat: false }));
  return { canvas, win, game, frames, key };
}

describe('F-026 card and title buttons press on down, act on release inside', () => {
  it('title Play: down shows the pressed state only; release outside cancels; release inside plays', () => {
    const { canvas, game, frames } = setup();
    frames(900);
    const px = TITLE.play.x + 30, py = TITLE.play.y + 20;
    pointer(canvas, 'pointerdown', px, py);
    expect(game.scene()).toBe('title');
    expect(game.debug.pressed).toBe('play');
    pointer(canvas, 'pointerup', px, py + 200); // dragged off the button
    expect(game.scene()).toBe('title');
    expect(game.debug.pressed).toBeNull();
    pointer(canvas, 'pointerdown', px, py);
    frames(100); // the 90-ms depress renders while held
    expect(game.scene()).toBe('title');
    pointer(canvas, 'pointerup', px, py);
    expect(game.scene()).toBe('play');
  });

  it('pause card: Resume acts on release; a release outside the canvas cancels; Esc stays instant', () => {
    const { canvas, win, game, frames, key } = setup();
    game.debug.newRun();
    key('Escape');
    frames(300);
    const b = pauseButton(0);
    pointer(canvas, 'pointerdown', b.x + 20, b.y + 20);
    expect(game.scene()).toBe('paused');
    expect(game.debug.pressed).toBe('resume');
    win.dispatchEvent(new Event('pointerup'));
    expect(game.debug.pressed).toBeNull();
    expect(game.scene()).toBe('paused');
    pointer(canvas, 'pointerdown', b.x + 20, b.y + 20);
    pointer(canvas, 'pointerup', b.x + 24, b.y + 22);
    expect(game.scene()).toBe('play');
    key('Escape');
    expect(game.scene()).toBe('paused');
    key('Escape');
    expect(game.scene()).toBe('play');
  });
});

describe('F-027 Sheets ticker: linear at max(30, |Δ|·8)/s', () => {
  const state = (money: number): SimState => ({ ...createSim({ seed: 1 }).state, money } as SimState);
  it('a −200 spend ticks down in a straight line and lands within 125 ms (+1 frame)', () => {
    const hud = createHud();
    hud.reset(state(650));
    const s = state(450);
    const seen: number[] = [];
    let now = 0;
    for (let i = 0; i < 10; i++) { now += 1000 / 60; hud.update(1000 / 60, now, s); seen.push(hud.shownMoney); }
    // 1600/s → 26.7 per frame: 623, 597, 570, 543, 517, 490, 463, 450
    expect(seen.slice(0, 7)).toEqual([623, 597, 570, 543, 517, 490, 463]);
    expect(seen[7]).toBe(450);
    const steps = seen.slice(0, 7).map((v, i) => (i ? seen[i - 1] - v : 650 - v));
    for (const d of steps) expect(Math.abs(d - 26.7)).toBeLessThan(1.01);
  });
  it('a +3 pop still moves at the 30/s floor and lands in ≤ 100 ms', () => {
    const hud = createHud();
    hud.reset(state(450));
    let now = 0;
    for (let i = 0; i < 6; i++) { now += 1000 / 60; hud.update(1000 / 60, now, state(453)); }
    expect(hud.shownMoney).toBe(453);
  });
});

describe('F-024 stage moments', () => {
  it("shed50 holds only once the 50 % notch tore (or the run ended), never in the R19→R20 intermission", () => {
    const base = createSim({ seed: 1 }).state;
    const at = (o: Partial<SimState>): SimState => ({ ...base, ...o } as SimState);
    expect(shed50Reached(at({ round: 20, phase: 'intermission' }), {})).toBe(false);
    expect(shed50Reached(at({ round: 20, phase: 'round' }), { arrive: 100 })).toBe(false);
    expect(shed50Reached(at({ round: 20, phase: 'round' }), { arrive: 100, shed50: 400 })).toBe(true);
    expect(shed50Reached(at({ round: 20, phase: 'victory' }), {})).toBe(true);
    expect(shed50Reached(at({ round: 13, phase: 'defeat' }), {})).toBe(true);
  });
  it('title-0 restarts the title clock even when already on the title', async () => {
    const { game, frames } = setup();
    frames(2000);
    expect(game.debug.sceneMs).toBeGreaterThan(1900);
    (globalThis as { window?: unknown }).window = {};
    const hook = installTestHook(game, [], () => undefined);
    await hook.stage('title-0');
    expect(game.debug.sceneMs).toBe(0);
    await hook.stage('title-800');
    expect(Math.round(game.debug.sceneMs)).toBe(800);
  });
});

describe('F-005 a stage after a manual retry lands on its target, not on the retried board', () => {
  it('r1-8s → retry (new sim) → r1-8s again re-runs the script', async () => {
    const { game } = setup();
    (globalThis as { window?: unknown }).window = {};
    const hook = installTestHook(game, [], () => undefined);
    await hook.stage('r1-8s');
    const towers = game.sim.state.towers.length;
    expect(towers).toBeGreaterThan(0);
    game.restart(); // what Enter on an end card does: a fresh, unscripted R1 board
    expect(game.sim.state.towers.length).toBe(0);
    game.frame(1000 / 60); // the stale driver must not act on the retried board
    expect(game.sim.state.towers.length).toBe(0);
    await hook.stage('r1-8s');
    expect(game.sim.state.round).toBe(1);
    expect(game.sim.state.roundTick).toBeGreaterThanOrEqual(8 * 60);
    expect(game.sim.state.towers.length).toBe(towers);
  });
});

describe('F-029 victory opens with 1 s of quiet', () => {
  it('no R20 clear chime, no victory cue from the sim; music silent for 1 s, then the victory sting', () => {
    const rec = recordingAudio();
    const { game } = setup(rec.audio);
    const driver = createScriptDriver(SCRIPTS.win, {});
    let died = false;
    game.debug.newRun({ seed: SCRIPT_SEED }, true);
    game.setBeforeStep((s) => driver.beforeStep(s));
    game.debug.watch((e) => { if (e.type === 'bossDeath') died = true; });
    for (let i = 0; i < 60 * 60 * 30 && !died; i++) game.debug.frame(1000 / 60, false);
    expect(died).toBe(true);
    rec.events.length = 0;
    let victoryAt = -1;
    for (let i = 0; i < 60 * 120 && (victoryAt < 0 || game.debug.nowMs - victoryAt < 1200); i++) {
      game.frame(1000 / 60);
      if (victoryAt < 0 && game.scene() === 'victory') victoryAt = game.debug.nowMs;
      if (victoryAt >= 0 && game.debug.nowMs - victoryAt < 990) expect(rec.music.at(-1)?.state).toBe('silent');
    }
    expect(victoryAt).toBeGreaterThan(0);
    expect(rec.events.some((e) => e.type === 'roundClear')).toBe(false);
    expect(rec.events.some((e) => e.type === 'victory')).toBe(false);
    expect(rec.music.at(-1)?.state).toBe('victory');
  });
});
