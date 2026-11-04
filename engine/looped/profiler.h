#pragma once
// Frame profiler: how long each part of a frame takes, how many things were
// drawn, hitches, and how long start-up took. Shown by the performance
// overlay (Settings → Performance overlay, or ?perf=1) and readable as
// window.loopedPerf (gathered only when read; tests print it, reports will
// send it).
//
// Per frame:  beginFrame()  →  PROFILE(Phase::kX) scopes ...  →  endFrame()
// Draw calls: prof::draw(indexCount) next to every Draw/DrawIndexed, with
// prof::setPass() choosing which pass they count for.
//
// Note: Safari rounds performance.now() to about 1 ms (no cross-origin
// isolation), so a single phase's time is coarse; averages over many frames
// are still right.
#include <webgpu/webgpu_cpp.h>

#include <cstdint>
#include <string>
#include <vector>

namespace engine {

class TextRenderer;

enum class Phase : uint8_t {
  kJobs,         // background loading work (runJobs)
  kInput,        // menu commands, settings, camera + walking
  kInteraction,  // what you look at / tap, seats, pickups
  kPhysics,      // glasses and bottles
  kNet,          // shared world, events, other players, voice, menu info
  kGames,        // piano, bartender
  kAcquire,      // getting the screen's next image
  kScene,        // boxes, avatars posed, uploads before drawing
  kText,         // HUD and labels queued
  kRender,       // drawing commands encoded and submitted
  kRace,         // the full-screen race (its sim + drawing)
  kEvents,       // touch / mouse handlers, run by the browser between frames
  kProfiler,     // this profiler and its overlay
  kCount
};
const char* phaseName(Phase phase);

namespace prof {
enum Pass : uint8_t { kMain, kMirror, kRacePass, kPassCount };
extern uint8_t gPass;
extern uint32_t gDraws[kPassCount];
extern uint64_t gTris[kPassCount];
inline void setPass(Pass p) { gPass = p; }
inline void draw(uint32_t indexOrVertexCount) {
  ++gDraws[gPass];
  gTris[gPass] += indexOrVertexCount / 3;
}
}  // namespace prof

class Profiler {
 public:
  static constexpr int kFrames = 600;  // twice a report's 300, so time under a menu leaves enough
  static constexpr int kReportFrames = 300;
  static constexpr float kHitchMs = 20.0f;

  struct Frame {
    float phaseMs[static_cast<int>(Phase::kCount)] = {};
    float cpuMs = 0;       // time inside frame()
    float intervalMs = 0;  // time since the previous frame started (what you feel)
    uint32_t draws[prof::kPassCount] = {};
    uint32_t tris[prof::kPassCount] = {};
    uint16_t jobsRun = 0, jobsPending = 0;
    float maxJobMs = 0;
    uint16_t heapMB = 0;
    uint8_t touches = 0;  // touch / mouse presses since the previous frame
    uint16_t moves = 0;   // touch / mouse move events since the previous frame
    float gpuMs = 0;      // newest submit-to-done time (see trackGpu)
    bool covered = false;  // a menu covered the bar (J110.4): left out of the numbers
    bool drawn = false;    // a picture was drawn (false: the GPU was still busy, J110.5)
  };
  struct Stats {
    int frames = 0;
    float avg = 0, p95 = 0, worst = 0;  // frame interval, ms
    float cpuAvg = 0, cpuWorst = 0;
    float gpuAvg = 0, gpuWorst = 0;
    float phaseAvg[static_cast<int>(Phase::kCount)] = {};
    int hitches = 0;
    int drawn = 0;  // frames that drew a picture (the rest: the GPU was still busy)
  };
  struct Hitch {
    double atMs;
    float intervalMs, cpuMs;
    Phase phase;  // the phase that took longest in that frame
    float phaseMs;
    int touches;  // touch presses just before that frame (to spot tap stutters)
    int moves;     // move events just before it
    float eventsMs;  // time in their handlers
    float gpuMs;
  };

  void beginFrame(double nowMs);
  void endFrame(double nowMs);
  // This frame drew under a menu or panel that covers the bar: the page's
  // own drawing costs more then, and it isn't what playing feels like.
  void setCovered(bool covered) { current_.covered = covered; }
  // This frame drew a picture (it may skip drawing while the GPU is busy:
  // the clock still ticks at 60, the screen doesn't change).
  void drew() { current_.drawn = true; }
  // A touch or mouse event's own time (same clock as emscripten_get_now):
  // the oldest one this frame read, for the touch-to-screen time (J110.5).
  void input(double eventMs) {
    if (eventMs > 0 && (inputMs_ <= 0 || eventMs < inputMs_)) inputMs_ = eventMs;
  }
  // Touch to screen (J110.5), the last kLagSamples touches: from the event
  // to the frame that read it starting, to its drawing being handed to the
  // GPU, to the GPU saying it's done (the picture shows on the next refresh).
  struct Lag {
    float toFrame = 0, toSubmit = 0, toDone = 0;
  };
  static constexpr int kLagSamples = 64;
  void add(Phase phase, double ms) { current_.phaseMs[static_cast<int>(phase)] += static_cast<float>(ms); }
  void jobs(int ran, size_t pending, double maxJobMs);
  // A touch or mouse event arrived (looped/input.cpp).
  // Events arrive between frames, so they're held until the next one starts.
  void touch() { if (pendingTouches_ < 255) ++pendingTouches_; }
  // Time spent in an input event handler (move = a touchmove / mousemove).
  void event(double ms, bool move) {
    pendingEventsMs_ += ms;
    if (move && pendingMoves_ < 65535) ++pendingMoves_;
  }
  // Call right after a Submit: measures until the GPU has finished that work
  // (an upper bound on GPU time per frame; one measurement in flight).
  void trackGpu(const wgpu::Queue& queue);

  // A start-up milestone ("gpu", "scene", "model:piano"...), in ms since the
  // page started loading. Logged too.
  void stage(const std::string& name, bool log = true);
  void entered(double nowMs);

  // Last `count` complete frames.
  Stats stats(int count) const;
  const Frame& frame(int back) const;  // 0 = the newest complete frame
  int frameCount() const { return count_; }
  // Everything window.loopedPerf shows, as JSON.
  std::string json() const;

  // Overlay on/off (settings "perf" or ?perf=1).
  bool overlay = false;
  // Extra numbers a game adds to the JSON (one JSON object, e.g. the bar's
  // GPU check, J107.2): shown as "extra".
  std::string extra = "null";
  // Queues the overlay into the text renderer (W, H in device pixels; px =
  // device pixels per CSS pixel). Call before text.upload().
  void drawOverlay(TextRenderer& text, float W, float H, float px);

 private:
  void publish();

  Frame frames_[kFrames];
  int head_ = 0, count_ = 0;
  Frame current_;
  double frameStartMs_ = 0, lastStartMs_ = 0;
  bool published_ = false;
  float maxJobMs_ = 0;          // the longest single background job so far
  float loadingWorstCpu_ = 0;   // the slowest frame (CPU) before entering
  uint16_t lastHeapMB_ = 0;
  int heapGrowths_ = 0;         // times the heap grew after start-up ("running")
  bool countGrowth_ = false;
  uint8_t pendingTouches_ = 0;
  uint16_t pendingMoves_ = 0;
  double pendingEventsMs_ = 0;
  bool gpuInFlight_ = false;
  double inputMs_ = 0;  // the oldest input event read this frame (0: none)
  Lag lags_[kLagSamples];
  int lagHead_ = 0, lagCount_ = 0;
  float lastGpuMs_ = 0;
  int pauses_ = 0;  // gaps over 1 s (app in the background): not counted as hitches
  std::vector<std::pair<std::string, double>> stages_;
  std::vector<Hitch> hitches_;  // newest last, at most 32
  int hitchesTotal_ = 0, hitchesAfterEnter_ = 0;
  double enteredMs_ = 0;
  float worstAfterEnter_ = 0;  // worst frame in the first 10 s after entering
};

Profiler& profiler();

// Adds the time from construction to destruction to a phase.
class ProfileScope {
 public:
  explicit ProfileScope(Phase phase);
  ~ProfileScope();
  ProfileScope(const ProfileScope&) = delete;
  ProfileScope& operator=(const ProfileScope&) = delete;

 private:
  Phase phase_;
  double start_;
};

}  // namespace engine

#define ENGINE_PROFILE_CAT2(a, b) a##b
#define ENGINE_PROFILE_CAT(a, b) ENGINE_PROFILE_CAT2(a, b)
#define PROFILE(phase) engine::ProfileScope ENGINE_PROFILE_CAT(profileScope_, __LINE__)(phase)
