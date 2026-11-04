// The world core (looped/world/*, docs/archive/ENGINE.md E1): kinds and places from
// files, things sitting on things, states and rules, loops that never stop,
// the same answer on every phone, and the check that every thing is alive.
#include <chrono>
#include <cmath>
#include <cstdio>
#include <set>
#include <string>

#include "looped/world/world.h"

using namespace engine;
using namespace engine::world;

static int failed = 0;
static void check(bool ok, const std::string& what) {
  std::printf("%s %s\n", ok ? "ok  " : "FAIL", what.c_str());
  if (!ok) ++failed;
}
static bool near(float a, float b, float eps = 1e-4f) { return std::fabs(a - b) <= eps; }
static Vec3 posOf(const Mat4& m) { return {m.at(3, 0), m.at(3, 1), m.at(3, 2)}; }
static bool sameMat(const Mat4& a, const Mat4& b) {
  for (int i = 0; i < 16; ++i)
    if (a.m[i] != b.m[i]) return false;
  return true;
}

static const char* kKinds = R"({"kinds": [
  {"id": "furniture", "about": "Anything that stands on the floor.",
   "parts": {"collider": {"box": [0.5, 1, 0.5]}},
   "loops": {"creak": {"period": 7, "pieces": [{"ch": "turn.y", "shape": "wave", "amp": 0.6}]}},
   "states": {"idle": {"loop": "creak"}}, "start": "idle"},
  {"id": "stool", "is": "furniture", "about": "A bar stool.",
   "parts": {"seat": {"height": 0.75}},
   "loops": {"spin": {"period": 1, "restart": true, "blend": 0.2,
                      "pieces": [{"ch": "turn.y", "shape": "spin"}]}},
   "states": {"idle": {"loop": "creak", "on": {"tap": "spun"}},
              "spun": {"loop": "spin", "afterLoops": 1, "next": "idle"}}},
  {"id": "record", "about": "The jukebox's record.",
   "loops": {"rest": {"period": 9, "pieces": [{"ch": "glow", "shape": "noise", "amp": 0.05}]},
             "turning": {"period": 1.8, "pieces": [{"ch": "turn.y", "shape": "spin"}]}},
   "states": {"rest": {"loop": "rest", "on": {"play": "turning"}},
              "turning": {"loop": "turning", "on": {"stop": "rest"}}}},
  {"id": "jukebox", "about": "Plays songs.",
   "parts": {"model": {"file": "jukebox.glb"}},
   "loops": {"hum": {"period": 5, "pieces": [{"ch": "glow", "shape": "wave", "amp": 0.1}]},
             "bounce": {"period": 1, "beat": true,
                        "pieces": [{"ch": "move.y", "shape": "beat", "amp": 0.02, "decay": 6}]}},
   "states": {"idle": {"loop": "hum", "on": {"play": "playing"}},
              "playing": {"loop": "bounce", "on": {"stop": "idle"}, "enter": [{"send": "play", "to": "record"}]}},
   "start": "idle",
   "things": [{"id": "record", "kind": "record", "at": [0, 1.2, 0.1]}]},
  {"id": "button", "about": "Starts the jukebox.",
   "loops": {"glint": {"period": 3, "pieces": [{"ch": "glow", "shape": "flicker", "amp": 0.3, "rate": 2}]},
             "press": {"period": 0.3, "restart": true,
                       "pieces": [{"ch": "move.y", "shape": "keys", "keys": [[0, 0], [0.5, -0.01], [1, 0]]}]}},
   "states": {"up": {"loop": "glint", "on": {"tap": "down"}},
              "down": {"loop": "press", "after": 0.3, "next": "up",
                       "enter": [{"send": "play", "to": "#jukebox"}]}}},
  {"id": "sign", "about": "Blinks: on two seconds, off one.",
   "loops": {"lit": {"period": 2, "pieces": [{"ch": "glow", "shape": "hold", "value": 0.5}]},
             "dark": {"period": 1, "pieces": [{"ch": "glow", "shape": "hold", "value": -1}]}},
   "states": {"on": {"loop": "lit", "after": 2, "next": "off"},
              "off": {"loop": "dark", "after": 1, "next": "on"}}},
  {"id": "moth", "about": "Circles its lamp.",
   "loops": {"fly": {"period": 6.5, "pieces": [{"ch": "move", "shape": "orbit", "amp": [0.3, 0.1, 0]}]}},
   "states": {"fly": {"loop": "fly"}}},
  {"id": "lamp", "about": "A hanging lamp with moths.",
   "loops": {"sway": {"period": 11, "pieces": [{"ch": "turn.z", "shape": "wave", "amp": 1.5}]}},
   "states": {"lit": {"loop": "sway"}},
   "things": [{"kind": "moth"}, {"kind": "moth"}]},
  {"id": "wall", "about": "A wall.", "still": "walls don't move; their light does"},
  {"id": "glass", "about": "A glass.",
   "loops": {"shine": {"period": 4, "pieces": [{"ch": "glow", "shape": "wave", "amp": 0.05, "every": 2}]}},
   "states": {"rest": {"loop": "shine"}, "held": {"loop": "shine", "free": true}}},
  {"id": "counter", "about": "The bar counter.", "is": "furniture"}
]})";

static const char* kPlace = R"({"id": "test-bar", "about": "A small test bar.",
  "things": [
    {"id": "glass-1", "kind": "glass", "parent": "counter", "at": [0.2, 1.1, 0]},
    {"id": "counter", "kind": "counter", "at": [0, 0, -4]},
    {"id": "stool", "kind": "stool", "at": [-3, 0, -3], "row": {"count": 4, "step": [1, 0, 0]}},
    {"id": "jukebox", "kind": "jukebox", "at": [5, 0, 2], "turn": 90},
    {"id": "button", "kind": "button", "parent": "jukebox", "at": [0.3, 1, 0.3]},
    {"id": "sign", "kind": "sign", "at": [0, 3, -5]},
    {"id": "lamp", "kind": "lamp", "at": [-4, 2.4, -4.6]},
    {"id": "wall-n", "kind": "wall", "at": [0, 0, -6]}
  ]})";

static World makeWorld(std::string* errors) {
  Library lib;
  lib.add(kKinds, "test-kinds");
  lib.resolve();
  std::string err;
  const Place place = parsePlace(kPlace, &err);
  World w;
  w.build(lib, place, &err);
  if (errors) *errors = err + lib.errors();
  return w;
}

int main() {
  std::string errors;
  World w = makeWorld(&errors);
  check(errors.empty(), "the kinds and the place read without problems" + (errors.empty() ? "" : ": " + errors));

  // ---- Kinds and places ----
  {
    Library lib;
    lib.add(kKinds, "test-kinds");
    lib.resolve();
    const Kind* stool = lib.find("stool");
    check(stool && !stool->part("collider").isNull(), "a stool has the collider of the furniture it builds on");
    check(stool && stool->part("seat")["height"].number() == 0.75, "and its own seat");
    check(stool && stool->start == "idle" && stool->loop("creak") && stool->loop("spin"), "and both loops");
  }
  check(w.find("stool-1") >= 0 && w.find("stool-4") >= 0 && w.find("stool-5") < 0, "a row makes stool-1..stool-4");
  check(near(w.thing(w.find("stool-3")).at.x, -1), "each a step apart");
  const int juke = w.find("jukebox"), rec = w.find("jukebox/record"), btn = w.find("button");
  check(rec >= 0 && w.thing(rec).parent == juke, "the jukebox's record is made with it, sitting on it");
  check(w.thing(w.find("glass-1")).parent == w.find("counter"), "a parent named later in the file is found");
  check(w.find("lamp/moth1") >= 0 && w.find("lamp/moth2") >= 0, "unnamed small things get numbered ids");
  check(w.part(juke, "model")["file"].string() == "jukebox.glb", "parts are read through the thing");

  // ---- Every thing is alive ----
  {
    const auto problems = w.check();
    check(problems.empty(), "every state of every thing plays a live loop");
    for (const auto& p : problems) std::printf("     %s\n", p.c_str());
    check(w.stillKinds().size() == 1, "one kind says why it stands still (the wall)");
    Library lib;
    lib.add(R"({"kinds": [{"id": "rock", "states": {"sit": {"loop": "none"}}},
                          {"id": "pebble", "loops": {"x": {"period": 1}}, "states": {"sit": {"loop": "x", "on": {"tap": "fly"}}}}]})",
            "bad");
    lib.resolve();
    Place p;
    ThingSpec rock, pebble;
    rock.id = rock.kind = "rock";
    pebble.id = pebble.kind = "pebble";
    p.things.push_back(rock);
    p.things.push_back(pebble);
    World bad;
    bad.build(lib, p, nullptr);
    const auto bp = bad.check();
    bool noLoop = false, empty = false, badRule = false;
    for (const auto& s : bp) {
      if (s.find("no loop \"none\"") != std::string::npos) noLoop = true;
      if (s.find("loop is empty") != std::string::npos) empty = true;
      if (s.find("no state \"fly\"") != std::string::npos) badRule = true;
    }
    check(noLoop && empty && badRule, "the check finds a missing loop, an empty loop and a rule to nowhere");
  }

  // ---- Problems in files ----
  {
    Library lib;
    lib.add(R"({"kinds": [{"id": "a", "is": "b"}, {"id": "b", "is": "a"}, {"id": "c", "is": "nope"}]})", "circle");
    lib.resolve();
    check(lib.errors().find("circle") != std::string::npos && lib.errors().find("no kind \"nope\"") != std::string::npos,
          "kinds that build on each other in a circle, or on nothing, are reported");
    std::string err;
    const Place p = parsePlace(R"({"things": [{"id": "x", "kind": "ghost"}, {"id": "y", "kind": "a", "parent": "zz"}]})", &err);
    World bad;
    check(!bad.build(lib, p, &err) && err.find("no kind \"ghost\"") != std::string::npos &&
              err.find("no parent \"zz\"") != std::string::npos,
          "a missing kind or parent is reported, not a crash");
    std::string lerr;
    parseLoop(Json::parse(R"({"pieces": [{"ch": "wobble.q", "shape": "wave"}, {"ch": "glow", "shape": "zigzag"}]})"),
              "l", &lerr);
    check(lerr.find("unknown channel") != std::string::npos && lerr.find("unknown shape") != std::string::npos,
          "unknown channels and shapes are reported");
  }

  // ---- Loops from the clock alone ----
  Clock c;
  c.seconds = 1.7e9 + 12.25;  // the room's clock is big: still smooth
  World w2 = makeWorld(nullptr);
  w.update(c);
  w2.update(c);
  bool same = true;
  for (size_t i = 0; i < w.size(); ++i)
    if (!sameMat(w.thing(int(i)).world, w2.thing(int(i)).world)) same = false;
  check(same, "two phones with the same clock see exactly the same world");
  {
    const float a = w.thing(w.find("stool-1")).motion.ch[kTurnY];
    const float b = w.thing(w.find("stool-2")).motion.ch[kTurnY];
    check(a != b && std::fabs(a) <= 0.6f && std::fabs(b) <= 0.6f, "two stools creak, not in step, within 0.6 degrees");
  }
  {
    // Tuning (the hub): a kind's loops at another speed, or off; others as before.
    World t = makeWorld(nullptr);
    const int s1 = t.find("stool-1");
    check(t.tune("stool", 2, false) >= 2, "tuning reaches every stool");
    t.update(c);
    const float fast = t.thing(s1).motion.ch[kTurnY];
    check(fast != w2.thing(s1).motion.ch[kTurnY], "a faster stool is somewhere else in its sway");
    t.tune("stool", 1, true);
    t.update(c);
    check(t.thing(s1).motion.ch[kTurnY] == 0 && sameMat(t.thing(juke).world, w2.thing(juke).world),
          "a kind turned off stands still; the rest don't change");
  }
  {
    Clock m = c;
    m.music = true;
    m.beats = 100.0;  // exactly on a beat: the thump is at its top
    w.update(m);
    check(near(w.thing(juke).motion.ch[kMoveY], 0), "the idle jukebox doesn't bounce");
  }
  {
    // A moth stays near its lamp, and moves.
    const int moth = w.find("lamp/moth1");
    float maxR = 0;
    Vec3 first;
    bool moved = false;
    for (int k = 0; k < 400; ++k) {
      Clock t = c;
      t.seconds += k * 0.1;
      w.update(t);
      const Vec3 mv = w.thing(moth).motion.move();
      if (k == 0) first = mv;
      else if (distance(mv, first) > 0.05f) moved = true;
      maxR = std::max(maxR, std::sqrt(mv.x * mv.x + mv.z * mv.z));
    }
    check(moved && maxR < 0.35f, "a moth circles within its 0.3 m (+ wing jitter)");
    const Vec3 lamp = posOf(w.thing(w.find("lamp")).world), mp = posOf(w.thing(moth).world);
    check(distance(lamp, mp) < 0.5f, "and follows the lamp it sits on");
  }

  // ---- Rules, timed states and the changes the network carries ----
  const double t0 = c.seconds;
  const int stool = w.find("stool-2");
  check(w.stateOf(stool).name == "idle", "a stool starts idle");
  check(w.send(stool, "tap", t0), "tapping it follows its rule");
  check(w.stateOf(stool).name == "spun", "it spins");
  auto ch = w.takeChanges();
  check(ch.size() == 1 && ch[0].net == w.thing(stool).net && ch[0].start == t0, "one change to send: this stool, spun, now");
  check(!w.send(stool, "wave", t0), "an event with no rule does nothing");
  {
    Clock t = c;
    t.seconds = t0 + 0.05;
    w.update(t);
    const float during = w.thing(stool).motion.ch[kTurnY];
    check(during > 0 && during < 360 * 0.05f + 1, "blending into the spin (not a jump)");
    t.seconds = t0 + 0.99;
    w.update(t);
    check(w.stateOf(stool).name == "spun", "still spinning before one loop is done");
    t.seconds = t0 + 1.01;
    w.update(t);
    check(w.stateOf(stool).name == "idle" && w.thing(stool).start == t0 + 1.0,
          "back to idle after exactly one loop (at t0 + 1, not at the frame)");
    check(w.takeChanges().empty(), "timed changes are worked out by everyone: nothing to send");
  }

  // A button on the jukebox: its press tells the jukebox to play, which
  // tells its record to turn. One tap, three changes, one message out.
  check(w.send(btn, "tap", t0 + 2), "the jukebox's button takes a tap");
  check(w.stateOf(juke).name == "playing" && w.stateOf(rec).name == "turning", "the jukebox plays, its record turns");
  ch = w.takeChanges();
  check(ch.size() == 3, "three changes to send (button, jukebox, record)");

  // The other phone takes the changes as they are and ends up the same.
  for (const Change& x : ch) w2.apply(x);
  {
    Clock t = c;
    t.seconds = t0 + 2.5;
    t.music = true;
    t.beats = 333.0;
    w.update(t);
    w2.update(t);
    bool same2 = w.stateOf(juke).name == w2.stateOf(juke).name && w2.stateOf(rec).name == "turning";
    for (const char* id : {"jukebox", "jukebox/record", "button"})
      if (!sameMat(w.thing(w.find(id)).world, w2.thing(w2.find(id)).world)) same2 = false;
    check(same2, "the other phone, given the changes, shows the same jukebox, record and button");
    check(w2.stateOf(w2.find("button")).name == "up", "and the button is back up there too (timed, worked out)");
    check(near(w.thing(juke).motion.ch[kMoveY], 0.02f, 1e-3f), "on the beat the playing jukebox thumps up 2 cm");
    const float recY = posOf(w.thing(rec).world).y, jukeY = posOf(w.thing(juke).world).y;
    check(near(recY - jukeY, 1.2f, 1e-3f), "its record rides along (1.2 m above it)");
  }
  w2.apply(ch[0]);
  check(w2.takeChanges().empty(), "an applied change isn't sent again");

  // ---- A blinking sign that has been blinking since the clock began ----
  {
    const int sign = w.find("sign");
    Clock t;
    t.seconds = 1e9 + 0.5;  // 1e9 = 3 * 333333333 + 1 → 1.5 s into a round: on
    World ws = makeWorld(nullptr);
    ws.update(t);
    check(ws.stateOf(sign).name == "on", "a sign on a 3 s round, joined after 30 years, is in the right state");
    t.seconds = 1e9 + 1.5;  // 2.5 s into the round: off
    ws.update(t);
    check(ws.stateOf(sign).name == "off", "and a second later off, exactly when it should be");
  }

  // ---- Free things and moving onto another parent ----
  {
    Clock t;
    t.seconds = 5;
    World wf = makeWorld(nullptr);
    wf.update(t);
    const int glass = wf.find("glass-1"), stoolF = wf.find("stool-1");
    const Vec3 before = posOf(wf.thing(glass).world);
    wf.attach(glass, stoolF);
    wf.update(t);
    const Vec3 after = posOf(wf.thing(glass).world);
    check(wf.thing(glass).parent == stoolF && distance(before, after) < 0.01f,
          "a glass moved onto a stool stays where it was");
    wf.attach(stoolF, glass);
    check(wf.thing(stoolF).parent == -1, "a thing can't sit on what sits on it");
    check(wf.setState(glass, "held", 5) && wf.stateOf(glass).free, "a held glass is free (physics or a hand moves it)");
    wf.setRest(glass, {1, 2, 3}, {});
    wf.attach(glass, -1, {1, 2, 3}, {});
    wf.update(t);
    check(distance(posOf(wf.thing(glass).world), {1, 2, 3}) < 0.01f, "and goes where it's put");
  }

  // ---- Pivots, phases, events for everyone ----
  {
    Library lib;
    lib.add(R"({"kinds": [
      {"id": "flames", "pivot": [-8.7, 0.1, 0.8], "loops": {"lick": {"period": 1, "desync": false,
        "pieces": [{"ch": "scale.y", "shape": "hold", "value": 0.5}, {"ch": "turn.y", "shape": "hold", "value": 90}]}},
       "states": {"lit": {"loop": "lick"}}},
      {"id": "bulb", "loops": {"breathe": {"period": 4, "desync": false,
        "pieces": [{"ch": "light", "shape": "wave", "amp": 1}]}, "beat": {"period": 1, "pieces": [{"ch": "light", "shape": "hold", "value": 2}]}},
       "states": {"idle": {"loop": "breathe", "on": {"music": "groove"}}, "groove": {"loop": "beat", "on": {"quiet": "idle"}}}},
      {"id": "box", "loops": {"spin": {"period": 3, "pieces": [{"ch": "turn.y", "shape": "wave", "amp": 20}]}},
       "states": {"s": {"loop": "spin"}}}]})",
            "pivots");
    lib.resolve();
    std::string err;
    const Place p = parsePlace(R"({"things": [
      {"id": "fire", "kind": "flames"},
      {"id": "b1", "kind": "bulb", "at": [0, 3, 0]}, {"id": "b2", "kind": "bulb", "at": [1, 3, 0], "phase": 0.25},
      {"id": "shelf", "kind": "box", "at": [2, 1, 0], "turn": [0, 90, 0], "scale": 2},
      {"id": "cup", "kind": "box", "at": [3, 1.5, 1], "turn": [10, 20, 0]}]})",
                               &err);
    World wp;
    check(wp.build(lib, p, &err) && err.empty() && lib.errors().empty(), "pivot, phase and scale read" + err);
    Clock t;
    t.seconds = 1;
    wp.update(t);
    const Mat4& f = wp.thing(wp.find("fire")).world;
    const Vec4 pv = transformPoint(f, {-8.7f, 0.1f, 0.8f});
    check(near(pv.x, -8.7f) && near(pv.y, 0.1f) && near(pv.z, 0.8f), "flames turn and stretch around their pivot, which stays put");
    const Vec4 top = transformPoint(f, {-8.7f, 0.6f, 0.8f});
    check(near(top.y, 0.1f + 0.75f), "and grow from it (half again as tall)");
    const float l1 = wp.thing(wp.find("b1")).motion.ch[kLight], l2 = wp.thing(wp.find("b2")).motion.ch[kLight];
    check(near(l1, 1, 1e-3f) && near(l2, 0, 1e-3f), "a phase of a quarter puts the second bulb a quarter-cycle on (top → middle)");
    check(wp.sendAll("music", 1) && wp.stateOf(wp.find("b1")).name == "groove" && wp.stateOf(wp.find("b2")).name == "groove" &&
              wp.stateOf(wp.find("fire")).name == "lit",
          "an event for everyone moves the things with a rule for it, and only those");
    // Onto a turned, scaled, swaying shelf and back off: no jump either way.
    t.seconds = 2.2;
    wp.update(t);
    const int cup = wp.find("cup"), shelf = wp.find("shelf");
    const Mat4 before = wp.thing(cup).world;
    wp.attach(cup, shelf);
    wp.update(t);
    bool same3 = true;
    for (int k = 0; k < 16; ++k)
      if (!near(before.m[k], wp.thing(cup).world.m[k], 1e-3f)) same3 = false;
    check(same3, "a cup put on a turned, scaled, swaying shelf stays exactly where it was");
    wp.attach(cup, -1);
    wp.update(t);
    bool same4 = true;
    for (int k = 0; k < 16; ++k)
      if (!near(before.m[k], wp.thing(cup).world.m[k], 1e-3f)) same4 = false;
    check(same4 && near(wp.thing(cup).scale.x, 1, 1e-3f), "and taken off again, the same (its size unchanged)");
  }

  // ---- Messages to everyone, and what reacts ----
  {
    Library lib;
    lib.add(R"({"kinds": [
      {"id": "switch", "still": "part of the wall",
       "states": {"on": {"on": {"tap": "off"}, "enter": [{"send": "bright", "to": "all"}]},
                  "off": {"on": {"tap": "on"}, "enter": [{"send": "dark", "to": "all"}]}}},
      {"id": "lamp", "loops": {"l": {"period": 2, "pieces": [{"ch": "light", "shape": "wave", "amp": 0.1}]}},
       "states": {"lit": {"loop": "l", "on": {"dark": "out"}}, "out": {"loop": "l", "on": {"bright": "lit"}}}}]})",
            "all");
    lib.resolve();
    std::string err;
    const Place p = parsePlace(R"({"things": [{"id": "sw", "kind": "switch"}, {"id": "a", "kind": "lamp"},
                                              {"id": "b", "kind": "lamp", "at": [3, 0, 0]}]})", &err);
    World ww;
    ww.build(lib, p, &err);
    check(ww.reacts(ww.find("sw"), "tap") && !ww.reacts(ww.find("a"), "tap"), "a switch reacts to a tap, a lamp doesn't");
    check(ww.send(ww.find("sw"), "tap", 10) && ww.stateOf(ww.find("a")).name == "out" && ww.stateOf(ww.find("b")).name == "out",
          "the switch's message to all puts every lamp out");
    check(ww.takeChanges().size() == 3, "three changes to share (the switch and two lamps)");
    ww.send(ww.find("sw"), "tap", 11);
    check(ww.stateOf(ww.find("b")).name == "lit", "and back on");
  }

  // ---- Shapes ----
  {
    std::string err;
    const Loop k = parseLoop(Json::parse(R"({"period": 1, "pieces": [
        {"ch": "move.y", "shape": "keys", "ease": "linear", "keys": [[0.5, 1], [0, 0]]},
        {"ch": "glow", "shape": "steps", "values": [0, 1, 2, 3]},
        {"ch": "scale", "shape": "hold", "value": 0.5},
        {"ch": "open", "shape": "wave", "amp": 2}]})"),
                             "shapes", &err);
    check(err.empty() && k.pieces.size() == 4, "keys, steps, uniform scale and a custom channel read");
    Motion m;
    k.add(0.25, 1, 1, m);
    check(near(m.ch[kMoveY], 0.5f), "keys sorted and in between: halfway up at a quarter");
    check(near(m.ch[kGlow], 1), "steps: the second value in the second quarter");
    check(near(m.ch[kScaleX], 0.5f) && near(m.ch[kScaleZ], 0.5f), "a uniform scale scales all three");
    check(near(m.ch[customChannel("open")], 2), "a custom channel carries its own value");
    Motion m2;
    k.add(0.75, 1, 1, m2);
    check(near(m2.ch[kMoveY], 0.5f), "keys come back down round the loop");
  }

  // ---- How fast (a phone does this every frame) ----
  {
    Library lib;
    lib.add(kKinds, "test-kinds");
    lib.resolve();
    Place big;
    for (int i = 0; i < 2000; ++i) {
      ThingSpec s;
      s.id = "s" + std::to_string(i);
      s.kind = i % 2 ? "stool" : "lamp";
      s.at = {float(i % 50), 0, float(i / 50)};
      big.things.push_back(s);
    }
    World wb;
    wb.build(lib, big, nullptr);
    Clock t;
    t.seconds = 1000;
    const auto a = std::chrono::steady_clock::now();
    for (int f = 0; f < 60; ++f) {
      t.seconds += 1.0 / 60;
      wb.update(t);
    }
    const double ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - a).count() / 60;
    std::printf("     %zu things: %.3f ms per update\n", wb.size(), ms);
    check(ms < 8, "4000 things update in under 8 ms here");
    std::set<uint16_t> nets;
    for (size_t i = 0; i < wb.size(); ++i) nets.insert(wb.thing(int(i)).net);
    check(nets.size() == wb.size() && !nets.count(0), "every one of 4000 things has its own net id");
  }

  std::printf(failed ? "%d FAILED\n" : "WORLD TESTS PASSED\n", failed);
  return failed ? 1 : 0;
}
