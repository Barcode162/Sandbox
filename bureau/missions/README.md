# Missions

One dossier per mission, created by `python3 bureau/bin/bureau new`. A dossier is the mission's complete, durable record: a mission can be resumed from it in any session (`/bureau --resume M-XXXX`).

```
M-0001-<slug>/
  state.json        phase, tier, headcount, gate rounds   (CLI-managed)
  log.md            chronological decisions               (CLI-appended)
  findings.jsonl    finding events                        (CLI-managed)
  votes.jsonl       board votes                           (CLI-managed)
  brief.md          the ask, intent, scope, success criteria
  intel/            scout reports
  design/           experience.md, architecture.md, style frames, bake-off variants
  plan.md           waves and work orders
  reports/          completion reports, one per work order
  reviews/          Quality Division reviews
  board/            board reviews and bake-off judgements
  evidence/         screenshots, captures, measurements
  retro.md          the historian's record
  upgrades/         the reformer's proposals
```

Overview: `python3 bureau/bin/bureau status` · one mission: `python3 bureau/bin/bureau status M-0001`
