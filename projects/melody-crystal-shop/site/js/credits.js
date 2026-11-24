// credits.js — lists every photo with its author, licence and source.
import { CREDITS } from '../data/credits.js';
import { CRYSTALS, img } from '../data/crystals.js';
import { mount, esc } from './ui.js';
import { reveal } from './motion.js';

mount('');
const owner = (id) => CRYSTALS.find((c) => c.photos.includes(id));
const safeUrl = (u) => (/^https:\/\//.test(u) ? u : '');
document.querySelector('[data-credits]').innerHTML = CREDITS.filter((cr) => owner(cr.id)).map((cr) => {
  const c = owner(cr.id);
  const lic = safeUrl(cr.licenceUrl) ? `<a href="${esc(cr.licenceUrl)}" rel="license noopener" target="_blank">${esc(cr.licence)}</a>` : esc(cr.licence);
  return `<li><span class="thumb"><img src="${img(cr.id, 480)}" alt="" loading="lazy"></span>
    <span><b>${esc(c.name)}</b>Photo by ${esc(cr.author)} · ${lic} · ${esc(cr.modified)} ·
    <a href="${esc(safeUrl(cr.source))}" rel="noopener" target="_blank">source<span class="visually-hidden"> for ${esc(c.name)} photo (opens in a new tab)</span></a></span></li>`;
}).join('');
reveal(document);
