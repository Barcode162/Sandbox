import test from 'node:test';
import assert from 'node:assert/strict';
import { fmt, installments, totals, fulfilmentFee, schedule } from '../../site/js/money.js';
import { luhn, cardBrand, formatCardNumber, checkCardNumber, checkExpiry, formatExpiry, cvcLength, caretAfterFormat, orderNumber, formatGiftCode } from '../../site/js/payment.js';

test('fmt formats whole cents', () => {
  assert.equal(fmt(1600), '$16.00');
  assert.equal(fmt(1600, { whole: true }), '$16');
  assert.equal(fmt(1583, { whole: true }), '$15.83');
  assert.equal(fmt(1234567), '$12,345.67');
  assert.equal(fmt(5), '$0.05');
});

test('installments sum exactly and put the remainder on payment 1', () => {
  for (const total of [0, 1, 3, 4, 9999, 13900, 10001, 123457]) {
    const p = installments(total);
    assert.equal(p.length, 4);
    assert.equal(p.reduce((a, b) => a + b, 0), total);
    assert.ok(p[0] >= p[1] && p[1] === p[2] && p[2] === p[3]);
    assert.ok(p[0] - p[1] < 4);
  }
  assert.deepEqual(installments(10001), [2501, 2500, 2500, 2500]);
  assert.throws(() => installments(10.5));
});

test('fees: delivery $5 free over $75, shipping $8 free over $100, pickup free', () => {
  assert.deepEqual(fulfilmentFee('delivery', 7500), { fee: 500, waived: false, base: 500 });
  assert.deepEqual(fulfilmentFee('delivery', 7501), { fee: 0, waived: true, base: 500 });
  assert.equal(fulfilmentFee('shipping', 10000).fee, 800);
  assert.equal(fulfilmentFee('shipping', 10001).fee, 0);
  assert.equal(fulfilmentFee('pickup', 100).fee, 0);
  const t = totals([{ price: 1600, qty: 2 }], 'shipping', 'over-time');
  assert.equal(t.total, 4000);
  assert.deepEqual(t.parts, [1000, 1000, 1000, 1000]);
  assert.equal(t.dueToday, 1000);
});

test('schedule is today then every 14 days', () => {
  const d = schedule(new Date(2026, 10, 23));
  assert.deepEqual(d.map((x) => [x.getMonth(), x.getDate()]), [[10, 23], [11, 7], [11, 21], [0, 4]]);
});

test('Luhn and brands', () => {
  assert.ok(luhn('4242 4242 4242 4242'));
  assert.ok(!luhn('4242 4242 4242 4241'));
  assert.equal(cardBrand('4'), 'visa');
  assert.equal(cardBrand('37'), 'amex');
  assert.equal(cardBrand('2221'), 'mastercard');
  assert.equal(cardBrand('5555'), 'mastercard');
  assert.equal(cardBrand('6011'), 'discover');
  assert.equal(cardBrand('9'), null);
  assert.equal(checkCardNumber('4242424242424242'), 'ok');
  assert.equal(checkCardNumber('378282246310005'), 'ok');
  assert.equal(checkCardNumber('4242424242424241'), 'invalid');
  assert.equal(checkCardNumber('9999999999999995'), 'brand');
  assert.equal(checkCardNumber(''), 'empty');
  assert.equal(cvcLength('amex'), 4);
  assert.equal(cvcLength('visa'), 3);
});

test('card number grouping and caret mapping', () => {
  assert.equal(formatCardNumber('4242424242424242999'), '4242 4242 4242 4242');
  assert.equal(formatCardNumber('378282246310005'), '3782 822463 10005');
  assert.equal(caretAfterFormat('4242 4242', 5), 6);
  assert.equal(caretAfterFormat('4242 4242', 4), 4);
  assert.equal(formatGiftCode('12345678abcd90123456'), '1234 5678 9012 3456');
});

test('expiry', () => {
  const now = new Date(2026, 10, 23);
  assert.equal(checkExpiry('11 / 26', now), 'ok');
  assert.equal(checkExpiry('10 / 26', now), 'expired');
  assert.equal(checkExpiry('13 / 30', now), 'format');
  assert.equal(checkExpiry('1/2', now), 'format');
  assert.equal(formatExpiry('4'), '04 / ');
  assert.equal(formatExpiry('1'), '1');
  assert.equal(formatExpiry('1228'), '12 / 28');
  assert.equal(formatExpiry('12', true), '12');
});

test('order numbers avoid 0/O/1/I', () => {
  for (let i = 0; i < 500; i++) assert.match(orderNumber(), /^MC-[2-9A-HJ-NP-Z]{6}$/);
});

test('review fixes: 2-series Mastercard range and far-future expiry', () => {
  assert.equal(cardBrand('2220'), null);
  assert.equal(cardBrand('2221'), 'mastercard');
  assert.equal(cardBrand('2720'), 'mastercard');
  assert.equal(cardBrand('2721'), null);
  assert.equal(checkExpiry('12 / 99', new Date(2026, 10, 23)), 'format');
});
