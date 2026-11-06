import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/task-companion/',
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Task Companion', short_name: 'Tasks', description: 'Ruhige, lokale Aufgabenplanung',
      theme_color: '#c83b32', background_color: '#faf9f7', display: 'standalone',
      icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
    },
    workbox: { navigateFallback: 'index.html', globPatterns: ['**/*.{js,css,html,svg}'] }
  })],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', css: true }
});
