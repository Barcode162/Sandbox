#pragma once
// The engine's built-in font: a hand-drawn 5x7 pixel font (plus descenders),
// turned into a signed distance field (SDF) atlas so text stays sharp at any
// size and can get an outline for free. CPU only; text.cpp uploads it.
#include <cstdint>
#include <vector>

namespace engine {

namespace font {
// Sizes in font pixels. A glyph is 5x9 (7 rows above the baseline, 2 below).
constexpr int kGlyphW = 5;
constexpr int kGlyphH = 9;
constexpr int kCapHeight = 7;
constexpr int kAdvance = 6;      // glyph width + 1 pixel gap
constexpr int kLineHeight = 11;  // glyph height + 2 pixel gap
constexpr int kPad = 1;          // empty border around each glyph in the atlas
constexpr int kCellW = kGlyphW + 2 * kPad;
constexpr int kCellH = kGlyphH + 2 * kPad;
constexpr int kTexelsPerPixel = 8;  // atlas resolution per font pixel
constexpr int kColumns = 16;
constexpr char kFirstChar = 32;  // ' '
constexpr char kLastChar = 127;  // '~' plus one solid block (see kSolid)
constexpr char kSolid = 127;     // fully filled glyph, used to draw rectangles
constexpr int kGlyphCount = kLastChar - kFirstChar + 1;
// Two shapes after the letters, for round UI (the rhythm game's notes):
// a filled disc and a ring, centered in their cell.
enum Shape { kShapeDisc = 0, kShapeRing = 1 };
constexpr int kShapeCount = 2;
constexpr float kShapeCenterX = kCellW * 0.5f, kShapeCenterY = kCellH * 0.5f;  // in cell pixels
constexpr float kShapeRadius = 3.2f;     // outer radius, font pixels
constexpr float kRingInner = 2.45f;      // the ring's inner radius
constexpr int kRows = (kGlyphCount + kShapeCount + kColumns - 1) / kColumns;
// The distance field covers +-kSdfRange font pixels around each edge.
constexpr float kSdfRange = 1.0f;
}  // namespace font

struct FontAtlas {
  uint32_t width = 0, height = 0;
  // One 8-bit image per mip level; 0.5 = on the glyph edge, higher = inside.
  std::vector<std::vector<uint8_t>> mips;
};

FontAtlas buildFontAtlas(int mipLevels);

// Atlas cell (column, row) for a character; unknown characters map to '?'.
void fontCell(char c, int& column, int& row);
// Atlas cell for a shape (font::Shape).
void shapeCell(int shape, int& column, int& row);

}  // namespace engine
