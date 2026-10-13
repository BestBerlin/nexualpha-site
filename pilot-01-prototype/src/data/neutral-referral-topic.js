// An article whose whole topic is a referral/invite code has no neutral-locale edition (locale-policy.js): its
// neutral-locale editions are dropped from the published locales (news-feed-client.js, worker/index.js), so such a URL
// renders noindex,follow with the source-language canonical and leaves the sitemaps and hreflang. Kept free of data
// imports: news-feed-client.js is shared by many route chunks.
import { isNeutralCtaLocale } from "./locale-policy.js";

const REFERRAL_TOPIC_SLUG = /(?:^|-)(?:referral|invite|promo|affiliate|ref)-codes?(?:-|$)|(?:^|-)ma-gioi-thieu(?:-|$)/i;
const REFERRAL_TOPIC_TITLE = /referral code|invite code|promo code|mã giới thiệu|реферальн\S* код|промокод|邀请码|邀請碼|رمز الإحالة|ریفرل کوڈ/iu;
/** True when the article's whole topic is a referral/invite code (slug or English/own title says so). */
export function isReferralTopicArticle(article) {
  if (!article || typeof article !== "object") return false;
  if (REFERRAL_TOPIC_SLUG.test(String(article.slug || ""))) return true;
  const title = article.title;
  const en = typeof title === "string" ? title : title?.en;
  return REFERRAL_TOPIC_TITLE.test(String(en || ""));
}

/** Drops neutral locales from an article's published editions when its whole topic is a referral code. */
export function withoutNeutralReferralEditions(article, locales) {
  if (!Array.isArray(locales) || !isReferralTopicArticle(article)) return locales;
  return locales.filter((locale) => !isNeutralCtaLocale(locale));
}
