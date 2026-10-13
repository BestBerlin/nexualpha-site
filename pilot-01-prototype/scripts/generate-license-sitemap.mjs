import { readFileSync, writeFileSync } from 'node:fs';
import { buildLicensesSitemap } from './generate-prerender-manifest.mjs';
const sitemap = buildLicensesSitemap();
writeFileSync(new URL('../public/sitemap-licenses.xml', import.meta.url), sitemap.xml);
const indexUrl = new URL('../public/sitemap.xml', import.meta.url);
const index = readFileSync(indexUrl, 'utf8');
writeFileSync(indexUrl, index.replace(/(<loc>https:\/\/nexualpha\.com\/sitemap-licenses\.xml<\/loc>\s*<lastmod>)[^<]+/, `$1${sitemap.lastmod}`));
console.log(`Generated ${sitemap.count} licence sitemap URLs; lastmod ${sitemap.lastmod}`);
