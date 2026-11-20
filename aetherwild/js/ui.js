'use strict';
// ============================================================================
//  AETHERWILD — HUD, inventory, crafting, build menu, minimap, icons
// ============================================================================
(function () {
  const G = window.G;
  const $ = s => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  // ---------------------------------------------------------------- 3D icons
  // Icons are rendered from the same models/materials as the world, so the
  // inventory art is exactly as detailed as the in-game objects.
  G.Icons = {
    cache: {},
    init() {
      const r = this.r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.setSize(128, 128); r.setPixelRatio(1); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      const s = this.scene = new THREE.Scene();
      s.add(new THREE.HemisphereLight(0xe8f4ff, 0x4a4a3a, 1.0));
      const d = new THREE.DirectionalLight(0xfff4e6, 2.0); d.position.set(2, 4, 3); s.add(d);
      const d2 = new THREE.DirectionalLight(0x9fd6ff, 0.5); d2.position.set(-3, 1, -2); s.add(d2);
      this.cam = new THREE.PerspectiveCamera(28, 1, 0.01, 200);
    },
    render(obj, dir) {
      this.scene.add(obj);
      const box = new THREE.Box3().setFromObject(obj), sph = box.getBoundingSphere(new THREE.Sphere());
      const D = (dir || new THREE.Vector3(1, 0.85, 1.5)).normalize();
      const dist = sph.radius / Math.sin(THREE.MathUtils.degToRad(14)) * 1.02;
      this.cam.position.copy(sph.center).addScaledVector(D, dist); this.cam.lookAt(sph.center);
      this.r.render(this.scene, this.cam);
      const url = this.r.domElement.toDataURL();
      this.scene.remove(obj);
      return url;
    },
    item(id) {
      if (!this.cache[id]) {
        const it = G.ITEMS[id]; let g;
        if (it.type === 'place') g = G.Models.place(id); else g = G.Models.item(id);
        if (it.type === 'tool') g.rotation.z = -0.75;
        const w = new THREE.Group(); w.add(g);
        this.cache[id] = this.render(w, it.type === 'tool' ? new THREE.Vector3(0.25, 0.35, 1) : null);
      }
      return this.cache[id];
    },
    piece(kind, tier) {
      const k = kind + tier;
      if (!this.cache[k]) {
        const g = G.Models.piece(kind, tier);
        if (kind === 'foundation') { const sk = g.getObjectByName('skirt'); if (sk) sk.scale.y = 0.6; }
        this.cache[k] = this.render(g, new THREE.Vector3(1.1, 0.9, 1.6));
      }
      return this.cache[k];
    },
  };

  const U = G.UI = {
    open: null, container: null, station: null, cursor: null,
    init() {
      G.Icons.init();
      this.buildHotbar(); this.buildInventory(); this.buildBuildMenu();
      this.mini = $('#minimap'); this.mctx = this.mini.getContext('2d'); this.sizeMinimap();
      $('#inv-close').onclick = () => { this.closeAll(); G.Input.lock(); };
      $('#build-close').onclick = () => { this.closeAll(); G.Input.lock(); };
      for (const id of ['hp', 'food', 'water', 'stam']) { const c = $('#r-' + id); c._len = 2 * Math.PI * +c.getAttribute('r'); c.style.strokeDasharray = c._len; }
      G.inv.listeners.push(() => { this.refreshHotbar(); if (this.open === 'inv') this.refreshInventory(); });
      document.addEventListener('mousemove', e => { if (this.heldEl) { this.heldEl.style.left = e.clientX + 'px'; this.heldEl.style.top = e.clientY + 'px'; } this.moveTip(e); });
      document.addEventListener('contextmenu', e => e.preventDefault());
      this.toastBox = $('#toasts');
    },
    costText(cost) { return Object.keys(cost).map(k => cost[k] + ' ' + G.ITEMS[k].name).join(', '); },
    toast(msg, icon, kind) {
      const t = el('div', 'toast ' + (kind || ''));
      if (icon) { const im = el('img'); im.src = G.Icons.item(icon); t.appendChild(im); }
      t.appendChild(el('span', '', msg));
      this.toastBox.appendChild(t);
      while (this.toastBox.children.length > 6) this.toastBox.firstChild.remove();
      setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3100);
    },
    flash(c) { const f = $('#flash'); f.style.background = 'radial-gradient(ellipse at center, transparent 45%, ' + c + ' 140%)'; f.style.opacity = 1; clearTimeout(this._ft); this._ft = setTimeout(() => f.style.opacity = 0, 140); },

    // -------------------------------------------------------------- slots
    slotEl(inv, idx, cls) {
      const s = el('div', 'slot ' + (cls || ''));
      s.dataset.idx = idx; s._inv = inv;
      s.addEventListener('mousedown', e => this.slotClick(e, inv, idx));
      s.addEventListener('mouseenter', () => { this.tipFor = inv.slots[idx]; this.showTip(); });
      s.addEventListener('mouseleave', () => { this.tipFor = null; this.showTip(); });
      return s;
    },
    paintSlot(s, st) {
      s.innerHTML = '';
      if (!st) { s.classList.remove('full'); return; }
      s.classList.add('full');
      const it = G.ITEMS[st.id];
      const im = el('img'); im.src = G.Icons.item(st.id); im.draggable = false; s.appendChild(im);
      if (st.n > 1) s.appendChild(el('div', 'cnt', st.n));
      if (it.dur && st.d !== undefined) { const b = el('div', 'dur'); const f = el('i'); f.style.width = (100 * st.d / it.dur) + '%'; f.style.background = st.d / it.dur < 0.25 ? '#ff6a4f' : '#6ff5c8'; b.appendChild(f); s.appendChild(b); }
    },
    buildHotbar() {
      const hb = $('#hotbar'); this.hotSlots = [];
      for (let i = 0; i < 8; i++) { const s = el('div', 'slot hot'); s.appendChild(el('div', 'key', i + 1)); hb.appendChild(s); this.hotSlots.push(s); }
    },
    refreshHotbar() {
      for (let i = 0; i < 8; i++) {
        const s = this.hotSlots[i]; const k = s.querySelector('.key');
        this.paintSlot(s, G.inv.slots[i]); s.appendChild(k);
        s.classList.toggle('sel', i === G.Player.sel);
      }
      const h = G.inv.slots[G.Player.sel];
      $('#held-name').textContent = h ? G.ITEMS[h.id].name : '';
    },
    buildInventory() {
      const g = $('#inv-grid'); this.invSlots = [];
      for (let i = 0; i < G.inv.slots.length; i++) { const s = this.slotEl(G.inv, i, i < 8 ? 'hotrow' : ''); g.appendChild(s); this.invSlots.push(s); }
      $('#tab-craft').onclick = () => this.showSide('craft');
      $('#tab-chest').onclick = () => this.showSide('chest');
    },
    refreshInventory() {
      G.inv.slots.forEach((st, i) => this.paintSlot(this.invSlots[i], st));
      if (this.container) this.container.store.slots.forEach((st, i) => this.paintSlot(this.chestSlots[i], st));
      if (this.side === 'craft') this.refreshCraft();
      this.showTip();
    },
    openInventory(container, station) {
      if (this.open) this.closeAll();
      this.open = 'inv'; this.container = container || null; this.station = station || null;
      $('#inv-screen').classList.remove('hidden');
      const cg = $('#chest-grid'); cg.innerHTML = ''; this.chestSlots = [];
      if (container) {
        $('#tab-chest').classList.remove('hidden'); $('#tab-chest').textContent = container.type === 'backpack' ? 'Lost Backpack' : 'Storage Chest';
        container.store.slots.forEach((st, i) => { const s = this.slotEl(container.store, i); cg.appendChild(s); this.chestSlots.push(s); });
        this.showSide('chest');
        if (!container._l) { container._l = () => { if (this.open === 'inv' && this.container === container) this.refreshInventory(); }; container.store.listeners.push(container._l); }
      } else { $('#tab-chest').classList.add('hidden'); this.showSide('craft'); }
      this.refreshInventory();
      G.Input.unlock();
    },
    showSide(which) {
      this.side = which;
      $('#tab-craft').classList.toggle('on', which === 'craft'); $('#tab-chest').classList.toggle('on', which === 'chest');
      $('#craft-list').classList.toggle('hidden', which !== 'craft'); $('#chest-wrap').classList.toggle('hidden', which !== 'chest');
      if (which === 'craft') this.refreshCraft();
    },
    closeAll() {
      if (this.cursor) { const left = G.inv.add(this.cursor.id, this.cursor.n, this.cursor.d); if (left > 0 && this.container) this.container.store.add(this.cursor.id, left, this.cursor.d); this.cursor = null; this.paintHeld(); }
      if (this.container && this.container.type === 'backpack' && this.container.store.isEmpty()) G.Build.removePlaceable(this.container);
      this.open = null; this.container = null; this.station = null;
      $('#inv-screen').classList.add('hidden'); $('#build-screen').classList.add('hidden');
      this.tipFor = null; this.showTip();
    },
    slotClick(e, inv, idx) {
      e.preventDefault();
      const st = inv.slots[idx]; const cur = this.cursor;
      if (e.shiftKey && st && !cur) { // quick move
        let dest = inv === G.inv ? (this.container ? this.container.store : null) : G.inv;
        if (!dest) { // move between hotbar and backpack
          const range = idx < 8 ? [8, inv.slots.length] : [0, 8];
          for (let i = range[0]; i < range[1]; i++) if (!inv.slots[i]) { inv.slots[i] = st; inv.slots[idx] = null; break; }
          inv.changed(); return;
        }
        const left = dest.add(st.id, st.n, st.d);
        if (left <= 0) inv.slots[idx] = null; else st.n = left;
        inv.changed(); dest.changed(); G.Audio.play('ui'); return;
      }
      const stackable = s => G.ITEMS[s.id].stack > 1;
      if (e.button === 2) {
        if (!cur && st) { const h = Math.ceil(st.n / 2); this.cursor = Object.assign({}, st, { n: h }); st.n -= h; if (st.n <= 0) inv.slots[idx] = null; }
        else if (cur) {
          if (!st) { inv.slots[idx] = Object.assign({}, cur, { n: 1 }); cur.n--; }
          else if (st.id === cur.id && stackable(st) && st.n < G.ITEMS[st.id].stack) { st.n++; cur.n--; }
          if (cur.n <= 0) this.cursor = null;
        }
      } else {
        if (!cur && st) { this.cursor = st; inv.slots[idx] = null; }
        else if (cur) {
          if (!st) { inv.slots[idx] = cur; this.cursor = null; }
          else if (st.id === cur.id && stackable(st)) { const k = Math.min(cur.n, G.ITEMS[st.id].stack - st.n); st.n += k; cur.n -= k; if (cur.n <= 0) this.cursor = null; }
          else { inv.slots[idx] = cur; this.cursor = st; }
        }
      }
      G.Audio.play('ui');
      this.paintHeld(); inv.changed(); if (inv !== G.inv) G.inv.changed();
      this.heldEl && (this.heldEl.style.left = e.clientX + 'px', this.heldEl.style.top = e.clientY + 'px');
    },
    paintHeld() {
      if (!this.heldEl) { this.heldEl = el('div', 'slot held'); document.body.appendChild(this.heldEl); }
      this.paintSlot(this.heldEl, this.cursor); this.heldEl.style.display = this.cursor ? 'block' : 'none';
    },
    showTip() {
      const t = $('#tooltip'); const st = this.tipFor;
      if (!st || this.cursor) { t.classList.add('hidden'); return; }
      const it = G.ITEMS[st.id];
      let h = '<b>' + it.name + '</b><p>' + it.desc + '</p>';
      if (it.type === 'tool' && it !== G.HAND) {
        h += '<div class="tstats"><span>Damage ' + it.dmg + '</span>' + (it.torpor ? '<span>Torpor ' + it.torpor + '</span>' : '') + (it.dur ? '<span>Durability ' + Math.ceil(st.d) + '/' + it.dur + '</span>' : '') + '</div>';
      }
      if (it.type === 'food') h += '<div class="tstats">' + (it.food ? '<span>Food +' + it.food + '</span>' : '') + (it.heal ? '<span>Heal +' + it.heal + '</span>' : '') + '</div><em>Select on hotbar and click to use</em>';
      if (it.type === 'place') h += '<em>Select on hotbar to place</em>';
      t.innerHTML = h; t.classList.remove('hidden');
    },
    moveTip(e) { const t = $('#tooltip'); t.style.left = Math.min(window.innerWidth - 270, e.clientX + 18) + 'px'; t.style.top = Math.min(window.innerHeight - 140, e.clientY + 12) + 'px'; },

    // -------------------------------------------------------------- crafting
    stationsNear() {
      const s = {};
      for (const k in G.STATIONS) s[k] = !!G.Build.nearStation(k, G.Player.pos, 6);
      return s;
    },
    refreshCraft() {
      const box = $('#craft-list'); box.innerHTML = '';
      const near = this.stationsNear();
      const groups = [[null, 'Handcraft'], ['campfire', 'Campfire'], ['workbench', 'Workbench'], ['furnace', 'Furnace'], ['forge', 'Aether Forge']];
      for (const [st, label] of groups) {
        const rs = G.RECIPES.filter(r => (r.station || null) === st);
        const ok = !st || near[st];
        const head = el('div', 'craft-head' + (ok ? '' : ' locked'), label + (st ? (ok ? ' <i>nearby</i>' : ' <i>stand near one to use</i>') : ''));
        box.appendChild(head);
        for (const r of rs) {
          const it = G.ITEMS[r.out];
          const can = ok && G.inv.has(r.cost);
          const row = el('div', 'recipe' + (can ? ' can' : '') + (ok ? '' : ' locked'));
          const im = el('img'); im.src = G.Icons.item(r.out); row.appendChild(im);
          const mid = el('div', 'rmid');
          mid.appendChild(el('div', 'rname', it.name));
          const costs = el('div', 'rcost');
          for (const k in r.cost) { const have = G.inv.count(k); const c = el('span', have >= r.cost[k] ? 'ok' : 'no'); c.innerHTML = '<img src="' + G.Icons.item(k) + '">' + Math.min(have, 999) + '/' + r.cost[k]; c.title = G.ITEMS[k].name; costs.appendChild(c); }
          mid.appendChild(costs); row.appendChild(mid);
          const b = el('button', 'craft-btn', 'Craft'); b.disabled = !can;
          b.onclick = e => { this.craft(r, e.shiftKey ? 5 : 1); };
          row.appendChild(b);
          row.addEventListener('mouseenter', () => { this.tipFor = { id: r.out, n: 1, d: it.dur }; this.showTip(); });
          row.addEventListener('mouseleave', () => { this.tipFor = null; this.showTip(); });
          box.appendChild(row);
        }
      }
      const hint = el('div', 'craft-hint', 'Shift-click Craft to make 5. Shift-click items to quick-move. Right-click splits a stack.');
      box.appendChild(hint);
    },
    craft(r, n) {
      let made = 0;
      for (let i = 0; i < n; i++) {
        if (r.station && !G.Build.nearStation(r.station, G.Player.pos, 6)) break;
        if (!G.inv.has(r.cost) || !G.inv.canAdd(r.out, 1)) break;
        G.inv.pay(r.cost); G.inv.add(r.out, 1); made++;
      }
      if (made) { G.stats.crafted[r.out] = true; G.Audio.play('craft'); this.toast('Crafted ' + (made > 1 ? made + 'x ' : '') + G.ITEMS[r.out].name, r.out); }
      this.refreshInventory();
    },

    // -------------------------------------------------------------- build menu
    buildBuildMenu() {
      this.tier = 0;
      const tiers = $('#tier-row');
      G.TIERS.forEach((t, i) => {
        const b = el('button', 'tier', '<i style="background:' + t.color + '"></i>' + t.name);
        b.onclick = () => { this.tier = i; this.refreshBuildMenu(); G.Audio.play('ui'); };
        tiers.appendChild(b);
      });
    },
    openBuild() {
      if (this.open) this.closeAll();
      this.open = 'build'; $('#build-screen').classList.remove('hidden'); this.refreshBuildMenu(); G.Input.unlock();
    },
    refreshBuildMenu() {
      [...$('#tier-row').children].forEach((b, i) => b.classList.toggle('on', i === this.tier));
      const g = $('#piece-grid'); g.innerHTML = '';
      for (const kind in G.PIECES) {
        const cost = G.pieceCost(kind, this.tier), can = G.inv.has(cost);
        const c = el('div', 'piece' + (can ? ' can' : ''));
        const im = el('img'); im.src = G.Icons.piece(kind, this.tier); c.appendChild(im);
        c.appendChild(el('div', 'pname', G.PIECES[kind].name));
        const cc = el('div', 'rcost');
        for (const k in cost) { const have = G.inv.count(k); cc.appendChild(el('span', have >= cost[k] ? 'ok' : 'no', '<img src="' + G.Icons.item(k) + '">' + cost[k])); }
        c.appendChild(cc);
        c.onclick = () => { G.Build.startBuild(kind, this.tier); this.closeAll(); G.Input.lock(); G.Audio.play('ui'); };
        g.appendChild(c);
      }
    },

    // -------------------------------------------------------------- HUD
    update(dt) {
      const P = G.Player;
      const ring = (id, v) => { const c = $('#r-' + id); v = G.clamp(v, 0, 100); c.style.strokeDashoffset = c._len * (1 - v / 100); c.classList.toggle('low', v < 25); };
      ring('hp', P.hp); ring('food', P.food); ring('water', P.water); ring('stam', P.stamina);
      const hv = Math.ceil(Math.max(0, P.hp)); if (hv !== this._hv) { this._hv = hv; $('#v-hp').textContent = hv; }
      document.body.classList.toggle('ui-open', !!this.open || G.Input.paused || P.dead);
      $('#clock').textContent = G.World.clock() + (G.World.night > 0.5 ? '  ☾' : '  ☀');
      $('#underwater').style.opacity = G.camPos.y < G.WATER - 0.05 ? 1 : 0;
      // focus prompt + target panel
      const f = P.focus; let prompt = '', target = null;
      const B = G.Build;
      if (B.mode) {
        const c = B.cand, cost = G.pieceCost(B.mode.kind, B.mode.tier);
        $('#buildhud').classList.remove('hidden');
        $('#buildhud').innerHTML = '<b>' + G.TIERS[B.mode.tier].name + ' ' + G.PIECES[B.mode.kind].name + '</b> &nbsp;' + this.costText(cost) +
          '<div class="keys"><span>LMB</span> place <span>R</span> rotate <span>B</span> menu <span>RMB</span>/<span>Esc</span> exit <span>U</span> upgrade <span>X</span> demolish</div>' +
          (c && !c.valid && (c.reason || c.hint) ? '<div class="bad">' + (c.reason || c.hint) + '</div>' : '');
      } else if (B.placeItem) {
        const c = B.cand;
        $('#buildhud').classList.remove('hidden');
        $('#buildhud').innerHTML = '<b>Place ' + G.ITEMS[B.placeItem].name + '</b><div class="keys"><span>LMB</span> place <span>R</span> rotate</div>' + (c && !c.valid && (c.reason || c.hint) ? '<div class="bad">' + (c.reason || c.hint) + '</div>' : '');
      } else $('#buildhud').classList.add('hidden');
      if (f && !P.mount) {
        if (f.kind === 'creature') {
          const c = f.obj; target = c;
          if (f.t < 4.5) {
            const [food, msg] = c.canFeed();
            if (food) prompt = '<span>E</span> ' + msg;
            if (c.tamed) prompt += (prompt ? '&nbsp;&nbsp;' : '') + '<span>F</span> ' + (c.order === 'follow' ? 'Stay' : 'Follow') + (c.S.ride ? '&nbsp;&nbsp;<span>R</span> Ride' : '');
          }
        } else if (f.kind === 'node' && f.t < 4) {
          const T = G.NODES[f.obj.type]; target = { node: f.obj };
          const pow = P.tool().gather[f.obj.type] || 0;
          prompt = pow > 0 ? '<span>LMB</span> Gather ' + G.ITEMS[T.res].name : '<i class="bad">Requires ' + T.need + '</i>';
        } else if (f.kind === 'piece' && f.t < 5) {
          const p = f.obj; target = { piece: p };
          const parts = [];
          if (p.kind === 'door' || (p.kind === 'doorway' && p.door)) parts.push('<span>E</span> ' + ((p.door || p).open ? 'Close' : 'Open'));
          if (p.tier < 4) parts.push('<span>U</span> Upgrade → ' + G.TIERS[p.tier + 1].name + ' (' + this.costText(G.pieceCost(p.kind, p.tier + 1)) + ')');
          parts.push('<span>X</span> Demolish');
          prompt = parts.join('&nbsp;&nbsp;');
        } else if (f.kind === 'place' && f.t < 4.5) {
          const q = f.obj; target = { place: q };
          const verbs = { chest: 'Open', backpack: 'Recover items', bed: 'Set respawn', workbench: 'Use', campfire: 'Cook', furnace: 'Smelt', forge: 'Forge' };
          prompt = '<span>E</span> ' + (verbs[q.type] || 'Use') + (q.type !== 'backpack' ? '&nbsp;&nbsp;<span>X</span> Pick up' : '');
        } else if (f.kind === 'water') prompt = '<span>E</span> Drink';
      }
      if (P.mount) { prompt = '<span>R</span> Dismount &nbsp;<span>LMB</span> Attack/Gather &nbsp;<span>Shift</span> Sprint'; target = target || P.mount; }
      if (G.touch) prompt = prompt.replace(/<span>LMB<\/span>/g, '<span>ACT</span>').replace(/<span>Shift<\/span> Sprint/g, '');
      if (prompt !== this._prompt) { $('#prompt').innerHTML = prompt; this._prompt = prompt; }
      $('#crosshair').classList.toggle('on', !!(f && f.t < 4.5));
      this.updateTarget(target);
      // objective
      this.objT = (this.objT || 0) - dt;
      if (this.objT <= 0) {
        this.objT = 0.5;
        const obj = G.OBJECTIVES.find(o => { try { return !o.done(); } catch (e) { return true; } });
        const idx = obj ? G.OBJECTIVES.indexOf(obj) : G.OBJECTIVES.length;
        const txt = obj ? obj.text : 'All goals complete. You are the Aetherwild.';
        if (txt !== this._obj) { if (this._obj) { this.toast('Goal complete!', null, 'good'); G.Audio.play('tame'); } this._obj = txt; $('#obj-text').textContent = txt; $('#obj-n').textContent = 'GOAL ' + Math.min(idx + 1, G.OBJECTIVES.length) + '/' + G.OBJECTIVES.length; }
      }
      this.mapT = (this.mapT || 0) - dt; if (this.mapT <= 0) { this.mapT = 0.08; this.drawMinimap(); }
    },
    updateTarget(t) {
      const box = $('#target');
      if (!t) { box.classList.add('hidden'); return; }
      box.classList.remove('hidden');
      let name, hp, max, extra = '';
      if (t.node) { const n = t.node; name = G.NODES[n.type].name; hp = n.hp; max = n.maxHp; }
      else if (t.piece) { const p = t.piece; name = G.TIERS[p.tier].name + ' ' + G.PIECES[p.kind].name; hp = p.hp; max = p.maxHp; }
      else if (t.place) { name = G.ITEMS[t.place.type] ? G.ITEMS[t.place.type].name : 'Lost Backpack'; hp = 1; max = 1; }
      else {
        const c = t; name = c.name; hp = Math.max(0, c.hp); max = c.S.hp;
        const tag = c.dead ? 'Dead' : c.ko > 0 ? 'Unconscious' : c.tamed ? (c.order === 'follow' ? 'Following' : 'Staying') : { passive: 'Passive', shy: 'Shy', neutral: 'Neutral', aggressive: 'Aggressive' }[c.S.temper];
        extra = '<div class="tags"><span class="t-' + c.S.temper + (c.tamed ? ' t-tamed' : '') + '">' + tag + '</span><span>' + c.S.diet + '</span>' + (c.S.ride ? '<span>Rideable</span>' : '') + '</div>';
        if (!c.tamed && !c.dead) {
          if (c.S.tame === 'ko' && c.torpor > 0 && c.ko <= 0) extra += '<div class="sub">Torpor</div><div class="bar tor"><i style="width:' + (100 * Math.min(1, c.torpor / c.S.torpor)) + '%"></i></div>';
          if (c.tameProg > 0 || c.ko > 0) extra += '<div class="sub">Taming ' + c.tameProg + '/' + c.S.need + (c.ko > 0 ? ' · wakes in ' + Math.ceil(c.ko) + 's' : '') + '</div><div class="bar tame"><i style="width:' + (100 * c.tameProg / c.S.need) + '%"></i></div>';
          if (c.tameProg === 0 && c.ko <= 0) extra += '<div class="sub hint">' + c.S.hint + '</div>';
        }
      }
      const h = '<b>' + name + '</b><div class="bar hp"><i style="width:' + (100 * hp / max) + '%"></i></div>' + (t.piece ? '<div class="sub">' + Math.ceil(hp) + ' / ' + max + '</div>' : '') + extra;
      if (h !== this._tgt) { box.innerHTML = h; this._tgt = h; }
    },
    sizeMinimap() {
      const css = window.innerWidth < 760 ? 112 : 148, dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.mini.style.width = this.mini.style.height = css + 'px';
      this.mini.width = this.mini.height = Math.round(css * dpr);
    },
    drawMinimap() {
      const ctx = this.mctx, R = this.mini.width / 2, P = G.Player, s = R / 85;
      const px = P.pos.x, pz = P.pos.z;
      ctx.save(); ctx.clearRect(0, 0, R * 2, R * 2);
      ctx.beginPath(); ctx.arc(R, R, R - 2, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#1f5f86'; ctx.fillRect(0, 0, R * 2, R * 2);
      ctx.translate(R, R); ctx.rotate(P.yaw); ctx.scale(s, s);
      ctx.imageSmoothingEnabled = s * 600 / G.World.mapCanvas.width < 1.6;
      ctx.drawImage(G.World.mapCanvas, -300 - px, -300 - pz, 600, 600);
      ctx.fillStyle = 'rgba(240,230,210,0.9)';
      for (const p of G.Build.pieces) if (!p.edge && p.kind !== 'door') { const x = p.i * 3 - px, z = p.k * 3 - pz; if (x * x + z * z < 8000) ctx.fillRect(x, z, 3, 3); }
      ctx.fillStyle = 'rgba(60,45,30,0.9)';
      for (const p of G.Build.pieces) if (p.edge) { const x = p.i * 3 - px, z = p.k * 3 - pz; if (x * x + z * z < 8000) { if (p.edge === 'z') ctx.fillRect(x, z - 0.3, 3, 0.6); else ctx.fillRect(x - 0.3, z, 0.6, 3); } }
      for (const q of G.Build.placeables) {
        const x = q.x - px, z = q.z - pz; if (x * x + z * z > 8000) continue;
        ctx.fillStyle = q.type === 'backpack' ? '#4ff0e0' : q.type === 'bed' ? '#ffffff' : '#e0b060';
        ctx.beginPath(); ctx.arc(x, z, (q.type === 'backpack' ? 3 : 1.4), 0, 7); ctx.fill();
      }
      for (const c of G.Creatures.list) {
        if (c.dead) continue;
        const x = c.pos.x - px, z = c.pos.z - pz; if (x * x + z * z > 8000) continue;
        ctx.fillStyle = c.tamed ? '#6ff5c8' : c.S.temper === 'aggressive' ? '#ff4d3d' : c.S.temper === 'neutral' ? '#ffae3d' : '#f4f1a0';
        ctx.beginPath(); ctx.arc(x, z, 1.4 + c.r * 0.5, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.5; ctx.stroke();
      }
      if (P.bed) { const x = P.bed.x - px, z = P.bed.z - pz; ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, z - 1, 4, 2); }
      ctx.restore();
      // player arrow + ring + compass
      const k = R / 74;
      ctx.save(); ctx.translate(R, R); ctx.scale(k, k);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0b1218'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.rotate(P.yaw);
      ctx.fillStyle = '#ffd27a'; ctx.font = '700 11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]].forEach(([l, x, y]) => { ctx.save(); ctx.translate(x * (R / k - 11), y * (R / k - 11)); ctx.rotate(-P.yaw); ctx.fillText(l, 0, 0); ctx.restore(); });
      ctx.restore();
    },
    showDeath() {
      G.Input.unlock();
      $('#death').classList.remove('hidden');
    },
  };
})();
