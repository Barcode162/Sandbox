# Experience spec — M-0005 Melody's Crystals: motion

## 1. North star
**Everything moves like a stone on a sunny windowsill: it settles once, catches the light when you look, and never makes you wait.**

Fits the as-built site (photo-only gallery, `.wyg`, drawer `.undo-row`, mobile `.trio` strip); existing tokens and `.rise` kept.

## 2. Motion tokens (`:root`, mirrored in `js/motion.js`)
- Durations: `--d-press 90ms` · `--fast 120ms` · `--base 220ms` · `--slow 380ms` · `--d-reveal 520ms` · `--d-glint 600ms` · `--d-flight 600ms` · `--d-shimmer 2400ms` (loop only).
- Easings: `--ease-out cubic-bezier(.2,.7,.2,1)` enters · `--ease-in cubic-bezier(.5,0,.75,0)` exits · `--ease-inout cubic-bezier(.65,0,.35,1)` flights/FLIP · `--ease-spring cubic-bezier(.34,1.4,.5,1)` pops · `--ease-glint cubic-bezier(.4,0,.2,1)`.
- Stagger: `--stagger 60ms`; a batch animates at most 8 items (≤ 420 ms); the rest appear instantly.
- **Rise** = opacity 0→1 + translateY(16px→0), `--d-reveal` `--ease-out` (8px variant for small/inline items).

`js/motion.js` (no deps, < 6 KB): `reveal`, `glint`, `roll` (odometer), `flyToBag`, `shake`, `burst`, `flip`.

## 3. Guardrails
1. **Transform and opacity only.** Colour/border changes may transition ≤ `--fast`. Shadow "lifts" fade a pre-rendered `::before`.
2. **Visible without JS.** Pre-reveal styles apply only under `html.motion-ready`, set after the IntersectionObserver exists. On-screen elements at init get `.is-in` synchronously; a 3 s failsafe and `beforeprint` reveal all.
3. **Once.** Threshold 0.15, rootMargin `0px 0px -8% 0px`, `unobserve` on first hit; nothing re-hides.
4. **No loops** except the hero shimmer (paused off-screen, on `document.hidden`, and under reduced motion).
5. **Never delay a click.** Actions fire on first click; animations `cancel()` on new input.
6. **CLS ≤ 0.05.** Layout is final at first paint; odometers reserve `min-width` in `ch`.
7. **Reduced motion:** per-row fallback below; default is instant or opacity-only at `--fast`. No flight, shake, burst, glint or shimmer.
8. **Coverage test:** every component carries `data-motion="<id>"` (§5); a test asserts each id is present on its page with a non-`none` animation or transition.

## 4. Signature: light catches the crystal
- **Element:** `<span class="glint" aria-hidden="true">` inside each `.frame` (`::after` is the vignette). Absolute, `inset: -10% auto -10% 0; width: 45%`, `pointer-events: none`, `mix-blend-mode: screen`, `opacity: 0`.
- **Gradient:** `linear-gradient(105deg, rgba(255,246,228,0) 0%, rgba(255,246,228,.10) 30%, rgba(255,250,240,.55) 48%, rgba(255,255,255,.75) 50%, rgba(255,250,240,.55) 52%, rgba(255,246,228,.10) 70%, rgba(255,246,228,0) 100%)`. Dark mode peak opacity 0.6.
- **Travel:** `translateX(-120%) skewX(-15deg)` → `translateX(330%) skewX(-15deg)`, 600 ms `--ease-glint`; opacity keyframes 0 / 1 @20% / 1 @70% / 0.
- **Fires:** (a) entrance, once, 200 ms after a frame's reveal ends (trio, cards, gallery main, related, credits); (b) `pointerenter` with `(hover: hover) and (pointer: fine)` or `focus-visible` on the card/row, 1200 ms cooldown; (c) format change, on gallery main, 120 ms after the swap; (d) confirmation seal at 300 ms.
- **Hero shimmer (only loop):** same glint, peak 0.35, 2400 ms `--ease-inout`, across t1 → t2 → t3 at 500 ms offsets; first at 4 s, then every 7 s (start to start). Strip order left→right at ≤ 599 px.
- **Never:** 72 px meaning thumbs, illustrations, reduced motion.

## 5. Component inventory
RM = reduced-motion fallback ("vis" = static).

**Global (all pages)**
| id | Component | Motion | RM |
|---|---|---|---|
| skip | Skip link | focus → translateY(-60→0) `--fast` | instant |
| header | `.site-header` | load → opacity + translateY(-8px) `--base`; `.is-scrolled` → shadow-layer opacity `--base` | opacity |
| nav | `.nav a`, `.footer-nav a` | hover/focus → underline `::after` scaleX 0→1 from left, `--base` | opacity |
| theme | Theme toggle | click → icon rotate(-90°→0) + crossfade, `--base` spring; page via View Transition `--slow` where supported | instant |
| bag | `.bag-btn` | flight lands → icon rotate(-10°→6°→0), 420 ms spring | none |
| badge | `.bag-count` | change → scale 1→1.3→1 `--slow` spring + digit roll | instant |
| menu | `.menu-btn`, `.menu-sheet` | open → sheet opacity + translateY(-8px) `--base`, links stagger 40 ms; close `--fast` in | opacity |
| btn | `.btn` (all) | press → scale(.97) translateY(1px) `--d-press`; release spring `--base`; hover shadow layer | none |
| icon | `.icon-btn`, `.wordmark` | hover scale 1.06 (wordmark translateX 2px) `--fast`; press .94 | none |
| frame | `.mat`/`.frame` | hover → img scale 1.04 `--slow`; glint §4; `.fallback` opacity `--base` | none |
| scrim | `.scrim` | opacity `--base` open / `--fast` close | same |
| drawer | `.drawer` | open translateX(100%→0) `--slow` out; close 260 ms in | opacity |
| line | `.line` | drawer open → rise 8px, stagger 40 ms; `.is-new` → tint layer 1→0 over 1200 ms + translateX(12px→0) | opacity |
| line-remove | Remove | opacity 0 + translateX(24px) `--base` in; rows below FLIP up `--base` | instant |
| undo | `.undo-row` | appear rise 8px `--base`; timeout fade `--fast` | opacity |
| empty | `.empty` | gem scale .8→1 spring + glint; text rise stagger | opacity |
| totals | Line totals, subtotal | change → roll `--base` | instant |
| toast | `.toast`, `.storage-note` | show translateY(20px→0) + opacity `--base`; hide `--fast` | opacity |
| footer | `.site-footer` | reveal → columns rise, stagger | vis |

**Home**
| id | Component | Motion | RM |
|---|---|---|---|
| hero-copy | Eyebrow, rule, h1, promise, CTAs | load → `.rise` at `--i` × 60 ms; rule scaleX 0→1 `--d-reveal` | vis |
| trust | `.trust-row li` | icons scale .6→1 spring, stagger 60 ms after CTAs | vis |
| trio | `.trio .t1–t3` / strip | rise 24px + rotate(0→`--rot`) 600 ms spring, stagger 120 ms; glint; shimmer; hover translateY(-4px) rotate(0) `--slow` | vis, no loop |
| section-head | `.section-head` | reveal → eyebrow, h2, p rise stagger | vis |
| meaning-row | `.meaning-row` | reveal rise stagger; hover chevron translateX(4px), thumb scale 1.06 `--fast` | vis |
| chips | `.chip` | reveal rise 8px stagger 30 ms; press scale .95; pressed `.n` pop 1.15→1 | colour |
| grid-status | `.grid-status` | change → out 80 ms, in translateY(4px) `--base` | instant |
| card | `.card` | reveal rise + scale .98→1 (§6.2); hover `.mat` translateY(-3px), shadow layer, img 1.04, glint, `.view` arrow translateX(3px), tags lift 1px | vis |
| filter | Grid filter | leavers opacity 0 + scale .96 `--fast`; stayers FLIP 320 ms inout; enterers rise 8px stagger 30 ms | instant |
| steps | `.steps li` | reveal rise stagger 100 ms; `.num` rolls 00→0n | vis |
| formats | `.format-card` | reveal rise stagger 80 ms; hover art translateY(-4px) | vis |
| faq | `.faq details` | reveal rise stagger 40 ms; toggle chevron rotate 180° `--base`; answer opacity + translateY(-6px) `--base` | instant |

**Product**
| id | Component | Motion | RM |
|---|---|---|---|
| crumbs | `.crumbs` | load opacity `--base` | vis |
| gallery | `.gallery .main` | load opacity + scale 1.02→1 `--d-reveal`, then glint | vis |
| swap | Main image | change → out opacity + scale .985 (120 ms in), in scale 1.015→1 (220 ms out), glint | crossfade |
| thumbs | `.thumbs button` | load rise 8px stagger 50 ms; hover scale 1.04; current ring-layer opacity | colour |
| buybox | Buy box children | load rise stagger 50 ms from 80 ms | vis |
| price | `.buy-price .price` | change → roll 320 ms out, digits right→left 30 ms apart | instant |
| per | `.per` | out 80 ms, in translateY(4px) `--base` | instant |
| tile | `.tile` | hover body translateY(-2px); select scale .98→1 `--slow` spring; `.check` scale 0→1 + rotate(-20°→0) | colour |
| wyg | `.wyg` | format change → art crossfade + scale .9→1 spring | opacity |
| stepper | `.stepper` | press scale .9; value rolls in the +/− direction `--base` | instant |
| qty-note | `.qty-note` | rise 4px `--base` | opacity |
| add | Add to bag | press; label slides up to "Added ✓" `--base`; flight §6.3; reverts after 1200 ms | text swap |
| buynow | Buy now | press, navigate immediately | none |
| details | `.prose`, `.facts`, `.related` | reveal rise per section; related = card | vis |
| mobile-bar | `.mobile-bar` | translateY(110%→0) `--base`; price rolls | opacity |
| not-found | `.not-found` | gem spring + text rise | vis |

**Checkout and Credits**
| id | Component | Motion | RM |
|---|---|---|---|
| notice | `.notice` | load rise 8px, icon spring | vis |
| co-step | `.co-step` | load rise stagger 80 ms; complete → `.step-num` pop 1.15 spring | vis |
| choice | `.choice` | hover translateY(-1px); checked `.dot::after` scale 0→1 spring, card .985→1 | colour |
| reason | Disabled reason | card opacity → .6, `.reason` rise 4px `--base` | opacity |
| reveal | `.reveal` panels | fields rise 8px stagger 40 ms; later steps FLIP 240 ms inout | instant |
| input | `.input` | focus ring layer opacity + scale .98→1 `--fast` | opacity |
| brand | `.brand-badge` | known → scale .6→1 spring; change crossfade | opacity |
| field-error | `.field-error` | rise 4px 180 ms; input shake once (§6.4) | opacity |
| err-sum | `.error-summary` | opacity + translateY(-8px) `--base`, then focus | instant |
| schedule | `.plan-schedule` | rows rise stagger 60 ms; amounts roll | instant |
| summary | `.sum-rows`, `.summary-toggle` | totals roll; `.free s` strike scaleX 0→1; toggle chevron rotate, panel rise | instant |
| place | `.place`, `.spinner` | press; label crossfade "Placing your order…"; spinner while pending | static |
| confirm | `.confirm` | §6.5 | opacity |
| credits | `.credits-list li`, head | head rise stagger; rows rise stagger 40 ms; thumb hover scale 1.06 + glint | vis |

## 6. Frame tables
### 6.1 Home load (1440×900; strip at 375)
| t ms | On screen | Why |
|---|---|---|
| 0–220 | Header fades down 8px; eyebrow rises; brass rule draws left→right. | Brand first. |
| 60–600 | H1, promise, CTAs, trust rise at 60 ms steps; trust icons pop 360–480. | Motion order = reading order. |
| 120–840 | t1 rises 24px, turns 0→−2°; t2 (+120 ms) to +1.5°; t3 (+240). ~3% overshoot. | Stones set down. |
| 900/1020/1140 | Glint crosses t1, t2, t3. | Signature seen with no input. |
| 1400 | Still; clickable throughout. | Settles once. |
| 4000, then every 7 s | 35% shimmer sweeps t1→t3 over 2400 ms. | Breathes; never flickers. |

### 6.2 Into the shop grid (4 cols at 1440, 2 at 375)
Delay = `(row × cols + col) × 60ms` within the intersecting batch, max 8.
| Moment | On screen | Why |
|---|---|---|
| Head at 85% | Eyebrow, h2, lede rise; chips follow at 30 ms. | Title before choices. |
| Row 1 enters | 4 cards rise + scale .98→1 at 0/60/120/180; each glints 200 ms after landing. | A ripple of light along the row. |
| Flick scroll | Batches within 100 ms merge; beyond 8 appear at once. | Never lags. |
| Chip "Sleep" | 9 cards fade/scale .96 in 120 ms; 3 FLIP to slots 1–3 in 320 ms; status rolls "3 crystals for Sleep". | One continuous rearrangement. |

### 6.3 Pick Jar, then Add to bag
| t ms | On screen | Why |
|---|---|---|
| 0 (Jar) | Jar tile springs .98→1, check rotates in; old check fades 120 ms. | Instant ownership. |
| 0–320 | Price rolls 16→95 (rightmost digit first); per-piece crossfades; button rolls "Add to bag · $95". Image crossfades to jar; `.wyg` pops. | Every number moves together. |
| 340 | Glint across the main image. | The jar catches light. |
| t0 (Add) | Button presses; "Added ✓" slides up; a 72px radius-14 clone of the main image lifts. | It's yours. |
| t0–600 | Clone arcs to `.bag-btn`: x linear, y midpoint keyframe 80px above the chord; scale 1→.28; rotate 0→−12°; opacity 1 → 0 over the last 15%; `--ease-inout`; z-index 70. No visible target → no flight. | Shows where it went. |
| t0+450 | Drawer slides in, overlapping the landing; new line tints and slides 12px. | Feedback never blocks. |
| t0+600 | Bag icon wiggles; badge bumps and rolls 0→1. | Cause → effect. |

### 6.4 Checkout: step reveal and errors
| Moment | On screen | Why |
|---|---|---|
| Shipping chosen | Dot springs; address fields rise at 40 ms; steps 3–4 FLIP down 240 ms; Pay in person dims to .6, reason rises. | Layout change narrated, not jumped. |
| Over time | Schedule rows rise at 60 ms; "Due today" rolls 112.00→28.00. | Math animates into place. |
| Card digit 1–2 | Brand badge pops. | Recognition. |
| Blur bad expiry | Message rises 4px/180 ms; input shakes once: translateX 0,−6,6,−4,4,−2,0 px over 320 ms; border `--err` at `--fast`. | One clear "no". |
| Submit, 2 errors | Summary drops 8px/220 ms, takes focus; invalid fields shake top→bottom at 60 ms; re-shake only on next submit. | Find, then fix. |

### 6.5 Confirmation burst (seeded by order number)
| t ms | On screen | Why |
|---|---|---|
| 0 | Form fades 120 ms; seal scales .6→1.06→1 spring; check pops at +120. | Sealed. |
| 120–720 | 14 four-point star shards (8–14px SVG; brass, clay, moss, warm white) from seal centre: angle i×360/14 ±8° (seeded), distance 56–120px, scale 0→1→.4, rotate 90–180°, opacity 1 by 20% → 0; 600 ms `--ease-out`, 8 ms stagger; removed after. | Quiet sparkle, not confetti. |
| 300 | Glint across the seal. | Signature closes the story. |
| 200–700 | H1, order number (letters at 25 ms), recap, sign-off rise at 60 ms. | Reading order. |
| 900 | Still; badge rolls to 0. | Ends at rest. |

## 7. Motion polish list
1. JS off: screenshots equal the settled state.
2. Failsafe reveals all within 3 s if the observer never fires.
3. Scrolling up never re-hides or replays a reveal.
4. No glint on 72px thumbs or under reduced motion.
5. Hover glint cooldown 1200 ms; sweeping the grid never strobes.
6. Shimmer paused off-screen/hidden tab (`document.getAnimations()` empty).
7. Odometer reserves width: $16→$150 causes no shift.
8. Price, per-piece and label start moving in the click's frame.
9. Flight clone keeps radius 14 and stays above the drawer.
10. A second Add click cancels the first flight; badge total stays right.
11. Shake once per error per submit; never while typing.
12. Spring overshoot ≤ 6% scale.
13. Drawer closes (260 ms) faster than it opens (380 ms).
14. Burst identical for the same order number.
15. Home and product: CLS ≤ 0.05, no motion long task > 50 ms (measured).

## 8. Acceptance by eye
375×812 and 1440×900, light/dark: hero at 0/400/1100 ms and settled; grid row 1 at 120 ms; filter mid-FLIP; Jar at 160 ms; flight at 300 ms; shake at 160 ms; confirmation at 400 ms and settled; repeat with reduced motion.
