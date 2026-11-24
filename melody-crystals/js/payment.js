// payment.js — card and gift-card helpers. Pure functions; nothing here stores or sends data.

export function digits(s) {
  return String(s ?? '').replace(/\D+/g, '');
}

/** Luhn checksum. */
export function luhn(num) {
  const d = digits(num);
  if (d.length < 12) return false;
  let sum = 0;
  let dbl = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (dbl) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

/** Detect the card brand from the leading digits. Returns null when unknown. */
export function cardBrand(num) {
  const d = digits(num);
  if (/^3[47]/.test(d)) return 'amex';
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/.test(d)) return 'mastercard'; // 2-series: 2221–2720
  if (/^(6011|65|64[4-9]|622)/.test(d)) return 'discover';
  return null;
}

export const BRAND_LABEL = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover' };

/** Expected length of a full card number for a brand. */
export function cardLength(brand) {
  return brand === 'amex' ? 15 : 16;
}

export function cvcLength(brand) {
  return brand === 'amex' ? 4 : 3;
}

/** Group digits for display: Amex 4-6-5, everything else 4-4-4-4. */
export function formatCardNumber(num) {
  const brand = cardBrand(num);
  const d = digits(num).slice(0, cardLength(brand));
  const groups = brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  const out = [];
  let i = 0;
  for (const g of groups) {
    if (i >= d.length) break;
    out.push(d.slice(i, i + g));
    i += g;
  }
  return out.join(' ');
}

/** Map a caret position across a reformat: count digits before the caret, then find that digit. */
export function caretAfterFormat(formatted, digitsBefore) {
  if (digitsBefore <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) seen++;
    if (seen === digitsBefore) return i + 1;
  }
  return formatted.length;
}

/** Format an expiry as "MM / YY". A single leading 2–9 becomes "0N / ". */
export function formatExpiry(raw, deleting = false) {
  let d = digits(raw).slice(0, 4);
  if (d.length === 1 && d > '1') d = '0' + d;
  if (d.length >= 2 && !deleting) return d.slice(0, 2) + ' / ' + d.slice(2);
  if (d.length > 2) return d.slice(0, 2) + ' / ' + d.slice(2);
  return d;
}

/** 'ok' | 'format' | 'expired' for an "MM / YY" string against `now`. */
export function checkExpiry(value, now = new Date()) {
  const m = /^\s*(\d{2})\s*\/\s*(\d{2})\s*$/.exec(value ?? '');
  if (!m) return 'format';
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return 'format';
  const endOfMonth = new Date(year, month, 1); // first day of the following month
  if (year > now.getFullYear() + 20) return 'format';
  return endOfMonth > now ? 'ok' : 'expired';
}

/** Validate a full card number: 'ok' | 'empty' | 'brand' | 'invalid'. */
export function checkCardNumber(num) {
  const d = digits(num);
  if (!d) return 'empty';
  const brand = cardBrand(d);
  if (!brand) return d.length >= 2 ? 'brand' : 'invalid';
  if (d.length !== cardLength(brand) || !luhn(d)) return 'invalid';
  return 'ok';
}

export function formatGiftCode(raw) {
  return digits(raw).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

const ORDER_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** "MC-XXXXXX" from an alphabet with no 0/O or 1/I. */
export function orderNumber(rand = Math.random) {
  let s = '';
  for (let i = 0; i < 6; i++) s += ORDER_ALPHABET[Math.floor(rand() * ORDER_ALPHABET.length)];
  return 'MC-' + s;
}
