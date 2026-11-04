#include "looped/gi.h"

#include <algorithm>
#include <cstring>

#include <emscripten/emscripten.h>

#include "looped/file.h"
#include "looped/jobs.h"
#include "looped/log.h"

namespace engine {
namespace {

// Rays cast per frame while building: enough to finish in well under a
// second on a phone, few enough not to hold a frame up.
constexpr uint32_t kRaysPerSlice = 1u << 17;

struct Params {
  uint32_t counts[4];   // patches, probes, lamps, rays per patch
  uint32_t counts2[4];  // rays per probe, first item, items, probes along x
  float grid[4];        // probe (0,0,0), spacing
  uint32_t grid2[4];    // probes along x, y, z
  float misc[4];        // hash cell, max ray, glow units, bounce strength
};

struct PatchGpu {
  float position[4], normal[4], albedo[4], emission[4];
};

wgpu::BindGroupLayoutEntry bufferEntry(uint32_t binding, wgpu::BufferBindingType type) {
  wgpu::BindGroupLayoutEntry e;
  e.binding = binding;
  e.visibility = wgpu::ShaderStage::Compute;
  e.buffer.type = type;
  return e;
}
wgpu::BindGroupLayoutEntry storageTextureEntry(uint32_t binding, wgpu::TextureFormat format) {
  wgpu::BindGroupLayoutEntry e;
  e.binding = binding;
  e.visibility = wgpu::ShaderStage::Compute;
  e.storageTexture.access = wgpu::StorageTextureAccess::WriteOnly;
  e.storageTexture.format = format;
  e.storageTexture.viewDimension = wgpu::TextureViewDimension::e3D;
  return e;
}
wgpu::BindGroupLayout makeLayout(const wgpu::Device& d, std::vector<wgpu::BindGroupLayoutEntry> entries) {
  wgpu::BindGroupLayoutDescriptor desc;
  desc.entryCount = entries.size();
  desc.entries = entries.data();
  return d.CreateBindGroupLayout(&desc);
}
wgpu::BindGroupEntry bufferBinding(uint32_t binding, const wgpu::Buffer& b) {
  wgpu::BindGroupEntry e;
  e.binding = binding;
  e.buffer = b;
  return e;
}
wgpu::BindGroupEntry viewBinding(uint32_t binding, const wgpu::TextureView& v) {
  wgpu::BindGroupEntry e;
  e.binding = binding;
  e.textureView = v;
  return e;
}
wgpu::BindGroup makeGroup(const wgpu::Device& d, const wgpu::BindGroupLayout& layout, std::vector<wgpu::BindGroupEntry> e) {
  wgpu::BindGroupDescriptor desc;
  desc.layout = layout;
  desc.entryCount = e.size();
  desc.entries = e.data();
  return d.CreateBindGroup(&desc);
}

}  // namespace

bool GiGpu::init(Gpu& gpu, const wgpu::Buffer& lighting, uint64_t lightingSize) {
  gpu_ = &gpu;
  lighting_ = lighting;
  lightingSize_ = lightingSize;
  const wgpu::Device& d = gpu.device;
  using T = wgpu::BufferBindingType;
  build0_ = makeLayout(d, {bufferEntry(0, T::Uniform), bufferEntry(1, T::ReadOnlyStorage), bufferEntry(2, T::ReadOnlyStorage),
                           bufferEntry(3, T::ReadOnlyStorage), bufferEntry(4, T::ReadOnlyStorage),
                           bufferEntry(5, T::ReadOnlyStorage), bufferEntry(6, T::Storage), bufferEntry(7, T::Storage),
                           storageTextureEntry(8, wgpu::TextureFormat::RGBA32Uint)});
  frame0_ = makeLayout(d, {bufferEntry(0, T::Uniform), bufferEntry(3, T::ReadOnlyStorage)});
  lights1_ = makeLayout(d, {bufferEntry(0, T::Uniform)});
  bounce2_ = makeLayout(d, {bufferEntry(0, T::ReadOnlyStorage), bufferEntry(1, T::ReadOnlyStorage),
                            bufferEntry(2, T::ReadOnlyStorage), bufferEntry(3, T::Storage)});
  probes3_ = makeLayout(d, {bufferEntry(0, T::ReadOnlyStorage), storageTextureEntry(1, wgpu::TextureFormat::RGBA16Float),
                            storageTextureEntry(2, wgpu::TextureFormat::RGBA16Float),
                            storageTextureEntry(3, wgpu::TextureFormat::RGBA16Float)});
  {
    wgpu::BindGroupEntry e = bufferBinding(0, lighting_);
    e.size = lightingSize_;
    lightsGroup_ = makeGroup(d, lights1_, {e});
  }
  // Dummies for the scene shader until the first build is done.
  wgpu::TextureDescriptor t;
  t.dimension = wgpu::TextureDimension::e3D;
  t.size = {1, 1, 1};
  t.usage = wgpu::TextureUsage::TextureBinding;
  t.format = wgpu::TextureFormat::RGBA16Float;
  t.label = "bounced light (none yet)";
  dummy_ = d.CreateTexture(&t);
  dummyView_ = dummy_.CreateView();
  t.format = wgpu::TextureFormat::RGBA32Uint;  // four words of lamps per probe (J88.1)
  dummyMask_ = d.CreateTexture(&t);
  dummyMaskView_ = dummyMask_.CreateView();

  auto source = readTextFile("/shaders/gi.wgsl");
  if (!source) {
    LOG_ERROR("Bounced light: gi.wgsl is missing.");
    return false;
  }
  wgpu::ShaderSourceWGSL wgsl;
  wgsl.code = source->c_str();
  wgpu::ShaderModuleDescriptor md;
  md.nextInChain = &wgsl;
  md.label = "gi.wgsl";
  wgpu::ShaderModule module = d.CreateShaderModule(&md);
  auto pipeline = [&](const char* entry, std::vector<wgpu::BindGroupLayout> layouts, wgpu::ComputePipeline* slot) {
    wgpu::PipelineLayoutDescriptor pl;
    pl.bindGroupLayoutCount = layouts.size();
    pl.bindGroupLayouts = layouts.data();
    wgpu::ComputePipelineDescriptor desc;
    desc.label = entry;
    desc.layout = d.CreatePipelineLayout(&pl);
    desc.compute.module = module;
    desc.compute.entryPoint = entry;
    std::string name = entry;
    d.CreateComputePipelineAsync(&desc, wgpu::CallbackMode::AllowSpontaneous,
                                 [slot, name](wgpu::CreatePipelineAsyncStatus status, wgpu::ComputePipeline p,
                                              wgpu::StringView message) {
                                   if (status != wgpu::CreatePipelineAsyncStatus::Success) {
                                     LOG_ERROR("Bounced light: pipeline %s failed: %.*s", name.c_str(),
                                               static_cast<int>(message.length), message.data);
                                     return;
                                   }
                                   *slot = std::move(p);
                                 });
  };
  pipeline("trace_patches", {build0_, lights1_}, &tracePatches_);
  pipeline("trace_lamps", {build0_, lights1_}, &traceLamps_);
  pipeline("trace_probes", {build0_, lights1_}, &traceProbes_);
  pipeline("probe_lamps", {build0_, lights1_}, &probeLamps_);
  pipeline("bounce", {frame0_, lights1_, bounce2_}, &bounce_);
  pipeline("probes", {frame0_, lights1_, bounce2_, probes3_}, &probes_);
  return true;
}

void GiGpu::build(std::shared_ptr<SceneGeometry> geo, const std::vector<GiLight>& lamps, const GiSettings& settings) {
  auto s = std::make_shared<Set>();
  s->geo = std::move(geo);
  s->lamps = lamps;
  if (s->lamps.size() > kMaskLamps) s->lamps.resize(kMaskLamps);
  s->cpu = std::make_shared<GiBuild>();
  GiSettings st = settings;
  st.cpuRays = false;  // the GPU casts them
  s->cpu->begin(*s->geo, s->lamps, st);
  s->startMs = emscripten_get_now();
  next_ = s;
  startCpu(s);
}

// The CPU part as background jobs: a few ms at a time until it's done.
void GiGpu::startCpu(const std::shared_ptr<Set>& s) {
  std::weak_ptr<Set> weak = s;
  queueJob([this, weak] {
    auto s = weak.lock();
    if (!s || s != next_) return;  // replaced by a newer layout
    if (s->cpu->step(4.0)) {
      s->stage = Stage::kUpload;
      LOG_INFO("Bounced light: %zu patches, %d x %d x %d probes, CPU part in %.0f ms.", s->cpu->surfels.size(),
               s->cpu->nx, s->cpu->ny, s->cpu->nz, s->cpu->buildMs);
    } else {
      startCpu(s);
    }
  }, JobLane::kNormal, "gi-cpu");
}

wgpu::Buffer GiGpu::storage(uint64_t bytes, const void* data, const char* label) {
  wgpu::BufferDescriptor d;
  d.label = label;
  d.size = std::max<uint64_t>(16, (bytes + 15) & ~uint64_t{15});
  d.usage = wgpu::BufferUsage::Storage | wgpu::BufferUsage::CopyDst;
  wgpu::Buffer b = gpu_->device.CreateBuffer(&d);
  if (data && bytes) gpu_->queue.WriteBuffer(b, 0, data, (bytes + 3) & ~uint64_t{3});
  return b;
}

void GiGpu::upload(Set& s) {
  const GiBuild& c = *s.cpu;
  const wgpu::Device& d = gpu_->device;
  s.patches = c.surfels.size();
  s.probes = c.probeCount();
  s.lampCount = s.lamps.size();
  s.patchRays = static_cast<uint32_t>(c.settings.surfelRays);
  s.probeRays = static_cast<uint32_t>(c.settings.probeRays);
  s.origin = c.probeOrigin;
  s.spacing = c.settings.probeSpacing;
  s.n[0] = static_cast<uint32_t>(c.nx), s.n[1] = static_cast<uint32_t>(c.ny), s.n[2] = static_cast<uint32_t>(c.nz);
  std::vector<float> tris;
  c.tree().packTriangles(tris);
  s.nodes = storage(c.tree().nodeBytes(), c.tree().nodeData(), "gi: ray tree");
  s.tris = storage(tris.size() * 4, tris.data(), "gi: triangles");
  std::vector<PatchGpu> patches(s.patches);
  for (size_t i = 0; i < s.patches; ++i) {
    const GiBuild::Surfel& p = c.surfels[i];
    patches[i] = {{p.position.x, p.position.y, p.position.z, 0}, {p.normal.x, p.normal.y, p.normal.z, 0},
                  {p.albedo.x, p.albedo.y, p.albedo.z, 0}, {p.emission.x, p.emission.y, p.emission.z, 0}};
  }
  s.patchBuf = storage(patches.size() * sizeof(PatchGpu), patches.data(), "gi: patches");
  std::vector<uint32_t> start, items;
  c.hashTable(start, items);
  s.bucketStart = storage(start.size() * 4, start.data(), "gi: hash");
  s.bucketItems = storage(items.size() * 4, items.data(), "gi: hash items");
  s.patchHits = storage(s.patches * s.patchRays * 4, nullptr, "gi: what patches see");
  s.factors = storage(s.patches * std::max<size_t>(1, s.lampCount) * 4, nullptr, "gi: lamps patches see");
  s.probeHits = storage(s.probes * s.probeRays * 4, nullptr, "gi: what probes see");
  s.light[0] = storage(s.patches * 16, nullptr, "gi: light A");
  s.light[1] = storage(s.patches * 16, nullptr, "gi: light B");
  // The probes' light (spherical harmonics, one texture per colour) and lamps.
  wgpu::TextureDescriptor t;
  t.dimension = wgpu::TextureDimension::e3D;
  t.size = {s.n[0], s.n[1], s.n[2]};
  t.usage = wgpu::TextureUsage::StorageBinding | wgpu::TextureUsage::TextureBinding;
  t.format = wgpu::TextureFormat::RGBA16Float;
  for (int k = 0; k < 3; ++k) {
    t.label = "gi: probe light";
    s.shTex[k] = d.CreateTexture(&t);
    s.shView[k] = s.shTex[k].CreateView();
  }
  t.format = wgpu::TextureFormat::RGBA32Uint;
  t.label = "gi: probe lamps";
  s.maskTex = d.CreateTexture(&t);
  s.maskView = s.maskTex.CreateView();

  wgpu::BufferDescriptor u;
  u.size = sizeof(Params);
  u.usage = wgpu::BufferUsage::Uniform | wgpu::BufferUsage::CopyDst;
  u.label = "gi: build params";
  s.buildParams = d.CreateBuffer(&u);
  u.label = "gi: frame params";
  s.frameParams = d.CreateBuffer(&u);

  auto build0 = [&](const wgpu::Buffer& out, const wgpu::Buffer& values) {
    return makeGroup(d, build0_, {bufferBinding(0, s.buildParams), bufferBinding(1, s.nodes), bufferBinding(2, s.tris),
                                  bufferBinding(3, s.patchBuf), bufferBinding(4, s.bucketStart),
                                  bufferBinding(5, s.bucketItems), bufferBinding(6, out), bufferBinding(7, values),
                                  viewBinding(8, s.maskView)});
  };
  // Every build group needs an output and a values buffer; the ones a pass
  // doesn't write get a spare (never the buffer it reads).
  s.tracePatches = build0(s.patchHits, s.light[0]);
  s.traceLamps = build0(s.light[0], s.factors);
  s.traceProbes = build0(s.probeHits, s.light[0]);
  s.probeLamps = build0(s.probeHits, s.light[0]);
  s.frame0 = makeGroup(d, frame0_, {bufferBinding(0, s.frameParams), bufferBinding(3, s.patchBuf)});
  for (int k = 0; k < 2; ++k) {
    s.light2[k] = makeGroup(d, bounce2_, {bufferBinding(0, s.factors), bufferBinding(1, s.patchHits),
                                          bufferBinding(2, s.light[k]), bufferBinding(3, s.light[1 - k])});
  }
  s.probe3 = makeGroup(d, probes3_, {bufferBinding(0, s.probeHits), viewBinding(1, s.shView[0]), viewBinding(2, s.shView[1]),
                                     viewBinding(3, s.shView[2])});
  s.stage = Stage::kTracePatches;
  s.cursor = 0;
}

void GiGpu::writeBuildParams(Set& s, uint32_t first, uint32_t count) {
  Params p = {};
  p.counts[0] = static_cast<uint32_t>(s.patches);
  p.counts[1] = static_cast<uint32_t>(s.probes);
  p.counts[2] = static_cast<uint32_t>(s.lampCount);
  p.counts[3] = s.patchRays;
  p.counts2[0] = s.probeRays;
  p.counts2[1] = first;
  p.counts2[2] = count;
  p.counts2[3] = s.n[0];
  p.grid[0] = s.origin.x, p.grid[1] = s.origin.y, p.grid[2] = s.origin.z, p.grid[3] = s.spacing;
  p.grid2[0] = s.n[0], p.grid2[1] = s.n[1], p.grid2[2] = s.n[2];
  p.misc[0] = s.cpu->hashCell();
  p.misc[1] = s.cpu->settings.maxRay;
  gpu_->queue.WriteBuffer(s.buildParams, 0, &p, sizeof(p));
}

void GiGpu::dispatch(const wgpu::CommandEncoder& encoder, const wgpu::ComputePipeline& pipeline,
                     const wgpu::BindGroup& group0, uint32_t threads) {
  wgpu::ComputePassEncoder pass = encoder.BeginComputePass();
  pass.SetPipeline(pipeline);
  pass.SetBindGroup(0, group0);
  pass.SetBindGroup(1, lightsGroup_);
  pass.DispatchWorkgroups((threads + 63) / 64);
  pass.End();
}

void GiGpu::relight(const std::vector<GiLight>& lamps) {
  // Lamps' colours and brightness come from the scene's lighting buffer every
  // frame; a moved lamp needs its shadow rays again (in place: the light
  // already there stays on screen meanwhile).
  for (const auto& s : {cur_, next_}) {
    if (!s || s->stage == Stage::kCpu || s->stage == Stage::kUpload || s->stage == Stage::kTracePatches) continue;
    std::vector<GiLight> l = lamps;
    if (l.size() > kMaskLamps) l.resize(kMaskLamps);
    if (l.size() != s->lampCount) continue;  // a lamp added or removed: the next layout build handles it
    s->lamps = l;
    s->stage = Stage::kTraceLamps;
    s->cursor = 0;
    s->relit = true;
  }
}

void GiGpu::encode(const wgpu::CommandEncoder& encoder, double nowMs, float emissiveNits, float bounceStrength) {
  if (!tracePatches_ || !traceLamps_ || !traceProbes_ || !probeLamps_ || !bounce_ || !probes_) return;
  // Building (a new layout, or the current one re-lit): one slice of rays per frame.
  Set* building = next_ ? next_.get() : (cur_ && cur_->stage != Stage::kDone ? cur_.get() : nullptr);
  if (building) {
    Set& s = *building;
    auto slice = [&](size_t total, const wgpu::ComputePipeline& p, const wgpu::BindGroup& g, uint32_t perSlice) {
      const auto n = static_cast<uint32_t>(std::min<size_t>(perSlice, total - s.cursor));
      writeBuildParams(s, static_cast<uint32_t>(s.cursor), n);
      dispatch(encoder, p, g, n);
      s.cursor += n;
      return s.cursor >= total;
    };
    switch (s.stage) {
      case Stage::kCpu:
        break;
      case Stage::kUpload:
        upload(s);
        break;
      case Stage::kTracePatches:
        if (slice(s.patches * s.patchRays, tracePatches_, s.tracePatches, kRaysPerSlice)) {
          s.stage = Stage::kTraceLamps, s.cursor = 0;
          LOG_INFO("Bounced light: what patches see, %.0f ms in.", nowMs - s.startMs);
        }
        break;
      case Stage::kTraceLamps:
        if (s.lampCount == 0 || slice(s.patches * s.lampCount, traceLamps_, s.traceLamps, kRaysPerSlice * 2)) {
          // (Re-lit only: the probes' rays still stand, straight to their lamps.)
          s.stage = s.relit ? Stage::kProbeLamps : Stage::kTraceProbes;
          s.cursor = 0;
          LOG_INFO("Bounced light: which lamps patches see, %.0f ms in.", nowMs - s.startMs);
        }
        break;
      case Stage::kTraceProbes:
        if (slice(s.probes * s.probeRays, traceProbes_, s.traceProbes, kRaysPerSlice)) {
          s.stage = Stage::kProbeLamps, s.cursor = 0;
          LOG_INFO("Bounced light: what probes see, %.0f ms in.", nowMs - s.startMs);
        }
        break;
      case Stage::kProbeLamps:
        if (slice(s.probes, probeLamps_, s.probeLamps, 8192)) {
          s.stage = Stage::kDone;
          if (s.relit) {
            s.relit = false;
            LOG_INFO("Bounced light: lamps re-traced.");
          } else {
            LOG_INFO("Bounced light: ready (%zu patches, %zu probes, %zu lamps) %.0f ms after it started.", s.patches,
                     s.probes, s.lampCount, nowMs - s.startMs);
            cur_ = next_;
            next_ = nullptr;
            changed_ = true;
            if (firstReadyMs_ < 0) firstReadyMs_ = nowMs;
          }
        }
        break;
      case Stage::kDone:
        break;
    }
  }
  // Every frame: one more bounce, then the probes from the new light.
  if (!cur_ || (cur_->stage != Stage::kDone && !cur_->relit)) return;
  Set& s = *cur_;
  Params p = {};
  p.counts[0] = static_cast<uint32_t>(s.patches);
  p.counts[1] = static_cast<uint32_t>(s.probes);
  p.counts[2] = static_cast<uint32_t>(s.lampCount);
  p.counts[3] = s.patchRays;
  p.counts2[0] = s.probeRays;
  p.counts2[3] = s.n[0];
  p.grid[0] = s.origin.x, p.grid[1] = s.origin.y, p.grid[2] = s.origin.z, p.grid[3] = s.spacing;
  p.grid2[0] = s.n[0], p.grid2[1] = s.n[1], p.grid2[2] = s.n[2];
  // The first time: light spreads over about a second (the bounce grows from 0).
  fill_ = static_cast<float>(std::clamp((nowMs - firstReadyMs_) / 1200.0, 0.0, 1.0));
  p.misc[2] = emissiveNits;
  p.misc[3] = bounceStrength * fill_;
  gpu_->queue.WriteBuffer(s.frameParams, 0, &p, sizeof(p));
  {
    wgpu::ComputePassEncoder pass = encoder.BeginComputePass();
    pass.SetPipeline(bounce_);
    pass.SetBindGroup(0, s.frame0);
    pass.SetBindGroup(1, lightsGroup_);
    pass.SetBindGroup(2, s.light2[s.current]);
    pass.DispatchWorkgroups(static_cast<uint32_t>((s.patches + 63) / 64));
    pass.End();
  }
  s.current = 1 - s.current;  // the light just written
  {
    wgpu::ComputePassEncoder pass = encoder.BeginComputePass();
    pass.SetPipeline(probes_);
    pass.SetBindGroup(0, s.frame0);
    pass.SetBindGroup(1, lightsGroup_);
    pass.SetBindGroup(2, s.light2[s.current]);
    pass.SetBindGroup(3, s.probe3);
    pass.DispatchWorkgroups(static_cast<uint32_t>((s.probes + 63) / 64));
    pass.End();
  }
  lastMs_ = nowMs;
}

}  // namespace engine
