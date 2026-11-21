/**
 * DOM overlay (§5.3, §7 HUD, title text, result cards, pause menu, tell diagram). OWNER: WO-003.
 * Touches the DOM only when a value changes. Card timing runs on the shared presentation clock
 * (render/clock.ts), so cards appear on the same frame schedule as the canvas, manual clock included.
 *
 * Interactive elements carry `data-ui="interactive"` and stop pointer/touch propagation, so a tap on a
 * button never also reaches the shell's tap-to-hop listener on window.
 */
import type { SimEvent, SimState, Ui, UiCallbacks, ViewState } from '../contracts';
import { presentation } from '../render/clock';
import { timerMs } from '../sim/sim';
import { COPY, bestLabel, cardCopy, cardDelayMs, formatTime, motionLabel, showStamp, soundLabel } from './format';
import { uiCss } from './styles';
import { TellDiagram, TellLegend } from './tell';

const ICON = {
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2" fill="#1D2B3A"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2" fill="#1D2B3A"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#1D2B3A"/><path d="M15 9a4 4 0 0 1 0 6M17.6 6.6a7.4 7.4 0 0 1 0 10.8" stroke="#1D2B3A" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>',
  muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#1D2B3A"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" stroke="#1D2B3A" stroke-width="2.2" stroke-linecap="round"/></svg>',
};

const STOP = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'dblclick'] as const;

export function createUi(root: HTMLElement, cb: UiCallbacks): Ui {
  const style = document.createElement('style');
  style.id = 'lily-ui-style';
  style.textContent = uiCss();
  document.head.appendChild(style);

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string, parent: HTMLElement = root): HTMLElementTagNameMap[K] => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    parent.appendChild(e);
    return e;
  };

  const interactive = (b: HTMLButtonElement, onPress: () => void): HTMLButtonElement => {
    b.type = 'button';
    b.dataset.ui = 'interactive';
    for (const t of STOP) b.addEventListener(t, (e) => e.stopPropagation());
    b.addEventListener('click', () => onPress());
    // Press state that also shows for synthetic and very short presses (F-015).
    b.addEventListener('pointerdown', () => b.classList.add('ly-down'));
    for (const t of ['pointerup', 'pointerleave', 'pointercancel', 'blur'] as const) b.addEventListener(t, () => b.classList.remove('ly-down'));
    // Enter/Space activate the focused button; they must not also hop or restart.
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
    });
    return b;
  };

  // Layers, back to front.
  const veil = el('div', 'ly-veil');
  const title = el('div', 'ly-title');
  el('h1', 'ly-word', COPY.wordmark, title);
  el('div', 'ly-hint', COPY.titleHint, title);
  const titleBest = el('div', 'ly-tbest', '', title);

  const hud = el('div', 'ly-hud ly-hide');
  const tabwrap = el('div', 'ly-tabwrap', undefined, hud);
  const tab = el('div', 'ly-tab', undefined, tabwrap);
  const timer = el('span', 'ly-timer', '0.00', tab);
  timer.dataset.test = 'timer';
  const best = el('div', 'ly-best', '', hud);

  const reed = el('div', 'ly-reed ly-hide');
  reed.setAttribute('aria-hidden', 'true');
  el('i', 'ly-goal', undefined, reed);
  const me = el('i', 'ly-me', undefined, reed);

  const btns = el('div', 'ly-btns');
  const pauseBtn = interactive(el('button', 'ly-round', undefined, btns), () => cb.pause());
  pauseBtn.innerHTML = ICON.pause;
  pauseBtn.setAttribute('aria-label', 'Pause');
  pauseBtn.dataset.test = 'pause';
  const muteBtn = interactive(el('button', 'ly-round', undefined, btns), () => cb.toggleMute());
  muteBtn.dataset.test = 'mute';

  const cards = el('div', 'ly-cards');
  const wipe = el('div', 'ly-wipe');
  wipe.setAttribute('aria-hidden', 'true');
  wipe.addEventListener('animationend', () => wipe.classList.remove('ly-run'));

  // Cached state (DOM writes only on change).
  let lastSim: SimState | null = null;
  const shown = { title: true, hud: false, reed: false, pauseBtn: true };
  let timerText = '0.00';
  let timerMode = '';
  let bestText = '';
  let titleBestText = '';
  let reedPct = -1;
  let mutedShown: boolean | null = null;
  let rmShown: boolean | null = null;
  let resultSeen = -1;
  let card: HTMLElement | null = null;
  let cardInner: HTMLElement | null = null;
  let cardBorn = -1;
  let stamp: HTMLElement | null = null;
  let diagram: TellDiagram | null = null;
  let pauseCard: HTMLElement | null = null;
  let pauseLabels: { sound: HTMLButtonElement; motion: HTMLButtonElement } | null = null;
  let legend: TellLegend | null = null;
  let legendBox: HTMLElement | null = null;
  let veilMode = '';

  const toggle = (e: HTMLElement, on: boolean) => e.classList.toggle('ly-hide', !on);

  function runWipe(): void {
    wipe.classList.remove('ly-run');
    void wipe.offsetWidth;
    wipe.classList.add('ly-run');
  }

  function clearCard(): void {
    card?.remove();
    card = cardInner = stamp = null;
    diagram = null;
    cardBorn = -1;
  }

  function buildCard(sim: SimState, view: ViewState): void {
    const r = sim.result!;
    const copy = cardCopy(r, view, sim.tuning.layers);
    card = el('div', `ly-cardwrap${r.kind === 'won' ? ' ly-bottom' : ''}`, undefined, cards);
    card.dataset.test = `card-${r.kind}`;
    cardInner = el('div', 'ly-card', undefined, card);
    cardInner.setAttribute('role', 'status');
    cardInner.setAttribute('aria-live', 'polite');
    const h = el('h2', '', copy.title, cardInner);
    if (copy.titleTime) el('span', 'ly-ttime', copy.titleTime, h);
    if (r.kind === 'sunk' && copy.callouts && r.culpritId !== null) {
      const culprit = sim.river.pads[r.culpritId]!;
      const honest = sim.river.layers[culprit.layer]!.find((p) => p.kind === 'lily') ?? null;
      diagram = new TellDiagram(culprit, honest, copy.callouts);
      cardInner.appendChild(diagram.canvas);
      diagram.canvas.dataset.test = 'tell-diagram';
    }
    if (copy.bestFromTo) {
      const p = el('p', 'ly-sub', 'best ', cardInner);
      el('s', '', copy.bestFromTo[0], p);
      p.append(` → ${copy.bestFromTo[1]}`);
    } else el('p', r.kind === 'won' ? 'ly-sub' : '', copy.line, cardInner);
    if (copy.hint) el('p', 'ly-sub', copy.hint, cardInner);
    el('p', 'ly-foot', copy.footer, cardInner);
    cardBorn = presentation.frames;
  }

  function buildPause(view: ViewState): void {
    pauseCard = el('div', 'ly-cardwrap', undefined, cards);
    pauseCard.dataset.test = 'card-pause';
    const inner = el('div', 'ly-card ly-in', undefined, pauseCard);
    inner.setAttribute('role', 'dialog');
    inner.setAttribute('aria-label', COPY.paused);
    el('h2', '', COPY.paused, inner);
    const menu = el('div', 'ly-menu', undefined, inner);
    const resume = interactive(el('button', 'ly-tabbtn ly-primary', COPY.resume, menu), () => cb.resume());
    interactive(el('button', 'ly-tabbtn', COPY.restart, menu), () => cb.restart());
    const sound = interactive(el('button', 'ly-tabbtn', soundLabel(view.settings.muted), menu), () => cb.toggleMute());
    const motion = interactive(el('button', 'ly-tabbtn', motionLabel(view.settings.reducedMotion), menu), () => cb.toggleReducedMotion());
    const legendBtn = interactive(el('button', 'ly-tabbtn', COPY.legend, menu), () => {
      if (legendBox) {
        legendBox.remove();
        legendBox = null;
        legend = null;
        legendBtn.setAttribute('aria-expanded', 'false');
        return;
      }
      legend = new TellLegend();
      legendBox = el('div', 'ly-legend', undefined, menu);
      legendBox.dataset.test = 'legend';
      const labels = [COPY.legendSafe, COPY.legendSoggy, COPY.legendCurl];
      legend.canvases.forEach((c, i) => {
        const cell = el('div', '', undefined, legendBox!);
        cell.appendChild(c);
        el('div', '', labels[i], cell);
      });
      legendBtn.setAttribute('aria-expanded', 'true');
    });
    legendBtn.setAttribute('aria-expanded', 'false');
    pauseLabels = { sound, motion };
    resume.focus({ preventScroll: true });
  }

  function clearPause(): void {
    if (pauseCard?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    pauseCard?.remove();
    pauseCard = null;
    pauseLabels = null;
    legend = null;
    legendBox = null;
  }

  return {
    update(sim: SimState, view: ViewState, _ev: readonly SimEvent[]) {
      const now = presentation.nowMs;
      const tellS = now / 1000;

      // A new run: the paper wipe sweeps up (§7.7) whenever the previous run had a result.
      if (sim !== lastSim) {
        if (lastSim?.result) runWipe();
        lastSim = sim;
        resultSeen = -1;
        clearCard();
        timerMode = 'stale'; // force the class sync on the first frame of a run
      }
      if (view.phase === 'wipe' && !wipe.classList.contains('ly-run') && card) runWipe();

      const rm = view.settings.reducedMotion;
      if (rm !== rmShown) {
        root.classList.toggle('ly-rm', rm);
        rmShown = rm;
      }

      // Title (§7.1).
      const onTitle = view.phase === 'title' && sim.timerStartTick === null;
      if (onTitle !== shown.title) toggle(title, (shown.title = onTitle));
      const tb = view.prevBestMs !== null ? bestLabel(view.prevBestMs, true) : '';
      if (tb !== titleBestText) titleBest.textContent = titleBestText = tb;

      // HUD (§7.2).
      const hudOn = !onTitle;
      if (hudOn !== shown.hud) toggle(hud, (shown.hud = hudOn));
      if (hudOn !== shown.reed) toggle(reed, (shown.reed = hudOn));
      const tt = formatTime(timerMs(sim));
      if (tt !== timerText) timer.textContent = timerText = tt;
      const r = sim.result;
      if (r && resultSeen < 0) resultSeen = now;
      const age = r ? now - resultSeen : 0;
      const mode = !r ? '' : r.kind === 'won' ? (age >= 120 ? 'won' : '') : 'fail';
      if (mode !== timerMode) {
        timer.classList.toggle('ly-fail', mode === 'fail');
        timer.classList.toggle('ly-won', mode === 'won');
        timerMode = mode;
      }
      // On a win the card owns the best line; the HUD's would be stale (F-017).
      const bt = view.prevBestMs !== null && r?.kind !== 'won' ? bestLabel(view.prevBestMs) : '';
      if (bt !== bestText) best.textContent = bestText = bt;
      const pct = Math.round((Math.min(sim.tuning.layers, sim.frog.layer) / sim.tuning.layers) * 1000) / 10;
      if (pct !== reedPct) {
        me.style.bottom = `${pct}%`;
        reedPct = pct;
      }
      const pauseOn = !r && view.phase !== 'paused';
      if (pauseOn !== shown.pauseBtn) {
        pauseBtn.style.visibility = pauseOn ? '' : 'hidden';
        shown.pauseBtn = pauseOn;
      }
      if (view.settings.muted !== mutedShown) {
        mutedShown = view.settings.muted;
        muteBtn.innerHTML = mutedShown ? ICON.muted : ICON.sound;
        muteBtn.setAttribute('aria-label', mutedShown ? 'Unmute' : 'Mute');
        muteBtn.setAttribute('aria-pressed', String(mutedShown));
      }

      // Result cards (§7.3–7.5).
      if (r && !card && age >= cardDelayMs(r.kind)) buildCard(sim, view);
      if (card && cardInner && !cardInner.classList.contains('ly-in') && presentation.frames > cardBorn) cardInner.classList.add('ly-in');
      if (diagram) diagram.paint(tellS);
      if (card && r?.kind === 'won' && !stamp && showStamp(view) && age >= 700) {
        stamp = el('div', 'ly-stamp', undefined, card);
        stamp.dataset.test = 'stamp';
        el('b', '', COPY.newBest, stamp);
      }

      // Pause (§7.6).
      const paused = view.phase === 'paused';
      if (paused && !pauseCard) buildPause(view);
      else if (!paused && pauseCard) clearPause();
      if (pauseLabels) {
        const s = soundLabel(view.settings.muted), m = motionLabel(view.settings.reducedMotion);
        if (pauseLabels.sound.textContent !== s) pauseLabels.sound.textContent = s;
        if (pauseLabels.motion.textContent !== m) pauseLabels.motion.textContent = m;
      }
      if (legend) legend.paint(tellS);

      // Fails dim the pond; a win keeps its warmest frame unveiled (F-012).
      const vm = paused ? 'pause' : card && r?.kind !== 'won' ? 'dim' : '';
      if (vm !== veilMode) {
        veil.classList.toggle('ly-on', vm !== '');
        veil.classList.toggle('ly-pause', vm === 'pause');
        veilMode = vm;
      }
    },
    dispose() {
      root.replaceChildren();
      root.classList.remove('ly-rm');
      style.remove();
    },
  };
}
