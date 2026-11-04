#pragma once
// Rigid-body physics, written from scratch.
//
// - The world is made of fixed boxes (walls, floor, counter, tables...).
// - Moving bodies are built from a few spheres glued together ("compound
//   spheres"). A glass is rings of small spheres: it can stand on its base,
//   tip over, roll on its side and clink into other glasses. Sphere contacts
//   are cheap and very stable, which suits a phone.
// - Each body and box has an engine::Material, so weight (density),
//   friction and bounciness come from what things are made of.
// - Impacts are reported as events so the sound engine can play them.
//
// The solver: fixed 60 Hz steps of 4 substeps each, applying contact
// impulses (with friction) and pushing overlapping shapes apart. Each sphere
// keeps only one contact per surface direction (two fixed boxes that overlap
// side by side don't push twice). Drawing uses the pose between the last two
// steps (Body::shownPosition/shownRotation), so motion is smooth at any frame
// rate. A body that goes NaN or leaves the room is put back where it last
// was fine.
#include <cstdint>
#include <vector>

#include "looped/material.h"
#include "looped/math.h"

namespace engine {

struct StaticBox {
  Vec3 center;
  Vec3 half;       // half size along the box's own axes
  Quat rotation;
  const Material* material = nullptr;
};

struct BodySphere {
  Vec3 center;  // in body space
  float radius;
};

struct Body {
  // State
  Vec3 position;  // body origin (for a glass: bottom center)
  Quat rotation;
  Vec3 velocity, angularVelocity;
  bool asleep = false;
  // The pose one step ago, and where to draw it this frame (between the
  // two, see PhysicsWorld::step).
  Vec3 prevPosition, shownPosition;
  Quat prevRotation, shownRotation;

  // Shape and mass
  std::vector<BodySphere> spheres;
  Vec3 centerOfMass;  // in body space
  float boundRadius = 0;  // around the center of mass, covers all spheres
  float inverseMass = 0;
  Vec3 inverseInertia;  // diagonal, body space, about the center of mass
  const Material* material = nullptr;

  // Held in the player's hand: pulled toward `holdTarget`, no gravity.
  bool held = false;
  Vec3 holdTarget;

  // Moved from outside (e.g. by another player's phone): no gravity, no
  // contacts push it; each step it moves to `target` / `targetRotation`
  // (its velocity is worked out from that, so it knocks others correctly).
  // Other bodies bump into it as if it were very heavy.
  bool kinematic = false;
  Vec3 target;
  Quat targetRotation;

  float sleepTimer = 0;
  Vec3 sleepAnchor;  // where it was when it last started to settle
  Quat sleepAnchorRotation;
  Vec3 lastGoodPosition;  // the last pose that was finite and in the room
  Quat lastGoodRotation;
  Vec3 worldCenter() const { return position + rotation.rotate(centerOfMass); }
};

// A hard hit, for impact sounds: where, how fast the surfaces met, and what
// they're made of (`other` is null for nothing/unknown).
struct Impact {
  Vec3 point;
  float speed;
  const Material* a;
  const Material* b;
};

class PhysicsWorld {
 public:
  static constexpr float kStep = 1.0f / 60.0f;  // fixed time step, seconds
  static constexpr int kSubsteps = 4;
  static constexpr int kMaxStepsPerFrame = 4;   // a slower frame drops the rest (counted in droppedSteps)

  void addStaticBox(const StaticBox& box);
  // Where bodies may be; outside it (or NaN) a body goes back to its last
  // good pose. Default: everything.
  void setBounds(const Aabb& bounds) { bounds_ = bounds; }
  // Adds a body made of `spheres`. Mass comes from the material's density
  // times `volume` (the real solid volume, e.g. a glass's walls, in m^3).
  size_t addBody(Vec3 position, Quat rotation, std::vector<BodySphere> spheres, float volume,
                 const Material* material);

  // Advances the world by `dt` seconds of frame time, in fixed steps, then
  // sets every body's shownPosition/shownRotation for this frame.
  void step(float dt);
  // Puts a body somewhere at once (no sliding there in the drawing).
  void teleport(size_t i, Vec3 position, Quat rotation);
  // Steps taken so far, and steps skipped because a frame was too slow.
  uint64_t ticks() const { return ticks_; }
  uint64_t droppedSteps() const { return dropped_; }
  // Bodies put back after going NaN or leaving the room.
  int resets() const { return resets_; }

  Body& body(size_t i) { return bodies_[i]; }
  const Body& body(size_t i) const { return bodies_[i]; }
  size_t bodyCount() const { return bodies_.size(); }

  // The nearest body whose bounding sphere the ray hits (-1 = none), and the
  // distance along the ray.
  int raycastBodies(Vec3 origin, Vec3 dir, float maxDist, float* hitDist) const;
  // The nearest fixed box the ray hits: returns false if none.
  bool raycastStatic(Vec3 origin, Vec3 dir, float maxDist, float* hitDist, Vec3* hitNormal) const;

  // Impacts (for sounds) since the last call; only collected once enabled.
  void collectImpacts(bool on) { collectImpacts_ = on; }
  std::vector<Impact> takeImpacts();

 private:
  void fixedStep();
  void substep(float h, float fraction);
  void collideStatic(Body& b);
  void guard(Body& b);
  void collidePair(Body& a, Body& b);
  void applyContact(Body& a, Body* b, Vec3 point, Vec3 normal, float depth, const Material* otherMaterial);
  void updateSleep(Body& b, float dt);
  // The fixed boxes near a point (a grid of 1 m cells over the floor plan).
  void staticsNear(Vec3 center, float radius, std::vector<int>& out) const;
  Vec3 sweptHoldTarget(const Body& b) const;

  std::vector<StaticBox> statics_;
  std::vector<float> staticReach_;  // each box's bounding-sphere radius
  // Grid: cells of kCell m over x/z from gridMin_; each lists box indexes.
  static constexpr float kCell = 1.0f;
  Vec3 gridMin_;
  int gridW_ = 0, gridD_ = 0;
  std::vector<std::vector<int>> grid_;
  std::vector<int> huge_;  // boxes too big for the grid (checked always)
  bool gridDirty_ = true;
  void buildGrid();
  mutable std::vector<uint32_t> seen_;
  mutable uint32_t stamp_ = 0;
  mutable std::vector<int> near_;

  std::vector<Body> bodies_;
  std::vector<Impact> impacts_;
  bool collectImpacts_ = false;
  Aabb bounds_{{-1e9f, -1e9f, -1e9f}, {1e9f, 1e9f, 1e9f}};
  float pending_ = 0;  // frame time not yet simulated
  uint64_t ticks_ = 0, dropped_ = 0;
  int resets_ = 0;
};

}  // namespace engine
