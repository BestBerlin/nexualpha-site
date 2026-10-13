import test from "node:test";
import assert from "node:assert/strict";
import {
  EXCHANGE_ADDRESS_LABELS,
  POSITION_RADAR_LONG_SHORT_SOURCES,
  POSITION_RADAR_SOURCE_LIMITATIONS,
  POSITION_RADAR_WHALE_SOURCES,
  createPositionRadar,
} from "../server/position-radar.mjs";

const NOW = Date.UTC(2026, 9, 13, 1, 0, 0);

test("default long-short source normalizes official Binance, OKX and Bybit shapes without mixing venue units", async () => {
  const payloads = new Map([
    ["globalLongShortAccountRatio", [{ timestamp: "1791763200000", longShortRatio: "1.10" }, { timestamp: "1791849600000", longShortRatio: "1.20" }]],
    ["topLongShortPositionRatio", [{ timestamp: "1791763200000", longShortRatio: "0.90" }, { timestamp: "1791849600000", longShortRatio: "0.80" }]],
    ["openInterestHist", [{ timestamp: "1791763200000", sumOpenInterestValue: "100" }, { timestamp: "1791849600000", sumOpenInterestValue: "125" }]],
    ["long-short-account-ratio", { data: [["1791849600000", "1.50"], ["1791763200000", "1.25"]] }],
    ["open-interest-volume", { data: [["1791849600000", "250", "999"], ["1791763200000", "200", "888"]] }],
    ["account-ratio", { result: { list: [{ timestamp: "1791849600000", buyRatio: "0.6", sellRatio: "0.4" }, { timestamp: "1791763200000", buyRatio: "0.5", sellRatio: "0.5" }] } }],
    ["open-interest", { result: { list: [{ timestamp: "1791849600000", openInterest: "22" }, { timestamp: "1791763200000", openInterest: "20" }] } }],
  ]);
  const fetchImpl = async (url) => {
    const key = [...payloads.keys()].find((part) => url.includes(part));
    assert.ok(key, `expected fixture for ${url}`);
    return { ok: true, json: async () => payloads.get(key) };
  };

  const binance = await POSITION_RADAR_LONG_SHORT_SOURCES.binance.symbol(fetchImpl, "BTC");
  assert.equal(binance.accountLongShortRatio, 1.2);
  assert.equal(binance.topTraderLongShortRatio, 0.8);
  assert.equal(binance.openInterest, 125);
  assert.equal(binance.openInterestUsd, 125);
  assert.equal(binance.openInterestUnit, "USD");
  assert.equal(binance.openInterestChange24hPct, 25);
  assert.deepEqual(binance.sparkline24h, [100, 125]);

  const okx = await POSITION_RADAR_LONG_SHORT_SOURCES.okx.symbol(fetchImpl, "BTC");
  assert.equal(okx.accountLongShortRatio, 1.5);
  assert.equal(okx.openInterest, 250);
  assert.equal(okx.openInterestUsd, 250);
  assert.equal(okx.openInterestUnit, "USD");
  assert.equal(okx.openInterestChange24hPct, 25);

  const bybit = await POSITION_RADAR_LONG_SHORT_SOURCES.bybit.symbol(fetchImpl, "BTC");
  assert.ok(Math.abs(bybit.accountLongShortRatio - 1.5) < 1e-12, "Bybit buyRatio/sellRatio becomes long/short ratio");
  assert.equal(bybit.openInterest, 22);
  assert.equal(bybit.openInterestUnit, "BTC");
  assert.equal(bybit.openInterestChange24hPct, 10);
});

test("long-short reader returns flat rows with a reference venue and an explicit unavailable status", async () => {
  let topCalls = 0;
  const radar = createPositionRadar({
    now: () => NOW,
    limit: 2,
    longShortSources: {
      binance: {
        topSymbols: async () => {
          topCalls += 1;
          return [
            { symbol: "ETH", marketSymbol: "ETHUSDT", turnoverUsd: 900 },
            { symbol: "BTC", marketSymbol: "BTCUSDT", turnoverUsd: 700 },
            { symbol: "DOGE", marketSymbol: "DOGEUSDT", turnoverUsd: 100 },
          ];
        },
        symbol: async (fetchImpl, symbol) => ({
          venue: "binance",
          accountLongShortRatio: symbol === "ETH" ? 1.25 : 0.92,
          topTraderLongShortRatio: symbol === "ETH" ? 0.8 : 1.1,
          openInterest: symbol === "ETH" ? 120 : 80,
          openInterestUnit: "USDT",
          openInterestChange24hPct: symbol === "ETH" ? 20 : -10,
          sparkline24h: symbol === "ETH" ? [100, 110, 120] : [90, 85, 80],
          status: "ok",
        }),
      },
      okx: {
        symbol: async (fetchImpl, symbol) => ({
          venue: "okx",
          accountLongShortRatio: symbol === "ETH" ? null : 1.2,
          topTraderLongShortRatio: null,
          openInterest: symbol === "ETH" ? null : 100,
          openInterestUnit: "contracts-or-ccy",
          openInterestChange24hPct: null,
          sparkline24h: [],
          status: symbol === "ETH" ? "unavailable" : "ok",
        }),
      },
    },
  });

  const feed = await radar.read("long-short");
  assert.equal(feed.kind, "long-short");
  assert.equal(feed.status, "ok");
  assert.equal(feed.updatedAt, "2026-10-13T01:00:00.000Z");
  assert.equal(feed.ttlSeconds, 60);
  assert.deepEqual(feed.symbols.map((row) => row.symbol), ["ETH", "BTC"]);
  assert.equal(feed.rows.length, 4, "rows are flattened per venue for the page table");
  assert.equal(feed.symbols[0].referenceVenue, "binance");
  assert.equal(feed.rows[0].accountLongShortRatio, 1.25);
  assert.equal(feed.rows[0].openInterest, 120);
  assert.equal(feed.rows[0].openInterestUnit, "USDT");
  assert.deepEqual(feed.rows[0].sparkline24h, [100, 110, 120]);
  assert.equal(feed.rows.find((row) => row.symbol === "ETH" && row.venue === "okx").status, "unavailable");
  assert.ok(feed.limitations.includes(POSITION_RADAR_SOURCE_LIMITATIONS["long-short"][1]));

  const cached = await radar.read("long-short");
  assert.equal(cached, feed);
  assert.equal(topCalls, 1, "cache stays warm inside the <=60s TTL");

  const unavailable = await createPositionRadar({ now: () => NOW, longShortSources: { okx: { symbol: async () => ({ venue: "okx" }) } } }).read("long-short");
  assert.equal(unavailable.status, "unavailable");
  assert.deepEqual(unavailable.rows, []);
});

test("long-short cache is capped at sixty seconds even when a larger ttl is passed", async () => {
  let now = NOW;
  let topCalls = 0;
  const radar = createPositionRadar({
    now: () => now,
    ttlMs: 5 * 60_000,
    limit: 1,
    longShortSources: {
      binance: {
        topSymbols: async () => {
          topCalls += 1;
          return [{ symbol: "BTC", marketSymbol: "BTCUSDT", turnoverUsd: 1 }];
        },
        symbol: async () => ({
          venue: "binance",
          accountLongShortRatio: topCalls,
          topTraderLongShortRatio: null,
          openInterest: null,
          openInterestUnit: null,
          openInterestChange24hPct: null,
          sparkline24h: [],
          status: "ok",
        }),
      },
    },
  });
  assert.equal((await radar.read("long-short")).rows[0].accountLongShortRatio, 1);
  now += 59_000;
  assert.equal((await radar.read("long-short")).rows[0].accountLongShortRatio, 1);
  now += 2_000;
  assert.equal((await radar.read("long-short")).rows[0].accountLongShortRatio, 2);
  assert.equal(topCalls, 2);
});

test("whale reader emits output-level BTC rows and never guesses labels or sale intent", async () => {
  assert.ok(!EXCHANGE_ADDRESS_LABELS.btc.bc1qinputa && !EXCHANGE_ADDRESS_LABELS.btc.bc1qlarge, "fixture addresses are unlabelled");
  const radar = createPositionRadar({
    now: () => NOW,
    minBtc: 10,
    minEth: 250,
    minUsd: 1_000_000,
    whaleSources: {
      btcMempool: async () => [
        {
          txid: "btc-tx",
          status: { block_time: 1791853200 },
          vin: [{ prevout: { scriptpubkey_address: "bc1qinputa" } }, { prevout: { scriptpubkey_address: "bc1qinputb" } }],
          vout: [
            { scriptpubkey_address: "bc1qlarge", value: 60 * 100_000_000 },
            { scriptpubkey_address: "bc1qsmall", value: 2 * 100_000_000 },
          ],
        },
      ],
      ethereumNative: async () => ({ data: [{ hash: "eth-tx", asset: "ETH", value: 300, from: "0x1", to: "0x2", timestamp: 1791853300 }] }),
      ethereumUsdt: async () => ({ data: [{ transaction_hash: "usdt-tx", token_symbol: "USDT", rawValue: 2_500_000_000000, decimals: 6, from: "0x3", to: "0x4", time: 1791853400 }] }),
      ethereumUsdc: async () => ({ data: [] }),
    },
  });

  const feed = await radar.read("whales");
  assert.equal(feed.kind, "whales");
  assert.equal(feed.status, "ok");
  assert.equal(feed.updatedAt, "2026-10-13T01:00:00.000Z");
  assert.ok(feed.labelSources.includes("https://www.binance.com/en/proof-of-reserves"));
  assert.ok(feed.labelSources.includes("https://www.okx.com/proof-of-reserves/download"));
  assert.ok(feed.labelSources.includes("https://www.bybit.com/app/user/proof-of-reserve"));
  assert.ok(feed.limitations.some((line) => line.includes("not evidence of a sale")));
  assert.deepEqual(feed.rows.map((row) => row.txid), ["usdt-tx", "eth-tx", "btc-tx"]);

  const btc = feed.rows.find((row) => row.txid === "btc-tx");
  assert.equal(btc.amount, 60, "BTC row is the large output, not the total transaction outputs");
  assert.equal(btc.amountUsd, null, "BTC USD is not invented without an injected price");
  assert.equal(btc.from.label, "unknown", "multiple BTC inputs keep the sender unknown");
  assert.equal(btc.to.label, "unknown");
  assert.equal(btc.direction, "unknown");
  assert.equal(btc.ownerRule, "transfer to an exchange is not a sale");

  const usdt = feed.rows.find((row) => row.txid === "usdt-tx");
  assert.equal(usdt.asset, "USDT");
  assert.equal(usdt.amount, 2_500_000);
  assert.equal(usdt.amountUsd, null, "stablecoin face amount is not a verified live USD price");
  assert.equal(usdt.direction, "unknown", "unknown-to-unknown is not labelled wallet-to-wallet");

  const eth = feed.rows.find((row) => row.txid === "eth-tx");
  assert.equal(eth.asset, "ETH");
  assert.equal(eth.amountUsd, null);
  assert.equal(eth.direction, "unknown");
});

test("default Ethereum whale source reads bounded keyless RPC blocks and token logs", async () => {
  const block = {
    timestamp: "0x6ac0fc74",
    transactions: [
      { hash: "eth-native", from: "0x1111111111111111111111111111111111111111", to: "0x2222222222222222222222222222222222222222", value: "0x1158e460913d00000" },
    ],
  };
  const log = {
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    transactionHash: "usdc-log",
    blockNumber: "0x64",
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000003333333333333333333333333333333333333333",
      "0x0000000000000000000000004444444444444444444444444444444444444444",
    ],
    data: "0x2540be400",
  };
  const calls = [];
  const fetchImpl = async (url, init) => {
    assert.equal(url, "https://ethereum-rpc.publicnode.com");
    const body = JSON.parse(init.body);
    calls.push(body.method);
    if (body.method === "eth_blockNumber") return { ok: true, json: async () => ({ result: "0x64" }) };
    if (body.method === "eth_getBlockByNumber") return { ok: true, json: async () => ({ result: block }) };
    if (body.method === "eth_getTransactionReceipt") return { ok: true, json: async () => ({ result: { status: "0x1" } }) };
    if (body.method === "eth_getLogs") return { ok: true, json: async () => ({ result: body.params[0].address.includes(log.address) ? [log] : [] }) };
    throw new Error(body.method);
  };
  const feed = await createPositionRadar({ now: () => NOW, fetchImpl, minEth: 20, minUsd: 1_000 }).read("whales");
  assert.equal(feed.status, "ok");
  assert.ok(calls.includes("eth_getLogs"));
  assert.ok(feed.rows.some((row) => row.txid === "eth-native" && row.asset === "ETH" && row.amount === 20));
  assert.ok(feed.rows.some((row) => row.txid === "usdc-log" && row.asset === "USDC" && row.amount === 10_000_000_000 / 1_000_000));
});

test("whale reader returns an explicit unavailable snapshot when every source is unavailable or below threshold", async () => {
  const radar = createPositionRadar({
    now: () => NOW,
    minBtc: 100,
    minUsd: 5_000_000,
    whaleSources: {
      btcMempool: async () => [{ txid: "small", vout: [{ scriptpubkey_address: "bc1qsmall", value: 2 * 100_000_000 }] }],
      ethereumNative: async () => { throw new Error("rate limited"); },
    },
  });
  const feed = await radar.read("whales");
  assert.equal(feed.status, "unavailable");
  assert.deepEqual(feed.rows, []);
  assert.match(feed.reason, /rate limited|no-large-transfers/);
});

test("unknown radar kinds fail closed", async () => {
  const radar = createPositionRadar({ now: () => NOW });
  await assert.rejects(() => radar.read("positions"), /unknown radar kind/);
});


test("sourced exchange labels describe direction without implying a sale", async () => {
  const address = Object.keys(EXCHANGE_ADDRESS_LABELS.ethereum)[0];
  const radar = createPositionRadar({ now: () => NOW, whaleSources: {
    ethereumNative: async () => [{ asset: "ETH", hash: "labeled", value: 300, from: "0xunknown", to: address, timestamp: 1791853200 }],
  } });
  const snapshot = await radar.read("whales");
  assert.equal(snapshot.rows[0].to.label, EXCHANGE_ADDRESS_LABELS.ethereum[address].label);
  assert.match(snapshot.rows[0].to.source, /^https:\/\//);
  assert.equal(snapshot.rows[0].direction, "to-exchange");
  assert.match(snapshot.rows[0].ownerRule, /not a sale/);
});

test('selection falls back to a public turnover source when Binance access fails', async () => {
  let deniedRequests = 0;
  const radar = createPositionRadar({ longShortSources: {
    binance: { topSymbols: async () => { throw new Error('HTTP 418'); }, symbol: async () => { deniedRequests += 1; throw new Error('HTTP 418'); } },
    bybit: { topSymbols: async () => [{ symbol: 'BTC', turnoverUsd: 500 }], symbol: async () => ({ venue: 'bybit', status: 'ok', accountLongShortRatio: 1.5, openInterest: 30, openInterestUnit: 'BTC' }) },
  } });
  const feed = await radar.read('long-short');
  assert.equal(feed.selectionVenue, 'bybit');
  assert.equal(deniedRequests, 0, 'do not hammer a denied venue for every symbol');
  assert.equal(feed.symbols.length, 1);
  assert.equal(feed.rows.find(row => row.venue === 'bybit').openInterestUnit, 'BTC');
  assert.equal(feed.rows.find(row => row.venue === 'binance').accountLongShortRatio, null);
});

test("exchange label list carries one official source per well-formed address", async () => {
  const { EXCHANGE_ADDRESS_LABEL_ROWS } = await import("../server/exchange-address-labels.mjs");
  assert.ok(EXCHANGE_ADDRESS_LABEL_ROWS.ethereum.length >= 100);
  const owners = new Set();
  for (const entry of EXCHANGE_ADDRESS_LABEL_ROWS.ethereum) {
    assert.match(entry.address, /^0x[0-9a-f]{40}$/);
    assert.match(entry.source, /^https:\/\//);
    owners.add(entry.owner);
  }
  for (const owner of ["binance", "okx", "bybit"]) assert.ok(owners.has(owner), owner);
  for (const entry of EXCHANGE_ADDRESS_LABEL_ROWS.btc) assert.match(entry.address, /^(bc1|[13])[0-9A-Za-z]{20,}$/);
  const all = [...EXCHANGE_ADDRESS_LABEL_ROWS.ethereum, ...EXCHANGE_ADDRESS_LABEL_ROWS.btc].map((e) => e.address);
  assert.equal(new Set(all).size, all.length, "no address is labelled twice");
});

test("Ethereum source scans incrementally after the first refresh and keeps a rolling window", async () => {
  let head = 1000;
  const ranges = [];
  const fetchImpl = async (_url, init) => {
    const body = JSON.parse(init.body);
    const ok = (result) => ({ ok: true, json: async () => ({ result }) });
    if (body.method === "eth_blockNumber") return ok(`0x${head.toString(16)}`);
    if (body.method === "eth_getBlockByNumber") return ok({ timestamp: "0x6ac0fc74", transactions: [] });
    if (body.method === "eth_getLogs") {
      const { fromBlock, toBlock, topics } = body.params[0];
      if (topics.length === 1) ranges.push([parseInt(fromBlock, 16), parseInt(toBlock, 16)]);
      if (topics.length === 1 && body.params[0].address.includes("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")) {
        return ok([{ address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", transactionHash: `tx-${toBlock}`, logIndex: "0x1", blockNumber: toBlock, topics: [topics[0], `0x${"0".repeat(64)}`, `0x${"0".repeat(64)}`], data: "0xe8d4a51000" }]);
      }
      return ok([]);
    }
    throw new Error(body.method);
  };
  let clock = NOW;
  const radar = createPositionRadar({ now: () => clock, fetchImpl, whaleSources: { ethereumRpc: POSITION_RADAR_WHALE_SOURCES.ethereumRpc } });
  const first = await radar.refresh("whales");
  const firstCount = first.rows.length;
  assert.ok(firstCount >= 1);
  assert.equal(Math.min(...ranges.map(([from]) => from)), 998 - 50, "cold start reads the bounded log lookback");
  ranges.length = 0;
  head = 1005;
  clock += 61_000;
  const second = await radar.refresh("whales");
  assert.deepEqual(ranges.map(([from, to]) => [from, to]).slice(0, 1), [[999, 1003]], "warm refresh reads only new blocks");
  assert.equal(second.rows.length, firstCount + 1, "rows from the previous refresh are kept");
  clock += 4 * 60 * 60 * 1000;
  head = 1010;
  const third = await radar.refresh("whales");
  assert.equal(third.rows.length, 1, "rows first seen more than 3h ago drop out");
});
