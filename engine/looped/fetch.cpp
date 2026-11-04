#include "looped/fetch.h"

#include <emscripten/emscripten.h>
#include <emscripten/eventloop.h>

#include <algorithm>
#include <cstdint>
#include <cstdlib>
#include <string>
#include <map>

#include "looped/log.h"

namespace engine {
namespace {

using FetchDone = std::function<void(bool, std::vector<uint8_t>)>;
using FetchProgress = std::function<void(float)>;
using DecodeDone = std::function<void(bool, Rgba8Image)>;

struct Download {
  FetchDone done;
  FetchProgress progress;
  std::string url;
  int attempt = 0;  // retries so far
  std::vector<uint8_t> bytes;  // filled by JavaScript in place (no extra copy)
  bool optional = false;  // fetchOptional: no retries, a miss isn't an error
};
constexpr int kRetries = 3;
constexpr double kRetryDelayMs[kRetries] = {500, 1500, 4000};

std::map<int, Download>& pendingDownloads() {
  static std::map<int, Download> pending;
  return pending;
}

std::map<int, DecodeDone>& pendingDecodes() {
  static std::map<int, DecodeDone> pending;
  return pending;
}

}  // namespace

// Called from JavaScript as a download comes in (fraction 0..1).
extern "C" EMSCRIPTEN_KEEPALIVE void engine_fetchProgress(int id, float fraction) {
  auto& pending = pendingDownloads();
  const auto it = pending.find(id);
  if (it != pending.end() && it->second.progress) it->second.progress(std::min(fraction, 1.0f));
}

// fetch() with progress. Files that are gzipped (they start with 1f 8b) are
// unpacked with the browser's DecompressionStream; if the server already
// unpacked them (Content-Encoding: gzip), they arrive ready to use.
EM_JS(void, js_fetch, (int id, const char* urlPtr), {
  var url = UTF8ToString(urlPtr);
  fetch(url).then(function(resp) {
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var total = +(resp.headers.get('Content-Length') || 0);
    var reader = resp.body.getReader();
    var chunks = [];
    var got = 0;
    function pump() {
      return reader.read().then(function(r) {
        if (r.done) return;
        chunks.push(r.value);
        got += r.value.length;
        if (total > 0) _engine_fetchProgress(id, got / total);
        return pump();
      });
    }
    return pump().then(function() {
      var bytes = new Uint8Array(got);
      var o = 0;
      for (var i = 0; i < chunks.length; i++) { bytes.set(chunks[i], o); o += chunks[i].length; }
      if (bytes.length > 2 && bytes[0] == 0x1f && bytes[1] == 0x8b) {
        var ds = new window['DecompressionStream']('gzip');
        var stream = new Blob([bytes])['stream']()['pipeThrough'](ds);
        return new Response(stream).arrayBuffer().then(function(b) { return new Uint8Array(b); });
      }
      return bytes;
    });
  }).then(function(bytes) {
    var ptr = _engine_fetchBuffer(id, bytes.length);  // C++ owns the memory
    if (!ptr && bytes.length) throw new Error('no buffer');
    HEAPU8.set(bytes, ptr);
    // A local file link (blob:) is read once and kept by the caller: free it.
    if (url.indexOf('blob:') === 0) URL.revokeObjectURL(url);
    _engine_fetchDone(id, ptr, bytes.length);
  }).catch(function(e) {
    _engine_fetchDone(id, 0, -1);  // C++ retries and reports
  });
});

// Called from JavaScript before it copies a finished download in: the
// bytes go straight into the vector the caller will get.
extern "C" EMSCRIPTEN_KEEPALIVE uint8_t* engine_fetchBuffer(int id, int size) {
  auto& pending = pendingDownloads();
  const auto it = pending.find(id);
  if (it == pending.end() || size < 0) return nullptr;
  it->second.bytes.resize(static_cast<size_t>(std::max(size, 1)));
  return it->second.bytes.data();
}

// Called from JavaScript when a download has finished (size < 0 = failed).
extern "C" EMSCRIPTEN_KEEPALIVE void engine_fetchDone(int id, uint8_t* data, int size) {
  auto& pending = pendingDownloads();
  const auto it = pending.find(id);
  if (it == pending.end()) return;
  if (size < 0) {
    Download& d = it->second;
    if (d.optional) {
      LOG_INFO("Download: %s isn't there (fine: it's optional).", d.url.c_str());
      Download missed = std::move(d);
      pending.erase(it);
      missed.done(false, {});
      return;
    }
    if (d.attempt < kRetries) {  // the network hiccuped: try again a bit later
      LOG_WARN("Download: %s failed, retrying (%d of %d).", d.url.c_str(), d.attempt + 1, kRetries);
      emscripten_set_timeout([](void* p) {
        const int retryId = static_cast<int>(reinterpret_cast<intptr_t>(p));
        auto& all = pendingDownloads();
        const auto found = all.find(retryId);
        if (found == all.end()) return;
        js_fetch(retryId, found->second.url.c_str());
      }, kRetryDelayMs[d.attempt], reinterpret_cast<void*>(static_cast<intptr_t>(id)));
      ++d.attempt;
      return;
    }
    LOG_ERROR("Download: %s failed after %d tries.", d.url.c_str(), kRetries + 1);
    Download failed = std::move(d);
    pending.erase(it);
    failed.done(false, {});
    return;
  }
  Download d = std::move(it->second);
  pending.erase(it);
  (void)data;
  std::vector<uint8_t> bytes = std::move(d.bytes);
  bytes.resize(static_cast<size_t>(size));
  if (d.progress) d.progress(1.0f);
  d.done(true, std::move(bytes));
}


// Called from JavaScript when an image has been decoded (pixels = 0 on failure).
extern "C" EMSCRIPTEN_KEEPALIVE void engine_imageDecoded(int id, uint8_t* pixels, int width, int height) {
  auto& pending = pendingDecodes();
  const auto it = pending.find(id);
  if (it == pending.end()) return;
  DecodeDone done = std::move(it->second);
  pending.erase(it);
  Rgba8Image image;
  if (pixels) {
    image.width = width;
    image.height = height;
    image.pixels.assign(pixels, pixels + static_cast<size_t>(width) * height * 4);
    free(pixels);
  }
  done(pixels != nullptr, std::move(image));
}

// createImageBitmap + a 2D canvas give raw RGBA pixels; they're copied into
// WebAssembly memory and handed back to C++.
EM_JS(void, js_decodeImage, (int id, const uint8_t* data, int size, const char* mime), {
  var bytes = HEAPU8.slice(data, data + size);
  var blob = new Blob([bytes], {type: UTF8ToString(mime)});
  createImageBitmap(blob, {colorSpaceConversion: 'none', premultiplyAlpha: 'none'}).then(function(bitmap) {
    var canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(bitmap.width, bitmap.height)
                                                        : document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    var ctx = canvas.getContext('2d', {colorSpace: 'srgb', willReadFrequently: true});
    ctx.drawImage(bitmap, 0, 0);
    var pixels = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
    var ptr = _malloc(pixels.length);
    HEAPU8.set(pixels, ptr);
    _engine_imageDecoded(id, ptr, bitmap.width, bitmap.height);
  }).catch(function(e) {
    err('Image decode failed: ' + e);
    _engine_imageDecoded(id, 0, 0, 0);
  });
});

void fetchFile(const std::string& url, FetchDone done, FetchProgress progress) {
  static int nextId = 1;
  const int id = nextId++;
  pendingDownloads()[id] = {std::move(done), std::move(progress), url, 0, {}};
  js_fetch(id, url.c_str());
}

void fetchOptional(const std::string& url, FetchDone done) {
  static int nextId = -1;  // its own ids (negative): never the same as fetchFile's
  const int id = nextId--;
  Download d{std::move(done), nullptr, url, 0, {}};
  d.optional = true;
  pendingDownloads()[id] = std::move(d);
  js_fetch(id, url.c_str());
}

void decodeImage(const std::vector<uint8_t>& bytes, const std::string& mimeType, DecodeDone done) {
  static int nextId = 1;
  const int id = nextId++;
  pendingDecodes()[id] = std::move(done);
  js_decodeImage(id, bytes.data(), static_cast<int>(bytes.size()), mimeType.c_str());
}

}  // namespace engine
