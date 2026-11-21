// §9 sidebar: Satchel cards, the Fold card (§10.4: portrait, stats, targeting, tier boxes with
// owned/next/unaffordable/sealed states, sell/refund, tally), Auto-start toggle and the Go button.
import type { Rect, Settings, SimState, Tower, TowerKind, UpgradePath } from '../contracts/types';
import { FOLD, HUD } from '../data/layout';
import { LOGICAL_H, LOGICAL_W } from '../data/map';
import { P, PATH_FLECK } from '../data/palette';
import { MOTION } from '../data/feel';
import { TOWERS, TOWER_ORDER } from '../data/towers';
import { drawTowerSprite } from '../render/towers';
import { sellValue } from '../sim/economy';
import { tierStatus, type TierView } from '../sim/towers';
import type { GoView } from '../app/input';
import { backOut, badge, badgeWidth, clamp01, createBlitCache, type Ctx, displayFont, drawDigits, fmt, glyphArrow, glyphCheck, glyphCross, glyphLock, glyphPlay, inRect, outCubic, plate, roundRectPath, tornRectPath, typeIcon, uiFont, wrapText } from './draw';
import { pulse } from './garden';

export type SideHit =
  | { k: 'card'; kind: TowerKind }
  | { k: 'close' }
  | { k: 'target'; dir: 1 | -1 }
  | { k: 'tier'; path: UpgradePath; tier: 1 | 2 | 3 }
  | { k: 'sell' }
  | { k: 'auto' }
  | { k: 'go' };

export const sameHit = (a: SideHit | null, b: SideHit | null): boolean => JSON.stringify(a) === JSON.stringify(b);

export function tierRect(path: UpgradePath, tier: 1 | 2 | 3): Rect {
  return { x: FOLD.colX[path], y: FOLD.tierY[tier - 1], w: FOLD.tierW, h: FOLD.tierH };
}

/** Hit test the sidebar for the panel currently shown. */
export function sidebarHit(x: number, y: number, tower: Readonly<Tower> | null): SideHit | null {
  if (inRect(HUD.go, x, y)) return { k: 'go' };
  if (inRect(HUD.autoStart, x, y)) return { k: 'auto' };
  if (!tower) {
    for (let i = 0; i < 4; i++) if (inRect(HUD.cards[i], x, y)) return { k: 'card', kind: TOWER_ORDER[i] };
    return null;
  }
  if (inRect(FOLD.close, x, y)) return { k: 'close' };
  if (TOWERS[tower.kind].hasTargeting && inRect(FOLD.targeting, x, y)) return { k: 'target', dir: x < FOLD.targeting.x + FOLD.targeting.w / 2 ? -1 : 1 };
  for (const path of [0, 1] as const) for (const tier of [1, 2, 3] as const) if (inRect(tierRect(path, tier), x, y)) return { k: 'tier', path, tier };
  if (inRect(FOLD.sell, x, y)) return { k: 'sell' };
  return null;
}

/** Name shown for a tower: its deepest tier's name, else the base name (§10.10 "Best defender: Gale Tern"). */
export function towerTitle(kind: TowerKind, tiers: readonly [number, number]): string {
  const def = TOWERS[kind];
  const p: UpgradePath = tiers[0] >= tiers[1] ? 0 : 1;
  const t = tiers[p];
  return t > 0 ? def.paths[p][t - 1].name : def.name;
}

export interface SidebarView {
  state: Readonly<SimState>;
  settings: Readonly<Settings>;
  nowMs: number;
  tower: Readonly<Tower> | null;
  /** Kind being placed (Satchel highlight). */
  placing: TowerKind | null;
  hover: SideHit | null;
  hoverSince: number;
  go: GoView;
  /** Panel fold: which panel and when it started opening. */
  panelAt: number;
  /** Previous panel's tower (for the outgoing face during the fold), or null for the Satchel. */
  prevTower: Readonly<Tower> | null;
  prevWasFold: boolean;
  ternGlow: boolean;
  /** Portrait morph after a buy (§10.4 Buy). */
  morph: { from: readonly [number, number]; born: number } | null;
  /** When each tier box last changed status (flip / SEALED stamp). */
  boxChange: ReadonlyMap<string, number>;
  offsetX: number;
  sellArmed: boolean;
}

const PANEL: Rect = { x: HUD.sidebar.x, y: 0, w: HUD.sidebar.w, h: 600 };

export function drawSidebar(c: Ctx, v: SidebarView): void {
  c.save();
  c.translate(v.offsetX, 0);
  // base sheet with a seeded torn left edge (zig 3 px); static, so blitted from the cache when it can be
  const bx = HUD.sidebar.x - 8;
  if (v.offsetX !== 0 || !CACHE.blit(c, 'base', bx, 0, LOGICAL_W - bx, LOGICAL_H, drawBase)) drawBase(c);

  const face = (tower: Readonly<Tower> | null): void => (tower ? drawFoldCard(c, v, tower) : drawSatchel(c, v));
  const t = (v.nowMs - v.panelAt) / (v.settings.reduceMotion ? MOTION.uiMs : MOTION.foldMs);
  if (t >= 1) face(v.tower);
  else if (v.settings.reduceMotion) {
    c.save(); c.globalAlpha = 1 - clamp01(t); face(v.prevWasFold ? v.prevTower : null); c.restore();
    c.save(); c.globalAlpha = clamp01(t); face(v.tower); c.restore();
  } else {
    // §4 fold: the new face opens from the hinge (left edge), scaleX 0→1, with a crease highlight
    face(v.prevWasFold ? v.prevTower : null);
    const k = outCubic(t);
    c.save();
    c.beginPath(); c.rect(PANEL.x, PANEL.y, PANEL.w * k, PANEL.h); c.clip();
    c.fillStyle = P.paperShade; c.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    c.translate(PANEL.x, 0); c.scale(Math.max(0.001, k), 1); c.translate(-PANEL.x, 0);
    face(v.tower);
    c.restore();
    c.fillStyle = 'rgba(28,26,36,.12)';
    c.fillRect(PANEL.x + PANEL.w * k - 6, PANEL.y, 6, PANEL.h);
    c.strokeStyle = P.foldWhite; c.lineWidth = 2;
    c.beginPath(); c.moveTo(PANEL.x + PANEL.w * k, PANEL.y); c.lineTo(PANEL.x + PANEL.w * k, PANEL.h); c.stroke();
  }
  drawAutoStart(c, v);
  drawGo(c, v);
  c.restore();
}

const CACHE = createBlitCache();

function drawBase(c: Ctx): void {
  c.fillStyle = P.shadow;
  tornRectPath(c, HUD.sidebar.x - 3, -6, HUD.sidebar.w + 12, HUD.sidebar.h + 12, 1080, 3, 8, { t: false, r: false, b: false, l: true });
  c.fill();
  c.fillStyle = P.paperShade;
  tornRectPath(c, HUD.sidebar.x, -6, HUD.sidebar.w + 10, HUD.sidebar.h + 12, 1080, 3, 8, { t: false, r: false, b: false, l: true });
  c.fill();
  c.strokeStyle = P.foldWhite;
  c.lineWidth = 1;
  c.stroke();
}

/** One Satchel card at rest (no hover lift): plate, portrait, name, cost, hotkey badge. */
function drawCard(c: Ctx, kind: TowerKind, r: Rect, afford: boolean, placing: boolean, lift: number): void {
  const def = TOWERS[kind];
  c.save();
  if (!afford) c.globalAlpha = 0.45;
  plate(c, r, 6, P.paper, { lift, stroke: placing ? P.ink : P.crease });
  if (placing) { c.strokeStyle = P.ink; c.lineWidth = 2; roundRectPath(c, r.x + 1, r.y + 1 - lift, r.w - 2, r.h - 2, 6); c.stroke(); }
  drawTowerSprite(c, kind, [0, 0], r.x + r.w / 2, r.y + 42 - lift, { angle: -Math.PI / 2, scale: 0.9, nowMs: 0, coaster: true });
  c.fillStyle = P.ink;
  c.font = uiFont(14);
  c.textAlign = 'center';
  c.fillText(def.name, r.x + r.w / 2, r.y + 84 - lift, r.w - 6);
  c.font = uiFont(16);
  c.fillStyle = afford ? P.ink : P.bad;
  drawDigits(c, fmt(def.cost), r.x + r.w / 2, r.y + 103 - lift, 16, 'center');
  c.textAlign = 'left';
  badge(c, r.x + 4, r.y + 4 - lift, def.hotkey);
  c.restore();
}

function drawSatchel(c: Ctx, v: SidebarView): void {
  c.font = displayFont(20);
  c.fillStyle = P.ink;
  c.fillText('Satchel', 1092, 40);
  c.font = uiFont(12);
  c.fillStyle = P.inkSoft;
  c.textAlign = 'right';
  c.fillText('1 – 4', 1268, 40);
  c.textAlign = 'left';
  let hovered: TowerKind | null = null;
  TOWER_ORDER.forEach((kind, i) => {
    const r = HUD.cards[i];
    const def = TOWERS[kind];
    const afford = v.state.money >= def.cost;
    const hov = v.hover?.k === 'card' && v.hover.kind === kind;
    if (hov) hovered = kind;
    const lift = hov && afford ? 2 * outCubic((v.nowMs - v.hoverSince) / MOTION.microMs) : 0;
    const placing = v.placing === kind;
    const paint = (g: Ctx): void => drawCard(g, kind, r, afford, placing, lift);
    // at rest the card is static: blit it (box padded for the stroke and the +3/+4 hard shadow)
    if (lift !== 0 || !CACHE.blit(c, `card:${kind}:${afford ? 1 : 0}:${placing ? 1 : 0}`, r.x - 4, r.y - 4, r.w + 12, r.h + 12, paint)) paint(c);
    if (v.ternGlow && kind === 'tern') {
      c.save();
      c.globalAlpha = 0.4 + 0.6 * pulse(v.nowMs, 1200);
      c.strokeStyle = P.glow; c.lineWidth = 2;
      roundRectPath(c, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 8); c.stroke();
      c.restore();
    }
  });
  // hovered card note (§14 blurb)
  const k: TowerKind | null = hovered ?? v.placing;
  if (k) {
    const def = TOWERS[k];
    const afford = v.state.money >= def.cost;
    const r: Rect = { x: 1092, y: 312, w: 176, h: 92 };
    plate(c, r, 6, P.foldWhite);
    c.fillStyle = P.ink;
    c.font = uiFont(14);
    c.fillText(def.name, r.x + 10, r.y + 22);
    c.font = uiFont(12, 400);
    c.fillStyle = P.inkSoft;
    wrapText(c, def.blurb, r.w - 20).slice(0, 2).forEach((l, i) => c.fillText(l, r.x + 10, r.y + 42 + i * 15));
    c.font = uiFont(12);
    c.fillStyle = afford ? P.inkSoft : P.bad;
    const s = def.base;
    c.fillText(afford ? `Range ${s.range} · ${cap(s.damageType)}` : `need ${fmt(def.cost - v.state.money)} more`, r.x + 10, r.y + 80);
  }
}

function drawFoldCard(c: Ctx, v: SidebarView, tower: Readonly<Tower>): void {
  const def = TOWERS[tower.kind];
  const st = tower.stats;
  // name (fit to the space left of the close button)
  const title = towerTitle(tower.kind, tower.tiers);
  let size = 20;
  c.font = uiFont(size);
  while (size > 14 && c.measureText(title).width > 146) { size -= 1; c.font = uiFont(size); }
  c.fillStyle = P.ink;
  c.fillText(title, FOLD.name.x, FOLD.name.y + 16);
  // close ✕
  const cr = FOLD.close;
  const hc = v.hover?.k === 'close';
  plate(c, cr, 6, hc ? P.foldWhite : P.paper, { shadow: false });
  glyphCross(c, cr.x + cr.w / 2, cr.y + cr.h / 2, 9, P.ink, 2);
  // portrait 72×72 (current sprite; morphs on buy)
  const pr = FOLD.portrait;
  plate(c, pr, 6, P.paperDeep, { stroke: P.kraftEdge });
  c.save();
  c.beginPath(); c.rect(pr.x + 1, pr.y + 1, pr.w - 2, pr.h - 2); c.clip();
  const pcx = pr.x + pr.w / 2, pcy = pr.y + pr.h / 2;
  const scale = tower.kind === 'koi' && tower.tiers[1] === 3 ? 0.95 : 1.15;
  const mt = v.morph ? clamp01((v.nowMs - v.morph.born) / MOTION.foldMs) : 1;
  if (v.morph && mt < 1) {
    drawTowerSprite(c, tower.kind, v.morph.from, pcx, pcy, { angle: -Math.PI / 2, scale: scale * (1 - 0.2 * mt), alpha: 1 - mt, nowMs: v.nowMs });
    drawTowerSprite(c, tower.kind, tower.tiers, pcx, pcy, { angle: -Math.PI / 2, scale: scale * backOut(mt), alpha: mt, nowMs: v.nowMs });
  } else drawTowerSprite(c, tower.kind, tower.tiers, pcx, pcy, { angle: -Math.PI / 2, scale, nowMs: v.nowMs });
  c.restore();
  // stats: Dmg · Rate · Range · Type
  const interval = st.interval * (tower.buffIntervalMul || 1);
  const dmg = st.damage + (tower.buffDamageAdd || 0);
  const range = st.attack === 'jets' ? st.jetRange : st.range;
  const lines: [string, string][] = [['Dmg', fmt(dmg)], ['Rate', `${(1 / interval).toFixed(2)}/s`], ['Range', fmt(range)]];
  c.font = uiFont(12);
  lines.forEach(([k, val], i) => {
    const y = FOLD.stats.y + 12 + i * 16;
    c.fillStyle = P.inkSoft; c.fillText(k, FOLD.stats.x, y);
    c.fillStyle = P.ink; c.textAlign = 'right'; c.fillText(val, 1268, y); c.textAlign = 'left';
  });
  const ty = FOLD.stats.y + 12 + 3 * 16;
  c.fillStyle = P.inkSoft; c.fillText('Type', FOLD.stats.x, ty);
  c.fillStyle = P.ink; c.textAlign = 'right'; c.fillText(cap(st.damageType), 1268, ty); c.textAlign = 'left';
  const tw = (c.measureText(cap(st.damageType)).width);
  typeIcon(c, st.damageType, 1268 - tw - 10, ty - 4);
  // targeting selector
  const tr = FOLD.targeting;
  if (def.hasTargeting) {
    const ht = v.hover?.k === 'target';
    plate(c, tr, 8, ht ? P.foldWhite : P.paper);
    // F-016: the T badge sits inside the plate's right end (4-px inset); ▶ moves in beside it
    const bx = tr.x + tr.w - BADGE_INSET - 20;
    glyphArrow(c, tr.x + 14, tr.y + tr.h / 2, 10, -1, v.hover?.k === 'target' && v.hover.dir === -1 ? P.ink : P.inkSoft);
    glyphArrow(c, bx - 12, tr.y + tr.h / 2, 10, 1, v.hover?.k === 'target' && v.hover.dir === 1 ? P.ink : P.inkSoft);
    c.font = uiFont(14);
    c.fillStyle = P.ink;
    c.textAlign = 'center';
    c.fillText(cap(tower.target), (tr.x + 24 + bx - 22) / 2, tr.y + 21);
    c.textAlign = 'left';
    badge(c, bx, tr.y + (tr.h - 20) / 2, 'T');
  } else {
    c.font = uiFont(12);
    c.fillStyle = P.inkSoft;
    c.textAlign = 'center';
    c.fillText('Pulses hit all in reach', tr.x + tr.w / 2, tr.y + 20);
    c.textAlign = 'left';
  }
  // path columns
  c.font = uiFont(12);
  let tip: { text: string; r: Rect } | null = null;
  for (const path of [0, 1] as const) {
    for (const tier of [1, 2, 3] as const) {
      const r = tierRect(path, tier);
      const view = tierStatus(v.state, tower, path, tier);
      const hov = v.hover?.k === 'tier' && v.hover.path === path && v.hover.tier === tier;
      drawTierBox(c, v, tower, path, tier, r, view, hov);
      if (hov && view.status === 'sealed') tip = { text: 'The other fold went deep.', r };
    }
  }
  // sell / refund
  const sr = FOLD.sell;
  const hs = v.hover?.k === 'sell';
  const value = sellValue(v.state, tower);
  plate(c, sr, 8, v.sellArmed ? P.foldWhite : hs ? P.foldWhite : P.paper, { lift: hs ? 1 : 0, stroke: v.sellArmed ? P.bad : P.crease });
  const dy = hs ? 1 : 0;
  const delX = sr.x + sr.w - BADGE_INSET - badgeWidth('Del');
  c.font = uiFont(14);
  c.fillStyle = v.sellArmed ? P.bad : P.ink;
  c.textAlign = 'center';
  c.fillText(v.sellArmed ? `Press again · ${fmt(value)}` : `${tower.fresh ? 'Refund' : 'Sell'} · ${fmt(value)}`, (sr.x + delX) / 2, sr.y + 21 - dy, delX - sr.x - 12);
  c.textAlign = 'left';
  badge(c, delX, sr.y + (sr.h - 20) / 2 - dy, 'Del');
  // tally
  c.font = uiFont(12);
  c.fillStyle = P.inkSoft;
  c.fillText(`Pops ${fmt(tower.pops)} · Spent ${fmt(tower.spent)}`, FOLD.tally.x, FOLD.tally.y + 12);
  if (tip) {
    const t = tip;
    const w = 176, h = 30;
    const x = 1092, y = Math.min(t.r.y + t.r.h - 6, 560);
    plate(c, { x, y, w, h }, 6, P.ink, { stroke: null });
    c.fillStyle = P.foldWhite;
    c.font = uiFont(12);
    c.textAlign = 'center';
    c.fillText(t.text, x + w / 2, y + 19);
    c.textAlign = 'left';
  }
}

function drawTierBox(c: Ctx, v: SidebarView, tower: Readonly<Tower>, path: UpgradePath, tier: 1 | 2 | 3, r: Rect, view: TierView, hov: boolean): void {
  const def = TOWERS[tower.kind].paths[path][tier - 1];
  const changedAt = v.boxChange.get(`${tower.id}:${path}:${tier}`) ?? -1e9;
  const age = v.nowMs - changedAt;
  c.save();
  // flip to owned (160 ms): scaleY 1→0→1 about the box centre
  if (view.status === 'owned' && age < MOTION.uiMs && !v.settings.reduceMotion) {
    const t = age / MOTION.uiMs;
    const sy = Math.abs(Math.cos(t * Math.PI));
    c.translate(0, r.y + r.h / 2); c.scale(1, Math.max(0.05, sy)); c.translate(0, -(r.y + r.h / 2));
  }
  const next = view.status === 'next';
  const short = next && !view.affordable;
  if (short) c.globalAlpha = 0.6;
  if (view.status === 'sealed' || view.status === 'locked') c.globalAlpha = 0.8;
  const owned = view.status === 'owned';
  const lift = hov && next && !short ? 1 : 0;
  plate(c, r, 6, owned ? P.ink : next ? P.foldWhite : P.paper, { lift, stroke: owned ? null : P.crease, shadow: owned || next });
  if (next && !short) { c.strokeStyle = P.glow; c.lineWidth = 2; roundRectPath(c, r.x + 1, r.y + 1 - lift, r.w - 2, r.h - 2, 6); c.stroke(); }
  const fg = owned ? P.foldWhite : view.status === 'sealed' || view.status === 'locked' ? P.inkSoft : P.ink;
  const y0 = r.y - lift;
  const sealed = view.status === 'sealed';
  // F-015: one top-right glyph slot (✓ owned · hotkey badge next · lock sealed); the first name line keeps
  // clear of it, cost and effect lines flow below the name, and an effect that will not fit ends in "…"
  const glyph = owned || next || sealed;
  // path colour tab (A gold, B water-deep)
  c.fillStyle = PATH_FLECK[path];
  c.fillRect(r.x + 8, y0 + 6, 16, 3);
  if (sealed) c.globalAlpha = 0.35;
  c.font = uiFont(12);
  c.fillStyle = fg;
  const names = wrapLines(c, def.name, [glyph ? r.w - 8 - TIER_GUTTER : r.w - 14, r.w - 14], 2);
  names.forEach((l, i) => c.fillText(l, r.x + 8, y0 + 24 + i * 14));
  const costY = y0 + 24 + 14 * (names.length - 1) + (names.length > 1 ? 20 : 24);
  c.font = uiFont(16);
  c.fillStyle = short ? P.bad : fg;
  drawDigits(c, fmt(def.cost), r.x + 8, costY, 16);
  c.font = uiFont(12, 400);
  c.fillStyle = owned ? 'rgba(251,247,238,.85)' : P.inkSoft;
  const effY = costY + (names.length > 1 ? 16 : 18);
  const lastY = y0 + (short ? 88 : 102);
  const room = Math.max(1, Math.floor((lastY - effY) / 14) + 1);
  wrapLines(c, def.effectLine, [r.w - 14], room).forEach((l, i) => c.fillText(l, r.x + 8, effY + i * 14));
  if (short) { c.font = uiFont(12); c.fillStyle = P.bad; c.fillText(`need ${fmt(view.shortBy)} more`, r.x + 8, y0 + 102, r.w - 12); }
  if (owned) glyphCheck(c, r.x + r.w - 14, y0 + 13, 12, P.glow);
  c.restore();
  if (sealed) {
    // stamp thunks in (90 ms) when the rule first applies; drawn over the dimmed (35 %) box text
    const k = v.settings.reduceMotion ? 1 : clamp01(age / MOTION.microMs);
    const s = 1.35 - 0.35 * k;
    c.save();
    c.translate(r.x + r.w / 2, r.y + r.h / 2 + 6);
    c.rotate(-0.42);
    c.scale(s, s);
    c.globalAlpha = 0.4 * (0.5 + 0.5 * k);
    c.strokeStyle = P.bad; c.lineWidth = 2;
    c.strokeRect(-38, -12, 76, 24);
    c.fillStyle = P.bad;
    c.font = uiFont(14, 700);
    c.textAlign = 'center';
    c.fillText('SEALED', 0, 5);
    c.restore();
    glyphLock(c, r.x + r.w - 14, r.y + 17, P.bad);
  }
  if (next) badge(c, r.x + r.w - BADGE_INSET - 20, y0 + BADGE_INSET, path === 0 ? 'Z' : 'X', short ? 0.6 : 1);
}

/** Greedy wrap with a width per line (the last width repeats); the last allowed line ends in "…" if cut. */
function wrapLines(c: Ctx, text: string, widths: readonly number[], max: number): string[] {
  const words = text.split(' ');
  const out: string[] = [];
  let line = '';
  const wOf = (i: number): number => widths[Math.min(i, widths.length - 1)];
  for (let k = 0; k < words.length; k++) {
    const t = line ? `${line} ${words[k]}` : words[k];
    if (line && c.measureText(t).width > wOf(out.length)) {
      if (out.length === max - 1) { out.push(ellipsize(c, `${line} ${words.slice(k).join(' ')}`, wOf(out.length))); return out; }
      out.push(line); line = words[k];
    } else line = t;
  }
  if (line) out.push(out.length < max ? line : ellipsize(c, line, wOf(max - 1)));
  return out.slice(0, max);
}

function ellipsize(c: Ctx, text: string, w: number): string {
  if (c.measureText(text).width <= w) return text;
  let t = text;
  while (t.length > 1 && c.measureText(`${t.trimEnd()}…`).width > w) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

function drawAutoStart(c: Ctx, v: SidebarView): void {
  const r = HUD.autoStart;
  const on = v.state.autoStart || v.settings.autoStart;
  const hov = v.hover?.k === 'auto';
  plate(c, r, 6, hov ? P.foldWhite : P.paper, { shadow: false });
  const bx = r.x + 6, by = r.y + 5;
  roundRectPath(c, bx, by, 18, 18, 4);
  c.fillStyle = on ? P.ink : P.foldWhite; c.fill();
  c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke();
  if (on) glyphCheck(c, bx + 9, by + 9, 10, P.foldWhite);
  c.font = uiFont(14);
  c.fillStyle = P.ink;
  c.fillText('Auto-start', bx + 28, r.y + 19);
  badge(c, r.x + r.w - 26, r.y + 4, 'A');
}

function drawGo(c: Ctx, v: SidebarView): void {
  const r = HUD.go;
  const g = v.go;
  const hov = v.hover?.k === 'go' && g.action !== 'none';
  const s = g.pulse && !v.settings.reduceMotion ? 1 + 0.04 * pulse(v.nowMs, 1200) : 1;
  c.save();
  if (g.dim) c.globalAlpha = 0.45;
  c.translate(r.x + r.w / 2, r.y + r.h / 2);
  c.scale(s, s);
  c.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
  const fill = g.action === 'start' ? P.ok : P.ink;
  plate(c, r, 8, fill, { lift: hov ? 1 : 0, stroke: null });
  if (g.pulse) {
    c.strokeStyle = P.glow; c.lineWidth = 2; c.globalAlpha = (g.dim ? 0.45 : 1) * (0.4 + 0.6 * pulse(v.nowMs, 1200));
    roundRectPath(c, r.x - 3, r.y - 3 - (hov ? 1 : 0), r.w + 6, r.h + 6, 10); c.stroke();
    c.globalAlpha = g.dim ? 0.45 : 1;
  }
  // F-016: the Space badge lives inside the plate (bottom-right, 8-px inset) and the label centres in the
  // room left of it, so neither ever overlaps the other or the canvas edge
  const lift = hov ? 1 : 0;
  const bw = badgeWidth('Space');
  const bx = r.x + r.w - 8 - bw;
  c.font = uiFont(20);
  const tw = c.measureText(g.text).width;
  const iconW = g.icon === 'fast' ? 26 : 14;
  const x0 = (r.x + bx) / 2 - (iconW + 10 + tw) / 2;
  const cy = r.y + r.h / 2 - lift;
  glyphPlay(c, x0, cy, 16, P.foldWhite);
  if (g.icon === 'fast') glyphPlay(c, x0 + 12, cy, 16, P.foldWhite);
  c.fillStyle = P.foldWhite;
  c.fillText(g.text, x0 + iconW + 10, cy + 7);
  badge(c, bx, r.y + r.h - 8 - 20 - lift, 'Space', 1, 'rgba(251,247,238,.6)');
  c.restore();
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** Badges sit inside their plate, 4 px from the corner (F-016). */
const BADGE_INSET = 4;
/** Right gutter kept by a tier box's first name line for its top-right glyph (F-015). */
const TIER_GUTTER = 26;
