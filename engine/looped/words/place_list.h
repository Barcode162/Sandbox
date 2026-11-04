#pragma once
// A place as a list in words (J118.1): the bar, written one line per thing,
// made into the world's place file. The lab's place (place.h) is said with
// place words (`a candle on the table`); a big place made by hand over many
// jobs is a list of exact spots instead, still in words:
//
//   place the bar
//     about: the bar, every thing in it
//     kinds from kinds/bar.json
//     you come in at 0.4 1.65 5.2, facing 0
//     the air: ambient 0.07 0.05 0.045, fogDensity 0.008
//     a room: id arcade, min 0.25 -0.2 -15.85, max 8.55 3.6 -7.6
//     an area arcade: min 0.4 0 -15.7, max 8.4 3.4 -7.7
//     a point arcade-door at 3.7 1.2 -7.4
//
//     the hall at 0 0 0
//     a bar stool at -7.04 0 -4.04, turned -16.3, scaled 0.97, called stool-left, held by hall
//     a wall prop at 1 2 -7, made of tin_sign.glb in painted-tin, called tin_sign_1
//       its light: color 1 0.18 0.55, lumens 180, wall yes
//       a seat: name "Racing sim", hip 0 0.4 0.2, kind sim
//
// A thing line: `a | an | the` and its kind's words (bar_stool → bar stool;
// `a thing of kind <id>` when the words could mean two kinds), `at x y z`,
// then any of `turned <degrees>`, `scaled <size>`, `made of <model> in
// <material>`, `called <id>`, `held by <id>`. Its id is "<kind>-<n>" (its
// n-th of that kind), the kind's own id for `the`, or what `called` says.
// Under it, `its <part>: <setting> <value>, …` sets one part; `a <part>:`
// adds one more to a list of parts (a seat → seats). At the place's level,
// `the <name>:` is a setting group (the light grid → lightGrid) and `a
// <name>:` one more of a list (a room → rooms).
//
// Values: numbers (several make a list: a spot, a colour), lists of lists
// joined by `to`, `yes` / `no`, a bare word, two or more bare words (a list
// of names), or "quoted text" (\" \\ \n inside).
//
// The numbers are kept as written, so the file made from the words gives
// back exactly the values in them. Plain C++.
#include <functional>
#include <map>
#include <string>
#include <string_view>
#include <vector>

#include "looped/words/syntax.h"

namespace engine::words {

// A kind file's kind ids ("kinds/bar.json" → bar_stool, hall, …): from the
// caller, who can read files.
using KindsOf = std::function<std::vector<std::string>(const std::string& file)>;

// Is this text a list place (it says `kinds from`)?
bool isPlaceList(std::string_view text);

// Reads a list place and writes the world's JSON text (`id`: the place's
// file name). `things`: how many things it has.
bool placeListToJson(std::string_view text, const std::string& id, const KindsOf& kindsOf, std::string& json, int& things,
                     Problems& p);

}  // namespace engine::words
