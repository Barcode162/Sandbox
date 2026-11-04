// Text shader: glyph quads sampling the signed-distance-field font atlas.
// Positions arrive already in clip space (the CPU places screen and world
// text), so there are no uniforms. Output is premultiplied alpha.

@group(0) @binding(0) var atlas: texture_2d<f32>;
@group(0) @binding(1) var atlasSampler: sampler;

struct VsIn {
  @location(0) clip: vec4f,
  @location(1) uv: vec2f,
  @location(2) outlineWidth: f32,  // font pixels
  @location(3) color: vec4f,
  @location(4) outline: vec4f,
};

struct VsOut {
  @builtin(position) clip: vec4f,
  @location(0) uv: vec2f,
  @location(1) outlineWidth: f32,
  @location(2) color: vec4f,
  @location(3) outline: vec4f,
};

@vertex
fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.clip = in.clip;
  out.uv = in.uv;
  out.outlineWidth = in.outlineWidth;
  out.color = in.color;
  out.outline = in.outline;
  return out;
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4f {
  // 0.5 is the glyph edge; the field spans +-1 font pixel (0..1).
  let d = textureSample(atlas, atlasSampler, in.uv).r;
  // Antialiasing: soften the edge over about one screen pixel.
  let aa = max(fwidth(d) * 0.75, 0.001);
  let fill = smoothstep(0.5 - aa, 0.5 + aa, d) * in.color.a;
  let edge = 0.5 - 0.5 * in.outlineWidth;
  let ring = smoothstep(edge - aa, edge + aa, d) * in.outline.a;
  // Fill drawn over its outline.
  let alpha = fill + ring * (1.0 - fill);
  let rgb = in.color.rgb * fill + in.outline.rgb * ring * (1.0 - fill);
  return vec4f(rgb, alpha);
}
