import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import express from 'express';
import {defineConfig, type Plugin} from 'vite';
import {apiRouter} from './src/server/router.ts';
import {generateDynamicSitemapXml} from './src/server/seoKeywords.ts';

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      const app = express();
      app.use(express.json());
      app.get('/sitemap.xml', (_req, res) => {
        res.header('Content-Type', 'application/xml; charset=utf-8');
        res.send(generateDynamicSitemapXml());
      });
      app.get('/robots.txt', (_req, res) => {
        res.header('Content-Type', 'text/plain; charset=utf-8');
        res.send(`User-agent: *\nAllow: /\nDisallow: /api/admin/\n\nSitemap: https://viralme.site/sitemap.xml\n`);
      });
      app.use('/api', apiRouter);
      server.middlewares.use(app);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
