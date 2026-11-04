#pragma once
// A 3D model on the GPU, loaded from a .glb file: vertex/index buffers per
// part plus one bind group per material (its uniform values and textures).
// Loading is asynchronous: download → parse → decode textures → upload.
#include <webgpu/webgpu_cpp.h>

#include <functional>
#include <memory>
#include <string>
#include <vector>

#include "looped/culling.h"
#include "looped/gltf.h"

namespace engine {

class GpuModel {
 public:
  // A chunk of a part: its triangles are a run in the index buffer, and
  // its box (model space) lets the renderer skip it when it's off screen.
  // Big parts (a whole room's walls) are cut into floor-grid chunks at
  // load time; small parts are one chunk.
  struct Cluster {
    uint32_t firstIndex = 0, indexCount = 0;
    Aabb bounds;
  };
  struct Part {
    wgpu::Buffer vertexBuffer, indexBuffer;
    uint32_t indexCount = 0;
    Aabb bounds;                    // model space, the whole part
    std::vector<Cluster> clusters;  // in index-buffer order
    size_t material = 0;  // index into bindGroups
    bool blend = false;   // see-through: drawn after everything solid
  };

  // Matches `struct ModelMaterial` in looped/shaders/scene.wgsl.
  struct MaterialUniforms {
    float baseColor[4];
    float params[4];    // metallic, roughness, normal scale, occlusion strength
    float emissive[4];  // rgb; w = the real-brightness fix (L1.4, new lighting only; 1 = none)
    float surface[4];   // y = the least roughness (M0, new lighting only; 0 = as made)
  };

  // The bind group layout models are drawn with (group 2 of the model
  // pipeline): binding 1 = material uniforms, 2..5 = base color,
  // metal/roughness, normal, occlusion textures, 6 = sampler, 7 = emissive
  // texture.
  static wgpu::BindGroupLayout createLayout(const wgpu::Device& device);
  static wgpu::VertexBufferLayout vertexLayout();

  // Starts loading `url`. `done` gets the model, or nullptr on failure
  // (the reason is logged). `progress` (optional) hears the download
  // progress, 0..1. If `url` can't be downloaded and `fallbackUrl` is
  // given (the PNG/JPEG version of a compressed-texture model), that's
  // loaded instead.
  static void load(const wgpu::Device& device, const wgpu::BindGroupLayout& layout, const wgpu::Sampler& sampler,
                   const std::string& url, std::function<void(std::shared_ptr<GpuModel>)> done,
                   std::function<void(float)> progress = nullptr, const std::string& fallbackUrl = "");

  std::vector<Part> parts;
  bool hasBlend = false;
  std::vector<wgpu::BindGroup> bindGroups;  // one per material
  // Per material (the default material last): its name, its uniforms and
  // their buffer, so the renderer can apply the real-brightness fixes
  // (assets/models/albedo.json) once both have arrived.
  std::vector<std::string> materialNames;
  std::vector<MaterialUniforms> materialValues;
  std::vector<wgpu::Buffer> materialBuffers;
  // The real-material fixes (new lighting only): brightness (1 = none) and
  // the least roughness (0 = as made).
  void setRealFix(const wgpu::Queue& queue, size_t material, float fix, float leastRough);
  // The model's geometry and materials on the CPU (textures left out), for
  // the bounced light (looped/radiosity.h) to trace rays through.
  std::shared_ptr<const ModelData> cpu;
  Vec3 boundsMin, boundsMax;                // in model space
};

}  // namespace engine
