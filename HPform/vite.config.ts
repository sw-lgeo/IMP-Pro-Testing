import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/HPform/',
  plugins: [react()],
  build: {
    outDir: '../public/HPform',
    emptyOutDir: true,
  },
});
