// The new driving physics, measured (docs/plan/jobs/W20.md §17, the MVP's
// rows): static settle, drop, parked creep, slope hold, 0-60, top speed,
// 60-0 braking, the 40 m skid pad, through zero into reverse, a 5 cm bump,
// letting go of the wheel, the handbrake. Prints numbers and fails on limits.
//   g++ -std=c++20 -O2 -I. tools/native/drive_lab.cpp looped/drive/*.cpp looped/json.cpp
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <string>
#include <vector>

#include "looped/drive/car_spec.h"
#include "looped/drive/vehicle_sim.h"

using engine::Vec3;
using namespace engine::drive;

namespace {

int failures = 0;
void check(bool ok, const char* what, double value, double lo, double hi) {
  std::printf("  %-44s %10.3f  [%g .. %g]  %s\n", what, value, lo, hi, ok ? "ok" : "FAIL");
  if (!ok) ++failures;
}
void range(const char* what, double v, double lo, double hi) { check(v >= lo && v <= hi && std::isfinite(v), what, v, lo, hi); }

// A plane through the origin, tilted up toward -z by `slope` (rise / run),
// with an optional bump (height, at z, length along z).
struct TestRoad : Road {
  float slope = 0, bumpH = 0, bumpZ = 0, bumpLen = 1;
  bool query(Vec3 p, RoadHit& hit, int&) const override {
    float y = -p.z * slope;
    float dydz = -slope;
    if (bumpH != 0) {
      const float t = (p.z - bumpZ) / bumpLen;  // one smooth hump over -1..0
      if (t > -1 && t < 0) {
        const float u = -t;  // 0..1
        y += bumpH * 0.5f * (1 - std::cos(u * 2 * engine::kPi));
        dydz += -bumpH * 0.5f * std::sin(u * 2 * engine::kPi) * 2 * engine::kPi / bumpLen;
      }
    }
    hit.height = y;
    hit.normal = engine::normalize(Vec3{0, 1, -dydz});
    hit.mu = 1;
    return true;
  }
};

Car fresh(const Road& road, float heading = 0) {
  Car c;
  c.setup(ridgebackGS());
  RoadHit h;
  int hint = -1;
  road.query({0, 0, 0}, h, hint);
  c.place({0, h.height, 0}, heading, h.normal);
  return c;
}

void settle(Car& c, const Road& road, float seconds, Input in = {}) {
  for (int i = 0; i < static_cast<int>(seconds / Car::kTick); ++i) c.step(in, road);
}

float heading(const Car& c) { return Car::headingOf(c.forward()); }

}  // namespace

int main() {
  const CarSpec spec = ridgebackGS();
  std::printf("drive_lab: %s, %.0f kg\n", spec.name.c_str(), spec.mass);
  for (const std::string& p : validate(spec)) {
    std::printf("  spec problem: %s\n", p.c_str());
    ++failures;
  }
  TestRoad flat;

  // Static settle: corner loads = static, the car comes to rest.
  {
    Car c = fresh(flat);
    settle(c, flat, 4);
    float worst = 0;
    for (int i = 0; i < 4; ++i) {
      const float want = staticCornerLoad(spec, i);
      worst = std::max(worst, std::fabs(c.wheels[static_cast<size_t>(i)].load - want) / want);
    }
    range("static: worst corner load error (%)", worst * 100, 0, 1.5);
    range("static: body vertical speed (mm/s)", std::fabs(c.velocity.y) * 1000, 0, 2);
    range("static: ride height change (mm)", (c.position.y - spec.cgHeight) * 1000, -12, 12);
  }
  // Parked: no creep over 10 s.
  {
    Car c = fresh(flat);
    settle(c, flat, 1);
    const Vec3 p0 = c.position;
    settle(c, flat, 10);
    const Vec3 d = c.position - p0;
    range("parked: moved in 10 s (mm)", std::hypot(d.x, d.z) * 1000, 0, 10);
  }
  // Drop from 0.3 m: lands, every bounce lower, settles.
  {
    Car c = fresh(flat);
    c.position.y += 0.3f;
    float lastPeak = 1e9f, prev = c.position.y, prevV = 0;
    int rising = 0;
    bool gained = false;
    for (int i = 0; i < 480 * 4; ++i) {
      c.step({}, flat);
      const float v = c.velocity.y;
      if (prevV > 0 && v <= 0) {  // a peak
        if (c.position.y > lastPeak + 1e-4f) gained = true;
        lastPeak = c.position.y;
        ++rising;
      }
      prev = c.position.y;
      prevV = v;
    }
    (void)prev;
    check(!gained, "drop: each bounce lower than the last", rising, 0, 0);
    range("drop: at rest after 4 s (mm/s)", std::fabs(c.velocity.y) * 1000, 0, 3);
  }
  // 20% slope, brake held: stays put.
  {
    TestRoad hill;
    hill.slope = 0.2f;
    Car c = fresh(hill);
    Input in;
    in.brake = 1;
    in.autoGears = false;  // (auto gears would take a held brake at a stop as "reverse")
    settle(c, hill, 3, in);
    const Vec3 p0 = c.position;
    settle(c, hill, 10, in);
    const Vec3 d = c.position - p0;
    range("slope 20%, brake held: moved in 10 s (mm)", engine::length(d) * 1000, 0, 10);
  }
  // 0-60 mph and 0-100 km/h, full throttle.
  {
    Car c = fresh(flat);
    settle(c, flat, 1);
    Input in;
    in.throttle = 1;
    in.tc = 0.6f;  // (a launch with traction control on, as magazines test)
    float t = 0, t60 = 0, t100 = 0, quarter = 0;
    Vec3 start = c.position;
    while (t < 20) {
      c.step(in, flat);
      t += Car::kTick;
      const float v = c.speed();
      if (t60 == 0 && v >= 26.82f) t60 = t;
      if (t100 == 0 && v >= 27.78f) t100 = t;
      if (quarter == 0 && engine::length(c.position - start) >= 402.3f) quarter = t;
      if (quarter > 0 && t100 > 0) break;
    }
    range("0-60 mph (s) [3.6-3.8 with 1 ft rollout]", t60, 3.4, 4.2);
    std::printf("  0-100 km/h %.2f s, quarter mile %.2f s\n", t100, quarter);
  }
  // Top speed.
  {
    Car c = fresh(flat);
    settle(c, flat, 0.5f);
    c.setSpeed(60);
    Input in;
    in.throttle = 1;
    float vmax = 0;
    for (int i = 0; i < 480 * 90; ++i) {
      c.step(in, flat);
      vmax = std::max(vmax, c.speed());
    }
    range("top speed (km/h) [target ~300]", vmax * 3.6, 280, 320);
  }
  // 60-0 mph braking with ABS: distance, and it stays straight.
  {
    Car c = fresh(flat);
    settle(c, flat, 0.5f);
    c.setSpeed(26.82f);
    settle(c, flat, 0.3f, Input{.throttle = 0.2f});
    c.setSpeed(26.82f);
    const Vec3 p0 = c.position;
    const float h0 = heading(c);
    Input in;
    in.brake = 1;
    float t = 0;
    while (c.speed() > 0.05f && t < 10) {
      c.step(in, flat);
      t += Car::kTick;
    }
    const float dist = engine::length(c.position - p0);
    range("60-0 mph braking (m) [target 29-30.5]", dist, 27, 33);
    range("60-0: heading change (deg)", std::fabs(engine::wrapAngle(heading(c) - h0)) * 57.3, 0, 1);
  }
  // Skid pad, 40 m radius: a scripted driver holds the circle while the
  // speed rises; the most sideways g held steady is the car's grip.
  {
    Car c = fresh(flat);
    settle(c, flat, 0.5f);
    const float Rc = 40;
    // Start on the circle centred at (-Rc, 0), driving -z (counter-clockwise from above: turning left).
    c.setSpeed(12);
    float target = 12, best = 0, t = 0;
    float steerI = 0;
    int lostFor = 0;
    while (t < 120) {
      const Vec3 p = c.position;
      const float r = std::hypot(p.x + Rc, p.z);
      // Path heading for a left circle around (-Rc, 0).
      const Vec3 radial = engine::normalize(Vec3{p.x + Rc, 0, p.z});
      const Vec3 tangent{radial.z, 0, -radial.x};
      const float err = r - Rc;  // outside: steer more left
      const float headingErr = engine::wrapAngle(Car::headingOf(tangent) - heading(c));
      steerI = engine::clampf(steerI + Car::kTick * err * 0.02f, -0.5f, 0.5f);
      const float wheelbase = spec.wheelbase();
      const float ff = std::atan(wheelbase / Rc) / spec.maxRoadWheel();
      Input in;
      in.steer = engine::clampf(-(ff * 1.2f + err * 0.05f + headingErr * 1.2f + steerI), -1, 1);
      in.throttle = engine::clampf(0.25f + (target - c.speed()) * 0.4f, 0, 1);
      in.tc = 0.6f;
      c.step(in, flat);
      t += Car::kTick;
      if (t > 4) target += Car::kTick * 0.25f;
      const float lat = std::fabs(c.accelLocal.x) / 9.81f;
      if (std::fabs(err) < 1.0f) {
        best = std::max(best, std::min(lat, c.speed() * c.speed() / Rc / 9.81f));
        lostFor = 0;
      } else if (t > 6 && ++lostFor > 480) {
        break;
      }
    }
    range("skid pad 40 m: steady sideways g [target ~1.10]", best, 1.0, 1.22);
  }
  // Through zero: braking from 5 km/h into reverse, no speed steps.
  {
    Car c = fresh(flat);
    settle(c, flat, 0.5f);
    c.setSpeed(1.4f);
    Input in;
    in.brake = 1;
    float prev = c.speed(), worst = 0;
    for (int i = 0; i < 480 * 4; ++i) {
      c.step(in, flat);
      worst = std::max(worst, std::fabs(c.speed() - prev));
      prev = c.speed();
    }
    range("through zero: biggest speed step (m/s)", worst, 0, 0.3);
    std::printf("  through zero: in gear %d at %.2f m/s after 4 s\n", c.gear, c.speed());
  }
  // A 5 cm bump at 80 km/h: settles within ~2 bounces.
  {
    TestRoad b;
    b.bumpH = 0.05f;
    b.bumpZ = -30;
    b.bumpLen = 1.2f;
    Car c = fresh(b);
    settle(c, b, 0.5f);
    c.setSpeed(22.2f);
    Input in;
    in.throttle = 0.35f;
    float t = 0, after = -1, lastBig = 0, maxPitch = 0;
    while (t < 3) {
      c.step(in, b);
      t += Car::kTick;
      if (after < 0 && c.position.z < b.bumpZ - b.bumpLen) after = t;
      if (after >= 0 && std::fabs(c.velocity.y) > 0.05f) lastBig = t;
      maxPitch = std::max(maxPitch, std::fabs(c.angularVelocity.x));
    }
    range("5 cm bump at 80 km/h: settled after (s)", lastBig - after, 0, 0.8);
    range("bump: no wheel lifted far (max travel speed ok)", maxPitch, 0, 2);
  }
  // Let go of the wheel at 100 km/h after a lane change: it comes back to
  // the middle by itself (caster), and the car runs straight.
  {
    Car c = fresh(flat);
    settle(c, flat, 0.5f);
    c.setSpeed(27.8f);
    Input in;
    in.throttle = 0.3f;
    in.steer = -0.06f;
    settle(c, flat, 0.6f, in);
    in.steer = 0;
    in.handStrength = 0.1f;  // hands almost off
    settle(c, flat, 3, in);
    range("let go at 100 km/h: wheel angle after 3 s (deg)", std::fabs(c.wheelAngle) * 57.3, 0, 8);
    range("let go: yaw rate after 3 s (deg/s)", std::fabs(c.angularVelocity.y) * 57.3, 0, 2);
  }
  // Handbrake while turning at 50 km/h: the back steps out.
  {
    Car c = fresh(flat);
    settle(c, flat, 0.5f);
    c.setSpeed(14);
    Input in;
    in.steer = -0.35f;
    in.throttle = 0.2f;
    settle(c, flat, 0.8f, in);
    in.handbrake = 1;
    float slip = 0;
    for (int i = 0; i < 480; ++i) {
      c.step(in, flat);
      const Vec3 v = c.velocity;
      const float beta = std::atan2(engine::dot(v, c.right()), std::max(std::fabs(c.speed()), 1.0f));
      slip = std::max(slip, std::fabs(beta));
    }
    range("handbrake turn: body slip reached (deg)", slip * 57.3, 8, 120);
  }
  // Power oversteer: 2nd gear in a turn at 45 km/h, TC off, floor it: the
  // back steps out (you can drift on the throttle).
  {
    Car c = fresh(flat);
    settle(c, flat, 0.5f);
    c.setSpeed(12.5f);
    Input in;
    in.tc = 0;
    in.steer = -0.3f;
    in.throttle = 0.3f;
    settle(c, flat, 1.0f, in);
    in.throttle = 1;
    float slip = 0;
    for (int i = 0; i < 480 * 2; ++i) {
      c.step(in, flat);
      const float beta = std::atan2(engine::dot(c.velocity, c.right()), std::max(std::fabs(c.speed()), 1.0f));
      slip = std::max(slip, std::fabs(beta));
    }
    range("power oversteer, TC off: body slip reached (deg)", slip * 57.3, 15, 180);
    std::printf("  (gear %d, %.0f rpm at the end)\n", c.gear, c.rpm);
  }
  // Full power mid-corner in 2nd at 45 km/h: the clutch stays in and the
  // engine revs freely (it once held the revs at launch speed there).
  {
    Car c = fresh(flat);
    settle(c, flat, 0.5f);
    c.setSpeed(12.5f);
    Input in;
    in.throttle = 1;
    in.tc = 0.6f;
    float maxRpm = 0;
    for (int i = 0; i < 480 * 2; ++i) {
      c.step(in, flat);
      maxRpm = std::max(maxRpm, c.rpm);
    }
    range("full throttle from 45 km/h: revs reached", maxRpm, 5000, 7000);
  }
  // Bench: ticks per second on this machine.
  {
    Car c = fresh(flat);
    c.setSpeed(30);
    Input in;
    in.throttle = 0.5f;
    in.steer = 0.1f;
    const int n = 480 * 20;
    const auto t0 = std::clock();
    for (int i = 0; i < n; ++i) c.step(in, flat);
    const double sec = static_cast<double>(std::clock() - t0) / CLOCKS_PER_SEC;
    std::printf("  bench: %.1f us per tick (%.2f%% of a core at 480 Hz)\n", sec / n * 1e6, sec / n * 480 * 100);
  }
  if (failures) {
    std::printf("drive_lab: %d FAILED\n", failures);
    return 1;
  }
  std::printf("drive_lab: all passed\n");
  return 0;
}
