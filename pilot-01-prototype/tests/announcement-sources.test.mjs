// 2026-10-10: announcements from every exchange with a machine-readable source; links stay on the exchange's domain.
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeOkxAnnouncements, normalizeBinanceAnnouncements, normalizeKucoinAnnouncements, normalizeRssAnnouncements } from "../src/data/announcement-intel.js";

const now = Date.UTC(2026, 9, 10);
test("OKX, Binance and KuCoin payloads normalize with category and official link", () => {
  const okx = normalizeOkxAnnouncements({ code: "0", data: [{ details: [{ annType: "announcements-new-listings", title: "OKX to list ABC", url: "https://www.okx.com/help/okx-to-list-abc", pTime: String(now - 1000) }, { annType: "announcements-new-listings", title: "Phish", url: "https://okx.example.com/x", pTime: String(now) }] }] }, { now });
  assert.equal(okx.length, 1); assert.equal(okx[0].category, "listing");
  const bn = normalizeBinanceAnnouncements({ code: "000000", data: { catalogs: [{ catalogId: 161, articles: [{ code: "a1a7996170f246da90ea49f199a61bcd", title: "Binance Will Delist X", releaseDate: now - 5000 }] }] } }, 161, { now });
  assert.equal(bn[0].category, "delisting"); assert.match(bn[0].url, /^https:\/\/www\.binance\.com\/en\/support\/announcement\/detail\//);
  const kc = normalizeKucoinAnnouncements({ code: "200000", data: { items: [{ annId: 1, annTitle: "KuCoin lists Y", annUrl: "https://www.kucoin.com/announcement/en-y", cTime: now - 1 }] } }, "new-listings", { now });
  assert.equal(kc[0].venue, "kucoin");
});

test("RSS items parse; Kraken asset listings are listings; future dates are dropped", () => {
  const xml = `<rss><channel><item><title><![CDATA[ZCHF is available for trading!]]></title><link>https://blog.kraken.com/product/asset-listings/zchf</link><pubDate>Thu, 08 Oct 2026 15:53:48 +0000</pubDate></item><item><title>Future</title><link>https://blog.kraken.com/news/f</link><pubDate>Thu, 08 Oct 2030 15:53:48 +0000</pubDate></item></channel></rss>`;
  const k = normalizeRssAnnouncements(xml, "kraken", { now });
  assert.equal(k.length, 1); assert.equal(k[0].category, "listing"); assert.equal(k[0].title, "ZCHF is available for trading!");
});
