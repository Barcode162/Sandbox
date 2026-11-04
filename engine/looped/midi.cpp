#include "looped/midi.h"

#include <algorithm>
#include <map>

namespace engine::midi {
namespace {

struct Reader {
  const std::vector<uint8_t>& b;
  size_t at = 0;
  size_t end = 0;
  bool ok() const { return at <= end && end <= b.size(); }
  uint8_t u8() { return at < end ? b[at++] : (at = end + 1, 0); }
  uint32_t be(int n) {
    uint32_t v = 0;
    for (int i = 0; i < n; ++i) v = (v << 8) | u8();
    return v;
  }
  uint32_t varLen() {
    uint32_t v = 0;
    for (int i = 0; i < 4; ++i) {
      const uint8_t c = u8();
      v = (v << 7) | (c & 0x7f);
      if (!(c & 0x80)) break;
    }
    return v;
  }
};

// One event on the shared tick timeline.
struct Event {
  uint64_t tick;
  int kind;  // 0 note off, 1 note on, 2 pedal, 3 tempo
  int channel, key, value;
  uint32_t tempo;
};

}  // namespace

bool parse(const std::vector<uint8_t>& bytes, Song& song) {
  song = {};
  Reader r{bytes, 0, bytes.size()};
  if (bytes.size() < 14 || r.be(4) != 0x4d546864) return false;  // "MThd"
  const uint32_t headerLen = r.be(4);
  const int format = static_cast<int>(r.be(2));
  const int tracks = static_cast<int>(r.be(2));
  const int division = static_cast<int>(r.be(2));
  r.at = 8 + headerLen;
  if (format > 1 || (division & 0x8000) || division <= 0) return false;  // SMPTE timing isn't used by songs

  std::vector<Event> events;
  for (int t = 0; t < tracks && r.at + 8 <= bytes.size(); ++t) {
    const uint32_t id = r.be(4), len = r.be(4);
    const size_t trackEnd = std::min(bytes.size(), r.at + len);
    if (id != 0x4d54726b) {  // not "MTrk": skip it
      r.at = trackEnd;
      continue;
    }
    Reader tr{bytes, r.at, trackEnd};
    uint64_t tick = 0;
    int running = 0;
    while (tr.at < trackEnd) {
      tick += tr.varLen();
      int status = tr.u8();
      if (status < 0x80) {  // running status: reuse the last one
        --tr.at;
        status = running;
      } else if (status < 0xf0) {
        running = status;
      }
      const int type = status & 0xf0, ch = status & 0x0f;
      if (status == 0xff) {
        const int meta = tr.u8();
        const uint32_t n = tr.varLen();
        const size_t start = tr.at;
        if (meta == 0x51 && n == 3) events.push_back({tick, 3, 0, 0, 0, tr.be(3)});
        if (meta == 0x03 && song.title.empty() && n > 0) {
          for (uint32_t i = 0; i < n && start + i < trackEnd; ++i) {
            const char c = static_cast<char>(bytes[start + i]);
            if (c >= 32 && c < 127) song.title += c;
          }
        }
        tr.at = start + n;
      } else if (status == 0xf0 || status == 0xf7) {
        tr.at += tr.varLen();
      } else if (type == 0x80 || type == 0x90) {
        const int key = tr.u8(), vel = tr.u8();
        const bool on = type == 0x90 && vel > 0;
        if (ch != 9) events.push_back({tick, on ? 1 : 0, ch, key, vel, 0});  // channel 10 = drums
      } else if (type == 0xb0) {
        const int cc = tr.u8(), v = tr.u8();
        if (cc == 64) events.push_back({tick, 2, ch, 0, v, 0});
      } else if (type == 0xc0 || type == 0xd0) {
        tr.u8();
      } else if (type == 0xa0 || type == 0xe0) {
        tr.u8();
        tr.u8();
      } else {
        break;  // unknown byte: stop reading this track
      }
      if (!tr.ok()) break;
    }
    r.at = trackEnd;
  }
  if (events.empty()) return false;
  std::stable_sort(events.begin(), events.end(), [](const Event& a, const Event& b) {
    if (a.tick != b.tick) return a.tick < b.tick;
    return a.kind == 3 && b.kind != 3;  // tempo first, so it applies at its tick
  });

  // Walk the timeline: ticks -> seconds through the tempo map.
  double seconds = 0;
  uint64_t lastTick = 0;
  double secondsPerTick = 0.5 / division;  // 120 BPM until told otherwise
  std::map<int, std::vector<size_t>> down;  // (channel, key) -> open notes
  bool pedal[16] = {};
  std::vector<size_t> pedalHeld[16];  // notes released while the pedal was down
  for (const Event& e : events) {
    seconds += static_cast<double>(e.tick - lastTick) * secondsPerTick;
    lastTick = e.tick;
    const int slot = e.channel * 128 + e.key;
    if (e.kind == 3) {
      secondsPerTick = e.tempo / 1e6 / division;
    } else if (e.kind == 1) {
      // Re-striking a key ends the previous one.
      for (size_t i : down[slot]) song.notes[i].length = seconds - song.notes[i].start;
      down[slot].clear();
      down[slot].push_back(song.notes.size());
      song.notes.push_back({seconds, -1, e.key, static_cast<float>(e.value) / 127.0f, e.channel});
    } else if (e.kind == 0) {
      for (size_t i : down[slot]) {
        if (pedal[e.channel]) pedalHeld[e.channel].push_back(i);
        else song.notes[i].length = seconds - song.notes[i].start;
      }
      down[slot].clear();
    } else if (e.kind == 2) {
      const bool on = e.value >= 64;
      if (pedal[e.channel] && !on) {
        for (size_t i : pedalHeld[e.channel]) {
          if (song.notes[i].length < 0) song.notes[i].length = seconds - song.notes[i].start;
        }
        pedalHeld[e.channel].clear();
      }
      pedal[e.channel] = on;
    }
  }
  for (Note& n : song.notes) {
    if (n.length < 0) n.length = std::max(0.2, seconds - n.start);
    n.length = std::max(n.length, 0.05);
    song.duration = std::max(song.duration, n.start + n.length);
  }
  std::stable_sort(song.notes.begin(), song.notes.end(), [](const Note& a, const Note& b) { return a.start < b.start; });
  return !song.notes.empty();
}

}  // namespace engine::midi
