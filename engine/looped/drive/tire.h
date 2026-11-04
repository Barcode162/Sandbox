#pragma once
// One tire's forces from its slip (docs/plan/jobs/W20.md §4.5): Magic
// Formula curves for pure longitudinal and lateral slip with load
// sensitivity, the MF weighting functions for combined slip (braking and
// turning share the grip), and at large slip a blend into plain sliding
// friction against the slip direction (a locked or spinning tire still
// resists sliding sideways). Aligning torque from the pneumatic trail, which
// collapses past the peak: that is the steering going light.
//
// Signs (§1): slip ratio > 0 = driving; slip angle alpha = atan2(-V_cy, |V_cx|),
// so F_y has the sign of alpha (y = left). Forces in the tire frame.
#include "looped/drive/car_spec.h"

namespace engine::drive {

struct TireForces {
  float fx = 0, fy = 0, mz = 0;
  float slide = 0;  // combined slip / peak slip: < 1 gripping, > 1 past the peak
};

class TireModel {
 public:
  void setup(const TireSpec& spec);
  const TireSpec& spec() const { return s_; }
  // Forces at load `fz` (N), slip ratio `kappa`, slip angle `alpha` (rad),
  // surface friction multiplier `mu`.
  TireForces eval(float fz, float kappa, float alpha, float mu) const;
  // Peak friction (load and surface included): the friction circle's size / fz.
  float peakMu(float fz, float mu) const;
  // Relaxation lengths at this load.
  float relaxX(float fz) const;
  float relaxY(float fz) const;

 private:
  TireSpec s_;
  float upX_ = 1, upY_ = 1;  // B * slip at the peak (from C and E)
  float slideX_ = 0.9f, slideY_ = 0.85f;  // share of the peak left at large slip
};

}  // namespace engine::drive
