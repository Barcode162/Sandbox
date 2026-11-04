#pragma once
// A skeleton: bones in a parent/child tree (hips -> spine -> chest -> ...).
// A pose gives each bone a rotation relative to its parent; turning that into
// one matrix per bone ("forward kinematics") is what bends a skinned mesh.
#include <string>
#include <vector>

#include "looped/math.h"

namespace engine {

struct Bone {
  std::string name;
  int parent;        // -1 for the root; parents always come before children
  Vec3 restPosition;  // where the joint sits in the rest pose (model space)
};

struct Skeleton {
  std::vector<Bone> bones;

  int add(const std::string& name, int parent, Vec3 restPosition);
  int find(const std::string& name) const;  // -1 if missing

  // Per-bone skinning matrices for a pose (one local rotation per bone).
  // Each maps a rest-pose vertex to its posed position.
  void skinMatrices(const std::vector<Quat>& localRotations, std::vector<Mat4>& out) const;
  // Where each joint ends up in the pose (model space).
  void jointPositions(const std::vector<Quat>& localRotations, std::vector<Vec3>& out) const;

 private:
  void globals(const std::vector<Quat>& localRotations, std::vector<Mat4>& out) const;
};

}  // namespace engine
