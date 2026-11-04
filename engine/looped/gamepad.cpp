#include "looped/gamepad.h"

#include <emscripten/em_js.h>

namespace engine {
namespace {

// Fills out[0..9] = axes, out[10..29] = buttons; returns
// axisCount | buttonCount << 8 | standard << 16, or -1 when none. The id
// goes to idOut (UTF-8).
EM_JS(int, js_readGamepad, (float* out, char* idOut, int idSize), {
  var pads = navigator['getGamepads'] ? navigator['getGamepads']() : [];
  for (var i = 0; i < pads.length; i++) {
    var p = pads[i];
    if (!p || !p['connected']) continue;
    var axes = p['axes'], buttons = p['buttons'];
    var na = Math.min(axes.length, 10), nb = Math.min(buttons.length, 20);
    var base = out >> 2;
    for (var a = 0; a < na; a++) HEAPF32[base + a] = axes[a];
    for (var b = 0; b < nb; b++) HEAPF32[base + 10 + b] = buttons[b]['value'];
    stringToUTF8(String(p['id']), idOut, idSize);
    return na | (nb << 8) | ((p['mapping'] === 'standard' ? 1 : 0) << 16);
  }
  return -1;
});

}  // namespace

Gamepad readGamepad() {
  Gamepad g;
  float values[30] = {};
  char id[128] = {};
  const int r = js_readGamepad(values, id, sizeof(id));
  if (r < 0) return g;
  g.connected = true;
  g.axisCount = r & 0xff;
  g.buttonCount = (r >> 8) & 0xff;
  g.standard = (r >> 16) & 1;
  g.id = id;
  for (int i = 0; i < 10; ++i) g.axes[i] = values[i];
  for (int i = 0; i < 20; ++i) g.buttons[i] = values[10 + i];
  return g;
}

}  // namespace engine
