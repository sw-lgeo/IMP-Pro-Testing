import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Use a relative base path so the app also works when served from a
  // nested directory (e.g. `public_html/xyz/HPform`).
  base: './',
  plugins: [react()],
  build: {
    outDir: '../public/HPform',
    emptyOutDir: true,
  },
});
