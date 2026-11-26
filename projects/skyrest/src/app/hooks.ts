// src/app/hooks.ts — owned by WO-004; the SkyrestHooks shape is FROZEN in contracts.ts.
import type { AudioEngine, MomentApi, MomentId, SkyrestHooks } from '../contracts.ts';
import type { GameInternals } from './game.ts';
import { MOMENTS } from '../moments/index.ts';

export const VERSION = '0.1.0';

export function installHooks(g: GameInternals, audio: AudioEngine): SkyrestHooks {
  let ready = false;
  const api: MomentApi = {
    setSeed: (seed) => g.setSeed(seed),
    skipTitle: () => g.skipTitle(),
    setFlags: (f) => Object.assign(g.sim().flags, f),
    inject: (intent, frames = 1) => g.input.script(intent, frames),
    // Moment scripts only advance the sim; moment() renders once at the capture instant (a render per step
    // would queue hundreds of frames on a software GPU).
    step: (n) => g.advance(n),
    stepUntil(pred, limit) {
      for (let i = 0; i < limit; i++) {
        g.advance(1);
        if (pred(g.sim())) return true;
      }
      return false;
    },
    state: () => g.sim(),
    control: g.control,
  };
  const hooks: SkyrestHooks = {
    get ready() {
      return ready;
    },
    version: VERSION,
    snapshot: () => structuredClone(g.sim()),
    setSeed: (seed) => g.setSeed(seed),
    skipTitle: () => g.skipTitle(),
    inject: (intent, frames = 1) => g.input.script(intent, frames),
    setManual: (on) => g.setManual(on),
    step: (n) => g.step(n),
    render: () => g.renderNow(),
    stats: () => ({ ...g.ctx.renderer.stats() }),
    probe: () => {
      const c = g.ctx.renderer.renderer.domElement;
      return g.ctx.probe.measure(g.ctx.camera, c.clientWidth, c.clientHeight);
    },
    setQuality: (q) => g.control.settings.set({ quality: q }),
    setFlags: (f) => Object.assign(g.sim().flags, f),
    events: () => g.eventLog(),
    sfx: () => audio.log.slice(),
    moment(id: MomentId) {
      const script = MOMENTS[id];
      g.setManual(true);
      g.control.setPaused(false);
      if (!script) return { id, frame: g.sim().frame, phase: g.sim().phase, ok: false, note: 'no script' };
      // Captures are stills: UI entry animations jump to their end state.
      document.documentElement.dataset.moment = id;
      let note: string, ok = true;
      try {
        note = script(api);
      } catch (e) {
        ok = false;
        note = e instanceof Error ? e.message : String(e);
      }
      g.renderNow();
      return { id, frame: g.sim().frame, phase: g.sim().phase, ok, note };
    },
  };
  window.__skyrest = hooks;
  // Ready after the first real frame has rendered.
  requestAnimationFrame(() => requestAnimationFrame(() => (ready = true)));
  return hooks;
}
