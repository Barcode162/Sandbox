#pragma once
// The world (docs/archive/ENGINE.md): every thing in a place, each sitting on its
// parent, each in a state, each state playing its loop, forever.
//
// Everything follows from the clock plus one fact per thing: **which state
// it's in and when that began**. Timed rules ("after one loop, back to
// idle") are worked out from the clock too, so every phone and the room
// agree without talking. Only outside events (a tap) make a Change that the
// network carries; the room runs the same rules and has the last word.
//
//   World w;  w.build(library, place, &errors);
//   each frame: w.update(clock);  then systems read w.thing(i).world, .motion
//   a tap:      w.send(i, "tap", clock.seconds);  w.takeChanges() → the room
//   from room:  w.apply(change)
//
// Pure logic, no GPU: tools/native/world_test.cpp.
#include <cstdint>
#include <limits>
#include <memory>
#include <string>
#include <string_view>
#include <unordered_map>
#include <vector>

#include "looped/math.h"
#include "looped/world/kind.h"
#include "looped/world/loop.h"

namespace engine::world {

// One fact the network carries: thing `net` entered state `state` at `start`
// (the shared clock, seconds).
struct Change {
  uint16_t net = 0;
  uint8_t state = 0;
  double start = 0;
  bool operator==(const Change&) const = default;
};

struct Thing {
  std::string id;
  uint16_t net = 0;         // the id's 16-bit hash, made unique (what the network carries)
  const Kind* kind = nullptr;
  int parent = -1;          // index, -1 = the place itself
  std::vector<int> children;
  // Rest: where it sits on its parent.
  Vec3 at;
  Quat rot;
  Vec3 scale{1, 1, 1};
  uint32_t seed = 1;
  float phase = 0;          // its loops run this much of a cycle later
  std::vector<std::pair<std::string, Json>> parts;  // overrides (the kind's are the rest)
  std::vector<Loop> loops;                          // overrides
  // Tuning (the hub's World page): its loops run `speed` times as fast, or
  // not at all. Looks only: rules and timed states keep the shared clock.
  float speed = 1;
  bool off = false;
  // Now.
  int state = 0;
  double start = 0;
  int prevState = -1;       // blending out of it
  double prevStart = 0;
  double due = std::numeric_limits<double>::infinity();  // a timed rule's moment
  // Results of update(): the loop's offsets and the place in the world.
  // A loop moves, turns and scales a thing in its own space, around its
  // kind's pivot; what sits on it goes along.
  Motion motion;
  Mat4 world;
};

class World {
 public:
  // Makes every thing in `place` (and the things inside their kinds). The
  // world keeps its own copy of the kinds, so `library` may go away.
  // Returns false (with the reasons) if a kind is missing or a parent can't
  // be found; things with problems are left out, the rest still work.
  bool build(const Library& library, const Place& place, std::string* errors);

  size_t size() const { return things_.size(); }
  const Thing& thing(int i) const { return things_[static_cast<size_t>(i)]; }
  int find(std::string_view id) const;  // -1 if none
  int findNet(uint16_t net) const;      // -1 if none
  // A part: the thing's override, else its kind's (a null value if neither).
  const Json& part(int i, std::string_view name) const;
  // The loop a state plays (the thing's override first), or nullptr.
  const Loop* loopOf(int i, int state) const;
  const State& stateOf(int i) const;

  // ---- Logic ----
  // An event for thing `i` at time `now` (seconds). Follows the rules; every
  // state change it causes (here and in things it sends to) is recorded for
  // takeChanges(). True if anything changed.
  bool send(int i, std::string_view event, double now);
  // Whether thing `i` has a rule for `event` in the state it's in now (what
  // a tap can wake: only things that would react are tappable).
  bool reacts(int i, std::string_view event) const;
  // An event for every thing (the music started, the lights went down):
  // things with a rule for it follow it, the rest ignore it.
  bool sendAll(std::string_view event, double now);
  // Puts a thing in a state directly (the room, tests, a game's own logic).
  // Runs the state's enter messages like any change.
  bool setState(int i, std::string_view state, double now);
  // A change from the network: taken as is (no rules run, they ran where it
  // was made). Ignored if it's already so.
  void apply(const Change& c);
  // The changes made by send/setState since the last call.
  std::vector<Change> takeChanges();

  // Tunes every thing of kind `kind` (see Thing::speed). Returns how many.
  int tune(std::string_view kind, float speed, bool off);

  // ---- Each frame ----
  // Timed rules up to `clock`, then every thing's motion and place.
  void update(const Clock& clock);

  // ---- Free things ----
  // Where a free thing is now (physics, input), on its parent.
  void setRest(int i, Vec3 at, Quat rot);
  // Its size on its parent (an editor resizing it).
  void setScale(int i, Vec3 scale);
  // A kind's life changed (the Studio's Loop Rack, S8): its loops, states and
  // rules are swapped in place for every thing of it (and every copy of this
  // world, which shares the kinds). Things in a state that's gone start over.
  // Returns how many things it reached (0: no such kind).
  int updateKind(const Kind& changed);
  // Moves a thing onto another parent (-1 = the place), keeping it where it
  // is in the world unless `at`/`rot` are given.
  void attach(int i, int parent);
  void attach(int i, int parent, Vec3 at, Quat rot);

  // ---- Checks ----
  // Every rule's target exists, every state plays a loop with something in
  // it (or the kind says why it's "still").
  // One line per problem; empty when all is well.
  std::vector<std::string> check() const;
  // Kinds marked "still" that are used here (to keep that list short).
  std::vector<std::string> stillKinds() const;

  static uint16_t netIdOf(std::string_view id);

 private:
  int make(const Library& lib, const ThingSpec& spec, int parent, const std::string& id, std::string* errors);
  void enter(int i, int state, double at, bool record, int depth);
  void deliver(int from, const Send& s, double at, bool record, int depth);
  bool fire(int i, std::string_view event, double at, bool record, int depth);
  void schedule(int i);
  void order();
  Mat4 rest(const Thing& t) const;   // where it sits on its parent
  Mat4 moved(const Thing& t) const;  // its loop, in its own space around the pivot
  Mat4 local(const Thing& t) const;  // rest * moved

  std::shared_ptr<const Library> library_;  // the kinds things point into (shared by copies)
  std::vector<Thing> things_;
  std::unordered_map<std::string, int> byId_;
  std::unordered_map<uint16_t, int> byNet_;
  std::vector<int> order_;  // parents before children
  bool orderDirty_ = true;
  std::vector<Change> changes_;
};

}  // namespace engine::world
