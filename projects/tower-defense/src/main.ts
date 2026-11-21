// Entry: letterboxed 1280×720 logical canvas (§15 resize → --paper-deep bars from index.html), backing store
// at CSS size × devicePixelRatio (the game draws in logical units via canvas.width / 1280), rAF loop, test hook.
import { createGame } from './app/game';
import { installTestHook } from './app/testhook';
import { LOGICAL_H, LOGICAL_W } from './data/map';

const errors: string[] = [];
window.addEventListener('error', (e) => errors.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason)));
const origError = console.error.bind(console);
console.error = (...args: unknown[]) => { errors.push(args.map(String).join(' ')); origError(...args); };

const canvas = document.getElementById('game') as HTMLCanvasElement;

function fit(): void {
  const s = Math.min(window.innerWidth / LOGICAL_W, window.innerHeight / LOGICAL_H);
  const w = Math.max(1, Math.floor(LOGICAL_W * s));
  const h = Math.max(1, Math.floor(LOGICAL_H * s));
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  // never below the logical size, so 900×600 windows still render at full logical resolution
  const bw = Math.max(LOGICAL_W, Math.round(w * dpr));
  if (canvas.width !== bw) {
    canvas.width = bw;
    canvas.height = Math.round((bw * LOGICAL_H) / LOGICAL_W);
  }
}
window.addEventListener('resize', () => { fit(); game.debug.render(); });
fit();

const game = createGame(canvas);
let manual = false;
let last = performance.now();
function raf(t: number): void {
  if (manual) return;
  game.frame(Math.min(250, t - last));
  last = t;
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
canvas.focus();

if (new URLSearchParams(location.search).has('test')) installTestHook(game, errors, () => { manual = true; });
