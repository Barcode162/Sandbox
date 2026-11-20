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
Convene the **historian** with the standard brief. Write it to `retro.md`, with lessons recorded through `bureau lesson add`. Record the headcount with `bureau convene <M> historian`.

## 3. Proposals
Convene the **reformer** with a proposal order. READ FIRST is `retro.md`, the new lesson IDs, and `bureau/memory/UPGRADES.md`. Output goes to `<dossier>/upgrades/`. If the historian flagged promotion candidates (lessons confirmed repeatedly), require the reformer to turn them into binding edits.

## 4. Approvals, by class
Read `<dossier>/upgrades/README.md`.
- **patch** (prompt, playbook, template, tooling, roster): you decide. Approve what is evidence-backed and ratchet-safe. Convene one director when you're unsure.
- **minor** (role, process, rubric, gate): convene all three directors **in one wave** with the minor proposals. Each writes `board/upgrades-<director>.md` with an approve or reject verdict and a reason for every proposal. A proposal passes with **two or more** approvals.
- **major** (charter), or **anything that lowers a threshold or removes a gate, review or role**: ask the Owner (AskUserQuestion) with a plain summary of the proposal and its evidence. Nothing in this class proceeds without them.

## 5. Apply
Convene the **reformer** with an apply order listing each approved proposal and its approvers. You may apply very small edits yourself instead. Either way:
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
