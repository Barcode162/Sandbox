// Origami tower sprites (WO-003, §7): 4 silhouettes × all 12 valid tier combos; every tier visibly changes the
// paper (§16.10). Local frame: forward = +x, units = logical px at scale 1. Light from the top-left; the hard
// shadow is the union silhouette offset (+3,+4) in screen space, no blur (§4, §16.15).
import type { TowerKind } from '../../contracts/types';
import { P, SHADOW_OFFSET } from '../../data/palette';
import { FOOTPRINT } from '../../data/map';
import { circle, curve, ellipse, light, line, mix, OUTLINE, poly, shade, type Pen } from './paint';

/** Transient fire / place feel applied on top of the static sprite (§11 Fire, §10.4 Buy). */
export interface SpriteFeel {
  /** Tern: px pushed back along −forward (recoil 2 px / 60 ms). */
  recoil: number;
  /** Frog: squash scale along forward / across (0.9 / 1.1 over 100 ms). */
  squashX: number;
  squashY: number;
  /** Owl: eye flare radius (6 → 9 over 90 ms); 0 = none. */
  flare: number;
  /** Frog B1: tongue extension 0..1 (10 px for 80 ms). */
  tongue: number;
  /** Frog B3: throat inflation 1..1.3 (120 ms). */
  throat: number;
}
export const NO_FEEL: Readonly<SpriteFeel> = { recoil: 0, squashX: 1, squashY: 1, flare: 0, tongue: 0, throat: 1 };

export interface DrawSpec {
  angle: number;
  scale: number;
  alpha: number;
  nowMs: number;
  coaster: boolean;
}

/** Coaster radius = fr + 4 (§7). */
export const coasterRadius = (kind: TowerKind): number => FOOTPRINT[kind] + 4;

const TAU = Math.PI * 2;

/** Draw one sprite. `tiers` = [A, B]. */
export function paintTower(ctx: CanvasRenderingContext2D, kind: TowerKind, tiers: readonly [number, number], x: number, y: number, o: DrawSpec, feel: Readonly<SpriteFeel>): void {
  const a = tiers[0] | 0, b = tiers[1] | 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(o.scale, o.scale);
  ctx.globalAlpha *= o.alpha;
  const R = coasterRadius(kind);
  if (o.coaster) drawCoaster(ctx, R, a, b);
  const pen: Pen = { ctx, shadow: true };
  // hard shadow: union silhouette, screen-space offset, filled once
  ctx.save();
  ctx.translate(SHADOW_OFFSET.x, SHADOW_OFFSET.y);
  ctx.beginPath();
  body(pen, kind, a, b, o, feel);
  ctx.fillStyle = P.shadow;
  ctx.fill();
  ctx.restore();
  pen.shadow = false;
  body(pen, kind, a, b, o, feel);
  ctx.restore();
}

function body(pen: Pen, kind: TowerKind, a: number, b: number, o: DrawSpec, feel: Readonly<SpriteFeel>): void {
  switch (kind) {
    case 'tern': return tern(pen, a, b, o, feel);
    case 'frog': return frog(pen, a, b, o, feel);
    case 'koi': return koi(pen, a, b, o);
    case 'owl': return owl(pen, a, b, o, feel);
  }
}

/** Coaster disc r fr+4 in --paper-deep with a crease ring and tier notches: A left arcs, B right (§7 markers). */
function drawCoaster(ctx: CanvasRenderingContext2D, R: number, a: number, b: number): void {
  ctx.beginPath();
  ctx.arc(SHADOW_OFFSET.x, SHADOW_OFFSET.y, R, 0, TAU);
  ctx.fillStyle = P.shadow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, TAU);
  ctx.fillStyle = P.paperDeep;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = P.kraftEdge;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, R - 3.5, 0, TAU);
  ctx.strokeStyle = mix(P.paperDeep, P.foldWhite, 0.45);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // notches: three slots per side; owned = bold --ink arc, open = faint tick
  for (let side = 0; side < 2; side++) {
    const owned = side === 0 ? a : b;
    const mid = side === 0 ? Math.PI : 0;
    for (let k = 0; k < 3; k++) {
      // tier 1 at the top of each side, going down
      const c = side === 0 ? mid + (k - 1) * 0.52 : mid - (k - 1) * 0.52;
      ctx.beginPath();
      ctx.arc(0, 0, R - 2, c - 0.21, c + 0.21);
      if (k < owned) {
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = mix(P.paperDeep, P.ink, 0.25);
        ctx.lineWidth = 1;
      }
      ctx.lineCap = 'butt';
      ctx.stroke();
    }
  }
}

/** Shared feature: rotate into the facing frame for the body. */
function facing(pen: Pen, angle: number): void {
  pen.ctx.rotate(angle);
}

// ───────────────────────────── Tern ─────────────────────────────
function tern(pen: Pen, a: number, b: number, o: DrawSpec, feel: Readonly<SpriteFeel>): void {
  const c = pen.ctx;
  c.save();
  facing(pen, o.angle);
  c.translate(-feel.recoil, 0);
  const heron = b === 3;
  const gale = a === 3;
  const col = heron ? P.heron : gale ? P.galeBody : P.foldWhite;
  const dark = shade(col, heron ? 0.2 : 0.13);
  const t = o.nowMs / 1000;

  if (heron) {
    // legs trail behind (2 strokes with a toe fork)
    for (const s of [-1, 1]) {
      line(pen, [-10, s * 3, -27, s * 5], P.inkSoft, 1.6, true);
      line(pen, [-27, s * 5, -31, s * 3, -27, s * 5, -31, s * 7], P.inkSoft, 1.1);
    }
    // broad rounded wings, span 44
    for (const s of [-1, 1]) {
      const w = [5, s * 4, 2, s * 14, -4, s * 22, -10, s * 20, -13, s * 12, -9, s * 4];
      poly(pen, w, s < 0 ? col : dark);
      line(pen, [1, s * 5, -6, s * 19], shade(col, 0.32), 0.9);
      line(pen, [-4, s * 5, -10, s * 17], shade(col, 0.32), 0.7);
      if (a >= 1) poly(pen, [-1.5, s * 17, -4, s * 22, -10, s * 20, -12, s * 15], P.l5, OUTLINE, 0.8);
    }
    // body ellipse + neck (+14 px) + head + long beak
    ellipse(pen, -2, 0, 13, 6.5, 0, col);
    if (!pen.shadow) { c.beginPath(); c.ellipse(-2, 0, 13, 6.5, 0, 0, Math.PI); c.fillStyle = dark; c.fill(); }
    line(pen, [8, 0, 22, 0], col, 4.5, true);
    line(pen, [8, 1.2, 22, 1.2], dark, 1.6);
    circle(pen, 24, 0, 4.2, col);
    const beak = 9 + (b >= 1 ? 8 : 0);
    poly(pen, [27, -1.6, 27 + beak, 0, 27, 1.6], P.gold, OUTLINE, 0.8);
    circle(pen, 25, -1.8, 0.9, P.ink, null);
    if (b >= 2) crest(pen, 22, 1.15);
    c.restore();
    return;
  }

  // tail
  if (gale) {
    for (const s of [-1, 1]) poly(pen, [-9, 0, -21, s * 7, -16, s * 1], s < 0 ? col : dark);
    // 3 ribbon streamers, 12 px, flutter 6 Hz
    for (let k = -1; k <= 1; k++) {
      const ph = t * TAU * 6 + k * 1.3;
      const y0 = k * 3.5;
      const w = o.nowMs ? Math.sin(ph) * 2.2 : (k === 0 ? 1.5 : -1.5 * k);
      curve(pen, -15, y0, -21, y0 + w, -27, y0 + k * 2 - w * 0.6, k === 0 ? P.gold : P.l5, 2.4);
    }
  } else {
    poly(pen, [-9, 0, -17, -4.5, -15, 0, -17, 4.5], dark);
  }
  // A2: a second, smaller wing pair behind the first
  if (a >= 2) {
    for (const s of [-1, 1]) {
      poly(pen, [-3, s * 3, -12, s * 15, -9, s * 3], s < 0 ? light(col, 0.1) : shade(col, 0.2));
      if (a >= 2) line(pen, [-4, s * 3.5, -11, s * 13], shade(col, 0.3), 0.7);
    }
  }
  // main swept wings, span 40, two facets each
  for (const s of [-1, 1]) {
    poly(pen, [5, s * 3, -6, s * 20, -5, s * 3], s < 0 ? col : dark);
    poly(pen, [5, s * 3, -6, s * 20, 0, s * 3], s < 0 ? light(col, 0.4) : shade(col, 0.06), null, 0);
    line(pen, [0, s * 3, -6, s * 20], shade(col, 0.3), 0.8);
    // A1: --l5 crease stripe on both wingtips
    if (a >= 1) poly(pen, [5 - 11 * 0.42, s * (3 + 17 * 0.42), -6, s * 20, -5 - 0.42, s * (3 + 17 * 0.42)], P.l5, OUTLINE, 0.8);
  }
  // kite body 14×22, upper facet light, lower facet shaded
  poly(pen, [11, 0, 1, -7, -11, 0, 1, 7], col);
  poly(pen, [11, 0, -11, 0, 1, 7], dark, null, 0);
  line(pen, [11, 0, -11, 0], shade(col, 0.32), 0.8);
  // beak (+8 px at B1)
  const beak = 4 + (b >= 1 ? 8 : 0);
  poly(pen, [10, -2.2, 10 + beak + 1, 0, 10, 2.2], P.gold, OUTLINE, 0.8);
  if (b >= 1) line(pen, [11, 0, 10 + beak, 0], shade(P.gold, 0.3), 0.6);
  circle(pen, 6, -2.6, 1.1, P.ink, null);
  if (b >= 2) crest(pen, 6, 1);
  c.restore();
}

/** Tern B2: 3-triangle head crest in --ink-soft fanning back from the head. */
function crest(pen: Pen, x: number, k: number): void {
  for (let i = -1; i <= 1; i++) {
    poly(pen, [x + 2 * k, i * 1.6, x - 11 * k, i * 7.5 - 2.4, x - 8 * k, i * 7.5 + 2.4], i === 0 ? P.ink : P.inkSoft, OUTLINE, 0.6);
  }
}

// ───────────────────────────── Pondfrog ─────────────────────────────
function frog(pen: Pen, a: number, b: number, o: DrawSpec, feel: Readonly<SpriteFeel>): void {
  const c = pen.ctx;
  c.save();
  facing(pen, o.angle);
  c.scale(feel.squashX, feel.squashY);
  const toad = a === 3;
  const col = toad ? P.toad : P.moss;
  const dark = shade(col, 0.18);
  const deep = toad ? shade(P.toad, 0.38) : P.mossDeep;
  const k = toad ? 1.27 : 1; // toad 38×30 vs frog 30×26

  // folded hind legs
  for (const s of [-1, 1]) {
    poly(pen, [-5 * k, s * 10 * k, -18 * k, s * 17 * k, -15 * k, s * 6 * k], s < 0 ? light(deep, 0.2) : deep);
    line(pen, [-7 * k, s * 9 * k, -16 * k, s * 15 * k], shade(deep, 0.3), 0.8);
    poly(pen, [-17 * k, s * 16 * k, -21 * k, s * 19 * k, -15 * k, s * 19 * k], deep, OUTLINE, 0.6);
    // front feet
    poly(pen, [9 * k, s * 9 * k, 13 * k, s * 14 * k, 6 * k, s * 13 * k], deep, OUTLINE, 0.7);
  }
  // B2: two flat skip stones held under the front feet
  if (b >= 2) {
    for (const s of [-1, 1]) {
      ellipse(pen, 10 * k, s * 16 * k, 5.5, 2.8, 0.25 * s, '#8E8A80');
      ellipse(pen, 9.4 * k, s * 15.4 * k, 3, 1.1, 0.25 * s, '#B9B4A8', null);
    }
  }
  if (toad) {
    // lumpy toad body 38×30
    const pts: number[] = [];
    for (let i = 0; i < 14; i++) {
      const th = (i / 14) * TAU;
      const r = 1 + 0.06 * Math.sin(i * 2.7 + 1);
      pts.push(Math.cos(th) * 19 * r, Math.sin(th) * 15 * r);
    }
    poly(pen, pts, col);
    if (!pen.shadow) { c.beginPath(); c.ellipse(0, 0, 19, 15, 0, 0, Math.PI); c.fillStyle = dark; c.fill(); }
    // 9 wart dots
    const warts = [-10, -5, -4, 6, -12, 3, 2, -8, 3, 8, -6, -10, 8, -3, -14, -2, 0, 0];
    for (let i = 0; i < warts.length; i += 2) circle(pen, warts[i], warts[i + 1], 1.9, shade(P.toad, 0.4), null);
  } else {
    // squat pentagon 30×26, two facets
    poly(pen, [15, -9, 15, 9, -2, 13, -15, 0, -2, -13], col);
    poly(pen, [15, 0, 15, 9, -2, 13, -15, 0], dark, null, 0);
    line(pen, [15, 0, -15, 0], shade(col, 0.3), 0.8);
    line(pen, [-2, -13, 2, 0, -2, 13], shade(col, 0.25), 0.7);
  }
  // A2: three --moss-deep back spots (the toad's warts replace them)
  if (a === 2) {
    for (const [x, y] of [[-2, -6], [-8, 3.5], [4, 4.5]] as const) circle(pen, x, y, 4, P.mossDeep, null);
  }
  // B3: three dark chevrons down the back
  if (b >= 3) {
    for (let i = 0; i < 3; i++) {
      const x = 5 - i * 6.5;
      line(pen, [x - 5, -6, x, 0, x - 5, 6], shade(deep, 0.35), 2.4);
    }
  }
  // A1: throat sac disc r 6 (inflates on each B3 shot)
  const sacR = (a >= 1 ? 6 : b >= 3 ? 4 : 0) * feel.throat;
  if (sacR > 0) circle(pen, 15 * k, 0, sacR, mix(col, P.foldWhite, 0.62));
  // eyes r 4 (toad r 5 with brow ridges)
  const er = toad ? 5 : 4;
  for (const s of [-1, 1]) {
    if (toad) poly(pen, [6, s * 13, 16, s * 11, 15, s * 7, 7, s * 7], shade(P.toad, 0.25), null, 0);
    circle(pen, 11 * k, s * 7 * k, er, P.foldWhite);
    circle(pen, 12.4 * k, s * 7 * k, er * 0.48, P.ink, null);
  }
  // B1: --l5 tongue tip at the mouth; flicks out 10 px on each shot
  if (b >= 1) {
    const ext = 3 + feel.tongue * 10;
    const x0 = (a >= 1 ? 15 + 6 : 15) * k;
    line(pen, [x0 - 2, 0, x0 + ext, 0], P.l5, 2.6);
    circle(pen, x0 + ext, 0, 1.9, P.l5, null);
  }
  c.restore();
}

// ───────────────────────────── Mist Koi ─────────────────────────────
function koi(pen: Pen, a: number, b: number, o: DrawSpec): void {
  const c = pen.ctx;
  const typhoon = b === 3;
  const glacier = a === 3;
  const t = o.nowMs / 1000;
  // the puddle sits on the coaster (screen space)
  if (!pen.shadow) {
    ellipse(pen, 0, 0, 20, 19, 0.3, P.water, P.waterDeep, 1);
    curve(pen, -12, 8, -2, 14, 10, 9, light(P.water, 0.5), 1.2);
    // A2: six ice-crystal ticks around the puddle
    if (a >= 2) {
      for (let i = 0; i < 6; i++) {
        const th = (i / 6) * TAU + 0.5;
        const x = Math.cos(th) * 18.5, y = Math.sin(th) * 18.5;
        for (let j = 0; j < 3; j++) {
          const q = th + (j * Math.PI) / 3;
          line(pen, [x - Math.cos(q) * 4, y - Math.sin(q) * 4, x + Math.cos(q) * 4, y + Math.sin(q) * 4], j === 0 ? P.foldWhite : light(P.waterDeep, 0.3), 1.8);
        }
      }
    }
  }
  c.save();
  const period = b >= 1 ? 1 : 2;
  const sway = o.nowMs ? Math.sin((t / period) * TAU) * (6 * Math.PI / 180) : 0;
  facing(pen, o.angle + sway);
  if (typhoon) c.scale(1.25, 1.25);
  const col = typhoon ? P.typhoonScale : glacier ? P.glacier : P.foldWhite;
  const dark = shade(col, typhoon ? 0.22 : 0.12);
  const fin = a >= 1 ? P.water : light(P.paperShade, 0.3);

  // tail fins (doubled at B1)
  const tails = b >= 1 ? 2 : 1;
  for (let i = 0; i < tails; i++) {
    const x = -13 - i * 6;
    if (glacier) {
      for (const s of [-1, 1]) poly(pen, [x, 0, x - 8, s * 10, x - 12, s * 6, x - 6, s * 1], s < 0 ? light(P.water, 0.4) : P.water, P.waterDeep, 0.9);
    } else {
      poly(pen, [x + 1, 0, x - 12, -11, x - 7, 0, x - 12, 11], i ? shade(fin, 0.08) : fin);
      line(pen, [x - 1, 0, x - 9, -6], shade(fin, 0.25), 0.6);
      line(pen, [x - 1, 0, x - 9, 6], shade(fin, 0.25), 0.6);
    }
  }
  // pectoral fins
  for (const s of [-1, 1]) {
    if (glacier) poly(pen, [9, s * 7, 4, s * 16, -1, s * 14, 1, s * 7], s < 0 ? light(P.water, 0.5) : P.water, P.waterDeep, 0.9);
    else poly(pen, [10, s * 7, 3, s * 18, -2, s * 16, -1, s * 7], fin);
  }
  if (typhoon) {
    // dragon ridge spikes along the spine
    for (let i = 0; i < 4; i++) poly(pen, [10 - i * 7, -1.5, 6 - i * 7, -7.5, 4 - i * 7, -1.5], shade(P.typhoonScale, 0.35), OUTLINE, 0.6);
  }
  // windsock body 46×20 tapering to the tail
  poly(pen, [21, -10, 21, 10, 6, 9, -14, 4.5, -14, -4.5, 6, -9], col);
  poly(pen, [21, 0, 21, 10, 6, 9, -14, 4.5, -14, 0], dark, null, 0);
  if (!pen.shadow) {
    if (glacier) {
      // faceted crystal body lines
      line(pen, [21, -10, 6, 0, 21, 10], light(P.waterDeep, 0.2), 0.9);
      line(pen, [6, -9, -4, 0, 6, 9], light(P.waterDeep, 0.2), 0.9);
      line(pen, [-4, 0, -14, 0], light(P.waterDeep, 0.2), 0.9);
      poly(pen, [14, -6, 9, -3, 12, 1], P.water, null, 0);
      poly(pen, [0, 2, -6, 4, -3, -1], P.water, null, 0);
    } else if (typhoon) {
      // scale grid
      for (let i = 0; i < 4; i++) for (let j = -1; j <= 1; j++) {
        const x = 14 - i * 6, y = j * 4.2 + (i % 2) * 2;
        c.beginPath(); c.arc(x, y, 2.6, Math.PI * 0.5, Math.PI * 1.5); c.strokeStyle = shade(P.typhoonScale, 0.4); c.lineWidth = 0.8; c.stroke();
      }
    } else {
      // #E06A3B patches and 3 scale arcs
      ellipse(pen, 11, -4, 5, 3.2, 0.3, P.koiPatch, null);
      ellipse(pen, -3, 3, 4.5, 2.6, -0.2, P.koiPatch, null);
      ellipse(pen, -10, -1.5, 2.4, 1.6, 0, P.koiPatch, null);
      for (const x of [14, 5, -4]) {
        c.beginPath(); c.arc(x, 0, 4.5, Math.PI * 0.6, Math.PI * 1.4); c.strokeStyle = OUTLINE; c.lineWidth = 0.8; c.stroke();
      }
    }
  }
  // open mouth ring
  ellipse(pen, 21, 0, 3, 10, 0, light(col, 0.4));
  ellipse(pen, 21.5, 0, 1.6, 7, 0, shade(P.waterDeep, 0.3), null);
  if (typhoon) {
    // 2 long whisker curves
    for (const s of [-1, 1]) curve(pen, 22, s * 7, 30, s * 18, 14, s * 24, P.inkSoft, 1.3);
  }
  // eyes
  for (const s of [-1, 1]) circle(pen, 16, s * 6.5, 1.5, P.ink, null);
  c.restore();

  if (typhoon && !pen.shadow) {
    // a spinning ring of 8 droplets (screen space)
    const spin = t * TAU * 0.25;
    for (let i = 0; i < 8; i++) {
      const th = spin + (i / 8) * TAU;
      const x = Math.cos(th) * 26, y = Math.sin(th) * 26;
      c.save();
      c.translate(x, y);
      c.rotate(th + Math.PI / 2);
      poly(pen, [0, -4.5, 3, 1, 0, 3.5, -3, 1], P.water, P.waterDeep, 0.9);
      c.restore();
    }
  }
  // B2: a 3-circle paper cloud above it with 4 falling streaks
  if (b === 2) {
    const ox = -2, oy = -26;
    if (!pen.shadow) {
      for (let i = 0; i < 4; i++) {
        const fall = o.nowMs ? ((t * 1.6 + i * 0.27) % 1) * 6 : (i % 2) * 3;
        const x = ox - 7 + i * 4.6;
        line(pen, [x, oy + 6 + fall, x - 1.2, oy + 12 + fall], P.waterDeep, 1.4);
      }
    }
    circle(pen, ox - 7, oy + 1, 5.5, P.foldWhite);
    circle(pen, ox + 7, oy + 1.5, 5, P.foldWhite);
    circle(pen, ox, oy - 2.5, 7, P.foldWhite);
    if (!pen.shadow) poly(pen, [ox - 12, oy + 3, ox + 12, oy + 3, ox + 10, oy + 6, ox - 10, oy + 6], P.paperShade, null, 0);
  }
}

// ───────────────────────────── Lantern Owl ─────────────────────────────
function owl(pen: Pen, a: number, b: number, o: DrawSpec, feel: Readonly<SpriteFeel>): void {
  const c = pen.ctx;
  const eclipse = a === 3;
  const beacon = b === 3;
  const t = o.nowMs / 1000;
  c.save();
  facing(pen, o.angle);
  const col = eclipse ? P.eclipse : P.owlKraft;
  const dark = shade(col, 0.2);
  const lite = light(col, eclipse ? 0.18 : 0.25);

  // ear tufts (+6 px at A2); horned owl gets long curved horns
  const tuft = 6 + (a >= 2 ? 6 : 0);
  for (const s of [-1, 1]) {
    if (eclipse) {
      poly(pen, [12, s * 10, 14, s * 17, 22, s * 22, 30, s * 21, 21, s * 17, 15, s * 11], s < 0 ? lite : dark);
    } else {
      poly(pen, [12, s * 7, 12, s * 17, 13 + tuft, s * (18 + tuft * 0.4)], s < 0 ? lite : dark);
    }
  }
  // kraft block 30×34 with chamfered corners; back facets and folded-wing creases
  poly(pen, [15, -14, 12, -17, -12, -17, -15, -14, -15, 14, -12, 17, 12, 17, 15, 14], col);
  poly(pen, [15, 0, 15, 14, 12, 17, -12, 17, -15, 14, -15, 0], dark, null, 0);
  line(pen, [0, -17, -15, -4], shade(col, 0.35), 0.8);
  line(pen, [0, 17, -15, 4], shade(col, 0.35), 0.8);
  line(pen, [-6, -17, -15, -10], shade(col, 0.35), 0.7);
  line(pen, [-6, 17, -15, 10], shade(col, 0.35), 0.7);
  // facial disc
  if (!pen.shadow) poly(pen, [15, -14, 4, -15, 1, 0, 4, 15, 15, 14], light(col, 0.12), null, 0);
  // eyes r 6 --glow (gold for Eclipse), pupils lean forward toward the target
  const flare = feel.flare;
  for (const s of [-1, 1]) {
    if (flare > 0 && !pen.shadow) {
      c.beginPath(); c.arc(8, s * 7, flare, 0, TAU); c.fillStyle = 'rgba(255,214,107,0.55)'; c.fill();
    }
    circle(pen, 8, s * 7, 6, eclipse ? P.gold : P.glow);
    if (a >= 1) circle(pen, 8, s * 7, 6.4, null, P.owlAmber, 2.2);
    circle(pen, 10, s * 7, 2.6, P.ink, null);
    circle(pen, 10.8, s * 7 - 1, 0.8, P.foldWhite, null);
  }
  if (eclipse && !pen.shadow) {
    // crescent monocle on the right eye + a chain
    c.beginPath(); c.arc(8, 7, 8.6, -1.2, 2.2); c.arc(8.8, 7, 6.8, 2.2, -1.2, true); c.closePath();
    c.fillStyle = P.gold; c.fill(); c.strokeStyle = OUTLINE; c.lineWidth = 0.7; c.stroke();
    curve(pen, 4, 14, -3, 15, -8, 11, P.gold, 0.9);
  }
  // beak
  poly(pen, [14, -2.5, 19, 0, 14, 2.5], eclipse ? P.gold : P.kraftEdge, OUTLINE, 0.8);

  // B1/B2: a paper lantern hangs from the beak (larger with 2 tassels at B2)
  if (b >= 1 && !beacon) lanternOnBeak(pen, b >= 2);
  c.restore();

  // B3: a tall floating lantern above the owl with 8 rays rotating 6°/s (screen space)
  if (beacon) {
    const ly = -30;
    if (!pen.shadow) {
      const rot = t * (6 * Math.PI / 180);
      c.beginPath(); c.arc(0, ly, 18, 0, TAU); c.fillStyle = 'rgba(255,214,107,0.28)'; c.fill();
      for (let i = 0; i < 8; i++) {
        const th = rot + (i / 8) * TAU;
        line(pen, [Math.cos(th) * 12, ly + Math.sin(th) * 14, Math.cos(th) * 19, ly + Math.sin(th) * 21], P.glow, 2.4);
      }
      line(pen, [0, ly + 11, 0, -12], P.inkSoft, 0.8);
    }
    paperLantern(pen, 0, ly, 7.5, 10.5);
  }
}

function lanternOnBeak(pen: Pen, big: boolean): void {
  const x = big ? 30 : 27;
  const w = big ? 6 : 4.2, h = big ? 8 : 5.6;
  line(pen, [19, 0, x - w, 0], P.inkSoft, 0.9);
  if (!pen.shadow) {
    pen.ctx.beginPath(); pen.ctx.arc(x, 0, big ? 13 : 10, 0, TAU); pen.ctx.fillStyle = 'rgba(255,214,107,0.3)'; pen.ctx.fill();
  }
  // the lantern hangs "down" the facing axis; drawn in the facing frame so it swings with the head
  pen.ctx.save();
  pen.ctx.translate(x, 0);
  pen.ctx.rotate(Math.PI / 2);
  paperLantern(pen, 0, 0, h * 0.75, w * 1.1);
  if (big) {
    for (const s of [-1, 1]) {
      line(pen, [s * 2.5, w, s * 3.5, w + 6], P.l5, 1.3);
      circle(pen, s * 3.5, w + 7, 1.4, P.l5, null);
    }
  }
  pen.ctx.restore();
}

/** Ribbed paper lantern: --glow body, --kraft-edge caps. */
function paperLantern(pen: Pen, x: number, y: number, rx: number, ry: number): void {
  ellipse(pen, x, y, rx, ry, 0, P.glow, P.kraftEdge, 1);
  if (!pen.shadow) {
    for (const f of [-0.5, 0, 0.5]) {
      pen.ctx.beginPath();
      pen.ctx.ellipse(x, y, Math.max(0.5, rx * Math.abs(f) * 1.6), ry, 0, 0, TAU);
      pen.ctx.strokeStyle = mix(P.glow, P.kraftEdge, 0.55);
      pen.ctx.lineWidth = 0.6;
      pen.ctx.stroke();
    }
  }
  poly(pen, [x - rx * 0.6, y - ry - 1.6, x + rx * 0.6, y - ry - 1.6, x + rx * 0.6, y - ry + 1, x - rx * 0.6, y - ry + 1], P.kraftEdge, null, 0);
  poly(pen, [x - rx * 0.6, y + ry - 1, x + rx * 0.6, y + ry - 1, x + rx * 0.6, y + ry + 1.6, x - rx * 0.6, y + ry + 1.6], P.kraftEdge, null, 0);
}
