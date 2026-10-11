import { publicStarterLevels, starterContent, starterHref, starterLevels } from "./index.js";

const PUBLIC_ORIGIN = "https://nexualpha.com";
const STARTER_LASTMOD = "2026-10-12";
const STARTER_LOCALES = Object.freeze(["en", "zh-Hans"]);

const levelBySlug = new Map(starterLevels.map((level) => [level.meta.slug, level]));

const textFor = (level, locale) => starterContent(level, locale === "zh-Hans" ? "zh-Hans" : "en");

function canonicalFor(slug = "", locale = "en") {
  return `${PUBLIC_ORIGIN}${starterHref(slug, locale === "zh-Hans" ? "zh-Hans" : "en")}`;
}

function alternatesFor(slug = "") {
  return [
    { hreflang: "en", href: canonicalFor(slug, "en") },
    { hreflang: "zh-Hans", href: canonicalFor(slug, "zh-Hans") },
    { hreflang: "x-default", href: canonicalFor(slug, "en") },
  ];
}

function breadcrumb(name, canonical, locale) {
  const starterName = locale === "zh-Hans" ? "新手村" : "Starter Path";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "NexuAlpha", item: PUBLIC_ORIGIN },
      { "@type": "ListItem", position: 2, name: starterName, item: canonicalFor("", locale) },
      ...(name && canonical !== canonicalFor("", locale) ? [{ "@type": "ListItem", position: 3, name, item: canonical }] : []),
    ],
  };
}

function sourceUrlsFor(level) {
  return Array.isArray(level?.meta?.sources)
    ? level.meta.sources.map((source) => typeof source === "string" ? source : source?.url).filter(Boolean)
    : [];
}

function hubSeo(locale, reviewed) {
  const normalizedLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
  const zh = normalizedLocale === "zh-Hans";
  const levels = publicStarterLevels(reviewed);
  const canonical = canonicalFor("", normalizedLocale);
  const title = zh ? "新手村：12 关加密入门路径 — NexuAlpha" : "Starter Path: 12 Crypto Basics — NexuAlpha";
  const description = zh
    ? "12 关，从注册到安全提币，每关 90 秒。按顺序学习交易所、KYC、安全、入金、现货、手续费和提币检查。"
    : "A 12-level crypto starter path from signup to safer withdrawals, with 90-second lessons on exchanges, KYC, security, deposits, spot trades, fees and network checks.";
  return {
    status: 200,
    title,
    description,
    canonical,
    locale: normalizedLocale,
    robots: "index,follow",
    alternates: alternatesFor(""),
    schema: [
      breadcrumb(zh ? "新手村" : "Starter Path", canonical, normalizedLocale),
      {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: zh ? "新手村" : "Starter Path",
        description,
        url: canonical,
        inLanguage: normalizedLocale,
        dateModified: STARTER_LASTMOD,
        isAccessibleForFree: true,
        educationalLevel: "Beginner",
        learningResourceType: "Course",
        numberOfCredits: levels.length,
        publisher: { "@type": "Organization", name: "NexuAlpha", url: PUBLIC_ORIGIN },
      },
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: zh ? "新手村" : "Starter Path",
        description,
        url: canonical,
        inLanguage: normalizedLocale,
        dateModified: STARTER_LASTMOD,
        isAccessibleForFree: true,
        publisher: { "@type": "Organization", name: "NexuAlpha", url: PUBLIC_ORIGIN },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: levels.length,
          itemListElement: levels.map((level, index) => {
            const content = textFor(level, normalizedLocale);
            return {
              "@type": "ListItem",
              position: index + 1,
              url: canonicalFor(level.meta.slug, normalizedLocale),
              name: content.title,
            };
          }),
        },
      },
    ],
  };
}

function levelSeo(level, locale, reviewed) {
  const normalizedLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
  const content = textFor(level, normalizedLocale);
  const canonical = canonicalFor(level.meta.slug, normalizedLocale);
  const sources = sourceUrlsFor(level);
  const isPendingLegalReview = level.meta.level === 7 && !reviewed;
  const title = `${content.title} — NexuAlpha`;
  const description = content.summary;
  const learningResource = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: content.title,
    description,
    url: canonical,
    inLanguage: normalizedLocale,
    dateModified: STARTER_LASTMOD,
    isAccessibleForFree: true,
    educationalLevel: "Beginner",
    learningResourceType: "Lesson",
    position: level.meta.level,
    publisher: { "@type": "Organization", name: "NexuAlpha", url: PUBLIC_ORIGIN },
    ...(sources.length ? { citation: sources } : {}),
  };
  const faqSchema = Array.isArray(content.faq) && content.faq.length
    ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: normalizedLocale,
      mainEntity: content.faq.map((item) => ({
        "@type": "Question",
        name: item.question || item.q,
        acceptedAnswer: { "@type": "Answer", text: item.answer || item.a },
      })).filter((item) => item.name && item.acceptedAnswer.text),
    }
    : null;
  const videoId = /^[A-Za-z0-9_-]{11}$/.test(String(level.meta.video_youtube_id || ""))
    ? level.meta.video_youtube_id
    : null;
  const videoSchema = videoId ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: content.title,
    description,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    ...(level.meta.video_upload_date ? { uploadDate: level.meta.video_upload_date } : {}),
  } : null;
  return {
    status: 200,
    title,
    description,
    canonical,
    locale: normalizedLocale,
    robots: isPendingLegalReview ? "noindex,follow" : "index,follow",
    alternates: alternatesFor(level.meta.slug),
    schema: [breadcrumb(content.title, canonical, normalizedLocale), learningResource, faqSchema, videoSchema].filter(Boolean),
  };
}

export function starterSeo(contentPath, locale = "en", reviewed = false) {
  const normalizedPath = String(contentPath || "/starter").replace(/\/+$/, "") || "/starter";
  const normalizedLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
  if (normalizedPath === "/starter") return hubSeo(normalizedLocale, reviewed);
  const slug = normalizedPath.match(/^\/starter\/([a-z0-9-]+)$/)?.[1];
  if (!slug) return null;
  const level = levelBySlug.get(slug);
  if (!level) return null;
  return levelSeo(level, normalizedLocale, reviewed);
}

export const starterSeoLastmod = STARTER_LASTMOD;
export const starterSeoLocales = STARTER_LOCALES;
