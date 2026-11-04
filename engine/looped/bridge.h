#pragma once
// The mailbox between the game and the page (bar/web/bridge.js). Calls between
// WebAssembly and JavaScript are slow on phones, so instead of many small
// calls per frame there are two:
//   pull()   at the start of a frame: the canvas size, safe area, touches,
//            menu commands, voice levels... collected by the page;
//   flush()  at the end: every page change the game queued with op().
#include <string>
#include <string_view>
#include <vector>

namespace engine::bridge {

struct Frame {
  double pulledMs = 0;            // performance.now() when pulled
  double cssW = 0, cssH = 0;      // the canvas in CSS pixels (from a ResizeObserver)
  double dpr = 1;
  float safe[4] = {};             // safe-area insets: left, top, right, bottom (CSS px)
  bool hidden = false;            // the page is in the background
  int blurs = 0;                  // times the page lost focus so far (let go of input)
  bool fieldFocused = false;      // a text field has the keyboard (keys aren't for the game)
  bool modalOpen = false;         // a menu or account panel covers the game
  bool audioRunning = false;
  double audioTime = 0;           // the sound clock (seconds) when pulled
  int settingsVersion = 0;
  float myVoiceLevel = 0;         // your microphone level 0..1 (0 when muted)
  double lastTouchMs = -1e9;
  int userSongCount = 0;          // songs you loaded from the Files app
  double musicTime[2] = {-1, -1}; // music sources 0 and 1: seconds into the song as heard (-1 = not playing)
};
struct Touch {
  int type;  // 0 start, 1 move, 2 end, 3 cancel
  int id;
  float x, y;  // CSS pixels from the canvas' top-left
  double timeMs;
};

// Installs the page's listeners for the canvas (call once).
void attach(const char* canvasSelector);
// Once per frame, first thing.
void pull();
const Frame& frame();
// Touches since the last pull (taken: a second call returns nothing).
std::vector<Touch> takeTouches();
// Another player's voice level 0..1 (by player index), as of the last pull.
float voiceLevel(int player);
// The menu commands since the last pull, as JSON text ([[name, a, b, text, text2], ...]).
const std::string& uiCommandsJson();

// The other players in the room (bar/web/net.js), updated when it changes.
struct RosterEntry {
  int index = 0;           // the player's number in this session
  std::string name;
  std::string account;     // "" = guest
  int avatarRev = 0;       // profile picture revision (0 = none)
  bool lowerId = false;    // their id sorts before ours (tie-breaks)
};
const std::vector<RosterEntry>& roster();
const RosterEntry* rosterFind(int index);
// Players get rising indexes, so one above this joined after the last roster.
int rosterMaxIndex();

// Queues one page operation: a JSON array like ["status", "60 fps"]. Run in
// order at flush().
void op(std::string jsonArray);
// Runs the queued operations (once per frame, last thing).
void flush();
// `text` as a JSON string literal, quotes included.
std::string quote(std::string_view text);

}  // namespace engine::bridge
