import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { rpcFixture, payloadTotals } from "../tests/fixtures/whales-source/rpc.mjs";

// Optional module argument allows comparison with a local pre-edit snapshot.
const args = process.argv.slice(2);
const live = args.includes("--live");
const modulePath = args.find(arg => arg !== "--live") || "server/position-radar.mjs";
const { POSITION_RADAR_WHALE_SOURCES, EXCHANGE_ADDRESS_LABELS } = await import(pathToFileURL(resolve(modulePath)));
if (live) {
  const totals = { calls: 0, requestBytes: 0, responseBytes: 0 };
  const fetchImpl = async (url, init) => {
    totals.calls += 1;
    totals.requestBytes += Buffer.byteLength(init.body);
    const response = await fetch(url, init);
    const raw = await response.text();
    totals.responseBytes += Buffer.byteLength(raw);
    return { ok: response.ok, status: response.status, json: async () => JSON.parse(raw) };
  };
  try {
    const rows = await POSITION_RADAR_WHALE_SOURCES.ethereumRpc(fetchImpl);
    console.log(JSON.stringify({ measurement: "live cold scan; decoded HTTP body bytes, excludes headers/compression", ...totals, rows: rows.length, assets: [...new Set(rows.map(row => row.asset))] }, null, 2));
  } catch (error) {
    console.log(JSON.stringify({ ...totals, error: error.message }));
    process.exitCode = 1;
  }
} else {
  const address = Object.keys(EXCHANGE_ADDRESS_LABELS.ethereum)[0];
  const fixture = rpcFixture(address);
  const state = {};
  const results = {};
  for (const [name, head] of [["cold", 1000], ["warm", 1005], ["unchangedHead", 1005]]) {
    fixture.setHead(head);
    fixture.calls.length = 0;
    const rows = await POSITION_RADAR_WHALE_SOURCES.ethereumRpc(fixture.fetchImpl, { state });
    results[name] = { ...payloadTotals(fixture.calls), rows: rows.length };
  }
  console.log(JSON.stringify({ measurement: "fixture UTF-8 JSON payloads; excludes HTTP headers/compression", results }, null, 2));
}
