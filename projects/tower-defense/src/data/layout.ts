// §9 HUD rects and the fixed §10 card rects. Owned by WO-004 after wave 0 (UI-internal, not a sim contract).
import type { Rect } from '../contracts/types';
const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

export const HUD = {
  seeds: r(16, 12, 132, 40), sheets: r(156, 12, 164, 40), round: r(328, 12, 152, 40),
  bossBar: r(340, 72, 400, 18), pause: r(1020, 12, 44, 40),
  sidebar: r(1080, 0, 200, 720), foldCard: r(1080, 0, 200, 600),
  autoStart: r(1096, 604, 168, 28), go: r(1096, 640, 168, 64),
  cards: [r(1092, 56, 88, 112), r(1184, 56, 88, 112), r(1092, 180, 88, 112), r(1184, 180, 88, 112)],
} as const;
export const FOLD = {
  name: { x: 1092, y: 16 }, close: r(1244, 12, 24, 24), portrait: r(1092, 44, 72, 72), stats: { x: 1172, y: 48 },
  targeting: r(1092, 128, 176, 32), colX: [1092, 1184], tierY: [168, 284, 400], tierW: 88, tierH: 108,
  sell: r(1092, 520, 176, 32), tally: { x: 1092, y: 560 },
} as const;
export const TITLE = {
  // §10.1 says 0–520 → 760; narrowed so the frame-table rows (blots visible right of the type) hold. See reports/WO-004.md.
  washTo: 330, washFade: 540, title: { x: 64, y: 250 }, subtitle: { x: 68, y: 288 },
  play: r(64, 330, 240, 56), settings: r(64, 398, 240, 44), footer: { x: 64, y: 690 },
} as const;
// settings: §10.8 says 520×420 at (380,150); with six rows at the spec 56-px pitch from y 230 that left the
// last toggle 10 px above Back (F-004), so the card grows to 490 tall (still centred on the field) for a footer band.
export const CARDS = {
  pause: r(430, 190, 420, 340), pauseButtonsY: 280, pausePitch: 56, pauseButton: { w: 280, h: 44 },
  settings: r(380, 120, 520, 490), settingsRowY: 230, settingsPitch: 56, settingsLabelX: 412, settingsControlX: [640, 860],
  // end cards: §10.9/§10.10 say 460×300 / 480×320; two stat lines then the buttons left a 60–80 px dead band
  // (F-030), so both cards close up to 280 tall (buttons 42 px under the second line).
  gameover: { w: 460, h: 280 }, victory: { w: 480, h: 280 },
} as const;
