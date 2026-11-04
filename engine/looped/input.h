#pragma once
// Turns touches (and mouse/keyboard on a computer) into movement and look
// input:
// - Touch on the left half of the screen: a virtual joystick for walking.
// - Drag on the right half: look around.
// - Computer: WASD/arrow keys to walk, drag the mouse to look.
// - A quick tap or click that doesn't move counts as a "tap" (to use things).
// The game reads one InputFrame per frame (Input::poll).
#include <string>
#include <vector>

#include "looped/math.h"

namespace engine {

// One finger (or key) going down or up, for game input (the rhythm game,
// the piano keyboard): when it happened (the browser's event time, same
// clock as emscripten_get_now, in ms) and where (screen fractions). On a
// computer the keys D F J K act as presses in the four quarters of the
// screen (key = 0..3) and Escape as key 4.
struct RawPress {
  Vec2 pos;
  double ms = 0;
  int id = 0;     // finger (or key) id, to pair downs with ups
  bool down = true;
  int key = -1;   // -1 = a touch or click
  // The phone took the touch away (Safari's own gesture, an edge swipe):
  // the finger may still be down. Games that hold notes keep them held.
  bool cancelled = false;
};

// A finger currently down (or the mouse while a button is held), with where
// it is now and where it started (screen fractions), for controls that
// follow a finger (steering, pedals).
struct Pointer {
  int id = 0;
  Vec2 pos, start;
  double startMs = 0;
  bool mouse = false;
};

// Everything the player did since the last frame, read once at frame start
// (Input::poll). The game only reads this; it never changes input state.
struct InputFrame {
  // Walking direction from the joystick or keys: x = strafe right,
  // y = forward. Length 0..1.
  Vec2 move;
  // Look movement since the last frame, in CSS pixels.
  Vec2 look;
  // Taps, as screen fractions (0,0 = top-left, 1,1 = bottom-right).
  std::vector<Vec2> taps;

  // Game input (Input::setCapture(true)): touches don't walk, look or tap;
  // the fields below are filled instead.
  bool capturing = false;
  std::vector<RawPress> presses;
  std::vector<Pointer> pointers;
  // Keys held, by KeyboardEvent.code ("KeyW", "ArrowUp", "Space",
  // "ShiftLeft"...), and the ones pressed since the last frame.
  std::vector<std::string> keysHeld, keyPresses;
  bool keyDown(const char* code) const;
  // The mouse: position (screen fractions) and buttons held (bit 0 = left,
  // bit 1 = right, bit 2 = middle). mouseMoved: since capture began (to
  // tell mouse users apart).
  Vec2 mousePos{0.5f, 0.5f};
  int mouseButtons = 0;
  bool mouseMoved = false;
};

namespace detail {
// What the event handlers in input.cpp keep between frames.
struct InputState {
  double canvasW = 0, canvasH = 0;
  bool capture = false;
  std::vector<RawPress> rawPresses;
  std::vector<Pointer> pointers;
  std::vector<std::string> keysHeld, keyPresses;
  Vec2 mousePos{0.5f, 0.5f};
  int mouseButtons = 0;
  bool mouseMoved = false;
  static constexpr int kNone = -1;
  int stickTouchId = kNone;
  int lookTouchId = kNone;
  Vec2 stickOrigin, stickPos;
  Vec2 lastLookPos;
  Vec2 lookDelta;
  bool mouseLooking = false;
  bool keyForward = false, keyBack = false, keyLeft = false, keyRight = false;
  // Tap detection: where/when each finger (or the mouse) went down, and
  // how far it has wandered since.
  struct Press {
    int id = kNone;
    Vec2 start;
    double startMs = 0;
    float moved = 0;
  };
  static constexpr int kMaxPresses = 5;
  Press presses[kMaxPresses];
  std::vector<Vec2> taps;
  // The joystick rings on the page (drawn by Input::flushStick).
  bool stickVisible = false, stickDirty = false;
  Vec2 stickShownOrigin, stickShownKnob;
  int lastBlurs = 0;
};
}  // namespace detail

class Input {
 public:
  using RawPress = engine::RawPress;
  using Pointer = engine::Pointer;

  void attach(const char* canvasSelector);
  // The canvas size in CSS pixels; set once per frame (from the page
  // mailbox), so touch events never have to measure the page.
  void setCanvasSize(double w, double h) { s_.canvasW = w; s_.canvasH = h; }
  // Handles the touches queued since the last frame and returns what the
  // player did (call once at frame start). frame() returns it again.
  const InputFrame& poll();
  const InputFrame& frame() const { return frame_; }
  // Moves the joystick rings on the page, if they changed (once per frame).
  void flushStick();
  // Lets go of every held key, finger and button (focus lost).
  void releaseAll();
  // Game input on/off (see InputFrame). Also empties this frame's taps,
  // presses and look, so the tap that started a game isn't used twice.
  void setCapture(bool on);
  bool capturing() const { return s_.capture; }

  static constexpr float kStickRadius = 60.0f;  // CSS pixels
  static constexpr int kMouseId = -2;

 private:
  detail::InputState s_;
  InputFrame frame_;
};

}  // namespace engine
