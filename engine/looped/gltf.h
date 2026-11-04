#pragma once
// Reads glTF 2.0 binary model files (.glb), the standard format Blender and
// most 3D tools export. Written from scratch: the JSON part is read with
// looped/json.h, geometry is copied out of the binary chunk, and the whole
// node tree is flattened so every primitive is already in model space.
//
// Supported: triangle meshes with positions, normals, texture coordinates
// and tangents (computed if missing), PBR metal/roughness materials with
// base color, metal/roughness, normal, occlusion and emissive values
// (with KHR_materials_emissive_strength).
// Not (yet): animation, skins, morph targets, cameras, lights.
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

#include "looped/math.h"

namespace engine {

struct ModelVertex {
  Vec3 position;
  Vec3 normal;
  Vec2 uv;
  Vec4 tangent;  // xyz = direction of +u on the surface, w = handedness (+1/-1)
};

struct ModelPrimitive {
  std::vector<ModelVertex> vertices;
  std::vector<uint32_t> indices;
  int material = -1;  // index into ModelData::materials, -1 = default
};

// A glTF material. Image indices point into ModelData::images (-1 = none).
struct ModelMaterial {
  std::string name;
  float baseColor[4] = {1, 1, 1, 1};
  float metallic = 1, roughness = 1;
  Vec3 emissive;
  float normalScale = 1, occlusionStrength = 1;
  int baseColorImage = -1, metalRoughImage = -1, normalImage = -1, occlusionImage = -1;
  int emissiveImage = -1;  // glow pattern (screens, lit windows), times `emissive`
  bool blend = false;  // see-through (glTF alphaMode BLEND), e.g. glass
  // A flame volume (J102, the material's extras "looped_flame": 1): the
  // shader draws a fire inside its box (scene.wgsl flameVolume); the base
  // colour holds the box's half width, height and half depth.
  float flame = 0;
};

struct ModelImage {
  std::vector<uint8_t> bytes;  // the PNG/JPEG file as stored
  std::string mimeType;
};

struct ModelData {
  std::vector<ModelPrimitive> primitives;
  std::vector<ModelMaterial> materials;
  std::vector<ModelImage> images;
  Vec3 boundsMin, boundsMax;
};

// Parses a .glb file. Returns false and fills `error` if it can't.
bool parseGlb(const std::vector<uint8_t>& file, ModelData& out, std::string& error);

// The same, a piece at a time, so a big file doesn't stall a frame:
// begin() reads the file's directory, each step() one mesh part, finish()
// the materials and images.
class GlbParser {
 public:
  GlbParser();
  ~GlbParser();
  bool begin(std::vector<uint8_t> file, std::string& error);
  size_t partCount() const;
  bool done() const;
  bool step(ModelData& out, std::string& error);
  bool finish(ModelData& out, std::string& error);  // materials, bounds; sizes out.images
  bool image(size_t index, ModelData& out, std::string& error);  // copies one image out (after finish)

 private:
  struct State;
  std::unique_ptr<State> s_;
};

}  // namespace engine
