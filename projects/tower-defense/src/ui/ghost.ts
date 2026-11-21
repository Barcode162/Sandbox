// Field overlays (§10.2, §10.4): the placement ghost with validity by colour *and* shape, the R1 paper
// star, the selected tower's range ring (bloom) with Owl aura ring, the next-tier hover preview, and the
// buy morph / sell sink overlays.
import type { PlaceFail, Settings, Tower, TowerKind } from '../contracts/types';
import { P } from '../data/palette';
import { FOOTPRINT } from '../data/map';
import { MOTION } from '../data/feel';
import { resolveStats, TOWERS } from '../data/towers';
import { drawTowerSprite } from '../render/towers';
import { clamp01, type Ctx, glyphCross, inQuad, outCubic, starPath } from './draw';
import { pulse } from './garden';

export interface GhostView {
  kind: TowerKind;
  x: number;
  y: number;
  fail: PlaceFail | null;
  /** Real ms when the ghost entered an invalid spot (one 90-ms nudge). */
  nudgeAt: number;
  nowMs: number;
}

export function rangeOf(kind: TowerKind, tiers: readonly [number, number]): number {
  const s = resolveStats(kind, tiers);
  return s.attack === 'jets' ? Math.max(s.range, s.jetRange) : s.range;
}

export function drawGhost(c: Ctx, v: GhostView): void {
  const ok = v.fail === null;
  const nt = (v.nowMs - v.nudgeAt) / MOTION.microMs;
  const dx = !ok && nt >= 0 && nt < 1 ? Math.sin(nt * Math.PI * 2) * 2 : 0;
  const x = v.x + dx, y = v.y;
  const r = TOWERS[v.kind].base.range;
  const col = ok ? P.ok : P.bad;
  c.save();
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  c.globalAlpha = 0.1; c.fillStyle = col; c.fill();
  c.globalAlpha = 1; c.setLineDash([6, 6]); c.lineWidth = 2; c.strokeStyle = col; c.stroke();
  c.setLineDash([]);
  drawTowerSprite(c, v.kind, [0, 0], x, y, { angle: -Math.PI / 2, alpha: 0.7, nowMs: v.nowMs, coaster: true });
  if (!ok) {
    const fr = FOOTPRINT[v.kind];
    c.beginPath(); c.arc(x, y, fr + 4, 0, Math.PI * 2);
    c.strokeStyle = P.bad; c.lineWidth = 2; c.stroke();
    glyphCross(c, x, y, 14, P.bad, 3);
  }
  c.restore();
}

/** §10.2 paper star: r 14, --glow stroke, pulsing 1↔1.12 over 1.2 s; brighter while hovered. */
export function drawStar(c: Ctx, x: number, y: number, nowMs: number, bright: boolean, reduceMotion: boolean): void {
  const s = reduceMotion ? 1.06 : 1 + 0.12 * pulse(nowMs, 1200);
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (bright) {
    c.fillStyle = 'rgba(255,214,107,.35)';
    c.beginPath(); c.arc(0, 0, 24, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = P.shadow;
  starPath(c, 3, 4, 14); c.fill();
  c.fillStyle = bright ? P.foldWhite : 'rgba(251,247,238,.85)';
  starPath(c, 0, 0, 14); c.fill();
  c.strokeStyle = P.glow; c.lineWidth = bright ? 3 : 2; c.lineJoin = 'round';
  c.stroke();
  c.restore();
}

/** Selected tower: solid 2-px --ink 50 % ring + 8 % fill, blooming r 0→R over 160 ms; Owl aura dashed. */
export function drawSelection(c: Ctx, t: Readonly<Tower>, selectedAt: number, nowMs: number, s: Readonly<Settings>): void {
  const k = s.reduceMotion ? 1 : outCubic((nowMs - selectedAt) / MOTION.uiMs);
  const r = (t.stats.attack === 'jets' ? Math.max(t.stats.range, t.stats.jetRange) : t.stats.range) * k;
  c.save();
  c.beginPath(); c.arc(t.x, t.y, r, 0, Math.PI * 2);
  c.fillStyle = 'rgba(28,26,36,.08)'; c.fill();
  c.strokeStyle = 'rgba(28,26,36,.5)'; c.lineWidth = 2; c.stroke();
  if (t.stats.auraRadius > 0) {
    c.beginPath(); c.arc(t.x, t.y, t.stats.auraRadius * k, 0, Math.PI * 2);
    c.setLineDash([8, 6]); c.strokeStyle = 'rgba(201,150,42,.75)'; c.stroke(); c.setLineDash([]);
  }
  c.restore();
}

/** Hovering a next tier: the upgraded sprite at 50 % over the tower and its new range ring dashed. */
export function drawUpgradePreview(c: Ctx, t: Readonly<Tower>, tiers: readonly [number, number], nowMs: number): void {
  const r = rangeOf(t.kind, tiers);
  c.save();
  c.beginPath(); c.arc(t.x, t.y, r, 0, Math.PI * 2);
  c.setLineDash([6, 6]); c.lineWidth = 2; c.strokeStyle = 'rgba(28,26,36,.6)'; c.stroke(); c.setLineDash([]);
  const aura = resolveStats(t.kind, tiers).auraRadius;
  if (aura > 0) { c.beginPath(); c.arc(t.x, t.y, aura, 0, Math.PI * 2); c.setLineDash([3, 6]); c.strokeStyle = 'rgba(201,150,42,.75)'; c.stroke(); c.setLineDash([]); }
  drawTowerSprite(c, t.kind, tiers, t.x, t.y - 2, { angle: t.angle, alpha: 0.5, nowMs, coaster: false, scale: 1.04 });
  c.restore();
}

export interface Morph { towerId: number; kind: TowerKind; from: [number, number]; x: number; y: number; angle: number; born: number }
export interface Sink { kind: TowerKind; tiers: [number, number]; x: number; y: number; angle: number; born: number }

/** Buy: the old sprite shrinks to 0.8 and fades over 220 ms above the new one. */
export function drawMorph(c: Ctx, m: Morph, nowMs: number): boolean {
  const t = (nowMs - m.born) / MOTION.foldMs;
  if (t >= 1) return false;
  drawTowerSprite(c, m.kind, m.from, m.x, m.y, { angle: m.angle, scale: 1 - 0.2 * t, alpha: 1 - clamp01(t), nowMs, coaster: false });
  return true;
}

/** Sell: the tower unfolds flat and slides into the ground (220 ms). */
export function drawSink(c: Ctx, s: Sink, nowMs: number): boolean {
  const t = (nowMs - s.born) / MOTION.foldMs;
  if (t >= 1) return false;
  c.save();
  c.translate(s.x, s.y + inQuad(t) * 8);
  c.scale(1 + 0.15 * t, Math.max(0.05, 1 - inQuad(t)));
  drawTowerSprite(c, s.kind, s.tiers, 0, 0, { angle: s.angle, alpha: 1 - t * 0.7, coaster: true, nowMs });
  c.restore();
  return true;
}
