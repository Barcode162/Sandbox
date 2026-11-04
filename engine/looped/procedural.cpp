#include "looped/procedural.h"

#include <algorithm>
#include <cmath>
#include <vector>

#include "looped/math.h"

namespace engine {
namespace {

uint32_t hash(uint32_t x) {
  x ^= x >> 16;
  x *= 0x7feb352dU;
  x ^= x >> 15;
  x *= 0x846ca68bU;
  x ^= x >> 16;
  return x;
}
uint32_t hash(int x, int y, uint32_t seed) {
  return hash(static_cast<uint32_t>(x) * 0x9E3779B1U ^ hash(static_cast<uint32_t>(y) + seed * 0x85EBCA77U));
}
// Random number in 0..1 for a lattice point.
float random01(int x, int y, uint32_t seed) { return static_cast<float>(hash(x, y, seed) >> 8) / 16777216.0f; }

int wrap(int i, int n) { return ((i % n) + n) % n; }
float smooth(float t) { return t * t * (3.0f - 2.0f * t); }
float mix(float a, float b, float t) { return a + (b - a) * t; }
float fract(float x) { return x - std::floor(x); }

// Height map → slope image (central differences, wrapping at the edges).
Image slopesFromHeight(const std::vector<float>& h, int size, float strength) {
  Image bump(size);
  auto H = [&](int x, int y) { return h[static_cast<size_t>(wrap(y, size)) * size + wrap(x, size)]; };
  for (int y = 0; y < size; ++y) {
    for (int x = 0; x < size; ++x) {
      const float du = -(H(x + 1, y) - H(x - 1, y)) * 0.5f * strength;
      const float dv = -(H(x, y + 1) - H(x, y - 1)) * 0.5f * strength;
      bump.at(x, y) = {0.5f + 0.5f * std::clamp(du, -1.0f, 1.0f), 0.5f + 0.5f * std::clamp(dv, -1.0f, 1.0f), 0.5f, 1};
    }
  }
  return bump;
}

// Runs `shade(u, v, height&)` for every pixel and returns color + bump.
template <typename Shade>
MaterialImages generate(int size, float bumpStrength, Shade shade) {
  MaterialImages m{Image(size), Image(size)};
  std::vector<float> height(static_cast<size_t>(size) * size, 0.0f);
  for (int y = 0; y < size; ++y) {
    for (int x = 0; x < size; ++x) {
      const float u = (static_cast<float>(x) + 0.5f) / static_cast<float>(size);
      const float v = (static_cast<float>(y) + 0.5f) / static_cast<float>(size);
      m.color.at(x, y) = shade(u, v, height[static_cast<size_t>(y) * size + x]);
    }
  }
  m.bump = slopesFromHeight(height, size, bumpStrength);
  return m;
}

// Wood figure: growth rings bent by noise plus fine fibers along u.
// Returns 0 (light) .. 1 (dark).
float woodFigure(float u, float v, int rings, float phase, uint32_t seed) {
  const float warp = fbm(u, v, 2, 12, 4, seed) * 2.5f;
  const float ring = 0.5f + 0.5f * std::sin(2.0f * kPi * (v * static_cast<float>(rings) + warp + phase));
  const float fibers = fbm(u, v, 4, 96, 3, seed + 7);
  return std::clamp(0.65f * std::pow(ring, 3.0f) + 0.45f * fibers - 0.1f, 0.0f, 1.0f);
}

}  // namespace

float valueNoise(float u, float v, int fu, int fv, uint32_t seed) {
  const float x = u * static_cast<float>(fu), y = v * static_cast<float>(fv);
  const int x0 = static_cast<int>(std::floor(x)), y0 = static_cast<int>(std::floor(y));
  const float tx = smooth(x - static_cast<float>(x0)), ty = smooth(y - static_cast<float>(y0));
  auto corner = [&](int dx, int dy) { return random01(wrap(x0 + dx, fu), wrap(y0 + dy, fv), seed); };
  return mix(mix(corner(0, 0), corner(1, 0), tx), mix(corner(0, 1), corner(1, 1), tx), ty);
}

float fbm(float u, float v, int fu, int fv, int octaves, uint32_t seed) {
  float sum = 0, amp = 0.5f, total = 0;
  for (int i = 0; i < octaves; ++i) {
    sum += amp * valueNoise(u, v, fu, fv, seed + static_cast<uint32_t>(i) * 101);
    total += amp;
    amp *= 0.5f;
    fu *= 2;
    fv *= 2;
  }
  return sum / total;
}

float cellNoise(float u, float v, int cells, uint32_t seed) {
  const float x = u * static_cast<float>(cells), y = v * static_cast<float>(cells);
  const int cx = static_cast<int>(std::floor(x)), cy = static_cast<int>(std::floor(y));
  float best = 10.0f;
  for (int dy = -1; dy <= 1; ++dy) {
    for (int dx = -1; dx <= 1; ++dx) {
      const int gx = cx + dx, gy = cy + dy;
      const float px = static_cast<float>(gx) + random01(wrap(gx, cells), wrap(gy, cells), seed);
      const float py = static_cast<float>(gy) + random01(wrap(gx, cells), wrap(gy, cells), seed + 1);
      best = std::min(best, std::hypot(px - x, py - y));
    }
  }
  return best;
}

MaterialImages makeWoodPlanks(int size, uint32_t seed) {
  constexpr int kPlanks = 8;
  return generate(size, 3.0f, [&](float u, float v, float& height) -> Image::Pixel {
    const int row = static_cast<int>(v * kPlanks);
    const float inRow = fract(v * kPlanks);
    // Each row is cut into two boards; joints shift randomly per row.
    const float shift = random01(row, 0, seed);
    const float along = fract(u * 2.0f + shift);
    const int board = wrap(static_cast<int>(std::floor(u * 2.0f + shift)), 2);
    const float tone = 0.8f + 0.4f * random01(row, board, seed + 3);
    const float figure = woodFigure(u, v, 24, random01(row, board, seed + 5) * 10.0f, seed + 11);

    // Distance to the nearest gap, in tile units.
    const float gapV = std::min(inRow, 1.0f - inRow) / kPlanks;
    const float gapU = std::min(along, 1.0f - along) / 2.0f;
    const float edge = smoothstep(0.0015f, 0.005f, std::min(gapV, gapU));
    height = 0.2f + 0.8f * edge;

    const float shade = tone * mix(1.15f, 0.55f, figure);
    const float c = 0.5f * mix(0.15f, shade, edge);
    return {c * 1.05f, c, c * 0.92f, 0.5f * mix(0.2f, 0.9f + 0.2f * figure, edge)};
  });
}

MaterialImages makeWoodGrain(int size, uint32_t seed) {
  return generate(size, 0.6f, [&](float u, float v, float& height) -> Image::Pixel {
    const float figure = woodFigure(u, v, 10, 0.0f, seed);
    height = 1.0f - figure;
    const float c = 0.5f * mix(1.18f, 0.6f, figure);
    return {c * 1.04f, c, c * 0.94f, 0.5f * (1.05f - 0.2f * figure)};
  });
}

MaterialImages makeBrick(int size, uint32_t seed) {
  constexpr int kAcross = 4, kRows = 12;
  constexpr float kMortar = 0.0055f;  // half the mortar joint, in tile units
  return generate(size, 4.0f, [&](float u, float v, float& height) -> Image::Pixel {
    const int row = static_cast<int>(v * kRows);
    const float inRow = fract(v * kRows);
    const float x = u * kAcross + (row % 2 ? 0.5f : 0.0f);  // running bond
    const int col = static_cast<int>(std::floor(x));
    const float inBrick = fract(x);
    const float dv = std::min(inRow, 1.0f - inRow) / kRows;
    const float du = std::min(inBrick, 1.0f - inBrick) / kAcross;
    const float d = std::min(du, dv) - kMortar;  // < 0 inside the mortar
    const float brick = smoothstep(-0.0005f, 0.0025f, d);

    // Per-brick variation: some lighter, some darker/burnt.
    const int wrappedCol = wrap(col, kAcross);
    const float r1 = random01(wrappedCol, row, seed), r2 = random01(wrappedCol, row, seed + 1);
    const float speckle = fbm(u, v, 48, 48, 3, seed + 2);
    const float tone = (0.7f + 0.5f * r1) * (0.85f + 0.3f * speckle);
    const float brickR = 0.30f * tone, brickG = (0.085f + 0.03f * r2) * tone, brickB = (0.06f + 0.015f * r2) * tone;
    const float mortarNoise = fbm(u, v, 64, 64, 2, seed + 4);
    const float mortar = 0.13f + 0.06f * mortarNoise;

    height = mix(0.1f + 0.2f * mortarNoise, 0.8f + 0.2f * speckle, brick);
    return {mix(mortar, brickR, brick), mix(mortar * 0.92f, brickG, brick), mix(mortar * 0.8f, brickB, brick),
            0.5f * mix(0.3f, 1.0f, brick)};
  });
}

MaterialImages makeLeather(int size, uint32_t seed) {
  return generate(size, 1.2f, [&](float u, float v, float& height) -> Image::Pixel {
    const float cell = cellNoise(u, v, 40, seed);
    const float pebble = 1.0f - smoothstep(0.15f, 0.75f, cell);
    const float wear = fbm(u, v, 3, 3, 4, seed + 9);
    height = pebble;
    const float c = 0.5f * (0.8f + 0.25f * pebble) * (0.85f + 0.3f * wear);
    return {c, c, c, 0.5f * (0.7f + 0.6f * pebble * wear)};
  });
}

MaterialImages makePlaster(int size, uint32_t seed) {
  return generate(size, 1.5f, [&](float u, float v, float& height) -> Image::Pixel {
    const float big = fbm(u, v, 4, 4, 4, seed);
    const float fine = fbm(u, v, 32, 32, 3, seed + 5);
    height = 0.6f * big + 0.4f * fine;
    const float c = 0.5f * (0.8f + 0.3f * big + 0.1f * fine);
    return {c, c, c, 0.5f};
  });
}

MaterialImages makeFabric(int size, uint32_t seed) {
  constexpr int kThreads = 96;
  return generate(size, 1.0f, [&](float u, float v, float& height) -> Image::Pixel {
    // Over-under weave: in alternating cells the vertical or the horizontal
    // thread is on top; each thread is rounded across its width.
    const int cx = static_cast<int>(u * kThreads), cy = static_cast<int>(v * kThreads);
    const bool warpOnTop = (cx + cy) % 2 == 0;
    const float across = warpOnTop ? fract(u * kThreads) : fract(v * kThreads);
    const float thread = 1.0f - std::abs(across * 2.0f - 1.0f);
    const float noise = fbm(u, v, 8, 8, 4, seed);
    height = thread;
    const float c = 0.5f * (0.86f + 0.14f * thread + 0.1f * (noise - 0.5f));
    return {c, c, c, 0.5f * (0.7f + 0.3f * thread)};
  });
}

MaterialImages makeDenim(int size, uint32_t seed) {
  constexpr int kThreads = 72;
  return generate(size, 1.2f, [&](float u, float v, float& height) -> Image::Pixel {
    // Twill: the weave steps one thread per row, making diagonal ridges.
    const float diagonal = fract((u + v) * kThreads);
    const float ridge = 1.0f - std::abs(diagonal * 2.0f - 1.0f);
    // White weft threads peek through; worn patches are lighter.
    const float weft = valueNoise(u, v, kThreads * 2, kThreads * 2, seed);
    const float wear = fbm(u, v, 4, 4, 4, seed + 3);
    height = ridge;
    const float light = 0.78f + 0.22f * ridge + 0.18f * weft + 0.2f * (wear - 0.5f);
    const float c = 0.5f * light;
    return {c * 0.97f, c, c * 1.04f, 0.5f * 0.8f};
  });
}

MaterialImages makeHair(int size, uint32_t seed) {
  return generate(size, 0.8f, [&](float u, float v, float& height) -> Image::Pixel {
    // Fine speckle (stubble, hair tips) over soft clumps of darker and
    // lighter strands, so hair and beard don't read as flat paint.
    const float strand = valueNoise(u, v, 192, 48, seed);
    const float fine = valueNoise(u, v, 256, 256, seed + 1);
    const float clump = fbm(u, v, 12, 12, 3, seed + 2);
    height = 0.5f * strand + 0.5f * fine;
    const float c = 0.5f * (0.55f + 0.45f * strand + 0.35f * (fine - 0.5f) + 0.4f * (clump - 0.5f));
    return {c, c, c, 0.5f * (0.6f + 0.4f * strand)};
  });
}

}  // namespace engine
