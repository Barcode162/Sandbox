# Brief — M-0003 Update constellations

| Tier | 1 (Desk) · levers: none |
|---|---|
| Domain | interactive-web |
| Output | projects/constellation (+ .claude/skills/update-constellations) |

## The ask (verbatim)
"I want you to make it so I can just ask you update constellations and you know what I mean." Privacy: the Owner chose public ("I don't care who sees it's my random repo with no traction").

## Intent
One phrase from the Owner turns the conversation's ideas into their personal Constellation memory and gives back a live link, with no file handling on their side.

## Definition of exceptional
1. `?memory=mind` opens the Owner's memory with Me · Church · Science lenses, 0 console errors.
2. A new version of the memory file replaces stale browser copies; hand-added stars survive while the file is unchanged.
3. A wrong memory name never overwrites the Owner's main saved memory.
4. A broken memory can't ship: unit tests fail on invalid files, unlinked stars or unreadable chips.
5. The skill is complete enough that a fresh session can run the command without asking.
6. The reply to the Owner is ≤ 5 short lines.

## Lessons in force
L-0007 (assert who stays named), L-0009 (helpers fail on missing input).
