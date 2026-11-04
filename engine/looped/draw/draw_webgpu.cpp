// The drawing piece's WebGPU backend (J116.4): see draw.h.
#include <emscripten/emscripten.h>
#include <emscripten/html5.h>
#include <webgpu/webgpu_cpp.h>

#include <algorithm>
#include <cmath>
#include <cstring>
#include <map>
#include <string>
#include <vector>

#include "looped/draw/draw.h"

namespace engine::draw {

namespace {

constexpr uint64_t kUniformSlot = 4096;  // bytes per draw's uniforms (a multiple of 256)
constexpr uint64_t kUniformDraws = 256;  // draws a frame

std::string text(wgpu::StringView s) { return s.data ? std::string(std::string_view(s)) : std::string(); }

wgpu::VertexFormat formatOf(Attr a) {
  switch (a) {
    case Attr::kFloat2: return wgpu::VertexFormat::Float32x2;
    case Attr::kFloat3: return wgpu::VertexFormat::Float32x3;
    case Attr::kFloat4: return wgpu::VertexFormat::Float32x4;
    case Attr::kUnorm8x4: return wgpu::VertexFormat::Unorm8x4;
    case Attr::kUint8x4: return wgpu::VertexFormat::Uint8x4;
    case Attr::kHalf4: return wgpu::VertexFormat::Float16x4;
    case Attr::kUnorm16x2: return wgpu::VertexFormat::Unorm16x2;
    case Attr::kSnorm8x4: return wgpu::VertexFormat::Snorm8x4;
  }
  return wgpu::VertexFormat::Float32x4;
}

class GpuDevice final : public Device {
 public:
  GpuDevice(std::string canvas, wgpu::Instance instance, wgpu::Surface surface, wgpu::Adapter adapter, wgpu::Device device)
      : canvas_(std::move(canvas)), instance_(instance), surface_(surface), adapter_(adapter), device_(device), queue_(device.GetQueue()) {
    wgpu::SurfaceCapabilities caps;
    surface_.GetCapabilities(adapter_, &caps);
    format_ = caps.formatCount > 0 ? caps.formats[0] : wgpu::TextureFormat::BGRA8Unorm;
    wgpu::BufferDescriptor bd;
    bd.size = kUniformSlot * kUniformDraws;
    bd.usage = wgpu::BufferUsage::Uniform | wgpu::BufferUsage::CopyDst;
    uniforms_ = device_.CreateBuffer(&bd);
    wgpu::SamplerDescriptor sd;
    sd.magFilter = wgpu::FilterMode::Linear;
    sd.minFilter = wgpu::FilterMode::Linear;
    sd.addressModeU = sd.addressModeV = wgpu::AddressMode::ClampToEdge;
    sampler_ = device_.CreateSampler(&sd);
    sd.addressModeU = sd.addressModeV = wgpu::AddressMode::Repeat;
    repeatSampler_ = device_.CreateSampler(&sd);
  }

  Backend backend() const override { return Backend::kWebGpu; }

  void resize(uint32_t* w, uint32_t* h) override {
    double cw = 0, ch = 0;
    emscripten_get_element_css_size(canvas_.c_str(), &cw, &ch);
    const double dpr = std::min(static_cast<double>(maxPixelRatio), emscripten_get_device_pixel_ratio());
    const auto pw = static_cast<uint32_t>(std::max(1L, std::lround(cw * dpr))), ph = static_cast<uint32_t>(std::max(1L, std::lround(ch * dpr)));
    if (pw != width_ || ph != height_) {
      width_ = pw, height_ = ph;
      emscripten_set_canvas_element_size(canvas_.c_str(), static_cast<int>(pw), static_cast<int>(ph));
      wgpu::SurfaceConfiguration c;
      c.device = device_;
      c.format = format_;
      c.width = pw;
      c.height = ph;
      c.alphaMode = wgpu::CompositeAlphaMode::Opaque;
      c.presentMode = wgpu::PresentMode::Fifo;
      surface_.Configure(&c);
      wgpu::TextureDescriptor td;
      td.size = {pw, ph, 1};
      td.format = wgpu::TextureFormat::Depth24Plus;
      td.usage = wgpu::TextureUsage::RenderAttachment;
      td.sampleCount = 4;
      depth_ = device_.CreateTexture(&td).CreateView();
      td.format = format_;
      msaa_ = device_.CreateTexture(&td).CreateView();
    }
    *w = width_, *h = height_;
  }

  Handle vertexBuffer(const void* data, size_t bytes) override {
    wgpu::BufferDescriptor bd;
    bd.size = (bytes + 3) & ~size_t(3);
    bd.usage = wgpu::BufferUsage::Vertex | wgpu::BufferUsage::CopyDst;
    wgpu::Buffer b = device_.CreateBuffer(&bd);
    queue_.WriteBuffer(b, 0, data, bd.size == bytes ? bytes : bytes & ~size_t(3));
    if (bd.size != bytes) {  // the tail, padded
      uint8_t tail[4] = {};
      std::memcpy(tail, static_cast<const uint8_t*>(data) + (bytes & ~size_t(3)), bytes & 3);
      queue_.WriteBuffer(b, bytes & ~size_t(3), tail, 4);
    }
    buffers_.push_back(b);
    return static_cast<Handle>(buffers_.size());
  }

  Handle indexBuffer(const uint32_t* data, size_t count) override {
    wgpu::BufferDescriptor bd;
    bd.size = count * 4;
    bd.usage = wgpu::BufferUsage::Index | wgpu::BufferUsage::CopyDst;
    wgpu::Buffer b = device_.CreateBuffer(&bd);
    queue_.WriteBuffer(b, 0, data, count * 4);
    buffers_.push_back(b);
    return static_cast<Handle>(buffers_.size());
  }

  Handle texture(int w, int h, Format f, const void* data, bool repeat) override {
    wgpu::TextureDescriptor td;
    td.size = {static_cast<uint32_t>(w), static_cast<uint32_t>(h), 1};
    td.format = f == Format::kRgba16f ? wgpu::TextureFormat::RGBA16Float : wgpu::TextureFormat::RGBA8Unorm;
    td.usage = wgpu::TextureUsage::TextureBinding | wgpu::TextureUsage::CopyDst;
    wgpu::Texture t = device_.CreateTexture(&td);
    const uint32_t bpp = f == Format::kRgba16f ? 8 : 4;
    wgpu::TexelCopyTextureInfo dst;
    dst.texture = t;
    wgpu::TexelCopyBufferLayout layout;
    layout.bytesPerRow = static_cast<uint32_t>(w) * bpp;
    layout.rowsPerImage = static_cast<uint32_t>(h);
    queue_.WriteTexture(&dst, data, static_cast<size_t>(w) * h * bpp, &layout, &td.size);
    textures_.push_back(t.CreateView());
    textureObjects_.push_back(t);
    textureRepeats_.push_back(repeat);
    return static_cast<Handle>(textures_.size());
  }

  void updateTexture(Handle t, int w, int h, Format f, const void* data) override {
    if (!t || t > textureObjects_.size()) return;
    const uint32_t bpp = f == Format::kRgba16f ? 8 : 4;
    wgpu::TexelCopyTextureInfo dst;
    dst.texture = textureObjects_[t - 1];
    wgpu::TexelCopyBufferLayout layout;
    layout.bytesPerRow = static_cast<uint32_t>(w) * bpp;
    layout.rowsPerImage = static_cast<uint32_t>(h);
    const wgpu::Extent3D size{static_cast<uint32_t>(w), static_cast<uint32_t>(h), 1};
    queue_.WriteTexture(&dst, data, static_cast<size_t>(w) * h * bpp, &layout, &size);
  }

  void updateIndices(Handle b, const uint32_t* data, size_t count) override {
    if (!b || b > buffers_.size() || !count) return;
    queue_.WriteBuffer(buffers_[b - 1], 0, data, count * 4);
  }

  void updateVertices(Handle b, size_t offset, const void* data, size_t bytes) override {
    if (!b || b > buffers_.size() || (offset & 3) || (bytes & 3)) return;  // whole 4-byte words (vertices are 72 bytes)
    queue_.WriteBuffer(buffers_[b - 1], offset, data, bytes);
  }

  Handle pipeline(const PipelineDesc& d) override {
    wgpu::ShaderSourceWGSL src;
    src.code = d.wgsl.c_str();
    wgpu::ShaderModuleDescriptor md;
    md.nextInChain = &src;
    md.label = d.label.c_str();
    wgpu::ShaderModule module = device_.CreateShaderModule(&md);
    // The bind group: uniforms (dynamic offset), then each texture and its sampler.
    std::vector<wgpu::BindGroupLayoutEntry> e(1 + 2 * static_cast<size_t>(d.textures));
    e[0].binding = 0;
    e[0].visibility = wgpu::ShaderStage::Vertex | wgpu::ShaderStage::Fragment;
    e[0].buffer.type = wgpu::BufferBindingType::Uniform;
    e[0].buffer.hasDynamicOffset = true;
    e[0].buffer.minBindingSize = 0;
    for (int k = 0; k < d.textures; ++k) {
      auto& t = e[1 + 2 * static_cast<size_t>(k)];
      t.binding = static_cast<uint32_t>(1 + 2 * k);
      t.visibility = wgpu::ShaderStage::Fragment;
      t.texture.sampleType = wgpu::TextureSampleType::Float;
      t.texture.viewDimension = wgpu::TextureViewDimension::e2D;
      auto& s = e[2 + 2 * static_cast<size_t>(k)];
      s.binding = static_cast<uint32_t>(2 + 2 * k);
      s.visibility = wgpu::ShaderStage::Fragment;
      s.sampler.type = wgpu::SamplerBindingType::Filtering;
    }
    wgpu::BindGroupLayoutDescriptor bl;
    bl.entryCount = e.size();
    bl.entries = e.data();
    Pipe p;
    p.layout = device_.CreateBindGroupLayout(&bl);
    wgpu::PipelineLayoutDescriptor pl;
    pl.bindGroupLayoutCount = 1;
    pl.bindGroupLayouts = &p.layout;
    std::vector<wgpu::VertexAttribute> attrs(d.layout.items.size());
    for (size_t i = 0; i < attrs.size(); ++i) {
      attrs[i].format = formatOf(d.layout.items[i].type);
      attrs[i].offset = d.layout.items[i].offset;
      attrs[i].shaderLocation = static_cast<uint32_t>(i);
    }
    wgpu::VertexBufferLayout vbl;
    vbl.arrayStride = d.layout.stride;
    vbl.attributeCount = attrs.size();
    vbl.attributes = attrs.data();
    wgpu::ColorTargetState target;
    target.format = d.toTarget ? wgpu::TextureFormat::RGBA16Float : format_;
    wgpu::FragmentState fs;
    fs.module = module;
    fs.entryPoint = "fs_main";
    fs.targetCount = 1;
    fs.targets = &target;
    wgpu::DepthStencilState ds;
    ds.format = wgpu::TextureFormat::Depth24Plus;
    ds.depthWriteEnabled = d.depth;
    ds.depthCompare = d.depth ? wgpu::CompareFunction::Less : wgpu::CompareFunction::Always;
    wgpu::RenderPipelineDescriptor rp;
    rp.label = d.label.c_str();
    rp.layout = device_.CreatePipelineLayout(&pl);
    rp.vertex.module = module;
    rp.vertex.entryPoint = "vs_main";
    rp.vertex.bufferCount = 1;
    rp.vertex.buffers = &vbl;
    rp.fragment = &fs;
    rp.depthStencil = &ds;
    rp.multisample.count = d.toTarget ? 1 : 4;
    rp.primitive.topology = wgpu::PrimitiveTopology::TriangleList;
    rp.primitive.cullMode = d.cullBack ? wgpu::CullMode::Back : wgpu::CullMode::None;
    rp.primitive.frontFace = wgpu::FrontFace::CCW;
    p.pipeline = device_.CreateRenderPipeline(&rp);
    p.textures = d.textures;
    pipes_.push_back(p);
    return static_cast<Handle>(pipes_.size());
  }

  Handle target(int w, int h) override {
    wgpu::TextureDescriptor td;
    td.size = {static_cast<uint32_t>(w), static_cast<uint32_t>(h), 1};
    td.format = wgpu::TextureFormat::RGBA16Float;
    td.usage = wgpu::TextureUsage::TextureBinding | wgpu::TextureUsage::RenderAttachment;
    wgpu::Texture t = device_.CreateTexture(&td);
    textures_.push_back(t.CreateView());
    textureObjects_.push_back(t);
    textureRepeats_.push_back(false);
    Target tg;
    tg.colour = textures_.back();
    tg.w = static_cast<uint32_t>(w), tg.h = static_cast<uint32_t>(h);
    td.format = wgpu::TextureFormat::Depth24Plus;
    td.usage = wgpu::TextureUsage::RenderAttachment;
    tg.depth = device_.CreateTexture(&td).CreateView();
    const Handle handle = static_cast<Handle>(textures_.size());
    targets_[handle] = tg;
    return handle;
  }

  bool beginTarget(Handle t, const float clear[4]) override {
    auto it = targets_.find(t);
    if (it == targets_.end()) return false;
    if (!encoder_) encoder_ = device_.CreateCommandEncoder(), draws_ = 0;
    wgpu::RenderPassColorAttachment ca;
    ca.view = it->second.colour;
    ca.loadOp = wgpu::LoadOp::Clear;
    ca.storeOp = wgpu::StoreOp::Store;
    ca.clearValue = {clear[0], clear[1], clear[2], clear[3]};
    wgpu::RenderPassDepthStencilAttachment da;
    da.view = it->second.depth;
    da.depthLoadOp = wgpu::LoadOp::Clear;
    da.depthStoreOp = wgpu::StoreOp::Discard;
    da.depthClearValue = 1;
    wgpu::RenderPassDescriptor rp;
    rp.colorAttachmentCount = 1;
    rp.colorAttachments = &ca;
    rp.depthStencilAttachment = &da;
    pass_ = encoder_.BeginRenderPass(&rp);
    return true;
  }

  void endTarget() override {
    if (!pass_) return;
    pass_.End();
    pass_ = nullptr;
  }

  bool begin(const float clear[4]) override {
    wgpu::SurfaceTexture st;
    surface_.GetCurrentTexture(&st);
    if (st.status != wgpu::SurfaceGetCurrentTextureStatus::SuccessOptimal &&
        st.status != wgpu::SurfaceGetCurrentTextureStatus::SuccessSuboptimal)
      return false;
    if (!encoder_) encoder_ = device_.CreateCommandEncoder(), draws_ = 0;
    wgpu::RenderPassColorAttachment ca;
    ca.view = msaa_;
    ca.resolveTarget = st.texture.CreateView();
    ca.loadOp = wgpu::LoadOp::Clear;
    ca.storeOp = wgpu::StoreOp::Discard;
    ca.clearValue = {clear[0], clear[1], clear[2], clear[3]};
    wgpu::RenderPassDepthStencilAttachment da;
    da.view = depth_;
    da.depthLoadOp = wgpu::LoadOp::Clear;
    da.depthStoreOp = wgpu::StoreOp::Discard;
    da.depthClearValue = 1;
    wgpu::RenderPassDescriptor rp;
    rp.colorAttachmentCount = 1;
    rp.colorAttachments = &ca;
    rp.depthStencilAttachment = &da;
    pass_ = encoder_.BeginRenderPass(&rp);
    return true;
  }

  void drawIndexed(Handle pipeline, Handle vertices, Handle indices, uint32_t count, const void* uniforms, size_t bytes,
                   const Handle* textures, int textureCount) override {
    if (!pass_ || !pipeline || pipeline > pipes_.size() || draws_ >= kUniformDraws || bytes > kUniformSlot) return;
    Pipe& p = pipes_[pipeline - 1];
    const uint64_t offset = draws_++ * kUniformSlot;
    queue_.WriteBuffer(uniforms_, offset, uniforms, (bytes + 3) & ~size_t(3));
    // The bind group for this set of textures, made once.
    std::vector<Handle> key(textures, textures + textureCount);
    auto it = p.groups.find(key);
    if (it == p.groups.end()) {
      std::vector<wgpu::BindGroupEntry> e(1 + 2 * static_cast<size_t>(p.textures));
      e[0].binding = 0;
      e[0].buffer = uniforms_;
      e[0].size = kUniformSlot;
      for (int k = 0; k < p.textures; ++k) {
        const Handle t = k < textureCount ? textures[k] : 0;
        e[1 + 2 * static_cast<size_t>(k)].binding = static_cast<uint32_t>(1 + 2 * k);
        e[1 + 2 * static_cast<size_t>(k)].textureView = t ? textures_[t - 1] : nullptr;
        e[2 + 2 * static_cast<size_t>(k)].binding = static_cast<uint32_t>(2 + 2 * k);
        e[2 + 2 * static_cast<size_t>(k)].sampler = t && textureRepeats_[t - 1] ? repeatSampler_ : sampler_;
      }
      wgpu::BindGroupDescriptor bd;
      bd.layout = p.layout;
      bd.entryCount = e.size();
      bd.entries = e.data();
      it = p.groups.emplace(key, device_.CreateBindGroup(&bd)).first;
    }
    pass_.SetPipeline(p.pipeline);
    const uint32_t dyn = static_cast<uint32_t>(offset);
    pass_.SetBindGroup(0, it->second, 1, &dyn);
    pass_.SetVertexBuffer(0, buffers_[vertices - 1]);
    pass_.SetIndexBuffer(buffers_[indices - 1], wgpu::IndexFormat::Uint32);
    pass_.DrawIndexed(count);
  }

  void end() override {
    if (!pass_) return;
    pass_.End();
    pass_ = nullptr;
    wgpu::CommandBuffer cb = encoder_.Finish();
    queue_.Submit(1, &cb);
    encoder_ = nullptr;
  }

 private:
  struct Pipe {
    wgpu::RenderPipeline pipeline;
    wgpu::BindGroupLayout layout;
    int textures = 0;
    std::map<std::vector<Handle>, wgpu::BindGroup> groups;
  };
  std::string canvas_;
  wgpu::Instance instance_;
  wgpu::Surface surface_;
  wgpu::Adapter adapter_;
  wgpu::Device device_;
  wgpu::Queue queue_;
  wgpu::TextureFormat format_ = wgpu::TextureFormat::BGRA8Unorm;
  wgpu::Buffer uniforms_;
  wgpu::Sampler sampler_;
  wgpu::TextureView depth_, msaa_;
  wgpu::CommandEncoder encoder_;
  wgpu::RenderPassEncoder pass_;
  uint32_t width_ = 0, height_ = 0;
  uint64_t draws_ = 0;
  std::vector<wgpu::Buffer> buffers_;
  std::vector<wgpu::TextureView> textures_;
  std::vector<wgpu::Texture> textureObjects_;
  std::vector<bool> textureRepeats_;
  wgpu::Sampler repeatSampler_;
  std::vector<Pipe> pipes_;
  struct Target {
    wgpu::TextureView colour, depth;
    uint32_t w = 0, h = 0;
  };
  std::map<Handle, Target> targets_;
};

struct Pending {
  std::string canvas;
  wgpu::Instance instance;
  wgpu::Surface surface;
  wgpu::Adapter adapter;
  std::function<void(std::unique_ptr<Device>)> ready;
};

}  // namespace

// Starts WebGPU; `ready` gets the device, or null if the browser can't.
void createWebGpu(const char* canvas, std::function<void(std::unique_ptr<Device>)> ready) {
  auto* p = new Pending{canvas, wgpu::CreateInstance(nullptr), {}, {}, std::move(ready)};
  if (!p->instance) {
    auto r = std::move(p->ready);
    delete p;
    r(nullptr);
    return;
  }
  wgpu::EmscriptenSurfaceSourceCanvasHTMLSelector cs;
  cs.selector = p->canvas.c_str();
  wgpu::SurfaceDescriptor sd;
  sd.nextInChain = &cs;
  p->surface = p->instance.CreateSurface(&sd);
  wgpu::RequestAdapterOptions o;
  o.powerPreference = wgpu::PowerPreference::HighPerformance;
  p->instance.RequestAdapter(&o, wgpu::CallbackMode::AllowSpontaneous,
                             [p](wgpu::RequestAdapterStatus s, wgpu::Adapter a, wgpu::StringView) {
                               if (s != wgpu::RequestAdapterStatus::Success) {
                                 auto r = std::move(p->ready);
                                 delete p;
                                 r(nullptr);
                                 return;
                               }
                               p->adapter = a;
                               wgpu::DeviceDescriptor dd;
                               dd.label = "draw lab";
                               dd.SetUncapturedErrorCallback([](const wgpu::Device&, wgpu::ErrorType, wgpu::StringView m) {
                                 emscripten_log(EM_LOG_ERROR, "WebGPU: %s", text(m).c_str());
                               });
                               a.RequestDevice(&dd, wgpu::CallbackMode::AllowSpontaneous,
                                               [p](wgpu::RequestDeviceStatus s2, wgpu::Device d, wgpu::StringView) {
                                                 auto r = std::move(p->ready);
                                                 std::unique_ptr<Device> dev;
                                                 if (s2 == wgpu::RequestDeviceStatus::Success)
                                                   dev = std::make_unique<GpuDevice>(p->canvas, p->instance, p->surface, p->adapter, d);
                                                 delete p;
                                                 r(std::move(dev));
                                               });
                             });
}

}  // namespace engine::draw
