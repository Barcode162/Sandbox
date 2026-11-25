# Retro — M-0003 Guidebook memory

## Outcome
Delivered: a 146-light, 256-line example memory (13 clusters, 3 time lenses, 3 pathways, Start-here + Try notes), opened from the ••• menu as a lazy chunk (16 KB gz). U-guidebook 1–7 assert every promise the notes make; E8/E8b drive it at 1440 and 375. Verify green.

## Metrics
- Agents: 1 of 2 (qa-tester, resumed twice incl. after a usage-limit stop). CEO built and fixed directly.
- Findings: S2 2, S3 3 — F-001..F-004 resolved and verified; F-005 (E6 perf test flakes under CPU contention) left open, S3.

## What worked
- Tier 1 with the CEO building: no hand-offs, contracts already frozen, the seed generator pattern reused.
- Asserting every sentence of the guide notes in unit tests caught nothing at first — the checker found the claims the tests didn't cover (tax rate "changes"; a trivial route). Tests now cover them.

## What hurt
- Hub links (guide notes, a Files hub) silently became route shortcuts; weighting them 0.25 fixed it.
- Phone framing hit the camera's distance cap; the fit math was right, the clamp wasn't visible.
