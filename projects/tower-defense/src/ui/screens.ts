// §10.1 title (wash, folding letters, buttons), §10.7 pause card, §10.8 settings card with the live
// colourblind preview, §10.9 game-over flood + card, §10.10 victory cranes + card.
import type { BlotKind, Rect, Settings } from '../contracts/types';
import { CARDS, TITLE } from '../data/layout';
import { P, SHADOW_OFFSET } from '../data/palette';
import { MOTION } from '../data/feel';
import { DECOR, FIELD, LOGICAL_H, LOGICAL_W } from '../data/map';
import { drawBlotShape } from '../render/blots';
import { backOut, badge, badgeWidth, clamp01, type Ctx, displayFont, fmt, inQuad, inRect, outCubic, plate, plateShift, renderRng, roundRectPath, tornCard, uiFont } from './draw';

/** A held button (§11 press, F-026): which one and its press depth 0..1. */
export interface Press { id: string; k: number }
const depth = (p: Press | null | undefined, id: string): number => (p && p.id === id ? p.k : 0);

// ───────────────────────────── title ─────────────────────────────
export type TitleHit = 'play' | 'settings';
export function titleHit(x: number, y: number): TitleHit | null {
  if (inRect(TITLE.play, x, y)) return 'play';
  if (inRect(TITLE.settings, x, y)) return 'settings';
  return null;
}

export interface TitleView {
  /** ms since the title scene began. */
  t: number;
  /** 0..1 progress of the Play transition (0 = not started). */
  leave: number;
  hover: TitleHit | null;
  press: Press | null;
  settings: Readonly<Settings>;
}

const TITLE_TEXT = 'Inkfold';

export function drawTitle(c: Ctx, v: TitleView): void {
  const slide = -inQuad(v.leave) * 780;
  c.save();
  c.translate(slide, 0);
  // left wash: --paper 92 % for x 0–520 → 0 % at 760
  const g = c.createLinearGradient(0, 0, TITLE.washFade, 0);
  g.addColorStop(0, 'rgba(243,234,215,.92)');
  g.addColorStop(TITLE.washTo / TITLE.washFade, 'rgba(243,234,215,.92)');
  g.addColorStop(1, 'rgba(243,234,215,0)');
  c.fillStyle = g;
  c.fillRect(-10, 0, TITLE.washFade + 10, LOGICAL_H);
  // letters fold in: i at 200 + 40i ms over 320 ms (scaleY 0→1, backOut); reduce motion → 200-ms fade
  c.font = displayFont(88);
  c.fillStyle = P.ink;
  let x = TITLE.title.x;
  for (let i = 0; i < TITLE_TEXT.length; i++) {
    const ch = TITLE_TEXT[i];
    const w = c.measureText(ch).width;
    const t0 = 200 + 40 * i;
    const k = (v.t - t0) / (v.settings.reduceMotion ? 200 : 320);
    if (k > 0) {
      c.save();
      if (v.settings.reduceMotion) c.globalAlpha = clamp01(k);
      c.translate(x, TITLE.title.y);
      c.scale(1, v.settings.reduceMotion ? 1 : Math.max(0.001, backOut(clamp01(k))));
      c.fillStyle = P.shadow;
      c.fillText(ch, 3, 4);
      c.fillStyle = P.ink;
      c.fillText(ch, 0, 0);
      c.restore();
    }
    x += w;
  }
  const sub = clamp01((v.t - 480) / 320);
  c.globalAlpha = sub;
  c.font = uiFont(20, 400);
  c.fillStyle = P.inkSoft;
  c.fillText('a paper garden · a spill of ink', TITLE.subtitle.x, TITLE.subtitle.y);
  // buttons
  const ba = clamp01((v.t - 520) / 280);
  c.globalAlpha = ba;
  const pr = TITLE.play;
  const hp = v.hover === 'play';
  const kp = depth(v.press, 'play');
  const op = plateShift(hp, kp);
  plate(c, pr, 8, P.ink, { lift: hp ? 1 : 0, press: kp, stroke: null });
  c.fillStyle = P.foldWhite;
  c.font = uiFont(20);
  c.textAlign = 'center';
  c.fillText('Play', pr.x + pr.w / 2 + op.x, pr.y + 35 + op.y);
  const sr = TITLE.settings;
  const hs = v.hover === 'settings';
  const ks = depth(v.press, 'settings');
  const os = plateShift(hs, ks);
  plate(c, sr, 8, hs ? P.foldWhite : 'rgba(243,234,215,.9)', { lift: hs ? 1 : 0, press: ks, stroke: P.ink });
  c.fillStyle = P.ink;
  c.font = uiFont(16);
  c.fillText('Settings', sr.x + sr.w / 2 + os.x, sr.y + 28 + os.y);
  c.textAlign = 'left';
  // badges sit inside the plates' right ends (F-016), riding the press/lift with the label
  badge(c, pr.x + pr.w - 8 - badgeWidth('Enter') + op.x, pr.y + (pr.h - 20) / 2 + op.y, 'Enter', ba, 'rgba(251,247,238,.6)');
  badge(c, sr.x + sr.w - 8 - 20 + os.x, sr.y + (sr.h - 20) / 2 + os.y, 'S', ba);
  c.globalAlpha = ba;
  c.font = uiFont(12);
  c.fillStyle = P.inkSoft;
  c.fillText('Enter play · S settings · M mute', TITLE.footer.x, TITLE.footer.y);
  c.restore();
}

// ───────────────────────────── pause ─────────────────────────────
export type PauseHit = 'resume' | 'restart' | 'settings' | 'quit';
const PAUSE_ITEMS: readonly PauseHit[] = ['resume', 'restart', 'settings', 'quit'];
export function pauseButton(i: number): Rect {
  const r = CARDS.pause;
  return { x: r.x + (r.w - CARDS.pauseButton.w) / 2, y: CARDS.pauseButtonsY + i * CARDS.pausePitch, w: CARDS.pauseButton.w, h: CARDS.pauseButton.h };
}
export function pauseHit(x: number, y: number): PauseHit | null {
  for (let i = 0; i < 4; i++) if (inRect(pauseButton(i), x, y)) return PAUSE_ITEMS[i];
  return null;
}

export function drawDim(c: Ctx, alpha: number): void {
  c.fillStyle = `rgba(28,26,36,${0.45 * alpha})`;
  c.fillRect(0, 0, FIELD.w, LOGICAL_H);
}

/** Card fold-down from its top edge (220 ms outCubic); reduce motion → 160-ms fade. */
function foldIn(c: Ctx, r: Rect, t: number, s: Readonly<Settings>): boolean {
  if (s.reduceMotion) { c.globalAlpha *= clamp01(t / MOTION.uiMs); return t > 0; }
  const k = outCubic(t / MOTION.foldMs);
  if (k <= 0) return false;
  c.translate(0, r.y);
  c.scale(1, k);
  c.translate(0, -r.y);
  return true;
}

export interface PauseView { t: number; hover: PauseHit | null; press: Press | null; restartArmed: boolean; settings: Readonly<Settings> }
export function drawPause(c: Ctx, v: PauseView): void {
  const r = CARDS.pause;
  c.save();
  if (!foldIn(c, r, v.t, v.settings)) { c.restore(); return; }
  tornCard(c, r, 430);
  c.font = displayFont(44);
  c.fillStyle = P.ink;
  c.textAlign = 'center';
  c.fillText('Paused', r.x + r.w / 2, r.y + 64);
  const labels: Record<PauseHit, [string, string]> = {
    resume: ['Resume', 'Esc'], restart: [v.restartArmed ? 'Press again to restart' : 'Restart', 'R'], settings: ['Settings', ''], quit: ['Quit to title', ''],
  };
  PAUSE_ITEMS.forEach((id, i) => {
    const b = pauseButton(i);
    const h = v.hover === id;
    const k = depth(v.press, id);
    const o = plateShift(h, k);
    const primary = id === 'resume';
    plate(c, b, 8, primary ? P.ink : h ? P.foldWhite : P.paper, { lift: h ? 1 : 0, press: k, stroke: primary ? null : P.ink });
    c.font = uiFont(16);
    c.fillStyle = primary ? P.foldWhite : id === 'restart' && v.restartArmed ? P.bad : P.ink;
    c.textAlign = 'center';
    c.fillText(labels[id][0], b.x + b.w / 2 + o.x, b.y + 28 + o.y);
    if (labels[id][1]) {
      c.textAlign = 'left';
      badge(c, b.x + b.w - 10 - badgeWidth(labels[id][1]) + o.x, b.y + 12 + o.y, labels[id][1], 1, primary ? 'rgba(251,247,238,.6)' : undefined);
    }
  });
  c.textAlign = 'left';
  c.restore();
}

// ───────────────────────────── settings ─────────────────────────────
export type SettingKey = 'music' | 'sfx' | 'shake' | 'reduceMotion' | 'colourblind' | 'autoStart';
const ROWS: readonly { key: SettingKey; label: string; slider: boolean }[] = [
  { key: 'music', label: 'Music', slider: true },
  { key: 'sfx', label: 'Effects', slider: true },
  { key: 'shake', label: 'Screen shake', slider: true },
  { key: 'reduceMotion', label: 'Reduce motion', slider: false },
  { key: 'colourblind', label: 'Colourblind signals', slider: false },
  { key: 'autoStart', label: 'Auto-start rounds', slider: false },
];
const rowY = (i: number): number => CARDS.settingsRowY + i * CARDS.settingsPitch;
const [CX0, CX1] = CARDS.settingsControlX;
/** F-004: Back and the preview strip share a footer band below a crease, 24 px above the card's bottom edge. */
export const SETTINGS_BACK: Rect = { x: CARDS.settingsLabelX, y: CARDS.settings.y + CARDS.settings.h - 24 - 32, w: 120, h: 32 };
const SETTINGS_RULE_Y = SETTINGS_BACK.y - 16;

export type SettingsHit = { k: 'slider'; key: SettingKey; value: number } | { k: 'toggle'; key: SettingKey } | { k: 'back' };
export function settingsHit(x: number, y: number): SettingsHit | null {
  if (inRect(SETTINGS_BACK, x, y)) return { k: 'back' };
  for (let i = 0; i < ROWS.length; i++) {
    const cy = rowY(i);
    if (Math.abs(y - cy) > 20) continue;
    const row = ROWS[i];
    if (row.slider && x >= CX0 - 10 && x <= CX1 + 10) return { k: 'slider', key: row.key, value: Math.round(clamp01((x - CX0) / (CX1 - CX0)) * 100) };
    if (!row.slider && x >= CARDS.settingsLabelX && x <= CX0 + 100) return { k: 'toggle', key: row.key };
  }
  return null;
}
/** Slider value for a drag that started on `key` (x only). */
export function sliderValue(x: number): number {
  return Math.round(clamp01((x - CX0) / (CX1 - CX0)) * 100);
}

const PREVIEW: readonly { kind: BlotKind; pale: boolean }[] = [
  { kind: 'dot', pale: false }, { kind: 'drop', pale: false }, { kind: 'splat', pale: false }, { kind: 'splash', pale: false },
  { kind: 'blotch', pale: false }, { kind: 'wax', pale: false }, { kind: 'splat', pale: true },
];

export interface SettingsView { t: number; s: Readonly<Settings>; hover: SettingsHit | null; press: number; nowMs: number }
export function drawSettings(c: Ctx, v: SettingsView): void {
  const r = CARDS.settings;
  c.save();
  if (!foldIn(c, r, v.t, v.s)) { c.restore(); return; }
  tornCard(c, r, 380);
  c.font = displayFont(44);
  c.fillStyle = P.ink;
  c.fillText('Settings', CARDS.settingsLabelX, r.y + 50);
  ROWS.forEach((row, i) => {
    const y = rowY(i);
    const hov = v.hover && v.hover.k !== 'back' && v.hover.key === row.key;
    c.font = uiFont(16);
    c.fillStyle = P.ink;
    c.fillText(row.label, CARDS.settingsLabelX, y + 6);
    if (row.slider) {
      const val = v.s[row.key] as number;
      c.font = uiFont(12);
      c.fillStyle = P.inkSoft;
      c.textAlign = 'right';
      c.fillText(row.key === 'shake' ? `${val} %` : `${val}`, CX0 - 16, y + 5);
      c.textAlign = 'left';
      roundRectPath(c, CX0, y - 3, CX1 - CX0, 6, 3);
      c.fillStyle = P.paperDeep; c.fill();
      roundRectPath(c, CX0, y - 3, (CX1 - CX0) * (val / 100), 6, 3);
      c.fillStyle = P.ink; c.fill();
      const kx = CX0 + (CX1 - CX0) * (val / 100);
      c.fillStyle = P.shadow; c.beginPath(); c.arc(kx + 2, y + 3, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = hov ? P.foldWhite : P.paper; c.beginPath(); c.arc(kx, y, 8, 0, Math.PI * 2); c.fill();
      c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke();
    } else {
      const on = v.s[row.key] as boolean;
      roundRectPath(c, CX0, y - 12, 44, 24, 12);
      c.fillStyle = on ? P.ink : P.paperDeep; c.fill();
      if (hov) { c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke(); }
      const kx = on ? CX0 + 32 : CX0 + 12;
      c.fillStyle = P.foldWhite; c.beginPath(); c.arc(kx, y, 9, 0, Math.PI * 2); c.fill();
      c.font = uiFont(12);
      c.fillStyle = on ? P.ink : P.inkSoft;
      c.fillText(on ? 'On' : 'Off', CX0 + 54, y + 5);
    }
  });
  // footer crease
  c.strokeStyle = P.crease; c.lineWidth = 1;
  c.beginPath(); c.moveTo(CARDS.settingsLabelX, SETTINGS_RULE_Y + 0.5); c.lineTo(r.x + r.w - 32, SETTINGS_RULE_Y + 0.5); c.stroke();
  const b = SETTINGS_BACK;
  const hb = v.hover?.k === 'back';
  const ob = plateShift(hb, v.press);
  plate(c, b, 8, P.ink, { lift: hb ? 1 : 0, press: v.press, stroke: null });
  c.font = uiFont(16);
  c.fillStyle = P.foldWhite;
  c.textAlign = 'center';
  c.fillText('Back', b.x + b.w / 2 - 14 + ob.x, b.y + 22 + ob.y);
  c.textAlign = 'left';
  badge(c, b.x + b.w - 8 - badgeWidth('Esc') + ob.x, b.y + 6 + ob.y, 'Esc', 1, 'rgba(251,247,238,.6)');
  // live colourblind preview strip: 5 chain blots + Wax + Pale Splat (§10.8)
  const px0 = 572, py = b.y + b.h / 2;
  PREVIEW.forEach((p, i) => drawBlotShape(c, p.kind, px0 + i * 44, py, { pale: p.pale, colourblind: v.s.colourblind, scale: 1, phase: v.nowMs / 1000, alpha: 1 }));
  c.restore();
}

// ───────────────────────────── game over ─────────────────────────────
export type EndHit = 'retry' | 'title';
const GO_CARD: Rect = { x: (LOGICAL_W - CARDS.gameover.w) / 2, y: (LOGICAL_H - CARDS.gameover.h) / 2, w: CARDS.gameover.w, h: CARDS.gameover.h };
const VI_CARD: Rect = { x: (LOGICAL_W - CARDS.victory.w) / 2, y: (LOGICAL_H - CARDS.victory.h) / 2, w: CARDS.victory.w, h: CARDS.victory.h };
const endButtons = (card: Rect): [Rect, Rect] => [
  { x: card.x + 40, y: card.y + card.h - 80, w: 200, h: 48 },
  { x: card.x + card.w - 40 - 150, y: card.y + card.h - 80, w: 150, h: 48 },
];
export function endHit(x: number, y: number, victory: boolean): EndHit | null {
  const [a, b] = endButtons(victory ? VI_CARD : GO_CARD);
  if (inRect(a, x, y)) return 'retry';
  if (inRect(b, x, y)) return 'title';
  return null;
}

/** Ink flood from the jar: lobed blob r 0→1400 over 1.2 s inQuad at 70 % --knot; or draining back (k 1→0). */
export function drawFlood(c: Ctx, k: number, nowMs: number): void {
  if (k <= 0) return;
  const r = 1400 * k;
  const { x, y } = DECOR.seedJar;
  c.save();
  c.globalAlpha = 0.7;
  c.fillStyle = P.knot;
  c.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rr = r * (1 + 0.12 * Math.sin(8 * a + nowMs / 500) + 0.05 * Math.sin(3 * a));
    i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  c.restore();
}

export interface EndView { t: number; hover: EndHit | null; press: Press | null; settings: Readonly<Settings>; line1: string; line2?: string }

function endCard(c: Ctx, card: Rect, v: EndView, title: string, ink: boolean, retry: string): void {
  c.save();
  if (!foldIn(c, card, v.t, v.settings)) { c.restore(); return; }
  if (ink) plate(c, card, 6, P.ink, { stroke: null });
  else tornCard(c, card, 480);
  const fg = ink ? P.foldWhite : P.ink;
  c.textAlign = 'center';
  c.font = displayFont(44);
  c.fillStyle = fg;
  c.fillText(title, card.x + card.w / 2, card.y + 84);
  c.font = uiFont(16, 400);
  c.fillStyle = ink ? 'rgba(251,247,238,.85)' : P.inkSoft;
  c.fillText(v.line1, card.x + card.w / 2, card.y + 132);
  if (v.line2) c.fillText(v.line2, card.x + card.w / 2, card.y + 158);
  const [a, b] = endButtons(card);
  const ha = v.hover === 'retry', hb = v.hover === 'title';
  const ka = depth(v.press, 'retry'), kb = depth(v.press, 'title');
  const oa = plateShift(ha, ka), ob = plateShift(hb, kb);
  const ex = a.x + a.w - 10 - badgeWidth('Enter');
  plate(c, a, 8, P.ok, { lift: ha ? 1 : 0, press: ka, stroke: null });
  c.font = uiFont(18);
  c.fillStyle = P.foldWhite;
  c.fillText(retry, (a.x + ex) / 2 + oa.x, a.y + 30 + oa.y);
  plate(c, b, 8, ink ? (hb ? '#2E2B3A' : P.ink) : hb ? P.foldWhite : P.paper, { lift: hb ? 1 : 0, press: kb, stroke: ink ? 'rgba(251,247,238,.6)' : P.ink });
  c.fillStyle = fg;
  c.font = uiFont(16);
  c.fillText('Title', b.x + b.w / 2 + ob.x, b.y + 29 + ob.y);
  c.textAlign = 'left';
  badge(c, ex + oa.x, a.y + 14 + oa.y, 'Enter');
  c.restore();
}

export function drawGameOverCard(c: Ctx, v: EndView): void { endCard(c, GO_CARD, v, 'The garden is inked.', true, 'Try again'); }
export function drawVictoryCard(c: Ctx, v: EndView): void { endCard(c, VI_CARD, v, 'The garden holds.', false, 'Play again'); }

// ───────────────────────────── victory cranes ─────────────────────────────
export interface Crane { x0: number; y0: number; x1: number; y1: number; bend: number; delay: number; flap: number; size: number }
export function makeCranes(origins: readonly { x: number; y: number }[], seed = 24): Crane[] {
  const rnd = renderRng(seed);
  const src = origins.length ? origins : [{ x: DECOR.seedJar.x, y: DECOR.seedJar.y }];
  return Array.from({ length: 24 }, (_, i) => {
    const o = src[i % src.length];
    return {
      x0: o.x, y0: o.y,
      x1: o.x + (rnd() - 0.5) * 520, y1: -60 - rnd() * 140,
      bend: (rnd() - 0.5) * 360, delay: rnd() * 900, flap: rnd() * Math.PI * 2, size: 1.3 + rnd() * 0.6,
    };
  });
}

/** t = ms since the celebration began; 24 cranes rise in arcs over 3 s, wings flap at 3 Hz. */
export function drawCranes(c: Ctx, cranes: readonly Crane[], t: number, reduceMotion: boolean): void {
  for (const k of cranes) {
    const u = clamp01((t - k.delay) / 3000);
    if (u <= 0 || u >= 1) continue;
    const e = outCubic(u);
    const x = k.x0 + (k.x1 - k.x0) * e + Math.sin(e * Math.PI) * k.bend;
    const y = k.y0 + (k.y1 - k.y0) * e;
    const dx = (k.x1 - k.x0) + Math.cos(e * Math.PI) * Math.PI * k.bend;
    const dir = Math.atan2(k.y1 - k.y0, dx);
    const flap = reduceMotion ? 0.6 : Math.sin(((t - k.delay) / 1000) * 3 * Math.PI * 2 + k.flap);
    drawCrane(c, x, y, k.size * (0.6 + 0.4 * Math.min(1, u * 4)), dir, flap, Math.min(1, (1 - u) * 6));
  }
}

/**
 * One paper crane. F-029: --fold-white on paper vanished, so every crane now has the screen-space (+3,+4)
 * hard shadow (body, wing, neck and tail) and a 1-px --crease edge (constant on screen at any size).
 */
function drawCrane(c: Ctx, x: number, y: number, s: number, dir: number, flap: number, alpha: number): void {
  const facing = Math.cos(dir) >= 0 ? 1 : -1;
  const wh = 16 * flap;
  const body = (): void => {
    c.beginPath();
    c.moveTo(-14, 2); c.lineTo(0, -3); c.lineTo(16, 1); c.lineTo(0, 5); c.closePath();
  };
  const wing = (): void => {
    c.beginPath(); c.moveTo(-4, -1); c.lineTo(6, -1); c.lineTo(-2, -1 - wh); c.closePath();
  };
  const neck = (): void => {
    c.beginPath(); c.moveTo(14, 1); c.lineTo(20, -8); c.lineTo(23, -7); c.moveTo(-12, 2); c.lineTo(-19, -6);
  };
  c.save();
  c.globalAlpha = alpha;
  c.lineJoin = 'round'; c.lineCap = 'round';
  for (const pass of [0, 1]) {
    c.save();
    c.translate(x + (pass ? 0 : SHADOW_OFFSET.x), y + (pass ? 0 : SHADOW_OFFSET.y));
    c.scale(s * facing, s);
    const edge = 1 / s;
    if (!pass) {
      c.fillStyle = P.shadow; c.strokeStyle = P.shadow;
      body(); c.fill(); wing(); c.fill();
      c.lineWidth = 2; neck(); c.stroke();
    } else {
      // neck and tail: a crease line under a fold-white stroke reads as an edged paper strip
      c.strokeStyle = P.crease; c.lineWidth = 2 + 2 * edge; neck(); c.stroke();
      c.strokeStyle = P.foldWhite; c.lineWidth = 2; neck(); c.stroke();
      c.fillStyle = P.foldWhite; body(); c.fill();
      c.strokeStyle = P.crease; c.lineWidth = edge; c.stroke();
      c.fillStyle = '#EFE6D3'; wing(); c.fill();
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}

export function bestDefenderLine(name: string, pops: number): string {
  return `Best defender: ${name} (${fmt(pops)})`;
}
