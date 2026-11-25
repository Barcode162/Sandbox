// src/ui/index.ts — owned by WO-004. DOM HUD + menus: coin counter (top right) + gear, boss name + bar with
// lagging white chunk, hero hearts, title, pause/settings (sound, music, quality, reduce shake), victory/defeat
// with retry, coin fly-to-counter. Scaffold: title card + coin counter + pause button.
import type { CreateUi, FrameInfo, GameControl, Phase, RenderContext } from '../contracts.ts';

export const createUi: CreateUi = () => {
  let root!: HTMLElement;
  let coinsEl!: HTMLElement;
  let titleEl!: HTMLElement;
  let lastCoins = -1;
  let lastPhase: Phase | null = null;
  return {
    init(r: HTMLElement, _ctx: RenderContext, control: GameControl) {
      root = r;
      root.insertAdjacentHTML(
        'beforeend',
        `<div class="hud" data-testid="hud">
           <div class="coins" data-testid="coins"><span class="coin-icon" aria-hidden="true"></span><span class="coin-value">0</span></div>
           <button class="gear" type="button" aria-label="Pause and settings" data-testid="pause">⚙</button>
         </div>
         <div class="title-card" data-testid="title">
           <h1>Skyrest</h1>
           <button type="button" class="start" data-testid="start">Start</button>
         </div>`,
      );
      coinsEl = root.querySelector('.coin-value')!;
      titleEl = root.querySelector('.title-card')!;
      root.querySelector('.start')!.addEventListener('click', () => {
        void control.audio.unlock();
        control.start();
      });
      root.querySelector('.gear')!.addEventListener('click', () => control.setPaused(!control.paused));
    },
    update(f: FrameInfo) {
      const s = f.state;
      if (s.coins !== lastCoins) {
        lastCoins = s.coins;
        coinsEl.textContent = s.coins.toLocaleString('en-US');
      }
      if (s.phase !== lastPhase) {
        lastPhase = s.phase;
        titleEl.hidden = s.phase !== 'title';
        root.dataset.phase = s.phase;
      }
    },
    dispose() {},
  };
};
