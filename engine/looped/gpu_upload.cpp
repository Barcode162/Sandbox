#include "looped/gpu_upload.h"

#include <emscripten/em_js.h>
#include <emscripten/emscripten.h>

#include <algorithm>
#include <bit>
#include <cstring>
#include <deque>
#include <map>

#include "looped/fetch.h"
#include "looped/log.h"
#include "looped/pipeline_cache.h"
#include "looped/profiler.h"

namespace engine {
namespace {


// --- Mipmaps on the GPU: draw each level from the one above with a
// filtered (bilinear) read of the middle of every 2x2 block.
const char* kMipShader = R"(
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var smp: sampler;
struct VsOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VsOut {
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  var o: VsOut;
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  o.uv = vec2f(p.x, 1.0 - p.y);
  return o;
}
@fragment fn fs(in: VsOut) -> @location(0) vec4f { return textureSample(src, smp, in.uv); }
)";

struct MipKit {
  wgpu::Device device;
  wgpu::ShaderModule module;
  wgpu::Sampler sampler;
  wgpu::BindGroupLayout layout;
  std::map<wgpu::TextureFormat, wgpu::RenderPipeline> pipelines;
};

MipKit& mipKit(const wgpu::Device& device) {
  static MipKit kit;
  if (kit.device.Get() == device.Get()) return kit;
  kit = {};
  kit.device = device;
  wgpu::ShaderSourceWGSL wgsl;
  wgsl.code = kMipShader;
  wgpu::ShaderModuleDescriptor md;
  md.nextInChain = &wgsl;
  md.label = "mipmaps";
  kit.module = device.CreateShaderModule(&md);
  wgpu::SamplerDescriptor sd;
  sd.minFilter = wgpu::FilterMode::Linear;
  sd.magFilter = wgpu::FilterMode::Linear;
  kit.sampler = device.CreateSampler(&sd);
  wgpu::BindGroupLayoutEntry e[2];
  e[0].binding = 0;
  e[0].visibility = wgpu::ShaderStage::Fragment;
  e[0].texture.sampleType = wgpu::TextureSampleType::Float;
  e[1].binding = 1;
  e[1].visibility = wgpu::ShaderStage::Fragment;
  e[1].sampler.type = wgpu::SamplerBindingType::Filtering;
  wgpu::BindGroupLayoutDescriptor ld;
  ld.entryCount = 2;
  ld.entries = e;
  kit.layout = device.CreateBindGroupLayout(&ld);
  return kit;
}

// Starts compiling the mip pipeline for a format (once); empty until ready.
wgpu::RenderPipeline mipPipeline(MipKit& kit, wgpu::TextureFormat format) {
  auto it = kit.pipelines.find(format);
  if (it != kit.pipelines.end()) return it->second;
  kit.pipelines[format] = nullptr;
  wgpu::PipelineLayoutDescriptor pl;
  pl.bindGroupLayoutCount = 1;
  pl.bindGroupLayouts = &kit.layout;
  wgpu::ColorTargetState target;
  target.format = format;
  wgpu::FragmentState fs;
  fs.module = kit.module;
  fs.entryPoint = "fs";
  fs.targetCount = 1;
  fs.targets = &target;
  wgpu::RenderPipelineDescriptor rp;
  rp.label = "mipmaps";
  rp.layout = kit.device.CreatePipelineLayout(&pl);
  rp.vertex.module = kit.module;
  rp.vertex.entryPoint = "vs";
  rp.fragment = &fs;
  pipelines::create(kit.device, rp, &kit.pipelines[format]);
  return nullptr;
}

// --- Image decoding in the browser, kept as ImageBitmaps until a job
// copies them into textures.
struct PendingImage {
  std::vector<wgpu::TextureFormat> formats;
  std::string label;
  wgpu::Device device;
  std::function<void(std::vector<wgpu::Texture>)> done;
};
std::map<int, PendingImage>& pendingImages() {
  static std::map<int, PendingImage> p;
  return p;
}

// At most kMaxDecodes images decode at once (each decoded bitmap holds its
// full pixels in memory until its job copies it); the rest wait here.
constexpr int kMaxDecodes = 4;
int g_textureCount = 0;
double g_textureBytes = 0;
int g_decoding = 0;
struct WaitingDecode {
  int id;
  std::vector<uint8_t> bytes;
  std::string mime;
  int maxSize;
};
std::deque<WaitingDecode>& waitingDecodes() {
  static std::deque<WaitingDecode> w;
  return w;
}

// Decodes in the browser; images larger than maxSize are scaled down (the
// browser does it off the main thread, high quality).
EM_JS(void, js_decodeBitmap, (int id, const uint8_t* data, int size, const char* mime, int maxSize), {
  var bytes = HEAPU8.slice(data, data + size);
  var blob = new Blob([bytes], {type: UTF8ToString(mime)});
  var store = Module['bitmaps'] || (Module['bitmaps'] = {});
  var opts = {'colorSpaceConversion': 'none', 'premultiplyAlpha': 'none'};
  createImageBitmap(blob, opts).then(function(bitmap) {
    var big = Math.max(bitmap['width'], bitmap['height']);
    if (big <= maxSize) return bitmap;
    var s = maxSize / big;
    var small = {'colorSpaceConversion': 'none', 'premultiplyAlpha': 'none', 'resizeQuality': 'high',
                 'resizeWidth': Math.max(1, Math.round(bitmap['width'] * s)),
                 'resizeHeight': Math.max(1, Math.round(bitmap['height'] * s))};
    return createImageBitmap(bitmap, small).then(function(b) { bitmap['close'](); return b; });
  }).then(function(bitmap) {
    store[id] = bitmap;
    _engine_bitmapDecoded(id, bitmap['width'], bitmap['height']);
  }).catch(function(e) {
    err('Image decode failed: ' + e);
    _engine_bitmapDecoded(id, 0, 0);
  });
});

EM_JS_DEPS(gpu_upload, "$WebGPU");
// Copies bitmap `id` into mip 0 of the texture. Returns 0 on failure.
EM_JS(int, js_copyBitmap, (int id, WGPUDevice device, WGPUTexture texture), {
  var bitmap = Module['bitmaps'][id];
  try {
    // Quoted names: the closure compiler must not rename them.
    var dev = WebGPU.getJsObject(device);
    dev['queue']['copyExternalImageToTexture']({'source': bitmap}, {'texture': WebGPU.getJsObject(texture)},
                                               [bitmap['width'], bitmap['height']]);
    return 1;
  } catch (e) {
    err('Texture copy failed: ' + e);
    return 0;
  }
});

EM_JS(void, js_dropBitmap, (int id), {
  var store = Module['bitmaps'];
  if (store[id]) store[id]['close']();
  delete store[id];
});

}  // namespace

namespace {
const wgpu::Device* g_mipDevice = nullptr;
}  // namespace

int imageTextureCount() { return g_textureCount; }
double imageTextureMB() { return g_textureBytes / (1024.0 * 1024.0); }

void prepareMipmaps(const wgpu::Device& device) {
  g_mipDevice = &device;
  MipKit& kit = mipKit(device);
  mipPipeline(kit, wgpu::TextureFormat::RGBA8Unorm);
  mipPipeline(kit, wgpu::TextureFormat::RGBA8UnormSrgb);
  // Texture jobs make mipmaps: jobs wait until both mip pipelines have
  // compiled (a few ms after start-up) rather than compile one mid-load.
  setJobGate([] {
    MipKit& k = mipKit(*g_mipDevice);
    return k.pipelines[wgpu::TextureFormat::RGBA8Unorm] && k.pipelines[wgpu::TextureFormat::RGBA8UnormSrgb];
  });
}

void encodeMipmaps(const wgpu::Device& device, const wgpu::CommandEncoder& encoder, const wgpu::Texture& texture,
                   uint32_t layers) {
  const uint32_t levels = texture.GetMipLevelCount();
  if (levels < 2) return;
  MipKit& kit = mipKit(device);
  const wgpu::TextureFormat format = texture.GetFormat();
  wgpu::RenderPipeline pipeline = mipPipeline(kit, format);
  if (!pipeline) return;  // still compiling (ask mipmapsReady() first)
  // Every layer (a cube has six), each level from the one above. (The layer
  // count is passed in: GetDepthOrArrayLayers() isn't reliable in the browser.)
  for (uint32_t layer = 0; layer < layers; ++layer) {
    for (uint32_t level = 1; level < levels; ++level) {
      wgpu::TextureViewDescriptor src;
      src.dimension = wgpu::TextureViewDimension::e2D;
      src.baseMipLevel = level - 1;
      src.mipLevelCount = 1;
      src.baseArrayLayer = layer;
      src.arrayLayerCount = 1;
      wgpu::TextureViewDescriptor dst = src;
      dst.baseMipLevel = level;
      wgpu::BindGroupEntry be[2];
      be[0].binding = 0;
      be[0].textureView = texture.CreateView(&src);
      be[1].binding = 1;
      be[1].sampler = kit.sampler;
      wgpu::BindGroupDescriptor bd;
      bd.layout = kit.layout;
      bd.entryCount = 2;
      bd.entries = be;
      wgpu::BindGroup group = device.CreateBindGroup(&bd);
      wgpu::RenderPassColorAttachment color;
      color.view = texture.CreateView(&dst);
      color.loadOp = wgpu::LoadOp::Clear;
      color.storeOp = wgpu::StoreOp::Store;
      wgpu::RenderPassDescriptor pass;
      pass.colorAttachmentCount = 1;
      pass.colorAttachments = &color;
      wgpu::RenderPassEncoder p = encoder.BeginRenderPass(&pass);
      p.SetPipeline(pipeline);
      p.SetBindGroup(0, group);
      p.Draw(3);
      p.End();
    }
  }
}

bool mipmapsReady(const wgpu::Device& device, wgpu::TextureFormat format) {
  return static_cast<bool>(mipPipeline(mipKit(device), format));
}

void generateMipmaps(const wgpu::Device& device, const wgpu::Texture& texture) {
  wgpu::CommandEncoder encoder = device.CreateCommandEncoder();
  encodeMipmaps(device, encoder, texture, 1);
  wgpu::CommandBuffer commands = encoder.Finish();
  device.GetQueue().Submit(1, &commands);
}

void startDecodes() {
  auto& waiting = waitingDecodes();
  while (g_decoding < kMaxDecodes && !waiting.empty()) {
    WaitingDecode w = std::move(waiting.front());
    waiting.pop_front();
    ++g_decoding;
    js_decodeBitmap(w.id, w.bytes.data(), static_cast<int>(w.bytes.size()), w.mime.c_str(), w.maxSize);
  }
}

void loadImageTexture(const wgpu::Device& device, std::vector<uint8_t> bytes, const std::string& mimeType,
                      std::vector<wgpu::TextureFormat> formats, const char* label,
                      std::function<void(std::vector<wgpu::Texture>)> done, int maxSize) {
  static int nextId = 1;
  const int id = nextId++;
  pendingImages()[id] = {std::move(formats), label ? label : "", device, std::move(done)};
  waitingDecodes().push_back({id, std::move(bytes), mimeType, maxSize});
  startDecodes();
}

namespace {
uint32_t readU32(const std::vector<uint8_t>& b, size_t at) {
  return static_cast<uint32_t>(b[at]) | static_cast<uint32_t>(b[at + 1]) << 8 |
         static_cast<uint32_t>(b[at + 2]) << 16 | static_cast<uint32_t>(b[at + 3]) << 24;
}
wgpu::TextureFormat astcFormat(uint32_t block, bool srgb) {
  if (block == 8) return srgb ? wgpu::TextureFormat::ASTC8x8UnormSrgb : wgpu::TextureFormat::ASTC8x8Unorm;
  return srgb ? wgpu::TextureFormat::ASTC4x4UnormSrgb : wgpu::TextureFormat::ASTC4x4Unorm;
}
}  // namespace

void loadAstcTexture(const wgpu::Device& device, const std::string& url, bool asSrgb, bool asLinear,
                     std::function<void(std::vector<wgpu::Texture>)> done) {
  fetchFile(url, [device, url, asSrgb, asLinear, done = std::move(done)](bool ok, std::vector<uint8_t> bytes) {
    if (!ok) {
      LOG_ERROR("Texture %s: download failed.", url.c_str());
      done({});
      return;
    }
    queueJob([device, url, asSrgb, asLinear, done, bytes = std::move(bytes)] {
      // Header: "BA3C", width, height, mips, block width, block height.
      if (bytes.size() < 24 || std::memcmp(bytes.data(), "BA3C", 4) != 0) {
        LOG_ERROR("Texture %s: not a compressed texture.", url.c_str());
        done({});
        return;
      }
      const uint32_t width = readU32(bytes, 4), height = readU32(bytes, 8), mips = readU32(bytes, 12);
      const uint32_t block = readU32(bytes, 16);
      if ((block != 4 && block != 8) || readU32(bytes, 20) != block || width % block || height % block || mips == 0 ||
          mips > 16) {
        LOG_ERROR("Texture %s: unsupported layout.", url.c_str());
        done({});
        return;
      }
      std::vector<wgpu::Texture> textures;
      for (int pass = 0; pass < 2; ++pass) {
        const bool srgb = pass == 0;
        if (srgb ? !asSrgb : !asLinear) continue;
        wgpu::TextureDescriptor desc;
        desc.label = url.c_str();
        desc.size = {width, height, 1};
        desc.format = astcFormat(block, srgb);
        desc.mipLevelCount = mips;
        desc.usage = wgpu::TextureUsage::TextureBinding | wgpu::TextureUsage::CopyDst;
        wgpu::Texture texture = device.CreateTexture(&desc);
        size_t at = 24;
        for (uint32_t mip = 0; mip < mips; ++mip) {
          // Small levels still take whole blocks (a 1x1 level is one block).
          const uint32_t w = std::max(1u, width >> mip), h = std::max(1u, height >> mip);
          const uint32_t bw = (w + block - 1) / block, bh = (h + block - 1) / block;
          const size_t size = static_cast<size_t>(bw) * bh * 16;
          if (at + 4 > bytes.size() || readU32(bytes, at) != size || at + 4 + size > bytes.size()) {
            LOG_ERROR("Texture %s: mip %u is damaged.", url.c_str(), mip);
            done({});
            return;
          }
          wgpu::TexelCopyTextureInfo dst;
          dst.texture = texture;
          dst.mipLevel = mip;
          wgpu::TexelCopyBufferLayout layout;
          layout.bytesPerRow = bw * 16;
          layout.rowsPerImage = bh;
          const wgpu::Extent3D extent{bw * block, bh * block, 1};
          device.GetQueue().WriteTexture(&dst, bytes.data() + at + 4, size, &layout, &extent);
          at += 4 + size;
          g_textureBytes += static_cast<double>(size);
        }
        ++g_textureCount;
        textures.push_back(texture);
      }
      done(std::move(textures));
    }, JobLane::kNormal, "texture-astc");
  });
}

}  // namespace engine

// Called from JavaScript when a bitmap is ready (width 0 = failed). The
// GPU work waits in the job queue so it's spread over frames.
extern "C" EMSCRIPTEN_KEEPALIVE void engine_bitmapDecoded(int id, int width, int height) {
  using namespace engine;
  --g_decoding;
  startDecodes();
  queueJob([id, width, height] {
    auto& pending = pendingImages();
    const auto it = pending.find(id);
    if (it == pending.end()) {
      js_dropBitmap(id);  // always free the bitmap, even if nobody waits for it
      return;
    }
    PendingImage p = std::move(it->second);
    pending.erase(it);
    std::vector<wgpu::Texture> textures;
    wgpu::CommandEncoder encoder = p.device.CreateCommandEncoder();  // one submit for all mip work
    if (width > 0 && height > 0) {
      for (wgpu::TextureFormat format : p.formats) {
        wgpu::TextureDescriptor desc;
        desc.label = p.label.c_str();
        desc.size = {static_cast<uint32_t>(width), static_cast<uint32_t>(height), 1};
        desc.format = format;
        desc.mipLevelCount = static_cast<uint32_t>(std::bit_width(static_cast<unsigned>(std::max(width, height))));
        desc.usage = wgpu::TextureUsage::TextureBinding | wgpu::TextureUsage::CopyDst |
                     wgpu::TextureUsage::RenderAttachment;
        wgpu::Texture texture = p.device.CreateTexture(&desc);
        ++g_textureCount;
        g_textureBytes += static_cast<double>(width) * height * 4 * 4 / 3;  // with mipmaps
        if (!js_copyBitmap(id, p.device.Get(), texture.Get())) {
          textures.clear();
          break;
        }
        encodeMipmaps(p.device, encoder, texture);
        textures.push_back(texture);
      }
    }
    wgpu::CommandBuffer commands = encoder.Finish();
    p.device.GetQueue().Submit(1, &commands);
    js_dropBitmap(id);
    p.done(std::move(textures));
  }, JobLane::kNormal, "texture");
}
