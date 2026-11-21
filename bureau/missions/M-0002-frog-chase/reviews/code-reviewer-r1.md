# Review — code-reviewer — whole product (projects/frog-chase @ 1c64090) — round 1 — M-0002

VERDICT: PASS WITH FINDINGS

## Scope reviewed
`src/sim/{sim,generator,bots}.ts`, `src/loop.ts`, `src/tuning.ts`, `src/app/{shell,app}.ts`, `src/input/input.ts`, `src/save/save.ts`, `src/audio/audio.ts`, the hot paths of `src/render/renderer.ts` and `draw.ts`, `tests/unit/{core,sim}/**`, `tests/e2e/{sim-*,shell-pause,look-feel,harness}.mjs`, `scripts/verify.mjs`. Oracle: experience.md §4, §7.6–7.7; plan.md WO-002/3/4 ACs.

## Method
- `npx vitest run` gave 15 files, 113/113 pass. `npx tsc --noEmit` is clean.
- Mutation probe (scratchpad `mut/det.test.ts`): a deliberately frame-rate-dependent loop that runs one tick per frame, whatever dt is. It gave identical logs at 30 and 144 Hz for seeds 7, 12345 and 42, even though the wall time to the result was 97.4 s vs 20.3 s.
- `grep -nE "STUB|TODO|FIXME|XXX|lorem|placeholder|not implemented|coming soon"` over src, tests and scripts: no hits, so every `STUB (WO-001)` note is gone.
- Traced the order of a tick (`sim.ts:531`) against §4.3–4.5 by hand: flank start/arm/judge, buffer, retarget, soggy window, near-miss, hook.

## Findings filed
| ID | Sev | Title | Where |
|---|---|---|---|
| F-001 | S1 | 30 vs 144 Hz determinism checks are blind to frame-rate dependence (and cost 318 s) | tests/e2e/sim-determinism.e2e.mjs:12, tests/unit/sim/bots.test.ts:63 |
| F-002 | S2 | In-browser sim-step p95 budget check is vacuous (the coarse timer reads 0) | tests/e2e/sim-bots.e2e.mjs:28 |
| F-003 | S2 | Tap-on-pad during the 40 ms retarget window retargets the current hop to the wrong pad | src/app/shell.ts:198 |
| F-004 | S3 | Flanked ✕ vanishes during squash, but a retarget can still land on the armed flank | src/sim/sim.ts:165 |
| F-005 | S3 | Pause-button e2e silently passes if the button is missing | tests/e2e/shell-pause.e2e.mjs:47 |
| F-006 | S3 | Small per-frame allocations (ViewState, closures, gamepad memory) | src/app/shell.ts:244 |

**On the CEO's wall-time question:** `sim-determinism` is both hollow and wasteful. It proves nothing beyond `loop.test.ts`, because bots read the sim every tick (F-001). It also renders roughly 14k frames across 6 runs, about 20 ms each. The fix is in F-001 and targets under 30 s. The other slow suites are reasonable: look-perf has to render, and look-shots and look-feel make real state-asserted captures. shell-audio (83 s) runs whole bot crossings to voice 12 event types. Driving it with `setTuning({layers: 8})` would cut it about 4x without losing coverage. That is a suggestion, not a finding.

## Checks that passed
- **Fairness: no run can become unwinnable.**
  - G4 always leaves at least one lily per layer: the forced trim at `generator.ts:164`, the swap at `:174`, and quota passes A, B and C all keep a lily, with scripted layers 6/10/N excluded.
  - Hops form a complete bipartite graph, so every choice in `choicesFrom` covers the whole next layer.
  - F1 (`sim.ts:405`) refuses a flank unless another lily remains, so a flank can never leave trick pads as the only safe option.
  - F2: the press is handled before `gatorGap` on the same tick (`sim.ts:535-537`), and a hop toward an unarmed flank clears it (`:224`, `:348`). That ordering favours the player.
  - The 250 ms telegraph is longer than the 220 ms soggy escape, so a flank that starts on a soggy pad is always escapable.
  - The flank never targets the bank (`:400`), and layer 36 keeps two safe pads.
- **Determinism and fixed step.**
  - `step` reads only (state, input), with no Date, Math.random or DOM.
  - The loop is a float accumulator with ε and a 30-tick cap. Pause zeroes it (`shell.ts:180`), and app.ts clamps frames to 250 ms.
  - The timer reads sim ticks. The heartbeat is integrated per tick, and `audio.ts` detects its wrap per frame, which is safe because a beat period ≥ 428 ms exceeds the 250 ms maximum frame.
- **Input.**
  - `repeat` is ignored but still `preventDefault`-ed. Ctrl/Meta/Alt chords pass through.
  - Hops pressed during the wipe are held. Hops while paused are not consumed, so a focused menu button answers natively. The lockout is honoured for keys, taps and the restart callback.
  - Blur and hidden pause only during `play`, and pausing clears `pending`.
  - Pause mid-hop freezes the sim; the sim-side buffer survives and fires on landing.
  - The gamepad is edge-triggered. Resize keeps the camera at 64% (look-feel).
- **Soggy window.** Escape is allowed at ≤ 26 ticks; the sinking check runs before the press on the next tick.
- **Save.** Every field is sanitized and `loadSave`/`writeSave` never throw. `innerHTML` only receives constant SVG (`ui.ts:72,248`).
- **Hot loops.** The sim step allocates only on transitions, plus event objects. The renderer pools particles, ripples and pad shapes and uses typed arrays.

## Strengths worth keeping
- The order of a tick is documented at `sim.ts:6-21` and the code matches it exactly.
- The generator is deterministic and only consumes the stream. The quota pass uses no randomness and handles the infeasible n ∈ {1, 2, 5} cases explicitly.

## Overall assessment
The rules are correct and fair against §4. I found no path to an unwinnable run, and no trick pad can be forced as the only safe choice. The main debt is in the evidence, not the game. The headline frame-rate-independence proof (SC1, exceptional #8) cannot fail on a frame-rate bug, and it consumes 45% of verify. One sim budget check is vacuous. One real input edge (F-003) can steer a fast double-tapper onto the wrong pad. Fix F-001 before the mission claims SC1. F-002 and F-003 belong in polish.
