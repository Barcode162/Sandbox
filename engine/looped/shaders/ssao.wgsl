// Soft shade where things meet (ambient occlusion, J91; looped/ssao.h).
// Half the screen's size. fs_ao: for each pixel, its place in the world (from
// the prepass depth) and its surface direction; samples in a spiral around
// it within `radius` metres; every nearby surface in front of it closes in a
// little of the room's light (Alchemy / SAO). fs_blur: averages a 4 x 4
// block, only over neighbours at the same distance (edges stay sharp).
// Output: r = how much ambient and bounced light still reaches (0..1), g = the
// pixel's distance from the eye (the scene shader uses the shade only on the
// surface it was worked out for).

struct Ao {
  invViewProj: mat4x4f,
  viewProj: mat4x4f,
  eye: vec4f,     // xyz, w = frame number (turns the spiral)
  params: vec4f,  // x = radius (m), y = strength, z = pixels per metre at distance 1
  size: vec4f,    // width, height, 1 / width, 1 / height
};

@group(0) @binding(0) var<uniform> ao: Ao;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var normalTex: texture_2d<f32>;
@group(0) @binding(3) var rawTex: texture_2d<f32>;  // fs_blur: the shade before the blur

struct VsOut {
  @builtin(position) pos: vec4f,
};

@vertex
fn vs_full(@builtin(vertex_index) i: u32) -> VsOut {
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  var o: VsOut;
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  return o;
}

// The world position at pixel `px` (w = 0: nothing drawn there).
fn worldAt(px: vec2i) -> vec4f {
  let d = textureLoad(depthTex, px, 0);
  if (d >= 1.0) { return vec4f(0.0); }
  let uv = (vec2f(px) + 0.5) * ao.size.zw;
  let w = ao.invViewProj * vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, d, 1.0);
  return vec4f(w.xyz / w.w, 1.0);
}

// Noise per pixel (interleaved gradient noise), so neighbours sample apart
// and the blur evens it out.
fn noise(px: vec2f) -> f32 {
  return fract(52.9829189 * fract(dot(px, vec2f(0.06711056, 0.00583715))));
}

@fragment
fn fs_ao(in: VsOut) -> @location(0) vec4f {
  let px = vec2i(in.pos.xy);
  let p = worldAt(px);
  if (p.w < 0.5) { return vec4f(1.0, 0.0, 0.0, 1.0); }
  let n = normalize(textureLoad(normalTex, px, 0).xyz * 2.0 - 1.0);
  let dist = length(p.xyz - ao.eye.xyz);
  if (ao.params.y <= 0.0) { return vec4f(1.0, dist, 0.0, 1.0); }  // beams only (soft shade off)
  let radius = ao.params.x;
  // The radius on screen, in pixels (at least 2, at most a quarter screen).
  let r = clamp(radius * ao.params.z / max(dist, 0.1), 2.0, ao.size.y * 0.25);
  let turn = (noise(in.pos.xy) + ao.eye.w * 0.618034) * 6.2831853;
  let maxPx = vec2i(ao.size.xy) - 1;
  var sum = 0.0;
  let kSamples = 12;
  for (var i = 0; i < kSamples; i++) {
    let t = (f32(i) + 0.5) / f32(kSamples);
    let angle = turn + f32(i) * 2.3999632;  // the golden angle: an even spiral
    let off = vec2f(cos(angle), sin(angle)) * (r * t);
    let q = worldAt(clamp(px + vec2i(round(off)), vec2i(0), maxPx));
    if (q.w < 0.5) { continue; }
    let v = q.xyz - p.xyz;
    let vv = dot(v, v);
    // In front of the surface, near enough: closes in some of the room
    // (less the farther it is; nothing past the radius: no dark halos).
    let near = max(0.0, 1.0 - vv / (radius * radius));
    sum += max(0.0, dot(v, n) - 0.002 * dist) / (vv + 0.0025) * near;
  }
  let shade = clamp(1.0 - ao.params.y * radius * sum / f32(kSamples), 0.0, 1.0);
  return vec4f(shade, dist, 0.0, 1.0);
}

@fragment
fn fs_blur(in: VsOut) -> @location(0) vec4f {
  let px = vec2i(in.pos.xy);
  let c = textureLoad(rawTex, px, 0);
  if (c.g <= 0.0) { return c; }
  let maxPx = vec2i(ao.size.xy) - 1;
  var total = 0.0;
  var weight = 0.0;
  for (var y = -2; y < 2; y++) {
    for (var x = -2; x < 2; x++) {
      let s = textureLoad(rawTex, clamp(px + vec2i(x, y), vec2i(0), maxPx), 0);
      // Only neighbours at about the same distance (the same surface).
      let w = select(0.0, 1.0, abs(s.g - c.g) < 0.03 + 0.03 * c.g);
      total += s.r * w;
      weight += w;
    }
  }
  return vec4f(total / max(weight, 1.0), c.g, 0.0, 1.0);
}
