/**
 * Copy and number formatting (§7 lines, §9 voice: warm, a little cheeky, ≤ 7 words a line). Pure.
 */
import type { RunResult, ViewState } from '../contracts';

/** "12.34" below a minute, "1:02.10" from 60 s (§7.2). Floors to the centisecond: never shows time not yet run. */
export function formatTime(ms: number): string {
  const cs = Math.max(0, Math.floor(ms / 10 + 1e-6));
  const s = Math.floor(cs / 100);
  const c = String(cs % 100).padStart(2, '0');
  if (s < 60) return `${s}.${c}`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}.${c}`;
}

export const COPY = {
  wordmark: 'Lilyfield',
  titleHint: 'Tap or ↑ to hop',
  again: 'Tap or ↑ to hop again',
  paused: 'Paused',
  resume: 'Back to the pond',
  restart: 'Restart',
  legend: 'Tell legend',
  legendSafe: 'Safe: shadow and notch',
  legendSoggy: 'Soggy: no shadow, bubbles',
  legendCurl: 'Curl: folded edge, rocks',
  newBest: 'NEW BEST',
} as const;

export const bestLabel = (ms: number, capital = false): string => `${capital ? 'Best' : 'best'} ${formatTime(ms)}`;
export const soundLabel = (muted: boolean): string => `Sound: ${muted ? 'off' : 'on'}`;
export const motionLabel = (reduced: boolean): string => `Reduced motion: ${reduced ? 'on' : 'off'}`;

export interface CardCopy {
  kind: RunResult['kind'];
  title: string;
  /** Large time next to the title on a win ("Made it! 24.18"). */
  titleTime: string | null;
  /** "17 of 36 pads · 14.82" on fails; the best line on wins. */
  line: string;
  /** Best-line parts for the crossed-out old best on a new best: [old, new]. */
  bestFromTo: [string, string] | null;
  hint: string | null;
  /** Tell-diagram callouts (sunk only): [low edge, top-right, top-left]. */
  callouts: readonly string[] | null;
  footer: string;
}

/** Polish 16 (hint names the real cause) and polish 20 ("First time", never NEW BEST, on a first run). */
export function cardCopy(r: RunResult, v: Pick<ViewState, 'prevBestMs' | 'newBest' | 'firstRun'>, layers: number): CardCopy {
  const time = formatTime(r.timeMs);
  const progress = `${Math.min(r.layer, layers)} of ${layers} pads · ${time}`;
  if (r.kind === 'eaten') {
    return {
      kind: r.kind,
      title: 'Chomped!',
      titleTime: null,
      line: progress,
      bestFromTo: null,
      hint: r.cause === 'flank' ? 'Watch for eyes beside a pad.' : 'Keep hopping. It hates fast frogs.',
      callouts: null,
      footer: COPY.again,
    };
  }
  if (r.kind === 'sunk') {
    const curl = r.cause === 'curl';
    return {
      kind: r.kind,
      title: curl ? 'Curled pad!' : 'Soggy pad!',
      titleTime: null,
      line: progress,
      bestFromTo: null,
      hint: curl ? 'Curled edge. Rocks. Sneaky.' : 'No shadow. Bubbles. Sneaky.',
      callouts: curl ? ['curled edge', 'rocks'] : ['no shadow', 'bubbles', 'no notch'],
      footer: COPY.again,
    };
  }
  let line: string;
  let bestFromTo: [string, string] | null = null;
  if (v.firstRun || v.prevBestMs === null) line = `First time: ${time}`;
  else if (v.newBest) {
    bestFromTo = [formatTime(v.prevBestMs), time];
    line = `best ${bestFromTo[0]} → ${bestFromTo[1]}`;
  } else if (r.timeMs - v.prevBestMs <= 1000) line = 'So close to your best.';
  else line = bestLabel(v.prevBestMs);
  return { kind: r.kind, title: 'Made it!', titleTime: time, line, bestFromTo, hint: null, callouts: null, footer: COPY.again };
}

/** Whether to show the NEW BEST stamp (never on a first run, polish 20). */
export function showStamp(v: Pick<ViewState, 'newBest' | 'firstRun' | 'prevBestMs'>): boolean {
  return v.newBest && !v.firstRun && v.prevBestMs !== null;
}

/** Card entrance delay after the result tick, ms of presentation time (§7.3 250 ms; sunk waits for the flip). */
export function cardDelayMs(kind: RunResult['kind']): number {
  return kind === 'eaten' ? 250 : kind === 'sunk' ? 380 : 300;
}

/** Zigzag torn edge for CSS clip-path (procedural, 3 px amplitude, §5.3). `edge` = which side is torn. */
export function tornClip(edge: 'top' | 'bottom', teeth: number, amp: number, seed: number): string {
  const pts: string[] = [];
  let x = 0;
  const step = 100 / teeth;
  const jitter = (i: number) => ((Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453) % 1 + 1) % 1;
  const ys: string[] = [];
  for (let i = 0; i <= teeth; i++) {
    x = Math.min(100, i * step + (i > 0 && i < teeth ? (jitter(i) - 0.5) * step * 0.6 : 0));
    const y = (i % 2 ? amp : 0) + jitter(i + 31) * amp * 0.5;
    ys.push(`${x.toFixed(2)}% ${y.toFixed(1)}px`);
  }
  if (edge === 'top') {
    pts.push(...ys, '100% 100%', '0% 100%');
  } else {
    pts.push('0% 0%', '100% 0%', ...ys.reverse().map((p) => p.replace(/ ([\d.]+)px$/, (_, n) => ` calc(100% - ${n}px)`)));
  }
  return `polygon(${pts.join(', ')})`;
}
