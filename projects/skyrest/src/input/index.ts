// src/input/index.ts — owned by WO-003. Unified intent from keyboard (WASD/arrows, J/Space = attack,
// K/Shift = dodge, L/E = skill, Esc/P = pause, Enter = confirm), mouse (left = attack, right = dodge), touch (left-thumb
// joystick, right Attack/Dodge buttons in input/touch.ts) and gamepad; plus the test script queue.
// Scaffold: keyboard + script only.
import type { CreateInput, InputDevice, Intent } from '../contracts.ts';
import { normaliseStick } from '../core/intent.ts';

export const createInput: CreateInput = (_root, _bus) => {
  const held = new Set<string>();
  const latched = { attack: false, dodge: false, skill: false, pause: false, confirm: false };
  let lastDevice: InputDevice = 'keyboard';
  const queue: { intent: Partial<Intent>; frames: number }[] = [];
  const onDown = (e: KeyboardEvent) => {
    lastDevice = 'keyboard';
    if (e.repeat) return;
    held.add(e.code);
    if (e.code === 'KeyJ' || e.code === 'Space') latched.attack = true;
    if (e.code === 'KeyK' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') latched.dodge = true;
    if (e.code === 'Escape' || e.code === 'KeyP') latched.pause = true;
    if (e.code === 'KeyL' || e.code === 'KeyE') latched.skill = true;
    if (e.code === 'Enter') latched.confirm = true;
  };
  const onUp = (e: KeyboardEvent) => held.delete(e.code);
  const onBlur = () => held.clear();
  addEventListener('keydown', onDown);
  addEventListener('keyup', onUp);
  addEventListener('blur', onBlur);
  const k = (a: string, b: string) => (held.has(a) || held.has(b) ? 1 : 0);
  return {
    get lastDevice() {
      return lastDevice;
    },
    get scriptedFrames() {
      return queue.reduce((n, q) => n + q.frames, 0);
    },
    script(intent, frames) {
      queue.push({ intent, frames: Math.max(1, frames) });
    },
    sample(into) {
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
        if (--q.frames <= 0) queue.shift();
        return;
      }
      into.moveX = k('KeyD', 'ArrowRight') - k('KeyA', 'ArrowLeft');
      into.moveY = k('KeyW', 'ArrowUp') - k('KeyS', 'ArrowDown');
      normaliseStick(into);
      into.attack = latched.attack;
      into.dodge = latched.dodge;
      into.skill = latched.skill;
      into.pause = latched.pause;
      into.confirm = latched.confirm;
      latched.attack = latched.dodge = latched.skill = latched.pause = latched.confirm = false;
    },
    setTouchControlsVisible() {},
    dispose() {
      removeEventListener('keydown', onDown);
      removeEventListener('keyup', onUp);
      removeEventListener('blur', onBlur);
    },
  };
};
