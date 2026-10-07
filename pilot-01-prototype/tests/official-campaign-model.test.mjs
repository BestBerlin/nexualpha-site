import assert from "node:assert/strict";
import test from "node:test";
import { campaignPeriod, researchView, safeResearchUrl } from "../src/data/official-campaign-model.js";
import { campaignResearchLocalizedText } from "../src/data/official-campaign-localizations.js";
import { visibleOfficialUpdates } from "../src/components/official-updates/official-updates-model.js";

const now = Date.parse("2026-09-07T09:00:00Z");
const text = { en: "Public source context", "zh-Hans": "官方公开来源说明", "zh-Hant": "官方公開來源說明" };
const record = {
  venueSlug: "binance", checkedAt: "2026-09-07T08:00:00Z", reviewMode: "AI_SOURCE_CHECKED", summary: text,
  signupReward: { status: "PUBLIC_TERMS", kind: null, amount: null, summary: text, conditions: [text], sourceUrls: ["https://www.binance.com/en/support/faq/rewards"], startAt: null, endAt: null, timeZone: null },
  sources: [{ id: "binance-rewards", title: "Binance reward terms", url: "https://www.binance.com/en/support/faq/rewards", sourceType: "reward_terms", access: "READ", checkedAt: "2026-09-07T08:00:00Z", publishedAt: null, startAt: null, endAt: null, timeZone: null, summary: text }],
};

test("research period is date-bound, never infers eligibility or an open-ended active campaign", () => {
  assert.equal(campaignPeriod({}, now), "UNKNOWN");
  assert.equal(campaignPeriod({ startAt: "2026-09-01T00:00:00Z" }, now), "UNKNOWN");
  assert.equal(campaignPeriod({ endAt: "2026-09-07T09:00:00Z" }, now), "ENDED");
  assert.equal(campaignPeriod({ startAt: "2026-09-08T00:00:00Z", endAt: "2026-09-09T00:00:00Z" }, now), "UPCOMING");
  assert.equal(campaignPeriod({ startAt: "2026-09-01T00:00:00Z", endAt: "2026-09-08T00:00:00Z" }, now), "WITHIN_DATES");
  assert.equal(campaignPeriod({ endAt: "2026-09-08T00:00:00Z" }, now), "UNKNOWN");
  assert.equal(campaignPeriod({ startAt: "bad", endAt: "2026-09-08T00:00:00Z" }, now), "INVALID");
  assert.equal(campaignPeriod({ startAt: "2026-09-09T00:00:00Z", endAt: "2026-09-08T00:00:00Z" }, now), "INVALID");
});

test("research links are read-only public HTTPS sources without attribution or account actions", () => {
  assert.equal(safeResearchUrl("https://help.coinbase.com/en/coinbase/getting-started"), "https://help.coinbase.com/en/coinbase/getting-started");
  for (const url of ["javascript:alert(1)", "http://www.binance.com", "https://user:secret@example.com", "https://www.binance.com/register", "https://www.binance.com/en/sign-up", "https://www.bybit.com/help?ref=CODE", "https://www.okx.com/help?inviteCode=CODE", "https://www.binance.com/help?utm_source=affiliate", "//example.com", "https://localhost/page", "https://127.0.0.1/page"]) assert.equal(safeResearchUrl(url), null, url);
});

test("research has explicit locale fallback, null unknown amounts and no human-approval or commercial action", () => {
  const view = researchView(record, "zh-Hant", now);
  assert.equal(view.contentLocale, "zh-Hant");
  assert.equal(view.summary, campaignResearchLocalizedText("binance", ["summary"], "zh-Hant"));
  assert.equal(view.signupReward.amount, null);
  assert.equal(view.signupReward.period, "UNKNOWN");
  assert.equal(view.sources[0].publishedAt, null);
  assert.equal(view.reviewMode, "AI_SOURCE_CHECKED");
  assert.equal(view.humanApproved, false);
  assert.equal(view.commercialAction, null);
  assert.deepEqual(visibleOfficialUpdates([view], now), []);
  assert.equal(researchView(record, "ar", now).contentLocale, "ar");
  assert.equal(researchView(record, "fr", now).contentLocale, "fr");
  assert.equal(researchView(record, "fr", now).usedFallback, true);
});

test("source access, stale checks and expiration are recomputed at runtime", () => {
  const ended = { ...record, signupReward: { ...record.signupReward, endAt: "2026-09-07T10:00:00Z" } };
  assert.equal(researchView(ended, "en", Date.parse("2026-09-07T10:00:00Z")).signupReward.period, "ENDED");
  assert.equal(researchView(record, "en", now + 8 * 86400000).freshness, "NEEDS_RECHECK");
  const failed = { ...record, sources: record.sources.map((source) => ({ ...source, access: "INACCESSIBLE" })) };
  assert.equal(researchView(failed, "en", now).readSourceCount, 0);
  assert.equal(researchView(failed, "en", now).signupReward.status, "UNCONFIRMED");
  const unsafe = { ...record, sources: record.sources.map((source) => ({ ...source, url: "javascript:alert(1)" })) };
  assert.equal(researchView(unsafe, "en", now).sources.length, 0);
  assert.equal(researchView({ ...record, reviewMode: "APPROVED" }, "en", now), null);
  assert.equal(researchView({ ...record, checkedAt: "2099-01-01T00:00:00Z" }, "en", now).freshness, "NEEDS_RECHECK");
});
