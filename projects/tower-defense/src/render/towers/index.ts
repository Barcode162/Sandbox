// Tower sprites (4 kinds × 12 valid tier combos), projectiles, beams, pulses, decals, fire feel (WO-003). FROZEN signatures.
import type { DrawPass, Fx, Projectile, RenderFrame, SimEvent, SimState, Tower, TowerKind, WorldLayer } from '../../contracts/types';
import { P, PATH_FLECK, FONT_UI } from '../../data/palette';
import { FIRE_FEEL, MOTION, PLACE_FEEL } from '../../data/feel';
import { TOWERS, TOWER_ORDER } from '../../data/towers';
import { mix } from './paint';
import { NO_FEEL, paintTower, type SpriteFeel } from './sprites';

export { coasterRadius } from './sprites';

export interface SpriteOpts {
  angle: number; // facing (radians)
  scale?: number;
  alpha?: number;
  /** Real-time ms for ambient motion (sway, streamers, rotating rays); 0 = static. */
  nowMs?: number;
  /** Draw the coaster disc, hard shadow and tier notches (§7 Tower markers). */
  coaster?: boolean;
}

/** One sprite for (kind, tiers); used in the world, the ghost, satchel cards, portraits and upgrade previews. */
export function drawTowerSprite(ctx: CanvasRenderingContext2D, kind: TowerKind, tiers: readonly [number, number], x: number, y: number, o: SpriteOpts): void {
  paintTower(ctx, kind, tiers, x, y, { angle: o.angle, scale: o.scale ?? 1, alpha: o.alpha ?? 1, nowMs: o.nowMs ?? 0, coaster: o.coaster ?? true }, NO_FEEL);
}

// ───────────────────────────── the 4 × 12 sheet (§7, §16.10; 'towers-sheet' stage) ─────────────────────────────

/** Every valid tier combo (max ≤ 3, min ≤ 1), in sheet order. */
export const TOWER_COMBOS: readonly (readonly [number, number])[] = [
  [0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [0, 3], [1, 1], [2, 1], [3, 1], [1, 2], [1, 3],
];

/** Sheet geometry on the 1280×720 canvas; the pixel-diff compares each cell's sprite box with its left neighbour. */
export const SHEET = { x0: 16, y0: 36, cellW: 104, cellH: 171, labelH: 30, scale: 1.7, cx: 52, cy: 124, angle: -Math.PI / 4 } as const;

/** Draw the full sheet (WO-004's 'towers-sheet' stage calls this on a cleared 1280×720 canvas). */
export function drawTowerSheet(ctx: CanvasRenderingContext2D, nowMs = 0): void {
  ctx.save();
  ctx.fillStyle = P.paper;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = P.ink;
  ctx.font = `italic 400 20px Georgia, "Iowan Old Style", serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText('Inkfold · the fold book — 4 towers × 12 tier combos (A·B)', SHEET.x0, 18);
  TOWER_ORDER.forEach((kind, row) => {
    TOWER_COMBOS.forEach((tiers, col) => {
      const x = SHEET.x0 + col * SHEET.cellW;
      const y = SHEET.y0 + row * SHEET.cellH;
      ctx.fillStyle = (row + col) % 2 ? P.paper : mix(P.paper, P.paperShade, 0.5);
      ctx.fillRect(x, y, SHEET.cellW, SHEET.cellH);
      ctx.fillStyle = P.inkSoft;
      ctx.font = `600 12px ${FONT_UI}`;
      ctx.textBaseline = 'top';
      ctx.fillText(`${TOWERS[kind].name} ${tiers[0]}·${tiers[1]}`, x + 6, y + 4);
      ctx.font = `400 10px ${FONT_UI}`;
      ctx.fillText(comboName(kind, tiers), x + 6, y + 17);
      drawTowerSprite(ctx, kind, tiers, x + SHEET.cx, y + SHEET.cy, { angle: kind === 'koi' ? -Math.PI / 2 : SHEET.angle, scale: SHEET.scale, nowMs, coaster: true });
    });
  });
  ctx.restore();
}

function comboName(kind: TowerKind, t: readonly [number, number]): string {
  const p = t[0] >= t[1] ? 0 : 1;
  const tier = Math.max(t[0], t[1]);
  return tier === 0 ? 'base fold' : TOWERS[kind].paths[p][tier - 1].name;
}

// ───────────────────────────── world layer ─────────────────────────────

const backOut = (t: number): number => {
  const c1 = MOTION.backOutS, c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};
const outCubic = (t: number): number => 1 - (1 - t) ** 3;
const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

interface TowerRec {
  kind: TowerKind;
  tiers: [number, number];
    x: number;
  y: number;
  angle: number;
  placeAt: number;
  upgradeAt: number;
  fireAt: number;
}
interface Ring { at: number; x: number; y: number; r: number; kind: 0 | 1 | 2 | 3; dashed: boolean }
interface Beam { at: number; x1: number; y1: number; x2: number; y2: number; w: number; eclipse: boolean }

/** Ring kinds. */
const LAND = 0, RIPPLE = 1, CRACK = 2, PULSE = 3;
const RING_MS = [200, 420, 400, 180] as const;
const BEAM_MS = 90;
const MORPH_MS = MOTION.foldMs;

function makeRing(): Ring { return { at: -1e9, x: 0, y: 0, r: 0, kind: 0, dashed: false }; }
function makeBeam(): Beam { return { at: -1e9, x1: 0, y1: 0, x2: 0, y2: 0, w: 2, eclipse: false }; }

function findTower(towers: readonly Tower[], id: number): Tower | null {
  for (const t of towers) if (t.id === id) return t;
  return null;
}

/** World layer for passes 'decals', 'projectiles', 'towers'; reacts to fire/land/pulse/beam/place/upgrade/sell events. */
export function createTowerLayer(fx: Fx): WorldLayer {
  let clock = 0;
  const recs = new Map<number, TowerRec>();
  const rings: Ring[] = Array.from({ length: 128 }, makeRing);
  const beams: Beam[] = Array.from({ length: 64 }, makeBeam);
  let ringNext = 0, beamNext = 0;
  const feel: SpriteFeel = { ...NO_FEEL };

  const ring = (x: number, y: number, r: number, kind: Ring['kind'], dashed = false): void => {
    const g = rings[ringNext];
    ringNext = (ringNext + 1) % rings.length;
    g.at = clock; g.x = x; g.y = y; g.r = r; g.kind = kind; g.dashed = dashed;
  };

  const sync = (state: Readonly<SimState>): void => {
    for (const t of state.towers) {
      let r = recs.get(t.id);
      if (!r) {
        r = { kind: t.kind, tiers: [t.tiers[0], t.tiers[1]], x: t.x, y: t.y, angle: t.angle, placeAt: -1e9, upgradeAt: -1e9, fireAt: -1e9 };
        recs.set(t.id, r);
      }
      r.tiers[0] = t.tiers[0]; r.tiers[1] = t.tiers[1]; r.angle = t.angle;
    }
  };

  const layer: WorldLayer = {
    onSimEvent(e: SimEvent, state) {
      switch (e.type) {
        case 'place': {
          sync(state);
          const r = recs.get(e.towerId);
          if (r) r.placeAt = clock;
          fx.flecks(e.x, e.y, PLACE_FEEL.flecks, P.crease);
          break;
        }
        case 'upgrade': {
          const r = recs.get(e.towerId);
          if (r) {
            r.upgradeAt = clock;
          }
          sync(state);
          const t = findTower(state.towers, e.towerId);
          if (t) fx.flecks(t.x, t.y, PLACE_FEEL.upgradeFlecks, PATH_FLECK[e.path]);
          break;
        }
        case 'sell': {
          // the unfold-and-sink overlay is WO-004's (src/ui/ghost.ts drawSink); here only the flecks
          recs.delete(e.towerId);
          fx.flecks(e.x, e.y, PLACE_FEEL.flecks, P.kraft);
          break;
        }
        case 'fire': {
          const r = recs.get(e.towerId);
          if (r) r.fireAt = clock;
          break;
        }
        case 'land': {
          const t = findTower(state.towers, e.towerId);
          ring(e.x, e.y, e.radius, LAND);
          if (t && t.stats.skips > 0) ring(e.x, e.y, e.radius, RIPPLE);
          if (e.stun && !e.skip) ring(e.x, e.y, e.radius, CRACK);
          break;
        }
        case 'pulse': {
          const t = findTower(state.towers, e.towerId);
          ring(e.x, e.y, e.radius, PULSE, !!t && t.stats.slowPct > 0);
          if (e.freeze) ring(e.x, e.y, e.radius, PULSE, false);
          break;
        }
        case 'beam': {
          const t = findTower(state.towers, e.towerId);
          const b = beams[beamNext];
          beamNext = (beamNext + 1) % beams.length;
          b.at = clock; b.x1 = e.x1; b.y1 = e.y1; b.x2 = e.x2; b.y2 = e.y2; b.eclipse = e.eclipse;
          b.w = t && t.tiers[0] >= 2 ? 4 : 2;
          break;
        }
        default:
          break;
      }
    },
    update(dt, state) {
      clock += dt;
      sync(state);
      if (recs.size > state.towers.length) {
        for (const id of recs.keys()) if (!findTower(state.towers, id)) recs.delete(id);
      }
    },
    reset() {
      clock = 0;
      recs.clear();
      for (const r of rings) r.at = -1e9;
      for (const b of beams) b.at = -1e9;
    },
    draw(f: RenderFrame, pass: DrawPass) {
      if (pass === 'decals') drawDecals(f);
      else if (pass === 'projectiles') drawProjectiles(f);
      else if (pass === 'towers') drawTowers(f);
    },
  };

  function drawDecals(f: RenderFrame): void {
    const c = f.ctx;
    c.save();
    for (const t of f.state.towers) {
      const s = t.stats;
      if (s.auraRadius > 0) {
        // Paper Lamp: a --glow disc r 170 at 6 %
        c.globalAlpha = 0.06;
        c.fillStyle = P.glow;
        c.beginPath(); c.arc(t.x, t.y, s.auraRadius, 0, Math.PI * 2); c.fill();
      }
      if (s.frostDecalRadius > 0) {
        // Glacier Carp: frost hexagon r 105 at 20 %
        c.globalAlpha = 0.2;
        c.fillStyle = P.glacier;
        c.strokeStyle = P.waterDeep;
        c.lineWidth = 1.5;
        c.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
          const x = t.x + Math.cos(a) * s.frostDecalRadius, y = t.y + Math.sin(a) * s.frostDecalRadius;
          if (k) c.lineTo(x, y); else c.moveTo(x, y);
        }
        c.closePath(); c.fill();
        c.globalAlpha = 0.35; c.stroke();
      }
    }
    for (const g of rings) {
      if (g.kind === PULSE) continue;
      const u = (clock - g.at) / RING_MS[g.kind];
      if (u < 0 || u >= 1) continue;
      if (g.kind === CRACK) {
        // Boulder Toad crack decal ring: jagged radial cracks, fading over 400 ms
        c.globalAlpha = 0.55 * (1 - u);
        c.strokeStyle = P.inkSoft;
        c.lineWidth = 1.4;
        c.beginPath();
        for (let k = 0; k < 9; k++) {
          const a = k * 0.698 + g.x * 0.01;
          const r0 = g.r * 0.25, r1 = g.r * (0.7 + 0.25 * ((k * 37) % 7) / 7);
          c.moveTo(g.x + Math.cos(a) * r0, g.y + Math.sin(a) * r0);
          c.lineTo(g.x + Math.cos(a + 0.12) * (r0 + r1) * 0.5, g.y + Math.sin(a + 0.12) * (r0 + r1) * 0.5);
          c.lineTo(g.x + Math.cos(a - 0.05) * r1, g.y + Math.sin(a - 0.05) * r1);
        }
        c.stroke();
        c.beginPath(); c.arc(g.x, g.y, g.r * 0.92, 0, Math.PI * 2);
        c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]);
      } else {
        const r = g.r * (g.kind === RIPPLE ? 0.3 + 0.7 * outCubic(u) : 0.45 + 0.55 * outCubic(u));
        c.globalAlpha = (g.kind === RIPPLE ? 0.6 : 0.4) * (1 - u);
        c.strokeStyle = g.kind === RIPPLE ? P.waterDeep : P.kraftEdge;
        c.lineWidth = g.kind === RIPPLE ? 1.6 : 2;
        c.beginPath(); c.arc(g.x, g.y, r, 0, Math.PI * 2); c.stroke();
      }
    }
    c.restore();
  }

  function drawProjectiles(f: RenderFrame): void {
    const c = f.ctx;
    const st = f.state;
    const a = f.alpha;
    c.save();
    // Koi pulse rings: r 0 → reach over 180 ms (dashed 4/4 with Cold Spring; frost-white on freeze pulses)
    for (const g of rings) {
      if (g.kind !== PULSE) continue;
      const u = (clock - g.at) / RING_MS[PULSE];
      if (u < 0 || u >= 1) continue;
      c.globalAlpha = 0.85 * (1 - u * u);
      c.strokeStyle = g.dashed ? P.waterDeep : mix(P.waterDeep, P.water, 0.3);
      c.lineWidth = 2.5;
      if (g.dashed) c.setLineDash([4, 4]);
      c.beginPath(); c.arc(g.x, g.y, Math.max(0.5, g.r * outCubic(u)), 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 0.12 * (1 - u);
      c.fillStyle = P.water;
      c.fill();
    }
    const pool = st.projectiles;
    for (let i = 0; i < pool.count; i++) {
      const p = pool.items[i];
      const x = p.px + (p.x - p.px) * a, y = p.py + (p.y - p.py) * a;
      c.globalAlpha = 1;
      if (p.kind === 'stone') drawStone(c, p, x, y, a, findTower(st.towers, p.towerId));
      else drawDart(c, p, x, y, findTower(st.towers, p.towerId));
    }
    // Owl glare beams: --glow, 2 px (4 px with Piercing Beam), 90 ms fade; Eclipse leaves a 200 ms afterimage
    for (const b of beams) {
      const age = clock - b.at;
      const life = b.eclipse ? 200 : BEAM_MS;
      if (age < 0 || age >= life) continue;
      c.lineCap = 'round';
      if (b.eclipse && age > BEAM_MS * 0.5) {
        c.globalAlpha = 0.45 * (1 - age / life);
        c.strokeStyle = P.eclipse;
        c.lineWidth = b.w + 4;
        c.beginPath(); c.moveTo(b.x1, b.y1); c.lineTo(b.x2, b.y2); c.stroke();
      }
      if (age < BEAM_MS) {
        const u = age / BEAM_MS;
        c.globalAlpha = 0.35 * (1 - u);
        c.strokeStyle = P.glow;
        c.lineWidth = b.w + 4;
        c.beginPath(); c.moveTo(b.x1, b.y1); c.lineTo(b.x2, b.y2); c.stroke();
        c.globalAlpha = 1 - u;
        c.lineWidth = b.w;
        c.stroke();
      }
    }
    c.restore();
  }

  function drawTowers(f: RenderFrame): void {
    const c = f.ctx;
    const ambient = f.settings.reduceMotion ? 0 : f.nowMs || 1;
    for (const t of f.state.towers) {
      const r = recs.get(t.id);
      const d = t.angle - t.pangle;
      const ang = t.pangle + Math.atan2(Math.sin(d), Math.cos(d)) * f.alpha;
      fireFeel(t, r ? clock - r.fireAt : 1e9);
      let scale = 1;
      if (r) {
        const pu = (clock - r.placeAt) / PLACE_FEEL.ms;
        if (pu >= 0 && pu < 1) scale = pu < 0.6 ? 0.6 + (1.08 - 0.6) * outCubic(pu / 0.6) : 1.08 - 0.08 * outCubic((pu - 0.6) / 0.4);
        const mu = (clock - r.upgradeAt) / MORPH_MS;
        if (mu >= 0 && mu < 1) {
          // morph: the new fold backOuts in. The outgoing fold (scale to 0.8, fade) is WO-004's overlay
          // (src/ui/ghost.ts drawMorph), so it is drawn exactly once.
          paintTower(c, t.kind, t.tiers, t.x, t.y, { angle: ang, scale: Math.max(0.01, backOut(clamp01(mu))), alpha: clamp01(mu * 1.5), nowMs: ambient, coaster: true }, feel);
          continue;
        }
      }
      paintTower(c, t.kind, t.tiers, t.x, t.y, { angle: ang, scale, alpha: 1, nowMs: ambient, coaster: true }, feel);
    }
  }

  function fireFeel(t: Tower, age: number): void {
    feel.recoil = 0; feel.squashX = 1; feel.squashY = 1; feel.flare = 0; feel.tongue = 0; feel.throat = 1;
    if (t.kind === 'tern' && age < FIRE_FEEL.ternRecoilMs) feel.recoil = FIRE_FEEL.ternRecoilPx * (1 - age / FIRE_FEEL.ternRecoilMs);
    if (t.kind === 'frog') {
      if (age < FIRE_FEEL.frogSquashMs) {
        const k = Math.sin((age / FIRE_FEEL.frogSquashMs) * Math.PI);
        feel.squashX = 1 + (FIRE_FEEL.frogSquash[0] - 1) * k;
        feel.squashY = 1 + (FIRE_FEEL.frogSquash[1] - 1) * k;
      }
      if (t.tiers[1] >= 1 && age < 80) feel.tongue = Math.sin((age / 80) * Math.PI);
      if (t.tiers[1] >= 3 && age < 120) feel.throat = 1 + 0.3 * Math.sin((age / 120) * Math.PI);
    }
    if (t.kind === 'owl' && age < FIRE_FEEL.owlFlareMs) {
      const u = age / FIRE_FEEL.owlFlareMs;
      feel.flare = FIRE_FEEL.owlFlare[0] + (FIRE_FEEL.owlFlare[1] - FIRE_FEEL.owlFlare[0]) * u;
    }
  }

  return layer;
}

/** Quill 10×3 (Keel: --ink 12×5), lance 18×4 with a --l5 tassel, jet droplet with a wake. */
function drawDart(c: CanvasRenderingContext2D, p: Projectile, x: number, y: number, t: Tower | null): void {
  c.save();
  c.translate(x, y);
  c.rotate(p.angle);
  if (p.kind === 'lance') {
    c.fillStyle = P.heron;
    c.strokeStyle = P.inkSoft;
    c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(10, 0); c.lineTo(4, -2); c.lineTo(-8, -1.4); c.lineTo(-8, 1.4); c.lineTo(4, 2); c.closePath();
    c.fill(); c.stroke();
    c.strokeStyle = P.l5; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-8, 0); c.lineTo(-13, -2); c.moveTo(-8, 0); c.lineTo(-13, 2); c.stroke();
  } else if (p.kind === 'jet') {
    // Typhoon jet: a fat droplet with a water wake, so the 8-jet rosette reads against the Gale's quill fan
    c.globalAlpha = 0.55;
    c.strokeStyle = P.waterDeep; c.lineWidth = 3.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-18, 0); c.lineTo(-3, 0); c.stroke();
    c.globalAlpha = 1;
    c.fillStyle = p.slowPct > 0 ? light2(P.water) : P.water;
    c.strokeStyle = P.waterDeep; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(7, 0); c.quadraticCurveTo(1, -5.5, -4, 0); c.quadraticCurveTo(1, 5.5, 7, 0); c.fill(); c.stroke();
  } else {
    const keel = !!t && t.kind === 'tern' && t.tiers[1] >= 2;
    const L = keel ? 12 : 10, W = keel ? 5 : 3;
    // speed wake: a 14-px paper streak so 720 px/s quills read in motion
    c.globalAlpha = 0.5;
    c.strokeStyle = keel ? P.inkSoft : P.foldWhite;
    c.lineWidth = 1.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-L / 2, 0); c.lineTo(-L / 2 - 14, 0); c.stroke();
    c.globalAlpha = 1;
    c.fillStyle = keel ? P.ink : P.foldWhite;
    c.strokeStyle = P.ink;
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(L / 2, 0); c.lineTo(-L / 2, -W / 2); c.lineTo(-L / 2, W / 2); c.closePath();
    c.fill(); c.stroke();
  }
  c.restore();
}
const light2 = (c: string): string => mix(c, P.foldWhite, 0.4);

/** Stone: ground shadow + the stone raised on its arc (r 6, Wide Ripple r 8, boulder r 12, skip stones flat ellipses). */
function drawStone(c: CanvasRenderingContext2D, p: Projectile, x: number, y: number, alpha: number, t: Tower | null): void {
  const a = t ? t.tiers[0] : 0, b = t ? t.tiers[1] : 0;
  const r = a >= 3 ? 12 : a >= 1 ? 8 : 6;
  const tt = clamp01(p.t - (1 - alpha) / Math.max(1, p.arcTicks));
  const skip = p.hitCount > 0;
  const h = (skip ? 14 : 46) * 4 * tt * (1 - tt);
  const flat = b >= 2;
  c.save();
  c.globalAlpha = 0.22;
  c.fillStyle = P.ink;
  c.beginPath(); c.ellipse(x + 3, y + 4, r * (1 - h / 140), r * 0.6 * (1 - h / 140), 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  c.fillStyle = a >= 2 && a < 3 ? P.inkSoft : a >= 3 ? '#6B6656' : '#8E8A80';
  c.strokeStyle = P.ink;
  c.lineWidth = 1;
  c.beginPath();
  if (flat) c.ellipse(x, y - h, r * 1.2, r * 0.62, p.angle, 0, Math.PI * 2);
  else c.arc(x, y - h, r, 0, Math.PI * 2);
  c.fill(); c.stroke();
  c.globalAlpha = 0.5;
  c.fillStyle = P.foldWhite;
  c.beginPath(); c.arc(x - r * 0.35, y - h - r * 0.35, r * 0.28, 0, Math.PI * 2); c.fill();
  c.restore();
}
