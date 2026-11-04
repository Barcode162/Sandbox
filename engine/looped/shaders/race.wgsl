// The racing world: outdoor lighting (sun + sky), physically based shading
// (GGX), procedural surface detail per material (asphalt grain, mowed
// grass, gravel, clear-coated car paint, glass), soft shadows under the
// cars, haze, a sky with a sun, and tone mapping.

struct Frame {
  viewProj: mat4x4f,
  camPos: vec4f,
  sunDir: vec4f,      // xyz = toward the sun, w = sun strength
  sunColor: vec4f,
  skyTop: vec4f,
  skyHorizon: vec4f,
  groundColor: vec4f,
  fog: vec4f,         // x = density, y = height falloff, z = time (s)
  camRight: vec4f,    // w = tan(half fov) * aspect
  camUp: vec4f,       // w = tan(half fov)
  camForward: vec4f,
  cars: array<vec4f, 16>,  // x, y, z, heading of each car (w > 9 = unused)
  carCount: vec4u,
};

struct Object {
  model: mat4x4f,
  tint: vec4f,     // rgb = paint color for car-paint parts (a > 0 = use it)
  params: vec4f,   // x = glow multiplier for lights
};

@group(0) @binding(0) var<uniform> frame: Frame;
@group(1) @binding(0) var<uniform> object: Object;

struct VsIn {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) material: u32,
};

struct VsOut {
  @builtin(position) clip: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) @interpolate(flat) material: u32,
};

@vertex
fn vs_main(in: VsIn) -> VsOut {
  let world = object.model * vec4f(in.position, 1.0);
  var out: VsOut;
  out.clip = frame.viewProj * world;
  out.worldPos = world.xyz;
  out.normal = (object.model * vec4f(in.normal, 0.0)).xyz;
  out.color = in.color;
  out.material = in.material;
  return out;
}

// --- Noise for surface detail.
fn hash2(p: vec2f) -> f32 {
  let q = fract(p * vec2f(123.34, 456.21));
  let r = q + dot(q, q + 45.32);
  return fract(r.x * r.y);
}
fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2f(1.0, 0.0)), u.x),
             mix(hash2(i + vec2f(0.0, 1.0)), hash2(i + vec2f(1.0, 1.0)), u.x), u.y);
}
fn fbm(p: vec2f) -> f32 {
  return 0.5 * noise(p) + 0.25 * noise(p * 2.03 + 7.1) + 0.125 * noise(p * 4.01 + 3.3);
}

// --- Sky: blue overhead, pale at the horizon, a bright sun with a halo.
fn skyColor(dir: vec3f) -> vec3f {
  let up = clamp(dir.y, -0.2, 1.0);
  var c = mix(frame.skyHorizon.rgb, frame.skyTop.rgb, pow(max(up, 0.0), 0.55));
  if (up < 0.0) {
    c = mix(frame.skyHorizon.rgb, frame.groundColor.rgb * 0.6, clamp(-up * 5.0, 0.0, 1.0));
  }
  let s = max(dot(dir, frame.sunDir.xyz), 0.0);
  c += frame.sunColor.rgb * (pow(s, 600.0) * 40.0 + pow(s, 12.0) * 0.25);
  return c;
}

fn tonemap(x: vec3f) -> vec3f {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), vec3f(0.0), vec3f(1.0));
}

fn fresnel(f0: vec3f, vh: f32) -> vec3f {
  return f0 + (vec3f(1.0) - f0) * pow(1.0 - vh, 5.0);
}

// Soft shadow from the cars (a blurred box under each), for ground surfaces.
fn carShadow(p: vec3f) -> f32 {
  var shade = 1.0;
  for (var i = 0u; i < frame.carCount.x; i++) {
    let c = frame.cars[i];
    let d = p - c.xyz;
    if (abs(d.y) > 1.5 || dot(d.xz, d.xz) > 16.0) { continue; }
    // Into the car's frame (heading about +y, forward = -z).
    let s = sin(c.w);
    let k = cos(c.w);
    // Shift the shadow a little away from the sun.
    let q = d.xz + frame.sunDir.xz * 0.35;
    let local = vec2f(k * q.x - s * q.y, s * q.x + k * q.y);
    let box = vec2f(1.0, 2.3);
    let outside = max(abs(local) - box, vec2f(0.0));
    let dist = length(outside) + min(max(abs(local.x) - box.x, abs(local.y) - box.y), 0.0);
    shade = min(shade, mix(0.35, 1.0, smoothstep(-0.5, 0.45, dist)));
  }
  return shade;
}

struct Look {
  base: vec3f,
  roughness: f32,
  metallic: f32,
  emissive: vec3f,
  clearcoat: f32,
  ground: bool,
};

fn surfaceLook(material: u32, color: vec3f, p: vec3f, n: vec3f) -> Look {
  var l: Look;
  l.base = color;
  l.roughness = 0.7;
  l.metallic = 0.0;
  l.emissive = vec3f(0.0);
  l.clearcoat = 0.0;
  l.ground = false;
  switch material {
    case 1u: {  // asphalt: fine grain, patches, a darker rubbered-in line
      let grain = noise(p.xz * 9.0) * 0.5 + noise(p.xz * 37.0) * 0.5;
      let patches = fbm(p.xz * 0.15);
      l.base = color * (0.75 + 0.45 * grain) * (0.85 + 0.3 * patches);
      l.roughness = 0.82 - 0.1 * patches;
      l.ground = true;
    }
    case 2u: {  // grass: mowing stripes and clumps
      let stripes = 0.88 + 0.12 * step(0.0, sin((p.x + p.z) * 0.35));
      let clumps = fbm(p.xz * 0.4) * 0.6 + noise(p.xz * 6.0) * 0.4;
      l.base = color * stripes * (0.7 + 0.6 * clumps);
      l.roughness = 0.95;
      l.ground = true;
    }
    case 3u: {  // gravel
      let g = noise(p.xz * 22.0) * 0.6 + noise(p.xz * 61.0) * 0.4;
      l.base = color * (0.65 + 0.7 * g);
      l.roughness = 1.0;
      l.ground = true;
    }
    case 4u: {  // curbs: painted, a bit worn
      l.base = color * (0.85 + 0.15 * noise(p.xz * 13.0));
      l.roughness = 0.55;
      l.ground = true;
    }
    case 5u: {  // road paint
      l.base = color * (0.85 + 0.15 * noise(p.xz * 20.0));
      l.roughness = 0.6;
      l.ground = true;
    }
    case 6u: {  // car paint: base coat + clear coat
      if (object.tint.a > 0.0) { l.base = object.tint.rgb; }
      l.roughness = 0.38;
      l.metallic = 0.25;
      l.clearcoat = 1.0;
    }
    case 7u: {  // glass
      l.base = vec3f(0.01);
      l.roughness = 0.04;
      l.clearcoat = 1.0;
    }
    case 8u: { l.roughness = 0.85; }  // rubber
    case 9u: {  // metal (rims: tinted per car when the object has a tint)
      if (object.tint.a > 0.0) { l.base = object.tint.rgb; }
      l.roughness = 0.32;
      l.metallic = 1.0;
    }
    case 10u: {  // lights
      let glow = select(1.0, object.params.x, object.params.x > 0.0);
      l.emissive = color * glow;
      l.base = color * 0.2;
      l.roughness = 0.2;
    }
    case 11u: {  // foliage
      l.base = color * (0.7 + 0.6 * noise(p.xz * 3.0 + p.y * 2.0));
      l.roughness = 0.9;
    }
    case 12u: {
      l.base = color * (0.8 + 0.4 * noise(p.xz * 5.0));
      l.roughness = 0.95;
      l.ground = true;
    }
    default: {}
  }
  return l;
}

@fragment
fn fs_main(in: VsOut, @builtin(front_facing) front: bool) -> @location(0) vec4f {
  var n = normalize(in.normal);
  if (!front) { n = -n; }
  let toCam = frame.camPos.xyz - in.worldPos;
  let dist = length(toCam);
  let v = toCam / dist;
  let look = surfaceLook(in.material, in.color, in.worldPos, n);

  let l = frame.sunDir.xyz;
  let h = normalize(l + v);
  let nl = max(dot(n, l), 0.0);
  let nv = max(dot(n, v), 1e-3);
  let nh = max(dot(n, h), 0.0);
  let vh = max(dot(v, h), 0.0);

  var shadow = 1.0;
  if (look.ground) { shadow = carShadow(in.worldPos); }

  let f0 = mix(vec3f(0.04), look.base, look.metallic);
  let diffuseColor = look.base * (1.0 - look.metallic);
  // GGX specular (sun).
  let a = max(look.roughness * look.roughness, 0.002);
  let a2 = a * a;
  let d = a2 / (3.14159 * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0));
  let k = (look.roughness + 1.0) * (look.roughness + 1.0) / 8.0;
  let g = (nl / (nl * (1.0 - k) + k)) * (nv / (nv * (1.0 - k) + k));
  let f = fresnel(f0, vh);
  let spec = d * g * f / max(4.0 * nl * nv, 1e-3);
  let sun = frame.sunColor.rgb * frame.sunDir.w * nl * shadow;
  var color = (diffuseColor / 3.14159 * (vec3f(1.0) - f) + spec) * sun;

  // Sky light: blue from above, bounced green/brown from below.
  let skyLight = mix(frame.groundColor.rgb, frame.skyTop.rgb * 1.2 + frame.skyHorizon.rgb * 0.4, n.y * 0.5 + 0.5);
  color += diffuseColor * skyLight * mix(0.55, 1.0, shadow);
  // Reflections of the sky (glossy surfaces, clear coat, glass).
  let r = reflect(-v, n);
  let envF = fresnel(f0, nv);
  let gloss = (1.0 - look.roughness) * (1.0 - look.roughness);
  color += skyColor(r) * envF * gloss * mix(0.6, 1.0, shadow);
  if (look.clearcoat > 0.0) {
    let cc = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
    let ccSpec = pow(nh, 400.0) * 30.0 * nl;
    color = color * (1.0 - cc * 0.5) + (skyColor(r) * cc + frame.sunColor.rgb * ccSpec * shadow) * look.clearcoat;
  }
  color += look.emissive;

  // Haze: thicker low down, tinted by the sun when looking toward it.
  let fogAmount = 1.0 - exp(-dist * frame.fog.x * exp(-max(in.worldPos.y, 0.0) * frame.fog.y));
  let sunScatter = pow(max(dot(-v, frame.sunDir.xyz), 0.0), 8.0);
  let fogColor = frame.skyHorizon.rgb + frame.sunColor.rgb * sunScatter * 0.3;
  color = mix(color, fogColor, fogAmount);
  return vec4f(pow(tonemap(color), vec3f(1.0 / 2.2)), 1.0);
}

// --- Sky pass: a full-screen triangle behind everything.
struct SkyOut {
  @builtin(position) clip: vec4f,
  @location(0) ndc: vec2f,
};

@vertex
fn vs_sky(@builtin(vertex_index) i: u32) -> SkyOut {
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u)) * 2.0 - 1.0;
  var out: SkyOut;
  out.clip = vec4f(p, 1.0, 1.0);
  out.ndc = p;
  return out;
}

@fragment
fn fs_sky(in: SkyOut) -> @location(0) vec4f {
  let dir = normalize(frame.camForward.xyz + frame.camRight.xyz * (in.ndc.x * frame.camRight.w) +
                      frame.camUp.xyz * (in.ndc.y * frame.camUp.w));
  return vec4f(pow(tonemap(skyColor(dir)), vec3f(1.0 / 2.2)), 1.0);
}
