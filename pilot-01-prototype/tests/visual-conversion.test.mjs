// Visual conversion pass (owner 2026-10-10): /telegram as the alerts product page, the site-wide alerts strip,
// the compare page mobile first screen, section eyebrows and the grouped activities feed.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sectionEyebrow, SECTION_EYEBROW_KEYS } from "../src/data/section-eyebrow.js";
import { showAllCopy, GROUP_PREVIEW_COUNT } from "../src/components/v3/activity/show-all-copy.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");
const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));

async function render(entrySource) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-visual-conversion-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, entrySource);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("section eyebrow names the section in all 15 locales and the CSS reads it from main", async () => {
  for (const locale of LOCALES) for (const key of SECTION_EYEBROW_KEYS) {
    const text = sectionEyebrow(locale, key);
    assert.match(text, /^NEXUALPHA · \S/, `${locale}/${key}`);
  }
  assert.equal(sectionEyebrow("en", "news"), "NEXUALPHA · NEWS & RESEARCH");
  assert.equal(sectionEyebrow("en", "campaigns"), "NEXUALPHA · CAMPAIGNS");
  assert.equal(sectionEyebrow("en", "telegram"), "NEXUALPHA · TELEGRAM");
  assert.equal(sectionEyebrow("en", "compare"), "NEXUALPHA · COMPARE");
  assert.equal(sectionEyebrow("en", "exchanges"), "NEXUALPHA · EXCHANGES");
  const css = await read("src/styles/v8/site-signature.css");
  assert.match(css, /content: "NEXUALPHA · FEES & REBATES"/, "default kicker stays for pages without a section");
  assert.match(css, /main\.v6:not\(\.home-refinement\)\[data-eyebrow\] h1:first-of-type::before \{ content: var\(--section-eyebrow\); \}/);
  const app = await read("src/App.jsx");
  assert.match(app, /r1-telegram-page[^\n]*sectionEyebrowAttrs\(locale, "telegram"\)/);
  assert.match(app, /sectionEyebrowAttrs\(locale, "exchanges"\)[^\n]*<VenueYellowPages/);
  assert.match(await read("src/components/v3/news/NewsListPage.jsx"), /news-page" id="top" \{\.\.\.sectionEyebrowAttrs\(locale, "news"\)\}/);
  assert.match(await read("src/components/v3/activity/ActivityPages.jsx"), /v3-activity-center" id="top" \{\.\.\.sectionEyebrowAttrs\(locale, "campaigns"\)\}/);
  const v3 = await read("src/components/v3/V3Pages.jsx");
  assert.match(v3, /v3-compare-page" id="top" \{\.\.\.sectionEyebrowAttrs\(locale, "compare"\)\}/);
  assert.match(v3, /v5-detail" id="top" \{\.\.\.sectionEyebrowAttrs\(locale, "exchanges"\)\}/);
  assert.doesNotMatch(await read("src/components/v7/HomeV7.jsx"), /sectionEyebrow/, "home keeps its own kicker");
});

test("alerts strip reuses the article alerts copy and sits under the home hero, below the venue registration card and at the top of the news list", async () => {
  const strip = await read("src/components/v3/TelegramAlertsStrip.jsx");
  assert.match(strip, /import \{ TELEGRAM_ALERTS_URL, telegramAlertsCopy \} from "\.\/news\/NewsTelegramAlerts\.jsx"/);
  assert.match(strip, /data-cta-placement=\{placement\}/);
  const source = await read("src/components/v3/news/NewsTelegramAlerts.jsx");
  assert.match(source, /export const TELEGRAM_ALERTS_URL = "https:\/\/t\.me\/NexuAlphaAssistantBot\?start=alerts"/);
  const home = await read("src/components/v7/HomeV7.jsx");
  const heroEnd = home.indexOf("</section>\n\n      <TelegramAlertsStrip");
  assert.ok(heroEnd > home.indexOf('className="h7-hero"'), "strip follows the hero section (rebate ledger inside it)");
  assert.ok(home.indexOf('placement="home-telegram-alerts"') < home.indexOf('className="h7-trust"'), "strip precedes the next home block");
  const v3 = await read("src/components/v3/V3Pages.jsx");
  const handoff = v3.indexOf("<OutboundHandoff compact locale={locale} venueSlug={profile.slug}");
  const venueStrip = v3.indexOf('placement="venue-telegram-alerts"');
  assert.ok(handoff > 0 && venueStrip > handoff && venueStrip - handoff < 400, "venue strip directly below the registration card");
  const news = await read("src/components/v3/news/NewsListPage.jsx");
  const subtitle = news.indexOf('className="news-hero__subtitle"');
  const newsStrip = news.indexOf('placement="news-list-telegram-alerts"');
  assert.ok(subtitle > 0 && newsStrip > subtitle && newsStrip < news.indexOf('className="news-index-controls"'), "news strip at the top of the list, before the controls");
  const [en] = await render(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { TelegramAlertsStrip } from "../../src/components/v3/TelegramAlertsStrip.jsx";
    console.log(JSON.stringify(${JSON.stringify(LOCALES)}.map((locale) => renderToStaticMarkup(React.createElement(TelegramAlertsStrip, { locale, placement: "home-telegram-alerts" })))));
  `);
  assert.match(en, /data-cta-placement="home-telegram-alerts"/);
  assert.match(en, /href="https:\/\/t\.me\/NexuAlphaAssistantBot\?start=alerts"/);
});

test("Telegram page leads with the alerts product: sample message, four topics, Open the bot, channels and Mini App, in 15 locales", async () => {
  const pages = await render(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { TelegramBotHub } from "../../src/components/v3/TelegramBotHub.jsx";
    console.log(JSON.stringify(${JSON.stringify(LOCALES)}.map((locale) => [locale, renderToStaticMarkup(React.createElement(TelegramBotHub, { locale, headingLevel: 1 }))])));
  `);
  for (const [locale, html] of pages) {
    const h1 = html.match(/<h1 class="tg-hub__title">([^<]+)<\/h1>/);
    assert.ok(h1, `${locale}: h1`);
    assert.doesNotMatch(h1[1], /Continue exchange research/, locale);
    const gateway = html.indexOf("tg-topic-gateway");
    if (gateway > -1) assert.ok(html.indexOf("tg-signal-hero") < gateway, `${locale}: alerts hero before the answer-first section`);
    assert.ok(html.indexOf("tg-signal-hero") < html.indexOf("tg-return-rail"), `${locale}: alerts hero before the return rail`);
    assert.match(html, /data-cta-placement="telegram-alerts-open-bot"[^>]*/, locale);
    const primary = html.match(/<a href="([^"]+)"[^>]*data-cta-placement="telegram-alerts-open-bot"/);
    assert.equal(primary[1], "https://t.me/NexuAlphaAssistantBot?start=alerts", locale);
    assert.equal((html.match(/<li>/g) || []).length >= 4, true, locale);
    assert.equal((html.match(/class="tg-signal-hero__topics"/g) || []).length, 1, locale);
    assert.equal((html.match(/<ol class="tg-signal-hero__topics">(?:<li>.*?<\/li>){4}<\/ol>/s) || []).length, 1, `${locale}: four topics`);
    assert.match(html, /class="tg-signal-sample__bubble"/, locale);
    assert.match(html, /BTCUSDT/, locale);
    assert.match(html, /\$1\.28M/, locale);
    assert.match(html, /Binance USDT-M/, locale);
    assert.match(html, /14:32 UTC/, locale);
    assert.match(html, /Binance \+ OKX|Binance وOKX|Binance と OKX|Binance와 OKX|Binance e OKX|Binance et OKX|Binance und OKX|Binance ve OKX|Binance dan OKX|Binance và OKX|Binance y OKX|Binance 与 OKX|Binance 與 OKX|Binance \+ OKX/, `${locale}: source line names Binance + OKX`);
    assert.match(html, /21:00/, `${locale}: daily brief time`);
    assert.match(html, /13:00 UTC/, locale);
    assert.match(html, /href="https:\/\/app\.nexualpha\.com\/"/, `${locale}: Mini App`);
    assert.match(html, /data-cta-placement="telegram-alerts-channel-zh"/, locale);
    assert.match(html, /data-cta-placement="telegram-alerts-channel-en"/, locale);
    assert.doesNotMatch(html, /\d[\d,.]*\s*(k\+?\s*)?(subscribers|members|users|订阅者|成员)/i, `${locale}: no subscriber counts`);
    assert.doesNotMatch(html, /tg-hub__features-grid|tg-hub__broadcast-banner/, `${locale}: features grid and broadcast banner retired`);
    assert.match(html, /tg-return-rail/, locale);
    assert.match(html, /tg-hub__cta-box/, locale);
  }
  const ar = pages.find(([l]) => l === "ar")[1];
  assert.match(ar, /افتح البوت/);
  const ja = pages.find(([l]) => l === "ja")[1];
  assert.match(ja, /ボットを開く/);
});

test("compare page first screen: H1, the existing verdict, both official sign-up routes with the same hrefs and codes as the final-choice card, disclosure alongside, copy link demoted", async () => {
  const [html, de] = await render(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";
    const pageCopy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
    const page = (locale) => renderToStaticMarkup(React.createElement(CompareDeepPage, { copy: pageCopy, locale, selected: ["binance", "okx"], venues: Object.values(venueDatabase), updates: [], market: "unknown", product: "unknown" }));
    console.log(JSON.stringify([page("en"), page("de")]));
  `);
  const hero = html.indexOf('id="compare-hero"');
  const h1 = html.indexOf("<h1", hero);
  const actions = html.indexOf("data-compare-hero-actions", hero);
  const ledger = html.indexOf('class="r9-cmp"', hero);
  const copyLink = html.indexOf('data-cta-placement="decision-return-copy"', hero);
  const heroEnd = html.indexOf('class="v3-relationship-note"', hero);
  assert.ok(hero > 0 && h1 > hero && actions > h1 && ledger > actions && copyLink > ledger && copyLink < heroEnd, "order: h1, verdict + sign-up, fee ledger, copy link, all inside the hero");
  const heroBlock = html.slice(actions, ledger);
  assert.match(heroBlock, /Choose Binance for broad exchange depth; choose OKX when Web3-style routing and tools matter more\./, "verdict reuses the final-choice card title");
  assert.match(heroBlock, /data-disclosure-placement="compare-hero-signup"/, "commission disclosure in the same block");
  const heroSignup = [...heroBlock.matchAll(/<a href="([^"]+)"[^>]*data-cta-placement="compare-hero-signup"[^>]*>/g)];
  assert.equal(heroSignup.length, 2);
  const cardStart = html.indexOf('class="v3-compare-final-choice-card"');
  const card = html.slice(cardStart, html.indexOf("</article>", cardStart));
  const cardSignup = [...card.matchAll(/<a href="([^"]+)"[^>]*data-cta-placement="compare-final-choice-registration"[^>]*>/g)];
  assert.deepEqual(heroSignup.map((m) => m[1]), cardSignup.map((m) => m[1]), "identical registration hrefs");
  const code = (tag) => (tag.match(/data-cta-code="([^"]+)"/) || [])[1];
  assert.deepEqual(heroSignup.map((m) => code(m[0])), cardSignup.map((m) => code(m[0])), "identical invite codes");
  assert.ok(heroSignup.every((m) => /rel="sponsored noopener noreferrer"/.test(m[0]) || /data-cta-kind="research"/.test(m[0])));
  assert.ok(de.indexOf("data-compare-hero-actions") > de.indexOf('id="compare-hero"'), "localized compare pages get the same first screen");
  const css = await read("src/styles/r1-compare.css");
  assert.match(css, /\.v3-venue-hero \.decision-return-link > button \{[^}]*border: 0;[^}]*text-decoration: underline;/, "copy link is a text link on compare");
  assert.match(css, /\.v3-compare-hero-actions__row \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("activities: campaigns and the reviewed feed are grouped by exchange, three visible per group, every item kept in the HTML", async () => {
  for (const locale of LOCALES) {
    const { all, fewer } = showAllCopy(locale, 10);
    assert.match(all, /10/, locale);
    assert.ok(fewer.length > 0, locale);
  }
  assert.equal(GROUP_PREVIEW_COUNT, 3);
  const live = await read("src/components/v3/activity/LiveCampaigns.jsx");
  assert.match(live, /data-campaign-group=\{group\.venue\} data-expanded=\{expanded \? "true" : "false"\}/);
  assert.match(live, /data-group-overflow=\{itemIndex >= GROUP_PREVIEW_COUNT \? "true" : undefined\}/);
  assert.match(live, /className="live-campaigns__group-toggle" aria-expanded=\{expanded\}/);
  assert.doesNotMatch(live, /\.slice\(0, 24\)/, "no per-exchange cap drops cards any more");
  const liveCss = await read("src/components/v3/activity/live-campaigns.css");
  assert.match(liveCss, /\.live-campaigns__group\[data-expanded="false"\][^{]*\.live-campaigns__card\[data-group-overflow="true"\] \{ display: none; \}/);
  const center = await read("src/components/v3/activity/ActivityCenterV3.jsx");
  assert.match(center, /data-activity-group=\{group\.slug\} data-expanded=\{expanded \? "true" : "false"\}/);
  assert.match(center, /className="activity-card-v3" data-group-overflow=\{itemIndex >= GROUP_PREVIEW_COUNT \? "true" : undefined\}/);
  const centerCss = await read("src/components/v3/activity/ActivityCenterV3.css");
  assert.match(centerCss, /\.activity-center-v3__group\[data-expanded="false"\] \.activity-card-v3\[data-group-overflow="true"\] \{ display: none; \}/);
  assert.match(centerCss, /\.activity-center-v3__head:not\(#_\):not\(#_\):not\(#_\) \{ margin-block-end: 0; \}/, "no dead space under the intro");

  // SSR: a venue with five reviewed updates renders all five cards; the last two are flagged as overflow.
  const [html] = await render(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { ActivityCenterV3 } from "../../src/components/v3/activity/ActivityCenterV3.jsx";
    const now = Date.now();
    const updates = Array.from({ length: 5 }, (_, i) => ({ id: "okx-" + i, kind: "campaign", category: "rewards", title: "OKX campaign " + i, summary: "Summary " + i, platform: { slug: "okx", name: "OKX" }, officialSource: { type: "announcement", url: "https://www.okx.com/help/" + i }, discoveredAt: new Date(now - i * 3600e3).toISOString(), verifiedAt: new Date(now - i * 3600e3).toISOString(), publishedAt: new Date(now - i * 3600e3).toISOString(), expiresAt: new Date(now + 30 * 864e5).toISOString(), status: "verified", publishable: true }));
    console.log(JSON.stringify([renderToStaticMarkup(React.createElement(ActivityCenterV3, { locale: "en", venues: [{ slug: "okx", name: "OKX", category: "CEX" }], publicUpdates: updates }))]));
  `);
  if (html.includes('data-activity-group="okx"')) {
    assert.equal((html.match(/class="activity-card-v3"/g) || []).length, 5, "all five cards are in the HTML");
    assert.equal((html.match(/data-group-overflow="true"/g) || []).length, 2);
    assert.match(html, /data-expanded="false"/);
    assert.match(html, /Show all \(5\)/);
  }
});
