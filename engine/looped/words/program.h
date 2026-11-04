#pragma once
// Numbers that change over time, written in words (J116.2): expressions
// such as `1 + 6% * noise(period 8 s, speed 0.5)`, the engine's own shapes
// (wave, noise, flicker, thump: the world's loop shapes, looped/world/loop.h),
// made shapes (`shape breathe (by 6%): 1 + by * noise(period 8 s)`, request
// 2026-10-27 #10) and settings bound by name (a word's `amount`, `every`).
// Compiled once to a small tree of steps; worked out with a step budget so a
// runaway can't freeze the bar. Shared by the light rig and the words.
#include <cstdint>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

#include "looped/words/syntax.h"
#include "looped/world/loop.h"

namespace engine::words {

class Program {
 public:
  // Names bound to expressions while compiling (a shape's or a word's settings).
  using Env = std::vector<std::pair<std::string, Expr>>;
  static constexpr size_t kBudget = 8000;  // steps per update (the bar's rig needs about 300)

  // `shape <name> (<setting> <usual value>, ...): <expression>`, or the
  // expression on the one line under it.
  void readShape(const Line& l, Problems& p);
  bool hasShape(std::string_view name) const { return shape(name) != nullptr; }
  // The engine's shapes, and the engine's and made shapes together.
  static std::vector<std::string> builtIn();
  std::vector<std::string> wordNames() const;

  // An expression from tokens [from, to) or a read one; its names may be
  // bound by `env`. Returns its handle, or -1 (with a problem).
  int compile(const std::vector<Token>& tokens, size_t from, size_t to, Problems& p, const Env& env = {});
  int compile(const Expr& e, Problems& p, const Env& env = {});

  // Working one out: at the clock, with a seed (each lamp's own flicker)
  // and `apart` (each its own start, as the world's desynced loops).
  struct At {
    const world::Clock* clock = nullptr;
    uint32_t seed = 1;
    bool apart = false;
  };
  double eval(int expr, const At& at);
  // A new update's budget.
  void newUpdate() {
    steps_ = 0;
    over_ = false;
  }
  size_t steps() const { return steps_; }
  bool overBudget() const { return over_; }

  // A number worked out now (settings): its value and unit; false if it
  // changes with time or mixes units.
  static bool fold(const Expr& e, double& value, std::string& unit);

 private:
  struct Fn {
    world::Loop together, apart;  // timing without and with each one's own start
    world::Piece piece;
  };
  struct Node {
    enum Kind { kNumber, kTime, kFn, kNegate, kAdd, kSub, kMul, kDiv } kind = kNumber;
    double value = 0;
    int a = -1, b = -1, fn = -1;
  };
  struct ShapeDef {
    std::string name;
    std::vector<std::string> params;
    std::vector<Expr> defaults;
    Expr body;
    int line = 0;
    bool broken = false;
  };
  const ShapeDef* shape(std::string_view name) const;
  // A copy of `e` with every made shape replaced by what it's made of and
  // its settings by their values; false (with a problem) if one can't be.
  bool expand(const Expr& e, const Env& env, std::vector<std::string>& using_, Expr& out, Problems& p);
  int compileFlat(const Expr& e, int& salt, Problems& p, int depth = 0);

  std::vector<Node> nodes_;
  std::vector<Fn> fns_;
  std::vector<ShapeDef> shapes_;
  size_t steps_ = 0;
  bool over_ = false;
};

}  // namespace engine::words
