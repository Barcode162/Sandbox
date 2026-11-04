#pragma once
// Kinds and places (docs/archive/ENGINE.md): the files that make a world.
//
// A **kind** says what a thing is: its parts (the abilities each engine
// system reads: model, collider, seat, light, sound, shared, price...), its
// loops, its states (each with a loop and rules), and the smaller things it
// is made of (a jukebox's record, a lamp's moths), placed relative to it.
// A kind can build on another ("is": "furniture") and change what differs.
//
//   {"id": "stool", "is": "furniture", "about": "A bar stool.",
//    "parts": {"model": {"file": "stool.glb"}, "seat": {"height": 0.75}},
//    "loops": {"creak": {"period": 7, "pieces": [{"ch": "turn.y", "shape": "wave", "amp": 0.6}]},
//              "spin":  {"period": 1, "restart": true, "pieces": [{"ch": "turn.y", "shape": "spin"}]}},
//    "states": {"idle": {"loop": "creak", "on": {"tap": "spun"}},
//               "spun": {"loop": "spin", "afterLoops": 1, "next": "idle"}},
//    "start": "idle",
//    "things": [{"id": "cushion", "kind": "cushion", "at": [0, 0.74, 0]}]}
//
// A **place** is the list of things and where they sit (a parent and an
// offset: "the glass is on the counter"):
//
//   {"id": "bar", "kinds": ["kinds/furniture.json"],
//    "things": [{"id": "counter", "kind": "counter", "at": [0, 0, -4]},
//               {"kind": "stool", "at": [-3, 0, -3], "row": {"count": 6, "step": [1, 0, 0]}},
//               {"id": "glass-1", "kind": "glass", "parent": "counter", "at": [0.2, 1.1, 0]}]}
//
// Pure data and logic, no GPU: the phone and the room read the same files.
#include <cstdint>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

#include "looped/json.h"
#include "looped/math.h"
#include "looped/world/loop.h"

namespace engine::world {

// A message a state sends when it begins: `event` to `to` ("self", "parent",
// "children", "all" (every thing in the place), a child's id, or "#<thing
// id>" anywhere in the place).
struct Send {
  std::string event;
  std::string to = "self";
};

struct State {
  std::string name;
  std::string loop;  // a loop's name in the kind
  // Rules: event → the state it leads to.
  std::vector<std::pair<std::string, std::string>> on;
  // Timed: after `after` seconds, or `afterLoops` of its loop, go to `next`.
  float after = -1;
  float afterLoops = -1;
  std::string next;
  std::vector<Send> enter;
  bool free = false;  // its place comes from physics or input (thrown, walking)
};

// One thing to make: in a place, or inside a kind (then `at` is relative to
// the kind's thing and `id` is joined to it: "jukebox-1/record").
struct ThingSpec {
  std::string id;      // empty: made from the kind and position
  std::string kind;
  std::string parent;  // a thing's id in the place ("" = the place itself)
  Vec3 at;
  Vec3 turn;           // degrees (x pitch, y yaw, z roll); a number = yaw
  Vec3 scale{1, 1, 1};
  Quat rotation;       // turned further by this (code that has a quaternion)
  float phase = 0;     // its loops start this much of a cycle later (0..1):
                       // a row of lights that breathe one after another
  std::string state;   // "" = the kind's start
  uint32_t seed = 0;   // 0 = from the id
  std::vector<std::pair<std::string, Json>> parts;  // overrides, by part name
  std::vector<Loop> loops;                          // overrides, by loop name
};

struct Kind {
  std::string id, about, is;
  std::string still;  // why this kind may stand still (else every state must loop)
  std::vector<std::pair<std::string, Json>> parts;
  std::vector<Loop> loops;
  std::vector<State> states;
  std::vector<std::pair<std::string, std::string>> on;  // rules in every state
  std::string start;
  std::vector<ThingSpec> things;
  // The point its loops turn and scale around, in its own space (a hanging
  // lamp: the hook; a stool: the floor under its middle). Default: its origin.
  Vec3 pivot;

  const Json& part(std::string_view name) const;
  const Loop* loop(std::string_view name) const;
  int state(std::string_view name) const;  // -1 if none
};

// Every kind a world can use, with "is" resolved (each kind complete).
class Library {
 public:
  // Reads a kind file: one kind {"id": ...} or {"kinds": [...]}. Problems
  // go to `errors()`; a kind with the same id replaces the older one.
  void add(std::string_view text, std::string_view file);
  // Fills in "is" (after every file is added). Safe to call again.
  void resolve();
  const Kind* find(std::string_view id) const;
  const std::vector<Kind>& kinds() const { return kinds_; }
  const std::string& errors() const { return errors_; }

 private:
  bool resolveOne(size_t i, int depth);
  std::vector<Kind> kinds_;
  std::vector<Kind> raw_;  // as written, before "is"
  std::string errors_;
};

struct Place {
  std::string id, about;
  std::vector<std::string> kindFiles;  // paths, read by the caller
  std::vector<ThingSpec> things;       // rows already expanded
};
// Reads a place file. Problems are appended to `error`.
Place parsePlace(std::string_view text, std::string* error);

// Reads one thing ({"id", "kind", "parent", "at", "turn", "scale", "state",
// "seed", "parts", "loops"}); shared by places and kinds.
ThingSpec parseThing(const Json& j, std::string_view where, std::string* error);

}  // namespace engine::world
