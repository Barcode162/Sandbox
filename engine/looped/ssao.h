#pragma once
// Soft shade where things meet (ambient occlusion, J91; docs/plan/jobs/J91.md).
// The renderer draws the opaque scene once more at half size into a depth
// and a surface-direction picture (the prepass); this works out, per pixel,
// how much of the room around it is closed in by nearby surfaces (samples in
// a spiral within `radius` metres, Alchemy/SAO-style), then blurs it,
// keeping edges (only neighbours at the same distance count). The scene
// shader multiplies only the ambient and bounced light by it, never a
// lamp's direct light (the light rule), and only for the surface it was
// worked out for (it stores the distance: glass and people in front of it
// get none).
#include <webgpu/webgpu_cpp.h>

#include <cstdint>

#include "looped/math.h"

namespace engine {

class ScreenAo {
 public:
  static constexpr wgpu::TextureFormat kNormalFormat = wgpu::TextureFormat::RGBA8Unorm;
  static constexpr wgpu::TextureFormat kDepthFormat = wgpu::TextureFormat::Depth32Float;
  bool init(const wgpu::Device& device);
  bool ready() const { return ao_ && blur_; }
  // Half the screen's size; true when the pictures were made again (the
  // scene's bind group that reads the result must be made again too).
  bool resize(uint32_t screenW, uint32_t screenH);
  uint32_t width() const { return w_; }
  uint32_t height() const { return h_; }
  // The prepass draws into these.
  const wgpu::TextureView& normalView() const { return normalView_; }
  const wgpu::TextureView& depthView() const { return depthView_; }
  // The shade (r) and each pixel's distance from the eye (g), and a stand-in
  // (no shade anywhere) for views without it (mirrors, the reflection capture).
  const wgpu::TextureView& result() const { return blurView_; }
  const wgpu::TextureView& none() const { return noneView_; }
  const wgpu::Sampler& sampler() const { return sampler_; }
  // After the prepass: the shade and the blur. `strength` 0..2 (1 = as set).
  void encode(const wgpu::CommandEncoder& encoder, const Mat4& viewProj, Vec3 eye, float radius, float strength);

 private:
  struct Uniforms {
    Mat4 invViewProj;
    Mat4 viewProj;
    float eye[4];     // xyz, w = frame number (the noise turns)
    float params[4];  // radius (m), strength, proj y scale (viewProj col 1 row 1 * 0.5 * height), -
    float size[4];    // width, height, 1 / width, 1 / height
  };
  wgpu::Device device_;
  wgpu::RenderPipeline ao_, blur_;
  wgpu::BindGroupLayout layout_;
  wgpu::Buffer uniforms_;
  wgpu::Sampler sampler_;
  wgpu::Texture normal_, depth_, raw_, blurred_, none_;
  wgpu::TextureView normalView_, depthView_, rawView_, blurView_, noneView_;
  wgpu::BindGroup aoGroup_, blurGroup_;
  uint32_t w_ = 0, h_ = 0, frame_ = 0;
};

}  // namespace engine
