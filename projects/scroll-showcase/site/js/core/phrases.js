// Placard phrases, placard label and admire announcement (experience spec §7.4, §7.5, §7.7).
// `placardPhrase` is frame-accurate: each scene's p-range is cut into half-open bands
// [a, b), and the last band also includes 1. Pure module: no DOM, no clock.

import { COPY, format, sceneNumber } from './copy.js';

/**
 * Per scene: the band start points and their phrases, in order. Band i covers
 * [starts[i], starts[i+1]); the last band covers [starts[n-1], 1].
 * The Scene 2 cuts .161 / .329 / .497 / .665 / .833 are where the cursor c
 * crosses k + 0.5, i.e. where the dominant colour changes (§7.5).
 * @type {ReadonlyArray<ReadonlyArray<readonly [number, string]>>}
 */
export const PHRASES = Object.freeze([
  // 1 Incidence
  Object.freeze([
    [0, 'White, waiting for an angle.'],
    [0.04, 'The glass turns. The white gives way.'],
    [0.25, 'Seven colours, fanning out.'],
    [0.45, 'The full fan. Nothing in it is mixed.'],
    [0.6, 'The rays stand up, one by one.'],
    [0.88, 'Seven bands, standing.'],
  ]),
  // 2 Field
  Object.freeze([
    [0, 'Seven bands, equal for now.'],
    [0.05, 'Vermilion takes the room.'],
    [0.161, 'Tangerine, standing in it.'],
    [0.329, 'Saffron: the brightest room in the house.'],
    [0.497, 'Jade, cool underfoot.'],
    [0.665, 'Azure, standing in it.'],
    [0.833, 'Cobalt, and a grid arriving.'],
    [0.95, 'Cobalt, pricked with points of light.'],
  ]),
  // 3 Refraction
  Object.freeze([
    [0, 'A sharp edge enters.'],
    [0.1, 'Through the glass, the dots grow and split.'],
    [0.42, 'Triangle and circle, crossing paths.'],
    [0.58, 'Separating. A third shape arrives.'],
    [0.88, 'Three pieces of glass on a shelf.'],
  ]),
  // 4 Dichroic
  Object.freeze([
    [0, 'The glass goes; the dots stay.'],
    [0.1, 'The dots join into a lattice.'],
    [0.3, 'Low light from the left.'],
    [0.44, 'Light overhead; every facet answers.'],
    [0.56, 'The light moves right, and warms.'],
    [0.8, 'The crystal remembers its spectrum.'],
    [0.96, 'Seven bands again.'],
  ]),
  // 5 Agreement
  Object.freeze([
    [0, 'Seven bands, about to narrow.'],
    [0.08, 'Narrowing into beams.'],
    [0.25, 'A colonnade of light.'],
    [0.4, 'Neighbours overlap, and lighten.'],
    [0.7, 'Almost agreed.'],
    [0.93, 'Agreed: white.'],
  ]),
  // 6 Return
  Object.freeze([
    [0, 'The white beam widens into a wall.'],
    [0.4, 'An empty wall. Rest here.'],
    [0.52, 'The prism, drawn again in line.'],
    [0.8, 'Where you came in.'],
  ]),
].map((bands) => Object.freeze(bands.map((b) => /** @type {readonly [number, string]} */ (Object.freeze(b))))));

/**
 * @param {number} x
 * @param {string} what
 * @returns {number} x clamped to [0, 1]
 */
function unit(x, what) {
  if (!Number.isFinite(x)) throw new RangeError(`${what} must be finite, got ${x}`);
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * The phrase for the frame on screen. Pass `pShown` under reduced motion (§7.5).
 * @param {import('../types.js').SceneId} scene
 * @param {number} p clamped to [0, 1]
 * @returns {{ index: number; text: string }}
 */
export function placardPhrase(scene, p) {
  sceneNumber(scene); // validates the id
  const q = unit(p, 'p');
  const bands = PHRASES[scene - 1];
  let index = 0;
  for (let i = 1; i < bands.length; i++) {
    if (q >= bands[i][0]) index = i;
    else break;
  }
  return { index, text: bands[index][1] };
}

/**
 * Placard line 1: `04 · DICHROIC · HELD AT 62%`, where the integer is Math.round(100·G).
 * @param {import('../types.js').SceneId} scene
 * @param {number} G global progress, clamped to [0, 1]
 * @returns {string}
 */
export function placardLabel(scene, G) {
  const nn = sceneNumber(scene);
  const pct = Math.round(100 * unit(G, 'G'));
  return format(COPY.placard.label, { NN: nn, SCENE: COPY.sceneNames[scene - 1].toUpperCase(), G: pct });
}

/**
 * The live-region text on admire entry (§7.7). `breathing` is false when breathing
 * is paused or reduced motion is on.
 * @param {import('../types.js').SceneId} scene
 * @param {string} phrase the placard phrase for the frame, ending in its full stop
 * @param {boolean} breathing
 * @returns {string}
 */
export function admireAnnouncement(scene, phrase, breathing) {
  const nn = sceneNumber(scene);
  const template = breathing ? COPY.status.admire : COPY.status.admireStill;
  return format(template, { NN: nn, Scene: COPY.sceneNames[scene - 1], phrase });
}
