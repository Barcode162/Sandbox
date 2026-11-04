#include "looped/ui_theme.h"

#include <cstdlib>

#include "looped/json.h"

namespace engine::ui {

namespace {

int hexDigit(char c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'a' && c <= 'f') return c - 'a' + 10;
  if (c >= 'A' && c <= 'F') return c - 'A' + 10;
  return -1;
}

std::string_view trim(std::string_view s) {
  while (!s.empty() && (s.front() == ' ' || s.front() == '\t')) s.remove_prefix(1);
  while (!s.empty() && (s.back() == ' ' || s.back() == '\t')) s.remove_suffix(1);
  return s;
}

// Reads a number at the start of `s` (like "0.86" or ".5"); false if there is none.
bool leadingNumber(std::string_view s, float& out) {
  std::string buf(trim(s));
  if (buf.empty()) return false;
  char* end = nullptr;
  double v = std::strtod(buf.c_str(), &end);
  if (end == buf.c_str()) return false;
  out = static_cast<float>(v);
  return true;
}

}  // namespace

bool parseColour(std::string_view css, Vec4& out) {
  css = trim(css);
  if (!css.empty() && css.front() == '#') {
    std::string_view h = css.substr(1);
    int n[8];
    for (size_t i = 0; i < h.size(); ++i) if ((n[i < 8 ? i : 7] = hexDigit(h[i])) < 0) return false;
    if (h.size() == 3 || h.size() == 4) {
      out = {n[0] * 17 / 255.0f, n[1] * 17 / 255.0f, n[2] * 17 / 255.0f, h.size() == 4 ? n[3] * 17 / 255.0f : 1.0f};
      return true;
    }
    if (h.size() == 6 || h.size() == 8) {
      out = {(n[0] * 16 + n[1]) / 255.0f, (n[2] * 16 + n[3]) / 255.0f, (n[4] * 16 + n[5]) / 255.0f,
             h.size() == 8 ? (n[6] * 16 + n[7]) / 255.0f : 1.0f};
      return true;
    }
    return false;
  }
  bool alpha = css.substr(0, 5) == "rgba(";
  if (!alpha && css.substr(0, 4) != "rgb(") return false;
  if (css.back() != ')') return false;
  std::string_view inside = css.substr(alpha ? 5 : 4, css.size() - (alpha ? 6 : 5));
  float v[4] = {0, 0, 0, 1};
  int count = 0;
  while (count < 4) {
    size_t comma = inside.find(',');
    if (!leadingNumber(inside.substr(0, comma), v[count])) return false;
    ++count;
    if (comma == std::string_view::npos) break;
    inside.remove_prefix(comma + 1);
  }
  if (count != (alpha ? 4 : 3)) return false;
  out = {v[0] / 255.0f, v[1] / 255.0f, v[2] / 255.0f, v[3]};
  return true;
}

const std::string* Theme::token(std::string_view id) const {
  for (const auto& t : tokens) if (t.first == id) return &t.second;
  return nullptr;
}

Vec4 Theme::colour(std::string_view id, Vec4 fallback) const {
  const std::string* t = token(id);
  Vec4 c;
  return t && parseColour(*t, c) ? c : fallback;
}

float Theme::length(std::string_view id, float fallback) const {
  const std::string* t = token(id);
  float v;
  return t && leadingNumber(*t, v) ? v : fallback;
}

Theme Theme::half(bool wantDark) const {
  if (!hasOther || wantDark == dark) return *this;
  Theme t = *this;
  t.dark = wantDark;
  t.hasOther = false;
  t.otherTokens.clear();
  for (const auto& [key, value] : otherTokens) {
    bool found = false;
    for (auto& tok : t.tokens) if (tok.first == key) { tok.second = value; found = true; }
    if (!found) t.tokens.emplace_back(key, value);
  }
  return t;
}

bool parseTheme(std::string_view json, Theme& out, std::string* error) {
  std::string parseError;
  Json j = Json::parse(json, &parseError);
  auto fail = [&](const std::string& why) { if (error) *error = why; return false; };
  if (j.isNull()) return fail("not JSON: " + parseError);
  if (j["format"].integer() != 1) return fail("not a format-1 theme");
  if (!j["id"].isString() || j["id"].string().empty()) return fail("the theme has no id");
  if (!j["tokens"].isObject()) return fail("the theme has no tokens");
  Theme t;
  t.id = j["id"].string();
  t.name = j["name"].string();
  t.about = j["about"].string();
  t.dark = j["scheme"].string() != "light";
  for (const auto& [key, value] : j["tokens"].members()) if (value.isString()) t.tokens.emplace_back(key, value.string());
  const Json& other = j["other"];
  if (other.isObject() && other["tokens"].isObject()) {
    t.hasOther = true;
    for (const auto& [key, value] : other["tokens"].members()) if (value.isString()) t.otherTokens.emplace_back(key, value.string());
  }
  out = std::move(t);
  return true;
}

}  // namespace engine::ui
