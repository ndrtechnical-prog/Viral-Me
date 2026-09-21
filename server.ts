import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/router.ts';
import { generateDynamicSitemapXml } from './src/server/seoKeywords.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Direct Sitemap.xml for domain viralme.site
app.get('/sitemap.xml', (_req, res) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(generateDynamicSitemapXml());
});

// Direct Robots.txt
app.get('/robots.txt', (_req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(`User-agent: *\nAllow: /\nDisallow: /api/admin/\n\nSitemap: https://viralme.site/sitemap.xml\n`);
});

// API endpoints
app.use('/api', apiRouter);

// Serve static files in production
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to SPA index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
