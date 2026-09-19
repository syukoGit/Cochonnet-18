import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const src = resolve(import.meta.dirname, 'src');

export default defineConfig({
  main: {
    resolve: { alias: { '@': src } },
    build: {
      outDir: 'out/main',
      rollupOptions: { input: resolve(import.meta.dirname, 'electron/main/index.ts') },
    },
  },
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: resolve(import.meta.dirname, 'electron/preload/index.ts'),
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
  renderer: {
    root: '.',
    resolve: { alias: { '@': src } },
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'out/renderer',
      rollupOptions: { input: resolve(import.meta.dirname, 'index.html') },
    },
  },
});
