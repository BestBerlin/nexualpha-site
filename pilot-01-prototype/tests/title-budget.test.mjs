// Owner decision 2026-10-11: long titles drop the " — NexuAlpha" suffix (it would be cut to "…" in search results;
// the site name shows separately from the WebSite/Organization schema). Short titles keep it.
import test from "node:test";
import assert from "node:assert/strict";
import { budgetTitle, titleBudgetForLocale, titleDisplayWidth } from "../src/data/meta-description.js";
import { routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

test("budgetTitle keeps short titles, drops the suffix and trims long titles", () => {
  assert.equal(budgetTitle("About NexuAlpha — NexuAlpha"), "About NexuAlpha — NexuAlpha");
  assert.equal(budgetTitle("市场新闻与源头核验研究 — NexuAlpha"), "市场新闻与源头核验研究 — NexuAlpha");
  const long = "OKX Unified Tokenized Stocks Explained: What You Own, 24/7 Hours, Dividends and Who Can Trade (2026)";
  assert.equal(budgetTitle(`${long} — NexuAlpha`), "OKX Unified Tokenized Stocks Explained: What You Own, 24/7…");
  assert.ok(budgetTitle(`${long} — NexuAlpha`).length <= 60);
  assert.ok(budgetTitle("Binance と OKX：手数料、商品、KYC、Web3 アクセス確認 — NexuAlpha", titleBudgetForLocale("ja")).length <= 32);
  assert.equal(budgetTitle("OKX Referral Code nexu888: Up to 40% Fee Rebate (2026)"), "OKX Referral Code nexu888: Up to 40% Fee Rebate (2026)");
  assert.ok(titleDisplayWidth("中文") === 4 && titleDisplayWidth("ab") === 2);
});

test("Worker head and computeRouteSeo apply the same title budget", async () => {
  for (const path of ["/", "/about", "/exchanges", "/zh-hans/news", "/compare/binance-vs-okx", "/ja/compare/binance-vs-okx", "/topics/tokenized-assets"]) {
    const meta = await routeMetadata(new URL(`https://nexualpha.com${path}`), {});
    assert.ok(meta.title.length <= titleBudgetForLocale(meta.locale), `${path}: ${meta.title}`);
    const seo = computeRouteSeo({ url: path });
    assert.ok(seo.title.length <= titleBudgetForLocale(seo.locale), `client ${path}: ${seo.title}`);
  }
});
