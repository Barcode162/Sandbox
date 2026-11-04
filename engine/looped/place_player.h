#pragma once
// Plays a place's things on screen (J86): every frame, each thing's loop
// (looped/world) moves, turns and tints its model, turns its light up or
// down, and draws its small glowing shape (moths, sparks: a "glowbox"),
// which a shy one moves away from you. Any program with a place uses it (the
// bar: bar/world_bar.cpp, which adds its own events; the place viewer).
#include <functional>
#include <vector>

#include "looped/math.h"
#include "looped/scene_renderer.h"
#include "looped/world/world.h"

namespace engine {

class PlacePlayer {
 public:
  // Which model and light each thing drives (thing → index, or -1).
  void build(const world::World& w, const std::vector<int>& modelOfThing, const std::vector<int>& lightOfThing);
  size_t alive() const { return drawn_.size(); }
  // Hands this frame's poses and looks to the renderer; the glowing shapes
  // go into `boxes`. `lightBase` (optional): a light's brightness before its
  // loop (the bar's switch dims some to a quarter).
  void draw(const world::World& w, Vec3 eye, float dt, std::vector<SceneRenderer::Box>& boxes,
            SceneRenderer& renderer, const std::function<float(int light)>& lightBase = nullptr);

 private:
  struct Drawn {  // what a thing drives
    int thing = -1;
    int model = -1, light = -1;
    bool glowbox = false;
    Vec3 away;  // a shy thing: how far it has darted from you
  };
  std::vector<Drawn> drawn_;
};

}  // namespace engine
