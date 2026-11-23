/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import brand from './brand.config.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'brand-html',
      transformIndexHtml: (html) =>
        html
          .replaceAll('%BRAND_NAME%', brand.name)
          .replaceAll('%BRAND_DESC%', brand.shortDescription)
          .replaceAll('%THEME_COLOR%', brand.themeColor),
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: brand.name,
        short_name: brand.name,
        description: brand.shortDescription,
        lang: 'tr',
        start_url: '/',
        display: 'standalone',
        theme_color: brand.themeColor,
        background_color: '#F6F5F1',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Turkish needs only the latin + latin-ext Inter subsets; skip precaching the rest.
        globIgnores: ['**/inter-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
