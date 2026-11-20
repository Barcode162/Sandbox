// Scripted playthrough (success criterion 2) — SLOT, WO-005 implements against window.__inkfold:
//  - playScript('win', 60) → outcome 'victory', lives ≥ WIN_MIN_SEEDS (40)
//  - playScript('loss', 60) → outcome 'defeat' with round ≤ 12
//  - restart() < 2000 ms and summary() back to R1 / 650 / 100, scene 'play'
import { fail } from './lib.mjs';
fail('playthrough not implemented (WO-005)');
