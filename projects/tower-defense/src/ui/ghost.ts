// Field overlays (§10.2, §10.4): the placement ghost with validity by colour *and* shape, the R1 paper
// star, the selected tower's range ring (bloom) with Owl aura ring, the next-tier hover preview, and the
// buy morph / sell sink overlays.
import type { PlaceFail, Settings, Tower, TowerKind } from '../contracts/types';
import { P, SHADOW_OFFSET } from '../data/palette';
import { FOOTPRINT } from '../data/map';
import { MOTION } from '../data/feel';
import { resolveStats, TOWERS } from '../data/towers';
import { coasterRadius, drawTowerSprite } from '../render/towers';
import { mix } from '../render/towers/paint';
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

/**
 * §10.2 paper star: r 14, --glow stroke, pulsing 1↔1.12 over 1.2 s. Drawn under the ghost; while the ghost
 * hovers it (F-018) the star tucks to 0.6× at 50 % beneath the tower and brightens as a 2-px --glow ring
 * r 22 around the footprint, so the Tern you are about to place still reads.
 */
export function drawStar(c: Ctx, x: number, y: number, nowMs: number, bright: boolean, reduceMotion: boolean): void {
  const s = (reduceMotion ? 1.06 : 1 + 0.12 * pulse(nowMs, 1200)) * (bright ? 0.6 : 1);
  c.save();
  c.translate(x, y);
  if (bright) {
    c.strokeStyle = P.glow; c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, 22 * (reduceMotion ? 1 : 1 + 0.05 * pulse(nowMs, 1200)), 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 0.5;
  }
  c.scale(s, s);
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

export interface Morph { towerId: number; kind: TowerKind; from: [number, number]; to: [number, number]; x: number; y: number; angle: number; born: number }
export interface Sink { kind: TowerKind; tiers: [number, number]; x: number; y: number; angle: number; born: number }

/**
 * Buy, under the towers pass (F-019): the coaster is the base, not part of the morph, so it stays at full
 * alpha and scale 1 (new tier notches) while the world layer backOuts the new fold in on top of it.
 * Mirrors the §7 coaster (render/towers/sprites.ts drawCoaster: disc r fr+4, crease ring, A/B notches).
 */
export function drawMorphBase(c: Ctx, m: Morph, nowMs: number): void {
  if (nowMs - m.born >= MOTION.foldMs) return;
  const R = coasterRadius(m.kind);
  c.save();
  c.translate(m.x, m.y);
  c.fillStyle = P.shadow;
  c.beginPath(); c.arc(SHADOW_OFFSET.x, SHADOW_OFFSET.y, R, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2);
  c.fillStyle = P.paperDeep; c.fill();
  c.lineWidth = 1; c.strokeStyle = P.kraftEdge; c.stroke();
  c.beginPath(); c.arc(0, 0, R - 3.5, 0, Math.PI * 2);
  c.strokeStyle = mix(P.paperDeep, P.foldWhite, 0.45); c.lineWidth = 0.8; c.stroke();
  c.lineCap = 'butt';
  for (let side = 0; side < 2; side++) {
    const owned = m.to[side];
    for (let k = 0; k < 3; k++) {
      const a = side === 0 ? Math.PI + (k - 1) * 0.52 : -(k - 1) * 0.52;
      c.beginPath(); c.arc(0, 0, R - 2, a - 0.21, a + 0.21);
      c.strokeStyle = k < owned ? P.ink : mix(P.paperDeep, P.ink, 0.25);
      c.lineWidth = k < owned ? 4 : 1;
      c.stroke();
    }
  }
  c.restore();
}

/** Buy: the old paper figure (no coaster) shrinks to 0.8 and fades over 220 ms above the new one. */
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
