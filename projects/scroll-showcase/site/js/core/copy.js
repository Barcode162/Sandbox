// Every user-facing string (experience spec §12.1), verbatim, British spelling.
// Templates keep the spec's own placeholders ({NN}, {Scene}, {SCENE}, {G}, {phrase});
// fill them with `format()`, which refuses to leave one unfilled.
// Pure module: no DOM, no clock.

/**
 * @template T
 * @param {T} o
 * @returns {T}
 */
function deepFreeze(o) {
  if (o && typeof o === 'object') {
    for (const v of Object.values(o)) deepFreeze(v);
    Object.freeze(o);
  }
  return o;
}

export const COPY = deepFreeze({
  title: 'Bent Light: six refractions of one white beam',
  metaDescription:
    'A scroll piece about white light: split it, stand in its colours, bend them through glass, and put them back together.',
  h1: 'Bent Light',
  wordmark: 'Bent Light',
  subtitle: 'Six refractions of one white beam.',
  cue: 'Scroll to bend the light',
  skip: 'Skip to the colophon',
  navLabel: 'Scenes',
  sceneNames: ['Incidence', 'Field', 'Refraction', 'Dichroic', 'Agreement', 'Return'],
  captions: [
    'White light is every colour, waiting for an angle.',
    'Stand inside a colour long enough and it becomes the room.',
    'Glass slows light down, and every colour disagrees about by how much.',
    'Turn the surface, and the colour turns with it.',
    'Put every colour back together and they agree on white.',
    'Where you came in. The beam is still white.',
  ],
  artLabels: [
    'A glass prism on a white wall splits a thin beam into a fan of seven colours that widens until it fills the wall.',
    'Seven bands of colour take turns filling the screen, from vermilion to cobalt, until a grid of white dots appears.',
    'Three glass shapes, a triangle, a circle and a diamond, drift over a grid of dots and magnify it, splitting each dot into red, green and blue at their edges.',
    'The dot grid becomes a faceted crystal whose colours shift as a point of light moves across it, then settles into seven bands.',
    'Seven beams of coloured light in a dark room slide together and add up to a single white beam.',
    'The white beam widens back into the gallery wall, and the prism is drawn again where the piece began.',
  ],
  placard: {
    label: '{NN} · {SCENE} · HELD AT {G}%',
  },
  pause: {
    on: 'Pause breathing',
    paused: 'Resume breathing',
    reduced: 'Breathing is off because your device asks for reduced motion',
  },
  status: {
    breathingPaused: 'Breathing paused.',
    breathingOn: 'Breathing on.',
    admire:
      'Admire mode, {NN} {Scene}: {phrase} Controls hidden; the scene is breathing. Scroll, press a key or move the pointer to continue.',
    admireStill:
      'Admire mode, {NN} {Scene}: {phrase} Controls hidden. Scroll, press a key or move the pointer to continue.',
    rewindDone: 'Back at the first beam.',
    rewindStopped: "Rewind stopped. You're in {NN} {Scene}.",
  },
  rewind: {
    run: 'Run it backwards',
    runReduced: 'Jump to the first beam',
    jump: 'Jump to the first beam',
    running: 'Rewinding · press any key to stop',
  },
  contactSheet: ['light from the left', 'overhead', 'from the right'],
  colophon: {
    h2: 'Colophon',
    p1: 'Bent Light is a scroll piece in six scenes. Where you are on the page decides the picture: scroll back and it rewinds exactly; stop anywhere and it waits for you.',
    p2Loaded:
      'Seven colours, one beam, no images. Drawn with HTML, SVG and canvas, and set in Space Grotesk.',
    p2Otherwise:
      "Seven colours, one beam, no images. Drawn with HTML, SVG and canvas, and set in your system's own sans-serif.",
    p3: 'If you stop for a moment, the controls step aside, a label appears, and the scene breathes on top of its picture. The button in the corner stops the breathing.',
    p3Reduced:
      'If you stop for a moment, the controls step aside and a label appears. Your device asks for reduced motion, so nothing here moves on its own.',
    // Unconditional (§12.2): the font file always ships with the page, whichever face renders.
    // Wording per architecture §C7; "© 2020 The Space Grotesk Project Authors" is the
    // copyright line of the shipped OFL.txt.
    credit:
      'The Space Grotesk typeface ships with this page under the SIL Open Font License 1.1, © 2020 The Space Grotesk Project Authors.',
  },
  noscript:
    'Bent Light moves when JavaScript is on. Without it you see the first frame, which is also the last.',
  errorChip: "This scene couldn't draw on this device, so you're seeing its still.",
});

/**
 * Fill `{key}` placeholders. Throws if the template names a key not in `vars`,
 * so a raw placeholder can never reach the page.
 * @param {string} template
 * @param {Record<string, string | number>} vars
 * @returns {string}
 */
export function format(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) {
      throw new RangeError(`copy template is missing {${key}}`);
    }
    return String(vars[key]);
  });
}

/**
 * @param {number} id
 * @returns {asserts id is import('../types.js').SceneId}
 */
export function assertSceneId(id) {
  if (!Number.isInteger(id) || id < 1 || id > 6) throw new RangeError(`scene id must be 1–6, got ${id}`);
}

/**
 * Two-digit scene number: 3 → '03'.
 * @param {import('../types.js').SceneId} id
 * @returns {string}
 */
export function sceneNumber(id) {
  assertSceneId(id);
  return String(id).padStart(2, '0');
}

/**
 * The scene label: '03 · Refraction', or '03 Refraction' when short
 * (the 375/768 chrome row, the ticks and the hidden headings).
 * @param {import('../types.js').SceneId} id
 * @param {boolean} [short]
 * @returns {string}
 */
export function sceneLabel(id, short = false) {
  const nn = sceneNumber(id);
  const name = COPY.sceneNames[id - 1];
  return short ? `${nn} ${name}` : `${nn} · ${name}`;
}

/**
 * Live-region text when a rewind is cancelled (§8.1): "Rewind stopped. You're in 03 Refraction."
 * @param {import('../types.js').SceneId} id
 * @returns {string}
 */
export function rewindStoppedStatus(id) {
  return format(COPY.status.rewindStopped, { NN: sceneNumber(id), Scene: COPY.sceneNames[id - 1] });
}
