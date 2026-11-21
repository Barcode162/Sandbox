// App shell (WO-004): scene machine, sim ownership, fixed loop, input (§13), event fan-out and the
// compositor in the §10.5 draw order. FROZEN: createGame(canvas) → Game (members below `setBeforeStep`
// are additive). The test hook (app/testhook.ts) drives the game only through Game.
import type {
  AudioEngine, Command, DrawPass, MusicState, PlaceFail, RenderFrame, SceneId, Settings, SettingsStore, Sim, SimEvent,
  SimOptions, Speed, StageId, Tower, TowerKind, UpgradePath, WorldLayer,
} from '../contracts/types';
import { LOGICAL_H, LOGICAL_W, FIELD, ATTRACT, BEST_SPOTS, FOOTPRINT } from '../data/map';
import { HUD } from '../data/layout';
import { TOWERS } from '../data/towers';
import { STORM_FROM_ROUND } from '../data/waves';
import { createSim } from '../sim';
import { canPlace } from '../sim/placement';
import { tierStatus } from '../sim/towers';
import { createFx, type FxSystem } from '../render/fx';
import { createBlotLayer } from '../render/blots';
import { createTowerLayer, drawTowerSprite } from '../render/towers';
import { createFixedLoop } from './loop';
import { createSettingsStore, DEFAULT_SETTINGS } from './settings';
import { createAudio } from '../audio';
import { goView, keyAction, nextTarget, type Action, type GoView } from './input';
import { clamp01, type Ctx, inRect, outCubic } from '../ui/draw';
import { createGarden, type GardenDynamic } from '../ui/garden';
import { createHud } from '../ui/hud';
import { drawSidebar, sameHit, sidebarHit, type SideHit, towerTitle } from '../ui/sidebar';
import { drawGhost, drawMorph, drawSelection, drawSink, drawStar, drawUpgradePreview, type Morph, type Sink } from '../ui/ghost';
import {
  bestDefenderLine, drawCranes, drawDim, drawFlood, drawGameOverCard, drawPause, drawSettings, drawTitle, drawVictoryCard,
  endHit, makeCranes, pauseHit, settingsHit, sliderValue, titleHit, type Crane, type EndHit, type PauseHit, type SettingKey,
  type SettingsHit, type TitleHit,
} from '../ui/screens';
import { drawBlotsGrid, drawTowersSheet } from '../ui/sheets';

export interface Game {
  readonly sim: Sim;
  scene(): SceneId;
  speed(): Speed;
  command(cmd: Command): void;
  /** Render one frame after `dtMs` of real time (the rAF callback and the manual clock both call this). */
  frame(dtMs: number): void;
  /** Fresh R1 board (§10.7, §10.9); must complete in < 2 s. */
  restart(): void;
  /** Used by the test hook to drive the app from a script driver before each sim step. */
  setBeforeStep(fn: ((sim: Sim) => void) | null): void;
  /** WO-004 staging/test surface (used by app/testhook.ts and tests/unit/ui). */
  readonly debug: GameDebug;
}

export type Sheet = Extract<StageId, 'blots-grid' | 'towers-sheet'>;
export interface GameDebug {
  readonly settings: SettingsStore;
  readonly nowMs: number;
  /** Fresh play run with no title transition. `scripted` ignores blur auto-pause and UI-originated sim commands. */
  newRun(opts?: Partial<SimOptions>, scripted?: boolean): void;
  toTitle(): void;
  /** Frame with optional drawing (fast-forward for stages and playScript). */
  frame(dtMs: number, draw: boolean): void;
  render(): void;
  pointerMove(x: number, y: number): void;
  pointerDown(x: number, y: number, button?: number): void;
  pointerUp(): void;
  key(key: string): void;
  setSheet(id: Sheet | null): void;
  /** Observe every sim event of the play run (stages wait on boss beats). */
  watch(fn: ((e: SimEvent) => void) | null): void;
  readonly selection: Selection;
  readonly go: GoView;
  readonly hint: string | null;
}

export type Selection = { mode: 'none' } | { mode: 'placing'; kind: TowerKind } | { mode: 'selected'; towerId: number };

/** Minimal event-target surface (DOM window, or a fake in unit tests). */
export interface EventSource { addEventListener(type: string, fn: (e: Event) => void, opts?: unknown): void }
export interface CanvasLike extends EventSource {
  width: number;
  height: number;
  getContext(id: '2d'): CanvasRenderingContext2D | null;
  getBoundingClientRect?(): { left: number; top: number; width: number; height: number };
}
export interface GameOptions {
  createSim?: (o: SimOptions) => Sim;
  layers?: () => Layers;
  audio?: AudioEngine;
  settings?: SettingsStore;
  /** Window for keyboard/blur; null = none (tests call debug.key). */
  win?: EventSource | null;
  doc?: { hidden: boolean; addEventListener(t: string, fn: () => void): void } | null;
}
export interface Layers { fx: FxSystem; blots: WorldLayer; towers: WorldLayer }

const PASSES_LOW: readonly DrawPass[] = ['blots', 'projectiles'];
const PASSES_HIGH: readonly DrawPass[] = ['particles', 'rings'];
const STEP_MS = 1000 / 60;

function defaultLayers(): Layers {
  const fx = createFx();
  return { fx, blots: createBlotLayer(fx), towers: createTowerLayer(fx) };
}

export function createGame(canvas: CanvasLike, opts: GameOptions = {}): Game {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  const c: Ctx = ctx;
  const mkSim = opts.createSim ?? createSim;
  const mkLayers = opts.layers ?? defaultLayers;
  const settings = opts.settings ?? createSettingsStore();
  const audio = opts.audio ?? createAudio();
  const win = opts.win !== undefined ? opts.win : typeof window !== 'undefined' ? window : null;
  const doc = opts.doc !== undefined ? opts.doc : typeof document !== 'undefined' ? document : null;
  audio.applySettings(settings.get());

  const garden = createGarden();
  const hud = createHud();
  const loop = createFixedLoop();
  const attractLoop = createFixedLoop();
  let layers = mkLayers();
  let attractLayers = mkLayers();
  let sim = mkSim({ seed: 1 });
  let attract: Sim = sim;
  let scene: SceneId = 'title';
  let settingsReturn: SceneId = 'title';
  let sceneAt = 0;
  let now = 0;
  let worldNow = 0;
  let lastDt = 0;
  let speed: Speed = 1;
  let beforeStep: ((s: Sim) => void) | null = null;
  let watcher: ((e: SimEvent) => void) | null = null;
  let scripted = false;
  let headless = false;
  let sheet: Sheet | null = null;

  // interaction state
  let sel: Selection = { mode: 'none' };
  let selectedAt = 0;
  let prevPanelTower: Tower | null = null;
  let prevPanelWasFold = false;
  let panelAt = -1e9;
  const pointer = { x: -100, y: -100, inside: false };
  let hoverSide: SideHit | null = null;
  let hoverSince = 0;
  let hoverPauseBtn = false;
  let hoverTitle: TitleHit | null = null;
  let hoverPause: PauseHit | null = null;
  let hoverSettings: SettingsHit | null = null;
  let hoverEnd: EndHit | null = null;
  let dragKey: SettingKey | null = null;
  let lastFail: PlaceFail | null = null;
  let nudgeAt = -1e9;
  let sellArmedAt = -1e9;
  let restartArmedAt = -1e9;
  let idleSince = 0;
  let roundsStarted = 0;
  let firstPlaced = false;
  let playAt = -1e9;
  let defeatAt = -1e9;
  let victoryAt = -1e9;
  let drainAt = -1e9;
  let cranes: Crane[] = [];
  let morphs: Morph[] = [];
  let sinks: Sink[] = [];
  let portraitMorph: { towerId: number; from: [number, number]; born: number } | null = null;
  const boxChange = new Map<string, number>();
  const towerCache = new Map<number, { kind: TowerKind; tiers: [number, number]; x: number; y: number; angle: number }>();
  let music: MusicState | null = null;
  let warned = false;
  let lastHint: string | null = null;
  const attractDyn: GardenDynamic = { poolScale: 1, poolDark: 0, jarFill: 1, jarFlash: 0 };

  settings.subscribe((s) => {
    audio.applySettings(s);
    if (!scripted && (scene === 'play' || scene === 'paused' || scene === 'settings') && s.autoStart !== sim.state.autoStart) {
      sim.enqueue({ type: 'autoStart', on: s.autoStart });
    }
  });

  // ───────── runs ─────────
  function makeAttract(): void {
    attract = mkSim({ seed: ATTRACT.seed, startRound: ATTRACT.round, loopRound: true, startMoney: 1_000_000 });
    attractLayers.fx.reset(); attractLayers.blots.reset(); attractLayers.towers.reset();
    attractLayers = mkLayers();
    ATTRACT.towers.forEach((t, i) => {
      attract.enqueue({ type: 'place', kind: t.kind, x: t.x, y: t.y });
      for (const p of [0, 1] as const) for (let k = 0; k < t.tiers[p]; k++) attract.enqueue({ type: 'upgrade', towerId: i + 1, path: p });
    });
    attract.enqueue({ type: 'startRound' });
    attractLoop.reset();
    // pre-warm so the title opens on a live garden (§10.1 t 800 ms: blots already crossing the top path)
    for (let i = 0; i < 300; i++) { attract.step(); feed(attractLayers, attract, false); updateLayers(attractLayers, STEP_MS, attract); }
  }

  function feed(L: Layers, s: Sim, main: boolean): void {
    for (const e of s.events) {
      L.towers.onSimEvent(e, s.state);
      L.blots.onSimEvent(e, s.state);
      L.fx.onSimEvent(e, s.state);
      if (main) onPlayEvent(e);
    }
  }
  function updateLayers(L: Layers, dt: number, s: Sim): void {
    L.towers.update(dt, s.state); L.blots.update(dt, s.state); L.fx.update(dt, s.state);
  }

  function resetRunState(): void {
    sel = { mode: 'none' };
    speed = 1;
    roundsStarted = 0;
    firstPlaced = false;
    defeatAt = -1e9; victoryAt = -1e9;
    cranes = []; morphs = []; sinks = []; portraitMorph = null;
    boxChange.clear(); towerCache.clear();
    sellArmedAt = -1e9; restartArmedAt = -1e9;
    idleSince = now; warned = false; lastFail = null;
    panelAt = -1e9; prevPanelTower = null; prevPanelWasFold = false;
  }

  function newRun(o: Partial<SimOptions> = {}, isScripted = false): void {
    scripted = isScripted;
    sim = mkSim({ seed: 1, ...o });
    loop.reset();
    layers.fx.reset(); layers.blots.reset(); layers.towers.reset();
    hud.reset(sim.state);
    resetRunState();
    setScene('play');
    if (!scripted && settings.get().autoStart) sim.enqueue({ type: 'autoStart', on: true });
    audio.setPaused(false);
  }

  function restart(): void {
    const fromGameOver = scene === 'gameover';
    newRun({}, false);
    playAt = -1e9;
    drainAt = fromGameOver ? now : -1e9;
    render();
  }

  function startPlay(): void {
    newRun({}, false);
    playAt = now;
  }

  function toTitle(): void {
    scripted = false;
    resetRunState();
    makeAttract();
    setScene('title');
    playAt = -1e9; drainAt = -1e9;
    audio.setPaused(false);
  }

  function setScene(s: SceneId): void {
    if (s === scene) return;
    scene = s;
    sceneAt = now;
    hoverTitle = null; hoverPause = null; hoverSettings = null; hoverEnd = null; dragKey = null;
    audio.setPaused(s === 'paused' || (s === 'settings' && settingsReturn === 'paused'));
  }

  // ───────── sim events → UI ─────────
  function onPlayEvent(e: SimEvent): void {
    if (!headless) audio.onSimEvent(e);
    hud.onSimEvent(e, sim.state, now);
    watcher?.(e);
    switch (e.type) {
      case 'place':
        if (!firstPlaced) firstPlaced = true;
        if (!headless) audio.ui('place');
        break;
      case 'upgrade': {
        const prev = towerCache.get(e.towerId);
        const t = sim.state.towers.find((k) => k.id === e.towerId);
        boxChange.set(`${e.towerId}:${e.path}:${e.tier}`, now);
        if (e.tier >= 2) for (const tier of [2, 3]) boxChange.set(`${e.towerId}:${1 - e.path}:${tier}`, now);
        if (prev && t) {
          morphs.push({ towerId: t.id, kind: t.kind, from: [prev.tiers[0], prev.tiers[1]], x: t.x, y: t.y, angle: t.angle, born: now });
          portraitMorph = { towerId: t.id, from: [prev.tiers[0], prev.tiers[1]], born: now };
        }
        if (!headless) audio.ui(e.tier >= 3 ? 'upgrade3' : e.tier === 2 ? 'upgrade2' : 'upgrade1');
        break;
      }
      case 'sell': {
        const prev = towerCache.get(e.towerId);
        if (prev) sinks.push({ kind: prev.kind, tiers: prev.tiers, x: e.x, y: e.y, angle: prev.angle, born: now });
        towerCache.delete(e.towerId);
        if (sel.mode === 'selected' && sel.towerId === e.towerId) setSelection({ mode: 'none' });
        if (!headless) audio.ui('sell');
        break;
      }
      case 'rejected':
        if (!headless) audio.ui('invalid');
        break;
      case 'roundStart':
        roundsStarted++;
        idleSince = now;
        break;
      case 'roundClear':
        idleSince = now;
        break;
      case 'bossWarning':
        warned = true;
        break;
      case 'defeat':
        defeatAt = now;
        sel = { mode: 'none' };
        setScene('gameover');
        break;
      case 'victory':
        victoryAt = now;
        sel = { mode: 'none' };
        cranes = makeCranes(sim.state.towers.map((t) => ({ x: t.x, y: t.y })));
        setScene('victory');
        break;
      default:
        break;
    }
  }

  function cacheTowers(): void {
    for (const t of sim.state.towers) {
      const k = towerCache.get(t.id);
      if (k) { k.tiers[0] = t.tiers[0]; k.tiers[1] = t.tiers[1]; k.angle = t.angle; }
      else towerCache.set(t.id, { kind: t.kind, tiers: [t.tiers[0], t.tiers[1]], x: t.x, y: t.y, angle: t.angle });
    }
  }

  // ───────── selection helpers ─────────
  function selectedTower(): Tower | null {
    if (sel.mode !== 'selected') return null;
    const id = sel.towerId;
    return sim.state.towers.find((t) => t.id === id) ?? null;
  }
  function setSelection(next: Selection): void {
    const wasTower = selectedTower();
    const nextIsFold = next.mode === 'selected';
    const changedPanel = (wasTower !== null) !== nextIsFold || (nextIsFold && wasTower && next.mode === 'selected' && wasTower.id !== next.towerId);
    if (changedPanel) { prevPanelTower = wasTower; prevPanelWasFold = wasTower !== null; panelAt = now; }
    if (next.mode === 'selected') selectedAt = now;
    sel = next;
    sellArmedAt = -1e9;
  }
  function towerAt(x: number, y: number): Tower | null {
    let best: Tower | null = null, bd = Infinity;
    for (const t of sim.state.towers) {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d <= FOOTPRINT[t.kind] + 6 && d < bd) { bd = d; best = t; }
    }
    return best;
  }
  function uiCommand(cmd: Command): void { sim.enqueue(cmd); }

  // ───────── actions ─────────
  function selectKind(kind: TowerKind): void {
    if (sel.mode === 'placing' && sel.kind === kind) { setSelection({ mode: 'none' }); return; }
    if (sim.state.money < TOWERS[kind].cost) { audio.ui('invalid'); return; }
    audio.ui('click');
    setSelection({ mode: 'placing', kind });
    lastFail = null;
  }
  function go(): void {
    const g = currentGo();
    if (g.action === 'start') { uiCommand({ type: 'startRound' }); audio.ui('click'); }
    else if (g.action === 'speed') { speed = speed === 1 ? 2 : 1; audio.ui('click'); }
  }
  function upgrade(path: UpgradePath): void {
    const t = selectedTower();
    if (!t) return;
    const tier = t.tiers[path] + 1;
    if (tier > 3) { audio.ui('invalid'); return; }
    const v = tierStatus(sim.state, t, path, tier as 1 | 2 | 3);
    if (v.status === 'sealed') { audio.ui('sealed'); return; }
    if (v.status !== 'next' || !v.affordable) { audio.ui('invalid'); return; }
    uiCommand({ type: 'upgrade', towerId: t.id, path });
  }
  function cycleTarget(dir: 1 | -1): void {
    const t = selectedTower();
    if (!t || !TOWERS[t.kind].hasTargeting) return;
    uiCommand({ type: 'target', towerId: t.id, mode: nextTarget(t.target, dir) });
    audio.ui('click');
  }
  function sell(immediate: boolean): void {
    const t = selectedTower();
    if (!t) return;
    if (immediate || now - sellArmedAt < 1000) { uiCommand({ type: 'sell', towerId: t.id }); sellArmedAt = -1e9; }
    else { sellArmedAt = now; audio.ui('click'); }
  }
  function pause(): void {
    if (scene !== 'play') return;
    if (sel.mode === 'placing') setSelection({ mode: 'none' });
    restartArmedAt = -1e9;
    setScene('paused');
  }
  function openSettings(): void {
    settingsReturn = scene === 'paused' ? 'paused' : 'title';
    setScene('settings');
  }
  function toggleSetting(key: SettingKey): void {
    const s = settings.get();
    if (key === 'reduceMotion' || key === 'colourblind' || key === 'autoStart') settings.set({ [key]: !s[key] } as Partial<Settings>);
    audio.ui('click');
  }
  function setSlider(key: SettingKey, value: number): void {
    if (settings.get()[key] === value) return;
    settings.set({ [key]: value } as Partial<Settings>);
    if (key === 'sfx') audio.ui('sfxPreview');
  }

  function exec(a: Action): void {
    switch (a.type) {
      case 'select': selectKind(a.kind); break;
      case 'cancel': setSelection({ mode: 'none' }); break;
      case 'pause': pause(); break;
      case 'resume': setScene('play'); break;
      case 'go': go(); break;
      case 'upgrade': upgrade(a.path); break;
      case 'cycleTarget': cycleTarget(1); break;
      case 'sell': sell(false); break;
      case 'autoStart': settings.set({ autoStart: !settings.get().autoStart }); audio.ui('click'); break;
      case 'mute': settings.set({ muted: !settings.get().muted }); break;
      case 'restart':
        if (now - restartArmedAt < 2000) restart();
        else { restartArmedAt = now; audio.ui('click'); }
        break;
      case 'play': audio.ui('click'); startPlay(); break;
      case 'openSettings': audio.ui('click'); openSettings(); break;
      case 'back': audio.ui('click'); setScene(settingsReturn); break;
      case 'retry':
        if (endCardVisible()) { audio.ui('click'); restart(); }
        break;
      case 'none': break;
    }
  }

  function endCardVisible(): boolean {
    if (scene === 'gameover') return now - defeatAt >= 1200;
    if (scene === 'victory') return now - victoryAt >= 2200;
    return false;
  }

  // ───────── pointer & keys ─────────
  function hoverChanged(a: unknown, b: unknown): void { if (b && JSON.stringify(a) !== JSON.stringify(b)) audio.ui('hover'); }

  function pointerMove(x: number, y: number): void {
    pointer.x = x; pointer.y = y; pointer.inside = true;
    if (scene === 'title') { const h = titleHit(x, y); hoverChanged(hoverTitle, h); hoverTitle = h; }
    else if (scene === 'play') {
      const t = selectedTower();
      const h = x >= FIELD.w ? sidebarHit(x, y, t) : null;
      if (!sameHit(h, hoverSide)) { hoverSince = now; hoverChanged(hoverSide, h); }
      hoverSide = h;
      hoverPauseBtn = inRect(HUD.pause, x, y);
    } else if (scene === 'paused') { const h = pauseHit(x, y); hoverChanged(hoverPause, h); hoverPause = h; }
    else if (scene === 'settings') {
      if (dragKey) setSlider(dragKey, sliderValue(x));
      const h = settingsHit(x, y); hoverChanged(hoverSettings && hoverSettings.k, h && h.k); hoverSettings = h;
    } else if (scene === 'gameover' || scene === 'victory') {
      const h = endCardVisible() ? endHit(x, y, scene === 'victory') : null; hoverChanged(hoverEnd, h); hoverEnd = h;
    }
  }

  function pointerDown(x: number, y: number, button = 0): void {
    audio.unlock();
    idleSince = now;
    pointerMove(x, y);
    if (button === 2) { if (sel.mode === 'placing') setSelection({ mode: 'none' }); return; }
    if (button !== 0) return;
    switch (scene) {
      case 'title': {
        const h = titleHit(x, y);
        if (h === 'play') exec({ type: 'play' });
        else if (h === 'settings') exec({ type: 'openSettings' });
        return;
      }
      case 'play': return playClick(x, y);
      case 'paused': {
        const h = pauseHit(x, y);
        if (h === 'resume') { audio.ui('click'); setScene('play'); }
        else if (h === 'restart') exec({ type: 'restart' });
        else if (h === 'settings') { audio.ui('click'); openSettings(); }
        else if (h === 'quit') { audio.ui('click'); toTitle(); }
        return;
      }
      case 'settings': {
        const h = settingsHit(x, y);
        if (!h) return;
        if (h.k === 'back') exec({ type: 'back' });
        else if (h.k === 'toggle') toggleSetting(h.key);
        else { dragKey = h.key; setSlider(h.key, h.value); }
        return;
      }
      case 'gameover':
      case 'victory': {
        if (!endCardVisible()) return;
        const h = endHit(x, y, scene === 'victory');
        if (h === 'retry') exec({ type: 'retry' });
        else if (h === 'title') { audio.ui('click'); toTitle(); }
        return;
      }
      default: return;
    }
  }

  function playClick(x: number, y: number): void {
    if (inRect(HUD.pause, x, y)) { audio.ui('click'); pause(); return; }
    if (x >= FIELD.w) {
      const t = selectedTower();
      const h = sidebarHit(x, y, t);
      if (!h) return;
      switch (h.k) {
        case 'card': selectKind(h.kind); break;
        case 'close': audio.ui('click'); setSelection({ mode: 'none' }); break;
        case 'target': cycleTarget(h.dir); break;
        case 'tier': if (t) {
          const v = tierStatus(sim.state, t, h.path, h.tier);
          if (v.status === 'next') upgrade(h.path);
          else audio.ui(v.status === 'sealed' ? 'sealed' : 'invalid');
        } break;
        case 'sell': sell(true); break;
        case 'auto': exec({ type: 'autoStart' }); break;
        case 'go': go(); break;
      }
      return;
    }
    if (sel.mode === 'placing') {
      const kind = sel.kind;
      const fail = canPlace(sim.state, kind, x, y, TOWERS[kind].cost);
      if (fail) { audio.ui('invalid'); nudgeAt = now; return; }
      uiCommand({ type: 'place', kind, x, y });
      setSelection({ mode: 'none' });
      return;
    }
    const t = towerAt(x, y);
    if (t) { audio.ui('click'); setSelection({ mode: 'selected', towerId: t.id }); }
    else if (sel.mode === 'selected') setSelection({ mode: 'none' });
  }

  function key(k: string): void {
    audio.unlock();
    idleSince = now;
    exec(keyAction(k, { scene, placing: sel.mode === 'placing', selected: sel.mode === 'selected' }));
  }

  // DOM wiring
  const toLogical = (e: Event): { x: number; y: number } => {
    const pe = e as PointerEvent;
    const r = canvas.getBoundingClientRect?.() ?? { left: 0, top: 0, width: LOGICAL_W, height: LOGICAL_H };
    return { x: ((pe.clientX - r.left) * LOGICAL_W) / (r.width || LOGICAL_W), y: ((pe.clientY - r.top) * LOGICAL_H) / (r.height || LOGICAL_H) };
  };
  canvas.addEventListener('pointermove', (e) => { const p = toLogical(e); pointerMove(p.x, p.y); });
  canvas.addEventListener('pointerdown', (e) => { const p = toLogical(e); pointerDown(p.x, p.y, (e as PointerEvent).button ?? 0); (e as Event).preventDefault?.(); });
  canvas.addEventListener('pointerup', () => { dragKey = null; });
  canvas.addEventListener('pointerleave', () => { pointer.inside = false; hoverSide = null; dragKey = null; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault?.());
  win?.addEventListener('keydown', (e) => {
    const ke = e as KeyboardEvent;
    if (ke.repeat && ke.key !== 'Backspace') return;
    if (ke.key === ' ' || ke.key === 'Backspace' || ke.key === 'Delete') ke.preventDefault?.();
    key(ke.key);
  });
  win?.addEventListener('pointerup', () => { dragKey = null; });
  const autoPause = (): void => { if (!scripted && scene === 'play') pause(); };
  win?.addEventListener('blur', autoPause);
  doc?.addEventListener('visibilitychange', () => { if (doc.hidden) autoPause(); });

  // ───────── per-frame ─────────
  function currentGo(): GoView {
    return goView(sim.state.phase, speed, sim.state.towers.length, now - idleSince, roundsStarted);
  }

  function hintText(): string | null {
    if (scene !== 'play' || sim.state.phase !== 'intermission' || roundsStarted > 0) return null;
    if (sim.state.towers.length === 0 && !firstPlaced) return sel.mode === 'placing' ? 'Green ring is a good spot.' : 'Pick a defender — click the Tern or press 1.';
    return 'Space — let the ink in.';
  }

  function musicFor(): MusicState {
    switch (scene) {
      case 'title': return 'title';
      case 'gameover': return 'gameover';
      case 'victory': return 'victory';
      case 'settings': if (settingsReturn === 'title') return 'title'; break;
      default: break;
    }
    const s = sim.state;
    if (s.phase === 'intermission') return 'intermission';
    if (s.boss || warned) return 'boss';
    return s.round >= STORM_FROM_ROUND ? 'storm' : 'round';
  }

  function frame(dtMs: number, draw: boolean): void {
    const dt = Math.max(0, dtMs);
    now += dt;
    lastDt = dt;
    const worldRuns = scene !== 'paused' && !(scene === 'settings' && settingsReturn === 'paused');
    if (worldRuns) worldNow += dt;
    // attract sim behind the title (frozen once Play is pressed)
    if (scene === 'title' || (scene === 'settings' && settingsReturn === 'title')) {
      const n = attractLoop.frame(dt, 1, false);
      for (let i = 0; i < n; i++) { attract.step(); feed(attractLayers, attract, false); }
      updateLayers(attractLayers, dt, attract);
    }
    const n = loop.frame(dt, speed, scene !== 'play');
    for (let i = 0; i < n; i++) {
      beforeStep?.(sim);
      sim.step();
      feed(layers, sim, true);
      hud.endStep(sim.state, now);
      cacheTowers();
    }
    if (worldRuns) updateLayers(layers, dt, sim);
    hud.update(dt, now, sim.state);
    const h = hintText();
    if (h !== lastHint) { hud.setHint(h, now); lastHint = h; }
    if (sel.mode === 'selected' && !selectedTower()) setSelection({ mode: 'none' });
    if (!headless) {
      const m = musicFor();
      if (m !== music) { music = m; audio.setMusic(m); }
      audio.update(now);
    }
    if (draw) render();
  }

  // ───────── compositor (§10.5 order) ─────────
  function passes(L: Layers, s: Sim, list: readonly DrawPass[], alpha: number, frameAlpha: number): void {
    const f: RenderFrame = { ctx: c, state: s.state, alpha: frameAlpha, nowMs: worldNow, dtMs: lastDt, settings: settings.get() };
    for (const p of list) {
      for (const layer of [L.towers, L.blots, L.fx]) {
        c.save();
        c.globalAlpha = alpha;
        layer.draw(f, p);
        c.restore();
      }
    }
  }

  function render(): void {
    const base = canvas.width / LOGICAL_W || 1;
    c.setTransform(base, 0, 0, base, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    const s = settings.get();
    if (sheet) { sheet === 'blots-grid' ? drawBlotsGrid(c, 0) : drawTowersSheet(c, 0); return; }
    garden.drawPaper(c);
    const onTitle = scene === 'title' || (scene === 'settings' && settingsReturn === 'title');
    if (onTitle) {
      const t = now - sceneAt;
      const mapA = clamp01((scene === 'title' ? t : 400) / 400);
      garden.drawGround(c, worldNow, { alpha: mapA, placing: false, reduceMotion: s.reduceMotion, scale: base, dyn: attractDyn });
      if (mapA > 0) {
        passes(attractLayers, attract, ['decals', ...PASSES_LOW], mapA, attractLoop.alpha);
        garden.drawOccluders(c, mapA);
        passes(attractLayers, attract, ['towers', ...PASSES_HIGH], mapA, attractLoop.alpha);
      }
      garden.drawVignette(c);
      drawTitle(c, { t: scene === 'title' ? t : 1e6, leave: 0, hover: scene === 'title' ? hoverTitle : null, settings: s });
      if (scene === 'settings') { drawDim(c, 1); c.fillStyle = 'rgba(28,26,36,.45)'; c.fillRect(FIELD.w, 0, LOGICAL_W - FIELD.w, LOGICAL_H); drawSettings(c, { t: now - sceneAt, s, hover: hoverSettings, nowMs: now }); }
      garden.drawGrain(c);
      return;
    }
    const st = sim.state;
    const placing = scene === 'play' && sel.mode === 'placing' ? sel.kind : null;
    const trans = clamp01((now - playAt) / 400);
    const inTrans = trans < 1;
    const shake = hud.shakeOffset(now, s);
    c.save();
    c.translate(shake.x, shake.y);
    garden.drawGround(c, worldNow, { alpha: 1, placing: placing !== null, reduceMotion: s.reduceMotion, scale: base, dyn: hud.garden });
    passes(layers, sim, ['decals'], 1, loop.alpha);
    const selT = selectedTower();
    if (selT && scene === 'play') drawSelection(c, selT, selectedAt, now, s);
    passes(layers, sim, PASSES_LOW, 1, loop.alpha);
    garden.drawOccluders(c, 1);
    passes(layers, sim, ['towers'], 1, loop.alpha);
    morphs = morphs.filter((m) => drawMorph(c, m, now));
    sinks = sinks.filter((k) => drawSink(c, k, now));
    passes(layers, sim, PASSES_HIGH, 1, loop.alpha);
    if (inTrans) {
      // §10.1 Play pressed: attract blots fade, attract towers fold to 0 (160 ms, 40-ms stagger)
      passes(attractLayers, attract, PASSES_LOW, 1 - outCubic(trans), attractLoop.alpha);
      const el = now - playAt;
      ATTRACT.towers.forEach((t, i) => {
        const k = 1 - outCubic((el - i * 40) / 160);
        if (k > 0) drawTowerSprite(c, t.kind, t.tiers, t.x, t.y, { angle: -Math.PI / 2, scale: k, coaster: true, nowMs: worldNow });
      });
    }
    if (selT && scene === 'play' && hoverSide?.k === 'tier') {
      const v = tierStatus(st, selT, hoverSide.path, hoverSide.tier);
      if (v.status === 'next') {
        const tiers: [number, number] = [selT.tiers[0], selT.tiers[1]];
        tiers[hoverSide.path] = hoverSide.tier;
        drawUpgradePreview(c, selT, tiers, now);
      }
    }
    if (st.towers.length === 0 && !firstPlaced && roundsStarted === 0 && (scene === 'play' || scene === 'paused')) {
      const star = BEST_SPOTS.star;
      drawStar(c, star.x, star.y, now, placing !== null && Math.hypot(pointer.x - star.x, pointer.y - star.y) < 24, s.reduceMotion);
    }
    if (placing && pointer.inside && pointer.x < FIELD.w) {
      const fail = canPlace(st, placing, pointer.x, pointer.y, TOWERS[placing].cost);
      if (fail && !lastFail) nudgeAt = now;
      lastFail = fail;
      drawGhost(c, { kind: placing, x: pointer.x, y: pointer.y, fail, nudgeAt, nowMs: now });
    }
    c.restore();
    garden.drawVignette(c);
    const hv = { state: st, settings: s, nowMs: now, offsetY: inTrans ? -(1 - outCubic(trans)) * 80 : 0, hoverPause: hoverPauseBtn && scene === 'play' };
    hud.drawFloats(c, hv);
    hud.draw(c, hv);
    hud.drawBossBar(c, hv);
    hud.drawBanner(c, hv);
    const pm = portraitMorph && selT && portraitMorph.towerId === selT.id ? portraitMorph : null;
    drawSidebar(c, {
      state: st, settings: s, nowMs: now, tower: selT, placing, hover: scene === 'play' ? hoverSide : null, hoverSince,
      go: currentGo(), panelAt, prevTower: prevPanelTower, prevWasFold: prevPanelWasFold,
      ternGlow: st.towers.length === 0 && !firstPlaced && roundsStarted === 0 && placing === null,
      morph: pm ? { from: pm.from, born: pm.born } : null, boxChange, offsetX: inTrans ? (1 - outCubic(trans)) * 220 : 0,
      sellArmed: now - sellArmedAt < 1000,
    });
    if (inTrans) drawTitle(c, { t: 1e6, leave: trans, hover: null, settings: s });
    // drain after "Try again" (300 ms)
    const dr = (now - drainAt) / 300;
    if (dr >= 0 && dr < 1) drawFlood(c, 1 - outCubic(dr), now);
    switch (scene) {
      case 'paused':
        drawDim(c, clamp01((now - sceneAt) / MOTION_UI));
        drawPause(c, { t: now - sceneAt, hover: hoverPause, restartArmed: now - restartArmedAt < 2000, settings: s });
        break;
      case 'settings':
        drawDim(c, 1);
        drawSettings(c, { t: now - sceneAt, s, hover: hoverSettings, nowMs: now });
        break;
      case 'gameover': {
        const t = now - defeatAt;
        drawFlood(c, (t / 1200) ** 2 > 1 ? 1 : (t / 1200) ** 2, now);
        drawGameOverCard(c, { t: t - 1200, hover: hoverEnd, settings: s, line1: `Round ${st.round} · ${fmt0(st.stats.pops)} blots torn` });
        break;
      }
      case 'victory': {
        const t = now - victoryAt;
        if (t > 1000) drawCranes(c, cranes, t - 1000, s.reduceMotion);
        const best = st.towers.reduce<Tower | null>((b, k) => (!b || k.pops > b.pops ? k : b), null);
        drawVictoryCard(c, {
          t: t - 2200, hover: hoverEnd, settings: s,
          line1: `Seeds left ${fmt0(st.lives)} · ${fmt0(st.stats.pops)} blots torn`,
          line2: best ? bestDefenderLine(towerTitle(best.kind, best.tiers), best.pops) : undefined,
        });
        break;
      }
      default: break;
    }
    garden.drawGrain(c);
  }

  makeAttract();

  const debug: GameDebug = {
    settings,
    get nowMs() { return now; },
    newRun(o, isScripted) { newRun(o ?? {}, isScripted ?? false); playAt = -1e9; drainAt = -1e9; },
    toTitle,
    frame(dtMs, draw) { headless = !draw; try { frame(dtMs, draw); } finally { headless = false; } },
    render,
    pointerMove,
    pointerDown,
    pointerUp() { dragKey = null; },
    key,
    setSheet(id) { sheet = id; },
    watch(fn) { watcher = fn; },
    get selection() { return sel; },
    get go() { return currentGo(); },
    get hint() { return hintText(); },
  };

  return {
    get sim() { return sim; },
    scene: () => scene,
    speed: () => speed,
    command: (cmd) => sim.enqueue(cmd),
    frame: (dtMs) => frame(dtMs, true),
    restart,
    setBeforeStep(fn) { beforeStep = fn; },
    debug,
  };
}

const MOTION_UI = 160;
const fmt0 = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export { DEFAULT_SETTINGS };
