import { quickAnswerEntities } from "./exchange-quick-answers.js";

// Extend the existing profile FAQPage, retaining its reviewed answers and a single schema owner.
export function applyExchangeQuickAnswers(schema, slug, locale, market) {
  if (schema?.["@type"] !== "FAQPage") return schema;
  const added = quickAnswerEntities(slug, locale, market);
  if (!added.length) return schema;
  const names = new Set(added.map(question => question.name));
  return { ...schema, inLanguage: locale, mainEntity: [...added, ...(schema.mainEntity || []).filter(question => !names.has(question.name))] };
}
