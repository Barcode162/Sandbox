import { defineConfig } from 'vitest/config';

// Unit tests run in Node: the sim is pure (no DOM). UI/render tests stub the canvas themselves.
export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node', reporters: ['default'],
    // Files run one at a time: the [A3] Node perf test times sim steps, and parallel workers stole its CPU
    // (p99 flaked over 6 ms 2 of 6 runs at Gate 2). The suite still runs in seconds.
    fileParallelism: false },
});
