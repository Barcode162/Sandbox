'use strict';
// ============================================================================
//  AETHERWILD — player controller, survival stats, actions, view model
// ============================================================================
(function () {
  const G = window.G;
  const V = new THREE.Vector3(), V2 = new THREE.Vector3();
  const RADIUS = 0.35, HEIGHT = 1.75, STEP = 0.55;

  const P = G.Player = {
    pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: false, crouch: false, sprinting: false,
    hp: 100, food: 100, water: 100, stamina: 100, sel: 0, swingCD: 0, swingT: 1, hitAt: -1, mount: null, dead: false, bed: null,
    eye: 1.62, eyeOff: 0, walkPh: 0, focus: null, combatTarget: null, staminaWait: 0, lastHurt: 99, swimming: false,
    init() {
      this.buildViewModel();
      this.torchLight = { pos: new THREE.Vector3(), color: 0xffa44a, intensity: 1.1, dist: 10, flicker: true };
    },
    reset() {
      this.vel.set(0, 0, 0); this.yaw = 0; this.pitch = 0; this.hp = 100; this.food = 100; this.water = 100; this.stamina = 100;
      this.mount = null; this.dead = false; this.bed = null; this.focus = null; this.combatTarget = null; this.crouch = false;
      this.torchOn = false; this.sel = 0; this.swingT = 1; this.hitAt = -1; this.lastHurt = 99; this.intro = 0;
    },
    spawnAt(x, z) {
      this.pos.set(x, G.World.height(x, z) + 0.5, z); this.vel.set(0, 0, 0);
    },
    held() { return G.inv.slots[this.sel]; },
    tool() { const h = this.held(); return h && G.ITEMS[h.id].type === 'tool' ? G.ITEMS[h.id] : G.HAND; },

    // ------------------------------------------------------------------ update
    update(dt) {
      const I = G.Input;
      if (this.dead) return;
      this.lastHurt += dt;
      // ---- look
      const look = Math.abs(I.dx) + Math.abs(I.dy); if (look) G.stats.looked = (G.stats.looked || 0) + look;
      this.yaw -= I.dx * 0.0023 * G.settings.sens; this.pitch -= I.dy * 0.0023 * G.settings.sens * (G.settings.invertY ? -1 : 1);
      this.pitch = G.clamp(this.pitch, -1.5, 1.5);
      I.dx = I.dy = 0;
      const active = I.active();
      const k = I.keys;
      let mx = 0, mz = 0;
      if (active) { if (k.KeyW) mz -= 1; if (k.KeyS) mz += 1; if (k.KeyA) mx -= 1; if (k.KeyD) mx += 1; }
      if (active && (I.ax || I.az)) { mx = I.ax; mz = I.az; }
      let len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; len = 1; }
      const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      const wx = mx * cy + mz * sy, wz = -mx * sy + mz * cy; // camera-relative world dir
      const wantSprint = active && (k.ShiftLeft || I.touchSprint) && len > 0 && !this.crouch;
      this.sprinting = wantSprint && this.stamina > 1;

      if (this.mount) this.updateRide(dt, wx, wz, len);
      else this.updateWalk(dt, wx, wz, len, k, active);

      // ---- stats
      const S = this;
      S.food -= dt * (this.sprinting ? 0.11 : 0.07); S.water -= dt * (this.sprinting ? 0.15 : 0.095);
      S.food = Math.max(0, S.food); S.water = Math.max(0, S.water);
      if (S.food <= 0 || S.water <= 0) this.hp -= dt * 1.2;
      else if (S.food > 35 && S.water > 35 && this.lastHurt > 4) this.hp = Math.min(100, this.hp + dt * 0.6);
      if (this.sprinting) { this.stamina -= dt * 17; this.staminaWait = 1; G.stats.sprinted = true; }
      else { this.staminaWait -= dt; if (this.staminaWait <= 0) this.stamina = Math.min(100, this.stamina + dt * 16); }
      this.stamina = Math.max(0, this.stamina);
      if (this.hp <= 0) { this.die(); return; }

      // ---- camera
      const cam = G.camera;
      let eyeY;
      if (this.mount) {
        const m = this.mount; eyeY = m.pos.y + m.S.seat;
        cam.position.set(m.pos.x - Math.sin(m.heading) * m.r * 0.15, eyeY, m.pos.z - Math.cos(m.heading) * m.r * 0.15);
      } else {
        const target = this.crouch ? 1.05 : 1.62; this.eye = G.damp(this.eye, target, 12, dt);
        this.eyeOff = G.damp(this.eyeOff, 0, 14, dt);
        const bob = this.onGround ? Math.sin(this.walkPh * 2) * 0.035 * Math.min(1, Math.hypot(this.vel.x, this.vel.z) / 4) : 0;
        let drop = 0; if (this.intro > 0) { this.intro = Math.max(0, this.intro - dt); const t = this.intro / 2.2; drop = t * t * (3 - 2 * t) * 7; }
        cam.position.set(this.pos.x, this.pos.y + this.eye + this.eyeOff + bob + drop, this.pos.z);
      }
      cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      cam.updateMatrixWorld();
      G.camPos.copy(cam.position); cam.getWorldDirection(G.camDir);

      // ---- actions
      this.swingCD -= dt;
      if (this.hitAt >= 0) { this.hitAt -= dt; if (this.hitAt < 0) this.resolveHit(); }
      this.updateFocus();
      if (active && I.mouse.l) this.primary(I.mouse.lPressed);
      I.mouse.lPressed = false;
      // torch light
      const h = this.held();
      const torch = h && h.id === 'torch' && !this.mount;
      if (torch) { this.torchLight.pos.copy(cam.position).addScaledVector(G.camDir, 0.6); this.torchLight.pos.y -= 0.2; if (!this.torchOn) { G.Lights.add(this.torchLight); this.torchOn = true; } }
      else if (this.torchOn) { G.Lights.remove(this.torchLight); this.torchOn = false; }
      this.updateViewModel(dt);
    },
    updateWalk(dt, wx, wz, len, k, active) {
      const W = G.World;
      const terrainH = W.height(this.pos.x, this.pos.z);
      this.swimming = this.pos.y < G.WATER - 1.05 && terrainH < G.WATER - 1.05;
      let speed = this.crouch ? 2.2 : this.sprinting ? 7.6 : 4.6;
      if (this.swimming) speed = this.sprinting ? 4.2 : 3;
      const accel = this.onGround || this.swimming ? 14 : 3;
      this.vel.x = G.damp(this.vel.x, wx * speed, accel, dt);
      this.vel.z = G.damp(this.vel.z, wz * speed, accel, dt);
      if (this.swimming) {
        this.vel.y = G.damp(this.vel.y, (active && k.Space) ? 3 : -0.6, 4, dt);
        if (this.pos.y > G.WATER - 1.3 && active && k.Space) this.vel.y = Math.max(this.vel.y, 2.5);
      } else {
        this.vel.y -= 22 * dt;
        if (active && k.Space && this.onGround && this.stamina > 8) { this.vel.y = 7.2; this.onGround = false; this.stamina -= 8; this.staminaWait = 0.8; G.stats.jumped = true; }
      }
      const prevY = this.pos.y;
      // sub-stepped move
      const steps = 2;
      for (let s = 0; s < steps; s++) {
        this.pos.x += this.vel.x * dt / steps; this.pos.z += this.vel.z * dt / steps;
        G.Phys.collide(this.pos, RADIUS, HEIGHT * (this.crouch ? 0.65 : 1), STEP);
        // creatures are solid
        for (const c of G.Creatures.list) {
          if (c.dead || c === this.mount) continue;
          const dx = this.pos.x - c.pos.x, dz = this.pos.z - c.pos.z, rr = c.r * 0.85 + RADIUS, d2 = dx * dx + dz * dz;
          if (d2 < rr * rr && d2 > 1e-6 && this.pos.y < c.pos.y + c.height) { const d = Math.sqrt(d2), q = (rr - d) / d; this.pos.x += dx * q; this.pos.z += dz * q; }
        }
      }
      this.pos.y += this.vel.y * dt;
      const ceil = G.Phys.ceilingAt(this.pos.x, this.pos.z, prevY, HEIGHT);
      if (this.pos.y + HEIGHT > ceil && this.vel.y > 0) { this.pos.y = ceil - HEIGHT; this.vel.y = 0; }
      const g = G.Phys.groundAt(this.pos.x, this.pos.z, Math.max(prevY, this.pos.y), STEP, RADIUS);
      if (this.pos.y <= g + 0.001) {
        if (!this.onGround && this.vel.y < -13 && !this.swimming) this.hurt((-this.vel.y - 13) * 6, null);
        if (g - this.pos.y > 0.05 && g - prevY < STEP + 0.01) this.eyeOff -= (g - this.pos.y); // smooth step-up
        this.pos.y = g; if (this.vel.y < 0) this.vel.y = 0; this.onGround = true;
      } else this.onGround = this.pos.y - g < 0.05;
      if (len > 0 && this.onGround) { this.walkPh += dt * (this.sprinting ? 9 : 6.5); G.stats.walked = (G.stats.walked || 0) + Math.hypot(this.vel.x, this.vel.z) * dt; }
      if (this.onGround && len > 0) { this.stepT = (this.stepT || 0) - dt; if (this.stepT <= 0) { this.stepT = this.sprinting ? 0.32 : 0.46; G.Audio.play('step'); } }
    },
    updateRide(dt, wx, wz, len) {
      const m = this.mount;
      if (m.dead) { this.dismount(); return; }
      let spd = 0;
      if (len > 0) { m.wantHeading = Math.atan2(wx, wz); spd = m.S.rideSpeed * (this.sprinting ? 1.4 : 1); }
      m.move(dt, spd, false);
      this.pos.copy(m.pos);
      if (len > 0) { this.stepT = (this.stepT || 0) - dt; if (this.stepT <= 0) { this.stepT = 0.5; G.Audio.play('stomp', m.pos, m.scale); } }
    },
    mountUp(c) {
      if (!c.S.ride) { G.UI.toast(c.S.name + ' is too small to ride', null, 'warn'); return; }
      if (G.inv.count('saddle') < 1) { G.UI.toast('You need a Saddle in your inventory to ride (Workbench)', null, 'warn'); return; }
      this.mount = c; c.mounted = true; c.target = null;
      G.UI.toast('Riding ' + c.S.name + '. [R] dismount, [LMB] attack', null, 'good');
    },
    dismount() {
      const m = this.mount; if (!m) return;
      m.mounted = false; this.mount = null;
      const a = m.heading + Math.PI / 2;
      this.pos.set(m.pos.x + Math.sin(a) * (m.r + 1), 0, m.pos.z + Math.cos(a) * (m.r + 1));
      this.pos.y = G.World.height(this.pos.x, this.pos.z) + 0.3; this.vel.set(0, 0, 0);
      G.Phys.collide(this.pos, RADIUS, HEIGHT, STEP);
    },

    // ------------------------------------------------------------------ focus
    updateFocus() {
      const o = G.camPos, d = G.camDir;
      let best = { t: 6.5, kind: null };
      const tr = G.Phys.terrainRay(o, d, 6.5); if (tr) best.t = tr.t;
      for (const c of G.Creatures.list) {
        if (c === this.mount || G.dist2(c.pos.x, c.pos.z, o.x, o.z) > 30 * 30) continue;
        const t = c.rayHit(o, d); if (t >= 0 && t < best.t) best = { t, kind: 'creature', obj: c };
      }
      const ns = G.World.nodesNear(o.x, o.z, 8, this._ns || (this._ns = []));
      for (const n of ns) {
        if (!n.alive) continue;
        let t;
        if (n.type === 'tree') t = G.rayCylY(o, d, n.x, n.z, n.hitR, n.y - 0.5, n.y + n.hitH);
        else t = G.raySphere(o, d, V.set(n.x, n.y + n.hitH * 0.35, n.z), n.hitR);
        if (t >= 0 && t < best.t) best = { t, kind: 'node', obj: n };
      }
      const hb = G.Phys.raycast(o, d, best.t);
      if (hb && hb.t < best.t) best = { t: hb.t, kind: hb.owner.isPiece ? 'piece' : 'place', obj: hb.owner };
      if (d.y < -0.05 && !best.kind) {
        const t = (G.WATER - o.y) / d.y;
        if (t > 0 && t < 4.5 && t <= best.t + 0.01) {
          const px = o.x + d.x * t, pz = o.z + d.z * t;
          if (G.World.height(px, pz) < G.WATER - 0.15) best = { t, kind: 'water' };
        }
      }
      if (!best.kind && this.pos.y < G.WATER - 0.3) best = { t: 0, kind: 'water' };
      this.focus = best.kind ? best : null;
    },

    // ------------------------------------------------------------------ actions
    primary(pressed) {
      if (G.Build.mode || G.Build.placeItem) { if (pressed) G.Build.tryPlace(); return; }
      const h = this.held(); const it = h && G.ITEMS[h.id];
      if (it && (it.type === 'food')) { if (pressed) this.eat(h.id); return; }
      if (it && it.type === 'place') { G.Build.placeItem = h.id; return; }
      if (this.swingCD > 0) return;
      const tool = this.mount ? { speed: this.mount.sp === 'razorclaw' ? 0.7 : 1.1 } : this.tool();
      this.swingCD = tool.speed; this.swingT = 0; this.hitAt = this.mount ? 0.2 : 0.13;
      if (this.mount) this.mount.jawT = 0.35;
      G.Audio.play('swish');
    },
    resolveHit() {
      const f = this.focus;
      if (this.mount) return this.mountHit(f);
      const h = this.held(), tool = this.tool();
      const reach = tool.reach || 3.4;
      if (!f || f.t > reach) return;
      let used = false;
      if (f.kind === 'creature') {
        const c = f.obj; if (c.dead) return;
        const dmg = tool.dmg * (0.9 + Math.random() * 0.2);
        c.hurt(dmg, 'player', tool.torpor || 0); if (!c.tamed) this.combatTarget = c;
        G.Audio.play('hit'); used = true;
      } else if (f.kind === 'node') {
        const n = f.obj, T = G.NODES[n.type];
        const pow = tool.gather[n.type] || 0;
        if (pow <= 0) { G.UI.toast('Requires ' + (T.need || 'a better tool'), null, 'warn'); G.Audio.play('clank'); return; }
        G.World.damageNode(n, pow);
        const hp = V.copy(G.camPos).addScaledVector(G.camDir, f.t);
        G.Particles.burst(hp, T.color, 6, 3.5, 0.1);
        let amt = pow + (Math.random() < 0.3 ? 1 : 0);
        G.give(T.res, amt);
        if (T.bonus === 'berries') G.give('berries', 1 + (Math.random() < 0.5 ? 1 : 0));
        else if (T.bonus === 'stone' && Math.random() < 0.6) G.give('stone', 1);
        G.Audio.play(n.type === 'tree' ? 'chop' : n.type === 'bush' ? 'rustle' : 'mine');
        used = true;
      } else if (f.kind === 'piece' || f.kind === 'place') {
        G.Audio.play('clank');
        G.Particles.burst(V.copy(G.camPos).addScaledVector(G.camDir, f.t), 0xcccccc, 3, 2, 0.06);
      }
      if (used && h && h.d !== undefined && G.ITEMS[h.id].dur) {
        h.d -= 1;
        if (h.d <= 0) { G.inv.slots[this.sel] = null; G.UI.toast('Your ' + G.ITEMS[h.id].name + ' broke!', null, 'warn'); G.Audio.play('break'); }
        G.inv.changed();
      }
    },
    mountHit(f) {
      const m = this.mount;
      if (!f) return;
      const reach = m.r + m.S.reach + 1.5;
      if (f.kind === 'creature' && f.t < reach + 2) {
        f.obj.hurt(m.S.dmg * 1.4, m, 0); this.combatTarget = f.obj; G.Audio.play('bite', m.pos, m.scale);
      } else if (f.kind === 'node' && f.t < reach + 2) {
        const n = f.obj, T = G.NODES[n.type];
        if (n.type === 'tree' || n.type === 'rock' || n.type === 'bush') {
          const pow = m.sp === 'razorclaw' ? 2 : 6;
          G.World.damageNode(n, pow); G.give(T.res, pow);
          if (T.bonus === 'berries') G.give('berries', 2);
          G.Particles.burst(V.copy(G.camPos).addScaledVector(G.camDir, f.t), T.color, 8, 4, 0.12);
          G.Audio.play(n.type === 'tree' ? 'chop' : 'mine');
        } else G.UI.toast('Dismount and use a pickaxe', null, 'warn');
      }
    },
    eat(id) {
      const it = G.ITEMS[id];
      if (it.heal) { if (this.hp >= 100) { G.UI.toast('Already at full health'); return; } this.hp = Math.min(100, this.hp + it.heal); }
      else { if (this.food > 97) { G.UI.toast('You are full'); return; } }
      if (it.food) this.food = Math.min(100, this.food + it.food);
      if (it.water) this.water = Math.min(100, this.water + it.water);
      if (it.hurt) { this.hp -= it.hurt; this.lastHurt = 0; G.UI.flash('#7a8a2a'); G.UI.toast('Raw meat is not great for you...', null, 'warn'); }
      G.inv.remove(id, 1); G.Audio.play('eat'); G.stats.ate = true;
    },
    interact() {
      const f = this.focus;
      if (this.mount) return;
      const dr = G.Build.doorwayOnRay(G.camPos, G.camDir, f ? Math.min(f.t + 0.3, 4.5) : 4.5);
      if (dr && dr.doorway.door) { G.Build.toggleDoor(dr.doorway.door); return; }
      if (f && f.kind === 'water' && f.t < 4.5) return this.drink();
      if (!f || f.t > 4.5) { if (this.pos.y < G.WATER - 0.2) this.drink(); return; }
      if (f.kind === 'creature') {
        const [food, msg] = f.obj.canFeed();
        if (food) f.obj.feed(food); else if (msg) G.UI.toast(msg, null, 'warn');
      } else if (f.kind === 'place') {
        const q = f.obj;
        if (q.type === 'chest' || q.type === 'backpack') G.UI.openInventory(q);
        else if (q.type === 'bed') { this.bed = q; G.UI.toast('Respawn point set', null, 'good'); G.save(); }
        else if (G.STATIONS[q.type]) G.UI.openInventory(null, q.type);
      } else if (f.kind === 'piece') {
        const p = f.obj;
        if (p.kind === 'door') G.Build.toggleDoor(p);
        else if (p.kind === 'doorway' && p.door) G.Build.toggleDoor(p.door);
      }
    },
    drink() {
      if (this.water > 98) { G.UI.toast('Not thirsty'); return; }
      this.water = Math.min(100, this.water + 22); G.Audio.play('drink'); G.stats.drank = true;
      G.Particles.burst(V.copy(G.camPos).addScaledVector(G.camDir, 1.2), 0x6fb6d8, 6, 2, 0.06);
    },
    ride() {
      if (this.mount) return this.dismount();
      const f = this.focus;
      if (f && f.kind === 'creature' && f.obj.tamed && f.t < 6) this.mountUp(f.obj);
    },
    command() {
      const f = this.focus;
      if (f && f.kind === 'creature' && f.obj.tamed) {
        const c = f.obj; c.order = c.order === 'follow' ? 'stay' : 'follow'; c.target = null;
        G.UI.toast(c.S.name + ': ' + (c.order === 'follow' ? 'Following you' : 'Staying here'));
      }
    },
    hurt(n, src) {
      if (this.dead) return;
      if (this.mount) { this.mount.hurt(n, src); return; }
      this.hp -= n; this.lastHurt = 0;
      G.UI.flash('#b3262f'); G.Audio.play('hurt');
      if (src && src.pos) { V.subVectors(this.pos, src.pos).setY(0).normalize(); this.vel.addScaledVector(V, 4); }
      if (this.hp <= 0) this.die();
    },
    die() {
      if (this.dead) return;
      this.dead = true; this.hp = 0;
      if (this.mount) this.dismount();
      if (!G.inv.isEmpty()) {
        const bp = G.Build.addPlaceable({ type: 'backpack', x: this.pos.x, y: Math.max(G.World.height(this.pos.x, this.pos.z), G.WATER), z: this.pos.z, rot: 0 });
        bp.store.load(G.inv.toJSON()); G.inv.load(new Array(G.inv.slots.length).fill(null));
      }
      G.Build.stopBuild(); G.Build.placeItem = null;
      G.UI.showDeath();
    },
    respawn() {
      this.dead = false; this.hp = 100; this.food = Math.max(this.food, 60); this.water = Math.max(this.water, 60); this.stamina = 100;
      if (this.bed && G.Build.placeables.includes(this.bed)) this.spawnAt(this.bed.x + 1.2, this.bed.z + 1.2);
      else this.spawnAt(G.World.spawn.x, G.World.spawn.z);
      for (const c of G.Creatures.list) if (c.target === 'player') c.target = null;
    },

    // ------------------------------------------------------------------ view model
    buildViewModel() {
      const vs = this.vmScene = new THREE.Scene();
      this.vmCam = new THREE.PerspectiveCamera(55, 1, 0.01, 10);
      this.vmHemi = new THREE.HemisphereLight(0xffffff, 0x445533, 0.8); vs.add(this.vmHemi);
      this.vmSun = new THREE.DirectionalLight(0xffffff, 1.5); this.vmSun.position.set(0.5, 1, 0.3); vs.add(this.vmSun);
      this.vmPoint = new THREE.PointLight(0xffa44a, 0, 3, 2); this.vmPoint.position.set(0.3, 0.2, -0.6); vs.add(this.vmPoint);
      const arm = this.arm = new THREE.Group();
      const b = new G.Builder(4);
      b.add(G.geo.cyl(0.05, 0.068, 7), G.PAL.hide, { p: [0, 0, 0.14], r: [-Math.PI / 2, 0, 0], s: [1, 0.5, 1], j: 0.06 });
      b.add(G.geo.cyl(0.058, 0.058, 7), G.PAL.hideD, { p: [0, 0, -0.12], r: [-Math.PI / 2, 0, 0], s: [1, 0.06, 1] });
      b.add(G.geo.cyl(0.042, 0.05, 7), 0xd9a77e, { p: [0, 0, -0.16], r: [-Math.PI / 2, 0, 0], s: [1, 0.06, 1] });
      b.add(G.geo.ico1, 0xd9a77e, { p: [0, 0.005, -0.215], s: [0.1, 0.085, 0.11], j: 0.04 });
      b.add(G.geo.ico1, 0xcf9a70, { p: [-0.035, 0.02, -0.235], s: [0.035, 0.03, 0.06] });
      arm.add(b.build(false));
      arm.position.set(0.26, -0.26, -0.42);
      this.hand = new THREE.Group(); this.hand.position.set(0, 0.0, -0.22); arm.add(this.hand);
      vs.add(arm);
      this.vmItem = null; this.vmId = '';
    },
    updateViewModel(dt) {
      const h = this.held(); const id = (this.mount || G.Build.mode) ? '' : (h ? h.id : '');
      if (id !== this.vmId) {
        if (this.vmItem) this.hand.remove(this.vmItem);
        this.vmItem = null; this.vmId = id;
        if (id) {
          const it = G.ITEMS[id];
          const g = G.Models.item(id);
          const wrap = new THREE.Group(); wrap.add(g);
          if (it.type === 'tool') { g.scale.setScalar(0.62); g.position.y = -0.08; wrap.rotation.set(-0.5, 0.1, -0.12); if (id === 'stone_spear') { g.position.y = -0.7; } }
          else if (it.type === 'place') { g.scale.setScalar(0.22); g.position.set(-0.05, 0.02, -0.12); }
          else { g.scale.setScalar(0.26); g.position.set(-0.02, 0.04, -0.06); }
          this.vmItem = wrap; this.hand.add(wrap);
        }
      }
      this.arm.visible = !this.mount;
      // swing animation
      const tool = this.tool();
      if (this.swingT < 1) this.swingT = Math.min(1, this.swingT + dt / Math.max(0.25, tool.speed * 0.8));
      const s = Math.sin(this.swingT * Math.PI);
      const sp = Math.hypot(this.vel.x, this.vel.z);
      const bx = Math.sin(this.walkPh) * 0.012 * Math.min(1, sp / 4), by = Math.abs(Math.cos(this.walkPh)) * 0.014 * Math.min(1, sp / 4);
      this.arm.position.set(0.26 + bx - s * 0.08, -0.26 + by + s * 0.05, -0.42 - s * 0.15);
      this.arm.rotation.set(-s * 1.1 + 0.05, 0.12 + s * 0.3, s * 0.35);
      // lights follow world
      const W = G.World;
      this.vmHemi.intensity = W.hemi.intensity * 1.1 + 0.08; this.vmHemi.color.copy(W.hemi.color);
      this.vmSun.intensity = W.sun.intensity * 0.55; this.vmSun.color.copy(W.sun.color);
      this.vmPoint.intensity = this.torchOn ? 1.4 : 0;
    },
    serialize() {
      return { x: this.pos.x, y: this.pos.y, z: this.pos.z, yaw: this.yaw, pitch: this.pitch, hp: this.hp, food: this.food, water: this.water, sel: this.sel };
    },
    load(d) {
      this.pos.set(d.x, d.y, d.z); this.yaw = d.yaw; this.pitch = d.pitch; this.hp = d.hp; this.food = d.food; this.water = d.water; this.sel = d.sel || 0;
    },
  };
})();
