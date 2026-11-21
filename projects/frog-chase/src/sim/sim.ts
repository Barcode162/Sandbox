/**
 * The simulation (§4.2–§4.5, §4.7). OWNER: WO-002.
 * Contract: step(state, input) mutates `state` deterministically from (state, input) alone.
 * No Date, Math.random, DOM or globals. Events are appended to state.log.
 *
 * Order inside one tick (t = tick after increment):
 *   1. frog timers: squash → air; air → LAND (gain, kind effects, flank judge, win); soggy window; curl flip
 *   2. the press: hop / retarget / buffer / drop
 *   3. gator: g -= dt (held at 0 airborne → near-miss), eaten if g ≤ 0 grounded, flank start/arm
 *   4. gator body: spring head toward the trail point, chain the body, turn the heading
 *   5. pad timers and choices
 *
 * Semantics the other slices read:
 *   - `land.g` is g at touchdown, BEFORE the landing gain (the value the near-miss rule judges).
 *   - Curl: frog phase is `flung` from the landing tick (no input); the throw is the `flip` event, at
 *     landTick + ticks(curlTiltMs), which is also the `sunk` tick.
 *   - Soggy: frog stays `idle` (it may hop) for ticks(soggyEscapeMs) after landing; the tick after, it
 *     becomes `sinking` and the run is `sunk`. The pad is `sinking` from the landing, `sunk` at +soggySinkMs.
 *   - Flank: gator phase `surfacing` with `flank.armed = false` is the 250 ms telegraph; `flanking` once armed.
 *     A hop that STARTS toward the pad before it is armed clears the flank (F2).
 *   - Hook: gator `surfacing` for HOOK_SURFACE_MS with flank === null, then `chasing`.
 */
import type { Choice, Pad, PadState, ResultCause, RunResult, SimEvent, SimState, Slot, TickInput, Tuning, Vec2 } from '../contracts';
import { DT, makeTuning, ticks, ticksToMs } from '../tuning';
import { generateRiver } from './generator';

/** Lily dip after landing (§4.2, 180 ms). */
export const DIP_MS = 180;
/** How long the gator surfaces at the hook before it chases (render reveal). */
export const HOOK_SURFACE_MS = 500;
/** Heading turn rate toward the frog's hop target, s⁻¹ (the head turns first; the body follows by distance constraints). */
export const HEADING_RATE = 30;
/** Head dormant spot: this far south of the south bank (wu). */
export const DORMANT_DEPTH = 40;

/** Private per-run bookkeeping kept on the state object (not part of the contract; read via helpers). */
interface Internal {
  /** Tick counts of the ms tunables, computed once per run. */
  T: {
    squash: number;
    land: number;
    buffer: number;
    retarget: number;
    escape: number;
    soggySink: number;
    curlTilt: number;
    lunge: number;
    flankTele: number;
    dip: number;
    hookSurface: number;
  };
  /** Heartbeat accumulator in beats (integrated from τ every tick, polish 14). */
  beat: number;
  hooked: boolean;
  /** A near-miss event was already logged for the current hop. */
  nearMissLogged: boolean;
  /** Soggy pad currently sinking under or behind the frog, or -1. */
  soggyPad: number;
  /** Lunge start point (eaten). */
  lungeFrom: Vec2;
}

type Sim = SimState & { _sim: Internal };
const inside = (s: SimState): Internal => (s as Sim)._sim;

export function createSim(seed: number, patch?: Partial<Tuning>): SimState {
  const tuning = makeTuning(patch);
  const river = generateRiver(seed, tuning);
  const bank = river.layers[0]![0]!;
  const start: Vec2 = { x: bank.x, y: bank.y };
  const below = (dy: number): Vec2 => ({ x: start.x, y: start.y - dy });
  const body: Vec2[] = Array.from({ length: tuning.bodySegments }, (_, i) => below(DORMANT_DEPTH + (i + 1) * tuning.bodySpacing));
  const T: Internal['T'] = {
    squash: ticks(tuning.squashMs),
    land: ticks(tuning.squashMs) + ticks(tuning.airMs),
    buffer: ticks(tuning.bufferMs),
    retarget: ticks(tuning.retargetMs),
    escape: ticks(tuning.soggyEscapeMs),
    soggySink: ticks(tuning.soggySinkMs),
    curlTilt: ticks(tuning.curlTiltMs),
    lunge: ticks(tuning.lungeMs),
    flankTele: ticks(tuning.flankTelegraphMs),
    dip: ticks(DIP_MS),
    hookSurface: ticks(HOOK_SURFACE_MS),
  };
  const s: Sim = {
    tuning,
    river,
    tick: 0,
    timerStartTick: null,
    frog: { phase: 'idle', since: 0, padId: bank.id, targetId: bank.id, slot: 'F', hopTick: -1, landTick: -1, buffer: null, layer: 0 },
    gator: {
      phase: 'dormant', since: 0, g: tuning.gMax, tau: tauOf(tuning.gMax, tuning),
      head: below(DORMANT_DEPTH), headPrev: below(DORMANT_DEPTH), headVel: { x: 0, y: 0 }, heading: Math.PI / 2,
      body, bodyPrev: body.map((p) => ({ ...p })), flank: null, lastFlankLayer: -Infinity,
    },
    padStates: river.pads.map(() => ({ state: 'idle' as PadState, since: 0 })),
    choices: [],
    trail: [start],
    trailArc: [0],
    result: null,
    log: [],
    _sim: { T, beat: 0, hooked: false, nearMissLogged: false, soggyPad: -1, lungeFrom: { x: 0, y: 0 } },
  };
  refreshChoices(s);
  return s;
}

function tauOf(g: number, t: Tuning): number {
  return Math.min(1, Math.max(0, 1 - g / t.tauSpan));
}

/**
 * §4.5 slot mapping for the layer after `from`. Left = westmost, Right = eastmost; in a 3-pad layer Forward
 * is the middle pad; in a 2-pad layer Forward is the pad with the smallest |dx| from the frog (ties → west)
 * and it also answers its side key; a 1-pad layer (the bank) answers every key.
 */
export function choicesFrom(river: SimState['river'], from: Pad): Choice[] {
  const next = river.layers[from.layer + 1];
  if (!next || next.length === 0) return [];
  if (next.length === 1) return [{ slot: 'F', padId: next[0]!.id, alsoAnswers: ['L', 'R'] }];
  if (next.length === 3) return next.map((p, i) => ({ slot: (['L', 'F', 'R'] as const)[i]!, padId: p.id, alsoAnswers: [] }));
  const [a, b] = next as readonly [Pad, Pad];
  const fwdIsA = Math.abs(a.x - from.x) <= Math.abs(b.x - from.x);
  return fwdIsA
    ? [{ slot: 'F', padId: a.id, alsoAnswers: ['L'] }, { slot: 'R', padId: b.id, alsoAnswers: [] }]
    : [{ slot: 'L', padId: a.id, alsoAnswers: [] }, { slot: 'F', padId: b.id, alsoAnswers: ['R'] }];
}

/** §4.5 slot mapping for the frog's next layer. Pure helper; also used by bots and touch input. */
export function choicesFor(s: SimState): Choice[] {
  return choicesFrom(s.river, s.river.pads[s.frog.padId]!);
}

/** Pad a slot selects from pad `from` (no allocation for 2/3-pad layers). */
function resolve(river: SimState['river'], from: Pad, slot: Slot): number | null {
  const next = river.layers[from.layer + 1];
  if (!next || next.length === 0) return null;
  if (next.length === 1) return next[0]!.id;
  if (next.length === 3) return next[slot === 'L' ? 0 : slot === 'F' ? 1 : 2]!.id;
  const a = next[0]!, b = next[1]!;
  if (slot === 'L') return a.id;
  if (slot === 'R') return b.id;
  return Math.abs(a.x - from.x) <= Math.abs(b.x - from.x) ? a.id : b.id;
}

function setPad(s: SimState, id: number, state: PadState): void {
  const p = s.padStates[id]!;
  if (p.state !== state) {
    p.state = state;
    p.since = s.tick;
  }
}

function emit(s: SimState, e: SimEvent): void {
  s.log.push(e);
}

/**
 * Recompute chips and `reachable` states (only on frog/flank transitions, never per idle tick).
 * `flanked` is gator-owned: it stays on the armed pad through squash and air (a retarget can still pick it,
 * F-004) and only clearFlank or an eaten-still lunge removes it.
 */
function refreshChoices(s: SimState): void {
  for (const c of s.choices) if (s.padStates[c.padId]!.state === 'reachable') setPad(s, c.padId, 'idle');
  if (s.result || s.frog.phase !== 'idle') {
    s.choices = [];
    return;
  }
  s.choices = choicesFor(s);
  const f = s.gator.flank;
  for (const c of s.choices) setPad(s, c.padId, f && f.armed && f.padId === c.padId ? 'flanked' : 'reachable');
}

function finish(s: SimState, kind: RunResult['kind'], cause: ResultCause, culpritId: number | null): void {
  const t = s.tick;
  s.result = {
    kind,
    cause,
    tick: t,
    timeMs: s.timerStartTick === null ? 0 : ticksToMs(t - s.timerStartTick),
    layer: Math.min(s.frog.layer, s.tuning.layers),
    culpritId,
  };
  s.frog.buffer = null;
  refreshChoices(s);
}

function setFrog(s: SimState, phase: SimState['frog']['phase']): void {
  s.frog.phase = phase;
  s.frog.since = s.tick;
}

function setGator(s: SimState, phase: SimState['gator']['phase']): void {
  if (s.gator.phase !== phase) {
    s.gator.phase = phase;
    s.gator.since = s.tick;
  }
}

function clearFlank(s: SimState): void {
  const f = s.gator.flank;
  if (!f) return;
  emit(s, { t: 'flankClear', tick: s.tick, pad: f.padId });
  if (s.padStates[f.padId]!.state === 'flanked') setPad(s, f.padId, 'idle');
  s.gator.flank = null;
  if (s.gator.phase === 'surfacing' || s.gator.phase === 'flanking') setGator(s, 'chasing');
}

function startHop(s: SimState, slot: Slot, buffered: boolean): void {
  const fr = s.frog;
  const from = s.river.pads[fr.padId]!;
  const to = resolve(s.river, from, slot);
  if (to === null) return;
  const x = inside(s);
  const t = s.tick;
  if (s.timerStartTick === null) {
    s.timerStartTick = t;
    emit(s, { t: 'timerStart', tick: t });
  }
  emit(s, { t: 'hop', tick: t, from: fr.padId, to, slot, buffered });
  if (x.soggyPad === fr.padId && fr.landTick >= 0 && t - fr.landTick <= x.T.escape) emit(s, { t: 'escape', tick: t, pad: fr.padId });
  // F2: judged when the hop starts. Before arming, the gator misses.
  const f = s.gator.flank;
  if (f && !f.armed && f.padId === to) clearFlank(s);
  const st = s.padStates[fr.padId]!.state;
  if (st === 'occupied' || st === 'dipping') setPad(s, fr.padId, 'idle');
  fr.targetId = to;
  fr.slot = slot;
  fr.hopTick = t;
  fr.buffer = null;
  x.nearMissLogged = false;
  setFrog(s, 'squash');
  refreshChoices(s);
}

function land(s: SimState): void {
  const fr = s.frog;
  const g = s.gator;
  const x = inside(s);
  const tn = s.tuning;
  const t = s.tick;
  const pad = s.river.pads[fr.targetId]!;
  fr.padId = pad.id;
  fr.landTick = t;
  fr.layer = Math.max(fr.layer, pad.layer);
  const last = s.trail[s.trail.length - 1]!;
  s.trail.push({ x: pad.x, y: pad.y });
  s.trailArc.push(s.trailArc[s.trailArc.length - 1]! + Math.hypot(pad.x - last.x, pad.y - last.y));

  const gTouch = g.g;
  const nearMiss = x.hooked && (x.nearMissLogged || gTouch < tn.nearMissG);
  emit(s, { t: 'land', tick: t, pad: pad.id, layer: pad.layer, kind: pad.kind, g: gTouch, nearMiss });
  if (nearMiss && !x.nearMissLogged) {
    emit(s, { t: 'nearMiss', tick: t, g: gTouch });
    x.nearMissLogged = true;
  }
  setFrog(s, 'idle');

  // Flank judge: landing on an armed flanked pad is eaten; any other landing clears the flank.
  const f = g.flank;
  if (f && f.armed && f.padId === pad.id) {
    emit(s, { t: 'eaten', tick: t, cause: 'flank' });
    eat(s);
    finish(s, 'eaten', 'flank', pad.id);
    return;
  }
  if (f) clearFlank(s);

  if (pad.kind === 'bank') {
    emit(s, { t: 'win', tick: t, timeMs: s.timerStartTick === null ? 0 : ticksToMs(t - s.timerStartTick) });
    setFrog(s, 'won');
    setGator(s, 'retreating');
    finish(s, 'won', 'win', null);
    return;
  }

  // Gap (§4.3): the hook starts the chase; later landings add gain (g held at 0 if it ran out airborne).
  if (!x.hooked && pad.layer >= tn.hookLayer) {
    x.hooked = true;
    g.g = tn.g0;
    emit(s, { t: 'hook', tick: t });
    setGator(s, 'surfacing');
  } else if (x.hooked) {
    const gain = tn.gainBase + tn.gainRubber * (1 - gTouch / tn.gMax);
    g.g = Math.min(tn.gMax, gTouch + gain);
  }
  g.tau = tauOf(g.g, tn);

  if (pad.kind === 'lily') setPad(s, pad.id, 'dipping');
  else if (pad.kind === 'soggy') {
    setPad(s, pad.id, 'sinking');
    x.soggyPad = pad.id;
    emit(s, { t: 'sinkStart', tick: t, pad: pad.id });
  } else if (pad.kind === 'curl') {
    setPad(s, pad.id, 'flipping');
    emit(s, { t: 'tilt', tick: t, pad: pad.id });
    setFrog(s, 'flung');
  }
}

function eat(s: SimState): void {
  const x = inside(s);
  x.lungeFrom = { x: s.gator.head.x, y: s.gator.head.y };
  setFrog(s, 'eaten');
  setGator(s, 'lunging');
  const f = s.gator.flank;
  // Eaten on the flank: the pad keeps `flanked` (it is the culprit). Eaten standing still: the flank lets go.
  if (f && f.padId !== s.frog.padId && s.padStates[f.padId]!.state === 'flanked') setPad(s, f.padId, 'idle');
  s.gator.flank = null;
}

function frogTimers(s: SimState): void {
  const fr = s.frog;
  const x = inside(s);
  const t = s.tick;
  if (fr.phase === 'squash' && t - fr.hopTick >= x.T.squash) setFrog(s, 'air');
  if (fr.phase === 'air' && t - fr.hopTick >= x.T.land) {
    const buf = fr.buffer;
    fr.buffer = null;
    land(s);
    if (buf && (fr.phase as string) === 'idle' && !s.result) startHop(s, buf.slot, true);
    else refreshChoices(s);
  }
  if (s.result) return;
  if (fr.phase === 'idle' && x.soggyPad === fr.padId && t - fr.landTick > x.T.escape) {
    setFrog(s, 'sinking');
    emit(s, { t: 'sunk', tick: t, pad: fr.padId, kind: 'soggy' });
    finish(s, 'sunk', 'soggy', fr.padId);
    return;
  }
  if (fr.phase === 'flung' && t - fr.landTick >= x.T.curlTilt) {
    emit(s, { t: 'flip', tick: t, pad: fr.padId });
    emit(s, { t: 'sunk', tick: t, pad: fr.padId, kind: 'curl' });
    finish(s, 'sunk', 'curl', fr.padId);
  }
}

function handlePress(s: SimState, slot: Slot): void {
  if (s.result) return;
  const fr = s.frog;
  const x = inside(s);
  const t = s.tick;
  if (fr.phase === 'idle') {
    startHop(s, slot, false);
    return;
  }
  if (fr.phase === 'squash' && t - fr.hopTick <= x.T.retarget) {
    const to = resolve(s.river, s.river.pads[fr.padId]!, slot);
    if (to === null || to === fr.targetId) return; // a duplicate or an alias of the same pad: harmless
    const f = s.gator.flank;
    if (f && !f.armed && f.padId === to) clearFlank(s);
    fr.targetId = to;
    fr.slot = slot;
    emit(s, { t: 'retarget', tick: t, to, slot });
    return;
  }
  if (fr.phase === 'squash' || fr.phase === 'air') {
    // Buffer: the latest press within bufferMs before the landing tick wins; earlier presses are dropped.
    if (fr.hopTick + x.T.land - t <= x.T.buffer) fr.buffer = { slot, tick: t };
  }
}

function gatorGap(s: SimState): void {
  const g = s.gator;
  const fr = s.frog;
  const x = inside(s);
  const tn = s.tuning;
  if (!x.hooked || s.result) return;
  const airborne = fr.phase === 'squash' || fr.phase === 'air';
  g.g -= DT;
  if (g.g <= 0) {
    if (airborne) {
      g.g = 0;
      if (!x.nearMissLogged) {
        x.nearMissLogged = true;
        emit(s, { t: 'nearMiss', tick: s.tick, g: 0 });
      }
    } else if (fr.phase === 'idle') {
      g.g = 0;
      g.tau = tauOf(0, tn);
      emit(s, { t: 'eaten', tick: s.tick, cause: 'still' });
      eat(s);
      finish(s, 'eaten', 'still', null);
      return;
    }
  }
  g.tau = tauOf(g.g, tn);
  if (g.phase === 'surfacing' && !g.flank && s.tick - g.since >= x.T.hookSurface) setGator(s, 'chasing');

  // Flank (§4.3): arm after the telegraph, or start one while the frog stands and the gap is short.
  const f = g.flank;
  if (f) {
    if (!f.armed && s.tick - f.startTick >= x.T.flankTele) {
      f.armed = true;
      setGator(s, 'flanking');
      emit(s, { t: 'flankArmed', tick: s.tick, pad: f.padId });
      setPad(s, f.padId, 'flanked');
    }
    return;
  }
  if (fr.phase !== 'idle' || g.g >= tn.flankG || g.phase === 'surfacing') return;
  const nextLayer = fr.layer + 1;
  if (nextLayer < tn.flankFromLayer || nextLayer > tn.layers || nextLayer - g.lastFlankLayer < tn.flankEvery) return;
  const padId = resolve(s.river, s.river.pads[fr.padId]!, fr.slot);
  if (padId === null) return;
  // F1: the layer must keep another safe, unflanked pad.
  const layer = s.river.layers[nextLayer]!;
  if (!layer.some((p) => p.id !== padId && p.kind === 'lily')) return;
  g.flank = { padId, startTick: s.tick, armed: false };
  g.lastFlankLayer = nextLayer;
  setGator(s, 'surfacing');
  emit(s, { t: 'flankStart', tick: s.tick, pad: padId });
}

/** Point on the frog's path at arc length a; the in-flight hop extends the trail as a virtual last segment. */
function pathPoint(s: SimState, a: number, out: Vec2): void {
  const tr = s.trail, arc = s.trailArc;
  const n = tr.length;
  if (a <= 0) {
    out.x = tr[0]!.x;
    out.y = tr[0]!.y;
    return;
  }
  if (a >= arc[n - 1]!) {
    const last = tr[n - 1]!;
    const tp = s.river.pads[s.frog.targetId]!;
    const len = Math.hypot(tp.x - last.x, tp.y - last.y);
    const u = len > 0 ? Math.min(1, (a - arc[n - 1]!) / len) : 0;
    out.x = last.x + (tp.x - last.x) * u;
    out.y = last.y + (tp.y - last.y) * u;
    return;
  }
  let i = n - 1;
  while (i > 0 && arc[i - 1]! > a) i--;
  const p = tr[i - 1]!, q = tr[i]!;
  const seg = arc[i]! - arc[i - 1]!;
  const u = seg > 0 ? (a - arc[i - 1]!) / seg : 0;
  out.x = p.x + (q.x - p.x) * u;
  out.y = p.y + (q.y - p.y) * u;
}

/** Frog position in the sim (pad centre, or the straight line of the current hop). */
function frogPos(s: SimState, out: Vec2): void {
  const fr = s.frog;
  const a = s.river.pads[fr.padId]!;
  if (fr.phase === 'squash' || fr.phase === 'air') {
    const b = s.river.pads[fr.targetId]!;
    const u = Math.min(1, Math.max(0, (s.tick - fr.hopTick - inside(s).T.squash) / (inside(s).T.land - inside(s).T.squash)));
    out.x = a.x + (b.x - a.x) * u;
    out.y = a.y + (b.y - a.y) * u;
  } else {
    out.x = a.x;
    out.y = a.y;
  }
}

const tmpTarget: Vec2 = { x: 0, y: 0 };
const tmpFrog: Vec2 = { x: 0, y: 0 };

function gatorBody(s: SimState): void {
  const g = s.gator;
  const x = inside(s);
  const tn = s.tuning;
  g.headPrev.x = g.head.x;
  g.headPrev.y = g.head.y;
  for (let i = 0; i < g.body.length; i++) {
    g.bodyPrev[i]!.x = g.body[i]!.x;
    g.bodyPrev[i]!.y = g.body[i]!.y;
  }
  frogPos(s, tmpFrog);
  if (g.phase === 'dormant') return;
  if (g.phase === 'lunging' || g.phase === 'sated') {
    const u = Math.min(1, (s.tick - g.since + (g.phase === 'sated' ? x.T.lunge : 0)) / Math.max(1, x.T.lunge));
    g.head.x = x.lungeFrom.x + (tmpFrog.x - x.lungeFrom.x) * u;
    g.head.y = x.lungeFrom.y + (tmpFrog.y - x.lungeFrom.y) * u;
    g.headVel.x = 0;
    g.headVel.y = 0;
    if (g.phase === 'lunging' && s.tick - g.since >= x.T.lunge) setGator(s, 'sated');
  } else if (g.phase !== 'retreating') {
    // Head target on the trail, (0.9 + 1.6·g/gMax)·P behind the frog, on a critically damped spring.
    const fr = s.frog;
    const n = s.trail.length;
    let frogArc = s.trailArc[n - 1]!;
    if (fr.phase === 'squash' || fr.phase === 'air') {
      const last = s.trail[n - 1]!;
      frogArc += Math.hypot(tmpFrog.x - last.x, tmpFrog.y - last.y);
    }
    pathPoint(s, Math.max(0, frogArc - (0.9 + (1.6 * g.g) / tn.gMax) * tn.pitch), tmpTarget);
    const w = tn.headOmega;
    g.headVel.x += (w * w * (tmpTarget.x - g.head.x) - 2 * w * g.headVel.x) * DT;
    g.headVel.y += (w * w * (tmpTarget.y - g.head.y) - 2 * w * g.headVel.y) * DT;
    g.head.x += g.headVel.x * DT;
    g.head.y += g.headVel.y * DT;
  }
  // Heading turns first (polish 13): it looks where the frog is going (the hop target from the squash on);
  // segments only follow by distance constraints as the head moves.
  const look = s.river.pads[s.frog.targetId]!;
  const want = Math.atan2(look.y - g.head.y, look.x - g.head.x);
  let d = want - g.heading;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  g.heading += d * Math.min(1, HEADING_RATE * DT);
  let px = g.head.x, py = g.head.y;
  for (const seg of g.body) {
    const dx = seg.x - px, dy = seg.y - py;
    const len = Math.hypot(dx, dy);
    if (len > tn.bodySpacing && len > 0) {
      seg.x = px + (dx / len) * tn.bodySpacing;
      seg.y = py + (dy / len) * tn.bodySpacing;
    }
    px = seg.x;
    py = seg.y;
  }
}

function padTimers(s: SimState): void {
  const x = inside(s);
  const fr = s.frog;
  const t = s.tick;
  const ps = s.padStates[fr.padId]!;
  if (ps.state === 'dipping' && t - ps.since >= x.T.dip) setPad(s, fr.padId, 'occupied');
  // Sinking soggy pads finish 380 ms after their landing. A pad can only sink under the frog, so the
  // frog's layer and the one behind it cover every case (soggy → escape → soggy included).
  for (let k = Math.max(1, fr.layer - 1); k <= fr.layer; k++) {
    for (const p of s.river.layers[k]!) {
      const st = s.padStates[p.id]!;
      if (st.state === 'sinking' && t - st.since >= x.T.soggySink) {
        setPad(s, p.id, 'sunk');
        if (x.soggyPad === p.id) x.soggyPad = -1;
      }
    }
  }
}

export function step(s: SimState, input: TickInput): void {
  s.tick++;
  const x = inside(s);
  frogTimers(s);
  if (input.press) handlePress(s, input.press);
  const flankBefore = s.gator.flank;
  gatorGap(s);
  if (s.gator.flank !== flankBefore && !s.result) refreshChoices(s);
  gatorBody(s);
  padTimers(s);
  x.beat += ((60 + 80 * s.gator.tau) / 60) * DT;
}

/** Which pad a press would target right now, or null. Shared by sim, bots and input (tap-the-pad → slot). */
export function targetFor(s: SimState, slot: Slot): number | null {
  const c = s.choices.find((c) => c.slot === slot || c.alsoAnswers.includes(slot));
  return c ? c.padId : null;
}

/** Slot that selects a given pad, or null if it is not a current choice. */
export function slotForPad(s: SimState, padId: number): Slot | null {
  const c = s.choices.find((c) => c.padId === padId);
  return c ? c.slot : null;
}

/** Timer value in ms at the current tick (§7.2), 0 before hop 1; frozen at the result. */
export function timerMs(s: SimState): number {
  if (s.result) return s.result.timeMs;
  if (s.timerStartTick === null) return 0;
  return ticksToMs(s.tick - s.timerStartTick);
}

/**
 * Heartbeat phase 0..1 at the current tick (§4.3: 60 + 80τ bpm), integrated from τ every tick so a tempo
 * change never jumps the phase. The single source for the audio thump (WO-004) and the vignette (WO-003),
 * polish 14. Phase 0 is the first thump.
 */
export function heartbeatPhase(s: SimState): number {
  const x = (s as Partial<Sim>)._sim;
  const b = x ? x.beat : 0;
  return b - Math.floor(b);
}

/** Ticks of the frog's hop (squash + air) under this sim's tuning; landing is hopTick + hopTicks(s). */
export function hopTicks(s: SimState): number {
  return inside(s).T.land;
}

/** True once the frog has landed on the hook layer (the gap is live). */
export function isHooked(s: SimState): boolean {
  return inside(s).hooked;
}
