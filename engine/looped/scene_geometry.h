#pragma once
// Every still surface of a place as plain triangles in world space, with
// what each is made of (how much light it reflects, how much it glows,
// whether light passes through). The bounced light (looped/radiosity.h) and
// the light tools (tools/native/light_tool.cpp) work on this. Plain C++.
#include <cstdint>
#include <map>
#include <string>
#include <vector>

#include "looped/gltf.h"
#include "looped/math.h"

namespace engine {

// What a surface does with light, in linear light.
struct GeoMaterial {
  Vec3 albedo{0.5f, 0.5f, 0.5f};  // share of light reflected (diffuse)
  Vec3 emission;                   // its own glow (the glTF emissive value, before units)
  float metal = 0;
  bool seeThrough = false;         // glass: light goes through (left out)
};

// Measured materials (assets/models/albedo.json, made by
// tools/albedo_audit.py from the models' textures): per model file, per
// material name, the average albedo, glow and the real-brightness fix
// (L1.4). Models or materials missing from it fall back to their glTF values.
class AlbedoTable {
 public:
  bool parse(const std::string& text, std::string* error = nullptr);
  bool loaded() const { return !models_.empty(); }
  // The material of `file`'s material `m` (fix included).
  GeoMaterial lookup(const std::string& file, const ModelMaterial& m) const;
  // The fix for one material (1 = none): multiplies its base colour in the new lighting.
  float fix(const std::string& file, const std::string& material) const;
  // The least roughness a material may have (M0, assets/models/rough_rules.json; 0 = as made).
  float leastRough(const std::string& file, const std::string& material) const;

 private:
  struct Entry {
    GeoMaterial m;
    float fix = 1;
    float rough = 0;
  };
  std::map<std::string, std::map<std::string, Entry>> models_;
};

struct SceneGeometry {
  std::vector<Vec3> positions;
  std::vector<uint32_t> indices;       // 3 per triangle
  std::vector<uint32_t> triMaterial;   // per triangle: index into materials
  std::vector<uint32_t> triModel;      // per triangle: the placement it came from
  std::vector<GeoMaterial> materials;

  size_t triangleCount() const { return triMaterial.size(); }
  // Adds a model placed with `world`. See-through parts are skipped.
  void add(const ModelData& model, const Mat4& world, const std::string& file, const AlbedoTable& table,
           uint32_t modelId);
  // Merges corners closer than `cell` metres (vertex clustering) and drops
  // the triangles that collapse: a lighter copy for bounced light, where
  // detail under a patch's size doesn't matter. Returns triangles dropped.
  size_t simplify(float cell);
  // A triangle's unit normal (from its winding) and area.
  Vec3 normal(uint32_t tri) const;
  float area(uint32_t tri) const;
  Vec3 corner(uint32_t tri, int k) const { return positions[indices[3 * tri + k]]; }
};

}  // namespace engine
