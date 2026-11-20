'use strict';
// ============================================================================
//  AETHERWILD — first-time tutorial (guided, step-checked, skippable)
// ============================================================================
(function () {
  const G = window.G;
  const $ = s => document.querySelector(s);
  const k = (key, touch) => '<span class="kc">' + (G.touch && touch ? touch : key) + '</span>';

  const STEPS = [
    { title: 'Look around', text: () => (G.touch ? 'Drag on the right side of the screen to look around.' : 'Move your mouse to look around.'), done: s => (s.looked || 0) > 700 },
    { title: 'Find your feet', text: () => G.touch ? 'Use the stick on the left to walk. Push it all the way to run.' : 'Walk with ' + k('W') + k('A') + k('S') + k('D') + '. Hold ' + k('Shift') + ' to sprint and ' + k('Space') + ' to jump.', done: s => (s.walked || 0) > 12 },
    { title: 'Gather wood', text: () => 'Walk up to a tree and hold ' + k('Left click', 'ACT') + ' to punch it. Collect 5 Wood.', done: () => G.inv.count('wood') >= 5 || G.stats.crafted.stone_axe },
    { title: 'Gather stone', text: () => 'Grey boulders give Stone. Collect 5 Stone.', done: () => G.inv.count('stone') >= 5 || G.stats.crafted.stone_axe },
    { title: 'Gather fiber', text: () => 'Hit a Sunberry bush (round, red berries) for Plant Fiber and Sunberries. Collect 3 Fiber.', done: () => G.inv.count('fiber') >= 3 || G.stats.crafted.stone_axe },
    { title: 'Open your pack', text: () => 'Press ' + k('Tab', 'BAG') + ' to open your inventory and crafting.', done: () => G.UI.open === 'inv' || G.stats.crafted.stone_axe },
    { title: 'Craft a Stone Axe', text: () => 'Find the Stone Axe in the crafting list and press Craft.', done: () => G.stats.crafted.stone_axe },
    { title: 'Equip it', text: () => 'Close your pack, then pick the axe on your hotbar with ' + k('1') + '–' + k('8', 'a tap') + (G.touch ? '' : ' or the mouse wheel') + '. Trees fall much faster now.', done: () => { const h = G.Player.held(); return h && h.id === 'stone_axe'; } },
    { title: 'Lay a foundation', text: () => 'Chop 15 Wood, press ' + k('B', 'BUILD') + ' and pick Foundation. Aim at flat ground and ' + k('click', 'ACT') + ' to place it.', done: () => G.stats.built.foundation > 0 },
    { title: 'Stay alive', text: () => 'Watch the rings beside your hotbar: health, food, water, stamina. Eat Sunberries from your hotbar, or face water and press ' + k('E') + ' to drink.', done: s => s.ate || s.drank },
    { title: 'Meet the locals', text: () => 'Plant-eaters tame with Sunberries: look at one and press ' + k('E') + '. Shy ones flee, so crouch with ' + k('C') + '. Red dots on the map are predators: keep your distance.', auto: 12 },
  ];

  const T = G.Tutorial = {
    step: -1, active: false, t: 0,
    start() { this.step = 0; this.active = true; this.t = 0; this.render(true); },
    stop(done) {
      this.active = false; this.step = done ? STEPS.length : -1; $('#tutorial').classList.remove('on');
      $('#objective').classList.remove('hidden');
      if (done) { G.UI.toast('Tutorial complete. Follow the goals at the top left.', null, 'good'); G.Audio.play('tame'); }
    },
    skip() { if (this.active) { this.stop(false); G.UI.toast('Tutorial skipped. You can replay it from Settings.'); } },
    serialize() { return { step: this.step, active: this.active }; },
    load(d) { if (d && d.active) { this.step = d.step; this.active = true; this.render(true); } else { this.active = false; this.step = d ? d.step : -1; $('#tutorial').classList.remove('on'); } },
    render(fresh) {
      const el = $('#tutorial'), s = STEPS[this.step];
      if (!s) return;
      $('#objective').classList.add('hidden');
      el.querySelector('.tut-step').textContent = 'TUTORIAL · ' + (this.step + 1) + ' / ' + STEPS.length;
      el.querySelector('.tut-title').textContent = s.title;
      el.querySelector('.tut-text').innerHTML = s.text();
      el.querySelector('.tut-dots').innerHTML = STEPS.map((_, i) => '<i class="' + (i < this.step ? 'd' : i === this.step ? 'c' : '') + '"></i>').join('');
      el.querySelector('.tut-skip').innerHTML = G.touch ? 'Tap here to skip' : 'Press ' + '<span class="kc">T</span> to skip';
      el.classList.add('on');
      if (fresh) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    },
    update(dt) {
      if (!this.active || !G.started) return;
      const s = STEPS[this.step]; if (!s) return;
      this.t += dt;
      let ok = false;
      try { ok = s.auto ? this.t > s.auto : s.done(G.stats); } catch (e) { ok = false; }
      if (ok && this.t > 0.6) {
        this.step++; this.t = 0;
        G.Audio.play('craft');
        if (this.step >= STEPS.length) { this.stop(true); return; }
        this.render(true);
      }
    },
  };
  document.addEventListener('DOMContentLoaded', () => { const sk = $('#tutorial .tut-skip'); if (sk) sk.addEventListener('click', () => T.skip()); });
})();
