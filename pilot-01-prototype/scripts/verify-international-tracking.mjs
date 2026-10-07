import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
const puppeteer = require("puppeteer-core");

const base = process.env.TRACKING_URL || "http://127.0.0.1:4200";
const outFile = path.resolve(process.env.TRACKING_OUT || "artifacts/international-cta/tracking/results.json");
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const records = [];
const failures = [];

function scrubEvent(payload) {
  return {
    type: payload.type,
    page: payload.page,
    locale: payload.locale,
    source: payload.source,
    market: payload.market,
    product: payload.product,
    platform: payload.platform,
    decision: payload.decision,
    placement: payload.placement,
    campaign: payload.campaign,
    publisher: payload.publisher,
    eventIdShape: /^[0-9a-f-]{36}$/i.test(payload.eventId || ""),
    sessionShape: /^[0-9a-f-]{36}$/i.test(payload.session || ""),
  };
}

function containsPrivateData(value) {
  const text = JSON.stringify(value);
  return /@|email|uid|token|secret|gclid=|msclkid=|fbclid=|do-not-keep/i.test(text);
}

function sameOrigin(url) {
  return new URL(url).origin === new URL(base).origin;
}

async function hardenPage(page, { dnt = false, gpc = false } = {}) {
  await page.setUserAgent(userAgent);
  await page.evaluateOnNewDocument(({ dnt, gpc }) => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "doNotTrack", { get: () => (dnt ? "1" : "0") });
    Object.defineProperty(window, "doNotTrack", { get: () => (dnt ? "1" : "0") });
    Object.defineProperty(navigator, "globalPrivacyControl", { get: () => Boolean(gpc) });
  }, { dnt, gpc });
}

async function interceptPage(page, bucket) {
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    const url = request.url();
    if (url === new URL("/api/analytics/cta", base).href) {
      try {
        const payload = JSON.parse(request.postData() || "{}");
        bucket.push(payload);
        await request.respond({ status: 204, body: "" });
      } catch (error) {
        bucket.push({ parseError: String(error), raw: request.postData() });
        await request.respond({ status: 400, body: "" });
      }
      return;
    }
    if (sameOrigin(url) || url.startsWith("data:") || url.startsWith("blob:")) {
      await request.continue();
      return;
    }
    await request.abort("blockedbyclient");
  });
}

async function newQaPage(browser, bucket, options = {}) {
  const page = await browser.newPage();
  await hardenPage(page, options);
  await interceptPage(page, bucket);
  page.on("popup", async (popup) => {
    await popup.close().catch(() => {});
  });
  return page;
}

async function waitForEvents(bucket, count, label) {
  const start = Date.now();
  while (Date.now() - start < 2500) {
    if (bucket.length >= count) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(bucket.length, count, label);
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 350));
}

function assertNoPrivateEventData(events, label) {
  assert.equal(events.some(containsPrivateData), false, `${label}: event leaked private/raw tracking data`);
}

function assertSafeCurrentUrl(url, label) {
  assert.equal(/email=|uid=|token=|secret=|gclid=|msclkid=|fbclid=|do-not-keep/i.test(url), false, `${label}: URL kept private/raw tracking data`);
}

function summarize(name, events, extra = {}) {
  records.push({
    name,
    eventCount: events.length,
    events: events.map(scrubEvent),
    ...extra,
  });
}

async function runScenario(name, fn) {
  try {
    await fn();
  } catch (error) {
    failures.push({ name, message: error.message, stack: error.stack });
  }
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-first-run", "--disable-features=AutomationControlled"],
});

browser.on("targetcreated", async (target) => {
  const url = target.url();
  if (url && !sameOrigin(url) && !url.startsWith("about:")) {
    const page = await target.page().catch(() => null);
    await page?.close().catch(() => {});
  }
});

try {
  await runScenario("utm_only_brazil_page_view_survives_hydration", async () => {
    const events = [];
    const page = await newQaPage(browser, events);
    await page.goto(`${base}/br?utm_source=creator&utm_campaign=br-pilot&publisher=creator_1&email=do-not-keep@example.com&gclid=raw-click`, { waitUntil: "networkidle2" });
    await waitForEvents(events, 1, "expected one initial page_view");
    assert.deepEqual(scrubEvent(events[0]), {
      type: "page_view",
      page: "/br",
      locale: "pt-BR",
      source: "creator",
      market: "BR",
      product: "spot",
      platform: undefined,
      decision: undefined,
      placement: undefined,
      campaign: "br-pilot",
      publisher: "creator_1",
      eventIdShape: true,
      sessionShape: true,
    });
    assertSafeCurrentUrl(page.url(), "utm_only_brazil_page_view_survives_hydration");
    assert.equal(page.url().includes("publisher=creator_1"), true, "publisher should remain in shareable state");
    assertNoPrivateEventData(events, "utm_only_brazil_page_view_survives_hydration");
    summarize("utm_only_brazil_page_view_survives_hydration", events, { currentUrl: page.url() });
    await page.close();
  });

  await runScenario("market_change_records_decision_and_new_denominator", async () => {
    const events = [];
    const page = await newQaPage(browser, events);
    await page.goto(`${base}/br?utm_source=creator&utm_campaign=br-pilot&publisher=creator_1`, { waitUntil: "networkidle2" });
    await waitForEvents(events, 1, "expected initial BR page_view");
    await page.select('[data-testid="brazil-region"]', "ID");
    await waitForEvents(events, 3, "expected ID page_view denominator and decision_select");
    const newEvents = events.slice(1);
    assert.deepEqual(newEvents.map((event) => `${event.type}:${event.market}:${event.product}:${event.decision || ""}`), [
      "page_view:ID:spot:",
      "decision_select:ID:spot:brazil_market_change",
    ]);
    assert.equal(newEvents[1].placement, "br-home");
    assertNoPrivateEventData(events, "market_change_records_decision_and_new_denominator");
    summarize("market_change_records_decision_and_new_denominator", events, { currentUrl: page.url() });
    await page.close();
  });

  await runScenario("okx_unverified_selection_stays_research_and_emits_no_referral", async () => {
    const events = [];
    const page = await newQaPage(browser, events);
    await page.goto(`${base}/br?market=BR&product=spot&utm_source=creator&utm_campaign=br-pilot&publisher=creator_1`, { waitUntil: "networkidle2" });
    await waitForEvents(events, 1, "expected initial BR page_view");
    await page.select('[data-testid="brazil-platform"]', "okx");
    await waitForEvents(events, 2, "expected select_okx decision");
    assert.equal(events[1].type, "decision_select");
    assert.equal(events[1].decision, "select_okx");
    assert.equal(events[1].market, "BR");
    assert.equal(events[1].product, "spot");
    const primary = await page.$eval('[data-cta-placement="brazil-br-home-primary-research"]', (anchor) => ({
      href: anchor.href,
      kind: anchor.dataset.ctaKind,
      status: anchor.dataset.ctaStatus,
    }));
    assert.equal(primary.kind, "research");
    assert.equal(primary.href.includes("/exchanges/okx"), true);
    assert.equal(primary.href.includes("market=BR"), true);
    assert.equal(primary.href.includes("product=spot"), true);
    await page.click('[data-cta-placement="brazil-br-home-primary-research"]');
    await settle();
    const referralClicks = events.filter((event) => event.type === "referral_click");
    assert.equal(referralClicks.length, 0, "unverified research handoff must not emit a referral click");
    assertNoPrivateEventData(events, "okx_unverified_selection_stays_research_and_emits_no_referral");
    summarize("okx_unverified_selection_stays_research_and_emits_no_referral", events, { clickedHref: primary.href, currentUrl: page.url(), ctaStatus: primary.status });
    await page.close();
  });

  await runScenario("homepage_market_query_preserves_market_attribution", async () => {
    const events = [];
    const page = await newQaPage(browser, events);
    await page.goto(`${base}/?market=BR&product=spot&utm_source=creator&utm_campaign=br-home&publisher=creator_1`, { waitUntil: "networkidle2" });
    await waitForEvents(events, 1, "expected homepage page_view");
    assert.equal(events[0].type, "page_view");
    assert.equal(events[0].market, "BR");
    assert.equal(events[0].product, "spot");
    assert.equal(events[0].campaign, "br-home");
    assertNoPrivateEventData(events, "homepage_market_query_preserves_market_attribution");
    summarize("homepage_market_query_preserves_market_attribution", events, { currentUrl: page.url() });
    await page.close();
  });

  await runScenario("dnt_and_gpc_suppress_tracking", async () => {
    for (const flag of [{ dnt: true }, { gpc: true }]) {
      const events = [];
      const page = await newQaPage(browser, events, flag);
      await page.goto(`${base}/br?utm_source=creator&utm_campaign=br-pilot&publisher=creator_1`, { waitUntil: "networkidle2" });
      await settle();
      assert.equal(events.length, 0, `${flag.dnt ? "DNT" : "GPC"} should suppress initial page_view`);
      await page.select('[data-testid="brazil-platform"]', "okx");
      await settle();
      assert.equal(events.length, 0, `${flag.dnt ? "DNT" : "GPC"} should suppress decisions`);
      summarize(`dnt_and_gpc_suppress_tracking_${flag.dnt ? "dnt" : "gpc"}`, events);
      await page.close();
    }
  });

  await runScenario("analytics_test_suppresses_tracking_from_initial_page", async () => {
    const events = [];
    const page = await newQaPage(browser, events);
    await page.goto(`${base}/br?analytics_test=1&utm_source=creator&utm_campaign=br-pilot&publisher=creator_1`, { waitUntil: "networkidle2" });
    await settle();
    assert.equal(events.length, 0, "analytics_test should suppress initial page_view");
    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("analytics_test");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    });
    await page.select('[data-testid="brazil-platform"]', "okx");
    await settle();
    assert.equal(events.length, 0, "analytics_test should keep the installed page suppressed after URL mutation");
    summarize("analytics_test_suppresses_tracking_from_initial_page", events, { currentUrl: page.url() });
    await page.close();
  });
} finally {
  await browser.close();
}

await mkdir(path.dirname(outFile), { recursive: true });
const report = {
  createdAt: new Date().toISOString(),
  base,
  note: "Browser requests to /api/analytics/cta were intercepted and replied 204. This proves client-side event behavior only, not backend production logging or exchange registrations.",
  records,
  failures,
};
await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  base,
  records: records.map((record) => ({ name: record.name, eventCount: record.eventCount })),
  failures: failures.map((failure) => ({ name: failure.name, message: failure.message })),
  outFile,
}, null, 2));

if (failures.length) process.exitCode = 1;
