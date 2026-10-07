import { TOPIC_GUIDES } from "./topic-guides-data.js";
import { researchForVenue } from "./exchange-research.js";
import { topicReviewedFaqRecords } from "./topic-reviewed-faqs.js";

export const TOPIC_SOURCE_REVIEW_DATE = "2026-09-04T19:59:35Z";

export const topicSourceRegistry = Object.fromEntries(Object.entries(TOPIC_GUIDES).map(([topicSlug, topic]) => [
  topicSlug,
  topic.platforms.map((platform) => {
    const research = researchForVenue(platform.slug, "en");
    return {
      slug: platform.slug,
      name: platform.name,
      checkedAt: research?.checkedAt || null,
      sources: research?.sources || [],
      status: research?.sources?.length ? "source-backed-research" : "pending-source-review",
    };
  }),
]));

export function topicSourcesFor(slug) {
  return topicSourceRegistry[slug] || [];
}

// Reviewed R100 FAQ owners share the same records with the visible component.
// The compliant owner retains its existing source-linked FAQ contract.
export function topicFaqSchemaEntries(slug, locale) {
  const reviewedFaqs = topicReviewedFaqRecords(slug, locale);
  if (reviewedFaqs.length) return reviewedFaqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
      citation: faq.sources.map(source => source.url),
    },
  }));
  if (slug !== 'compliant-exchanges' || !['en', 'zh-Hans', 'zh-Hant'].includes(locale)) return [];
  return TOPIC_GUIDES[slug].faqs.map(faq => ({
    '@type': 'Question',
    name: locale === 'en' ? faq.qEn : locale === 'zh-Hant' ? faq.qHant : faq.qZh,
    acceptedAnswer: {
      '@type': 'Answer',
      text: locale === 'en' ? faq.aEn : locale === 'zh-Hant' ? faq.aHant : faq.aZh,
      citation: (faq.sources || []).map(source => source.url),
    },
  }));
}
