#pragma once
// CPU images (no GPU code; looped/texture.h uploads them).
#include <vector>

namespace engine {

// A square RGBA image of floats, in linear color (not gamma-encoded).
struct Image {
  struct Pixel {
    float r = 0, g = 0, b = 0, a = 1;
  };
  int size = 0;
  std::vector<Pixel> pixels;

  explicit Image(int s = 0) : size(s), pixels(static_cast<size_t>(s) * s) {}
  Pixel& at(int x, int y) { return pixels[static_cast<size_t>(y) * size + x]; }
  const Pixel& at(int x, int y) const { return pixels[static_cast<size_t>(y) * size + x]; }
};

}  // namespace engine
