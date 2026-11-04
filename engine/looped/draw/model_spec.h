#pragma once
// What a model must be (J116.6; request 2026-11-01 #3): the new skeleton
// draws every model as clusters with simpler versions (clusters.h), and
// that only works well when a model is made a certain way. These are the
// rules, each with the number it's measured by, why it matters and how to
// fix it. The tools check every model against them (node tools/clusters.mjs
// spec); a model that breaks one is remade, not worked around. Plain C++.
//
// Three rules must hold: a big model (2,000+ triangles) simplifies to a
// quarter; no more triangles than its size needs; at most 8 materials with a
// picture (plain colours cost nothing: the new frame keeps them per corner).
// When a big model doesn't simplify, the usual causes are named with it:
// texture seams, swarms of loose pieces, open edges.
//
// Measured after joining corners that share a position and a texture place
// (the new frame shades by each triangle's own facing, so split normals
// don't count as seams).
#include <cstdint>
#include <string>
#include <vector>

namespace engine::draw {

struct ModelMeasure {
  uint32_t triangles = 0;
  uint32_t corners = 0;       // after joining
  float seamShare = 0;        // corners that share their position with another corner (texture seams)
  uint32_t parts = 0;         // separate pieces (nothing joins them)
  float trianglesPerPart = 0;
  float openShare = 0;        // edges with a triangle on one side only (holes, open sheets)
  float simplestShare = 0;    // the simplest whole version, as a share of every triangle
  uint32_t materials = 0;
  uint32_t pictured = 0;      // materials with a picture (plain colours are kept per corner in the new frame)
  float size = 0;             // its biggest side (metres)
  std::string file;           // its file name ("credit_coin.glb"), for the models seen up close
};

struct ModelRule {
  const char* id;     // "M-SEAMS"
  const char* rule;   // the rule, in plain words
  const char* why;
  const char* fix;
};

struct ModelProblem {
  const ModelRule* rule;
  std::string measured;  // "38% of corners on seams (at most 20%)"
  bool cause = false;    // not a rule of its own: why M-SIMPLIFY failed
};

// The rules, in order.
const std::vector<ModelRule>& modelRules();
// The rules a measured model breaks.
std::vector<ModelProblem> checkModel(const ModelMeasure& m);

}  // namespace engine::draw

namespace engine {
struct ModelData;
}

namespace engine::draw {
struct ClusterTree;
// Measures a model for the spec: joins corners (position, and texture
// place where its material has a picture), builds each part's clusters
// (`trees`, when given, gets them), and counts seams, pieces, open edges.
ModelMeasure measureModel(const ModelData& m, std::vector<ClusterTree>* trees = nullptr);
}  // namespace engine::draw
