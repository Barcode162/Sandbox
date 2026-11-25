// src/tuning/golem.ts — owned by WO-004. Plug in design/experience.md numbers here (frames are 60 Hz steps).
export const GOLEM = {
  maxHp: 30000,
  maxPoise: 100,
  radius: 1.3, // hurtbox radius, metres
  walkSpeed: 1.6,
  turnRate: 2.5,
  wakeFrames: 90,
  staggerFrames: 70,
  dyingFrames: 150,
  attacks: {
    slam: { windup: 54, strike: 10, recover: 50, radius: 3.2, damage: 1, range: 3.0 },
    sweep: { windup: 40, strike: 14, recover: 44, radius: 3.4, damage: 1, range: 3.2 },
    toss: { windup: 48, strike: 54, recover: 42, radius: 1.4, damage: 1, range: 99 },
    doubleSlam: { windup: 39, strike: 9, recover: 84, radius: 2.2, damage: 2, range: 5 },
  },
  cooldownFrames: 50,
  coinsOnDeath: 250,
} as const;

export const MINION = {
  maxHp: 2400,
  radius: 0.5,
  speed: 2.4,
  damage: 1,
  coins: 20,
} as const;
