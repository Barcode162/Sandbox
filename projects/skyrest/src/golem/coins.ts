// src/golem/coins.ts — owned by WO-004. The coin burst as pure functions of sim time, shared by the golem view
// (3D spinning coins: fountain, bounce, rest) and the UI (hand-off to a screen-space flight into the coin pill).
// Everything derives from SimState (golem dying/dead frames, minion dead frames), so pause, manual stepping
// and moments all agree. Pure: no three/DOM.
import type { GolemState, MinionState, SimState } from '../contracts.ts';
import { GOLEM, MINION, golemCoinsForWave } from '../tuning/golem.ts';
import { groundHeight } from '../world/ground.ts';

const G = 9.8;
/** Screen-space flight to the pill (experience.md §4.7: 650 ms per coin, 25 ms stagger). */
export const COIN_FLY_S = 0.65;
export const COIN_STAGGER_S = 0.025;

export interface CoinBurst {
  count: number;
  /** Total value; coin i carries valueOf(i). */
  amount: number;
  /** Launch speed up (m/s) and outward range. */
  up: number;
  out: number;
  /** When the first coin leaves the ground for the pill (s after the burst). */
  handoff: number;
}
export const GOLEM_BURST: CoinBurst = { count: GOLEM.coinCount, amount: GOLEM.coinsOnDeath, up: 7, out: 1.6, handoff: 1.55 };
export const MINION_BURST: CoinBurst = { count: MINION.coinCount, amount: MINION.coins, up: 4, out: 0.9, handoff: 0.75 };

/** Integer value of coin i so the burst sums exactly to `amount`. */
export const coinValue = (i: number, count: number, amount: number) => Math.floor(((i + 1) * amount) / count) - Math.floor((i * amount) / count);

/** Deterministic per-coin hash in [0, 1). */
function h(i: number, k: number): number {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** When coin i is handed to the UI (s after the burst). */
export const handoffTime = (b: CoinBurst, i: number) => b.handoff + i * COIN_STAGGER_S;
/** When coin i lands in the pill. */
export const arrivalTime = (b: CoinBurst, i: number) => handoffTime(b, i) + COIN_FLY_S;

/** World position of coin i, t seconds after the burst at (ox, oz) (y includes the ground). Returns spin angle. */
export function coinWorld(b: CoinBurst, i: number, ox: number, oz: number, t: number, out: { x: number; y: number; z: number }): number {
  const delay = h(i, 1) * 0.12;
  const tt = Math.max(0, t - delay);
  const ang = h(i, 2) * Math.PI * 2;
  const vo = b.out * (0.35 + 0.65 * h(i, 3));
  const vy = b.up * (0.82 + 0.18 * h(i, 4));
  const y0 = b === GOLEM_BURST ? 1.6 : 0.4;
  // Flight 1 until it falls back to the ground, then one small bounce (restitution 0.3), then rest.
  const t1 = (vy + Math.sqrt(vy * vy + 2 * G * y0)) / G;
  let y: number, d: number;
  if (tt < t1) {
    y = y0 + vy * tt - 0.5 * G * tt * tt;
    d = vo * tt;
  } else {
    const vb = 0.3 * (G * t1 - vy);
    const t2 = (2 * vb) / G;
    const u = tt - t1;
    if (u < t2) {
      y = vb * u - 0.5 * G * u * u;
      d = vo * t1 + vo * 0.4 * u;
    } else {
      y = 0;
      d = vo * t1 + vo * 0.4 * t2;
    }
  }
  out.x = ox + Math.sin(ang) * d;
  out.z = oz - Math.cos(ang) * d;
  out.y = groundHeight(out.x, out.z) + 0.12 + Math.max(0, y);
  return tt * (9 + 5 * h(i, 5)) + h(i, 6) * 6;
}

/** Seconds since the golem's coin burst, or -1 if it has not died. */
export function golemBurstTime(g: GolemState, alpha = 1): number {
  if (g.action === 'dying') return Math.max(0, g.actionFrame - 1 + alpha) / 60;
  if (g.action === 'dead') return (GOLEM.dyingFrames + g.actionFrame - 1 + alpha) / 60;
  return -1;
}
/** Seconds since a minion popped, or -1. */
export const minionBurstTime = (m: MinionState, alpha = 1) => (m.action === 'dead' ? Math.max(0, m.actionFrame - 1 + alpha) / 60 : -1);

/** The golem burst for this wave (value grows 20 % per wave). */
export function golemBurst(s: Readonly<SimState>, into: CoinBurst): CoinBurst {
  into.count = GOLEM_BURST.count;
  into.up = GOLEM_BURST.up;
  into.out = GOLEM_BURST.out;
  into.handoff = GOLEM_BURST.handoff;
  into.amount = golemCoinsForWave(s.wave);
  return into;
}

/** Coins already counted by the sim but still in the air: the pill shows `s.coins − unarrived(s)`. */
export function unarrived(s: Readonly<SimState>, scratch: CoinBurst): number {
  let pending = 0;
  const tg = golemBurstTime(s.golem);
  if (tg >= 0) {
    const b = golemBurst(s, scratch);
    for (let i = 0; i < b.count; i++) if (tg < arrivalTime(b, i)) pending += coinValue(i, b.count, b.amount);
  }
  for (let m = 0; m < s.minions.length; m++) {
    const tm = minionBurstTime(s.minions[m]!);
    if (tm < 0) continue;
    for (let i = 0; i < MINION_BURST.count; i++) if (tm < arrivalTime(MINION_BURST, i)) pending += coinValue(i, MINION_BURST.count, MINION_BURST.amount);
  }
  return pending;
}
