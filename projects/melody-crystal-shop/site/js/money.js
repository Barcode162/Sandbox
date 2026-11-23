// money.js — all money is whole cents (integers). No floats ever touch a total.

/** Format cents as USD. `whole: true` drops ".00" (grid, tiles); cents shown otherwise. */
export function fmt(cents, { whole = false } = {}) {
  const neg = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const rest = abs % 100;
  const d = dollars.toLocaleString('en-US');
  const body = whole && rest === 0 ? `$${d}` : `$${d}.${String(rest).padStart(2, '0')}`;
  return neg ? `−${body}` : body;
}

/** Split a total into n payments that sum exactly to it; remainder cents go on payment 1. */
export function installments(total, n = 4) {
  if (!Number.isInteger(total) || total < 0) throw new TypeError('total must be whole cents');
  const base = Math.floor(total / n);
  const out = Array(n).fill(base);
  out[0] += total - base * n;
  return out;
}

/** Due dates for an n-payment plan: today, then every `days` days. */
export function schedule(from = new Date(), n = 4, days = 14) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i * days);
    return d;
  });
}

export const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** Fulfilment options and their fees (cents). Free above a threshold where one exists. */
export const FULFILMENT = {
  delivery: { label: 'Local delivery', fee: 500, freeOver: 7500 },
  shipping: { label: 'Shipping', fee: 800, freeOver: 10000 },
  pickup: { label: 'In-person pickup', fee: 0, freeOver: 0 },
};

/** Fee for a fulfilment method at a given subtotal. Returns { fee, waived, base }. */
export function fulfilmentFee(method, subtotal) {
  const f = FULFILMENT[method];
  if (!f) return { fee: 0, waived: false, base: 0 };
  if (f.fee === 0) return { fee: 0, waived: false, base: 0 };
  const waived = subtotal > f.freeOver;
  return { fee: waived ? 0 : f.fee, waived, base: f.fee };
}

/** Order totals: subtotal, fee, total, and what is due today under a plan. */
export function totals(lines, method, plan = 'full') {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const { fee, waived, base } = fulfilmentFee(method, subtotal);
  const total = subtotal + fee;
  const parts = plan === 'over-time' ? installments(total, 4) : [total];
  return { subtotal, fee, waived, baseFee: base, total, parts, dueToday: parts[0] };
}
