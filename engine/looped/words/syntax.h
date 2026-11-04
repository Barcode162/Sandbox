#pragma once
// Looped Script, the reading part (J116.2; the language's design is
// docs/plan/jobs/J43.md). A script is lines of plain words; a line indented
// under another belongs to it. This file turns text into those lines (each a
// list of words, numbers and signs) and reads expressions (`1 + 6% *
// noise(period 8 s)`). What the lines mean is up to the reader of each kind
// of script (the light rig: looped/words/rig.h). Every problem has its line,
// column, plain words and, when one is close, a fix hint. Plain C++.
#include <string>
#include <string_view>
#include <vector>

namespace engine::words {

struct Problem {
  int line = 0, column = 0;
  std::string what;  // plain words: "`fliker` isn't a function"
  std::string hint;  // "did you mean `flicker`?" (may be empty)
  bool warning = false;
  // "line 7, column 14: `fliker` isn't a function; did you mean `flicker`?"
  std::string text() const;
};
using Problems = std::vector<Problem>;
bool hasErrors(const Problems& p);

enum class Tok { kWord, kNumber, kSymbol };
struct Token {
  Tok kind = Tok::kWord;
  std::string text;  // as written (a symbol: one of : , ( ) + - * / % .)
  double number = 0;
  int line = 0, column = 0;
  bool is(std::string_view s) const { return text == s; }
};

// A line of script and the lines indented under it.
struct Line {
  int line = 0, indent = 0;
  std::vector<Token> tokens;
  std::vector<Line> children;
};

// Splits a script into lines nested by indentation. Comments (from # to the
// end of the line) and blank lines are left out. Words are letters, digits,
// `-`, `_` and `*` starting with a letter (`string-light-*`), so subtracting
// needs spaces: `1 - x`; a dot or an apostrophe between letters stays in the
// word (`candle.glb`, `table's`). Signs: : , ( ) + - * / % and . (a full stop).
std::vector<Line> readLines(std::string_view text, Problems& problems);

// An expression: numbers (with a unit: `%`, `s`, `beats`, `K`), names,
// calls with named or plain arguments (`noise(period 8 s, speed 0.5)`), + -
// * / and brackets.
struct Expr {
  enum Kind { kNumber, kName, kCall, kNegate, kBinary } kind = kNumber;
  double value = 0;
  std::string unit;  // a number's: "", "s", "beats", "K" (% is applied: 6% = 0.06)
  std::string name;  // a name's or a call's
  char op = 0;       // a binary's: + - * /
  std::vector<Expr> args;          // a call's arguments, or a negate's / binary's operands
  std::vector<std::string> argNames;  // a call's: "" for a plain one
  int line = 0, column = 0;
};

// Reads tokens [from, to) as one expression; false (with a problem) if they
// aren't one.
bool parseExpr(const std::vector<Token>& tokens, size_t from, size_t to, Expr& out, Problems& problems);

// The option nearest to `word` (for "did you mean"), "" if none is close.
std::string closest(std::string_view word, const std::vector<std::string>& options);
// "did you mean `x`?", or "" when nothing is close.
std::string didYouMean(std::string_view word, const std::vector<std::string>& options);

// Small helpers for readers of lines.
void problem(Problems& p, const Token& at, std::string what, std::string hint = {});
std::string joinWords(const Line& l, size_t from, size_t to, const char* join = " ");
size_t findSymbol(const Line& l, std::string_view sym, size_t from = 0);  // tokens.size() if none
size_t findWord(const Line& l, std::string_view w, size_t from = 0);

}  // namespace engine::words
