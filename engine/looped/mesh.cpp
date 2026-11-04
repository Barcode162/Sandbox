#include "looped/mesh.h"

namespace engine {

Mesh Mesh::upload(const wgpu::Device& device, const MeshData& data) {
  Mesh mesh;
  const wgpu::Queue queue = device.GetQueue();

  wgpu::BufferDescriptor vb;
  vb.size = data.vertices.size() * sizeof(Vertex);
  vb.usage = wgpu::BufferUsage::Vertex | wgpu::BufferUsage::CopyDst;
  mesh.vertexBuffer = device.CreateBuffer(&vb);
  queue.WriteBuffer(mesh.vertexBuffer, 0, data.vertices.data(), vb.size);

  wgpu::BufferDescriptor ib;
  ib.size = data.indices.size() * sizeof(uint32_t);
  ib.usage = wgpu::BufferUsage::Index | wgpu::BufferUsage::CopyDst;
  mesh.indexBuffer = device.CreateBuffer(&ib);
  queue.WriteBuffer(mesh.indexBuffer, 0, data.indices.data(), ib.size);

  mesh.indexCount = static_cast<uint32_t>(data.indices.size());
  return mesh;
}

wgpu::VertexBufferLayout Mesh::vertexLayout() {
  static const wgpu::VertexAttribute attributes[] = {
      {.format = wgpu::VertexFormat::Float32x3, .offset = 0, .shaderLocation = 0},
      {.format = wgpu::VertexFormat::Float32x3, .offset = sizeof(Vec3), .shaderLocation = 1},
  };
  wgpu::VertexBufferLayout layout;
  layout.arrayStride = sizeof(Vertex);
  layout.attributeCount = 2;
  layout.attributes = attributes;
  return layout;
}

}  // namespace engine
