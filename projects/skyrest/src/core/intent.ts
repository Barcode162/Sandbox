// src/core/intent.ts — FROZEN (WO-001).
import type { Intent } from '../contracts.ts';

export function neutralIntent(): Intent {
  return { moveX: 0, moveY: 0, camYaw: 0, attack: false, dodge: false, skill: false, pause: false, confirm: false };
}
export function resetIntent(i: Intent): Intent {
  i.moveX = 0;
  i.moveY = 0;
  i.camYaw = 0;
  i.attack = false;
  i.dodge = false;
  i.skill = false;
  i.pause = false;
  i.confirm = false;
  return i;
}
/** Clamp the stick to the unit disc in place. */
export function normaliseStick(i: Intent): Intent {
  const m = Math.hypot(i.moveX, i.moveY);
  if (m > 1) {
    i.moveX /= m;
    i.moveY /= m;
  }
  return i;
}
/** Screen stick → world ground vector for camera facing `yaw` (writes into out). moveY +1 = camera forward. */
export function stickToWorld(i: Readonly<Intent>, out: { x: number; z: number }): { x: number; z: number } {
  const c = Math.cos(i.camYaw), s = Math.sin(i.camYaw);
  out.x = i.moveX * c + i.moveY * s;
  out.z = i.moveX * s - i.moveY * c;
  return out;
}
