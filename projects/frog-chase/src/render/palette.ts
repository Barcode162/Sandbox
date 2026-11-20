/** §5.1 palette tokens. Frozen (WO-001); owner WO-003. Audio/UI import these too. */
export const PALETTE = {
  paper: '#F3EBD8',
  ink: '#1D2B3A',
  waterA: '#2F8F9D',
  waterB: '#2A7A88',
  waterDeep: '#1F5F6E',
  pad: '#8CC152',
  padVein: '#5E9A36',
  padLow: '#7DAE49',
  padUnder: '#D8E8A8',
  frog: '#F0B23E',
  frogDark: '#B97E1F',
  bloom: '#F27BA8',
  gator: '#3D5A3A',
  gatorRidge: '#2A4029',
  gatorEye: '#F4E04D',
  jaw: '#C8324B',
  bank: '#C9A46A',
  reed: '#6B8F3E',
} as const;

export type PaletteToken = keyof typeof PALETTE;
