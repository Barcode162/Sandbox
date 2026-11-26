// src/ui/index.ts — owned by WO-004. DOM HUD + menus (experience.md §4.6, §8, §9): coin pill (coins fly in and
// tick the count one by one) + gear, hearts with half steps, the boss nameplate (projected, clamped, clear of the
// pill) with a red bar and a 450 ms lagging white chunk, the title, the pause/settings panel (RESUME · SOUND ·
// QUALITY · REDUCE SHAKE · RESTART FIGHT), SKY CLEARED / FALLEN cards, hints, the phase-2 banner, the bridge line,
// the hurt vignette and the retry veil. Reads SimState every frame; writes the DOM only when something changed.
import * as THREE from 'three';
import type { CreateUi, FrameInfo, GameControl, Phase, RenderContext, SimEventOf } from '../contracts.ts';
import { ARENA } from '../tuning/arena.ts';
import { COPY, UI } from '../tuning/ui.ts';
import { golemAnchor } from '../golem/view.ts';
import { arrivalTime, COIN_FLY_S, coinWorld, golemBurst, golemBurstTime, handoffTime, minionBurstTime, MINION_BURST, unarrived, type CoinBurst } from '../golem/coins.ts';
import { GOLEM } from '../tuning/golem.ts';


const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeInCubic = (t: number) => t * t * t;

// Original line icons (22 px, 1.75 px white stroke).
const svg = (body: string, size = 22) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON = {
  resume: svg('<path d="M8 5.5v13l10.5-6.5z"/>'),
  sound: svg('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  soundOff: svg('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
  quality: svg('<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5"/>'),
  shake: svg('<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M4 20 20 4"/>'),
  restart: svg('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>'),
  gear: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/><circle cx="12" cy="12" r="6.6"/>', 30),
};
const HEART = '<svg viewBox="0 0 24 22" aria-hidden="true"><path d="M12 20.5S2 14.3 2 7.6A5.1 5.1 0 0 1 12 5a5.1 5.1 0 0 1 10 2.6c0 6.7-10 12.9-10 12.9z"/></svg>';
const COIN = '<span class="coin" aria-hidden="true"><span class="coin-star"></span></span>';
const EMBER = '<svg class="ember" viewBox="0 0 12 14" aria-hidden="true"><path d="M6 .5C7 3.5 11 5 11 9a5 5 0 0 1-10 0c0-2 1.2-3.2 2.2-4C3.5 6.8 4.6 7.6 5.6 7.4 5 5.2 5.2 2.8 6 .5z"/></svg>';

export const createUi: CreateUi = () => {
  let root!: HTMLElement;
  let ctx!: RenderContext;
  let control!: GameControl;
  const q = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;
  // Elements
  let hud!: HTMLElement, coinsEl!: HTMLElement, coinValue!: HTMLElement, coinLast!: HTMLElement, heartsEl!: HTMLElement;
  let plate!: HTMLElement, plateFill!: HTMLElement, plateLag!: HTMLElement, plateWave!: HTMLElement;
  let title!: HTMLElement, pausePanel!: HTMLElement, scrim!: HTMLElement, victory!: HTMLElement, defeat!: HTMLElement;
  let hint!: HTMLElement, banner!: HTMLElement, vignette!: HTMLElement, veil!: HTMLElement, legend!: HTMLElement, flyLayer!: HTMLElement;
  let restartLabel!: HTMLElement;
  const hearts: { el: HTMLElement; fill: HTMLElement }[] = [];
  const fly: HTMLElement[] = [];
  // State mirrored into the DOM
  let lastPhase: Phase | null = null;
  let shownCoins = -1, lastBump = -1, flashUntil = 0;
  let lastHp = -1, lastMaxHp = -1, heartShakeAt = -9;
  let golemRef: unknown = null, lastGolemHp = -1, lag = 1, lagFrom = 1, lagHoldUntil = 0, lagDrainStart = -1, plateOpacity = 0;
  let plateWant = false, plateFrom = 0, plateAt = -9;
  let enrageSeen = false, wave = 0;
  let hintText = '', hintUntil = 0, bridgeUntil = 0, vignetteAt = -9;
  /** Sim clock (frame / 60): event-timed overlays stay right under manual stepping and slow-mo. */
  let simT = 0;
  let stateRef: { frame: number } | null = null;
  const evT = () => (stateRef ? stateRef.frame / 60 : simT);
  let rollHintDone = false, skillHintDone = false, nearBridge = false;
  let restartArmedUntil = -1;
  let fightStart = -1, lastPaused = false, bestWave = 1;
  let now = 0, prevNow = 0;
  const pill = { x: 0, y: 0, w: 0, h: 0, coinX: 0, coinY: 0 };
  let plateW = 180, plateH = 44;
  const v3 = new THREE.Vector3();
  const coinP = { x: 0, y: 0, z: 0 };
  const scratchBurst: CoinBurst = { count: 0, amount: 0, up: 0, out: 0, handoff: 0 };
  let vw = 1, vh = 1;
  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  function measure(): void {
    vw = root.clientWidth || innerWidth;
    vh = root.clientHeight || innerHeight;
    const r = coinsEl.getBoundingClientRect(), base = root.getBoundingClientRect();
    pill.x = r.left - base.left;
    pill.y = r.top - base.top;
    pill.w = r.width;
    pill.h = r.height;
    const c = (coinsEl.querySelector('.coin') as HTMLElement).getBoundingClientRect();
    pill.coinX = c.left - base.left + c.width / 2;
    pill.coinY = c.top - base.top + c.height / 2;
    plateW = plate.offsetWidth || plateW;
    plateH = plate.offsetHeight || plateH;
  }

  function project(x: number, y: number, z: number, out: { x: number; y: number; on: boolean }): void {
    v3.set(x, y, z).project(ctx.camera);
    out.x = (v3.x * 0.5 + 0.5) * vw;
    out.y = (-v3.y * 0.5 + 0.5) * vh;
    out.on = v3.z < 1;
  }
  const scr = { x: 0, y: 0, on: false };

  function showHint(text: string, seconds: number): void {
    hintText = text;
    hint.textContent = text;
    hintUntil = evT() + seconds;
  }

  function buildDom(): void {
    const coinsFly = Array.from({ length: GOLEM.coinCount + MINION_BURST.count * 6 }, () => `<span class="fly-coin">${COIN}</span>`).join('');
    root.insertAdjacentHTML(
      'beforeend',
      `<div class="vignette" aria-hidden="true"></div>
       <div class="nameplate" data-testid="nameplate" aria-hidden="true">
         <div class="np-name">${EMBER}<span>${COPY.boss}</span></div>
         <div class="np-bar"><div class="np-lag"></div><div class="np-fill"></div></div>
         <div class="np-wave"></div>
       </div>
       <div class="hud" data-testid="hud">
         <div class="hearts" data-testid="hearts" role="img" aria-label="Health"></div>
         <div class="coins" data-testid="coins" aria-label="Coins">${COIN}<span class="coin-value"><span class="cv-head"></span><span class="cv-last"></span></span></div>
         <button class="gear" type="button" aria-label="Pause and settings" data-testid="pause">${ICON.gear}</button>
       </div>
       <div class="hint" aria-live="polite"></div>
       <div class="banner" aria-live="polite">${COPY.kindles}</div>
       <div class="legend">${COPY.legend}</div>
       <div class="fly-layer" aria-hidden="true">${coinsFly}</div>
       <div class="title-card" data-testid="title">
         <h1>${COPY.title}</h1>
         <p class="subtitle">${COPY.subtitle}</p>
         <button type="button" class="prompt" data-testid="start">${coarse ? COPY.promptTouch : COPY.promptKeys}</button>
       </div>
       <div class="scrim" aria-hidden="true"></div>
       <div class="panel pause-panel" data-testid="pause-panel" role="dialog" aria-label="Paused" hidden>
         <button type="button" class="row" data-row="resume">${ICON.resume}<span class="label">Resume</span><span class="value"></span></button>
         <button type="button" class="row" data-row="sound"><span class="ico">${ICON.sound}</span><span class="label">Sound</span><span class="value" data-testid="val-sound"></span></button>
         <button type="button" class="row" data-row="quality">${ICON.quality}<span class="label">Quality</span><span class="value" data-testid="val-quality"></span></button>
         <button type="button" class="row" data-row="shake">${ICON.shake}<span class="label">Reduce shake</span><span class="value" data-testid="val-shake"></span></button>
         <button type="button" class="row" data-row="restart">${ICON.restart}<span class="label restart-label">Restart fight</span><span class="value"></span></button>
       </div>
       <div class="panel card victory" data-testid="victory" role="dialog" aria-label="${COPY.victory}" hidden>
         <h2>${COPY.victory}</h2>
         <p class="card-sub">${COPY.victorySub}</p>
         <p class="card-stats"><span class="v-coins"></span> · <span class="v-time"></span></p>
         <div class="card-buttons"><button type="button" class="primary" data-act="next" data-testid="next-wave">Next wave</button><button type="button" class="secondary" data-act="title">Title</button></div>
       </div>
       <div class="panel card defeat" data-testid="defeat" role="dialog" aria-label="${COPY.fallen}" hidden>
         <h2>${COPY.fallen}</h2>
         <p class="card-sub">${COPY.fallenSub}</p>
         <div class="card-buttons"><button type="button" class="primary" data-act="retry" data-testid="try-again">Try again</button><button type="button" class="secondary" data-act="title">Title</button></div>
       </div>
       <div class="veil" aria-hidden="true"></div>`,
    );
    hud = q('.hud');
    coinsEl = q('.coins');
    coinValue = q('.cv-head');
    coinLast = q('.cv-last');
    heartsEl = q('.hearts');
    plate = q('.nameplate');
    plateFill = q('.np-fill');
    plateLag = q('.np-lag');
    plateWave = q('.np-wave');
    title = q('.title-card');
    pausePanel = q('.pause-panel');
    scrim = q('.scrim');
    victory = q('.victory');
    defeat = q('.defeat');
    hint = q('.hint');
    banner = q('.banner');
    vignette = q('.vignette');
    veil = q('.veil');
    legend = q('.legend');
    flyLayer = q('.fly-layer');
    restartLabel = q('.restart-label');
    fly.push(...(Array.from(flyLayer.children) as HTMLElement[]));
  }

  function buildHearts(maxHp: number): void {
    heartsEl.textContent = '';
    hearts.length = 0;
    for (let i = 0; i < Math.ceil(maxHp / 2); i++) {
      const el = document.createElement('span');
      el.className = 'heart';
      el.innerHTML = `<span class="h-empty">${HEART}</span><span class="h-fill">${HEART}</span>`;
      heartsEl.append(el);
      hearts.push({ el, fill: el.querySelector('.h-fill') as HTMLElement });
    }
  }

  function syncPanel(): void {
    const s = control.settings.get();
    q<HTMLElement>('[data-testid="val-sound"]').textContent = s.volume > 0 ? 'On' : 'Off';
    q<HTMLElement>('[data-row="sound"] .ico').innerHTML = s.volume > 0 ? ICON.sound : ICON.soundOff;
    q<HTMLElement>('[data-testid="val-quality"]').textContent = s.quality === 'auto' ? 'Auto' : s.quality === 'high' ? 'High' : 'Low';
    q<HTMLElement>('[data-testid="val-shake"]').textContent = s.reduceShake ? 'On' : 'Off';
    root.dataset.quality = ctx.renderer.quality;
  }

  function click(): void {
    control.audio.play('uiClick');
  }

  /** Veil in, then do it (the sim swap happens under the veil); the veil fades out when the intro starts. */
  function underVeil(fn: () => void): void {
    veil.classList.add('on');
    setTimeout(fn, UI.veilInMs);
  }

  function wire(): void {
    const start = () => {
      if (lastPhase !== 'title') return;
      void control.audio.unlock();
      control.audio.play('uiOpen');
      control.start();
    };
    title.addEventListener('pointerdown', start);
    addEventListener('keydown', (e) => {
      if (lastPhase === 'title' && !e.repeat && e.key !== 'Escape') start();
    });
    q('.gear').addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      void control.audio.unlock();
      control.audio.play(control.paused ? 'uiBack' : 'uiOpen');
      control.setPaused(!control.paused);
    });
    scrim.addEventListener('pointerdown', () => {
      control.audio.play('uiBack');
      control.setPaused(false);
    });
    pausePanel.addEventListener('click', (e) => {
      const row = (e.target as HTMLElement).closest('[data-row]') as HTMLElement | null;
      if (!row) return;
      const s = control.settings.get();
      switch (row.dataset.row) {
        case 'resume':
          control.audio.play('uiBack');
          control.setPaused(false);
          return;
        case 'sound': {
          // Toggle 0 ↔ the last non-zero volume.
          const last = Number(root.dataset.lastVolume ?? '0.8') || 0.8;
          if (s.volume > 0) root.dataset.lastVolume = String(s.volume);
          control.settings.set({ volume: s.volume > 0 ? 0 : last });
          break;
        }
        case 'quality':
          control.settings.set({ quality: s.quality === 'auto' ? 'high' : s.quality === 'high' ? 'low' : 'auto' });
          break;
        case 'shake':
          control.settings.set({ reduceShake: !s.reduceShake });
          break;
        case 'restart':
          if (restartArmedUntil > 0 && performance.now() < restartArmedUntil) {
            restartArmedUntil = -1;
            restartLabel.textContent = 'Restart fight';
            control.setPaused(false);
            underVeil(() => control.retry());
          } else {
            restartArmedUntil = performance.now() + UI.confirmS * 1000;
            restartLabel.textContent = 'Tap again to restart';
          }
          break;
      }
      click();
      syncPanel();
    });
    for (const card of [victory, defeat]) {
      card.addEventListener('click', (e) => {
        const b = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
        if (!b) return;
        click();
        if (b.dataset.act === 'title') underVeil(() => control.toTitle());
        else underVeil(() => control.retry());
      });
    }
    addEventListener('resize', () => requestAnimationFrame(measure));
    control.settings.subscribe(() => syncPanel());
  }

  function phaseChanged(p: Phase, prev: Phase | null, f: FrameInfo): void {
    root.dataset.phase = p;
    title.classList.toggle('gone', p !== 'title');
    hud.classList.toggle('in', p === 'fight' || p === 'victory' || p === 'defeat');
    if (p === 'title') {
      title.hidden = false;
      enrageSeen = false;
      rollHintDone = skillHintDone = false;
    }
    if (p === 'intro' && (prev === 'victory' || prev === 'defeat' || prev === 'fight' || prev === 'intro')) veil.classList.remove('on');
    if (p === 'intro' || p === 'title') veil.classList.remove('on');
    if (p === 'fight') {
      fightStart = now;
      legend.classList.toggle('show', !coarse);
    }
    victory.hidden = p !== 'victory';
    defeat.hidden = p !== 'defeat';
    victory.classList.toggle('pop', p === 'victory');
    defeat.classList.toggle('pop', p === 'defeat');
    if (p === 'victory') {
      const s = f.state;
      bestWave = Math.max(bestWave, s.wave);
      const secs = Math.round(s.fightFrames / 60);
      (victory.querySelector('.v-coins') as HTMLElement).textContent = `+${fmt(golemBurst(s, scratchBurst).amount)} coins`;
      (victory.querySelector('.v-time') as HTMLElement).textContent = `Wave ${s.wave} · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}${bestWave > 1 ? ` · Best wave ${bestWave}` : ''}`;
      requestAnimationFrame(() => (victory.querySelector('.primary') as HTMLElement).focus({ preventScroll: true }));
    }
    if (p === 'defeat') requestAnimationFrame(() => (defeat.querySelector('.primary') as HTMLElement).focus({ preventScroll: true }));
    requestAnimationFrame(measure);
  }

  function updateCoins(f: FrameInfo): void {
    const s = f.state;
    const shown = s.coins - unarrived(s, scratchBurst);
    if (shown !== shownCoins) {
      if (shownCoins >= 0 && shown > shownCoins && now - lastBump >= UI.bumpGapS) {
        lastBump = now;
        coinsEl.classList.remove('bump');
        void coinsEl.offsetWidth;
        coinsEl.classList.add('bump');
        flashUntil = now + 0.12;
      }
      shownCoins = shown;
      const txt = fmt(shown);
      coinValue.textContent = txt.slice(0, -1);
      coinLast.textContent = txt.slice(-1);
    }
    coinLast.classList.toggle('flash', now < flashUntil);
    // Coins in flight: from where each coin was handed off (projected) to the pill's coin, on a screen arc.
    let n = 0;
    const flyOne = (b: CoinBurst, i: number, ox: number, oz: number, t: number) => {
      const t0 = handoffTime(b, i);
      if (t < t0 || t >= arrivalTime(b, i) || n >= fly.length) return;
      coinWorld(b, i, ox, oz, t0, coinP);
      project(coinP.x, coinP.y, coinP.z, scr);
      const p = easeInCubic(clamp01((t - t0) / COIN_FLY_S));
      const x = scr.x + (pill.coinX - scr.x) * p;
      const y = scr.y + (pill.coinY - scr.y) * p - Math.sin(Math.PI * p) * Math.min(160, vh * 0.18);
      const el = fly[n++]!;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.75 + 0.25 * p).toFixed(3)})`;
      el.style.opacity = '1';
    };
    const tg = golemBurstTime(s.golem, f.alpha);
    if (tg >= 0) {
      const b = golemBurst(s, scratchBurst);
      for (let i = 0; i < b.count; i++) flyOne(b, i, s.golem.pos.x, s.golem.pos.z, tg);
    }
    for (let m = 0; m < s.minions.length; m++) {
      const mn = s.minions[m]!;
      const tm = minionBurstTime(mn, f.alpha);
      if (tm >= 0 && tm < 3) for (let i = 0; i < MINION_BURST.count; i++) flyOne(MINION_BURST, i, mn.pos.x, mn.pos.z, tm);
    }
    for (let i = n; i < fly.length; i++) {
      const el = fly[i]!;
      if (el.style.opacity !== '0') el.style.opacity = '0';
    }
  }

  function updateHearts(f: FrameInfo): void {
    const h = f.state.hero;
    if (h.maxHp !== lastMaxHp) {
      lastMaxHp = h.maxHp;
      buildHearts(h.maxHp);
      lastHp = -1;
    }
    if (h.hp !== lastHp) {
      if (lastHp > h.hp && lastHp >= 0) heartShakeAt = now;
      lastHp = h.hp;
      for (let i = 0; i < hearts.length; i++) {
        const halves = Math.max(0, Math.min(2, h.hp - i * 2));
        hearts[i]!.fill.style.clipPath = halves === 2 ? 'none' : halves === 1 ? 'inset(0 50% 0 0)' : 'inset(0 100% 0 0)';
        hearts[i]!.el.classList.toggle('empty', halves === 0);
      }
    }
    const st = now - heartShakeAt;
    heartsEl.style.transform = st < 0.2 ? `translateX(${(Math.sin(st * 90) * 3).toFixed(1)}px)` : '';
  }

  function updatePlate(f: FrameInfo): void {
    const s = f.state;
    const g = s.golem;
    if (g !== golemRef) {
      // A new attempt: the bar starts full.
      golemRef = g;
      lastGolemHp = g.hp;
      lag = lagFrom = g.hp / g.maxHp;
      lagDrainStart = -1;
      plateOpacity = plateFrom = 0;
      plateWant = false;
    }
    const frac = clamp01(g.hp / g.maxHp);
    if (g.hp < lastGolemHp) {
      if (g.hp <= 0) {
        lag = lagFrom = 0; // the killing blow empties the whole bar together
        lagDrainStart = -1;
      } else {
        lagFrom = lag;
        lagHoldUntil = now + UI.lagHoldS;
        lagDrainStart = lagHoldUntil;
      }
    }
    lastGolemHp = g.hp;
    if (lagDrainStart >= 0 && now >= lagDrainStart) {
      const k = clamp01((now - lagDrainStart) / UI.lagDrainS);
      lag = lagFrom + (frac - lagFrom) * easeInOutCubic(k);
      if (k >= 1) lagDrainStart = -1;
    }
    if (lag < frac) lag = frac;
    plateFill.style.transform = `scaleX(${frac.toFixed(4)})`;
    plateLag.style.transform = `scaleX(${lag.toFixed(4)})`;
    // Visible once the Guardian stands (fades in 250 ms), fades out as it crumbles.
    const want = golemAnchor.visible && g.action !== 'wake' && (s.phase === 'fight' || s.phase === 'intro');
    if (want !== plateWant) {
      plateWant = want;
      plateFrom = plateOpacity;
      plateAt = now;
      // Stepped past the fade since the last frame (manual stepping): show the end state.
      if (now - prevNow > UI.nameplateFadeS) plateAt = -9;
    }
    // Time-based (sim-ambient clock) so manual stepping and moments see the same fade.
    const k = clamp01((now - plateAt) / UI.nameplateFadeS);
    plateOpacity = plateFrom + ((want ? 1 : 0) - plateFrom) * k;
    if (g.action === 'dying' || g.action === 'dead') plateOpacity = Math.max(0, 1 - golemBurstTime(g, f.alpha) / 0.5);
    plate.style.opacity = plateOpacity.toFixed(3);
    if (plateOpacity <= 0.001) return;
    if (g.enraged !== enrageSeen) {
      enrageSeen = g.enraged;
      plate.classList.toggle('kindled', g.enraged);
    }
    if (s.wave !== wave) {
      wave = s.wave;
      plateWave.textContent = wave >= 2 ? `Wave ${wave}` : '';
      requestAnimationFrame(measure);
    }
    // Project, clamp with an 8 % inset, keep clear of the coin pill.
    project(golemAnchor.x, golemAnchor.y, golemAnchor.z, scr);
    const inX = vw * UI.nameplateInset, inY = vh * UI.nameplateInset;
    let x = Math.min(vw - inX - plateW / 2, Math.max(inX + plateW / 2, scr.x)) - plateW / 2;
    let y = Math.min(vh - inY - plateH, Math.max(inY, scr.y - plateH));
    if (!scr.on) y = inY;
    const overlapX = x < pill.x + pill.w + 8 && x + plateW > pill.x - 8;
    const overlapY = y < pill.y + pill.h + 8;
    if (overlapX && overlapY) y = pill.y + pill.h + 10;
    plate.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  function updateHints(f: FrameInfo): void {
    const s = f.state;
    // Bridge wall line: near the bridge foot, once per approach.
    const h = s.hero;
    const near = s.phase === 'fight' && Math.hypot(h.pos.x - ARENA.bridgeFoot.x, h.pos.z - ARENA.bridgeFoot.z) < UI.bridgeNear;
    if (near && !nearBridge) bridgeUntil = now + UI.bridgeLineS;
    nearBridge = near;
    const showBridge = now < bridgeUntil;
    const text = showBridge ? COPY.bridge : simT < hintUntil ? hintText : '';
    if (hint.dataset.text !== text) {
      hint.dataset.text = text;
      if (text) hint.textContent = text;
      hint.classList.toggle('show', !!text);
      hint.classList.toggle('bridge', showBridge);
    }
    // The banner lasts exactly as long as the roar (1.2 s).
    banner.classList.toggle('show', s.golem.enraged && (s.golem.ext.roar ?? 0) > 0);
    const vt = simT - vignetteAt;
    const vOn = vt < UI.vignetteS && !control.settings.get().reduceFlash && !reducedMotion;
    vignette.style.opacity = vOn ? (0.25 * (1 - vt / UI.vignetteS)).toFixed(3) : '0';
    if (fightStart >= 0 && now - fightStart > UI.legendS) legend.classList.remove('show');
  }

  return {
    init(r: HTMLElement, c: RenderContext, ctl: GameControl) {
      root = r;
      ctx = c;
      control = ctl;
      buildDom();
      wire();
      syncPanel();
      c.bus.on('telegraph', () => {
        if (!rollHintDone) {
          rollHintDone = true;
          showHint(COPY.roll, UI.hintS);
        }
      });
      c.bus.on('stagger', (e: SimEventOf<'stagger'>) => {
        if (e.target === 'golem' && !skillHintDone) {
          skillHintDone = true;
          showHint(COPY.skill, UI.hintS);
        }
      });
      c.bus.on('hit', (e: SimEventOf<'hit'>) => {
        if (e.target === 'hero') vignetteAt = evT();
      });
      requestAnimationFrame(measure);
    },
    update(f: FrameInfo) {
      prevNow = now;
      now = f.time;
      const s = f.state;
      stateRef = s;
      simT = s.frame / 60;
      if (s.phase !== lastPhase) {
        const prev = lastPhase;
        lastPhase = s.phase;
        phaseChanged(s.phase, prev, f);
      }
      if (control.paused !== lastPaused) {
        lastPaused = control.paused;
        pausePanel.hidden = !lastPaused;
        scrim.classList.toggle('on', lastPaused);
        root.classList.toggle('paused', lastPaused);
        if (lastPaused) {
          syncPanel();
          restartArmedUntil = -1;
          restartLabel.textContent = 'Restart fight';
        }
      }
      if (restartArmedUntil > 0 && performance.now() > restartArmedUntil) {
        restartArmedUntil = -1;
        restartLabel.textContent = 'Restart fight';
      }
      if (root.dataset.quality !== ctx.renderer.quality) root.dataset.quality = ctx.renderer.quality;
      updateCoins(f);
      updateHearts(f);
      updatePlate(f);
      updateHints(f);
    },
    dispose() {
      root.textContent = '';
    },
  };
};
