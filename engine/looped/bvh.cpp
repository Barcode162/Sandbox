#include "looped/bvh.h"

#include <algorithm>
#include <cmath>
#include <limits>

namespace engine {
namespace {

constexpr int kBins = 12;
constexpr uint32_t kLeafMax = 4;

float area(Vec3 lo, Vec3 hi) {
  const Vec3 d = hi - lo;
  if (d.x < 0) return 0;
  return 2.0f * (d.x * d.y + d.y * d.z + d.z * d.x);
}
float axisOf(Vec3 v, int a) { return a == 0 ? v.x : a == 1 ? v.y : v.z; }

}  // namespace

void Bvh::build(const std::vector<Vec3>& positions, const std::vector<uint32_t>& indices) {
  const size_t n = indices.size() / 3;
  nodes_.clear();
  tris_.clear();
  triIndex_.resize(n);
  if (n == 0) return;
  std::vector<Vec3> centroids(n), tmin(n), tmax(n);
  for (size_t i = 0; i < n; ++i) {
    const Vec3 a = positions[indices[3 * i]], b = positions[indices[3 * i + 1]], c = positions[indices[3 * i + 2]];
    tmin[i] = minComponents(a, minComponents(b, c));
    tmax[i] = maxComponents(a, maxComponents(b, c));
    centroids[i] = (a + b + c) * (1.0f / 3.0f);
    triIndex_[i] = static_cast<uint32_t>(i);
  }
  nodes_.reserve(2 * n);
  nodes_.push_back({});
  nodes_[0].leftOrFirst = 0;
  nodes_[0].count = static_cast<uint32_t>(n);
  split(0, centroids, tmin, tmax);
  tris_.resize(n);
  for (size_t i = 0; i < n; ++i) {
    const uint32_t t = triIndex_[i];
    const Vec3 a = positions[indices[3 * t]], b = positions[indices[3 * t + 1]], c = positions[indices[3 * t + 2]];
    tris_[i] = {a, b - a, c - a};
  }
}

// Recursive in spirit, iterative in fact (deep trees on big rooms).
void Bvh::split(uint32_t root, std::vector<Vec3>& centroids, std::vector<Vec3>& tmin, std::vector<Vec3>& tmax) {
  std::vector<uint32_t> todo{root};
  while (!todo.empty()) {
    const uint32_t ni = todo.back();
    todo.pop_back();
    Node& node = nodes_[ni];
    const uint32_t first = node.leftOrFirst, count = node.count;
    Vec3 lo{1e30f, 1e30f, 1e30f}, hi{-1e30f, -1e30f, -1e30f}, clo = lo, chi = hi;
    for (uint32_t i = first; i < first + count; ++i) {
      const uint32_t t = triIndex_[i];
      lo = minComponents(lo, tmin[t]);
      hi = maxComponents(hi, tmax[t]);
      clo = minComponents(clo, centroids[t]);
      chi = maxComponents(chi, centroids[t]);
    }
    node.min[0] = lo.x, node.min[1] = lo.y, node.min[2] = lo.z;
    node.max[0] = hi.x, node.max[1] = hi.y, node.max[2] = hi.z;
    if (count <= kLeafMax) continue;
    // Binned SAH: the cheapest split along any axis.
    float bestCost = area(lo, hi) * static_cast<float>(count);
    int bestAxis = -1, bestBin = 0;
    for (int axis = 0; axis < 3; ++axis) {
      const float c0 = axisOf(clo, axis), c1 = axisOf(chi, axis);
      if (c1 - c0 < 1e-6f) continue;
      struct Bin {
        Vec3 lo{1e30f, 1e30f, 1e30f}, hi{-1e30f, -1e30f, -1e30f};
        uint32_t n = 0;
      } bins[kBins];
      const float scale = kBins / (c1 - c0);
      for (uint32_t i = first; i < first + count; ++i) {
        const uint32_t t = triIndex_[i];
        const int b = std::min(kBins - 1, static_cast<int>((axisOf(centroids[t], axis) - c0) * scale));
        bins[b].lo = minComponents(bins[b].lo, tmin[t]);
        bins[b].hi = maxComponents(bins[b].hi, tmax[t]);
        ++bins[b].n;
      }
      float leftArea[kBins - 1], rightArea[kBins - 1];
      uint32_t leftN[kBins - 1], rightN[kBins - 1];
      Vec3 l0{1e30f, 1e30f, 1e30f}, l1{-1e30f, -1e30f, -1e30f}, r0 = l0, r1 = l1;
      uint32_t ln = 0, rn = 0;
      for (int i = 0; i < kBins - 1; ++i) {
        ln += bins[i].n;
        l0 = minComponents(l0, bins[i].lo);
        l1 = maxComponents(l1, bins[i].hi);
        leftN[i] = ln;
        leftArea[i] = ln ? area(l0, l1) : 0;
        const int j = kBins - 1 - i;
        rn += bins[j].n;
        r0 = minComponents(r0, bins[j].lo);
        r1 = maxComponents(r1, bins[j].hi);
        rightN[j - 1] = rn;
        rightArea[j - 1] = rn ? area(r0, r1) : 0;
      }
      for (int i = 0; i < kBins - 1; ++i) {
        const float cost = leftArea[i] * leftN[i] + rightArea[i] * rightN[i];
        if (leftN[i] && rightN[i] && cost < bestCost) bestCost = cost, bestAxis = axis, bestBin = i;
      }
    }
    if (bestAxis < 0) continue;  // a leaf after all (no split helps)
    const float c0 = axisOf(clo, bestAxis), scale = kBins / (axisOf(chi, bestAxis) - c0);
    uint32_t* begin = triIndex_.data() + first;
    uint32_t* mid = std::partition(begin, begin + count, [&](uint32_t t) {
      return std::min(kBins - 1, static_cast<int>((axisOf(centroids[t], bestAxis) - c0) * scale)) <= bestBin;
    });
    const auto leftCount = static_cast<uint32_t>(mid - begin);
    if (leftCount == 0 || leftCount == count) continue;
    const auto left = static_cast<uint32_t>(nodes_.size());
    nodes_.push_back({});
    nodes_.push_back({});
    nodes_[left].leftOrFirst = first;
    nodes_[left].count = leftCount;
    nodes_[left + 1].leftOrFirst = first + leftCount;
    nodes_[left + 1].count = count - leftCount;
    nodes_[ni].leftOrFirst = left;
    nodes_[ni].count = 0;
    todo.push_back(left);
    todo.push_back(left + 1);
  }
}

namespace {

// Slab test: the distance at which the ray enters the box, or +inf. No
// branches but the last (min / max): twice as fast as testing axis by axis
// on the tools' machine (J116.1), the same answers.
inline float boxEnter(const float lo[3], const float hi[3], const float o[3], const float inv[3], float tMax) {
  const float x0 = (lo[0] - o[0]) * inv[0], x1 = (hi[0] - o[0]) * inv[0];
  const float y0 = (lo[1] - o[1]) * inv[1], y1 = (hi[1] - o[1]) * inv[1];
  const float z0 = (lo[2] - o[2]) * inv[2], z1 = (hi[2] - o[2]) * inv[2];
  const float t0 = std::max(std::max(std::min(x0, x1), std::min(y0, y1)), std::max(std::min(z0, z1), 0.0f));
  const float t1 = std::min(std::min(std::max(x0, x1), std::max(y0, y1)), std::min(std::max(z0, z1), tMax));
  return t0 <= t1 ? t0 : std::numeric_limits<float>::infinity();
}

}  // namespace

bool Bvh::intersect(Vec3 origin, Vec3 dir, float tMin, float tMax, Hit* hit) const {
  if (nodes_.empty()) return false;
  const float o[3] = {origin.x, origin.y, origin.z};
  const float inv[3] = {1.0f / (dir.x != 0 ? dir.x : 1e-12f), 1.0f / (dir.y != 0 ? dir.y : 1e-12f),
                        1.0f / (dir.z != 0 ? dir.z : 1e-12f)};
  const float inf = std::numeric_limits<float>::infinity();
  // Nodes to visit with the distance where the ray enters them: a deferred
  // node is skipped once something nearer has been hit.
  uint32_t stack[64];
  float stackT[64];
  int sp = 0;
  bool found = false;
  float best = tMax;
  if (boxEnter(nodes_[0].min, nodes_[0].max, o, inv, best) == inf) return false;
  uint32_t node = 0;
  while (true) {
    const Node& n = nodes_[node];
    if (n.count) {
      for (uint32_t i = n.leftOrFirst; i < n.leftOrFirst + n.count; ++i) {
        const Tri& tr = tris_[i];
        const Vec3 p = cross(dir, tr.e2);
        const float det = dot(tr.e1, p);
        if (std::fabs(det) < 1e-10f) continue;
        const float invDet = 1.0f / det;
        const Vec3 s = origin - tr.a;
        const float u = dot(s, p) * invDet;
        if (u < 0 || u > 1) continue;
        const Vec3 q = cross(s, tr.e1);
        const float v = dot(dir, q) * invDet;
        if (v < 0 || u + v > 1) continue;
        const float t = dot(tr.e2, q) * invDet;
        if (t <= tMin || t >= best) continue;
        best = t;
        found = true;
        hit->t = t;
        hit->tri = triIndex_[i];
        hit->u = u;
        hit->v = v;
        hit->back = det < 0;
      }
    } else {
      const uint32_t l = n.leftOrFirst, r = l + 1;
      const float tl = boxEnter(nodes_[l].min, nodes_[l].max, o, inv, best);
      const float tr = boxEnter(nodes_[r].min, nodes_[r].max, o, inv, best);
      if (tl != inf || tr != inf) {
        if (tl == inf) { node = r; continue; }
        if (tr == inf) { node = l; continue; }
        const bool leftFirst = tl <= tr;
        if (sp < 64) {
          stack[sp] = leftFirst ? r : l;
          stackT[sp++] = leftFirst ? tr : tl;
        }
        node = leftFirst ? l : r;
        continue;
      }
    }
    // Next deferred node that is still nearer than the best hit.
    do {
      if (sp == 0) return found;
      --sp;
    } while (stackT[sp] >= best);
    node = stack[sp];
  }
}

bool Bvh::occluded(Vec3 origin, Vec3 dir, float tMin, float tMax) const {
  if (nodes_.empty()) return false;
  const float o[3] = {origin.x, origin.y, origin.z};
  const float inv[3] = {1.0f / (dir.x != 0 ? dir.x : 1e-12f), 1.0f / (dir.y != 0 ? dir.y : 1e-12f),
                        1.0f / (dir.z != 0 ? dir.z : 1e-12f)};
  const float inf = std::numeric_limits<float>::infinity();
  uint32_t stack[64];
  int sp = 0;
  stack[sp++] = 0;
  while (sp) {
    const Node& n = nodes_[stack[--sp]];
    if (boxEnter(n.min, n.max, o, inv, tMax) == inf) continue;
    if (n.count) {
      for (uint32_t i = n.leftOrFirst; i < n.leftOrFirst + n.count; ++i) {
        const Tri& tr = tris_[i];
        const Vec3 p = cross(dir, tr.e2);
        const float det = dot(tr.e1, p);
        if (std::fabs(det) < 1e-10f) continue;
        const float invDet = 1.0f / det;
        const Vec3 s = origin - tr.a;
        const float u = dot(s, p) * invDet;
        if (u < 0 || u > 1) continue;
        const Vec3 q = cross(s, tr.e1);
        const float v = dot(dir, q) * invDet;
        if (v < 0 || u + v > 1) continue;
        const float t = dot(tr.e2, q) * invDet;
        if (t > tMin && t < tMax) return true;
      }
      continue;
    }
    if (sp < 63) {
      stack[sp++] = n.leftOrFirst;
      stack[sp++] = n.leftOrFirst + 1;
    }
  }
  return false;
}

void Bvh::packTriangles(std::vector<float>& out) const {
  out.resize(tris_.size() * 12);
  for (size_t i = 0; i < tris_.size(); ++i) {
    const Tri& t = tris_[i];
    const float v[12] = {t.a.x, t.a.y, t.a.z, 0, t.e1.x, t.e1.y, t.e1.z, 0, t.e2.x, t.e2.y, t.e2.z, 0};
    std::copy(v, v + 12, out.begin() + static_cast<long>(i * 12));
  }
}

void Bvh::corners(uint32_t tri, Vec3* a, Vec3* b, Vec3* c) const {
  // tris_ is in leaf order: find the slot (only tools call this; linear is fine).
  for (size_t i = 0; i < triIndex_.size(); ++i) {
    if (triIndex_[i] != tri) continue;
    *a = tris_[i].a;
    *b = tris_[i].a + tris_[i].e1;
    *c = tris_[i].a + tris_[i].e2;
    return;
  }
}

}  // namespace engine
