# Experience spec — M-0002 Constellation: 3D relational memory space

## 1. North star
**Freeze any frame and you see a night sky that is also a mind: every light is a thing you stored, every line is a reason two things belong together, and the colour of the sky tells you whose mind you are looking through.**

## 2. Reference points (craft, never content)
| Reference | Craft we take |
|---|---|
| Planetarium star charts | Magnitude sizing: size ∝ √degree, so hubs read without crowding. |
| Vector-display oscilloscopes | Additive phosphor glow and **persistence tails**: a moving pulse leaves a 180 ms decaying trail. |
| 1970s transit diagrams | Routes as bold lines with **station beads** and hop counts, compared side by side. |
| *Learnable Programming* (Victor, 2012) | Show the data at every step: each condition shows its evaluated operands (`20 < 100 → true`) beside the node. |
| Long-exposure astrophotography | Stillness rewarded: drift 0.6°/s, breathing on a 6.4 s period. |

## 3. Information architecture and flows
One screen: **the void** (a full-bleed WebGL canvas) plus DOM overlays: top bar, left **drawer** (tabs: Route · Pathways · Results), right **inspector**, **Store** sheet, toasts, and key map. There is no routing.

Five flows, one e2e each: **explore** (orbit, hover, select, inspect) · **perspective** (1/2/3, morph, ghosts) · **route + learn** (A → Z, both trails, learn) · **run pathway** (Simmer, switch lens, re-run, compare) · **store + find** (store, link, reload, search).

## 4. The moments
**First 5 seconds** (clock from first frame; `__cst.clock` drives everything, see §13):
- **0 ms:** pure `#000000`. No spinner, because the stars are the loader.
- **120 ms:** *Memory* (the meta hub) ignites at the centre of its cluster.
- **120–1700 ms:** nodes ignite in BFS order from *Memory*. Each node starts at `120 + 1580·(bfsRank/maxRank)` ms and takes 420 ms: opacity 0→base on `out`, scale 0.4→1.08→1.0 on `back`. Unreachable nodes ignite last.
- **700–2300 ms:** each line draws from its source end to its target end over 480 ms once both of its endpoints have ignited.
- **1800 ms:** the wordmark and the line *"A memory you can walk through."* fade in at top-left (600 ms).
- **2400 ms:** the top-bar controls fade and rise 6 px (300 ms).
- **3200 ms:** a toast at bottom centre: *"Drag to look around · click a light · press / to ask."* It stays until the first input or 9 s.
- **5000 ms:** breathing is established. Idle drift starts at 8 s without input.

**Hook (10–30 s).** Press **2**: the sky bends in 1 s and 14 lights split into coloured ghosts (`293 K`, `20 °C`, `2 · warm`). "One thing, several truths" lands without reading.

**Peak.** Running *Simmer until done* sends a mint pulse round the loop 2 times under Cook and 4 times under Physicist. The result card compares the two: *"Cook: 2 stirs · Physicist: 4 stirs. Same pathway, different truths."*

**Return.** On reload the intro runs at 50% duration; toast *"Welcome back. 91 lights. The 3 you stored are where you left them."* (live counts; newest node clickable).

## 5. The seed memory (original; 88 nodes, 110 relations)
Values are `number + unit` where conditions read them. Nodes whose facet values differ **disagree** (14, marked ◆); all others hold one shared value or none.

**Perspectives.** Default on first load: **Cook**.
| Key | Lens | Token | What it reveals |
|---|---|---|---|
| 1 | **Cook** | `--lens-cook #FF9F5A` | Kitchen truths in °C. Pathways and recipe files pulled close; variables pushed far away. |
| 2 | **Physicist** | `--lens-physicist #6FD3FF` | Kelvin and molecules. Exclusive lines to Kelvin, Molecules and Energy; the Long Road is a precise flat ring. |
| 3 | **Child** | `--lens-child #FF7EC8` | Values on a 0–5 hand-feel scale. Drawing and bedtime-story lines appear. It **cannot see F–X**, so its shortcut is longer. |

**Heat cluster (16).** In the value columns, P = Physicist, C = Cook, Ch = Child.
| Node | Kind | P | C | Ch |
|---|---|---|---|---|
| Temperature ◆ | variable | 293 K | 20 °C | 2 · warm |
| Boiling Point ◆ | variable | 373 K | 100 °C | 5 · bubbly |
| Flame Step ◆ | variable | 20 K | 40 °C | 1 · a bit |
| Safe To Touch ◆ | variable | 318 K | 45 °C | 1 · cool |
| Room ◆ | variable | 295 K | 18 °C | 1 · cool |
| Heat ◆ | concept | energy moving from hot to cold | how high the flame is | the thing that says ouch |
| Steam ◆ | concept | water as gas, above 373 K | the soup is ready | the cloud from the pot |
| Soup ◆ | concept | mostly water, 1.0 kg | Tuesday's leek soup | dinner |
| Burn ◆ | concept | tissue damage above ~317 K | what happens when you rush | ouch |

The other seven Heat nodes are concepts with one shared note: Energy *"never made or destroyed"*, Molecules *"jiggle faster when hot"*, Kelvin *"absolute scale"*, Stove, Pot, Ice, Thermometer.

**Files (12)** use the kind `file` with `{path, type, sizeNote, content?}`. Three disagree:
- **recipe.txt ◆**: `/kitchen/recipe.txt`, text, 2.1 KB, content *"Leeks, butter, stock. Simmer until it smells like home."* P *"2.1 KB of UTF-8 text"* · C *"Grandma's leek soup"* · Ch *"the paper with the soup on it"*.
- **boiling-curve.csv ◆**: `/lab/boiling-curve.csv`, csv, 38 KB. P *"pressure vs boiling point, 40 rows"* · C *"why soup is slow in the mountains"* · Ch *"numbers"*.
- **drawing-of-a-sun.png ◆**: `/home/drawings/sun.png`, image, 640 KB. P *"a 5778 K blackbody, roughly"* · C *"stuck on the fridge"* · Ch *"MY SUN"*.

The other nine share one value: `lab-notes.md` (/lab), `shopping-list.txt` (/home), `thermostat.cfg` (/home), `kettle-manual.pdf` (/home), `timer.js` (/code), `loop-notes.md` (/code), `README.md` (/code), `sim-config.json` (/lab), `bedtime-story.txt` (/home).

**Variables (10)** use the kind `variable`:
- `limit` ◆ disagrees: P 100 · C 90 · Ch 3.
- `unit` ◆ disagrees: P "K" · C "°C" · Ch "hand-feel".
- The rest share one value: `count` 0, `i` 0, `done` false, `step` 1, `total` 0, `name` "Constellation", `epsilon` 0.001, `retries` 3.

**Meta, "How this works" (10 concepts):** Memory, Perspective, Facet, Relation, Shortcut, Route, Recall, Pathway, Loop, Condition.

**Long Road (26 concepts):** labels `A`…`Z`, shared value *"stop n of 26"*.

**Pathways (14 pathway nodes):**
- *Simmer until done*: P1 `start`, P2 `read heat ← Temperature`, P3 `assign stirs ← 0`, P4 `while heat < Boiling Point`, P5 `assign heat ← heat + Flame Step` (P5 reads Flame Step), P6 `assign stirs ← stirs + 1`, P7 `end "Done after {stirs} stirs · heat {heat}"`.
- *What should I do with it?*: Q1 `start`, Q2 `read t ← Temperature`, Q3 `if t > Safe To Touch`, Q4 `end "Wait, too hot to touch."`, Q5 `if t < Room`, Q6 `end "Warm it up."`, Q7 `end "Serve it."`.

**Relations.** All have weight 1.0 unless noted. Relations are traversable both ways for routing. A lens tag `[P]`, `[C]` or `[Ch]` means the relation is visible only in those lenses.
- **Heat (19):**
  - Temperature–Heat, Temperature–Thermometer, Boiling Point–Temperature, Ice–Temperature, Room–Temperature and Safe To Touch–Temperature (all `relates`).
  - Temperature–Kelvin [P] and Temperature–Molecules [P].
  - Heat–Energy `is-a` [P], Heat–Stove [C], Heat–Burn [C,Ch].
  - Boiling Point–Steam, Steam–Pot, Pot–Stove, Soup–Pot `part-of`, Soup–Steam [C], Ice–Molecules [P], Flame Step–Stove, Safe To Touch–Burn.
- **Files (18, `references` unless noted):**
  - recipe.txt→Soup, recipe.txt→Pot [C], lab-notes.md→Kelvin, lab-notes.md→Molecules, boiling-curve.csv→Boiling Point.
  - shopping-list.txt–recipe.txt `relates` [C].
  - drawing-of-a-sun.png→Heat [Ch], drawing-of-a-sun.png–bedtime-story.txt `relates` [Ch].
  - thermostat.cfg→Room, kettle-manual.pdf→Boiling Point, timer.js→Loop, timer.js→count, loop-notes.md→Loop, loop-notes.md→Condition, README.md→Memory, sim-config.json→epsilon.
  - sim-config.json–lab-notes.md `relates` [P], bedtime-story.txt→Soup [Ch].
- **Variables (10, `relates`):** limit–count, count–i, i–step, done–Condition, total–count, unit–Temperature, unit–Kelvin [P], epsilon–limit [P], retries–Loop, name–Memory.
- **Meta (10):** Memory–Perspective, Memory–Relation, Memory–Recall, Memory–Pathway, Shortcut `is-a` Relation, Recall–Route, Route–Shortcut, Pathway–Loop, Pathway–Condition, Perspective–Facet.
- **Bridges (6):** Facet–Temperature, Route–A, Pathway–P1, Pathway–Q1, Loop–P4, Condition–Q3.
- **Long Road (28):** 25 `next` relations A→B…Y→Z, plus the hidden routes A–F `relates`, **F–X `relates` [P,C]** and X–Z `relates`.
- **Flow (13):** P1→P2→P3→P4, P4 –body→ P5 → P6 –loop→ P4, P4 –exit→ P7; Q1→Q2→Q3, Q3 –then→ Q4, Q3 –else→ Q5, Q5 –then→ Q6, Q5 –else→ Q7.
- **Reads (6):** P2→Temperature, P4→Boiling Point, P5→Flame Step, Q2→Temperature, Q3→Safe To Touch, Q5→Room.

**Visible line counts (test-asserted):** Cook **100**, Physicist **102**, Child **98**. The top bar reads *"88 lights · 100 lines"*. Under Cook and Child, Energy has no visible lines. It dims to 35% and drifts to its cluster rim, which teaches that a thing can be meaningless in one lens.

**Expected pathway results (test-asserted; a trace is the list of node visits).**
| Pathway | Cook | Physicist | Child |
|---|---|---|---|
| Simmer until done | 20→60→100: **"Done after 2 stirs · heat 100 °C"** (11 visits) | 293→313→333→353→373: **"Done after 4 stirs · heat 373 K"** (17 visits) | 2→3→4→5: **"Done after 3 stirs · heat 5 · bubbly"** (14 visits) |
| What should I do with it? | 20 > 45 false; 20 < 18 false → **"Serve it."** (Q1 Q2 Q3 Q5 Q7) | 293 > 318 false; 293 < 295 true → **"Warm it up."** (Q1 Q2 Q3 Q5 Q6) | 2 > 1 true → **"Wait, too hot to touch."** (Q1 Q2 Q3 Q4) |

Each result card carries an explanation built from the template *"{Lens} reads {var} as {value}… so {outcome}."* Examples:
- **Cook, Simmer:** *"Cook reads Temperature as 20 °C and Boiling Point as 100 °C. Each stir adds 40 °C, so the loop ran twice."*
- **Physicist, Serve:** *"293 K is just below room (295 K), so the Physicist says it's cold."*
- **Child, Serve:** *"To the Child, warm (2) is hotter than cool (1). Too hot."*

**Expected routes A → Z:**
- **Cook and Physicist:** declared chain 25 hops, shortest **3 (A → F → X → Z)**, chip *"25 hops → 3 hops · 88% shorter"*.
- **Child:** shortest **20 (A → F → G → … → X → Z)**, chip *"25 hops → 20 hops · 20% shorter"*, note *"F–X is invisible to the Child, so the shortcut is longer here."*
- **After learning:** a `shortcut` A–Z relation is added in all lenses, and the next search reads *"25 hops → 1 hop"*.

**Expected search "boil" under Cook** (matches label, file path and the active-lens value): depth 0 = **2** (Boiling Point, boiling-curve.csv), depth 1 = **4**, depth 2 = **16**, depth 3 = **14**.

## 6. Layout per perspective
Layouts are deterministic. Each cluster has an anchor and a radius per lens. Members are placed by a force layout seeded with `mulberry32(hash(lensId + nodeId))`, run for 300 iterations at load and cached. Pathway nodes use **fixed flowchart offsets** so flow stays readable in every lens; only their anchor moves.
- **Simmer offsets:** P1 (0,30), P2 (0,18), P3 (0,6), P4 (0,−6), P5 (14,−6), P6 (7,−17), P7 (−10,−20).
- **Serve offsets:** Q1 (0,30), Q2 (0,18), Q3 (0,6), Q4 (−14,−6), Q5 (14,−6), Q6 (6,−20), Q7 (24,−20).

Both sets of offsets are in the plane facing the default camera.

| Cluster | Cook | Physicist | Child |
|---|---|---|---|
| Heat | (0,10,0) r36 | (0,0,0) r42 | (0,0,30) r50 |
| Files | (−130,70,−40) r38 | (150,30,−50) r38 | (−70,80,0) r40 |
| Variables | (150,−70,−90) r34 | (−150,20,−30) r30 | (160,90,−120) r30 |
| Meta | (0,120,−90) r30 | (0,95,−40) r30 | (−140,−20,−60) r34 |
| Simmer | (−60,−30,50) | (−95,−35,60) | (−90,−60,60) |
| Serve | (60,−30,50) | (95,−35,60) | (110,10,60) |
| Long Road ring | (0,−120,−30), R 70, tilt 25°, wobble 6 | (0,−110,0), R 70, tilt 12°, wobble 0 | (40,−100,0), R 55, tilt 35°, wobble 14 |

**Long Road ring.** Node i (0…25) sits at angle `φ = −90° + 310°·i/25` on radius `R + wobble·sin(1.9i)`. A and Z are 50° apart, F (−28°) faces X (195°) across the ring, and the shortcut **cuts across the ring** instead of lying on it.

## 7. Look
**Palette tokens**
| Token | Hex | Use |
|---|---|---|
| `--void` | #000000 | Canvas and page. Nothing is ever lighter behind the stars. |
| `--panel` | rgba(8,10,16,0.74) + blur 14 px | Panels |
| `--hairline` / `--hairline-strong` | rgba(232,236,245,.10) / .22 | Borders, dividers |
| `--ink` | #E8ECF5 | Primary text, base line colour |
| `--ink-dim` | #9AA3B8 | Secondary text (8.2:1) |
| `--ink-faint` | #6E778A | Hints only (4.6:1) |
| `--star` | #F4F6FF | Node cores |
| `--lens` | = active lens token | Halo tint, UI accent; tweens 1000 ms |
| `--pulse` | #8CFFD1 | Pathways, flow lines, run pulse, `true` chips |
| `--false` | #FF8A7A | `false` chips, errors in traces |
| `--trail-long` | #8E96C8 | Declared-chain trail |
| `--signal` | #E6FF6E | Shortest trail, learned shortcuts |
| `--danger` | #FF6B6B | Destructive buttons |

**Type.** **Manrope** 400/500/700 (UI) and **IBM Plex Mono** 400/500 (values, code), self-hosted, OFL. Scale 11/12/13/15/19/28 px; line height 1.45 body, 1.2 headings. 3D labels Manrope 500 12 px, +0.02em, `--ink`. Wordmark Manrope 700 15 px, +0.18em, "CONSTELLATION".

**Spacing.** The scale is 4 / 8 / 12 / 16 / 24 / 32 px. Panel padding is 16, corner radius is 12, and controls are 32 px tall (44 px on touch).

**Lighting.** True black, additive blending, glow from halo sprites (no post-process bloom: deterministic and cheap). Dust: 1,200 points, 0.6–1 px, opacity .05–.15, on a 900 u sphere, parallax only. Breathing: brightness `base·(0.85 + 0.15·sin(2πt/6400 + φᵢ))`, `φᵢ = hash(id)`; field scale `1 + 0.004·sin(2πt/9000)`.

**Nodes by kind.** Size in world units is `r = 1.6 + 0.45·√(visible degree)`, clamped on screen to a radius of 3–18 px. Size lerps during a morph.
- **Concept:** round `--star` core + gaussian halo 3.2r tinted 25% `--lens`.
- **Variable:** diamond core 0.9r + 1 px ring at 1.8r.
- **File:** 1.5 px square outline (side 2r), dog-ear notch top-right, centre dot; halo 0.6×.
- **Pathway:** `--pulse` glyph in a 2.2r ring: start ▶, read ring+dot, assign "=", if ◇, while 300° arrow arc, end double ring (one SDF atlas, 64 px cells).
- **Long Road:** fixed r 1.4; letter label always a candidate.

**Edges by relation type.** Alpha is `base·(0.6 + 0.4·weight)·fog`, where fog falls from 1 to 0.35 over a camera distance of 150–450.
| Type | Look |
|---|---|
| relates | `--ink` .16, 1 px solid |
| is-a | `--ink` .22, 1.25 px, with a bright 6-unit sheen that travels source→target every 4 s |
| part-of | `--ink` .18, 1 px, dashed 6/4 |
| next | `--ink` .20, 1 px, with the sheen running A→Z at 30 u/s (the road "flows") |
| references | `--ink-dim` .18, dotted 1/3 |
| reads | `--pulse` .22, dashed 3/3 |
| flow | `--pulse` .45, 1.5 px, with a mono 10 px chip at the midpoint ("then", "else", "body", "loop", "exit") |
| shortcut | `--signal` .85, 2 px, with 1.6× glints at the endpoints |
| lens-only (any type) | A gradient from its type colour at the ends to its lens colour at the midpoint ("this line exists because of the Physicist") |

**Facet ghosts.** One ghost per *other* lens: 60% size, 55% opacity, lens colour, 1 px tether at .3 alpha, billboarded at screen angles 90° + 120°·k. **Rest:** orbit at 3.5 u, 0.08 rev/s. **Expanded** (disagreement window or D held): 9 u, each with a mono 11 px value chip (`293 K`).

**Label declutter** (every 2nd frame). Priority: selected > hovered > search depth ≤ 1 > selection neighbours > Long Road letters > visible degree. Greedy placement in priority order; skip any label whose rect (4 px padding) overlaps a placed one. Cap 40 (18 below 600 px). Screen radius < 4 px → no label unless priority ≥ neighbour. Opacity 1 → 0 over depth 220–480; fade in 160 ms, out 120 ms.

**Motion language.**
- **Easings:** `out` is cubic-bezier(.22,1,.36,1), `inout` is easeInOutCubic, `back` is cubic-bezier(.34,1.56,.64,1), and `sine` is easeInOutSine. `r(t,a,b) = clamp((t−a)/(b−a),0,1)`.
- **Durations (ms):** hover 120, panel 220 in and 160 out, focus-fly 900, morph 1000, line draw 480, toast 240, button press 90.
- **Rule:** one gesture at a time. The camera never flies while a morph runs; a fly is queued until the morph ends.

## 8. Camera
- **Orbit:** drag orbits, right/two-finger drag pans, wheel/pinch dollies 0.92× per notch; damping 0.08; distance 25–520.
- **Default view:** fit active layout's bounding sphere ×0.9, `d = R/sin(min(hfov,vfov)/2)`, vfov 45°, elevation +12°. Below 600 px wide, fit Heat + Simmer + Serve only.
- **Focus-fly:** 900 ms `inout` to distance 70 along the current view direction, lifting `+0.15·d·sin(πu)` mid-flight.
- **Idle drift:** after 8 s without input, auto-rotate 0.6°/s about target Y (1,200 ms ramp-in, 300 ms ramp-out on any input). Never while typing or under reduced motion.
- **Home:** 800 ms fly back to default.

## 9. Frame table — signature moments
All frames are captured at 1440×900 in the Cook lens with the intro complete, unless the row says otherwise. Parameters are read from `__cst.state()`.

| # | Moment | What is on screen | Why it is composed | Deterministic asserts |
|---|---|---|---|---|
| F1 | **Idle open**, t = 6000 ms, no input | True black. Six clusters float as soft islands: the Heat cluster amber-haloed at centre, pathways as two mint flowcharts flanking it below, the Long Road a tilted ring at the bottom, Files upper-left, Variables a distant blue-white smudge lower-right. ~30 labels; the wordmark is top-left, the lens switcher top-centre with **Cook** lit. Ghost satellites orbit 14 nodes. | Centre-weighted mass, with the ring giving a horizon at the bottom third. The eye goes Heat, then the flowcharts, then the ring: "things", then "doing", then "travelling". Already a memory before any input. | `lens='cook'`; `visibleEdges=100`; `labelsShown ≤ 40`; `ghostState='rest'`; no NaN positions |
| F2 | **Hover** Temperature, 200 ms after pointer enter | Temperature scales to 1.25×, halo 1.4×, its 10 lines lift to .5 alpha, its neighbours to 1.2× brightness, and the rest of the sky dims to .55. A card sits 14 px from the cursor: **Temperature** · variable · `20 °C` · *"+2 other views"*. Its ghosts tilt toward the cursor. | Focus without leaving context: the neighbourhood reads as a lit sub-web against a dimmed sky. The card gives the value immediately, so the question "what is this?" is answered in under 0.3 s. | `hovered='Temperature'`; `dimOthers=0.55` reached by 180 ms dwell |
| F3 | **Select and inspect**, 1000 ms after click | The camera has flown to distance 70, with Temperature at the screen centre and a 1.5 px selection ring. The inspector (360 px, right) shows the name and the kind chip; the badge *"3 views disagree"*; the facet table **● Cook 20 °C** (bold, active), ● Physicist 293 K, ● Child 2 · warm; the line *"Hidden in this lens: 2 lines (Physicist)"*; and Relations (10) grouped *relates 8 · read by 2*. | The canvas left of the panel stays centred on the node: target is offset by −180 px of screen-x so the panel never covers the subject. The facet table is the product's thesis in one widget. | `selected='Temperature'`; `camera.dist≈70±2`; inspector `facets.length=3` |
| F4 | **Morph midway**, Cook→Physicist, t = 500 ms | Clusters are in flight. Heat is sliding to the origin and Files sweeping right; the ring is flattening. Cook-only lines are fading (alpha .4×) and Physicist-only lines are faintly appearing. The halo tint is halfway from amber to ice. Disagreeing nodes have **burst open**: ghosts at about 9 u (back-eased overshoot visible), chips showing other-lens values. | Motion with a single direction per cluster (each one travels in a straight lerp), so mid-morph reads as "the sky re-arranging", not chaos. Ghosts burst at the start so the eye catches the disagreement *while* the space moves. | `morph.t=0.5`. Node i: `u=inout(r(t, 160·rankᵢ, 160·rankᵢ+840))`. Old-only edge alpha `1−r(t,0,400)`, new-only `r(t,600,1000)`. Ghost radius `9·back(r(t,0,500))` |
| F5 | **Morph settled**, t = 1400 ms | Physicist layout. Ice-cyan halos. Kelvin, Molecules and Energy now joined to Heat. The ring is flat and precise. Ghost chips are still expanded: Temperature shows amber `20 °C` and pink `2 · warm` around a cyan core reading `293 K`. Top bar: *"88 lights · 102 lines · Physicist"*. | The held disagreement window (2.4 s) lets a stranger read the split before it tidies itself away. | `lens='physicist'`; `visibleEdges=102`; ghosts expanded until 3400 ms, then retract to 3.5 u by 3800 |
| F6 | **Route race**, A→Z, t = 600 ms after Find | Both trails start at A. The **signal** trail (A→F→X→Z, beads 3 px, 2.5 px line) has already arrived: Z flares and the chip *"Shortest · 3 hops"* is lit. The **trail-long** trail (dotted 2 px) is 3–4 stations along the ring, its counter at *"Declared · 3 hops…"*. | The race *is* the explanation: same speed (160 ms per hop) for both, so the short one wins visibly. The shortcut cuts across the empty centre of the ring, leaving negative space around the winning line. | `route.short.hops=3`; `route.long.hops=25`; long head at hop `floor(600/160)=3` |
| F7 | **Route complete**, t = 4400 ms | Both trails are fully lit, and the rest of the sky is dimmed to .25. The drawer shows two rows: ▬ signal **3 hops** *A → F → X → Z*, ▬ trail-long **25 hops** *A → B → C → … → X → Y → Z*, and the chip **"25 hops → 3 hops · 88% shorter"**. The primary button reads **Learn shortcut A → Z**. | Transit-map clarity: two colours, two counts, one verdict. The ring of 25 beads against 3 chords makes "long and tedious" literal. | Long head finishes at 25·160 = 4000 ms; chip text exact |
| F8 | **Shortcut learned**, t = 1000 ms after click | A new 2 px signal line A–Z is fully drawn (it draws over 0–700 ms `out`), with both ends glinting. The short trail beads have collapsed into it (700–1000 ms). Toast: *"Learned: A ↔ Z. Next time it's one hop."* with **Undo**. The top bar reads *"101 lines"*. | One new permanent line, the brightest in the sky, so the learning is visible from any angle. | New relation `{type:'shortcut',a:'A',b:'Z'}` persisted; `visibleEdges=101` |
| F9 | **Pathway pulse mid-loop**, Simmer under Cook, at trace visit 7 (2nd check of P4) | The camera has framed Simmer (fly at Run start). A mint comet with a 180 ms tail sits at P4, and the P4 ring flashes 2.2×. The loop badge **×1** shows beside P4. A read-spark is on the dashed line to Boiling Point, whose chip shows `100 °C`. Beside P4, the condition chip `60 °C < 100 °C → true` is in `--pulse`. The trace list in the drawer highlights *"while heat < Boiling Point · 60 °C < 100 °C → true"*. | The data shown at the point of decision (Victor). The loop triangle P4→P5→P6 is placed to the right so circulation reads clockwise. | `trace[6].node='P4'`, `heat=60`, `stirs=1`. Step timing: travel 380 ms `sine`, dwell 140 ms (420 for reading nodes) |
| F10 | **Pathway result**, Cook then Physicist runs done | P7 blooms: a ring burst to 4r over 600 ms. The result card in the drawer shows **"Done after 4 stirs · heat 373 K"**, the explanation line, and the comparison *"Cook: 2 stirs · Physicist: 4 stirs. Same pathway, different truths."* The P4 badge reads **×4**. | The peak: the difference is stated in one sentence and backed by a still-visible badge in the graph. | `runs.cook.result` and `runs.physicist.result` exact strings (§5) |
| F11 | **Search activation**, "boil" under Cook, t = 400 ms after the last keystroke | Boiling Point and boiling-curve.csv flare white (scale 1.6, ring burst). Their 4 neighbours glow at 1.0, the 16 at depth 2 at .55, and the 14 at depth 3 at .30. Everything else is at .12 and its lines at .04. The drawer Results tab lists *Matches (2) · 1 hop (4) · 2 hops (16) · 3 hops (14)*. | Light spreads like a ripple: depth d lights at `90·d` ms with activation `0.55^d`. A hierarchy of brightness *is* the answer, and the list mirrors it for keyboard and screen-reader users. | Compute ≤ 150 ms (perf mark `search`); counts 2/4/16/14; `activation(d)=0.55^d` |
| F12 | **Add a thing**, 900 ms after Save ("Tea", value "hot" in Cook only, linked `relates` to Temperature) | A new light swells beside Temperature (1 px → 1.3× over 260 ms `back`, settling to 1.0 by 460). Its link line has drawn in (420 ms). The camera eases 30% of the way toward it. Toast: *"Stored "Tea" · linked to Temperature. Saved."* Top bar (fresh seed): *"89 lights · 101 lines"*. | Birth placed 8 u from its link target (seeded angle) so the new thing joins its neighbourhood, not the void's edge. | After reload: node exists, same position ±0.01, search "tea" → depth 0 = 1 |

## 10. Panels, controls and real copy
**Top bar** (56 px, gradient from black to transparent):
- **Left:** a 6-ray line glyph plus the wordmark, then the stats *"88 lights · 100 lines"*.
- **Centre:** the lens switcher, three pills each with a colour dot and its key (`1 Cook`, `2 Physicist`, `3 Child`). The active pill has a lens-colour underline that slides over 280 ms.
- **Right:** a search field with the placeholder *"Ask the memory…  /"*, a **Store** button (N), and a ⋯ menu (Import…, Export, Reset to seed, Sound: off, Key map ?).

**Drawer (left, 340 px, tabs).**
- **Route:** two comboboxes, From and To. Below them, the suggestion chip *"Try the Long Road: A → Z"* and the **Find route** button (Enter).
- **Pathways:** two cards, *Simmer until done · while loop* and *What should I do with it? · if / else*. Each card has **Run** (Space), **Step** (S), a speed toggle (1× · 2×), a live trace list and a result area.
- **Results:** the search groups by depth.

**Store sheet** (N): Kind (Thing · Variable · File) · **Name** (required) · **Value** under the active lens, with *"Same in every lens"* checked by default · File: path, type, size note, contents (≤ 2,000 chars) · **Link to** combobox (type defaults to *relates*). Buttons *Store it* / *Cancel*.

**Link mode** (L with a selection; 450 ms long-press on touch): a rubber-band line follows the pointer; clicking a node opens a popover with type (relates · is-a · part-of · references · next), *"Only in this lens"*, and weight 0.2–1.0 (default 0.6). Esc cancels.

**Copy for every state**
| State | Copy |
|---|---|
| Inspector empty | *"Nothing selected. Click a light, or press / and ask."* |
| Search, no match | *"Nothing here remembers "quark". Try a shorter word, or store it (N)."* |
| Route, none | *"No route from Energy to Soup under Cook. Energy has no visible lines in this lens. Try Physicist."* |
| Route, no chain | *"No declared chain between these, so this is the shortest only."* |
| Learn disabled | *"Already one hop. Nothing shorter to learn."* |
| Pathway missing value | *"Stopped at while: Boiling Point has no value under Child."* |
| Pathway guard | *"Stopped after 100 loops: the condition never became false (heat stayed 20 °C)."* |
| Node deleted under a pathway | *"Stopped at "read heat ← Temperature": Temperature no longer exists."* |
| Validation: empty name | *"Give it a name, even one word."* |
| Validation: duplicate name | *"There's already a "Soup". Store another anyway?"* |
| Validation: long value | *"Values hold up to 500 characters. Put longer text in a File."* |
| Autosave | The chip *"Saved"* appears for 1.2 s, 400 ms after each change (debounced). |
| Storage failure | *"Couldn't save to this browser (storage is full or blocked). Export a copy so nothing is lost."* with an [Export] button |
| Import, bad file | *"That file isn't a Constellation memory (missing "nodes")."* |
| Import, newer file | *"This memory is from a newer version (v3). Update the app to open it."* |
| Import, success | *"Opened "my-memory.json": 112 lights, 140 lines."* |
| Reset | *"Replace your memory with the seed? Your 3 stored things will be gone unless you export first."* with [Export first] [Replace] [Cancel] |
| Delete | *"Delete Temperature and its 10 lines? Pathways that read it will stop with an error."* |
| No WebGL | *"This memory needs WebGL to draw, and this browser has it off or unsupported. Your data is safe: you can still export it."* |

## 11. Feel
- **Input → visible response ≤ 50 ms** (hover, keys, clicks). Picking hit radius = max(screen r, 10 px).
- **Buttons:** translateY 1 px + background +6% over 90 ms `out`; focus ring 2 px `--lens`, 2 px offset.
- **Lens switch mid-morph** retargets from current positions (no snap). **Space** while running pauses; **Step** advances one visit.
- **Juice:** ignition overshoot 1.08; search match ring burst to 3r over 500 ms; pathway visit flash 2.2× (in 120, decay 300); end-node bloom; learned-shortcut endpoint glint 1.6× twice (2 × 120 ms). **No screen shake**: this is a calm instrument.
- **Sound** (off by default, ⋯ toggle; WebAudio synthesis; cut first if time runs short): visit = 520 Hz sine 60 ms −24 dB, +1 semitone per loop iteration; `false` = 300 Hz blip; result = 3-note triad 400 ms; route arrival = 2 kHz tick 20 ms. Mix: result > visit > tick.

## 12. Keyboard map
| Key | Action |
|---|---|
| 1 / 2 / 3 | Cook / Physicist / Child |
| / | Focus search |
| Esc | Clear search or route, close the panel, cancel link mode (innermost first) |
| ← ↑ → ↓ | Move the selection to the nearest visible neighbour in that screen direction |
| [ / ] | Cycle the selection through neighbours |
| Enter / F | Open the inspector / focus-fly to the selection |
| N / L / R / P | Store / Link / Route drawer / Pathways drawer |
| Space / S | Run or pause / Step the pathway |
| D (hold) | Expand all ghosts with values |
| Home | Reset the camera |
| Ctrl/Cmd+Z | Undo the last change |
| Ctrl/Cmd+E | Export |
| ? | Key map overlay |

Each selection change updates a polite live region. Example: *"Temperature, variable. Cook: 20 °C. Disagrees: Physicist 293 K, Child 2 · warm. 10 lines."*

## 13. Determinism and test hooks (request to the architect)
`window.__cst` (exposed in dev and test builds):
- `setClock(ms)` and `pause()`, which drive every animation from one clock;
- `state()`, which returns the lens, `morph.t`, selection, hover, `visibleEdges`, `labelsShown`, `ghostState`, route, the activation map, the trace index and run results;
- `nodeScreen(id)`, which returns the node's screen x and y for picking.

`?seed=1` forces a fresh seed and `?stress=500` generates 500 synthetic nodes for the fps check.

## 14. Responsive
- **1440 / 1920:** drawer left 16 / top 72, 340 px; inspector right 360 px; both may be open. At 1920 panels don't scale; label cap 48.
- **1024:** drawer 300, inspector 320; with both open the drawer collapses to a 56 px icon rail.
- **768:** one 340 px panel at a time.
- **375:** top bar 52 px, glyph only; lens pills a full-width 44 px row beneath. Panels are **bottom sheets** (peek 96 px, expanded 62 vh, drag handle); the inspector replaces the drawer. Touch: 1 finger orbits, 2 pinch/pan, tap selects, long-press links. Label cap 18; camera fits core clusters.
- **200% zoom:** panels reflow, no horizontal page scroll.

## 15. Voice
The voice is calm, exact, and a little starlit. It speaks in the second person and keeps sentences short. It never jokes about the user's data and never uses exclamation marks. It names things by their labels. Example lines:
- *"Same thing, three truths. Conditions read the Cook value while Cook is active."*
- *"F–X exists for the Physicist and the Cook. The Child never made that connection."*
- *"Learned: A ↔ Z."*

## 16. Accessibility and comfort
- WCAG 2.2 AA: all text ≥ 4.5:1 on `--panel`; every action keyboard-reachable (§12); focus visible everywhere. Results list and inspector are real DOM, so every node is findable without the canvas.
- **Reduced motion:** intro = 200 ms fade; morph = 200 ms crossfade, no lerp; focus-fly = cut + 150 ms fade; no drift, breathing or sheen; pulses step node to node every 300 ms without tails; ghosts statically expanded.
- No flashes above 3 Hz; the brightest flare is 2.2× for 120 ms, once.
- Canvas `role="img"`, live `aria-label`: *"Constellation memory, Cook lens, 88 lights, 100 lines."*

## 17. The polish list
1. First frame is exactly `#000000`; no grey flash, no layout visible before ignition.
2. Ignition grows outward in BFS order from *Memory*; never pops in at once.
3. Labels never overlap at any frame (rectangle test) and fade rather than pop.
4. Lens-only lines carry their lens colour at the midpoint.
5. Morph ≤ 1000 ms; no node moves > 6% of viewport between consecutive frames.
6. Ghost chips: mono, with units, in their lens colour; the active value is never a ghost.
7. The selected node stays centred in the canvas area not covered by panels.
8. Inspector facet table bolds the active row; its dot matches the switcher pill.
9. *"Hidden in this lens: n lines"* appears only when n > 0.
10. Both route trails move at 160 ms/hop, so the short one visibly wins.
11. Long paths elide in the middle (*A → B → C → … → X → Y → Z*), never at the end.
12. The learned shortcut is the brightest line in the sky and survives reload.
13. Undo on *"Learned"* removes the line with a 300 ms reverse draw.
14. Condition chips show operands with units (`60 °C < 100 °C → true`).
15. The loop badge counts completed iterations (×1, ×2…) and stays after the run.
16. The result card compares lenses once two or more have run.
17. Search ripples 90 ms per hop; Results counts match the glow.
18. Esc unwinds exactly one layer.
19. Disabled buttons explain why on hover and focus (copy in §10).
20. *"Saved"* shows after every change, never mid-typing (400 ms debounce).
21. New nodes are born beside their link target; camera eases only 30% toward them.
22. Idle drift stops within 300 ms of input, never fights a drag, never runs while typing.
23. Orphans in a lens (Energy under Cook) dim to 35% at their cluster rim.
24. Top-bar stats are live and equal `state().visibleEdges`.
25. Hit targets ≥ 10 px on canvas, ≥ 32 px in DOM (44 px touch).

## 18. Anti-goals
- A grey-blue hairball where everything connects to everything and nothing reads.
- Hacker-terminal green-on-black, sci-fi HUD brackets, lens flares, scanlines.
- A boxes-and-arrows flowchart tool pasted into space. Pathways are lights, not rectangles.
- Motion for its own sake: spinning, bouncing, constant camera wandering, more than one gesture at a time.
- Hiding disagreement: averaging values, or showing only the active lens with no trace of the others.
- Cute copy, emoji, exclamation marks.

## 19. Acceptance by eye
- **1440×900:** F1–F12 at the stated clock values.
- **1024×768:** F1, F3 with drawer + inspector (rail collapse), F7.
- **375×812:** F1 (≤ 18 labels), F3 as bottom sheet, F10 in sheet, Store sheet showing *"Give it a name, even one word."*
- **Also:** reduced-motion F4 (crossfade, not lerp); the no-WebGL state.

The critic should see true black, zero label collisions, one lens colour across pill, halo, ghost and facet dot, both trails legible at F7, and the F9 condition chip readable unzoomed. Reject any frame where a panel covers the selection or the shortcut hides under the chain.

