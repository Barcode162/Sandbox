#include "looped/pipeline_cache.h"

#include <emscripten/emscripten.h>

#include <string>

#include "looped/log.h"

namespace engine::pipelines {
namespace {
int g_pending = 0, g_failed = 0, g_created = 0;
double g_firstMs = 0;
}  // namespace

void create(const wgpu::Device& device, const wgpu::RenderPipelineDescriptor& desc, wgpu::RenderPipeline* slot,
            bool gate) {
  if (gate) {
    if (!g_created) g_firstMs = emscripten_get_now();
    ++g_pending;
    ++g_created;
  }
  std::string label = desc.label.data ? std::string(desc.label.data, desc.label.length == WGPU_STRLEN
                                                                         ? std::string(desc.label.data).size()
                                                                         : desc.label.length)
                                      : "pipeline";
  device.CreateRenderPipelineAsync(
      &desc, wgpu::CallbackMode::AllowSpontaneous,
      [slot, gate, label](wgpu::CreatePipelineAsyncStatus status, wgpu::RenderPipeline pipeline,
                          wgpu::StringView message) {
        if (gate) --g_pending;
        if (status != wgpu::CreatePipelineAsyncStatus::Success || !pipeline) {
          ++g_failed;
          LOG_ERROR("Pipeline \"%s\" failed: %.*s", label.c_str(), static_cast<int>(message.length), message.data);
          return;
        }
        *slot = std::move(pipeline);
      });
}

wgpu::BindGroupLayout textureSamplerLayout(const wgpu::Device& device, wgpu::TextureViewDimension dimension) {
  wgpu::BindGroupLayoutEntry e[2];
  e[0].binding = 0;
  e[0].visibility = wgpu::ShaderStage::Vertex | wgpu::ShaderStage::Fragment;
  e[0].texture.sampleType = wgpu::TextureSampleType::Float;
  e[0].texture.viewDimension = dimension;
  e[1].binding = 1;
  e[1].visibility = wgpu::ShaderStage::Vertex | wgpu::ShaderStage::Fragment;
  e[1].sampler.type = wgpu::SamplerBindingType::Filtering;
  wgpu::BindGroupLayoutDescriptor d;
  d.entryCount = 2;
  d.entries = e;
  return device.CreateBindGroupLayout(&d);
}

wgpu::BindGroupLayout uniformTextureLayout(const wgpu::Device& device) {
  wgpu::BindGroupLayoutEntry e[2];
  e[0].binding = 0;
  e[0].visibility = wgpu::ShaderStage::Vertex | wgpu::ShaderStage::Fragment;
  e[0].buffer.type = wgpu::BufferBindingType::Uniform;
  e[1].binding = 1;
  e[1].visibility = wgpu::ShaderStage::Vertex | wgpu::ShaderStage::Fragment;
  e[1].texture.sampleType = wgpu::TextureSampleType::Float;
  e[1].texture.viewDimension = wgpu::TextureViewDimension::e2D;
  wgpu::BindGroupLayoutDescriptor d;
  d.entryCount = 2;
  d.entries = e;
  return device.CreateBindGroupLayout(&d);
}

wgpu::PipelineLayout pipelineLayout(const wgpu::Device& device, const wgpu::BindGroupLayout& group0) {
  wgpu::PipelineLayoutDescriptor d;
  d.bindGroupLayoutCount = 1;
  d.bindGroupLayouts = &group0;
  return device.CreatePipelineLayout(&d);
}

int pending() { return g_pending; }
int failed() { return g_failed; }
int created() { return g_created; }
double firstStartMs() { return g_firstMs; }

}  // namespace engine::pipelines
