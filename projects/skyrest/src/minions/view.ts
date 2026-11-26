// src/minions/view.ts — owned by WO-004. Pebble minions (experience.md §4.5): one mossy boulder, one glowing eye
// rune, two pebble feet. They pop out of the Guardian in an arc, hop as they chase, squash during the 400 ms bump
// telegraph, flash when struck, and burst into 6 shards. State-driven (no clocks of their own).
import * as THREE from 'three';
import type { CreateMinionsView, FrameInfo, MinionState, RenderContext } from '../contracts.ts';
import { lerp, lerpAngle } from '../core/math.ts';
import { MINION } from '../tuning/golem.ts';
import { PALETTE } from '../tuning/world.ts';
import { toonMaterial, glowSprite } from '../render/materials.ts';
import { groundHeight } from '../world/ground.ts';
import { partGeometry, runeMaterial, runeTexture, type PartSpec } from '../golem/parts.ts';
import { mx } from './sim.ts';

const SHARDS = 6;
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
function hash(i: number, k: number): number {
  const x = Math.sin(i * 39.17 + k * 11.13) * 15731.743;
  return x - Math.floor(x);
}

const PEBBLE: PartSpec = { name: 'pebble', rest: [0, 0, 0], size: [0.32, 0.28, 0.3], boxy: 0.1, seed: 41, moss: 0.55, order: 0, role: 'torso', side: 0, rune: { dir: [0, 0.15, 1], glyph: 'eye', size: 0.26, group: 'chest' } };

interface Pebble {
  root: THREE.Group;
  body: THREE.Mesh;
  mat: THREE.MeshLambertMaterial;
  feet: THREE.Mesh[];
  halo: THREE.Sprite;
}

export const createMinionsView: CreateMinionsView = () => {
  let ctx!: RenderContext;
  const pebbles: Pebble[] = [];
  let shards!: THREE.InstancedMesh;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();

  function pose(pb: Pebble, m: MinionState, f: FrameInfo): void {
    const tf = Math.max(0, m.actionFrame - 1 + f.alpha);
    const x = mx(m);
    let px = lerp(m.prevPos.x, m.pos.x, f.alpha), pz = lerp(m.prevPos.z, m.pos.z, f.alpha);
    let hop = 0, sx = 1, sy = 1, grow = 1;
    if (m.action === 'spawn') {
      const t = clamp01(tf / MINION.spawnFrames);
      px = lerp(x.fromX, x.toX, t);
      pz = lerp(x.fromZ, x.toZ, t);
      hop = 1.6 * 4 * t * (1 - t) + (1 - t) * 1.2;
      grow = 0.4 + 0.6 * t;
      sy = t > 0.9 ? 0.8 : 1.1;
    } else if (m.action === 'chase') {
      const ph = (f.time * 2.2 * Math.PI * 2) / 1.6 + m.id;
      hop = Math.abs(Math.sin(ph)) * 0.22;
      const land = 1 - Math.abs(Math.sin(ph));
      sy = 1 - 0.12 * land ** 4;
      sx = 1 + 0.08 * land ** 4;
    } else if (m.action === 'windup') {
      const t = clamp01(tf / MINION.windupFrames);
      sy = 1 - 0.32 * t;
      sx = 1 + 0.22 * t;
      px += Math.sin(f.time * 60) * 0.015 * t;
    } else if (m.action === 'strike') {
      sy = 1.15;
      sx = 0.9;
      hop = 0.15;
    } else if (m.action === 'hurt') {
      sy = 0.85;
      sx = 1.1;
    }
    pb.root.position.set(px, groundHeight(px, pz) + hop, pz);
    pb.root.rotation.y = Math.PI - lerpAngle(m.prevFacing, m.facing, f.alpha);
    pb.body.scale.set(sx * grow, sy * grow, sx * grow);
    pb.body.position.y = 0.28 * sy * grow;
    pb.mat.emissive.setScalar(m.hitFlash > 0 ? 0.9 * (m.hitFlash / 6) : 0);
    (pb.halo.material as THREE.SpriteMaterial).opacity = m.action === 'windup' ? 0.9 : 0.5;
  }

  return {
    init(c: RenderContext) {
      ctx = c;
      const geo = partGeometry(PEBBLE, 2);
      const eyeMat = runeMaterial(runeTexture('eye'));
      eyeMat.uniforms.uIntensity!.value = 3;
      const footGeo = new THREE.IcosahedronGeometry(0.1, 1).scale(1.2, 0.7, 1.4);
      const footMat = toonMaterial(PALETTE.stoneShade, { shade: PALETTE.stoneDeep });
      for (let i = 0; i < MINION.count * 2; i++) {
        const root = new THREE.Group();
        const mat = toonMaterial(0xffffff, { vertexColors: true, rim: true, shade: 0x8c9db8 }) as THREE.MeshLambertMaterial;
        const body = new THREE.Mesh(geo, mat);
        body.castShadow = true;
        const eye = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), eyeMat);
        eye.position.set(0, 0.04, (geo.userData.faceDist as number) + 0.01);
        eye.renderOrder = 3;
        body.add(eye);
        const halo = glowSprite(PALETTE.rune, 0.5);
        halo.position.copy(eye.position).multiplyScalar(1.1);
        body.add(halo);
        const feet = [-0.14, 0.14].map((fx) => {
          const ft = new THREE.Mesh(footGeo, footMat);
          ft.position.set(fx, 0.05, 0.05);
          root.add(ft);
          return ft;
        });
        root.add(body);
        root.visible = false;
        ctx.scene.add(root);
        pebbles.push({ root, body, mat, feet, halo });
      }
      shards = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 0), toonMaterial(PALETTE.stoneMid, { shade: PALETTE.boulderShade }), pebbles.length * SHARDS);
      shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      shards.count = 0;
      shards.frustumCulled = false;
      ctx.scene.add(shards);
    },
    update(f: FrameInfo) {
      const ms = f.state.minions;
      let n = 0;
      for (let i = 0; i < pebbles.length; i++) {
        const pb = pebbles[i]!;
        const m = ms[i];
        const live = !!m && m.action !== 'inactive' && m.action !== 'dead';
        pb.root.visible = live;
        if (live) pose(pb, m!, f);
        if (m && m.action === 'dead') {
          // Burst: 6 shards fly out and drop (0.9 s).
          const t = Math.max(0, m.actionFrame - 1 + f.alpha) / 60;
          if (t > 0.9) continue;
          for (let k = 0; k < SHARDS; k++) {
            const a = (k / SHARDS) * Math.PI * 2 + hash(i, k);
            const v = 1.8 + hash(k, i) * 1.6, vy = 2.5 + hash(i + 3, k) * 2;
            const x = m.pos.x + Math.sin(a) * v * t, z = m.pos.z + Math.cos(a) * v * t;
            const y = Math.max(groundHeight(x, z) + 0.05, 0.3 + vy * t - 7 * t * t);
            p.set(x, y, z);
            e.set(t * 9 + k, t * 7, 0);
            q.setFromEuler(e);
            sc.setScalar(1 - clamp01((t - 0.6) / 0.3));
            m4.compose(p, q, sc);
            shards.setMatrixAt(n++, m4);
          }
        }
      }
      shards.count = n;
      shards.instanceMatrix.needsUpdate = true;
    },
    setQuality() {},
    dispose() {
      for (const pb of pebbles) ctx.scene.remove(pb.root);
      ctx.scene.remove(shards);
    },
  };
};
