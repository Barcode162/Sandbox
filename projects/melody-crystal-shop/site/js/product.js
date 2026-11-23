// product.js — the marketplace-style listing: gallery, format tiles, quantity, add to bag / buy now.
import { CRYSTALS, FORMATS, bySlug, img } from '../data/crystals.js';
import { fmt } from './money.js';
import * as bag from './bag.js';
import { mount, ICON, esc, framedPhoto, formatScene, addAndShow, card, reducedMotion } from './ui.js';

mount('shop');
const main = document.querySelector('[data-product]');
const slug = new URLSearchParams(location.search).get('c');
const c = bySlug(slug);

if (!c) {
  document.title = 'Crystal not found · Melody’s Crystals';
  main.innerHTML = `<div class="not-found">${ICON.gem}<h1 style="font-size:2.25rem">We couldn’t find that crystal.</h1>
    <p class="muted">It may have sold out or the link may be mistyped.</p><a class="btn btn-primary" href="index.html#shop">Back to the shop</a></div>`;
} else {
  render(c);
}

function listOf(items) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function render(c) {
  document.title = `${c.name} · Melody’s Crystals`;
  document.querySelector('meta[name="description"]').setAttribute('content', `${c.name}: ${c.meaning} Tumbled bag, big crystal or a jar of big crystals, from ${fmt(Math.min(...Object.values(c.prices)), { whole: true })}.`);

  // Gallery slides: every photo of the stone, then a drawn view of each format it comes in.
  const slides = [
    ...c.photos.map((p, i) => ({ kind: 'photo', photo: p, label: i === 0 ? 'Photo' : `Photo ${i + 1}` })),
    ...FORMATS.filter((f) => f.id !== 'big').map((f) => ({ kind: 'format', format: f.id, label: f.short })),
  ];
  const formatSlide = { bag: slides.findIndex((s) => s.format === 'bag'), big: 0, jar: slides.findIndex((s) => s.format === 'jar') };

  const related = CRYSTALS.filter((x) => x.slug !== c.slug)
    .map((x) => ({ x, score: x.tags.filter((t) => c.tags.includes(t)).length }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => r.x);

  main.innerHTML = `
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="index.html#shop">Shop</a></li><li aria-current="page">${esc(c.name)}</li></ol></nav>
  <div class="pdp">
    <section class="gallery" aria-label="${esc(c.name)} pictures">
      <div class="main mat">
        <span class="badge" hidden></span>
        <div class="slide-host">${framedPhoto(c, { size: 1200, eager: true })}</div>
      </div>
      <ul class="thumbs">${slides.map((s, i) => `<li><button type="button" data-slide="${i}" aria-current="${i === 0}" aria-label="${s.label}: show ${s.kind === 'photo' ? `${esc(c.name)} photo` : `${FORMATS.find((f) => f.id === s.format).name.toLowerCase()} view`}">
        ${s.kind === 'photo' ? `<img src="${img(s.photo, 480)}" alt="" style="object-position:${c.focus}" loading="lazy">` : `<span class="illus illus-frame">${formatScene(s.format, img(c.photos[0], 480), c.colour, { label: false })}</span>`}
        <span class="tlabel" aria-hidden="true">${s.label}</span></button></li>`).join('')}</ul>
    </section>

    <section class="buybox" aria-labelledby="pdp-title">
      <div>
        <p class="eyebrow">${esc(c.tags.join(' · '))}</p>
        <h1 id="pdp-title" style="margin-top:8px">${esc(c.name)}</h1>
        <p class="meaning-line">${esc(c.meaning)}</p>
      </div>
      <div class="buy-price" aria-live="polite">
        <span class="price" data-price></span><span class="per" data-per></span>
      </div>
      <ul class="trust">
        <li>${ICON.hand}Hand-picked by Melody</li>
        <li>${ICON.leaf}Cleansed &amp; wrapped</li>
        <li>${ICON.pin}Pickup or local delivery available</li>
      </ul>
      <form class="buy-form" novalidate>
        <fieldset>
          <legend>Choose your format</legend>
          <div class="tiles">
            ${FORMATS.map((f, i) => `<label class="tile"><input type="radio" name="format" value="${f.id}" ${i === 0 ? 'checked' : ''}>
              <span class="tile-body"><span class="t-name">${esc(f.name)}${ICON.check.replace('<svg', '<svg class="check"')}</span><span class="t-size">${esc(f.size)}</span><span class="price">${fmt(c.prices[f.id], { whole: true })}</span></span></label>`).join('')}
          </div>
        </fieldset>
        <div class="qty-row" style="margin-top:20px">
          <span class="label" id="qty-label" style="font-weight:600">Quantity</span>
          <div class="stepper" role="group" aria-labelledby="qty-label">
            <button type="button" data-q="-1" aria-label="Decrease quantity">${ICON.minus}</button>
            <output class="val" data-qty aria-live="polite">1</output>
            <button type="button" data-q="1" aria-label="Increase quantity">${ICON.plus}</button>
          </div>
          <span class="qty-note" data-qty-note></span>
        </div>
        <div class="buy-actions" style="margin-top:20px">
          <button class="btn btn-primary btn-lg btn-block" type="submit" data-add>Add to bag</button>
          <button class="btn btn-ghost btn-lg btn-block" type="button" data-buy>Buy now</button>
        </div>
      </form>
    </section>
  </div>

  <div class="details-sections">
    <div class="prose">
      <h2>What it means</h2>
      <p>${esc(c.meaning)} In crystal tradition, ${esc(c.name)} is associated with ${listOf(c.tags.map((t) => t.toLowerCase()))}, and with the ${esc(c.chakra.toLowerCase())} chakra.</p>
      <h2>How it can help</h2>
      <p>${esc(c.help)} Crystal meanings are tradition and folklore, not medical advice.</p>
      <h2>Which format is right for me?</h2>
      <p>${FORMATS.map((f) => `<strong>${esc(f.name)}:</strong> ${esc(f.blurb)}`).join(' ')}</p>
    </div>
    <aside class="facts" aria-label="${esc(c.name)} at a glance">
      <dl>
        <div><dt>Intentions</dt><dd><ul class="tags" style="margin:0">${c.tags.map((t) => `<li><a class="tag" href="index.html#shop?i=${encodeURIComponent(t.toLowerCase())}">${esc(t)}</a></li>`).join('')}</ul></dd></div>
        <div><dt>Chakra</dt><dd>${esc(c.chakra)}</dd></div>
        <div><dt>Care</dt><dd>${esc(c.care)}</dd></div>
        <div><dt>Every order</dt><dd>Packed by me, with a little card about your stone.</dd></div>
      </dl>
    </aside>
  </div>

  ${related.length ? `<section class="related" aria-labelledby="rel-title"><h2 id="rel-title">You might also like</h2>
    <ul class="product-grid">${related.map((x) => card(x, 3)).join('')}</ul></section>` : ''}

  <div class="mobile-bar" aria-hidden="true" inert>
    <div><div class="mb-name">${esc(c.name)}</div><div class="mb-sub" data-mb-sub></div></div>
    <button class="btn btn-primary" type="button" data-mb-add>Add to bag</button>
  </div>`;

  wire(c, slides, formatSlide);
}

function wire(c, slides, formatSlide) {
  const form = main.querySelector('.buy-form');
  const priceEl = main.querySelector('[data-price]');
  const perEl = main.querySelector('[data-per]');
  const qtyEl = main.querySelector('[data-qty]');
  const noteEl = main.querySelector('[data-qty-note]');
  const addBtn = main.querySelector('[data-add]');
  const dec = main.querySelector('[data-q="-1"]');
  const inc = main.querySelector('[data-q="1"]');
  const mbSub = main.querySelector('[data-mb-sub]');
  let qty = 1;
  let shownPrice = null;
  let addedTimer = 0;

  const format = () => FORMATS.find((f) => f.id === form.format.value);

  function countTo(el, to) {
    const from = shownPrice ?? to;
    shownPrice = to;
    if (from === to || reducedMotion()) { el.textContent = fmt(to, { whole: true }); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 220);
      const e = 1 - (1 - k) ** 3;
      el.textContent = fmt(Math.round((from + (to - from) * e) / 100) * 100, { whole: true });
      if (k < 1 && shownPrice === to) requestAnimationFrame(step);
      else if (shownPrice === to) el.textContent = fmt(to, { whole: true });
    };
    requestAnimationFrame(step);
  }

  function update() {
    const f = format();
    const unit = c.prices[f.id];
    countTo(priceEl, unit);
    const per = Math.round(unit / f.pieces);
    perEl.textContent = f.pieces > 1 ? `About ${fmt(per)} ${f.perLabel}` : 'One statement piece';
    qtyEl.textContent = String(qty);
    dec.disabled = qty <= 1;
    inc.disabled = qty >= bag.MAX_QTY;
    noteEl.textContent = qty >= bag.MAX_QTY ? 'Need more? Message Melody.' : '';
    if (!addBtn.dataset.busy) addBtn.textContent = `Add to bag · ${fmt(unit * qty, { whole: true })}`;
    mbSub.textContent = `${f.name} · ${fmt(unit * qty, { whole: true })}`;
  }

  // Gallery
  const host = main.querySelector('.slide-host');
  const badge = main.querySelector('.gallery .badge');
  let current = 0;
  function show(i) {
    if (i === current || i < 0) return;
    current = i;
    const s = slides[i];
    main.querySelectorAll('.thumbs button').forEach((b) => b.setAttribute('aria-current', String(Number(b.dataset.slide) === i)));
    const swap = () => {
      if (s.kind === 'photo') {
        host.innerHTML = framedPhoto(c, { size: 1200, photo: s.photo, eager: true });
        badge.hidden = true;
      } else {
        const f = FORMATS.find((x) => x.id === s.format);
        host.innerHTML = `<div class="frame"><div class="illus-frame" role="img" aria-label="Illustration: ${esc(c.name)} as a ${esc(f.name.toLowerCase())}">${formatScene(s.format, img(c.photos[0], 480), c.colour)}</div></div>`;
        badge.textContent = f.name;
        badge.hidden = false;
      }
    };
    const el = host.querySelector('img, .illus-frame');
    if (el && !reducedMotion()) { el.style.transition = 'opacity 160ms'; el.style.opacity = '0'; setTimeout(swap, 160); } else swap();
  }
  main.querySelector('.thumbs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-slide]');
    if (b) show(Number(b.dataset.slide));
  });

  form.addEventListener('change', (e) => {
    if (e.target.name !== 'format') return;
    update();
    show(formatSlide[form.format.value]);
  });
  dec.addEventListener('click', () => { qty = Math.max(1, qty - 1); update(); });
  inc.addEventListener('click', () => { qty = Math.min(bag.MAX_QTY, qty + 1); update(); });

  function add(from) {
    addAndShow(c.slug, form.format.value, qty, from);
    addBtn.dataset.busy = '1';
    addBtn.innerHTML = `<span class="added">${ICON.check.replace('<svg', '<svg width="18" height="18"')}Added</span>`;
    clearTimeout(addedTimer);
    addedTimer = setTimeout(() => { delete addBtn.dataset.busy; update(); }, 1200);
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); add(addBtn); });
  main.querySelector('[data-buy]').addEventListener('click', () => {
    bag.add(c.slug, form.format.value, qty);
    location.href = 'checkout.html';
  });

  // Mobile bottom bar once the buy box has scrolled away.
  const bar = main.querySelector('.mobile-bar');
  main.querySelector('[data-mb-add]').addEventListener('click', (e) => add(e.currentTarget));
  new IntersectionObserver(([en]) => {
    const on = !en.isIntersecting && en.boundingClientRect.top < 0;
    bar.classList.toggle('is-on', on);
    bar.toggleAttribute('inert', !on);
    bar.setAttribute('aria-hidden', String(!on));
  }).observe(addBtn);

  update();
}
