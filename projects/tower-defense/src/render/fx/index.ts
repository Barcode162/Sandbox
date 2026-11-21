// Shared particles + rings with the §10.5 caps. FROZEN signature.
// Flecks and sparks live in a fixed 600-slot structure-of-arrays pool (hard cap). Requested flecks are cut
// by the live-particle tier (≤ 200 live: as requested · ≤ 600: a third, so 6 → 2 per pop · above: none),
// then halved under Reduce motion. Rings are NEVER culled (§16.5): their pool grows if a storm needs it.
// All timers run on real time (update(dtRealMs)), so 2× speed stays readable (§11 Speed).
import type { DrawPass, FleckShape, Fx, RenderFrame, WorldLayer } from '../../contracts/types';
import { PARTICLES, POP } from '../../data/feel';
import { P } from '../../data/palette';
import { createRng } from '../../sim/rng';

/**
 * A styled fleck burst for the few named moments whose flecks must read on paper or carry weight
 * (placement/sell, the boss death): own speed, size and life, an optional 1-px edge and the paper-scrap
 * shape. It still goes through the §10.5 tiers and the 600 hard cap.
 */
export interface FleckStyle {
  readonly speed: readonly [number, number];
  readonly size: readonly [number, number];
  readonly lifeMs: number;
  /** 1-px outline colour (null: none). */
  readonly edge: string | null;
  readonly shape: FleckShape | 'scrap';
  /** Start this far out along each fleck's own heading (e.g. a tower's rim), so it flies over open ground. */
  readonly fromR?: number;
}

export interface FxSystem extends Fx, WorldLayer {
  burst(x: number, y: number, count: number, color: string, style: FleckStyle): void;
}

/** Styled burst through any Fx: the FxSystem paints it; a bare Fx (test doubles) falls back to plain flecks. */
export function burst(fx: Fx, x: number, y: number, count: number, color: string, style: FleckStyle): void {
  const sys = fx as Partial<FxSystem>;
  if (typeof sys.burst === 'function') sys.burst(x, y, count, color, style);
  else fx.flecks(x, y, count, color, style.shape === 'circle' ? 'circle' : 'tri');
}

const CAP = PARTICLES.cap;
const SHAPE_TRI = 0, SHAPE_CIRCLE = 1, SHAPE_SPARK = 2, SHAPE_SCRAP = 3;
const SPARK_LIFE_MS = 180;

interface Ring { x: number; y: number; r0: number; r1: number; color: string; dur: number; age: number; width: number }

/** Fleck count after the §10.5 tier for `live` particles and Reduce motion (exported for tests). */
export function fleckBudget(requested: number, live: number, reduceMotion: boolean): number {
  const [lo, mid] = PARTICLES.tiers;
  let n = live < lo.below ? requested : live < mid.below ? Math.ceil((requested * mid.perPop) / lo.perPop) : PARTICLES.above;
  if (reduceMotion) n = Math.round(n * 0.5);
  return Math.max(0, Math.min(n, CAP - live));
}

const outCubic = (t: number): number => 1 - (1 - t) ** 3;

export function createFx(): FxSystem {
  const px = new Float32Array(CAP), py = new Float32Array(CAP), vx = new Float32Array(CAP), vy = new Float32Array(CAP);
  const life = new Float32Array(CAP), maxLife = new Float32Array(CAP), rot = new Float32Array(CAP), spin = new Float32Array(CAP), size = new Float32Array(CAP);
  const shape = new Uint8Array(CAP);
  const col: string[] = new Array<string>(CAP).fill(P.ink);
  /** 1-px outline per particle ('' = none). */
  const edge: string[] = new Array<string>(CAP).fill('');
  let live = 0;
  const rings: Ring[] = Array.from({ length: 256 }, () => ({ x: 0, y: 0, r0: 0, r1: 0, color: P.ink, dur: 1, age: 0, width: 2 }));
  let ringCount = 0;
  let reduceMotion = false;
  const rng = createRng(0xf1ec5);

  function add(x: number, y: number, speed: number, sz: number, lifeMs: number, sh: number, c: string, e = '', r0 = 0): void {
    if (live >= CAP) return;
    const i = live++;
    const a = rng.next() * Math.PI * 2;
    px[i] = x + Math.cos(a) * r0; py[i] = y + Math.sin(a) * r0; vx[i] = Math.cos(a) * speed; vy[i] = Math.sin(a) * speed;
    life[i] = lifeMs; maxLife[i] = lifeMs; rot[i] = a; spin[i] = (rng.next() * 2 - 1) * POP.fleckSpin; size[i] = sz;
    shape[i] = sh; col[i] = c; edge[i] = e;
  }

  function kill(i: number): void {
    const j = --live;
    if (i === j) return;
    px[i] = px[j]; py[i] = py[j]; vx[i] = vx[j]; vy[i] = vy[j]; life[i] = life[j]; maxLife[i] = maxLife[j];
    rot[i] = rot[j]; spin[i] = spin[j]; size[i] = size[j]; shape[i] = shape[j]; col[i] = col[j]; edge[i] = edge[j];
  }

  const fx: FxSystem = {
    get liveParticles() { return live; },
    ring(x, y, r0, r1, color, durMs, delayMs = 0, width = POP.ringWidth) {
      if (ringCount === rings.length) rings.push({ x: 0, y: 0, r0: 0, r1: 0, color, dur: 1, age: 0, width }); // never culled
      const r = rings[ringCount++];
      r.x = x; r.y = y; r.r0 = r0; r.r1 = r1; r.color = color; r.dur = Math.max(1, durMs); r.age = -delayMs; r.width = width;
    },
    flecks(x, y, count, color, sh: FleckShape = 'tri') {
      const n = fleckBudget(count, live, reduceMotion);
      const code = sh === 'circle' ? SHAPE_CIRCLE : SHAPE_TRI;
      const [s0, s1] = POP.fleckSpeed, [z0, z1] = POP.fleckSize;
      for (let k = 0; k < n; k++) add(x, y, s0 + rng.next() * (s1 - s0), z0 + rng.next() * (z1 - z0), POP.fleckLifeMs, code, color);
    },
    burst(x, y, count, color, st) {
      const n = fleckBudget(count, live, reduceMotion);
      const code = st.shape === 'circle' ? SHAPE_CIRCLE : st.shape === 'scrap' ? SHAPE_SCRAP : SHAPE_TRI;
      const [s0, s1] = st.speed, [z0, z1] = st.size;
      for (let k = 0; k < n; k++) add(x, y, s0 + rng.next() * (s1 - s0), z0 + rng.next() * (z1 - z0), st.lifeMs, code, color, st.edge ?? '', st.fromR ?? 0);
    },
    sparks(x, y, count) {
      // the immune "tink" signal (§6 rule 3): exempt from the tiers, still under the hard cap
      for (let k = 0; k < count; k++) add(x, y, 90 + rng.next() * 70, 4, SPARK_LIFE_MS, SHAPE_SPARK, P.foldWhite);
    },
    onSimEvent() { /* the blot and tower layers translate sim events into fx calls */ },
    update(dtRealMs) {
      const dt = Math.max(0, dtRealMs) / 1000;
      const drag = Math.exp(-POP.fleckDrag * dt);
      for (let i = live - 1; i >= 0; i--) {
        life[i] -= dtRealMs;
        if (life[i] <= 0) { kill(i); continue; }
        px[i] += vx[i] * dt; py[i] += vy[i] * dt;
        vx[i] *= drag; vy[i] *= drag;
        rot[i] += spin[i] * dt;
      }
      for (let i = ringCount - 1; i >= 0; i--) {
        const r = rings[i];
        r.age += dtRealMs;
        if (r.age >= r.dur) { const last = rings[--ringCount]; rings[ringCount] = r; rings[i] = last; }
      }
    },
    draw(f: RenderFrame, pass: DrawPass) {
      reduceMotion = f.settings.reduceMotion;
      const c = f.ctx;
      if (pass === 'particles') {
        c.save();
        for (let i = 0; i < live; i++) {
          const t = life[i] / maxLife[i];
          c.globalAlpha = Math.min(1, t * 1.6);
          const x = px[i], y = py[i], s = size[i];
          if (shape[i] === SHAPE_SPARK) {
            c.strokeStyle = col[i]; c.lineWidth = 1.6; c.lineCap = 'round';
            const l = s * (0.6 + t);
            c.beginPath(); c.moveTo(x - (vx[i] / 160) * l, y - (vy[i] / 160) * l); c.lineTo(x, y); c.stroke();
            continue;
          }
          c.fillStyle = col[i];
          c.beginPath();
          if (shape[i] === SHAPE_CIRCLE) c.arc(x, y, s * 0.5, 0, Math.PI * 2);
          else if (shape[i] === SHAPE_SCRAP) {
            // a torn paper scrap: an uneven quad, s wide and 0.7 s tall, turning as it flies
            const a = rot[i], ca = Math.cos(a), sa = Math.sin(a), hw = s * 0.5, hh = s * 0.35;
            c.moveTo(x - ca * hw + sa * hh, y - sa * hw - ca * hh);
            c.lineTo(x + ca * hw * 0.8 + sa * hh, y + sa * hw * 0.8 - ca * hh);
            c.lineTo(x + ca * hw - sa * hh * 0.7, y + sa * hw + ca * hh * 0.7);
            c.lineTo(x - ca * hw * 0.9 - sa * hh, y - sa * hw * 0.9 + ca * hh);
            c.closePath();
          } else {
            const a = rot[i];
            for (let v = 0; v < 3; v++) {
              const th = a + (v * Math.PI * 2) / 3;
              const vxp = x + Math.cos(th) * s * 0.6, vyp = y + Math.sin(th) * s * 0.6;
              if (v) c.lineTo(vxp, vyp); else c.moveTo(vxp, vyp);
            }
            c.closePath();
          }
          c.fill();
          if (edge[i] !== '') { c.strokeStyle = edge[i]; c.lineWidth = 1; c.stroke(); }
        }
        c.restore();
      } else if (pass === 'rings') {
        c.save();
        for (let i = 0; i < ringCount; i++) {
          const r = rings[i];
          if (r.age < 0) continue;
          const t = r.age / r.dur;
          c.globalAlpha = 1 - t;
          c.strokeStyle = r.color;
          c.lineWidth = r.width;
          c.beginPath();
          c.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * outCubic(t), 0, Math.PI * 2);
          c.stroke();
        }
        c.restore();
      }
    },
    reset() { live = 0; ringCount = 0; },
  };
  return fx;
}

