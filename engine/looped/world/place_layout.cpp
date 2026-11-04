#include "looped/world/place_layout.h"

#include <cmath>

#include "looped/mesh_data.h"
#include "looped/world/loop.h"

namespace engine::world {

namespace {
Aabb box(const Json& j) { return {readVec3(j["min"], {}), readVec3(j["max"], {})}; }
}  // namespace

void restPose(const World& w, int i, Vec3* pos, Quat* rot) {
  std::vector<int> chain;
  for (int k = i; k >= 0; k = w.thing(k).parent) chain.push_back(k);
  Vec3 p;
  Quat r;
  for (auto it = chain.rbegin(); it != chain.rend(); ++it) {
    const Thing& t = w.thing(*it);
    p = p + r.rotate(t.at);
    r = r * t.rot;
  }
  *pos = p;
  *rot = normalized(r);
}

PlaceLayout layOut(const World& world, const Json& place, const MaterialLookup& material) {
  PlaceLayout out;
  // The air, where you come in, the rooms and the doorways between them.
  const Json& air = place["air"];
  out.ambient = readVec3(air["ambient"], {});
  out.fogColor = readVec3(air["fog"], {});
  out.fogDensity = static_cast<float>(air["fogDensity"].number(0));
  out.beamHaze = static_cast<float>(air["beams"].number(0));
  out.spawnPosition = readVec3(place["spawn"]["at"], {});
  out.spawnYaw = radians(static_cast<float>(place["spawn"]["yaw"].number(0)));
  out.lightGridMin = readVec3(place["lightGrid"]["min"], {});
  out.lightGridMax = readVec3(place["lightGrid"]["max"], {});
  for (const Json& r : place["rooms"].items()) {
    out.roomIndex[r["id"].string()] = static_cast<int>(out.rooms.size());
    out.rooms.push_back(box(r));
  }
  for (const Json& d : place["doorways"].items()) {
    Doorway door;
    door.a = out.roomIndex[d["rooms"][0].string()];
    door.b = out.roomIndex[d["rooms"][1].string()];
    for (int k = 0; k < 4; ++k) door.corners[k] = readVec3(d["corners"][k], {});
    out.doorways.push_back(door);
  }
  // The place's mood (S7.3): a named set of light colours and brightness,
  // by thing id or by kind; the rest of the light as its part says.
  const Json& mood = place["moods"][place["mood"].string()]["lights"];

  out.modelOfThing.assign(world.size(), -1);
  std::map<std::string, int> modelOf;
  std::vector<std::pair<size_t, std::vector<std::string>>> mirrorButtons;
  for (size_t n = 0; n < world.size(); ++n) {
    const int i = static_cast<int>(n);
    const Thing& t = world.thing(i);
    Vec3 pos;
    Quat rot;
    restPose(world, i, &pos, &rot);
    auto at = [&](const Json& j) { return pos + rot.rotate(readVec3(j, {})); };
    auto dir = [&](const Json& j) { return rot.rotate(readVec3(j, {})); };

    if (const Json& m = world.part(i, "model"); m.isObject()) {
      PlaceLayout::Model model;
      model.placed.file = m["file"].string();
      model.placed.position = pos;
      model.placed.rotation = rot;
      model.placed.scale = static_cast<float>(m["scale"].number(1)) * t.scale.x;
      if (const Json& r = world.part(i, "room"); r.isString()) {
        const auto it = out.roomIndex.find(r.string());
        model.placed.room = it != out.roomIndex.end() ? it->second : -1;
      }
      model.material = m["material"].isString() ? m["material"].string() : "";
      model.thing = i;
      out.modelOfThing[n] = static_cast<int>(out.models.size());
      modelOf[t.id] = static_cast<int>(out.models.size());
      out.models.push_back(std::move(model));
    }
    // Plain boxes (E7.1): floors, walls, shelves a place is built from
    // without a model of its own; solid unless "solid": false.
    for (const Json& b : world.part(i, "boxes").items()) {
      PlaceLayout::Box bx;
      bx.size = readVec3(b["size"], {1, 1, 1});
      bx.mesh = makeBox(bx.size);
      bx.position = at(b["at"]);
      bx.rotation = normalized(rot * Quat::axisAngle({0, 1, 0}, radians(static_cast<float>(b["turn"].number(0)))));
      bx.material = b["material"].isString() ? b["material"].string() : "";
      const Material* look = material(bx.material);
      if (!look) {
        out.problems += t.id + ": no material \"" + bx.material + "\"\n";
        bx.material.clear();
        look = material("");
      }
      static const Material kPlain;
      if (!look) look = &kPlain;
      bx.color = readVec3(b["color"], look->color);
      bx.glow = static_cast<float>(b["glow"].number(look->emissive));
      bx.textureScale = look->textureScale;
      bx.solid = b["solid"].boolean(true);
      bx.thing = i;
      out.boxes.push_back(std::move(bx));
    }
    if (const Json& l = world.part(i, "light"); l.has("color")) {
      const Json& mo = mood.has(t.id) ? mood[t.id] : mood[t.kind->id];
      PointLight light;
      light.position = pos;
      light.color = readVec3(mo.has("color") ? mo["color"] : l["color"], {1, 1, 1});
      light.intensity = static_cast<float>(mo.has("intensity") ? mo["intensity"].number(1) : l["intensity"].number(1));
      light.range = static_cast<float>(l["range"].number(4));
      light.radius = static_cast<float>(l["radius"].number(0.1));
      light.lumens = static_cast<float>(mo.has("lumens") ? mo["lumens"].number(0) : l["lumens"].number(0));
      light.kelvin = static_cast<float>(mo.has("kelvin") ? mo["kelvin"].number(0) : l["kelvin"].number(0));
      // Lights with size (L1.6): tube or panel, in the thing's own space.
      const std::string shape = l["shape"].string();
      light.shape = shape == "tube" ? 1 : shape == "panel" ? 2 : 0;
      if (light.shape) {
        light.position = pos + rot.rotate(readVec3(l["center"], {}));
        light.axis = rot.rotate(readVec3(l["axis"], {1, 0, 0})) * static_cast<float>(l["length"].number(1) * 0.5);
        if (light.shape == 2) light.axis2 = rot.rotate(readVec3(l["axis2"], {0, 0, 1})) * static_cast<float>(l["width"].number(1) * 0.5);
      }
      light.oneSided = light.shape == 2 && l["wall"].boolean(false);
      light.model = out.modelOfThing[n];  // its own model stays out of its shadow (J97)
      out.lights.push_back(light);
      out.lightThing.push_back(i);
      out.lightDims.push_back(l["dims"].boolean(false));
    }
    if (const Json& m = world.part(i, "mirror"); m.isObject()) {
      Mirror mr{at(m["center"]), dir(m["normal"]), dir(m["right"]), dir(m["up"]),
                static_cast<float>(m["halfWidth"].number(1)), static_cast<float>(m["halfHeight"].number(1)),
                m["mode"].string() == "avatars" ? MirrorMode::kAvatarsOnly : MirrorMode::kFull};
      std::vector<std::string> buttons;
      for (const Json& b : m["buttons"].items()) buttons.push_back(b.string());
      mirrorButtons.push_back({out.mirrors.size(), buttons});
      out.mirrors.push_back(mr);
      out.mirrorThing.push_back(i);
    }
  }
  for (const auto& [m, buttons] : mirrorButtons)
    for (size_t b = 0; b < buttons.size() && b < 3; ++b) {
      const auto it = modelOf.find(buttons[b]);
      if (it == modelOf.end()) out.problems += "mirror button \"" + buttons[b] + "\" isn't a model\n";
      else out.mirrors[m].buttonModels[b] = it->second;
    }
  return out;
}

RenderScene renderSceneOf(const PlaceLayout& layout, const MaterialLookup& material) {
  RenderScene r;
  static const Material kPlain;
  for (const PlaceLayout::Box& b : layout.boxes) {
    const Material* m = material(b.material);
    if (!m) m = &kPlain;
    r.objects.push_back({b.mesh, b.position, b.rotation, b.color, m->metallic, m->roughness, m->texture, b.glow,
                         b.textureScale});
  }
  for (const PlaceLayout::Model& m : layout.models) r.models.push_back(m.placed);
  r.lights = layout.lights;
  r.mirrorCount = layout.mirrors.size();
  r.rooms = layout.rooms;
  r.doorways = layout.doorways;
  r.lightGridMin = layout.lightGridMin;
  r.lightGridMax = layout.lightGridMax;
  r.ambient = layout.ambient;
  r.fogColor = layout.fogColor;
  r.fogDensity = layout.fogDensity;
  r.beamHaze = layout.beamHaze;
  r.spawnPosition = layout.spawnPosition;
  return r;
}

}  // namespace engine::world
