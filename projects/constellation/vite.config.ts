import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2022', outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true },
  server: { host: '127.0.0.1', port: 5173 },
});
