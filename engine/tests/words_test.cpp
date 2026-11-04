// Looped Script's words (J116.2, looped/words/words.h): the first dictionary
// (looped/words/first.looped) reads and checks cleanly; phrases mean what
// they say (a warm candle's flame is warmer, "fast" makes its flicker
// faster, "two dim bulbs" are two, dimmer); and broken phrases and words
// say what's wrong, where, with a hint (close spellings, and the words that
// list it as `like`).
#include <cmath>
#include <cstdio>
#include <fstream>
#include <sstream>
#include <string>

#include "looped/light_units.h"
#include "looped/words/words.h"

using namespace engine;
using namespace engine::words;

static int failed = 0;
static void check(bool ok, const std::string& what) {
  std::printf("%s %s\n", ok ? "ok  " : "FAIL", what.c_str());
  if (!ok) ++failed;
}
static std::string readFile(const std::string& path) {
  std::ifstream f(path, std::ios::binary);
  std::stringstream s;
  s << f.rdbuf();
  return s.str();
}
static std::string all(const Problems& p) {
  std::string s;
  for (const Problem& x : p) s += "\n       " + x.text();
  return s;
}
static const Thing* firstLight(const Thing& t) {
  if (t.hasLight) return &t;
  for (const Thing& part : t.parts)
    if (const Thing* l = firstLight(part)) return l;
  return nullptr;
}
static const Doing* doingOf(const Thing& t, const std::string& word) {
  for (const Doing& g : t.doings)
    if (g.word == word) return &g;
  return nullptr;
}
static double settingOf(const Doing& g, const std::string& name) {
  for (const auto& [n, v] : g.settings)
    if (n == name) return v.v;
  return NAN;
}

int main() {
  Words words;
  Problems p;
  const bool loaded = words.load(readFile("looped/words/first.looped"), "looped/words/first.looped", p);
  check(loaded && p.empty(), "the first dictionary reads and every word in it checks (" + std::to_string(words.dictionary().all().size()) + " words)" + all(p));

  auto read = [&](const std::string& phrase, Thing& t) {
    Problems q;
    const bool ok = words.read(phrase, t, q);
    if (!ok) std::printf("       %s:%s\n", phrase.c_str(), all(q).c_str());
    return ok;
  };

  {
    Thing t;
    const bool ok = read("a warm candle that flickers", t);
    const Thing* flame = firstLight(t);
    check(ok && t.word == "candle" && t.model == "candle.glb" && flame && flame->word == "flame",
          "\"a warm candle that flickers\": a candle (its model), its light in its flame");
    check(flame && std::fabs(flame->light.kelvin - 1500) < 1 && std::fabs(flame->at.y - 0.09f) < 1e-4f,
          "the flame, 9 cm above the candle, is warmer: 1800 K → 1500 K");
    check(flame && flame->doings.size() == 1 && doingOf(*flame, "flicker"), "\"flickers\" is the flame's own flicker, not a second one");
    // Over time: never brighter than its 12 lumens, dipping now and then.
    std::vector<Words::Glow> g;
    world::Clock c;
    float lo = 1e9f, hi = 0;
    for (int k = 0; k < 2000; ++k) {
      c.seconds = k * 0.013;
      g.clear();
      words.lights(t, c, g);
      if (g.size() == 1) lo = std::min(lo, g[0].lumens), hi = std::max(hi, g[0].lumens);
    }
    char buf[120];
    std::snprintf(buf, sizeof buf, "its light flickers between %.1f and %.1f lumens (12 at rest)", lo, hi);
    check(hi <= 12.01f && lo < 11 && lo > 12 * (1 - 0.3f * 1.2f), buf);
    std::printf("     why it is as it is:\n");
    for (const std::string& s : t.trail) std::printf("       %s\n", s.c_str());
    for (const Thing& part : t.parts)
      for (const std::string& s : part.trail) std::printf("         %s\n", s.c_str());
  }
  {
    Thing t;
    const bool ok = read("a very warm candle that flickers fast", t);
    const Thing* flame = firstLight(t);
    const Doing* f = flame ? doingOf(*flame, "flicker") : nullptr;
    check(ok && flame && std::fabs(flame->light.kelvin - 1200) < 1, "\"very warm\": twice as warm, 1800 K → 1200 K");
    check(f && std::fabs(settingOf(*f, "every") - 0.25) < 1e-9, "\"flickers fast\": every 0.5 s → 0.25 s");
  }
  {
    Thing t;
    const bool ok = read("a very warm candle that flickers very fast", t);
    const Doing* f = firstLight(t) ? doingOf(*firstLight(t), "flicker") : nullptr;
    check(ok && f && std::fabs(settingOf(*f, "every") - 0.125) < 1e-9, "\"very fast\": every 0.5 s → 0.125 s");
  }
  {
    Thing t;
    const bool ok = read("a blue neon tube, buzzing gently", t);
    const Doing* b = doingOf(t, "buzz");
    check(ok && t.hasLight && t.light.rgb && std::fabs(t.light.colour.z - 1) < 1e-6f && t.light.shape == 1,
          "\"a blue neon tube\": a tube of light, blue");
    check(b && std::fabs(settingOf(*b, "amount") - 0.06) < 1e-9, "\"buzzing gently\": its buzz at half (12% → 6%)");
  }
  {
    Thing t;
    const bool ok = read("a bulb, 3000 K, 400 lumens", t);
    check(ok && t.light.kelvin == 3000 && t.light.lumens == 400, "\"a bulb, 3000 K, 400 lumens\": set as said");
  }
  {
    Thing t;
    const bool ok = read("two dim bulbs", t);
    check(ok && t.count == 2 && std::fabs(t.light.lumens - 80) < 1e-3f, "\"two dim bulbs\": two, at 40% (200 → 80 lumens)");
  }
  {
    Thing t;
    const bool ok = read("a sign, waving", t);
    check(ok && t.light.shape == 2 && t.light.oneSided && std::fabs(t.light.a - 1) < 1e-6f && std::fabs(t.light.b - 0.3f) < 1e-6f &&
              doingOf(t, "wave"),
          "\"a sign, waving\": a panel 1 by 0.3 m shining from one side, waving");
  }
  {
    Thing t;
    const bool ok = read("a gently flickering bulb", t);
    const Doing* f = doingOf(t, "flicker");
    check(ok && f && std::fabs(settingOf(*f, "amount") - 0.15) < 1e-9, "\"a gently flickering bulb\": the doing word before the thing, with its describer");
  }

  // ---- Broken phrases ----
  struct Case {
    const char* phrase;
    const char* expect;
  };
  const Case cases[] = {
      {"a warm candel", "`candel` isn't a word yet; did you mean `candle`?"},
      {"a cozy candle", "`cozy` isn't a word yet; words like it: warm"},
      {"a candle that warm", "after `that` comes what it does, and `warm` is a describing word; a warm candle"},
      {"a warm table", "`warm` describes a light, and a table gives none"},
      {"a fast candle", "`fast` describes a doing, and none comes after it"},
      {"a flickering", "which thing? none is named"},
      {"a table that flickers", "`flickers` is something a light does, and a table gives none"},
      {"a candle, 12 lumen", "isn't a setting"},
      {"a candle a table", "two things in one phrase"},
      {"a very candle", "an amount (very, a little) needs a word to go with"},
      {"a bulb, buzzing very", "an amount (very, a little) needs a word after it"},
      {"a bulb, fast", "`fast` describes a doing; which one?"},
  };
  int caught = 0;
  for (const Case& k : cases) {
    Thing t;
    Problems q;
    const bool ok = words.read(k.phrase, t, q);
    bool found = false;
    for (const Problem& x : q) found = found || x.text().find(k.expect) != std::string::npos;
    caught += !ok && found;
    check(!ok && found, std::string("broken: \"") + k.phrase + "\"\n       → " + (q.empty() ? "(no problem)" : q[0].text()));
  }
  std::printf("     %d of %zu broken phrases caught with a hint\n", caught, sizeof(cases) / sizeof(cases[0]));

  // ---- Broken words ----
  const Case badWords[] = {
      {"word loop: a thing, a kind of loop\n  made of a box 1 by 1 by 1 m\n", "`loop` is made of itself (loop → loop)"},
      {"word lantern: a thing\n  has a candel 5 cm above it\n", "`candel` isn't a word yet; did you mean `candle`?"},
      {"word glum: describes a mood\n  colour down 300 K\n", "a describing word describes a light or a doing"},
      {"word shiny: describes a light\n  colour sideways 300 K\n", "a colour change is"},
      {"word hum: a doing\n  settings: amount 5%\n", "doesn't say what it does"},
      {"word blink: a doing\n  settings: amount 5%, every 1 s\n  brightness times 1 + amount * flikker(period every)\n", "`flikker` isn't a shape; did you mean `flicker`?"},
      {"word warm: describes a light\n  colour down 100 K\n", "`warm` is already a word"},
      {"word lamp shade: thing\n", "`thing` isn't a kind of word"},
  };
  for (const Case& k : badWords) {
    Words w2;
    Problems q;
    w2.load(readFile("looped/words/first.looped"), "looped/words/first.looped", q);
    q.clear();
    const bool ok = w2.load(k.phrase, "test.looped", q);
    bool found = false;
    for (const Problem& x : q) found = found || x.text().find(k.expect) != std::string::npos;
    check(!ok && found, std::string("broken word: ") + std::string(k.phrase).substr(0, std::string(k.phrase).find('\n')) + "\n       → " + (q.empty() ? "(no problem)" : q[0].text()));
  }

  std::printf(failed ? "WORDS TEST FAILED (%d)\n" : "words_test: all passed\n", failed);
  return failed ? 1 : 0;
}
