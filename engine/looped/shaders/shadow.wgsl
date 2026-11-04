// Soft round shadows on the floor (looped/shadows.*): under each avatar, a
// disc that's darkest in the middle and fades out to nothing at its rim.
// Positions come in clip space from the CPU. Output darkens what's below
// (premultiplied black).

struct VsIn {
  @location(0) clip: vec4f,
  @location(1) uv: vec2f,      // -1..1 across the disc
  @location(2) strength: f32,  // how dark the middle is (0..1)
};

struct VsOut {
  @builtin(position) clip: vec4f,
  @location(0) uv: vec2f,
  @location(1) strength: f32,
};

@vertex
fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.clip = in.clip;
  out.uv = in.uv;
  out.strength = in.strength;
  return out;
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4f {
  let d = length(in.uv);
  let a = in.strength * (1.0 - smoothstep(0.15, 1.0, d));
  return vec4f(0.0, 0.0, 0.0, a * a * (3.0 - 2.0 * a));
}
