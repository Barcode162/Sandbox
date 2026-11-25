// Frame-rate independence (playbook §Verification): the same input over the same wall time gives the
// same sim outcome at 30 Hz and 144 Hz render rates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixedStepper, STEP_S } from '../../src/core/fixed-step.ts';
import { stepSim } from '../../src/core/sim.ts';
import { neutralIntent } from '../../src/core/intent.ts';
import { fightSim } from './support/script.ts';

function playAt(hz: number, seconds: number) {
  const s = fightSim(11);
  const st = createFixedStepper();
  const it = neutralIntent();
  let steps = 0;
  const frames = Math.round(seconds * hz);
  for (let f = 0; f < frames; f++) {
    st.advance(1 / hz, () => {
      it.moveX = steps < 90 ? 1 : 0;
      it.moveY = steps >= 90 ? 1 : 0;
      it.attack = steps === 150;
      stepSim(s, it);
      steps++;
    });
  }
  return { s, steps };
}

test('[F0] 30 Hz and 144 Hz render rates produce the same sim', () => {
  const a = playAt(30, 4), b = playAt(144, 4);
  assert.ok(Math.abs(a.steps - b.steps) <= 1, `${a.steps} vs ${b.steps}`);
  assert.ok(Math.abs(a.s.hero.pos.x - b.s.hero.pos.x) < 0.1);
  assert.ok(Math.abs(a.s.hero.pos.z - b.s.hero.pos.z) < 0.1);
});

test('[F1] stepper returns alpha in [0,1) and caps catch-up', () => {
  const st = createFixedStepper();
  let n = 0;
  const alpha = st.advance(STEP_S * 2.5, () => n++);
  assert.equal(n, 2);
  assert.ok(alpha > 0.4 && alpha < 0.6);
  n = 0;
  st.advance(10, () => n++);
  assert.equal(n, 15);
});
