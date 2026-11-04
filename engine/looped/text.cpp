#include "looped/text.h"

#include <algorithm>
#include <cmath>

#include "looped/file.h"
#include "looped/font.h"
#include "looped/log.h"
#include "looped/pipeline_cache.h"
#include "looped/profiler.h"

namespace engine {
namespace {

constexpr int kMipLevels = 4;

uint8_t toByte(float v) { return static_cast<uint8_t>(std::lround(clampf(v, 0.0f, 1.0f) * 255.0f)); }

int lineLength(std::string_view text, size_t start) {
  const size_t end = text.find('\n', start);
  return static_cast<int>((end == std::string_view::npos ? text.size() : end) - start);
}

}  // namespace

bool TextRenderer::init(const wgpu::Device& device, wgpu::TextureFormat colorFormat,
                        wgpu::TextureFormat depthFormat) {
  auto source = readTextFile("/shaders/text.wgsl");
  if (!source) return false;

  // Font atlas texture with its mip levels.
  const FontAtlas atlas = buildFontAtlas(kMipLevels);
  wgpu::TextureDescriptor texDesc;
  texDesc.label = "font atlas";
  texDesc.size = {atlas.width, atlas.height, 1};
  texDesc.format = wgpu::TextureFormat::R8Unorm;
  texDesc.mipLevelCount = kMipLevels;
  texDesc.usage = wgpu::TextureUsage::TextureBinding | wgpu::TextureUsage::CopyDst;
  wgpu::Texture texture = device.CreateTexture(&texDesc);
  wgpu::Queue queue = device.GetQueue();
  for (uint32_t level = 0; level < kMipLevels; ++level) {
    const uint32_t w = atlas.width >> level, h = atlas.height >> level;
    wgpu::TexelCopyTextureInfo dst;
    dst.texture = texture;
    dst.mipLevel = level;
    wgpu::TexelCopyBufferLayout layout;
    layout.bytesPerRow = w;
    layout.rowsPerImage = h;
    const wgpu::Extent3D size{w, h, 1};
    queue.WriteTexture(&dst, atlas.mips[level].data(), atlas.mips[level].size(), &layout, &size);
  }

  wgpu::SamplerDescriptor samplerDesc;
  samplerDesc.magFilter = wgpu::FilterMode::Linear;
  samplerDesc.minFilter = wgpu::FilterMode::Linear;
  samplerDesc.mipmapFilter = wgpu::MipmapFilterMode::Linear;
  samplerDesc.addressModeU = samplerDesc.addressModeV = wgpu::AddressMode::ClampToEdge;
  wgpu::Sampler sampler = device.CreateSampler(&samplerDesc);

  // Pipeline: alpha-blended, depth-tested (so world labels hide behind
  // walls) but not depth-writing. Screen text sits at depth 0, in front of
  // everything.
  wgpu::ShaderSourceWGSL wgsl;
  wgsl.code = source->c_str();
  wgpu::ShaderModuleDescriptor moduleDesc;
  moduleDesc.nextInChain = &wgsl;
  moduleDesc.label = "text";
  wgpu::ShaderModule module = device.CreateShaderModule(&moduleDesc);

  static const wgpu::VertexAttribute attributes[] = {
      {.format = wgpu::VertexFormat::Float32x4, .offset = offsetof(Vertex, clip), .shaderLocation = 0},
      {.format = wgpu::VertexFormat::Float32x2, .offset = offsetof(Vertex, uv), .shaderLocation = 1},
      {.format = wgpu::VertexFormat::Float32, .offset = offsetof(Vertex, outlineWidth), .shaderLocation = 2},
      {.format = wgpu::VertexFormat::Unorm8x4, .offset = offsetof(Vertex, color), .shaderLocation = 3},
      {.format = wgpu::VertexFormat::Unorm8x4, .offset = offsetof(Vertex, outline), .shaderLocation = 4},
  };
  wgpu::VertexBufferLayout vertexLayout;
  vertexLayout.arrayStride = sizeof(Vertex);
  vertexLayout.attributeCount = std::size(attributes);
  vertexLayout.attributes = attributes;

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
  desc.label = "text";
  bindLayout_ = pipelines::textureSamplerLayout(device, wgpu::TextureViewDimension::e2D);
  desc.layout = pipelines::pipelineLayout(device, bindLayout_);
  desc.vertex.module = module;
  desc.vertex.entryPoint = "vs_main";
  desc.vertex.bufferCount = 1;
  desc.vertex.buffers = &vertexLayout;
  desc.fragment = &fragment;
  desc.depthStencil = &depth;
  desc.primitive.topology = wgpu::PrimitiveTopology::TriangleList;
  desc.primitive.cullMode = wgpu::CullMode::None;  // world text is visible from both sides
  pipelines::create(device, desc, &pipeline_);

  wgpu::BindGroupEntry entries[2];
  entries[0].binding = 0;
  entries[0].textureView = texture.CreateView();
  entries[1].binding = 1;
  entries[1].sampler = sampler;
  wgpu::BindGroupDescriptor bindDesc;
  bindDesc.layout = bindLayout_;
  bindDesc.entryCount = 2;
  bindDesc.entries = entries;
  bindGroup_ = device.CreateBindGroup(&bindDesc);

  wgpu::BufferDescriptor vbDesc;
  vbDesc.label = "text vertices";
  vbDesc.size = kMaxGlyphs * 4 * sizeof(Vertex);
  vbDesc.usage = wgpu::BufferUsage::Vertex | wgpu::BufferUsage::CopyDst;
  vertexBuffer_ = device.CreateBuffer(&vbDesc);

  // Every glyph is a quad of 4 vertices, so the index pattern never changes.
  std::vector<uint16_t> indices;
  indices.reserve(kMaxGlyphs * 6);
  for (uint32_t i = 0; i < kMaxGlyphs; ++i) {
    const auto b = static_cast<uint16_t>(i * 4);
    indices.insert(indices.end(), {b, uint16_t(b + 1), uint16_t(b + 2), b, uint16_t(b + 2), uint16_t(b + 3)});
  }
  wgpu::BufferDescriptor ibDesc;
  ibDesc.label = "text indices";
  ibDesc.size = indices.size() * sizeof(uint16_t);
  ibDesc.usage = wgpu::BufferUsage::Index | wgpu::BufferUsage::CopyDst;
  indexBuffer_ = device.CreateBuffer(&ibDesc);
  queue.WriteBuffer(indexBuffer_, 0, indices.data(), ibDesc.size);

  vertices_.reserve(kMaxGlyphs * 4);
  LOG_INFO("Text: font atlas %ux%u, %d glyphs.", atlas.width, atlas.height, font::kGlyphCount);
  return true;
}

void TextRenderer::begin(const Mat4& viewProj, uint32_t screenW, uint32_t screenH) {
  vertices_.clear();
  viewProj_ = viewProj;
  screenW_ = static_cast<float>(std::max(screenW, 1u));
  screenH_ = static_cast<float>(std::max(screenH, 1u));
}

void TextRenderer::measure(std::string_view text, float& width, float& height) {
  int lines = 0, widest = 0;
  for (size_t start = 0; start <= text.size();) {
    widest = std::max(widest, lineLength(text, start));
    ++lines;
    const size_t nl = text.find('\n', start);
    if (nl == std::string_view::npos) break;
    start = nl + 1;
  }
  width = static_cast<float>(std::max(widest * font::kAdvance - 1, 0));
  height = static_cast<float>(lines * font::kLineHeight - (font::kLineHeight - font::kGlyphH));
}

template <typename Place>
void TextRenderer::addGlyphs(std::string_view text, const TextStyle& style, Place place) {
  using namespace font;
  float blockW, blockH;
  measure(text, blockW, blockH);
  const uint8_t color[4] = {toByte(style.color.x), toByte(style.color.y), toByte(style.color.z),
                            toByte(style.color.w)};
  const uint8_t outline[4] = {toByte(style.outline.x), toByte(style.outline.y), toByte(style.outline.z),
                              toByte(style.outline.w)};
  const float atlasW = static_cast<float>(kColumns * kCellW), atlasH = static_cast<float>(kRows * kCellH);

  float y = 0;
  for (size_t start = 0; start <= text.size();) {
    const int len = lineLength(text, start);
    const float lineW = static_cast<float>(std::max(len * kAdvance - 1, 0));
    float x = style.align * (blockW - lineW);
    for (int i = 0; i < len; ++i, x += kAdvance) {
      const char c = text[start + i];
      if (c == ' ') continue;
      if (vertices_.size() >= kMaxGlyphs * 4) {
        if (!warnedFull_) LOG_ERROR("Text: more than %u glyphs in one frame; extra text skipped.", kMaxGlyphs);
        warnedFull_ = true;
        return;
      }
      int col, row;
      fontCell(c, col, row);
      // The quad covers the glyph's whole atlas cell, padding included, so
      // the outline has room.
      const float x0 = x - kPad, y0 = y - kPad, x1 = x0 + kCellW, y1 = y0 + kCellH;
      const float u0 = static_cast<float>(col * kCellW) / atlasW, u1 = static_cast<float>((col + 1) * kCellW) / atlasW;
      const float v0 = static_cast<float>(row * kCellH) / atlasH, v1 = static_cast<float>((row + 1) * kCellH) / atlasH;
      const float corners[4][4] = {{x0, y0, u0, v0}, {x1, y0, u1, v0}, {x1, y1, u1, v1}, {x0, y1, u0, v1}};
      for (const auto& k : corners) {
        Vertex v;
        const Vec4 p = place(k[0], k[1]);
        v.clip[0] = p.x; v.clip[1] = p.y; v.clip[2] = p.z; v.clip[3] = p.w;
        v.uv[0] = k[2];
        v.uv[1] = k[3];
        v.outlineWidth = style.outlineWidth;
        std::copy(color, color + 4, v.color);
        std::copy(outline, outline + 4, v.outline);
        vertices_.push_back(v);
      }
    }
    y += kLineHeight;
    const size_t nl = text.find('\n', start);
    if (nl == std::string_view::npos) break;
    start = nl + 1;
  }
}

void TextRenderer::addScreen(std::string_view text, float x, float y, float capHeight, const TextStyle& style) {
  float blockW, blockH;
  measure(text, blockW, blockH);
  const float scale = capHeight / font::kCapHeight;
  const float left = x - style.align * blockW * scale;
  addGlyphs(text, style, [&](float fx, float fy) {
    const float px = left + fx * scale, py = y + fy * scale;
    return Vec4{px / screenW_ * 2.0f - 1.0f, 1.0f - py / screenH_ * 2.0f, 0.0f, 1.0f};
  });
}

void TextRenderer::addWorld(std::string_view text, Vec3 center, Vec3 right, Vec3 up, float capHeight,
                            const TextStyle& style) {
  float blockW, blockH;
  measure(text, blockW, blockH);
  const float scale = capHeight / font::kCapHeight;
  addGlyphs(text, style, [&](float fx, float fy) {
    const Vec3 p = center + right * ((fx - blockW * 0.5f) * scale) - up * ((fy - blockH * 0.5f) * scale);
    return transformPoint(viewProj_, p);
  });
}

void TextRenderer::addShape(int shape, float cx, float cy, float radius, Vec4 color, Vec4 outline,
                            float outlineWidth) {
  using namespace font;
  if (vertices_.size() >= kMaxGlyphs * 4) return;
  int col, row;
  shapeCell(shape, col, row);
  // The quad covers the whole cell; the shape sits in its middle.
  const float scale = radius / kShapeRadius;  // device pixels per font pixel
  const float atlasW = static_cast<float>(kColumns * kCellW), atlasH = static_cast<float>(kRows * kCellH);
  const float hx = kShapeCenterX * scale, hy = kShapeCenterY * scale;
  const float u0 = static_cast<float>(col * kCellW) / atlasW, u1 = static_cast<float>((col + 1) * kCellW) / atlasW;
  const float v0 = static_cast<float>(row * kCellH) / atlasH, v1 = static_cast<float>((row + 1) * kCellH) / atlasH;
  const float corners[4][4] = {{cx - hx, cy - hy, u0, v0}, {cx + hx, cy - hy, u1, v0}, {cx + hx, cy + hy, u1, v1},
                               {cx - hx, cy + hy, u0, v1}};
  for (const auto& k : corners) {
    Vertex vert;
    vert.clip[0] = k[0] / screenW_ * 2.0f - 1.0f;
    vert.clip[1] = 1.0f - k[1] / screenH_ * 2.0f;
    vert.clip[2] = 0;
    vert.clip[3] = 1;
    vert.uv[0] = k[2];
    vert.uv[1] = k[3];
    vert.outlineWidth = outlineWidth;
    vert.color[0] = toByte(color.x);
    vert.color[1] = toByte(color.y);
    vert.color[2] = toByte(color.z);
    vert.color[3] = toByte(color.w);
    vert.outline[0] = toByte(outline.x);
    vert.outline[1] = toByte(outline.y);
    vert.outline[2] = toByte(outline.z);
    vert.outline[3] = toByte(outline.w);
    vertices_.push_back(vert);
  }
}

void TextRenderer::addSolid(const Vec4 clip[4], Vec4 color) {
  using namespace font;
  if (vertices_.size() >= kMaxGlyphs * 4) return;
  // Every corner samples the middle of the solid glyph, which is "inside"
  // at every mip level.
  int col, row;
  fontCell(kSolid, col, row);
  const float u = (static_cast<float>(col * kCellW) + kCellW * 0.5f) / static_cast<float>(kColumns * kCellW);
  const float v = (static_cast<float>(row * kCellH) + kCellH * 0.5f) / static_cast<float>(kRows * kCellH);
  for (int i = 0; i < 4; ++i) {
    Vertex vert;
    vert.clip[0] = clip[i].x;
    vert.clip[1] = clip[i].y;
    vert.clip[2] = clip[i].z;
    vert.clip[3] = clip[i].w;
    vert.uv[0] = u;
    vert.uv[1] = v;
    vert.outlineWidth = 0;
    vert.color[0] = toByte(color.x);
    vert.color[1] = toByte(color.y);
    vert.color[2] = toByte(color.z);
    vert.color[3] = toByte(color.w);
    vert.outline[0] = vert.outline[1] = vert.outline[2] = vert.outline[3] = 0;
    vertices_.push_back(vert);
  }
}

void TextRenderer::addRect(float x, float y, float w, float h, Vec4 color) {
  const Vec2 p[4] = {{x, y}, {x + w, y}, {x + w, y + h}, {x, y + h}};
  addScreenQuad(p, color);
}

void TextRenderer::addScreenQuad(const Vec2 p[4], Vec4 color) {
  Vec4 clip[4];
  for (int i = 0; i < 4; ++i) clip[i] = {p[i].x / screenW_ * 2.0f - 1.0f, 1.0f - p[i].y / screenH_ * 2.0f, 0, 1};
  addSolid(clip, color);
}

void TextRenderer::addWorldQuad(const Vec3 p[4], Vec4 color) {
  Vec4 clip[4];
  for (int i = 0; i < 4; ++i) clip[i] = transformPoint(viewProj_, p[i]);
  addSolid(clip, color);
}

void TextRenderer::upload(const wgpu::Queue& queue) {
  if (vertices_.empty()) return;
  queue.WriteBuffer(vertexBuffer_, 0, vertices_.data(), vertices_.size() * sizeof(Vertex));
}

void TextRenderer::draw(const wgpu::RenderPassEncoder& pass) const {
  if (vertices_.empty() || !pipeline_) return;  // pipeline_ fills in once compiled
  pass.SetPipeline(pipeline_);
  pass.SetBindGroup(0, bindGroup_);
  pass.SetVertexBuffer(0, vertexBuffer_, 0, vertices_.size() * sizeof(Vertex));
  pass.SetIndexBuffer(indexBuffer_, wgpu::IndexFormat::Uint16);
  pass.DrawIndexed(static_cast<uint32_t>(vertices_.size() / 4 * 6));
  prof::draw(static_cast<uint32_t>(vertices_.size() / 4 * 6));
}

}  // namespace engine
