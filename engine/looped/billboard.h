#pragma once
// Round pictures floating in the world and always facing you, e.g. the
// profile picture over each player's head. Pictures live in a small
// texture array (one slot each); every frame you queue where to draw them.
// Drawn after the scene, depth-tested (walls hide them), one draw call.
//
// Per frame: begin(viewProj) -> add()... -> upload() -> (in the pass) draw()
#include <webgpu/webgpu_cpp.h>

#include <cstdint>
#include <vector>

#include "looped/fetch.h"
#include "looped/math.h"

namespace engine {

class PictureBillboards {
 public:
  static constexpr uint32_t kSlots = 8;
  static constexpr uint32_t kSize = 128;  // pixels per picture

  bool init(const wgpu::Device& device, wgpu::TextureFormat colorFormat, wgpu::TextureFormat depthFormat);

  // Puts a picture (any size, scaled to fit) into a slot.
  void setPicture(uint32_t slot, const Rgba8Image& image);

  void begin(const Mat4& viewProj);
  // A round picture centered at `center` on the plane spanned by the unit
  // vectors `right` and `up`, `radius` meters, with a colored rim
  // (color 0..1 display space). `alpha` fades the whole thing.
  void add(uint32_t slot, Vec3 center, Vec3 right, Vec3 up, float radius, Vec3 rimColor, float alpha);
  void upload(const wgpu::Queue& queue);
  void draw(const wgpu::RenderPassEncoder& pass) const;

 private:
  struct Vertex {
    float clip[4];
    float uv[2];
    float layer;
    float alpha;
    float rim[4];
  };
  static constexpr uint32_t kMaxQuads = 16;

  wgpu::Device device_;
  wgpu::Texture texture_;
  wgpu::RenderPipeline pipeline_;
  wgpu::BindGroupLayout bindLayout_;
  wgpu::BindGroup bindGroup_;
  wgpu::Buffer vertexBuffer_, indexBuffer_;
  std::vector<Vertex> vertices_;
  Mat4 viewProj_;
};

}  // namespace engine
