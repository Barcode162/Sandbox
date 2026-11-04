#pragma once
// Geometry on the CPU (built in code, no model files): vertices and
// triangle indices. No GPU code here, so native tests can use it;
// looped/mesh.h uploads it.
#include <cstdint>
#include <vector>

#include "looped/math.h"

namespace engine {

struct Vertex {
  Vec3 position;
  Vec3 normal;
};

struct MeshData {
  std::vector<Vertex> vertices;
  std::vector<uint32_t> indices;
};

// All shapes are centered on the origin.
MeshData makeBox(Vec3 size);
MeshData makeCylinder(float radius, float height, int segments = 24);
MeshData makeSphere(float radius, int segments = 24, int rings = 16);

}  // namespace engine
