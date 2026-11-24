# Review — polish-critic — motion — round 1 — M-0005

VERDICT: FAIL (2 × S1)

## Scope reviewed
a8af578: §6 frames and §7 list at 1440×900 and 375×812, light, dark and reduced motion. The working tree carried uncommitted motion edits, so I served a `git archive` export of a8af578 on 4197 and re-ran everything against it. F-008 concerns the uncommitted change.

## Method
Playwright frame bursts (30–120 ms apart) after each trigger, about 600 frames in the scratchpad. Frozen Web Animations frames for the glint. An instrumented `Element.animate` logging timing, keyframes and delays. Probes for CLS, long tasks, reveal counts, a dead observer, scroll-up, off-screen `getAnimations()`, odometer shift, double Add, max scale, drawer timing, shakes and burst seeding. 12 contact sheets (labelled in ms) are in `evidence/polish-r1/`.

## The moments
- **Hero load: premium.** Reading-order rise and the stones settle into their tilt. Glints at 923/1042/1162 ms (spec 900/1020/1140). Still by about 1.4 s (01).
- **Glint: beautiful.** At peak it is a true specular streak with a warm veil, crossing in about 250 ms of visible travel. Dark mode holds (02).
- **Shimmer.** A quiet soft band at 0.35; keep it, but feather the veil edge (03, F-013e).
- **Grid entry: broken in practice.** The unconditional 3 s failsafe has already revealed everything, so a normal visitor never sees the staggered rise, only late glints (04, F-007).
- **Sleep FLIP: the weakest moment.** One card sits stranded for about 200 ms, then the survivors slide up from row 2 and collide (05, F-009).
- **Jar.** The tile springs and the check rotates in, and the What-you-get inset changes. The price counts up while the per-piece line jumps 20 px horizontally (06, F-011).
- **Flight at 1440: delightful.** The arc to the bag is right, the radius stays 14 and it sits above the drawer (z 70 vs 61). But the clone over the same photo reads as a hole, and the badge updates before it lands (07, F-013).
- **Flight at 375: invisible.** It launches from −706 px (08, F-010).
- **Drawer.** Closes in 260 ms, opens in 380. Remove and the empty state stage in nicely; Undo pops back with no motion (09).
- **Errors: busy.** The summary drops well, but 11 fields shake at once, including fields off-screen (10, F-012).
- **Confirmation: lovely and quiet.** The seal springs, 14 tiny stars burst and the letters cascade, then it rests (11).
- **Reduced motion: correct.** Changes are instant, with no glint, flight, shake or burst (12).

## §7 polish-list scorecard: 13 / 15 pass
| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | JS off equals settled state | PASS | no element at opacity 0 |
| 2 | Failsafe within 3 s | PASS (but it also fires with a live observer: F-007) | probe |
| 3 | No re-hide on scroll-up | PASS | 0 hidden after down/up |
| 4 | No glint on 72 px thumbs or under reduced motion | PASS | 0 glints over 12 rows |
| 5 | Hover cooldown, no strobe | **FAIL**: entrance and hover glints stack (8 over 4 cards in ~1 s) | F-013a |
| 6 | Shimmer paused off-screen | PASS (only a finished header `drop` remains listed) | probe |
| 7 | Odometer reserves width | **FAIL**: 20 px shift | F-011 |
| 8 | Numbers move in the click's frame | PASS | m5f jar log |
| 9 | Clone radius 14, above drawer | PASS (14 px, z 70 > 61) | |
| 10 | Second Add cancels the first flight | PASS (1 flyer, badge 2, qty 2) | |
| 11 | One shake per submit, none while typing | PASS (4/4/4) | |
| 12 | Overshoot ≤ 6% | PASS (tile 1.001, seal 1.02; designed badge pop 1.25 peaks 1.263) | |
| 13 | Close 260 < open 380 | PASS | |
| 14 | Burst seeded | PASS | identical keyframes |
| 15 | CLS ≤ .05, no long task | PASS, marginal: home 0.048 (a load shift at 180 ms on trio); product 0 | probe |

## Alive and premium, or busy and cheap?
Mostly premium: the hero, glint, flight and confirmation feel authored and warm. It tips into busy in checkout (everything rises, eleven fields shake), and two of the spec's best ideas don't actually play: grid choreography and the mobile flight. No jank: 0 long tasks, nothing re-hides.

## Findings filed
S1: F-007, F-008. S2: F-009, F-010, F-011. S3: F-012, F-013, F-014.

## Five tests
- **Flagship:** not yet. The hero and glint are there; the grid and filter aren't.
- **Second-Look:** FAIL. F-009, F-011, F-013.
- **Stranger, Abuse:** PASS.
- **No-Excuses:** PASS at a8af578. The uncommitted fix would break it (F-008).

## Top changes
1. Failsafe only for a dead observer, plus an e2e test that every reveal reaches opacity 1 after scrolling to the end (F-007, F-008).
2. Run FLIP and fade concurrently; distant survivors fade-rise in place (F-009).
3. When the photo is off-screen, fly from the button (F-010).
4. Reserve 4ch for the price and roll the label (F-011).

## Strengths worth keeping
The glint, the settling stones, the seeded quiet burst, and a faithful reduced-motion path.
