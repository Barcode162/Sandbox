#pragma once
// Sound, through the browser's Web Audio API (the small bridge lives in
// bar/web/audio.js). Phones only allow sound after the user's first tap; the
// bridge handles that automatically.
#include <string>
#include <vector>

#include "looped/math.h"

namespace engine {

namespace audio {
// True once sound is unlocked (after the first tap/click/key).
bool ready();
// Where your "ears" are: call every frame with the camera.
void setListener(Vec3 position, Vec3 forward, Vec3 up);

// Songs the user picked from their phone (Files app). Local only.
// Places the invisible native "pick a file" button over a drawn button
// (CSS pixels); pass w = 0 to hide it.
void setSongPickerRect(float x, float y, float w, float h);
int userSongCount();
std::string userSongName(int index);
std::string userSongUrl(int index);

// Turns all music sources (the jukebox) up or down, 0..1.
void setMusicGain(float gain);
// A song's preview (the rhythm game's song select): streamed, looping,
// faded in from `offsetSeconds`; another call cross-fades to the new one.
void previewPlay(const std::string& url, double offsetSeconds);
void previewStop();

// The sound clock (seconds), for scheduling notes ahead of time.
double now();

// A fixed place sounds come from, with full 3D (HRTF) sound, made once and
// shared by every sound played there (the piano's notes). Other placed
// sounds get a cheaper panner each. Returns an emitter id (> 0).
int createEmitter(Vec3 position, bool pianoBus);

// At most this many sounds play at once; a new one replaces the oldest.
constexpr int kMaxVoices = 32;
}  // namespace audio

// A short sound made in code (looped/synth.h), kept in the browser and
// played as often as needed. Each play is a "voice" that can be stopped.
// Plays, stops and changes are commands sent with the frame's page mailbox
// (one call per frame, not one per sound). A Sound is just an id: copy it
// freely.
class Sound {
 public:
  enum Bus { kEffects, kPiano };
  void create(const std::vector<float>& samples, float rate);
  // A recorded sound from a file (J100): fetched at once, playable once
  // decoded (after the first tap); plays before that are silent.
  void load(const std::string& url);
  bool loaded() const;
  bool valid() const { return id_ >= 0; }
  // `when` = seconds from now. `where` = place it in 3D (nullptr = everywhere).
  // Returns a voice id (0 if sound isn't unlocked yet).
  int play(float gain, const Vec3* where = nullptr, double when = 0, float rate = 1, Bus bus = kEffects,
           bool loop = false) const;
  // The same, from an emitter (audio::createEmitter).
  int playAt(int emitter, float gain, double when = 0, float rate = 1) const;
  static void stop(int voice, double when = 0, float release = 0.08f);
  static void set(int voice, float gain, float rate);  // e.g. engine revs

 private:
  int id_ = -1;
};

// A whole song decoded into memory, for when timing must be exact (the
// rhythm game): it plays with sample accuracy and reports where it is.
// One at a time; loading a new one replaces the old.
class Track {
 public:
  enum class State { kNone, kLoading, kReady, kFailed };
  static void load(const std::string& url);
  // A click track instead (sync tools): `beats` clicks at `bpm`, the first
  // at `firstSeconds`; ready at once.
  static void loadClicks(double bpm, int beats, double firstSeconds);
  static State state();
  // The song as mono samples (call once when ready; the copy is freed in
  // the browser afterwards). `rate` = samples per second.
  static std::vector<float> takeSamples(float& rate);
  static bool play(double delaySeconds);  // false if sound isn't unlocked yet
  static double time();       // seconds into the song as heard (< 0 before it starts)
  // The same at page time `ms` (the frame's time, a touch's time): one smooth
  // clock for the picture and the taps (J117.2).
  static double timeAt(double ms);
  static double duration();
  // A short tick at a song time, scheduled on the song's clock (checking a
  // chart's timing by ear).
  static void tick(double songTime, bool accent);
  static void stop();
};

// Long music placed in 3D space: you hear it from its position, louder when
// close, panned left/right as you turn. Streams, so songs can be long.
class MusicSource {
 public:
  // refDistance: within this many meters it plays at full volume.
  void init(float refDistance);
  // Starts `url`, `offsetSeconds` into it.
  void play(const std::string& url, double offsetSeconds = 0);
  void pause();
  void resume();
  bool playing() const;
  bool finished() const;  // reached the end of the song
  // Seconds into the song as heard (from the page each frame; -1 = not
  // playing, or not one of the first two sources).
  double time() const;
  void setPosition(Vec3 position);

 private:
  int id_ = -1;
};

}  // namespace engine
