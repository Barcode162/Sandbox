// src/core/errors.ts — FROZEN CONTRACT. Implemented in wave 0 (trivial); do not change the shape.
import type { CoreErrorCode } from './types.ts';

export class CoreError extends Error {
  readonly code: CoreErrorCode;
  /** Character offset for 'parse' errors. */
  readonly pos?: number;
  constructor(code: CoreErrorCode, message: string, pos?: number) {
    super(message);
    this.name = 'CoreError';
    this.code = code;
    if (pos !== undefined) this.pos = pos;
  }
}

/** Placeholder thrown by wave-0 stubs. WO-002 removes every use. */
export function notImplemented(name: string): never {
  throw new CoreError('runtime', `not implemented: ${name}`);
}
