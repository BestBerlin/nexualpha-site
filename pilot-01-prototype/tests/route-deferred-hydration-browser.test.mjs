import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test, { after, before } from "node:test";

const require = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
const puppeteer = require("puppeteer-core");

const baseUrl = process.env.ROUTE_HYDRATION_BASE_URL || "http://127.0.0.1:4303";
const chromeExecutablePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let browser;

const noScriptRoutes = [
  {
    name: "exchange detail",
    path: "/exchanges/binance?locale=en",
    h1: /Binance fees, referral code 11350287 and rebate/,
    hrefs: [
      "/compare/binance-vs-okx",
      "/rates?product=spot",
      "https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy",
    ],
  },
  {
    name: "news list",
    path: "/news?locale=en",
    h1: /Market News & Exchange Research Reports/,
    hrefs: [
      "/compare/binance-vs-okx?product=spot",
      "/factbook/binance?product=spot#rates",
      "/news/how-to-create-backpack-exchange-account-complete-kyc-and-secure-first-funding",
    ],
  },
  {
    name: "methodology",
    path: "/methodology?locale=en",
    h1: /NexuAlpha Rating Methodology & Data Audit Framework/,
    hrefs: [
      "/research/perp-dex-cost-field-dictionary.json",
      "/research/regional-funding-verification-matrix.csv",
      "/methodology#disclosure",
    ],
  },
  {
    name: "partners",
    path: "/partners?locale=en",
    h1: /Add NexuAlpha fee tools to your site or research portal/,
    hrefs: ["/embed/calculator", "/onchain", "https://t.me/NexuAlphaAssistantBot?start=partner_desk_l_en_t_spot"],
  },
  {
    name: "rates",
    path: "/rates?locale=en",
    h1: /Crypto Exchange Fee Benchmark Terminal/,
    hrefs: [
      "https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy",
      "https://partner.bitget.cafe/bg/C6PRAF",
      "https://backpack.exchange/join/luckybitcoin",
    ],
  },
  {
    name: "onchain",
    path: "/onchain?locale=en",
    h1: /Verify on-chain flows before treating a venue as safer/,
    hrefs: ["/exchanges", "/methodology", "/partners"],
  },
  {
    name: "factbook",
    path: "/factbook/binance?locale=en",
    h1: /Binance Source Review Factbook/,
    hrefs: [
      "/factbook/bitget",
      "/exchanges/binance#registration-path",
      "https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy",
    ],
  },
  {
    name: "comparison",
    path: "/compare/binance-vs-okx?locale=en",
    h1: /Binance vs OKX/,
    hrefs: [
      "/exchanges/binance",
      "/exchanges/okx",
      "https://www.okx.com/join/nexu888",
    ],
  },
];

before(async () => {
  browser = await puppeteer.launch({
    executablePath: chromeExecutablePath,
    headless: true,
    args: ["--no-first-run", "--no-default-browser-check"],
  });
});

after(async () => {
  await browser?.close();
});

function urlFor(path) {
  return new URL(path, baseUrl).href;
}

async function deferredHydrationBootstrapForTest(moduleSource) {
  const workerSource = await readFile(new URL("../worker/index.js", import.meta.url), "utf8");
  const match = workerSource.match(/`<script data-nexualpha-deferred-hydration>[\s\S]*?<\/script>`/);
  assert.ok(match, "deferred hydration bootstrap should exist in worker source");
  const moduleUrl = `data:text/javascript,${encodeURIComponent(moduleSource)}`;
  return match[0]
    .replace(/^`<script data-nexualpha-deferred-hydration>/, "")
    .replace(/<\/script>`$/, "")
    .replace("const s=${safeJson(src)};", `const s=${JSON.stringify(moduleUrl)};`);
}

function compactText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

async function criticalBrowserErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
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

async function openPage(path, options = {}) {
  const page = await browser.newPage();
  if (options.javaScriptEnabled === false) await page.setJavaScriptEnabled(false);
  const errors = await criticalBrowserErrors(page);
  const response = await page.goto(urlFor(path), { waitUntil: "domcontentloaded", timeout: 30000 });
  assert.equal(response.status(), 200, `${path} should load`);
  await page.waitForSelector("h1, main", { timeout: 10000 });
  return { page, errors };
}

test("homepage defers the main application until the first button interaction", async () => {
  const html = await fetch(urlFor("/")).then((response) => response.text());
  assert.match(html, /data-nexualpha-deferred-hydration/);
  assert.doesNotMatch(html, /<script\b[^>]*type="module"/);
  assert.doesNotMatch(html, /rel="modulepreload"/);

  const { page, errors } = await openPage("/");
  const jsRequests = [];
  page.on("requestfinished", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (/^\/assets\/.*\.js$/.test(pathname)) jsRequests.push(pathname);
  });

  const initialModuleCount = await page.evaluate(() => [...document.scripts].filter((script) => script.type === "module").length);
  assert.equal(initialModuleCount, 0);

  await clickButtonContaining(page, "Search platforms");
  await page.waitForFunction(() => Boolean(document.querySelector('[role="dialog"], .search-dialog, .command-palette')), { timeout: 10000 });

  assert.ok(jsRequests.some((pathname) => /\/assets\/index-.*\.js$/.test(pathname)), "first button click should load the application bundle");
  assert.deepEqual(errors.filter((error) => /hydration|Minified React|Uncaught|does not match/i.test(error)), []);
  await page.close();
});


test("deferred hydration replays a first click/change after import but before React hydration", async () => {
  const page = await browser.newPage();
  const script = await deferredHydrationBootstrapForTest(`
    window.__imported = true;
    const oldButton = document.querySelector('button[aria-controls="venues"]');
    const newButton = document.createElement('button');
    newButton.setAttribute('aria-controls', 'venues');
    newButton.textContent = oldButton.textContent;
    newButton.addEventListener('click', () => { window.__buttonClicks = (window.__buttonClicks || 0) + 1; });
    oldButton.replaceWith(newButton);

    const oldSelect = document.querySelector('select[name="market"]');
    const newSelect = document.createElement('select');
    newSelect.setAttribute('name', 'market');
    for (const value of ['a', 'b']) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      newSelect.appendChild(option);
    }
    newSelect.addEventListener('change', () => { window.__selectChanges = (window.__selectChanges || 0) + 1; });
    oldSelect.replaceWith(newSelect);

    setTimeout(() => {
      document.documentElement.dataset.nexualphaHydrated = 'true';
      window.dispatchEvent(new Event('nexualpha:hydrated'));
    }, 60);
  `);

  await page.setContent(`<!doctype html><html><body>
    <button aria-controls="venues">عرض كل المنصات (24)</button>
    <select name="market"><option value="a">a</option><option value="b">b</option></select>
    <script>${script}</script>
  </body></html>`, { waitUntil: 'domcontentloaded' });

  await page.click('button[aria-controls="venues"]');
  await page.waitForFunction(() => window.__buttonClicks === 1, { timeout: 5000 });
  await page.select('select[name="market"]', 'b');
  await page.waitForFunction(() => window.__selectChanges === 1 && document.querySelector('select[name="market"]')?.value === 'b', { timeout: 5000 });

  const result = await page.evaluate(() => ({
    imported: window.__imported === true,
    hydrated: document.documentElement.dataset.nexualphaHydrated,
    buttonClicks: window.__buttonClicks || 0,
    selectChanges: window.__selectChanges || 0,
  }));

  assert.deepEqual(result, { imported: true, hydrated: 'true', buttonClicks: 1, selectChanges: 1 });
  await page.close();
});


test("news list preloads the compact feed while keeping hydration deferred", async () => {
  const html = await fetch(urlFor("/news?locale=zh-Hans")).then((response) => response.text());
  assert.match(html, /data-nexualpha-deferred-hydration/);
  assert.match(html, /<link rel="preload" href="\/content\/news-feed-page-1\.zh-Hans\.json" as="fetch" crossorigin \/>/);
});

for (const route of noScriptRoutes) {
  test(`${route.name} exposes critical decision links without JavaScript`, async () => {
    const { page } = await openPage(route.path, { javaScriptEnabled: false });
    const snapshot = await page.evaluate(() => ({
      h1: document.querySelector("h1")?.textContent || "",
      hrefs: [...document.querySelectorAll("a[href]")].map((anchor) => anchor.getAttribute("href")),
      bodyText: document.body.innerText || "",
    }));

    assert.match(compactText(snapshot.h1), route.h1);
    assert.ok(compactText(snapshot.bodyText).length > 500, `${route.path} should expose readable body copy without JavaScript`);
    for (const href of route.hrefs) {
      assert.ok(snapshot.hrefs.includes(href), `${route.path} should expose ${href}`);
    }
    await page.close();
  });
}

test("news list first interaction reveals another page of articles", async () => {
  const { page, errors } = await openPage("/news?locale=en");
  const before = await page.evaluate(() => document.querySelectorAll(".news-article-card, article").length);

  await clickButtonContaining(page, "Show more articles");
  await page.waitForFunction((count) => document.querySelectorAll(".news-article-card, article").length > count, { timeout: 10000 }, before);

  const after = await page.evaluate(() => document.querySelectorAll(".news-article-card, article").length);
  assert.ok(after > before, `article cards should increase from ${before}`);
  assert.deepEqual(errors.filter((error) => /hydration|Minified React|Uncaught|does not match/i.test(error)), []);
  await page.close();
});

test("factbook first interaction opens the raw markdown preview", async () => {
  const { page, errors } = await openPage("/factbook/binance?locale=en");

  await clickButtonContaining(page, "View Raw LLM Markdown Data");
  await page.waitForSelector("pre", { timeout: 10000 });

  const previewText = await page.$eval("pre", (element) => element.innerText);
  assert.match(previewText, /^# NexuAlpha Source Review Factbook: Binance/);
  assert.deepEqual(errors.filter((error) => /hydration|Minified React|Uncaught|does not match/i.test(error)), []);
  await page.close();
});

test("partners first interaction copies the embed code state", async () => {
  const { page, errors } = await openPage("/partners?locale=en");

  await clickButtonContaining(page, "Copy code");
  await page.waitForFunction(() => document.body.innerText.includes("Copied to clipboard"), { timeout: 10000 });

  assert.deepEqual(errors.filter((error) => /hydration|Minified React|Uncaught|does not match/i.test(error)), []);
  await page.close();
});

test("rates first interaction updates the platform filter", async () => {
  const { page, errors } = await openPage("/rates?locale=en");

  await clickButtonContaining(page, "Perp DEX");
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((button) => {
    return (button.innerText || "").includes("Perp DEX") && /\bactive\b/.test(button.className || "");
  }), { timeout: 10000 });

  assert.deepEqual(errors.filter((error) => /hydration|Minified React|Uncaught|does not match/i.test(error)), []);
  await page.close();
});

test("comparison first interaction opens the additional FAQ entries", async () => {
  const { page, errors } = await openPage("/compare/binance-vs-okx?locale=en");

  const hiddenBefore = await page.evaluate(() => document.querySelectorAll(".v3-faq-item[hidden]").length);
  assert.ok(hiddenBefore > 0, "comparison FAQ should SSR-render additional hidden questions before expansion");
  const clicked = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((candidate) => {
      const text = (candidate.innerText || candidate.textContent || "").replace(/\s+/g, " ").trim();
      return /^Show \d+ more questions\b/.test(text);
    });
    if (!button) return false;
    button.scrollIntoView({ block: "center", inline: "center" });
    button.click();
    return true;
  });
  assert.equal(clicked, true, "button containing the current FAQ expansion count should exist");
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((button) => {
    return (button.innerText || "").includes("Show fewer questions") && button.getAttribute("aria-expanded") === "true";
  }), { timeout: 10000 });
  const hiddenAfter = await page.evaluate(() => document.querySelectorAll(".v3-faq-item[hidden]").length);
  assert.equal(hiddenAfter, 0, "comparison FAQ expansion should reveal every additional question");

  assert.deepEqual(errors.filter((error) => /hydration|Minified React|Uncaught|does not match/i.test(error)), []);
  await page.close();
});
