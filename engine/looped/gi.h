#pragma once
// Bounced light, the GPU half (L1.5, docs/handbook/manual/light.md → Bounced light).
// The CPU (looped/radiosity.h, as background jobs) gathers the still
// surfaces, builds the ray tree and the patches; this uploads them and casts
// every build ray on the GPU (looped/shaders/gi.wgsl: a few slices per frame,
// done in well under a second on a phone). From then on, every frame: one
// more bounce between the patches (lamps, dimmers and flicker follow at
// once) and the probes refilled, which the scene shader reads for every
// pixel's bounced light and for which lamps it can see (no light through
// walls). A new layout builds beside the old one and replaces it when done.
#include <webgpu/webgpu_cpp.h>

#include <memory>
#include <vector>

#include "looped/gpu.h"
#include "looped/radiosity.h"
#include "looped/scene_geometry.h"

namespace engine {

class GiGpu {
 public:
  // `lighting` = the scene's lamps (looped/scene_renderer.h LightingUniforms).
  bool init(Gpu& gpu, const wgpu::Buffer& lighting, uint64_t lightingSize);
  // Starts building for this layout (the old one stays until it's done).
  void build(std::shared_ptr<SceneGeometry> geo, const std::vector<GiLight>& lamps, const GiSettings& settings);
  // A lamp moved: which patches and probes see it, again.
  void relight(const std::vector<GiLight>& lamps);
  // Every frame, before the scene is drawn: build slices, then bounce and probes.
  void encode(const wgpu::CommandEncoder& encoder, double nowMs, float emissiveNits, float bounceStrength);
  bool ready() const { return cur_ != nullptr; }
  bool building() const { return next_ != nullptr; }
  // 0..1: the first time the light appears it spreads over about a second.
  float fill() const { return fill_; }
  // For the scene shader (dummies until ready).
  const wgpu::TextureView& sh(int channel) const { return cur_ ? cur_->shView[channel] : dummyView_; }
  const wgpu::TextureView& mask() const { return cur_ ? cur_->maskView : dummyMaskView_; }
  Vec3 origin() const { return cur_ ? cur_->origin : Vec3{}; }
  float spacing() const { return cur_ ? cur_->spacing : 1.0f; }
  uint32_t dims(int a) const { return cur_ ? cur_->n[a] : 1; }
  // A new layout became ready this frame (the scene's bind groups must be remade).
  bool changed() {
    const bool c = changed_;
    changed_ = false;
    return c;
  }
  // For the log and stats.
  size_t patchCount() const { return cur_ ? cur_->patches : 0; }
  size_t probeCount() const { return cur_ ? cur_->probes : 0; }

 private:
  enum class Stage { kCpu, kUpload, kTracePatches, kTraceLamps, kTraceProbes, kProbeLamps, kDone };
  struct Set {
    Stage stage = Stage::kCpu;
    std::shared_ptr<SceneGeometry> geo;
    std::shared_ptr<GiBuild> cpu;
    std::vector<GiLight> lamps;
    size_t patches = 0, probes = 0, lampCount = 0, cursor = 0;
    uint32_t patchRays = 0, probeRays = 0;
    Vec3 origin;
    float spacing = 0.5f;
    uint32_t n[3] = {1, 1, 1};
    double startMs = 0;
    wgpu::Buffer buildParams, frameParams;
    wgpu::Buffer nodes, tris, patchBuf, bucketStart, bucketItems, patchHits, factors, probeHits, light[2];
    wgpu::Texture shTex[3], maskTex;
    wgpu::TextureView shView[3], maskView;
    wgpu::BindGroup tracePatches, traceLamps, traceProbes, probeLamps, frame0, light2[2], probe3;
    int current = 0;  // which light buffer holds this frame's light
    bool relit = false;  // only the lamp rays again (a lamp moved)
  };
  void startCpu(const std::shared_ptr<Set>& s);
  void upload(Set& s);
  void writeBuildParams(Set& s, uint32_t first, uint32_t count);
  void dispatch(const wgpu::CommandEncoder& encoder, const wgpu::ComputePipeline& pipeline,
                const wgpu::BindGroup& group0, uint32_t threads);
  wgpu::Buffer storage(uint64_t bytes, const void* data, const char* label);

  Gpu* gpu_ = nullptr;
  wgpu::Buffer lighting_;
  uint64_t lightingSize_ = 0;
  wgpu::BindGroupLayout build0_, frame0_, lights1_, bounce2_, probes3_;
  wgpu::ComputePipeline tracePatches_, traceLamps_, traceProbes_, probeLamps_, bounce_, probes_;
  wgpu::BindGroup lightsGroup_;
  std::shared_ptr<Set> cur_, next_;
  wgpu::Texture dummy_, dummyMask_;
  wgpu::TextureView dummyView_, dummyMaskView_;
  float fill_ = 0;
  double firstReadyMs_ = -1, lastMs_ = 0;
  bool changed_ = false;
};

}  // namespace engine
