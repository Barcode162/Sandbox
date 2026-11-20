// WO-003 dev tests: tokens.css ⇄ tokens.js, §13.1 luminance, §10.3 / #23 contrast.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  TOKENS, TOKENS_DARK, TRANSLUCENT, BANDS, hexToRgb, luminance, contrast, composite,
} from '../../../../site/js/core/tokens.js';

const CSS = readFileSync(fileURLToPath(new URL('../../../../site/css/tokens.css', import.meta.url)), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Top-level blocks of tokens.css: [{ prelude, decls: Map<name, value> }].
 * Only one level of nesting (`@media … { :root { … } }`) is used in the file.
 */
function blocks(css) {
  const out = [];
  const re = /(@media[^{]+)?\{?\s*:root\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const decls = new Map();
    for (const d of m[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) decls.set(d[1], d[2].trim().replace(/\s+/g, ' '));
    out.push({ prelude: (m[1] || ':root').trim(), decls });
  }
  return out;
}
const BLOCKS = blocks(CSS);
const ROOT = BLOCKS.find((b) => b.prelude === ':root').decls;
const DARK = BLOCKS.find((b) => /prefers-color-scheme:\s*dark/.test(b.prelude)).decls;

// §13.1, transcribed: CSS name → [hex, Y] (Y as printed in the spec, 2–3 decimals).
/** @type {Record<string, [string, number]>} */
const SPEC_131 = {
  'wall': ['#F6F3ED', 0.90], 'wall-deep': ['#E2DDD5', 0.73], 'ink': ['#0C0F1A', 0.005], 'beam': ['#FFFFFF', 1.0],
  'band-1': ['#F54123', 0.23], 'band-2': ['#F68704', 0.37], 'band-3': ['#F2C50E', 0.59], 'band-4': ['#0BCA86', 0.44],
  'band-5': ['#04A7D8', 0.33], 'band-6': ['#2154D8', 0.12], 'band-7': ['#8843DB', 0.14],
};
/** @type {Record<'wall' | 'wall-deep', [string, number]>} */
const SPEC_131_DARK = { 'wall': ['#F0EDE7', 0.85], 'wall-deep': ['#DDD8D0', 0.69] };
const SPEC_131_NO_Y = {
  'ch-r': '#FF3B3B', 'ch-g': '#3BFF7A', 'ch-b': '#3B6BFF', 'plate-c': '#00B8F0', 'plate-m': '#E6007E',
  'plate-y': '#FFE600', 'fringe-c': '#38D6FF', 'fringe-m': '#FF4FB3',
};

test('[WO-003] every §13.1 colour token is in tokens.css with the exact spec hex', () => {
  for (const [name, [hex]] of Object.entries(SPEC_131)) assert.equal(ROOT.get(name)?.toUpperCase(), hex, name);
  for (const [name, hex] of Object.entries(SPEC_131_NO_Y)) assert.equal(ROOT.get(name)?.toUpperCase(), hex, name);
  assert.equal(ROOT.get('glass-hi'), 'rgba(255, 255, 255, 0.22)');
  assert.equal(ROOT.get('glass-lo'), 'rgba(255, 255, 255, 0.05)');
  assert.equal(ROOT.get('glass-edge'), 'rgba(255, 255, 255, 0.85)');
  assert.equal(ROOT.get('chip-dark'), 'rgba(12, 15, 26, 0.78)');
  assert.equal(ROOT.get('chip-light'), 'color-mix(in srgb, var(--wall) 92%, transparent)');
  assert.equal(ROOT.get('focus-inner'), '#FFFFFF');
  assert.equal(ROOT.get('focus-outer'), 'var(--ink)');
  assert.equal(ROOT.get('focus-width'), '2px');
  assert.equal(ROOT.get('focus-offset'), '2px');
  assert.ok(ROOT.has('focus'));
});

test('[WO-003] D9: only --wall and --wall-deep switch under prefers-color-scheme: dark', () => {
  assert.deepEqual([...DARK.keys()].sort(), ['wall', 'wall-deep']);
  for (const [name, [hex]] of Object.entries(SPEC_131_DARK)) assert.equal(DARK.get(name).toUpperCase(), hex, name);
  assert.equal(BLOCKS.filter((b) => /prefers-color-scheme/.test(b.prelude)).length, 1);
});

test('[WO-003] tokens.js hexes equal tokens.css hexes, both schemes', () => {
  for (const [name, t] of Object.entries(TOKENS)) {
    assert.equal(ROOT.get(name)?.toUpperCase(), t.hex, `--${name}`);
    assert.deepEqual(t.rgb, hexToRgb(t.hex));
  }
  for (const [name, t] of Object.entries(TOKENS_DARK)) assert.equal(DARK.get(name).toUpperCase(), t.hex, `dark --${name}`);
  // Every opaque hex declared in the CSS root is mirrored in JS.
  for (const [name, value] of ROOT) if (/^#[0-9a-f]{6}$/i.test(value)) assert.ok(TOKENS[name], `--${name} missing from tokens.js`);
  // Translucent tokens mirror the rgba() / color-mix() declarations.
  for (const [name, t] of Object.entries(TRANSLUCENT)) {
    const v = ROOT.get(name);
    if (t.ref) assert.equal(v, `color-mix(in srgb, var(--${t.ref}) ${Math.round(t.alpha * 100)}%, transparent)`, name);
    else assert.equal(v, `rgba(${t.rgb.join(', ')}, ${t.alpha})`, name);
  }
  assert.deepEqual(BANDS, ['#F54123', '#F68704', '#F2C50E', '#0BCA86', '#04A7D8', '#2154D8', '#8843DB']);
});

test('[WO-003] computed Y matches §13.1 within 0.01', () => {
  for (const [name, [, y]] of Object.entries(SPEC_131)) {
    assert.ok(Math.abs(TOKENS[name].Y - y) <= 0.01, `${name}: Y ${TOKENS[name].Y.toFixed(4)} vs spec ${y}`);
  }
  for (const [name, [, y]] of Object.entries(SPEC_131_DARK)) {
    assert.ok(Math.abs(TOKENS_DARK[name].Y - y) <= 0.01, `dark ${name}: Y ${TOKENS_DARK[name].Y.toFixed(4)} vs spec ${y}`);
  }
  assert.equal(luminance([255, 255, 255]), 1);
  assert.equal(luminance([0, 0, 0]), 0);
});

test('[WO-003] plates multiply to exact black in register (each has a zero channel)', () => {
  const [c, m, y] = ['plate-c', 'plate-m', 'plate-y'].map((k) => TOKENS[k].rgb);
  assert.deepEqual([0, 1, 2].map((i) => (c[i] * m[i] * y[i]) / 255 / 255), [0, 0, 0]);
});

// #23 at token level: chip text ≥ 7:1 over the darkest and brightest band and wall tokens
// (we check every opaque token, which includes both extremes, in both schemes).
/** @typedef {import('../../../../site/js/core/tokens.js').RGB} RGB */
/** @type {Array<[string, RGB]>} */
const BACKDROPS = [
  ...Object.entries(TOKENS).map(([k, t]) => /** @type {[string, RGB]} */ ([k, t.rgb])),
  ...Object.entries(TOKENS_DARK).map(([k, t]) => /** @type {[string, RGB]} */ ([`dark ${k}`, t.rgb])),
];

test('[WO-003] white text on --chip-dark is ≥ 7:1 over every colour token (#23)', () => {
  const chip = TRANSLUCENT['chip-dark'];
  const ratios = BACKDROPS.map(([name, bg]) => /** @type {[string, number]} */ (
    [name, contrast(luminance([255, 255, 255]), luminance(composite(chip.rgb, chip.alpha, bg)))]));
  for (const [name, ratio] of ratios) assert.ok(ratio >= 7, `chip-dark over ${name}: ${ratio.toFixed(2)}:1`);
  // Sanity on the compositing direction: the brightest backdrop (white beam) is the worst case.
  const worst = Math.min(...ratios.map(([, r]) => r));
  assert.equal(ratios.find(([n]) => n === 'beam')[1], worst);
  assert.ok(worst > 9.7 && worst < 9.8, `worst dark-chip ratio ${worst.toFixed(2)}:1 (white beam)`);
});

test('[WO-003] ink text on --chip-light is ≥ 7:1 over every colour token, both schemes (#23)', () => {
  const chip = TRANSLUCENT['chip-light'];
  /** @type {Array<[string, RGB]>} */
  const walls = [['light', TOKENS.wall.rgb], ['dark', TOKENS_DARK.wall.rgb]];
  for (const [scheme, wall] of walls) {
    for (const [name, bg] of BACKDROPS) {
      const ratio = contrast(TOKENS.ink.Y, luminance(composite(wall, chip.alpha, bg)));
      assert.ok(ratio >= 7, `chip-light (${scheme}) over ${name}: ${ratio.toFixed(2)}:1`);
    }
  }
});

test('[WO-003] §10.3: ink on --wall ≈ 17.3:1, and 16.4:1 on the dark-scheme wall', () => {
  assert.equal(contrast(TOKENS.ink.Y, TOKENS.wall.Y).toFixed(1), '17.3');
  assert.equal(contrast(TOKENS.ink.Y, TOKENS_DARK.wall.Y).toFixed(1), '16.4');
  assert.equal(contrast(1, 0), 21);
});

test('[WO-003] §13.2 type, §13.3 spacing and §13.5 motion tokens are declared', () => {
  const expectRoot = {
    'type-display-size': 'clamp(64px, 12.5vw, 200px)', 'type-display-leading': '0.88', 'type-display-weight': '700',
    'type-display-tracking': '-0.035em', 'type-display-tracking-mode-s': '-0.04em',
    'type-subtitle-size': 'clamp(16px, 1.5vw, 22px)', 'type-subtitle-leading': '1.3', 'type-subtitle-weight': '500',
    'type-caption-size': '15px', 'type-caption-leading': '1.45', 'type-caption-weight': '450', 'type-caption-weight-mode-s': '400',
    'type-label-size': '12px', 'type-label-leading': '1', 'type-label-weight': '600',
    'type-label-tracking': '0.12em', 'type-label-tracking-mode-s': '0.14em',
    'type-colophon-size': '18px', 'type-colophon-leading': '1.55', 'type-colophon-weight': '400',
    'type-colophon-measure': '52ch', 'type-colophon-h2': '600 32px / 1.1 var(--font)',
    'space-4': '4px', 'space-8': '8px', 'space-12': '12px', 'space-16': '16px', 'space-24': '24px',
    'space-32': '32px', 'space-48': '48px', 'space-64': '64px', 'space-96': '96px',
    'gutter': '16px', 'chip-pad-y': '6px', 'chip-pad-x': '10px', 'chip-radius': '2px', 'hairline': '1px', 'rail-width': '2px',
    'idle-ms': '1200', 'placard-ms': '3000',
    'dur-chrome-out': '600ms', 'dur-chrome-in': '160ms', 'dur-placard-in': '900ms', 'dur-placard-delay': '200ms',
    'dur-placard-out': '120ms', 'dur-caption-handoff': '360ms', 'dur-hover': '120ms', 'dur-press': '90ms',
    'dur-label': '200ms', 'dur-chip-theme': '240ms', 'dur-ambient-ramp': '1600ms', 'dur-ambient-decay': '240ms',
    'dur-rewind': '8000ms',
    'ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)', 'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
    'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)', 'ease-in': 'ease-in',
  };
  for (const [name, value] of Object.entries(expectRoot)) assert.equal(ROOT.get(name), value, `--${name}`);
  for (const t of ['display', 'subtitle', 'caption', 'label', 'colophon']) {
    assert.equal(ROOT.get(`type-${t}`),
      `var(--type-${t}-weight) var(--type-${t}-size) / var(--type-${t}-leading) var(--font)`, `--type-${t}`);
  }
  // The idle token appears exactly once as a literal (verify:mutants patches it, K20).
  assert.equal(CSS.match(/--idle-ms:\s*1200;/g).length, 1);
});

test('[WO-003] responsive and reduced-motion overrides: gutters by bp, caption at ≥ 1024, chrome-out 200 ms', () => {
  const at = (q) => BLOCKS.find((b) => b.prelude.replace(/\s+/g, ' ') === `@media ${q}`).decls;
  assert.equal(at('(min-width: 768px)').get('gutter'), '24px');
  assert.deepEqual(Object.fromEntries(at('(min-width: 1024px)')),
    { 'gutter': '32px', 'type-caption-size': '16px', 'type-caption-leading': '1.5' });
  assert.equal(at('(min-width: 1440px)').get('gutter'), '40px');
  assert.equal(at('(min-width: 1920px)').get('gutter'), '48px');
  assert.deepEqual(Object.fromEntries(at('(prefers-reduced-motion: reduce)')), { 'dur-chrome-out': '200ms' });
});

test('[WO-003] hexToRgb rejects malformed input; composite is source-over', () => {
  assert.throws(() => hexToRgb('#FFF'), TypeError);
  assert.throws(() => hexToRgb('red'), TypeError);
  assert.deepEqual(composite([0, 0, 0], 0.5, [255, 255, 255]), [128, 128, 128]);
  assert.deepEqual(composite([12, 15, 26], 1, [255, 0, 0]), [12, 15, 26]);
  assert.ok(Object.isFrozen(TOKENS) && Object.isFrozen(TOKENS.wall) && Object.isFrozen(TOKENS.wall.rgb));
});
