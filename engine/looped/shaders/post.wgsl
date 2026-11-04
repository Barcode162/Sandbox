// After the scene (looped/post.cpp): eyes, the curve and mood.
// New lighting (L1.1): the scene arrives as linear light (rgba16float, any
// brightness). Like eyes, the picture is metered (the average brightness,
// weighted to the middle), the exposure follows it over about a second, and
// a filmic curve (AgX) turns light into display colours without clipping.
// Then the mood (grade) as before. Nothing is painted over bright things
// (no bloom since J92, the user's word): only real light.
// Classic lighting: the scene arrives already tone mapped (display colours),
// as before L1.
// - Mood (color grading): a warm or cool tint, saturation, contrast, a
//   gentle darkening toward the corners (vignette).

struct Post {
  texel: vec4f,   // xy = 1 / source size (the texture sampled), z = how much highlights keep their colour, w = the eyes' reference light (log2)
  params: vec4f,  // x, y, z = unused, w = vignette
  grade: vec4f,   // rgb = tint (1 = none), a = saturation (1 = none)
  grade2: vec4f,  // x = contrast (1 = none), y = lift (raises the darks), z = 1 = classic lighting, w = seconds since last frame
  eye: vec4f,     // x = exposure compensation (EV), y = darkest adaptation (log2 luminance), z = brightest, w = 1 = reset (no easing)
  eye2: vec4f,    // x = seconds to adapt to brighter, y = to darker, z = fixed exposure (EV), w = how much darkness stays (0..1)
  white: vec4f,   // rgb = white balance (new lighting), w = EV of extra room in the highlights
};

@group(0) @binding(0) var<uniform> post: Post;
@group(0) @binding(1) var texA: texture_2d<f32>;  // the source
@group(0) @binding(2) var texB: texture_2d<f32>;  // adapt: last frame's eye (unused elsewhere)
@group(0) @binding(3) var samp: sampler;
@group(0) @binding(4) var eyeTex: texture_2d<f32>;  // 1 x 1: r = adapted log2 luminance

struct VsOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

// One triangle that covers the screen.
@vertex
fn vs_full(@builtin(vertex_index) i: u32) -> VsOut {
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  var o: VsOut;
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  o.uv = vec2f(p.x, 1.0 - p.y);
  return o;
}

fn classic() -> bool { return post.grade2.z > 0.5; }
fn lin(c: vec3f) -> vec3f { return pow(max(c, vec3f(0.0)), vec3f(2.2)); }
fn luminance(c: vec3f) -> f32 { return dot(c, vec3f(0.2126, 0.7152, 0.0722)); }

// The exposure the eyes have settled on (a multiplier on the light).
fn exposure() -> f32 {
  let e = textureLoad(eyeTex, vec2i(0, 0), 0).r;
  // The adapted brightness shows as middle grey (0.18), except that part of
  // how far it is from the reference stays (a dim bar still looks dim).
  let shown = log2(0.18) + post.eye2.w * (e - post.texel.w);
  return exp2(post.eye.x + shown - e);
}

// The scene as linear light ready for the curve.
fn sceneLight(uv: vec2f) -> vec3f {
  let c = textureSampleLevel(texA, samp, uv, 0.0).rgb;
  if (classic()) { return lin(c); }
  return max(c, vec3f(0.0)) * post.white.rgb * exposure();
}

// ---- Metering (new lighting only) ----

// The scene → 64 x 64: log2 of the brightness, 4 taps each, weighted to the
// middle of the picture (where you look) like a camera's centre metering.
@fragment
fn fs_meter(in: VsOut) -> @location(0) vec4f {
  let t = post.texel.xy;
  var s = 0.0;
  for (var k = 0; k < 4; k++) {
    let o = vec2f(f32(k & 1) - 0.5, f32(k >> 1) - 0.5) * t * 0.5;
    let c = textureSampleLevel(texA, samp, in.uv + o, 0.0).rgb;
    s += log2(max(luminance(c), 1e-5));
  }
  let d = in.uv - 0.5;
  let w = mix(1.0, 0.25, smoothstep(0.05, 0.45, dot(d, d) * 2.0));
  return vec4f(s * 0.25 * w, w, 0.0, 1.0);
}

// 64 x 64 → 8 x 8: each output averages its 8 x 8 block (weighted).
@fragment
fn fs_meter_down(in: VsOut) -> @location(0) vec4f {
  let base = vec2i(in.pos.xy) * 8;
  var s = vec2f(0.0);
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      s += textureLoad(texA, base + vec2i(x, y), 0).rg;
    }
  }
  return vec4f(s, 0.0, 1.0);
}

// 8 x 8 → the eye (1 x 1): the average brightness, clamped to what eyes can
// adapt to (so a dark corner stays dark, a bulb doesn't blind), eased from
// last frame's value over a second or so (faster to bright, slower to dark).
@fragment
fn fs_adapt(in: VsOut) -> @location(0) vec4f {
  var s = vec2f(0.0);
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      s += textureLoad(texA, vec2i(x, y), 0).rg;
    }
  }
  let goal = clamp(s.x / max(s.y, 1e-4), post.eye.y, post.eye.z);
  let last = textureLoad(texB, vec2i(0, 0), 0).r;
  if (post.eye.w > 0.5 || last != last) { return vec4f(goal, 0.0, 0.0, 1.0); }  // first frame (or a NaN)
  let tau = select(post.eye2.y, post.eye2.x, goal > last);
  let k = 1.0 - exp(-post.grade2.w / max(tau, 0.01));
  return vec4f(mix(last, goal, k), 0.0, 0.0, 1.0);
}

// A fixed exposure (eyes off: ?eyes=0): written straight into the eye.
@fragment
fn fs_fixed(in: VsOut) -> @location(0) vec4f {
  return vec4f(log2(0.18) - post.eye2.z, 0.0, 0.0, 1.0);
}

// ---- The curve: AgX (Troy Sobotka; the polynomial fit by Benjamin Wrensch) ----
// Bright colours fade toward white the way film and eyes see them (a red
// neon's core goes pink-white, not flat red), nothing clips.

fn agxContrast(x: vec3f) -> vec3f {
  let x2 = x * x;
  let x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}

fn agx(c: vec3f, room: f32) -> vec3f {
  let inset = mat3x3f(vec3f(0.842479062253094, 0.0423282422610123, 0.0423756549057051),
                      vec3f(0.0784335999999992, 0.878468636469772, 0.0784336),
                      vec3f(0.0792237451477643, 0.0791661274605434, 0.879142973793104));
  let outset = mat3x3f(vec3f(1.19687900512017, -0.0528968517574562, -0.0529716355144438),
                       vec3f(-0.0980208811401368, 1.15190312990417, -0.0980434501171241),
                       vec3f(-0.0990297440797205, -0.0989611768448433, 1.15107367264116));
  // `room` widens the range around middle grey (0.18 stays where it was).
  let range = 16.5 + room;
  let minEv = log2(0.18) - 0.6060606 * range;
  let maxEv = minEv + range;
  var x = inset * max(c, vec3f(1e-10));
  x = clamp((log2(x) - minEv) / (maxEv - minEv), vec3f(0.0), vec3f(1.0));
  x = agxContrast(x);
  // A touch of punch (the "golden"/"punchy" looks in between).
  let luma = luminance(x);
  x = luma + 1.12 * (pow(max(x, vec3f(0.0)), vec3f(1.08)) - luma);
  x = outset * x;
  return clamp(x, vec3f(0.0), vec3f(1.0));  // display-encoded (≈ gamma 2.2)
}

// The picture through the curve, then the mood.
@fragment
fn fs_composite(in: VsOut) -> @location(0) vec4f {
  var c: vec3f;
  if (classic()) {
    var lit = sceneLight(in.uv);
    // Bright light rolls off instead of clipping to flat white.
    lit = lit / (1.0 + max(lit - vec3f(0.85), vec3f(0.0)));
    c = pow(lit, vec3f(1.0 / 2.2));
  } else {
    let lit = sceneLight(in.uv);
    c = agx(lit, post.white.w);
    // Bright light keeps its colour (a lamp-lit wall stays amber instead of
    // going white): the curve on the brightness alone, times the colour.
    if (post.texel.z > 0.0) {
      let y = max(luminance(lit), 1e-6);
      let ty = pow(luminance(pow(agx(vec3f(y), post.white.w), vec3f(2.2))), 1.0 / 2.2);
      var hue = pow(pow(ty, 2.2) * lit / y, vec3f(1.0 / 2.2));
      hue = hue / max(1.0, max(hue.r, max(hue.g, hue.b)));
      c = mix(c, hue, post.texel.z);
    }
  }
  // Mood.
  c = c * post.grade.rgb;
  let luma = luminance(c);
  c = mix(vec3f(luma), c, post.grade.a);
  c = (c - 0.5) * post.grade2.x + 0.5;
  c = c + post.grade2.y * (1.0 - c);
  let d = in.uv - 0.5;
  let v = 1.0 - post.params.w * smoothstep(0.25, 0.85, dot(d, d) * 2.0);
  c = c * v;
  return vec4f(clamp(c, vec3f(0.0), vec3f(1.0)), 1.0);
}
