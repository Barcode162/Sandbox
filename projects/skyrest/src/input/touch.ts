// src/input/touch.ts — owned by WO-003. Touch layout (experience.md §4.6, §8): a floating joystick that spawns under
// the left thumb (left 45 %, below sy 0.35; base 132, knob 58, travel 50, dead zone 8, output min(1, d/50)^1.3), a
// ghost stick that pulses "Drag to move" until first use, Attack 88 / Dodge 64 / Skill 64 on a right-thumb arc inside
// the safe area (all fire on pointerdown, scale 0.92 in 90 ms), Skill's conic cooldown + seconds, onboarding pulses
// (Attack breathes until the first strike; Dodge flashes orange on the first telegraph; Skill on the first stagger).
// Drags elsewhere orbit the camera. (The desktop controls legend is the HUD's, WO-004.)
import './touch.css';
import type { EventBus, FrameInfo } from '../contracts.ts';
import { HERO } from '../tuning/hero.ts';
import { LINK } from './link.ts';

type Press = 'attack' | 'dodge' | 'skill';
export interface TouchSink {
  press(k: Press): void;
  stick(x: number, y: number): void;
}

const TRAVEL = 50, DEAD = 8;

const SWORD = `<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M27 5l4 0 0 4-13 13-4-4z" fill="#fff"/><path d="M9.5 19.5l7 7M12 24l-5 5M7 27.5l1.5 1.5" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;
const ROLL = `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M21 9a8.5 8.5 0 1 0 1.4 7.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M22.5 4.5v5.5h-5.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const GALE = `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M5 17c3-8 12-10 18-6M7 22c4-4 10-5 15-2M9 11c2-3 6-5 10-4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`;

export function createTouchControls(root: HTMLElement, bus: EventBus, sink: TouchSink) {
  const el = document.createElement('div');
  el.className = 'tc';
  el.dataset.testid = 'touch-controls';
  el.innerHTML = `
    <div class="tc-ghost" aria-hidden="true"><div class="tc-knob"></div><span class="tc-hint">Drag to move</span></div>
    <div class="tc-stick" aria-hidden="true"><div class="tc-knob"></div></div>
    <button type="button" class="tc-btn tc-attack breathe" data-testid="btn-attack" aria-label="Attack">${SWORD}</button>
    <button type="button" class="tc-btn tc-dodge" data-testid="btn-dodge" aria-label="Dodge roll">${ROLL}</button>
    <button type="button" class="tc-btn tc-skill" data-testid="btn-skill" aria-label="Gale Crescent"><span class="tc-cd"></span>${GALE}<span class="tc-sec"></span></button>`;
  root.append(el);
  const ghost = el.querySelector<HTMLElement>('.tc-ghost')!;
  const stickEl = el.querySelector<HTMLElement>('.tc-stick')!;
  const knob = stickEl.querySelector<HTMLElement>('.tc-knob')!;
  const btn = {
    attack: el.querySelector<HTMLButtonElement>('.tc-attack')!,
    dodge: el.querySelector<HTMLButtonElement>('.tc-dodge')!,
    skill: el.querySelector<HTMLButtonElement>('.tc-skill')!,
  };
  const secEl = el.querySelector<HTMLElement>('.tc-sec')!;

  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  let touchMode = coarse;
  let allowed = true;
  let shown = false;
  let lastCd = -1;
  let usedStick = false, usedAttack = false, cuedDodge = false, cuedSkill = false;

  // ── buttons: fire on pointerdown ──
  const press = (k: Press) => (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.pointerType === 'touch' || e.pointerType === 'pen') touchMode = true;
    const b = btn[k];
    b.classList.add('down');
    b.setPointerCapture?.(e.pointerId);
    sink.press(k);
    if (k === 'attack' && !usedAttack) {
      usedAttack = true;
      b.classList.remove('breathe');
    }
  };
  const release = (k: Press) => () => btn[k].classList.remove('down');
  const offs: (() => void)[] = [];
  for (const k of ['attack', 'dodge', 'skill'] as const) {
    const down = press(k), up = release(k);
    btn[k].addEventListener('pointerdown', down);
    btn[k].addEventListener('pointerup', up);
    btn[k].addEventListener('pointercancel', up);
    btn[k].addEventListener('lostpointercapture', up);
    offs.push(() => {
      btn[k].removeEventListener('pointerdown', down);
      btn[k].removeEventListener('pointerup', up);
      btn[k].removeEventListener('pointercancel', up);
      btn[k].removeEventListener('lostpointercapture', up);
    });
  }

  // ── joystick + orbit drags (anywhere that is not a button or a UI control) ──
  let stickId = -1, sx = 0, sy = 0;
  let orbitId = -1, ox = 0;
  const setKnob = (dx: number, dy: number) => {
    knob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    touchMode = true;
    if (!shown) return;
    const t = e.target as HTMLElement | null;
    if (t && t.closest('button, a, input, [role="button"], .tc-btn')) return;
    const w = innerWidth, h = innerHeight;
    if (stickId < 0 && e.clientX < w * 0.45 && e.clientY > h * 0.35) {
      stickId = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      stickEl.style.left = `${sx}px`;
      stickEl.style.top = `${sy}px`;
      stickEl.classList.add('on');
      ghost.classList.add('off');
      setKnob(0, 0);
      if (!usedStick) {
        usedStick = true;
        ghost.classList.remove('pulse');
      }
      e.preventDefault();
    } else if (orbitId < 0) {
      orbitId = e.pointerId;
      ox = e.clientX;
    }
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId === stickId) {
      let dx = e.clientX - sx, dy = e.clientY - sy;
      const d = Math.hypot(dx, dy);
      if (d > TRAVEL) {
        dx *= TRAVEL / d;
        dy *= TRAVEL / d;
      }
      setKnob(dx, dy);
      if (d < DEAD) sink.stick(0, 0);
      else {
        const m = Math.pow(Math.min(1, d / TRAVEL), 1.3) / d;
        sink.stick((e.clientX - sx) * m, -(e.clientY - sy) * m);
      }
    } else if (e.pointerId === orbitId) {
      LINK.orbitDeg += (e.clientX - ox) * 0.25;
      LINK.orbitAt = performance.now();
      ox = e.clientX;
    }
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId === stickId) {
      stickId = -1;
      sink.stick(0, 0); // release stops the hero at once (sim decel stops it in < 100 ms)
      stickEl.classList.remove('on');
      ghost.classList.remove('off');
    } else if (e.pointerId === orbitId) orbitId = -1;
  };
  root.addEventListener('pointerdown', onDown, { passive: false });
  addEventListener('pointermove', onMove);
  addEventListener('pointerup', onUp);
  addEventListener('pointercancel', onUp);
  offs.push(() => {
    root.removeEventListener('pointerdown', onDown);
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerup', onUp);
    removeEventListener('pointercancel', onUp);
  });

  // ── onboarding cues ──
  const cue = (b: HTMLElement) => {
    b.classList.remove('cue');
    void b.offsetWidth;
    b.classList.add('cue');
  };
  offs.push(
    bus.on('telegraph', () => {
      if (cuedDodge) return;
      cuedDodge = true;
      cue(btn.dodge);
    }),
    bus.on('stagger', (e) => {
      if (cuedSkill || e.target !== 'golem') return;
      cuedSkill = true;
      cue(btn.skill);
    }),
    bus.on('skillReady', () => cue(btn.skill)),
  );
  ghost.classList.add('pulse');

  // ── per frame (called by the camera rig): visibility, cooldown sweep, legend ──
  const frame = (f: FrameInfo) => {
    const s = f.state;
    const inPlay = s.phase === 'fight' || s.phase === 'intro';
    const vis = touchMode && allowed && inPlay && !f.paused;
    if (vis !== shown) {
      shown = vis;
      el.classList.toggle('show', vis);
      if (!vis) {
        stickId = orbitId = -1;
        stickEl.classList.remove('on');
        sink.stick(0, 0);
      }
    }
    const cd = s.hero.skillCooldown;
    if (cd !== lastCd) {
      lastCd = cd;
      btn.skill.style.setProperty('--cd', (cd / HERO.skill.cooldown).toFixed(3));
      btn.skill.classList.toggle('cooling', cd > 0);
      secEl.textContent = cd > 0 ? String(Math.ceil(cd / 60)) : '';
    }
  };
  LINK.frameListeners.push(frame);
  offs.push(() => {
    const i = LINK.frameListeners.indexOf(frame);
    if (i >= 0) LINK.frameListeners.splice(i, 1);
  });

  return {
    setAllowed(v: boolean) {
      allowed = v;
    },
    setTouchMode(v: boolean) {
      if (!coarse) touchMode = v;
    },
    dispose() {
      for (const o of offs) o();
      el.remove();
    },
  };
}
