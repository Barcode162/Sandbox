#pragma once
// Frustum culling: skip what the camera can't see. A frustum is the six
// planes of a camera's view (left, right, bottom, top, near, far); a box is
// drawn only if it isn't completely outside one of them.
#include <cmath>

#include "looped/math.h"

namespace engine {

// A box in model space, moved by `m` (position, rotation, scale): the
// smallest world-space box around it.
inline Aabb transformAabb(const Mat4& m, const Aabb& b) {
  const Vec3 c = (b.min + b.max) * 0.5f, e = (b.max - b.min) * 0.5f;
  const Vec4 wc = transformPoint(m, c);
  Vec3 we;
  we.x = std::fabs(m.at(0, 0)) * e.x + std::fabs(m.at(1, 0)) * e.y + std::fabs(m.at(2, 0)) * e.z;
  we.y = std::fabs(m.at(0, 1)) * e.x + std::fabs(m.at(1, 1)) * e.y + std::fabs(m.at(2, 1)) * e.z;
  we.z = std::fabs(m.at(0, 2)) * e.x + std::fabs(m.at(1, 2)) * e.y + std::fabs(m.at(2, 2)) * e.z;
  const Vec3 center{wc.x, wc.y, wc.z};
  return {center - we, center + we};
}

struct Frustum {
  Vec4 planes[6];  // xyz = normal (pointing inside), w = offset

  // The planes of a view-projection matrix (WebGPU clip space: depth 0..1).
  // `x0..y1` narrow it to part of the screen, in -1..1 screen units (e.g. a
  // mirror's scissor box), so only what shows there counts.
  static Frustum fromViewProj(const Mat4& vp, float x0 = -1, float x1 = 1, float y0 = -1, float y1 = 1) {
    const auto row = [&](int r) { return Vec4{vp.at(0, r), vp.at(1, r), vp.at(2, r), vp.at(3, r)}; };
    const Vec4 r0 = row(0), r1 = row(1), r2 = row(2), r3 = row(3);
    const auto sub = [](Vec4 a, Vec4 b, float s) { return Vec4{a.x - b.x * s, a.y - b.y * s, a.z - b.z * s, a.w - b.w * s}; };
    Frustum f;
    f.planes[0] = sub(r0, r3, x0);                                // x >= x0 * w
    f.planes[1] = Vec4{r3.x * x1 - r0.x, r3.y * x1 - r0.y, r3.z * x1 - r0.z, r3.w * x1 - r0.w};  // x <= x1 * w
    f.planes[2] = sub(r1, r3, y0);                                // y >= y0 * w
    f.planes[3] = Vec4{r3.x * y1 - r1.x, r3.y * y1 - r1.y, r3.z * y1 - r1.z, r3.w * y1 - r1.w};  // y <= y1 * w
    f.planes[4] = r2;                                             // z >= 0
    f.planes[5] = sub(r3, r2, 1.0f);                              // z <= w
    return f;
  }

  // False only when the box is entirely outside (it may still be hidden
  // behind something else; that's the GPU's job).
  bool visible(const Aabb& b) const {
    for (const Vec4& p : planes) {
      // The box corner furthest along the plane's normal.
      const float x = p.x >= 0 ? b.max.x : b.min.x;
      const float y = p.y >= 0 ? b.max.y : b.min.y;
      const float z = p.z >= 0 ? b.max.z : b.min.z;
      if (p.x * x + p.y * y + p.z * z + p.w < 0) return false;
    }
    return true;
  }
};

}  // namespace engine
