#pragma once
// Standard MIDI files (.mid, formats 0 and 1): reads every note with its
// start time and length in seconds (tempo changes applied), and stretches
// notes held by the sustain pedal.
#include <cstdint>
#include <string>
#include <vector>

namespace engine::midi {

struct Note {
  double start = 0;     // seconds from the start of the song
  double length = 0;    // seconds the key (or the pedal) holds it
  int key = 60;         // MIDI key number (60 = middle C)
  float velocity = 0.8f;  // 0..1
  int channel = 0;
};

struct Song {
  std::string title;      // from the file's track name, if any
  std::vector<Note> notes;  // sorted by start time
  double duration = 0;
};

// Returns false (and leaves `song` empty) if the bytes aren't a MIDI file.
bool parse(const std::vector<uint8_t>& bytes, Song& song);

}  // namespace engine::midi
