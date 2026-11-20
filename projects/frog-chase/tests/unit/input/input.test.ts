import { describe, expect, it, vi } from 'vitest';
import type { Intent } from '../../../src/contracts';
import { createInput, keyToIntent, padDirection, tapToIntent, type PadLike } from '../../../src/input/input';

function fakeWindow(width = 375) {
  const ls = new Map<string, Set<EventListener>>();
  return {
    innerWidth: width,
    addEventListener: (t: string, f: EventListener) => void (ls.get(t) ?? ls.set(t, new Set()).get(t)!).add(f),
    removeEventListener: (t: string, f: EventListener) => void ls.get(t)?.delete(f),
    emit(t: string, e: object) {
      for (const f of ls.get(t) ?? []) f(e as Event);
    },
    count: () => [...ls.values()].reduce((n, s) => n + s.size, 0),
  };
}

const key = (k: string, extra: Record<string, unknown> = {}) => ({ key: k, code: '', preventDefault: vi.fn(), ...extra });
const tap = (x: number, extra: Record<string, unknown> = {}) => ({ clientX: x, clientY: 400, button: 0, pointerType: 'touch', target: null, preventDefault: vi.fn(), ...extra });

function rig(opts: { pick?: (x: number, y: number) => number | null; consume?: boolean; pads?: PadLike[] } = {}) {
  const win = fakeWindow();
  const got: Intent[] = [];
  const gestures = vi.fn();
  const release = vi.fn();
  const pads = opts.pads ?? [];
  const input = createInput(win, {
    pick: opts.pick ?? (() => null),
    onIntent: (i) => (got.push(i), opts.consume ?? true),
    onGesture: gestures,
    getGamepads: () => pads,
    releaseFocus: release,
  });
  return { win, got, gestures, release, input, pads };
}

describe('keyboard (§4.5)', () => {
  it('maps arrows, WASD by physical key, Space, Enter, Esc/P and M', () => {
    const cases: [Record<string, string>, Intent][] = [
      [{ key: 'ArrowLeft' }, { type: 'hop', slot: 'L' }],
      [{ key: 'ArrowUp' }, { type: 'hop', slot: 'F' }],
      [{ key: 'ArrowRight' }, { type: 'hop', slot: 'R' }],
      [{ key: ' ', code: 'Space' }, { type: 'hop', slot: 'F' }],
      [{ key: 'a', code: 'KeyA' }, { type: 'hop', slot: 'L' }],
      [{ key: 'w', code: 'KeyW' }, { type: 'hop', slot: 'F' }],
      [{ key: 'D', code: 'KeyD' }, { type: 'hop', slot: 'R' }],
      [{ key: 'z', code: 'KeyW' }, { type: 'hop', slot: 'F' }], // AZERTY: physical W position
      [{ key: 'Enter', code: 'Enter' }, { type: 'confirm' }],
      [{ key: 'Escape', code: 'Escape' }, { type: 'pause' }],
      [{ key: 'p', code: 'KeyP' }, { type: 'pause' }],
      [{ key: 'M', code: 'KeyM' }, { type: 'mute' }],
    ];
    for (const [e, want] of cases) expect(keyToIntent({ key: e.key!, code: e.code ?? '' }), JSON.stringify(e)).toEqual(want);
    expect(keyToIntent({ key: 'x', code: 'KeyX' })).toBeNull();
    expect(keyToIntent({ key: 'Tab', code: 'Tab' })).toBeNull();
  });

  it('ignores auto-repeat and modifier chords, prevents default only when consumed', () => {
    const { win, got, gestures, release } = rig();
    const held = key('ArrowUp', { repeat: true });
    win.emit('keydown', held);
    win.emit('keydown', key('ArrowLeft', { ctrlKey: true }));
    win.emit('keydown', key('r', { metaKey: true }));
    expect(got).toEqual([]);
    expect(held.preventDefault).toHaveBeenCalled(); // held Space/arrow never scrolls
    const ok = key('ArrowUp');
    win.emit('keydown', ok);
    expect(got).toEqual([{ type: 'hop', slot: 'F' }]);
    expect(ok.preventDefault).toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
    expect(gestures).toHaveBeenCalledTimes(1);

    const r2 = rig({ consume: false });
    const enter = key('Enter');
    r2.win.emit('keydown', enter);
    expect(r2.got).toEqual([{ type: 'confirm' }]);
    expect(enter.preventDefault).not.toHaveBeenCalled(); // a focused menu button still gets Enter
  });
});

describe('touch (§4.5)', () => {
  it('maps screen thirds at 375 px', () => {
    const none = () => null;
    expect(tapToIntent(10, 400, 375, none)).toEqual({ type: 'hop', slot: 'L' });
    expect(tapToIntent(124.9, 400, 375, none)).toEqual({ type: 'hop', slot: 'L' });
    expect(tapToIntent(125, 400, 375, none)).toEqual({ type: 'hop', slot: 'F' });
    expect(tapToIntent(249.9, 400, 375, none)).toEqual({ type: 'hop', slot: 'F' });
    expect(tapToIntent(250, 400, 375, none)).toEqual({ type: 'hop', slot: 'R' });
  });

  it('prefers the tapped pad over its third', () => {
    const { win, got } = rig({ pick: (x) => (x < 50 ? 12 : null) });
    win.emit('pointerdown', tap(20));
    win.emit('pointerdown', tap(300));
    expect(got).toEqual([{ type: 'hopPad', padId: 12 }, { type: 'hop', slot: 'R' }]);
  });

  it('leaves presses on UI controls and non-primary mouse buttons alone, but still unlocks audio', () => {
    const button = { closest: (s: string) => (s.includes('button') ? {} : null) };
    const { win, got, gestures } = rig();
    win.emit('pointerdown', tap(200, { target: button }));
    win.emit('pointerdown', tap(200, { button: 2, pointerType: 'mouse' }));
    expect(got).toEqual([]);
    expect(gestures).toHaveBeenCalledTimes(2);
    win.emit('pointerup', {});
    win.emit('touchend', {});
    expect(gestures).toHaveBeenCalledTimes(4); // touch activation arrives on release
  });

  it('removes every listener on dispose', () => {
    const { win, input } = rig();
    expect(win.count()).toBe(4);
    input.dispose();
    expect(win.count()).toBe(0);
  });
});

describe('gamepad (§4.5)', () => {
  const pad = (pressed: number[] = [], axes: number[] = [0, 0]): PadLike => ({
    connected: true,
    buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })),
    axes,
  });

  it('reads the D-pad and the left stick at deadzone 0.5', () => {
    expect(padDirection(pad([14]))).toBe('L');
    expect(padDirection(pad([12]))).toBe('F');
    expect(padDirection(pad([15]))).toBe('R');
    expect(padDirection(pad([], [-0.49, 0]))).toBeNull();
    expect(padDirection(pad([], [-0.6, 0.1]))).toBe('L');
    expect(padDirection(pad([], [0.7, -0.2]))).toBe('R');
    expect(padDirection(pad([], [0.1, -0.8]))).toBe('F');
    expect(padDirection(pad([], [0, 0.9]))).toBeNull(); // down is not a move
  });

  it('is edge-triggered: a held direction or button fires once', () => {
    const r = rig();
    r.pads.push(pad([], [-0.9, 0]));
    r.input.poll();
    r.input.poll();
    r.pads[0] = pad([0], [-0.9, 0]);
    r.input.poll();
    r.pads[0] = pad([0, 9], [0, 0]);
    r.input.poll();
    r.pads[0] = pad([], [-0.9, 0]);
    r.input.poll();
    expect(r.got).toEqual([
      { type: 'hop', slot: 'L' },
      { type: 'hop', slot: 'F' },
      { type: 'pause' },
      { type: 'hop', slot: 'L' },
    ]);
  });
});
