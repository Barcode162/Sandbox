#pragma once
// One car in the new driving physics (docs/plan/jobs/W20.md, the MVP):
// - 6-DOF chassis at 480 Hz, semi-implicit Euler with an implicit
//   gyroscopic step (§4.1);
// - the road is a function (Road below), each tire probed at 15 points so
//   it rolls over edges instead of snapping onto them (§4.2);
// - every wheel has its own mass and vertical motion between the
//   suspension and the tire's spring (§4.3): wheel hop and body ride;
// - springs, digressive dampers, progressive bump stops, anti-roll bars,
//   a simple roll centre (§4.4, no kinematics tables yet);
// - tires (tire.h) with relaxation, and a "stick" mode at low speed: each
//   tire holds an anchor on the road, so a parked car never creeps (§4.5.3);
// - engine, clutch, gearbox, clutch-type LSD, brakes and the tires' grip
//   solved together, implicitly, twice per tick (§4.6);
// - brakes with bias, ABS, handbrake; traction control; aero drag and lift;
// - a virtual steering wheel held by a virtual hand: the tires' aligning
//   torque pushes back, so the wheel self-centres and catches slides (§4.11).
// The sim never reads the clock, the screen or the network: (state, input)
// -> state per tick, so tests, replays and multiplayer run the same code.
//
// Car space: x right, y up, -z forward, origin at the CG. Steering and the
// steering wheel angle: + = left (§1). Input steer: + = right, like the game.
#include <array>

#include "looped/drive/car_spec.h"
#include "looped/drive/tire.h"
#include "looped/math.h"

namespace engine::drive {

// What a tire touches at a point (height field: ramps, roads, terrain).
struct RoadHit {
  float height = 0;
  Vec3 normal{0, 1, 0};
  float mu = 1, rolling = 0, drag = 0;  // friction scale, extra rolling resistance, sinking drag
};
class Road {
 public:
  virtual ~Road() = default;
  // The surface under (p.x, p.z) near height p.y. `hint` speeds up the
  // search (per wheel, kept between calls).
  virtual bool query(Vec3 p, RoadHit& hit, int& hint) const = 0;
};

struct Input {
  float steer = 0;      // target wheel position, -1 (left) .. 1 (right) of full lock
  float throttle = 0, brake = 0, handbrake = 0;
  float clutch = 0;     // pressed 0..1 (manual clutch only)
  int shift = 0;        // +1 / -1 this tick (manual gears)
  bool hold = false;    // on the grid: brakes on, clutch out (you can rev)
  bool autoGears = true, autoClutch = true;
  bool abs = true;
  float tc = 0.2f;      // traction control 0 off .. 1 strong
  float handStrength = 1, steerWeight = 1;
};

class Car {
 public:
  static constexpr float kTick = 1.0f / 480;  // s

  struct Wheel {
    // Setup (car space).
    Vec3 mount;              // wheel centre at full droop
    bool front = false, left = false;
    // Vertical motion: compression from full droop (m) and its speed.
    float travel = 0, travelSpeed = 0;
    float deflection = 0;    // tire squash (m)
    float steer = 0;         // road wheel angle (rad, + left)
    float spin = 0, angle = 0;  // rad/s (rolling forward +), accumulated rad
    float kappa = 0, alpha = 0; // relaxed slip ratio and angle (rad)
    float stickX = 0, stickY = 0;  // low-speed anchor deflection (m)
    float load = 0, fx = 0, fy = 0, mz = 0;  // last tick's forces (N, N m)
    float slide = 0;         // > 1: past the grip peak (smoke, sound)
    float absFactor = 1;     // ABS pressure release (1 = full)
    bool contact = false;
    Vec3 contactPoint, contactNormal{0, 1, 0};
    float roadMu = 1, roadRolling = 0, roadDrag = 0;
    float restTravel = 0.07f, bumpAt = 0.13f;  // travel at rest and where the bump stop starts
    int hint = -1;
  };

  void setup(const CarSpec& spec);
  // Live tuning: new numbers, same motion (springs etc. take effect at once).
  void setSpec(const CarSpec& spec);
  const CarSpec& spec() const { return spec_; }
  // At rest on the road at `ground` (the road point under the CG), facing
  // `heading` (radians about +y, 0 = -z), tilted to the road's `normal`.
  // Everything moving is zeroed.
  void place(Vec3 ground, float heading, Vec3 normal = {0, 1, 0});
  // Rolling straight ahead at `v` m/s in a fitting gear.
  void setSpeed(float v);
  // One tick (kTick).
  void step(const Input& input, const Road& road);

  // Chassis (world).
  Vec3 position;
  Quat rotation;
  Vec3 velocity, angularVelocity;
  std::array<Wheel, 4> wheels;  // FL, FR, RL, RR
  // Driveline.
  float rpm = 600;
  int gear = 1;              // -1 reverse, 0 neutral
  float clutchEngage = 0, throttleUsed = 0, brakeUsed = 0, shiftTimer = 0;
  // The steering wheel (rad, + left) and the torque you feel (N m).
  float wheelAngle = 0, wheelRate = 0, wheelTorque = 0;
  // Telemetry: acceleration in the car's frame (m/s^2; x right, z back).
  Vec3 accelLocal;
  bool absActive = false, tcActive = false;

  Vec3 forward() const { return rotation.rotate({0, 0, -1}); }
  Vec3 right() const { return rotation.rotate({1, 0, 0}); }
  Vec3 up() const { return rotation.rotate({0, 1, 0}); }
  float speed() const { return dot(velocity, forward()); }
  Vec3 worldPoint(Vec3 local) const { return position + rotation.rotate(local); }
  Vec3 pointVelocity(Vec3 p) const { return velocity + cross(angularVelocity, p - position); }
  // Wheel centre in car space (drawing).
  Vec3 wheelCentre(int i) const;
  static float headingOf(Vec3 dir) { return std::atan2(-dir.x, -dir.z); }

 private:
  float engineTorque(float rpm, float throttle) const;
  float ratio() const;  // gear * final drive, signed; 0 = no drive (neutral or shifting)
  float gearRatioOf(int g) const;
  float drivenRpm(int g) const;
  void gears(const Input& in);
  void steering(const Input& in);
  void contact(int i, const Road& road);
  struct Patch;
  // Engine to wheels and the tires' grip, solved together; fills each
  // patch's averaged forces and the new wheel speeds.
  void driveline(const Input& in, float throttle, float brake, Patch* patches);

  CarSpec spec_;
  TireModel tires_[2];       // front, rear
  float sprungMass_ = 1400;
  float engineSpeed_ = 63;   // rad/s
  float throttleLag_ = 0, idleI_ = 0;
  bool fuelCut_ = false;
  int pendingGear_ = 1;
  float reverseHold_ = 0;
  float tcCut_ = 1;
  float autoClutch_ = 0;
  bool launching_ = false;
  bool clutchClosed_ = false;  // the auto clutch is fully in (rolling)  // the auto clutch's engagement (a launch controller)
  Vec3 lastAccel_, lastAngAccel_;
};

}  // namespace engine::drive
