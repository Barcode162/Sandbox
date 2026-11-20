'use strict';
// ============================================================================
//  AETHERWILD — inventory containers
// ============================================================================
(function () {
  const G = window.G;
  class Inventory {
    constructor(n) { this.slots = new Array(n).fill(null); this.listeners = []; }
    changed() { for (const f of this.listeners) f(this); }
    count(id) { let c = 0; for (const s of this.slots) if (s && s.id === id) c += s.n; return c; }
    has(cost, mult) { mult = mult || 1; for (const k in cost) if (this.count(k) < cost[k] * mult) return false; return true; }
    canAdd(id, n) {
      const it = G.ITEMS[id]; let room = 0;
      for (const s of this.slots) { if (!s) room += it.stack; else if (s.id === id) room += it.stack - s.n; if (room >= n) return true; }
      return room >= n;
    }
    add(id, n, d, silent) {
      const it = G.ITEMS[id]; if (!it) return n;
      if (it.stack > 1) for (const s of this.slots) {
        if (n <= 0) break;
        if (s && s.id === id && s.n < it.stack) { const k = Math.min(n, it.stack - s.n); s.n += k; n -= k; }
      }
      const order = this.order(it);
      for (let q = 0; q < order.length && n > 0; q++) {
        const i = order[q];
        if (!this.slots[i]) { const k = Math.min(n, it.stack); this.slots[i] = { id, n: k }; if (it.dur) this.slots[i].d = d === undefined ? it.dur : d; n -= k; }
      }
      if (!silent) this.changed();
      return n;
    }
    order(it) {
      const a = [...this.slots.keys()];
      if (!this.hotbar || it.type === 'tool' || it.type === 'place' || it.type === 'food') return a;
      return a.slice(this.hotbar).concat(a.slice(0, this.hotbar));
    }
    remove(id, n) {
      for (let i = this.slots.length - 1; i >= 0 && n > 0; i--) {
        const s = this.slots[i];
        if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (s.n <= 0) this.slots[i] = null; }
      }
      this.changed(); return n;
    }
    pay(cost, mult) { mult = mult || 1; if (!this.has(cost, mult)) return false; for (const k in cost) this.remove(k, cost[k] * mult); return true; }
    toJSON() { return this.slots.map(s => s ? Object.assign({}, s) : null); }
    load(arr) { for (let i = 0; i < this.slots.length; i++) this.slots[i] = arr[i] ? Object.assign({}, arr[i]) : null; this.changed(); }
    isEmpty() { return this.slots.every(s => !s); }
  }
  G.Inventory = Inventory;

  // gives items to the player with a toast; overflow is reported
  G.give = function (id, n, opts) {
    if (n <= 0) return;
    const left = G.inv.add(id, n);
    const got = n - left;
    if (got > 0) {
      G.stats.got[id] = true;
      if (!opts || !opts.quiet) G.UI.toast('+' + got + ' ' + G.ITEMS[id].name, id);
    }
    if (left > 0) G.UI.toast('Inventory full!', null, 'warn');
  };
})();
