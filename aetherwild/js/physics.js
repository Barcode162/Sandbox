'use strict';
// ============================================================================
//  AETHERWILD — collision world (AABBs for structures, circles for nodes)
// ============================================================================
(function () {
  const G = window.G;
  const CELL = 4;
  const P = G.Phys = {
    grid: new Map(), stamp: 0,
    key(i, j) { return (i + 500) * 2000 + (j + 500); },
    addBox(b) { // b: {x0,y0,z0,x1,y1,z1, owner}
      b._keys = [];
      for (let i = Math.floor(b.x0 / CELL); i <= Math.floor(b.x1 / CELL); i++)
        for (let j = Math.floor(b.z0 / CELL); j <= Math.floor(b.z1 / CELL); j++) {
          const k = this.key(i, j); let l = this.grid.get(k); if (!l) { l = []; this.grid.set(k, l); } l.push(b); b._keys.push(k);
        }
      return b;
    },
    removeBox(b) {
      if (!b._keys) return;
      for (const k of b._keys) { const l = this.grid.get(k); if (l) { const i = l.indexOf(b); if (i >= 0) l.splice(i, 1); } }
      b._keys = null;
    },
    query(x0, z0, x1, z1, out) {
      out = out || []; out.length = 0; this.stamp++;
      for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++)
        for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) {
          const l = this.grid.get(this.key(i, j)); if (!l) continue;
          for (const b of l) if (b._s !== this.stamp) { b._s = this.stamp; out.push(b); }
        }
      return out;
    },
    // highest walkable surface under (x,z) not higher than feet+step
    groundAt(x, z, feetY, step, r) {
      let h = G.World.height(x, z);
      const q = this.query(x - 0.5, z - 0.5, x + 0.5, z + 0.5, this._g || (this._g = []));
      const e = (r || 0.3) * 0.5;
      for (const b of q) {
        if (x < b.x0 - e || x > b.x1 + e || z < b.z0 - e || z > b.z1 + e) continue;
        if (b.y1 <= feetY + step && b.y1 > h) h = b.y1;
      }
      return h;
    },
    // ceiling above head
    ceilingAt(x, z, feetY, height) {
      let c = Infinity;
      const q = this.query(x - 0.3, z - 0.3, x + 0.3, z + 0.3, this._c || (this._c = []));
      for (const b of q) {
        if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) continue;
        if (b.y0 > feetY + 0.3 && b.y0 < c) c = b.y0;
      }
      return c;
    },
    // horizontal cylinder push-out. pos = feet position (mutated). returns owner of last blocking box
    collide(pos, r, h, step, nodes) {
      let blocker = null;
      const q = this.query(pos.x - r - 0.2, pos.z - r - 0.2, pos.x + r + 0.2, pos.z + r + 0.2, this._q || (this._q = []));
      for (let it = 0; it < 2; it++) for (const b of q) {
        if (b.y1 <= pos.y + step || b.y0 >= pos.y + h) continue;
        const cx = G.clamp(pos.x, b.x0, b.x1), cz = G.clamp(pos.z, b.z0, b.z1);
        const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; pos.x += dx * k; pos.z += dz * k; }
        else {
          const a = pos.x - b.x0, bb = b.x1 - pos.x, c = pos.z - b.z0, d = b.z1 - pos.z, m = Math.min(a, bb, c, d);
          if (m === a) pos.x = b.x0 - r; else if (m === bb) pos.x = b.x1 + r; else if (m === c) pos.z = b.z0 - r; else pos.z = b.z1 + r;
        }
        blocker = b.owner;
      }
      if (nodes !== false) {
        const ns = G.World.nodesNear(pos.x, pos.z, 3, this._n || (this._n = []));
        for (const n of ns) {
          if (!n.alive || !n.collide || pos.y > n.y + n.hitH) continue;
          const dx = pos.x - n.x, dz = pos.z - n.z, d2 = dx * dx + dz * dz, rr = n.r + r;
          if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2), k = (rr - d) / d; pos.x += dx * k; pos.z += dz * k; }
        }
      }
      const lim = G.HALF - 8; pos.x = G.clamp(pos.x, -lim, lim); pos.z = G.clamp(pos.z, -lim, lim);
      return blocker;
    },
    // ray vs boxes. returns {t, point, normal, box}
    raycast(o, d, maxT) {
      const ex = o.x + d.x * maxT, ez = o.z + d.z * maxT;
      const q = this.query(Math.min(o.x, ex), Math.min(o.z, ez), Math.max(o.x, ex), Math.max(o.z, ez), this._r || (this._r = []));
      let best = null, bt = maxT;
      for (const b of q) {
        let t0 = 0, t1 = bt, nAxis = -1, nSign = 0;
        const lo = [b.x0, b.y0, b.z0], hi = [b.x1, b.y1, b.z1], oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
        let ok = true;
        for (let a = 0; a < 3; a++) {
          if (Math.abs(dd[a]) < 1e-9) { if (oo[a] < lo[a] || oo[a] > hi[a]) { ok = false; break; } continue; }
          let ta = (lo[a] - oo[a]) / dd[a], tb = (hi[a] - oo[a]) / dd[a], s = -1;
          if (ta > tb) { const t = ta; ta = tb; tb = t; s = 1; }
          if (ta > t0) { t0 = ta; nAxis = a; nSign = s; }
          if (tb < t1) t1 = tb;
          if (t0 > t1) { ok = false; break; }
        }
        if (!ok || nAxis < 0 || t0 >= bt) continue;
        bt = t0;
        const n = new THREE.Vector3(); n.setComponent(nAxis, nSign);
        best = { t: t0, point: new THREE.Vector3().copy(o).addScaledVector(d, t0), normal: n, box: b, owner: b.owner };
      }
      return best;
    },
    rayAABB(o, d, b, maxT) {
      let t0 = 0, t1 = maxT;
      const lo = [b.x0, b.y0, b.z0], hi = [b.x1, b.y1, b.z1], oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
      for (let a = 0; a < 3; a++) {
        if (Math.abs(dd[a]) < 1e-9) { if (oo[a] < lo[a] || oo[a] > hi[a]) return -1; continue; }
        let ta = (lo[a] - oo[a]) / dd[a], tb = (hi[a] - oo[a]) / dd[a];
        if (ta > tb) { const t = ta; ta = tb; tb = t; }
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return -1;
      }
      return t0;
    },
    terrainRay(o, d, maxT) {
      let prev = 0, t = 0; const W = G.World;
      while (t < maxT) {
        t = Math.min(maxT, t + 0.25);
        const y = o.y + d.y * t, h = W.height(o.x + d.x * t, o.z + d.z * t);
        if (y <= h) {
          let a = prev, b = t;
          for (let i = 0; i < 8; i++) { const m = (a + b) / 2; if (o.y + d.y * m <= W.height(o.x + d.x * m, o.z + d.z * m)) b = m; else a = m; }
          const p = new THREE.Vector3().copy(o).addScaledVector(d, b);
          return { t: b, point: p, normal: W.normal(p.x, p.z), owner: null, terrain: true };
        }
        prev = t;
      }
      return null;
    },
  };

  // ray helpers for focus picking
  G.raySphere = function (o, d, c, r) {
    const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z;
    const b = ox * d.x + oy * d.y + oz * d.z, cc = ox * ox + oy * oy + oz * oz - r * r;
    const disc = b * b - cc; if (disc < 0) return -1;
    const t = -b - Math.sqrt(disc); return t >= 0 ? t : (cc < 0 ? 0 : -1);
  };
  G.rayCylY = function (o, d, cx, cz, r, y0, y1) {
    const ox = o.x - cx, oz = o.z - cz;
    const a = d.x * d.x + d.z * d.z; if (a < 1e-9) return -1;
    const b = ox * d.x + oz * d.z, c = ox * ox + oz * oz - r * r;
    const disc = b * b - a * c; if (disc < 0) return -1;
    let t = (-b - Math.sqrt(disc)) / a; if (t < 0) t = c < 0 ? 0 : -1; if (t < 0) return -1;
    const y = o.y + d.y * t; if (y < y0 || y > y1) return -1;
    return t;
  };
})();
