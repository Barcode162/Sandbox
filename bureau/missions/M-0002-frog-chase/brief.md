# M-0002 — Frog river chase

| | |
|---|---|
| Tier | 2 (Squad) · levers: bakeoff, polish |
| Domain / playbook | game |
| Output | `projects/frog-chase` |
| Dossier | `bureau/missions/M-0002-frog-chase` |
| Opened | 2026-11-20 |
| Program | — |

## The ask (verbatim)
> So I want to have a game that's about frogs jumping from lillypad to lillypad and I have to cross the river as fast as possible as I'm getting chased my an alligator

## What the Owner actually wants
A small, instantly fun browser arcade game. You are a frog. You hop pad to pad across a river. An alligator is coming for you, so every hop is a race. Speed matters: the clock is the score. The Owner describes themselves as "a human with easy brain": the game must be understood in seconds with zero reading. One key or one tap per action.

## Definition of exceptional
1. **Playable in 3 seconds without instructions.** From page load, a first-time player makes a successful hop within 3 s, guided only by what is on screen (the next pad visibly invites the hop).
2. **Every hop feels great.** Each jump has anticipation (squash), an arc with a shadow, a landing (stretch, ripple, pad dip, splash sound), all within 350 ms total. Input is buffered so a fast tapper is never ignored.
3. **The alligator is felt, not explained.** You always know how close it is: its eyes and snout on screen, a rising heartbeat/music tempo as it nears, and a screen-edge tint. A near-miss feels like a near-miss.
4. **A run is short and the retry is instant.** One crossing lasts 20–60 s. Getting eaten or falling in shows the result and restarts in under 1 s with one key/tap. Nothing punishes a retry.
5. **Speed is the score and it's worth beating.** A live timer, a best time saved locally, and a celebratory finish that shows "new best" when earned.
6. **The river is alive.** Water moves, pads bob and drift, light sparkles, small life (dragonflies, reeds) fills the frame. No screen is empty or static.
7. **Original and cohesive.** An original look and characters, procedural art and synthesized audio, one consistent style.
8. **Same game at any frame rate.** Fixed-timestep simulation; identical outcome at 30 and 144 Hz.

## Scope
- **In:** a single-page browser game (2D); title screen, play, eaten/fall fail, finish/win, pause; keyboard + touch (gamepad if cheap); a river crossing with drifting/sinking pads and a chasing alligator; timer and local best time; synthesized SFX and simple music; mute and reduced-motion options; responsive 375–1920 px; `npm run verify` with unit tests, a headless boot, scripted playthroughs, frame-rate independence and screenshots.
- **Out (and why):** multiple levels and progression systems (a toy game; one excellent river beats many plain ones); online leaderboards (needs a backend and publishing approval); deployment (needs the Owner's go-ahead).
- **Milestones:** single mission.

## Constraints & assumptions
- [A1] TypeScript + Vite, Canvas 2D (or PixiJS if the architect justifies it). All art procedural; all audio Web Audio synthesized. No network assets at runtime.
- [A2] Controls are dead simple. The designer decides the exact hop model (e.g. one key = hop forward to the next pad, left/right to choose a lane), but a player must never need to aim precisely.
- [A3] The river is seeded/procedural so tests are deterministic; a daily or fixed seed is fine.
- [A4] Owner communication: very short, plain-language updates.

## Success criteria
1. `npm run verify` in `projects/frog-chase` exits 0 here: typecheck, unit tests, headless boot with zero console errors, a bot that completes a crossing, a bot that gets caught, a 30 Hz vs 144 Hz determinism check, screenshot capture.
2. Restart after fail is under 1 s (measured).
3. Every player action has a visual and an audio response (juice audit passes).
4. Works at 375×812 with touch and at 1440×900 with keyboard; no overflow.

## Lessons in force
- L-0001: tier sizes headcount, not the bar. Tier 2 + bakeoff, polish.
- L-0002: bake-off as ≤ 450-word direction cards, not specs.
- L-0003: spend the spec on frame tables.
- L-0004: freeze contracts as code; few vertical slices.
- L-0005: resume agents; waves ≤ 4.

## Risks known at intake
- The genre is close to a famous road-and-river crossing arcade game. Mitigation: original look and characters, and the chase-and-speed structure makes it its own game; no lanes of traffic, no borrowed art or names.
- Game feel decides everything. Mitigation: bake-off on direction and feel numbers in the spec.
- Difficulty tuning: the alligator must be scary but fair. Mitigation: tunable constants, a bot-tested crossing time window.
