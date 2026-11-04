#pragma once
// Light beams (volumetric light, J91.2; docs/plan/jobs/J91.md). The lamps'
// light caught by a thin haze in the air. The scene shader (fs_beams in
// scene.wgsl) walks along each pixel's line of sight, at a quarter of the
// screen's size, as far as the first solid thing (the soft shade's prepass
// knows how far that is), adding up the light of the lamps that have a
// shadow map (J97) at each step, so stools, the counter and the walls cut
// the beams. Lamps without one add nothing: an unblocked lamp in haze is a
// glowing ball, the blinding look the user had taken out (J92). This class
// keeps that picture and adds it, softened, onto the scene.
#include <webgpu/webgpu_cpp.h>

#include <cstdint>

namespace engine {

class LightBeams {
 public:
  static constexpr wgpu::TextureFormat kFormat = wgpu::TextureFormat::RGBA16Float;
  bool init(const wgpu::Device& device, wgpu::TextureFormat sceneFormat);
  bool ready() const { return add_ != nullptr; }
  // Half the soft shade's size (a quarter of the screen's).
  void resize(uint32_t aoW, uint32_t aoH);
  const wgpu::TextureView& target() const { return view_; }
  // Adds the beams onto the scene (after the main pass, before the eyes).
  void composite(const wgpu::CommandEncoder& encoder, const wgpu::TextureView& scene) const;

 private:
  wgpu::Device device_;
  wgpu::RenderPipeline add_;
  wgpu::BindGroupLayout layout_;
  wgpu::Sampler sampler_;
  wgpu::Texture texture_;
  wgpu::TextureView view_;
  wgpu::BindGroup group_;
  uint32_t w_ = 0, h_ = 0;
};

}  // namespace engine
