// src/world/bridge.ts — owned by WO-002. The rope bridge (§4.4): P1 on the arena's NE lip → P2 on the temple
// isle, catenary sag 0.7 m, 84 instanced planks with ±3° jitter, two sagging rope rails strung between 5 post
// pairs, thick end posts with rope wraps, hanger ropes, and the "sealed… for now" signboard at P1.
import * as THREE from 'three';
import { ARENA } from '../tuning/arena.ts';
import { BRIDGE, PALETTE, SCENERY } from '../tuning/world.ts';
import { makeRng } from '../core/rng.ts';
import { merge, paint, place, rgbOf } from './geo.ts';
import { groundHeight } from './ground.ts';

const P1 = new THREE.Vector3(ARENA.bridgeFoot.x, SCENERY.bridgeP1Y, ARENA.bridgeFoot.z);
const P2 = new THREE.Vector3(SCENERY.bridgeP2.x, SCENERY.bridgeP2.y, SCENERY.bridgeP2.z);

/** Deck centreline at t ∈ [0, 1] (parabolic catenary approximation). */
export function deckPoint(t: number, out = new THREE.Vector3()): THREE.Vector3 {
  out.lerpVectors(P1, P2, t);
  out.y -= 4 * BRIDGE.sag * t * (1 - t);
  return out;
}

export interface BridgeBuild {
  planks: THREE.InstancedMesh;
  /** Posts, ropes, wraps, hangers (one merged vertex-coloured mesh). */
  frame: THREE.BufferGeometry;
  /** Where the signboard's painted face goes (world position + yaw). */
  sign: { pos: THREE.Vector3; yaw: number };
}

export function buildBridge(plankMat: THREE.Material): BridgeBuild {
  const dir = new THREE.Vector3().subVectors(P2, P1);
  const flat = new THREE.Vector3(dir.x, 0, dir.z).normalize();
  const side = new THREE.Vector3(-flat.z, 0, flat.x); // to the right of travel
  const yaw = Math.atan2(flat.x, flat.z);
  const rnd = makeRng(1234);
  // ── Planks.
  const plank = new THREE.BoxGeometry(BRIDGE.plankW, BRIDGE.plankH, BRIDGE.plankD);
  const planks = new THREE.InstancedMesh(plank, plankMat, BRIDGE.planks);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  const tint = new THREE.Color();
  for (let i = 0; i < BRIDGE.planks; i++) {
    const t = (i + 0.5) / BRIDGE.planks;
    deckPoint(t, a);
    deckPoint(Math.min(1, t + 0.01), b);
    const pitch = Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z));
    const j = (BRIDGE.jitterDeg * Math.PI) / 180;
    e.set(-pitch + (rnd() - 0.5) * j * 0.5, yaw + (rnd() - 0.5) * 2 * j, (rnd() - 0.5) * 2 * j, 'YXZ');
    m.compose(a, q.setFromEuler(e), s.set(0.92 + rnd() * 0.16, 1, 1));
    planks.setMatrixAt(i, m);
    planks.setColorAt(i, tint.setScalar(0.82 + rnd() * 0.3));
  }
  planks.castShadow = planks.receiveShadow = true;
  // ── Frame: posts, rails, hangers, wraps.
  const wood = rgbOf(PALETTE.wood), woodShade = rgbOf(PALETTE.woodShade), rope = rgbOf(PALETTE.rope);
  const W = (c: [number, number, number]) => () => [c[0] / wood[0], c[1] / wood[1], c[2] / wood[2]] as [number, number, number];
  const parts: THREE.BufferGeometry[] = [];
  const half = BRIDGE.plankW / 2 + 0.08;
  const postTs = [0, 0.25, 0.5, 0.75, 1];
  const postTop: THREE.Vector3[][] = [[], []];
  for (const t of postTs) {
    const end = t === 0 || t === 1;
    deckPoint(t, a);
    if (t === 0) a.y = Math.max(a.y, groundHeight(a.x, a.z));
    for (const sd of [-1, 1]) {
      const h = end ? 1.6 : BRIDGE.railH + 0.15;
      const r = end ? 0.16 : 0.07;
      const p = new THREE.CylinderGeometry(r * 0.9, r, h, end ? 8 : 6);
      const px = a.x + side.x * sd * (half + (end ? 0.12 : 0)), pz = a.z + side.z * sd * (half + (end ? 0.12 : 0));
      const base = end ? a.y - 0.3 : a.y - 0.15;
      place(p, px, base + h / 2, pz, 0, rnd(), 0);
      parts.push(paint(p, W(end ? wood : woodShade)));
      postTop[sd < 0 ? 0 : 1]!.push(new THREE.Vector3(px, base + (end ? 1.15 : h - 0.05), pz));
      if (end)
        for (let k = 0; k < 3; k++) {
          const wrap = new THREE.TorusGeometry(r + 0.02, 0.03, 4, 10);
          place(wrap, px, base + 0.85 + k * 0.1, pz, Math.PI / 2, 0, 0);
          parts.push(paint(wrap, W(rope)));
        }
    }
  }
  // Rails: sag 0.35 m between consecutive posts; hangers every ~1.6 m down to the plank edge.
  for (const sd of [0, 1]) {
    const tops = postTop[sd]!;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k < tops.length - 1; k++) {
      const p0 = tops[k]!, p1 = tops[k + 1]!;
      for (let i = 0; i < 12; i++) {
        const u = i / 12;
        const p = new THREE.Vector3().lerpVectors(p0, p1, u);
        p.y -= 4 * BRIDGE.railSag * u * (1 - u);
        pts.push(p);
      }
    }
    pts.push(tops[tops.length - 1]!.clone());
    const curve = new THREE.CatmullRomCurve3(pts);
    parts.push(paint(new THREE.TubeGeometry(curve, 96, 0.035, 5), W(rope)));
    // Lower rope just above the deck edge.
    const low = new THREE.CatmullRomCurve3(Array.from({ length: 25 }, (_, i) => {
      const p = deckPoint(i / 24, new THREE.Vector3());
      return p.addScaledVector(side, (sd ? 1 : -1) * half).setY(p.y + 0.12);
    }));
    parts.push(paint(new THREE.TubeGeometry(low, 72, 0.025, 4), W(rope)));
    for (let i = 1; i < 16; i++) {
      const u = i / 16;
      const top = curve.getPointAt(u);
      const bottom = low.getPointAt(u);
      const len = top.distanceTo(bottom);
      const h = new THREE.CylinderGeometry(0.014, 0.014, len, 3);
      const mid = top.clone().add(bottom).multiplyScalar(0.5);
      h.rotateX(Math.PI / 2);
      h.lookAt(new THREE.Vector3().subVectors(top, bottom));
      h.translate(mid.x, mid.y, mid.z);
      parts.push(paint(h, W(rope)));
    }
  }
  // Signboard at P1: "The way up is sealed… for now." (§4.4 scenery).
  const board = new THREE.BoxGeometry(1.0, 0.5, 0.06);
  const signPos = new THREE.Vector3().copy(P1).addScaledVector(side, -(half + 0.9)).addScaledVector(flat, -0.6);
  signPos.y = groundHeight(signPos.x, signPos.z);
  place(board, signPos.x, signPos.y + 0.95, signPos.z, 0, yaw + Math.PI, 0);
  parts.push(paint(board, W(wood)));
  const stake = new THREE.CylinderGeometry(0.05, 0.06, 1.0, 5);
  place(stake, signPos.x, signPos.y + 0.5, signPos.z);
  parts.push(paint(stake, W(woodShade)));
  const face = signPos.clone().addScaledVector(flat, -0.035);
  face.y += 0.95;
  return { planks, frame: merge(parts), sign: { pos: face, yaw: yaw + Math.PI } };
}

/** The sign's painted words as a small canvas texture (plain storybook lettering). */
export function signTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8a6648';
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#5a3e2c';
  g.lineWidth = 6;
  g.strokeRect(3, 3, 250, 122);
  g.fillStyle = '#fff4dc';
  g.font = '700 26px ui-rounded, "Nunito", system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText('The way up', 128, 46);
  g.fillText('is sealed…', 128, 78);
  g.font = 'italic 600 20px ui-rounded, "Nunito", system-ui, sans-serif';
  g.fillText('for now.', 128, 106);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
