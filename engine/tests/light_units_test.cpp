// Real light units (looped/light_units.h): colour temperature, lumens,
// reach. Run by tools/native/run.sh.
#include <cstdio>
#include <cstdlib>

#include "looped/light_units.h"

using namespace engine;

static int failures = 0;
static void check(bool ok, const char* what) {
  if (!ok) { std::printf("FAIL: %s\n", what); ++failures; }
}

int main() {
  // Warm light is red-heavy, daylight balanced, cold light blue-heavy.
  const Vec3 candle = light::kelvinColor(1900), warm = light::kelvinColor(2700), day = light::kelvinColor(6500),
             cold = light::kelvinColor(10000);
  check(candle.x > candle.y && candle.y > candle.z, "1900 K: red > green > blue");
  check(warm.x > warm.z * 2, "2700 K: much more red than blue");
  check(std::abs(day.x - day.z) < 0.15f && std::abs(day.y - 1.0f) < 0.1f, "6500 K: nearly white (D65)");
  check(cold.z > cold.x, "10000 K: more blue than red");
  for (float k : {1000.f, 1900.f, 2700.f, 4000.f, 6500.f, 15000.f}) {
    check(std::abs(light::luminance(light::kelvinColor(k)) - 1.0f) < 1e-3f, "kelvinColor has luminance 1");
  }
  // 400 lm bare bulb ≈ 31.8 cd; 2 m away ≈ 8 lux.
  const float cd = light::candela(400);
  check(std::abs(cd - 31.83f) < 0.1f, "400 lm = 31.8 cd");
  check(std::abs(light::illuminance(cd, 2, 0.05f) - 7.96f) < 0.05f, "8 lux at 2 m");
  check(light::illuminance(cd, 0.01f, 0.05f) == cd / (0.05f * 0.05f), "no blow-up inside the bulb");
  // Reach: a candle a few metres, a bulb across a room, capped.
  check(light::reach(light::candela(12)) > 2.5f && light::reach(light::candela(12)) < 4, "a candle reaches ~3 m");
  check(light::reach(light::candela(400)) == light::kMaxReach, "a 400 lm bulb reaches the cap");
  check(light::reach(0) == 0.5f, "a dark light still has a small reach");
  if (failures) return 1;
  std::printf("light units: all checks passed (2700 K = %.2f %.2f %.2f)\n", warm.x, warm.y, warm.z);
  return 0;
}
