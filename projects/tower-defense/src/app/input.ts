// §13 controls as a pure map (key + context → action) and the §9 Go-button truth table (§16.14).
// The game executes actions; keeping the map pure makes every binding unit-testable without a DOM.
import type { Phase, SceneId, Speed, TowerKind, UpgradePath } from '../contracts/types';

export type Action =
  | { type: 'none' }
  | { type: 'select'; kind: TowerKind }
  | { type: 'cancel' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'go' }
  | { type: 'upgrade'; path: UpgradePath }
  | { type: 'cycleTarget' }
  | { type: 'sell' }
  | { type: 'autoStart' }
  | { type: 'mute' }
  | { type: 'restart' }
  | { type: 'play' }
  | { type: 'openSettings' }
  | { type: 'back' }
  | { type: 'retry' };

export interface KeyContext {
  scene: SceneId;
  placing: boolean;
  selected: boolean;
}

const HOTKEY: Record<string, TowerKind> = { '1': 'tern', '2': 'frog', '3': 'koi', '4': 'owl' };

/** `key` is KeyboardEvent.key. */
export function keyAction(key: string, k: KeyContext): Action {
  const low = key.length === 1 ? key.toLowerCase() : key;
  if (low === 'm') return { type: 'mute' };
  switch (k.scene) {
    case 'title':
      if (low === 'Enter') return { type: 'play' };
      if (low === 's') return { type: 'openSettings' };
      return { type: 'none' };
    case 'settings':
      return low === 'Escape' || low === 'Backspace' ? { type: 'back' } : { type: 'none' };
    case 'paused':
      if (low === 'Escape' || low === 'p') return { type: 'resume' };
      if (low === 'r') return { type: 'restart' };
      return { type: 'none' };
    case 'gameover':
    case 'victory':
      return low === 'Enter' || low === 'r' ? { type: 'retry' } : { type: 'none' };
    case 'play': {
      if (HOTKEY[low]) return { type: 'select', kind: HOTKEY[low] };
      if (low === 'Escape') return k.placing ? { type: 'cancel' } : { type: 'pause' };
      if (low === 'p') return { type: 'pause' };
      if (low === ' ') return { type: 'go' };
      if (low === 'a') return { type: 'autoStart' };
      if (k.selected) {
        if (low === 'z') return { type: 'upgrade', path: 0 };
        if (low === 'x') return { type: 'upgrade', path: 1 };
        if (low === 't') return { type: 'cycleTarget' };
        if (low === 'Backspace' || low === 'Delete') return { type: 'sell' };
      }
      return { type: 'none' };
    }
    default:
      return { type: 'none' };
  }
}

export interface GoView {
  /** Canonical label (§9): "▶ Start" | "▶ 1×" | "▶▶ 2×". */
  label: '▶ Start' | '▶ 1×' | '▶▶ 2×';
  icon: 'play' | 'fast';
  text: 'Start' | '1×' | '2×';
  /** What a click (or Space) does. */
  action: 'start' | 'speed' | 'none';
  dim: boolean;
  pulse: boolean;
}

/**
 * §9 / §10.2 / §16.14: the label always tells the truth about the run.
 * Intermission → Start (dim before any tower exists; pulsing once one does and the player has idled > 4 s,
 * or before the very first round). Round → current speed. Run over → inert.
 */
export function goView(phase: Phase, speed: Speed, towers: number, idleMs: number, roundsStarted: number): GoView {
  if (phase === 'round') {
    return speed === 2
      ? { label: '▶▶ 2×', icon: 'fast', text: '2×', action: 'speed', dim: false, pulse: false }
      : { label: '▶ 1×', icon: 'play', text: '1×', action: 'speed', dim: false, pulse: false };
  }
  if (phase === 'intermission') {
    const dim = towers === 0;
    return { label: '▶ Start', icon: 'play', text: 'Start', action: 'start', dim, pulse: !dim && (idleMs > 4000 || roundsStarted === 0) };
  }
  return { label: '▶ Start', icon: 'play', text: 'Start', action: 'none', dim: true, pulse: false };
}

/** Next targeting mode for T (§7: First → Last → Strong → Close). */
export const TARGET_ORDER = ['first', 'last', 'strong', 'close'] as const;
export function nextTarget(mode: (typeof TARGET_ORDER)[number], dir: 1 | -1 = 1): (typeof TARGET_ORDER)[number] {
  const i = TARGET_ORDER.indexOf(mode);
  return TARGET_ORDER[(i + dir + TARGET_ORDER.length) % TARGET_ORDER.length];
}
