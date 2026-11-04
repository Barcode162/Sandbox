#include "looped/shadows.h"

#include "looped/file.h"
#include "looped/pipeline_cache.h"
#include "looped/profiler.h"

namespace engine {

bool FloorShadows::init(const wgpu::Device& device, wgpu::TextureFormat colorFormat, wgpu::TextureFormat depthFormat) {
  auto source = readTextFile("/shaders/shadow.wgsl");
  if (!source) return false;
  wgpu::ShaderSourceWGSL wgsl;
  wgsl.code = source->c_str();
  wgpu::ShaderModuleDescriptor moduleDesc;
  moduleDesc.nextInChain = &wgsl;
  wgpu::ShaderModule module = device.CreateShaderModule(&moduleDesc);
  static const wgpu::VertexAttribute attributes[] = {
      {.format = wgpu::VertexFormat::Float32x4, .offset = offsetof(Vertex, clip), .shaderLocation = 0},
      {.format = wgpu::VertexFormat::Float32x2, .offset = offsetof(Vertex, uv), .shaderLocation = 1},
      {.format = wgpu::VertexFormat::Float32, .offset = offsetof(Vertex, strength), .shaderLocation = 2},
  };
  wgpu::VertexBufferLayout vbLayout;
  vbLayout.arrayStride = sizeof(Vertex);
  vbLayout.attributeCount = 3;
  vbLayout.attributes = attributes;
  // Premultiplied black: darkens what's already drawn.
  wgpu::BlendState blend;
  blend.color = {wgpu::BlendOperation::Add, wgpu::BlendFactor::One, wgpu::BlendFactor::OneMinusSrcAlpha};
  blend.alpha = {wgpu::BlendOperation::Add, wgpu::BlendFactor::Zero, wgpu::BlendFactor::One};
  wgpu::ColorTargetState colorTarget;
  colorTarget.format = colorFormat;
  colorTarget.blend = &blend;
  wgpu::FragmentState fragment;
  fragment.module = module;
  fragment.entryPoint = "fs_main";
  fragment.targetCount = 1;
  fragment.targets = &colorTarget;
  wgpu::DepthStencilState depth;
  depth.format = depthFormat;
  depth.depthWriteEnabled = false;
  depth.depthCompare = wgpu::CompareFunction::Less;
  wgpu::RenderPipelineDescriptor desc;
  desc.label = "floor shadows";
  wgpu::PipelineLayoutDescriptor layoutDesc;  // no bind groups: everything comes per vertex
  layoutDesc.bindGroupLayoutCount = 0;  // (not zeroed by default: set it, or it's whatever was on the stack)
  layoutDesc.bindGroupLayouts = nullptr;
  desc.layout = device.CreatePipelineLayout(&layoutDesc);
  desc.vertex.module = module;
  desc.vertex.entryPoint = "vs_main";
  desc.vertex.bufferCount = 1;
  desc.vertex.buffers = &vbLayout;
  desc.fragment = &fragment;
  desc.depthStencil = &depth;
  desc.primitive.cullMode = wgpu::CullMode::None;
  pipelines::create(device, desc, &pipeline_);

  wgpu::BufferDescriptor vb;
  vb.size = kMaxShadows * 4 * sizeof(Vertex);
  vb.usage = wgpu::BufferUsage::Vertex | wgpu::BufferUsage::CopyDst;
  vertexBuffer_ = device.CreateBuffer(&vb);
  std::vector<uint16_t> indices;
  for (uint16_t q = 0; q < kMaxShadows; ++q)
    for (uint16_t i : {0, 1, 2, 0, 2, 3}) indices.push_back(static_cast<uint16_t>(q * 4 + i));
  wgpu::BufferDescriptor ib;
  ib.size = indices.size() * sizeof(uint16_t);
  ib.usage = wgpu::BufferUsage::Index | wgpu::BufferUsage::CopyDst;
  indexBuffer_ = device.CreateBuffer(&ib);
  device.GetQueue().WriteBuffer(indexBuffer_, 0, indices.data(), ib.size);
  return true;
}

void FloorShadows::begin(const Mat4& viewProj) {
  viewProj_ = viewProj;
  vertices_.clear();
}

void FloorShadows::add(Vec3 center, float radius, float strength) {
  if (vertices_.size() >= kMaxShadows * 4) return;
  const float corners[4][2] = {{-1, -1}, {1, -1}, {1, 1}, {-1, 1}};
  for (const auto& k : corners) {
    // A hair above the floor, so the floor doesn't hide it.
    const Vec4 p = transformPoint(viewProj_, center + Vec3{k[0] * radius, 0.012f, k[1] * radius});
    vertices_.push_back({{p.x, p.y, p.z, p.w}, {k[0], k[1]}, strength});
  }
}

void FloorShadows::upload(const wgpu::Queue& queue) {
  if (!vertices_.empty()) queue.WriteBuffer(vertexBuffer_, 0, vertices_.data(), vertices_.size() * sizeof(Vertex));
}

void FloorShadows::draw(const wgpu::RenderPassEncoder& pass) const {
  if (vertices_.empty() || !pipeline_) return;  // pipeline_ fills in once compiled
  pass.SetPipeline(pipeline_);
  pass.SetVertexBuffer(0, vertexBuffer_);
  pass.SetIndexBuffer(indexBuffer_, wgpu::IndexFormat::Uint16);
  pass.DrawIndexed(static_cast<uint32_t>(vertices_.size() / 4 * 6));
  prof::draw(static_cast<uint32_t>(vertices_.size() / 4 * 6));
}

}  // namespace engine
