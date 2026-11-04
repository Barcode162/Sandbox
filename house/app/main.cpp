// Hearthwake (M0): the house, walked through in first person. Built from
// Looped alone (engine/looped), like the engine's place viewer it grew from.
// It loads the place from the world files (house/assets/world, embedded at
// /assets/world; ?place=house is the default), draws it with the engine's
// renderer (real light units, bounced light, reflections, eyes that adapt),
// plays every thing's loop on the clock (the hearth flickers), and lets you
// walk: on a phone the left thumb walks and the right thumb looks; on a
// computer W A S D (or the arrows) walk and dragging the mouse looks.
//
// Page options: ?place=<name>, ?cam=x,z,yaw,pitch (a fixed view, degrees:
// for reference pictures), ?mem=1 (show the memory in the corner).
// The page can read window.houseState: {ready, frames, heapMB, x, z, yaw}
// (names quoted in the code, so the release build's minifier keeps them).
#include <emscripten/emscripten.h>
#include <emscripten/html5.h>

#include <algorithm>
#include <cmath>
#include <cstring>
#include <fstream>
#include <map>
#include <sstream>
#include <string>
#include <vector>

#include "looped/billboard.h"
#include "looped/frame_time.h"
#include "looped/gpu.h"
#include "looped/gpu_upload.h"
#include "looped/host.h"
#include "looped/jobs.h"
#include "looped/json.h"
#include "looped/log.h"
#include "looped/material.h"
#include "looped/pipeline_cache.h"
#include "looped/place_player.h"
#include "looped/scene_renderer.h"
#include "looped/text.h"
#include "looped/world/kind.h"
#include "looped/world/loop.h"
#include "looped/world/place_layout.h"
#include "looped/world/world.h"

namespace {

using engine::Vec2;
using engine::Vec3;

constexpr float kEyeHeight = 1.65f;   // Aldric's eyes, metres above the floor
constexpr float kWalkSpeed = 1.4f;    // metres a second: an unhurried walk, no running
constexpr float kWallGap = 0.3f;      // how close to a wall you can stand
constexpr float kStickRadius = 60.0f; // CSS pixels of thumb travel for full speed

struct Touch {
  bool stick = false;  // the left thumb (walk) or the right (look)
  Vec2 start, last;
};

struct House {
  engine::Gpu gpu;
  engine::SceneRenderer renderer;
  engine::TextRenderer text;
  engine::PictureBillboards pictures;
  engine::world::World world;
  engine::world::PlaceLayout layout;
  engine::PlacePlayer player;
  std::vector<engine::SceneRenderer::Box> boxes;
  std::map<std::string, engine::Material> materials;
  std::vector<std::string> names;  // keeps Material::name's text alive
  // You: where your eyes are and which way they look.
  Vec3 eye{0, kEyeHeight, 0};
  float yaw = 0, pitch = 0;
  bool fixedView = false;  // ?cam=...: the view stays put
  // Where you may walk (x, z): the first room, a little in from its walls.
  float minX = -1, maxX = 1, minZ = -1, maxZ = 1;
  // Input: thumbs, the mouse, the keys.
  std::map<int, Touch> touches;
  Vec2 stick;  // -1..1: x = sideways, y = forward
  bool mouseDown = false;
  Vec2 mouseLast;
  bool keyForward = false, keyBack = false, keyLeft = false, keyRight = false;
  double lastMs = 0;
  int frames = 0;
  bool reflectionsAsked = false;
};
House g;

std::string worldFile(const std::string& path) {
  std::ifstream f("/assets/world/" + path, std::ios::binary);
  std::stringstream s;
  s << f.rdbuf();
  return s.str();
}

std::string queryPlace() {
  char buf[64] = {};
  EM_ASM({
    var m = /[?&]place=([a-z0-9-]+)/.exec(location.search);
    stringToUTF8(m ? m[1] : 'house', $0, $1);
  }, buf, sizeof(buf));
  return buf;
}

// ?cam=x,z,yaw,pitch (degrees) fixes the view, for reference pictures.
bool queryCamera(float out[4]) {
  float v[4] = {0, 0, 0, 0};
  const int n = EM_ASM_INT({
    var m = /[?&]cam=([-0-9.,]+)/.exec(location.search);
    if (!m) return 0;
    var p = m[1].split(',').map(Number);
    for (var i = 0; i < 4; i++) HEAPF32[($0 >> 2) + i] = p[i] || 0;
    return p.length;
  }, v);
  if (n < 2) return false;
  std::memcpy(out, v, sizeof(v));
  return true;
}

// The materials of the world (assets/world/materials.json): the boxes the
// house is built from are painted with them.
void loadMaterials() {
  const engine::Json root = engine::Json::parse(worldFile("materials.json"));
  g.names.reserve(256);
  for (const engine::Json& m : root["materials"].items()) {
    engine::Material mat;
    mat.color = engine::world::readVec3(m["color"], mat.color);
    mat.roughness = static_cast<float>(m["roughness"].number(mat.roughness));
    mat.metallic = static_cast<float>(m["metallic"].number(mat.metallic));
    mat.emissive = static_cast<float>(m["glow"].number(mat.emissive));
    g.names.push_back(m["name"].string());
    mat.name = g.names.back().c_str();
    g.materials[m["id"].string()] = mat;
  }
}

const engine::Material* materialById(const std::string& id) {
  const auto it = g.materials.find(id.empty() ? "limestone" : id);
  if (it != g.materials.end()) return &it->second;
  static const engine::Material kPlain;
  return id.empty() ? &kPlain : nullptr;
}

void look(float dx, float dy) {
  g.yaw -= dx * 0.006f;
  g.pitch = std::clamp(g.pitch - dy * 0.005f, -1.35f, 1.35f);
}

void updateStick() {
  g.stick = {0, 0};
  for (const auto& [id, t] : g.touches) {
    if (!t.stick) continue;
    Vec2 d{(t.last.x - t.start.x) / kStickRadius, (t.start.y - t.last.y) / kStickRadius};
    const float len = std::hypot(d.x, d.y);
    if (len > 1) d = {d.x / len, d.y / len};
    g.stick = d;
  }
}

EM_BOOL onTouch(int type, const EmscriptenTouchEvent* e, void*) {
  double cssW = 0, cssH = 0;
  emscripten_get_element_css_size("#canvas", &cssW, &cssH);
  for (int i = 0; i < e->numTouches; ++i) {
    const EmscriptenTouchPoint& p = e->touches[i];
    if (!p.isChanged) continue;
    const int id = static_cast<int>(p.identifier);
    const Vec2 at{static_cast<float>(p.targetX), static_cast<float>(p.targetY)};
    if (type == EMSCRIPTEN_EVENT_TOUCHSTART) {
      g.touches[id] = Touch{at.x < cssW / 2, at, at};
    } else if (type == EMSCRIPTEN_EVENT_TOUCHMOVE) {
      const auto it = g.touches.find(id);
      if (it == g.touches.end()) continue;
      if (!it->second.stick) look(at.x - it->second.last.x, at.y - it->second.last.y);
      it->second.last = at;
    } else {
      g.touches.erase(id);
    }
  }
  updateStick();
  return EM_TRUE;
}

EM_BOOL onMouse(int type, const EmscriptenMouseEvent* e, void*) {
  const Vec2 at{static_cast<float>(e->targetX), static_cast<float>(e->targetY)};
  if (type == EMSCRIPTEN_EVENT_MOUSEDOWN) {
    g.mouseDown = true;
    g.mouseLast = at;
  } else if (type == EMSCRIPTEN_EVENT_MOUSEUP) {
    g.mouseDown = false;
  } else if (g.mouseDown && (e->buttons & 1)) {
    look(at.x - g.mouseLast.x, at.y - g.mouseLast.y);
    g.mouseLast = at;
  }
  return EM_TRUE;
}

EM_BOOL onKey(int type, const EmscriptenKeyboardEvent* e, void*) {
  const bool down = type == EMSCRIPTEN_EVENT_KEYDOWN;
  const std::string code = e->code;
  if (code == "KeyW" || code == "ArrowUp") g.keyForward = down;
  else if (code == "KeyS" || code == "ArrowDown") g.keyBack = down;
  else if (code == "KeyA" || code == "ArrowLeft") g.keyLeft = down;
  else if (code == "KeyD" || code == "ArrowRight") g.keyRight = down;
  else return EM_FALSE;
  return EM_TRUE;
}

bool loadPlace(const std::string& name) {
  std::string problems;
  const std::string file = "places/" + name + ".json";
  const engine::Json place = engine::Json::parse(worldFile(file), &problems, {64, 1 << 16});
  if (!place.isObject()) {
    LOG_ERROR("House: no place \"%s\".", name.c_str());
    return false;
  }
  engine::world::Library kinds;
  for (const engine::Json& f : place["kinds"].items()) kinds.add(worldFile(f.string()), f.string());
  kinds.resolve();
  problems += kinds.errors();
  g.world.build(kinds, engine::world::parsePlace(worldFile(file), &problems), &problems);
  g.layout = engine::world::layOut(g.world, place, materialById);
  problems += g.layout.problems;
  if (!problems.empty()) LOG_WARN("House: %s", problems.c_str());
  std::vector<int> lightOf(g.world.size(), -1);
  for (size_t l = 0; l < g.layout.lightThing.size(); ++l) lightOf[static_cast<size_t>(g.layout.lightThing[l])] = static_cast<int>(l);
  g.player.build(g.world, g.layout.modelOfThing, lightOf);
  // You come in where the place says, at eye height.
  g.eye = {g.layout.spawnPosition.x, kEyeHeight, g.layout.spawnPosition.z};
  g.yaw = g.layout.spawnYaw;
  if (!g.layout.rooms.empty()) {  // walls of the first room, less the gap (0.5 m walls: the room box holds them)
    const engine::Aabb& r = g.layout.rooms[0];
    g.minX = r.min.x + 0.5f + kWallGap;
    g.maxX = r.max.x - 0.5f - kWallGap;
    g.minZ = r.min.z + 0.5f + kWallGap;
    g.maxZ = r.max.z - 0.5f - kWallGap;
  }
  float cam[4];
  if (queryCamera(cam)) {
    g.fixedView = true;
    g.eye = {cam[0], kEyeHeight, cam[1]};
    g.yaw = engine::radians(cam[2]);
    g.pitch = engine::radians(cam[3]);
  }
  LOG_INFO("House: %s, %zu things, %zu alive, %zu lights.", name.c_str(), g.world.size(), g.player.alive(),
           g.layout.lights.size());
  return true;
}

// Which way the eyes look (yaw 0 = towards -z, the hearth).
Vec3 forward() {
  return {-std::sin(g.yaw) * std::cos(g.pitch), std::sin(g.pitch), -std::cos(g.yaw) * std::cos(g.pitch)};
}

void walk(float dt) {
  if (g.fixedView) return;
  float ahead = g.stick.y + (g.keyForward ? 1.0f : 0.0f) - (g.keyBack ? 1.0f : 0.0f);
  float side = g.stick.x + (g.keyRight ? 1.0f : 0.0f) - (g.keyLeft ? 1.0f : 0.0f);
  const float len = std::hypot(ahead, side);
  if (len < 0.05f) return;
  if (len > 1) {
    ahead /= len;
    side /= len;
  }
  const Vec3 f{-std::sin(g.yaw), 0, -std::cos(g.yaw)};
  const Vec3 r{std::cos(g.yaw), 0, -std::sin(g.yaw)};
  g.eye = g.eye + (f * ahead + r * side) * (kWalkSpeed * dt);
  g.eye.x = std::clamp(g.eye.x, g.minX, g.maxX);
  g.eye.z = std::clamp(g.eye.z, g.minZ, g.maxZ);
}

void tellPage() {
  const double heapMB = EM_ASM_DOUBLE({ return HEAP8.length / 1048576; });
  EM_ASM({ window['houseState'] = ({'ready': !!$0, 'frames': $1, 'heapMB': $2, 'x': $3, 'z': $4, 'yaw': $5}); },
         g.renderer.ready() ? 1 : 0, g.frames, heapMB, g.eye.x, g.eye.z, g.yaw);
}

void frame(double rafMs) {
  engine::beginFrameTime(rafMs);
  const double now = emscripten_get_now();
  const float dt = g.lastMs > 0 ? static_cast<float>(std::clamp((now - g.lastMs) / 1000.0, 0.0, 0.1)) : 0.0f;
  g.lastMs = now;
  g.gpu.resizeIfNeeded();
  walk(dt);

  engine::world::Clock clock;
  clock.seconds = now / 1000.0;
  g.world.update(clock);
  g.boxes.clear();
  g.player.draw(g.world, g.eye, dt, g.boxes, g.renderer);
  g.renderer.setBoxes(g.boxes);
  g.renderer.streamRooms(g.eye, now);
  // Once everything is in: reflections and bounced light.
  if (!g.reflectionsAsked && g.renderer.modelFilesDone() >= g.renderer.modelFiles() && engine::pendingJobs() == 0 &&
      !g.layout.rooms.empty()) {
    g.reflectionsAsked = true;
    const engine::Aabb& r = g.layout.rooms[0];
    g.renderer.captureReflections({(r.min.x + r.max.x) / 2, 1.6f, (r.min.z + r.max.z) / 2}, r);
    g.renderer.wantGi();
  }
  if (g.frames % 10 == 0) tellPage();
  if (!g.gpu.mayDraw(now)) return;
  const wgpu::TextureView target = g.gpu.beginFrame();
  if (!target) return;
  if (!g.renderer.ready()) {
    g.renderer.renderOverlay(target, g.text);
  } else {
    const float aspect = static_cast<float>(g.gpu.width) / static_cast<float>(std::max(1u, g.gpu.height));
    const engine::Mat4 view = engine::Mat4::lookAt(g.eye, g.eye + forward(), {0, 1, 0});
    const engine::Mat4 proj = engine::Mat4::perspective(engine::radians(70.0f), aspect, 0.05f, 60.0f);
    const engine::Mat4 nobody = engine::Mat4::translation({0, -500, 0});  // no body drawn yet (M5)
    g.renderer.render(target, proj * view, g.eye, nobody, {}, {}, g.layout.mirrors, g.text, g.pictures);
    ++g.frames;
  }
  g.gpu.endFrame();
}

void start(void*);

void onGpuReady(bool ok) {
  if (!ok) {
    LOG_FATAL("House: no GPU (WebGPU) here.");
    EM_ASM({ window['houseState'] = ({'ready': false, 'error': 'no WebGPU'}); });
    return;
  }
  engine::prepareMipmaps(g.gpu.device);
  // The scene starts in a task of its own, after the GPU's callback has
  // returned: pipelines made inside it fail.
  emscripten_async_call(start, nullptr, 0);
}

void start(void*) {
  loadMaterials();
  if (!loadPlace(queryPlace())) return;
  engine::RenderScene scene = engine::world::renderSceneOf(g.layout, materialById);
  if (!g.renderer.init(g.gpu, scene, {}, {0, 128}) ||
      !g.text.init(g.gpu.device, g.gpu.surfaceFormat, engine::Gpu::kDepthFormat) ||
      !g.pictures.init(g.gpu.device, g.gpu.surfaceFormat, engine::Gpu::kDepthFormat)) {
    LOG_FATAL("House: the renderer could not be set up.");
    return;
  }
  g.renderer.setClassicLighting(false);
  g.renderer.setLightsPerPixel(12);
  g.renderer.setLightUnits(8, 14);
  emscripten_set_touchstart_callback("#canvas", nullptr, true, onTouch);
  emscripten_set_touchmove_callback("#canvas", nullptr, true, onTouch);
  emscripten_set_touchend_callback("#canvas", nullptr, true, onTouch);
  emscripten_set_touchcancel_callback("#canvas", nullptr, true, onTouch);
  emscripten_set_mousedown_callback("#canvas", nullptr, true, onMouse);
  emscripten_set_mousemove_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, nullptr, true, onMouse);
  emscripten_set_mouseup_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, nullptr, true, onMouse);
  emscripten_set_keydown_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, nullptr, true, onKey);
  emscripten_set_keyup_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, nullptr, true, onKey);
  emscripten_request_animation_frame_loop([](double rafMs, void*) -> EM_BOOL {
    frame(rafMs);
    return EM_TRUE;
  }, nullptr);
}

}  // namespace

int main() {
  engine::host::install();
  LOG_INFO("Hearthwake starting.");
  g.gpu.init("#canvas", onGpuReady);
  return 0;
}
