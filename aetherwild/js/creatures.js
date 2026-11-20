'use strict';
// ============================================================================
//  AETHERWILD — dinosaurs: behaviour, taming, combat, riding
// ============================================================================
(function () {
  const G = window.G;
  const V = new THREE.Vector3();
  let UID = 1;

  class Creature {
    constructor(sp, x, z, o) {
      o = o || {};
      this.uid = UID++;
      this.sp = sp; this.S = G.SPECIES[sp];
      this.m = G.Models.creature(sp); this.scale = this.m.scale;
      G.scene.add(this.m.root);
      this.pos = new THREE.Vector3(x, G.World.height(x, z), z);
      this.heading = o.heading !== undefined ? o.heading : Math.random() * 6.28;
      this.wantHeading = this.heading;
      this.speed = 0; this.hp = o.hp || this.S.hp; this.torpor = 0; this.ko = 0;
      this.state = 'wander'; this.timer = Math.random() * 3; this.flee = 0; this.anger = 0;
      this.target = null; this.attackCD = 0; this.jawT = 0; this.phase = Math.random() * 6;
      this.tamed = false; this.tameProg = 0; this.order = 'follow'; this.dead = false; this.deadT = 0;
      this.height = this.m.bodyY * this.scale * 1.5; this.step = 0.5 + this.scale * 0.25;
      this.r = this.S.r; this.graze = 0; this.lastHurt = 99; this.hurtFlash = 0;
      this.home = o.pack || null;
      if (o.tamed) this.setTamed(true);
      if (o.order) this.order = o.order;
    }
    get name() { return (this.tamed ? 'Tamed ' : '') + this.S.name; }
    bodyCenter(out) { return (out || new THREE.Vector3()).set(this.pos.x, this.pos.y + this.m.bodyY * this.scale * 1.05, this.pos.z); }
    headPos(out) { return this.m.head.getWorldPosition(out || new THREE.Vector3()); }
    rayHit(o, d) {
      let best = -1;
      const t1 = G.raySphere(o, d, this.bodyCenter(V), this.r * 0.95);
      if (t1 >= 0) best = t1;
      const t2 = G.raySphere(o, d, this.headPos(V), (this.sp === 'dreadmaw' ? 0.6 : 0.28) * this.scale + 0.15);
      if (t2 >= 0 && (best < 0 || t2 < best)) best = t2;
      // mid-body for long animals
      const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
      for (const k of [-0.9, 0.9]) {
        const c = this.bodyCenter(V); c.x += fx * this.r * k; c.z += fz * this.r * k;
        const t = G.raySphere(o, d, c, this.r * 0.7); if (t >= 0 && (best < 0 || t < best)) best = t;
      }
      return best;
    }
    setTamed(silent) {
      this.tamed = true; this.ko = 0; this.torpor = 0; this.target = null; this.anger = 0; this.flee = 0; this.state = 'follow';
      if (!this.marker) {
        const b = new G.Builder(3); b.add(G.geo.octa, 0x6ff5c8, { s: [0.22, 0.36, 0.22], mat: 'glow' });
        this.marker = b.build(false); this.marker.position.y = (this.m.bodyY * 1.9 + 0.8) ; this.marker.scale.setScalar(1 / this.scale);
        this.m.root.add(this.marker);
      }
      if (!silent) {
        G.stats.tamed++; if (this.sp === 'dreadmaw') G.stats.tamedRex = true;
        G.UI.toast(this.S.name + ' tamed! [F] follow/stay' + (this.S.ride ? ', [R] ride (needs Saddle)' : ''), null, 'good');
        G.Audio.play('tame');
        G.Particles.burst(this.bodyCenter(), 0x6ff5c8, 30, 5, 0.12);
      }
    }
    hurt(dmg, src, torp) {
      if (this.dead) return;
      this.hp -= dmg; this.lastHurt = 0; this.hurtFlash = 0.15;
      G.Particles.burst(this.bodyCenter(), 0xb3262f, Math.min(14, 4 + dmg / 8), 4, 0.1);
      if (this.hp <= 0) { this.die(src); return; }
      if (this.mounted) return;
      if (torp && this.S.tame === 'ko' && !this.tamed) {
        this.torpor += torp;
        if (this.torpor >= this.S.torpor && this.ko <= 0) {
          this.ko = 50; this.state = 'ko'; this.target = null; this.speed = 0;
          G.UI.toast(this.S.name + ' knocked out! Feed it meat [E]', null, 'good');
          G.Audio.play('ko');
          return;
        }
      }
      if (this.ko > 0) { this.ko = Math.max(this.ko, 20); return; }
      const t = this.S.temper;
      if (this.tamed) { if (src && src !== 'player' && !src.tamed) this.target = src; return; }
      if (t === 'passive' || t === 'shy') { this.flee = 7; this.fleeFrom = src; }
      else {
        const calm = this.anger <= 0 && !this.target;
        this.anger = 25; this.target = src || 'player';
        if (calm) G.Audio.play('roar', this.pos, this.scale);
      }
    }
    die(src) {
      this.dead = true; this.state = 'dead'; this.speed = 0; this.deadT = 0;
      if (this.mounted) G.Player.dismount();
      const byPlayer = src === 'player' || (src && src.tamed);
      if (this.tamed) G.UI.toast('Your ' + this.S.name + ' has died.', null, 'warn');
      else if (byPlayer) {
        for (const k in this.S.loot) G.give(k, Math.max(1, Math.round(this.S.loot[k] * (0.8 + Math.random() * 0.4))));
        G.stats.kills = (G.stats.kills || 0) + 1;
      }
      if (this.marker) this.marker.visible = false;
    }
    feed(id) {
      if (this.tamed) {
        if (this.hp >= this.S.hp) { G.UI.toast(this.S.name + ' is at full health'); return; }
        G.inv.remove(id, 1); this.hp = Math.min(this.S.hp, this.hp + this.S.hp * 0.25);
        G.Particles.burst(this.headPos(), 0x6ff5c8, 8, 2, 0.08); return;
      }
      G.inv.remove(id, 1);
      this.tameProg += id === 'cooked_meat' ? 2 : 1;
      G.Particles.burst(this.headPos(), 0xff7ab8, 10, 2.5, 0.09);
      G.Audio.play('eat');
      if (this.tameProg >= this.S.need) this.setTamed(false);
      else G.UI.toast('Taming ' + this.S.name + ': ' + this.tameProg + ' / ' + this.S.need);
      if (this.S.tame === 'ko') this.ko = Math.max(this.ko, 25);
    }
    canFeed() {
      // returns item id to feed, or null + reason
      const S = this.S;
      if (this.dead) return [null, ''];
      const food = S.food.find(f => G.inv.count(f) > 0);
      if (this.tamed) return food ? [food, 'Feed ' + G.ITEMS[food].name + ' (heal)'] : [null, ''];
      if (S.tame === 'feed') {
        if (this.anger > 0 || this.flee > 0) return [null, 'Too agitated to eat'];
        if (!food) return [null, 'Needs ' + S.food.map(f => G.ITEMS[f].name).join(' / ')];
        return [food, 'Feed ' + G.ITEMS[food].name + ' (' + this.tameProg + '/' + S.need + ')'];
      }
      if (this.ko <= 0) return [null, S.hint];
      if (!food) return [null, 'Needs Raw or Cooked Meat'];
      return [food, 'Feed ' + G.ITEMS[food].name + ' (' + this.tameProg + '/' + S.need + ')'];
    }
    tpos(t) { if (t === 'player') return G.Player.mount ? G.Player.mount.pos : G.Player.pos; return t.pos; }
    tr(t) { return t === 'player' ? (G.Player.mount ? G.Player.mount.r : 0.4) : t.r; }
    validTarget(t) {
      if (!t) return false;
      if (t === 'player') return !G.Player.dead && !(this.tamed);
      return !t.dead && t.ko <= 0;
    }
    update(dt, far) {
      this.lastHurt += dt; this.attackCD -= dt; if (this.jawT > 0) this.jawT -= dt; if (this.hurtFlash > 0) this.hurtFlash -= dt;
      if (this.dead) { this.deadT += dt; this.speed = 0; this.animate(dt); if (this.deadT > 14) this.pos.y -= dt * 0.4; return this.deadT < 22; }
      if (this.ko > 0) {
        this.ko -= dt; this.speed = G.damp(this.speed, 0, 6, dt);
        if (this.ko <= 0) { this.torpor = 0; this.state = 'wander'; this.target = 'player'; this.anger = 20; G.UI.toast(this.S.name + ' woke up!', null, 'warn'); }
        this.animate(dt); return true;
      }
      if (this.torpor > 0 && this.lastHurt > 5) this.torpor = Math.max(0, this.torpor - dt * this.S.torpor * 0.05);
      if (this.tamed && this.hp < this.S.hp && this.lastHurt > 10) this.hp = Math.min(this.S.hp, this.hp + dt * this.S.hp * 0.004);
      if (this.mounted) { this.animate(dt); return true; }
      let wantSpeed = 0;
      const S = this.S;
      const pp = G.Player.mount ? G.Player.mount.pos : G.Player.pos;
      const dP = Math.sqrt(G.dist2(this.pos.x, this.pos.z, pp.x, pp.z));
      if (this.tamed) wantSpeed = this.tamedAI(dt, dP);
      else wantSpeed = this.wildAI(dt, dP);
      this.move(dt, wantSpeed, far);
      if (!far) this.animate(dt);
      return true;
    }
    faceTo(x, z) { this.wantHeading = Math.atan2(x - this.pos.x, z - this.pos.z); }
    chase(dt, t) {
      const tp = this.tpos(t);
      const d = Math.sqrt(G.dist2(this.pos.x, this.pos.z, tp.x, tp.z)) - this.tr(t) - this.r;
      this.faceTo(tp.x, tp.z);
      if (d < this.S.reach * 0.55) {
        if (this.attackCD <= 0 && Math.abs(G.angDiff(this.heading, this.wantHeading)) < 0.6 && Math.abs(tp.y - this.pos.y) < 3 + this.scale) {
          this.attackCD = this.sp === 'razorclaw' ? 0.95 : this.sp === 'dreadmaw' ? 1.9 : 1.5;
          this.jawT = 0.35;
          if (t === 'player') G.Player.hurt(this.S.dmg, this);
          else t.hurt(this.S.dmg, this);
          G.Audio.play('bite', this.pos, this.scale);
        }
        return 0.0;
      }
      return this.S.run;
    }
    wildAI(dt, dP) {
      const S = this.S, P = G.Player;
      this.timer -= dt;
      if (this.anger > 0) this.anger -= dt;
      if (this.flee > 0) {
        this.flee -= dt;
        const fp = this.fleeFrom && this.fleeFrom !== 'player' && this.fleeFrom.pos ? this.fleeFrom.pos : (P.mount ? P.mount.pos : P.pos);
        this.wantHeading = Math.atan2(this.pos.x - fp.x, this.pos.z - fp.z) + Math.sin(G.time + this.uid) * 0.4;
        return S.run;
      }
      if (S.temper === 'shy' && !P.dead) {
        const det = P.crouch && !P.mount ? 2.6 : (P.sprinting ? 22 : 15);
        if (dP < det) { this.flee = 5 + Math.random() * 3; this.fleeFrom = 'player'; G.Audio.play('chirp', this.pos, 1); return S.run; }
      }
      if (S.temper === 'aggressive') {
        if (!this.validTarget(this.target)) this.target = null;
        if (!this.target && !P.dead) {
          let ag = S.aggro * (P.crouch ? 0.55 : 1) * (G.World.night > 0.5 ? 1.25 : 1);
          if (dP < ag) { this.target = 'player'; G.Audio.play('roar', this.pos, this.scale); }
          else {
            for (const c of G.Creatures.list) if (c.tamed && !c.dead && G.dist2(c.pos.x, c.pos.z, this.pos.x, this.pos.z) < ag * ag * 0.5) { this.target = c; break; }
          }
        }
        if (this.target) {
          const tp = this.tpos(this.target);
          if (G.dist2(tp.x, tp.z, this.pos.x, this.pos.z) > 70 * 70) { this.target = null; }
          else return this.chase(dt, this.target);
        }
      }
      if (S.temper === 'neutral' && this.anger > 0 && this.validTarget(this.target)) return this.chase(dt, this.target);
      // wander/graze
      if (this.timer <= 0) {
        if (Math.random() < 0.45) { this.state = 'graze'; this.timer = 3 + Math.random() * 5; }
        else { this.state = 'wander'; this.timer = 4 + Math.random() * 6; this.wantHeading = this.heading + (Math.random() - 0.5) * 2.5; }
        if (this.home && G.dist2(this.pos.x, this.pos.z, this.home.x, this.home.z) > 50 * 50) this.wantHeading = Math.atan2(this.home.x - this.pos.x, this.home.z - this.pos.z);
      }
      return this.state === 'wander' ? S.speed : 0;
    }
    tamedAI(dt, dP) {
      const S = this.S, P = G.Player;
      if (this.validTarget(this.target) && this.target !== 'player' && !this.target.tamed) {
        const tp = this.target.pos;
        if (G.dist2(tp.x, tp.z, this.pos.x, this.pos.z) < 40 * 40 && (this.order === 'follow' || G.dist2(tp.x, tp.z, this.pos.x, this.pos.z) < 12 * 12)) return this.chase(dt, this.target);
      }
      this.target = null;
      if (this.order === 'stay') { this.state = 'graze'; return 0; }
      // defend the player
      if (S.dmg >= 10) {
        const ct = P.combatTarget;
        if (ct && !ct.dead && !ct.tamed && ct.ko <= 0 && G.dist2(ct.pos.x, ct.pos.z, this.pos.x, this.pos.z) < 30 * 30) { this.target = ct; return 0; }
        for (const c of G.Creatures.list) if (!c.tamed && !c.dead && c.ko <= 0 && (c.target === 'player' || c.target === this) && G.dist2(c.pos.x, c.pos.z, this.pos.x, this.pos.z) < 25 * 25) { this.target = c; return 0; }
      }
      const pp = P.pos;
      if (dP > 90) { this.pos.set(pp.x + 3, G.World.height(pp.x + 3, pp.z + 3), pp.z + 3); return 0; }
      const near = 4 + this.r * 1.5;
      if (dP > near) { this.faceTo(pp.x, pp.z); this.state = 'wander'; return dP > near + 10 ? S.run : S.speed * 1.4; }
      this.state = 'graze'; return 0;
    }
    move(dt, want, far) {
      this.speed = G.damp(this.speed, want, 3.5, dt);
      const dh = G.angDiff(this.heading, this.wantHeading);
      const turn = this.S.turn * (this.mounted ? 1.6 : 1) * dt;
      this.heading += G.clamp(dh, -turn, turn);
      if (this.speed < 0.01) { this.pos.y = G.damp(this.pos.y, G.Phys.groundAt(this.pos.x, this.pos.z, this.pos.y, this.step, this.r), 10, dt); return; }
      const nx = this.pos.x + Math.sin(this.heading) * this.speed * dt, nz = this.pos.z + Math.cos(this.heading) * this.speed * dt;
      const nh = G.World.height(nx, nz);
      if (nh < -0.8 - this.scale * 0.5 && !this.mounted) { this.wantHeading = this.heading + 2.2; this.timer = 2; this.speed *= 0.5; return; }
      V.set(nx, this.pos.y, nz);
      const blocker = far ? null : G.Phys.collide(V, this.r * 0.75, this.height, this.step, true);
      this.pos.x = V.x; this.pos.z = V.z;
      if (blocker && blocker.isPiece && !this.tamed && this.target === 'player') {
        if (this.S.breaker) { if (this.attackCD <= 0) { this.attackCD = 1.8; this.jawT = 0.35; G.Build.damagePiece(blocker, this.S.dmg * 1.6); G.Audio.play('bite', this.pos, this.scale); } }
        else if (Math.random() < dt * 0.6) { this.wantHeading = this.heading + (Math.random() < 0.5 ? 1.4 : -1.4); }
      }
      const gy = G.Phys.groundAt(this.pos.x, this.pos.z, this.pos.y, this.step, this.r);
      this.pos.y = Math.max(G.World.height(this.pos.x, this.pos.z) - 1.2 * this.scale, G.damp(this.pos.y, gy, 12, dt));
    }
    animate(dt) {
      const m = this.m, sp = this.speed;
      this.phase += dt * (sp * (m.quad ? 1.5 : 2.3) / this.scale + 0.0);
      const amp = Math.min(0.75, sp * (m.quad ? 0.14 : 0.12) / Math.sqrt(this.scale) + 0.0);
      const down = this.dead || this.ko > 0;
      for (const L of m.legs) {
        const s = Math.sin(this.phase + L.ph);
        L.g.rotation.x = down ? G.damp(L.g.rotation.x, 0.5, 4, dt) : s * amp;
        if (L.knee) L.knee.rotation.x = down ? 0 : Math.max(0, Math.sin(this.phase + L.ph + 1.2)) * amp * 1.3;
      }
      m.body.position.y = m.bodyY + (down ? 0 : Math.abs(Math.sin(this.phase)) * 0.05 * Math.min(1, sp));
      const T = G.time;
      m.tail.forEach((t, i) => { t.rotation.y = Math.sin(T * (1.4 + sp * 0.3) + i * 0.7 + this.uid) * (0.1 + 0.04 * sp / (this.S.run)); t.rotation.x = down ? 0 : -0.04 * i; });
      const grazing = this.state === 'graze' && sp < 0.3 && !this.target;
      const nx = down ? 0.2 : grazing ? 0.75 + Math.sin(T * 2 + this.uid) * 0.08 : (this.target ? -0.15 : 0.05 * Math.sin(T * 1.3));
      m.neck.rotation.x = G.damp(m.neck.rotation.x, nx, 4, dt);
      m.head.rotation.y = G.damp(m.head.rotation.y, grazing ? Math.sin(T * 0.7 + this.uid) * 0.3 : 0, 3, dt);
      if (m.jaw) m.jaw.rotation.x = this.jawT > 0 ? Math.sin((1 - this.jawT / 0.35) * Math.PI) * 0.55 : (this.dead ? 0.4 : 0.03);
      const r = m.root;
      r.position.copy(this.pos); r.rotation.y = this.heading;
      r.rotation.z = G.damp(r.rotation.z, down ? 1.45 : 0, 3, dt);
      if (this.marker) { this.marker.rotation.y += dt * 2; this.marker.position.y = this.m.bodyY * 1.9 + 0.8 + Math.sin(T * 2) * 0.1; }
    }
    remove() { G.scene.remove(this.m.root); }
  }
  G.Creature = Creature;

  G.Creatures = {
    list: [], spawnT: 5,
    init() { this.list = []; this.spawnT = 5; },
    spawn(sp, x, z, o) { const c = new Creature(sp, x, z, o); this.list.push(c); return c; },
    landPoint(sp, minD, tries) {
      const W = G.World, P = G.Player.pos, nrm = new THREE.Vector3();
      for (let t = 0; t < (tries || 60); t++) {
        const x = (Math.random() - 0.5) * G.SIZE * 0.85, z = (Math.random() - 0.5) * G.SIZE * 0.85;
        if (G.dist2(x, z, P.x, P.z) < minD * minD) continue;
        const h = W.height(x, z); if (h < 1.2 || h > 32) continue;
        W.normal(x, z, nrm); if (nrm.y < 0.85) continue;
        const gl = W.glade(x, z), forest = W.n3(x * 0.012 + 7, z * 0.012 + 3);
        if ((sp === 'trikeros' || sp === 'stegolith') && forest > 0.25) continue;
        if (sp === 'dreadmaw' && gl < 0.3 && h < 12) continue;
        return [x, z];
      }
      return null;
    },
    spawnInitial() {
      const P = G.Player.pos;
      for (const sp in G.SPECIES) {
        const S = G.SPECIES[sp];
        if (S.pack) {
          for (let k = 0; k < S.count / S.pack; k++) this.spawnPack(sp, 90);
        } else for (let k = 0; k < S.count; k++) { const p = this.landPoint(sp, sp === 'dreadmaw' ? 140 : 40); if (p) this.spawn(sp, p[0], p[1]); }
      }
      // friendly early-game herd near spawn
      const near = [['skitter', 26, 0.5], ['skitter', 30, 0.9], ['trikeros', 34, 2.4], ['stegolith', 42, 4.0]];
      for (const [sp, d, a] of near) {
        for (let t = 0; t < 12; t++) {
          const x = P.x + Math.cos(a + t * 0.5) * d, z = P.z + Math.sin(a + t * 0.5) * d;
          if (G.World.height(x, z) > 1.2) { this.spawn(sp, x, z); break; }
        }
      }
    },
    spawnPack(sp, minD) {
      const p = this.landPoint(sp, minD); if (!p) return;
      const home = { x: p[0], z: p[1] };
      for (let i = 0; i < G.SPECIES[sp].pack; i++) this.spawn(sp, p[0] + (Math.random() - 0.5) * 6, p[1] + (Math.random() - 0.5) * 6, { pack: home });
    },
    update(dt) {
      const cam = G.camera.position;
      for (let i = this.list.length - 1; i >= 0; i--) {
        const c = this.list[i];
        const d2 = G.dist2(c.pos.x, c.pos.z, cam.x, cam.z);
        const far = d2 > 170 * 170 && !c.tamed;
        c.m.root.visible = d2 < 230 * 230;
        if (far) { c.farT = (c.farT || 0) + dt; if (c.farT < 0.25) continue; }
        const alive = c.update(far ? c.farT : dt, far); c.farT = 0;
        if (!alive) { c.remove(); this.list.splice(i, 1); }
      }
      // separation
      const L = this.list;
      for (let i = 0; i < L.length; i++) {
        const a = L[i]; if (a.dead) continue;
        for (let j = i + 1; j < L.length; j++) {
          const b = L[j]; if (b.dead) continue;
          const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, rr = (a.r + b.r) * 0.8, d2 = dx * dx + dz * dz;
          if (d2 < rr * rr && d2 > 1e-4) {
            const d = Math.sqrt(d2), k = (rr - d) / d * 0.5;
            const wa = a.mounted ? 0.2 : 1, wb = b.mounted ? 0.2 : 1;
            a.pos.x -= dx * k * wa; a.pos.z -= dz * k * wa; b.pos.x += dx * k * wb; b.pos.z += dz * k * wb;
          }
        }
      }
      // repopulate
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = 12;
        for (const sp in G.SPECIES) {
          const S = G.SPECIES[sp];
          const n = L.filter(c => c.sp === sp && !c.tamed && !c.dead).length;
          if (n < S.count) { if (S.pack) { if (S.count - n >= S.pack) this.spawnPack(sp, 110); } else { const p = this.landPoint(sp, 110); if (p) this.spawn(sp, p[0], p[1]); } break; }
        }
      }
    },
    serialize() { return this.list.filter(c => c.tamed && !c.dead).map(c => ({ sp: c.sp, x: c.pos.x, z: c.pos.z, hp: c.hp, order: c.order, heading: c.heading })); },
    load(arr) { for (const t of arr) this.spawn(t.sp, t.x, t.z, { tamed: true, hp: t.hp, order: t.order, heading: t.heading }); },
  };
})();
