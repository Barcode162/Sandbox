// looped/math.h checks: quaternion helpers, angles, boxes, finite checks.
#include <cmath>
#include <cstdio>
#include <initializer_list>

#include "looped/math.h"

using namespace engine;

static int g_failed = 0;
#define CHECK(cond)                                         \
  do {                                                      \
    if (!(cond)) {                                          \
      std::printf("FAIL line %d: %s\n", __LINE__, #cond);   \
      ++g_failed;                                           \
    }                                                       \
  } while (0)

static bool near(float a, float b, float eps = 1e-5f) { return std::fabs(a - b) <= eps; }
static bool near(Vec3 a, Vec3 b, float eps = 1e-5f) { return length(a - b) <= eps; }

int main() {
  // inverse: a camera's view-projection and back (J91: depth to positions).
  {
    const Mat4 vp = Mat4::perspective(1.2f, 0.46f, 0.05f, 100.0f) *
                    Mat4::lookAt({1, 1.65f, 4}, {0.5f, 1.2f, 0}, {0, 1, 0});
    const Mat4 id = inverse(vp) * vp;
    for (int c = 0; c < 4; ++c)
      for (int r = 0; r < 4; ++r) CHECK(near(id.at(c, r), c == r ? 1.0f : 0.0f, 1e-3f));
    const Vec4 clip = transformPoint(vp, {0.3f, 1.0f, 1.5f});
    const Vec4 back = transformPoint(inverse(vp), {clip.x / clip.w, clip.y / clip.w, clip.z / clip.w});
    CHECK(near(Vec3{back.x / back.w, back.y / back.w, back.z / back.w}, {0.3f, 1.0f, 1.5f}, 1e-3f));
  }
  // A zero axis gives no turn (used to give a broken quaternion).
  const Quat z = Quat::axisAngle({0, 0, 0}, 1.0f);
  CHECK(z.x == 0 && z.y == 0 && z.z == 0 && z.w == 1);
  // 90 degrees around +Y turns +X to -Z.
  const Quat q = Quat::axisAngle({0, 2, 0}, kPi / 2);
  CHECK(near(q.rotate({1, 0, 0}), {0, 0, -1}));
  // Conjugate undoes it.
  CHECK(near(conjugate(q).rotate(q.rotate({0.3f, -1, 2})), {0.3f, -1, 2}));
  // normalized: unit length; zero → identity.
  const Quat n = normalized({1, 2, 3, 4});
  CHECK(near(dot(n, n), 1));
  CHECK(normalized({0, 0, 0, 0}).w == 1);
  // nlerp/slerp: the ends, the middle, the short way round.
  const Quat a{}, b = Quat::axisAngle({0, 1, 0}, 1.0f);
  for (Quat (*f)(Quat, Quat, float) : {&nlerp, &slerp}) {
    CHECK(near(f(a, b, 0).w, a.w) && near(f(a, b, 1).y, b.y));
    const Quat mid = f(a, b, 0.5f);
    CHECK(near(mid.rotate({1, 0, 0}), Quat::axisAngle({0, 1, 0}, 0.5f).rotate({1, 0, 0}), 1e-3f));
    const Quat negB{-b.x, -b.y, -b.z, -b.w};  // same turn, other sign
    CHECK(near(f(a, negB, 0.5f).rotate({1, 0, 0}), mid.rotate({1, 0, 0}), 1e-3f));
  }
  // slerp keeps an even speed: a quarter of the way = a quarter of the angle.
  const Quat big = Quat::axisAngle({0, 0, 1}, 2.5f);
  CHECK(near(slerp(a, big, 0.25f).rotate({1, 0, 0}), Quat::axisAngle({0, 0, 1}, 0.625f).rotate({1, 0, 0}), 1e-4f));
  // Angles.
  CHECK(near(wrapAngle(3 * kPi), kPi, 1e-4f) || near(wrapAngle(3 * kPi), -kPi, 1e-4f));
  CHECK(near(wrapAngle(-0.5f), -0.5f));
  CHECK(near(angleLerp(kPi - 0.1f, -kPi + 0.1f, 0.5f), kPi, 1e-4f) ||
        near(angleLerp(kPi - 0.1f, -kPi + 0.1f, 0.5f), -kPi, 1e-4f));  // through pi, not through 0
  CHECK(near(smoothstep(0, 1, 0.5f), 0.5f) && smoothstep(0, 1, -1) == 0 && smoothstep(0, 1, 2) == 1);
  // Vec3 helpers.
  CHECK(near(2.0f * Vec3{1, 2, 3}, {2, 4, 6}) && near(Vec3{2, 4, 6} / 2, {1, 2, 3}));
  CHECK(near(lerp({0, 0, 0}, {2, 4, 6}, 0.5f), {1, 2, 3}));
  CHECK(near(distance({1, 0, 0}, {4, 4, 0}), 5));
  CHECK(isFinite(Vec3{1, 2, 3}) && !isFinite(Vec3{1, NAN, 3}) && !isFinite(Quat{0, 0, INFINITY, 1}));
  // Boxes.
  Aabb box = Aabb::empty();
  box.add({1, 1, 1});
  box.add({-1, 0, 2});
  CHECK(box.contains({0, 0.5f, 1.5f}) && !box.contains({0, 2, 1.5f}));
  CHECK(near(box.center(), {0, 0.5f, 1.5f}) && near(box.size(), {2, 1, 1}));
  CHECK(box.overlaps({{0.5f, 0.5f, 0.5f}, {3, 3, 3}}) && !box.overlaps({{2, 2, 2}, {3, 3, 3}}));
  std::printf("math_test: %s\n", g_failed ? "FAILED" : "ok");
  return g_failed ? 1 : 0;
}
