#pragma once
// Render pipelines compiled in the background (CreateRenderPipelineAsync),
// so start-up never stalls while the GPU driver compiles shaders. The slot
// stays empty until the pipeline is ready; code that draws must skip (or
// wait for) an empty pipeline. Every call site in the engine and app goes
// through here (no CreateRenderPipeline).
#include <webgpu/webgpu_cpp.h>

namespace engine::pipelines {

// Starts compiling `desc` into `*slot`. The descriptor only has to live
// for this call; `slot` must live until the pipeline arrives. `gate` = part
// of the bar's "ready" (pending() counts it).
void create(const wgpu::Device& device, const wgpu::RenderPipelineDescriptor& desc, wgpu::RenderPipeline* slot,
            bool gate = true);

// A bind group layout for "texture + sampler" (binding 0 and 1) or
// "uniform buffer + texture" pipelines: explicit layouts, because a
// pipeline that is still compiling can't be asked for its own.
wgpu::BindGroupLayout textureSamplerLayout(const wgpu::Device& device, wgpu::TextureViewDimension dimension);
wgpu::BindGroupLayout uniformTextureLayout(const wgpu::Device& device);
wgpu::PipelineLayout pipelineLayout(const wgpu::Device& device, const wgpu::BindGroupLayout& group0);

int pending();   // gated pipelines still compiling
int failed();    // pipelines that failed (logged)
int created();   // gated pipelines asked for so far
double firstStartMs();  // when the first one was asked for

}  // namespace engine::pipelines
