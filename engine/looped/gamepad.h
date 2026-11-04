#pragma once
// Game controllers and steering wheels through the browser's Gamepad API
// (Xbox / PlayStation pads also work on iPhone; wheels on computers).
// Read once per frame.
#include <string>

namespace engine {

struct Gamepad {
  bool connected = false;
  bool standard = false;   // the browser's "standard" layout (pads)
  std::string id;          // e.g. "Xbox Wireless Controller", "G29 Driving Force Racing Wheel"
  int axisCount = 0, buttonCount = 0;
  float axes[10] = {};
  float buttons[20] = {};  // 0..1 (triggers are analog)
};

// The first connected controller (or connected = false).
Gamepad readGamepad();

}  // namespace engine
