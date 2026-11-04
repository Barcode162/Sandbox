#include "looped/billboard.h"

#include <algorithm>

#include "looped/file.h"
#include "looped/log.h"
#include "looped/pipeline_cache.h"
#include "looped/profiler.h"

namespace engine {

bool PictureBillboards::init(const wgpu::Device& device, wgpu::TextureFormat colorFormat,
                             wgpu::TextureFormat depthFormat) {
  device_ = device;
  wgpu::TextureDescriptor texDesc;
  texDesc.label = "pictures";
  texDesc.size = {kSize, kSize, kSlots};
  texDesc.format = wgpu::TextureFormat::RGBA8Unorm;
  texDesc.mipLevelCount = 3;
  texDesc.usage = wgpu::TextureUsage::TextureBinding | wgpu::TextureUsage::CopyDst;
  texture_ = device.CreateTexture(&texDesc);
  wgpu::TextureViewDescriptor viewDesc;
  viewDesc.dimension = wgpu::TextureViewDimension::e2DArray;
  wgpu::SamplerDescriptor samplerDesc;
  samplerDesc.magFilter = samplerDesc.minFilter = wgpu::FilterMode::Linear;
  samplerDesc.mipmapFilter = wgpu::MipmapFilterMode::Linear;
  wgpu::BindGroupEntry entries[2];
  entries[0].binding = 0;
  entries[0].textureView = texture_.CreateView(&viewDesc);
  entries[1].binding = 1;
  entries[1].sampler = device.CreateSampler(&samplerDesc);

  auto source = readTextFile("/shaders/billboard.wgsl");
  if (!source) return false;
  wgpu::ShaderSourceWGSL wgsl;
  wgsl.code = source->c_str();
  wgpu::ShaderModuleDescriptor moduleDesc;
  moduleDesc.nextInChain = &wgsl;
  wgpu::ShaderModule module = device.CreateShaderModule(&moduleDesc);

  static const wgpu::VertexAttribute attributes[] = {
      {.format = wgpu::VertexFormat::Float32x4, .offset = offsetof(Vertex, clip), .shaderLocation = 0},
      {.format = wgpu::VertexFormat::Float32x2, .offset = offsetof(Vertex, uv), .shaderLocation = 1},
      {.format = wgpu::VertexFormat::Float32, .offset = offsetof(Vertex, layer), .shaderLocation = 2},
      {.format = wgpu::VertexFormat::Float32, .offset = offsetof(Vertex, alpha), .shaderLocation = 3},
      {.format = wgpu::VertexFormat::Float32x4, .offset = offsetof(Vertex, rim), .shaderLocation = 4},
  };
  wgpu::VertexBufferLayout vbLayout;
  vbLayout.arrayStride = sizeof(Vertex);
  vbLayout.attributeCount = 5;
  vbLayout.attributes = attributes;
  wgpu::BlendState blend;
  blend.color = {wgpu::BlendOperation::Add, wgpu::BlendFactor::One, wgpu::BlendFactor::OneMinusSrcAlpha};
  blend.alpha = {wgpu::BlendOperation::Add, wgpu::BlendFactor::One, wgpu::BlendFactor::OneMinusSrcAlpha};
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
  desc.label = "pictures";
  bindLayout_ = pipelines::textureSamplerLayout(device, wgpu::TextureViewDimension::e2DArray);
  desc.layout = pipelines::pipelineLayout(device, bindLayout_);
  desc.vertex.module = module;
  desc.vertex.entryPoint = "vs_main";
  desc.vertex.bufferCount = 1;
  desc.vertex.buffers = &vbLayout;
  desc.fragment = &fragment;
  desc.depthStencil = &depth;
  desc.primitive.cullMode = wgpu::CullMode::None;
  pipelines::create(device, desc, &pipeline_);

  wgpu::BindGroupDescriptor bg;
  bg.layout = bindLayout_;
  bg.entryCount = 2;
  bg.entries = entries;
  bindGroup_ = device.CreateBindGroup(&bg);

  wgpu::BufferDescriptor vb;
  vb.size = kMaxQuads * 4 * sizeof(Vertex);
  vb.usage = wgpu::BufferUsage::Vertex | wgpu::BufferUsage::CopyDst;
  vertexBuffer_ = device.CreateBuffer(&vb);
  std::vector<uint16_t> indices;
  for (uint16_t q = 0; q < kMaxQuads; ++q) {
    for (uint16_t i : {0, 1, 2, 0, 2, 3}) indices.push_back(static_cast<uint16_t>(q * 4 + i));
  }
  wgpu::BufferDescriptor ib;
  ib.size = indices.size() * sizeof(uint16_t);
  ib.usage = wgpu::BufferUsage::Index | wgpu::BufferUsage::CopyDst;
  indexBuffer_ = device.CreateBuffer(&ib);
  device.GetQueue().WriteBuffer(indexBuffer_, 0, indices.data(), ib.size);
  return true;
}

void PictureBillboards::setPicture(uint32_t slot, const Rgba8Image& image) {
  if (slot >= kSlots || image.width <= 0 || image.height <= 0) return;
  // Scale to kSize (crop to the middle square first), with box filtering.
  const int s = std::min(image.width, image.height);
  const int ox = (image.width - s) / 2, oy = (image.height - s) / 2;
  std::vector<uint8_t> level(kSize * kSize * 4);
  for (uint32_t y = 0; y < kSize; ++y) {
    for (uint32_t x = 0; x < kSize; ++x) {
      const int x0 = ox + static_cast<int>(x) * s / static_cast<int>(kSize), x1 = std::max(x0 + 1, ox + static_cast<int>(x + 1) * s / static_cast<int>(kSize));
      const int y0 = oy + static_cast<int>(y) * s / static_cast<int>(kSize), y1 = std::max(y0 + 1, oy + static_cast<int>(y + 1) * s / static_cast<int>(kSize));
      uint32_t sum[4] = {};
      int n = 0;
      for (int yy = y0; yy < y1; ++yy) {
        for (int xx = x0; xx < x1; ++xx) {
          const uint8_t* p = &image.pixels[(static_cast<size_t>(yy) * image.width + xx) * 4];
          for (int c = 0; c < 4; ++c) sum[c] += p[c];
          ++n;
        }
      }
      for (int c = 0; c < 4; ++c) level[(y * kSize + x) * 4 + c] = static_cast<uint8_t>(sum[c] / static_cast<uint32_t>(n));
    }
  }
  wgpu::Queue queue = device_.GetQueue();
  uint32_t size = kSize;
  for (uint32_t mip = 0; mip < 3; ++mip) {
    wgpu::TexelCopyTextureInfo dst;
    dst.texture = texture_;
    dst.mipLevel = mip;
    dst.origin = {0, 0, slot};
    wgpu::TexelCopyBufferLayout layout;
    layout.bytesPerRow = size * 4;
    layout.rowsPerImage = size;
    const wgpu::Extent3D extent{size, size, 1};
    queue.WriteTexture(&dst, level.data(), level.size(), &layout, &extent);
    const uint32_t half = size / 2;
    std::vector<uint8_t> next(half * half * 4);
    for (uint32_t y = 0; y < half; ++y) {
      for (uint32_t x = 0; x < half; ++x) {
        for (int c = 0; c < 4; ++c) {
          const auto at = [&](uint32_t xx, uint32_t yy) { return level[(yy * size + xx) * 4 + static_cast<uint32_t>(c)]; };
          next[(y * half + x) * 4 + static_cast<uint32_t>(c)] =
              static_cast<uint8_t>((at(2 * x, 2 * y) + at(2 * x + 1, 2 * y) + at(2 * x, 2 * y + 1) + at(2 * x + 1, 2 * y + 1) + 2) / 4);
        }
      }
    }
    level.swap(next);
    size = half;
  }
}

void PictureBillboards::begin(const Mat4& viewProj) {
  viewProj_ = viewProj;
  vertices_.clear();
}

void PictureBillboards::add(uint32_t slot, Vec3 center, Vec3 right, Vec3 up, float radius, Vec3 rim, float alpha) {
  if (vertices_.size() >= kMaxQuads * 4 || slot >= kSlots) return;
  // uv (0,0) = top-left of the picture.
  const float corners[4][4] = {{-1, 1, 0, 0}, {1, 1, 1, 0}, {1, -1, 1, 1}, {-1, -1, 0, 1}};
  for (const auto& k : corners) {
    const Vec4 p = transformPoint(viewProj_, center + right * (k[0] * radius) + up * (k[1] * radius));
    Vertex v{{p.x, p.y, p.z, p.w}, {k[2], k[3]}, static_cast<float>(slot), alpha, {rim.x, rim.y, rim.z, 1}};
    vertices_.push_back(v);
  }
}

void PictureBillboards::upload(const wgpu::Queue& queue) {
  if (!vertices_.empty()) queue.WriteBuffer(vertexBuffer_, 0, vertices_.data(), vertices_.size() * sizeof(Vertex));
}

void PictureBillboards::draw(const wgpu::RenderPassEncoder& pass) const {
  if (vertices_.empty() || !pipeline_) return;  // pipeline_ fills in once compiled
  pass.SetPipeline(pipeline_);
  pass.SetBindGroup(0, bindGroup_);
  pass.SetVertexBuffer(0, vertexBuffer_);
  pass.SetIndexBuffer(indexBuffer_, wgpu::IndexFormat::Uint16);
  pass.DrawIndexed(static_cast<uint32_t>(vertices_.size() / 4 * 6));
  prof::draw(static_cast<uint32_t>(vertices_.size() / 4 * 6));
}

}  // namespace engine
