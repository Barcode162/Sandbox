// The light grid (J116.3): see probes.h.
#include "looped/bake/probes.h"

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <thread>

namespace engine::bake {

namespace {

const Vec3 kWays[6] = {{1, 0, 0}, {-1, 0, 0}, {0, 1, 0}, {0, -1, 0}, {0, 0, 1}, {0, 0, -1}};

// The six ways' weights for a surface facing n (they add up to 1).
void weights(Vec3 n, int way[3], float w[3]) {
  way[0] = n.x >= 0 ? 0 : 1, w[0] = n.x * n.x;
  way[1] = n.y >= 0 ? 2 : 3, w[1] = n.y * n.y;
  way[2] = n.z >= 0 ? 4 : 5, w[2] = n.z * n.z;
}

}  // namespace

// The points around p and their weights (open ones only; behind the
// surface counts little); the nearest open point when none of the eight is.
template <class Visit>
float around(const ProbeGrid& g, Vec3 p, Vec3 n, Visit visit) {
  if (g.count() == 0) return 0;
  const Vec3 f = (p - g.lo) * (1 / g.step);
  const int x0 = std::clamp(static_cast<int>(std::floor(f.x)), 0, std::max(0, g.nx - 2));
  const int y0 = std::clamp(static_cast<int>(std::floor(f.y)), 0, std::max(0, g.ny - 2));
  const int z0 = std::clamp(static_cast<int>(std::floor(f.z)), 0, std::max(0, g.nz - 2));
  const float fx = std::clamp(f.x - x0, 0.0f, 1.0f), fy = std::clamp(f.y - y0, 0.0f, 1.0f), fz = std::clamp(f.z - z0, 0.0f, 1.0f);
  float total = 0;
  struct Pick {
    size_t i;
    float w;
  } picks[8];
  int np = 0;
  for (int dz = 0; dz < 2; ++dz)
    for (int dy = 0; dy < 2; ++dy)
      for (int dx = 0; dx < 2; ++dx) {
        const int x = std::min(x0 + dx, g.nx - 1), y = std::min(y0 + dy, g.ny - 1), z = std::min(z0 + dz, g.nz - 1);
        const size_t i = g.index(x, y, z);
        float w = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy) * (dz ? fz : 1 - fz);
        if (w <= 0 || !g.open[i]) continue;
        if (dot(g.point(x, y, z) - p, n) < 0) w *= 0.001f;  // behind the surface: it sees the other side
        picks[np++] = {i, w};
        total += w;
      }
  if (total <= 1e-6f) {
    float best = 1e30f;
    size_t bi = g.count();
    const int r = 2;
    for (int z = std::max(0, z0 - r); z <= std::min(g.nz - 1, z0 + 1 + r); ++z)
      for (int y = std::max(0, y0 - r); y <= std::min(g.ny - 1, y0 + 1 + r); ++y)
        for (int x = std::max(0, x0 - r); x <= std::min(g.nx - 1, x0 + 1 + r); ++x) {
          const size_t i = g.index(x, y, z);
          if (!g.open[i]) continue;
          const Vec3 d = g.point(x, y, z) - p;
          if (dot(d, d) < best) best = dot(d, d), bi = i;
        }
    if (bi == g.count()) return 0;
    picks[0] = {bi, 1};
    np = 1;
    total = 1;
  }
  for (int k = 0; k < np; ++k) visit(picks[k].i, picks[k].w / total);
  return total;
}

void ProbeGrid::atAll(Vec3 p, Vec3 n, Vec3* out) const {
  for (int c = 0; c < channels; ++c) out[c] = {};
  int way[3];
  float ww[3];
  weights(n, way, ww);
  around(*this, p, n, [&](size_t i, float w) {
    const float* L = &light[i * 6 * channels * 3];
    for (int k = 0; k < 3; ++k) {
      if (ww[k] <= 0) continue;
      const float* q = L + way[k] * channels * 3;
      for (int c = 0; c < channels; ++c) out[c] = out[c] + Vec3{q[3 * c], q[3 * c + 1], q[3 * c + 2]} * (w * ww[k]);
    }
  });
}

float ProbeGrid::seenFrom(Vec3 p, Vec3 n, int l) const {
  if (l < 0 || l >= lamps) return 1;
  float v = 0;
  around(*this, p, n, [&](size_t i, float w) { v += w * seen[i * lamps + l] / 255.0f; });
  return v;
}

void ProbeGrid::shade(const Room& room, Vec3 p, Vec3 n, Vec3* out) const {
  atAll(p, n, out);
  Rng rng(static_cast<uint64_t>(std::fabs(p.x * 7919 + p.y * 104729 + p.z * 1299709)) + 1, 5);
  for (size_t l = 0; l < room.lamps.size(); ++l) {
    const float v = seenFrom(p, n, static_cast<int>(l));
    if (v <= 0) continue;
    Vec3 e;
    const int k = 16;
    for (int s = 0; s < k; ++s) e = e + lampLux(room, room.lamps[l], p, n, rng, false);
    const int c = room.lamps[l].channel;
    if (c >= 0 && c < channels) out[c] = out[c] + e * (v / k);
  }
}

Vec3 ProbeGrid::at(Vec3 p, Vec3 n, int c) const {
  std::vector<Vec3> all(static_cast<size_t>(std::max(1, channels)));
  atAll(p, n, all.data());
  if (c >= 0) return c < channels ? all[static_cast<size_t>(c)] : Vec3{};
  Vec3 s;
  for (int k = 0; k < channels; ++k) s = s + all[static_cast<size_t>(k)];
  return s;
}

ProbeGrid bakeProbes(const Room& room, Vec3 lo, Vec3 hi, int channels, const ProbeSettings& s, double* ms) {
  ProbeGrid g;
  g.step = s.step;
  g.channels = channels;
  g.lo = lo;
  g.nx = std::max(1, static_cast<int>(std::floor((hi.x - lo.x) / s.step)) + 1);
  g.ny = std::max(1, static_cast<int>(std::floor((hi.y - lo.y) / s.step)) + 1);
  g.nz = std::max(1, static_cast<int>(std::floor((hi.z - lo.z) / s.step)) + 1);
  const size_t n = g.count(), dims = 6 * static_cast<size_t>(channels) * 3;
  g.light.assign(n * dims, 0.0f);
  g.open.assign(n, 0);
  g.lamps = static_cast<int>(room.lamps.size());
  g.seen.assign(n * room.lamps.size(), 0);
  const auto t0 = std::chrono::steady_clock::now();
  std::atomic<size_t> next{0};
  auto work = [&] {
    std::vector<Vec3> acc(static_cast<size_t>(channels));
    for (size_t k; (k = next.fetch_add(16)) < n;) {
      for (size_t i = k; i < std::min(n, k + 16); ++i) {
        const int x = static_cast<int>(i % g.nx), y = static_cast<int>((i / g.nx) % g.ny), z = static_cast<int>(i / (static_cast<size_t>(g.nx) * g.ny));
        const Vec3 p = g.point(x, y, z);
        Rng rng(0x9E3779B97F4A7C15ull ^ (i * 0x2545F4914F6CDD1Dull), i + 3);
        // Inside something: most looks around hit the back of a surface.
        int behind = 0, looks = 0;
        for (int r = 0; r < 26; ++r) {
          const float u = 2 * rng.uniform() - 1, phi = 2 * kPi * rng.uniform(), sr = std::sqrt(std::max(0.0f, 1 - u * u));
          const Vec3 d{sr * std::cos(phi), u, sr * std::sin(phi)};
          Bvh::Hit h;
          ++looks;
          if (room.intersect(p, d, 1e-4f, 50, &h) && h.back) ++behind;
        }
        if (behind * 4 >= looks) continue;  // a quarter of looks from inside: not open
        g.open[i] = 1;
        // How much of each lamp can be seen from here.
        for (size_t l = 0; l < room.lamps.size(); ++l) {
          const Lamp& lamp = room.lamps[l];
          int clear = 0;
          const int rays = 32;
          for (int r = 0; r < rays; ++r) {
            Vec3 q = lamp.position;
            if (lamp.shape == 0) {
              Vec3 b;
              do b = {rng.uniform() * 2 - 1, rng.uniform() * 2 - 1, rng.uniform() * 2 - 1};
              while (dot(b, b) > 1);
              q = q + b * lamp.radius;
            } else {
              q = q + lamp.axis * (2 * rng.uniform() - 1);
              if (lamp.shape == 2) q = q + lamp.axis2 * (2 * rng.uniform() - 1);
            }
            clear += room.clear(p, q, lamp) ? 1 : 0;
          }
          g.seen[i * room.lamps.size() + l] = static_cast<uint8_t>(std::lround(255.0 * clear / rays));
        }
        float* out = &g.light[i * dims];
        for (int w = 0; w < 6; ++w) {
          std::fill(acc.begin(), acc.end(), Vec3{});
          for (int sm = 0; sm < s.samples; ++sm) incomingByChannel(room, p, kWays[w], rng, s.bounces, 0, acc.data());
          for (int c = 0; c < channels; ++c) {
            float* q = out + (static_cast<size_t>(w) * channels + c) * 3;
            q[0] = acc[static_cast<size_t>(c)].x / s.samples;
            q[1] = acc[static_cast<size_t>(c)].y / s.samples;
            q[2] = acc[static_cast<size_t>(c)].z / s.samples;
          }
        }
      }
    }
  };
  std::vector<std::thread> pool;
  for (int t = 1; t < s.threads; ++t) pool.emplace_back(work);
  work();
  for (std::thread& t : pool) t.join();
  if (ms) *ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
  return g;
}

}  // namespace engine::bake
