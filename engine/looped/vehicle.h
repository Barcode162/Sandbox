#pragma once
// Car physics, written from scratch in the spirit of real sims.
//
// - The body is one rigid body (mass, inertia) moved by forces.
// - Four wheels with raycast suspension: spring, bump/rebound damping,
//   bump stops, anti-roll bars. Weight transfer comes out of this by itself.
// - Tires: a Pacejka "Magic Formula" curve over normalized combined slip
//   (braking while turning shares the grip), load sensitivity, and
//   relaxation lengths (slip builds up over distance), which also keeps a
//   parked car still instead of jittering.
// - Every wheel spins on its own (wheelspin, lockups). Wheels are solved
//   implicitly against the tire force, so stiff tires stay stable.
// - Engine torque curve, idle, rev limiter, engine braking; clutch that
//   locks or slips; gearbox (auto or manual); limited-slip differential;
//   brakes with bias; handbrake; aero drag and downforce.
//
// Car space: x = right, y = up, -z = forward (like the camera); origin =
// center of mass. Axle positions are given as distance ahead (+) / behind (-).
// Step at a fixed rate (240 Hz or more) for consistent behavior.
#include <array>
#include <cmath>
#include <vector>

#include "looped/math.h"

namespace engine {

// What the ground is made of (asphalt, curb, grass, gravel...).
struct Surface {
  float grip = 1.0f;        // multiplies tire friction
  float rolling = 0.012f;   // rolling resistance coefficient
  float drag = 0.0f;        // extra resistance (sinking into gravel/grass), N per N of load at speed
  float bumps = 0.0f;       // roughness, meters of random height
};

// The world under the car, asked by each wheel every step.
struct GroundHit {
  float distance = 0;
  Vec3 point, normal{0, 1, 0};
  Surface surface;
};
class Ground {
 public:
  virtual ~Ground() = default;
  // Casts from `origin` along `dir` (unit) up to `maxDistance`.
  virtual bool cast(Vec3 origin, Vec3 dir, float maxDistance, GroundHit& hit, int& hint) const = 0;
};

struct TireSpec {
  float radius = 0.33f;
  float inertia = 1.2f;         // wheel + tire + brake disc, kg m^2
  float mu = 1.3f;              // peak friction at the reference load
  float loadSensitivity = 0.1f; // friction lost per extra reference load
  float referenceLoad = 3500;   // N
  float peakSlipRatio = 0.09f;
  float peakSlipAngle = 0.13f;  // radians (~7.5 degrees)
  float shapeC = 1.45f;         // Magic Formula C: how much grip remains past the peak
  float relaxLong = 0.12f;      // m
  float relaxLat = 0.4f;        // m
};

struct AxleSpec {
  float z = 1.3f;               // distance ahead of the center of mass (rear: negative)
  float halfTrack = 0.79f;
  float spring = 60000;         // N/m per wheel
  float bump = 3500, rebound = 5500;  // damping, N s/m
  float antiRoll = 25000;       // N/m between the two wheels
  float travel = 0.13f;         // compression before the bump stop
  float restLength = 0.3f;      // free spring length (mount to wheel center)
  bool driven = false;
  bool steered = false;
  float brakeShare = 0.5f;      // of the total brake torque
  float downforce = 0.2f;       // lift coefficient * area at this axle
  float rollCenter = 0.1f;      // tire forces act this high above the ground (less body roll)
  float grip = 1.0f;            // tire width / compound on this axle (multiplies friction)
};

struct CarSpec {
  float mass = 1300;
  Vec3 inertia{2100, 2350, 520};      // pitch (x), yaw (y), roll (z)
  float cgHeight = 0.5f;              // above the ground at rest
  Vec3 halfExtents{0.92f, 0.62f, 2.25f};  // body box for collisions (center = center of mass + boxOffset)
  Vec3 boxOffset{0, 0.12f, 0.1f};
  AxleSpec front, rear;
  TireSpec tire;
  // Engine: torque curve (rpm, N m), linear in between.
  std::vector<std::array<float, 2>> torqueCurve = {{1000, 250}, {2000, 330}, {3000, 390}, {4000, 420},
                                                   {5000, 420}, {6000, 400}, {7000, 360}, {7600, 320}};
  float idleRpm = 900, maxRpm = 7500;
  float engineInertia = 0.22f;
  float engineBrake = 0.008f;         // N m per rpm when off the throttle
  float clutchTorque = 700;           // N m the clutch can hold
  std::vector<float> gears = {3.2f, 2.2f, 1.65f, 1.3f, 1.05f, 0.86f};
  float reverseGear = 3.3f;
  float finalDrive = 3.9f;
  float shiftTime = 0.12f;            // s without drive during a shift
  float diffPreload = 60;             // N m always locking the diff
  float diffLock = 0.35f;             // extra locking per N m going through it
  float brakeTorque = 6400;           // N m all wheels together at full pedal
  float handbrakeTorque = 2500;       // N m on the rear wheels
  float maxSteer = 0.56f;             // radians at the inner front wheel... at full lock
  float dragArea = 0.68f;             // Cd * frontal area
};

struct CarInput {
  float steer = 0;      // -1 (left) .. 1 (right)
  float throttle = 0;   // 0..1
  float brake = 0;      // 0..1
  float handbrake = 0;  // 0..1
  float clutch = 0;     // 0..1 pressed (manual); ignored with the auto clutch
  int shift = 0;        // +1 up, -1 down this step (manual)
  bool hold = false;    // on the grid: clutch out and brakes on (you can rev, not roll)
};

struct CarAssists {
  bool autoGears = true;
  bool autoClutch = true;
  bool abs = true;
  bool tractionControl = true;
};

class Vehicle {
 public:
  struct Wheel {
    // Setup (car space)
    Vec3 mount;              // top of the suspension
    bool front = false, left = false;
    // State
    float compression = 0, compressionSpeed = 0;
    float spin = 0;          // angular velocity (rad/s), forward rolling = positive
    float angle = 0;         // accumulated rotation (for drawing)
    float steer = 0;         // radians
    float slipRatio = 0, slipAngle = 0;  // relaxed slip states (slipAngle stores tan)
    float load = 0;          // N
    float fx = 0, fy = 0;    // tire forces last step (N)
    float slide = 0;         // 0..1+: how far past the grip peak (for sound/smoke)
    bool contact = false;
    Vec3 contactPoint, contactNormal{0, 1, 0};
    Surface surface;
    int groundHint = -1;
  };

  void setup(const CarSpec& spec);
  const CarSpec& spec() const { return spec_; }
  // Puts the car at rest with its wheels on the ground at `position`
  // (ground level under the center), facing `heading` (radians about +y;
  // 0 = facing -z, positive = turned left). headingOf() converts a direction.
  void place(Vec3 position, float heading);
  void step(float dt, const CarInput& input, const CarAssists& assists, const Ground& ground);
  // Rolling start: moving straight ahead at `v` m/s in a fitting gear.
  void setSpeed(float v);

  // Collisions: an impulse at a world point.
  void applyImpulse(Vec3 worldPoint, Vec3 impulse);
  // Velocity of a world point fixed to the body.
  Vec3 pointVelocity(Vec3 worldPoint) const;
  // 1 / effective mass along `dir` at `worldPoint` (for impulse solving).
  float inverseMassAt(Vec3 worldPoint, Vec3 dir) const;
  float inverseMass() const { return 1.0f / spec_.mass; }

  // State
  Vec3 position;            // center of mass
  Quat rotation;
  Vec3 velocity, angularVelocity;  // world space
  std::array<Wheel, 4> wheels;     // FL, FR, RL, RR
  float rpm = 900;
  int gear = 1;             // -1 reverse, 0 neutral, 1.. forward
  float clutchEngage = 0;   // 0 open .. 1 closed (what the clutch actually did)
  float throttleUsed = 0;   // after the rev limiter / traction control
  float brakeUsed = 0;      // after ABS
  float shiftTimer = 0;

  static float headingOf(Vec3 dir) { return std::atan2(-dir.x, -dir.z); }
  Vec3 forward() const { return rotation.rotate({0, 0, -1}); }
  Vec3 right() const { return rotation.rotate({1, 0, 0}); }
  Vec3 up() const { return rotation.rotate({0, 1, 0}); }
  float speed() const { return dot(velocity, forward()); }  // m/s along the car
  Vec3 worldPoint(Vec3 local) const { return position + rotation.rotate(local); }

 private:
  float engineTorque(float rpm, float throttle) const;
  float gearRatio() const;  // signed, including the final drive; 0 = neutral
  float shaftRpm(int gear) const;  // engine rpm the driven wheels ask for in `gear`
  void autoShift(const CarInput& input);
  // At rest with the wheels' springs settled under the car's weight; every
  // moving part zeroed (used by setup and place).
  void resetState();
  void tireForce(const Wheel& w, float slipRatio, float tanSlip, float& fx, float& fy) const;

  CarSpec spec_;
  float shapeB_ = 1.8f;
  float tanPeakSlip_ = 0.13f;  // tan(tire.peakSlipAngle), worked out once
  float engineSpeed_ = 94;  // rad/s
  float reverseHold_ = 0;
  int pendingGear_ = 1;
};

}  // namespace engine
