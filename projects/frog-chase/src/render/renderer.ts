/**
 * Canvas 2D renderer (§4.6 camera, §5 look, §6 juice, §7 frames). OWNER: WO-003.
 * Reads SimState + ViewState; never mutates the sim. Hit-stop and shake are render-only (§6).
 *
 * Clocks: `rt` real presentation ms (always advances), `jt` juice ms (paused during hit-stop, so a freeze
 * holds every animation), `at` ambient seconds (50% under reduced motion), `tt` tell seconds (full speed).
 * A test probe (`canvas.__lilyRender`, RenderProbe) exposes what was drawn; it is mutated in place.
 */
import type { Pad, Renderer, SimEvent, SimState, Slot, Vec2, ViewState } from '../contracts';
import { heartbeatPhase } from '../sim/sim';
import { createCamera, createView, stepCamera, sx, sy, updateView, winGoal, wx, wy, DANGER_ZOOM } from './camera';
import { advancePresentation } from './clock';
import { bottomBandAlpha, eyeScale, jawRad, vignetteAlpha } from './danger';
import { DIM_AHEAD, DIM_BEHIND, SHADOW, rgba } from './color';
import { VISUAL_CUES, cueImpulse } from './cues';
import { buildPadShapes, createHeadLook, drawBubble, drawChip, drawFrog, drawGatorBody, drawGatorHead, drawPad, drawPadShadow, drawScutes, type ChipGlyph, type PadShapes } from './draw';
import { EASE_POP, EASE_UI, clamp01, lerp, remap, smooth } from './ease';
import { HitStop, PK, Particles, Ripples, Shake } from './juice';
import { Life } from './life';
import { rand3 } from './noise';
import { PALETTE } from './palette';
import { bubbleAt, createFrogPose, createPadLook, forwardChoice, frogPose, padLook, padSwayX, type Bubble } from './pose';
import { makeGrain, makeHalftone } from './textures';
import { collectReeds, drawBankDetail, drawBanks, drawDecor, drawLog, drawReeds, onBank, type Bounds, type ReedClump } from './world';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export type Quality = 'high' | 'low';

/** What the last drawn frame showed. Read by e2e tests through `canvas.__lilyRender`. */
export interface RenderProbe {
  frames: number;
  drawnFrames: number;
  hitStop: boolean;
  hitStops: number;
  quality: Quality;
  frameP95: number;
  frogStage: string;
  frogAcross: number;
  frogAlong: number;
  frogScale: number;
  frogH: number;
  frogLegs: number;
  /** Gator head centre in client px (as drawn). */
  headX: number;
  headY: number;
  /** Frog centre in client px. */
  frogX: number;
  frogY: number;
  camY: number;
  zoom: number;
  shake: number;
  tau: number;
  vignette: number;
  eyeScale: number;
  jawDeg: number;
  /** Frames on which the near-miss tooth flash was drawn (polish 15: exactly 1 per near-miss). */
  toothFlashFrames: number;
  gatorVisible: boolean;
  flankJaws: boolean;
  traceProgress: number;
  inviteRing: boolean;
  chips: number;
  pressedChipInverted: boolean;
  cues: Record<string, number>;
  /** Frames on which a dragonfly came within 2 wu of a reachable pad's rim (F-009: expect 0). */
  flyOverChoice: number;
  /** Landing droplets that came down on the pad instead of the water (polish 10, F-010: expect 0). */
  dropletsOnPad: number;
  droplets: number;
  /** Near-miss: gap (wu) from the snout tip to the frog's shadow centre on the flash frame (F-013: ≥ 0.3P). */
  clackGap: number;
  /** Renderer.pickPad, for tests that cannot synthesise a tap at an exact point. */
  pick: (x: number, y: number) => number | null;
}

declare global {
  interface HTMLCanvasElement {
    __lilyRender?: RenderProbe;
  }
}

/** Hinge → snout tip of the head, wu (draw.ts SNOUT plus the rounded tip). */
const SNOUT_TIP = 10.5;
const lerpAngle = (a: number, b: number, t: number): number => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
const DASH = [3, 3];
const NO_DASH: number[] = [];

function qualityOverride(): Quality | null {
  try {
    const q = new URLSearchParams(location.search).get('quality');
    return q === 'low' || q === 'high' ? q : null;
  } catch {
    return null;
  }
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D unavailable');
  let w = 1, h = 1, dpr = 1;
  let resized = true;

  // Textures (built once; the low tier gets its own cheaper tiles, built on demand).
  const waterHi = ctx.createPattern(makeHalftone(512, 4, true), 'repeat')!;
  const dotsHi = ctx.createPattern(makeHalftone(512, 4), 'repeat')!;
  let waterLo: CanvasPattern | null = null;
  let dotsLo: CanvasPattern | null = null;
  const patGrain = ctx.createPattern(makeGrain(256), 'repeat')!;
  const patMatrix = new DOMMatrix();
  let vignette: CanvasGradient | null = null;

  const forced = qualityOverride();
  let quality: Quality = forced ?? 'high';
  const costs = new Float32Array(120);
  const sorted = new Float32Array(120);
  let costN = 0;

  const camera = createCamera();
  const view = createView();
  const shake = new Shake();
  const shakeOff = { x: 0, y: 0 };
  const hitStop = new HitStop();
  const particles = new Particles(320);
  const ripples = new Ripples(48);
  const life = new Life(1);
  const reeds: ReedClump[] = [];
  const bounds: Bounds = { xL: 0, xR: 100, yB: 0, yT: 150 };
  const pose = createFrogPose();
  const look = createPadLook();
  const head = createHeadLook();
  const flankHead = createHeadLook();
  const bub: Bubble = { angle: 0, dist: 0, rise: 0, scale: 0, pop: 0 };
  const tmp: Vec2 = { x: 0, y: 0 };
  const tmp2: Vec2 = { x: 0, y: 0 };
  let body = new Float32Array(2 * 12);
  const choiceIds = [0, 0, 0], choiceR = [0, 0, 0];

  // Clocks.
  let rt = 0, jt = 0, at = 0, tt = 0;
  let drawFrame = 0;

  // Per-run state.
  let simRef: SimState | null = null;
  let shapes: (PadShapes | null)[] = [];
  let dipAt = new Float64Array(0);
  /** Current dim step per pad, eased toward its target over 120 ms (F-008); −1 = not yet seen. */
  let dimOf = new Float32Array(0);
  let chipBorn = new Float64Array(0);
  let xAt = new Float64Array(0);
  let dX = new Float32Array(0), dY = new Float32Array(0), dR = new Float32Array(0);
  let dStamp = new Int32Array(0);
  let lastChips = [-1, -1, -1];
  const exitPad = [-1, -1, -1], exitGlyph: ChipGlyph[] = ['F', 'F', 'F'];
  let exitAt = -1;
  let pressedPad = -1, pressedAt = -1;
  let pressedSlot: Slot = 'F';
  let hookAt = -1, eatAt = -1, winAt = -1, sunkAt = -1, escapeAt = -1;
  let landPad = -1;
  let clackAt = -1, clackX = 0, clackY = 0, clackHeading = 0;
  let pendingFlashAt = -1;
  let pendingHold = 0;
  let flankPad = -1, flankAt = -1, flankArmedAt = -1, flankClearAt = -1;
  let blinkAt = 2200;
  let route: Int32Array | null = null;
  let stampShaken = false;
  let eatX = 0, eatY = 0;

  const probe: RenderProbe = {
    frames: 0, drawnFrames: 0, hitStop: false, hitStops: 0, quality, frameP95: 0,
    frogStage: 'ground', frogAcross: 1, frogAlong: 1, frogScale: 1, frogH: 0, frogLegs: 0, headX: 0, headY: 0, frogX: 0, frogY: 0,
    camY: 0, zoom: 1, shake: 0, tau: 0, vignette: 0, eyeScale: 1, jawDeg: 0, toothFlashFrames: 0,
    gatorVisible: false, flankJaws: false, traceProgress: 0, inviteRing: false, chips: 0, pressedChipInverted: false,
    cues: Object.fromEntries(Object.keys(VISUAL_CUES).map((k) => [k, 0])),
    flyOverChoice: 0, dropletsOnPad: 0, droplets: 0, clackGap: -1,
    pick: (x, y) => renderer.pickPad(x, y),
  };
  canvas.__lilyRender = probe;

  function newRun(sim: SimState): void {
    simRef = sim;
    const n = sim.river.pads.length;
    shapes = new Array(n).fill(null);
    dipAt = new Float64Array(n).fill(-1e9);
    dimOf = new Float32Array(n).fill(-1);
    chipBorn = new Float64Array(n).fill(-1);
    xAt = new Float64Array(n).fill(-1);
    dX = new Float32Array(n);
    dY = new Float32Array(n);
    dR = new Float32Array(n);
    dStamp = new Int32Array(n).fill(-1);
    if (body.length < sim.gator.body.length * 2 + 2) body = new Float32Array(sim.gator.body.length * 2 + 2);
    lastChips = [-1, -1, -1];
    exitAt = -1;
    pressedPad = -1;
    hookAt = eatAt = winAt = sunkAt = escapeAt = clackAt = pendingFlashAt = -1;
    flankPad = flankAt = flankArmedAt = flankClearAt = -1;
    pendingHold = 0;
    route = null;
    stampShaken = false;
    particles.clear();
    ripples.clear();
    shake.reset();
    hitStop.reset();
    camera.primed = false;
    life.reset(sim.river.seed);
    if (sim.gator.phase !== 'dormant') hookAt = jt - 5000;
  }

  const shapeOf = (p: Pad): PadShapes => shapes[p.id] ?? (shapes[p.id] = buildPadShapes(p));

  /** Visual pad centre (rest + sway). */
  const padPos = (id: number, out: Vec2): Vec2 => {
    const p = simRef!.river.pads[id]!;
    out.x = p.x + padSwayX(p, at);
    out.y = p.y;
    return out;
  };

  const lifeWorld = {
    padPos,
    pickRestPad(salt: number): number {
      const sim = simRef!;
      let pick = -1, n = 0;
      for (let id = 0; id < dStamp.length; id++) {
        if (dStamp[id] !== drawFrame) continue;
        const p = sim.river.pads[id]!;
        if (p.kind !== 'lily' || sim.padStates[id]!.state !== 'idle' || id === sim.frog.padId || id === sim.frog.targetId) continue;
        n++;
        if (rand3(salt, id) * n < 1) pick = id;
      }
      return pick;
    },
    restOk(id: number): boolean {
      const sim = simRef!;
      return sim.river.pads[id]!.kind === 'lily' && sim.padStates[id]!.state === 'idle' && id !== sim.frog.padId && id !== sim.frog.targetId;
    },
    clear(p: Vec2): Vec2 {
      const sim = simRef!;
      for (let i = 0; i < sim.choices.length; i++) {
        const pad = sim.river.pads[sim.choices[i]!.padId]!;
        if (pad.kind === 'bank') continue;
        const cx = pad.x + padSwayX(pad, at), cy = pad.y;
        const dx = p.x - cx, dy = p.y - cy;
        const d = Math.hypot(dx, dy), min = pad.r + 6;
        if (d >= min) continue;
        const ux = d > 1e-6 ? dx / d : 0, uy = d > 1e-6 ? dy / d : 1;
        p.x = cx + ux * min;
        p.y = cy + uy * min;
      }
      return p;
    },
    blocked(x: number, y: number): boolean {
      const sim = simRef!;
      if (onBank(x, y, (sim.tuning.layers + 1) * sim.tuning.pitch, sim.river.seed)) return true;
      const k = Math.round(y / sim.tuning.pitch);
      for (let l = k - 1; l <= k + 1; l++) {
        const layer = sim.river.layers[l];
        if (!layer) continue;
        for (let i = 0; i < layer.length; i++) {
          const p = layer[i]!;
          if (p.kind !== 'bank' && Math.hypot(p.x - x, p.y - y) < p.r + 2.5) return true;
        }
      }
      return false;
    },
  };

  function spawnRingSplash(x: number, y: number, r: number, n: number, kind: PK, speed: number, life_: number, size: number, rippleOnLand: boolean): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (rand3(drawFrame, i, 3) - 0.5) * 0.5;
      const sp = speed * (0.75 + 0.5 * rand3(drawFrame, i, 4));
      const lifeS = life_ * (0.85 + 0.3 * rand3(drawFrame, i, 5));
      const peak = 1.5 + 2 * rand3(drawFrame, i, 6);
      const g = (8 * peak) / (lifeS * lifeS);
      particles.spawn(kind, x + Math.cos(a) * r, y + Math.sin(a) * r, Math.cos(a) * sp, Math.sin(a) * sp, 0, (g * lifeS) / 2, g, lifeS, size, rippleOnLand);
    }
  }

  function onEvent(e: SimEvent, sim: SimState, reduced: boolean): void {
    probe.cues[e.t] = (probe.cues[e.t] ?? 0) + 1;
    const imp = cueImpulse(e.t, reduced);
    const pads = sim.river.pads;
    switch (e.t) {
      case 'timerStart':
        break;
      case 'hop': {
        pressedPad = e.to;
        pressedSlot = e.slot;
        pressedAt = jt;
        let k = 0;
        for (let i = 0; i < 3; i++) {
          const id = lastChips[i]!;
          exitPad[i] = -1;
          if (id < 0 || id === e.to) continue;
          exitPad[k] = id;
          exitGlyph[k] = glyphFor(sim, id);
          k++;
        }
        exitAt = jt;
        break;
      }
      case 'retarget':
        pressedPad = e.to;
        pressedSlot = e.slot;
        break;
      case 'land': {
        dipAt[e.pad] = jt;
        landPad = sim.river.pads[e.pad]!.kind === 'bank' ? -1 : e.pad;
        const p = pads[e.pad]!;
        padPos(e.pad, tmp);
        if (p.kind === 'bank') {
          spawnRingSplash(tmp.x, tmp.y, 2, 10, PK.Sand, 14, 0.3, 0.6, false);
        } else {
          ripples.spawn(tmp.x, tmp.y, p.r, p.r * 1.8, 0.5, 0.5);
          ripples.spawn(tmp.x, tmp.y, p.r, p.r * 1.8, 0.5, 0.5, 0.09);
          // 6 droplets thrown from the rim (1.0–1.1r) to open water (1.25–1.6r): never on the leaf (polish 10, F-010).
          for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * TAU + (rand3(e.tick, i, 1) - 0.5) * 0.7;
            const from = p.r * (1.0 + 0.1 * rand3(e.tick, i, 4));
            const to = p.r * (1.25 + 0.35 * rand3(e.tick, i, 2));
            const lifeS = 0.22;
            const sp = (to - from) / lifeS;
            const peak = 2.2 + 1.4 * rand3(e.tick, i, 3);
            const g = (8 * peak) / (lifeS * lifeS);
            particles.spawn(PK.Droplet, tmp.x + Math.cos(ang) * from, tmp.y + Math.sin(ang) * from, Math.cos(ang) * sp, Math.sin(ang) * sp, 0, (g * lifeS) / 2, g, lifeS, 0.8, true);
          }
        }
        break;
      }
      case 'escape': {
        escapeAt = jt;
        padPos(e.pad, tmp);
        const p = pads[e.pad]!;
        ripples.spawn(tmp.x, tmp.y, p.r * 0.8, p.r * 1.6, 0.45, 0.45);
        break;
      }
      case 'sinkStart': {
        padPos(e.pad, tmp);
        spawnRingSplash(tmp.x, tmp.y, pads[e.pad]!.r * 0.85, 10, PK.Bubble, 6, 0.42, 0.7, false);
        break;
      }
      case 'tilt': {
        padPos(e.pad, tmp);
        const p = pads[e.pad]!;
        ripples.spawn(tmp.x + Math.cos(p.rot) * p.r, tmp.y + Math.sin(p.rot) * p.r, 1, 5, 0.4, 0.4);
        break;
      }
      case 'flip': {
        padPos(e.pad, tmp);
        ripples.spawn(tmp.x, tmp.y, pads[e.pad]!.r, pads[e.pad]!.r * 1.5, 0.45, 0.4);
        break;
      }
      case 'hook':
        hookAt = jt;
        gatorHeadPos(sim, 0, tmp);
        spawnRingSplash(tmp.x, tmp.y, 2, 12, PK.Splash, 16, 0.32, 0.7, false);
        ripples.spawn(tmp.x, tmp.y, 3, 12, 0.6, 0.5);
        ripples.spawn(tmp.x, tmp.y, 3, 12, 0.6, 0.5, 0.12);
        break;
      case 'flankStart':
        flankPad = e.pad;
        flankAt = jt;
        flankArmedAt = -1;
        flankClearAt = -1;
        break;
      case 'flankArmed':
        flankArmedAt = jt;
        xAt[e.pad] = jt;
        break;
      case 'flankClear':
        flankClearAt = jt;
        if (flankPad >= 0) {
          flankEyePos(sim, flankPad, tmp);
          spawnRingSplash(tmp.x, tmp.y, 1.5, 8, PK.Bubble, 5, 0.4, 0.6, false);
        }
        break;
      case 'nearMiss': {
        clackAt = jt;
        pendingFlashAt = jt + 45;
        // The snout TIP snaps shut 0.3P behind the frog's shadow centre along the hop axis (§6, F-013):
        // the head's hinge goes a further snout length back, pointing along the hop.
        poseNow(sim);
        const shx = pose.x + 0.35 * pose.shadowH, shy = pose.y - 0.45 * pose.shadowH;
        clackHeading = pose.facing;
        const back = 0.3 * sim.tuning.pitch + SNOUT_TIP;
        clackX = shx - Math.cos(clackHeading) * back;
        clackY = shy - Math.sin(clackHeading) * back;
        break;
      }
      case 'eaten':
        eatAt = jt;
        poseNow(sim);
        eatX = pose.x;
        eatY = pose.y;
        pendingHold = Math.max(pendingHold, imp.hitStopMs);
        spawnRingSplash(eatX, eatY, 2, 12, PK.Droplet, 22, 0.32, 0.8, true);
        ripples.spawn(eatX, eatY, 4, 16, 0.6, 0.5, 0.1);
        break;
      case 'sunk': {
        sunkAt = jt;
        poseNow(sim);
        spawnRingSplash(pose.x, pose.y, 1.5, 14, PK.Splash, 18, 0.36, 0.75, true);
        ripples.spawn(pose.x, pose.y, 2, 10, 0.5, 0.55);
        ripples.spawn(pose.x, pose.y, 2, 10, 0.5, 0.55, 0.1);
        break;
      }
      case 'win': {
        winAt = jt;
        pendingHold = Math.max(pendingHold, imp.hitStopMs);
        poseNow(sim);
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * TAU + rand3(e.tick, i, 8) * 0.25;
          const lifeS = 0.9;
          const sp = 16 + 18 * rand3(e.tick, i, 10);
          const peak = 3 + 4 * rand3(e.tick, i, 11);
          const g = (8 * peak) / (lifeS * lifeS) * 0.6;
          const k = particles.spawn(PK.Petal, pose.x, pose.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.5, Math.sqrt(2 * g * peak), g, lifeS, 2.5 + rand3(e.tick, i, 12) * 0.8);
          particles.spin[k] = (rand3(e.tick, i, 13) - 0.5) * 12;
          particles.rot[k] = a;
        }
        route = new Int32Array(sim.trail.length);
        for (let i = 0; i < sim.trail.length; i++) route[i] = padAt(sim, sim.trail[i]!);
        break;
      }
    }
    if (e.t !== 'nearMiss') {
      if (imp.shakePx > 0) shake.kick(imp.shakePx, imp.shakeMs);
    }
  }

  function padAt(sim: SimState, p: Vec2): number {
    const k = Math.round(p.y / sim.tuning.pitch);
    for (let l = Math.max(0, k - 1); l <= Math.min(sim.river.layers.length - 1, k + 1); l++) {
      const layer = sim.river.layers[l]!;
      for (let i = 0; i < layer.length; i++) if (layer[i]!.x === p.x && layer[i]!.y === p.y) return layer[i]!.id;
    }
    return -1;
  }

  function glyphFor(sim: SimState, padId: number): ChipGlyph {
    if (sim.padStates[padId]!.state === 'flanked') return 'X';
    for (const c of sim.choices) if (c.padId === padId) return c.slot;
    return 'F';
  }

  let simAlpha = 0;
  function poseNow(sim: SimState): void {
    frogPose(sim, sim.tick + simAlpha, padPos, pose);
  }

  function gatorHeadPos(sim: SimState, alpha: number, out: Vec2): Vec2 {
    const g = sim.gator;
    out.x = lerp(g.headPrev.x, g.head.x, alpha);
    out.y = lerp(g.headPrev.y, g.head.y, alpha);
    return out;
  }

  /** Where the flank gator's hinge sits for a pad, and its heading toward the pad. */
  function flankGeom(sim: SimState, padId: number, out: Vec2): number {
    const p = sim.river.pads[padId]!;
    padPos(padId, tmp2);
    const dir = p.x < 40 ? 120 * DEG : p.x > 60 ? 60 * DEG : 90 * DEG;
    const D = (p.r + 1) / Math.sin(34 * DEG);
    out.x = tmp2.x + Math.cos(dir) * D;
    out.y = tmp2.y + Math.sin(dir) * D;
    return dir + Math.PI;
  }

  function flankEyePos(sim: SimState, padId: number, out: Vec2): Vec2 {
    const hd = flankGeom(sim, padId, out);
    out.x -= Math.cos(hd) * 3.4;
    out.y -= Math.sin(hd) * 3.4;
    return out;
  }

  function setWorld(): void {
    const k = view.k;
    ctx!.setTransform(dpr * k, 0, 0, -dpr * k, dpr * (view.cx - 50 * k + view.shakeX), dpr * (view.ay + view.camY * k + view.shakeY));
  }
  function setScreen(): void {
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Quality tier (plan §14.5): drop grain and halve the halftone if the p95 frame exceeds 12 ms.
   * Samples over 100 ms are stalls (GC, a deferred raster flush, a background tab), not steady cost.
   */
  function measure(cost: number): void {
    if (cost > 100) return;
    costs[costN % costs.length] = cost;
    costN++;
    if (forced || quality === 'low' || costN < 90 || costN % 60 !== 0) return;
    sorted.set(costs);
    sorted.sort();
    const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
    probe.frameP95 = p95;
    if (p95 > 12) {
      quality = 'low';
      probe.quality = quality;
    }
  }

  function drawDeepPools(): void {
    // Irregular cut shapes of deeper water (never rows: positions hashed per 60 wu cell).
    const C = 60;
    ctx!.fillStyle = PALETTE.waterDeep;
    ctx!.globalAlpha = 0.16;
    ctx!.beginPath();
    const seed = simRef!.river.seed;
    for (let j = Math.floor(bounds.yB / C) - 1; j <= Math.ceil(bounds.yT / C) + 1; j++)
      for (let i = Math.floor(bounds.xL / C) - 1; i <= Math.ceil(bounds.xR / C) + 1; i++) {
        if (rand3(i, j, seed + 41) < 0.35) continue;
        const cx = (i + rand3(i, j, seed + 42)) * C + Math.sin(at * 0.13 + i) * 3;
        const cy = (j + rand3(i, j, seed + 43)) * C;
        const R = 12 + rand3(i, j, seed + 44) * 14;
        for (let v = 0; v <= 9; v++) {
          const a = (v / 9) * TAU;
          const rr = R * (0.7 + 0.3 * rand3(i * 31 + v, j, seed + 45)) * (v % 2 ? 1 : 0.92);
          const vx = cx + Math.cos(a) * rr * 1.4, vy = cy + Math.sin(a) * rr;
          if (v === 0) ctx!.moveTo(vx, vy);
          else ctx!.lineTo(vx, vy);
        }
        ctx!.closePath();
      }
    ctx!.fill();
    ctx!.globalAlpha = 1;
  }

  const renderer: Renderer = {
    resize(cssW, cssH, ratio) {
      w = Math.max(1, cssW);
      h = Math.max(1, cssH);
      dpr = Math.min(2, Math.max(1, ratio || 1));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      vignette = null;
      resized = true;
    },

    frame(sim: SimState, v: ViewState, newEvents: readonly SimEvent[], dtMs: number) {
      const t0 = performance.now();
      const dt = advancePresentation(dtMs);
      rt += dt;
      probe.frames++;
      if (sim !== simRef) newRun(sim);
      const reduced = v.settings.reducedMotion;
      simAlpha = v.alpha;
      for (let i = 0; i < newEvents.length; i++) onEvent(newEvents[i]!, sim, reduced);
      if (hitStop.active(rt) && !resized) {
        probe.hitStop = true;
        measure(performance.now() - t0);
        return;
      }
      probe.hitStop = false;
      resized = false;
      jt += dt;
      at += (dt / 1000) * (reduced ? 0.5 : 1);
      tt += dt / 1000;
      drawFrame++;
      const dts = dt / 1000;
      const simT = sim.tick + v.alpha;
      const t = sim.tuning;
      const P = t.pitch;
      const northY = (t.layers + 1) * P;
      const g = sim.gator;
      const tau = g.tau;

      // ── Frog pose and its render-only extras.
      frogPose(sim, simT, padPos, pose);
      if (escapeAt >= 0 && jt - escapeAt < 120) pose.h += (3 / view.k) * (1 - (jt - escapeAt) / 120);
      if (winAt >= 0) {
        const e = jt - winAt;
        if (e < 1500) {
          const hop = 2.6 * Math.abs(Math.sin((Math.PI * e) / 300)) * (1 - e / 1500);
          pose.h += hop;
          pose.scale *= 1 + 0.025 * hop;
          pose.shadowH = 3 + pose.h;
        }
      }
      let frogAlpha = 1;
      if (eatAt >= 0 && jt - eatAt >= 140 * 0.75) frogAlpha = 0;
      if (sunkAt >= 0) frogAlpha = 1 - clamp01((jt - sunkAt - 300) / 400);

      // ── Camera (§4.6, §7.5).
      let focusY = pose.y, zoom = tau > 0.7 && !reduced ? DANGER_ZOOM : 1, cut = false;
      if (eatAt >= 0) focusY = eatY;
      if (winAt >= 0 && jt - winAt > 150) {
        const goal = winGoal(w, h, northY + 14, -6);
        focusY = goal.focusY;
        zoom = goal.zoom;
        cut = reduced;
      }
      stepCamera(camera, { focusY, zoom, cut }, dts);
      shake.step(dts, shakeOff);
      updateView(view, w, h, camera, reduced ? 0 : shakeOff.x, reduced ? 0 : shakeOff.y);
      bounds.xL = wx(view, 0);
      bounds.xR = wx(view, w);
      bounds.yT = wy(view, 0);
      bounds.yB = wy(view, h);
      const px = 1 / view.k;

      // ── Background: the printed water (opaque halftone tile, river column only), deep pools.
      const low = quality === 'low';
      const water = low ? (waterLo ??= ctx.createPattern(makeHalftone(256, 8, true), 'repeat')!) : waterHi;
      const tile = low ? 256 : 512;
      // Integer offsets keep the pattern blit unfiltered (the fast raster path).
      patMatrix.e = Math.round((at * 6 * view.k) % tile + view.shakeX);
      patMatrix.f = Math.round((camera.y.x * view.k) % tile + view.shakeY);
      water.setTransform(patMatrix);
      setScreen();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const colL = Math.max(0, Math.floor(sx(view, -4))), colR = Math.min(w, Math.ceil(sx(view, 104)));
      if (colL > 0 || colR < w) {
        ctx.fillStyle = PALETTE.bank;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.fillStyle = water;
      ctx.fillRect(colL, 0, colR - colL, h);
      setWorld();
      drawDeepPools();

      const gatorAwake = g.phase !== 'dormant' || hookAt >= 0;
      if (gatorAwake && hookAt < 0) hookAt = jt - 5000;
      let surface = gatorAwake ? clamp01((jt - hookAt - 140) / 650) : 0;
      if (g.flank && g.flank.padId !== flankPad) {
        flankPad = g.flank.padId;
        flankAt = jt;
        flankArmedAt = -1;
        flankClearAt = -1;
      }
      if (!g.flank && flankPad >= 0 && flankClearAt < 0) flankClearAt = jt;
      // While it flanks, the chasing head submerges (the eyes are at the pad); it resurfaces after.
      if (g.flank) surface *= 1 - clamp01((jt - flankAt) / 200);
      else if (flankClearAt >= 0) surface *= clamp01((jt - flankClearAt - 150) / 350);
      if (winAt >= 0) {
        const e = jt - winAt;
        surface *= 1 - clamp01((e - 120) / 600);
        if (e > 120 && e < 720 && drawFrame % 5 === 0) {
          gatorHeadPos(sim, v.alpha, tmp);
          particles.spawn(PK.Bubble, tmp.x + (rand3(drawFrame, 1) - 0.5) * 6, tmp.y + (rand3(drawFrame, 2) - 0.5) * 6, 0, 2, 0, 0, 0, 0.42, 0.6 + rand3(drawFrame, 3) * 0.5);
        }
      }
      // Head: interpolated sim head, with render-only offsets for the clack and the lunge.
      gatorHeadPos(sim, v.alpha, tmp);
      let hx = tmp.x, hy = tmp.y;
      let jaw = jawRad(tau);
      if (clackAt >= 0) {
        const e = jt - clackAt;
        if (e < 260) {
          const inn = e < 45 ? EASE_UI(e / 45) : 1 - EASE_UI(clamp01((e - 110) / 150));
          hx = lerp(hx, clackX, inn);
          hy = lerp(hy, clackY, inn);
          jaw = e < 22 ? lerp(jaw, 36 * DEG, e / 22) : e < 45 ? lerp(36 * DEG, 0, (e - 22) / 23) : e < 110 ? 0 : lerp(0, jaw, (e - 110) / 150);
        }
      }
      if (eatAt >= 0) {
        const u = clamp01((jt - eatAt) / 140);
        hx = lerp(hx, eatX, EASE_UI(u));
        hy = lerp(hy, eatY, EASE_UI(u));
        jaw = u < 0.55 ? lerp(jaw, 40 * DEG, u / 0.55) : lerp(40 * DEG, 0, (u - 0.55) / 0.45);
        surface = 1;
      }
      // Keep the eyes peeking at the bottom edge when the gap is wide (it is always there, §7.2).
      const maxSy = h - Math.max(18, 5.5 * view.k);
      const headDy = sy(view, hy) > maxSy ? wy(view, maxSy) - hy : 0;
      const bodyAlpha = gatorAwake ? 0.92 * clamp01((jt - hookAt) / 400) * (winAt >= 0 ? 1 - clamp01((jt - winAt - 300) / 900) : 1) : 0;
      const nb = g.body.length;
      if (bodyAlpha > 0) {
        body[0] = hx - Math.cos(g.heading) * 4;
        body[1] = hy + headDy - Math.sin(g.heading) * 4;
        for (let i = 0; i < nb; i++) {
          body[(i + 1) * 2] = lerp(g.bodyPrev[i]!.x, g.body[i]!.x, v.alpha);
          body[(i + 1) * 2 + 1] = lerp(g.bodyPrev[i]!.y, g.body[i]!.y, v.alpha) + headDy * Math.max(0, 1 - i / 3);
        }
        drawGatorBody(ctx, body, nb + 1, bodyAlpha);
        // The print's dots run over the body (it reads as under the surface): only its bounding box.
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (let i = 0; i <= nb; i++) {
          const bx = sx(view, body[i * 2]!), by = sy(view, body[i * 2 + 1]!);
          if (bx < x0) x0 = bx;
          if (bx > x1) x1 = bx;
          if (by < y0) y0 = by;
          if (by > y1) y1 = by;
        }
        const m = 10 * view.k;
        x0 = Math.max(0, x0 - m);
        y0 = Math.max(0, y0 - m);
        x1 = Math.min(w, x1 + m);
        y1 = Math.min(h, y1 + m);
        if (x1 > x0 && y1 > y0) {
          const dots = low ? (dotsLo ??= ctx.createPattern(makeHalftone(256, 8), 'repeat')!) : dotsHi;
          dots.setTransform(patMatrix);
          setScreen();
          ctx.fillStyle = dots;
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        }
      }

      // ── Shore, ripples, water life, decor.
      setWorld();
      const seed = sim.river.seed;
      drawBanks(ctx, bounds, northY, seed);
      drawBankDetail(ctx, bounds, northY, seed);
      ripples.step(dts);
      ctx.strokeStyle = PALETTE.paper;
      for (let i = 0; i < ripples.cap; i++) {
        if (ripples.life[i]! <= 0 || ripples.age[i]! < 0) continue;
        const u = ripples.age[i]! / ripples.life[i]!;
        ctx.globalAlpha = ripples.a0[i]! * (1 - u);
        ctx.lineWidth = Math.max(0.35, 1.4 * px);
        ctx.beginPath();
        ctx.arc(ripples.x[i]!, ripples.y[i]!, lerp(ripples.r0[i]!, ripples.r1[i]!, EASE_UI(u)), 0, TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      life.update((dt / 1000) * (reduced ? 0.5 : 1), bounds, lifeWorld);
      life.drawWater(ctx);
      drawDecor(ctx, sim.river.decor, bounds, at);
      drawLog(ctx, northY, bounds, at);

      // ── Pads (shadows pass, then surfaces).
      const frogLayer = sim.frog.layer;
      const k0 = Math.max(1, Math.floor(bounds.yB / P) - 1), k1 = Math.min(t.layers, Math.ceil(bounds.yT / P) + 1);
      const isChoice = (id: number) => {
        for (let i = 0; i < sim.choices.length; i++) if (sim.choices[i]!.padId === id) return true;
        return false;
      };
      for (let pass = 0; pass < 2; pass++) {
        for (let k = k0; k <= k1; k++) {
          const layer = sim.river.layers[k]!;
          for (let i = 0; i < layer.length; i++) {
            const p = layer[i]!;
            const rt_ = sim.padStates[p.id]!;
            padLook(p, rt_, t, simT, at, tt, jt - dipAt[p.id]!, look);
            if (pass === 0) {
              drawPadShadow(ctx, p, shapeOf(p), look);
              continue;
            }
            const lit = isChoice(p.id) || rt_.state === 'reachable' || rt_.state === 'flanked';
            const target = lit || p.id === sim.frog.padId || p.id === sim.frog.targetId ? 0 : k > frogLayer ? DIM_AHEAD : DIM_BEHIND;
            const was = dimOf[p.id]!;
            const step = (dt / 120) * DIM_AHEAD;
            const d = was < 0 || dStamp[p.id] !== drawFrame - 1 ? target : was < target ? Math.min(target, was + step) : Math.max(target, was - step);
            dimOf[p.id] = d;
            drawPad(ctx, p, shapeOf(p), look, Math.round(d), px, lit && d < 1);
            if (p.kind === 'soggy' && look.sink < 1) {
              const R = p.r * look.scale;
              bubbleAt(p, 0, tt, bub);
              drawBubble(ctx, p, look.dx, R, bub, px);
              bubbleAt(p, 1, tt, bub);
              drawBubble(ctx, p, look.dx, R, bub, px);
            }
            const cx = sx(view, p.x + look.dx), cy = sy(view, p.y);
            dX[p.id] = cx;
            dY[p.id] = cy;
            dR[p.id] = p.r * look.scale * view.k;
            dStamp[p.id] = cy > -dR[p.id]! && cy < h + dR[p.id]! ? drawFrame : -1;
          }
        }
      }
      // The north bank answers as one big target when it is the next hop.
      const north = sim.river.layers[t.layers + 1]?.[0];
      if (north && isChoice(north.id)) {
        dX[north.id] = sx(view, 50);
        dY[north.id] = sy(view, north.y);
        dR[north.id] = 26 * view.k;
        dStamp[north.id] = drawFrame;
      }

      // ── Gator scutes (break the surface), frog, gator head.
      drawScutes(ctx, body, nb + 1, bodyAlpha * Math.min(1, surface + 0.4));
      drawFrog(ctx, pose, frogAlpha);

      probe.gatorVisible = gatorAwake && surface > 0.02;
      head.surface = surface;
      head.x = hx;
      head.y = hy + headDy;
      head.heading = g.heading;
      if (clackAt >= 0 && jt - clackAt < 260) {
        const e = jt - clackAt;
        const inn = e < 45 ? EASE_UI(e / 45) : 1 - EASE_UI(clamp01((e - 110) / 150));
        head.heading = lerpAngle(g.heading, clackHeading, inn);
      }
      if (eatAt >= 0) head.heading = Math.atan2(eatY - tmp.y, eatX - tmp.x) || g.heading;
      head.jaw = jaw;
      head.eyeScale = eyeScale(tau);
      head.scale = 1;
      head.lookX = pose.x;
      head.lookY = pose.y;
      if (jt > blinkAt + 80) blinkAt = jt + 2000 + rand3(drawFrame, 77) * 2000;
      const blinking = jt >= blinkAt && jt < blinkAt + 80;
      const sated = g.phase === 'sated' || (eatAt >= 0 && jt - eatAt > 260);
      head.lid = Math.max(blinking ? 1 : 0, sated ? 0.55 : 0, hookAt >= 0 && jt - hookAt > 620 && jt - hookAt < 700 ? 1 : 0);
      head.flash = false;
      if (pendingFlashAt >= 0 && jt >= pendingFlashAt) {
        head.flash = true;
        pendingFlashAt = -1;
        probe.toothFlashFrames++;
        probe.clackGap = Math.hypot(hx + Math.cos(head.heading) * SNOUT_TIP - (pose.x + 0.35 * pose.shadowH), hy + Math.sin(head.heading) * SNOUT_TIP - (pose.y - 0.45 * pose.shadowH));
        const imp = cueImpulse('nearMiss', reduced);
        pendingHold = Math.max(pendingHold, imp.hitStopMs);
        shake.kick(imp.shakePx, imp.shakeMs);
        spawnRingSplash(hx, hy, 1, 6, PK.Droplet, 12, 0.24, 0.6, true);
      }
      drawGatorHead(ctx, head);
      probe.eyeScale = head.eyeScale;
      probe.jawDeg = jaw / DEG;

      // Flank: eyes rise beside the pad (250 ms pop), then the jaws open around its rim.
      probe.flankJaws = false;
      if (flankPad >= 0 && (g.flank || (flankClearAt >= 0 && jt - flankClearAt < 320))) {
        const hd = flankGeom(sim, flankPad, tmp);
        const armed = g.flank ? g.flank.armed || sim.padStates[flankPad]!.state === 'flanked' : flankArmedAt >= 0;
        if (armed && flankArmedAt < 0) {
          flankArmedAt = jt;
          if (xAt[flankPad]! < 0) xAt[flankPad] = jt;
        }
        const rise = EASE_POP(clamp01((jt - flankAt) / 250)) * 0.5;
        const open = armed ? EASE_POP(clamp01((jt - flankArmedAt) / 140)) : 0;
        const gone = flankClearAt >= 0 ? 1 - clamp01((jt - flankClearAt) / 300) : 1;
        flankHead.x = tmp.x;
        flankHead.y = tmp.y;
        flankHead.heading = hd;
        flankHead.scale = 1.6;
        flankHead.jaw = 68 * DEG * open;
        flankHead.eyeScale = (1 + 0.5 * tau) / 1.6 * 1.25;
        flankHead.surface = Math.max(0.001, (armed ? 0.5 + 0.5 * open : rise) * gone);
        flankHead.lid = blinking ? 1 : 0;
        flankHead.lookX = pose.x;
        flankHead.lookY = pose.y;
        flankHead.flash = false;
        drawGatorHead(ctx, flankHead);
        probe.flankJaws = armed && gone > 0.5;
      }

      // ── Chips (§5.3): pop in staggered W→E after landing, pressed chip inverts 80 ms.
      const chipPx = w < 700 ? 16 : 20;
      let chipCount = 0;
      for (let i = 0; i < 3; i++) {
        const id = lastChips[i]!;
        if (id >= 0 && !isChoice(id)) chipBorn[id] = -1;
      }
      for (let i = 0; i < 3; i++) lastChips[i] = sim.choices[i]?.padId ?? -1;
      let stagger = 0;
      for (let i = 0; i < sim.choices.length; i++) {
        const c = sim.choices[i]!;
        if (chipBorn[c.padId]! < 0) chipBorn[c.padId] = jt + 30 * stagger++;
      }
      probe.inviteRing = false;
      const fwd = forwardChoice(sim);
      for (let i = 0; i < sim.choices.length; i++) {
        const c = sim.choices[i]!;
        const p = sim.river.pads[c.padId]!;
        if (p.kind === 'bank') continue;
        padPos(c.padId, tmp);
        const R = 0.42 * p.r;
        const cxw = tmp.x + 0.36 * p.r, cyw = tmp.y + 0.74 * p.r;
        let s = EASE_POP(clamp01((jt - chipBorn[c.padId]!) / 160));
        let glyph: ChipGlyph = c.slot;
        if (sim.padStates[c.padId]!.state === 'flanked') {
          const xa = xAt[c.padId]! >= 0 ? xAt[c.padId]! : (xAt[c.padId] = jt);
          const u = clamp01((jt - xa) / 140);
          glyph = u < 0.5 ? c.slot : 'X';
          s *= 1 - 0.7 * Math.sin(Math.PI * u);
        }
        drawChip(ctx, cxw, cyw, R, glyph, false, s, px, chipPx);
        chipCount++;
        if (v.phase === 'title' && c.padId === fwd) {
          // Invite ring: r → 1.5r, alpha 0.6 → 0, every 900 ms (§7.1).
          const u = (rt % 900) / 900;
          ctx.strokeStyle = PALETTE.paper;
          ctx.globalAlpha = 0.6 * (1 - u);
          ctx.lineWidth = Math.max(0.5, 2.5 * px);
          ctx.beginPath();
          ctx.arc(tmp.x, tmp.y, p.r * (1 + 0.5 * EASE_UI(u)), 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
          probe.inviteRing = true;
        }
      }
      probe.chips = chipCount;
      probe.pressedChipInverted = false;
      if (pressedPad >= 0 && jt - pressedAt < 170) {
        const p = sim.river.pads[pressedPad]!;
        if (p.kind !== 'bank') {
          padPos(pressedPad, tmp);
          const e = jt - pressedAt;
          const inv = e < 80;
          drawChip(ctx, tmp.x + 0.36 * p.r, tmp.y + 0.74 * p.r, 0.42 * p.r, pressedSlot, inv, inv ? 1.06 : 1 - EASE_UI((e - 80) / 90), px, chipPx);
          probe.pressedChipInverted = inv;
        }
      }
      if (exitAt >= 0 && jt - exitAt < 90) {
        const s = 1 - EASE_UI((jt - exitAt) / 90);
        for (let i = 0; i < 3; i++) {
          const id = exitPad[i]!;
          if (id < 0) continue;
          const p = sim.river.pads[id]!;
          if (p.kind === 'bank') continue;
          padPos(id, tmp);
          drawChip(ctx, tmp.x + 0.36 * p.r, tmp.y + 0.74 * p.r, 0.42 * p.r, exitGlyph[i]!, false, s, px, chipPx);
        }
      }

      // ── Particles.
      particles.step(dts, (x, y, size) => {
        ripples.spawn(x, y, size * 0.6, size * 2.6, 0.32, 0.45);
        if (landPad >= 0) {
          const lp = sim.river.pads[landPad]!;
          probe.droplets++;
          if (Math.hypot(x - lp.x, y - lp.y) < lp.r * 1.08) probe.dropletsOnPad++;
        }
      });
      for (let i = 0; i < particles.cap; i++) {
        if (particles.life[i]! <= 0) continue;
        const kind = particles.kind[i]!;
        const u = particles.age[i]! / particles.life[i]!;
        const x = particles.x[i]!, y = particles.y[i]!, z = particles.z[i]!, s = particles.size[i]!;
        if (kind === PK.Petal) {
          // Petals live above the zoom: constant screen size while the camera pulls out (F-012).
          const s = particles.size[i]! / camera.zoom.x;
          ctx.globalAlpha = 1 - smooth(remap(u, 0.7, 1));
          ctx.fillStyle = SHADOW;
          ctx.beginPath();
          ctx.ellipse(x + 0.35 * z, y - 0.45 * z, s, s * 0.5, particles.rot[i]!, 0, TAU);
          ctx.fill();
          ctx.fillStyle = PALETTE.bloom;
          ctx.beginPath();
          ctx.ellipse(x, y, s, s * 0.5, particles.rot[i]!, 0, TAU);
          ctx.fill();
        } else if (kind === PK.Bubble) {
          ctx.globalAlpha = 1 - u * u;
          ctx.fillStyle = PALETTE.paper;
          ctx.beginPath();
          ctx.arc(x, y, s * (0.6 + 0.6 * u), 0, TAU);
          ctx.fill();
        } else {
          // Droplets fade over their last 60 ms (they meet the water, F-010).
          ctx.globalAlpha = kind === PK.Droplet ? 1 - clamp01((particles.age[i]! - (particles.life[i]! - 0.06)) / 0.06) : 1;
          if (z > 0.1) {
            ctx.fillStyle = SHADOW;
            ctx.beginPath();
            ctx.arc(x + 0.35 * z, y - 0.45 * z, s, 0, TAU);
            ctx.fill();
          }
          ctx.fillStyle = kind === PK.Sand ? PALETTE.bank : PALETTE.paper;
          ctx.beginPath();
          ctx.arc(x, y, s * (1 + 0.03 * z), 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // ── Win route trace (§7.5, polish 21): dashed ink through every landed pad centre, finish → start.
      probe.traceProgress = 0;
      if (winAt >= 0 && route) {
        const u = clamp01((jt - winAt - 120) / 700);
        probe.traceProgress = u;
        const arc = sim.trailArc;
        const total = arc[arc.length - 1] ?? 0;
        const cutAt = total * (1 - EASE_UI(u));
        if (u > 0) {
          ctx.strokeStyle = PALETTE.ink;
          ctx.fillStyle = PALETTE.ink;
          ctx.lineWidth = Math.max(1.0, 2.2 * px);
          ctx.lineCap = 'round';
          ctx.setLineDash(DASH);
          ctx.beginPath();
          const n = sim.trail.length;
          const at_ = (i: number, out: Vec2) => {
            const id = route![i]!;
            if (id >= 0 && sim.river.pads[id]!.kind !== 'bank') return padPos(id, out);
            out.x = sim.trail[i]!.x;
            out.y = sim.trail[i]!.y;
            return out;
          };
          at_(n - 1, tmp);
          ctx.moveTo(tmp.x, tmp.y);
          for (let i = n - 2; i >= 0; i--) {
            at_(i, tmp);
            if (arc[i]! >= cutAt) {
              ctx.lineTo(tmp.x, tmp.y);
              continue;
            }
            at_(i + 1, tmp2);
            const seg = arc[i + 1]! - arc[i]!;
            const f = seg > 0 ? (arc[i + 1]! - cutAt) / seg : 1;
            ctx.lineTo(lerp(tmp2.x, tmp.x, f), lerp(tmp2.y, tmp.y, f));
            break;
          }
          ctx.stroke();
          ctx.setLineDash(NO_DASH);
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            if (arc[i]! < cutAt) continue;
            at_(i, tmp);
            ctx.moveTo(tmp.x + 1.1, tmp.y);
            ctx.arc(tmp.x, tmp.y, 1.1, 0, TAU);
          }
          ctx.fill();
        }
      }

      // ── Reeds and the air layer.
      const nr = collectReeds(bounds, northY, seed, reeds);
      drawReeds(ctx, reeds, nr, at, true);
      drawReeds(ctx, reeds, nr, at, false);
      life.drawAir(ctx);
      let nc = 0;
      for (let i = 0; i < sim.choices.length && i < 3; i++) {
        const cp = sim.river.pads[sim.choices[i]!.padId]!;
        if (cp.kind === 'bank') continue;
        choiceIds[nc] = cp.id;
        choiceR[nc++] = cp.r;
      }
      if (nc && life.minChoiceGap(lifeWorld, choiceIds, choiceR, nc) < 2) probe.flyOverChoice++;

      // ── Print grain and the danger vignette (screen space).
      setScreen();
      if (!low) {
        ctx.fillStyle = patGrain;
        ctx.fillRect(0, 0, w, h);
      }
      // Vignette: alpha 0.35τ, pulsing on the shared heartbeat (polish 14).
      const va = vignetteAlpha(tau, heartbeatPhase(sim)) * (winAt >= 0 ? 1 - clamp01((jt - winAt) / 400) : 1);
      probe.vignette = va;
      if (va > 0.004) {
        vignette ??= makeVignette();
        // Centre high (bottom and sides weigh most); full colour at the side and bottom edges.
        const ex = w / 2, ey = h * 0.62, cy = h * 0.38;
        ctx.setTransform(dpr * ex, 0, 0, dpr * ey, dpr * (w / 2), dpr * cy);
        ctx.globalAlpha = va;
        ctx.fillStyle = vignette;
        ctx.fillRect(-1, -cy / ey, 2, h / ey);
        ctx.globalAlpha = 1;
        setScreen();
        const band = bottomBandAlpha(tau, heartbeatPhase(sim)) * (winAt >= 0 ? 0 : 1);
        if (band > 0.01) {
          ctx.globalAlpha = band;
          ctx.fillStyle = PALETTE.jaw;
          ctx.fillRect(0, h - 6, w, 6);
          ctx.globalAlpha = 1;
        }
      }

      // Win stamp shake (the stamp itself is DOM, §7.5 step 5).
      if (winAt >= 0 && v.newBest && !stampShaken && jt - winAt > 700) {
        stampShaken = true;
        if (!reduced) shake.kick(3, 160);
      }

      // ── Probe and hold.
      probe.drawnFrames++;
      probe.frogStage = pose.stage;
      probe.frogAcross = pose.across;
      probe.frogAlong = pose.along;
      probe.frogScale = pose.scale;
      probe.frogH = pose.h;
      probe.frogLegs = pose.legs;
      probe.headX = sx(view, head.x);
      probe.headY = sy(view, head.y);
      probe.frogX = sx(view, pose.x);
      probe.frogY = sy(view, pose.y);
      probe.camY = camera.y.x;
      probe.zoom = camera.zoom.x;
      probe.shake = Math.hypot(view.shakeX, view.shakeY);
      probe.tau = tau;
      if (pendingHold > 0) {
        hitStop.hold(rt, pendingHold);
        probe.hitStops++;
        pendingHold = 0;
      }
      measure(performance.now() - t0);
    },

    pickPad(clientX, clientY) {
      let best: number | null = null, bd = Infinity;
      for (let id = 0; id < dStamp.length; id++) {
        if (dStamp[id] !== drawFrame) continue;
        const d = Math.hypot(clientX - dX[id]!, clientY - dY[id]!);
        if (d <= dR[id]! * 1.4 && d < bd) {
          bd = d;
          best = id;
        }
      }
      return best;
    },

    padOnScreen(id) {
      if (id < 0 || id >= dStamp.length || dStamp[id] !== drawFrame) return null;
      return { x: dX[id]!, y: dY[id]!, r: dR[id]! };
    },
  };

  /** Unit-circle gradient, drawn stretched to an ellipse that reaches the bottom and side edges (§4.3, 0.35τ). */
  function makeVignette(): CanvasGradient {
    const g = ctx!.createRadialGradient(0, 0, 0.3, 0, 0, 1);
    g.addColorStop(0, rgba(PALETTE.jaw, 0));
    g.addColorStop(0.5, rgba(PALETTE.jaw, 0.5));
    g.addColorStop(0.8, rgba(PALETTE.jaw, 1));
    return g;
  }

  return renderer;
}
