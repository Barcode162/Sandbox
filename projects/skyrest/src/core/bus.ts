// src/core/bus.ts — FROZEN (WO-001). Synchronous event bus; listeners run in subscription order.
import type { EventBus, SimEvent, SimEventOf, SimEventType } from '../contracts.ts';

type Fn = (e: SimEvent) => void;

export function createBus(): EventBus {
  const byType = new Map<SimEventType, Fn[]>();
  const any: Fn[] = [];
  const off = (list: Fn[], fn: Fn) => () => {
    const i = list.indexOf(fn);
    if (i >= 0) list.splice(i, 1);
  };
  return {
    on<T extends SimEventType>(type: T, fn: (e: SimEventOf<T>) => void) {
      let list = byType.get(type);
      if (!list) byType.set(type, (list = []));
      list.push(fn as Fn);
      return off(list, fn as Fn);
    },
    onAny(fn) {
      any.push(fn);
      return off(any, fn);
    },
    emit(e) {
      const list = byType.get(e.type);
      if (list) for (let i = 0; i < list.length; i++) list[i]!(e);
      for (let i = 0; i < any.length; i++) any[i]!(e);
    },
  };
}
