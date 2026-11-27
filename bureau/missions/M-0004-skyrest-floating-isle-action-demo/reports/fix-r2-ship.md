# Report — fix-r2 — ship round 2: F-011, F-016, F-022, F-023, F-024

STATUS: DONE
Discipline: rendering / character art · Mission: M-0004 · Round: fix-r2

## Built
The hero's hair is now its own mesh: 17 flat locks laid along the skull, swept back and down, white on top with a cool underside, on a toon material with a pale shade, so the back of the head reads as white hair. A shared rim layout puts about 26 bush clumps and rock clusters round the arena lip. Trunks now dither with their canopy, and a trunk that crosses the sight line fades on its own. While paused, the game no longer redraws a frozen frame. A new evidence spec re-shoots every cited screenshot. F12 and F13 are now touch captures.

## Done-when criteria
| # | Criterion | ✓/✗ | Evidence |
|---|---|---|---|
| 1 | F-011: head reads as hair swept back/down, no spikes past the skull at top/sides (3× crops) | ✓ | `projects/skyrest/evidence/r2/F11-head-802x917-3x.jpg`, `…/F11-head-430x932-3x.jpg`; `src/hero/model.ts` hairLock/hairGeo |
| 2 | F-016: no unbroken rim arc >50 % of F2-desktop width | ✓ | `evidence/r2/F16-F2-desktop-1280x720.jpg`, `screens/moments/F2-desktop.jpg`, F4-desktop; longest bare run ≈25 %. `src/world/rim.ts`; unit R1/R2 |
| 3 | F-022: no dark limb over the hero or a button when a canopy dithers | ✓ | `evidence/wo-003/touch-portrait.jpg`, `touch-landscape.jpg`; `materials.ts` TOON_CANOPY_STILL; `world/occlusion.ts` (unit R3) |
| 4 | F-023: every cited path exists; F12/F13 are hasTouch captures | ✓ | `tests/e2e/evidence.spec.ts` 13/13. Path check over findings.jsonl: 0 missing. `moments.spec.ts` touch pages assert `touch-controls.show` |
| 5 | F-024: LP2 deterministic; cause fixed, not the timeout | ✓ | `src/app/game.ts` tick (paused ⇒ draw only on change). LP2 asserts 0 GL draws while paused. Stress ×8 on 4 workers: 0/8 → 6/8; ×6 on 2 workers: 6/6 |
| 6 | Moments re-shot | ✓ | `moments.spec.ts` 28/28; F2-reference and F13-landscape opened and judged |

## Verify
`tsc` clean · `npm run test:unit` 52/52 · `npm run build` ✓ (gzip 217 KB of 300 KB) · desktop e2e (world, hero, loop, smoke, heap) 18/18 · phone 4/4 · moments 28/28 · evidence 13/13.

## Gaps and requests
- **F-016 cause, stated plainly:** the curve comes from the geometry of a high camera over a 15 m disc. By the sag formula, a narrower lens from further back keeps about 170 px of sag, so I broke the silhouette instead of retuning the lens. The whole-frame gestalt still bows a little, as the reference's right edge does.
- **F-024:** the remaining LP2 time (≈60 s of its 120 s budget when alone) is the live, unpaused High frames on SwiftShader; the gear click alone waits about 15 s on the first fight frames. Under 4× stress, 2 of 8 runs still run out of budget. At the suite's 2 workers it is green.
- **Cost:** High is 122 draws / 351k tris, up from 117 / 309k (budget test passes). The hair is about 10k tris per hero copy; I can halve it (ARC 14→10, K 7→5) if the budget tightens.
- Files outside OWNS: none. Nothing committed.
