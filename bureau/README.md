# The Bureau

A multi-agent organization living in this repo. Ask once, and a whole company works on it: research, creative direction, architecture, many specialists building in parallel, people whose only job is to break it, a board that can say no, and an institute that makes the organization better after every mission.

```
/bureau build me <anything>
```

## Org chart

```
                               OWNER  (you — final authority)
                                  │
                                  ▼
                        CEO  (the main Claude session)
                 sole dispatcher · keeps the books · runs every phase
                                  │
          ┌───────────────────────┼─────────────────────────┐
          ▼                       ▼                         ▼
   BOARD OF DIRECTORS       (gates every plan          THE INSTITUTE
   director-vision           and every ship)           historian — record & lessons
   director-engineering                                reformer  — upgrades the Bureau
   director-risk  (S0 veto)                            recruiter — hires new specialists
          │
   ┌──────┴───────────────┬──────────────────────────┬────────────────────────┐
   ▼                      ▼                          ▼
 STRATEGY              ENGINEERING                QUALITY
 scout ×N              engineer ×N (54            code-reviewer ×N
 experience-designer     disciplines)             qa-tester ×N
   (bake-offs)         integrator                 red-team
 architect             test-engineer              polish-critic
                                                  inspector-general
```

**17 roles × 54 disciplines**, convened in waves of up to 4 within a hard agent budget per tier (enforced by `bureau convene`). Agents that continue their own work are **resumed**, not re-convened. Mechanical roles run on a faster model. New specialists are hired through `/bureau-hire`. See Charter Article XIII (Economy) for why.

## The mission lifecycle

```
 the ask ─▶ ① INTAKE      brief, tier, playbook                         CEO
            ② INTEL       only when it changes a decision              CEO / scout
            ③ DESIGN      3 direction cards → judged → frame-table     Strategy
                          spec → contracts in code → 2–6 slices
            ◆ GATE 1      board reviews the plan · bureau gate <M> plan    Board
            ④ BUILD       ≤ 4 engineers, one vertical slice each        Engineering
            ⑤ INTEGRATE   one clean build, verify command green        Engineering
            ⑥ REVIEW      tier's reviewers + each lever's reviewer     Quality
            ⑦ REMEDIATE   fix → independent verify → loop until clean  Eng ⇄ Quality
            ◆ GATE 2      board ship vote ≥ 8.0, zero open S0/S1/S2     Board
            ⑧ DELIVER     commit, push, report with evidence           CEO
            ⑨ RETRO       lessons → upgrade proposals → approvals →    Institute
                          applied, versioned, logged
```

## What makes it better than asking once

- **Many specialists, not one generalist.** Each role has its own procedure and standards, and each engineer gets a discipline.
- **Contracts first, in code.** The architect writes the interfaces as real type and stub files and gives each vertical slice exclusive ownership, so a few engineers work at once without collisions.
- **Bake-offs.** For the calls that dominate quality (art direction, feel, core architecture), three rival direction cards compete and a director (or you) picks the winner. Only the winner gets a full spec, built around frame tables (`bureau/exemplars/frame-table.md`).
- **Adversarial review.** Independent reviewers, each trying to find what the builders missed. Levers add more of them.
- **Mechanical honesty.** Findings, votes and gates live in the records office, so they can't be argued around. A fix can't be verified by the agent that made it, S0/S1 findings can only be waived by you, and the ship gate needs every director at 8.0 or higher with nothing open.
- **The Inspector General** (the `audit` lever, always at tier 4+) audits every claim, so "done" means done.
- **It improves itself.** Every mission ends in a retro. Lessons go into memory, recurring lessons are promoted into binding rules, and upgrades are proposed, approved by class, applied, versioned (`bureau/VERSION`) and logged (`memory/UPGRADES.md`). Quality thresholds only ever move up (the ratchet).

## Tiers

| Tier | Name | Use for | Agent budget |
|---|---|---|---|
| 1 | Desk | tiny, fully specified changes | 2 |
| 2 | Squad | one page or site, a toy game, a CLI, a focused feature | 8 |
| 3 | Division | a multi-screen product, a 2D game, a library with docs | 14 |
| 4 | Full Bureau | a 3D vertical slice, a product with a backend | 30 |
| 5 | Program | months of human-team work, delivered as milestones | per milestone |

**The tier sets the headcount, not the bar.** Craft comes from **levers** you can add at any tier: `bakeoff`, `polish` (on by default for web and games), `hardening`, `audit`, `spike`. The CEO goes *down* a tier when in doubt and adds a lever. Force them with `/bureau <ask> --tier 2 --levers bakeoff,polish`.

A *Bent Light*-class site (M-0001) is now tier 2 + `bakeoff,polish`, about 8 agents. It ran as tier 3 with 26 agents convened before it was halted halfway.

## Commands

| You type | What happens |
|---|---|
| `/bureau <ask>` | runs a full mission |
| `/bureau --resume M-0003` | picks a mission back up from its dossier |
| `/bureau-retro M-0003` | retro and self-upgrade cycle (runs automatically at the end of a mission) |
| `/bureau-hire <capability>` | recruits a new specialist role |

The records office, usable by you and by every agent:

```
python3 bureau/bin/bureau status [M-XXXX]       org overview / one mission
python3 bureau/bin/bureau roster                 departments, roles, disciplines, capacity
python3 bureau/bin/bureau finding list M --open  outstanding defects
python3 bureau/bin/bureau gate M ship --dry-run  what still stands between it and shipping
python3 bureau/bin/bureau lesson list --tag game what the Bureau has learned
python3 bureau/bin/bureau validate               the Bureau's integrity check (also runs in CI)
python3 bureau/bin/bureau --help                 everything else
```

## Files

```
CLAUDE.md                    standing order: every task in this repo goes through the Bureau
.claude/agents/*.md          the 17 roles (subagent definitions)
.claude/skills/bureau*/      the CEO's operating manual, retro cycle and hiring procedure
bureau/CHARTER.md            the constitution: authority, lifecycle, the Code, powers, upgrades
bureau/QUALITY_BAR.md        the standard: five tests, universal requirements, the rubric
bureau/config.json           tiers, gate rules, thresholds, owner floors, approval rules
bureau/roster.json           departments, roles, disciplines
bureau/playbooks/            game · interactive-web · software · general
bureau/templates/            mission dossier skeleton, report/review/board/agent templates
bureau/memory/               LESSONS.md · UPGRADES.md · hires/
bureau/missions/             one dossier per mission
bureau/bin/bureau            records office CLI (stdlib Python)
bureau/tests/                its test suite
projects/                    what the Bureau builds
```

## Honest limits

- **Cost scales with tier.** Every agent is a full model session. Sizing the tier is the main lever, and you can force it.
- **Subagents can't spawn subagents.** The hierarchy is enforced by procedure, with the CEO as the only dispatcher, rather than by nesting.
- **New or edited agent files load at session start.** Until then, the CEO has a fallback (standing rule 7 in the operating manual).
- **Flagship *bar*, honest *scope*.** The Bureau holds everything to flagship standards. It does not pretend a single mission equals a studio's multi-year production. Large asks become Programs, delivered as vertical slices at full polish.
