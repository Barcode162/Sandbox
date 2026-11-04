// Bounced light on the GPU (looped/gi.h, docs/handbook/manual/light.md → Bounced light).
// Build (once per layout, in slices over a few frames):
//   trace_patches  each patch's rays → the patch each one meets
//   trace_lamps    each patch × lamp: light falling on it per candela (0 = hidden)
//   trace_probes   each probe's rays → the patch each one meets (or "back of a
//                  surface" / nothing); probe_check marks probes inside walls;
//                  probe_lamps: which lamps each probe sees (no light through walls)
// Every frame:
//   bounce         each patch's light = its glow + what it reflects of the lamps
//                  and of the patches it sees (one more bounce each frame)
//   probes         each probe's light from every direction, as spherical
//                  harmonics (L1) in three 3D textures the scene reads

const kMiss = 0xffffffffu;
const kBack = 0xfffffffeu;
const kBuckets = 131072u;   // looped/radiosity.cpp kBuckets
const kPi = 3.14159265;

struct Params {
  counts: vec4u,     // x = patches, y = probes, z = lamps, w = rays per patch
  counts2: vec4u,    // x = rays per probe, y = first item of this slice, z = items in this slice, w = probes along x
  grid: vec4f,       // xyz = probe (0,0,0), w = probe spacing
  grid2: vec4u,      // x, y, z = probes along x, y, z
  misc: vec4f,       // x = hash cell size, y = max ray length, z = glow units (cd/m² per unit), w = bounce strength
};

// Must match GpuLight in looped/scene_renderer.h byte for byte.
struct Light {
  position: vec4f,  // xyz, reach
  color: vec4f,     // rgb (luminance 1), candela (with its loop)
  params: vec4f,    // x = radius of the glowing part
  axis: vec4f,      // xyz = half a tube's length / a panel's first side; w = shape (0 ball, 1 tube, 2 panel)
  axis2: vec4f,     // xyz = half a panel's second side
};
const kMaxLights = 255u;  // looped/scene_renderer.h
const kMaskLamps = 127u;  // lamps the probes keep track of (looped/gi.h kMaskLamps)
const kMaxGridCells = 2304u;  // 48 x 48 (looped/scene_renderer.h kGridSide)
struct Lighting {
  lightCount: vec4u,
  grid: vec4f,
  gridSize: vec4u,
  lights: array<Light, kMaxLights>,
  cells: array<vec4u, kMaxGridCells>,
};

struct Patch {
  position: vec4f,  // xyz
  normal: vec4f,    // xyz
  albedo: vec4f,    // rgb
  emission: vec4f,  // rgb (glTF units)
};

// Group 0 (build): the ray tree, the patches and their hash, an output.
// Per frame, group 0 holds only P and the patches.
@group(0) @binding(0) var<uniform> P: Params;
@group(0) @binding(1) var<storage, read> nodes: array<vec4f>;    // 2 per node: min + leftOrFirst, max + count
@group(0) @binding(2) var<storage, read> tris: array<vec4f>;     // 3 per triangle: a, e1, e2
@group(0) @binding(3) var<storage, read> patches: array<Patch>;
@group(0) @binding(4) var<storage, read> bucketStart: array<u32>;  // kBuckets + 1
@group(0) @binding(5) var<storage, read> bucketItems: array<u32>;
@group(0) @binding(6) var<storage, read_write> hits: array<u32>;   // trace_patches / trace_probes output
@group(0) @binding(7) var<storage, read_write> values: array<f32>; // trace_lamps: factors
@group(0) @binding(8) var maskTex: texture_storage_3d<rgba32uint, write>;  // probe_lamps: which lamps each probe sees (giMaskBit)
// Group 1: the scene's lamps (looped/scene_renderer.h LightingUniforms).
@group(1) @binding(0) var<uniform> lighting: Lighting;

// ---- Rays through the box tree (looped/bvh.h, same layout) ----

struct Hit {
  t: f32,
  n: vec3f,    // the triangle's normal (winding), not facing-corrected
  back: bool,
  found: bool,
};

fn boxEnter(lo: vec3f, hi: vec3f, o: vec3f, inv: vec3f, tMax: f32) -> f32 {
  let a = (lo - o) * inv;
  let b = (hi - o) * inv;
  let n = min(a, b);
  let f = max(a, b);
  let t0 = max(max(n.x, n.y), max(n.z, 0.0));
  let t1 = min(min(f.x, f.y), min(f.z, tMax));
  return select(1e30, t0, t0 <= t1);
}

fn safeInv(d: vec3f) -> vec3f {
  return 1.0 / select(d, vec3f(1e-12), abs(d) < vec3f(1e-12));
}

fn intersect(o: vec3f, d: vec3f, tMin: f32, tMax: f32, anyHit: bool) -> Hit {
  var hit: Hit;
  hit.found = false;
  hit.t = tMax;
  let inv = safeInv(d);
  var stack: array<u32, 48>;
  var stackT: array<f32, 48>;
  var sp = 0u;
  var node = 0u;
  if (boxEnter(nodes[0].xyz, nodes[1].xyz, o, inv, tMax) >= 1e29) { return hit; }
  loop {
    let a = nodes[2u * node];
    let b = nodes[2u * node + 1u];
    let count = bitcast<u32>(b.w);
    let first = bitcast<u32>(a.w);
    var descend = false;
    if (count > 0u) {
      for (var i = first; i < first + count; i++) {
        let ta = tris[3u * i].xyz;
        let e1 = tris[3u * i + 1u].xyz;
        let e2 = tris[3u * i + 2u].xyz;
        let p = cross(d, e2);
        let det = dot(e1, p);
        if (abs(det) < 1e-10) { continue; }
        let invDet = 1.0 / det;
        let s = o - ta;
        let u = dot(s, p) * invDet;
        if (u < 0.0 || u > 1.0) { continue; }
        let q = cross(s, e1);
        let v = dot(d, q) * invDet;
        if (v < 0.0 || u + v > 1.0) { continue; }
        let t = dot(e2, q) * invDet;
        if (t <= tMin || t >= hit.t) { continue; }
        hit.t = t;
        hit.found = true;
        hit.back = det < 0.0;
        hit.n = normalize(cross(e1, e2));
        if (anyHit) { return hit; }
      }
    } else {
      let l = first;
      let r = first + 1u;
      let tl = boxEnter(nodes[2u * l].xyz, nodes[2u * l + 1u].xyz, o, inv, hit.t);
      let tr = boxEnter(nodes[2u * r].xyz, nodes[2u * r + 1u].xyz, o, inv, hit.t);
      if (tl < 1e29 || tr < 1e29) {
        descend = true;
        if (tl >= 1e29) {
          node = r;
        } else if (tr >= 1e29) {
          node = l;
        } else {
          let leftFirst = tl <= tr;
          if (sp < 48u) {
            stack[sp] = select(l, r, leftFirst);
            stackT[sp] = select(tl, tr, leftFirst);
            sp++;
          }
          node = select(r, l, leftFirst);
        }
      }
    }
    if (descend) { continue; }
    // The next deferred node still nearer than the best hit.
    var next = false;
    loop {
      if (sp == 0u) { break; }
      sp--;
      if (stackT[sp] < hit.t) {
        node = stack[sp];
        next = true;
        break;
      }
    }
    if (!next) { break; }
  }
  return hit;
}

// ---- Finding the patch at a point (the hash of looped/radiosity.cpp) ----

fn bucketOf(x: i32, y: i32, z: i32) -> u32 {
  return ((u32(x) * 73856093u) ^ (u32(y) * 19349663u) ^ (u32(z) * 83492791u)) & (kBuckets - 1u);
}

fn patchAt(p: vec3f, n: vec3f) -> u32 {
  let cell = P.misc.x;
  let c = vec3i(floor(p / cell));
  var best = kMiss;
  var anyBest = kMiss;
  var bestD = 1e30;
  var anyD = 1e30;
  let limit = 9.0 * cell * cell;
  for (var dz = -1; dz <= 1; dz++) {
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        let b = bucketOf(c.x + dx, c.y + dy, c.z + dz);
        for (var k = bucketStart[b]; k < bucketStart[b + 1u]; k++) {
          let s = bucketItems[k];
          let d = patches[s].position.xyz - p;
          let d2 = dot(d, d);
          if (d2 > limit) { continue; }
          if (dot(patches[s].normal.xyz, n) > 0.5) {
            if (d2 < bestD) { bestD = d2; best = s; }
          } else if (d2 < anyD) {
            anyD = d2;
            anyBest = s;
          }
        }
      }
    }
  }
  return select(anyBest, best, best != kMiss);
}

// ---- The same "random" numbers as looped/radiosity.cpp ----

fn hash(xIn: u32) -> u32 {
  var x = xIn;
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}
fn rand01(x: u32) -> f32 { return f32(hash(x) >> 8u) * (1.0 / 16777216.0); }
fn radicalInverse(bitsIn: u32) -> f32 { return f32(reverseBits(bitsIn)) * 2.3283064365386963e-10; }

fn tangentFrame(n: vec3f) -> mat3x3f {
  let up = select(vec3f(1.0, 0.0, 0.0), vec3f(0.0, 1.0, 0.0), abs(n.y) < 0.9);
  let t = normalize(cross(up, n));
  let b = cross(n, t);
  return mat3x3f(t, b, n);
}

// ---- Build passes (one thread per ray; a slice of the rays per dispatch) ----

@compute @workgroup_size(64)
fn trace_patches(@builtin(global_invocation_id) id: vec3u) {
  let item = P.counts2.y + id.x;
  if (id.x >= P.counts2.z) { return; }
  let rays = P.counts.w;
  let s = item / rays;
  let k = item % rays;
  if (s >= P.counts.x) { return; }
  let pa = patches[s];
  let n = pa.normal.xyz;
  let o1 = rand01(s * 3u + 11u);
  let o2 = rand01(s * 3u + 12u);
  var u1 = (f32(k) + 0.5) / f32(rays) + o1;
  var u2 = radicalInverse(k) + o2;
  u1 = u1 - floor(u1);
  u2 = u2 - floor(u2);
  let r = sqrt(u1);
  let phi = 6.2831853 * u2;
  let dir = normalize(tangentFrame(n) * vec3f(r * cos(phi), r * sin(phi), sqrt(max(0.0, 1.0 - u1))));
  let origin = pa.position.xyz + n * 0.01;
  let h = intersect(origin, dir, 0.0, P.misc.y, false);
  var result = kMiss;
  if (h.found && !h.back) { result = patchAt(origin + dir * h.t, h.n); }
  hits[item] = result;
}

fn lampVisible(origin: vec3f, l: Light) -> bool {
  let d = l.position.xyz - origin;
  let dist = length(d);
  if (dist < 1e-4) { return true; }
  let tMax = dist - l.params.x - 0.12;
  if (tMax <= 0.02) { return true; }
  return !intersect(origin, d / dist, 0.02, tMax, true).found;
}

@compute @workgroup_size(64)
fn trace_lamps(@builtin(global_invocation_id) id: vec3u) {
  let item = P.counts2.y + id.x;
  if (id.x >= P.counts2.z) { return; }
  let lamps = P.counts.z;
  let s = item / lamps;
  let l = item % lamps;
  if (s >= P.counts.x) { return; }
  let pa = patches[s];
  let light = lighting.lights[l];
  let d = light.position.xyz - pa.position.xyz;
  let d2 = dot(d, d);
  let cosT = dot(pa.normal.xyz, d) / max(sqrt(d2), 1e-6);
  var factor = 0.0;
  if (cosT > 0.0) {
    let r = light.params.x;
    factor = cosT / max(d2, r * r);
    if (factor < 1e-4 || !lampVisible(pa.position.xyz + pa.normal.xyz * 0.03, light)) { factor = 0.0; }
  }
  values[item] = factor;
}

fn probePosition(i: u32) -> vec3f {
  let nx = P.grid2.x;
  let ny = P.grid2.y;
  let x = i % nx;
  let y = (i / nx) % ny;
  let z = i / (nx * ny);
  return P.grid.xyz + vec3f(f32(x), f32(y), f32(z)) * P.grid.w;
}

fn probeDir(k: u32) -> vec3f {
  let n = P.counts2.x;
  let y = 1.0 - 2.0 * (f32(k) + 0.5) / f32(n);
  let r = sqrt(max(0.0, 1.0 - y * y));
  let phi = f32(k) * 2.39996323;
  return vec3f(r * cos(phi), y, r * sin(phi));
}

@compute @workgroup_size(64)
fn trace_probes(@builtin(global_invocation_id) id: vec3u) {
  let item = P.counts2.y + id.x;
  if (id.x >= P.counts2.z) { return; }
  let rays = P.counts2.x;
  let i = item / rays;
  let k = item % rays;
  if (i >= P.counts.y) { return; }
  let p = probePosition(i);
  let dir = probeDir(k);
  let h = intersect(p, dir, 0.0, P.misc.y, false);
  var result = kMiss;
  if (h.found) { result = select(patchAt(p + dir * h.t, h.n), kBack, h.back); }
  hits[item] = result;
}

// One thread per probe: usable (bit 31) unless it's inside a wall (many rays
// meet backs of surfaces) or outside the building (most rays meet nothing);
// then which lamps it sees. `values` holds the masks as bits.
@compute @workgroup_size(64)
fn probe_lamps(@builtin(global_invocation_id) id: vec3u) {
  let i = P.counts2.y + id.x;
  if (id.x >= P.counts2.z || i >= P.counts.y) { return; }
  let rays = P.counts2.x;
  var back = 0u;
  var hitCount = 0u;
  for (var k = 0u; k < rays; k++) {
    let h = hits[i * rays + k];
    if (h == kBack) { back++; }
    if (h != kMiss) { hitCount++; }
  }
  // Four words (J88.1): x bit 31 = the probe is usable, x bits 0-30 =
  // lamps 0-30, y, z, w = lamps 31-126 (32 each).
  var mask = vec4u(0u);
  if (back * 4u < rays && hitCount * 2u > rays) {
    mask.x = 0x80000000u;
    let p = probePosition(i);
    for (var l = 0u; l < P.counts.z && l < kMaskLamps; l++) {
      if (lampVisible(p, lighting.lights[l])) {
        if (l < 31u) { mask.x |= 1u << l; }
        else { mask[1u + (l - 31u) / 32u] |= 1u << ((l - 31u) % 32u); }
      }
    }
  }
  let nx = P.grid2.x;
  let ny = P.grid2.y;
  textureStore(maskTex, vec3u(i % nx, (i / nx) % ny, i / (nx * ny)), mask);
}

// ---- Every frame ----

@group(2) @binding(0) var<storage, read> factors: array<f32>;     // patches × lamps (trace_lamps)
@group(2) @binding(1) var<storage, read> patchHits: array<u32>;   // trace_patches
@group(2) @binding(2) var<storage, read> lightIn: array<vec4f>;   // last frame's light per patch
@group(2) @binding(3) var<storage, read_write> lightOut: array<vec4f>;

@compute @workgroup_size(64)
fn bounce(@builtin(global_invocation_id) id: vec3u) {
  let s = id.x;
  if (s >= P.counts.x) { return; }
  let lamps = P.counts.z;
  var direct = vec3f(0.0);
  for (var l = 0u; l < lamps; l++) {
    let f = factors[s * lamps + l];
    if (f > 0.0) {
      let light = lighting.lights[l];
      direct += light.color.rgb * light.color.w * f;
    }
  }
  let rays = P.counts.w;
  var seen = vec3f(0.0);
  for (var k = 0u; k < rays; k++) {
    let h = patchHits[s * rays + k];
    if (h < kBack) { seen += lightIn[h].rgb; }
  }
  seen = seen / f32(rays) * P.misc.w;
  let pa = patches[s];
  lightOut[s] = vec4f(pa.albedo.rgb * (direct / kPi + seen) + pa.emission.rgb * P.misc.z, 1.0);
}

@group(3) @binding(0) var<storage, read> probeHits: array<u32>;
@group(3) @binding(1) var shR: texture_storage_3d<rgba16float, write>;
@group(3) @binding(2) var shG: texture_storage_3d<rgba16float, write>;
@group(3) @binding(3) var shB: texture_storage_3d<rgba16float, write>;

// Each probe: the light arriving from every direction, as four numbers per
// colour (spherical harmonics, order 1: the average and a direction).
@compute @workgroup_size(64)
fn probes(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= P.counts.y) { return; }
  let rays = P.counts2.x;
  var r = vec4f(0.0);
  var g = vec4f(0.0);
  var b = vec4f(0.0);
  for (var k = 0u; k < rays; k++) {
    let h = probeHits[i * rays + k];
    if (h >= kBack) { continue; }
    let L = lightIn[h].rgb;
    let d = probeDir(k);
    let y = vec4f(0.282095, 0.488603 * d.y, 0.488603 * d.z, 0.488603 * d.x);
    r += L.r * y;
    g += L.g * y;
    b += L.b * y;
  }
  let w = 4.0 * kPi / f32(rays);
  let nx = P.grid2.x;
  let ny = P.grid2.y;
  let c = vec3u(i % nx, (i / nx) % ny, i / (nx * ny));
  textureStore(shR, c, r * w);
  textureStore(shG, c, g * w);
  textureStore(shB, c, b * w);
}
