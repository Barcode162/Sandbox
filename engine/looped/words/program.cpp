#include "looped/words/program.h"

#include <algorithm>
#include <cmath>

namespace engine::words {

namespace {

struct FnSpec {
  const char* name;
  world::Shape shape;
  const char* second;  // its second setting ("" = none)
  float secondDefault;
};
const FnSpec kFns[] = {
    {"wave", world::Shape::kWave, "", 0},
    {"noise", world::Shape::kNoise, "speed", 1},
    {"flicker", world::Shape::kFlicker, "speed", 1},
    {"thump", world::Shape::kBeat, "fade", 7},
};
std::vector<std::string> fnNames() {
  std::vector<std::string> v;
  for (const FnSpec& f : kFns) v.push_back(f.name);
  return v;
}

}  // namespace

std::vector<std::string> Program::builtIn() { return fnNames(); }

void Program::readShape(const Line& l, Problems& p) {
  ShapeDef d;
  d.line = l.line;
  if (l.tokens.size() < 2 || l.tokens[1].kind != Tok::kWord) {
    problem(p, l.tokens[0], "a shape needs a one-word name", "shape candle (speed 1)");
    return;
  }
  const Token& name = l.tokens[1];
  d.name = name.text;
  for (const FnSpec& f : kFns)
    if (d.name == f.name) {
      problem(p, name, "`" + d.name + "` is already a word the engine has", "give your shape another name");
      return;
    }
  if (d.name == "time" || d.name == "each") {
    problem(p, name, "`" + d.name + "` is already a word the language uses", "give your shape another name");
    return;
  }
  for (const ShapeDef& o : shapes_)
    if (o.name == d.name) {
      problem(p, name, "there's already a shape `" + d.name + "` (line " + std::to_string(o.line) + ")", "give this one another name");
      return;
    }
  size_t at = 2;
  if (at < l.tokens.size() && l.tokens[at].is("(")) {
    const size_t close = findSymbol(l, ")", at);
    if (close >= l.tokens.size()) {
      problem(p, l.tokens[at], "the settings' brackets aren't closed", "shape candle (speed 1, size 40%)");
      return;
    }
    size_t s = at + 1;
    while (s < close) {
      const size_t end = std::min(findSymbol(l, ",", s), close);
      if (end - s < 2 || l.tokens[s].kind != Tok::kWord) {
        problem(p, l.tokens[std::min(s, close)], "a setting is a name and its usual value", "speed 1, or period 2 s");
        return;
      }
      Expr def;
      if (!parseExpr(l.tokens, s + 1, end, def, p)) return;
      if (std::find(d.params.begin(), d.params.end(), l.tokens[s].text) != d.params.end()) {
        problem(p, l.tokens[s], "`" + l.tokens[s].text + "` is named twice", "give each setting its own name");
        return;
      }
      d.params.push_back(l.tokens[s].text);
      d.defaults.push_back(def);
      s = end + 1;
    }
    at = close + 1;
  }
  Problems local;
  if (at < l.tokens.size() && l.tokens[at].is(":")) {
    if (!parseExpr(l.tokens, at + 1, l.tokens.size(), d.body, p)) return;
    if (!l.children.empty()) problem(p, l.children[0].tokens[0], "the shape is already given after the `:`", "keep one: after the `:` or on the line under it");
  } else if (at < l.tokens.size()) {
    problem(p, l.tokens[at], "`" + l.tokens[at].text + "` doesn't fit here", "shape candle (speed 1), then what it is on the line under it");
    return;
  } else if (l.children.size() != 1 || !l.children[0].children.empty()) {
    problem(p, l.tokens[1], l.children.empty() ? "what is `" + d.name + "`? nothing is under it" : "a shape is one expression, on one line under it",
        "  1 + 40% * flicker(period 0.5 s, speed speed)");
    return;
  } else if (!parseExpr(l.children[0].tokens, 0, l.children[0].tokens.size(), d.body, p)) {
    return;
  }
  shapes_.push_back(std::move(d));
  // Check it now, with its usual settings (a problem shows at its own line once).
  ShapeDef& made = shapes_.back();
  Expr call;
  call.kind = Expr::kCall;
  call.name = made.name;
  call.line = made.line;
  call.column = name.column;
  std::vector<std::string> using_;
  Expr flat;
  const size_t nodes = nodes_.size(), fns = fns_.size(), before = p.size();
  int salt = 0;
  if (!expand(call, {}, using_, flat, p) || compileFlat(flat, salt, p) < 0) made.broken = true;
  if (p.size() > before) made.broken = true;
  nodes_.resize(nodes);
  fns_.resize(fns);
}

const Program::ShapeDef* Program::shape(std::string_view name) const {
  for (const ShapeDef& d : shapes_)
    if (d.name == name) return &d;
  return nullptr;
}

std::vector<std::string> Program::wordNames() const {
  std::vector<std::string> v = fnNames();
  for (const ShapeDef& d : shapes_) v.push_back(d.name);
  return v;
}

bool Program::expand(const Expr& e, const std::vector<std::pair<std::string, Expr>>& env, std::vector<std::string>& using_,
                 Expr& out, Problems& p) {
  auto bad = [&](std::string what, std::string hint = {}) {
    p.push_back({e.line, e.column, std::move(what), std::move(hint), false});
    return false;
  };
  if (e.kind == Expr::kName) {
    for (const auto& [name, value] : env)
      if (name == e.name) {
        out = value;
        return true;
      }
    if (shape(e.name)) {  // a made shape with its usual settings: `candle`
      Expr call = e;
      call.kind = Expr::kCall;
      return expand(call, env, using_, out, p);
    }
    out = e;
    return true;
  }
  if (e.kind == Expr::kCall) {
    const ShapeDef* d = shape(e.name);
    if (!d) {  // a built-in: its settings may use the made shape's
      out = e;
      for (size_t i = 0; i < e.args.size(); ++i)
        if (!expand(e.args[i], env, using_, out.args[i], p)) return false;
      return true;
    }
    if (d->broken) return false;  // already told, at its own line
    if (std::find(using_.begin(), using_.end(), d->name) != using_.end()) {
      std::string chain;
      for (const std::string& u : using_) chain += u + " → ";
      return bad("`" + d->name + "` is made of itself (" + chain + d->name + ")", "a shape can't use itself, even through another");
    }
    if (using_.size() >= 16) return bad("shapes made of shapes go too deep here", "use fewer layers");
    std::vector<std::pair<std::string, Expr>> bound;
    std::vector<bool> given(d->params.size(), false);
    for (size_t i = 0; i < e.args.size(); ++i) {
      std::string name = e.argNames[i];
      if (name.empty()) {
        if (i >= d->params.size())
          return bad("`" + d->name + "` takes " + std::to_string(d->params.size()) + " setting" + (d->params.size() == 1 ? "" : "s"),
                     d->params.empty() ? "write just `" + d->name + "`" : "its settings: " + d->params[0] + (d->params.size() > 1 ? ", " + d->params[1] + "…" : ""));
        name = d->params[i];
      }
      const auto it = std::find(d->params.begin(), d->params.end(), name);
      if (it == d->params.end()) {
        std::string hint = didYouMean(name, d->params);
        if (hint.empty()) hint = d->params.empty() ? "`" + d->name + "` has no settings" : "its settings: " + d->params[0] + (d->params.size() > 1 ? ", " + d->params[1] + "…" : "");
        return bad("`" + name + "` isn't a setting of `" + d->name + "`", hint);
      }
      const size_t k = static_cast<size_t>(it - d->params.begin());
      Expr v;
      if (!expand(e.args[i], env, using_, v, p)) return false;
      bound.push_back({name, std::move(v)});
      given[k] = true;
    }
    for (size_t k = 0; k < d->params.size(); ++k)
      if (!given[k]) bound.push_back({d->params[k], d->defaults[k]});
    using_.push_back(d->name);
    const bool ok = expand(d->body, bound, using_, out, p);
    using_.pop_back();
    return ok;
  }
  out = e;
  for (size_t i = 0; i < e.args.size(); ++i)
    if (!expand(e.args[i], env, using_, out.args[i], p)) return false;
  return true;
}

int Program::compile(const std::vector<Token>& tokens, size_t from, size_t to, Problems& p, const Env& env) {
  Expr e;
  if (!parseExpr(tokens, from, to, e, p)) return -1;
  return compile(e, p, env);
}

int Program::compile(const Expr& e, Problems& p, const Env& env) {
  Expr flat;
  std::vector<std::string> using_;
  if (!expand(e, env, using_, flat, p)) return -1;
  int salt = 0;
  return compileFlat(flat, salt, p);
}

bool Program::fold(const Expr& e, double& value, std::string& unit) {
  switch (e.kind) {
    case Expr::kNumber:
      value = e.value;
      unit = e.unit;
      return true;
    case Expr::kNegate:
      if (!fold(e.args[0], value, unit)) return false;
      value = -value;
      return true;
    case Expr::kBinary: {
      double a, b;
      std::string ua, ub;
      if (!fold(e.args[0], a, ua) || !fold(e.args[1], b, ub)) return false;
      if (e.op == '+' || e.op == '-') {
        if (ua != ub) return false;
        value = e.op == '+' ? a + b : a - b;
        unit = ua;
      } else if (e.op == '*') {
        if (!ua.empty() && !ub.empty()) return false;
        value = a * b;
        unit = ua.empty() ? ub : ua;
      } else {
        if (!ub.empty() || std::fabs(b) < 1e-12) return false;
        value = a / b;
        unit = ua;
      }
      return true;
    }
    default:
      return false;
  }
}

int Program::compileFlat(const Expr& e, int& salt, Problems& p, int depth) {
  auto bad = [&](std::string what, std::string hint = {}) {
    p.push_back({e.line, e.column, std::move(what), std::move(hint), false});
    return -1;
  };
  // Working it out walks the expression's depth: a cap keeps the stack small.
  if (depth > 64) return bad("this is too long to work out in one go", "a brightness needs only a few terms");
  Node n;
  switch (e.kind) {
    case Expr::kNumber:
      if (e.unit == "s" || e.unit == "beats")
        return bad("a time can't be a brightness", "times go in a shape's period: noise(period 8 s)");
      if (e.unit == "K") return bad("a temperature can't be a brightness", "colours go on their own line: colour 2700 K");
      n.kind = Node::kNumber;
      n.value = e.value;
      break;
    case Expr::kName: {
      if (e.name == "time") {
        n.kind = Node::kTime;
        break;
      }
      const std::vector<std::string> fns = wordNames();
      if (std::find(fns.begin(), fns.end(), e.name) != fns.end())
        return bad("`" + e.name + "` needs its settings in brackets", e.name + "(period 4 s)");
      if (e.name.find('-') != std::string::npos)
        return bad("`" + e.name + "` isn't a name here", "to subtract, put spaces around the minus: 1 - 5%");
      std::vector<std::string> known = fns;
      known.push_back("time");
      std::string hint = didYouMean(e.name, known);
      return bad("`" + e.name + "` isn't a name here", hint.empty() ? "a brightness is numbers, `time` and shapes like noise(period 8 s)" : hint);
    }
    case Expr::kCall: {
      const FnSpec* spec = nullptr;
      for (const FnSpec& f : kFns)
        if (e.name == f.name) spec = &f;
      if (!spec) {
        const std::string hint = didYouMean(e.name, wordNames());
        return bad("`" + e.name + "` isn't a shape", hint.empty() ? "the shapes are wave, noise, flicker, thump and the ones this file makes" : hint);
      }
      std::vector<std::string> params{"period"};
      if (*spec->second) params.push_back(spec->second);
      double values[2] = {NAN, spec->secondDefault};
      std::string periodUnit;
      for (size_t i = 0; i < e.args.size(); ++i) {
        std::string name = e.argNames[i];
        if (name.empty()) {
          if (i >= params.size())
            return bad("`" + e.name + "` takes " + std::to_string(params.size()) + " setting" + (params.size() > 1 ? "s" : ""),
                       e.name + "(period 4 s" + (params.size() > 1 ? ", " + params[1] + " 1" : "") + ")");
          name = params[i];
        }
        const auto it = std::find(params.begin(), params.end(), name);
        if (it == params.end()) {
          const std::string hint = didYouMean(name, params);
          return bad("`" + name + "` isn't a setting of `" + e.name + "`", hint.empty() ? "its settings: " + params[0] + (params.size() > 1 ? ", " + params[1] : "") : hint);
        }
        const size_t k = static_cast<size_t>(it - params.begin());
        const Expr& a = e.args[i];
        // Told where the value is written (inside a made shape: where it's used).
        auto badValue = [&](std::string what, std::string hint) {
          p.push_back({a.line, a.column, std::move(what), std::move(hint), false});
          return -1;
        };
        double v = 0;
        std::string unit;
        if (!fold(a, v, unit))
          return badValue("`" + name + "` needs a number that doesn't change", name == "period" ? "period 8 s" : name + " 0.5");
        if (k == 0) {
          periodUnit = unit;
          if (periodUnit != "s" && periodUnit != "beats")
            return badValue("a period is a time", "write it in seconds or beats: period 8 s, period 2 beats");
          if (!(v > 0)) return badValue("a period must be more than 0", "period 1 s");
        } else if (!unit.empty()) {
          return badValue("`" + name + "` is a plain number", name + " " + std::to_string(static_cast<int>(v)));
        }
        values[k] = v;
      }
      if (std::isnan(values[0])) return bad("`" + e.name + "` needs a period: how long one round takes", e.name + "(period 4 s)");
      Fn f;
      f.together.period = f.apart.period = static_cast<float>(values[0]);
      f.together.beat = f.apart.beat = periodUnit == "beats";
      f.together.desync = false;
      f.apart.desync = true;
      f.piece.channel = world::kLight;
      f.piece.width = 1;
      f.piece.shape = spec->shape;
      f.piece.amp = {1, 1, 1};
      f.piece.salt = static_cast<uint32_t>(++salt);
      if (spec->shape == world::Shape::kBeat) f.piece.decay = static_cast<float>(values[1]);
      else if (*spec->second) f.piece.rate = static_cast<float>(values[1]);
      n.kind = Node::kFn;
      n.fn = static_cast<int>(fns_.size());
      fns_.push_back(f);
      break;
    }
    case Expr::kNegate:
      n.kind = Node::kNegate;
      n.a = compileFlat(e.args[0], salt, p, depth + 1);
      if (n.a < 0) return -1;
      break;
    case Expr::kBinary:
      n.kind = e.op == '+' ? Node::kAdd : e.op == '-' ? Node::kSub : e.op == '*' ? Node::kMul : Node::kDiv;
      n.a = compileFlat(e.args[0], salt, p, depth + 1);
      n.b = compileFlat(e.args[1], salt, p, depth + 1);
      if (n.a < 0 || n.b < 0) return -1;
      break;
  }
  nodes_.push_back(n);
  return static_cast<int>(nodes_.size()) - 1;
}

double Program::eval(int i, const At& c) {
  if (++steps_ > kBudget) {
    over_ = true;
    return 0;
  }
  const Node& n = nodes_[static_cast<size_t>(i)];
  switch (n.kind) {
    case Node::kNumber: return n.value;
    case Node::kTime: return c.clock->seconds;
    case Node::kFn: {
      const Fn& f = fns_[static_cast<size_t>(n.fn)];
      const world::Loop& loop = c.apart ? f.apart : f.together;
      world::Motion m;
      f.piece.add(loop.cycles(*c.clock, 0, c.seed), c.seed, 1, m);
      return m.ch[world::kLight];
    }
    case Node::kNegate: return -eval(n.a, c);
    case Node::kAdd: return eval(n.a, c) + eval(n.b, c);
    case Node::kSub: return eval(n.a, c) - eval(n.b, c);
    case Node::kMul: return eval(n.a, c) * eval(n.b, c);
    case Node::kDiv: {
      const double d = eval(n.b, c);
      return std::fabs(d) < 1e-9 ? 0 : eval(n.a, c) / d;
    }
  }
  return 0;
}


}  // namespace engine::words
