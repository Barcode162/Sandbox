// src/golem/view.ts — owned by WO-004. Stone Guardian: mossy boulder parts, glowing runes/eyes, anims,
// telegraph decals, crumble on death. Scaffold: stacked placeholder boulders registered as probe 'golem'.
import * as THREE from 'three';
import type { CreateGolemView, FrameInfo, RenderContext } from '../contracts.ts';
import { lerp, lerpAngle } from '../core/math.ts';
import { PALETTE } from '../tuning/world.ts';
import { toonMaterial } from '../render/materials.ts';

export const createGolemView: CreateGolemView = () => {
  const root = new THREE.Group();
  return {
    init(ctx: RenderContext) {
      const mat = toonMaterial(PALETTE.stone);
      const body = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), mat);
      body.position.y = 1.6;
      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55), mat);
      head.position.y = 2.95;
      for (const m of [body, head]) m.castShadow = true;
      root.add(body, head);
      ctx.scene.add(root);
      ctx.probe.register('golem', root);
    },
    update(f: FrameInfo) {
      const g = f.state.golem;
      root.position.set(lerp(g.prevPos.x, g.pos.x, f.alpha), 0, lerp(g.prevPos.z, g.pos.z, f.alpha));
      root.rotation.y = Math.PI - lerpAngle(g.prevFacing, g.facing, f.alpha);
      root.visible = g.action !== 'dead';
    },
    setQuality() {},
    dispose() {},
  };
};
