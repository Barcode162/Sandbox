#pragma once
// Draws a scene (looped/render_scene.h; the bar's comes from
// bar/bar_scene.cpp → renderSceneOf): the scene objects, your avatar (whole in mirrors, headless
// in first person so you can see your body), the mirrors themselves, and
// the text on top.
//
// Mirrors: before the main view, each visible mirror gets its own pass that
// renders the room from a camera reflected across the glass into a
// screen-sized texture (only the part of the screen the mirror covers is
// drawn, to save GPU time). The glass then shows that texture.
#include <webgpu/webgpu_cpp.h>

#include <memory>
#include <string>
#include <vector>

#include "looped/billboard.h"
#include "looped/culling.h"
#include "looped/gpu.h"
#include "looped/math.h"
#include "looped/mesh.h"
#include "looped/model.h"
#include "looped/post.h"
#include "looped/gi.h"
#include "looped/gpu_upload.h"
#include "looped/shadows.h"
#include "looped/beams.h"
#include "looped/ssao.h"
#include "looped/render_scene.h"
#include "looped/scene_geometry.h"
#include "looped/skinned_mesh.h"
#include "looped/text.h"

namespace engine {

// How much a program draws at most, given at start (J86): other players'
// avatars, and simple boxes per frame (SceneRenderer::setBoxes).
struct RendererLimits {
  size_t others = 7;
  size_t boxes = 256;
};

class SceneRenderer {
 public:
  using Limits = RendererLimits;
  // `avatars` = one mesh per avatar look (players pick one).
  bool init(engine::Gpu& gpu, const RenderScene& scene, const std::vector<engine::SkinnedMeshData>& avatars,
            Limits limits = {});
  const Limits& limits() const { return limits_; }

  // Simple shapes that change every frame (piano key lights, darts, drinks,
  // cars...): boxes with a color and glow. At most limits().boxes are drawn.
  struct Box {
    engine::Vec3 center;
    engine::Vec3 size{0.1f, 0.1f, 0.1f};
    engine::Quat rotation;
    engine::Vec3 color{0.8f, 0.8f, 0.8f};
    float glow = 0;
    float roughness = 0.6f;
    float metallic = 0;
  };
  void setBoxes(const std::vector<Box>& boxes);
  // Turns one of the scene's lights up or down (1 = as built, 0 = off).
  void setLightScale(size_t light, float scale);
  static constexpr uint32_t maxLights() { return kMaxLights; }
  // A light changed live (the Studio, S7.2). Its place in the light grid
  // stays as built until the lighting is rebuilt (switching New / Classic).
  void setLight(size_t light, const PointLight& p);
  // At most this many lights add up per pixel (fewer = cheaper; quality).
  // At most n lights per pixel (0 = all a cell holds). The new lighting
  // shortens every lamp's reach until no cell needs more, so no cell drops one.
  void setLightsPerPixel(int n);
  // New lighting: how bright self-lit surfaces are (cd/m² per unit of their
  // glow) and how strong the room's ambient fill is (until bounced light
  // replaces it, L1.6). Tuning: ?emissive= ?ambient=.
  void setLightUnits(float emissiveNits, float ambientNits) {
    emissiveNits_ = emissiveNits;
    ambientNits_ = ambientNits;
  }
  // Which avatar look you (and each other player, see setOthers) wear.
  void setSelfAvatar(size_t look) { selfLook_ = look < avatarMeshes_.size() ? look : 0; }
  // A look made at runtime (the avatar customizer): returns its look index.
  size_t addAvatarMesh(const engine::SkinnedMeshData& mesh);
  // Replaces a look's mesh (the customizer: the same slot is reused).
  void setAvatarMesh(size_t index, const engine::SkinnedMeshData& mesh);
  // Draw your own body whole (with the head) in the main view: the
  // customizer's preview, when the camera looks at you from the front.
  void setSelfWhole(bool whole) { selfWhole_ = whole; }
  // Mirror detail (Settings → Graphics): 0 full; 1 simple: a softer
  // reflection that leaves out small things farther away (avatars and
  // everything near the glass stay). Auto quality at Low uses simple too.
  void setMirrorDetail(int detail) { mirrorDetail_ = detail; }
  // The lighting before L1 (docs/handbook/manual/light.md): Settings → Graphics →
  // Lighting, or ?light=classic.
  void setClassicLighting(bool classic);
  // Test lighting (?light=test, the tests only): classic, plus a flat light from
  // above instead of every lamp per pixel (scene.wgsl), so software drawing is quick.
  void setTestLighting(bool on) { testLight_ = on; }
  bool classicLighting() const { return classic_; }
  // Lamp shadows (J97): the brightest lamps' shadows of still things, drawn
  // once into cube maps and kept (again when the layout changes); off = the
  // old look (bounced light's probes decide what a lamp reaches).
  void setLampShadows(bool on);
  // Soft shade where things meet (ambient occlusion, J91, looped/ssao.h):
  // Settings → Graphics → Soft shade, ?ao=0.
  void setSoftShade(bool on);
  bool softShade() const { return aoOn_; }
  // Light beams (J91.2, looped/beams.h): `strength` scales the place's haze
  // (its air's "beams"; ?haze= for trying values).
  void setLightBeams(bool on) { beamsOn_ = on; }
  void setBeamStrength(float strength) { beamScale_ = strength; }
  // Steps along each line of sight (fewer: cheaper, grainier; the quality tiers set it).
  void setBeamSteps(int steps) { beamSteps_ = steps < 4 ? 4 : steps > 32 ? 32 : steps; }
  bool lampShadows() const { return shadowsOn_; }
  // Eyes adapting (L1.1); off = a fixed exposure (?eyes=0).
  void setEyes(bool on) { eyes_ = on; }
  // After a teleport or travel: the eyes jump to the new place instead of easing.
  void resetEyes() { post_.resetEyes(); }
  void setMood(const Mood& mood) { post_.setMood(mood); }
  const Mood& mood() const { return post_.mood(); }
  int mirrorDetail() const { return mirrorDetail_; }

  // Extra glow on some scene objects and placed models (0 = normal), e.g.
  // the parts of the thing you're looking at.
  void setGlow(size_t firstObject, size_t objectCount, size_t firstModel, size_t modelCount, float glow);
  // A model's own glow, kept under any highlight (e.g. a lit button).
  void setModelBaseGlow(size_t model, float glow);

  // Renders one frame to `target`. `avatar` places the avatar in the world;
  // `avatarBones` are its skinning matrices (see Avatar::pose) for mirrors,
  // `firstPersonBones` the same pose without the head (Avatar::hideHead).
  // Only the text layer on a plain background: for when the bar is hidden
  // (loading screen, 4K Mania), so nothing invisible gets drawn.
  void renderOverlay(const wgpu::TextureView& target, const engine::TextRenderer& text);
  // All of the scene's pipelines have compiled (they compile in the background).
  bool ready() const {
    return pipeline_ && mirroredPipeline_ && skinnedPipeline_ && skinnedMirroredPipeline_ && modelPipeline_ &&
           modelMirroredPipeline_ && modelBlendPipeline_ && modelBlendMirroredPipeline_ && glassPipeline_;
  }
  void render(const wgpu::TextureView& target, const engine::Mat4& viewProj, engine::Vec3 eye,
              const engine::Mat4& avatar, const std::vector<engine::Mat4>& avatarBones,
              const std::vector<engine::Mat4>& firstPersonBones, const std::vector<Mirror>& mirrors,
              const engine::TextRenderer& text, const engine::PictureBillboards& pictures);

  // Other players' avatars this frame (multiplayer): where each one stands
  // (avatarTransform) and its full pose. At most limits().others are drawn.
  void setOthers(const std::vector<engine::Mat4>& transforms, const std::vector<std::vector<engine::Mat4>>& bones,
                 const std::vector<int>& looks);

  size_t objectCount() const { return sceneDraws_.size() + modelsLoaded_; }

  // Model loading, for the loading screen: files finished (loaded or
  // failed), files in total, and overall progress 0..1 (downloads included).
  size_t modelFilesDone() const { return filesDone_; }
  size_t modelFilesFailed() const { return filesFailed_; }
  bool criticalFileFailed() const { return criticalFailed_; }
  size_t modelFiles() const { return fileProgress_.size(); }
  float loadProgress() const;

  // Rooms you're not in load when you come within kStreamDistance of them,
  // when their doorway is on screen, or after kStreamIdleMs in the bar anyway
  // (so walking in finds them ready). Call every frame once in the bar.
  void streamRooms(engine::Vec3 eye, double nowMs);
  static constexpr float kStreamDistance = 8.0f;
  static constexpr double kStreamIdleMs = 20000;

  // Moves placed model `index` (RenderScene::models order), e.g. a glass that
  // physics is moving.
  void setModelTransform(size_t index, engine::Vec3 position, engine::Quat rotation);
  // A placed model's whole place as one matrix (position, turn and size: a
  // thing's world matrix, looped/world). Many move every frame (loops): kept
  // here and sent in one go at the next render, like the lights.
  void setModelPose(size_t index, const engine::Mat4& world);
  // A model's look from its loop: `glow` scales its own glowing parts (1 = as
  // made, 0 = dark), `tint` multiplies its colour ({1,1,1} = as made).
  void setModelLook(size_t index, float glow, engine::Vec3 tint);
  // Placed model `index`'s box in the world, as drawn now (false until its
  // file has loaded).
  bool modelBox(size_t index, engine::Aabb* out) const;
  // Soft shadows on the floor this frame (E4.2): x, y (the floor's height), z,
  // radius; drawn after the scene.
  void setShadows(std::vector<engine::Vec4> discs) { shadowDiscs_ = std::move(discs); }
  // Reflections (E4.4): the room is captured once into a cube picture from
  // `center` (at the next render); shiny surfaces inside `room` reflect it.
  void captureReflections(engine::Vec3 center, const engine::Aabb& room) {
    envCenter_ = center;
    envRoom_ = room;
    capturePending_ = true;
  }
  bool reflectionsReady() const { return envReady_; }
  // Bounced light (L1.5): works it out for the still models loaded now
  // (again when the layout changed: more rooms streamed in, the Studio moved
  // things). Off with ?bounce=0. `relightGi` after a lamp moved.
  void buildGi();
  void relightGi();
  // Call once the place has loaded: bounced light is built then, and again by
  // itself when more rooms stream in.
  void wantGi() { giWanted_ = true; }
  // Still things were moved (the Studio): bounced light again 1.5 s after the last move.
  void layoutChanged();
  void setGiEnabled(bool on) { giOn_ = on; }
  void setBounceStrength(float s) { bounceStrength_ = s; }
  // Fewer rays (?gilite=1): for the software GPU of the tests' pictures.
  void setGiLite(bool lite) { giLite_ = lite; }
  // Real roughness (M0, ?roughfix=0 turns it off): set before models load.
  void setRoughFix(bool on) { roughFix_ = on; }
  void setGiView(int view) { giView_ = view; }  // ?giview= (debug views, scene.wgsl)
  const GiGpu& gi() const { return gi_; }
  static constexpr size_t kObjectStrideBytes = 256;  // one object's uniforms (kObjectStride in the .cpp)

 private:
  Limits limits_;
  // A cell lists lights by one byte each (0xff ends the list): 255 at most
  // (J88.1). Matches kMaxLights in looped/shaders/scene.wgsl and gi.wgsl.
  static constexpr uint32_t kMaxLights = 255;
  static constexpr uint32_t kLightsPerCell = 16;   // brightest first (4 x 4 bytes, 0xff ends the list)
  static constexpr float kMirrorLights = 4;        // the reflection takes the 4 strongest
  // The light grid: up to 48 x 48 cells over the floor (J111.2; it was
  // 16 x 16, cells about 2 m wide, so a pixel went through every lamp that
  // touched any part of its 2 m square). Sized so the lighting block stays
  // under WebGPU's 64 KB for one uniform buffer (255 lights x 80 B + cells x 16 B).
  static constexpr uint32_t kGridSide = 48;
  static constexpr uint32_t kMaxGridCells = kGridSide * kGridSide;
  static constexpr uint32_t kMaxBones = 32;
  static constexpr size_t kMaxModels = 4096;
  struct GpuLight {
    float position[4];  // xyz, range
    float color[4];     // rgb, intensity
    float params[4];    // x = radius of the glowing part
    float axis[4];      // xyz = half a tube's length / a panel's first side; w = shape (0 ball, 1 tube, 2 panel)
    float axis2[4];     // xyz = half a panel's second side
  };
  // Mirrors the WGSL structs in looped/shaders/scene.wgsl byte for byte.
  struct FrameUniforms {
    engine::Mat4 viewProj;
    float cameraPos[4];
    float ambient[4];
    float fog[4];
    float clipPlane[4];
    // Reflections (E4.4): x = 1 while capturing (store light, not colour),
    // y = 1 once the cube is ready, z = its last mip level; the room's box and
    // the point it was captured from (reflections are matched to the box).
    float env[4];
    float envMin[4];
    float envMax[4];
    float envCenter[4];
    // New lighting (L1.2): x = glow of self-lit surfaces in cd/m² per unit,
    // y = ambient fill scale, z = 1 / pi (diffuse), w = debug view (?giview=).
    float units[4];
    // Bounced light (L1.5): xyz = probe (0,0,0), w = 1 / spacing;
    // gi2: probes along x, y, z, w = how much bounced light (0 = none yet).
    float gi[4];
    float gi2[4];
    // Light beams (J91.2): a pixel's line of sight; haze per metre, steps,
    // reach (m), frame number.
    engine::Mat4 invViewProj;
    float beams[4];
    float clock[4];  // x = seconds, wrapping every hour (J102: the fire moves by itself)
  };
  // The lights and the light grid: the floor is cut into square cells, and
  // each cell lists the (at most 8) lights that reach it, so a pixel only
  // adds up the lights near it. Written once.
  struct LightingUniforms {
    uint32_t lightCount[4];
    float grid[4];  // x0, z0, 1 / cell size, cells along x
    uint32_t gridSize[4];  // cells along x, cells along z
    GpuLight lights[kMaxLights];
    uint32_t cells[kMaxGridCells][4];  // 16 light indices (bytes), 0xff after the last
  };
  static_assert(sizeof(LightingUniforms) <= 65536, "the lighting block must fit one uniform buffer (64 KB)");
  struct ObjectUniforms {
    engine::Mat4 model;
    float color[4];     // rgb = base color, a = metallic
    float material[4];  // emissive, roughness, texture layer, texture scale
  };
  // Mirrors `struct Mirror` in looped/shaders/mirror.wgsl.
  struct GlassUniforms {
    engine::Mat4 viewProj;
    float center[4];
    float right[4];
    float up[4];
    float params[4];
  };
  // A placed .glb model; `gpu` stays empty until it has finished loading.
  struct ModelDraw {
    std::shared_ptr<engine::GpuModel> gpu;
    engine::Vec3 position;  // for sorting see-through models back to front
    float scale = 1;
    engine::Mat4 world;     // position, rotation and scale (for culling)
    int room = -1;          // the room it's wholly inside (-1 = none)
    std::vector<std::vector<int8_t>> clusterRoom;  // per part, per chunk
  };
  struct DrawItem {
    engine::Mesh mesh;
    uint32_t uniformOffset;
    engine::Aabb bounds;  // world space
    int room = -1;
  };
  // One camera's frame uniforms (the main view, or a mirror's view).
  struct View {
    wgpu::Buffer buffer;
    wgpu::BindGroup bindGroup;
    wgpu::TextureView env;  // the reflection cube it reads (a dummy while capturing)
  };
  struct MirrorTarget {
    wgpu::Texture texture;
    wgpu::TextureView view;
    wgpu::Buffer glassBuffer;
    wgpu::BindGroup glassBindGroup;
    float scale = 0.5f;  // the part of the texture used this frame (sharper when you're close)
  };
  wgpu::Texture mirrorDepth_;  // screen-sized, shared by the mirrors
  wgpu::TextureView mirrorDepthView_;
  wgpu::Sampler mirrorSampler_;
  uint32_t mirrorW_ = 0, mirrorH_ = 0;

  bool createScenePipelines();
  bool createGlassPipeline();
  void createMaterials(const RenderScene& scene, wgpu::TextureView& colorMaps, wgpu::TextureView& bumpMaps,
                       wgpu::Sampler& sampler);
  void resizeMirrorTargets();
  // What one camera can see: its view, and per room the part of it that
  // looks into that room (none = the room is hidden: you're not in it and
  // can't see its doorway).
  struct RoomView {
    engine::Frustum all;
    std::vector<engine::Frustum> room;
    std::vector<bool> roomSeen;
  };
  // `eyeRoom` = the room the camera is in (-1 = between rooms: everything
  // counts). `x0..y1` narrow the view to part of the screen (-1..1).
  RoomView roomView(const engine::Mat4& viewProj, int eyeRoom, float x0 = -1, float x1 = 1, float y0 = -1,
                    float y1 = 1) const;
  bool seen(const RoomView& view, const engine::Aabb& box, int room) const {
    if (room < 0) return view.all.visible(box);
    return view.roomSeen[static_cast<size_t>(room)] && view.room[static_cast<size_t>(room)].visible(box);
  }
  int roomAt(engine::Vec3 p) const;              // -1 = in no room (a doorway)
  int roomOf(const engine::Aabb& box) const;     // -1 = not wholly inside one room
  void assignRooms(ModelDraw& m) const;   // after loading or moving
  // Both skip what the view can't see. `minSize` (mirrors): also skip models
  // smaller than this fraction of their distance (tiny far props).
  void drawItems(const wgpu::RenderPassEncoder& pass, const std::vector<DrawItem>& items, const RoomView& view) const;
  // `skipModel`: leave that model out (a lamp's own, in its shadow);
  // `stillOnly`: only models that never move (shadows drawn once).
  void drawModels(const wgpu::RenderPassEncoder& pass, bool blend, engine::Vec3 eye, const RoomView& view,
                  float minSize = 0, int skipModel = -1, bool stillOnly = false) const;
  std::vector<engine::Aabb> rooms_;
  std::vector<Doorway> doorways_;
  void loadModels(const RenderScene& scene);
  void drawAvatar(const wgpu::RenderPassEncoder& pass, const wgpu::BindGroup& bones) const;
  void drawOthers(const wgpu::RenderPassEncoder& pass, const RoomView& view) const;  // the ones the view can see
  wgpu::BindGroup makeBonesBindGroup(wgpu::Buffer& buffer, const char* label);
  void renderMirror(const wgpu::CommandEncoder& encoder, size_t index, const Mirror& mirror,
                    const engine::Mat4& viewProj, engine::Vec3 eye);

  engine::Gpu* gpu_ = nullptr;
  PostEffects post_;
  bool classic_ = false, eyes_ = true, testLight_ = false;
  size_t mirrorCount_ = 0;
  int mirrorDetail_ = 0;
  wgpu::RenderPipeline pipeline_;          // normal view
  wgpu::RenderPipeline mirroredPipeline_;  // reflected views (triangle winding flips)
  wgpu::RenderPipeline skinnedPipeline_;          // the avatar, first person
  wgpu::RenderPipeline skinnedMirroredPipeline_;  // the avatar, in mirrors
  wgpu::RenderPipeline modelPipeline_, modelMirroredPipeline_;  // loaded .glb models
  wgpu::RenderPipeline modelBlendPipeline_, modelBlendMirroredPipeline_;  // their see-through parts
  wgpu::RenderPipeline glassPipeline_;
  wgpu::BindGroupLayout glassLayout_;
  wgpu::BindGroupLayout frameLayout_, objectLayout_, bonesLayout_, modelLayout_;
  wgpu::Sampler modelSampler_;
  std::vector<ModelDraw> models_;
  size_t modelsLoaded_ = 0;
  std::vector<float> fileProgress_;  // per model file loaded at start, 0..1
  void requestFile(size_t file, bool atStart);
  std::vector<std::vector<size_t>> fileUsers_;  // per file, its placements
  struct StreamRoom {
    int room;
    std::vector<size_t> files;
    bool requested = false;
    size_t done = 0;
  };
  std::vector<StreamRoom> streamRooms_;
  std::vector<int> fileSlot_;  // per file: its place in fileProgress_ (-1 = streamed later)
  double streamStartMs_ = -1;
  std::vector<bool> roomOnScreen_;  // last frame's main view: rooms seen through a doorway
  std::vector<float> modelBaseGlow_, modelHighlight_;  // per placed model
  // The placed models' uniforms as the GPU has them (one kObjectStride slot
  // each, from firstModelOffset_); changes are sent in one write per frame.
  engine::FloorShadows shadows_;
  // The reflection cube (E4.4): six faces, mips for rough surfaces.
  static constexpr uint32_t kEnvSize = 128, kEnvLevels = 6;
  wgpu::Texture envTexture_, envDepth_, envDummy_;
  wgpu::TextureView envView_, envDummyView_, envDepthView_;
  wgpu::Sampler envSampler_;
  View captureViews_[6];
  engine::Vec3 envCenter_;
  engine::Aabb envRoom_;
  bool capturePending_ = false, envReady_ = false;
  void createEnvironment();
  // `shadowPass`: for drawing the lamp shadows themselves (they can't read the
  // maps they draw into: a stand-in is bound instead).
  View makeView(const wgpu::TextureView& env, const char* label, wgpu::Buffer buffer = nullptr, bool shadowPass = false,
                bool mainView = false);  // mainView: reads the soft shade (J91)
  void captureEnvironment(const wgpu::CommandEncoder& encoder);
  std::vector<engine::Vec4> shadowDiscs_;
  std::vector<uint8_t> modelData_;
  std::vector<engine::Vec3> roomsCheckedAt_;  // where each model was when its rooms were worked out
  uint8_t* modelSlot(size_t i) { return modelData_.data() + i * kObjectStrideBytes; }
  const uint8_t* modelSlot(size_t i) const { return modelData_.data() + i * kObjectStrideBytes; }
  // Copies drawn together (J87): each model's per-copy data (the first
  // kCopyBytes of its slot: matrix, tint and own glow, highlight) goes into
  // the instance buffer for every pass that draws it; each pass appends at a
  // fresh place (all of a frame's passes share one command buffer).
  static constexpr size_t kCopyBytes = 96;
  mutable wgpu::Buffer instanceBuffer_;
  mutable size_t instanceCapacity_ = 0, instanceCursor_ = 0;  // in copies
  mutable std::vector<uint8_t> instanceStaging_;
  // Room for `copies` more this frame: the offset (bytes) they start at.
  size_t reserveCopies(size_t copies) const;
  // Real material brightness (L1.4): assets/models/albedo.json, applied to
  // each model as it (or the table) arrives.
  engine::AlbedoTable albedo_;
  void applyAlbedo(size_t file);
  bool roughFix_ = true;
  GiGpu gi_;
  bool giOn_ = true, giWanted_ = false, giLite_ = false;
  int giView_ = 0;
  uint32_t giFrame_ = 0;
  size_t giModelsAtBuild_ = 0;
  double giDirtyMs_ = -1;
  float bounceStrength_ = 1;
  std::vector<std::string> modelFile_;  // per placed model
  std::vector<bool> modelStill_;
  void remakeViews();  // the frame bind groups again (new bounced-light textures)
  size_t filesDone_ = 0;
  size_t filesFailed_ = 0;
  bool criticalFailed_ = false;
  std::vector<std::string> fileNames_;
  std::vector<bool> fileCritical_;  // per file: no bar without it
  wgpu::TextureView colorMaps_, bumpMaps_;
  wgpu::Sampler sampler_;
  std::vector<View> views_;  // [0] = main, [1 + i] = mirror i
  wgpu::Buffer lightingBuffer_;
  void buildLighting();  // the light list and grid for the current lighting (New / Classic)
  GpuLight gpuLightOf(const PointLight& p, float scale) const;
  std::vector<PointLight> lights_;     // as built (the Studio changes them)
  std::vector<float> lightScale_;      // per light: its loop's 1 = as built, 0 = off
  Vec3 lightGridMin_, lightGridMax_;
  int lightsPerPixel_ = 0;
  float emissiveNits_ = 8, ambientNits_ = 14;
  std::vector<float> lightIntensity_;  // per light: the GPU's brightness at scale 1
  std::vector<GpuLight> gpuLights_;    // what the GPU has (setLightScale changes it, flushLights sends it)
  size_t lightsDirtyFrom_ = SIZE_MAX, lightsDirtyTo_ = 0;
  void flushLights();
  // Lamp shadows (J97, docs/plan/jobs/J97.md): kShadowLamps cube maps of
  // kShadowSize² (16-bit depth) in one cube-array texture, drawn
  // kShadowFacesPerFrame faces a frame; a lamp uses its map once all six
  // faces are drawn (GpuLight::params[1] = slot + 1; 0 = none).
  static constexpr uint32_t kShadowLamps = 40, kShadowSize = 256, kShadowFacesPerFrame = 12;
  static constexpr float kShadowNear = 0.1f, kShadowFar = 25.0f;  // matches looped/shaders/scene.wgsl
  wgpu::Texture shadowTex_;
  wgpu::TextureView shadowArrayView_, shadowDummyView_;
  wgpu::Texture shadowDummy_;
  wgpu::Sampler shadowSampler_;
  wgpu::RenderPipeline shadowModelPipeline_, shadowObjectPipeline_;
  View shadowViews_[kShadowFacesPerFrame];
  std::vector<int> shadowSlot_;      // per light: its slot, or -1
  std::vector<int> shadowLight_;     // per slot: its light
  std::vector<bool> shadowReady_;    // per slot: all six faces drawn
  size_t shadowCursor_ = 0;          // the next face to draw (slot * 6 + face)
  bool shadowsOn_ = true, shadowReplan_ = true;
  size_t shadowModels_ = SIZE_MAX;   // models loaded when the shadows were planned
  double shadowDirtyMs_ = -1;        // the layout changed (the Studio): plan again 1.5 s later
  void createShadows();
  void planShadows();                // pick the lamps and start drawing their maps
  void drawShadowFaces(const wgpu::CommandEncoder& encoder);
  void applyShadowSlots();           // which lamps use their maps (GpuLight::params[1])
  // Soft shade (J91): the prepass (half size: depth and directions) and the
  // shade itself; the main view's bind group reads its result.
  ScreenAo ssao_;
  bool aoOn_ = true;
  bool aoBound_ = false;
  LightBeams beams_;
  bool beamsOn_ = true;
  float beamHaze_ = 0, beamScale_ = 1;
  uint32_t beamFrame_ = 0;
  int beamSteps_ = 16;
  wgpu::RenderPipeline beamsPipeline_;  // views_[0] reads the soft shade (else the 1x1 stand-in)
  wgpu::RenderPipeline aoObjectPipeline_, aoModelPipeline_;
  void drawSoftShade(const wgpu::CommandEncoder& encoder, const Mat4& viewProj, Vec3 eye, const RoomView& cull,
                     float strength);
  void writeModelGlow(size_t model);
  wgpu::Buffer objectBuffer_;
  wgpu::BindGroup objectBindGroup_;
  std::vector<DrawItem> sceneDraws_;
  std::vector<ObjectUniforms> objectUniforms_;  // CPU copy of the scene objects
  std::vector<engine::SkinnedMesh> avatarMeshes_;
  bool selfWhole_ = false;
  size_t selfLook_ = 0;
  engine::Mesh boxMesh_;
  uint32_t boxOffset_ = 0;  // first box slot in objectBuffer_
  size_t boxCount_ = 0;
  void drawBoxes(const wgpu::RenderPassEncoder& pass) const;
  void drawSkinned(const wgpu::RenderPassEncoder& pass, const engine::SkinnedMesh& mesh) const;
  uint32_t avatarOffset_ = 0;  // the avatar's slot in objectBuffer_
  wgpu::Buffer bonesBuffer_, firstPersonBonesBuffer_;
  wgpu::BindGroup bonesBindGroup_, firstPersonBonesBindGroup_;
  struct OtherSlot {
    uint32_t offset;  // in objectBuffer_
    wgpu::Buffer bonesBuffer;
    wgpu::BindGroup bonesBindGroup;
    int look = 0;
    engine::Aabb bounds;  // around where they stand (for culling)
  };
  std::vector<OtherSlot> others_;
  size_t othersShown_ = 0;
  FrameUniforms frame_ = {};
  std::vector<MirrorTarget> mirrorTargets_;
  uint32_t targetW_ = 0, targetH_ = 0;
};

}  // namespace engine
