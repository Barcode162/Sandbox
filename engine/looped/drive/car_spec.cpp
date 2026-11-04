#include "looped/drive/car_spec.h"

#include <algorithm>
#include <cmath>
#include <cstdio>

#include "looped/json.h"

namespace engine::drive {
namespace {
constexpr float kG = 9.81f;
constexpr float kPi = 3.14159265f;
}  // namespace

float CarSpec::maxRoadWheel() const { return lockDeg / steeringRatio * kPi / 180; }

float CarSpec::peakTorque() const {
  float m = 0;
  for (const auto& p : torqueCurve) m = std::max(m, p[1]);
  return m;
}

float staticCornerLoad(const CarSpec& s, int corner) {
  const float frontShare = -s.rear.z / s.wheelbase();
  return s.mass * kG * (corner < 2 ? frontShare : 1 - frontShare) * 0.5f;
}

CarSpec ridgebackGS() {
  // Sources and [S]/[E] labels: docs/plan/jobs/W20.md §5.1.
  CarSpec s;
  s.id = "ridgeback_gs";
  s.name = "Vance Ridgeback GS";
  s.mass = 1560 + 75;          // curb [S] + driver
  // Box estimate scaled to a ~1.2 m yaw radius of gyration [E] (§4.1).
  s.inertiaYaw = 2360;
  s.inertiaPitch = 2130;
  s.inertiaRoll = 530;
  s.cgHeight = 0.46f;          // [E]
  // Wheelbase 2,710 mm [S], ~51/49 [E]; tracks 1,613 / 1,588 mm [S].
  s.front.z = 1.329f;
  s.rear.z = -1.381f;
  s.front.halfTrack = 0.8065f;
  s.rear.halfTrack = 0.794f;
  s.front.steered = true;
  s.rear.driven = true;
  // Ride ~1.75 Hz front, ~1.95 Hz rear [E] (§4.4): k = m_corner (2 pi f)^2.
  s.front.wheelRate = 45000;
  s.rear.wheelRate = 52500;
  // Dampers: ~0.3 of critical in bump, ~0.6 in rebound [E].
  s.front.bumpLow = 2450;
  s.front.reboundLow = 4900;
  s.rear.bumpLow = 2570;
  s.rear.reboundLow = 5150;
  s.front.bumpHigh = 0.4f * s.front.bumpLow;
  s.front.reboundHigh = 0.4f * s.front.reboundLow;
  s.rear.bumpHigh = 0.4f * s.rear.bumpLow;
  s.rear.reboundHigh = 0.4f * s.rear.reboundLow;
  // Anti-roll (bars + the transverse leaf's share) for ~1.3 deg/g [E].
  s.front.antiRoll = 27700;
  s.rear.antiRoll = 19000;
  s.front.rollCentre = 0.05f;
  s.rear.rollCentre = 0.10f;
  // Brakes: ~1.25 g with headroom [E: from 60-0 ~ 30 m], 62% front.
  s.front.brakeTorque = 2950;
  s.rear.brakeTorque = 1800;
  s.handbrakeTorque = 4000;  // strong enough to lock the rears for a handbrake turn [D]
  // Aero: a little lift in front, a little downforce at the back [E].
  s.front.liftCoef = 0.02f;
  s.rear.liftCoef = -0.02f;
  s.dragArea = 0.71f;          // fitted to ~300 km/h [E] (§4.12)
  s.frontalArea = 2.0f;
  // Tires: 285/30ZR19 front, 335/25ZR20 rear [S], "extreme summer" [E].
  TireSpec f;
  f.radius = 0.327f;
  f.width = 0.285f;
  f.inertia = 1.2f;
  f.unsprungMass = 45;
  f.muY = 1.22f;
  f.muX = 1.38f;
  TireSpec r = f;
  r.radius = 0.338f;
  r.width = 0.335f;
  r.inertia = 1.45f;
  r.unsprungMass = 50;
  r.ratedLoad = 4300;
  r.muY = 1.24f;
  r.muX = 1.40f;
  s.front.tire = f;
  s.rear.tire = r;
  // LT1 6.2 V8: 460 hp @ 6,000 and 465 lb-ft @ 4,600 [S].
  s.torqueCurve = {{800, 360},  {1500, 470}, {2000, 525}, {3000, 585}, {4000, 620}, {4600, 630},
                   {5200, 615}, {6000, 546}, {6600, 500}, {7000, 440}};
  s.idleRpm = 600;
  s.redline = 6600;
  s.engineInertia = 0.28f;
  s.engineBrake = 0.14f;
  s.clutchTorque = 820;
  // Tremec TR-6070 7-speed [S], final 3.42 [S].
  s.gears = {2.97f, 2.07f, 1.43f, 1.00f, 0.71f, 0.57f, 0.48f};
  s.reverseGear = 2.90f;
  s.finalDrive = 3.42f;
  s.driveEfficiency = 0.88f;
  s.shiftTime = 0.15f;
  s.diffPreload = 90;
  s.diffPower = 0.4f;
  s.diffCoast = 0.25f;
  s.steeringRatio = 12.5f;     // 36 degrees at the road wheel [D]: tighter than the real car's
                               // 11.5 m circle (user, 2026-10-20: turning and drifting)
  s.lockDeg = 450;             // 2.5 turns lock to lock [E]
  s.ackermann = 0.4f;
  return s;
}

CarSpec applySetup(const CarSpec& stock, const Setup& u) {
  CarSpec s = stock;
  for (AxleSpec* a : {&s.front, &s.rear}) {
    const bool f = a == &s.front;
    a->tire.muX *= u.grip;
    a->tire.muY *= u.grip;
    const float k = f ? u.springF : u.springR;
    a->wheelRate *= k;
    const float d = f ? u.damperF : u.damperR;
    a->bumpLow *= d;
    a->bumpHigh *= d;
    a->reboundLow *= d;
    a->reboundHigh *= d;
    a->antiRoll *= f ? u.arbF : u.arbR;
  }
  if (u.brakeBias > 0) {
    const float total = stock.front.brakeTorque + stock.rear.brakeTorque;
    const float bias = std::clamp(u.brakeBias, 0.4f, 0.85f);
    s.front.brakeTorque = total * bias;
    s.rear.brakeTorque = total * (1 - bias);
  }
  if (u.diffLock >= 0) {
    const float l = std::clamp(u.diffLock, 0.0f, 1.0f);
    s.diffPreload = 20 + 260 * l;
    s.diffPower = 0.05f + 0.85f * l;
    s.diffCoast = 0.03f + 0.6f * l;
  }
  if (u.steerRatio > 0) {
    const float lockRoad = stock.lockDeg / stock.steeringRatio;
    s.steeringRatio = std::clamp(u.steerRatio, 8.0f, 20.0f);
    s.lockDeg = lockRoad * s.steeringRatio;  // the same road-wheel lock
  }
  s.handbrakeTorque *= u.handbrake;
  return s;
}

bool parseSetup(const std::string& text, Setup& o) {
  const Json j = Json::parse(text);
  if (!j.isObject()) return false;
  const auto num = [&](const char* key, float& v, float lo, float hi) {
    const Json& x = j[key];
    if (x.isNumber() && std::isfinite(x.number())) v = std::clamp(static_cast<float>(x.number()), lo, hi);
  };
  const auto flag = [&](const char* key, bool& v) {
    const Json& x = j[key];
    if (x.type() == Json::Type::kBool) v = x.boolean();
    else if (x.isNumber()) v = x.number() != 0;
  };
  num("grip", o.grip, 0.5f, 1.6f);
  num("springF", o.springF, 0.4f, 2.5f);
  num("springR", o.springR, 0.4f, 2.5f);
  num("damperF", o.damperF, 0.4f, 2.5f);
  num("damperR", o.damperR, 0.4f, 2.5f);
  num("arbF", o.arbF, 0, 3);
  num("arbR", o.arbR, 0, 3);
  num("brakeBias", o.brakeBias, -1, 0.85f);
  num("diffLock", o.diffLock, -1, 1);
  num("steerRatio", o.steerRatio, -1, 20);
  num("steerWeight", o.steerWeight, 0, 3);
  num("handStrength", o.handStrength, 0.3f, 3);
  num("steerAssist", o.steerAssist, 0, 1);
  num("handbrake", o.handbrake, 0.3f, 4);
  num("tc", o.tc, 0, 1);
  num("cameraDistance", o.cameraDistance, 0.6f, 2);
  flag("abs", o.abs);
  flag("telemetry", o.telemetry);
  flag("oldPhysics", o.oldPhysics);
  return true;
}

std::vector<std::string> validate(const CarSpec& s) {
  std::vector<std::string> out;
  char b[160];
  if (s.mass < 500 || s.mass > 4000) out.push_back("mass out of range");
  if (s.wheelbase() < 1.5f || s.wheelbase() > 4) out.push_back("wheelbase out of range");
  if (s.gears.empty()) out.push_back("no gears");
  if (s.torqueCurve.size() < 2) out.push_back("torque curve needs 2+ points");
  for (size_t i = 1; i < s.torqueCurve.size(); ++i) {
    if (s.torqueCurve[i][0] <= s.torqueCurve[i - 1][0]) out.push_back("torque curve rpm not rising");
  }
  for (int c = 0; c < 4; ++c) {
    const AxleSpec& a = c < 2 ? s.front : s.rear;
    const float sprung = staticCornerLoad(s, c) - a.tire.unsprungMass * kG;
    const float sag = sprung / a.wheelRate;
    if (sag < 0.02f || sag > 0.15f) {
      std::snprintf(b, sizeof(b), "corner %d sag %.3f m outside 0.02-0.15", c, sag);
      out.push_back(b);
    }
    const float hz = std::sqrt(a.wheelRate / (sprung / kG)) / (2 * kPi);
    if (hz < 0.8f || hz > 4) {
      std::snprintf(b, sizeof(b), "corner %d ride frequency %.2f Hz outside 0.8-4", c, hz);
      out.push_back(b);
    }
  }
  return out;
}

}  // namespace engine::drive
