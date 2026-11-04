#pragma once
// Soft shadows on the floor (docs/archive/ENGINE.md E4.2): a dark, blurry disc under
// each avatar, so people stand on the floor instead of floating over it.
// Cheap: one quad each, one draw call, after the scene (depth-tested, so
// furniture in front hides them).
//
// Per frame: begin(viewProj) -> add()... -> upload() -> (in the pass) draw()
#include <webgpu/webgpu_cpp.h>

#include <vector>

#include "looped/math.h"

namespace engine {

class FloorShadows {
 public:
  bool init(const wgpu::Device& device, wgpu::TextureFormat colorFormat, wgpu::TextureFormat depthFormat);
  void begin(const Mat4& viewProj);
  // A shadow on the floor at `center` (its height = the floor's), `radius`
  // metres, `strength` 0..1 (how dark the middle is).
  void add(Vec3 center, float radius, float strength);
  void upload(const wgpu::Queue& queue);
  void draw(const wgpu::RenderPassEncoder& pass) const;

 private:
  struct Vertex {
    float clip[4];
    float uv[2];
    float strength;
  };
  static constexpr uint32_t kMaxShadows = 24;
  wgpu::RenderPipeline pipeline_;
  wgpu::Buffer vertexBuffer_, indexBuffer_;
  std::vector<Vertex> vertices_;
  Mat4 viewProj_;
};

}  // namespace engine
