// Deterministic state hash (FNV-1a over quantised state) — STUB (WO-002 extends to blots/towers).
import type { SimState } from '../contracts/types';

export function stateHash(s: Readonly<SimState>): string {
  let h = 0x811c9dc5;
  const mix = (n: number): void => {
    let v = Math.round(n * 1000) | 0;
    for (let i = 0; i < 4; i++) { h ^= v & 0xff; h = Math.imul(h, 0x01000193); v >>>= 8; }
  };
  mix(s.tick); mix(s.round); mix(s.lives); mix(s.money); mix(s.stats.pops); mix(s.blots.count);
  // TODO(WO-002): fold in every live blot (id, kind, hp, s) and tower (id, tiers, cooldown).
  return (h >>> 0).toString(16).padStart(8, '0');
}
