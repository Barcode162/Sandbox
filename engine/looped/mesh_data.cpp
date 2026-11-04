#include "looped/mesh_data.h"

#include <cmath>

namespace engine {
namespace {

// Adds one flat rectangle facing `normal`, spanned by the half-extents u and v.
void addQuad(MeshData& mesh, Vec3 center, Vec3 u, Vec3 v, Vec3 normal) {
  const auto base = static_cast<uint32_t>(mesh.vertices.size());
  mesh.vertices.push_back({center - u - v, normal});
  mesh.vertices.push_back({center + u - v, normal});
  mesh.vertices.push_back({center + u + v, normal});
  mesh.vertices.push_back({center - u + v, normal});
  // Counter-clockwise when viewed from the front (the side `normal` points to).
  mesh.indices.insert(mesh.indices.end(), {base, base + 1, base + 2, base, base + 2, base + 3});
}

}  // namespace

MeshData makeBox(Vec3 size) {
  const Vec3 h = size * 0.5f;
  MeshData mesh;
  addQuad(mesh, {h.x, 0, 0}, {0, 0, -h.z}, {0, h.y, 0}, {1, 0, 0});
  addQuad(mesh, {-h.x, 0, 0}, {0, 0, h.z}, {0, h.y, 0}, {-1, 0, 0});
  addQuad(mesh, {0, h.y, 0}, {h.x, 0, 0}, {0, 0, -h.z}, {0, 1, 0});
  addQuad(mesh, {0, -h.y, 0}, {h.x, 0, 0}, {0, 0, h.z}, {0, -1, 0});
  addQuad(mesh, {0, 0, h.z}, {h.x, 0, 0}, {0, h.y, 0}, {0, 0, 1});
  addQuad(mesh, {0, 0, -h.z}, {-h.x, 0, 0}, {0, h.y, 0}, {0, 0, -1});
  return mesh;
}

MeshData makeCylinder(float radius, float height, int segments) {
  MeshData mesh;
  const float hy = height * 0.5f;
  // Side wall: a ring of vertices at the bottom and top.
  for (int i = 0; i <= segments; ++i) {
    const float a = 2.0f * kPi * static_cast<float>(i) / static_cast<float>(segments);
    const Vec3 n{std::sin(a), 0, std::cos(a)};
    mesh.vertices.push_back({{n.x * radius, -hy, n.z * radius}, n});
    mesh.vertices.push_back({{n.x * radius, hy, n.z * radius}, n});
  }
  for (uint32_t i = 0; i < static_cast<uint32_t>(segments); ++i) {
    const uint32_t b = i * 2;
    mesh.indices.insert(mesh.indices.end(), {b, b + 2, b + 3, b, b + 3, b + 1});
  }
  // Caps: a center vertex plus a fan around it.
  for (int side = 0; side < 2; ++side) {
    const float y = side ? hy : -hy;
    const Vec3 n{0, side ? 1.0f : -1.0f, 0};
    const auto center = static_cast<uint32_t>(mesh.vertices.size());
    mesh.vertices.push_back({{0, y, 0}, n});
    for (int i = 0; i <= segments; ++i) {
      const float a = 2.0f * kPi * static_cast<float>(i) / static_cast<float>(segments);
      mesh.vertices.push_back({{std::sin(a) * radius, y, std::cos(a) * radius}, n});
    }
    for (uint32_t i = 0; i < static_cast<uint32_t>(segments); ++i) {
      const uint32_t a = center + 1 + i, b = a + 1;
      if (side) {
        mesh.indices.insert(mesh.indices.end(), {center, a, b});
      } else {
        mesh.indices.insert(mesh.indices.end(), {center, b, a});
      }
    }
  }
  return mesh;
}

MeshData makeSphere(float radius, int segments, int rings) {
  MeshData mesh;
  for (int r = 0; r <= rings; ++r) {
    const float phi = kPi * static_cast<float>(r) / static_cast<float>(rings);
    for (int s = 0; s <= segments; ++s) {
      const float theta = 2.0f * kPi * static_cast<float>(s) / static_cast<float>(segments);
      const Vec3 n{std::sin(phi) * std::sin(theta), std::cos(phi), std::sin(phi) * std::cos(theta)};
      mesh.vertices.push_back({n * radius, n});
    }
  }
  const auto stride = static_cast<uint32_t>(segments + 1);
  for (uint32_t r = 0; r < static_cast<uint32_t>(rings); ++r) {
    for (uint32_t s = 0; s < static_cast<uint32_t>(segments); ++s) {
      const uint32_t a = r * stride + s, b = a + stride;
      mesh.indices.insert(mesh.indices.end(), {a, b, b + 1, a, b + 1, a + 1});
    }
  }
  return mesh;
}

}  // namespace engine
