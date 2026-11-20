import { defineConfig } from 'vitest/config';

// Unit tests run in Node: the sim is pure (no DOM). UI/render tests stub the canvas themselves.
export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node', reporters: ['default'] },
});
