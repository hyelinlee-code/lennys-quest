import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages project site: https://hyelinlee-code.github.io/lennys-quest/
  base: process.env.GITHUB_ACTIONS ? '/lennys-quest/' : '/',
  plugins: [react(), tailwindcss()],
  server: { port: 3456 },
});
