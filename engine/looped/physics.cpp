#include "looped/physics.h"

#include <algorithm>
#include <cmath>

namespace engine {
namespace {

constexpr Vec3 kGravity{0, -9.81f, 0};
constexpr float kSlop = 0.0005f;           // allowed overlap, avoids jitter
constexpr float kPushFraction = 0.6f;      // share of overlap fixed per substep
constexpr float kBounceThreshold = 0.4f;   // slower impacts don't bounce (m/s)
constexpr float kImpactThreshold = 0.25f;  // slower impacts make no sound (m/s)
constexpr float kSleepLinear = 0.1f;       // m/s
constexpr float kSleepAngular = 0.4f;      // rad/s
constexpr float kSleepTime = 0.5f;         // seconds of stillness before sleeping
// Jiggling in place (tiny contact buzz) also counts as still: the body may
// wobble this much around where it started settling.
constexpr float kSleepDrift = 0.002f;      // m
constexpr float kSleepDriftAngle = 0.03f;  // rad (about 1.7 degrees)
constexpr float kJiggleLinear = 0.3f;      // faster than this is real motion
constexpr float kJiggleAngular = 3.0f;
constexpr float kHoldStiffness = 14.0f;    // how hard a held body chases its target
constexpr float kHoldMaxSpeed = 6.0f;
constexpr float kMaxAngularSpeed = 40.0f;
constexpr float kMaxSpeed = 15.0f;         // m/s; faster would pass through walls between substeps

// Applies the world-space inverse inertia: rotate into body space, scale,
// rotate back.
Vec3 applyInverseInertia(const Body& b, Vec3 v) {
  return b.rotation.rotate(mulComponents(b.inverseInertia, conjugate(b.rotation).rotate(v)));
}

Vec3 velocityAt(const Body& b, Vec3 point) {
  return b.velocity + cross(b.angularVelocity, point - b.worldCenter());
}

void applyImpulse(Body& b, Vec3 point, Vec3 impulse) {
  if (b.kinematic) return;
  if (b.held) {
    // A held body is moved by the hand; contacts only nudge it a little.
    impulse = impulse * 0.3f;
  }
  b.velocity += impulse * b.inverseMass;
  b.angularVelocity += applyInverseInertia(b, cross(point - b.worldCenter(), impulse));
}

// How much a unit impulse along `n` at `point` changes the speed there.
float impulseResponse(const Body& b, Vec3 point, Vec3 n) {
  if (b.kinematic) return 0;
  const Vec3 r = point - b.worldCenter();
  return b.inverseMass + dot(n, cross(applyInverseInertia(b, cross(r, n)), r));
}

// Combined surface values: friction averages (geometric mean), bounce takes
// the larger, like most engines.
float combinedFriction(const Material* a, const Material* b) {
  const float fa = a ? a->friction : 0.5f, fb = b ? b->friction : 0.5f;
  return std::sqrt(fa * fb);
}
float combinedBounce(const Material* a, const Material* b) {
  return std::max(a ? a->restitution : 0.3f, b ? b->restitution : 0.3f);
}

}  // namespace

size_t PhysicsWorld::addBody(Vec3 position, Quat rotation, std::vector<BodySphere> spheres, float volume,
                             const Material* material) {
  Body b;
  b.position = position;
  b.rotation = rotation;
  b.material = material;
  b.spheres = std::move(spheres);
  const float mass = std::max(0.01f, (material ? material->density : 1000.0f) * volume);
  b.inverseMass = 1.0f / mass;

  // Mass is spread evenly over the spheres (weighted by volume); inertia
  // adds each sphere's own spin resistance to its offset from the center.
  float total = 0;
  Vec3 com;
  for (const BodySphere& s : b.spheres) {
    const float w = s.radius * s.radius * s.radius;
    com += s.center * w;
    total += w;
  }
  com = com * (1.0f / total);
  b.centerOfMass = com;
  Vec3 inertia;
  for (const BodySphere& s : b.spheres) {
    const float m = mass * (s.radius * s.radius * s.radius) / total;
    const Vec3 d = s.center - com;
    const float own = 0.4f * m * s.radius * s.radius;
    inertia += Vec3{m * (d.y * d.y + d.z * d.z) + own, m * (d.x * d.x + d.z * d.z) + own,
                    m * (d.x * d.x + d.y * d.y) + own};
    b.boundRadius = std::max(b.boundRadius, length(d) + s.radius);
  }
  b.inverseInertia = {1.0f / inertia.x, 1.0f / inertia.y, 1.0f / inertia.z};
  b.prevPosition = b.shownPosition = b.lastGoodPosition = b.sleepAnchor = b.target = position;
  b.prevRotation = b.shownRotation = b.lastGoodRotation = b.sleepAnchorRotation = b.targetRotation = rotation;
  bodies_.push_back(std::move(b));
  return bodies_.size() - 1;
}

void PhysicsWorld::addStaticBox(const StaticBox& box) {
  statics_.push_back(box);
  staticReach_.push_back(length(box.half));
  gridDirty_ = true;
}

void PhysicsWorld::buildGrid() {
  gridDirty_ = false;
  grid_.clear();
  huge_.clear();
  Aabb all = Aabb::empty();
  std::vector<Aabb> boxes;
  for (size_t i = 0; i < statics_.size(); ++i) {
    const float r = staticReach_[i];
    const Vec3 c = statics_[i].center;
    boxes.push_back({c - Vec3{r, r, r}, c + Vec3{r, r, r}});
    all.add(boxes.back().min);
    all.add(boxes.back().max);
  }
  if (statics_.empty()) return;
  gridMin_ = all.min;
  gridW_ = std::max(1, static_cast<int>(std::ceil((all.max.x - all.min.x) / kCell)));
  gridD_ = std::max(1, static_cast<int>(std::ceil((all.max.z - all.min.z) / kCell)));
  grid_.assign(static_cast<size_t>(gridW_) * gridD_, {});
  for (size_t i = 0; i < statics_.size(); ++i) {
    const int x0 = static_cast<int>((boxes[i].min.x - gridMin_.x) / kCell);
    const int x1 = std::min(gridW_ - 1, static_cast<int>((boxes[i].max.x - gridMin_.x) / kCell));
    const int z0 = static_cast<int>((boxes[i].min.z - gridMin_.z) / kCell);
    const int z1 = std::min(gridD_ - 1, static_cast<int>((boxes[i].max.z - gridMin_.z) / kCell));
    if ((x1 - x0 + 1) * (z1 - z0 + 1) > 64) {  // the floor, long walls: always checked
      huge_.push_back(static_cast<int>(i));
      continue;
    }
    for (int z = z0; z <= z1; ++z) {
      for (int x = x0; x <= x1; ++x) grid_[static_cast<size_t>(z) * gridW_ + x].push_back(static_cast<int>(i));
    }
  }
  seen_.assign(statics_.size(), 0);
}

void PhysicsWorld::staticsNear(Vec3 center, float radius, std::vector<int>& out) const {
  out.clear();
  out.insert(out.end(), huge_.begin(), huge_.end());
  if (grid_.empty()) return;
  if (++stamp_ == 0) {
    std::fill(seen_.begin(), seen_.end(), 0);
    stamp_ = 1;
  }
  const int x0 = std::max(0, static_cast<int>(std::floor((center.x - radius - gridMin_.x) / kCell)));
  const int x1 = std::min(gridW_ - 1, static_cast<int>(std::floor((center.x + radius - gridMin_.x) / kCell)));
  const int z0 = std::max(0, static_cast<int>(std::floor((center.z - radius - gridMin_.z) / kCell)));
  const int z1 = std::min(gridD_ - 1, static_cast<int>(std::floor((center.z + radius - gridMin_.z) / kCell)));
  for (int z = z0; z <= z1; ++z) {
    for (int x = x0; x <= x1; ++x) {
      for (int i : grid_[static_cast<size_t>(z) * gridW_ + x]) {
        if (seen_[static_cast<size_t>(i)] == stamp_) continue;
        seen_[static_cast<size_t>(i)] = stamp_;
        out.push_back(i);
      }
    }
  }
}

void PhysicsWorld::step(float dt) {
  if (gridDirty_) buildGrid();
  pending_ += std::clamp(dt, 0.0f, 1.0f);
  int steps = static_cast<int>(pending_ / kStep);
  if (steps > kMaxStepsPerFrame) {  // a long stall: drop the rest instead of a burst of work
    dropped_ += static_cast<uint64_t>(steps - kMaxStepsPerFrame);
    pending_ -= static_cast<float>(steps - kMaxStepsPerFrame) * kStep;
    steps = kMaxStepsPerFrame;
  }
  for (int i = 0; i < steps; ++i) {
    pending_ -= kStep;
    fixedStep();
  }
  pending_ = std::max(pending_, 0.0f);
  // Draw each body between its last two steps (how far into the next step
  // this frame is), so motion is smooth whatever the frame rate.
  const float alpha = clampf(pending_ / kStep, 0, 1);
  for (Body& b : bodies_) {
    if (b.asleep) {
      b.shownPosition = b.position;
      b.shownRotation = b.rotation;
      continue;
    }
    b.shownPosition = lerp(b.prevPosition, b.position, alpha);
    b.shownRotation = nlerp(b.prevRotation, b.rotation, alpha);
  }
}

void PhysicsWorld::teleport(size_t i, Vec3 position, Quat rotation) {
  Body& b = bodies_[i];
  b.position = b.prevPosition = b.shownPosition = b.lastGoodPosition = b.target = b.sleepAnchor = position;
  b.rotation = b.prevRotation = b.shownRotation = b.lastGoodRotation = b.targetRotation = b.sleepAnchorRotation =
      rotation;
  b.sleepTimer = 0;
}

void PhysicsWorld::fixedStep() {
  ++ticks_;
  for (Body& b : bodies_) {
    b.prevPosition = b.position;
    b.prevRotation = b.rotation;
    if (b.kinematic) {
      // Glide to the target over this step (the velocity lets it knock others).
      b.velocity = (b.target - b.position) * (1.0f / kStep);
      b.angularVelocity = {};
    }
  }
  for (int i = 0; i < kSubsteps; ++i) substep(kStep / kSubsteps, static_cast<float>(i + 1) / kSubsteps);
  for (Body& b : bodies_) {
    if (b.kinematic) {
      b.position = b.target;
      b.rotation = normalized(b.targetRotation);
    }
    guard(b);
    updateSleep(b, kStep);
  }
}

// NaN or outside the room: back to the last good pose, at rest.
void PhysicsWorld::guard(Body& b) {
  const bool ok = isFinite(b.position) && isFinite(b.rotation) && isFinite(b.velocity) &&
                  isFinite(b.angularVelocity) && bounds_.contains(b.position);
  if (ok) {
    b.lastGoodPosition = b.position;
    b.lastGoodRotation = b.rotation;
    return;
  }
  ++resets_;
  b.position = b.prevPosition = b.target = b.lastGoodPosition;
  b.rotation = b.prevRotation = b.targetRotation = b.lastGoodRotation;
  b.velocity = b.angularVelocity = {};
  b.sleepTimer = 0;
}

// Where a held body may go: toward the hand, but not into a wall.
Vec3 PhysicsWorld::sweptHoldTarget(const Body& b) const {
  const Vec3 from = b.worldCenter();
  const Vec3 move = b.holdTarget - b.position;
  const float len = length(move);
  if (len < 1e-5f) return b.holdTarget;
  const Vec3 dir = move * (1.0f / len);
  float hit;
  if (!raycastStatic(from, dir, len + b.boundRadius, &hit, nullptr)) return b.holdTarget;
  return b.position + dir * std::max(0.0f, hit - b.boundRadius);
}

void PhysicsWorld::substep(float h, float /*fraction*/) {
  for (Body& b : bodies_) {
    if (b.asleep || b.kinematic) continue;
    if (b.held) {
      // Chase the hand: velocity toward the target, rotation toward upright.
      Vec3 v = (sweptHoldTarget(b) - b.position) * kHoldStiffness;
      const float speed = length(v);
      if (speed > kHoldMaxSpeed) v = v * (kHoldMaxSpeed / speed);
      b.velocity = v;
      // cross(up, worldUp) is the axis (scaled by the sine of the tilt) that
      // turns the body back upright.
      const Vec3 up = b.rotation.rotate({0, 1, 0});
      b.angularVelocity = cross(up, {0, 1, 0}) * 10.0f;
    } else {
      b.velocity += kGravity * h;
    }
  }

  // Contacts: against the fixed world, then between bodies.
  for (Body& b : bodies_) {
    if (!b.asleep && !b.kinematic) collideStatic(b);
  }
  for (size_t i = 0; i < bodies_.size(); ++i) {
    for (size_t j = i + 1; j < bodies_.size(); ++j) {
      Body &a = bodies_[i], &b = bodies_[j];
      if (a.asleep && b.asleep) continue;
      if (a.kinematic && b.kinematic) continue;
      const Vec3 d = a.worldCenter() - b.worldCenter();
      const float r = a.boundRadius + b.boundRadius;
      if (dot(d, d) < r * r) collidePair(a, b);
    }
  }

  // Integrate.
  for (Body& b : bodies_) {
    if (b.asleep) continue;
    if (b.kinematic) {
      b.position += b.velocity * h;
      continue;
    }
    const float speed = length(b.velocity);
    if (speed > kMaxSpeed) b.velocity = b.velocity * (kMaxSpeed / speed);
    const float spin = length(b.angularVelocity);
    if (spin > kMaxAngularSpeed) b.angularVelocity = b.angularVelocity * (kMaxAngularSpeed / spin);
    // Rotate around the center of mass, not the origin.
    const Vec3 comBefore = b.worldCenter();
    if (spin > 1e-6f) {
      const float s = std::min(spin, kMaxAngularSpeed);
      const Quat dq = Quat::axisAngle(b.angularVelocity * (1.0f / spin), s * h);
      b.rotation = normalized(dq * b.rotation);
    }
    b.position = b.position + (comBefore - b.worldCenter()) + b.velocity * h;
  }
}

void PhysicsWorld::collideStatic(Body& b) {
  const Vec3 center = b.worldCenter();
  staticsNear(center, b.boundRadius, near_);
  // One contact per sphere and surface direction: where fixed boxes overlap
  // side by side (the counter top is several), the sphere touches both tops
  // with the same normal; pushing twice made glasses jiggle forever.
  struct Hit {
    Vec3 normal, contact;
    float depth;
    const Material* material;
  };
  Hit hits[8];
  for (const BodySphere& s : b.spheres) {
    const Vec3 world = b.position + b.rotation.rotate(s.center);
    int count = 0;
    for (int bi : near_) {
      const StaticBox& box = statics_[static_cast<size_t>(bi)];
      // Quick reject: the sphere vs the box's bounding sphere.
      const Vec3 toBox = world - box.center;
      const float reach = s.radius + staticReach_[static_cast<size_t>(bi)];
      if (dot(toBox, toBox) > reach * reach) continue;
      const Vec3 local = conjugate(box.rotation).rotate(toBox);
      const Vec3 clamped{std::clamp(local.x, -box.half.x, box.half.x), std::clamp(local.y, -box.half.y, box.half.y),
                         std::clamp(local.z, -box.half.z, box.half.z)};
      const Vec3 diff = local - clamped;
      const float dist2 = dot(diff, diff);
      if (dist2 > s.radius * s.radius) continue;
      Vec3 normalLocal;
      float depth;
      if (dist2 > 1e-12f) {
        const float dist = std::sqrt(dist2);
        normalLocal = diff * (1.0f / dist);
        depth = s.radius - dist;
      } else {
        // Center inside the box: leave through the nearest face.
        const float px = box.half.x - std::fabs(local.x), py = box.half.y - std::fabs(local.y),
                    pz = box.half.z - std::fabs(local.z);
        if (px <= py && px <= pz) {
          normalLocal = {local.x < 0 ? -1.0f : 1.0f, 0, 0};
          depth = px + s.radius;
        } else if (py <= pz) {
          normalLocal = {0, local.y < 0 ? -1.0f : 1.0f, 0};
          depth = py + s.radius;
        } else {
          normalLocal = {0, 0, local.z < 0 ? -1.0f : 1.0f};
          depth = pz + s.radius;
        }
      }
      const Vec3 normal = box.rotation.rotate(normalLocal);
      const Hit hit{normal, world - normal * s.radius, depth, box.material};
      int same = -1;
      for (int k = 0; k < count; ++k) {
        if (dot(hits[k].normal, normal) > 0.95f) same = k;
      }
      if (same >= 0) {
        if (depth > hits[same].depth) hits[same] = hit;  // keep the deeper one
      } else if (count < 8) {
        hits[count++] = hit;
      }
    }
    for (int k = 0; k < count; ++k) applyContact(b, nullptr, hits[k].contact, hits[k].normal, hits[k].depth, hits[k].material);
  }
}

void PhysicsWorld::collidePair(Body& a, Body& b) {
  for (const BodySphere& sa : a.spheres) {
    const Vec3 pa = a.position + a.rotation.rotate(sa.center);
    for (const BodySphere& sb : b.spheres) {
      const Vec3 pb = b.position + b.rotation.rotate(sb.center);
      const Vec3 d = pa - pb;
      const float r = sa.radius + sb.radius;
      const float dist2 = dot(d, d);
      if (dist2 >= r * r || dist2 < 1e-12f) continue;
      const float dist = std::sqrt(dist2);
      const Vec3 n = d * (1.0f / dist);  // from b toward a
      a.asleep = b.asleep = false;
      a.sleepTimer = b.sleepTimer = 0;
      applyContact(a, &b, pb + n * sb.radius, n, r - dist, b.material);
    }
  }
}

// One contact between `a` and `b` (b = null for the fixed world). `normal`
// points from b toward a.
void PhysicsWorld::applyContact(Body& a, Body* b, Vec3 point, Vec3 normal, float depth,
                                const Material* otherMaterial) {
  const Vec3 rel = velocityAt(a, point) - (b ? velocityAt(*b, point) : Vec3{});
  const float vn = dot(rel, normal);
  if (vn < 0) {
    if (collectImpacts_ && -vn > kImpactThreshold && !a.held && impacts_.size() < 256) {
      impacts_.push_back({point, -vn, a.material, otherMaterial});
    }
    const float k = impulseResponse(a, point, normal) + (b ? impulseResponse(*b, point, normal) : 0);
    if (k <= 1e-9f) return;
    const float bounce = -vn > kBounceThreshold ? combinedBounce(a.material, otherMaterial) : 0;
    const float jn = -(1 + bounce) * vn / k;
    applyImpulse(a, point, normal * jn);
    if (b) applyImpulse(*b, point, normal * -jn);

    // Friction: stop sliding, up to friction x the normal push.
    const Vec3 rel2 = velocityAt(a, point) - (b ? velocityAt(*b, point) : Vec3{});
    Vec3 tangent = rel2 - normal * dot(rel2, normal);
    const float slide = length(tangent);
    if (slide > 1e-6f) {
      tangent = tangent * (1.0f / slide);
      const float kt = std::max(impulseResponse(a, point, tangent) + (b ? impulseResponse(*b, point, tangent) : 0), 1e-9f);
      const float limit = combinedFriction(a.material, otherMaterial) * jn;
      const float jt = std::min(slide / kt, limit);
      applyImpulse(a, point, tangent * -jt);
      if (b) applyImpulse(*b, point, tangent * jt);
    }
    // Rolling resistance: things on their side slow down instead of
    // rolling forever.
    a.angularVelocity = a.angularVelocity * 0.9995f;
  }

  // Push apart (split by mass) so shapes don't sink into each other.
  const float push = std::max(0.0f, depth - kSlop) * kPushFraction;
  if (push <= 0) return;
  const float wa = a.held || a.kinematic ? 0.0f : a.inverseMass;
  const float wb = b && !b->held && !b->kinematic ? b->inverseMass : 0.0f;
  if (!b) {
    a.position += normal * push;
    return;
  }
  const float total = wa + wb;
  if (total <= 0) return;
  a.position += normal * (push * wa / total);
  b->position += normal * (-push * wb / total);
}

void PhysicsWorld::updateSleep(Body& b, float dt) {
  if (b.asleep || b.kinematic) return;
  const float v = length(b.velocity), w = length(b.angularVelocity);
  const bool still = v <= kSleepLinear && w <= kSleepAngular;
  // Buzzing in place counts as still: it hasn't drifted from where it began
  // settling (a wobble that never stops would keep it awake forever).
  const bool jiggling = v <= kJiggleLinear && w <= kJiggleAngular &&
                        length(b.position - b.sleepAnchor) <= kSleepDrift &&
                        std::fabs(dot(b.rotation, b.sleepAnchorRotation)) >= std::cos(kSleepDriftAngle * 0.5f);
  if (b.held || !(still || jiggling)) {
    b.sleepTimer = 0;
    b.sleepAnchor = b.position;
    b.sleepAnchorRotation = b.rotation;
    return;
  }
  b.sleepTimer += dt;
  if (b.sleepTimer > kSleepTime) {
    b.asleep = true;
    b.velocity = {};
    b.angularVelocity = {};
  }
}

int PhysicsWorld::raycastBodies(Vec3 origin, Vec3 dir, float maxDist, float* hitDist) const {
  int best = -1;
  float bestT = maxDist;
  for (size_t i = 0; i < bodies_.size(); ++i) {
    // Ray vs bounding sphere, slightly enlarged so small things are easy to tap.
    const Vec3 oc = origin - bodies_[i].worldCenter();
    const float r = bodies_[i].boundRadius * 1.3f + 0.02f;
    const float bq = dot(oc, dir);
    const float c = dot(oc, oc) - r * r;
    const float disc = bq * bq - c;
    if (disc < 0) continue;
    const float t = -bq - std::sqrt(disc);
    if (t >= 0 && t < bestT) {
      bestT = t;
      best = static_cast<int>(i);
    }
  }
  if (hitDist) *hitDist = bestT;
  return best;
}

bool PhysicsWorld::raycastStatic(Vec3 origin, Vec3 dir, float maxDist, float* hitDist, Vec3* hitNormal) const {
  bool hit = false;
  float best = maxDist;
  for (const StaticBox& box : statics_) {
    const Quat inv = conjugate(box.rotation);
    const Vec3 o = inv.rotate(origin - box.center), d = inv.rotate(dir);
    float tNear = -1e30f, tFar = 1e30f;
    Vec3 nNear;
    bool miss = false;
    const float oa[3] = {o.x, o.y, o.z}, da[3] = {d.x, d.y, d.z}, ha[3] = {box.half.x, box.half.y, box.half.z};
    for (int axis = 0; axis < 3 && !miss; ++axis) {
      if (std::fabs(da[axis]) < 1e-9f) {
        if (std::fabs(oa[axis]) > ha[axis]) miss = true;
        continue;
      }
      float t1 = (-ha[axis] - oa[axis]) / da[axis], t2 = (ha[axis] - oa[axis]) / da[axis];
      float sign = -1;
      if (t1 > t2) {
        std::swap(t1, t2);
        sign = 1;
      }
      if (t1 > tNear) {
        tNear = t1;
        nNear = {axis == 0 ? sign : 0, axis == 1 ? sign : 0, axis == 2 ? sign : 0};
      }
      tFar = std::min(tFar, t2);
      if (tNear > tFar) miss = true;
    }
    if (miss || tNear < 0 || tNear >= best) continue;
    best = tNear;
    hit = true;
    if (hitNormal) *hitNormal = box.rotation.rotate(nNear);
  }
  if (hitDist) *hitDist = best;
  return hit;
}

std::vector<Impact> PhysicsWorld::takeImpacts() {
  std::vector<Impact> out;
  out.swap(impacts_);
  return out;
}

}  // namespace engine
