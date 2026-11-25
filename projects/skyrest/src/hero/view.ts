// src/hero/view.ts — owned by WO-003. Chibi hero model + animation, interpolated from sim state.
// Scaffold: a capsule placeholder registered as probe 'hero'.
import * as THREE from 'three';
import type { CreateHeroView, FrameInfo, RenderContext } from '../contracts.ts';
import { lerp, lerpAngle } from '../core/math.ts';
import { toonMaterial } from '../render/materials.ts';

export const createHeroView: CreateHeroView = () => {
  const root = new THREE.Group();
  return {
    init(ctx: RenderContext) {
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.6, 4, 12), toonMaterial(0x2f6fd6));
      body.position.y = 0.65;
      body.castShadow = true;
      root.add(body);
      ctx.scene.add(root);
      ctx.probe.register('hero', root);
    },
    update(f: FrameInfo) {
      const h = f.state.hero;
      root.position.set(lerp(h.prevPos.x, h.pos.x, f.alpha), 0, lerp(h.prevPos.z, h.pos.z, f.alpha));
      // three: rotation.y = θ turns +z toward +x; our facing 0 = -z, so rotation.y = PI - facing.
      root.rotation.y = Math.PI - lerpAngle(h.prevFacing, h.facing, f.alpha);
    },
    setQuality() {},
    dispose() {},
  };
};
