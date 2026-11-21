# Review — polish-critic — look & feel — round 1 — M-0002

VERDICT: PASS WITH FINDINGS

## Scope reviewed
`projects/frog-chase` at 1c64090 (HEAD 6fa4fee makes no change to the project). Every §13 moment at 375×812 (touch) and 1440×900, plus the title at 1920×1080. Spec: `design/experience.md` §5–7, §11, §13.

## Method
Built and previewed, then drove the game with Playwright via `window.__lily`: stills, burst contact sheets (25–120 ms) and real-time runs in `evidence/polish/` (DPR 1, q80), every image read. Excluded: `m-06-tau.jpg`, `d-08-nearmiss.jpg`, `d-10c-curl-card.jpg` (wall-clock CSS frozen under the manual clock; re-shot in real time). Zero console errors.

## Polish-list scorecard (pass 17 · partial 3 · fail 1 · not re-checked 3)
| # | Result | Evidence |
|---|---|---|
| 1 | pass | squash at +25 ms, `m-02-hop-burst.jpg` |
| 2 | pass | log `hop@56B` on `land@56` |
| 3 | pass | `m-04-layer6-gray.jpg`, `m-05-layer10-gray.jpg` |
| 4 | partial | always one bubble, but ≈4.5 px (F-014) |
| 5 | pass (code) | `pose.ts:29` 0.9 s vs 2.1 s |
| 6, 7, 8, 9 | pass | hop burst: eyes up, shadow rejoins at +250 with no pop, chips L→R at +300–350, inverted chip at +25–75 |
| 10 | **fail** | droplets land on the pad (F-010) |
| 11 | pass (code) | `audio/cues.ts:37` L −2 / F 0 / R +3 |
| 12, 13 | pass (code/eye) | `renderer.ts:747`; head leads in `d-06-tau09-rt.jpg` |
| 14 | partial | synced to the heartbeat (`renderer.ts:963`), but invisible on mobile (F-011) |
| 15, 16, 17, 18 | pass | flash = 1 frame; "Keep hopping…"; live diagrams; `tabular-nums` |
| 20, 21 | pass | `m-11-win-first.jpg` "First time: 20.95"; route through every pad centre |
| 22 | partial | `:active` in code; no hover; press not caught on capture (F-015) |
| 23 | pass | banks alive (reeds, pebbles, life) |
| 19, 24 | not re-checked | covered by WO-003 suites |

## Findings filed
| ID | Sev | Title |
|---|---|---|
| F-007 | S1 | Title vellum reads as fog and creates ghost pads |
| F-008 | S1 | Reachable pads no brighter than others; chips carry the choice alone |
| F-009 | S2 | Dragonflies rest on reachable pads, covering chips and tells |
| F-010 | S2 | Droplets land on the pad (polish 10) |
| F-011 | S2 | Vignette invisible at 375 px until τ ≈ 0.9 |
| F-012 | S2 | Desktop win: 70% sand, route hidden, veil mutes the payoff |
| F-013 | S2 | Near-miss frame reads as a bite (no gap) |
| F-014 | S2 | Soggy bubbles too small; "no notch" never taught |
| F-015–F-018 | S3 | No hover; curl copy uses two vocabularies; timer covers finish log and stale best; stilt legs |

## The CEO's vellum question
Wrong (F-007): shadowless 62% sheet with a hard edge through both banks; it washes pads into a fourth "pad look" (`d-01-title-t3000.jpg`).

## Easy-brain 3-second test
Mostly passes: chips plus the ringing pad say "hop up" (`m-01-title-t3000.jpg`). Later, ~15 equal-green pads leave the choice to 32 px chips (F-008).

## Trick tells: fair but tricky?
Mostly. Curl reads in gray and motion (`m-10c-curl-burst.jpg`); soggy's notch tell is never taught, bubbles tiny (F-014). Flank is excellent (`m-07-flank-rt.jpg`).

## Checks that passed
Press-to-land ≈250 ms; restart-to-ready 155–164 ms (real time); cards fit at 375; pause focus ring visible (`m-12-pause-tab.jpg`); NEW BEST crosses out the old best; jaws at τ 0.96 read (`d-06-tau09-rt.jpg`).

## Strengths worth keeping
Cohesive, original cut paper. The flank telegraph is the best frame; the live-diagram sunk cards deliver "fooled once, understood after"; squash and chip inversion are crisp.

## Five tests
- **Flagship: not yet.** The title and win frames, the two "screenshot" moments, are the weakest (F-007, F-012).
- **Stranger: pass with risk** (F-008).
- **Second-Look: fail.** Droplets, dragonflies, the near-miss gap, hover and copy (F-009, F-010, F-013, F-015, F-016).
- **Abuse:** buffer and restart held. Resize was not re-tested.
- **No-Excuses: pass.** Zero console errors and no dead buttons.

## Top 10 changes
In order: F-007, F-008, F-012, F-011, F-013, F-014, F-009, F-010, F-017, F-015/016/018.

## Overall assessment
Core loop and flank are flagship level; bookends and pad readability held it back.

## Verification r1 (b3b4a96, fresh captures in `evidence/polish/v1/`)
- **Verified (11):** F-007 vellum gone (`v1/d-01-title-t3000.jpg`); F-008 choices pop, grayscale still separates (`v1/m-04-layer6*.jpg`); F-009 (`v1/d-06-tau09-rt.jpg`); F-010 and F-018 (`v1/m-02-hop-burst.jpg`); F-011 (`v1/m-06-tau-rt.jpg`); F-013 (`v1/m-08-nearmiss.jpg`); F-014 and F-016 (`v1/m-10*-card.jpg`); F-015 by computed style; F-017 (`v1/d-11a-k34.jpg`).
- **F-012: reopened in r1** (0.13× zoom, `v1/d-11-win-newbest.jpg`), **verified after fix r2 (d874ae8)**: 0.4×, large bloom hold, pan with the trace, docked card at 1440 and 1920 (`v2/d-win-best-0300.jpg`, `v2/d-win-best-2600.jpg`, `v2/w-win-first-2600.jpg`). "best 10:00.00" was a test-injected best (`bestMs: 600000`); a first-ever win shows "First time: 20.95". No placeholder.
- No other regressions; zero console errors.

**Flagship?** Yes: title and win frames both now are.
