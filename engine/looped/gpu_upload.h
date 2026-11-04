#pragma once
// Smooth loading: GPU uploads that don't freeze the frame.
//
// - Work goes through the job queue (looped/jobs.h), so a model that
//   arrives with 40 textures is set up over several frames instead of one
//   long stall. At most 4 images decode at once.
// - Images go from the file bytes straight onto the GPU: the browser
//   decodes them off the main thread (createImageBitmap) and copies them
//   into the texture (copyExternalImageToTexture); mipmaps are then made
//   on the GPU. No pixel ever passes through the CPU.
#include <webgpu/webgpu_cpp.h>

#include <cstdint>
#include <functional>
#include <string>
#include <vector>

#include "looped/jobs.h"

namespace engine {

// Starts compiling the mipmap pipelines (call once at start-up; texture jobs
// wait for them).
void prepareMipmaps(const wgpu::Device& device);
// Image textures made so far, and their GPU memory (MB, with mipmaps).
int imageTextureCount();
double imageTextureMB();

// Decodes PNG/JPEG bytes and creates a mipmapped texture from them, once
// for each format in `formats` (RGBA8Unorm for data like normal maps,
// RGBA8UnormSrgb for colors). Colors are taken exactly as stored. `done`
// runs from the job queue with the textures (empty on failure). Images
// bigger than maxSize (either side) are scaled down while decoding.
void loadImageTexture(const wgpu::Device& device, std::vector<uint8_t> bytes, const std::string& mimeType,
                      std::vector<wgpu::TextureFormat> formats, const char* label,
                      std::function<void(std::vector<wgpu::Texture> textures)> done, int maxSize = 1024);

// Downloads a compressed texture made by tools/assets/astc_pack.py (a
// .ba3c(.gz) file: ASTC blocks with all mipmaps) and creates it as a color
// (sRGB) texture, a data (linear) one, or both: `done` gets them in that
// order (empty on failure). Needs a GPU with ASTC (Gpu::astc).
void loadAstcTexture(const wgpu::Device& device, const std::string& url, bool asSrgb, bool asLinear,
                     std::function<void(std::vector<wgpu::Texture> textures)> done);

// Fills mip levels 1.. of `texture` from level 0 (each level averages the
// one above, in linear light for sRGB formats). The texture needs
// TextureBinding and RenderAttachment usage.
void generateMipmaps(const wgpu::Device& device, const wgpu::Texture& texture);
// Whether mips can be made for `format` yet (the first call starts compiling
// its pipeline).
bool mipmapsReady(const wgpu::Device& device, wgpu::TextureFormat format);
// The same, recorded into an encoder (to batch several textures in one
// submit), for `layers` layers (a cube: 6).
void encodeMipmaps(const wgpu::Device& device, const wgpu::CommandEncoder& encoder, const wgpu::Texture& texture,
                   uint32_t layers = 1);

}  // namespace engine
