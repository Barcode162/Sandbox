#!/usr/bin/env bash
# Checks Looped on its own, with no game attached:
#   1. the engine lint: looped/ never includes a game's files
#   2. the engine's native tests, built with g++ (and with em++ run in node,
#      when Emscripten is set up, so WebAssembly maths is checked too)
#   3. every engine source compiles for the web (em++, warnings are errors)
# Usage:  bash engine/test.sh          everything
#         FAST=1 bash engine/test.sh   g++ tests only
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build/tests build/web

echo "== engine lint"
node tools/lint_engine.mjs

declare -A TESTS=(
  [math_test]="tests/math_test.cpp"
  [light_units_test]="tests/light_units_test.cpp"
  [quality_test]="tests/quality_test.cpp"
  [json_test]="tests/json_test.cpp looped/json.cpp"
  [proto_test]="tests/proto_test.cpp looped/netproto.cpp looped/json.cpp"
  [world_test]="tests/world_test.cpp looped/world/loop.cpp looped/world/kind.cpp looped/world/world.cpp looped/json.cpp"
  [words_test]="tests/words_test.cpp looped/words/words.cpp looped/words/program.cpp looped/words/syntax.cpp looped/world/loop.cpp looped/json.cpp"
  [clusters_test]="tests/clusters_test.cpp looped/draw/clusters.cpp"
  [radiosity_test]="tests/radiosity_test.cpp looped/radiosity.cpp looped/bvh.cpp looped/scene_geometry.cpp looped/gltf.cpp looped/json.cpp"
  [vehicle_test]="tests/vehicle_test.cpp looped/vehicle.cpp"
  [drive_lab]="tests/drive_lab.cpp looped/drive/car_spec.cpp looped/drive/tire.cpp looped/drive/vehicle_sim.cpp looped/json.cpp"
)
for t in $(echo "${!TESTS[@]}" | tr ' ' '\n' | sort); do
  echo "== $t (g++)"
  g++ -std=c++20 -O2 -I. ${TESTS[$t]} -o build/tests/$t
  build/tests/$t
  if [ -z "${FAST:-}" ] && command -v em++ >/dev/null; then
    echo "== $t (em++ + node)"
    em++ -std=c++20 -O2 -I. ${TESTS[$t]} -sENVIRONMENT=node -sNODERAWFS=1 -sALLOW_MEMORY_GROWTH=1 -o build/tests/$t.js
    node build/tests/$t.js
  fi
done
echo "== synth_bench (g++)"
g++ -std=c++20 -O2 -I. tests/synth_bench.cpp looped/synth.cpp -o build/tests/synth_bench
build/tests/synth_bench

if [ -n "${FAST:-}" ]; then echo "ENGINE TESTS PASSED (fast: no web build)"; exit 0; fi
if ! command -v em++ >/dev/null; then
  echo "(em++ not found: skipped the web build; source emsdk_env.sh first)"
  echo "ENGINE TESTS PASSED (no web build)"
  exit 0
fi

echo "== every engine source compiles for the web"
n=0
for f in $(find looped -name '*.cpp' -not -path 'looped/apps/*' | sort); do
  o="build/web/$(echo "$f" | tr '/' '_').o"
  em++ -std=c++20 -O2 -Wall -Wextra -Werror -I. --use-port=emdawnwebgpu -c "$f" -o "$o"
  n=$((n + 1))
done
echo "$n engine sources compiled"
echo "ENGINE TESTS PASSED"
