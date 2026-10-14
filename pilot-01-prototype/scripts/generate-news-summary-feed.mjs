import { readFile, writeFile } from "node:fs/promises";
import { NEWS_DISPLAY_LOCALES, normalizeNewsFeedSummaries, projectNewsArticleForLocale } from "../src/data/news-feed-client.js";

const sourcePath = "public/content/news-feed.json";
const targetPath = "public/content/news-feed-summary.json";
const pageOneLimit = 30;
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const articles = Array.isArray(source?.articles) ? source.articles : [];
const summary = {
  version: source?.version ?? 1,
  generatedAt: source?.generatedAt ?? new Date().toISOString(),
  batchId: source?.batchId ?? null,
  articles: articles.map(({ content: _content, sources: _sources, seo: _seo, aeo: _aeo, geo: _geo, claims: _claims, ...article }) => article),
};
await writeFile(targetPath, `${JSON.stringify(summary)}\n`);
console.log(`Generated ${targetPath} (${Buffer.byteLength(JSON.stringify(summary))} bytes, ${summary.articles.length} articles)`);

const normalized = normalizeNewsFeedSummaries(summary);
const pageOneBase = {
  version: summary.version,
  generatedAt: summary.generatedAt,
  batchId: summary.batchId,
  page: 1,
  pageSize: pageOneLimit,
  total: normalized.length,
  totalPages: Math.max(1, Math.ceil(normalized.length / pageOneLimit)),
};
for (const locale of NEWS_DISPLAY_LOCALES) {
  const page = {
    ...pageOneBase,
    locale,
    articles: normalized.slice(0, pageOneLimit)
      .map((article) => projectNewsArticleForLocale(article, locale))
      .filter(Boolean),
  };
  const pagePath = `public/content/news-feed-page-1.${locale}.json`;
  const body = `${JSON.stringify(page)}\n`;
  await writeFile(pagePath, body);
  console.log(`Generated ${pagePath} (${Buffer.byteLength(body)} bytes, ${page.articles.length} articles)`);
}
