#include "looped/bake/light_paths.h"

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdlib>
#include <thread>

#include "looped/light_units.h"

namespace engine::bake {

namespace {

thread_local uint64_t tRays = 0;  // rays cast by this thread (for the speed line)

constexpr float kEps = 1e-3f;  // how far rays start off a surface

// Two directions at right angles to `n` (and to each other).
void basis(Vec3 n, Vec3& t, Vec3& b) {
  const float s = n.z >= 0 ? 1.0f : -1.0f;
  const float a = -1.0f / (s + n.z), c = n.x * n.y * a;
  t = {1 + s * n.x * n.x * a, s * c, -s * n.x};
  b = {c, s + n.y * n.y * a, -n.y};
}

// A direction around `n`, more of them straight out than sideways (cosine
// weighted: what a matte surface takes light from).
Vec3 cosineDir(Vec3 n, Rng& rng) {
  const float u = rng.uniform(), v = rng.uniform();
  const float r = std::sqrt(u), phi = 2 * kPi * v;
  Vec3 t, b;
  basis(n, t, b);
  return normalize(t * (r * std::cos(phi)) + b * (r * std::sin(phi)) + n * std::sqrt(std::max(0.0f, 1 - u)));
}

// How strongly a panel shines toward `toward` (a unit direction from it):
// brightest head-on; a one-sided one only from its front.
float panelEmit(const Lamp& l, Vec3 pn, Vec3 toward) {
  const float c = dot(pn, toward);
  return l.oneSided ? std::max(c, 0.0f) : std::fabs(c);
}

Vec3 panelNormal(const Lamp& l) { return normalize(cross(l.axis, l.axis2) + Vec3{0, 1e-6f, 0}); }

// How much a lamp could give the surface at p (no shadows), to pick lamps in
// proportion: its light worked out at a few points on it (the middle, a
// tube's ends, a panel's corners), plus a sliver of a generous bound so a
// lamp that could give anything is never left out (the average stays exact).
// A sign flat on a wall gives that wall almost nothing; picking it there by
// its middle alone wasted most samples (dark speckled patches, J116.1).
float potential(const Lamp& l, Vec3 p, Vec3 n) {
  const Vec3 d = l.position - p;
  const float d2 = std::max(dot(d, d), 1e-8f), dist = std::sqrt(d2);
  const float ext = length(l.axis) + length(l.axis2) + l.radius;
  const float cosB = std::clamp(dot(n, d) / dist + ext / dist, 0.0f, 1.0f);
  if (cosB <= 0) return 0;
  const Vec3 pn = l.shape == 2 ? panelNormal(l) : Vec3{};
  float emitB = 1;
  if (l.shape == 2) emitB = std::clamp(panelEmit(l, pn, d * (-1.0f / dist)) + ext / dist, 0.0f, 1.0f);
  const float bound = l.cd * emitB * cosB / std::max({d2, ext * ext * 0.25f, l.radius * l.radius, 1e-4f});
  if (l.shape == 0) return bound;
  const float rr = std::max(std::min(l.radius, 0.05f), 0.02f);
  auto at = [&](Vec3 q) {
    const Vec3 e = q - p;
    const float e2 = std::max(dot(e, e), 1e-8f), el = std::sqrt(e2);
    const float c = dot(n, e) / el;
    if (c <= 0) return 0.0f;
    const float emit = l.shape == 2 ? panelEmit(l, pn, e * (-1.0f / el)) : 1.0f;
    return l.cd * emit * c / std::max(e2, rr * rr);
  };
  float sum = at(l.position);
  int count = 1;
  if (l.shape == 1) {
    sum += at(l.position + l.axis) + at(l.position - l.axis);
    count = 3;
  } else {
    for (int k = 0; k < 4; ++k)
      sum += at(l.position + l.axis * ((k & 1) ? 0.8f : -0.8f) + l.axis2 * ((k & 2) ? 0.8f : -0.8f));
    count = 5;
  }
  return sum / static_cast<float>(count) + bound * 0.002f;
}

// The light from one lamp onto (p, n), sampled at a random point on the
// lamp, shadow tested (lux). `p` is already off the surface.
Vec3 lampLight(const Room& room, const Lamp& l, Vec3 p, Vec3 n, Rng& rng, bool test = true) {
  const float u = rng.uniform(), v = rng.uniform();
  if (l.shape == 0) {
    // A ball: what it gives is the same as its middle's (a glowing ball
    // seen from outside); a random point in it only for the shadow (soft).
    const Vec3 d = l.position - p;
    const float d2 = dot(d, d);
    const float c = dot(n, d) / std::sqrt(std::max(d2, 1e-8f));
    if (c <= 0) return {};
    Vec3 q;
    do q = {rng.uniform() * 2 - 1, rng.uniform() * 2 - 1, rng.uniform() * 2 - 1};
    while (dot(q, q) > 1);
    if (test && !room.clear(p, l.position + q * l.radius, l)) return {};
    return l.color * (l.cd * c / std::max(d2, l.radius * l.radius));
  }
  Vec3 q = l.position + l.axis * (2 * u - 1);
  if (l.shape == 2) q = q + l.axis2 * (2 * v - 1);
  const Vec3 d = q - p;
  const float d2 = std::max(dot(d, d), 1e-8f), dist = std::sqrt(d2);
  const Vec3 dir = d * (1.0f / dist);
  const float c = dot(n, dir);
  if (c <= 0) return {};
  const float emit = l.shape == 2 ? panelEmit(l, panelNormal(l), -dir) : 1.0f;
  if (emit <= 0) return {};
  if (test && !room.clear(p, q, l)) return {};
  const float rr = std::min(l.radius, 0.05f);
  return l.color * (l.cd * emit * c / std::max(d2, rr * rr));
}

}  // namespace

Vec3 lampLux(const Room& room, const Lamp& l, Vec3 p, Vec3 n, Rng& rng, bool shadowTested) {
  return lampLight(room, l, p, n, rng, shadowTested);
}

Lamp lampOf(const PointLight& p, bool halfOneSided) {
  Lamp l;
  l.position = p.position;
  Vec3 c = p.color;
  if (p.kelvin > 0) c = mulComponents(light::kelvinColor(p.kelvin), p.color);
  l.color = light::unitLuminance(c);
  const float lm = p.lumens > 0 ? p.lumens : light::lumensFromClassic(p.intensity);
  if (p.shape == 2) l.cd = lm / ((p.oneSided && !halfOneSided ? 1.0f : 2.0f) * kPi);
  else l.cd = light::candela(lm);
  l.radius = p.radius;
  l.shape = p.shape;
  l.axis = p.axis;
  l.axis2 = p.axis2;
  l.oneSided = p.oneSided;
  l.model = p.model;
  return l;
}

std::vector<Lamp> lampsOf(const std::vector<PointLight>& lights) {
  const char* physical = std::getenv("PHYSICAL_PANELS");
  const bool half = !(physical && *physical && *physical != '0');
  std::vector<Lamp> out;
  for (size_t i = 0; i < lights.size(); ++i) {
    out.push_back(lampOf(lights[i], half));
    out.back().channel = static_cast<int>(i);  // each its own until a rig groups them
  }
  return out;
}

Rng::Rng(uint64_t seed, uint64_t stream) {
  state = 0;
  inc = (stream << 1u) | 1u;
  next();
  state += seed;
  next();
}

uint32_t Rng::next() {
  const uint64_t old = state;
  state = old * 6364136223846793005ull + inc;
  const auto x = static_cast<uint32_t>(((old >> 18u) ^ old) >> 27u);
  const auto r = static_cast<uint32_t>(old >> 59u);
  return (x >> r) | (x << ((32u - r) & 31u));
}

void Room::build(const SceneGeometry& g, std::vector<Lamp> l) {
  geo = &g;
  bvh.build(g.positions, g.indices);
  lamps = std::move(l);
}

void Room::build(const SceneGeometry& g, std::vector<Lamp> l, const std::vector<std::vector<uint32_t>>& moverTris) {
  geo = &g;
  lamps = std::move(l);
  // The room without the movers: their triangles squashed to one far point.
  std::vector<Vec3> pos = g.positions;
  std::vector<uint32_t> idx = g.indices;
  pos.push_back({1e6f, 1e6f, 1e6f});
  const auto far = static_cast<uint32_t>(pos.size() - 1);
  movers.clear();
  moverOf.assign(g.triangleCount(), -1);
  for (const std::vector<uint32_t>& tris : moverTris) {
    for (uint32_t t : tris) moverOf[t] = static_cast<int16_t>(movers.size());
    Mover m;
    m.tris = tris;
    std::vector<uint32_t> own;
    own.reserve(tris.size() * 3);
    for (uint32_t t : tris)
      for (int k = 0; k < 3; ++k) own.push_back(g.indices[3 * t + k]), idx[3 * t + k] = far;
    m.bvh.build(g.positions, own);
    movers.push_back(std::move(m));
  }
  bvh.build(pos, idx);
}

Vec3 Room::normal(uint32_t tri) const {
  const Vec3 n = geo->normal(tri);
  if (tri < moverOf.size() && moverOf[tri] >= 0) return movers[static_cast<size_t>(moverOf[tri])].turn.rotate(n);
  return n;
}

bool Room::intersect(Vec3 o, Vec3 d, float tMin, float tMax, Bvh::Hit* hit) const {
  bool any = bvh.intersect(o, d, tMin, tMax, hit);
  for (const Mover& m : movers) {
    if (!m.present) continue;
    const Quat back = conjugate(m.turn);
    Bvh::Hit h;
    if (m.bvh.intersect(back.rotate(o - m.shift), back.rotate(d), tMin, any ? hit->t : tMax, &h)) {
      h.tri = m.tris[h.tri];
      *hit = h;
      any = true;
    }
  }
  return any;
}

bool Room::occluded(Vec3 o, Vec3 d, float tMin, float tMax) const {
  if (bvh.occluded(o, d, tMin, tMax)) return true;
  for (const Mover& m : movers) {
    if (!m.present) continue;
    const Quat back = conjugate(m.turn);
    if (m.bvh.occluded(back.rotate(o - m.shift), back.rotate(d), tMin, tMax)) return true;
  }
  return false;
}

bool Room::clear(Vec3 a, Vec3 b, const Lamp& lamp) const {
  Vec3 d = b - a;
  const float dist = length(d);
  if (dist < 1e-4f) return true;
  d = d * (1.0f / dist);
  const float tMax = dist - kEps;
  ++tRays;
  if (!occluded(a, d, 1e-4f, tMax)) return true;
  if (lamp.model < 0) return false;
  // Something's in the way: fine if it's only the lamp's own bulb.
  const float bulb = lamp.radius + 0.03f;
  float t0 = 1e-4f;
  for (int k = 0; k < 32; ++k) {
    Bvh::Hit h;
    ++tRays;
    if (!intersect(a, d, t0, tMax, &h)) return true;
    if (static_cast<int>(geo->triModel[h.tri]) != lamp.model) return false;
    const GeoMaterial& m = geo->materials[geo->triMaterial[h.tri]];
    const bool glowing = m.emission.x + m.emission.y + m.emission.z > 0.05f;
    if (!glowing && dist - h.t > bulb) return false;  // its shade
    t0 = h.t + 1e-4f;
  }
  return false;
}

namespace {

// `picks` lamps chosen by how much each could give (spread evenly over the
// weights, stratified: the bright ones always get a look, the rest in
// turn); `got(lamp, lux)` gets each one's share of the estimate.
template <class Got>
void pickLamps(const Room& room, Vec3 p, Vec3 n, Rng& rng, const std::vector<uint8_t>* use, int picks, Got got) {
  const size_t m = std::min<size_t>(room.lamps.size(), 256);
  float weights[256];
  float total = 0;
  for (size_t i = 0; i < m; ++i) {
    const bool on = !use || (*use)[i];
    weights[i] = on ? potential(room.lamps[i], p, n) : 0.0f;
    total += weights[i];
  }
  if (total <= 0) return;
  size_t i = 0;
  float below = 0;  // weight of the lamps before i
  for (int k = 0; k < picks; ++k) {
    const float pick = (static_cast<float>(k) + rng.uniform()) / static_cast<float>(picks) * total;
    while (i + 1 < m && pick >= below + weights[i]) below += weights[i++];
    size_t j = i;
    while (weights[j] <= 0 && j > 0) --j;  // rounding at the end
    got(j, lampLight(room, room.lamps[j], p, n, rng) * (total / weights[j] / static_cast<float>(picks)));
  }
}

// A path from (p, n): `atVertex(p, n, weight, picks)` at the start and at
// each surface it bounces off, with the path's weight so far (the colours
// it bounced off; cosine-weighted directions make that the whole weight).
template <class AtVertex>
void walkPath(const Room& room, Vec3 p, Vec3 n, Rng& rng, int bounces, int firstPicks, AtVertex atVertex) {
  atVertex(p, n, Vec3{1, 1, 1}, firstPicks);
  Vec3 weight{1, 1, 1};
  for (int b = 0; b < bounces; ++b) {
    const Vec3 dir = cosineDir(n, rng);
    Bvh::Hit h;
    ++tRays;
    if (!room.intersect(p, dir, 1e-4f, 200.0f, &h)) break;
    const GeoMaterial& mat = room.geo->materials[room.geo->triMaterial[h.tri]];
    Vec3 nq = room.normal(h.tri);
    if (dot(nq, dir) > 0) nq = -nq;
    const Vec3 a{std::min(mat.albedo.x, 0.97f), std::min(mat.albedo.y, 0.97f), std::min(mat.albedo.z, 0.97f)};
    weight = mulComponents(weight, a);
    if (b >= 1) {  // Russian roulette: a dim path ends early, the rest count more
      const float keep = std::min(0.95f, std::max({weight.x, weight.y, weight.z}));
      if (rng.uniform() >= keep) break;
      weight = weight * (1.0f / keep);
    }
    p = p + dir * h.t + nq * kEps;
    n = nq;
    atVertex(p, n, weight, 1);
  }
}

}  // namespace

Vec3 directLight(const Room& room, Vec3 p, Vec3 n, Rng& rng, const std::vector<uint8_t>* use, int picks) {
  Vec3 sum;
  pickLamps(room, p, n, rng, use, picks, [&](size_t, Vec3 lux) { sum += lux; });
  return sum;
}

void incomingByChannel(const Room& room, Vec3 p, Vec3 n, Rng& rng, int bounces, int firstPicks, Vec3* out) {
  walkPath(room, p, n, rng, bounces, firstPicks, [&](Vec3 q, Vec3 nq, Vec3 weight, int picks) {
    pickLamps(room, q, nq, rng, nullptr, picks, [&](size_t lamp, Vec3 lux) {
      out[room.lamps[lamp].channel] += mulComponents(weight, lux);
    });
  });
}

Vec3 incomingLight(const Room& room, Vec3 p, Vec3 n, Rng& rng, int bounces, const std::vector<uint8_t>* use,
                   int firstPicks) {
  // E(p) = D(p) + Σ (the surfaces' colours along the path) · D(next hit).
  Vec3 total;
  walkPath(room, p, n, rng, bounces, firstPicks, [&](Vec3 q, Vec3 nq, Vec3 weight, int picks) {
    total += mulComponents(weight, directLight(room, q, nq, rng, use, picks));
  });
  return total;
}

Picture render(const Room& room, const View& view, const RenderSettings& s) {
  Picture pic;
  pic.width = view.width;
  pic.height = view.height;
  const size_t px = static_cast<size_t>(view.width) * view.height;
  pic.color.assign(px, {});
  pic.light.assign(px, {});
  pic.albedo.assign(px, {});
  pic.depth.assign(px, 0);
  const Vec3 f{std::sin(view.yaw) * std::cos(view.pitch), std::sin(view.pitch), -std::cos(view.yaw) * std::cos(view.pitch)};
  const Vec3 right = normalize(cross(f, {0, 1, 0}));
  const Vec3 up = cross(right, f);
  const float th = std::tan(view.fovY * 0.5f), aspect = static_cast<float>(view.width) / view.height;
  std::atomic<int> nextRow{0};
  std::atomic<uint64_t> rays{0};
  const auto t0 = std::chrono::steady_clock::now();
  auto work = [&] {
    tRays = 0;
    for (int y; (y = nextRow.fetch_add(1)) < view.height;) {
      for (int x = 0; x < view.width; ++x) {
        const size_t i = static_cast<size_t>(y) * view.width + x;
        Rng rng(s.seed * 0x9E3779B97F4A7C15ull + i, i + 1);
        Vec3 color, lux, albedo;
        float depth = 0;
        for (int k = 0; k < s.samples; ++k) {
          const float sx = (2 * (x + rng.uniform()) / view.width - 1) * th * aspect;
          const float sy = (1 - 2 * (y + rng.uniform()) / view.height) * th;
          const Vec3 dir = normalize(f + right * sx + up * sy);
          Bvh::Hit h;
          ++tRays;
          if (!room.intersect(view.eye, dir, 0.05f, 200.0f, &h)) continue;
          const GeoMaterial& mat = room.geo->materials[room.geo->triMaterial[h.tri]];
          Vec3 n = room.normal(h.tri);
          if (dot(n, dir) > 0) n = -n;
          const Vec3 p = view.eye + dir * h.t + n * kEps;
          const Vec3 e = incomingLight(room, p, n, rng, s.bounces, nullptr, s.picks);
          color += mat.emission * room.emissiveNits + mulComponents(mat.albedo, e) * (1.0f / kPi);
          lux += e;
          albedo += mat.albedo;
          depth += h.t;
        }
        const float inv = 1.0f / s.samples;
        pic.color[i] = color * inv;
        pic.light[i] = lux * inv;
        pic.albedo[i] = albedo * inv;
        pic.depth[i] = depth * inv;
      }
    }
    rays += tRays;
  };
  std::vector<std::thread> pool;
  for (int t = 1; t < std::max(1, s.threads); ++t) pool.emplace_back(work);
  work();
  for (std::thread& t : pool) t.join();
  pic.ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
  pic.rays = rays;
  return pic;
}

namespace {

// AgX (as looped/shaders/post.wgsl): linear light (exposed) → display.
// `room` widens the range around middle grey.
Vec3 agx(Vec3 c, float room) {
  // Column-major as WGSL's mat3x3f: m * v = col0 * v.x + col1 * v.y + col2 * v.z.
  const Vec3 in0{0.842479062253094f, 0.0423282422610123f, 0.0423756549057051f};
  const Vec3 in1{0.0784335999999992f, 0.878468636469772f, 0.0784336f};
  const Vec3 in2{0.0792237451477643f, 0.0791661274605434f, 0.879142973793104f};
  const Vec3 out0{1.19687900512017f, -0.0528968517574562f, -0.0529716355144438f};
  const Vec3 out1{-0.0980208811401368f, 1.15190312990417f, -0.0980434501171241f};
  const Vec3 out2{-0.0990297440797205f, -0.0989611768448433f, 1.15107367264116f};
  const float range = 16.5f + room;
  const float minEv = std::log2(0.18f) - 0.6060606f * range, maxEv = minEv + range;
  c = maxComponents(c, {1e-10f, 1e-10f, 1e-10f});
  Vec3 x = in0 * c.x + in1 * c.y + in2 * c.z;
  auto curve = [&](float v) {
    v = std::clamp((std::log2(std::max(v, 1e-10f)) - minEv) / (maxEv - minEv), 0.0f, 1.0f);
    const float v2 = v * v, v4 = v2 * v2;
    return 15.5f * v4 * v2 - 40.14f * v4 * v + 31.96f * v4 - 6.868f * v2 * v + 0.4298f * v2 + 0.1191f * v - 0.00232f;
  };
  x = {curve(x.x), curve(x.y), curve(x.z)};
  const float luma = light::luminance(x);
  auto punch = [&](float v) { return luma + 1.12f * (std::pow(std::max(v, 0.0f), 1.08f) - luma); };
  x = {punch(x.x), punch(x.y), punch(x.z)};
  x = out0 * x.x + out1 * x.y + out2 * x.z;
  return {std::clamp(x.x, 0.0f, 1.0f), std::clamp(x.y, 0.0f, 1.0f), std::clamp(x.z, 0.0f, 1.0f)};
}

Vec3 powv(Vec3 v, float e) { return {std::pow(std::max(v.x, 0.0f), e), std::pow(std::max(v.y, 0.0f), e), std::pow(std::max(v.z, 0.0f), e)}; }

}  // namespace

std::vector<uint8_t> toDisplay(const std::vector<Vec3>& nits, int width, int height, const Mood& m) {
  // White balance (looped/post.cpp): 1 / the light's colour, part of the way.
  const Vec3 k = light::kelvinColor(m.whiteKelvin);
  Vec3 white = light::unitLuminance({1.0f / std::max(k.x, 1e-3f), 1.0f / std::max(k.y, 1e-3f), 1.0f / std::max(k.z, 1e-3f)});
  const float wa = std::clamp(m.whiteAmount, 0.0f, 1.0f);
  white = {std::pow(white.x, wa), std::pow(white.y, wa), std::pow(white.z, wa)};
  white = white * (1.0f / light::luminance(white));
  // Metering: log brightness, weighted to the middle; then the eye.
  double sum = 0, wsum = 0;
  for (int y = 0; y < height; ++y)
    for (int x = 0; x < width; ++x) {
      const float dx = (x + 0.5f) / width - 0.5f, dy = (y + 0.5f) / height - 0.5f;
      const float w = lerpf(1.0f, 0.25f, smoothstep(0.05f, 0.45f, (dx * dx + dy * dy) * 2));
      sum += w * std::log2(std::max(light::luminance(nits[static_cast<size_t>(y) * width + x]), 1e-5f));
      wsum += w;
    }
  const float e = std::clamp(static_cast<float>(sum / std::max(wsum, 1e-9)), m.eyeDarkest, m.eyeBrightest);
  const float exposure = std::exp2(m.exposureComp + std::log2(0.18f) + m.eyeKeep * (e - m.eyeReference) - e);
  std::vector<uint8_t> rgb(static_cast<size_t>(width) * height * 3);
  for (int y = 0; y < height; ++y)
    for (int x = 0; x < width; ++x) {
      const size_t i = static_cast<size_t>(y) * width + x;
      const Vec3 lit = mulComponents(maxComponents(nits[i], {}), white) * exposure;
      Vec3 c = agx(lit, m.highlightRoom);
      if (m.highlightColour > 0) {  // bright light keeps its colour
        const float ly = std::max(light::luminance(lit), 1e-6f);
        const float ty = std::pow(light::luminance(powv(agx({ly, ly, ly}, m.highlightRoom), 2.2f)), 1 / 2.2f);
        Vec3 hue = powv(lit * (std::pow(ty, 2.2f) / ly), 1 / 2.2f);
        hue = hue * (1.0f / std::max({1.0f, hue.x, hue.y, hue.z}));
        c = lerp(c, hue, m.highlightColour);
      }
      c = mulComponents(c, m.tint);
      const float luma = light::luminance(c);
      c = lerp({luma, luma, luma}, c, m.saturation);
      c = (c - Vec3{0.5f, 0.5f, 0.5f}) * m.contrast + Vec3{0.5f, 0.5f, 0.5f};
      c = c + (Vec3{1, 1, 1} - c) * m.lift;
      const float dx = (x + 0.5f) / width - 0.5f, dy = (y + 0.5f) / height - 0.5f;
      c = c * (1 - m.vignette * smoothstep(0.25f, 0.85f, (dx * dx + dy * dy) * 2));
      rgb[3 * i] = static_cast<uint8_t>(std::lround(std::clamp(c.x, 0.0f, 1.0f) * 255));
      rgb[3 * i + 1] = static_cast<uint8_t>(std::lround(std::clamp(c.y, 0.0f, 1.0f) * 255));
      rgb[3 * i + 2] = static_cast<uint8_t>(std::lround(std::clamp(c.z, 0.0f, 1.0f) * 255));
    }
  return rgb;
}

}  // namespace engine::bake
