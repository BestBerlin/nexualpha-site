import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderReferralPartners } from "../scripts/generate-referral-partners.mjs";
import { referralSeoFor } from "../src/data/referral-seo.js";
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
      assert.ok(seo.title.includes(p.inviteCode), `${p.slug}/${locale}`);
      assert.ok(seo.description.includes(p.inviteCode), `${p.slug}/${locale}`);
      if (p.share != null) assert.ok(seo.title.includes(String(Math.round(p.share * 100))), `${p.slug}/${locale} share`);
      else assert.ok(!/%/.test(seo.title), `${p.slug}/${locale} no invented share`);
    }
  }
  assert.equal(referralSeoFor("no-such-venue", "en"), null);
});
