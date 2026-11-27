// src/tuning/follow.ts — owned by WO-003. Camera behaviour constants (experience.md §4.3: follow, lock-on, orbit, kick, shake).
export const FOLLOW = {
  posHalfLifeMs: 110,
  lookAheadM: 1.0,
  lookAheadHalfLifeMs: 350,
  /** Portrait framing lift (polish F-020): the follow target sits this far BEHIND the hero (toward the camera), so the
   *  hero rides above the thumb zone. Full at aspect ≤ 0.46, fading to 0 at 0.875 (the reference frame). */
  portraitLiftM: 1.2,
  lockOnRangeM: 16,
  lockOnGain: 0.6,
  lockOnMaxDeg: 35, // §4.3 said 60; polish F-015: 35 keeps the temple in frame
  yawHalfLifeMs: 450,
  yawReturnHalfLifeMs: 1200,
  orbitMaxDeg: 40,
  orbitDegPerPx: 0.25,
  orbitReturnMs: 2000,
  kickM: 0.06,
  kickFinisherM: 0.12,
  kickRollDeg: 0.4,
  kickHalfLifeMs: 60,
  shakePosM: 0.3,
  shakeRollDeg: 1.0,
  shakeHz: 22,
  traumaDecayPerS: 1.8,
} as const;
