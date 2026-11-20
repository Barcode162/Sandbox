import { defineConfig } from 'vitest/config';

// Frozen in WO-001. Changes go through the CEO.
export default defineConfig({
  base: './',
  build: { target: 'es2022', outDir: 'dist', assetsInlineLimit: 0, sourcemap: false },
  server: { port: 5173 },
  preview: { port: 4317, strictPort: true },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
