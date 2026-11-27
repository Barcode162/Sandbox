// src/camera/rig.ts — owned by WO-003. Chase camera with a FIXED look pitch (experience.md §4.3): framing from
// tuning/camera.ts PRESETS (by aspect), follow (half-life 110 ms) with move look-ahead, lock-on yaw bias toward the
// golem, manual orbit (±40°, springs back after 2 s), title orbit + 1.6 s intro glide, victory rise + orbit, hit kick,
// trauma shake and FOV punch (reduceShake honoured). Effects run on the SIM clock so stepping/slow-mo/pause agree.
import * as THREE from 'three';
import type { CameraRig, CreateCameraRig, FrameInfo, RenderContext, SimState } from '../contracts.ts';
import { CLIP, framingFor, type Framing } from '../tuning/camera.ts';
import { FOLLOW } from '../tuning/follow.ts';
import { clamp, facingOf, lerp, wrapAngle } from '../core/math.ts';
import { groundHeight } from '../world/ground.ts';
import { LINK } from '../input/link.ts';

const DEG = Math.PI / 180;
/** Exponential approach factor for a half-life in ms over dt seconds. */
const hl = (ms: number, dt: number) => 1 - Math.pow(2, -dt / (ms / 1000));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Title: slow orbit around the vista anchor (8, 2, −18) at 0.02 rad/s. */
const TITLE = { cx: 8, cy: 2, cz: -18, radius: 27, height: 7.5, phase0: -0.62, rate: 0.02, lookUp: 3.2, pitchDeg: 4, fov: 55 } as const;
const GLIDE_S = 1.6;
/** Temple centre on the ground plane (experience.md §4.4). */
const TEMPLE_XZ = { x: 26, z: -47 } as const;

export const createCameraRig: CreateCameraRig = () => {
  let ctx!: RenderContext;
  const fr: Framing = { aspect: 1, vfovDeg: 60, pitchDeg: 20, back: 6, up: 6, yawDeg: 0 };
  const target = new THREE.Vector3();
  const look = { x: 0, z: 0 }; // look-ahead offset
  let bias = 0; // lock-on yaw bias (rad)
  let orbit = 0; // manual orbit (rad)
  let yaw = 0;
  let snapNext = true;
  let last: SimState | null = null;
  let lastClock = 0;
  let lastPhase = '';
  let glideT = -1; // seconds into the title → fight glide (-1 = none)
  let victoryT = 0;
  let rise = 0;
  // Effects.
  const kickOff = new THREE.Vector3();
  let kickRoll = 0;
  let trauma = 0;
  let punchT = -1;
  let punchAmp = 0;
  const from = { p: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 55 };
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler(0, 0, 0, 'YXZ');
  const reduce = () => ctx.settings.get().reduceShake;

  const titlePose = (time: number, out: THREE.Vector3, q: THREE.Quaternion) => {
    const a = TITLE.phase0 + TITLE.rate * time;
    out.set(TITLE.cx + Math.sin(a) * TITLE.radius, TITLE.cy + TITLE.height, TITLE.cz + Math.cos(a) * TITLE.radius);
    // Look toward the anchor, a little above it, with a gentle down pitch.
    const f = Math.atan2(TITLE.cx - out.x, -(TITLE.cz - out.z)); // facing convention
    tmpE.set(-TITLE.pitchDeg * DEG, -f, 0, 'YXZ');
    q.setFromEuler(tmpE);
  };

  const place = (f: FrameInfo, dt: number) => {
    const cam = ctx.camera;
    const s = f.state;
    framingFor(cam.aspect, fr);
    const base = fr.yawDeg * DEG;
    const h = s.hero, g = s.golem;
    const hx = lerp(h.prevPos.x, h.pos.x, f.alpha), hz = lerp(h.prevPos.z, h.pos.z, f.alpha);
    const snap = snapNext;
    snapNext = false;

    // Look-ahead: 1 m along the move, only while moving and the golem is ≥ 7 m away.
    const gdx = g.pos.x - hx, gdz = g.pos.z - hz;
    const gd = Math.hypot(gdx, gdz);
    const sp = Math.hypot(h.vel.x, h.vel.z);
    const la = sp > 0.5 && gd >= 7 ? FOLLOW.lookAheadM : 0;
    const lx = sp > 0.5 ? (h.vel.x / sp) * la : 0, lz = sp > 0.5 ? (h.vel.z / sp) * la : 0;
    // Steering springs (look-ahead, lock-on) never integrate more than 0.1 s per render: after many un-rendered
    // steps (tests, manual stepping) they must not swing to an end state the player would only have seen briefly.
    const sdt = Math.min(dt, 0.1);
    const kl = snap ? 1 : hl(FOLLOW.lookAheadHalfLifeMs, sdt);
    look.x += (lx - look.x) * kl;
    look.z += (lz - look.z) * kl;

    const liftK = Math.min(1, Math.max(0, (0.875 - cam.aspect) / (0.875 - 0.46)));
    const lift = FOLLOW.portraitLiftM * liftK; // portrait: hero rides above the thumb zone (polish F-020)
    const tx = hx + look.x - Math.sin(base) * lift, tz = hz + look.z + Math.cos(base) * lift;
    const ty = groundHeight(hx, hz);
    if (snap) target.set(tx, ty, tz);
    else {
      const k = hl(FOLLOW.posHalfLifeMs, dt);
      target.x += (tx - target.x) * k;
      target.y += (ty - target.y) * k;
      target.z += (tz - target.z) * k;
    }

    // Lock-on bias toward the golem.
    const alive = g.action !== 'dormant' && g.action !== 'dying' && g.action !== 'dead' && s.phase === 'fight';
    let want = 0, life: number = FOLLOW.yawReturnHalfLifeMs;
    if (alive && gd < FOLLOW.lockOnRangeM && gd > 0.5) {
      const phi = wrapAngle(facingOf(gdx, gdz) - base);
      if (Math.abs(phi) > 10 * DEG) {
        want = clamp(FOLLOW.lockOnGain * phi, -FOLLOW.lockOnMaxDeg * DEG, FOLLOW.lockOnMaxDeg * DEG);
        life = FOLLOW.yawHalfLifeMs;
      }
    }
    bias = snap ? want : bias + (want - bias) * hl(life, sdt);
    // The temple stays in view (§4.3; polish F-015): the bias may not turn it past 80 % of the half-FOV.
    const hHalf = Math.atan(Math.tan((fr.vfovDeg * DEG) / 2) * cam.aspect) * 0.8;
    const tf = facingOf(TEMPLE_XZ.x - tx, TEMPLE_XZ.z - tz);
    const off = wrapAngle(tf - (base + bias));
    if (off > hHalf) bias += off - hHalf;
    else if (off < -hHalf) bias += off + hHalf;

    // Manual orbit: drag / right-mouse / Q-E / RS, clamped ±40°, springs back after 2 s idle.
    const now = performance.now();
    orbit += (LINK.orbitDeg + LINK.orbitRate * dt) * DEG;
    LINK.orbitDeg = 0;
    orbit = clamp(orbit, -FOLLOW.orbitMaxDeg * DEG, FOLLOW.orbitMaxDeg * DEG);
    if (LINK.orbitRate === 0 && now - LINK.orbitAt > FOLLOW.orbitReturnMs) orbit += (0 - orbit) * hl(400, dt);
    if (snap) orbit = 0;

    // Victory: rise 1.2 m and orbit 4°/s.
    if (s.phase === 'victory') victoryT += dt;
    else victoryT = 0;
    rise += ((s.phase === 'victory' ? 1.2 : 0) - rise) * (snap ? 1 : hl(500, dt));

    yaw = base + bias + orbit + victoryT * 4 * DEG;
    const up = fr.up + rise;
    cam.position.set(target.x - Math.sin(yaw) * fr.back, target.y + up, target.z + Math.cos(yaw) * fr.back);

    // Kick (decays, half-life 60 ms) and trauma shake (trauma² × (0.30 m, 1.0°), 22 Hz noise, −1.8/s).
    const kd = Math.pow(2, -dt / (FOLLOW.kickHalfLifeMs / 1000));
    kickOff.multiplyScalar(kd);
    kickRoll *= kd;
    trauma = Math.max(0, trauma - FOLLOW.traumaDecayPerS * dt);
    const red = reduce();
    const sh = trauma * trauma * (red ? 0.25 : 1);
    const tc = s.frame / 60 + f.alpha / 60;
    const w = FOLLOW.shakeHz * Math.PI * 2;
    const n1 = Math.sin(tc * w) * 0.6 + Math.sin(tc * w * 1.73 + 1.3) * 0.4;
    const n2 = Math.sin(tc * w * 1.31 + 2.1) * 0.6 + Math.sin(tc * w * 0.77 + 0.4) * 0.4;
    const n3 = Math.sin(tc * w * 1.11 + 4.2) * 0.7 + Math.sin(tc * w * 2.03) * 0.3;
    cam.position.x += kickOff.x + n1 * sh * FOLLOW.shakePosM;
    cam.position.y += kickOff.y + n2 * sh * FOLLOW.shakePosM * 0.7;
    cam.position.z += kickOff.z;
    const roll = kickRoll + (red ? 0 : n3 * sh * FOLLOW.shakeRollDeg * DEG);
    cam.rotation.set(-fr.pitchDeg * DEG, -yaw, roll, 'YXZ');

    // FOV punch: −2° in 60 ms, back over 220 ms.
    let fov = fr.vfovDeg;
    if (punchT >= 0) {
      punchT += dt;
      const t = punchT;
      fov += -punchAmp * (t < 0.06 ? t / 0.06 : 1 - easeInOutCubic(clamp((t - 0.06) / 0.22, 0, 1)));
      if (t > 0.28) punchT = -1;
    }

    // Title orbit and the title → fight glide.
    const phase = s.phase;
    if (phase === 'title') {
      titlePose(f.time, cam.position, cam.quaternion);
      fov = TITLE.fov;
      glideT = -1;
    } else if (glideT >= 0) {
      glideT += dt;
      const k = easeInOutCubic(clamp(glideT / GLIDE_S, 0, 1));
      tmpQ.copy(cam.quaternion);
      cam.position.lerpVectors(from.p, cam.position, k);
      cam.quaternion.copy(from.q).slerp(tmpQ, k);
      fov = lerp(from.fov, fov, k);
      if (glideT >= GLIDE_S) glideT = -1;
    }
    if (Math.abs(cam.fov - fov) > 1e-4) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  };

  return {
    get yaw() {
      return yaw;
    },
    init(c) {
      ctx = c;
      ctx.camera.near = CLIP.near;
      ctx.camera.far = CLIP.far;
      ctx.camera.updateProjectionMatrix();
      // FOV punch on finishers and crits (kick/shake come from fx via kick()/shake()).
      ctx.bus.on('hit', (e) => {
        if (e.attacker !== 'hero' || reduce()) return;
        if (e.crit || e.kind === 'combo3') {
          punchT = 0;
          punchAmp = 2;
        }
      });
    },
    update(f) {
      const s = f.state;
      const clock = s.frame + f.alpha;
      let dt = (clock - lastClock) / 60;
      if (s !== last) snapNext = true;
      if (dt < 0 || dt > 3) dt = 0;
      last = s;
      lastClock = clock;
      // Title → intro starts the glide from wherever the title orbit is.
      if (lastPhase === 'title' && s.phase === 'intro' && !snapNext) {
        titlePose(f.time, from.p, from.q);
        from.fov = TITLE.fov;
        glideT = 0;
      }
      if (snapNext) glideT = -1;
      lastPhase = s.phase;
      place(f, dt);
      for (let i = 0; i < LINK.frameListeners.length; i++) LINK.frameListeners[i]!(f);
    },
    kick(strength, dirX, dirZ) {
      const k = strength * (reduce() ? 0.3 : 1);
      const l = Math.hypot(dirX, dirZ) || 1;
      kickOff.x += (dirX / l) * k;
      kickOff.z += (dirZ / l) * k;
      kickRoll += (reduce() ? 0 : FOLLOW.kickRollDeg * DEG) * (kickRoll > 0 ? -1 : 1);
    },
    shake(amplitude, _seconds) {
      // Trauma model: amplitude adds trauma (decay is the fixed §4.3 rate); reduceShake scales the result.
      trauma = Math.min(1, trauma + amplitude);
    },
    snap() {
      snapNext = true;
      kickOff.set(0, 0, 0);
      kickRoll = 0;
      trauma = 0;
      punchT = -1;
    },
    setQuality() {},
    dispose() {},
  };
};
