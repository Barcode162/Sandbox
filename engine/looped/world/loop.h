#pragma once
// Loops and their pieces (docs/archive/ENGINE.md): the animation every thing plays,
// always, worked out from the shared clock alone. A loop lasts `period`
// seconds (or beats, locked to the music) and is made of pieces; a piece is
// one channel (move.y, turn.y, glow...) following one shape (a wave, keys,
// noise...). Pure maths, no GPU: the phone and the room get the same answer.
#include <cstdint>
#include <string>
#include <string_view>
#include <vector>

#include "looped/math.h"

namespace engine {
class Json;
}

namespace engine::world {

// The time everything sees: the room's clock (the same on every phone; the
// phone's own when offline) and the music's beat when a song plays.
struct Clock {
  double seconds = 0;
  double beats = 0;
  bool music = false;
};

// What a loop does to its thing this instant, as offsets from rest, one
// float per channel, so adding and blending are plain sums.
//   move  metres in the parent's space     turn  degrees (x pitch, y yaw, z roll)
//   scale +0.1 = 10% bigger                glow, light, alpha  +0.1 = 10% more
//   tint  added to the colour (rgb)        custom  named per kind ("open", "spin"...)
enum Channel : int {
  kMoveX, kMoveY, kMoveZ,
  kTurnX, kTurnY, kTurnZ,
  kScaleX, kScaleY, kScaleZ,
  kGlow, kLight, kAlpha,
  kTintR, kTintG, kTintB,
  kCustom0,
  kChannels = kCustom0 + 9,
};
struct Motion {
  float ch[kChannels] = {};
  Vec3 move() const { return {ch[kMoveX], ch[kMoveY], ch[kMoveZ]}; }
  Vec3 turn() const { return {ch[kTurnX], ch[kTurnY], ch[kTurnZ]}; }
  Vec3 scale() const { return {ch[kScaleX], ch[kScaleY], ch[kScaleZ]}; }
  Vec3 tint() const { return {ch[kTintR], ch[kTintG], ch[kTintB]}; }
};
// a + (b - a) * t, channel by channel.
Motion mix(const Motion& a, const Motion& b, float t);

// A named custom channel's index (kCustom0...), made on first use; -1 when
// all 9 are taken. Names are local to this program (never sent anywhere).
int customChannel(std::string_view name);
// "move.y", "turn", "glow", "tint.r", a custom name... → first channel and
// how many it covers (3 for "move", "turn", "scale.xyz"/"scale", "tint").
// false if unknown (custom names are always known).
bool parseChannel(std::string_view name, int* channel, int* width);

enum class Shape {
  kHold,     // a fixed offset (a door held open)
  kWave,     // amp * sin: smooth back and forth
  kKeys,     // keyframes over the loop: [[t, value], ...], t in 0..1
  kSteps,    // values in turn, each an equal slice of the loop
  kNoise,    // smooth random drift that never repeats
  kFlicker,  // mostly steady with seeded dips and buzz (neon, flame)
  kOrbit,    // around the anchor on a path that never quite repeats (moths)
  kBeat,     // a thump at the start of each cycle that fades (kick drum)
  kSpin,     // turns all the way round, `amp` turns per cycle
};
enum class Ease { kLinear, kSmooth, kStep };

struct Piece {
  int channel = kMoveY;
  int width = 1;          // 1 or 3 channels
  Shape shape = Shape::kWave;
  Vec3 amp{1, 1, 1};      // per channel of a 3-wide piece; x for 1-wide
  Vec3 offset;            // added after the shape
  int every = 1;          // repeats per loop (whole, so the loop still loops)
  float phase = 0;        // 0..1 of a repeat later
  float rate = 1;         // noise / flicker speed (changes per repeat)
  float decay = 7;        // beat: how fast the thump fades
  Ease ease = Ease::kSmooth;
  std::vector<float> keyT;  // keys: times 0..1, sorted
  std::vector<Vec3> keyV;   // keys / steps: values
  uint32_t salt = 0;        // seed mix, so two pieces of a loop differ
  // Adds this piece at `cycles` (loops done, any real number) to `out`.
  void add(double cycles, uint32_t seed, float weight, Motion& out) const;
};

struct Loop {
  std::string name;
  float period = 4;     // seconds, or beats when `beat`
  bool beat = false;    // counts in the music's beats (falls back to 120 bpm)
  bool restart = false; // starts from 0 when its state begins (actions);
                        // else runs on the shared clock (idle life)
  bool desync = true;   // each thing starts at its own point (two stools
                        // never sway in step); beat loops stay in step
  float blend = 0.3f;   // seconds to blend in from the state before
  std::vector<Piece> pieces;

  bool live() const { return !pieces.empty(); }
  // The loop's period in seconds (beats at 120 bpm when there's no music).
  double seconds() const { return beat ? period * 0.5 : period; }
  // Loops done at `clock` for a state that began at `start` (seconds).
  double cycles(const Clock& clock, double start, uint32_t seed) const;
  // Adds every piece at `cycles`.
  void add(double cycles, uint32_t seed, float weight, Motion& out) const;
};

// Reads {"period": 4, "beat": false, "pieces": [{"ch": "turn.y", "shape":
// "wave", "amp": 3}, ...]}. Problems are appended to `error` ("where: what").
Loop parseLoop(const Json& j, std::string_view name, std::string* error);

// Small helpers shared by the world's files.
uint32_t hash32(std::string_view text);      // FNV-1a
double hash01(uint32_t a, uint32_t b);       // repeatable random in [0, 1)
double noise1(double t, uint32_t seed);      // smooth noise in [0, 1)
Vec3 readVec3(const Json& j, Vec3 fallback); // [x, y, z] or one number for all
Quat eulerDegrees(Vec3 deg);                 // yaw (y), then pitch (x), then roll (z)

}  // namespace engine::world
