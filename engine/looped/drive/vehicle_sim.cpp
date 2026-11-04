#include "looped/drive/vehicle_sim.h"

#include <algorithm>
#include <cmath>

namespace engine::drive {
namespace {

constexpr float kG = 9.81f;
constexpr float kRho = 1.225f;
constexpr float kRadToRpm = 60.0f / (2.0f * kPi);
constexpr float kVlo = 1.0f;     // m/s: slip maths floor (§4.5.1)
constexpr float kVrel = 0.5f;    // m/s: relaxation at standstill (§4.5.2)
constexpr float kStickK = 1.5e5f;  // N/m: the low-speed anchor (§4.5.3)
constexpr int kSubsteps = 2;     // driveline steps per tick (960 Hz)
// The virtual steering wheel (§4.11).
// (A quick hand: lock to lock in about half a second, like a real driver's.)
constexpr float kWheelInertia = 0.05f, kWheelDamping = 2.4f;
constexpr float kHandStiffness = 70, kHandMaxTorque = 40;

float smooth01(float t) {
  t = clampf(t, 0, 1);
  return t * t * (3 - 2 * t);
}

// Solves M x = b for a 3x3 matrix (rows), by Cramer's rule.
Vec3 solve3(const float m[3][3], Vec3 b) {
  const float det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
                    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  if (std::fabs(det) < 1e-12f) return {};
  const float bx = b.x, by = b.y, bz = b.z;
  const float x = bx * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (by * m[2][2] - m[1][2] * bz) +
                  m[0][2] * (by * m[2][1] - m[1][1] * bz);
  const float y = m[0][0] * (by * m[2][2] - m[1][2] * bz) - bx * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
                  m[0][2] * (m[1][0] * bz - by * m[2][0]);
  const float z = m[0][0] * (m[1][1] * bz - by * m[2][1]) - m[0][1] * (m[1][0] * bz - by * m[2][0]) +
                  bx * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  return Vec3{x, y, z} * (1 / det);
}

}  // namespace

// One tire's contact patch this tick.
struct Car::Patch {
  Vec3 ft, yt;          // tire frame: forward, left (in the road plane)
  float vcx = 0, vcy = 0;
  float fz = 0, mu = 1;
  float wSlip = 1;      // 1 = slip model, 0 = low-speed anchor
  float re = 0.33f;     // effective rolling radius
  float stickDamping = 7800;
  float brake = 0;      // brake + rolling resistance torque capacity (N m)
  // Out (averaged over the substeps).
  float fx = 0, fy = 0, mz = 0, slide = 0;
};

void Car::setup(const CarSpec& spec) {
  setSpec(spec);
  for (int i = 0; i < 4; ++i) {
    Wheel& w = wheels[static_cast<size_t>(i)];
    w = {};
    w.front = i < 2;
    w.left = i % 2 == 0;
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    const float corner = staticCornerLoad(spec_, i);
    const float tireSquash = corner / a.tire.verticalRate;
    const float sag = (corner - a.tire.unsprungMass * kG) / a.wheelRate;
    const float yRest = -spec_.cgHeight + a.tire.radius - tireSquash;
    w.mount = {w.left ? -a.halfTrack : a.halfTrack, yRest - sag, -a.z};
    w.restTravel = sag;
    w.bumpAt = sag + a.bumpTravel;
  }
  place(position, headingOf(forward()));
}

void Car::setSpec(const CarSpec& spec) {
  spec_ = spec;
  tires_[0].setup(spec_.front.tire);
  tires_[1].setup(spec_.rear.tire);
  sprungMass_ = spec_.mass - 2 * spec_.front.tire.unsprungMass - 2 * spec_.rear.tire.unsprungMass;
}

Vec3 Car::wheelCentre(int i) const {
  const Wheel& w = wheels[static_cast<size_t>(i)];
  return w.mount + Vec3{0, w.travel, 0};
}

void Car::place(Vec3 ground, float heading, Vec3 normal) {
  const Vec3 n = normalize(normal);
  const Vec3 axis = cross(Vec3{0, 1, 0}, n);
  const float tilt = std::asin(std::min(length(axis), 1.0f));
  const Quat lean = tilt > 1e-4f ? Quat::axisAngle(normalize(axis), tilt) : Quat{};
  rotation = lean * Quat::axisAngle({0, 1, 0}, heading);
  position = ground + up() * spec_.cgHeight;
  velocity = angularVelocity = lastAccel_ = lastAngAccel_ = accelLocal = {};
  for (int i = 0; i < 4; ++i) {
    Wheel& w = wheels[static_cast<size_t>(i)];
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    w.travel = w.restTravel;
    w.travelSpeed = 0;
    w.load = staticCornerLoad(spec_, i);
    w.deflection = w.load / a.tire.verticalRate;
    w.spin = w.kappa = w.alpha = w.stickX = w.stickY = w.fx = w.fy = w.mz = w.slide = 0;
    w.absFactor = 1;
    w.steer = 0;
    w.hint = -1;
    w.contact = false;
  }
  engineSpeed_ = spec_.idleRpm / kRadToRpm;
  rpm = spec_.idleRpm;
  gear = pendingGear_ = 1;
  shiftTimer = clutchEngage = throttleUsed = brakeUsed = reverseHold_ = throttleLag_ = idleI_ = 0;
  wheelAngle = wheelRate = wheelTorque = 0;
  tcCut_ = 1;
  autoClutch_ = 0;
  clutchClosed_ = false;
  fuelCut_ = false;
}

float Car::gearRatioOf(int g) const {
  if (g == 0) return 0;
  if (g < 0) return -spec_.reverseGear * spec_.finalDrive;
  return spec_.gears[static_cast<size_t>(std::min(g, static_cast<int>(spec_.gears.size())) - 1)] * spec_.finalDrive;
}

float Car::ratio() const { return shiftTimer > 0 ? 0 : gearRatioOf(gear); }

float Car::drivenRpm(int g) const {
  float spin = 0;
  int n = 0;
  for (const Wheel& w : wheels) {
    if (!(w.front ? spec_.front : spec_.rear).driven) continue;
    spin += w.spin;
    ++n;
  }
  return std::fabs(spin / static_cast<float>(std::max(n, 1)) * gearRatioOf(g)) * kRadToRpm;
}

void Car::setSpeed(float v) {
  velocity = forward() * v;
  angularVelocity = {};
  for (int i = 0; i < 4; ++i) {
    Wheel& w = wheels[static_cast<size_t>(i)];
    w.spin = v / (w.front ? spec_.front : spec_.rear).tire.radius;
    w.kappa = w.alpha = w.stickX = w.stickY = 0;
  }
  if (gear >= 1) {
    const int top = static_cast<int>(spec_.gears.size());
    while (gear < top && drivenRpm(gear) > spec_.redline * 0.8f) ++gear;
    while (gear > 1 && drivenRpm(gear) < spec_.redline * 0.4f) --gear;
  }
  pendingGear_ = gear;
  shiftTimer = 0;
  autoClutch_ = 1;
  clutchClosed_ = true;
  engineSpeed_ = std::max(drivenRpm(gear), spec_.idleRpm) / kRadToRpm;
  rpm = engineSpeed_ * kRadToRpm;
}

float Car::engineTorque(float r, float throttle) const {
  const auto& c = spec_.torqueCurve;
  float full = c.back()[1];
  if (r <= c.front()[0]) {
    full = c.front()[1] * clampf(r / c.front()[0], 0.3f, 1);
  } else {
    for (size_t i = 1; i < c.size(); ++i) {
      if (r < c[i][0]) {
        // Smooth between the points (cosine ease), so the torque has no kinks.
        const float t = (r - c[i - 1][0]) / (c[i][0] - c[i - 1][0]);
        const float s = 0.5f - 0.5f * std::cos(t * kPi);
        full = c[i - 1][1] + (c[i][1] - c[i - 1][1]) * (0.5f * t + 0.5f * s);
        break;
      }
    }
  }
  const float closed = -spec_.engineBrake * spec_.peakTorque() * clampf(r / spec_.redline, 0, 1.3f) - 8;
  return throttle * full + (1 - throttle) * closed;
}

void Car::gears(const Input& in) {
  const float h = kTick;
  const int top = static_cast<int>(spec_.gears.size());
  if (shiftTimer > 0) {
    shiftTimer -= h;
    if (shiftTimer <= 0) {
      shiftTimer = 0;
      gear = pendingGear_;
    }
    return;
  }
  if (in.hold) {
    reverseHold_ = 0;
    return;
  }
  if (!in.autoGears) {
    if (in.shift != 0) {
      pendingGear_ = std::clamp(gear + in.shift, -1, top);
      if (pendingGear_ != gear) shiftTimer = spec_.shiftTime;
    }
    return;
  }
  // Auto: decided from the wheels' speed (what the engine will turn at in
  // that gear), so a gear is never picked that would over-rev it.
  const float v = speed();
  if (gear >= 1) {
    float slip = 0;
    for (const Wheel& w : wheels) {
      if ((w.front ? spec_.front : spec_.rear).driven) slip = std::max(slip, w.kappa);
    }
    const float now = drivenRpm(gear);
    if (now > spec_.redline * 0.965f && gear < top && slip < 0.2f) {
      pendingGear_ = gear + 1;
    } else if (gear > 1) {
      const float down = drivenRpm(gear - 1);
      const bool braking = in.brake > 0.3f;
      // Kickdown: flooring it low in the revs drops a gear for the power.
      const bool kick = in.throttle > 0.85f && now < spec_.redline * 0.6f && down < spec_.redline * 0.82f;
      if (kick || (down < spec_.redline * 0.88f && (now < spec_.redline * 0.42f || (braking && now < spec_.redline * 0.66f)))) {
        pendingGear_ = gear - 1;
      }
    }
    // Stopped and holding the brake: reverse.
    reverseHold_ = v < 0.8f && in.brake > 0.2f && in.throttle < 0.05f ? reverseHold_ + h : 0;
    if (reverseHold_ > 0.35f) pendingGear_ = -1;
  } else if (gear < 0) {
    reverseHold_ = v > -0.8f && in.throttle > 0.2f && in.brake < 0.05f ? reverseHold_ + h : 0;
    if (reverseHold_ > 0.17f) pendingGear_ = 1;
  } else {
    pendingGear_ = 1;
  }
  if (pendingGear_ != gear) {
    reverseHold_ = 0;
    shiftTimer = spec_.shiftTime;
  }
}

void Car::steering(const Input& in) {
  const float h = kTick;
  const float lock = spec_.lockDeg * kPi / 180;
  // Aligning torque at the kingpins -> the steering wheel (power assist takes most).
  float kingpin = 0;
  for (int i = 0; i < 2; ++i) {
    const Wheel& w = wheels[static_cast<size_t>(i)];
    kingpin += w.mz - spec_.mechTrail * w.fy;
  }
  wheelTorque = kingpin / spec_.steeringRatio * (1 - spec_.powerAssist) * in.steerWeight;
  // The virtual hand: a stiff spring toward your target, with a limited force.
  const float target = -clampf(in.steer, -1, 1) * lock;
  const float hs = std::max(in.handStrength, 0.1f);
  const float hand = clampf(kHandStiffness * hs * (target - wheelAngle), -kHandMaxTorque * hs, kHandMaxTorque * hs);
  wheelRate = (wheelRate + h * (hand + wheelTorque) / kWheelInertia) / (1 + h * kWheelDamping / kWheelInertia);
  wheelAngle += h * wheelRate;
  if (std::fabs(wheelAngle) > lock) {
    wheelAngle = signf(wheelAngle) * lock;
    wheelRate = 0;
  }
  // Road wheels, with Ackermann (the inner wheel turns more).
  const float delta = wheelAngle / spec_.steeringRatio;
  const float L = spec_.wheelbase();
  for (int i = 0; i < 4; ++i) {
    Wheel& w = wheels[static_cast<size_t>(i)];
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    w.steer = 0;
    if (!a.steered) continue;
    if (std::fabs(delta) < 1e-5f) continue;
    const float turn = L / std::tan(std::fabs(delta));
    const bool inner = (delta > 0) == w.left;  // turning left: the left wheel is inside
    const float r = inner ? turn - a.halfTrack : turn + a.halfTrack;
    const float ack = signf(delta) * std::atan(L / std::max(r, 0.3f));
    w.steer = delta + (ack - delta) * spec_.ackermann;
  }
}

void Car::contact(int i, const Road& road) {
  Wheel& w = wheels[static_cast<size_t>(i)];
  const AxleSpec& a = w.front ? spec_.front : spec_.rear;
  const float R0 = a.tire.radius;
  const Vec3 c = worldPoint(wheelCentre(i));
  const Vec3 fw = rotation.rotate({-std::sin(w.steer), 0, -std::cos(w.steer)});
  const Vec3 aw = rotation.rotate({std::cos(w.steer), 0, -std::sin(w.steer)});
  const Vec3 ub = up();
  // 3 across the tread x 5 around the lower arc (-40..40 degrees).
  static const float kArc[5] = {-0.698f, -0.349f, 0, 0.349f, 0.698f};
  const float across[3] = {-0.35f * a.tire.width, 0, 0.35f * a.tire.width};
  float sum = 0, deepest = 0;
  Vec3 point, normal;
  RoadHit best;
  for (float off : across) {
    for (float phi : kArc) {
      const Vec3 p = c + aw * off + (fw * std::sin(phi) - ub * std::cos(phi)) * R0;
      RoadHit hit;
      if (!road.query(p, hit, w.hint)) continue;
      if (hit.normal.y < 0.5f) continue;  // steeper than 60 degrees: a wall, not road
      const float pen = (hit.height - p.y) * hit.normal.y;
      if (pen <= 0) continue;
      sum += pen;
      point += Vec3{p.x, hit.height, p.z} * pen;
      normal += hit.normal * pen;
      if (pen > deepest) {
        deepest = pen;
        best = hit;
      }
    }
  }
  if (sum <= 0) {
    w.contact = false;
    w.deflection = 0;
    return;
  }
  const Vec3 n = normalize(normal);
  // A 2 ms low-pass on the normal: no single-tick flips on seams.
  w.contactNormal = w.contact ? normalize(w.contactNormal + (n - w.contactNormal) * 0.65f) : n;
  w.contactPoint = point * (1 / sum);
  w.contact = true;
  w.deflection = deepest;
  w.roadMu = best.mu;
  w.roadRolling = best.rolling;
  w.roadDrag = best.drag;
}

void Car::driveline(const Input& in, float thr, float /*brake*/, Patch* P) {
  const float h = kTick / kSubsteps;
  // Clutch.
  const float iT = in.hold ? 0 : ratio();
  float cap = 0;
  if (iT != 0) {
    if (in.autoClutch) {
      // Rolling fast enough: closed. Pulling away: slip the clutch to hold
      // the engine near a launch speed (higher with more throttle), closing
      // as the car catches up; off the throttle at a crawl: open (no stall).
      // (From the car's speed, not the wheels': spinning tires don't count.)
      const float shaft = std::fabs(speed() / spec_.rear.tire.radius * gearRatioOf(gear)) * kRadToRpm;
      const float pedal = throttleLag_;  // the driver's foot (not traction control's cut)
      const float launch = spec_.idleRpm + (3200 - spec_.idleRpm) * clampf(pedal * 1.4f, 0, 1);
      // Once closed it stays closed until the car is down to a crawl (it
      // used to think a full-throttle 2nd gear at 45 km/h was a launch and
      // held the engine at the launch revs: no power on the skid pad).
      if (clutchClosed_ && shaft < spec_.idleRpm + 250) clutchClosed_ = false;
      if (!clutchClosed_ && shaft > std::max(launch * 0.92f, spec_.idleRpm + 350.0f)) clutchClosed_ = true;
      if (in.handbrake > 0.3f) {
        // Handbrake: clutch in, like a driver does (the engine would keep
        // the rear wheels turning).
        autoClutch_ = std::max(0.0f, autoClutch_ - kTick * 25);
      } else if (clutchClosed_) {
        autoClutch_ = std::min(1.0f, autoClutch_ + kTick * 8);
        launching_ = false;
      } else if (pedal < 0.02f && shaft < spec_.idleRpm + 300) {
        autoClutch_ = std::max(0.0f, autoClutch_ - kTick * 6);
      } else {
        // The clutch passes the engine's torque, plus a pull toward the launch
        // speed, but never more than the rear tires can put down (launch
        // control, §4.13): the engine is held at the launch speed instead.
        float want = clampf((engineTorque(rpm, std::max(pedal, thr)) + 0.37f * (rpm - launch)) / spec_.clutchTorque, 0, 1);
        float grip = 0;
        for (int i = 2; i < 4; ++i) {
          const Wheel& w = wheels[static_cast<size_t>(i)];
          if (w.contact) grip += tires_[1].peakMu(w.load, w.roadMu) * w.load * spec_.rear.tire.radius;
        }
        if (in.tc > 0) want = std::min(want, 0.95f * grip / std::max(std::fabs(gearRatioOf(gear)) * spec_.driveEfficiency, 1.0f) / spec_.clutchTorque);
        autoClutch_ += (want - autoClutch_) * std::min(1.0f, kTick / 0.02f);
        launching_ = pedal > 0.3f;
      }
      clutchEngage = autoClutch_;
    } else {
      clutchEngage = autoClutch_ = 1 - clampf(in.clutch, 0, 1);
    }
    cap = clutchEngage * spec_.clutchTorque;
  } else {
    clutchEngage = 0;
  }
  const float Ie = spec_.engineInertia;
  const float eta = spec_.driveEfficiency;
  for (int i = 0; i < 4; ++i) P[i].fx = P[i].fy = P[i].mz = 0;

  for (int sub = 0; sub < kSubsteps; ++sub) {
    const float Teng = engineTorque(rpm, thr);
    float F0[4], a[4], r[4], kNew[4], dNew[4];
    // The tire's pull at the current spin, and how fast it changes with spin.
    const auto fxAt = [&](int i, float omega, float& kOut, float& dOut) {
      const Wheel& w = wheels[static_cast<size_t>(i)];
      const Patch& p = P[i];
      const TireModel& tm = tires_[i < 2 ? 0 : 1];
      const float ax = std::fabs(p.vcx);
      const float kss = (omega * p.re - p.vcx) / std::max(ax, kVlo);
      const float kx = (ax + kVrel) / tm.relaxX(p.fz);
      kOut = clampf((w.kappa + h * kx * kss) / (1 + h * kx), -5, 5);
      const float slipF = tm.eval(p.fz, kOut, w.alpha, p.mu).fx;
      const float vsx = p.vcx - omega * p.re;
      dOut = w.stickX + h * vsx;
      const float lim = tm.peakMu(p.fz, p.mu) * p.fz;
      const float stickF = clampf(-(kStickK * dOut + p.stickDamping * vsx), -lim, lim);
      return stickF + (slipF - stickF) * p.wSlip;
    };
    for (int i = 0; i < 4; ++i) {
      const Wheel& w = wheels[static_cast<size_t>(i)];
      const float Iw = (w.front ? spec_.front : spec_.rear).tire.inertia;
      if (!w.contact || P[i].fz <= 0) {
        F0[i] = 0;
        a[i] = Iw / h;
        r[i] = 0;
        continue;
      }
      float k1, d1;
      F0[i] = fxAt(i, w.spin, kNew[i], dNew[i]);
      const float eps = 0.5f;
      const float D = std::max(0.0f, (fxAt(i, w.spin + eps, k1, d1) - F0[i]) / eps);
      a[i] = Iw / h + P[i].re * D;
      r[i] = -P[i].re * F0[i];
    }
    float omega[4];
    for (int i = 0; i < 4; ++i) omega[i] = wheels[static_cast<size_t>(i)].spin;
    // Driven axle (rear) with the engine through clutch, gearbox and diff.
    float axle = 0;
    float engineNext = engineSpeed_;
    const int L = 2, R = 3;
    if (iT != 0 && cap > 0) {
      const float avg0 = (omega[L] + omega[R]) * 0.5f;
      const float inv = 1 / a[L] + 1 / a[R];
      const float num = engineSpeed_ + h * Teng / Ie - iT * avg0 - 0.5f * iT * (r[L] / a[L] + r[R] / a[R]);
      const float den = h / Ie + eta * iT * iT * inv * 0.25f;
      float tc = num / den;
      const bool locked = std::fabs(tc) <= cap;
      if (!locked) tc = signf(tc) * cap;
      axle = eta * iT * tc;
      omega[L] += (axle * 0.5f + r[L]) / a[L];
      omega[R] += (axle * 0.5f + r[R]) / a[R];
      engineNext = locked ? iT * (omega[L] + omega[R]) * 0.5f : engineSpeed_ + h * (Teng - tc) / Ie;
    } else {
      omega[L] += r[L] / a[L];
      omega[R] += r[R] / a[R];
      engineNext = engineSpeed_ + h * Teng / Ie;
      if (shiftTimer > 0 && pendingGear_ != 0) {  // rev matching to the next gear
        const float target = std::max(drivenRpm(pendingGear_), spec_.idleRpm) / kRadToRpm;
        engineNext += (target - engineNext) * std::min(1.0f, h * 25);
      }
    }
    // Limited-slip diff: torque moves from the faster wheel to the slower.
    {
      const float diff = omega[L] - omega[R];
      const float need = diff / (1 / a[L] + 1 / a[R]);
      const bool power = axle * signf(omega[L] + omega[R]) >= 0;
      const float lockCap = spec_.diffPreload + (power ? spec_.diffPower : spec_.diffCoast) * std::fabs(axle);
      const float t = clampf(need, -lockCap, lockCap);
      omega[L] -= t / a[L];
      omega[R] += t / a[R];
    }
    // Front wheels roll free.
    omega[0] += r[0] / a[0];
    omega[1] += r[1] / a[1];
    // Brakes and rolling resistance: friction that can hold a wheel still.
    for (int i = 0; i < 4; ++i) {
      const float stop = P[i].brake / a[i];
      omega[i] = std::fabs(omega[i]) <= stop ? 0 : omega[i] - signf(omega[i]) * stop;
    }
    engineSpeed_ = std::max(engineNext, spec_.idleRpm * 0.7f / kRadToRpm);
    rpm = engineSpeed_ * kRadToRpm;
    // Commit: the tire forces at the final spin.
    for (int i = 0; i < 4; ++i) {
      Wheel& w = wheels[static_cast<size_t>(i)];
      w.spin = clampf(omega[i], -600, 600);
      Patch& p = P[i];
      if (!w.contact || p.fz <= 0) continue;
      const TireModel& tm = tires_[i < 2 ? 0 : 1];
      float kOut, dOut;
      const float fx = fxAt(i, w.spin, kOut, dOut);
      w.kappa = kOut;
      const TireForces tf = tm.eval(p.fz, kOut, w.alpha, p.mu);
      float dy = w.stickY + h * p.vcy;
      float fyStick = -(kStickK * dy + p.stickDamping * p.vcy);
      // The anchor slides when it would pull harder than the grip.
      const float vsx = p.vcx - w.spin * p.re;
      const float fxStick = -(kStickK * dOut + p.stickDamping * vsx);
      const float lim = tm.peakMu(p.fz, p.mu) * p.fz;
      const float mag = std::hypot(fxStick, fyStick);
      if (mag > lim) {
        const float s = lim / mag;
        dOut *= s;
        dy *= s;
        fyStick *= s;
      }
      if (p.wSlip >= 1) dOut = dy = 0;
      w.stickX = dOut;
      w.stickY = dy;
      p.fx += fx / kSubsteps;
      p.fy += (fyStick + (tf.fy - fyStick) * p.wSlip) / kSubsteps;
      p.mz += tf.mz * p.wSlip / kSubsteps;
      p.slide = tf.slide;
    }
  }
}

void Car::step(const Input& in, const Road& road) {
  const float h = kTick;
  gears(in);
  float throttle = clampf(in.throttle, 0, 1), brake = clampf(in.brake, 0, 1);
  if (in.autoGears && gear < 0) std::swap(throttle, brake);  // reverse: the pedals swap, as in most games
  if (in.hold) brake = 1;
  steering(in);
  const Vec3 ub = up();

  // --- Contact and tire loads.
  Patch P[4];
  for (int i = 0; i < 4; ++i) {
    Wheel& w = wheels[static_cast<size_t>(i)];
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    const float before = w.deflection;
    contact(i, road);
    Patch& p = P[i];
    p.re = a.tire.radius - w.deflection / 3;
    p.stickDamping = 2 * 0.5f * std::sqrt(kStickK * spec_.mass * 0.25f);
    if (w.contact) {
      const float rate = clampf((w.deflection - before) / h, -3, 3);
      p.fz = std::max(0.0f, a.tire.verticalRate * w.deflection + a.tire.verticalDamping * rate);
    }
    w.load = p.fz;
  }

  // --- Suspension: springs, dampers, bump stops, anti-roll bars.
  float susp[4];
  for (int i = 0; i < 4; ++i) {
    const Wheel& w = wheels[static_cast<size_t>(i)];
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    float f = a.wheelRate * w.travel;
    if (w.travel > w.bumpAt) f += a.bumpStopRate * std::pow(w.travel - w.bumpAt, 2.5f);
    const float v = w.travelSpeed;
    const float low = v > 0 ? a.bumpLow : a.reboundLow, high = v > 0 ? a.bumpHigh : a.reboundHigh;
    const float av = std::fabs(v);
    f += signf(v) * (av <= a.knee ? low * av : low * a.knee + high * (av - a.knee));
    susp[i] = f;
  }
  for (int axle = 0; axle < 4; axle += 2) {
    const AxleSpec& a = axle == 0 ? spec_.front : spec_.rear;
    const float roll = a.antiRoll * (wheels[static_cast<size_t>(axle)].travel - wheels[static_cast<size_t>(axle + 1)].travel);
    susp[axle] += roll;
    susp[axle + 1] -= roll;
  }

  // --- Contact patches: slip velocities, relaxed slip angle.
  for (int i = 0; i < 4; ++i) {
    Wheel& w = wheels[static_cast<size_t>(i)];
    Patch& p = P[i];
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    if (!w.contact || p.fz <= 0) {
      w.kappa *= 0.9f;
      w.alpha *= 0.9f;
      w.stickX = w.stickY = 0;
      w.fx = w.fy = w.mz = w.slide = 0;
      p.brake = brake * a.brakeTorque;
      continue;
    }
    const Vec3 n = w.contactNormal;
    const Vec3 fw = rotation.rotate({-std::sin(w.steer), 0, -std::cos(w.steer)});
    p.ft = normalize(fw - n * dot(fw, n));
    p.yt = cross(n, p.ft);
    const Vec3 v = pointVelocity(w.contactPoint);
    p.vcx = dot(v, p.ft);
    p.vcy = dot(v, p.yt);
    p.mu = w.roadMu;
    const TireModel& tm = tires_[i < 2 ? 0 : 1];
    const float ax = std::fabs(p.vcx);
    const float ass = std::atan2(-p.vcy, std::max(ax, kVlo));
    const float ky = (ax + kVrel) / tm.relaxY(p.fz);
    w.alpha = (w.alpha + h * ky * ass) / (1 + h * ky);
    p.wSlip = smooth01((std::hypot(p.vcx, p.vcy) - 0.5f) / 1.5f);
    // ABS: lets a wheel's pressure off as it starts to lock, back on as it rolls.
    if (in.abs && std::fabs(p.vcx) > 2) {
      if (w.kappa < -0.13f) w.absFactor -= h * 25;
      else if (w.kappa > -0.08f) w.absFactor += h * 10;
      w.absFactor = clampf(w.absFactor, 0.05f, 1);
    } else {
      w.absFactor = 1;
    }
    float b = brake * a.brakeTorque * w.absFactor;
    if (!w.front) b += clampf(in.handbrake, 0, 1) * spec_.handbrakeTorque * 0.5f;
    p.brake = b + (a.tire.rolling + w.roadRolling) * p.fz * p.re;
  }
  absActive = false;
  for (const Wheel& w : wheels) absActive = absActive || w.absFactor < 0.95f;
  brakeUsed = brake;

  // --- Engine: limiter, throttle lag, traction control, idle.
  float thr = throttle;
  if (shiftTimer > 0) thr = 0;
  if (rpm > spec_.redline) fuelCut_ = true;
  else if (rpm < spec_.redline - spec_.limiterDrop) fuelCut_ = false;
  if (fuelCut_) thr = 0;
  throttleLag_ += (thr - throttleLag_) * (1 - std::exp(-h / std::max(spec_.throttleLag, 0.005f)));
  // Traction control: the driven wheels' speed against the free-rolling
  // fronts (like the real sensors); cuts torque at once (spark), gives it
  // back gently.
  tcActive = false;
  if (in.tc > 0) {
    const float ground = 0.5f * (wheels[0].spin * spec_.front.tire.radius + wheels[1].spin * spec_.front.tire.radius);
    const float driven = 0.5f * (wheels[2].spin + wheels[3].spin) * spec_.rear.tire.radius;
    const float slip = (driven - ground) * signf(ratio() != 0 ? ratio() : 1.0f) / std::max(std::fabs(ground), 7.0f);
    const float target = 0.14f - 0.05f * in.tc;
    const float want = clampf(1 - (slip - target) * 6 * in.tc, 0.05f, 1);
    tcCut_ += (want - tcCut_) * std::min(1.0f, want < tcCut_ ? h / 0.01f : h / 0.15f);
    tcActive = tcCut_ < 0.97f && throttle > 0.05f;
  } else {
    tcCut_ = 1;
  }
  if (rpm < spec_.idleRpm + 150) idleI_ = clampf(idleI_ + h * (spec_.idleRpm - rpm) * 0.002f, 0, 0.3f);
  else idleI_ *= 0.995f;
  const float idle = clampf((spec_.idleRpm + 50 - rpm) * 0.004f + idleI_, 0, 0.5f);
  float hold = 1;
  if (launching_ && in.tc > 0) hold = clampf(1 - (rpm - 3400) / 600, 0.1f, 1);  // launch control holds the revs
  throttleUsed = std::max(throttleLag_ * tcCut_ * hold, idle);

  // --- Driveline and tire forces (two implicit substeps).
  driveline(in, throttleUsed, brake, P);

  // --- Forces on the body.
  Vec3 force, torque;
  const auto add = [&](Vec3 f, Vec3 at) {
    force += f;
    torque += cross(at - position, f);
  };
  for (int i = 0; i < 4; ++i) {
    Wheel& w = wheels[static_cast<size_t>(i)];
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    add(ub * susp[i], worldPoint(wheelCentre(i)));
    if (!w.contact || P[i].fz <= 0) continue;
    const Patch& p = P[i];
    w.fx = p.fx;
    w.fy = p.fy;
    w.mz = p.mz;
    w.slide = p.slide;
    add(p.ft * p.fx + p.yt * p.fy, w.contactPoint + ub * a.rollCentre);
    const Vec3 fn = w.contactNormal * p.fz;
    add(fn - ub * dot(fn, ub), w.contactPoint);  // the part of the road's push across the suspension
    torque += w.contactNormal * p.mz;
    if (w.roadDrag > 0) {
      const Vec3 v = pointVelocity(w.contactPoint);
      const float s = length(v);
      if (s > 0.05f) add(v * (-w.roadDrag * p.fz * clampf(s / 3, 0, 1) / s), w.contactPoint);
    }
  }
  // Aero: drag at the CG, lift at each axle.
  const float v2 = dot(velocity, velocity);
  if (v2 > 0.01f) add(velocity * (-0.5f * kRho * spec_.dragArea * std::sqrt(v2)), position);
  const float vf = dot(velocity, forward());
  for (const AxleSpec* a : {&spec_.front, &spec_.rear}) {
    add(ub * (0.5f * kRho * a->liftCoef * spec_.frontalArea * vf * vf), worldPoint({0, 0, -a->z}));
  }

  // --- Wheels move up and down between the suspension and the tire.
  for (int i = 0; i < 4; ++i) {
    Wheel& w = wheels[static_cast<size_t>(i)];
    const AxleSpec& a = w.front ? spec_.front : spec_.rear;
    const Vec3 r = rotation.rotate(wheelCentre(i));
    const float attachUp = dot(lastAccel_ + cross(lastAngAccel_, r), ub);
    const float tireUp = w.contact ? P[i].fz * dot(w.contactNormal, ub) : 0;
    const float acc = (tireUp - susp[i]) / a.tire.unsprungMass - kG * ub.y - attachUp;
    w.travelSpeed += h * acc;
    w.travel += h * w.travelSpeed;
    if (w.travel < 0) {  // full droop: the wheel hangs
      w.travel = 0;
      w.travelSpeed = std::max(w.travelSpeed, 0.0f);
    }
    const float full = w.bumpAt + 0.035f;
    if (w.travel > full) {
      w.travel = full;
      w.travelSpeed = std::min(w.travelSpeed, 0.0f);
    }
    w.angle += w.spin * h;
    if (w.angle > 1000) w.angle -= 2 * kPi * 159;
    if (w.angle < -1000) w.angle += 2 * kPi * 159;
  }

  // --- Integrate the chassis. Along the car's up axis only the sprung mass
  // moves (the wheels carry their own); across it, the whole car.
  const Vec3 along = ub * dot(force, ub);
  const Vec3 acc = along * (1 / sprungMass_) + (force - along) * (1 / spec_.mass) + Vec3{0, -kG, 0};
  velocity += acc * h;
  const Quat inv = conjugate(rotation);
  const Vec3 w1 = inv.rotate(angularVelocity), tb = inv.rotate(torque);
  const Vec3 I{spec_.inertiaPitch, spec_.inertiaYaw, spec_.inertiaRoll};
  // Implicit gyroscopic term (one Newton step): stays stable in fast spins.
  const Vec3 Iw{I.x * w1.x, I.y * w1.y, I.z * w1.z};
  const Vec3 f = (cross(w1, Iw) - tb) * h;
  // J = I + h (skew(w) I - skew(I w))
  const float J[3][3] = {
      {I.x, h * (-w1.z * I.y + Iw.z), h * (w1.y * I.z - Iw.y)},
      {h * (w1.z * I.x - Iw.z), I.y, h * (-w1.x * I.z + Iw.x)},
      {h * (-w1.y * I.x + Iw.y), h * (w1.x * I.y - Iw.x), I.z},
  };
  const Vec3 w2 = w1 - solve3(J, f);
  const Vec3 before = angularVelocity;
  angularVelocity = rotation.rotate(w2);
  const float spinRate = length(angularVelocity);
  if (spinRate > 30) angularVelocity = angularVelocity * (30 / spinRate);
  const float speedNow = length(velocity);
  if (speedNow > 150) velocity = velocity * (150 / speedNow);
  position += velocity * h;
  const Quat q{angularVelocity.x, angularVelocity.y, angularVelocity.z, 0};
  const Quat d = q * rotation;
  rotation = normalized({rotation.x + 0.5f * h * d.x, rotation.y + 0.5f * h * d.y, rotation.z + 0.5f * h * d.z,
                         rotation.w + 0.5f * h * d.w});
  lastAccel_ = acc;
  lastAngAccel_ = (angularVelocity - before) * (1 / h);
  accelLocal = conjugate(rotation).rotate(acc + Vec3{0, kG, 0});
}

}  // namespace engine::drive
