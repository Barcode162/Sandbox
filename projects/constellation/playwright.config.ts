// Pinned @playwright/test 1.63.0; browsers are preinstalled under PLAYWRIGHT_BROWSERS_PATH. Never run `playwright install`.
import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4174);

export default defineConfig({
  testDir: 'tests/e2e',
  retries: 0,
  workers: 2,
  forbidOnly: true,
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    trace: 'off',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 20_000,
  },
});
