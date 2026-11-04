#include "looped/frame_time.h"

#include <emscripten/emscripten.h>

#include <algorithm>

namespace engine {
namespace {
FrameTime g_time;
}  // namespace

void beginFrameTime(double rafMs) {
  FrameTime& t = g_time;
  const double gap = t.index == 0 ? 0 : rafMs - t.nowMs;
  t.resumed = gap > kResumeGapMs;
  t.gapMs = gap;
  t.dt = static_cast<float>(std::clamp(gap / 1000.0, 0.0, static_cast<double>(kMaxDt)));
  t.nowMs = std::max(rafMs, t.nowMs);  // never backwards
  ++t.index;
}

const FrameTime& frameTime() { return g_time; }

double clockMs() { return emscripten_get_now(); }

}  // namespace engine
