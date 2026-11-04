#include "looped/profiler.h"

#include <emscripten/emscripten.h>
#include <emscripten/heap.h>

#include <algorithm>
#include <cstdio>

#include "looped/log.h"
#include "looped/text.h"

namespace engine {

namespace prof {
uint8_t gPass = kMain;
uint32_t gDraws[kPassCount] = {};
uint64_t gTris[kPassCount] = {};
}  // namespace prof

namespace {
constexpr int kPhases = static_cast<int>(Phase::kCount);
constexpr const char* kPhaseNames[kPhases] = {"jobs",  "input", "interaction", "physics", "net",  "games",
                                              "acquire", "scene", "text",       "render",  "race", "events", "profiler"};
constexpr size_t kMaxHitches = 32;
constexpr int kOverlayFrames = 120;
}  // namespace

const char* phaseName(Phase phase) { return kPhaseNames[static_cast<int>(phase)]; }

Profiler& profiler() {
  static Profiler p;
  return p;
}

ProfileScope::ProfileScope(Phase phase) : phase_(phase), start_(emscripten_get_now()) {}
ProfileScope::~ProfileScope() { profiler().add(phase_, emscripten_get_now() - start_); }

void Profiler::beginFrame(double nowMs) {
  // The time since the previous frame started belongs to that frame: its
  // work plus whatever the browser and GPU did before this one could start.
  if (count_ > 0 && lastStartMs_ > 0) {
    Frame& last = frames_[(head_ + kFrames - 1) % kFrames];
    last.intervalMs = static_cast<float>(nowMs - lastStartMs_);
    // Touches queued during that interval (read just before this call).
    last.touches = pendingTouches_;
    last.moves = pendingMoves_;
    last.phaseMs[static_cast<int>(Phase::kEvents)] = static_cast<float>(pendingEventsMs_);
    if (last.intervalMs > 1000) {  // the app was in the background, not a hitch
      last.intervalMs = 0;
      ++pauses_;
    }
    const bool afterEnter = enteredMs_ > 0 && lastStartMs_ >= enteredMs_;
    if (afterEnter && lastStartMs_ - enteredMs_ < 10000) worstAfterEnter_ = std::max(worstAfterEnter_, last.intervalMs);
    if (last.intervalMs > kHitchMs && !last.covered) {
      int top = 0;
      for (int p = 1; p < kPhases; ++p) {
        if (last.phaseMs[p] > last.phaseMs[top]) top = p;
      }
      ++hitchesTotal_;
      if (afterEnter) ++hitchesAfterEnter_;
      if (hitches_.size() == kMaxHitches) hitches_.erase(hitches_.begin());
      hitches_.push_back(
          {lastStartMs_, last.intervalMs, last.cpuMs, static_cast<Phase>(top), last.phaseMs[top], last.touches, last.moves,
           last.phaseMs[static_cast<int>(Phase::kEvents)],
           last.gpuMs});
    }
  }
  lastStartMs_ = frameStartMs_ = nowMs;
  current_ = Frame{};
  pendingTouches_ = 0;
  pendingMoves_ = 0;
  pendingEventsMs_ = 0;
  for (int p = 0; p < prof::kPassCount; ++p) {
    prof::gDraws[p] = 0;
    prof::gTris[p] = 0;
  }
  prof::gPass = prof::kMain;
}

void Profiler::jobs(int ran, size_t pending, double maxJobMs) {
  current_.jobsRun = static_cast<uint16_t>(std::min(ran, 65535));
  current_.jobsPending = static_cast<uint16_t>(std::min<size_t>(pending, 65535));
  current_.maxJobMs = static_cast<float>(maxJobMs);
  maxJobMs_ = std::max(maxJobMs_, current_.maxJobMs);
}

void Profiler::endFrame(double nowMs) {
  current_.cpuMs = static_cast<float>(nowMs - frameStartMs_);
  if (enteredMs_ == 0) loadingWorstCpu_ = std::max(loadingWorstCpu_, current_.cpuMs);
  for (int p = 0; p < prof::kPassCount; ++p) {
    current_.draws[p] = prof::gDraws[p];
    current_.tris[p] = static_cast<uint32_t>(std::min<uint64_t>(prof::gTris[p], 0xffffffffu));
  }
  current_.heapMB = static_cast<uint16_t>(emscripten_get_heap_size() >> 20);
  if (countGrowth_ && current_.heapMB > lastHeapMB_) ++heapGrowths_;
  lastHeapMB_ = current_.heapMB;
  current_.gpuMs = lastGpuMs_;
  Frame& slot = frames_[head_];
  slot = current_;
  head_ = (head_ + 1) % kFrames;
  count_ = std::min(count_ + 1, kFrames);
  if (!published_) {
    published_ = true;
    publish();
  }
  slot.phaseMs[static_cast<int>(Phase::kProfiler)] += static_cast<float>(emscripten_get_now() - nowMs);
}

const Profiler::Frame& Profiler::frame(int back) const {
  return frames_[(head_ + kFrames * 2 - 1 - back) % kFrames];
}

Profiler::Stats Profiler::stats(int count) const {
  Stats s;
  float intervals[kFrames];
  int n = 0;
  // The newest `count` frames drawn with nothing covering the bar.
  for (int i = 0; i < count_ && s.frames < count; ++i) {
    const Frame& f = frame(i);
    if (f.covered) continue;
    if (f.drawn) ++s.drawn;
    s.cpuAvg += f.cpuMs;
    s.cpuWorst = std::max(s.cpuWorst, f.cpuMs);
    s.gpuAvg += f.gpuMs;
    s.gpuWorst = std::max(s.gpuWorst, f.gpuMs);
    for (int p = 0; p < kPhases; ++p) s.phaseAvg[p] += f.phaseMs[p];
    ++s.frames;
    if (f.intervalMs <= 0) continue;  // the newest frame isn't finished timing
    intervals[n++] = f.intervalMs;
    s.avg += f.intervalMs;
    s.worst = std::max(s.worst, f.intervalMs);
    if (f.intervalMs > kHitchMs) ++s.hitches;
  }
  if (s.frames) {
    s.cpuAvg /= static_cast<float>(s.frames);
    s.gpuAvg /= static_cast<float>(s.frames);
    for (float& p : s.phaseAvg) p /= static_cast<float>(s.frames);
  }
  if (n) {
    s.avg /= static_cast<float>(n);
    const int k = std::min(n - 1, static_cast<int>(n * 0.95f));
    std::nth_element(intervals, intervals + k, intervals + n);
    s.p95 = intervals[k];
  }
  return s;
}

void Profiler::trackGpu(const wgpu::Queue& queue) {
  const double start = emscripten_get_now();
  // A frame that read a touch: timed from the touch to the GPU's "done"
  // (each such frame, even while another measurement is in flight).
  if (inputMs_ > 0) {
    const double in = inputMs_, frameStart = frameStartMs_;
    inputMs_ = 0;
    queue.OnSubmittedWorkDone(wgpu::CallbackMode::AllowSpontaneous,
                              [this, in, frameStart, start](wgpu::QueueWorkDoneStatus, wgpu::StringView) {
                                Lag& l = lags_[lagHead_];
                                l.toFrame = static_cast<float>(frameStart - in);
                                l.toSubmit = static_cast<float>(start - in);
                                l.toDone = static_cast<float>(emscripten_get_now() - in);
                                lagHead_ = (lagHead_ + 1) % kLagSamples;
                                lagCount_ = std::min(lagCount_ + 1, kLagSamples);
                              });
  }
  if (gpuInFlight_) return;
  gpuInFlight_ = true;
  queue.OnSubmittedWorkDone(wgpu::CallbackMode::AllowSpontaneous,
                            [this, start](wgpu::QueueWorkDoneStatus, wgpu::StringView) {
                              lastGpuMs_ = static_cast<float>(emscripten_get_now() - start);
                              gpuInFlight_ = false;
                            });
}

void Profiler::stage(const std::string& name, bool log) {
  const double t = emscripten_get_now();
  stages_.emplace_back(name, t);
  if (name == "running") {  // count growth from here on
    countGrowth_ = true;
    lastHeapMB_ = static_cast<uint16_t>(emscripten_get_heap_size() >> 20);
  }
  if (log) LOG_INFO("Stage %s at %.0f ms.", name.c_str(), t);
}

void Profiler::entered(double nowMs) {
  if (enteredMs_ > 0) return;
  enteredMs_ = nowMs;
  stage("entered");
}

// window.loopedPerf is a getter: the numbers are only gathered when a test
// or report reads it, so playing costs nothing.
void Profiler::publish() {
  EM_ASM({
    Object.defineProperty(window, 'loopedPerf', {
      configurable: true,
      get: function () { try { return JSON.parse(UTF8ToString(Module['_engine_perf_json']())); } catch (e) { return null; } },
    });
  });
}

// The last 5 seconds in numbers, plus start-up stages, as JSON.
std::string Profiler::json() const {
  const double nowMs = emscripten_get_now();
  const Stats s = stats(kReportFrames);
  const Frame& f = frame(0);
  std::string j;
  j.reserve(2048);
  char b[512];
  std::snprintf(b, sizeof(b),
                "{\"t\":%.0f,\"frames\":%d,\"avg\":%.2f,\"p95\":%.2f,\"worst\":%.2f,\"cpu\":%.2f,\"cpuWorst\":%.2f,\"gpu\":%.2f,\"gpuWorst\":%.2f,\"pauses\":%d,"
                "\"hitches\":%d,\"hitchesTotal\":%d,\"hitchesAfterEnter\":%d,\"worstAfterEnter\":%.1f,\"maxJobMs\":%.2f,\"loadingWorstCpu\":%.1f,\"heapGrowths\":%d,",
                nowMs, s.frames, s.avg, s.p95, s.worst, s.cpuAvg, s.cpuWorst, s.gpuAvg, s.gpuWorst, pauses_, s.hitches, hitchesTotal_,
                hitchesAfterEnter_, worstAfterEnter_, maxJobMs_, loadingWorstCpu_, heapGrowths_);
  j += b;
  j += "\"phases\":{";
  for (int p = 0; p < kPhases; ++p) {
    std::snprintf(b, sizeof(b), "%s\"%s\":%.3f", p ? "," : "", kPhaseNames[p], s.phaseAvg[p]);
    j += b;
  }
  std::snprintf(b, sizeof(b),
                "},\"draws\":{\"main\":%u,\"mirror\":%u,\"race\":%u},\"tris\":{\"main\":%u,\"mirror\":%u,\"race\":%u},"
                "\"jobsPending\":%u,\"heapMB\":%u,\"recentHitches\":[",
                f.draws[0], f.draws[1], f.draws[2], f.tris[0], f.tris[1], f.tris[2], f.jobsPending, f.heapMB);
  j += b;
  for (size_t i = 0; i < hitches_.size(); ++i) {
    const Hitch& h = hitches_[i];
    std::snprintf(b, sizeof(b), "%s{\"at\":%.0f,\"ms\":%.1f,\"cpu\":%.1f,\"phase\":\"%s\",\"phaseMs\":%.1f,\"touches\":%d,\"moves\":%d,\"eventsMs\":%.2f,\"gpu\":%.1f}",
                  i ? "," : "", h.atMs, h.intervalMs, h.cpuMs, phaseName(h.phase), h.phaseMs, h.touches, h.moves, h.eventsMs, h.gpuMs);
    j += b;
  }
  j += "]";
  // Touch to screen (J110.5): averages and the slowest of the last touches.
  {
    float f = 0, sub = 0, done = 0, worst = 0;
    for (int i = 0; i < lagCount_; ++i) {
      f += lags_[i].toFrame;
      sub += lags_[i].toSubmit;
      done += lags_[i].toDone;
      worst = std::max(worst, lags_[i].toDone);
    }
    const float n = static_cast<float>(std::max(lagCount_, 1));
    std::snprintf(b, sizeof(b), ",\"drawn\":%d,\"touchLag\":{\"n\":%d,\"toFrame\":%.1f,\"toSubmit\":%.1f,\"toDone\":%.1f,\"worst\":%.1f}",
                  s.drawn, lagCount_, f / n, sub / n, done / n, worst);
    j += b;
  }
  j += ",\"extra\":" + extra + ",\"stages\":{";
  for (size_t i = 0; i < stages_.size(); ++i) {
    std::snprintf(b, sizeof(b), "%s\"%s\":%.0f", i ? "," : "", stages_[i].first.c_str(), stages_[i].second);
    j += b;
  }
  j += "}}";
  return j;
}

void Profiler::drawOverlay(TextRenderer& text, float W, float H, float px) {
  if (!overlay) return;
  PROFILE(Phase::kProfiler);
  const float u = px;
  const float x0 = 6 * u, y0 = 64 * u;  // below the status line and Menu buttons
  const float panelW = std::min(250 * u, W - 12 * u);
  const float graphH = 50 * u;  // 1 CSS px per ms, up to 50 ms
  const float barW = panelW / kOverlayFrames;
  text.addRect(x0, y0, panelW, graphH + 46 * u, {0, 0, 0, 0.6f});
  // Bars: the frame interval, colored by how it feels; the CPU part inside.
  const int n = std::min(count_, kOverlayFrames);
  for (int i = 0; i < n; ++i) {
    const Frame& f = frame(i);
    const float x = x0 + panelW - (static_cast<float>(i) + 1) * barW;
    const float ms = f.intervalMs > 0 ? f.intervalMs : f.cpuMs;
    const float h = std::min(ms, 50.0f) * u;
    const Vec4 color = ms <= 18 ? Vec4{0.2f, 0.85f, 0.3f, 0.9f} : ms <= 34 ? Vec4{0.95f, 0.8f, 0.1f, 0.9f}
                                                                          : Vec4{0.95f, 0.2f, 0.15f, 0.95f};
    text.addRect(x, y0 + graphH - h, std::max(barW - 0.5f * u, 1.0f), h, color);
    const float c = std::min(f.cpuMs, 50.0f) * u;
    text.addRect(x, y0 + graphH - c, std::max(barW - 0.5f * u, 1.0f), c, {0.25f, 0.45f, 1.0f, 0.9f});
  }
  // Lines at 60 fps (16.7 ms) and 30 fps (33.3 ms).
  text.addRect(x0, y0 + graphH - 16.7f * u, panelW, 1 * u, {1, 1, 1, 0.5f});
  text.addRect(x0, y0 + graphH - 33.3f * u, panelW, 1 * u, {1, 1, 1, 0.3f});

  const Stats s = stats(kOverlayFrames);
  int order[kPhases];
  for (int p = 0; p < kPhases; ++p) order[p] = p;
  std::sort(order, order + kPhases, [&](int a, int b) { return s.phaseAvg[a] > s.phaseAvg[b]; });
  const Frame& f = frame(0);
  char line[160];
  TextStyle st;
  st.outlineWidth = 0.5f;
  float y = y0 + graphH + 4 * u;
  std::snprintf(line, sizeof(line), "frame %.1f  p95 %.1f  worst %.0f  cpu %.1f  gpu %.1f", s.avg, s.p95, s.worst,
                s.cpuAvg, s.gpuAvg);
  text.addScreen(line, x0 + 4 * u, y, 7 * u, st);
  y += 11 * u;
  std::snprintf(line, sizeof(line), "%s %.2f  %s %.2f  %s %.2f", kPhaseNames[order[0]], s.phaseAvg[order[0]],
                kPhaseNames[order[1]], s.phaseAvg[order[1]], kPhaseNames[order[2]], s.phaseAvg[order[2]]);
  text.addScreen(line, x0 + 4 * u, y, 7 * u, st);
  y += 11 * u;
  std::snprintf(line, sizeof(line), "draws %u+%u  tris %uk+%uk  jobs %u  %uMB", f.draws[0] + f.draws[2], f.draws[1],
                (f.tris[0] + f.tris[2]) / 1000, f.tris[1] / 1000, f.jobsPending, f.heapMB);
  text.addScreen(line, x0 + 4 * u, y, 7 * u, st);
  (void)H;
}

}  // namespace engine

extern "C" EMSCRIPTEN_KEEPALIVE const char* engine_perf_json() {
  static std::string json;
  json = engine::profiler().json();
  return json.c_str();
}
