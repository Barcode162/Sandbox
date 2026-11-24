// home.js — hero trio, meanings list, shop grid with intention filter, format strip.
import { CRYSTALS, FORMATS, INTENTIONS, bySlug, tagCounts, img, photoStyle } from '../data/crystals.js';
import { mount, ICON, esc, framedPhoto, formatScene, reducedMotion, card } from './ui.js';
import * as motion from './motion.js';

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
  return `<a class="mat ${cls} rise" data-motion="frame" style="--i:${i + 1}" href="product.html?c=${slug}">
    ${framedPhoto(c, { size, eager: i === 0 })}<span class="label">${esc(c.name)}</span></a>`;
}).join('');

// ── Meanings ──────────────────────────────────────────────────────────────
document.querySelector('[data-meanings]').innerHTML = CRYSTALS.map((c) => `
  <li><a class="meaning-row" href="product.html?c=${c.slug}">
    <span class="thumb"><img src="${img(c.photos[0], 480)}" alt="" style="${photoStyle(c)}" loading="lazy" decoding="async"></span>
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
  const keep = (li) => !i || li.dataset.tags.split(' ').includes(i);
  const shown = items.filter(keep).length;
  const label = i ? intentions.find((t) => t.toLowerCase() === i) : '';
  const text = i ? `${shown} crystal${shown === 1 ? '' : 's'} for ${label}` : `Showing all ${shown} crystals`;
  const mutate = () => items.forEach((li) => { li.classList.remove('is-leaving'); li.hidden = !keep(li); });
  if (!animate || reducedMotion()) {
    mutate();
    status.textContent = text;
    return i;
  }
  motion.roll(status, text);
  // Leavers fade and shrink (120 ms), then survivors slide to their new slots and newcomers rise.
  const leaving = items.filter((li) => !li.hidden && !keep(li));
  leaving.forEach((li) => li.classList.add('is-leaving'));
  clearTimeout(applyFilter.t);
  applyFilter.t = setTimeout(() => motion.flip(items, mutate), leaving.length ? 120 : 0);
  return i;
}

function intentFromHash() {
  const m = /^#shop\?i=([a-z]+)$/.exec(location.hash);
  return m ? m[1] : '';
}

const paintFade = () => chipsEl.classList.toggle('is-scrolled', chipsEl.scrollLeft > 4);
chipsEl.addEventListener('scroll', paintFade, { passive: true });
chipsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (b?.getAttribute('aria-pressed') === 'true') return;
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
  paintFade();
}
addEventListener('hashchange', () => {
  const i = intentFromHash();
  if (i || location.hash === '#shop') applyFilter(i);
});

// ── Formats strip ─────────────────────────────────────────────────────────
const FORMAT_PHOTO = { bag: 'rose-quartz', big: 'amethyst', jar: 'citrine' };
document.querySelector('[data-formats]').innerHTML = FORMATS.map((f) => `
  <div class="format-card"><div class="wyg-art">${f.id === 'big'
    ? `<img src="${img(FORMAT_PHOTO.big, 480)}" alt="" style="${photoStyle(bySlug('amethyst'))}" loading="lazy">`
    : formatScene(f.id, img(FORMAT_PHOTO[f.id], 480), bySlug(FORMAT_PHOTO[f.id]).colour)}</div>
    <div><h4>${esc(f.name)}</h4><p>${esc(f.size)}. ${esc(f.blurb)}</p></div></div>`).join('');

// ── Motion: hero glints, the living shimmer, numerals that count up ──────
const trioFrames = [...document.querySelectorAll('.trio .frame')];
if (!motion.reduced()) trioFrames.forEach((f, i) => setTimeout(() => motion.glint(f), 900 + i * 120));
motion.shimmer(trioFrames);
document.querySelectorAll('.steps li').forEach((li, n) => li.addEventListener('revealed', () => motion.countUp(li.querySelector('.num'), n + 1), { once: true }));
document.querySelectorAll('.format-card').forEach((el) => el.setAttribute('data-motion', 'formats'));
document.querySelectorAll('.meaning-row').forEach((el) => el.setAttribute('data-motion', 'meaning-row'));
document.querySelectorAll('.faq details').forEach((el) => el.setAttribute('data-motion', 'faq'));
motion.reveal(document);
