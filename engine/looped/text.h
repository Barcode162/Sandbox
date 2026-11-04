#pragma once
// Draws text with the built-in SDF font, either on the screen (UI, prompts)
// or placed in the 3D world (labels, signs). All text queued in a frame is
// drawn with a single draw call.
//
// Per frame:  begin(viewProj, w, h)  ->  addScreen()/addWorld()...  ->
//             upload()  ->  (inside the render pass) draw(pass)
#include <webgpu/webgpu_cpp.h>

#include <cstdint>
#include <string_view>
#include <vector>

#include "looped/math.h"

namespace engine {

// Colors are 0..1 RGBA in display (sRGB) space.
struct TextStyle {
  Vec4 color{1, 1, 1, 1};
  Vec4 outline{0, 0, 0, 0.85f};  // a = opacity; set to 0 for no outline
  float outlineWidth = 0.6f;     // in font pixels (0..1)
  float align = 0.0f;            // 0 = left, 0.5 = centered, 1 = right
};

class TextRenderer {
 public:
  bool init(const wgpu::Device& device, wgpu::TextureFormat colorFormat, wgpu::TextureFormat depthFormat);

  void begin(const Mat4& viewProj, uint32_t screenW, uint32_t screenH);

  // Screen text. (x, y) is the top of the first line in device pixels
  // (0,0 = top-left); `align` decides whether x is the left edge, center or
  // right edge. `capHeight` is the height of a capital letter in pixels.
  void addScreen(std::string_view text, float x, float y, float capHeight, const TextStyle& style);

  // World text, on a flat plane through `center` (the middle of the text
  // block) spanned by the unit vectors `right` and `up`. `capHeight` is in
  // meters. Use the camera's right/up vectors for a label that faces you.
  void addWorld(std::string_view text, Vec3 center, Vec3 right, Vec3 up, float capHeight,
                const TextStyle& style);

  // A filled rectangle on the screen (device pixels), e.g. for menu panels.
  void addRect(float x, float y, float w, float h, Vec4 color);
  // Any four-cornered shape on the screen (device pixels, corners in order).
  void addScreenQuad(const Vec2 corners[4], Vec4 color);
  // A filled four-cornered shape in the world (e.g. a game drawn on a
  // screen in the bar). Depth-tested like world text.
  void addWorldQuad(const Vec3 corners[4], Vec4 color);

  // A disc or ring (font::Shape) on the screen, centered at (cx, cy) with
  // outer radius `radius` (device pixels). `outline` (a = opacity) draws a
  // halo `outlineWidth` font pixels wide around it (0..1).
  void addShape(int shape, float cx, float cy, float radius, Vec4 color, Vec4 outline = {0, 0, 0, 0},
                float outlineWidth = 0);

  // Width of the widest line and the total height, in font pixels.
  static void measure(std::string_view text, float& width, float& height);

  void upload(const wgpu::Queue& queue);
  void draw(const wgpu::RenderPassEncoder& pass) const;

 private:
  struct Vertex {
    float clip[4];
    float uv[2];
    float outlineWidth;  // font pixels
    uint8_t color[4];
    uint8_t outline[4];
  };
  static_assert(sizeof(Vertex) == 36);

  // Emits glyph quads; `place` maps font-pixel coordinates (x right, y down,
  // relative to the text block's top-left) to clip space.
  void addSolid(const Vec4 clip[4], Vec4 color);
  template <typename Place>
  void addGlyphs(std::string_view text, const TextStyle& style, Place place);

  static constexpr uint32_t kMaxGlyphs = 4096;

  wgpu::RenderPipeline pipeline_;
  wgpu::BindGroupLayout bindLayout_;
  wgpu::BindGroup bindGroup_;
  wgpu::Buffer vertexBuffer_;
  wgpu::Buffer indexBuffer_;
  std::vector<Vertex> vertices_;
  Mat4 viewProj_;
  float screenW_ = 1, screenH_ = 1;
  bool warnedFull_ = false;
};

}  // namespace engine
