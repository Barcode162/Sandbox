#include "looped/texture.h"

#include <algorithm>
#include <bit>
#include <cmath>
#include <cstdint>
#include <vector>

#include "looped/log.h"

namespace engine {
namespace {

uint8_t toUnorm(float v) { return static_cast<uint8_t>(std::lround(std::clamp(v, 0.0f, 1.0f) * 255.0f)); }

float linearToSrgb(float v) {
  v = std::clamp(v, 0.0f, 1.0f);
  return v <= 0.0031308f ? v * 12.92f : 1.055f * std::pow(v, 1.0f / 2.4f) - 0.055f;
}

// Linear 0..1 to an sRGB byte through a table (pow() per channel per texel
// was most of the texture time).
uint8_t linearToSrgbByte(float v) {
  constexpr int kSteps = 4096;
  static const auto table = [] {
    std::vector<uint8_t> t(kSteps + 1);
    for (int i = 0; i <= kSteps; ++i) t[i] = toUnorm(linearToSrgb(static_cast<float>(i) / kSteps));
    return t;
  }();
  return table[static_cast<size_t>(std::clamp(v, 0.0f, 1.0f) * kSteps + 0.5f)];
}

Image halve(const Image& src) {
  Image dst(src.size / 2);
  for (int y = 0; y < dst.size; ++y) {
    for (int x = 0; x < dst.size; ++x) {
      const Image::Pixel* p[4] = {&src.at(2 * x, 2 * y), &src.at(2 * x + 1, 2 * y), &src.at(2 * x, 2 * y + 1),
                                  &src.at(2 * x + 1, 2 * y + 1)};
      Image::Pixel& d = dst.at(x, y);
      d = {0, 0, 0, 0};
      for (const Image::Pixel* s : p) {
        d.r += s->r * 0.25f;
        d.g += s->g * 0.25f;
        d.b += s->b * 0.25f;
        d.a += s->a * 0.25f;
      }
    }
  }
  return dst;
}

}  // namespace

wgpu::Texture createTextureArray(const wgpu::Device& device, const std::vector<Image>& layers, bool srgb,
                                 const char* label) {
  if (layers.empty()) return nullptr;
  const int size = layers[0].size;
  if (!std::has_single_bit(static_cast<unsigned>(size))) LOG_ERROR("Texture size %d is not a power of two", size);
  const auto mipCount = static_cast<uint32_t>(std::bit_width(static_cast<unsigned>(size)));

  wgpu::TextureDescriptor desc;
  desc.label = label;
  desc.size = {static_cast<uint32_t>(size), static_cast<uint32_t>(size), static_cast<uint32_t>(layers.size())};
  desc.format = srgb ? wgpu::TextureFormat::RGBA8UnormSrgb : wgpu::TextureFormat::RGBA8Unorm;
  desc.mipLevelCount = mipCount;
  desc.usage = wgpu::TextureUsage::TextureBinding | wgpu::TextureUsage::CopyDst;
  wgpu::Texture texture = device.CreateTexture(&desc);
  wgpu::Queue queue = device.GetQueue();

  std::vector<uint8_t> bytes;
  for (size_t layer = 0; layer < layers.size(); ++layer) {
    // Level 0 is read in place; only the smaller levels are new images.
    const Image* level = &layers[layer];
    Image smaller[2];
    for (uint32_t mip = 0; mip < mipCount; ++mip) {
      // Averaging happens in linear space; encoding to bytes happens last.
      bytes.resize(static_cast<size_t>(level->size) * level->size * 4);
      for (size_t i = 0; i < level->pixels.size(); ++i) {
        const Image::Pixel& p = level->pixels[i];
        bytes[i * 4 + 0] = srgb ? linearToSrgbByte(p.r) : toUnorm(p.r);
        bytes[i * 4 + 1] = srgb ? linearToSrgbByte(p.g) : toUnorm(p.g);
        bytes[i * 4 + 2] = srgb ? linearToSrgbByte(p.b) : toUnorm(p.b);
        bytes[i * 4 + 3] = toUnorm(p.a);
      }
      wgpu::TexelCopyTextureInfo dst;
      dst.texture = texture;
      dst.mipLevel = mip;
      dst.origin = {0, 0, static_cast<uint32_t>(layer)};
      wgpu::TexelCopyBufferLayout layout;
      layout.bytesPerRow = static_cast<uint32_t>(level->size) * 4;
      layout.rowsPerImage = static_cast<uint32_t>(level->size);
      const wgpu::Extent3D extent{static_cast<uint32_t>(level->size), static_cast<uint32_t>(level->size), 1};
      queue.WriteTexture(&dst, bytes.data(), bytes.size(), &layout, &extent);
      if (level->size > 1) {
        Image& next = smaller[mip % 2];
        next = halve(*level);
        level = &next;
      }
    }
  }
  return texture;
}

namespace {

float srgbToLinear(float v) { return v <= 0.04045f ? v / 12.92f : std::pow((v + 0.055f) / 1.055f, 2.4f); }

}  // namespace

wgpu::Texture createTexture2D(const wgpu::Device& device, int width, int height, const uint8_t* rgba, bool srgb,
                              const char* label) {
  const auto mipCount = static_cast<uint32_t>(std::bit_width(static_cast<unsigned>(std::max(width, height))));
  wgpu::TextureDescriptor desc;
  desc.label = label;
  desc.size = {static_cast<uint32_t>(width), static_cast<uint32_t>(height), 1};
  desc.format = srgb ? wgpu::TextureFormat::RGBA8UnormSrgb : wgpu::TextureFormat::RGBA8Unorm;
  desc.mipLevelCount = mipCount;
  desc.usage = wgpu::TextureUsage::TextureBinding | wgpu::TextureUsage::CopyDst;
  wgpu::Texture texture = device.CreateTexture(&desc);
  wgpu::Queue queue = device.GetQueue();

  // Work in linear floats so averaging is correct, then encode each level.
  int w = width, h = height;
  std::vector<float> level(static_cast<size_t>(w) * h * 4);
  for (size_t i = 0; i < level.size(); ++i) {
    const float v = rgba[i] / 255.0f;
    level[i] = srgb && i % 4 != 3 ? srgbToLinear(v) : v;
  }
  std::vector<uint8_t> bytes;
  for (uint32_t mip = 0; mip < mipCount; ++mip) {
    bytes.resize(static_cast<size_t>(w) * h * 4);
    for (size_t i = 0; i < bytes.size(); ++i) {
      bytes[i] = srgb && i % 4 != 3 ? linearToSrgbByte(level[i]) : toUnorm(level[i]);
    }
    wgpu::TexelCopyTextureInfo dst;
    dst.texture = texture;
    dst.mipLevel = mip;
    wgpu::TexelCopyBufferLayout layout;
    layout.bytesPerRow = static_cast<uint32_t>(w) * 4;
    layout.rowsPerImage = static_cast<uint32_t>(h);
    const wgpu::Extent3D extent{static_cast<uint32_t>(w), static_cast<uint32_t>(h), 1};
    queue.WriteTexture(&dst, bytes.data(), bytes.size(), &layout, &extent);
    if (mip + 1 == mipCount) break;
    // Next level: average 2x2 blocks (edge pixels repeat for odd sizes).
    const int nw = std::max(1, w / 2), nh = std::max(1, h / 2);
    std::vector<float> next(static_cast<size_t>(nw) * nh * 4);
    for (int y = 0; y < nh; ++y) {
      for (int x = 0; x < nw; ++x) {
        const int x0 = std::min(2 * x, w - 1), x1 = std::min(2 * x + 1, w - 1);
        const int y0 = std::min(2 * y, h - 1), y1 = std::min(2 * y + 1, h - 1);
        for (int c = 0; c < 4; ++c) {
          const auto at = [&](int px, int py) { return level[(static_cast<size_t>(py) * w + px) * 4 + c]; };
          next[(static_cast<size_t>(y) * nw + x) * 4 + c] = 0.25f * (at(x0, y0) + at(x1, y0) + at(x0, y1) + at(x1, y1));
        }
      }
    }
    level.swap(next);
    w = nw;
    h = nh;
  }
  return texture;
}

}  // namespace engine
