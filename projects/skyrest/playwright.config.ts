// Pinned @playwright/test 1.63.0; Chromium is preinstalled under PLAYWRIGHT_BROWSERS_PATH. Never run `playwright install`.
// WebGL in headless Chromium = SwiftShader (software): judge look from screenshots, perf from draw calls/triangles, never fps.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4176);
const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export default defineConfig({
  testDir: 'tests/e2e',
  retries: 0,
  workers: 2,
  timeout: 60_000,
  forbidOnly: true,
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    trace: 'off',
    launchOptions: { args },
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium' }, testIgnore: /\.phone\.spec\.ts$/ },
    // Emulated iPhone 15 Pro Max class (touch, portrait 430x932). Landscape via page.setViewportSize in the spec.
    {
      name: 'phone',
      use: { ...devices['iPhone 15 Pro Max'], browserName: 'chromium', deviceScaleFactor: 1, launchOptions: { args } },
      testMatch: /\.phone\.spec\.ts$/,
    },
  ],
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 20_000,
  },
});
