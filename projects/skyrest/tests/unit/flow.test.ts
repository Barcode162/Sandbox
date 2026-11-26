// WO-004 phase machine (experience.md §3, §8): title → intro → fight → victory/defeat → retry ≤ 1.8 s, coins kept.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SimState } from '../../src/contracts.ts';
import { createSim, START_COINS } from '../../src/core/sim.ts';
import { DEFEAT_DELAY_FRAMES, INTRO_FRAMES, RETRY_MIN_FRAMES, VICTORY_DELAY_FRAMES } from '../../src/core/flow.ts';
import { GOLEM, golemHpForWave } from '../../src/tuning/golem.ts';
import { fightSim, run } from './support/script.ts';

function toVictory(seed = 1): SimState {
  const s = fightSim(seed);
  s.flags.golemPassive = true;
  run(s, [[GOLEM.wakeFrames + 2, {}]]);
  s.golem.hp = 0;
  run(s, [[GOLEM.deathHitstop + VICTORY_DELAY_FRAMES + 2, {}]]);
  return s;
}

test('[FL1] the coin pill opens at 12,580; title waits for a press; intro hands control over in 1 s', () => {
  const s = createSim(1);
  assert.equal(s.coins, START_COINS);
  run(s, [[120, {}]]);
  assert.equal(s.phase, 'title');
  run(s, [[1, { confirm: true }]]);
  assert.equal(s.phase, 'intro');
  assert.equal(s.golem.action, 'wake', 'the mound lifts while the camera glides in');
  run(s, [[INTRO_FRAMES, {}]]);
  assert.equal(s.phase, 'fight');
});

test('[FL2] kill → SKY CLEARED → NEXT WAVE: control in ≤ 1.8 s, wave 2 at ×1.15 HP, coins kept', () => {
  const s = toVictory();
  assert.equal(s.phase, 'victory');
  const coins = s.coins;
  assert.equal(coins, START_COINS + GOLEM.coinsOnDeath);
  run(s, [[1, { confirm: true }]]);
  assert.equal(s.phase, 'victory', 'a press inside the first 750 ms is ignored');
  run(s, [[RETRY_MIN_FRAMES, {}]]);
  let n = 0;
  run(s, [[1, { confirm: true }]]);
  assert.equal(s.phase, 'intro');
  while (s.phase !== 'fight' && n < 300) {
    run(s, [[1, {}]]);
    n++;
  }
  assert.ok(n + 1 <= 108, `control after ${n + 1} steps`);
  assert.equal(s.wave, 2);
  assert.equal(s.golem.maxHp, golemHpForWave(2));
  assert.equal(s.golem.maxHp, 69000);
  assert.equal(s.coins, coins);
  // The Guardian reforms (short assembly) and stands by 1.8 s.
  run(s, [[GOLEM.reformFrames, {}]]);
  assert.notEqual(s.golem.action, 'wake');
  assert.notEqual(s.golem.action, 'dormant');
});

test('[FL3] hero down → FALLEN → TRY AGAIN: same wave, full hearts, control in ≤ 1.8 s', () => {
  const s = fightSim(2);
  s.hero.hp = 1;
  s.hero.iframes = 0;
  s.golem.action = 'idle';
  s.golem.ext.firstWait = 0;
  s.golem.cooldown = 0;
  let n = 0;
  while (s.phase === 'fight' && n < 3000) {
    run(s, [[1, {}]]);
    n++;
  }
  assert.equal(s.phase, 'defeat');
  assert.ok(s.hero.action === 'dead');
  assert.ok(DEFEAT_DELAY_FRAMES <= 90);
  run(s, [[RETRY_MIN_FRAMES, {}], [1, { confirm: true }]]);
  let m = 0;
  while ((s.phase as string) !== 'fight' && m < 300) {
    run(s, [[1, {}]]);
    m++;
  }
  assert.ok(m + 1 <= 108);
  assert.equal(s.wave, 1);
  assert.equal(s.hero.hp, s.hero.maxHp);
});
