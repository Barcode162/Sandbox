#pragma once
// Half floats (16-bit), for RGBA16F textures (J116.4). Plain C++.
#include <cstdint>
#include <cstring>

namespace engine::draw {

inline uint16_t toHalf(float f) {
  uint32_t x;
  std::memcpy(&x, &f, 4);
  const uint32_t sign = (x >> 16) & 0x8000u;
  int32_t e = static_cast<int32_t>((x >> 23) & 0xFF) - 127 + 15;
  uint32_t m = x & 0x7FFFFFu;
  if (((x >> 23) & 0xFF) == 0xFF) return static_cast<uint16_t>(sign | 0x7C00u | (m ? 0x200u : 0));  // inf / nan
  if (e >= 31) return static_cast<uint16_t>(sign | 0x7BFFu);  // too big: the largest half
  if (e <= 0) {
    if (e < -10) return static_cast<uint16_t>(sign);
    m |= 0x800000u;
    const int shift = 14 - e;
    uint32_t h = m >> shift;
    if ((m >> (shift - 1)) & 1u) ++h;  // round
    return static_cast<uint16_t>(sign | h);
  }
  uint32_t h = sign | (static_cast<uint32_t>(e) << 10) | (m >> 13);
  if (m & 0x1000u) ++h;  // round (may carry into the exponent, which is right)
  return static_cast<uint16_t>(h);
}

inline float fromHalf(uint16_t h) {
  const uint32_t sign = (h & 0x8000u) << 16, e = (h >> 10) & 0x1F, m = h & 0x3FFu;
  uint32_t x;
  if (e == 0) {
    if (m == 0) x = sign;
    else {
      int ee = -1;
      uint32_t mm = m;
      do ++ee, mm <<= 1;
      while (!(mm & 0x400u));
      x = sign | static_cast<uint32_t>(127 - 15 - ee) << 23 | (mm & 0x3FFu) << 13;
    }
  } else if (e == 31) {
    x = sign | 0x7F800000u | m << 13;
  } else {
    x = sign | (e + 127 - 15) << 23 | m << 13;
  }
  float f;
  std::memcpy(&f, &x, 4);
  return f;
}

}  // namespace engine::draw
