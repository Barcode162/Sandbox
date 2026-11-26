// src/input/index.ts — owned by WO-003. One Intent per sim step from every device (experience.md §4.6):
// keyboard WASD/arrows move, J strike, Space (or Shift) roll, K (or L) skill, Q/E orbit, Esc/P pause, Enter confirm;
// mouse left-click strike, right-drag orbit; gamepad LS move, A strike, B roll, X skill, RS orbit, Start pause;
// touch: floating joystick + Attack/Dodge/Skill (input/touch.ts). Presses are latched edges: exactly one step each.
// Test scripts (hooks.inject) take precedence over devices.
import type { CreateInput, InputDevice, Intent } from '../contracts.ts';
import { normaliseStick } from '../core/intent.ts';
import { LINK } from './link.ts';
import { createTouchControls } from './touch.ts';

const ORBIT_KEY_DEG_S = 70;
const ORBIT_PAD_DEG_S = 110;
const PAD_DEAD = 0.18;

export const createInput: CreateInput = (root, bus) => {
  const held = new Set<string>();
  const latched = { attack: false, dodge: false, skill: false, pause: false, confirm: false };
  const queue: { intent: Partial<Intent>; frames: number }[] = [];
  let scripted = 0;
  let lastDevice: InputDevice = 'keyboard';
  const stick = { x: 0, y: 0 };
  const canvas = root.querySelector('canvas');
  const isStage = (t: EventTarget | null) => t === canvas || (t instanceof HTMLElement && t.classList.contains('overlay'));

  const touch = createTouchControls(root, bus, {
    press(k) {
      latched[k] = true;
      lastDevice = 'touch';
    },
    stick(x, y) {
      stick.x = x;
      stick.y = y;
      lastDevice = 'touch';
    },
  });

  const onDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    lastDevice = 'keyboard';
    touch.setTouchMode(false);
    const c = e.code;
    if (c === 'Space' || c.startsWith('Arrow')) e.preventDefault();
    if (e.repeat) return;
    held.add(c);
    if (c === 'KeyJ') latched.attack = true;
    else if (c === 'Space' || c === 'ShiftLeft' || c === 'ShiftRight') latched.dodge = true;
    else if (c === 'KeyK' || c === 'KeyL') latched.skill = true;
    else if (c === 'Escape' || c === 'KeyP') latched.pause = true;
    else if (c === 'Enter' || c === 'NumpadEnter') latched.confirm = true;
  };
  const onUp = (e: KeyboardEvent) => held.delete(e.code);
  const onBlur = () => {
    held.clear();
    stick.x = stick.y = 0;
  };
  // Mouse: left = strike on the game view (not on UI buttons); right-drag = orbit.
  let orbitPointer = -1, orbitX = 0;
  const onMouseDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    lastDevice = 'mouse';
    touch.setTouchMode(false);
    if (!isStage(e.target)) return;
    if (e.button === 0) latched.attack = true;
    else if (e.button === 2) {
      orbitPointer = e.pointerId;
      orbitX = e.clientX;
    }
  };
  const onMouseMove = (e: PointerEvent) => {
    if (e.pointerId !== orbitPointer) return;
    LINK.orbitDeg += (e.clientX - orbitX) * 0.25;
    LINK.orbitAt = performance.now();
    orbitX = e.clientX;
  };
  const onMouseUp = (e: PointerEvent) => {
    if (e.pointerId === orbitPointer) orbitPointer = -1;
  };
  const onContext = (e: Event) => {
    if (isStage(e.target)) e.preventDefault();
  };
  addEventListener('keydown', onDown);
  addEventListener('keyup', onUp);
  addEventListener('blur', onBlur);
  root.addEventListener('pointerdown', onMouseDown);
  addEventListener('pointermove', onMouseMove);
  addEventListener('pointerup', onMouseUp);
  root.addEventListener('contextmenu', onContext);

  // Gamepad edges.
  const padPrev = [false, false, false, false, false, false, false, false, false, false];
  let padActive = false;
  const pollPad = (into: Intent): boolean => {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : null;
    const p = pads ? pads[0] ?? pads[1] ?? null : null;
    if (!p || !p.connected) {
      if (padActive) LINK.orbitRate = 0;
      padActive = false;
      return false;
    }
    const ax = p.axes[0] ?? 0, ay = p.axes[1] ?? 0, rx = p.axes[2] ?? 0;
    const btn = (i: number) => !!p.buttons[i]?.pressed;
    const edge = (i: number) => {
      const b = btn(i);
      const e = b && !padPrev[i];
      padPrev[i] = b;
      return e;
    };
    const m = Math.hypot(ax, ay);
    const used = m > PAD_DEAD || Math.abs(rx) > PAD_DEAD || p.buttons.some((b) => b.pressed);
    if (used) {
      padActive = true;
      lastDevice = 'gamepad';
    }
    if (m > PAD_DEAD) {
      const k = (Math.min(1, m) - PAD_DEAD) / (1 - PAD_DEAD) / m;
      into.moveX = ax * k;
      into.moveY = -ay * k;
    }
    if (edge(0)) {
      into.attack = true;
      into.confirm = true;
    }
    if (edge(1)) into.dodge = true;
    if (edge(2)) into.skill = true;
    if (edge(9)) into.pause = true;
    if (padActive) {
      LINK.orbitRate = Math.abs(rx) > PAD_DEAD ? rx * ORBIT_PAD_DEG_S : 0;
      if (LINK.orbitRate !== 0) LINK.orbitAt = performance.now();
    }
    return true;
  };

  const k = (a: string, b: string) => (held.has(a) || held.has(b) ? 1 : 0);
  const manager = {
    get lastDevice() {
      return lastDevice;
    },
    get scriptedFrames() {
      return scripted;
    },
    script(intent: Partial<Intent>, frames: number) {
      const n = Math.max(1, frames);
      queue.push({ intent, frames: n });
      scripted += n;
    },
    sample(into: Intent) {
      const q = queue[0];
      if (q) {
        into.moveX = q.intent.moveX ?? 0;
        into.moveY = q.intent.moveY ?? 0;
        into.attack = q.intent.attack ?? false;
        into.dodge = q.intent.dodge ?? false;
        into.skill = q.intent.skill ?? false;
        if (q.intent.camYaw !== undefined) into.camYaw = q.intent.camYaw;
        into.pause = q.intent.pause ?? false;
        into.confirm = q.intent.confirm ?? false;
        scripted--;
        if (--q.frames <= 0) queue.shift();
        return;
      }
      // Keyboard and touch stick add; the pad overrides the stick when pushed.
      into.moveX = k('KeyD', 'ArrowRight') - k('KeyA', 'ArrowLeft') + stick.x;
      into.moveY = k('KeyW', 'ArrowUp') - k('KeyS', 'ArrowDown') + stick.y;
      into.attack = latched.attack;
      into.dodge = latched.dodge;
      into.skill = latched.skill;
      into.pause = latched.pause;
      into.confirm = latched.confirm;
      pollPad(into);
      normaliseStick(into);
      latched.attack = latched.dodge = latched.skill = latched.pause = latched.confirm = false;
      // Q/E orbit (held).
      const qe = k('KeyE', 'KeyE') - k('KeyQ', 'KeyQ');
      if (!padActive) LINK.orbitRate = qe * ORBIT_KEY_DEG_S;
      if (qe !== 0) LINK.orbitAt = performance.now();
    },
    setTouchControlsVisible(visible: boolean) {
      touch.setAllowed(visible);
    },
    dispose() {
      removeEventListener('keydown', onDown);
      removeEventListener('keyup', onUp);
      removeEventListener('blur', onBlur);
      root.removeEventListener('pointerdown', onMouseDown);
      removeEventListener('pointermove', onMouseMove);
      removeEventListener('pointerup', onMouseUp);
      root.removeEventListener('contextmenu', onContext);
      touch.dispose();
    },
  };
  return manager;
};
