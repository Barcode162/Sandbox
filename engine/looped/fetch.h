#pragma once
// Asynchronous downloads and image decoding through the browser.
// Like Web Audio for sound, the browser is the "driver" here: it downloads
// files and decodes PNG/JPEG with the phone's built-in decoders.
#include <cstdint>
#include <functional>
#include <string>
#include <vector>

namespace engine {

// Downloads `url` (relative to the page). `done` gets the bytes, or
// ok = false if the download failed. `progress` (optional) hears how far
// along it is, 0..1, while it downloads (only if the server says the size).
void fetchFile(const std::string& url, std::function<void(bool ok, std::vector<uint8_t> bytes)> done,
               std::function<void(float fraction)> progress = nullptr);

// Like fetchFile, for a file that may well not be there (another site's
// optional settings): one try, and a miss is no error, just ok = false.
void fetchOptional(const std::string& url, std::function<void(bool ok, std::vector<uint8_t> bytes)> done);

// An 8-bit RGBA image, rows top to bottom.
struct Rgba8Image {
  int width = 0, height = 0;
  std::vector<uint8_t> pixels;
};

// Decodes PNG/JPEG bytes. Colors come back exactly as stored (no color
// management), so normal maps and roughness maps stay correct.
void decodeImage(const std::vector<uint8_t>& bytes, const std::string& mimeType,
                 std::function<void(bool ok, Rgba8Image image)> done);

}  // namespace engine
