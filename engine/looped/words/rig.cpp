#include "looped/words/rig.h"

#include <algorithm>
#include <cctype>
#include <cmath>
#include <cstdlib>

#include "looped/light_units.h"

namespace engine::words {

namespace {

void err(Problems& p, const Token& at, std::string what, std::string hint = {}) { problem(p, at, std::move(what), std::move(hint)); }
void errLine(Problems& p, int line, std::string what, std::string hint = {}) {
  p.push_back({line, 0, std::move(what), std::move(hint), false});
}
std::string words(const Line& l, size_t from, size_t to, const char* join = " ") { return joinWords(l, from, to, join); }

bool glob(std::string_view pattern, std::string_view s) {
  const size_t star = pattern.find('*');
  if (star == std::string_view::npos) return pattern == s;
  const std::string_view head = pattern.substr(0, star), tail = pattern.substr(star + 1);
  if (s.size() < head.size() || s.substr(0, head.size()) != head) return false;
  for (size_t at = head.size(); at <= s.size(); ++at)
    if (glob(tail, s.substr(at))) return true;
  return false;
}

// "light-bulb-12" → {"light-bulb-", 12}; false if it doesn't end in digits.
bool splitNumber(const std::string& s, std::string& head, int& n) {
  size_t i = s.size();
  while (i > 0 && std::isdigit(static_cast<unsigned char>(s[i - 1]))) --i;
  if (i == s.size()) return false;
  head = s.substr(0, i);
  n = std::atoi(s.c_str() + i);
  return true;
}

const std::vector<std::string> kTop = {"light", "mood", "shape"};
const std::vector<std::string> kSettings = {"brightness", "colour", "tint", "state", "when"};

}  // namespace

// ---- Reading ----

bool Rig::load(std::string_view text, const std::vector<LampInfo>& lamps, const std::vector<std::string>& events,
               Problems& problems) {
  *this = Rig();
  lamps_ = lamps;
  events_ = events;
  const size_t before = problems.size();
  auto mine = [&] {
    Problems p(problems.begin() + static_cast<long>(before), problems.end());
    return p;
  };
  const std::vector<Line> lines = readLines(text, problems);
  // Made words first (they may be used above where they're made), then the rest.
  for (const Line& l : lines)
    if (l.tokens[0].is("shape")) program_.readShape(l, problems);
  for (const Line& l : lines) {
    const Token& first = l.tokens[0];
    if (first.is("light")) readLight(l, problems);
    else if (first.is("mood")) readMood(l, problems);
    else if (!first.is("shape"))
      err(problems, first, "`" + first.text + "` isn't something a light rig has", didYouMean(first.text, kTop).empty() ? "start with `light`, `mood` or `shape`" : didYouMean(first.text, kTop));
  }
  // Every lamp in at most one light; lamps in none are told about.
  lampLight_.assign(lamps_.size(), -1);
  for (size_t k = 0; k < lights_.size(); ++k) {
    for (int i : lights_[k].lamps) {
      int& owner = lampLight_[static_cast<size_t>(i)];
      if (owner >= 0 && owner != static_cast<int>(k)) {
        errLine(problems, lights_[k].line,
                "`" + lamps_[static_cast<size_t>(i)].id + "` is in two lights: `" + lights_[static_cast<size_t>(owner)].name +
                    "` (line " + std::to_string(lights_[static_cast<size_t>(owner)].line) + ") and `" + lights_[k].name + "`",
                "a lamp belongs to one light; take it out of one of them");
      }
      owner = static_cast<int>(k);
    }
  }
  std::vector<std::string> loose;
  for (size_t i = 0; i < lamps_.size(); ++i)
    if (lampLight_[i] < 0) loose.push_back(lamps_[i].id);
  if (!loose.empty() && !lights_.empty()) {
    std::string list;
    for (size_t i = 0; i < loose.size() && i < 6; ++i) list += (i ? ", " : "") + loose[i];
    if (loose.size() > 6) list += " and " + std::to_string(loose.size() - 6) + " more";
    problems.push_back({0, 0, std::to_string(loose.size()) + " lamp" + (loose.size() == 1 ? " is" : "s are") + " in no light (" + list + ")",
                        "they stay as the world gives them; name them in a light to give them a channel", true});
  }
  if (hasErrors(mine())) {
    const std::vector<LampInfo> keep = lamps_;
    *this = Rig();
    lamps_ = keep;
    lampLight_.assign(lamps_.size(), -1);
    lampValue_.assign(lamps_.size(), {1, 1, 1});
    return false;
  }
  for (size_t k = 0; k < lights_.size(); ++k) {
    Channel c;
    c.name = lights_[k].name;
    c.lamps = lights_[k].lamps;
    c.line = lights_[k].line;
    c.each = lights_[k].bright.each;
    for (const State& s : lights_[k].states) c.each = c.each || s.bright.each;
    channels_.push_back(std::move(c));
  }
  lampValue_.assign(lamps_.size(), {1, 1, 1});
  channelValue_.assign(channels_.size(), {1, 1, 1});
  return true;
}

void Rig::readLight(const Line& l, Problems& p) {
  Light light;
  light.line = l.line;
  const size_t colon = findSymbol(l, ":");
  if (colon >= l.tokens.size()) {
    err(p, l.tokens[0], "a light needs `:` and then its lamps", "light strings: string-light-*");
    return;
  }
  light.name = words(l, 1, colon);
  if (light.name.empty()) {
    err(p, l.tokens[colon], "this light has no name", "light strings: string-light-*");
    return;
  }
  for (const Light& other : lights_)
    if (other.name == light.name) {
      err(p, l.tokens[1], "there's already a light called `" + light.name + "` (line " + std::to_string(other.line) + ")",
          "give this one another name");
      return;
    }
  light.seed = world::hash32(light.name) | 1u;
  if (!readSelectors(l, colon + 1, light, p)) return;
  // One colour temperature for all its lamps (for `colour`), or none.
  light.kelvin = light.lamps.empty() ? 0 : lamps_[static_cast<size_t>(light.lamps[0])].kelvin;
  for (int i : light.lamps)
    if (lamps_[static_cast<size_t>(i)].kelvin != light.kelvin) light.kelvin = -1;
  for (const Line& c : l.children) {
    const Token& w = c.tokens[0];
    if (w.is("state")) {
      State s;
      s.line = c.line;
      s.name = words(c, 1, c.tokens.size());
      if (s.name.empty()) {
        err(p, w, "this state has no name", "state calm");
        continue;
      }
      for (const State& o : light.states)
        if (o.name == s.name) err(p, c.tokens[1], "`" + light.name + "` already has a state `" + s.name + "`", "give this one another name");
      light.states.push_back(std::move(s));
      for (const Line& sc : c.children) {
        if (sc.tokens[0].is("state")) {
          err(p, sc.tokens[0], "a state can't hold another state", "put it under the light, level with this one");
          continue;
        }
        readSetting(sc, light, &light.states.back(), p);
      }
      continue;
    }
    readSetting(c, light, nullptr, p);
  }
  // `go to` names a state of this light.
  std::vector<std::string> names;
  for (const State& s : light.states) names.push_back(s.name);
  auto resolve = [&](std::vector<When>& whens) {
    for (When& w : whens) {
      if (!w.action.go) continue;
      const auto it = std::find(names.begin(), names.end(), w.action.stateName);
      if (it != names.end()) {
        w.action.state = static_cast<int>(it - names.begin());
      } else if (names.empty()) {
        p.push_back({w.action.line, w.action.column, "`" + light.name + "` has no states to go to", "add `state <name>` lines under it", false});
      } else {
        p.push_back({w.action.line, w.action.column, "`" + w.action.stateName + "` isn't a state of `" + light.name + "`",
                     didYouMean(w.action.stateName, names), false});
      }
    }
  };
  resolve(light.whens);
  for (State& s : light.states) resolve(s.whens);
  lights_.push_back(std::move(light));
}

bool Rig::readSelectors(const Line& l, size_t from, Light& light, Problems& p) {
  if (from >= l.tokens.size()) {
    err(p, l.tokens.back(), "which lamps? none follow the `:`", "name them: string-light-*, every light-neon, light-bulb-1 to light-bulb-4");
    return false;
  }
  std::vector<std::string> ids, kinds;
  for (const LampInfo& m : lamps_) {
    ids.push_back(m.id);
    if (std::find(kinds.begin(), kinds.end(), m.kind) == kinds.end()) kinds.push_back(m.kind);
  }
  bool ok = true;
  // `... except ...`: the lamps after it are left out.
  const size_t except = findWord(l, "except", from);
  std::vector<int> leaveOut;
  bool leaving = false;
  auto take = [&](int i) {
    std::vector<int>& into = leaving ? leaveOut : light.lamps;
    if (std::find(into.begin(), into.end(), i) == into.end()) into.push_back(i);
  };
  size_t at = from;
  while (at < l.tokens.size()) {
    if (at == except) {
      leaving = true;
      if (++at >= l.tokens.size()) {
        err(p, l.tokens[except], "except which lamps?", "string-light-* except string-light-4-*");
        return false;
      }
      continue;
    }
    size_t end = std::min(findSymbol(l, ",", at), at < except ? except : l.tokens.size());
    const size_t n = end - at;
    const Token& a = l.tokens[at];
    if (n == 0) {
      err(p, a, "two commas with nothing between", "remove one");
      ok = false;
    } else if (n == 2 && a.is("every") && l.tokens[at + 1].kind == Tok::kWord) {
      const Token& kind = l.tokens[at + 1];
      bool any = false;
      for (size_t i = 0; i < lamps_.size(); ++i)
        if (lamps_[i].kind == kind.text) take(static_cast<int>(i)), any = true;
      if (!any) {
        err(p, kind, "no lamp here is a `" + kind.text + "`", didYouMean(kind.text, kinds));
        ok = false;
      }
    } else if (n == 3 && l.tokens[at + 1].is("to") && a.kind == Tok::kWord && l.tokens[at + 2].kind == Tok::kWord) {
      const Token& b = l.tokens[at + 2];
      std::string ha, hb;
      int na = 0, nb = 0;
      if (!splitNumber(a.text, ha, na) || !splitNumber(b.text, hb, nb) || ha != hb || nb < na) {
        err(p, a, "`" + a.text + " to " + b.text + "` isn't a run of numbered lamps", "both names alike but their numbers: light-bulb-1 to light-bulb-4");
        ok = false;
      } else {
        for (int k = na; k <= nb; ++k) {
          const std::string id = ha + std::to_string(k);
          const auto it = std::find(ids.begin(), ids.end(), id);
          if (it == ids.end()) {
            err(p, a, "`" + id + "` (in " + a.text + " to " + b.text + ") isn't a lamp here", "shorten the run or name the lamps one by one");
            ok = false;
          } else {
            take(static_cast<int>(it - ids.begin()));
          }
        }
      }
    } else if (n == 1 && a.kind == Tok::kWord) {
      bool any = false;
      for (size_t i = 0; i < lamps_.size(); ++i)
        if (glob(a.text, lamps_[i].id)) take(static_cast<int>(i)), any = true;
      if (!any) {
        std::string hint = didYouMean(a.text, ids);
        if (std::find(kinds.begin(), kinds.end(), a.text) != kinds.end())
          hint = "`" + a.text + "` is a kind: write `every " + a.text + "`";
        err(p, a, "no lamp here is called `" + a.text + "`", hint);
        ok = false;
      }
    } else {
      err(p, a, "`" + words(l, at, end) + "` doesn't name lamps",
          "a lamp's name (a * matches any ending), `every <kind>`, `<first> to <last>`, then maybe `except` and more");
      ok = false;
    }
    at = end < l.tokens.size() && l.tokens[end].is(",") ? end + 1 : end;
  }
  for (int i : leaveOut) light.lamps.erase(std::remove(light.lamps.begin(), light.lamps.end(), i), light.lamps.end());
  if (ok && light.lamps.empty()) {
    err(p, l.tokens[from], "`" + light.name + "` ends up with no lamps", "check what `except` leaves out");
    return false;
  }
  return ok;
}

bool Rig::readSetting(const Line& c, Light& light, State* state, Problems& p) {
  const Token& w = c.tokens[0];
  if (!c.children.empty()) err(p, c.children[0].tokens[0], "nothing goes under a `" + w.text + "` line", "line it up with the line above");
  if (w.is("brightness")) {
    Bright& b = state ? state->bright : light.bright;
    if (b.expr >= 0) {
      err(p, w, "brightness is given twice here", "keep one");
      return false;
    }
    size_t from = 1;
    if (from < c.tokens.size() && c.tokens[from].is("each")) b.each = true, ++from;
    b.expr = program_.compile(c.tokens, from, c.tokens.size(), p);
    return b.expr >= 0;
  }
  if (w.is("colour") || w.is("color")) {
    Vec3 tint;
    if (!readColour(c, 1, c.tokens.size(), light, tint, p)) return false;
    (state ? state->tint : light.tint) = tint;
    (state ? state->hasTint : light.hasTint) = true;
    return true;
  }
  if (w.is("tint")) {
    if (c.tokens.size() != 4 || c.tokens[1].kind != Tok::kNumber || c.tokens[2].kind != Tok::kNumber || c.tokens[3].kind != Tok::kNumber) {
      err(p, w, "a tint is three numbers: red, green, blue", "tint 1 0.9 0.8 (1 = unchanged)");
      return false;
    }
    const Vec3 t{static_cast<float>(c.tokens[1].number), static_cast<float>(c.tokens[2].number), static_cast<float>(c.tokens[3].number)};
    (state ? state->tint : light.tint) = t;
    (state ? state->hasTint : light.hasTint) = true;
    return true;
  }
  if (w.is("when")) return readWhen(c, state ? state->whens : light.whens, p);
  std::string hint = didYouMean(w.text, kSettings);
  if (hint.empty()) hint = "a light holds brightness, colour, tint, state and when lines";
  err(p, w, "`" + w.text + "` isn't a setting of a light", hint);
  return false;
}

bool Rig::readColour(const Line& c, size_t from, size_t to, const Light& light, Vec3& tint, Problems& p) {
  const Token& at = c.tokens[from - 1];
  if (to - from != 2 || c.tokens[from].kind != Tok::kNumber || !c.tokens[from + 1].is("K")) {
    err(p, at, "a colour is a temperature in Kelvin", "colour 2700 K (warm) … 6500 K (daylight)");
    return false;
  }
  const double k = c.tokens[from].number;
  if (k < 1000 || k > 15000) {
    err(p, c.tokens[from], "`" + c.tokens[from].text + " K` is outside what lamps glow at", "between 1000 K (a candle's red) and 15000 K (blue sky)");
    return false;
  }
  if (light.kelvin <= 0) {
    err(p, at, light.kelvin < 0 ? "`" + light.name + "`'s lamps aren't all one colour temperature, so `colour` can't shift them alike"
                                : "`" + light.name + "`'s lamps are coloured lights without a temperature",
        "use `tint` (three numbers) instead");
    return false;
  }
  const Vec3 to3 = light::kelvinColor(static_cast<float>(k)), from3 = light::kelvinColor(light.kelvin);
  tint = {to3.x / std::max(from3.x, 1e-4f), to3.y / std::max(from3.y, 1e-4f), to3.z / std::max(from3.z, 1e-4f)};
  return true;
}

bool Rig::readWhen(const Line& c, std::vector<When>& out, Problems& p) {
  const size_t colon = findSymbol(c, ":");
  if (colon >= c.tokens.size()) {
    err(p, c.tokens[0], "a `when` needs `:` before what happens", "when music: go to dancing");
    return false;
  }
  When w;
  w.event = words(c, 1, colon, "-");
  if (w.event.empty()) {
    err(p, c.tokens[colon], "when what? no event before the `:`", "when music: …");
    return false;
  }
  if (std::find(events_.begin(), events_.end(), w.event) == events_.end()) {
    std::vector<std::string> spoken;
    for (std::string e : events_) {
      std::replace(e.begin(), e.end(), '-', ' ');
      spoken.push_back(e);
    }
    std::string said = w.event;
    std::replace(said.begin(), said.end(), '-', ' ');
    std::string hint = didYouMean(said, spoken);
    if (hint.empty()) {
      hint = "it can be:";
      for (const std::string& e : spoken) hint += " `" + e + "`";
    }
    err(p, c.tokens[1], "`" + said + "` isn't something that happens here", hint);
    return false;
  }
  size_t at = colon + 1;
  if (at >= c.tokens.size()) {
    err(p, c.tokens[colon], "what happens? nothing follows the `:`", "go to <state>, or fade to 25% over 1 s");
    return false;
  }
  const Token& verb = c.tokens[at];
  w.action.line = verb.line;
  w.action.column = verb.column;
  if ((verb.is("go") || verb.is("fade")) && (at + 1 >= c.tokens.size() || !c.tokens[at + 1].is("to"))) {
    err(p, verb, "`" + verb.text + "` needs `to` after it", verb.is("go") ? "go to dancing" : "fade to 25% over 1 s");
    return false;
  }
  const size_t over = findWord(c, "over", at + 2);
  if (over < c.tokens.size()) {
    Expr e;
    if (!parseExpr(c.tokens, over + 1, c.tokens.size(), e, p)) return false;
    if (e.kind != Expr::kNumber || e.unit != "s") {
      err(p, c.tokens[over], "`over` needs a time in seconds", "over 1 s");
      return false;
    }
    w.action.over = std::max(0.0, e.value);
  }
  if (verb.is("go")) {
    w.action.go = true;
    w.action.stateName = words(c, at + 2, over);
    if (w.action.stateName.empty()) {
      err(p, verb, "go to which state?", "go to calm");
      return false;
    }
  } else if (verb.is("fade")) {
    w.action.go = false;
    if (over >= c.tokens.size()) {
      err(p, verb, "`fade` needs how long it takes", "fade to 25% over 1 s");
      return false;
    }
    w.action.target = program_.compile(c.tokens, at + 2, over, p);
    if (w.action.target < 0) return false;
  } else {
    std::string hint = didYouMean(verb.text, {"go", "fade"});
    err(p, verb, "`" + verb.text + "` isn't something a light does", hint.empty() ? "go to <state>, or fade to 25% over 1 s" : hint);
    return false;
  }
  out.push_back(std::move(w));
  return true;
}

void Rig::readMood(const Line& l, Problems& p) {
  Mood m;
  m.name = words(l, 1, l.tokens.size());
  if (m.name.empty()) {
    err(p, l.tokens[0], "this mood has no name", "mood party");
    return;
  }
  for (const Mood& o : moods_)
    if (o.name == m.name) {
      err(p, l.tokens[1], "there's already a mood `" + m.name + "`", "give this one another name");
      return;
    }
  std::vector<std::string> names;
  for (const Light& L : lights_) names.push_back(L.name);
  for (const Line& c : l.children) {
    // "<light> brightness 130%, colour 6500 K"
    size_t at = 0;
    while (at < c.tokens.size() && !c.tokens[at].is("brightness") && !c.tokens[at].is("colour") &&
           !c.tokens[at].is("color") && !c.tokens[at].is("tint"))
      ++at;
    const std::string light = words(c, 0, at);
    const auto it = std::find(names.begin(), names.end(), light);
    if (light.empty() || it == names.end()) {
      err(p, c.tokens[0], light.empty() ? "which light? a mood line starts with a light's name" : "`" + light + "` isn't a light (lights are named above their moods)",
          light.empty() ? "strings brightness 130%" : didYouMean(light, names));
      continue;
    }
    if (at >= c.tokens.size()) {
      err(p, c.tokens.back(), "what changes for `" + light + "`?", light + " brightness 130%, colour 6500 K");
      continue;
    }
    MoodSet s;
    s.light = static_cast<int>(it - names.begin());
    while (at < c.tokens.size()) {
      const size_t end = findSymbol(c, ",", at);
      const Token& w = c.tokens[at];
      if (w.is("brightness")) {
        s.expr = program_.compile(c.tokens, at + 1, end, p);
      } else if (w.is("colour") || w.is("color")) {
        s.hasTint = readColour(c, at + 1, end, lights_[static_cast<size_t>(s.light)], s.tint, p);
      } else if (w.is("tint") && end - at == 4) {
        s.hasTint = true;
        s.tint = {static_cast<float>(c.tokens[at + 1].number), static_cast<float>(c.tokens[at + 2].number), static_cast<float>(c.tokens[at + 3].number)};
      } else {
        err(p, w, "`" + w.text + "` isn't something a mood changes", "brightness 130%, colour 6500 K or tint 1 0.9 0.8");
      }
      at = end + 1;
    }
    m.sets.push_back(s);
  }
  moods_.push_back(std::move(m));
}

// shape <name> (<setting> <default>, ...): <expression>, or the expression
// on the one line under it.
// ---- Running ----

void Rig::send(std::string_view event, double seconds) {
  world::Clock c;
  c.seconds = seconds;
  for (Light& L : lights_) {
    auto act = [&](const When& w) {
      if (w.event != event) return false;
      if (w.action.go) {
        if (w.action.state == L.state) return true;
        L.prev = L.state;
        L.prevStart = L.start;
        L.state = w.action.state;
        L.start = seconds;
        L.blend = w.action.over;
      } else {
        L.dimFrom = dimmer(L, seconds);
        L.dimTo = std::max(0.0, program_.eval(w.action.target, {&c, L.seed, false}));
        L.dimStart = seconds;
        L.dimOver = w.action.over;
      }
      return true;
    };
    bool done = false;
    if (L.state >= 0 && L.state < static_cast<int>(L.states.size()))
      for (const When& w : L.states[static_cast<size_t>(L.state)].whens) done = act(w) || done;
    if (!done)
      for (const When& w : L.whens) act(w);
  }
}

bool Rig::setMood(std::string_view mood, double seconds, double over) {
  int next = -1;
  for (size_t i = 0; i < moods_.size(); ++i)
    if (moods_[i].name == mood) next = static_cast<int>(i);
  if (next < 0 && !mood.empty()) return false;
  if (next == mood_) return true;
  moodFrom_ = mood_;
  mood_ = next;
  moodStart_ = seconds;
  moodOver_ = over;
  return true;
}

double Rig::brightness(const Light& L, int state, const world::Clock& clock, uint32_t seed, bool apart) {
  const Bright* b = &L.bright;
  if (state >= 0 && state < static_cast<int>(L.states.size()) && L.states[static_cast<size_t>(state)].bright.expr >= 0)
    b = &L.states[static_cast<size_t>(state)].bright;
  if (b->expr < 0) return 1;
  return program_.eval(b->expr, {&clock, b->each && apart ? seed : L.seed, b->each && apart});
}

double Rig::dimmer(const Light& L, double now) const {
  if (L.dimOver <= 0) return now >= L.dimStart ? L.dimTo : L.dimFrom;
  const double w = std::clamp((now - L.dimStart) / L.dimOver, 0.0, 1.0);
  return L.dimFrom + (L.dimTo - L.dimFrom) * smoothstep(0, 1, static_cast<float>(w));
}

void Rig::update(const world::Clock& clock) {
  program_.newUpdate();
  now_ = clock.seconds;
  std::vector<Vec3> lightValues;
  const float mw = moodOver_ > 0 ? smoothstep(0, 1, static_cast<float>(std::clamp((now_ - moodStart_) / moodOver_, 0.0, 1.0))) : 1.0f;
  for (size_t k = 0; k < lights_.size(); ++k) {
    Light& L = lights_[k];
    // The mood's part for this light, eased from the mood before.
    auto moodPart = [&](int mood, double& bright, Vec3& tint) {
      bright = 1;
      tint = {1, 1, 1};
      if (mood < 0) return;
      for (const MoodSet& s : moods_[static_cast<size_t>(mood)].sets) {
        if (s.light != static_cast<int>(k)) continue;
        if (s.expr >= 0) {
          bright = program_.eval(s.expr, {&clock, L.seed, false});
        }
        if (s.hasTint) tint = s.tint;
      }
    };
    double b0, b1;
    Vec3 t0, t1;
    moodPart(moodFrom_, b0, t0);
    moodPart(mood_, b1, t1);
    const double moodBright = b0 + (b1 - b0) * mw;
    const Vec3 moodTint = lerp(t0, t1, mw);
    const State* st = L.state >= 0 && L.state < static_cast<int>(L.states.size()) ? &L.states[static_cast<size_t>(L.state)] : nullptr;
    const Vec3 tint = mulComponents(st && st->hasTint ? st->tint : L.tint, moodTint);
    const double dim = dimmer(L, now_);
    double w = 1;
    if (L.prev >= 0) {
      w = L.blend > 0 ? (now_ - L.start) / L.blend : 1;
      if (w >= 1 || w < 0) L.prev = -1, w = 1;
    }
    auto value = [&](uint32_t seed, bool apart) {
      double v = brightness(L, L.state, clock, seed, apart);
      if (L.prev >= 0) {
        const double before = brightness(L, L.prev, clock, seed, apart);
        v = before + (v - before) * smoothstep(0, 1, static_cast<float>(w));
      }
      return std::max(0.0, v * dim * moodBright);
    };
    const bool each = (st && st->bright.expr >= 0 ? st->bright.each : L.bright.each) ||
                      (L.prev >= 0 && L.states[static_cast<size_t>(L.prev)].bright.each);
    Vec3 sum;
    double weight = 0;
    const double shared = each ? 0 : value(L.seed, false);
    lightValues.clear();
    for (int i : L.lamps) {
      const double v = each ? value(lamps_[static_cast<size_t>(i)].seed, true) : shared;
      lightValues.push_back(tint * static_cast<float>(v));
      const double lm = std::max(1.0f, lamps_[static_cast<size_t>(i)].lumens);
      sum += lightValues.back() * static_cast<float>(lm);
      weight += lm;
    }
    // Out of steps: this light and the rest keep last update's values.
    if (program_.overBudget()) break;
    for (size_t j = 0; j < L.lamps.size(); ++j) lampValue_[static_cast<size_t>(L.lamps[j])] = lightValues[j];
    channelValue_[k] = weight > 0 ? sum * static_cast<float>(1.0 / weight) : Vec3{1, 1, 1};
  }
}

Vec3 Rig::lamp(int i) const {
  return i >= 0 && i < static_cast<int>(lampValue_.size()) ? lampValue_[static_cast<size_t>(i)] : Vec3{1, 1, 1};
}

std::string Rig::stateOf(std::string_view light) const {
  for (const Light& L : lights_)
    if (L.name == light) return L.state >= 0 && L.state < static_cast<int>(L.states.size()) ? L.states[static_cast<size_t>(L.state)].name : "";
  return "";
}

}  // namespace engine::words
