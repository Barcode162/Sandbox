/**
 * DOM overlay (§5.3, §7 HUD, title text, result cards, pause menu, tell diagram). OWNER: WO-003.
 * STUB (WO-001): a plain timer readout. Replace entirely.
 */
import type { SimEvent, SimState, Ui, UiCallbacks, ViewState } from '../contracts';
import { timerMs } from '../sim/sim';

export function createUi(root: HTMLElement, _cb: UiCallbacks): Ui {
  const timer = document.createElement('div');
  timer.setAttribute('data-test', 'timer');
  timer.style.cssText = 'position:absolute;top:16px;left:50%;transform:translateX(-50%);font:800 32px system-ui;font-variant-numeric:tabular-nums;color:#1D2B3A';
  root.appendChild(timer);
  return {
    update(sim: SimState, _view: ViewState, _ev: readonly SimEvent[]) {
      const t = (timerMs(sim) / 1000).toFixed(2);
      if (timer.textContent !== t) timer.textContent = t;
    },
    dispose() {
      root.replaceChildren();
    },
  };
}
