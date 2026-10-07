import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import test, { after, before } from "node:test";

const require = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
const puppeteer = require("puppeteer-core");

const baseUrl = process.env.ROUTE_CSS_BASE_URL || "http://127.0.0.1:4304";
const chromeExecutablePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const artifactDir = process.env.ROUTE_CSS_ARTIFACT_DIR || "artifacts/continuous-optimization-wave4";

const allRouteStylePrefixes = [
  "route-activity-",
  "route-embed-",
  "route-factbook-",
  "route-international-",
  "route-kol-",
  "route-market-",
  "route-methodology-",
  "route-news-",
  "route-onchain-",
  "route-partners-",
  "route-rates-",
  "route-telegram-",
  "route-topic-guide-",
  "route-tokenized-assets-",
  "route-v3-calculators-",
  "route-v3-home-",
  "route-v3-pages-",
  "route-v3-registration-",
  "route-v3-social-proof-",
  "route-v3-wizard-",
];

const sharedCss = ["index-", "shared-decision-rail-", "shared-decision-return-"];

const routeCases = [
  {
    name: "home",
    path: "/?locale=en",
    requiredCss: [
      ...sharedCss,
      "route-v3-home-",
      "route-v3-wizard-",
      "route-v3-pages-",
      "route-v3-calculators-",
      "route-v3-social-proof-",
      "route-international-",
      "route-rates-",
      "route-activity-",
      "route-onchain-",
      "route-telegram-",
      "route-market-",
    ],
    selectors: [".crossroads__card", ".br-entry-link"],
  },
  {
    name: "bitget venue",
    path: "/exchanges/bitget?locale=en",
    requiredCss: [...sharedCss, "route-v3-pages-", "route-v3-registration-", "route-activity-"],
    selectors: [".v3-venue-rebate-card", ".registration-card"],
    textSelectors: [".official-research-teaser"],
  },
  {
    name: "hyperliquid venue handoff",
    path: "/exchanges/hyperliquid?locale=en",
    requiredCss: [...sharedCss, "route-v3-pages-", "route-v3-registration-", "route-activity-"],
    selectors: [".v3-onsite-telegram-handoff"],
  },
  {
    name: "uniswap venue handoff",
    path: "/exchanges/uniswap?locale=en",
    requiredCss: [...sharedCss, "route-v3-pages-", "route-v3-registration-", "route-activity-"],
    selectors: [".v3-onsite-telegram-handoff"],
  },
  {
    name: "news list",
    path: "/news?locale=en",
    requiredCss: [...sharedCss, "route-news-"],
    selectors: [".news-article-card", ".decision-path-rail"],
  },
  {
    name: "tokenized treasuries article",
    path: "/news/tokenized-treasuries-structure-access-risks?locale=en",
    requiredCss: [...sharedCss, "route-news-"],
    selectors: [".news-detail-container", ".v3-onsite-telegram-handoff"],
  },
  {
    name: "derivatives topic",
    path: "/topics/derivatives?locale=en",
    requiredCss: [...sharedCss, "route-topic-guide-", "route-v3-pages-"],
    selectors: [".topic-guide-page", ".v3-onsite-telegram-handoff"],
  },
  {
    name: "methodology",
    path: "/methodology?locale=en",
    requiredCss: [...sharedCss, "route-methodology-"],
    selectors: [".methodology-page", ".methodology-page__badge"],
  },
  {
    name: "tokenized treasury topic",
    path: "/topics/tokenized-treasuries?locale=en",
    requiredCss: [...sharedCss, "route-tokenized-assets-"],
    selectors: [".tokenized-assets-page", ".tokenized-assets-hero"],
  },
  {
    name: "rates",
    path: "/rates?locale=en",
    requiredCss: [...sharedCss, "route-rates-", "route-activity-"],
    selectors: [".fee-terminal-section", ".decision-path-rail"],
  },
  {
    name: "factbook",
    path: "/factbook/binance?locale=en",
    requiredCss: [...sharedCss, "route-factbook-", "route-activity-"],
    selectors: [".factbook-section", ".decision-path-rail"],
  },
  {
    name: "mx comparar",
    path: "/mx/comparar",
    requiredCss: [...sharedCss, "route-v3-pages-"],
    selectors: [".v3-compare-verdict"],
  },
  {
    name: "mx costos",
    path: "/mx/costos",
    requiredCss: [...sharedCss, "route-rates-", "route-activity-"],
    selectors: [".fee-terminal-section", ".fee-terminal__table-wrapper"],
  },
  {
    name: "mx conta",
    path: "/mx/conta",
    requiredCss: [...sharedCss, "route-v3-pages-"],
    selectors: [".yellow-pages", ".yellow-card"],
  },
  {
    name: "japanese home prefix",
    path: "/ja",
    requiredCss: [
      ...sharedCss,
      "route-v3-home-",
      "route-v3-wizard-",
      "route-v3-pages-",
      "route-v3-calculators-",
      "route-v3-social-proof-",
      "route-international-",
      "route-rates-",
      "route-activity-",
      "route-onchain-",
      "route-telegram-",
      "route-market-",
    ],
    selectors: [".crossroads__card", ".br-entry-link"],
  },
  {
    name: "japanese news redirect",
    path: "/news?locale=ja",
    requiredCss: [...sharedCss, "route-news-"],
    selectors: [".news-article-card", ".decision-path-rail"],
  },
  {
    name: "ref route",
    path: "/ref/bitget?locale=en",
    requiredCss: [...sharedCss, "route-kol-"],
    selectors: [".kol-page"],
    expectedEagerCss: "non-prerender ref fallback keeps eager styles while preserving the KOL route surface",
  },
  {
    name: "arabic bitget venue",
    path: "/exchanges/bitget?locale=ar",
    requiredCss: [...sharedCss, "route-v3-pages-", "route-v3-registration-", "route-activity-"],
    selectors: [".v3-venue-rebate-card", ".registration-card"],
    expectedDirection: "rtl",
  },
];

const homeExpandedSelectors = [
  ".bleed-analyzer-section",
  ".campaign-radar-section",
  ".fee-terminal-section",
  ".decision-path-rail",
  ".onchain-board-section",
  ".tg-hub-section",
  ".sentiment-section",
  ".br-entry-link",
  ".conversion-proof-toast",
];

const viewports = [
  { name: "mobile", width: 390, height: 900 },
  { name: "desktop", width: 1440, height: 1200 },
];

let browser;
const evidence = [];

before(async () => {
  browser = await puppeteer.launch({
    executablePath: chromeExecutablePath,
    headless: "new",
    args: ["--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-networking"],
  });
});

after(async () => {
  await browser?.close();
  await mkdir(artifactDir, { recursive: true });
  await writeFile(join(artifactDir, "route-css-browser.json"), `${JSON.stringify({ baseUrl, checkedAt: new Date().toISOString(), routes: evidence }, null, 2)}\n`);
});

function routeUrl(path) {
  return new URL(path, baseUrl).href;
}

function isSameOrigin(url) {
  return new URL(url).origin === new URL(baseUrl).origin;
}

function cssPrefixFor(filename) {
  if (filename.startsWith("index-")) return "index-";
  return allRouteStylePrefixes.find((prefix) => filename.startsWith(prefix)) || null;
}

function unexpectedCssPrefixes(filenames, allowedPrefixes) {
  return filenames
    .map((filename) => ({ filename, prefix: cssPrefixFor(filename) }))
    .filter(({ prefix }) => prefix && !allowedPrefixes.includes(prefix));
}

async function openRoute(route, viewport = viewports[0]) {
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });

  const failures = [];
  page.on("response", (response) => {
    if (!isSameOrigin(response.url())) return;
    if (response.status() >= 400) {
      failures.push({
        type: "response",
        status: response.status(),
        pathname: new URL(response.url()).pathname,
      });
    }
  });
  page.on("requestfailed", (request) => {
    if (!isSameOrigin(request.url())) return;
    failures.push({
      type: "requestfailed",
      pathname: new URL(request.url()).pathname,
      error: request.failure()?.errorText || "unknown",
    });
  });

  const response = await page.goto(routeUrl(route.path), { waitUntil: "networkidle0", timeout: 30000 });
  assert.equal(response.status(), 200, `${route.name} should load`);
  await page.waitForSelector("main, h1", { timeout: 10000 });
  return { page, failures };
}

async function stylesheetFilenames(page) {
  return page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((link) => new URL(link.href).pathname.split("/").pop())
    .filter((filename) => filename.endsWith(".css")));
}

async function elementStyleSnapshot(page, selector) {
  return page.$eval(selector, (element) => {
    const computed = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      display: computed.display,
      visibility: computed.visibility,
      opacity: Number.parseFloat(computed.opacity),
      backgroundColor: computed.backgroundColor,
      borderRadius: Number.parseFloat(computed.borderRadius) || 0,
      borderWidth:
        Number.parseFloat(computed.borderTopWidth) +
        Number.parseFloat(computed.borderRightWidth) +
        Number.parseFloat(computed.borderBottomWidth) +
        Number.parseFloat(computed.borderLeftWidth),
      paddingBlock: Number.parseFloat(computed.paddingBlockStart) + Number.parseFloat(computed.paddingBlockEnd),
      paddingInline: Number.parseFloat(computed.paddingInlineStart) + Number.parseFloat(computed.paddingInlineEnd),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
    };
  });
}

function assertNoFailures(route, failures) {
  assert.deepEqual(failures, [], `${route.name} should not request missing same-origin assets`);
}

function assertStyledBox(routeName, selector, style) {
  assert.notEqual(style.display, "none", `${routeName} ${selector} should be visible`);
  assert.notEqual(style.visibility, "hidden", `${routeName} ${selector} should not be hidden`);
  assert.ok(style.opacity > 0, `${routeName} ${selector} should be opaque`);
  assert.ok(style.width > 90, `${routeName} ${selector} should have rendered width`);
  assert.ok(style.height > 20, `${routeName} ${selector} should have rendered height`);
  assert.ok(
    style.paddingBlock + style.paddingInline >= 8 ||
      style.borderRadius > 0 ||
      style.borderWidth > 0 ||
      style.backgroundColor !== "rgba(0, 0, 0, 0)",
    `${routeName} ${selector} should expose non-default CSS styling`,
  );
}

async function openHomeDrawers(page) {
  await page.evaluate(() => {
    for (const details of document.querySelectorAll("details.home-analyzer-drawer, details.home-research-drawer, details.platform-matcher__details")) {
      details.open = true;
      details.dispatchEvent(new Event("toggle", { bubbles: true }));
    }
  });
}

async function clickButtonContaining(page, text) {
  const clicked = await page.evaluate((label) => {
    const button = [...document.querySelectorAll("button")].find((candidate) => {
      return (candidate.innerText || candidate.textContent || "").replace(/\s+/g, " ").trim().includes(label);
    });
    if (!button) return false;
    button.scrollIntoView({ block: "center", inline: "center" });
    button.click();
    return true;
  }, text);
  assert.equal(clicked, true, `button containing "${text}" should exist`);
}

for (const route of routeCases) {
  test(`${route.name} keeps only the CSS prefixes required by its route`, async () => {
    const { page, failures } = await openRoute(route);
    assertNoFailures(route, failures);

    const filenames = await stylesheetFilenames(page);
    for (const prefix of route.requiredCss) {
      assert.ok(filenames.some((filename) => filename.startsWith(prefix)), `${route.name} should include ${prefix} CSS`);
    }
    if (route.expectedEagerCss) {
      const eagerRoutePrefixCount = new Set(filenames.map(cssPrefixFor).filter((prefix) => prefix?.startsWith("route-"))).size;
      assert.ok(eagerRoutePrefixCount >= 10, `${route.name} should expose eager fallback route CSS`);
      evidence.push({ route: route.name, check: "css-prefixes-eager-fallback", reason: route.expectedEagerCss, css: filenames });
    } else {
      assert.deepEqual(unexpectedCssPrefixes(filenames, route.requiredCss), [], `${route.name} should not include unrelated route CSS`);
      evidence.push({ route: route.name, check: "css-prefixes", css: filenames });
    }
    await page.close();
  });
}

for (const route of routeCases) {
  for (const selector of route.selectors) {
    test(`${route.name} renders ${selector} with styled geometry`, async () => {
      const { page, failures } = await openRoute(route);
      assertNoFailures(route, failures);

      await page.waitForSelector(selector, { timeout: 10000 });
      const style = await elementStyleSnapshot(page, selector);
      assertStyledBox(route.name, selector, style);
      evidence.push({ route: route.name, check: "styled-geometry", selector, style });
      await page.close();
    });
  }
}

for (const route of routeCases) {
  for (const selector of route.textSelectors || []) {
    test(`${route.name} exposes ${selector} as readable route content`, async () => {
      const { page, failures } = await openRoute(route);
      assertNoFailures(route, failures);

      await page.waitForSelector(selector, { timeout: 10000 });
      const textLength = await page.$eval(selector, (element) => (element.textContent || "").replace(/\s+/g, " ").trim().length);
      assert.ok(textLength > 80, `${route.name} ${selector} should expose readable content`);
      evidence.push({ route: route.name, check: "readable-content", selector, textLength });
      await page.close();
    });
  }
}

test("home expanded conversion drawers keep every deep module styled", async () => {
  const route = routeCases.find((candidate) => candidate.name === "home");
  const { page, failures } = await openRoute(route);
  assertNoFailures(route, failures);
  await openHomeDrawers(page);

  const missing = [];
  const styles = {};
  for (const selector of homeExpandedSelectors) {
    const exists = await page.$(selector);
    if (!exists) {
      missing.push(selector);
      continue;
    }
    styles[selector] = await elementStyleSnapshot(page, selector);
    assertStyledBox(route.name, selector, styles[selector]);
  }
  assert.deepEqual(missing, [], "home expanded drawers should expose all deep conversion modules");
  evidence.push({ route: route.name, check: "expanded-home-modules", selectors: homeExpandedSelectors, styles });
  await page.close();
});

test("home matcher wizard opens with styled modal geometry", async () => {
  const route = routeCases.find((candidate) => candidate.name === "home");
  const { page, failures } = await openRoute(route);
  assertNoFailures(route, failures);

  await clickButtonContaining(page, "30s Matcher Wizard");
  await page.waitForSelector(".wizard-modal", { timeout: 10000 });
  const style = await elementStyleSnapshot(page, ".wizard-modal");
  assertStyledBox(route.name, ".wizard-modal", style);
  evidence.push({ route: route.name, check: "wizard-modal", style });
  await page.close();
});

for (const viewport of viewports) {
  test(`representative routes avoid horizontal overflow on ${viewport.name}`, async () => {
    for (const route of routeCases) {
      const { page, failures } = await openRoute(route, viewport);
      assertNoFailures(route, failures);
      if (route.name === "home") await openHomeDrawers(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `${route.name} should not overflow horizontally on ${viewport.name}; overflow=${overflow}`);
      evidence.push({ route: route.name, check: "horizontal-overflow", viewport: viewport.name, overflow });
      await page.close();
    }
  });
}

test("arabic route preserves RTL reading direction and styled layout", async () => {
  const route = routeCases.find((candidate) => candidate.expectedDirection === "rtl");
  const { page, failures } = await openRoute(route);
  assertNoFailures(route, failures);

  const result = await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body);
    const card = document.querySelector(".v3-venue-rebate-card");
    const cardStyle = card ? getComputedStyle(card) : null;
    return {
      htmlDir: document.documentElement.dir,
      bodyDirection: bodyStyle.direction,
      cardDirection: cardStyle?.direction || null,
      textAlign: cardStyle?.textAlign || null,
    };
  });

  assert.equal(result.htmlDir, "rtl");
  assert.equal(result.bodyDirection, "rtl");
  assert.equal(result.cardDirection, "rtl");
  assert.ok(result.textAlign === "start" || result.textAlign === "right", `Arabic card should align from the reading edge, got ${result.textAlign}`);
  evidence.push({ route: route.name, check: "rtl", result });
  await page.close();
});
