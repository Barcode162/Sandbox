#include "looped/netproto.h"

#include <algorithm>
#include <cmath>
#include <cstring>
#include <functional>
#include <map>

namespace engine::netproto {
namespace {

constexpr double kTau = 6.283185307179586;
constexpr double kHalfPi = 1.5707963267948966;
constexpr double kSqrt1_2 = 0.70710678;  // the spec's constant, not the exact value

// All rounding goes through here, in double, like cloud/proto.js:
// floor(v * scale + 0.5). (lround would round negative halves the other way.)
double quant(double v, double scale) { return std::floor(v * scale + 0.5); }
double clampd(double v, double lo, double hi) { return v < lo ? lo : v > hi ? hi : v; }
bool finite(double v) { return std::isfinite(v); }

bool fail(std::string* why, const char* what) {
  if (why) *why = what;
  return false;
}

struct Out {
  std::vector<uint8_t>& b;
  void u8(uint32_t v) { b.push_back(static_cast<uint8_t>(v & 0xff)); }
  void u16(uint32_t v) { u8(v); u8(v >> 8); }
  void i16(double v) { u16(static_cast<uint32_t>(static_cast<int32_t>(clampd(v, -32768, 32767))) & 0xffff); }
  void u32(uint32_t v) { u16(v & 0xffff); u16(v >> 16); }
  void f64(double v) {
    uint64_t bits;
    std::memcpy(&bits, &v, 8);
    for (int i = 0; i < 8; ++i) u8(static_cast<uint32_t>(bits >> (8 * i)));
  }
};

struct In {
  const uint8_t* d;
  size_t n, p = 0;
  bool bad = false;
  bool need(size_t k) {
    if (bad || p + k > n) {
      bad = true;
      return false;
    }
    return true;
  }
  uint32_t u8() { return need(1) ? d[p++] : 0; }
  uint32_t u16() {
    if (!need(2)) return 0;
    const uint32_t v = d[p] | (d[p + 1] << 8);
    p += 2;
    return v;
  }
  int32_t i16() { return static_cast<int16_t>(static_cast<uint16_t>(u16())); }
  uint32_t u32() {
    const uint32_t lo = u16();
    return lo | (u16() << 16);
  }
  double f64() {
    if (!need(8)) return 0;
    uint64_t bits = 0;
    for (int i = 0; i < 8; ++i) bits |= static_cast<uint64_t>(d[p + i]) << (8 * i);
    p += 8;
    double v;
    std::memcpy(&v, &bits, 8);
    return v;
  }
};

// TLV entries {kind, n, n bytes} must exactly fill the bytes.
bool validTlv(const uint8_t* b, size_t n) {
  size_t p = 0;
  while (p < n) {
    if (p + 2 > n) return false;
    p += 2 + b[p + 1];
  }
  return p == n;
}

bool writeAvatar(Out& o, const Avatar& a) {
  const double x = a.x, y = a.y, z = a.z, yawIn = a.yaw, pitch = a.pitch;
  if (!finite(x) || !finite(y) || !finite(z) || !finite(yawIn) || !finite(pitch) || a.flags > 15) return false;
  o.i16(quant(x, 100));
  o.i16(quant(y, 100));
  o.i16(quant(z, 100));
  double yaw = std::fmod(yawIn, kTau);
  if (yaw < 0) yaw += kTau;
  o.u16(static_cast<uint32_t>(quant(yaw / kTau, 65536)) & 0xffff);
  o.i16(quant(clampd(pitch, -kHalfPi, kHalfPi), 10000));
  o.u8(a.anim);
  o.u16(a.animTick);
  o.u8(a.held);
  o.u8(a.look);
  o.u8(a.flags);
  return true;
}

Avatar readAvatar(In& r) {
  Avatar a;
  a.x = static_cast<float>(r.i16() / 100.0);
  a.y = static_cast<float>(r.i16() / 100.0);
  a.z = static_cast<float>(r.i16() / 100.0);
  a.yaw = static_cast<float>(r.u16() * kTau / 65536.0);
  const double pitch = r.i16() / 10000.0;
  a.pitch = static_cast<float>(pitch);
  a.anim = static_cast<uint8_t>(r.u8());
  a.animTick = static_cast<uint16_t>(r.u16());
  a.held = static_cast<uint8_t>(r.u8());
  a.look = static_cast<uint8_t>(r.u8());
  a.flags = static_cast<uint8_t>(r.u8());
  if (a.flags > 15 || std::fabs(pitch) > kHalfPi + 1e-4) r.bad = true;
  return a;
}

bool writeActivity(Out& o, const std::vector<uint8_t>& act) {
  if (act.size() > kMaxActivity || !validTlv(act.data(), act.size())) return false;
  o.u8(static_cast<uint32_t>(act.size()));
  o.b.insert(o.b.end(), act.begin(), act.end());
  return true;
}

std::vector<uint8_t> readActivity(In& r) {
  const uint32_t n = r.u8();
  if (n > kMaxActivity || !r.need(n)) {
    r.bad = true;
    return {};
  }
  std::vector<uint8_t> act(r.d + r.p, r.d + r.p + n);
  r.p += n;
  if (!validTlv(act.data(), act.size())) r.bad = true;
  return act;
}

bool writeProp(Out& o, const PropSample& s) {
  double q[4], len2 = 0;
  for (int i = 0; i < 3; ++i) {
    if (!finite(s.pos[i]) || !finite(s.vel[i])) return false;
  }
  for (int i = 0; i < 4; ++i) {
    q[i] = s.quat[i];
    if (!finite(q[i])) return false;
    len2 += q[i] * q[i];
  }
  const double len = std::sqrt(len2);
  if (!(len > 1e-6)) return false;
  o.u16(s.id);
  for (float p : s.pos) o.i16(quant(p, 1000));
  for (double& c : q) c /= len;
  int big = 0;
  for (int i = 1; i < 4; ++i) {
    if (std::fabs(q[i]) > std::fabs(q[big])) big = i;
  }
  const double sign = q[big] < 0 ? -1 : 1;
  uint32_t packed = static_cast<uint32_t>(big);
  for (int i = 0; i < 4; ++i) {
    if (i == big) continue;
    const double c = clampd(q[i] * sign, -kSqrt1_2, kSqrt1_2);
    packed = packed * 1024 + static_cast<uint32_t>(clampd(quant(c / kSqrt1_2 * 0.5 + 0.5, 1023), 0, 1023));
  }
  o.u32(packed);
  for (float v : s.vel) o.i16(quant(v, 100));
  return true;
}

PropSample readProp(In& r) {
  PropSample s;
  s.id = static_cast<uint16_t>(r.u16());
  for (float& p : s.pos) p = static_cast<float>(r.i16() / 1000.0);
  const uint32_t packed = r.u32();
  const int big = static_cast<int>(packed >> 30);
  const uint32_t u[3] = {(packed >> 20) & 1023, (packed >> 10) & 1023, packed & 1023};
  double small[3], sum = 0;
  for (int i = 0; i < 3; ++i) {
    small[i] = (u[i] / 1023.0 - 0.5) * 2 * kSqrt1_2;
    sum += small[i] * small[i];
  }
  if (sum > 1) r.bad = true;
  for (int i = 0, k = 0; i < 4; ++i) {
    s.quat[i] = static_cast<float>(i == big ? std::sqrt(std::max(0.0, 1 - sum)) : small[k++]);
  }
  for (float& v : s.vel) v = static_cast<float>(r.i16() / 100.0);
  return s;
}

}  // namespace

bool encode(const StateMsg& m, std::vector<uint8_t>& out) {
  out.clear();
  Out o{out};
  o.u8(kBinState);
  o.u16(m.seq);
  return writeAvatar(o, m.avatar) && writeActivity(o, m.activity);
}

bool encode(const PropMsg& m, std::vector<uint8_t>& out) {
  out.clear();
  if (m.props.empty() || m.props.size() > kMaxPropsIn) return false;
  Out o{out};
  o.u8(kBinProp);
  o.u8(static_cast<uint32_t>(m.props.size()));
  for (const PropSample& s : m.props) {
    if (!writeProp(o, s)) return false;
  }
  return true;
}

bool encode(const TickMsg& m, std::vector<uint8_t>& out) {
  out.clear();
  if (!finite(m.serverMs) || m.players.size() > kMaxSlots || m.props.size() > kMaxPropsTick) return false;
  Out o{out};
  o.u8(kBinTick);
  o.u32(m.tick);
  o.f64(m.serverMs);
  o.u8(static_cast<uint32_t>(m.players.size()));
  uint32_t seen = 0;
  for (const TickPlayer& p : m.players) {
    if (p.slot >= kMaxSlots || (seen & (1u << p.slot))) return false;
    seen |= 1u << p.slot;
    o.u8(p.slot);
    if (!writeAvatar(o, p.avatar) || !writeActivity(o, p.activity)) return false;
  }
  o.u8(static_cast<uint32_t>(m.props.size()));
  for (const PropSample& s : m.props) {
    if (!writeProp(o, s)) return false;
  }
  return true;
}

bool decodeBinary(const uint8_t* data, size_t size, BinaryMsg& out, std::string* why) {
  if (!data || size == 0) return fail(why, "empty");
  if (size > 65536) return fail(why, "too big");
  In r{data, size};
  out.type = static_cast<uint8_t>(r.u8());
  if (out.type == kBinState) {
    out.state.seq = static_cast<uint16_t>(r.u16());
    out.state.avatar = readAvatar(r);
    out.state.activity = readActivity(r);
  } else if (out.type == kBinProp) {
    const uint32_t n = r.u8();
    if (n < 1 || n > kMaxPropsIn) return fail(why, "bad prop count");
    out.prop.props.clear();
    for (uint32_t i = 0; i < n && !r.bad; ++i) out.prop.props.push_back(readProp(r));
  } else if (out.type == kBinTick) {
    TickMsg& t = out.tick;
    t.tick = r.u32();
    t.serverMs = r.f64();
    if (!r.bad && !finite(t.serverMs)) return fail(why, "serverMs not finite");
    const uint32_t n = r.u8();
    if (n > kMaxSlots) return fail(why, "bad player count");
    t.players.clear();
    uint32_t seen = 0;
    for (uint32_t i = 0; i < n && !r.bad; ++i) {
      TickPlayer p;
      p.slot = static_cast<uint8_t>(r.u8());
      if (r.bad) break;
      if (p.slot >= kMaxSlots || (seen & (1u << p.slot))) return fail(why, "bad slot");
      seen |= 1u << p.slot;
      p.avatar = readAvatar(r);
      p.activity = readActivity(r);
      t.players.push_back(std::move(p));
    }
    const uint32_t m = r.u8();
    if (m > kMaxPropsTick) return fail(why, "bad prop count");
    t.props.clear();
    for (uint32_t i = 0; i < m && !r.bad; ++i) t.props.push_back(readProp(r));
  } else {
    return fail(why, "unknown type");
  }
  if (r.bad) return fail(why, "malformed");
  if (r.p != size) return fail(why, "trailing bytes");
  return true;
}

// ---- Text: field checks mirroring cloud/proto.js ----
namespace {

using Check = std::function<bool(const Json&)>;
constexpr double kMaxInt = 2147483647.0;
constexpr double kMaxSafe = 9007199254740991.0;

bool isInt(const Json& v, double lo, double hi) {
  if (!v.isNumber()) return false;
  const double d = v.number();
  return d == std::floor(d) && d >= lo && d <= hi;
}
Check Int(double lo, double hi) { return [=](const Json& v) { return isInt(v, lo, hi); }; }
Check Num() { return [](const Json& v) { return v.isNumber(); }; }  // the parser rejects non-finite
// Character rules for keys and tokens (no std::regex: it's big in wasm).
using KeyRule = bool (*)(std::string_view);
bool allOf(std::string_view s, const char* extra, bool lowerHexOnly) {
  for (char c : s) {
    const bool hex = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f');
    if (lowerHexOnly) {
      if (!hex) return false;
      continue;
    }
    const bool alnum = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
    if (!alnum && !std::strchr(extra, c)) return false;
  }
  return true;
}
bool hex32(std::string_view s) { return s.size() == 32 && allOf(s, "", true); }
bool kvKey(std::string_view s) { return s.size() >= 1 && s.size() <= 16 && allOf(s, "_", false); }
bool claimKey(std::string_view s) { return s.size() >= 1 && s.size() <= 48 && allOf(s, "_.-", false); }

Check Str(size_t lo, size_t hi, KeyRule rule = nullptr) {
  return [=](const Json& v) {
    if (!v.isString()) return false;
    const size_t n = v.string().size();  // UTF-8 bytes
    return n >= lo && n <= hi && (!rule || rule(v.string()));
  };
}
Check Bit() { return Int(0, 1); }
Check Slot() { return Int(0, kMaxSlots - 1); }
Check SlotOrServer() { return Int(-1, kMaxSlots - 1); }
Check Any() { return [](const Json&) { return true; }; }
Check Nums(size_t max) {
  return [=](const Json& v) {
    if (!v.isArray() || v.size() > max) return false;
    for (const Json& x : v.items()) {
      if (!x.isNumber()) return false;
    }
    return true;
  };
}
Check List(size_t max, Check item) {
  return [=](const Json& v) {
    if (!v.isArray() || v.size() > max) return false;
    for (const Json& x : v.items()) {
      if (!item(x)) return false;
    }
    return true;
  };
}
Check Tuple(std::vector<Check> items) {
  return [=](const Json& v) {
    if (!v.isArray() || v.size() != items.size()) return false;
    for (size_t i = 0; i < items.size(); ++i) {
      if (!items[i](v[i])) return false;
    }
    return true;
  };
}
Check Map(size_t max, KeyRule keyRule, Check item) {
  return [=](const Json& v) {
    if (!v.isObject() || v.members().size() > max) return false;
    for (const auto& m : v.members()) {
      if (!keyRule(m.first) || !item(m.second)) return false;
    }
    return true;
  };
}
Check AnyObject() { return [](const Json& v) { return v.isObject(); }; }

struct Field {
  const char* key;
  Check check;
  bool required;
};
using Spec = std::vector<Field>;

bool checkObject(const Json& v, const Spec& spec) {
  if (!v.isObject()) return false;
  for (const Field& f : spec) {
    if (!v.has(f.key)) {
      if (f.required) return false;
      continue;
    }
    if (!f.check(v[f.key])) return false;
  }
  return true;
}
Check Object(Spec spec) { return [=](const Json& v) { return checkObject(v, spec); }; }

constexpr bool R = true, O = false;
const KeyRule kHex32 = hex32, kKvKey = kvKey, kClaimKey = claimKey;

const std::map<char, Spec>& specs(Dir dir) {
  static const Spec player = {{"slot", Slot(), R}, {"name", Str(1, 24), R}, {"look", Int(0, 255), R},
                              {"acct", Str(0, 32), O}, {"av", Int(0, kMaxInt), O}, {"away", Bit(), O}};
  static const Check kvEntry = Tuple({Int(0, kMaxSafe), Str(1, 16, kKvKey), SlotOrServer(), Nums(20)});
  static const std::map<char, Spec> toServer = {
      {'H', {{"proto", Int(1, 255), R}, {"build", Str(0, 16), R}, {"name", Str(1, 24), R}, {"look", Int(0, 255), R},
             {"resume", Str(32, 32, kHex32), O}, {"ticket", Str(0, 2048), O}}},
      {'I', {{"i", Int(0, kMaxInt), R}, {"k", Str(1, 32), R}}},
      {'E', {{"e", List(32, Tuple({Str(1, 16), Nums(16)})), R}}},
      {'K', {{"w", Map(32, kKvKey, Nums(20)), R}}},
      {'G', {{"to", Slot(), R}, {"data", Any(), R}}},
      {'P', {{"c", Num(), R}}},
      {'R', {{"ticket", Str(1, 2048), R}}},
      {'A', {{"on", Bit(), R}}},
  };
  static const std::map<char, Spec> toClient = {
      {'W', {{"proto", Int(1, 255), R}, {"slot", Slot(), R}, {"resume", Str(32, 32, kHex32), R}, {"serverMs", Num(), R},
             {"tick", Int(0, 4294967295.0), R}, {"tickHz", Int(1, 60), R}, {"room", Str(1, 32), R},
             {"roster", List(kMaxSlots, Object(player)), R}, {"claims", Map(256, kClaimKey, Slot()), R},
             {"sessions", AnyObject(), R}, {"kv", List(256, kvEntry), O}}},
      {'D', {{"d", List(64, Tuple({Int(0, kMaxSafe), Str(1, 48), Any(), SlotOrServer()})), R}}},
      {'R', {{"r", Int(0, kMaxInt), R}, {"ok", Bit(), R}, {"seq", Int(0, kMaxSafe), O}, {"why", Str(0, 64), O},
             {"by", Slot(), O}}},
      {'E', {{"e", List(64, Tuple({Int(0, 4294967295.0), Slot(), Int(0, kMaxSafe), Str(1, 16), Nums(16)})), R}}},
      {'K', {{"w", List(64, kvEntry), R}}},
      {'J', player},
      {'L', {{"slot", Slot(), R}, {"why", Str(0, 64), O}}},
      {'F', {{"slot", Slot(), R}, {"name", Str(1, 24), R}, {"acct", Str(0, 32), O}, {"av", Int(0, kMaxInt), O},
             {"badges", List(16, Str(1, 16)), O}, {"role", Str(0, 16), O}}},
      {'G', {{"from", Slot(), R}, {"data", Any(), R}}},
      {'P', {{"c", Num(), R}, {"s", Num(), R}}},
  };
  return dir == Dir::kToServer ? toServer : toClient;
}

}  // namespace

bool decodeText(std::string_view frame, Dir dir, TextMsg& out, std::string* why) {
  if (frame.size() < 3) return fail(why, "too short");
  const auto& table = specs(dir);
  const auto it = table.find(frame[0]);
  if (it == table.end()) return fail(why, "unknown type");
  const size_t max = dir == Dir::kToServer ? (frame[0] == 'G' ? 16384 : 4096) : 65536;
  if (frame.size() > max) return fail(why, "too big");
  std::string err;
  JsonLimits limits;
  limits.maxString = 16384;  // a voice handshake (SDP) can be several KB
  out.body = Json::parse(frame.substr(1), &err, limits);
  if (!err.empty()) return fail(why, "bad json");
  if (!out.body.isObject()) return fail(why, "not an object");
  if (!checkObject(out.body, it->second)) return fail(why, "bad field");
  out.letter = frame[0];
  return true;
}

bool encodeText(char letter, std::string_view bodyJson, Dir dir, std::string& out) {
  out.clear();
  out += letter;
  out += bodyJson;
  TextMsg check;
  if (decodeText(out, dir, check)) return true;
  out.clear();
  return false;
}

std::string toHex(const uint8_t* data, size_t size) {
  static const char* digits = "0123456789abcdef";
  std::string s;
  s.reserve(size * 2);
  for (size_t i = 0; i < size; ++i) {
    s += digits[data[i] >> 4];
    s += digits[data[i] & 15];
  }
  return s;
}

bool fromHex(std::string_view hex, std::vector<uint8_t>& out) {
  out.clear();
  if (hex.size() % 2) return false;
  auto nib = [](char c) -> int {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
  };
  for (size_t i = 0; i < hex.size(); i += 2) {
    const int hi = nib(hex[i]), lo = nib(hex[i + 1]);
    if (hi < 0 || lo < 0) return false;
    out.push_back(static_cast<uint8_t>(hi * 16 + lo));
  }
  return true;
}

}  // namespace engine::netproto
