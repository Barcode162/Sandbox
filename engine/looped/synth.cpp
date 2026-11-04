#include "looped/synth.h"

#include <algorithm>
#include <cmath>
#include <cstdint>

namespace engine::synth {
namespace {

constexpr float kTwoPi = 6.28318530718f;

// Small fast random numbers (deterministic, so a sound is the same each time).
struct Noise {
  uint32_t s = 22222;
  float next() {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return static_cast<float>(s & 0xffffff) / static_cast<float>(0x7fffff) - 1.0f;
  }
};

// A sine partial with an exponential decay, added into `out`. Uses a
// rotating phasor instead of sin() per sample (much faster).
void addPartial(std::vector<float>& out, float freq, float amp, float decaySeconds, float startPhase = 0) {
  if (freq >= kRate * 0.45f || amp <= 0) return;
  const float w = kTwoPi * freq / kRate;
  const float cw = std::cos(w), sw = std::sin(w);
  float c = std::cos(startPhase), s = std::sin(startPhase);
  const float k = std::exp(-6.9f / (decaySeconds * kRate));  // -60 dB after decaySeconds
  float a = amp;
  for (size_t i = 0; i < out.size(); ++i) {
    out[i] += s * a;
    const float nc = c * cw - s * sw;
    s = s * cw + c * sw;
    c = nc;
    a *= k;
    if ((i & 1023) == 0) {  // keep the phasor on the unit circle
      const float len = 1.0f / std::sqrt(c * c + s * s);
      c *= len;
      s *= len;
    }
  }
}

void normalize(std::vector<float>& v, float peak) {
  float m = 1e-6f;
  for (float x : v) m = std::max(m, std::fabs(x));
  for (float& x : v) x *= peak / m;
}

// Short fade at both ends so nothing clicks.
void fadeEnds(std::vector<float>& v, float inSeconds = 0.002f, float outSeconds = 0.04f) {
  const size_t a = std::min(v.size(), static_cast<size_t>(inSeconds * kRate));
  const size_t b = std::min(v.size(), static_cast<size_t>(outSeconds * kRate));
  for (size_t i = 0; i < a; ++i) v[i] *= static_cast<float>(i) / static_cast<float>(a);
  for (size_t i = 0; i < b; ++i) v[v.size() - 1 - i] *= static_cast<float>(i) / static_cast<float>(b);
}

// One-pole low-pass, in place.
void lowPass(std::vector<float>& v, float cutoff) {
  const float a = 1.0f - std::exp(-kTwoPi * cutoff / kRate);
  float y = 0;
  for (float& x : v) {
    y += a * (x - y);
    x = y;
  }
}

std::vector<float> samples(float seconds) { return std::vector<float>(static_cast<size_t>(seconds * kRate), 0.0f); }


// The partials of a piano note: each has 2-3 slightly detuned strings with a
// two-stage decay (a fast "prompt" part and a long aftersound) and stops
// once 80 dB down. The strings are nearly the same pitch, so their sum is one
// carrier wave times a slowly turning "beat" factor, updated every 64
// samples and blended in between. Four partials run side by side in one
// loop so the processor overlaps their work. (The first version ran a full
// pass per string and per stage: about 10x slower.)
struct PianoPartial {
  float freq = 0, amp = 0, decay = 1;
};

void addPianoPartials(std::vector<float>& out, const PianoPartial* parts, int count, const float* detune,
                      int strings) {
  constexpr int kBlock = 64, kLanes = 4;
  for (int g = 0; g < count; g += kLanes) {
    float zc[kLanes], zs[kLanes], cw[kLanes], sw[kLanes], e1[kLanes], e2[kLanes], k1[kLanes], k2[kLanes];
    float bc[kLanes][3], bs[kLanes][3], bcw[kLanes][3], bsw[kLanes][3], b0re[kLanes], b0im[kLanes];
    size_t end = 0;
    for (int l = 0; l < kLanes; ++l) {
      const PianoPartial p = g + l < count ? parts[g + l] : PianoPartial{};
      const bool on = p.amp > 0 && p.freq * detune[0] < kRate * 0.45f;
      const float w = kTwoPi * p.freq / kRate;
      zc[l] = 1;
      zs[l] = 0;
      cw[l] = std::cos(w);
      sw[l] = std::sin(w);
      k1[l] = std::exp(-6.9f / (p.decay * 0.25f * kRate));
      k2[l] = std::exp(-6.9f / (p.decay * kRate));
      e1[l] = on ? p.amp * 0.6f : 0;
      e2[l] = on ? p.amp * 0.4f : 0;
      // The aftersound (0.4 of the amplitude) is 80 dB down here.
      if (on) end = std::max(end, static_cast<size_t>(std::log(1e-4f / 0.4f) / std::log(k2[l])) + 1);
      b0re[l] = b0im[l] = 0;
      for (int s = 0; s < 3; ++s) {
        const float d = w * (detune[s] - 1.0f) * kBlock;
        bcw[l][s] = std::cos(d);
        bsw[l][s] = std::sin(d);
        bc[l][s] = s < strings ? std::cos(static_cast<float>(s)) : 0;  // each string from its own phase
        bs[l][s] = s < strings ? std::sin(static_cast<float>(s)) : 0;
        b0re[l] += bc[l][s];
        b0im[l] += bs[l][s];
      }
    }
    end = std::min(end, out.size());
    for (size_t start = 0; start < end; start += kBlock) {
      float bre[kLanes], bim[kLanes], dre[kLanes], dim[kLanes];
      for (int l = 0; l < kLanes; ++l) {  // the beat at the end of this block
        float re = 0, im = 0;
        for (int s = 0; s < 3; ++s) {
          const float nc = bc[l][s] * bcw[l][s] - bs[l][s] * bsw[l][s];
          bs[l][s] = bs[l][s] * bcw[l][s] + bc[l][s] * bsw[l][s];
          bc[l][s] = nc;
          re += bc[l][s];
          im += bs[l][s];
        }
        bre[l] = b0re[l];
        bim[l] = b0im[l];
        dre[l] = (re - b0re[l]) / kBlock;
        dim[l] = (im - b0im[l]) / kBlock;
        b0re[l] = re;
        b0im[l] = im;
      }
      const size_t stop = std::min(end, start + kBlock);
      for (size_t i = start; i < stop; ++i) {
        float sum = 0;
        for (int l = 0; l < kLanes; ++l) {
          sum += (zs[l] * bre[l] + zc[l] * bim[l]) * (e1[l] + e2[l]);  // Im(carrier * beat)
          const float nc = zc[l] * cw[l] - zs[l] * sw[l];
          zs[l] = zs[l] * cw[l] + zc[l] * sw[l];
          zc[l] = nc;
          bre[l] += dre[l];
          bim[l] += dim[l];
          e1[l] *= k1[l];
          e2[l] *= k2[l];
        }
        out[i] += sum;
      }
      for (int l = 0; l < kLanes; ++l) {  // keep the phasors on the unit circle
        const float len = 1.0f / std::sqrt(zc[l] * zc[l] + zs[l] * zs[l]);
        zc[l] *= len;
        zs[l] *= len;
        if ((start & 4095) == 0) {
          for (int s = 0; s < strings; ++s) {
            const float n = 1.0f / std::sqrt(bc[l][s] * bc[l][s] + bs[l][s] * bs[l][s]);
            bc[l][s] *= n;
            bs[l][s] *= n;
          }
        }
      }
    }
  }
}

}  // namespace

std::vector<float> pianoNote(int key) {
  const float f = 440.0f * std::pow(2.0f, static_cast<float>(key - 69) / 12.0f);
  // Low notes ring for a long time, high ones die quickly. Bass notes get up
  // to 6 s (they were cut at 3.6 s while the synth was slow).
  const float ring = std::clamp(7.0f * std::pow(261.6f / f, 0.55f), 0.7f, 11.0f);
  const float seconds = std::clamp(ring * 0.55f, 0.9f, key < 48 ? 6.0f : 3.6f);
  std::vector<float> out = samples(seconds);
  const float B = 0.00008f * std::pow(f / 27.5f, 0.9f);  // string stiffness (inharmonicity)
  const float detune[3] = {1.0f, 1.0011f, 0.9992f};  // three strings per note
  const int strings = key < 40 ? 2 : 3;
  PianoPartial parts[16];
  int count = 0;
  for (int n = 1; n <= 16; ++n) {
    const float fn = f * static_cast<float>(n) * std::sqrt(1.0f + B * static_cast<float>(n * n));
    if (fn > 7000) break;
    // Brighter at the strike point; low notes carry many partials.
    const float amp = 1.0f / std::pow(static_cast<float>(n), key < 48 ? 0.9f : 1.4f) * (n == 1 && key < 36 ? 0.6f : 1.0f);
    parts[count++] = {fn, amp, ring / (1.0f + 0.35f * static_cast<float>(n - 1))};
  }
  addPianoPartials(out, parts, count, detune, strings);
  // Hammer knock: a short burst of filtered noise.
  Noise noise;
  const size_t knock = static_cast<size_t>(0.012f * kRate);
  float y = 0;
  for (size_t i = 0; i < knock && i < out.size(); ++i) {
    y += 0.3f * (noise.next() - y);
    out[i] += y * 0.25f * (1.0f - static_cast<float>(i) / static_cast<float>(knock));
  }
  normalize(out, 0.55f);
  fadeEnds(out, 0.003f, 0.25f);
  return out;
}

std::vector<float> pluck(float frequency, float seconds, float brightness) {
  std::vector<float> out = samples(seconds);
  const size_t period = std::max<size_t>(2, static_cast<size_t>(kRate / frequency));
  std::vector<float> line(period);
  Noise noise;
  for (float& x : line) x = noise.next();
  const float blend = 0.5f + 0.49f * brightness;
  size_t at = 0;
  for (float& o : out) {
    const size_t next = (at + 1) % period;
    const float v = line[at] * blend + line[next] * (1.0f - blend);
    o = line[at];
    line[at] = v * 0.996f;
    at = next;
  }
  normalize(out, 0.5f);
  fadeEnds(out);
  return out;
}

std::vector<float> effect(Effect e) {
  Noise noise;
  std::vector<float> out;
  switch (e) {
    case Effect::kBell: {
      out = samples(1.6f);
      const float partials[5] = {1.0f, 2.76f, 5.4f, 8.93f, 13.3f};  // a small bell's modes
      for (int i = 0; i < 5; ++i) addPartial(out, 1650.0f * partials[i], 1.0f / static_cast<float>(i + 1), 1.4f / (1 + i * 0.6f));
      break;
    }
    case Effect::kThunk: {
      out = samples(0.18f);
      addPartial(out, 140, 1.0f, 0.08f);
      addPartial(out, 410, 0.5f, 0.04f);
      for (size_t i = 0; i < 400 && i < out.size(); ++i) out[i] += noise.next() * 0.6f * (1.0f - static_cast<float>(i) / 400.0f);
      lowPass(out, 2500);
      break;
    }
    case Effect::kClink: {
      out = samples(0.7f);
      for (float f : {2350.0f, 3720.0f, 5110.0f}) addPartial(out, f, 1.0f, 0.5f);
      break;
    }
    case Effect::kPour: {
      out = samples(1.5f);
      float y = 0;
      for (size_t i = 0; i < out.size(); ++i) {
        y += 0.15f * (noise.next() - y);
        const float t = static_cast<float>(i) / kRate;
        const float bubbles = 0.5f + 0.5f * std::sin(t * 70.0f + std::sin(t * 13.0f) * 3.0f);
        out[i] = y * (0.6f + 0.4f * bubbles);
      }
      break;
    }
    case Effect::kShake: {
      out = samples(1.2f);
      for (size_t i = 0; i < out.size(); ++i) {
        const float t = static_cast<float>(i) / kRate;
        const float beat = std::pow(std::max(0.0f, std::sin(t * kTwoPi * 6.0f)), 8.0f);  // ice hitting the tin
        out[i] = noise.next() * beat;
      }
      lowPass(out, 5000);
      break;
    }
    case Effect::kClick: {
      out = samples(0.05f);
      for (size_t i = 0; i < out.size(); ++i) out[i] = noise.next() * std::exp(-static_cast<float>(i) / 60.0f);
      addPartial(out, 3000, 0.4f, 0.02f);
      break;
    }
    case Effect::kEngine: {
      // Exactly one second, harmonics of 50 Hz, so it loops without a seam.
      out = samples(1.0f);
      for (int n = 1; n <= 24; ++n) {
        const float amp = (n % 2 ? 1.0f : 0.6f) / static_cast<float>(n);
        addPartial(out, 50.0f * static_cast<float>(n), amp, 1e9f);  // no decay
      }
      for (size_t i = 0; i < out.size(); ++i) out[i] += 0.15f * noise.next();
      normalize(out, 0.4f);
      return out;  // no fades: it loops
    }
    case Effect::kWhoosh: {
      out = samples(0.35f);
      float y = 0;
      for (size_t i = 0; i < out.size(); ++i) {
        const float t = static_cast<float>(i) / static_cast<float>(out.size());
        y += (0.05f + 0.3f * t) * (noise.next() - y);
        out[i] = y * std::sin(t * 3.14159265f);
      }
      break;
    }
    case Effect::kKnock: {
      out = samples(0.9f);
      for (float at : {0.0f, 0.22f, 0.44f}) {
        std::vector<float> k = samples(0.15f);
        addPartial(k, 95, 1.0f, 0.06f);
        addPartial(k, 230, 0.6f, 0.04f);
        const size_t o = static_cast<size_t>(at * kRate);
        for (size_t i = 0; i < k.size() && o + i < out.size(); ++i) out[o + i] += k[i];
      }
      break;
    }
    case Effect::kCheer: {
      out = samples(1.8f);
      float y = 0;
      for (size_t i = 0; i < out.size(); ++i) {
        const float t = static_cast<float>(i) / kRate;
        y += 0.25f * (noise.next() - y);
        const float env = std::min(1.0f, t * 6.0f) * std::exp(-t * 1.4f);
        const float voices = 0.6f + 0.4f * std::sin(t * 31.0f) * std::sin(t * 17.0f);
        out[i] = y * env * voices;
      }
      lowPass(out, 3000);
      break;
    }
    case Effect::kCrackle: {
      // Three to five pops at random moments, each a burst of noise that dies in milliseconds.
      out = samples(0.35f);
      const int pops = 3 + static_cast<int>((noise.next() * 0.5f + 0.5f) * 3.0f);
      for (int k = 0; k < pops; ++k) {
        const size_t o = static_cast<size_t>((noise.next() * 0.5f + 0.5f) * 0.28f * kRate);
        const float amp = 0.4f + 0.6f * (noise.next() * 0.5f + 0.5f);
        for (size_t i = 0; i < static_cast<size_t>(0.012f * kRate) && o + i < out.size(); ++i)
          out[o + i] += amp * noise.next() * std::exp(-static_cast<float>(i) / (0.0025f * kRate));
      }
      break;
    }
    case Effect::kBuzz: {
      out = samples(0.9f);
      for (size_t i = 0; i < out.size(); ++i) {
        const float t = static_cast<float>(i) / kRate;
        const float env = std::sin(0.5f * kTwoPi * t / 0.9f);
        const float hum = std::sin(kTwoPi * 120 * t) + 0.5f * std::sin(kTwoPi * 240 * t) +
                          0.25f * std::sin(kTwoPi * 360 * t) + 0.15f * noise.next();
        out[i] = 0.3f * env * env * hum;
      }
      break;
    }
    case Effect::kBong:
      out = samples(1.2f);
      addPartial(out, 520, 1.0f, 0.5f);
      addPartial(out, 1316, 0.5f, 0.3f);
      addPartial(out, 2140, 0.25f, 0.18f);
      break;
    case Effect::kWood:
      out = samples(0.2f);
      addPartial(out, 160, 1.0f, 0.05f);
      addPartial(out, 410, 0.5f, 0.03f);
      break;
    case Effect::kCount: break;
  }
  normalize(out, 0.5f);
  fadeEnds(out);
  return out;
}

}  // namespace engine::synth

// ---- The arcade's music: an original chiptune loop (square-wave lead and
// arpeggios, a triangle bass, noise drums), 16 bars at 140 bpm in A minor
// (Am F C G). Notes that ring past the end wrap round to the start, so it
// loops without a seam.
namespace engine::synth {
namespace {

struct Mix {
  std::vector<float> out;
  void add(size_t at, const std::vector<float>& s, float gain) {
    for (size_t i = 0; i < s.size(); ++i) out[(at + i) % out.size()] += s[i] * gain;
  }
};

float midiHz(int key) { return 440.0f * std::pow(2.0f, (static_cast<float>(key) - 69) / 12.0f); }

// A pulse wave (duty 0..1) with a quick attack, a decay to `sustain` and a release.
std::vector<float> pulseNote(float hz, float seconds, float duty, float sustain, float vibrato = 0) {
  const size_t n = static_cast<size_t>((seconds + 0.06f) * kRate);
  std::vector<float> s(n);
  float phase = 0;
  for (size_t i = 0; i < n; ++i) {
    const float t = static_cast<float>(i) / kRate;
    const float f = hz * (1 + vibrato * std::sin(2 * 3.14159265f * 5.5f * t) * std::min(t * 4, 1.0f));
    phase += f / kRate;
    phase -= std::floor(phase);
    const float wave = phase < duty ? 1.0f : -1.0f;
    float env = t < 0.005f ? t / 0.005f : sustain + (1 - sustain) * std::exp(-(t - 0.005f) * 14);
    if (t > seconds) env *= std::max(0.0f, 1 - (t - seconds) / 0.06f);
    s[i] = wave * env;
  }
  return s;
}

std::vector<float> triangleNote(float hz, float seconds) {
  const size_t n = static_cast<size_t>((seconds + 0.03f) * kRate);
  std::vector<float> s(n);
  for (size_t i = 0; i < n; ++i) {
    const float t = static_cast<float>(i) / kRate;
    const float p = t * hz - std::floor(t * hz);
    float env = t < 0.004f ? t / 0.004f : 1.0f;
    if (t > seconds) env *= std::max(0.0f, 1 - (t - seconds) / 0.03f);
    s[i] = (4 * std::fabs(p - 0.5f) - 1) * env;
  }
  return s;
}

std::vector<float> drum(int kind, uint32_t& seed) {
  const float len = kind == 0 ? 0.16f : kind == 1 ? 0.14f : 0.04f;
  const size_t n = static_cast<size_t>(len * kRate);
  std::vector<float> s(n);
  float phase = 0, last = 0;
  for (size_t i = 0; i < n; ++i) {
    const float t = static_cast<float>(i) / kRate;
    seed = seed * 1664525u + 1013904223u;
    const float noise = static_cast<float>(seed >> 8) / 8388608.0f - 1;
    if (kind == 0) {  // kick: a falling sine
      phase += (50 + 120 * std::exp(-t * 30)) / kRate;
      s[i] = std::sin(2 * 3.14159265f * phase) * std::exp(-t * 18);
    } else if (kind == 1) {  // snare: noise and a tone
      phase += 185 / kRate;
      s[i] = (noise * 0.7f + std::sin(2 * 3.14159265f * phase) * 0.4f) * std::exp(-t * 22);
    } else {  // hat: bright noise (a crude high-pass)
      s[i] = (noise - last) * 0.5f * std::exp(-t * 90);
      last = noise;
    }
  }
  return s;
}

}  // namespace

std::vector<float> arcadeLoop() {
  constexpr float kBpm = 140;
  const float step = 60.0f / kBpm / 4;  // a 16th note
  constexpr int kBars = 16;
  Mix m;
  m.out.assign(static_cast<size_t>(kBars * 16 * step * kRate), 0.0f);
  const auto at = [&](int bar, float s) { return static_cast<size_t>((static_cast<float>(bar * 16) + s) * step * kRate); };
  // Chords: root (bass), and the triad for the arpeggio.
  const int roots[4] = {45, 41, 48, 43};  // A2 F2 C3 G2
  const int triads[4][3] = {{57, 60, 64}, {53, 57, 60}, {55, 60, 64}, {55, 59, 62}};
  struct N {
    float s, len;
    int key;
  };
  const std::vector<N> lead[4] = {
      {{0, 2, 76}, {2, 2, 81}, {4, 2, 84}, {6, 1, 83}, {7, 1, 81}, {8, 2, 79}, {10, 4, 76}, {14, 1, 74}, {15, 1, 76}},
      {{0, 2, 77}, {2, 2, 81}, {4, 2, 84}, {6, 2, 81}, {8, 2, 79}, {10, 2, 77}, {12, 2, 76}, {14, 2, 74}},
      {{0, 2, 76}, {2, 2, 79}, {4, 2, 84}, {6, 2, 88}, {8, 2, 86}, {10, 2, 84}, {12, 4, 79}},
      {{0, 2, 74}, {2, 2, 79}, {4, 2, 83}, {6, 2, 86}, {8, 1, 84}, {9, 1, 83}, {10, 1, 81}, {11, 1, 79}, {12, 4, 76}},
  };
  uint32_t seed = 12345;
  const std::vector<float> kick = drum(0, seed), snare = drum(1, seed), hat = drum(2, seed);
  for (int bar = 0; bar < kBars; ++bar) {
    const int c = bar % 4;
    const int part = bar / 4;  // 0 intro, 1 melody, 2 breakdown, 3 everything
    // Bass: eighth notes, root and octave.
    for (int k = 0; k < 8; ++k) {
      const int key = roots[c] + ((k % 2 == 1 && part != 2) ? 12 : 0);
      m.add(at(bar, static_cast<float>(k * 2)), triangleNote(midiHz(key), step * 1.7f), 0.30f);
    }
    // Arpeggio: chord tones in 16ths, up and down (not in the breakdown).
    if (part != 2) {
      static const int order[8] = {0, 1, 2, 1, 0, 1, 2, 1};
      for (int k = 0; k < 16; ++k) {
        const int key = triads[c][order[k % 8]] + 12 * ((k / 8) % 2);
        m.add(at(bar, static_cast<float>(k)), pulseNote(midiHz(key), step * 0.8f, 0.125f, 0.25f), 0.07f);
      }
    }
    // Lead: the melody (an octave lower and with an echo in the breakdown,
    // doubled an octave up at the end).
    if (part >= 1) {
      for (const N& n : lead[c]) {
        const int key = part == 2 ? n.key - 12 : n.key;
        const auto note = pulseNote(midiHz(key), n.len * step * 0.92f, 0.5f, 0.55f, 0.006f);
        m.add(at(bar, n.s), note, 0.11f);
        if (part == 2) m.add(at(bar, n.s + 3), note, 0.045f);  // echo, a dotted 8th later
        if (part == 3) m.add(at(bar, n.s), pulseNote(midiHz(key + 12), n.len * step * 0.92f, 0.25f, 0.4f), 0.04f);
      }
    }
    // Drums: kick on 1 and 3 (four on the floor once it gets going), snare
    // on 2 and 4, hats on the 8ths.
    for (int k = 0; k < 16; ++k) {
      const float s = static_cast<float>(k);
      const bool kickHere = part == 0 ? (k == 0 || k == 8) : part == 2 ? k == 0 : k % 4 == 0;
      if (kickHere) m.add(at(bar, s), kick, 0.5f);
      if (part != 0 && part != 2 && (k == 4 || k == 12)) m.add(at(bar, s), snare, 0.22f);
      if (k % 2 == 0 && part != 2) m.add(at(bar, s), hat, k % 4 == 2 ? 0.14f : 0.08f);
    }
  }
  // Soft clip and level.
  for (float& v : m.out) v = std::tanh(v * 1.2f) * 0.8f;
  return m.out;
}

}  // namespace engine::synth
