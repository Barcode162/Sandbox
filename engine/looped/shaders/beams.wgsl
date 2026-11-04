// Light beams (J91.2; looped/beams.h): adds the beams, worked out at a
// quarter of the screen's size by fs_beams (scene.wgsl), onto the scene,
// softened (four bilinear taps around each pixel even out the per-pixel
// noise that hides the steps).

@group(0) @binding(0) var beamsTex: texture_2d<f32>;
@group(0) @binding(1) var beamsSampler: sampler;

struct VsOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs_full(@builtin(vertex_index) i: u32) -> VsOut {
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  var o: VsOut;
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  o.uv = vec2f(p.x, 1.0 - p.y);
  return o;
}

@fragment
fn fs_add(in: VsOut) -> @location(0) vec4f {
  let texel = 1.0 / vec2f(textureDimensions(beamsTex));
  var c = textureSampleLevel(beamsTex, beamsSampler, in.uv + vec2f(-0.75, -0.75) * texel, 0.0).rgb;
  c += textureSampleLevel(beamsTex, beamsSampler, in.uv + vec2f(0.75, -0.75) * texel, 0.0).rgb;
  c += textureSampleLevel(beamsTex, beamsSampler, in.uv + vec2f(-0.75, 0.75) * texel, 0.0).rgb;
  c += textureSampleLevel(beamsTex, beamsSampler, in.uv + vec2f(0.75, 0.75) * texel, 0.0).rgb;
  return vec4f(c * 0.25, 1.0);
}
