// The place viewer (J86): a second program built from Looped alone, no bar
// code. It loads a place from the world files (?place=showroom, the
// default), draws it with its models, lights and boxes, plays every thing's
// loop on the clock, and lets you look around it: drag to turn around the
// middle, pinch or scroll to come closer; left alone, it turns slowly by
// itself. Served at /bar/looped/ (looped/apps/viewer/index.html).
#include <emscripten/emscripten.h>
#include <emscripten/html5.h>

#include <algorithm>
#include <cmath>
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

using engine::Vec3;

struct Viewer {
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
  // The orbit camera: around `target`, at `distance`, turned `yaw`, tilted `pitch`.
  Vec3 target;
  float yaw = 0, pitch = -0.25f, distance = 6;
  float minDistance = 1, maxDistance = 20;
  double lastInputMs = -1e9, lastMs = 0;
  bool reflectionsAsked = false;
  // Pointers (fingers or the mouse) on the canvas.
  std::map<int, engine::Vec2> down;
  float pinch = 0;
};
Viewer g;

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
    stringToUTF8(m ? m[1] : 'showroom', $0, $1);
  }, buf, sizeof(buf));
  return buf;
}

// The materials of the world (assets/world/materials.json): plain boxes are
// painted with them.
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
  const auto it = g.materials.find(id.empty() ? "plaster" : id);
  if (it != g.materials.end()) return &it->second;
  static const engine::Material kPlain;
  return id.empty() ? &kPlain : nullptr;
}

void onPointer(int id, float x, float y, int type) {  // type: 0 down, 1 move, 2 up
  g.lastInputMs = emscripten_get_now();
  if (type == 0) g.down[id] = {x, y};
  if (type == 2) {
    g.down.erase(id);
    g.pinch = 0;
    return;
  }
  const auto it = g.down.find(id);
  if (it == g.down.end()) return;
  if (g.down.size() == 1) {  // one finger: turn around the middle
    g.yaw -= (x - it->second.x) * 0.008f;
    g.pitch = std::clamp(g.pitch - (y - it->second.y) * 0.006f, -1.3f, 0.6f);
  } else if (g.down.size() == 2) {  // two: pinch to come closer
    it->second = {x, y};
    const engine::Vec2 a = g.down.begin()->second, b = std::next(g.down.begin())->second;
    const float span = std::hypot(a.x - b.x, a.y - b.y);
    if (g.pinch > 0 && span > 0) g.distance = std::clamp(g.distance * g.pinch / span, g.minDistance, g.maxDistance);
    g.pinch = span;
    return;
  }
  it->second = {x, y};
}

EM_BOOL onTouch(int type, const EmscriptenTouchEvent* e, void*) {
  for (int i = 0; i < e->numTouches; ++i) {
    const EmscriptenTouchPoint& t = e->touches[i];
    if (!t.isChanged) continue;
    const int kind = type == EMSCRIPTEN_EVENT_TOUCHSTART ? 0 : type == EMSCRIPTEN_EVENT_TOUCHMOVE ? 1 : 2;
    onPointer(static_cast<int>(t.identifier), static_cast<float>(t.targetX), static_cast<float>(t.targetY), kind);
  }
  return EM_TRUE;
}

EM_BOOL onMouse(int type, const EmscriptenMouseEvent* e, void*) {
  const int kind = type == EMSCRIPTEN_EVENT_MOUSEDOWN ? 0 : type == EMSCRIPTEN_EVENT_MOUSEMOVE ? 1 : 2;
  if (kind == 1 && !(e->buttons & 1)) return EM_FALSE;
  onPointer(-1, static_cast<float>(e->targetX), static_cast<float>(e->targetY), kind);
  return EM_TRUE;
}

EM_BOOL onWheel(int, const EmscriptenWheelEvent* e, void*) {
  g.lastInputMs = emscripten_get_now();
  g.distance = std::clamp(g.distance * std::exp(static_cast<float>(e->deltaY) * 0.001f), g.minDistance, g.maxDistance);
  return EM_TRUE;
}

bool loadPlace(const std::string& name) {
  std::string problems;
  const std::string file = "places/" + name + ".json";
  const engine::Json place = engine::Json::parse(worldFile(file), &problems, {64, 1 << 16});
  if (!place.isObject()) {
    LOG_ERROR("Viewer: no place \"%s\".", name.c_str());
    return false;
  }
  engine::world::Library kinds;
  for (const engine::Json& f : place["kinds"].items()) kinds.add(worldFile(f.string()), f.string());
  kinds.resolve();
  problems += kinds.errors();
  g.world.build(kinds, engine::world::parsePlace(worldFile(file), &problems), &problems);
  g.layout = engine::world::layOut(g.world, place, materialById);
  problems += g.layout.problems;
  if (!problems.empty()) LOG_WARN("Viewer: %s", problems.c_str());
  std::vector<int> lightOf(g.world.size(), -1);
  for (size_t l = 0; l < g.layout.lightThing.size(); ++l) lightOf[static_cast<size_t>(g.layout.lightThing[l])] = static_cast<int>(l);
  g.player.build(g.world, g.layout.modelOfThing, lightOf);
  // Look at the middle of the first room, from far enough to see it all.
  if (!g.layout.rooms.empty()) {
    const engine::Aabb& r = g.layout.rooms[0];
    g.target = {(r.min.x + r.max.x) / 2, std::min(1.2f, (r.min.y + r.max.y) / 2), (r.min.z + r.max.z) / 2};
    const float span = std::max(r.max.x - r.min.x, r.max.z - r.min.z);
    g.distance = std::clamp(span * 0.42f, 2.0f, 12.0f);
    g.maxDistance = std::max(4.0f, span * 0.48f);  // stay inside the room's walls
  } else {
    g.target = g.layout.spawnPosition;
  }
  g.yaw = g.layout.spawnYaw;
  LOG_INFO("Viewer: %s, %zu things, %zu alive, %zu models, %zu lights.", name.c_str(), g.world.size(),
           g.player.alive(), g.layout.models.size(), g.layout.lights.size());
  return true;
}

Vec3 eye() {
  return g.target + Vec3{std::sin(g.yaw) * std::cos(g.pitch), -std::sin(g.pitch), std::cos(g.yaw) * std::cos(g.pitch)} * g.distance;
}

void frame(double rafMs) {
  engine::beginFrameTime(rafMs);
  const double now = emscripten_get_now();
  const float dt = g.lastMs > 0 ? static_cast<float>(std::clamp((now - g.lastMs) / 1000.0, 0.0, 0.1)) : 0.0f;
  g.lastMs = now;
  // Left alone for 4 s, it turns slowly by itself.
  if (now - g.lastInputMs > 4000) g.yaw += dt * 0.12f;
  g.gpu.resizeIfNeeded();

  engine::world::Clock clock;
  clock.seconds = now / 1000.0;
  g.world.update(clock);
  const Vec3 e = eye();
  g.boxes.clear();
  g.player.draw(g.world, e, dt, g.boxes, g.renderer);
  g.renderer.setBoxes(g.boxes);
  g.renderer.streamRooms(e, now);
  // Once everything is in: reflections and bounced light.
  if (!g.reflectionsAsked && g.renderer.modelFilesDone() >= g.renderer.modelFiles() && engine::pendingJobs() == 0 &&
      !g.layout.rooms.empty()) {
    g.reflectionsAsked = true;
    const engine::Aabb& r = g.layout.rooms[0];
    g.renderer.captureReflections({(r.min.x + r.max.x) / 2, 1.8f, (r.min.z + r.max.z) / 2}, r);
    g.renderer.wantGi();
  }
  if (!g.gpu.mayDraw(now)) return;
  const wgpu::TextureView target = g.gpu.beginFrame();
  if (!target) return;
  if (!g.renderer.ready()) {
    g.renderer.renderOverlay(target, g.text);
  } else {
    const float aspect = static_cast<float>(g.gpu.width) / static_cast<float>(std::max(1u, g.gpu.height));
    const engine::Mat4 view = engine::Mat4::lookAt(e, g.target, {0, 1, 0});
    const engine::Mat4 proj = engine::Mat4::perspective(engine::radians(60.0f), aspect, 0.05f, 100.0f);
    const engine::Mat4 nobody = engine::Mat4::translation({0, -500, 0});  // no body of your own here
    g.renderer.render(target, proj * view, e, nobody, {}, {}, g.layout.mirrors, g.text, g.pictures);
  }
  g.gpu.endFrame();
}

void start(void*);

void onGpuReady(bool ok) {
  if (!ok) {
    LOG_FATAL("Viewer: no GPU (WebGPU) here.");
    return;
  }
  engine::prepareMipmaps(g.gpu.device);
  // The scene starts in a task of its own, after the GPU's callback has
  // returned (as the bar's does): pipelines made inside it fail.
  emscripten_async_call(start, nullptr, 0);
}

void start(void*) {
  loadMaterials();
  if (!loadPlace(queryPlace())) return;
  engine::RenderScene scene = engine::world::renderSceneOf(g.layout, materialById);
  // A small program: nobody else, a few glowing shapes.
  if (!g.renderer.init(g.gpu, scene, {}, {0, 128}) ||
      !g.text.init(g.gpu.device, g.gpu.surfaceFormat, engine::Gpu::kDepthFormat) ||
      !g.pictures.init(g.gpu.device, g.gpu.surfaceFormat, engine::Gpu::kDepthFormat)) {
    LOG_FATAL("Viewer: the renderer could not be set up.");
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
  emscripten_set_wheel_callback("#canvas", nullptr, true, onWheel);
  emscripten_request_animation_frame_loop([](double rafMs, void*) -> EM_BOOL {
    frame(rafMs);
    return EM_TRUE;
  }, nullptr);
}

}  // namespace

int main() {
  engine::host::install();
  LOG_INFO("Looped place viewer starting.");
  g.gpu.init("#canvas", onGpuReady);
  return 0;
}
