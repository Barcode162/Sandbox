#include "looped/world/kind.h"

#include <cmath>
#include <cstdio>

namespace engine::world {

namespace {

const Json& nullJson() {
  static const Json j;
  return j;
}

void note(std::string& errors, std::string_view where, const std::string& what) {
  errors += std::string(where) + ": " + what + "\n";
}

template <typename T>
void putByName(std::vector<std::pair<std::string, T>>& v, const std::string& name, const T& value) {
  for (auto& [n, x] : v)
    if (n == name) {
      x = value;
      return;
    }
  v.emplace_back(name, value);
}

void putLoop(std::vector<Loop>& v, const Loop& l) {
  for (Loop& x : v)
    if (x.name == l.name) {
      x = l;
      return;
    }
  v.push_back(l);
}

void putState(std::vector<State>& v, const State& s) {
  for (State& x : v)
    if (x.name == s.name) {
      x = s;
      return;
    }
  v.push_back(s);
}

std::vector<std::pair<std::string, std::string>> readRules(const Json& j) {
  std::vector<std::pair<std::string, std::string>> out;
  for (const auto& [event, to] : j.members()) out.emplace_back(event, to.string());
  return out;
}

Kind parseKind(const Json& j, std::string_view file, std::string& errors) {
  Kind k;
  k.id = j["id"].string();
  const std::string where = std::string(file) + " kind \"" + k.id + "\"";
  k.about = j["about"].string();
  k.is = j["is"].string();
  k.still = j["still"].string();
  k.start = j["start"].string();
  k.pivot = readVec3(j["pivot"], {});
  for (const auto& [name, part] : j["parts"].members()) putByName(k.parts, name, part);
  std::string err;
  for (const auto& [name, lj] : j["loops"].members()) {
    Loop l = parseLoop(lj, where + " loop " + name, &err);
    l.name = name;
    putLoop(k.loops, l);
  }
  for (const auto& [name, sj] : j["states"].members()) {
    State s;
    s.name = name;
    s.loop = sj["loop"].string();
    s.on = readRules(sj["on"]);
    s.after = static_cast<float>(sj["after"].number(-1));
    s.afterLoops = static_cast<float>(sj["afterLoops"].number(-1));
    s.next = sj["next"].string();
    s.free = sj["free"].boolean(false);
    for (const Json& e : sj["enter"].items()) {
      Send send;
      send.event = e["send"].string();
      if (e.has("to")) send.to = e["to"].string();
      if (send.event.empty()) note(err, where + " state " + name, "enter needs {\"send\": event}");
      else s.enter.push_back(send);
    }
    putState(k.states, s);
  }
  k.on = readRules(j["on"]);
  size_t n = 0;
  for (const Json& tj : j["things"].items())
    k.things.push_back(parseThing(tj, where + " thing " + std::to_string(++n), &err));
  errors += err;
  return k;
}

}  // namespace

const Json& Kind::part(std::string_view name) const {
  for (const auto& [n, j] : parts)
    if (n == name) return j;
  return nullJson();
}

const Loop* Kind::loop(std::string_view name) const {
  for (const Loop& l : loops)
    if (l.name == name) return &l;
  return nullptr;
}

int Kind::state(std::string_view name) const {
  for (size_t i = 0; i < states.size(); ++i)
    if (states[i].name == name) return static_cast<int>(i);
  return -1;
}

ThingSpec parseThing(const Json& j, std::string_view where, std::string* error) {
  ThingSpec t;
  t.id = j["id"].string();
  t.kind = j["kind"].string();
  t.parent = j["parent"].string();
  t.at = readVec3(j["at"], {});
  if (j.has("at") && !j["at"].isArray() && error) *error += std::string(where) + ": \"at\" must be [x, y, z]\n";
  const Json& turn = j["turn"];
  t.turn = turn.isNumber() ? Vec3{0, static_cast<float>(turn.number()), 0} : readVec3(turn, {});
  t.scale = readVec3(j["scale"], {1, 1, 1});
  t.state = j["state"].string();
  t.phase = static_cast<float>(j["phase"].number(0));
  t.seed = static_cast<uint32_t>(j["seed"].number(0));
  for (const auto& [name, part] : j["parts"].members()) putByName(t.parts, name, part);
  for (const auto& [name, lj] : j["loops"].members()) {
    Loop l = parseLoop(lj, std::string(where) + " loop " + name, error);
    l.name = name;
    putLoop(t.loops, l);
  }
  if (t.kind.empty() && error) *error += std::string(where) + ": needs a \"kind\"\n";
  return t;
}

void Library::add(std::string_view text, std::string_view file) {
  std::string err;
  const Json root = Json::parse(text, &err, {64, 1 << 16});
  if (!root.isObject()) {
    note(errors_, file, err.empty() ? "not a kind file" : err);
    return;
  }
  auto addOne = [&](const Json& j) {
    Kind k = parseKind(j, file, errors_);
    if (k.id.empty()) {
      note(errors_, file, "a kind needs an \"id\"");
      return;
    }
    for (Kind& x : raw_)
      if (x.id == k.id) {
        x = std::move(k);
        return;
      }
    raw_.push_back(std::move(k));
  };
  if (root.has("kinds")) {
    for (const Json& j : root["kinds"].items()) addOne(j);
  } else {
    addOne(root);
  }
}

void Library::resolve() {
  kinds_ = raw_;
  for (size_t i = 0; i < kinds_.size(); ++i) resolveOne(i, 0);
}

bool Library::resolveOne(size_t i, int depth) {
  Kind& k = kinds_[i];
  if (k.is.empty()) return true;
  if (depth > 16) {
    note(errors_, "kind \"" + k.id + "\"", "\"is\" goes round in a circle");
    k.is.clear();
    return false;
  }
  size_t b = kinds_.size();
  for (size_t x = 0; x < kinds_.size(); ++x)
    if (kinds_[x].id == k.is) b = x;
  if (b == kinds_.size()) {
    note(errors_, "kind \"" + k.id + "\"", "\"is\": no kind \"" + k.is + "\"");
    k.is.clear();
    return false;
  }
  if (!resolveOne(b, depth + 1)) {
    kinds_[i].is.clear();
    return false;
  }
  // The base, with this kind's own entries on top.
  Kind merged = kinds_[b];
  const Kind& own = kinds_[i];
  merged.id = own.id;
  merged.about = own.about.empty() ? merged.about : own.about;
  merged.still = own.still.empty() ? merged.still : own.still;
  merged.start = own.start.empty() ? merged.start : own.start;
  if (own.pivot.x != 0 || own.pivot.y != 0 || own.pivot.z != 0) merged.pivot = own.pivot;
  for (const auto& [n, p] : own.parts) putByName(merged.parts, n, p);
  for (const Loop& l : own.loops) putLoop(merged.loops, l);
  for (const State& s : own.states) putState(merged.states, s);
  for (const auto& [e, to] : own.on) putByName(merged.on, e, to);
  for (const ThingSpec& t : own.things) merged.things.push_back(t);
  merged.is.clear();  // resolved
  kinds_[i] = std::move(merged);
  return true;
}

const Kind* Library::find(std::string_view id) const {
  for (const Kind& k : kinds_)
    if (k.id == id) return &k;
  return nullptr;
}

Place parsePlace(std::string_view text, std::string* error) {
  Place p;
  std::string err;
  const Json root = Json::parse(text, &err, {64, 1 << 16});
  if (!root.isObject()) {
    if (error) *error += "place: " + (err.empty() ? std::string("not a place file") : err) + "\n";
    return p;
  }
  p.id = root["id"].string();
  p.about = root["about"].string();
  for (const Json& f : root["kinds"].items()) p.kindFiles.push_back(f.string());
  size_t n = 0;
  for (const Json& tj : root["things"].items()) {
    const std::string where = "place " + p.id + " thing " + std::to_string(++n);
    ThingSpec t = parseThing(tj, where, error);
    const Json& row = tj["row"];
    if (!row.isObject()) {
      p.things.push_back(std::move(t));
      continue;
    }
    // A row: the same thing `count` times, `step` apart; ids get -1, -2...
    const int count = std::max(1, std::min(256, row["count"].integer(1)));
    const Vec3 step = readVec3(row["step"], {});
    const float turnStep = static_cast<float>(row["turn"].number(0));
    for (int i = 0; i < count; ++i) {
      ThingSpec c = t;
      c.at = t.at + step * static_cast<float>(i);
      c.turn.y += turnStep * static_cast<float>(i);
      if (!t.id.empty()) c.id = t.id + "-" + std::to_string(i + 1);
      if (t.seed) c.seed = t.seed + static_cast<uint32_t>(i) * 7919u;
      p.things.push_back(std::move(c));
    }
  }
  return p;
}

}  // namespace engine::world
