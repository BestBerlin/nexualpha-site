// Public partner feed (2026-10-10) for the Telegram Mini App and any other first-party surface: one source of truth
// for rebate shares, payout cadence, invite codes, sign-up links and checked base fees. Only venues with a real invite
// route are listed (placeholder codes are excluded upstream); a fee that is not checked stays null.
import { HOME_PARTNERS, HOME_PUSH, HOME_REBATE_SHARE, HOME_AUTO_SETTLE, HOME_SETTLE, HOME_REBATE_MAX_PCT } from "./home-rebate-tiers.js";
import { publicCtaForVenue } from "./source-bound-cta.js";
import { feeFact, FACTS_AS_OF } from "./exchange-facts.js";
import { venueDatabase } from "./venue-database.js";

export const PARTNERS_PATH = "/intel/partners.json";

const pair = (slug, product) => {
  const f = feeFact(slug, product);
  return f.state === "checked" && Number.isFinite(f.maker) && Number.isFinite(f.taker) ? { maker: f.maker, taker: f.taker } : null;
};

export function buildPartnersFeed({ generatedAt = new Date().toISOString() } = {}) {
  const order = [...HOME_PUSH, ...HOME_PARTNERS.filter((s) => !HOME_PUSH.includes(s))];
  const partners = [];
  for (const slug of order) {
    const cta = publicCtaForVenue(slug, "en");
    if (!cta?.hasReferral || !/^https:\/\//i.test(cta.registrationUrl || "")) continue;
    partners.push({
      slug,
      name: venueDatabase[slug]?.name || cta.name || slug,
      inviteCode: cta.inviteCode || null,
      registrationUrl: cta.registrationUrl,
      share: HOME_REBATE_SHARE[slug] ?? null,
      autoSettle: HOME_AUTO_SETTLE.includes(slug),
      settle: HOME_SETTLE[slug] ?? null,
      featured: HOME_PUSH.includes(slug),
      fees: { spot: pair(slug, "spot"), perp: pair(slug, "perp") },
      profile: `https://nexualpha.com/exchanges/${slug}`,
    });
  }
  return { generatedAt, feesAsOf: FACTS_AS_OF, maxSharePct: HOME_REBATE_MAX_PCT, partners };
}
