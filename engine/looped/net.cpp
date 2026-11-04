#include "looped/net.h"

#include <emscripten/emscripten.h>

#include <cstdlib>

#include "looped/bridge.h"
#include "looped/json.h"

namespace engine::net {

// Quoted property names keep the Closure compiler from renaming them.

bool start() { return EM_ASM_INT({ return window['loopedHost']['net']['start']() ? 1 : 0; }); }

Status status() { return static_cast<Status>(EM_ASM_INT({ return window['loopedHost']['net']['status'](); })); }

std::string room() {
  char buffer[64];
  EM_ASM({ stringToUTF8(window['loopedHost']['net']['room'](), $0, $1); }, buffer, sizeof(buffer));
  return buffer;
}

void setState(double timeMs, const float* values, int count) {
  EM_ASM({
    var v = [];
    for (var i = 0; i < $2; i++) v.push(Math.round(HEAPF32[($1 >> 2) + i] * 1000) / 1000);
    window['loopedHost']['net']['setState']($0, v);
  }, timeMs, values, count);
}

void setAwayFlag(int slot, int bit) {
  EM_ASM({ var n = window['loopedHost']['net']; if (n && n['awayFlag']) n['awayFlag']($0, $1); }, slot, bit);
}

void receive(std::vector<Packet>& out) {
  constexpr int kStride = 3 + kMaxValues;
  constexpr int kCapacity = 64;
  static double buffer[kCapacity * kStride];
  const int n = EM_ASM_INT({ return window['loopedHost']['net']['take'](HEAPF64, $0 >> 3, $1, $2); },
                           buffer, kCapacity, kMaxValues);
  for (int i = 0; i < n; ++i) {
    const double* p = buffer + i * kStride;
    Packet packet;
    packet.player = static_cast<int>(p[0]);
    packet.time = p[1];
    packet.count = static_cast<int>(p[2]);
    for (int k = 0; k < packet.count; ++k) packet.values[k] = static_cast<float>(p[3 + k]);
    out.push_back(packet);
  }
}

// Who's here comes with the page mailbox (looped/bridge.h), not a call each.
bool present(int player) {
  // A player newer than the last roster joined this frame (their first
  // movement can arrive before the roster that lists them).
  return bridge::rosterFind(player) || player > bridge::rosterMaxIndex();
}

std::string playerName(int player) {
  const bridge::RosterEntry* e = bridge::rosterFind(player);
  return e ? e->name : std::string();
}

std::string playerAccount(int player) {
  const bridge::RosterEntry* e = bridge::rosterFind(player);
  return e ? e->account : std::string();
}

int playerAvatarRev(int player) {
  const bridge::RosterEntry* e = bridge::rosterFind(player);
  return e ? e->avatarRev : 0;
}

std::string avatarUrl(const std::string& account, int revision) {
  char buffer[512];
  EM_ASM({
    var a = window['loopedHost']['account'];
    stringToUTF8(a ? a['avatarUrl'](UTF8ToString($0), $1) : "", $2, $3);
  }, account.c_str(), revision, buffer, sizeof(buffer));
  return buffer;
}

void showCard(const std::string& account, const std::string& name) {
  EM_ASM({
    var a = window['loopedHost']['account'];
    if (a) a['showCard'](UTF8ToString($0), UTF8ToString($1));
  }, account.c_str(), name.c_str());
}

void setWorld(const std::string& key, const double* values, int count) {
  EM_ASM({
    var v = [];
    for (var i = 0; i < $2; i++) v.push(HEAPF64[($1 >> 3) + i]);
    window['loopedHost']['net']['setWorld'](UTF8ToString($0), v);
  }, key.c_str(), values, count);
}

void receiveWorld(std::vector<WorldEntry>& out) {
  char* text = static_cast<char*>(EM_ASM_PTR({ return stringToNewUTF8(window['loopedHost']['net']['takeWorld']()); }));
  const Json list = Json::parse(text);
  std::free(text);
  for (const Json& e : list.items()) {
    WorldEntry entry;
    entry.key = e[0].string();
    entry.fromLowerId = e[1].integer() != 0;
    for (const Json& v : e[2].items()) entry.values.push_back(v.number());
    out.push_back(std::move(entry));
  }
}

void sendEvent(const std::string& type, const double* values, int count) {
  EM_ASM({
    var v = [];
    for (var i = 0; i < $2; i++) v.push(Math.round(HEAPF64[($1 >> 3) + i] * 1000) / 1000);
    window['loopedHost']['net']['sendEvent'](UTF8ToString($0), v);
  }, type.c_str(), values, count);
}

void receiveEvents(std::vector<Event>& out) {
  char* text = static_cast<char*>(EM_ASM_PTR({ return stringToNewUTF8(window['loopedHost']['net']['takeEvents']()); }));
  const Json list = Json::parse(text);
  std::free(text);
  for (const Json& e : list.items()) {
    Event ev;
    ev.player = e[0].integer();
    ev.type = e[1].string();
    for (const Json& v : e[2].items()) ev.values.push_back(v.number());
    out.push_back(std::move(ev));
  }
}

bool isLower(int player) {
  const bridge::RosterEntry* e = bridge::rosterFind(player);
  return e && e->lowerId;
}

int claim(const std::string& key) {
  return EM_ASM_INT({ var n = window['loopedHost']['net']; return n && n['claim'] ? n['claim'](UTF8ToString($0)) : 0; }, key.c_str());
}

void release(const std::string& key) {
  EM_ASM({ var n = window['loopedHost']['net']; if (n && n['release']) n['release'](UTF8ToString($0)); }, key.c_str());
}

int claimOwner(const std::string& key) {
  return EM_ASM_INT({ var n = window['loopedHost']['net']; return n && n['claimOwner'] ? n['claimOwner'](UTF8ToString($0)) : -1; },
                    key.c_str());
}

int mySlot() {
  return EM_ASM_INT({ var n = window['loopedHost']['net']; return n && n['mySlot'] ? n['mySlot']() : -1; });
}

int slotOfPlayer(int player) {
  return EM_ASM_INT({ var n = window['loopedHost']['net']; return n && n['slotOf'] ? n['slotOf']($0) : -1; }, player);
}

int playerOfSlot(int slot) {
  return EM_ASM_INT({ var n = window['loopedHost']['net']; return n && n['slotIndex'] ? n['slotIndex']($0) : -1; }, slot);
}

int claimResult(int request) {
  if (request <= 0) return -1;
  return EM_ASM_INT({ var n = window['loopedHost']['net']; return n && n['result'] ? n['result']($0) : -1; }, request);
}

int setWorldIf(const std::string& key, const double* values, int count, const double* expect, int expectCount) {
  return EM_ASM_INT({
    var n = window['loopedHost']['net'];
    if (!n || !n['setWorldIf']) return 0;
    var v = [];
    var e = [];
    for (var i = 0; i < $2; i++) v.push(HEAPF64[($1 >> 3) + i]);
    for (var j = 0; j < $4; j++) e.push(HEAPF64[($3 >> 3) + j]);
    return n['setWorldIf'](UTF8ToString($0), v, e);
  }, key.c_str(), values, count, expect, expectCount);
}

int request(const std::string& kind, const std::string& argsJson) {
  return EM_ASM_INT({
    var n = window['loopedHost']['net'];
    return n && n['request'] ? n['request'](UTF8ToString($0), UTF8ToString($1)) : 0;
  }, kind.c_str(), argsJson.c_str());
}

bool takeAnswer(int request, std::string& outJson) {
  if (request <= 0) return false;
  char* text = static_cast<char*>(EM_ASM_PTR({
    var n = window['loopedHost']['net'];
    return stringToNewUTF8(n && n['answer'] ? n['answer']($0) : "");
  }, request));
  outJson = text;
  std::free(text);
  return !outJson.empty();
}

double serverTime() { return EM_ASM_DOUBLE({ return window['loopedHost']['net']['serverTime'](); }); }

}  // namespace engine::net
