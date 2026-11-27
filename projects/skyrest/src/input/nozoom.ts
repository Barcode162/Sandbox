// src/input/nozoom.ts — the page never zooms. iOS Safari ignores `user-scalable=no` and can still zoom on a quick
// double tap or a pinch, so this cancels those gestures in code too. A second tap on a button still presses it.
const DOUBLE_TAP_MS = 350;

export function blockZoom(doc: Document = document): void {
  let lastEnd = 0;
  doc.addEventListener(
    'touchend',
    (e) => {
      const now = performance.now();
      if (now - lastEnd < DOUBLE_TAP_MS && e.cancelable) {
        e.preventDefault(); // stops the double-tap zoom…
        const t = e.target;
        if (t instanceof Element) {
          const btn = t.closest<HTMLElement>('button, [role="button"], a');
          btn?.click(); // …but the tap still counts on a button (e.g. "Tap again to restart").
        }
      }
      lastEnd = now;
    },
    { passive: false },
  );
  // Pinch (Safari's gesture events) and two-finger touchmove.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    doc.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  }
  doc.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1 && e.cancelable) e.preventDefault();
    },
    { passive: false },
  );
  doc.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
}
