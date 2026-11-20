# The Quality Bar

The Owner's words: *take a flagship open-world game as the baseline quality.* Not the ceiling, the **baseline**. Flagship productions take thousands of people and many years, and the Bureau will not pretend otherwise. What the Bureau can do is hold everything it ships to the same *kind* of standard: work that feels **authored, dense with detail, systemically deep, polished to the edges, fast, and unbreakable**, at whatever scope it can genuinely finish (see Charter Article X, *deep before wide*).

This document is what every reviewer and director judges against. Domain-specific addenda live in `bureau/playbooks/`.

---

## The five tests

Every deliverable must pass all five before it reaches the Board.

1. **The Flagship Test.** Would this be the best example of its kind the Owner has seen? If it's merely "good for AI-generated", it fails.
2. **The Stranger Test.** Someone with no context picks it up. It works on the first try, it's obvious what to do, and it looks intentional.
3. **The Second-Look Test.** Close inspection is rewarded. Edges, transitions, empty states, hover states, idle moments, error paths: the details are as considered as the headline.
4. **The Abuse Test.** It survives a determined person trying to break it: odd input, rapid input, tiny and huge screens, slow machines, missing data, going offline mid-action.
5. **The No-Excuses Test.** Zero placeholders, `TODO`s, lorem ipsum, "coming soon", dead buttons, console errors, unhandled rejections, or features that only exist in the README.

## Universal requirements

These apply to every deliverable, whatever the domain.

- **Completeness.** Everything the brief promised exists and works end to end. Partial work is labeled partial.
- **Cohesion.** One visual language, one voice, one architecture style. It looks and reads like one author made it.
- **Feedback.** Every action gets a response: visual, audible, or textual, as the medium allows. Nothing happens silently, and nothing makes the user wonder whether it worked.
- **States.** Loading, empty, error, success, first-run and edge states are all designed, not left to defaults.
- **Performance.** It meets the budgets in its architecture doc. Interactive work holds its frame rate (60 fps target) and responds to input within 100 ms. No jank on the first interaction.
- **Robustness.** Errors are caught where they can be handled and explained where they can't. No crash on bad input.
- **Accessibility.** Keyboard reachable, readable contrast (WCAG AA), respects reduced-motion, text scales. Where a medium limits this (some games), offer the comfort options that medium allows.
- **Craft in the code.** Clear structure, honest names, no dead code, tests for what matters, and a one-command way to run and verify it.
- **Proof.** It ships with evidence: a verify command that passes, screenshots or recordings of what it looks like, and measured numbers for the performance claims.
- **Originality.** All characters, worlds, art, music and copy are original (Charter Article XI.3).

## The rubric

Directors score each dimension from 0 to 10, and reviewers use the same anchors.

| # | Dimension | What it asks |
|---|---|---|
| 1 | **Fidelity** | Did it deliver what the Owner actually wanted, all of it, including the intent behind the words? |
| 2 | **Ambition & delight** | Does it exceed expectations? Are there moments that make you grin? |
| 3 | **Craft & polish** | Are the details, transitions, consistency and finish right, with no rough edges? |
| 4 | **Correctness & robustness** | Does it behave correctly, including under abuse and at the edges? |
| 5 | **Engineering quality** | Is the architecture sound, the code clear and maintainable, and the tests meaningful? |
| 6 | **Performance** | Is it fast, smooth and light, and does it meet budgets measured in this environment? |
| 7 | **Accessibility & comfort** | Can more people use it comfortably? |
| 8 | **Evidence** | Is everything above proven, not claimed? |

**Anchors** (use them; don't invent your own scale):

| Score | Meaning |
|---|---|
| 10 | Reference-grade. Others would study it. Nothing to add. |
| 9 | Flagship. A discerning expert finds only matters of taste. |
| 8 | Excellent. Ship-worthy at the Owner's bar, with small known gaps. |
| 7 | Good, and still visibly short of the bar in places. The minimum for any single dimension. |
| 5–6 | Competent and ordinary. "It works." **Not shippable here.** |
| 3–4 | Rough. Obvious defects or missing pieces. |
| 0–2 | Broken or absent. |

**Ship rule:** each required director's overall score is at least **8.0** (`ship_threshold`), and no dimension is below **7** (`dimension_floor`). The overall score is the director's judgement informed by the dimensions, not their average. A single 6 blocks approval regardless of the others.

Thresholds can rise through upgrades. They never fall below the Owner's floors in `config.json` (the ratchet).

## Calibration

- Score against **the best in the world at this kind of thing**, not against what's typical, and not against what was easy to build.
- "It works" is a 5. Don't let a functioning build anchor you upward.
- Be specific. A score without the evidence that justifies it is worthless to the CEO.
- Over-scoring is the costlier error. A false 8 ships something the Owner will be disappointed by. A false 6 costs one more remediation round.
