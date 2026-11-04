#include "looped/beams.h"

#include <algorithm>

#include "looped/file.h"
#include "looped/pipeline_cache.h"
#include "looped/profiler.h"

namespace engine {

bool LightBeams::init(const wgpu::Device& device, wgpu::TextureFormat sceneFormat) {
  device_ = device;
  auto source = readTextFile("/shaders/beams.wgsl");
  if (!source) return false;
  wgpu::ShaderSourceWGSL wgsl;
  wgsl.code = source->c_str();
  wgpu::ShaderModuleDescriptor md;
  md.nextInChain = &wgsl;
  md.label = "beams.wgsl";
  wgpu::ShaderModule module = device.CreateShaderModule(&md);
  wgpu::BindGroupLayoutEntry e[2];
  e[0].binding = 0;
  e[0].visibility = wgpu::ShaderStage::Fragment;
  e[0].texture.sampleType = wgpu::TextureSampleType::Float;
  e[1].binding = 1;
  e[1].visibility = wgpu::ShaderStage::Fragment;
  e[1].sampler.type = wgpu::SamplerBindingType::Filtering;
  wgpu::BindGroupLayoutDescriptor ld;
  ld.label = "light beams";
  ld.entryCount = 2;
  ld.entries = e;
  layout_ = device.CreateBindGroupLayout(&ld);
  // Added onto the scene's light.
  wgpu::BlendState blend;
  blend.color = {wgpu::BlendOperation::Add, wgpu::BlendFactor::One, wgpu::BlendFactor::One};
  blend.alpha = {wgpu::BlendOperation::Add, wgpu::BlendFactor::Zero, wgpu::BlendFactor::One};
  wgpu::ColorTargetState target;
  target.format = sceneFormat;
  target.blend = &blend;
  wgpu::FragmentState fragment;
  fragment.module = module;
  fragment.entryPoint = "fs_add";
  fragment.targetCount = 1;
  fragment.targets = &target;
  wgpu::RenderPipelineDescriptor desc;
  desc.label = "light beams: add";
  desc.layout = pipelines::pipelineLayout(device, layout_);
  desc.vertex.module = module;
  desc.vertex.entryPoint = "vs_full";
  desc.fragment = &fragment;
  desc.primitive.topology = wgpu::PrimitiveTopology::TriangleList;
  pipelines::create(device, desc, &add_);
  wgpu::SamplerDescriptor sd;
  sd.magFilter = sd.minFilter = wgpu::FilterMode::Linear;
  sd.addressModeU = sd.addressModeV = wgpu::AddressMode::ClampToEdge;
  sampler_ = device.CreateSampler(&sd);
  return true;
}

void LightBeams::resize(uint32_t aoW, uint32_t aoH) {
  const uint32_t w = std::max(1u, (aoW + 1) / 2), h = std::max(1u, (aoH + 1) / 2);
  if (w == w_ && h == h_ && texture_) return;
  w_ = w;
  h_ = h;
  wgpu::TextureDescriptor t;
  t.label = "light beams";
  t.size = {w, h, 1};
  t.format = kFormat;
  t.usage = wgpu::TextureUsage::RenderAttachment | wgpu::TextureUsage::TextureBinding;
  texture_ = device_.CreateTexture(&t);
  view_ = texture_.CreateView();
  wgpu::BindGroupEntry g[2];
  g[0].binding = 0;
  g[0].textureView = view_;
  g[1].binding = 1;
  g[1].sampler = sampler_;
  wgpu::BindGroupDescriptor bg;
  bg.layout = layout_;
  bg.entryCount = 2;
  bg.entries = g;
  group_ = device_.CreateBindGroup(&bg);
}

void LightBeams::composite(const wgpu::CommandEncoder& encoder, const wgpu::TextureView& scene) const {
  if (!add_ || !group_) return;
  wgpu::RenderPassColorAttachment color;
  color.view = scene;
  color.loadOp = wgpu::LoadOp::Load;
  color.storeOp = wgpu::StoreOp::Store;
  wgpu::RenderPassDescriptor pd;
  pd.label = "light beams: add";
  pd.colorAttachmentCount = 1;
  pd.colorAttachments = &color;
  wgpu::RenderPassEncoder r = encoder.BeginRenderPass(&pd);
  r.SetPipeline(add_);
  r.SetBindGroup(0, group_);
  r.Draw(3);
  prof::draw(3);
  r.End();
}

}  // namespace engine
