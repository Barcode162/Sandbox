/**
 * Page wiring for the shell (shell.ts holds the logic). OWNER: WO-004.
 * Creates renderer, UI, audio and input; drives frames from requestAnimationFrame; pauses on
 * visibilitychange and blur (§7.6); follows the OS reduced-motion preference until the player sets it.
 */
import type { LilyHook } from '../contracts';
import { createAudio } from '../audio/audio';
import { createInput } from '../input/input';
import { createRenderer } from '../render/renderer';
import { createUi } from '../ui/ui';
import { createShell } from './shell';

export interface App {
  hook: LilyHook;
}

/** Longest real frame fed to the loop; a stall (tab switch, GC) never becomes a sim jump. */
const MAX_FRAME_MS = 250;

export function seedFromQuery(search: string): number | null {
  const v = new URLSearchParams(search).get('seed');
  if (v === null || !/^-?\d+$/.test(v)) return null;
  return Number(v) | 0;
}

export function createApp(canvas: HTMLCanvasElement, uiRoot: HTMLElement): App {
  const renderer = createRenderer(canvas);
  const audio = createAudio();
  const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const shell = createShell({
    renderer,
    makeUi: (cb) => createUi(uiRoot, cb),
    audio,
    storage: safeStorage(),
    prefersReducedMotion: !!motion?.matches,
    fixedSeed: seedFromQuery(location.search),
    sessionSalt: crypto.getRandomValues(new Uint32Array(1))[0]! | 0,
    wallNow: () => performance.now(),
  });
  motion?.addEventListener('change', (e) => shell.osReducedMotion(e.matches));

  const input = createInput(window, {
    pick: (x, y) => shell.pick(x, y),
    onIntent: (i) => shell.intent(i),
    onGesture: () => audio.unlock(),
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') shell.lostFocus();
  });
  window.addEventListener('blur', () => shell.lostFocus());

  const resize = () => renderer.resize(window.innerWidth, window.innerHeight, Math.min(2, window.devicePixelRatio || 1));
  window.addEventListener('resize', resize);
  resize();

  let last = performance.now();
  const raf = (t: number) => {
    const dt = Math.min(MAX_FRAME_MS, Math.max(0, t - last));
    last = t;
    input.poll();
    shell.frame(dt);
    requestAnimationFrame(raf);
  };
  // One frame now so the pond is on screen before the first rAF (first playable ≤ 1.5 s).
  shell.frame(0);
  requestAnimationFrame(raf);

  return { hook: shell.hook };
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
