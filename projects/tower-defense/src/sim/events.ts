// Pooled SimEvents (board condition 3). The hot event kinds are reused objects, so a busy tick allocates no
// event objects after warm-up: each kind has a slab that grows to its high-water mark once and is rewound
// at the start of every step(). Consequence (already in the contract): an event is valid only until the
// next step(). Consumers must copy any field they keep.
// Rare events (roundStart, victory, rejected, …) are plain literals: a few per round, not per hit.
import type { BlotKind, AttackKind, SimEvent, SimState, TowerKind } from '../contracts/types';

type Of<T extends SimEvent['type']> = { -readonly [K in keyof Extract<SimEvent, { type: T }>]: Extract<SimEvent, { type: T }>[K] };

interface Slab<E> { take(): E; reset(): void }
function slab<E>(make: () => E): Slab<E> {
  const items: E[] = [];
  let n = 0;
  return {
    take() { if (n === items.length) items.push(make()); return items[n++]; },
    reset() { n = 0; },
  };
}

export interface EventPool {
  /** Rewind every slab. The core calls this at the start of each step(). */
  reset(): void;
  spawn(blotId: number, kind: BlotKind, parentId: number, x: number, y: number): SimEvent;
  pop(blotId: number, kind: BlotKind, x: number, y: number, towerId: number, pale: boolean): SimEvent;
  hit(blotId: number, kind: BlotKind, x: number, y: number, dirX: number, dirY: number): SimEvent;
  immune(blotId: number, x: number, y: number): SimEvent;
  leak(blotId: number, kind: BlotKind, livesLost: number): SimEvent;
  money(delta: number, reason: 'pop' | 'bonus' | 'spend' | 'refund'): SimEvent;
  // Tower-side kinds (WO-003 may use these through pooledEvents(ctx.state) instead of literals).
  fire(towerId: number, kind: TowerKind, attack: AttackKind, x: number, y: number, angle: number): SimEvent;
  land(projectileId: number, towerId: number, x: number, y: number, radius: number, skip: boolean, stun: boolean): SimEvent;
  pulse(towerId: number, x: number, y: number, radius: number, freeze: boolean): SimEvent;
  beam(towerId: number, x1: number, y1: number, x2: number, y2: number, eclipse: boolean): SimEvent;
}

export function createEventPool(): EventPool {
  const sp = slab<Of<'spawn'>>(() => ({ type: 'spawn', blotId: 0, kind: 'dot', parentId: 0, x: 0, y: 0 }));
  const po = slab<Of<'pop'>>(() => ({ type: 'pop', blotId: 0, kind: 'dot', x: 0, y: 0, towerId: 0, pale: false }));
  const hi = slab<Of<'hit'>>(() => ({ type: 'hit', blotId: 0, kind: 'dot', x: 0, y: 0, dirX: 0, dirY: 0 }));
  const im = slab<Of<'immune'>>(() => ({ type: 'immune', blotId: 0, x: 0, y: 0 }));
  const le = slab<Of<'leak'>>(() => ({ type: 'leak', blotId: 0, kind: 'dot', livesLost: 0 }));
  const mo = slab<Of<'money'>>(() => ({ type: 'money', delta: 0, reason: 'pop' }));
  const fi = slab<Of<'fire'>>(() => ({ type: 'fire', towerId: 0, kind: 'tern', attack: 'quill', x: 0, y: 0, angle: 0 }));
  const la = slab<Of<'land'>>(() => ({ type: 'land', projectileId: 0, towerId: 0, x: 0, y: 0, radius: 0, skip: false, stun: false }));
  const pu = slab<Of<'pulse'>>(() => ({ type: 'pulse', towerId: 0, x: 0, y: 0, radius: 0, freeze: false }));
  const be = slab<Of<'beam'>>(() => ({ type: 'beam', towerId: 0, x1: 0, y1: 0, x2: 0, y2: 0, eclipse: false }));
  const all = [sp, po, hi, im, le, mo, fi, la, pu, be];
  return {
    reset() { for (let i = 0; i < all.length; i++) all[i].reset(); },
    spawn(blotId, kind, parentId, x, y) { const e = sp.take(); e.blotId = blotId; e.kind = kind; e.parentId = parentId; e.x = x; e.y = y; return e; },
    pop(blotId, kind, x, y, towerId, pale) { const e = po.take(); e.blotId = blotId; e.kind = kind; e.x = x; e.y = y; e.towerId = towerId; e.pale = pale; return e; },
    hit(blotId, kind, x, y, dirX, dirY) { const e = hi.take(); e.blotId = blotId; e.kind = kind; e.x = x; e.y = y; e.dirX = dirX; e.dirY = dirY; return e; },
    immune(blotId, x, y) { const e = im.take(); e.blotId = blotId; e.x = x; e.y = y; return e; },
    leak(blotId, kind, livesLost) { const e = le.take(); e.blotId = blotId; e.kind = kind; e.livesLost = livesLost; return e; },
    money(delta, reason) { const e = mo.take(); e.delta = delta; e.reason = reason; return e; },
    fire(towerId, kind, attack, x, y, angle) { const e = fi.take(); e.towerId = towerId; e.kind = kind; e.attack = attack; e.x = x; e.y = y; e.angle = angle; return e; },
    land(projectileId, towerId, x, y, radius, skip, stun) { const e = la.take(); e.projectileId = projectileId; e.towerId = towerId; e.x = x; e.y = y; e.radius = radius; e.skip = skip; e.stun = stun; return e; },
    pulse(towerId, x, y, radius, freeze) { const e = pu.take(); e.towerId = towerId; e.x = x; e.y = y; e.radius = radius; e.freeze = freeze; return e; },
    beam(towerId, x1, y1, x2, y2, eclipse) { const e = be.take(); e.towerId = towerId; e.x1 = x1; e.y1 = y1; e.x2 = x2; e.y2 = y2; e.eclipse = eclipse; return e; },
  };
}

const POOLS = new WeakMap<object, EventPool>();
/** The event pool belonging to a sim's state (the core registers it in createSim). */
export function pooledEvents(state: Readonly<SimState>): EventPool {
  const p = POOLS.get(state);
  if (!p) throw new Error('pooledEvents: state was not created by createSim');
  return p;
}
export function registerEventPool(state: SimState, pool: EventPool): void { POOLS.set(state, pool); }
