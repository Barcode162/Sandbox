# Upgrade ledger

Every structural change to the Bureau, in order, with its trigger and approvals (Charter IX). The version in `bureau/VERSION` always equals the last entry's version.

- Add: `python3 bureau/bin/bureau upgrade add --kind <kind> --title … --trigger … --change … --files … --approved-by …`
- Classes: **patch** (prompt, playbook, template, tooling, roster) · **minor** (role, process, rubric, gate; two directors) · **major** (charter; the Owner)

Entries are appended below by the CLI. Don't edit their headers by hand.

## U-0001 · v1.0.0 · charter · 2026-11-20

- **Title:** Founding of the Bureau
- **Trigger:** The Owner's order to found a multi-agent organization in Sandbox, with flagship-quality output as the baseline
- **Change:** Charter, quality bar, 17 roles across 5 departments, mission lifecycle with two board gates, findings with separation of duties, tiers 1–5, four domain playbooks, templates, the records-office CLI with tests, and the retro / self-upgrade / hiring cycles
- **Files:** CLAUDE.md, .claude/agents/*, .claude/skills/*, bureau/*
- **Approved by:** owner
