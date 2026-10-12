import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { priorityVenueAnswers, priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { partnerVenueFaqFor } from "../src/data/partner-venue-faq.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";
import { localizedHref, localizedPath } from "../src/data/locale-routing.js";
import { buildSitemap, routeInventory } from "../scripts/generate-prerender-manifest.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const graph = (value) => value?.["@graph"] || (Array.isArray(value) ? value : [value]);
const faqOf = (schemas) => schemas.find((s) => s["@type"] === "FAQPage");

test("priority answer Worker projection stays synchronized with the source used by the UI", () => {
  execFileSync(process.execPath, ["scripts/sync-priority-venue-seo.mjs", "--check"], { cwd: root });
});

test("sitemap content dates change only for the reviewed priority language variants", () => {
  const sitemap = buildSitemap(routeInventory(), []);
  const block = (url) => sitemap.match(/<url>[\s\S]*?<\/url>/g)?.find((entry) => entry.includes(`<loc>${url}</loc>`));
  for (const slug of Object.keys(priorityVenueAnswers)) {
    const expectedLastmod = priorityVenueAnswerFor(slug, "en").reviewedAt;
    assert.match(block(`https://nexualpha.com/exchanges/${slug}`), new RegExp(`<lastmod>${expectedLastmod}</lastmod>`));
  }
  assert.match(block("https://nexualpha.com/ja/exchanges/hyperliquid"), /<lastmod>2026-09-15<\/lastmod>/);
  assert.match(block("https://nexualpha.com/exchanges/binance"), /<lastmod>2026-09-15<\/lastmod>/);
});

test("all twelve reviewed detail variants share visible questions, cited answers and canonical metadata", async () => {
  for (const slug of Object.keys(priorityVenueAnswers)) {
    for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
      const route = localizedPath(`/exchanges/${slug}`, locale);
      const client = computeRouteSeo({ url: route, locale });
      const worker = await routeMetadata(new URL(`https://nexualpha.com${route}`), {});
      const answer = priorityVenueAnswerFor(slug, locale);
      assert.equal(worker.status, 200, route);
      assert.equal(client.status, 200, route);
      assert.equal(worker.canonical, client.canonical, route);
      assert.equal(worker.title, client.title, route);
      assert.equal(worker.description, client.description, route);
      const clientFaq = faqOf(client.schemas);
      assert.deepEqual(faqOf(graph(worker.schema)).mainEntity, clientFaq.mainEntity, route);
      // Owner exchange keyword plan 2026-10-11: partner FAQ entries (hyperliquid en: referral code) follow the reviewed
      // priority answers; the priority answers themselves stay first and unchanged.
      const appended = (partnerVenueFaqFor(slug, locale)?.mode === "append" ? partnerVenueFaqFor(slug, locale).entries : []).map((e) => [e.question, e.answer]);
      assert.deepEqual(clientFaq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]), [...answer.faq.map(([q, a]) => [q, a]), ...appended], route);
      assert.ok(clientFaq.mainEntity.every((q) => q.acceptedAnswer.citation?.every((url) => url.startsWith("https://"))), route);
      assert.equal(client.schemas.find((s) => s["@type"] === "WebPage").dateModified, answer.reviewedAt, route);
    }
  }
});

test("priority FAQs exist in server HTML while remaining questions are initially collapsed", () => {
  const dir = mkdtempSync(path.join(root, "tests/.tmp-priority-seo-"));
  try {
    const entry = path.join(dir, "entry.jsx");
    writeFileSync(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { VenueFaqSection } from "../../src/components/v3/VenueFaqSection.jsx";
      import { VenueDetailPage } from "../../src/components/v3/VenueDetailPageStatic.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      import { priorityVenueAnswers } from "../../src/data/priority-venue-answers.js";
      const result = {};
      for (const slug of Object.keys(priorityVenueAnswers)) for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
        const venue = { slug, name: slug };
        const fullHtml = renderToStaticMarkup(<VenueDetailPage copy={{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending'}}} venue={venueDatabase[slug]} venues={Object.values(venueDatabase)} updates={[]} locale={locale} market="unknown" product="unknown" />);
        result[slug + ':' + locale] = { faqHtml: renderToStaticMarkup(<VenueFaqSection venue={venue} profile={venue} locale={locale} />), heroHtml: fullHtml.slice(fullHtml.indexOf('class="v3-venue-hero"'), fullHtml.indexOf('class="v3-venue-metrics-disclosure"')) };
      }
      console.log(JSON.stringify(result));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [entry, "--bundle", "--platform=node", "--format=cjs", `--outfile=${dir}/bundle.cjs`, "--loader:.css=empty", "--log-level=error"]);
    const result = JSON.parse(execFileSync(process.execPath, [path.join(dir, "bundle.cjs")], { encoding: "utf8" }));
    const escape = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
    for (const [key, { faqHtml: html, heroHtml }] of Object.entries(result)) {
      const [slug, locale] = key.split(":");
      const answer = priorityVenueAnswerFor(slug, locale);
      for (const [q, a] of answer.faq) {
        assert.ok(html.includes(escape(q)), `${key} question absent from SSR: ${q}`);
        assert.ok(html.includes(escape(a)), `${key} answer absent from SSR`);
      }
      const appendedCount = partnerVenueFaqFor(slug, locale)?.mode === "append" ? partnerVenueFaqFor(slug, locale).entries.length : 0;
      assert.equal((html.match(/class="v3-faq-item" hidden=""/g) || []).length, answer.faq.length + appendedCount - 2, key);
      assert.match(html, /aria-expanded="false"/);
      assert.doesNotMatch(html, /SEO FAQ|What should the CTA say|cryptographically validated/);
      assert.ok(heroHtml.includes(escape(answer.title)), `${key} direct answer mounted`);
      assert.ok(heroHtml.includes(escape(answer.body)), `${key} substantive body in hero`);
      assert.match(heroHtml, /<details class="v3-venue-direct-answer__sources">/);
      const detailContent = heroHtml.match(/<details class="v3-venue-direct-answer__sources">([\s\S]*?)<\/details>/)?.[1];
      assert.ok(detailContent, `${key} details initially closed`);
      for (const check of answer.checks) assert.ok(detailContent.includes(escape(check)), `${key} detailed check is available on demand`);
      if (answer.fit) assert.ok(detailContent.includes(escape(answer.fit.label)), `${key} fit label is available on demand`);
      if (answer.avoid) assert.ok(detailContent.includes(escape(answer.avoid.items[0])), `${key} avoid guidance is available on demand`);
      if (answer.nextSteps) assert.ok(detailContent.includes(escape(answer.nextSteps.items[0])), `${key} next step guidance is available on demand`);
      for (const [, href] of answer.internalLinks.slice(1)) assert.ok(detailContent.includes(escape(localizedHref(href, { locale }))), `${key} additional research remains available on demand`);
      assert.doesNotMatch(heroHtml, /class="v3-venue-summary"|class="v3-venue-decision-strip"/);
      for (const [, href] of answer.sources) assert.ok(heroHtml.includes(escape(href)), `${key} source retained`);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
