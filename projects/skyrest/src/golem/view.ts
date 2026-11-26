// src/golem/view.ts — owned by WO-004. The Stone Guardian on screen: 14 mossy boulders posed by golem/pose.ts,
// original glowing runes and eyes driven by `glow` (rest pulse, windup flare on the attacking limb, P2 red-hot with
// white cores and torso cracks, stagger flicker, death flash → dead grey), hit flash + part jolt, daze stars,
// the tossed boulder's arc, telegraph decals that fill to 100 % on the strike frame, shockwave rings mirrored
// from state.hazards, slam crack marks, the death crumble (bounce once, settle, sink) and the coin fountain.
// Everything that moves is a function of sim state + time, so moments and manual stepping render exactly.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CreateGolemView, FrameInfo, Quality, RenderContext, SimEventOf } from '../contracts.ts';
import { lerp, lerpAngle } from '../core/math.ts';
import { PALETTE } from '../tuning/world.ts';
import { GOLEM } from '../tuning/golem.ts';
import { glowSprite, toonMaterial } from '../render/materials.ts';
import { groundHeight } from '../world/ground.ts';
import { PARTS, partGeometry, runeMaterial, runeTexture, type RuneGlyph, type RuneGroup } from './parts.ts';
import { assembly, computePose, createPose, PART_COUNT, POSE_STRIDE } from './pose.ts';
import { gx } from './sim.ts';
import { coinWorld, golemBurst, golemBurstTime, handoffTime, minionBurstTime, MINION_BURST, type CoinBurst } from './coins.ts';

/** World-space anchor for the boss nameplate (top of the silhouette + margin); the UI reads it every frame. */
export const golemAnchor = { x: 0, y: 4, z: 0, visible: false };

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeOutBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
function hash(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const COL = {
  rune: new THREE.Color(PALETTE.rune),
  runeCore: new THREE.Color(PALETTE.runeCore),
  runeHot: new THREE.Color(PALETTE.runeHot),
  white: new THREE.Color(0xffffff),
  dead: new THREE.Color(0x4a4644),
  eye: new THREE.Color(PALETTE.eye),
  telegraph: new THREE.Color(0xff7a3c),
};

// ── decals ────────────────────────────────────────────────────────────────────────────────────────────
const DECAL_RINGS = 14, DECAL_SEGS = 72;

/** Polar grid whose world positions are conformed to the dome when it moves; aPolar = (r01, angle). */
function polarGeometry(rings: number, segs: number, inner = 0): THREE.BufferGeometry {
  const n = (rings + 1) * (segs + 1);
  const pos = new Float32Array(n * 3), polar = new Float32Array(n * 2);
  const idx: number[] = [];
  for (let r = 0; r <= rings; r++) {
    for (let s = 0; s <= segs; s++) {
      const i = r * (segs + 1) + s;
      polar[i * 2] = inner + (1 - inner) * (r / rings);
      polar[i * 2 + 1] = (s / segs) * Math.PI * 2 - Math.PI;
      if (r < rings && s < segs) {
        const a = i, b = i + 1, c = i + segs + 1, d = c + 1;
        idx.push(a, b, c, b, d, c); // counter-clockwise seen from above (normal +y)
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aPolar', new THREE.BufferAttribute(polar, 2));
  g.setIndex(idx);
  return g;
}

/** Writes world positions for a polar grid centred at (cx, cz), radius rad, rotated by `facing`, on the dome. */
function conform(g: THREE.BufferGeometry, cx: number, cz: number, rad: number, facing: number, lift: number): void {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const pol = g.getAttribute('aPolar') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const r = pol.getX(i) * rad, a = pol.getY(i) + facing;
    const x = cx + Math.sin(a) * r, z = cz - Math.cos(a) * r;
    pos.setXYZ(i, x, groundHeight(x, z) + lift, z);
  }
  pos.needsUpdate = true;
  g.computeBoundingSphere();
}

const DECAL_VERT = /* glsl */ `
  attribute vec2 aPolar; varying vec2 vPolar;
  void main() { vPolar = aPolar; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

function decalMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uFill: { value: 0 }, uHalfArc: { value: Math.PI }, uColor: { value: COL.telegraph.clone() }, uAlpha: { value: 1 }, uFlash: { value: 0 }, uRad: { value: 2 } },
    vertexShader: DECAL_VERT,
    fragmentShader: /* glsl */ `
      uniform float uFill; uniform float uHalfArc; uniform vec3 uColor; uniform float uAlpha; uniform float uFlash; uniform float uRad;
      varying vec2 vPolar;
      void main() {
        float r = vPolar.x; float a = abs(vPolar.y);
        if (a > uHalfArc) discard;
        float px = 1.0 / (uRad * 40.0);                       // ~2.5 cm in r01 units
        float filled = step(r, uFill);
        float lead = smoothstep(uFill - 0.12, uFill, r) * filled;
        float al = mix(0.16, 0.5, filled) + lead * 0.35;
        vec3 c = mix(uColor, vec3(1.0, 0.86, 0.6), lead * 0.6);
        float rim = smoothstep(1.0 - 4.0 * px, 1.0 - 1.5 * px, r);
        float side = uHalfArc < 3.1 ? smoothstep(4.0 * px, 1.5 * px, (uHalfArc - a) * max(r, 0.05)) : 0.0;
        float line = max(rim, side);
        c = mix(c, vec3(1.0), line);
        al = max(al, line * 0.95);
        c = mix(c, vec3(1.0), uFlash);
        gl_FragColor = vec4(c * 1.15, al * uAlpha);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  });
}

function ringMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uAlpha: { value: 1 }, uColor: { value: COL.telegraph.clone() } },
    vertexShader: DECAL_VERT,
    fragmentShader: /* glsl */ `
      uniform float uAlpha; uniform vec3 uColor; varying vec2 vPolar;
      void main() {
        float b = 1.0 - abs(vPolar.x * 2.0 - 1.0);           // 0 at the band edges, 1 in its middle
        float core = smoothstep(0.55, 0.95, b);
        vec3 c = mix(uColor * 1.6, vec3(1.4, 1.35, 1.25), core);
        gl_FragColor = vec4(c, smoothstep(0.0, 0.35, b) * uAlpha);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  });
}

/** Writes an annulus (inner..outer radius) onto the dome. */
function conformRing(g: THREE.BufferGeometry, cx: number, cz: number, inner: number, outer: number): void {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const pol = g.getAttribute('aPolar') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const r = inner + (outer - inner) * pol.getX(i), a = pol.getY(i);
    const x = cx + Math.sin(a) * r, z = cz - Math.cos(a) * r;
    pos.setXYZ(i, x, groundHeight(x, z) + 0.07, z);
  }
  pos.needsUpdate = true;
  g.computeBoundingSphere();
}

function crackTexture(): THREE.CanvasTexture {
  const n = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const x = cv.getContext('2d')!;
  x.clearRect(0, 0, n, n);
  const grad = x.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(40,34,30,0.55)');
  grad.addColorStop(0.5, 'rgba(60,50,40,0.25)');
  grad.addColorStop(1, 'rgba(60,50,40,0)');
  x.fillStyle = grad;
  x.fillRect(0, 0, n, n);
  x.strokeStyle = 'rgba(28,22,20,0.9)';
  x.lineCap = 'round';
  for (let k = 0; k < 9; k++) {
    let a = (k / 9) * Math.PI * 2 + hash(k, 1) * 0.5, r = 12, px = 128, py = 128;
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(px, py);
    while (r < 110) {
      r += 14 + hash(k, r) * 14;
      a += (hash(k, r + 3) - 0.5) * 0.6;
      px = 128 + Math.cos(a) * r;
      py = 128 + Math.sin(a) * r;
      x.lineTo(px, py);
      x.lineWidth = Math.max(1.5, x.lineWidth - 0.6);
    }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ── the view ──────────────────────────────────────────────────────────────────────────────────────────
export const createGolemView: CreateGolemView = () => {
  let ctx!: RenderContext;
  const root = new THREE.Group();
  root.name = 'golem';
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);
  const meshes: THREE.Mesh[] = [];
  const pose = createPose();
  let stoneMat!: THREE.MeshLambertMaterial;
  const runeMats: Partial<Record<RuneGroup, THREE.ShaderMaterial>> = {};
  const halos: { sprite: THREE.Sprite; group: RuneGroup | 'eye'; base: number }[] = [];
  let eyeMat!: THREE.MeshBasicMaterial;
  let eyes!: THREE.Mesh;
  const stars: THREE.Mesh[] = [];
  let tossRock!: THREE.Mesh;
  let blob!: THREE.Mesh;
  let decal!: THREE.Mesh;
  let decalMat!: THREE.ShaderMaterial;
  const decalKey = { x: NaN, z: NaN, r: NaN, f: NaN };
  const rings: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial }[] = [];
  const cracks: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; born: number; x: number; z: number }[] = [];
  const pendingCracks: { x: number; z: number }[] = [];
  let coins!: THREE.InstancedMesh;
  const COIN_MAX = GOLEM.coinCount + MINION_BURST.count * 6;
  const burst: CoinBurst = { count: 0, amount: 0, up: 0, out: 0, handoff: 0 };
  // crumble state (snapshot at the killing blow)
  const crumbleP0 = new Float32Array(PART_COUNT * 3);
  const crumbleR0 = new Float32Array(PART_COUNT * 3);
  let crumbling = false, placedFrame = -999;
  /** Sim frame of the last hero hit (white flash: +1 for a frame, gone in 80 ms) and the state it came from. */
  let flashFrame = -99;
  let stateRef: { frame: number } | null = null;
  // jolt
  let joltPart = -1, joltAt = -10, joltPending = false;
  const joltDir = new THREE.Vector3();
  let quality: Quality = 'high';
  let offHit: (() => void) | null = null, offImpact: (() => void) | null = null;

  const tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpM = new THREE.Matrix4(), tmpS = new THREE.Vector3();
  const coinP = { x: 0, y: 0, z: 0 };

  function buildBody(): void {
    stoneMat = toonMaterial(0xffffff, { vertexColors: true, rim: true, shade: 0x8c9db8 }) as THREE.MeshLambertMaterial;
    const textures: Partial<Record<string, THREE.Texture>> = {};
    const tex = (k: RuneGlyph) => (textures[k] ??= runeTexture(k));
    for (const p of PARTS) {
      const geo = partGeometry(p);
      const m = new THREE.Mesh(geo, stoneMat);
      m.name = 'golem-' + p.name;
      m.castShadow = true;
      m.receiveShadow = true;
      if (p.rune) {
        const mat = (runeMats[p.rune.group] ??= runeMaterial(tex(p.rune.glyph)));
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(p.rune.size, p.rune.size), mat);
        const dir = tmpV.set(...p.rune.dir).normalize();
        plane.position.copy(dir).multiplyScalar((geo.userData.faceDist as number) + 0.012);
        plane.lookAt(dir.multiplyScalar(10));
        plane.renderOrder = 3;
        m.add(plane);
        if (p.rune.group !== 'shoulders') {
          const halo = glowSprite(PALETTE.rune, p.rune.size * 2.2);
          halo.position.copy(plane.position).multiplyScalar(1.08);
          m.add(halo);
          halos.push({ sprite: halo, group: p.rune.group, base: 0.55 });
        }
      }
      if (p.name === 'torso') {
        // Phase-2 torso cracks: dark until the Guardian kindles.
        const cmat = (runeMats.crack = runeMaterial(tex('crack')));
        for (const [dx, rot] of [[-0.42, 0.5], [0.45, -0.45]] as const) {
          const c = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.7), cmat);
          const d = tmpV.set(dx, 0.15, 0.85).normalize();
          c.position.set(d.x * 0.62, d.y * 0.6, d.z * 0.5);
          c.lookAt(c.position.clone().multiplyScalar(10));
          c.rotateZ(rot);
          c.renderOrder = 3;
          m.add(c);
        }
      }
      if (p.name === 'head') {
        // Two eye slits under the brow + their halos.
        eyeMat = new THREE.MeshBasicMaterial({ color: COL.eye.clone().multiplyScalar(3), toneMapped: false });
        const eg = new THREE.BoxGeometry(0.17, 0.065, 0.05);
        const merged = mergeGeometries([eg.clone().translate(-0.14, -0.02, 0), eg.clone().translate(0.14, -0.02, 0)])!;
        eyes = new THREE.Mesh(merged, eyeMat);
        eyes.position.set(0, 0, (geo.userData.faceDist as number | undefined) ?? 0.31);
        // Sink the slits into the face so they read as carved, lit from within.
        let front = 0;
        const gp = geo.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < gp.count; i++) if (Math.abs(gp.getX(i)) < 0.2 && Math.abs(gp.getY(i)) < 0.08) front = Math.max(front, gp.getZ(i));
        eyes.position.z = front - 0.008;
        // A brow ridge: a flattened boulder sliver above the eyes.
        const brow = new THREE.Mesh(partGeometry({ ...p, name: 'brow', size: [0.42, 0.07, 0.12], boxy: 0.5, seed: 31, moss: 0.8, rune: undefined }, 2), stoneMat);
        brow.position.set(0, 0.07, front - 0.02);
        brow.castShadow = true;
        m.add(eyes, brow);
        for (const sx of [-0.14, 0.14]) {
          const halo = glowSprite(PALETTE.eye, 0.5);
          halo.position.set(sx, -0.02, front + 0.05);
          m.add(halo);
          halos.push({ sprite: halo, group: 'eye', base: 0.6 });
        }
      }
      meshes.push(m);
      bodyGroup.add(m);
    }
    // Daze stars (stagger): three little 4-point stars orbiting the head.
    const starGeo = new THREE.OctahedronGeometry(0.09, 0);
    starGeo.scale(1, 1, 0.4);
    const starMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe27a).multiplyScalar(2), toneMapped: false });
    for (let i = 0; i < 3; i++) {
      const st = new THREE.Mesh(starGeo, starMat);
      st.visible = false;
      stars.push(st);
      root.add(st);
    }
    // Blob contact shadow.
    const bc = document.createElement('canvas');
    bc.width = bc.height = 64;
    const bx = bc.getContext('2d')!;
    const bg = bx.createRadialGradient(32, 32, 0, 32, 32, 32);
    bg.addColorStop(0, 'rgba(43,58,42,0.42)');
    bg.addColorStop(0.6, 'rgba(43,58,42,0.22)');
    bg.addColorStop(1, 'rgba(43,58,42,0)');
    bx.fillStyle = bg;
    bx.fillRect(0, 0, 64, 64);
    const bt = new THREE.CanvasTexture(bc);
    bt.colorSpace = THREE.SRGBColorSpace;
    blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: bt, transparent: true, depthWrite: false }));
    blob.renderOrder = 1;
    ctx.scene.add(blob);
  }

  function buildGroundFx(): void {
    tossRock = new THREE.Mesh(partGeometry(PARTS.find((p) => p.name === 'back')!), stoneMat);
    tossRock.castShadow = true;
    tossRock.visible = false;
    ctx.scene.add(tossRock);

    decalMat = decalMaterial();
    decal = new THREE.Mesh(polarGeometry(DECAL_RINGS, DECAL_SEGS), decalMat);
    decal.frustumCulled = false;
    decal.visible = false;
    decal.renderOrder = 2;
    ctx.scene.add(decal);

    for (let i = 0; i < 8; i++) {
      const mat = ringMaterial();
      const mesh = new THREE.Mesh(polarGeometry(2, 96), mat);
      mesh.frustumCulled = false;
      mesh.visible = false;
      mesh.renderOrder = 2;
      ctx.scene.add(mesh);
      rings.push({ mesh, mat });
    }
    const ct = crackTexture();
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat);
      mesh.visible = false;
      mesh.renderOrder = 1;
      ctx.scene.add(mesh);
      cracks.push({ mesh, mat, born: -99, x: 0, z: 0 });
    }

    const coinGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.035, 18).rotateX(Math.PI / 2);
    const coinMat = toonMaterial(0xffd84a, { emissive: 0xffc23a, emissiveIntensity: 0.35, shade: 0xd99a22, rim: true });
    coins = new THREE.InstancedMesh(coinGeo, coinMat, COIN_MAX);
    coins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    coins.setColorAt(0, COL.white);
    coins.count = 0;
    coins.frustumCulled = false;
    coins.castShadow = true;
    ctx.scene.add(coins);
  }

  // ── per-frame helpers ──
  function runeLook(f: FrameInfo): void {
    const g = f.state.golem;
    const tf = Math.max(0, g.actionFrame - 1 + f.alpha);
    const asm = assembly(g, tf);
    const t = f.time;
    const pulse = 0.85 + 0.15 * Math.sin((t * Math.PI * 2) / 2.2);
    const hot = g.enraged;
    const base = hot ? 3.6 : 2.4;
    const flare = Math.max(0, (g.glow - (hot ? 0.6 : 0.35)) / (hot ? 0.4 : 0.65));
    const stag = g.action === 'stagger';
    const flick = stag ? (Math.sin(t * 43) > 0.2 ? 0.35 : 1) : 1;
    const dying = g.action === 'dying' || g.action === 'dead';
    const deathT = dying ? golemBurstTime(g, f.alpha) : 0;
    const sweep = g.attack === 'sweep';
    const order: Record<RuneGroup, number> = { shoulders: 0, chest: 1, fistL: 2, fistR: 2, crack: 3 };
    for (const k of Object.keys(runeMats) as RuneGroup[]) {
      const m = runeMats[k]!;
      const u = m.uniforms;
      const ign = clamp01((asm - 0.7 - order[k] * 0.07) / 0.06);
      const limb = k === 'fistR' || (k === 'fistL' && !sweep) || (k === 'chest' && !sweep) ? 1 : 0.25;
      let I = base * pulse * flick * (1 + 1.2 * flare * limb);
      const edge = u.uEdge!.value as THREE.Color, core = u.uCore!.value as THREE.Color;
      if (k === 'crack') {
        I = hot ? 3.2 * pulse : 0;
        edge.copy(COL.runeHot);
        core.copy(COL.white);
        u.uOpacity!.value = hot ? 1 : 0;
      } else {
        edge.copy(hot ? COL.runeHot : COL.rune);
        core.copy(hot ? COL.white : COL.runeCore);
        u.uOpacity!.value = 1;
      }
      if (dying) {
        // ≤ 2 frames of white flash at the killing blow, then the runes die to grey.
        if (deathT < 2 / 60) {
          edge.copy(COL.white);
          I = 6;
        } else {
          const k2 = clamp01((deathT - 0.03) / 0.5);
          edge.lerp(COL.dead, k2);
          core.lerp(COL.dead, k2);
          I = lerp(I, 1, k2);
        }
      } else if (asm < 1 || g.action === 'dormant') {
        edge.lerp(COL.dead, 1 - ign);
        core.lerp(COL.dead, 1 - ign);
        I = lerp(1, I, ign);
      }
      u.uIntensity!.value = I;
    }
    // Eyes: open last in the assembly; flare on windups; 30 % in a stagger; out on death.
    const eyeOpen = clamp01((asm - 0.93) / 0.05) * (dying ? clamp01(1 - deathT / 0.35) : 1);
    const eyeI = 3 * (stag ? 0.3 : 1) * (1 + 0.8 * flare) * eyeOpen;
    eyeMat.color.copy(hot ? COL.runeCore : COL.eye).multiplyScalar(Math.max(0.25, eyeI));
    if (eyeOpen <= 0) eyeMat.color.copy(COL.dead);
    eyes.scale.y = 0.25 + 0.75 * eyeOpen;
    for (const h of halos) {
      const I = h.group === 'eye' ? eyeI / 3 : ((runeMats[h.group as RuneGroup]?.uniforms.uIntensity!.value as number) ?? 0) / 2.4;
      (h.sprite.material as THREE.SpriteMaterial).opacity = Math.min(0.9, h.base * I * (dying ? 0 : 1));
      (h.sprite.material as THREE.SpriteMaterial).color.copy(h.group === 'eye' ? COL.eye : hot ? COL.runeHot : COL.rune);
    }
  }

  function placeBody(f: FrameInfo): void {
    const g = f.state.golem;
    placedFrame = f.state.frame;
    const tf = Math.max(0, g.actionFrame - 1 + f.alpha);
    const rig = computePose(g, tf, f.time, pose);
    const jt = (f.time - joltAt) / 0.14;
    for (let i = 0; i < PART_COUNT; i++) {
      const m = meshes[i]!;
      const k = i * POSE_STRIDE;
      m.position.set(pose[k]!, pose[k + 1]!, pose[k + 2]!);
      m.rotation.set(pose[k + 3]!, pose[k + 4]!, pose[k + 5]!);
      m.scale.setScalar(Math.max(0.0001, pose[k + 6]!));
      m.visible = pose[k + 6]! > 0.001;
      if (i === joltPart && jt >= 0 && jt < 1) m.position.addScaledVector(joltDir, 0.08 * (1 - easeOutBack(jt)));
    }
    // Daze stars orbit the head during a stagger.
    const stag = g.action === 'stagger';
    const head = meshes[13]!;
    for (let i = 0; i < 3; i++) {
      const st = stars[i]!;
      st.visible = stag && tf > 6;
      if (!st.visible) continue;
      const a = f.time * 4 + (i * Math.PI * 2) / 3;
      st.position.set(head.position.x + Math.cos(a) * 0.55, head.position.y + 0.45 + 0.06 * Math.sin(a * 2), head.position.z + Math.sin(a) * 0.55);
      st.rotation.set(0, -a, f.time * 5);
    }
    // Nameplate anchor: head + 1.0 m, raised over the fists when they are overhead.
    const top = Math.max(head.position.y + 1.0, Math.max(pose[9 * POSE_STRIDE + 1]!, pose[10 * POSE_STRIDE + 1]!) + 0.85);
    tmpV.set(0, top, 0);
    root.localToWorld(tmpV);
    golemAnchor.x = tmpV.x;
    golemAnchor.y = tmpV.y;
    golemAnchor.z = tmpV.z;
    void rig;
  }

  function crumble(f: FrameInfo): void {
    const g = f.state.golem;
    const t = golemBurstTime(g, f.alpha);
    if (!crumbling) {
      // Snapshot the pose at the killing blow (world space), then let the boulders go. If frames were stepped
      // without rendering (moments), the last drawn pose is stale: stand it in its idle pose first.
      crumbling = true;
      if (f.state.frame - placedFrame > g.actionFrame + 6) placeBody({ ...f, state: { ...f.state, golem: { ...g, action: 'idle', actionFrame: 1, attack: null } } });
      root.updateMatrixWorld(true);
      for (let i = 0; i < PART_COUNT; i++) {
        const m = meshes[i]!;
        m.getWorldPosition(tmpV);
        crumbleP0[i * 3] = tmpV.x;
        crumbleP0[i * 3 + 1] = tmpV.y;
        crumbleP0[i * 3 + 2] = tmpV.z;
        m.getWorldQuaternion(tmpQ);
        tmpE.setFromQuaternion(tmpQ);
        crumbleR0[i * 3] = tmpE.x;
        crumbleR0[i * 3 + 1] = tmpE.y;
        crumbleR0[i * 3 + 2] = tmpE.z;
      }
    }
    const GR = 14;
    const cx = g.pos.x, cz = g.pos.z;
    for (let i = 0; i < PART_COUNT; i++) {
      const m = meshes[i]!;
      const p = PARTS[i]!;
      const x0 = crumbleP0[i * 3]!, y0 = crumbleP0[i * 3 + 1]!, z0 = crumbleP0[i * 3 + 2]!;
      let ox = x0 - cx, oz = z0 - cz;
      const ol = Math.hypot(ox, oz) || 1;
      ox /= ol;
      oz /= ol;
      const ang = (hash(i, 1) - 0.5) * 1.2;
      const dx = ox * Math.cos(ang) - oz * Math.sin(ang), dz = ox * Math.sin(ang) + oz * Math.cos(ang);
      const vh = 0.8 + 1.5 * hash(i, 2) + (p.role === 'head' ? 0.6 : 0);
      const vy = 2 + 3.5 * hash(i, 3) * (y0 / 3);
      const rest = p.size[1] * 0.72;
      const gy = groundHeight(x0 + dx * vh * 0.6, z0 + dz * vh * 0.6) + rest;
      // Fall from y0 to rest height, bounce once (restitution 0.3), then roll to a stop.
      const t1 = (vy + Math.sqrt(Math.max(0, vy * vy + 2 * GR * (y0 - gy)))) / GR;
      const vb = 0.3 * (GR * t1 - vy);
      const t2 = (2 * vb) / GR;
      let y: number, d: number;
      if (t < t1) {
        y = y0 + vy * t - 0.5 * GR * t * t;
        d = vh * t;
      } else if (t < t1 + t2) {
        const u = t - t1;
        y = gy + vb * u - 0.5 * GR * u * u;
        d = vh * t1 + vh * 0.5 * u;
      } else {
        const u = Math.min(0.5, t - t1 - t2);
        y = gy;
        d = vh * t1 + vh * 0.5 * t2 + vh * 0.5 * (u - (u * u) / 1.0);
      }
      // Settle, then sink and shrink away over 1.5 s (nothing pops out of existence).
      const settleAt = 1.7 + hash(i, 4) * 0.4;
      const sink = clamp01((t - settleAt) / 1.5);
      y -= sink * p.size[1] * 1.7;
      const roll = d / Math.max(0.3, p.size[0]);
      m.position.set(x0 + dx * d, y, z0 + dz * d);
      m.rotation.set(crumbleR0[i * 3]! + roll * dz * 0.9 + hash(i, 5) * t * 0.6, crumbleR0[i * 3 + 1]! + hash(i, 6) * t, crumbleR0[i * 3 + 2]! - roll * dx * 0.9);
      m.scale.setScalar(1 - 0.55 * sink);
      m.visible = sink < 1;
    }
    for (const st of stars) st.visible = false;
  }

  function updateDecal(f: FrameInfo): void {
    const g = f.state.golem;
    const x = gx(g);
    const tf = Math.max(0, g.actionFrame - 1 + f.alpha);
    let show = false, fill = 0, flash = 0, alpha = 1;
    const a = g.attack;
    if (a && g.action === 'windup' && a !== 'toss') {
      show = true;
      fill = clamp01(tf / Math.max(1, x.windupLen));
    } else if (a && g.action === 'strike' && a !== 'toss') {
      show = tf < 8;
      fill = 1;
      flash = clamp01(1 - tf / 3);
      alpha = 1 - tf / 8;
    } else if (a === 'toss' && g.action === 'strike') {
      show = true;
      fill = clamp01(tf / GOLEM.attacks.toss.strike);
    } else if (a === 'toss' && g.action === 'recover') {
      show = tf < 8;
      fill = 1;
      flash = clamp01(1 - tf / 3);
      alpha = 1 - tf / 8;
    }
    decal.visible = show;
    if (!show || !a) return;
    const t = GOLEM.attacks[a];
    const sweep = a === 'sweep';
    const cx = sweep ? g.pos.x : g.target.x, cz = sweep ? g.pos.z : g.target.z;
    const fac = sweep ? g.facing : 0;
    if (cx !== decalKey.x || cz !== decalKey.z || t.radius !== decalKey.r || fac !== decalKey.f) {
      conform(decal.geometry, cx, cz, t.radius, fac, 0.05);
      decalKey.x = cx;
      decalKey.z = cz;
      decalKey.r = t.radius;
      decalKey.f = fac;
    }
    const u = decalMat.uniforms;
    u.uFill!.value = fill;
    u.uHalfArc!.value = ((t.arcDeg / 2) * Math.PI) / 180;
    u.uFlash!.value = flash;
    u.uAlpha!.value = alpha;
    u.uRad!.value = t.radius;
  }

  function updateRings(f: FrameInfo): void {
    const hz = f.state.hazards;
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i]!;
      const h = hz[i];
      if (!h || !h.active) {
        r.mesh.visible = false;
        continue;
      }
      const p = clamp01((h.age - 1 + f.alpha) / h.frames);
      r.mesh.visible = true;
      if (h.kind === 'shockwave') {
        const rad = h.r0 + (h.r1 - h.r0) * p;
        conformRing(r.mesh.geometry, h.pos.x, h.pos.z, Math.max(0, rad - h.band * 0.5), rad + h.band * 0.5);
        r.mat.uniforms.uAlpha!.value = 1 - p * p;
      } else {
        const rad = h.r1 * (1 + 0.6 * p);
        conformRing(r.mesh.geometry, h.pos.x, h.pos.z, rad * 0.75, rad);
        r.mat.uniforms.uAlpha!.value = 1 - p;
      }
    }
  }

  function updateCracks(f: FrameInfo): void {
    while (pendingCracks.length) {
      const c = pendingCracks.shift()!;
      let oldest = cracks[0]!;
      for (const k of cracks) if (k.born < oldest.born) oldest = k;
      oldest.born = f.time;
      oldest.x = c.x;
      oldest.z = c.z;
      oldest.mesh.position.set(c.x, groundHeight(c.x, c.z) + 0.04, c.z);
      oldest.mesh.scale.setScalar(3.2);
      oldest.mesh.rotation.y = hash(Math.round(c.x * 10), Math.round(c.z * 10)) * 6.28;
    }
    for (const k of cracks) {
      const age = f.time - k.born;
      k.mesh.visible = age >= 0 && age < 3;
      if (k.mesh.visible) k.mat.opacity = age < 2 ? 1 : 1 - (age - 2);
    }
  }

  function updateToss(f: FrameInfo): void {
    const g = f.state.golem;
    const x = gx(g);
    const tf = Math.max(0, g.actionFrame - 1 + f.alpha);
    const flying = g.attack === 'toss' && g.action === 'strike';
    const landed = g.attack === 'toss' && g.action === 'recover';
    tossRock.visible = flying || landed;
    if (!tossRock.visible) return;
    const back = PARTS.find((p) => p.name === 'back')!;
    const y1 = groundHeight(g.target.x, g.target.z) + back.size[1] * 0.6;
    if (flying) {
      const p = clamp01(tf / GOLEM.attacks.toss.strike);
      const y0 = groundHeight(x.tossFromX, x.tossFromZ) + 3.8;
      const hgt = GOLEM.tossApex - (y0 + y1) / 2;
      tossRock.position.set(lerp(x.tossFromX, g.target.x, p), lerp(y0, y1, p) + 4 * hgt * p * (1 - p), lerp(x.tossFromZ, g.target.z, p));
      tossRock.rotation.set(tf * 0.25, tf * 0.13, 0);
      tossRock.scale.setScalar(1);
    } else {
      const sink = clamp01((tf - 20) / 22);
      tossRock.position.set(g.target.x, y1 - sink * 0.6, g.target.z);
      tossRock.scale.setScalar(1 - 0.6 * sink);
    }
  }

  function updateCoins(f: FrameInfo): void {
    const s = f.state;
    let n = 0;
    const put = (b: CoinBurst, i: number, ox: number, oz: number, t: number) => {
      if (t >= handoffTime(b, i) || n >= COIN_MAX) return;
      const spin = coinWorld(b, i, ox, oz, t, coinP);
      tmpV.set(coinP.x, coinP.y, coinP.z);
      tmpE.set(0.35 * Math.sin(spin * 0.5), spin, 0);
      tmpQ.setFromEuler(tmpE);
      tmpS.setScalar(1);
      tmpM.compose(tmpV, tmpQ, tmpS);
      coins.setMatrixAt(n, tmpM);
      // Glint as the face turns toward the light.
      const gl = Math.max(0, Math.cos(spin * 2)) ** 8;
      tmpV.set(1 + gl * 1.4, 1 + gl * 1.2, 1 + gl * 0.8);
      coins.setColorAt(n, tmpColor.setRGB(tmpV.x, tmpV.y, tmpV.z));
      n++;
    };
    const tg = golemBurstTime(s.golem, f.alpha);
    if (tg >= 0) {
      golemBurst(s, burst);
      for (let i = 0; i < burst.count; i++) put(burst, i, s.golem.pos.x, s.golem.pos.z, tg);
    }
    for (let m = 0; m < s.minions.length; m++) {
      const mn = s.minions[m]!;
      const tm = minionBurstTime(mn, f.alpha);
      if (tm < 0 || tm > 2) continue;
      for (let i = 0; i < MINION_BURST.count; i++) put(MINION_BURST, i, mn.pos.x, mn.pos.z, tm);
    }
    coins.count = n;
    coins.instanceMatrix.needsUpdate = true;
    if (coins.instanceColor) coins.instanceColor.needsUpdate = true;
  }
  const tmpColor = new THREE.Color();

  return {
    init(c: RenderContext) {
      ctx = c;
      buildBody();
      buildGroundFx();
      ctx.scene.add(root);
      ctx.probe.register('golem', bodyGroup);
      offHit = ctx.bus.on('hit', (e: SimEventOf<'hit'>) => {
        if (e.target !== 'golem') return;
        joltPending = true;
        flashFrame = stateRef ? stateRef.frame : -99;
      });
      offImpact = ctx.bus.on('impact', (e: SimEventOf<'impact'>) => {
        if (e.attack === 'slam' || e.attack === 'doubleSlam') pendingCracks.push({ x: e.pos.x, z: e.pos.z });
      });
    },
    update(f: FrameInfo) {
      stateRef = f.state;
      const g = f.state.golem;
      const h = f.state.hero;
      root.position.set(lerp(g.prevPos.x, g.pos.x, f.alpha), 0, lerp(g.prevPos.z, g.pos.z, f.alpha));
      root.position.y = groundHeight(root.position.x, root.position.z);
      root.rotation.y = Math.PI - lerpAngle(g.prevFacing, g.facing, f.alpha);
      // Which side did the blow come from? (local x of the hero)
      if (joltPending) {
        // The part nearest the blow jolts away from it: the fist on the striker's side, else the torso.
        joltPending = false;
        joltAt = f.time;
        tmpV.set(h.pos.x, root.position.y + 1.5, h.pos.z);
        root.worldToLocal(tmpV);
        joltPart = tmpV.x > 0.8 ? 9 : tmpV.x < -0.8 ? 10 : 5;
        joltDir.set(-tmpV.x, 0, -tmpV.z).normalize();
      }
      const dying = g.action === 'dying' || g.action === 'dead';
      if (dying) crumble(f);
      else {
        crumbling = false;
        placeBody(f);
      }
      golemAnchor.visible = !dying && g.action !== 'dormant';
      runeLook(f);
      const since = f.state.frame - flashFrame - 1 + f.alpha;
      stoneMat.emissive.setScalar(since >= 0 && since < 5 ? 0.6 * (1 - since / 5) : 0);
      blob.visible = !dying;
      blob.position.set(root.position.x, root.position.y + 0.03, root.position.z);
      const bs = g.action === 'dormant' ? 3.2 : 3.6;
      blob.scale.set(bs, 1, bs * 0.8);
      blob.rotation.y = root.rotation.y;
      updateDecal(f);
      updateRings(f);
      updateCracks(f);
      updateToss(f);
      updateCoins(f);
    },
    setQuality(q: Quality) {
      quality = q;
      coins.castShadow = q === 'high';
      void quality;
    },
    dispose() {
      offHit?.();
      offImpact?.();
      ctx.scene.remove(root, blob, tossRock, decal, coins);
      for (const r of rings) ctx.scene.remove(r.mesh);
      for (const k of cracks) ctx.scene.remove(k.mesh);
    },
  };
};
