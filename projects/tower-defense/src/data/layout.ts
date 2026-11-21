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
export const CARDS = {
  pause: r(430, 190, 420, 340), pauseButtonsY: 280, pausePitch: 56, pauseButton: { w: 280, h: 44 },
  settings: r(380, 150, 520, 420), settingsRowY: 230, settingsPitch: 56, settingsLabelX: 412, settingsControlX: [640, 860],
  gameover: { w: 460, h: 300 }, victory: { w: 480, h: 320 },
} as const;
