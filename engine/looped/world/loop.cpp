#include "looped/world/loop.h"

#include <algorithm>
#include <cmath>

#include "looped/json.h"

namespace engine::world {

namespace {

constexpr double kTau = 6.283185307179586;
// The golden ratio's fraction: speeds spaced by it never line up, so a path
// doesn't visibly repeat.
constexpr double kGolden = 0.6180339887498949;

double frac(double x) { return x - std::floor(x); }

void note(std::string* error, std::string_view where, const std::string& what) {
  if (error) *error += std::string(where) + ": " + what + "\n";
}

std::vector<std::string>& customNames() {
  static std::vector<std::string> names;
  return names;
}

// Keyframes at u (0..1), wrapping from the last key back to the first.
Vec3 keysAt(const Piece& p, double u) {
  const size_t n = p.keyT.size();
  if (n == 0) return {};
  if (n == 1) return p.keyV[0];
  size_t i = 0;
  while (i + 1 < n && p.keyT[i + 1] <= u) ++i;
  double t0, t1;
  Vec3 a, b;
  if (u < p.keyT[0]) {  // before the first key: coming round from the last
    a = p.keyV[n - 1], b = p.keyV[0];
    t0 = p.keyT[n - 1] - 1, t1 = p.keyT[0];
  } else if (i + 1 < n) {
    a = p.keyV[i], b = p.keyV[i + 1];
    t0 = p.keyT[i], t1 = p.keyT[i + 1];
  } else {
    a = p.keyV[n - 1], b = p.keyV[0];
    t0 = p.keyT[n - 1], t1 = p.keyT[0] + 1;
  }
  double f = t1 > t0 ? (u - t0) / (t1 - t0) : 0;
  if (p.ease == Ease::kStep) f = 0;
  else if (p.ease == Ease::kSmooth) f = f * f * (3 - 2 * f);
  return lerp(a, b, static_cast<float>(f));
}

}  // namespace

uint32_t hash32(std::string_view text) {
  uint32_t h = 2166136261u;
  for (unsigned char c : text) {
    h ^= c;
    h *= 16777619u;
  }
  return h;
}

double hash01(uint32_t a, uint32_t b) {
  uint32_t h = a * 0x9E3779B1u ^ (b + 0x7F4A7C15u) * 0x85EBCA77u;
  h ^= h >> 15;
  h *= 0x2C1B3C6Du;
  h ^= h >> 12;
  h *= 0x297A2D39u;
  h ^= h >> 15;
  return (h & 0xFFFFFF) / 16777216.0;
}

double noise1(double t, uint32_t seed) {
  const double i = std::floor(t);
  const double f = t - i;
  const double u = f * f * (3 - 2 * f);
  const auto k = static_cast<uint32_t>(static_cast<int64_t>(i) & 0xFFFFFFFF);
  return hash01(seed, k) * (1 - u) + hash01(seed, k + 1) * u;
}

Vec3 readVec3(const Json& j, Vec3 fallback) {
  if (j.isNumber()) {
    const auto v = static_cast<float>(j.number());
    return {v, v, v};
  }
  if (!j.isArray() || j.size() < 3) return fallback;
  return {static_cast<float>(j[0].number()), static_cast<float>(j[1].number()),
          static_cast<float>(j[2].number())};
}

Quat eulerDegrees(Vec3 d) {
  return Quat::axisAngle({0, 1, 0}, radians(d.y)) * Quat::axisAngle({1, 0, 0}, radians(d.x)) *
         Quat::axisAngle({0, 0, 1}, radians(d.z));
}

Motion mix(const Motion& a, const Motion& b, float t) {
  Motion m;
  for (int i = 0; i < kChannels; ++i) m.ch[i] = a.ch[i] + (b.ch[i] - a.ch[i]) * t;
  return m;
}

int customChannel(std::string_view name) {
  auto& names = customNames();
  for (size_t i = 0; i < names.size(); ++i)
    if (names[i] == name) return kCustom0 + static_cast<int>(i);
  if (names.size() >= static_cast<size_t>(kChannels - kCustom0)) return -1;
  names.emplace_back(name);
  return kCustom0 + static_cast<int>(names.size() - 1);
}

bool parseChannel(std::string_view s, int* channel, int* width) {
  struct Named {
    const char* name;
    int channel, width;
  };
  static const Named kNames[] = {
      {"move", kMoveX, 3},   {"move.x", kMoveX, 1}, {"move.y", kMoveY, 1},   {"move.z", kMoveZ, 1},
      {"turn", kTurnX, 3},   {"turn.x", kTurnX, 1}, {"turn.y", kTurnY, 1},   {"turn.z", kTurnZ, 1},
      {"scale.xyz", kScaleX, 3}, {"scale.x", kScaleX, 1}, {"scale.y", kScaleY, 1},
      {"scale.z", kScaleZ, 1}, {"glow", kGlow, 1},  {"light", kLight, 1},   {"alpha", kAlpha, 1},
      {"tint", kTintR, 3},   {"tint.r", kTintR, 1}, {"tint.g", kTintG, 1},   {"tint.b", kTintB, 1},
  };
  if (s == "scale") {  // uniform: one value into x, y and z
    *channel = kScaleX, *width = -3;
    return true;
  }
  for (const Named& n : kNames)
    if (s == n.name) {
      *channel = n.channel, *width = n.width;
      return true;
    }
  if (s.empty() || s.find('.') != std::string_view::npos) return false;
  const int c = customChannel(s);
  if (c < 0) return false;
  *channel = c, *width = 1;
  return true;
}

void Piece::add(double cycles, uint32_t seed, float weight, Motion& out) const {
  const double t = cycles * every + phase;  // repeats done
  const double u = frac(t);                 // where in this repeat
  const uint32_t s = seed * 2654435761u + salt * 40503u + 1;
  Vec3 v;
  switch (shape) {
    case Shape::kHold:
      v = amp;
      break;
    case Shape::kWave: {
      const auto w = static_cast<float>(std::sin(u * kTau));
      v = amp * w;
      break;
    }
    case Shape::kKeys:
      v = mulComponents(keysAt(*this, u), amp);
      break;
    case Shape::kSteps:
      if (!keyV.empty()) {
        const auto i = std::min(keyV.size() - 1, static_cast<size_t>(u * keyV.size()));
        v = mulComponents(keyV[i], amp);
      }
      break;
    case Shape::kNoise:
      v = {amp.x * static_cast<float>(noise1(t * rate, s) * 2 - 1),
           amp.y * static_cast<float>(noise1(t * rate, s + 1) * 2 - 1),
           amp.z * static_cast<float>(noise1(t * rate, s + 2) * 2 - 1)};
      break;
    case Shape::kFlicker: {
      // Fast noise for the buzz, slow noise for when a dip happens (from
      // the first loops). 0 most of the time, down to -amp.
      const double slow = noise1(t * rate * 0.7, s);
      const double fast = noise1(t * rate * 23.0, s + 1);
      double d = -0.15 * fast;
      if (slow > 0.82) d -= (slow - 0.82) / 0.18 * (0.5 + 0.5 * fast);
      v = amp * static_cast<float>(d);
      break;
    }
    case Shape::kOrbit: {
      // Around, in and out, up and down at unrelated speeds, plus a little
      // wing jitter: amp.x is the radius, amp.y the height.
      const double ph1 = hash01(s, 1) * kTau, ph2 = hash01(s, 2) * kTau, ph3 = hash01(s, 3) * kTau;
      const double f = 1.0 + 0.3 * hash01(s, 4);
      const double a = t * kTau * f + ph1;
      const double wob = 0.65 + 0.35 * std::sin(t * kTau * f * (1 + kGolden) + ph2);
      const double up = std::sin(t * kTau * f * (2 - kGolden) * 1.7 + ph3);
      const double jx = noise1(t * 9.0, s + 5) - 0.5, jz = noise1(t * 9.0, s + 6) - 0.5;
      v = {static_cast<float>(amp.x * wob * std::cos(a) + 0.04 * jx), static_cast<float>(amp.y * up),
           static_cast<float>(amp.x * wob * std::sin(a) + 0.04 * jz)};
      break;
    }
    case Shape::kBeat:
      v = amp * static_cast<float>(std::exp(-u * decay));
      break;
    case Shape::kSpin:
      v = amp * static_cast<float>(360.0 * u);
      break;
  }
  v = v + offset;
  if (width == -3) {  // uniform scale
    for (int i = 0; i < 3; ++i) out.ch[channel + i] += v.x * weight;
  } else if (width == 3) {
    out.ch[channel] += v.x * weight;
    out.ch[channel + 1] += v.y * weight;
    out.ch[channel + 2] += v.z * weight;
  } else {
    out.ch[channel] += v.x * weight;
  }
}

double Loop::cycles(const Clock& clock, double start, uint32_t seed) const {
  const double p = std::max(0.01, static_cast<double>(period));
  if (beat && clock.music && !restart) return clock.beats / p;  // in step with the song
  const double secs = std::max(0.01, seconds());
  if (restart) return std::max(0.0, clock.seconds - start) / secs;
  const double shift = desync && !beat ? hash01(seed, 0xD5) : 0;
  return clock.seconds / secs + shift;
}

void Loop::add(double cycles, uint32_t seed, float weight, Motion& out) const {
  for (const Piece& p : pieces) p.add(cycles, seed, weight, out);
}

Loop parseLoop(const Json& j, std::string_view name, std::string* error) {
  Loop l;
  l.name = std::string(name);
  l.period = static_cast<float>(j["period"].number(l.period));
  if (!(l.period > 0)) {
    note(error, name, "period must be above 0");
    l.period = 4;
  }
  l.beat = j["beat"].boolean(false);
  l.restart = j["restart"].boolean(false);
  l.desync = j["desync"].boolean(true);
  l.blend = static_cast<float>(std::max(0.0, j["blend"].number(l.blend)));
  uint32_t salt = 0;
  for (const Json& pj : j["pieces"].items()) {
    Piece p;
    p.salt = ++salt;
    const std::string where = std::string(name) + " piece " + std::to_string(salt);
    if (!parseChannel(pj["ch"].string(), &p.channel, &p.width)) {
      note(error, where, "unknown channel \"" + pj["ch"].string() + "\"");
      continue;
    }
    static const std::pair<const char*, Shape> kShapes[] = {
        {"hold", Shape::kHold},   {"wave", Shape::kWave},       {"keys", Shape::kKeys},
        {"steps", Shape::kSteps}, {"noise", Shape::kNoise},     {"flicker", Shape::kFlicker},
        {"orbit", Shape::kOrbit}, {"beat", Shape::kBeat},       {"spin", Shape::kSpin}};
    const std::string& shape = pj["shape"].string();
    bool known = false;
    for (const auto& [n, s] : kShapes)
      if (shape == n) p.shape = s, known = true;
    if (!known) {
      note(error, where, "unknown shape \"" + shape + "\"");
      continue;
    }
    if (p.shape == Shape::kOrbit && p.width != 3) {
      note(error, where, "orbit needs a 3-wide channel (\"move\")");
      continue;
    }
    p.amp = readVec3(pj.has("value") ? pj["value"] : pj["amp"], p.amp);
    p.offset = readVec3(pj["offset"], {});
    p.every = std::max(1, pj["every"].integer(1));
    p.phase = static_cast<float>(pj["phase"].number(0));
    p.rate = static_cast<float>(pj["rate"].number(1));
    p.decay = static_cast<float>(pj["decay"].number(7));
    const std::string& ease = pj["ease"].string();
    if (ease == "linear") p.ease = Ease::kLinear;
    else if (ease == "step") p.ease = Ease::kStep;
    if (p.shape == Shape::kKeys) {
      for (const Json& k : pj["keys"].items()) {
        if (!k.isArray() || k.size() < 2) continue;
        p.keyT.push_back(static_cast<float>(frac(k[0].number())));
        p.keyV.push_back(readVec3(k[1], {}));
      }
      if (p.keyT.empty()) {
        note(error, where, "keys needs [[t, value], ...]");
        continue;
      }
      // Sorted by time (pairs kept together).
      std::vector<size_t> idx(p.keyT.size());
      for (size_t i = 0; i < idx.size(); ++i) idx[i] = i;
      std::sort(idx.begin(), idx.end(), [&](size_t a, size_t b) { return p.keyT[a] < p.keyT[b]; });
      std::vector<float> t2;
      std::vector<Vec3> v2;
      for (size_t i : idx) t2.push_back(p.keyT[i]), v2.push_back(p.keyV[i]);
      p.keyT = std::move(t2), p.keyV = std::move(v2);
      if (!pj.has("amp")) p.amp = {1, 1, 1};
    }
    if (p.shape == Shape::kSteps) {
      for (const Json& v : pj["values"].items()) p.keyV.push_back(readVec3(v, {}));
      if (p.keyV.empty()) {
        note(error, where, "steps needs \"values\": [...]");
        continue;
      }
      if (!pj.has("amp")) p.amp = {1, 1, 1};
    }
    l.pieces.push_back(std::move(p));
  }
  return l;
}

}  // namespace engine::world
