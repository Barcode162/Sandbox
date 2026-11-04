#include "looped/scene_geometry.h"

#include <cmath>
#include <unordered_map>

#include "looped/json.h"

namespace engine {

namespace {
Vec3 vec3Of(const Json& j, Vec3 fallback) {
  if (!j.isArray() || j.size() < 3) return fallback;
  return {static_cast<float>(j[0].number()), static_cast<float>(j[1].number()), static_cast<float>(j[2].number())};
}
// A material's value from glTF alone: the colour factor, as if its texture
// averaged mid grey (textures are usually lighter than that; the table knows).
GeoMaterial fromGltf(const ModelMaterial& m) {
  GeoMaterial g;
  const float t = m.baseColorImage >= 0 ? 0.35f : 1.0f;
  g.albedo = {m.baseColor[0] * t, m.baseColor[1] * t, m.baseColor[2] * t};
  g.emission = m.emissive;
  g.metal = m.metallic;
  g.seeThrough = m.blend;
  return g;
}
}  // namespace

bool AlbedoTable::parse(const std::string& text, std::string* error) {
  const Json root = Json::parse(text, error);
  if (!root.isObject()) return false;
  for (const auto& [file, mats] : root.members()) {
    auto& slot = models_[file];
    for (const auto& [name, v] : mats.members()) {
      Entry e;
      e.fix = static_cast<float>(v["fix"].number(1));
      e.m.albedo = vec3Of(v["albedo"], {0.5f, 0.5f, 0.5f}) * e.fix;
      e.m.emission = vec3Of(v["emissive"], {});
      e.m.metal = static_cast<float>(v["metal"].number(0));
      e.m.seeThrough = v["seeThrough"].boolean(false);
      e.rough = static_cast<float>(v["rough"].number(0));
      slot[name] = e;
    }
  }
  return true;
}

GeoMaterial AlbedoTable::lookup(const std::string& file, const ModelMaterial& m) const {
  const auto f = models_.find(file);
  if (f != models_.end()) {
    const auto e = f->second.find(m.name);
    if (e != f->second.end()) return e->second.m;
  }
  return fromGltf(m);
}

float AlbedoTable::fix(const std::string& file, const std::string& material) const {
  const auto f = models_.find(file);
  if (f == models_.end()) return 1;
  const auto e = f->second.find(material);
  return e == f->second.end() ? 1 : e->second.fix;
}

float AlbedoTable::leastRough(const std::string& file, const std::string& material) const {
  const auto f = models_.find(file);
  if (f == models_.end()) return 0;
  const auto e = f->second.find(material);
  return e == f->second.end() ? 0 : e->second.rough;
}

void SceneGeometry::add(const ModelData& model, const Mat4& world, const std::string& file, const AlbedoTable& table,
                        uint32_t modelId) {
  // The model's materials, once each (plus the default for parts without one).
  const auto firstMaterial = static_cast<uint32_t>(materials.size());
  for (const ModelMaterial& m : model.materials) materials.push_back(table.lookup(file, m));
  materials.push_back(GeoMaterial{});
  const auto defaultMaterial = static_cast<uint32_t>(materials.size() - 1);
  for (const ModelPrimitive& p : model.primitives) {
    const bool has = p.material >= 0 && static_cast<size_t>(p.material) < model.materials.size();
    const uint32_t mat = has ? firstMaterial + static_cast<uint32_t>(p.material) : defaultMaterial;
    if (materials[mat].seeThrough) continue;
    const auto base = static_cast<uint32_t>(positions.size());
    for (const ModelVertex& v : p.vertices) {
      const Vec4 w = transformPoint(world, v.position);
      positions.push_back({w.x, w.y, w.z});
    }
    for (size_t i = 0; i + 2 < p.indices.size(); i += 3) {
      indices.push_back(base + p.indices[i]);
      indices.push_back(base + p.indices[i + 1]);
      indices.push_back(base + p.indices[i + 2]);
      triMaterial.push_back(mat);
      triModel.push_back(modelId);
    }
  }
}

size_t SceneGeometry::simplify(float cell) {
  // Each corner snaps to its cell; corners in one cell (and of the same
  // material, so colours don't bleed) become one, at their average.
  struct Key {
    int64_t k;
    bool operator==(const Key& o) const { return k == o.k; }
  };
  struct KeyHash {
    size_t operator()(const Key& k) const { return static_cast<size_t>(k.k * 0x9E3779B97F4A7C15ull >> 17); }
  };
  std::unordered_map<Key, uint32_t, KeyHash> slot;
  slot.reserve(positions.size());
  std::vector<Vec3> sum;
  std::vector<float> count;
  std::vector<uint32_t> remap(positions.size(), ~0u);
  const float inv = 1.0f / cell;
  const size_t before = triangleCount();
  for (size_t t = 0; t < before; ++t) {
    for (int c = 0; c < 3; ++c) {
      const uint32_t v = indices[3 * t + c];
      if (remap[v] != ~0u) continue;
      const Vec3 p = positions[v];
      const int64_t x = static_cast<int64_t>(std::floor(p.x * inv)) & 0xfffff;
      const int64_t y = static_cast<int64_t>(std::floor(p.y * inv)) & 0xfff;
      const int64_t z = static_cast<int64_t>(std::floor(p.z * inv)) & 0xfffff;
      const Key key{(x << 44) ^ (y << 32) ^ (z << 12) ^ (triMaterial[t] & 0xfff)};
      auto it = slot.find(key);
      if (it == slot.end()) {
        it = slot.emplace(key, static_cast<uint32_t>(sum.size())).first;
        sum.push_back({});
        count.push_back(0);
      }
      remap[v] = it->second;
      sum[it->second] = sum[it->second] + p;
      count[it->second] += 1;
    }
  }
  std::vector<Vec3> np(sum.size());
  for (size_t i = 0; i < sum.size(); ++i) np[i] = sum[i] * (1.0f / count[i]);
  std::vector<uint32_t> ni, nm, nmod;
  ni.reserve(indices.size());
  for (size_t t = 0; t < before; ++t) {
    const uint32_t a = remap[indices[3 * t]], b = remap[indices[3 * t + 1]], c = remap[indices[3 * t + 2]];
    if (a == b || b == c || a == c) continue;
    ni.push_back(a), ni.push_back(b), ni.push_back(c);
    nm.push_back(triMaterial[t]);
    nmod.push_back(triModel[t]);
  }
  positions = std::move(np);
  indices = std::move(ni);
  triMaterial = std::move(nm);
  triModel = std::move(nmod);
  return before - triangleCount();
}

Vec3 SceneGeometry::normal(uint32_t tri) const {
  const Vec3 a = corner(tri, 0), b = corner(tri, 1), c = corner(tri, 2);
  const Vec3 n = cross(b - a, c - a);
  const float l = length(n);
  return l > 1e-12f ? n * (1.0f / l) : Vec3{0, 1, 0};
}

float SceneGeometry::area(uint32_t tri) const {
  const Vec3 a = corner(tri, 0), b = corner(tri, 1), c = corner(tri, 2);
  return 0.5f * length(cross(b - a, c - a));
}

}  // namespace engine
