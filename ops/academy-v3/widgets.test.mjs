import assert from "node:assert/strict";
import test from "node:test";
import { esc, setBackdrop, widget } from "./widgets.mjs";

test("esc escapes text and attribute-sensitive characters", () => {
  assert.equal(esc(`<&>"'`), "&lt;&amp;&gt;&quot;&#39;");
  const html = widget({ type: "warning", title: `<bad>`, message: `A&B "quote"` });
  assert.match(html, /&lt;bad&gt;/);
  assert.match(html, /A&amp;B &quot;quote&quot;/);
  assert.doesNotMatch(html, /<bad>|A&B/);
});

test("price board renders only supplied prop values", () => {
  const html = widget({
    type: "price-board",
    rows: [{ symbol: "BTC", price: "owner-price", change: "owner-change" }],
  });
  assert.match(html, /BTC/);
  assert.match(html, /owner-price/);
  assert.match(html, /owner-change/);
  assert.doesNotMatch(html, /[0-9]+(?:\.[0-9]+)?%|\$[0-9]|10000|0\.05/);
});

test("order ticket supports market and limit without credential capture controls", () => {
  const market = widget({ type: "order-ticket", orderType: "market", side: "Buy", quantity: "q-prop" });
  const limit = widget({ type: "order-ticket", orderType: "limit", side: "Sell", price: "p-prop", quantity: "q-prop" });
  assert.match(market, /Market/);
  assert.match(market, /order-row/);
  assert.doesNotMatch(market, /p-prop/);
  assert.match(limit, /Limit/);
  assert.match(limit, /p-prop/);
  assert.throws(() => widget({ type: "order-ticket", orderType: "stop" }), /Invalid order type/);
  assert.doesNotMatch(`${market}${limit}`, /<(?:input|button|select|textarea)\b/i);
});

test("address, margin, checklist, identity, and warning stay display-only and prop-driven", () => {
  const html = [
    widget({ type: "address-form", network: "Arbitrum", address: "0xabc", memo: "tag-7" }),
    widget({ type: "margin", mode: "cross", balance: "balance-prop", positions: [{ label: "BTC perp", amount: "amount-prop" }], autoAdd: true, poolScope: "USDC pool" }),
    widget({ type: "checklist", items: [{ label: "Check domain", done: true }] }),
    widget({ type: "identity", steps: [{ label: "Fictional document review", status: "demo" }], photos: true, fictionalNote: "No real upload" }),
    widget({ type: "warning", message: "Read terms first" }),
  ].join("");
  for (const value of ["Arbitrum", "0xabc", "tag-7", "Cross pool", "balance-prop", "BTC perp", "amount-prop", "USDC pool", "Check domain", "Fictional document review", "Read terms first"]) {
    assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(html, /margin-pool/);
  assert.doesNotMatch(html, /<(?:input|button|select|textarea|form)\b/i);
});

test("margin renders isolated boxes and cross pools with explicit prop data", () => {
  const isolated = widget({ type: "margin", mode: "isolated", balance: "isolated-balance", positions: [{ label: "ETH", amount: "1 unit" }], autoAdd: false, poolScope: "position only" });
  const cross = widget({ type: "margin", mode: "cross", balance: "cross-balance", positions: [{ label: "BTC", amount: "2 units" }], autoAdd: true, poolScope: "wallet pool" });
  assert.match(isolated, /margin-box/);
  assert.match(isolated, /Isolated box/);
  assert.match(isolated, /isolated-balance/);
  assert.match(isolated, /position-row/);
  assert.match(cross, /margin-pool/);
  assert.match(cross, /Cross pool/);
  assert.match(cross, /cross-balance/);
  assert.match(cross, /wallet pool/);
  assert.throws(() => widget({ type: "margin", mode: "portfolio" }), /Invalid margin mode/);
  assert.doesNotMatch(`${isolated}${cross}`, /\$[0-9]|10000|0\.05/);
});

test("candlestick chart validates numeric OHLC and preserves the exact supplied values", () => {
  const html = widget({
    type: "candlestick-chart",
    ohlc: [
      { open: 10, high: 14, low: 8, close: 12 },
      { open: 12.5, high: 13, low: 9, close: 9.5 },
    ],
  });
  assert.match(html, /class="chart"/);
  assert.match(html, /candle-up/);
  assert.match(html, /candle-down/);
  assert.match(html, /data-o="10" data-h="14" data-l="8" data-c="12"/);
  assert.match(html, /data-o="12.5" data-h="13" data-l="9" data-c="9.5"/);
  assert.match(html, /Open/);
  const annotated = widget({ type: "candlestick-chart", annotate: true, ohlc: [{ open: 50000, high: 51000, low: 49000, close: 50500 }] });
  for (const label of ["High 51,000", "Close 50,500", "Open 50,000", "Low 49,000"]) assert.match(annotated, new RegExp(label));
  assert.match(html, /High/);
  assert.match(html, /Low/);
  assert.match(html, /Close/);
  assert.throws(() => widget({ type: "candlestick-chart", ohlc: [{ open: 1, high: 0, low: 1, close: 1 }] }), /Invalid candle high/);
  assert.throws(() => widget({ type: "candlestick-chart", ohlc: [{ open: 1, high: 2, low: "x", close: 1 }] }), /Invalid candle low/);
  assert.throws(() => widget({ type: "candlestick-chart", ohlc: [] }), /Invalid candles: empty/);
});

test("risk meter validates its numeric domain", () => {
  const html = widget({ type: "risk-meter", level: 42 });
  assert.match(html, /data-level="42"/);
  assert.match(html, /risk-meter-fill/);
  assert.match(html, /meter-bar/);
  assert.match(html, /width:42%/);
  assert.throws(() => widget({ type: "risk-meter", level: -1 }), /Invalid risk level/);
  assert.throws(() => widget({ type: "risk-meter", level: 101 }), /Invalid risk level/);
  assert.throws(() => widget({ type: "risk-meter", level: "high" }), /Invalid risk level/);
});

test("locale labels switch between English and Simplified Chinese", () => {
  assert.match(widget({ type: "balance-ledger", rows: [{ asset: "USDC", available: "a", locked: "l" }] }, "en"), /Balance ledger/);
  assert.match(widget({ type: "balance-ledger", rows: [{ asset: "USDC", available: "a", locked: "l" }] }, "zh-Hans"), /余额账本/);
  assert.match(widget({ type: "order-ticket", orderType: "market" }, "zh-Hans"), /市价/);
});

test("setBackdrop returns reusable set SVGs without id attributes", () => {
  for (const [name, label] of [["study-desk", "Study desk"], ["trading-desk", "Trading desk"], ["transfer-station", "Transfer station"]]) {
    const html = setBackdrop(name);
    assert.match(html, new RegExp(`set-${name}`));
    assert.match(html, new RegExp(`aria-label="${label}"`));
    assert.doesNotMatch(html, /\sid=/);
  }
  assert.match(setBackdrop("study-desk", "zh-Hans"), /学习桌/);
});

test("season 1 widgets render supplied props only, with staged reveal hooks and no form controls", () => {
  const html = [
    widget({ type: "formula", rows: [{ expr: "100 ÷ 50,000", result: "0.002 BTC", emphasis: true }, { expr: "Fee" }], note: "Before withdrawal fees" }),
    widget({ type: "cards", items: [{ label: "Minimum order", mark: "warn" }, { label: "Virtual funds", value: "1,000", mark: "ok" }], separator: "≠" }),
    widget({ type: "flow", steps: ["Requested", { label: "Processing", note: "official route" }, { label: "Arrived", state: "ok" }] }),
    widget({ type: "compare", left: { title: "Market", rows: ["Fill first"] }, right: { title: "Limit", rows: ["May not fill"] } }),
    widget({ type: "order-book", levels: [{ price: "50,000", size: "0.001", fill: true }, { price: "50,100", size: "0.001" }], average: "50,050" }),
    widget({ type: "buffer-gauge", from: 80, to: 30, line: 25, fillLabel: "Equity", lineLabel: "Maintenance requirement" }),
    widget({ type: "order-ticket", orderType: "market", side: "Buy", amount: "100 USDT" }),
  ].join("");
  for (const value of ["0.002 BTC", "formula-row--em", "Before withdrawal fees", "teach-card--warn", "≠", "Processing", "official route", "flow-step--ok", "compare-side--right", "May not fill", "book-level--fill", "Average", "50,050", 'data-from="80"', 'data-to="30"', "Maintenance requirement", "Amount", "100 USDT"]) {
    assert.ok(html.includes(value), value);
  }
  assert.ok((html.match(/class="[^"]*\breveal\b/g) ?? []).length >= 10);
  assert.doesNotMatch(html, /<(?:input|button|select|textarea|form)\b/i);
  assert.throws(() => widget({ type: "cards", items: [] }), /Invalid cards/);
  assert.throws(() => widget({ type: "flow", steps: ["only one"] }), /Invalid flow/);
  assert.throws(() => widget({ type: "compare", left: { title: "A" } }), /Invalid compare/);
  assert.throws(() => widget({ type: "order-book", levels: [] }), /Invalid order book/);
  assert.throws(() => widget({ type: "buffer-gauge", from: 120, line: 10 }), /Invalid gauge start/);
  assert.throws(() => widget({ type: "cards", items: [{ label: "x", mark: "maybe" }] }), /Invalid mark/);
});

test("quiz marks the correct options and stamps the verdict", () => {
  const html = widget({ type: "quiz", question: "Can you send?", options: [{ label: "Tx hash", correct: true }, { label: "Recovery phrase", correct: false }], verdict: "NO" });
  assert.match(html, /quiz-question">Can you send\?/);
  assert.match(html, /data-correct="true"[^]*Tx hash/);
  assert.match(html, /data-correct="false"[^]*Recovery phrase/);
  assert.match(html, /quiz-verdict quiz-verdict--no">NO/);
  assert.match(widget({ type: "quiz", question: "400 × 5%?", verdict: "20", tone: "ok" }), /quiz-verdict--ok/);
  assert.throws(() => widget({ type: "quiz" }), /question required/);
});

test("id-samples and margin-flow add no caveat caption when no note is supplied", () => {
  assert.doesNotMatch(widget({ type: "id-samples", labels: ["Glare"] }), /<small>/);
  assert.doesNotMatch(widget({ type: "margin-flow", balance: 900, margin: 100, autoAdd: false, label: "Box" }), /<small>/);
});
