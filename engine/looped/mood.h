#pragma once
// A scene's mood (looped/post.h draws it): no GPU code here, so game layouts
// that pick a mood stay buildable by the native tests.
#include "looped/math.h"

namespace engine {

// How a scene feels after it's drawn. The defaults change little. No glow
// (bloom) is painted around bright things: only real light (J92).
struct Mood {
  Vec3 tint{1, 1, 1};           // e.g. warm amber (1.05, 1.0, 0.93)
  float saturation = 1;
  float contrast = 1;
  float lift = 0;               // raises the darkest parts a little (0..0.1)
  float vignette = 0.2f;        // darker corners (0 = none)
  // Eyes (new lighting, L1.1): how the exposure follows the scene.
  float exposureComp = -1.3f;   // EV: + brighter, - darker than "middle grey"
  float eyeDarkest = -9;        // log2 of the dimmest average light eyes adapt to (darker stays dark)
  float eyeBrightest = 6;       // log2 of the brightest
  float adaptBright = 0.6f;     // seconds to settle when it gets brighter
  float adaptDark = 1.4f;       // seconds when it gets darker (eyes open up slower)
  // Eyes don't make every room middle grey: a dim room still looks dim.
  // `eyeKeep` (0..1) is how much of a room's darkness (or brightness) away
  // from `eyeReference` (log2 light) stays visible after adapting.
  float eyeKeep = 0.6f;
  float eyeReference = -1.5f;
  // White balance: eyes partly correct the colour of the light, so warm
  // bulbs look warm but not orange. Light of `whiteKelvin` would look
  // `whiteAmount` (0..1) of the way to white.
  float whiteKelvin = 2700;
  float whiteAmount = 0.55f;
  // The curve's highlights (new lighting): EV of extra room before bright
  // light turns white, and how much bright light keeps its colour (0..1;
  // 0 = pure AgX, where a lamp-lit wall goes white as it gets bright).
  float highlightRoom = 2.0f;
  float highlightColour = 0.65f;
};

}  // namespace engine
