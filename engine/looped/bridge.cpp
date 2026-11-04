#include "looped/bridge.h"

#include <emscripten/emscripten.h>

#include <algorithm>
#include <cstdio>

#include "looped/json.h"
#include "looped/log.h"

namespace engine::bridge {
namespace {

// Must match bar/web/bridge.js (HEADER, MAX_TOUCHES, MAX_VOICES).
constexpr int kHeader = 24, kMaxTouches = 256, kMaxVoices = 32;
constexpr int kTextCap = 16 * 1024;

double g_in[kHeader + kMaxTouches * 5 + kMaxVoices * 2];
char g_text[kTextCap];
Frame g_frame;
std::vector<Touch> g_touches;
std::vector<std::pair<int, float>> g_voices;
std::string g_ui;
std::vector<RosterEntry> g_roster;
int g_rosterMax = 0;  // the highest player index the roster ever had
std::string g_out;  // queued ops, comma-separated
bool g_attached = false;

}  // namespace

void attach(const char* canvasSelector) {
  g_attached = EM_ASM_INT({
    var b = window['loopedHost']['bridge'];
    if (!b) return 0;
    b['attach'](UTF8ToString($0));
    return 1;
  }, canvasSelector) != 0;
}

void pull() {
  if (!g_attached) return;
  const int ok = EM_ASM_INT({
    var b = window['loopedHost']['bridge'];
    return b ? b['pull'](HEAPF64, $0 >> 3, HEAPU8, $1, $2) : 0;
  }, g_in, g_text, kTextCap);
  if (!ok) return;
  const double* h = g_in;
  Frame& f = g_frame;
  f.pulledMs = h[0];
  f.cssW = h[1];
  f.cssH = h[2];
  f.dpr = h[3] > 0 ? h[3] : 1;
  for (int i = 0; i < 4; ++i) f.safe[i] = static_cast<float>(h[4 + i]);
  f.hidden = h[8] != 0;
  f.blurs = static_cast<int>(h[9]);
  f.fieldFocused = h[10] != 0;
  f.modalOpen = h[11] != 0;
  f.audioRunning = h[12] != 0;
  f.audioTime = h[13];
  f.settingsVersion = static_cast<int>(h[14]);
  f.myVoiceLevel = static_cast<float>(h[15]);
  f.lastTouchMs = h[19];
  f.userSongCount = static_cast<int>(h[20]);
  f.musicTime[0] = h[22];
  f.musicTime[1] = h[23];
  const int nt = static_cast<int>(h[16]);
  for (int i = 0; i < nt && i < kMaxTouches; ++i) {
    const double* t = h + kHeader + i * 5;
    g_touches.push_back({static_cast<int>(t[0]), static_cast<int>(t[1]), static_cast<float>(t[2]),
                         static_cast<float>(t[3]), t[4]});
  }
  g_voices.clear();
  const int nv = static_cast<int>(h[17]);
  for (int i = 0; i < nv && i < kMaxVoices; ++i) {
    const double* v = h + kHeader + kMaxTouches * 5 + i * 2;
    g_voices.emplace_back(static_cast<int>(v[0]), static_cast<float>(v[1]));
  }
  constexpr int kHalf = kTextCap / 2;  // commands in the first half, the roster in the second
  const int textLen = static_cast<int>(h[18]);
  g_ui.assign(g_text, static_cast<size_t>(std::max(0, std::min(textLen, kHalf - 1))));
  const int rosterLen = static_cast<int>(h[21]);
  if (rosterLen >= 0) {
    const std::string_view text(g_text + kHalf, static_cast<size_t>(std::min(rosterLen, kHalf - 1)));
    std::string error;
    const Json list = Json::parse(text, &error);
    if (!error.empty()) {
      LOG_ERROR("Bridge: bad roster (%s).", error.c_str());
    } else {
      g_roster.clear();
      for (const Json& p : list.items()) {
        g_roster.push_back({p[0].integer(), p[1].string(), p[2].string(), p[3].integer(), p[4].integer() != 0});
        g_rosterMax = std::max(g_rosterMax, g_roster.back().index);
      }
    }
  }
}

const Frame& frame() { return g_frame; }

std::vector<Touch> takeTouches() {
  std::vector<Touch> t;
  t.swap(g_touches);
  return t;
}

float voiceLevel(int player) {
  for (const auto& [index, level] : g_voices) {
    if (index == player) return level;
  }
  return 0;
}

const std::string& uiCommandsJson() { return g_ui; }

const std::vector<RosterEntry>& roster() { return g_roster; }

int rosterMaxIndex() { return g_rosterMax; }

const RosterEntry* rosterFind(int index) {
  for (const RosterEntry& e : g_roster) {
    if (e.index == index) return &e;
  }
  return nullptr;
}

void op(std::string jsonArray) {
  if (!g_out.empty()) g_out += ',';
  g_out += jsonArray;
}

void flush() {
  if (g_out.empty()) return;
  const std::string json = "[" + g_out + "]";
  g_out.clear();
  EM_ASM({
    var b = window['loopedHost']['bridge'];
    if (b) b['flush'](UTF8ToString($0));
  }, json.c_str());
}

std::string quote(std::string_view text) { return jsonQuote(text); }

}  // namespace engine::bridge
