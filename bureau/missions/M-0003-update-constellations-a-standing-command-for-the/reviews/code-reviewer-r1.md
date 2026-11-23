# Review: code-reviewer, ?memory= loader + skill, round 1, M-0003

VERDICT: FAIL at r1 (one S1); all six verified at 3d48cfa, so it now passes with one S3 open (F-007).

## Scope reviewed
`git diff a5d6779 5808b71`: main.ts, memories.test.ts, SKILL.md, CLAUDE.md, README.

## Method
I ran unit tests (87/87), 17 mind.json mutations, a build plus a Playwright probe (scratchpad/probe.mjs), and checked `git ls-tree origin/main` and the Hearthwake workflow.

## Findings filed
| ID | Sev | Title | Where |
|---|---|---|---|
| F-001 | S1 | The command exists only on this branch; a fresh session can publish a stale memory over the live one | SKILL.md:14 |
| F-002 | S2 | Personal memory is measured against the generic seed (welcome count, Reset) | main.ts:157 |
| F-003 | S2 | An unknown name says "the seed is shown" but opens the main memory | main.ts:98 |
| F-004 | S2 | A new file silently discards stars added in the browser | main.ts:89 |
| F-005 | S2 | The tests pass islands, duplicate labels and long labels | memories.test.ts:27 |
| F-006 | S2 | The Hearthwake force-push wipes /constellation/; a rejected push has no recovery | SKILL.md:38 |

## Checks that passed
- **DoE 1:** mind opens with 37 lights and 47 lines in the `me` lens, 0 errors.
- **DoE 2:** an unchanged file keeps hand-added stars (38); a new file brings back 37.
- **DoE 3:** `nope`, `a%2Fb` and `../seed/memory` leave the main key unchanged.
- **Autosave:** both startAutosave calls use `saveKey`.
- **Blocked storage:** opens unsaved, 0 errors.
- **Tests:** they already failed on invalid JSON, no files, isolated stars, dangling lines and long chips.

## Strengths worth keeping
The loader fails closed, and publishing touches only `constellation/`.

## Overall assessment
At r1 the browser side met DoE 1 to 3, but two texts were untrue (F-002, F-003). F-001 failed DoE 5: main had neither the skill nor its trigger, and a stale branch copy could roll the live memory back.

## REQUESTS
- Owner: approve merging the skill, the CLAUDE.md line and projects/constellation into main (F-001).
- Owner: approve changing the Hearthwake workflow so it keeps other folders on gh-pages (F-006).

## r1 verification (3d48cfa)
All six findings are verified.
- **Tests:** unit 87/87 and e2e [M3-1..4] 4/4. Mutations now fail on an island, a duplicate label that differs only in case, and a 33-character label.
- **Browser probe, same stamp:** "The 1 you stored" now counts correctly.
- **Browser probe, file changed:** the hand-added star goes to `.previous`, with a Download action.
- **Browser probe, Reset:** after a reload the memory file is back (37 lights, `me`).
- **F-001:** the procedure holds, and `origin/main` can fast-forward to 3d48cfa. It only takes effect once delivery fast-forwards main.
- **F-006:** 503ce6e only replaces site/ entries, with no force-push. I have not seen the live CI run.
- **New:** F-007 (S3). The Reset wording still says "seed" in a personal memory.
