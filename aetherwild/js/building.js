'use strict';
// ============================================================================
//  AETHERWILD — grid building, tier upgrades, doors and placeable stations
// ============================================================================
(function () {
  const G = window.G;
  const C3 = G.CELL;
  const WALLS = { wall: 1, doorway: 1, window: 1 };
  const SEGS = {
    wall: [[-1.5, 1.5, 0, 3]],
    doorway: [[-1.5, -0.6, 0, 3], [0.6, 1.5, 0, 3], [-0.6, 0.6, 2.2, 3]],
    window: [[-1.5, -0.6, 0, 3], [0.6, 1.5, 0, 3], [-0.6, 0.6, 0, 1.2], [-0.6, 0.6, 2.2, 3]],
    door: [[-0.6, 0.6, 0, 2.2]],
  };
  const FOOT = {
    campfire: [0.6, 0.6, 0.3], workbench: [1.0, 0.5, 1.0], furnace: [0.85, 0.85, 2.2], forge: [0.85, 0.6, 2.0],
    chest: [0.6, 0.36, 0.85], bed: [0.65, 1.15, 0.55], lantern: [0.2, 0.2, 2.0], backpack: [0.3, 0.3, 0.6],
  };
  const LIGHTS = {
    campfire: { color: 0xff8a3a, intensity: 2.2, dist: 18, flicker: true, y: 0.8 },
    furnace: { color: 0xff7a2a, intensity: 1.4, dist: 10, flicker: true, y: 0.8 },
    forge: { color: 0x4ff0e0, intensity: 1.6, dist: 12, y: 1.8 },
    lantern: { color: 0x7ff7ea, intensity: 2.0, dist: 20, y: 1.6 },
    backpack: { color: 0x4ff0e0, intensity: 0.8, dist: 6, y: 1.0 },
  };

  const B = G.Build = {
    pieces: [], placeables: [], cellMap: new Map(), edgeMap: new Map(), mode: null, placeItem: null, rot: 0, cand: null,
    init(scene) { this.scene = scene; },

    // ----------------------------------------------------------- geometry
    center(p) {
      if (p.edge === 'z') return [p.i * C3 + 1.5, p.k * C3, 0];
      if (p.edge === 'x') return [p.i * C3, p.k * C3 + 1.5, Math.PI / 2];
      return [p.i * C3 + 1.5, p.k * C3 + 1.5, (p.dir || 0) * Math.PI / 2];
    },
    boxesFor(p) {
      const [cx, cz] = this.center(p); const out = [];
      if (WALLS[p.kind] || p.kind === 'door') {
        const th = p.kind === 'door' ? 0.08 : 0.15;
        for (const [u0, u1, v0, v1] of SEGS[p.kind]) {
          if (p.edge === 'z') out.push({ x0: cx + u0, x1: cx + u1, z0: cz - th, z1: cz + th, y0: p.y + v0, y1: p.y + v1 });
          else out.push({ x0: cx - th, x1: cx + th, z0: cz + u0, z1: cz + u1, y0: p.y + v0, y1: p.y + v1 });
        }
      } else if (p.kind === 'foundation') out.push({ x0: cx - 1.5, x1: cx + 1.5, z0: cz - 1.5, z1: cz + 1.5, y0: p.y - p.depth - 0.3, y1: p.y });
      else if (p.kind === 'floor') out.push({ x0: cx - 1.5, x1: cx + 1.5, z0: cz - 1.5, z1: cz + 1.5, y0: p.y - 0.25, y1: p.y });
      else if (p.kind === 'stairs') {
        const th = (p.dir || 0) * Math.PI / 2, c = Math.cos(th), s = Math.sin(th);
        for (let i = 0; i < 6; i++) {
          const lz0 = -1.5 + i * 0.5, lz1 = lz0 + 0.5, xs = [], zs = [];
          for (const lx of [-1.25, 1.25]) for (const lz of [lz0, lz1]) { xs.push(cx + lx * c + lz * s); zs.push(cz - lx * s + lz * c); }
          out.push({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0: p.y, y1: p.y + (i + 1) * 0.5 });
        }
      }
      for (const b of out) b.owner = p;
      return out;
    },
    vInterval(p) {
      if (p.kind === 'foundation') return [p.y - 1, p.y];
      if (p.kind === 'floor') return [p.y - 0.25, p.y];
      if (p.kind === 'stairs') return [p.y + 0.05, p.y + 2.95];
      return [p.y + 0.05, p.y + 2.95];
    },
    cellKey(i, k) { return i + ',' + k; },
    edgeKey(e, i, k) { return e + ':' + i + ',' + k; },
    cellFree(i, k, y0, y1) {
      const l = this.cellMap.get(this.cellKey(i, k)); if (!l) return true;
      for (const p of l) { const [a, b] = this.vInterval(p); if (a < y1 - 0.05 && b > y0 + 0.05) return false; }
      return true;
    },
    cellPieceAt(i, k, kind, y) { const l = this.cellMap.get(this.cellKey(i, k)); if (!l) return null; return l.find(p => (!kind || p.kind === kind) && (y === undefined || Math.abs(p.y - y) < 0.1)) || null; },
    edgePiece(e, i, k, y) { const l = this.edgeMap.get(this.edgeKey(e, i, k)); if (!l) return null; return l.find(p => Math.abs(p.y - y) < 0.1 && p.kind !== 'door') || null; },

    // ----------------------------------------------------------- pieces
    addPiece(d, silent) {
      const p = Object.assign({ hp: G.TIERS[d.tier].hp }, d);
      p.maxHp = G.TIERS[p.tier].hp; p.isPiece = true;
      this.buildVisual(p);
      if (p.kind === 'door') {
        const dw = this.edgePiece(p.edge, p.i, p.k, p.y);
        if (dw) { dw.door = p; p.frame = dw; }
        p.openT = p.open ? 1 : 0;
      } else if (p.edge) {
        const k = this.edgeKey(p.edge, p.i, p.k); if (!this.edgeMap.has(k)) this.edgeMap.set(k, []); this.edgeMap.get(k).push(p);
      } else {
        const k = this.cellKey(p.i, p.k); if (!this.cellMap.has(k)) this.cellMap.set(k, []); this.cellMap.get(k).push(p);
      }
      p.boxes = (p.kind === 'door' && p.open) ? [] : this.boxesFor(p);
      for (const b of p.boxes) G.Phys.addBox(b);
      this.pieces.push(p);
      if (!silent) {
        G.stats.built[p.kind] = (G.stats.built[p.kind] || 0) + 1;
        if (p.tier === 4 && (WALLS[p.kind])) G.stats.voidBuilt = true;
      }
      return p;
    },
    buildVisual(p) {
      if (p.group) this.scene.remove(p.group);
      const g = G.Models.piece(p.kind, p.tier);
      const [cx, cz, ry] = this.center(p);
      g.position.set(cx, p.y, cz); g.rotation.y = ry;
      if (p.kind === 'foundation') { const sk = g.getObjectByName('skirt'); if (sk) sk.scale.y = p.depth; }
      if (p.kind === 'door') { p.hinge = g.getObjectByName('hinge'); if (p.hinge) p.hinge.rotation.y = -(p.openT || 0) * 1.65; }
      g.traverse(o => { if (o.isMesh) o.userData.piece = p; });
      this.scene.add(g); p.group = g;
    },
    removePiece(p) {
      this.scene.remove(p.group);
      for (const b of p.boxes) G.Phys.removeBox(b);
      const i = this.pieces.indexOf(p); if (i >= 0) this.pieces.splice(i, 1);
      if (p.kind === 'door') { if (p.frame) p.frame.door = null; }
      else {
        const m = p.edge ? this.edgeMap : this.cellMap;
        const k = p.edge ? this.edgeKey(p.edge, p.i, p.k) : this.cellKey(p.i, p.k);
        const l = m.get(k); if (l) { const j = l.indexOf(p); if (j >= 0) l.splice(j, 1); }
        if (p.door) this.removePiece(p.door);
      }
    },
    damagePiece(p, dmg) {
      p.hp -= dmg;
      const [cx, cz] = this.center(p);
      G.Particles.burst(new THREE.Vector3(cx, p.y + 1.5, cz), G.TIERSTYLE[p.tier].main, 6, 4, 0.18);
      if (p.hp <= 0) {
        G.Particles.burst(new THREE.Vector3(cx, p.y + 1.5, cz), G.TIERSTYLE[p.tier].main, 24, 7, 0.25);
        G.UI.toast('Your ' + G.TIERS[p.tier].name + ' ' + G.PIECES[p.kind].name + ' was destroyed!', null, 'warn');
        G.Audio.play('break');
        this.removePiece(p);
      }
    },
    upgrade(p) {
      if (p.tier >= 4) { G.UI.toast('Already at the highest tier', null, 'warn'); return; }
      const cost = G.pieceCost(p.kind, p.tier + 1);
      if (!G.inv.pay(cost)) { G.UI.toast('Need ' + G.UI.costText(cost) + ' to upgrade', null, 'warn'); return; }
      p.tier++; p.maxHp = G.TIERS[p.tier].hp; p.hp = p.maxHp;
      this.buildVisual(p);
      for (const b of p.boxes) b.owner = p;
      const [cx, cz] = this.center(p);
      G.Particles.burst(new THREE.Vector3(cx, p.y + 1.2, cz), G.TIERSTYLE[p.tier].glow || G.TIERSTYLE[p.tier].main, 20, 5, 0.12);
      G.Audio.play('build');
      G.stats.upgraded++;
      if (p.tier === 4 && WALLS[p.kind]) G.stats.voidBuilt = true;
      G.UI.toast('Upgraded to ' + G.TIERS[p.tier].name + ' ' + G.PIECES[p.kind].name);
    },
    demolish(p) {
      const cost = G.pieceCost(p.kind, p.tier);
      for (const k in cost) G.give(k, Math.floor(cost[k] * 0.5 * (p.hp / p.maxHp)), { quiet: true });
      if (p.door) { const dc = G.pieceCost('door', p.door.tier); for (const k in dc) G.give(k, Math.floor(dc[k] * 0.5), { quiet: true }); }
      this.removePiece(p);
      G.UI.toast('Demolished (50% refund)');
      G.Audio.play('break');
    },
    toggleDoor(d) {
      d.open = !d.open;
      for (const b of d.boxes) G.Phys.removeBox(b);
      d.boxes = d.open ? [] : this.boxesFor(d);
      for (const b of d.boxes) G.Phys.addBox(b);
      G.Audio.play('door');
    },

    // doorway whose opening the ray passes through (openings have no collider)
    doorwayOnRay(o, d, maxT) {
      let best = null, bt = maxT;
      for (const p of this.pieces) {
        if (p.kind !== 'doorway' || G.dist2(p.i * C3, p.k * C3, o.x, o.z) > 100) continue;
        const b = this.boxesFor({ kind: 'door', edge: p.edge, i: p.i, k: p.k, y: p.y })[0];
        b.x0 -= 0.1; b.x1 += 0.1; b.z0 -= 0.1; b.z1 += 0.1;
        const t = G.Phys.rayAABB(o, d, b, bt); if (t >= 0 && t < bt) { bt = t; best = p; }
      }
      return best ? { t: bt, doorway: best } : null;
    },

    // ----------------------------------------------------------- placeables
    addPlaceable(d) {
      const q = Object.assign({}, d); q.isPlace = true;
      q.group = G.Models.place(q.type);
      q.group.position.set(q.x, q.y, q.z); q.group.rotation.y = q.rot || 0;
      q.group.traverse(o => { if (o.isMesh) o.userData.place = q; });
      this.scene.add(q.group);
      const f = FOOT[q.type], c = Math.abs(Math.cos(q.rot || 0)), s = Math.abs(Math.sin(q.rot || 0));
      const hx = f[0] * c + f[1] * s, hz = f[0] * s + f[1] * c;
      q.boxes = [G.Phys.addBox({ x0: q.x - hx, x1: q.x + hx, z0: q.z - hz, z1: q.z + hz, y0: q.y, y1: q.y + f[2], owner: q })];
      const L = LIGHTS[q.type];
      if (L) q.light = G.Lights.add({ pos: new THREE.Vector3(q.x, q.y + L.y, q.z), color: L.color, intensity: L.intensity, dist: L.dist, flicker: L.flicker });
      if (q.type === 'chest' || q.type === 'backpack') {
        q.store = new G.Inventory(q.type === 'chest' ? 24 : 40);
        if (d.items) q.store.load(d.items);
      }
      q.flame = q.group.getObjectByName('flame'); q.spin = q.group.getObjectByName('spin');
      this.placeables.push(q);
      return q;
    },
    removePlaceable(q) {
      this.scene.remove(q.group);
      for (const b of q.boxes) G.Phys.removeBox(b);
      if (q.light) G.Lights.remove(q.light);
      const i = this.placeables.indexOf(q); if (i >= 0) this.placeables.splice(i, 1);
    },
    pickUp(q) {
      if (q.type === 'backpack') return;
      if (q.store && !q.store.isEmpty()) { G.UI.toast('Empty the chest first', null, 'warn'); return; }
      if (!G.inv.canAdd(q.type, 1)) { G.UI.toast('Inventory full!', null, 'warn'); return; }
      this.removePlaceable(q); G.give(q.type, 1);
      if (G.Player.bed === q) G.Player.bed = null;
    },
    nearStation(type, pos, r) {
      r = r || 5;
      for (const q of this.placeables) if (q.type === type && G.dist2(q.x, q.z, pos.x, pos.z) < r * r && Math.abs(q.y - pos.y) < 4) return q;
      return null;
    },

    // ----------------------------------------------------------- placement
    aim(maxD) {
      const cam = G.camera, o = G.camPos, d = G.camDir;
      const hb = G.Phys.raycast(o, d, maxD);
      const ht = G.Phys.terrainRay(o, d, hb ? hb.t : maxD);
      return (ht && (!hb || ht.t < hb.t)) ? ht : hb;
    },
    startBuild(kind, tier) { this.mode = { kind, tier }; this.placeItem = null; this.rot = 0; this.dropGhost(); },
    stopBuild() { this.mode = null; this.dropGhost(); },
    dropGhost() { if (this.ghost) this.scene.remove(this.ghost); this.ghost = null; this.ghostKey = ''; this.cand = null; },
    computeCandidate() {
      const hit = this.aim(9);
      if (!hit) return null;
      const P = hit.point, own = hit.owner;
      if (this.placeItem) return this.placeCandidate(hit);
      const { kind, tier } = this.mode;
      const c = { kind, tier, valid: false };
      const fwd = G.camDir;
      if (kind === 'foundation') {
        let i, k, y = null;
        if (own && own.kind === 'foundation') {
          const [cx, cz] = this.center(own); const dx = P.x - cx, dz = P.z - cz;
          if (Math.abs(dx) > Math.abs(dz)) { i = own.i + Math.sign(dx); k = own.k; } else { i = own.i; k = own.k + Math.sign(dz); }
          y = own.y;
        } else if (!own) {
          i = Math.floor(P.x / C3); k = Math.floor(P.z / C3);
          for (const [di, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const f = this.cellPieceAt(i + di, k + dk, 'foundation'); if (f) { y = f.y; break; } }
        } else return null;
        let mn = Infinity, mx = -Infinity;
        for (const [a, b] of [[0, 0], [3, 0], [0, 3], [3, 3], [1.5, 1.5]]) { const h = G.World.height(i * C3 + a, k * C3 + b); mn = Math.min(mn, h); mx = Math.max(mx, h); }
        if (y === null) y = mx + 0.35;
        Object.assign(c, { i, k, y, depth: Math.max(0.2, y - 0.3 - mn + 0.4) });
        c.valid = mx < y - 0.05 && y - mn < 6 && mn > -2.5 && this.cellFree(i, k, y - 1, y + 0.1);
        if (!c.valid) c.reason = mx >= y - 0.05 ? 'Terrain too uneven' : 'Blocked';
      } else if (WALLS[kind]) {
        if (own && own.isPiece && (own.kind === 'foundation' || own.kind === 'floor') && hit.normal.y > 0.5) {
          const fx = (P.x - own.i * C3) / C3, fz = (P.z - own.k * C3) / C3;
          const ds = [fz, 1 - fz, fx, 1 - fx]; const m = ds.indexOf(Math.min(...ds));
          if (m === 0) Object.assign(c, { edge: 'z', i: own.i, k: own.k }); else if (m === 1) Object.assign(c, { edge: 'z', i: own.i, k: own.k + 1 });
          else if (m === 2) Object.assign(c, { edge: 'x', i: own.i, k: own.k }); else Object.assign(c, { edge: 'x', i: own.i + 1, k: own.k });
          c.y = own.y;
        } else if (own && own.isPiece && WALLS[own.kind]) {
          Object.assign(c, { edge: own.edge, i: own.i, k: own.k, y: own.y + 3 });
        } else { c.hint = 'Aim at a foundation or floor'; return c; }
        c.valid = !this.edgePiece(c.edge, c.i, c.k, c.y);
      } else if (kind === 'floor') {
        if (own && own.isPiece && WALLS[own.kind]) {
          const y = own.y + 3; let i = own.i, k = own.k;
          if (own.edge === 'z') { if (G.camPos.z < own.k * C3) k = own.k - 1; } else { if (G.camPos.x < own.i * C3) i = own.i - 1; }
          Object.assign(c, { i, k, y });
        } else if (own && own.isPiece && (own.kind === 'floor' || own.kind === 'foundation')) {
          const [cx, cz] = this.center(own); const dx = P.x - cx, dz = P.z - cz;
          if (Math.abs(dx) > Math.abs(dz)) Object.assign(c, { i: own.i + Math.sign(dx), k: own.k }); else Object.assign(c, { i: own.i, k: own.k + Math.sign(dz) });
          c.y = own.y;
        } else { c.hint = 'Aim at a wall top or next to a floor'; return c; }
        c.valid = this.cellFree(c.i, c.k, c.y - 0.25, c.y);
      } else if (kind === 'stairs') {
        if (own && own.isPiece && (own.kind === 'floor' || own.kind === 'foundation') && hit.normal.y > 0.5) {
          let d = Math.round(Math.atan2(fwd.x, fwd.z) / (Math.PI / 2)); d = (((d + this.rot) % 4) + 4) % 4;
          Object.assign(c, { i: own.i, k: own.k, y: own.y, dir: d });
          c.valid = this.cellFree(c.i, c.k, c.y + 0.05, c.y + 2.95);
        } else { c.hint = 'Aim at a foundation or floor'; return c; }
      } else if (kind === 'door') {
        let dw = own && own.isPiece ? own : null;
        if (dw && dw.kind === 'door') dw = dw.frame;
        if (!dw || dw.kind !== 'doorway') { const r = this.doorwayOnRay(G.camPos, G.camDir, hit.t + 0.5); if (r) dw = r.doorway; }
        if (dw && dw.kind === 'doorway') { Object.assign(c, { edge: dw.edge, i: dw.i, k: dw.k, y: dw.y }); c.valid = !dw.door; }
        else { c.hint = 'Aim at a doorway'; return c; }
      }
      if (c.valid && !G.inv.has(G.pieceCost(kind, tier))) { c.valid = false; c.reason = 'Need ' + G.UI.costText(G.pieceCost(kind, tier)); }
      return c;
    },
    placeCandidate(hit) {
      const t = this.placeItem; const P = hit.point;
      const c = { place: t, valid: false, x: P.x, y: P.y, z: P.z };
      const okSurface = hit.terrain || (hit.owner && hit.owner.isPiece && (hit.owner.kind === 'floor' || hit.owner.kind === 'foundation') && hit.normal.y > 0.7);
      if (!okSurface) { c.hint = 'Place on the ground or a floor'; return c; }
      const dx = G.camPos.x - P.x, dz = G.camPos.z - P.z;
      c.rot = Math.round((Math.atan2(dx, dz) + this.rot * Math.PI / 2) / (Math.PI / 12)) * (Math.PI / 12);
      const f = FOOT[t];
      if (hit.terrain) {
        let mn = Infinity, mx = -Infinity;
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const h = G.World.height(P.x + a * f[0], P.z + b * f[1]); mn = Math.min(mn, h); mx = Math.max(mx, h); }
        if (mx - mn > 0.8) { c.reason = 'Too steep'; return c; }
        if (P.y < 0.1) { c.reason = 'Cannot place in water'; return c; }
        c.y = mn + 0.02;
      }
      const q = G.Phys.query(P.x - f[0], P.z - f[1], P.x + f[0], P.z + f[1]);
      for (const b of q) {
        if (b.y1 <= c.y + 0.05 || b.y0 >= c.y + f[2]) continue;
        if (b.x1 < P.x - f[0] || b.x0 > P.x + f[0] || b.z1 < P.z - f[1] || b.z0 > P.z + f[1]) continue;
        c.reason = 'Blocked'; return c;
      }
      c.valid = true; return c;
    },
    update(dt) {
      // animate doors & station effects
      for (const p of this.pieces) if (p.kind === 'door' && p.hinge) {
        const tgt = p.open ? 1 : 0; if (Math.abs(p.openT - tgt) > 0.001) { p.openT = G.damp(p.openT, tgt, 10, dt); p.hinge.rotation.y = -p.openT * 1.65; }
      }
      for (const q of this.placeables) {
        if (q.flame) { const s = 0.9 + Math.sin(G.time * 17 + q.x) * 0.08 + Math.sin(G.time * 9.3) * 0.06; q.flame.scale.set(s, 0.85 + (s - 0.9) * 2.4, s); }
        if (q.spin) { q.spin.rotation.y += dt * 1.2; q.spin.position.y = 1.75 + Math.sin(G.time * 2) * 0.08; }
      }
      // placement preview
      if (!this.mode && !this.placeItem) { if (this.ghost) this.dropGhost(); return; }
      const c = this.cand = this.computeCandidate();
      if (!c || c.i === undefined && !c.place) { if (this.ghost) this.ghost.visible = false; return; }
      const key = c.place ? 'p' + c.place : c.kind + c.tier + (c.kind === 'foundation' ? '' : '');
      if (key !== this.ghostKey) {
        if (this.ghost) this.scene.remove(this.ghost);
        this.ghost = c.place ? G.Models.place(c.place) : G.Models.piece(c.kind, c.tier);
        G.setGroupMaterial(this.ghost, G.M.ghostOk);
        this.ghost.traverse(o => { o.renderOrder = 5; });
        this.scene.add(this.ghost); this.ghostKey = key;
      }
      const g = this.ghost; g.visible = true;
      G.setGroupMaterial(g, c.valid ? G.M.ghostOk : G.M.ghostBad);
      if (c.place) { g.position.set(c.x, c.y, c.z); g.rotation.y = c.rot || 0; }
      else {
        const [cx, cz, ry] = this.center(c); g.position.set(cx, c.y, cz); g.rotation.y = ry;
        if (c.kind === 'foundation') { const sk = g.getObjectByName('skirt'); if (sk) sk.scale.y = c.depth; }
        if (c.kind === 'door') { const h = g.getObjectByName('hinge'); if (h) h.rotation.y = 0; }
      }
    },
    tryPlace() {
      const c = this.cand;
      if (!c || !c.valid) { if (c && (c.reason || c.hint)) G.UI.toast(c.reason || c.hint, null, 'warn'); return false; }
      if (c.place) {
        if (G.inv.count(c.place) < 1) { this.placeItem = null; return false; }
        G.inv.remove(c.place, 1);
        const q = this.addPlaceable({ type: c.place, x: c.x, y: c.y, z: c.z, rot: c.rot });
        G.stats.placed[c.place] = true;
        if (c.place === 'bed') { G.Player.bed = q; G.UI.toast('Respawn point set'); }
        G.Audio.play('build');
        G.Particles.burst(new THREE.Vector3(c.x, c.y + 0.3, c.z), 0xd9c49a, 10, 3, 0.1);
        if (G.inv.count(c.place) < 1) { this.placeItem = null; this.dropGhost(); }
        return true;
      }
      if (!G.inv.pay(G.pieceCost(c.kind, c.tier))) return false;
      const d = { kind: c.kind, tier: c.tier, i: c.i, k: c.k, y: c.y };
      if (c.edge) d.edge = c.edge; if (c.dir !== undefined) d.dir = c.dir; if (c.depth !== undefined) d.depth = c.depth;
      this.addPiece(d);
      G.Audio.play('build');
      const [cx, cz] = this.center(d);
      G.Particles.burst(new THREE.Vector3(cx, c.y + 0.5, cz), G.TIERSTYLE[c.tier].main, 12, 4, 0.12);
      // keep the player out of freshly placed walls
      G.Phys.collide(G.Player.pos, 0.35, 1.7, 0.55, false);
      return true;
    },
    serialize() {
      return {
        pieces: this.pieces.map(p => { const o = { kind: p.kind, tier: p.tier, i: p.i, k: p.k, y: p.y, hp: p.hp }; if (p.edge) o.edge = p.edge; if (p.dir !== undefined) o.dir = p.dir; if (p.depth !== undefined) o.depth = p.depth; if (p.kind === 'door') o.open = !!p.open; return o; }),
        places: this.placeables.map(q => { const o = { type: q.type, x: q.x, y: q.y, z: q.z, rot: q.rot }; if (q.store) o.items = q.store.toJSON(); if (G.Player.bed === q) o.bed = true; return o; }),
      };
    },
    load(data) {
      const ps = data.pieces.slice().sort((a, b) => (a.kind === 'door') - (b.kind === 'door'));
      for (const p of ps) this.addPiece(p, true);
      for (const d of data.places) { const q = this.addPlaceable(d); if (d.bed) G.Player.bed = q; }
    },
  };
})();
