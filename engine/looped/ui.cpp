#include "looped/ui.h"

#include <emscripten/emscripten.h>

#include <cstdlib>
#include <map>

#include "looped/bridge.h"
#include "looped/json.h"
#include "looped/log.h"

namespace engine::ui {

void takeCommands(std::vector<Command>& out) {
  // Collected by the page mailbox at the start of the frame (looped/bridge.h).
  const std::string& text = bridge::uiCommandsJson();
  if (text.empty()) return;
  std::string error;
  const Json list = Json::parse(text, &error);
  if (!error.empty()) {
    LOG_ERROR("Menu commands: bad JSON (%s).", error.c_str());
    return;
  }
  for (const Json& c : list.items()) {
    if (!c.isArray() || !c[0].isString()) continue;
    out.push_back({c[0].string(), c[1].number(), c[2].number(), c[3].string(), c[4].string()});
  }
}

void setInfo(const std::string& jsonObject) { bridge::op("[\"info\"," + jsonObject + "]"); }

void toast(const std::string& text) { bridge::op("[\"toast\"," + jsonQuote(text) + "]"); }

void openPanel(const std::string& name) { bridge::op("[\"panel\"," + jsonQuote(name) + "]"); }

std::string pageQuery() {
  char buffer[512] = {};
  EM_ASM({
    var q = location.search.slice(1).split("&").map(function(p) {
      var i = p.indexOf("=");
      try { return i < 0 ? p : p.slice(0, i) + "=" + decodeURIComponent(p.slice(i + 1)).replace(/&/g, ""); }
      catch (e) { return p; }
    }).join("&");
    stringToUTF8(q, $0, $1);
  }, buffer, sizeof(buffer));
  return buffer;
}

bool hasBadge(const std::string& badge) {
  struct Cached { bool has; double atMs; };
  static std::map<std::string, Cached> cache;
  const double now = emscripten_get_now();
  const auto it = cache.find(badge);
  if (it != cache.end() && now - it->second.atMs < 1000) return it->second.has;
  const bool has = EM_ASM_INT({
    var a = window['loopedHost']['account'];
    if (a && a['hasBadge'] && a['hasBadge'](UTF8ToString($0))) return 1;
    var local = /^localhost$|^127[.]/.test(location.hostname);
    return local && new RegExp('[?&]badge=' + UTF8ToString($0)).test(location.search) ? 1 : 0;
  }, badge.c_str()) != 0;
  cache[badge] = {has, now};
  return has;
}

void entered() {
  EM_ASM({ if (window['loopedHost']['voice'] && window['loopedHost']['voice']['entered']) window['loopedHost']['voice']['entered'](); });
}

void loadingProgress(int done, int total, float progress) {
  EM_ASM({ if (window['barLoading']) window['barLoading']['set']($0, $1, $2); }, done, total, progress);
}
void loadingStage(const char* text, float fill) {
  EM_ASM({ if (window['barLoading'] && window['barLoading']['stage']) window['barLoading']['stage'](UTF8ToString($0), $1); },
         text, fill);
}
void loadingFailed(const std::string& text, bool critical) {
  EM_ASM({ if (window['barLoading'] && window['barLoading']['fail']) window['barLoading']['fail'](UTF8ToString($0), $1); },
         text.c_str(), critical ? 1 : 0);
}
void loadingReady() {
  EM_ASM({ if (window['barLoading']) window['barLoading']['ready'](); });
}

void setBodyClass(const std::string& name, bool on) {
  bridge::op("[\"bodyClass\"," + jsonQuote(name) + "," + (on ? "1" : "0") + "]");
}

std::string buildLabel() {
  static std::string label;  // read once
  if (label.empty()) {
    char buffer[64] = {};
    EM_ASM({
      var b = document.getElementById('build');
      stringToUTF8(b ? b.textContent : "", $0, $1);
    }, buffer, sizeof(buffer));
    label = buffer;
  }
  return label;
}

}  // namespace engine::ui

namespace engine::settings {

int version() {
  if (bridge::frame().pulledMs > 0) return bridge::frame().settingsVersion;  // from the mailbox
  return EM_ASM_INT({ var s = window['loopedHost']['settings']; return s ? s['version']() : 0; });
}

double number(const char* key, double fallback) {
  return EM_ASM_DOUBLE({
    var s = window['loopedHost']['settings'];
    var v = s ? s['get'](UTF8ToString($0)) : undefined;
    return typeof v === 'number' ? v : (v === true ? 1 : v === false ? 0 : $1);
  }, key, fallback);
}

void remember(const char* key, double value) {
  EM_ASM({
    try { window['localStorage']['setItem']((window['loopedHost']['storagePrefix'] || 'looped.') + UTF8ToString($0), String($1)); } catch (e) {}
  }, key, value);
}

double remembered(const char* key, double fallback) {
  return EM_ASM_DOUBLE({
    try {
      var v = window['localStorage']['getItem']((window['loopedHost']['storagePrefix'] || 'looped.') + UTF8ToString($0));
      if (v !== null && isFinite(+v)) return +v;
    } catch (e) {}
    return $1;
  }, key, fallback);
}

}  // namespace engine::settings
