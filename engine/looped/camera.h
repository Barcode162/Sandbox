#pragma once
// First-person camera: a position plus yaw (turn left/right) and pitch
// (look up/down).
#include "looped/math.h"

namespace engine {

struct FirstPersonCamera {
  Vec3 position{0, 1.65f, 0};  // eye height of a standing person, meters
  float yaw = 0;               // radians; 0 looks down -Z
  float pitch = 0;             // radians; positive looks up
  float fovY = radians(70.0f);

  Vec3 forward() const {
    return {std::sin(yaw) * std::cos(pitch), std::sin(pitch), -std::cos(yaw) * std::cos(pitch)};
  }
  // Walking directions stay level, regardless of where you look.
  Vec3 flatForward() const { return {std::sin(yaw), 0, -std::cos(yaw)}; }
  Vec3 flatRight() const { return {std::cos(yaw), 0, std::sin(yaw)}; }

  void look(float dYaw, float dPitch) {
    yaw += dYaw;
    pitch = clampf(pitch + dPitch, radians(-85.0f), radians(85.0f));
  }

  Mat4 view() const { return Mat4::lookAt(position, position + forward(), {0, 1, 0}); }
  Mat4 projection(float aspect) const { return Mat4::perspective(fovY, aspect, 0.05f, 100.0f); }
};

}  // namespace engine
