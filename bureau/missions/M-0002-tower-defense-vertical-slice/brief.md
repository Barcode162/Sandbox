# M-0002 — Tower defense vertical slice

| | |
|---|---|
| Tier | 3 (Division) · levers: polish |
| Domain / playbook | game |
| Output | `projects/tower-defense/` |
| Dossier | `bureau/missions/M-0002-tower-defense-vertical-slice/` |
| Opened | 2026-11-20 |
| Program | Milestone 1 of a tower-defense Program (Charter X) |

## The ask (verbatim)
> I need to use bureau 2.0 to build a btd 6 like game

Owner-approved slice (session): one original map, 4 original towers with 2 upgrade paths each, ~20 rounds, title/pause/settings/game-over, synthesized audio, TypeScript + Canvas in the browser, original theme. Tier 3 + polish.

## What the Owner actually wants
The pleasure of the genre: place a few towers on a winding path, watch a swarm of layered enemies get *peeled* — each hit stripping a layer and spitting out a smaller, faster child — and feel the run escalate from a trickle into a screen-filling storm that your upgraded defence shreds. Readable at a glance, juicy on every hit, "one more round" by round 5. Genre and mechanics are free; the world, names, art and look are ours. **No monkeys, no balloons, no borrowed UI.**

Working theme (designer may refine, not replace without reason): **an original hand-made world** — e.g. a papercraft/ink garden defended by origami creatures against layered ink blots. Enemies are layered *blots* that peel into smaller blots; towers are original creatures/devices.

## Definition of exceptional
1. **Peel is the hero.** Every hit on a layered enemy produces a visible, audible pop and its child appears in the same place, a different colour and speed; at 300+ enemies on screen during round 18–20 each pop still reads.
2. **First 30 seconds teach by doing:** from title to the first tower placed in ≤ 3 clicks, with the path, range ring and placement validity visible before the click. No wall of text.
3. **Every tower is distinct by silhouette, attack and sound,** and each of its 2 upgrade paths visibly changes the tower sprite and how it plays (not just +10% numbers). A player can tell all 4 towers and both paths apart from a screenshot.
4. **The run escalates:** rounds 1–20 introduce at least 5 enemy kinds (incl. a fast one, an armoured/shielded one that ignores some damage types, a camouflaged one that needs detection, and a round-20 boss with a health bar), so the 2-path choices matter.
5. **Never dead air:** speed toggle (1×/2×), auto-start next round option, money/lives deltas float and animate, between-round shop is instant.
6. **Deterministic:** the same placement script + seed gives the same lives/money/pops at round 20 at 30 Hz and 144 Hz render rates.
7. **Pause anywhere, restart in < 2 s,** settings for volume (music/SFX), reduce-motion/shake, colourblind-safe enemy signals (shape/pattern, not only colour).

## Scope
- **In:** 1 map (single winding path, decorative, original); 4 towers × 2 upgrade paths × 3 tiers (only one path may go past tier 1? — designer decides the crosspath rule, keep it simple); sell for partial refund; targeting priority (first/last/strong/close); ~20 rounds with a boss at 20; 5+ enemy kinds incl. layered peel; lives, money, round counter; title, pause, settings, victory, game-over, restart; Web Audio synthesized SFX + a light music loop; keyboard + mouse (hotkeys for towers, space = start/speed, esc = pause); responsive canvas 1280×720 logical, scales to window.
- **Out (and why):** more maps, heroes, abilities, meta-progression/XP, freeplay past 20, saves beyond settings, gamepad/touch (later milestones; keep the slice deep, not wide).
- **Milestones:** M1 this slice → M2 second map + 2 towers + active abilities → M3 meta-progression, difficulty modes, touch.

## Constraints & assumptions
- [A1] TypeScript + Vite + Canvas 2D, no runtime deps beyond Vite; all art procedural (canvas drawing), all audio synthesized. No paid generation.
- [A2] Fixed 60 Hz simulation decoupled from rendering, seeded RNG; the simulation is pure and unit-testable without a DOM.
- [A3] Performance proxy: sim step ≤ 4 ms with 500 enemies + 30 towers + 1,000 projectiles in headless Chromium; no per-frame allocation in hot loops (pools).
- [A4] `npm run verify` = typecheck + unit tests + headless boot (zero console errors) + scripted playthrough + frame-rate-independence test + screenshots + perf probe.

## Success criteria
1. `npm install && npm run verify` is green from a clean clone.
2. A scripted bot can play rounds 1–20 to victory with a fixed placement script; another loses and reaches game-over; restart resets state.
3. All 4 towers × 2 paths × 3 tiers are purchasable and visibly distinct (screenshot set).
4. Peel works for every layered kind (unit tests on child spawning, carry-over damage, positions).
5. Determinism test passes at 30 and 144 Hz.
6. Perf probe meets [A3].
7. Polish-critic frames (title, first placement, round 1 in motion, round 15+ storm, boss, upgrade panel, pause/settings, game-over, victory) all read as composed, finished frames.
8. Board ship vote ≥ 8.0 from director-vision and director-engineering, zero open S0/S1/S2.

## Lessons in force
- L-0001 tier sizes headcount, never the bar.
- L-0003 spend the spec on frame tables; cut traceability and appendices.
- L-0004 freeze contracts as code; few vertical slices.
- L-0005 resume agents with SendMessage; waves ≤ 4.

## Risks known at intake
- **Derivative look:** drifting into a recognisable clone. Mitigation: original theme locked in the spec; director-vision checks.
- **Perf at storm scale:** naive per-enemy collision O(n·m). Mitigation: spatial grid, pooling; perf probe in verify.
- **Balance:** 20 rounds untested by humans. Mitigation: the simulation bot plays the whole run; difficulty curve tabulated in the spec.
- **Scope creep in upgrades:** 24 upgrade tiers is the bulk of content; keep them data-driven in one table.
