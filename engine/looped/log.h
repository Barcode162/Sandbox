#pragma once
// Logging. Every line goes to the page's log (window.loopedHost.log, looped/host.h):
// a ring of the last 300 lines with times and levels, shown in the log
// panel and sent along with reports (Menu → Settings → Send report).
// - info: normal events.
// - warn: something degraded but the game goes on (no sound, a retry).
// - error: something failed; a red badge counts them (the panel stays shut).
// - fatal: the game can't go on; "Something broke - tap to rejoin" and an
//   automatic report.
// Repeats are rate-limited in the page (first 3 per second, then "×N").
// A leading "Word:" in the text ("Multiplayer: ...") is its category.

namespace engine {
enum class LogLevel { kInfo, kWarn, kError, kFatal };
void logLine(LogLevel level, const char* format, ...) __attribute__((format(printf, 2, 3)));

// Sets the one-line status text (FPS, resolution) at the top of the screen.
void setStatus(const char* text);
// Lines go out with the frame's mailbox flush (looped/bridge.h) while on.
void batchLogs(bool on);
}  // namespace engine

#define LOG_INFO(...) engine::logLine(engine::LogLevel::kInfo, __VA_ARGS__)
#define LOG_WARN(...) engine::logLine(engine::LogLevel::kWarn, __VA_ARGS__)
#define LOG_ERROR(...) engine::logLine(engine::LogLevel::kError, __VA_ARGS__)
#define LOG_FATAL(...) engine::logLine(engine::LogLevel::kFatal, __VA_ARGS__)
