#pragma once
// The menus are HTML panels over the game (bar/web/menu.js): the emote wheel,
// avatar picker, settings, piano song list... They talk to C++ in two ways:
// - commands: the menu queues short messages ("emote", 3) in the page
//   mailbox, C++ takes them each frame;
// - settings: values the player chose (look speed, volumes...), kept in the
//   browser and read here when they change.
#include <string>
#include <vector>

namespace engine::ui {

struct Command {
  std::string name;
  double a = 0, b = 0;
  std::string text, text2;
};
void takeCommands(std::vector<Command>& out);

// Tells the menu what's going on: a JSON object (from JsonWriter) whose keys
// replace the menu's old ones, e.g. {"look":3}. Send it only on change.
void setInfo(const std::string& jsonObject);
// Shows a short message at the top of the screen (HTML toast).
void toast(const std::string& text);
// Opens a menu panel by name ("emotes", "piano", "bartender"...).
void openPanel(const std::string& name);
// Adds or removes a class on the page's <body> (e.g. "racing" hides the
// top bar during a race).
void setBodyClass(const std::string& name, bool on);
// The build code shown on the page ("build 1a2b3c4").
std::string buildLabel();
// The page address's options (after "?"), each value decoded and with any
// "&" inside a value removed, so splitting on "&" is safe.
std::string pageQuery();
// The logged-in player has this badge (bar/web/account.js; on this computer
// also ?badge=<name>, for tests). Asked at most once a second per badge.
bool hasBadge(const std::string& badge);
// You're in the bar (past the loading screen): voice chat may start.
void entered();

// The loading screen (bar/web/index.html barLoading): the downloads so far
// (`progress` 0..1), a stage starting (`text`, the bar at `fill` 0..1),
// files that failed (`critical`: the bar can't open), and ready.
void loadingProgress(int done, int total, float progress);
void loadingStage(const char* text, float fill);
void loadingFailed(const std::string& text, bool critical);
void loadingReady();

}  // namespace engine::ui

namespace engine::settings {
// Changes every time the player changes a setting.
int version();
double number(const char* key, double fallback);
// Small numbers the game itself remembers on this phone (e.g. the car you
// picked), kept in the browser's storage. Not shown in the settings menu.
void remember(const char* key, double value);
double remembered(const char* key, double fallback);
}  // namespace engine::settings
