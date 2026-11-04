#include "looped/model.h"

#include <emscripten/emscripten.h>

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstring>
#include <map>

#include "looped/fetch.h"
#include "looped/gpu_upload.h"
#include "looped/log.h"
#include "looped/profiler.h"
#include "looped/texture.h"

namespace engine {
namespace {

wgpu::Buffer makeBuffer(const wgpu::Device& device, const void* data, size_t size, wgpu::BufferUsage usage) {
  wgpu::BufferDescriptor desc;
  desc.size = (size + 3) & ~size_t{3};
  desc.usage = usage | wgpu::BufferUsage::CopyDst;
  wgpu::Buffer buffer = device.CreateBuffer(&desc);
  device.GetQueue().WriteBuffer(buffer, 0, data, size);
  return buffer;
}

wgpu::TextureView solidTexture(const wgpu::Device& device, uint8_t r, uint8_t g, uint8_t b, bool srgb) {
  const uint8_t pixel[4] = {r, g, b, 255};
  return createTexture2D(device, 1, 1, pixel, srgb, "solid").CreateView();
}

// 1x1 stand-ins for missing textures, shared by every model.
struct Fallbacks {
  wgpu::TextureView white, whiteLinear, flatNormal;
};
const Fallbacks& fallbacks(const wgpu::Device& device) {
  static Fallbacks f;
  if (!f.white) {
    f.white = solidTexture(device, 255, 255, 255, true);
    f.whiteLinear = solidTexture(device, 255, 255, 255, false);
    f.flatNormal = solidTexture(device, 128, 128, 255, false);
  }
  return f;
}

// Buffers are filled at most this much per job, so a big model is uploaded
// over several frames.
constexpr size_t kSliceBytes = 512 << 10;

// Shared state while one model loads.
struct Loading {
  wgpu::Device device;
  wgpu::BindGroupLayout layout;
  wgpu::Sampler sampler;
  std::string url;
  ModelData data;
  // Per image: its texture as color (sRGB) and as data (linear), made
  // only for the uses the materials have.
  std::vector<wgpu::Texture> srgbTextures, linearTextures;
  size_t pendingImages = 0;
  double startMs = 0;
  std::shared_ptr<GpuModel> model;  // being built by finish()'s jobs
  std::shared_ptr<GlbParser> parser;  // while parsing
  bool failed = false;
  std::function<void(std::shared_ptr<GpuModel>)> done;
};

}  // namespace

wgpu::BindGroupLayout GpuModel::createLayout(const wgpu::Device& device) {
  wgpu::BindGroupLayoutEntry e[7];
  e[0].binding = 1;
  e[0].visibility = wgpu::ShaderStage::Fragment;
  e[0].buffer.type = wgpu::BufferBindingType::Uniform;
  e[0].buffer.minBindingSize = sizeof(MaterialUniforms);
  for (uint32_t i = 1; i <= 4; ++i) {
    e[i].binding = i + 1;
    e[i].visibility = wgpu::ShaderStage::Fragment;
    e[i].texture.sampleType = wgpu::TextureSampleType::Float;
    e[i].texture.viewDimension = wgpu::TextureViewDimension::e2D;
  }
  e[5].binding = 6;
  e[5].visibility = wgpu::ShaderStage::Fragment;
  e[5].sampler.type = wgpu::SamplerBindingType::Filtering;
  e[6].binding = 7;
  e[6].visibility = wgpu::ShaderStage::Fragment;
  e[6].texture.sampleType = wgpu::TextureSampleType::Float;
  e[6].texture.viewDimension = wgpu::TextureViewDimension::e2D;
  wgpu::BindGroupLayoutDescriptor desc;
  desc.entryCount = 7;
  desc.entries = e;
  return device.CreateBindGroupLayout(&desc);
}

wgpu::VertexBufferLayout GpuModel::vertexLayout() {
  static const wgpu::VertexAttribute attributes[] = {
      {.format = wgpu::VertexFormat::Float32x3, .offset = offsetof(ModelVertex, position), .shaderLocation = 0},
      {.format = wgpu::VertexFormat::Float32x3, .offset = offsetof(ModelVertex, normal), .shaderLocation = 1},
      {.format = wgpu::VertexFormat::Float32x2, .offset = offsetof(ModelVertex, uv), .shaderLocation = 2},
      {.format = wgpu::VertexFormat::Float32x4, .offset = offsetof(ModelVertex, tangent), .shaderLocation = 3},
  };
  wgpu::VertexBufferLayout layout;
  layout.arrayStride = sizeof(ModelVertex);
  layout.attributeCount = 4;
  layout.attributes = attributes;
  return layout;
}

namespace {

// Fills `buffer` from `data` in slices of at most kSliceBytes, one job each.
void queueBufferWrites(const std::shared_ptr<Loading>& l, const wgpu::Buffer& buffer, const void* data, size_t size) {
  for (size_t offset = 0; offset < size; offset += kSliceBytes) {
    const size_t n = std::min(kSliceBytes, size - offset);
    // Writes must be multiples of 4 bytes; the buffer is padded to match.
    const size_t padded = (n + 3) & ~size_t{3};
    queueJob([l, buffer, data, offset, n, padded] {
      if (padded == n) {
        l->device.GetQueue().WriteBuffer(buffer, offset, static_cast<const uint8_t*>(data) + offset, n);
      } else {
        std::vector<uint8_t> tail(padded, 0);
        std::memcpy(tail.data(), static_cast<const uint8_t*>(data) + offset, n);
        l->device.GetQueue().WriteBuffer(buffer, offset, tail.data(), padded);
      }
    }, JobLane::kNormal, "buffer");
  }
}

// Cuts a part into chunks on a floor grid (by each triangle's middle) and
// reorders its indices so each chunk is one run. Parts with few triangles,
// or that fit in one cell, stay one chunk.
void buildClusters(ModelPrimitive& p, GpuModel::Part& part) {
  constexpr float kCell = 3.0f;         // metres
  constexpr size_t kMinTriangles = 1500;  // below this, splitting isn't worth a draw call
  Aabb all = Aabb::empty();
  for (const ModelVertex& v : p.vertices) {
    all.min = minComponents(all.min, v.position);
    all.max = maxComponents(all.max, v.position);
  }
  if (p.vertices.empty()) all = {};
  part.bounds = all;
  const size_t triangles = p.indices.size() / 3;
  const int nx = std::clamp(static_cast<int>(std::ceil((all.max.x - all.min.x) / kCell)), 1, 64);
  const int nz = std::clamp(static_cast<int>(std::ceil((all.max.z - all.min.z) / kCell)), 1, 64);
  if (triangles < kMinTriangles || nx * nz == 1) {
    part.clusters.push_back({0, static_cast<uint32_t>(p.indices.size()), all});
    return;
  }
  const size_t cells = static_cast<size_t>(nx * nz);
  std::vector<uint32_t> cellOf(triangles), start(cells + 1, 0);
  for (size_t t = 0; t < triangles; ++t) {
    Vec3 c{};
    for (int k = 0; k < 3; ++k) c = c + p.vertices[p.indices[t * 3 + static_cast<size_t>(k)]].position;
    c = c * (1.0f / 3.0f);
    const int cx = std::clamp(static_cast<int>((c.x - all.min.x) / kCell), 0, nx - 1);
    const int cz = std::clamp(static_cast<int>((c.z - all.min.z) / kCell), 0, nz - 1);
    cellOf[t] = static_cast<uint32_t>(cz * nx + cx);
    ++start[cellOf[t] + 1];
  }
  for (size_t i = 0; i < cells; ++i) start[i + 1] += start[i];
  std::vector<uint32_t> sorted(p.indices.size());
  std::vector<uint32_t> fill(start.begin(), start.end() - 1);
  for (size_t t = 0; t < triangles; ++t) {
    const size_t at = fill[cellOf[t]]++ * 3;
    for (size_t k = 0; k < 3; ++k) sorted[at + k] = p.indices[t * 3 + k];
  }
  p.indices.swap(sorted);
  for (size_t i = 0; i < cells; ++i) {
    if (start[i + 1] == start[i]) continue;
    GpuModel::Cluster c;
    c.firstIndex = start[i] * 3;
    c.indexCount = (start[i + 1] - start[i]) * 3;
    c.bounds = Aabb::empty();
    for (uint32_t k = c.firstIndex; k < c.firstIndex + c.indexCount; ++k) {
      const Vec3 v = p.vertices[p.indices[k]].position;
      c.bounds.min = minComponents(c.bounds.min, v);
      c.bounds.max = maxComponents(c.bounds.max, v);
    }
    part.clusters.push_back(c);
  }
}

// Builds the GPU model in small jobs: the materials, then each part's
// buffers in slices, then hands it over.
void finish(const std::shared_ptr<Loading>& l) {
  queueJob([l] {
    const wgpu::Device& device = l->device;
    auto model = l->model = std::make_shared<GpuModel>();
    model->boundsMin = l->data.boundsMin;
    model->boundsMax = l->data.boundsMax;

    // Textures, created once per image and shared by materials. Color images
    // are sRGB; data images (roughness, normals) are linear.
    std::vector<wgpu::TextureView> srgbViews(l->srgbTextures.size()), linearViews(l->linearTextures.size());
    const auto view = [&](int image, bool srgb, const wgpu::TextureView& fallback) {
      auto& textures = srgb ? l->srgbTextures : l->linearTextures;
      auto& views = srgb ? srgbViews : linearViews;
      if (image < 0 || static_cast<size_t>(image) >= textures.size() || !textures[static_cast<size_t>(image)]) {
        return fallback;
      }
      auto& slot = views[static_cast<size_t>(image)];
      if (!slot) slot = textures[static_cast<size_t>(image)].CreateView();
      return slot;
    };
    const Fallbacks& f = fallbacks(device);

    std::vector<ModelMaterial> materials = l->data.materials;
    materials.emplace_back();  // the default material, for parts without one
    for (const ModelMaterial& m : materials) {
      GpuModel::MaterialUniforms u = {};
      for (int i = 0; i < 4; ++i) u.baseColor[i] = m.baseColor[i];
      u.params[0] = m.metallic;
      u.params[1] = m.roughness;
      u.params[2] = m.normalScale;
      u.params[3] = m.occlusionStrength;
      u.surface[0] = m.flame;  // J102: a flame volume
      u.emissive[0] = m.emissive.x;
      u.emissive[1] = m.emissive.y;
      u.emissive[2] = m.emissive.z;
      u.emissive[3] = 1;
      wgpu::BindGroupEntry e[7];
      e[0].binding = 1;
      e[0].buffer = makeBuffer(device, &u, sizeof(u), wgpu::BufferUsage::Uniform | wgpu::BufferUsage::CopyDst);
      model->materialNames.push_back(m.name);
      model->materialValues.push_back(u);
      model->materialBuffers.push_back(e[0].buffer);
      e[0].size = sizeof(u);
      e[1].binding = 2;
      e[1].textureView = view(m.baseColorImage, true, f.white);
      e[2].binding = 3;
      e[2].textureView = view(m.metalRoughImage, false, f.whiteLinear);
      e[3].binding = 4;
      e[3].textureView = view(m.normalImage, false, f.flatNormal);
      e[4].binding = 5;
      e[4].textureView = view(m.occlusionImage, false, f.whiteLinear);
      e[5].binding = 6;
      e[5].sampler = l->sampler;
      e[6].binding = 7;
      e[6].textureView = view(m.emissiveImage, true, f.white);
      wgpu::BindGroupDescriptor desc;
      desc.layout = l->layout;
      desc.entryCount = 7;
      desc.entries = e;
      model->bindGroups.push_back(device.CreateBindGroup(&desc));
    }
    l->srgbTextures.clear();
    l->linearTextures.clear();

    // Each part: empty buffers now, filled by slice jobs.
    for (ModelPrimitive& p : l->data.primitives) {
      GpuModel::Part part;
      buildClusters(p, part);  // reorders p.indices, so before the upload
      const size_t vbytes = p.vertices.size() * sizeof(ModelVertex), ibytes = p.indices.size() * sizeof(uint32_t);
      wgpu::BufferDescriptor vd;
      vd.size = (vbytes + 3) & ~size_t{3};
      vd.usage = wgpu::BufferUsage::Vertex | wgpu::BufferUsage::CopyDst;
      part.vertexBuffer = device.CreateBuffer(&vd);
      wgpu::BufferDescriptor id;
      id.size = (ibytes + 3) & ~size_t{3};
      id.usage = wgpu::BufferUsage::Index | wgpu::BufferUsage::CopyDst;
      part.indexBuffer = device.CreateBuffer(&id);
      queueBufferWrites(l, part.vertexBuffer, p.vertices.data(), vbytes);
      queueBufferWrites(l, part.indexBuffer, p.indices.data(), ibytes);
      part.indexCount = static_cast<uint32_t>(p.indices.size());
      const bool hasMaterial = p.material >= 0 && static_cast<size_t>(p.material) < l->data.materials.size();
      part.material = hasMaterial ? static_cast<size_t>(p.material) : l->data.materials.size();
      part.blend = hasMaterial && l->data.materials[static_cast<size_t>(p.material)].blend;
      model->hasBlend = model->hasBlend || part.blend;
      model->parts.push_back(part);
    }

    // After every slice (jobs in a lane run in order): hand the model over.
    queueJob([l] {
      size_t triangles = 0;
      for (const GpuModel::Part& part : l->model->parts) triangles += part.indexCount / 3;
      LOG_INFO("Model %s: %zu parts, %zu triangles, %zu textures, %.0f ms.", l->url.c_str(), l->model->parts.size(),
               triangles, l->data.images.size(), emscripten_get_now() - l->startMs);
      std::string name = l->url.substr(l->url.find_last_of('/') + 1);  // "assets/models/piano.glb.gz" -> "piano"
      name = name.substr(0, name.find('.'));
      profiler().stage("model:" + name, false);  // already logged above
      // The GPU has its copy now; the CPU keeps the shapes (no textures) for rays.
      l->data.images.clear();
      l->model->cpu = std::make_shared<const ModelData>(std::move(l->data));
      auto done = std::move(l->done);
      done(std::move(l->model));
    }, JobLane::kNormal, "model-done");
  }, JobLane::kNormal, "model-materials");
}

}  // namespace

// After parsing: start the image decodes; finish() runs when they're in.
// Images used by several models (the same bytes) are decoded and uploaded
// once and shared.
struct SharedImage {
  bool ready = false;
  std::vector<wgpu::Texture> textures;
  std::vector<std::function<void(std::vector<wgpu::Texture>)>> waiting;
};
std::map<uint64_t, std::shared_ptr<SharedImage>>& sharedImages() {
  static std::map<uint64_t, std::shared_ptr<SharedImage>> m;
  return m;
}
uint64_t imageKey(const std::vector<uint8_t>& bytes, bool srgb, bool linear, int maxSize) {
  uint64_t h = 1469598103934665603ull;  // FNV-1a
  for (uint8_t b : bytes) h = (h ^ b) * 1099511628211ull;
  return h ^ (static_cast<uint64_t>(srgb) << 1) ^ (static_cast<uint64_t>(linear) << 2) ^
         (static_cast<uint64_t>(maxSize) << 3);
}

constexpr const char* kAstcMime = "image/x-looped-astc";

static void afterParse(const std::shared_ptr<Loading>& l) {
  // Which images are colors and which are data (both is possible).
  const size_t count = l->data.images.size();
  std::vector<bool> asSrgb(count, false), asLinear(count, false);
  // Largest size kept per image: colors and normals up to 1024, roughness
  // and shadow (occlusion) maps 256 (they change slowly across a surface).
  std::vector<int> maxSize(count, 0);
  const auto use = [&](int image, bool srgb, int cap) {
    if (image < 0 || static_cast<size_t>(image) >= count) return;
    (srgb ? asSrgb : asLinear)[static_cast<size_t>(image)] = true;
    maxSize[static_cast<size_t>(image)] = std::max(maxSize[static_cast<size_t>(image)], cap);
  };
  for (const ModelMaterial& m : l->data.materials) {
    use(m.baseColorImage, true, 1024);
    use(m.emissiveImage, true, 1024);
    use(m.metalRoughImage, false, 256);
    use(m.normalImage, false, 1024);
    use(m.occlusionImage, false, 256);
  }
  l->srgbTextures.resize(count);
  l->linearTextures.resize(count);
  l->pendingImages = 0;
  for (size_t i = 0; i < count; ++i) l->pendingImages += asSrgb[i] || asLinear[i] ? 1 : 0;
  if (l->pendingImages == 0) {
    finish(l);
    return;
  }
  for (size_t i = 0; i < count; ++i) {
    if (!asSrgb[i] && !asLinear[i]) continue;
    std::vector<wgpu::TextureFormat> formats;
    if (asSrgb[i]) formats.push_back(wgpu::TextureFormat::RGBA8UnormSrgb);
    if (asLinear[i]) formats.push_back(wgpu::TextureFormat::RGBA8Unorm);
    ModelImage& img = l->data.images[i];
    auto use = [l, i, srgb = static_cast<bool>(asSrgb[i])](std::vector<wgpu::Texture> textures) {
      if (textures.empty()) LOG_ERROR("Model %s: texture %zu could not be loaded.", l->url.c_str(), i);
      size_t k = 0;
      if (srgb && k < textures.size()) l->srgbTextures[i] = textures[k++];
      if (k < textures.size()) l->linearTextures[i] = textures[k];
      if (--l->pendingImages == 0) finish(l);
    };
    const uint64_t key = imageKey(img.bytes, asSrgb[i], asLinear[i], maxSize[i]);
    auto& entry = sharedImages()[key];
    if (entry) {  // another model has (or is loading) the same image
      if (entry->ready) {
        queueJob([use, textures = entry->textures] { use(textures); }, JobLane::kNormal, "texture-shared");
      } else {
        entry->waiting.push_back(use);
      }
      std::vector<uint8_t>().swap(img.bytes);
      continue;
    }
    entry = std::make_shared<SharedImage>();
    entry->waiting.push_back(use);
    const auto ready = [entry](std::vector<wgpu::Texture> textures) {
      entry->ready = true;
      entry->textures = textures;
      for (auto& w : entry->waiting) w(textures);
      entry->waiting.clear();
    };
    if (img.mimeType == kAstcMime) {
      // The phone version (tools/assets/astc_pack.py): the image is only a
      // reference, "BA3R" + key; the texture is a shared file in tex/.
      const std::string key = img.bytes.size() == 20 ? std::string(img.bytes.begin() + 4, img.bytes.end()) : "";
      if (key.empty() || std::memcmp(img.bytes.data(), "BA3R", 4) != 0) {
        ready({});
        continue;
      }
      const size_t models = l->url.rfind("models/");
      const std::string base = models == std::string::npos ? "" : l->url.substr(0, models);
      loadAstcTexture(l->device, base + "tex/" + key + ".ba3c.gz", asSrgb[i], asLinear[i], ready);
      continue;
    }
    loadImageTexture(l->device, std::move(img.bytes), img.mimeType, formats, l->url.c_str(),
                     ready, maxSize[i]);
  }
}

void GpuModel::load(const wgpu::Device& device, const wgpu::BindGroupLayout& layout, const wgpu::Sampler& sampler,
                    const std::string& url, std::function<void(std::shared_ptr<GpuModel>)> done,
                    std::function<void(float)> progress, const std::string& fallbackUrl) {
  auto l = std::make_shared<Loading>();
  l->device = device;
  l->layout = layout;
  l->sampler = sampler;
  l->url = url;
  l->done = std::move(done);
  l->startMs = emscripten_get_now();
  fetchFile(url, [l, device, layout, sampler, progress, fallbackUrl](bool ok, std::vector<uint8_t> bytes) {
    if (!ok && !fallbackUrl.empty()) {
      LOG_INFO("Model %s: not found, loading %s instead.", l->url.c_str(), fallbackUrl.c_str());
      load(device, layout, sampler, fallbackUrl, std::move(l->done), progress);
      return;
    }
    if (!ok) {
      LOG_ERROR("Model %s: download failed.", l->url.c_str());
      l->done(nullptr);
      return;
    }
    // Parsing runs as jobs too: the file's directory, then one job per mesh
    // part, then the materials and images.
    queueJob([l, bytes = std::move(bytes)]() mutable {
      l->parser = std::make_shared<GlbParser>();
      std::string error;
      if (!l->parser->begin(std::move(bytes), error)) {
        LOG_ERROR("Model %s: %s", l->url.c_str(), error.c_str());
        l->done(nullptr);
        return;
      }
      for (size_t i = 0; i < l->parser->partCount(); ++i) {
        queueJob([l] {
          if (l->failed) return;
          std::string e;
          if (!l->parser->step(l->data, e)) {
            l->failed = true;
            LOG_ERROR("Model %s: %s", l->url.c_str(), e.c_str());
            l->done(nullptr);
          }
        }, JobLane::kNormal, "model-part");
      }
      queueJob([l] {
        if (l->failed) return;
        std::string e;
        if (!l->parser->finish(l->data, e)) {
          l->failed = true;
          LOG_ERROR("Model %s: %s", l->url.c_str(), e.c_str());
          l->done(nullptr);
          return;
        }
        for (size_t i = 0; i < l->data.images.size(); ++i) {  // one image copy per job
          queueJob([l, i] {
            if (l->failed) return;
            std::string err;
            if (!l->parser->image(i, l->data, err)) {
              l->failed = true;
              LOG_ERROR("Model %s: %s", l->url.c_str(), err.c_str());
              l->done(nullptr);
            }
          }, JobLane::kNormal, "model-image");
        }
        queueJob([l] {
          if (l->failed) return;
          l->parser.reset();
          afterParse(l);
        }, JobLane::kNormal, "model-images-done");
      }, JobLane::kNormal, "model-parse-end");
    }, JobLane::kNormal, "model-parse");
  }, std::move(progress));
}

void GpuModel::setRealFix(const wgpu::Queue& queue, size_t material, float fix, float leastRough) {
  if (material >= materialValues.size()) return;
  MaterialUniforms& u = materialValues[material];
  if (u.emissive[3] == fix && u.surface[1] == leastRough) return;
  u.emissive[3] = fix;
  u.surface[1] = leastRough;
  queue.WriteBuffer(materialBuffers[material], 0, &materialValues[material], sizeof(MaterialUniforms));
}

}  // namespace engine
