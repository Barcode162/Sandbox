// Measuring a model for the spec (J116.6): see model_spec.h.
#include <algorithm>
#include <map>
#include <set>
#include <tuple>

#include "looped/draw/clusters.h"
#include "looped/draw/model_spec.h"
#include "looped/gltf.h"

namespace engine::draw {

ModelMeasure measureModel(const ModelData& m, std::vector<ClusterTree>* trees) {
  ModelMeasure M;
  uint32_t root = 0, seams = 0, edges = 0, open = 0;
  for (const ModelPrimitive& p : m.primitives) {
    if (p.indices.empty()) continue;
    // The new frame shades each triangle by its own facing, so only the
    // position and (for a pictured material) the texture place make a corner.
    const ModelMaterial* mat = p.material >= 0 && static_cast<size_t>(p.material) < m.materials.size() ? &m.materials[static_cast<size_t>(p.material)] : nullptr;
    const bool pictured = mat && (mat->baseColorImage >= 0 || mat->normalImage >= 0 || mat->emissiveImage >= 0 || mat->metalRoughImage >= 0 ||
                                  mat->occlusionImage >= 0);
    std::map<std::tuple<float, float, float, float, float>, uint32_t> weld;
    std::vector<uint32_t> remap(p.vertices.size());
    std::vector<Vec3> pos;
    for (size_t i = 0; i < p.vertices.size(); ++i) {
      const ModelVertex& v = p.vertices[i];
      auto k = std::make_tuple(v.position.x, v.position.y, v.position.z, pictured ? v.uv.x : 0.0f, pictured ? v.uv.y : 0.0f);
      auto it = weld.find(k);
      if (it == weld.end()) it = weld.emplace(k, static_cast<uint32_t>(pos.size())).first, pos.push_back(v.position);
      remap[i] = it->second;
    }
    std::vector<uint32_t> idx(p.indices.size());
    for (size_t i = 0; i < idx.size(); ++i) idx[i] = remap[p.indices[i]];
    ClusterTree t = buildClusters(pos, idx);
    M.triangles += t.fullTriangles;
    root += t.rootTriangles;
    // Seams, pieces, open edges, by place.
    std::map<std::tuple<float, float, float>, uint32_t> place;
    std::vector<uint32_t> placeOf(pos.size());
    std::map<uint32_t, int> cornersAt;
    for (size_t i = 0; i < pos.size(); ++i) {
      auto k = std::make_tuple(pos[i].x, pos[i].y, pos[i].z);
      auto it = place.find(k);
      if (it == place.end()) it = place.emplace(k, static_cast<uint32_t>(place.size())).first;
      placeOf[i] = it->second;
      ++cornersAt[it->second];
    }
    for (size_t i = 0; i < pos.size(); ++i) seams += cornersAt[placeOf[i]] > 1;
    std::vector<uint32_t> parent(place.size());
    for (uint32_t i = 0; i < parent.size(); ++i) parent[i] = i;
    auto find = [&](uint32_t x) {
      while (parent[x] != x) x = parent[x] = parent[parent[x]];
      return x;
    };
    std::map<std::pair<uint32_t, uint32_t>, int> edgeUse;
    for (size_t i = 0; i + 2 < idx.size(); i += 3) {
      const uint32_t a = placeOf[idx[i]], b = placeOf[idx[i + 1]], c = placeOf[idx[i + 2]];
      parent[find(b)] = find(a), parent[find(c)] = find(a);
      for (auto [x, y] : {std::make_pair(a, b), std::make_pair(b, c), std::make_pair(c, a)}) ++edgeUse[{std::min(x, y), std::max(x, y)}];
    }
    std::set<uint32_t> roots;
    for (uint32_t i = 0; i < parent.size(); ++i) roots.insert(find(i));
    for (const auto& [e, n] : edgeUse) open += n == 1;
    edges += static_cast<uint32_t>(edgeUse.size());
    M.corners += static_cast<uint32_t>(pos.size());
    M.parts += static_cast<uint32_t>(roots.size());
    if (trees) trees->push_back(std::move(t));
  }
  M.seamShare = M.corners ? static_cast<float>(seams) / static_cast<float>(M.corners) : 0;
  M.openShare = edges ? static_cast<float>(open) / static_cast<float>(edges) : 0;
  M.trianglesPerPart = M.parts ? static_cast<float>(M.triangles) / static_cast<float>(M.parts) : 0;
  M.simplestShare = M.triangles ? static_cast<float>(root) / static_cast<float>(M.triangles) : 0;
  M.materials = static_cast<uint32_t>(m.materials.size());
  for (const ModelMaterial& mm : m.materials)
    M.pictured += mm.baseColorImage >= 0 || mm.normalImage >= 0 || mm.emissiveImage >= 0 || mm.metalRoughImage >= 0 || mm.occlusionImage >= 0;
  const Vec3 ext = m.boundsMax - m.boundsMin;
  M.size = std::max({ext.x, ext.y, ext.z});
  return M;
}

}  // namespace engine::draw
