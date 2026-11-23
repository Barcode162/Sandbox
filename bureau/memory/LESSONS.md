# Lessons — the Bureau's institutional memory

What the Bureau has learned, mission by mission. Each lesson is **specific** (names the situation), **actionable** (says what to do), **durable** (true beyond one mission) and **new** (not a duplicate).

- Add: `python3 bureau/bin/bureau lesson add "<lesson>" --tags <role>,<domain>,<topic> --mission M-XXXX`
- Read: `python3 bureau/bin/bureau lesson list --tag <tag>` · `--grep <text>`
- The CEO cites relevant lessons in every brief under LESSONS IN FORCE.
- Lessons confirmed repeatedly get **promoted** into binding prompts, playbooks or checklists by the reformer (Charter IX.4). Lessons are never deleted. A wrong lesson is superseded by a new one that references it.

Entries are appended below by the CLI. Don't edit their headers by hand.

## L-0001 · 2026-11-20 · M-0001 · tags: ceo, interactive-web, economy, sizing

Tier sizes headcount, never the bar. A single-page site with flagship craft is tier 2 plus the bakeoff and polish levers (about 8 agents), not tier 3 (26 agents convened before a halt).

## L-0002 · 2026-11-20 · M-0001 · tags: experience-designer, director-vision, economy, bakeoff

Bake-offs compete as 450-word direction cards, not full specs. Three ~10k-word variant specs were written to pick one; the director's verdict rested on the north stars, the signature frames and one cheap probe of the riskiest frame.

## L-0003 · 2026-11-20 · M-0001 · tags: experience-designer, polish-critic, interactive-web, spec

The frame table (moment, what is on screen, why it is composed) is where spec quality lives; about 3,700 words carried all six scenes. Spend the spec there and cut traceability, notation and appendices. Exemplar: bureau/exemplars/frame-table.md.

## L-0004 · 2026-11-20 · M-0001 · tags: architect, engineer, ceo, economy

Freeze contracts as code (types file + stubs) and build in few vertical slices. With types.d.ts frozen, one session finished three scenes, admire mode, chrome and 17 animation tests in 16 minutes; the 29-work-order plan had cost more in coordination than in building.

## L-0005 · 2026-11-20 · M-0001 · tags: ceo, economy, dispatch

Resume agents with SendMessage for their next pass (designer cards to spec, engineer build to fixes, director plan to ship) instead of convening fresh ones, and keep waves at 4 or fewer; 8 parallel Opus agents hit the rate limit within 8 minutes.

## L-0006 · 2026-11-23 · M-0002 · tags: ceo, economy, dispatch, remediation

Resumed engineers grow to ~500k-token contexts by the second remediation round; for the last one or two small fixes, the CEO fixing directly (with the filing reviewer verifying) costs far less than another resume. Checkpoint-commit the tree before resuming after a usage-limit stop.

## L-0007 · 2026-11-23 · M-0002 · tags: experience-designer, interactive-web, spec, seed

When seed geometry carries the meaning (a ring the shortcut must visibly cross, a cluster that must stay legible), the spec should include one rendered probe of the layout, and every frame table needs one row that starts from a zoomed or selected state. M-0002 re-authored the seed twice and missed camera reframing (F-014) for lack of both.
