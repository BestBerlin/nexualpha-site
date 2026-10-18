// Independent site review fixes (owner approved 2026-10-10): honest header destinations, a quiet Telegram
// entry, AA contrast on filled-accent buttons, no hidden-but-focusable dock, mobile article first screen,
// and plain words instead of internal jargon.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { headerNavigationState } from "../src/data/header-navigation-state.js";
import { h7Copy } from "../src/components/v7/home7-copy.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];

test("header Exchanges and Compare point at real pages, not home anchors", () => {
  const app = read("src/App.jsx");
  assert.match(app, /\[copy\.nav\.exchanges, withLocale\(locale, "\/exchanges"\)\]/);
  // Owner/audit 4.6 (2026-10-11): Compare opens the compare hub (any-two picker + popular pairs), not one fixed pair.
  assert.match(app, /\[copy\.nav\.compare, withLocale\(locale, "\/compare"\)\]/);
  assert.doesNotMatch(app, /\[copy\.nav\.compare, withLocale\(locale, "\/compare\/[a-z-]+"\)\]/);
  assert.doesNotMatch(app, /withLocale\(locale, "\/#(exchanges|compare)"\)/);
});

test("header active state follows the directory, profiles and every comparison page", () => {
  assert.equal(headerNavigationState("/exchanges", "https://nexualpha.com/exchanges").current, "page");
  assert.deepEqual(headerNavigationState("/exchanges", "https://nexualpha.com/exchanges/okx"), { active: true });
  assert.deepEqual(headerNavigationState("/zh-hans/exchanges", "https://nexualpha.com/zh-hans/exchanges/okx"), { active: true });
  assert.equal(headerNavigationState("/compare/binance-vs-okx", "https://nexualpha.com/compare/binance-vs-okx").current, "page");
  assert.deepEqual(headerNavigationState("/compare/binance-vs-okx", "https://nexualpha.com/compare/bybit-vs-bitget"), { active: true });
  assert.deepEqual(headerNavigationState("/exchanges", "https://nexualpha.com/compare/binance-vs-okx"), {});
  assert.deepEqual(headerNavigationState("/compare/binance-vs-okx", "https://nexualpha.com/exchanges"), {});
  assert.equal(headerNavigationState("/compare", "https://nexualpha.com/compare").current, "page");
  assert.deepEqual(headerNavigationState("/compare", "https://nexualpha.com/compare/bybit-vs-bitget"), { active: true });
  assert.deepEqual(headerNavigationState("/fr/compare", "https://nexualpha.com/fr/compare/okx-vs-bybit"), { active: true });
  assert.deepEqual(headerNavigationState("/compare", "https://nexualpha.com/exchanges"), {});
});

test("Telegram header entry is an outline control, not a filled brand-blue pill", () => {
  const css = read("src/styles/v5/shell.css");
  const tg = css.slice(css.indexOf(".nx-tg {"));
  assert.doesNotMatch(tg, /#229ED9|#1c8cc2|34 158 217/i);
  assert.match(tg, /\.nx-tg \{[^}]*background: transparent;[^}]*border: 1px solid var\(--nx-n6\)/);
  assert.match(tg, /\.nx-tg:hover[^{]*\{[^}]*\}\s*\.nx-tg:hover \.nx-ico[^{]*\{ color: var\(--nx-accent\)/);
  const header = read("src/components/shell/SiteHeader.jsx");
  assert.match(header, /function TelegramIcon\(\) \{\s*return <svg[^>]*fill="none" stroke="currentColor"/);
  // Link targets and tracking attributes stay as they were.
  assert.match(header, /className="nx-tg nx-tg--compact" href=\{telegramItem\[1\]\}/);
  assert.match(header, /className="nx-tg" href=\{telegramItem\[1\]\}/);
});

test("filled cyan buttons keep dark ink against higher-specificity white rules", () => {
  assert.match(read("src/styles/v6/cro.css"), /v3-mobile-sticky-bar__btn--signup[^{]*\{[^}]*color: var\(--on-accent, #04130f\) !important;/);
  assert.match(read("src/components/v3/activity/live-campaigns.css"),
    /\.live-campaigns:not\(#_\):not\(#_\):not\(#_\):not\(#_\) :is\(\.live-campaigns__chips button\.is-on\) \{ color: #0B0D10; \}/);
});

test("hidden home sign-up dock is inert (React 19 boolean), not just aria-hidden", () => {
  const home = read("src/components/v7/HomeV7.jsx");
  assert.match(home, /\{ inert: true, "aria-hidden": "true" \}/);
  assert.doesNotMatch(home, /inert: ""/);
});

test("mobile article shows the first section before the generic guidance rail", () => {
  const css = read("src/components/v3/news/news-detail-page.css");
  const block = css.slice(css.indexOf("@media (max-width: 1023px) {\n  #top.news-detail-page .news-detail-container:not(#_) { display: flex"));
  assert.ok(block.length > 0);
  assert.match(block, /> \.news-detail__content \{ display: contents; \}/);
  assert.match(block, /:is\(\.news-detail__local-brief, \.news-detail__section-nav, \.news-detail__prose--lead\) \{ order: 1; \}/);
  assert.match(block, /> \.news-detail__rail \{ order: 2;/);
  // The guidance block and the venue offer (with its disclosure) are still rendered.
  const page = read("src/components/v3/news/NewsDetailPage.jsx");
  assert.match(page, /<ArticleDecisionSummary /);
  assert.match(page, /<SponsoredSlot [^>]*variant="sidebar" \/>/);
});

test("home hero no longer says partner node in any locale", () => {
  for (const locale of LOCALES) {
    const sub = h7Copy(locale).sub;
    assert.ok(sub, locale);
    assert.doesNotMatch(sub, /node|节点|節點|ノード|노드|\bnodo\b|nœud|Knoten|узел|düğüm|\bnó\b|nút|عقدة/i, locale);
  }
});

test("comparison page uses plain words for the numbers block and unchecked items", () => {
  const pages = read("src/components/v3/V3Pages.jsx");
  assert.match(pages, /return \{ \.\.\.labels, \.\.\.fallback, metrics \};/);
  assert.doesNotMatch(pages, /pendingSummary: "Pending fields"|pendingTitle: "Fields kept pending"/);
  assert.doesNotMatch(read("src/components/v3/TelegramBotHub.jsx"), /stay pending/);
});
