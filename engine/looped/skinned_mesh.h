#pragma once
// Skinned meshes: one smooth mesh whose vertices follow up to two bones each
// (blending near joints, so elbows and knees bend instead of breaking).
// Plus builders for body-like shapes: tubes (limbs, torso) and ellipsoids.
#include <webgpu/webgpu_cpp.h>

#include <cstdint>
#include <functional>
#include <vector>

#include "looped/math.h"

namespace engine {

struct SkinnedVertex {
  Vec3 position;  // rest pose, model space
  Vec3 normal;
  uint8_t color[4];     // rgb = color (display space), a = gloss
  uint8_t joints[4];    // bone indices
  uint8_t weights[4];   // how much each bone pulls (sums to 255)
  uint8_t material[4];  // x = texture layer + 1 (0 = untextured)
};
static_assert(sizeof(SkinnedVertex) == 40);

struct SkinnedMeshData {
  std::vector<SkinnedVertex> vertices;
  std::vector<uint32_t> indices;
};

// Which bones move a vertex: `a` alone, blending toward `b` by `t` (0..1).
struct Skin {
  int a = 0, b = 0;
  float t = 0;
};

// Surface look: color (display space), gloss (0..1), texture layer (-1 = none).
struct Paint {
  Vec3 color{1, 1, 1};
  float gloss = 0.2f;
  int layer = -1;
};

// One cross-section of a tube: an ellipse around `center`.
struct Ring {
  Vec3 center;
  float r1, r2;  // radius along the tube's "side" direction, and across it
  Skin skin;
  Paint paint;
};

// A tube through the rings (at least 2), closed at both ends. `side` picks
// which way r1 points (e.g. +X for a vertical limb).
void addTube(SkinnedMeshData& mesh, const std::vector<Ring>& rings, Vec3 side, int segments = 16);

// An ellipsoid. `keep` (optional) decides per vertex whether its triangles
// are kept, to cut shapes like a hair cap.
void addEllipsoid(SkinnedMeshData& mesh, Vec3 center, Vec3 radii, Skin skin, Paint paint, int segments = 20,
                  int rings = 14, const std::function<bool(Vec3)>& keep = nullptr);

struct SkinnedMesh {
  wgpu::Buffer vertexBuffer;
  wgpu::Buffer indexBuffer;
  uint32_t indexCount = 0;

  static SkinnedMesh upload(const wgpu::Device& device, const SkinnedMeshData& data);
  static wgpu::VertexBufferLayout vertexLayout();
};

}  // namespace engine
