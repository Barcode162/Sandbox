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

## U-0002 · v2.0.0 · charter · 2026-11-20

- **Title:** Bureau 2.0: the lean economy
- **Trigger:** M-0001 halted by the Owner over cost (about three usage windows) despite top-rated craft; Owner asked for the same quality at a fraction of the time and tokens
- **Change:** Agent budgets per tier enforced by convene (T1 2, T2 8, T3 14, T4 30, T5 6) with an Owner-only override; quality levers (bakeoff, polish, hardening, audit, spike) decoupled from tier, each adding a mechanical gate requirement; word caps on plan docs (gate) and board reports (vote); bake-offs as 450-word direction cards; frame-table exemplar; contracts in code; 2-6 vertical slices with at most 4 per wave; resume-before-convene; tier 2 and 3 boards and reviews slimmed (inspector-general via the audit lever or tier 4+; the finder verifies fixes); mechanical roles on sonnet; CEO-written retros at tier 2 and 3; Charter Article XIII Economy; amended Articles III, IV, VI.3 and VIII.6
- **Files:** CLAUDE.md, bureau/CHARTER.md, bureau/config.json, bureau/README.md, bureau/bin/bureau, bureau/tests/test_bureau.py, bureau/exemplars/frame-table.md, bureau/templates/*, .claude/skills/bureau/SKILL.md, .claude/skills/bureau-retro/SKILL.md, .claude/agents/*
- **Approved by:** owner

## U-0003 · v2.0.1 · playbook · 2026-11-23

- **Title:** interactive-web: spatial/3D verification (screen-space probe, named-set asserts)
- **Trigger:** M-0002 F-030, F-031, F-032; lessons from retro
- **Change:** Verification specifics gains a spatial/3D paragraph: judge layout in projected screen space, ship a probe that prints critic targets, assert who stays named, and make helpers fail when their input is missing
- **Files:** bureau/playbooks/interactive-web.md
- **Approved by:** ceo
