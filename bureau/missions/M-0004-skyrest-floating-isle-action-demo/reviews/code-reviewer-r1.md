# Review — code-reviewer — whole product — round 1 — M-0004

VERDICT: PASS WITH FINDINGS

## Scope reviewed
`projects/skyrest/src`, read in order of risk: `app/game.ts`, `app/hooks.ts`, `core/{sim,flow,fixed-step,intent}.ts`, `hero/{sim,combat}.ts`, `golem/sim.ts`, `input/{index,touch,link}.ts`, `render/{renderer,quality}.ts`, `ui/index.ts`, `audio/index.ts` (unlock, pause, event map), `world/view.ts` (quality, update). I also scanned every view for allocations. No git base exists, so I read the files directly.

## Method
- `npx tsc --noEmit -p .` is clean, and `npm run test:unit` gives `# fail 0`. As the CEO ordered, I did not re-run the full verify.
- I confirmed the pause defect with a script: `createFixedStepper().advance(0.05, () => s.reset())` returned `alpha -1, acc -0.0167`.
- Fakes grep (`TODO|FIXME|XXX|lorem|placeholder|not implemented|coming soon`): no hits in `src`.
- `innerHTML`/`insertAdjacentHTML` sinks (`ui/index.ts:105,178,187`, `input/touch.ts:28`) take only constant SVG/COPY strings. None takes user or network input.
- grep `contextlost|webglcontext`: empty.

## Findings filed
| ID | Sev | Title | Where |
|---|---|---|---|
| F-001 | S2 | Pausing mid-step leaves alpha at -1, so the paused frame draws entities one step back | app/game.ts:92 |
| F-002 | S2 | iOS audio stays silent after an interruption outside the fight | audio/index.ts:420 |
| F-003 | S2 | Restart fight unpauses 150 ms before the reset, so the fight runs live under the veil | ui/index.ts:250 |
| F-004 | S3 | No WebGL context-loss handling or test | render/renderer.ts:52 |
| F-005 | S3 | Test hooks with cheat flags ship in the public build | app/hooks.ts:67 |
| F-006 | S3 | Per-frame closure and redundant style writes in the HUD loop | ui/index.ts:324 |
| F-007 | S3 | pickAttack fallback can return doubleSlam unchecked | golem/sim.ts:115 |

## Checks that passed
- **Hit-stop and i-frames.** Hit-stop freezes the entities, and flow and input buffering still run (`core/sim.ts:62-66`). `swingHits` bits stop double hits. Each Gale tick re-arms on exact frames only. Roll i-frames are checked before the grace i-frames, and a perfect dodge fires once per roll (`hero/sim.ts:281-293`). A death clears the hazards and sets its own slow-mo, and `resetWave` restores `timeScale`.
- **Golem state machine.** A poise break during a telegraph is deferred (`staggerPending`) and re-applied after recover, so a stagger is never lost to the poise refill. Enrage triggers only when calm. The killing blow resolves in the same step (`stepGolem` runs after `resolveHeroAttacks`).
- **Retry and reset.** `resetWave` builds a fresh hero, golem, minions and hazards each time. The UI detects a new attempt by golem identity, and hearts rebuild only when maxHp changes. `retry()` is ignored in title/intro, so a double tap or Enter plus a click cannot advance two waves. The event log is capped at 256, the SFX log at 64, and the bus has a fixed listener set. I found no growth across waves.
- **Input.** Presses are latched edges, consumed once per step. While paused the input is sampled and thrown away, so nothing fires on resume. Blur clears held keys.
- **Touch.** Buttons fire on `pointerdown` with `preventDefault` and `stopPropagation`. The stick uses its own pointer id and handles `pointercancel`. Hiding the controls zeroes the stick. `touch-action:none`, `overscroll-behavior:none`, `viewport-fit=cover`, `env(safe-area-inset-*)` and `position:fixed; inset:0` are all in place. The page uses no `vh` units.
- **Resize and orientation.** The `resize` listener updates the renderer, the camera aspect and the UI measure (through rAF).
- **Renderer.** The Low tier disposes the composer. Auto never upgrades, ignores stalls over 250 ms, and is disabled under webdriver, so SwiftShader fps is never used. Stats count every pass.
- **Audio unlock.** The context is created and a silent buffer played inside the gesture. Pause fades, then suspends, and the 70 ms race is guarded.
- **Hot loops.** The sim reuses its scratch objects. Hazards, particles and the fly-coin DOM are pooled. The views use preallocated Vector3, Matrix4 and Quaternion objects. The only per-frame allocations left are small and in the DOM HUD (F-006).
- **Originality.** All icons are original inline SVG and the audio is synthesized. "Stone Guardian" comes from the Owner's reference (brief A2). I found no third-party names.

## Not independently verified
I did not measure the draw-call (≤250) and triangle (≤1M) budgets myself. They rest on the CEO-reported green e2e `stats()` assertions, and I took that claim on trust.

## Strengths worth keeping
- The sim is pure and deterministic, and the only coupling is through events.
- Each entity's `ext` keys are fixed at creation.
- Comments state the timing intent in ms and frames.
- Per-frame DOM writes are diffed (`shownCoins`, `lastHp`, `hint.dataset.text`).

## Overall assessment
The combat and AI state machines, the reset path and the touch handling are solid. I found no S0 or S1 defect. The three S2s all sit on the pause and transition edges, plus iOS audio recovery, and each is a few lines to fix: F-001 is visible whenever the player pauses, and F-002 hits any iPhone player who locks the screen between fights. The code is ready to ship once the S2s are fixed or accepted.
