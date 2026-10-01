import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // SITE_URL is set in Vercel once the domain is chosen (spec: Decisões em aberto).
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/lab/') && !page.includes('/404') })],
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/ogl')) return 'ogl';
          },
        },
      },
    },
  },
});
