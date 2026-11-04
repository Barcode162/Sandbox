#pragma once
// A place in words → the world's place file (J116.3). Until the new
// skeleton draws places itself (J116.6), a place written in words is turned
// into the JSON the engine already reads (assets/world/places/<name>.json),
// so the game, the baker and the reference all see the same room. The
// words file is the source; the JSON is made from it, never by hand.
//
// Things made of a model become things of the world's kind with that model
// (`table` → round_table); things that give light become `word-light`
// things (assets/world/kinds/words.json) with their light, glowing box and
// what they do as a loop; a thing's parts that give light (a candle's
// flame, a lamp's bulb) become things of their own beside it.
#include <map>
#include <string>

#include "looped/words/place.h"

namespace engine::words {

// The world's kinds, by the model file they're made of.
struct KindOfModel {
  std::string kind;  // "round_table"
  std::string file;  // "kinds/bar.json"
};
using KindIndex = std::map<std::string, KindOfModel>;

// The place as the world's JSON text (one thing a line, as the hand-made
// places are written).
bool placeToJson(const Place& place, const std::string& id, const KindIndex& kinds, const Dictionary& dict, std::string& out,
                 Problems& p);

}  // namespace engine::words
