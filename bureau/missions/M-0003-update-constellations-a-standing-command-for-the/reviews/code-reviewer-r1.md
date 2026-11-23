# Review: code-reviewer, ?memory= loader + skill, round 1, M-0003

VERDICT: FAIL (one S1)

## Scope reviewed
`git diff a5d6779 5808b71`: main.ts, memories.test.ts, SKILL.md, CLAUDE.md, README. Context read: persistence.ts, app.ts (reset), shell.ts (greet).

## Method
- `npm run test:unit`: 87/87 pass.
- 17 mutations of mind.json on a scratch copy, run against memories.test.ts.
- `npm run build`, preview on :4183, then a Playwright probe (scratchpad/probe.mjs, probe2.mjs).
- `git ls-tree origin/main`; the Hearthwake workflow on origin/hearthwake.

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
- **DoE 1:** `?memory=mind` opens 37 lights and 47 lines in the `me` lens, 0 console errors.
- **DoE 2:**
  - Same stamp with a stored hand-added star: 38 lights.
  - Changed stamp: back to 37, and the old copy is removed.
- **DoE 3:**
  - `nope`, `a%2Fb` and `../seed/memory` leave `constellation.memory.v1` byte-identical.
  - `MIND` opens mind.
- **Autosave key:** both startAutosave calls (:144, and :183 with its flush restart) use `saveKey`.
- **Blocked storage:** opens at 37 lights with "Not saved", 0 errors.
- **DoE 4, mostly holds:** these all fail the tests:
  - invalid JSON;
  - no files (L-0009 holds);
  - an isolated star;
  - a dangling line;
  - a duplicate id;
  - a long value or facet;
  - an unknown lens;
  - an object value;
  - a featured route to a missing star.

## Strengths worth keeping
- The loader fails closed.
- The skill is concrete about field limits and ids.
- Publishing touches only `constellation/`, so the other sites are safe.

## Overall assessment
The browser side meets DoE 1 to 3, but two texts are untrue:
- the welcome and Reset text call the Owner's stars "stored" (F-002);
- the unknown-name notice is false (F-003).

The real risk is F-001:
- main has neither the skill nor the CLAUDE.md trigger, so DoE 5 fails in a fresh session.
- A session that does have the skill reads mind.json from its own branch. That copy can be stale, so publishing it can roll back earlier updates on the live site.

## REQUESTS
- Owner: approve merging the skill, the CLAUDE.md line and projects/constellation into main (F-001).
- Owner: approve changing the Hearthwake workflow so it keeps other folders on gh-pages (F-006).
