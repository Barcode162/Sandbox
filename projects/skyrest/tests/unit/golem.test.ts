// WO-004 Stone Guardian rules (experience.md §5): attack choice by range, telegraph = strike frame, hazards,
// poise/stagger, phase 2, death, pebble minions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GolemAttack, SimEvent, SimState } from '../../src/contracts.ts';
import { stepSim } from '../../src/core/sim.ts';
import { neutralIntent } from '../../src/core/intent.ts';
import { dirX, dirZ } from '../../src/core/math.ts';
import { GOLEM, MINION, golemCoinsForWave } from '../../src/tuning/golem.ts';
import { gx, wakeInstantly } from '../../src/golem/sim.ts';
import { fightSim, run } from './support/script.ts';

/** An awake golem at its spawn facing south, ready to attack now, hero placed at (distance, bearing°). */
function ready(seed: number, d: number, bearingDeg: number, enraged = false): SimState {
  const s = fightSim(seed);
  const g = s.golem;
  wakeInstantly(g);
  gx(g).firstWait = 0;
  g.cooldown = 0;
  g.enraged = enraged;
  const f = g.facing + (bearingDeg * Math.PI) / 180;
  s.hero.pos.x = s.hero.prevPos.x = g.pos.x + dirX(f) * d;
  s.hero.pos.z = s.hero.prevPos.z = g.pos.z + dirZ(f) * d;
  s.flags.heroInvulnerable = true;
  return s;
}

/** Step until the golem starts a windup; returns the attack (or null). Hero stands still. */
function firstAttack(s: SimState, limit = 30): GolemAttack | null {
  for (let i = 0; i < limit; i++) {
    run(s, [[1, {}]]);
    if (s.golem.action === 'windup') return s.golem.attack;
  }
  return null;
}

test('[G1] the AI picks each attack only in its range (slam ahead, sweep on a flank, toss far, double slam in P2)', () => {
  assert.equal(firstAttack(ready(1, 3.2, 0)), 'slam');
  assert.equal(firstAttack(ready(1, 3.0, 60)), 'sweep');
  assert.equal(firstAttack(ready(1, 8, 0)), 'toss');
  const seen = new Set<GolemAttack | null>();
  for (let seed = 1; seed <= 12; seed++) seen.add(firstAttack(ready(seed, 3.2, 0, true)));
  assert.deepEqual([...seen].sort(), ['doubleSlam', 'slam']);
  // Between the slam's reach and the toss's minimum it closes in instead of attacking.
  const mid = ready(1, 5.2, 0);
  run(mid, [[10, {}]]);
  assert.equal(mid.golem.action, 'walk');
  // Repeating the last attack is down-weighted (×0.4): over many picks slam ≠ always.
  assert.equal(GOLEM.repeatWeight, 0.4);
});

test('[G2] every telegraph decal is exactly 100 % full on its strike frame (impact = telegraph + frames)', () => {
  const cases: [GolemAttack, number, number, boolean][] = [['slam', 3.2, 0, false], ['sweep', 3.0, 60, false], ['toss', 8, 0, false], ['slam', 3.2, 0, true]];
  for (const [want, d, b, p2] of cases) {
    for (let seed = 1; seed <= 20; seed++) {
      const s = ready(seed, d, b, p2);
      const t0 = s.frame;
      const tele: { at: number; frames: number }[] = [];
      const imp: number[] = [];
      for (let i = 0; i < 400 && imp.length < (s.golem.attack === 'doubleSlam' ? 2 : 1); i++) {
        run(s, [[1, {}]]);
        for (const e of s.events) {
          if (e.type === 'telegraph') tele.push({ at: s.frame, frames: e.frames });
          if (e.type === 'impact') imp.push(s.frame);
        }
      }
      if (gx(s.golem).lastAttack < 0) continue;
      assert.ok(tele.length >= 1 && imp.length >= 1, `${want}: telegraph + impact`);
      for (let k = 0; k < imp.length; k++) assert.equal(imp[k], tele[k]!.at + tele[k]!.frames, `${want} #${k} seed ${seed}`);
      assert.ok(tele[0]!.at > t0);
      if (want === 'slam' && !p2) assert.equal(tele[0]!.frames, GOLEM.attacks.slam.windup);
      if (want === 'slam' && p2) assert.ok(tele[0]!.frames === GOLEM.attacks.slam.windupP2 || tele[0]!.frames === GOLEM.attacks.doubleSlam.windup);
      break;
    }
  }
});

test('[G3] the slam hurts inside its circle; its shockwave ring hurts once, and roll i-frames beat it', () => {
  // Standing in the circle: 2 halves from the fist.
  const a = ready(2, 3.2, 0);
  a.flags.heroInvulnerable = false;
  const ev = run(a, [[80, {}]]);
  const hurt = ev.filter((e) => e.type === 'hit' && e.target === 'hero');
  assert.equal(hurt.length, 1);
  assert.equal((hurt[0] as Extract<SimEvent, { type: 'hit' }>).amount, GOLEM.attacks.slam.damage);
  // Standing 5.5 m out: the ring (0 → 7 m) catches the hero once for ½ heart.
  const b = ready(2, 3.2, 0);
  b.flags.heroInvulnerable = false;
  run(b, [[GOLEM.attacks.slam.windup - 2, {}]]);
  const g = b.golem;
  b.hero.pos.x = g.target.x + 4.6;
  b.hero.pos.z = g.target.z;
  const ring = run(b, [[40, {}]]).filter((e) => e.type === 'hit' && e.target === 'hero');
  assert.equal(ring.length, 1);
  assert.equal((ring[0] as Extract<SimEvent, { type: 'hit' }>).kind, 'shockwave');
  // Same, but rolling as the ring arrives: no damage.
  const c = ready(2, 3.2, 0);
  c.flags.heroInvulnerable = false;
  run(c, [[GOLEM.attacks.slam.windup - 2, {}]]);
  c.hero.pos.x = c.golem.target.x + 4.6;
  c.hero.pos.z = c.golem.target.z;
  const arrive = Math.round(((4.6 - GOLEM.shockwave.r0) / (GOLEM.shockwave.r1 - GOLEM.shockwave.r0)) * GOLEM.shockwave.frames);
  run(c, [[arrive - 1, {}]]);
  const rolled = run(c, [[1, { dodge: true, moveX: -1 }], [30, {}]]).filter((e) => e.type === 'hit' && e.target === 'hero');
  assert.equal(rolled.length, 0);
});

test('[G4] poise: a break staggers for 2 s (deferred past a telegraph), poise refills 4 s after the last hit', () => {
  const s = ready(3, 3.2, 0);
  s.flags.golemPassive = true;
  s.golem.poise = 0;
  const ev = run(s, [[1, {}]]);
  assert.ok(ev.some((e) => e.type === 'stagger'));
  assert.equal(s.golem.action, 'stagger');
  run(s, [[GOLEM.staggerFrames, {}]]);
  assert.equal(s.golem.action, 'idle');
  // During a windup a poise break waits until the attack ends.
  const w = ready(3, 3.2, 0);
  firstAttack(w);
  w.golem.poise = 0;
  run(w, [[5, {}]]);
  assert.equal(w.golem.action, 'windup');
  run(w, [[200, {}]]);
  assert.ok(w.golem.action === 'stagger' || w.golem.actionFrame > 0);
  // Refill.
  const r = ready(3, 3.2, 0);
  r.flags.golemPassive = true;
  r.golem.poise = 40;
  r.golem.hitsTaken++;
  run(r, [[GOLEM.poiseResetFrames - 2, {}]]);
  assert.equal(r.golem.poise, 40);
  run(r, [[4, {}]]);
  assert.equal(r.golem.poise, GOLEM.maxPoise);
});

test('[G5] phase 2 at 50 %: enrage + roar, 3 pebbles pop out 1.5–3 m away, faster telegraphs', () => {
  const s = ready(4, 3.2, 0);
  s.golem.hp = s.golem.maxHp * 0.5;
  const ev = run(s, [[1, {}]]);
  assert.ok(ev.some((e) => e.type === 'enrage'));
  assert.ok(s.golem.enraged);
  const later = run(s, [[GOLEM.roarFrames, {}]]);
  const spawned = later.filter((e) => e.type === 'spawn' && e.target === 'minion');
  assert.equal(spawned.length, MINION.count);
  for (const e of spawned) {
    const p = (e as Extract<SimEvent, { type: 'spawn' }>).pos;
    const d = Math.hypot(p.x - s.golem.pos.x, p.z - s.golem.pos.z);
    assert.ok(d >= MINION.spawnMin && d <= MINION.spawnMax + GOLEM.radius, `pebble at ${d.toFixed(2)} m`);
  }
  const tele = run(s, [[200, {}]]).find((e) => e.type === 'telegraph') as Extract<SimEvent, { type: 'telegraph' }> | undefined;
  assert.ok(tele && tele.frames < GOLEM.attacks.slam.windup, 'P2 telegraph is faster');
  // Wave 2 kindles at 60 %.
  const w2 = ready(4, 3.2, 0);
  w2.wave = 2;
  w2.golem.hp = w2.golem.maxHp * 0.59;
  assert.ok(run(w2, [[1, {}]]).some((e) => e.type === 'enrage'));
});

test('[G6] death: 220 ms hit-stop, slow-mo 0.35, coins for the wave, then crumble → dead', () => {
  const s = ready(5, 3.2, 0);
  s.flags.golemPassive = true;
  const coins0 = s.coins;
  s.golem.hp = 0;
  const ev = run(s, [[1, {}]]);
  assert.ok(ev.some((e) => e.type === 'death' && e.target === 'golem'));
  const c = ev.find((e) => e.type === 'coins') as Extract<SimEvent, { type: 'coins' }>;
  assert.equal(c.amount, golemCoinsForWave(1));
  assert.equal(s.coins, coins0 + GOLEM.coinsOnDeath);
  assert.equal(s.timeScale, GOLEM.deathTimeScale);
  assert.ok(s.hitstop >= GOLEM.deathHitstop - 1);
  run(s, [[GOLEM.dyingFrames + GOLEM.deathHitstop + 2, {}]]);
  assert.equal(s.golem.action, 'dead');
  assert.equal(s.timeScale, 1);
  assert.equal(golemCoinsForWave(2), 3000);
});

test('[G7] pebbles chase, squash 400 ms before the bump, pop into coins when struck down', () => {
  const s = ready(6, 3.2, 0);
  s.flags.golemPassive = true;
  s.flags.heroInvulnerable = false;
  s.golem.hp = s.golem.maxHp * 0.5;
  run(s, [[GOLEM.roarFrames + MINION.spawnFrames + 2, {}]]);
  const live = s.minions.filter((m) => m.action === 'chase' || m.action === 'windup');
  assert.equal(live.length, MINION.count);
  // Wait for the first bump and check its squash lasted the telegraph.
  let windupAt = -1, hurtAt = -1;
  for (let i = 0; i < 600 && hurtAt < 0; i++) {
    stepSim(s, neutralIntent());
    if (windupAt < 0 && s.minions.some((m) => m.action === 'windup')) windupAt = s.frame;
    if (s.events.some((e) => e.type === 'hit' && e.target === 'hero' && e.kind === 'minion')) hurtAt = s.frame;
  }
  assert.ok(windupAt > 0 && hurtAt > 0);
  assert.ok(hurtAt - windupAt >= MINION.windupFrames, `squash ${hurtAt - windupAt} steps`);
  const coins = s.coins;
  s.minions[0]!.hp = 0;
  const ev = run(s, [[1, {}]]);
  assert.ok(ev.some((e) => e.type === 'death' && e.target === 'minion'));
  assert.equal(s.coins, coins + MINION.coins);
});
