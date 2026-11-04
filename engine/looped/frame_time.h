#pragma once
// One clock per frame. The browser hands each animation frame its start
// time; the game reads that one time (frameTime()) everywhere in the frame,
// so everything in a frame agrees on "now". clockMs() is the running clock,
// only for measuring how long something took (logs, deadlines, profiler).
#include <cstdint>

namespace engine {

struct FrameTime {
  double nowMs = 0;       // this frame's time (the browser's frame timestamp, ms)
  float dt = 0;           // seconds since the last frame, at most kMaxDt
  uint64_t index = 0;     // frames so far
  bool resumed = false;   // the first frame after a long gap (the page was hidden)
  double gapMs = 0;       // how long that gap was
};

constexpr float kMaxDt = 0.1f;            // a stall never moves things further than this
constexpr double kResumeGapMs = 250;      // a gap this long counts as "was away"

// Call once at the very start of a frame with the browser's frame time.
void beginFrameTime(double rafMs);
const FrameTime& frameTime();
// The running clock (ms), for measuring durations only.
double clockMs();

}  // namespace engine
