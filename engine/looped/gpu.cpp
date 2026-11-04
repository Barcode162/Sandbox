#include "looped/gpu.h"

#include <emscripten/emscripten.h>
#include <emscripten/html5.h>

#include <algorithm>
#include <cmath>
#include <map>
#include <string>
#include <string_view>

#include "looped/bridge.h"
#include "looped/log.h"

// ?astc=0 turns compressed textures off (to test the PNG/JPEG path).
EM_JS(int, js_astcDisabled, (), { return /[?&]astc=0(&|$)/.test(window['location']['search']) ? 1 : 0; });

namespace engine {
namespace {

// Rendering at the phone's full 3x density costs a lot of GPU time for
// little visible gain, so cap it.
constexpr double kMaxPixelRatio = 2.0;

std::string toString(wgpu::StringView s) {
  if (!s.data) return {};
  return std::string(std::string_view(s));
}

}  // namespace

void Gpu::init(const char* canvasSelector, std::function<void(bool)> onReady) {
  canvasSelector_ = canvasSelector;
  onReady_ = std::move(onReady);

  instance_ = wgpu::CreateInstance(nullptr);
  if (!instance_) {
    LOG_ERROR("WebGPU is not available in this browser.");
    onReady_(false);
    return;
  }

  wgpu::EmscriptenSurfaceSourceCanvasHTMLSelector canvasSource;
  canvasSource.selector = canvasSelector_.c_str();
  wgpu::SurfaceDescriptor surfaceDesc;
  surfaceDesc.nextInChain = &canvasSource;
  surface_ = instance_.CreateSurface(&surfaceDesc);

  wgpu::RequestAdapterOptions options;
  options.powerPreference = wgpu::PowerPreference::HighPerformance;
  instance_.RequestAdapter(
      &options, wgpu::CallbackMode::AllowSpontaneous,
      [this](wgpu::RequestAdapterStatus status, wgpu::Adapter adapter, wgpu::StringView message) {
        if (status != wgpu::RequestAdapterStatus::Success) {
          LOG_ERROR("No GPU adapter: %s", toString(message).c_str());
          onReady_(false);
          return;
        }
        onAdapter(std::move(adapter));
      });
}

void Gpu::onAdapter(wgpu::Adapter adapter) {
  adapter_ = std::move(adapter);

  wgpu::AdapterInfo info;
  adapter_.GetInfo(&info);
  LOG_INFO("GPU: %s %s", toString(info.vendor).c_str(), toString(info.architecture).c_str());
  software = toString(info.architecture).find("swiftshader") != std::string::npos ||
             toString(info.device).find("SwiftShader") != std::string::npos;

  wgpu::DeviceDescriptor desc;
  desc.label = "main device";
  // Compressed textures: 4-16x less GPU memory than plain RGBA.
  static const wgpu::FeatureName kAstc = wgpu::FeatureName::TextureCompressionASTC;
  astc = adapter_.HasFeature(kAstc) && !js_astcDisabled();
  if (astc) {
    desc.requiredFeatureCount = 1;
    desc.requiredFeatures = &kAstc;
  }
  LOG_INFO("GPU: compressed textures (ASTC) %s.", astc ? "on" : "off");
  desc.SetUncapturedErrorCallback(
      [](const wgpu::Device&, wgpu::ErrorType type, wgpu::StringView message) {
        // The same error often repeats every frame: log each one 3 times,
        // then every 100th time with a count, so the log can't flood.
        static std::map<std::string, int> seen;
        const std::string text = toString(message);
        int& count = seen[text.substr(0, 200)];
        ++count;
        if (count <= 3 || count % 100 == 0) {
          LOG_ERROR("GPU error (%d)%s: %s", static_cast<int>(type),
                    count > 3 ? (" x" + std::to_string(count)).c_str() : "", text.c_str());
        }
      });
  desc.SetDeviceLostCallback(
      wgpu::CallbackMode::AllowSpontaneous,
      [](const wgpu::Device&, wgpu::DeviceLostReason reason, wgpu::StringView message) {
        if (reason == wgpu::DeviceLostReason::Destroyed) return;
        LOG_FATAL("GPU device lost (%d): %s", static_cast<int>(reason), toString(message).c_str());
      });

  adapter_.RequestDevice(
      &desc, wgpu::CallbackMode::AllowSpontaneous,
      [this](wgpu::RequestDeviceStatus status, wgpu::Device device, wgpu::StringView message) {
        if (status != wgpu::RequestDeviceStatus::Success) {
          LOG_ERROR("Could not create GPU device: %s", toString(message).c_str());
          onReady_(false);
          return;
        }
        onDevice(std::move(device));
      });
}

void Gpu::onDevice(wgpu::Device dev) {
  device = std::move(dev);
  queue = device.GetQueue();

  wgpu::SurfaceCapabilities caps;
  surface_.GetCapabilities(adapter_, &caps);
  surfaceFormat = caps.formatCount > 0 ? caps.formats[0] : wgpu::TextureFormat::BGRA8Unorm;

  resizeIfNeeded();
  LOG_INFO("WebGPU ready. Surface format %d.", static_cast<int>(surfaceFormat));
  onReady_(true);
}

void Gpu::resizeIfNeeded() {
  // The size comes from the page mailbox (a ResizeObserver; nothing is
  // measured in the frame). Before the mailbox exists (start-up), measure once.
  const bridge::Frame& f = bridge::frame();
  double cssW = f.cssW, cssH = f.cssH, dpr = f.dpr;
  if (cssW <= 0 || cssH <= 0) {
    emscripten_get_element_css_size(canvasSelector_.c_str(), &cssW, &cssH);
    dpr = emscripten_get_device_pixel_ratio();
  }
  cssWidth = cssW;
  cssHeight = cssH;
  const double ratio = std::min(dpr, std::min(resolutionCap, kMaxPixelRatio));
  const auto w = static_cast<uint32_t>(std::max(1.0, std::round(cssW * ratio)));
  const auto h = static_cast<uint32_t>(std::max(1.0, std::round(cssH * ratio)));
  if (w == width && h == height) {
    pendingW_ = 0;
    return;
  }
  // While the phone rotates the size changes several times: wait until it
  // has been the same for 120 ms, then reconfigure once (the first time at once).
  const double now = emscripten_get_now();
  if (width != 0 && (w != pendingW_ || h != pendingH_)) {
    pendingW_ = w;
    pendingH_ = h;
    pendingSinceMs_ = now;
    return;
  }
  if (width != 0 && now - pendingSinceMs_ < 120) return;
  pendingW_ = 0;

  if (width != 0) LOG_INFO("Canvas resized to %ux%u.", w, h);
  width = w;
  height = h;
  pixelRatio = static_cast<float>(ratio);
  emscripten_set_canvas_element_size(canvasSelector_.c_str(), static_cast<int>(w), static_cast<int>(h));
  configureSurface();
}

void Gpu::configureSurface() {
  wgpu::SurfaceConfiguration config;
  config.device = device;
  config.format = surfaceFormat;
  config.width = width;
  config.height = height;
  config.alphaMode = wgpu::CompositeAlphaMode::Opaque;
  config.presentMode = wgpu::PresentMode::Fifo;
  surface_.Configure(&config);

  wgpu::TextureDescriptor depthDesc;
  depthDesc.label = "depth";
  depthDesc.size = {width, height, 1};
  depthDesc.format = kDepthFormat;
  depthDesc.usage = wgpu::TextureUsage::RenderAttachment;
  depthView = device.CreateTexture(&depthDesc).CreateView();
}

bool Gpu::mayDraw(double nowMs) {
  if (maxFps > 0 && nowMs - lastDrawMs_ < 1000.0 / maxFps - 1.0) return false;
  if (inFlight_ >= maxFramesInFlight && !noWait_) {
    // A slow GPU (software drawing, a big upload) is waited for, however
    // long. Only a GPU that has never once said "done" in 20 s is taken for
    // one whose answers don't come, and then drawing stops waiting for good,
    // so the picture can never freeze.
    if (doneCount_ > 0 || nowMs - lastDoneMs_ < 20000) return false;
    LOG_INFO("GPU: no frame has ever said it finished (20 s); drawing without waiting for the GPU.");
    noWait_ = true;
  }
  lastDrawMs_ = nowMs;
  return true;
}

void Gpu::endFrame() {
  if (inFlight_ == 0) lastDoneMs_ = emscripten_get_now();  // the wait starts now
  ++inFlight_;
  queue.OnSubmittedWorkDone(wgpu::CallbackMode::AllowSpontaneous, [this](wgpu::QueueWorkDoneStatus, wgpu::StringView) {
    if (inFlight_ > 0) --inFlight_;
    ++doneCount_;
    lastDoneMs_ = emscripten_get_now();
  });
}

wgpu::TextureView Gpu::beginFrame() {
  wgpu::SurfaceTexture surfaceTexture;
  surface_.GetCurrentTexture(&surfaceTexture);
  if (surfaceTexture.status == wgpu::SurfaceGetCurrentTextureStatus::Outdated ||
      surfaceTexture.status == wgpu::SurfaceGetCurrentTextureStatus::Lost) {
    configureSurface();  // e.g. after the page was in the background: try again next frame
    return nullptr;
  }
  if (surfaceTexture.status != wgpu::SurfaceGetCurrentTextureStatus::SuccessOptimal &&
      surfaceTexture.status != wgpu::SurfaceGetCurrentTextureStatus::SuccessSuboptimal) {
    return nullptr;
  }
  return surfaceTexture.texture.CreateView();
}

}  // namespace engine
