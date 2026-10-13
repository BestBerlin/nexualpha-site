// Owner decision 2026-10-13 (legal): Vietnamese is an information-only locale and Vietnam a no-promotion market
// (Vietnam Government Resolution 05/2025/NQ-CP: only Ministry-of-Finance-licensed platforms may offer or advertise
// crypto services). News, market data and tools stay; sign-up CTAs, invite codes, /go/ partner buttons, campaign join
// buttons and APK buttons do not. One neutral list (src/data/locale-policy.js) drives every surface.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NEUTRAL_CTA_LOCALE_LIST, NEUTRAL_CTA_LOCALES, isNeutralCtaLocale } from "../src/data/locale-policy.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { isPartnerPromotableIn, jurisdictionPromotionBan } from "../src/data/partner-geo-policy.js";
import { publicCtaForVenue, regionalVenueCta } from "../src/data/source-bound-cta.js";
import { carriesSignupPath, isReferralTopicArticle, neutralArticleMarkdown, neutralArticleSources, neutralArticleView, NEUTRAL_FILTER_INVITE_CODES } from "../src/data/neutral-article.js";
import { newsArticleAvailableLocales, newsArticleSeoLocales } from "../src/data/news-feed-client.js";
import { partnerVenueFaqFor } from "../src/data/partner-venue-faq.js";
import { referralTitleAllowed } from "../src/data/referral-seo.js";
import { NEUTRAL_HOME_DESCRIPTION_LOCALES } from "../src/data/home-search-copy.js";
import { NEUTRAL_PROMOTION_LOCALES, resolvePromotions, PROMOTIONS } from "../src/data/promotions.js";
import { withoutFundingTradeHrefs } from "../src/data/funding-matrix.js";
import { appDownloadSignupAllowed, appDownloadContent } from "../src/data/app-downloads.js";
import { bitgetAllianceSignupGate, BITGET_ALLIANCE_CODE } from "../src/data/bitget-alliance.js";
import { krakenUsdgSignupGate } from "../src/data/kraken-usdg.js";
import { bybitStocksSignupGate } from "../src/data/bybit-stocks.js";
import { binanceOctoberSignupGate } from "../src/data/binance-october.js";
import { routeMetadata, renderArticleSitemap, renderLiveNewsSitemap } from "../worker/index.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const repo = path.resolve(root, "..");
const partnersFeed = JSON.parse(readFileSync(path.join(root, "public/intel/partners.json"), "utf8"));
// Every invite code in the partner feed plus campaign codes; never a hand-typed list of current codes only.
const CODES = [...new Set([...partnersFeed.partners.map((p) => p.inviteCode).filter(Boolean), BITGET_ALLIANCE_CODE, "nexu888", "11350287", "7f97gkqw", "DPRWSXAS", "48553"])];
const codePattern = new RegExp(`(?:^|[^A-Za-z0-9_])(?:${CODES.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![A-Za-z0-9_])`, "i");
// Sign-up wording (Vietnamese and the English it replaces); informational uses of "đăng ký" ("before signing up") stay.
const SIGNUP_COPY = /Đăng ký (?:trên (?!trang)|ngay|và tham gia|, nhận hoàn phí|, hoàn phí)|Nhận hoàn phí, mở tài khoản|Đã kèm mã giới thiệu|đã kèm mã giới thiệu của chúng tôi|mã giới thiệu của chúng tôi|Sign up on|Register on|Open an account, get the rebate|Claim rebate/;

test("one neutral list: vi joins ru, ar, zh-Hant, ur and uk, and every copy matches it", () => {
  assert.deepEqual([...NEUTRAL_CTA_LOCALE_LIST], ["ru", "ar", "zh-Hant", "ur", "uk", "vi"]);
  for (const locale of ["vi", "vi-VN", "ru-RU", "uk-UA", "zh-TW", "zh-HK", "zh-Hant", "ar", "ur"]) assert.equal(isNeutralCtaLocale(locale), true, locale);
  for (const locale of ["en", "zh-Hans", "tr", "id", "pt-BR", "ja", "ko", "es", "fr", "de", "it"]) assert.equal(isNeutralCtaLocale(locale), false, locale);
  assert.deepEqual([...NEUTRAL_PROMOTION_LOCALES], [...NEUTRAL_CTA_LOCALE_LIST]);
  assert.deepEqual([...NEUTRAL_HOME_DESCRIPTION_LOCALES].sort(), [...NEUTRAL_CTA_LOCALE_LIST].sort());
  // No source file keeps its own five-locale copy of the list.
  const stale = /\[\s*['"]ru['"]\s*,\s*['"]ar['"]\s*,\s*['"]zh-Hant['"]\s*,\s*['"]ur['"]\s*,\s*['"]uk['"]\s*\]|\(\s*'ru'\s*,\s*'ar'\s*,\s*'zh-Hant'\s*,\s*'ur'\s*,\s*'uk'\s*\)/;
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name.startsWith(".") || name === "dist" || name === "evidence" || name === "episodes") continue;
      const file = path.join(dir, name);
      const stat = statSync(file);
      if (stat.isDirectory()) walk(file);
      else if (/\.(?:m?js|jsx|ts|py|sql)$/.test(name) && stat.size < 2_000_000 && stale.test(readFileSync(file, "utf8"))) offenders.push(path.relative(repo, file));
    }
  };
  for (const dir of ["src", "scripts", "server", "worker"]) walk(path.join(root, dir));
  for (const dir of ["ops/academy", "ops/alert-sender", "ops/channel-feed", "ops/newsroom"]) if (existsSync(path.join(repo, dir))) walk(path.join(repo, dir));
  assert.deepEqual(offenders, []);
  // Python and SQL copies read the same list.
  const engine = readFileSync(path.join(repo, "ops/academy/engine.py"), "utf8").match(/NEUTRAL_CTA_LOCALES=\(([^)]*)\)/)?.[1];
  assert.deepEqual(engine.split(",").map((s) => s.trim().replace(/'/g, "")).filter(Boolean), [...NEUTRAL_CTA_LOCALE_LIST]);
  const migration = readFileSync(path.join(repo, "ops/newsroom/db/migrations/096_vi_neutral_locale.sql"), "utf8").match(/set default '\{([^}]*)\}'/)?.[1];
  assert.deepEqual(migration.split(",").sort(), [...NEUTRAL_CTA_LOCALE_LIST].sort());
});

test("Vietnam is a no-promotion jurisdiction: vi pages and VN markets in any locale show no partner route", () => {
  const contexts = [{ locale: "vi" }, { locale: "vi", market: "/int" }, { locale: "vi", market: "GLOBAL" }, { locale: "en", market: "VN" }, { locale: "en", market: "/vn" }, { locale: "zh-Hans", market: "VN" }, { locale: "de", market: "vn" }];
  for (const p of partnersFeed.partners) {
    for (const context of contexts) {
      assert.equal(isPartnerPromotableIn(p.slug, context), false, `${p.slug} ${JSON.stringify(context)}`);
      const cta = publicCtaForVenue(p.slug, context.locale, context.market);
      assert.equal(cta.inviteCode, null);
      assert.equal(cta.registrationUrl, null);
      assert.equal(regionalVenueCta(p.slug, context.locale, context.market, "spot").ctaState, "blocked");
    }
    assert.equal(referralTitleAllowed(p.slug, "vi"), false);
    assert.equal(partnerVenueFaqFor(p.slug, "vi"), null, `${p.slug}: no vi referral FAQ`);
  }
  assert.equal(jurisdictionPromotionBan({ locale: "ru" }), null, "ru keeps its own (locale-only) neutral rules");
  assert.equal(jurisdictionPromotionBan({ locale: "en", market: "US" }), null);
  // Campaign, app, flash, glossary and coin gates follow the shared list.
  assert.equal(bitgetAllianceSignupGate({ locale: "vi" }), "neutral-locale");
  assert.equal(krakenUsdgSignupGate({ locale: "vi" }), "neutral-locale");
  assert.equal(binanceOctoberSignupGate({ locale: "vi" }), "neutral-locale");
  assert.equal(bybitStocksSignupGate({ locale: "vi" }), "neutral-locale");
  for (const slug of ["okx", "bitget", "binance", "bybit"]) {
    assert.equal(appDownloadSignupAllowed(slug, { locale: "vi" }), false);
    assert.equal(appDownloadSignupAllowed(slug, { locale: "en", market: "VN" }), false);
    assert.equal(appDownloadContent(slug, "vi").apk, null, `${slug}: no APK button on vi`);
  }
  assert.deepEqual(resolvePromotions({ venue: "okx", topicTags: ["okx"], locale: "vi" }, PROMOTIONS).filter((p) => p.kind !== "tool"), []);
});

test("neutral article view removes code sentences, /go/ links and the partner feed source, and is idempotent", () => {
  const body = [
    "## Phí giao dịch",
    "Phí taker của OKX là 0,05%. Đăng ký với mã nexu888 để được hoàn 40%. Xem [bảng phí](/rates).",
    "| Sàn | Mã |\n|---|---|\n| Binance | 11350287 |",
    "- Mở [OKX](/go/okx?src=x)\n- So sánh trên [/rates](/rates)",
    "Thị trường đi ngang trước dữ liệu CPI.",
  ].join("\n\n");
  const out = neutralArticleMarkdown(body, "vi");
  assert.doesNotMatch(out, codePattern);
  assert.doesNotMatch(out, /\/go\//);
  assert.match(out, /Phí taker của OKX là 0,05%\./);
  assert.match(out, /Thị trường đi ngang/);
  assert.match(out, /\[\/rates\]\(\/rates\)/);
  assert.equal(neutralArticleMarkdown(out, "vi"), out, "idempotent: SSR and hydration render the same body");
  assert.equal(neutralArticleMarkdown(body, "en"), body, "non-neutral locales are untouched");
  for (const code of NEUTRAL_FILTER_INVITE_CODES) assert.ok(carriesSignupPath(`code ${code}.`), code);
  const sources = [{ url: "https://www.okx.com/fees", role: "fees" }, { url: "https://nexualpha.com/intel/partners.json", role: "OKX code nexu888" }];
  assert.deepEqual(neutralArticleSources(sources, "vi"), [sources[0]]);
  const article = { slug: "x", title: { en: "Fees", vi: "Phí" }, content: { en: "Use code nexu888 now. Fees are low.", vi: body }, sources };
  const view = neutralArticleView(article, "vi");
  assert.doesNotMatch(JSON.stringify(view), codePattern);
  assert.equal(neutralArticleView(article, "en"), article);
});

test("an article whose whole topic is a referral code has no neutral-locale edition (noindex, out of sitemap and hreflang)", () => {
  const editions = (slug, title) => ({ slug, status: "PUBLISHED", seo: { noindex: false }, sources: [{ url: "https://app.hyperliquid.xyz" }], availableLocales: ["en", "vi", "id"], title: { en: title, vi: "x", id: "x" }, summary: { en: "s", vi: "s", id: "s" }, content: { en: "c", vi: "c", id: "c" } });
  const referral = editions("hyperliquid-referral-code-2026-where-to-enter-4-percent-discount", "Hyperliquid Referral Code 2026");
  assert.equal(isReferralTopicArticle(referral), true);
  assert.deepEqual(newsArticleAvailableLocales(referral), ["en", "id"]);
  assert.deepEqual(newsArticleSeoLocales(referral), ["en", "id"]);
  const fees = editions("binance-vs-bybit-fees-2026-spot-futures-after-rebate", "Binance vs Bybit Fees in 2026");
  assert.equal(isReferralTopicArticle(fees), false);
  assert.ok(newsArticleAvailableLocales(fees).includes("vi"));
});

test("Worker metadata and article sitemaps exclude neutral referral-topic editions from clusters", async () => {
  const article = {
    slug: "hyperliquid-referral-code-2026-where-to-enter-4-percent-discount",
    status: "PUBLISHED",
    publishedAt: "2026-10-13T00:00:00Z",
    updatedAt: "2026-10-13T01:00:00Z",
    seo: { noindex: false },
    sources: [{ url: "https://app.hyperliquid.xyz", title: "Hyperliquid", publisher: "Hyperliquid" }],
    availableLocales: ["en", "vi", "id"],
    title: { en: "Hyperliquid Referral Code 2026", vi: "Mã giới thiệu Hyperliquid 2026", id: "Kode Referral Hyperliquid 2026" },
    summary: { en: "Where to enter the code.", vi: "Nơi nhập mã.", id: "Tempat memasukkan kode." },
    content: { en: "Use the official app.", vi: "Dùng ứng dụng chính thức.", id: "Gunakan aplikasi resmi." },
  };
  const feedBody = JSON.stringify({ articles: [article] });
  const env = { ASSETS: { fetch: async (request) => {
    const pathname = new URL(request.url).pathname;
    return pathname === "/content/news-feed.json"
      ? new Response(feedBody, { headers: { "content-type": "application/json" } })
      : new Response("missing", { status: 404 });
  } } };

  const viMetadata = await routeMetadata(new URL(`https://nexualpha.com/vi/news/${article.slug}`), env);
  assert.equal(viMetadata.robots, "noindex,follow");
  assert.equal(viMetadata.canonical, `https://nexualpha.com/news/${article.slug}`);
  assert.deepEqual(viMetadata.alternates, []);

  const idMetadata = await routeMetadata(new URL(`https://nexualpha.com${localizedPath(`/news/${article.slug}`, "id")}`), env);
  assert.equal(idMetadata.robots, "index,follow");
  assert.deepEqual(idMetadata.alternates.map((alt) => alt.hreflang), ["en", "id", "x-default"]);

  const viArticleSitemap = renderArticleSitemap([article], "vi");
  assert.doesNotMatch(viArticleSitemap, /\/vi\/news\/hyperliquid-referral-code-2026-where-to-enter-4-percent-discount/);
  assert.doesNotMatch(viArticleSitemap, /hreflang="vi"/);

  for (const xml of [
    renderArticleSitemap([article], "id"),
    renderLiveNewsSitemap([article], Date.parse("2026-10-13T02:00:00Z")),
  ]) {
    assert.doesNotMatch(xml, /\/vi\/news\/hyperliquid-referral-code-2026-where-to-enter-4-percent-discount/);
    assert.doesNotMatch(xml, /hreflang="vi"/);
    assert.match(xml, /\/id-id\/news\/hyperliquid-referral-code-2026-where-to-enter-4-percent-discount/);
  }
});

test("funding matrix payload for neutral pages carries no /go/ trade routes", () => {
  const matrix = { venues: [{ slug: "okx", tradeHref: "/go/okx?src=funding-matrix", profileHref: "/exchanges/okx" }], rows: [{ symbol: "BTC", venues: { okx: { venue: "okx", tradeHref: "/go/okx?src=funding-matrix", rate: 0.0001 } } }] };
  const out = withoutFundingTradeHrefs(matrix);
  assert.doesNotMatch(JSON.stringify(out), /\/go\//);
  assert.equal(out.rows[0].venues.okx.rate, 0.0001);
  assert.ok(NEUTRAL_CTA_LOCALES.has("vi"));
});

// ---- Served pages (needs `npm run build`) ----------------------------------------------------------------------------
const distReady = existsSync(path.join(root, "dist/news-ssr/entry-server.js")) && existsSync(path.join(root, "dist/client/index.html"));
const VI_ARTICLE = {
  slug: "vi-neutral-fixture-funding-and-fees",
  status: "PUBLISHED", category: "market", categoryName: { en: "Market", vi: "Thị trường" },
  publishedAt: "2026-10-13T01:00:00Z", updatedAt: "2026-10-13T01:00:00Z", readTime: "3 min", author: "NexuAlpha Research Desk",
  title: { en: "Funding and fees before CPI", vi: "Funding và phí trước CPI" },
  summary: { en: "Funding turned negative before CPI.", vi: "Funding chuyển âm trước CPI. Đăng ký với mã nexu888 để được hoàn phí." },
  content: {
    en: "## Funding\n\nFunding turned negative before CPI.\n\nRegister with code nexu888 for a 40% rebate, or open [Binance](/go/binance?src=news) with code 11350287.",
    vi: "## Funding\n\nFunding chuyển âm trước dữ liệu CPI của Mỹ, phe short trả phí cho phe long.\n\nĐăng ký OKX với mã nexu888 để được hoàn 40% phí. Mở [Binance](/go/binance?src=news) với mã 11350287.\n\n| Sàn | Mã |\n|---|---|\n| Kraken | 7f97gkqw |\n\nGiữ đòn bẩy thấp trước khi dữ liệu công bố.",
  },
  sources: [{ url: "https://www.okx.com/fees", publisher: "OKX", title: "Fees", primary: true }, { url: "https://nexualpha.com/intel/partners.json", publisher: "NexuAlpha", title: "Partner feed", role: "OKX code nexu888, Bybit 48553", primary: false }],
  relatedVenues: ["okx", "binance"], topicTags: ["okx"], cta: { venue: "okx" },
  seo: { noindex: false, title: "Funding and fees before CPI", description: "Funding turned negative before CPI." },
  availableLocales: ["en", "vi"],
};

async function servedHtml(paths) {
  const { default: worker } = await import("../worker/index.js");
  const { render } = await import("../dist/news-ssr/entry-server.js");
  const feed = JSON.parse(readFileSync(path.join(root, "dist/client/content/news-feed.json"), "utf8"));
  feed.articles = [VI_ARTICLE, ...feed.articles.filter((a) => a.slug !== VI_ARTICLE.slug)];
  const feedBody = JSON.stringify(feed);
  const assets = { fetch: async (request) => {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/content/news-feed.json") return new Response(feedBody, { headers: { "content-type": "application/json" } });
    try {
      const body = readFileSync(path.join(root, "dist/client", pathname === "/" ? "/index.html" : pathname));
      return new Response(body, { headers: { "content-type": pathname.endsWith(".json") ? "application/json" : "text/html" } });
    } catch { return new Response("missing", { status: 404 }); }
  } };
  const out = [];
  for (const p of paths) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${p}`), { ASSETS: assets, NEWS_SSR_RENDER: (url, options) => render(url, options) });
    out.push({ path: p, status: response.status, html: await response.text() });
  }
  return out;
}

test("served vi pages and VN-market pages carry no /go/ route, invite code, registration link or sign-up copy", { skip: !distReady && "run npm run build first" }, async () => {
  // Every neutral locale gets the vi treatment (lead 2026-10-13): home, exchange profiles, apps, compare, rates, activities.
  const otherNeutral = NEUTRAL_CTA_LOCALE_LIST.filter((locale) => locale !== "vi").flatMap((locale) => [
    "/", "/exchanges/okx", "/exchanges/bitget", "/exchanges/binance", "/exchanges/bybit", "/exchanges/okx/app",
    "/activities", "/rates", "/compare/binance-vs-okx", "/funding-rates/matrix", "/flash", "/news",
  ].map((path) => localizedPath(path, locale)));
  const pages = await servedHtml([
    ...otherNeutral,
    "/vi", "/vn", "/?market=VN", "/de?market=VN",
    "/vi/exchanges/okx", "/vi/exchanges/bitget", "/vi/exchanges/binance", "/vi/exchanges/bybit", "/vi/exchanges/kraken", "/vi/exchanges/hyperliquid",
    "/vi/exchanges/okx/app", "/vi/exchanges/binance/app", "/exchanges/okx?market=VN",
    "/vi/activities", "/vi/activities/bitget-alliance", "/vi/activities/bybit-stocks",
    "/vi/rates", "/vi/compare/binance-vs-okx", "/vi/funding-rates", "/vi/funding-rates/matrix", "/vi/liquidations", "/vi/liquidations/heatmap", "/vi/long-short", "/vi/whales", "/vi/coins/bitcoin", "/vi/glossary", "/vi/academy", "/vi/flash", "/vi/telegram",
    "/vi/news", `/vi/news/${VI_ARTICLE.slug}`, "/vi/topics/bybit-alternatives", "/vi/factbook/okx",
  ]);
  const failures = [];
  for (const { path: p, status, html } of pages) {
    assert.ok(status === 200 || status === 404, `${p}: ${status}`);
    if (status !== 200) continue;
    const at = (re) => { const m = html.match(re); return m ? html.slice(Math.max(0, m.index - 120), m.index + 80) : ""; };
    const no = (re, label) => { if (re.test(html)) failures.push(`${p}: ${label}: ${at(re)}`); };
    no(/href="\/go\/|"\/go\/[a-z]/, "/go/ route");
    no(codePattern, "invite code");
    no(/data-cta-kind="registration"|rel="sponsored/, "registration link");
    no(SIGNUP_COPY, "sign-up copy");
    no(/data-app-registration|data-app-apk|\.apk"/, "app sign-up or APK button");
  }
  assert.deepEqual(failures, []);
  // vi joins the neutral home locales: no "up to 60%" rebate line in the home head or hero.
  const home = pages.find((row) => row.path === "/vi");
  const headText = [...home.html.matchAll(/<title[^>]*>([^<]*)<\/title>|<meta [^>]*content="([^"]*)"/g)].map((m) => m[1] || m[2]).join("\n");
  assert.doesNotMatch(headText, /Lên đến|\b60\s?%|hoàn phí|mã giới thiệu/i, "vi home title and meta");
  assert.doesNotMatch(home.html.match(/<section class="h7-hero"[\s\S]*?<\/section>/)?.[0] || "", /Lên đến|60\s?%/i, "vi home hero");
  for (const path of ["/?market=VN", ...NEUTRAL_CTA_LOCALE_LIST.map((locale) => localizedPath("/", locale))]) {
    const page = pages.find((row) => row.path === path);
    const meta = [...page.html.matchAll(/<title[^>]*>([^<]*)<\/title>|<meta [^>]*(?:name="description"|property="og:(?:title|description)")[^>]*content="([^"]*)"/g)].map((m) => m[1] || m[2]).join("\n");
    assert.doesNotMatch(meta, /referral|rebate|\b60\s?%|Lên đến|hoàn phí|mã giới thiệu|邀請碼|返傭|реферал|промокод|إحالة/i, `${path}: neutral title and meta: ${meta}`);
  }
  const article = pages.find((row) => row.path === `/vi/news/${VI_ARTICLE.slug}`);
  if (article?.status === 200) {
    assert.match(article.html, /Funding chuyển âm trước dữ liệu CPI/, "the article's facts stay");
    assert.match(article.html, /Giữ đòn bẩy thấp/);
  }
});

test("other locales keep their partner routes (the gate is scoped to vi / VN)", { skip: !distReady && "run npm run build first" }, async () => {
  const [en, okx] = await servedHtml(["/", "/exchanges/okx"]);
  assert.ok(/data-cta-kind="registration"/.test(en.html), "en home keeps its sign-up desk");
  assert.ok(codePattern.test(okx.html), "en OKX profile keeps its code");
});
