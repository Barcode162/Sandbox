#include "looped/scene_renderer.h"

#include <emscripten/emscripten.h>

#include <algorithm>
#include <unordered_map>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <memory>

#include "looped/frame_time.h"
#include "looped/jobs.h"
#include "looped/light_units.h"
#include "looped/fetch.h"
#include "looped/file.h"
#include "looped/log.h"
#include "looped/pipeline_cache.h"
#include "looped/profiler.h"
#include "looped/texture.h"

using engine::Mat4;
using engine::Vec3;
using engine::Vec4;

namespace engine {
namespace {

// Tilts the near plane of world->clip matrix `m` (depth 0..1) onto `plane`
// (world space, a·x + b·y + c·z + d >= 0 is kept), so the GPU clips away
// everything on the other side (Lengyel's oblique near plane). Used for
// mirrors instead of a discard in the shader.
Mat4 obliqueNearPlane(const Mat4& m, const float plane[4]) {
  const Mat4 inv = inverse(m);
  // The plane in clip space (its x and y signs pick the far corner below).
  float clip[4];
  for (int j = 0; j < 4; ++j) {
    clip[j] = 0;
    for (int i = 0; i < 4; ++i) clip[j] += plane[i] * inv.at(j, i);
  }
  // The far corner of the view on the kept side, back in world space.
  const float corner[4] = {clip[0] >= 0 ? 1.0f : -1.0f, clip[1] >= 0 ? 1.0f : -1.0f, 1.0f, 1.0f};
  float q[4];
  for (int r = 0; r < 4; ++r) {
    q[r] = 0;
    for (int c = 0; c < 4; ++c) q[r] += inv.at(c, r) * corner[c];
  }
  const float s = plane[0] * q[0] + plane[1] * q[1] + plane[2] * q[2] + plane[3] * q[3];
  if (std::fabs(s) < 1e-12f) return m;
  Mat4 out = m;
  for (int c = 0; c < 4; ++c) out.at(c, 2) = plane[c] / s;  // the depth row
  return out;
}

// WebGPU requires dynamic uniform offsets to be multiples of 256 bytes.
constexpr uint64_t kObjectStride = 256;
static_assert(kObjectStride == SceneRenderer::kObjectStrideBytes);
constexpr wgpu::Color kClearColor{0.02, 0.015, 0.015, 1.0};
constexpr wgpu::Color kAvatarBackdrop{0.10, 0.10, 0.13, 1.0};
constexpr float kSoftShadeRadius = 0.5f;    // metres around each point that can shade it (J91)
constexpr float kSoftShadeStrength = 1.0f;
constexpr float kBeamReach = 20.0f;   // metres

wgpu::ShaderModule loadShader(const wgpu::Device& device, const char* path) {
  auto source = engine::readTextFile(path);
  if (!source) return nullptr;
  wgpu::ShaderSourceWGSL wgsl;
  wgsl.code = source->c_str();
  wgpu::ShaderModuleDescriptor desc;
  desc.nextInChain = &wgsl;
  desc.label = path;
  return device.CreateShaderModule(&desc);
}

wgpu::Buffer makeUniformBuffer(const wgpu::Device& device, uint64_t size, const char* label) {
  wgpu::BufferDescriptor desc;
  desc.label = label;
  desc.size = size;
  desc.usage = wgpu::BufferUsage::Uniform | wgpu::BufferUsage::CopyDst;
  return device.CreateBuffer(&desc);
}

Mat4 modelMatrix(Vec3 position, engine::Quat rotation, float scale) {
  Mat4 m = Mat4::transform(position, rotation);
  for (int c = 0; c < 3; ++c) {
    for (int r = 0; r < 3; ++r) m.at(c, r) *= scale;
  }
  return m;
}

void setVec4(float out[4], Vec3 v, float w) {
  out[0] = v.x;
  out[1] = v.y;
  out[2] = v.z;
  out[3] = w;
}

}  // namespace

bool SceneRenderer::init(engine::Gpu& gpu, const RenderScene& scene, const std::vector<engine::SkinnedMeshData>& avatars,
                         Limits limits) {
  limits_ = limits;
  if (!shadows_.init(gpu.device, engine::Gpu::kSceneFormat, engine::Gpu::kDepthFormat)) LOG_ERROR("Floor shadows: no shader.");
  gpu_ = &gpu;
  const wgpu::Device& device = gpu.device;
  mirrorCount_ = scene.mirrorCount;
  if (!createScenePipelines() || !createGlassPipeline()) return false;
  if (!post_.init(gpu)) LOG_ERROR("Eyes and mood: post.wgsl is missing.");
  post_.setMood(scene.mood);
  engine::profiler().stage("pipelines");

  // Object uniforms: the scene objects (written once) followed by the avatar
  // (its position is rewritten every frame as you move), the other players'
  // avatars and the boxes. Models carry theirs in the instance buffer (J87).
  const auto& objects = scene.objects;
  const size_t total = objects.size() + 1 + limits_.others + limits_.boxes;
  objectBuffer_ = makeUniformBuffer(device, total * kObjectStride, "object uniforms");
  {
    wgpu::BindGroupEntry entry;
    entry.binding = 0;
    entry.buffer = objectBuffer_;
    entry.size = sizeof(ObjectUniforms);
    wgpu::BindGroupDescriptor desc;
    desc.layout = objectLayout_;
    desc.entryCount = 1;
    desc.entries = &entry;
    objectBindGroup_ = device.CreateBindGroup(&desc);
  }
  rooms_ = scene.rooms;
  doorways_ = scene.doorways;
  std::vector<uint8_t> objectData(total * kObjectStride);
  for (size_t i = 0; i < objects.size(); ++i) {
    const DrawObject& o = objects[i];
    ObjectUniforms u = {};
    u.model = Mat4::transform(o.position, o.rotation);
    setVec4(u.color, o.color, o.metallic);
    u.material[0] = o.emissive;
    u.material[1] = o.roughness;
    u.material[2] = static_cast<float>(o.texture);
    u.material[3] = o.textureScale;
    std::memcpy(objectData.data() + i * kObjectStride, &u, sizeof(u));
    objectUniforms_.push_back(u);
    engine::Aabb local = engine::Aabb::empty();
    for (const engine::Vertex& v : o.mesh.vertices) {
      local.min = engine::minComponents(local.min, v.position);
      local.max = engine::maxComponents(local.max, v.position);
    }
    if (o.mesh.vertices.empty()) local = {};
    sceneDraws_.push_back({engine::Mesh::upload(device, o.mesh), static_cast<uint32_t>(i * kObjectStride),
                           engine::transformAabb(u.model, local)});
    sceneDraws_.back().room = roomOf(sceneDraws_.back().bounds);
  }
  {
    ObjectUniforms u = {};
    setVec4(u.color, {1, 1, 1}, 0);  // colors come from the mesh itself
    u.material[3] = scene.avatarTextureScale;
    avatarOffset_ = static_cast<uint32_t>(objects.size() * kObjectStride);
    std::memcpy(objectData.data() + avatarOffset_, &u, sizeof(u));
    for (const engine::SkinnedMeshData& a : avatars) avatarMeshes_.push_back(engine::SkinnedMesh::upload(device, a));
    for (size_t i = 0; i < limits_.others; ++i) {
      OtherSlot slot;
      slot.offset = static_cast<uint32_t>((objects.size() + 1 + i) * kObjectStride);
      std::memcpy(objectData.data() + slot.offset, &u, sizeof(u));
      others_.push_back(slot);
    }
  }
  loadModels(scene);
  engine::fetchFile("assets/models/albedo.json", [this](bool ok, std::vector<uint8_t> bytes) {
    std::string error;
    if (!ok || !albedo_.parse(std::string(bytes.begin(), bytes.end()), &error)) {
      LOG_ERROR("Material brightness table (albedo.json): %s", ok ? error.c_str() : "not found");
      return;
    }
    for (size_t f = 0; f < fileNames_.size(); ++f) applyAlbedo(f);
  });
  // The model downloads are on their way; make the avatar textures meanwhile.
  createMaterials(scene, colorMaps_, bumpMaps_, sampler_);
  engine::profiler().stage("textures");
  lights_ = scene.lights;
  lightScale_.assign(lights_.size(), 1.0f);
  lightGridMin_ = scene.lightGridMin;
  lightGridMax_ = scene.lightGridMax;
  buildLighting();
  if (!gi_.init(gpu, lightingBuffer_, sizeof(LightingUniforms))) LOG_ERROR("Bounced light: not available.");
  createEnvironment();
  createShadows();
  if (!ssao_.init(device)) LOG_ERROR("Soft shade: ssao.wgsl is missing.");
  if (!beams_.init(device, engine::Gpu::kSceneFormat)) LOG_ERROR("Light beams: beams.wgsl is missing.");
  for (size_t i = 0; i < 1 + mirrorCount_; ++i) views_.push_back(makeView(envView_, "frame uniforms", nullptr, false, i == 0));
  for (View& v : shadowViews_) v = makeView(envDummyView_, "lamp shadow frame uniforms", nullptr, true);
  // The capture's own views: they can't read the cube they draw into.
  for (View& v : captureViews_) v = makeView(envDummyView_, "capture frame uniforms");

  boxOffset_ = static_cast<uint32_t>((objects.size() + 1 + limits_.others) * kObjectStride);
  boxMesh_ = engine::Mesh::upload(device, engine::makeBox({1, 1, 1}));
  gpu.queue.WriteBuffer(objectBuffer_, 0, objectData.data(), objectData.size());

  bonesBindGroup_ = makeBonesBindGroup(bonesBuffer_, "avatar bones");
  firstPersonBonesBindGroup_ = makeBonesBindGroup(firstPersonBonesBuffer_, "avatar bones (first person)");
  for (OtherSlot& slot : others_) slot.bonesBindGroup = makeBonesBindGroup(slot.bonesBuffer, "other player bones");
  LOG_INFO("Avatars: %zu looks, %zu vertices each.", avatars.size(), avatars.empty() ? 0 : avatars[0].vertices.size());

  // Atmosphere doesn't change per frame.
  const size_t lightCount = std::min<size_t>(scene.lights.size(), kMaxLights);
  setVec4(frame_.ambient, scene.ambient, 0);
  setVec4(frame_.fog, scene.fogColor, scene.fogDensity);
  beamHaze_ = scene.beamHaze;

  mirrorTargets_.resize(mirrorCount_);
  for (MirrorTarget& m : mirrorTargets_) m.glassBuffer = makeUniformBuffer(device, sizeof(GlassUniforms), "glass");
  LOG_INFO("Scene: %zu objects, %zu lights, %zu mirrors.", objects.size(), lightCount, mirrorCount_);
  return true;
}

// One light as the GPU sees it, for the current lighting. New (L1.2): its
// colour at luminance 1 times its candela, its reach worked out from how
// bright it is. Classic: as before L1.
SceneRenderer::GpuLight SceneRenderer::gpuLightOf(const PointLight& p, float scale) const {
  GpuLight g = {};
  Vec3 color = p.color;
  if (p.kelvin > 0) color = engine::mulComponents(engine::light::kelvinColor(p.kelvin), p.color);
  if (classic_) {
    if (p.kelvin > 0) color = color * (1.0f / std::max({color.x, color.y, color.z, 1e-4f}));
    setVec4(g.position, p.position, p.range);
    setVec4(g.color, color, p.intensity * scale);
  } else {
    const float lm = p.lumens > 0 ? p.lumens : engine::light::lumensFromClassic(p.intensity);
    // A panel shines from both faces like a flat lamp (its brightest, head-on,
    // is lumens / 2 pi); balls and tubes every way (lumens / 4 pi).
    const float cd = p.shape == 2 ? lm / (2.0f * engine::kPi) : engine::light::candela(lm);
    const float size = engine::length(p.axis) + engine::length(p.axis2);
    setVec4(g.position, p.position, engine::light::reach(cd) + size);
    setVec4(g.color, engine::light::unitLuminance(color), cd * scale);
    setVec4(g.axis, p.axis, static_cast<float>(p.shape));
    setVec4(g.axis2, p.axis2, p.oneSided ? 1.0f : 0.0f);  // w: shines from its front only (J113)
  }
  g.params[0] = p.radius;
  return g;
}

void SceneRenderer::setClassicLighting(bool classic) {
  if (classic == classic_ && !gpuLights_.empty()) return;
  classic_ = classic;
  post_.resetEyes();
  if (gpu_ && !lights_.empty()) buildLighting();
  if (envReady_) capturePending_ = true;  // reflections in the new light
}

void SceneRenderer::setLightsPerPixel(int n) {
  if (n == lightsPerPixel_) return;
  lightsPerPixel_ = n;
  if (gpu_ && !lights_.empty()) buildLighting();
}

// Fills the light list and the light grid (see LightingUniforms). A light
// reaches a cell if its reach touches the cell's square. A cell that had to
// leave a light out would show as a square of different light (seen on the
// phone), so the new lighting raises the faintest light a lamp still reaches
// to (0.1 lux at first, the edge of its reach) until every cell fits. Classic:
// the brightest win.
void SceneRenderer::buildLighting() {
  auto l = std::make_unique<LightingUniforms>();
  std::memset(l.get(), 0, sizeof(LightingUniforms));
  const size_t count = std::min<size_t>(lights_.size(), kMaxLights);
  if (lights_.size() > kMaxLights) LOG_ERROR("Too many lights; only %u used", kMaxLights);
  l->lightCount[0] = static_cast<uint32_t>(count);
  lightIntensity_.clear();
  for (size_t i = 0; i < count; ++i) {
    l->lights[i] = gpuLightOf(lights_[i], 1.0f);
    lightIntensity_.push_back(l->lights[i].color[3]);
    l->lights[i].color[3] *= lightScale_[i];
  }
  const uint32_t cap = lightsPerPixel_ > 0 ? std::min<uint32_t>(lightsPerPixel_, kLightsPerCell) : kLightsPerCell;
  // Cells cover the walkable area (blockers included) with at most kGridSide x kGridSide.
  float x0 = lightGridMin_.x, z0 = lightGridMin_.z;
  const float spanX = lightGridMax_.x - x0, spanZ = lightGridMax_.z - z0;
  const float cell = std::max({spanX, spanZ, 1.0f}) / static_cast<float>(kGridSide);
  const auto nx = static_cast<uint32_t>(std::ceil(spanX / cell)), nz = static_cast<uint32_t>(std::ceil(spanZ / cell));
  l->grid[0] = x0;
  l->grid[1] = z0;
  l->grid[2] = 1.0f / cell;
  l->gridSize[0] = nx;
  l->gridSize[1] = nz;
  // How many lights reach each cell (each light's reach is position[3]).
  auto reaching = [&](uint32_t cx, uint32_t cz, std::vector<std::pair<float, uint32_t>>& reach) {
    reach.clear();
    const float minX = x0 + cx * cell, minZ = z0 + cz * cell;
    for (size_t i = 0; i < count; ++i) {
      const GpuLight& g = l->lights[i];
      const float px = g.position[0], pz = g.position[2], range = g.position[3];
      const float dx = px - std::clamp(px, minX, minX + cell);
      const float dz = pz - std::clamp(pz, minZ, minZ + cell);
      const float d2 = dx * dx + dz * dz;
      if (d2 >= range * range) continue;
      reach.push_back({lightIntensity_[i] / (d2 + 1.0f), static_cast<uint32_t>(i)});
    }
  };
  std::vector<std::pair<float, uint32_t>> reach;
  float minLux = engine::light::kMinLux;
  if (!classic_) {
    for (int round = 0; round < 24; ++round) {
      for (size_t i = 0; i < count; ++i) {
        const PointLight& p = lights_[i];
        l->lights[i].position[3] = engine::light::reach(lightIntensity_[i], minLux) + engine::length(p.axis) + engine::length(p.axis2);
      }
      size_t most = 0;
      for (uint32_t cz = 0; cz < nz; ++cz)
        for (uint32_t cx = 0; cx < nx; ++cx) {
          reaching(cx, cz, reach);
          most = std::max(most, reach.size());
        }
      if (most <= cap) break;
      minLux *= 1.25f;
    }
  }
  int crowded = 0;
  size_t listed = 0;  // lights listed over all cells (a pixel goes through its cell's list)
  for (uint32_t cz = 0; cz < nz; ++cz) {
    for (uint32_t cx = 0; cx < nx; ++cx) {
      reaching(cx, cz, reach);  // (strength here, light)
      std::sort(reach.begin(), reach.end(), [](auto a, auto b) { return a.first > b.first; });
      if (reach.size() > cap) ++crowded;
      const size_t n = std::min<size_t>(reach.size(), cap);
      listed += n;
      uint32_t* c = l->cells[cz * nx + cx];
      for (size_t k = 0; k < kLightsPerCell; ++k) c[k / 4] |= (k < n ? reach[k].second : 0xffu) << (8 * (k % 4));
    }
  }
  if (!lightingBuffer_) lightingBuffer_ = makeUniformBuffer(gpu_->device, sizeof(LightingUniforms), "lighting");
  gpu_->queue.WriteBuffer(lightingBuffer_, 0, l.get(), sizeof(LightingUniforms));
  gpuLights_.assign(l->lights, l->lights + kMaxLights);
  lightsDirtyFrom_ = SIZE_MAX;
  lightsDirtyTo_ = 0;
  applyShadowSlots();  // which lamps use their shadow maps (J97)
  LOG_INFO("Lights (%s): %zu in a %ux%u grid of %.2f m cells, at most %u each (%.1f on average); lamps reach down to %.2f lux%s.",
           classic_ ? "classic" : "real units", count, nx, nz, cell, cap,
           static_cast<double>(listed) / static_cast<double>(std::max(1u, nx * nz)), classic_ ? 0.0f : minLux,
           crowded ? " (some cells are too full; the faintest are left out)" : "");
  if (crowded) LOG_INFO("Crowded light cells: %d.", crowded);
}

wgpu::BindGroup SceneRenderer::makeBonesBindGroup(wgpu::Buffer& buffer, const char* label) {
  buffer = makeUniformBuffer(gpu_->device, kMaxBones * sizeof(Mat4), label);
  wgpu::BindGroupEntry entry;
  entry.binding = 0;
  entry.buffer = buffer;
  entry.size = kMaxBones * sizeof(Mat4);
  wgpu::BindGroupDescriptor desc;
  desc.layout = bonesLayout_;
  desc.entryCount = 1;
  desc.entries = &entry;
  return gpu_->device.CreateBindGroup(&desc);
}

SceneRenderer::View SceneRenderer::makeView(const wgpu::TextureView& env, const char* label, wgpu::Buffer buffer,
                                            bool shadowPass, bool mainView) {
  const wgpu::Device& device = gpu_->device;
  View v;
  v.buffer = buffer ? buffer : makeUniformBuffer(device, sizeof(FrameUniforms), label);
  v.env = env;
  wgpu::BindGroupEntry entries[15];
  entries[0].binding = 0;
  entries[0].buffer = v.buffer;
  entries[0].size = sizeof(FrameUniforms);
  entries[1].binding = 1;
  entries[1].textureView = colorMaps_;
  entries[2].binding = 2;
  entries[2].textureView = bumpMaps_;
  entries[3].binding = 3;
  entries[3].sampler = sampler_;
  entries[4].binding = 4;
  entries[4].buffer = lightingBuffer_;
  entries[4].size = sizeof(LightingUniforms);
  entries[5].binding = 5;
  entries[5].textureView = env;
  entries[6].binding = 6;
  entries[6].sampler = envSampler_;
  for (int c = 0; c < 3; ++c) {  // bounced light (L1.5)
    entries[7 + c].binding = static_cast<uint32_t>(7 + c);
    entries[7 + c].textureView = gi_.sh(c);
  }
  entries[10].binding = 10;
  entries[10].textureView = gi_.mask();
  entries[11].binding = 11;
  entries[11].textureView = shadowPass ? shadowDummyView_ : shadowArrayView_;
  entries[12].binding = 12;
  entries[12].sampler = shadowSampler_;
  entries[13].binding = 13;
  entries[13].textureView = mainView && aoBound_ ? ssao_.result() : ssao_.none();
  entries[14].binding = 14;
  entries[14].sampler = ssao_.sampler();
  wgpu::BindGroupDescriptor desc;
  desc.layout = frameLayout_;
  desc.entryCount = 15;
  desc.entries = entries;
  v.bindGroup = device.CreateBindGroup(&desc);
  return v;
}

void SceneRenderer::createEnvironment() {
  const wgpu::Device& device = gpu_->device;
  wgpu::TextureDescriptor t;
  t.label = "reflection cube";
  t.size = {kEnvSize, kEnvSize, 6};
  t.format = engine::Gpu::kSceneFormat;  // linear light
  t.mipLevelCount = kEnvLevels;
  t.usage = wgpu::TextureUsage::TextureBinding | wgpu::TextureUsage::RenderAttachment;
  envTexture_ = device.CreateTexture(&t);
  wgpu::TextureViewDescriptor cube;
  cube.dimension = wgpu::TextureViewDimension::Cube;
  envView_ = envTexture_.CreateView(&cube);
  t.label = "no reflection yet";
  t.size = {1, 1, 6};
  t.mipLevelCount = 1;
  t.usage = wgpu::TextureUsage::TextureBinding;
  envDummy_ = device.CreateTexture(&t);
  envDummyView_ = envDummy_.CreateView(&cube);
  t.label = "reflection depth";
  t.size = {kEnvSize, kEnvSize, 1};
  t.format = engine::Gpu::kDepthFormat;
  t.usage = wgpu::TextureUsage::RenderAttachment;
  envDepth_ = device.CreateTexture(&t);
  envDepthView_ = envDepth_.CreateView();
  wgpu::SamplerDescriptor sd;
  sd.magFilter = sd.minFilter = wgpu::FilterMode::Linear;
  sd.mipmapFilter = wgpu::MipmapFilterMode::Linear;
  sd.addressModeU = sd.addressModeV = sd.addressModeW = wgpu::AddressMode::ClampToEdge;
  envSampler_ = device.CreateSampler(&sd);
}

void SceneRenderer::captureEnvironment(const wgpu::CommandEncoder& encoder) {
  // One face per axis, oriented the way cube textures are read: right = the
  // face's s axis, down = its t axis. Drawn with x flipped (and the mirror's
  // pipelines, whose triangles wind the other way to match).
  static const Vec3 kForward[6] = {{1, 0, 0}, {-1, 0, 0}, {0, 1, 0}, {0, -1, 0}, {0, 0, 1}, {0, 0, -1}};
  static const Vec3 kUp[6] = {{0, 1, 0}, {0, 1, 0}, {0, 0, -1}, {0, 0, 1}, {0, 1, 0}, {0, 1, 0}};
  Mat4 flip;
  flip.at(0, 0) = -1;
  const Mat4 proj = flip * Mat4::perspective(engine::kPi / 2, 1, 0.05f, 60);
  const int room = roomAt(envCenter_);
  for (int k = 0; k < 6; ++k) {
    FrameUniforms f = frame_;
    f.viewProj = proj * Mat4::lookAt(envCenter_, envCenter_ + kForward[k], kUp[k]);
    setVec4(f.cameraPos, envCenter_, 1);
    setVec4(f.clipPlane, {0, 0, 0}, 1);
    f.env[0] = 1;  // store light (and no reflections of reflections)
    f.env[1] = 0;
    gpu_->queue.WriteBuffer(captureViews_[k].buffer, 0, &f, sizeof(f));
    wgpu::TextureViewDescriptor face;
    face.dimension = wgpu::TextureViewDimension::e2D;
    face.baseMipLevel = 0;
    face.mipLevelCount = 1;
    face.baseArrayLayer = static_cast<uint32_t>(k);
    face.arrayLayerCount = 1;
    wgpu::RenderPassColorAttachment color;
    color.view = envTexture_.CreateView(&face);
    color.loadOp = wgpu::LoadOp::Clear;
    color.storeOp = wgpu::StoreOp::Store;
    color.clearValue = {0, 0, 0, 1};
    wgpu::RenderPassDepthStencilAttachment depth;
    depth.view = envDepthView_;
    depth.depthLoadOp = wgpu::LoadOp::Clear;
    depth.depthStoreOp = wgpu::StoreOp::Discard;
    depth.depthClearValue = 1.0f;
    wgpu::RenderPassDescriptor passDesc;
    passDesc.colorAttachmentCount = 1;
    passDesc.colorAttachments = &color;
    passDesc.depthStencilAttachment = &depth;
    const RoomView cull = roomView(f.viewProj, room);
    wgpu::RenderPassEncoder pass = encoder.BeginRenderPass(&passDesc);
    pass.SetPipeline(mirroredPipeline_);
    pass.SetBindGroup(0, captureViews_[k].bindGroup);
    drawItems(pass, sceneDraws_, cull);
    pass.SetPipeline(modelMirroredPipeline_);
    drawModels(pass, false, envCenter_, cull);
    pass.SetPipeline(modelBlendMirroredPipeline_);
    drawModels(pass, true, envCenter_, cull);
    pass.End();
  }
  engine::encodeMipmaps(gpu_->device, encoder, envTexture_, 6);
  envReady_ = true;
  LOG_INFO("Reflections: the room captured from %.1f, %.1f, %.1f.", envCenter_.x, envCenter_.y, envCenter_.z);
}

bool SceneRenderer::createScenePipelines() {
  const wgpu::Device& device = gpu_->device;
  wgpu::ShaderModule module = loadShader(device, "/shaders/scene.wgsl");
  if (!module) return false;

  // Group 0: frame uniforms + material textures. Group 1: per-object uniforms.
  wgpu::BindGroupLayoutEntry frameEntries[15];
  frameEntries[0].binding = 0;
  frameEntries[0].visibility = wgpu::ShaderStage::Vertex | wgpu::ShaderStage::Fragment;
  frameEntries[0].buffer.type = wgpu::BufferBindingType::Uniform;
  frameEntries[0].buffer.minBindingSize = sizeof(FrameUniforms);
  for (uint32_t i = 1; i <= 2; ++i) {
    frameEntries[i].binding = i;
    frameEntries[i].visibility = wgpu::ShaderStage::Fragment;
    frameEntries[i].texture.sampleType = wgpu::TextureSampleType::Float;
    frameEntries[i].texture.viewDimension = wgpu::TextureViewDimension::e2DArray;
  }
  frameEntries[3].binding = 3;
  frameEntries[3].visibility = wgpu::ShaderStage::Fragment;
  frameEntries[3].sampler.type = wgpu::SamplerBindingType::Filtering;
  frameEntries[4].binding = 4;
  frameEntries[4].visibility = wgpu::ShaderStage::Fragment;
  frameEntries[4].buffer.type = wgpu::BufferBindingType::Uniform;
  frameEntries[4].buffer.minBindingSize = sizeof(LightingUniforms);
  frameEntries[5].binding = 5;  // the reflection cube (E4.4)
  frameEntries[5].visibility = wgpu::ShaderStage::Fragment;
  frameEntries[5].texture.sampleType = wgpu::TextureSampleType::Float;
  frameEntries[5].texture.viewDimension = wgpu::TextureViewDimension::Cube;
  frameEntries[6].binding = 6;
  frameEntries[6].visibility = wgpu::ShaderStage::Fragment;
  frameEntries[6].sampler.type = wgpu::SamplerBindingType::Filtering;
  for (uint32_t i = 7; i <= 10; ++i) {  // bounced light: the probes' light (3) and which lamps they see
    frameEntries[i].binding = i;
    frameEntries[i].visibility = wgpu::ShaderStage::Fragment;
    frameEntries[i].texture.sampleType = i == 10 ? wgpu::TextureSampleType::Uint : wgpu::TextureSampleType::UnfilterableFloat;
    frameEntries[i].texture.viewDimension = wgpu::TextureViewDimension::e3D;
  }
  frameEntries[11].binding = 11;  // lamp shadows (J97): the cube maps, and comparing with them
  frameEntries[11].visibility = wgpu::ShaderStage::Fragment;
  frameEntries[11].texture.sampleType = wgpu::TextureSampleType::Depth;
  frameEntries[11].texture.viewDimension = wgpu::TextureViewDimension::CubeArray;
  frameEntries[12].binding = 12;
  frameEntries[12].visibility = wgpu::ShaderStage::Fragment;
  frameEntries[12].sampler.type = wgpu::SamplerBindingType::Comparison;
  frameEntries[13].binding = 13;  // the soft shade (J91): shade and distance
  frameEntries[13].visibility = wgpu::ShaderStage::Fragment;
  frameEntries[13].texture.sampleType = wgpu::TextureSampleType::Float;
  frameEntries[14].binding = 14;
  frameEntries[14].visibility = wgpu::ShaderStage::Fragment;
  frameEntries[14].sampler.type = wgpu::SamplerBindingType::Filtering;
  wgpu::BindGroupLayoutDescriptor frameDesc;
  frameDesc.entryCount = 15;
  frameDesc.entries = frameEntries;
  frameLayout_ = device.CreateBindGroupLayout(&frameDesc);

  wgpu::BindGroupLayoutEntry objectEntry;
  objectEntry.binding = 0;
  objectEntry.visibility = wgpu::ShaderStage::Vertex | wgpu::ShaderStage::Fragment;
  objectEntry.buffer.type = wgpu::BufferBindingType::Uniform;
  objectEntry.buffer.hasDynamicOffset = true;
  objectEntry.buffer.minBindingSize = sizeof(ObjectUniforms);
  wgpu::BindGroupLayoutDescriptor objectDesc;
  objectDesc.entryCount = 1;
  objectDesc.entries = &objectEntry;
  objectLayout_ = device.CreateBindGroupLayout(&objectDesc);

  wgpu::BindGroupLayoutEntry bonesEntry;
  bonesEntry.binding = 0;
  bonesEntry.visibility = wgpu::ShaderStage::Vertex;
  bonesEntry.buffer.type = wgpu::BufferBindingType::Uniform;
  bonesEntry.buffer.minBindingSize = kMaxBones * sizeof(Mat4);
  wgpu::BindGroupLayoutDescriptor bonesDesc;
  bonesDesc.entryCount = 1;
  bonesDesc.entries = &bonesEntry;
  bonesLayout_ = device.CreateBindGroupLayout(&bonesDesc);

  // Group 2 (bones) is only used by the skinned pipeline.
  wgpu::BindGroupLayout layouts[] = {frameLayout_, objectLayout_, bonesLayout_};
  wgpu::PipelineLayoutDescriptor layoutDesc;
  layoutDesc.bindGroupLayoutCount = 2;
  layoutDesc.bindGroupLayouts = layouts;
  wgpu::PipelineLayout layout = device.CreatePipelineLayout(&layoutDesc);
  layoutDesc.bindGroupLayoutCount = 3;
  wgpu::PipelineLayout skinnedLayout = device.CreatePipelineLayout(&layoutDesc);

  wgpu::ColorTargetState colorTarget;
  colorTarget.format = engine::Gpu::kSceneFormat;
  wgpu::FragmentState fragment;
  fragment.module = module;
  fragment.entryPoint = "fs_main";
  fragment.targetCount = 1;
  fragment.targets = &colorTarget;
  wgpu::DepthStencilState depth;
  depth.format = engine::Gpu::kDepthFormat;
  depth.depthWriteEnabled = true;
  depth.depthCompare = wgpu::CompareFunction::Less;
  const wgpu::VertexBufferLayout vertexLayout = engine::Mesh::vertexLayout();

  wgpu::RenderPipelineDescriptor desc;
  desc.label = "scene";
  desc.layout = layout;
  desc.vertex.module = module;
  desc.vertex.entryPoint = "vs_main";
  desc.vertex.bufferCount = 1;
  desc.vertex.buffers = &vertexLayout;
  desc.fragment = &fragment;
  desc.depthStencil = &depth;
  desc.primitive.topology = wgpu::PrimitiveTopology::TriangleList;
  desc.primitive.frontFace = wgpu::FrontFace::CCW;
  desc.primitive.cullMode = wgpu::CullMode::Back;
  engine::pipelines::create(device, desc, &pipeline_);
  // A mirror flips the world inside out, so front faces wind the other way.
  desc.label = "scene (mirrored)";
  desc.primitive.frontFace = wgpu::FrontFace::CW;
  engine::pipelines::create(device, desc, &mirroredPipeline_);

  // The avatar: skinned vertices, in mirrors and in first person.
  const wgpu::VertexBufferLayout skinnedVertexLayout = engine::SkinnedMesh::vertexLayout();
  desc.label = "skinned (mirrored)";
  desc.layout = skinnedLayout;
  desc.vertex.entryPoint = "vs_skinned";
  desc.vertex.buffers = &skinnedVertexLayout;
  fragment.entryPoint = "fs_skinned";
  engine::pipelines::create(device, desc, &skinnedMirroredPipeline_);
  desc.label = "skinned";
  desc.primitive.frontFace = wgpu::FrontFace::CCW;
  engine::pipelines::create(device, desc, &skinnedPipeline_);

  // Loaded .glb models: textured with UVs; group 2 holds the material.
  modelLayout_ = engine::GpuModel::createLayout(device);
  wgpu::BindGroupLayout modelLayouts[] = {frameLayout_, objectLayout_, modelLayout_};
  layoutDesc.bindGroupLayouts = modelLayouts;
  // Two buffers: the model's vertices, and its copies (J87: one entry per
  // copy, stepped per instance; looped/shaders/scene.wgsl CopyIn).
  wgpu::VertexBufferLayout modelVertexLayouts[2] = {engine::GpuModel::vertexLayout(), {}};
  wgpu::VertexAttribute copyAttributes[6];
  for (uint32_t i = 0; i < 6; ++i) {
    copyAttributes[i].format = wgpu::VertexFormat::Float32x4;
    copyAttributes[i].offset = 16 * i;
    copyAttributes[i].shaderLocation = 4 + i;
  }
  modelVertexLayouts[1].stepMode = wgpu::VertexStepMode::Instance;
  modelVertexLayouts[1].arrayStride = kCopyBytes;
  modelVertexLayouts[1].attributeCount = 6;
  modelVertexLayouts[1].attributes = copyAttributes;
  desc.label = "model";
  desc.layout = device.CreatePipelineLayout(&layoutDesc);
  desc.vertex.entryPoint = "vs_model";
  desc.vertex.bufferCount = 2;
  desc.vertex.buffers = modelVertexLayouts;
  fragment.entryPoint = "fs_model";
  engine::pipelines::create(device, desc, &modelPipeline_);
  desc.label = "model (mirrored)";
  desc.primitive.frontFace = wgpu::FrontFace::CW;
  engine::pipelines::create(device, desc, &modelMirroredPipeline_);

  // See-through parts (glass): premultiplied alpha blending, tested against
  // the depth buffer but not written to it, drawn back to front.
  wgpu::BlendState blend;
  blend.color = {wgpu::BlendOperation::Add, wgpu::BlendFactor::One, wgpu::BlendFactor::OneMinusSrcAlpha};
  blend.alpha = {wgpu::BlendOperation::Add, wgpu::BlendFactor::One, wgpu::BlendFactor::OneMinusSrcAlpha};
  colorTarget.blend = &blend;
  depth.depthWriteEnabled = false;
  fragment.entryPoint = "fs_model_blend";
  desc.label = "model see-through (mirrored)";
  engine::pipelines::create(device, desc, &modelBlendMirroredPipeline_);
  desc.label = "model see-through";
  desc.primitive.frontFace = wgpu::FrontFace::CCW;
  engine::pipelines::create(device, desc, &modelBlendPipeline_);

  // Lamp shadows (J97): depth only, both faces (no winding to get wrong in
  // a cube face), pushed back a little so lit surfaces don't shadow themselves.
  {
    wgpu::DepthStencilState shadowDepth;
    shadowDepth.format = wgpu::TextureFormat::Depth16Unorm;
    shadowDepth.depthWriteEnabled = true;
    shadowDepth.depthCompare = wgpu::CompareFunction::Less;
    shadowDepth.depthBias = 4;
    shadowDepth.depthBiasSlopeScale = 2.0f;
    wgpu::RenderPipelineDescriptor sd = desc;
    sd.fragment = nullptr;
    sd.depthStencil = &shadowDepth;
    sd.primitive.cullMode = wgpu::CullMode::None;
    sd.label = "lamp shadows (models)";
    engine::pipelines::create(device, sd, &shadowModelPipeline_);
    sd.label = "lamp shadows (shapes)";
    sd.layout = layout;
    sd.vertex.entryPoint = "vs_main";
    sd.vertex.bufferCount = 1;
    sd.vertex.buffers = &vertexLayout;
    engine::pipelines::create(device, sd, &shadowObjectPipeline_);
  }
  // The soft shade's prepass (J91): the opaque scene's directions and depth
  // at half size (looped/ssao.h).
  {
    wgpu::DepthStencilState preDepth;
    preDepth.format = engine::ScreenAo::kDepthFormat;
    preDepth.depthWriteEnabled = true;
    preDepth.depthCompare = wgpu::CompareFunction::Less;
    wgpu::ColorTargetState preTarget;
    preTarget.format = engine::ScreenAo::kNormalFormat;
    wgpu::FragmentState preFragment;
    preFragment.module = module;
    preFragment.entryPoint = "fs_prepass_model";
    preFragment.targetCount = 1;
    preFragment.targets = &preTarget;
    wgpu::RenderPipelineDescriptor pd = desc;
    pd.fragment = &preFragment;
    pd.depthStencil = &preDepth;
    pd.primitive.cullMode = wgpu::CullMode::Back;
    pd.primitive.frontFace = wgpu::FrontFace::CCW;
    pd.label = "soft shade prepass (models)";
    engine::pipelines::create(device, pd, &aoModelPipeline_);
    preFragment.entryPoint = "fs_prepass";
    pd.label = "soft shade prepass (shapes)";
    pd.layout = layout;
    pd.vertex.entryPoint = "vs_main";
    pd.vertex.bufferCount = 1;
    pd.vertex.buffers = &vertexLayout;
    engine::pipelines::create(device, pd, &aoObjectPipeline_);
  }
  // Light beams (J91.2): a full-screen pass with the frame's bindings.
  {
    wgpu::ColorTargetState beamTarget;
    beamTarget.format = engine::LightBeams::kFormat;
    wgpu::FragmentState beamFragment;
    beamFragment.module = module;
    beamFragment.entryPoint = "fs_beams";
    beamFragment.targetCount = 1;
    beamFragment.targets = &beamTarget;
    wgpu::RenderPipelineDescriptor bd;
    bd.label = "light beams";
    bd.layout = engine::pipelines::pipelineLayout(device, frameLayout_);  // group 0 only
    bd.vertex.module = module;
    bd.vertex.entryPoint = "vs_screen";
    bd.fragment = &beamFragment;
    bd.primitive.topology = wgpu::PrimitiveTopology::TriangleList;
    engine::pipelines::create(device, bd, &beamsPipeline_);
  }

  wgpu::SamplerDescriptor samplerDesc;
  samplerDesc.addressModeU = samplerDesc.addressModeV = wgpu::AddressMode::Repeat;
  samplerDesc.magFilter = samplerDesc.minFilter = wgpu::FilterMode::Linear;
  samplerDesc.mipmapFilter = wgpu::MipmapFilterMode::Linear;
  samplerDesc.maxAnisotropy = 8;
  modelSampler_ = device.CreateSampler(&samplerDesc);
  return true;
}

bool SceneRenderer::createGlassPipeline() {
  const wgpu::Device& device = gpu_->device;
  wgpu::ShaderModule module = loadShader(device, "/shaders/mirror.wgsl");
  if (!module) return false;
  wgpu::ColorTargetState colorTarget;
  colorTarget.format = engine::Gpu::kSceneFormat;
  wgpu::FragmentState fragment;
  fragment.module = module;
  fragment.entryPoint = "fs_main";
  fragment.targetCount = 1;
  fragment.targets = &colorTarget;
  wgpu::DepthStencilState depth;
  depth.format = engine::Gpu::kDepthFormat;
  depth.depthWriteEnabled = true;
  depth.depthCompare = wgpu::CompareFunction::Less;
  wgpu::RenderPipelineDescriptor desc;
  desc.label = "mirror glass";
  {  // uniform + reflection texture + a filtering sampler (the texture is half size)
    wgpu::BindGroupLayoutEntry e[3];
    e[0].binding = 0;
    e[0].visibility = wgpu::ShaderStage::Vertex | wgpu::ShaderStage::Fragment;
    e[0].buffer.type = wgpu::BufferBindingType::Uniform;
    e[1].binding = 1;
    e[1].visibility = wgpu::ShaderStage::Fragment;
    e[1].texture.sampleType = wgpu::TextureSampleType::Float;
    e[2].binding = 2;
    e[2].visibility = wgpu::ShaderStage::Fragment;
    e[2].sampler.type = wgpu::SamplerBindingType::Filtering;
    wgpu::BindGroupLayoutDescriptor ld;
    ld.entryCount = 3;
    ld.entries = e;
    glassLayout_ = device.CreateBindGroupLayout(&ld);
    wgpu::SamplerDescriptor sd;
    sd.magFilter = sd.minFilter = wgpu::FilterMode::Linear;
    mirrorSampler_ = device.CreateSampler(&sd);
  }
  desc.layout = engine::pipelines::pipelineLayout(device, glassLayout_);
  desc.vertex.module = module;
  desc.vertex.entryPoint = "vs_main";
  desc.fragment = &fragment;
  desc.depthStencil = &depth;
  desc.primitive.topology = wgpu::PrimitiveTopology::TriangleList;
  desc.primitive.cullMode = wgpu::CullMode::None;
  engine::pipelines::create(device, desc, &glassPipeline_);
  return true;
}

// Makes the scene's surface textures and uploads them as two texture arrays
// (colors, bumps).
void SceneRenderer::createMaterials(const RenderScene& scene, wgpu::TextureView& colorMaps,
                                    wgpu::TextureView& bumpMaps, wgpu::Sampler& sampler) {
  const double start = engine::clockMs();
  std::vector<engine::Image> colors, bumps;
  for (engine::MaterialImages& m : scene.makeTextures ? scene.makeTextures() : std::vector<engine::MaterialImages>{}) {
    colors.push_back(std::move(m.color));
    bumps.push_back(std::move(m.bump));
  }
  if (colors.empty()) {  // a program with no surface textures (the place viewer): one plain layer
    engine::Image plain(4), flat(4);
    for (engine::Image::Pixel& p : plain.pixels) p = {1, 1, 1, 1};
    for (engine::Image::Pixel& p : flat.pixels) p = {0.5f, 0.5f, 1, 1};
    colors.push_back(std::move(plain));
    bumps.push_back(std::move(flat));
  }
  wgpu::TextureViewDescriptor viewDesc;
  viewDesc.dimension = wgpu::TextureViewDimension::e2DArray;
  colorMaps = engine::createTextureArray(gpu_->device, colors, true, "material colors").CreateView(&viewDesc);
  bumpMaps = engine::createTextureArray(gpu_->device, bumps, false, "material bumps").CreateView(&viewDesc);

  wgpu::SamplerDescriptor samplerDesc;
  samplerDesc.addressModeU = samplerDesc.addressModeV = wgpu::AddressMode::Repeat;
  samplerDesc.magFilter = samplerDesc.minFilter = wgpu::FilterMode::Linear;
  samplerDesc.mipmapFilter = wgpu::MipmapFilterMode::Linear;
  samplerDesc.maxAnisotropy = 4;  // keeps the floor sharp at shallow angles
  sampler = gpu_->device.CreateSampler(&samplerDesc);
  LOG_INFO("Textures: %zu materials generated in %.0f ms.", colors.size(), engine::clockMs() - start);
}

void SceneRenderer::setGlow(size_t firstObject, size_t objectCount, size_t firstModel, size_t modelCount,
                            float glow) {
  for (size_t i = firstObject; i < firstObject + objectCount && i < objectUniforms_.size(); ++i) {
    ObjectUniforms u = objectUniforms_[i];
    u.material[0] += glow;
    gpu_->queue.WriteBuffer(objectBuffer_, i * kObjectStride, &u, sizeof(u));
  }
  for (size_t i = firstModel; i < firstModel + modelCount && i < models_.size(); ++i) {
    modelHighlight_[i] = glow;
    writeModelGlow(i);
  }
}

void SceneRenderer::setLightScale(size_t light, float scale) {
  if (light >= lightIntensity_.size()) return;
  lightScale_[light] = scale;
  // Many lights change every frame (loops): kept here and written in one go
  // at the next render (flushLights).
  const float intensity = lightIntensity_[light] * scale;
  if (gpuLights_[light].color[3] == intensity) return;
  gpuLights_[light].color[3] = intensity;
  lightsDirtyFrom_ = std::min(lightsDirtyFrom_, light);
  lightsDirtyTo_ = std::max(lightsDirtyTo_, light + 1);
}

void SceneRenderer::setLight(size_t light, const PointLight& p) {
  if (light >= lightIntensity_.size()) return;
  lights_[light].color = p.color;
  lights_[light].intensity = p.intensity;
  lights_[light].range = p.range;
  lights_[light].radius = p.radius;
  lights_[light].lumens = p.lumens;
  lights_[light].kelvin = p.kelvin;
  lights_[light].position = p.position;
  lights_[light].shape = p.shape;
  lights_[light].axis = p.axis;
  lights_[light].axis2 = p.axis2;
  GpuLight g = gpuLightOf(lights_[light], 1.0f);
  lightIntensity_[light] = g.color[3];
  g.color[3] *= lightScale_[light];
  // Its reach stays as the grid has it (a bigger one would need the grid rebuilt).
  g.position[3] = std::min(g.position[3], gpuLights_[light].position[3]);
  g.params[1] = gpuLights_[light].params[1];  // its shadow map, if it has one (J97)
  gpuLights_[light] = g;
  lightsDirtyFrom_ = std::min(lightsDirtyFrom_, light);
  lightsDirtyTo_ = std::max(lightsDirtyTo_, light + 1);
}

void SceneRenderer::flushLights() {
  if (lightsDirtyFrom_ >= lightsDirtyTo_) return;
  gpu_->queue.WriteBuffer(lightingBuffer_, offsetof(LightingUniforms, lights) + lightsDirtyFrom_ * sizeof(GpuLight),
                          &gpuLights_[lightsDirtyFrom_], (lightsDirtyTo_ - lightsDirtyFrom_) * sizeof(GpuLight));
  lightsDirtyFrom_ = SIZE_MAX;
  lightsDirtyTo_ = 0;
}

void SceneRenderer::setModelBaseGlow(size_t model, float glow) {
  if (model >= models_.size()) return;
  modelBaseGlow_[model] = glow;
  writeModelGlow(model);
}

// Models: only the glow (material.x) changes; their other values are zero.
void SceneRenderer::writeModelGlow(size_t i) {
  const float material[4] = {modelBaseGlow_[i] + modelHighlight_[i], 0, 0, 0};
  std::memcpy(modelSlot(i) + offsetof(ObjectUniforms, material), material, sizeof(material));
}

void SceneRenderer::setModelLook(size_t i, float glow, Vec3 tint) {
  if (i >= models_.size()) return;
  float color[4];
  setVec4(color, tint, std::max(0.0f, glow));
  float* now = reinterpret_cast<float*>(modelSlot(i) + offsetof(ObjectUniforms, color));
  if (std::memcmp(now, color, sizeof(color)) == 0) return;
  std::memcpy(now, color, sizeof(color));
}

size_t SceneRenderer::reserveCopies(size_t copies) const {
  if (instanceCursor_ + copies > instanceCapacity_) {
    // Too small for this frame: a bigger buffer for the rest of it (passes
    // already recorded keep the old one alive until they've run).
    size_t capacity = std::max<size_t>(1024, instanceCapacity_);
    while (capacity < copies * 2) capacity *= 2;
    if (instanceCapacity_ > 0) capacity = std::max(capacity, instanceCapacity_ * 2);
    wgpu::BufferDescriptor d;
    d.label = "model copies";
    d.size = capacity * kCopyBytes;
    d.usage = wgpu::BufferUsage::Vertex | wgpu::BufferUsage::CopyDst;
    instanceBuffer_ = gpu_->device.CreateBuffer(&d);
    instanceCapacity_ = capacity;
    instanceCursor_ = 0;
    LOG_INFO("Model copies: room for %zu per frame.", capacity);
  }
  const size_t at = instanceCursor_ * kCopyBytes;
  instanceCursor_ += copies;
  return at;
}

// Reflection textures match the screen, so the glass can read them 1:1.
// Reflections render at half the screen's resolution (a quarter of the
// pixels); the glass shows them filtered.
void SceneRenderer::resizeMirrorTargets() {
  if (targetW_ == gpu_->width && targetH_ == gpu_->height) return;
  targetW_ = gpu_->width;
  targetH_ = gpu_->height;
  // Screen-sized: up close a mirror renders at full resolution; farther
  // away only part of the texture is used (renderMirror's scale).
  mirrorW_ = std::max(1u, targetW_);
  mirrorH_ = std::max(1u, targetH_);
  {
    wgpu::TextureDescriptor dd;
    dd.label = "mirror depth";
    dd.size = {mirrorW_, mirrorH_, 1};
    dd.format = engine::Gpu::kDepthFormat;
    dd.usage = wgpu::TextureUsage::RenderAttachment;
    mirrorDepth_ = gpu_->device.CreateTexture(&dd);
    mirrorDepthView_ = mirrorDepth_.CreateView();
  }
  for (MirrorTarget& m : mirrorTargets_) {
    wgpu::TextureDescriptor desc;
    desc.label = "mirror reflection";
    desc.size = {mirrorW_, mirrorH_, 1};
    desc.format = engine::Gpu::kSceneFormat;
    desc.usage = wgpu::TextureUsage::RenderAttachment | wgpu::TextureUsage::TextureBinding;
    m.texture = gpu_->device.CreateTexture(&desc);
    m.view = m.texture.CreateView();
    wgpu::BindGroupEntry entries[3];
    entries[0].binding = 0;
    entries[0].buffer = m.glassBuffer;
    entries[0].size = sizeof(GlassUniforms);
    entries[1].binding = 1;
    entries[1].textureView = m.view;
    entries[2].binding = 2;
    entries[2].sampler = mirrorSampler_;
    wgpu::BindGroupDescriptor bg;
    bg.layout = glassLayout_;
    bg.entryCount = 3;
    bg.entries = entries;
    m.glassBindGroup = gpu_->device.CreateBindGroup(&bg);
  }
}

void SceneRenderer::drawItems(const wgpu::RenderPassEncoder& pass, const std::vector<DrawItem>& items,
                              const RoomView& view) const {
  for (const DrawItem& d : items) {
    if (!seen(view, d.bounds, d.room)) continue;
    pass.SetBindGroup(1, objectBindGroup_, 1, &d.uniformOffset);
    pass.SetVertexBuffer(0, d.mesh.vertexBuffer);
    pass.SetIndexBuffer(d.mesh.indexBuffer, wgpu::IndexFormat::Uint32);
    pass.DrawIndexed(d.mesh.indexCount);
    engine::prof::draw(d.mesh.indexCount);
  }
}

// A model's file on the site: "x.glb" → its compressed-texture twin
// "x.astc.glb" (made by the build, tools/assets/astc_pack.py) on GPUs that
// read ASTC, else the original. Both gzipped.
static std::string modelUrl(const std::string& file, bool astc) {
  if (astc && file.size() > 4 && file.compare(file.size() - 4, 4, ".glb") == 0) {
    return "assets/models/" + file.substr(0, file.size() - 4) + ".astc.glb.gz";
  }
  return "assets/models/" + file + ".gz";
}

// Each placement gets an object slot (its position/rotation/scale) right
// away; the model itself streams in and is drawn once it's ready. Each file
// is downloaded once, however many times it's placed.
void SceneRenderer::loadModels(const RenderScene& scene) {
  modelData_.assign(std::min(scene.models.size(), kMaxModels) * kObjectStride, 0);
  std::vector<std::string> files;
  std::vector<std::vector<size_t>> users;
  for (size_t i = 0; i < scene.models.size() && i < kMaxModels; ++i) {
    const PlacedModel& p = scene.models[i];
    ObjectUniforms u = {};
    u.model = modelMatrix(p.position, p.rotation, p.scale);
    models_.push_back({nullptr, p.position, p.scale, u.model, -1, {}});
    modelFile_.push_back(p.file);
    modelStill_.push_back(p.still);
    setVec4(u.color, {1, 1, 1}, 1);  // models: rgb tints the colour, a scales their own glow
    std::memcpy(modelSlot(i), &u, sizeof(u));
    const auto it = std::find(files.begin(), files.end(), p.file);
    if (it == files.end()) {
      files.push_back(p.file);
      users.push_back({i});
    } else {
      users[static_cast<size_t>(it - files.begin())].push_back(i);
    }
  }
  if (scene.models.size() > kMaxModels) LOG_ERROR("Too many models; only %zu used", kMaxModels);
  modelBaseGlow_.assign(models_.size(), 0.0f);
  modelHighlight_.assign(models_.size(), 0.0f);
  roomsCheckedAt_.clear();
  for (const ModelDraw& m : models_) roomsCheckedAt_.push_back(m.position);
  fileNames_ = files;
  fileUsers_ = users;
  fileCritical_.assign(files.size(), false);
  for (size_t f = 0; f < files.size(); ++f) {
    for (size_t i : users[f]) fileCritical_[f] = fileCritical_[f] || scene.models[i].critical;
  }
  // Files used only in a room other than where you start wait until you come
  // near it (streamRooms); the rest load now, in placement order, so the
  // room shell (placed first) arrives first.
  const int spawnRoom = roomAt(scene.spawnPosition);
  for (size_t f = 0; f < files.size(); ++f) {
    int room = scene.models[users[f][0]].room;
    for (size_t i : users[f]) {
      if (scene.models[i].room != room) room = -1;
    }
    if (room < 0 || room == spawnRoom) continue;
    auto it = std::find_if(streamRooms_.begin(), streamRooms_.end(), [room](const StreamRoom& r) { return r.room == room; });
    if (it == streamRooms_.end()) it = streamRooms_.insert(streamRooms_.end(), StreamRoom{room, {}});
    it->files.push_back(f);
  }
  fileSlot_.assign(files.size(), 0);
  for (const StreamRoom& r : streamRooms_) {
    for (size_t f : r.files) fileSlot_[f] = -1;
  }
  int slots = 0;
  for (int& slot : fileSlot_) slot = slot < 0 ? -1 : slots++;
  fileProgress_.assign(static_cast<size_t>(slots), 0.0f);
  for (size_t f = 0; f < files.size(); ++f) {
    if (fileSlot_[f] >= 0) requestFile(f, true);
  }
}

void SceneRenderer::requestFile(size_t f, bool atStart) {
  const int slot = fileSlot_[f];
  engine::GpuModel::load(
      gpu_->device, modelLayout_, modelSampler_, modelUrl(fileNames_[f], gpu_->astc),
      [this, f, slot, atStart](std::shared_ptr<engine::GpuModel> model) {
        if (atStart) {
          fileProgress_[static_cast<size_t>(slot)] = 1.0f;
          ++filesDone_;
          if (!model) ++filesFailed_;
        } else {
          for (StreamRoom& r : streamRooms_) {
            if (std::count(r.files.begin(), r.files.end(), f) && ++r.done == r.files.size()) {
              LOG_INFO("Room %d streamed in (%zu model files).", r.room, r.files.size());
            }
          }
        }
        if (!model) {
          // E.g. the room shell: without it there's nothing to enter.
          if (atStart && fileCritical_[f]) criticalFailed_ = true;
          return;
        }
        for (size_t i : fileUsers_[f]) {
          models_[i].gpu = model;
          assignRooms(models_[i]);
        }
        applyAlbedo(f);
        modelsLoaded_ += fileUsers_[f].size();
      },
      // Downloading is most of the wait; decoding textures is the rest.
      [this, slot, atStart](float fraction) {
        if (atStart) fileProgress_[static_cast<size_t>(slot)] = std::max(fileProgress_[static_cast<size_t>(slot)], 0.85f * fraction);
      },
      gpu_->astc ? modelUrl(fileNames_[f], false) : "");
}

void SceneRenderer::applyAlbedo(size_t f) {
  if (!albedo_.loaded() || f >= fileUsers_.size() || fileUsers_[f].empty()) return;
  const std::shared_ptr<engine::GpuModel>& m = models_[fileUsers_[f][0]].gpu;
  if (!m) return;
  for (size_t k = 0; k < m->materialNames.size(); ++k) {
    m->setRealFix(gpu_->queue, k, albedo_.fix(fileNames_[f], m->materialNames[k]),
                  roughFix_ ? albedo_.leastRough(fileNames_[f], m->materialNames[k]) : 0.0f);
  }
}

void SceneRenderer::remakeViews() {
  for (size_t i = 0; i < views_.size(); ++i)
    views_[i] = makeView(views_[i].env, "frame uniforms", views_[i].buffer, false, i == 0);
  for (View& v : captureViews_) v = makeView(v.env, "capture frame uniforms", v.buffer);
  for (View& v : shadowViews_) v = makeView(v.env, "lamp shadow frame uniforms", v.buffer, true);
}

namespace {
std::vector<engine::GiLight> giLamps(const std::vector<PointLight>& lights) {
  std::vector<engine::GiLight> out;
  for (const PointLight& l : lights) out.push_back({l.position, l.radius});
  return out;
}
}  // namespace

void SceneRenderer::buildGi() {
  auto geo = std::make_shared<engine::SceneGeometry>();
  size_t used = 0;
  for (size_t i = 0; i < models_.size(); ++i) {
    const ModelDraw& m = models_[i];
    if (!m.gpu || !m.gpu->cpu || !modelStill_[i]) continue;
    geo->add(*m.gpu->cpu, m.world, modelFile_[i], albedo_, static_cast<uint32_t>(i));
    ++used;
  }
  const size_t full = geo->triangleCount();
  geo->simplify(0.05f);
  engine::GiSettings settings;
  // Glowing things that already have a lamp (a bulb's glass, the jukebox's
  // front, neon with a light) don't glow into the bounced light too: their
  // light is the lamp's (it would count twice).
  for (const PointLight& l : lights_) {
    const Vec3 e{std::fabs(l.axis.x) + std::fabs(l.axis2.x), std::fabs(l.axis.y) + std::fabs(l.axis2.y),
                 std::fabs(l.axis.z) + std::fabs(l.axis2.z)};
    const Vec3 r = e + Vec3{1, 1, 1} * (l.radius + 0.12f);
    settings.lampBoxes.push_back({l.position - r, l.position + r});
  }
  if (giLite_ || gpu_->software) {
    settings.surfelSpacing = 0.35f;
    settings.surfelRays = 12;
    settings.probeRays = 24;
  }
  settings.volume = engine::Aabb::empty();
  for (const engine::Aabb& r : rooms_) {
    settings.volume.min = engine::minComponents(settings.volume.min, r.min);
    settings.volume.max = engine::maxComponents(settings.volume.max, r.max);
  }
  if (rooms_.empty() || geo->triangleCount() == 0) return;
  LOG_INFO("Bounced light: building for %zu still models (%zu → %zu triangles).", used, full, geo->triangleCount());
  gi_.build(std::move(geo), giLamps(lights_), settings);
}

void SceneRenderer::relightGi() { gi_.relight(giLamps(lights_)); }

void SceneRenderer::layoutChanged() { giDirtyMs_ = shadowDirtyMs_ = engine::clockMs(); }

void SceneRenderer::streamRooms(Vec3 eye, double nowMs) {
  if (streamStartMs_ < 0) streamStartMs_ = nowMs;
  const bool idle = nowMs - streamStartMs_ > kStreamIdleMs;
  for (StreamRoom& r : streamRooms_) {
    if (r.requested) continue;
    const engine::Aabb& box = rooms_[static_cast<size_t>(r.room)];
    const float dx = eye.x - std::clamp(eye.x, box.min.x, box.max.x);
    const float dz = eye.z - std::clamp(eye.z, box.min.z, box.max.z);
    const bool onScreen = static_cast<size_t>(r.room) < roomOnScreen_.size() && roomOnScreen_[static_cast<size_t>(r.room)];
    const bool near = dx * dx + dz * dz <= kStreamDistance * kStreamDistance;
    if (!idle && !near && !onScreen) continue;
    r.requested = true;
    LOG_INFO("Room %d: loading its %zu model files (%s).", r.room, r.files.size(),
             near ? "you're near" : onScreen ? "its doorway is in view" : "in the background");
    for (size_t f : r.files) requestFile(f, false);
  }
}

float SceneRenderer::loadProgress() const {
  if (fileProgress_.empty()) return 1.0f;
  float sum = 0;
  for (float p : fileProgress_) sum += p;
  return sum / static_cast<float>(fileProgress_.size());
}

void SceneRenderer::setModelTransform(size_t index, Vec3 position, engine::Quat rotation) {
  if (index >= models_.size()) return;
  setModelPose(index, modelMatrix(position, rotation, models_[index].scale));
}

bool SceneRenderer::modelBox(size_t index, engine::Aabb* out) const {
  if (index >= models_.size() || !models_[index].gpu) return false;
  const ModelDraw& m = models_[index];
  *out = engine::transformAabb(m.world, {m.gpu->boundsMin, m.gpu->boundsMax});
  return true;
}

void SceneRenderer::setModelPose(size_t index, const Mat4& world) {
  if (index >= models_.size()) return;
  ModelDraw& m = models_[index];
  if (std::memcmp(&m.world, &world, sizeof(Mat4)) == 0) return;
  m.world = world;
  m.position = {world.at(3, 0), world.at(3, 1), world.at(3, 2)};
  // It may have been carried into another room; loops only sway things a
  // little, so the rooms are worked out again only after a real move.
  if (m.gpu && engine::distance(m.position, roomsCheckedAt_[index]) > 0.2f) {
    assignRooms(m);
    roomsCheckedAt_[index] = m.position;
  }
  // Only the matrix (the start of ObjectUniforms) changes; it reaches the
  // GPU with the copy's next draw (J87).
  std::memcpy(modelSlot(index), &world, sizeof(Mat4));
}

int SceneRenderer::roomAt(Vec3 p) const {
  for (size_t i = 0; i < rooms_.size(); ++i) {
    if (rooms_[i].contains(p)) return static_cast<int>(i);
  }
  return -1;
}

int SceneRenderer::roomOf(const engine::Aabb& box) const {
  for (size_t i = 0; i < rooms_.size(); ++i) {
    const engine::Aabb& r = rooms_[i];
    if (box.min.x >= r.min.x && box.min.y >= r.min.y && box.min.z >= r.min.z && box.max.x <= r.max.x &&
        box.max.y <= r.max.y && box.max.z <= r.max.z) {
      return static_cast<int>(i);
    }
  }
  return -1;
}

void SceneRenderer::assignRooms(ModelDraw& m) const {
  m.room = roomOf(engine::transformAabb(m.world, {m.gpu->boundsMin, m.gpu->boundsMax}));
  m.clusterRoom.resize(m.gpu->parts.size());
  for (size_t p = 0; p < m.gpu->parts.size(); ++p) {
    const auto& clusters = m.gpu->parts[p].clusters;
    m.clusterRoom[p].resize(clusters.size());
    for (size_t c = 0; c < clusters.size(); ++c) {
      // Inside the model's room already, or check the chunk itself.
      m.clusterRoom[p][c] = static_cast<int8_t>(
          m.room >= 0 ? m.room : roomOf(engine::transformAabb(m.world, clusters[c].bounds)));
    }
  }
}

SceneRenderer::RoomView SceneRenderer::roomView(const Mat4& viewProj, int eyeRoom, float x0, float x1, float y0,
                                                float y1) const {
  RoomView v;
  v.all = engine::Frustum::fromViewProj(viewProj, x0, x1, y0, y1);
  v.room.assign(rooms_.size(), v.all);
  v.roomSeen.assign(rooms_.size(), eyeRoom < 0);  // between rooms: all of them
  if (eyeRoom < 0) return v;
  v.roomSeen[static_cast<size_t>(eyeRoom)] = true;
  for (const Doorway& d : doorways_) {
    if (d.a != eyeRoom && d.b != eyeRoom) continue;
    const auto other = static_cast<size_t>(d.a == eyeRoom ? d.b : d.a);
    // The doorway on screen: the other room shows only through it.
    float nx0 = 1, nx1 = -1, ny0 = 1, ny1 = -1;
    int behind = 0;
    for (const Vec3& c : d.corners) {
      const engine::Vec4 q = engine::transformPoint(viewProj, c);
      if (q.w <= 0.01f) {
        ++behind;
        continue;
      }
      nx0 = std::min(nx0, q.x / q.w);
      nx1 = std::max(nx1, q.x / q.w);
      ny0 = std::min(ny0, q.y / q.w);
      ny1 = std::max(ny1, q.y / q.w);
    }
    if (behind == 4) continue;  // the doorway is behind you
    if (behind > 0) {           // you're right at it: the whole view
      v.roomSeen[other] = true;
      continue;
    }
    nx0 = std::max(nx0, x0);
    nx1 = std::min(nx1, x1);
    ny0 = std::max(ny0, y0);
    ny1 = std::min(ny1, y1);
    if (nx0 >= nx1 || ny0 >= ny1) continue;  // off screen
    v.roomSeen[other] = true;
    v.room[other] = engine::Frustum::fromViewProj(viewProj, nx0, nx1, ny0, ny1);
  }
  return v;
}

// Solid parts in any order; see-through parts sorted farthest first so
// nearer glass blends over farther glass. Only chunks inside `view` are
// drawn; neighbouring visible chunks go out as one draw.
void SceneRenderer::drawModels(const wgpu::RenderPassEncoder& pass, bool blend, Vec3 eye, const RoomView& view,
                               float minSize, int skipModel, bool stillOnly) const {
  static_assert(offsetof(ObjectUniforms, material) + 16 == kCopyBytes, "a copy = matrix, colour, material");
  std::vector<const ModelDraw*> order;
  for (const ModelDraw& m : models_) {
    if (!m.gpu || (blend && !m.gpu->hasBlend)) continue;
    const auto mi = static_cast<size_t>(&m - models_.data());
    if (static_cast<int>(mi) == skipModel || (stillOnly && !modelStill_[mi])) continue;
    const engine::Aabb box = engine::transformAabb(m.world, {m.gpu->boundsMin, m.gpu->boundsMax});
    if (!seen(view, box, m.room)) continue;
    if (minSize > 0) {
      const Vec3 half = (box.max - box.min) * 0.5f;
      const Vec3 d = (box.min + box.max) * 0.5f - eye;
      if (engine::dot(half, half) < minSize * minSize * engine::dot(d, d)) continue;
    }
    order.push_back(&m);
  }
  if (order.empty()) return;
  if (blend) {
    std::sort(order.begin(), order.end(), [eye](const ModelDraw* a, const ModelDraw* b) {
      const Vec3 da = a->position - eye, db = b->position - eye;
      return engine::dot(da, da) > engine::dot(db, db);
    });
  }
  // What to draw, in order: a part of a model with its copies (one draw), or
  // runs of a chunked part's visible chunks (one copy). See-through parts go
  // one copy at a time, back to front.
  struct Run {
    uint32_t first, count;
  };
  struct Draw {
    const engine::GpuModel* gpu;
    size_t part;
    std::vector<size_t> copies;  // model indices
    std::vector<Run> runs;       // empty = the whole part
  };
  std::vector<Draw> draws;
  std::unordered_map<const engine::GpuModel::Part*, size_t> grouped;  // whole parts drawn together
  for (const ModelDraw* m : order) {
    const size_t index = static_cast<size_t>(m - models_.data());
    for (size_t pi = 0; pi < m->gpu->parts.size(); ++pi) {
      const engine::GpuModel::Part& part = m->gpu->parts[pi];
      if (part.blend != blend) continue;
      if (part.clusters.size() > 1 && !view.all.visible(engine::transformAabb(m->world, part.bounds))) continue;
      const std::vector<int8_t>* rooms = pi < m->clusterRoom.size() ? &m->clusterRoom[pi] : nullptr;
      if (part.clusters.size() == 1) {  // one chunk: the whole part, maybe together with other copies
        const engine::GpuModel::Cluster& c = part.clusters[0];
        const int room = rooms && !rooms->empty() ? (*rooms)[0] : -1;
        if (room != m->room && !seen(view, engine::transformAabb(m->world, c.bounds), room)) continue;
        const auto it = blend ? grouped.end() : grouped.find(&part);
        if (it != grouped.end()) {
          draws[it->second].copies.push_back(index);
        } else {
          if (!blend) grouped[&part] = draws.size();
          draws.push_back({m->gpu.get(), pi, {index}, {{c.firstIndex, c.indexCount}}});
        }
        continue;
      }
      // Chunked (the room shells): runs of visible chunks, this copy only.
      Draw d{m->gpu.get(), pi, {index}, {}};
      for (size_t ci = 0; ci < part.clusters.size(); ++ci) {
        const engine::GpuModel::Cluster& c = part.clusters[ci];
        const int room = rooms && ci < rooms->size() ? (*rooms)[ci] : -1;
        if (!seen(view, engine::transformAabb(m->world, c.bounds), room)) continue;
        if (!d.runs.empty() && d.runs.back().first + d.runs.back().count == c.firstIndex) d.runs.back().count += c.indexCount;
        else d.runs.push_back({c.firstIndex, c.indexCount});
      }
      if (!d.runs.empty()) draws.push_back(std::move(d));
    }
  }
  if (draws.empty()) return;
  // Every copy's data, in draw order, in one write at a fresh place.
  size_t copies = 0;
  for (const Draw& d : draws) copies += d.copies.size();
  const size_t base = reserveCopies(copies);
  instanceStaging_.resize(copies * kCopyBytes);
  size_t k = 0;
  for (const Draw& d : draws)
    for (size_t i : d.copies) std::memcpy(instanceStaging_.data() + kCopyBytes * k++, modelSlot(i), kCopyBytes);
  gpu_->queue.WriteBuffer(instanceBuffer_, base, instanceStaging_.data(), instanceStaging_.size());
  // The model pipelines keep the object group in their layout; nothing in it is read.
  const uint32_t noOffset = 0;
  pass.SetBindGroup(1, objectBindGroup_, 1, &noOffset);
  size_t at = base;
  for (const Draw& d : draws) {
    const engine::GpuModel::Part& part = d.gpu->parts[d.part];
    const auto count = static_cast<uint32_t>(d.copies.size());
    pass.SetBindGroup(2, d.gpu->bindGroups[part.material]);
    pass.SetVertexBuffer(0, part.vertexBuffer);
    pass.SetVertexBuffer(1, instanceBuffer_, at, count * kCopyBytes);
    pass.SetIndexBuffer(part.indexBuffer, wgpu::IndexFormat::Uint32);
    for (const Run& r : d.runs) {
      pass.DrawIndexed(r.count, count, r.first);
      engine::prof::draw(r.count * count);
    }
    at += count * kCopyBytes;
  }
}

void SceneRenderer::drawSkinned(const wgpu::RenderPassEncoder& pass, const engine::SkinnedMesh& mesh) const {
  pass.SetVertexBuffer(0, mesh.vertexBuffer);
  pass.SetIndexBuffer(mesh.indexBuffer, wgpu::IndexFormat::Uint32);
  pass.DrawIndexed(mesh.indexCount);
  engine::prof::draw(mesh.indexCount);
}

size_t SceneRenderer::addAvatarMesh(const engine::SkinnedMeshData& mesh) {
  avatarMeshes_.push_back(engine::SkinnedMesh::upload(gpu_->device, mesh));
  return avatarMeshes_.size() - 1;
}

void SceneRenderer::setAvatarMesh(size_t index, const engine::SkinnedMeshData& mesh) {
  if (index < avatarMeshes_.size()) avatarMeshes_[index] = engine::SkinnedMesh::upload(gpu_->device, mesh);
}

void SceneRenderer::drawAvatar(const wgpu::RenderPassEncoder& pass, const wgpu::BindGroup& bones) const {
  if (avatarMeshes_.empty()) return;
  pass.SetBindGroup(1, objectBindGroup_, 1, &avatarOffset_);
  pass.SetBindGroup(2, bones);
  drawSkinned(pass, avatarMeshes_[selfLook_]);
}

void SceneRenderer::setOthers(const std::vector<Mat4>& transforms, const std::vector<std::vector<Mat4>>& bones,
                              const std::vector<int>& looks) {
  othersShown_ = std::min({transforms.size(), bones.size(), others_.size()});
  for (size_t i = 0; i < othersShown_; ++i) {
    gpu_->queue.WriteBuffer(objectBuffer_, others_[i].offset, &transforms[i], sizeof(Mat4));
    const size_t count = std::min<size_t>(bones[i].size(), kMaxBones);
    if (count) gpu_->queue.WriteBuffer(others_[i].bonesBuffer, 0, bones[i].data(), count * sizeof(Mat4));
    const int look = i < looks.size() ? looks[i] : 0;
    others_[i].look = look >= 0 && static_cast<size_t>(look) < avatarMeshes_.size() ? look : 0;
    // Generous: arms out, emotes, a little scale.
    const Vec3 at{transforms[i].at(3, 0), transforms[i].at(3, 1), transforms[i].at(3, 2)};
    others_[i].bounds = {at - Vec3{1.0f, 0.4f, 1.0f}, at + Vec3{1.0f, 2.4f, 1.0f}};
  }
}

void SceneRenderer::drawOthers(const wgpu::RenderPassEncoder& pass, const RoomView& view) const {
  for (size_t i = 0; i < othersShown_ && !avatarMeshes_.empty(); ++i) {
    if (!view.all.visible(others_[i].bounds)) continue;
    pass.SetBindGroup(1, objectBindGroup_, 1, &others_[i].offset);
    pass.SetBindGroup(2, others_[i].bonesBindGroup);
    drawSkinned(pass, avatarMeshes_[static_cast<size_t>(others_[i].look)]);
  }
}

void SceneRenderer::setBoxes(const std::vector<Box>& boxes) {
  boxCount_ = std::min(boxes.size(), limits_.boxes);
  if (!boxCount_) return;
  static std::vector<uint8_t> data;
  data.assign(boxCount_ * kObjectStride, 0);
  for (size_t i = 0; i < boxCount_; ++i) {
    const Box& b = boxes[i];
    ObjectUniforms u = {};
    u.model = Mat4::transform(b.center, b.rotation);
    for (int r = 0; r < 3; ++r) {  // scale the unit cube to the box size
      u.model.at(0, r) *= b.size.x;
      u.model.at(1, r) *= b.size.y;
      u.model.at(2, r) *= b.size.z;
    }
    setVec4(u.color, b.color, b.metallic);
    u.material[0] = b.glow;
    u.material[1] = b.roughness;
    u.material[2] = -1;
    u.material[3] = 1;
    std::memcpy(data.data() + i * kObjectStride, &u, sizeof(u));
  }
  gpu_->queue.WriteBuffer(objectBuffer_, boxOffset_, data.data(), data.size());
}

void SceneRenderer::drawBoxes(const wgpu::RenderPassEncoder& pass) const {
  pass.SetVertexBuffer(0, boxMesh_.vertexBuffer);
  pass.SetIndexBuffer(boxMesh_.indexBuffer, wgpu::IndexFormat::Uint32);
  for (size_t i = 0; i < boxCount_; ++i) {
    const uint32_t offset = boxOffset_ + static_cast<uint32_t>(i * kObjectStride);
    pass.SetBindGroup(1, objectBindGroup_, 1, &offset);
    pass.DrawIndexed(boxMesh_.indexCount);
    engine::prof::draw(boxMesh_.indexCount);
  }
}

void SceneRenderer::renderMirror(const wgpu::CommandEncoder& encoder, size_t index, const Mirror& mirror,
                                 const Mat4& viewProj, Vec3 eye) {
  // Only when you're in front of the glass and it's on screen.
  if (!mirror.on || engine::dot(mirror.normal, eye - mirror.center) <= 0.01f) return;
  // How sharp: full resolution within about a metre of the glass, falling to
  // 40% from about 8 m (in 5% steps, so it doesn't flicker). The far
  // reflection costs much less; up close it's as sharp as the screen.
  float dist;
  {
    const Vec3 d = eye - mirror.center;
    const float u = std::clamp(engine::dot(d, mirror.right), -mirror.halfWidth, mirror.halfWidth);
    const float v = std::clamp(engine::dot(d, mirror.up), -mirror.halfHeight, mirror.halfHeight);
    dist = engine::length(d - mirror.right * u - mirror.up * v);
  }
  const bool simple = mirrorDetail_ >= 1;
  const float scale = std::round(std::clamp(1.1f - 0.085f * dist, 0.4f, simple ? 0.6f : 1.0f) * 20.0f) / 20.0f;
  mirrorTargets_[index].scale = scale;
  // The glass on screen: its corners clipped against the near plane (so a
  // mirror partly behind you still gets a tight box), in the reflection's pixels.
  const float W = static_cast<float>(mirrorW_) * scale, H = static_cast<float>(mirrorH_) * scale;
  Vec4 poly[8];
  int count = 0;
  {
    Vec4 quad[4];
    const float sx[4] = {-1, 1, 1, -1}, sy[4] = {-1, -1, 1, 1};
    for (int k = 0; k < 4; ++k) {
      quad[k] = engine::transformPoint(
          viewProj, mirror.center + mirror.right * (sx[k] * mirror.halfWidth) + mirror.up * (sy[k] * mirror.halfHeight));
    }
    constexpr float kNearW = 0.01f;
    for (int k = 0; k < 4; ++k) {
      const Vec4 a = quad[k], b = quad[(k + 1) % 4];
      const bool ina = a.w > kNearW, inb = b.w > kNearW;
      if (ina) poly[count++] = a;
      if (ina != inb) {
        const float t = (kNearW - a.w) / (b.w - a.w);
        poly[count++] = {a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t, kNearW};
      }
    }
  }
  if (count == 0) return;  // entirely behind you
  float minX = W, minY = H, maxX = 0, maxY = 0;
  for (int k = 0; k < count; ++k) {
    const float px = (poly[k].x / poly[k].w * 0.5f + 0.5f) * W, py = (0.5f - poly[k].y / poly[k].w * 0.5f) * H;
    minX = std::min(minX, px);
    maxX = std::max(maxX, px);
    minY = std::min(minY, py);
    maxY = std::max(maxY, py);
  }
  const auto x0 = static_cast<uint32_t>(std::clamp(std::floor(minX), 0.0f, W));
  const auto y0 = static_cast<uint32_t>(std::clamp(std::floor(minY), 0.0f, H));
  const auto x1 = static_cast<uint32_t>(std::clamp(std::ceil(maxX), 0.0f, W));
  const auto y1 = static_cast<uint32_t>(std::clamp(std::ceil(maxY), 0.0f, H));
  if (x1 <= x0 || y1 <= y0) return;  // off screen

  // The reflected camera: the world mirrored across the glass, viewed by you.
  FrameUniforms f = frame_;
  // The near plane is tilted onto the glass, so the GPU itself cuts away
  // everything behind the mirror (no per-pixel test in the shader).
  const float glassPlane[4] = {mirror.normal.x, mirror.normal.y, mirror.normal.z,
                               -engine::dot(mirror.normal, mirror.center)};
  f.viewProj = obliqueNearPlane(viewProj * Mat4::reflection(mirror.normal, mirror.center), glassPlane);
  const Vec4 mirroredEye = engine::transformPoint(Mat4::reflection(mirror.normal, mirror.center), eye);
  setVec4(f.cameraPos, {mirroredEye.x, mirroredEye.y, mirroredEye.z}, 1);
  setVec4(f.clipPlane, mirror.normal, -engine::dot(mirror.normal, mirror.center));
  const bool full = mirror.mode == MirrorMode::kFull;
  if (!full) {
    // Like a photo studio: avatars get extra even light on the plain backdrop.
    for (int c = 0; c < 3; ++c) f.ambient[c] = f.ambient[c] * 3.0f + 0.12f;
  }
  f.ambient[3] = kMirrorLights;  // a cheaper reflection: fewer lights per pixel
  const View& view = views_[1 + index];
  gpu_->queue.WriteBuffer(view.buffer, 0, &f, sizeof(f));

  wgpu::RenderPassColorAttachment color;
  color.view = mirrorTargets_[index].view;
  color.loadOp = wgpu::LoadOp::Clear;
  color.storeOp = wgpu::StoreOp::Store;
  color.clearValue = full ? kClearColor : kAvatarBackdrop;
  wgpu::RenderPassDepthStencilAttachment depth;
  depth.view = mirrorDepthView_;  // half resolution, like the reflection
  depth.depthLoadOp = wgpu::LoadOp::Clear;
  depth.depthStoreOp = wgpu::StoreOp::Discard;
  depth.depthClearValue = 1.0f;
  wgpu::RenderPassDescriptor passDesc;
  passDesc.colorAttachmentCount = 1;
  passDesc.colorAttachments = &color;
  passDesc.depthStencilAttachment = &depth;
  // Only what shows through the glass: the reflected camera's view, narrowed
  // to the glass's box on screen (its near plane is the glass itself).
  // Rooms: the reflection is seen from the mirror's own room.
  const RoomView cull = roomView(
      f.viewProj, roomAt(mirror.center + mirror.normal * 0.2f), 2.0f * static_cast<float>(x0) / W - 1.0f,
      2.0f * static_cast<float>(x1) / W - 1.0f, 1.0f - 2.0f * static_cast<float>(y1) / H,
      1.0f - 2.0f * static_cast<float>(y0) / H);
  // Props smaller than ~2% of their distance (a glass 5 m away) are left
  // out of the reflection: they'd be a few pixels.
  // Simple: anything under ~4% of its distance (a glass 2.5 m away, a stool 10 m).
  const float mirrorMinSize = simple ? 0.04f : 0.02f;
  wgpu::RenderPassEncoder pass = encoder.BeginRenderPass(&passDesc);
  pass.SetViewport(0, 0, W, H, 0, 1);
  pass.SetScissorRect(x0, y0, x1 - x0, y1 - y0);
  engine::prof::setPass(engine::prof::kMirror);
  pass.SetPipeline(mirroredPipeline_);
  pass.SetBindGroup(0, view.bindGroup);
  if (full) {
    drawItems(pass, sceneDraws_, cull);
    drawBoxes(pass);
    pass.SetPipeline(modelMirroredPipeline_);
    drawModels(pass, false, {mirroredEye.x, mirroredEye.y, mirroredEye.z}, cull, mirrorMinSize);
  }
  pass.SetPipeline(skinnedMirroredPipeline_);
  drawAvatar(pass, bonesBindGroup_);
  drawOthers(pass, cull);
  if (full) {
    pass.SetPipeline(modelBlendMirroredPipeline_);
    drawModels(pass, true, {mirroredEye.x, mirroredEye.y, mirroredEye.z}, cull, mirrorMinSize);
  }
  pass.End();
  engine::prof::setPass(engine::prof::kMain);
}

void SceneRenderer::renderOverlay(const wgpu::TextureView& target, const engine::TextRenderer& text) {
  wgpu::CommandEncoder encoder = gpu_->device.CreateCommandEncoder();
  wgpu::RenderPassColorAttachment color;
  color.view = target;
  color.loadOp = wgpu::LoadOp::Clear;
  color.storeOp = wgpu::StoreOp::Store;
  color.clearValue = kClearColor;
  wgpu::RenderPassDepthStencilAttachment depth;  // the text pipeline has a depth state
  depth.view = gpu_->depthView;
  depth.depthLoadOp = wgpu::LoadOp::Clear;
  depth.depthStoreOp = wgpu::StoreOp::Discard;
  depth.depthClearValue = 1.0f;
  wgpu::RenderPassDescriptor passDesc;
  passDesc.colorAttachmentCount = 1;
  passDesc.colorAttachments = &color;
  passDesc.depthStencilAttachment = &depth;
  wgpu::RenderPassEncoder pass = encoder.BeginRenderPass(&passDesc);
  text.draw(pass);
  pass.End();
  wgpu::CommandBuffer commands = encoder.Finish();
  gpu_->queue.Submit(1, &commands);
}

// ---- Lamp shadows (J97, docs/plan/jobs/J97.md) ----

void SceneRenderer::createShadows() {
  const wgpu::Device& device = gpu_->device;
  wgpu::TextureDescriptor t;
  t.label = "lamp shadows";
  t.size = {kShadowSize, kShadowSize, kShadowLamps * 6};
  t.format = wgpu::TextureFormat::Depth16Unorm;
  t.usage = wgpu::TextureUsage::RenderAttachment | wgpu::TextureUsage::TextureBinding;
  shadowTex_ = device.CreateTexture(&t);
  wgpu::TextureViewDescriptor v;
  v.dimension = wgpu::TextureViewDimension::CubeArray;
  v.arrayLayerCount = kShadowLamps * 6;
  shadowArrayView_ = shadowTex_.CreateView(&v);
  t.label = "no lamp shadows here";
  t.size = {1, 1, 6};
  t.usage = wgpu::TextureUsage::TextureBinding;
  shadowDummy_ = device.CreateTexture(&t);
  v.arrayLayerCount = 6;
  shadowDummyView_ = shadowDummy_.CreateView(&v);
  wgpu::SamplerDescriptor sd;
  sd.magFilter = sd.minFilter = wgpu::FilterMode::Linear;  // 2 x 2 compared and blended
  sd.addressModeU = sd.addressModeV = sd.addressModeW = wgpu::AddressMode::ClampToEdge;
  sd.compare = wgpu::CompareFunction::LessEqual;
  shadowSampler_ = device.CreateSampler(&sd);
}

void SceneRenderer::setLampShadows(bool on) {
  if (on == shadowsOn_) return;
  shadowsOn_ = on;
  applyShadowSlots();
}

// The brightest lamps get a map (up to kShadowLamps; since J113 enough for
// every lamp in the room, so none falls back to the probes' blocky test);
// drawing starts again from the first face.
void SceneRenderer::planShadows() {
  std::vector<size_t> order;
  for (size_t i = 0; i < lightIntensity_.size(); ++i)
    if (lightIntensity_[i] > 0 && !lights_[i].oneSided) order.push_back(i);  // a wall light needs none (J113)
  std::sort(order.begin(), order.end(), [&](size_t a, size_t b) { return lightIntensity_[a] > lightIntensity_[b]; });
  if (order.size() > kShadowLamps) order.resize(kShadowLamps);
  shadowSlot_.assign(lights_.size(), -1);
  shadowLight_.clear();
  for (size_t i : order) {
    shadowSlot_[i] = static_cast<int>(shadowLight_.size());
    shadowLight_.push_back(static_cast<int>(i));
  }
  shadowReady_.assign(shadowLight_.size(), false);
  shadowCursor_ = 0;
  applyShadowSlots();
  size_t onWalls = 0;
  for (const PointLight& p : lights_) onWalls += p.oneSided ? 1 : 0;
  LOG_INFO("Lamp shadows: the %zu brightest of %zu lamps (%zu on walls shine forward only, no map needed).",
           shadowLight_.size(), lights_.size(), onWalls);
}

void SceneRenderer::applyShadowSlots() {
  for (size_t i = 0; i < gpuLights_.size(); ++i) {
    const int slot = i < shadowSlot_.size() ? shadowSlot_[i] : -1;
    const bool use = shadowsOn_ && !classic_ && slot >= 0 && shadowReady_[static_cast<size_t>(slot)];
    const float v = use ? static_cast<float>(slot + 1) : 0.0f;
    if (gpuLights_[i].params[1] == v) continue;
    gpuLights_[i].params[1] = v;
    lightsDirtyFrom_ = std::min(lightsDirtyFrom_, i);
    lightsDirtyTo_ = std::max(lightsDirtyTo_, i + 1);
  }
}

// A few cube faces a frame: each lamp's view of the still things around it
// (its own model left out), 90 degrees a face, oriented as cube maps are
// read (as the reflection capture does).
void SceneRenderer::drawShadowFaces(const wgpu::CommandEncoder& encoder) {
  static const Vec3 kForward[6] = {{1, 0, 0}, {-1, 0, 0}, {0, 1, 0}, {0, -1, 0}, {0, 0, 1}, {0, 0, -1}};
  static const Vec3 kUp[6] = {{0, 1, 0}, {0, 1, 0}, {0, 0, -1}, {0, 0, 1}, {0, 1, 0}, {0, 1, 0}};
  Mat4 flip;
  flip.at(0, 0) = -1;
  const Mat4 proj = flip * Mat4::perspective(engine::kPi / 2, 1, kShadowNear, kShadowFar);
  const size_t total = shadowLight_.size() * 6;
  for (uint32_t k = 0; k < kShadowFacesPerFrame && shadowCursor_ < total; ++k, ++shadowCursor_) {
    const size_t slot = shadowCursor_ / 6, face = shadowCursor_ % 6;
    const auto light = static_cast<size_t>(shadowLight_[slot]);
    const Vec3 at = lights_[light].position;
    FrameUniforms f = frame_;
    f.viewProj = proj * Mat4::lookAt(at, at + kForward[face], kUp[face]);
    setVec4(f.cameraPos, at, 1);
    gpu_->queue.WriteBuffer(shadowViews_[k].buffer, 0, &f, sizeof(f));
    wgpu::TextureViewDescriptor one;
    one.dimension = wgpu::TextureViewDimension::e2D;
    one.baseArrayLayer = static_cast<uint32_t>(slot * 6 + face);
    one.arrayLayerCount = 1;
    wgpu::RenderPassDepthStencilAttachment depth;
    depth.view = shadowTex_.CreateView(&one);
    depth.depthLoadOp = wgpu::LoadOp::Clear;
    depth.depthStoreOp = wgpu::StoreOp::Store;
    depth.depthClearValue = 1.0f;
    wgpu::RenderPassDescriptor pd;
    pd.label = "lamp shadow";
    pd.colorAttachmentCount = 0;  // no default in webgpu_cpp.h: left alone it's whatever was in memory
    pd.depthStencilAttachment = &depth;
    const RoomView cull = roomView(f.viewProj, roomAt(at));
    wgpu::RenderPassEncoder pass = encoder.BeginRenderPass(&pd);
    pass.SetPipeline(shadowObjectPipeline_);
    pass.SetBindGroup(0, shadowViews_[k].bindGroup);
    drawItems(pass, sceneDraws_, cull);
    pass.SetPipeline(shadowModelPipeline_);
    drawModels(pass, false, at, cull, 0, lights_[light].model, true);
    pass.End();
    if (face == 5) {
      shadowReady_[slot] = true;
      applyShadowSlots();
      if (slot + 1 == shadowLight_.size()) LOG_INFO("Lamp shadows: ready.");
    }
  }
}

void SceneRenderer::setSoftShade(bool on) { aoOn_ = on; }  // render() rebinds views_[0]

// Soft shade (J91; also what the light beams need): the solid things' depth and surface directions at half
// size, then the shade from them (looped/ssao.h). A new size remakes the
// main view's bindings (they hold the old textures).
void SceneRenderer::drawSoftShade(const wgpu::CommandEncoder& encoder, const Mat4& viewProj, Vec3 eye,
                                  const RoomView& cull, float strength) {
  if (ssao_.resize(static_cast<uint32_t>(gpu_->width), static_cast<uint32_t>(gpu_->height)) && aoBound_)
    views_[0] = makeView(views_[0].env, "frame uniforms", views_[0].buffer, false, true);
  wgpu::RenderPassColorAttachment color;
  color.view = ssao_.normalView();
  color.loadOp = wgpu::LoadOp::Clear;
  color.storeOp = wgpu::StoreOp::Store;
  color.clearValue = {0.5, 0.5, 1.0, 1.0};
  wgpu::RenderPassDepthStencilAttachment depth;
  depth.view = ssao_.depthView();
  depth.depthLoadOp = wgpu::LoadOp::Clear;
  depth.depthStoreOp = wgpu::StoreOp::Store;
  depth.depthClearValue = 1.0f;
  wgpu::RenderPassDescriptor pd;
  pd.label = "soft shade prepass";
  pd.colorAttachmentCount = 1;
  pd.colorAttachments = &color;
  pd.depthStencilAttachment = &depth;
  wgpu::RenderPassEncoder pass = encoder.BeginRenderPass(&pd);
  pass.SetPipeline(aoObjectPipeline_);
  pass.SetBindGroup(0, views_[0].bindGroup);
  drawItems(pass, sceneDraws_, cull);
  pass.SetPipeline(aoModelPipeline_);
  drawModels(pass, false, eye, cull);
  pass.End();
  ssao_.encode(encoder, viewProj, eye, kSoftShadeRadius, strength);
}

void SceneRenderer::render(const wgpu::TextureView& target, const Mat4& viewProj, Vec3 eye, const Mat4& avatar,
                           const std::vector<Mat4>& avatarBones, const std::vector<Mat4>& firstPersonBones,
                           const std::vector<Mirror>& mirrors, const engine::TextRenderer& text,
                           const engine::PictureBillboards& pictures) {
  const wgpu::Queue& queue = gpu_->queue;
  resizeMirrorTargets();
  flushLights();
  instanceCursor_ = 0;  // this frame's model copies start again at the front

  // The avatar follows you. Only its model matrix changes (it comes first in
  // ObjectUniforms), plus the bone matrices for its pose.
  queue.WriteBuffer(objectBuffer_, avatarOffset_, &avatar, sizeof(avatar));
  const size_t boneCount = std::min<size_t>(avatarBones.size(), kMaxBones);
  if (boneCount) queue.WriteBuffer(bonesBuffer_, 0, avatarBones.data(), boneCount * sizeof(Mat4));
  const size_t fpCount = std::min<size_t>(firstPersonBones.size(), kMaxBones);
  if (fpCount) queue.WriteBuffer(firstPersonBonesBuffer_, 0, firstPersonBones.data(), fpCount * sizeof(Mat4));

  frame_.clock[0] = static_cast<float>(std::fmod(engine::clockMs() / 1000.0, 3600.0));
  frame_.env[0] = 0;
  frame_.env[1] = envReady_ ? 1.0f : 0.0f;
  frame_.env[2] = static_cast<float>(kEnvLevels - 1);
  frame_.env[3] = testLight_ ? 2.0f : classic_ ? 1.0f : 0.0f;  // 2: test lighting (scene.wgsl)
  frame_.units[0] = emissiveNits_;
  frame_.units[1] = ambientNits_;
  frame_.units[2] = 1.0f / engine::kPi;
  frame_.units[3] = static_cast<float>(giView_);
  frame_.ambient[3] = static_cast<float>(lightsPerPixel_);
  const bool giLive = !classic_ && giOn_ && gi_.ready();
  setVec4(frame_.gi, gi_.origin(), 1.0f / gi_.spacing());
  frame_.gi2[0] = static_cast<float>(gi_.dims(0));
  frame_.gi2[1] = static_cast<float>(gi_.dims(1));
  frame_.gi2[2] = static_cast<float>(gi_.dims(2));
  frame_.gi2[3] = giLive ? gi_.fill() : 0.0f;
  setVec4(frame_.envMin, envRoom_.min, 0);
  setVec4(frame_.envMax, envRoom_.max, 0);
  setVec4(frame_.envCenter, envCenter_, 1);
  FrameUniforms f = frame_;
  f.viewProj = viewProj;
  setVec4(f.cameraPos, eye, 1);
  setVec4(f.clipPlane, {0, 0, 0}, 1);  // keep everything
  f.invViewProj = inverse(viewProj);
  f.beams[0] = beamsOn_ ? beamHaze_ * beamScale_ : 0.0f;
  f.beams[1] = static_cast<float>(beamSteps_);
  f.beams[2] = kBeamReach;
  f.beams[3] = static_cast<float>(beamFrame_++ % 64);
  queue.WriteBuffer(views_[0].buffer, 0, &f, sizeof(f));

  wgpu::CommandEncoder encoder = gpu_->device.CreateCommandEncoder();
  if (!classic_ && giOn_) {
    // (Re)build when the place has loaded, more rooms came in, or the layout changed.
    const double now = engine::clockMs();
    if (giWanted_ && !gi_.building() && engine::pendingJobs() == 0 &&
        (modelsLoaded_ != giModelsAtBuild_ || (giDirtyMs_ > 0 && now - giDirtyMs_ > 1500))) {
      giModelsAtBuild_ = modelsLoaded_;
      giDirtyMs_ = -1;
      buildGi();
    }
    // (A software GPU refreshes the bounced light every 8th frame: tests stay fast.)
    if (!gpu_->software || (++giFrame_ & 7) == 0 || gi_.building()) {
      gi_.encode(encoder, engine::clockMs(), emissiveNits_, bounceStrength_);
    }
    if (gi_.changed()) {
      remakeViews();
      if (envReady_) capturePending_ = true;  // reflections with the bounced light
    }
  }
  if (capturePending_ && mirroredPipeline_ && modelMirroredPipeline_ && modelBlendMirroredPipeline_ &&
      engine::mipmapsReady(gpu_->device, engine::Gpu::kSceneFormat)) {
    capturePending_ = false;
    captureEnvironment(encoder);
  }
  // Lamp shadows (J97): planned once everything has loaded (again when more
  // rooms load or the Studio moved things), then drawn a few faces a frame.
  if (shadowsOn_ && !classic_ && shadowModelPipeline_ && shadowObjectPipeline_) {
    const double now = engine::clockMs();
    const bool loaded = filesDone_ >= fileProgress_.size() && engine::pendingJobs() == 0 && modelsLoaded_ > 0;
    if (loaded && (shadowReplan_ || modelsLoaded_ != shadowModels_ || (shadowDirtyMs_ > 0 && now - shadowDirtyMs_ > 1500))) {
      shadowReplan_ = false;
      shadowModels_ = modelsLoaded_;
      shadowDirtyMs_ = -1;
      planShadows();
    }
    if (shadowCursor_ < shadowLight_.size() * 6) drawShadowFaces(encoder);
  }
  for (size_t i = 0; i < mirrorCount_ && i < mirrors.size(); ++i) renderMirror(encoder, i, mirrors[i], viewProj, eye);

  const RoomView cull = roomView(viewProj, roomAt(eye));
  // Soft shade and light beams (J91): off with classic light and the tests'
  // light. The beams need the prepass too (how far each pixel's first solid
  // thing is); without the shade it runs at strength 0.
  const bool lit = !classic_ && !testLight_ && post_.ready() && ssao_.ready() && aoModelPipeline_ && aoObjectPipeline_;
  const bool beamsWanted = lit && beamsOn_ && beamHaze_ * beamScale_ > 0 && beams_.ready() && beamsPipeline_;
  const bool prepass = lit && (aoOn_ || beamsWanted);
  if (prepass) drawSoftShade(encoder, viewProj, eye, cull, aoOn_ ? kSoftShadeStrength : 0.0f);
  if (prepass != aoBound_) {
    aoBound_ = prepass;
    views_[0] = makeView(views_[0].env, "frame uniforms", views_[0].buffer, false, true);
  }
  if (beamsWanted) {
    beams_.resize(ssao_.width(), ssao_.height());
    wgpu::RenderPassColorAttachment beamColor;
    beamColor.view = beams_.target();
    beamColor.loadOp = wgpu::LoadOp::Clear;
    beamColor.storeOp = wgpu::StoreOp::Store;
    beamColor.clearValue = {0, 0, 0, 1};
    wgpu::RenderPassDescriptor bd;
    bd.label = "light beams";
    bd.colorAttachmentCount = 1;
    bd.colorAttachments = &beamColor;
    wgpu::RenderPassEncoder beamPass = encoder.BeginRenderPass(&bd);
    beamPass.SetPipeline(beamsPipeline_);
    beamPass.SetBindGroup(0, views_[0].bindGroup);
    beamPass.Draw(3);
    engine::prof::draw(3);
    beamPass.End();
  }

  // The scene draws offscreen as linear light; eyes and mood follow
  // (looped/post.h). Its depth is kept for the name pictures on top.
  if (!post_.ready()) {  // the first frames, while the post pipelines compile: nothing to show yet
    wgpu::CommandBuffer commands = encoder.Finish();
    queue.Submit(1, &commands);
    return;
  }
  wgpu::RenderPassColorAttachment color;
  color.view = post_.sceneTarget();
  color.loadOp = wgpu::LoadOp::Clear;
  color.storeOp = wgpu::StoreOp::Store;
  color.clearValue = kClearColor;
  wgpu::RenderPassDepthStencilAttachment depth;
  depth.view = gpu_->depthView;
  depth.depthLoadOp = wgpu::LoadOp::Clear;
  depth.depthStoreOp = wgpu::StoreOp::Store;
  depth.depthClearValue = 1.0f;
  wgpu::RenderPassDescriptor passDesc;
  passDesc.colorAttachmentCount = 1;
  passDesc.colorAttachments = &color;
  passDesc.depthStencilAttachment = &depth;
  wgpu::RenderPassEncoder pass = encoder.BeginRenderPass(&passDesc);
  pass.SetPipeline(pipeline_);
  pass.SetBindGroup(0, views_[0].bindGroup);
  roomOnScreen_ = cull.roomSeen;  // streamRooms: a room you can see into loads now
  drawItems(pass, sceneDraws_, cull);
  drawBoxes(pass);
  pass.SetPipeline(modelPipeline_);
  drawModels(pass, false, eye, cull);
  pass.SetPipeline(skinnedPipeline_);
  drawAvatar(pass, selfWhole_ ? bonesBindGroup_ : firstPersonBonesBindGroup_);  // your body, minus the head (in first person)
  drawOthers(pass, cull);
  pass.SetPipeline(modelBlendPipeline_);
  drawModels(pass, true, eye, cull);  // glass, after everything solid

  // Mirror glass.
  pass.SetPipeline(glassPipeline_);
  for (size_t i = 0; i < mirrorCount_ && i < mirrors.size(); ++i) {
    const Mirror& m = mirrors[i];
    GlassUniforms g = {};
    g.viewProj = viewProj;
    setVec4(g.center, m.center, 1);
    setVec4(g.right, m.right * m.halfWidth, 0);
    setVec4(g.up, m.up * m.halfHeight, 0);
    g.params[0] = m.on ? 1.0f : 0.0f;
    g.params[1] = 1.0f / static_cast<float>(targetW_);
    g.params[2] = 1.0f / static_cast<float>(targetH_);
    g.params[3] = mirrorTargets_[i].scale;
    queue.WriteBuffer(mirrorTargets_[i].glassBuffer, 0, &g, sizeof(g));
    pass.SetBindGroup(0, mirrorTargets_[i].glassBindGroup);
    pass.Draw(6);
    engine::prof::draw(6);
  }

  shadows_.begin(viewProj);
  for (const engine::Vec4& d : shadowDiscs_) shadows_.add({d.x, d.y, d.z}, d.w, 0.55f);
  shadows_.upload(queue);
  shadows_.draw(pass);  // soft shadows under the avatars
  pass.End();
  if (beamsWanted) beams_.composite(encoder, post_.sceneTarget());
  // Name pictures and text go on top, after the eyes and the mood.
  post_.apply(encoder, target, [&](const wgpu::RenderPassEncoder& p) {
    pictures.draw(p);
    text.draw(p);
  }, classic_, eyes_);
  wgpu::CommandBuffer commands = encoder.Finish();
  queue.Submit(1, &commands);
}

}  // namespace engine
