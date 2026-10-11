import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { NEWS_INDEXABLE_LOCALES, dedupeRepeatedLongSentences } from "../src/data/news-feed-client.js";
import { repairNewsArticle } from "../src/data/news-content-repair.js";

// Localized news lane (2026-10-10): a package always carries article.en.md (the canonical edition) and may carry
// article.<locale>.md for any other UI locale, declared in article.json bodyFiles[<locale>] with titles[<locale>].
// Each optional edition is written natively (not translated) and must meet the same length gate the English body
// meets in the publisher: 900+ words for alphabetic scripts, 1,000+ characters for CJK locales.
const OPTIONAL_LOCALE_MIN_WORDS = 900;
const OPTIONAL_LOCALE_MIN_CJK_CHARS = 1000;
const CJK_LOCALES = new Set(["zh-Hans", "zh-Hant", "ja", "ko"]);
const CORE_LOCALES = new Set(["en", "zh-Hans"]);

export function localeBodyLength(markdown, locale) {
  const text = cleanArticleBody(markdown);
  if (CJK_LOCALES.has(locale)) {
    return { unit: "characters", count: (text.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g) ?? []).length, minimum: OPTIONAL_LOCALE_MIN_CJK_CHARS };
  }
  return { unit: "words", count: (text.match(/\p{L}[\p{L}\p{M}'’-]*/gu) ?? []).length, minimum: OPTIONAL_LOCALE_MIN_WORDS };
}

const REQUIRED_REVIEW_PASSES = new Set([
  "source_and_claim",
  "editorial_quality",
  "seo_aeo_geo",
  "compliance_and_commercial",
]);

const ACCEPTED_STATUSES = new Set(["STAGED", "PUBLISHED"]);
const PUBLIC_ORIGIN = "https://nexualpha.com";
const PUBLIC_SOURCE_STATUS = "PUBLIC_SOURCE_MAPPED";
const PUBLISHED_BODY_BLOCKERS = [
  /\bStatus:\s*staged(?:\s+for\s+NexuAlpha\s+publication\s+review|\s+for\s+NexuAlpha\s+publisher)?\.?/i,
  /状态：待\s*NexuAlpha\s*发布复核。?/,
  /状态：等待\s*NexuAlpha\s*发布脚本处理/,
  /\bsource IDs?\s+in\s+article\.json\s+and\s+sources\.md\b/i,
  /\bmaps?\s+to\s+article\.json\s+and\s+sources\.md\b/i,
  /\bmapped\s+to\s+source\s+IDs?\s+in\s+article\.json\s+and\s+sources\.md\b/i,
  /\bsources?\s+listed\s+in\s+article\.json\s+and\s+sources\.md\b/i,
  /不能替代\s*article\.json\s*与\s*sources\.md\s*(中|里)?的?来源映射/,
  /article\.json\s+和\s+sources\.md\s+记录了/,
  /在\s*`?article\.json`?\s+和\s+`?sources\.md`?\s+中记录了/,
  /Full URLs and claim mapping are recorded in\s+`?sources\.md`?/i,
  /\bcurrent package remains staged\b/i,
  /\bwhen the article route exists\b/i,
  /\bstaged article\b/i,
  /当前包仍处于暂存状态/,
  /等\s*NexuAlpha\s*上线真实文章路由后/i,
  /这篇暂存文章/,
  /This is the only comparison table this article needs/i,
  /A clean article should/i,
  /^#{2,3}\s+(?:Editorial treatment for future updates|Why this article is separate from the comparison page)/im,
  /^#{2,3}\s*(?:内容如何服务\s*CTA|站内链接应承担的角色)/im,
];

const VENUE_ALIASES = new Map([
  ["binance", "binance"],
  ["okx", "okx"],
  ["bybit", "bybit"],
  ["bitget", "bitget"],
  ["coinbase", "coinbase"],
  ["kraken", "kraken"],
  ["gate.io", "gate-io"],
  ["gate-io", "gate-io"],
  ["kucoin", "kucoin"],
  ["mexc", "mexc"],
  ["backpack", "backpack"],
  ["hyperliquid", "hyperliquid"],
  ["dydx", "dydx"],
  ["dydx chain", "dydx"],
  ["dydx protocol", "dydx"],
  ["deribit", "deribit"],
  ["gmx", "gmx"],
  ["drift", "drift"],
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function firstParagraph(markdown) {
  const body = cleanArticleBody(markdown);
  const paragraph = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("#") && !part.startsWith("|"));
  return paragraph ? completeSentenceExcerpt(paragraph) : "";
}

function cleanArticleBody(markdown) {
  const lines = cleanString(markdown).split(/\r?\n/);
  const withoutTitle = lines[0]?.startsWith("# ") ? lines.slice(1) : lines;
  const firstSection = withoutTitle.findIndex((line) => line.startsWith("## "));
  const bodyLines = firstSection >= 0 ? withoutTitle.slice(firstSection) : withoutTitle;
  return dedupeRepeatedLongSentences(bodyLines.join("\n"));
}

function completeSentenceExcerpt(value, maxLength = 230) {
  const text = cleanString(value).replace(/\s+/g, " ");
  if (!text) return "";
  if (text.length <= maxLength && /[.!?。！？]$/.test(text)) return text;
  const protectedText = text
    .replaceAll("U.S.", "U<S>")
    .replaceAll("U.K.", "U<K>")
    .replaceAll("e.g.", "e<g>")
    .replaceAll("i.e.", "i<e>")
    .replace(/(\d)\.(\d)/g, "$1<D>$2");
  const restore = (sentence) => sentence
    .replaceAll("U<S>", "U.S.")
    .replaceAll("U<K>", "U.K.")
    .replaceAll("e<g>", "e.g.")
    .replaceAll("i<e>", "i.e.")
    .replaceAll("<D>", ".");
  const candidates = [...protectedText.matchAll(/[^.!?。！？]+[.!?。！？]/gu)]
    .map((match) => match[0].trim())
    .map(restore)
    .filter(Boolean);
  let excerpt = "";
  for (const sentence of candidates) {
    const next = excerpt ? `${excerpt} ${sentence}` : sentence;
    if (next.length > maxLength) break;
    excerpt = next;
  }
  if (excerpt) return excerpt;

  const boundedText = (candidates[0] || text).slice(0, maxLength + 1);
  const clauseBoundary = Math.max(
    boundedText.lastIndexOf(";"),
    boundedText.lastIndexOf(":"),
  );
  if (clauseBoundary >= 40) {
    return `${boundedText.slice(0, clauseBoundary).trim()}.`;
  }

  return "";
}

function estimateReadTime(enMarkdown, zhMarkdown = "") {
  const enWords = cleanString(enMarkdown).split(/\s+/).filter(Boolean).length;
  const zhChars = cleanString(zhMarkdown).replace(/[\s\p{P}\p{S}]/gu, "").length;
  const minutes = Math.max(3, Math.ceil(Math.max(enWords / 220, zhChars / 450)));
  return `${minutes} min`;
}

function pickLocales(record, locales) {
  return Object.fromEntries(locales.flatMap((locale) => (cleanString(record?.[locale]) ? [[locale, record[locale]]] : [])));
}

function validateSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return [];
  return sources.flatMap((source) => {
    if (!isRecord(source)) return [];
    const url = cleanString(source.url);
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return [];
    } catch {
      return [];
    }
    const publisher = cleanString(source.publisher);
    const title = cleanString(source.title);
    if (!publisher || !title) return [];
    return [{
      id: cleanString(source.id),
      url,
      publisher,
      title,
      publishedAt: cleanString(source.publishedAt) || null,
      accessedAt: cleanString(source.accessedAt) || null,
      primary: source.primary !== false,
      role: cleanString(source.role) || null,
    }];
  });
}

function hasFourPassReview(article) {
  const passes = Array.isArray(article.review?.passes) ? article.review.passes : [];
  return [...REQUIRED_REVIEW_PASSES].every((pass) => passes.includes(pass));
}

function relatedVenues(article) {
  const candidates = [
    ...(Array.isArray(article.entities) ? article.entities : []),
    ...(Array.isArray(article.intent?.futureInternalLinks) ? article.intent.futureInternalLinks : []),
    ...(Array.isArray(article.seo?.internalLinkTargets) ? article.seo.internalLinkTargets : []),
  ];
  const seen = new Set();
  return candidates.flatMap((value) => {
    const lower = cleanString(value).toLowerCase().replace(/^\/venues\//, "").replace(/^\/exchanges\//, "").replace(/\/$/, "");
    const slug = VENUE_ALIASES.get(lower);
    if (!slug || seen.has(slug)) return [];
    seen.add(slug);
    return [slug];
  });
}

function normalizeInternalLinkTarget(value) {
  const text = cleanString(value);
  if (!text) return text;
  if (text.startsWith("/venues/")) return text.replace(/^\/venues\//, "/exchanges/");
  if (text.startsWith(`${PUBLIC_ORIGIN}/venues/`)) return text.replace(`${PUBLIC_ORIGIN}/venues/`, `${PUBLIC_ORIGIN}/exchanges/`);
  return text;
}

function normalizedSeo(seo) {
  if (!isRecord(seo)) return {};
  return {
    ...seo,
    ...(Array.isArray(seo.internalLinkTargets)
      ? { internalLinkTargets: seo.internalLinkTargets.map(normalizeInternalLinkTarget) }
      : {}),
  };
}

function publishedBodyBlocker(markdown) {
  return PUBLISHED_BODY_BLOCKERS.find((pattern) => pattern.test(markdown))?.source ?? null;
}

function toPublishedArticle(article, siteOrigin) {
  const canonical = `${siteOrigin}/news/${article.slug}`;
  const locales = Array.isArray(article.availableLocales) ? article.availableLocales : ["en"];
  return {
    ...article,
    sourceStatus: PUBLIC_SOURCE_STATUS,
    status: "PUBLISHED",
    availableLocales: locales,
    title: pickLocales(article.title, locales),
    summary: pickLocales(article.summary, locales),
    content: pickLocales(article.content, locales),
    seo: {
      ...article.seo,
      canonical,
      noindex: false,
    },
  };
}

export async function importArticlePackage(packageDir, options = {}) {
  const articlePath = path.join(packageDir, "article.json");
  let article;
  try {
    article = JSON.parse(await readFile(articlePath, "utf8"));
  } catch (error) {
    return { ok: false, packageDir, reason: `invalid article.json: ${error.message}` };
  }

  if (!ACCEPTED_STATUSES.has(cleanString(article.status))) {
    return { ok: false, packageDir, reason: "status must be STAGED or PUBLISHED" };
  }
  if (!hasFourPassReview(article)) {
    return { ok: false, packageDir, reason: "missing required four-pass review" };
  }

  const sources = validateSources(article.sources);
  if (sources.length === 0) {
    return { ok: false, packageDir, reason: "missing valid sources" };
  }

  const enFile = cleanString(article.bodyFiles?.en);
  if (!enFile) {
    return { ok: false, packageDir, reason: "missing localized body file declarations" };
  }
  // Every declared edition: English first, then any other UI locale the package carries (zh-Hans included).
  const bodyLocales = ["en", ...NEWS_INDEXABLE_LOCALES.filter((locale) => locale !== "en" && cleanString(article.bodyFiles?.[locale]))];
  const unsupported = Object.keys(isRecord(article.bodyFiles) ? article.bodyFiles : {})
    .filter((key) => key !== "htmlPreview" && !NEWS_INDEXABLE_LOCALES.includes(key));
  if (unsupported.length) {
    return { ok: false, packageDir, reason: `unsupported body locale: ${unsupported.join(", ")}` };
  }

  const markdownByLocale = {};
  try {
    await Promise.all(bodyLocales.map(async (locale) => {
      markdownByLocale[locale] = await readFile(path.join(packageDir, cleanString(article.bodyFiles[locale])), "utf8");
    }));
  } catch (error) {
    return { ok: false, packageDir, reason: `missing localized body file: ${error.message}` };
  }
  const enMarkdown = markdownByLocale.en;
  const zhMarkdown = markdownByLocale["zh-Hans"] || "";

  const contentByLocale = Object.fromEntries(bodyLocales.map((locale) => [locale, cleanArticleBody(markdownByLocale[locale])]));
  const enContent = contentByLocale.en;
  if (!enContent || bodyLocales.some((locale) => !contentByLocale[locale])) {
    return { ok: false, packageDir, reason: "missing localized body content" };
  }
  if (options.publish === true) {
    const blocker = publishedBodyBlocker(bodyLocales.map((locale) => contentByLocale[locale]).join("\n"));
    if (blocker) {
      return { ok: false, packageDir, reason: `published body still contains staging-only language: ${blocker}` };
    }
  }
  // Optional editions meet the per-locale length gate on their own; en and zh-Hans are gated by the package builder
  // and the publisher's English search gate, so existing packages keep importing unchanged.
  for (const locale of bodyLocales.filter((item) => !CORE_LOCALES.has(item))) {
    const length = localeBodyLength(markdownByLocale[locale], locale);
    if (length.count < length.minimum) {
      return { ok: false, packageDir, reason: `${locale} body is too thin: ${length.count} ${length.unit}; minimum is ${length.minimum}` };
    }
    if (!cleanString(article.titles?.[locale])) {
      return { ok: false, packageDir, reason: `missing ${locale} title for the ${locale} body` };
    }
  }

  const slug = cleanString(article.slug);
  const publishedAt = cleanString(article.publishedAt) || cleanString(article.review?.reviewedAt) || cleanString(article.sources?.[0]?.accessedAt) || new Date().toISOString();
  const updatedAt = cleanString(article.review?.reviewedAt) || cleanString(article.updatedAt) || null;
  const titleEn = cleanString(article.titles?.en);
  const titleZh = cleanString(article.titles?.["zh-Hans"]);
  const seoDescription = cleanString(article.seo?.description);
  const summarySource = /[.!?]$/.test(seoDescription)
    ? seoDescription
    : cleanString(article.aeo?.directAnswer) || firstParagraph(enMarkdown);
  const summaryEn = completeSentenceExcerpt(summarySource);
  if (!slug || !titleEn || (bodyLocales.includes("zh-Hans") && !titleZh) || Number.isNaN(Date.parse(publishedAt))) {
    return { ok: false, packageDir, reason: "missing slug, titles, or valid published time" };
  }
  // Optional editions: the package may ship a native summary (article.json summaries[<locale>]); otherwise the first
  // paragraph of that body (after its first "## " section) becomes the summary, as it does for zh-Hans.
  const localizedTitles = pickLocales(article.titles, bodyLocales);
  const localizedSummaries = Object.fromEntries(bodyLocales.filter((locale) => locale !== "en").flatMap((locale) => {
    const summary = completeSentenceExcerpt(cleanString(article.summaries?.[locale])) || firstParagraph(markdownByLocale[locale]);
    return summary ? [[locale, summary]] : [];
  }));
  const availableLocales = bodyLocales.filter((locale) => locale === "en" || (localizedTitles[locale] && localizedSummaries[locale]));
  const missingSummary = bodyLocales.find((locale) => !availableLocales.includes(locale));
  if (missingSummary) {
    return { ok: false, packageDir, reason: `missing ${missingSummary} title or summary for the ${missingSummary} body` };
  }
  if (updatedAt && Number.isNaN(Date.parse(updatedAt))) {
    return { ok: false, packageDir, reason: "invalid updated time" };
  }
  if (!summaryEn) {
    return { ok: false, packageDir, reason: "missing a complete English search summary" };
  }

  return {
    ok: true,
    article: {
      slug,
      status: cleanString(article.status),
      category: "research",
      categoryName: {
        en: "Source-Backed Research",
        "zh-Hans": "源头核验研究",
      },
      publishedAt: new Date(Date.parse(publishedAt)).toISOString(),
      updatedAt: updatedAt ? new Date(Date.parse(updatedAt)).toISOString() : null,
      readTime: estimateReadTime(enMarkdown, zhMarkdown),
      author: cleanString(article.author) || "NexuAlpha Research Desk",
      title: { ...localizedTitles, en: titleEn },
      summary: { ...localizedSummaries, en: summaryEn },
      content: pickLocales(contentByLocale, availableLocales),
      availableLocales,
      sources,
      claims: Array.isArray(article.claims) ? article.claims : [],
      relatedVenues: relatedVenues(article),
      seo: normalizedSeo({
        ...article.seo,
        description: summaryEn,
      }),
      aeo: isRecord(article.aeo) ? article.aeo : {},
      geo: isRecord(article.geo) ? article.geo : {},
    },
  };
}

export async function importBatch(batchDir, options = {}) {
  const entries = await readdir(batchDir, { withFileTypes: true });
  const packageDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(batchDir, entry.name))
    .sort();
  const results = await Promise.all(packageDirs.map((packageDir) => importArticlePackage(packageDir, options)));
  const imported = results
    .filter((result) => result.ok)
    .map((result) => options.publish === true
      ? toPublishedArticle(result.article, options.siteOrigin || PUBLIC_ORIGIN)
      : result.article);
  const rejected = results.filter((result) => !result.ok).map(({ packageDir, reason }) => ({
    package: path.basename(packageDir),
    reason,
  }));

  imported.sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));

  return {
    feed: {
      version: 1,
      generatedAt: new Date().toISOString(),
      batchId: path.basename(batchDir),
      articleCount: imported.length,
      articles: imported,
    },
    health: {
      version: 1,
      generatedAt: new Date().toISOString(),
      batchId: path.basename(batchDir),
      mode: options.publish === true ? "PUBLISHED" : "STAGED",
      packageCount: packageDirs.length,
      importedCount: imported.length,
      rejectedCount: rejected.length,
      rejected,
      slugs: imported.map((article) => article.slug),
    },
  };
}

async function readExistingArticles(existingFeedPath) {
  if (!existingFeedPath) return [];
  try {
    const parsed = JSON.parse(await readFile(existingFeedPath, "utf8"));
    if (!Array.isArray(parsed?.articles)) throw new Error("published feed protection: invalid existing articles array");
    return parsed.articles.filter((article) => cleanString(article?.status) === "PUBLISHED");
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function articleFreshnessTime(article) {
  const candidates = [cleanString(article?.updatedAt), cleanString(article?.publishedAt)];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const time = Date.parse(candidate);
    if (!Number.isNaN(time)) return { iso: new Date(time).toISOString(), time };
  }
  return null;
}

function mergeArticles(existing, incoming) {
  const merged = new Map();
  const retainedSlugs = new Set();
  const rollbackBlocked = [];
  for (const article of existing) {
    const slug = cleanString(article?.slug);
    if (slug) {
      merged.set(slug, sanitizeArticleContent(article));
      retainedSlugs.add(slug);
    }
  }
  for (const article of incoming) {
    const slug = cleanString(article?.slug);
    if (!slug) continue;
    const existingArticle = merged.get(slug);
    const existingFreshness = articleFreshnessTime(existingArticle);
    const incomingFreshness = articleFreshnessTime(article);
    if (existingArticle && existingFreshness && incomingFreshness && incomingFreshness.time < existingFreshness.time) {
      rollbackBlocked.push({
        slug,
        existingUpdatedAt: existingFreshness.iso,
        incomingUpdatedAt: incomingFreshness.iso,
      });
      continue;
    }
    merged.set(slug, sanitizeArticleContent(article));
    retainedSlugs.delete(slug);
  }
  return {
    articles: [...merged.values()].sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt)),
    retainedCount: retainedSlugs.size,
    rollbackBlocked,
  };
}

// Protect the actual write target in every mode. Replacing a candidate must
// not silently remove, demote or roll back already published articles.
function assertPublishedArticlesPreserved(existing, incoming) {
  const candidates = new Map(incoming.map((article) => [cleanString(article?.slug), article]));
  const seen = new Set();
  for (const article of existing) {
    const slug = cleanString(article?.slug);
    if (!slug || seen.has(slug)) throw new Error("published feed protection: invalid existing published slug");
    seen.add(slug);
    const candidate = candidates.get(slug);
    if (!candidate) throw new Error(`published feed protection: missing published article ${slug}`);
    if (cleanString(candidate.status) !== "PUBLISHED") throw new Error(`published feed protection: status demotion for ${slug}`);
    const previousTime = articleFreshnessTime(article);
    const nextTime = articleFreshnessTime(candidate);
    if (previousTime && !nextTime) throw new Error(`published feed protection: undated replacement for ${slug}`);
    if (previousTime && nextTime.time < previousTime.time) throw new Error(`published feed protection: older replacement for ${slug}`);
  }
}

// Every article written to the feed (new and retained) gets the deterministic text repairs of
// src/data/news-content-repair.js (scorecard C4, 2026-10-11): truncated summaries completed from the body, Markdown
// markers removed from plain-text fields, Markdown links to local filesystem paths reduced to their label.
function sanitizeArticleContent(article) {
  if (!isRecord(article?.content)) return article;
  const content = Object.fromEntries(
    Object.entries(article.content).map(([locale, markdown]) => [
      locale,
      typeof markdown === "string" ? dedupeRepeatedLongSentences(markdown) : markdown,
    ]),
  );
  return repairNewsArticle({ ...article, content }).article;
}

export async function writeBatchFeed(batchDir, outputDir, options = {}) {
  const { feed, health } = await importBatch(batchDir, options);
  if (options.publish === true && health.rejectedCount > 0) {
    throw new Error(`publish blocked: ${health.rejectedCount} package(s) failed import validation`);
  }
  const existingFeedPath = options.merge === true
    ? (options.existingFeedPath || path.join(outputDir, "news-feed.json"))
    : null;
  const existingArticles = await readExistingArticles(existingFeedPath);
  const mergeResult = mergeArticles(existingArticles, feed.articles);
  feed.articles = mergeResult.articles;
  feed.articleCount = feed.articles.length;
  health.rollbackBlocked = mergeResult.rollbackBlocked;
  health.retainedCount = mergeResult.retainedCount;
  health.totalCount = feed.articles.length;
  // existingFeedPath controls merge input, never the destination invariant.
  const targetArticles = await readExistingArticles(path.join(outputDir, "news-feed.json"));
  assertPublishedArticlesPreserved(targetArticles, feed.articles);
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, "news-feed.json"), `${JSON.stringify(feed, null, 2)}\n`),
    writeFile(path.join(outputDir, "news-health.json"), `${JSON.stringify(health, null, 2)}\n`),
  ]);
  return { feed, health };
}

async function main() {
  const cliArgs = process.argv.slice(2);
  const positional = cliArgs.filter((arg) => !arg.startsWith("--"));
  const batchDir = positional[0];
  const outputDir = positional[1] || path.resolve("public/content");
  const publish = cliArgs.includes("--publish");
  const merge = cliArgs.includes("--merge");
  const siteOrigin = cliArgs.find((arg) => arg.startsWith("--site-origin="))?.split("=").slice(1).join("=") || PUBLIC_ORIGIN;
  if (!batchDir) {
    console.error("Usage: node scripts/import-nexualpha-content.mjs <batch-dir> [output-dir] [--publish] [--merge] [--site-origin=https://example.com]");
    process.exitCode = 1;
    return;
  }
  const result = await writeBatchFeed(path.resolve(batchDir), path.resolve(outputDir), { publish, merge, siteOrigin });
  console.log(JSON.stringify(result.health, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
