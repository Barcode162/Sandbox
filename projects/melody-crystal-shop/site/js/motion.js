// motion.js — every moving part of the shop, in one dependency-free module (M-0005).
// Rules: transform/opacity only · content visible without JS · nothing re-hides · reduced motion
// turns everything into instant changes · animations cancel on new input, never delay a click.

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const EASE = {
  out: 'cubic-bezier(.2,.7,.2,1)',
  in: 'cubic-bezier(.5,0,.75,0)',
  inout: 'cubic-bezier(.65,0,.35,1)',
  spring: 'cubic-bezier(.34,1.4,.5,1)',
  glint: 'cubic-bezier(.4,0,.2,1)',
};
const STAGGER = 60;
const MAX_BATCH = 8;

// ── Reveal on scroll ─────────────────────────────────────────────────────
// Elements with [data-reveal] start hidden only once <html> has .motion-ready (set here, after the
// observer exists). Children of [data-stagger] reveal one after another. A failsafe shows all.
let io = null;
let ioAlive = false;
let pending = [];
let flushTimer = 0;

function flush() {
  flushTimer = 0;
  const batch = pending.splice(0);
  batch.sort((a, b) => a.top - b.top || a.left - b.left);
  batch.forEach(({ el }, i) => {
    const step = Number(el.parentElement?.dataset.stagger || STAGGER);
    el.style.setProperty('--d', `${i < MAX_BATCH ? i * step : 0}ms`);
    el.classList.add('is-in');
    el.dispatchEvent(new CustomEvent('revealed'));
    if ((el.matches('.frame') || el.querySelector('.frame')) && el.dataset.glint !== 'off') {
      setTimeout(() => glint(el.querySelector('.frame') || el), (i < MAX_BATCH ? i * step : 0) + 520 + 200);
    }
  });
}

export function reveal(root = document) {
  const els = root.querySelectorAll('[data-reveal]:not(.is-in), [data-stagger] > :not(.is-in)');
  if (reduced() || !('IntersectionObserver' in window)) {
    els.forEach((el) => { el.classList.add('is-in'); el.dispatchEvent(new CustomEvent('revealed')); });
    return els;
  }
  if (!io) {
    io = new IntersectionObserver((entries) => {
      ioAlive = true;
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        const r = en.boundingClientRect;
        pending.push({ el: en.target, top: Math.round(r.top / 40), left: r.left });
      }
      if (pending.length && !flushTimer) flushTimer = setTimeout(flush, 16);
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    document.documentElement.classList.add('motion-ready');
    const all = () => document.querySelectorAll('[data-reveal]:not(.is-in), [data-stagger] > :not(.is-in)').forEach((el) => el.classList.add('is-in'));
    setTimeout(() => { if (!ioAlive) all(); }, 3000); // failsafe for a dead observer only
    addEventListener('beforeprint', all);
  }
  els.forEach((el) => io.observe(el));
  return els;
}

// ── Signature: light catches the crystal ─────────────────────────────────
const lastGlint = new WeakMap();
export function glint(target, { peak = 1, duration = 600, cooldown = 0 } = {}) {
  if (!target || reduced()) return null;
  const frame = target.matches?.('.frame, .seal-clip') ? target : target.querySelector?.('.frame, .seal-clip');
  if (!frame) return null;
  const now = performance.now();
  if (cooldown && now - (lastGlint.get(frame) || -1e9) < cooldown) return null;
  lastGlint.set(frame, now);
  let g = frame.querySelector(':scope > .glint');
  if (!g) {
    g = document.createElement('span');
    g.className = 'glint';
    g.setAttribute('aria-hidden', 'true');
    frame.append(g);
  }
  return g.animate([
    { transform: 'translateX(-120%) skewX(-15deg)', opacity: 0 },
    { opacity: peak, offset: 0.2 },
    { opacity: peak, offset: 0.7 },
    { transform: 'translateX(330%) skewX(-15deg)', opacity: 0 },
  ], { duration, easing: EASE.glint });
}

/** Hover / focus glint on anything containing a .frame, with a cooldown so sweeping never strobes. */
export function hoverGlints(root = document, selector = '.card, .trio .mat, .gallery .main, .credits-list li, .wyg') {
  const go = (e) => {
    const host = e.target.closest?.(selector);
    if (!host || (e.type === 'pointerover' && host.contains(e.relatedTarget))) return;
    if (e.type === 'pointerover' && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    glint(host.querySelector('.frame') || host, { cooldown: 1200 });
  };
  root.addEventListener('pointerover', go);
  root.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) go(e); });
}

// ── Hero shimmer (the only loop) ─────────────────────────────────────────
export function shimmer(frames) {
  if (reduced() || !frames.length) return;
  let visible = true;
  let timer = 0;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(frames[0].closest('.trio') || frames[0]);
  const sweep = () => {
    if (visible && !document.hidden) frames.forEach((f, i) => setTimeout(() => glint(f, { peak: 0.35, duration: 2400 }), i * 500));
    timer = setTimeout(sweep, 7000);
  };
  timer = setTimeout(sweep, 4000);
  return () => clearTimeout(timer);
}

// ── Numbers and labels ───────────────────────────────────────────────────
/** Swap text with a short vertical roll: old slides up and out, new slides up and in. */
export function roll(el, text, { dir = 1 } = {}) {
  if (!el || el.textContent === text) return;
  if (reduced() || !el.isConnected) { el.textContent = text; return; }
  el.textContent = text;
  animateIn(el, dir);
}

/** The roll-in half on its own, for text that has already been updated. */
export function animateIn(el, dir = 1) {
  if (!el || reduced()) return;
  el.getAnimations().forEach((a) => a.cancel());
  el.animate([
    { transform: `translateY(${dir * 0.55}em)`, opacity: 0 },
    { transform: 'none', opacity: 1 },
  ], { duration: 220, easing: EASE.out });
}

/** Snapshot texts of [data-roll] descendants, then after a re-render roll the ones that changed. */
export function snapshot(root) {
  const m = new Map();
  root?.querySelectorAll('[data-roll]').forEach((el) => m.set(el.dataset.roll, el.textContent));
  return m;
}
export function rollChanged(root, before) {
  if (!root || !before?.size) return;
  root.querySelectorAll('[data-roll]').forEach((el) => {
    const was = before.get(el.dataset.roll);
    if (was !== undefined && was !== el.textContent) animateIn(el);
  });
}

/** Count a two-digit label up from 00 (how-it-works numerals). */
export function countUp(el, to, ms = 520) {
  if (reduced()) return;
  const t0 = performance.now();
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = String(Math.round(to * (1 - (1 - k) ** 3))).padStart(2, '0');
    if (k < 1) requestAnimationFrame(tick);
  };
  el.textContent = '00';
  requestAnimationFrame(tick);
}

// ── Pops, shakes and flights ─────────────────────────────────────────────
export function pop(el, { from = 0.85, duration = 380 } = {}) {
  if (!el || reduced()) return;
  el.animate([{ transform: `scale(${from})` }, { transform: 'scale(1.04)', offset: 0.6 }, { transform: 'scale(1)' }], { duration, easing: EASE.out });
}

export function shake(el) {
  if (!el || reduced()) return;
  el.getAnimations().filter((a) => a.id === 'shake').forEach((a) => a.cancel());
  const a = el.animate(
    [0, -6, 6, -4, 4, -2, 0].map((x) => ({ transform: `translateX(${x}px)` })),
    { duration: 320, easing: 'ease-out' },
  );
  a.id = 'shake';
}

export function wiggle(el) {
  if (!el || reduced()) return;
  el.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], { duration: 420, easing: EASE.spring });
}

let flight = null;
/** Fly a small clone of `img` into the bag button. Resolves when it lands (or at once if it can't fly). */
export function flyToBag(img) {
  const bagBtn = document.querySelector('.bag-btn');
  flight?.cancel();
  if (!img || !bagBtn || reduced()) return Promise.resolve();
  const a = img.getBoundingClientRect();
  const b = bagBtn.getBoundingClientRect();
  if (!a.width || a.bottom < 0 || a.top > innerHeight || b.bottom < 0 || b.top > innerHeight) return Promise.resolve();
  const size = 72;
  const clone = document.createElement('img');
  clone.src = img.currentSrc || img.src;
  clone.alt = '';
  clone.className = 'flyer';
  const x0 = a.left + a.width / 2 - size / 2, y0 = a.top + a.height / 2 - size / 2;
  const x1 = b.left + b.width / 2 - size / 2, y1 = b.top + b.height / 2 - size / 2;
  Object.assign(clone.style, { left: `${x0}px`, top: `${y0}px`, width: `${size}px`, height: `${size}px` });
  document.body.append(clone);
  const mx = (x1 - x0) / 2, my = (y1 - y0) / 2 - 80;
  flight = clone.animate([
    { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
    { transform: `translate(${mx}px, ${my}px) scale(.64) rotate(-6deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${x1 - x0}px, ${y1 - y0}px) scale(.28) rotate(-12deg)`, opacity: 1, offset: 0.85 },
    { transform: `translate(${x1 - x0}px, ${y1 - y0}px) scale(.28) rotate(-12deg)`, opacity: 0 },
  ], { duration: 600, easing: EASE.inout });
  const done = flight.finished.catch(() => {}).then(() => { clone.remove(); wiggle(bagBtn.querySelector('svg')); });
  flight.oncancel = () => clone.remove();
  return done;
}

/** Seeded PRNG so the same order number always bursts the same way. */
function seeded(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}

/** A quiet sparkle: 14 four-point stars from the centre of `el`. */
export function burst(el, seed = 'MC') {
  if (!el || reduced()) return;
  const rnd = seeded(seed);
  const colours = ['#b08a4a', '#9a4324', '#3f5a45', '#fff4dc', '#c9a465'];
  const host = document.createElement('span');
  host.className = 'burst';
  host.setAttribute('aria-hidden', 'true');
  el.append(host);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const s = 8 + rnd() * 6;
    const ang = ((i * 360) / n + (rnd() * 16 - 8)) * (Math.PI / 180);
    const dist = 56 + rnd() * 64;
    const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    star.setAttribute('viewBox', '0 0 10 10');
    star.setAttribute('width', s);
    star.setAttribute('height', s);
    star.innerHTML = `<path d="M5 0 6 4 10 5 6 6 5 10 4 6 0 5 4 4Z" fill="${colours[i % colours.length]}"/>`;
    host.append(star);
    const rot = 90 + rnd() * 90;
    star.animate([
      { transform: 'translate(-50%,-50%) scale(0) rotate(0)', opacity: 0 },
      { opacity: 1, offset: 0.2 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * dist * 0.7}px), calc(-50% + ${Math.sin(ang) * dist * 0.7}px)) scale(1) rotate(${rot * 0.6}deg)`, offset: 0.5 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(.4) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 600, delay: 120 + i * 8, easing: EASE.out, fill: 'backwards' });
  }
  setTimeout(() => host.remove(), 120 + n * 8 + 700);
}

/** FLIP: record positions, run `mutate`, then slide survivors from old to new places. */
export function flip(items, mutate, { duration = 320 } = {}) {
  const first = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
  mutate();
  if (reduced()) return;
  for (const el of items) {
    if (!el.isConnected || el.hidden) continue;
    const a = first.get(el), b = el.getBoundingClientRect();
    if (!a.width) {
      el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE.out });
      continue;
    }
    const dx = a.left - b.left, dy = a.top - b.top;
    if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration, easing: EASE.inout });
  }
}

/** Animate an element out (opacity + small slide) before the caller removes it. */
export function leave(el, { x = 24, y = 0, duration = 220 } = {}) {
  if (!el || reduced()) return Promise.resolve();
  return el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translate(${x}px, ${y}px)` }], { duration, easing: EASE.in, fill: 'forwards' }).finished.catch(() => {});
}

/** Stagger the direct children of `root` in with a short rise (drawer lines, schedule rows…). */
export function riseChildren(root, { step = 40, y = 8, selector = ':scope > *' } = {}) {
  if (!root || reduced()) return;
  [...root.querySelectorAll(selector)].slice(0, 12).forEach((el, i) => {
    el.animate([{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: 'none' }], { duration: 380, delay: i * step, easing: EASE.out, fill: 'backwards' });
  });
}
