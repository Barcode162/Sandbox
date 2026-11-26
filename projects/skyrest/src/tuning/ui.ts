// src/tuning/ui.ts — owned by WO-004. HUD/menu tokens and timings (experience.md §4.6, §4.7, §8, §9).
export const UI = {
  /** Nameplate: projected at the golem's head + 1 m, clamped with an 8 % inset, kept clear of the coin pill. */
  nameplateInset: 0.08,
  /** HP lag chunk: hold 450 ms, then drain over 600 ms (easeInOutCubic). */
  lagHoldS: 0.45,
  lagDrainS: 0.6,
  nameplateFadeS: 0.25,
  /** Pill bump: at most one per 60 ms; the last digit flashes crit gold for 120 ms. */
  bumpGapS: 0.06,
  /** Hint timings (s). */
  hintS: 1.5,
  bridgeLineS: 2.6,
  /** Hero within this distance (m) of the bridge foot sees "The way up is sealed… for now." */
  bridgeNear: 3.4,
  /** Hurt vignette: #ff3b3b at 25 % fading over 300 ms. */
  vignetteS: 0.3,
  /** Desktop controls legend fades after 8 s of fighting. */
  legendS: 8,
  /** RESTART FIGHT asks for a second tap within 2 s. */
  confirmS: 2,
  /** Retry / next wave: the veil fades in this long before the sim resets (ms). */
  veilInMs: 120,
} as const;

/** Copy (experience.md §9 Voice). */
export const COPY = {
  title: 'Skyrest',
  subtitle: 'A quiet isle. A stone that remembers.',
  promptTouch: 'Tap to begin',
  promptKeys: 'Press any key',
  boss: 'Stone Guardian',
  roll: 'Roll through it!',
  skill: 'Unleash Gale Crescent',
  kindles: 'The Guardian kindles.',
  bridge: 'The way up is sealed… for now.',
  victory: 'Sky cleared',
  victorySub: 'The runes go quiet. For a while.',
  fallen: 'Fallen',
  fallenSub: 'The Guardian holds the bridge. Again?',
  legend: 'WASD move · J / click strike · Space roll · K skill · Q/E orbit · Esc pause',
} as const;
