# QA review r1 — M-0003 Guidebook (HEAD 5952995)
Verdict: PASS WITH FINDINGS. Findings: S2 x2, S3 x3 (see `bureau finding list M-0003`).

## Criteria matrix
| Check | Result | Evidence |
|---|---|---|
| Opens from ••• with confirm; Cancel keeps seed (88 lights) | pass | dialog: Cancel / Export first / Replace; stats 88 -> 146 lights, 253 lines after Replace |
| "Reset to seed" confirm, then 88 lights, survives reload | pass | stats 88 lights · 100 lines after reset and reload |
| Search words (tax, Sam, garden, insurance, pdf, passport, deadline, Lisbon, money, renew, lease, monthly) | pass | all have direct matches (e.g. tax 8, Sam 7, lease 2) plus hop rings |
| Route Idea→Launch Today: 13 vs 3 (Idea→Garden app→Riverside Co-op→Launch) | pass | route-out text |
| Same, Last year: longer | pass | 7 hops, note "Riverside Co-op–Garden app invisible" |
| Passport→Trip to Lisbon; Bug #42→Weekly users | works, weak | 1 hop each Today; Bug 2 hops Last year (F filed S3) |
| Pathways per lens | pass | afford: Not yet 400 short / 2300 short / Book it 3700 left; months 2/10/0; checkout 75.6 member / 70 guest / 86.4 member |
| Notes' lens claims | partial | tax rate does not differ Last year (S3) |
| Readability 1440 | partial | labelRects overlaps 0 in all lenses; hubs unlabelled, blurred islands (S2) |
| Readability 375 | partial | overlaps 0 but Health/Day job/Code off-screen (S2) |
| Console/page/request errors | pass | none in any run |

## Viewports and measurements
1440x900 and 375x812, three lenses each, screenshots in bureau/missions/M-0003-guidebook/evidence/qa/ (viewed: L-1440-today, last-year, next-year, L-375-today, last-year). 768 not covered (not requested). Labels shown: 51 (1440), 24-26 (375). No NaN positions.

## E2E reruns
Run 1 failed only `[E6] perf 500 points >= 30 fps` (21.9 fps) while my drivers ran concurrently. Runs 2-4 (clean machine): 18/18 pass each. Conclusion: load-sensitive flake; likely the earlier unidentified failure (inferred, not proven).

## Flows
Menu > Guidebook > Cancel; again > Replace; search x12; routes x6 with lens switches (focus must be blurred before pressing 2, otherwise the digit types into the route field: expected behaviour); pathway runs x9; Reset to seed.

## Findings filed
S2: 375 framing cuts clusters; S2: hubs unlabelled/hairball at 1440; S3: tax rate claim; S3: trivial Passport route; S3: E6 flake.

## r1 verification (HEAD a25a1f2, rebuilt)
- F-001 verified: 375x812 Home framing shows all islands (no null screenPositions). Tiny map, 5-7 labels; acceptable. 88-light seed unchanged (frame change gated on >120 lights).
- F-002 verified: 1440, three lenses, separate islands, hubs labelled, overlaps 0, no errors (V-1440-*.jpg).
- F-003 verified: taxPct 5/4/8; Last-year search "tax" lights it.
- F-004 verified: Sam -> Tax return (4 hops), Work laptop -> Trip to Lisbon (3 hops) work as the notes say.
- F-005 left open as ordered. Seed framing compared by code gate, not pixel diff.
