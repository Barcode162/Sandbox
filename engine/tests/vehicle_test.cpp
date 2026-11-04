// Native test of the car physics (no browser): checks the car behaves like
// a real one. Build and run:
//   g++ -std=c++20 -O2 -I. tools/native/vehicle_test.cpp looped/vehicle.cpp -o build/vehicle_test && build/vehicle_test
#include <cmath>
#include <cstdio>

#include "looped/vehicle.h"

using namespace engine;

struct Flat : Ground {
  bool cast(Vec3 o, Vec3 d, float maxD, GroundHit& h, int&) const override {
    if (d.y >= -1e-4f) return false;
    const float t = -o.y / d.y;
    if (t < 0 || t > maxD) return false;
    h.distance = t;
    h.point = o + d * t;
    h.normal = {0, 1, 0};
    return true;
  }
};

CarSpec sportsCar() {
  CarSpec s;
  s.front = {.z = 1.25f, .halfTrack = 0.79f, .spring = 62000, .bump = 3600, .rebound = 5600, .antiRoll = 26000,
             .travel = 0.12f, .restLength = 0.3f, .driven = false, .steered = true, .brakeShare = 0.64f,
             .downforce = 0.18f, .rollCenter = 0.08f};
  s.rear = {.z = -1.3f, .halfTrack = 0.78f, .spring = 58000, .bump = 3400, .rebound = 5200, .antiRoll = 16000,
            .travel = 0.12f, .restLength = 0.3f, .driven = true, .steered = false, .brakeShare = 0.36f,
            .downforce = 0.24f, .rollCenter = 0.12f, .grip = 1.06f};
  return s;
}

int main() {
  int failures = 0;  // basic sanity checks, so CI can fail on a broken car
  Flat ground;
  CarAssists assists;
  const float dt = 1.0f / 240;
  // 1. Parked: does it settle and stay still?
  {
    Vehicle car;
    car.setup(sportsCar());
    car.place({0, 0, 0}, 0);
    for (int i = 0; i < 240 * 3; ++i) car.step(dt, {}, assists, ground);
    std::printf("parked 3 s: y=%.3f drift=%.4f m speed=%.4f loads=%.0f %.0f %.0f %.0f\n", car.position.y,
                std::hypot(car.position.x, car.position.z), length(car.velocity), car.wheels[0].load,
                car.wheels[1].load, car.wheels[2].load, car.wheels[3].load);
  }
  // 2. Launch: 0-100 km/h, 0-200, top speed after 40 s.
  {
    Vehicle car;
    car.setup(sportsCar());
    car.place({0, 0, 0}, 0);
    for (int i = 0; i < 240; ++i) car.step(dt, {}, assists, ground);
    CarInput in;
    in.throttle = 1;
    float t100 = -1, t200 = -1, quarter = -1;
    const float z0 = -car.position.z;
    for (int i = 0; i < 240 * 40; ++i) {
      car.step(dt, in, assists, ground);
      const float kmh = car.speed() * 3.6f, t = (i + 1) * dt;
      if (t100 < 0 && kmh >= 100) t100 = t;
      if (t200 < 0 && kmh >= 200) t200 = t;
      if (quarter < 0 && -car.position.z - z0 >= 402) quarter = t;
      if (i % 240 == 0 && i < 240 * 12)
        std::printf("  t=%4.1f %5.1f km/h gear %d rpm %4.0f slipR %.2f clutch %.2f pitch %.3f\n", t, kmh, car.gear,
                    car.rpm, car.wheels[2].slipRatio, car.clutchEngage, car.forward().y);
    }
    std::printf("launch: 0-100 %.2f s, 0-200 %.2f s, 402 m %.2f s, top %.0f km/h (gear %d, rpm %.0f)\n", t100, t200,
                quarter, car.speed() * 3.6f, car.gear, car.rpm);
    // 3. Braking from there to 0... measure 100-0.
  }
  {
    Vehicle car;
    car.setup(sportsCar());
    car.place({0, 0, 0}, 0);
    car.setSpeed(100 / 3.6f);
    CarInput in;
    in.brake = 1;
    const float z0 = -car.position.z;
    int steps = 0;
    while (car.speed() > 0.1f && steps < 240 * 10) {
      car.step(dt, in, assists, ground);
      ++steps;
    }
    std::printf("braking 100-0: %.1f m in %.2f s (ABS on), heading drift %.4f\n", -car.position.z - z0, steps * dt,
                car.forward().x);
    assists.abs = false;
    car.place({0, 0, 0}, 0);
    car.setSpeed(100 / 3.6f);
    steps = 0;
    while (car.speed() > 0.1f && steps < 240 * 10) {
      car.step(dt, in, assists, ground);
      ++steps;
    }
    std::printf("braking 100-0: %.1f m (ABS off)\n", -car.position.z);
    assists.abs = true;
  }
  // 4. Skidpad: constant steer at constant speed, lateral g.
  for (float target : {40.0f, 80.0f, 120.0f}) {
    Vehicle car;
    car.setup(sportsCar());
    car.place({0, 0, 0}, 0);
    car.setSpeed(target / 3.6f);
    float bestG = 0;
    float steerBest = 0;
    for (float steer = 0.02f; steer <= 1.0f; steer += 0.02f) {
      CarInput in;
      in.steer = steer;
      for (int i = 0; i < 240 * 2; ++i) {
        // Simple speed hold.
        in.throttle = clampf((target / 3.6f - car.speed()) * 0.5f, 0, 1);
        in.brake = clampf((car.speed() - target / 3.6f) * 0.3f, 0, 1);
        car.step(dt, in, assists, ground);
      }
      const float yaw = car.angularVelocity.y;
      const float g = std::fabs(yaw * car.speed()) / 9.81f;
      if (g > bestG) {
        bestG = g;
        steerBest = steer;
      }
    }
    std::printf("skidpad %3.0f km/h: max %.2f g at steer %.2f (speed now %.0f)\n", target, bestG, steerBest,
                car.speed() * 3.6f);
  }
  // 5. Lift-off / step steer stability at 150 km/h.
  {
    Vehicle car;
    car.setup(sportsCar());
    car.place({0, 0, 0}, 0);
    car.setSpeed(150 / 3.6f);
    CarInput in;
    in.steer = 0.15f;
    float maxSlip = 0;
    for (int i = 0; i < 240 * 3; ++i) {
      car.step(dt, in, assists, ground);
      const float beta = std::atan2(dot(car.velocity, car.right()), car.speed());
      maxSlip = std::max(maxSlip, std::fabs(beta));
    }
    std::printf("turned %s; ", car.forward().x > 0 ? "right (correct)" : "LEFT (wrong)");
    if (!(car.forward().x > 0)) failures++;
    if (!std::isfinite(car.speed()) || !std::isfinite(car.position.x) || car.speed() * 3.6f < 50) failures++;
    std::printf("step steer 0.15 at 150: yaw rate %.2f rad/s, body slip max %.1f deg, roll %.2f deg, speed %.0f\n",
                car.angularVelocity.y, maxSlip * 57.3f, std::asin(car.right().y) * 57.3f, car.speed() * 3.6f);
  }
  if (failures) std::printf("VEHICLE TEST FAILED (%d checks)\n", failures);
  return failures ? 1 : 0;
}
