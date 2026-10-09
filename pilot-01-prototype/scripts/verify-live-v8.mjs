// Post-release check for the v8 milestone (docs/company/ITERATION-v8.md item 23).
// Usage: node scripts/verify-live-v8.mjs [https://nexualpha.com] [expectedBuildIdPrefix]
// Read-only: GETs public pages and reports buildId, route status, invite codes and v8 markers.
const site = (process.argv[2] || "https://nexualpha.com").replace(/\/$/, "");
const expected = process.argv[3] || "";
const UA = { "user-agent": "Mozilla/5.0 nexualpha-v8-live-check" };

const routes = ["/", "/zh-hans", "/exchanges", "/zh-hans/exchanges", "/exchanges/okx", "/exchanges/binance", "/exchanges/bitget",
  "/compare/binance-vs-okx", "/rates", "/news", "/activities", "/telegram", "/intel/official-announcements.json"];
const codes = ["ref=11350287", "C6PRAF", "nexu888"];

let failed = 0;
const fail = (msg) => { failed += 1; console.log(`FAIL ${msg}`); };
// Pages are fetched without query strings: the server only serves prerendered HTML for the bare path.
const get = async (path, bust = false) => {
  const res = await fetch(`${site}${path}${bust ? `?v8check=${Date.now()}` : ""}`, { headers: { ...UA, "cache-control": "no-cache" }, redirect: "follow" });
  return { status: res.status, body: await res.text() };
};

const version = JSON.parse((await get("/version.json", true)).body);
console.log(`buildId ${version.buildId}`);
if (expected && !String(version.buildId).startsWith(expected)) fail(`buildId does not start with ${expected}`);

const pages = {};
for (const path of routes) {
  const { status, body } = await get(path);
  pages[path] = body;
  console.log(`${status} ${path}`);
  if (status !== 200) fail(`${path} returned ${status}`);
}

const all = Object.values(pages).join("\n");
for (const code of codes) if (!all.includes(code)) fail(`invite code ${code} not found on checked pages`);

const home = pages["/zh-hans"];
if (!home.includes('class="h7"')) fail("home v7/v8 block (.h7) missing from SSR");
if (!home.includes("h7-desk")) fail("home notice desk (.h7-desk) missing from SSR");
if (home.includes("mobile-bottom-nav")) fail("mobile bottom dock still rendered on home");
if (!/data-disclosure-placement="directory-matrix"/.test(pages["/zh-hans/exchanges"])) fail("directory commission disclosure missing");

const feed = JSON.parse(pages["/intel/official-announcements.json"]);
console.log(`notices ${feed.items?.length ?? 0} generatedAt ${feed.generatedAt}`);
if (!feed.items?.length) fail("official notice feed is empty");

console.log(failed ? `\n${failed} check(s) failed` : "\nall live checks passed");
process.exit(failed ? 1 : 0);
