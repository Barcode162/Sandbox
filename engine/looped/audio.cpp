#include "looped/audio.h"

#include <emscripten/emscripten.h>

#include <algorithm>
#include <cstdarg>
#include <cstdio>

#include "looped/bridge.h"

namespace engine {

// Quoted property names keep the Closure compiler from renaming them.
namespace audio {

bool ready() {
  if (bridge::frame().pulledMs > 0) return bridge::frame().audioRunning;  // from the page mailbox
  return EM_ASM_INT({ return window['loopedHost']['audio']['ready']() ? 1 : 0; });
}

// Where your ears are: sent with the frame's mailbox flush.
void setListener(Vec3 p, Vec3 f, Vec3 u) {
  char op[256];
  std::snprintf(op, sizeof(op), "[\"listener\",%.3f,%.3f,%.3f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f]", p.x, p.y, p.z, f.x,
                f.y, f.z, u.x, u.y, u.z);
  bridge::op(op);
}

void setSongPickerRect(float x, float y, float w, float h) {
  EM_ASM({ window['loopedHost']['audio']['setSongPickerRect']($0, $1, $2, $3); }, x, y, w, h);
}

int userSongCount() {
  if (bridge::frame().pulledMs > 0) return bridge::frame().userSongCount;  // from the page mailbox
  return EM_ASM_INT({ return window['loopedHost']['audio']['userSongCount'](); });
}

namespace {
std::string userSongString(int index, bool url) {
  char buffer[1024];
  EM_ASM({
    var a = window['loopedHost']['audio'];
    stringToUTF8($1 ? a['userSongUrl']($0) : a['userSongName']($0), $2, $3);
  }, index, url, buffer, sizeof(buffer));
  return buffer;
}
}  // namespace

std::string userSongName(int index) { return userSongString(index, false); }
std::string userSongUrl(int index) { return userSongString(index, true); }

void setMusicGain(float gain) { EM_ASM({ window['loopedHost']['audio']['setMusicGain']($0); }, gain); }

// The sound clock: read once per frame by the page mailbox, plus the time
// since then (so it's one call per frame however often it's asked).
double now() {
  const bridge::Frame& f = bridge::frame();
  if (f.pulledMs <= 0) return EM_ASM_DOUBLE({ return window['loopedHost']['audio']['now'](); });
  if (f.audioTime <= 0) return 0;  // not unlocked yet
  return f.audioTime + (emscripten_get_now() - f.pulledMs) / 1000.0;  // (engine code: measures elapsed time)
}

void previewPlay(const std::string& url, double offsetSeconds) {
  EM_ASM({ window['loopedHost']['audio']['previewPlay'](UTF8ToString($0), $1); }, url.c_str(), offsetSeconds);
}

void previewStop() { EM_ASM({ window['loopedHost']['audio']['previewStop'](); }); }
}  // namespace audio

void Sound::create(const std::vector<float>& samples, float rate) {
  id_ = EM_ASM_INT({ return window['loopedHost']['audio']['soundCreate'](HEAPF32, $0 >> 2, $1, $2); }, samples.data(),
                   static_cast<int>(samples.size()), rate);
}

void Sound::load(const std::string& url) {
  id_ = EM_ASM_INT({ return window['loopedHost']['audio']['soundLoad'](UTF8ToString($0)); }, url.c_str());
}

bool Sound::loaded() const {
  return id_ >= 0 && EM_ASM_INT({ return window['loopedHost']['audio']['soundReady']($0); }, id_) != 0;
}

namespace {
int g_nextVoice = 0;

// One sound command for the page: sent with the frame's flush.
void command(const char* fmt, ...) __attribute__((format(printf, 1, 2)));
void command(const char* fmt, ...) {
  char op[256];
  va_list args;
  va_start(args, fmt);
  std::vsnprintf(op, sizeof(op), fmt, args);
  va_end(args);
  bridge::op(op);
}

// "seconds from now" → the sound clock, so commands that leave at the end
// of the frame still start exactly when they were meant to.
double at(double when) { return audio::now() + std::max(0.0, when); }
}  // namespace

int Sound::play(float gain, const Vec3* where, double when, float rate, Bus bus, bool loop) const {
  if (id_ < 0 || !audio::ready()) return 0;
  const int voice = ++g_nextVoice;
  const Vec3 p = where ? *where : Vec3{};
  command("[\"sp\",%d,%d,%.4f,%d,%.3f,%.3f,%.3f,%.4f,%.5f,%d,%d,0]", id_, voice, gain, where ? 1 : 0, p.x, p.y, p.z,
          at(when), rate, bus == kPiano ? 1 : 0, loop ? 1 : 0);
  return voice;
}

int Sound::playAt(int emitter, float gain, double when, float rate) const {
  if (id_ < 0 || !audio::ready()) return 0;
  const int voice = ++g_nextVoice;
  command("[\"sp\",%d,%d,%.4f,0,0,0,0,%.4f,%.5f,0,0,%d]", id_, voice, gain, at(when), rate, emitter);
  return voice;
}

void Sound::stop(int voice, double when, float release) {
  if (voice > 0) command("[\"ss\",%d,%.4f,%.4f]", voice, at(when), release);
}

void Sound::set(int voice, float gain, float rate) {
  if (voice > 0) command("[\"sv\",%d,%.4f,%.4f]", voice, gain, rate);
}

namespace audio {
int createEmitter(Vec3 p, bool pianoBus) {
  static int next = 0;
  const int id = ++next;
  command("[\"se\",%d,%.3f,%.3f,%.3f,%d]", id, p.x, p.y, p.z, pianoBus ? 1 : 0);
  return id;
}
}  // namespace audio

void Track::load(const std::string& url) {
  EM_ASM({ window['loopedHost']['audio']['trackLoad'](UTF8ToString($0)); }, url.c_str());
}

Track::State Track::state() {
  return static_cast<State>(EM_ASM_INT({ return window['loopedHost']['audio']['trackState'](); }));
}

std::vector<float> Track::takeSamples(float& rate) {
  const int n = EM_ASM_INT({ return window['loopedHost']['audio']['trackLength'](); });
  rate = static_cast<float>(EM_ASM_DOUBLE({ return window['loopedHost']['audio']['trackRate'](); }));
  std::vector<float> samples(static_cast<size_t>(std::max(n, 0)));
  if (n > 0) {
    EM_ASM({
      var m = window['loopedHost']['audio']['trackTakeMono']();
      if (m) HEAPF32.set(m, $0 >> 2);
    }, samples.data());
  }
  return samples;
}

bool Track::play(double delaySeconds) {
  return EM_ASM_INT({ return window['loopedHost']['audio']['trackPlay']($0) ? 1 : 0; }, delaySeconds) != 0;
}

double Track::time() { return EM_ASM_DOUBLE({ return window['loopedHost']['audio']['trackTime'](); }); }
void Track::tick(double songTime, bool accent) {
  EM_ASM({ window['loopedHost']['audio']['trackTick']($0, $1); }, songTime, accent ? 1 : 0);
}
void Track::loadClicks(double bpm, int beats, double firstSeconds) {
  EM_ASM({ window['loopedHost']['audio']['trackLoadClicks']($0, $1, $2); }, bpm, beats, firstSeconds);
}
double Track::timeAt(double ms) {
  return EM_ASM_DOUBLE({ return window['loopedHost']['audio']['trackTime']($0); }, ms);
}
double Track::duration() { return EM_ASM_DOUBLE({ return window['loopedHost']['audio']['trackDuration'](); }); }
void Track::stop() { EM_ASM({ window['loopedHost']['audio']['trackStop'](); }); }

void MusicSource::init(float refDistance) {
  id_ = EM_ASM_INT({ return window['loopedHost']['audio']['createSource']($0); }, refDistance);
}

void MusicSource::play(const std::string& url, double offsetSeconds) {
  EM_ASM({ window['loopedHost']['audio']['play']($0, UTF8ToString($1), $2); }, id_, url.c_str(), offsetSeconds);
}

void MusicSource::pause() { EM_ASM({ window['loopedHost']['audio']['pause']($0); }, id_); }

void MusicSource::resume() { EM_ASM({ window['loopedHost']['audio']['resume']($0); }, id_); }

bool MusicSource::playing() const {
  return EM_ASM_INT({ return window['loopedHost']['audio']['playing']($0) ? 1 : 0; }, id_);
}

bool MusicSource::finished() const {
  return EM_ASM_INT({ return window['loopedHost']['audio']['finished']($0) ? 1 : 0; }, id_);
}

double MusicSource::time() const {
  return id_ >= 0 && id_ < 2 ? bridge::frame().musicTime[id_] : -1;
}

void MusicSource::setPosition(Vec3 p) {
  EM_ASM({ window['loopedHost']['audio']['setPosition']($0, $1, $2, $3); }, id_, p.x, p.y, p.z);
}

}  // namespace engine
