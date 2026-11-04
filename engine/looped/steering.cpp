#include "looped/steering.h"

#include <algorithm>
#include <cmath>

#include "looped/vehicle.h"

namespace engine {

float Steering::update(float dt, float target, Hands hands, const Vehicle& car) {
  const CarSpec& spec = car.spec();
  const float speed = std::fabs(car.speed());
  target = std::clamp(target, -1.0f, 1.0f);

  // --- 1. The wheel in your hands.
  const float fast = std::clamp(speed / 30.0f, 0.0f, 1.0f);  // 0 standing .. 1 at 108 km/h
  switch (hands) {
    case Hands::kHolding:
      wheel_ += (target - wheel_) * (1.0f - std::exp(-dt / feel.followTime));
      break;
    case Hands::kKeys: {
      // Like turning a real wheel: quick when slow, calmer at speed; back
      // toward the middle twice as fast as away from it.
      const float rate = feel.keyRate / (1.0f + speed / 25.0f);
      const bool returning = std::fabs(target) < std::fabs(wheel_) || target * wheel_ < 0;
      const float step = (returning ? 2.0f * rate : rate) * dt;
      wheel_ += std::clamp(target - wheel_, -step, step);
      break;
    }
    case Hands::kFree: {
      // Self-centring: a smooth first-order return (no overshoot), quicker
      // the faster you go.
      const float tc = feel.centerTimeStill + (feel.centerTimeFast - feel.centerTimeStill) * fast;
      wheel_ += (0.0f - wheel_) * (1.0f - std::exp(-dt / tc));
      if (std::fabs(wheel_) < 1e-4f) wheel_ = 0;
      break;
    }
  }

  // --- 2. From the wheel to the road wheels.
  const float wheelbase = spec.front.z - spec.rear.z;
  const float rackMax = spec.maxSteer * 0.85f;  // what CarInput::steer = 1 means (looped/vehicle.cpp)
  // The tightest curve the tires can hold at this speed, and the angle that
  // asks for it: the curve's own angle plus the slip the front tires need.
  const float v = std::max(speed, 0.5f);
  const float gripCurve = feel.gripG * 9.81f / (v * v);                 // 1/m
  const float lockCurve = std::tan(rackMax) / wheelbase;                // 1/m at full lock
  const float curve = std::min(lockCurve, gripCurve);
  const float slipNeed = spec.tire.peakSlipAngle * feel.slipShare * std::min(1.0f, gripCurve > 0 ? curve / gripCurve : 0);
  const float fullAngle = std::min(rackMax, std::atan(curve * wheelbase) + slipNeed);
  float angle = wheel_ * fullAngle;

  // --- Calm hands: if the car turns more than the wheel asks for (it swings
  // past the curve after a quick turn), ease the angle off a little. Only on
  // that side, so it never adds steering past the grip.
  if (feel.yawDamping > 0 && speed > 4.0f) {
    const float wanted = -wheel_ * curve * speed;          // yaw rate asked for (+ = left)
    const float actual = car.angularVelocity.y;
    const float over = actual - wanted;
    if (over * wanted > 0) angle += feel.yawDamping * wheelbase * over / speed;
  }

  // --- 3. The driver's catch: when the back steps out (body slip), steer
  // into it a little and damp the spin. Only when moving.
  if (feel.stability > 0 && speed > 4.0f) {
    const float vx = dot(car.velocity, car.right());          // sideways (+ = to the right)
    const float vf = std::max(car.speed(), 0.1f);
    const float slip = std::atan2(vx, vf);                     // + = moving to the right of the nose
    const float start = feel.catchStartDeg * 3.14159265f / 180.0f;
    const float excess = std::fabs(slip) > start ? (std::fabs(slip) - start) * (slip > 0 ? 1.0f : -1.0f) : 0.0f;
    // The body slipping this way means the tail is coming round: steer the
    // other way by about as much (the sign was checked by steering_test: the
    // wrong way turns a brake-in-a-corner into a spin).
    angle -= feel.stability * 0.9f * excess;
  }
  return std::clamp(angle / rackMax, -1.0f, 1.0f);
}

}  // namespace engine
