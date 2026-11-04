#pragma once
// The page the engine runs in (J86). Every call the engine makes to the page
// goes through one object, window.loopedHost, which the program's page fills
// with its own parts before the engine starts:
//   net, audio, voice, bridge, log, account, settings   (objects with methods)
//   storagePrefix                                       (where remembered values go, default "looped.")
// loopedHost.has(part) says whether the page gave that part.
// install() wraps it once at start: a part the page doesn't give answers
// every call with nothing (undefined) and says so once in the console, so a
// small program (the place viewer) runs with almost none of them.
// The engine never names a game's page objects (tools/lint_engine.mjs).

namespace engine::host {

void install();

}  // namespace engine::host
