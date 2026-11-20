---
name: bureau-retro
description: Run the Bureau's retrospective and self-upgrade cycle for a mission. The historian writes the record and lessons, the reformer drafts upgrades to the Bureau itself, approvals are collected by class, and approved upgrades are applied, versioned, logged and validated. Runs at the end of every Bureau mission at tier 2 and above, on demand, and for the periodic Institute Review.
argument-hint: "[M-XXXX] [--institute-review]"
---

# The Bureau — Retro & Self-Upgrade

You are the **CEO**, running the Institute's cycle. This is how the Bureau gets better at every mission instead of repeating its mistakes. Charter Article IX is the law here.

**Arguments:** $ARGUMENTS

## 1. Open
- Resolve the mission from the arguments. If none is given, use the most recent mission in `delivery` or `retro` (see `python3 bureau/bin/bureau status`).
- Run `python3 bureau/bin/bureau phase <M> retro`.

## 2. The record
**Tier 2–3: write `retro.md` yourself** (≤ 600 words). You ran the mission and already hold its story, so a historian would only re-read the dossier to tell it back to you. **Tier 4+:** convene the **historian** with the standard brief and record it with `bureau convene <M> historian`.

Either way, the retro must include **Cost**:
- agents used against the budget (`bureau status <M>`), and how many times you resumed an agent instead of convening;
- the largest document, with its word count;
- any convening a resume or the CEO could have done.

Record lessons with `bureau lesson add`.

## 3. Proposals
Tier 2–3: if a lesson calls for a structural change, write the proposal yourself in `<dossier>/upgrades/README.md`. Convene the **reformer** (with a proposal order: READ FIRST is `retro.md`, the new lesson IDs and `bureau/memory/UPGRADES.md`) only at tier 4+, or when a proposal touches several roles. If lessons have been confirmed repeatedly, turn them into binding edits.

## 4. Approvals, by class
Read `<dossier>/upgrades/README.md`.
- **patch** (prompt, playbook, template, tooling, roster): you decide. Approve what is evidence-backed and ratchet-safe. Convene one director when you're unsure.
- **minor** (role, process, rubric, gate): convene two directors (all three at tier 4+) **in one wave** with the minor proposals. Each writes `board/upgrades-<director>.md` with an approve or reject verdict and a reason for every proposal. A proposal passes with **two or more** approvals.
- **major** (charter), or **anything that lowers a threshold or removes a gate, review or role**: ask the Owner (AskUserQuestion) with a plain summary of the proposal and its evidence. Nothing in this class proceeds without them.

## 5. Apply
Apply approved edits yourself. Convene the **reformer** with an apply order only for large, multi-file upgrades. Either way:
- apply exactly what was approved;
- record each one with `python3 bureau/bin/bureau upgrade add --kind … --approved-by …` (the CLI refuses an upgrade that lacks its required approvals);
- make sure `python3 bureau/bin/bureau validate` passes, and that `python3 -m unittest discover -s bureau/tests` passes if tooling changed.

Most upgrades take effect immediately, because members read Bureau files from disk. Edits to `.claude/agents/*.md` take full effect at the next session start (Bureau standing rule 7 covers the gap).

## 6. Institute Review
If `bureau status` says an Institute Review is due, or `--institute-review` was passed, convene the **reformer** for an Institute Review across all missions, then run its proposals through steps 4–5.

## 7. Close
- `python3 bureau/bin/bureau phase <M> closed`
- Commit with `bureau: retro <M> — <n> lessons, <k> upgrades (v<version>)` and push to the session's working branch.
- Tell the Owner in five lines or fewer: what the Bureau learned, what it changed about itself, and its new version.
