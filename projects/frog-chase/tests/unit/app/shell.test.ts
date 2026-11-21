import { describe, expect, it, vi } from 'vitest';
import type { Renderer, RunResult, SimState, Slot, TickInput, Ui, ViewState } from '../../../src/contracts';
import type { GameAudio } from '../../../src/audio/audio';
import { createShell, LOCKOUT_MS, positionalSlot, WIPE_MS, type SimApi } from '../../../src/app/shell';
import { loadSave, SAVE_KEY } from '../../../src/save/save';
import { makeBot } from '../../../src/sim/bots';
import { createSim, slotForPad } from '../../../src/sim/sim';

/**
 * A scripted sim with the frozen SimState shape: the first press is hop 1 (timer starts), and the test
 * decides when the run ends. It keeps these tests about the shell, independent of the WO-002 rules.
 */
function scriptedSim() {
  const presses: Slot[] = [];
  let ending: RunResult | null = null;
  const api: SimApi = {
    createSim,
    slotForPad,
    makeBot,
    step(s: SimState, input: TickInput) {
      s.tick++;
      if (s.result) return;
      if (input.press) {
        presses.push(input.press);
        if (s.frog.hopTick < 0) {
          s.timerStartTick = s.tick;
          s.log.push({ t: 'timerStart', tick: s.tick });
        }
        s.frog.hopTick = s.tick;
        s.log.push({ t: 'hop', tick: s.tick, from: 0, to: 1, slot: input.press, buffered: false });
      }
      if (ending) {
        s.result = { ...ending, tick: s.tick };
        ending = null;
      }
    },
  };
  return { api, presses, end: (r: Partial<RunResult> = {}) => void (ending = { kind: 'eaten', cause: 'still', tick: 0, timeMs: 14820, layer: 17, culpritId: null, ...r }) };
}

function memStore(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

type Circle = { x: number; y: number; r: number };
function rig(o: { storage?: ReturnType<typeof memStore>; osReduced?: boolean; fixedSeed?: number | null; screen?: (id: number) => Circle | null; real?: boolean } = {}) {
  const sim = scriptedSim();
  let wall = 1000;
  let lastView: ViewState | null = null;
  const renderer: Renderer = {
    resize() {},
    frame: (_s, v) => void (lastView = v),
    pickPad: () => null,
    padOnScreen: (id) => (o.screen ? o.screen(id) : { x: 0, y: 0, r: 10 }),
  };
  const audio = { unlock: vi.fn(), frame: vi.fn(), setMuted: vi.fn(), duck: vi.fn(), uiTick: vi.fn(), debug: () => null } satisfies GameAudio;
  const storage = o.storage ?? memStore();
  let cb!: Parameters<Parameters<typeof createShell>[0]['makeUi']>[0];
  const shell = createShell({
    renderer,
    makeUi: (c) => ((cb = c), { update() {}, dispose() {} } satisfies Ui),
    audio,
    storage,
    prefersReducedMotion: o.osReduced ?? false,
    fixedSeed: o.fixedSeed === undefined ? 7 : o.fixedSeed,
    sessionSalt: 1234,
    wallNow: () => wall,
    sim: o.real ? undefined : sim.api,
  });
  shell.hook.manualClock(true);
  /** Advance n 60 Hz frames, with wall time moving in step. */
  const frames = (ms: number) => {
    const n = Math.round(ms / (1000 / 60));
    for (let i = 0; i < n; i++) {
      wall += 1000 / 60;
      shell.hook.frame(1000 / 60);
    }
  };
  return { shell, hook: shell.hook, sim, audio, storage, frames, view: () => lastView!, cb: () => cb };
}

describe('phases (§7.1, §7.6, §7.7)', () => {
  it('leaves the title on the first hop and delivers the press on the next tick', () => {
    const r = rig();
    r.frames(100);
    expect(r.hook.phase()).toBe('title');
    expect(r.shell.intent({ type: 'hop', slot: 'L' })).toBe(true);
    r.frames(17);
    expect(r.hook.phase()).toBe('play');
    expect(r.sim.presses).toEqual(['L']);
  });

  it('pauses on Esc/P/hidden/blur during play, freezes the sim and ducks audio; resumes where it was', () => {
    const r = rig();
    r.shell.lostFocus();
    expect(r.hook.phase()).toBe('title'); // nothing to protect on the title pond
    r.hook.press('F');
    r.frames(50);
    r.shell.lostFocus();
    expect(r.hook.phase()).toBe('paused');
    expect(r.audio.duck).toHaveBeenLastCalledWith(true);
    const t = r.hook.sim()!.tick;
    r.frames(500);
    expect(r.hook.sim()!.tick).toBe(t);
    expect(r.shell.intent({ type: 'hop', slot: 'F' })).toBe(false); // the menu owns keys while paused
    r.shell.intent({ type: 'pause' });
    expect(r.hook.phase()).toBe('play');
    expect(r.audio.duck).toHaveBeenLastCalledWith(false);
    r.frames(100);
    expect(r.hook.sim()!.tick).toBe(t + 12);
    r.cb().pause();
    expect(r.hook.phase()).toBe('paused');
    r.cb().resume();
    expect(r.hook.phase()).toBe('play');
  });

  it('locks restart out for 250 ms, wipes for 150 ms, and keeps a hop pressed during the wipe', () => {
    const r = rig();
    r.hook.press('F');
    r.frames(50);
    r.sim.end();
    r.frames(17);
    expect(r.hook.phase()).toBe('result');
    r.frames(LOCKOUT_MS - 50);
    r.shell.intent({ type: 'hop', slot: 'F' });
    r.shell.intent({ type: 'confirm' });
    expect(r.hook.phase()).toBe('result');
    expect(r.view().resultAgeMs).toBeGreaterThan(150);
    r.frames(67);
    const old = r.hook.sim();
    expect(r.shell.intent({ type: 'confirm' })).toBe(true);
    expect(r.hook.phase()).toBe('wipe');
    expect(r.hook.sim()).not.toBe(old); // the wipe sweeps off the fresh run
    r.shell.intent({ type: 'hop', slot: 'R' });
    r.frames(WIPE_MS - 17);
    expect(r.hook.phase()).toBe('wipe');
    expect(r.sim.presses).toEqual(['F']);
    r.frames(34);
    expect(r.hook.phase()).toBe('play');
    expect(r.sim.presses).toEqual(['F', 'R']);
    const t = r.hook.timings();
    expect(t.restartToReadyMs).toBeGreaterThanOrEqual(WIPE_MS);
    expect(t.restartToReadyMs).toBeLessThanOrEqual(400);
    expect(t.resultToReadyMs).toBeGreaterThan(t.restartToReadyMs!);
    expect(t.resultToReadyMs).toBeLessThan(1000);
  });

  it('restarts from the pause menu and un-ducks', () => {
    const r = rig();
    r.hook.press('F');
    r.frames(50);
    r.shell.intent({ type: 'pause' });
    r.cb().restart();
    expect(r.hook.phase()).toBe('wipe');
    expect(r.audio.duck).toHaveBeenLastCalledWith(false);
    r.frames(200);
    expect(r.hook.phase()).toBe('title');
  });

  it('pins every run to ?seed=N, else draws a new river each run', () => {
    const pinned = rig({ fixedSeed: 7 });
    pinned.hook.restart();
    expect(pinned.hook.seed()).toBe(7);
    const free = rig({ fixedSeed: null });
    const seeds = new Set<number>();
    for (let i = 0; i < 5; i++) {
      seeds.add(free.hook.seed());
      free.hook.restart();
    }
    expect(seeds.size).toBe(5);
    free.hook.restart(42);
    expect(free.hook.seed()).toBe(42);
  });

  it('resolves a tap to the nearest reachable pad (overlapping 1.4r circles) and maps it with slotForPad', () => {
    // Lay the current choices out 60 px apart with r = 30, so their 42 px hit circles overlap.
    const r = rig({ screen: (id) => ({ x: 100 + 60 * (id % 3), y: 300, r: 30 }) });
    const s = r.hook.sim()!;
    const [a, b] = s.choices;
    const at = (id: number) => 100 + 60 * (id % 3);
    expect(r.shell.pick(at(a!.padId) + 25, 300)).toBe(a!.padId); // inside both circles, nearer a
    expect(r.shell.pick(at(b!.padId) - 25, 300)).toBe(b!.padId);
    expect(r.shell.pick(at(a!.padId), 300 + 30 * 1.41)).toBeNull(); // just outside 1.4r
    r.shell.intent({ type: 'hopPad', padId: b!.padId });
    r.frames(17);
    expect(r.sim.presses).toEqual([slotForPad(s, b!.padId)]);
  });

  it('falls back to the pad\'s place in its layer when it is not a current choice', () => {
    const s = rig().hook.sim()!;
    for (const layer of s.river.layers.slice(1, 12)) {
      const slots = layer.map((p) => positionalSlot(s, p.id));
      expect(slots).toEqual(layer.length === 3 ? ['L', 'F', 'R'] : layer.length === 2 ? ['L', 'R'] : ['F']);
    }
  });
});

describe('frame path (F-006)', () => {
  it('hands the renderer one reused ViewState, refreshed every frame', () => {
    const r = rig();
    r.frames(17);
    const v1 = r.view();
    const t1 = v1.nowMs;
    r.hook.press('F');
    r.frames(34);
    expect(r.view()).toBe(v1);
    expect(r.view().nowMs).toBeGreaterThan(t1);
    expect(r.view().phase).toBe('play');
  });
});

describe('best time and settings persist (§7.7, polish 20)', () => {
  it('first-ever win is firstRun, not newBest; a faster win is newBest with the old best kept for the card', () => {
    const store = memStore();
    const r = rig({ storage: store });
    r.hook.press('F');
    r.frames(50);
    r.sim.end({ kind: 'won', cause: 'win', timeMs: 31200, layer: 36 });
    r.frames(17);
    expect(r.view()).toMatchObject({ phase: 'result', firstRun: true, newBest: false, prevBestMs: null });
    expect(loadSave(store).bestMs).toBe(31200);

    const r2 = rig({ storage: store }); // reload
    r2.hook.press('F');
    r2.frames(50);
    r2.sim.end({ kind: 'won', cause: 'win', timeMs: 24180, layer: 36 });
    r2.frames(17);
    expect(r2.view()).toMatchObject({ firstRun: false, newBest: true, prevBestMs: 31200 });
    expect(loadSave(store)).toMatchObject({ bestMs: 24180, runs: 2 });

    const r3 = rig({ storage: store });
    r3.hook.press('F');
    r3.frames(50);
    r3.sim.end({ kind: 'won', cause: 'win', timeMs: 26000, layer: 36 });
    r3.frames(17);
    expect(r3.view()).toMatchObject({ newBest: false, prevBestMs: 24180 });
    expect(loadSave(store).bestMs).toBe(24180);
  });

  it('a loss never sets a best', () => {
    const store = memStore();
    const r = rig({ storage: store });
    r.hook.press('F');
    r.frames(50);
    r.sim.end({ kind: 'sunk', cause: 'soggy', timeMs: 9000, layer: 5, culpritId: 4 });
    r.frames(17);
    expect(loadSave(store)).toMatchObject({ bestMs: null, runs: 1 });
  });

  it('persists mute and reduced motion; follows the OS until the player chooses', () => {
    const store = memStore();
    const r = rig({ storage: store, osReduced: true });
    expect(r.hook.settings()).toEqual({ muted: false, reducedMotion: true });
    r.shell.osReducedMotion(false);
    expect(r.hook.settings().reducedMotion).toBe(false);
    r.shell.intent({ type: 'mute' });
    expect(r.audio.setMuted).toHaveBeenLastCalledWith(true);
    r.cb().toggleReducedMotion();
    expect(r.hook.settings()).toEqual({ muted: true, reducedMotion: true });
    r.shell.osReducedMotion(false); // the player's choice now wins
    expect(r.hook.settings().reducedMotion).toBe(true);
    expect(JSON.parse(store.m.get(SAVE_KEY)!)).toMatchObject({ muted: true, reducedMotion: true });

    const again = rig({ storage: store, osReduced: false });
    expect(again.hook.settings()).toEqual({ muted: true, reducedMotion: true });
    expect(again.audio.setMuted).toHaveBeenCalledWith(true);
  });
});

describe('tap timing against the real sim (F-003: a quick second tap never lands on a third pad)', () => {
  const TICK = 1000 / 120;
  /** Every pad drawn at 4 px/wu, so a tap at a pad's centre means exactly that pad. */
  function realRig() {
    let sim: SimState;
    const r = rig({ real: true, screen: (id) => {
      const p = sim.river.pads[id]!;
      return { x: p.x * 4, y: 2000 - p.y * 4, r: p.r * 4 };
    } });
    sim = r.hook.sim()!;
    /** A real tap: the pad if pick() claims it, else (like input.ts) the screen third, here F. */
    const tap = (id: number) => {
      const p = sim.river.pads[id]!;
      const hit = r.shell.pick(p.x * 4, 2000 - p.y * 4);
      r.shell.intent(hit !== null ? { type: 'hopPad', padId: hit } : { type: 'hop', slot: 'F' });
      return hit;
    };
    const pick = (id: number) => {
      const p = sim.river.pads[id]!;
      return r.shell.pick(p.x * 4, 2000 - p.y * 4);
    };
    const tick = (n = 1) => r.hook.frame(TICK, n);
    const lands = () => sim.log.filter((e) => e.t === 'land').map((e) => (e as { pad: number }).pad);
    return { r, sim: () => sim, tap, pick, tick, lands };
  }

  it('the reviewer case: L pad, then an R pad one layer further within 40 ms, does not retarget the hop', () => {
    const { sim, tap, tick, lands } = realRig();
    const [l1, , r1] = sim().river.layers[1]!;
    const r2 = sim().river.layers[2]!.at(-1)!;
    tap(l1!.id);
    tick();
    expect(sim().frog.targetId).toBe(l1!.id);
    tap(r2.id); // 1 tick into squash, inside the retarget window
    tick(40);
    expect(sim().log.some((e) => e.t === 'retarget')).toBe(false);
    expect(lands()).toEqual([l1!.id]);
    expect(lands()).not.toContain(r1!.id);
  });

  it('a second tap on the other target-layer pad within 40 ms retargets to that pad', () => {
    const { sim, tap, tick, lands } = realRig();
    const [l1, , r1] = sim().river.layers[1]!;
    tap(l1!.id);
    tick(2);
    expect(tap(r1!.id)).toBe(r1!.id);
    tick(40);
    expect(lands()).toEqual([r1!.id]);
  });

  it('a tap on a next-layer pad in the buffer window hops there on landing', () => {
    const { sim, tap, tick, lands } = realRig();
    const f1 = sim().river.layers[1]![1]!;
    const l2 = sim().river.layers[2]![0]!;
    tap(f1.id);
    tick(25); // ~200 ms into a 258 ms hop: inside the 150 ms buffer
    tap(l2.id);
    tick(80);
    expect(lands()).toEqual([f1.id, l2.id]);
  });

  it('for every tap moment of the hop and every pad of layers 1–2, the frog only lands where it was sent', () => {
    const base = realRig();
    const L1 = base.sim().river.layers[1]!;
    const L2 = base.sim().river.layers[2]!;
    let checked = 0;
    for (const first of L1) {
      for (let at = 0; at <= 32; at++) {
        for (const second of [...L1, ...L2]) {
          const { sim, tap, pick, tick, lands } = realRig();
          tap(first.id);
          tick(1 + at);
          const airborne = sim().frog.phase === 'squash' || sim().frog.phase === 'air';
          if (pick(second.id) === null) {
            // Only a grounded frog may hand a tap on these pads to the screen thirds.
            expect(airborne, `pad ${second.id} at tick +${at} fell through to a third mid-hop`).toBe(false);
            checked++;
            continue;
          }
          tap(second.id);
          tick(90);
          const got = lands();
          expect(got.length).toBeGreaterThan(0);
          // Hop 1 lands on the first pad, or on the second when it was a retarget inside layer 1.
          expect([first.id, second.id]).toContain(got[0]);
          // Any hop 2 goes to the tapped layer-2 pad and nowhere else.
          for (const p of got.slice(1)) expect(p).toBe(second.id);
          checked++;
        }
      }
    }
    expect(checked).toBe(L1.length * 33 * (L1.length + L2.length));
  });
});
