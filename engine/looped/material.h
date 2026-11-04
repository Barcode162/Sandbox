#pragma once
// A material: one kind of stuff (oak, glass, brass, leather...), described
// once for every sense the world simulates. Each engine reads the part it
// needs: the renderer reads the look, physics reads the feel, the audio
// engine reads the sound. New engines add fields here instead of adding
// special cases to individual objects.
#include "looped/math.h"

namespace engine {

struct Material {
  const char* name = "";

  // Sight (physically based, "metal/roughness" like glTF).
  Vec3 color{0.5f, 0.5f, 0.5f};  // base color; for metals, the reflection tint
  float roughness = 0.5f;        // 0 = mirror smooth, 1 = chalky
  float metallic = 0;            // 0 = non-metal (wood, glass), 1 = metal
  float emissive = 0;            // glows by itself (bulbs, neon)
  int texture = -1;              // procedural texture layer (-1 = none)
  float textureScale = 1;        // texture repeats per meter

  // Feel (rigid-body physics).
  float density = 1000;    // kg per cubic meter
  float friction = 0.5f;   // 0 = ice, 1 = rubber
  float restitution = 0.3f;  // bounciness: 0 = thud, 1 = perfect bounce

  // Sound (impacts synthesized from collisions, room echo).
  float impactPitch = 400;   // Hz, main ringing frequency when struck
  float impactDecay = 0.1f;  // seconds the ring takes to die away
  float absorption = 0.1f;   // share of sound energy soaked up (0..1)
};

}  // namespace engine
