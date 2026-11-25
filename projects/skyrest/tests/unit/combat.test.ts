// WO-003 combat timeline (experience.md §5): per-hit hit-stop 60/70/120 ms (+40 ms crit), combo windows, damage
// ranges, crit rate/multiplier, stagger and perfect-dodge multipliers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SimEventOf, SimState } from '../../src/contracts.ts';
import { stepSim } from '../../src/core/sim.ts';
import { neutralIntent } from '../../src/core/intent.ts';
import { HERO } from '../../src/tuning/hero.ts';
import { hitstopFrames } from '../../src/hero/combat.ts';
import { fightSim } from './support/script.ts';

const f = (ms: number) => Math.round(ms * 0.06);

function arena(seed = 1): SimState {
  const s = fightSim(seed);
  s.flags.golemPassive = true;
  s.golem.action = 'idle';
  s.golem.hp = s.golem.maxHp = 10_000_000;
  return s;
}

interface Trace { frame: number; action: string; actionFrame: number; hitstop: number; hits: SimEventOf<'hit'>[]; swings: number }

/** Step with a press schedule (frame index → intent patch); returns one row per step. */
function trace(s: SimState, steps: number, presses: Record<number, Partial<ReturnType<typeof neutralIntent>>>): Trace[] {
  const it = neutralIntent();
  const out: Trace[] = [];
  for (let i = 0; i < steps; i++) {
    Object.assign(it, neutralIntent(), presses[i] ?? {});
    stepSim(s, it);
    out.push({
      frame: i, action: s.hero.action, actionFrame: s.hero.actionFrame, hitstop: s.hitstop,
      hits: s.events.filter((e): e is SimEventOf<'hit'> => e.type === 'hit' && e.target === 'golem'),
      swings: s.events.filter((e) => e.type === 'swing').length,
    });
  }
  return out;
}

/** Steps the hero stays frozen after the step that landed hit `n` (its actionFrame stops advancing). */
function freezeAfterHit(rows: Trace[], n: number): number {
  const idx = rows.map((r, i) => (r.hits.length ? i : -1)).filter((i) => i >= 0)[n - 1]!;
  let k = 0;
  while (rows[idx + 1 + k]!.actionFrame === rows[idx]!.actionFrame) k++;
  return k;
}

/** Mash attack every 6 frames: buffered presses chain the combo at the earliest window. */
const mashPresses = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i * 6, { attack: true }]));

test('[CB1] hit-stop per combo hit is 60 / 70 / 120 ms, +40 ms on a crit', () => {
  for (const crit of [0, 1]) {
    const s = arena(3);
    s.flags.forceCrit = crit;
    const rows = trace(s, 160, mashPresses(25));
    const hits = rows.flatMap((r) => r.hits);
    assert.ok(hits.length >= 3, `hits ${hits.length}`);
    assert.deepEqual(hits.slice(0, 3).map((h) => h.kind), ['combo1', 'combo2', 'combo3']);
    const want = [60, 70, 120].map((ms) => f(ms + (crit ? 40 : 0)));
    assert.deepEqual([1, 2, 3].map((n) => freezeAfterHit(rows, n)), want, crit ? 'crit' : 'normal');
    assert.deepEqual(['combo1', 'combo2', 'combo3'].map((k) => hitstopFrames(k as 'combo1', !!crit)), want);
  }
});

test('[CB2] combo windows: startup / next-opens / recovery and the 450 ms reset match §5', () => {
  // Startup: the first hit lands on the step the action reaches `startup` frames.
  const want = [
    { startup: f(90), active: f(80), recovery: f(230), next: f(170) },
    { startup: f(100), active: f(90), recovery: f(250), next: f(190) },
    { startup: f(180), active: f(120), recovery: f(420), next: Infinity },
  ];
  HERO.combo.forEach((c, i) => {
    assert.equal(c.startup, want[i]!.startup);
    assert.equal(c.active, want[i]!.active);
    assert.equal(c.recovery, want[i]!.recovery);
    if (i < 2) assert.equal(c.cancel, want[i]!.next);
  });
  // A press during hit 1's active frames is buffered and fires exactly when "next" opens (frame 10).
  const s = arena(5);
  const rows = trace(s, 40, { 0: { attack: true }, 7: { attack: true } });
  const firstHit = rows.findIndex((r) => r.hits.length > 0);
  assert.equal(rows[firstHit]!.actionFrame, want[0]!.startup, 'hit 1 lands when startup has elapsed');
  const a2 = rows.findIndex((r) => r.action === 'attack2');
  const stop = f(60);
  // attack1 began on step 0 (actionFrame 1 after it); attack2 starts when actionFrame reaches `cancel` (+ the freeze).
  assert.equal(a2, want[0]!.next + stop, `attack2 began at step ${a2}`);
  // No press, no chain: hit 1 recovers to idle.
  const s2 = arena(5);
  const rows2 = trace(s2, 60, { 0: { attack: true } });
  assert.ok(!rows2.some((r) => r.action === 'attack2'));
  assert.equal(rows2.at(-1)!.action, 'idle');
  // After a finished swing, a press within 450 ms continues the combo; after that it restarts at hit 1.
  const total1 = HERO.combo[0]!.startup + HERO.combo[0]!.active + HERO.combo[0]!.recovery;
  const s3 = arena(5);
  const r3 = trace(s3, 120, { 0: { attack: true }, [total1 + stop + 20]: { attack: true } });
  assert.ok(r3.some((r) => r.action === 'attack2'), 'pressed 333 ms after recovery: continues');
  const s4 = arena(5);
  const r4 = trace(s4, 140, { 0: { attack: true }, [total1 + stop + f(450) + 4]: { attack: true } });
  assert.ok(!r4.some((r) => r.action === 'attack2'), 'pressed after 450 ms: restarts');
  assert.equal(r4.filter((r) => r.swings).length, 2);
});

test('[CB3] dodge cancels recovery, not startup or active', () => {
  const s = arena(5);
  const rows = trace(s, 30, { 0: { attack: true }, 2: { dodge: true } });
  const d = rows.findIndex((r) => r.action === 'dodge');
  // Pressed in startup (buffered 200 ms): fires on the first recovery frame of hit 1, after the hit-stop.
  assert.equal(d, HERO.combo[0]!.startup + HERO.combo[0]!.active + f(60));
});

test('[CB4] damage: §5 ranges, crit ×1.6 at ~15 %, staggered ×1.25, perfect-dodge +20 %', () => {
  let crits = 0, n = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const s = arena(seed);
    const rows = trace(s, 120, mashPresses(20));
    for (const h of rows.flatMap((r) => r.hits)) {
      n++;
      const i = Number(h.kind.slice(-1)) - 1;
      const c = HERO.combo[i]!;
      const m = h.crit ? 1.6 : 1;
      if (h.crit) crits++;
      assert.ok(h.amount >= Math.floor(c.damageMin * m) && h.amount <= Math.ceil(c.damageMax * m), `${h.kind} ${h.amount}`);
    }
  }
  const rate = crits / n;
  assert.ok(rate > 0.07 && rate < 0.25, `crit rate ${rate.toFixed(3)} over ${n}`);
  // Multipliers, with the damage roll pinned by the same seed.
  const base = arena(9);
  base.flags.forceCrit = 0;
  const b = trace(base, 12, { 0: { attack: true } }).flatMap((r) => r.hits)[0]!.amount;
  const st = arena(9);
  st.flags.forceCrit = 0;
  st.golem.action = 'stagger';
  const sa = trace(st, 12, { 0: { attack: true } }).flatMap((r) => r.hits)[0]!.amount;
  assert.ok(Math.abs(sa / b - 1.25) < 0.001, `stagger ${sa}/${b}`);
  const pd = arena(9);
  pd.flags.forceCrit = 0;
  pd.hero.ext.perfectBonus = 1;
  const pa = trace(pd, 12, { 0: { attack: true } }).flatMap((r) => r.hits)[0]!.amount;
  assert.ok(Math.abs(pa / b - 1.2) < 0.001, `perfect ${pa}/${b}`);
  assert.equal(pd.hero.ext.perfectBonus, 0, 'bonus is spent');
});

test('[CB5] forced damage + forced crit (frame table F2/F4) are honoured', () => {
  const s = arena(2);
  s.flags.forceDamage = 2368;
  s.flags.forceCrit = 0;
  const h = trace(s, 12, { 0: { attack: true } }).flatMap((r) => r.hits)[0]!;
  assert.equal(h.amount, 2368);
  assert.equal(h.crit, false);
});
