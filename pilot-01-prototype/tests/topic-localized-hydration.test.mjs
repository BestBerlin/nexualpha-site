import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";

const require = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
const puppeteer = require("puppeteer-core");
const chromeExecutablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const noKycTitles = JSON.parse(readFileSync(new URL("./fixtures/no-kyc-titles.json", import.meta.url), "utf8"));

function stripHtml(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractFirst(pattern, html) {
  return stripHtml(html.match(pattern)?.[1] || "");
}

async function startPreview(port) {
  const child = spawn(process.execPath, ["server/local-sites-preview.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let buffer = "";
  const onData = (chunk) => {
    buffer += chunk.toString();
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  while (!buffer.includes(`http://127.0.0.1:${port}`)) {
    if (child.exitCode !== null) throw new Error(`preview exited early: ${buffer}`);
    await Promise.race([
      once(child.stdout, "data"),
      once(child.stderr, "data"),
      new Promise((resolve) => setTimeout(resolve, 100)),
    ]);
  }
  return child;
}

test("Korean and Turkish no-KYC topic SSR and hydration keep the no-KYC title", async (t) => {
  const port = 4300 + (process.pid % 2000);
  const base = `http://127.0.0.1:${port}`;
  const preview = await startPreview(port);
  t.after(() => {
    preview.kill("SIGTERM");
  });

  const browser = await puppeteer.launch({ executablePath: chromeExecutablePath, headless: true });
  t.after(async () => {
    await browser.close();
  });

  const cases = [
    {
      path: "/ko/topics/no-kyc",
      // Class b: MEXC is now the KYC exchange contrast, not part of the no-KYC set.
      h1: noKycTitles.ko,
      subtitle: /지갑 연결, 계정 가입, 본인확인 가능성/,
      blockedH1: /밈 코인 거래를 위한 암호화폐 플랫폼 가이드/,
    },
    {
      path: "/tr/topics/no-kyc",
      // Class b: MEXC is now the KYC exchange contrast, not part of the no-KYC set.
      h1: noKycTitles.tr,
      subtitle: /Cüzdan bağlantısı, hesap kaydı, kimlik kontrolü olasılığı/,
      blockedH1: /Meme coin işlemleri için kripto platform rehberi/,
    },
  ];

  for (const item of cases) {
    const response = await fetch(`${base}${item.path}`, { headers: { accept: "text/html" } });
    const html = await response.text();
    const ssrH1 = extractFirst(/<h1[^>]*>([\s\S]*?)<\/h1>/, html);
    const ssrSubtitle = extractFirst(/<p class="topic-header__subtitle">([\s\S]*?)<\/p>/, html);
    const state = html.match(/id="nexualpha-prerender-state"[^>]*>([\s\S]*?)<\/script>/)?.[1] || "";

    assert.equal(response.status, 200, item.path);
    assert.equal(ssrH1, item.h1, `${item.path} SSR H1`);
    assert.match(ssrSubtitle, item.subtitle, `${item.path} SSR subtitle`);
    assert.doesNotMatch(ssrH1, item.blockedH1, `${item.path} SSR H1 must not use meme copy`);
    assert.match(state, /"pathname":"\/topics\/no-kyc"/, `${item.path} prerender state pathname`);

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 3 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`${base}${item.path}`, { waitUntil: "networkidle2" });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const hydrated = await page.evaluate(() => ({
      h1: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() || "",
      subtitle: document.querySelector(".topic-header__subtitle")?.textContent?.replace(/\s+/g, " ").trim() || "",
      disclosureOpenCount: [...document.querySelectorAll(".topic-disclosure")].filter((node) => node.open).length,
      disclosureCount: document.querySelectorAll(".topic-disclosure").length,
    }));
    await page.close();

    assert.equal(hydrated.h1, item.h1, `${item.path} hydrated H1`);
    assert.equal(hydrated.h1, ssrH1, `${item.path} SSR and hydration H1`);
    assert.match(hydrated.subtitle, item.subtitle, `${item.path} hydrated subtitle`);
    assert.doesNotMatch(hydrated.h1, item.blockedH1, `${item.path} hydrated H1 must not use meme copy`);
    assert.equal(hydrated.disclosureOpenCount, 0, `${item.path} mobile disclosures collapse after hydration`);
    assert.ok(hydrated.disclosureCount > 0, `${item.path} renders topic disclosures`);
    assert.deepEqual(errors.filter((error) => /hydration|Minified React error #418|does not match/i.test(error)), [], `${item.path} mobile hydration errors`);
  }
});


test("Korean and Turkish no-KYC topic mobile hard navigations keep hydration clean on one page", async (t) => {
  const port = 4500 + (process.pid % 2000);
  const base = `http://127.0.0.1:${port}`;
  const preview = await startPreview(port);
  t.after(() => {
    preview.kill("SIGTERM");
  });

  const browser = await puppeteer.launch({ executablePath: chromeExecutablePath, headless: true });
  t.after(async () => {
    await browser.close();
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 3 });
  const events = [];
  page.on("pageerror", (error) => events.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") events.push(message.text());
  });

  const journeys = [
    // Class b: MEXC is now the KYC exchange contrast, not part of the no-KYC set.
    ["/ko/topics/no-kyc", noKycTitles.ko],
    ["/tr/topics/no-kyc", noKycTitles.tr],
    ["/ko/topics/no-kyc", noKycTitles.ko],
    ["/tr/topics/no-kyc", noKycTitles.tr],
  ];

  for (const [path, expectedH1] of journeys) {
    const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle2" });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const current = await page.evaluate(() => ({
      path: location.pathname,
      h1: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() || "",
      disclosureOpenCount: [...document.querySelectorAll(".topic-disclosure")].filter((node) => node.open).length,
    }));
    assert.equal(response.status(), 200, `${path} HTTP status`);
    assert.equal(current.h1, expectedH1, `${path} hydrated H1 after same-page mobile navigation`);
    assert.equal(current.disclosureOpenCount, 0, `${path} mobile disclosure state after settle`);
  }

  await page.close();

  assert.deepEqual(
    events.filter((error) => /hydration|Minified React error #418|does not match/i.test(error)),
    [],
    "same-page mobile hard navigation hydration errors"
  );
});
