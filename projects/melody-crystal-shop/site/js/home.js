// home.js — hero trio, meanings list, shop grid with intention filter, format strip.
import { CRYSTALS, FORMATS, INTENTIONS, bySlug, tagCounts, img } from '../data/crystals.js';
import { mount, ICON, esc, framedPhoto, formatArt, reducedMotion, card } from './ui.js';

mount('shop');

// Decorative icons declared in markup.
document.querySelectorAll('[data-icon]').forEach((el) => {
  const svg = ICON[el.dataset.icon];
  if (el.tagName === 'SPAN') el.outerHTML = svg; else el.insertAdjacentHTML('afterbegin', svg);
});

// ── Hero trio ─────────────────────────────────────────────────────────────
const trio = [['amethyst', 't1', 1200], ['rose-quartz', 't2', 480], ['citrine', 't3', 480]];
document.querySelector('[data-trio]').innerHTML = trio.map(([slug, cls, size], i) => {
  const c = bySlug(slug);
  return `<a class="mat ${cls} rise" style="--i:${i + 1}" href="product.html?c=${slug}">
    ${framedPhoto(c, { size, eager: i === 0 })}<span class="label">${esc(c.name)}</span></a>`;
}).join('');

// ── Meanings ──────────────────────────────────────────────────────────────
document.querySelector('[data-meanings]').innerHTML = CRYSTALS.map((c) => `
  <li><a class="meaning-row" href="product.html?c=${c.slug}">
    <span class="thumb"><img src="${img(c.photos[0], 480)}" alt="" style="object-position:${c.focus}" loading="lazy" decoding="async"></span>
    <div><h3>${esc(c.name)}</h3><p>${esc(c.meaning)}</p></div>
    ${ICON.chev}
  </a></li>`).join('');

// ── Shop grid ─────────────────────────────────────────────────────────────
const grid = document.querySelector('[data-grid]');
grid.innerHTML = CRYSTALS.map((c) => card(c)).join('');

const counts = tagCounts();
const chipsEl = document.querySelector('[data-chips]');
const intentions = INTENTIONS.filter((t) => counts[t] > 0).sort((a, b) => counts[b] - counts[a]);
chipsEl.innerHTML = [`<button type="button" class="chip" data-i="" aria-pressed="true">All <span class="n">${CRYSTALS.length}</span></button>`]
  .concat(intentions.map((t) => `<button type="button" class="chip" data-i="${t.toLowerCase()}" aria-pressed="false">${t} <span class="n">${counts[t]}</span></button>`))
  .join('');
const status = document.querySelector('[data-status]');

function applyFilter(intent, { animate = true } = {}) {
  const valid = intentions.map((t) => t.toLowerCase());
  const i = valid.includes(intent) ? intent : '';
  chipsEl.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.i === i)));
  const items = [...grid.children];
  const first = new Map(items.map((li) => [li, li.getBoundingClientRect()]));
  let shown = 0;
  for (const li of items) {
    const on = !i || li.dataset.tags.split(' ').includes(i);
    li.hidden = !on;
    if (on) shown++;
  }
  // FLIP: slide survivors from where they were to where they are.
  if (animate && !reducedMotion()) {
    for (const li of items) {
      if (li.hidden) continue;
      const a = first.get(li), b = li.getBoundingClientRect();
      if (!a.width) { li.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }); continue; }
      const dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) li.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
  }
  const label = i ? intentions.find((t) => t.toLowerCase() === i) : '';
  status.textContent = i ? `${shown} crystal${shown === 1 ? '' : 's'} for ${label}` : `Showing all ${shown} crystals`;
  return i;
}

function intentFromHash() {
  const m = /^#shop\?i=([a-z]+)$/.exec(location.hash);
  return m ? m[1] : '';
}

chipsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  const i = applyFilter(b.dataset.i);
  history.replaceState(null, '', i ? `#shop?i=${i}` : '#shop');
});

const initial = intentFromHash();
applyFilter(initial, { animate: false });
if (initial) {
  document.getElementById('shop').scrollIntoView();
  const chip = chipsEl.querySelector('[aria-pressed="true"]');
  chipsEl.scrollLeft = chip.offsetLeft - chipsEl.clientWidth / 2 + chip.offsetWidth / 2;
}
addEventListener('hashchange', () => {
  const i = intentFromHash();
  if (i || location.hash === '#shop') applyFilter(i);
});

// ── Formats strip ─────────────────────────────────────────────────────────
document.querySelector('[data-formats]').innerHTML = FORMATS.map((f) => `
  <div class="format-card">${formatArt(f.id, f.id === 'big' ? '#c9b6e0' : f.id === 'bag' ? '#e6a9b4' : '#e0a63a')}
    <div><h4>${esc(f.name)}</h4><p>${esc(f.size)}. ${esc(f.blurb)}</p></div></div>`).join('');
