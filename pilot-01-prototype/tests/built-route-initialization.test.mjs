import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const ownersFile = new URL("dist/client/style-modules.json", root);
const built = existsSync(ownersFile);
const routes = [
  // This source has no copy-runtime import, but its merged emitted chunk does.
  ["./components/v3/VenueAlternativesPage.jsx", "/topics/bybit-alternatives", "VenueAlternativesPage"],
  ["./components/v3/VenueDetailPage.jsx", "/exchanges/bitget", "VenueDetailPage"],
  ["./components/v3/V3Pages.jsx", "/compare/binance-vs-okx", "CompareDeepPage"],
  ["./components/v3/news/NewsDetailPage.jsx", "/news/example", "NewsDetailPage"],
  ["./components/data/FundingRatesPage.jsx", "/funding-rates", "FundingRatesPage"],
];
for (const locale of ["en", "zh-Hans", "zh-Hant", "it", "ar", "ur", "uk"]) {
  test(`actual built route chunks initialize in ${locale} without network or lexical errors`, { skip: !built, timeout: 30000 }, () => {
    for (const [source, route, exportName] of routes) {
      const pathname = locale === "en" ? route : `/${locale.toLowerCase()}${route}`;
      const output = execFileSync(process.execPath, [fileURLToPath(new URL("helpers/import-built-route.mjs", import.meta.url)), source, locale, pathname, exportName], {
        cwd: fileURLToPath(root), encoding: "utf8", timeout: 10000,
      });
      assert.match(output, /: initialized/);
    }
  });
}
