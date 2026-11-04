// Bounced light (looped/radiosity.h) checked against physics in simple
// rooms. Run by tools/native/run.sh.
//  1. A closed white box with one lamp: bounces add light the way they must
//     (a box of albedo ρ ends near 1 / (1 - ρ) times its direct light).
//  2. Two rooms with a solid wall between: no light gets through, probes in
//     the dark room don't see the lamp, probes inside the wall are unusable.
#include <cmath>
#include <cstdio>

#include "looped/radiosity.h"

using namespace engine;

static int failures = 0;
static void check(bool ok, const char* what) {
  std::printf("%s %s\n", ok ? "ok  " : "FAIL", what);
  if (!ok) ++failures;
}

// An axis-aligned box's six faces facing in (or out), as triangles.
static void addBox(SceneGeometry& g, Vec3 lo, Vec3 hi, uint32_t material, bool inward) {
  const Vec3 c[8] = {{lo.x, lo.y, lo.z}, {hi.x, lo.y, lo.z}, {hi.x, hi.y, lo.z}, {lo.x, hi.y, lo.z},
                     {lo.x, lo.y, hi.z}, {hi.x, lo.y, hi.z}, {hi.x, hi.y, hi.z}, {lo.x, hi.y, hi.z}};
  // Outward-facing quads (counter-clockwise seen from outside).
  const int q[6][4] = {{0, 3, 2, 1}, {4, 5, 6, 7}, {0, 4, 7, 3}, {1, 2, 6, 5}, {0, 1, 5, 4}, {3, 7, 6, 2}};
  // Big faces are cut into a grid so patches spread evenly.
  for (const auto& f : q) {
    const Vec3 a = c[f[0]], b = c[f[1]], d = c[f[3]];
    const int n = 8;
    for (int i = 0; i < n; ++i) {
      for (int j = 0; j < n; ++j) {
        const auto at = [&](int u, int v) {
          return a + (b - a) * (static_cast<float>(u) / n) + (d - a) * (static_cast<float>(v) / n);
        };
        const Vec3 p0 = at(i, j), p1 = at(i + 1, j), p2 = at(i + 1, j + 1), p3 = at(i, j + 1);
        const auto base = static_cast<uint32_t>(g.positions.size());
        g.positions.insert(g.positions.end(), {p0, p1, p2, p3});
        const uint32_t t[6] = {0, 1, 2, 0, 2, 3};
        for (int k = 0; k < 6; ++k) g.indices.push_back(base + (inward ? t[5 - k] : t[k]));
        g.triMaterial.push_back(material), g.triMaterial.push_back(material);
        g.triModel.push_back(0), g.triModel.push_back(0);
      }
    }
  }
}

static float mean(const std::vector<Vec3>& v) {
  double s = 0;
  for (const Vec3& x : v) s += x.y;
  return static_cast<float>(s / std::max<size_t>(1, v.size()));
}

int main() {
  {  // 1. A closed white box.
    SceneGeometry g;
    GeoMaterial white;
    white.albedo = {0.8f, 0.8f, 0.8f};
    g.materials.push_back(white);
    addBox(g, {0, 0, 0}, {4, 3, 4}, 0, true);
    GiSettings s;
    s.volume = {{0, 0, 0}, {4, 3, 4}};
    s.surfelRays = 64;
    GiBuild b;
    b.begin(g, {{{2, 1.5f, 2}, 0.05f}}, s);
    while (!b.step(100)) {}
    const float area = 2 * (4 * 3 + 4 * 3 + 4 * 4);
    check(std::abs(static_cast<float>(b.surfels.size()) - area * 16) < area * 16 * 0.1f, "patches every 25 cm");
    size_t miss = 0;
    for (uint32_t h : b.surfelHits) miss += h == GiBuild::kMiss;
    check(miss < b.surfelHits.size() / 50, "inside a closed box every patch ray meets another patch");
    const std::vector<GiLamp> lamp{{{1, 1, 1}, 100.0f}};
    const float direct = mean(giSolve(b, lamp, 0, 0));
    const float one = mean(giSolve(b, lamp, 0, 1)), many = mean(giSolve(b, lamp, 0, 40));
    std::printf("     direct %.3f, one bounce %.3f, converged %.3f (x%.2f; theory 1/(1-0.8) = x5)\n", direct, one, many,
                many / direct);
    check(one > direct * 1.5f && many > one, "each bounce adds light");
    check(many / direct > 4.0f && many / direct < 6.0f, "a white box ends near 5x its direct light");
    size_t usable = 0;
    for (uint32_t m : b.probeMask) usable += m >> 31;
    check(usable > b.probeCount() / 2, "most probes inside the box are usable");
  }
  {  // 2. Two rooms, a solid wall between.
    SceneGeometry g;
    GeoMaterial white;
    white.albedo = {0.8f, 0.8f, 0.8f};
    g.materials.push_back(white);
    addBox(g, {0, 0, 0}, {4, 3, 4}, 0, true);   // room A (the lamp)
    addBox(g, {4.2f, 0, 0}, {8, 3, 4}, 0, true);  // room B
    addBox(g, {4, 0, 0}, {4.2f, 3, 4}, 0, false);  // the wall's solid core
    GiSettings s;
    s.volume = {{0, 0, 0}, {8, 3, 4}};
    s.probeSpacing = 0.4f;
    GiBuild b;
    b.begin(g, {{{2, 1.5f, 2}, 0.05f}}, s);
    while (!b.step(100)) {}
    const std::vector<Vec3> L = giSolve(b, {{{1, 1, 1}, 100.0f}}, 0, 20);
    double a = 0, bLight = 0;
    int na = 0, nb = 0;
    for (size_t i = 0; i < b.surfels.size(); ++i) {
      const float x = b.surfels[i].position.x;
      if (x < 3.9f) a += L[i].y, ++na;
      if (x > 4.3f) bLight += L[i].y, ++nb;
    }
    std::printf("     room A %.3f, room B %.6f (per patch)\n", a / na, bLight / nb);
    check(nb > 0 && bLight / nb < 1e-6, "no light goes through a solid wall");
    int seen = 0, darkProbes = 0, inWall = 0, inWallUsable = 0;
    for (int z = 0; z < b.nz; ++z)
      for (int y = 0; y < b.ny; ++y)
        for (int x = 0; x < b.nx; ++x) {
          const size_t i = static_cast<size_t>(x + b.nx * (y + b.ny * z));
          const float px = b.probeOrigin.x + x * s.probeSpacing;
          if (px > 4.4f && px < 7.8f && (b.probeMask[i] >> 31)) ++darkProbes, seen += b.probeMask[i] & 1u;
          if (px > 4.05f && px < 4.15f) ++inWall, inWallUsable += b.probeMask[i] >> 31;
        }
    check(darkProbes > 0 && seen == 0, "probes in the dark room don't see the lamp");
    check(inWall == 0 || inWallUsable == 0, "probes inside the wall are unusable");
  }
  if (failures) return 1;
  std::printf("radiosity: all checks passed\n");
  return 0;
}
