#include "looped/skeleton.h"

namespace engine {

int Skeleton::add(const std::string& name, int parent, Vec3 restPosition) {
  bones.push_back({name, parent, restPosition});
  return static_cast<int>(bones.size()) - 1;
}

int Skeleton::find(const std::string& name) const {
  for (size_t i = 0; i < bones.size(); ++i) {
    if (bones[i].name == name) return static_cast<int>(i);
  }
  return -1;
}

// global = parent's global * (move to this joint) * (this bone's rotation).
// In the rest pose every rotation is identity, so bones only carry offsets.
void Skeleton::globals(const std::vector<Quat>& rot, std::vector<Mat4>& out) const {
  out.resize(bones.size());
  for (size_t i = 0; i < bones.size(); ++i) {
    const Bone& b = bones[i];
    const Quat q = i < rot.size() ? rot[i] : Quat{};
    if (b.parent < 0) {
      out[i] = Mat4::transform(b.restPosition, q);
    } else {
      const Vec3 offset = b.restPosition - bones[static_cast<size_t>(b.parent)].restPosition;
      out[i] = out[static_cast<size_t>(b.parent)] * Mat4::transform(offset, q);
    }
  }
}

void Skeleton::skinMatrices(const std::vector<Quat>& rot, std::vector<Mat4>& out) const {
  globals(rot, out);
  // Undo the rest position first, so the bone rotates vertices about its joint.
  for (size_t i = 0; i < bones.size(); ++i) out[i] = out[i] * Mat4::translation(-bones[i].restPosition);
}

void Skeleton::jointPositions(const std::vector<Quat>& rot, std::vector<Vec3>& out) const {
  std::vector<Mat4> g;
  globals(rot, g);
  out.resize(bones.size());
  for (size_t i = 0; i < bones.size(); ++i) out[i] = {g[i].at(3, 0), g[i].at(3, 1), g[i].at(3, 2)};
}

}  // namespace engine
