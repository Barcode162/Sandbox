# Review — polish-critic — look, feel, motion, sound, copy — round 1 — M-0002

VERDICT: FAIL (2 S1s, both cheap to fix; the rest is close to flagship)

## Scope reviewed
dist build of `projects/tower-defense` (HEAD), §10 frame tables, §11, §12 (audio from code), §14, §16, §18.

## Method
- Ran `npm ci && npm run build && npm run test:screens` (38/38). Read every capture in `evidence-local/screens/`.
- My own Playwright bursts (`?test=1`, manual clock, real mouse and keys) covered every §10 motion, at 17–100 ms steps. Contact sheets are in `evidence/polish/`.
- Audio judged from `src/audio/*`. `evidence/WO-005/audio-offline.json`: −3.65 dBFS peak at 300 pops.

## Findings filed
- **S1:** F-013 (title idle peel is hidden), F-014 (the boss is invisible at arrival).
- **S2:** F-015 tier-box glyph collisions · F-016 badges · F-017 place flecks · F-018 star hides the ghost · F-019 coaster blink · F-020 float chips · F-021 banner over the bar · F-022 shed stack · F-023 death burst · F-024 stage hooks.
- **S3:** F-025 to F-030 (title→play layering, no pressed state, ticker easing, crackle vs leak, victory quiet, petal shadow + game-over band).

Concur with F-004 (settings card crowding): the Back button sits 6 px from the torn edge.

## §10 rows judged
| Row | Verdict | Evidence |
|---|---|---|
| 10.1 t 0 / 800 | ✓ letters fold, map fades (the capture is ~80 ms late, F-024) | `title.jpg` |
| 10.1 Idle 5 s | ✗ the peel is under the wash; the right side is empty | `title-idle-5s.jpg` |
| 10.1 Play pressed | partial: one motion, but the wash veils the HUD | `toplay.jpg` |
| 10.2 Board / selected / invalid | ✓ two glows; ring, ✕ and hatch read | `nudge.jpg`, `clear.jpg` |
| 10.2 Hover star | ✗ ghost hidden | `ghost-zoom.jpg` |
| 10.2 Placed | partial: bounce ✓, Go pulse ✓, banner ✓, flecks invisible, chip on the border | `placed.jpg`, `pill.jpg` |
| 10.3 Round 1 | ✓ ring, flecks, child; quiet but clear | `r1.jpg` |
| 10.4 Click / hover / buy / sell | ✓ fold, preview, box flip, gold flecks, sink; ✗ coaster blink | `fold.jpg`, `upbuy.jpg`, `upbox.jpg`, `sell.jpg` |
| 10.4 Sealed | partial: hover copy ✓, stamp illegible | `tiers-zoom.jpg` |
| 10.5 Storm | ✓ colour stepping across the pocket; rings are never lost; blots stay crisp | `pop.jpg`, `r18-1920-zoom.jpg` |
| 10.6 Warning | ✓ banner, Knots | screens `r20-warning` |
| 10.6 Arrival | ✗ no visible boss | `emerge.jpg` |
| 10.6 Shed | partial: flash, ring, notch tear, shake ✓; spray ✗ | `shedY.jpg`, `shedYz.jpg` |
| 10.6 Death | partial: 3 rings, bar tear, shake ✓; burst small, banner over the bar | `death.jpg` |
| 10.7 Pause | ✓ fold-down, dim, layout to spec | `pause.jpg` |
| 10.8 Settings | ✓ colourblind preview strip; crowded (F-004) | screens `settings-cb` |
| 10.9 Game over | ✓ the flood is excellent; drain → R1 in 300 ms | `flood.jpg`, `retry.jpg` |
| 10.10 Victory | partial: cranes and card ✓, no quiet beat | `vic.jpg` |

## §16 scorecard: 17 ✓ · 4 partial · 0 ✗
1 ✓ fixed pill rect (`pill.jpg`) · 2 ✓ the ghost follows a fast move in 1 frame · 3 ✓ ✕ at 37.5 px, none at 38.5 (`clear.jpg`) · 4 ✓ no gap frame (`pop.jpg`) · 5 ✓ rings never culled · 6 ✓ 0/3/4/5/6 lobes (screens `blots-grid`) · 7 ✓ dashed + hatched · 8 partial: code path is right (tink + sparks, no ring) but I didn't see it live · 9 partial: the sim interpolates the turn (pangle) but I didn't capture it · 10 ✓ 48-cell sheet, portraits match · 11 ✓ "The other fold went deep." · 12 ✓ "need 550 more" · 13 ✓ bonus counts on arrival (`hud.ts:189`) · 14 ✓ Start/1×/2× true · 15 partial: no blur anywhere, but petals sit at (+2,+3) (F-030) · 16 ✓ fill tracks lives · 17 ✓ notch tears at <50% (`shedYbar`) · 18 ✓ 800 Hz / −6 dB, τ 30 ms → ~90 ms restore · 19 partial: no clip, crackle ceiling > leak (F-028) · 20 ✓ banners stay at y 96 · 21 ✓ retry 300 ms, no stale flash.
The frame-level misses (hover star, coaster blink, sealed legibility) are in the §10 table, not here.

## Five tests
- **Flagship:** not yet. The two most cinematic beats, the title idle and the boss arrival, miss.
- **Stranger:** pass. The 3-click onboarding reads by shape.
- **Second-Look:** fail. Glyph collisions, the coaster blink and the chip plates.
- **Abuse:** pass for viewports (letterbox clean at 900×600; 1920 crisp).
- **No-Excuses:** pass. No console errors in 38 stages.

## Top 10 changes
1. Move the attract kill zone to the right loop (F-013).
2. Boss visible on its arrival beat (F-014).
3. Clean tier-box typography (F-015).
4. Shed spray and death scatter (F-022, F-023).
5. Banner below the bar during the boss (F-021).
6. Visible placement flecks (F-017).
7. Float chips without plates, full 18-px rise (F-020).
8. Go badge inside the plate (F-016).
9. Coaster steady through the morph (F-019).
10. 1 s of quiet before the cranes (F-029).

## Strengths worth keeping
Palette discipline and the paper material. The game-over flood and drain. The box flip and the fold. Storm peel colour-stepping with every ring intact. Cached blots crisp at 1280 and 1920 with no halos (`crisp-zoom.jpg`). The copy is §14 verbatim.
