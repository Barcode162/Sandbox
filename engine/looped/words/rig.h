#pragma once
// The light rig (J116.2): the first thing written in Looped Script. It says
// how the room's lights change over time (flicker, breathing, the music's
// beat, the switch, moods); the world still says where each lamp is, how
// many lumens and what colour (assets/world/). Example (the bar's own:
// assets/world/rigs/bar.looped):
//
//   light strings: string-light-*
//     state calm
//       brightness each 1 + 4% * noise(period 9 s, speed 0.4)
//       when music: go to dancing
//     state dancing
//       brightness 1 - 1.5% + 8% * thump(period 2 beats, fade 5)
//       when quiet: go to calm
//     when lights down: fade to 25% over 1 s
//
// Each `light` is one light channel: its lamps always change together, so
// the baker (J116.3) works out their light once and the frame relights it
// with one number. `each` gives every lamp its own flicker (the channel then
// carries their average). The shapes (wave, noise, flicker, thump) are the
// world's loop shapes (looped/world/loop.h), so a rig and a kind's loop
// with the same numbers move alike. Safe: no files, no network; each update
// has a step budget (8000 steps; the bar's rig takes about 300). Plain C++.
#include <cstdint>
#include <string>
#include <string_view>
#include <vector>

#include "looped/math.h"
#include "looped/words/program.h"
#include "looped/words/syntax.h"
#include "looped/world/loop.h"

namespace engine::words {

// A lamp a rig can name: its thing's id and kind, its seed (its own
// flicker, as the world's), its lumens and colour temperature (0 = a
// coloured light without one).
struct LampInfo {
  std::string id, kind;
  uint32_t seed = 1;
  float lumens = 0;
  float kelvin = 0;
};

class Rig {
 public:
  struct Channel {
    std::string name;
    std::vector<int> lamps;
    bool each = false;  // its lamps flicker each their own way somewhere
    int line = 0;
  };

  // Reads and checks a rig against the place's lamps and the events it can
  // send. Problems are appended; with an error the rig stays empty (every
  // lamp steady at 1) and load returns false.
  bool load(std::string_view text, const std::vector<LampInfo>& lamps, const std::vector<std::string>& events,
            Problems& problems);
  bool loaded() const { return !lights_.empty(); }

  const std::vector<Channel>& channels() const { return channels_; }
  int channelOf(int lamp) const { return lamp >= 0 && lamp < static_cast<int>(lampLight_.size()) ? lampLight_[lamp] : -1; }

  // Something happened at `seconds` ("music", "quiet", "fire-off",
  // "lights-down"...): every light with a `when` for it reacts.
  void send(std::string_view event, double seconds);
  // A mood by name ("" = none), eased in over `over` seconds.
  bool setMood(std::string_view mood, double seconds, double over = 1);
  // Works out every light at `clock`.
  void update(const world::Clock& clock);

  // Lamp i's colour times brightness ({1, 1, 1} = as the world gives it).
  Vec3 lamp(int i) const;
  // A channel's: its lamps' average, weighted by their lumens.
  Vec3 channel(int k) const { return k >= 0 && k < static_cast<int>(channelValue_.size()) ? channelValue_[k] : Vec3{1, 1, 1}; }
  // The state a light is in ("" if it has none).
  std::string stateOf(std::string_view light) const;
  size_t steps() const { return program_.steps(); }
  bool overBudget() const { return program_.overBudget(); }

 private:
  struct Bright {
    int expr = -1;
    bool each = false;
  };
  struct Action {
    bool go = true;      // go to a state; else fade the dimmer
    std::string stateName;
    int state = -1;
    int target = -1;     // fade: the expression
    double over = 0.3;   // seconds
    int line = 0, column = 0;
  };
  struct When {
    std::string event;
    Action action;
  };
  struct State {
    std::string name;
    Bright bright;
    bool hasTint = false;
    Vec3 tint{1, 1, 1};
    std::vector<When> whens;
    int line = 0;
  };
  struct Light {
    std::string name;
    int line = 0;
    std::vector<int> lamps;
    uint32_t seed = 1;
    float kelvin = 0;  // its lamps' shared temperature (0 = none or mixed)
    Bright bright;
    bool hasTint = false;
    Vec3 tint{1, 1, 1};
    std::vector<State> states;
    std::vector<When> whens;
    // Live.
    int state = 0, prev = -1;
    double start = 0, prevStart = 0, blend = 0.3;
    double dimFrom = 1, dimTo = 1, dimStart = 0, dimOver = 0;
  };
  struct MoodSet {
    int light = -1;
    int expr = -1;
    bool hasTint = false;
    Vec3 tint{1, 1, 1};
  };
  struct Mood {
    std::string name;
    std::vector<MoodSet> sets;
  };
  // Reading (rig.cpp).
  void readLight(const Line& l, Problems& p);
  void readMood(const Line& l, Problems& p);
  bool readSelectors(const Line& l, size_t from, Light& light, Problems& p);
  bool readSetting(const Line& l, Light& light, State* state, Problems& p);
  bool readWhen(const Line& l, std::vector<When>& out, Problems& p);
  bool readColour(const Line& l, size_t from, size_t to, const Light& light, Vec3& tint, Problems& p);
  // Running.
  double brightness(const Light& L, int state, const world::Clock& clock, uint32_t seed, bool apart);
  double dimmer(const Light& L, double now) const;

  std::vector<LampInfo> lamps_;
  std::vector<std::string> events_;
  Program program_;  // every expression (and made shape) of the rig
  std::vector<Light> lights_;
  std::vector<Mood> moods_;
  std::vector<Channel> channels_;
  std::vector<int> lampLight_;
  std::vector<Vec3> lampValue_, channelValue_;
  int mood_ = -1, moodFrom_ = -1;
  double moodStart_ = 0, moodOver_ = 0;
  double now_ = 0;
};

}  // namespace engine::words
