// Neutral-locale article view (locale-policy.js): published articles keep their facts, but on a neutral-locale page the
// sentences that carry a sign-up path are removed at render time — any partner or campaign invite code, a /go/ partner
// route or a registration link. The stored article is never edited; the same filter runs in SSR and on the client.
// An article whose whole topic is a referral code has no neutral edition: its neutral-locale editions are dropped from
// the published locales (news-feed-client.js, worker), so that URL renders noindex,follow and leaves sitemaps/hreflang.
import { partnerRegistry } from "./partner-registry.js";
import { REFERRAL_PARTNERS } from "./referral-partners.generated.js";
import { CAMPAIGN_INVITE_CODES } from "./campaign-codes.js";
import { isNeutralCtaLocale } from "./locale-policy.js";

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PLACEHOLDER = /^NEXU_[A-Z0-9]+$/;
export const NEUTRAL_FILTER_INVITE_CODES = Object.freeze([...new Set([
  ...Object.values(partnerRegistry).map((partner) => partner?.inviteCode),
  ...REFERRAL_PARTNERS.map((partner) => partner.inviteCode),
  ...CAMPAIGN_INVITE_CODES,
].filter((code) => typeof code === "string" && code.length >= 4 && code !== "N/A" && !PLACEHOLDER.test(code)))]);

const CODE_PATTERN = new RegExp(`(^|[^\\p{L}\\p{N}_])(?:${NEUTRAL_FILTER_INVITE_CODES.map(escapeRegExp).join("|")})(?=$|[^\\p{L}\\p{N}_])`, "iu");
// Partner routes and registration links (query keys and paths the partner registry uses), and the partner feed URL.
const LINK_PATTERN = /\/go\/[a-z0-9-]+|[?&](?:ref|inviteCode|invite_code|affiliate_id|channelCode|vipCode|rcode)=|\/(?:join|invite|sign-?up|register)\b[^\s)]*|\/intel\/partners\.json/i;

export function carriesSignupPath(text) {
  const value = String(text || "");
  return CODE_PATTERN.test(value) || LINK_PATTERN.test(value);
}

// Sentence boundaries for Latin, Cyrillic, Arabic/Urdu and CJK punctuation.
const SENTENCE = /[^.!?。！？؟۔]+(?:[.!?。！？؟۔]+(?=\s|$)|[。！？؟۔]+|$)\s*/gu;

function neutralParagraph(block) {
  if (!carriesSignupPath(block)) return block;
  // Headings, tables, embeds and list items that name a code are dropped whole: half a row or heading reads wrong.
  if (/^(#{1,6} |\||:::|\{\{|[-*] |\d+\. )/m.test(block)) {
    if (/^[-*] |^\d+\. /m.test(block) && !/^\|/m.test(block)) {
      const lines = block.split("\n").filter((line) => !carriesSignupPath(line));
      return lines.some((line) => /^([-*] |\d+\. )/.test(line)) ? lines.join("\n") : "";
    }
    return "";
  }
  const kept = (block.match(SENTENCE) || [block]).filter((sentence) => !carriesSignupPath(sentence));
  return kept.join("").trim();
}

/** Article markdown for a page in `locale`: unchanged outside neutral locales, sign-up sentences removed inside. */
export function neutralArticleMarkdown(markdown, locale) {
  if (!isNeutralCtaLocale(locale) || typeof markdown !== "string") return markdown;
  return markdown.split(/\n{2,}/).map(neutralParagraph).filter((block) => block.trim()).join("\n\n");
}

/** Sources list for a neutral-locale page: the partner feed (codes, shares) is not a source a neutral page cites. */
export function neutralArticleSources(sources, locale) {
  if (!isNeutralCtaLocale(locale) || !Array.isArray(sources)) return sources;
  return sources.filter((source) => !carriesSignupPath(`${source?.url || ""} ${source?.role || ""} ${source?.title || ""}`));
}

export { isReferralTopicArticle, withoutNeutralReferralEditions } from "./neutral-referral-topic.js";

// Whole article object for a neutral-locale page or payload (hydration state, /api/news/article): every text field that
// carries a sign-up path loses those sentences, and sources that are the partner feed are dropped. Same filter as the
// rendered page, so the hydrated client renders the identical body.
function neutralValue(value, locale, key) {
  if (typeof value === "string") return carriesSignupPath(value) && !/^(?:url|href|slug|id)$/i.test(key || "") ? neutralArticleMarkdown(value, locale) : value;
  if (Array.isArray(value)) {
    const rows = key === "sources" ? neutralArticleSources(value, locale) : value;
    return rows.map((item) => neutralValue(item, locale, key));
  }
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, neutralValue(v, locale, k)]));
  return value;
}

export function neutralArticleView(article, locale) {
  if (!isNeutralCtaLocale(locale) || !article || typeof article !== "object") return article;
  return neutralValue(article, locale, "");
}
