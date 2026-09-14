import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      rollupOptions: { input: resolve(import.meta.dirname, 'electron/main/index.ts') },
    },
  },
  renderer: {
    root: '.',
    resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
    plugins: [react()],
    build: {
      outDir: 'out/renderer',
      rollupOptions: { input: resolve(import.meta.dirname, 'index.html') },
    },
  },
});
