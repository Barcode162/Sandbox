#pragma once
// The drawing piece of the new skeleton (J116.4; the plan:
// docs/plan/jobs/J116.md → The skeleton): one small interface, two
// backends. WebGPU where the browser has it (Chrome, Edge, Safari 26), WebGL2
// everywhere else (about every browser since 2021), so anyone can play
// (request 2026-10-27 #7). The new frame needs no compute shaders (the light
// is baked: looped/bake/), so both backends draw the same picture from the
// same few calls:
//
//   a vertex buffer and an index buffer, textures (RGBA8, RGBA16F), one
//   uniform block per draw (fixed slots, std140 layout), pipelines made from
//   a WGSL and a GLSL ES 3.0 copy of the same shader, passes that clear and
//   draw into the screen.
//
// WebGPU groups resources in bind groups and keeps textures and samplers
// apart; WebGL2 binds each texture and uniform block one by one. The
// interface names fixed slots (uniform block 0, textures 0..3), and each
// backend maps them its own way: WGSL group 0 binding 0 is the uniforms,
// bindings 1 + 2k / 2 + 2k are texture k and its sampler; GLSL has the
// uniform block "U" at binding 0 and samplers "tex0".."tex3".
#include <cstdint>
#include <functional>
#include <memory>
#include <string>
#include <vector>

namespace engine::draw {

enum class Backend { kNone, kWebGpu, kWebGl2 };
const char* backendName(Backend b);  // "WebGPU", "WebGL2", "none"

enum class Format { kRgba8, kRgba16f };
enum class Attr { kFloat2, kFloat3, kFloat4, kUnorm8x4, kUint8x4, kHalf4, kUnorm16x2, kSnorm8x4 };

struct VertexLayout {
  uint32_t stride = 0;
  struct Item {
    Attr type;
    uint32_t offset;
  };
  std::vector<Item> items;  // location i = items[i]
};

struct PipelineDesc {
  std::string wgsl;  // entry points vs_main, fs_main
  std::string glsl;  // vertex and fragment in one text, split at "//--- fragment"
  VertexLayout layout;
  int textures = 0;     // how many texture slots it reads (0..4)
  bool depth = true;
  bool cullBack = false;
  bool toTarget = false;  // draws into a target() (RGBA16F, no multisampling), not the screen
  std::string label;
};

using Handle = uint32_t;  // 0 = none

class Device {
 public:
  virtual ~Device() = default;
  virtual Backend backend() const = 0;
  // The drawing size (device pixels) for this frame; resizes the canvas to its CSS size.
  virtual void resize(uint32_t* width, uint32_t* height) = 0;
  virtual Handle vertexBuffer(const void* data, size_t bytes) = 0;
  virtual Handle indexBuffer(const uint32_t* data, size_t count) = 0;
  // `repeat`: the picture tiles past its edges (a counter's wood grain); else its edges stretch.
  virtual Handle texture(int width, int height, Format f, const void* data, bool repeat = false) = 0;
  virtual Handle pipeline(const PipelineDesc& d) = 0;
  // New contents for a texture made by texture() (same size and format), or
  // for part of a vertex buffer (J116.5: the light repaired around a thing
  // that moved, the thing's own corners).
  virtual void updateTexture(Handle t, int width, int height, Format f, const void* data) = 0;
  virtual void updateVertices(Handle b, size_t offset, const void* data, size_t bytes) = 0;  // offset and bytes: whole 4-byte words
  // New contents for the start of an index buffer (J116.6: the clusters picked for this view).
  virtual void updateIndices(Handle b, const uint32_t* data, size_t count) = 0;
  // A picture to draw into and then read as a texture (J122: shadows): RGBA16F
  // with its own depth. The handle is a texture handle. Within a frame, draw
  // into targets first (beginTarget … drawIndexed … endTarget), then begin()
  // the screen.
  virtual Handle target(int width, int height) = 0;
  virtual bool beginTarget(Handle t, const float clear[4]) = 0;
  virtual void endTarget() = 0;
  // A frame: clear the screen (and depth), then draws, then present.
  virtual bool begin(const float clear[4]) = 0;
  // `uniforms` (std140, at most 4096 bytes) for this draw only.
  virtual void drawIndexed(Handle pipeline, Handle vertices, Handle indices, uint32_t count, const void* uniforms, size_t uniformBytes,
                           const Handle* textures, int textureCount) = 0;
  virtual void end() = 0;
  // Something went wrong (a shader didn't build): the first problem, in words.
  std::string problem;
  // At most this many drawn pixels per CSS pixel (a quality level: 1 draws a
  // quarter of a phone's pixels at 2x, 2 all of them; the screen's own ratio caps it).
  float maxPixelRatio = 2;
};

// Makes the device for the canvas: WebGPU if the browser has it (unless
// `forceGl`), else WebGL2; `ready` gets null when neither works.
void create(const char* canvasSelector, bool forceGl, std::function<void(std::unique_ptr<Device>)> ready);

}  // namespace engine::draw
