#include "looped/ssao.h"

#include <algorithm>
#include <cmath>

#include "looped/file.h"
#include "looped/log.h"
#include "looped/pipeline_cache.h"
#include "looped/profiler.h"

namespace engine {

namespace {
constexpr wgpu::TextureFormat kResultFormat = wgpu::TextureFormat::RG16Float;  // shade, distance

wgpu::Texture makeTexture(const wgpu::Device& d, uint32_t w, uint32_t h, wgpu::TextureFormat f, const char* label) {
  wgpu::TextureDescriptor t;
  t.label = label;
  t.size = {w, h, 1};
  t.format = f;
  t.usage = wgpu::TextureUsage::RenderAttachment | wgpu::TextureUsage::TextureBinding;
  return d.CreateTexture(&t);
}
}  // namespace

bool ScreenAo::init(const wgpu::Device& device) {
  device_ = device;
  auto source = readTextFile("/shaders/ssao.wgsl");
  if (!source) return false;
  wgpu::ShaderSourceWGSL wgsl;
  wgsl.code = source->c_str();
  wgpu::ShaderModuleDescriptor md;
  md.nextInChain = &wgsl;
  md.label = "ssao.wgsl";
  wgpu::ShaderModule module = device.CreateShaderModule(&md);
  wgpu::BindGroupLayoutEntry e[4];
  e[0].binding = 0;
  e[0].visibility = wgpu::ShaderStage::Fragment;
  e[0].buffer.type = wgpu::BufferBindingType::Uniform;
  e[1].binding = 1;
  e[1].visibility = wgpu::ShaderStage::Fragment;
  e[1].texture.sampleType = wgpu::TextureSampleType::Depth;
  e[2].binding = 2;
  e[2].visibility = wgpu::ShaderStage::Fragment;
  e[2].texture.sampleType = wgpu::TextureSampleType::UnfilterableFloat;
  e[3].binding = 3;
  e[3].visibility = wgpu::ShaderStage::Fragment;
  e[3].texture.sampleType = wgpu::TextureSampleType::UnfilterableFloat;
  wgpu::BindGroupLayoutDescriptor ld;
  ld.label = "ssao";
  ld.entryCount = 4;
  ld.entries = e;
  layout_ = device.CreateBindGroupLayout(&ld);
  auto make = [&](const char* entry, wgpu::RenderPipeline* slot) {
    wgpu::ColorTargetState target;
    target.format = kResultFormat;
    wgpu::FragmentState fragment;
    fragment.module = module;
    fragment.entryPoint = entry;
    fragment.targetCount = 1;
    fragment.targets = &target;
    wgpu::RenderPipelineDescriptor desc;
    desc.label = entry;
    desc.layout = pipelines::pipelineLayout(device, layout_);
    desc.vertex.module = module;
    desc.vertex.entryPoint = "vs_full";
    desc.fragment = &fragment;
    desc.primitive.topology = wgpu::PrimitiveTopology::TriangleList;
    pipelines::create(device, desc, slot);
  };
  make("fs_ao", &ao_);
  make("fs_blur", &blur_);
  wgpu::BufferDescriptor bd;
  bd.label = "ssao uniforms";
  bd.size = sizeof(Uniforms);
  bd.usage = wgpu::BufferUsage::Uniform | wgpu::BufferUsage::CopyDst;
  uniforms_ = device.CreateBuffer(&bd);
  wgpu::SamplerDescriptor sd;
  sd.magFilter = sd.minFilter = wgpu::FilterMode::Linear;
  sd.addressModeU = sd.addressModeV = wgpu::AddressMode::ClampToEdge;
  sampler_ = device.CreateSampler(&sd);
  // No shade anywhere: shade 1, distance 0 (the scene shader's check then
  // never matches, so nothing is darkened).
  wgpu::TextureDescriptor t;
  t.label = "no soft shade";
  t.size = {1, 1, 1};
  t.format = kResultFormat;
  t.usage = wgpu::TextureUsage::TextureBinding | wgpu::TextureUsage::CopyDst;
  none_ = device.CreateTexture(&t);
  noneView_ = none_.CreateView();
  const uint16_t one[2] = {0x3c00, 0};  // half floats 1.0, 0.0
  wgpu::TexelCopyTextureInfo dst;
  dst.texture = none_;
  wgpu::TexelCopyBufferLayout layout;
  layout.bytesPerRow = 4;
  wgpu::Extent3D size = {1, 1, 1};
  device.GetQueue().WriteTexture(&dst, one, sizeof(one), &layout, &size);
  return true;
}

bool ScreenAo::resize(uint32_t screenW, uint32_t screenH) {
  const uint32_t w = std::max(1u, screenW / 2), h = std::max(1u, screenH / 2);
  if (w == w_ && h == h_ && normal_) return false;
  w_ = w;
  h_ = h;
  normal_ = makeTexture(device_, w, h, kNormalFormat, "soft shade: directions");
  depth_ = makeTexture(device_, w, h, kDepthFormat, "soft shade: depth");
  raw_ = makeTexture(device_, w, h, kResultFormat, "soft shade");
  blurred_ = makeTexture(device_, w, h, kResultFormat, "soft shade (blurred)");
  normalView_ = normal_.CreateView();
  depthView_ = depth_.CreateView();
  rawView_ = raw_.CreateView();
  blurView_ = blurred_.CreateView();
  auto group = [&](const wgpu::TextureView& c) {
    wgpu::BindGroupEntry g[4];
    g[0].binding = 0;
    g[0].buffer = uniforms_;
    g[0].size = sizeof(Uniforms);
    g[1].binding = 1;
    g[1].textureView = depthView_;
    g[2].binding = 2;
    g[2].textureView = normalView_;
    g[3].binding = 3;
    g[3].textureView = c;
    wgpu::BindGroupDescriptor bg;
    bg.layout = layout_;
    bg.entryCount = 4;
    bg.entries = g;
    return device_.CreateBindGroup(&bg);
  };
  aoGroup_ = group(noneView_);  // (the shade pass doesn't read binding 3)
  blurGroup_ = group(rawView_);
  return true;
}

void ScreenAo::encode(const wgpu::CommandEncoder& encoder, const Mat4& viewProj, Vec3 eye, float radius,
                      float strength) {
  if (!ready() || !normal_) return;
  Uniforms u = {};
  u.viewProj = viewProj;
  u.invViewProj = inverse(viewProj);
  u.eye[0] = eye.x, u.eye[1] = eye.y, u.eye[2] = eye.z, u.eye[3] = static_cast<float>(frame_++ % 64);
  // How many pixels a metre is at distance 1: the projection's y scale (the
  // length of viewProj's y row) times half the height.
  const float fy = std::sqrt(viewProj.at(0, 1) * viewProj.at(0, 1) + viewProj.at(1, 1) * viewProj.at(1, 1) +
                             viewProj.at(2, 1) * viewProj.at(2, 1));
  u.params[0] = radius;
  u.params[1] = strength;
  u.params[2] = fy * 0.5f * static_cast<float>(h_);
  u.size[0] = static_cast<float>(w_), u.size[1] = static_cast<float>(h_);
  u.size[2] = 1.0f / static_cast<float>(w_), u.size[3] = 1.0f / static_cast<float>(h_);
  device_.GetQueue().WriteBuffer(uniforms_, 0, &u, sizeof(u));
  auto pass = [&](const wgpu::TextureView& target, const wgpu::RenderPipeline& p, const wgpu::BindGroup& g,
                  const char* label) {
    wgpu::RenderPassColorAttachment color;
    color.view = target;
    color.loadOp = wgpu::LoadOp::Clear;
    color.storeOp = wgpu::StoreOp::Store;
    color.clearValue = {1, 0, 0, 1};
    wgpu::RenderPassDescriptor pd;
    pd.label = label;
    pd.colorAttachmentCount = 1;
    pd.colorAttachments = &color;
    wgpu::RenderPassEncoder r = encoder.BeginRenderPass(&pd);
    r.SetPipeline(p);
    r.SetBindGroup(0, g);
    r.Draw(3);
    prof::draw(3);
    r.End();
  };
  pass(rawView_, ao_, aoGroup_, "soft shade");
  pass(blurView_, blur_, blurGroup_, "soft shade: blur");
}

}  // namespace engine
