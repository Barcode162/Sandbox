// src/world/view.ts — owned by WO-002. Sky, arena island, temple island, bridge, waterfalls, cloud sea,
// foliage, framing trees, lights, fog, ambient motion. Scaffold: placeholder blockout with the probe anchors.
import * as THREE from 'three';
import type { CreateWorldView, FrameInfo, Quality, RenderContext } from '../contracts.ts';
import { ARENA } from '../tuning/arena.ts';
import { LIGHT, PALETTE, SCENERY } from '../tuning/world.ts';
import { toonMaterial } from '../render/materials.ts';

export const createWorldView: CreateWorldView = () => {
  const root = new THREE.Group();
  const sun = new THREE.DirectionalLight(LIGHT.sunColor, LIGHT.sunIntensity);
  return {
    sun,
    init(ctx: RenderContext) {
      const { scene } = ctx;
      scene.background = new THREE.Color(PALETTE.skyHorizon);
      scene.fog = new THREE.Fog(LIGHT.fogColor, LIGHT.fogNear, LIGHT.fogFar);
      scene.add(new THREE.HemisphereLight(LIGHT.skyColor, LIGHT.groundColor, LIGHT.hemiIntensity));
      sun.position.set(LIGHT.sunDir.x * 30, LIGHT.sunDir.y * 30, LIGHT.sunDir.z * 30);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      const sc = sun.shadow.camera;
      sc.left = sc.bottom = -14;
      sc.right = sc.top = 14;
      scene.add(sun, sun.target);

      const arena = new THREE.Mesh(new THREE.CylinderGeometry(ARENA.radius + 1, ARENA.radius - 2, 4, 32), toonMaterial(PALETTE.grass));
      arena.position.y = -2;
      arena.receiveShadow = true;
      root.add(arena);

      const t = SCENERY.templeIsland;
      const island = new THREE.Mesh(new THREE.CylinderGeometry(SCENERY.templeIslandRadius, 3, 34, 24), toonMaterial(PALETTE.stone));
      island.position.set(t.x, t.y - 17, t.z);
      const tp = SCENERY.temple;
      const temple = new THREE.Mesh(new THREE.BoxGeometry(8, 7, 4), toonMaterial(PALETTE.templeWhite));
      temple.position.set(tp.x, tp.y + 3.5, tp.z);
      root.add(island, temple);

      const f = ARENA.bridgeFoot, p2 = SCENERY.bridgeP2;
      const len = Math.hypot(p2.x - f.x, p2.y - 0.1, p2.z - f.z);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, len), toonMaterial(PALETTE.wood));
      bridge.position.set((f.x + p2.x) / 2, (0.1 + p2.y) / 2, (f.z + p2.z) / 2);
      bridge.lookAt(p2.x, p2.y, p2.z);
      root.add(bridge);
      scene.add(root);

      ctx.probe.register('arena', arena);
      ctx.probe.register('temple', temple);
      ctx.probe.register('bridge', bridge);
    },
    update(_f: FrameInfo) {},
    setQuality(_q: Quality) {},
    dispose() {},
  };
};
