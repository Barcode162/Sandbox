// core/announce.js: writes to the #status live region (role=status, aria-live=polite).
// It clears the region, then sets the text on the next frame, so a repeated message is read again.
// Owner chain: WO-001 → WO-014 → WO-025 → WO-024.

/**
 * @param {Document} doc
 * @param {Window} win
 * @returns {import('../types.js').Announce}
 */
export function createAnnounce(doc, win) {
  const region = doc.getElementById('status');
  let pending = 0;
  return function announce(message) {
    if (!region) return;
    region.textContent = '';
    if (pending) win.cancelAnimationFrame(pending);
    pending = win.requestAnimationFrame(() => {
      pending = 0;
      region.textContent = message;
    });
  };
}
