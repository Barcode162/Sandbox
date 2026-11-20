// helpers/admireClock.js: the timing semantics every admire, placard, breathing and chrome-fade
// test relies on (architecture K11; Gate 1 E5, R4), and the two Web Animations helpers that read
// CSS transitions without sampling them under a fake clock.
//
// ── What Playwright 1.63.0's page.clock does here (probe: tests/e2e/contracts/clock-probe.spec.js,
//    re-run by WO-013 on 2026-11-20; output quoted verbatim; it runs in every `npm run verify`) ─────
//
//   [K11] probe 1: rAF is frozen while the clock is paused
//     paused page rAF callbacks: 0 while a free page ran 32 rAF over 516 ms of real time
//   [K11] probe 2: setTimeout is advanced by clock.runFor
//     after runFor(1199): fired=false · after runFor(1): fired=true
//   [K11] probe 3: CSS transitions are NOT advanced by clock.runFor while paused
//     opacity after runFor(450): 1 · after ≥ 1300 ms of real time: 0
//   [K11] probe 4: seeking a paused CSSTransition currentTime gives exact values
//     900 ms / 200 ms-delay linear fade 1 → 0: {"0":1,"200":1,"650":0.5,"1100":0}
//     · timing {"duration":900,"delay":200,"easing":"linear"}
//
// ── The rules that follow ───────────────────────────────────────────────────────────────────
//   * JS timers (the 1,200 ms idle timer, the 3,000 ms placard timer) and rAF-driven amplitude are
//     driven with `page.clock`: install() BEFORE goto, then pauseAt(), then runFor(). While paused,
//     rAF does not run, so a paused clock must never be used where scroll rendering is needed.
//   * CSS transitions (chrome fades, the placard cross-fade) run on wall time. "CSS transitions are
//     not advanced by `page.clock.runFor` while paused; fades are read by seeking
//     `CSSTransition.currentTime`." Never read computed opacity at paused-clock steps: it measures
//     nothing. Read a fade's timing with transitionTiming() and its curve with seekTransitions().
//
// Exports:
//   installClock(page)                                  clock.install() (call before goto)
//   pauseHere(page)                                     pauseAt(now in the page) and return that time
//   seekTransitions(page, selector, property, ms)       pause every matching CSSTransition and set
//                                                       currentTime = ms; returns the computed value
//                                                       of `property` per matching element
//   transitionTiming(page, selector, property)          { duration, delay, easing, count } from
//                                                       effect.getComputedTiming() of the matching
//                                                       running transition(s)

/** @typedef {import('@playwright/test').Page} Page */

/** @param {Page} page */
export async function installClock(page) {
  await page.clock.install();
}

/**
 * Pause the page clock at the page's current fake time (a no-op jump) and return that time (ms).
 * @param {Page} page
 */
export async function pauseHere(page) {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now);
  return now;
}

/**
 * Pause every running CSSTransition whose target matches `selector` and whose transitionProperty
 * is `property`, set its currentTime to `ms` (delay included, as in the Web Animations model), and
 * return the computed value of `property` on each matching element afterwards.
 * @param {Page} page @param {string} selector @param {string} property @param {number} ms
 * @returns {Promise<{ count: number; values: string[] }>}
 */
export async function seekTransitions(page, selector, property, ms) {
  return page.evaluate(
    ([sel, prop, t]) => {
      const anims = document.getAnimations().filter(
        (a) =>
          typeof CSSTransition !== 'undefined' &&
          a instanceof CSSTransition &&
          a.transitionProperty === prop &&
          a.effect instanceof KeyframeEffect &&
          a.effect.target instanceof Element &&
          a.effect.target.matches(sel),
      );
      for (const a of anims) {
        a.pause();
        a.currentTime = t;
      }
      const values = [...document.querySelectorAll(sel)].map((el) => getComputedStyle(el).getPropertyValue(prop));
      return { count: anims.length, values };
    },
    /** @type {[string, string, number]} */ ([selector, property, ms]),
  );
}

/**
 * Timing of the running CSSTransition(s) on `property` for elements matching `selector`.
 * @param {Page} page @param {string} selector @param {string} property
 * @returns {Promise<{ count: number; duration: number | null; delay: number | null; easing: string | null; all: { duration: number; delay: number; easing: string }[] }>}
 */
export async function transitionTiming(page, selector, property) {
  return page.evaluate(
    ([sel, prop]) => {
      const all = document
        .getAnimations()
        .filter(
          (a) =>
            typeof CSSTransition !== 'undefined' &&
            a instanceof CSSTransition &&
            a.transitionProperty === prop &&
            a.effect instanceof KeyframeEffect &&
            a.effect.target instanceof Element &&
            a.effect.target.matches(sel),
        )
        .map((a) => {
          const t = a.effect.getComputedTiming();
          return { duration: Number(t.duration), delay: Number(t.delay), easing: String(t.easing) };
        });
      const first = all[0] ?? null;
      return { count: all.length, duration: first ? first.duration : null, delay: first ? first.delay : null, easing: first ? first.easing : null, all };
    },
    /** @type {[string, string]} */ ([selector, property]),
  );
}
