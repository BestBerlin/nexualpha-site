import { isTokenizedStockArticle, tsArticleTickers } from "../../data/tokenized-stocks-news.js";
import { selectResearch } from "./research-selection.js";

import { compactResearchClaims } from "../../data/news-feed-client.js";
export const researchClaimTexts = compactResearchClaims;

// The same selection runs before SSR projection and in the hydrated hub component.
export function tokenizedResearchArticles(articles = [], { locale = "en", ticker, limit = 5 } = {}) {
  const matching = articles.filter((article) => {
    const claims = researchClaimTexts(article);
    // Feed claims supplement matching only; retain the article's original display title and summary.
    const evidence = claims.length ? { ...article, summary: { ...article.summary, en: [article.summary?.en, ...claims].filter(Boolean).join("\n") } } : article;
    return isTokenizedStockArticle(evidence)
      && (!ticker || tsArticleTickers(evidence).includes(String(ticker).toUpperCase()));
  });
  return selectResearch(matching, { locale, limit });
}
