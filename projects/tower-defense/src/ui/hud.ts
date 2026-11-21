// §9 HUD band + §11 feedback: seeds/sheets/round pills with fixed-advance digits, pause button, floating
// text (250-ms pop aggregation, spends, leaks, bonus flight), banners and hints, screen shake, the boss
// bar with tearing notches (§10.6), and the world cues the garden draws (spill pool, jar flash).
import type { BlotKind, Rect, Settings, SimEvent, SimState } from '../contracts/types';
import { HUD } from '../data/layout';
import { P } from '../data/palette';
import { BANNER, FLOAT_TEXT, MOTION, SHAKE } from '../data/feel';
import { BLOTS } from '../data/blots';
import { DECOR } from '../data/map';
import { ECONOMY } from '../data/economy';
import { FIRST_SEEN_LINES } from '../data/waves';
import { backOut, clamp01, type Ctx, displayFont, drawDigits, fmt, inQuad, outCubic, plate, renderRng, roundRectPath, tornRectPath, uiFont } from './draw';
import type { GardenDynamic } from './garden';

/** First-encounter lines for kinds the data does not voice (§14: once per kind, warm and bookish). */
const KIND_LINES: Partial<Record<BlotKind, string>> = {
  drop: 'A Drop peels into a Dot.',
  splat: 'Splats hold three layers.',
  splash: 'Splash ink runs quick.',
  blotch: 'Blotches go five layers deep.',
  streak: 'Streaks outrun slow quills.',
  knot: 'Knots take a long unpicking.',
};

interface Float { text: string; x: number; y: number; color: string; born: number; size: number }
interface Flight { value: number; born: number; x0: number; y0: number }
interface Shake { a: number; tau: number; born: number }
interface Torn { x: number; born: number; seed: number }

export interface HudView {
  state: Readonly<SimState>;
  settings: Readonly<Settings>;
  nowMs: number;
  /** Slide offset for the title→play transition (0 = in place). */
  offsetY: number;
  hoverPause: boolean;
}

/**
 * F-020: pill chips are born 6 px below the pill's bottom edge (anchor = text baseline), centred on the
 * digits, and rise the full 18 px into the pill as they fade: income visibly flows into the counter.
 */
export const SHEETS_ANCHOR = { x: HUD.sheets.x + 74, y: HUD.sheets.y + HUD.sheets.h + 6 + FLOAT_TEXT.size };
const SEEDS_ANCHOR = { x: HUD.seeds.x + 64, y: HUD.seeds.y + HUD.seeds.h + 6 + FLOAT_TEXT.size };
/** F-021: the death tear falls clear before "The Inkmaw tears!" folds in; banners sit below a live bar. */
export const BOSS_TEAR_MS = 450;
const BANNER_BELOW_BAR_Y = 132;

export interface Hud {
  onSimEvent(e: SimEvent, s: Readonly<SimState>, nowMs: number): void;
  /** Called once per sim step so leaks/pops landing in the same tick aggregate. */
  endStep(s: Readonly<SimState>, nowMs: number): void;
  update(dtMs: number, nowMs: number, s: Readonly<SimState>): void;
  /** Persistent tutorial hint shown when no event banner is active (§10.2). */
  setHint(text: string | null, nowMs: number): void;
  banner(text: string, nowMs: number): void;
  floatAt(text: string, x: number, y: number, color: string, nowMs: number): void;
  addShake(a: number, tau: number, nowMs: number): void;
  shakeOffset(nowMs: number, settings: Readonly<Settings>): { x: number; y: number };
  readonly garden: GardenDynamic;
  /** Displayed sheets (ticks toward the target; bonus counts on arrival, §16.13). */
  readonly shownMoney: number;
  readonly currentBanner: string | null;
  draw(c: Ctx, v: HudView): void;
  drawBossBar(c: Ctx, v: HudView): void;
  drawBanner(c: Ctx, v: HudView): void;
  drawFloats(c: Ctx, v: HudView): void;
  reset(s: Readonly<SimState>): void;
}

export function createHud(): Hud {
  let floats: Float[] = [];
  let flights: Flight[] = [];
  let shakes: Shake[] = [];
  let queue: string[] = [];
  let cur: { text: string; born: number } | null = null;
  let hint: { text: string; born: number } | null = null;
  let shownMoney: number = ECONOMY.startMoney;
  let tickTarget: number = ECONOMY.startMoney;
  let tickRate = 30;
  let deathBannerAt = -1e9;
  let popAcc = 0;
  let popWindowStart = -1;
  let leakAcc = 0;
  let seedsFlashAt = -1e9;
  let rumbleUntil = -1e9;
  let nextThud = 1e18;
  let poolPulseAt = -1e9;
  let warnAt = -1e9;
  let arriveAt = -1e9;
  // boss bar
  let bossShownAt = -1e9;
  let bossMax = 0;
  let bossName = 'INKMAW';
  let torn: Torn[] = [];
  let deathAt = -1e9;
  let lastBossHp = 0;
  const rnd = renderRng(5);
  const garden: GardenDynamic = { poolScale: 1, poolDark: 0, jarFill: 1, jarFlash: 0 };

  const inFlight = (): number => flights.reduce((n, f) => n + f.value, 0);

  function banner(text: string, now: number): void {
    if (cur && cur.text === text) return;
    if (queue.length < 4 && !queue.includes(text)) queue.push(text);
    if (!cur) { cur = { text: queue.shift()!, born: now }; }
  }
  function floatAt(text: string, x: number, y: number, color: string, now: number, size: number = FLOAT_TEXT.size): void {
    if (floats.length > 40) floats.shift();
    floats.push({ text, x, y, color, born: now, size });
  }
  function addShake(a: number, tau: number, now: number): void {
    if (shakes.length > 12) shakes.shift();
    shakes.push({ a, tau, born: now });
  }

  /** Banner baseline: §9 y 96, eased down to y 132 while the boss bar is up (it folds in/tears away). */
  function bannerY(now: number): number {
    if (bossShownAt < 0 || bossMax <= 0) return BANNER.y;
    const shown = outCubic((now - bossShownAt) / MOTION.foldMs);
    const gone = deathAt > 0 ? outCubic((now - deathAt) / BOSS_TEAR_MS) : 0;
    return BANNER.y + (BANNER_BELOW_BAR_Y - BANNER.y) * shown * (1 - gone);
  }

  const hud: Hud = {
    garden,
    get shownMoney() { return Math.round(shownMoney); },
    get currentBanner() { return cur ? cur.text : hint ? hint.text : null; },
    banner,
    floatAt,
    addShake,
    setHint(text, now) {
      if ((hint?.text ?? null) === text) return;
      hint = text ? { text, born: now } : null;
    },
    onSimEvent(e, s, now) {
      switch (e.type) {
        case 'money':
          if (e.reason === 'pop') { if (popWindowStart < 0) popWindowStart = now; popAcc += e.delta; }
          else if (e.reason === 'spend') floatAt(`−${fmt(Math.abs(e.delta))}`, SHEETS_ANCHOR.x, SHEETS_ANCHOR.y, P.bad, now);
          else if (e.reason === 'bonus') flights.push({ value: e.delta, born: now, x0: 540, y0: BANNER.y + 4 });
          break;
        case 'sell':
          floatAt(`+${fmt(e.refund)}`, e.x, e.y - 14, P.gold, now);
          break;
        case 'leak':
          leakAcc += e.livesLost;
          break;
        case 'roundStart':
          banner(`Round ${e.round}`, now);
          poolPulseAt = now;
          break;
        case 'roundClear':
          banner(`Round ${e.round} clear · +${fmt(e.bonus)}`, now);
          break;
        case 'firstSeen': {
          const line = e.pale ? FIRST_SEEN_LINES.pale : e.kind === 'inkmaw' ? null : FIRST_SEEN_LINES[e.kind] ?? KIND_LINES[e.kind];
          if (line) banner(line, now);
          break;
        }
        case 'bossWarning':
          banner(FIRST_SEEN_LINES.inkmaw ?? 'Something large is spilling.', now);
          warnAt = now;
          break;
        case 'bossArrive':
          bossShownAt = now; bossMax = e.maxHp; bossName = BLOTS.inkmaw.name.toUpperCase();
          torn = []; deathAt = -1e9; lastBossHp = e.maxHp;
          arriveAt = now;
          rumbleUntil = now + 1200;
          nextThud = now + 1200;
          break;
        case 'bossShed':
          torn.push({ x: e.threshold, born: now, seed: torn.length + 1 });
          addShake(SHAKE.bossShed.a, SHAKE.bossShed.tau, now);
          break;
        case 'bossDeath':
          deathAt = now;
          nextThud = 1e18;
          addShake(SHAKE.bossDeath.a, SHAKE.bossDeath.tau * 2.4, now);
          deathBannerAt = now + BOSS_TEAR_MS;
          break;
        case 'pop':
          if (e.kind === 'wax') addShake(SHAKE.waxCrack.a, SHAKE.waxCrack.tau, now);
          break;
        default:
          break;
      }
      void s;
    },
    endStep(s, now) {
      if (leakAcc > 0) {
        const big = leakAcc >= SHAKE.bigLeak.seeds;
        addShake(big ? SHAKE.bigLeak.a : SHAKE.leak.a, big ? SHAKE.bigLeak.tau : SHAKE.leak.tau, now);
        floatAt(`−${fmt(leakAcc)}`, DECOR.seedJar.x, DECOR.seedJar.y - 52, P.bad, now);
        floatAt(`−${fmt(leakAcc)}`, SEEDS_ANCHOR.x, SEEDS_ANCHOR.y, P.bad, now);
        seedsFlashAt = now;
        leakAcc = 0;
      }
      void s;
    },
    update(dt, now, s) {
      if (popWindowStart >= 0 && now - popWindowStart >= FLOAT_TEXT.windowMs) {
        if (popAcc > 0) floatAt(`+${fmt(popAcc)}`, SHEETS_ANCHOR.x, SHEETS_ANCHOR.y, P.gold, now);
        popAcc = 0; popWindowStart = -1;
      }
      floats = floats.filter((f) => now - f.born < FLOAT_TEXT.lifeMs);
      const arrived = flights.filter((f) => now - f.born >= FLOAT_TEXT.bonusFlyMs);
      if (arrived.length) flights = flights.filter((f) => now - f.born < FLOAT_TEXT.bonusFlyMs);
      shakes = shakes.filter((k) => now - k.born < k.tau * 6);
      if (deathBannerAt > 0 && now >= deathBannerAt) { deathBannerAt = -1e9; banner('The Inkmaw tears!', now); }
      if (cur && now - cur.born >= BANNER.ms) cur = queue.length ? { text: queue.shift()!, born: now } : null;
      // sheets tick linearly toward the target at max(30, Δ·8)/s, Δ taken when the target moves (F-027:
      // ≤ 125 ms for any change, no ease-out tail); in-flight bonus is excluded until it lands
      const target = s.money - inFlight();
      if (target !== tickTarget) { tickTarget = target; tickRate = Math.max(30, Math.abs(target - shownMoney) * 8); }
      const d = target - shownMoney;
      const step = tickRate * (dt / 1000);
      shownMoney = Math.abs(d) <= step ? target : shownMoney + Math.sign(d) * step;
      // boss thud every 1.2 s while it lives
      if (s.boss && now >= nextThud) { addShake(SHAKE.bossRumble.a, 120, now); nextThud = now + 1200; }
      if (!s.boss && deathAt < 0) nextThud = 1e18;
      if (s.boss) lastBossHp = s.boss.hp;
      // spill pool: round-start pulse, boss warning darkening
      const pp = clamp01((now - poolPulseAt) / 600);
      let scale = 1 + 0.15 * Math.sin(Math.PI * pp) * (pp < 1 ? 1 : 0);
      let dark = 0;
      const w = clamp01((now - warnAt) / 2000);
      if (now >= warnAt && warnAt > 0) {
        const relax = arriveAt > warnAt ? clamp01((now - arriveAt - 1500) / 1000) : 0;
        const k = outCubic(w) * (1 - relax);
        scale = Math.max(scale, 1 + 0.4 * k);
        dark = k;
      }
      garden.poolScale = scale;
      garden.poolDark = dark;
      garden.jarFill = s.lives / ECONOMY.startLives;
      garden.jarFlash = clamp01(1 - (now - seedsFlashAt) / MOTION.uiMs);
    },
    shakeOffset(now, settings) {
      if (settings.reduceMotion || settings.shake <= 0) return { x: 0, y: 0 };
      let a = 0;
      for (const k of shakes) a += k.a * Math.exp(-(now - k.born) / k.tau);
      if (now < rumbleUntil) a += SHAKE.bossRumble.a;
      if (a < 0.05) return { x: 0, y: 0 };
      const m = a * (settings.shake / 100);
      return { x: (rnd() * 2 - 1) * m, y: (rnd() * 2 - 1) * m };
    },
    reset(s) {
      floats = []; flights = []; shakes = []; queue = []; cur = null; hint = null;
      shownMoney = s.money; tickTarget = s.money; tickRate = 30; deathBannerAt = -1e9; popAcc = 0; popWindowStart = -1; leakAcc = 0;
      seedsFlashAt = -1e9; rumbleUntil = -1e9; nextThud = 1e18; poolPulseAt = -1e9; warnAt = -1e9; arriveAt = -1e9;
      bossShownAt = -1e9; torn = []; deathAt = -1e9; bossMax = 0;
      garden.poolScale = 1; garden.poolDark = 0; garden.jarFill = s.lives / ECONOMY.startLives; garden.jarFlash = 0;
    },
    draw(c, v) {
      const { state: s, nowMs: now } = v;
      c.save();
      c.translate(0, v.offsetY);
      // HUD band: a slightly deeper strip of paper with a torn lower edge
      c.fillStyle = 'rgba(230,217,190,.72)';
      tornRectPath(c, -4, -4, 1088, 66, 64, 2.5, 10, { t: false, r: false, b: true, l: false });
      c.fill();
      // seeds pill
      const flash = clamp01(1 - (now - seedsFlashAt) / MOTION.uiMs);
      const jx = flash > 0 ? Math.sin((now - seedsFlashAt) / 16) * 3 * flash : 0;
      pill(c, { ...HUD.seeds, x: HUD.seeds.x + jx }, flash);
      seedIcon(c, HUD.seeds.x + jx + 24, HUD.seeds.y + 20);
      c.fillStyle = flash > 0.5 ? P.bad : P.ink;
      c.font = uiFont(20);
      drawDigits(c, fmt(s.lives), HUD.seeds.x + jx + 44, HUD.seeds.y + 27, 20);
      // sheets pill (fixed rect; digits on a fixed advance — width never changes mid-tick, §16.1)
      pill(c, HUD.sheets, 0);
      sheetIcon(c, HUD.sheets.x + 24, HUD.sheets.y + 20);
      c.fillStyle = P.ink;
      c.font = uiFont(20);
      drawDigits(c, fmt(Math.round(shownMoney)), HUD.sheets.x + 44, HUD.sheets.y + 27, 20);
      // round pill
      pill(c, HUD.round, 0);
      c.font = uiFont(16);
      c.fillStyle = P.ink;
      c.textAlign = 'center';
      const rt = s.phase === 'intermission' ? `Round ${s.round} — ready` : `Round ${s.round} / ${ECONOMY.rounds}`;
      c.fillText(rt, HUD.round.x + HUD.round.w / 2, HUD.round.y + 26);
      c.textAlign = 'left';
      // pause button: two paper bars
      const pb = HUD.pause;
      plate(c, pb, 8, v.hoverPause ? P.foldWhite : P.paper, { lift: v.hoverPause ? 1 : 0 });
      c.fillStyle = P.ink;
      const ly = v.hoverPause ? 1 : 0;
      c.fillRect(pb.x + 15, pb.y + 11 - ly, 5, 18);
      c.fillRect(pb.x + 24, pb.y + 11 - ly, 5, 18);
      c.restore();
    },
    drawBossBar(c, v) {
      const now = v.nowMs;
      if (bossShownAt < 0 || bossMax <= 0) return;
      const r = HUD.bossBar;
      const dying = deathAt > 0;
      const td = dying ? (now - deathAt) / BOSS_TEAR_MS : 0;
      if (td >= 1) return;
      const fold = backOut(clamp01((now - bossShownAt) / MOTION.foldMs));
      const hp = v.state.boss ? v.state.boss.hp : dying ? 0 : lastBossHp;
      const frac = clamp01(hp / bossMax);
      c.save();
      c.translate(0, v.offsetY);
      c.font = uiFont(16);
      c.fillStyle = P.ink;
      c.textAlign = 'center';
      c.globalAlpha = (1 - td) * clamp01((now - bossShownAt) / MOTION.foldMs);
      c.fillText(`${bossName} ${fmt(Math.ceil(hp))}`, r.x + r.w / 2, r.y - 4);
      c.globalAlpha = 1;
      c.textAlign = 'left';
      const halves = dying ? [0, 1] : [-1];
      for (const half of halves) {
        c.save();
        let clipX = r.x - 6, clipW = r.w + 12;
        if (half >= 0) {
          const fall = inQuad(td) * 120;
          const cx = r.x + r.w / 2;
          clipX = half === 0 ? r.x - 6 : cx; clipW = r.w / 2 + 6;
          c.translate(cx, r.y);
          c.rotate((half === 0 ? -1 : 1) * td * 0.5);
          c.translate(-cx + (half === 0 ? -1 : 1) * td * 18, -r.y + fall);
          c.globalAlpha = 1 - td * 0.6;
        }
        c.beginPath(); c.rect(clipX, r.y - 8, clipW, r.h + 20); c.clip();
        c.translate(0, r.y);
        c.scale(1, fold);
        c.translate(0, -r.y);
        plate(c, r, 4, P.ink, { stroke: null });
        const low = frac < 0.1 && !dying;
        const pulseK = low ? 0.5 + 0.5 * Math.sin(now / 120) : 0;
        c.fillStyle = low ? mix(P.maw, P.bad, pulseK) : P.maw;
        roundRectPath(c, r.x + 3, r.y + 3, Math.max(0, (r.w - 6) * frac), r.h - 6, 2);
        c.fill();
        // notches at 75 / 50 / 25 % (§16.17); torn ones are gone from the bar
        for (const t of [0.75, 0.5, 0.25]) {
          if (torn.some((k) => Math.abs(k.x - t) < 1e-6)) continue;
          const nx = r.x + 3 + (r.w - 6) * t;
          c.fillStyle = P.paper;
          c.beginPath(); c.moveTo(nx - 5, r.y - 1); c.lineTo(nx + 5, r.y - 1); c.lineTo(nx, r.y + 7); c.closePath(); c.fill();
        }
        if (half === 1 || half === 0) {
          c.strokeStyle = P.paper; c.lineWidth = 2;
          const cx = r.x + r.w / 2;
          c.beginPath(); c.moveTo(cx - 3, r.y); c.lineTo(cx + 3, r.y + 6); c.lineTo(cx - 2, r.y + 12); c.lineTo(cx + 2, r.y + r.h); c.stroke();
        }
        c.restore();
      }
      // torn notch tabs fall away (400 ms)
      for (const k of torn) {
        const t = (now - k.born) / 400;
        if (t >= 1) continue;
        const nx = r.x + 3 + (r.w - 6) * k.x;
        c.save();
        c.translate(nx + t * 10, r.y + inQuad(t) * 60);
        c.rotate(t * 2.4);
        c.globalAlpha = 1 - t;
        c.fillStyle = P.paper;
        c.beginPath(); c.moveTo(-6, -2); c.lineTo(6, -2); c.lineTo(0, 9); c.closePath(); c.fill();
        c.strokeStyle = P.ink; c.lineWidth = 1; c.stroke();
        c.restore();
      }
      c.restore();
    },
    drawBanner(c, v) {
      const now = v.nowMs;
      let text: string | null = null, born = 0, ms = Infinity;
      if (cur) { text = cur.text; born = cur.born; ms = BANNER.ms; }
      else if (hint) { text = hint.text; born = hint.born; }
      if (!text) return;
      const age = now - born;
      const tin = clamp01(age / BANNER.inMs);
      const tout = ms === Infinity ? 0 : clamp01((age - (ms - BANNER.outMs)) / BANNER.outMs);
      const a = outCubic(tin) * (1 - inQuad(tout));
      if (a <= 0) return;
      c.save();
      c.font = displayFont(BANNER.size);
      const w = Math.min(980, c.measureText(text).width + 48);
      const h = 44;
      const y = bannerY(now) + v.offsetY + (v.settings.reduceMotion ? 0 : (1 - outCubic(tin)) * -8 + inQuad(tout) * -6);
      c.globalAlpha = a;
      plate(c, { x: 540 - w / 2, y: y - h / 2, w, h }, 6, P.ink, { stroke: null });
      c.fillStyle = P.foldWhite;
      c.textAlign = 'center';
      c.fillText(text, 540, y + 9);
      c.restore();
    },
    drawFloats(c, v) {
      const now = v.nowMs;
      const rm = v.settings.reduceMotion;
      c.save();
      for (const f of floats) {
        const t = (now - f.born) / FLOAT_TEXT.lifeMs;
        const fadeStart = 1 - FLOAT_TEXT.fadeMs / FLOAT_TEXT.lifeMs;
        c.globalAlpha = t < fadeStart ? 1 : clamp01(1 - (t - fadeStart) / (1 - fadeStart));
        const y = f.y - (rm ? 0 : outCubic(t) * FLOAT_TEXT.risePx);
        c.font = uiFont(f.size, 700);
        floatText(c, f.text, f.x, y, f.color, f.size);
      }
      for (const fl of flights) {
        const t = outCubic((now - fl.born) / FLOAT_TEXT.bonusFlyMs);
        const x = fl.x0 + (SHEETS_ANCHOR.x - fl.x0) * t;
        const y = fl.y0 + 34 + (HUD.sheets.y + 26 - fl.y0 - 34) * t;
        c.globalAlpha = 1;
        c.font = uiFont(16, 700);
        floatText(c, `+${fmt(fl.value)}`, x, y, P.gold, 16);
      }
      c.restore();
    },
  };
  return hud;
}

/** Floating chip (§11): bare digits with a 1-px --fold-white halo so they read on any ground (F-020). */
function floatText(c: Ctx, text: string, x: number, y: number, color: string, size: number): void {
  c.strokeStyle = P.foldWhite;
  c.lineWidth = 2;
  c.lineJoin = 'round';
  c.fillStyle = color;
  drawDigits(c, text, x, y, size, 'center', true);
}

function pill(c: Ctx, r: Rect, flash: number): void {
  plate(c, r, 20, P.foldWhite);
  if (flash > 0) {
    c.fillStyle = `rgba(194,59,59,${0.35 * flash})`;
    roundRectPath(c, r.x, r.y, r.w, r.h, 20);
    c.fill();
  }
}

function seedIcon(c: Ctx, x: number, y: number): void {
  c.strokeStyle = P.seed; c.lineWidth = 2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y + 10); c.quadraticCurveTo(x - 1, y, x + 2, y - 8); c.stroke();
  c.fillStyle = P.seed;
  for (const [dx, dy, a] of [[-5, -2, -0.7], [5, -5, 0.7], [-4, 5, -0.5]] as const) {
    c.beginPath(); c.ellipse(x + dx, y + dy, 5, 2.6, a, 0, Math.PI * 2); c.fill();
  }
}

function sheetIcon(c: Ctx, x: number, y: number): void {
  c.fillStyle = P.shadow;
  c.fillRect(x - 8 + 2, y - 10 + 2, 16, 20);
  c.fillStyle = P.gold;
  c.beginPath(); c.moveTo(x - 8, y - 10); c.lineTo(x + 3, y - 10); c.lineTo(x + 8, y - 5); c.lineTo(x + 8, y + 10); c.lineTo(x - 8, y + 10); c.closePath(); c.fill();
  c.fillStyle = P.foldWhite;
  c.beginPath(); c.moveTo(x + 3, y - 10); c.lineTo(x + 3, y - 5); c.lineTo(x + 8, y - 5); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(251,247,238,.7)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.moveTo(x - 5, y + 4); c.lineTo(x + 3, y + 4); c.stroke();
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number): number => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

