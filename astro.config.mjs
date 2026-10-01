import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// SITE_URL is set in Vercel once the domain is chosen (spec: Decisões em aberto). Until then,
// production builds on Vercel use the project's production domain so canonical, hreflang and the
// sitemap never point at localhost.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl = process.env.SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:4321');
const site = siteUrl.replace(/\/$/, '');

export default defineConfig({
  site,
  trailingSlash: 'always',
  // Base.css is small (~9 KB); inlining it removes the render-blocking request in front of the LCP.
  build: { inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      // The root only redirects to /pt/, so it is not a page to index.
      filter: (page) => page !== `${site}/` && !page.includes('/lab/') && !page.includes('/404'),
    }),
  ],
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
