/**
 * The overlay's stylesheet (§5.3 type/spacing/cards, §5.5 motion, §7.6 pause, §10 targets). Injected once.
 * Sizes are mobile-first; ≥ 700 px wide gets the desktop scale.
 */
import { CSS_EASE } from '../render/ease';
import { PALETTE as C } from '../render/palette';
import { tornClip } from './format';

export function uiCss(): string {
  const tornTop = tornClip('top', 28, 3, 1);
  const tornBottom = tornClip('bottom', 34, 5, 2);
  const tabTorn = tornClip('bottom', 10, 3, 3);
  return `
#ui { font-family: ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif; font-weight: 800; color: ${C.ink};
  font-variant-numeric: tabular-nums; -webkit-font-smoothing: antialiased; user-select: none; -webkit-user-select: none;
  --inset: 16px; --t-timer: 32px; --t-best: 14px; --t-title: 40px; --t-body: 18px; overflow: hidden; }
@media (min-width: 700px) { #ui { --inset: 24px; --t-timer: 44px; --t-best: 16px; --t-title: 64px; --t-body: 22px; } }
#ui * { box-sizing: border-box; }
#ui .ly-hide { opacity: 0; visibility: hidden; }

/* HUD: timer tab, best, progress reed, buttons */
#ui .ly-hud { position: absolute; top: calc(var(--inset) + env(safe-area-inset-top)); left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 4px; transition: opacity 180ms ${CSS_EASE.ui}, transform 180ms ${CSS_EASE.ui}; }
#ui .ly-hud.ly-hide { transform: translate(-50%, -8px); }
#ui .ly-tabwrap { filter: drop-shadow(3px 4px 0 rgba(29,43,58,.38)); }
#ui .ly-tab { background: ${C.paper}; padding: 2px 14px 7px; clip-path: ${tabTorn}; min-width: 5.2ch; text-align: center; }
#ui .ly-timer { display: inline-block; font-size: var(--t-timer); line-height: 1.1; letter-spacing: .01em; transform-origin: 50% 60%; }
#ui .ly-timer.ly-fail { color: ${C.jaw}; text-decoration: line-through; text-decoration-thickness: 3px; text-decoration-color: ${C.ink}; }
#ui .ly-timer.ly-won { animation: ly-pop 260ms ${CSS_EASE.pop} forwards; }
@keyframes ly-pop { 0% { transform: scale(1); } 55% { transform: scale(1.25); } 100% { transform: scale(1.15); } }
#ui .ly-best { font-size: var(--t-best); color: ${C.paper}; text-shadow: 1px 1.5px 0 rgba(29,43,58,.55); }

#ui .ly-reed { position: absolute; right: calc(12px + env(safe-area-inset-right)); top: 15%; height: 70%; width: 4px;
  background: ${C.reed}; border-radius: 2px; box-shadow: 2px 2px 0 rgba(29,43,58,.38); transition: opacity 180ms ${CSS_EASE.ui}; }
#ui .ly-reed i { position: absolute; left: 50%; border-radius: 50%; transform: translate(-50%, 50%); box-shadow: 1.5px 2px 0 rgba(29,43,58,.38); }
#ui .ly-reed .ly-goal { bottom: 100%; width: 12px; height: 12px; background: ${C.bloom}; }
#ui .ly-reed .ly-me { bottom: 0; width: 14px; height: 14px; background: ${C.frog}; transition: bottom 220ms ${CSS_EASE.ui}; }

#ui .ly-btns { position: absolute; top: calc(var(--inset) + env(safe-area-inset-top)); right: calc(var(--inset) + env(safe-area-inset-right));
  display: flex; gap: 8px; }
#ui button { font: inherit; color: inherit; border: 0; margin: 0; cursor: pointer; pointer-events: auto; -webkit-tap-highlight-color: transparent; }
#ui button:focus { outline: none; }
#ui button:focus-visible { outline: 3px solid ${C.ink}; outline-offset: 3px; }
#ui .ly-round { width: 44px; height: 44px; border-radius: 50%; background: ${C.paper}; display: grid; place-items: center;
  box-shadow: 2px 3px 0 rgba(29,43,58,.38); transition: transform 90ms ${CSS_EASE.ui}, box-shadow 90ms ${CSS_EASE.ui}, opacity 180ms; }
#ui .ly-round:active, #ui .ly-round.ly-down { transform: translateY(2px); box-shadow: 1px 1px 0 rgba(29,43,58,.38); }
#ui .ly-round svg { width: 22px; height: 22px; display: block; }

/* Title: a sheet of vellum over the far pond, the wordmark on it */
#ui .ly-title { position: absolute; inset: 0 0 auto 0; height: 27%; min-height: 190px; display: flex; flex-direction: column; align-items: center;
  transition: opacity 200ms ${CSS_EASE.ui}, transform 200ms ${CSS_EASE.ui}; }
#ui .ly-title.ly-hide { transform: translateY(-12px); }
#ui .ly-vellum { position: absolute; top: 0; bottom: 0; left: 50%; width: min(100%, 860px); transform: translateX(-50%); background: rgba(243,235,216,.62); clip-path: ${tornBottom}; }
#ui .ly-word { position: relative; margin-top: calc(14vh - var(--t-title) * .62); font-size: var(--t-title); line-height: 1.1;
  transform: rotate(-2deg); text-shadow: 3px 3px 0 ${C.paper}; letter-spacing: .01em; }
#ui .ly-hint { position: relative; margin-top: 8px; font-size: var(--t-body); }
#ui .ly-tbest { position: relative; margin-top: 4px; font-size: var(--t-best); opacity: .8; }

/* Veil and cards */
#ui .ly-veil { position: absolute; inset: 0; background: rgba(29,43,58,.30); opacity: 0; transition: opacity 180ms ${CSS_EASE.ui}; }
#ui .ly-veil.ly-on { opacity: 1; }
#ui .ly-veil.ly-pause { -webkit-backdrop-filter: saturate(40%); backdrop-filter: saturate(40%); }
#ui .ly-cardwrap { position: absolute; left: 50%; top: 44%; width: min(380px, calc(100vw - 2 * var(--inset) - 40px));
  transform: translate(-50%, -50%); filter: drop-shadow(6px 6px 0 rgba(29,43,58,.38)); }
#ui .ly-cardwrap.ly-bottom { top: auto; bottom: calc(7% + env(safe-area-inset-bottom)); transform: translate(-50%, 0); }
@media (min-width: 700px) { #ui .ly-cardwrap { width: 460px; } }
#ui .ly-card { background: ${C.paper}; clip-path: ${tornTop}; padding: 22px 20px 18px; transform: rotate(1.5deg); text-align: center;
  opacity: 0; translate: 0 24px; transition: opacity 180ms ${CSS_EASE.ui}, translate 180ms ${CSS_EASE.ui}; }
#ui .ly-card.ly-in { opacity: 1; translate: 0 0; }
#ui .ly-card h2 { margin: 0; font-size: var(--t-title); line-height: 1.05; font-weight: 800; }
#ui .ly-card h2 .ly-ttime { margin-left: .3em; }
#ui .ly-cardwrap.ly-bottom h2 { font-size: calc(var(--t-title) * .8); white-space: nowrap; }
#ui .ly-card p { margin: 8px 0 0; font-size: var(--t-body); line-height: 1.25; }
#ui .ly-card .ly-sub { font-size: calc(var(--t-body) * .82); opacity: .78; }
#ui .ly-card .ly-foot { margin-top: 14px; font-size: calc(var(--t-body) * .82); opacity: .72; }
#ui .ly-card s { text-decoration-thickness: 2px; opacity: .65; }
#ui .ly-card canvas { display: block; margin: 12px auto 0; width: 100%; height: auto; }

/* NEW BEST stamp: ink on bloom, −8°, pops 2.2 → 1 */
#ui .ly-stamp { position: absolute; left: 50%; top: -18px; transform: translate(-50%, -100%) rotate(-8deg); }
#ui .ly-stamp b { display: inline-block; background: ${C.bloom}; color: ${C.ink}; font-size: calc(var(--t-title) * .55); padding: 4px 14px;
  border: 3px solid ${C.ink}; letter-spacing: .04em; white-space: nowrap; box-shadow: 3px 4px 0 rgba(29,43,58,.38); animation: ly-stamp 220ms ${CSS_EASE.pop} both; }
@keyframes ly-stamp { from { transform: scale(2.2); opacity: 0; } 40% { opacity: 1; } to { transform: scale(1); opacity: 1; } }

/* Pause menu */
#ui .ly-menu { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
#ui .ly-tabbtn { min-height: 48px; padding: 8px 16px; background: ${C.paper}; border-radius: 4px; font-size: calc(var(--t-body) * .9);
  box-shadow: 0 0 0 2px ${C.ink} inset, 3px 3px 0 rgba(29,43,58,.38); transition: transform 90ms ${CSS_EASE.ui}, box-shadow 90ms ${CSS_EASE.ui}; }
#ui .ly-tabbtn:active { transform: translateY(2px); box-shadow: 0 0 0 2px ${C.ink} inset, 1px 1px 0 rgba(29,43,58,.38); }
#ui .ly-tabbtn.ly-primary { background: ${C.ink}; color: ${C.paper}; }
#ui .ly-legend { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 4px; font-size: calc(var(--t-best) * .95); line-height: 1.2; }
#ui .ly-legend canvas { margin: 0 auto 4px; }

/* Restart wipe: a torn paper edge sweeping up */
#ui .ly-wipe { position: absolute; left: 0; right: 0; top: 0; height: 130%; background: ${C.paper}; clip-path: ${tornTop}; transform: translateY(110%); }
#ui .ly-wipe.ly-run { animation: ly-wipe 150ms ${CSS_EASE.ui} forwards; }
@keyframes ly-wipe { from { transform: translateY(100%); } to { transform: translateY(-110%); } }

#ui.ly-rm .ly-card { transition-property: opacity; translate: 0 0; }
#ui.ly-rm .ly-stamp b { animation: none; }
#ui.ly-rm .ly-wipe.ly-run { animation: ly-fade 150ms linear forwards; }
@keyframes ly-fade { 0% { transform: none; opacity: 0; } 50% { transform: none; opacity: 1; } 100% { transform: none; opacity: 0; } }
`;
}
