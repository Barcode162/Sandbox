// ui.js — the shared chrome: header, theme, menu, bag drawer, toast, icons, photo fallbacks.
import * as bag from './bag.js';
import { img, FORMATS, fromPrice } from '../data/crystals.js';
import { fmt } from './money.js';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Escape text for safe interpolation into HTML. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

const P = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
export const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>`,
  chev: `<svg class="chev" viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M9 6l6 6-6 6"/></svg>`,
  down: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M6 9l6 6 6-6"/></svg>`,
  minus: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P} stroke-width="2"><path d="M5 12h14"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P} stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P} stroke-width="2.4"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v6M16 10.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.6 15a1.5 1.5 0 0 1 2.4-1.8L7 14.5"/></svg>`,
  truck: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>`,
  box: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5L12 12l9-4.5M12 12v9"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  card: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/></svg>`,
  gift: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18M12 8v13M12 8c-1.5-3-5-4-5-1.5S10 8 12 8zM12 8c1.5-3 5-4 5-1.5S14 8 12 8z"/></svg>`,
  cash: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>`,
  info: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P} stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true" ${P}><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>`,
  gem: `<svg class="gem-glyph" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M14 8h20l8 11-18 21L6 19z"/><path d="M6 19h36M18 8l-4 11 10 21 10-21-4-11M14 19l10-11 10 11"/></svg>`,
  seal: `<svg class="seal" viewBox="0 0 72 72" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="36" cy="36" r="33"/><circle cx="36" cy="36" r="27" stroke-dasharray="2 4"/><path d="M25 37l8 8 15-17" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

/** Hand-drawn format illustrations, tinted with the crystal's colour. */
export function formatArt(formatId, colour) {
  const c = colour || '#b08a4a';
  if (formatId === 'bag') {
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="pg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9dcc6"/><stop offset="1" stop-color="#cfbb9b"/></linearGradient></defs>
      <path d="M17 24c-4 9-6 20-3 27 2 5 8 7 18 7s16-2 18-7c3-7 1-18-3-27z" fill="url(#pg)" stroke="#8b7356" stroke-width="1.4"/>
      <path d="M19 24c5 2 21 2 26 0" fill="none" stroke="#8b7356" stroke-width="1.4"/>
      <path d="M22 23c-2-5-1-9 2-11M42 23c2-5 1-9-2-11" fill="none" stroke="#8b7356" stroke-width="1.4"/>
      <path d="M24 12c3 3 13 3 16 0" fill="none" stroke="#9a4324" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="25" cy="24" rx="5" ry="3.6" fill="${c}" stroke="#2a242055"/><ellipse cx="33" cy="22.5" rx="4.6" ry="3.4" fill="${c}" stroke="#2a242055" opacity=".9"/><ellipse cx="40" cy="24.5" rx="4" ry="3" fill="${c}" stroke="#2a242055"/>
      <path d="M23 23c1-1 3-1.5 4-1M31.5 21.5c1-.8 2.3-1 3-.8" stroke="#fff" stroke-opacity=".7" stroke-width="1" fill="none" stroke-linecap="round"/></svg>`;
  }
  if (formatId === 'jar') {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="21" y="5" width="22" height="7" rx="2" fill="#b08a4a" stroke="#7a5f30" stroke-width="1.2"/>
      <path d="M19 13h26c3 3 5 6 5 11v26a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V24c0-5 2-8 5-11z" fill="#ffffff22" stroke="#6f6659" stroke-width="1.4"/>
      <g stroke="#2a242066" stroke-width="1"><path d="M17 50l6-9 7 3 2 9-7 4z" fill="${c}"/><path d="M30 44l6-8 8 4-1 10-8 3z" fill="${c}" opacity=".9"/><path d="M42 41l6 2v9l-6 3-3-6z" fill="${c}" opacity=".8"/>
      <path d="M18 38l5-8 7 4-1 8-7 2z" fill="${c}" opacity=".85"/><path d="M29 33l5-7 7 4v8l-7 3z" fill="${c}"/><path d="M39 30l7-2 3 9-6 4-4-4z" fill="${c}" opacity=".9"/><path d="M22 27l6-6 5 4-2 7-7-1z" fill="${c}" opacity=".8"/></g>
      <path d="M18 20c-1 8-1 22 0 30" stroke="#fff" stroke-opacity=".75" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  }
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#2a242077" stroke-width="1.2" stroke-linejoin="round">
    <path d="M32 4l9 14-3 38H26l-3-38z" fill="${c}"/><path d="M32 4l-9 14h18z" fill="#ffffff55"/><path d="M32 4v14M23 18l3 38M41 18l-3 38" fill="none"/>
    <path d="M20 26l7-5 2 35h-7z" fill="${c}" opacity=".75"/><path d="M44 28l-6-4-1 32h7z" fill="${c}" opacity=".7"/></g>
    <ellipse cx="32" cy="58" rx="18" ry="3" fill="#2a24201f"/></svg>`;
}

let sceneId = 0;
/**
 * A product "scene" for the bag and jar formats, built from the stone's real photo:
 * the photo fills the stones inside a linen pouch or a glass jar. 4:5, like every frame.
 */
export function formatScene(formatId, photoUrl, colour = '#b08a4a', { label = true } = {}) {
  const u = `fs${++sceneId}`;
  // Three crops of the photo, each filling a stone's own box, so every stone shows real crystal.
  const pat = [[0, 0, 1], [-0.35, -0.25, 1.7], [-0.15, -0.55, 1.5]].map(([x, y, s], i) =>
    `<pattern id="${u}p${i}" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1"><image href="${photoUrl}" x="${x}" y="${y}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid slice"/></pattern>`).join('');
  let n = 0;
  const shade = `<radialGradient id="${u}s" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>`;
  const stone = (cx, cy, rx, ry, rot) => `<g transform="rotate(${rot} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${u}p${n++ % 3})"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${u}s)" stroke="#2a242040" stroke-width=".8"/><ellipse cx="${cx - rx * .35}" cy="${cy - ry * .4}" rx="${rx * .28}" ry="${ry * .16}" fill="#fff" opacity=".55"/></g>`;
  if (formatId === 'bag') {
    return `<svg viewBox="0 0 200 250" aria-hidden="true"><defs>${pat}${shade}
      <linearGradient id="${u}l" x1="0" x2="1"><stop offset="0" stop-color="#d9c7a8"/><stop offset=".45" stop-color="#efe3cc"/><stop offset="1" stop-color="#c6b08c"/></linearGradient>
      <pattern id="${u}w" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 2h4M2 0v4" stroke="#8b7356" stroke-opacity=".12" stroke-width=".6"/></pattern></defs>
      <ellipse cx="100" cy="226" rx="78" ry="9" fill="#2a2420" opacity=".14"/>
      <path d="M52 92c-14 30-22 72-14 104 5 20 26 28 62 28s57-8 62-28c8-32 0-74-14-104z" fill="url(#${u}l)" stroke="#8b7356" stroke-width="1.5"/>
      <path d="M52 92c-14 30-22 72-14 104 5 20 26 28 62 28s57-8 62-28c8-32 0-74-14-104z" fill="url(#${u}w)"/>
      <path d="M70 120c-4 30-4 62 2 92M128 122c5 28 6 60 1 90" stroke="#8b7356" stroke-opacity=".25" fill="none" stroke-width="1.2"/>
      <g>${stone(72, 92, 20, 14, -12)}${stone(128, 92, 19, 13, 14)}${stone(100, 86, 22, 15, 4)}${stone(86, 76, 16, 11, -20)}${stone(116, 74, 15, 11, 18)}</g>
      <path d="M50 96c16 8 84 8 100 0" stroke="#8b7356" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M58 100c10 4 74 4 84 0" stroke="#9a4324" stroke-width="2.4" fill="none" stroke-dasharray="6 5" stroke-linecap="round"/>
      <path d="M142 100c10 10 18 24 16 40M146 100c16 6 26 18 28 32" stroke="#9a4324" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <g>${stone(40, 214, 15, 10, -8)}${stone(164, 216, 13, 9, 20)}</g>
      <rect x="76" y="150" width="48" height="30" rx="3" fill="#fbf7f1" stroke="#8b7356" stroke-width="1"/>
      ${label ? '<text x="100" y="168" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="11" fill="#2a2420">Melody’s</text>' : ''}</svg>`;
  }
  // Jar
  const body = 'M48 64h104c8 10 14 22 14 38v104c0 14-10 24-24 24H58c-14 0-24-10-24-24V102c0-16 6-28 14-38z';
  return `<svg viewBox="0 0 200 250" aria-hidden="true"><defs>${pat}${shade}
    <clipPath id="${u}c"><path d="${body}"/></clipPath>
    <linearGradient id="${u}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".18" stop-color="#fff" stop-opacity=".08"/><stop offset=".8" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".25"/></linearGradient>
    <linearGradient id="${u}b" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d1aa66"/><stop offset="1" stop-color="#8f6b31"/></linearGradient></defs>
    <ellipse cx="100" cy="234" rx="76" ry="8" fill="#2a2420" opacity=".16"/>
    <path d="${body}" fill="${colour}" fill-opacity=".12"/>
    <g clip-path="url(#${u}c)">
      ${stone(62, 208, 30, 22, -10)}${stone(118, 212, 34, 22, 8)}${stone(160, 200, 24, 20, -18)}
      ${stone(80, 172, 30, 22, 16)}${stone(136, 168, 32, 24, -8)}${stone(48, 150, 22, 20, 0)}
      ${stone(104, 136, 30, 22, -14)}${stone(156, 132, 24, 22, 12)}${stone(64, 112, 26, 18, 20)}${stone(124, 102, 26, 18, -6)}
    </g>
    <path d="${body}" fill="url(#${u}g)" stroke="#5e544b" stroke-opacity=".55" stroke-width="2"/>
    <path d="M46 96c-3 30-3 80 0 110" stroke="#fff" stroke-opacity=".8" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M58 82c-2 6-3 10-3 14" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="44" y="38" width="112" height="28" rx="6" fill="url(#${u}b)" stroke="#6f5426" stroke-width="1.2"/>
    <path d="M52 44v16M62 44v16M72 44v16M82 44v16M92 44v16M102 44v16M112 44v16M122 44v16M132 44v16M142 44v16" stroke="#6f5426" stroke-opacity=".35"/>
    <rect x="70" y="140" width="60" height="34" rx="3" fill="#fbf7f1" fill-opacity=".94" stroke="#8b7356" stroke-width="1"/>
    ${label ? '<text x="100" y="161" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="12" fill="#2a2420">Melody’s</text>' : ''}</svg>`;
}

/** A photo inside the shared mat-and-frame treatment, with a named fallback. */
export function framedPhoto(c, { size = 480, photo = c.photos[0], eager = false, cls = '' } = {}) {
  return `<div class="frame ${cls}">
    <img src="${img(photo, size)}" alt="${esc(c.alt)}" style="object-position:${c.focus}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="${size}" height="${Math.round(size * 1.25)}">
    <span class="fallback" aria-hidden="true">${ICON.gem}${esc(c.name)}</span>
  </div>`;
}

/** Any image that fails to load is swapped for the named mat card instead of a broken icon. */
function watchBrokenImages() {
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t instanceof HTMLImageElement && t.closest('.frame')) t.closest('.frame').classList.add('is-broken');
    else if (t instanceof HTMLImageElement && t.closest('.thumb')) t.style.visibility = 'hidden';
  }, true);
}

// ── Theme ────────────────────────────────────────────────────────────────
function storedTheme() {
  try { return localStorage.getItem('mc.theme'); } catch { return null; }
}
function currentTheme() {
  return document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function paintThemeButton(btn) {
  const dark = currentTheme() === 'dark';
  btn.innerHTML = dark ? ICON.sun : ICON.moon;
  btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}

// ── Header ───────────────────────────────────────────────────────────────
function header(active) {
  const link = (href, label, key) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container">
      <a class="wordmark" href="index.html"><b>Melody’s</b><span>CRYSTALS</span></a>
      <nav class="nav" aria-label="Main">
        ${link('index.html#shop', 'Shop', 'shop')}${link('index.html#meanings', 'Meanings', 'meanings')}${link('index.html#faq', 'FAQ', 'faq')}
      </nav>
      <div class="header-actions">
        <button class="icon-btn theme-btn" type="button"></button>
        <button class="icon-btn bag-btn" type="button" aria-haspopup="dialog" aria-controls="bag-drawer">${ICON.bag}<span class="bag-count" hidden>0</span><span class="visually-hidden bag-label">Bag</span></button>
        <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="menu-sheet" aria-label="Menu">${ICON.menu}</button>
      </div>
    </div>
  </header>
  <nav class="menu-sheet" id="menu-sheet" aria-label="Menu" hidden>
    <a href="index.html#shop">Shop crystals</a><a href="index.html#meanings">What they mean</a><a href="index.html#how">How buying works</a><a href="index.html#faq">FAQ</a>
  </nav>`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <a class="wordmark" href="index.html"><b>Melody’s</b><span>CRYSTALS</span></a>
        <p class="muted" style="margin-top:12px">Hand-picked by Melody. Every order is packed by me, with a little card about your stone.</p>
      </div>
      <nav class="footer-nav" aria-label="Footer">
        <a href="index.html#shop">Shop</a><a href="index.html#meanings">Meanings</a><a href="index.html#faq">FAQ</a><a href="credits.html">Photo credits</a>
      </nav>
      <p class="footer-small">© 2026 Melody’s Crystals · Crystal meanings are shared as tradition and folklore, not medical advice.</p>
    </div>
  </footer>`;
}

// ── Drawer ───────────────────────────────────────────────────────────────
let opener = null;
let lastAdded = null;
let undoTimer = 0;

function drawerShell() {
  return `<div class="scrim" hidden></div>
  <aside class="drawer" id="bag-drawer" role="dialog" aria-modal="true" aria-labelledby="bag-title" hidden>
    <div class="drawer-head"><h2 id="bag-title">Your bag</h2><button class="icon-btn" type="button" data-close aria-label="Close bag">${ICON.close}</button></div>
    <div class="drawer-body"></div>
    <div class="drawer-foot" hidden></div>
  </aside>
  <div class="toast" role="status" aria-live="polite"></div>
  <div class="visually-hidden" id="bag-live" aria-live="polite"></div>`;
}

export function lineItem(l, { editable = true } = {}) {
  const c = l.crystal;
  return `<li class="line${l.key === lastAdded ? ' is-new' : ''}" data-key="${l.key}">
    <div class="thumb"><img src="${img(c.photos[0], 480)}" alt="" style="object-position:${c.focus}" loading="lazy"></div>
    <div>
      <h3><a href="product.html?c=${c.slug}">${esc(c.name)}</a></h3>
      <div class="fmt">${esc(l.formatInfo.name)}${editable ? '' : ` · Qty ${l.qty}`}</div>
      ${editable ? `<div class="controls">
        <div class="stepper sm" role="group" aria-label="Quantity of ${esc(c.name)}, ${esc(l.formatInfo.name)}">
          <button type="button" data-dec aria-label="Decrease quantity" ${l.qty <= 1 ? 'disabled' : ''}>${ICON.minus}</button>
          <span class="val" aria-live="polite">${l.qty}</span>
          <button type="button" data-inc aria-label="Increase quantity" ${l.qty >= bag.MAX_QTY ? 'disabled' : ''}>${ICON.plus}</button>
        </div>
        <button type="button" class="btn-quiet" data-remove>Remove<span class="visually-hidden"> ${esc(c.name)}, ${esc(l.formatInfo.name)}</span></button>
      </div>` : ''}
    </div>
    <div class="lt">${fmt(l.price * l.qty)}</div>
  </li>`;
}

export function emptyBag(headingTag = 'h3') {
  return `<div class="empty">${ICON.gem}<${headingTag}>Your bag is empty.</${headingTag}><p class="muted">Find a stone that speaks to you.</p><a class="btn btn-primary" href="index.html#shop">Shop crystals</a></div>`;
}

function renderDrawer() {
  const d = document.getElementById('bag-drawer');
  if (!d) return;
  const ls = bag.lines();
  const n = ls.reduce((s, l) => s + l.qty, 0);
  d.querySelector('#bag-title').textContent = n ? `Your bag (${n})` : 'Your bag';
  const body = d.querySelector('.drawer-body');
  const foot = d.querySelector('.drawer-foot');
  if (!ls.length) {
    body.innerHTML = emptyBag();
    foot.hidden = true;
    return;
  }
  const sub = ls.reduce((s, l) => s + l.price * l.qty, 0);
  body.innerHTML = `<ul class="line-items">${ls.map((l) => lineItem(l)).join('')}</ul>`;
  foot.hidden = false;
  foot.innerHTML = `<div class="row"><span>Subtotal</span><span class="price" style="color:inherit">${fmt(sub)}</span></div>
    <p class="note">Delivery and payment options at checkout.</p>
    <a class="btn btn-primary btn-lg btn-block" href="checkout.html">Checkout</a>
    <button type="button" class="btn btn-ghost btn-block" data-close>Keep shopping</button>
    ${bag.isPersistent() ? '' : '<p class="storage-note">Your bag won’t be saved after you close this tab.</p>'}`;
  if (lastAdded) setTimeout(() => body.querySelector('.line.is-new')?.classList.remove('is-new'), 30);
}

function focusables(root) {
  return [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
}

export function openDrawer(from) {
  const d = document.getElementById('bag-drawer');
  const s = document.querySelector('.scrim');
  opener = from || document.activeElement;
  renderDrawer();
  d.hidden = false;
  s.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    d.classList.add('is-open');
    s.classList.add('is-open');
  });
  d.querySelector('[data-close]').focus();
}

export function closeDrawer() {
  const d = document.getElementById('bag-drawer');
  const s = document.querySelector('.scrim');
  if (!d || d.hidden) return;
  d.classList.remove('is-open');
  s.classList.remove('is-open');
  document.body.style.overflow = '';
  const done = () => { d.hidden = true; s.hidden = true; };
  if (reducedMotion()) done(); else setTimeout(done, 380);
  lastAdded = null;
  if (opener && document.contains(opener)) opener.focus();
}

export function toast(html, { action, onAction, ms = 5000 } = {}) {
  const t = document.querySelector('.toast');
  clearTimeout(undoTimer);
  t.innerHTML = `<span>${html}</span>${action ? `<button type="button">${action}</button>` : ''}`;
  t.classList.add('is-on');
  if (action) t.querySelector('button').addEventListener('click', () => { onAction?.(); t.classList.remove('is-on'); }, { once: true });
  undoTimer = setTimeout(() => t.classList.remove('is-on'), ms);
}

function wireDrawer() {
  const d = document.getElementById('bag-drawer');
  document.querySelector('.scrim').addEventListener('click', closeDrawer);
  d.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.matches('[data-close]')) return closeDrawer();
    const li = t.closest('.line');
    if (!li) return;
    const key = li.dataset.key;
    const l = bag.lines().find((x) => x.key === key);
    if (!l) return;
    if (t.matches('[data-inc]')) bag.setQty(key, l.qty + 1);
    else if (t.matches('[data-dec]')) bag.setQty(key, l.qty - 1);
    else if (t.matches('[data-remove]')) {
      const restore = bag.remove(key);
      toast(`Removed ${esc(l.crystal.name)}`, { action: 'Undo', onAction: restore });
      d.querySelector('[data-close]').focus();
      return;
    }
    const again = d.querySelector(`.line[data-key="${key}"] ${t.matches('[data-inc]') ? '[data-inc]' : '[data-dec]'}`);
    (again && !again.disabled ? again : d.querySelector(`.line[data-key="${key}"] .val`)?.closest('.stepper')?.querySelector('button:not([disabled])'))?.focus();
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); }
    if (e.key !== 'Tab') return;
    const f = focusables(d);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

function paintCount(bump = false) {
  const n = bag.count();
  document.querySelectorAll('.bag-count').forEach((el) => {
    el.textContent = n > 99 ? '99+' : String(n);
    el.hidden = n === 0;
    if (bump && !reducedMotion()) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  });
  document.querySelectorAll('.bag-btn').forEach((b) => b.setAttribute('aria-label', n ? `Bag, ${n} item${n === 1 ? '' : 's'}` : 'Bag, empty'));
}

/** Add to the bag, bump the badge and open the drawer. */
export function addAndShow(slug, format, qty, from) {
  lastAdded = bag.add(slug, format, qty);
  paintCount(true);
  openDrawer(from);
}

/** Mount chrome on every page. `active` marks the nav item. */
export function mount(active = '') {
  const t = storedTheme();
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  document.body.insertAdjacentHTML('afterbegin', header(active));
  document.querySelector('main')?.insertAdjacentHTML('afterend', footer());
  document.body.insertAdjacentHTML('beforeend', drawerShell());
  watchBrokenImages();

  const themeBtn = document.querySelector('.theme-btn');
  paintThemeButton(themeBtn);
  themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('mc.theme', next); } catch { /* theme still applies for this visit */ }
    paintThemeButton(themeBtn);
  });

  const menuBtn = document.querySelector('.menu-btn');
  const sheet = document.getElementById('menu-sheet');
  const setMenu = (open) => { sheet.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.innerHTML = open ? ICON.close : ICON.menu; menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Menu'); };
  menuBtn.addEventListener('click', () => setMenu(sheet.hidden));
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) { setMenu(false); menuBtn.focus(); } });

  const hdr = document.querySelector('.site-header');
  const onScroll = () => hdr.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  document.querySelector('.bag-btn').addEventListener('click', (e) => openDrawer(e.currentTarget));
  wireDrawer();
  paintCount();
  document.addEventListener('bag:change', () => { paintCount(); if (!document.getElementById('bag-drawer').hidden) renderDrawer(); });
  addEventListener('storage', (e) => { if (e.key === 'mc.bag.v1') { paintCount(); document.dispatchEvent(new CustomEvent('bag:external')); } });
}

/** A shop-grid card: photo and name both link to the product page. */
export function card(c, headingLevel = 3) {
  const h = `h${headingLevel}`;
  return `<li data-slug="${c.slug}" data-tags="${c.tags.join(' ').toLowerCase()}">
    <article class="card">
      <a class="mat" href="product.html?c=${c.slug}" tabindex="-1" aria-hidden="true">${framedPhoto(c)}</a>
      <div class="card-body">
        <${h}><a href="product.html?c=${c.slug}">${esc(c.name)}</a></${h}>
        <p class="meaning">${esc(c.meaning)}</p>
        <ul class="tags" aria-label="Intentions">${c.tags.map((t) => `<li class="tag">${t}</li>`).join('')}</ul>
        <div class="card-foot"><span class="price">From ${fmt(fromPrice(c), { whole: true })}</span><span class="view" aria-hidden="true">View options →</span></div>
      </div>
    </article>
  </li>`;
}

export { FORMATS };

