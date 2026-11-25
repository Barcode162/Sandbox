// src/camera/rig.ts — owned by WO-003. Three-quarter chase camera: canonical framing from tuning/camera.ts
// (tuning/camera.ts PRESETS, tuned by WO-002), follow spring, lock-on yaw bias, manual orbit, title orbit + intro
// glide, kick + shake + FOV punch (reduceShake honoured). Exposes yaw for Intent.camYaw.
import * as THREE from 'three';
import type { CameraRig, CreateCameraRig, FrameInfo, RenderContext } from '../contracts.ts';
import { CLIP, framingFor, type Framing } from '../tuning/camera.ts';
import { FOLLOW } from '../tuning/follow.ts';
import { damp, lerp } from '../core/math.ts';
import { groundHeight } from '../world/ground.ts';

const DEG = Math.PI / 180;

export const createCameraRig: CreateCameraRig = () => {
  let ctx!: RenderContext;
  const target = new THREE.Vector3();
  const goal = new THREE.Vector3();
  const fr: Framing = { aspect: 1, vfovDeg: 60, pitchDeg: 20, back: 6, up: 6, yawDeg: 0 };
  let yaw = 0;
  let snapNext = true;
  const place = (f: FrameInfo, k: number) => {
    const cam = ctx.camera;
    framingFor(cam.aspect, fr);
    if (Math.abs(cam.fov - fr.vfovDeg) > 1e-3) {
      cam.fov = fr.vfovDeg;
      cam.updateProjectionMatrix();
    }
    yaw = fr.yawDeg * DEG; // scaffold: base yaw only (WO-003 adds lock-on bias + manual orbit)
    const h = f.state.hero;
    const hx = lerp(h.prevPos.x, h.pos.x, f.alpha), hz = lerp(h.prevPos.z, h.pos.z, f.alpha);
    goal.set(hx, groundHeight(hx, hz), hz);
    target.lerp(goal, k);
    // camera = target + R(yaw)·(0, up, back): "back" is opposite the forward (sin yaw, −cos yaw).
    cam.position.set(target.x - Math.sin(yaw) * fr.back, target.y + fr.up, target.z + Math.cos(yaw) * fr.back);
    cam.rotation.set(-fr.pitchDeg * DEG, -yaw, 0, 'YXZ');
  };
  return {
    get yaw() {
      return yaw;
    },
    init(c) {
      ctx = c;
      ctx.camera.near = CLIP.near;
      ctx.camera.far = CLIP.far;
    },
    update(f) {
      place(f, snapNext ? 1 : damp(Math.LN2 / (FOLLOW.posHalfLifeMs / 1000), f.dt));
      snapNext = false;
    },
    kick() {},
    shake() {},
    snap() {
      snapNext = true;
    },
    setQuality() {},
    dispose() {},
  };
};
