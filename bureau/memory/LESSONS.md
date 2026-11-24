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

## L-0006 · 2026-11-23 · M-0002 · tags: interactive-web, 3d, layout

Judge 3D layout in projected screen space, not world units: 15 u apart in 3D can share a pixel. Measure it with a probe that prints the critic's targets per state, and converge before spending a reviewer.

## L-0007 · 2026-11-23 · M-0002 · tags: interactive-web, labels, testing

When a declutter rule gets stricter, assert who must stay named (hubs, chip owners, the thing just stored), not only that nothing overlaps; tightening 'nothing over cores' unnamed the hub twice (F-031, F-032).

## L-0008 · 2026-11-23 · M-0002 · tags: process, resume

A session can end mid-mission and take every agent's context with it: commit at each phase change, and when builders are gone, the CEO doing remediation saves budget for independent verification and the vote.

## L-0009 · 2026-11-23 · M-0002 · tags: testing

Assertion helpers must fail when their inputs are missing (no badge, no rects exposed), or a new e2e check passes hollow.

## L-0010 · 2026-11-23 · M-0004 · tags: interactive-web, assets, ceo

Wikimedia Commons rate-limits cloud IPs: batch metadata in one API call (titles=A|B|… up to 50) and download thumbnails only at standard widths (330/500/960/1280); non-standard sizes or small originals trigger 429s with 600 s waits. Never let a drawn stand-in replace real photography in a product's main frame; put it in a small inset.

## L-0011 · 2026-11-24 · M-0005 · tags: interactive-web, motion

Scroll-reveal systems: make the failsafe conditional on the observer never firing; reveal everything when the page end is reached, because a negative bottom rootMargin leaves a dead zone; never stage honesty or legal copy; test reveal after the failsafe window and at page end at two viewports; when animating label bodies over visually hidden inputs, give the inputs a z-index.
