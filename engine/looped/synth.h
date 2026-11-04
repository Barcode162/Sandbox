#pragma once
// Sounds made in code (no sample files): a piano note, a plucked string,
// and the bar's small effects (bell, dart thunk, glass clink, pour, shaker,
// click, an engine hum). Each returns mono samples at `rate` per second,
// ready for engine::Sound (looped/audio.h).
#include <vector>

namespace engine::synth {

constexpr float kRate = 22050;  // samples per second for everything here

// A grand piano note (MIDI key 21 = A0 ... 108 = C8): inharmonic partials,
// three slightly detuned strings, a hammer knock, a two-stage decay.
std::vector<float> pianoNote(int midiKey);
// A plucked string (Karplus-Strong), e.g. the guitar on the stage.
std::vector<float> pluck(float frequency, float seconds, float brightness = 0.5f);

enum class Effect {
  kBell,      // the service bell on the bar
  kThunk,     // a dart hitting the board
  kClink,     // glass on glass
  kPour,      // liquid pouring
  kShake,     // cocktail shaker
  kClick,     // a switch or button
  kEngine,    // one second of engine hum, made to loop (change its rate for revs)
  kWhoosh,    // something thrown
  kKnock,     // knocking on a door
  kCheer,     // a small crowd cheer (a 180 in darts)
  kCrackle,   // a fire's crackle: a few sharp pops (E6)
  kBuzz,      // old neon's hum, swelling and fading
  kBong,      // a metal lamp shade knocked
  kWood,      // a knuckle on a wooden table
  kCount,
};
std::vector<float> effect(Effect e);

// The arcade's background music: an original chiptune loop, about 27 s,
// seamless (play it with loop = true).
std::vector<float> arcadeLoop();

}  // namespace engine::synth
