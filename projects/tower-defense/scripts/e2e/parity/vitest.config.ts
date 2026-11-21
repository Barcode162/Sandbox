import { defineConfig } from 'vitest/config';

// Board condition 2: the win/loss scripts run headless under Vitest (Node) so playthrough.mjs can
// assert the browser gives the identical RunSummary. Invoked by playthrough.mjs, not by `npm run test:unit`.
export default defineConfig({
  test: { include: ['scripts/e2e/parity/*.test.ts'], environment: 'node', reporters: ['default'], testTimeout: 240_000 },
});
