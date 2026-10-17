import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: process.env.SITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  build: { target: 'es2022', cssCodeSplit: true },
  test: { include: ['tests/**/*.unit.test.ts'], environment: 'node' },
});
