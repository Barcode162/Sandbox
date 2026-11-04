#include "looped/words/words.h"

#include <algorithm>
#include <cmath>
#include <cstdlib>

#include "looped/light_units.h"
#include "looped/world/loop.h"

namespace engine::words {

const char* kindName(Kind k) {
  switch (k) {
    case Kind::kThing: return "a thing";
    case Kind::kDescribe: return "a describing word";
    case Kind::kDoing: return "a doing";
    case Kind::kAmount: return "an amount";
    case Kind::kPlace: return "a place word";
  }
  return "a word";
}

Vec3 LightSpec::tint() const { return rgb ? light::unitLuminance(colour) : light::kelvinColor(kelvin); }

namespace {

bool isNumberWord(const std::string& w, int* n) {
  static const char* names[] = {"zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"};
  for (int i = 0; i < 13; ++i)
    if (w == names[i]) {
      *n = i;
      return true;
    }
  return false;
}

bool article(const Token& t) { return t.is("a") || t.is("an") || t.is("the") || t.is("one"); }

// Metres from a number and the unit word after it (cm, m, mm; none = m).
double metres(double v, const std::string& unit) {
  if (unit == "cm") return v / 100;
  if (unit == "mm") return v / 1000;
  return v;
}
bool lengthUnit(const Token& t) { return t.is("m") || t.is("cm") || t.is("mm"); }

std::string number(double v) {
  char buf[32];
  std::snprintf(buf, sizeof buf, "%g", v);
  return buf;
}

std::string valueText(const Value& v) {
  if (v.unit.empty()) return number(v.v);
  if (v.unit == "%") return number(v.v * 100) + "%";
  return number(v.v) + " " + v.unit;
}

// Automatic forms of a doing: flicker → flickers, flickering; wave → waves, waving.
std::vector<std::string> doingForms(const std::string& base) {
  std::string s = base, ing = base;
  if (!base.empty() && std::string("sxz").find(base.back()) != std::string::npos) s += "es";
  else if (base.size() > 1 && (base.substr(base.size() - 2) == "sh" || base.substr(base.size() - 2) == "ch")) s += "es";
  else s += "s";
  if (!ing.empty() && ing.back() == 'e' && ing.size() > 2) ing.pop_back();
  ing += "ing";
  return {s, ing};
}

// More than one: bulb → bulbs, glass → glasses, pendant lamp → pendant lamps.
std::string plural(const std::string& name) {
  if (name.empty()) return name;
  const char last = name.back();
  const std::string end2 = name.size() > 1 ? name.substr(name.size() - 2) : "";
  if (last == 's' || last == 'x' || last == 'z' || end2 == "sh" || end2 == "ch") return name + "es";
  if (last == 'y' && name.size() > 1 && std::string("aeiou").find(name[name.size() - 2]) == std::string::npos)
    return name.substr(0, name.size() - 1) + "ies";
  return name + "s";
}

}  // namespace

// ---- The dictionary ----

bool Dictionary::read(std::string_view text, const std::string& file, Problems& p) {
  const size_t before = p.size();
  for (const Line& l : readLines(text, p)) {
    const Token& first = l.tokens[0];
    if (!first.is("word")) {
      problem(p, first, "a dictionary holds words: each starts with `word`", "word candle: a thing");
      continue;
    }
    Word w;
    w.file = file;
    w.line = l.line;
    size_t i = 1;
    while (i < l.tokens.size() && l.tokens[i].kind == Tok::kWord) w.name += (w.name.empty() ? "" : " ") + l.tokens[i++].text;
    if (w.name.empty()) {
      problem(p, first, "this word has no name", "word candle: a thing");
      continue;
    }
    if (i < l.tokens.size() && l.tokens[i].is("(")) {
      const size_t close = findSymbol(l, ")", i);
      if (close >= l.tokens.size()) {
        problem(p, l.tokens[i], "the brackets with its other forms aren't closed", "word flicker (flickers, flickering): a doing");
        continue;
      }
      std::string form;
      for (size_t k = i + 1; k <= close; ++k) {
        if (l.tokens[k].is(",") || k == close) {
          if (!form.empty()) w.forms.push_back(form);
          form.clear();
        } else {
          form += (form.empty() ? "" : " ") + l.tokens[k].text;
        }
      }
      i = close + 1;
    }
    if (i >= l.tokens.size() || !l.tokens[i].is(":")) {
      problem(p, l.tokens[std::min(i, l.tokens.size() - 1)], "a word's name is followed by `:` and what kind of word it is",
              "word warm: describes a light");
      continue;
    }
    const std::string kind = joinWords(l, i + 1, l.tokens.size());
    const Token& kt = l.tokens[std::min(i + 1, l.tokens.size() - 1)];
    if (kind == "a thing" || kind.rfind("a thing, a kind of ", 0) == 0) {
      w.kind = Kind::kThing;
      if (kind.size() > 7) w.parent = kind.substr(std::string("a thing, a kind of ").size());
    } else if (kind.rfind("describes ", 0) == 0) {
      w.kind = Kind::kDescribe;
      const std::string what = kind.substr(10);
      if (what == "a light") w.describes = "light";
      else if (what == "a doing") w.describes = "doing";
      else {
        problem(p, kt, "`" + w.name + "` describes " + what + ": a describing word describes a light or a doing", "word warm: describes a light");
        continue;
      }
    } else if (kind == "a doing") {
      w.kind = Kind::kDoing;
    } else if (kind == "an amount") {
      w.kind = Kind::kAmount;
    } else if (kind == "a place word") {
      w.kind = Kind::kPlace;
    } else {
      problem(p, kt, "`" + kind + "` isn't a kind of word",
              "a thing; a thing, a kind of <thing>; describes a light; describes a doing; a doing; an amount; a place word");
      continue;
    }
    if (w.kind == Kind::kDoing && w.forms.empty()) w.forms = doingForms(w.name);
    if (w.kind == Kind::kThing && w.forms.empty()) w.forms = {plural(w.name)};
    for (const Line& c : l.children) {
      if (c.tokens[0].is("like") && c.tokens.size() > 1 && c.tokens[1].is(":")) {
        std::string one;
        for (size_t k = 2; k <= c.tokens.size(); ++k) {
          if (k == c.tokens.size() || c.tokens[k].is(",")) {
            if (!one.empty()) w.like.push_back(one);
            one.clear();
          } else {
            one += (one.empty() ? "" : " ") + c.tokens[k].text;
          }
        }
        continue;
      }
      w.lines.push_back(c);
    }
    bool clash = false;
    for (const std::string& s : [&] { std::vector<std::string> v{w.name}; v.insert(v.end(), w.forms.begin(), w.forms.end()); return v; }()) {
      const auto it = index_.find(s);
      if (it != index_.end()) {
        const Word& o = words_[it->second];
        problem(p, first, "`" + s + "` is already a word (" + o.file + " line " + std::to_string(o.line) + ")", "give this one another name");
        clash = true;
      }
    }
    if (clash) continue;
    words_.push_back(std::move(w));
    const Word& made = words_.back();
    index_[made.name] = words_.size() - 1;
    for (const std::string& f : made.forms) index_[f] = words_.size() - 1;
  }
  return p.size() == before;
}

const Word* Dictionary::find(std::string_view s) const {
  const auto it = index_.find(std::string(s));
  return it == index_.end() ? nullptr : &words_[it->second];
}

const Word* Dictionary::match(const std::vector<Token>& t, size_t i, size_t end, size_t* used, std::string* form) const {
  const Word* best = nullptr;
  std::string name;
  for (size_t k = i; k < end && k < i + 5 && t[k].kind == Tok::kWord; ++k) {
    name += (k == i ? "" : " ") + t[k].text;
    const auto it = index_.find(name);
    if (it != index_.end()) {
      best = &words_[it->second];
      *used = k - i + 1;
      if (form) *form = name;
    }
  }
  return best;
}

std::vector<std::string> Dictionary::spellings() const {
  std::vector<std::string> v;
  for (const auto& [s, i] : index_) v.push_back(s);
  return v;
}

std::vector<std::string> Dictionary::likeOf(std::string_view w) const {
  std::vector<std::string> v;
  for (const Word& word : words_)
    for (const std::string& l : word.like)
      if (l == w) v.push_back(word.name);
  return v;
}

// ---- Words: making things from their meaning ----

void Words::unknown(const Token& at, Problems& p) const {
  const std::vector<std::string> like = dict_.likeOf(at.text);
  std::string hint;
  if (!like.empty()) {
    hint = "words like it: ";
    for (size_t i = 0; i < like.size() && i < 4; ++i) hint += (i ? ", " : "") + like[i];
  } else {
    hint = didYouMean(at.text, dict_.spellings());
  }
  problem(p, at, "`" + at.text + "` isn't a word yet", hint.empty() ? "add it to the dictionary (assets/words/)" : hint);
}

bool Words::load(std::string_view text, const std::string& file, Problems& p) {
  const size_t first = dict_.all().size();
  const size_t before = p.size();
  dict_.read(text, file, p);
  // Check every new word by using it once.
  for (size_t i = first; i < dict_.all().size(); ++i) {
    const Word& w = dict_.all()[i];
    Token at;
    at.line = w.line;
    at.column = 1;
    at.text = w.name;
    std::vector<std::string> making;
    if (w.kind == Kind::kThing) {
      Thing t;
      make(w, t, p, making, at);
    } else if (w.kind == Kind::kDescribe) {
      Thing t;
      t.word = "light";
      t.hasLight = true;
      if (w.describes == "doing") {
        Doing g;
        g.word = "a doing";
        for (const char* s : {"amount", "every", "speed", "fade"}) g.settings.push_back({s, {1, s == std::string("every") ? "s" : ""}});
        describeDoing(w, 1, g, p, at);
      } else {
        describe(w, 1, t, p, at);
      }
    } else if (w.kind == Kind::kDoing) {
      Doing g;
      compile(w, g, p);
    } else if (w.kind == Kind::kAmount) {
      const bool ok = w.lines.size() == 1 && w.lines[0].tokens.size() == 2 && w.lines[0].tokens[0].is("times") &&
                      w.lines[0].tokens[1].kind == Tok::kNumber;
      if (!ok) problem(p, at, "an amount's meaning is one line: `times <number>`", "word very: an amount, then   times 2");
    }
  }
  return p.size() == before;
}

bool Words::make(const Word& w, Thing& out, Problems& p, std::vector<std::string>& making, const Token& at) {
  if (std::find(making.begin(), making.end(), w.name) != making.end()) {
    std::string chain;
    for (const std::string& m : making) chain += m + " → ";
    problem(p, at, "`" + w.name + "` is made of itself (" + chain + w.name + ")", "a thing can't hold itself, even through another");
    return false;
  }
  if (making.size() > 12) {
    problem(p, at, "things inside things go too deep here", "use fewer layers");
    return false;
  }
  making.push_back(w.name);
  bool ok = true;
  if (!w.parent.empty()) {
    const Word* parent = dict_.find(w.parent);
    if (!parent || parent->kind != Kind::kThing) {
      Token pt = at;
      pt.text = w.parent;
      if (!parent) unknown(pt, p);
      else problem(p, at, "`" + w.parent + "` is " + kindName(parent->kind) + ", not a thing", "a thing, a kind of <a thing word>");
      ok = false;
    } else {
      // What it gets from the word it's a kind of comes first, marked so.
      const size_t before = out.trail.size();
      ok = make(*parent, out, p, making, at);
      for (size_t k = before; k < out.trail.size(); ++k) out.trail[k] = "from " + w.parent + ": " + out.trail[k];
      out.trail.insert(out.trail.begin() + static_cast<long>(before), "a kind of " + w.parent);
    }
  }
  out.word = w.name;
  for (const Line& l : w.lines) ok = makeLine(w, l, out, p, making) && ok;
  making.pop_back();
  return ok;
}

bool Words::makeLine(const Word& w, const Line& l, Thing& out, Problems& p, std::vector<std::string>& making) {
  const std::vector<Token>& t = l.tokens;
  const auto is = [&](size_t i, const char* s) { return i < t.size() && t[i].is(s); };
  if (is(0, "made") && is(1, "of")) {
    if (is(2, "the") && is(3, "model") && t.size() == 5 && t[4].kind == Tok::kWord) {
      out.model = t[4].text;
      out.trail.push_back("made of the model " + out.model);
      return true;
    }
    if (is(2, "a") && is(3, "box")) {
      // a box W by D by H [unit]
      double v[3] = {0, 0, 0};
      size_t k = 4;
      int n = 0;
      std::string unit = "m";
      while (k < t.size() && n < 3) {
        if (t[k].kind != Tok::kNumber) break;
        v[n++] = t[k++].number;
        if (k < t.size() && lengthUnit(t[k])) unit = t[k++].text;
        if (k < t.size() && t[k].is("by")) ++k;
      }
      if (n != 3 || k != t.size()) {
        problem(p, t[0], "a box is three sizes: wide by deep by high", "made of a box 100 by 3 by 30 cm");
        return false;
      }
      out.box = {static_cast<float>(metres(v[0], unit)), static_cast<float>(metres(v[2], unit)), static_cast<float>(metres(v[1], unit))};
      out.trail.push_back("made of a box " + number(v[0]) + " by " + number(v[1]) + " by " + number(v[2]) + " " + unit);
      return true;
    }
    problem(p, t[0], "made of what?", "made of the model candle.glb, or made of a box 100 by 3 by 30 cm");
    return false;
  }
  if (is(0, "glows")) {
    // The glow's colour, from colour words (applied as to a white light).
    Thing g;
    g.hasLight = true;
    g.light.kelvin = 4000;
    std::vector<std::pair<const Word*, double>> how;
    for (size_t k = 1; k < t.size();) {
      size_t used = 0;
      const Word* d = dict_.match(t, k, t.size(), &used, nullptr);
      if (!d || d->kind != Kind::kDescribe || d->describes != "light") {
        if (!d) unknown(t[k], p);
        else problem(p, t[k], "`" + t[k].text + "` isn't a colour word", "glows warm white, glows pink");
        return false;
      }
      how.push_back({d, 1.0});
      k += used;
    }
    // Words that set a colour first, then those that shift it ("warm white").
    std::stable_sort(how.begin(), how.end(), [](const auto& a, const auto& b) {
      auto sets = [](const Word* d) { return !d->lines.empty() && d->lines[0].tokens.size() > 1 && d->lines[0].tokens[1].kind == Tok::kNumber; };
      return sets(a.first) && !sets(b.first);
    });
    for (auto& [d, s] : how) describe(*d, s, g, p, t[0]);
    out.glows = true;
    out.glow = g.light.tint();
    out.trail.push_back("glows " + joinWords(l, 1, t.size()));
    return true;
  }
  if (is(0, "gives") && is(1, "light") && is(2, ":")) {
    out.hasLight = true;
    if (!readLight(l, 3, out.light, p)) return false;
    out.trail.push_back("gives light: " + joinWords(l, 3, t.size()));
    return true;
  }
  if (is(0, "has")) {
    Thing part;
    if (!readThing(l, 1, t.size(), part, p, making)) return false;
    out.trail.push_back("has " + joinWords(l, 1, t.size()));
    out.parts.push_back(std::move(part));
    return true;
  }
  // Anything else: words that describe it or what it does ("flickering").
  Thing& self = out;
  size_t i = 0;
  std::vector<std::pair<const Word*, double>> how;
  double strength = 1;
  const Word* lastDoing = nullptr;
  while (i < t.size()) {
    if (t[i].is(",") || t[i].is("and")) {
      ++i;
      continue;
    }
    size_t used = 0;
    const Word* d = dict_.match(t, i, t.size(), &used, nullptr);
    if (!d) {
      unknown(t[i], p);
      return false;
    }
    if (d->kind == Kind::kAmount) {
      strength *= std::atof(d->lines[0].tokens[1].text.c_str());
    } else if (d->kind == Kind::kDescribe && d->describes == "light") {
      if (!describe(*d, strength, self, p, t[i])) return false;
      strength = 1;
    } else if (d->kind == Kind::kDoing) {
      if (!doing(*d, self, {}, p, t[i])) return false;
      lastDoing = d;
    } else if (d->kind == Kind::kDescribe && d->describes == "doing" && lastDoing) {
      if (!doing(*lastDoing, self, {{d, strength}}, p, t[i])) return false;
      strength = 1;
    } else {
      problem(p, t[i], "`" + t[i].text + "` (" + kindName(d->kind) + ") can't be a line of `" + w.name + "`",
              "a thing's lines: made of …, glows …, gives light: …, has …, or words for how it looks and what it does");
      return false;
    }
    i += used;
  }
  return true;
}

bool Words::readLight(const Line& l, size_t from, LightSpec& s, Problems& p) {
  const std::vector<Token>& t = l.tokens;
  size_t i = from;
  while (i < t.size()) {
    const size_t end = findSymbol(l, ",", i);
    const size_t n = end - i;
    const auto is = [&](size_t k, const char* w) { return i + k < end && t[i + k].is(w); };
    const auto num = [&](size_t k) { return i + k < end && t[i + k].kind == Tok::kNumber; };
    if (n == 2 && num(0) && is(1, "lumens")) {
      s.lumens = static_cast<float>(t[i].number);
    } else if (n == 2 && num(0) && is(1, "K")) {
      s.kelvin = static_cast<float>(t[i].number);
      s.rgb = false;
    } else if (n == 4 && is(0, "colour") && num(1) && num(2) && num(3)) {
      s.rgb = true;
      s.colour = {static_cast<float>(t[i + 1].number), static_cast<float>(t[i + 2].number), static_cast<float>(t[i + 3].number)};
    } else if (is(0, "a") && is(1, "ball") && num(2) && (n == 5 || n == 4)) {
      s.shape = 0;
      s.a = static_cast<float>(metres(t[i + 2].number, n == 5 ? t[i + 3].text : "m"));
    } else if (is(0, "a") && is(1, "tube") && num(2)) {
      s.shape = 1;
      s.a = static_cast<float>(metres(t[i + 2].number, i + 3 < end && lengthUnit(t[i + 3]) ? t[i + 3].text : "m"));
    } else if (is(0, "a") && is(1, "panel") && num(2) && is(3, "by") && num(4)) {
      s.shape = 2;
      const std::string unit = i + 5 < end && lengthUnit(t[i + 5]) ? t[i + 5].text : "m";
      s.a = static_cast<float>(metres(t[i + 2].number, unit));
      s.b = static_cast<float>(metres(t[i + 4].number, unit));
    } else if (n == 3 && is(0, "from") && is(1, "one") && is(2, "side")) {
      s.oneSided = true;
    } else {
      problem(p, t[std::min(i, t.size() - 1)], "`" + joinWords(l, i, end) + "` isn't something a light has",
              "200 lumens; 2700 K; colour 1 0.5 0.2; a ball 6 cm across; a tube 1 m long; a panel 1 by 0.3 m; from one side");
      return false;
    }
    i = end + 1;
  }
  return true;
}

namespace {

// The lights a describing or doing word acts on: the thing's own, or, when
// it gives none, its parts' ("a warm candle" warms its flame).
void lightsOf(Thing& t, std::vector<Thing*>& out) {
  if (t.hasLight) {
    out.push_back(&t);
    return;
  }
  for (Thing& part : t.parts) lightsOf(part, out);
}

}  // namespace

bool Words::describe(const Word& d, double strength, Thing& t, Problems& p, const Token& at) {
  if (d.describes == "doing") {
    problem(p, at, "`" + at.text + "` describes a doing; what does it describe here?", "a candle that flickers " + at.text);
    return false;
  }
  std::vector<Thing*> holders;
  lightsOf(t, holders);
  if (holders.empty()) {
    problem(p, at, "`" + at.text + "` describes a light, and a " + t.word + " gives none", "try it on something that gives light: a candle, a bulb, a sign");
    return false;
  }
  for (const Line& l : d.lines) {
    const std::vector<Token>& k = l.tokens;
    const std::string what = k[0].text;
    const auto num = [&](size_t i) { return i < k.size() && k[i].kind == Tok::kNumber; };
    for (Thing* h : holders) {
      LightSpec& s = h->light;
      const auto colourText = [&] { return s.rgb ? number(s.colour.x) + " " + number(s.colour.y) + " " + number(s.colour.z) : number(s.kelvin) + " K"; };
      const std::string before = colourText();
      if (what == "colour") {
        if (k.size() == 3 && num(1) && k[2].is("K")) {
          s.kelvin = static_cast<float>(k[1].number), s.rgb = false;
        } else if (k.size() == 4 && num(1) && num(2) && num(3)) {
          s.rgb = true, s.colour = {static_cast<float>(k[1].number), static_cast<float>(k[2].number), static_cast<float>(k[3].number)};
        } else if (k.size() == 4 && (k[1].is("up") || k[1].is("down")) && num(2) && k[3].is("K")) {
          const float by = static_cast<float>(k[2].number * strength) * (k[1].is("up") ? 1.0f : -1.0f);
          if (s.rgb) {
            // A coloured light shifts as daylight would.
            const Vec3 a = light::kelvinColor(6500), b = light::kelvinColor(std::clamp(6500.0f + by, 1000.0f, 15000.0f));
            s.colour = {s.colour.x * b.x / a.x, s.colour.y * b.y / a.y, s.colour.z * b.z / a.z};
          } else {
            s.kelvin = std::clamp(s.kelvin + by, 1000.0f, 15000.0f);
          }
        } else {
          problem(p, k[0], "a colour change is `colour <n> K`, `colour <r> <g> <b>` or `colour up/down <n> K`", "colour down 300 K");
          return false;
        }
        h->trail.push_back(at.text + ": colour " + before + " → " + colourText());
        if (h->glows) h->glow = s.tint();  // what you see glows the light's colour
      } else if ((what == "lumens" || what == "brightness") && k.size() == 3 && k[1].is("times") && num(2)) {
        const float was = s.lumens;
        s.lumens *= static_cast<float>(std::pow(k[2].number, strength));
        h->trail.push_back(at.text + ": " + number(was) + " → " + number(s.lumens) + " lumens");
      } else if (what == "size" && k.size() == 3 && k[1].is("times") && num(2)) {
        const float f = static_cast<float>(std::pow(k[2].number, strength));
        s.a *= f, s.b *= f;
        h->trail.push_back(at.text + ": size times " + number(f));
      } else {
        problem(p, k[0], "`" + joinWords(l, 0, k.size()) + "` isn't a change to a light",
                "colour down 300 K, colour 0.3 0.6 1, lumens times 2, size times 3");
        return false;
      }
    }
  }
  return true;
}

bool Words::describeDoing(const Word& d, double strength, Doing& g, Problems& p, const Token& at) {
  for (const Line& l : d.lines) {
    const std::vector<Token>& k = l.tokens;
    if (k.size() != 3 || !k[1].is("times") || k[2].kind != Tok::kNumber) {
      problem(p, k[0], "a change to a doing is `<setting> times <number>`", "every times 0.5");
      return false;
    }
    auto it = std::find_if(g.settings.begin(), g.settings.end(), [&](const auto& s) { return s.first == k[0].text; });
    if (it == g.settings.end()) {
      problem(p, at, "`" + at.text + "` changes `" + k[0].text + "`, and `" + g.word + "` has no `" + k[0].text + "`",
              "its settings: " + [&] { std::string s; for (const auto& x : g.settings) s += (s.empty() ? "" : ", ") + x.first; return s; }());
      return false;
    }
    it->second.v *= std::pow(k[2].number, strength);
  }
  return true;
}

bool Words::compile(const Word& w, Doing& g, Problems& p) {
  g.word = w.name;
  const Line* bright = nullptr;
  bool hadSettings = !g.settings.empty();
  for (const Line& l : w.lines) {
    if (l.tokens[0].is("settings") && l.tokens.size() > 1 && l.tokens[1].is(":")) {
      if (hadSettings) continue;  // already set (and maybe changed by describing words)
      size_t i = 2;
      while (i < l.tokens.size()) {
        const size_t end = findSymbol(l, ",", i);
        if (end - i < 2 || l.tokens[i].kind != Tok::kWord) {
          problem(p, l.tokens[std::min(i, l.tokens.size() - 1)], "a setting is a name and its usual value", "settings: amount 30%, every 0.5 s");
          return false;
        }
        Expr e;
        if (!parseExpr(l.tokens, i + 1, end, e, p)) return false;
        Value v;
        if (!Program::fold(e, v.v, v.unit)) {
          problem(p, l.tokens[i + 1], "a setting's usual value is a plain number", "amount 30%, every 0.5 s");
          return false;
        }
        g.settings.push_back({l.tokens[i].text, v});
        i = end + 1;
      }
    } else if (l.tokens[0].is("brightness") && l.tokens.size() > 2 && l.tokens[1].is("times")) {
      bright = &l;
    } else {
      problem(p, l.tokens[0], "a doing's lines are `settings: …` and `brightness times …`", "brightness times 1 + amount * flicker(period every)");
      return false;
    }
  }
  if (!bright) {
    problem(p, w.lines.empty() ? Token{} : w.lines[0].tokens[0], "`" + w.name + "` doesn't say what it does", "brightness times 1 + amount * flicker(period every)");
    return false;
  }
  Program::Env env;
  for (const auto& [name, v] : g.settings) {
    Expr e;
    e.kind = Expr::kNumber;
    e.value = v.v;
    e.unit = v.unit;
    e.line = bright->line;
    env.push_back({name, e});
  }
  g.expr = program_.compile(bright->tokens, 2, bright->tokens.size(), p, env);
  return g.expr >= 0;
}

bool Words::doing(const Word& w, Thing& t, std::vector<std::pair<const Word*, double>> how, Problems& p, const Token& at) {
  std::vector<Thing*> holders;
  lightsOf(t, holders);
  if (holders.empty()) {
    problem(p, at, "`" + at.text + "` is something a light does, and a " + t.word + " gives none", "a candle that flickers, a buzzing sign");
    return false;
  }
  for (Thing* h : holders) {
    // Already doing it (a flame flickers by itself): change that one.
    auto it = std::find_if(h->doings.begin(), h->doings.end(), [&](const Doing& g) { return g.word == w.name; });
    Doing fresh;
    Doing& g = it != h->doings.end() ? *it : fresh;
    if (it == h->doings.end()) {
      // Its usual settings first (compile reads them), then the changes.
      if (!compile(w, g, p)) return false;
    }
    std::string said;
    for (auto& [d, s] : how) {
      if (d->describes != "doing") {
        problem(p, at, "`" + d->name + "` describes a light, not how it " + w.name + "s", "a " + d->name + " candle that flickers");
        return false;
      }
      if (!describeDoing(*d, s, g, p, at)) return false;
      said += " " + d->name;
    }
    if (!how.empty() && !compile(w, g, p)) return false;
    std::string settings;
    for (const auto& x : g.settings)
      settings += (settings.empty() ? "" : ", ") + x.first + " " + (x.first == "amount" ? number(x.second.v * 100) + "%" : valueText(x.second));
    if (it == h->doings.end() || !how.empty()) h->trail.push_back(w.name + said + " (" + settings + ")");
    if (it == h->doings.end()) h->doings.push_back(std::move(g));
  }
  return true;
}

// ---- Reading a phrase ----

bool Words::read(std::string_view phrase, Thing& out, Problems& p, int line) {
  std::vector<Line> lines = readLines(phrase, p);
  if (lines.size() != 1 || !lines[0].children.empty()) {
    p.push_back({line, 0, "a phrase is one line", "a warm candle that flickers", false});
    return false;
  }
  for (Token& t : lines[0].tokens) t.line = line;
  return read(lines[0], 0, lines[0].tokens.size(), out, p);
}

bool Words::read(const Line& l, size_t from, size_t to, Thing& out, Problems& p) {
  std::vector<std::string> making;
  return readThing(l, from, to, out, p, making);
}

bool Words::setting(const Line& l, size_t& i, size_t to, Thing& t, Problems& p) {
  const std::vector<Token>& k = l.tokens;
  const double v = k[i].number;
  const auto is = [&](size_t j, const char* w) { return j < to && k[j].is(w); };
  std::vector<Thing*> holders;
  lightsOf(t, holders);
  auto needLight = [&] {
    if (!holders.empty()) return true;
    problem(p, k[i], "a " + t.word + " gives no light to set", "try it on something that gives light");
    return false;
  };
  if (is(i + 1, "lumens")) {
    if (!needLight()) return false;
    for (Thing* h : holders) h->light.lumens = static_cast<float>(v), h->trail.push_back(number(v) + " lumens");
    i += 2;
    return true;
  }
  if (is(i + 1, "K")) {
    if (!needLight()) return false;
    for (Thing* h : holders) h->light.kelvin = static_cast<float>(v), h->light.rgb = false, h->trail.push_back(number(v) + " K");
    i += 2;
    return true;
  }
  // A distance above or below it (a part's place: "9 cm above it").
  size_t j = i + 1;
  std::string unit = "m";
  if (j < to && lengthUnit(k[j])) unit = k[j++].text;
  if ((is(j, "above") || is(j, "below")) && is(j + 1, "it")) {
    t.at.y += static_cast<float>(metres(v, unit) * (is(j, "above") ? 1 : -1));
    t.trail.push_back(number(v) + " " + unit + " " + k[j].text + " it");
    i = j + 2;
    return true;
  }
  if (is(j, "long") || is(j, "across")) {
    if (!needLight()) return false;
    for (Thing* h : holders) {
      h->light.a = static_cast<float>(metres(v, unit));
      // A long thing's glowing box grows with its light (a 1.6 m neon tube is 1.6 m long).
      if (k[j].is("long") && h->box.x > 0) h->box.x = h->light.a;
      h->trail.push_back(number(v) + " " + unit + " " + k[j].text);
    }
    i = j + 1;
    return true;
  }
  problem(p, k[i], "`" + joinWords(l, i, std::min(to, i + 3)) + "` isn't a setting",
          "324 lumens, 3000 K, 1.6 m long, 6 cm across, 9 cm above it");
  return false;
}

bool Words::readThing(const Line& l, size_t from, size_t to, Thing& out, Problems& p, std::vector<std::string>& making) {
  const std::vector<Token>& t = l.tokens;
  while (to > from && t[to - 1].is(".")) --to;  // a full stop at the end
  size_t i = from;
  if (i >= to) {
    p.push_back({l.line, 0, "which thing? the phrase is empty", "a warm candle that flickers", false});
    return false;
  }
  // How many: a, an, the, one, two… (unless a word starts with it: "a little").
  int count = 1;
  size_t used = 0;
  if (i < to && article(t[i]) && !(dict_.match(t, i, to, &used, nullptr) && used > 1)) {
    ++i;
  } else if (int n = 0; i < to && isNumberWord(t[i].text, &n)) {
    count = n, ++i;
  }
  // Before the thing: amounts, describing words, doings ("a gently flickering candle").
  std::vector<std::pair<const Word*, double>> looks, how;
  std::vector<std::pair<const Word*, std::vector<std::pair<const Word*, double>>>> doings;
  std::vector<const Token*> looksAt, doingsAt;
  double strength = 1;
  const Word* noun = nullptr;
  const Token* nounAt = nullptr;
  while (i < to) {
    std::string form;
    const Word* w = dict_.match(t, i, to, &used, &form);
    if (!w) {
      if (t[i].kind == Tok::kWord) unknown(t[i], p);
      else problem(p, t[i], "`" + t[i].text + "` comes before the thing it's about", "a warm candle, 12 lumens");
      return false;
    }
    if (w->kind == Kind::kAmount) {
      strength *= std::atof(w->lines[0].tokens[1].text.c_str());
    } else if (w->kind == Kind::kDescribe && w->describes == "doing") {
      how.push_back({w, strength});
      strength = 1;
    } else if (w->kind == Kind::kDescribe) {
      looks.push_back({w, strength});
      looksAt.push_back(&t[i]);
      strength = 1;
    } else if (w->kind == Kind::kDoing) {
      doings.push_back({w, how});
      doingsAt.push_back(&t[i]);
      how.clear();
    } else if (w->kind == Kind::kThing) {
      noun = w;
      nounAt = &t[i];
      i += used;
      break;
    } else {
      problem(p, t[i], "`" + form + "` (" + kindName(w->kind) + ") needs a thing before it", "a lamp " + form + " the table");
      return false;
    }
    i += used;
  }
  if (!noun) {
    problem(p, t[to - 1], "which thing? none is named", "end with a thing: a warm candle");
    return false;
  }
  if (!how.empty()) {
    problem(p, *nounAt, "`" + how[0].first->name + "` describes a doing, and none comes after it", "a " + how[0].first->name + " flickering " + noun->name);
    return false;
  }
  if (strength != 1) {
    problem(p, *nounAt, "an amount (very, a little) needs a word to go with", "a very warm " + noun->name);
    return false;
  }
  if (!make(*noun, out, p, making, *nounAt)) return false;
  out.count = count;
  // Words that set a colour first, then the ones that shift it.
  for (size_t k = 0; k < looks.size(); ++k)
    if (!describe(*looks[k].first, looks[k].second, out, p, *looksAt[k])) return false;
  for (size_t k = 0; k < doings.size(); ++k)
    if (!doing(*doings[k].first, out, doings[k].second, p, *doingsAt[k])) return false;
  // After the thing: ", 324 lumens", "that flickers fast", ", buzzing gently".
  const Word* lastDoing = nullptr;
  std::vector<std::pair<const Word*, double>> lastHow;
  const Token* lastAt = nullptr;
  auto finishDoing = [&]() {
    if (!lastDoing) return true;
    const bool ok = doing(*lastDoing, out, lastHow, p, *lastAt);
    lastDoing = nullptr;
    lastHow.clear();
    return ok;
  };
  strength = 1;
  bool wantDoing = false;  // after "that": what it does
  while (i < to) {
    if (t[i].is(",") || t[i].is("and") || t[i].is("that") || t[i].is("which")) {
      if (!finishDoing()) return false;
      wantDoing = t[i].is("that") || t[i].is("which");
      ++i;
      continue;
    }
    if (wantDoing) {
      std::string form;
      const Word* w = dict_.match(t, i, to, &used, &form);
      if (w && w->kind != Kind::kDoing && w->kind != Kind::kAmount) {
        problem(p, t[i], "after `that` comes what it does, and `" + form + "` is " + kindName(w->kind),
                w->kind == Kind::kDescribe && w->describes == "light" ? "a " + form + " " + noun->name : "a " + noun->name + " that flickers");
        return false;
      }
      if (w && w->kind == Kind::kDoing) wantDoing = false;
    }
    if (t[i].kind == Tok::kNumber) {
      if (!finishDoing() || !setting(l, i, to, out, p)) return false;
      continue;
    }
    std::string form;
    const Word* w = dict_.match(t, i, to, &used, &form);
    if (!w && article(t[i])) {
      problem(p, t[i], "two things in one phrase: `" + noun->name + "` and another", "give each its own line, or join them with a place word (J116.3)");
      return false;
    }
    if (!w) {
      if (t[i].kind == Tok::kWord) unknown(t[i], p);
      else problem(p, t[i], "`" + t[i].text + "` doesn't fit here", "separate what follows the thing with commas");
      return false;
    }
    if (w->kind == Kind::kAmount) {
      strength *= std::atof(w->lines[0].tokens[1].text.c_str());
    } else if (w->kind == Kind::kDescribe && w->describes == "doing") {
      if (!lastDoing) {
        problem(p, t[i], "`" + form + "` describes a doing; which one?", "… that flickers " + form);
        return false;
      }
      lastHow.push_back({w, strength});
      strength = 1;
    } else if (w->kind == Kind::kDescribe) {
      if (!finishDoing() || !describe(*w, strength, out, p, t[i])) return false;
      strength = 1;
    } else if (w->kind == Kind::kDoing) {
      if (!finishDoing()) return false;
      lastDoing = w;
      lastAt = &t[i];
    } else if (w->kind == Kind::kThing) {
      problem(p, t[i], "two things in one phrase: `" + noun->name + "` and `" + w->name + "`", "give each its own line, or join them with a place word (J116.3)");
      return false;
    } else {
      problem(p, t[i], "`" + form + "` (" + kindName(w->kind) + "): places come with the light lab's worlds (J116.3)", "");
      return false;
    }
    i += used;
  }
  if (!finishDoing()) return false;
  if (strength != 1) {
    problem(p, t[to - 1], "an amount (very, a little) needs a word after it", "… buzzing very gently");
    return false;
  }
  return true;
}

void Words::lights(const Thing& t, const world::Clock& clock, std::vector<Glow>& out, Vec3 at, uint32_t seed) {
  program_.newUpdate();  // a moment's own budget
  lightsAt(t, clock, out, at, seed);
}

void Words::lightsAt(const Thing& t, const world::Clock& clock, std::vector<Glow>& out, Vec3 at, uint32_t seed) {
  const Vec3 here = at + t.at;
  if (t.hasLight) {
    double b = 1;
    for (const Doing& g : t.doings)
      if (g.expr >= 0) b *= program_.eval(g.expr, {&clock, seed, false});
    out.push_back({here, t.light.tint(), static_cast<float>(t.light.lumens * std::max(0.0, b)), &t.light});
  }
  uint32_t s = seed;
  for (const Thing& part : t.parts) lightsAt(part, clock, out, here, s = s * 2654435761u + 1);
}

}  // namespace engine::words
