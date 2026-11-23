---
name: update-constellations
description: The Owner's standing command "update constellations" (also "update my constellation", "add this to my constellation"). Turn the ideas from the current conversation into stars, lines and perspectives, merge them into the Owner's personal Constellation memory (projects/constellation/src/memories/mind.json), check it, publish it to GitHub Pages and reply with the link. The Owner pre-approved the publish and chose a public memory (2026-11-23, M-0003).
argument-hint: "[memory name, default mind]"
---

# Update constellations

The Owner says **"update constellations"** and expects one result: their memory now holds what this conversation was about, and the link shows it. Do the whole thing without asking. Ask only if the conversation has no new ideas, or the Owner names a memory that doesn't exist.

**Standing authorization (Owner, 2026-11-23):** publishing this memory to GitHub Pages is part of the command, and the memory is public by the Owner's choice. That covers this command only; anything else still needs its own go-ahead.

## 1. Read what's there (always the newest copy)
- **`main` holds the master copy.** Every session starts on its own branch, so first run `git fetch origin main` and bring the working tree up to date with it (`git merge --no-edit origin/main`; if the session's branch has no unmerged work of its own, a fast-forward is enough). Never build an update on a stale copy: publishing it would roll the live memory back and wipe the Owner's browser copy.
- The file is `projects/constellation/src/memories/<name>.json` (default `mind`). Read it fully: existing ids, labels, perspectives (`me`, `church`, `science`, plus any the Owner added) and tags.
- The format is in `projects/constellation/docs/memory-format.md`.

## 2. Turn the conversation into stars
Take ideas from the conversation since the last update (the newest `created` stamps in the file show where that was). For each idea, ask: is it already a star? If so, update it instead of adding a duplicate.
- **A star** (node) is one idea, named the way the Owner would say it: `label` ≤ 32 characters, `kind` `concept` for ideas and `note` for moments or events (a date, an experience).
- **Its value is the Owner's own view**, in their words, ≤ 24 characters. It reads as a chip in the sky.
- **Facets** hold the other perspectives, ≤ 24 characters each, and only where they really differ (`church`: how a church would put it; `science`: the scientific name or view). Leave one out if it would just repeat the Owner's view.
- **Every new star gets at least one line** to an existing star. Types: `association` (related), `causes` (one leads to the other, directed), `part-of`, `chain` (an ordered sequence, directed; the distance ladder uses it). `weight` in (0, 1]: 1 for a strong tie, 0.6 for a loose one. A short `label` on the line is fine ("is", "checked by").
- `tags`: reuse the existing cluster tags (`seeing`, `mind`, `thinking`, `distance`, `world`, `god`, `people`, `journey`); add a new one only for a genuinely new theme.
- **Ids**: lowercase-kebab, never reused. Relation ids continue the `r-NNN` sequence.
- **Timestamps**: set `created` and `updated` of new stars and lines to now in ms (`date +%s%3N`). Update `updated` on edited stars. The app names the five newest stars first, so new ideas stay visible.
- **Never delete or rename** an existing star or line unless the Owner asks. Change a value only when the Owner's view clearly changed, and keep it in their voice.
- A new perspective is added only when the Owner asks for one (`id`, `label`, `description`, a `#rrggbb` `accent`).

## 3. Check it
From `projects/constellation`:
- `npm run test:unit`. `[U-memories-1]` and `[U-memories-2]` must pass (valid, no warnings, every star linked, chips ≤ 24 characters).
- `npm run build`, then render `?memory=<name>` with Playwright (preview on a free port, chromium args `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`). Wait for `window.__constellation.state().introDone`, check the stats line counts the new stars, check there are 0 console errors, and look at the screenshot. If a new cluster knots, add lines that pull it toward its theme.
- Run the full `npm run verify` only if app code changed.

## 4. Publish
- Make a gh-pages worktree in the scratchpad: `git fetch origin gh-pages && git worktree add <scratch>/ghp origin/gh-pages --detach`.
- Replace `<scratch>/ghp/constellation/` with a fresh copy of `projects/constellation/dist/`. Touch nothing else on that branch (other sites live there).
- Commit "Update constellation memory: <name> (+N stars)" with the session's attribution lines, then `git push origin HEAD:gh-pages`. Never force-push gh-pages. **If the push is rejected** (another site published meanwhile), remove the worktree, re-fetch `gh-pages`, redo the copy on the new tip and push again (up to 4 times, with backoff). Remove the worktree when done.
- The Hearthwake build publishes into gh-pages too. Since 2026-11-23 it replaces only its own files (Owner-approved fix, M-0003). If `/constellation/` was nevertheless missing before you published, say so in one line.
- Poll `https://barcode162.github.io/Sandbox/constellation/?memory=<name>` until it returns 200 (Pages takes about a minute), then open it once with Playwright to confirm the new stars count and 0 errors.

## 5. Save and reply
- Commit the memory file on the session's working branch and push it. Then **save it to `main`** (Owner-approved standing step, 2026-11-23): `git push origin HEAD:main` when that is a fast-forward. Otherwise fetch `main`, merge it into the working branch, re-run the unit tests and push both again. Never force-push `main`.
- Append one line to `bureau/memory/constellation-updates.md`: date, memory, stars added and changed, live check result.
- **Reply in at most 5 short lines.** The Owner reads slowly and prefers plain words: the link, how many stars were added, and their names. Mention one thing to try (for example a lens to switch to). No process details unless asked.

Live link: **https://barcode162.github.io/Sandbox/constellation/?memory=mind**
