#pragma once
// Bar3D room protocol v1 codec (the game's side). The spec is
// docs/handbook/protocol.md; the server's twin is cloud/proto.js. Both are checked
// on the same golden vectors (proto/vectors.json) by tools/proto_test.mjs
// and tools/native/proto_test.cpp.
//
// Binary messages (STATE, PROP, TICK) are fixed little-endian layouts.
// Text messages are one type letter + a JSON object, checked field by field.
// Decoders never crash on garbage: they return false and say why.
#include <cstddef>
#include <cstdint>
#include <string>
#include <string_view>
#include <vector>

#include "looped/json.h"

namespace engine::netproto {

inline constexpr int kProto = 1;
inline constexpr int kMaxSlots = 16;
inline constexpr uint8_t kBinState = 0x01;  // client → server
inline constexpr uint8_t kBinProp = 0x02;   // client → server (lease owner)
inline constexpr uint8_t kBinTick = 0x81;   // server → client
inline constexpr size_t kMaxActivity = 48;  // activity TLV bytes per player
inline constexpr size_t kMaxPropsIn = 8;
inline constexpr size_t kMaxPropsTick = 32;

// Avatar flags (PROTOCOL §3.1).
inline constexpr uint8_t kFlagTalking = 1, kFlagAway = 2, kFlagBartender = 4, kFlagMic = 8;

// One player's 16-byte avatar block. Angles in radians.
struct Avatar {
  float x = 0, y = 0, z = 0;  // eye position (m)
  float yaw = 0, pitch = 0;
  uint8_t anim = 0;
  uint16_t animTick = 0;  // server tick when `anim` started (low 16 bits)
  uint8_t held = 0, look = 0, flags = 0;
};

struct StateMsg {
  uint16_t seq = 0;
  Avatar avatar;
  std::vector<uint8_t> activity;  // TLV entries {kind, n, n bytes}
};

struct PropSample {
  uint16_t id = 0;
  float pos[3] = {};
  float quat[4] = {0, 0, 0, 1};  // x, y, z, w
  float vel[3] = {};
};

struct PropMsg {
  std::vector<PropSample> props;
};

struct TickPlayer {
  uint8_t slot = 0;
  Avatar avatar;
  std::vector<uint8_t> activity;
};

struct TickMsg {
  uint32_t tick = 0;
  double serverMs = 0;
  std::vector<TickPlayer> players;
  std::vector<PropSample> props;
};

// Encoders write the whole frame into `out`; false if a value is NaN or
// infinite, a count is out of range or the activity TLV is malformed.
bool encode(const StateMsg& m, std::vector<uint8_t>& out);
bool encode(const PropMsg& m, std::vector<uint8_t>& out);
bool encode(const TickMsg& m, std::vector<uint8_t>& out);

// Any binary frame; `type` says which of the messages was filled.
struct BinaryMsg {
  uint8_t type = 0;
  StateMsg state;
  PropMsg prop;
  TickMsg tick;
};
bool decodeBinary(const uint8_t* data, size_t size, BinaryMsg& out, std::string* why = nullptr);

// ---- Text ----
enum class Dir { kToServer, kToClient };

struct TextMsg {
  char letter = 0;  // 'W' welcome, 'P' pong... (PROTOCOL §4)
  Json body;
};
bool decodeText(std::string_view frame, Dir dir, TextMsg& out, std::string* why = nullptr);
// letter + body JSON → frame, only if the result is a valid message.
bool encodeText(char letter, std::string_view bodyJson, Dir dir, std::string& out);

// Hex helpers (tests, logs).
std::string toHex(const uint8_t* data, size_t size);
bool fromHex(std::string_view hex, std::vector<uint8_t>& out);

}  // namespace engine::netproto
