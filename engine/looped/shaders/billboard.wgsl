// Round pictures facing the camera (looped/billboard.*): the picture inside
// a circle, a colored rim around it, soft antialiased edges. Positions come
// in clip space from the CPU. Output is premultiplied alpha.

@group(0) @binding(0) var pictures: texture_2d_array<f32>;
@group(0) @binding(1) var pictureSampler: sampler;

struct VsIn {
  @location(0) clip: vec4f,
  @location(1) uv: vec2f,
  @location(2) layer: f32,
  @location(3) alpha: f32,
  @location(4) rim: vec4f,
};

struct VsOut {
  @builtin(position) clip: vec4f,
  @location(0) uv: vec2f,
  @location(1) @interpolate(flat) layer: i32,
  @location(2) alpha: f32,
  @location(3) rim: vec4f,
};

@vertex
fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.clip = in.clip;
  out.uv = in.uv;
  out.layer = i32(in.layer);
  out.alpha = in.alpha;
  out.rim = in.rim;
  return out;
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4f {
  let picture = textureSample(pictures, pictureSampler, in.uv, in.layer).rgb;
  let d = length(in.uv * 2.0 - 1.0);  // 0 in the middle, 1 at the edge
  let aa = max(fwidth(d), 0.002);
  let inside = 1.0 - smoothstep(1.0 - aa, 1.0, d);
  let rim = smoothstep(0.86 - aa, 0.86, d);
  let rgb = mix(picture, in.rim.rgb, rim);
  let a = inside * in.alpha;
  return vec4f(rgb * a, a);
}
