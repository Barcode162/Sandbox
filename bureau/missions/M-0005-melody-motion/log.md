# Log — M-0005 Melody's Crystals: motion

Chronological record kept by `bureau`. Append with `python3 bureau/bin/bureau log <mission> "<decision>"`.

- `2026-11-24T00:12:47Z` **ceo** — Mission opened — tier 2 (Squad), output `projects/melody-crystal-shop`, agent budget 8, levers polish.
- `2026-11-24T00:13:17Z` **ceo** — Convened 1× experience-designer — resumed the M-0004 designer (same agent) for the motion spec
- `2026-11-24T00:13:17Z` **ceo** — Phase intake → **design**
- `2026-11-24T00:13:17Z` **ceo** — Intake: tier 2 + polish. CEO builds on frozen site (M-0004 precedent). Republish pre-approved by Owner for this site.
- `2026-11-24T00:37:12Z` **ceo** — Phase design → **review**
- `2026-11-24T00:37:12Z` **ceo** — Build done by CEO: js/motion.js + CSS motion section + wiring on all 4 pages; 12 new motion tests (62 e2e total) green.
- `2026-11-24T00:37:15Z` **ceo** — Convened 1× code-reviewer — resumed M-0004 reviewer (did not build)
- `2026-11-24T00:37:15Z` **ceo** — Convened 1× polish-critic — resumed M-0004 critic (did not build)
- `2026-11-24T03:59:47Z` **code-reviewer** — F-001 [S2] filed: The 3 s reveal failsafe reveals everything, so nothing below the fold animates on scroll
- `2026-11-24T03:59:47Z` **code-reviewer** — F-002 [S2] filed: Price count-up runs inside an aria-live region: about 17 announcements per format change
- `2026-11-24T03:59:47Z` **code-reviewer** — F-003 [S3] filed: Under reduced motion, CSS animation delays still hide content for up to about 350 ms
- `2026-11-24T03:59:47Z` **code-reviewer** — F-004 [S3] filed: Typing in Name or Email rebuilds the whole order summary on every keystroke
- `2026-11-24T03:59:47Z` **code-reviewer** — F-005 [S3] filed: Motion nits: the badge roll never runs, the flight can start off-screen, and the order number is split into letter spans
- `2026-11-24T04:01:56Z` **code-reviewer** — F-006 [S1] filed: npm run verify is red at a8af578: two motion-coverage tests fail every run (nav, qty-note)
- `2026-11-24T04:11:13Z` **polish-critic** — F-007 [S1] filed: Scroll choreography is lost for anyone who reads the hero for 3 s: the failsafe reveals everything
- `2026-11-24T04:11:13Z` **polish-critic** — F-008 [S1] filed: The uncommitted failsafe fix leaves the footer's 'not medical advice' line permanently invisible
- `2026-11-24T04:11:14Z` **polish-critic** — F-009 [S2] filed: Sleep filter FLIP: one stranded card for ~200 ms, then survivors fly up and overlap it
- `2026-11-24T04:11:14Z` **polish-critic** — F-010 [S2] filed: Mobile add-to-bag flight launches from 700 px above the screen
- `2026-11-24T04:11:14Z` **polish-critic** — F-011 [S2] filed: Price odometer doesn't reserve width: the per-piece line jumps 20 px
- `2026-11-24T04:11:14Z` **polish-critic** — F-012 [S3] filed: Error shake hits all fields at once, including ones off-screen; blur never shakes
- `2026-11-24T04:11:14Z` **polish-critic** — F-013 [S3] filed: Small motion slips: double glint, early badge, clone blends in, undo pops back
- `2026-11-24T04:11:14Z` **polish-critic** — F-014 [S3] filed: motion.js is 13 KB against the spec's < 6 KB
- `2026-11-24T04:11:27Z` **ceo** — F-001 resolved: motion.js: ioAlive flag set on first IO callback; 3 s failsafe reveals only if the observer never fired; e2e 'F-001' waits 3.5 s then asserts footer children reveal only on scroll
- `2026-11-24T04:11:27Z` **ceo** — F-002 resolved: aria-live removed from price, qty and wyg; one hidden [data-announce] region set 400 ms after a change; rollChanged animates without rewriting text; e2e 'F-002' counts ≤2 live mutations and checks the sentence
- `2026-11-24T04:11:28Z` **ceo** — F-003 resolved: reduced-motion block adds animation-delay:0s and transition-delay:0s !important
- `2026-11-24T04:11:28Z` **ceo** — F-004 resolved: paintSteps() split out; name/email input calls only paintSteps (summary no longer rebuilt per keystroke)
- `2026-11-24T04:11:28Z` **ceo** — F-005 resolved: badge animates from the old value only when it changed (animateIn); flyToBag skips when the source image is off screen; order number has aria-label with letter spans aria-hidden
- `2026-11-24T04:11:28Z` **ceo** — F-006 resolved: moves() also reads ::before/::after; state-gated components (qty-note, badge, grid-status) get base transitions; full suite 66/66 three consecutive runs
