// Authoritative game simulation. Runs on the Node server for multiplayer,
// and directly in the browser for solo play. No Node or DOM APIs in here.
(function (factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./defs.js'));
  else window.SBGame = factory(window.SBDefs);
})(function (D) {
  'use strict';
  const { W, H, CX, CY, G, O, objs, items, grounds } = D;
  const MOBS = D.mobs;
  const rnd = Math.random;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const r2 = v => Math.round(v * 100) / 100;
  const pick = a => a[Math.floor(rnd() * a.length)];

  function hash2(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y, s) => (vnoise(x, y, s) * 4 + vnoise(x * 2, y * 2, s + 1) * 2 + vnoise(x * 4, y * 4, s + 2)) / 7;
  const st = v => Math.max(0, Math.min(1, (v - 0.5) * 2.4 + 0.5));

  const QUESTS = [
    // kind, id, base amount, coins each, xp skill, xp each, min tier
    ['g', 'wood', 10, 2, 'wood', 5, 1], ['g', 'stone', 10, 2, 'mine', 5, 1], ['g', 'fiber', 8, 2, 'farm', 4, 1],
    ['g', 'berries', 6, 3, 'farm', 6, 1], ['k', 'slime', 5, 5, 'combat', 10, 1], ['k', 'chicken', 4, 4, 'combat', 6, 1],
    ['g', 'coal', 5, 5, 'mine', 8, 2], ['g', 'copper_ore', 5, 7, 'mine', 12, 2], ['k', 'boar', 4, 8, 'combat', 14, 2],
    ['g', 'wheat', 6, 5, 'farm', 10, 2], ['k', 'skeleton', 4, 12, 'combat', 25, 2], ['g', 'iron_ore', 4, 12, 'mine', 20, 3],
    ['k', 'wolf', 3, 14, 'combat', 25, 3], ['k', 'scorpion', 3, 12, 'combat', 20, 3], ['g', 'gold_ore', 3, 25, 'mine', 30, 4],
    ['k', 'golem', 2, 40, 'combat', 60, 4], ['g', 'crystal', 2, 45, 'mine', 40, 4], ['g', 'starmetal', 2, 80, 'mine', 70, 5],
  ];

  class Game {
    constructor(opts) {
      opts = opts || {};
      const sv = opts.save || null;
      this.seed = sv ? sv.seed : (opts.seed != null ? opts.seed : Math.floor(rnd() * 1e9));
      this.g = new Uint8Array(W * H); this.o = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const t = this.gen(x, y); this.g[y * W + x] = t[0]; this.o[y * W + x] = t[1];
      }
      this.mods = new Set(); this.timers = []; this.dmg = new Map();
      this.players = new Map(); this.mobs = new Map(); this.claims = new Map(); this.saved = {};
      this.clock = 0; this.nextId = 1; this.event = null; this.evKind = 0;
      this.t1 = 0; this.tSpawn = 0;
      if (sv) {
        this.clock = sv.clock || 0;
        for (const [i, g, o] of sv.mods || []) { this.g[i] = g; this.o[i] = o; this.mods.add(i); }
        this.timers = sv.timers || [];
        for (const [i, c] of sv.claims || []) this.claims.set(i, c);
        this.saved = sv.players || {};
      }
      this.nextEvent = this.clock + 150;
    }

    // ---------- world generation ----------
    gen(x, y) {
      const s = this.seed, dc = dist(x, y, CX, CY);
      if (dc < 5.5) {
        let o = 0; const ax = Math.abs(x - CX), ay = Math.abs(y - CY);
        if (ax === 0 && ay === 0) o = O.beacon; else if (x === CX + 3 && y === CY - 2) o = O.stall; else if (ax === 3 && ay === 3) o = O.torch;
        return [G.STONEF, o];
      }
      let e = st(fbm(x / 38, y / 38, s));
      const de = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (de < 14) e -= (14 - de) / 14 * 0.7;
      if (dc < 30) { const k = dc / 30; e = 0.5 + (e - 0.5) * k * k; }
      if (e < 0.27) return [G.WATER, 0];
      if (dc < D.SAFE_R + 1) return [G.GRASS, 0];
      const r = hash2(x, y, s + 99), q = hash2(x, y, s + 7);
      if (e < 0.305) return [G.SAND, r < 0.015 ? O.rock : 0];
      if (e > 0.76) {
        const d = (e - 0.76) / 0.24; let o = 0;
        if (r < 0.82) {
          o = O.rock;
          if (q < 0.006 + d * 0.03) o = O.crystal; else if (q < 0.02 + d * 0.08) o = O.gold_ore;
          else if (q < 0.06 + d * 0.16) o = O.iron_ore; else if (q < 0.13 + d * 0.2) o = O.copper_ore;
          else if (q < 0.22 + d * 0.2) o = O.coal_ore;
        }
        return [G.STONE, o];
      }
      const t = st(fbm(x / 75, y / 75, s + 10)) + (y - CY) / H * 0.55;
      const m = st(fbm(x / 45, y / 45, s + 20));
      const outcrop = (a, b) => q < 0.12 ? a : q < 0.3 ? (b || O.coal_ore) : O.rock;
      if (t < 0.24) return [G.SNOW, r < 0.03 ? outcrop(O.iron_ore, O.copper_ore) : r < 0.15 ? O.pine : 0];
      if (t > 0.66 && m < 0.6) return [G.SAND, r < 0.03 ? outcrop(O.gold_ore, O.copper_ore) : r < 0.07 ? O.cactus : 0];
      if (m > 0.55) return [G.FOREST, r < 0.015 ? outcrop(O.copper_ore) : r < 0.3 ? O.tree : r < 0.36 ? O.grass_tuft : r < 0.385 ? O.bush_full : 0];
      return [G.GRASS, r < 0.02 ? outcrop(O.copper_ore) : r < 0.055 ? O.tree : r < 0.15 ? O.grass_tuft : r < 0.17 ? O.flower : r < 0.182 ? O.bush_full : 0];
    }

    setTile(i, g, o) {
      this.g[i] = g; this.o[i] = o; this.dmg.delete(i);
      const base = this.gen(i % W, (i / W) | 0);
      if (base[0] === g && base[1] === o) this.mods.delete(i); else this.mods.add(i);
      const d = objs[o];
      if (d.grow) this.timers.push({ i, from: o, to: O[d.grow[0]], at: this.clock + d.grow[1] * (0.8 + rnd() * 0.4) });
      this.all({ t: 'tile', i, g, o });
    }

    // ---------- messaging ----------
    all(msg) { for (const p of this.players.values()) p.send(msg); }
    near(x, y, msg, r) { r = r || 24; for (const p of this.players.values()) if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r) p.send(msg); }
    toast(p, s) { if (p.lt === s && this.clock - p.ltt < 1.5) return; p.lt = s; p.ltt = this.clock; p.send({ t: 'toast', s }); }
    sys(s) { this.all({ t: 'chat', sys: 1, s }); }
    roster() { this.all({ t: 'roster', r: [...this.players.values()].map(p => [p.id, p.name, D.totalLevel(p.skills)]) }); }

    // ---------- players ----------
    addPlayer(name, token, send) {
      name = String(name || '').replace(/[^\w \-]/g, '').trim().slice(0, 16) || 'Adventurer';
      token = String(token || '').slice(0, 64) || 'anon' + rnd();
      for (const q of this.players.values()) if (q.token === token) { q.send({ t: 'kick', s: 'Logged in from another window' }); this.removePlayer(q.id); }
      let n = name, k = 2;
      const taken = nm => [...this.players.values()].some(q => q.name.toLowerCase() === nm.toLowerCase());
      while (taken(n)) n = name.slice(0, 13) + ' ' + k++;
      const sv = this.saved[token];
      const p = {
        id: this.nextId++, token, name: n, send, x: CX + 0.5, y: CY + 2.5, f: 1, hp: 100,
        inv: { berries: 4, torch: 2 }, skills: { mine: 0, wood: 0, combat: 0, farm: 0 }, coins: 0,
        quests: [], qdone: 0, bed: null, dead: false, mb: 3, lh: 0, la: 0, le: 0, lc: 0, hurtAt: -99, sw: 0, sa: 0,
      };
      if (sv) for (const key of ['x', 'y', 'hp', 'inv', 'skills', 'coins', 'quests', 'qdone', 'bed']) if (sv[key] != null) p[key] = JSON.parse(JSON.stringify(sv[key]));
      p.maxhp = D.maxHp(p.skills);
      if (p.hp <= 0) { p.hp = p.maxhp; p.x = CX + 0.5; p.y = CY + 2.5; }
      if (!p.quests.length) {
        p.quests = [this.mkQuest(QUESTS[0], 1), this.mkQuest(QUESTS[1], 1), this.mkQuest(QUESTS[4], 1)];
      }
      this.players.set(p.id, p);
      send({
        t: 'init', id: p.id, w: W, h: H, g: this.g, o: this.o, clock: this.clock, event: this.event && this.evPub(),
        you: { name: p.name, x: p.x, y: p.y, hp: p.hp, maxhp: p.maxhp, inv: p.inv, skills: p.skills, coins: p.coins, quests: p.quests },
        claims: [...this.claims].map(([i, c]) => [i, c.name]),
      });
      this.roster();
      this.sys(`${p.name} entered the world`);
      return p;
    }
    removePlayer(id) {
      const p = this.players.get(id); if (!p) return;
      this.stash(p); this.players.delete(id); this.roster(); this.sys(`${p.name} left`);
    }
    stash(p) {
      this.saved[p.token] = { name: p.name, x: p.x, y: p.y, hp: p.hp, inv: p.inv, skills: p.skills, coins: p.coins, quests: p.quests, qdone: p.qdone, bed: p.bed };
    }
    save() {
      for (const p of this.players.values()) this.stash(p);
      return {
        seed: this.seed, clock: this.clock, mods: [...this.mods].map(i => [i, this.g[i], this.o[i]]),
        timers: this.timers, claims: [...this.claims], players: this.saved,
      };
    }

    give(p, item, n, src) {
      if (n <= 0 || !items[item]) return;
      p.inv[item] = (p.inv[item] || 0) + n;
      p.send({ t: 'inv', d: { [item]: p.inv[item] }, got: [item, n] });
      if (src === 'g') this.questProg(p, 'g', item, n);
    }
    take(p, item, n) {
      if ((p.inv[item] || 0) < n) return false;
      p.inv[item] -= n; if (!p.inv[item]) delete p.inv[item];
      p.send({ t: 'inv', d: { [item]: p.inv[item] || 0 } });
      return true;
    }
    addXp(p, skill, amt) {
      amt = Math.round(amt); if (amt <= 0) return;
      const before = D.levelFor(p.skills[skill]);
      p.skills[skill] = (p.skills[skill] || 0) + amt;
      const after = D.levelFor(p.skills[skill]);
      p.send({ t: 'xp', k: skill, xp: p.skills[skill], gain: amt, up: after > before ? after : 0 });
      if (after > before) {
        if (skill === 'combat') { p.maxhp = D.maxHp(p.skills); p.hp = p.maxhp; }
        if (after % 5 === 0) this.sys(`⭐ ${p.name} reached ${D.SKILLS[skill]} level ${after}!`);
        this.roster();
      }
    }

    // ---------- quests ----------
    mkQuest(tpl, tier) {
      const [k, id, base, c, sk, xp] = tpl;
      const need = Math.round(base * (1 + 0.5 * (tier - 1)));
      return { k, id, need, have: 0, coins: Math.round(need * c * 1.5), sk, xp: Math.round(need * xp) };
    }
    newQuest(p) {
      const tier = Math.min(5, 1 + Math.floor(p.qdone / 3));
      const pool = QUESTS.filter(q => q[6] <= tier && q[6] >= tier - 2 && !p.quests.some(a => a.id === q[1]));
      return this.mkQuest(pick(pool), tier);
    }
    questProg(p, k, id, n) {
      let ch = false;
      for (let j = 0; j < p.quests.length; j++) {
        const q = p.quests[j];
        if (q.k !== k || q.id !== id) continue;
        q.have += n; ch = true;
        if (q.have >= q.need) {
          p.coins += q.coins; p.qdone++;
          p.send({ t: 'qdone', coins: q.coins });
          this.addXp(p, q.sk, q.xp);
          p.quests[j] = this.newQuest(p);
        }
      }
      if (ch) p.send({ t: 'quests', q: p.quests });
    }

    // ---------- protection ----------
    canEdit(p, x, y) {
      if (dist(x, y, CX, CY) < D.SAFE_R) return 'The town is protected';
      for (const [i, c] of this.claims) {
        if (c.owner !== p.token && Math.abs(i % W - x) <= D.CLAIM_R && Math.abs(((i / W) | 0) - y) <= D.CLAIM_R) return `This land belongs to ${c.name}`;
      }
      return null;
    }
    inClaim(x, y) {
      for (const i of this.claims.keys()) if (Math.abs(i % W - x) <= D.CLAIM_R && Math.abs(((i / W) | 0) - y) <= D.CLAIM_R) return true;
      return false;
    }
    nearStation(p, name) {
      const id = O[name], px = Math.floor(p.x), py = Math.floor(p.y);
      for (let y = py - 3; y <= py + 3; y++) for (let x = px - 3; x <= px + 3; x++)
        if (x >= 0 && y >= 0 && x < W && y < H && this.o[y * W + x] === id) return true;
      return false;
    }

    // ---------- client messages ----------
    handle(p, m) {
      if (!m || typeof m !== 'object' || !this.players.has(p.id)) return;
      if (m.t === 'chat') {
        const s = String(m.s || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 200);
        if (!s || this.clock - p.lc < 0.4) return;
        p.lc = this.clock; this.all({ t: 'chat', n: p.name, s }); return;
      }
      if (m.t === 'respawn') { if (p.dead) this.respawn(p); return; }
      if (p.dead) return;
      switch (m.t) {
        case 'm': return this.onMove(p, m);
        case 'hit': return this.onHit(p, m);
        case 'atk': return this.onAttack(p, m);
        case 'use': return this.onUse(p, m);
        case 'craft': return this.onCraft(p, m);
        case 'buy': case 'sell': return this.onTrade(p, m);
      }
    }

    onMove(p, m) {
      const x = +m.x, y = +m.y;
      if (!isFinite(x) || !isFinite(y)) return;
      const d = dist(x, y, p.x, p.y);
      const bad = d > p.mb + 0.35 || (D.blockedAt(this, x, y, D.PR) && !D.blockedAt(this, p.x, p.y, D.PR));
      if (bad) { p.send({ t: 'pos', x: p.x, y: p.y }); return; }
      p.mb = Math.max(0, p.mb - d); p.x = x; p.y = y; p.f = m.f < 0 ? -1 : 1;
    }

    tileOk(p, m) {
      const x = m.x | 0, y = m.y | 0;
      if (x < 0 || y < 0 || x >= W || y >= H) return null;
      if (dist(p.x, p.y, x + 0.5, y + 0.5) > D.REACH + 0.6) return null;
      return { x, y, i: y * W + x };
    }

    onHit(p, m) {
      const t = this.tileOk(p, m); if (!t) return;
      if (this.clock - p.lh < 0.19) return;
      const oid = this.o[t.i], d = objs[oid];
      if (!d.hp || d.fixed) return;
      const err = this.canEdit(p, t.x, t.y); if (err) return this.toast(p, err);
      const tier = d.tool ? D.best(p.inv, d.tool) : 0;
      if (d.tier && tier < d.tier) return this.toast(p, `You need a ${D.TIERS[d.tier]} Pickaxe or better`);
      p.lh = this.clock; p.sw++; p.sa = r2(Math.atan2(t.y + 0.5 - p.y, t.x + 0.5 - p.x));
      const lvl = d.xp ? D.levelFor(p.skills[d.xp[0]]) : 1;
      const dm = (this.dmg.get(t.i) || 0) + (1 + tier) * (1 + 0.04 * (lvl - 1));
      if (dm < d.hp) {
        this.dmg.set(t.i, dm);
        this.near(t.x, t.y, { t: 'fx', k: 'hit', x: t.x, y: t.y, r: r2(dm / d.hp), o: oid });
        return;
      }
      this.near(t.x, t.y, { t: 'fx', k: 'brk', x: t.x, y: t.y, o: oid });
      this.setTile(t.i, this.g[t.i], d.becomes ? O[d.becomes] : 0);
      for (const [it, a, b, ch] of d.drops || []) {
        if (ch != null && rnd() > ch) continue;
        let n = ri(a, b); if (d.xp && !d.built && rnd() < 0.015 * lvl) n *= 2;
        this.give(p, it, n, d.built ? null : 'g');
      }
      if (d.xp) this.addXp(p, d.xp[0], d.xp[1]);
      if (d.regrow) this.timers.push({ i: t.i, from: 0, to: oid, re: 1, at: this.clock + 150 + rnd() * 150 });
      if (oid === O.flag && this.claims.delete(t.i)) this.all({ t: 'claim', i: t.i, name: null });
    }

    onAttack(p, m) {
      const a = +m.a; if (!isFinite(a)) return;
      const lvl = D.levelFor(p.skills.combat), mult = 1 + 0.05 * (lvl - 1);
      const bow = m.bow && p.inv.bow && p.inv.arrow > 0;
      if (this.clock - p.la < (bow ? 0.55 : 0.29)) return;
      p.la = this.clock; p.sw++; p.sa = r2(a);
      const cx = Math.cos(a), sy = Math.sin(a);
      if (bow) {
        this.take(p, 'arrow', 1);
        let x = p.x, y = p.y, hit = null;
        for (let s = 0; s < 40 && !hit; s++) {
          x += cx * 0.25; y += sy * 0.25;
          const tx = Math.floor(x), ty = Math.floor(y);
          if (tx < 0 || ty < 0 || tx >= W || ty >= H || objs[this.o[ty * W + tx]].solid) break;
          for (const mb of this.mobs.values()) if (dist(mb.x, mb.y, x, y) < 0.45 * (MOBS[mb.k].size || 1) + 0.2) { hit = mb; break; }
        }
        this.near(p.x, p.y, { t: 'fx', k: 'arrow', x1: r2(p.x), y1: r2(p.y), x2: r2(x), y2: r2(y) });
        if (hit) this.hurtMob(hit, (9 + 2 * D.best(p.inv, 'sword')) * mult, p, cx, sy);
        return;
      }
      const dmg = D.SWORD_DMG[D.best(p.inv, 'sword')] * mult;
      for (const mb of [...this.mobs.values()]) {
        const sz = MOBS[mb.k].size || 1, d = dist(p.x, p.y, mb.x, mb.y);
        if (d > 1.5 + sz * 0.5) continue;
        let da = Math.abs(Math.atan2(mb.y - p.y, mb.x - p.x) - a); if (da > Math.PI) da = 2 * Math.PI - da;
        if (da < 1.1 || d < 0.6) this.hurtMob(mb, dmg * (0.85 + rnd() * 0.3), p, cx, sy);
      }
    }

    onUse(p, m) {
      const it = items[m.item]; if (!it || !(p.inv[m.item] > 0)) return;
      if (it.food) {
        if (p.hp >= p.maxhp) return this.toast(p, 'You are at full health');
        if (this.clock - p.le < 0.8) return;
        p.le = this.clock; this.take(p, m.item, 1); p.hp = Math.min(p.maxhp, p.hp + it.food);
        this.near(p.x, p.y, { t: 'fx', k: 'dmg', x: r2(p.x), y: r2(p.y), n: '+' + it.food, c: '#6f6' });
        return;
      }
      if (!it.place && !it.floor) return;
      const t = this.tileOk(p, m); if (!t) return;
      const err = this.canEdit(p, t.x, t.y); if (err) return this.toast(p, err);
      const g = this.g[t.i], o = this.o[t.i];
      if (it.floor) {
        if (g === it.floor) {       // toggle: pick the floor back up
          const base = this.gen(t.x, t.y)[0];
          if (!grounds[base].walk && (o || this.anyoneAt(t.x, t.y))) return;
          this.setTile(t.i, grounds[base].floor ? G.GRASS : base, o); this.give(p, m.item, 1); return;
        }
        if (o || grounds[g].floor) return;
        this.take(p, m.item, 1); this.setTile(t.i, it.floor, o);
        return;
      }
      const od = objs[O[it.place]];
      if (o || !grounds[g].walk) return;
      if (od.on && !od.on.includes(g)) return this.toast(p, `${it.n} must be planted on grass`);
      if (od.solid && this.anyoneAt(t.x, t.y)) return;
      if (it.place === 'flag') {
        let mine = 0;
        for (const [i, c] of this.claims) {
          if (c.owner === p.token) mine++;
          else if (Math.abs(i % W - t.x) <= D.CLAIM_R * 2 && Math.abs(((i / W) | 0) - t.y) <= D.CLAIM_R * 2) return this.toast(p, 'Too close to another claim');
        }
        if (mine >= 3) return this.toast(p, 'You can only have 3 claim flags');
        this.claims.set(t.i, { owner: p.token, name: p.name }); this.all({ t: 'claim', i: t.i, name: p.name });
        this.toast(p, 'Land claimed! Only you can build here.');
      }
      if (it.place === 'bed') { p.bed = t.i; this.toast(p, 'Respawn point set'); }
      this.take(p, m.item, 1); this.setTile(t.i, g, od.id);
    }
    anyoneAt(x, y) {
      for (const q of this.players.values()) if (Math.abs(q.x - x - 0.5) < 0.5 + D.PR && Math.abs(q.y - y - 0.5) < 0.5 + D.PR) return true;
      return false;
    }

    onCraft(p, m) {
      const r = D.recipes[m.r | 0]; if (!r) return;
      const n = Math.max(1, Math.min(50, m.n | 0));
      if (r.st && !this.nearStation(p, r.st)) return this.toast(p, `You need to be near a ${items[r.st].n}`);
      for (const k in r.in) if ((p.inv[k] || 0) < r.in[k] * n) return this.toast(p, 'Not enough materials');
      for (const k in r.in) this.take(p, k, r.in[k] * n);
      this.give(p, r.out, r.n * n);
      p.send({ t: 'crafted' });
    }

    onTrade(p, m) {
      if (dist(p.x, p.y, CX + 3.5, CY - 1.5) > 6) return this.toast(p, 'Visit the trader in town');
      const n = Math.max(1, Math.min(999, m.n | 0)), it = items[m.item]; if (!it) return;
      if (m.t === 'buy') {
        const price = D.shop[m.item]; if (!price) return;
        if (p.coins < price * n) return this.toast(p, 'Not enough coins');
        p.coins -= price * n; this.give(p, m.item, n);
      } else {
        const have = Math.min(n, p.inv[m.item] || 0); if (!have || !it.v) return;
        this.take(p, m.item, have); p.coins += it.v * have;
      }
      p.send({ t: 'traded' });
    }

    // ---------- combat ----------
    spawnMob(k, x, y, lvl, hpMul) {
      const d = MOBS[k], s = 1 + 0.25 * lvl;
      const mb = { id: this.nextId++, k, x, y, lvl, mhp: Math.round(d.hp * s * (hpMul || 1)), dmg: d.dmg * (1 + 0.18 * lvl), target: 0, cd: 0, wt: 0, wx: 0, wy: 0, f: 1, by: {} };
      mb.hp = mb.mhp; this.mobs.set(mb.id, mb); return mb;
    }
    hurtMob(mb, dmg, p, kx, ky) {
      dmg = Math.max(1, Math.round(dmg));
      mb.hp -= dmg; mb.target = p.id; mb.by[p.id] = (mb.by[p.id] || 0) + dmg; mb.flee = 4;
      const d = MOBS[mb.k];
      if (!d.boss) this.moveMob(mb, kx * 0.5, ky * 0.5);
      this.near(mb.x, mb.y, { t: 'fx', k: 'dmg', x: r2(mb.x), y: r2(mb.y), n: dmg, c: '#fff', m: mb.id });
      if (mb.hp > 0) return;
      this.mobs.delete(mb.id);
      this.near(mb.x, mb.y, { t: 'fx', k: 'die', x: r2(mb.x), y: r2(mb.y), mk: mb.k });
      const s = 1 + 0.25 * mb.lvl;
      for (const id in mb.by) {
        const q = this.players.get(+id); if (!q) continue;
        for (const [it, a, b, ch] of d.drops) if (rnd() <= ch) this.give(q, it, ri(a, b));
        q.coins += Math.round(ri(d.coins[0], d.coins[1]) * s);
        this.addXp(q, 'combat', d.xp * s);
        this.questProg(q, 'k', mb.k, 1);
      }
      if (d.boss) { this.sys(`👑 The ${d.n} has been defeated by ${Object.keys(mb.by).map(id => (this.players.get(+id) || {}).name).filter(Boolean).join(', ')}!`); this.endEvent(); }
    }
    hurtPlayer(p, dmg, by) {
      dmg = Math.max(1, Math.round(dmg * (1 - D.ARMOR[Math.min(4, D.best(p.inv, 'armor'))])));
      p.hp -= dmg; p.hurtAt = this.clock;
      this.near(p.x, p.y, { t: 'fx', k: 'dmg', x: r2(p.x), y: r2(p.y), n: dmg, c: '#f55', p: p.id });
      if (p.hp > 0) return;
      p.hp = 0; p.dead = true;
      const lost = Math.floor(p.coins * 0.2); p.coins -= lost;
      p.send({ t: 'dead', by, lost });
      this.sys(`💀 ${p.name} was slain by a ${by}`);
    }
    respawn(p) {
      p.dead = false; p.hp = p.maxhp; p.x = CX + 0.5; p.y = CY + 2.5; p.mb = 3;
      if (p.bed != null && this.o[p.bed] === O.bed) {
        const bx = p.bed % W, by = (p.bed / W) | 0;
        for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) if (!D.solid(this, bx + dx, by + dy)) { p.x = bx + dx + 0.5; p.y = by + dy + 0.5; break; }
      }
      p.send({ t: 'alive', x: p.x, y: p.y });
    }
    moveMob(mb, dx, dy) {
      const r = 0.3, safe = (x, y) => dist(x, y, CX + 0.5, CY + 0.5) < D.SAFE_R;
      let nx = mb.x + dx, ny = mb.y + dy, moved = false;
      if (!D.blockedAt(this, nx, mb.y, r, true) && !safe(nx, mb.y)) { mb.x = nx; moved = true; }
      if (!D.blockedAt(this, mb.x, ny, r, true) && !safe(mb.x, ny)) { mb.y = ny; moved = true; }
      if (dx) mb.f = dx < 0 ? -1 : 1;
      return moved;
    }
    tickMobs(dt) {
      for (const mb of this.mobs.values()) {
        const d = MOBS[mb.k];
        mb.cd -= dt;
        let tg = mb.target && this.players.get(mb.target);
        const okT = q => q && !q.dead && dist(q.x, q.y, CX + 0.5, CY + 0.5) > D.SAFE_R;
        if (tg && (!okT(tg) || dist(tg.x, tg.y, mb.x, mb.y) > 16)) { tg = null; mb.target = 0; }
        if (!tg && d.aggro) {
          let bd = d.aggro;
          for (const q of this.players.values()) { const dd = dist(q.x, q.y, mb.x, mb.y); if (dd < bd && okT(q)) { bd = dd; tg = q; } }
          if (tg) mb.target = tg.id;
        }
        if (tg && d.passive) {
          mb.flee -= dt; if (mb.flee <= 0) { mb.target = 0; continue; }
          const a = Math.atan2(mb.y - tg.y, mb.x - tg.x);
          this.moveMob(mb, Math.cos(a) * d.spd * dt, Math.sin(a) * d.spd * dt);
        } else if (tg) {
          const dd = dist(tg.x, tg.y, mb.x, mb.y), reach = 0.55 + 0.4 * (d.size || 1);
          if (dd > reach * 0.8) {
            const a = Math.atan2(tg.y - mb.y, tg.x - mb.x);
            this.moveMob(mb, Math.cos(a) * d.spd * dt, Math.sin(a) * d.spd * dt);
          }
          if (dd < reach && mb.cd <= 0) { mb.cd = 1; this.hurtPlayer(tg, mb.dmg * (0.85 + rnd() * 0.3), d.n); }
        } else {
          mb.wt -= dt;
          if (mb.wt <= 0) {
            mb.wt = 1 + rnd() * 3;
            if (rnd() < 0.45) mb.wx = mb.wy = 0; else { const a = rnd() * 6.283; mb.wx = Math.cos(a); mb.wy = Math.sin(a); }
          }
          if (mb.wx || mb.wy) this.moveMob(mb, mb.wx * d.spd * 0.35 * dt, mb.wy * d.spd * 0.35 * dt);
        }
      }
    }
    spawnTick() {
      const night = D.darkness(this.clock) > 0.5;
      if (this.mobs.size > 500) return;
      for (const p of this.players.values()) {
        if (p.dead) continue;
        let cnt = 0;
        for (const mb of this.mobs.values()) if (Math.abs(mb.x - p.x) < 26 && Math.abs(mb.y - p.y) < 26) cnt++;
        if (cnt >= (night ? 13 : 9)) continue;
        const a = rnd() * 6.283, r = 13 + rnd() * 9, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
        const tx = Math.floor(x), ty = Math.floor(y);
        if (D.blockedAt(this, x, y, 0.3, true) || this.o[ty * W + tx]) continue;
        const dc = dist(x, y, CX, CY);
        if (dc < D.SAFE_R + 5 || this.inClaim(tx, ty)) continue;
        let close = false;
        for (const q of this.players.values()) if (dist(q.x, q.y, x, y) < 10) close = true;
        if (close) continue;
        const g = this.g[ty * W + tx], c = rnd();
        let k = null;
        if (g === G.GRASS) k = night ? (c < 0.45 ? 'slime' : 'skeleton') : (c < 0.55 ? 'slime' : c < 0.9 ? 'chicken' : 'boar');
        else if (g === G.FOREST) k = night ? (c < 0.6 ? 'skeleton' : 'wolf') : (c < 0.45 ? 'boar' : c < 0.75 ? 'slime' : 'chicken');
        else if (g === G.SNOW) k = night && c < 0.3 ? 'skeleton' : 'wolf';
        else if (g === G.SAND) k = dc > 45 && (night || c < 0.5) ? 'scorpion' : null;
        else if (g === G.STONE) k = c < 0.5 ? 'golem' : 'skeleton';
        else if (night) k = 'skeleton';
        if (!k) continue;
        this.spawnMob(k, x, y, Math.min(8, Math.floor(dc / 35)) + (night && !MOBS[k].passive ? 1 : 0));
      }
      for (const mb of this.mobs.values()) {
        if (MOBS[mb.k].event) continue;
        let near = false;
        for (const p of this.players.values()) if (Math.abs(mb.x - p.x) < 36 && Math.abs(mb.y - p.y) < 36) { near = true; break; }
        if (!near) this.mobs.delete(mb.id);
      }
    }

    // ---------- world events ----------
    evPub() { const e = this.event; return { kind: e.kind, x: e.x, y: e.y, left: Math.round(e.until - this.clock) }; }
    startEvent() {
      let x, y, ok = false;
      for (let n = 0; n < 300 && !ok; n++) {
        const a = rnd() * 6.283, r = 35 + rnd() * 80;
        x = Math.floor(CX + Math.cos(a) * r); y = Math.floor(CY + Math.sin(a) * r);
        ok = !D.solid(this, x, y) && !this.inClaim(x, y);
      }
      if (!ok) return;
      const kind = this.evKind++ % 2 ? 'boss' : 'meteor';
      this.event = { kind, x, y, until: this.clock + 300 };
      const lvl = Math.min(8, Math.floor(dist(x, y, CX, CY) / 35));
      if (kind === 'meteor') {
        let placed = 0;
        for (let n = 0; n < 60 && placed < 7; n++) {
          const tx = x + ri(-3, 3), ty = y + ri(-3, 3), i = ty * W + tx;
          if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1 || (tx === x && ty === y)) continue;
          if (!grounds[this.g[i]].walk || objs[this.o[i]].built || objs[this.o[i]].fixed || this.inClaim(tx, ty) || this.anyoneAt(tx, ty)) continue;
          this.setTile(i, this.g[i], O.star_ore); placed++;
        }
        for (let n = 0; n < 3; n++) this.spawnMob('wraith', x + 0.5 + rnd() - 0.5, y + 0.5 + rnd() - 0.5, lvl);
        this.sys(`☄️ A meteor has crashed! Starmetal awaits the brave. Follow the marker on your map.`);
      } else {
        this.spawnMob('king', x + 0.5, y + 0.5, lvl, 1 + 0.35 * (this.players.size - 1));
        this.sys(`👑 The Slime King has appeared! Team up and take it down. Follow the marker on your map.`);
      }
      this.all({ t: 'event', ev: this.evPub() });
    }
    endEvent() {
      if (!this.event) return;
      for (const mb of this.mobs.values()) if (MOBS[mb.k].event && !Object.keys(mb.by).length) this.mobs.delete(mb.id);
      this.event = null; this.all({ t: 'event', ev: null });
    }

    // ---------- main tick ----------
    tick(dt) {
      this.clock += dt;
      for (const p of this.players.values()) p.mb = Math.min(3, p.mb + D.SPEED * 1.6 * dt);
      this.tickMobs(dt);
      this.t1 += dt; this.tSpawn += dt;
      if (this.tSpawn >= 0.5) { this.tSpawn = 0; this.spawnTick(); }
      if (this.t1 >= 1) {
        this.t1 = 0;
        for (const p of this.players.values()) {
          if (p.dead || p.hp >= p.maxhp || this.clock - p.hurtAt < 6) continue;
          p.hp = Math.min(p.maxhp, p.hp + (dist(p.x, p.y, CX, CY) < D.SAFE_R ? 12 : 2));
        }
        this.tickTimers();
        if (this.players.size && this.clock >= this.nextEvent) { this.nextEvent = this.clock + 330; this.endEvent(); this.startEvent(); }
        if (this.event && this.clock > this.event.until) {
          if (this.event.kind === 'boss') this.sys('The Slime King slinks back into the wild...');
          for (const mb of this.mobs.values()) mb.by = MOBS[mb.k].event ? {} : mb.by;
          this.endEvent();
        }
      }
      this.snapshot();
    }
    tickTimers() {
      const keep = [];
      for (const t of this.timers) {
        if (t.at > this.clock) { keep.push(t); continue; }
        const x = t.i % W, y = (t.i / W) | 0;
        if (this.o[t.i] !== t.from) continue;
        if (t.re) {
          if (grounds[this.g[t.i]].floor || this.inClaim(x, y)) continue;
          let near = false;
          for (const p of this.players.values()) if (Math.abs(p.x - x) < 4 && Math.abs(p.y - y) < 4) near = true;
          if (near) { t.at = this.clock + 20; keep.push(t); continue; }
        }
        this.setTile(t.i, this.g[t.i], t.to);
      }
      this.timers = keep;
    }
    snapshot() {
      for (const p of this.players.values()) {
        const ps = [], ms = [];
        for (const q of this.players.values()) {
          if (q.dead || Math.abs(q.x - p.x) > 24 || Math.abs(q.y - p.y) > 24) continue;
          ps.push([q.id, r2(q.x), r2(q.y), q.f, Math.ceil(q.hp), q.maxhp, q.sw, q.sa, D.best(q.inv, 'armor')]);
        }
        for (const mb of this.mobs.values()) {
          if (Math.abs(mb.x - p.x) > 24 || Math.abs(mb.y - p.y) > 24) continue;
          ms.push([mb.id, mb.k, r2(mb.x), r2(mb.y), mb.hp, mb.mhp, mb.lvl, mb.f]);
        }
        p.send({ t: 's', p: ps, m: ms, c: r2(this.clock), me: [Math.ceil(p.hp), p.maxhp, p.coins] });
      }
    }
  }
  return Game;
});
