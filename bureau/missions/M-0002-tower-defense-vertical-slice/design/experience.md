# Experience spec — M-0002 · *Inkfold*

Direction: the brief's working theme, refined (no bake-off). Units: logical px on the 1280×720 canvas, seconds of **sim time at 1×**, sheets (money), seeds (lives). All numbers are contract values (L-0004); balance knobs are named in §8.

## 1 · North star
**A cut-paper garden on cream washi, held by folded paper creatures against ink blots that peel colour by colour: pause on any frame, even at 300 blots, and you can count every blot's remaining layers by its shape and see which defender just tore one off.**

## 2 · Reference points (craft, never content)
|Reference|Craft we take|
|---|---|
|*Tearaway*|Paper as material: 1-px crease highlights, hard offset shadows, torn panel edges.|
|*Kingdom Rush*|One chunky silhouette per tower; every upgrade changes the sprite; build feedback < 250 ms.|
|*Mini Metro*|A calm low-saturation field so threat colours own the eye; UI never covers the action.|
|*Ōkami*|Sumi splatter shapes: lobed blots and radial flecks as the pop vocabulary.|
|*Vampire Survivors*|Swarm readability: flat shapes, capped particles, one guaranteed cheap signal per hit (our ring).|

## 3 · Loops and moments
- **Core loop (1–3 s):** a blot enters range, a defender turns and fires, a layer tears off with ring + pip + note, the child keeps walking a step faster, and the sheets counter ticks.
- **Session loop (40–90 s):** the round plays, the shop is instant (buy or upgrade during rounds too), then a choice: which path to fold.
- **Progression (20 rounds, ~25 min at 1×):** one new blot kind every 1–3 rounds forces a counter (§8), the R18 storm, the R20 Inkmaw.

**First 10 seconds.** 0–0.4 s the live garden fades in (attract mode); 0.2–0.8 s "Inkfold" folds down letter by letter; by 1.5 s a Blotch behind the title is peeled vermilion→saffron→teal→indigo→black→gone, each tear a note. 3 s: **Play** (click 1); the wash slides off and Round 1 waits with a pulsing star on the best spot. 5 s: Tern card (2); ghost, ring, glowing path edges. 7 s: the star (3); the Tern unfolds, "−200" peels off the pill. 9 s: "Space — let the ink in."

**Hook (R3–6).** The first Drop peels *into* a Dot on the spot, indigo to black; R5's Splat proves layers stack; by R6 the player plans an upgrade.

**Peak (R18 "The Storm").** ~300 blots on screen, a torrent stepping down through the colours as it crosses the kill-pocket; the crackle swells, sheets climb by hundreds.

**Ending.** The Inkmaw tears at 75/50/25 % and bursts into four Knots; last Knot gone, paper cranes rise: "The garden holds." A loss floods the jar with ink; retry is one key, < 2 s.

## 4 · Look
**Palette (tokens).** Field: `--paper #F3EAD7` · `--paper-shade #E6D9BE` · `--paper-deep #CDBB98` · `--fold-white #FBF7EE` · `--crease #C9B48C` · `--kraft #D6BF94` (path) · `--kraft-edge #A88C5E` · `--moss #9DB27F` · `--moss-deep #627F57` · `--water #A7CBCF` · `--water-deep #6E9EA8`. UI: `--ink #1C1A24` (text) · `--ink-soft #4A4558` · `--gold #C9962A` (sheets) · `--seed #6F9A4B` (lives) · `--ok #3E8E6A` · `--bad #C23B3B` · `--glow #FFD66B` · `--shadow rgba(28,26,36,.22)`. Blot inks: `--l1 #2A2D38` Dot · `--l2 #2F4FA8` Drop · `--l3 #14907F` Splat · `--l4 #E2A41C` Splash · `--l5 #D9442F` Blotch · `--streak #B23A8E` · `--wax #5B3A73` with `--wax-gloss #CDB6E0` · `--knot #15131B` with `--thread #F3EAD7` · `--maw #D9442F`. **Rule:** the field uses only paper, moss, water and kraft tokens at ≤ 45 % saturation, so saturated colour means blots or UI state.

**Type.** Display: `Georgia, "Iowan Old Style", serif`, italic 400, for the title (88), screen headers (44) and banners (28). UI: `system-ui, "Segoe UI", sans-serif` 600 at 12/14/16/20. Numbers are drawn per digit on a fixed 0.62 em advance so counters never jitter. Line height 1.25. Text is always `--ink` on paper, or `--fold-white` on ink plates.

**Spacing.** 4-px base: 4/8/12/16/24/32/48. Panel radius 6; pills radius 20; button radius 8.

**Light and mood.** Late-afternoon sun from the top-left. Every object casts a hard shadow `--shadow` offset (+3,+4) with no blur, drawn as a duplicate shape (cheap and crisp). Corner vignette: radial `--ink` at 0 % → 10 % beyond 70 % of the half-diagonal. Paper grain: a 128×128 seeded noise tile rendered once offscreen and drawn over the whole field at 6 % alpha, multiply.

**Composition.** Field x 0–1080, sidebar 1080–1280, top 64 px HUD-only. Only the boss bar and banners overlay the field. The kill-pocket (lower-left loop) is the centre of mass; decor clusters elsewhere.

**Motion.** micro 90 ms · UI 160 · fold 220 · scene 400. Easing: `outCubic` entries, `inQuad` exits, `backOut` (s 1.70158) placements/pops, `inOutSine` ambient. Panels **fold**: scaleX 0→1 from the hinge with a crease highlight band. Only projectiles and blots move linearly.

**World density** (render-only RNG, seed 7): 140 grass tufts (3 strokes 6–10 px `--moss-deep`); 22 five-petal paper flowers r 5; paper maple at (90,580), 9 leaf triangles, sway ±2°/4 s; pond ellipse 128×104 at (340,260), ripple every 3 s (r 8→40, 1.4 s), 2 lily pads; 6 drifting petals (12 px/s); 2 rocks; overturned inkwell at (40,200) with spill pool; Seed Jar at (960,612), seed fill = lives %.

## 5 · The map — "Spill Garden"
**Path polyline** (centreline; blots spawn at distance 0, off-screen): (−40,200) → (150,200) → (230,120) → (400,120) → (460,180) → (460,400) → (280,400) → (220,460) → (220,600) → (560,600) → (640,520) → (640,300) → (760,180) → (900,180) → (960,240) → (960,560). Length **2570.5 px**. Reaching distance 2570.5 = leak.
**Render:** `--kraft` ribbon 44 wide, `lineJoin round`; 2-px `--kraft-edge` borders; a centre stitch dashed 6/8 in `--kraft-edge` at 50 %. The narrowest gap between ribbons is 40 px (centrelines 84.9 apart).
**Placement is valid iff** (tower footprint radius `fr`: Tern 16, Owl 16, Koi 18, Frog 20):
1. distance to the path centreline ≥ 22 + fr;
2. inside x ∈ [fr, 1080−fr], y ∈ [64+fr, 720−fr];
3. distance to every other tower ≥ fr₁ + fr₂;
4. outside every no-build circle: **pond** (340,260) r 64 · **inkwell** (40,200) r 56 · **Seed Jar** (960,612) r 46 · **rock A** (560,430) r 28 · **rock B** (800,480) r 32 · **maple** (90,580) r 44.
About 70 % of the field is buildable. Best pockets: (350,520) covers 648 px of path at r 150; (280,554) best Koi spot; (860,360) best Owl spot.

## 6 · Blots
|Kind|Shape (colourblind signal)|R px|Speed px/s|HP|Children (on pop)|Sheets on pop|Lives cost (= RBE)|First round|
|---|---|---|---|---|---|---|---|---|
|Dot|smooth disc, 1 pip|9|80|1|—|1|1|R1|
|Drop|3 lobes, 2 pips|10|104|1|Dot|1|2|R3|
|Splat|4 lobes, 3 pips|11|128|1|Drop|1|3|R5|
|Splash|5 lobes, 4 pips|12|176|1|Splat|1|4|R8|
|Blotch|6 lobes, 5 pips|13|208|1|Splash|1|5|R11|
|Streak (fast)|comet: ellipse 1.8:1 along travel + 3 tail strokes|11|272|1|2× Splat|1|7|R9|
|Wax (armoured)|hexagon + stamped ring, gloss arc; **immune to Cut and Wash**|14|88|1|2× Splash|1|9|R10|
|Knot (tough)|scribble ball of `--thread` loops; loops = ⌈hp/3⌉|17|72|12|2× Wax|1 per HP (12)|30|R15|
|Inkmaw (boss)|8-lobe mass, jagged paper-coloured maw, drips|46|32|2400|4× Knot; sheds 6× Splash at 75/50/25 %|0|all (run ends)|R20|

**Pale** (camo) is a modifier on Drop–Blotch and Streak (written `p·kind`): fill at 40 % alpha, outline dashed 3/3 px, a diagonal hatch (45°, 4 px spacing) inside. Children inherit Pale. Only towers with **detection** may target a Pale blot, and their projectiles are the only ones that collide with it. **Area effects** (Koi pulse and Typhoon jets, Frog splash) hit Pale regardless.

**Lobed shape:** radius(θ) = R·(1 + 0.14·sin(nθ + φ)), n = lobe count; φ advances 1.2 rad/s (render-only). Pips = layers remaining (Dot 1 … Blotch 5), `--paper` dots r 1.6 in a ring of radius 0.45R (1 pip at the centre), 35 % alpha by default and 100 % with a 1-px `--ink` outline in colourblind mode.

**Peel rules (sim contract).**
1. A hit deals `d` (after immunity and multipliers). If `d < hp`, then hp −= d. Otherwise the blot pops: overflow `o = d − hp` is applied to **child 0 only**, recursively (a lance hit of 6 on a Splat strips all 3 layers and the overflow is lost when the chain ends). Other children spawn at full HP.
2. Children spawn at the parent's path distance `s`; child k sits at `s − 6k` (clamped ≥ 0), with the same Pale flag and slow state (remaining time) as the parent and `immuneTo = the popping projectile/pulse id`.
3. Immune hit: no damage, the projectile still spends 1 pierce, a "tink" sounds and 3 `--fold-white` sparks fly.
4. Lives cost on leak = the blot's remaining RBE (current hp + children's RBE). Inkmaw leak = game over.
5. Inkmaw is immune to stun and freeze; any slow on it is capped at 20 %.

## 7 · Towers (origami defenders)
Cooldown starts at 0 (the first shot is immediate). A tower fires when the cooldown ≤ 0 and a valid target is in range. Range is measured centre to blot centre minus blot R.

|Tower · key|Silhouette (top-down, paper on a disc coaster r fr+4 `--paper-deep`)|Cost|Range|Interval s|Dmg|Pierce|Type|Detect|Attack|
|---|---|---|---|---|---|---|---|---|---|
|**Tern** · 1|`--fold-white` kite body 14×22 + 2 swept wing triangles, span 40; turns to target at 720°/s|200|150|0.95|1|2|Cut|no|straight **quill** (triangle 10×3, 720 px/s, lives until it travels range×1.3)|
|**Pondfrog** · 2|`--moss` squat pentagon 30×26, 2 folded hind legs, eyes 2 discs r 4|500|165|1.40|1|— (splash r 40, ≤ 14 blots)|Crush|no|lobbed **stone** r 6; arc time 0.45 s; lands where the target will be in 0.45 s at its current speed|
|**Mist Koi** · 3|white koi windsock 46×20 with `#E06A3B` patches, 3 scale arcs, on a `--water` puddle r 22; sways ±6° over 2 s|300|85 (pulse)|1.20|1|≤ 8 blots per pulse, First order|Wash|area|**pulse**: ring r 0→85 over 180 ms; hits instantly at fire time; fires only if a blot is within 85|
|**Lantern Owl** · 4|`#A47A4F` kraft block 30×34, 2 ear-tuft triangles, eye discs r 6 `--glow` tracking the target|350|260|1.60|2|1|Glare|**yes**|hitscan **glare beam**, 2 px `--glow`, 90 ms fade|

**Damage types:** Cut, Crush, Wash, Glare. Wax ignores Cut and Wash.
**Crosspath rule:** path tiers (a,b) are valid iff max(a,b) ≤ 3 and min(a,b) ≤ 1. Once either path reaches tier 2, the other path is sealed above tier 1. Effects are cumulative within and across paths, applied in the order A1,A2,A3,B1,B2,B3; "set" overrides and "+" adds.

**Tern**
|Tier|Name · cost|Exact change|Visual change|
|---|---|---|---|
|A1|Sharp Crease · 150|pierce +2|`--l5` crease stripe on both wingtips|
|A2|Twin Quill · 280|2 quills per shot, ±6°|a second smaller wing pair behind the first|
|A3|Gale Tern · 950|3 quills per shot at −10°/0/+10°; interval set 0.50; pierce +1|body `#DCE8F0`; forked tail with 3 ribbon streamers (12 px, flutter 6 Hz)|
|B1|Long Sight · 120|range +45; quill speed set 900|beak +8 px|
|B2|Keel Quill · 360|dmg +1; type set Crush|3-triangle head crest; quills drawn `--ink`, 12×5|
|B3|Harpoon Heron · 1150|**lance**: dmg set 6, pierce +1, interval set 1.10, range +35, ×3 dmg vs Wax and Knot|re-silhouettes to a heron: `#B9C6CF`, neck +14 px, 2 leg strokes; lance 18×4 with a `--l5` tassel|

**Pondfrog**
|Tier|Name · cost|Exact change|Visual change|
|---|---|---|---|
|A1|Wide Ripple · 250|splash r +16; max blots +10|throat sac disc r 6; stone r 8|
|A2|Heavy Stone · 450|dmg +1|3 `--moss-deep` back spots; stones `--ink-soft`|
|A3|Boulder Toad · 1400|dmg set 4; splash r set 72; max set 40; hits stun 0.30 s (not Knot or Inkmaw)|re-silhouettes to a toad 38×30 `#7A7A3E` with 9 wart dots; boulder r 12; a crack decal ring on landing (400 ms)|
|B1|Quick Tongue · 200|interval set 1.05|`--l5` tongue flick 10 px for 80 ms on each shot|
|B2|Skip Stone · 480|after landing, the stone skips 70 px along the path's travel direction at that point and splashes again (r 32, ≤ 10)|flat ellipse stones; a ripple ring on each landing|
|B3|Bullfrog Barrage · 1250|interval set 0.55; 2 skips; first splash ≤ 20|3 dark chevrons down the back; throat inflates 1.3× on each shot (120 ms)|

**Mist Koi** (no targeting mode). Slows never stack: the strongest wins and its duration refreshes.
|Tier|Name · cost|Exact change|Visual change|
|---|---|---|---|
|A1|Cold Spring · 160|pulse slows 40 % for 1.0 s|fins `--water`; pulse ring dashed 4/4|
|A2|Deep Chill · 360|slow set 60 % for 1.5 s; pulse r +20|6 ice-crystal ticks around the puddle|
|A3|Glacier Carp · 1000|every 3rd pulse freezes (speed 0) for 1.2 s; frozen blots take +1 from Crush; Wax, Knot and Inkmaw are slowed instead of frozen|koi `#E6F2F5`, faceted crystal fins; a frost hexagon r 105 on the ground at 20 %|
|B1|Swift Tail · 180|interval set 0.85|tail fin doubled, faster sway (±6° over 1 s)|
|B2|Monsoon · 450|dmg +1; max blots +12|a 3-circle paper cloud above it with 4 falling streaks|
|B3|Typhoon Koi · 1250|pulse replaced by 8 radial **jets** every 0.30 s, rotating 11.25° per volley; each jet: dmg as tower, pierce 3, range 150, 500 px/s, area-class (hits Pale); jets carry any A1 slow|re-silhouettes to a dragon-carp ×1.25, `#E0B04A` scales, 2 long whisker curves, a spinning ring of 8 droplets|

**Lantern Owl**
|Tier|Name · cost|Exact change|Visual change|
|---|---|---|---|
|A1|Keen Glare · 250|dmg +2|amber `#E08A1E` eye rings|
|A2|Piercing Beam · 500|beam pierces 3 blots on the line to max range; range +60|ear tufts +6 px; beam 4 px|
|A3|Eclipse Owl · 1500|dmg set 18; interval set 1.20; range set 400; ×2 dmg vs Knot and Inkmaw|re-silhouettes to a horned owl `#3A3560`, gold eyes, crescent monocle; beam leaves a 200 ms afterimage|
|B1|Paper Lamp · 200|all towers within 170 px gain detection|a lantern hangs from the beak; a `--glow` disc r 170 at 6 %|
|B2|Warm Light · 420|towers within 170 (self included) get interval ×0.85|larger lantern with 2 tassels|
|B3|Beacon Owl · 1200|aura set ×0.75 interval and +1 dmg per hit; Pale blots entering r 170 lose Pale permanently (children too)|a tall floating lantern above the owl with 8 rays rotating 6°/s|
Owl auras from several owls do not stack: take the best.

**Targeting** (Tern, Frog, Owl; key T cycles, default First): **First** = greatest path distance · **Last** = least · **Strong** = highest remaining RBE, ties → First · **Close** = least Euclidean distance, ties → First. Stable tie-break: lower blot id.
**Tower markers:** under each coaster, tier notches: path A on the left arc, B on the right; filled `--ink` up to 3 each.

## 8 · Economy, waves, difficulty
**Economy.** Start **650 sheets, 100 seeds**. Pop: 1 sheet per HP removed (Inkmaw's own HP pays 0). End-of-round bonus **100 + 10·r**, paid when the round clears. Sell **70 %** of everything spent on the tower; **100 %** if the tower was placed during the current intermission ("fresh fold"). Buying and upgrading are allowed mid-round.
**Spawning.** Group = (kind, count, spacing s, delay s from round start); spawns at path distance 0. A round ends when every group has spawned and no blot is alive. Auto-start (setting) starts the next round 1.5 s after the bonus.

|R|Groups (kind×count @spacing +delay)|RBE|Cash at start*|New / what it asks|
|---|---|---|---|---|
|1|Dot×20 @0.8 +0|20|650|place one Tern|
|2|Dot×30 @0.6 +0|30|780|a second tower|
|3|Dot×20 @0.5 +0 · Drop×10 @0.9 +4|40|930|**Drop**: see the peel|
|4|Drop×25 @0.6 +0 · Dot×15 @0.4 +6|65|1100|density|
|5|Drop×30 @0.45 +0 · Splat×6 @1.2 +8|78|1305|**Splat**: stacking layers|
|6|Splat×16 @0.7 +0 · Drop×24 @0.4 +3|96|1533|first upgrade|
|7|Splat×20 @0.6 +0 · p·Drop×8 @1.0 +6|76|1789|**Pale**: Koi or Owl|
|8|Splash×10 @0.9 +0 · Splat×24 @0.4 +4|112|2035|**Splash**: speed|
|9|Streak×6 @1.5 +0 · Splash×16 @0.6 +5|106|2327|**Streak**: range and pierce|
|10|Wax×4 @2.0 +0 · Splat×30 @0.3 +2 · Drop×40 @0.2 +8|206|2623|**Wax**: Crush or Glare|
|11|Blotch×12 @0.8 +0 · p·Splat×12 @0.6 +6|96|3029|**Blotch**; breather|
|12|Wax×8 @1.2 +0 · Splash×28 @0.35 +3|184|3335|Wax in numbers|
|13|Streak×14 @0.7 +0 · Blotch×22 @0.45 +4|208|3739|commit to a tier 3|
|14|p·Splash×20 @0.5 +0 · Wax×10 @1.0 +5 · Dot×60 @0.08 +10|230|4177|mixed answers|
|15|Knot×2 @3.0 +0 · Blotch×30 @0.3 +3|210|4647|**Knot**: sustained damage|
|16|p·Blotch×20 @0.4 +0 · Wax×14 @0.7 +4 · Streak×12 @0.5 +10|310|5107|detection coverage|
|17|Knot×5 @2.0 +0 · Splash×60 @0.15 +2|390|5677|AoE + single-target|
|18|Blotch×150 @0.07 +0 · Dot×120 @0.05 +2 · Wax×20 @0.5 +4 · p·Streak×12 @0.6 +8|1134|6337|**The Storm** (~300 on screen)|
|19|Knot×10 @1.2 +0 · p·Blotch×40 @0.2 +3 · Streak×24 @0.3 +8|668|7751|aftershock|
|20|Blotch×60 @0.15 +0 · Knot×6 @1.5 +6 · **Inkmaw**×1 +14|300 + 180 + boss|8709|**Inkmaw**: boss damage|
\*Cumulative sheets available with zero leaks.

**Curve rationale.** RBE roughly doubles every 5 rounds (20→78→210→3,000+) while income grows linearly through the bonus. Each new kind breaks one naive build: Pale breaks Tern-only (R7), Wax breaks Cut and Wash (R10), Knot breaks low rate of fire (R15), the Storm breaks single target (R18), Inkmaw breaks AoE-only (R20). R11 and R19 are lighter beats after spikes. Inkmaw at 2,400 HP walks 80 s; an Eclipse Owl does 30 DPS to it, so it is beatable only with a boss answer (Eclipse or Harpoon) plus support.
**Reference win script** (the bot's; positions are verified valid): R1 Tern@(340,510), Tern@(560,300) · R2 T1 A1 · R4 Koi@(280,554) · R6 Owl@(860,360) · R8 T1 A2 · R10 Frog@(760,300) · R12 Frog A1 · R13 T2 A1 · R14 T1 A3 · R15 Koi B1, Owl A1 · R16 Frog A2 · R17 Koi B2, Owl A2 · R18 T2 B1 · R19 Frog A3 · R20 Owl A3, Koi A1. Spend 8,340 vs 8,709 available. Target: win with ≥ 40 seeds. **Loss script:** the same two Terns, never upgraded → game over by R12.
**Tuning knobs, in order** (if the bot misses its target): Inkmaw HP ±400 → R16–19 counts ±20 % → end bonus slope (10·r) ±2. Never touch the tower tables first.

## 9 · HUD layout
|Element|Rect (x,y,w,h)|Content and behaviour|
|---|---|---|
|Seeds pill|16,12,132,40|seed-sprig icon + count, `--seed` icon; drops flash `--bad` 160 ms and shake 3 px|
|Sheets pill|156,12,164,40|folded-corner sheet icon `--gold` + count; ticks toward the target at max(30, Δ·8)/s|
|Round pill|328,12,152,40|"Round 7 / 20"; during intermission "Round 7 — ready"|
|Banner|field centre x 540, y 96|28-px serif on an ink plate, 2.2 s (in 160, out 220)|
|Boss bar|340,72,400,18|Inkmaw only: name above (16 px), 3 notches|
|Pause button|1020,12,44,40|two paper bars|
|Sidebar|1080,0,200,720|`--paper-shade`, left torn edge (zig 3 px, seeded)|
|Satchel cards|1092/1184, 56/180, 88×112 each|icon 48, name 14, cost 16, hotkey badge 20×20 top-left; unaffordable: 45 % opacity, cost `--bad`, no hover lift|
|Fold card (selected tower)|1080,0,200,600|replaces the Satchel (fold 220 ms), see §10.4|
|Auto-start toggle|1096,604,168,28|checkbox + "Auto-start" 14 px|
|Go button|1096,640,168,64|states: "▶ Start" (`--ok` plate, pulse 1.0↔1.04 over 1.2 s when idle >4 s), "▶ 1×", "▶▶ 2×"|

## 10 · Frame tables
### 10.1 Title
**Elements.** The live map in attract mode (own seed 11; Tern 2/0 at (340,510), Frog at (760,300), Koi at (280,554), Owl at (860,360) against a looping R6) with no HUD or sidebar (field stretched to 1280: the sidebar rect shows the maple-side meadow). Left wash: `--paper` linear gradient at 92 % for x 0–520 → 0 % at 760. Title "Inkfold" 88-px serif italic, baseline (64,250); subtitle "a paper garden · a spill of ink" 20 px `--ink-soft` at (68,288). Buttons: **Play** (64,330,240,56) `--ink` plate with `--fold-white` 20-px text; **Settings** (64,398,240,44) outline. Footer (64,690) 12 px: "Enter play · S settings · M mute".
**Parameters.** Letter i folds in at t = 200 + 40i ms over 320 ms (scaleY 0→1, backOut). Map alpha = r(t,0,400).
|Moment|What is on screen|Why it is composed|
|---|---|---|
|t 0|cream grain sheet, vignette, nothing else|a blank page is finished art; nothing pops in raw|
|t 800 ms|title complete; the garden live behind the wash; a Blotch crossing the top path at x 230–400 under the title|the threat and the answer appear in the first second, with no tutorial|
|Idle 5 s|a Blotch peels down 5 colours inside the kill-pocket, right of the buttons|the left third holds type, the right two-thirds play: thirds rule|
|Play pressed (400 ms)|the wash slides left (inQuad), attract towers fold to 0 (160 ms, 40 ms stagger), the HUD slides in from the top (outCubic)|one continuous paper motion; the same map, so no load beat|

### 10.2 First placement (≤ 3 clicks)
**Elements.** Intermission R1. A paper star (5 points, r 14, `--glow` stroke) at (340,510) pulsing scale 1↔1.12 over 1.2 s, shown only until the first tower exists. The Tern card glows (`--glow` outline 2 px, alpha 0.4↔1). Banner line: "Pick a defender — click the Tern or press 1."
**Ghost.** Drawn at the pointer every render frame (0 lag); tower at 70 % alpha; range disc `--ok` 10 % fill with a dashed 6/6 2-px stroke. Invalid: disc and stroke `--bad`, an ✕ glyph (2 strokes, 14 px) over the footprint, and the ghost nudges 2 px left-right once (90 ms) on entering invalid. While placing, the path edges brighten to `--glow` 40 % and no-build circles show a 45° hatch at 30 %.
|Moment|What is on screen|Why it is composed|
|---|---|---|
|Board shown|full garden, star in the kill-pocket, Tern card glowing, Go button dim|two glowing things, read left to right: card then star|
|Tern selected (click 2)|ghost under the cursor, ring green on grass, red ✕ over the path; banner "Green ring is a good spot."|validity is visible before the click, in shape as well as colour|
|Hover over the star|ring covers both lower loops; the star brightens|the best spot is shown rather than explained|
|Placed (click 3)|Tern scales 0.6→1.08→1 (220 ms backOut), 8 paper flecks, crinkle; "−200" peels up from the Sheets pill; star gone; the Go button starts pulsing; banner "Space — let the ink in."|cause→effect across the screen ties the pill to the act|

### 10.3 Round 1 in motion
|Moment|What is on screen|Why it is composed|
|---|---|---|
|Round start|clack SFX, banner "Round 1", ink wells up in the inkwell (spill pool pulses 1.0→1.15), first Dot slides out at x 0|the source is staged, so the player looks left|
|First hit|Tern snaps to face the Dot (720°/s), quill streaks, pop: ring R→1.8R over 160 ms in `--l1`, 6 flecks, note; "+1" ticks on the pill|one hit has 4 responses: turn, flight, ring, money|
|Clear|chime, banner "Round 1 clear · +110", the "+110" flies to the Sheets pill (500 ms outCubic), the Go button returns to "▶ Start"|reward is explicit and lands where it is spent|

### 10.4 Upgrade panel open
**Layout (sidebar).** Name 20 px at (1092,16); close ✕ (1244,12,24,24). Portrait 72×72 at (1092,44) showing the current sprite. Stats at (1172,48), 12 px, 4 lines: Dmg · Rate (shots/s) · Range · Type icon (Cut blade / Crush stone / Wash drop / Glare eye). Targeting selector (1092,128,176,32): "◀ First ▶" (the Koi shows "Pulses hit all in reach"). Path columns: A at x 1092 and B at x 1184, each 88 wide; tier boxes 88×108 at y 168, 284, 400. Each box: name 12 px, cost 16 px, one effect line 12 px. States: **owned** (`--ink` plate, ✓, text `--fold-white`); **next** (`--glow` 2-px border, hover shows the change on the field ghost); **unaffordable** (cost `--bad`, 60 % opacity, "need 120 more"); **sealed** (diagonal "SEALED" stamp `--bad` 40 %, a lock glyph; hover: "The other fold went deep."). Sell (1092,520,176,32): "Sell · 336" (fresh fold: "Refund · 200"). Footer tally (1092,560) 12 px: "Pops 1,204 · Spent 480". Field: selected tower range ring solid 2-px `--ink` 50 % + fill 8 %; Owl auras shown as a second dashed ring.
|Moment|What is on screen|Why it is composed|
|---|---|---|
|Click a tower|sidebar folds (220 ms) from Satchel to Fold card; range ring blooms (r 0→R, 160 ms outCubic)|selection and the panel are one gesture|
|Hover next tier|on the field, a ghost of the upgraded sprite at 50 % over the tower and the new range ring dashed|preview the change, not a paragraph about it|
|Buy|box flips to owned (160 ms), sprite morphs (old scales to 0.8 and fades as new backOuts in, 220 ms), 12 flecks in the path colour (A `--gold`, B `--water-deep`), arpeggio|every tier is a visible event|
|Tier 2 bought on A|path B boxes 2–3 stamp SEALED (90 ms thunk)|the crosspath rule taught at the moment it matters|
|Sell|tower unfolds flat and slides into the ground (220 ms), "+336" floats up, rip SFX|undoing is as legible as doing|

### 10.5 Round 15+ storm (R18 at t 6–14 s)
**Readability.** Draw order: path → decals → blots (largest R first) → projectiles → towers → particles → rings → text → HUD. **Pop rings are never culled.** Flecks: 6 per pop below 200 live particles, 2 per pop to 600, 0 above 600 (hard cap 600). Pop SFX: 6 voices per 50 ms window; extra pops feed a crackle bed (§12).
|Moment|What is on screen|Why it is composed|
|---|---|---|
|t 6 s|a solid vermilion torrent fills the top path and loop 1; the Dot swarm threads between; the Wax hexagons stand out in plum|density is pattern, not noise: one colour per stretch|
|Kill-pocket|the stream changes colour as it crosses (vermilion → saffron → teal → indigo → black → gone) over about 300 px of path; rings flicker in every hue|the peel made spatial: a rainbow gradient you can read as progress|
|Typhoon / Gale firing|8-jet rosettes and 3-quill fans cutting the stream|signature attacks distinguishable at a glance|
|Leak (if any)|blots reach the jar; seed count drops with a `--bad` flash; shake 4 px|failure always shows where it happened|
|Storm end|the last children scatter; "Round 18 clear · +280"; sheets 1,000+ climbing|relief beat before the boss|

### 10.6 Boss arrival and death (R20)
|Moment|What is on screen|Why it is composed|
|---|---|---|
|t 12 s|inkwell spill pool darkens to `--knot` and grows to 1.4× over 2 s; banner "Something large is spilling."; music ducks −6 dB; low drone opens|the warning comes before the threat|
|t 14 s|Inkmaw (r 46) heaves out; boss bar folds down (220 ms) "INKMAW 2400"; 2-px rumble shake for 1.2 s; thud every 1.2 s with a 2-px shake|scale against 13-px blots says boss without words|
|75 / 50 / 25 %|hit-stop 4 ticks; shake 6 px 250 ms; 6 Splash spray out behind it; a bar notch tears off and falls (400 ms)|three escalating beats, each a reason to look up|
|Below 10 %|bar pulses `--bad`; maw widens 1.2×|the finish is anticipated|
|Death|hit-stop 12 ticks; shake 12 px decaying over 600 ms; 80 flecks + 3 staggered rings (0/60/120 ms); splits into 4 Knots; bar tears in two and drops; banner "The Inkmaw tears!"|the peak gets the only big hit-stop in the game|

### 10.7 Pause
Esc, P or the pause button; available anywhere, including during transitions and placing (placing is cancelled). The sim stops. The field dims (`--ink` 45 %), music lowpasses to 800 Hz and drops −6 dB. Centre card 420×340 at (430,190) (the field centre), torn-edge paper: "Paused" 44 px; buttons 280×44 stacked from y 280 at 56-px pitch: **Resume** (Esc), **Restart** (R; first press shows "Press again to restart" for 2 s), **Settings**, **Quit to title**.
|Moment|What is on screen|Why it is composed|
|---|---|---|
|Open|card folds down from its top edge (220 ms); the frozen field stays visible|the player keeps context|
|Restart confirmed|card folds away, fresh board at R1 with the star; total < 2 s|retry costs nothing|

### 10.8 Settings
Card 520×420 at (380,150). Rows at 56-px pitch from y 230, label 16 px left at x 412, control right at x 640–860: **Music** slider 0–100 (default 60) · **Effects** slider (80) · **Screen shake** 0–100 % (100) · **Reduce motion** toggle (off) · **Colourblind signals** toggle (off) · **Auto-start rounds** toggle (off). Sliders: 220-px track, 16-px paper knob; each Effects change plays a pop at the new volume. Persisted to localStorage (try/catch). "Back" button at the bottom.
|Moment|What is on screen|Why it is composed|
|---|---|---|
|Colourblind on|a live preview strip inside the card: 5 chain blots + Wax + Pale Splat with strong pips|the setting is proved on the spot|

### 10.9 Game over
|Moment|What is on screen|Why it is composed|
|---|---|---|
|Lives 0|sim stops; ink floods from the jar as a growing lobed blob (r 0→1400, 1.2 s inQuad) to 70 % `--knot`|the loss is shown in the world, not a stamp|
|Card|centred 460×300, ink plate, `--fold-white` text: "The garden is inked." 44 px; "Round 13 · 2,311 blots torn"; **Try again** (Enter, `--ok`) · **Title**|one obvious next action|
|Try again|ink drains back into the jar (300 ms), fresh R1 board (< 2 s total)|retry feels like a rewind|

### 10.10 Victory
|Moment|What is on screen|Why it is composed|
|---|---|---|
|Last blot torn|1 s of quiet; ambient only|space before the celebration|
|Celebration|24 paper cranes (wing-flap 3 Hz) rise from the towers in random arcs over 3 s; petals ×4; victory sting|the defenders fly; the world thanks the player|
|Card|paper card 480×320: "The garden holds." 44 px; "Seeds left 62 · 9,880 blots torn · Best defender: Gale Tern (3,402)"; **Play again** · **Title**|a story in three numbers|

## 11 · Feel in numbers
- **Input:** pointer to ghost update in the same render frame; click to placement next sim tick (≤ 17 ms); hover lift 90 ms; button press depresses 1 px over 90 ms outCubic.
- **Pop:** ring R→1.8R, 2 px stroke, alpha 1→0 over 160 ms; flecks: triangles 3–5 px in the popped layer's colour, speed 60–140 px/s, drag 4/s, life 300 ms, spin ±6 rad/s; the child spawns at scale 1.35→1 over 120 ms backOut (squash).
- **Hit (no pop, Knot/Inkmaw):** 1-frame white flash (fill `--fold-white` at 60 %), 2-px recoil along the hit direction, returning over 80 ms.
- **Hit-stop** (sim tick freeze, deterministic): Knot pop 2 ticks · boss shed 4 · boss death 12. Nothing else.
- **Screen shake:** offset = A·e^(−t/τ)·(noise x,y), with A and τ: leak 4 px/120 ms (≥ 10 seeds lost at once: 8 px/200 ms) · Wax crack 1 px/60 ms · boss shed 6/150 · boss death 12/250 · boss rumble 2 px constant. Multiplied by the Shake setting; reduce motion → 0.
- **Floating text:** per 250-ms window, pop income aggregates into one "+N" from the Sheets pill (14 px `--gold`, rises 18 px over 600 ms, fades the last 200 ms). Spends "−N" in `--bad`. Leaks "−N" at the jar and the Seeds pill. Round bonus as in 10.3.
- **Fire:** Tern recoil 2 px/60 ms; Frog squash 0.9/1.1 over 100 ms; Owl eye flare r 6→9/90 ms.
- **Speed:** 1× = 1 sim step (1/60 s) per real 1/60 s; 2× = 2 steps. Music never speeds up. Visual timers (rings, flecks, text) run on real time so 2× stays readable.
- **Reduce motion:** shake 0, flecks ×0.5, no letter folds (fade 200 ms instead), panels crossfade 160 ms, ambient sway off, floating text fades without rising. Hit-stop stays (it is a pause, not motion).

## 12 · Sound (Web Audio, all synthesized)
Buses: music (default −14 dB) and sfx (−6 dB) → master compressor (threshold −18, ratio 4). Priority (ducking order): leak/boss > UI > tower fire > pops.
|Event|Synthesis|
|---|---|
|Pop (per layer)|triangle blip 40 ms, attack 2 ms, exp decay; pitch Dot 880 · Drop 784 · Splat 659 · Splash 587 · Blotch 523 · Streak 698 · Wax 440 · Knot 330 Hz; + 15-ms noise tick high-passed at 3 kHz; ±3 % detune from a render RNG|
|Crackle bed|when > 6 pops in 50 ms: bandpassed noise 2 kHz, gain 0.1·log2(extra+1), 80 ms|
|Immune tink|square 2093 Hz, 30 ms, highpass 1.5 kHz|
|Tern fire|noise "fwip" bandpass sweep 2.4→1.2 kHz, 60 ms|
|Frog fire / land|sine 140→70 Hz 120 ms / lowpassed noise 800 Hz 90 ms "plop"|
|Koi pulse|noise lowpass 4 kHz→600 Hz over 220 ms + sine 330 Hz at −12 dB|
|Owl glare|sines 1320 + 1980 Hz bell, 300 ms decay|
|Place|3 noise grains 12 ms, 30 ms apart + 180-Hz thump|
|Invalid click|2 square beeps 160 Hz, 40 ms, 60 ms apart|
|Upgrade|triangle arpeggio C5-E5-G5, +1 note per tier (tier 3 adds C6)|
|Sell|noise rip 120 ms + 2 falling notes G4→C4|
|Leak|sine 110 Hz 200 ms + seed rattle (5 clicks); max 1 per 100 ms|
|Round start / clear|two-tone wood clack 600/900 Hz / pentatonic chime D5 F#5 A5 B5|
|Boss arrive / shed / death|saw 55 Hz drone, lowpass 200→900 Hz over 2 s + 3 drum hits / 82-Hz thud + splash noise / 600-ms tear noise + D-major chord bloom 1.5 s|
|UI hover / click|4 kHz 8 ms at −30 dB / 1.2 kHz 20 ms|
|Game over / victory|descending minor 4 notes 1.6 s / pentatonic run + chord 2.4 s|

**Music states** (D-major pentatonic, 84 BPM, 8-bar loops of plucked triangle + soft pad; changes crossfade 800 ms on a bar line): **Title** (pluck + pad) · **Intermission** (pad + sparse pluck) · **Round** (+ shaker 8ths + bass pulse) · **Storm** R15+ (+ kick on 1 and 3, tom fills) · **Boss** (B-minor drone, taiko on 1) · **Victory/Game-over** stings then silence. Pause: lowpass 800 Hz, −6 dB. Mute: M.

## 13 · Controls (keyboard + mouse; gamepad and touch out of scope per brief)
1–4 select tower · LMB place/select · RMB or Esc cancel placement · Esc pause (otherwise) · Space start round / toggle 1×↔2× · Z / X buy next tier on path A / B · T cycle targeting · Backspace/Delete sell (two presses within 1 s) · A auto-start · M mute · R restart (inside pause). No rebinding in this slice. Hotkeys are shown on cards and boxes as 20-px badges.

## 14 · Voice
Warm, a little bookish, garden verbs (fold, tear, spill, hold); never shouty or ironic: "Pick a defender — click the Tern or press 1." · "Green ring is a good spot." · "Space — let the ink in." · "Pale ink slips past plain eyes. Bring a lantern." (first Pale, R7) · "Wax sheds blades and water." (first Wax, R10) · "Something large is spilling." · "The other fold went deep." · "The garden holds." · "The garden is inked." Card hover blurbs: "Quick quills, cheap and loyal." · "Lobs stones. Wax cracks." · "Mist touches everything near." · "Sees pale ink from afar." First-encounter banners show once per kind.

## 15 · Accessibility and comfort
- No signal by colour alone: lobes + pips + size (layers), dash + hatch (Pale), hexagon (Wax), ✕ (invalid), stamp + lock (sealed).
- Colourblind mode: pips at 100 % with outlines, Pale hatch at 100 %, path-colour flecks replaced by shape flecks (A ▲, B ●).
- Text ≥ 12 px; `--ink` on `--paper` ≈ 14:1. Pause anywhere; restart < 2 s; Music/Effects volume; Shake 0–100 %; Reduce motion; no flashing above 3 Hz.
- Window blur auto-pauses; resize letterboxes with `--paper-deep` bars.

## 16 · Polish list
1. Counters use fixed digit advance; the Sheets pill never changes width mid-tick.
2. The ghost tower draws at the pointer in the same frame, with no trailing.
3. The invalid ✕ appears exactly when the footprint crosses the 22+fr clearance; the ghost nudges once on entry, not continuously.
4. A child blot appears in its parent's exact position and scales 1.35→1; there is no gap frame between parent and child.
5. Every pop draws a ring even at 600 particles.
6. Lobe counts are right for every chain kind at every zoom: 0/3/4/5/6.
7. Pale blots are visibly dashed and hatched, not just transparent.
8. An immune hit on Wax shows sparks and "tink", never a pop ring.
9. Towers turn toward targets (720°/s) and never snap.
10. Every one of the 24 tiers changes the sprite, and the change shows in the portrait.
11. Sealed tiers explain themselves on hover.
12. Unaffordable cards and boxes say how much more is needed.
13. The round-bonus "+N" flies into the Sheets pill and the pill ticks on arrival, not before.
14. The Go button label always tells the truth: Start / 1× / 2×.
15. Shadows are all offset (+3,+4) with no blur, on towers, rocks, jar, cranes and cards.
16. The Seed Jar's seed fill matches lives (100 = full).
17. The boss bar notches sit at exactly 75/50/25 % and tear off at those HP values.
18. Pause music is muffled, not silent; resume restores it within 160 ms.
19. No pop is louder than a leak; 300 pops never clip (compressor and voice cap).
20. Banners never cover the kill-pocket (y 96 band only).
21. Restart from game over to a playable R1 takes < 2 s with no flash of an old state.

## 17 · Anti-goals
- Never a clone: no monkeys, balloons, darts, bananas, red-blue-green-yellow-pink bloon ladder, or a borrowed left-panel shop look.
- Never neon, glossy or chrome; only `--glow` glows.
- Never dead air or mid-round modals.
- Never a wall of text: no tutorial screen; teach with the star, ring and banner.
- Never particle soup that hides blot shapes.

## 18 · Acceptance by eye
Capture at 1280×720, 1920×1080 and 900×600 (letterbox), JPEG q80, DSF 1:
1. Title at 0 ms, 800 ms and idle 5 s.
2. First placement: Tern selected over a valid spot, over the path (✕), and just placed.
3. Round 1 at t 8 s.
4. Fold card per tower at 0/0, 3/1, 1/3 (12 shots, all distinguishable) and a sealed-tier hover.
5. R18 t 8 s, reference build (≥ 250 blots; lobes correct on 10 random blots).
6. R20: warning, arrival, the 50 % shed, the death frame.
7. Pause, Settings with colourblind preview, Game over card, Victory card.
8. The same R18 frame with colourblind mode on.
Check each against its §10 row and §16 one by one.

## Fold-ins
None (no bake-off). Raised: triple layer signal (colour, lobes, pips), 100 % fresh-fold refund, a sprite morph per tier, attract-mode title.
