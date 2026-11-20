import { defineConfig } from 'vite';

// Static build to dist/; relative base so dist/ can be opened from any path.
export default defineConfig({
  base: './',
  build: { target: 'es2022', outDir: 'dist', sourcemap: false },
  server: { port: 5317 },
  preview: { port: 4317, strictPort: true },
});
