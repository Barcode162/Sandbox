/**
 * The presentation clock shared by the renderer and the UI (both WO-003). Advanced by Renderer.frame
 * with the frame's dtMs, so cards, pops and the canvas stay in step under the manual test clock
 * (`__lily.frame`) exactly as they do under rAF. Never read by the sim.
 */
export const presentation = {
  /** Accumulated frame time, ms (clamped per frame to 100 ms so a stalled tab never skips a card). */
  nowMs: 0,
  frames: 0,
};

export function advancePresentation(dtMs: number): number {
  const d = Math.min(100, Math.max(0, dtMs));
  presentation.nowMs += d;
  presentation.frames++;
  return d;
}
