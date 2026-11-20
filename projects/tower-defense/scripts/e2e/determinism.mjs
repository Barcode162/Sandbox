// Frame-rate independence (criterion 5) — SLOT, WO-005 implements:
//  two fresh pages, useManualClock(), playScript('win', 30) vs playScript('win', 144)
//  → identical lives, money, pops and hash at round 20 (exact equality, not tolerance).
import { fail } from './lib.mjs';
fail('determinism not implemented (WO-005)');
