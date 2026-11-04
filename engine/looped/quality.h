// Picture quality: how many pixels the game draws (RESTRUCTURE 6.7), and
// since J107 the level every feature follows (the game's table: bar/game.cpp
// applyQuality). Settings → Graphics: Auto, Ultra, High, Medium, Low. Ultra
// draws at up to 3 device pixels per CSS pixel (chosen only by hand), High 2
// (the old fixed cap), Medium 1.6, Low 1.3. On Auto the
// controller watches the frames and steps down when the GPU is what keeps the
// frame rate under 60 (frames slow while the game's own CPU work is small),
// and back up when the GPU has room to spare at the sharper level.
// Plain C++ (no browser), so tools/native/quality_test.cpp runs it.
#pragma once

#include <algorithm>

namespace engine {

class QualityController {
 public:
  enum Mode { kAuto = 0, kHigh = 1, kMedium = 2, kLow = 3, kUltra = 4 };
  enum Level { kLevelUltra = 0, kLevelHigh = 1, kLevelMedium = 2, kLevelLow = 3 };
  static constexpr int kTiers = 3;
  static constexpr double kRatio[kTiers] = {2.0, 1.6, 1.3};  // device pixels per CSS pixel

  // Settings "quality" (0 Auto, 1 High, 2 Medium, 3 Low, 4 Ultra).
  void setMode(int mode, double nowMs) {
    mode = std::clamp(mode, 0, 4);
    if (mode == mode_) return;
    mode_ = mode;
    ultra_ = mode_ == kUltra;
    if (mode_ != kAuto && !ultra_) tier_ = mode_ - 1;
    if (ultra_) tier_ = 0;
    ultraStep_ = 0;
    calmWindows_ = 0;
    resetWindow(nowMs);
    lastChangeMs_ = nowMs;
  }
  int mode() const { return mode_; }
  int tier() const { return tier_; }  // Auto's steps: 0 High (sharpest Auto goes), 1 Medium, 2 Low
  // The level every feature follows: 0 Ultra, 1 High, 2 Medium, 3 Low.
  int level() const { return ultra_ ? kLevelUltra : tier_ + 1; }
  double pixelRatioCap() const { return ultra_ ? kUltraRatios[ultraStep_] : kRatio[tier_]; }
  // Ultra keeps its features and eases while pictures fall behind: first its
  // sharpness (3x, 2.5x, 2x, J110.3), then the lamps a pixel goes through
  // (16, 12, 10: each lamp's reach shortens a little, J111.2); back when steady.
  static constexpr int kUltraSteps = 5;
  static constexpr double kUltraRatios[kUltraSteps] = {3.0, 2.5, 2.0, 2.0, 2.0};
  static constexpr int kUltraLamps[kUltraSteps] = {16, 16, 16, 12, 10};
  int ultraStep() const { return ultraStep_; }
  int ultraLamps() const { return kUltraLamps[ultraStep_]; }

  // Power (Settings → Graphics, J111.3): 0 Cooler (the game draws 30 a
  // second: half the pictures is on time), 1 Balanced, 2 EXTREME (never
  // eases: Ultra stays at 3x, Auto at High).
  enum Power { kCooler = 0, kBalanced = 1, kExtreme = 2 };
  void setPower(int power, double nowMs) {
    power = std::clamp(power, 0, 2);
    if (power == power_) return;
    power_ = power;
    expectedDrawn_ = power_ == kCooler ? 0.5f : 1.0f;
    if (power_ == kExtreme) tier_ = ultraStep_ = 0;
    if (power_ == kExtreme && mode_ != kAuto && !ultra_) tier_ = mode_ - 1;
    calmWindows_ = 0;
    resetWindow(nowMs);
    lastChangeMs_ = nowMs;
  }
  int power() const { return power_; }

  // One finished frame: the time since the previous one (what you feel),
  // the game's CPU time, and the newest GPU submit-to-done wait (kept for
  // the reports; not used: on phones it counts the frames queued ahead, so
  // it reads 50 ms while frames come every 17, J110.3). `drawing` false
  // (loading, another game has the screen, the page was hidden) pauses
  // watching. Auto steps its tier, Ultra its sharpness (3x, 2.5x, 2x), by
  // the late frames: returns true when either changed.
  // `drew`: this frame drew a picture (false: the GPU was still busy with
  // the ones before, so the screen didn't change: J111.2).
  bool frame(double nowMs, float intervalMs, float cpuMs, float /*gpuMs*/, bool drawing, bool drew = true) {
    if ((mode_ != kAuto && !ultra_) || power_ == kExtreme || !drawing || intervalMs > 100) {  // a hitch or a pause: not a GPU signal
      if (!drawing) resetWindow(nowMs);
      return false;
    }
    if (windowStartMs_ < 0) resetWindow(nowMs);
    ++frames_;
    sumInterval_ += intervalMs;
    sumCpu_ += cpuMs;
    if (intervalMs > kLateMs) ++late_;
    if (drew) ++drawn_;
    if (nowMs - windowStartMs_ < kWindowMs) return false;
    const float n = static_cast<float>(frames_);
    const float interval = sumInterval_ / n, cpu = sumCpu_ / n, lateShare = static_cast<float>(late_) / n;
    const float drawnShare = static_cast<float>(drawn_) / n / expectedDrawn_;  // 1 = every picture on time
    resetWindow(nowMs);
    if (nowMs - lastChangeMs_ < kSettleMs) return false;
    int& step = ultra_ ? ultraStep_ : tier_;
    const int lowest = ultra_ ? kUltraSteps - 1 : kTiers - 1;
    // Late or slow frames while the CPU is idle: the GPU is the limit.
    const bool slow = (interval > kSlowMs || lateShare > kLateShareDown || drawnShare < kDrawnDown) && cpu < kCpuBoundMs;
    if (slow && step < lowest) {
      ++step;
      if (nowMs - lastUpMs_ < kBounceMs) upBlockedUntilMs_ = nowMs + kUpBlockMs;  // went up, came straight back down
      calmWindows_ = 0;
      lastChangeMs_ = nowMs;
      return true;
    }
    // Steady for a few windows in a row: try the sharper step again.
    if (step > 0 && nowMs >= upBlockedUntilMs_) {
      const bool calm = interval < kSmoothMs && lateShare < kLateShareUp && drawnShare >= kDrawnUp;
      calmWindows_ = calm ? calmWindows_ + 1 : 0;
      if (calmWindows_ >= kCalmWindows) {
        --step;
        calmWindows_ = 0;
        lastChangeMs_ = lastUpMs_ = nowMs;
        return true;
      }
    }
    return false;
  }

  static constexpr double kWindowMs = 2000;    // averages over 2 s
  static constexpr double kSettleMs = 4000;    // no change sooner than 4 s after the last
  static constexpr float kSlowMs = 18.5f;      // average frame slower than this: under 60
  static constexpr float kSmoothMs = 17.5f;
  static constexpr float kLateMs = 20.0f;      // a frame you feel as a stutter
  static constexpr float kLateShareDown = 0.06f;  // more late frames than this: step down
  static constexpr float kLateShareUp = 0.02f;    // fewer than this: calm
  static constexpr float kDrawnDown = 0.9f;  // fewer pictures drawn than this share: behind
  static constexpr float kDrawnUp = 0.97f;   // at least this: calm
  static constexpr float kCpuBoundMs = 8.0f;   // above this, fewer pixels wouldn't help
  static constexpr int kCalmWindows = 3;        // 6 s of calm before stepping up
  static constexpr double kBounceMs = 15000;
  static constexpr double kUpBlockMs = 60000;  // after a bounce, stay down for a minute

 private:
  void resetWindow(double nowMs) {
    windowStartMs_ = nowMs;
    frames_ = late_ = drawn_ = 0;
    sumInterval_ = sumCpu_ = 0;
  }
  int mode_ = kAuto;
  int tier_ = 0;
  bool ultra_ = false;
  double windowStartMs_ = -1;
  int frames_ = 0, late_ = 0, drawn_ = 0;
  int power_ = kBalanced;
  float expectedDrawn_ = 1.0f;
  int ultraStep_ = 0;  // Ultra's sharpness: kUltraRatios[ultraStep_]
  float sumInterval_ = 0, sumCpu_ = 0;
  double lastChangeMs_ = -1e9, lastUpMs_ = -1e9, upBlockedUntilMs_ = 0;
  int calmWindows_ = 0;
};

}  // namespace engine
