#include "looped/log.h"

#include <emscripten/emscripten.h>

#include <cstdarg>
#include <cstdio>
#include <string>

#include "looped/bridge.h"

namespace engine {
namespace {
bool g_batched = false;
}  // namespace

void logLine(LogLevel level, const char* format, ...) {
  char text[1024];
  va_list args;
  va_start(args, format);
  std::vsnprintf(text, sizeof(text), format, args);
  va_end(args);
  // While the frame loop runs, lines go out with the frame's mailbox flush
  // (one call per frame however many lines); a fatal one goes right away,
  // since there may be no next frame.
  if (g_batched && level != LogLevel::kFatal) {
    static const char* kLevels[] = {"info", "warn", "error", "fatal"};
    bridge::op(std::string("[\"log\",\"") + kLevels[static_cast<int>(level)] + "\"," + bridge::quote(text) + "]");
    return;
  }
  EM_ASM({
    var t = UTF8ToString($1);
    var h = window['loopedHost'];
    if (h && (h['has'] ? h['has']('log') : h['log'])) h['log']['add'](['info', 'warn', 'error', 'fatal'][$0], t);
    else console.log(t);
  }, static_cast<int>(level), text);
}

void batchLogs(bool on) { g_batched = on; }

void setStatus(const char* text) {
  static std::string shown;
  if (shown == text) return;  // only when it changes
  shown = text;
  bridge::op("[\"status\"," + bridge::quote(text) + "]");
  if (!g_batched) bridge::flush();  // no frame loop yet (e.g. start-up failed)
}

}  // namespace engine
