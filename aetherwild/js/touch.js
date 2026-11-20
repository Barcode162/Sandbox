'use strict';
// ============================================================================
//  AETHERWILD — touch controls (phones & tablets)
//  Left half: floating move stick · right half: drag to look · action buttons
// ============================================================================
(function () {
  const G = window.G;
  const $ = s => document.querySelector(s);
  G.touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches);

  const T = G.Touch = {
    stick: null, look: null,
    init() {
      if (!G.touch) return;
      document.body.classList.add('touch');
      const I = G.Input;
      I.noLock = true;
      const zone = $('#touch-zone'), knob = $('#stick'), nub = $('#stick i');
      const R = 56;
      zone.addEventListener('touchstart', e => {
        if (!I.active()) return;
        for (const t of e.changedTouches) {
          if (t.clientX < window.innerWidth * 0.45 && !this.stick) {
            this.stick = { id: t.identifier, x: t.clientX, y: t.clientY };
            knob.style.left = t.clientX + 'px'; knob.style.top = t.clientY + 'px'; knob.classList.add('on'); nub.style.transform = '';
          } else if (!this.look) this.look = { id: t.identifier, x: t.clientX, y: t.clientY };
        }
        e.preventDefault();
      }, { passive: false });
      zone.addEventListener('touchmove', e => {
        for (const t of e.changedTouches) {
          if (this.stick && t.identifier === this.stick.id) {
            let dx = t.clientX - this.stick.x, dy = t.clientY - this.stick.y; const d = Math.hypot(dx, dy);
            if (d > R) { dx *= R / d; dy *= R / d; }
            nub.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            I.ax = dx / R; I.az = dy / R; I.touchSprint = d > R * 1.25;
          } else if (this.look && t.identifier === this.look.id) {
            I.dx += (t.clientX - this.look.x) * 1.6; I.dy += (t.clientY - this.look.y) * 1.6;
            this.look.x = t.clientX; this.look.y = t.clientY;
          }
        }
        e.preventDefault();
      }, { passive: false });
      const end = e => {
        for (const t of e.changedTouches) {
          if (this.stick && t.identifier === this.stick.id) { this.stick = null; I.ax = I.az = 0; I.touchSprint = false; knob.classList.remove('on'); }
          if (this.look && t.identifier === this.look.id) this.look = null;
        }
      };
      zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
      // buttons: data-hold="KeyX" keeps a key held; data-tap="KeyX" sends one key press; data-act="mouse" holds attack
      document.querySelectorAll('#touch-ui [data-btn]').forEach(b => {
        const code = b.dataset.btn;
        b.addEventListener('touchstart', e => {
          e.preventDefault(); e.stopPropagation(); G.Audio.start(); b.classList.add('down');
          if (code === 'mouse') { I.mouse.l = true; I.mouse.lPressed = true; }
          else if (code === 'Space') I.keys.Space = true;
          else if (code === 'Pause') G.Menu.pause();
          else document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
        }, { passive: false });
        const up = e => { b.classList.remove('down'); if (code === 'mouse') I.mouse.l = false; else if (code === 'Space') I.keys.Space = false; else document.dispatchEvent(new KeyboardEvent('keyup', { code })); };
        b.addEventListener('touchend', up); b.addEventListener('touchcancel', up);
      });
      // tap a hotbar slot to select it
      $('#hotbar').addEventListener('touchstart', e => {
        const s = e.target.closest('.slot'); if (!s) return;
        const i = [...$('#hotbar').children].indexOf(s); if (i >= 0) { G.Player.sel = i; G.UI.refreshHotbar(); }
        e.preventDefault();
      }, { passive: false });
    },
  };
})();
