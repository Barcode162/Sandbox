#pragma once
// Every number of one car for the new driving physics (docs/plan/jobs/W20.md
// §5), in SI units (m, kg, s, N, rad). Plain data: the sim reads it, the
// tuning panel changes a copy of it (applySetup), tests check it (validate).
// Car space as everywhere: x right, y up, -z forward, origin at the centre
// of mass. Corners: 0 FL, 1 FR, 2 RL, 3 RR.
#include <array>
#include <string>
#include <vector>

namespace engine::drive {

// One tire's curves (Magic Formula, §4.5). Given as the numbers a person can
// picture (peak grip, the slip where it peaks, how the curve falls past it);
// the sim works out the Magic Formula B from them (tire.cpp).
struct TireSpec {
  float radius = 0.33f;          // unloaded, m
  float width = 0.285f;          // tread, m (probes across it)
  float ratedLoad = 4000;        // F_z0, N
  float verticalRate = 260000;   // k_t, N/m
  float verticalDamping = 350;   // c_t, N s/m
  float inertia = 1.3f;          // wheel + tire + disc, kg m^2
  float unsprungMass = 45;       // kg per corner
  // Lateral.
  float muY = 1.2f;              // peak friction at the rated load
  float muYLoad = -0.12f;        // friction change per unit of load change (dfz)
  float peakSlipAngle = 0.105f;  // rad (~6 degrees) at the rated load
  float shapeCy = 1.35f, curveEy = -0.4f;
  // Longitudinal.
  float muX = 1.25f;
  float muXLoad = -0.08f;
  float peakSlipRatio = 0.10f;
  float shapeCx = 1.6f, curveEx = 0.2f;
  // Aligning: pneumatic trail at zero slip (m, at the rated load).
  float trail = 0.035f;
  // Transients: relaxation lengths at the rated load (m).
  float relaxY = 0.35f, relaxX = 0.14f;
  // Combined slip weighting (MF rBx1.. rCy1, §4.5.5).
  float rBx1 = 12.35f, rBx2 = -10.77f, rCx1 = 1.09f;
  float rBy1 = 6.46f, rBy2 = 4.20f, rBy3 = -0.015f, rCy1 = 1.08f;
  float rolling = 0.011f;        // rolling resistance coefficient c0
};

struct AxleSpec {
  float z = 1.35f;               // axle ahead of the CG (rear: negative), m
  float halfTrack = 0.8f;
  float wheelRate = 45000;       // spring at the wheel, N/m
  float bumpLow = 2400, bumpHigh = 1000;      // damper slopes, N s/m (wheel speed)
  float reboundLow = 4800, reboundHigh = 1900;
  float knee = 0.1f;             // m/s where the slopes change
  float bumpTravel = 0.06f;      // from ride height to the bump stop, m
  float bumpStopRate = 1.2e8f;   // N / m^2.5
  float antiRoll = 25000;        // N/m at the wheel
  float rollCentre = 0.07f;      // tire forces enter the body this high above the road, m
  float camber = 0;              // rad (fixed in the MVP)
  float brakeTorque = 3000;      // N m per wheel at full pedal
  float liftCoef = 0;            // C_L at this axle (positive = lift)
  bool driven = false, steered = false;
  TireSpec tire;
};

struct CarSpec {
  std::string id = "car", name = "Car";
  float mass = 1600;             // with driver
  float inertiaPitch = 2100, inertiaYaw = 2350, inertiaRoll = 550;  // kg m^2
  float cgHeight = 0.46f;        // above the road at rest
  AxleSpec front, rear;

  // Engine: full-throttle torque (rpm, N m), a smooth curve through the points.
  std::vector<std::array<float, 2>> torqueCurve;
  float idleRpm = 650, redline = 6600, limiterDrop = 150;
  float engineInertia = 0.28f;
  float engineBrake = 0.12f;     // closed-throttle torque at the redline, as a share of peak
  float throttleLag = 0.05f;     // s
  // Clutch and gearbox.
  float clutchTorque = 800;
  std::vector<float> gears;
  float reverseGear = 2.9f, finalDrive = 3.42f;
  float driveEfficiency = 0.88f;
  float shiftTime = 0.18f;       // s without drive (auto gears / paddles)
  // Differential: clutch-type LSD (preload + ramp), drive and coast.
  float diffPreload = 80, diffPower = 0.35f, diffCoast = 0.25f;
  // Brakes.
  float handbrakeTorque = 1600;  // N m on the rear axle
  // Steering.
  float steeringRatio = 15.5f;   // steering wheel / road wheel
  float lockDeg = 450;           // steering wheel from centre to full lock
  float ackermann = 0.4f;        // 0 parallel .. 1 true Ackermann
  float mechTrail = 0.02f;       // caster trail, m
  float powerAssist = 0.82f;     // share of the aligning torque the power steering takes
  // Aero.
  float dragArea = 0.64f;        // C_d * A, m^2
  float frontalArea = 2.0f;

  float wheelbase() const { return front.z - rear.z; }
  float maxRoadWheel() const;    // rad
  float peakTorque() const;
};

// The live tuning panel's numbers (bar/web/menu.js "carSetup"): scales and
// choices on top of the stock spec. 1 = stock for every scale.
struct Setup {
  float grip = 1;                // both tires' friction
  float springF = 1, springR = 1;
  float damperF = 1, damperR = 1;
  float arbF = 1, arbR = 1;
  float brakeBias = -1;          // front share 0.5..0.75 (-1 = stock)
  float diffLock = -1;           // 0 open .. 1 tight (-1 = stock)
  float steerRatio = -1;         // -1 = stock
  float steerWeight = 1;         // aligning torque you feel (x stock)
  float handStrength = 1;        // how firmly the virtual hand holds the wheel
  float steerAssist = 1;         // 0 = direct (sim), 1 = the speed-sensitive assist
  float handbrake = 1;           // handbrake strength (x stock)
  float tc = 0.2f;               // traction control 0 off .. 1 strong (light by default: you can slide)
  bool abs = true;
  float cameraDistance = 1;
  bool telemetry = false;
  bool oldPhysics = false;       // drive the old physics instead (to compare)
};

// The 2017 Corvette C7 Grand Sport's data, as the "Vance Ridgeback GS"
// (§5.1: real numbers, our own name).
CarSpec ridgebackGS();
// The stock spec with a setup applied.
CarSpec applySetup(const CarSpec& stock, const Setup& setup);
// Setup from the panel's JSON ({"grip":1.1,...}); unknown or bad keys keep
// their defaults. Returns false if the text isn't a JSON object.
bool parseSetup(const std::string& json, Setup& out);
// Problems with a spec (empty = fine): static loads, sag, units.
std::vector<std::string> validate(const CarSpec& spec);
// Static corner load (N) of corner i under gravity at rest.
float staticCornerLoad(const CarSpec& spec, int corner);

}  // namespace engine::drive
