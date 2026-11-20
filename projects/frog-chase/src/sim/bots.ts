/**
 * Bots (§13 screenshots, success criterion 1). OWNER: WO-002.
 * A BotPolicy is called once per tick before step(); it must read only the SimState (no wall clock),
 * so a bot run is as deterministic as the sim. STUB (WO-001): every bot returns null.
 */
import type { BotName, BotOptions, BotPolicy } from '../contracts';

export function makeBot(_name: BotName, _opts: BotOptions = {}): BotPolicy {
  return () => null;
}
