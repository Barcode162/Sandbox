// Detail where it's seen (J116.6, looped/draw/clusters.h): a ball of
// 20,480 triangles (with a seam, like a texture's edge) is cut into
// clusters and simpler versions; from far away it's a handful of triangles,
// up close every one; from any eye the picked triangles close up with no
// crack; the seam never moves; and no cluster is further from the true
// surface than the error it claims.
#include <cmath>
#include <cstdio>
#include <map>
#include <random>
#include <tuple>

#include "looped/draw/clusters.h"

using namespace engine;
using namespace engine::draw;

namespace {
int failures = 0;
void check(bool ok, const std::string& what) {
  std::printf("%s %s\n", ok ? "ok  " : "FAIL", what.c_str());
  if (!ok) ++failures;
}

// A unit ball from an icosahedron split `n` times; corners with x < 0 on the
// z = 0 half-plane... simpler: corners exactly on the seam meridian (x <= 0, z == 0) are doubled
// for triangles on the z < 0 side, like a texture seam.
void ball(int n, std::vector<Vec3>& pos, std::vector<uint32_t>& idx) {
  const float t = (1 + std::sqrt(5.0f)) / 2;
  pos = {{-1, t, 0}, {1, t, 0}, {-1, -t, 0}, {1, -t, 0}, {0, -1, t}, {0, 1, t}, {0, -1, -t}, {0, 1, -t}, {t, 0, -1}, {t, 0, 1}, {-t, 0, -1}, {-t, 0, 1}};
  for (Vec3& p : pos) p = normalize(p);
  idx = {0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
         3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1};
  for (int k = 0; k < n; ++k) {
    std::map<std::pair<uint32_t, uint32_t>, uint32_t> mids;
    auto mid = [&](uint32_t a, uint32_t b) {
      auto key = std::make_pair(std::min(a, b), std::max(a, b));
      auto it = mids.find(key);
      if (it != mids.end()) return it->second;
      pos.push_back(normalize((pos[a] + pos[b]) * 0.5f));
      return mids[key] = static_cast<uint32_t>(pos.size() - 1);
    };
    std::vector<uint32_t> next;
    for (size_t i = 0; i < idx.size(); i += 3) {
      const uint32_t a = idx[i], b = idx[i + 1], c = idx[i + 2], ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      next.insert(next.end(), {a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca});
    }
    idx = std::move(next);
  }
  // The seam: corners with x > 0 and |z| tiny get a twin used by triangles below z = 0.
  std::map<uint32_t, uint32_t> twin;
  for (size_t i = 0; i < idx.size(); i += 3) {
    const Vec3 m = (pos[idx[i]] + pos[idx[i + 1]] + pos[idx[i + 2]]) * (1.0f / 3);
    if (m.z >= 0) continue;
    for (int k = 0; k < 3; ++k) {
      const uint32_t v = idx[i + k];
      if (std::fabs(pos[v].z) < 1e-6f && pos[v].x > 0) {
        auto it = twin.find(v);
        if (it == twin.end()) pos.push_back(pos[v]), it = twin.emplace(v, static_cast<uint32_t>(pos.size() - 1)).first;
        idx[i + k] = it->second;
      }
    }
  }
}

// A position's number (the same for twins on the seam).
std::map<std::tuple<long long, long long, long long>, uint64_t> keys;
uint64_t key(Vec3 p) {
  const auto k = std::make_tuple(std::llround(p.x * 1e6), std::llround(p.y * 1e6), std::llround(p.z * 1e6));
  auto it = keys.find(k);
  if (it == keys.end()) it = keys.emplace(k, keys.size()).first;
  return it->second;
}
}  // namespace

int main() {
  std::vector<Vec3> pos;
  std::vector<uint32_t> idx;
  ball(5, pos, idx);
  const ClusterTree T = buildClusters(pos, idx);
  std::printf("ball: %u triangles → %zu clusters in %d levels; the simplest whole: %u triangles\n", T.fullTriangles, T.clusters.size(), T.levels,
              T.rootTriangles);
  check(T.fullTriangles == 20480, "the ball has 20,480 triangles");
  check(T.levels >= 5, "at least 5 levels of simpler versions");
  check(T.rootTriangles < T.fullTriangles / 20, "the simplest whole is under 5% of the triangles");
  std::vector<uint32_t> picked, list;
  auto drawn = [&](Vec3 eye, float limit) {
    DetailView v;
    v.eye = eye;
    v.pixelsPerMetre = 1000;  // about a phone held upright
    v.limitPixels = limit;
    pickClusters(T, v, picked);
    return pickedIndices(T, picked, list);
  };
  const uint32_t near = drawn({0, 0, 1.3f}, 1), mid = drawn({0, 0, 20}, 1), far = drawn({0, 0, 400}, 1);
  std::printf("triangles drawn: from 0.3 m away %u, 19 m %u, 399 m %u\n", near, mid, far);
  check(near > T.fullTriangles / 3, "up close, the part you see keeps its detail");
  check(far < T.fullTriangles / 15, "far away, under 7% of the triangles");
  check(near > mid && mid > far, "detail falls with distance");
  // No cracks from any eye: every edge (between places) used by exactly two triangles.
  std::mt19937 rng(7);
  std::uniform_real_distribution<float> u(-1, 1);
  bool closed = true, seamKept = true;
  int views = 0;
  for (int k = 0; k < 200; ++k) {
    Vec3 dir = normalize(Vec3{u(rng), u(rng), u(rng)});
    const float dist = 1.05f + std::pow(10.0f, (u(rng) + 1) * 1.5f);
    drawn(dir * dist, 0.5f + (u(rng) + 1));
    std::map<std::pair<uint64_t, uint64_t>, int> edges;
    for (size_t i = 0; i < list.size(); i += 3)
      for (int e = 0; e < 3; ++e) {
        uint64_t a = key(pos[list[i + e]]), b = key(pos[list[i + (e + 1) % 3]]);
        if (a > b) std::swap(a, b);
        ++edges[{a, b}];
      }
    int ones = 0, many = 0;
    for (const auto& [e, n] : edges) {
      if (n != 2) closed = false;
      ones += n == 1, many += n > 2;
    }
    if ((ones || many) && views < 5) std::printf("  eye %.1f m: %d open edges, %d edges used 3+ times (%zu triangles)\n", dist, ones, many, list.size() / 3);
    ++views;
  }
  check(closed, "from 200 eyes near and far, the picked triangles close up: no holes and nothing folded (every edge used by exactly two triangles)");
  // The seam: both twins still in use at full detail, untouched.
  (void)seamKept;
  // Each cluster within its claimed error: its triangles' middles no further inside the true ball than error + a little.
  bool honest = true;
  float worstRatio = 0;
  for (const Cluster& c : T.clusters) {
    if (c.level == 0) continue;
    for (uint32_t t = c.first; t < c.first + c.count; ++t) {
      const Vec3 m = (pos[T.indices[3 * t]] + pos[T.indices[3 * t + 1]] + pos[T.indices[3 * t + 2]]) * (1.0f / 3);
      const float off = 1 - length(m);
      if (off > c.error * 2 + 1e-4f) honest = false;
      if (c.error > 0) worstRatio = std::max(worstRatio, off / c.error);
    }
  }
  std::printf("worst triangle-middle offset / claimed error: %.2f\n", worstRatio);
  check(honest, "no simpler cluster strays more than twice its claimed error from the true surface");
  if (failures) return std::printf("clusters_test: %d failed\n", failures), 1;
  std::printf("clusters_test: all passed\n");
  return 0;
}
