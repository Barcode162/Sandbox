#include "looped/post.h"

#include <algorithm>

#include "looped/file.h"
#include "looped/frame_time.h"
#include "looped/light_units.h"
#include "looped/log.h"
#include "looped/pipeline_cache.h"
#include "looped/profiler.h"

namespace engine {

namespace {

constexpr wgpu::TextureFormat kMeterFormat = wgpu::TextureFormat::RGBA16Float;

wgpu::ShaderModule shader(const wgpu::Device& device) {
  auto source = readTextFile("/shaders/post.wgsl");
  if (!source) return nullptr;
  wgpu::ShaderSourceWGSL wgsl;
  wgsl.code = source->c_str();
  wgpu::ShaderModuleDescriptor desc;
  desc.nextInChain = &wgsl;
  desc.label = "post.wgsl";
  return device.CreateShaderModule(&desc);
}

}  // namespace

bool PostEffects::init(Gpu& gpu) {
  gpu_ = &gpu;
  const wgpu::Device& device = gpu.device;
  wgpu::ShaderModule module = shader(device);
  if (!module) return false;
  {
    wgpu::BindGroupLayoutEntry e[5];
    e[0].binding = 0;
    e[0].visibility = wgpu::ShaderStage::Fragment;
    e[0].buffer.type = wgpu::BufferBindingType::Uniform;
    for (int i = 1; i <= 2; ++i) {
      e[i].binding = static_cast<uint32_t>(i);
      e[i].visibility = wgpu::ShaderStage::Fragment;
      e[i].texture.sampleType = wgpu::TextureSampleType::Float;
    }
    e[3].binding = 3;
    e[3].visibility = wgpu::ShaderStage::Fragment;
    e[3].sampler.type = wgpu::SamplerBindingType::Filtering;
    e[4].binding = 4;
    e[4].visibility = wgpu::ShaderStage::Fragment;
    e[4].texture.sampleType = wgpu::TextureSampleType::UnfilterableFloat;
    wgpu::BindGroupLayoutDescriptor ld;
    ld.label = "post";
    ld.entryCount = 5;
    ld.entries = e;
    layout_ = device.CreateBindGroupLayout(&ld);
  }
  {
    wgpu::SamplerDescriptor sd;
    sd.magFilter = sd.minFilter = wgpu::FilterMode::Linear;
    sd.addressModeU = sd.addressModeV = wgpu::AddressMode::ClampToEdge;
    sampler_ = device.CreateSampler(&sd);
  }
  for (wgpu::Buffer& b : uniforms_) {
    wgpu::BufferDescriptor bd;
    bd.label = "post uniforms";
    bd.size = sizeof(Uniforms);
    bd.usage = wgpu::BufferUsage::Uniform | wgpu::BufferUsage::CopyDst;
    b = device.CreateBuffer(&bd);
  }
  // Pipelines over one full-screen triangle.
  auto make = [&](const char* entry, wgpu::TextureFormat format, bool withDepth, wgpu::RenderPipeline* slot) {
    wgpu::ColorTargetState target;
    target.format = format;
    wgpu::FragmentState fragment;
    fragment.module = module;
    fragment.entryPoint = entry;
    fragment.targetCount = 1;
    fragment.targets = &target;
    wgpu::DepthStencilState depth;
    depth.format = Gpu::kDepthFormat;
    depth.depthWriteEnabled = false;
    depth.depthCompare = wgpu::CompareFunction::Always;
    wgpu::RenderPipelineDescriptor desc;
    desc.label = entry;
    desc.layout = pipelines::pipelineLayout(device, layout_);
    desc.vertex.module = module;
    desc.vertex.entryPoint = "vs_full";
    desc.fragment = &fragment;
    if (withDepth) desc.depthStencil = &depth;
    desc.primitive.topology = wgpu::PrimitiveTopology::TriangleList;
    pipelines::create(device, desc, slot);
  };
  make("fs_composite", gpu.surfaceFormat, true, &composite_);
  make("fs_meter", kMeterFormat, false, &meter_);
  make("fs_meter_down", kMeterFormat, false, &meterDown_);
  make("fs_adapt", kMeterFormat, false, &adapt_);
  make("fs_fixed", kMeterFormat, false, &fixed_);
  // The meters and the eye (small, made once).
  auto small = [&](uint32_t size, const char* label, wgpu::Texture& tex, wgpu::TextureView& view) {
    wgpu::TextureDescriptor d;
    d.label = label;
    d.size = {size, size, 1};
    d.format = kMeterFormat;
    d.usage = wgpu::TextureUsage::RenderAttachment | wgpu::TextureUsage::TextureBinding;
    tex = device.CreateTexture(&d);
    view = tex.CreateView();
  };
  small(64, "eyes: meter", meterTex_, meterView_);
  small(8, "eyes: meter 8x8", meterSmallTex_, meterSmallView_);
  small(1, "eyes: exposure A", eyeTex_[0], eyeView_[0]);
  small(1, "eyes: exposure B", eyeTex_[1], eyeView_[1]);
  return true;
}

wgpu::BindGroup PostEffects::bind(const wgpu::Buffer& u, const wgpu::TextureView& a, const wgpu::TextureView& b,
                                  const wgpu::TextureView& eye) {
  wgpu::BindGroupEntry e[5];
  e[0].binding = 0;
  e[0].buffer = u;
  e[0].size = sizeof(Uniforms);
  e[1].binding = 1;
  e[1].textureView = a;
  e[2].binding = 2;
  e[2].textureView = b;
  e[3].binding = 3;
  e[3].sampler = sampler_;
  e[4].binding = 4;
  e[4].textureView = eye;
  wgpu::BindGroupDescriptor bg;
  bg.layout = layout_;
  bg.entryCount = 5;
  bg.entries = e;
  return gpu_->device.CreateBindGroup(&bg);
}

void PostEffects::resize() {
  if (width_ == gpu_->width && height_ == gpu_->height && scene_) return;
  width_ = std::max(1u, gpu_->width);
  height_ = std::max(1u, gpu_->height);
  const wgpu::Device& device = gpu_->device;
  {
    wgpu::TextureDescriptor d;
    d.label = "scene (linear light)";
    d.size = {width_, height_, 1};
    d.format = Gpu::kSceneFormat;
    d.usage = wgpu::TextureUsage::RenderAttachment | wgpu::TextureUsage::TextureBinding;
    scene_ = device.CreateTexture(&d);
    sceneView_ = scene_.CreateView();
  }
  // The composite reads the scene and the eye; the eye's groups come in two,
  // one per eye texture (they take turns).
  const wgpu::TextureView& e0 = eyeView_[0];
  for (int k = 0; k < 2; ++k) compositeGroups_[k] = bind(uniforms_[0], sceneView_, sceneView_, eyeView_[k]);
  groups_[1] = bind(uniforms_[1], sceneView_, sceneView_, e0);                 // meter
  groups_[2] = bind(uniforms_[2], meterView_, meterView_, e0);                 // meter down
  groups_[3] = bind(uniforms_[3], meterSmallView_, eyeView_[0], eyeView_[0]);  // adapt, last eye A → B
  groups_[4] = bind(uniforms_[3], meterSmallView_, eyeView_[1], eyeView_[1]);  // adapt, last eye B → A
}

const wgpu::TextureView& PostEffects::sceneTarget() {
  resize();
  return sceneView_;
}

void PostEffects::pass(const wgpu::CommandEncoder& encoder, const wgpu::TextureView& target, bool load,
                       const wgpu::RenderPipeline& pipeline, const wgpu::BindGroup& group, const char* label) {
  wgpu::RenderPassColorAttachment color;
  color.view = target;
  color.loadOp = load ? wgpu::LoadOp::Load : wgpu::LoadOp::Clear;
  color.storeOp = wgpu::StoreOp::Store;
  color.clearValue = {0, 0, 0, 1};
  wgpu::RenderPassDescriptor pd;
  pd.label = label;
  pd.colorAttachmentCount = 1;
  pd.colorAttachments = &color;
  wgpu::RenderPassEncoder p = encoder.BeginRenderPass(&pd);
  p.SetPipeline(pipeline);
  p.SetBindGroup(0, group);
  p.Draw(3);
  prof::draw(3);
  p.End();
}

void PostEffects::apply(const wgpu::CommandEncoder& encoder, const wgpu::TextureView& target,
                        const std::function<void(const wgpu::RenderPassEncoder&)>& overlay, bool classic,
                        bool eyes) {
  resize();
  const wgpu::Queue& queue = gpu_->queue;
  const Mood& m = mood_;
  const double now = clockMs();
  const float dt = lastMs_ < 0 ? 0.0f : static_cast<float>(std::min(0.25, (now - lastMs_) / 1000.0));
  lastMs_ = now;
  auto write = [&](int step, uint32_t srcW, uint32_t srcH) {
    Uniforms u = {};
    u.texel[0] = 1.0f / static_cast<float>(srcW);
    u.texel[1] = 1.0f / static_cast<float>(srcH);
    u.texel[2] = m.highlightColour;
    u.texel[3] = m.eyeReference;
    u.params[3] = m.vignette;
    u.grade[0] = m.tint.x;
    u.grade[1] = m.tint.y;
    u.grade[2] = m.tint.z;
    u.grade[3] = m.saturation;
    u.grade2[0] = m.contrast;
    u.grade2[1] = m.lift;
    u.grade2[2] = classic ? 1.0f : 0.0f;
    u.grade2[3] = dt;
    u.eye[0] = m.exposureComp;
    u.eye[1] = m.eyeDarkest;
    u.eye[2] = m.eyeBrightest;
    u.eye[3] = resetEyes_ ? 1.0f : 0.0f;
    u.eye2[0] = m.adaptBright;
    u.eye2[1] = m.adaptDark;
    u.eye2[2] = -m.exposureComp;  // fixed exposure (eyes off): middle grey at light 1
    u.eye2[3] = m.eyeKeep;
    u.white[3] = m.highlightRoom;
    {  // White balance: 1 / the light's colour, part of the way, at luminance 1.
      const Vec3 k = light::kelvinColor(m.whiteKelvin);
      Vec3 w{1.0f / std::max(k.x, 1e-3f), 1.0f / std::max(k.y, 1e-3f), 1.0f / std::max(k.z, 1e-3f)};
      w = light::unitLuminance(w);
      const float a = classic ? 0.0f : std::clamp(m.whiteAmount, 0.0f, 1.0f);
      u.white[0] = std::pow(w.x, a);
      u.white[1] = std::pow(w.y, a);
      u.white[2] = std::pow(w.z, a);
      const float l = light::luminance({u.white[0], u.white[1], u.white[2]});
      for (int c = 0; c < 3; ++c) u.white[c] /= l;
    }
    queue.WriteBuffer(uniforms_[step], 0, &u, sizeof(u));
  };
  write(0, width_, height_);  // composite
  write(1, 64, 64);           // meter
  write(2, 8, 8);             // meter down
  write(3, 8, 8);             // adapt
  if (!classic) {
    // Eyes: meter, then ease this frame's eye from last frame's.
    const int next = 1 - eyeCurrent_;
    if (eyes) {
      pass(encoder, meterView_, false, meter_, groups_[1], "eyes: meter");
      pass(encoder, meterSmallView_, false, meterDown_, groups_[2], "eyes: 8x8");
      pass(encoder, eyeView_[next], false, adapt_, groups_[3 + eyeCurrent_], "eyes: adapt");
    } else {
      pass(encoder, eyeView_[next], false, fixed_, groups_[3 + eyeCurrent_], "eyes: fixed");
    }
    eyeCurrent_ = next;
    resetEyes_ = false;
  }
  wgpu::RenderPassColorAttachment color;
  color.view = target;
  color.loadOp = wgpu::LoadOp::Clear;
  color.storeOp = wgpu::StoreOp::Store;
  color.clearValue = {0, 0, 0, 1};
  wgpu::RenderPassDepthStencilAttachment depth;
  depth.view = gpu_->depthView;  // the scene's depth: name pictures hide behind walls
  depth.depthLoadOp = wgpu::LoadOp::Load;
  depth.depthClearValue = 1.0f;  // (unused with Load, but must be a number)
  depth.depthStoreOp = wgpu::StoreOp::Discard;
  wgpu::RenderPassDescriptor pd;
  pd.label = "mood";
  pd.colorAttachmentCount = 1;
  pd.colorAttachments = &color;
  pd.depthStencilAttachment = &depth;
  wgpu::RenderPassEncoder p = encoder.BeginRenderPass(&pd);
  p.SetPipeline(composite_);
  p.SetBindGroup(0, compositeGroups_[eyeCurrent_]);
  p.Draw(3);
  prof::draw(3);
  if (overlay) overlay(p);
  p.End();
}

}  // namespace engine
