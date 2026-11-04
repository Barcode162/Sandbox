#pragma once
// Lightmap charts (J116.3): a model's surfaces laid out flat, so light
// worked out once can be stored in a picture and read back by the GPU (a
// second set of texture places, "UV2"). Like peeling an orange: the model is
// cut into nearly flat pieces (charts: connected faces that all face within
// a few tens of degrees of one way), each piece is pressed flat along that
// way, turned to take the least room, and the pieces are packed side by
// side with a gap. Our own, from scratch (no Blender here; no outside
// libraries at run time, Charter). Plain C++.
#include <cstdint>
#include <utility>
#include <vector>

#include "looped/gltf.h"
#include "looped/math.h"

namespace engine::bake {

struct UnwrapSettings {
  float texel = 0.05f;     // metres a texel, at the model's own size
  int padding = 2;         // empty texels between pieces (no light bleeds across)
  float maxAngle = 40.0f;  // degrees a piece's faces may turn from its first face
};

// A model cut into pieces: each nearly flat, with the two directions it's
// pressed flat along (metres, model space) and its extent along them.
struct Pieces {
  struct Piece {
    int prim = 0;
    std::vector<uint32_t> tris;  // in the primitive
    Vec3 u, v, normal, middle;   // flat directions, facing, area-weighted middle
    float minU = 0, minV = 0, extU = 0, extV = 0;  // metres
    float area = 0;              // m²
  };
  std::vector<Piece> pieces;
  float area = 0;
};
Pieces cutModel(const ModelData& model, const UnwrapSettings& s, const std::vector<bool>* skip = nullptr);

// A model's pieces ready to place: each primitive's triangles re-indexed so
// a vertex never sits on two pieces, and each vertex's place inside its
// piece (texels, the gap included). Where a piece goes in the atlas is up
// to the caller (each placement of a model can put its pieces elsewhere).
struct Unwrap {
  static constexpr uint32_t kNone = 0xFFFFFFFFu;  // a left-out piece: lit another way (probes)
  struct Prim {
    std::vector<uint32_t> source;   // per new vertex: the primitive's vertex it copies
    std::vector<uint32_t> piece;    // per new vertex: its piece, or kNone
    std::vector<Vec2> uv;           // per new vertex: texels from the piece's corner
    std::vector<uint32_t> indices;  // the triangles, over the new vertices
    std::vector<uint32_t> fromTri;  // per new triangle: the primitive's triangle it is
  };
  std::vector<Prim> prims;  // as ModelData::primitives (a left-out one is empty)
  std::vector<std::pair<int, int>> size;  // per piece: texels with its gap (0 x 0 = left out)
  int kept = 0;
  double texels = 0;  // all kept pieces' rectangles
  float area = 0;     // m² of the kept faces
};

// Lays the pieces out: piece i at `texel[i]` metres a texel (at the model's
// own size), or, at 0, left out.
Unwrap layOut(const ModelData& model, const Pieces& pieces, const std::vector<float>& texel, int padding);

// Rectangles (w, h) packed in rows ("shelves") on a strip `width` wide,
// tallest first. `at` gets each one's corner; returns the height used.
int packShelves(const std::vector<std::pair<int, int>>& sizes, int width, std::vector<std::pair<int, int>>& at);

}  // namespace engine::bake
