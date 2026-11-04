#pragma once
// Real light units (L1.2, docs/handbook/manual/light.md): lamps are described the way
// they're sold, in lumens (how much light) and Kelvin (its colour: 1800 K a
// candle, 2700 K a warm bulb, 6500 K daylight), and drawn with true
// inverse-square falloff. Plain C++ (no GPU), so tools/native/light_units_test
// checks it. The renderer's light unit is the candela (cd); surfaces come out
// in cd/m² ("nits"), and the eyes (looped/post.h) adapt to that.
#include <algorithm>
#include <cmath>

#include "looped/math.h"

namespace engine::light {

constexpr float kPi = 3.14159265f;

// Luminance (Rec. 709 weights, linear RGB).
inline float luminance(Vec3 c) { return 0.2126f * c.x + 0.7152f * c.y + 0.0722f * c.z; }

// The colour of a hot glowing body at `kelvin` (1000..15000 K) in linear
// sRGB with luminance 1: the Planckian locus (Kim et al.'s cubic fit of the
// CIE 1931 chromaticity) → XYZ → linear sRGB, negative parts clipped.
inline Vec3 kelvinColor(float kelvin) {
  const double t = std::clamp(static_cast<double>(kelvin), 1000.0, 15000.0);
  const double t2 = t * t, t3 = t2 * t;
  double x;
  if (t <= 4000) x = -0.2661239e9 / t3 - 0.2343589e6 / t2 + 0.8776956e3 / t + 0.179910;
  else x = -3.0258469e9 / t3 + 2.1070379e6 / t2 + 0.2226347e3 / t + 0.240390;
  const double x2 = x * x, x3 = x2 * x;
  double y;
  if (t <= 2222) y = -1.1063814 * x3 - 1.34811020 * x2 + 2.18555832 * x - 0.20219683;
  else if (t <= 4000) y = -0.9549476 * x3 - 1.37418593 * x2 + 2.09137015 * x - 0.16748867;
  else y = 3.0817580 * x3 - 5.87338670 * x2 + 3.75112997 * x - 0.37001483;
  // xyY (Y = 1) → XYZ → linear sRGB (D65).
  const double X = x / y, Y = 1.0, Z = (1.0 - x - y) / y;
  Vec3 c{static_cast<float>(3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z),
         static_cast<float>(-0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z),
         static_cast<float>(0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z)};
  c = {std::max(c.x, 0.0f), std::max(c.y, 0.0f), std::max(c.z, 0.0f)};
  const float l = luminance(c);
  return l > 0 ? c * (1.0f / l) : Vec3{1, 1, 1};
}

// A colour scaled to luminance 1 (the light's brightness then comes only
// from its lumens). Black stays black.
inline Vec3 unitLuminance(Vec3 c) {
  const float l = luminance(c);
  return l > 1e-6f ? c * (1.0f / l) : Vec3{0, 0, 0};
}

// Lumens of a lamp that shines every way (a bare bulb) → candela.
inline float candela(float lumens) { return lumens / (4.0f * kPi); }

// How far a light of `cd` candela matters: where the light falling on a
// surface drops to `minLux` (0.1 lux: about a full moon). It fades smoothly
// to zero over its last stretch (no ring where it stops), and much of what
// lies beyond comes back as bounced light anyway (L1.6).
constexpr float kMinLux = 0.1f;
constexpr float kMaxReach = 16.0f;
inline float reach(float cd, float minLux = kMinLux) {
  return std::clamp(std::sqrt(std::max(cd, 0.0f) / minLux), 0.5f, kMaxReach);
}

// Light reaching a surface `d` metres away, facing it (lux), from `cd`
// candela with a glowing part of radius `r` (no blow-up inside the bulb).
inline float illuminance(float cd, float d, float r) { return cd / std::max(d * d, r * r); }

// Classic lights (before L1.2) had an "intensity" around 0.5..3: a rough
// equivalent in lumens, for lights that don't say their lumens yet.
inline float lumensFromClassic(float intensity) { return intensity * 180.0f; }

}  // namespace engine::light
