#pragma once
// Places in words (J116.3; the plan: docs/plan/jobs/J116.md → The language
// everywhere). A place is a block of sentences:
//
//   place the light lab
//     a room 6 by 6 and 3 high, with an oak floor, plaster walls and a brick back wall
//     a round table in the middle
//     a candle on the table
//     two stools by the table, facing it
//     a pendant lamp hanging from the ceiling, 1.4 m left and 1.2 m back
//     a bare bulb in the near right corner, near the ceiling
//     a pink neon tube on the left wall, 2.1 m up, 0.6 m forward
//     when the lights go down, the pendant lamp and the bulb dim to a quarter
//
// Each line is a thing phrase (read by Words, looped/words/words.h) and where
// it goes, said with place words: `in the middle`, `on the <thing>`, `by the
// <thing>`, `hanging from the ceiling`, `in the <near|far> <left|right>
// corner`, `on the <left|right|back|front> wall`, `near the ceiling`, moves
// (`1.4 m left`, `20 cm up`), `at <x> <y> <z>`, `turned <degrees>`, `facing
// it`, `called <name>`. Left is -x, right +x, back (far) -z, front (near) +z,
// the floor at y 0, the middle of the room at x 0, z 0.
//
// Cause words: `when <something happens>, <things> <change>` and `while
// <something is so>, <things> <change>` tie events to changes; the runner
// (Place::level) keeps them true. Changes: `dim to a quarter | half | <n>%`,
// `go out`, `light up`, `brighten to <n>%`.
//
// One sentence, one meaning: a line the reader can't place is a problem
// with its line, column, plain words and a hint. Plain C++.
#include <functional>
#include <string>
#include <string_view>
#include <vector>

#include "looped/math.h"
#include "looped/words/words.h"

namespace engine::words {

// A model's size (metres, at its own scale): from the caller, who can read
// model files (the tools); the reader falls back to a box's size.
struct ModelSize {
  Vec3 min, max;
  bool known = false;
};
using ModelSizer = std::function<ModelSize(const std::string& file)>;

// The room's shell: a floor, four walls and a ceiling.
struct Shell {
  bool has = false;
  float width = 0, depth = 0, height = 0;  // x, z, y (metres)
  float thickness = 0.2f;
  struct Face {
    std::string material;  // a material's id ("oak-floor"), "" for the default
    bool coloured = false;
    Vec3 colour;
  };
  Face floor, ceiling, left, right, back, front;
};

// A thing placed in the place.
struct Placed {
  std::string name;  // its id ("table", "stool-2")
  std::string word;  // its thing word ("table")
  Thing thing;       // what the phrase made
  Vec3 at;           // its foot (models) or middle (boxes, lights), in the place
  float turn = 0;    // degrees about y
  int line = 0;
  ModelSize size;  // as placed (unturned)
};

// A cause rule: when or while something, these things change.
struct Rule {
  bool whilst = false;          // `while` (holds while the event is on) or `when` (from then on)
  std::string event;            // "the lights go down"
  std::vector<std::string> things;  // names of placed things
  float level = 1;              // their light's brightness factor (0 = out)
  int line = 0;
};

struct Place {
  std::string name;  // "the light lab"
  std::string about;
  Shell shell;
  std::vector<Placed> things;
  std::vector<Rule> rules;
  Vec3 spawn{0, 1.65f, 2};
  float spawnYaw = 0;
  const Placed* find(std::string_view name) const;
  // A thing's light level now, from the events that are on (`on`: every
  // event happening now). 1 = as its words say.
  float level(std::string_view thing, const std::vector<std::string>& on) const;
};

// Reads a place file (one `place` block). `materials`: the world's material
// ids, for `oak floor` → "oak-floor"; `sizer` reads model sizes.
bool readPlace(Words& words, std::string_view text, const std::string& file, const std::vector<std::string>& materials,
               const ModelSizer& sizer, Place& out, Problems& p);

}  // namespace engine::words
