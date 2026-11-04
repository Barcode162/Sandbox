#pragma once
// The light grid (J116.3; the plan: docs/plan/jobs/J116.md → The light):
// light worked out once at points on a grid through the room, for what
// isn't in the light texture (small and fiddly things: stools, glasses,
// people, and later anything physics moves). Each point keeps the light
// falling on a surface facing each of the six ways (+x, -x, +y, -y, +z, -z),
// per light channel ("ambient cube", as Half-Life 2 lit its characters);
// a surface facing n gets the six mixed by n's squared parts, and a point
// between grid points mixes the eight around it. Points inside walls or
// furniture are marked and left out of the mix, so light never leaks
// through a wall. Plain C++, many threads.
#include <cstdint>
#include <vector>

#include "looped/bake/light_paths.h"
#include "looped/math.h"

namespace engine::bake {

struct ProbeGrid {
  Vec3 lo;            // the first point
  float step = 0.25f;
  int nx = 0, ny = 0, nz = 0;
  int channels = 0;
  std::vector<float> light;   // per point: 6 ways x channels x rgb (lux at brightness 1)
  std::vector<uint8_t> open;  // per point: 1 = in the open (used), 0 = inside something
  int lamps = 0;
  std::vector<uint8_t> seen;  // per point: per lamp, how much of it can be seen from there (0..255)
  size_t count() const { return static_cast<size_t>(nx) * ny * nz; }
  size_t index(int x, int y, int z) const { return (static_cast<size_t>(z) * ny + y) * nx + x; }
  Vec3 point(int x, int y, int z) const { return lo + Vec3{x * step, y * step, z * step}; }
  // What the frame does for a thing lit from the grid: the bounced light
  // from the grid plus each lamp's own light worked out at the pixel,
  // times how much of the lamp the grid says can be seen from there.
  // out: per channel (lux at brightness 1).
  void shade(const Room& room, Vec3 p, Vec3 n, Vec3* out) const;
  // How much of lamp `l` can be seen from p (0..1, from the points around).
  float seenFrom(Vec3 p, Vec3 n, int l) const;
  // The bounced light (no lamp's own light: that's worked out per pixel)
  // falling on a surface at `p` facing `n` from channel `c` (or
  // every channel at brightness 1 when c < 0).
  Vec3 at(Vec3 p, Vec3 n, int c = -1) const;
  // The same for every channel at once (out: channels entries).
  void atAll(Vec3 p, Vec3 n, Vec3* out) const;
};

struct ProbeSettings {
  float step = 0.25f;
  int samples = 128;  // paths per way
  int bounces = 4;
  int threads = 4;
};

// Bakes the grid over the box [lo, hi].
ProbeGrid bakeProbes(const Room& room, Vec3 lo, Vec3 hi, int channels, const ProbeSettings& s, double* ms = nullptr);

}  // namespace engine::bake
