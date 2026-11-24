// checkout.js — contact, fulfilment, payment, plan, summary, validation and confirmation.
// PREVIEW: nothing here charges a card or leaves the browser. Card fields are validated and then
// discarded; see README § "Going live with payments" for connecting a real processor.
import * as bag from './bag.js';
import { fmt, totals, schedule, SHORT_DATE, FULFILMENT, fulfilmentFee } from './money.js';
import { checkCardNumber, cardBrand, BRAND_LABEL, cvcLength, formatCardNumber, caretAfterFormat, digits, formatExpiry, checkExpiry, formatGiftCode, orderNumber } from './payment.js';
import { mount, ICON, esc, lineItem, emptyBag, openDrawer } from './ui.js';
import * as motion from './motion.js';

mount('');
const main = document.querySelector('[data-checkout]');

const PAY = {
  credit: { label: 'Credit card', icon: 'card', sub: 'Visa, Mastercard, Amex, Discover' },
  debit: { label: 'Debit card', icon: 'card', sub: 'Visa, Mastercard, Amex, Discover' },
  gift: { label: 'Gift card', icon: 'gift', sub: 'A Melody’s Crystals gift card' },
  person: { label: 'Pay in person', icon: 'cash', sub: 'Cash or card at pickup or delivery' },
};
const FUL_SUB = {
  delivery: 'Within about 15 miles · free over $75',
  shipping: '3–5 business days · free over $100',
  pickup: 'I’ll text you when it’s ready',
};

const field = (id, label, { type = 'text', ac, hint = '', attrs = '', badge = false } = {}) => `
  <div class="field" data-field="${id}">
    <label for="${id}">${label}${hint ? ` <span class="hint">${hint}</span>` : ''}</label>
    <div class="input-wrap">
      <input class="input${badge ? ' has-brand' : ''}" id="${id}" name="${id}" type="${type}" ${ac ? `autocomplete="${ac}"` : ''} aria-describedby="${id}-err" ${attrs}>
      ${badge ? '<span class="brand-badge" hidden></span>' : ''}
    </div>
    <p class="field-error" id="${id}-err" hidden>${ICON.alert}<span></span></p>
  </div>`;

const choice = (name, value, title, sub, right = '', extra = '') => `
  <label class="choice" data-motion="choice"><input type="radio" name="${name}" value="${value}" ${extra}>
    <span class="choice-body"><span class="dot"></span><span class="c-title">${title}</span><span class="c-price">${right}</span><span class="c-sub">${sub}</span>${name === 'pay' && value === 'person' ? '<span class="reason" id="person-reason">Not available for shipped orders</span>' : ''}</span>
  </label>`;

function page() {
  return `
  <h1>Checkout</h1>
  <div class="notice" data-motion="notice" role="note">${ICON.lock}<p><strong>Preview checkout.</strong> No card will be charged until Melody connects payments. Your details stay in this browser.</p></div>
  <div data-errors tabindex="-1" style="margin-top:24px"></div>
  <div class="co-grid" style="margin-top:24px">
    <form class="co-form" novalidate>
      <fieldset class="co-step" data-motion="co-step">
        <legend><span class="step-num">1</span>Contact</legend>
        <div class="row-2">${field('name', 'Full name', { ac: 'name' })}${field('email', 'Email', { type: 'email', ac: 'email', attrs: 'inputmode="email"' })}</div>
        ${field('phone', 'Phone', { type: 'tel', ac: 'tel', hint: 'Optional, for pickup or delivery questions', attrs: 'inputmode="tel"' })}
      </fieldset>

      <fieldset class="co-step" data-motion="co-step" data-field="ful" aria-describedby="ful-err">
        <legend><span class="step-num">2</span>How should it reach you?</legend>
        <div class="choice-list">
          ${Object.entries(FULFILMENT).map(([k, f]) => choice('ful', k, `${ICON[k === 'delivery' ? 'truck' : k === 'shipping' ? 'box' : 'pin']}${f.label}`, FUL_SUB[k], `<span data-fee="${k}"></span>`)).join('')}
        </div>
        <p class="field-error" id="ful-err" hidden>${ICON.alert}<span></span></p>
        <div class="reveal" data-address hidden>
          ${field('street', 'Street address', { ac: 'address-line1' })}
          ${field('apt', 'Apartment, suite, etc.', { ac: 'address-line2', hint: 'Optional' })}
          <div class="row-3">${field('city', 'City', { ac: 'address-level2' })}${field('state', 'State', { ac: 'address-level1', attrs: 'maxlength="2" autocapitalize="characters"' })}${field('zip', 'ZIP code', { ac: 'postal-code', attrs: 'inputmode="numeric" maxlength="5"' })}</div>
        </div>
        <p class="info-line" data-pickup-info hidden>${ICON.info}<span>Pickup is by appointment. I’ll message you to arrange a time.</span></p>
      </fieldset>

      <fieldset class="co-step" data-motion="co-step" data-field="pay" aria-describedby="pay-err">
        <legend><span class="step-num">3</span>How would you like to pay?</legend>
        <div class="choice-list cols">
          ${Object.entries(PAY).map(([k, p]) => choice('pay', k, `${ICON[p.icon]}${p.label}`, p.sub)).join('')}
        </div>
        <p class="field-error" id="pay-err" hidden>${ICON.alert}<span></span></p>
        <p class="visually-hidden" aria-live="polite" data-pay-live></p>
        <fieldset class="reveal" data-card hidden>
          <legend data-card-legend style="margin-top:8px">Card details</legend>
          <div style="display:grid;gap:16px">
            ${field('cc-number', 'Card number', { ac: 'cc-number', attrs: 'inputmode="numeric" placeholder="1234 1234 1234 1234"', badge: true })}
            ${field('cc-name', 'Name on card', { ac: 'cc-name' })}
            <div class="row-3">${field('cc-exp', 'Expiry', { ac: 'cc-exp', attrs: 'inputmode="numeric" placeholder="MM / YY" maxlength="7"' })}${field('cc-csc', 'CVC', { ac: 'cc-csc', attrs: 'inputmode="numeric" maxlength="4"' })}${field('cc-zip', 'Billing ZIP', { ac: 'billing postal-code', attrs: 'inputmode="numeric" maxlength="5"' })}</div>
          </div>
        </fieldset>
        <fieldset class="reveal" data-gift hidden>
          <legend style="margin-top:8px">Gift card details</legend>
          <div class="row-3" style="grid-template-columns:2fr 1fr">${field('gift-code', 'Gift card code', { attrs: 'inputmode="numeric" placeholder="1234 5678 9012 3456" autocomplete="off"' })}${field('gift-pin', 'PIN', { attrs: 'inputmode="numeric" maxlength="4" autocomplete="off"' })}</div>
        </fieldset>
        <p class="info-line" data-person-info hidden>${ICON.info}<span data-person-text></span></p>
      </fieldset>

      <fieldset class="co-step" data-motion="co-step">
        <legend><span class="step-num">4</span>Pay all at once, or over time?</legend>
        <div class="choice-list">
          ${choice('plan', 'full', 'Pay in full', 'One payment today', '<span data-plan-full></span>', 'checked')}
          ${choice('plan', 'over-time', 'Pay over time', '4 equal payments: one today, then every 2 weeks. No fees.', '<span data-plan-over></span>')}
        </div>
        <div class="reveal" data-schedule hidden>
          <dl class="plan-schedule" data-schedule-list></dl>
        </div>
      </fieldset>

      <div class="place">
        <button class="btn btn-primary btn-lg btn-block" type="submit" data-place>Place order</button>
        <p class="footnote" style="text-align:center">By placing this order you agree to be contacted about it. No sales tax is added in this preview.</p>
      </div>
    </form>

    <div class="summary-col">
      <button class="summary-toggle" type="button" aria-expanded="false" aria-controls="order-summary"><span data-toggle-label>Show order summary</span>${ICON.down}</button>
      <aside class="summary" id="order-summary" data-collapsible aria-labelledby="sum-title"></aside>
    </div>
  </div>`;
}

function renderEmpty() {
  main.innerHTML = `<h1>Checkout</h1>${emptyBag('h2')}`;
}

const lines = () => bag.lines();
let state = { ful: '', pay: '', plan: 'full' };
const teardown = new AbortController(); // listeners that must stop once the order is placed
const touched = new Set();
let submitted = false;

if (!lines().length) renderEmpty();
else start();

function start() {
  const signal = teardown.signal;
  main.innerHTML = page();
  const form = main.querySelector('form');
  const $ = (s) => main.querySelector(s);

  // Summary toggle (mobile)
  const toggle = $('.summary-toggle');
  const summary = $('#order-summary');
  const mq = matchMedia('(min-width: 1024px)');
  const setSummary = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    summary.style.display = open || mq.matches ? '' : 'none';
    renderSummary();
  };
  toggle.addEventListener('click', () => setSummary(toggle.getAttribute('aria-expanded') !== 'true'));
  mq.addEventListener('change', () => setSummary(toggle.getAttribute('aria-expanded') === 'true'), { signal });
  setSummary(false);

  // With pay-in-person, the first payment happens at the handover, not today.
  const firstDue = () => (state.pay === 'person' ? (state.ful === 'delivery' ? 'at delivery' : 'at pickup') : 'today');
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

  function renderSummary() {
    const ls = lines();
    const t = totals(ls, state.ful, state.plan);
    const feeCell = !state.ful
      ? '<span class="muted">Choose below</span>'
      : t.waived ? `<span class="free"><s>${fmt(t.baseFee)}</s>Free</span>`
        : t.fee === 0 ? '<span class="free">Free</span>' : fmt(t.fee);
    const before = motion.snapshot(summary);
    summary.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><h2 id="sum-title">Order summary</h2><button type="button" class="btn-quiet" data-edit-bag>Edit bag</button></div>
      <ul class="line-items">${ls.map((l) => lineItem(l, { editable: false })).join('')}</ul>
      <dl class="sum-rows">
        <div><dt>Subtotal</dt><dd data-roll="sub">${fmt(t.subtotal)}</dd></div>
        <div><dt>${state.ful ? esc(FULFILMENT[state.ful].label) : 'Delivery'}</dt><dd>${feeCell}</dd></div>
        <div class="total"><dt>Total</dt><dd data-roll="total">${fmt(t.total)}</dd></div>
        ${state.plan === 'over-time' ? `<div class="today"><dt>Due ${firstDue()}</dt><dd data-roll="today">${fmt(t.dueToday)}</dd></div>` : ''}
      </dl>
      <p class="footnote">No sales tax is added in this preview.</p>`;
    summary.querySelector('[data-edit-bag]').addEventListener('click', (e) => openDrawer(e.currentTarget));
    motion.rollChanged(summary, before);
    $('[data-toggle-label]').textContent = `${toggle.getAttribute('aria-expanded') === 'true' ? 'Hide' : 'Show'} order summary · ${fmt(t.total)}`;
    return t;
  }

  // A step's number turns brass and pops the moment that step is complete.
  function paintSteps() {
    const done = [RULES.name() === '' && RULES.email() === '', !!state.ful, !!state.pay, true];
    form.querySelectorAll('.co-step > legend .step-num').forEach((n, i) => {
      if (done[i] && !n.classList.contains('done')) { n.classList.add('done'); motion.pop(n, { from: 0.8 }); }
      else if (!done[i]) n.classList.remove('done');
    });
  }

  function renderMoney() {
    const t = renderSummary();
    const sub = t.subtotal;
    for (const k of Object.keys(FULFILMENT)) {
      const f = fulfilmentFee(k, sub);
      $(`[data-fee="${k}"]`).innerHTML = f.base === 0 ? 'Free' : f.waived ? `<span class="free"><s>${fmt(f.base)}</s>Free</span>` : fmt(f.fee);
    }
    // Plan choices show the real numbers for the current total.
    const full = totals(lines(), state.ful, 'full');
    const over = totals(lines(), state.ful, 'over-time');
    $('[data-plan-full]').textContent = `${fmt(full.total)} ${firstDue()}`;
    form.querySelector('input[name=plan][value=full] + .choice-body .c-sub').textContent = `One payment ${firstDue()}`;
    form.querySelector('input[name=plan][value=over-time] + .choice-body .c-sub').textContent = `4 equal payments: one ${firstDue()}, then every 2 weeks. No fees.`;
    $('[data-plan-over]').textContent = `4 × ${fmt(over.parts[1])}`;
    const dates = schedule(new Date());
    $('[data-schedule-list]').innerHTML = over.parts.map((p, i) => `<div><dt>${i === 0 ? cap(firstDue()) : SHORT_DATE.format(dates[i])}</dt><dd>${fmt(p)}</dd></div>`).join('');
    $('[data-schedule]').hidden = state.plan !== 'over-time';
    paintSteps();
    const btn = $('[data-place]');
    if (!btn.dataset.busy) btn.textContent = state.pay === 'person'
      ? `Place order · pay ${fmt(t.dueToday)} ${firstDue()}`
      : state.plan === 'over-time' ? `Place order · ${fmt(t.dueToday)} today` : `Place order · ${fmt(t.total)}`;
  }

  function syncChoices() {
    state.ful = form.ful.value;
    state.plan = form.plan.value;
    const personRadio = form.querySelector('input[name="pay"][value="person"]');
    const shipping = state.ful === 'shipping';
    personRadio.disabled = shipping;
    if (shipping) personRadio.setAttribute('aria-describedby', 'person-reason'); else personRadio.removeAttribute('aria-describedby');
    if (shipping && personRadio.checked) {
      personRadio.checked = false;
      $('[data-pay-live]').textContent = 'Pay in person isn’t available for shipping. Choose another way to pay.';
      showError('pay', 'Pay in person isn’t available for shipping. Choose another way to pay.');
    }
    state.pay = form.pay.value;
    $('[data-address]').hidden = !(state.ful === 'delivery' || state.ful === 'shipping');
    $('[data-pickup-info]').hidden = state.ful !== 'pickup';
    const isCard = state.pay === 'credit' || state.pay === 'debit';
    $('[data-card]').hidden = !isCard;
    $('[data-card-legend]').textContent = state.pay === 'debit' ? 'Debit card details' : 'Credit card details';
    $('[data-gift]').hidden = state.pay !== 'gift';
    $('[data-person-info]').hidden = state.pay !== 'person';
    $('[data-person-text]').textContent = state.ful === 'delivery' ? 'Pay cash or card when I deliver.' : state.ful === 'pickup' ? 'Pay cash or card when you collect.' : 'Pay cash or card when you collect, or when I deliver.';
    renderMoney();
  }

  form.addEventListener('change', (e) => {
    if (['ful', 'pay', 'plan'].includes(e.target.name)) {
      syncChoices();
      if (e.target.name === 'ful' || e.target.name === 'pay') validate(e.target.name);
    }
  });

  // ── Formatting as you type ──────────────────────────────────────────────
  const ccNum = $('#cc-number');
  const brandBadge = ccNum.parentElement.querySelector('.brand-badge');
  ccNum.addEventListener('input', () => {
    const pos = ccNum.selectionStart ?? ccNum.value.length;
    const before = digits(ccNum.value.slice(0, pos)).length;
    const f = formatCardNumber(ccNum.value);
    if (f !== ccNum.value) {
      ccNum.value = f;
      const p = caretAfterFormat(f, before);
      ccNum.setSelectionRange(p, p);
    }
    const b = cardBrand(f);
    if (b && b !== brandBadge.dataset.brand && !brandBadge.hidden) motion.pop(brandBadge, { from: 0.6, duration: 300 });
    brandBadge.dataset.brand = b || '';
    brandBadge.hidden = !b;
    brandBadge.textContent = b ? BRAND_LABEL[b] : '';
    $('#cc-csc').maxLength = cvcLength(b);
  });
  const exp = $('#cc-exp');
  let lastExp = '';
  exp.addEventListener('input', (e) => {
    const deleting = e.inputType?.startsWith('delete');
    let v = exp.value;
    // Backspacing over " / " removes the separator and the month digit before it.
    if (deleting && lastExp.endsWith(' / ') && v === lastExp.slice(0, -1)) v = lastExp.slice(0, 1);
    exp.value = formatExpiry(v, deleting);
    lastExp = exp.value;
  });
  for (const id of ['cc-csc', 'cc-zip', 'zip', 'gift-pin']) $(`#${id}`).addEventListener('input', (e) => { e.target.value = digits(e.target.value).slice(0, Number(e.target.maxLength) || 5); });
  $('#gift-code').addEventListener('input', (e) => { e.target.value = formatGiftCode(e.target.value); });
  $('#state').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2); });

  // ── Validation ─────────────────────────────────────────────────────────
  const val = (id) => ($(`#${id}`)?.value ?? '').trim();
  const RULES = {
    name: () => (val('name').length < 2 ? 'Please add your name.' : ''),
    email: () => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email')) ? '' : 'That email looks incomplete. Try name@example.com.'),
    phone: () => (!val('phone') || digits(val('phone')).length >= 10 ? '' : 'Phone numbers have at least 10 digits.'),
    ful: () => (state.ful ? '' : 'Choose how you’d like your order.'),
    street: () => (needsAddress() && val('street').length < 4 ? `We need a street address to ${state.ful === 'shipping' ? 'ship to' : 'deliver'}.` : ''),
    city: () => (needsAddress() && !val('city') ? 'Please add a city.' : ''),
    state: () => (needsAddress() && !/^[A-Z]{2}$/.test(val('state')) ? 'Use the 2-letter state code, like CA.' : ''),
    zip: () => (needsAddress() && !/^\d{5}$/.test(val('zip')) ? 'ZIP codes are 5 digits.' : ''),
    pay: () => (state.pay ? '' : 'Choose a way to pay.'),
    'cc-number': () => {
      if (!isCard()) return '';
      const r = checkCardNumber(val('cc-number'));
      return r === 'ok' ? '' : r === 'brand' ? 'We accept Visa, Mastercard, Amex and Discover.' : r === 'empty' ? 'Please enter your card number.' : 'That card number doesn’t look right. Check the digits.';
    },
    'cc-name': () => (isCard() && val('cc-name').length < 2 ? 'Add the name printed on the card.' : ''),
    'cc-exp': () => {
      if (!isCard()) return '';
      const r = checkExpiry(val('cc-exp'));
      return r === 'ok' ? '' : r === 'expired' ? 'That card has expired.' : 'Use MM / YY.';
    },
    'cc-csc': () => {
      if (!isCard()) return '';
      const amex = cardBrand(val('cc-number')) === 'amex';
      return digits(val('cc-csc')).length === cvcLength(amex ? 'amex' : null) ? '' : amex ? 'Enter the 4-digit code on the front.' : 'Enter the 3-digit code on the back.';
    },
    'cc-zip': () => (isCard() && !/^\d{5}$/.test(val('cc-zip')) ? 'ZIP codes are 5 digits.' : ''),
    'gift-code': () => (state.pay === 'gift' && digits(val('gift-code')).length !== 16 ? 'Gift card codes are 16 digits.' : ''),
    'gift-pin': () => (state.pay === 'gift' && !/^\d{4}$/.test(val('gift-pin')) ? 'PINs are 4 digits.' : ''),
  };
  const LABEL = { name: 'Full name', email: 'Email', phone: 'Phone', ful: 'Delivery', street: 'Street address', city: 'City', state: 'State', zip: 'ZIP code', pay: 'Payment', 'cc-number': 'Card number', 'cc-name': 'Name on card', 'cc-exp': 'Expiry', 'cc-csc': 'CVC', 'cc-zip': 'Billing ZIP', 'gift-code': 'Gift card code', 'gift-pin': 'PIN' };
  function needsAddress() { return state.ful === 'delivery' || state.ful === 'shipping'; }
  function isCard() { return state.pay === 'credit' || state.pay === 'debit'; }

  function showError(id, msg) {
    const err = $(`#${id}-err`);
    if (!err) return;
    err.hidden = !msg;
    err.querySelector('span').textContent = msg;
    const input = $(`#${id}`);
    if (input) input.setAttribute('aria-invalid', String(!!msg));
  }
  function validate(id) {
    const msg = RULES[id]();
    showError(id, msg);
    return msg;
  }
  // Fields shake once when an error first appears on leaving them; never while typing.
  form.addEventListener('focusout', (e) => {
    const id = e.target.id;
    if (!RULES[id] || !e.target.value) return;
    touched.add(id);
    const wasOk = $(`#${id}-err`)?.hidden !== false;
    if (validate(id) && wasOk) motion.shake(e.target);
  });
  form.addEventListener('input', (e) => {
    const id = e.target.id;
    if (id === 'name' || id === 'email') paintSteps();
    if (RULES[id] && (touched.has(id) || submitted)) validate(id);
  });

  // ── Submit ─────────────────────────────────────────────────────────────
  const errorsBox = $('[data-errors]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitted = true;
    syncChoices();
    const problems = Object.keys(RULES).map((id) => [id, validate(id)]).filter(([, m]) => m);
    if (problems.length) {
      errorsBox.innerHTML = `<div class="error-summary" data-motion="err-sum" role="alert"><h2>Please fix ${problems.length === 1 ? '1 thing' : `${problems.length} things`} before placing your order</h2>
        <ul>${problems.map(([id, m]) => `<li><a href="#${id === 'ful' || id === 'pay' ? `${id}-first` : id}" data-target="${id}">${esc(LABEL[id])}: ${esc(m)}</a></li>`).join('')}</ul></div>`;
      errorsBox.focus();
      problems.forEach(([id], n) => {
        const el = id === 'ful' || id === 'pay' ? form.querySelector(`[data-field="${id}"] .choice-list`) : $(`#${id}`);
        setTimeout(() => motion.shake(el), n * 60);
      });
      return;
    }
    errorsBox.innerHTML = '';
    place();
  });
  errorsBox.addEventListener('click', (e) => {
    const a = e.target.closest('[data-target]');
    if (!a) return;
    e.preventDefault();
    const id = a.dataset.target;
    const el = id === 'ful' || id === 'pay' ? form.querySelector(`input[name="${id}"]:not(:disabled)`) : $(`#${id}`);
    el?.focus();
    el?.scrollIntoView({ block: 'center' });
  });

  function place() {
    const btn = $('[data-place]');
    btn.dataset.busy = '1';
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Placing your order…';
    const t = totals(lines(), state.ful, state.plan);
    const order = {
      no: orderNumber(),
      name: val('name'),
      email: val('email'),
      lines: lines(),
      t,
      ful: state.ful,
      pay: state.pay,
      plan: state.plan,
      brand: cardBrand(val('cc-number')),
      last4: digits(val('cc-number')).slice(-4),
      address: needsAddress() ? `${val('street')}${val('apt') ? `, ${val('apt')}` : ''}, ${val('city')}, ${val('state')} ${val('zip')}` : '',
    };
    // Wipe card fields from the page before moving on; they are never stored.
    for (const id of ['cc-number', 'cc-exp', 'cc-csc', 'gift-code', 'gift-pin']) $(`#${id}`).value = '';
    setTimeout(() => showConfirmation(order), 600);
  }

  syncChoices();
  document.addEventListener('bag:change', () => {
    if (!lines().length) { teardown.abort(); renderEmpty(); } else renderMoney();
  }, { signal });
}

function showConfirmation(o) {
  teardown.abort();
  bag.clear();
  const first = o.name.split(/\s+/)[0];
  const payText = o.pay === 'person' ? 'Pay in person'
    : o.pay === 'gift' ? 'Gift card'
      : `${o.pay === 'debit' ? 'Debit' : 'Credit'} card${o.brand ? ` · ${BRAND_LABEL[o.brand]}` : ''} ending ${o.last4}`;
  const when = o.pay === 'person' ? (o.ful === 'delivery' ? 'at delivery' : 'at pickup') : 'today';
  const planText = o.plan === 'over-time' ? `4 payments of ${o.t.parts[0] === o.t.parts[1] ? '' : 'about '}${fmt(o.t.parts[1])} · ${fmt(o.t.dueToday)} ${when}` : `${o.pay === 'person' ? 'In full' : 'Paid in full'} · ${fmt(o.t.total)}${o.pay === 'person' ? ` ${when}` : ''}`;
  const fulText = `${FULFILMENT[o.ful].label}${o.address ? ` to ${o.address}` : o.ful === 'pickup' ? ' · I’ll message you to arrange a time' : ''}`;
  document.title = `Order ${o.no} · Melody’s Crystals`;
  main.innerHTML = `<section class="confirm" data-motion="confirm" aria-labelledby="thanks" tabindex="-1">
    <span class="seal-wrap"><span class="seal-clip"></span>${ICON.seal}</span>
    <h1 id="thanks">Thank you, ${esc(first)}!</h1>
    <p class="order-no" aria-label="Order ${o.no}"><span aria-hidden="true">Order ${[...o.no].map((ch, i) => `<span class="ch" style="animation-delay:${300 + i * 25}ms">${ch}</span>`).join('')}</span></p>
    <p class="muted" style="max-width:52ch">This was a preview, so nothing was charged. Melody will be in touch at <strong>${esc(o.email)}</strong>.</p>
    <div class="recap">
      <dl class="recap-facts">
        <div><dt>Getting it</dt><dd>${esc(fulText)}</dd></div>
        <div><dt>Paying</dt><dd>${esc(payText)}</dd></div>
        <div><dt>Plan</dt><dd>${esc(planText)}</dd></div>
      </dl>
      <ul class="line-items">${o.lines.map((l) => lineItem(l, { editable: false })).join('')}</ul>
      <dl class="sum-rows">
        <div><dt>Subtotal</dt><dd>${fmt(o.t.subtotal)}</dd></div>
        <div><dt>${esc(FULFILMENT[o.ful].label)}</dt><dd>${o.t.fee ? fmt(o.t.fee) : o.t.waived ? `<span class="free"><s>${fmt(o.t.baseFee)}</s>Free</span>` : '<span class="free">Free</span>'}</dd></div>
        <div class="total"><dt>Total</dt><dd>${fmt(o.t.total)}</dd></div>
      </dl>
    </div>
    <p class="signoff">With love, Melody</p>
    <a class="btn btn-primary btn-lg" href="index.html#shop">Back to the shop</a>
  </section>`;
  scrollTo({ top: 0, behavior: 'instant' });
  main.querySelector('.confirm').focus({ preventScroll: true });
  const seal = main.querySelector('.seal-wrap');
  motion.burst(seal, o.no);
  setTimeout(() => motion.glint(seal.querySelector('.seal-clip')), 300);
}
