#pragma once
// Bounced light, the CPU half (L1.5, docs/handbook/manual/light.md → Bounced light).
// The still surfaces of a place are split into small patches ("surfels",
// about 25 cm apart). Rays from each patch find which patches it sees; rays
// from a grid of points in the air ("probes", about 50 cm apart) find what
// each point sees; shadow rays find which lamps each patch and each probe
// can see. That is all worked out once per layout (slowly, in small slices:
// step()). The GPU half (looped/gi.h) then bounces light between the
// patches every frame (so lamp changes, dimmers and flicker follow at once)
// and fills the probes, which every pixel reads for its bounced light.
// Plain C++ (no GPU): the native tools run it too.
#include <cstdint>
#include <array>
#include <vector>

#include "looped/bvh.h"
#include "looped/culling.h"
#include "looped/math.h"
#include "looped/scene_geometry.h"

namespace engine {

// The lamps bounced light keeps track of (which probes see them, the light
// they bounce): 127 (J88.1; four 32-bit words per probe, one bit says the
// probe is usable). Later lamps light directly but aren't blocked by walls.
constexpr size_t kMaskLamps = 127;

struct GiLight {
  Vec3 position;
  float radius = 0.1f;
};

struct GiSettings {
  float surfelSpacing = 0.25f;  // metres between patches
  int surfelRays = 32;          // rays per patch (what it sees)
  float probeSpacing = 0.5f;    // metres between probes
  int probeRays = 48;           // rays per probe
  float maxRay = 30.0f;         // rays further than this see nothing
  Aabb volume;                  // where the probes go (the rooms)
  bool cpuRays = true;          // false: stop after the patches (the GPU casts the rays, looped/gi.h)
  // Around lamps: glowing surfaces here don't glow into the bounced light
  // (their light is the lamp's).
  std::vector<Aabb> lampBoxes;
};

class GiBuild {
 public:
  static constexpr uint32_t kMiss = 0xffffffffu;
  struct Surfel {
    Vec3 position;
    Vec3 normal;
    Vec3 albedo;
    Vec3 emission;  // glTF units (the renderer scales it to cd/m²)
  };
  struct Direct {  // a lamp a patch sees: light falling on it per candela
    uint32_t light;
    float factor;  // cos(angle) / distance² (lux per cd)
  };

  // Starts over with a new layout. `geo` must stay alive until done().
  void begin(const SceneGeometry& geo, const std::vector<GiLight>& lights, const GiSettings& settings);
  // Works for about `budgetMs`; true once everything is worked out.
  bool step(double budgetMs);
  bool done() const { return phase_ == Phase::kDone; }
  float progress() const;  // 0..1
  const char* phaseName() const;
  // A lamp moved (the Studio): its shadow rays again (patches and probes).
  void relight(uint32_t light, const GiLight& l);

  // Results.
  GiSettings settings;
  std::vector<Surfel> surfels;
  std::vector<uint32_t> surfelHits;   // surfelRays per patch: the patch each ray met (kMiss = none)
  std::vector<uint32_t> directStart;  // per patch: first entry in `direct` (plus one at the end)
  std::vector<Direct> direct;
  Vec3 probeOrigin;                   // probe (0, 0, 0)
  int nx = 0, ny = 0, nz = 0;         // probes along x, y, z
  std::vector<Vec3> probeDirs;        // the probes' ray directions (the same for all)
  std::vector<uint32_t> probeHits;    // probeRays per probe
  std::vector<uint32_t> probeMask;    // per probe: bit k = lamp k visible (0-30); bit 31 = the probe is usable
  std::vector<std::array<uint32_t, 3>> probeMaskMore;  // per probe: lamps 31-126, 32 per word (J88.1)
  size_t probeCount() const { return static_cast<size_t>(nx) * ny * nz; }
  // For the GPU (looped/gi.h): the ray tree, the patches' hash (bucket
  // starts, kBuckets + 1 of them, and the patches in order) and its cell size.
  const Bvh& tree() const { return bvh_; }
  void hashTable(std::vector<uint32_t>& start, std::vector<uint32_t>& items) const;
  float hashCell() const { return cell_; }
  // Rays cast, for the stats.
  uint64_t rays = 0;
  double buildMs = 0;

 private:
  enum class Phase { kIdle, kBvh, kSurfels, kSurfelRays, kDirect, kProbeRays, kProbeLights, kDone };
  uint32_t surfelAt(Vec3 p, Vec3 n) const;
  void gridAdd(uint32_t s);
  bool lampVisible(Vec3 from, const GiLight& l) const;
  const SceneGeometry* geo_ = nullptr;
  std::vector<GiLight> lights_;
  Bvh bvh_;
  Phase phase_ = Phase::kIdle;
  size_t cursor_ = 0;
  float carry_ = 0;  // fractional patches carried between small triangles
  // Patches by grid cell (hash), to find the patch a ray hit.
  float cell_ = 0.25f;
  std::vector<uint32_t> cellStart_, cellItems_;
  std::vector<std::vector<uint32_t>> buckets_;
};

// The bounces on the CPU, for tests and tools (the game does the same on
// the GPU, looped/shaders/gi.wgsl): each patch's outgoing light (cd/m²)
// after `bounces` rounds. Lamps by index: colour (luminance 1) × candela.
struct GiLamp {
  Vec3 color{1, 1, 1};
  float candela = 0;
};
std::vector<Vec3> giSolve(const GiBuild& b, const std::vector<GiLamp>& lamps, float emissiveNits, int bounces);
// The average light a probe sees (cd/m², all directions): for maps and tests.
Vec3 giProbeAverage(const GiBuild& b, const std::vector<Vec3>& radiance, size_t probe);

}  // namespace engine
