// engine/admire.js: arming, blocking, entry and exit, placard timer, de-duplicated announcements
// (C4 AdmireCtl, §7). WO-001 STUB, inert: never arms, never enters. WO-016 replaces the body; the
// factory name and signature are frozen.

/** @type {import('../types.js').CreateAdmire} */
export const createAdmire = function createAdmire(_opts) {
  return {
    get armed() {
      return false;
    },
    get mode() {
      return /** @type {'off'} */ ('off');
    },
    get placard() {
      return false;
    },
    on() {
      return () => {};
    },
  };
};
