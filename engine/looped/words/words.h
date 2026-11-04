#pragma once
// Looped Script's words (J116.2; the plan: docs/plan/jobs/J116.md → The
// language everywhere). Every word is a small script made of other words
// (requests 2026-10-27 #10, #11): a dictionary file (assets/words/) says, for
// each word, what kind of word it is and what it means, in lines that use
// other words, down to the engine's roots (the settings, the units, the
// shapes, a model, a box, a light). A phrase like "a very warm candle that
// flickers fast" is read word by word into a thing: the candle's own meaning
// (made of its model, a flame on it), changed by each word that describes
// it, with what it does over time; and a trail that says why each number is
// what it is. One phrase, one meaning: anything the reader can't place is a
// problem with its line, column, plain words and a hint (close spellings,
// and words that list it as `like`). Plain C++.
//
// The kinds of words:
//   thing       `word candle: a thing` (made of a model or a box, glows,
//               gives light, has parts, does things by itself)
//   describing  `word warm: describes a light` (colour down 300 K),
//               `word fast: describes a doing` (every times 0.5)
//   doing       `word flicker (flickers, flickering): a doing` (its settings
//               and `brightness times <expression>`)
//   amount      `word very: an amount` (times 2: the next word counts twice)
//   place       `word on: a place word` (J116.3: where a thing goes)
#include <cstdint>
#include <map>
#include <string>
#include <string_view>
#include <vector>

#include "looped/math.h"
#include "looped/words/program.h"
#include "looped/words/syntax.h"

namespace engine::words {

enum class Kind { kThing, kDescribe, kDoing, kAmount, kPlace };
const char* kindName(Kind k);  // "a thing", "a describing word", ...

// A word as its dictionary file says it.
struct Word {
  std::string name;                // "pendant lamp" (one or more words)
  std::vector<std::string> forms;  // other ways it's written: "flickers", "flickering"
  Kind kind = Kind::kThing;
  std::string describes;           // describing words: "light", "doing", "thing"
  std::string parent;              // things: "a kind of <parent>"
  std::vector<Line> lines;         // its meaning, as written
  std::vector<std::string> like;   // words it's close to
  std::string file;
  int line = 0;
};

class Dictionary {
 public:
  // Adds the words of one file (problems appended; a broken word is left out).
  bool read(std::string_view text, const std::string& file, Problems& p);
  const Word* find(std::string_view nameOrForm) const;
  // The longest word starting at tokens[i] (names can be several words);
  // `used` gets how many tokens it took, `form` how it was written.
  const Word* match(const std::vector<Token>& t, size_t i, size_t end, size_t* used, std::string* form) const;
  // Every name and form (for "did you mean").
  std::vector<std::string> spellings() const;
  // Words that list `w` among their `like` words.
  std::vector<std::string> likeOf(std::string_view w) const;
  const std::vector<Word>& all() const { return words_; }

 private:
  std::vector<Word> words_;
  std::map<std::string, size_t> index_;  // every name and form → its word
};

// A number with its unit: 300 K, 0.5 s, 0.3 (30%), 1 m.
struct Value {
  double v = 0;
  std::string unit;
};

// What a light is: how much, what colour, what shape.
struct LightSpec {
  float lumens = 0;
  float kelvin = 2700;  // used when !rgb
  bool rgb = false;
  Vec3 colour{1, 1, 1};  // when rgb
  int shape = 0;         // 0 ball, 1 tube, 2 panel
  float a = 0.05f;       // a ball's width, a tube's length, a panel's width (m)
  float b = 0;           // a panel's height (m)
  bool oneSided = false;
  // The light's colour (luminance 1).
  Vec3 tint() const;
};

// Something a light does over time, with its settings as the phrase left them.
struct Doing {
  std::string word;
  std::vector<std::pair<std::string, Value>> settings;
  int expr = -1;  // brightness factor (Words::program)
};

// A thing, as a phrase made it.
struct Thing {
  std::string word;  // the thing word ("candle")
  int count = 1;
  std::string model;    // a model file, or ""
  Vec3 box;             // a box's size (m), or 0
  bool glows = false;
  Vec3 glow;            // its glow's colour
  bool hasLight = false;
  LightSpec light;
  std::vector<Doing> doings;  // on its light
  Vec3 at;                    // where, from its parent (a part) or the place
  std::vector<Thing> parts;
  std::vector<std::string> trail;  // why it is as it is, step by step
};

class Words {
 public:
  // Reads a dictionary file and checks every word in it (and in the files
  // before it): every word it uses is known, no word is made of itself.
  bool load(std::string_view text, const std::string& file, Problems& p);
  const Dictionary& dictionary() const { return dict_; }

  // A thing phrase ("a very warm candle that flickers fast", "a sign, 200
  // lumens, waving gently") → the thing. Problems carry `line` (the
  // phrase's line in its file, 1 for a lone phrase).
  bool read(std::string_view phrase, Thing& out, Problems& p, int line = 1);
  bool read(const Line& l, size_t from, size_t to, Thing& out, Problems& p);

  // The lights of a thing and its parts at a moment: where (from the
  // thing), what colour (luminance 1) and how bright (lumens now).
  struct Glow {
    Vec3 at;
    Vec3 colour;
    float lumens = 0;
    const LightSpec* spec = nullptr;
  };
  void lights(const Thing& t, const world::Clock& clock, std::vector<Glow>& out, Vec3 at = {}, uint32_t seed = 1);

  Program& program() { return program_; }

 private:
  bool make(const Word& w, Thing& out, Problems& p, std::vector<std::string>& making, const Token& at);
  bool makeLine(const Word& w, const Line& l, Thing& out, Problems& p, std::vector<std::string>& making);
  bool readLight(const Line& l, size_t from, LightSpec& s, Problems& p);
  bool describe(const Word& d, double strength, Thing& t, Problems& p, const Token& at);
  bool describeDoing(const Word& d, double strength, Doing& g, Problems& p, const Token& at);
  bool doing(const Word& w, Thing& t, std::vector<std::pair<const Word*, double>> how, Problems& p, const Token& at);
  bool compile(const Word& w, Doing& g, Problems& p);
  bool readThing(const Line& l, size_t from, size_t to, Thing& out, Problems& p, std::vector<std::string>& making);
  void lightsAt(const Thing& t, const world::Clock& clock, std::vector<Glow>& out, Vec3 at, uint32_t seed);
  bool setting(const Line& l, size_t& i, size_t to, Thing& t, Problems& p);
  void unknown(const Token& at, Problems& p) const;

  Dictionary dict_;
  Program program_;
};

}  // namespace engine::words
