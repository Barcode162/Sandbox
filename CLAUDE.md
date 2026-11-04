# Hearthwake: start here (every AI session)

**Hearthwake** is a J Production game: one photoreal medieval house you
walk through in Safari on the iPhone, built on **Looped**, J Production's
own engine (`engine/`). The full plan, with the lore and every object, is
the doc at https://claude.ai/artifact/Fw7aQ19HR3428VgSFLAan8.

## Who you work for

The user owns J Production and works only from an iPhone, through chat.
They are learning; explain in plain words, outcome first, and say what to
look at on the phone. They never need to run a command.

## The layout

- `engine/`: Looped on its own. Read `engine/README.md` first.
- `house/`: the game (from M0 on).
- Bar3D (`Barcode162/3D`) is a separate project with its own copy of the
  engine. Never change it from here.

## Rules

1. The engine never includes game code: nothing in `engine/looped/`
   includes a file from outside it (`engine/tools/lint_engine.mjs`).
2. Every engine change gets a line in `engine/CHANGES.md`.
3. Commit only when the check passes (`bash engine/test.sh`, and the game's
   checks once they exist). Never skip, weaken or delete a test to pass.
4. Work on a branch per job; `main` gets a finished, checked job.
5. Never say something works or is live without checking it. The phone
   is the real test: this machine has no graphics card, so its pictures are
   right for looks, wrong for speed.
6. Every outside model, texture or sound needs a licence that allows this
   use and a credit line (`CREDITS.md`).
7. No secrets, keys or passwords in the repo, a commit or a reply.
8. Speed doesn't matter; the phone's memory does (the budget is in the
   plan's "Quality over speed").

## Setting up a session

- Emscripten 6.0.13 for the web build:
  `git clone --depth 1 https://github.com/emscripten-core/emsdk.git && ./emsdk/emsdk install 6.0.13 && ./emsdk/emsdk activate 6.0.13 && source ./emsdk/emsdk_env.sh`
- Then `bash engine/test.sh`.
