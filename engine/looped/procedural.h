#pragma once
// Procedural textures: surface materials generated in code from noise, so the
// repo needs no image files. Every texture tiles seamlessly.
//
// A material is two images of the same size:
// - color: rgb = color multiplier, stored halved (0.5 = keep the object's
//   own color, 1.0 = twice as bright), a = gloss multiplier, also halved.
// - bump:  rg = surface slope along u and v (0.5 = flat), from a height map.
#include <cstdint>

#include "looped/image.h"

namespace engine {

struct MaterialImages {
  Image color;
  Image bump;
};

// Planks run along u (8 per tile), with dark gaps and staggered joints.
MaterialImages makeWoodPlanks(int size, uint32_t seed);
// Continuous wood grain running along u, for furniture.
MaterialImages makeWoodGrain(int size, uint32_t seed);
// Red bricks in running bond, 4 across and 12 rows per tile, with mortar.
// Colors are absolute: use a mid-gray (0.5) object color.
MaterialImages makeBrick(int size, uint32_t seed);
// Pebbled leather grain.
MaterialImages makeLeather(int size, uint32_t seed);
// Soft, uneven plaster.
MaterialImages makePlaster(int size, uint32_t seed);
// Fine plain-weave cloth (shirts).
MaterialImages makeFabric(int size, uint32_t seed);
// Diagonal twill weave with faded threads (jeans).
MaterialImages makeDenim(int size, uint32_t seed);
// Fine strands and speckle (avatar hair and stubble).
MaterialImages makeHair(int size, uint32_t seed);

// Tileable noise, all returning 0..1. (u, v) are texture coordinates in
// 0..1; fu/fv is how many noise cells fit across the tile (whole numbers so
// the pattern wraps around seamlessly).
float valueNoise(float u, float v, int fu, int fv, uint32_t seed);
float fbm(float u, float v, int fu, int fv, int octaves, uint32_t seed);
// Distance to the nearest random point ("cells"), in cell units.
float cellNoise(float u, float v, int cells, uint32_t seed);

}  // namespace engine
