// engine/rewind.js: "Run it backwards" (8 s, rAF), cancellation, "Jump to the first beam"
// (C4 RewindCtl, §8.1). WO-001 STUB, inert: `active` is always false and nothing scrolls.
// WO-018 replaces the body; the factory name and signature are frozen.

/** @type {import('../types.js').CreateRewind} */
export const createRewind = function createRewind(_opts) {
  return {
    get active() {
      return false;
    },
    start() {},
    stop() {},
    jumpToStart() {},
    on() {
      return () => {};
    },
  };
};
