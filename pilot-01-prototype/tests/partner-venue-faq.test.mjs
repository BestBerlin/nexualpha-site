import assert from "node:assert/strict";
import { rendersSource, renderedSourceHref } from "./helpers/outbound-expect.mjs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { REFERRAL_PARTNERS } from "../src/data/referral-partners.generated.js";
import {
  NATIVE_REFERRAL_SLUGS,
  nativeReferralFor,
} from "../src/data/referral-native.js";
import {
  PARTNER_VENUE_FAQ_SLUGS,
  PARTNER_VENUE_FAQ_REPLACE_LOCALES,
  PARTNER_VENUE_FAQ_LOCAL_TARGETS,
  partnerFaqQuestion,
  partnerVenueFaqFor,
} from "../src/data/partner-venue-faq.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const graph = (value) => value?.["@graph"] || (Array.isArray(value) ? value : [value]);
const faqOf = (schemas) => graph(schemas).find((schema) => schema?.["@type"] === "FAQPage");
const OFFICIAL_HOSTS = {
  okx: ["www.okx.com"],
  bitget: ["www.bitget.com", "web3.bitget.com"],
  binance: ["www.binance.com"],
  bybit: ["www.bybit.com"],
  "gate-io": ["www.gate.com"],
  mexc: ["www.mexc.com"],
};
const GENERIC_ENGLISH = /Where should .* fees and account terms be confirmed|Does NexuAlpha guarantee/;

test("FAQ JSON-LD resolves first-party citations without changing visible source records", () => {
  const entry = { question: "Which source describes the partner data?", answer: "The public partner feed.", citations: ["/intel/partners.json", "https://www.okx.com/help"] };
  assert.deepEqual(partnerFaqQuestion(entry).acceptedAnswer.citation, ["https://nexualpha.com/intel/partners.json", "https://www.okx.com/help"]);
  assert.deepEqual(entry.citations, ["/intel/partners.json", "https://www.okx.com/help"]);
  for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
    const faq = partnerVenueFaqFor("okx", locale);
    for (const question of faq.entries.map(partnerFaqQuestion)) {
      for (const citation of question.acceptedAnswer.citation || []) assert.match(citation, /^https:\/\//, `${locale}: schema citation is absolute`);
    }
  }
});

async function bothFaqs(slug, locale) {
  const route = localizedPath(`/exchanges/${slug}`, locale);
  const client = computeRouteSeo({ url: route, locale });
  const worker = await routeMetadata(new URL(`https://nexualpha.com${route}`), {});
  assert.equal(client.status, 200, route);
  assert.equal(worker.status, 200, route);
  return { route, client: faqOf(client.schemas), worker: faqOf(worker.schema) };
}

test("pt-BR, es and fr partner profiles publish FAQPage schema in the page language, identical in client and Worker SSR", async () => {
  for (const slug of PARTNER_VENUE_FAQ_SLUGS) {
    for (const locale of PARTNER_VENUE_FAQ_REPLACE_LOCALES) {
      const { route, client, worker } = await bothFaqs(slug, locale);
      const expected = partnerVenueFaqFor(slug, locale);
      assert.ok(expected?.entries.length >= 5, `${route} needs at least 5 localized answers`);
      assert.equal(client.inLanguage, locale, route);
      assert.equal(worker.inLanguage, locale, route);
      assert.deepEqual(worker.mainEntity, client.mainEntity, `${route} client/Worker FAQ drift`);
      for (const entry of expected.entries) assert.ok(client.mainEntity.some(q => q.name === entry.question && q.acceptedAnswer.text === entry.answer), `${route}: reviewed answer retained`);
      assert.ok(client.mainEntity.every((q) => !GENERIC_ENGLISH.test(q.name)), `${route} still carries the generic English FAQ`);
    }
  }
});

test("every localized partner answer cites the exchange's own help pages", () => {
  for (const slug of PARTNER_VENUE_FAQ_SLUGS) {
    for (const locale of [...PARTNER_VENUE_FAQ_REPLACE_LOCALES, "en", "zh-Hans"]) {
      const faq = partnerVenueFaqFor(slug, locale);
      if (!faq) continue;
      for (const entry of faq.entries.filter((e) => e.origin === "partner")) {
        assert.ok(entry.citations.length > 0, `${slug}/${locale}: ${entry.question} has no source`);
        for (const href of entry.citations) {
          const host = new URL(href).host;
          assert.equal(new URL(href).protocol, "https:", href);
          assert.ok(OFFICIAL_HOSTS[slug].includes(host), `${slug}/${locale}: ${href} is not an official ${slug} help page`);
        }
      }
    }
  }
});

test("invite codes come from the partner feed; answers carry no commission disclosure (owner rule 2026-10-12)", () => {
  const disclosure = { "pt-BR": /Transparência: .* comissão/, es: /Transparencia: .* comisión/, fr: /Transparence : .* commission/ };
  for (const slug of PARTNER_VENUE_FAQ_SLUGS) {
    const partner = REFERRAL_PARTNERS.find((p) => p.slug === slug);
    for (const locale of PARTNER_VENUE_FAQ_REPLACE_LOCALES) {
      const faq = partnerVenueFaqFor(slug, locale);
      for (const entry of faq.entries) {
        assert.ok(!/\{code\}|\{name\}|\{disclosure\}/.test(entry.answer + entry.question), `${slug}/${locale}: unfilled placeholder`);
        if (partner?.inviteCode && entry.answer.includes(partner.inviteCode)) {
          assert.ok(entry.showsInviteCode, `${slug}/${locale}: code shown outside a partner-code entry`);
        }
        assert.doesNotMatch(entry.answer, disclosure[locale], `${slug}/${locale}: commission disclosure inside the answer`);
        assert.ok(!/\b\d{1,2}\s?%\s*(de )?(cashback|reembolso|remise|rebate)/i.test(entry.answer), `${slug}/${locale}: rebate share in FAQ`);
      }
    }
  }
});

test("en and zh-Hans OKX/Bitget profiles add the exchange-vs-Web3-wallet answer in both runtimes", async () => {
  for (const slug of ["okx", "bitget"]) {
    for (const locale of ["en", "zh-Hans"]) {
      const { route, client, worker } = await bothFaqs(slug, locale);
      const wallet = partnerVenueFaqFor(slug, locale).entries[0];
      assert.equal(client.inLanguage, locale, route);
      assert.deepEqual(worker.mainEntity, client.mainEntity, `${route} client/Worker FAQ drift`);
      assert.ok(client.mainEntity.some((q) => q.name === wallet.question && q.acceptedAnswer.text === wallet.answer), `${route} missing wallet answer`);
      assert.match(wallet.question, /Wallet|钱包/);
    }
  }
});

test("neutral locales get no partner FAQ except zh-Hant informational native answers; tr targets stay scoped and id has seven native targets", () => {
  // Owner update 2026-10-11 (exchange keyword plan): tr, vi and id moved from "under review" to a per-exchange target
  // list (PARTNER_VENUE_FAQ_LOCAL_TARGETS); ru, ar and zh-Hant stay neutral.
  // vi became neutral on 2026-10-13 (Vietnam Resolution 05/2025/NQ-CP).
  for (const locale of ["ru", "ar", "vi", "ur", "uk"]) {
    for (const slug of [...PARTNER_VENUE_FAQ_SLUGS, "hyperliquid", "backpack"]) assert.equal(partnerVenueFaqFor(slug, locale), null, `${slug}/${locale}`);
  }
  for (const slug of NATIVE_REFERRAL_SLUGS) {
    const faq = partnerVenueFaqFor(slug, "zh-Hant");
    assert.equal(faq?.mode, "append", `${slug}/zh-Hant`);
    assert.equal(faq?.entries.length, 2, `${slug}/zh-Hant informational FAQ only keeps later/payout answers`);
    const text = faq.entries.map((entry) => `${entry.question}\n${entry.answer}`).join("\n");
    assert.doesNotMatch(text, /nexu888|11350287|48553|2296057|7f97gkqw|最多可返還|立即開戶|立即加入|CTA|href=|\/go\//i, `${slug}/zh-Hant stays informational, without codes, benefits or CTA`);
  }
  for (const slug of ["hyperliquid", "backpack"]) assert.equal(partnerVenueFaqFor(slug, "zh-Hant"), null, `${slug}/zh-Hant`);
  for (const locale of ["tr"]) {
    for (const slug of PARTNER_VENUE_FAQ_SLUGS) {
      if (PARTNER_VENUE_FAQ_LOCAL_TARGETS[locale].includes(slug)) assert.ok(partnerVenueFaqFor(slug, locale)?.entries.length >= 5, `${slug}/${locale}`);
      else assert.equal(partnerVenueFaqFor(slug, locale), null, `${slug}/${locale}`);
    }
  }
  assert.deepEqual(NATIVE_REFERRAL_SLUGS, ["bitget", "okx", "binance", "bybit", "htx", "coinw", "kraken"]);
  for (const slug of NATIVE_REFERRAL_SLUGS) assert.ok(partnerVenueFaqFor(slug, "id")?.entries.length >= 2, `${slug}/id native FAQ`);
});

test("native referral answers append with current citations while keeping reviewed wallet and KYC answers", () => {
  for (const slug of NATIVE_REFERRAL_SLUGS) {
    const native = nativeReferralFor(slug, "id");
    const faq = partnerVenueFaqFor(slug, "id");
    assert.ok(native, `${slug}/id native data`);
    assert.ok(faq, `${slug}/id FAQ`);
    for (const nativeEntry of native.faq) {
      const rendered = faq.entries.find((entry) => entry.question === nativeEntry.question);
      assert.ok(rendered, `${slug}/id missing native entry: ${nativeEntry.question}`);
      assert.deepEqual(rendered.citations, [nativeEntry.source], `${slug}/id native citation`);
      assert.equal(rendered.origin, nativeEntry.origin || "partner", `${slug}/id native origin`);
    }
  }

  const bitget = partnerVenueFaqFor("bitget", "id").entries;
  assert.ok(bitget.some((entry) => /Wallet/.test(entry.question)), "Bitget/id keeps the reviewed wallet answer");
  assert.ok(bitget.some((entry) => /KYC/.test(entry.question)), "Bitget/id keeps the reviewed KYC answer");
  assert.ok(bitget.findIndex((entry) => entry.question === "Di mana memasukkan kode referral Bitget?") > bitget.findIndex((entry) => /KYC/.test(entry.question)), "Bitget/id appends native entries after reviewed answers");
  assert.equal(bitget.filter((entry) => /setelah daftar|sesudah daftar|nanti/i.test(entry.question)).length, 1, "Bitget/id replaces the stale add-later question with the native one");

  for (const slug of ["okx", "bybit"]) {
    const entries = partnerVenueFaqFor(slug, "id").entries;
    assert.ok(entries.some((entry) => /Wallet/.test(entry.question)), `${slug}/id keeps the reviewed wallet answer`);
    assert.ok(entries.some((entry) => /KYC|verifikasi identitas/i.test(entry.question)), `${slug}/id keeps the reviewed KYC answer`);
  }
});

test("visible profile FAQ renders the same localized questions and answers as the schema, without an in-section disclosure line", () => {
  const dir = mkdtempSync(path.join(root, "tests/.tmp-partner-faq-"));
  try {
    const entry = path.join(dir, "entry.jsx");
    writeFileSync(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { VenueFaqSection } from "../../src/components/v3/VenueFaqSection.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      const result = {};
      for (const slug of ${JSON.stringify(PARTNER_VENUE_FAQ_SLUGS)}) for (const locale of ["pt-BR", "es", "fr", "en", "zh-Hans"]) {
        const db = venueDatabase[slug] || {};
        const venue = { slug, name: db.name || slug };
        result[slug + ":" + locale] = renderToStaticMarkup(<VenueFaqSection venue={venue} profile={venue} locale={locale} db={db} />);
      }
      console.log(JSON.stringify(result));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [entry, "--bundle", "--platform=node", "--format=cjs", `--outfile=${dir}/bundle.cjs`, "--loader:.css=empty", "--log-level=error"]);
    const result = JSON.parse(execFileSync(process.execPath, [path.join(dir, "bundle.cjs")], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
    const escape = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
    for (const [key, html] of Object.entries(result)) {
      const [slug, locale] = key.split(":");
      const faq = partnerVenueFaqFor(slug, locale);
      if (!faq) continue;
      for (const e of faq.entries) {
        assert.ok(html.includes(escape(e.question)), `${key} question missing from visible FAQ: ${e.question}`);
        assert.ok(html.includes(escape(e.answer)), `${key} answer missing from visible FAQ: ${e.question}`);
        for (const href of e.citations) {
          // Owner 2026-10-13: coded /go route, or a plain label + domain where the venue has no sitewide parameter.
          const routed = renderedSourceHref(href, { locale });
          assert.ok(routed ? html.includes(routed) : html.includes(`data-source-plain="${new URL(href).hostname.replace(/^www\./, "")}"`), `${key} source missing: ${href}`);
        }
      }
      assert.doesNotMatch(html, /commission-disclosure-line|data-disclosure-placement=/, `${key}: no disclosure line in the FAQ section`);
      if (faq.mode === "replace") assert.ok(!GENERIC_ENGLISH.test(html), `${key} visible FAQ still English`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
