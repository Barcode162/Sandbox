#pragma once
// Small 3D math library: vectors, 4x4 matrices, quaternions.
// Conventions: right-handed world, +Y up, camera looks down -Z.
// Matrices are column-major (m[col * 4 + row]), matching WGSL mat4x4f.
#include <cmath>

namespace engine {

constexpr float kPi = 3.14159265358979f;

inline float radians(float degrees) { return degrees * kPi / 180.0f; }
inline float clampf(float v, float lo, float hi) { return v < lo ? lo : (v > hi ? hi : v); }
inline float lerpf(float a, float b, float t) { return a + (b - a) * t; }
inline float signf(float v) { return v < 0 ? -1.0f : 1.0f; }
// 0 below e0, 1 above e1, a smooth S-curve between.
inline float smoothstep(float e0, float e1, float x) {
  const float t = clampf((x - e0) / (e1 - e0), 0.0f, 1.0f);
  return t * t * (3 - 2 * t);
}
// An angle moved into -pi..pi.
inline float wrapAngle(float a) { return std::remainder(a, 2.0f * kPi); }
// From angle a toward b the short way round (t = 0..1).
inline float angleLerp(float a, float b, float t) { return a + wrapAngle(b - a) * t; }

struct Vec2 {
  float x = 0, y = 0;
};

struct Vec3 {
  float x = 0, y = 0, z = 0;

  Vec3 operator+(Vec3 o) const { return {x + o.x, y + o.y, z + o.z}; }
  Vec3 operator-(Vec3 o) const { return {x - o.x, y - o.y, z - o.z}; }
  Vec3 operator*(float s) const { return {x * s, y * s, z * s}; }
  Vec3 operator/(float s) const { return {x / s, y / s, z / s}; }
  Vec3 operator-() const { return {-x, -y, -z}; }
  Vec3& operator+=(Vec3 o) { return *this = *this + o; }
  Vec3& operator-=(Vec3 o) { return *this = *this - o; }
  Vec3& operator*=(float s) { return *this = *this * s; }
  bool operator==(const Vec3&) const = default;
};
inline Vec3 operator*(float s, Vec3 v) { return v * s; }

inline float dot(Vec3 a, Vec3 b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
inline Vec3 cross(Vec3 a, Vec3 b) {
  return {a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x};
}
inline float length(Vec3 v) { return std::sqrt(dot(v, v)); }
inline float lengthSq(Vec3 v) { return dot(v, v); }
inline float distance(Vec3 a, Vec3 b) { return length(a - b); }
inline Vec3 normalize(Vec3 v) {
  const float len = length(v);
  return len > 0 ? v * (1.0f / len) : v;
}
inline Vec3 lerp(Vec3 a, Vec3 b, float t) { return a + (b - a) * t; }
inline Vec3 mulComponents(Vec3 a, Vec3 b) { return {a.x * b.x, a.y * b.y, a.z * b.z}; }
inline Vec3 minComponents(Vec3 a, Vec3 b) { return {std::fmin(a.x, b.x), std::fmin(a.y, b.y), std::fmin(a.z, b.z)}; }
inline Vec3 maxComponents(Vec3 a, Vec3 b) { return {std::fmax(a.x, b.x), std::fmax(a.y, b.y), std::fmax(a.z, b.z)}; }
inline bool isFinite(Vec3 v) { return std::isfinite(v.x) && std::isfinite(v.y) && std::isfinite(v.z); }

// An axis-aligned box.
struct Aabb {
  Vec3 min, max;
  bool contains(Vec3 p) const {
    return p.x >= min.x && p.x <= max.x && p.y >= min.y && p.y <= max.y && p.z >= min.z && p.z <= max.z;
  }
  bool overlaps(const Aabb& o) const {
    return min.x <= o.max.x && max.x >= o.min.x && min.y <= o.max.y && max.y >= o.min.y && min.z <= o.max.z &&
           max.z >= o.min.z;
  }
  Vec3 center() const { return (min + max) * 0.5f; }
  Vec3 size() const { return max - min; }
  // Grown to hold p.
  void add(Vec3 p) {
    min = minComponents(min, p);
    max = maxComponents(max, p);
  }
  static Aabb empty() { return {{1e30f, 1e30f, 1e30f}, {-1e30f, -1e30f, -1e30f}}; }
};

struct Vec4 {
  float x = 0, y = 0, z = 0, w = 0;
};

struct Quat {
  float x = 0, y = 0, z = 0, w = 1;

  // A turn by angle (radians) around axis. A zero axis gives no turn.
  static Quat axisAngle(Vec3 axis, float angle) {
    if (dot(axis, axis) <= 0) return {};
    const Vec3 a = normalize(axis) * std::sin(angle * 0.5f);
    return {a.x, a.y, a.z, std::cos(angle * 0.5f)};
  }
  Quat operator*(Quat o) const {
    return {w * o.x + x * o.w + y * o.z - z * o.y, w * o.y - x * o.z + y * o.w + z * o.x,
            w * o.z + x * o.y - y * o.x + z * o.w, w * o.w - x * o.x - y * o.y - z * o.z};
  }
  Vec3 rotate(Vec3 v) const {
    const Vec3 q{x, y, z};
    const Vec3 t = cross(q, v) * 2.0f;
    return v + t * w + cross(q, t);
  }
};

inline float dot(Quat a, Quat b) { return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w; }
// The opposite turn (for a unit quaternion).
inline Quat conjugate(Quat q) { return {-q.x, -q.y, -q.z, q.w}; }
// Length 1 again (rounding drifts it); a zero quaternion gives no turn.
inline Quat normalized(Quat q) {
  const float n = std::sqrt(dot(q, q));
  return n > 0 ? Quat{q.x / n, q.y / n, q.z / n, q.w / n} : Quat{};
}
inline bool isFinite(Quat q) { return std::isfinite(q.x) && std::isfinite(q.y) && std::isfinite(q.z) && std::isfinite(q.w); }
// Between two turns, the short way round: fast and good for small steps.
inline Quat nlerp(Quat a, Quat b, float t) {
  if (dot(a, b) < 0) b = {-b.x, -b.y, -b.z, -b.w};
  return normalized({a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t, a.w + (b.w - a.w) * t});
}
// Between two turns at an even speed (for big differences).
inline Quat slerp(Quat a, Quat b, float t) {
  float d = dot(a, b);
  if (d < 0) {
    b = {-b.x, -b.y, -b.z, -b.w};
    d = -d;
  }
  if (d > 0.9995f) return nlerp(a, b, t);
  const float theta = std::acos(clampf(d, -1, 1));
  const float s = std::sin(theta);
  const float wa = std::sin((1 - t) * theta) / s, wb = std::sin(t * theta) / s;
  return {a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb, a.w * wa + b.w * wb};
}

struct Mat4 {
  float m[16] = {1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1};

  float& at(int col, int row) { return m[col * 4 + row]; }
  float at(int col, int row) const { return m[col * 4 + row]; }

  Mat4 operator*(const Mat4& o) const {
    Mat4 r;
    for (int c = 0; c < 4; ++c) {
      for (int rw = 0; rw < 4; ++rw) {
        float sum = 0;
        for (int k = 0; k < 4; ++k) sum += at(k, rw) * o.at(c, k);
        r.at(c, rw) = sum;
      }
    }
    return r;
  }

  static Mat4 translation(Vec3 t) {
    Mat4 r;
    r.at(3, 0) = t.x;
    r.at(3, 1) = t.y;
    r.at(3, 2) = t.z;
    return r;
  }

  static Mat4 rotation(Quat q) {
    Mat4 r;
    const float xx = q.x * q.x, yy = q.y * q.y, zz = q.z * q.z;
    const float xy = q.x * q.y, xz = q.x * q.z, yz = q.y * q.z;
    const float wx = q.w * q.x, wy = q.w * q.y, wz = q.w * q.z;
    r.at(0, 0) = 1 - 2 * (yy + zz);
    r.at(0, 1) = 2 * (xy + wz);
    r.at(0, 2) = 2 * (xz - wy);
    r.at(1, 0) = 2 * (xy - wz);
    r.at(1, 1) = 1 - 2 * (xx + zz);
    r.at(1, 2) = 2 * (yz + wx);
    r.at(2, 0) = 2 * (xz + wy);
    r.at(2, 1) = 2 * (yz - wx);
    r.at(2, 2) = 1 - 2 * (xx + yy);
    return r;
  }

  // Translation, then rotation: places an object in the world.
  static Mat4 transform(Vec3 position, Quat rot = {}) { return translation(position) * rotation(rot); }

  // WebGPU clip space has depth in [0, 1].
  static Mat4 perspective(float fovY, float aspect, float zNear, float zFar) {
    Mat4 r;
    const float f = 1.0f / std::tan(fovY * 0.5f);
    r.at(0, 0) = f / aspect;
    r.at(1, 1) = f;
    r.at(2, 2) = zFar / (zNear - zFar);
    r.at(2, 3) = -1;
    r.at(3, 2) = zNear * zFar / (zNear - zFar);
    r.at(3, 3) = 0;
    return r;
  }

  // Mirrors everything across the plane through `point` with unit `normal`.
  static Mat4 reflection(Vec3 normal, Vec3 point) {
    const float n[3] = {normal.x, normal.y, normal.z};
    const float d = -dot(normal, point);
    Mat4 r;
    for (int row = 0; row < 3; ++row) {
      for (int col = 0; col < 3; ++col) r.at(col, row) = (row == col ? 1.0f : 0.0f) - 2.0f * n[row] * n[col];
      r.at(3, row) = -2.0f * d * n[row];
    }
    return r;
  }

  static Mat4 lookAt(Vec3 eye, Vec3 target, Vec3 up) {
    const Vec3 f = normalize(target - eye);
    const Vec3 s = normalize(cross(f, up));
    const Vec3 u = cross(s, f);
    Mat4 r;
    r.at(0, 0) = s.x;  r.at(1, 0) = s.y;  r.at(2, 0) = s.z;
    r.at(0, 1) = u.x;  r.at(1, 1) = u.y;  r.at(2, 1) = u.z;
    r.at(0, 2) = -f.x; r.at(1, 2) = -f.y; r.at(2, 2) = -f.z;
    r.at(3, 0) = -dot(s, eye);
    r.at(3, 1) = -dot(u, eye);
    r.at(3, 2) = dot(f, eye);
    return r;
  }
};

// Transforms a point (w = 1); the result keeps w (for clip space).
inline Vec4 transformPoint(const Mat4& m, Vec3 p) {
  return {m.at(0, 0) * p.x + m.at(1, 0) * p.y + m.at(2, 0) * p.z + m.at(3, 0),
          m.at(0, 1) * p.x + m.at(1, 1) * p.y + m.at(2, 1) * p.z + m.at(3, 1),
          m.at(0, 2) * p.x + m.at(1, 2) * p.y + m.at(2, 2) * p.z + m.at(3, 2),
          m.at(0, 3) * p.x + m.at(1, 3) * p.y + m.at(2, 3) * p.z + m.at(3, 3)};
}

// The inverse of a 4x4 matrix (cofactors; works on the stored order as is,
// since inverting commutes with transposing). A singular matrix gives the
// identity. Used to turn depth back into positions (looped/ssao.h).
inline Mat4 inverse(const Mat4& a) {
  const float* m = a.m;
  float inv[16];
  inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
  inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
  inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
  inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
  inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
  inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
  inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
  inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
  inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
  inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
  inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
  inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
  inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
  inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
  inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
  inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
  const float det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
  Mat4 r;
  if (std::fabs(det) < 1e-20f) return r;
  for (int i = 0; i < 16; ++i) r.m[i] = inv[i] / det;
  return r;
}

}  // namespace engine
