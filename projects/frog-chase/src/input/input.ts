/**
 * Keyboard / touch / gamepad → Intent (§4.5). OWNER: WO-004.
 *
 * - Keys: ←/A · ↑/W/Space · →/D hop; Enter confirms; Esc/P pause; M mutes. `repeat` is ignored, and
 *   so are chords with Ctrl/Meta/Alt (browser shortcuts keep working). WASD match by physical key
 *   (`code`) so they sit under the left hand on any layout; P and M match the printed letter.
 * - Touch/mouse: a press on a reachable pad (`pick`, hit radius 1.4r) hops to that pad; anywhere else
 *   hops by screen third. Presses on buttons and form controls belong to the UI and are skipped.
 * - Gamepad: D-pad or left stick (deadzone 0.5), A = forward, Start = pause; all edge-triggered in poll().
 *
 * onIntent returns whether the game consumed the intent; only consumed keys are preventDefault-ed, so
 * a focused pause-menu button still answers Enter/Space natively.
 */
import type { InputSource, Intent, Slot } from '../contracts';

/** Minimal shapes so the module runs (and is unit-tested) without a DOM. */
export interface KeyLike {
  key: string;
  code?: string;
  repeat?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  target?: unknown;
  preventDefault(): void;
}

export interface PointerLike {
  clientX: number;
  clientY: number;
  button: number;
  pointerType?: string;
  target?: unknown;
  preventDefault(): void;
}

export interface PadLike {
  connected?: boolean;
  buttons: readonly { pressed: boolean }[];
  axes: readonly number[];
}

export interface InputTarget {
  addEventListener(type: string, fn: EventListener, opts?: AddEventListenerOptions | boolean): void;
  removeEventListener(type: string, fn: EventListener, opts?: EventListenerOptions | boolean): void;
  innerWidth: number;
}

export interface InputOptions {
  /** Pad id under a client point if it is a current choice, else null. */
  pick: (clientX: number, clientY: number) => number | null;
  /** Map an intent to game action. Return true if consumed (the key's default is then prevented). */
  onIntent: (i: Intent) => boolean;
  /** Every user gesture (for the AudioContext unlock). Called before onIntent. */
  onGesture?: () => void;
  /** Defaults to navigator.getGamepads. */
  getGamepads?: () => readonly (PadLike | null)[];
  /** Defaults to blurring document.activeElement (so Space after a mouse click hops, not re-clicks). */
  releaseFocus?: () => void;
}

const HOPS: Readonly<Record<Slot, Intent>> = { L: { type: 'hop', slot: 'L' }, F: { type: 'hop', slot: 'F' }, R: { type: 'hop', slot: 'R' } };
const HOP = (slot: Slot): Intent => HOPS[slot];

/** Pure key mapping (§4.5). */
export function keyToIntent(e: Pick<KeyLike, 'key' | 'code'>): Intent | null {
  switch (e.key) {
    case 'ArrowLeft':
      return HOP('L');
    case 'ArrowUp':
    case ' ':
      return HOP('F');
    case 'ArrowRight':
      return HOP('R');
    case 'Enter':
      return { type: 'confirm' };
    case 'Escape':
      return { type: 'pause' };
  }
  switch (e.code) {
    case 'KeyA':
      return HOP('L');
    case 'KeyW':
    case 'Space':
      return HOP('F');
    case 'KeyD':
      return HOP('R');
  }
  switch (e.key.toLowerCase()) {
    case 'p':
      return { type: 'pause' };
    case 'm':
      return { type: 'mute' };
  }
  return null;
}

/** Pure tap mapping: the pad itself first, then the screen third. */
export function tapToIntent(x: number, y: number, width: number, pick: (x: number, y: number) => number | null): Intent {
  const pad = pick(x, y);
  if (pad !== null) return { type: 'hopPad', padId: pad };
  const third = width / 3;
  return HOP(x < third ? 'L' : x >= 2 * third ? 'R' : 'F');
}

const UI_SELECTOR = 'button, a, input, select, textarea, label, [role="button"], [data-ui-control]';

/** True when a press landed on a UI control (it owns that press, not the pond). */
export function isUiControl(target: unknown): boolean {
  const t = target as { closest?: (s: string) => unknown } | null | undefined;
  return !!t && typeof t.closest === 'function' && !!t.closest(UI_SELECTOR);
}

/** Gamepad direction at the deadzone (§4.5: 0.5), D-pad first. Standard mapping. */
export function padDirection(p: PadLike): Slot | null {
  const b = (i: number) => !!p.buttons[i]?.pressed;
  if (b(14)) return 'L';
  if (b(15)) return 'R';
  if (b(12)) return 'F';
  const x = p.axes[0] ?? 0;
  const y = p.axes[1] ?? 0;
  if (Math.abs(x) >= 0.5 && Math.abs(x) >= Math.abs(y)) return x < 0 ? 'L' : 'R';
  if (y <= -0.5) return 'F';
  return null;
}

interface PadMemory {
  dir: Slot | null;
  a: boolean;
  start: boolean;
}

function defaultGamepads(): readonly (PadLike | null)[] {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  try {
    return nav && typeof nav.getGamepads === 'function' ? nav.getGamepads() : [];
  } catch {
    return [];
  }
}

function defaultReleaseFocus(): void {
  if (typeof document === 'undefined') return;
  const el = document.activeElement as HTMLElement | null;
  if (el && el !== document.body && typeof el.blur === 'function') el.blur();
}

export function createInput(target: InputTarget, opts: InputOptions): InputSource {
  const getPads = opts.getGamepads ?? defaultGamepads;
  const releaseFocus = opts.releaseFocus ?? defaultReleaseFocus;
  const gesture = () => opts.onGesture?.();
  const memory = new Map<number, PadMemory>();

  const onKey = (e: KeyLike) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const intent = keyToIntent(e);
    if (!intent) return;
    if (e.repeat) {
      // Held keys never re-fire, but keep Space/arrows from scrolling while held.
      if (intent.type === 'hop') e.preventDefault();
      return;
    }
    gesture();
    if (opts.onIntent(intent)) {
      e.preventDefault();
      // A button keeps focus after a mouse click; drop it so the next Space hops instead of re-clicking.
      if (intent.type === 'hop' || intent.type === 'confirm') releaseFocus();
    }
  };

  const onPointerDown = (e: PointerLike) => {
    gesture();
    if (e.button !== 0 || isUiControl(e.target)) return;
    if (opts.onIntent(tapToIntent(e.clientX, e.clientY, target.innerWidth, opts.pick)) && e.pointerType !== 'mouse') {
      e.preventDefault();
    }
  };

  // Touch only grants user activation on release; unlock again there so iOS/Android audio starts.
  const onRelease = () => gesture();

  target.addEventListener('keydown', onKey as unknown as EventListener);
  target.addEventListener('pointerdown', onPointerDown as unknown as EventListener);
  target.addEventListener('pointerup', onRelease, true);
  target.addEventListener('touchend', onRelease, true);

  return {
    poll() {
      const pads = getPads();
      for (let i = 0; i < pads.length; i++) {
        const p = pads[i];
        if (!p || p.connected === false) {
          memory.delete(i);
          continue;
        }
        let m = memory.get(i);
        if (!m) memory.set(i, (m = { dir: null, a: false, start: false }));
        const dir = padDirection(p);
        const a = !!p.buttons[0]?.pressed;
        const start = !!p.buttons[9]?.pressed;
        if (dir && dir !== m.dir) {
          gesture();
          opts.onIntent(HOP(dir));
        }
        if (a && !m.a) {
          gesture();
          opts.onIntent(HOP('F'));
        }
        if (start && !m.start) {
          gesture();
          opts.onIntent({ type: 'pause' });
        }
        // Mutated in place: one memory record per pad slot, nothing allocated per poll (F-006).
        m.dir = dir;
        m.a = a;
        m.start = start;
      }
    },
    dispose() {
      target.removeEventListener('keydown', onKey as unknown as EventListener);
      target.removeEventListener('pointerdown', onPointerDown as unknown as EventListener);
      target.removeEventListener('pointerup', onRelease, true);
      target.removeEventListener('touchend', onRelease, true);
    },
  };
}
