#pragma once
// A bounding volume hierarchy over triangles: a tree of boxes that lets a
// ray find what it hits by testing a few dozen triangles instead of all of
// them. Built with the surface area heuristic (binned), flat nodes, a small
// stack. Used by the bounced light (looped/radiosity.h) to work out which
// surfaces see which, and by the light tools. Plain C++ (no GPU), so the
// native tools and tests use it too.
#include <cstdint>
#include <vector>

#include "looped/math.h"

namespace engine {

class Bvh {
 public:
  struct Hit {
    float t = 0;          // distance along the ray (the direction's length = 1)
    uint32_t tri = ~0u;   // the triangle hit (index into the triangles given to build())
    float u = 0, v = 0;   // where on it (barycentric: p = (1-u-v) a + u b + v c)
    bool back = false;    // hit its back (the ray came from behind the surface)
  };
  // `positions` and `indices` (3 per triangle) are copied in.
  void build(const std::vector<Vec3>& positions, const std::vector<uint32_t>& indices);
  bool empty() const { return nodes_.empty(); }
  size_t triangleCount() const { return triIndex_.size(); }
  size_t nodeCount() const { return nodes_.size(); }
  // The nearest hit within (tMin, tMax], or false.
  bool intersect(Vec3 origin, Vec3 dir, float tMin, float tMax, Hit* hit) const;
  // Anything between (tMin, tMax)? (Shadows: cheaper than the nearest hit.)
  bool occluded(Vec3 origin, Vec3 dir, float tMin, float tMax) const;
  // For the GPU (looped/shaders/gi.wgsl): the nodes as built (32 bytes each:
  // min + left-or-first, max + count) and the triangles in leaf order as
  // three vec4 each (a corner and its two edges).
  const void* nodeData() const { return nodes_.data(); }
  size_t nodeBytes() const { return nodes_.size() * sizeof(Node); }
  void packTriangles(std::vector<float>& out) const;
  // A triangle's corners (as built).
  void corners(uint32_t tri, Vec3* a, Vec3* b, Vec3* c) const;

 private:
  struct Node {
    float min[3];
    uint32_t leftOrFirst;  // inner: the left child (right = left + 1); leaf: first in triIndex_
    float max[3];
    uint32_t count;        // 0 = inner node
  };
  struct Tri {
    Vec3 a, e1, e2;  // a corner and the two edges from it (Möller-Trumbore)
  };
  void split(uint32_t node, std::vector<Vec3>& centroids, std::vector<Vec3>& tmin, std::vector<Vec3>& tmax);
  std::vector<Node> nodes_;
  std::vector<Tri> tris_;           // in leaf order
  std::vector<uint32_t> triIndex_;  // leaf order → the triangle's original index
};

}  // namespace engine
