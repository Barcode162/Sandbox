#include "looped/radiosity.h"

#include <algorithm>
#include <chrono>
#include <cmath>

namespace engine {
namespace {

double nowMs() {
  return std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now().time_since_epoch()).count();
}

// Deterministic "random" numbers from an integer (the same layout always
// gives the same patches, so pictures and tests repeat exactly).
uint32_t hash(uint32_t x) {
  x ^= x >> 16;
  x *= 0x7feb352du;
  x ^= x >> 15;
  x *= 0x846ca68bu;
  x ^= x >> 16;
  return x;
}
float rand01(uint32_t x) { return static_cast<float>(hash(x) >> 8) * (1.0f / 16777216.0f); }

// A well spread set of points on the unit square (Hammersley).
float radicalInverse(uint32_t bits) {
  bits = (bits << 16u) | (bits >> 16u);
  bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
  bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
  bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
  bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
  return static_cast<float>(bits) * 2.3283064365386963e-10f;
}

void frame(Vec3 n, Vec3* t, Vec3* b) {
  const Vec3 up = std::fabs(n.y) < 0.9f ? Vec3{0, 1, 0} : Vec3{1, 0, 0};
  *t = normalize(cross(up, n));
  *b = cross(n, *t);
}

constexpr size_t kBuckets = 1 << 17;
uint32_t bucketOf(int x, int y, int z) {
  return (static_cast<uint32_t>(x) * 73856093u ^ static_cast<uint32_t>(y) * 19349663u ^
          static_cast<uint32_t>(z) * 83492791u) & (kBuckets - 1);
}

}  // namespace

void GiBuild::begin(const SceneGeometry& geo, const std::vector<GiLight>& lights, const GiSettings& s) {
  geo_ = &geo;
  lights_ = lights;
  if (lights_.size() > kMaskLamps) lights_.resize(kMaskLamps);  // radiosity.h kMaskLamps
  settings = s;
  surfels.clear();
  surfelHits.clear();
  direct.clear();
  directStart.clear();
  probeHits.clear();
  probeMask.clear();
  probeMaskMore.clear();
  buckets_.assign(kBuckets, {});
  cell_ = std::max(0.2f, s.surfelSpacing);
  rays = 0;
  buildMs = 0;
  cursor_ = 0;
  carry_ = 0;
  phase_ = Phase::kBvh;
  // The probe grid: half a step in from the volume's sides, so no probe
  // sits exactly on a wall (rooms' boxes are their walls).
  const float sp = s.probeSpacing;
  probeOrigin = s.volume.min + Vec3{sp, sp, sp} * 0.5f;
  const Vec3 size = s.volume.max - s.volume.min;
  nx = std::max(2, static_cast<int>(std::ceil(size.x / sp)));
  ny = std::max(2, static_cast<int>(std::ceil(size.y / sp)));
  nz = std::max(2, static_cast<int>(std::ceil(size.z / sp)));
  // Probe rays: a Fibonacci sphere (even, every probe the same).
  probeDirs.clear();
  const int n = s.probeRays;
  for (int i = 0; i < n; ++i) {
    const float y = 1.0f - 2.0f * (static_cast<float>(i) + 0.5f) / static_cast<float>(n);
    const float r = std::sqrt(std::max(0.0f, 1.0f - y * y));
    const float phi = static_cast<float>(i) * 2.39996323f;
    probeDirs.push_back({r * std::cos(phi), y, r * std::sin(phi)});
  }
}

const char* GiBuild::phaseName() const {
  switch (phase_) {
    case Phase::kIdle: return "idle";
    case Phase::kBvh: return "ray tree";
    case Phase::kSurfels: return "patches";
    case Phase::kSurfelRays: return "what patches see";
    case Phase::kDirect: return "which lamps patches see";
    case Phase::kProbeRays: return "what probes see";
    case Phase::kProbeLights: return "which lamps probes see";
    case Phase::kDone: return "done";
  }
  return "";
}

float GiBuild::progress() const {
  const auto frac = [&](size_t n) { return n ? std::min(1.0f, static_cast<float>(cursor_) / static_cast<float>(n)) : 1.0f; };
  switch (phase_) {
    case Phase::kIdle: return 0;
    case Phase::kBvh: return 0.02f;
    case Phase::kSurfels: return 0.02f + 0.03f * frac(geo_->triangleCount());
    case Phase::kSurfelRays: return 0.05f + 0.45f * frac(surfels.size());
    case Phase::kDirect: return 0.5f + 0.15f * frac(surfels.size());
    case Phase::kProbeRays: return 0.65f + 0.3f * frac(probeCount());
    case Phase::kProbeLights: return 0.95f + 0.05f * frac(probeCount());
    case Phase::kDone: return 1;
  }
  return 0;
}

void GiBuild::gridAdd(uint32_t s) {
  const Vec3 p = surfels[s].position;
  const int x = static_cast<int>(std::floor(p.x / cell_)), y = static_cast<int>(std::floor(p.y / cell_)),
            z = static_cast<int>(std::floor(p.z / cell_));
  buckets_[bucketOf(x, y, z)].push_back(s);
}

// The patch nearest to `p` facing about the same way as `n` (kMiss if none
// within about a cell).
uint32_t GiBuild::surfelAt(Vec3 p, Vec3 n) const {
  const int x = static_cast<int>(std::floor(p.x / cell_)), y = static_cast<int>(std::floor(p.y / cell_)),
            z = static_cast<int>(std::floor(p.z / cell_));
  uint32_t best = kMiss, anyBest = kMiss;
  float bestD = 1e30f, anyD = 1e30f;
  const float limit = 2.25f * cell_ * cell_ * 4.0f;
  for (int dz = -1; dz <= 1; ++dz) {
    for (int dy = -1; dy <= 1; ++dy) {
      for (int dx = -1; dx <= 1; ++dx) {
        for (uint32_t s : buckets_[bucketOf(x + dx, y + dy, z + dz)]) {
          const Vec3 d = surfels[s].position - p;
          const float d2 = dot(d, d);
          if (d2 > limit) continue;
          if (dot(surfels[s].normal, n) > 0.5f) {
            if (d2 < bestD) bestD = d2, best = s;
          } else if (d2 < anyD) {
            anyD = d2, anyBest = s;
          }
        }
      }
    }
  }
  return best != kMiss ? best : anyBest;
}

bool GiBuild::lampVisible(Vec3 from, const GiLight& l) const {
  const Vec3 d = l.position - from;
  const float dist = length(d);
  if (dist < 1e-4f) return true;
  // The lamp's own fitting (bulb glass, a shade's rim) shouldn't hide it.
  const float tMax = dist - l.radius - 0.12f;
  return tMax <= 0.02f || !bvh_.occluded(from, d * (1.0f / dist), 0.02f, tMax);
}

void GiBuild::hashTable(std::vector<uint32_t>& start, std::vector<uint32_t>& items) const {
  start.assign(kBuckets + 1, 0);
  items.clear();
  for (size_t b = 0; b < kBuckets; ++b) {
    start[b] = static_cast<uint32_t>(items.size());
    items.insert(items.end(), buckets_[b].begin(), buckets_[b].end());
  }
  start[kBuckets] = static_cast<uint32_t>(items.size());
}

void GiBuild::relight(uint32_t light, const GiLight& l) {
  if (light >= lights_.size()) return;
  lights_[light] = l;
  if (phase_ == Phase::kIdle || phase_ == Phase::kBvh || phase_ == Phase::kSurfels || phase_ == Phase::kSurfelRays) return;
  phase_ = Phase::kDirect;  // the shadow rays again (the rest stands)
  direct.clear();
  directStart.clear();
  cursor_ = 0;
}

bool GiBuild::step(double budgetMs) {
  const double start = nowMs(), until = start + budgetMs;
  const auto timeUp = [&](size_t i) { return (i & 15) == 0 && nowMs() > until; };
  const SceneGeometry& g = *geo_;
  while (phase_ != Phase::kDone && phase_ != Phase::kIdle) {
    if (nowMs() > until) break;
    switch (phase_) {
      case Phase::kBvh: {
        bvh_.build(g.positions, g.indices);
        phase_ = Phase::kSurfels;
        cursor_ = 0;
        break;
      }
      case Phase::kSurfels: {
        const float perArea = 1.0f / (settings.surfelSpacing * settings.surfelSpacing);
        for (; cursor_ < g.triangleCount(); ++cursor_) {
          if (timeUp(cursor_)) break;
          const auto t = static_cast<uint32_t>(cursor_);
          const GeoMaterial& m = g.materials[g.triMaterial[t]];
          float want = g.area(t) * perArea + carry_;
          const int n = static_cast<int>(want);
          carry_ = want - static_cast<float>(n);
          const Vec3 a = g.corner(t, 0), b = g.corner(t, 1), c = g.corner(t, 2), nrm = g.normal(t);
          for (int k = 0; k < n; ++k) {
            const float r1 = std::sqrt(rand01(t * 7919u + static_cast<uint32_t>(k) * 2u));
            const float r2 = rand01(t * 7919u + static_cast<uint32_t>(k) * 2u + 1u);
            const Vec3 p = a * (1 - r1) + b * (r1 * (1 - r2)) + c * (r1 * r2);
            Vec3 glow = m.emission;
            if (glow.x + glow.y + glow.z > 0) {
              for (const Aabb& box : settings.lampBoxes) {
                if (box.contains(p)) {
                  glow = {};
                  break;
                }
              }
            }
            surfels.push_back({p, nrm, m.albedo, glow});
            gridAdd(static_cast<uint32_t>(surfels.size() - 1));
          }
        }
        if (cursor_ >= g.triangleCount() && !settings.cpuRays) {
          phase_ = Phase::kDone;
          break;
        }
        if (cursor_ >= g.triangleCount()) {
          phase_ = Phase::kSurfelRays;
          cursor_ = 0;
          surfelHits.assign(surfels.size() * static_cast<size_t>(settings.surfelRays), kMiss);
        }
        break;
      }
      case Phase::kSurfelRays: {
        const int n = settings.surfelRays;
        for (; cursor_ < surfels.size(); ++cursor_) {
          if (timeUp(cursor_)) break;
          const Surfel& s = surfels[cursor_];
          Vec3 t, b;
          frame(s.normal, &t, &b);
          const float o1 = rand01(static_cast<uint32_t>(cursor_) * 3u + 11u), o2 = rand01(static_cast<uint32_t>(cursor_) * 3u + 12u);
          const Vec3 origin = s.position + s.normal * 0.01f;
          for (int k = 0; k < n; ++k) {
            float u1 = (static_cast<float>(k) + 0.5f) / static_cast<float>(n) + o1;
            float u2 = radicalInverse(static_cast<uint32_t>(k)) + o2;
            u1 -= std::floor(u1);
            u2 -= std::floor(u2);
            const float r = std::sqrt(u1), phi = 6.2831853f * u2;
            const Vec3 dir = normalize(t * (r * std::cos(phi)) + b * (r * std::sin(phi)) + s.normal * std::sqrt(std::max(0.0f, 1 - u1)));
            Bvh::Hit hit;
            ++rays;
            if (bvh_.intersect(origin, dir, 0.0f, settings.maxRay, &hit) && !hit.back) {
              surfelHits[cursor_ * static_cast<size_t>(n) + static_cast<size_t>(k)] =
                  surfelAt(origin + dir * hit.t, g.normal(hit.tri));
            }
          }
        }
        if (cursor_ >= surfels.size()) {
          phase_ = Phase::kDirect;
          cursor_ = 0;
          direct.clear();
          directStart.clear();
        }
        break;
      }
      case Phase::kDirect: {
        for (; cursor_ < surfels.size(); ++cursor_) {
          if (timeUp(cursor_)) break;
          const Surfel& s = surfels[cursor_];
          directStart.push_back(static_cast<uint32_t>(direct.size()));
          const Vec3 from = s.position + s.normal * 0.03f;
          for (size_t l = 0; l < lights_.size(); ++l) {
            const Vec3 d = lights_[l].position - s.position;
            const float d2 = dot(d, d), dist = std::sqrt(d2);
            const float cosTheta = dot(s.normal, d) / std::max(dist, 1e-6f);
            if (cosTheta <= 0) continue;
            const float r = lights_[l].radius;
            const float factor = cosTheta / std::max(d2, r * r);
            if (factor < 1e-4f) continue;  // below 0.0001 lux per candela: nothing
            ++rays;
            if (!lampVisible(from, lights_[l])) continue;
            direct.push_back({static_cast<uint32_t>(l), factor});
          }
        }
        if (cursor_ >= surfels.size()) {
          directStart.push_back(static_cast<uint32_t>(direct.size()));
          if (probeHits.empty()) {
            phase_ = Phase::kProbeRays;
            probeHits.assign(probeCount() * static_cast<size_t>(settings.probeRays), kMiss);
            probeMask.assign(probeCount(), 0);
            probeMaskMore.assign(probeCount(), {0, 0, 0});
          } else {
            phase_ = Phase::kProbeLights;  // (relight: the probes' rays still stand)
          }
          cursor_ = 0;
        }
        break;
      }
      case Phase::kProbeRays: {
        const int n = settings.probeRays;
        for (; cursor_ < probeCount(); ++cursor_) {
          if (timeUp(cursor_)) break;
          const auto i = static_cast<int>(cursor_);
          const int x = i % nx, y = (i / nx) % ny, z = i / (nx * ny);
          const Vec3 p = probeOrigin + Vec3{static_cast<float>(x), static_cast<float>(y), static_cast<float>(z)} * settings.probeSpacing;
          int back = 0, hits = 0;
          for (int k = 0; k < n; ++k) {
            Bvh::Hit hit;
            ++rays;
            if (!bvh_.intersect(p, probeDirs[static_cast<size_t>(k)], 0.0f, settings.maxRay, &hit)) continue;
            ++hits;
            if (hit.back) {
              ++back;
              continue;
            }
            probeHits[cursor_ * static_cast<size_t>(n) + static_cast<size_t>(k)] =
                surfelAt(p + probeDirs[static_cast<size_t>(k)] * hit.t, g.normal(hit.tri));
          }
          // Inside a wall or outside the building: many rays meet backs of
          // surfaces, or nearly none hit anything. Not usable.
          const bool usable = back * 4 < n && hits * 2 > n;
          probeMask[cursor_] = usable ? 0x80000000u : 0;
        }
        if (cursor_ >= probeCount()) {
          phase_ = Phase::kProbeLights;
          cursor_ = 0;
        }
        break;
      }
      case Phase::kProbeLights: {
        for (; cursor_ < probeCount(); ++cursor_) {
          if (timeUp(cursor_)) break;
          uint32_t& mask = probeMask[cursor_];
          mask &= 0x80000000u;
          probeMaskMore[cursor_] = {0, 0, 0};
          if (!mask) continue;
          const auto i = static_cast<int>(cursor_);
          const int x = i % nx, y = (i / nx) % ny, z = i / (nx * ny);
          const Vec3 p = probeOrigin + Vec3{static_cast<float>(x), static_cast<float>(y), static_cast<float>(z)} * settings.probeSpacing;
          for (size_t l = 0; l < lights_.size(); ++l) {
            ++rays;
            if (!lampVisible(p, lights_[l])) continue;
            if (l < 31) mask |= 1u << l;
            else probeMaskMore[cursor_][(l - 31) / 32] |= 1u << ((l - 31) % 32);
          }
        }
        if (cursor_ >= probeCount()) {
          phase_ = Phase::kDone;
          cursor_ = 0;
        }
        break;
      }
      default:
        break;
    }
  }
  buildMs += nowMs() - start;
  return phase_ == Phase::kDone;
}

std::vector<Vec3> giSolve(const GiBuild& b, const std::vector<GiLamp>& lamps, float emissiveNits, int bounces) {
  const size_t n = b.surfels.size();
  const auto rays = static_cast<size_t>(b.settings.surfelRays);
  std::vector<Vec3> direct(n), now(n), next(n);
  for (size_t i = 0; i < n; ++i) {
    Vec3 e;
    for (uint32_t k = b.directStart[i]; k < b.directStart[i + 1]; ++k) {
      const GiBuild::Direct& d = b.direct[k];
      if (d.light < lamps.size()) e = e + lamps[d.light].color * (lamps[d.light].candela * d.factor);
    }
    direct[i] = e;
  }
  for (int pass = 0; pass <= bounces; ++pass) {
    for (size_t i = 0; i < n; ++i) {
      const GiBuild::Surfel& s = b.surfels[i];
      Vec3 sum;
      if (pass > 0) {
        for (size_t k = 0; k < rays; ++k) {
          const uint32_t h = b.surfelHits[i * rays + k];
          if (h != GiBuild::kMiss) sum = sum + now[h];
        }
        sum = sum * (1.0f / static_cast<float>(rays));
      }
      next[i] = mulComponents(s.albedo, direct[i] * (1.0f / 3.14159265f) + sum) + s.emission * emissiveNits;
    }
    std::swap(now, next);
  }
  return now;
}

Vec3 giProbeAverage(const GiBuild& b, const std::vector<Vec3>& radiance, size_t probe) {
  const auto rays = static_cast<size_t>(b.settings.probeRays);
  Vec3 sum;
  for (size_t k = 0; k < rays; ++k) {
    const uint32_t h = b.probeHits[probe * rays + k];
    if (h != GiBuild::kMiss) sum = sum + radiance[h];
  }
  return sum * (1.0f / static_cast<float>(rays));
}

}  // namespace engine
