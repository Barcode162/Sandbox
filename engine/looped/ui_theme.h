#pragma once
// A Looped UI theme (docs/archive/UI_PLAN.md R1.7): the same theme files the web
// pages wear (ui/system/themes/<id>.json, made in the UI Editor), read by
// the engine, so screens it draws later match the site and the menus.
// Tokens stay as their CSS text; colour() and length() read the simple
// kinds (#RGB, #RRGGBB, #RRGGBBAA, rgb(), rgba(); px/em/% numbers).
// Gradients and shadows ("paint" tokens) are kept as text only for now.
#include <string>
#include <string_view>
#include <utility>
#include <vector>

#include "looped/math.h"

namespace engine::ui {

struct Theme {
  std::string id, name, about;
  bool dark = true;
  std::vector<std::pair<std::string, std::string>> tokens;  // in file order, e.g. {"accent", "#F28C2C"}
  // The theme's other half (light for a dark theme, or dark), if it has one:
  // only the tokens that differ.
  bool hasOther = false;
  std::vector<std::pair<std::string, std::string>> otherTokens;

  // The half to use for a dark or light screen: the other half's tokens laid
  // over the main ones when `dark` asks for it and the theme has it.
  Theme half(bool dark) const;

  // The token's text, or nullptr if the theme doesn't have it.
  const std::string* token(std::string_view id) const;
  // The token as a colour (0..1, straight alpha), or `fallback` if it's
  // missing or not a plain colour.
  Vec4 colour(std::string_view id, Vec4 fallback = {0, 0, 0, 1}) const;
  // The token's number (px, em and % are dropped: "16px" → 16), or `fallback`.
  float length(std::string_view id, float fallback = 0) const;
};

// Parses a theme file. Returns false (and says why in `error`) if the text
// isn't a format-1 theme; `out` is untouched then.
bool parseTheme(std::string_view json, Theme& out, std::string* error = nullptr);
// A CSS colour as RGBA 0..1. False if it isn't #hex, rgb() or rgba().
bool parseColour(std::string_view css, Vec4& out);

}  // namespace engine::ui
