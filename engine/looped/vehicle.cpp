#include "looped/vehicle.h"

#include <algorithm>
#include <cmath>

namespace engine {
namespace {

constexpr float kGravity = 9.81f;
constexpr float kAirDensity = 1.2f;
constexpr float kRadToRpm = 60.0f / (2.0f * kPi);

float sign(float v) { return signf(v); }
float smooth01(float t) {
  t = clampf(t, 0, 1);
  return t * t * (3 - 2 * t);
}

}  // namespace

void Vehicle::setup(const CarSpec& spec) {
  spec_ = spec;
  // Magic Formula B so the curve peaks exactly at normalized slip 1
  // (with E = 0: C * atan(B) = pi / 2).
  shapeB_ = std::tan(kPi / (2.0f * spec_.tire.shapeC));
  tanPeakSlip_ = std::tan(spec_.tire.peakSlipAngle);
  const float frontShare = -spec_.rear.z / (spec_.front.z - spec_.rear.z);
  for (int i = 0; i < 4; ++i) {
    Wheel& w = wheels[static_cast<size_t>(i)];
    w = {};
    w.front = i < 2;
    w.left = i % 2 == 0;
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    const float corner = spec_.mass * kGravity * (w.front ? frontShare : 1 - frontShare) * 0.5f;
    const float sag = corner / a.spring;
    const float wheelY = -spec_.cgHeight + spec_.tire.radius;
    w.mount = {w.left ? -a.halfTrack : a.halfTrack, wheelY + a.restLength - sag, -a.z};
  }
  resetState();
}

void Vehicle::resetState() {
  const float frontShare = -spec_.rear.z / (spec_.front.z - spec_.rear.z);
  velocity = angularVelocity = {};
  for (Wheel& w : wheels) {
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    Wheel fresh;
    fresh.mount = w.mount;
    fresh.front = w.front;
    fresh.left = w.left;
    w = fresh;
    // The same sag the mounts were set up with (the car's weight split by axle).
    w.compression = spec_.mass * kGravity * (w.front ? frontShare : 1 - frontShare) * 0.5f / a.spring;
  }
  engineSpeed_ = spec_.idleRpm / kRadToRpm;
  rpm = spec_.idleRpm;
  gear = pendingGear_ = 1;
  shiftTimer = clutchEngage = throttleUsed = brakeUsed = reverseHold_ = 0;
}

void Vehicle::place(Vec3 ground, float heading) {
  rotation = Quat::axisAngle({0, 1, 0}, heading);
  position = ground + Vec3{0, spec_.cgHeight, 0};
  resetState();
}

float Vehicle::engineTorque(float r, float throttle) const {
  const auto& c = spec_.torqueCurve;
  float full = c.front()[1];
  if (r >= c.back()[0]) {
    full = c.back()[1];
  } else {
    for (size_t i = 1; i < c.size(); ++i) {
      if (r < c[i][0]) {
        const float t = clampf((r - c[i - 1][0]) / (c[i][0] - c[i - 1][0]), 0, 1);
        full = c[i - 1][1] + (c[i][1] - c[i - 1][1]) * t;
        break;
      }
    }
  }
  if (r < c.front()[0]) full *= clampf(r / c.front()[0], 0.3f, 1.0f);
  const float friction = 12 + 0.002f * r;
  return throttle * full - (1 - throttle) * spec_.engineBrake * r - friction;
}

float Vehicle::gearRatio() const {
  if (shiftTimer > 0 || gear == 0) return 0;
  if (gear < 0) return -spec_.reverseGear * spec_.finalDrive;
  return spec_.gears[static_cast<size_t>(gear - 1)] * spec_.finalDrive;
}

void Vehicle::tireForce(const Wheel& w, float slipRatio, float tanSlip, float& fx, float& fy) const {
  fx = fy = 0;
  if (w.load <= 0) return;
  const TireSpec& t = spec_.tire;
  const float loadFactor = 1 - t.loadSensitivity * (w.load / t.referenceLoad - 1);
  const float axleGrip = (w.front ? spec_.front : spec_.rear).grip;
  const float mu = t.mu * axleGrip * w.surface.grip * std::max(0.4f, loadFactor);
  const float sx = slipRatio / t.peakSlipRatio;
  const float sy = tanSlip / tanPeakSlip_;
  const float rho = std::sqrt(sx * sx + sy * sy);
  if (rho < 1e-6f) return;
  const float f = mu * w.load * std::sin(t.shapeC * std::atan(shapeB_ * rho));
  fx = f * sx / rho;
  fy = -f * sy / rho;
}

float Vehicle::shaftRpm(int g) const {
  float spin = 0;
  int n = 0;
  for (const Wheel& w : wheels) {
    if (!(w.front ? spec_.front : spec_.rear).driven) continue;
    spin += w.spin;
    ++n;
  }
  const float ratio = g < 0 ? -spec_.reverseGear : g == 0 ? 0 : spec_.gears[static_cast<size_t>(g - 1)];
  return std::fabs(spin / std::max(n, 1) * ratio * spec_.finalDrive) * kRadToRpm;
}

void Vehicle::autoShift(const CarInput& input) {
  // Decisions use the wheels' speed (what the engine will turn at in that
  // gear), so a gear is never picked that would over-rev the engine.
  const int top = static_cast<int>(spec_.gears.size());
  const float v = speed();
  if (gear >= 1) {
    float driveSlip = 0;
    for (const Wheel& w : wheels) {
      const AxleSpec& a = w.front ? spec_.front : spec_.rear;
      if (a.driven) driveSlip = std::max(driveSlip, w.slipRatio);
    }
    const float now = shaftRpm(gear);
    if (now > spec_.maxRpm * 0.96f && gear < top && driveSlip < 0.2f) {
      pendingGear_ = gear + 1;
    } else if (gear > 1) {
      const float down = shaftRpm(gear - 1);
      const bool braking = input.brake > 0.3f;
      if (down < spec_.maxRpm * 0.86f && (now < spec_.maxRpm * 0.45f || (braking && now < spec_.maxRpm * 0.66f))) {
        pendingGear_ = gear - 1;
      }
    }
    // Stopped and holding the brake: reverse.
    if (v < 0.8f && input.brake > 0.2f && input.throttle < 0.05f) reverseHold_ += 1;
    else reverseHold_ = 0;
    if (reverseHold_ > 80) pendingGear_ = -1;  // ~0.35 s at 240 Hz
  } else if (gear < 0) {
    if (v > -0.8f && input.throttle > 0.2f && input.brake < 0.05f) reverseHold_ += 1;
    else reverseHold_ = 0;
    if (reverseHold_ > 40) pendingGear_ = 1;
  } else {
    pendingGear_ = 1;
  }
  if (pendingGear_ != gear) {
    reverseHold_ = 0;
    shiftTimer = spec_.shiftTime;
  }
}

void Vehicle::setSpeed(float v) {
  velocity = forward() * v;
  angularVelocity = {};
  for (Wheel& w : wheels) {
    w.spin = v / spec_.tire.radius;
    w.slipRatio = w.slipAngle = 0;
  }
  if (gear >= 1) {
    while (gear < static_cast<int>(spec_.gears.size()) && shaftRpm(gear) > spec_.maxRpm * 0.8f) ++gear;
    while (gear > 1 && shaftRpm(gear) < spec_.maxRpm * 0.4f) --gear;
  }
  pendingGear_ = gear;
  shiftTimer = 0;
  engineSpeed_ = std::max(shaftRpm(gear), spec_.idleRpm) / kRadToRpm;
  rpm = engineSpeed_ * kRadToRpm;
}

void Vehicle::step(float dt, const CarInput& input, const CarAssists& assists, const Ground& ground) {
  const Vec3 up = this->up();
  const TireSpec& tire = spec_.tire;
  const float R = tire.radius;

  // --- Gears.
  if (shiftTimer > 0) {
    shiftTimer -= dt;
    if (shiftTimer <= 0) {
      shiftTimer = 0;
      gear = pendingGear_;
    }
  } else if (input.hold) {
    reverseHold_ = 0;
  } else if (assists.autoGears) {
    autoShift(input);
  } else if (input.shift != 0) {
    pendingGear_ = std::clamp(gear + input.shift, -1, static_cast<int>(spec_.gears.size()));
    if (pendingGear_ != gear) shiftTimer = spec_.shiftTime;
  }
  // In reverse with auto gears the pedals swap (brake = go back), as in most games.
  float throttle = input.throttle, brake = input.brake;
  if (assists.autoGears && gear < 0) std::swap(throttle, brake);
  if (input.hold) brake = 1;

  // --- Suspension.
  float springForce[4];
  for (size_t i = 0; i < 4; ++i) {
    Wheel& w = wheels[i];
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    const Vec3 mount = worldPoint(w.mount);
    GroundHit hit;
    const float reach = a.restLength + R;
    float c = 0;
    w.contact = ground.cast(mount, -up, reach + 0.05f, hit, w.groundHint);
    if (w.contact) {
      c = reach - hit.distance;
      w.contactPoint = hit.point;
      w.contactNormal = hit.normal;
      w.surface = hit.surface;
      if (c <= 0) w.contact = false;
    }
    c = std::clamp(c, 0.0f, a.travel + 0.08f);
    w.compressionSpeed = (c - w.compression) / dt;
    w.compression = c;
    float f = a.spring * c;
    const float damperSpeed = clampf(w.compressionSpeed, -4, 4);  // big hits don't launch the car
    f += damperSpeed * (damperSpeed > 0 ? a.bump : a.rebound);
    if (c > a.travel) f += a.spring * 10 * (c - a.travel);
    springForce[i] = w.contact ? f : 0;
  }
  for (size_t axle = 0; axle < 4; axle += 2) {
    const AxleSpec& a = axle == 0 ? spec_.front : spec_.rear;
    const float roll = a.antiRoll * (wheels[axle].compression - wheels[axle + 1].compression);
    if (wheels[axle].contact) springForce[axle] += roll;
    if (wheels[axle + 1].contact) springForce[axle + 1] -= roll;
  }

  Vec3 force{0, -kGravity * spec_.mass, 0};
  Vec3 torque;
  const auto addForce = [&](Vec3 f, Vec3 at) {
    force += f;
    torque += cross(at - position, f);
  };
  for (size_t i = 0; i < 4; ++i) {
    Wheel& w = wheels[i];
    const float fs = std::max(0.0f, springForce[i]);
    w.load = w.contact ? fs * std::max(0.0f, dot(up, w.contactNormal)) : 0;
    if (w.contact) addForce(up * fs, worldPoint(w.mount));
  }

  // --- Steering with Ackermann geometry (the inner wheel turns more).
  const float wheelbase = spec_.front.z - spec_.rear.z;
  const float rack = clampf(input.steer, -1, 1) * spec_.maxSteer * 0.85f;
  for (Wheel& w : wheels) {
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    w.steer = 0;
    if (!a.steered || std::fabs(rack) < 1e-4f) continue;
    const float turn = wheelbase / std::tan(std::fabs(rack));  // radius at the car's middle
    const bool inner = (rack > 0) != w.left;                    // turning right: right wheels are inner
    const float r = inner ? turn - a.halfTrack : turn + a.halfTrack;
    w.steer = sign(rack) * std::atan(wheelbase / std::max(r, 0.5f));
  }

  // --- Engine and clutch.
  const float ratio = input.hold ? 0 : gearRatio();
  float thr = throttle;
  if (rpm > spec_.maxRpm) thr = 0;  // rev limiter
  if (assists.tractionControl) {
    float slip = 0;
    for (const Wheel& w : wheels) {
      const AxleSpec& a = w.front ? spec_.front : spec_.rear;
      if (a.driven && w.contact) slip = std::max(slip, w.slipRatio * sign(ratio));
    }
    thr *= clampf(1 - (slip - 0.12f) * 7, 0.15f, 1);
  }
  if (shiftTimer > 0) thr = 0;
  if (rpm < spec_.idleRpm) thr = std::max(thr, clampf((spec_.idleRpm - rpm) / 250, 0, 0.5f));
  throttleUsed = thr;
  const float engineT = engineTorque(rpm, thr);

  int driven = 0;
  float drivenSpin = 0, tireTorque = 0;
  for (const Wheel& w : wheels) {
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    if (!a.driven) continue;
    ++driven;
    drivenSpin += w.spin;
    tireTorque += -w.fx * R;
  }
  drivenSpin /= std::max(driven, 1);
  float clutchCap = 0;
  if (ratio != 0) {
    if (assists.autoClutch) {
      const float shaftRpm = std::fabs(drivenSpin * ratio) * kRadToRpm;
      const float launch = smooth01((rpm - spec_.idleRpm - 150) / 1400);
      clutchEngage = std::max(launch, shaftRpm > spec_.idleRpm + 250 ? 1.0f : smooth01((shaftRpm - spec_.idleRpm + 300) / 550));
    } else {
      clutchEngage = 1 - clampf(input.clutch, 0, 1);
    }
    clutchCap = clutchEngage * spec_.clutchTorque;
  } else {
    clutchEngage = 0;
  }
  // Can the clutch hold? Solve for the torque that would make engine and
  // wheels turn together after this step.
  bool locked = false;
  float driveTorque = 0, addedInertia = 0;  // per driven wheel
  if (clutchCap > 0 && driven > 0) {
    const float Ie = spec_.engineInertia;
    const float Iw = driven * tire.inertia / (ratio * ratio);
    const float ext = tireTorque / ratio;
    const float need = (engineSpeed_ - drivenSpin * ratio + dt * (engineT / Ie - ext / Iw)) / (dt * (1 / Ie + 1 / Iw));
    if (std::fabs(need) <= clutchCap) {
      locked = true;
      driveTorque = engineT * ratio / driven;
      addedInertia = Ie * ratio * ratio / driven;
    } else {
      const float tc = sign(need) * clutchCap;
      driveTorque = tc * ratio / driven;
      engineSpeed_ += dt * (engineT - tc) / Ie;
    }
  } else if (shiftTimer > 0 && pendingGear_ != 0) {
    // Mid-shift: the gearbox blips / cuts the engine to the new gear's speed.
    const float target = std::max(shaftRpm(pendingGear_), spec_.idleRpm) / kRadToRpm;
    engineSpeed_ += (target - engineSpeed_) * std::min(1.0f, dt * 25);
  } else {
    engineSpeed_ += dt * engineT / spec_.engineInertia;
  }

  // Limited-slip differential: torque moves from the faster wheel to the slower one.
  float wheelDrive[4] = {0, 0, 0, 0};
  for (size_t axle = 0; axle < 4; axle += 2) {
    const AxleSpec& a = axle == 0 ? spec_.front : spec_.rear;
    if (!a.driven) continue;
    const float total = driveTorque * 2;
    const float limit = spec_.diffPreload + spec_.diffLock * std::fabs(total);
    const float transfer = clampf((wheels[axle].spin - wheels[axle + 1].spin) * tire.inertia / (4 * dt), -limit, limit);
    wheelDrive[axle] = driveTorque - transfer;
    wheelDrive[axle + 1] = driveTorque + transfer;
  }

  // --- Brakes (ABS eases off a wheel that starts to lock).
  brakeUsed = clampf(brake, 0, 1);
  float wheelBrake[4];
  for (size_t i = 0; i < 4; ++i) {
    const Wheel& w = wheels[i];
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    float b = brakeUsed * spec_.brakeTorque * a.brakeShare * 0.5f;
    if (assists.abs && w.contact && w.slipRatio < -0.12f) b *= clampf(1 - (-w.slipRatio - 0.12f) * 10, 0.1f, 1);
    if (!w.front) b += clampf(input.handbrake, 0, 1) * spec_.handbrakeTorque * 0.5f;
    wheelBrake[i] = b;
  }

  // --- Tires and wheel spin.
  for (size_t i = 0; i < 4; ++i) {
    Wheel& w = wheels[i];
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    const float inertia = tire.inertia + (a.driven && locked ? addedInertia : 0);
    if (!w.contact) {
      float spin = w.spin + dt * wheelDrive[i] / inertia;
      const float stop = dt * wheelBrake[i] / inertia;
      w.spin = std::fabs(spin) <= stop ? 0 : spin - sign(spin) * stop;
      w.slipRatio *= 0.9f;
      w.slipAngle *= 0.9f;
      w.fx = w.fy = w.slide = 0;
      w.angle += w.spin * dt;
      continue;
    }
    const Vec3 n = w.contactNormal;
    const Vec3 steered = rotation.rotate({std::sin(w.steer), 0, -std::cos(w.steer)});
    const Vec3 fwd = normalize(steered - n * dot(steered, n));
    const Vec3 side = cross(fwd, n);  // to the right
    const Vec3 at = w.contactPoint;
    const Vec3 v = pointVelocity(at);
    const float vx = dot(v, fwd), vy = dot(v, side);
    const float ax = std::fabs(vx);

    // Slip states relax toward their steady values over a short distance.
    w.slipAngle = clampf((w.slipAngle + dt * vy / tire.relaxLat) / (1 + dt * ax / tire.relaxLat), -2, 2);
    const auto slipAt = [&](float spin) {
      return clampf((w.slipRatio + dt * (spin * R - vx) / tire.relaxLong) / (1 + dt * ax / tire.relaxLong), -1.5f, 1.5f);
    };
    // Spin solved implicitly against the tire's pull (linearized).
    float fx0, fy0, fx1, fy1;
    tireForce(w, slipAt(w.spin), w.slipAngle, fx0, fy0);
    tireForce(w, slipAt(w.spin + 1), w.slipAngle, fx1, fy1);
    const float slope = std::max(0.0f, fx1 - fx0);
    const float rollT = w.surface.rolling * w.load * R;
    const float denom = inertia + dt * R * slope;
    const float free = w.spin + dt * (wheelDrive[i] - R * fx0) / denom;
    const float stop = dt * (wheelBrake[i] + rollT) / denom;
    w.spin = clampf(std::fabs(free) <= stop ? 0 : free - sign(free) * stop, -500, 500);
    w.slipRatio = slipAt(w.spin);
    w.angle += w.spin * dt;

    float fx, fy;
    tireForce(w, w.slipRatio, w.slipAngle, fx, fy);
    // Near standstill the relaxed slip acts like a spring; damp it.
    const float slow = clampf(1 - ax / 3, 0, 1);
    fx -= slow * 2.0f * w.load * clampf(vx - w.spin * R, -1, 1) * 0.5f;
    fy -= slow * 2.5f * w.load * clampf(vy, -1, 1);
    const float limit = tire.mu * a.grip * w.surface.grip * w.load * 1.05f;
    const float mag = std::sqrt(fx * fx + fy * fy);
    if (mag > limit && mag > 0) {
      fx *= limit / mag;
      fy *= limit / mag;
    }
    w.fx = fx;
    w.fy = fy;
    const float sx = w.slipRatio / tire.peakSlipRatio, sy = w.slipAngle / tanPeakSlip_;
    w.slide = std::sqrt(sx * sx + sy * sy);
    const Vec3 lift = up * a.rollCenter;
    addForce(fwd * fx + side * fy, at + lift);
    // Grass and gravel hold you back.
    if (w.surface.drag > 0 && length(v) > 0.1f) {
      addForce(normalize(v) * (-w.surface.drag * w.load * clampf(length(v) / 3, 0, 1)), at);
    }
  }
  if (locked && driven > 0) {
    float s = 0;
    for (const Wheel& w : wheels) {
      if ((w.front ? spec_.front : spec_.rear).driven) s += w.spin;
    }
    engineSpeed_ = s / driven * ratio;
  }
  engineSpeed_ = std::max(engineSpeed_, spec_.idleRpm * 0.8f / kRadToRpm);  // never stalls
  rpm = engineSpeed_ * kRadToRpm;

  // --- Air: drag at the center, downforce at each axle.
  const float v2 = dot(velocity, velocity);
  if (v2 > 0.01f) addForce(velocity * (-0.5f * kAirDensity * spec_.dragArea * std::sqrt(v2)), position);
  const float vf = dot(velocity, forward());
  for (const AxleSpec* a : {&spec_.front, &spec_.rear}) {
    addForce(up * (-0.5f * kAirDensity * a->downforce * vf * vf), worldPoint({0, 0, -a->z}));
  }

  // --- Integrate (semi-implicit Euler).
  velocity += force * (dt / spec_.mass);
  position += velocity * dt;
  const Quat inv = conjugate(rotation);
  Vec3 wb = inv.rotate(angularVelocity);
  const Vec3 tb = inv.rotate(torque);
  const Vec3 I = spec_.inertia;
  const Vec3 Iw{I.x * wb.x, I.y * wb.y, I.z * wb.z};
  const Vec3 gyro = cross(wb, Iw);
  wb += Vec3{(tb.x - gyro.x) / I.x, (tb.y - gyro.y) / I.y, (tb.z - gyro.z) / I.z} * dt;
  angularVelocity = rotation.rotate(wb);
  // Safety limits (a crash can't spin or fling the car unrealistically).
  const float spinRate = length(angularVelocity);
  if (spinRate > 10) angularVelocity = angularVelocity * (10 / spinRate);
  const float speedNow = length(velocity);
  if (speedNow > 110) velocity = velocity * (110 / speedNow);
  const Quat spin{angularVelocity.x, angularVelocity.y, angularVelocity.z, 0};
  const Quat d = spin * rotation;
  rotation = normalized({rotation.x + 0.5f * dt * d.x, rotation.y + 0.5f * dt * d.y, rotation.z + 0.5f * dt * d.z,
                         rotation.w + 0.5f * dt * d.w});
}

Vec3 Vehicle::pointVelocity(Vec3 p) const { return velocity + cross(angularVelocity, p - position); }

float Vehicle::inverseMassAt(Vec3 p, Vec3 dir) const {
  const Vec3 r = p - position;
  const Quat inv = conjugate(rotation);
  const Vec3 rn = inv.rotate(cross(r, dir));
  const Vec3 I = spec_.inertia;
  const Vec3 k = rotation.rotate({rn.x / I.x, rn.y / I.y, rn.z / I.z});
  return 1.0f / spec_.mass + dot(dir, cross(k, r));
}

void Vehicle::applyImpulse(Vec3 p, Vec3 j) {
  velocity += j * (1.0f / spec_.mass);
  const Vec3 r = p - position;
  const Quat inv = conjugate(rotation);
  const Vec3 tb = inv.rotate(cross(r, j));
  const Vec3 I = spec_.inertia;
  angularVelocity += rotation.rotate({tb.x / I.x, tb.y / I.y, tb.z / I.z});
}

}  // namespace engine
