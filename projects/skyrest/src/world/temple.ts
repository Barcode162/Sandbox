// src/world/temple.ts — owned by WO-002. The temple on its isle (§4.4): 3 plinth steps, an 8 m × 7 m facade with
// two 9 m side towers and a temple-trim cornice, a glowing portal arch, the rotating emblem (an original
// "three-feather gust" glyph in a 1.1 m ring), 4 waving banners, front columns, 2 ruined columns, rising motes.
// Built in a local frame (facade toward +z) and turned to face SSW, toward the bridge and the arena.
import * as THREE from 'three';
import { makeRng } from '../core/rng.ts';
import { AMBIENT, HALO, PALETTE, SCENERY, TEMPLE } from '../tuning/world.ts';
import { emissiveMaterial, glowSprite, softToon } from '../render/materials.ts';
import { merge, paint, place, rgbOf, type RGB } from './geo.ts';
import { stoneTexture, bannerTexture } from './textures.ts';

const WHITE = rgbOf(PALETTE.templeWhite), TRIM = rgbOf(PALETTE.templeTrim);
const asRatio = (c: RGB): RGB => [c[0] / WHITE[0], c[1] / WHITE[1], c[2] / WHITE[2]];

export interface TempleView {
  group: THREE.Group;
  /** Probe target: the building itself (plinth to tower tops). */
  building: THREE.Group;
  update(t: number): void;
}

/** Box with world-scale UVs (block courses stay the same size on every face). */
function block(w: number, h: number, d: number, x: number, y: number, z: number, color: RGB = [1, 1, 1]): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute('uv'), n = g.getAttribute('normal');
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const su = ax > 0.5 ? d : w, sv = ay > 0.5 ? d : h;
    uv.setXY(i, (uv.getX(i) * su) / 2.4, (uv.getY(i) * sv) / 2.4);
  }
  place(g, x, y + h / 2, z);
  return paint(g, () => color);
}

function cyl(r: number, h: number, x: number, y: number, z: number, seg = 10, color: RGB = [1, 1, 1], r2 = r): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r2, r, h, seg, 1);
  place(g, x, y + h / 2, z);
  return paint(g, () => color);
}

/** One curved teardrop of the emblem glyph (tip outward, round end toward the centre). */
function feather(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.2, 0.46);
  s.bezierCurveTo(-0.04, 0.43, -0.17, 0.27, -0.1, 0.13);
  s.bezierCurveTo(-0.05, 0.04, 0.1, 0.03, 0.13, 0.14);
  s.bezierCurveTo(0.16, 0.25, 0.08, 0.33, 0.2, 0.46);
  return s;
}

export function buildTemple(): TempleView {
  const group = new THREE.Group();
  const building = new THREE.Group();
  const tp = SCENERY.temple;
  group.position.set(tp.x, tp.y, tp.z);
  group.rotation.y = Math.PI - SCENERY.templeFacing;
  group.add(building);
  const trim = asRatio(TRIM), warm = asRatio(rgbOf(0xe7e2d8));
  const parts: THREE.BufferGeometry[] = [];
  // Plinth: 3 steps of 0.4 m.
  for (let k = 0; k < TEMPLE.steps; k++) parts.push(block(11 - k * 1.1, TEMPLE.stepH, 9 - k * 0.9, 0, k * TEMPLE.stepH, -0.6 + k * -0.25, k === 0 ? warm : [1, 1, 1]));
  const base = TEMPLE.steps * TEMPLE.stepH; // 1.2
  // Central hall (facade front at z = 1.3).
  parts.push(block(4.2, TEMPLE.facadeH, 4.4, 0, base, -0.9));
  parts.push(block(4.6, 0.35, 4.8, 0, base + 4.6, -0.9, trim)); // mid cornice
  parts.push(block(4.7, 0.4, 4.9, 0, base + TEMPLE.facadeH, -0.9, trim)); // top cornice
  parts.push(block(3.6, 0.7, 3.8, 0, base + TEMPLE.facadeH + 0.4, -1.0));
  const dome = new THREE.SphereGeometry(1.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  place(dome, 0, base + TEMPLE.facadeH + 1.1, -1.0);
  parts.push(paint(dome, () => [1, 1, 1]));
  parts.push(cyl(0.12, 0.7, 0, base + TEMPLE.facadeH + 2.4, -1.0, 6, trim, 0.03));
  // Wings and towers.
  for (const sd of [-1, 1]) {
    parts.push(block(1.5, 4.6, 3.6, sd * 2.85, base, -1.1));
    parts.push(block(1.7, 0.3, 3.8, sd * 2.85, base + 4.6, -1.1, trim));
    const tx = sd * 4.25;
    parts.push(block(1.5, TEMPLE.towerH, 1.6, tx, base, -0.5));
    parts.push(block(1.8, 0.35, 1.9, tx, base + TEMPLE.towerH, -0.5, trim));
    parts.push(block(1.3, 0.5, 1.4, tx, base + TEMPLE.towerH + 0.35, -0.5));
    const roof = new THREE.ConeGeometry(1.05, 1.5, 4, 1);
    place(roof, tx, base + TEMPLE.towerH + 0.85 + 0.75, -0.5, 0, Math.PI / 4, 0);
    parts.push(paint(roof, () => trim));
    // Window slits on the towers.
    parts.push(block(0.32, 1.1, 0.1, tx, base + 6.2, 0.32, asRatio(rgbOf(PALETTE.templeTrim)).map((v) => v * 0.7) as RGB));
    // Front columns flanking the portal and on the wings.
    for (const cx of [sd * 1.45, sd * 2.85]) {
      parts.push(cyl(0.22, 4.2, cx, base, 1.75, 10));
      parts.push(block(0.62, 0.22, 0.62, cx, base + 4.2, 1.75));
      parts.push(block(0.6, 0.18, 0.6, cx, base, 1.75, warm));
    }
  }
  parts.push(block(6.4, 0.3, 1.0, 0, base + 4.4, 1.75, trim)); // lintel over the columns
  // Portal frame (dark recess + trim arch).
  parts.push(block(TEMPLE.portalW + 0.5, TEMPLE.portalH + 0.4, 0.2, 0, base, 1.32, trim));
  const archRing = new THREE.TorusGeometry(TEMPLE.portalW / 2 + 0.12, 0.13, 6, 16, Math.PI);
  place(archRing, 0, base + TEMPLE.portalH - TEMPLE.portalW / 2 + 0.2, 1.45);
  parts.push(paint(archRing, () => trim));
  // Emblem backing disc.
  const disc = new THREE.CylinderGeometry(0.9, 0.9, 0.12, 24);
  place(disc, 0, base + 5.9, 1.36, Math.PI / 2, 0, 0);
  parts.push(paint(disc, () => trim.map((v) => v * 0.75) as RGB));
  // Ruined columns on the isle (outside the building group so the probe box stays the temple).
  const ruins: THREE.BufferGeometry[] = [];
  const rnd = makeRng(808);
  for (const [x, z, h] of [[-7.2, 3.2, 2.4], [7.4, 2.6, 1.5]] as const) {
    ruins.push(block(0.9, 0.25, 0.9, x, 0, z, warm));
    ruins.push(cyl(0.3, h, x, 0.25, z, 9));
    const drum = cyl(0.3, 0.55, 0, 0, 0, 9);
    place(drum, x + 0.9, 0.3, z + 0.6, Math.PI / 2, rnd() * 3, 0.2);
    ruins.push(drum);
  }
  const stoneMat = softToon(0xffffff, { vertexColors: true, map: stoneTexture(), shade: new THREE.Color().setRGB(
    rgbOf(PALETTE.templeShade)[0] / WHITE[0], rgbOf(PALETTE.templeShade)[1] / WHITE[1], rgbOf(PALETTE.templeShade)[2] / WHITE[2]) });
  // Albedo = templeWhite × vertex ratio: fold the white into the vertex colours.
  const body = merge(parts);
  const col = body.getAttribute('color');
  for (let i = 0; i < col.count; i++) col.setXYZ(i, col.getX(i) * WHITE[0], col.getY(i) * WHITE[1], col.getZ(i) * WHITE[2]);
  const bodyMesh = new THREE.Mesh(body, stoneMat);
  bodyMesh.castShadow = bodyMesh.receiveShadow = true;
  building.add(bodyMesh);
  const ruinGeo = merge(ruins);
  const rc = ruinGeo.getAttribute('color');
  for (let i = 0; i < rc.count; i++) rc.setXYZ(i, rc.getX(i) * WHITE[0], rc.getY(i) * WHITE[1], rc.getZ(i) * WHITE[2]);
  const ruinMesh = new THREE.Mesh(ruinGeo, stoneMat);
  group.add(ruinMesh);

  // Portal: glowing arch that shimmers 1.6 ± 0.2 at 0.7 Hz.
  const ps = new THREE.Shape();
  const pw = TEMPLE.portalW / 2, ph = TEMPLE.portalH;
  ps.moveTo(-pw, 0);
  ps.lineTo(pw, 0);
  ps.lineTo(pw, ph - pw);
  ps.absarc(0, ph - pw, pw, 0, Math.PI, false);
  ps.lineTo(-pw, 0);
  const portalMat = emissiveMaterial(PALETTE.portal, 1.6);
  const portalBase = portalMat.color.clone().multiplyScalar(1 / 1.6);
  const portal = new THREE.Mesh(new THREE.ShapeGeometry(ps, 12), portalMat);
  portal.position.set(0, base + 0.02, 1.44);
  building.add(portal);

  // Emblem: ring + three feathers, rotating 6°/s about the facade normal.
  const emblem = new THREE.Group();
  emblem.position.set(0, base + 5.9, 1.46);
  const emblemMat = emissiveMaterial(PALETTE.emblem, 2.0);
  const ring = new THREE.TorusGeometry(TEMPLE.emblemR, 0.07, 6, 32);
  const glyphs: THREE.BufferGeometry[] = [ring];
  for (let k = 0; k < 3; k++) {
    const f = new THREE.ShapeGeometry(feather(), 8);
    f.rotateZ((k * Math.PI * 2) / 3);
    glyphs.push(f);
  }
  const dot = new THREE.CircleGeometry(0.07, 12);
  glyphs.push(dot);
  const emblemMesh = new THREE.Mesh(merge(glyphs), emblemMat);
  emblem.add(emblemMesh);
  building.add(emblem);

  // Banners (0.9 × 3.2, banner + trim chevron), waving 0.12·u·sin(3t − 4u); merged, CPU-animated (≈ 250 verts).
  const bannerSpots: [number, number, number][] = [[-4.25, base + 7.6, 0.37], [4.25, base + 7.6, 0.37], [-2.85, base + 4.35, 0.8], [2.85, base + 4.35, 0.8]];
  const bparts: THREE.BufferGeometry[] = [];
  for (const [x, yTop, z] of bannerSpots) {
    const b = new THREE.PlaneGeometry(TEMPLE.bannerW, TEMPLE.bannerH, 3, 10);
    place(b, x, yTop - TEMPLE.bannerH / 2, z);
    bparts.push(b);
  }
  const bannerGeo = merge(bparts);
  const bPos = bannerGeo.getAttribute('position') as THREE.BufferAttribute;
  const bNrm = bannerGeo.getAttribute('normal') as THREE.BufferAttribute;
  const restPos = Float32Array.from(bPos.array as Float32Array);
  const bU = new Float32Array(bPos.count);
  for (let i = 0; i < bPos.count; i++) {
    const y = bPos.getY(i);
    const spot = bannerSpots.reduce((best, s) => (Math.abs(s[0] - bPos.getX(i)) < Math.abs(best[0] - bPos.getX(i)) ? s : best));
    bU[i] = Math.min(1, Math.max(0, (spot[1] - y) / TEMPLE.bannerH));
  }
  const bannerMat = softToon(0xffffff, { map: bannerTexture(), shade: new THREE.Color(0.55, 0.62, 0.85) }, { side: THREE.DoubleSide, noCloudShadow: true });
  bannerMat.alphaTest = 0.5;
  const banners = new THREE.Mesh(bannerGeo, bannerMat);
  banners.castShadow = true;
  building.add(banners);
  // Gold banner poles (merged into the trim-coloured stone mesh would tint them; keep them in their own tiny mesh).
  const poles: THREE.BufferGeometry[] = [];
  for (const [x, yTop, z] of bannerSpots) {
    const p = new THREE.CylinderGeometry(0.045, 0.045, TEMPLE.bannerW + 0.3, 6);
    place(p, x, yTop + 0.03, z + 0.02, 0, 0, Math.PI / 2);
    poles.push(paint(p, () => rgbOf(PALETTE.bannerTrim)));
  }
  building.add(new THREE.Mesh(merge(poles), softToon(0xffffff, { vertexColors: true })));

  // Light motes rising near the portal.
  const moteGeo = new THREE.BufferGeometry();
  const moteSeed = new Float32Array(AMBIENT.motes * 3);
  const motePos = new Float32Array(AMBIENT.motes * 3);
  const mr = makeRng(99);
  for (let i = 0; i < AMBIENT.motes; i++) moteSeed.set([(mr() - 0.5) * 3, mr(), 1.6 + mr() * 1.4], i * 3);
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    color: new THREE.Color(PALETTE.portal).multiplyScalar(1.6), size: 0.12, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }));
  motes.frustumCulled = false;
  building.add(motes);

  // Low-tier halos (bloom stand-ins), pulsing with their sources.
  const emblemHalo = glowSprite(PALETTE.emblem, TEMPLE.emblemR * 2 * HALO.sizeScale * 2, 1);
  emblemHalo.position.copy(emblem.position).add(new THREE.Vector3(0, 0, 0.1));
  const portalHalo = glowSprite(PALETTE.portal, TEMPLE.portalH * HALO.sizeScale * 0.8);
  portalHalo.position.set(0, base + TEMPLE.portalH * 0.5, 1.6);
  // Over a white facade an additive halo vanishes (white + cyan = white): tint by normal blending instead.
  for (const h of [emblemHalo, portalHalo]) h.material.blending = THREE.NormalBlending;
  building.add(emblemHalo, portalHalo);

  return {
    group,
    building,
    update(t) {
      emblem.rotation.z = -t * ((TEMPLE.emblemSpinDeg * Math.PI) / 180);
      const shimmer = 1.6 + AMBIENT.portalShimmer * Math.sin(t * Math.PI * 2 * AMBIENT.portalHz);
      portalMat.color.copy(portalBase).multiplyScalar(shimmer);
      emblemMat.color.set(PALETTE.emblem).multiplyScalar(2.0 * (0.95 + 0.05 * Math.sin(t * 2.1)));
      portalHalo.material.opacity = HALO.opacity * (shimmer / 1.6);
      emblemHalo.material.opacity = 0.9 + 0.1 * Math.sin(t * 2.1);
      for (let i = 0; i < bPos.count; i++) {
        const u = bU[i]!;
        const w = AMBIENT.bannerAmp * u * Math.sin(3 * t - 4 * u + restPos[i * 3]! * 0.7);
        bPos.setXYZ(i, restPos[i * 3]! + w * 0.25, restPos[i * 3 + 1]!, restPos[i * 3 + 2]! + w);
        const slope = AMBIENT.bannerAmp * (Math.sin(3 * t - 4 * u) - 4 * u * Math.cos(3 * t - 4 * u));
        const ny = -slope / TEMPLE.bannerH, len = Math.hypot(ny, 1);
        bNrm.setXYZ(i, 0, ny / len, 1 / len);
      }
      bPos.needsUpdate = true;
      bNrm.needsUpdate = true;
      for (let i = 0; i < AMBIENT.motes; i++) {
        const sx = moteSeed[i * 3]!, ph = moteSeed[i * 3 + 1]!, sp = moteSeed[i * 3 + 2]!;
        const k = (t * 0.22 * sp + ph) % 1;
        motePos[i * 3] = sx * (1 - k * 0.3) + Math.sin(t * 1.3 + ph * 9) * 0.12;
        motePos[i * 3 + 1] = base + 0.2 + k * 4.2;
        motePos[i * 3 + 2] = 1.9 + Math.cos(t + ph * 5) * 0.25;
      }
      (moteGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    },
  };
}
