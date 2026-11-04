#include "looped/input.h"

#include <emscripten/emscripten.h>
#include <emscripten/html5.h>

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>

#include "looped/bridge.h"
#include "looped/profiler.h"

namespace engine {
namespace {

using State = detail::InputState;

// Shows the joystick rings (HTML elements in bar/web/index.html) at the touch
// spot, through the page mailbox (once per frame at most, in Input::flushStick).
void applyStick(bool visible, Vec2 origin, Vec2 knob) {
  char op[160];
  std::snprintf(op, sizeof(op), "[\"stick\",%d,%.1f,%.1f,%.1f,%.1f]", visible ? 1 : 0, origin.x, origin.y, knob.x,
                knob.y);
  bridge::op(op);
}

// Remembers how the joystick should look; drawn by Input::flushStick.
detail::InputState* g_stickOwner = nullptr;
void showStick(bool visible, Vec2 origin, Vec2 knob) {
  if (!g_stickOwner) return;
  g_stickOwner->stickVisible = visible;
  g_stickOwner->stickShownOrigin = origin;
  g_stickOwner->stickShownKnob = knob;
  g_stickOwner->stickDirty = true;
}

Vec2 clampToStick(Vec2 origin, Vec2 p) {
  Vec2 d{p.x - origin.x, p.y - origin.y};
  const float len = std::sqrt(d.x * d.x + d.y * d.y);
  if (len > Input::kStickRadius) {
    d.x *= Input::kStickRadius / len;
    d.y *= Input::kStickRadius / len;
  }
  return {origin.x + d.x, origin.y + d.y};
}

// The time of the touch being handled (its event time, from the queue), or
// now for events handled the moment they arrive (mouse, keys).
double g_eventMs = 0;
// When the browser says the event happened (same clock as emscripten_get_now).
double stamp(double eventMs) { return eventMs > 0 ? eventMs : emscripten_get_now(); }
double eventNow() { return g_eventMs > 0 ? g_eventMs : emscripten_get_now(); }

constexpr double kTapMaxMs = 350;
constexpr float kTapMaxMove = 12;  // CSS pixels

State::Press* findPress(State& in, int id) {
  for (State::Press& p : in.presses) {
    if (p.id == id) return &p;
  }
  return nullptr;
}

void pressStart(State& in, int id, Vec2 p) {
  State::Press* slot = findPress(in, State::kNone);
  if (slot) *slot = {id, p, eventNow(), 0};
}

void pressMove(State& in, int id, Vec2 p) {
  if (State::Press* press = findPress(in, id)) {
    const float dx = p.x - press->start.x, dy = p.y - press->start.y;
    press->moved = std::max(press->moved, std::sqrt(dx * dx + dy * dy));
  }
}

void pressEnd(State& in, int id, Vec2 p, bool cancelled) {
  State::Press* press = findPress(in, id);
  if (!press) return;
  pressMove(in, id, p);
  if (!cancelled && press->moved < kTapMaxMove && eventNow() - press->startMs < kTapMaxMs) {
    const double w = in.canvasW, h = in.canvasH;
    if (w > 0 && h > 0) in.taps.push_back({static_cast<float>(p.x / w), static_cast<float>(p.y / h)});
  }
  press->id = State::kNone;
}

void trackPointer(State& in, int id, Vec2 pos, int type, bool mouse) {
  auto it = std::find_if(in.pointers.begin(), in.pointers.end(), [&](const Pointer& p) { return p.id == id; });
  if (type == EMSCRIPTEN_EVENT_TOUCHSTART || type == EMSCRIPTEN_EVENT_MOUSEDOWN) {
    if (it == in.pointers.end()) in.pointers.push_back({id, pos, pos, eventNow(), mouse});
    else it->pos = pos;
  } else if (type == EMSCRIPTEN_EVENT_TOUCHMOVE || type == EMSCRIPTEN_EVENT_MOUSEMOVE) {
    if (it != in.pointers.end()) it->pos = pos;
  } else if (it != in.pointers.end()) {
    in.pointers.erase(it);
  }
}

bool handleTouch(int type, const EmscriptenTouchEvent* e, void* user) {
  auto& in = *static_cast<State*>(user);
  const double canvasW = in.canvasW, canvasH = in.canvasH;
  if (in.capture) {
    const double now = eventNow();
    for (int i = 0; i < e->numTouches; ++i) {
      const EmscriptenTouchPoint& t = e->touches[i];
      if (!t.isChanged || canvasW <= 0 || canvasH <= 0) continue;
      trackPointer(in, static_cast<int>(t.identifier),
                   {static_cast<float>(t.targetX / canvasW), static_cast<float>(t.targetY / canvasH)}, type, false);
      if (type == EMSCRIPTEN_EVENT_TOUCHMOVE) continue;
      in.rawPresses.push_back({{static_cast<float>(t.targetX / canvasW), static_cast<float>(t.targetY / canvasH)}, now,
                               static_cast<int>(t.identifier), type == EMSCRIPTEN_EVENT_TOUCHSTART, -1,
                               type == EMSCRIPTEN_EVENT_TOUCHCANCEL});
    }
    return true;
  }

  for (int i = 0; i < e->numTouches; ++i) {
    const EmscriptenTouchPoint& t = e->touches[i];
    if (!t.isChanged) continue;
    const Vec2 p{static_cast<float>(t.targetX), static_cast<float>(t.targetY)};
    const int id = static_cast<int>(t.identifier);

    if (type == EMSCRIPTEN_EVENT_TOUCHSTART) pressStart(in, id, p);
    else if (type == EMSCRIPTEN_EVENT_TOUCHMOVE) pressMove(in, id, p);
    else pressEnd(in, id, p, type == EMSCRIPTEN_EVENT_TOUCHCANCEL);

    if (type == EMSCRIPTEN_EVENT_TOUCHSTART) {
      if (p.x < canvasW * 0.5 && in.stickTouchId == State::kNone) {
        in.stickTouchId = id;
        in.stickOrigin = in.stickPos = p;
        showStick(true, p, p);
      } else if (in.lookTouchId == State::kNone) {
        in.lookTouchId = id;
        in.lastLookPos = p;
      }
    } else if (type == EMSCRIPTEN_EVENT_TOUCHMOVE) {
      if (id == in.stickTouchId) {
        in.stickPos = clampToStick(in.stickOrigin, p);
        showStick(true, in.stickOrigin, in.stickPos);
      } else if (id == in.lookTouchId) {
        in.lookDelta.x += p.x - in.lastLookPos.x;
        in.lookDelta.y += p.y - in.lastLookPos.y;
        in.lastLookPos = p;
      }
    } else {  // touch end / cancel
      if (id == in.stickTouchId) {
        in.stickTouchId = State::kNone;
        showStick(false, {}, {});
      } else if (id == in.lookTouchId) {
        in.lookTouchId = State::kNone;
      }
    }
  }
  return true;  // prevents page scrolling / zooming
}

bool handleMouse(int type, const EmscriptenMouseEvent* e, void* user) {
  auto& in = *static_cast<State*>(user);
  const Vec2 p{static_cast<float>(e->targetX), static_cast<float>(e->targetY)};
  if (in.capture) {
    const double w = in.canvasW, h = in.canvasH;
    if (w <= 0 || h <= 0) return true;
    const Vec2 f{static_cast<float>(p.x / w), static_cast<float>(p.y / h)};
    if (type == EMSCRIPTEN_EVENT_MOUSEMOVE) {
      if (f.x != in.mousePos.x || f.y != in.mousePos.y) in.mouseMoved = true;
      in.mousePos = f;
      if (in.mouseButtons & 1) trackPointer(in, Input::kMouseId, f, type, true);
      return true;
    }
    const int bit = e->button == 0 ? 1 : e->button == 2 ? 2 : 4;
    if (type == EMSCRIPTEN_EVENT_MOUSEDOWN) in.mouseButtons |= bit;
    if (type == EMSCRIPTEN_EVENT_MOUSEUP) in.mouseButtons &= ~bit;
    in.mousePos = f;
    if (e->button == 0) trackPointer(in, Input::kMouseId, f, type, true);
    if (e->button == 0) {
      in.rawPresses.push_back({{static_cast<float>(p.x / w), static_cast<float>(p.y / h)}, stamp(e->timestamp),
                               Input::kMouseId, type == EMSCRIPTEN_EVENT_MOUSEDOWN, -1});
    }
    return true;
  }
  if (type == EMSCRIPTEN_EVENT_MOUSEDOWN) {
    in.mouseLooking = true;
    pressStart(in, Input::kMouseId, p);
  }
  if (type == EMSCRIPTEN_EVENT_MOUSEUP && in.mouseLooking) {
    in.mouseLooking = false;
    pressEnd(in, Input::kMouseId, p, false);
  }
  if (type == EMSCRIPTEN_EVENT_MOUSEMOVE && in.mouseLooking) {
    pressMove(in, Input::kMouseId, p);
    in.lookDelta.x += static_cast<float>(e->movementX);
    in.lookDelta.y += static_cast<float>(e->movementY);
  }
  return true;
}

bool onKey(int type, const EmscriptenKeyboardEvent* e, void* user) {
  auto& in = *static_cast<State*>(user);
  const bool down = type == EMSCRIPTEN_EVENT_KEYDOWN;
  const char* c = e->code;
  // Typing in a form (the account screens): leave the keys alone.
  if (bridge::frame().fieldFocused) return false;
  if (in.capture) {
    // Every key is tracked (the racing game reads them by name).
    const std::string code = c;
    auto held = std::find(in.keysHeld.begin(), in.keysHeld.end(), code);
    if (down && held == in.keysHeld.end()) {
      in.keysHeld.push_back(code);
      in.keyPresses.push_back(code);
    } else if (!down && held != in.keysHeld.end()) {
      in.keysHeld.erase(held);
    }
    // D F J K (and the arrows left, right, down, up) are keys 0..3, Escape 4.
    static const char* kLaneKeys[9] = {"KeyD", "KeyF", "KeyJ", "KeyK", "Escape", "ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"};
    for (int i = 0; i < 9; ++i) {
      if (std::strcmp(c, kLaneKeys[i]) != 0) continue;
      const int k = i < 5 ? i : i - 5;
      if (e->repeat) return true;
      in.rawPresses.push_back({{0.125f + 0.25f * static_cast<float>(std::min(k, 3)), 0.9f}, stamp(e->timestamp),
                               -100 - k, down, k});
      return true;
    }
    // Keep game keys from scrolling the page; leave browser shortcuts alone.
    return !(e->ctrlKey || e->metaKey) && (code == "Space" || code.rfind("Key", 0) == 0 || code.rfind("Shift", 0) == 0);
  }
  if (!std::strcmp(c, "KeyW") || !std::strcmp(c, "ArrowUp")) in.keyForward = down;
  else if (!std::strcmp(c, "KeyS") || !std::strcmp(c, "ArrowDown")) in.keyBack = down;
  else if (!std::strcmp(c, "KeyA") || !std::strcmp(c, "ArrowLeft")) in.keyLeft = down;
  else if (!std::strcmp(c, "KeyD") || !std::strcmp(c, "ArrowRight")) in.keyRight = down;
  else return false;
  return true;
}

// Touches arrive through passive listeners (web side, installed in attach)
// that only queue them; they're handled here once per frame. Listeners that
// could cancel the touch (what emscripten's are) make Safari wait for the
// page's code before it can draw, which cost a frame per tap.
void handleQueuedTouches(State& in) {
  const double start = emscripten_get_now();
  const std::vector<bridge::Touch> touches = bridge::takeTouches();
  static const int kTypes[4] = {EMSCRIPTEN_EVENT_TOUCHSTART, EMSCRIPTEN_EVENT_TOUCHMOVE, EMSCRIPTEN_EVENT_TOUCHEND,
                                EMSCRIPTEN_EVENT_TOUCHCANCEL};
  for (const bridge::Touch& t : touches) {
    const int type = kTypes[std::clamp(t.type, 0, 3)];
    EmscriptenTouchEvent e{};
    e.numTouches = 1;
    e.touches[0].identifier = t.id;
    e.touches[0].isChanged = 1;
    e.touches[0].targetX = e.touches[0].clientX = static_cast<int>(t.x);
    e.touches[0].targetY = e.touches[0].clientY = static_cast<int>(t.y);
    g_eventMs = t.timeMs;
    profiler().input(t.timeMs);  // touch to screen (J110.5)
    if (type != EMSCRIPTEN_EVENT_TOUCHMOVE) profiler().touch();
    handleTouch(type, &e, &in);
  }
  g_eventMs = 0;
  if (!touches.empty()) profiler().event(emscripten_get_now() - start, false);
}

Vec2 moveOf(const State& in) {
  Vec2 m;
  if (in.stickTouchId != State::kNone) {
    m.x = (in.stickPos.x - in.stickOrigin.x) / Input::kStickRadius;
    m.y = -(in.stickPos.y - in.stickOrigin.y) / Input::kStickRadius;  // screen up = forward
  }
  m.x += (in.keyRight ? 1.0f : 0.0f) - (in.keyLeft ? 1.0f : 0.0f);
  m.y += (in.keyForward ? 1.0f : 0.0f) - (in.keyBack ? 1.0f : 0.0f);
  const float len = std::sqrt(m.x * m.x + m.y * m.y);
  if (len > 1.0f) {
    m.x /= len;
    m.y /= len;
  }
  return m;
}

// Lets go of everything held (fingers, keys, buttons).
void letGo(State& in) {
  in.stickTouchId = in.lookTouchId = State::kNone;
  showStick(false, {}, {});
  in.mouseLooking = false;
  in.keyForward = in.keyBack = in.keyLeft = in.keyRight = false;
  for (State::Press& p : in.presses) p.id = State::kNone;
  in.pointers.clear();
  in.keysHeld.clear();
  in.mouseButtons = 0;
}

bool onMouse(int type, const EmscriptenMouseEvent* e, void* user) {
  const double start = emscripten_get_now();
  // After a tap the phone also sends pretend mouse events (the touch
  // listeners are passive, so they can't cancel them): ignore those.
  if (type != EMSCRIPTEN_EVENT_MOUSEMOVE &&
      start - EM_ASM_DOUBLE({ var b = window['loopedHost']['bridge']; return b ? b['lastTouch']() : -1e9; }) < 1000) {
    return false;
  }
  if (type != EMSCRIPTEN_EVENT_MOUSEMOVE) profiler().touch();
  const bool r = handleMouse(type, e, user);
  profiler().event(emscripten_get_now() - start, type == EMSCRIPTEN_EVENT_MOUSEMOVE);
  return r;
}

}  // namespace

bool InputFrame::keyDown(const char* code) const {
  for (const std::string& k : keysHeld) {
    if (k == code) return true;
  }
  return false;
}

const InputFrame& Input::poll() {
  // The page lost focus or went to the background: let go of everything
  // (otherwise a key or finger lifted elsewhere stays "held").
  const int blurs = bridge::frame().blurs;
  if (blurs != s_.lastBlurs) {
    s_.lastBlurs = blurs;
    letGo(s_);
  }
  handleQueuedTouches(s_);
  InputFrame& f = frame_;
  f.capturing = s_.capture;
  f.move = moveOf(s_);
  f.look = s_.lookDelta;
  s_.lookDelta = {};
  f.taps.clear();
  f.taps.swap(s_.taps);
  f.presses.clear();
  f.presses.swap(s_.rawPresses);
  f.keyPresses.clear();
  f.keyPresses.swap(s_.keyPresses);
  f.pointers = s_.pointers;
  f.keysHeld = s_.keysHeld;
  f.mousePos = s_.mousePos;
  f.mouseButtons = s_.mouseButtons;
  f.mouseMoved = s_.mouseMoved;
  return f;
}

void Input::releaseAll() { letGo(s_); }

void Input::flushStick() {
  if (!s_.stickDirty) return;
  s_.stickDirty = false;
  applyStick(s_.stickVisible, s_.stickShownOrigin, s_.stickShownKnob);
}

void Input::attach(const char* canvas) {
  g_stickOwner = &s_;
  // Right-click is a game button (mouse steering: brake), not a menu.
  EM_ASM({
    var c = document.querySelector(UTF8ToString($0));
    if (c) c.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  }, canvas);
  // Touches arrive through the page mailbox (bar/web/bridge.js: passive
  // listeners that only queue them), read once per frame in poll().
  bridge::attach(canvas);
  emscripten_set_mousedown_callback(canvas, &s_, true, onMouse);
  emscripten_set_mousemove_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, &s_, true, onMouse);
  emscripten_set_mouseup_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, &s_, true, onMouse);
  emscripten_set_keydown_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, &s_, true, onKey);
  emscripten_set_keyup_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, &s_, true, onKey);
}

void Input::setCapture(bool on) {
  if (s_.capture == on) return;
  s_.capture = on;
  // Let go of everything the other mode was tracking.
  letGo(s_);
  s_.taps.clear();
  s_.rawPresses.clear();
  s_.keyPresses.clear();
  s_.mouseMoved = false;
  s_.lookDelta = {};
  // This frame's input belonged to the other mode.
  InputFrame& f = frame_;
  f.capturing = on;
  f.move = {};
  f.look = {};
  f.taps.clear();
  f.presses.clear();
  f.pointers.clear();
  f.keysHeld.clear();
  f.keyPresses.clear();
  f.mouseButtons = 0;
  f.mouseMoved = false;
}

}  // namespace engine
