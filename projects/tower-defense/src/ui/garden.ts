// "Spill Garden" (§4 Look, §5 map render): paper ground, creases, path ribbon and stitch, world density
// (seed 7), pond, rocks, maple, inkwell + spill pool, Seed Jar, grain and vignette. The static part is
// prerendered once per backing scale; ambient motion is drawn per frame on real time.
import { DECOR, FIELD, HUD_TOP, LOGICAL_H, LOGICAL_W, NO_BUILD, PATH_POINTS, PATH_RIBBON_WIDTH, PATH_STITCH_DASH, PATH_EDGE_WIDTH } from '../data/map';
import { P, SHADOW_OFFSET } from '../data/palette';
import { distanceToPath } from '../sim/path';
import { type AnyCanvas, type Ctx, ctxOf, inOutSine, makeCanvas, outCubic, renderRng } from './draw';

// Low-saturation garden accents (≤ 45 % HSL saturation, §4 rule).
const PETAL = '#E3C7C0';
const PETAL_DEEP = '#C9A39A';
const LEAVES = ['#C99A7A', '#D2AE84', '#B98A6E'];
const ROCK_DARK = '#B9A783';
const GLASS = 'rgba(251,247,238,.55)';

export interface GardenDynamic {
  /** Spill pool scale (1 → 1.15 round start pulse, → 1.4 boss warning). */
  poolScale: number;
  /** 0 = normal ink, 1 = fully --knot (boss warning). */
  poolDark: number;
  /** Seed Jar fill 0..1 (= lives / start lives, §16.16). */
  jarFill: number;
  /** Jar flash 0..1 (leak). */
  jarFlash: number;
}

export interface Garden {
  /** Paper sheet only (title t 0). */
  drawPaper(c: Ctx): void;
  /** True once the ground cache exists: it is opaque (paper baked in), so a full-alpha, unshaken
   *  drawGround covers every pixel and the separate paper fill can be skipped (perf, F-006). */
  groundCoversPaper(): boolean;
  /** Static decor + path (alpha for the title fade-in) and ambient life; `placing` brightens edges and hatches no-build. */
  drawGround(c: Ctx, nowMs: number, opts: { alpha: number; placing: boolean; reduceMotion: boolean; scale: number; dyn: GardenDynamic; petals?: number }): void;
  /** Drawn above blots: the overturned inkwell they pour out of, and the jar rim they fall into. */
  drawOccluders(c: Ctx, alpha: number): void;
  drawVignette(c: Ctx): void;
  drawGrain(c: Ctx): void;
}

interface Tuft { x: number; y: number; a: number[]; l: number[] }
interface Flower { x: number; y: number; rot: number; tint: string }
interface Petal { x: number; y: number; rot: number; phase: number }

function clearOfDecor(x: number, y: number, pad: number): boolean {
  if (y < HUD_TOP + 6 || x < 4 || x > FIELD.w - 4 || y > LOGICAL_H - 4) return false;
  if (distanceToPath(x, y) < PATH_RIBBON_WIDTH / 2 + pad) return false;
  for (const c of NO_BUILD) if (Math.hypot(x - c.x, y - c.y) < c.r * 0.82 + pad) return false;
  return true;
}

export function createGarden(): Garden {
  const rnd = renderRng(DECOR.seed);
  const tufts: Tuft[] = [];
  while (tufts.length < DECOR.grassTufts) {
    const x = rnd() * FIELD.w, y = HUD_TOP + rnd() * (LOGICAL_H - HUD_TOP);
    if (!clearOfDecor(x, y, 8)) continue;
    tufts.push({ x, y, a: [-0.5 - rnd() * 0.3, -0.05 + rnd() * 0.1, 0.45 + rnd() * 0.3], l: [6 + rnd() * 4, 7 + rnd() * 3, 6 + rnd() * 4] });
  }
  const flowers: Flower[] = [];
  while (flowers.length < DECOR.flowers) {
    const x = rnd() * FIELD.w, y = HUD_TOP + rnd() * (LOGICAL_H - HUD_TOP);
    if (!clearOfDecor(x, y, 12)) continue;
    flowers.push({ x, y, rot: rnd() * Math.PI, tint: rnd() < 0.5 ? P.foldWhite : PETAL });
  }
  const petals: Petal[] = Array.from({ length: DECOR.petals.count * 4 }, () => ({ x: rnd() * FIELD.w, y: HUD_TOP + rnd() * (LOGICAL_H - HUD_TOP), rot: rnd() * 6, phase: rnd() * 6 }));
  const rockShapes = DECOR.rocks.map((r, i) => {
    const rr = renderRng(31 + i);
    return Array.from({ length: 7 }, (_, k) => ({ a: (k / 7) * Math.PI * 2 + rr() * 0.3, r: r.r * (0.68 + rr() * 0.18) }));
  });

  let cache: AnyCanvas | null = null;
  let cacheScale = 0;
  let grain: CanvasPattern | null = null;
  let grainTried = false;
  let vignette: CanvasGradient | null = null;
  let vignetteCtx: Ctx | null = null;
  // Device-resolution overlays (perf, F-006/F-009): the vignette and the grain cover the whole canvas every
  // frame. A full-screen gradient fill or a multiply-blended pattern is slow in CPU raster; an integer-aligned
  // 1:1 blit is the fast path. Memory stays small: the vignette keeps only its two edge bands (its middle is
  // transparent), and at an integer scale the grain is a device-px tile pattern rather than a full canvas.
  // Rebuilt when the canvas size or the world transform changes.
  let overlayKey = '';
  let overlaysOk = false;
  let vigL: AnyCanvas | null = null;
  let vigR: AnyCanvas | null = null;
  let vigX1 = 0;
  let grainPat: CanvasPattern | null = null;
  let grainFull: AnyCanvas | null = null;
  /** The vignette is 0 inside 0.7 × the half-diagonal, so a central full-height strip never needs drawing. */
  const VIG_R0 = Math.hypot(LOGICAL_W / 2, LOGICAL_H / 2) * 0.7;
  const VIG_CLEAR_HALF = Math.floor(Math.sqrt(Math.max(0, VIG_R0 * VIG_R0 - (LOGICAL_H / 2) ** 2))) - 2;

  /** Grain as black alpha. Multiply at alpha a gives dst·(1 − a + a·s); black source-over at alpha a·(1 − s)
   *  gives the same dst·(1 − a·(1 − s)). The tile's channels differ by ≤ 10/255, so one alpha (their mean)
   *  is within a·10/255 ≈ 0.2 % of the per-channel multiply. */
  function grainAlphaTile(): AnyCanvas | null {
    const n = DECOR.grainTile;
    const tile = makeCanvas(n, n);
    const tc = tile && ctxOf(tile);
    if (!tile || !tc) return null;
    const img = tc.createImageData(n, n);
    const r = renderRng(DECOR.seed * 13);
    for (let i = 0; i < n * n; i++) {
      const val = 150 + Math.floor(r() * 105);
      const sMean = (val + (val - 4) + (val - 10)) / 3 / 255;
      img.data[i * 4 + 3] = Math.round(255 * DECOR.grainAlpha * (1 - sMean));
    }
    tc.putImageData(img, 0, 0);
    return tile;
  }

  function ensureOverlays(c: Ctx): boolean {
    const cv = c.canvas as AnyCanvas | undefined;
    if (!cv || !(cv.width > 0) || !(cv.height > 0) || typeof c.getTransform !== 'function') return false;
    const m = c.getTransform() as DOMMatrix | undefined;
    if (!m || !Number.isFinite(m.a) || !Number.isFinite(m.e) || m.b !== 0 || m.c !== 0) return false;
    const key = `${cv.width}x${cv.height}@${m.a},${m.d},${m.e},${m.f}`;
    if (key === overlayKey) return overlaysOk;
    overlayKey = key;
    overlaysOk = false;
    vigL = vigR = grainFull = null;
    grainPat = null;
    const w = cv.width, h = cv.height;
    // vignette bands: [0, x0) and [x1, w) in device px
    const x0 = Math.max(0, Math.min(w, Math.floor((LOGICAL_W / 2 - VIG_CLEAR_HALF) * m.a + m.e)));
    const x1 = Math.max(x0, Math.min(w, Math.ceil((LOGICAL_W / 2 + VIG_CLEAR_HALF) * m.a + m.e)));
    const hd = Math.hypot(LOGICAL_W / 2, LOGICAL_H / 2);
    const band = (bx: number, bw: number): AnyCanvas | null => {
      if (bw <= 0) return null;
      const b = makeCanvas(bw, h);
      const bc = b && ctxOf(b);
      if (!b || !bc) return null;
      bc.setTransform(m.a, 0, 0, m.d, m.e - bx, m.f);
      const grad = bc.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 2, hd * 0.7, LOGICAL_W / 2, LOGICAL_H / 2, hd);
      grad.addColorStop(0, 'rgba(28,26,36,0)');
      grad.addColorStop(1, 'rgba(28,26,36,0.10)');
      bc.fillStyle = grad;
      bc.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      return b;
    };
    vigL = band(0, x0);
    vigR = band(x1, w - x1);
    vigX1 = x1;
    if ((x0 > 0 && !vigL) || (x1 < w && !vigR)) return false;
    const tile = grainAlphaTile();
    if (!tile) return false;
    const res = m.a;
    if (res === m.d && Number.isInteger(res) && Number.isInteger(m.e) && Number.isInteger(m.f)) {
      // integer scale: one tile of n·res device px, pattern-filled at identity (tiny, and still a 1:1 sample)
      const n = DECOR.grainTile * res;
      const dt = makeCanvas(n, n);
      const dc = dt && ctxOf(dt);
      if (!dt || !dc) return false;
      dc.setTransform(res, 0, 0, res, 0, 0);
      dc.drawImage(tile as CanvasImageSource, 0, 0);
      grainPat = c.createPattern(dt as CanvasImageSource, 'repeat');
      if (grainPat && (m.e !== 0 || m.f !== 0)) grainPat.setTransform?.(new DOMMatrix([1, 0, 0, 1, m.e, m.f]));
    }
    if (!grainPat) {
      // fractional scale: the logical tile is magnified by a non-integer factor, so bake one full canvas
      const g = makeCanvas(w, h);
      const gc = g && ctxOf(g);
      const pat = gc && gc.createPattern(tile as CanvasImageSource, 'repeat');
      if (!g || !gc || !pat) return false;
      gc.setTransform(m);
      gc.fillStyle = pat;
      gc.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      grainFull = g;
    }
    overlaysOk = true;
    return true;
  }

  function tracePath(c: Ctx): void {
    c.beginPath();
    PATH_POINTS.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  }

  function drawPathRibbon(c: Ctx, edge: string): void {
    c.lineJoin = 'round';
    c.lineCap = 'butt';
    tracePath(c);
    c.strokeStyle = edge;
    c.lineWidth = PATH_RIBBON_WIDTH + PATH_EDGE_WIDTH * 2;
    c.stroke();
    c.strokeStyle = P.kraft;
    c.lineWidth = PATH_RIBBON_WIDTH;
    c.stroke();
    c.save();
    c.globalAlpha = 0.5;
    c.setLineDash(PATH_STITCH_DASH as unknown as number[]);
    c.strokeStyle = P.kraftEdge;
    c.lineWidth = 1.5;
    c.stroke();
    c.restore();
  }

  function drawStatic(c: Ctx): void {
    // creases: two long folds across the sheet, 1-px shade + 1-px highlight (Tearaway paper)
    c.lineWidth = 1;
    for (const [x0, y0, x1, y1] of [[0, 452, 1080, 404], [612, HUD_TOP, 548, 720]] as const) {
      c.strokeStyle = 'rgba(201,180,140,.55)';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.strokeStyle = 'rgba(251,247,238,.8)';
      c.beginPath(); c.moveTo(x0 + 1, y0 + 1); c.lineTo(x1 + 1, y1 + 1); c.stroke();
    }
    // grass tufts: 3 strokes, 6–10 px, --moss-deep
    c.strokeStyle = P.mossDeep;
    c.lineWidth = 1.4;
    c.lineCap = 'round';
    for (const t of tufts) {
      c.beginPath();
      for (let k = 0; k < 3; k++) { c.moveTo(t.x + (k - 1) * 2, t.y); c.lineTo(t.x + (k - 1) * 2 + Math.sin(t.a[k]) * t.l[k], t.y - Math.cos(t.a[k]) * t.l[k]); }
      c.stroke();
    }
    // path ribbon, borders, centre stitch (§5)
    drawPathRibbon(c, P.kraftEdge);
    // pond: cut-paper hole with an inner shadow on the lit (top-left) edge
    const pd = DECOR.pond;
    c.fillStyle = P.paperDeep;
    c.beginPath(); c.ellipse(pd.x, pd.y, pd.w / 2 + 5, pd.h / 2 + 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = P.water;
    c.beginPath(); c.ellipse(pd.x, pd.y, pd.w / 2, pd.h / 2, 0, 0, Math.PI * 2); c.fill();
    c.save();
    c.beginPath(); c.ellipse(pd.x, pd.y, pd.w / 2, pd.h / 2, 0, 0, Math.PI * 2); c.clip();
    c.fillStyle = 'rgba(110,158,168,.55)';
    c.beginPath(); c.ellipse(pd.x + SHADOW_OFFSET.x * 2, pd.y + SHADOW_OFFSET.y * 2, pd.w / 2, pd.h / 2, 0, 0, Math.PI * 2);
    c.rect(pd.x - 200, pd.y - 200, 400, 400); c.fill('evenodd');
    c.strokeStyle = 'rgba(251,247,238,.6)';
    c.lineWidth = 1;
    for (const [dx, dy, w] of [[-18, 22, 26], [14, 34, 18], [24, -6, 22]] as const) { c.beginPath(); c.moveTo(pd.x + dx, pd.y + dy); c.lineTo(pd.x + dx + w, pd.y + dy); c.stroke(); }
    c.restore();
    // lily pads
    for (const [lx, ly, lr, la] of [[312, 236, 13, 0.6], [372, 284, 10, 2.4]] as const) {
      c.fillStyle = P.shadow;
      c.beginPath(); c.arc(lx + 2, ly + 2, lr, la + 0.35, la + Math.PI * 2 - 0.35); c.lineTo(lx + 2, ly + 2); c.fill();
      c.fillStyle = P.moss;
      c.beginPath(); c.arc(lx, ly, lr, la + 0.35, la + Math.PI * 2 - 0.35); c.lineTo(lx, ly); c.closePath(); c.fill();
      c.strokeStyle = P.mossDeep;
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx - Math.cos(la) * lr * 0.8, ly - Math.sin(la) * lr * 0.8); c.stroke();
    }
    // flowers: five petals r 5
    for (const f of flowers) {
      for (let k = 0; k < 5; k++) {
        const a = f.rot + (k * Math.PI * 2) / 5;
        c.fillStyle = P.shadow;
        c.beginPath(); c.arc(f.x + Math.cos(a) * 3.2 + 1.5, f.y + Math.sin(a) * 3.2 + 2, 2.6, 0, Math.PI * 2); c.fill();
      }
      for (let k = 0; k < 5; k++) {
        const a = f.rot + (k * Math.PI * 2) / 5;
        c.fillStyle = f.tint;
        c.beginPath(); c.arc(f.x + Math.cos(a) * 3.2, f.y + Math.sin(a) * 3.2, 2.6, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = P.gold;
      c.beginPath(); c.arc(f.x, f.y, 1.6, 0, Math.PI * 2); c.fill();
    }
    // rocks: faceted paper, hard shadow
    DECOR.rocks.forEach((r, i) => {
      const pts = rockShapes[i];
      const poly = (ox: number, oy: number): void => { c.beginPath(); pts.forEach((p, k) => { const x = r.x + ox + Math.cos(p.a) * p.r, y = r.y + oy + Math.sin(p.a) * p.r; k ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
      c.fillStyle = P.shadow; poly(SHADOW_OFFSET.x, SHADOW_OFFSET.y); c.fill();
      c.fillStyle = ROCK_DARK; poly(0, 0); c.fill();
      c.fillStyle = P.paperDeep;
      c.beginPath(); c.moveTo(r.x, r.y);
      for (let k = 3; k <= 6; k++) { const p = pts[k % 7]; c.lineTo(r.x + Math.cos(p.a) * p.r, r.y + Math.sin(p.a) * p.r); }
      c.closePath(); c.fill();
      c.strokeStyle = P.foldWhite; c.lineWidth = 1;
      c.beginPath(); c.moveTo(r.x, r.y); const p4 = pts[4]; c.lineTo(r.x + Math.cos(p4.a) * p4.r, r.y + Math.sin(p4.a) * p4.r); c.stroke();
      c.strokeStyle = P.kraftEdge; c.lineWidth = 1; poly(0, 0); c.stroke();
    });
    // maple trunk (canopy sways per frame)
    const m = DECOR.maple;
    c.strokeStyle = P.shadow; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(m.x + 3, m.y + 44); c.lineTo(m.x + 3, m.y + 4); c.stroke();
    c.strokeStyle = P.kraftEdge; c.lineWidth = 6;
    c.beginPath(); c.moveTo(m.x, m.y + 40); c.lineTo(m.x, m.y); c.stroke();
  }

  function ensureCache(scale: number): void {
    if (cache && cacheScale === scale) return;
    const cv = makeCanvas(Math.round(LOGICAL_W * scale), Math.round(LOGICAL_H * scale));
    const cc = cv && ctxOf(cv);
    if (!cv || !cc) { cache = null; cacheScale = scale; return; }
    cc.setTransform(scale, 0, 0, scale, 0, 0);
    cc.fillStyle = P.paper;
    cc.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    drawStatic(cc);
    cache = cv;
    cacheScale = scale;
  }

  function ensureGrain(c: Ctx): void {
    if (grainTried) return;
    grainTried = true;
    const n = DECOR.grainTile;
    const cv = makeCanvas(n, n);
    const gc = cv && ctxOf(cv);
    if (!cv || !gc) return;
    const img = gc.createImageData(n, n);
    const r = renderRng(DECOR.seed * 13);
    for (let i = 0; i < n * n; i++) {
      const v = 150 + Math.floor(r() * 105);
      img.data[i * 4] = v; img.data[i * 4 + 1] = v - 4; img.data[i * 4 + 2] = v - 10; img.data[i * 4 + 3] = 255;
    }
    gc.putImageData(img, 0, 0);
    grain = c.createPattern(cv as CanvasImageSource, 'repeat');
  }

  function drawMaple(c: Ctx, nowMs: number, reduceMotion: boolean): void {
    const m = DECOR.maple;
    const sway = reduceMotion ? 0 : Math.sin((nowMs / 1000 / m.swayPeriodS) * Math.PI * 2) * (m.swayDeg * Math.PI / 180);
    const lr = renderRng(91);
    const leaves = Array.from({ length: m.leaves }, (_, i) => {
      const a = (i / m.leaves) * Math.PI * 2 + lr() * 0.4;
      const d = i === 0 ? 0 : 14 + lr() * 14;
      return { x: Math.cos(a) * d, y: -22 + Math.sin(a) * d * 0.8, s: 16 + lr() * 6, rot: lr() * Math.PI * 2, col: LEAVES[i % 3] };
    });
    c.save();
    c.translate(m.x, m.y + 40);
    c.rotate(sway);
    c.translate(0, -40);
    for (const pass of [0, 1]) {
      for (const l of leaves) {
        c.save();
        c.translate(l.x + (pass ? 0 : SHADOW_OFFSET.x), l.y + (pass ? 0 : SHADOW_OFFSET.y));
        c.rotate(l.rot);
        c.beginPath(); c.moveTo(0, -l.s * 0.62); c.lineTo(l.s * 0.55, l.s * 0.38); c.lineTo(-l.s * 0.55, l.s * 0.38); c.closePath();
        c.fillStyle = pass ? l.col : P.shadow;
        c.fill();
        if (pass) { c.strokeStyle = 'rgba(251,247,238,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -l.s * 0.62); c.lineTo(0, l.s * 0.38); c.stroke(); }
        c.restore();
      }
    }
    c.restore();
  }

  function drawPond(c: Ctx, nowMs: number, reduceMotion: boolean): void {
    const pd = DECOR.pond;
    const period = pd.rippleEveryS * 1000;
    const t = (nowMs % period) / (pd.rippleDurS * 1000);
    if (t > 1) return;
    c.save();
    c.beginPath(); c.ellipse(pd.x, pd.y, pd.w / 2, pd.h / 2, 0, 0, Math.PI * 2); c.clip();
    const r = pd.rippleR0 + (pd.rippleR1 - pd.rippleR0) * (reduceMotion ? 0.5 : outCubic(t));
    c.strokeStyle = P.waterDeep;
    c.globalAlpha = reduceMotion ? 0.3 : 0.7 * (1 - t);
    c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(pd.x + 10, pd.y + 6, r, r * 0.8, 0, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  function drawPetals(c: Ctx, nowMs: number, reduceMotion: boolean, mul: number): void {
    const t = reduceMotion ? 0 : nowMs / 1000;
    for (let i = 0; i < Math.min(petals.length, DECOR.petals.count * mul); i++) {
      const p = petals[i];
      const span = FIELD.w + 40;
      const x = ((p.x + t * DECOR.petals.speed) % span) - 20;
      const y = HUD_TOP + 10 + (((p.y - HUD_TOP + t * DECOR.petals.speed * 0.45) % (LOGICAL_H - HUD_TOP - 10)) + (LOGICAL_H - HUD_TOP - 10)) % (LOGICAL_H - HUD_TOP - 10);
      const rot = p.rot + (reduceMotion ? 0 : Math.sin(t + p.phase) * 0.8);
      c.save();
      c.translate(x, y);
      // F-030: the hard shadow sits at the screen-space (+3,+4) like every other shadow (§4 Light, §16.15)
      c.fillStyle = P.shadow;
      c.beginPath(); c.ellipse(SHADOW_OFFSET.x, SHADOW_OFFSET.y, 4, 2.2, rot, 0, Math.PI * 2); c.fill();
      c.rotate(rot);
      c.fillStyle = PETAL;
      c.beginPath(); c.ellipse(0, 0, 4, 2.2, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = PETAL_DEEP; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(-3, 0); c.lineTo(3, 0); c.stroke();
      c.restore();
    }
  }

  function drawPool(c: Ctx, nowMs: number, dyn: GardenDynamic): void {
    const k = DECOR.inkwell;
    const s = dyn.poolScale;
    const cx = k.x + 22, cy = k.y + 2;
    c.save();
    c.translate(cx, cy);
    c.scale(s, s);
    c.beginPath();
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const r = 26 * (1 + 0.1 * Math.sin(5 * a + nowMs / 900) + 0.06 * Math.sin(3 * a + 1));
      const x = Math.cos(a) * r * 1.35, y = Math.sin(a) * r * 0.62;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
    c.fillStyle = dyn.poolDark > 0 ? mixHex(P.l1, P.knot, dyn.poolDark) : P.l1;
    c.globalAlpha = 0.86;
    c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(251,247,238,.35)';
    c.lineWidth = 1;
    c.beginPath(); c.ellipse(-8, -5, 12, 3, 0, Math.PI * 1.1, Math.PI * 1.8); c.stroke();
    c.restore();
  }

  function drawJar(c: Ctx, dyn: GardenDynamic): void {
    const j = DECOR.seedJar;
    const x = j.x - 30, y = j.y - 36, w = 60, h = 78;
    const body = (ox: number, oy: number): void => {
      c.beginPath();
      c.moveTo(x + 10 + ox, y + oy);
      c.lineTo(x + w - 10 + ox, y + oy);
      c.quadraticCurveTo(x + w + ox, y + 6 + oy, x + w + ox, y + 20 + oy);
      c.lineTo(x + w + ox, y + h - 8 + oy);
      c.quadraticCurveTo(x + w + ox, y + h + oy, x + w - 8 + ox, y + h + oy);
      c.lineTo(x + 8 + ox, y + h + oy);
      c.quadraticCurveTo(x + ox, y + h + oy, x + ox, y + h - 8 + oy);
      c.lineTo(x + ox, y + 20 + oy);
      c.quadraticCurveTo(x + ox, y + 6 + oy, x + 10 + ox, y + oy);
      c.closePath();
    };
    c.fillStyle = P.shadow; body(SHADOW_OFFSET.x, SHADOW_OFFSET.y); c.fill();
    c.fillStyle = GLASS; body(0, 0); c.fill();
    // seed fill = lives %
    const fill = Math.max(0, Math.min(1, dyn.jarFill));
    const top = y + 14 + (h - 18) * (1 - fill);
    c.save();
    body(0, 0); c.clip();
    c.fillStyle = P.seed;
    c.fillRect(x, top, w, y + h - top);
    c.fillStyle = '#557A39';
    for (let sy = y + h - 6; sy > top + 2; sy -= 6) for (let sx = x + 6 + ((sy / 6) % 2) * 4; sx < x + w - 4; sx += 9) { c.beginPath(); c.ellipse(sx, sy, 2.4, 1.6, 0.6, 0, Math.PI * 2); c.fill(); }
    if (fill > 0) { c.strokeStyle = 'rgba(251,247,238,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, top + 0.5); c.lineTo(x + w, top + 0.5); c.stroke(); }
    if (dyn.jarFlash > 0) { c.fillStyle = `rgba(194,59,59,${0.45 * dyn.jarFlash})`; c.fillRect(x, y, w, h); }
    c.restore();
    c.strokeStyle = P.waterDeep; c.lineWidth = 1.5; body(0, 0); c.stroke();
    c.strokeStyle = 'rgba(251,247,238,.9)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + 8, y + 22); c.lineTo(x + 8, y + h - 14); c.stroke();
    // kraft neck band (open mouth: leaks fall in)
    c.fillStyle = P.shadow; c.fillRect(x + 6 + SHADOW_OFFSET.x, y - 6 + SHADOW_OFFSET.y, w - 12, 9);
    c.fillStyle = P.kraft; c.fillRect(x + 6, y - 6, w - 12, 9);
    c.strokeStyle = P.kraftEdge; c.lineWidth = 1; c.strokeRect(x + 6.5, y - 5.5, w - 13, 8);
  }

  function drawInkwell(c: Ctx): void {
    const k = DECOR.inkwell;
    c.save();
    c.translate(k.x - 6, k.y - 4);
    c.rotate(-0.18);
    const shape = (ox: number, oy: number): void => {
      c.beginPath();
      c.moveTo(-46 + ox, -24 + oy);
      c.lineTo(14 + ox, -24 + oy);
      c.quadraticCurveTo(26 + ox, -24 + oy, 28 + ox, -12 + oy);
      c.lineTo(44 + ox, -10 + oy);
      c.lineTo(44 + ox, 12 + oy);
      c.lineTo(28 + ox, 14 + oy);
      c.quadraticCurveTo(26 + ox, 26 + oy, 14 + ox, 26 + oy);
      c.lineTo(-46 + ox, 26 + oy);
      c.closePath();
    };
    c.fillStyle = P.shadow; shape(SHADOW_OFFSET.x, SHADOW_OFFSET.y); c.fill();
    c.fillStyle = P.inkSoft; shape(0, 0); c.fill();
    c.fillStyle = P.kraft; c.fillRect(-30, -24, 26, 50);
    c.strokeStyle = P.kraftEdge; c.lineWidth = 1; c.strokeRect(-29.5, -23.5, 25, 49);
    c.strokeStyle = 'rgba(251,247,238,.7)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-44, -18); c.lineTo(10, -18); c.stroke();
    c.fillStyle = P.l1; c.beginPath(); c.ellipse(44, 1, 3, 10, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  return {
    groundCoversPaper() { return cache !== null; },
    drawPaper(c) {
      c.fillStyle = P.paper;
      c.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    },
    drawGround(c, nowMs, o) {
      if (o.alpha <= 0) return;
      ensureCache(o.scale);
      c.save();
      c.globalAlpha = o.alpha;
      const m = cache && typeof c.getTransform === 'function' ? (c.getTransform() as DOMMatrix | undefined) : undefined;
      if (cache && m && m.b === 0 && m.c === 0 && Math.abs(m.a - cacheScale) < 1e-9 && Math.abs(m.d - cacheScale) < 1e-9) {
        // 1:1 at a whole device pixel: the opaque cache copies on Skia's fast path
        c.setTransform(1, 0, 0, 1, Math.round(m.e), Math.round(m.f));
        c.drawImage(cache as CanvasImageSource, 0, 0);
        c.setTransform(m);
      } else if (cache) c.drawImage(cache as CanvasImageSource, 0, 0, LOGICAL_W, LOGICAL_H);
      else drawStatic(c);
      if (o.placing) {
        // §10.2: path edges brighten to --glow 40 %, no-build circles hatched 45° at 30 %
        c.save();
        c.globalAlpha = o.alpha * 0.4;
        tracePath(c);
        c.lineJoin = 'round';
        c.strokeStyle = P.glow;
        c.lineWidth = PATH_RIBBON_WIDTH + 8;
        c.stroke();
        c.restore();
        drawPathRibbon(c, P.kraftEdge);
        c.save();
        c.globalAlpha = o.alpha * 0.3;
        c.strokeStyle = P.inkSoft;
        c.lineWidth = 1.5;
        for (const z of NO_BUILD) {
          c.save();
          c.beginPath(); c.arc(z.x, z.y, z.r, 0, Math.PI * 2); c.clip();
          c.beginPath();
          for (let d = -z.r * 2; d < z.r * 2; d += 7) { c.moveTo(z.x + d - z.r, z.y + z.r); c.lineTo(z.x + d + z.r, z.y - z.r); }
          c.stroke();
          c.restore();
          c.beginPath(); c.arc(z.x, z.y, z.r, 0, Math.PI * 2); c.setLineDash([4, 4]); c.stroke(); c.setLineDash([]);
        }
        c.restore();
      }
      drawPond(c, nowMs, o.reduceMotion);
      drawPool(c, nowMs, o.dyn);
      drawJar(c, o.dyn);
      drawMaple(c, nowMs, o.reduceMotion);
      drawPetals(c, nowMs, o.reduceMotion, o.petals ?? 1);
      c.restore();
    },
    drawOccluders(c, alpha) {
      if (alpha <= 0) return;
      c.save();
      c.globalAlpha = alpha;
      drawInkwell(c);
      c.restore();
    },
    drawVignette(c) {
      if (ensureOverlays(c)) {
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (vigL) c.drawImage(vigL as CanvasImageSource, 0, 0);
        if (vigR) c.drawImage(vigR as CanvasImageSource, vigX1, 0);
        c.restore();
        return;
      }
      if (!vignette || vignetteCtx !== c) {
        const hd = Math.hypot(LOGICAL_W / 2, LOGICAL_H / 2);
        vignette = c.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 2, hd * 0.7, LOGICAL_W / 2, LOGICAL_H / 2, hd);
        vignette.addColorStop(0, 'rgba(28,26,36,0)');
        vignette.addColorStop(1, 'rgba(28,26,36,0.10)');
        vignetteCtx = c;
      }
      c.fillStyle = vignette;
      c.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    },
    drawGrain(c) {
      if (ensureOverlays(c)) {
        const cv = c.canvas as AnyCanvas;
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
        if (grainPat) { c.fillStyle = grainPat; c.fillRect(0, 0, cv.width, cv.height); }
        else if (grainFull) c.drawImage(grainFull as CanvasImageSource, 0, 0);
        c.restore();
        return;
      }
      ensureGrain(c);
      if (!grain) return;
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.globalAlpha = DECOR.grainAlpha;
      c.fillStyle = grain;
      c.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      c.restore();
    },
  };
}

export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number): number => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/** Ambient "breathing" helper for UI pulses (inOutSine ping-pong over `periodMs`). */
export function pulse(nowMs: number, periodMs: number): number {
  const t = (nowMs % periodMs) / periodMs;
  return inOutSine(t < 0.5 ? t * 2 : 2 - t * 2);
}
