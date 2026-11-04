// Mirror glass. The reflection was already rendered into a texture covering
// the screen (into its top-left part at `params.w` of full resolution:
// sharp when you're close, cheaper far away), from a camera mirrored across
// the glass, so each pixel of the glass shows the matching (filtered) spot.

struct Mirror {
  viewProj: mat4x4f,
  center: vec4f,
  right: vec4f,   // xyz = half the width, along the glass
  up: vec4f,      // xyz = half the height
  params: vec4f,  // x = 1 when on (0 = dark glass), yz = 1 / screen size in pixels, w = resolution scale
};

@group(0) @binding(0) var<uniform> mirror: Mirror;
@group(0) @binding(1) var reflection: texture_2d<f32>;
@group(0) @binding(2) var reflectionSampler: sampler;

struct VsOut {
  @builtin(position) clip: vec4f,
  @location(0) local: vec2f,  // -1..1 across the glass
};

@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> VsOut {
  var corners = array<vec2f, 6>(vec2f(-1, -1), vec2f(1, -1), vec2f(1, 1), vec2f(-1, -1), vec2f(1, 1), vec2f(-1, 1));
  let c = corners[i];
  let p = mirror.center.xyz + mirror.right.xyz * c.x + mirror.up.xyz * c.y;
  var out: VsOut;
  out.clip = mirror.viewProj * vec4f(p, 1.0);
  out.local = c;
  return out;
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4f {
  let image = textureSampleLevel(reflection, reflectionSampler, in.clip.xy * mirror.params.yz * mirror.params.w, 0.0).rgb;
  // A faint sheen toward the edges, like real glass.
  let edge = max(abs(in.local.x), abs(in.local.y));
  let sheen = smoothstep(0.85, 1.0, edge) * 0.05;
  let off = vec3f(0.035, 0.04, 0.045) * (1.2 - 0.4 * in.local.y);
  let rgb = select(off, image * vec3f(0.93, 0.96, 0.97), mirror.params.x > 0.5);
  return vec4f(rgb + sheen, 1.0);
}
