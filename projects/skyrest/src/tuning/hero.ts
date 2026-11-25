// src/tuning/hero.ts — owned by WO-003. The design/experience.md §5 numbers, entered in ms and converted to 60 Hz
// steps with the contracts' rule (frames = round(ms × 0.06)). Sim code reads only the *frames* fields.
const f = (ms: number) => Math.round(ms * 0.06);
/** ms → fixed steps (contracts.ts header rule). */
export const msToFrames = f;

const DEG = Math.PI / 180;

/** One combo hit (§5 combo table). `cancel` = the "Next opens" frame (= end of active). */
export interface ComboHit {
  startupMs: number; activeMs: number; recoveryMs: number; nextMs: number; hitstopMs: number;
  startup: number; active: number; recovery: number; cancel: number;
  lunge: number; hop: number; damageMin: number; damageMax: number; poise: number;
}
const hit = (startupMs: number, activeMs: number, recoveryMs: number, nextMs: number, lunge: number, dmg: [number, number], hitstopMs: number, poise: number, hop = 0): ComboHit => ({
  startupMs, activeMs, recoveryMs, nextMs, hitstopMs,
  startup: f(startupMs), active: f(activeMs), recovery: f(recoveryMs), cancel: nextMs > 0 ? f(nextMs) : 999,
  lunge, hop, damageMin: dmg[0], damageMax: dmg[1], poise,
});

export const HERO = {
  /** Half-hearts: 5 hearts on the HUD. */
  maxHp: 10,
  runSpeed: 5.6, // m/s
  accel: 45, // m/s² → full speed in 125 ms
  decel: 60, // m/s² → stops in ~93 ms (< 6 steps)
  turnRate: 1080 * DEG, // rad/s while moving
  turnRateStartup: 180 * DEG, // rad/s during attack startup (0 in active/recovery)
  radius: 0.4,
  inputBufferMs: 200,
  inputBufferFrames: f(200),
  /** Combo resets this long after a recovery ends. */
  comboResetFrames: f(450),
  /** Hit reach measured to the target collider's surface, and the swing arc. */
  reach: 2.6,
  arcDeg: 150,
  combo: [
    hit(90, 80, 230, 170, 0.6, [1800, 2200], 60, 10), // 1: slash R→L
    hit(100, 90, 250, 190, 0.6, [1950, 2350], 70, 10), // 2: backslash L→R
    hit(180, 120, 420, 0, 1.2, [2600, 3100], 120, 30, 0.35), // 3: leaping spin overhead
  ] as readonly ComboHit[],
  critChance: 0.15,
  critMult: 1.6,
  critHitstopMs: 40,
  /** Damage multiplier on a staggered golem. */
  staggerMult: 1.25,
  /** Next hit after a perfect dodge. */
  perfectBonus: 1.2,
  skill: {
    startupMs: 140, tickGapMs: 160, recoveryMs: 380, cooldownMs: 8000, hitstopMs: 60,
    startup: f(140), tickGap: f(160), recovery: f(380), cooldown: f(8000),
    radius: 3.4, damageMin: 2400, damageMax: 2800, poise: 20,
  },
  dodge: {
    ms: 380, iframeStartMs: 40, iframeEndMs: 300, lockoutMs: 250,
    frames: f(380), iframeStart: f(40), iframeEnd: f(300), lockout: f(250), distance: 4.2,
  },
  perfect: { timeScale: 0.5, ms: 120, frames: f(120) },
  hurt: { ms: 350, frames: f(350), graceFrames: f(1000), knockback: 2.5 },
  death: { timeScale: 0.5, frames: f(600) },
  /** Footfall spacing: 2.6 run cycles/s (two footfalls each) at full speed. */
  footstepM: 5.6 / 5.2,
} as const;
