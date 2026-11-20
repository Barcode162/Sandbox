// Entry: letterboxed 1280×720 logical canvas (§15 resize → --paper-deep bars), rAF loop, test hook.
import { createGame } from './app/game';
import { installTestHook } from './app/testhook';
import { LOGICAL_H, LOGICAL_W } from './data/map';

const errors: string[] = [];
window.addEventListener('error', (e) => errors.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason)));

const canvas = document.getElementById('game') as HTMLCanvasElement;

function fit(): void {
  const s = Math.min(window.innerWidth / LOGICAL_W, window.innerHeight / LOGICAL_H);
  canvas.style.width = `${Math.floor(LOGICAL_W * s)}px`;
  canvas.style.height = `${Math.floor(LOGICAL_H * s)}px`;
}
window.addEventListener('resize', fit);
fit();

const game = createGame(canvas);
let manual = false;
let last = performance.now();
function raf(t: number): void {
  if (manual) return;
  game.frame(t - last);
  last = t;
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

if (new URLSearchParams(location.search).has('test')) installTestHook(game, errors, () => { manual = true; });
