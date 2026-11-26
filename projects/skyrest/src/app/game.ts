// src/app/game.ts — owned by WO-004 (the wiring). Builds every module through its frozen factory,
// runs the fixed-step sim under a rAF render loop with interpolation, drains sim events to the bus,
// and exposes GameControl to the UI and window.__skyrest to tests.
import * as THREE from 'three';
import type { FrameInfo, GameControl, Quality, RenderContext, SimEvent, SimState, View } from '../contracts.ts';
import { createBus } from '../core/bus.ts';
import { createFixedStepper } from '../core/fixed-step.ts';
import { neutralIntent } from '../core/intent.ts';
import { createSettings } from '../core/settings.ts';
import { createSim, stepSim } from '../core/sim.ts';
import { restartWave, setPhase } from '../core/flow.ts';
import { wakeInstantly } from '../golem/sim.ts';
import { createRenderer } from '../render/renderer.ts';
import { createProbeRegistry } from '../render/probe.ts';
import { createWorldView } from '../world/view.ts';
import { createHeroView } from '../hero/view.ts';
import { createGolemView } from '../golem/view.ts';
import { createMinionsView } from '../minions/view.ts';
import { createCameraRig } from '../camera/rig.ts';
import { createFx } from '../fx/index.ts';
import { createInput } from '../input/index.ts';
import { createAudio } from '../audio/index.ts';
import { createUi } from '../ui/index.ts';
import { installHooks } from './hooks.ts';

export const DEFAULT_SEED = 20261125;
const EVENT_LOG = 256;

export interface GameInternals {
  sim(): SimState;
  setSeed(seed: number): void;
  skipTitle(): void;
  setManual(on: boolean): void;
  step(n: number): number;
  /** Advance n fixed steps without rendering (moment scripts render once at the end). */
  advance(n: number): void;
  renderNow(): void;
  readonly ctx: RenderContext;
  readonly control: GameControl;
  readonly input: ReturnType<typeof createInput>;
  eventLog(): SimEvent[];
}

export function bootGame(root: HTMLElement): GameInternals {
  const canvas = document.createElement('canvas');
  canvas.className = 'stage';
  canvas.setAttribute('aria-label', 'Skyrest game view');
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  const uiRoot = document.createElement('div');
  uiRoot.className = 'ui';
  root.append(canvas, overlay, uiRoot);

  const settings = createSettings();
  const bus = createBus();
  const renderer = createRenderer(canvas, settings.get());
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  const probe = createProbeRegistry();
  const ctx: RenderContext = { scene, camera, renderer, settings, bus, probe, overlay };

  const rig = createCameraRig();
  const world = createWorldView();
  const views: View[] = [world, createHeroView(), createGolemView(), createMinionsView(), createFx(rig), rig];
  for (const v of views) v.init(ctx);
  const audio = createAudio(bus, settings);
  const input = createInput(root, bus);
  const ui = createUi();

  let sim = createSim(DEFAULT_SEED);
  const intent = neutralIntent();
  const stepper = createFixedStepper();
  const log: SimEvent[] = [];
  let paused = false, manual = false, pendingConfirm = false, alpha = 1, time = 0, last = performance.now();
  const frame: FrameInfo = { state: sim, alpha: 1, dt: 0, time: 0, paused: false };

  const drain = () => {
    for (let i = 0; i < sim.events.length; i++) {
      const e = sim.events[i]!;
      log.push(e);
      if (log.length > EVENT_LOG) log.shift();
      bus.emit(e);
    }
  };
  const doStep = () => {
    intent.camYaw = rig.yaw;
    input.sample(intent);
    if (pendingConfirm) {
      intent.confirm = true;
      pendingConfirm = false;
    }
    if (intent.pause && (sim.phase === 'fight' || sim.phase === 'intro')) {
      control.setPaused(true);
      return;
    }
    stepSim(sim, intent);
    drain();
  };

  /** Apply a flow change made outside a step (menus): publish its events now. */
  const publish = () => {
    drain();
    sim.events.length = 0;
    stepper.reset();
  };
  const control: GameControl = {
    start: () => {
      pendingConfirm = true;
    },
    /** NEXT WAVE / TRY AGAIN from a card, or RESTART FIGHT from the pause panel: the next attempt starts now. */
    retry: () => {
      if (sim.phase === 'title' || sim.phase === 'intro') return;
      if (paused) control.setPaused(false);
      sim.events.length = 0;
      restartWave(sim);
      publish();
    },
    /** TITLE from a card: back to the orbiting title, coins kept. */
    toTitle: () => {
      const keep = sim.coins, seed = sim.seed;
      if (paused) control.setPaused(false);
      sim = createSim(seed);
      sim.coins = keep;
      log.length = 0;
      stepper.reset();
      rig.snap();
    },
    setPaused(p) {
      paused = p;
      audio.setPaused(p);
      stepper.reset();
    },
    get paused() {
      return paused;
    },
    settings,
    audio,
  };
  ui.init(uiRoot, ctx, control);
  let quality: Quality = renderer.quality;
  for (const v of views) v.setQuality(quality);
  const syncQuality = () => {
    if (renderer.quality === quality) return;
    quality = renderer.quality;
    for (const v of views) v.setQuality(quality);
  };
  settings.subscribe((s) => {
    renderer.setQuality(s.quality);
    audio.setVolume(s.volume, s.music);
    syncQuality();
  });

  const resize = () => {
    const w = root.clientWidth || innerWidth, h = root.clientHeight || innerHeight;
    renderer.resize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();

  // Phase 2 warms the sun (F8: #ffd9b0); a new attempt restores it.
  const sunBase = world.sun.color.clone();
  const sunWarm = new THREE.Color(0xffd9b0);
  let sunK = 0;
  /** Every view + the UI read the sim (no draw). */
  const syncViews = (dt: number) => {
    frame.state = sim;
    frame.alpha = alpha;
    frame.dt = paused ? 0 : dt;
    frame.time = time;
    frame.paused = paused;
    for (const v of views) v.update(frame);
    const wantK = sim.golem.enraged && sim.golem.action !== 'dead' ? 1 : 0;
    sunK += (wantK - sunK) * Math.min(1, (paused ? 0 : dt) * 3 + (manual && wantK ? 1 : 0));
    if (sunK > 0.001 || wantK) world.sun.color.copy(sunBase).lerp(sunWarm, sunK);
    else if (sunK !== 0) {
      sunK = 0;
      world.sun.color.copy(sunBase);
    }
    ui.update(frame);
  };
  const renderFrame = (dt: number) => {
    syncViews(dt);
    renderer.render(scene, camera);
    syncQuality(); // auto may have downgraded inside render()
  };
  const tick = (now: number) => {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    if (!manual) {
      if (paused) {
        input.sample(intent);
        if (intent.pause) control.setPaused(false);
      } else {
        time += dt;
        alpha = stepper.advance(dt * sim.timeScale, doStep);
      }
    }
    renderFrame(dt);
    requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sim.phase === 'fight') control.setPaused(true);
  });

  const internals: GameInternals = {
    sim: () => sim,
    setSeed(seed) {
      sim = createSim(seed);
      log.length = 0;
      stepper.reset();
      rig.snap();
    },
    skipTitle() {
      setPhase(sim, 'intro');
      setPhase(sim, 'fight');
      wakeInstantly(sim.golem);
      drain();
      sim.events.length = 0;
      rig.snap();
    },
    setManual(on) {
      manual = on;
      stepper.reset();
    },
    step(n) {
      internals.advance(n);
      renderFrame(1 / 60);
      return sim.frame;
    },
    advance(n) {
      // Views and UI follow every step (no GPU work), so bus listeners and per-step view state see the live sim;
      // only step()/moment() then draw a frame.
      for (let i = 0; i < n; i++) {
        doStep();
        time += 1 / 60;
        alpha = 1;
        syncViews(1 / 60);
      }
    },
    renderNow() {
      alpha = 1;
      renderFrame(0);
    },
    ctx,
    control,
    input,
    eventLog: () => log.slice(),
  };
  installHooks(internals, audio);
  requestAnimationFrame((t) => {
    last = t;
    tick(t);
  });
  return internals;
}
