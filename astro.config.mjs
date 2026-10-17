import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://movietoon.example.ir',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), sitemap(), tailwind()],
  // Fixed dev port: this project owns :4321. strictPort makes Astro fail
  // loudly instead of silently sliding onto another project's port.
  server: { port: 4321, strictPort: true },
  // Dev toolbar disabled: it floats over content and confuses visual QA.
  devToolbar: { enabled: false },
  vite: {
    ssr: { noExternal: [] },
  },
});
