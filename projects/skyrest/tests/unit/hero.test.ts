// WO-003 hero rules (experience.md §5): movement, dodge i-frames, perfect dodge, hurt, skill, footsteps.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SimState } from '../../src/contracts.ts';
import { stepSim } from '../../src/core/sim.ts';
import { neutralIntent } from '../../src/core/intent.ts';
import { HERO } from '../../src/tuning/hero.ts';
import { hurtHero } from '../../src/hero/sim.ts';
import { fightSim, run } from './support/script.ts';

/** A fight with a passive, awake golem standing still. */
function arena(seed = 1): SimState {
  const s = fightSim(seed);
  s.flags.golemPassive = true;
  s.golem.action = 'idle';
  return s;
}
const ms = (frames: number) => frames / 0.06;

test('[H1] movement: 5.6 m/s top speed, full speed in ≤ 8 steps, release stops within 6 steps', () => {
  const s = arena();
  s.hero.pos.x = -6; // open ground, away from the golem
  s.hero.pos.z = 8;
  s.hero.prevPos.x = -6;
  run(s, [[8, { moveX: 1 }]]);
  assert.ok(Math.abs(Math.hypot(s.hero.vel.x, s.hero.vel.z) - HERO.runSpeed) < 1e-9, `speed ${Math.hypot(s.hero.vel.x, s.hero.vel.z)}`);
  let n = 0;
  while (Math.hypot(s.hero.vel.x, s.hero.vel.z) > 0 && n < 20) {
    run(s, [[1, {}]]);
    n++;
  }
  assert.ok(n <= 6, `stopped after ${n} steps (${ms(n).toFixed(0)} ms)`);
});

test('[H2] dodge: 380 ms roll of 4.2 m; i-frames cover exactly 40–300 ms', () => {
  assert.equal(HERO.dodge.frames, 23);
  // Probe every frame of a roll with a blow: refused inside [round(40·0.06), round(300·0.06)], taken outside.
  const iStart = Math.round(40 * 0.06), iEnd = Math.round(300 * 0.06);
  for (let k = 1; k <= HERO.dodge.frames; k++) {
    const s = arena();
    s.hero.pos.x = -6;
    s.hero.pos.z = 10;
    run(s, [[1, { dodge: true, moveX: 1 }], [k - 1, { moveX: 1 }]]);
    assert.equal(s.hero.action, 'dodge');
    assert.equal(s.hero.actionFrame, k);
    const took = hurtHero(s, 1, { x: s.hero.pos.x, z: s.hero.pos.z - 1 }, 'slam');
    assert.equal(took, !(k >= iStart && k <= iEnd), `roll frame ${k} (${ms(k).toFixed(0)} ms)`);
  }
  const s = arena();
  s.hero.pos.x = -6;
  s.hero.pos.z = 10;
  const x0 = s.hero.pos.x;
  run(s, [[1, { dodge: true, moveX: 1 }], [HERO.dodge.frames, {}]]);
  assert.ok(Math.abs(s.hero.pos.x - x0 - HERO.dodge.distance) < 0.05, `rolled ${s.hero.pos.x - x0}`);
});

test('[H3] perfect dodge: a blow inside the i-frames sets timeScale 0.5 for 120 ms, emits perfectDodge, buffs the next hit', () => {
  const s = arena();
  run(s, [[1, { dodge: true, moveX: 1 }], [5, {}]]);
  assert.equal(hurtHero(s, 2, s.golem.pos, 'slam'), false);
  assert.equal(s.timeScale, 0.5);
  assert.equal(s.timeScaleFrames, Math.round(120 * 0.06));
  assert.ok(s.events.some((e) => e.type === 'perfectDodge'));
  assert.equal(s.hero.ext.perfectBonus, 1);
  // The scale lasts exactly 120 ms of sim time.
  const it = neutralIntent();
  for (let i = 0; i < 7; i++) {
    assert.equal(s.timeScale, 0.5, `step ${i}`);
    stepSim(s, it);
  }
  assert.equal(s.timeScale, 1);
  assert.equal(s.hero.hp, HERO.maxHp);
});

test('[H4] hurt: 350 ms flinch, 2.5 m knockback away from the source, 1 s grace, then death at 0 with slow-mo', () => {
  const s = arena();
  s.hero.pos.x = -6;
  s.hero.pos.z = 8;
  const x0 = s.hero.pos.x;
  assert.equal(hurtHero(s, 2, { x: x0 + 1, z: 8 }, 'sweep'), true);
  assert.equal(s.hero.hp, HERO.maxHp - 2);
  assert.equal(s.hero.action, 'hurt');
  assert.equal(s.hero.iframes, Math.round(1000 * 0.06));
  run(s, [[HERO.hurt.frames, {}]]);
  assert.ok(Math.abs(x0 - s.hero.pos.x - 2.5) < 0.05, `knocked ${x0 - s.hero.pos.x}`);
  assert.equal(hurtHero(s, 2, { x: 0, z: 0 }, 'slam'), false, 'grace i-frames');
  run(s, [[60, {}]]);
  assert.equal(hurtHero(s, 99, { x: 0, z: 0 }, 'slam'), true);
  assert.equal(s.hero.action, 'dead');
  assert.equal(s.timeScale, 0.5);
  assert.equal(s.timeScaleFrames, Math.round(600 * 0.06));
});

test('[H5] Gale Crescent: two ticks 160 ms apart, 8 s cooldown, skillReady when it returns', () => {
  const s = arena();
  const hp0 = s.golem.hp;
  const ev = run(s, [[1, { skill: true }], [60, {}]]);
  const hits = ev.map((e, i) => ({ e, i })).filter(({ e }) => e.type === 'hit' && e.target === 'golem');
  assert.equal(hits.length, 2);
  for (const { e } of hits) assert.equal((e as { kind: string }).kind, 'skill');
  // Frame of each hit: re-run and record the frame numbers.
  const s2 = arena();
  const frames: number[] = [];
  const it = neutralIntent();
  for (let f = 0; f < 80; f++) {
    Object.assign(it, neutralIntent(), f === 0 ? { skill: true } : {});
    stepSim(s2, it);
    if (s2.events.some((e) => e.type === 'hit' && e.target === 'golem')) frames.push(s2.frame);
  }
  assert.equal(frames.length, 2);
  // Gap in sim time = frames between the ticks, minus the hit-stop freeze after tick 1 (the action clock stops).
  const stop1 = Math.round(60 * 0.06);
  assert.equal(frames[1]! - frames[0]! - stop1, Math.round(160 * 0.06));
  assert.ok(s.golem.hp < hp0);
  assert.equal(HERO.skill.cooldown, 480);
  // Cooldown: pressing again before 8 s does nothing; at 8 s skillReady fires and it works again.
  const s3 = arena();
  run(s3, [[1, { skill: true }]]);
  const again = run(s3, [[200, {}], [1, { skill: true }]]);
  assert.ok(!again.some((e) => e.type === 'skill'));
  const ready = run(s3, [[480, {}]]);
  assert.ok(ready.some((e) => e.type === 'skillReady'));
  const third = run(s3, [[1, { skill: true }]]);
  assert.ok(third.some((e) => e.type === 'skill'));
});

test('[H6] running emits footsteps every ~1.08 m and the sim stays plain JSON', () => {
  const s = arena();
  s.hero.pos.x = -6;
  s.hero.pos.z = 8;
  const ev = run(s, [[60, { moveY: 1 }]]);
  const steps = ev.filter((e) => e.type === 'footstep').length;
  assert.ok(steps >= 4 && steps <= 6, `footsteps ${steps}`);
  assert.deepEqual(structuredClone(s), JSON.parse(JSON.stringify(s)));
});
