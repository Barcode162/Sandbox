#pragma once
// Detail where it's seen (J116.6; request 2026-11-01 #2; the plan:
// docs/plan/jobs/J116.md → Detail where it's seen): our own take on the
// idea behind Unreal's Nanite (Karis, SIGGRAPH 2021), built from scratch for
// WebGL2 and WebGPU alike (no compute shaders).
//
// Built once (in the tools): a model is cut into clusters of about 128
// triangles that touch; neighbouring clusters are joined in small groups,
// each group is simplified to about half its triangles with its outline
// locked (so it still meets its neighbours exactly), and the result is cut
// into new, coarser clusters: their parents. Repeated until a model is a few
// clusters, this makes a tree (a DAG: a cluster can have parents from one
// group only, children from one group only).
//
// Each frame: a cluster is drawn when its error, as seen from the eye, is
// under the limit (about a pixel) and its parents' error isn't. A group's
// clusters and its parents share one error and one bounding sphere, so the
// choice is the same for all of them: either the whole group or its
// simpler version, never half of each, so there are no cracks. What's near
// or big keeps every triangle; what's far is a handful.
//
// Simplifying only moves a corner onto a neighbouring corner (no new
// corners), so every corner keeps its own colour, facing and light-texture
// place; corners where those differ (a seam: the same place, two corners)
// never move. Plain C++.
#include <cstdint>
#include <vector>

#include "looped/math.h"

namespace engine::draw {

struct ClusterSettings {
  int clusterTriangles = 128;  // at most, per cluster
  int groupClusters = 4;       // clusters joined and simplified together
  float keep = 0.5f;           // a group's triangles kept when simplified
  int maxLevels = 24;
};

struct Cluster {
  uint32_t first = 0, count = 0;  // its triangles: indices[3·first .. 3·(first+count))
  int level = 0;                  // 0 = full detail
  // Its own error (metres: how far its surface may be from the full
  // detail) with the sphere it's measured over, and its parents' (the
  // simpler version it's replaced by); a root's parent error is huge.
  Vec3 center;
  float radius = 0;
  float error = 0;
  Vec3 parentCenter;
  float parentRadius = 0;
  float parentError = 1e30f;
};

struct ClusterTree {
  std::vector<uint32_t> indices;  // every cluster's triangles, into the model's own corners
  std::vector<Cluster> clusters;
  int levels = 0;
  uint32_t fullTriangles = 0;   // level 0
  uint32_t rootTriangles = 0;   // the simplest whole
};

// `positions`: the model's corners; `indices`: its triangles (3 a
// triangle). Corners with the same position but a different index are a
// seam and never move.
ClusterTree buildClusters(const std::vector<Vec3>& positions, const std::vector<uint32_t>& indices, const ClusterSettings& s = {});

// How a cluster's error looks from an eye: pixels per metre at a distance
// of 1 m (screen height / (2·tan(fov/2))), and the limit in pixels.
struct DetailView {
  Vec3 eye;             // in the model's space
  float pixelsPerMetre = 1000;
  float limitPixels = 1;
};
// (Pixels = error / distance · pixelsPerMetre, so a uniformly scaled model
// needs only the eye moved into its own space.)

// The clusters to draw (their numbers) for this view.
void pickClusters(const ClusterTree& t, const DetailView& v, std::vector<uint32_t>& out);
// The same, as one index list (into the model's corners), and how many triangles.
uint32_t pickedIndices(const ClusterTree& t, const std::vector<uint32_t>& picked, std::vector<uint32_t>& out);

}  // namespace engine::draw
