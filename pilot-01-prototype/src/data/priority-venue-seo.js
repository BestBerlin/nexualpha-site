import { priorityVenueAnswerFor } from "./priority-venue-answers.js";

// The visible FAQ is the source for structured answers, including citations.
// Keep established search titles where available; adding research does not
// authorize changing route identity or a commercial destination.
export function mergePriorityVenueSeo(slug, locale, existing = null) {
  const answer = priorityVenueAnswerFor(slug, locale);
  if (!answer) return existing;
  const [first, ...rest] = answer.faq;
  return {
    ...existing,
    title: existing?.title || answer.seoTitle,
    description: existing?.description || answer.seoDescription,
    reviewedAt: answer.reviewedAt,
    sourceUrls: answer.sources.map(([, href]) => href),
    relatedLinks: [...new Set([...(existing?.relatedLinks || []), ...answer.internalLinks.map(([, href]) => href)])],
    directAnswer: { question: first[0], answer: first[1], citations: first[2] },
    faq: rest,
  };
}
