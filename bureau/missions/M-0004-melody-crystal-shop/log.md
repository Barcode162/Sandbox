# Log — M-0004 Melody's Crystal Shop

Chronological record kept by `bureau`. Append with `python3 bureau/bin/bureau log <mission> "<decision>"`.

- `2026-11-23T22:28:32Z` **ceo** — Mission opened — tier 2 (Squad), output `projects/melody-crystal-shop`, agent budget 8, levers polish.
- `2026-11-23T22:28:57Z` **ceo** — Intake: tier 2 + polish. Bakeoff skipped (one clear brand ask; cost). CEO does assets + build directly per M-0001 precedent; designer writes spec; code-reviewer, polish-critic, director-vision review.
- `2026-11-23T22:42:16Z` **ceo** — Convened 1× experience-designer
- `2026-11-23T23:14:31Z` **ceo** — Build done by CEO (assets: 23 Commons photos; site; verify green: static + 8 unit + 43 e2e incl. axe). Photo-filled SVG scenes for bag/jar formats.
- `2026-11-23T23:14:31Z` **ceo** — Phase intake → **review**
- `2026-11-23T23:14:53Z` **ceo** — Convened 1× code-reviewer
- `2026-11-23T23:14:53Z` **ceo** — Convened 1× polish-critic
- `2026-11-23T23:18:15Z` **code-reviewer** — F-001 [S1] filed: One malformed bag entry in localStorage crashes every page (empty shop grid, blank checkout)
- `2026-11-23T23:18:15Z` **code-reviewer** — F-002 [S2] filed: Bag silently does nothing when localStorage.setItem throws but getItem works (quota/locked storage)
- `2026-11-23T23:18:15Z` **code-reviewer** — F-003 [S2] filed: Faded toast keeps intercepting taps over the drawer's Keep shopping button at 375 px
- `2026-11-23T23:18:15Z` **code-reviewer** — F-004 [S2] filed: Undo is unreachable by keyboard and screen-reader users while the bag drawer is open
- `2026-11-23T23:18:15Z` **code-reviewer** — F-005 [S2] filed: Pay in person + Pay over time shows money 'due today' that nobody collects today
- `2026-11-23T23:18:15Z` **code-reviewer** — F-006 [S2] filed: Checkout total goes stale when the bag changes in another tab; Place order charges the new amount
- `2026-11-23T23:18:15Z` **code-reviewer** — F-007 [S3] filed: Catalogue strings interpolated into HTML without esc() (tags, slug, focus)
- `2026-11-23T23:18:15Z` **code-reviewer** — F-008 [S3] filed: Card checks are loose at the edges: 2220 is detected as Mastercard, expiry accepts 2099, debit copy says Visa/MC only but Amex passes
- `2026-11-23T23:21:33Z` **ceo** — F-001 resolved: bag.js lines() drops non-object entries; parse errors reset to []; e2e 'F-001: a corrupt saved bag never breaks the shop' (4 corrupt payloads)
- `2026-11-23T23:21:33Z` **ceo** — F-002 resolved: bag.js read() returns memory once persistent=false; parse error no longer flips persistence; e2e 'F-002' stubs setItem to throw
- `2026-11-23T23:21:33Z` **ceo** — F-003 resolved: styles.css .toast pointer-events:none unless .is-on; undo moved into drawer; e2e 'F-003/F-004' clicks Keep shopping at 375 after 5.3 s
- `2026-11-23T23:21:33Z` **ceo** — F-004 resolved: Undo is an in-drawer button (role=status row) focused after Remove; Enter restores; e2e 'F-003/F-004'
- `2026-11-23T23:21:33Z` **ceo** — F-005 resolved: checkout.js firstDue(): 'at pickup'/'at delivery' for pay-in-person in summary, schedule, button and confirmation; e2e 'F-005'
- `2026-11-23T23:21:33Z` **ceo** — F-006 resolved: ui.js storage listener dispatches bag:change so checkout re-renders; e2e 'F-006' second tab adds a 50 jar, button updates to $162.00
- `2026-11-23T23:21:33Z` **ceo** — F-007 resolved: product.js eyebrow/tags and ui.js card tags escaped; tag hrefs encodeURIComponent
- `2026-11-23T23:21:33Z` **ceo** — F-008 resolved: payment.js MC regex ^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720); expiry > now+20y = format; debit subtitle matches accepted brands; unit test 'review fixes'
- `2026-11-23T23:21:33Z` **ceo** — Phase review → **remediation**
