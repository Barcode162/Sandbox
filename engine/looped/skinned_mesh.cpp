#include "looped/skinned_mesh.h"

#include <algorithm>
#include <cmath>

namespace engine {
namespace {

uint8_t toByte(float v) { return static_cast<uint8_t>(std::lround(clampf(v, 0.0f, 1.0f) * 255.0f)); }

SkinnedVertex makeVertex(Vec3 p, Vec3 n, const Skin& skin, const Paint& paint) {
  SkinnedVertex v{};
  v.position = p;
  v.normal = normalize(n);
  v.color[0] = toByte(paint.color.x);
  v.color[1] = toByte(paint.color.y);
  v.color[2] = toByte(paint.color.z);
  v.color[3] = toByte(paint.gloss);
  const uint8_t wb = toByte(skin.t);
  v.joints[0] = static_cast<uint8_t>(skin.a);
  v.joints[1] = static_cast<uint8_t>(skin.b);
  v.weights[0] = static_cast<uint8_t>(255 - wb);
  v.weights[1] = wb;
  v.material[0] = static_cast<uint8_t>(paint.layer + 1);
  return v;
}

// Adds a triangle, flipped if needed so it faces the same way as its vertex
// normals (outward). Keeps every builder free of winding mistakes.
void addTriangle(SkinnedMeshData& m, uint32_t a, uint32_t b, uint32_t c) {
  const Vec3& pa = m.vertices[a].position;
  const Vec3 face = cross(m.vertices[b].position - pa, m.vertices[c].position - pa);
  const Vec3 n = m.vertices[a].normal + m.vertices[b].normal + m.vertices[c].normal;
  if (dot(face, n) < 0) std::swap(b, c);
  m.indices.insert(m.indices.end(), {a, b, c});
}

}  // namespace

void addTube(SkinnedMeshData& mesh, const std::vector<Ring>& rings, Vec3 side, int segments) {
  if (rings.size() < 2) return;
  const auto base = static_cast<uint32_t>(mesh.vertices.size());
  const auto stride = static_cast<uint32_t>(segments + 1);
  for (size_t k = 0; k < rings.size(); ++k) {
    const Ring& r = rings[k];
    const Vec3 prev = rings[k == 0 ? 0 : k - 1].center, next = rings[std::min(k + 1, rings.size() - 1)].center;
    const Vec3 t = normalize(next - prev);
    const Vec3 a1 = normalize(side - t * dot(side, t));
    const Vec3 a2 = cross(t, a1);
    for (int s = 0; s <= segments; ++s) {
      const float ang = 2.0f * kPi * static_cast<float>(s) / static_cast<float>(segments);
      const float c = std::cos(ang), sn = std::sin(ang);
      const Vec3 p = r.center + a1 * (c * r.r1) + a2 * (sn * r.r2);
      const Vec3 n = a1 * (c / r.r1) + a2 * (sn / r.r2);  // ellipse normal
      mesh.vertices.push_back(makeVertex(p, n, r.skin, r.paint));
    }
  }
  for (uint32_t k = 0; k + 1 < rings.size(); ++k) {
    for (uint32_t s = 0; s < static_cast<uint32_t>(segments); ++s) {
      const uint32_t a = base + k * stride + s, b = a + stride;
      addTriangle(mesh, a, a + 1, b + 1);
      addTriangle(mesh, a, b + 1, b);
    }
  }
  // Flat caps on both ends.
  for (int end = 0; end < 2; ++end) {
    const size_t k = end == 0 ? 0 : rings.size() - 1;
    const Vec3 t = normalize(rings[end == 0 ? 1 : k].center - rings[end == 0 ? 0 : k - 1].center);
    const Vec3 outward = end == 0 ? -t : t;
    const auto center = static_cast<uint32_t>(mesh.vertices.size());
    mesh.vertices.push_back(makeVertex(rings[k].center, outward, rings[k].skin, rings[k].paint));
    const uint32_t first = static_cast<uint32_t>(mesh.vertices.size());
    for (int s = 0; s <= segments; ++s) {
      SkinnedVertex v = mesh.vertices[base + k * stride + static_cast<uint32_t>(s)];
      v.normal = outward;
      mesh.vertices.push_back(v);
    }
    for (uint32_t s = 0; s < static_cast<uint32_t>(segments); ++s) addTriangle(mesh, center, first + s, first + s + 1);
  }
}

void addEllipsoid(SkinnedMeshData& mesh, Vec3 c, Vec3 r, Skin skin, Paint paint, int segments, int rings,
                  const std::function<bool(Vec3)>& keep) {
  const auto base = static_cast<uint32_t>(mesh.vertices.size());
  for (int i = 0; i <= rings; ++i) {
    const float phi = kPi * static_cast<float>(i) / static_cast<float>(rings);
    for (int s = 0; s <= segments; ++s) {
      const float theta = 2.0f * kPi * static_cast<float>(s) / static_cast<float>(segments);
      const Vec3 u{std::sin(phi) * std::sin(theta), std::cos(phi), std::sin(phi) * std::cos(theta)};
      const Vec3 p{c.x + u.x * r.x, c.y + u.y * r.y, c.z + u.z * r.z};
      mesh.vertices.push_back(makeVertex(p, {u.x / r.x, u.y / r.y, u.z / r.z}, skin, paint));
    }
  }
  const auto stride = static_cast<uint32_t>(segments + 1);
  auto kept = [&](uint32_t v) { return !keep || keep(mesh.vertices[v].position); };
  for (uint32_t i = 0; i < static_cast<uint32_t>(rings); ++i) {
    for (uint32_t s = 0; s < static_cast<uint32_t>(segments); ++s) {
      const uint32_t a = base + i * stride + s, b = a + stride;
      if (kept(a) && kept(b) && kept(b + 1)) addTriangle(mesh, a, b, b + 1);
      if (kept(a) && kept(b + 1) && kept(a + 1)) addTriangle(mesh, a, b + 1, a + 1);
    }
  }
}

SkinnedMesh SkinnedMesh::upload(const wgpu::Device& device, const SkinnedMeshData& data) {
  SkinnedMesh mesh;
  const wgpu::Queue queue = device.GetQueue();
  wgpu::BufferDescriptor vb;
  vb.label = "skinned vertices";
  vb.size = data.vertices.size() * sizeof(SkinnedVertex);
  vb.usage = wgpu::BufferUsage::Vertex | wgpu::BufferUsage::CopyDst;
  mesh.vertexBuffer = device.CreateBuffer(&vb);
  queue.WriteBuffer(mesh.vertexBuffer, 0, data.vertices.data(), vb.size);
  wgpu::BufferDescriptor ib;
  ib.label = "skinned indices";
  ib.size = data.indices.size() * sizeof(uint32_t);
  ib.usage = wgpu::BufferUsage::Index | wgpu::BufferUsage::CopyDst;
  mesh.indexBuffer = device.CreateBuffer(&ib);
  queue.WriteBuffer(mesh.indexBuffer, 0, data.indices.data(), ib.size);
  mesh.indexCount = static_cast<uint32_t>(data.indices.size());
  return mesh;
}

wgpu::VertexBufferLayout SkinnedMesh::vertexLayout() {
  static const wgpu::VertexAttribute attributes[] = {
      {.format = wgpu::VertexFormat::Float32x3, .offset = offsetof(SkinnedVertex, position), .shaderLocation = 0},
      {.format = wgpu::VertexFormat::Float32x3, .offset = offsetof(SkinnedVertex, normal), .shaderLocation = 1},
      {.format = wgpu::VertexFormat::Unorm8x4, .offset = offsetof(SkinnedVertex, color), .shaderLocation = 2},
      {.format = wgpu::VertexFormat::Uint8x4, .offset = offsetof(SkinnedVertex, joints), .shaderLocation = 3},
      {.format = wgpu::VertexFormat::Unorm8x4, .offset = offsetof(SkinnedVertex, weights), .shaderLocation = 4},
      {.format = wgpu::VertexFormat::Uint8x4, .offset = offsetof(SkinnedVertex, material), .shaderLocation = 5},
  };
  wgpu::VertexBufferLayout layout;
  layout.arrayStride = sizeof(SkinnedVertex);
  layout.attributeCount = std::size(attributes);
  layout.attributes = attributes;
  return layout;
}

}  // namespace engine
