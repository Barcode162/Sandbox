#pragma once
// The room's light worked out the slow, exact way (J116.1): paths of light
// traced through every still surface, every lamp at its real size and
// brightness, every bounce, with no shortcuts. It is the standard the baked
// light (J116.3) is measured against, and the baker's own building block
// (the same lamps, the same sampling). Plain C++, many threads; runs in the
// native tools (tools/native/light_tool.cpp `ref`).
//
// Units as the renderer's (looped/light_units.h): lamps in candela, light
// falling on a surface in lux, what the eye sees in cd/m² (nits). Surfaces
// are matte (their measured average colour; shine is checked on its own).
#include <cstdint>
#include <vector>

#include "looped/bvh.h"
#include "looped/math.h"
#include "looped/mood.h"
#include "looped/render_scene.h"
#include "looped/scene_geometry.h"

namespace engine::bake {

// A lamp as light transport sees it: the world's light, in candela.
struct Lamp {
  Vec3 position;
  Vec3 color{1, 1, 1};  // luminance 1 (the brightness is `cd`)
  float cd = 0;         // ball, tube: every way; panel: head-on, per face
  float radius = 0.05f;
  int shape = 0;        // 0 ball, 1 tube, 2 panel (looped/render_scene.h PointLight)
  Vec3 axis, axis2;     // half length / half sides
  bool oneSided = false;
  int model = -1;       // its own placed model: never shadows it
  int channel = 0;      // the light channel it belongs to (J116.2's rig)
};

// The world's light → a lamp. Physically, a one-sided panel (a sign on a
// wall) sends all its lumens forward: head-on lumens / pi. The renderer
// gives it a two-sided panel's lumens / 2 pi, half that, and the world's
// lumens were tuned by eye that way (J116.1 found it); `halfOneSided` keeps
// the renderer's rule, so the baked room looks as tuned.
Lamp lampOf(const PointLight& p, bool halfOneSided = true);
// For the tools: the renderer's rule unless PHYSICAL_PANELS=1 is set.
std::vector<Lamp> lampsOf(const std::vector<PointLight>& lights);

// A random number source per path (PCG32): the same seed, the same picture.
struct Rng {
  uint64_t state = 0x853c49e6748fea9bull, inc = 0xda3e39cb94b95bdbull;
  explicit Rng(uint64_t seed, uint64_t stream = 1);
  uint32_t next();
  float uniform() { return static_cast<float>(next() >> 8) * (1.0f / 16777216.0f); }
};

// The room ready for light: the geometry, its ray tree, the lamps.
struct Room {
  const SceneGeometry* geo = nullptr;
  Bvh bvh;
  std::vector<Lamp> lamps;
  float emissiveNits = 8;  // a glow of 1 in the models is this bright (cd/m², as the renderer)
  void build(const SceneGeometry& g, std::vector<Lamp> l);

  // Things that move (J116.5: a stool knocked over). Each has its own ray
  // tree over its triangles as they were baked; `turn` and `shift` say
  // where it is now (now = turn · baked + shift), so moving it costs
  // nothing and the room's tree is never rebuilt. A hit's `tri` is the
  // room's triangle number either way; `present` false leaves it out (a
  // thing lighting itself).
  struct Mover {
    Bvh bvh;
    std::vector<uint32_t> tris;  // its triangles, in the room's numbering
    Quat turn;
    Vec3 shift;
    bool present = true;
  };
  std::vector<Mover> movers;
  std::vector<int16_t> moverOf;  // per triangle: its mover, or -1
  // A triangle's facing now (a mover's turned with it).
  Vec3 normal(uint32_t tri) const;
  // The room's tree without the movers' triangles, then one tree per mover.
  void build(const SceneGeometry& g, std::vector<Lamp> l, const std::vector<std::vector<uint32_t>>& moverTris);
  bool intersect(Vec3 origin, Vec3 dir, float tMin, float tMax, Bvh::Hit* hit) const;
  bool occluded(Vec3 origin, Vec3 dir, float tMin, float tMax) const;
  // Is the straight line a → b (a point on lamp `lamp`) clear? The lamp's
  // own glowing bulb doesn't count (its model's glowing faces, and any of
  // its faces within the bulb's reach of b); its shade does (J116.1: the
  // renderer before J116 let a lamp's light through its whole model, J97).
  bool clear(Vec3 a, Vec3 b, const Lamp& lamp) const;
};

// The light from one lamp onto (p, n) (lux): a random point on it, shadow
// tested or not (the average over many calls is exact).
Vec3 lampLux(const Room& room, const Lamp& l, Vec3 p, Vec3 n, Rng& rng, bool shadowTested);

// Light from the lamps falling on the surface at `p` (facing `n`): `picks`
// lamps chosen at random by how much each could give, shadow tested; an
// estimate of lux whose average is exact. Only lamps with `use[i]` set (all
// if null): the baker's channels.
Vec3 directLight(const Room& room, Vec3 p, Vec3 n, Rng& rng, const std::vector<uint8_t>* use = nullptr, int picks = 1);

// Light falling on the surface at `p` from everything: the lamps directly
// plus the light every other surface bounces onto it, up to `bounces`
// times (lux, an estimate whose average is exact; Russian roulette ends
// long paths fairly).
// `firstPicks`: lamps looked at from `p` itself (later bounces look at one).
Vec3 incomingLight(const Room& room, Vec3 p, Vec3 n, Rng& rng, int bounces, const std::vector<uint8_t>* use = nullptr,
                   int firstPicks = 1);

// The same light, kept apart by light channel: each lamp's share (direct
// and every bounce of it) is added to out[its channel] (J116.3: the bake
// works out every channel from the same paths).
void incomingByChannel(const Room& room, Vec3 p, Vec3 n, Rng& rng, int bounces, int firstPicks, Vec3* out);

struct View {
  Vec3 eye;
  float yaw = 0, pitch = 0;  // radians, as looped/camera.h (yaw 0 looks down -Z)
  float fovY = 1.2217305f;   // 70 degrees
  int width = 480, height = 270;
};

struct RenderSettings {
  int samples = 64;  // paths per pixel
  int bounces = 6;
  int picks = 4;  // lamps looked at from what each pixel sees
  int threads = 4;
  uint64_t seed = 1;
};

// A picture of the room, every layer in real units.
struct Picture {
  int width = 0, height = 0;
  std::vector<Vec3> color;   // what the eye sees (cd/m²): glow + colour x light / pi
  std::vector<Vec3> light;   // the light falling where each pixel looks (lux), no surface colour
  std::vector<Vec3> albedo;  // the surface colour seen there
  std::vector<float> depth;  // metres (0 = nothing)
  double ms = 0;             // time it took
  uint64_t rays = 0;
};

Picture render(const Room& room, const View& view, const RenderSettings& settings);

// The picture as the game's eyes would show it (8 bits): the same metering,
// exposure, white balance, AgX curve and mood as looped/shaders/post.wgsl,
// settled (no easing). No haze: the reference has no air yet.
std::vector<uint8_t> toDisplay(const std::vector<Vec3>& nits, int width, int height, const Mood& mood);

}  // namespace engine::bake
