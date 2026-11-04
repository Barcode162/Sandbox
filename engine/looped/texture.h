#pragma once
// CPU images and their upload to the GPU as texture arrays with mipmaps.
#include <webgpu/webgpu_cpp.h>

#include <cstdint>
#include <vector>

#include "looped/image.h"

namespace engine {

// Uploads equally sized square images as layers of one 2D texture array, with
// a full mip chain (each level averages 2x2 pixels of the one above).
// srgb = true stores RGB gamma-encoded (best for colors; the GPU decodes it
// back to linear when sampling). Alpha is always stored linearly.
wgpu::Texture createTextureArray(const wgpu::Device& device, const std::vector<Image>& layers, bool srgb,
                                 const char* label);

// Uploads one 8-bit RGBA image (any size) as a 2D texture with a full mip
// chain. srgb = true for colors (mips are averaged in linear light).
wgpu::Texture createTexture2D(const wgpu::Device& device, int width, int height, const uint8_t* rgba, bool srgb,
                              const char* label);

}  // namespace engine
