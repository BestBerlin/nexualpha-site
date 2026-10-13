import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderReferralPartners } from "../scripts/generate-referral-partners.mjs";
import { referralSeoFor, referralTitleAllowed } from "../src/data/referral-seo.js";
import { buildPartnersFeed } from "../src/data/partners-feed.js";

test("generated referral partners match the partner feed", () => {
  const onDisk = readFileSync(new URL("../src/data/referral-partners.generated.js", import.meta.url), "utf8");
  assert.equal(onDisk, renderReferralPartners(), "run node scripts/generate-referral-partners.mjs");
});

test("referral titles carry the real invite code and owner share in every locale", () => {
  const partners = buildPartnersFeed({ generatedAt: "static" }).partners;
  for (const p of partners.filter((x) => x.inviteCode)) {
    for (const locale of ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"]) {
      const seo = referralSeoFor(p.slug, locale);
      if (!referralTitleAllowed(p.slug, locale)) { assert.equal(seo, null, `${p.slug}/${locale} must stay neutral`); continue; }
      assert.ok(seo.title.includes(p.inviteCode), `${p.slug}/${locale}`);
      assert.ok(seo.description.includes(p.inviteCode), `${p.slug}/${locale}`);
      // CTR pass 2026-10-13: the title answers the sign-up query; the owner share lives in the description.
      if (p.share != null && p.slug !== "hyperliquid") assert.ok(seo.description.includes(String(Math.round(p.share * 100))), `${p.slug}/${locale} share`);
      else assert.ok(!/%/.test(seo.title), `${p.slug}/${locale} no invented share`);
    }
  }
  assert.equal(referralSeoFor("no-such-venue", "en"), null);
});

test("regulated locales keep neutral titles; Turkish referral titles only for SPK-listed exchanges", () => {
  for (const locale of ["ru", "ar", "zh-Hant"]) assert.equal(referralSeoFor("okx", locale), null, locale);
  assert.ok(referralSeoFor("okx", "tr")?.title.includes("nexu888"));
  assert.equal(referralSeoFor("bitget", "tr"), null);
  assert.ok(referralSeoFor("bitget", "pt-BR")?.title.includes("nexu888"));
});
