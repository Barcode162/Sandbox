'use strict';
// ============================================================================
//  AETHERWILD — island terrain, water, sky, day/night, resource nodes, foliage
// ============================================================================
(function () {
  const G = window.G;
  const N = 200, S = G.SIZE, CS = S / N; // 3m terrain triangles

  const W = G.World = {
    N, CS, H: null, dayLen: 960, tod: 0.32, nodes: [], variants: {}, nodeGrid: new Map(),
    init(scene, seed) {
      this.scene = scene; this.seed = seed; this.nodes = []; this.variants = {}; this.nodeGrid = new Map(); this.day = 1; this.tod = 0.32;
      this.n1 = G.makeNoise(seed); this.n2 = G.makeNoise(seed + 1); this.n3 = G.makeNoise(seed + 2); this.n4 = G.makeNoise(seed + 3);
      this.buildHeights(); this.spawn = this.findSpawn(); this.buildTerrain(); this.buildWater(); this.buildSky(); this.buildLights();
      this.scatter(); this.buildGrass(); this.buildClouds(); this.buildMap();
    },
    fbm(x, z) { let a = 0, f = 1, amp = 1, t = 0; for (let i = 0; i < 5; i++) { a += this.n1(x * f, z * f) * amp; t += amp; f *= 2.03; amp *= 0.5; } return a / t; },
    glade(x, z) { return G.smooth(0.32, 0.5, this.n4(x * 0.0042 + 31, z * 0.0042 - 17)); },
    rawHeight(x, z) {
      const d = Math.hypot(x, z) / (S * 0.47);
      let h = 3.5 + this.fbm(x * 0.0042, z * 0.0042) * 13;
      const mask = G.smooth(0.12, 0.55, this.n3(x * 0.0026 + 40, z * 0.0026 - 20));
      const r = 1 - Math.abs(this.n2(x * 0.0075, z * 0.0075));
      h += mask * (r * r * 34 + 6);
      h += this.n2(x * 0.03, z * 0.03) * 0.6;
      h += (1 - G.smooth(0, 0.22, d)) * 3;
      h = G.lerp(h, -10, G.smooth(0.72, 1.0, d));
      // the glade is a soft basin
      h = G.lerp(h, Math.min(h, 7 + this.n2(x * 0.01, z * 0.01) * 3), this.glade(x, z) * 0.6);
      return h;
    },
    buildHeights() {
      this.H = new Float32Array((N + 1) * (N + 1));
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) this.H[j * (N + 1) + i] = this.rawHeight(i * CS - S / 2, j * CS - S / 2);
    },
    hAt(i, j) { i = G.clamp(i, 0, N); j = G.clamp(j, 0, N); return this.H[j * (N + 1) + i]; },
    height(x, z) {
      const gx = (x + S / 2) / CS, gz = (z + S / 2) / CS;
      if (gx < 0 || gz < 0 || gx >= N || gz >= N) return -10;
      const i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j;
      const h00 = this.hAt(i, j), h10 = this.hAt(i + 1, j), h01 = this.hAt(i, j + 1), h11 = this.hAt(i + 1, j + 1);
      if (fx + fz <= 1) return h00 + (h10 - h00) * fx + (h01 - h00) * fz;
      return h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
    },
    normal(x, z, out) {
      const e = 0.6; out = out || new THREE.Vector3();
      out.set(this.height(x - e, z) - this.height(x + e, z), 2 * e, this.height(x, z - e) - this.height(x, z + e)).normalize();
      return out;
    },
    groundColor(h, ny, x, z, out) {
      const gl = this.glade(x, z);
      const v = this.n2(x * 0.02, z * 0.02);
      if (h < 0.7) out.setHex(h < -0.4 ? 0xa8945f : 0xd8c48c);
      else {
        out.setHex(0x6aa346).lerp(new THREE.Color(0x4f8a39), G.smooth(-0.4, 0.6, v));
        if (gl > 0) out.lerp(new THREE.Color(0x58b39e).lerp(new THREE.Color(0x7c6fc4), G.smooth(0.2, 0.8, v)), gl);
        if (h < 1.5) out.lerp(new THREE.Color(0xc9b880), G.smooth(1.5, 0.7, h));
      }
      if (ny < 0.83) out.lerp(new THREE.Color(0x8b7d65), G.smooth(0.83, 0.74, ny));
      if (ny < 0.72 || h > 34) out.lerp(new THREE.Color(0x7b7b7d), ny < 0.72 ? G.smooth(0.72, 0.6, ny) : G.smooth(34, 38, h));
      if (h > 43 && ny > 0.62) out.lerp(new THREE.Color(0xeef2f6), G.smooth(43, 46, h));
      return out;
    },
    buildTerrain() {
      const pos = new Float32Array(N * N * 6 * 3), col = new Float32Array(N * N * 6 * 3);
      const c = new THREE.Color(), a = new THREE.Vector3(), b = new THREE.Vector3(), cc = new THREE.Vector3(), n = new THREE.Vector3();
      const rnd = G.mulberry32(this.seed + 9);
      let o = 0;
      const tri = (x0, z0, x1, z1, x2, z2, h0, h1, h2) => {
        a.set(x0, h0, z0); b.set(x1, h1, z1); cc.set(x2, h2, z2);
        n.subVectors(cc, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
        if (n.y < 0) n.negate();
        const mx = (x0 + x1 + x2) / 3, mz = (z0 + z1 + z2) / 3, mh = (h0 + h1 + h2) / 3;
        this.groundColor(mh, n.y, mx, mz, c);
        c.offsetHSL(0, 0, (rnd() - 0.5) * 0.035);
        for (const [x, y, z] of [[x0, h0, z0], [x1, h1, z1], [x2, h2, z2]]) {
          pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b; o += 3;
        }
      };
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x0 = i * CS - S / 2, z0 = j * CS - S / 2, x1 = x0 + CS, z1 = z0 + CS;
        const h00 = this.hAt(i, j), h10 = this.hAt(i + 1, j), h01 = this.hAt(i, j + 1), h11 = this.hAt(i + 1, j + 1);
        tri(x0, z0, x0, z1, x1, z0, h00, h01, h10);
        tri(x1, z0, x0, z1, x1, z1, h10, h01, h11);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, G.M.std);
      mesh.receiveShadow = true; mesh.castShadow = false;
      this.scene.add(mesh); this.terrain = mesh;
      // seabed skirt far out
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 1, 1).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9a8a5a, flatShading: true, roughness: 1 }));
      sea.position.y = -10.2; this.scene.add(sea);
    },
    buildWater() {
      const seg = 70, size = 700;
      const g = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2).toNonIndexed();
      g.deleteAttribute('uv');
      this.waterBase = Float32Array.from(g.attributes.position.array);
      this.waterSeg = size / seg;
      const m = new THREE.MeshStandardMaterial({ color: 0x2f8fb8, flatShading: true, roughness: 0.18, metalness: 0.15, transparent: true, opacity: 0.8 });
      this.water = new THREE.Mesh(g, m); this.water.receiveShadow = true;
      this.water.renderOrder = 2;
      this.scene.add(this.water);
    },
    updateWater(cam) {
      const w = this.water, s = this.waterSeg;
      w.position.x = Math.round(cam.position.x / s) * s; w.position.z = Math.round(cam.position.z / s) * s;
      const p = w.geometry.attributes.position.array, b = this.waterBase, t = G.time;
      const ox = w.position.x, oz = w.position.z;
      for (let i = 0; i < p.length; i += 3) {
        const x = b[i] + ox, z = b[i + 2] + oz;
        p[i + 1] = Math.sin(x * 0.21 + t * 1.3) * 0.12 + Math.sin(z * 0.17 - t * 1.1) * 0.12 + Math.sin((x + z) * 0.4 + t * 2) * 0.05;
      }
      w.geometry.attributes.position.needsUpdate = true;
      w.geometry.computeVertexNormals();
    },
    buildSky() {
      this.skyU = {
        top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() },
        sunCol: { value: new THREE.Color() }, night: { value: 0 },
      };
      const m = new THREE.ShaderMaterial({
        uniforms: this.skyU, side: THREE.BackSide, depthWrite: false, fog: false,
        vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: [
          'uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 sunCol; uniform float night; varying vec3 vd;',
          'void main(){ float y = vd.y; vec3 c = mix(hor, top, pow(clamp(y,0.0,1.0),0.55));',
          ' if(y<0.0) c = hor*0.92;',
          ' float sd = max(dot(vd, sunDir),0.0); c += sunCol*pow(sd,48.0)*0.35 + sunCol*pow(sd,6.0)*0.12;',
          ' float md = max(dot(vd, -sunDir),0.0); c += vec3(0.75,0.8,1.0)*smoothstep(0.9993,0.9996,md)*night;',
          ' c += sunCol*smoothstep(0.9985,0.999,sd)*2.0;',
          ' gl_FragColor = vec4(c,1.0);',
          ' #include <tonemapping_fragment>', ' #include <encodings_fragment>', '}'].join('\n'),
      });
      this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), m);
      this.sky.renderOrder = -1;
      this.scene.add(this.sky);
      // stars
      const sp = []; const r = G.mulberry32(5);
      for (let i = 0; i < 1400; i++) { const v = new THREE.Vector3(r() * 2 - 1, r() * 0.95 + 0.05, r() * 2 - 1).normalize().multiplyScalar(850); sp.push(v.x, v.y, v.z); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
      this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
      this.scene.add(this.stars);
      this.scene.fog = new THREE.Fog(0xbfd9ea, 60, 380);
    },
    buildLights() {
      this.hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5a6a3a, 0.6); this.scene.add(this.hemi);
      const s = this.sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
      s.castShadow = true; s.shadow.mapSize.set(2048, 2048);
      const c = s.shadow.camera; c.left = -70; c.right = 70; c.top = 70; c.bottom = -70; c.near = 1; c.far = 400;
      s.shadow.bias = -0.0006; s.shadow.normalBias = 0.04;
      this.scene.add(s); this.scene.add(s.target);
    },
    // day/night keyframes (sun elevation → palette)
    sky_keys: [
      { e: -0.35, top: 0x060b1c, hor: 0x111a30, sun: 0x000000, hemi: 0.16, sunI: 0.0 },
      { e: -0.08, top: 0x18203f, hor: 0x40375a, sun: 0xff6a3a, hemi: 0.22, sunI: 0.0 },
      { e: 0.02, top: 0x3b5c8f, hor: 0xf09a64, sun: 0xff8a4a, hemi: 0.3, sunI: 0.45 },
      { e: 0.16, top: 0x4a82c4, hor: 0xcfd2c8, sun: 0xffd2a0, hemi: 0.42, sunI: 1.15 },
      { e: 0.45, top: 0x3a78c8, hor: 0xb4d0e6, sun: 0xfff3e0, hemi: 0.48, sunI: 1.55 },
    ],
    updateSky(dt, cam) {
      this.tod += dt / this.dayLen; if (this.tod >= 1) { this.tod -= 1; this.day++; }
      const a = (this.tod - 0.25) * Math.PI * 2;
      const sd = new THREE.Vector3(Math.cos(a), Math.sin(a), 0.35).normalize();
      const e = sd.y; const K = this.sky_keys;
      let k0 = K[0], k1 = K[0], t = 0;
      if (e <= K[0].e) { k0 = k1 = K[0]; } else if (e >= K[K.length - 1].e) { k0 = k1 = K[K.length - 1]; }
      else for (let i = 0; i < K.length - 1; i++) if (e >= K[i].e && e < K[i + 1].e) { k0 = K[i]; k1 = K[i + 1]; t = (e - k0.e) / (k1.e - k0.e); break; }
      const top = new THREE.Color(k0.top).lerp(new THREE.Color(k1.top), t);
      const hor = new THREE.Color(k0.hor).lerp(new THREE.Color(k1.hor), t);
      const sunC = new THREE.Color(k0.sun).lerp(new THREE.Color(k1.sun), t);
      const u = this.skyU;
      u.top.value.copy(top); u.hor.value.copy(hor); u.sunDir.value.copy(sd); u.sunCol.value.copy(sunC);
      const night = G.smooth(0.0, -0.2, e); u.night.value = night;
      this.night = night; this.daylight = 1 - night;
      this.scene.fog.color.copy(hor);
      this.stars.material.opacity = night;
      this.hemi.intensity = G.lerp(k0.hemi, k1.hemi, t);
      this.hemi.color.copy(top).lerp(new THREE.Color(0xffffff), 0.55);
      this.hemi.groundColor.setHex(0x4a5a34).lerp(new THREE.Color(0x101420), night);
      // sun by day, moon by night (same light)
      const sunI = G.lerp(k0.sunI, k1.sunI, t);
      const light = this.sun;
      let dir = sd;
      if (e < 0.0) { dir = sd.clone().negate(); light.color.setHex(0x8fa6d8); light.intensity = 0.22 * night; }
      else { light.color.copy(sunC).lerp(new THREE.Color(0xffffff), 0.4); light.intensity = sunI; }
      const p = cam.position; const snap = 140 / 2048;
      const cx = Math.round(p.x / snap) * snap, cz = Math.round(p.z / snap) * snap;
      light.target.position.set(cx, 0, cz);
      light.position.set(cx + dir.x * 180, dir.y * 180, cz + dir.z * 180);
      this.sky.position.copy(p); this.stars.position.copy(p);
      // ambient reflection strength follows daylight
      const env = 0.12 + 0.33 * this.daylight;
      for (const k of ['std', 'metal', 'glass', 'aeth', 'voidc', 'grass']) G.M[k].envMapIntensity = env;
      G.M.aeth.emissiveIntensity = 0.55 + night * 0.5; G.M.cloud.emissiveIntensity = 0.03 + 0.52 * this.daylight; G.M.voidc.emissiveIntensity = 0.5 + night * 0.5;
    },
    clock() { const h = (this.tod * 24) % 24; const hh = Math.floor(h), mm = Math.floor((h - hh) * 60); return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; },

    // ------------------------------------------------------------- nodes
    makeVariant(name, type, builder, count, opt) {
      const b = builder(name.length * 13);
      const meshes = [];
      for (const k of ['std', 'metal', 'aeth', 'voidc', 'glow']) {
        const g = b.geoFor(k); if (!g) continue;
        const im = new THREE.InstancedMesh(g, G.M[k], count);
        im.castShadow = k !== 'glow'; im.receiveShadow = k !== 'glow';
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        im.count = 0;
        this.scene.add(im); meshes.push(im);
      }
      const v = { name, type, meshes, n: 0, max: count, opt: opt || {} };
      this.variants[name] = v; return v;
    },
    addNode(vname, x, z, scale, rot) {
      const v = this.variants[vname]; if (v.n >= v.max) return null;
      const T = G.NODES[v.type];
      const y = this.height(x, z) - 0.05;
      const node = {
        type: v.type, v, idx: v.n++, x, y, z, s: scale, rot, hp: T.hp * (0.7 + scale * 0.3), alive: true, respawn: 0, shake: 0,
        r: v.opt.r * scale, hitR: v.opt.hitR * scale, hitH: v.opt.hitH * scale, collide: v.opt.collide,
      };
      node.maxHp = node.hp;
      for (const m of v.meshes) { m.count = v.n; m.setColorAt(node.idx, new THREE.Color().setScalar(0.88 + Math.random() * 0.12)); }
      this.setNodeMatrix(node, 1);
      this.nodes.push(node);
      const key = this.gkey(x, z); if (!this.nodeGrid.has(key)) this.nodeGrid.set(key, []); this.nodeGrid.get(key).push(node);
      return node;
    },
    gkey(x, z) { return (Math.floor(x / 12) + 100) * 1000 + Math.floor(z / 12) + 100; },
    setNodeMatrix(node, k, sx) {
      const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(sx || 0, node.rot, (sx || 0) * 0.5));
      const s = node.s * k;
      m.compose(new THREE.Vector3(node.x, node.y, node.z), q, new THREE.Vector3(s, s, s));
      for (const im of node.v.meshes) { im.setMatrixAt(node.idx, m); im.instanceMatrix.needsUpdate = true; }
    },
    nodesNear(x, z, r, out) {
      out = out || []; out.length = 0;
      const i0 = Math.floor((x - r) / 12), i1 = Math.floor((x + r) / 12), j0 = Math.floor((z - r) / 12), j1 = Math.floor((z + r) / 12);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const l = this.nodeGrid.get((i + 100) * 1000 + j + 100); if (l) for (const n of l) out.push(n);
      }
      return out;
    },
    damageNode(node, amount) {
      node.hp -= amount; node.shake = 0.25;
      if (node.hp <= 0) {
        node.alive = false; node.dying = 0.5;
        node.respawn = node.type === 'void' ? 600 : node.type === 'aether' ? 400 : node.type === 'tree' ? 300 : 240;
        return true;
      }
      return false;
    },
    updateNodes(dt) {
      for (const n of this.nodes) {
        if (n.shake > 0) { n.shake -= dt; const k = n.alive ? 1 + Math.sin(n.shake * 60) * 0.03 : 1; this.setNodeMatrix(n, k, n.type === 'tree' ? Math.sin(n.shake * 50) * 0.04 : 0); }
        if (!n.alive) {
          if (n.dying > 0) {
            n.dying -= dt;
            const t = Math.max(0, n.dying / 0.5);
            if (n.type === 'tree') this.setNodeMatrix(n, Math.max(0.0001, t), (1 - t) * 1.3);
            else this.setNodeMatrix(n, Math.max(0.0001, t));
            if (n.dying <= 0) this.setNodeMatrix(n, 0.0001);
          }
          n.respawn -= dt;
          if (n.respawn <= 0 && G.dist2(n.x, n.z, G.camera.position.x, G.camera.position.z) > 40 * 40) {
            n.alive = true; n.hp = n.maxHp; this.setNodeMatrix(n, 1);
          }
        }
      }
    },
    scatter() {
      const M = G.Models.nature;
      this.makeVariant('pine', 'tree', M.pine, 900, { r: 0.42, hitR: 0.55, hitH: 3.5, collide: true });
      this.makeVariant('oak', 'tree', M.oak, 700, { r: 0.5, hitR: 0.6, hitH: 3.5, collide: true });
      this.makeVariant('glade', 'tree', M.glade, 300, { r: 0.4, hitR: 0.55, hitH: 3.5, collide: true });
      this.makeVariant('rock', 'rock', M.rock, 700, { r: 1.1, hitR: 1.3, hitH: 1.6, collide: true });
      this.makeVariant('bush', 'bush', M.bush, 700, { r: 0, hitR: 0.9, hitH: 1.0, collide: false });
      this.makeVariant('iron', 'iron', M.iron, 300, { r: 1.0, hitR: 1.3, hitH: 1.7, collide: true });
      this.makeVariant('aether', 'aether', M.aether, 220, { r: 0.8, hitR: 1.1, hitH: 2.4, collide: true });
      this.makeVariant('void', 'void', M.voidn, 60, { r: 0.9, hitR: 1.1, hitH: 3.0, collide: true });
      const r = G.mulberry32(this.seed + 77);
      const nrm = new THREE.Vector3();
      const step = 5;
      const peaks = [];
      for (let gz = -S / 2 + 4; gz < S / 2 - 4; gz += step) for (let gx = -S / 2 + 4; gx < S / 2 - 4; gx += step) {
        const x = gx + r() * step, z = gz + r() * step;
        const h = this.height(x, z); if (h < 0.4) continue;
        this.normal(x, z, nrm); const ny = nrm.y;
        const gl = this.glade(x, z);
        const forest = this.n3(x * 0.012 + 7, z * 0.012 + 3);
        const p = r(), sc = 0.8 + r() * 0.55, rot = r() * Math.PI * 2;
        if (Math.hypot(x - this.spawn.x, z - this.spawn.z) < 7) continue;
        if (h > 38 && ny > 0.5) peaks.push([x, z]);
        if (h > 39 && ny > 0.55 && p < 0.05) { this.addNode('void', x, z, 0.9 + r() * 0.4, rot); continue; }
        if (gl > 0.6 && h > 1 && p < 0.06) { this.addNode('aether', x, z, sc, rot); continue; }
        if ((h > 15 || ny < 0.8) && h > 2 && p < 0.035) { this.addNode('iron', x, z, sc, rot); continue; }
        if (p < (ny < 0.82 ? 0.09 : h > 20 ? 0.06 : 0.018)) { this.addNode('rock', x, z, sc * 0.9, rot); continue; }
        if (h > 1.3 && h < 32 && ny > 0.84) {
          const dens = gl > 0.5 ? 0.14 : forest > 0.15 ? 0.36 : 0.025;
          if (p < 0.018 + dens) {
            const vn = gl > 0.5 ? 'glade' : (h > 14 || this.n2(x * 0.01, z * 0.01) > 0.15) ? 'pine' : (r() < 0.6 ? 'oak' : 'pine');
            this.addNode(vn, x, z, sc, rot); continue;
          }
          if (p < 0.018 + dens + 0.035 && gl < 0.5) { this.addNode('bush', x, z, 0.8 + r() * 0.3, rot); continue; }
        }
      }
      // guarantee some void crystals on the highest ground
      peaks.sort(() => r() - 0.5);
      let need = 14 - this.variants.void.n;
      for (let i = 0; i < peaks.length && need > 0; i += 3, need--) this.addNode('void', peaks[i][0], peaks[i][1], 1.0, r() * 6);
      // guarantee near-spawn starter resources
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + 0.3, d = 11 + i * 2;
        const x = this.spawn.x + Math.cos(a) * d, z = this.spawn.z + Math.sin(a) * d;
        if (this.height(x, z) > 0.6) this.addNode(i % 3 === 0 ? 'rock' : i % 3 === 1 ? 'bush' : 'oak', x, z, 0.9, a);
      }
    },
    gladeNear(x, z, r) { let m = this.glade(x, z); for (let a = 0; a < 6.28; a += 0.8) for (const d of [r * 0.5, r]) m = Math.max(m, this.glade(x + Math.cos(a) * d, z + Math.sin(a) * d)); return m; },
    findSpawn() {
      const nrm = new THREE.Vector3();
      for (let rr = 0; rr < 200; rr += 4) for (let a = 0; a < Math.PI * 2; a += 0.5) {
        const x = Math.cos(a) * rr + 20, z = Math.sin(a) * rr + 20;
        const h = this.height(x, z); this.normal(x, z, nrm);
        if (h > 2.5 && h < 9 && nrm.y > 0.93 && this.gladeNear(x, z, 70) < 0.02) return { x, z };
      }
      return { x: 0, z: 0 };
    },
    buildGrass() {
      const r = G.mulberry32(this.seed + 5);
      const tuft = G.Models.grassTuft();
      const count = G.settings.quality === 'low' ? 11000 : 26000;
      const im = new THREE.InstancedMesh(tuft, G.M.grass, count);
      const fl = [new THREE.InstancedMesh(G.Models.flower(0xf2d34a), G.M.std, 1500), new THREE.InstancedMesh(G.Models.flower(0xe86a9a), G.M.std, 1500), new THREE.InstancedMesh(G.Models.flower(0x9ad6ff), G.M.std, 1500)];
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), nrm = new THREE.Vector3();
      let n = 0; const fn = [0, 0, 0]; let tries = 0; const WHITE = new THREE.Color(1, 1, 1);
      while (n < count && tries < count * 4) {
        tries++;
        const x = (r() - 0.5) * S * 0.9, z = (r() - 0.5) * S * 0.9;
        const h = this.height(x, z); if (h < 1.2 || h > 33) continue;
        this.normal(x, z, nrm); if (nrm.y < 0.86) continue;
        if (this.n3(x * 0.03, z * 0.03) < -0.3) continue;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28);
        const sc = 0.6 + r() * 0.5; s.set(sc, sc * (0.7 + r() * 0.5), sc);
        p.set(x, h - 0.03, z); m.compose(p, q, s);
        const gl = this.glade(x, z);
        this.groundColor(h, nrm.y, x, z, c); c.multiplyScalar(1.12); c.r = Math.min(c.r, 1); c.g = Math.min(c.g, 1); c.b = Math.min(c.b, 1);
        if (r() < 0.06) { const k = Math.floor(r() * 3); if (fn[k] < 1500 && gl < 0.5) { fl[k].setColorAt(fn[k], WHITE); fl[k].setMatrixAt(fn[k]++, m); continue; } }
        im.setMatrixAt(n, m); im.setColorAt(n, c); n++;
      }
      im.count = n; im.receiveShadow = true;
      this.scene.add(im); this.grass = im;
      fl.forEach((f, k) => { f.count = fn[k]; this.scene.add(f); });
    },
    buildClouds() {
      this.clouds = [];
      const r = G.mulberry32(this.seed + 11);
      for (let i = 0; i < 26; i++) {
        const c = G.Models.cloud(i + 1);
        c.position.set((r() - 0.5) * 900, 115 + r() * 40, (r() - 0.5) * 900);
        c.rotation.y = r() * 6;
        this.scene.add(c); this.clouds.push(c);
      }
    },
    updateClouds(dt) {
      for (const c of this.clouds) { c.position.x += dt * 2.2; if (c.position.x > 480) c.position.x -= 960; }
    },
    buildMap() {
      const R = 768; const cv = document.createElement('canvas'); cv.width = cv.height = R;
      const ctx = cv.getContext('2d'); const img = ctx.createImageData(R, R);
      const c = new THREE.Color(), nrm = new THREE.Vector3();
      for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
        const x = (i / R - 0.5) * S, z = (j / R - 0.5) * S; const h = this.height(x, z);
        if (h < 0) c.setHex(h < -3 ? 0x1f5f86 : 0x3a8fb5);
        else { this.normal(x, z, nrm); this.groundColor(h, nrm.y, x, z, c); const sh = 0.75 + 0.35 * (nrm.x * -0.6 + nrm.z * -0.4 + 0.6); c.multiplyScalar(sh); }
        c.convertLinearToSRGB();
        const o = (j * R + i) * 4; img.data[o] = c.r * 255; img.data[o + 1] = c.g * 255; img.data[o + 2] = c.b * 255; img.data[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      this.mapCanvas = cv;
    },
    update(dt, cam) {
      this.updateSky(dt, cam); this.updateWater(cam); this.updateNodes(dt); this.updateClouds(dt);
    },
  };
})();
