/**
 * Bots (§13 screenshots, success criterion 1). OWNER: WO-002.
 * A BotPolicy is called once per tick before step(); it reads only the SimState (no wall clock),
 * so a bot run is as deterministic as the sim. The press lands on tick sim.tick + 1.
 *
 *  runner     hops delayMs (default 400) after each landing to a safe, unarmed-flank pad. Must win.
 *  idler      runs to the hook layer (stopAtLayer, default hookLayer), then never presses: eaten, cause still.
 *             (Pressing nothing at all can never be eaten: the gator sleeps until the hook, §4.3.)
 *  idleAtTau  a slow runner (delayMs default 1100) that stops pressing for good once τ ≥ opts.tau (default 0.6)
 *             while it stands on a pad (screenshot 6 holds from then until the chomp, ≈1 s at τ 0.6).
 *  forward    always answers F, delayMs after landing (past the soggy escape window): sinks at layer 6.
 *  nearMiss   runner until the hook; then waits until g ≤ delayMs/1000 (default 0.2 s) so the gap closes mid-air.
 */
import type { BotName, BotOptions, BotPolicy, SimState, Slot } from '../contracts';
import { ticks } from '../tuning';
import { isHooked } from './sim';

/** Deterministic pick among n options for this seed and layer (stateless, so restarts are safe). */
function pick(seed: number, layer: number, n: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(layer + 1, 0xc2b2ae35);
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2d);
  h ^= h >>> 16;
  return (h >>> 0) % n;
}

/** The slot of a safe pad the bot may take now (never an armed flank), or null. */
export function safeSlot(s: SimState): Slot | null {
  const f = s.gator.flank;
  const ok = s.choices.filter((c) => {
    const p = s.river.pads[c.padId]!;
    return (p.kind === 'lily' || p.kind === 'bank') && !(f && f.armed && f.padId === c.padId);
  });
  if (ok.length === 0) return null;
  return ok[pick(s.river.seed, s.frog.layer, ok.length)]!.slot;
}

/** Ticks since the frog last landed (or since the run began, before hop 1), as of the coming tick. */
function sinceLanding(s: SimState): number {
  return s.tick + 1 - Math.max(0, s.frog.landTick);
}

function ready(s: SimState): boolean {
  return !s.result && s.frog.phase === 'idle' && s.choices.length > 0;
}

export function makeBot(name: BotName, opts: BotOptions = {}): BotPolicy {
  const stop = (s: SimState) => opts.stopAtLayer !== undefined && s.frog.layer >= opts.stopAtLayer;
  const runner = (delayMs: number): BotPolicy => {
    const d = ticks(delayMs);
    return (s) => (ready(s) && !stop(s) && sinceLanding(s) >= d ? safeSlot(s) : null);
  };
  switch (name) {
    case 'runner':
      return runner(opts.delayMs ?? 400);
    case 'idler': {
      const run = runner(opts.delayMs ?? 400);
      return (s) => (s.frog.layer >= (opts.stopAtLayer ?? s.tuning.hookLayer) ? null : run(s));
    }
    case 'idleAtTau': {
      const run = runner(opts.delayMs ?? 1100);
      const tau = opts.tau ?? 0.6;
      let quitAt: SimState | null = null; // the run in which τ was reached (a restart re-arms the bot)
      return (s) => {
        if (quitAt === s) return null;
        if (isHooked(s) && s.frog.phase === 'idle' && s.gator.tau >= tau) {
          quitAt = s;
          return null;
        }
        return run(s);
      };
    }
    case 'forward': {
      const d = ticks(opts.delayMs ?? 400);
      return (s) => (ready(s) && !stop(s) && sinceLanding(s) >= d ? 'F' : null);
    }
    case 'nearMiss': {
      const run = runner(400);
      const gap = (opts.delayMs ?? 200) / 1000;
      return (s) => {
        if (!isHooked(s)) return run(s);
        if (!ready(s) || stop(s) || s.gator.g > gap) return null;
        return safeSlot(s);
      };
    }
  }
}
