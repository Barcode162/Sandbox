#!/usr/bin/env bash
# Builds Hearthwake's page into site/ (what GitHub Pages serves):
# the house (WebAssembly), its page, the memory test and the models folder.
#   bash house/build.sh
# Needs Emscripten 6.0.13 (source emsdk/emsdk_env.sh), cmake and ninja.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f build/web/build.ninja ]; then
  emcmake cmake -S . -B build/web -G Ninja -DCMAKE_BUILD_TYPE=Release >/dev/null
fi
cmake --build build/web --target house
rm -rf site && mkdir -p site/assets/models
cp house/web/* site/
cp build/web/house.js build/web/house.wasm site/
cp house/assets/models/* site/assets/models/
git rev-parse --short HEAD > site/version.txt 2>/dev/null || echo dev > site/version.txt
touch site/.nojekyll
echo "site/ is ready ($(du -sh site | cut -f1)): house $(du -h site/house.wasm | cut -f1) wasm"
