// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Production canonical URL — used to generate absolute og:url, og:image,
  // canonical link tags, and the eventual sitemap.
  site: 'https://dudewheresmylikeness.ai',

  // Static-by-default; only the /api/rebuild endpoint runs as a Vercel
  // serverless function (it has `export const prerender = false`).
  output: 'static',
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [mdx()]
});