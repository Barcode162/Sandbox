// Times the piano synth (looped/synth.cpp): middle C and 30 keys across the
// keyboard, plus a checksum so changes to the sound show up.
//   g++ -std=c++20 -O2 -I. tools/native/synth_bench.cpp looped/synth.cpp -o build/synth_bench && build/synth_bench
// Fails (exit 1) if middle C takes over 2.5 ms or the 30 keys over 60 ms
// (native limits; pass --print to only print, e.g. for the slower wasm build).
#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <string>

#include "looped/synth.h"

using Clock = std::chrono::steady_clock;

static double ms(Clock::time_point a, Clock::time_point b) {
  return std::chrono::duration<double, std::milli>(b - a).count();
}

int main(int argc, char** argv) {
  // Warm up once (caches, tables).
  (void)engine::synth::pianoNote(60);
  double best = 1e9;
  size_t length = 0;
  for (int r = 0; r < 5; ++r) {
    const auto t0 = Clock::now();
    const auto note = engine::synth::pianoNote(60);
    best = std::min(best, ms(t0, Clock::now()));
    length = note.size();
  }
  double all = 1e9, energy = 0;
  for (int r = 0; r < 3; ++r) {  // best of 3, so a busy machine doesn't fail it
    energy = 0;
    const auto t0 = Clock::now();
    for (int i = 0; i < 30; ++i) {
      const auto note = engine::synth::pianoNote(21 + i * 3);
      for (float x : note) energy += static_cast<double>(x) * x;
    }
    all = std::min(all, ms(t0, Clock::now()));
  }
  std::printf("middle C: %.2f ms (%zu samples, %.2f s); 30 keys: %.1f ms; energy %.1f\n", best, length,
              length / engine::synth::kRate, all, energy);
  const bool printOnly = argc > 1 && std::string(argv[1]) == "--print";
  const bool ok = printOnly || (best <= 2.5 && all <= 60);
  if (!ok) std::printf("SYNTH BENCH FAILED (limits: middle C 2.5 ms, 30 keys 60 ms)\n");
  return ok ? 0 : 1;
}
