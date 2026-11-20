// core/env.js: the only place that touches the browser environment for measurements and
// preferences (C2). The engine calls measureViewport on boot and on resize only (C6).
// Owner chain: WO-001 → WO-014 → WO-025 → WO-024.

/**
 * Raw viewport measurements. `sh` is the px height of the 100svh probe (never dvh, §3.2).
 * @param {Window} win
 * @param {HTMLElement} probe  the #svh-probe element
 * @returns {{ vw: number; sh: number; dpr: number }}
 */
export function measureViewport(win, probe) {
  const vw = win.document.documentElement.clientWidth;
  const sh = probe.getBoundingClientRect().height;
  const dpr = win.devicePixelRatio || 1;
  return { vw, sh, dpr };
}

/**
 * @param {Window} win
 * @returns {boolean}
 */
export function prefersReduced(win) {
  try {
    return win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * The OS colour scheme (D9: only --wall and --wall-deep change; CSS handles it). Exposed for chrome
 * and evidence code that needs to know which wall is showing.
 * @param {Window} win
 * @returns {'light' | 'dark'}
 */
export function colorScheme(win) {
  try {
    return win.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * localStorage behind try/catch: blocked or throwing storage never throws here (#20).
 * @type {import('../types.js').SafeStorage}
 */
export const safeStorage = {
  get(key) {
    try {
      return globalThis.localStorage ? globalThis.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      if (globalThis.localStorage) globalThis.localStorage.setItem(key, value);
    } catch {
      /* storage blocked: keep the in-memory default */
    }
  },
};
