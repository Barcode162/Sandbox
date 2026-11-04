#pragma once
// Owns the WebGPU connection: instance, adapter, device and the canvas
// surface. Setup is asynchronous in the browser, so init() takes a callback
// that runs once the device is ready.
#include <webgpu/webgpu_cpp.h>

#include <cstdint>
#include <functional>
#include <string>

namespace engine {

class Gpu {
 public:
  // canvasSelector is a CSS selector, e.g. "#canvas".
  void init(const char* canvasSelector, std::function<void(bool ok)> onReady);

  // Matches the drawing buffer to the canvas's on-screen size. Call every
  // frame; it only reconfigures when the size actually changed.
  void resizeIfNeeded();

  // Whether to draw this frame at all. False while the GPU still has
  // maxFramesInFlight frames to finish (work never piles up behind a slow
  // GPU: a hot phone, or a test machine drawing in software, where a backlog
  // made every screenshot wait minutes), or when `maxFps` says it's too soon.
  // The game's logic runs every frame either way; only the drawing waits.
  bool mayDraw(double nowMs);
  // Returns the texture to draw into this frame, or nullptr if unavailable.
  wgpu::TextureView beginFrame();
  // After the frame's last submit: counts it until the GPU has finished it.
  void endFrame();
  // How many drawn frames may wait for the GPU at once: more keeps the GPU
  // busy, fewer shows a touch sooner (each waiting frame is ~17 ms later).
  int maxFramesInFlight = 2;
  int framesInFlight() const { return inFlight_; }
  // At most this many drawn frames a second (0 = as many as the screen
  // shows). The tests set it with ?fps= (bar/test_hooks.h).
  double maxFps = 0;

  wgpu::Device device;
  wgpu::Queue queue;
  wgpu::TextureFormat surfaceFormat = wgpu::TextureFormat::Undefined;
  static constexpr wgpu::TextureFormat kDepthFormat = wgpu::TextureFormat::Depth24Plus;
  // The scene draws linear light here (L1.1); looped/post.h turns it into
  // display colours.
  static constexpr wgpu::TextureFormat kSceneFormat = wgpu::TextureFormat::RGBA16Float;
  // Depth buffer matching the screen size; recreated on resize.
  wgpu::TextureView depthView;
  uint32_t width = 0;
  uint32_t height = 0;
  float pixelRatio = 1.0f;
  // Picture quality (looped/quality.h): at most this many device pixels per
  // CSS pixel (never above 2). Changing it resizes the canvas next frame.
  double resolutionCap = 2.0;
  // The GPU reads ASTC compressed textures (Apple GPUs: iPhone, Mac). Off
  // with ?astc=0 (tests the plain PNG/JPEG path).
  bool astc = false;
  // A software GPU (SwiftShader: the tests' headless browser). Heavy GPU
  // work (bounced light) goes lighter there; phones never are.
  bool software = false;
  double cssWidth = 0, cssHeight = 0;
  uint32_t pendingW_ = 0, pendingH_ = 0;  // a new size waiting to settle
  double pendingSinceMs_ = 0;  // the canvas in CSS pixels (measured once per frame)

 private:
  void onAdapter(wgpu::Adapter adapter);
  void onDevice(wgpu::Device device);
  void configureSurface();

  int inFlight_ = 0;
  double lastDrawMs_ = -1e9;
  double lastDoneMs_ = 0;  // when the GPU last finished a frame (or the first wait began)
  bool noWait_ = false;  // the GPU never says "done": don't wait for it
  uint64_t doneCount_ = 0;  // frames the GPU said it finished (its answers work)
  std::string canvasSelector_;
  std::function<void(bool)> onReady_;
  wgpu::Instance instance_;
  wgpu::Adapter adapter_;
  wgpu::Surface surface_;
};

}  // namespace engine
