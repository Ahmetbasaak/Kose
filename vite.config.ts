/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
