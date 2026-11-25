# Experience spec — M-0004 Skyrest: floating-isle action demo

Units: m, ms, CSS px. `sx, sy` = screen fractions (0,0 top-left). +x east, +y up, −z north (the vista). Layout numbers were checked by projecting through the rig (§4.3) at aspects 0.46/0.875/1.78/2.16 (L-0006).

## 1. North star
**Pause on any frame and it could be the Owner's screenshot: a sunlit meadow on a floating isle, a chibi swordsman low-centre, a rune-lit stone golem filling the middle, the white temple on its higher isle up-right, softened by sky haze.**

## 2. Reference points (craft only)
| Reference | Craft we take |
|---|---|
| Stylized anime open-world ARPGs | Per-material **shade tint**: shadows lean cool blue (`cliff-shade`), never grey; thin warm rim light. |
| Isometric action-roguelikes | Hit-stop 60–120 ms scaled by weight; 1-frame white flash + 80 ms fade; numbers pop with overshoot then rise. |
| Boss-focused soulslikes | Telegraph = pose held ≥ 650 ms + limb glow ramp + ground decal filling toward impact; long recovery = punish window. |
| Cozy nature games | Puff-cluster canopies with **centre-transferred normals**: they shade like soft clouds. |
| Mobile ARPG HUDs | World-anchored nameplate; dynamic joystick; Attack with satellite buttons on the thumb arc. |

## 3. The moments
- **First 10 s.** 0 s: title over the live scene (camera orbits (8,2,−18) at 0.02 rad/s). First tap (also unlocks audio): chime swell, title fades 400 ms, camera glides to the gameplay preset over 1,600 ms (easeInOutCubic). +1.6 s hero lands from a 0.4 m hop with dust. +1.8 s a mound of 14 mossy boulders ahead lifts, spins and snaps into the Guardian over 1,800 ms (one clack per part), runes ignite top→bottom 120 ms apart, eyes open last with a two-tone horn. +3.6 s nameplate fades in (250 ms), fight music enters, ghost joystick pulses ("Drag to move"), Attack button breathes 1.0↔1.06 at 1 Hz. The Guardian's first attack waits 4.5 s or until the first player hit.
- **Hook.** First strike: cyan crescent, 60 ms hit-stop, camera kick, chips, a white number pops, the lag chunk hangs then drains.
- **Peak.** At 50 % HP, **Phase 2 "Kindled"**: roar, double-fist slam, runes orange→red-hot with white cores, torso cracks glow, 3 pebble minions burst out, music adds percussion.
- **Exit.** Killing blow: 220 ms hit-stop, 600 ms at time-scale 0.35, runes flash white and die, boulders tumble and bounce, 40 coins fountain then fly into the coin pill (+2,500). At +1,200 ms the **SKY CLEARED** card: **Next wave** (reforms, +15 % HP) or **Title**. Back in control in ≤ 1.8 s; coins kept.

## 4. Look

### 4.1 Palette tokens (sampled from `evidence/reference.jpg`, tuned)
| Group | Tokens |
|---|---|
| Sky / fog | `sky-zenith #4f9be8` `sky-mid #74b8f5` `sky-horizon #d3e4f6` `fog #cfe3f8` |
| Clouds | `cloud-lit #fdfdfe` `cloud-shade #c6d6ea` `cloud-deep #a9c6ea` |
| Grass | `grass-tip #d8eb7a` `grass-lit #b8d855` `grass-mid #9cc45a` `grass-shade #5f9a48` `soil-lip #8a6a4c` |
| Cliffs | `cliff-lit #a9a59d` `cliff-mid #7d8190` `cliff-shade #4b6797` |
| Stone | `stone-lit #dcc4b2` `stone-mid #b7a195` `stone-shade #7f7c84` `stone-deep #4f4b4e` `boulder-lit #d0c6c0` `boulder-shade #6f7a8a` |
| Moss | `moss #9fc34f` `moss-shade #5d8a3a` |
| Runes | `rune-core #fff1b0` `rune #ffb63c` `rune-edge #f08a24` `rune-hot #ff5a1e` `eye #ffd27a` |
| Hero | `blade #8ff1f6` `trail #7fe9ff` `trail-deep #2a9df4` `cape #3a6ad5` `cape-shade #22448f` `cape-lining #eef2fa` `hair #faf8f4` `hair-shade #c4cbe0` `tunic #2c3550` `skin #ffe1cc` `boots #3a2a22` `guard-gold #e3b84a` |
| Trees | `leaf-lit #8cc04a` `leaf-mid #5f9a3a` `leaf-shade #2f5f2c` `trunk #6a4a35` `trunk-shade #3e2c25` |
| Blossom | `blossom-lit #f8d3dc` `blossom-mid #f0a9be` `blossom-shade #d07a97` `petal #ffc8d6` |
| Temple | `temple-white #eef0f6` `temple-shade #aeb9d6` `temple-trim #3d63b5` `banner #2f56b0` `banner-trim #e9c766` `emblem #7fe3ff` `portal #a6ecff` |
| Bridge / water | `wood #b08a68` `wood-shade #6b4f3c` `rope #c9b18a` `fall-white #e8f6ff` `fall-streak #9fd0f7` `mist #f4faff` |
| Flowers | `fl-white #ffffff` `fl-yellow #ffd84a` `fl-pink #ff9fc0` `fl-blue #8fb8ff` |
| HUD | `hud-panel rgba(28,32,38,.72)` `hud-pill rgba(44,64,92,.62)` `hud-text #fff` `hud-dim #b9c3cf` `coin #f4c443` `coin-rim #ffe58a` `coin-deep #c98a1c` `hp-red #e0524b` `hp-lag #fff3e0` `hp-bg #1c3a32` `heart #ff5d6c` `dmg-outline #1f2a44` `crit #ffd23f` `crit-outline #9a4a12` `telegraph #ff7a3c` |

### 4.2 Shading ("SoftToon": one material factory)
- **Diffuse:** `MeshLambertMaterial` + `onBeforeCompile`: direct term = `mix(shadeTint, 1, smoothstep(0.0, 0.32, NdotL·shadow))`, `shadeTint = *-shade / *-lit` per material. Soft two-tone band, never black.
- **Rim** (characters, trees): `+ #fff4dc · pow(1−N·V, 3) · 0.35 · (0.4 + 0.6·NdotL01)`.
- **Lights:** Hemisphere sky #cfe6ff / ground #7a9a52, 1.15. Sun DirectionalLight #fff1d6, 2.3, to-light dir normalize(0.55, 1.0, −0.30) (up-right, slightly behind, so the golem's shadow falls lower-left as in the reference). No other lights; glows are emissive.
- **Shadows:** PCFSoftShadowMap; ortho 34×34 m on the hero, texel-snapped; 2048 High / 1024 Low; bias −0.0004, normalBias 0.025, radius 3. Casters: characters, trees, boulders, bridge. Each character also gets a blob decal (0.55× footprint, #2b3a2a 30 %).
- **Vertex AO:** rocks, trunks, golem parts darkened 22 % where `y_local < 0.25·h`.
- **Canvas textures (512²):** grass mottle `grass-mid`↔`grass-lit` + 6 % `grass-tip` speckle; cliff strata `cliff-lit`/`cliff-mid` with drip streaks; cracked stone with a rune emissive mask.
- **Fog:** `FogExp2(#cfe3f8, 0.0085)` → 20 % at 55 m, 70 % at 130 m. Sky dome: gradient `sky-zenith` → `sky-mid` (25° elev) → `sky-horizon` (0° to −30°) → `cloud-deep`, so below-horizon space reads as luminous haze.
- **Tone & grade:** `NeutralToneMapping`, exposure 1.0; grade: saturation 1.10, shadows lifted 4 % toward #2a3a5a, vignette (offset 1.05, darkness 0.22, #1a2440).
- **Bloom (High):** UnrealBloomPass half-res, strength 0.55, radius 0.45, threshold 0.85 (linear HDR, HalfFloat). Emissive ×: runes 2.4 (P2 3.6), eyes 3.0, blade 1.8, trail 2.2, emblem 2.0, portal 1.6, coins 1.3.
- **Low:** no composer; bloom = additive halo billboards (64² radial canvas, tinted, 1.6× source size, 0.55 opacity, pulsing with source); vignette as a CSS radial-gradient overlay.

| Setting | High | Low |
|---|---|---|
| Pixel ratio | min(dpr, 2) | min(dpr, 1.25) |
| Shadow map | 2048 | 1024 |
| Grass tufts / flowers | 5,000 / 260 | 2,000 / 140 |
| Cloud puffs / petals / particle cap | 70 / 60 / 400 | 36 / 24 / 200 |
| Bloom | real | halos |

Auto: touch device starts Low, else High. If frame time averages > 22 ms over 2 s, drop pixel ratio 0.25 (floor 1.0), then Low. Never upgrade mid-fight.

### 4.3 Camera
Chase rig with a **fixed look pitch** (not look-at-hero), so the hero sits low and the vista fills the top: `pos = hero + R(yaw)·(0, up, back)`, forward pitched −p. Presets interpolate linearly by aspect A:

| A (w/h) | vFOV | p | back | up | base yaw | Spawn frame (projected) |
|---|---|---|---|---|---|---|
| ≤ 0.46 phone portrait | 70° | 21° | 6.8 | 6.6 | −14° | hero sy 0.72–0.81; golem sx 0.27–0.79, sy 0.46–0.66; temple sx 0.76–0.95, sy 0.15–0.27 |
| 0.875 reference | 60° | 20° | 5.5 | 5.7 | −8° | hero sx 0.50, sy 0.80–0.92; golem sx 0.36–0.75, sy 0.43–0.71; temple sx 0.77–0.91, sy 0.07–0.22 |
| 1.78 desktop | 46° | 16° | 9.0 | 5.6 | −10° | hero sy 0.70–0.84; golem sy 0.38–0.69; temple sx 0.68, sy 0.02–0.20 |
| ≥ 2.16 phone landscape | 42° | 15° | 9.2 | 5.5 | −10° | hero sy 0.72–0.87; golem sy 0.38–0.71; temple sx 0.67 |

- **Follow:** critically damped spring, half-life 110 ms. Look-ahead 1.0 m in the move direction (half-life 350 ms), only while moving and golem ≥ 7 m away.
- **Lock-on bias:** φ = signed horizontal angle from camera forward to hero→golem. If golem < 16 m and |φ| > 10°: `yawTarget = baseYaw + clamp(0.6φ, ±60°)`, half-life 450 ms; else back to base (1,200 ms). The temple stays in view most of the fight.
- **Manual orbit:** drag on empty screen / right-mouse / Q-E: ±40° at 0.25°/px; springs back after 2.0 s idle.
- **Hit kick:** 0.06 m forward push (finisher 0.12) + ±0.4° roll, half-life 60 ms. **FOV punch** (finisher, crit): −2° in 60 ms, back over 220 ms.
- **Shake:** trauma model, offset = trauma² × (0.30 m, 1.0° roll), 22 Hz noise, decay 1.8/s. Adds: slam ≤ 6 m 0.6 (else 0.3), player hurt 0.35, finisher 0.15, crit 0.12, golem death 0.7. **Reduce shake:** ×0.25, no roll, no FOV punch, kick ×0.3.
- **Occlusion:** a canopy sphere crossing camera→hero dithers that canopy to 35 % in 180 ms (screen-door, depth stays), restores in 300 ms.

### 4.4 World layout (m)
- **Arena isle:** top disc `R(θ) = 15 + 1.4·n1(θ) + 0.6·n2(3θ)` (96 segs, 6 rings), domed `y = 0.35(1 − r²/R²) + 0.15·noise(x/6, z/6)`; 0.3 m `soil-lip` overhang; underside a noise cone 22 m deep with strata and 6 hanging rock roots. Walkable radius R − 1.0, soft wall (no falls).
- **Spawns:** hero (−0.6, 0, 4.5) facing north; Guardian mound (0.4, 0, 1.6) facing south (3.1 m apart, the reference's tight staging).
- **Framing trees** (trunk · canopy-centre height · canopy radius): **A** round (−4.2, 0, 0.5) · 4.0 · 2.4 — upper-left; **B** blossom (−3.6, 0, 6.0) · 2.6 · 1.8 — lower-left; **C** bush-tree (2.2, 0, 6.9) · 1.5 · 1.6 — lower-right; **F** (−8.5, 0, −2.5) · 4.2 · 2.6 and **G** (7.8, 0, 2.0) · 3.4 · 2.0 — landscape fill; small far trees (−6, 0, −11), (5, 0, −12) r 1.4.
- **Tree build:** tapered lathe trunk (r 0.32→0.18) with 2 forks; canopy of 7 (A, F) / 5 (B, G) / 4 (C) icosphere puffs (detail 2, noise ±12 %, radii 0.45–0.7× canopy), centre-transferred normals, canvas "leaf scallop" crevice texture (−18 %). B: 1,200 instanced petal cards on its surface.
- **Boulders** (centre, radius): (−2.8,0,2.4) 0.75 · (−3.4,0,8.0) 0.6 · (4.6,0,−3.0) 0.55 · (−7,0,−6) 0.9 · (8.5,0,−6.5) 0.7 · (−10,0,4) 1.1 · (10.5,0,6) 0.8 · (3.0,0,−9.5) 0.5 · (−1.5,0,−12) 0.6. Dodecahedron detail 1, noise ±15 %, y-scale 0.75, sunk 25 %, mossy tops, circle colliders.
- **Grass & flowers:** instanced tufts of 3 crossed 5-tri blades, 0.25–0.45 m, root `grass-shade` → tip `grass-tip`; density ×1.6 near trees/boulders, ×0.4 in a 5 m trampled circle at centre. Flowers in clumps of 3–7: 55 % white, 25 % yellow, 12 % pink, 8 % blue.
- **Bridge:** post pair P1 (6.5, 0.1, −9) → P2 (17, 3.2, −34); 27.3 m, catenary sag 0.7 m; 84 instanced planks 1.4×0.08×0.26 at 0.32 m, ±3° jitter; two rope rails 0.9 m up, sagging 0.35 m between 5 post pairs; end posts 0.32 thick, 1.6 tall, 3 rope wraps. Scenery: a soft wall at P1 shows "The way up is sealed… for now."
- **Temple isle:** top centre (24, 3.5, −44), r 10; cliff 34 m deep, 3 strata, hanging vines. Temple centred (26, 3.5, −47) facing SSW: 3 plinth steps of 0.4 m, facade 8 m wide × 7 m, two 9 m side towers, `temple-trim` cornice, portal arch 1.6×3.0 glowing `portal`. **Emblem:** 1.1 m ring holding an original "three-feather gust" glyph (three curved teardrops round the centre), rotating 6°/s. 4 banners 0.9×3.2 (`banner` + `banner-trim` chevron), 3 round trees, 2 ruined columns.
- **Waterfalls** (curved 12-segment ribbons into the cloud sea, mist sprites at the cloud line; top · width): W1 (16, 3.0, −44) · 2.4; W2 (33, 3.0, −42) · 3.0; W3 (10, 7.5, −57) · 1.2 off the spire; W4 (−3, −0.2, −15.4) · 1.0 off the arena's north cliff.
- **Spire isle** (10, 8, −58) r 3: rock column, grass cap, broken pillar, 2 cypress cones (the green towers left of the temple in the reference).
- **Distant isles:** 5 islets r 4–9 at (−60,−4,−90), (−35,6,−130), (70,−8,−110), (110,2,−40), (−90,−10,20).
- **Cloud sea:** plane y −24, r 400, 2-octave canvas clouds scrolling 0.004 uv/s, edge fades to `cloud-deep`; 70 instanced puff clusters (flattened icospheres, SoftToon) at y −20…−12 in a 30–180 m ring, drifting +x at 0.4 m/s and wrapping; 8 painted cumulus billboards at 300 m.

### 4.5 Characters
**Hero "Aster"** (original; head:body 1 : 1.3, 1.25 m). Head sphere r 0.27 at y 0.98; 13 spiky `hair` cones (0.12–0.26 m) swept back-up plus 2 bangs; eyes 0.07×0.10 #1e2a4a with white highlight; torso capsule 0.26×0.34 at y 0.58 (`tunic`, white collar, gold buckle); arm capsules r 0.07; stubby legs 0.22 with `boots`. **Cape:** 6×8 plane 0.55×0.62 from the shoulders, `cape` / `cape-lining`, original white upward-chevron sigil; 3-joint spring chain (k 70, damping 9), trails velocity up to 55°, idle sway 4° at 0.6 Hz. **Sword:** 0.72 m extruded-diamond crystal blade (`blade`, emissive 1.8), `guard-gold` crossguard, 0.14 m dark grip.

**Stone Guardian** (3.4 m, collider r 1.5): 14 separate boulder meshes in a joint hierarchy; each bobs independently (0.03–0.06 m, period 1.6–2.4 s, random phase), so it reads as *held together by magic*. Torso: noise dodecahedron 1.5×1.3×1.1 at y 1.85 with moss cap. Head: rounded box 0.75×0.65×0.6 floating 0.08 m above the torso at y 2.95, overhanging brow, two `eye` slits 0.16×0.06. Shoulders r 0.55 ×2; small upper-arm boulders ×2; fists r 0.62 hanging to y 0.7 at x ±1.9; pelvis; 2 legs of 2 boulders. **Runes** (original canvas glyphs as decals 0.01 m off the surface, `rune` with a `rune-core` centre line): chevron-in-diamond on the chest (0.55 m), broken ring + dot on each fist (0.4), three stacked bars on each shoulder (0.25). Rest pulse ×(0.85 + 0.15·sin(2πt/2.2)); telegraphs ramp the attacking limb to ×2.2. ~30 % of top surfaces `moss`.

**Pebble minions** (P2 only, 3 × 0.6 m): one boulder, one eye rune, pebble feet; hop at 2.2 m/s; 2,500 HP; bump ½ heart after a 400 ms squash telegraph; pop into 6 shards + 3 coins.

### 4.6 Type & HUD
- **Font:** `ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif` (system only). Scale 12/14/17/20/28/40/64 px, weights 600–800. Spacing 4/8/12/16/24/32. HUD inside `env(safe-area-inset-*)` + 12 px.
- **Coin pill** (top-right): 40 px tall, radius 20, `hud-pill`, 10 px backdrop blur; 34 px coin overlapping the left end by 4 px (`coin` disc, `coin-rim` 2 px bevel, `coin-deep` lower crescent, original 4-point star stamp); count 20 px/800 white, tabular, comma-grouped, starts **12,580**. Gear 30 px white 12 px to its right.
- **Hearts** (top-left): 5 × 22 px (gap 4) on a 36 px `hud-pill`; `heart` with 3 px white highlight and 1.5 px `dmg-outline`; empty = #ffffff33 outline; half-steps.
- **Boss nameplate:** projected at golem head + 1.0 m, clamped with 8 % inset. "Stone Guardian" 17 px/700 white, 2 px `dmg-outline` shadow; bar 168×10 px (portrait 150), radius 5, `hp-bg` track, `hp-red` fill, `hp-lag` chunk, 1.5 px #0e1a1a border. P2: a 6 px ember icon before the name; from wave 2, "Wave n" 12 px under the bar.
- **Damage numbers:** 800 weight, tabular, comma-grouped. Normal 28 px white with 3 px `dmg-outline` stroke; crit 40 px `crit` with `crit-outline` + 4-ray sparkle. Origin hit point + 0.3 m, x jitter ±18 px.
- **Touch** (`pointer: coarse`): **joystick** spawns where a touch starts in the left 45 % below sy 0.35; base 132 px (#ffffff22 disc, #ffffff55 1.5 px ring), knob 58 px #ffffffcc, travel 50 px, dead zone 8 px, output `min(1, d/50)^1.3`; ghost at left+92, bottom+120 at 30 %. **Attack** 88 px at right+24, bottom+36 (#ffffff2e, 2 px #ffffff80 ring, 36 px sword glyph). **Dodge** 64 px, 112 px left of Attack's centre and 10 px lower. **Skill** 64 px, 26 px left and 104 px above Attack's centre, conic cooldown sweep (#0008) + seconds in 14 px. Hit areas visual + 12 px; all fire on `pointerdown`.
- **Desktop:** WASD/arrows move, J or left-click strike, Space roll, K skill, Q/E orbit, Esc pause; a 12 px legend bottom-centre fades after 8 s. **Gamepad:** LS move, A strike, B roll, X skill, RS orbit, Start pause.

### 4.7 Motion language
| Use | Timing | Easing |
|---|---|---|
| UI enter / exit | 220 / 160 ms | cubic-bezier(.2,.9,.3,1.2) / ease-in |
| Button press / release | scale 0.92 in 90 ms / back in 140 ms | ease-out / easeOutBack |
| HP lag chunk | hold 450, drain 600 | easeInOutCubic |
| Damage number | scale 0.4→1.25 at 90→1.0 at 180; rise 48 px over 800; fade last 250; life 900 (crit 1,100) | easeOutBack, then easeOutQuad |
| Coin fly to pill | 650 per coin, 25 ms stagger, screen-space arc | easeInCubic |
| Pill bump | 1.12 in 80, back in 160 (≤ 1 per 60 ms); last digit flashes `crit` 120 | ease-out |
| Panel slide | x −16 px→0, opacity 0→1, 220 | easeOutCubic |

## 5. Feel
**Movement:** 5.6 m/s; accel 45 m/s² (full speed in 125 ms), decel 60 m/s². Turn 1,080°/s moving; 180°/s during attack startup, 0 in active/recovery. Run cycle 2.6 steps/s, 0.04 m bob, 6° lean, 3-particle dust puff every other step. Input buffer 200 ms (attack, dodge, skill).

**Combo** (arc 150°, reach 2.6 m to the golem's collider surface; lunge during startup):
| Hit | Startup | Active | Recovery | Next opens | Lunge | Damage | Hit-stop | Poise |
|---|---|---|---|---|---|---|---|---|
| 1 slash R→L | 90 | 80 | 230 | 170 | 0.6 | 1,800–2,200 | 60 | 10 |
| 2 backslash L→R | 100 | 90 | 250 | 190 | 0.6 | 1,950–2,350 | 70 | 10 |
| 3 leaping spin overhead | 180 (0.35 m hop) | 120 | 420 | — | 1.2 | 2,600–3,100 | 120 | 30 |

Combo resets 450 ms after recovery; any recovery cancels into dodge. **Crit** 15 %, ×1.6, +40 ms hit-stop. Staggered golem takes ×1.25. **Skill "Gale Crescent":** 360° spin + outward crescent wave, r 3.4, 2 ticks 160 ms apart of 2,400–2,800 (poise 20), startup 140, recovery 380, cooldown 8 s; ready = 1-frame white ring flash + "ting".

**Dodge roll:** 380 ms, 4.2 m (easeOutQuad), stick direction (backward if neutral); i-frames 40–300 ms; 250 ms lockout; squash 0.85/stretch 1.15 over 60 ms; 4 dust. **Perfect dodge** (active frame inside i-frames): 120 ms at time-scale 0.5, cyan afterimage, next hit +20 %.

**Every landed hit:** hit-stop (both actors at time-scale 0; particles keep running); target white flash (emissive +1.0 one frame, fade 80 ms); the struck golem part jolts 0.08 m along the hit, returning in 140 ms (easeOutBack); 6 stone chips (finisher 12) + dust ring + 8 cyan sparks, 3–6 m/s, life 350 ms, gravity 14; camera kick; number pop.

**Slash trail:** ribbon of 20 samples over the last 140 ms, from hilt to 1.3× tip radius (bigger than the sword, as in the reference); alpha 1→0 with age; colour white edge → `trail` → `trail-deep`; additive, emissive 2.2. Hit 3 leaves a ground crescent decal for 250 ms.

**Hurt:** 350 ms flinch, 2.5 m knockback (easeOutCubic), 1,000 ms i-frames with 10 Hz white flicker, hearts shake ±3 px for 200 ms, red edge vignette #ff3b3b 25 % for 300 ms. At 0 hearts: 600 ms slow-mo knee drop, then FALLEN.

**Stone Guardian** (ms; P2 in brackets):
| Attack | When | Telegraph | Active | Recovery | Damage / shape |
|---|---|---|---|---|---|
| Overhead Slam | dist ≤ 4.5 | 900 [650]: fists rise overhead, fist runes ×2.2, eyes flare; decal r 2.2 at 2.4 m ahead fills `telegraph` centre-out, 2 px white outline | 150 | 1,300 [1,000], fists stuck = punish | 2 halves in the circle; **shockwave ring** 0→7 m in 450 ms, band 0.7 m, ½ heart, beaten by roll i-frames |
| Arm Sweep | dist ≤ 3.6, hero on a flank | 700 [520]: arm swings back, runes flare, 200° arc decal r 4.0 | 250 | 800 [650] | 2 halves + 3 m knockback |
| Boulder Toss | dist > 6 | 800: tears a boulder off its back | 900 flight, apex 6 m | 700 | 1 half, r 1.4; target decal at hero + velocity·0.4 s, shrinking ring |
| [P2] Double Slam | dist ≤ 5 | 650, second slam 500 later | 150 ×2 | 1,400 | as Slam, two shockwaves |

Walk 1.6 [2.0] m/s, turn 90 [120]°/s; ≥ 600 ms between a recovery and the next attack; picks an in-range attack, weight ×0.4 if used last. **Poise** 100 → **stagger** 2,000 ms (kneels, eyes 30 %, runes flicker, 3-star daze orbit, ×1.25 damage taken); poise resets 4 s after the last hit; normal hits never interrupt a telegraph. **HP** 60,000 × 1.15^(wave−1); phase 2 at ≤ 50 % (wave ≥ 2: 60 %). Target fight 60–90 s.

**Juice:** squash/stretch 0.85/1.15 on landings and rolls; all UI pops easeOutBack (s 1.7); every golem attack begins with a 120 ms backward lean of anticipation; particles pooled.

## 6. Ambient life
- **Grass:** `bend = (0.07 + 0.05·gust)·h²·sin(1.7t + 0.35x + 0.27z)`; gust = a noise band travelling +x at 3 m/s that darkens tips 6 %, so wind visibly crosses the meadow.
- **Canopies:** scale 1 ± 0.015 at 0.25 Hz, sway ±1.2° at 0.4 Hz.
- **Petals:** 60 [Low 24] cards fall from B at 0.35 m/s, 0.3 m spiral, 2 rad/s spin, carried by wind across the arena, fade at 12 m, respawn.
- **Waterfalls:** streak UV scroll 1.4/s plus a second layer at 0.9/s, lip foam, mist pulsing 0.5 Hz.
- **Clouds** drift (§4.4). **Cloud shadows:** 1-octave noise multiplies the sun 0.85–1.0, scrolling 0.6 m/s.
- **Banners:** `0.12·u·sin(3t − 4u)` (u 0 at pole → 1 at tip).
- **Birds:** 3 flocks of 4 V-quads circling the temple isle at r 18 m, 0.35 rad/s, flapping 5 Hz.
- **Temple:** emblem rotates; portal shimmer 1.6 ± 0.2 at 0.7 Hz; 20 light motes rise near the portal.
- **Hero idle:** breath 1 ± 0.02 at 0.5 Hz; after 6 s, sword to shoulder, gazes at the temple.

## 7. Sound (synthesized WebAudio only)
Buses: Music −14 dB, SFX −6, Ambience −18 → DynamicsCompressor (−10 dB, 4:1). Music ducks −6 dB for 300 ms on slams, crits, the kill. Hero hits and golem telegraphs are never culled; footsteps and particles capped at 4 voices.

| Event | Recipe |
|---|---|
| Swing ×3 (pitch 1.0/1.12/0.9) | white noise, band-pass sweep 2.4 k→800 Hz, 140 ms |
| Hit on stone | triangle 180→90 Hz in 80 ms + high-passed (3 k) noise click 20 ms + 2.2 kHz "chink" 60 ms |
| Crit | hit + bell (1,320 + 1,980 Hz sines, 400 ms decay) |
| Dodge / footstep | noise whoosh, low-pass 1.2 k→300 Hz, 260 ms / low-passed tick 30 ms, pitch ±10 % |
| Skill | saw 300→900 Hz band-passed + whoosh, 360 ms; ready "ting" 2.6 kHz |
| Golem telegraph | 55 Hz sine, 6 Hz tremolo, crescendo over the telegraph + 220 Hz rune hum rising a fifth |
| Slam | 70→35 Hz thump 400 ms + noise crash low-passed 800 Hz + gravel rattle (12 clicks) |
| Sweep / toss landing | low whoosh 400 ms / slam at −6 dB |
| Player hurt | "hup": band-passed square 330 Hz 120 ms + thud |
| Phase 2 roar | 3 detuned 70 Hz saws, low-pass 300→1.2 k over 900 ms + sub hit |
| Death crumble | 14 staggered rock thunks over 900 ms, rune hum glides down to silence |
| Coin arrival | 1,568 + 2,093 Hz sines 80 ms, +1 semitone per 5 coins (cap +12) |
| UI tap / toggle | 1 kHz blip 40 ms / two-note blip |
| Intro assembly | per part a 600 Hz triangle clack 30 ms; then a two-tone horn (fifth, low-passed saws) |

**Ambience:** wind (pink noise, LP 400 Hz, 0.1 Hz swell); waterfall hiss (band-passed noise, gain by distance to the nearest fall); bird chirps (FM sine 2–4 kHz) every 4–9 s. **Music** (procedural, 88 BPM, D major pentatonic): Title = warm pad + bell arpeggio; Fight = + plucked bass + low taiko pulse; Phase 2 = 96 BPM + 16th arpeggio + frame drum; Victory = I–IV–I(add9) stinger → title layer; Fallen = 2-note descending stinger → pad. Crossfades 1.5 s.

## 8. Loops, onboarding, menus, failure
- **Core (seconds):** read the telegraph → roll → punish the recovery with a combo → spend the skill on staggers. **Session (minutes):** waves of ~75 s; each wave HP ×1.15, reward +20 %. **Slice:** coins accumulate; the victory card shows the best wave this session (no saving).
- **Onboarding by doing:** ghost joystick + breathing Attack; on the first telegraph the Dodge button pulses `telegraph` once and "Roll through it!" shows at sy 0.62 for 1.5 s; on the first stagger the Skill button pulses. Each hint once; no text walls.
- **Pause** (gear, Esc, Start, `visibilitychange`): `hud-panel`, 14 px blur, radius 18, top-left at safe-area + 12, width min(360 px, 84 vw); rows 56 px, 20 px padding, 22 px original line icons (1.75 px white stroke), labels 17 px/600 uppercase, tracking 0.04 em, #e9edf2; values right-aligned 14 px `hud-dim`; 1 px #ffffff14 dividers; 30 % scrim; world frozen. Rows: **RESUME** (triangle) · **SOUND** On/Off (speaker) · **QUALITY** Auto/High/Low (faceted gem) · **REDUCE SHAKE** Off/On (wave with slash) · **RESTART FIGHT** (circular arrow; first tap shows "TAP AGAIN TO RESTART" for 2 s).
- **Victory card:** centred `hud-panel` 320×210, overshoot entry; **SKY CLEARED** 28 px/800 `crit`; "+2,500 coins" · "Wave 1 · 1:12"; **NEXT WAVE** (primary: `cape` fill, white, 48 px) and **TITLE**.
- **Fallen card:** **FALLEN** 28 px white; "The Guardian holds the bridge. Again?"; **TRY AGAIN** (primary) and **TITLE**; coins kept.
- **Restart / next wave ≤ 1.8 s:** 300 ms fade → 1,200 ms reform (shortened intro) → 300 ms nameplate fade.

## 9. Voice
Warm, brief storybook with a wink. Title subtitle: "A quiet isle. A stone that remembers." · Prompt: "Tap to begin" (desktop "Press any key") · Hints: "Drag to move", "Strike!", "Roll through it!", "Unleash Gale Crescent" · Phase 2 banner (40 px, sy 0.30, 1.2 s): "The Guardian kindles." · Bridge: "The way up is sealed… for now." · Victory subline: "The runes go quiet. For a while."

## 10. Accessibility & comfort
- Pause anywhere, auto on tab hide.
- Reduce shake (§4.3); on by default under `prefers-reduced-motion`, which also removes slow-mo, FOV punch and the red hurt vignette.
- Telegraphs never rely on colour: pose + outlined decal that fills toward impact + rising sound. P2 runes change brightness and gain a white core as well as hue.
- No full-screen flashes; the death flare is local and ≤ 2 frames at peak.
- Touch targets ≥ 64 px visual, ≥ 76 px hit area; one thumb per side.
- Text ≥ 12 px, outlined (≥ 4.5:1). No speech; sound off is one tap.

## 11. Frame table (the polish-critic captures these)
Capture at **430×932** and **1280×720**; F2 also at **802×917** beside `evidence/reference.jpg`. A seeded script drives each trigger (fixed RNG, forced crit/damage where stated). Positions are for the reference aspect unless noted.

| # | Moment (trigger + t) | What is on screen | Why it is composed |
|---|---|---|---|
| F1 | **Title** (boot + 3 s) | Live orbiting scene, temple isle and two waterfalls in the right half. **SKYREST** 64 px (portrait 48)/800 white, 4 px `temple-trim` stroke, shadow 0 4 24 #2a4a8a66, centred sy 0.30; subtitle 17 px sy 0.37; "Tap to begin" 20 px sy 0.78 pulsing 0.55↔1 at 0.8 Hz. No HUD. | World first; the wordmark sits in open sky, never over the temple. |
| F2 | **Reference parity:** first combo hit (forced 2,368, no crit) + 120 ms | Hero sx 0.50, sy 0.80–0.92, mid-slash R→L; cyan crescent from sx 0.42 to 0.62 across sy 0.70–0.88. Guardian sx 0.36–0.75, sy 0.43–0.71, orange runes, lit eyes, shadow falling lower-left. Nameplate centred sx 0.57, sy 0.36, bar ≈ 96 % with a white lag sliver. "2,368" white at sx ≈ 0.70, sy 0.48. Tree A sx 0–0.31, sy 0.20–0.55; blossom B sx 0–0.29, sy 0.65–0.95, petals falling; C enters at sx > 0.92, sy > 0.80. Temple sx 0.77–0.91, sy 0.07–0.22 with glowing emblem and banners; bridge sx 0.75/sy 0.44 → sx 0.77/sy 0.24; W1 (sx 0.68) and W2 (sx 0.99) falling into cloud sea. Coin pill "12,580" + gear top-right; hearts top-left. | The Owner's screenshot rebuilt in our own design. Diagonal read: hero (bottom-centre) → golem (middle) → temple (upper right). Three fog-separated planes: foliage near, arena mid, temple + cloud sea far. Left half stays calm, echoing where the reference's panel sat (F11). |
| F3 | **Mid-combo:** hit 2 + 40 ms (inside hit-stop) | Both actors frozen; backslash trail L→R; golem's left fist jolted with white flash; 6 chips + 8 sparks mid-air; two stacked numbers (first fading at +40 px, second at scale 1.25); lag chunk ≈ 4 % white right of the red fill. | Hits stack; the freeze is the crispest read of trail, flash and particles. |
| F4 | **Crit finisher:** hit 3, forced crit + 60 ms | Hero 0.35 m airborne in the overhead spin; vertical crescent trail + ground crescent decal; gold **"4,512"** 40 px with sparkle above the golem's head; FOV −2°, trauma 0.15. | Biggest reward: gold, cyan, orange accents each in their own region. |
| F5 | **Slam telegraph** + 600 ms | Fists raised so the silhouette reaches sy 0.30 (portrait: nameplate nudged up 24 px if they meet); fist runes ×2.2 with halos; eyes flared; decal r 2.2 between golem and hero 67 % filled, white outline; Dodge pulses orange (first time). | Danger in one glance: high pose, hot colour, the floor says *where*; the hero is still outside it. |
| F6 | **Slam impact** + 80 ms | Fists buried; white-cored shockwave at r ≈ 1.5 m; dust ring (24); dark crack decal; trauma 0.6; if rolling, a cyan afterimage (perfect dodge). | Weight via shake, dust, stuck fists; the afterimage rewards the right action. |
| F7 | **Player hurt** (sweep connects) + 100 ms | Hero tumbling back, flickering; heart 2 halving with ±3 px shake; red edge vignette 25 %; golem in follow-through. | Pain clear but brief; the HUD shows the exact cost. |
| F8 | **Phase 2** (HP crosses 50 %) + 900 ms | Golem mid-roar, head tilted back 20°; runes `rune-hot` with white cores at ×3.6; glowing torso cracks; 3 pebbles popping out 1.5–3 m away; "The Guardian kindles." at sy 0.30; ember icon by the name; sun warmed to #ffd9b0 and ambient −8 %. | The palette shift is the announcement; hot runes become the brightest thing on screen. |
| F9 | **Death + coins** (killing blow + 700 ms) | 14 boulders mid-air or bouncing; runes dead grey; dust cloud; 40 coins (0.22 m spinning discs with a glint) at the top of a 2.5 m fountain; nameplate fading; time-scale 0.35. | Release: the hot shape becomes parts and gold. |
| F10 | **Victory** (kill + 2,600 ms) | Coins mid-arc into the pill; pill bumping, count rolling past 13,000; **SKY CLEARED** card centred at sy 0.45 with NEXT WAVE / TITLE; camera risen 1.2 m, orbiting 4°/s; temple emblem at ×1.5. | Closure plus a clear next step; the world stays visible. |
| F11 | **Pause** (gear + 300 ms) | Panel top-left (portrait sx 0.03–0.87, sy 0.03–0.40; desktop 360 px): RESUME · SOUND On · QUALITY Auto · REDUCE SHAKE Off · RESTART FIGHT; 30 % scrim; world frozen mid-pose under blur. | The reference's placement and translucency with our own items and icons. |
| F12 | **Portrait phone** 430×932, fight idle | Hearts top-left, pill + gear top-right inside the safe area; hero sx 0.50, sy 0.72–0.81; golem sx 0.27–0.79, sy 0.46–0.66; temple sx 0.76–0.95, sy 0.15–0.27; joystick ghost and button cluster only at sy > 0.82. | Thumbs below, action mid, vista on top; hero at sy 0.81 so controls own the bottom 18 %. |
| F13 | **Landscape phone** 932×430, fight idle | Hero sy 0.72–0.87; trees A and F frame the left third, G the right; temple sx ≈ 0.67, sy ≤ 0.20; joystick bottom-left and buttons bottom-right, clear of both notches. | Width is spent on depth, never a bigger hero. |

## 12. The polish list
1. Shadowed cliff faces read blue-grey (≈ #4b6797 ± 15 per channel), never neutral grey.
2. Every character and tree shows a warm rim on its sun-side silhouette.
3. Golem parts bob out of phase: two captures 500 ms apart differ per part.
4. The slash trail is longer than the sword (≥ 1.3× tip radius) and fades out; no hard end cap.
5. Hit-stop is 60/70/120 ms per hit (unit-tested on the combat timeline).
6. Damage numbers are comma-grouped, tabular, outlined, legible over sky and grass.
7. Crits are gold, 40 px, sparkled; normal hits are never gold.
8. The HP lag chunk holds 450 ms then drains; on the killing blow the whole bar empties together.
9. The nameplate never leaves the screen or overlaps the coin pill.
10. The coin count ticks per arriving coin (no jump) and the pill bumps each time.
11. Buttons answer on pointerdown: visible scale 0.92 within 90 ms.
12. The joystick appears under the thumb; release stops the hero within 100 ms, no skid.
13. Every golem attack has a ground decal that is exactly 100 % full at its active frame.
14. A perfect dodge leaves a cyan afterimage and slows time for 120 ms.
15. Trees between camera and hero dither-fade; the hero is never hidden > 180 ms.
16. A wind gust band visibly crosses the meadow at least every 6 s.
17. Petals drift across the arena, not straight down.
18. Waterfalls scroll and dissolve into mist at the cloud sea; their bottoms are never seen.
19. The temple emblem rotates and blooms: the brightest point in the far plane.
20. The cloud sea and cloud shadows both move.
21. Phase 2 changes rune hue, brightness and music within 100 ms of the roar.
22. Crumbled boulders bounce once (restitution 0.3), settle, sink and fade over 1.5 s; nothing pops out of existence.
23. Restart or Next wave reaches control in ≤ 1.8 s with coins kept.
24. Pause freezes everything, particles included; music pauses and resumes with a 200 ms fade.
25. No HUD on the title; hearts and pill slide in (220 ms) when control begins.

## 13. Anti-goals
- **Never grey:** no neutral shadows, no untextured planes, no default Three.js lighting look.
- **Never mush:** bloom only on emissive sources; foliage and stone stay crisp.
- **Never top-down tactical:** sky and vista always fill the top ~25 % of the frame.
- **Never cheap danger:** no untelegraphed damage or chain-stun.
- **Never copied:** no reference logo, menu labels (Preview, Assets, Code, Dashboard, Multiplayer), emblem glyph or character likeness.
- **Never a slideshow:** smooth beats pretty; Auto drops to Low.

## 14. Acceptance by eye
- **F2 beside the reference (802×917)** passes when: (a) palette matches — sky blue top, yellow-green meadow, warm-grey golem with orange runes, pink blossom lower-left, white-and-blue temple upper-right; (b) camera matches — hero seen from behind and above, low-centre, vista above; (c) every listed element is within ±0.06 of its stated sx/sy; (d) the far isle is visibly hazier than the arena.
- **F3–F10:** every element named in the row is present. **F12/F13:** no control overlaps the hero, golem body or nameplate.
- **Motion:** two idle captures 1 s apart differ in grass, petals, falls, clouds, banners, emblem, golem parts.
- **Telemetry** (High, F2): ≤ 250 draw calls, ≤ 1 M tris.

## Fold-ins
No bake-off (the reference fixes the direction). Raised: perfect dodge, poise/stagger, Gale Crescent skill, P2 minions, scaled waves, per-aspect camera presets solved numerically.
