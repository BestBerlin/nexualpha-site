import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "public/content/news-feed.json";
const targetPath = "public/content/news-feed-summary.json";
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
