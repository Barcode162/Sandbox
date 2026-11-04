#pragma once
// Uploads geometry (looped/mesh_data.h) to the GPU.
#include <webgpu/webgpu_cpp.h>

#include <cstdint>

#include "looped/mesh_data.h"

namespace engine {

struct Mesh {
  wgpu::Buffer vertexBuffer;
  wgpu::Buffer indexBuffer;
  uint32_t indexCount = 0;

  static Mesh upload(const wgpu::Device& device, const MeshData& data);
  static wgpu::VertexBufferLayout vertexLayout();
};

}  // namespace engine
