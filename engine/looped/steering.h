#pragma once
// Steering that feels like a real car's wheel, for any input (touch, keys,
// gamepad, mouse) except a real steering wheel (that one is the driver's own
// hands: passed through). Written for the racing sim and meant to be reused by
// every driving game, so the feel lives here, in one place, with numbers.
//
// Two parts:
// 1. The wheel in your hands (`wheel()`, -1..1 of full lock). While you hold
//    it, it follows your thumb/stick with a light filter (keys turn it at a
//    driver's speed). Let go and it comes back to the middle by itself, like a
//    real car's caster does: smoothly, a bit quicker the faster you go, never
//    overshooting.
// 2. From the wheel to the road wheels (`update()`'s result, CarInput::steer).
//    At walking pace full lock is full lock (a real turning circle). At speed
//    the same wheel position asks for a curve the tires can hold (about
//    `gripG` of sideways pull at full wheel) instead of an angle that just
//    slides, so the car turns as much as it can without washing out. On top,
//    a gentle driver's catch: if the back steps out, a little countersteer
//    and yaw damping straighten it (strength `stability`).
//
// Tested by tools/native/steering_test.cpp (turning circle, grip, response,
// letting go, slides), which is what the numbers below were tuned on.
namespace engine {

class Vehicle;

struct SteeringFeel {
  float centerTimeStill = 0.30f;  // s: wheel comes back to the middle (time constant) when standing
  float centerTimeFast = 0.14f;   //    ... and at speed (caster pulls harder)
  float followTime = 0.035f;      // s: the wheel following your thumb/stick (smooths jitter)
  float keyRate = 2.4f;           // full-lock widths per second when steering with keys (standing)
  float gripG = 1.0f;             // sideways pull (in g) asked for at full wheel at speed
  float slipShare = 0.75f;        // of the tires' peak slip angle added on top of the curve's angle
  float stability = 1.0f;         // the driver's catch: 0 off, 1 normal
  float catchStartDeg = 2.0f;     // body slip (degrees) before the catch starts
  float yawDamping = 1.0f;        // easing off when the car swings past the curve asked for
};

class Steering {
 public:
  enum class Hands { kFree, kHolding, kKeys };
  SteeringFeel feel;

  // Starts straight.
  void reset() { wheel_ = 0; }
  // One step. `target` = where your input wants the wheel (-1..1); `hands`
  // says whether you're holding it (touch/stick: follows `target`), turning
  // it with keys (ramps toward `target`) or let go (self-centres).
  // Returns CarInput::steer for `car` (-1..1 of the rack's travel).
  float update(float dt, float target, Hands hands, const Vehicle& car);
  // The wheel in your hands, -1..1 (for drawing hands and the HUD).
  float wheel() const { return wheel_; }

 private:
  float wheel_ = 0;
};

}  // namespace engine
