# Log — M-0003 Guidebook memory: example data that teaches retrieval

Chronological record kept by `bureau`. Append with `python3 bureau/bin/bureau log <mission> "<decision>"`.

- `2026-11-24T05:11:02Z` **ceo** — Mission opened — tier 1 (Desk), output `projects/constellation`, agent budget 2.
- `2026-11-24T05:24:28Z` **ceo** — Phase intake → **build**
- `2026-11-24T05:24:28Z` **ceo** — CEO built the Guidebook directly (tier 1): 146 lights / 256 lines, 13 clusters, 3 pathways; menu item + lazy chunk (16 KB gz); U-guidebook 1–6, E8. Verify green 2/3 runs; one unidentified e2e failure on the first full run, passed on rerun — flagged to checker.
- `2026-11-24T05:24:32Z` **ceo** — Convened 1× qa-tester — checker
- `2026-11-24T05:34:46Z` **qa-tester** — F-001 [S2] filed: At 375x812 the Guidebook's first framing cuts off whole clusters (Health, Day job, Code)
- `2026-11-24T05:34:46Z` **qa-tester** — F-002 [S2] filed: Cluster hubs unlabelled / islands blur into one hairball in every lens at 1440
- `2026-11-24T05:34:46Z` **qa-tester** — F-003 [S3] filed: Notes promise the tax rate changes by lens, but taxPct is 5% Today and Last year
- `2026-11-24T05:34:46Z` **qa-tester** — F-004 [S3] filed: 'What do I need before the trip?' answered by a trivial 1-hop route (Passport -> Trip to Lisbon)
- `2026-11-24T05:34:46Z` **qa-tester** — F-005 [S3] filed: E6 perf e2e fails under CPU contention (likely the unidentified first-run failure)
- `2026-11-24T05:38:12Z` **ceo** — F-002 resolved: Island centres spread x1.4, timeline and flowcharts moved out with them; each island's hub now crowns its disc (open sky for its label); renderer gives label priority to the top 10 hubs when a memory has >120 lights (seed unaffected). G2 at 1440 now names Home, Money, Health, Learning, Day job, Garden app, Birthdays, lisbon-itinerary.
- `2026-11-24T05:38:12Z` **ceo** — F-003 resolved: taxPct facets now 5/4/8 (Today/Last year/Next year); checkout last year = 69.4 USD; U-guidebook-4 and -6 updated.
- `2026-11-24T05:38:12Z` **ceo** — F-004 resolved: Guide and Files-hub links weighted 0.25 so routes go through real things; notes now suggest Sam → Tax return (4 today via invoice, 5 last year via the night course) and Work laptop → Trip to Lisbon (3, via handbook and leave days). New U-guidebook-7 asserts named routes are ≥3 hops and never pass through guide notes or the Files hub.
- `2026-11-24T05:41:59Z` **ceo** — F-001 resolved: Small screens: a memory with >120 lights (the Guidebook) now frames every island (bounding fit x1.06) instead of only what the pathways read; camera MAX_DIST 520→1600 so a portrait phone can fit it. New E8b asserts Health, Day job, checkout.js, Learning, Home, Money, Garden app and Launch are all on screen at 375x812 after Home. The 88-light seed keeps its spec §8 phone framing.
- `2026-11-24T05:41:59Z` **ceo** — CEO remediation r1: F-001..F-004 resolved (islands spread + hub crowns, hub label priority for >120 lights, phone fit-all for >120 lights + MAX_DIST 1600, taxPct 5/4/8, weak guide/Files links + better example routes). Verify green; 19 e2e. Checker resumed to verify.
