import { defineConfig } from 'vite';

// base './' so the build works from any sub-path (gh-pages: /Sandbox/skyrest/).
export default defineConfig({
  base: './',
  build: { target: 'es2022', outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900, assetsInlineLimit: 0 },
  preview: { host: '127.0.0.1', port: 4176, strictPort: true },
  server: { host: '127.0.0.1', port: 5176 },
});
