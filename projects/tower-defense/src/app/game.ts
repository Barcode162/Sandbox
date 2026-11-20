// App shell: scenes, sim ownership, loop, layer composition, input — STUB (WO-004 implements).
// FROZEN: createGame(canvas) → Game; the test hook (app/testhook.ts) drives the game only through Game.
import type { Command, SceneId, Sim, Speed } from '../contracts/types';
import { P, FONT_DISPLAY } from '../data/palette';
import { LOGICAL_H, LOGICAL_W, PATH_POINTS, PATH_RIBBON_WIDTH } from '../data/map';
import { createSim } from '../sim';
import { createFixedLoop } from './loop';
import { createSettingsStore } from './settings';
import { createAudio } from '../audio';

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
}

export function createGame(canvas: HTMLCanvasElement): Game {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  const settings = createSettingsStore();
  const audio = createAudio();
  audio.applySettings(settings.get());
  const loop = createFixedLoop();
  let sim = createSim({ seed: 1 });
  let scene: SceneId = 'title';
  let beforeStep: ((s: Sim) => void) | null = null;
  let now = 0;

  function draw(): void {
    const c = ctx!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = P.paper;
    c.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = P.kraftEdge;
    c.lineWidth = PATH_RIBBON_WIDTH + 4;
    tracePath(c);
    c.strokeStyle = P.kraft;
    c.lineWidth = PATH_RIBBON_WIDTH;
    tracePath(c);
    c.fillStyle = P.ink;
    c.font = `italic 400 88px ${FONT_DISPLAY}`;
    c.fillText('Inkfold', 64, 250);
  }

  return {
    get sim() { return sim; },
    scene: () => scene,
    speed: () => 1,
    command: (cmd) => sim.enqueue(cmd),
    frame(dtMs) {
      now += dtMs;
      const n = loop.frame(dtMs, 1, scene !== 'play');
      for (let i = 0; i < n; i++) { beforeStep?.(sim); sim.step(); for (const e of sim.events) audio.onSimEvent(e); }
      audio.update(now);
      draw();
    },
    restart() { sim = createSim({ seed: 1 }); loop.reset(); scene = 'play'; },
    setBeforeStep(fn) { beforeStep = fn; },
  };
}

function tracePath(c: CanvasRenderingContext2D): void {
  c.beginPath();
  PATH_POINTS.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.stroke();
}
