# Review — code-reviewer — whole product — round 2 — M-0004

VERDICT: PASS WITH FINDINGS

## Scope reviewed
- Fixes for F-001..F-008: diff `a642461..cadb83d`.
- The polish round: `git diff cadb83d..691180f -- projects/melody-crystal-shop/site`.

## Method
`npm run verify`: `50 passed`. Playwright probes (scratchpad, port 4199) repeated every round-1 repro and tested the new code paths.

## Verification of round-1 findings
| ID | Result | Evidence |
|---|---|---|
| F-001 | verified | Junk entries seeded: 0 errors, 12/12 grid |
| F-002 | verified | Throwing `setItem`: item added, note shown |
| F-003 | verified | The centre of Keep shopping at 375 px now hits Keep shopping |
| F-004 | verified | Undo in drawer, focused, in Tab trap |
| F-005 | verified | "pay $23.75 at pickup"; cards still "today" |
| F-006 | verified | Live update to $166.00; confirmation survives |
| F-007 | verified | `data-tags` (ui.js:393) still raw; harmless |
| F-008 | verified | 2220/2721 rejected, 12/99 rejected, debit copy fixed |

## New findings
| ID | Sev | Title | Where |
|---|---|---|---|
| F-026 | S2 | Focus drops to `<body>` when the Undo row expires | ui.js:318 |
| F-027 | S3 | "What you get" copy duplicates FORMATS; thumbnails ignore `photoStyle` zoom | product.js:131 |

## Polish diff: checks that held
- **Price count-up.** `countTo` now cancels the previous frame. Switching jar, then bag, then pressing +1 ends at "$16" with the button showing "Add to bag · $32".
- **Checkout teardown.** The `AbortController` removes the `bag:change` and media-query listeners when the order is confirmed or the bag empties, so nothing touches DOM that has been replaced.
- **Gallery.** It is now photos only. `.thumbs` is optional and its listener uses `?.`, so a crystal with one photo cannot throw.
- **Text.** New strings use `textContent` or `esc()`.

## Overall
All eight round-1 fixes hold under independent repro. The polish round introduced no money, data or security regressions. F-026 is the one item a keyboard or screen-reader customer would notice; fix it before delivery.

## Round 2b (613affd)
- F-026 verified: focus stays inside the drawer when the Undo row expires (probe). The timer still does not pause on focus.
- F-027 verified: the copy now lives in `FORMATS[].youGet`, and every crystal image uses `photoStyle(c)`.
- e2e on an isolated port: `50 passed`.
