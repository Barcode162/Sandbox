// Places in words (J116.3): see place.h.
#include "looped/words/place.h"

#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <map>

namespace engine::words {

namespace {

constexpr float kWallGap = 0.03f;    // a thing on a wall stands this far off it
constexpr float kCornerIn = 0.5f;    // a thing in a corner stands this far from both walls
constexpr float kNearCeiling = 0.45f;
constexpr float kHangGap = 0.06f;    // a hanging thing's mount below the ceiling
constexpr float kByGap = 0.15f;      // space between a thing and what it's by

bool isWord(const Token& t, std::string_view w) { return t.kind == Tok::kWord && t.text == w; }

bool lengthUnit(const Token& t) { return t.kind == Tok::kWord && (t.text == "m" || t.text == "cm" || t.text == "mm"); }

float toMetres(double v, const std::string& unit) {
  return static_cast<float>(unit == "cm" ? v / 100 : unit == "mm" ? v / 1000 : v);
}

bool direction(const Token& t, Vec3* d) {
  static const std::map<std::string, Vec3> kDirs = {
      {"left", {-1, 0, 0}},   {"right", {1, 0, 0}},  {"forward", {0, 0, 1}}, {"forwards", {0, 0, 1}},
      {"back", {0, 0, -1}},   {"backward", {0, 0, -1}}, {"backwards", {0, 0, -1}}, {"up", {0, 1, 0}},
      {"down", {0, -1, 0}}};
  if (t.kind != Tok::kWord) return false;
  auto it = kDirs.find(t.text);
  if (it == kDirs.end()) return false;
  if (d) *d = it->second;
  return true;
}

// Does a place clause start at tokens[i]?
bool placeStart(const std::vector<Token>& t, size_t i, size_t to) {
  static const char* kWords[] = {"in", "on", "by", "hanging", "at", "against", "called", "turned", "facing", "near"};
  if (t[i].kind == Tok::kWord)
    for (const char* w : kWords)
      if (t[i].text == w) return true;
  if (t[i].kind == Tok::kNumber) {
    size_t j = i + 1;
    if (j < to && lengthUnit(t[j])) ++j;
    if (j < to && direction(t[j], nullptr)) return true;
  }
  return false;
}

std::string idOf(const std::string& word) {
  std::string s;
  for (char c : word) s += c == ' ' ? '-' : c;
  return s;
}

bool numberWord(const Token& t, int* n) {
  static const char* kNums[] = {"one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"};
  for (int k = 0; k < 10; ++k)
    if (isWord(t, kNums[k])) return *n = k + 1, true;
  return false;
}

// The radius a thing takes on the floor (for `by`).
float footRadius(const ModelSize& s) {
  return std::max({std::fabs(s.min.x), std::fabs(s.max.x), std::fabs(s.min.z), std::fabs(s.max.z)});
}

}  // namespace

const Placed* Place::find(std::string_view n) const {
  for (const Placed& t : things)
    if (t.name == n) return &t;
  for (const Placed& t : things)
    if (t.word == n) return &t;
  return nullptr;
}

float Place::level(std::string_view thing, const std::vector<std::string>& on) const {
  float l = 1;
  for (const Rule& r : rules) {
    if (std::find(on.begin(), on.end(), r.event) == on.end()) continue;
    for (const std::string& n : r.things) {
      const Placed* p = find(n);
      if (p && p->name == thing) l *= r.level;
    }
  }
  return l;
}

namespace {

struct Reader {
  Words& words;
  const std::vector<std::string>& materials;
  const ModelSizer& sizer;
  Place& out;
  Problems& p;

  // `the table`, `the pendant lamp` at t[i]: the placed thing, i moved past it.
  const Placed* thingAt(const std::vector<Token>& t, size_t& i, size_t to) {
    if (i < to && isWord(t[i], "the")) ++i;
    // The longest name that matches.
    for (size_t n = std::min<size_t>(4, to - i); n >= 1; --n) {
      std::string name, id;
      for (size_t k = 0; k < n; ++k) {
        if (t[i + k].kind != Tok::kWord) break;
        name += (k ? " " : "") + t[i + k].text;
      }
      std::string bare = name;
      if (bare.size() > 2 && bare.compare(bare.size() - 2, 2, "'s") == 0) bare.resize(bare.size() - 2);
      if (const Placed* found = out.find(bare); found) return i += n, found;
      if (const Placed* found = out.find(idOf(bare)); found) return i += n, found;
      if (n == 1) break;
    }
    if (i < to) {
      std::vector<std::string> names;
      for (const Placed& q : out.things) names.push_back(q.name), names.push_back(q.word);
      problem(p, t[i], "`" + t[i].text + "` isn't in this place (yet)", didYouMean(t[i].text, names).empty() ? "place it on an earlier line" : didYouMean(t[i].text, names));
    }
    return nullptr;
  }

  bool shellFace(const Line& l, size_t from, size_t to) {
    const std::vector<Token>& t = l.tokens;
    size_t i = from;
    while (i < to && (isWord(t[i], "a") || isWord(t[i], "an") || isWord(t[i], "with"))) ++i;
    // material words, [side], face, [r g b]
    size_t face = i;
    while (face < to && !(isWord(t[face], "floor") || isWord(t[face], "ceiling") || isWord(t[face], "walls") || isWord(t[face], "wall"))) ++face;
    if (face >= to) {
      problem(p, t[std::min(i, to - 1)], "which part of the room?", "an oak floor, plaster walls, a brick back wall, a plaster ceiling");
      return false;
    }
    size_t matEnd = face;
    std::string side;
    if (isWord(t[face], "wall") && face > i && (isWord(t[face - 1], "left") || isWord(t[face - 1], "right") || isWord(t[face - 1], "back") || isWord(t[face - 1], "front")))
      side = t[face - 1].text, matEnd = face - 1;
    if (isWord(t[face], "wall") && side.empty()) {
      problem(p, t[face], "which wall?", "a brick back wall (left, right, back or front), or plaster walls for all four");
      return false;
    }
    std::string mat;
    for (size_t k = i; k < matEnd; ++k) mat += (k > i ? "-" : "") + t[k].text;
    Shell::Face f;
    if (!mat.empty()) {
      auto has = [&](const std::string& m) { return std::find(materials.begin(), materials.end(), m) != materials.end(); };
      const std::string withFace = mat + "-" + t[face].text;
      if (has(withFace)) f.material = withFace;
      else if (has(mat)) f.material = mat;
      else {
        problem(p, t[i], "`" + mat + "` isn't a material", didYouMean(mat, materials));
        return false;
      }
    }
    size_t j = face + 1;
    if (j < to && t[j].kind == Tok::kNumber) {
      if (!(j + 2 < to && t[j + 1].kind == Tok::kNumber && t[j + 2].kind == Tok::kNumber)) {
        problem(p, t[j], "a colour is three numbers", "plaster walls 0.42 0.36 0.32");
        return false;
      }
      f.coloured = true;
      f.colour = {static_cast<float>(t[j].number), static_cast<float>(t[j + 1].number), static_cast<float>(t[j + 2].number)};
      j += 3;
    }
    if (j < to) {
      problem(p, t[j], "`" + t[j].text + "` doesn't fit here", "separate the parts of the room with commas");
      return false;
    }
    Shell& s = out.shell;
    const std::string& w = t[face].text;
    if (w == "floor") s.floor = f;
    else if (w == "ceiling") s.ceiling = f;
    else if (w == "walls") s.left = s.right = s.back = s.front = f;
    else if (side == "left") s.left = f;
    else if (side == "right") s.right = f;
    else if (side == "back") s.back = f;
    else s.front = f;
    return true;
  }

  // a room 6.4 by 6.4 and 3 high, with an oak floor, plaster walls and a brick back wall
  bool room(const Line& l) {
    const std::vector<Token>& t = l.tokens;
    const size_t n = t.size();
    auto num = [&](size_t i) { return i < n && t[i].kind == Tok::kNumber; };
    if (!(num(2) && n > 3 && isWord(t[3], "by") && num(4) && n > 7 && isWord(t[5], "and") && num(6) && isWord(t[7], "high"))) {
      problem(p, t[std::min<size_t>(2, n - 1)], "a room's size is its width by its depth and its height", "a room 6 by 6 and 3 high");
      return false;
    }
    Shell& s = out.shell;
    s.has = true;
    s.width = static_cast<float>(t[2].number);
    s.depth = static_cast<float>(t[4].number);
    s.height = static_cast<float>(t[6].number);
    size_t i = 8;
    if (i < n && t[i].is(",")) ++i;
    if (i < n && !isWord(t[i], "with")) {
      problem(p, t[i], "after the size comes what it's made of", "…, with an oak floor and plaster walls");
      return false;
    }
    // The parts, split by commas and `and`.
    size_t start = i;
    for (size_t k = i; k <= n; ++k) {
      if (k == n || t[k].is(",") || isWord(t[k], "and")) {
        if (k > start && !(k == start + 1 && isWord(t[start], "with")))
          if (!shellFace(l, start, k)) return false;
        start = k + 1;
      }
    }
    return true;
  }

  // when the lights go down, the pendant lamp and the bulb dim to a quarter
  bool rule(const Line& l) {
    const std::vector<Token>& t = l.tokens;
    const size_t n = t.size();
    Rule r;
    r.whilst = isWord(t[0], "while");
    r.line = l.line;
    const size_t comma = findSymbol(l, ",");
    if (comma >= n || comma < 2) {
      problem(p, t[0], "a cause has two halves: what happens, then what changes", "when the lights go down, the lamp dims to a quarter");
      return false;
    }
    r.event = joinWords(l, 1, comma);
    // The change: its verb, from the end.
    static const char* kVerbs[] = {"dim", "dims", "go", "goes", "light", "lights", "brighten", "brightens"};
    size_t verb = n;
    for (size_t k = comma + 1; k < n; ++k)
      for (const char* v : kVerbs)
        if (isWord(t[k], v) && verb == n) verb = k;
    if (verb == n) {
      problem(p, t[comma + 1 < n ? comma + 1 : comma], "what changes? a cause ends with what the things do",
              "dim to a quarter, go out, light up, brighten to 80%");
      return false;
    }
    // The things before the verb.
    size_t i = comma + 1;
    while (i < verb) {
      if (t[i].is(",") || isWord(t[i], "and")) {
        ++i;
        continue;
      }
      const Placed* q = thingAt(t, i, verb);
      if (!q) return false;
      r.things.push_back(q->name);
    }
    if (r.things.empty()) {
      problem(p, t[verb], "which things change?", "…, the lamp and the bulb dim to a quarter");
      return false;
    }
    const std::string v = t[verb].text;
    size_t k = verb + 1;
    auto rest = [&]() { return joinWords(l, k, n); };
    if (v == "go" || v == "goes") {
      if (rest() != "out") return problem(p, t[verb], "`" + v + " " + rest() + "`: did you mean `" + v + " out`?"), false;
      r.level = 0;
    } else if (v == "light" || v == "lights") {
      if (rest() != "up") return problem(p, t[verb], "`" + v + " " + rest() + "`: did you mean `" + v + " up`?"), false;
      r.level = 1;
    } else {
      if (!(k < n && isWord(t[k], "to"))) return problem(p, t[verb], "`" + v + "` to how much?", v + " to a quarter, " + v + " to 40%"), false;
      ++k;
      const std::string amount = rest();
      if (amount == "a quarter") r.level = 0.25f;
      else if (amount == "half" || amount == "a half") r.level = 0.5f;
      else if (amount == "a third") r.level = 1.0f / 3;
      else if (amount == "full") r.level = 1;
      else if (k < n && t[k].kind == Tok::kNumber && (k + 1 == n || (k + 2 == n && t[k + 1].is("%")))) {
        r.level = static_cast<float>(t[k].number / (k + 2 == n ? 100 : 1));
      } else {
        problem(p, t[std::min(k, n - 1)], "`" + amount + "` isn't an amount here", "a quarter, half, a third, full, 40%");
        return false;
      }
    }
    out.rules.push_back(r);
    return true;
  }

  // you come in at 0 1.65 2.6, facing 0
  bool spawn(const Line& l) {
    const std::vector<Token>& t = l.tokens;
    const size_t n = t.size();
    if (!(n >= 7 && isWord(t[3], "at") && t[4].kind == Tok::kNumber && t[5].kind == Tok::kNumber && t[6].kind == Tok::kNumber)) {
      problem(p, t[0], "where do you come in?", "you come in at 0 1.65 2.6");
      return false;
    }
    out.spawn = {static_cast<float>(t[4].number), static_cast<float>(t[5].number), static_cast<float>(t[6].number)};
    size_t i = 7;
    if (i < n && t[i].is(",")) ++i;
    if (i + 1 < n && isWord(t[i], "facing") && t[i + 1].kind == Tok::kNumber) out.spawnYaw = static_cast<float>(t[i + 1].number), i += 2;
    if (i < n) return problem(p, t[i], "`" + t[i].text + "` doesn't fit here", "you come in at 0 1.65 2.6, facing 0"), false;
    return true;
  }

  ModelSize sizeOf(const Thing& th) {
    ModelSize s;
    if (!th.model.empty() && sizer) s = sizer(th.model);
    if (!s.known && (th.box.x > 0 || th.box.y > 0)) {
      s.min = th.box * -0.5f;
      s.max = th.box * 0.5f;
      s.known = true;
    }
    return s;
  }

  bool thing(const Line& l) {
    const std::vector<Token>& t = l.tokens;
    const size_t n = t.size();
    // Split into the thing phrase and its place clauses: segments by commas;
    // a segment is a place clause if it starts with a place word or a move;
    // within the first, the place starts at the first place word.
    Line phrase;
    phrase.line = l.line;
    std::vector<std::pair<size_t, size_t>> clauses;
    size_t start = 0;
    for (size_t k = 0; k <= n; ++k) {
      if (k < n && !t[k].is(",")) continue;
      size_t a = start, b = k;
      start = k + 1;
      if (a >= b) continue;
      size_t split = b;
      for (size_t m = a; m < b; ++m)
        if ((m > a || !phrase.tokens.empty()) && placeStart(t, m, b)) {
          split = m;
          break;
        }
      if (a == 0 && split == 0) split = b;  // the line can't start with a place
      if (split > a) {
        if (!phrase.tokens.empty()) {
          Token c = t[a];
          c.kind = Tok::kSymbol;
          c.text = ",";
          phrase.tokens.push_back(c);
        }
        phrase.tokens.insert(phrase.tokens.end(), t.begin() + static_cast<long>(a), t.begin() + static_cast<long>(split));
      }
      // The place part: split again by `and` between moves.
      size_t cs = split;
      for (size_t m = split; m <= b; ++m) {
        if (m == b || (isWord(t[m], "and") && m + 1 < b && placeStart(t, m + 1, b))) {
          if (m > cs) clauses.push_back({cs, m});
          cs = m + 1;
        }
      }
    }
    // How many (the reader counts them too, but each copy is placed apart).
    int count = 1;
    if (!phrase.tokens.empty()) numberWord(phrase.tokens[0], &count);
    Thing th;
    if (!words.read(phrase, 0, phrase.tokens.size(), th, p)) return false;
    th.count = 1;
    const ModelSize size = sizeOf(th);
    std::string name = idOf(th.word);
    // Each copy placed by the clauses.
    std::vector<Placed> made;
    for (int c = 0; c < count; ++c) {
      Placed q;
      q.word = th.word;
      q.thing = th;
      q.line = l.line;
      q.size = size;
      const Placed* ref = nullptr;  // what it's on or by (for `facing it`)
      bool turnedSet = false;
      for (const auto& [a, b] : clauses) {
        size_t i = a;
        const Token& w = t[i];
        auto expect = [&](size_t k, const char* s) { return k < b && isWord(t[k], s); };
        auto done = [&](size_t k) {
          if (k < b) {
            problem(p, t[k], "`" + joinWords(l, k, b) + "` doesn't fit here", "one place per clause; separate them with commas");
            return false;
          }
          return true;
        };
        auto needShell = [&](const Token& at) {
          if (out.shell.has) return true;
          problem(p, at, "a room comes first", "a room 6.4 by 6.4 and 3 high, with plaster walls");
          return false;
        };
        if (w.kind == Tok::kNumber) {  // a move
          size_t k = i + 1;
          std::string unit = "m";
          if (k < b && lengthUnit(t[k])) unit = t[k++].text;
          Vec3 d;
          direction(t[k], &d);
          q.at = q.at + d * toMetres(w.number, unit);
          if (!done(k + 1)) return false;
        } else if (isWord(w, "in") && expect(i + 1, "the") && expect(i + 2, "middle")) {
          q.at.x = 0, q.at.z = 0;
          size_t k = i + 3;
          if (expect(k, "of") && expect(k + 1, "the") && expect(k + 2, "room")) k += 3;
          if (!done(k)) return false;
        } else if (isWord(w, "in") && expect(i + 1, "the") && expect(i + 4, "corner")) {
          if (!needShell(w)) return false;
          const bool farSide = isWord(t[i + 2], "far") || isWord(t[i + 2], "back");
          const bool nearSide = isWord(t[i + 2], "near") || isWord(t[i + 2], "front");
          const bool left = isWord(t[i + 3], "left"), right = isWord(t[i + 3], "right");
          if (!(farSide || nearSide) || !(left || right)) {
            problem(p, t[i + 2], "which corner?", "in the far left corner (far or near, left or right)");
            return false;
          }
          q.at.x = (left ? -1 : 1) * (out.shell.width * 0.5f - kCornerIn);
          q.at.z = (farSide ? -1 : 1) * (out.shell.depth * 0.5f - kCornerIn);
          if (!done(i + 5)) return false;
        } else if (isWord(w, "near") && expect(i + 1, "the") && (expect(i + 2, "ceiling") || expect(i + 2, "floor"))) {
          if (!needShell(w)) return false;
          q.at.y = expect(i + 2, "ceiling") ? out.shell.height - kNearCeiling : 0.3f;
          if (!done(i + 3)) return false;
        } else if (isWord(w, "hanging") && expect(i + 1, "from") && expect(i + 2, "the") && expect(i + 3, "ceiling")) {
          if (!needShell(w)) return false;
          q.at.y = out.shell.height - kHangGap;
          if (!done(i + 4)) return false;
        } else if ((isWord(w, "on") || isWord(w, "against")) && expect(i + 1, "the") && expect(i + 3, "wall")) {
          if (!needShell(w)) return false;
          const std::string side = t[i + 2].text;
          const float hx = out.shell.width * 0.5f - kWallGap, hz = out.shell.depth * 0.5f - kWallGap;
          if (side == "left") q.at.x = -hx, q.turn = 90;
          else if (side == "right") q.at.x = hx, q.turn = -90;
          else if (side == "back" || side == "far") q.at.z = -hz, q.turn = 0;
          else if (side == "front" || side == "near") q.at.z = hz, q.turn = 180;
          else {
            problem(p, t[i + 2], "which wall?", "on the left wall (left, right, back or front)");
            return false;
          }
          if (!done(i + 4)) return false;
        } else if (isWord(w, "on")) {  // on the table
          size_t k = i + 1;
          if (expect(k, "the") && expect(k + 1, "floor")) {
            q.at.y = 0;
            if (!done(k + 2)) return false;
            continue;
          }
          const Placed* o = thingAt(t, k, b);
          if (!o) return false;
          ref = o;
          q.at.x = o->at.x, q.at.z = o->at.z;
          q.at.y = o->at.y + (o->size.known ? o->size.max.y : 0);
          if (q.thing.model.empty() && size.known) q.at.y += -size.min.y;
          if (!done(k)) return false;
        } else if (isWord(w, "by") || (isWord(w, "next") && expect(i + 1, "to"))) {
          size_t k = i + (isWord(w, "by") ? 1 : 2);
          const Placed* o = thingAt(t, k, b);
          if (!o) return false;
          ref = o;
          static const Vec3 kAround[] = {{1, 0, 0}, {-1, 0, 0}, {0, 0, 1}, {0, 0, -1}};
          const float d = footRadius(o->size) + footRadius(size) + kByGap;
          const Vec3 dir = kAround[c % 4];
          q.at.x = o->at.x + dir.x * d, q.at.z = o->at.z + dir.z * d;
          if (!done(k)) return false;
        } else if (isWord(w, "facing")) {
          size_t k = i + 1;
          const Placed* o = ref;
          if (expect(k, "it")) ++k;
          else o = thingAt(t, k, b);
          if (!o) {
            if (!hasErrors(p)) problem(p, w, "facing what?", "two stools by the table, facing it");
            return false;
          }
          const float dx = q.at.x - o->at.x, dz = q.at.z - o->at.z;
          if (dx * dx + dz * dz > 1e-8f) q.turn = std::atan2(dx, dz) * 57.29578f;
          turnedSet = true;
          if (!done(k)) return false;
        } else if (isWord(w, "turned") && i + 1 < b && t[i + 1].kind == Tok::kNumber) {
          q.turn = static_cast<float>(t[i + 1].number);
          turnedSet = true;
          size_t k = i + 2;
          if (expect(k, "degrees")) ++k;
          if (!done(k)) return false;
        } else if (isWord(w, "at") && i + 3 < b && t[i + 1].kind == Tok::kNumber && t[i + 2].kind == Tok::kNumber &&
                   t[i + 3].kind == Tok::kNumber) {
          q.at = {static_cast<float>(t[i + 1].number), static_cast<float>(t[i + 2].number), static_cast<float>(t[i + 3].number)};
          if (!done(i + 4)) return false;
        } else if (isWord(w, "called") && i + 1 < b) {
          name = joinWords(l, i + 1, b, "-");
        } else {
          problem(p, w, "`" + joinWords(l, a, b) + "` isn't a place", "in the middle, on the table, by the table, on the left wall, 1.4 m left");
          return false;
        }
      }
      (void)turnedSet;
      made.push_back(std::move(q));
    }
    for (size_t c = 0; c < made.size(); ++c) {
      std::string id = count > 1 ? name + "-" + std::to_string(c + 1) : name;
      // A name already taken gets a number.
      for (int k = 2; out.find(id) && out.find(id)->name == id; ++k) id = name + "-" + std::to_string(k);
      made[c].name = id;
      out.things.push_back(std::move(made[c]));
    }
    return true;
  }
};

}  // namespace

bool readPlace(Words& words, std::string_view text, const std::string& file, const std::vector<std::string>& materials,
               const ModelSizer& sizer, Place& out, Problems& p) {
  (void)file;
  const size_t before = p.size();
  std::vector<Line> lines = readLines(text, p);
  if (hasErrors(p)) return false;
  if (lines.size() != 1 || lines[0].tokens.empty() || !isWord(lines[0].tokens[0], "place")) {
    p.push_back({lines.empty() ? 1 : lines[0].line, 1, "a place file is one `place` with its lines under it", "place the light lab", false});
    return false;
  }
  const Line& head = lines[0];
  out.name = joinWords(head, 1, head.tokens.size());
  Reader r{words, materials, sizer, out, p};
  for (const Line& l : head.children) {
    const std::vector<Token>& t = l.tokens;
    if (t.empty()) continue;
    bool ok = true;
    if (isWord(t[0], "about") && t.size() > 1 && t[1].is(":")) out.about = joinWords(l, 2, t.size());
    else if (isWord(t[0], "when") || isWord(t[0], "while")) ok = r.rule(l);
    else if (t.size() > 2 && isWord(t[0], "you") && isWord(t[1], "come") && isWord(t[2], "in")) ok = r.spawn(l);
    else if (t.size() > 1 && isWord(t[0], "a") && isWord(t[1], "room")) ok = r.room(l);
    else ok = r.thing(l);
    if (!l.children.empty() && ok) {
      problem(p, l.children[0].tokens.empty() ? t[0] : l.children[0].tokens[0], "a line under a thing doesn't mean anything yet",
              "give each thing its own line");
      ok = false;
    }
    (void)ok;  // keep reading: every line's problem is shown at once
  }
  return !hasErrors(Problems(p.begin() + static_cast<long>(before), p.end()));
}

}  // namespace engine::words
