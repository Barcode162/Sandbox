// src/hero/view.ts — owned by WO-003. Aster on screen: the rig from model.ts posed by pose.ts from sim state
// (interpolated; frozen during hit-stop), a 3-joint spring cape, the slash crescent (20 samples over the last 140 ms,
// hilt → 1.3× tip radius), the finisher's ground crescent (250 ms), Gale Crescent waves, hurt flicker (10 Hz),
// skill-ready ring flash, the perfect-dodge cyan afterimage, and a blob shadow. Registered as probe 'hero'.
import * as THREE from 'three';
import type { CreateHeroView, FrameInfo, HeroState, Quality, RenderContext, SimState } from '../contracts.ts';
import { lerp, lerpAngle, wrapAngle } from '../core/math.ts';
import { groundHeight } from '../world/ground.ts';
import { HERO } from '../tuning/hero.ts';
import { ARM_LEN, newPose, poseAt, SHOULDER_R, swingCentre, swordPoints, type Pose, type PoseCtx } from './pose.ts';
import { buildHero, CAPE_COLS, CAPE_ROWS, type HeroModel } from './model.ts';
import { SIM_CLOCK } from './sim.ts';
import { Ribbon } from './ribbon.ts';

const TRAIL_SAMPLES = 20;
const TRAIL_FRAMES = 140 * 0.06; // 140 ms of action time
const TEMPLE = { x: 26, z: -47 };
const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);

/** 3-joint spring chain (k 70, damping 9) for the cape: pitch (away from the back) + side sway. */
class CapeChain {
  a = [0.15, 0.1, 0.08];
  va = [0, 0, 0];
  s = [0, 0, 0];
  vs = [0, 0, 0];
  step(dt: number, pitch: number, side: number): void {
    for (let i = 0; i < 3; i++) {
      // Each joint follows the one above it: the hem lags and whips.
      const tp = i === 0 ? pitch * 0.5 : this.a[i - 1]! * 0.75 + pitch * 0.18;
      const ts = i === 0 ? side * 0.5 : this.s[i - 1]! * 0.8 + side * 0.2;
      this.va[i]! += (70 * (tp - this.a[i]!) - 9 * this.va[i]!) * dt;
      this.vs[i]! += (70 * (ts - this.s[i]!) - 9 * this.vs[i]!) * dt;
      this.a[i]! += this.va[i]! * dt;
      this.s[i]! += this.vs[i]! * dt;
    }
  }
  settle(pitch: number, side: number): void {
    for (let i = 0; i < 3; i++) {
      this.a[i] = i === 0 ? pitch * 0.5 : this.a[i - 1]! * 0.75 + pitch * 0.18;
      this.s[i] = i === 0 ? side * 0.5 : this.s[i - 1]! * 0.8 + side * 0.2;
      this.va[i] = this.vs[i] = 0;
    }
  }
}

/** Write the cape grid from the chain (anchor at the shoulders; outer face toward −z). */
function shapeCape(geo: THREE.BufferGeometry, ch: CapeChain, time: number, flutter: number): void {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;
  const L = 0.62, dl = L / CAPE_ROWS;
  for (let col = 0; col <= CAPE_COLS; col++) {
    const u = col / CAPE_COLS;
    let y = 0, z = 0, ang = 0, side = 0;
    for (let row = 0; row <= CAPE_ROWS; row++) {
      const v = row / CAPE_ROWS;
      if (row > 0) {
        const j = Math.min(2, Math.floor(((row - 1) / CAPE_ROWS) * 3));
        ang = ch.a[0]! + (j >= 1 ? ch.a[1]! : 0) + (j >= 2 ? ch.a[2]! : 0);
        side = ch.s[0]! + (j >= 1 ? ch.s[1]! : 0) + (j >= 2 ? ch.s[2]! : 0);
        const fl = Math.sin(time * 9 + v * 5 + u * 3) * 0.06 * flutter * v;
        y -= Math.cos(ang + fl) * dl;
        z -= Math.sin(ang + fl) * dl;
      }
      const w = 0.4 + 0.15 * v;
      const cu = 2 * u - 1;
      const wrap = 0.07 * (1 - cu * cu) * (1 - 0.4 * v);
      const i = (row * (CAPE_COLS + 1) + col) * 3;
      arr[i] = cu * w * 0.5 + Math.sin(side) * -y * 0.9;
      arr[i + 1] = y;
      arr[i + 2] = z - wrap + Math.abs(cu) * 0.03 * (1 - v);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.attributes.normal!.needsUpdate = true;
}

export const createHeroView: CreateHeroView = () => {
  let ctx!: RenderContext;
  let M!: HeroModel;
  let ghost!: HeroModel;
  let ghostMat!: THREE.ShaderMaterial;
  let ghostPairs: THREE.Object3D[] = [];
  const fxRoot = new THREE.Group(); // world-space effects (kept out of the 'hero' probe box)
  const trail = new Ribbon(TRAIL_SAMPLES);
  const ground = new Ribbon(24, 2.0);
  const waves = [new Ribbon(49, 2.0), new Ribbon(49, 2.0)];
  let ring!: THREE.Mesh;
  let shadow!: THREE.Mesh;
  const pose = newPose();
  const sp = newPose();
  const pctx: PoseCtx = { time: 0, stride: 0, speed: 0, idleFrames: 0, gazeYaw: 0, rollBack: 0 };
  const cape = new CapeChain();
  const pts = [0, 0, 0, 0, 0, 0];
  const cen = [0, 0, 0];
  const v = new THREE.Vector3();
  const w = new THREE.Vector3();
  const res = new THREE.Vector2();
  const iv = new THREE.Vector3();
  const ov = new THREE.Vector3();
  let last: SimState | null = null;
  let lastClock = 0;
  let lastFacing = 0;
  let ghostFrame = -1e9;
  let ghostPending = false;
  let ghostX = 0, ghostZ = 0;
  let ringFrame = -1e9;

  /** Pose the bone hierarchy of model `m` from `p`. */
  const apply = (m: HeroModel, p: Pose) => {
    m.hop.position.y = 0.56 + p.hop;
    m.pivot.rotation.set(p.lean, p.twist, p.roll, 'YXZ');
    const sxz = 1 / Math.sqrt(p.squash);
    m.squash.scale.set(sxz, p.squash, sxz);
    m.hips.position.y = 0.36 - 0.56 + p.bob;
    m.head.rotation.set(p.headPitch, p.headYaw, 0, 'YXZ');
    m.legL.rotation.x = -p.legL;
    m.legR.rotation.x = -p.legR;
    m.armL.rotation.set(p.armLx, 0, p.armLz);
    // Right arm aims at the grip; the sword sits in the hand along the blade direction.
    v.set(p.gx - SHOULDER_R.x, p.gy - SHOULDER_R.y, p.gz - SHOULDER_R.z);
    const l = v.length() || 1;
    v.multiplyScalar(1 / l);
    m.armR.quaternion.setFromUnitVectors(DOWN, v);
    const r = Math.min(l, ARM_LEN);
    m.sword.position.set(SHOULDER_R.x + v.x * r, SHOULDER_R.y + v.y * r, SHOULDER_R.z + v.z * r);
    w.set(p.dx, p.dy, p.dz);
    m.sword.quaternion.setFromUnitVectors(UP, w);
  };

  /** Rig-space point → world (through the root transform). */
  const toWorld = (x: number, y: number, z: number, out: THREE.Vector3) => out.set(x, y, z).applyMatrix4(M.root.matrixWorld);

  const updateTrail = (h: HeroState, t: number) => {
    const a = h.action;
    const swinging = a === 'attack1' || a === 'attack2' || a === 'attack3' || a === 'skill';
    if (!swinging) return trail.commit(false);
    let any = false;
    for (let k = 0; k < TRAIL_SAMPLES; k++) {
      const age = k / (TRAIL_SAMPLES - 1);
      const tk = t - age * TRAIL_FRAMES;
      poseAt(a, tk, pctx, sp);
      swordPoints(sp, pts);
      swingCentre(sp, cen);
      // Crescent: thick at the head, tapering toward the tail; outer edge at 1.3× the tip's radius from the swing centre.
      const reach = 1.3 - 0.75 * age * age;
      const ox = cen[0]! + (pts[3]! - cen[0]!) * reach, oy = cen[1]! + (pts[4]! - cen[1]!) * reach, oz = cen[2]! + (pts[5]! - cen[2]!) * reach;
      const ix = pts[0]! + (ox - pts[0]!) * 0.1 * age, iy = pts[1]! + (oy - pts[1]!) * 0.1 * age, iz = pts[2]! + (oz - pts[2]!) * 0.1 * age;
      toWorld(ix, iy, iz, iv);
      toWorld(ox, oy, oz, ov);
      const al = sp.sweep * Math.pow(1 - age, 1.3);
      if (al > 0.01 && k > 0) any = true;
      trail.set(k, iv.x, iv.y, iv.z, ov.x, ov.y, ov.z, al);
    }
    trail.commit(any);
  };

  const updateGround = (h: HeroState, t: number, px: number, pz: number, yaw: number) => {
    const c = HERO.combo[2]!;
    const t0 = c.startup - 1; // appears as the chop connects
    const life = 250 * 0.06;
    const age = h.action === 'attack3' ? (t - t0) / life : -1;
    if (age < 0 || age > 1) return ground.commit(false);
    // A flat crescent on the ground in front of the hero where the chop lands.
    const fwdX = Math.sin(yaw), fwdZ = Math.cos(yaw); // rig +z in world
    const cx = px + fwdX * 0.4, cz = pz + fwdZ * 0.4;
    const base = Math.atan2(fwdX, fwdZ);
    const n = ground.n;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const ang = base + (u - 0.5) * 2.2;
      const r1 = 0.85 + 0.25 * age, r0 = r1 - 0.42 * Math.sin(Math.PI * u);
      const y = groundHeight(cx, cz) + 0.03;
      ground.set(i, cx + Math.sin(ang) * r0, y, cz + Math.cos(ang) * r0, cx + Math.sin(ang) * r1, y, cz + Math.cos(ang) * r1, (1 - age) * Math.sin(Math.PI * u) * 1.3);
    }
    ground.commit(true);
  };

  const updateWaves = (h: HeroState, t: number, px: number, py: number, pz: number) => {
    const k = HERO.skill;
    for (let wv = 0; wv < 2; wv++) {
      const rb = waves[wv]!;
      const t0 = k.startup + wv * k.tickGap - 2;
      const dur = 22;
      const age = h.action === 'skill' ? (t - t0) / dur : -1;
      if (age < 0 || age > 1) {
        rb.commit(false);
        continue;
      }
      const e = 1 - (1 - age) * (1 - age);
      const r1 = 0.6 + (k.radius - 0.6) * e, r0 = Math.max(0, r1 - 0.55 * (1 - age * 0.5));
      const n = rb.n;
      const y = py + 0.35 + wv * 0.15;
      for (let i = 0; i < n; i++) {
        const ang = (i / (n - 1)) * Math.PI * 2;
        const s = Math.sin(ang), c = Math.cos(ang);
        rb.set(i, px + s * r0, y - 0.05, pz + c * r0, px + s * r1, y + 0.1, pz + c * r1, (1 - age) * 0.9);
      }
      rb.commit(true);
    }
  };

  return {
    init(c: RenderContext) {
      ctx = c;
      M = buildHero();
      ghostMat = new THREE.ShaderMaterial({
        uniforms: { uOpacity: { value: 0 } },
        vertexShader: /* glsl */ `varying float vF; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vec3 n = normalize(normalMatrix*normal); vF = pow(1.0 - abs(dot(n, normalize(-mv.xyz))), 1.5); gl_Position = projectionMatrix*mv; }`,
        // Cyan body (trail-deep → trail) with a bright rim; normal-blended so it reads over sunlit grass.
        fragmentShader: /* glsl */ `uniform float uOpacity; varying float vF; void main(){ vec3 c = mix(vec3(0.03, 0.36, 0.9), vec3(0.75, 1.0, 1.0), vF); gl_FragColor = vec4(c * 1.2, uOpacity * (0.55 + 0.45 * vF));
        #include <colorspace_fragment>
        }`,
        transparent: true, depthWrite: false, toneMapped: false,
      });
      ghost = buildHero(ghostMat);
      ghost.root.visible = false;
      ghost.root.traverse((o) => (o.renderOrder = 8)); // after dust/sparks, so the impact cloud never hides it
      ghostPairs = [ghost.hop, M.hop, ghost.pivot, M.pivot, ghost.squash, M.squash, ghost.hips, M.hips, ghost.head, M.head, ghost.armL, M.armL, ghost.armR, M.armR, ghost.legL, M.legL, ghost.legR, M.legR, ghost.sword, M.sword];
      // Blob shadow (0.55× footprint, #2b3a2a at 30 %).
      shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.34, 24).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x2b3a2a, transparent: true, opacity: 0.3, depthWrite: false }),
      );
      shadow.renderOrder = 1;
      // Skill-ready flash: a one-frame white ring.
      ring = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.7, 40).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      );
      ring.visible = false;
      fxRoot.add(shadow, trail.mesh, ground.mesh, waves[0]!.mesh, waves[1]!.mesh, ring, ghost.root);
      ctx.scene.add(M.root, fxRoot);
      ctx.probe.register('hero', M.root);
      // Events can fire several steps before the next render: remember where/when, pose the ghost at update.
      ctx.bus.on('perfectDodge', (e) => {
        ghostFrame = SIM_CLOCK.frame;
        ghostX = e.pos.x;
        ghostZ = e.pos.z;
        ghostPending = true;
      });
      ctx.bus.on('skillReady', () => (ringFrame = SIM_CLOCK.frame));
    },

    update(f: FrameInfo) {
      const s = f.state;
      const h = s.hero;
      // Sim-time clock: advances with steps (so manual stepping, slow-mo and pause all read true).
      const clock = s.frame + f.alpha;
      let dt = (clock - lastClock) / 60;
      if (s !== last || dt < 0 || dt > 2) dt = 0;
      const resetChain = s !== last;
      last = s;
      lastClock = clock;

      const frozen = s.hitstop > 0 && s.phase === 'fight';
      const a = frozen ? 1 : f.alpha;
      const px = lerp(h.prevPos.x, h.pos.x, a), pz = lerp(h.prevPos.z, h.pos.z, a);
      const py = groundHeight(px, pz);
      const facing = lerpAngle(h.prevFacing, h.facing, a);
      const yaw = Math.PI - facing;
      M.root.position.set(px, py, pz);
      M.root.rotation.set(0, yaw, 0);
      M.root.updateMatrixWorld(true);

      const t = Math.max(0, h.actionFrame - 1 + a);
      pctx.time = f.time;
      pctx.stride = h.stride;
      pctx.speed = Math.min(1, Math.hypot(h.vel.x, h.vel.z) / HERO.runSpeed);
      pctx.idleFrames = h.ext.idleFrames ?? 0;
      pctx.rollBack = h.ext.rollBack ?? 0;
      pctx.gazeYaw = Math.max(-1, Math.min(1, wrapAngle(Math.atan2(TEMPLE.x - px, -(TEMPLE.z - pz)) - facing))) * -1;
      poseAt(h.action, t, pctx, pose);
      apply(M, pose);

      // Cape: trails velocity (up to 55°), idle sway 4° at 0.6 Hz, lifts on leaps/rolls; side sway from turning.
      const turn = dt > 0 ? wrapAngle(facing - lastFacing) / dt : 0;
      lastFacing = facing;
      const fwdSpeed = pctx.speed;
      const pitch = 0.14 + fwdSpeed * 0.96 * 0.75 + pose.cape + 0.07 * Math.sin(f.time * Math.PI * 1.2);
      const side = Math.max(-0.5, Math.min(0.5, turn * 0.05));
      if (resetChain) cape.settle(pitch, side);
      else if (dt > 0) {
        let rem = Math.min(dt, 0.25);
        while (rem > 1e-6) {
          const d = Math.min(rem, 1 / 120);
          cape.step(d, pitch, side);
          rem -= d;
        }
      }
      shapeCape(M.capeGeo, cape, f.time, 0.3 + fwdSpeed);

      // Hurt: 10 Hz white flicker through the 1 s grace i-frames.
      // (A roll's i-frames end before the roll does, so iframes > 0 outside a roll means post-hurt grace.)
      const hurtFlash = h.action !== 'dodge' && h.iframes > 0 && Math.floor(s.frame / 3) % 2 === 0;
      const flash = hurtFlash ? 0.85 : 0;
      M.body.emissive.setRGB(flash, flash, flash);
      M.capeOuter.emissive.setRGB(flash * 0.7, flash * 0.7, flash * 0.7);

      // Blade glow breathes; brighter while swinging.
      const swinging = pose.sweep > 0;
      M.halo.material.opacity = swinging ? 0.75 : 0.45 + 0.08 * Math.sin(f.time * 3);

      shadow.position.set(px, py + 0.02, pz);
      const air = pose.hop;
      shadow.scale.setScalar(1 - Math.min(0.4, air));
      (shadow.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - Math.min(0.5, air));

      updateTrail(h, t);
      updateGround(h, t, px, pz, yaw);
      updateWaves(h, t, px, py, pz);

      // Skill-ready ring: a one-frame white flash (≈ 2 steps), expanding slightly.
      const rAge = clock - ringFrame;
      ring.visible = rAge >= 0 && rAge < 2 && s === SIM_CLOCK.state;
      if (ring.visible) {
        ring.position.set(px, py + 0.05, pz);
        ring.scale.setScalar(1 + rAge * 0.15);
      }

      // Perfect-dodge afterimage: the pose at the dodge, left where it happened; fades over 350 ms of sim time.
      if (ghostPending) {
        ghostPending = false;
        ghost.root.position.set(ghostX, groundHeight(ghostX, ghostZ), ghostZ);
        ghost.root.quaternion.copy(M.root.quaternion);
        const pairs = ghostPairs;
        for (let i = 0; i < pairs.length; i += 2) {
          pairs[i]!.position.copy(pairs[i + 1]!.position);
          pairs[i]!.quaternion.copy(pairs[i + 1]!.quaternion);
          pairs[i]!.scale.copy(pairs[i + 1]!.scale);
        }
        (ghost.capeGeo.attributes.position!.array as Float32Array).set(M.capeGeo.attributes.position!.array as Float32Array);
        ghost.capeGeo.attributes.position!.needsUpdate = true;
        ghost.capeGeo.computeVertexNormals();
      }
      const gk = (clock - ghostFrame) / 60 / 0.35;
      ghost.root.visible = gk >= 0 && gk < 1 && s === SIM_CLOCK.state;
      ghostMat.uniforms.uOpacity!.value = ghost.root.visible ? 1 - gk * gk : 0;

      ctx.renderer.renderer.getDrawingBufferSize(res);
      M.outline.uniforms.uRes!.value.copy(res);
      M.outline.uniforms.uWidth!.value = Math.max(1.2, res.y / 560);
    },

    setQuality(_q: Quality) {
      /* Low: the halo sprite on the blade stands in for bloom (the renderer toggles halos per tier). */
    },

    dispose() {
      ctx.scene.remove(M.root, fxRoot);
      trail.dispose();
      ground.dispose();
      for (const r of waves) r.dispose();
    },
  };
};
