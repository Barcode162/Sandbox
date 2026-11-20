'use strict';
// ============================================================================
//  AETHERWILD — saved worlds (each world = name + seed + its own save slot)
// ============================================================================
(function () {
  const G = window.G;
  const INDEX = 'aetherwild_worlds_v2', OLD = 'aetherwild_save_v1';
  const mem = {}; // fallback when storage is blocked (worlds last for this visit only)
  const store = {
    get(k) { try { const v = localStorage.getItem(k); return v === null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) { } },
  };
  G.store = store;

  const W = G.Worlds = {
    list() {
      let a = []; try { a = JSON.parse(store.get(INDEX) || '[]'); } catch (e) { }
      return a.sort((x, y) => (y.played || 0) - (x.played || 0));
    },
    write(a) { store.set(INDEX, JSON.stringify(a)); },
    get(id) { return this.list().find(w => w.id === id) || null; },
    create(name, seed) {
      const w = { id: 'w' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), name: name || 'New Island', seed: seed >>> 0, created: Date.now(), played: Date.now(), day: 1, goal: 0, tames: 0, fresh: true };
      const a = this.list(); a.push(w); this.write(a); return w;
    },
    update(w) { const a = this.list(); const i = a.findIndex(x => x.id === w.id); if (i >= 0) a[i] = Object.assign(a[i], w); else a.push(w); this.write(a); },
    remove(id) { this.write(this.list().filter(w => w.id !== id)); store.del('aetherwild_world_' + id); },
    data(id) { try { return JSON.parse(store.get('aetherwild_world_' + id) || 'null'); } catch (e) { return null; } },
    migrate() {
      const old = store.get(OLD);
      if (!old || this.list().length) return;
      const w = this.create('First Island', 16213); w.fresh = false;
      store.set('aetherwild_world_' + w.id, old); this.update(w); store.del(OLD);
    },
    seedFrom(text) {
      text = (text || '').trim(); if (!text) return Math.floor(Math.random() * 4e9);
      if (/^\d+$/.test(text)) return (+text) >>> 0;
      let h = 2166136261; for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0;
    },
  };

  G.save = function (quiet) {
    const w = G.current;
    if (!G.started || !w || G.Player.dead) return;
    const data = {
      v: 2, seed: w.seed, tod: G.World.tod, day: G.World.day, player: G.Player.serialize(), inv: G.inv.toJSON(), stats: G.stats,
      build: G.Build.serialize(), tames: G.Creatures.serialize(), tutorial: G.Tutorial.serialize(),
    };
    const ok = store.set('aetherwild_world_' + w.id, JSON.stringify(data));
    const goal = G.OBJECTIVES.findIndex(o => { try { return !o.done(); } catch (e) { return true; } });
    Object.assign(w, { played: Date.now(), day: G.World.day, goal: goal < 0 ? G.OBJECTIVES.length : goal, tames: data.tames.length, fresh: false });
    W.update(w);
    if (!quiet) G.UI.toast(ok ? 'Game saved' : 'Saved for this visit only (browser storage is blocked)', null, ok ? 'good' : 'warn');
  };
  G.loadSave = function (w) {
    const data = W.data(w.id); if (!data) return false;
    G.World.tod = data.tod; G.World.day = data.day || 1;
    G.Player.load(data.player); G.inv.load(data.inv);
    G.stats = Object.assign(G.newStats(), data.stats);
    G.Build.load(data.build); G.Creatures.load(data.tames);
    G.Tutorial.load(data.tutorial);
    return true;
  };
})();
