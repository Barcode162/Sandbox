// src/tuning/hero.ts — owned by WO-003. Plug in design/experience.md numbers here (frames are 60 Hz steps).
export const HERO = {
  maxHp: 6, // hearts ×1 (half-hearts not used)
  runSpeed: 5.2, // m/s
  accel: 40, // m/s²
  decel: 50,
  turnRate: 18, // rad/s
  radius: 0.4,
  inputBufferFrames: 10,
  combo: [
    // startup = frames before the hitbox opens, active = hitbox frames, recovery = until idle, cancel = earliest next-combo frame
    { startup: 5, active: 4, recovery: 14, cancel: 12, damage: 820, reach: 1.9, arcDeg: 150, lunge: 1.2, hitstop: 4, poise: 10 },
    { startup: 5, active: 4, recovery: 14, cancel: 12, damage: 960, reach: 1.9, arcDeg: 150, lunge: 1.2, hitstop: 4, poise: 10 },
    { startup: 8, active: 5, recovery: 22, cancel: 99, damage: 1650, reach: 2.3, arcDeg: 200, lunge: 1.8, hitstop: 8, poise: 25 },
  ],
  critChance: 0.2,
  critMult: 1.8,
  damageJitter: 0.12,
  dodge: { frames: 22, iframeStart: 1, iframeEnd: 16, distance: 4.2, cooldown: 6 },
  hurt: { frames: 18, graceFrames: 60, knockback: 2.5 },
} as const;
