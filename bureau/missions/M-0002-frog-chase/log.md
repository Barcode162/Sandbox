# Log — M-0002 Frog river chase

Chronological record kept by `bureau`. Append with `python3 bureau/bin/bureau log <mission> "<decision>"`.

- `2026-11-20T21:41:47Z` **ceo** — Mission opened — tier 2 (Squad), output `projects/frog-chase`, agent budget 8, levers bakeoff, polish.
- `2026-11-20T21:42:09Z` **ceo** — Phase intake → **design**
- `2026-11-20T21:42:09Z` **ceo** — Convened 1× experience-designer
- `2026-11-20T21:42:09Z` **ceo** — Tier 2 + bakeoff,polish chosen (L-0001). Owner will pick the direction from 3 cards.
- `2026-11-20T22:16:06Z` **ceo** — Owner judged bake-off: B Lilyfield + trick look-alike pads, 2-3 choices per hop, fast. board/bakeoff-experience.md
- `2026-11-20T22:22:40Z` **ceo** — Spec done (5998w). CEO decisions: 120 Hz tick; new river each run, seed via ?seed=; test hooks window.__lily + TUNING override allowed; grayscale tell check = automated pixel test if cheap, else polish-critic.
- `2026-11-20T22:22:40Z` **ceo** — Convened 1× architect
- `2026-11-20T22:32:20Z` **ceo** — Phase design → **plan-review**
- `2026-11-20T22:32:22Z` **ceo** — plan gate PASSED (round 1)
- `2026-11-20T22:32:22Z` **ceo** — Phase plan-review → **build**
- `2026-11-20T22:32:22Z` **ceo** — Convened 3× engineer
- `2026-11-20T22:32:51Z` **ceo** — Wave 1: WO-002/003/004 convened in parallel on base ea5b9c0.
- `2026-11-20T22:53:48Z` **ceo** — WO-002 DONE. CEO ruling §4.3: a 1.4 s hop period surviving on constant near-misses is acceptable (max tension, still slower than any good run); keep as tested. Spec numbers (max hop, G5 quota, trick rates) accepted as the generator's adjusted values; noted for retro.
- `2026-11-20T23:51:41Z` **ceo** — Join: CEO ran npm run verify: 16/16 PASS, 11m48s wall (sim-determinism 318 s). Slowness flagged to reviewers.
- `2026-11-20T23:51:41Z` **ceo** — Phase build → **review**
- `2026-11-20T23:51:41Z` **ceo** — Convened 1× code-reviewer
- `2026-11-20T23:51:41Z` **ceo** — Convened 1× polish-critic
- `2026-11-21T03:32:46Z` **ceo** — Both reviewers hit the usage limit mid-review (reset 02:20 UTC). Resume, don't re-convene (L-0005).
- `2026-11-21T03:33:39Z` **code-reviewer** — F-001 [S1] filed: 30 vs 144 Hz determinism checks are blind to frame-rate dependence (and cost 318 s)
- `2026-11-21T03:33:39Z` **code-reviewer** — F-002 [S2] filed: In-browser sim-step p95 budget check is vacuous (coarse timer reads 0)
- `2026-11-21T03:33:39Z` **code-reviewer** — F-003 [S2] filed: Tap-on-pad during the 40 ms retarget window retargets the current hop to a different pad
- `2026-11-21T03:33:39Z` **code-reviewer** — F-004 [S3] filed: Flanked X chip vanishes during squash but a retarget can still land on the armed flank
- `2026-11-21T03:33:39Z` **code-reviewer** — F-005 [S3] filed: Pause-button e2e silently passes if the button is missing
- `2026-11-21T03:33:39Z` **code-reviewer** — F-006 [S3] filed: Small per-frame allocations in the frame path
