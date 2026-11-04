#pragma once
// Multiplayer messaging through a relay server (the small bridge lives in
// bar/web/net.js, the server in server/relay.php). Each player sends a few
// numbers (their "state") about 10 times a second; everyone else's states
// arrive here. What the numbers mean is up to the app.
#include <string>
#include <vector>

namespace engine::net {

enum class Status { kOff, kConnecting, kConnected, kFailing };

constexpr int kMaxValues = 20;  // numbers per state or world entry

// One state received from another player. `time` is that player's clock in
// milliseconds when they sent it (not comparable with ours directly).
struct Packet {
  int player = 0;  // stable small number per player while they're here
  double time = 0;
  int count = 0;
  float values[kMaxValues] = {};
};

// Starts sending and receiving; false if multiplayer is off for this page.
bool start();
Status status();
std::string room();

// Your latest state (sent on the next tick). `timeMs` = your clock now.
void setState(double timeMs, const float* values, int count);
// Which state value carries the "away" bit: the page sets it in your last
// state when it goes to the background (bar/web/net.js). Call once.
void setAwayFlag(int slot, int bit);

// New states since the last call, oldest first.
void receive(std::vector<Packet>& out);

bool present(int player);  // still in the room?
std::string playerName(int player);
// Their account id ("" = a guest) and profile picture revision (0 = none).
std::string playerAccount(int player);
int playerAvatarRev(int player);
// Where a profile picture is downloaded from ("" = no accounts here).
std::string avatarUrl(const std::string& account, int revision);
// Opens the person card for a player (an HTML panel over the game).
void showCard(const std::string& account, const std::string& name);

// Shared world: short named entries (key = 1-8 lowercase letters/digits)
// of up to kMaxValues numbers that everyone in the room sees the same. The
// last change wins. You don't get your own changes back.
struct WorldEntry {
  std::string key;
  bool fromLowerId = false;  // writer's id sorts before ours (for tie-breaks)
  std::vector<double> values;
};
void setWorld(const std::string& key, const double* values, int count);
void receiveWorld(std::vector<WorldEntry>& out);
// The server's clock in seconds (the same for everyone), 0 = not known yet.
double serverTime();

// Quick one-off events (a piano key, a dart throw) to everyone in the room:
// over direct connections when voice chat has made them, else the relay.
struct Event {
  int player = 0;
  std::string type;
  std::vector<double> values;
};
void sendEvent(const std::string& type, const double* values, int count);
void receiveEvents(std::vector<Event>& out);
// True if that player's id sorts before ours (for fair tie-breaks).
bool isLower(int player);

// Claims: the room decides who has something (a seat, a machine), one
// player per key (letters, digits, "._-", up to 40). claim() asks and returns
// a request id (0 when offline); release() lets it go. claimOwner(): -1
// nobody (or not known), 0 you, else that player's number. claimResult():
// 1 granted, 0 refused, -1 no answer yet (each answer is read once).
int claim(const std::string& key);
void release(const std::string& key);
int claimOwner(const std::string& key);
int claimResult(int request);
// A room slot (as the room's own games write them, e.g. world key rc) as a
// player number: -1 nobody / not known, 0 you, else that player.
int playerOfSlot(int slot);
// Your own room slot (-1 = not in a room), and another player's.
int mySlot();
int slotOfPlayer(int player);
// A world write the room makes only if `key` still holds `expect` (e.g.
// taking a drink: the first one to ask gets it). Returns a request id for
// claimResult() (0 when offline).
int setWorldIf(const std::string& key, const double* values, int count, const double* expect, int expectCount);
// Asks the room to do something (an intent: `kind` plus its arguments as a
// JSON object, e.g. request("dart", "{\"u\":0.1,\"v\":0}")). Returns a request
// id (0 when offline). takeAnswer() gives the room's whole answer once it
// came (true; `out` = the RESULT object: ok, why, and the game's fields).
int request(const std::string& kind, const std::string& argsJson);
bool takeAnswer(int request, std::string& outJson);

}  // namespace engine::net
