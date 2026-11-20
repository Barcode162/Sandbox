// playwright.config.js (pinned @playwright/test 1.63.0; never run `playwright install` here).
// Projects: e2e (tests/e2e) and perf (tests/perf, *.perf.js only, one worker).
// The webServer is scripts/serve.mjs; PORT and SITE_DIR are passed through (mutants use both).
import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4173);
const SITE_DIR = process.env.SITE_DIR ?? 'site';

export default defineConfig({
  retries: 0,
  workers: 2,
  forbidOnly: true,
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    trace: 'off',
  },
  projects: [
    {
      name: 'e2e',
      testDir: 'tests/e2e',
      testIgnore: '**/evidence/check-index.mjs',
    },
    {
      name: 'perf',
      testDir: 'tests/perf',
      testMatch: '**/*.perf.js',
      workers: 1,
    },
  ],
  webServer: {
    command: 'node scripts/serve.mjs',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 15_000,
    env: { PORT: String(PORT), SITE_DIR },
  },
});
