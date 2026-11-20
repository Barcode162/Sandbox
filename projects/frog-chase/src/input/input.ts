/**
 * Keyboard / touch / gamepad → Intent (§4.5). OWNER: WO-004.
 * `pick` maps a client point to a pad id (Renderer.pickPad). STUB (WO-001): arrow keys + Space + Esc only.
 */
import type { InputSource, Intent } from '../contracts';

export function createInput(
  target: Window,
  _pick: (clientX: number, clientY: number) => number | null,
  onIntent: (i: Intent) => void,
): InputSource {
  const onKey = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const map: Record<string, Intent | undefined> = {
      ArrowLeft: { type: 'hop', slot: 'L' },
      ArrowUp: { type: 'hop', slot: 'F' },
      ' ': { type: 'hop', slot: 'F' },
      ArrowRight: { type: 'hop', slot: 'R' },
      Escape: { type: 'pause' },
    };
    const i = map[e.key];
    if (i) {
      e.preventDefault();
      onIntent(i);
    }
  };
  target.addEventListener('keydown', onKey);
  return {
    poll() {},
    dispose() {
      target.removeEventListener('keydown', onKey);
    },
  };
}
