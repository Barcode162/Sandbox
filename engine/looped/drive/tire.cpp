#include "looped/drive/tire.h"

#include <algorithm>
#include <cmath>

namespace engine::drive {
namespace {

constexpr float kPi = 3.14159265f;

// B * slip where the curve y = sin(C atan(Bx - E(Bx - atan Bx))) peaks:
// solves u - E(u - atan u) = tan(pi / 2C) (Newton).
float peakArgument(float C, float E) {
  const float target = std::tan(kPi / (2 * std::max(C, 1.05f)));
  float u = target;
  for (int i = 0; i < 20; ++i) {
    const float f = (1 - E) * u + E * std::atan(u) - target;
    const float d = (1 - E) + E / (1 + u * u);
    u -= f / std::max(d, 1e-3f);
    u = std::max(u, 1e-3f);
  }
  return u;
}

float curve(float B, float C, float E, float x) {
  const float bx = B * x;
  return std::sin(C * std::atan(bx - E * (bx - std::atan(bx))));
}

float smoothstep(float a, float b, float x) {
  const float t = std::clamp((x - a) / (b - a), 0.0f, 1.0f);
  return t * t * (3 - 2 * t);
}

}  // namespace

void TireModel::setup(const TireSpec& spec) {
  s_ = spec;
  s_.curveEx = std::min(s_.curveEx, 0.95f);
  s_.curveEy = std::min(s_.curveEy, 0.95f);
  upX_ = peakArgument(s_.shapeCx, s_.curveEx);
  upY_ = peakArgument(s_.shapeCy, s_.curveEy);
  slideX_ = std::sin(s_.shapeCx * kPi / 2);
  slideY_ = std::sin(s_.shapeCy * kPi / 2);
}

float TireModel::relaxX(float fz) const { return s_.relaxX * std::sqrt(std::max(fz, 100.0f) / s_.ratedLoad); }
float TireModel::relaxY(float fz) const { return s_.relaxY * std::sqrt(std::max(fz, 100.0f) / s_.ratedLoad); }

float TireModel::peakMu(float fz, float mu) const {
  const float dfz = (fz - s_.ratedLoad) / s_.ratedLoad;
  return std::max(s_.muX * (1 + s_.muXLoad * dfz), s_.muY * (1 + s_.muYLoad * dfz)) * mu;
}

TireForces TireModel::eval(float fz, float kappa, float alpha, float mu) const {
  TireForces o;
  if (fz <= 0) return o;
  const float dfz = std::clamp((fz - s_.ratedLoad) / s_.ratedLoad, -0.9f, 2.0f);
  const float muX = std::max(0.2f, s_.muX * (1 + s_.muXLoad * dfz)) * mu;
  const float muY = std::max(0.2f, s_.muY * (1 + s_.muYLoad * dfz)) * mu;
  const float kp = s_.peakSlipRatio * (1 + 0.1f * dfz);
  const float ap = s_.peakSlipAngle * (1 + 0.15f * dfz);
  const float Bx = upX_ / kp, By = upY_ / ap;
  // Pure slip.
  const float fx0 = muX * fz * curve(Bx, s_.shapeCx, s_.curveEx, kappa);
  const float fy0 = muY * fz * curve(By, s_.shapeCy, s_.curveEy, alpha);
  // Combined slip (MF weighting).
  const float a = std::fabs(alpha);
  const float bxa = s_.rBx1 * std::cos(std::atan(s_.rBx2 * kappa));
  const float gxa = std::max(0.0f, std::cos(s_.rCx1 * std::atan(bxa * a)));
  const float byk = s_.rBy1 * std::cos(std::atan(s_.rBy2 * (a - s_.rBy3)));
  const float gyk = std::max(0.0f, std::cos(s_.rCy1 * std::atan(byk * kappa)));
  o.fx = gxa * fx0;
  o.fy = gyk * fy0;
  // Far past the peak: plain sliding friction against the slip direction.
  const float ta = std::tan(std::clamp(alpha, -1.5f, 1.5f));
  const float rho = std::hypot(kappa / kp, ta / std::tan(ap));
  o.slide = rho;
  const float w = smoothstep(1.8f, 4.0f, rho);
  if (w > 0) {
    const float len = std::hypot(kappa, ta);
    if (len > 1e-6f) {
      const float dx = kappa / len, dy = ta / len;
      const float ex = dx / (muX * slideX_), ey = dy / (muY * slideY_);
      const float muS = 1 / std::sqrt(ex * ex + ey * ey);
      o.fx += (fz * muS * dx - o.fx) * w;
      o.fy += (fz * muS * dy - o.fy) * w;
    }
  }
  // Safety net: the friction circle.
  const float cap = 1.02f * std::max(muX, muY) * fz;
  const float mag = std::hypot(o.fx, o.fy);
  if (mag > cap) {
    o.fx *= cap / mag;
    o.fy *= cap / mag;
  }
  // Aligning torque: the pneumatic trail falls to zero just past the peak.
  const float bt = 3.73f / (1.1f * ap);
  const float trail = s_.trail * (fz / s_.ratedLoad) * std::cos(1.2f * std::atan(bt * a)) * std::cos(alpha);
  o.mz = -trail * o.fy;
  return o;
}

}  // namespace engine::drive
