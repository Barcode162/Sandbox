// src/world/view.ts — owned by WO-002. Assembles the world (§4.4) and runs its ambient life (§6): sky, cloud sea,
// isles, trees, rocks, grass, flowers, petals, bridge, temple, waterfalls; the lights (hemisphere + one sun whose
// texel-snapped shadow frustum follows the hero), fog, and the canopy occlusion dither (§4.3). Statics are merged
// by material so the whole world stays a few dozen draws (budget: ≤ 250 incl. characters, shadows and post).
import * as THREE from 'three';
import type { CreateWorldView, FrameInfo, Quality, RenderContext } from '../contracts.ts';
import { lerp } from '../core/math.ts';
import { AMBIENT, LIGHT, PALETTE, QUALITY, SCENERY } from '../tuning/world.ts';
import { ARENA } from '../tuning/arena.ts';
import { softToon, TOON_SHARED } from '../render/materials.ts';
import { rgbOf } from './geo.ts';
import { groundHeight } from './ground.ts';
import { buildIslands } from './islands.ts';
import { buildTrees, flowerGeometry, petalPose, scatterFlowers, scatterTufts, seedPetals, tuftGeometry } from './foliage.ts';
import { buildRocks } from './rocks.ts';
import { buildBridge, signTexture } from './bridge.ts';
import { buildTemple } from './temple.ts';
import { buildWater } from './water.ts';
import { buildSky } from './sky.ts';
import { cliffTexture, grassTexture, leafTexture, woodTexture } from './textures.ts';

/** shade/lit as a linear-RGB tint colour (materials whose albedo lives in vertex colours use colour white). */
function tint(lit: number, shade: number): THREE.Color {
  const a = rgbOf(lit), b = rgbOf(shade);
  return new THREE.Color(Math.min(1, b[0] / a[0]), Math.min(1, b[1] / a[1]), Math.min(1, b[2] / a[2]));
}

export const createWorldView: CreateWorldView = () => {
  const root = new THREE.Group();
  root.name = 'world';
  const sun = new THREE.DirectionalLight(LIGHT.sunColor, LIGHT.sunIntensity);
  const sunDir = new THREE.Vector3(LIGHT.sunDir.x, LIGHT.sunDir.y, LIGHT.sunDir.z).normalize();
  let ctx!: RenderContext;
  let quality: Quality = 'high';
  // Built in init; referenced by update.
  let sky!: ReturnType<typeof buildSky>, water!: ReturnType<typeof buildWater>, temple!: ReturnType<typeof buildTemple>;
  let tufts!: THREE.InstancedMesh, flowers!: THREE.InstancedMesh, petals!: THREE.InstancedMesh;
  let petalState!: ReturnType<typeof seedPetals>;
  let canopies!: { x: number; y: number; z: number; r: number }[];
  const canopyFade = { value: [] as number[] };
  const pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, s: 0 };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const heroP = new THREE.Vector3(), seg = new THREE.Vector3(), toC = new THREE.Vector3();
  // Light-space rotation (sun direction is fixed): world → light via the inverse, back via the rotation.
  const lastCam = new THREE.Vector3(Infinity, 0, 0);
  let fadeDt = 0;
  /** A canopy sphere crossing camera → hero dithers to 35 % in 180 ms and restores in 300 ms (§4.3, §12 item 15).
   *  A camera cut (> 3 m jump: snap, retry, moments) snaps the fades instead of easing from a stale view. */
  const updateCanopyFade = (camera: THREE.Camera) => {
    const cut = camera.position.distanceToSquared(lastCam) > 9;
    lastCam.copy(camera.position);
    seg.subVectors(heroP, camera.position);
    const len = seg.length();
    seg.divideScalar(len || 1);
    for (let i = 0; i < canopies.length; i++) {
      const c = canopies[i]!;
      toC.set(c.x - camera.position.x, c.y - camera.position.y, c.z - camera.position.z);
      const along = toC.dot(seg);
      const d2 = toC.lengthSq() - along * along;
      const goal = along > -c.r && along < len && d2 < c.r * c.r ? AMBIENT.canopyDitherOpacity : 1;
      const cur = canopyFade.value[i]!;
      const ms = goal < cur ? AMBIENT.canopyDitherInMs : AMBIENT.canopyDitherOutMs;
      canopyFade.value[i] = cut ? goal : cur + (goal - cur) * Math.min(1, (fadeDt * 1000) / ms);
    }
    fadeDt = 0;
  };
  const lightRot = new THREE.Matrix4().lookAt(sunDir, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
  const lightInv = lightRot.clone().invert();
  const snapV = new THREE.Vector3();

  const applyQuality = () => {
    const Q = QUALITY[quality];
    tufts.count = Q.grassTufts;
    flowers.count = Q.flowers;
    petals.count = Q.petals;
    sky.setQuality(quality === 'low');
    if (sun.shadow.mapSize.x !== Q.shadowMapSize) {
      sun.shadow.mapSize.set(Q.shadowMapSize, Q.shadowMapSize);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
  };

  return {
    sun,
    init(c: RenderContext) {
      ctx = c;
      const { scene } = ctx;
      scene.background = new THREE.Color(PALETTE.skyHorizon);
      scene.fog = new THREE.FogExp2(LIGHT.fogColor, LIGHT.fogDensity);
      scene.add(new THREE.HemisphereLight(LIGHT.skyColor, LIGHT.groundColor, LIGHT.hemiIntensity));
      // Sun + shadow (ortho 34 m around the hero, texel-snapped in update).
      sun.castShadow = true;
      sun.shadow.mapSize.set(QUALITY.high.shadowMapSize, QUALITY.high.shadowMapSize);
      sun.shadow.bias = LIGHT.shadowBias;
      sun.shadow.normalBias = LIGHT.shadowNormalBias;
      sun.shadow.radius = LIGHT.shadowRadius;
      const cam = sun.shadow.camera;
      cam.left = cam.bottom = -LIGHT.shadowExtent / 2;
      cam.right = cam.top = LIGHT.shadowExtent / 2;
      cam.near = 1;
      cam.far = 90;
      cam.updateProjectionMatrix();
      scene.add(sun, sun.target);

      sky = buildSky();
      root.add(sky.group);

      // Isles: one grass mesh, one cliff mesh.
      const contact = [...ARENA.colliders, ...SCENERY.boulders.filter((b) => b.y !== undefined).map((b) => ({ x: b.x, z: b.z, r: b.r }))];
      const isles = buildIslands(contact);
      const grassMat = softToon(0xffffff, { vertexColors: true, map: grassTexture(), shade: tint(PALETTE.grassLit, PALETTE.grassShade) });
      const tops = new THREE.Mesh(isles.tops, grassMat);
      tops.receiveShadow = true;
      const cliffMat = softToon(PALETTE.cliffLit, { vertexColors: true, map: cliffTexture(), shade: PALETTE.cliffShade });
      const cliffs = new THREE.Mesh(isles.cliffs, cliffMat);
      cliffs.receiveShadow = true;
      root.add(tops, cliffs);
      // Probe 'arena': the arena's own top (an invisible-material twin, so the probe box is the arena only).
      const arenaProbe = new THREE.Mesh(isles.arenaTop, new THREE.MeshBasicMaterial({ visible: false }));
      root.add(arenaProbe);
      ctx.probe.register('arena', arenaProbe);

      // Trees: trunks, leaf canopies, blossom canopy (per-tree pivots → breathing, sway, dither).
      const trees = buildTrees();
      canopies = trees.canopies;
      canopyFade.value = canopies.map(() => 1);
      const trunkMat = softToon(PALETTE.trunk, { vertexColors: true, rim: true, shade: PALETTE.trunkShade });
      const leafTex = leafTexture();
      const leafMat = softToon(PALETTE.leafLit, { vertexColors: true, rim: true, map: leafTex, shade: PALETTE.leafShade }, { canopy: true, canopyFade });
      const blossomMat = softToon(PALETTE.blossomLit, { vertexColors: true, rim: true, shade: PALETTE.blossomShade },
        { canopy: true, canopyFade, side: THREE.DoubleSide });
      for (const [g, mat] of [[trees.trunks, trunkMat], [trees.leaves, leafMat], [trees.blossom, blossomMat]] as const) {
        const mesh = new THREE.Mesh(g, mat);
        mesh.castShadow = mesh.receiveShadow = true;
        root.add(mesh);
      }

      // Rocks.
      const rocks = new THREE.Mesh(buildRocks(), softToon(PALETTE.boulderLit, { vertexColors: true, shade: PALETTE.boulderShade }));
      rocks.castShadow = rocks.receiveShadow = true;
      root.add(rocks);

      // Grass tufts + flowers (instanced; counts follow the quality tier).
      const tuftData = scatterTufts(QUALITY.high.grassTufts);
      const tuftMat = softToon(0xffffff, { vertexColors: true, sway: 1, shade: tint(PALETTE.grassLit, PALETTE.grassShade) }, { gust: true, side: THREE.DoubleSide });
      tufts = new THREE.InstancedMesh(tuftGeometry(), tuftMat, tuftData.length);
      const col = new THREE.Color();
      tuftData.forEach((d, i) => {
        m4.compose(p.set(d.x, d.y, d.z), q.setFromEuler(e.set(0, d.yaw, 0)), sc.setScalar(d.s));
        tufts.setMatrixAt(i, m4);
        tufts.setColorAt(i, col.setRGB(0.88 + d.tint * 0.2, 0.92 + d.tint * 0.12, 0.85 + d.tint * 0.1));
      });
      tufts.receiveShadow = true;
      tufts.frustumCulled = false;
      const flowerData = scatterFlowers(QUALITY.high.flowers);
      flowers = new THREE.InstancedMesh(flowerGeometry(), softToon(0xffffff, { vertexColors: true, sway: 0.5 }, { side: THREE.DoubleSide }), flowerData.length);
      flowerData.forEach((d, i) => {
        m4.compose(p.set(d.x, d.y, d.z), q.setFromEuler(e.set((d.tint - 0.5) * 0.3, d.yaw, 0)), sc.setScalar(d.s));
        flowers.setMatrixAt(i, m4);
        flowers.setColorAt(i, col.setHex(d.color, THREE.SRGBColorSpace));
      });
      flowers.receiveShadow = true;
      flowers.frustumCulled = false;
      root.add(tufts, flowers);

      // Falling petals.
      petalState = seedPetals(QUALITY.high.petals);
      const petalGeo = new THREE.CircleGeometry(0.06, 5);
      petalGeo.scale(1, 0.7, 1);
      petals = new THREE.InstancedMesh(petalGeo, softToon(PALETTE.petal, { shade: PALETTE.blossomShade }, { side: THREE.DoubleSide, noCloudShadow: true }), petalState.length);
      petals.frustumCulled = false;
      root.add(petals);

      // Bridge.
      const woodTex = woodTexture();
      const bridge = buildBridge(softToon(PALETTE.wood, { map: woodTex, shade: PALETTE.woodShade }));
      const bridgeGroup = new THREE.Group();
      const frame = new THREE.Mesh(bridge.frame, softToon(PALETTE.wood, { vertexColors: true, shade: PALETTE.woodShade }));
      frame.castShadow = true;
      bridgeGroup.add(bridge.planks, frame);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.44), softToon(0xffffff, { map: signTexture(), shade: tint(PALETTE.wood, PALETTE.woodShade) }));
      sign.position.copy(bridge.sign.pos);
      sign.rotation.y = bridge.sign.yaw + Math.PI;
      root.add(bridgeGroup, sign);
      ctx.probe.register('bridge', bridgeGroup);

      // Temple, waterfalls.
      temple = buildTemple();
      root.add(temple.group);
      ctx.probe.register('temple', temple.building);
      water = buildWater();
      root.add(water.group);

      scene.add(root);
      const prevBefore = scene.onBeforeRender;
      scene.onBeforeRender = (...args: Parameters<THREE.Object3D['onBeforeRender']>) => {
        prevBefore.apply(scene, args);
        if (args[2] === ctx.camera) updateCanopyFade(args[2]);
      };
      applyQuality();
    },
    update(f: FrameInfo) {
      const t = f.time;
      TOON_SHARED.time.value = t;
      const camera = ctx.camera;
      // Shadow frustum follows the hero, snapped to whole shadow texels so edges never crawl.
      const h = f.state.hero;
      const hx = lerp(h.prevPos.x, h.pos.x, f.alpha), hz = lerp(h.prevPos.z, h.pos.z, f.alpha);
      const texel = LIGHT.shadowExtent / sun.shadow.mapSize.x;
      snapV.set(hx, 0, hz).applyMatrix4(lightInv);
      snapV.x = Math.round(snapV.x / texel) * texel;
      snapV.y = Math.round(snapV.y / texel) * texel;
      snapV.applyMatrix4(lightRot);
      sun.target.position.copy(snapV);
      sun.position.copy(snapV).addScaledVector(sunDir, 45);
      sun.target.updateMatrixWorld();

      sky.update(t, camera);
      water.update(t, camera);
      temple.update(t);

      // Petals.
      for (let i = 0; i < petals.count; i++) {
        petalPose(petalState[i]!, t, pose);
        m4.compose(p.set(pose.x, pose.y, pose.z), q.setFromEuler(e.set(pose.rx, pose.ry, 0)), sc.setScalar(pose.s || 1e-4));
        petals.setMatrixAt(i, m4);
      }
      petals.instanceMatrix.needsUpdate = true;

      // Canopy occlusion runs at render time (after the camera rig has placed the camera this frame).
      heroP.set(hx, groundHeight(hx, hz) + 0.8, hz);
      fadeDt = f.dt;
    },
    setQuality(qu: Quality) {
      quality = qu;
      if (tufts) applyQuality();
    },
    dispose() {
      ctx?.scene.remove(root);
    },
  };
};

