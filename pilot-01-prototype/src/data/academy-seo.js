// Server-only (Worker head, /api/route-seo, src/data/seo-injection.js, sitemap): titles, descriptions and JSON-LD of
// NexuAlpha Academy. The hub is a Course; each lesson page is a VideoObject plus a LearningResource of that course.
import { ACADEMY_COPY } from "./academy-copy.js";
import { ACADEMY_CONTENT_BY_LOCALE } from "./academy-content-all.js";
import {
  ACADEMY_EPISODES, ACADEMY_INDEX_LOCALES, ACADEMY_ORIGIN, ACADEMY_PATH, ACADEMY_TOTAL_SECONDS, ACADEMY_UPLOAD_DATE,
  academyContentLocale, academyEpisodePath, academyMedia, isoDuration, parseAcademyPath,
} from "./academy.js";
import { titleBudgetForLocale } from "./meta-description.js";

const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": `${ACADEMY_ORIGIN}/#organization`, name: "NexuAlpha", url: `${ACADEMY_ORIGIN}/` });

export function academyCopy(locale) {
  return ACADEMY_COPY[locale] || (String(locale || "").startsWith("zh") ? ACADEMY_COPY["zh-Hans"] : ACADEMY_COPY.en);
}
export function academyLessons(locale) {
  return ACADEMY_CONTENT_BY_LOCALE[academyContentLocale(locale)].lessons;
}
const fill = (template, vars) => String(template).replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? "");

/** First candidate that fits the locale's title budget (no "…" truncation in results). */
function fitTitle(candidates, locale) {
  const budget = titleBudgetForLocale(locale);
  return candidates.find((title) => title && title.length <= budget) || candidates[candidates.length - 1];
}

/**
 * Meta description from whole sentences in their original order, 120–160 characters where the copy allows (the shared
 * snippet budget pads anything shorter with generic site text). Prefers keeping the first part (the lesson goal).
 */
function sentenceDescription(parts, { min = 120, max = 160 } = {}) {
  const items = parts.filter(Boolean).map(String);
  const join = (list) => list.join(/[\u3000-\u9fff\uac00-\ud7af]$/.test(list[0] || "") ? "" : " ");
  let best = null;
  for (let mask = 1; mask < 1 << items.length; mask += 1) {
    const chosen = items.filter((_item, index) => mask & (1 << index));
    const text = join(chosen);
    if (text.length > max) continue;
    const fits = text.length >= min;
    const score = (fits ? 1000 : 0) + (chosen[0] === items[0] ? 300 : 0) + (fits ? -chosen.length : text.length / 1000);
    if (!best || score > best.score || (score === best.score && text.length > best.text.length)) best = { score, text };
  }
  return best ? best.text : items[0].slice(0, max);
}

export function academyHubMeta(locale) {
  const t = academyCopy(locale);
  return {
    title: fitTitle([`${t.seoHubTitle} — NexuAlpha`, t.seoHubTitle], locale),
    description: sentenceDescription([t.seoHubDescription, t.tagline]),
  };
}

export function academyEpisodeMeta(episode, locale) {
  const t = academyCopy(locale);
  const lesson = academyLessons(locale)[episode.ep - 1];
  const tagged = fill(t.seoEpisodeTitle, { title: lesson.title, n: episode.ep });
  return {
    title: fitTitle([tagged, `${lesson.title} — NexuAlpha`, lesson.title], locale),
    description: sentenceDescription([lesson.goal, ...lesson.takeaways, `${t.series} · ${fill(t.episodeLabel, { n: episode.ep })} · ${t.brand}`]),
    lesson,
  };
}

/** The locale's edition is indexable when it carries a localized lesson; other UI locales are noindex,follow. */
export const academyIndexable = (locale) => ACADEMY_INDEX_LOCALES.includes(locale);

const transcriptText = (lesson) => lesson.transcript.map((row) => row.text).join(" ");

/**
 * JSON-LD for an academy route. urlFor(pathname) returns the canonical URL of that path in the page locale.
 */
export function academySchemas(pathname, locale, { urlFor }) {
  const route = parseAcademyPath(pathname);
  if (!route || route.kind === "missing") return [];
  const t = academyCopy(locale);
  const lessons = academyLessons(locale);
  const contentLocale = academyContentLocale(locale);
  const hubUrl = urlFor(ACADEMY_PATH);
  const courseId = `${hubUrl}#course`;
  const course = {
    "@type": "Course",
    "@id": courseId,
    name: `${t.series} — ${t.brand}`,
    description: t.hubLead,
    url: hubUrl,
    inLanguage: contentLocale,
    provider: ORGANIZATION,
    publisher: ORGANIZATION,
    isAccessibleForFree: true,
    educationalLevel: "Beginner",
    timeRequired: isoDuration(ACADEMY_TOTAL_SECONDS),
    numberOfLessons: ACADEMY_EPISODES.length,
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD", category: "Free" },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: isoDuration(ACADEMY_TOTAL_SECONDS), inLanguage: "en" },
  };
  const crumbs = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })) });
  if (route.kind === "hub") {
    const meta = academyHubMeta(locale);
    return [
      { "@context": "https://schema.org", ...course, name: meta.title.replace(/ — NexuAlpha$/, ""), hasPart: ACADEMY_EPISODES.map((episode) => ({ "@type": "LearningResource", "@id": `${urlFor(academyEpisodePath(episode))}#lesson`, name: lessons[episode.ep - 1].title, url: urlFor(academyEpisodePath(episode)), position: episode.ep })) },
      { "@context": "https://schema.org", "@type": "ItemList", name: t.series, numberOfItems: ACADEMY_EPISODES.length, itemListElement: ACADEMY_EPISODES.map((episode) => ({ "@type": "ListItem", position: episode.ep, url: urlFor(academyEpisodePath(episode)), name: lessons[episode.ep - 1].title })) },
      crumbs([["NexuAlpha", urlFor("/")], [t.brand, hubUrl]]),
    ];
  }
  const { episode } = route;
  const lesson = lessons[episode.ep - 1];
  const pageUrl = urlFor(academyEpisodePath(episode));
  const media = academyMedia(episode, { absolute: true });
  const meta = academyEpisodeMeta(episode, locale);
  const videoId = `${pageUrl}#video`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "@id": videoId,
      name: lesson.title,
      description: meta.description,
      thumbnailUrl: [media.posterLandscape, media.posterPortrait],
      uploadDate: ACADEMY_UPLOAD_DATE,
      duration: isoDuration(episode.duration),
      contentUrl: media.landscape,
      embedUrl: pageUrl,
      inLanguage: "en",
      isFamilyFriendly: true,
      isAccessibleForFree: true,
      transcript: transcriptText(lesson),
      publisher: ORGANIZATION,
      isPartOf: { "@id": courseId },
    },
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "@id": `${pageUrl}#lesson`,
      name: lesson.title,
      description: lesson.goal,
      url: pageUrl,
      inLanguage: contentLocale,
      learningResourceType: "Video lesson",
      educationalLevel: "Beginner",
      isAccessibleForFree: true,
      timeRequired: isoDuration(episode.duration),
      position: episode.ep,
      teaches: lesson.takeaways,
      associatedMedia: { "@id": videoId },
      isPartOf: { "@type": "Course", "@id": courseId, name: `${t.series} — ${t.brand}`, url: hubUrl, provider: ORGANIZATION },
      publisher: ORGANIZATION,
    },
    crumbs([["NexuAlpha", urlFor("/")], [t.brand, hubUrl], [lesson.title, pageUrl]]),
  ];
}

/** Head metadata of an academy path, or null when the path is not an academy route. */
export function academyRouteSeo(pathname, locale, { urlFor }) {
  const route = parseAcademyPath(pathname);
  if (!route) return null;
  if (route.kind === "missing") return { status: 404 };
  const meta = route.kind === "hub" ? academyHubMeta(locale) : academyEpisodeMeta(route.episode, locale);
  return {
    status: 200,
    title: meta.title,
    description: meta.description,
    indexable: academyIndexable(locale),
    schemas: academySchemas(pathname, locale, { urlFor }),
    image: route.kind === "episode" ? academyMedia(route.episode, { absolute: true }).posterLandscape : null,
  };
}

/** Every indexable academy URL with its hreflang set (sitemap-academy.xml). */
export function academySitemapEntries({ urlFor }) {
  const paths = [ACADEMY_PATH, ...ACADEMY_EPISODES.map(academyEpisodePath)];
  return paths.flatMap((pathname) => ACADEMY_INDEX_LOCALES.map((locale) => ({
    pathname, locale, loc: urlFor(pathname, locale),
    alternates: [...ACADEMY_INDEX_LOCALES.map((hreflang) => ({ hreflang, href: urlFor(pathname, hreflang) })), { hreflang: "x-default", href: urlFor(pathname, "en") }],
    lastmod: ACADEMY_UPLOAD_DATE,
  })));
}
