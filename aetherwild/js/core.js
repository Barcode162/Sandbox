'use strict';
// ============================================================================
//  AETHERWILD — core utilities, noise, unified material system, geometry baker
//  Art direction: stylised low-poly, flat-shaded facets, vertex-coloured.
//  EVERY 3D asset in the game is produced through G.Builder so that polygon
//  density, shading model and palette stay consistent across the whole game.
// ============================================================================
THREE.ColorManagement.legacyMode = false;
window.G = window.G || {};
(function () {
  const G = window.G;
  G.SIZE = 600;            // island size (m)
  G.HALF = 300;
  G.WATER = 0;             // water level
  G.CELL = 3;              // building grid
  G.time = 0;

  G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.smooth = (a, b, x) => { const t = G.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  G.damp = (a, b, l, dt) => G.lerp(a, b, 1 - Math.exp(-l * dt));
  G.angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  G.dist2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };

  G.mulberry32 = function (a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ---------------------------------------------------------------- simplex 2D
  G.makeNoise = function (seed) {
    const rnd = G.mulberry32(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    const perm = new Uint8Array(512), pm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm[i] = perm[i] % 12; }
    const gr = [1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 1, 0, -1, 0, 0, 1, 0, -1, 0, 1, 0, -1];
    const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    return function (xin, yin) {
      let n0 = 0, n1 = 0, n2 = 0;
      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s), j = Math.floor(yin + s);
      const t = (i + j) * G2;
      const x0 = xin - (i - t), y0 = yin - (j - t);
      let i1, j1; if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
      const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      const ii = i & 255, jj = j & 255;
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 > 0) { t0 *= t0; const g = pm[ii + perm[jj]] * 2; n0 = t0 * t0 * (gr[g] * x0 + gr[g + 1] * y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 > 0) { t1 *= t1; const g = pm[ii + i1 + perm[jj + j1]] * 2; n1 = t1 * t1 * (gr[g] * x1 + gr[g + 1] * y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 > 0) { t2 *= t2; const g = pm[ii + 1 + perm[jj + 1]] * 2; n2 = t2 * t2 * (gr[g] * x2 + gr[g + 1] * y2); }
      return 70 * (n0 + n1 + n2);
    };
  };

  // ------------------------------------------------------------ shared materials
  // Four material "families" only. Everything uses them, so the look is unified.
  G.M = {
    std: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0.0 }),
    metal: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.42, metalness: 0.65 }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    glass: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.78 }),
    ghostOk: new THREE.MeshBasicMaterial({ color: 0x6cf5c8, transparent: true, opacity: 0.38, depthWrite: false }),
    ghostBad: new THREE.MeshBasicMaterial({ color: 0xff5a4f, transparent: true, opacity: 0.38, depthWrite: false }),
  };
  // the two "impossible" materials: shaded facets + inner light
  G.M.aeth = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.25, metalness: 0.1, emissive: 0x23c4b6, emissiveIntensity: 0.75 });
  G.M.voidc = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.18, metalness: 0.4, emissive: 0x7a2bd6, emissiveIntensity: 0.7 });
  // clouds are soft and self-lit so their undersides never go muddy
  G.M.cloud = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0, emissive: 0x9aa6b8, emissiveIntensity: 0.55, fog: false });
  G.M.grass = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, side: THREE.DoubleSide });

  // ------------------------------------------------------------- primitive cache
  const gc = {};
  G.geo = {
    box: new THREE.BoxGeometry(1, 1, 1),
    ico0: new THREE.IcosahedronGeometry(0.5, 0),
    ico1: new THREE.IcosahedronGeometry(0.5, 1),
    dode: new THREE.DodecahedronGeometry(0.5, 0),
    octa: new THREE.OctahedronGeometry(0.5, 0),
    tetra: new THREE.TetrahedronGeometry(0.5, 0),
    cyl(rt, rb, seg) { const k = 'c' + rt + '_' + rb + '_' + seg; return gc[k] || (gc[k] = new THREE.CylinderGeometry(rt, rb, 1, seg || 6)); },
    cone(seg) { const k = 'k' + seg; return gc[k] || (gc[k] = new THREE.ConeGeometry(0.5, 1, seg || 6)); },
    torus(r, t, rs, ts) { const k = 't' + r + t + rs + ts; return gc[k] || (gc[k] = new THREE.TorusGeometry(r, t, rs || 4, ts || 10)); },
  };

  // ------------------------------------------------------------------- builder
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(),
    _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();
  class Builder {
    constructor(seed) {
      this.parts = { std: [], metal: [], glow: [], glass: [], aeth: [], voidc: [] };
      this.rnd = G.mulberry32(seed || 7);
    }
    // o: p=[x,y,z] r=[rx,ry,rz] s=num|[sx,sy,sz] mat='std'|'metal'|'glow'|'glass' j=lightness jitter m=parent Matrix4
    add(geo, color, o) {
      o = o || {};
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      const p = o.p || [0, 0, 0], r = o.r || [0, 0, 0];
      _p.set(p[0], p[1], p[2]); _e.set(r[0], r[1], r[2]); _q.setFromEuler(_e);
      const sc = o.s;
      if (sc === undefined) _s.set(1, 1, 1); else if (typeof sc === 'number') _s.set(sc, sc, sc); else _s.set(sc[0], sc[1], sc[2]);
      _m.compose(_p, _q, _s);
      if (o.m) _m.premultiply(o.m);
      g.applyMatrix4(_m);
      const n = g.attributes.position.count;
      const cols = new Float32Array(n * 3);
      const base = new THREE.Color(color);
      const j = o.j || 0;
      for (let f = 0; f < n; f += 3) {
        _c.copy(base);
        if (j) _c.offsetHSL(0, 0, (this.rnd() - 0.5) * j);
        for (let v = 0; v < 3 && f + v < n; v++) { const q = (f + v) * 3; cols[q] = _c.r; cols[q + 1] = _c.g; cols[q + 2] = _c.b; }
      }
      for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      this.parts[o.mat || 'std'].push(g);
      return this;
    }
    box(w, h, d, color, o) { o = Object.assign({}, o); const s = o.s; o.s = [w * (s ? s[0] : 1), h * (s ? s[1] : 1), d * (s ? s[2] : 1)]; return this.add(G.geo.box, color, o); }
    geoFor(mat) { const l = this.parts[mat]; return l.length ? G.mergeGeos(l) : null; }
    build(shadow) {
      if (shadow === undefined) shadow = true;
      const grp = new THREE.Group();
      for (const k of ['std', 'metal', 'aeth', 'voidc', 'glass', 'glow']) {
        const geo = this.geoFor(k); if (!geo) continue;
        const mesh = new THREE.Mesh(geo, G.M[k]);
        mesh.castShadow = shadow && k !== 'glow' && k !== 'glass';
        mesh.receiveShadow = k === 'std' || k === 'metal';
        mesh.userData.matKey = k;
        grp.add(mesh);
      }
      return grp;
    }
  }
  G.Builder = Builder;

  G.mergeGeos = function (list) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    for (const g of list) { pos.set(g.attributes.position.array, o * 3); col.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    return geo;
  };

  // replace all materials of a group (for building ghosts)
  G.setGroupMaterial = function (grp, mat) {
    grp.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; o.receiveShadow = false; } });
  };

  // ------------------------------------------------------------------ lights
  // Fixed pool of point lights. Changing the number of lights in a scene forces
  // shader recompiles (stutter), so we keep N always present and assign the
  // closest emitters to them each frame.
  G.Lights = {
    pool: [], sources: new Set(),
    init(scene, n) {
      for (let i = 0; i < n; i++) { const l = new THREE.PointLight(0xffa64d, 0, 14, 2); scene.add(l); this.pool.push(l); }
    },
    add(src) { this.sources.add(src); return src; }, // src: {pos:Vector3, color, intensity, dist, flicker}
    remove(src) { this.sources.delete(src); },
    update(cam) {
      const arr = [];
      for (const s of this.sources) { s._d = s.pos.distanceToSquared(cam.position); if (s._d < 90 * 90) arr.push(s); }
      arr.sort((a, b) => a._d - b._d);
      for (let i = 0; i < this.pool.length; i++) {
        const l = this.pool[i], s = arr[i];
        if (!s) { l.intensity = 0; continue; }
        l.position.copy(s.pos);
        l.color.setHex(s.color);
        l.distance = s.dist || 14;
        const fl = s.flicker ? (0.85 + 0.15 * Math.sin(G.time * 13 + i * 3) * Math.sin(G.time * 7.3 + i)) : 1;
        l.intensity = (s.intensity || 1.5) * fl * (s.scale === undefined ? 1 : s.scale);
      }
    },
  };

  // ------------------------------------------------------------------ particles
  G.Particles = {
    max: 400, i: 0, list: [],
    init(scene) {
      const b = new G.Builder(3); b.box(1, 1, 1, 0xffffff);
      this.mesh = new THREE.InstancedMesh(b.geoFor('std'), G.M.std, this.max);
      this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.mesh.frustumCulled = false;
      const z = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let k = 0; k < this.max; k++) { this.mesh.setMatrixAt(k, z); this.mesh.setColorAt(k, new THREE.Color(1, 1, 1)); this.list.push({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), s: 0.1, r: 0 }); }
      scene.add(this.mesh);
    },
    burst(pos, color, n, speed, size) {
      const c = new THREE.Color(color);
      for (let k = 0; k < n; k++) {
        const id = this.i = (this.i + 1) % this.max; const q = this.list[id];
        q.life = 0.6 + Math.random() * 0.5; q.p.copy(pos);
        q.v.set((Math.random() - 0.5) * speed, Math.random() * speed * 0.9 + 1, (Math.random() - 0.5) * speed);
        q.s = (size || 0.12) * (0.6 + Math.random() * 0.8); q.r = Math.random() * 6;
        this.mesh.setColorAt(id, c.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.12));
      }
      this.mesh.instanceColor.needsUpdate = true;
    },
    update(dt) {
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
      let any = false;
      for (let k = 0; k < this.max; k++) {
        const p = this.list[k];
        if (p.life <= 0) { if (p.s) { p.s = 0; this.mesh.setMatrixAt(k, m.makeScale(0, 0, 0)); any = true; } continue; }
        p.life -= dt; p.v.y -= 14 * dt; p.p.addScaledVector(p.v, dt); p.r += dt * 8;
        const gh = G.World ? G.World.height(p.p.x, p.p.z) : -99;
        if (p.p.y < gh + p.s * 0.5) { p.p.y = gh + p.s * 0.5; p.v.multiplyScalar(0.4); p.v.y = Math.abs(p.v.y) * 0.3; }
        const sc = p.s * Math.min(1, p.life * 3);
        e.set(p.r, p.r * 0.7, 0); q.setFromEuler(e); s.set(sc, sc, sc);
        this.mesh.setMatrixAt(k, m.compose(p.p, q, s)); any = true;
      }
      if (any) this.mesh.instanceMatrix.needsUpdate = true;
    },
  };
})();
