'use strict';
// ============================================================================
//  AETHERWILD — front end: start screen, menu, worlds, settings, transitions
// ============================================================================
(function () {
  const G = window.G;
  const $ = s => document.querySelector(s);
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h !== undefined) e.innerHTML = h; return e; };
  const NAMES = ['Fernreach', 'Ashtooth Isle', 'Mossbone Atoll', 'Emberfall', 'Saurian Reach', 'Thunderfern', 'Cinder Lagoon', 'Raptor Key', 'Old Claw Isle', 'Amberdeep'];

  // ---------------------------------------------------------- the emblem
  // volcano island at dusk: smoke, palms, a long-neck grazer and pterosaurs
  function emblemSVG() {
    const ink = '#160f0b';
    const palm = (x, y, h, lean, flip) => {
      const tx = x + lean, ty = y - h;
      let s = `<path d="M${x} ${y} Q ${x + lean * 0.2} ${y - h * 0.55} ${tx} ${ty}" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i < 6; i++) {
        const a = (-160 + i * 34) * Math.PI / 180 * (flip ? -1 : 1) + (flip ? Math.PI : 0);
        const L = 38 + (i % 2) * 10, ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.6 + 10;
        const mx = tx + Math.cos(a) * L * 0.5, my = ty + Math.sin(a) * L * 0.3 - 8;
        s += `<path d="M${tx} ${ty} Q ${mx} ${my} ${ex} ${ey}" stroke="${ink}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
      }
      return s;
    };
    const ptero = (x, y, s) => `<path d="M${x - 22 * s} ${y - 4 * s} Q ${x - 10 * s} ${y - 12 * s} ${x} ${y} Q ${x + 10 * s} ${y - 12 * s} ${x + 22 * s} ${y - 4 * s} Q ${x + 10 * s} ${y - 6 * s} ${x} ${y + 3 * s} Q ${x - 10 * s} ${y - 6 * s} ${x - 22 * s} ${y - 4 * s} Z" fill="${ink}"/><path d="M${x} ${y} l ${6 * s} ${-3 * s}" stroke="${ink}" stroke-width="${2 * s}"/>`;
    return `<svg viewBox="0 0 1000 440" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
 <radialGradient id="eSun" cx="50%" cy="58%" r="38%"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".45" stop-color="#f08a3c" stop-opacity=".55"/><stop offset="1" stop-color="#c2412a" stop-opacity="0"/></radialGradient>
 <linearGradient id="eSea" x1="0" x2="1"><stop offset="0" stop-color="#ffcf7a" stop-opacity="0"/><stop offset=".5" stop-color="#ffe2a8"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></linearGradient>
 <radialGradient id="eLava" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd36b"/><stop offset=".6" stop-color="#ff6a2a" stop-opacity=".8"/><stop offset="1" stop-color="#ff3a1a" stop-opacity="0"/></radialGradient>
</defs>
<circle cx="500" cy="255" r="205" fill="url(#eSun)"/>
<g class="smoke" fill="#2a1d16" opacity=".55"><circle cx="512" cy="96" r="20"/><circle cx="530" cy="70" r="26"/><circle cx="556" cy="44" r="30"/><circle cx="590" cy="26" r="24"/></g>
<ellipse cx="500" cy="128" rx="46" ry="16" fill="url(#eLava)" class="lava"/>
<path d="M90 336 C 210 318 290 312 352 268 L 452 132 Q 468 118 482 130 L 492 138 Q 502 130 516 138 L 526 130 Q 540 118 552 132 L 650 268 C 712 312 790 318 910 336 Z" fill="${ink}"/>
<path d="M478 134 L 470 170 L 486 150 L 492 186 L 500 146 L 510 178 L 516 140" stroke="#ff7a2e" stroke-width="3" fill="none" opacity=".75" stroke-linejoin="round"/>
${palm(230, 326, 70, -18, false)}${palm(272, 321, 54, 10, false)}${palm(880, 334, 58, 14, true)}
<g fill="${ink}">
 <ellipse cx="770" cy="304" rx="40" ry="15"/>
 <path d="M796 298 C 812 280 822 252 832 226 L 842 229 C 834 256 824 286 806 308 Z"/>
 <ellipse cx="846" cy="223" rx="12" ry="6.5"/>
 <path d="M734 302 C 706 310 684 318 660 320 C 688 310 710 300 736 294 Z"/>
 <rect x="746" y="308" width="7" height="20" rx="3"/><rect x="760" y="310" width="7" height="18" rx="3"/><rect x="778" y="309" width="7" height="20" rx="3"/><rect x="791" y="306" width="7" height="21" rx="3"/>
</g>
<g class="pteros">${ptero(330, 150, 1.25)}${ptero(380, 112, 0.8)}${ptero(690, 128, 1)}</g>
<rect x="60" y="334" width="880" height="4" rx="2" fill="url(#eSea)"/>
<rect x="170" y="348" width="660" height="2" rx="1" fill="url(#eSea)" opacity=".5"/>
<g class="claws" stroke="#4ff0e0" stroke-width="7" stroke-linecap="round" opacity=".0"><path d="M610 70 L 700 250"/><path d="M640 64 L 730 244"/><path d="M670 60 L 760 238"/></g>
</svg>`;
  }
  function buildLogo() {
    const word = 'AETHERWILD', logo = $('#logo');
    const rot = [-4, 2, -2, 3, -1, -3, 2, -2, 4, -3], dy = [4, -2, 2, -4, 0, 3, -3, 1, -2, 3];
    logo.innerHTML = [...word].map((c, i) => `<span style="--r:${rot[i]}deg;--y:${dy[i]}px;--d:${i * 45}ms">${c}</span>`).join('');
    $('#emblem').innerHTML = emblemSVG();
  }

  // ---------------------------------------------------------- settings
  const DEF = { sens: 1, fov: 72, volume: 0.5, quality: G.touch ? 'low' : 'high', invertY: false, tutorial: true };
  G.settings = Object.assign({}, DEF);
  try { Object.assign(G.settings, JSON.parse(G.store.get('aetherwild_settings') || '{}')); } catch (e) { }
  const saveSettings = () => G.store.set('aetherwild_settings', JSON.stringify(G.settings));

  const M = G.Menu = {
    state: 'hidden',
    init() {
      buildLogo();
      G.Worlds.migrate();
      // start screen: any press opens the menu
      const go = e => { if (this.state !== 'start') return; if (e && e.type === 'keydown' && e.repeat) return; G.Audio.start(); G.Audio.play('ui'); this.set('main'); };
      $('#front').addEventListener('pointerdown', go);
      document.addEventListener('keydown', go);
      $('#press-text').textContent = G.touch ? 'Tap anywhere' : 'Press anywhere';
      $('#m-continue').onclick = () => { const w = G.Worlds.list()[0]; if (w) this.enter(w); };
      $('#m-play').onclick = () => this.set('worlds');
      $('#m-settings').onclick = () => this.openSettings('main');
      $('#w-back').onclick = () => this.set('main');
      $('#w-new').onclick = () => this.toggleForm(true);
      $('#w-form').onsubmit = e => {
        e.preventDefault();
        const name = $('#w-name').value.trim() || $('#w-name').placeholder;
        const w = G.Worlds.create(name, G.Worlds.seedFrom($('#w-seed').value));
        this.enter(w);
      };
      $('#s-back').onclick = () => this.closeSettings();
      document.addEventListener('keydown', e => {
        if (e.code !== 'Escape') return;
        if (!$('#settings').classList.contains('hidden')) { this.closeSettings(); return; }
        if (!G.started && this.state === 'worlds') this.set('main');
      });
      // pause menu
      $('#p-resume').onclick = () => this.resume();
      $('#p-settings').onclick = () => this.openSettings('pause');
      $('#p-save').onclick = () => G.save();
      $('#p-help').onclick = () => $('#help').classList.toggle('hidden');
      $('#help-close').onclick = () => $('#help').classList.add('hidden');
      $('#p-quit').onclick = () => this.quit();
      this.bindSettings();
    },
    set(s) {
      const f = $('#front');
      this.state = s;
      f.className = 'st-' + s;
      if (s === 'main') {
        const last = G.Worlds.list()[0];
        $('#m-continue').classList.toggle('hidden', !last);
        if (last) $('#m-continue-name').textContent = last.name;
        this.stagger('#menu-main .mbtn:not(.hidden)');
      }
      if (s === 'worlds') { this.toggleForm(false); this.renderWorlds(); this.stagger('#menu-worlds .mhead, #menu-worlds .newworld, #world-list .wcard'); }
    },
    stagger(sel) {
      document.querySelectorAll(sel).forEach((b, i) => { b.classList.remove('in'); b.style.setProperty('--i', i); void b.offsetWidth; b.classList.add('in'); });
    },
    toggleForm(open) {
      $('#w-form').classList.toggle('hidden', !open); $('#w-new').classList.toggle('hidden', open);
      if (open) {
        const used = new Set(G.Worlds.list().map(w => w.name));
        $('#w-name').placeholder = NAMES.find(n => !used.has(n)) || ('Island ' + (used.size + 1));
        $('#w-name').value = ''; $('#w-seed').value = '';
        setTimeout(() => $('#w-name').focus(), 50);
      }
    },
    ago(t) {
      const s = (Date.now() - t) / 1000;
      if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago';
      const d = Math.floor(s / 86400); return d === 1 ? 'yesterday' : d + ' days ago';
    },
    renderWorlds() {
      const box = $('#world-list'); box.innerHTML = '';
      const list = G.Worlds.list();
      if (!list.length) { box.appendChild(el('div', 'wempty', 'No worlds yet. Your first island is waiting.')); return; }
      for (const w of list) {
        const c = el('div', 'wcard');
        const goal = Math.min(w.goal || 0, G.OBJECTIVES.length);
        c.innerHTML = `<div class="wmain"><div class="wname"></div><div class="wmeta">${w.fresh ? 'Not explored yet' : 'Day ' + (w.day || 1) + ' · ' + goal + '/' + G.OBJECTIVES.length + ' goals' + (w.tames ? ' · ' + w.tames + ' tamed' : '')} · ${this.ago(w.played)}</div>
          <div class="wprog"><i style="width:${100 * goal / G.OBJECTIVES.length}%"></i></div></div>
          <button class="wdel" aria-label="Delete world">✕</button><button class="wgo">Enter</button>`;
        c.querySelector('.wname').textContent = w.name;
        c.querySelector('.wgo').onclick = () => this.enter(w);
        c.querySelector('.wmain').onclick = () => this.enter(w);
        const del = c.querySelector('.wdel'); let armed = false, t = 0;
        del.onclick = () => {
          if (!armed) { armed = true; del.classList.add('armed'); del.textContent = 'Delete?'; t = setTimeout(() => { armed = false; del.classList.remove('armed'); del.textContent = '✕'; }, 3000); return; }
          clearTimeout(t); G.Worlds.remove(w.id); c.classList.add('gone'); setTimeout(() => this.renderWorlds(), 260);
        };
        box.appendChild(c);
      }
    },

    // ---------------------------------------------------------- settings sheet
    bindSettings() {
      const S = G.settings;
      const rng = (id, key, fmt, apply) => {
        const i = $('#s-' + id), o = $('#o-' + id);
        i.value = S[key]; o.textContent = fmt(S[key]);
        i.oninput = () => { S[key] = +i.value; o.textContent = fmt(S[key]); apply && apply(); saveSettings(); };
      };
      rng('sens', 'sens', v => v.toFixed(2) + '×');
      rng('fov', 'fov', v => v + '°', () => G.applyView && G.applyView());
      rng('vol', 'volume', v => Math.round(v * 100) + '%', () => G.Audio.setVolume(S.volume));
      const tog = (id, key, apply) => {
        const b = $('#s-' + id); const paint = () => { b.classList.toggle('on', !!S[key]); b.setAttribute('aria-checked', !!S[key]); };
        paint(); b.onclick = () => { S[key] = !S[key]; paint(); apply && apply(); saveSettings(); G.Audio.play('ui'); };
      };
      tog('invert', 'invertY'); tog('tut', 'tutorial');
      const seg = $('#s-quality');
      const paintQ = () => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === S.quality));
      paintQ();
      seg.querySelectorAll('button').forEach(b => b.onclick = () => { S.quality = b.dataset.v; paintQ(); saveSettings(); G.applyQuality && G.applyQuality(); G.Audio.play('ui'); });
      $('#s-replay').onclick = () => { this.closeSettings(); this.resume(); G.Tutorial.start(); };
    },
    openSettings(from) {
      this.settingsFrom = from;
      $('#s-replay-row').classList.toggle('hidden', !G.started);
      const s = $('#settings'); s.classList.remove('hidden', 'in'); void s.offsetWidth; s.classList.add('in');
      if (from === 'main') $('#front').className = 'st-settings';
      if (from === 'pause') $('#pause').classList.add('under');
      this.stagger('#settings .mhead, #settings .srow:not(.hidden)');
    },
    closeSettings() {
      $('#settings').classList.add('hidden');
      if (this.settingsFrom === 'main') this.set('main');
      else $('#pause').classList.remove('under');
    },

    // ---------------------------------------------------------- pause
    pause() {
      if (!G.started || G.Player.dead) return;
      G.Input.paused = true; G.UI.closeAll(); G.Input.unlock();
      $('#pause').classList.remove('hidden', 'under'); this.stagger('#pause .ptitle, #pause .mbtn');
      G.save(true);
    },
    resume() {
      $('#pause').classList.add('hidden'); $('#help').classList.add('hidden');
      G.Input.paused = false; G.Input.lock();
    },
    quit() {
      G.save(true);
      if (G.Player.mount) G.Player.dismount();
      G.started = false; G.Input.paused = false; G.UI.closeAll(); G.Build.stopBuild();
      $('#pause').classList.add('hidden'); $('#help').classList.add('hidden'); $('#hud').classList.add('hidden');
      document.body.classList.remove('ingame');
      G.pristine = false;
      this.titleCam();
      this.set('main');
    },

    // ---------------------------------------------------------- entering a world
    enter(w) {
      if (this.busy) return; this.busy = true;
      G.Audio.start(); G.Audio.play('warp');
      const warp = $('#warp');
      $('#warp-name').textContent = w.name;
      warp.classList.remove('hidden', 'out'); void warp.offsetWidth; warp.classList.add('show');
      setTimeout(() => {
        G.enterWorld(w);
        $('#front').className = 'st-hidden'; this.state = 'game';
        setTimeout(() => {
          warp.classList.add('out'); warp.classList.remove('show');
          document.body.classList.add('ingame');
          $('#hud').classList.remove('hidden');
          G.Input.lock();
          setTimeout(() => { warp.classList.add('hidden'); this.busy = false; }, 1300);
        }, 450);
      }, 900);
    },

    // ---------------------------------------------------------- title flyover
    titleCam() {
      // a slow, perfectly level orbit: altitude is fixed above the highest ground on the whole path
      const sp = G.World.spawn, W = G.World, R = 96;
      let top = W.height(sp.x, sp.z);
      for (let a = 0; a < Math.PI * 2; a += 0.05) for (const r of [R * 0.6, R, R * 1.15]) top = Math.max(top, W.height(sp.x + Math.cos(a) * r, sp.z + Math.sin(a) * r));
      this.cam = { cx: sp.x, cz: sp.z, R, y: top + 14, look: W.height(sp.x, sp.z) + 3, a: this.cam ? this.cam.a : 0.6 };
    },
    updateTitleCam(dt, cam) {
      const c = this.cam; if (!c) return;
      c.a += dt * 0.0105;
      const bob = Math.sin(c.a * 3.1) * 1.6;
      cam.position.set(c.cx + Math.cos(c.a) * c.R, c.y + bob, c.cz + Math.sin(c.a) * c.R);
      // look slightly ahead along the orbit, so the view drifts rather than spins
      const la = c.a + 0.35;
      cam.lookAt(c.cx + Math.cos(la) * c.R * 0.25, c.look, c.cz + Math.sin(la) * c.R * 0.25);
    },
  };
})();
