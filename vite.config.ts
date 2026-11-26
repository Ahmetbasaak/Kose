/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import brand from './brand.config.json' with { type: 'json' };
import { allSeoPages } from './src/seo/pages';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const hasDomain = brand.domain && brand.domain !== 'example.com';

/**
 * Search pages as real HTML: own <title>, description and text inside #root, so crawlers read them
 * without running JS. The SPA then boots on top and shows the live version of the same content.
 */
function prerenderSeoPages() {
  return {
    name: 'prerender-seo-pages',
    apply: 'build' as const,
    closeBundle() {
      const dist = 'dist';
      const shell = readFileSync(join(dist, 'index.html'), 'utf8');
      const pages = allSeoPages(Date.now());
      for (const p of pages) {
        const url = hasDomain ? `https://${brand.domain}${p.path}` : null;
        const head = [
          `<meta property="og:title" content="${esc(p.title)}" />`,
          `<meta property="og:description" content="${esc(p.description)}" />`,
          url ? `<link rel="canonical" href="${url}" />` : '',
        ].join('');
        const html = shell
          .replace(/<title>.*?<\/title>/, `<title>${esc(p.title)}</title>${head}`)
          .replace(
            /<meta name="description" content=".*?" \/>/,
            `<meta name="description" content="${esc(p.description)}" />`,
          )
          .replace(
            '<div id="root"></div>',
            `<div id="root"><main style="max-width:720px;margin:48px auto;padding:0 16px;font-family:system-ui,sans-serif"><h1>${esc(p.h1)}</h1><p>${esc(p.intro)}</p><p><a href="/">${esc(brand.name)}</a></p></main></div>`,
          );
        // "/a/b" → dist/a/b.html: served for the slash-less URL without a redirect (Cloudflare and vite preview).
        mkdirSync(join(dist, p.path, '..'), { recursive: true });
        writeFileSync(join(dist, `${p.path}.html`), html);
      }
      const sitemap = hasDomain
        ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
            '/',
            ...pages.map((p) => p.path),
          ]
            .map((path) => `  <url><loc>https://${brand.domain}${path}</loc></url>`)
            .join('\n')}\n</urlset>\n`
        : null;
      if (sitemap) writeFileSync(join(dist, 'sitemap.xml'), sitemap);
      else console.warn('[prerender] brand.config.json domain is a placeholder: sitemap.xml skipped');
      writeFileSync(
        join(dist, 'robots.txt'),
        `User-agent: *\nAllow: /\n${hasDomain ? `Sitemap: https://${brand.domain}/sitemap.xml\n` : ''}`,
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    prerenderSeoPages(),
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
