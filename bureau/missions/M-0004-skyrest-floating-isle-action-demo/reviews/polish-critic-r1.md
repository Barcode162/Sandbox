# Review — polish-critic — ship look & feel — round 1 — M-0004

VERDICT: FAIL

## Scope reviewed
All 13 moments in `projects/skyrest/evidence/screens/moments/` (desktop, portrait, reference, landscape), set against `evidence/reference.jpg`. My own touch-mode captures (`hasTouch`, so Low quality, which is what the iPhone gets) are in `evidence/polish/`: F1, F2, F5 and F12 in portrait, F13 in landscape, and F2 at High at 802×917. Probe boxes come from `window.__skyrest.probe()` (L-0006).

## Method
I captured with Playwright and SwiftShader against `vite preview :4190`. Script: scratchpad `cap.mjs`. Telemetry for F2 at High and 802×917: 117 draws, 296 k tris (budget passes).

## Side-by-side verdict per moment
| # | Verdict | Note |
|---|---|---|
| F1 Title | Pass, with gaps | Strong world-first composition and a clean wordmark. The temple is centred (the spec puts it in the right half) and reads as a castle. |
| F2 Parity | **Fail** | The layout is close: probe at reference size puts the temple at cx 0.80, the golem at 0.55/0.68 and the hero at 0.47/0.87. The look is not. The sky is washed out, the temple is a grey tower, the golem is green and soft, the hero's hair reads as a mace, the blossom is a pink blob and the trail is mint. |
| F3 | Fail | The whole golem goes white under the flash. Numbers stack correctly. |
| F4 | Fail | "4,531" collides with "2,110". Gold crit and sparkle are present. |
| F5 | Pass | The telegraph decal, the "Roll through it!" hint and the raised fists all read in one glance. |
| F6 | Partial | Ring and dust are good. Bloom smears the golem, and the cape flips above the head. |
| F7 | Fail | The hero is a white blob, the temple swings out of frame and the vignette reads pink. |
| F8 | Partial | The heat shift reads. The banner sits over the temple and the number sits on the bar. |
| F9 | Pass | Boulders scatter and the runes die grey. The coins read as flat orange chips. |
| F10 | Pass | The card is clean, coins fly to the pill and the count rolls. |
| F11 | Pass | Position and translucency match the reference panel, and the items are our own. Best match to the reference in the build. |
| F12 touch | Partial | Controls are clear of the golem, but the hero runs from sy 0.65 to 0.86, into the button zone. |
| F13 touch | Pass, with gaps | Good framing and clear controls. The "Drag to move" hint is faint. |

Note: the CEO's moment captures were not taken in touch mode, so F12 and F13 there show no controls and say "Press any key". Recapture them with `hasTouch`.

## Polish-list scorecard (checked by eye: 9 of 14 pass; 11 not verifiable from stills)
1 blue-grey cliffs: PASS (F2-reference) · 2 warm rim: FAIL (not visible on trees, F2-desktop) · 4 trail longer than the sword and fading: PASS (F2) · 6 numbers outlined and grouped: FAIL (they collide, F4) · 7 crit gold 40 px: PASS (F4) · 9 nameplate on screen: PASS · 13 decal fill: PASS (F5) · 17 petals drift: PASS (F2) · 18 waterfall bottoms hidden: PASS · 19 emblem brightest in the far plane: FAIL (the portal outshines it) · 22 crumble: PASS (F9) · 25 no HUD on title: PASS (F1) · 12 joystick placement: PASS (F12-touch) · 14 afterimage: FAIL (F6 shows the cape artefact, no afterimage).
Not verified from stills: items 3, 5, 8, 10, 11, 15, 16, 20, 21, 23 and 24 (timing). I defer these to the test-engineer's unit and e2e runs.

## Five tests
- **Flagship:** FAIL. Next to the reference it reads as "good for a procedural demo". The haze, the castle and the green golem give it away within seconds.
- **Stranger:** PASS. The hints, decal and controls are obvious.
- **Second-Look:** FAIL. Close up you find the mace hair, colliding numbers, the cape flip and the white-out flashes.
- **Abuse:** not tested this round.
- **No-Excuses:** PASS by eye. No placeholders seen.

## Top 10 changes that would most raise the experience
In order: F-008 sky, F-009 temple, F-010 golem, F-011 hero, F-012 blossom, F-013 trail, F-014 numbers, F-015 hurt, F-016 dome, F-017 falls. Each finding carries its numeric target.

## Findings filed
S1: F-008 sky/far haze · F-009 temple · F-010 golem · F-011 hero hair/scale · F-012 blossom · F-013 trail colour · F-014 damage-number collision.
S2: F-015 hurt state · F-016 tiny-planet curvature · F-017 waterfalls/cliff · F-018 distant islets · F-019 cape flip · F-020 portrait hero in control zone.
S3: F-021 copy/HUD (kindles banner, drag hint, legend, title yaw).

## Strengths worth keeping
The HUD: coin pill, hearts, nameplate and pause panel are crisp and on-token. The telegraph language in F5 and F6. The victory card. The composition and depth planes are right in layout, and the camera height matches. The Low path on touch looks crisper than High on desktop, so the High bloom needs to be reined in.

## Overall assessment
The structure is right and the surface is wrong. Every gap to parity is in materials and modelling (sky, temple, golem, hero head), not in layout or systems. All of them are fixable with the numbers above.
