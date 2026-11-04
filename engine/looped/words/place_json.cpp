// A place in words → the world's place file (J116.3): see place_json.h.
#include "looped/words/place_json.h"

#include <algorithm>
#include <cmath>
#include <cstdio>

namespace engine::words {

namespace {

std::string num(double v) {
  if (std::fabs(v) < 5e-5) v = 0;
  char b[32];
  std::snprintf(b, sizeof b, "%.4f", v);
  std::string s = b;
  while (!s.empty() && s.back() == '0') s.pop_back();
  if (!s.empty() && s.back() == '.') s.pop_back();
  return s == "-0" ? "0" : s;
}
std::string vec(Vec3 v) { return "[" + num(v.x) + ", " + num(v.y) + ", " + num(v.z) + "]"; }
std::string str(const std::string& s) {
  std::string o = "\"";
  for (char c : s) {
    if (c == '"' || c == '\\') o += '\\';
    o += c;
  }
  return o + "\"";
}

Vec3 turnY(Vec3 v, float degrees) {
  const float r = degrees * 0.017453292f, c = std::cos(r), s = std::sin(r);
  return {c * v.x + s * v.z, v.y, -s * v.x + c * v.z};
}

// The shape a doing word uses (its brightness line's call), as a loop shape.
std::string shapeOf(const Dictionary& dict, const std::string& word) {
  const Word* w = dict.find(word);
  if (!w) return "";
  for (const Line& l : w->lines)
    for (size_t i = 0; i + 1 < l.tokens.size(); ++i)
      if (l.tokens[i + 1].is("(")) {
        const std::string& f = l.tokens[i].text;
        if (f == "flicker" || f == "noise" || f == "wave") return f;
        if (f == "thump") return "beat";
      }
  return "";
}

double setting(const Doing& g, const char* name, double fallback, std::string* unit = nullptr) {
  for (const auto& [n, v] : g.settings)
    if (n == name) {
      if (unit) *unit = v.unit;
      return v.v;
    }
  return fallback;
}

struct Writer {
  const Place& place;
  const KindIndex& kinds;
  const Dictionary& dict;
  Problems& p;
  std::vector<std::string> lines;
  std::vector<std::string> files{"kinds/words.json"};

  void useFile(const std::string& f) {
    for (const std::string& x : files)
      if (x == f) return;
    files.insert(files.end() - 1, f);
  }

  bool dims(const std::string& name) const {
    for (const Rule& r : place.rules)
      if (r.event == "the lights go down")
        for (const std::string& n : r.things)
          if (const Placed* q = place.find(n); q && q->name == name) return true;
    return false;
  }

  // A thing that gives light (a light word, or a part that does).
  bool light(const std::string& id, const Thing& t, Vec3 at, float turn, bool dim, int line) {
    const LightSpec& l = t.light;
    std::string j = "{\"id\": " + str(id) + ", \"kind\": \"word-light\", \"at\": " + vec(at);
    if (std::fabs(turn) > 1e-4f) j += ", \"turn\": " + num(turn);
    j += ", \"parts\": {";
    j += "\"light\": {\"color\": " + vec(l.rgb ? l.colour : Vec3{1, 1, 1});
    if (!l.rgb) j += ", \"kelvin\": " + num(l.kelvin);
    j += ", \"lumens\": " + num(l.lumens) + ", \"intensity\": 1, \"range\": 5";
    if (l.shape == 0) {
      j += ", \"radius\": " + num(std::max(0.005f, l.a * 0.5f));
    } else if (l.shape == 1) {
      j += ", \"radius\": 0.03, \"shape\": \"tube\", \"center\": [0, 0, 0], \"axis\": [1, 0, 0], \"length\": " + num(l.a);
    } else {
      j += ", \"radius\": 0.05, \"shape\": \"panel\", \"center\": [0, 0, 0.02], \"axis\": [1, 0, 0], \"length\": " + num(l.a) +
           ", \"axis2\": [0, 1, 0], \"width\": " + num(l.b);
      if (l.oneSided) j += ", \"wall\": true";
    }
    if (dim) j += ", \"dims\": true";
    j += "}";
    if (t.box.x > 0 || t.box.y > 0 || t.box.z > 0) {
      Vec3 c = t.glows ? t.glow : Vec3{0.5f, 0.5f, 0.5f};
      const float top = std::max({c.x, c.y, c.z});
      if (top > 1) c = c * (1 / top);  // a colour (0..1); how bright it glows is "glow"
      j += ", \"boxes\": [{\"at\": [0, 0, 0], \"size\": " + vec(t.box) + ", \"color\": " + vec(c) + ", \"glow\": " + (t.glows ? "5" : "0") +
           ", \"solid\": false}]";
    }
    j += "}";  // the parts
    // What it does: its first doing as the thing's loop (the world plays one loop at a time).
    if (!t.doings.empty()) {
      const Doing& g = t.doings[0];
      const std::string shape = shapeOf(dict, g.word);
      if (shape.empty()) {
        p.push_back({line, 1, "`" + g.word + "` can't be played by today's world yet (it has no flicker, noise, wave or thump)", "", false});
        return false;
      }
      if (t.doings.size() > 1)
        p.push_back({line, 1, "a light here does only its first doing (`" + g.word + "`) in today's world", "", true});
      std::string unit;
      const double every = setting(g, "every", 1, &unit), amount = setting(g, "amount", 0.1), speed = setting(g, "speed", 1);
      const bool beats = unit.rfind("beat", 0) == 0;
      j += ", \"loops\": {\"live\": {\"period\": " + num(every) + (beats ? ", \"beat\": true" : "") +
           ", \"pieces\": [{\"ch\": \"light\", \"shape\": \"" + shape + "\", \"amp\": " + num(amount) +
           (shape == "flicker" || shape == "noise" ? ", \"rate\": " + num(speed) : "") + "}]}}";
    }
    j += "}";
    lines.push_back(j);
    return true;
  }

  // A thing's parts that give light, as things beside it.
  bool parts(const std::string& id, const Thing& t, Vec3 at, float turn, bool dim, int line) {
    for (const Thing& part : t.parts) {
      const Vec3 where = at + turnY(part.at, turn);
      const std::string pid = id + "-" + part.word;
      if (part.hasLight && !light(pid, part, where, turn, dim, line)) return false;
      if (!part.hasLight && !parts(pid, part, where, turn, dim, line)) return false;
    }
    return true;
  }

  bool thing(const Placed& q) {
    const Thing& t = q.thing;
    const bool dim = dims(q.name);
    if (!t.model.empty()) {
      auto it = kinds.find(t.model);
      if (it == kinds.end()) {
        p.push_back({q.line, 1, "no kind in the world is made of the model `" + t.model + "`", "add one to assets/world/kinds/", false});
        return false;
      }
      useFile(it->second.file);
      std::string j = "{\"id\": " + str(q.name) + ", \"kind\": " + str(it->second.kind) + ", \"at\": " + vec(q.at);
      if (std::fabs(q.turn) > 1e-4f) j += ", \"turn\": " + num(q.turn);
      j += "}";
      lines.push_back(j);
      if (t.hasLight) {
        p.push_back({q.line, 1, "a model that gives light itself isn't in today's world yet; give it a part that does", "", false});
        return false;
      }
      return parts(q.name, t, q.at, q.turn, dim, q.line);
    }
    if (t.hasLight) return light(q.name, t, q.at, q.turn, dim, q.line) && parts(q.name, t, q.at, q.turn, dim, q.line);
    p.push_back({q.line, 1, "a " + t.word + " has no model and gives no light: nothing to put in the world", "", false});
    return false;
  }

  std::string shell() {
    const Shell& s = place.shell;
    const float W = s.width, D = s.depth, H = s.height, T = s.thickness;
    std::string boxes;
    auto box = [&](Vec3 at, Vec3 size, const Shell::Face& f) {
      if (!boxes.empty()) boxes += ", ";
      boxes += "{\"at\": " + vec(at) + ", \"size\": " + vec(size);
      if (!f.material.empty()) boxes += ", \"material\": " + str(f.material);
      if (f.coloured) boxes += ", \"color\": " + vec(f.colour);
      boxes += "}";
    };
    box({0, -T / 4, 0}, {W, T / 2, D}, s.floor);
    box({0, H + T / 4, 0}, {W, T / 2, D}, s.ceiling);
    box({0, H / 2, -(D + T) / 2}, {W, H, T}, s.back);
    box({0, H / 2, (D + T) / 2}, {W, H, T}, s.front);
    box({-(W + T) / 2, H / 2, 0}, {T, H, D}, s.left);
    box({(W + T) / 2, H / 2, 0}, {T, H, D}, s.right);
    const float bx = std::ceil(W / 2 + T), bz = std::ceil(D / 2 + T), ix = W / 2, iz = D / 2;
    const std::string blocks = "[[" + num(-bx) + ", " + num(-bz) + ", " + num(bx) + ", " + num(-iz) + "], [" + num(-bx) + ", " + num(iz) +
                               ", " + num(bx) + ", " + num(bz) + "], [" + num(-bx) + ", " + num(-bz) + ", " + num(-ix) + ", " + num(bz) +
                               "], [" + num(ix) + ", " + num(-bz) + ", " + num(bx) + ", " + num(bz) + "]]";
    return "{\"id\": \"room\", \"kind\": \"word-shell\", \"at\": [0, 0, 0], \"parts\": {\"boxes\": [" + boxes + "], \"blocks\": " + blocks + "}}";
  }
};

}  // namespace

bool placeToJson(const Place& place, const std::string& id, const KindIndex& kinds, const Dictionary& dict, std::string& out,
                 Problems& p) {
  Writer w{place, kinds, dict, p, {}, {"kinds/words.json"}};
  if (!place.shell.has) {
    p.push_back({1, 1, "a place needs a room (for now)", "a room 6.4 by 6.4 and 3 high, with plaster walls", false});
    return false;
  }
  w.lines.push_back(w.shell());
  bool ok = true;
  for (const Placed& q : place.things) ok = w.thing(q) && ok;
  if (!ok) return false;
  const Shell& s = place.shell;
  const float hx = s.width / 2, hz = s.depth / 2;
  std::string fl;
  for (size_t i = 0; i < w.files.size(); ++i) fl += (i ? ", " : "") + str(w.files[i]);
  out = "{\n";
  out += "  \"id\": " + str(id) + ",\n";
  out += "  \"about\": " + str("Made from " + id + ".looped by node tools/words.mjs place " + id + " (never edited by hand). " + place.about) + ",\n";
  out += "  \"kinds\": [" + fl + "],\n";
  out += "  \"air\": {\"ambient\": [0.08, 0.06, 0.05], \"fog\": [0.02, 0.015, 0.015], \"fogDensity\": 0.01, \"beams\": 0.01},\n";
  out += "  \"spawn\": {\"at\": " + vec(place.spawn) + ", \"yaw\": " + num(place.spawnYaw) + "},\n";
  out += "  \"lightGrid\": {\"min\": [" + num(-std::ceil(hx + 0.5f)) + ", 0, " + num(-std::ceil(hz + 0.5f)) + "], \"max\": [" +
         num(std::ceil(hx + 0.5f)) + ", 0, " + num(std::ceil(hz + 0.5f)) + "]},\n";
  out += "  \"rooms\": [{\"id\": " + str(id) + ", \"min\": [" + num(-hx - 0.05f) + ", -0.2, " + num(-hz - 0.05f) + "], \"max\": [" +
         num(hx + 0.05f) + ", " + num(s.height + 0.3f) + ", " + num(hz + 0.05f) + "]}],\n";
  out += "  \"doorways\": [],\n";
  out += "  \"areas\": {\"arcade\": {\"min\": [0, 0, 0], \"max\": [0, 0, 0]}},\n";
  out += "  \"points\": {\"arcade-door\": [0, 0, 0]},\n";
  out += "  \"things\": [\n";
  for (size_t i = 0; i < w.lines.size(); ++i) out += "    " + w.lines[i] + (i + 1 < w.lines.size() ? ",\n" : "\n");
  out += "  ]\n}\n";
  return true;
}

}  // namespace engine::words
