// src/fx/index.ts — owned by WO-003. Hit FX on the bus (experience.md §5): 8 cyan sparks + 6 stone chips (12 on the
// finisher) + a dust ring + a white flash per landed hit, camera kick and trauma; golem slam dust ring (24), crumble
// dust, footstep/roll dust, perfect-dodge sparkle, hurt sparks + red edge vignette; DOM damage numbers (comma
// grouped, tabular, outlined; crits gold 40 px + sparkle). Particles are pooled (≤ 400, Low ≤ 200) and analytic on
// the sim clock. Golem-specific meshes (decals, shockwave rings, boulders, coins) are the golem view's.
import './fx.css';
import * as THREE from 'three';
import type { CameraRig, CreateFx, FrameInfo, Quality, RenderContext, SimEvent, SimState } from '../contracts.ts';
import { makeRng } from '../core/rng.ts';
import { groundHeight } from '../world/ground.ts';
import { toonMaterial } from '../render/materials.ts';
import { ChipPool, ParticlePool, type Emit } from './particles.ts';
import { SIM_CLOCK } from '../hero/sim.ts';

export const FX_CAPS = { sparks: 160, dust: 200, chips: 40 } as const; // 400 total
const NUM_POOL = 14;
const TAU = Math.PI * 2;

const col = new THREE.Color();
const e: Emit = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, gravity: 0, drag: 0, life: 1, size0: 0.1, size1: 0.1, r: 1, g: 1, b: 1, a: 1, floor: -Infinity };
function tint(hex: number, a: number): void {
  col.setHex(hex);
  e.r = col.r; e.g = col.g; e.b = col.b; e.a = a;
}

interface Num { el: HTMLDivElement; t0: number; life: number; x: number; y: number; z: number; jitter: number; lift: number; crit: boolean; live: boolean }

/** Comma-grouped integer (en-US), no allocation beyond the string. */
export function formatDamage(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** Number timeline (§4.7): scale 0.4→1.25 at 90 ms → 1.0 at 180; rise 48 px over 800; fade the last 250 ms. */
export function numberAt(ageMs: number, lifeMs: number): { scale: number; rise: number; alpha: number } {
  const back = (t: number) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const scale = ageMs < 90 ? 0.4 + 0.85 * back(Math.min(1, ageMs / 90)) * 1 : ageMs < 180 ? 1.25 - 0.25 * ((ageMs - 90) / 90) : 1;
  const tr = Math.min(1, ageMs / 800);
  const rise = 48 * (1 - (1 - tr) * (1 - tr));
  const alpha = ageMs > lifeMs - 250 ? Math.max(0, (lifeMs - ageMs) / 250) : 1;
  return { scale: Math.max(0.4, scale), rise, alpha };
}

export const createFx: CreateFx = (rig: CameraRig) => {
  let ctx!: RenderContext;
  const rnd = makeRng(9127);
  const sparks = new ParticlePool(FX_CAPS.sparks, true, 0.035);
  const dust = new ParticlePool(FX_CAPS.dust, false, 0);
  let chips!: ChipPool;
  const nums: Num[] = [];
  let vignette!: HTMLDivElement;
  let hurtAt = -1e9;
  let state: SimState | null = null;
  const v = new THREE.Vector3();
  const right = new THREE.Vector3();
  const offs: (() => void)[] = [];

  const clearAll = () => {
    sparks.clear();
    dust.clear();
    chips?.clear();
    for (const n of nums) {
      n.live = false;
      n.el.hidden = true;
    }
    hurtAt = -1e9;
  };
  /** Sim seconds of the step being run (events fire mid-step), from the hero sim's observational clock. */
  let emitState: SimState | null = null;
  const now = () => {
    // A new sim (seed / title) drops everything in flight from the old one.
    if (SIM_CLOCK.state !== emitState) {
      emitState = SIM_CLOCK.state;
      clearAll();
    }
    state = emitState;
    return SIM_CLOCK.frame / 60;
  };

  const sparkBurst = (t: number, x: number, y: number, z: number, dx: number, dz: number, n: number, hex: number) => {
    for (let i = 0; i < n; i++) {
      // Spray back toward the attacker and up, in a cone.
      const a = Math.atan2(dx, dz) + (rnd() - 0.5) * 2.2;
      const sp = 3 + rnd() * 3;
      const up = 0.3 + rnd() * 0.9;
      e.x = x; e.y = y; e.z = z;
      e.vx = Math.sin(a) * sp; e.vz = Math.cos(a) * sp; e.vy = up * sp;
      e.gravity = 14; e.drag = 1.5; e.life = 0.35; e.size0 = 0.13; e.size1 = 0.05; e.floor = -Infinity;
      tint(i % 3 === 0 ? 0xffffff : hex, 1);
      sparks.emit(t, e);
    }
  };
  const flash = (t: number, x: number, y: number, z: number, size: number, hex: number) => {
    e.x = x; e.y = y; e.z = z; e.vx = e.vy = e.vz = 0; e.gravity = 0; e.drag = 0; e.life = 0.09;
    e.size0 = size; e.size1 = size * 1.4; e.floor = -Infinity;
    tint(hex, 0.45);
    sparks.emit(t, e);
  };
  const dustRing = (t: number, x: number, z: number, n: number, speed: number, size: number, life: number, hex = 0xe9dfc8, alpha = 0.55, r0 = 0.2) => {
    const gy = groundHeight(x, z);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd() * 0.3;
      const sp = speed * (0.7 + rnd() * 0.6);
      e.x = x + Math.sin(a) * r0; e.y = gy + 0.08 + rnd() * 0.1; e.z = z + Math.cos(a) * r0;
      e.vx = Math.sin(a) * sp; e.vz = Math.cos(a) * sp; e.vy = 0.3 + rnd() * 0.6;
      e.gravity = -0.4; e.drag = 3.2; e.life = life * (0.8 + rnd() * 0.4);
      e.size0 = size * 0.6; e.size1 = size * (1.4 + rnd() * 0.6); e.floor = -Infinity;
      tint(hex, alpha);
      dust.emit(t, e);
    }
  };
  const chipBurst = (t: number, x: number, y: number, z: number, dx: number, dz: number, n: number) => {
    const floor = groundHeight(x, z) + 0.04;
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(dx, dz) + (rnd() - 0.5) * 2.6;
      const sp = 1.6 + rnd() * 2.6;
      chips.emit(t, x, y, z, Math.sin(a) * sp, 2 + rnd() * 3, Math.cos(a) * sp, 0.035 + rnd() * 0.05, 0.9 + rnd() * 0.4, floor, rnd);
    }
  };

  const showNumber = (t: number, amount: number, crit: boolean, x: number, y: number, z: number, aboveHead: boolean) => {
    // Stack: younger numbers at the same anchor push the older ones up so hits never overprint.
    for (const n of nums) if (n.live && n.crit === crit && t - n.t0 < 0.6) n.lift += crit ? 44 : 34;
    let slot = nums.find((n) => !n.live);
    if (!slot) slot = nums.reduce((a, b) => (a.t0 < b.t0 ? a : b));
    slot.live = true;
    slot.t0 = t;
    slot.crit = crit;
    slot.life = crit ? 1.1 : 0.9;
    slot.jitter = (rnd() * 2 - 1) * 18;
    slot.lift = 0;
    // Normal: beside the golem on the camera-right; crit: above its head (§11 F2/F4).
    right.set(1, 0, 0).applyQuaternion(ctx.camera.quaternion);
    right.y = 0;
    right.normalize();
    const side = aboveHead ? 0.25 : 1.15;
    slot.x = x + right.x * side;
    slot.y = aboveHead ? y : y + 0.3;
    slot.z = z + right.z * side;
    slot.el.textContent = formatDamage(amount);
    slot.el.className = crit ? 'fx-num crit' : 'fx-num';
    slot.el.hidden = false;
  };

  const onHit = (ev: SimEvent) => {
    if (ev.type !== 'hit') return;
    const t = now();
    const s = state;
    if (ev.attacker === 'hero') {
      const hx = s ? s.hero.pos.x : ev.pos.x, hz = s ? s.hero.pos.z : ev.pos.z + 1;
      const dx = hx - ev.pos.x, dz = hz - ev.pos.z; // back toward the hero
      const fin = ev.kind === 'combo3';
      const big = ev.target === 'golem';
      sparkBurst(t, ev.pos.x, ev.y, ev.pos.z, dx, dz, fin ? 12 : 8, 0x7fe9ff);
      flash(t, ev.pos.x, ev.y, ev.pos.z, ev.crit ? 0.9 : 0.6, ev.crit ? 0xffe9a0 : 0xbff6ff);
      chipBurst(t, ev.pos.x, ev.y, ev.pos.z, dx, dz, big ? (fin ? 12 : 6) : 4);
      dustRing(t, ev.pos.x, ev.pos.z, fin ? 10 : 6, 1.6, 0.35, 0.55);
      if (ev.kind === 'combo3' && s) dustRing(t, s.hero.pos.x, s.hero.pos.z, 8, 2.2, 0.3, 0.5);
      // Camera: kick along the blow, trauma for finishers and crits.
      rig.kick(fin ? 0.12 : 0.06, -dx, -dz);
      if (fin) rig.shake(0.15, 0.4);
      if (ev.crit) rig.shake(0.12, 0.4);
      const headY = big ? 3.7 : 1.2;
      showNumber(t, ev.amount, ev.crit, ev.pos.x, ev.crit ? headY : ev.y, ev.pos.z, ev.crit);
    } else {
      // The hero got hit: white-red sparks, trauma, edge vignette.
      sparkBurst(t, ev.pos.x, 0.8 + groundHeight(ev.pos.x, ev.pos.z), ev.pos.z, 0, 1, 8, 0xffb0a0);
      rig.shake(0.35, 0.5);
      hurtAt = t;
    }
  };

  return {
    init(c: RenderContext) {
      ctx = c;
      chips = new ChipPool(FX_CAPS.chips, toonMaterial(0xb7a195, { shade: 0x7f7c84 }));
      ctx.scene.add(sparks.mesh, dust.mesh, chips.mesh);
      for (let i = 0; i < NUM_POOL; i++) {
        const el = document.createElement('div');
        el.className = 'fx-num';
        el.hidden = true;
        el.setAttribute('aria-hidden', 'true');
        ctx.overlay.appendChild(el);
        nums.push({ el, t0: 0, life: 0.9, x: 0, y: 0, z: 0, jitter: 0, lift: 0, crit: false, live: false });
      }
      vignette = document.createElement('div');
      vignette.className = 'fx-vignette';
      ctx.overlay.appendChild(vignette);
      const b = ctx.bus;
      offs.push(
        b.on('hit', onHit),
        b.on('footstep', (ev) => {
          const t = now();
          if (ev.who === 'hero') {
            if (state && state.hero.ext.steps! % 2 === 0) dustRing(t, ev.pos.x, ev.pos.z, 3, 0.7, 0.22, 0.45, 0xeadfca, 0.45, 0.1);
          } else if (ev.who === 'golem') dustRing(t, ev.pos.x, ev.pos.z, 6, 1.2, 0.4, 0.6);
        }),
        b.on('dodge', (ev) => dustRing(now(), ev.pos.x, ev.pos.z, 4, 1.3, 0.28, 0.5, 0xeadfca, 0.5, 0.15)),
        b.on('perfectDodge', (ev) => {
          const t = now();
          const y = groundHeight(ev.pos.x, ev.pos.z) + 0.6;
          for (let i = 0; i < 14; i++) {
            const a = (i / 14) * TAU;
            e.x = ev.pos.x; e.y = y + rnd() * 0.4; e.z = ev.pos.z;
            e.vx = Math.sin(a) * 2.4; e.vz = Math.cos(a) * 2.4; e.vy = 0.8 + rnd();
            e.gravity = 2; e.drag = 3; e.life = 0.45; e.size0 = 0.09; e.size1 = 0.02; e.floor = -Infinity;
            tint(0x7fe9ff, 1);
            sparks.emit(t, e);
          }
        }),
        b.on('impact', (ev) => {
          const t = now();
          const s = state;
          const d = s ? Math.hypot(s.hero.pos.x - ev.pos.x, s.hero.pos.z - ev.pos.z) : 99;
          if (ev.attack === 'sweep') {
            dustRing(t, ev.pos.x, ev.pos.z, 12, 2.4, 0.45, 0.6);
            rig.shake(0.2, 0.4);
            return;
          }
          // Slams (and boulder landings): a 24-puff dust ring that races out with the shockwave, + chips.
          dustRing(t, ev.pos.x, ev.pos.z, 24, 4.2, 0.55, 0.85, 0xe6dccb, 0.65, 0.4);
          dustRing(t, ev.pos.x, ev.pos.z, 8, 1.0, 0.7, 0.9, 0xd8ccb8, 0.5, 0.2);
          chipBurst(t, ev.pos.x, groundHeight(ev.pos.x, ev.pos.z) + 0.1, ev.pos.z, 0, 1, 8);
          rig.shake(d <= 6 ? 0.6 : 0.3, 0.6);
        }),
        b.on('death', (ev) => {
          const t = now();
          if (ev.target === 'golem') {
            for (let i = 0; i < 3; i++) dustRing(t + i * 0.25, ev.pos.x, ev.pos.z, 10, 2.2 + i, 0.8, 1.2, 0xe2d8c6, 0.6, 0.8);
            chipBurst(t, ev.pos.x, 2, ev.pos.z, 0, 1, 16);
            rig.shake(0.7, 1);
          } else if (ev.target === 'minion') {
            chipBurst(t, ev.pos.x, 0.4, ev.pos.z, 0, 1, 6);
            dustRing(t, ev.pos.x, ev.pos.z, 6, 1.4, 0.35, 0.5);
          } else dustRing(t, ev.pos.x, ev.pos.z, 8, 1.2, 0.4, 0.7);
        }),
        b.on('stagger', (ev) => {
          if (ev.target === 'golem' && state) sparkBurst(now(), state.golem.pos.x, 3.2, state.golem.pos.z, 0, 0, 10, 0xffd27a);
        }),
      );
    },

    update(f: FrameInfo) {
      const s = f.state;
      if (s !== emitState && emitState !== null) {
        // Rendering a sim that has not stepped yet (fresh seed): nothing of the old one may linger.
        emitState = s;
        clearAll();
      }
      state = s;
      const t = (s.frame + f.alpha) / 60;
      sparks.update(t);
      dust.update(t);
      chips.update(t);

      // Damage numbers follow their world point (projected), rising and fading on the sim clock.
      const cam = ctx.camera;
      const w = ctx.overlay.clientWidth || innerWidth, h = ctx.overlay.clientHeight || innerHeight;
      for (const n of nums) {
        if (!n.live) continue;
        const age = (t - n.t0) * 1000;
        if (age < 0 || age >= n.life * 1000) {
          n.live = false;
          n.el.hidden = true;
          continue;
        }
        const k = numberAt(age, n.life * 1000);
        v.set(n.x, n.y, n.z).project(cam);
        const sx = ((v.x + 1) / 2) * w + n.jitter, sy = ((1 - v.y) / 2) * h - k.rise - n.lift;
        n.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${k.scale.toFixed(3)})`;
        n.el.style.opacity = k.alpha.toFixed(3);
        n.el.style.zIndex = String(Math.round(n.t0 * 60));
      }

      // Hurt edge vignette: 25 % for 300 ms (off under reduceFlash).
      const ha = (t - hurtAt) / 0.3;
      const on = ha >= 0 && ha < 1 && !ctx.settings.get().reduceFlash;
      vignette.style.opacity = on ? (1 - ha * ha).toFixed(3) : '0';
    },

    setQuality(q: Quality) {
      const k = q === 'low' ? 0.5 : 1;
      sparks.setLimit(Math.round(FX_CAPS.sparks * k));
      dust.setLimit(Math.round(FX_CAPS.dust * k));
      chips.setLimit(Math.round(FX_CAPS.chips * k));
    },

    dispose() {
      for (const o of offs) o();
      sparks.dispose();
      dust.dispose();
      for (const n of nums) n.el.remove();
      vignette.remove();
    },
  };
};
