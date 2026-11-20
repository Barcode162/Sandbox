/**
 * The simulation (§4.2–§4.5, §4.7). OWNER: WO-002.
 * Contract: step(state, input) mutates `state` deterministically from (state, input) alone.
 * No Date, Math.random, DOM or globals. Events are appended to state.log.
 * STUB (WO-001): advances the tick and offers the layer-1 choices; no hopping yet.
 */
import type { Choice, SimState, TickInput, Tuning, Vec2 } from '../contracts';
import { makeTuning, ticksToMs } from '../tuning';
import { generateRiver } from './generator';

export function createSim(seed: number, patch?: Partial<Tuning>): SimState {
  const tuning = makeTuning(patch);
  const river = generateRiver(seed, tuning);
  const bank = river.layers[0]![0]!;
  const start: Vec2 = { x: bank.x, y: bank.y };
  const below = (dy: number): Vec2 => ({ x: start.x, y: start.y - dy });
  const body: Vec2[] = Array.from({ length: tuning.bodySegments }, (_, i) => below(40 + (i + 1) * tuning.bodySpacing));
  const s: SimState = {
    tuning,
    river,
    tick: 0,
    timerStartTick: null,
    frog: { phase: 'idle', since: 0, padId: bank.id, targetId: bank.id, slot: 'F', hopTick: -1, landTick: -1, buffer: null, layer: 0 },
    gator: {
      phase: 'dormant', since: 0, g: tuning.gMax, tau: 0,
      head: below(40), headPrev: below(40), headVel: { x: 0, y: 0 }, heading: Math.PI / 2,
      body, bodyPrev: body.map((p) => ({ ...p })), flank: null, lastFlankLayer: -Infinity,
    },
    padStates: river.pads.map(() => ({ state: 'idle' as const, since: 0 })),
    choices: [],
    trail: [start],
    trailArc: [0],
    result: null,
    log: [],
  };
  s.choices = choicesFor(s);
  for (const c of s.choices) s.padStates[c.padId]!.state = 'reachable';
  return s;
}

/** §4.5 slot mapping for the frog's next layer. Pure helper; also used by bots and touch input. */
export function choicesFor(s: SimState): Choice[] {
  const next = s.river.layers[s.frog.layer + 1];
  if (!next) return [];
  if (next.length === 1) return [{ slot: 'F', padId: next[0]!.id, alsoAnswers: ['L', 'R'] }];
  const slots: ('L' | 'F' | 'R')[] = next.length === 3 ? ['L', 'F', 'R'] : ['L', 'R'];
  return next.map((p, i) => ({ slot: slots[i]!, padId: p.id, alsoAnswers: [] }));
}

export function step(s: SimState, _input: TickInput): void {
  s.tick++;
}

/** Which pad a press would target right now, or null. Shared by sim, bots and input (tap-the-pad → slot). */
export function targetFor(s: SimState, slot: 'L' | 'F' | 'R'): number | null {
  const c = s.choices.find((c) => c.slot === slot || c.alsoAnswers.includes(slot));
  return c ? c.padId : null;
}

/** Slot that selects a given pad, or null if it is not a current choice. */
export function slotForPad(s: SimState, padId: number): 'L' | 'F' | 'R' | null {
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
 * Heartbeat phase 0..1 at the current tick (§4.3: 60 + 80τ bpm). The single source for the
 * audio thump (WO-004) and the vignette pulse (WO-003), polish 14. Must be integrated from τ per tick
 * (store the accumulator in state when implemented) so tempo changes never jump the phase.
 * STUB (WO-001): constant 60 bpm.
 */
export function heartbeatPhase(s: SimState): number {
  return ((s.tick / 120) * 1) % 1;
}
