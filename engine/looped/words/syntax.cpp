#include "looped/words/syntax.h"

#include <algorithm>
#include <cctype>
#include <cstdlib>

namespace engine::words {

std::string Problem::text() const {
  std::string s;
  if (line > 0) {
    s = "line " + std::to_string(line);
    if (column > 0) s += ", column " + std::to_string(column);
    s += ": ";
  }
  s += what;
  if (!hint.empty()) s += "; " + hint;
  return s;
}

bool hasErrors(const Problems& p) {
  return std::any_of(p.begin(), p.end(), [](const Problem& x) { return !x.warning; });
}

namespace {

bool wordStart(char c) { return std::isalpha(static_cast<unsigned char>(c)) || c == '_'; }
bool wordChar(char c) {
  return std::isalnum(static_cast<unsigned char>(c)) || c == '_' || c == '-' || c == '*';
}
bool symbol(char c) { return std::string_view(":,()+-*/%.").find(c) != std::string_view::npos; }

void add(Problems& out, int line, int column, std::string what, std::string hint = {}) {
  out.push_back({line, column, std::move(what), std::move(hint), false});
}

// The lines from flat[i] on that are indented more than `parent`, each with
// its own deeper lines under it.
std::vector<Line> nest(std::vector<Line>& flat, size_t& i, int parent, Problems& problems) {
  std::vector<Line> out;
  int level = -1;
  while (i < flat.size() && flat[i].indent > parent) {
    Line l = std::move(flat[i++]);
    if (level < 0) {
      level = l.indent;
    } else if (l.indent != level) {
      add(problems, l.line, l.indent + 1, "this line doesn't line up with the lines above it",
          "indent it like the line it belongs with");
    }
    l.children = nest(flat, i, l.indent, problems);
    out.push_back(std::move(l));
  }
  return out;
}

}  // namespace

std::vector<Line> readLines(std::string_view text, Problems& problems) {
  // First the flat lines with their indentation, then nest them.
  std::vector<Line> flat;
  int number = 0;
  size_t at = 0;
  while (at <= text.size()) {
    size_t end = text.find('\n', at);
    if (end == std::string_view::npos) end = text.size();
    std::string_view raw = text.substr(at, end - at);
    at = end + 1;
    ++number;
    if (!raw.empty() && raw.back() == '\r') raw.remove_suffix(1);
    Line line;
    line.line = number;
    size_t i = 0;
    while (i < raw.size() && (raw[i] == ' ' || raw[i] == '\t')) {
      if (raw[i] == '\t') {
        add(problems, number, static_cast<int>(i) + 1, "a tab before the words", "indent with spaces");
        line.indent += 4;
      } else {
        ++line.indent;
      }
      ++i;
    }
    bool bad = false;
    while (i < raw.size()) {
      const char c = raw[i];
      const int column = static_cast<int>(i) + 1;
      if (c == '#') break;  // a comment: the rest of the line
      if (c == ' ' || c == '\t') {
        ++i;
        continue;
      }
      Token t;
      t.line = number;
      t.column = column;
      if (std::isdigit(static_cast<unsigned char>(c)) ||
          (c == '.' && i + 1 < raw.size() && std::isdigit(static_cast<unsigned char>(raw[i + 1])))) {
        size_t j = i;
        while (j < raw.size() && (std::isdigit(static_cast<unsigned char>(raw[j])) || raw[j] == '.')) ++j;
        t.kind = Tok::kNumber;
        t.text = std::string(raw.substr(i, j - i));
        char* stop = nullptr;
        t.number = std::strtod(t.text.c_str(), &stop);
        if (stop != t.text.c_str() + t.text.size()) {
          add(problems, number, column, "`" + t.text + "` isn't a number", "write it like 0.5 or 12");
          bad = true;
        }
        i = j;
      } else if (wordStart(c)) {
        size_t j = i;
        // A dot or an apostrophe between letters belongs to the word (a
        // file, candle.glb; the table's), not at its end (a full stop).
        auto inside = [&](size_t k) {
          return (raw[k] == '.' || raw[k] == '\'') && k + 1 < raw.size() && std::isalpha(static_cast<unsigned char>(raw[k + 1]));
        };
        while (j < raw.size() && (wordChar(raw[j]) || inside(j))) ++j;
        while (j > i + 1 && raw[j - 1] == '-') --j;  // a dash at the end is a minus
        t.kind = Tok::kWord;
        t.text = std::string(raw.substr(i, j - i));
        i = j;
      } else if (symbol(c)) {
        t.kind = Tok::kSymbol;
        t.text = std::string(1, c);
        ++i;
      } else {
        // Not something the language has (a quote, a non-English letter...).
        size_t j = i + 1;
        while (j < raw.size() && (static_cast<unsigned char>(raw[j]) & 0xC0) == 0x80) ++j;  // the whole character
        add(problems, number, column, "`" + std::string(raw.substr(i, j - i)) + "` isn't understood here",
            static_cast<unsigned char>(c) == 0xE2 ? "use plain letters and signs (… is written `to`)" : "use plain letters, digits and + - * / ( ) : , %");
        bad = true;
        i = j;
        continue;
      }
      line.tokens.push_back(std::move(t));
    }
    if (!line.tokens.empty() && !bad) flat.push_back(std::move(line));
  }
  // Nesting: a line belongs to the nearest line above it indented less.
  size_t i = 0;
  if (!flat.empty() && flat[0].indent > 0) add(problems, flat[0].line, 1, "the first line is indented", "start it at the left edge");
  std::vector<Line> top = nest(flat, i, -1, problems);
  return top;
}

namespace {

std::string unitOf(const std::string& w) {
  if (w == "s" || w == "sec" || w == "second" || w == "seconds") return "s";
  if (w == "beat" || w == "beats") return "beats";
  if (w == "K") return "K";
  return "";
}

struct Reader {
  const std::vector<Token>& t;
  size_t at, end;
  Problems& problems;
  bool failed = false;

  const Token* peek() const { return at < end ? &t[at] : nullptr; }
  bool peekSymbol(char c) const { return at < end && t[at].kind == Tok::kSymbol && t[at].text[0] == c; }
  void fail(const Token* where, std::string what, std::string hint = {}) {
    if (failed) return;
    failed = true;
    const Token& w = where ? *where : t[std::max<size_t>(1, end) - 1];
    add(problems, w.line, where ? w.column : static_cast<int>(w.column + w.text.size()), std::move(what), std::move(hint));
  }
  bool startsExpr() const {
    const Token* k = peek();
    return k && (k->kind != Tok::kSymbol || k->text == "(" || k->text == "-");
  }

  Expr expr() {
    Expr left = term();
    while (!failed && (peekSymbol('+') || peekSymbol('-'))) {
      const Token& op = t[at++];
      Expr right = term();
      left = binary(op, std::move(left), std::move(right));
    }
    return left;
  }
  Expr term() {
    Expr left = unary();
    while (!failed && (peekSymbol('*') || peekSymbol('/'))) {
      const Token& op = t[at++];
      Expr right = unary();
      left = binary(op, std::move(left), std::move(right));
    }
    return left;
  }
  static Expr binary(const Token& op, Expr a, Expr b) {
    Expr e;
    e.kind = Expr::kBinary;
    e.op = op.text[0];
    e.line = op.line;
    e.column = op.column;
    e.args.push_back(std::move(a));
    e.args.push_back(std::move(b));
    return e;
  }
  int depth = 0;  // brackets and minus signs inside each other (a cap keeps the reading's stack small)
  bool deeper(const Token* where) {
    if (++depth <= 32) return true;
    fail(where, "too many brackets or minus signs inside each other", "write it more simply");
    return false;
  }
  Expr unary() {
    if (peekSymbol('-')) {
      if (!deeper(peek())) return {};
      const Token& m = t[at++];
      Expr e;
      e.kind = Expr::kNegate;
      e.line = m.line;
      e.column = m.column;
      e.args.push_back(unary());
      --depth;
      return e;
    }
    return primary();
  }
  Expr primary() {
    Expr e;
    const Token* k = peek();
    if (!k) {
      fail(nullptr, "the line ends where a number or a name should be");
      return e;
    }
    e.line = k->line;
    e.column = k->column;
    if (k->kind == Tok::kNumber) {
      ++at;
      e.kind = Expr::kNumber;
      e.value = k->number;
      if (peekSymbol('%')) {
        ++at;
        e.value /= 100;
      } else if (const Token* u = peek(); u && u->kind == Tok::kWord && !unitOf(u->text).empty()) {
        ++at;
        e.unit = unitOf(u->text);
      }
      return e;
    }
    if (k->kind == Tok::kWord) {
      ++at;
      e.name = k->text;
      if (!peekSymbol('(')) {
        e.kind = Expr::kName;
        return e;
      }
      ++at;
      e.kind = Expr::kCall;
      if (!deeper(k)) return e;
      while (!failed && !peekSymbol(')')) {
        // An argument: `period 8 s` (named) or `8 s` (plain).
        std::string name;
        if (const Token* w = peek(); w && w->kind == Tok::kWord && at + 1 < end && t[at + 1].kind != Tok::kSymbol) {
          name = w->text;
          ++at;
        }
        e.argNames.push_back(name);
        e.args.push_back(expr());
        if (failed) return e;
        if (peekSymbol(',')) {
          ++at;
          continue;
        }
        if (!peekSymbol(')')) {
          fail(peek(), peek() ? "`" + peek()->text + "` can't follow here" : "the brackets aren't closed",
               "separate the settings with a comma and end with )");
          return e;
        }
      }
      if (!peekSymbol(')')) {
        fail(nullptr, "the brackets aren't closed", "add ) at the end");
        return e;
      }
      ++at;
      --depth;
      return e;
    }
    if (k->is("(")) {
      if (!deeper(k)) return e;
      ++at;
      Expr inner = expr();
      --depth;
      if (!peekSymbol(')')) {
        fail(peek(), "the brackets aren't closed", "add ) after what's inside");
        return inner;
      }
      ++at;
      return inner;
    }
    fail(k, "`" + k->text + "` can't start a number or a name", k->is("%") ? "write the % right after a number: 6%" : "");
    return e;
  }
};

}  // namespace

bool parseExpr(const std::vector<Token>& tokens, size_t from, size_t to, Expr& out, Problems& problems) {
  Reader r{tokens, from, std::min(to, tokens.size()), problems};
  if (from >= r.end) {
    r.fail(nullptr, "something should follow here", "a number like 1, or 1 + 10% * wave(period 4 s)");
    return false;
  }
  if (r.end - from > 512) {
    r.fail(&tokens[from], "this is too long for one line", "a brightness needs only a few terms");
    return false;
  }
  out = r.expr();
  if (!r.failed && r.at < r.end) {
    const Token& extra = tokens[r.at];
    std::string hint = "join them with + - * or /";
    if (extra.kind == Tok::kWord && !unitOf(extra.text).empty()) hint = "a unit belongs right after a number";
    else if (extra.is(")")) hint = "there's a ) without its (";
    r.fail(&extra, "`" + extra.text + "` doesn't fit after what's before it", hint);
  }
  return !r.failed;
}

std::string closest(std::string_view word, const std::vector<std::string>& options) {
  // Edits between two words (a letter added, dropped, changed, or two
  // swapped: "lihgt" is one from "light"), ignoring case.
  auto distance = [](std::string_view a, std::string_view b) {
    const size_t w = b.size() + 1;
    std::vector<size_t> d((a.size() + 1) * w);
    auto low = [](char c) { return std::tolower(static_cast<unsigned char>(c)); };
    for (size_t i = 0; i <= a.size(); ++i) d[i * w] = i;
    for (size_t j = 0; j <= b.size(); ++j) d[j] = j;
    for (size_t i = 1; i <= a.size(); ++i)
      for (size_t j = 1; j <= b.size(); ++j) {
        const size_t cost = low(a[i - 1]) == low(b[j - 1]) ? 0 : 1;
        size_t v = std::min({d[(i - 1) * w + j] + 1, d[i * w + j - 1] + 1, d[(i - 1) * w + j - 1] + cost});
        if (i > 1 && j > 1 && low(a[i - 1]) == low(b[j - 2]) && low(a[i - 2]) == low(b[j - 1]))
          v = std::min(v, d[(i - 2) * w + j - 2] + 1);
        d[i * w + j] = v;
      }
    return d[a.size() * w + b.size()];
  };
  std::string best;
  size_t bestD = std::max<size_t>(1, word.size() / 3) + 1;
  for (const std::string& o : options) {
    const size_t d = distance(word, o);
    if (d < bestD) bestD = d, best = o;
  }
  return best;
}

std::string didYouMean(std::string_view word, const std::vector<std::string>& options) {
  const std::string c = closest(word, options);
  return c.empty() ? std::string() : "did you mean `" + c + "`?";
}

void problem(Problems& p, const Token& at, std::string what, std::string hint) {
  p.push_back({at.line, at.column, std::move(what), std::move(hint), false});
}

std::string joinWords(const Line& l, size_t from, size_t to, const char* join) {
  // As written: no space before , . : ) % or after (.
  std::string s;
  for (size_t i = from; i < std::min(to, l.tokens.size()); ++i) {
    const std::string& t = l.tokens[i].text;
    const bool tight = l.tokens[i].kind == Tok::kSymbol && (t == "," || t == "." || t == ":" || t == ")" || t == "%");
    const bool afterOpen = i > from && l.tokens[i - 1].is("(");
    if (!s.empty() && !tight && !afterOpen) s += join;
    s += t;
  }
  return s;
}

size_t findSymbol(const Line& l, std::string_view sym, size_t from) {
  for (size_t i = from; i < l.tokens.size(); ++i)
    if (l.tokens[i].kind == Tok::kSymbol && l.tokens[i].text == sym) return i;
  return l.tokens.size();
}

size_t findWord(const Line& l, std::string_view w, size_t from) {
  for (size_t i = from; i < l.tokens.size(); ++i)
    if (l.tokens[i].kind == Tok::kWord && l.tokens[i].text == w) return i;
  return l.tokens.size();
}

}  // namespace engine::words
