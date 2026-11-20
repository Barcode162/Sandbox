// §4 palette tokens, transcribed exactly. FROZEN (WO-001).
export const P = {
  paper: '#F3EAD7', paperShade: '#E6D9BE', paperDeep: '#CDBB98', foldWhite: '#FBF7EE', crease: '#C9B48C',
  kraft: '#D6BF94', kraftEdge: '#A88C5E', moss: '#9DB27F', mossDeep: '#627F57', water: '#A7CBCF', waterDeep: '#6E9EA8',
  ink: '#1C1A24', inkSoft: '#4A4558', gold: '#C9962A', seed: '#6F9A4B', ok: '#3E8E6A', bad: '#C23B3B', glow: '#FFD66B',
  shadow: 'rgba(28,26,36,.22)',
  l1: '#2A2D38', l2: '#2F4FA8', l3: '#14907F', l4: '#E2A41C', l5: '#D9442F',
  streak: '#B23A8E', wax: '#5B3A73', waxGloss: '#CDB6E0', knot: '#15131B', thread: '#F3EAD7', maw: '#D9442F',
  // tower-specific colours named in §7
  koiPatch: '#E06A3B', owlKraft: '#A47A4F', galeBody: '#DCE8F0', heron: '#B9C6CF', toad: '#7A7A3E',
  glacier: '#E6F2F5', typhoonScale: '#E0B04A', eclipse: '#3A3560', owlAmber: '#E08A1E',
} as const;
export type PaletteToken = keyof typeof P;

/** Upgrade fleck colours per path (§10.4 Buy): A gold, B water-deep. */
export const PATH_FLECK = ['#C9962A', '#6E9EA8'] as const;

/** Fonts (§4 Type). */
export const FONT_DISPLAY = 'Georgia, "Iowan Old Style", serif';
export const FONT_UI = 'system-ui, "Segoe UI", sans-serif';
/** Fixed per-digit advance for counters, in em (§4, §16.1). */
export const DIGIT_ADVANCE_EM = 0.62;
/** Hard shadow offset, no blur (§4 Light). */
export const SHADOW_OFFSET = { x: 3, y: 4 } as const;
