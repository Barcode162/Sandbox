// src/render/probe.ts — FROZEN (WO-001). Screen-space probe (L-0006): projects each registered object's
// world AABB to CSS pixels so layout is judged on screen, not in world space. Not a hot path (tests/critic only).
import * as THREE from 'three';
import type { ProbeRegistry, ScreenBox } from '../contracts.ts';

export const REQUIRED_PROBES = ['hero', 'golem', 'temple', 'bridge', 'arena'] as const;

export function createProbeRegistry(): ProbeRegistry {
  const objs = new Map<string, THREE.Object3D>();
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  return {
    register(name, obj) {
      objs.set(name, obj);
    },
    measure(camera, width, height) {
      const out: Record<string, ScreenBox> = {};
      camera.updateMatrixWorld();
      for (const [name, obj] of objs) {
        obj.updateWorldMatrix(true, true);
        box.setFromObject(obj);
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, front = false;
        if (!box.isEmpty()) {
          for (let i = 0; i < 8; i++) {
            v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
            v.project(camera);
            if (v.z < -1 || v.z > 1) continue;
            front = true;
            const sx = ((v.x + 1) / 2) * width, sy = ((1 - v.y) / 2) * height;
            x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
          }
        }
        const cx0 = Math.max(0, x0), cy0 = Math.max(0, y0), cx1 = Math.min(width, x1), cy1 = Math.min(height, y1);
        const visible = front && obj.visible && cx1 > cx0 && cy1 > cy0;
        const w = visible ? cx1 - cx0 : 0, h = visible ? cy1 - cy0 : 0;
        out[name] = {
          x: visible ? Math.round(cx0) : 0, y: visible ? Math.round(cy0) : 0, w: Math.round(w), h: Math.round(h),
          hFrac: +(h / height).toFixed(3),
          cx: visible ? +((cx0 + w / 2) / width).toFixed(3) : -1, cy: visible ? +((cy0 + h / 2) / height).toFixed(3) : -1,
          visible,
        };
      }
      return out;
    },
  };
}
