#include "looped/bake/unwrap.h"

#include <algorithm>
#include <cmath>
#include <numeric>
#include <unordered_map>

namespace engine::bake {

int packShelves(const std::vector<std::pair<int, int>>& sizes, int width, std::vector<std::pair<int, int>>& at) {
  std::vector<size_t> order(sizes.size());
  std::iota(order.begin(), order.end(), size_t{0});
  std::stable_sort(order.begin(), order.end(), [&](size_t a, size_t b) {
    return sizes[a].second != sizes[b].second ? sizes[a].second > sizes[b].second : sizes[a].first > sizes[b].first;
  });
  at.assign(sizes.size(), {0, 0});
  int x = 0, y = 0, shelf = 0;
  for (size_t i : order) {
    const auto [w, h] = sizes[i];
    if (x + w > width && x > 0) {
      y += shelf;
      x = 0;
      shelf = 0;
    }
    at[i] = {x, y};
    x += w;
    shelf = std::max(shelf, h);
  }
  return y + shelf;
}

namespace {

uint64_t edgeKey(uint32_t a, uint32_t b) {
  if (a > b) std::swap(a, b);
  return (static_cast<uint64_t>(a) << 32) | b;
}

}  // namespace

Pieces cutModel(const ModelData& model, const UnwrapSettings& s, const std::vector<bool>* skip) {
  Pieces out;
  std::vector<Pieces::Piece>& pieces = out.pieces;
  const float cosMax = std::cos(radians(s.maxAngle));
  for (size_t pi = 0; pi < model.primitives.size(); ++pi) {
    if (skip && pi < skip->size() && (*skip)[pi]) continue;
    const ModelPrimitive& P = model.primitives[pi];
    const size_t n = P.indices.size() / 3;
    if (n == 0) continue;
    // Corners at the same place are one (glTF splits them for normals and textures).
    std::unordered_map<uint64_t, uint32_t> weld;
    std::vector<uint32_t> same(P.vertices.size());
    for (size_t i = 0; i < P.vertices.size(); ++i) {
      const Vec3 p = P.vertices[i].position;
      auto q = [](float x) { return static_cast<uint64_t>(static_cast<int64_t>(std::llround(x * 1e4)) & 0x1FFFFF); };
      const uint64_t k = q(p.x) | (q(p.y) << 21) | (q(p.z) << 42);
      same[i] = weld.emplace(k, static_cast<uint32_t>(i)).first->second;
    }
    std::vector<Vec3> normal(n);
    std::vector<float> area(n);
    for (size_t t = 0; t < n; ++t) {
      const Vec3 a = P.vertices[P.indices[3 * t]].position, b = P.vertices[P.indices[3 * t + 1]].position,
                 c = P.vertices[P.indices[3 * t + 2]].position;
      const Vec3 x = cross(b - a, c - a);
      const float l = length(x);
      area[t] = 0.5f * l;
      normal[t] = l > 1e-12f ? x * (1.0f / l) : Vec3{0, 1, 0};
      out.area += area[t];
    }
    // Neighbours: triangles sharing an edge.
    std::unordered_map<uint64_t, std::vector<uint32_t>> edges;
    for (size_t t = 0; t < n; ++t)
      for (int k = 0; k < 3; ++k)
        edges[edgeKey(same[P.indices[3 * t + k]], same[P.indices[3 * t + (k + 1) % 3]])].push_back(static_cast<uint32_t>(t));
    // Grow pieces from the biggest faces: a neighbour joins if it faces
    // within maxAngle of the first face.
    std::vector<size_t> order(n);
    std::iota(order.begin(), order.end(), size_t{0});
    std::stable_sort(order.begin(), order.end(), [&](size_t a, size_t b) { return area[a] > area[b]; });
    std::vector<int> pieceOf(n, -1);
    std::vector<uint32_t> queue;
    const size_t firstPiece = pieces.size();
    for (size_t seed : order) {
      if (pieceOf[seed] >= 0) continue;
      const int id = static_cast<int>(pieces.size());
      pieces.push_back({});
      Pieces::Piece& pc = pieces.back();
      pc.prim = static_cast<int>(pi);
      const Vec3 axis = normal[seed];
      const bool tiny = area[seed] < 1e-12f;
      queue.assign(1, static_cast<uint32_t>(seed));
      pieceOf[seed] = id;
      while (!queue.empty()) {
        const uint32_t t = queue.back();
        queue.pop_back();
        pc.tris.push_back(t);
        if (tiny) continue;  // a face with no area stays alone
        for (int k = 0; k < 3; ++k) {
          const auto it = edges.find(edgeKey(same[P.indices[3 * t + k]], same[P.indices[3 * t + (k + 1) % 3]]));
          for (uint32_t o : it->second) {
            if (pieceOf[o] >= 0) continue;
            if (area[o] > 1e-12f && dot(normal[o], axis) < cosMax) continue;
            pieceOf[o] = id;
            queue.push_back(o);
          }
        }
      }
    }
    // Each piece pressed flat along its faces' average way, turned to take the least room.
    for (size_t k = firstPiece; k < pieces.size(); ++k) {
      Pieces::Piece& pc = pieces[k];
      Vec3 avg, mid;
      for (uint32_t t : pc.tris) {
        avg += normal[t] * area[t];
        pc.area += area[t];
        const Vec3 c = (P.vertices[P.indices[3 * t]].position + P.vertices[P.indices[3 * t + 1]].position +
                        P.vertices[P.indices[3 * t + 2]].position) * (1.0f / 3.0f);
        mid += c * std::max(area[t], 1e-12f);
      }
      pc.middle = mid * (1.0f / std::max(pc.area, 1e-12f * static_cast<float>(pc.tris.size())));
      Vec3 axis = length(avg) > 1e-12f ? normalize(avg) : normal[pc.tris[0]];
      for (uint32_t t : pc.tris)
        if (area[t] > 1e-12f && dot(normal[t], axis) < 0.1f) axis = normal[pc.tris[0]];
      pc.normal = axis;
      const Vec3 t0 = std::fabs(axis.y) < 0.9f ? normalize(cross(axis, {0, 1, 0})) : normalize(cross(axis, {1, 0, 0}));
      const Vec3 b0 = cross(axis, t0);
      float best = 1e30f;
      for (int step = 0; step < 18; ++step) {
        const float a = radians(5.0f * static_cast<float>(step));
        const Vec3 u = t0 * std::cos(a) + b0 * std::sin(a), v = cross(axis, u);
        float lo[2] = {1e30f, 1e30f}, hi[2] = {-1e30f, -1e30f};
        for (uint32_t t : pc.tris)
          for (int c = 0; c < 3; ++c) {
            const Vec3 p = P.vertices[P.indices[3 * t + c]].position;
            lo[0] = std::min(lo[0], dot(p, u)), hi[0] = std::max(hi[0], dot(p, u));
            lo[1] = std::min(lo[1], dot(p, v)), hi[1] = std::max(hi[1], dot(p, v));
          }
        const float extU = hi[0] - lo[0], extV = hi[1] - lo[1];
        if (extU * extV < best * 0.999f) {
          best = extU * extV;
          // The longer side across (rows pack tighter).
          if (extU >= extV) pc.u = u, pc.v = v, pc.minU = lo[0], pc.minV = lo[1], pc.extU = extU, pc.extV = extV;
          else pc.u = v, pc.v = u, pc.minU = lo[1], pc.minV = lo[0], pc.extU = extV, pc.extV = extU;
        }
      }
    }
  }
  return out;
}

Unwrap layOut(const ModelData& model, const Pieces& cut, const std::vector<float>& texelOf, int padding) {
  Unwrap out;
  out.prims.resize(model.primitives.size());
  const std::vector<Pieces::Piece>& pieces = cut.pieces;
  out.size.assign(pieces.size(), {0, 0});
  std::vector<std::unordered_map<uint32_t, uint32_t>> spare(model.primitives.size());
  std::unordered_map<uint32_t, uint32_t> mine;
  const float pad = 0.5f * static_cast<float>(padding) + 0.5f;
  for (size_t k = 0; k < pieces.size(); ++k) {
    const Pieces::Piece& pc = pieces[k];
    const float t = k < texelOf.size() ? texelOf[k] : 0;
    const bool kept = t > 0;
    if (kept) {
      out.size[k] = {std::max(1, static_cast<int>(std::ceil(pc.extU / t)) + 1) + padding,
                     std::max(1, static_cast<int>(std::ceil(pc.extV / t)) + 1) + padding};
      out.texels += static_cast<double>(out.size[k].first) * out.size[k].second;
      out.area += pc.area;
      ++out.kept;
    }
    const ModelPrimitive& P = model.primitives[static_cast<size_t>(pc.prim)];
    Unwrap::Prim& o = out.prims[static_cast<size_t>(pc.prim)];
    // A left-out piece's corners are shared with the primitive's other left-out ones.
    std::unordered_map<uint32_t, uint32_t>& map = kept ? mine : spare[static_cast<size_t>(pc.prim)];
    if (kept) mine.clear();  // a corner on another piece is another vertex
    for (uint32_t tri : pc.tris) {
      for (int c = 0; c < 3; ++c) {
        const uint32_t src = P.indices[3 * tri + c];
        auto [it, fresh] = map.emplace(src, static_cast<uint32_t>(o.source.size()));
        if (fresh) {
          const Vec3 p = P.vertices[src].position;
          o.source.push_back(src);
          o.piece.push_back(kept ? static_cast<uint32_t>(k) : Unwrap::kNone);
          o.uv.push_back(kept ? Vec2{pad + (dot(p, pc.u) - pc.minU) / t, pad + (dot(p, pc.v) - pc.minV) / t} : Vec2{});
        }
        o.indices.push_back(it->second);
      }
      o.fromTri.push_back(tri);
    }
  }
  return out;
}

}  // namespace engine::bake
