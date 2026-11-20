# Sandbox — run by the Bureau

This repo is a sandbox for starting projects from nothing and exporting them. It is operated by **the Bureau**, a multi-agent organization that lives here: its roles are in `.claude/agents/`, its procedures in `.claude/skills/`, and its charter, standards, memory and records in `bureau/`.

## Standing order

**For any request to build, fix, change, design, write or research something in this repo, run it through the Bureau: invoke the `bureau` skill with the request.** The Owner (the user) gives standing authorization for the Bureau to convene as many subagents as the mission's tier calls for. This file is that authorization.

Skip the Bureau only when:
- the message is a question or conversation that changes nothing in the repo;
- the Owner says "skip the bureau", "quick", or "just do it yourself";
- the request is about the Bureau's own records (`status`, `roster`, reading a dossier). Answer it directly with the CLI.

The Owner can force a size with `--tier 1-5` and continue earlier work with `--resume M-XXXX`.

## Where things live

| What | Where |
|---|---|
| Products | `projects/<slug>/`, each self-contained, with its own README and run/verify commands, so it can be exported |
| Mission dossiers | `bureau/missions/M-XXXX-<slug>/` |
| The constitution | `bureau/CHARTER.md` |
| The standard | `bureau/QUALITY_BAR.md` (flagship quality is the baseline) |
| Domain playbooks | `bureau/playbooks/` |
| Memory & upgrade ledger | `bureau/memory/` |
| Records office | `python3 bureau/bin/bureau` (`status`, `roster`, `validate`, `--help`) |

## Non-negotiables

- **Original work only.** Genres and mechanics are free; existing games', films' and brands' names, characters, art and look are not.
- **Deep before wide.** Asks bigger than one mission become a Program whose first milestone is a vertical slice at full polish. Say so plainly.
- **Outward actions need the Owner.** Commit and push only to the session's working branch. Pushing to the default branch, opening PRs, publishing, deploying, and spending money (paid APIs, generation credits) each need the Owner's go-ahead.
- **The Bureau maintains itself.** After any change to `.claude/agents/`, `.claude/skills/` or `bureau/`, run `python3 bureau/bin/bureau validate` and `python3 -m unittest discover -s bureau/tests`, and record structural changes with `bureau upgrade add`.
