// Playwright config: e2e flows, axe scans and screenshot capture against the static server.
import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4174);

export default defineConfig({
  testDir: 'tests/e2e',
  retries: 0,
  workers: 3,
  forbidOnly: true,
  reporter: 'list',
  outputDir: 'test-results',
  use: { baseURL: `http://127.0.0.1:${PORT}`, viewport: { width: 1440, height: 900 }, trace: 'off' },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 15_000,
    env: { PORT: String(PORT) },
  },
});
