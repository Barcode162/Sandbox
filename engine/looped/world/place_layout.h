#pragma once
// A place laid out for drawing (J86): what any program needs from a place
// file and its world, without any game: the air, where you come in, the
// rooms and their doorways, the light grid, and every thing's model, plain
// boxes, light (with the place's mood) and mirror, each with the thing it
// came from. No GPU code (the native tests build it).
//
// A game adds its own parts on top (the bar: seats, uses, darts…; see
// bar/bar_scene.cpp); a small program draws it as it is (the place viewer,
// looped/apps/viewer).
#include <functional>
#include <map>
#include <string>
#include <vector>

#include "looped/json.h"
#include "looped/material.h"
#include "looped/math.h"
#include "looped/render_scene.h"
#include "looped/world/world.h"

namespace engine::world {

// A thing's place before any loop moves it: its rest on its parent, all the
// way up.
void restPose(const World& w, int i, Vec3* pos, Quat* rot);

struct PlaceLayout {
  // The air, where you come in, the rooms and the doorways.
  Vec3 ambient, fogColor;
  float fogDensity = 0;
  float beamHaze = 0;  // the air's "beams" (J91.2)
  Vec3 spawnPosition;
  float spawnYaw = 0;  // radians
  Vec3 lightGridMin, lightGridMax;
  std::vector<Aabb> rooms;
  std::map<std::string, int> roomIndex;  // room id → index into rooms
  std::vector<Doorway> doorways;

  // Models, in thing order (the "model" part).
  struct Model {
    PlacedModel placed;    // file, place, size, room
    std::string material;  // what it's made of ("" = none given)
    int thing = -1;
  };
  std::vector<Model> models;
  std::vector<int> modelOfThing;  // thing → index into models, or -1

  // Plain boxes (the "boxes" part): floors, walls, shelves.
  struct Box {
    MeshData mesh;
    Vec3 position;
    Quat rotation;
    Vec3 size;
    std::string material;  // its material's id ("" = the default)
    Vec3 color;            // the material's colour unless the box sets one
    float glow = 0;
    float textureScale = 1;
    bool solid = true;
    int thing = -1;
  };
  std::vector<Box> boxes;

  // Lights (the "light" part), coloured by the place's mood.
  std::vector<PointLight> lights;
  std::vector<int> lightThing;
  std::vector<bool> lightDims;  // the light switch turns it down ("dims": true)

  // Mirrors (the "mirror" part); their buttons, by thing id, are models.
  std::vector<Mirror> mirrors;
  std::vector<int> mirrorThing;

  std::string problems;  // what was wrong, one line each ("" = nothing)
};

// Looks a material up by id ("" = the place's default for boxes); null = no
// such material.
using MaterialLookup = std::function<const Material*(const std::string& id)>;

// Lays out `world` (built from `place`, the place file as JSON).
PlaceLayout layOut(const World& world, const Json& place, const MaterialLookup& material);

// The layout as the scene renderer takes it (boxes painted with their
// materials). The game fills in what's its own (textures, mood).
RenderScene renderSceneOf(const PlaceLayout& layout, const MaterialLookup& material);

}  // namespace engine::world
