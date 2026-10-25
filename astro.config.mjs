import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://movietoon.ir',
  output: 'server',
  // Vercel builds set VERCEL=1: use the Vercel adapter there, standalone Node locally.
  adapter: process.env.VERCEL ? vercel() : node({ mode: 'standalone' }),
  integrations: [react(), sitemap(), tailwind()],
  // Fixed dev port: this project owns :4321. strictPort makes Astro fail
  // loudly instead of silently sliding onto another project's port.
  server: { port: 4321, strictPort: true },
  // Dev toolbar disabled: it floats over content and confuses visual QA.
  devToolbar: { enabled: false },
  vite: {
    ssr: { noExternal: [] },
    server: {
      // Local dev only: forward browser /api/* calls to the NestJS API.
      // (Build-time SSR uses absolute PUBLIC_API_URL instead.)
      // NOTE: trailing slash matters — '/api' would also match
      // '/api-titles.json' (public index, no auth) and break it offline.
      proxy: { '^/api/.*': { target: 'http://localhost:3001', changeOrigin: true } },
    },
  },
});
