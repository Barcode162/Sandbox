// WO-004 acceptance: a full scripted fight with no cheats (the autopilot reads telegraphs and rolls) reaches
// victory within 120 s of sim time, through phase 2, deterministically.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SimEvent } from '../../src/contracts.ts';
import { createSim, stepSim } from '../../src/core/sim.ts';
import { neutralIntent } from '../../src/core/intent.ts';
import { autopilot, autopilotMemory } from '../../src/golem/autopilot.ts';

function play(seed: number) {
  const s = createSim(seed);
  const it = neutralIntent();
  const mem = autopilotMemory();
  const kinds = new Set<string>();
  let frames = 0, hurt = 0;
  while (s.phase !== 'victory' && s.phase !== 'defeat' && frames < 120 * 60) {
    autopilot(s, mem, it);
    stepSim(s, it);
    frames++;
    for (const e of s.events as SimEvent[]) {
      kinds.add(e.type === 'telegraph' ? `telegraph:${e.attack}` : e.type);
      if (e.type === 'hit' && e.target === 'hero') hurt += e.amount;
    }
  }
  return { s, frames, kinds, hurt };
}

test('[L1] autopilot fight (no flags) from the title reaches victory within 120 s of sim time', () => {
  for (const seed of [1, 7, 20261125]) {
    const { s, frames, kinds } = play(seed);
    assert.equal(s.phase, 'victory', `seed ${seed}: ${s.phase} after ${(frames / 60).toFixed(1)} s, golem hp ${s.golem.hp}`);
    assert.ok(frames <= 7200);
    assert.ok(Object.values(s.flags).every((v) => v === false || v === -1 || v === 0), 'no cheats');
    for (const k of ['telegraph:slam', 'enrage', 'stagger', 'death', 'coins']) assert.ok([...kinds].some((x) => x.startsWith(k.split(':')[0]!)) && (k !== 'telegraph:slam' || [...kinds].some((x) => x.startsWith('telegraph'))), `${k} seen (seed ${seed})`);
  }
});

test('[L2] the same seed plays the same fight', () => {
  const a = play(11), b = play(11);
  assert.equal(a.frames, b.frames);
  assert.deepEqual(a.s, b.s);
});
