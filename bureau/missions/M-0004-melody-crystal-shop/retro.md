# Retro — M-0004 Melody's Crystal Shop

## Outcome
| Success criterion | Delivered? | Evidence |
|---|---|---|
| `npm run verify` green: static, e2e of every flow and legal payment × fulfilment combo, axe 0 serious/critical, 375–1920 px | Yes | static OK, 9 unit, 50 e2e |
| All 12 crystals with photo + three priced formats | Yes | per-crystal e2e loop; `scripts/check-static.mjs` |
| No console errors; only same-origin + Google Fonts requests | Yes | `guard()` in every flow test |

## Metrics
- Headcount: experience-designer 1, code-reviewer 1 (resumed ×2), polish-critic 1 (resumed ×3), director-vision 1 → **4 of 8**. The CEO did assets, build and remediation directly.
- Findings: 31 (S0 0 · S1 4 · S2 18 · S3 9). code-reviewer 10, polish-critic 21. All verified by the filer. One reopen (F-029).
- Rounds: 2 remediation passes plus 1 re-verify; ship round 1.
- Board: director-vision APPROVE 8.6 (Fidelity 9, Ambition 8, Craft 8.5, Correctness 9, Engineering 8.5, Perf 8.5, A11y 8.5, Evidence 8).

## What worked
- Resuming reviewers for verification instead of convening fresh ones kept the cost at 4 agents.
- Frame-table spec in one pass (about 3,000 words) was enough to build from directly.
- Writing a regression e2e for every finding made each fix provable.

## What hurt
- Wikimedia Commons rate-limited the container hard (429 for 600 s on non-standard thumbnail sizes). Requests at standard widths (330/500/960/1280) and batched metadata calls worked. About 25 minutes were lost.
- The CEO judged the SVG jar/bag "format scenes" good enough at full size. The critic correctly called them clip-art at the peak moment (F-009). A drawn stand-in should never replace real photography in the main frame.
- The shared dev server on fixed ports was killed by parallel agents (exit 144). Each agent should use its own port.

## Root causes
| Finding | Root cause | Stage that should have caught it |
|---|---|---|
| F-001 corrupt bag crash | Store trusted parsed JSON shape | Build: unit test of bag with hostile storage |
| F-009 clip-art peak | Builder self-judged illustration vs photos | Build: screenshot beside a real photo before shipping |
| F-010 mobile gallery overflow | Grid child without `min-width:0` | e2e overflow test covered only `/`, not every route at 375 |
| F-011 confirmation scroll | Smooth scroll interrupted by focus | Build: assert scrollY after route-like swaps |

## Escapes
None at the Board.
