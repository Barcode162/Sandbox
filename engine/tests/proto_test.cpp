// Room protocol codec test (looped/netproto.*): the same golden vectors as
// tools/proto_test.mjs (cloud/proto.js), so the game and the server agree
// byte for byte. Bad frames must be rejected; random garbage must not crash.
#include <cmath>
#include <cstdio>
#include <fstream>
#include <random>
#include <sstream>
#include <string>

#include "looped/json.h"
#include "looped/netproto.h"

using engine::Json;
namespace np = engine::netproto;

static int g_failed = 0;
static void check(bool ok, const std::string& what) {
  if (!ok) {
    std::printf("FAIL %s\n", what.c_str());
    ++g_failed;
  }
}

constexpr double kTau = 6.283185307179586;
static bool near(double a, double b, double tol) { return std::fabs(a - b) <= tol; }
static double clampd(double v, double lo, double hi) { return v < lo ? lo : v > hi ? hi : v; }
static double sat(double v, double scale) { return clampd(v, -32768 / scale, 32767 / scale); }
static bool angleNear(double a, double b, double tol) {
  double d = std::fmod(a - b, kTau);
  if (d > kTau / 2) d -= kTau;
  if (d < -kTau / 2) d += kTau;
  return std::fabs(d) <= tol;
}

static np::Avatar avatarFrom(const Json& j) {
  np::Avatar a;
  a.x = static_cast<float>(j["x"].number());
  a.y = static_cast<float>(j["y"].number());
  a.z = static_cast<float>(j["z"].number());
  a.yaw = static_cast<float>(j["yaw"].number());
  a.pitch = static_cast<float>(j["pitch"].number());
  a.anim = static_cast<uint8_t>(j["anim"].integer());
  a.animTick = static_cast<uint16_t>(j["animTick"].integer());
  a.held = static_cast<uint8_t>(j["held"].integer());
  a.look = static_cast<uint8_t>(j["look"].integer());
  a.flags = static_cast<uint8_t>(j["flags"].integer());
  return a;
}

// Tolerances: half a quantization step (plus float slack).
static bool avatarNear(const np::Avatar& got, const Json& want) {
  return near(got.x, sat(want["x"].number(), 100), 0.0051) && near(got.y, sat(want["y"].number(), 100), 0.0051) &&
         near(got.z, sat(want["z"].number(), 100), 0.0051) && angleNear(got.yaw, want["yaw"].number(), 1e-4) &&
         near(got.pitch, clampd(want["pitch"].number(), -kTau / 4, kTau / 4), 6e-5) &&
         got.anim == want["anim"].integer() && got.animTick == want["animTick"].integer() &&
         got.held == want["held"].integer() && got.look == want["look"].integer() &&
         got.flags == want["flags"].integer();
}

static std::vector<uint8_t> act(const Json& j) {
  std::vector<uint8_t> out;
  np::fromHex(j.string(), out);
  return out;
}

static np::PropSample propFrom(const Json& j) {
  np::PropSample s;
  s.id = static_cast<uint16_t>(j["id"].integer());
  for (int i = 0; i < 3; ++i) s.pos[i] = static_cast<float>(j["pos"][i].number());
  for (int i = 0; i < 4; ++i) s.quat[i] = static_cast<float>(j["quat"][i].number());
  for (int i = 0; i < 3; ++i) s.vel[i] = static_cast<float>(j["vel"][i].number());
  return s;
}

static bool propNear(const np::PropSample& got, const Json& want) {
  double len = 0, dot = 0;
  for (int i = 0; i < 4; ++i) len += want["quat"][i].number() * want["quat"][i].number();
  len = std::sqrt(len);
  for (int i = 0; i < 4; ++i) dot += got.quat[i] * want["quat"][i].number() / len;
  bool ok = got.id == want["id"].integer() && std::fabs(dot) > 0.99999;
  for (int i = 0; i < 3; ++i) {
    ok = ok && near(got.pos[i], sat(want["pos"][i].number(), 1000), 0.00051) &&
         near(got.vel[i], sat(want["vel"][i].number(), 100), 0.0051);
  }
  return ok;
}

// Same value tree (numbers compared exactly, object keys in any order).
static bool same(const Json& a, const Json& b) {
  if (a.type() != b.type()) return false;
  switch (a.type()) {
    case Json::Type::kNull: return true;
    case Json::Type::kBool: return a.boolean() == b.boolean();
    case Json::Type::kNumber: return a.number() == b.number();
    case Json::Type::kString: return a.string() == b.string();
    case Json::Type::kArray:
      if (a.size() != b.size()) return false;
      for (size_t i = 0; i < a.size(); ++i) {
        if (!same(a[i], b[i])) return false;
      }
      return true;
    case Json::Type::kObject:
      if (a.members().size() != b.members().size()) return false;
      for (const auto& m : a.members()) {
        if (!b.has(m.first) || !same(m.second, b[m.first])) return false;
      }
      return true;
  }
  return false;
}

int main() {
  std::ifstream file("tests/proto_vectors.json");
  std::stringstream ss;
  ss << file.rdbuf();
  std::string err;
  engine::JsonLimits limits;
  limits.maxString = 65536;
  const Json v = Json::parse(ss.str(), &err, limits);
  if (!v.isObject()) {
    std::printf("FAIL could not read tests/proto_vectors.json (%s); run from engine/\n", err.c_str());
    return 1;
  }
  check(v["proto"].integer() == np::kProto, "vectors are for this protocol version");

  for (const Json& t : v["binary"].items()) {
    const std::string name = t["name"].string(), kind = t["kind"].string();
    const Json& f = t["fields"];
    std::vector<uint8_t> bytes;
    bool ok = false;
    if (kind == "state") {
      np::StateMsg m;
      m.seq = static_cast<uint16_t>(f["seq"].integer());
      m.avatar = avatarFrom(f["avatar"]);
      m.activity = act(f["act"]);
      ok = np::encode(m, bytes);
    } else if (kind == "prop") {
      np::PropMsg m;
      for (const Json& p : f["props"].items()) m.props.push_back(propFrom(p));
      ok = np::encode(m, bytes);
    } else if (kind == "tick") {
      np::TickMsg m;
      m.tick = static_cast<uint32_t>(f["tick"].number());
      m.serverMs = f["serverMs"].number();
      for (const Json& p : f["players"].items()) {
        np::TickPlayer tp;
        tp.slot = static_cast<uint8_t>(p["slot"].integer());
        tp.avatar = avatarFrom(p["avatar"]);
        tp.activity = act(p["act"]);
        m.players.push_back(tp);
      }
      for (const Json& p : f["props"].items()) m.props.push_back(propFrom(p));
      ok = np::encode(m, bytes);
    }
    const std::string hex = np::toHex(bytes.data(), bytes.size());
    check(ok && hex == t["hex"].string(), name + ": encode gave " + hex);

    std::vector<uint8_t> in;
    np::fromHex(t["hex"].string(), in);
    np::BinaryMsg d;
    std::string why;
    const bool dec = np::decodeBinary(in.data(), in.size(), d, &why);
    check(dec, name + ": decode (" + why + ")");
    if (!dec) continue;
    if (kind == "state") {
      check(d.type == np::kBinState && d.state.seq == f["seq"].integer() && avatarNear(d.state.avatar, f["avatar"]) &&
                np::toHex(d.state.activity.data(), d.state.activity.size()) == f["act"].string(),
            name + ": decoded fields");
    } else if (kind == "prop") {
      bool good = d.type == np::kBinProp && d.prop.props.size() == f["props"].size();
      for (size_t i = 0; good && i < d.prop.props.size(); ++i) good = propNear(d.prop.props[i], f["props"][i]);
      check(good, name + ": decoded fields");
    } else {
      const np::TickMsg& m = d.tick;
      bool good = d.type == np::kBinTick && m.tick == f["tick"].number() && m.serverMs == f["serverMs"].number() &&
                  m.players.size() == f["players"].size() && m.props.size() == f["props"].size();
      for (size_t i = 0; good && i < m.players.size(); ++i) {
        const Json& p = f["players"][i];
        good = m.players[i].slot == p["slot"].integer() && avatarNear(m.players[i].avatar, p["avatar"]) &&
               np::toHex(m.players[i].activity.data(), m.players[i].activity.size()) == p["act"].string();
      }
      for (size_t i = 0; good && i < m.props.size(); ++i) good = propNear(m.props[i], f["props"][i]);
      check(good, name + ": decoded fields");
    }
  }

  for (const Json& t : v["text"].items()) {
    const std::string name = t["name"].string();
    const np::Dir dir = t["dir"].string() == "toServer" ? np::Dir::kToServer : np::Dir::kToClient;
    np::TextMsg m;
    std::string why;
    const bool ok = np::decodeText(t["text"].string(), dir, m, &why);
    check(ok && m.letter == t["letter"].string()[0] && same(m.body, t["body"]), name + ": decode (" + why + ")");
    std::string frame;
    const bool enc = np::encodeText(t["letter"].string()[0], engine::jsonDump(t["body"]), dir, frame);
    check(enc && same(Json::parse(std::string_view(frame).substr(1)), t["body"]), name + ": encode");
  }

  for (const Json& t : v["bad"].items()) {
    const std::string name = t["name"].string();
    bool accepted;
    if (t["kind"].string() == "binary") {
      std::vector<uint8_t> in;
      np::fromHex(t["hex"].string(), in);
      np::BinaryMsg d;
      accepted = np::decodeBinary(in.data(), in.size(), d);
    } else {
      np::TextMsg m;
      accepted = np::decodeText(t["text"].string(),
                                t["dir"].string() == "toServer" ? np::Dir::kToServer : np::Dir::kToClient, m);
    }
    check(!accepted, name + ": should be rejected");
  }

  // Encoders refuse what they can't send.
  {
    std::vector<uint8_t> out;
    np::StateMsg s;
    s.avatar.x = NAN;
    check(!np::encode(s, out), "encode NaN position");
    np::PropMsg p;
    p.props.resize(1);
    p.props[0].quat[3] = 0;
    check(!np::encode(p, out), "encode zero quaternion");
    std::string frame;
    check(!np::encodeText('P', "{\"c\":null}", np::Dir::kToServer, frame), "encode ping without a number");
  }

  // Random garbage never crashes.
  std::mt19937 rng(12345);
  int decoded = 0;
  for (int i = 0; i < 20000; ++i) {
    std::vector<uint8_t> b(rng() % 80);
    for (uint8_t& x : b) x = static_cast<uint8_t>(rng());
    if (!b.empty() && rng() % 2) b[0] = (const uint8_t[]){1, 2, 0x81}[rng() % 3];
    np::BinaryMsg d;
    if (np::decodeBinary(b.data(), b.size(), d)) ++decoded;
    np::TextMsg m;
    np::decodeText(std::string(b.begin(), b.end()), np::Dir::kToClient, m);
  }

  const size_t total = v["binary"].size() + v["text"].size() + v["bad"].size();
  if (g_failed) {
    std::printf("PROTO TEST FAILED (%d)\n", g_failed);
    return 1;
  }
  std::printf("proto_test passed (%zu vectors, 20000 random frames, %d decoded)\n", total, decoded);
  return 0;
}
