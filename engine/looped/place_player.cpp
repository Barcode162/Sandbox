#include "looped/place_player.h"

#include <algorithm>

#include "looped/world/loop.h"

namespace engine {

namespace {
constexpr float kShyDistance = 1.2f;  // metres: closer than this, shy things dart away
}  // namespace

void PlacePlayer::build(const world::World& w, const std::vector<int>& modelOfThing, const std::vector<int>& lightOfThing) {
  drawn_.clear();
  for (size_t i = 0; i < w.size(); ++i) {
    const int t = static_cast<int>(i);
    if (!w.thing(t).kind->still.empty()) continue;  // nothing to play
    Drawn d;
    d.thing = t;
    d.model = i < modelOfThing.size() ? modelOfThing[i] : -1;
    d.light = i < lightOfThing.size() ? lightOfThing[i] : -1;
    d.glowbox = w.part(t, "glowbox").isObject();
    if (d.model >= 0 || d.light >= 0 || d.glowbox) drawn_.push_back(d);
  }
}

void PlacePlayer::draw(const world::World& w, Vec3 eye, float dt, std::vector<SceneRenderer::Box>& boxes,
                       SceneRenderer& renderer, const std::function<float(int light)>& lightBase) {
  for (Drawn& d : drawn_) {
    const world::Thing& t = w.thing(d.thing);
    const world::Motion& m = t.motion;
    if (d.model >= 0) {
      if (!w.stateOf(d.thing).free) renderer.setModelPose(static_cast<size_t>(d.model), t.world);
      const Vec3 tint = m.tint();
      renderer.setModelLook(static_cast<size_t>(d.model), 1 + m.ch[world::kGlow], {1 + tint.x, 1 + tint.y, 1 + tint.z});
    }
    if (d.light >= 0)
      renderer.setLightScale(static_cast<size_t>(d.light),
                             (lightBase ? lightBase(d.light) : 1.0f) * std::max(0.0f, 1 + m.ch[world::kLight]));
    if (d.glowbox) {
      const Json& g = w.part(d.thing, "glowbox");
      const float size = static_cast<float>(g["size"].number(0.01)) * (1 + m.ch[world::kScaleX]);
      if (size <= 1e-4f) continue;
      Vec3 p{t.world.at(3, 0), t.world.at(3, 1), t.world.at(3, 2)};
      // Shy: dart away from you, then drift back once you've gone.
      const float shy = static_cast<float>(g["shy"].number(0));
      Vec3 target{};
      if (shy > 0) {
        const Vec3 away = p - eye;
        const float dist = length(away);
        if (dist < kShyDistance && dist > 1e-3f) target = away * (shy * (1.0f - dist / kShyDistance) / dist);
      }
      d.away = d.away + (target - d.away) * std::min(1.0f, dt * (length(target) > length(d.away) ? 8.0f : 1.5f));
      SceneRenderer::Box b;
      b.center = p + d.away;
      b.size = {size, size, size};
      b.color = world::readVec3(g["color"], {1, 1, 1});
      b.glow = static_cast<float>(g["glow"].number(1)) * std::max(0.0f, 1 + m.ch[world::kGlow]);
      b.roughness = 1;
      if (boxes.size() < renderer.limits().boxes) boxes.push_back(b);
    }
  }
}

}  // namespace engine
