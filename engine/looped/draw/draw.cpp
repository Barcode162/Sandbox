// The drawing piece (J116.4): choosing the backend. See draw.h.
#include "looped/draw/draw.h"

#include <emscripten/emscripten.h>

namespace engine::draw {

std::unique_ptr<Device> createGl(const char* canvas);
void createWebGpu(const char* canvas, std::function<void(std::unique_ptr<Device>)> ready);

namespace {
EM_JS(int, js_hasWebGpu, (), { return (typeof navigator !== 'undefined' && navigator['gpu']) ? 1 : 0; });
}

const char* backendName(Backend b) {
  switch (b) {
    case Backend::kWebGpu: return "WebGPU";
    case Backend::kWebGl2: return "WebGL2";
    default: return "none";
  }
}

void create(const char* canvas, bool forceGl, std::function<void(std::unique_ptr<Device>)> ready) {
  std::string c = canvas;
  if (!forceGl && js_hasWebGpu()) {
    createWebGpu(canvas, [c, ready](std::unique_ptr<Device> d) {
      if (d) return ready(std::move(d));
      ready(createGl(c.c_str()));  // WebGPU said no: WebGL2
    });
    return;
  }
  ready(createGl(canvas));
}

}  // namespace engine::draw
