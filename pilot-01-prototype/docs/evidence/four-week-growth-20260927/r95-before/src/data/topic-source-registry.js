import { TOPIC_GUIDES } from "./topic-guides-data.js";
import { researchForVenue } from "./exchange-research.js";

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
